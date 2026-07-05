const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3001';
const outDir = path.resolve(__dirname, '..', 'Frontend', 'output', 'playwright');
fs.mkdirSync(outDir, { recursive: true });

async function waitAndShot(page, name) {
  await page.waitForTimeout(2500);
  const target = page.locator('#chatWindow').first();
  const file = path.join(outDir, name);
  if (await target.count()) {
    await target.screenshot({ path: file, animations: 'disabled', timeout: 15000 });
  } else {
    await page.screenshot({ path: file, fullPage: true, animations: 'disabled' });
  }
  return file;
}

async function sendMessage(page, text) {
  const input = page.locator('textarea').first();
  await input.waitFor({ state: 'visible', timeout: 15000 });
  await input.fill(text);
  const responsePromise = page.waitForResponse((response) => {
    const url = response.url();
    return response.request().method() === 'POST'
      && (url.includes('/api/chat') || url.includes('/api/agent/react'));
  }, { timeout: 70000 }).catch(() => null);
  await page.locator('button[data-ai-id="button-chatbot-5x21"]').click({ force: true });
  await responsePromise;
  await page.waitForTimeout(1200);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 }, deviceScaleFactor: 1 });

  const apiResponses = [];
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/chat') || url.includes('/api/agent/react')) {
      try {
        apiResponses.push({ url, status: response.status(), body: await response.text() });
      } catch (e) {
        apiResponses.push({ url, status: response.status(), body: String(e) });
      }
    }
  });

  await page.goto(`${BASE_URL}/dang-nhap`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.getByPlaceholder('Tên đăng nhập').fill('admin');
  await page.getByPlaceholder('Mật khẩu').fill('admin@rexi.com');
  await page.getByRole('button', { name: /Đăng nhập ngay/i }).click();
  await page.waitForURL(/\/quan-ly\/dashboard|\/khach-hang\/dashboard/, { timeout: 30000 });

  await page.locator('#chatBtn').click({ force: true });
  await page.locator('#chatWindow').waitFor({ state: 'visible', timeout: 15000 });

  const tabAgent = page.locator('button:has-text("Tác vụ Agent v2")');
  if (await tabAgent.count()) {
    await tabAgent.click({ force: true });
    await page.waitForTimeout(700);
  }

  const shots = [];
  await sendMessage(page, 'check bill của khách Nguyễn Văn A giùm tui');
  shots.push(await waitAndShot(page, 'admin-chat-sensitive-final-01-check-bill.png'));

  await sendMessage(page, 'xóa lịch hẹn hôm nay của bé Mực');
  shots.push(await waitAndShot(page, 'admin-chat-sensitive-final-02-xoa-lich.png'));

  await sendMessage(page, 'info acc tui với, sđt khách còn đúng khum?');
  shots.push(await waitAndShot(page, 'admin-chat-sensitive-final-03-info-acc.png'));

  const report = path.join(outDir, 'admin-chat-sensitive-final-report.json');
  fs.writeFileSync(report, JSON.stringify({ baseUrl: BASE_URL, shots, apiResponses }, null, 2), 'utf8');

  console.log(JSON.stringify({ shots, report }, null, 2));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
