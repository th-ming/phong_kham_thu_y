const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3001';
const outDir = path.resolve(__dirname, '..', 'Frontend', 'output', 'playwright', 'agent-ai-live-slang');
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 980 }, deviceScaleFactor: 1 });
  const consoleLogs = [];
  page.on('console', msg => consoleLogs.push({ type: msg.type(), text: msg.text() }));
  page.on('pageerror', err => consoleLogs.push({ type: 'pageerror', text: String(err) }));

  await page.goto(`${BASE_URL}/dang-nhap`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.screenshot({ path: path.join(outDir, 'debug-01-login-page.png'), fullPage: false, timeout: 60000 });
  await page.getByPlaceholder('Tên đăng nhập').fill('admin');
  await page.getByPlaceholder('Mật khẩu').fill('admin@rexi.com');
  await page.getByRole('button', { name: /Đăng nhập ngay/i }).click();
  await page.waitForTimeout(8000);
  await page.screenshot({ path: path.join(outDir, 'debug-02-after-login.png'), fullPage: false, timeout: 60000 });
  const stateBefore = await page.evaluate(() => ({
    url: location.href,
    chatBtn: !!document.querySelector('#chatBtn'),
    chatBtnText: document.querySelector('#chatBtn')?.textContent || '',
    chatWindow: !!document.querySelector('#chatWindow'),
    chatWindowDisplay: document.querySelector('#chatWindow') ? getComputedStyle(document.querySelector('#chatWindow')).display : null,
    bodyText: document.body.innerText.slice(0, 1200)
  }));
  await page.locator('#chatBtn').click({ force: true }).catch(e => consoleLogs.push({ type: 'click-error', text: String(e) }));
  await page.waitForTimeout(5000);
  await page.screenshot({ path: path.join(outDir, 'debug-03-after-chat-click.png'), fullPage: false, timeout: 60000 });
  const stateAfter = await page.evaluate(() => ({
    url: location.href,
    chatBtn: !!document.querySelector('#chatBtn'),
    chatWindow: !!document.querySelector('#chatWindow'),
    chatWindowDisplay: document.querySelector('#chatWindow') ? getComputedStyle(document.querySelector('#chatWindow')).display : null,
    bodyText: document.body.innerText.slice(0, 1200)
  }));
  const report = path.join(outDir, 'debug-chat-open-report.json');
  fs.writeFileSync(report, JSON.stringify({ stateBefore, stateAfter, consoleLogs }, null, 2), 'utf8');
  console.log(JSON.stringify({ report, stateBefore, stateAfter }, null, 2));
  await browser.close();
})().catch(e => {
  console.error(e);
  process.exit(1);
});
