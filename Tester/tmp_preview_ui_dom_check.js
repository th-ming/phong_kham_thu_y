const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const API = process.env.API_BASE || 'http://127.0.0.1:8081';
const BASE = process.env.BASE_URL || 'http://127.0.0.1:3005';
const OUT = path.resolve(__dirname, '..', 'Frontend', 'output', 'chat-evidence', 'preview-ui-dom');
fs.mkdirSync(OUT, { recursive: true });

async function post(pathname, body, token) {
  const res = await fetch(`${API}${pathname}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  return await res.json();
}

async function main() {
  const login = await post('/api/auth/login', { username: 'admin', password: 'admin@rexi.com' });
  const token = login.token;
  if (!token) throw new Error('Login failed: ' + JSON.stringify(login));

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  await page.addInitScript(({ token, user }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }, { token, user: login.user });

  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(2500);

  const chatBubble = page.locator('[data-ai-id="button-chatbot-yhoj"]').first();
  if (await chatBubble.count()) await chatBubble.click();
  await page.waitForTimeout(1000);

  const agentTab = page.locator('[data-ai-id="button-chatbot-jdzj"]').first();
  await agentTab.click();
  await page.waitForTimeout(500);

  const before = await agentTab.evaluate(el => ({ bg: getComputedStyle(el).backgroundColor, color: getComputedStyle(el).color, text: el.textContent?.trim() }));

  const input = page.locator('textarea[data-ai-id="textarea_chatbot_input"], textarea[placeholder*="Nhắn"], textarea[placeholder*="Tin nhắn"], input[placeholder*="Nhắn"]').first();
  await input.fill('đổi màu Rexi Agent ở khung chatbot thành xanh');
  await input.press('Enter');
  await page.waitForTimeout(7000);

  const after = await agentTab.evaluate(el => ({ bg: getComputedStyle(el).backgroundColor, color: getComputedStyle(el).color, text: el.textContent?.trim() }));
  const shot = path.join(OUT, 'rexi-agent-preview.png');
  await page.screenshot({ path: shot, fullPage: true });
  console.log(JSON.stringify({ before, after, shot }, null, 2));
  await browser.close();
}

main().catch(err => { console.error(err); process.exit(1); });
