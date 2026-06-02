const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE_URL = process.env.FRONTEND_URL || "http://localhost:3001";
const OUT_DIR = path.resolve(__dirname, "../Frontend/output/playwright/role-dashboard-capture");

const accounts = [
  { role: "ADMIN", roleCode: "admin", roleId: "VT-ADMIN", label: "admin", username: "admin", password: "admin@rexi.com", dashboard: "/quan-ly/dashboard", name: "Admin Rexi System", staffId: "NV-ADMIN-CHINH" },
  { role: "QUAN_LY", roleCode: "quan_ly", roleId: "VT-QL", label: "quan-ly", username: "quanly", password: "quanly@rexi.com", dashboard: "/quan-ly/dashboard", name: "Quản lý Rexi", staffId: "NV-QL-TEST" },
  { role: "BAC_SI", roleCode: "bac_si", roleId: "VT-BS", label: "bac-si", username: "bacsi", password: "bacsi@rexi.com", dashboard: "/quan-ly/dashboard", name: "Bác sĩ test", staffId: "NV-BS-TEST" },
  { role: "Y_TA", roleCode: "y_ta", roleId: "VT-YT", label: "y-ta", username: "yta", password: "yta@rexi.com", dashboard: "/quan-ly/dashboard", name: "Y tá test", staffId: "NV-YT-TEST" },
  { role: "TIEP_TAN", roleCode: "tiep_tan", roleId: "VT-TT", label: "tiep-tan", username: "tieptan", password: "tieptan@rexi.com", dashboard: "/quan-ly/dashboard", name: "Tiếp tân test", staffId: "NV-TT-TEST" },
  { role: "KE_TOAN", roleCode: "ke_toan", roleId: "VT-KT", label: "ke-toan", username: "ketoan", password: "ketoan@rexi.com", dashboard: "/quan-ly/ke-toan", name: "Kế toán test", staffId: "NV-KT-TEST" },
  { role: "KHACH_HANG", roleCode: "khach_hang", roleId: "VT-5", label: "khach-hang", username: "testcustomer2", password: "Password123!", dashboard: "/khach-hang/dashboard", name: "Khách hàng test", customerId: "KH-TEST-002" },
];

async function login(page, account) {
  await page.goto(`${BASE_URL}/dang-nhap`, { waitUntil: "domcontentloaded" });
  await page.locator('[data-ai-id="input-dangnhapdangky-8dku"]').fill(account.username);
  await page.locator('[data-ai-id="input-dangnhapdangky-h1ru"]').fill(account.password);
  await page.locator('[data-ai-id="button-dangnhapdangky-xgfa"]').click();
  const expected = account.role === "KHACH_HANG" ? /\/khach-hang\/dashboard/ : /\/quan-ly\/dashboard/;
  await page.waitForURL(expected, { timeout: 20000 });
}

async function installFallbackSession(page, account) {
  const user = {
    id_tai_khoan: `TK-${account.role}`,
    ten_dang_nhap: account.username,
    username: account.username,
    ho_ten: account.name,
    displayName: account.name,
    ten_vai_tro: account.role,
    vai_tro: account.roleCode,
    role: account.roleCode,
    roleCode: account.roleCode,
    id_vai_tro: account.roleId,
    loai_tai_khoan: account.role,
    id_nhan_vien: account.staffId,
    id_khach_hang: account.customerId,
    email: `${account.username}@rexi.local`,
  };
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await page.evaluate(({ user }) => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem("token", "codex-local-dashboard-capture-token");
    localStorage.setItem("refreshToken", "codex-local-dashboard-capture-refresh");
    localStorage.setItem("user", JSON.stringify(user));
  }, { user });
}

async function waitForStableDashboard(page) {
  await page.waitForLoadState("domcontentloaded").catch(() => {});
  await page.waitForLoadState("networkidle", { timeout: 2500 }).catch(() => {});
  await page.waitForTimeout(1200);
  await page.locator("body").waitFor({ state: "visible", timeout: 10000 });
}

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const account of accounts) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      deviceScaleFactor: 1,
      locale: "vi-VN",
    });
    const page = await context.newPage();
    const apiFailures = [];
    const consoleIssues = [];

    page.on("response", (response) => {
      const url = response.url();
      if (url.includes("/api/") && response.status() >= 400) {
        apiFailures.push(`${response.status()} ${url}`);
      }
    });
    page.on("console", (message) => {
      if (["error", "warning"].includes(message.type())) {
        consoleIssues.push(`${message.type()}: ${message.text()}`);
      }
    });
    page.on("pageerror", (error) => consoleIssues.push(`pageerror: ${error.message}`));

    const fileName = `${String(results.length + 1).padStart(2, "0")}-${account.label}-dashboard.png`;
    const screenshotPath = path.join(OUT_DIR, fileName);

    try {
      let authMode = "login";
      try {
        await login(page, account);
      } catch (loginError) {
        authMode = `fallback-localStorage: ${String(loginError.message || loginError).split("\n")[0]}`;
        await installFallbackSession(page, account);
      }
      await page.goto(`${BASE_URL}${account.dashboard}`, { waitUntil: "domcontentloaded" });
      await waitForStableDashboard(page);
      await page.screenshot({ path: screenshotPath, fullPage: true });

      results.push({
        role: account.role,
        username: account.username,
        dashboard: account.dashboard,
        finalUrl: page.url(),
        screenshot: screenshotPath,
        status: "captured",
        authMode,
        apiFailures: apiFailures.slice(0, 20),
        consoleIssues: consoleIssues.slice(0, 20),
      });
    } catch (error) {
      await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});
      results.push({
        role: account.role,
        username: account.username,
        dashboard: account.dashboard,
        finalUrl: page.url(),
        screenshot: screenshotPath,
        status: "failed",
        error: String(error.message || error),
        apiFailures: apiFailures.slice(0, 20),
        consoleIssues: consoleIssues.slice(0, 20),
      });
    } finally {
      await context.close();
    }
  }

  await browser.close();
  const reportPath = path.join(OUT_DIR, "report.json");
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), "utf8");
  console.log(JSON.stringify({ outDir: OUT_DIR, reportPath, results }, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
