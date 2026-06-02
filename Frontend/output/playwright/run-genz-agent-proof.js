const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const outDir = path.resolve(__dirname, "genz-agent-proof");
fs.mkdirSync(outDir, { recursive: true });

const baseUrl = process.env.REXI_BASE_URL || "http://127.0.0.1:3001";

const cases = [
  {
    id: "case-01-chuyen-trang-benh-an",
    prompt: "ê rexi mở trang hồ sơ bệnh án giùm t phát, lẹ nha",
    expectedPath: "/quan-ly/ho-so-benh-an",
  },
  {
    id: "case-02-chuyen-trang-dich-vu",
    prompt: "za cho t bay qua trang quản lý dịch vụ cái coi",
    expectedPath: "/quan-ly/dich-vu",
  },
  {
    id: "case-03-nhan-nut-them-dich-vu",
    prompt: "ủa bấm hộ t cái nút thêm dịch vụ cái coi, đang gấp á",
    expectedText: "Thêm dịch vụ",
  },
  {
    id: "case-04-doi-form-khong-luu",
    prompt: "ô kê đổi tên dịch vụ thành Test GenZ Rexi đi, sai tên r á",
    expectedValue: "Test GenZ Rexi",
  },
  {
    id: "case-05-mo-hoa-don",
    prompt: "ui thui lạc trôi r, mở trang hóa đơn thanh toán cho t xem phát",
    expectedPath: "/quan-ly/hoa-don",
  },
];

async function screenshot(page, name) {
  const file = path.join(outDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

async function login(page) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => {});
  await page.evaluate(() => {
    localStorage.setItem("token", "ui-agent-proof-token");
    localStorage.setItem("user", JSON.stringify({
      ten_dang_nhap: "admin@rexi.com",
      email: "admin@rexi.com",
      ho_ten: "Admin Rexi UI Proof",
      displayName: "Admin Rexi UI Proof",
      role: "ADMIN",
      loai_tai_khoan: "ADMIN",
      id_vai_tro: "VT-ADMIN",
      id_nhan_vien: "NV-UI-PROOF"
    }));
  });
  await page.goto(`${baseUrl}/quan-ly/dashboard`, { waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(5000);
  await screenshot(page, "00-local-admin-session");
}

async function openAgent(page) {
  const chatBtn = page.locator('[data-ai-id="button-chatbot-yhoj"], #chatBtn').first();
  await chatBtn.waitFor({ state: "visible", timeout: 20000 });
  await chatBtn.click();
  await page.locator('[data-ai-id="button-chatbot-jdzj"]').click();
  await page.locator("#chatWindow textarea, textarea").first().waitFor({ state: "visible", timeout: 20000 });
}

async function sendAgent(page, prompt) {
  const textarea = page.locator("#chatWindow textarea, textarea").last();
  await textarea.fill(prompt);
  await page.locator('[data-ai-id="button-chatbot-5x21"]').click();
  await page.waitForTimeout(1000);
  await page
    .locator('[data-ai-id="chatbot-thought-loader"]')
    .waitFor({ state: "detached", timeout: 45000 })
    .catch(() => {});
  await page.waitForTimeout(2000);
}

async function latestAgentText(page) {
  return await page.evaluate(() => {
    const win = document.querySelector("#chatWindow") || document.body;
    const text = win.innerText || "";
    return text.split("\n").map((s) => s.trim()).filter(Boolean).slice(-20).join("\n");
  });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 } });
  const results = [];
  try {
    await login(page);
    await openAgent(page);
    await screenshot(page, "00-agent-ready");

    for (const testCase of cases) {
      await sendAgent(page, testCase.prompt);
      const currentPath = new URL(page.url()).pathname;
      const visibleText = await latestAgentText(page);
      let value = "";
      if (testCase.expectedValue) {
        value = await page.locator('[data-ai-id="input-quanlydichvu-9ned"], input').first().inputValue().catch(() => "");
      }
      const shot = await screenshot(page, testCase.id);
      results.push({
        id: testCase.id,
        prompt: testCase.prompt,
        url: page.url(),
        currentPath,
        expectedPath: testCase.expectedPath || null,
        expectedText: testCase.expectedText || null,
        expectedValue: testCase.expectedValue || null,
        observedValue: value,
        latestVisibleChatText: visibleText,
        screenshot: shot,
      });
    }
  } finally {
    fs.writeFileSync(path.join(outDir, "results.json"), JSON.stringify(results, null, 2), "utf8");
    await browser.close();
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
