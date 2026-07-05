const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const FRONTEND = process.env.FRONTEND_URL || 'http://127.0.0.1:3005';
const API = process.env.API_BASE || 'http://127.0.0.1:8081';
const OUT_DIR = process.env.AUDIT_OUT_DIR || path.join('Frontend', 'output', 'chat-evidence', 'suggestions-full');

const roles = [
  { key: 'guest', label: 'Khách vãng lai', startPath: '/', account: null },
  { key: 'customer', label: 'Khách đăng nhập', startPath: '/khach-hang/dashboard', account: { username: 'testcustomer2', password: 'Password123!' } },
  { key: 'admin', label: 'Admin', startPath: '/quan-ly/dashboard', account: { username: 'admin', password: 'admin@rexi.com' } },
  { key: 'manager', label: 'Quản lý', startPath: '/quan-ly/dashboard', account: { username: 'quanly', password: 'quanly@rexi.com' } },
  { key: 'doctor', label: 'Bác sĩ', startPath: '/quan-ly/dashboard', account: { username: 'bacsi', password: 'bacsi@rexi.com' } },
  { key: 'nurse', label: 'Y tá', startPath: '/quan-ly/dashboard', account: { username: 'yta', password: 'yta@rexi.com' } },
  { key: 'accountant', label: 'Kế toán', startPath: '/quan-ly/dashboard', account: { username: 'ketoan', password: 'ketoan@rexi.com' } },
  { key: 'reception', label: 'Tiếp tân', startPath: '/quan-ly/dashboard', account: { username: 'tieptan', password: 'tieptan@rexi.com' } },
];

async function post(pathname, body, token) {
  const res = await fetch(`${API}${pathname}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: res.status, json };
}

async function login(account) {
  if (!account) return null;
  const result = await post('/api/auth/login', account);
  if (!result.json.token || !result.json.user) throw new Error(`Login failed for ${account.username}: ${JSON.stringify(result)}`);
  return result.json;
}

async function preparePage(browser, role) {
  const auth = await login(role.account);
  const page = await browser.newPage({ viewport: { width: 1366, height: 860 } });
  if (auth) {
    await page.addInitScript(({ token, user, scope }) => {
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      for (const key of Object.keys(sessionStorage)) {
        if (key.startsWith('rexi_standard_chat_history_') || key.startsWith('rexi_agent_chat_history_')) sessionStorage.removeItem(key);
      }
      window.__REXI_AUDIT_SCOPE__ = scope;
    }, { token: auth.token, user: auth.user, scope: role.key });
  } else {
    await page.addInitScript(() => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.clear();
    });
  }
  await page.goto(`${FRONTEND}${role.startPath}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await openChat(page);
  return page;
}

async function openChat(page) {
  const openBtn = page.locator('[data-ai-id="button-chatbot-yhoj"], #chatbotBtn').first();
  await openBtn.waitFor({ state: 'visible', timeout: 20000 });
  await openBtn.click({ force: true });
  await page.locator('#chatWindow').waitFor({ state: 'visible', timeout: 20000 });
}

async function switchMode(page, mode) {
  if (mode === 'agent') {
    await page.locator('button:has-text("Rexi Agent"), [data-ai-id="button-chatbot-jdzj"]').first().click({ force: true });
    await page.locator('[data-ai-id="chat-suggestions-agent"]').waitFor({ state: 'visible', timeout: 15000 });
  } else {
    await page.locator('[data-ai-id="chat-suggestions-standard"]').waitFor({ state: 'visible', timeout: 15000 });
  }
}

async function getMessageSnapshot(page) {
  return page.evaluate(() => {
    const windowEl = document.querySelector('#chatWindow');
    const nodes = [...document.querySelectorAll('.chat-message-user, .chat-message-ai')];
    const lastUser = [...nodes].reverse().find(n => n.classList.contains('chat-message-user'))?.innerText?.trim() || '';
    const lastAi = [...nodes].reverse().find(n => n.classList.contains('chat-message-ai'))?.innerText?.trim() || '';
    return {
      messageCount: nodes.length,
      lastUser,
      lastAi,
      chatTextTail: (windowEl?.innerText || document.body.innerText || '').slice(-2200),
    };
  });
}

async function waitForAnswer(page, beforeCount, mode) {
  const deadline = Date.now() + (mode === 'agent' ? 30000 : 35000);
  let last = await getMessageSnapshot(page);
  while (Date.now() < deadline) {
    await page.waitForTimeout(700);
    last = await getMessageSnapshot(page);
    const lower = last.chatTextTail.toLowerCase();
    const hasLoading = lower.includes('đang suy nghĩ') || lower.includes('đang xử lý') || lower.includes('rexi đang') || lower.includes('typing');
    if (last.messageCount >= beforeCount + 2 && last.lastAi && !hasLoading) return last;
  }
  return last;
}

function assess({ mode, label, prompt, reply, afterUrl, beforeUrl }) {
  const text = `${reply || ''}`.trim();
  const lower = text.toLowerCase();
  const issues = [];
  if (!text || text.length < 12) issues.push('Phản hồi rỗng/quá ngắn');
  if (lower.includes('null') || lower.includes('undefined')) issues.push('Có null/undefined');
  if (lower.includes('không thể kết nối') || lower.includes('api request failed') || lower.includes('gặp lỗi khi gửi') || lower.includes('chưa nhận được phản hồi')) issues.push('Báo lỗi hệ thống');
  if (mode === 'agent' && /^(mở|chuyển|đi tới|vào|xem danh sách|lọc|tìm hóa đơn|xuất excel)/i.test(prompt || '')) {
    const navigated = afterUrl !== beforeUrl || lower.includes('không đủ quyền') || lower.includes('chưa thấy') || lower.includes('đã chuyển') || lower.includes('tôi mở') || lower.includes('mở trang phù hợp');
    if (!navigated) issues.push('Agent nhận lệnh thao tác nhưng không điều hướng/từ chối rõ');
  }
  if (/cấp cứu|hóc|ngộ độc|heimlich/i.test(`${label} ${prompt}`)) {
    if (!/hotline|phòng khám|khẩn|cấp cứu|không gây nôn|sơ cứu|đưa.*khám/i.test(text)) issues.push('Câu y tế nguy cấp chưa có hướng dẫn an toàn rõ');
  }
  if (/bảo mật|phân quyền|dữ liệu/i.test(`${label} ${prompt}`)) {
    if (!/quyền|bảo mật|không|dữ liệu|thông tin/i.test(text)) issues.push('Câu bảo mật/phân quyền trả lời chưa rõ');
  }
  return { ok: issues.length === 0, issues };
}

function safeName(value) {
  return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase().slice(0, 80) || 'item';
}

async function auditMode(page, role, mode) {
  await switchMode(page, mode);
  const selector = '[data-ai-id^=button-chatbot-suggestion-' + mode + '-]';
  const initialCount = await page.locator(selector).count();
  const rows = [];
  for (let i = 0; i < initialCount; i++) {
    let label = 'suggestion-' + (i + 1);
    let beforeUrl = page.url();
    try {
      if (!(await page.locator('#chatWindow').isVisible().catch(() => false))) await openChat(page);
      await switchMode(page, mode);
      const buttons = page.locator(selector);
      await buttons.nth(i).waitFor({ state: 'visible', timeout: 10000 });
      const button = buttons.nth(i);
      label = (await button.innerText({ timeout: 10000 })).trim();
      await button.scrollIntoViewIfNeeded().catch(() => {});
      const before = await getMessageSnapshot(page);
      beforeUrl = page.url();
      await button.click({ force: true });
      const after = await waitForAnswer(page, before.messageCount, mode);
      await page.waitForTimeout(3500);
      const afterUrl = page.url();
      const prompt = after.lastUser;
      const reply = after.lastAi;
      const shotRel = path.join(OUT_DIR, role.key + '-' + mode + '-' + String(i + 1).padStart(2, '0') + '-' + safeName(label) + '.png');
      await page.screenshot({ path: shotRel, fullPage: true, animations: 'disabled', timeout: 10000 }).catch(() => {});
      const quality = assess({ mode, label, prompt, reply, beforeUrl, afterUrl });
      rows.push({ role: role.label, roleKey: role.key, mode, index: i + 1, label, prompt, reply, beforeUrl, afterUrl, screenshot: shotRel, ...quality });
    } catch (err) {
      const shotRel = path.join(OUT_DIR, role.key + '-' + mode + '-' + String(i + 1).padStart(2, '0') + '-' + safeName(label) + '-harness-error.png');
      await page.screenshot({ path: shotRel, fullPage: true, animations: 'disabled', timeout: 10000 }).catch(() => {});
      rows.push({ role: role.label, roleKey: role.key, mode, index: i + 1, label, prompt: '', reply: 'HARNESS_ERROR: ' + (err.message || err), beforeUrl, afterUrl: page.url(), screenshot: shotRel, ok: false, issues: ['Harness lỗi khi đọc/bấm suggestion'] });
    }
  }
  return rows;
}

function writeReports(results) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const jsonPath = path.join(OUT_DIR, 'suggestion-audit-results.json');
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2), 'utf8');
  const lines = [];
  lines.push('# Rexi suggestion UI audit');
  lines.push('');
  lines.push(`Total: ${results.length}`);
  lines.push(`Passed: ${results.filter(r => r.ok).length}`);
  lines.push(`Needs review: ${results.filter(r => !r.ok).length}`);
  lines.push('');
  for (const r of results) {
    lines.push(`## ${r.role} / ${r.mode} / ${r.index}. ${r.label}`);
    lines.push(`- Status: ${r.ok ? 'OK' : 'REVIEW'}${r.issues?.length ? ` (${r.issues.join('; ')})` : ''}`);
    lines.push(`- Prompt: ${r.prompt.replace(/\s+/g, ' ').slice(0, 260)}`);
    lines.push(`- Reply: ${r.reply.replace(/\s+/g, ' ').slice(0, 500)}`);
    lines.push(`- URL: ${r.afterUrl}`);
    lines.push(`- Screenshot: ${r.screenshot}`);
    lines.push('');
  }
  const mdPath = path.join(OUT_DIR, 'suggestion-audit-report.md');
  fs.writeFileSync(mdPath, lines.join('\n'), 'utf8');
  return { jsonPath, mdPath };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];
  try {
    const roleFilter = (process.env.ROLE_FILTER || '').split(',').map(s => s.trim()).filter(Boolean);
    const activeRoles = roleFilter.length ? roles.filter(r => roleFilter.includes(r.key)) : roles;
    for (const role of activeRoles) {
      for (const mode of ['standard', 'agent']) {
        let page;
        try {
          page = await preparePage(browser, role);
          const rows = await auditMode(page, role, mode);
          results.push(...rows);
          console.log(role.label + ' ' + mode + ': ' + rows.filter(r => r.ok).length + '/' + rows.length);
        } catch (err) {
          const message = err.message || String(err);
          results.push({ role: role.label, roleKey: role.key, mode, index: 0, label: 'MODE_HARNESS_ERROR', prompt: '', reply: 'HARNESS_ERROR: ' + message, beforeUrl: page?.url?.() || '', afterUrl: page?.url?.() || '', screenshot: '', ok: false, issues: ['Harness lỗi khi chuẩn bị/chuyển mode'] });
          console.log(role.label + ' ' + mode + ': HARNESS_ERROR ' + message);
        } finally {
          if (page) await page.close().catch(() => {});
          writeReports(results);
        }
      }
    }
  } finally {
    await browser.close();
  }
  const report = writeReports(results);
  const failed = results.filter(r => !r.ok);
  console.log(JSON.stringify({ total: results.length, passed: results.length - failed.length, review: failed.length, report, reviewItems: failed.map(r => ({ role: r.role, mode: r.mode, label: r.label, issues: r.issues, screenshot: r.screenshot })) }, null, 2));
  if (failed.length) process.exitCode = 2;
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
