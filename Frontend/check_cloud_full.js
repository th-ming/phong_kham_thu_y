const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh'
  });
  const page = await context.newPage();

  console.log('=== BƯỚC 1: ĐĂNG NHẬP ===\n');
  
  await page.goto('https://rexi-vet-clinic.vercel.app/dang-nhap', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Fill credentials
  const inputs = await page.$$('input');
  // Input 0 = username, Input 1 = password
  await inputs[0].fill('admin');
  await inputs[1].fill('admin@rexi.com');

  // Tìm và click nút đăng nhập
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await btn.textContent();
    if (text.includes('Đăng nhập') || text.includes('đăng nhập') || text.includes('Login')) {
      await btn.click();
      console.log('Clicked login button');
      break;
    }
  }

  await page.waitForTimeout(3000);
  const currentUrl = page.url();
  console.log(`URL sau login: ${currentUrl}`);

  // Check if redirected to dashboard
  if (currentUrl.includes('dang-nhap')) {
    console.log('VẪN Ở TRANG LOGIN - CÓ THỂ SAI CREDENTIALS HOẶC API KO CHẠY');
    await page.screenshot({ path: 'D:\\Temp\\cloud_login_failed.png', fullPage: true });
  } else {
    console.log('ĐĂNG NHẬP THÀNH CÔNG!');
    await page.screenshot({ path: 'D:\\Temp\\cloud_login_success.png', fullPage: true });
  }

  // Lấy token từ localStorage hoặc cookie
  const token = await page.evaluate(() => localStorage.getItem('token'));
  console.log(`Token: ${token ? token.substring(0, 50) + '...' : 'KHÔNG CÓ TOKEN'}`);

  console.log('\n=== BƯỚC 2: KIỂM TRA TỪNG TRANG DASHBOARD ===\n');

  const dashboards = [
    { url: 'https://rexi-vet-clinic.vercel.app/admin/dashboard?tab=manager', name: 'Dashboard Quản Lý' },
    { url: 'https://rexi-vet-clinic.vercel.app/admin/dashboard?tab=accountant', name: 'Dashboard Kế Toán' },
    { url: 'https://rexi-vet-clinic.vercel.app/admin/dashboard?tab=doctor', name: 'Dashboard Bác Sĩ' },
    { url: 'https://rexi-vet-clinic.vercel.app/admin/dashboard?tab=receptionist', name: 'Dashboard Tiếp Tân' },
    { url: 'https://rexi-vet-clinic.vercel.app/admin/thong-ke/bao-cao', name: 'Báo Cáo Thống Kê' },
  ];

  for (const d of dashboards) {
    try {
      await page.goto(d.url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);
      
      const title = await page.title();
      const bodyText = await page.textContent('body');
      
      // Tìm số liệu trong dashboard (VND amounts, chart data...)
      const hasVnd = bodyText.includes('₫') || bodyText.includes('VND') || bodyText.includes('đồng');
      const hasNumbers = /[1-9]\d{0,9}/.test(bodyText);
      const hasError = bodyText.includes('error') || bodyText.includes('lỗi') || bodyText.includes('404');
      const hasNoData = bodyText.includes('không có dữ liệu') || bodyText.includes('0 ₫') || bodyText.includes('chưa có');
      
      console.log(`[${d.name}]`);
      console.log(`  Title: ${title}`);
      console.log(`  Có số liệu VND: ${hasVnd}`);
      console.log(`  Có số: ${hasNumbers}`);
      console.log(`  Có "0 ₫" hoặc "không có dữ liệu": ${hasNoData}`);
      console.log(`  Có error: ${hasError}`);
      
      const screenshotName = d.name.replace(/\s/g, '_').toLowerCase();
      await page.screenshot({ path: `D:\\Temp\\cloud_${screenshotName}.png`, fullPage: true });
      console.log('');
    } catch (e) {
      console.log(`[${d.name}] ERROR: ${e.message}\n`);
    }
  }

  // Kiểm tra thêm các trang quản lý
  console.log('\n=== BƯỚC 3: KIỂM TRA TRANG QUẢN LÝ ===\n');
  const adminPages = [
    { url: 'https://rexi-vet-clinic.vercel.app/admin/lich-hen', name: 'Quản Lý Lịch Hẹn' },
    { url: 'https://rexi-vet-clinic.vercel.app/admin/benh-an', name: 'Quản Lý Bệnh Án' },
    { url: 'https://rexi-vet-clinic.vercel.app/admin/don-thuoc', name: 'Quản Lý Đơn Thuốc' },
    { url: 'https://rexi-vet-clinic.vercel.app/admin/thu-cung', name: 'Quản Lý Thú Cưng' },
    { url: 'https://rexi-vet-clinic.vercel.app/admin/nhap-kho', name: 'Quản Lý Nhập Kho' },
    { url: 'https://rexi-vet-clinic.vercel.app/admin/thuoc', name: 'Quản Lý Thuốc' },
    { url: 'https://rexi-vet-clinic.vercel.app/admin/khach-hang', name: 'Quản Lý Khách Hàng' },
    { url: 'https://rexi-vet-clinic.vercel.app/admin/nhan-vien', name: 'Quản Lý Nhân Viên' },
  ];

  for (const p of adminPages) {
    try {
      await page.goto(p.url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2000);
      
      const title = await page.title();
      const bodyText = await page.textContent('body');
      const hasError = bodyText.includes('error') || bodyText.includes('lỗi') || bodyText.includes('404');
      const hasNoData = bodyText.includes('không có dữ liệu');
      
      console.log(`[${p.name}] Title: ${title} | Error: ${hasError} | NoData: ${hasNoData}`);
      
      const screenshotName = p.name.replace(/\s/g, '_').toLowerCase();
      await page.screenshot({ path: `D:\\Temp\\cloud_${screenshotName}.png`, fullPage: true });
    } catch (e) {
      console.log(`[${p.name}] ERROR: ${e.message}`);
    }
  }

  await browser.close();
  console.log('\n=== HOÀN TẤT ===');
})();