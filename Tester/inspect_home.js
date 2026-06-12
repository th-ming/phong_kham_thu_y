const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:3005/');
  await page.waitForTimeout(4000);
  const exists = await page.evaluate(() => document.querySelector('#chatBtn') !== null);
  console.log('Chatbot exists on Home page:', exists);
  await browser.close();
})();
