const { chromium } = require('playwright');

const FRONTEND = process.env.FRONTEND_URL || 'http://127.0.0.1:3005';
const API = process.env.API_BASE || 'http://127.0.0.1:8081';

const USERS = {
  admin: { username: process.env.ADMIN_USER || 'admin', password: process.env.ADMIN_PASS || 'admin@rexi.com' },
  customer: { username: process.env.CUSTOMER_USER || 'testcustomer2', password: process.env.CUSTOMER_PASS || 'Password123!' },
};

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

async function newLoggedPage(browser, creds, startPath) {
  const auth = await apiLogin(creds.username, creds.password);
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  await page.addInitScript(({ token, user }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    window.__agentActions = [];
    window.addEventListener('agent-action', e => window.__agentActions.push(e.detail));
  }, { token: auth.token, user: auth.user });
  await page.goto(`${FRONTEND}${startPath}`, { waitUntil: 'domcontentloaded' });
  await openAgent(page);
  return page;
}

async function openAgent(page) {
  const openBtn = page.locator('[data-ai-id="button-chatbot-yhoj"], #chatbotBtn').first();
  await openBtn.waitFor({ state: 'visible', timeout: 15000 });
  await openBtn.click();
  await page.locator('textarea[placeholder*="Nhắn tin"], textarea[placeholder*="Lệnh"]').waitFor({ state: 'visible', timeout: 15000 });
  await page.locator('button:has-text("Rexi Agent"), [data-ai-id="button-chatbot-jdzj"]').first().click();
  await page.locator('textarea[placeholder*="Lệnh"]').waitFor({ state: 'visible', timeout: 15000 });
}

async function send(page, text, waitMs = 5600) {
  const beforeUrl = page.url();
  const beforeActionCount = await page.evaluate(() => window.__agentActions?.length || 0);
  const input = page.locator('textarea[placeholder*="Nhắn tin"], textarea[placeholder*="Lệnh"]').last();
  await input.fill(text);
  await page.locator('[data-ai-id="button-chatbot-5x21"]').last().click();
  await page.waitForTimeout(waitMs);
  const actions = await page.evaluate((n) => (window.__agentActions || []).slice(n), beforeActionCount);
  const bodyTail = await page.evaluate(() => document.body.innerText.slice(-1200));
  return { beforeUrl, afterUrl: page.url(), actions, bodyTail };
}

async function testNavigate(page, text, expectPath) {
  const r = await send(page, text);
  return {
    text,
    expect: expectPath,
    ok: r.afterUrl.includes(expectPath),
    afterUrl: r.afterUrl,
    wrongAction: r.actions.some(a => a?.actionType && a.actionType !== 'NAVIGATE'),
    replyTail: r.bodyTail.split(text).pop()?.trim().slice(0, 260) || '',
  };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const results = [];

  const admin = await newLoggedPage(browser, USERS.admin, '/quan-ly/dashboard');
  for (const c of [
    ['mở trang hóa đơn', '/quan-ly/hoa-don'],
    ['mở trang khách hàng thú cưng', '/quan-ly/khach-hang-thu-cung'],
    ['mở kho thuốc', '/quan-ly/kho-thuoc'],
    ['mở lịch hẹn', '/quan-ly/lich-hen'],
    ['mở trang dịch vụ', '/quan-ly/dich-vu'],
    ['điều hướng vào trang xếp lịch y tá Mai', '/quan-ly/lich-lam-viec'],
  ]) {
    results.push({ role: 'admin', kind: 'navigate', ...(await testNavigate(admin, c[0], c[1])) });
  }

  await send(admin, 'mở trang dịch vụ');
  const serviceModal = await send(admin, 'mở modal thêm dịch vụ mới');
  const serviceModalVisible = await admin.locator('[data-ai-id="input_service_name"]').first().isVisible().catch(() => false);
  results.push({ role: 'admin', kind: 'click', text: 'mở modal thêm dịch vụ mới', ok: serviceModalVisible, afterUrl: serviceModal.afterUrl, actions: serviceModal.actions });

  const fillService = await send(admin, 'điền tên dịch vụ là Khám da liễu');
  const serviceValue = await admin.locator('[data-ai-id="input_service_name"]').first().inputValue().catch(() => '');
  results.push({ role: 'admin', kind: 'fill', text: 'điền tên dịch vụ là Khám da liễu', ok: serviceValue.includes('Khám da liễu'), value: serviceValue, actions: fillService.actions });

  await send(admin, 'mở trang khách hàng thú cưng');
  const petModal = await send(admin, 'mở modal thêm thú cưng mới và điền tên bé là Miu, loài mèo');
  const petNameVisible = await admin.locator('[data-ai-id="input_pet_name"]').first().isVisible().catch(() => false);
  const petName = await admin.locator('[data-ai-id="input_pet_name"]').first().inputValue().catch(() => '');
  const petSpecies = await admin.locator('[data-ai-id="select_pet_species"]').first().inputValue().catch(() => '');
  results.push({ role: 'admin', kind: 'click/fill/select', text: 'mở modal thêm thú cưng mới và điền tên bé là Miu, loài mèo', ok: petNameVisible && petName.includes('Miu') && petSpecies === 'Mèo', petName, petSpecies, afterUrl: petModal.afterUrl, actions: petModal.actions });

  await admin.screenshot({ path: 'Frontend/output/chat-evidence/agent-one-touch-admin.png', fullPage: true });
  await admin.close();

  const customer = await newLoggedPage(browser, USERS.customer, '/khach-hang/dashboard');
  for (const c of [
    ['mở trang hóa đơn của tôi', '/khach-hang/hoa-don-thanh-toan'],
    ['mở trang thú cưng của tôi', '/khach-hang/quan-ly-thu-cung'],
    ['mở trang hồ sơ bệnh án', '/khach-hang/ho-so-benh-an'],
    ['mở trang đặt lịch', '/khach-hang/dat-lich-hen'],
  ]) {
    results.push({ role: 'customer', kind: 'navigate', ...(await testNavigate(customer, c[0], c[1])) });
  }
  const denied = await send(customer, 'mở trang quản lý nhân viên');
  results.push({
    role: 'customer',
    kind: 'permission',
    text: 'mở trang quản lý nhân viên',
    ok: !denied.afterUrl.includes('/quan-ly/nhan-vien-phan-quyen') && !denied.afterUrl.includes('/quan-ly/'),
    afterUrl: denied.afterUrl,
    replyTail: denied.bodyTail.split('mở trang quản lý nhân viên').pop()?.trim().slice(0, 260) || '',
  });
  await customer.screenshot({ path: 'Frontend/output/chat-evidence/agent-one-touch-customer.png', fullPage: true });
  await customer.close();

  const failed = results.filter(r => !r.ok);
  console.log(JSON.stringify({ summary: { total: results.length, passed: results.length - failed.length, failed: failed.length }, failed, results }, null, 2));
  await browser.close();
  if (failed.length) process.exitCode = 1;
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
