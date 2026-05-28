const { chromium } = require('playwright');
const path = require('path');

(async () => {
  console.log('Khởi động trình duyệt Chromium...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  
  const artifactDir = 'C:\\Users\\84916\\.gemini\\antigravity\\brain\\2f02b905-0efa-46ff-9e13-b75429ff25ba';
  const screenshotPath = path.join(artifactDir, 'screenshot_invoice_virtual_scroll.png');

  try {
    // 1. Đăng nhập với quyền Admin
    console.log('Truy cập trang đăng nhập...');
    await page.goto('http://127.0.0.1:3005/dang-nhap', { waitUntil: 'load' });
    await page.waitForTimeout(2000);
    
    console.log('Điền thông tin đăng nhập Admin...');
    await page.fill('input[placeholder="Tên đăng nhập"]', 'admin');
    await page.fill('input[placeholder="Mật khẩu"]', 'admin@rexi.com');
    await page.click('button:has-text("Đăng nhập ngay")');
    
    console.log('Đang chờ điều hướng vào Dashboard Admin...');
    await page.waitForTimeout(4000);

    // 2. Đi tới trang quản lý hóa đơn
    console.log('Truy cập trang Quản lý Hóa đơn...');
    await page.goto('http://127.0.0.1:3005/quan-ly/hoa-don', { waitUntil: 'load' });

    await page.waitForTimeout(3000); // Chờ hóa đơn load và render danh sách ảo

    // 3. Cuộn xuống một chút trong danh sách ảo để thấy cơ chế Virtual Scroll hoạt động
    console.log('Cuộn danh sách hóa đơn để kiểm chứng Virtual Scroll...');
    await page.evaluate(() => {
      // Tìm container cuộn ảo dựa trên thuộc tính overflowY: auto
      const divs = Array.from(document.querySelectorAll('div'));
      const scrollContainer = divs.find(d => d.style.overflowY === 'auto' && d.style.height);
      if (scrollContainer) {
        scrollContainer.scrollTop = 150; // Cuộn xuống 150px
      }
    });
    await page.waitForTimeout(1000);

    // 4. Chụp ảnh màn hình làm minh chứng
    console.log('Chụp ảnh màn hình...');
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`Đã chụp minh chứng thành công và lưu tại: ${screenshotPath}`);

  } catch (err) {
    console.error('Lỗi trong quá trình chụp ảnh UI:', err);
  } finally {
    await browser.close();
    console.log('Đã đóng trình duyệt Playwright.');
  }
})();
