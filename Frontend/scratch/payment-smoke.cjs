const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));

  await page.goto('http://localhost:3001/dang-nhap', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  console.log('login inputs:', await page.locator('input').count());
  await page.locator('input').nth(0).waitFor({ state: 'visible', timeout: 10000 });
  await page.locator('input').nth(0).fill('testcustomer2');
  await page.locator('input').nth(1).fill('Password123!');
  await page.locator('button[type="submit"]').click();
  await page.waitForTimeout(2500);

  await page.goto('http://localhost:3001/khach-hang/hoa-don-thanh-toan', { waitUntil: 'networkidle' });
  const sessionState = await page.evaluate(() => ({
    url: window.location.href,
    hasToken: Boolean(localStorage.getItem('token')),
    user: localStorage.getItem('user')
  }));
  console.log(JSON.stringify({ sessionState, title: await page.title() }, null, 2));

  await page.waitForSelector('text=HD-PAYTEST', { timeout: 10000 });
  await page.waitForSelector('text=VietQR', { timeout: 10000 });
  await page.locator('button').filter({ hasText: /VietQR/i }).first().click();
  await page.waitForSelector('img[alt="VietQR"]', { timeout: 10000 });
  await page.screenshot({ path: 'artifacts/payment-smoke.png', fullPage: true });

  const visibleInvoice = await page.locator('text=HD-PAYTEST').count();
  const visibleQr = await page.locator('img[alt="VietQR"]').count();
  console.log(JSON.stringify({ sessionState, visibleInvoice, visibleQr, errors: errors.slice(0, 5) }, null, 2));
  await browser.close();
})().catch(err => {
  // Best-effort failure capture for local diagnosis.
  console.error(err);
  process.exit(1);
});
