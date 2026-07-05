const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh'
  });
  const page = await context.newPage();

  await page.goto('https://rexi-vet-clinic.vercel.app/dang-nhap', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(2000);
  const inputs = await page.$$('input');
  await inputs[0].fill('admin');
  await inputs[1].fill('admin@rexi.com');
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await btn.textContent();
    if (text.includes('Đăng nhập') || text.includes('đăng nhập')) { await btn.click(); break; }
  }
  await page.waitForTimeout(5000);
  console.log(`URL sau login: ${page.url()}\n`);

  // Lấy tất cả links và navigation trên trang
  const navLinks = await page.$$('a');
  console.log(`=== NAV LINKS (${navLinks.length}) ===`);
  for (const link of navLinks) {
    const href = await link.getAttribute('href');
    const text = await link.textContent();
    if (text && text.trim() && href && href.includes('admin')) {
      console.log(`  ${href} → "${text.trim().substring(0, 60)}"`);
    }
  }

  // Check current page content
  console.log('\n=== CURRENT PAGE CONTENT ===');
  const bodyText = await page.textContent('body');
  const lines = bodyText.split('\n').map(l => l.trim()).filter(l => l.length > 0 && l.length < 200);
  for (const l of lines.slice(0, 100)) {
    if (l.includes('admin') || l.includes('dashboard') || l.includes('menu') || l.includes('sidebar') || l.includes('nav')) {
      console.log(`  "${l.substring(0, 120)}"`);
    }
  }

  // Check all URLs that render correctly
  console.log('\n=== TEST URL PATTERNS ===');
  const urls = [
    '/admin/dashboard',                          // base admin dashboard
    '/quan-ly/dashboard',                         // after-login redirect
    '/admin/dashboard?tab=accountant',
    '/admin/dashboard#accountant',
    '/admin/thong-ke/bao-cao',
    '/admin/bao-cao',
  ];

  for (const path of urls) {
    const url = `https://rexi-vet-clinic.vercel.app${path}`;
    try {
      await page.goto(url, { waitUntil: 'load', timeout: 15000 });
      await page.waitForTimeout(1000);
      const text = await page.textContent('body');
      const snippets = text.match(/(doanh.thu|tổng.doanh|tổng.số|lịch.hẹn|hóa.đơn|thú.cưng|thống.kê|báo.cáo|dashboard|admin|quản.lý)/gi) || [];
      console.log(`[${path}] loaded, snippets: [${[...new Set(snippets)].join(', ')}] (${text.length} chars)`);
    } catch (e) {
      console.log(`[${path}] FAILED: ${e.message}`);
    }
  }

  await browser.close();
})();