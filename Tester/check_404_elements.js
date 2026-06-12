const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://127.0.0.1:3005/404');
  await page.waitForTimeout(2000);
  const html = await page.content();
  console.log('Has header:', html.includes('<header') || html.includes('class="header"') || html.includes('id="header"'));
  console.log('Has footer:', html.includes('<footer') || html.includes('class="footer"') || html.includes('id="footer"'));
  await browser.close();
})();
