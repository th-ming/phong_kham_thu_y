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
  console.log(`Login OK: ${page.url()}\n`);

  // DANH SÁCH ĐẦY ĐỦ TẤT CẢ CÁC TRANG (từ sidebar)
  const allPages = [
    '/quan-ly/dashboard',
    '/quan-ly/bao-cao-thong-ke',
    '/quan-ly/lich-hen',
    '/quan-ly/lich-lam-viec',
    '/quan-ly/nhan-vien-phan-quyen',
    '/quan-ly/khach-hang-thu-cung',
    '/quan-ly/dich-vu',
    '/quan-ly/kham-benh',
    '/quan-ly/ho-so-benh-an',
    '/quan-ly/don-thuoc',
    '/quan-ly/xet-nghiem',
    '/quan-ly/kho-thuoc',
    '/quan-ly/nhap-kho',
    '/quan-ly/hoa-don',
    '/quan-ly/ke-toan',
    '/quan-ly/marketing',
    '/quan-ly/file-dinh-kem',
    '/quan-ly/cau-hinh',
    '/quan-ly/chuc-nang',
    '/quan-ly/thong-tin-ca-nhan',
    // Trang công khai
    '/bang-gia',
    '/dat-lich',
    '/lien-he',
  ];

  const results = [];

  for (const path of allPages) {
    const url = `https://rexi-vet-clinic.vercel.app${path}`;
    const name = path.split('/').pop();
    
    try {
      const response = await page.goto(url, { waitUntil: 'load', timeout: 25000 });
      await page.waitForTimeout(3000);

      const currentUrl = page.url();
      const bodyText = await page.textContent('body');
      const title = await page.title();

      // Phân tích nội dung
      const is404 = bodyText.includes('KHÔNG TÌM THẤY TRANG') || bodyText.includes('lạc trong phòng khám');
      const hasError = bodyText.includes('Đã xảy ra lỗi') || bodyText.includes('Error');
      const hasVnd = (bodyText.match(/[\d,]+\.?\d*\s*₫/g)) || [];
      const hasZeroVnd = bodyText.includes('0 ₫') || bodyText.includes('0₫');
      const keyWords = (bodyText.match(/(lịch.hẹn|hóa.đơn|thuốc|bệnh.an|khách.hàng|nhân.viên|dịch.vụ|thống.kê|báo.cáo|nhập.kho|tài.chính|kế.toan|xét.nghiệm|marketing|cài.đặt)/gi)) || [];

      let status;
      if (is404) status = '❌ 404';
      else if (hasError) status = '⚠️ ERROR';
      else status = '✅ OK';

      const data = {
        path,
        status,
        currentUrl: currentUrl.replace('https://rexi-vet-clinic.vercel.app', ''),
        title: title.substring(0, 60),
        vndAmounts: hasVnd,
        hasZeroVnd,
        keywords: [...new Set(keyWords)].slice(0, 8),
        bodyLength: bodyText.length,
      };
      results.push(data);

      console.log(`${status} ${path}`);
      console.log(`  → ${data.currentUrl} | Title: ${data.title} | ${data.bodyLength} chars`);
      if (hasVnd.length > 0) console.log(`  💰 Tiền: ${hasVnd.join(', ')}`);
      if (hasZeroVnd) console.log(`  ⚠️ CÓ "0 ₫"`);
      if (keyWords.length > 0) console.log(`  📋 Keywords: ${[...new Set(keyWords)].join(', ')}`);

      const fname = path.replace(/\//g, '_').replace(/^_/, '');
      await page.screenshot({ path: `D:\\Temp\\full_${fname}.png`, fullPage: false });

    } catch (e) {
      console.log(`❌ TIMEOUT ${path} → ${e.message.substring(0, 60)}`);
      results.push({ path, status: '❌ TIMEOUT' });
    }
    console.log('');
  }

  // TỔNG KẾT
  console.log('\n========== TỔNG KẾT ==========');
  const ok = results.filter(r => r.status === '✅ OK');
  const err = results.filter(r => r.status !== '✅ OK');
  const zeroVnd = results.filter(r => r.hasZeroVnd);

  console.log(`Tổng: ${results.length} trang`);
  console.log(`✅ OK: ${ok.length} trang`);
  console.log(`❌ Lỗi: ${err.length} trang`);
  console.log(`⚠️ Có "0 ₫": ${zeroVnd.length} trang`);

  if (zeroVnd.length > 0) {
    console.log('\n--- Trang có hiển thị "0 ₫" ---');
    zeroVnd.forEach(r => console.log(`  ${r.path}`));
  }

  if (err.length > 0) {
    console.log('\n--- Trang bị lỗi ---');
    err.forEach(r => console.log(`  ${r.status} ${r.path} → ${r.currentUrl || 'N/A'}`));
  }

  await browser.close();
  console.log('\n=== DONE ===');
})();