const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  await page.goto('http://localhost:3005');
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
  
  console.log('Clicking button...');
  await page.click('#chatBtn', { force: true });
  await page.waitForTimeout(2000);
  
  const windowVisible = await page.isVisible('#chatWindow');
  console.log('Window Visible:', windowVisible);
  
  if (windowVisible) {
      const box = await page.locator('#chatWindow').boundingBox();
      console.log('Window Bounding Box:', box);
  } else {
      const allHtml = await page.content();
      const requireFs = require('fs');
      requireFs.writeFileSync('debug_html.html', allHtml);
      console.log('Dumped HTML to debug_html.html');
  }
  
  await browser.close();
})();
