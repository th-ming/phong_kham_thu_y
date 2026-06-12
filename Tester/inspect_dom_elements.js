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

async function inspectDOM() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true
  });
  const page = await context.newPage();
  
  await page.route('**/api/**', async (route) => {
    const url = route.request().url();
    if (url.includes('/api/dich-vu')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(servicesMock) });
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    }
  });

  await page.goto('http://127.0.0.1:3005/dich-vu/kham-lam-sang-tong-quat');
  await page.waitForTimeout(4000);

  // Scroll to show scroll-to-top button
  await page.evaluate(() => window.scrollTo(0, 600));
  await page.waitForTimeout(1000);

  const chatbotInfo = await page.evaluate(() => {
    const btn = document.querySelector('#chatBtn');
    if (!btn) return 'Chat button not found in DOM';
    const rect = btn.getBoundingClientRect();
    const style = window.getComputedStyle(btn);
    return {
      visible: rect.width > 0 && rect.height > 0 && style.display !== 'none',
      bottom: style.bottom,
      right: style.right
    };
  });

  const scrollToTopInfo = await page.evaluate(() => {
    const btn = document.querySelector('.scroll-to-top-glass');
    if (!btn) return 'Scroll to top button not found in DOM';
    const rect = btn.getBoundingClientRect();
    const style = window.getComputedStyle(btn);
    return {
      visible: rect.width > 0 && rect.height > 0 && style.display !== 'none',
      bottom: style.bottom,
      left: style.left
    };
  });

  console.log('Chatbot element status:', chatbotInfo);
  console.log('Scroll to top element status:', scrollToTopInfo);
  await browser.close();
}

inspectDOM().catch(console.error);
