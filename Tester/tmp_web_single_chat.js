const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3005';
const Q = process.env.CHAT_Q || 'đumi web như con c bố cho 1 sao';
const OUT = path.resolve(__dirname, '..', 'Frontend', 'output', 'chat-evidence');
const SHOT = process.env.SHOT_NAME || 'case-vulgar-1star.png';
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 850 } });
  const replies = [];
  page.on('response', async (res) => {
    const url = res.url();
    if (res.request().method() === 'POST' && url.includes('/api/chat') && !url.includes('/prewarm')) {
      try { const json = await res.json(); replies.push(json.reply || json.response || JSON.stringify(json)); } catch {}
    }
  });
  await page.goto(`${BASE}/dang-nhap`, { waitUntil: 'domcontentloaded', timeout: 40000 });
  await page.getByPlaceholder('Tên đăng nhập').fill('testcustomer2');
  await page.getByPlaceholder('Mật khẩu').fill('Password123!');
  await page.getByRole('button', { name: /đăng nhập/i }).click();
  await page.waitForTimeout(2500);
  await page.mouse.click(1304, 790);
  await page.waitForTimeout(1000);
  const input = page.locator('textarea[data-ai-id="input-chatbot-jmt6"], textarea[placeholder*="Nhắn"], textarea[placeholder*="Tin nhắn"], input[placeholder*="Nhắn"]').first();
  await input.fill(Q);
  await input.press('Enter');
  await page.waitForTimeout(4500);
  const file = path.join(OUT, SHOT);
  await page.screenshot({ path: file, fullPage: true });
  console.log(`QUESTION ${Q}`);
  console.log(`REPLY ${String(replies.at(-1) || '').replace(/\s+/g, ' ').slice(0, 500)}`);
  console.log(`SHOT ${file}`);
  await browser.close();
})();
