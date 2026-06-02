const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE_URL = process.env.FRONTEND_URL || "http://localhost:3001";
const OUT_DIR = path.resolve(__dirname, "../Frontend/output/playwright/dashboard-hover-updates");

const cases = [
  { label: "bac-si-dashboard", username: "bacsi", password: "bacsi@rexi.com", route: "/quan-ly/dashboard", hover: ".clinical-kpi-card" },
  { label: "y-ta-dashboard", username: "yta", password: "yta@rexi.com", route: "/quan-ly/dashboard", hover: ".clinical-kpi-card" },
  { label: "tiep-tan-dashboard", username: "tieptan", password: "tieptan@rexi.com", route: "/quan-ly/dashboard", hover: ".reception-kpi-card" },
  { label: "ke-toan-dashboard", username: "ketoan", password: "ketoan@rexi.com", route: "/quan-ly/ke-toan", hover: ".ketoan-kpi-card" },
  { label: "bao-cao-thong-ke", username: "admin", password: "admin@rexi.com", route: "/quan-ly/bao-cao-thong-ke", hover: ".report-kpi-card" },
  { label: "khach-hang-hoa-don", username: "testcustomer2", password: "Password123!", route: "/khach-hang/hoa-don-thanh-toan", hover: ".customer-kpi-card" },
];

async function login(page, account) {
  await page.goto(`${BASE_URL}/dang-nhap`, { waitUntil: "domcontentloaded" });
  await page.locator('[data-ai-id="input-dangnhapdangky-8dku"]').fill(account.username);
  await page.locator('[data-ai-id="input-dangnhapdangky-h1ru"]').fill(account.password);
  await page.locator('[data-ai-id="button-dangnhapdangky-xgfa"]').click();
  const expected = account.route.startsWith("/khach-hang") ? /\/khach-hang\/dashboard/ : /\/quan-ly\/dashboard/;
  await page.waitForURL(expected, { timeout: 20000 });
}

async function prepareCapture(page) {
  await page.addStyleTag({
    content: `
      .chatbot-container,
      .chatbot-shell,
      .chat-widget,
      .floating-chat,
      .chatbot,
      [class*="chatbot"],
      [class*="Chatbot"],
      [data-ai-id*="chatbot"],
      .modal-overlay,
      .modal-backdrop,
      [class*="onboarding"],
      [class*="Onboarding"] {
        display: none !important;
        pointer-events: none !important;
      }
    `,
  }).catch(() => {});
  await page.keyboard.press("Escape").catch(() => {});
  for (const label of ["Đóng", "close", "Lờ đi", "Bỏ qua"]) {
    const button = page.getByText(label, { exact: false }).first();
    if (await button.isVisible().catch(() => false)) {
      await button.click({ force: true }).catch(() => {});
    }
  }
  await page.evaluate(() => {
    Array.from(document.querySelectorAll("body *")).forEach((element) => {
      const style = getComputedStyle(element);
      const text = element.textContent || "";
      if (style.position === "fixed" && text.includes("Cho Rexi biết năm sinh")) {
        element.remove();
      }
    });
  }).catch(() => {});
}

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];

  for (const item of cases) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1, locale: "vi-VN" });
    const page = await context.newPage();
    const apiFailures = [];
    page.on("response", (response) => {
      if (response.url().includes("/api/") && response.status() >= 400) apiFailures.push(`${response.status()} ${response.url()}`);
    });

    const normalPath = path.join(OUT_DIR, `${item.label}.png`);
    const hoverPath = path.join(OUT_DIR, `${item.label}-hover.png`);
    try {
      await login(page, item);
      await page.goto(`${BASE_URL}${item.route}`, { waitUntil: "domcontentloaded" });
      await prepareCapture(page);
      await page.waitForLoadState("networkidle", { timeout: 4000 }).catch(() => {});
      await page.waitForTimeout(1000);
      await prepareCapture(page);
      await page.screenshot({ path: normalPath, fullPage: true });

      const hoverTarget = page.locator(item.hover).first();
      if (await hoverTarget.isVisible().catch(() => false)) {
        await hoverTarget.hover({ force: true, timeout: 3000 }).catch(async () => {
          await hoverTarget.focus();
        });
        await page.waitForTimeout(500);
        await page.screenshot({ path: hoverPath, fullPage: true });
      }

      results.push({ label: item.label, route: item.route, finalUrl: page.url(), normalPath, hoverPath, apiFailures });
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
