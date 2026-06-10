const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const API = process.env.API_BASE || 'http://127.0.0.1:8081';
const BASE = process.env.BASE_URL || 'http://127.0.0.1:3005';
const OUT = path.resolve(__dirname, '..', 'Frontend', 'output', 'chat-evidence', 'agent-bugfix-evidence');
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
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: res.status, json };
}

async function main() {
  const auth = await post('/api/auth/login', { username: 'admin', password: 'admin@rexi.com' });
  const token = auth.json.token;
  if (!token) throw new Error('Login failed: ' + JSON.stringify(auth));

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  await page.addInitScript(({ token, user }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }, { token, user: auth.json.user });

  await page.goto(BASE, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForTimeout(2500);

  const bubble = page.locator('[data-ai-id="button-chatbot-yhoj"]').first();
  if (await bubble.count()) await bubble.click();
  await page.waitForTimeout(1000);
  await page.locator('[data-ai-id="button-chatbot-jdzj"]').first().click();
  await page.waitForTimeout(700);

  const input = page.locator('textarea[data-ai-id="textarea_chatbot_input"], textarea[placeholder*="Nhắn"], textarea[placeholder*="Tin nhắn"], input[placeholder*="Nhắn"]').first();
  const cases = [
    { id: '01-doctor-shift', question: 'Mở danh sách ca khám hôm nay của bác sĩ' },
    { id: '02-web-search', question: 'Lên mạng tìm tài liệu điều trị mèo bị giảm bạch cầu' },
  ];
  const report = [];

  for (const item of cases) {
    await input.fill(item.question);
    await input.press('Enter');
    await page.waitForTimeout(9000);
    const shot = path.join(OUT, `${item.id}.png`);
    await page.screenshot({ path: shot, fullPage: true });
    const text = await page.locator('body').innerText({ timeout: 5000 });
    report.push({ ...item, shot, contains: text.includes(item.question) });
  }

  const outFile = path.join(OUT, 'report.json');
  fs.writeFileSync(outFile, JSON.stringify(report, null, 2), 'utf8');
  console.log(JSON.stringify({ outDir: OUT, report: outFile, results: report }, null, 2));
  await browser.close();
}

main().catch(err => { console.error(err); process.exit(1); });
