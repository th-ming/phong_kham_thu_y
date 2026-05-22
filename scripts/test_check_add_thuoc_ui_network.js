const { chromium } = require('playwright');

(async () => {
  const token = 'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiQURNSU4iLCJzdWIiOiJhZG1pbiIsImlhdCI6MTc3OTQwMjc3NywiZXhwIjoxNzc5NDg5MTc3fQ.DQBYLnE1LcUjIEXQ1F8HWX9ZRM0EmdnMKajV2nhcmKE';
  const user = { ho_ten: 'Admin Rexi System', ten_vai_tro: 'Quản trị', displayName: 'Admin', ten_dang_nhap: 'admin', id_nhan_vien: 'NV-ADMIN-CHINH', loai_tai_khoan: 'ADMIN' };

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1365, height: 768 } });
  await context.addInitScript(({ t, u }) => {
    try { localStorage.setItem('token', t); localStorage.setItem('user', JSON.stringify(u)); } catch (e) {}
  }, { t: token, u: user });

  const page = await context.newPage();
  const failed = [];
  page.on('requestfailed', req => failed.push({ url: req.url(), method: req.method(), failure: req.failure()?.errorText }));
  page.on('response', res => {
    if (res.status() >= 400) {
      failed.push({ url: res.url(), status: res.status(), statusText: res.statusText() });
    }
  });

  await page.goto('http://localhost:3005/quan-ly/kho-thuoc');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'Frontend/artifacts/kho_thuoc_net_before.png', fullPage: true });

  try {
    const btn = await page.locator('button', { hasText: 'Thêm thuốc' }).first();
    if (await btn.count() > 0) {
      await btn.click();
      await page.waitForTimeout(500);
      await page.screenshot({ path: 'Frontend/artifacts/kho_thuoc_net_modal.png', fullPage: true });
    }
  } catch (e) {}

  console.log('---FAILED REQUESTS/RESPONSES---');
  for (const f of failed) console.log(JSON.stringify(f));
  await browser.close();
})();