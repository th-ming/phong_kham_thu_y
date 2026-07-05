const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh'
  });
  const page = await context.newPage();

  // Login first
  console.log('=== LOGIN ===\n');
  await page.goto('https://rexi-vet-clinic.vercel.app/dang-nhap', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  const inputs = await page.$$('input');
  await inputs[0].fill('admin');
  await inputs[1].fill('admin@rexi.com');
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await btn.textContent();
    if (text.includes('Đăng nhập') || text.includes('đăng nhập') || text.includes('Login')) {
      await btn.click();
      break;
    }
  }
  await page.waitForTimeout(3000);
  console.log(`URL: ${page.url()}\n`);

  // CHECK EACH DASHBOARD - extract specific data
  const dashboards = [
    'https://rexi-vet-clinic.vercel.app/admin/dashboard?tab=manager',
    'https://rexi-vet-clinic.vercel.app/admin/dashboard?tab=accountant',
    'https://rexi-vet-clinic.vercel.app/admin/dashboard?tab=doctor',
    'https://rexi-vet-clinic.vercel.app/admin/dashboard?tab=receptionist',
    'https://rexi-vet-clinic.vercel.app/admin/thong-ke/bao-cao',
  ];

  const names = ['QuanLy', 'KeToan', 'BacSi', 'TiepTan', 'BaoCao'];

  for (let i = 0; i < dashboards.length; i++) {
    const url = dashboards[i];
    const name = names[i];
    
    console.log(`=== ${name} ===`);
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(3000);

      // Get all text content
      const fullText = await page.textContent('body');

      // Extract key data points
      // Find lines with VND amounts
      const vndPattern = /[\d,]+\.?\d*\s*₫|\d{1,3}(,\d{3})*\s?(VND|₫|đồng)/g;
      const vndMatches = fullText.match(vndPattern) || [];
      console.log(`  Số liệu tiền: [${vndMatches.join(', ')}]`);

      // Find "0 ₫" patterns
      const zeroVnd = fullText.match(/0\s*₫|0\s*VND/g) || [];
      console.log(`  Zero VND: [${zeroVnd.join(', ')}]`);

      // Find "doanh thu", "hóa đơn", "tổng", "số lượng"
      const keywordLines = [];
      const lines = fullText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      for (const line of lines) {
        if (line.match(/doanh\s*thu|hóa\s*đơn|tổng\s*(tiền|doanh|số)|số\s*lượng|bệnh\s*nhân|lịch\s*hẹn/i)) {
          keywordLines.push(line);
        }
      }
      console.log(`  Key data lines (${keywordLines.length}):`);
      keywordLines.forEach(l => console.log(`    - ${l}`));

      // Check network requests for API errors
      const reqLogs = [];
      page.on('response', async (response) => {
        const reqUrl = response.url();
        if (reqUrl.includes('/api/')) {
          const status = response.status();
          let body = '';
          try { body = (await response.text()).substring(0, 200); } catch {}
          reqLogs.push(`[${status}] ${reqUrl} → ${body.substring(0, 100)}`);
        }
      });

      // Navigate again to capture API
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);

      // Print API logs
      if (reqLogs.length > 0) {
        console.log(`  API calls (${reqLogs.length}):`);
        reqLogs.forEach(l => console.log(`    ${l}`));
      }

      console.log('');
    } catch (e) {
      console.log(`  ERROR: ${e.message}\n`);
    }
  }

  await browser.close();
  console.log('=== HOÀN TẤT ===');
})();