const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const FRONTEND = process.env.FRONTEND_URL || 'http://127.0.0.1:3005';
const API = process.env.API_BASE || 'http://127.0.0.1:8081';
const OUT_DIR = path.join('Frontend', 'output', 'chat-evidence', 'suggestions-targeted');

const roles = {
  admin: { label: 'Admin', startPath: '/quan-ly/dashboard', account: { username: 'admin', password: 'admin@rexi.com' } },
  manager: { label: 'Quan ly', startPath: '/quan-ly/dashboard', account: { username: 'quanly', password: 'quanly@rexi.com' } },
  accountant: { label: 'Ke toan', startPath: '/quan-ly/dashboard', account: { username: 'ketoan', password: 'ketoan@rexi.com' } },
  reception: { label: 'Tiep tan', startPath: '/quan-ly/dashboard', account: { username: 'tieptan', password: 'tieptan@rexi.com' } }
};

function norm(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0111/g, 'd')
    .replace(/\u0110/g, 'D')
    .toLowerCase();
}

function noRuntimeError(text) {
  const lower = norm(text);
  return String(text || '').trim().length >= 12
    && !lower.includes('khong the ket noi')
    && !lower.includes('api request failed')
    && !lower.includes('gap loi khi gui')
    && !lower.includes('chua nhan duoc phan hoi')
    && !lower.includes('null')
    && !lower.includes('undefined');
}

function hasAny(text, words) {
  const lower = norm(text);
  return words.some(word => lower.includes(word));
}

const cases = [
  { id: 'admin-standard-system-errors', role: 'admin', mode: 'standard', labelNorm: 'kiem tra loi he thong', labelOut: 'Kiem tra loi he thong', expect: result => noRuntimeError(result.reply) },
  { id: 'admin-agent-appointments-today', role: 'admin', mode: 'agent', labelNorm: 'lich hen hom nay', labelOut: 'Lich hen hom nay', expect: result => noRuntimeError(result.reply) && hasAny(result.reply, ['lich', 'hen', 'hom nay', 'ca']) },
  { id: 'manager-standard-choking-emergency', role: 'manager', mode: 'standard', labelNorm: 'cap cuu hoc di vat', labelOut: 'Cap cuu hoc di vat', expect: result => noRuntimeError(result.reply) && hasAny(result.reply, ['hoc', 'di vat', 'cap cuu', 'so cuu', 'hotline', '0353', 'phong kham', 'dua']) },
  { id: 'accountant-agent-find-invoice', role: 'accountant', mode: 'agent', labelNorm: 'tim hoa don', labelOut: 'Tim hoa don', expect: result => noRuntimeError(result.reply) && (result.afterUrl.includes('/quan-ly/hoa-don') || hasAny(result.reply, ['mo', 'chuyen', 'hoa don'])) },
  { id: 'accountant-agent-revenue-report', role: 'accountant', mode: 'agent', labelNorm: 'bao cao doanh thu', labelOut: 'Bao cao doanh thu', expect: result => noRuntimeError(result.reply) && (result.afterUrl.includes('/quan-ly/bao-cao-thong-ke') || hasAny(result.reply, ['mo', 'chuyen', 'bao cao', 'thong ke', 'doanh thu'])) },
  { id: 'reception-agent-no-show', role: 'reception', mode: 'agent', labelNorm: 'ca khong den', labelOut: 'Ca khong den', expect: result => noRuntimeError(result.reply) && (result.afterUrl.includes('/quan-ly/lich-hen') || hasAny(result.reply, ['mo', 'chuyen', 'loc', 'lich hen', 'khong den', 'da huy'])) }
];

async function post(pathname, body, token) {
  const res = await fetch(API + pathname, {
    method: 'POST',
    headers: Object.assign({ 'Content-Type': 'application/json' }, token ? { Authorization: 'Bearer ' + token } : {}),
    body: JSON.stringify(body)
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: res.status, json };
}

async function login(account) {
  const result = await post('/api/auth/login', account);
  if (!result.json.token || !result.json.user) throw new Error('Login failed for ' + account.username + ': ' + JSON.stringify(result));
  return result.json;
}

async function preparePage(browser, roleKey) {
  const role = roles[roleKey];
  const auth = await login(role.account);
  const page = await browser.newPage({ viewport: { width: 1366, height: 860 } });
  await page.addInitScript(({ token, user }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    sessionStorage.clear();
  }, { token: auth.token, user: auth.user });
  await page.goto(FRONTEND + role.startPath, { waitUntil: 'domcontentloaded', timeout: 45000 });
  const openBtn = page.locator('[data-ai-id=button-chatbot-yhoj], #chatbotBtn').first();
  await openBtn.waitFor({ state: 'visible', timeout: 20000 });
  await openBtn.click({ force: true });
  await page.locator('#chatWindow').waitFor({ state: 'visible', timeout: 20000 });
  return page;
}

async function switchMode(page, mode) {
  if (mode === 'agent') {
    await page.locator('[data-ai-id=button-chatbot-jdzj]').first().click({ force: true });
    await page.locator('[data-ai-id=chat-suggestions-agent]').waitFor({ state: 'visible', timeout: 15000 });
    return;
  }
  await page.locator('[data-ai-id=chat-suggestions-standard]').waitFor({ state: 'visible', timeout: 15000 });
}

async function snapshot(page) {
  return page.evaluate(() => {
    const nodes = [...document.querySelectorAll('.chat-message-user, .chat-message-ai')];
    const lastUserNode = [...nodes].reverse().find(node => node.classList.contains('chat-message-user'));
    const lastAiNode = [...nodes].reverse().find(node => node.classList.contains('chat-message-ai'));
    const chatText = document.querySelector('#chatWindow')?.innerText || document.body.innerText || '';
    return {
      count: nodes.length,
      lastUser: lastUserNode?.innerText?.trim() || '',
      lastAi: lastAiNode?.innerText?.trim() || '',
      tail: chatText.slice(-2500)
    };
  });
}

async function waitForAnswer(page, beforeCount) {
  const deadline = Date.now() + 38000;
  let current = await snapshot(page);
  while (Date.now() < deadline) {
    await page.waitForTimeout(650);
    current = await snapshot(page);
    const lower = norm(current.tail);
    const busy = lower.includes('dang suy nghi') || lower.includes('dang xu ly') || lower.includes('rexi dang') || lower.includes('typing');
    if (current.count >= beforeCount + 2 && current.lastAi && !busy) return current;
  }
  return current;
}

async function runCase(browser, testCase) {
  const page = await preparePage(browser, testCase.role);
  try {
    await switchMode(page, testCase.mode);
    const selector = '[data-ai-id^=button-chatbot-suggestion-' + testCase.mode + '-]';
    const buttons = page.locator(selector);
    const count = await buttons.count();
    let target = null;
    for (let i = 0; i < count; i++) {
      const text = (await buttons.nth(i).innerText()).trim();
      if (norm(text) === testCase.labelNorm) {
        target = buttons.nth(i);
        break;
      }
    }
    if (!target) throw new Error('Suggestion not found: ' + testCase.labelOut);
    const before = await snapshot(page);
    const beforeUrl = page.url();
    await target.scrollIntoViewIfNeeded().catch(() => {});
    await target.click({ force: true });
    const after = await waitForAnswer(page, before.count);
    await page.waitForTimeout(1500);
    const afterUrl = page.url();
    const result = {
      id: testCase.id,
      role: roles[testCase.role].label,
      mode: testCase.mode,
      label: testCase.labelOut,
      prompt: after.lastUser,
      reply: after.lastAi,
      beforeUrl,
      afterUrl
    };
    result.ok = testCase.expect(result);
    result.screenshot = path.join(OUT_DIR, testCase.id + '.png');
    await page.screenshot({ path: result.screenshot, fullPage: true, animations: 'disabled', timeout: 10000 }).catch(() => { result.screenshotError = 'screenshot timeout waiting for fonts'; });
    return result;
  } finally {
    await page.close();
  }
}

function writeReports(results) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const jsonPath = path.join(OUT_DIR, 'targeted-suggestion-results.json');
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), 'utf8');
  const md = ['# Targeted suggestion regression audit', '', 'Passed: ' + results.filter(result => result.ok).length + '/' + results.length, ''];
  for (const result of results) {
    md.push('## ' + (result.ok ? 'OK' : 'FAIL') + ' - ' + result.role + ' / ' + result.mode + ' / ' + result.label);
    md.push('- Prompt: ' + result.prompt.replace(/\s+/g, ' ').slice(0, 260));
    md.push('- Reply: ' + result.reply.replace(/\s+/g, ' ').slice(0, 700));
    md.push('- URL: ' + result.afterUrl);
    md.push('- Screenshot: ' + result.screenshot);
    md.push('');
  }
  const mdPath = path.join(OUT_DIR, 'targeted-suggestion-report.md');
  fs.writeFileSync(mdPath, md.join('\n'), 'utf8');
  return { jsonPath, mdPath };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    for (const testCase of cases) {
      const result = await runCase(browser, testCase);
      results.push(result);
      console.log((result.ok ? 'OK ' : 'FAIL ') + result.role + ' ' + result.mode + ' ' + result.label);
    }
  } finally {
    await browser.close();
  }
  const report = writeReports(results);
  const failed = results.filter(result => !result.ok);
  console.log(JSON.stringify({ total: results.length, passed: results.length - failed.length, failed: failed.length, report, failedItems: failed }, null, 2));
  if (failed.length) process.exitCode = 2;
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

