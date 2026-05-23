const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Mobile screenshot
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('http://localhost:3008');
  await page.waitForTimeout(10000);
  
  // Dump HTML
  const html = await page.content();
  require('fs').writeFileSync('page_dump.html', html);

  await page.screenshot({ path: 'screenshot_mobile.png', fullPage: true });

  // Desktop screenshot
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.screenshot({ path: 'screenshot_desktop.png', fullPage: true });

  await browser.close();
})();
