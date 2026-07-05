const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh'
  });
  const page = await context.newPage();

  // Capture ALL network requests
  const apiResponses = [];
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/')) {
      try {
        const body = await response.text();
        apiResponses.push({
          url: url.replace('https://phong-kham-thu-y.onrender.com', ''),
          status: response.status(),
          body: body.substring(0, 3000)
        });
      } catch {}
    }
  });

  // LOGIN
  console.log('=== LOGIN ===');
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
  await page.waitForTimeout(8000);
  console.log(`URL: ${page.url()}`);

  // Print ALL captured API responses
  console.log(`\n=== API RESPONSES (${apiResponses.length}) ===\n`);
  for (const r of apiResponses) {
    console.log(`[${r.status}] ${r.url}`);
    // Only print body for finance/invoice related APIs
    if (r.url.includes('hoa-don') || r.url.includes('bao-cao') || r.url.includes('finance') || r.url.includes('dashboard')) {
      console.log(`  Body: ${r.body}`);
    } else {
      console.log(`  Body: ${r.body.substring(0, 200)}...`);
    }
    console.log('');
  }

  // Now navigate to Kế toán dashboard to capture its API calls
  apiResponses.length = 0; // Clear
  console.log('\n=== NAVIGATING TO KE TOAN ===');
  await page.goto('https://rexi-vet-clinic.vercel.app/quan-ly/ke-toan', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(8000);

  console.log(`\n=== KE TOAN API RESPONSES (${apiResponses.length}) ===\n`);
  for (const r of apiResponses) {
    console.log(`[${r.status}] ${r.url}`);
    if (r.url.includes('hoa-don') || r.url.includes('bao-cao') || r.url.includes('finance')) {
      console.log(`  Body: ${r.body}`);
    }
    console.log('');
  }

  await browser.close();
  console.log('=== DONE ===');
})();