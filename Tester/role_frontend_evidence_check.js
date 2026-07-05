const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE_URL = process.env.FRONTEND_URL || "http://localhost:3001";
const API_URL = process.env.API_URL || "http://127.0.0.1:8081";
const OUT_DIR = path.resolve(__dirname, "../Frontend/output/playwright/role-proof");

const accounts = {
  bacSi: { role: "BAC_SI", roleCode: "bac_si", roleId: "VT-BS", username: "bacsi", password: "bacsi@rexi.com", id: "NV-BS-TEST", name: "Bac si test" },
  yTa: { role: "Y_TA", roleCode: "y_ta", roleId: "VT-YT", username: "yta", password: "yta@rexi.com", id: "NV-YT-TEST", name: "Y ta test" },
  tiepTan: { role: "TIEP_TAN", roleCode: "tiep_tan", roleId: "VT-TT", username: "tieptan", password: "tieptan@rexi.com", id: "NV-TT-TEST", name: "Tiep tan test" },
  keToan: { role: "KE_TOAN", roleCode: "ke_toan", roleId: "VT-KT", username: "ketoan", password: "ketoan@rexi.com", id: "NV-KT-TEST", name: "Ke toan test" },
  khachHang: { role: "KHACH_HANG", roleCode: "khach_hang", roleId: "VT-5", username: "testcustomer2", password: "Password123!", id: "KH-TEST-002", name: "Khach hang test" },
};

const cases = [
  { id: "BS01", account: "bacSi", name: "Dashboard bac si", route: "/quan-ly/dashboard", expect: "allow", action: "snapshot" },
  { id: "BS02", account: "bacSi", name: "Kham benh", route: "/quan-ly/kham-benh", expect: "allow", action: "clinicalFill" },
  { id: "BS03", account: "bacSi", name: "Don thuoc", route: "/quan-ly/don-thuoc", expect: "allow", action: "searchOrSnapshot" },
  { id: "BS04", account: "bacSi", name: "Ho so benh an", route: "/quan-ly/ho-so-benh-an", expect: "allow", action: "searchOrSnapshot" },
  { id: "BS05", account: "bacSi", name: "Chan quyen ke toan", route: "/quan-ly/ke-toan", expect: "block", action: "snapshot" },

  { id: "YT01", account: "yTa", name: "Dashboard y ta", route: "/quan-ly/dashboard", expect: "allow", action: "snapshot" },
  { id: "YT02", account: "yTa", name: "Lich hen", route: "/quan-ly/lich-hen", expect: "allow", action: "searchOrSnapshot" },
  { id: "YT03", account: "yTa", name: "Ho so benh an", route: "/quan-ly/ho-so-benh-an", expect: "allow", action: "searchOrSnapshot" },
  { id: "YT04", account: "yTa", name: "Xet nghiem", route: "/quan-ly/xet-nghiem", expect: "allow", action: "searchOrSnapshot" },
  { id: "YT05", account: "yTa", name: "Chan quyen don thuoc", route: "/quan-ly/don-thuoc", expect: "block", action: "snapshot" },

  { id: "TT01", account: "tiepTan", name: "Dashboard tiep tan", route: "/quan-ly/dashboard", expect: "allow", action: "snapshot" },
  { id: "TT02", account: "tiepTan", name: "Quan ly lich hen", route: "/quan-ly/lich-hen", expect: "allow", action: "openCreateAppointment" },
  { id: "TT03", account: "tiepTan", name: "Khach hang thu cung", route: "/quan-ly/khach-hang-thu-cung", expect: "allow", action: "searchCustomer" },
  { id: "TT04", account: "tiepTan", name: "Hoa don", route: "/quan-ly/hoa-don", expect: "allow", action: "searchInvoice" },
  { id: "TT05", account: "tiepTan", name: "Chan quyen ke toan", route: "/quan-ly/ke-toan", expect: "block", action: "snapshot" },

  { id: "KT01", account: "keToan", name: "Dashboard ke toan", route: "/quan-ly/ke-toan", expect: "allow", action: "snapshot" },
  { id: "KT02", account: "keToan", name: "Hoa don", route: "/quan-ly/hoa-don", expect: "allow", action: "searchInvoice" },
  { id: "KT03", account: "keToan", name: "Bao cao thong ke", route: "/quan-ly/bao-cao-thong-ke", expect: "allow", action: "snapshot" },
  { id: "KT04", account: "keToan", name: "Nhap kho", route: "/quan-ly/nhap-kho", expect: "allow", action: "snapshot" },
  { id: "KT05", account: "keToan", name: "Chan quyen kham benh", route: "/quan-ly/kham-benh", expect: "block", action: "snapshot" },

  { id: "KH01", account: "khachHang", name: "Dashboard khach hang", route: "/khach-hang/dashboard", expect: "allow", action: "snapshot" },
  { id: "KH02", account: "khachHang", name: "Dat lich", route: "/khach-hang/dat-lich-hen", expect: "allow", action: "snapshot" },
  { id: "KH03", account: "khachHang", name: "Lich su lich hen", route: "/khach-hang/lich-su-lich-hen", expect: "allow", action: "snapshot" },
  { id: "KH04", account: "khachHang", name: "Hoa don khach hang", route: "/khach-hang/hoa-don-thanh-toan", expect: "allow", action: "snapshot" },
  { id: "KH05", account: "khachHang", name: "Chan route noi bo", route: "/quan-ly/dashboard", expect: "block", action: "snapshot" },
];

function ensureDir() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function login(page, account) {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: account.username, password: account.password }),
  });
  if (!response.ok) {
    throw new Error(`Login failed for ${account.username}: ${response.status} ${await response.text()}`);
  }
  const payload = await response.json();
  const user = {
    ...(payload.user || {}),
    role: payload.user?.role || account.role,
    id_vai_tro: payload.user?.id_vai_tro || account.roleId,
    ten_dang_nhap: payload.user?.ten_dang_nhap || account.username,
    username: account.username,
  };

  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await page.evaluate(({ token, refreshToken, user }) => {
    localStorage.setItem("token", token);
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("user", JSON.stringify(user));
  }, { token: payload.token, refreshToken: payload.refreshToken, user });

  await page.goto(`${BASE_URL}${account.roleCode === "khach_hang" ? "/khach-hang/dashboard" : "/quan-ly/dashboard"}`, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("domcontentloaded").catch(() => {});
  if (account.roleCode === "khach_hang") {
    await dismissCustomerBirthYearGate(page);
    await dismissChatGuide(page);
  }
  await page.waitForTimeout(800);
}

async function dismissCustomerBirthYearGate(page) {
  const birthYearSelect = page.locator('[data-ai-id="select-customerlayout-namsinh"]').first();
  if (!(await birthYearSelect.isVisible().catch(() => false))) return;

  await birthYearSelect.selectOption("1999").catch(async () => {
    await birthYearSelect.selectOption({ index: 1 }).catch(() => {});
  });

  const confirmButton = page.getByRole("button", { name: /xác nhận/i }).first();
  if (await confirmButton.isVisible().catch(() => false)) {
    await confirmButton.click().catch(() => {});
    await birthYearSelect.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
  }
}

async function dismissChatGuide(page) {
  const guide = page.getByText(/TÌNH HUỐNG|GEN Z|LUẬT GIỌNG NÓI ÁP DỤNG/i).first();
  if (!(await guide.isVisible().catch(() => false))) return;

  await page.keyboard.press("Escape").catch(() => {});
  await page.waitForTimeout(300);
  if (!(await guide.isVisible().catch(() => false))) return;

  const closeButton = page.locator('button:has-text("×"), button:has-text("x"), [aria-label*="đóng" i], [aria-label*="close" i]').last();
  if (await closeButton.isVisible().catch(() => false)) {
    await closeButton.click().catch(() => {});
    await guide.waitFor({ state: "hidden", timeout: 3000 }).catch(() => {});
  }
}

async function firstVisible(page, selectors) {
  for (const selector of selectors) {
    const loc = page.locator(selector).first();
    if (await loc.isVisible().catch(() => false)) return loc;
  }
  return null;
}

async function performAction(page, action) {
  if (action === "clinicalFill") {
    const select = page.locator("select").first();
    if (await select.isVisible().catch(() => false)) {
      const count = await select.locator("option").count().catch(() => 0);
      if (count > 1) await select.selectOption({ index: 1 }).catch(() => {});
    }
    const symptom = await firstVisible(page, [
      'textarea[placeholder*="tri"]',
      'input[placeholder*="tri"]',
      'textarea',
    ]);
    if (symptom) await symptom.fill("Test UI: sot nhe, bo an, can theo doi.").catch(() => {});
    return;
  }

  if (action === "searchOrSnapshot") {
    const search = await firstVisible(page, [
      'input[placeholder*="Tìm"]',
      'input[placeholder*="tim"]',
      'input[type="search"]',
      'input:not([type])',
    ]);
    if (search) await search.fill("Trần").catch(() => {});
    await page.waitForTimeout(800);
    return;
  }

  if (action === "searchCustomer") {
    const search = await firstVisible(page, [
      'input[placeholder*="Tìm khách"]',
      'input[placeholder*="số điện thoại"]',
      'input[placeholder*="Tìm"]',
    ]);
    if (search) await search.fill("098").catch(() => {});
    await page.waitForTimeout(800);
    return;
  }

  if (action === "searchInvoice") {
    const search = await firstVisible(page, [
      'input[placeholder*="Tìm mã"]',
      'input[placeholder*="hóa đơn"]',
      'input[placeholder*="Tìm"]',
    ]);
    if (search) await search.fill("HD").catch(() => {});
    await page.waitForTimeout(800);
    return;
  }

  if (action === "openCreateAppointment") {
    const button = await firstVisible(page, [
      'button:has-text("Tạo")',
      'button:has-text("Thêm")',
      'button:has-text("Lịch")',
    ]);
    if (button) await button.click().catch(() => {});
    await page.waitForTimeout(1000);
  }
}

async function classify(page, expectedRoute, expected) {
  const url = page.url();
  const bodyText = (await page.locator("body").innerText().catch(() => "")).toLowerCase();
  const onExpectedRoute = url.includes(expectedRoute);
  const looksBlocked =
    bodyText.includes("không có quyền") ||
    bodyText.includes("khong co quyen") ||
    bodyText.includes("403") ||
    bodyText.includes("truy cập bị từ chối") ||
    bodyText.includes("unauthorized") ||
    bodyText.includes("vui lòng đăng nhập") ||
    bodyText.includes("hãy đăng nhập") ||
    url.includes("/dang-nhap");

  if (expected === "allow") return onExpectedRoute && !looksBlocked ? "Pass" : "Fail";
  return !onExpectedRoute || looksBlocked ? "Pass" : "Fail";
}

async function run() {
  ensureDir();
  const browser = await chromium.launch({ headless: true });
  const results = [];
  const selectedCases = process.env.CASE_FILTER
    ? cases.filter(testCase => process.env.CASE_FILTER.split(",").map(v => v.trim()).includes(testCase.id))
    : cases;

  for (const testCase of selectedCases) {
    const account = accounts[testCase.account];
    const context = await browser.newContext({ viewport: { width: 1440, height: 950 } });
    const page = await context.newPage();
    const errors = [];
    const failedResponses = [];
    page.on("console", (msg) => {
      if (["error", "warning"].includes(msg.type())) errors.push(`${msg.type()}: ${msg.text()}`);
    });
    page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
    page.on("response", (response) => {
      const status = response.status();
      const url = response.url();
      if (status >= 400 && url.includes("/api/")) {
        failedResponses.push(`${status} ${url}`);
      }
    });

    try {
      await login(page, account);
      await page.goto(`${BASE_URL}${testCase.route}`, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("domcontentloaded").catch(() => {});
      await page.waitForTimeout(1200);
      if (account.roleCode === "khach_hang") {
        await dismissCustomerBirthYearGate(page);
        await dismissChatGuide(page);
      }
      await performAction(page, testCase.action);
      if (testCase.id === "KH04") {
        await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => {});
        await page.waitForTimeout(2500);
      } else {
        await page.waitForTimeout(700);
      }

      const status = await classify(page, testCase.route, testCase.expect);
      const bodyText = await page.locator("body").innerText().catch(() => "");
      const fileName = `${testCase.id}-${account.role}-${testCase.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`;
      const screenshot = path.join(OUT_DIR, fileName);
      await page.screenshot({ path: screenshot, fullPage: true });

      results.push({
        id: testCase.id,
        role: account.role,
        username: account.username,
        name: testCase.name,
        route: testCase.route,
        expected: testCase.expect,
        status,
        finalUrl: page.url(),
        screenshot,
        visibleFailure: /THẤT BẠI|Thất bại|Lỗi kết nối|Không thể tải|không thể tải|Không tải được|không tải được|404/.test(bodyText),
        failedResponses: failedResponses.slice(0, 12),
        errors: errors.slice(0, 8),
      });
    } catch (error) {
      const fileName = `${testCase.id}-${account.role}-error.png`;
      const screenshot = path.join(OUT_DIR, fileName);
      await page.screenshot({ path: screenshot, fullPage: true }).catch(() => {});
      results.push({
        id: testCase.id,
        role: account.role,
        username: account.username,
        name: testCase.name,
        route: testCase.route,
        expected: testCase.expect,
        status: "Blocked",
        finalUrl: page.url(),
        screenshot,
        errors: [String(error.message || error)],
      });
    } finally {
      await context.close();
    }
  }

  await browser.close();
  const reportPath = path.join(OUT_DIR, "role_frontend_evidence_report.json");
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2), "utf8");
  console.log(JSON.stringify({ reportPath, results }, null, 2));
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
