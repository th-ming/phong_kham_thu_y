const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh'
  });
  const page = await context.newPage();

  console.log('=== KIỂM TRA TRANG CÔNG KHAI ===\n');
  
  // Trang công khai
  const publicPages = [
    { url: 'https://rexi-vet-clinic.vercel.app/', name: 'Trang chủ' },
    { url: 'https://rexi-vet-clinic.vercel.app/dang-nhap', name: 'Đăng nhập' },
  ];

  for (const p of publicPages) {
    try {
      const response = await page.goto(p.url, { waitUntil: 'networkidle', timeout: 30000 });
      const title = await page.title();
      console.log(`[${p.name}] Status: ${response.status()} | Title: ${title}`);
      await page.screenshot({ path: `D:\\Temp\\cloud_${p.name.replace(/\s/g,'_').toLowerCase()}.png`, fullPage: true });
    } catch (e) {
      console.log(`[${p.name}] ERROR: ${e.message}`);
    }
  }

  // THỬ LOGIN
  console.log('\n=== THỬ LOGIN ===\n');
  try {
    await page.goto('https://rexi-vet-clinic.vercel.app/dang-nhap', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    const inputs = await page.$$('input');
    console.log(`Found ${inputs.length} input fields`);
    for (let i = 0; i < inputs.length; i++) {
      const type = await inputs[i].getAttribute('type');
      const placeholder = await inputs[i].getAttribute('placeholder');
      const name = await inputs[i].getAttribute('name');
      console.log(`  Input ${i}: type=${type}, placeholder=${placeholder}, name=${name}`);
    }
    
    await page.screenshot({ path: 'D:\\Temp\\cloud_login.png', fullPage: true });
  } catch (e) {
    console.log(`Login error: ${e.message}`);
  }

  // Kiểm tra API endpoints
  console.log('\n=== KIỂM TRA API RESPONSE ===\n');
  const apiEndpoints = [
    'https://rexi-vet-clinic.vercel.app/api/bao-cao/doanh-thu-ngay',
    'https://rexi-vet-clinic.vercel.app/api/bao-cao/doanh-thu-thang',
    'https://rexi-vet-clinic.vercel.app/api/tai-khoan/login',
  ];
  
  for (const api of apiEndpoints) {
    try {
      const response = await page.goto(api, { timeout: 10000 });
      const text = await page.textContent('body');
      console.log(`[API] ${api} → Status: ${response.status()} | Body: ${text.substring(0, 500)}`);
    } catch (e) {
      console.log(`[API] ${api} → ERROR: ${e.message}`);
    }
  }

  await browser.close();
  console.log('\n=== HOÀN TẤT ===');
})();