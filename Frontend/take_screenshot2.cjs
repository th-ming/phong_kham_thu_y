const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  try {
    console.log('Navigating to http://localhost:3005 ...');
    await page.goto('http://localhost:3005');
    
    console.log('Waiting for network idle...');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    console.log('Clicking chatBtn with force...');
    await page.click('#chatBtn', { force: true });
    
    console.log('Waiting for chat window to open...');
    await page.waitForTimeout(2000);
    
    console.log('Taking screenshot of open state...');
    await page.screenshot({ path: 'C:\\Users\\84916\\.gemini\\antigravity\\brain\\545b1417-b4c9-48ff-b330-84ac2a4a6547\\screenshot_open_fixed.png' });
    
    console.log('Done!');
  } catch (error) {
    console.error('Error during execution:', error);
  } finally {
    await browser.close();
  }
})();
