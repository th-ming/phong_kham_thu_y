const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  try {
    console.log('Navigating...');
    await page.goto('http://localhost:3005');
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});
    
    console.log('Clicking chatBtn...');
    await page.click('#chatBtn', { force: true });
    await page.waitForTimeout(2000);
    
    const boundingBox = await page.evaluate(() => {
        const cw = document.getElementById('chatWindow');
        if (!cw) return null;
        const rect = cw.getBoundingClientRect();
        return {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            right: rect.right,
            bottom: rect.bottom,
            computedStyle: {
               position: window.getComputedStyle(cw).position,
               right: window.getComputedStyle(cw).right,
               bottom: window.getComputedStyle(cw).bottom,
               transform: window.getComputedStyle(cw).transform
            }
        };
    });
    
    console.log('ChatWindow Bounding Box:', boundingBox);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();
