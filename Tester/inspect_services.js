const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  try {
    const response = await page.goto('http://127.0.0.1:3005/api/dich-vu');
    const text = await response.text();
    console.log('Services response:', text.substring(0, 1000));
  } catch (e) {
    console.error('Error fetching services:', e);
  }
  await browser.close();
})();
