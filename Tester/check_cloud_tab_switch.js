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

  // Go to live website with cache bypass
  await page.goto(`https://rexi-vet-clinic.vercel.app/dich-vu/kham-lam-sang-tong-quat?t=${Date.now()}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(4000);

  // Open chat
  await page.locator('#chatBtn').click({ force: true });
  await page.waitForTimeout(2000);

  // Take screenshot of standard chat
  await page.screenshot({ path: path.join(outDir, 'cloud-chat-standard-mobile.png') });
  console.log('Saved cloud standard chat screenshot');

  // Switch to Rexi Agent tab
  console.log('Switching to Rexi Agent tab on Cloud...');
  await page.getByRole('button', { name: /Rexi Agent/i }).click({ force: true });
  await page.waitForTimeout(2000);

  // Take screenshot of agent chat
  await page.screenshot({ path: path.join(outDir, 'cloud-chat-agent-mobile.png') });
  console.log('Saved cloud agent chat screenshot');

  // Check positions of both
  const chatWindowStyle = await page.evaluate(() => {
    const el = document.querySelector('#chatWindow');
    if (!el) return 'Chat window not found';
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return {
      rect: { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, width: rect.width, height: rect.height },
      style: {
        position: style.position,
        left: style.left,
        right: style.right,
        bottom: style.bottom,
        transform: style.transform,
        width: style.width,
        height: style.height
      }
    };
  });
  console.log('Cloud Chat window details:', JSON.stringify(chatWindowStyle, null, 2));

  await browser.close();
})();
