const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh'
  });
  const page = await context.newPage();

  // LOGIN
  await page.goto('https://rexi-vet-clinic.vercel.app/dang-nhap', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(3000);
  const inputs = await page.$$('input');
  await inputs[0].fill('admin');
  await inputs[1].fill('admin@rexi.com');
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await btn.textContent();
    if (text.includes('Đăng nhập')) { await btn.click(); break; }
  }
  await page.waitForTimeout(5000);

  // Get token from localStorage
  const token = await page.evaluate(() => localStorage.getItem('token'));
  console.log(`Token: ${token ? token.substring(0, 80) + '...' : 'NO TOKEN'}\n`);

  // Gọi API trực tiếp từ browser context (có cookie)
  const apiResults = {};
  
  const apis = [
    { url: '/api/bao-cao/doanh-thu-ngay', name: 'doanh-thu-ngay' },
    { url: '/api/bao-cao/doanh-thu-thang', name: 'doanh-thu-thang' },
    { url: '/api/bao-cao/tong-quan-tai-chinh', name: 'tong-quan-tai-chinh' },
    { url: '/api/hoa-don?page=0&size=10', name: 'hoa-don-list' },
    { url: '/api/bao-cao/doanh-thu-dich-vu', name: 'doanh-thu-dich-vu' },
  ];

  for (const api of apis) {
    try {
      const response = await page.evaluate(async (url) => {
        const res = await fetch(url, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });
        const text = await res.text();
        return { status: res.status, body: text.substring(0, 2000) };
      }, api.url);
      
      console.log(`[${api.name}] Status: ${response.status}`);
      console.log(`  Body: ${response.body}\n`);
    } catch (e) {
      console.log(`[${api.name}] ERROR: ${e.message}\n`);
    }
  }

  // CHỤP SCREENSHOT DashboardQuanLy chi tiết
  await page.goto('https://rexi-vet-clinic.vercel.app/quan-ly/dashboard', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(8000);
  
  // Get the full body text
  const bodyText = await page.textContent('body');
  
  // Find DOANH THU section specifically
  const doanhThuMatch = bodyText.match(/DOANH THU[\s\S]{0,200}/);
  console.log(`\n=== DOANH THU SECTION ===`);
  console.log(doanhThuMatch ? doanhThuMatch[0] : 'NOT FOUND');
  
  // Get all numbers with ₫
  const vndAmounts = bodyText.match(/[\d,]+\.?\d*\s*₫/g) || [];
  console.log(`\n=== ALL VND AMOUNTS ===`);
  vndAmounts.forEach(v => console.log(`  ${v}`));
  
  // Find todayStr being used
  const today = new Date();
  console.log(`\n=== TIMEZONE DEBUG ===`);
  console.log(`Browser locale: ${today.toLocaleDateString('vi-VN')}`);
  console.log(`ISO: ${today.toISOString()}`);
  console.log(`Local: ${today.toString()}`);
  console.log(`Timezone offset: ${today.getTimezoneOffset()} minutes`);

  await browser.close();
  console.log('\n=== DONE ===');
})();