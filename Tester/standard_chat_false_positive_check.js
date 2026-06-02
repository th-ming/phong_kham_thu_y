const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3001';
const outDir = path.resolve(__dirname, '..', 'Frontend', 'output', 'playwright');
fs.mkdirSync(outDir, { recursive: true });

const prompts = [
  { id: '01-bang-gia', text: 'Bảng giá khám tổng quát cho chó bao nhiêu tiền?' },
  { id: '02-bac-si-huy', text: 'Bác sĩ Huy hôm nay có lịch trực không?' },
  { id: '03-chon-khoa', text: 'Chọn khoa khám bệnh cho bé mèo thì nên chọn mục nào?' },
  { id: '04-non-bot-trang', text: 'Bé nhà tôi bị nôn bọt trắng, có cần đi cấp cứu không?' },
  { id: '05-huong-dan-thanh-toan', text: 'Tôi muốn xem hướng dẫn thanh toán online thì làm sao?' }
];

async function waitForSettledChat(page) {
  await page.waitForTimeout(1800);
  const busyPatterns = [
    /Rexi đang làm việc/i,
    /đang xử lý/i,
    /đang suy nghĩ/i,
    /Đang gửi/i
  ];
  const deadline = Date.now() + 45000;
  while (Date.now() < deadline) {
    const text = await page.locator('#chatWindow').innerText().catch(() => '');
    if (!busyPatterns.some((pattern) => pattern.test(text))) break;
    await page.waitForTimeout(1200);
  }
  await page.locator('#chatWindow').evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  }).catch(() => {});
}

async function loginAndOpenChat(page) {
  await page.goto(`${BASE_URL}/dang-nhap`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.getByPlaceholder('Tên đăng nhập').fill('admin');
  await page.getByPlaceholder('Mật khẩu').fill('admin@rexi.com');
  await page.getByRole('button', { name: /Đăng nhập ngay/i }).click();
  await page.waitForURL(/\/quan-ly\/dashboard|\/khach-hang\/dashboard/, { timeout: 30000 });
  await page.evaluate(() => {
    for (const key of Object.keys(sessionStorage)) {
      if (key.startsWith('rexi_standard_chat_history_') || key.startsWith('rexi_agent_chat_history_')) {
        sessionStorage.removeItem(key);
      }
    }
  });
  await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.locator('#chatBtn').click({ force: true });
  await page.locator('#chatWindow').waitFor({ state: 'visible', timeout: 15000 });
  await page.locator('button').filter({ hasText: /Trợ lý Rexi|chat/i }).first().click({ force: true });
  await page.waitForTimeout(800);
}

async function sendStandardMessage(page, text) {
  const input = page.locator('textarea').first();
  await input.waitFor({ state: 'visible', timeout: 15000 });
  await input.fill(text);
  const responsePromise = page.waitForResponse((response) => {
    const url = response.url();
    return response.request().method() === 'POST' && url.includes('/api/chat') && !url.includes('/prewarm');
  }, { timeout: 90000 }).catch(() => null);
  await page.locator('button[data-ai-id="button-chatbot-5x21"]').click({ force: true });
  const response = await responsePromise;
  await waitForSettledChat(page);
  return response;
}

async function screenshotChat(page, name) {
  const file = path.join(outDir, name);
  const chatWindow = page.locator('#chatWindow').first();
  await chatWindow.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  }).catch(() => {});
  await page.waitForTimeout(250);
  await chatWindow.screenshot({ path: file, animations: 'disabled', timeout: 15000 });
  return file;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const shots = [];
  const apiResponses = [];

  for (const prompt of prompts) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 980 }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/api/chat') && !url.includes('/prewarm')) {
        try {
          apiResponses.push({ prompt: prompt.text, url, status: response.status(), body: await response.text() });
        } catch (e) {
          apiResponses.push({ prompt: prompt.text, url, status: response.status(), body: String(e) });
        }
      }
    });

    await loginAndOpenChat(page);
    await sendStandardMessage(page, prompt.text);
    shots.push({
      prompt: prompt.text,
      path: await screenshotChat(page, `standard-chat-false-positive-${prompt.id}.png`)
    });
    await context.close();
  }

  const report = path.join(outDir, 'standard-chat-false-positive-report.json');
  fs.writeFileSync(report, JSON.stringify({ baseUrl: BASE_URL, shots, apiResponses }, null, 2), 'utf8');

  console.log(JSON.stringify({ shots, report }, null, 2));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
