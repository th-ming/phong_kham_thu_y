const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const outDir = path.resolve(__dirname, '..', 'output', 'playwright', 'mobile-fix-evidence');

async function captureCloud() {
  console.log('Chụp ảnh Cloud (Mobile - Sau khi deploy)...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  });
  const page = await context.newPage();
  
  // Go to cloud service detail page
  await page.goto('https://rexi-vet-clinic.vercel.app/dich-vu/kham-lam-sang-tong-quat', { waitUntil: 'networkidle', timeout: 50000 });
  await page.waitForTimeout(3000);
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(1500);

  const cloudPath = path.join(outDir, 'service-detail-cloud.png');
  await page.screenshot({ path: cloudPath });
  console.log(`Đã chụp ảnh Cloud Mobile: ${cloudPath}`);
  await browser.close();
}

captureCloud().catch(console.error);
