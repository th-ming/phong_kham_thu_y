const { chromium } = require('playwright');

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

async function checkElements() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true
  });
  const page = await context.newPage();
  
  await page.route('**/api/dich-vu', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(servicesMock) });
  });
  await page.route('**/api/**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
  });

  await page.goto('http://127.0.0.1:3005/dich-vu/kham-lam-sang-tong-quat', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(2000);

  const chatbotInfo = await page.evaluate(() => {
    const btn = document.querySelector('#chatBtn');
    if (!btn) return 'Chat button not found in DOM';
    const rect = btn.getBoundingClientRect();
    const style = window.getComputedStyle(btn);
    return {
      tagName: btn.tagName,
      visible: rect.width > 0 && rect.height > 0 && style.display !== 'none',
      bottom: style.bottom,
      right: style.right,
      rect: { y: rect.y, x: rect.x, width: rect.width, height: rect.height }
    };
  });

  const scrollToTopInfo = await page.evaluate(() => {
    const btn = document.querySelector('.scroll-to-top-glass');
    if (!btn) return 'Scroll to top button not found in DOM';
    const rect = btn.getBoundingClientRect();
    const style = window.getComputedStyle(btn);
    return {
      tagName: btn.tagName,
      visible: rect.width > 0 && rect.height > 0 && style.display !== 'none',
      bottom: style.bottom,
      left: style.left,
      rect: { y: rect.y, x: rect.x, width: rect.width, height: rect.height }
    };
  });

  console.log('Chatbot element status:', chatbotInfo);
  console.log('Scroll to top element status:', scrollToTopInfo);
  await browser.close();
}

checkElements().catch(console.error);
