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
  await page.goto('https://rexi-vet-clinic.vercel.app/dang-nhap', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  const inputs = await page.$$('input');
  await inputs[0].fill('admin');
  await inputs[1].fill('admin@rexi.com');
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await btn.textContent();
    if (text.includes('Đăng nhập') || text.includes('đăng nhập')) { await btn.click(); break; }
  }
  await page.waitForTimeout(5000);
  const loggedUrl = page.url();
  console.log(`Login URL: ${loggedUrl}\n`);

  // Lấy tất cả sidebar links bằng click
  console.log('=== SIDEBAR LINKS ===');
  const sidebarLinks = await page.$$eval('nav a, .sidebar a, [class*="sidebar"] a, [class*="menu"] a', links => {
    return links.map(l => ({ href: l.getAttribute('href'), text: l.textContent.trim() })).filter(l => l.text);
  });
  for (const l of sidebarLinks) {
    console.log(`  "${l.text}" → ${l.href}`);
  }

  // Test mỗi URL một cách chi tiết
  const pagesToCheck = [
    { url: '/quan-ly/dashboard', name: 'Dashboard (post-login redirect)' },
    { url: '/admin/thong-ke/bao-cao', name: 'Báo cáo & Thống kê' },
    { url: '/admin/lich-hen', name: 'Quản lý lịch hẹn' },
    { url: '/admin/benh-an', name: 'Bệnh án' },
    { url: '/admin/thu-cung', name: 'Thú cưng' },
    { url: '/admin/nhap-kho', name: 'Nhập kho' },
    { url: '/admin/thuoc', name: 'Thuốc' },
    { url: '/admin/khach-hang', name: 'Khách hàng' },
    { url: '/admin/nhan-vien', name: 'Nhân viên' },
    { url: '/admin/tai-khoan', name: 'Tài khoản' },
    { url: '/admin/dich-vu', name: 'Dịch vụ' },
    { url: '/admin/dat-lich', name: 'Đặt lịch' },
    { url: '/admin/bang-gia', name: 'Bảng giá' },
  ];

  for (const p of pagesToCheck) {
    try {
      const url = `https://rexi-vet-clinic.vercel.app${p.url}`;
      await page.goto(url, { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      const is404 = currentUrl.includes('404') || (await page.textContent('body')).includes('KHÔNG TÌM THẤY TRANG');
      const hasError = (await page.textContent('body')).includes('Đã xảy ra lỗi');
      const bodyText = await page.textContent('body');

      // Find any numerical data
      const numbers = bodyText.match(/[\d,]+\.?\d*\s*₫/g) || [];
      const keyPhrases = bodyText.match(/(lịch.hẹn|hóa.đơn|thuốc|bệnh.an|khách.hàng|nhân.viên|dịch.vụ|bảng.giá|nhập.kho|thống.kê|báo.cáo)/gi) || [];

      const status = is404 ? '❌ 404' : hasError ? '⚠️ ERROR' : '✅ OK';
      const snippet = keyPhrases.length > 0 ? keyPhrases.slice(0, 5).join(', ') : 'không có nội dung';
      const nums = numbers.length > 0 ? ` | Tiền: ${numbers.join(', ')}` : '';

      console.log(`[${status}] ${p.name} (${currentUrl.replace('https://rexi-vet-clinic.vercel.app', '')}) | Content: ${snippet}${nums}`);

      // Screenshot
      const fname = p.name.replace(/[& ]/g, '_').toLowerCase();
      await page.screenshot({ path: `D:\\Temp\\check_${fname}.png`, fullPage: false });

    } catch (e) {
      console.log(`[❌ TIMEOUT] ${p.name} → ${e.message.substring(0, 80)}`);
    }
  }

  // QUAN TRỌNG: Click vào sidebar để xem dashboard quản lý, xem có data không
  console.log('\n=== CLICK SIDEBAR - Dashboard tabs ===');
  try {
    await page.goto('https://rexi-vet-clinic.vercel.app/quan-ly/dashboard', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(3000);

    // Click "Báo cáo & Thống kê"
    const reportLink = await page.$('a[href*="bao-cao"]');
    if (reportLink) {
      await reportLink.click();
      await page.waitForTimeout(3000);
      const currentUrl = page.url();
      const bodyText = await page.textContent('body');
      const hasData = bodyText.match(/[\d,]+\.?\d*\s*₫/) || [];
      console.log(`Báo cáo page: ${currentUrl} | Data: ${hasData.length > 0 ? hasData.join(', ') : 'KHÔNG CÓ'}`);
      await page.screenshot({ path: 'D:\\Temp\\check_bao_cao_click.png', fullPage: true });
    } else {
      console.log('Không tìm thấy link Báo cáo');
      // Liệt kê tất cả links hiện có
      const allLinks = await page.$$eval('a', links => links.map(l => ({ href: l.getAttribute('href'), text: l.textContent.trim() })));
      console.log('Available links:');
      allLinks.filter(l => l.text).forEach(l => console.log(`  ${l.href} → ${l.text.substring(0, 50)}`));
    }

    // Navigate back to dashboard and check all tabs
    await page.goto('https://rexi-vet-clinic.vercel.app/quan-ly/dashboard', { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(3000);
    
    // Click "Bảng điều khiển" tab first
    const dashboardTab = await page.$('text=Bảng điều khiển');
    if (dashboardTab) {
      await dashboardTab.click();
      await page.waitForTimeout(3000);
      const bodyText = await page.textContent('body');
      
      // Extract all data displayed
      const lines = bodyText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      const dataLines = lines.filter(l => 
        l.match(/[\d,]+/) && !l.match(/^(©|Google|Đăng nhập|Xin chào)/) 
        && l.length < 200
      );
      console.log('\n=== DASHBOARD DATA LINES ===');
      dataLines.forEach(l => console.log(`  ${l}`));
      
      await page.screenshot({ path: 'D:\\Temp\\check_dashboard_data.png', fullPage: true });
    }

  } catch (e) {
    console.log(`Sidebar click error: ${e.message}`);
  }

  await browser.close();
  console.log('\n=== DONE ===');
})();