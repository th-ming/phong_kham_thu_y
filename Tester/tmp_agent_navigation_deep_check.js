const { chromium } = require('playwright');

const FRONTEND = process.env.FRONTEND_URL || 'http://127.0.0.1:3005';
const API = process.env.API_BASE || 'http://127.0.0.1:8081';

async function apiLogin(username, password) {
  const res = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const json = await res.json();
  if (!json.token || !json.user) throw new Error('Login failed: ' + JSON.stringify(json));
  return json;
}

async function openAgent(page) {
  await page.locator('[data-ai-id="button-chatbot-yhoj"], #chatbotBtn').first().click();
  await page.locator('textarea[placeholder*="Nhắn tin"], textarea[placeholder*="Lệnh"]').waitFor({ state: 'visible', timeout: 15000 });
  await page.locator('button:has-text("Rexi Agent"), [data-ai-id="button-chatbot-jdzj"]').first().click();
  await page.locator('textarea[placeholder*="Lệnh"]').waitFor({ state: 'visible', timeout: 15000 });
}

async function send(page, text) {
  const beforeUrl = page.url();
  const beforeActionCount = await page.evaluate(() => window.__agentActions?.length || 0);
  const input = page.locator('textarea[placeholder*="Nhắn tin"], textarea[placeholder*="Lệnh"]').last();
  await input.fill(text);
  await page.locator('[data-ai-id="button-chatbot-5x21"]').last().click();
  await page.waitForTimeout(5200);
  const afterUrl = page.url();
  const newActions = await page.evaluate((n) => (window.__agentActions || []).slice(n), beforeActionCount);
  const bodyTail = await page.evaluate(() => document.body.innerText.slice(-1600));
  return { beforeUrl, afterUrl, actions: newActions, bodyTail };
}

async function main() {
  const cases = [
    { text: 'mở trang hóa đơn', expect: '/quan-ly/hoa-don' },
    { text: 'mở trang khách hàng thú cưng', expect: '/quan-ly/khach-hang-thu-cung' },
    { text: 'mở kho thuốc', expect: '/quan-ly/kho-thuoc' },
    { text: 'mở lịch hẹn', expect: '/quan-ly/lich-hen' },
    { text: 'điều hướng vào trang xếp lịch y tá Mai', expect: '/quan-ly/lich-lam-viec' },
  ];

  const auth = await apiLogin(process.env.UI_USER || 'admin', process.env.UI_PASS || 'admin@rexi.com');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await page.addInitScript(({ token, user }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    window.__agentActions = [];
    window.addEventListener('agent-action', e => window.__agentActions.push(e.detail));
  }, { token: auth.token, user: auth.user });

  await page.goto(`${FRONTEND}/quan-ly/dashboard`, { waitUntil: 'domcontentloaded' });
  await openAgent(page);

  const results = [];
  for (const c of cases) {
    const r = await send(page, c.text);
    const okUrl = r.afterUrl.includes(c.expect);
    const navActions = r.actions.filter(a => String(a?.tag || '').includes('[NAVIGATE:') || a?.actionType === 'NAVIGATE');
    const otherActions = r.actions.filter(a => a?.actionType && a.actionType !== 'NAVIGATE');
    results.push({
      text: c.text,
      expect: c.expect,
      okUrl,
      beforeUrl: r.beforeUrl,
      afterUrl: r.afterUrl,
      bodyTail: r.bodyTail,
      navActions,
      otherActions,
    });
  }

  await page.screenshot({ path: 'Frontend/output/chat-evidence/agent-navigation-deep-check.png', fullPage: true });
  console.log(JSON.stringify({ results }, null, 2));
  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
