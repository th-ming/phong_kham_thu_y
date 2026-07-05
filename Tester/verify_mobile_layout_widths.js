const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true
  });

  // Mock token and user to bypass login check (renders admin shell)
  await context.addInitScript(() => {
    window.localStorage.setItem('token', 'admin-mobile-evidence-token');
    window.localStorage.setItem('user', JSON.stringify({
      id: 'admin-evidence',
      id_nhan_vien: 'admin-evidence',
      role: 'admin',
      vai_tro: 'admin',
      ten_dang_nhap: 'admin',
      ho_ten: 'Admin Rexi',
      email: 'admin@rexi.local'
    }));
  });

  const page = await context.newPage();
  
  console.log('--- ĐANG KIỂM TRA ĐỘ RỘNG CÁC PHẦN TỬ TRÊN VIEWPORT MOBILE 390PX ---');

  // 1. Check Dashboard
  await page.goto('http://127.0.0.1:3005/quan-ly/dashboard', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  
  const mainWidth = await page.$eval('.admin-main-content', el => el.getBoundingClientRect().width);
  const bannerWidth = await page.$eval('.stagger-1', el => el.getBoundingClientRect().width);
  
  console.log(`[Dashboard] Độ rộng khung chính (.admin-main-content): ${mainWidth}px (Yêu cầu <= 390px)`);
  console.log(`[Dashboard] Độ rộng Banner tiêu đề (.stagger-1): ${bannerWidth}px (Yêu cầu <= 390px)`);

  // 2. Check Medical Page
  await page.goto('http://127.0.0.1:3005/quan-ly/kham-benh', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // Check if medical page main container overflows
  const medicalPageExists = await page.$('.admin-medical-page');
  if (medicalPageExists) {
    const medPageWidth = await page.$eval('.admin-medical-page', el => el.getBoundingClientRect().width);
    console.log(`[Bệnh án] Độ rộng khung trang bệnh án (.admin-medical-page): ${medPageWidth}px (Yêu cầu <= 390px)`);
  } else {
    console.log('[Bệnh án] Không tìm thấy phần tử .admin-medical-page (Chưa chọn ca bệnh hoặc chưa load xong)');
  }

  await browser.close();
  console.log('--- HOÀN TẤT KIỂM TRA ---');
})();
