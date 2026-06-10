const { chromium } = require('playwright');

const FRONTEND = process.env.FRONTEND_URL || 'http://127.0.0.1:3005';
const API = process.env.API_BASE || 'http://127.0.0.1:8081';

async function apiLogin() {
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin@rexi.com' }),
  });
  const json = await res.json();
  if (!json.token || !json.user) throw new Error('Login failed: ' + JSON.stringify(json));
  return json;
}

async function main() {
  const auth = await apiLogin();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await page.addInitScript(({ token, user }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }, { token: auth.token, user: auth.user });

  await page.goto(`${FRONTEND}/quan-ly/dashboard`, { waitUntil: 'domcontentloaded' });
  await page.locator('[data-ai-id="button-chatbot-yhoj"], #chatbotBtn').first().click();
  await page.locator('textarea[placeholder*="Nhắn tin"], textarea[placeholder*="Lệnh"]').waitFor({ state: 'visible', timeout: 15000 });
  await page.locator('button:has-text("Rexi Agent"), [data-ai-id="button-chatbot-jdzj"]').first().click();
  await page.locator('textarea[placeholder*="Lệnh"]').waitFor({ state: 'visible', timeout: 15000 });

  const input = page.locator('textarea[placeholder*="Lệnh"]').last();
  await input.fill('bác sĩ minh hôm nay có những ca trực nào');
  await page.locator('[data-ai-id="button-chatbot-5x21"]').last().click();

  const button = page.locator('[data-ai-id="button-agent-suggested-nav"]').last();
  await button.waitFor({ state: 'visible', timeout: 20000 });
  const label = (await button.innerText()).trim();
  const bodyText = await page.locator('#chatWindow').innerText();

  await page.screenshot({ path: 'Frontend/output/chat-evidence/agent-show-all-button.png', fullPage: true });
  await button.click();
  await page.waitForTimeout(1000);

  const result = {
    label,
    hasShowAllText: bodyText.includes('Xem hết') && bodyText.includes('còn 4 dòng'),
    afterUrl: page.url(),
    ok: label.includes('Xem hết lịch làm việc') && page.url().includes('/quan-ly/lich-lam-viec'),
    screenshot: 'Frontend/output/chat-evidence/agent-show-all-button.png',
  };
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
  if (!result.ok) process.exitCode = 1;
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
