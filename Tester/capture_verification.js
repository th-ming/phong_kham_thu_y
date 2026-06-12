const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const outDir = path.resolve(__dirname, '..', 'output', 'playwright', 'mobile-fix-evidence');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const servicesMock = [
  {
    id_dich_vu: 1,
    ten_dich_vu: "Khám lâm sàng tổng quát",
    mo_ta: "Bác sĩ kiểm tra tổng quát, đánh giá tình trạng hiện tại và tư vấn phác đồ phù hợp nhất cho bé.",
    gia: 150000,
    thoi_luong_phut: 30,
    trang_thai: true
  }
];

async function installMocks(page) {
  await page.route('**/api/**', async (route) => {
    const url = route.request().url();
    if (url.includes('/api/dich-vu')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(servicesMock)
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    }
  });
}

async function verifyAll() {
  console.log('Bắt đầu chụp ảnh xác minh toàn bộ (Mobile & Desktop)...');

  // 1. CHỤP MOBILE VIEWPORT (390x844)
  const mobileBrowser = await chromium.launch({ headless: true });
  const mobileContext = await mobileBrowser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  });
  const mobilePage1 = await mobileContext.newPage();
  await installMocks(mobilePage1);

  // 1.1 Chi tiết dịch vụ Mobile
  console.log('Chụp trang dịch vụ (Mobile)...');
  await mobilePage1.goto('http://127.0.0.1:3005/dich-vu/kham-lam-sang-tong-quat', { waitUntil: 'networkidle', timeout: 30000 });
  await mobilePage1.waitForTimeout(3000);
  await mobilePage1.evaluate(() => window.scrollTo(0, 500));
  await mobilePage1.waitForTimeout(1500);
  await mobilePage1.screenshot({ path: path.join(outDir, 'service-detail-fixed-mobile.png') });

  // 1.2 Lỗi 404 Mobile
  const mobilePage2 = await mobileContext.newPage();
  console.log('Chụp trang 404 (Mobile)...');
  await mobilePage2.goto('http://127.0.0.1:3005/404', { waitUntil: 'networkidle', timeout: 30000 });
  await mobilePage2.waitForTimeout(2000);
  await mobilePage2.screenshot({ path: path.join(outDir, '404-local-mobile-final.png') });
  
  await mobileBrowser.close();

  // 2. CHỤP DESKTOP VIEWPORT (1440x900)
  const desktopBrowser = await chromium.launch({ headless: true });
  const desktopContext = await desktopBrowser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });
  const desktopPage1 = await desktopContext.newPage();
  await installMocks(desktopPage1);

  // 2.1 Chi tiết dịch vụ Desktop
  console.log('Chụp trang dịch vụ (Desktop)...');
  await desktopPage1.goto('http://127.0.0.1:3005/dich-vu/kham-lam-sang-tong-quat', { waitUntil: 'networkidle', timeout: 30000 });
  await desktopPage1.waitForTimeout(3000);
  await desktopPage1.evaluate(() => window.scrollTo(0, 500));
  await desktopPage1.waitForTimeout(1500);
  await desktopPage1.screenshot({ path: path.join(outDir, 'service-detail-fixed-desktop.png') });

  // 2.2 Lỗi 404 Desktop
  const desktopPage2 = await desktopContext.newPage();
  console.log('Chụp trang 404 (Desktop)...');
  await desktopPage2.goto('http://127.0.0.1:3005/404', { waitUntil: 'networkidle', timeout: 30000 });
  await desktopPage2.waitForTimeout(2000);
  await desktopPage2.screenshot({ path: path.join(outDir, '404-local-desktop-final.png') });

  await desktopBrowser.close();
  console.log('Chụp ảnh xác minh hoàn thành!');
}

verifyAll().catch(console.error);
