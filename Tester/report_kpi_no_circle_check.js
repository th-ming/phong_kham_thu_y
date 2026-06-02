const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:3001';
const outDir = path.resolve(__dirname, '..', 'Frontend', 'output', 'playwright');
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const logs = [];
  page.on('console', msg => logs.push({ type: msg.type(), text: msg.text() }));
  page.on('pageerror', err => logs.push({ type: 'pageerror', text: String(err) }));

  await page.goto(`${BASE_URL}/dang-nhap`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.getByPlaceholder('Tên đăng nhập').fill('admin');
  await page.getByPlaceholder('Mật khẩu').fill('admin@rexi.com');
  await page.getByRole('button', { name: /Đăng nhập ngay/i }).click();
  await page.waitForURL(/\/quan-ly\//, { timeout: 45000 }).catch(() => {});

  await page.goto(`${BASE_URL}/quan-ly/bao-cao-thong-ke`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  await page.waitForSelector('.report-kpi-card', { timeout: 30000 });
  await page.waitForTimeout(1000);

  const screenshot = path.join(outDir, 'report-kpi-no-circles.png');
  await page.screenshot({ path: screenshot, fullPage: false, timeout: 60000 });

  const kpiState = await page.$$eval('.report-kpi-card', cards => cards.map((card, index) => {
    const before = getComputedStyle(card, '::before');
    return {
      index: index + 1,
      text: card.textContent.replace(/\s+/g, ' ').trim(),
      beforeContent: before.content,
      beforeInset: before.inset,
      beforeLeft: before.left,
      beforeBottom: before.bottom,
      beforeMask: before.maskImage,
      beforeWebkitMask: before.webkitMaskImage,
      beforeWidth: before.width,
      beforeHeight: before.height,
    };
  }));

  const report = path.join(outDir, 'report-kpi-no-circles.json');
  fs.writeFileSync(report, JSON.stringify({
    url: page.url(),
    screenshot,
    kpiState,
    logs,
  }, null, 2), 'utf8');

  console.log(JSON.stringify({ screenshot, report, kpiState }, null, 2));
  await browser.close();
})().catch(error => {
  console.error(error);
  process.exit(1);
});
