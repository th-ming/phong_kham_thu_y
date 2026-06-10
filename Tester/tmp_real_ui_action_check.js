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

async function openChat(page) {
  const openBtn = page.locator('[data-ai-id="button-chatbot-yhoj"], #chatbotBtn').first();
  await openBtn.waitFor({ state: 'visible', timeout: 15000 });
  await openBtn.click();
  await page.locator('textarea[placeholder*="Nhắn tin"], textarea[placeholder*="Lệnh"]').waitFor({ state: 'visible', timeout: 15000 });
}

async function switchToAgent(page) {
  const agentTab = page.locator('button:has-text("Rexi Agent"), [data-ai-id="button-chatbot-jdzj"]').first();
  await agentTab.waitFor({ state: 'visible', timeout: 10000 });
  await agentTab.click();
  await page.locator('textarea[placeholder*="Lệnh"]').waitFor({ state: 'visible', timeout: 10000 });
}

async function sendChat(page, text) {
  const area = page.locator('textarea[placeholder*="Nhắn tin"], textarea[placeholder*="Lệnh"]').last();
  await area.fill(text);
  await page.locator('[data-ai-id="button-chatbot-5x21"]').last().click();
  await page.waitForTimeout(4500);
}

async function main() {
  const auth = await apiLogin(process.env.UI_USER || 'admin', process.env.UI_PASS || 'admin@rexi.com');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const actions = [];
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('REAL_UI_ACTION_EVENT')) actions.push(text);
  });
  await page.addInitScript(({ token, user }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    window.addEventListener('agent-action', e => console.log('REAL_UI_ACTION_EVENT ' + JSON.stringify(e.detail)));
  }, { token: auth.token, user: auth.user });

  await page.goto(`${FRONTEND}/quan-ly/dashboard`, { waitUntil: 'domcontentloaded' });
  await openChat(page);
  await switchToAgent(page);

  const results = [];

  await sendChat(page, 'mở trang hóa đơn');
  await page.waitForTimeout(1500);
  results.push({ test: 'NAVIGATE invoice', ok: page.url().includes('/quan-ly/hoa-don'), url: page.url() });

  await sendChat(page, 'cuộn xuống cuối trang');
  await page.waitForTimeout(1200);
  const scrollY = await page.evaluate(() => window.scrollY || document.documentElement.scrollTop || 0);
  results.push({ test: 'SCROLL bottom', ok: scrollY > 20, scrollY });

  await sendChat(page, 'mở trang dịch vụ');
  await page.waitForTimeout(1800);
  results.push({ test: 'NAVIGATE services', ok: page.url().includes('/quan-ly/dich-vu'), url: page.url() });
  await sendChat(page, 'mở modal thêm dịch vụ mới');
  await page.waitForTimeout(1500);
  await sendChat(page, 'điền tên dịch vụ là Khám da liễu');
  await page.waitForTimeout(1200);
  const fillEvent = actions.find(x => x.includes('input_service_name')) || '';
  const realServiceInputValue = await page.locator('[data-ai-id="input_service_name"]').first().inputValue().catch(() => '');
  results.push({ test: 'FILL service name', ok: realServiceInputValue.includes('Khám da liễu') || fillEvent.includes('SUCCESS'), realServiceInputValue, event: fillEvent.slice(0, 240) });

  const clickEvent = actions.find(x => x.includes('btn_vnpay')) || '';
  results.push({ test: 'CLICK VNPay', ok: false, skipped: 'Needs customer invoice page with payable invoice; not valid in this admin/staff session', event: clickEvent.slice(0, 240) });

  await page.screenshot({ path: 'Frontend/output/chat-evidence/real-ui-action-check.png', fullPage: true });
  console.log(JSON.stringify({ results, actions: actions.slice(-12) }, null, 2));
  await browser.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
