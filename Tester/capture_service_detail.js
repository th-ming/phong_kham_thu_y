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

async function captureStep1() {
  console.log('Bắt đầu chụp ảnh trước deploy...');

  // 1. Chụp Cloud Mobile (Hiện tại là ảnh lỗi)
  const browser1 = await chromium.launch({ headless: true });
  const context1 = await browser1.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  });
  const page1 = await context1.newPage();
  console.log('Truy cập trang chi tiết dịch vụ trên Cloud (Mobile - LỖI CŨ)...');
  await page1.goto('https://rexi-vet-clinic.vercel.app/dich-vu/kham-lam-sang-tong-quat', { waitUntil: 'networkidle', timeout: 40000 });
  await page1.waitForTimeout(3000);
  await page1.evaluate(() => window.scrollTo(0, 500));
  await page1.waitForTimeout(1500);
  const errorPath = path.join(outDir, 'service-detail-error.png');
  await page1.screenshot({ path: errorPath });
  console.log(`Đã chụp ảnh Lỗi cũ (Cloud trước deploy): ${errorPath}`);
  await browser1.close();

  // 2. Chụp Local Mobile (Đã sửa lỗi)
  const browser2 = await chromium.launch({ headless: true });
  const context2 = await browser2.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  });
  const page2 = await context2.newPage();
  await installMocks(page2);
  console.log('Truy cập trang chi tiết dịch vụ trên Local (Mobile - ĐÃ SỬA)...');
  await page2.goto('http://127.0.0.1:3005/dich-vu/kham-lam-sang-tong-quat', { waitUntil: 'networkidle', timeout: 30000 });
  await page2.waitForTimeout(2000);
  await page2.evaluate(() => window.scrollTo(0, 500));
  await page2.waitForTimeout(1000);
  const localPath = path.join(outDir, 'service-detail-local.png');
  await page2.screenshot({ path: localPath });
  console.log(`Đã chụp ảnh Local Mobile: ${localPath}`);
  await browser2.close();

  // 3. Chụp Desktop (Local / Cloud giống nhau)
  const browser3 = await chromium.launch({ headless: true });
  const context3 = await browser3.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });
  const page3 = await context3.newPage();
  await installMocks(page3);
  console.log('Truy cập trang chi tiết dịch vụ trên Desktop...');
  await page3.goto('http://127.0.0.1:3005/dich-vu/kham-lam-sang-tong-quat', { waitUntil: 'networkidle', timeout: 30000 });
  await page3.waitForTimeout(2000);
  await page3.evaluate(() => window.scrollTo(0, 500));
  await page3.waitForTimeout(1000);
  const desktopPath = path.join(outDir, 'service-detail-desktop.png');
  await page3.screenshot({ path: desktopPath });
  console.log(`Đã chụp ảnh Desktop: ${desktopPath}`);
  await browser3.close();

  console.log('Xong bước 1!');
}

captureStep1().catch(console.error);
