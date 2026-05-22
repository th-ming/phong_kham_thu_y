const { chromium } = require('playwright');

(async () => {
  const token = 'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiQURNSU4iLCJzdWIiOiJhZG1pbiIsImlhdCI6MTc3OTQwMjc3NywiZXhwIjoxNzc5NDg5MTc3fQ.DQBYLnE1LcUjIEXQ1F8HWX9ZRM0EmdnMKajV2nhcmKE';
  const refreshToken = token;
  const user = {
    ho_ten: 'Admin Rexi System',
    ten_vai_tro: 'Quản trị',
    displayName: 'Admin Rexi System',
    ten_dang_nhap: 'admin',
    id_nhan_vien: 'NV-ADMIN-CHINH',
    loai_tai_khoan: 'ADMIN',
    avatar: '',
    email: 'rexivetsys@gmail.com'
  };

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1365, height: 768 } });
  await context.addInitScript(({ t, rt, u }) => {
    try {
      localStorage.setItem('token', t);
      localStorage.setItem('refreshToken', rt);
      localStorage.setItem('user', JSON.stringify(u));
    } catch (e) {}
  }, { t: token, rt: refreshToken, u: user });

  const page = await context.newPage();
  await page.goto('http://localhost:3005/quan-ly/nhap-kho');
  await page.waitForTimeout(1500);

  // Open modal
  await page.click('[data-ai-id="button-quanlynhapkho-au1n"]');
  await page.waitForTimeout(500);

  // Select the test medicine if present
  try {
    await page.selectOption('[data-ai-id="select-quanlynhapkho-v3us"]', 'THUOC-TEST-1');
  } catch (e) {
    // ignore if not present
  }

  // Fill fields
  await page.fill('[data-ai-id="input-quanlynhapkho-pc2b"]', 'TEST-LOT-001');

  // Set past date (yesterday)
  const d = new Date();
  d.setDate(d.getDate() - 2);
  const iso = d.toISOString().split('T')[0];
  await page.fill('[data-ai-id="input-quanlynhapkho-r92a"]', iso);

  await page.fill('[data-ai-id="input-quanlynhapkho-8lya"]', '1');
  await page.fill('[data-ai-id="input-quanlynhapkho-ex6w"]', '1000');

  // Submit
  await page.click('[data-ai-id="button-quanlynhapkho-fth2"]');

  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'artifacts/nhapkho_validation.png', fullPage: true });
  console.log('Saved artifacts/nhapkho_validation.png');
  await browser.close();
})();