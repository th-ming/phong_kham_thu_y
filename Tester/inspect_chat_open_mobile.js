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
  
  await page.route('**/api/**', async (route) => {
    const url = route.request().url();
    if (url.includes('/api/dich-vu')) {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(servicesMock) });
    } else {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    }
  });

  await page.goto('http://127.0.0.1:3005/dich-vu/kham-lam-sang-tong-quat', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  // Click chatbot button
  await page.locator('#chatBtn').click({ force: true });
  await page.waitForTimeout(2000);

  const stats = await page.evaluate(() => {
    const chatWin = document.querySelector('#chatWindow');
    if (!chatWin) return 'Chat window not found';
    
    const winRect = chatWin.getBoundingClientRect();
    const style = window.getComputedStyle(chatWin);
    
    const rexiBtn = document.querySelector('[data-ai-id="button-chatbot-jdzj"]');
    const rexiRect = rexiBtn ? rexiBtn.getBoundingClientRect() : null;

    return {
      windowRect: {
        top: winRect.top,
        left: winRect.left,
        width: winRect.width,
        height: winRect.height,
        bottom: winRect.bottom
      },
      windowStyle: {
        transform: style.transform,
        bottom: style.bottom,
        left: style.left,
        right: style.right,
        position: style.position,
        height: style.height
      },
      rexiBtnRect: rexiRect ? {
        top: rexiRect.top,
        left: rexiRect.left,
        width: rexiRect.width,
        height: rexiRect.height,
        bottom: rexiRect.bottom
      } : 'Button not found'
    };
  });

  console.log(JSON.stringify(stats, null, 2));
  await browser.close();
})();
