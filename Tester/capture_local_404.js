const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const outDir = path.resolve(__dirname, '..', 'output', 'playwright', 'mobile-fix-evidence');

const servicesMock = []; // Return empty so it triggers 404

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

async function captureLocal404() {
  console.log('Chụp ảnh 404 local...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  });
  
  const page = await context.newPage();
  await installMocks(page);

  // Go to local invalid service slug
  console.log('Truy cập trang dịch vụ lỗi trên Local...');
  await page.goto('http://127.0.0.1:3005/dich-vu/kham-lam-sang-tong-quat', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(4000);
  
  const pathLocal404 = path.join(outDir, '404-local-mobile-fixed.png');
  await page.screenshot({ path: pathLocal404 });
  console.log(`Đã chụp ảnh 404 Local Mobile: ${pathLocal404}`);
  await browser.close();
}

captureLocal404().catch(console.error);
