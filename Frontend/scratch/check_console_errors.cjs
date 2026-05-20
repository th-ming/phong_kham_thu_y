const { chromium } = require('playwright');

(async () => {
  console.log('🐾 Bắt đầu kiểm tra chi tiết...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const consoleMsgs = [];
  page.on('console', msg => {
    consoleMsgs.push(`[${msg.type().toUpperCase()}] ${msg.text()}`);
  });
  
  page.on('pageerror', err => {
    consoleMsgs.push(`[PAGE_ERROR] ${err.message}\nStack: ${err.stack}`);
  });

  try {
    await page.goto('http://localhost:3005/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000); // Đợi 5 giây
    
    console.log('🐾 Tiêu đề trang:', await page.title());
    console.log('🐾 URL hiện tại:', page.url());
    console.log('🐾 --- NỘI DUNG HTML SƠ BỘ ---');
    const bodyHtml = await page.evaluate(() => document.body.innerHTML);
    console.log(bodyHtml.slice(0, 1000)); // In 1000 ký tự đầu của body
    console.log('🐾 ---------------------------');
    
  } catch (err) {
    console.error('❌ Lỗi kịch bản:', err);
  } finally {
    await browser.close();
  }
})();
