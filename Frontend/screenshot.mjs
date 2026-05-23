import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('http://localhost:3005');
  await page.waitForTimeout(2000);
  await page.evaluate(() => { document.documentElement.setAttribute('data-theme', 'dark'); });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'D:/QLy Phòng Khám Thú Y/Frontend/home_dark.png' });
  
  await page.goto('http://localhost:3005/khach-hang/hoa-don-thanh-toan');
  await page.waitForTimeout(2000);
  await page.evaluate(() => { document.documentElement.setAttribute('data-theme', 'dark'); });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'D:/QLy Phòng Khám Thú Y/Frontend/sidebar_dark.png' });
  
  await browser.close();
})();
