const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const outDir = path.resolve(__dirname, '..', 'output', 'playwright', 'mobile-fix-evidence');

async function capture404() {
  console.log('Chụp ảnh trang 404 trên Cloud (Mobile và Desktop)...');
  
  // 1. Mobile 404
  const browser1 = await chromium.launch({ headless: true });
  const context1 = await browser1.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  });
  const page1 = await context1.newPage();
  await page1.goto('https://rexi-vet-clinic.vercel.app/dich-vu/khong-ton-tai-dich-vu-nao-ca', { waitUntil: 'networkidle', timeout: 50000 });
  await page1.waitForTimeout(3000);
  const path404Mobile = path.join(outDir, '404-cloud-mobile.png');
  await page1.screenshot({ path: path404Mobile });
  console.log(`Đã chụp ảnh 404 Mobile: ${path404Mobile}`);
  await browser1.close();

  // 2. Desktop 404
  const browser2 = await chromium.launch({ headless: true });
  const context2 = await browser2.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2
  });
  const page2 = await context2.newPage();
  await page2.goto('https://rexi-vet-clinic.vercel.app/dich-vu/khong-ton-tai-dich-vu-nao-ca', { waitUntil: 'networkidle', timeout: 50000 });
  await page2.waitForTimeout(3000);
  const path404Desktop = path.join(outDir, '404-cloud-desktop.png');
  await page2.screenshot({ path: path404Desktop });
  console.log(`Đã chụp ảnh 404 Desktop: ${path404Desktop}`);
  await browser2.close();
}

capture404().catch(console.error);
