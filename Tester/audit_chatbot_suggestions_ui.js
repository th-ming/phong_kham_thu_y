const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:3001";
const outDir = path.resolve(__dirname, "..", "Frontend", "output", "playwright");
fs.mkdirSync(outDir, { recursive: true });

const accounts = [
  { role: "guest", username: null, password: null, expectedStandard: ["Thông tin bác sĩ"], expectedAgent: ["Đăng nhập"] },
  { role: "admin", username: "admin", password: "admin@rexi.com", expectedStandard: ["Khi nào dùng Agent?", "Quy trình phân quyền"], expectedAgent: ["Mở báo cáo thống kê", "Phân quyền"] },
  { role: "quan_ly", username: "quanly", password: "quanly@rexi.com", expectedStandard: ["Điều phối ca khám", "Báo cáo cần có"], expectedAgent: ["Điều phối lịch", "Báo cáo KPI"] },
  { role: "bac_si", username: "bacsi", password: "bacsi@rexi.com", expectedStandard: ["Ưu tiên ca khám", "Ghi bệnh án tốt"], expectedAgent: ["Ca của tôi", "Bệnh án"] },
  { role: "y_ta", username: "yta", password: "yta@rexi.com", expectedStandard: ["Ca cần hỗ trợ", "Chuẩn bị xét nghiệm"], expectedAgent: ["Lịch trực", "Ca hỗ trợ"] },
  { role: "tiep_tan", username: "tieptan", password: "tieptan@rexi.com", expectedStandard: ["Xác nhận lịch", "Check-in"], expectedAgent: ["Chờ xác nhận", "Check-in ca"] },
  { role: "ke_toan", username: "ketoan", password: "ketoan@rexi.com", expectedStandard: ["Đối soát an toàn", "Báo cáo tài chính"], expectedAgent: ["Hóa đơn chờ", "Đối soát"] },
  { role: "khach_hang", username: "testcustomer2", password: "Password123!", expectedStandard: ["Cần đi khám không?", "Sau khi khám"], expectedAgent: ["Mở đặt lịch", "Mở hóa đơn"] },
];

async function login(page, account) {
  if (!account.username) {
    await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
    return;
  }
  await page.goto(`${BASE_URL}/dang-nhap`, { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.getByPlaceholder("Tên đăng nhập").fill(account.username);
  await page.getByPlaceholder("Mật khẩu").fill(account.password);
  await page.getByRole("button", { name: /Đăng nhập ngay/i }).click();
  await page.waitForURL(/\/quan-ly\/|\/khach-hang\//, { timeout: 30000 });
}

async function openChat(page) {
  await page.locator("#chatBtn").click({ force: true, timeout: 15000 });
  await page.locator("#chatWindow").waitFor({ state: "visible", timeout: 15000 });
}

async function collectSuggestions(page, prefix) {
  const shell = page.locator(`[data-ai-id="chat-suggestions-${prefix}"]`);
  await shell.waitFor({ state: "visible", timeout: 15000 });
  return shell.locator("button").evaluateAll((buttons) => buttons.map((button) => button.textContent.trim()).filter(Boolean));
}

function includesAll(actual, expected) {
  return expected.every((item) => actual.includes(item));
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const report = { baseUrl: BASE_URL, testedAt: new Date().toISOString(), rows: [] };

  for (const account of accounts) {
    const context = await browser.newContext({ viewport: { width: 1365, height: 900 } });
    const page = await context.newPage();
    await login(page, account);
    await page.evaluate(() => {
      sessionStorage.clear();
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith("rexi_standard_chat_history_") || key.startsWith("rexi_agent_chat_history_")) {
          localStorage.removeItem(key);
        }
      }
    });
    await page.reload({ waitUntil: "domcontentloaded", timeout: 30000 });
    await openChat(page);
    const standard = await collectSuggestions(page, "standard");
    await page.locator("button").filter({ hasText: /Rexi Agent/i }).first().click({ force: true });
    const agent = await collectSuggestions(page, "agent");
    const row = {
      role: account.role,
      username: account.username,
      standard,
      agent,
      standardOk: includesAll(standard, account.expectedStandard),
      agentOk: includesAll(agent, account.expectedAgent),
    };
    report.rows.push(row);
    console.log(`${row.standardOk && row.agentOk ? "PASS" : "FAIL"} ${account.role}`);
    if (!row.standardOk || !row.agentOk) {
      console.log(JSON.stringify(row, null, 2));
    }
    await context.close();
  }

  report.summary = {
    total: report.rows.length,
    failed: report.rows.filter((row) => !row.standardOk || !row.agentOk).length,
  };
  const file = path.join(outDir, "chatbot-suggestions-ui-report.json");
  fs.writeFileSync(file, JSON.stringify(report, null, 2), "utf8");
  console.log(`REPORT ${file}`);
  await browser.close();
  if (report.summary.failed) process.exitCode = 2;
})();
