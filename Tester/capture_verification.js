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
  await page.route('**/api/dich-vu', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(servicesMock)
    });
  });
  await page.route('**/api/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([])
    });
  });
}

async function verifyAll() {
  console.log('Bắt đầu chụp ảnh xác minh...');

  // 1. Chụp TRANG CHI TIẾT DỊCH VỤ (Xem có bị hỏng gì không)
  const browser1 = await chromium.launch({ headless: true });
  const context1 = await browser1.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  });
  const page1 = await context1.newPage();
  await installMocks(page1);

  console.log('Chụp trang dịch vụ hợp lệ...');
  await page1.goto('http://127.0.0.1:3005/dich-vu/kham-lam-sang-tong-quat', { waitUntil: 'networkidle', timeout: 30000 });
  await page1.waitForTimeout(2000);
  await page1.evaluate(() => window.scrollTo(0, 500));
  await page1.waitForTimeout(1000);
  await page1.screenshot({ path: path.join(outDir, 'service-detail-fixed-mobile.png') });
  await browser1.close();

  // 2. Chụp TRANG 404 (Xem có vừa vặn và không có header/footer không)
  const browser2 = await chromium.launch({ headless: true });
  const context2 = await browser2.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  });
  const page2 = await context2.newPage();
  console.log('Chụp trang 404...');
  await page2.goto('http://127.0.0.1:3005/404', { waitUntil: 'networkidle', timeout: 30000 });
  await page2.waitForTimeout(2000);
  await page2.screenshot({ path: path.join(outDir, '404-local-mobile-final.png') });
  await browser2.close();

  console.log('Chụp ảnh xác minh hoàn thành!');
}

verifyAll().catch(console.error);
