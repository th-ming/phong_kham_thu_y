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

(async () => {
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

  await page.goto('http://127.0.0.1:3005/dich-vu/kham-lam-sang-tong-quat', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // Click chatbot button
  await page.locator('#chatBtn').click({ force: true });
  await page.waitForTimeout(2000);

  // Click the second tab (Rexi Agent)
  // The tab is: <button> Rexi Agent
  console.log('Switching to Rexi Agent tab...');
  await page.getByRole('button', { name: /Rexi Agent/i }).click({ force: true });
  await page.waitForTimeout(2000);

  // Take screenshot
  const screenshotPath = path.join(outDir, 'service-detail-chat-agent-mobile.png');
  await page.screenshot({ path: screenshotPath });
  console.log('Saved agent tab screenshot to:', screenshotPath);

  await browser.close();
})();
