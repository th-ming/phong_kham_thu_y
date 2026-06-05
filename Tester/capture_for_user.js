const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('Khởi động trình duyệt Chromium với fake mic...');
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--use-fake-ui-for-media-stream',
      '--use-fake-device-for-media-stream'
    ]
  });
  const context = await browser.newContext({
    permissions: ['microphone']
  });
  const page = await context.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  
  page.on('console', msg => {
    console.log(`[BROWSER]: ${msg.text()}`);
  });

  const artifactDir = 'C:\\Users\\84916\\.gemini\\antigravity\\brain\\b2d31276-1356-4c3e-a71d-1db4cac1f328';
  if (!fs.existsSync(artifactDir)){
      fs.mkdirSync(artifactDir, { recursive: true });
  }

  try {
    // 1. Chụp ảnh trang đăng nhập thật
    console.log('Truy cập trang đăng nhập...');
    await page.goto('http://localhost:3005/dang-nhap', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const loginImg = path.join(artifactDir, 'screenshot_login.png');
    await page.screenshot({ path: loginImg });
    console.log(`Đã chụp trang đăng nhập: ${loginImg}`);

    // 2. Đăng nhập tài khoản Khách hàng thật
    console.log('Đăng nhập tài khoản Khách hàng thật...');
    await page.fill('input[placeholder="Tên đăng nhập"]', '***REMOVED***');
    await page.fill('input[placeholder="Mật khẩu"]', '***REMOVED***-DB_PASSWORD');
    await page.click('button:has-text("Đăng nhập ngay")');
    
    console.log('Đang chờ điều hướng...');
    await page.waitForTimeout(5000); // Chờ 5s để đăng nhập và điều hướng
    console.log('URL hiện tại sau đăng nhập:', page.url());

    const dashboardImg = path.join(artifactDir, 'screenshot_customer_dashboard.png');
    await page.screenshot({ path: dashboardImg });
    console.log(`Đã chụp Dashboard Khách hàng: ${dashboardImg}`);

    // Kiểm tra xem có Birth Year Gate không
    const birthYearSelect = page.locator('select[data-ai-id="select-customerlayout-namsinh"], select');
    if (await birthYearSelect.count() > 0 && await birthYearSelect.isVisible()) {
      console.log('Phát hiện Birth Year Gate! Đang chọn năm sinh để đóng...');
      await birthYearSelect.selectOption('2000');
      await page.click('button:has-text("Xác nhận")');
      await page.waitForTimeout(2000);
      console.log('Đã đóng Birth Year Gate. URL hiện tại:', page.url());
    }

    // 3. Vào trang quản lý thú cưng
    console.log('Di chuyển sang trang Quản lý thú cưng...');
    await page.goto('http://localhost:3005/khach-hang/quan-ly-thu-cung', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    console.log('URL hiện tại (Quản lý thú cưng):', page.url());
    const petManagementImg = path.join(artifactDir, 'screenshot_pet_management.png');
    await page.screenshot({ path: petManagementImg });
    console.log(`Đã chụp danh sách thú cưng: ${petManagementImg}`);

    // 4. Kích hoạt Chatbot và chụp Chatbot
    console.log('Kích hoạt Chatbot...');
    const chatbotBtn = page.locator('#chatBtn');
    if (await chatbotBtn.count() > 0) {
      await chatbotBtn.click({ force: true });
      await page.waitForTimeout(2500);
      const chatbotImg = path.join(artifactDir, 'screenshot_chatbot.png');
      await page.screenshot({ path: chatbotImg });
      console.log(`Đã chụp Chatbot: ${chatbotImg}`);
      
      // Bật chế độ nói chuyện (mic) để chụp hiển thị mic
      console.log('Kích hoạt micro giọng nói...');
      const micBtn = page.locator('button[data-ai-id="button-chatbot-4mbq"]').first();
      if (await micBtn.count() > 0) {
        await micBtn.click({ force: true });
        await page.waitForTimeout(3000); // Chờ mic animation và soundwave
        const chatbotMicImg = path.join(artifactDir, 'screenshot_chatbot_mic.png');
        await page.screenshot({ path: chatbotMicImg });
        console.log(`Đã chụp Chatbot giọng nói: ${chatbotMicImg}`);
      }
    } else {
      console.log('Không thấy nút chatbot trên trang này.');
    }

    // 5. Vào trang hồ sơ bệnh án
    console.log('Di chuyển sang trang hồ sơ bệnh án...');
    await page.goto('http://localhost:3005/khach-hang/ho-so-benh-an', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    console.log('URL hiện tại (Hồ sơ bệnh án):', page.url());
    const medicalHistoryImg = path.join(artifactDir, 'screenshot_medical_history.png');
    await page.screenshot({ path: medicalHistoryImg });
    console.log(`Đã chụp hồ sơ bệnh án: ${medicalHistoryImg}`);

  } catch (err) {
    console.error('Lỗi trong quá trình chụp ảnh UI:', err);
  } finally {
    await browser.close();
    console.log('Đã đóng trình duyệt Playwright.');
  }
})();
