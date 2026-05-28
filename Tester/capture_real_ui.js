const { chromium } = require('playwright');
const path = require('path');

(async () => {
  console.log('Khởi động trình duyệt Chromium...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  
  const artifactDir = 'C:\\Users\\84916\\.gemini\\antigravity\\brain\\b3aed445-909e-4ce9-b736-8bc81398af28';

  try {
    // 1. Chụp ảnh trang đăng nhập thật
    console.log('Truy cập trang đăng nhập...');
    await page.goto('http://localhost:3005/dang-nhap', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000); // Chờ 2s để animation hoàn tất
    const loginImg = path.join(artifactDir, 'screenshot_login_real.png');
    await page.screenshot({ path: loginImg });
    console.log(`Đã chụp trang đăng nhập thật: ${loginImg}`);
    
    // 2. Chuyển sang form Đăng ký (Wizard Bước 1)
    console.log('Chuyển sang form Đăng ký (Bước 1)...');
    await page.click('text=Đăng ký ngay');
    await page.waitForTimeout(1000); // Chờ slide transition
    const step1Img = path.join(artifactDir, 'screenshot_register_step1_real.png');
    await page.screenshot({ path: step1Img });
    console.log(`Đã chụp trang đăng ký Bước 1 thật: ${step1Img}`);

    // 3. Điền thông tin Bước 1
    console.log('Điền thông tin cá nhân Bước 1...');
    await page.fill('input[placeholder="Họ và tên"]', 'Lê Văn Thật');
    await page.fill('input[placeholder="Email"]', 'tester_real@rexi.com');
    await page.fill('input[placeholder="Số điện thoại"]', '0987654321');
    await page.fill('input[placeholder="Địa chỉ"]', 'NIC 3A Thi Sách, Hà Nội');
    await page.waitForTimeout(500);

    // 4. Bấm "Tiếp theo" để chuyển sang Bước 2
    console.log('Bấm "Tiếp theo" để sang Bước 2...');
    await page.click('button:has-text("Tiếp theo")');
    await page.waitForTimeout(1200); // Chờ slide transition mượt mà
    const step2Img = path.join(artifactDir, 'screenshot_register_step2_real.png');
    await page.screenshot({ path: step2Img });
    console.log(`Đã chụp trang đăng ký Bước 2 thật: ${step2Img}`);

    // 4.5. Đăng nhập tài khoản Khách hàng thật để kiểm tra Dashboard và Footer
    console.log('Đăng nhập tài khoản Khách hàng thật...');
    await page.goto('http://localhost:3005/dang-nhap', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.fill('input[placeholder="Tên đăng nhập"]', '***REMOVED***');
    await page.fill('input[placeholder="Mật khẩu"]', '***REMOVED***');
    await page.click('button:has-text("Đăng nhập ngay")');
    console.log('Đang chờ điều hướng vào Dashboard Khách hàng...');
    await page.waitForTimeout(4000); // Chờ load trang và render Skeleton / Dashboard thật
    const customerDashboardImg = path.join(artifactDir, 'screenshot_customer_dashboard_real.png');
    await page.screenshot({ path: customerDashboardImg });
    console.log(`Đã chụp Dashboard Khách hàng thật: ${customerDashboardImg}`);

    // Cuộn xuống Footer và chụp ảnh Footer đã tối ưu Touch Target Size
    console.log('Cuộn xuống chân trang Footer...');
    await page.evaluate(() => {
      const footer = document.querySelector('footer');
      if (footer) footer.scrollIntoView({ behavior: 'smooth' });
    });
    await page.waitForTimeout(2000); // Chờ VirtualPets render mượt mà
    const footerImg = path.join(artifactDir, 'screenshot_footer_real.png');
    await page.screenshot({ path: footerImg });
    console.log(`Đã chụp Footer thật: ${footerImg}`);

    // 5. Đăng nhập ADMIN để chụp AISummaryModal thật
    console.log('Trở lại đăng nhập Admin để lấy bệnh án...');
    await page.goto('http://localhost:3005/dang-nhap', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    await page.fill('input[placeholder="Tên đăng nhập"]', 'admin');
    await page.fill('input[placeholder="Mật khẩu"]', 'admin@rexi.com');
    await page.click('button:has-text("Đăng nhập ngay")');
    await page.waitForTimeout(3000); // Chờ điều hướng vào dashboard
    
    // 6. Vào trang hồ sơ bệnh án
    console.log('Vào trang quản lý hồ sơ bệnh án...');
    await page.goto('http://localhost:3005/quan-ly/ho-so-benh-an', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);

    // 7. Tìm và kích hoạt nút AI tóm tắt
    console.log('Tìm nút AI Tóm Tắt...');
    const aiBtn = page.locator('button:has-text("AI"), button:has-text("Tóm tắt"), button .material-symbols-outlined:has-text("auto_awesome")').first();
    if (await aiBtn.count() > 0) {
      await aiBtn.click();
      console.log('Đang chờ AI tóm tắt bệnh án (4 giây)...');
      await page.waitForTimeout(4000); // Chờ render modal kính mờ cao cấp
      const aiModalImg = path.join(artifactDir, 'screenshot_ai_summary_real.png');
      await page.screenshot({ path: aiModalImg });
      console.log(`Đã chụp AISummaryModal kính mờ thật: ${aiModalImg}`);
    } else {
      console.log('Không tìm thấy nút AI Tóm Tắt trên bảng bệnh án.');
    }

  } catch (err) {
    console.error('Lỗi trong quá trình chụp ảnh UI thật:', err);
  } finally {
    await browser.close();
    console.log('Đã đóng trình duyệt Playwright.');
  }
})();
