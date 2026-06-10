const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3005';
const OUT = path.resolve(__dirname, '..', 'Frontend', 'output', 'chat-evidence');
fs.mkdirSync(OUT, { recursive: true });

const cases = [
  { id: 303, q: 'cho em xin địa chỉ PK để qua khám' },
  { id: 304, q: 'pass qua PK lấy thuốc được không' },
  { id: 30, q: 'review 1 sao cho mày sập tiệm' },
  { id: 212, q: 'sửa SĐT khách KH-01 thành 090x' },
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 850 } });
  const responses = [];
  page.on('response', async (res) => {
    const url = res.url();
    if (res.request().method() === 'POST' && url.includes('/api/chat') && !url.includes('/prewarm')) {
      try {
        const json = await res.json();
        responses.push(json.reply || json.response || JSON.stringify(json));
      } catch {}
    }
  });

  await page.goto(`${BASE}/dang-nhap`, { waitUntil: 'domcontentloaded', timeout: 40000 });
  await page.getByPlaceholder('Tên đăng nhập').fill('testcustomer2');
  await page.getByPlaceholder('Mật khẩu').fill('Password123!');
  await page.getByRole('button', { name: /đăng nhập/i }).click();
  await page.waitForTimeout(2500);

  await page.screenshot({ path: path.join(OUT, 'debug-before-chat.png'), fullPage: true });
  await page.mouse.click(1304, 790);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(OUT, 'debug-after-chat-click.png'), fullPage: true });

  const input = page.locator('textarea[data-ai-id="input-chatbot-jmt6"], textarea[placeholder*="Nhắn"], textarea[placeholder*="Tin nhắn"], input[placeholder*="Nhắn"]').first();
  for (const c of cases) {
    responses.length = 0;
    await input.fill(c.q);
    await input.press('Enter');
    await page.waitForTimeout(4500);
    const file = path.join(OUT, `case-${c.id}.png`);
    await page.screenshot({ path: file, fullPage: true });
    const reply = responses.at(-1) || '';
    console.log(`CASE ${c.id}: ${c.q}`);
    console.log(`REPLY ${String(reply).replace(/\s+/g, ' ').slice(0, 260)}`);
    console.log(`SHOT ${file}`);
  }
  await browser.close();
})();
