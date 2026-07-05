const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3001';
const outDir = path.resolve(__dirname, '..', 'Frontend', 'output', 'playwright');
fs.mkdirSync(outDir, { recursive: true });

async function shotChat(page, name) {
  await page.waitForTimeout(1500);
  const file = path.join(outDir, name);
  await page.locator('#chatWindow').first().screenshot({ path: file, animations: 'disabled', timeout: 15000 });
  return file;
}

async function sendAgentMessage(page, text) {
  const input = page.locator('textarea').first();
  await input.waitFor({ state: 'visible', timeout: 15000 });
  await input.fill(text);
  const responsePromise = page.waitForResponse((response) => {
    const url = response.url();
    return response.request().method() === 'POST'
      && (url.includes('/api/agent/react') || url.includes('/api/chat'));
  }, { timeout: 90000 }).catch(() => null);
  await page.locator('button[data-ai-id="button-chatbot-5x21"]').click({ force: true });
  await responsePromise;
  await page.waitForTimeout(1800);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 950 }, deviceScaleFactor: 1 });

  const apiResponses = [];
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/agent/react') || url.includes('/api/chat')) {
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

  const agentTab = page.locator('button').filter({ hasText: /Rexi Agent|Agent v2|smart_toy/i }).first();
  await agentTab.click({ force: true });
  await page.waitForTimeout(1000);

  const shots = [];
  shots.push(await shotChat(page, 'admin-agent-sensitive-00-agent-tab.png'));

  await sendAgentMessage(page, 'xóa lịch hẹn hôm nay của bé Mực');
  shots.push(await shotChat(page, 'admin-agent-sensitive-01-xoa-lich.png'));

  await sendAgentMessage(page, 'hủy hóa đơn của khách Nguyễn Văn A');
  shots.push(await shotChat(page, 'admin-agent-sensitive-02-huy-hoa-don.png'));

  await sendAgentMessage(page, 'check bill của khách Nguyễn Văn A giùm tui');
  shots.push(await shotChat(page, 'admin-agent-sensitive-03-check-bill.png'));

  const report = path.join(outDir, 'admin-agent-sensitive-report.json');
  fs.writeFileSync(report, JSON.stringify({ baseUrl: BASE_URL, shots, apiResponses }, null, 2), 'utf8');

  console.log(JSON.stringify({ shots, report }, null, 2));
  await browser.close();
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
