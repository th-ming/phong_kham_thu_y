const { chromium } = require('playwright');

(async () => {
  const token = 'eyJhbGciOiJIUzI1NiJ9.eyJyb2xlIjoiQURNSU4iLCJzdWIiOiJhZG1pbiIsImlhdCI6MTc3OTQwMjc3NywiZXhwIjoxNzc5NDg5MTc3fQ.DQBYLnE1LcUjIEXQ1F8HWX9ZRM0EmdnMKajV2nhcmKE';
  const refreshToken = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiIsImlhdCI6MTc3OTQwMjc3NywiZXhwIjoxNzgxOTk0Nzc3fQ.i9wCEfMqOgxJcrY21CxDsaJmZ8oyr4SNnvkxwDqIfUg';
  const user = {
    ho_ten: 'Admin Rexi System',
    ten_vai_tro: 'Quản trị',
    displayName: 'Admin Rexi System',
    ten_dang_nhap: 'admin',
    id_nhan_vien: 'NV-ADMIN-CHINH',
    loai_tai_khoan: 'ADMIN',
    avatar: 'https://lh3.googleusercontent.com/a/ACg8ocJZYd8dqyibAXz0dvTE_P_zsVXMBWBc1wuvSpU54elsE3TedQ=s96-c',
    email: 'rexivetsys@gmail.com'
  };

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  // Inject localStorage before any page loads
  await context.addInitScript(({ t, rt, u }) => {
    try {
      localStorage.setItem('token', t);
      localStorage.setItem('refreshToken', rt);
      localStorage.setItem('user', JSON.stringify(u));
    } catch (e) {
      // ignore
    }
  }, { t: token, rt: refreshToken, u: user });
  const page = await context.newPage();
  await page.goto('http://localhost:3005/quan-ly/marketing');
  // wait for subscribers count element (approx)
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'artifacts/marketing_with_admin.png', fullPage: true });
  console.log('Screenshot saved to artifacts/marketing_with_admin.png');
  await browser.close();
})();
