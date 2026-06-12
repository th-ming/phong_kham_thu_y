const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const outDir = path.resolve(__dirname, '..', 'output', 'playwright', 'mobile-fix-evidence');

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
  await installMocks(page);
  
  // Go to cloud service detail page
  await page.goto(`https://rexi-vet-clinic.vercel.app/dich-vu/kham-lam-sang-tong-quat?t=${Date.now()}`, { waitUntil: 'networkidle', timeout: 50000 });
  await page.waitForTimeout(4000);
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(2000);

  const cloudPath = path.join(outDir, 'service-detail-cloud.png');
  await page.screenshot({ path: cloudPath });
  console.log(`Đã chụp ảnh Cloud Mobile: ${cloudPath}`);
  await browser.close();
}

captureCloud().catch(console.error);
