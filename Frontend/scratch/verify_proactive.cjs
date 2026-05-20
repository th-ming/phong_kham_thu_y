const { chromium } = require('playwright');

(async () => {
  console.log('🐾 Bắt đầu kịch bản kiểm thử tự động Proactive Chatbot...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));

  try {
    // 1. Đi tới trang Đăng nhập
    console.log('🐾 1. Truy cập trang đăng nhập...');
    await page.goto('http://localhost:3005/dang-nhap', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000); // Đợi thêm 5 giây cho Vite compile xong
    
    console.log('🐾 Tiêu đề trang:', await page.title());
    
    // 2. Điền thông tin Đăng nhập bằng data-ai-id chuẩn xác
    console.log('🐾 2. Điền thông tin đăng nhập Admin bằng data-ai-id...');
    const usernameInput = page.locator('input[data-ai-id="input-dangnhapdangky-8dku"]');
    await usernameInput.waitFor({ state: 'visible', timeout: 30000 });
    await usernameInput.fill('admin');
    
    const passwordInput = page.locator('input[data-ai-id="input-dangnhapdangky-h1ru"]');
    await passwordInput.fill('admin@rexi.com');
    
    await page.locator('button[data-ai-id="button-dangnhapdangky-xgfa"]').click();
    
    // 3. Đợi điều hướng sang Dashboard thành công
    console.log('🐾 3. Đợi đăng nhập thành công và chuyển hướng...');
    await page.waitForTimeout(5000);
    console.log('🐾 Trang hiện tại sau đăng nhập:', page.url());
    
    // 4. Chuyển sang trang Quản lý Marketing
    console.log('🐾 4. Chuyển sang trang Quản lý Marketing...');
    await page.goto('http://localhost:3005/quan-ly/marketing', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(5000); // Đợi thêm 5 giây cho Vite compile trang Marketing
    
    // 5. Tìm ô soạn thảo email Marketing và nhập nội dung ngắn
    console.log('🐾 5. Điền nội dung ngắn vào ô email soạn thảo...');
    const textarea = page.locator('textarea[data-ai-id="textarea-quanlymarketing-content"]').first();
    await textarea.waitFor({ state: 'visible', timeout: 30000 });
    await textarea.fill('Tri an khach hang dip le lon 30-4');
    
    // 6. Nhấp ra ngoài để trigger blur event
    console.log('🐾 6. Trigger blur event bằng cách nhấp ra ngoài...');
    await page.locator('h1').first().click();
    
    // 7. Chờ 5 giây xem bóng gợi ý có hiển thị không
    console.log('🐾 7. Chờ 5 giây để bóng gợi ý Proactive Chatbot xuất hiện...');
    await page.waitForTimeout(5500);
    
    // 8. Chụp ảnh màn hình làm bằng chứng cho sếp
    console.log('🐾 8. Chụp ảnh màn hình làm bằng chứng thực tế cho sếp...');
    const path = 'C:\\Users\\84916\\.gemini\\antigravity\\brain\\17365a32-a592-42e1-bca3-324db4d0abcc\\proactive_chatbot_success.png';
    await page.screenshot({ path: path, fullPage: false });
    console.log('🐾 Đã lưu screenshot thành công tại:', path);
    
  } catch (err) {
    console.error('❌ Lỗi kiểm thử trong khối try-catch:', err);
    console.log('🐾 Console Errors recorded:', errors);
    const errPath = 'C:\\Users\\84916\\.gemini\\antigravity\\brain\\17365a32-a592-42e1-bca3-324db4d0abcc\\proactive_chatbot_error.png';
    await page.screenshot({ path: errPath });
    console.log('🐾 Đã chụp ảnh lỗi tại:', errPath);
  } finally {
    await browser.close();
    console.log('🐾 Kết thúc kịch bản kiểm thử!');
  }
})();
