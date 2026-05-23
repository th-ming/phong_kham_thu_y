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
    
    console.log('Waiting for chatBtn...');
    await page.waitForSelector('#chatBtn', { timeout: 5000 });
    
    console.log('Taking screenshot of closed state...');
    await page.screenshot({ path: 'screenshot_closed.png' });
    
    console.log('Clicking chatBtn...');
    await page.click('#chatBtn');
    
    console.log('Waiting for chat window to open...');
    await page.waitForTimeout(1000);
    
    console.log('Taking screenshot of open state...');
    await page.screenshot({ path: 'screenshot_open.png' });
    
    console.log('Done!');
  } catch (error) {
    console.error('Error during execution:', error);
  } finally {
    await browser.close();
  }
})();
