const { chromium } = require('playwright');

(async () => {
  const token = 'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiQURNSU4iLCJzdWIiOiJhZG1pbiIsImlhdCI6MTc3OTQwMjc3NywiZXhwIjoxNzc5NDg5MTc3fQ.DQBYLnE1LcUjIEXQ1F8HWX9ZRM0EmdnMKajV2nhcmKE';
  const user = { ho_ten: 'Admin Rexi System', ten_vai_tro: 'Quản trị', displayName: 'Admin', ten_dang_nhap: 'admin', id_nhan_vien: 'NV-ADMIN-CHINH', loai_tai_khoan: 'ADMIN' };

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1365, height: 768 } });
  await context.addInitScript(({ t, u }) => {
    try {
      localStorage.setItem('token', t);
      localStorage.setItem('user', JSON.stringify(u));
    } catch (e) {}
  }, { t: token, u: user });

  const page = await context.newPage();
  const logs = [];
  page.on('console', msg => logs.push({ type: msg.type(), text: msg.text() }));
  page.on('pageerror', err => logs.push({ type: 'pageerror', text: err.toString() }));

  await page.goto('http://localhost:3005/quan-ly/kho-thuoc');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'Frontend/artifacts/kho_thuoc_before.png', fullPage: true });

  // Try to click the Thêm thuốc button
  try {
    const btn = await page.locator('button', { hasText: 'Thêm thuốc' }).first();
    if (await btn.count() > 0) {
      await btn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'Frontend/artifacts/kho_thuoc_modal.png', fullPage: true });
    } else {
      logs.push({ type: 'info', text: 'Thêm thuốc button not found' });
    }
  } catch (e) {
    logs.push({ type: 'error', text: String(e) });
  }

  console.log('---CONSOLE LOGS---');
  for (const l of logs) console.log(l.type + ': ' + l.text);
  await browser.close();
})();