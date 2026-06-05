const { chromium } = require('playwright');
const path = require('path');

const baseUrl = process.env.BASE_URL || 'http://localhost:3005';
const outDir = path.resolve(__dirname, '..', 'output', 'playwright');

const adminUser = {
  id: 'admin-evidence',
  id_nhan_vien: 'admin-evidence',
  role: 'admin',
  vai_tro: 'admin',
  ten_dang_nhap: 'admin',
  username: 'admin',
  ho_ten: 'Admin Rexi',
  display_name: 'Admin Rexi',
  displayName: 'Admin Rexi',
  email: 'admin@rexi.local'
};

const pages = [
  { name: 'admin-dashboard-mobile', path: '/quan-ly/dashboard' },
  { name: 'admin-sidebar-open-mobile', path: '/quan-ly/dashboard', openMenu: true },
  { name: 'admin-bao-cao-mobile', path: '/quan-ly/bao-cao-thong-ke' },
  { name: 'admin-lich-hen-mobile', path: '/quan-ly/lich-hen' },
  { name: 'admin-lich-lam-viec-mobile', path: '/quan-ly/lich-lam-viec' },
  { name: 'admin-nhan-su-mobile', path: '/quan-ly/nhan-vien-phan-quyen' },
  { name: 'admin-khach-hang-thu-cung-mobile', path: '/quan-ly/khach-hang-thu-cung' },
  { name: 'admin-kham-benh-mobile', path: '/quan-ly/kham-benh' },
  { name: 'admin-ho-so-benh-an-mobile', path: '/quan-ly/ho-so-benh-an' },
  { name: 'admin-kho-thuoc-mobile', path: '/quan-ly/kho-thuoc' },
  { name: 'admin-nhap-kho-mobile', path: '/quan-ly/nhap-kho' },
  { name: 'admin-hoa-don-mobile', path: '/quan-ly/hoa-don' },
  { name: 'admin-cau-hinh-mobile', path: '/quan-ly/cau-hinh' }
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  });

  const page = await context.newPage();

  // Perform actual login to get a valid backend JWT token
  console.log('Logging in to secure real credentials...');
  await page.goto(`${baseUrl}/dang-nhap`, { waitUntil: 'domcontentloaded' });
  await page.locator('[data-ai-id="input-dangnhapdangky-8dku"]').fill('admin');
  await page.locator('[data-ai-id="input-dangnhapdangky-h1ru"]').fill('admin@rexi.com');
  await page.locator('[data-ai-id="button-dangnhapdangky-xgfa"]').click();
  await page.waitForURL(/\/quan-ly\/dashboard/, { timeout: 20000 });
  console.log('Logged in successfully!');
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log(`console-error: ${msg.text()}`);
    }
  });

  const results = [];
  for (const item of pages) {
    const url = `${baseUrl}${item.path}`;
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1800);

    if (item.openMenu) {
      const menuButton = page.locator('[data-ai-id="button-sidebaradmin-mobile"]');
      if (await menuButton.count()) {
        await menuButton.first().click();
        await page.waitForTimeout(600);
      }
    }

    const filePath = path.join(outDir, `${item.name}.png`);
    await page.screenshot({ path: filePath, fullPage: false });
    results.push(filePath);
    console.log(filePath);
  }

  await browser.close();
  console.log(`captured=${results.length}`);
})();
