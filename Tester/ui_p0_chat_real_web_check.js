const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3005';
const outDir = path.resolve(__dirname, '..', 'Frontend', 'output', 'playwright');
fs.mkdirSync(outDir, { recursive: true });

const tests = [
  { id: 1, q: 'chó hóc xương, cứu' },
  { id: 2, q: 'mèo ăn phải bả chó, sùi bọt mép' },
  { id: 3, q: 'chó bị xe tông gãy chân' },
  { id: 4, q: 'test parvo 2 vạch mờ' },
  { id: 5, q: 'cho chó uống paracetamol được không' },
  { id: 6, q: 'bé bị gbc, giờ sao' },
  { id: 7, q: 'chó ói ra máu 5 lần rồi' },
  { id: 8, q: 'mèo con 2 tuần tuổi bỏ ăn, lạnh người' },
  { id: 9, q: 'chó bị rắn cắn sưng chân' },
  { id: 10, q: 'bé co giật liên tục 10p rồi' },
];

async function loginAndOpenChat(page) {
  await page.goto(`${BASE_URL}/dang-nhap`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.getByPlaceholder('Tên đăng nhập').fill('testcustomer2');
  await page.getByPlaceholder('Mật khẩu').fill('Password123!');
  await page.getByRole('button', { name: /Đăng nhập ngay/i }).click();
  await page.waitForURL(/\/khach-hang\/dashboard|\/quan-ly\/dashboard/, { timeout: 30000 });
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
  await page.getByRole('button', { name: /Trợ lý Rexi|Trợ lý/i }).first().click({ force: true });
}

async function sendAndRead(page, prompt) {
  const before = await page.locator('#chatWindow').innerText().catch(() => '');
  const responsePromise = page.waitForResponse((response) => {
    const url = response.url();
    return response.request().method() === 'POST' && url.includes('/api/chat') && !url.includes('/prewarm');
  }, { timeout: 90000 }).catch(() => null);

  const input = page.locator('textarea').first();
  await input.waitFor({ state: 'visible', timeout: 15000 });
  await input.fill(prompt);
  const started = Date.now();
  await page.locator('button[data-ai-id="button-chatbot-5x21"]').click({ force: true });

  const response = await responsePromise;
  let apiBody = '';
  if (response) {
    apiBody = await response.text().catch(() => '');
  }

  const deadline = Date.now() + 90000;
  let text = '';
  while (Date.now() < deadline) {
    text = await page.locator('#chatWindow').innerText().catch(() => '');
    if (text !== before && !/Rexi đang làm việc|đang xử lý|đang suy nghĩ|Đang gửi/i.test(text)) break;
    await page.waitForTimeout(500);
  }
  await page.locator('#chatWindow').evaluate((el) => { el.scrollTop = el.scrollHeight; }).catch(() => {});
  const screenshot = path.join(outDir, `ui-p0-chat-${String(tests.find(t => t.q === prompt)?.id || 0).padStart(2, '0')}.png`);
  await page.locator('#chatWindow').screenshot({ path: screenshot, animations: 'disabled', timeout: 15000 });

  return {
    elapsedMs: Date.now() - started,
    httpStatus: response ? response.status() : null,
    apiBody,
    chatText: text,
    newText: text.startsWith(before) ? text.slice(before.length).trim() : text,
    screenshot,
  };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 980 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await loginAndOpenChat(page);

  const results = [];
  for (const test of tests) {
    const result = await sendAndRead(page, test.q);
    results.push({ ...test, ...result });
    console.log(`CASE ${test.id}: status=${result.httpStatus} elapsed=${result.elapsedMs}ms`);
    console.log(result.newText.replace(/\s+/g, ' ').trim());
  }

  const report = path.join(outDir, 'ui-p0-chat-real-web-report.json');
  fs.writeFileSync(report, JSON.stringify({ baseUrl: BASE_URL, results }, null, 2), 'utf8');
  console.log(JSON.stringify({ report, count: results.length }, null, 2));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
