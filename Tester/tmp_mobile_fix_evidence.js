const { chromium } = require('playwright');
const path = require('path');

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:3005';
const outDir = path.resolve(__dirname, '..', 'output', 'playwright', 'mobile-fix-evidence');

const adminUser = {
  id: 'ADMIN-MOBILE-FIX',
  id_nhan_vien: 'ADMIN-MOBILE-FIX',
  id_tai_khoan: 'ADMIN-MOBILE-FIX',
  role: 'admin',
  vai_tro: 'admin',
  chuc_vu: 'admin',
  ten_dang_nhap: 'admin',
  username: 'admin',
  ho_ten: 'Admin Rexi',
  display_name: 'Admin Rexi',
  displayName: 'Admin Rexi',
  email: 'admin@rexi.local'
};

const record = {
  id_ho_so: 'HS-FIX-001',
  id_benh_an: 'BA-FIX-001',
  id_khach_hang: 'KH-FIX-001',
  ten_thu_cung: 'Milo',
  ten_khach_hang: 'Tran Minh',
  ten_bac_si: 'Bac si Thu Minh',
  ngay_kham: '2026-06-11T08:30:00',
  trieu_chung: 'Kham tong quat, an uong binh thuong, khong ghi nhan bat thuong cap tinh.',
  chan_doan: 'Suc khoe on dinh sau tham kham',
  phac_do_dieu_tri: 'Theo doi tai nha trong 3 ngay. Tai kham neu co dau hieu met moi, bo an hoac sot.',
  huong_dan_cham_soc: 'Cho an thuc an mem, bo sung nuoc sach va giu am ve dem.',
  can_nang: 4.2,
  nhiet_do: 38.4
};

function json(body) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(body) };
}

async function installMocks(page) {
  await page.route('**/api/**', async (route) => {
    const url = route.request().url().toLowerCase();
    if (url.includes('/api/nhan-vien/profile/')) return route.fulfill(json({ ...adminUser, chuc_vu: 'Quan tri vien' }));
    if (url.includes('/api/ho-so-benh-an/xet-nghiem')) return route.fulfill(json([
      { id_xet_nghiem_benh_an: 'XN-2', id_ho_so: 'HS-HS-16BF388F', ten_xet_nghiem: 'DV-KDK', ten_bac_si: 'Vu Minh Duc', ngay_lay_mau: '2026-06-01', trang_thai: 'hoan_thanh', ket_qua_tong_quat: 'Chi so on dinh' }
    ]));
    if (url.includes('/api/ho-so-benh-an/hs-fix-001')) return route.fulfill(json(record));
    if (url.includes('/api/lich-su-tu-van/khach-hang/kh-fix-001')) return route.fulfill(json([]));
    if (url.includes('/api/ho-so-benh-an')) return route.fulfill(json([record]));
    return route.fulfill(json([]));
  });
}

async function scrollAdmin(page, y) {
  await page.evaluate((scrollY) => {
    const scroller = document.querySelector('.admin-main-content') || document.scrollingElement || document.documentElement;
    scroller.scrollTo(0, scrollY);
    window.scrollTo(0, scrollY);
  }, y);
  await page.waitForTimeout(350);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  });
  await context.addInitScript((user) => {
    window.localStorage.setItem('token', 'admin-mobile-fix-token');
    window.localStorage.setItem('user', JSON.stringify(user));
  }, adminUser);
  const page = await context.newPage();
  await installMocks(page);

  await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1800);
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, 'home-footer-mobile-after.png'), fullPage: false });

  await page.goto(`${baseUrl}/quan-ly/xet-nghiem`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1600);
  await page.screenshot({ path: path.join(outDir, 'admin-xet-nghiem-mobile-after.png'), fullPage: false });

  await page.goto(`${baseUrl}/quan-ly/ho-so-benh-an/HS-FIX-001`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1600);
  await page.screenshot({ path: path.join(outDir, 'admin-record-detail-mobile-top-after.png'), fullPage: false });
  await scrollAdmin(page, 760);
  await page.screenshot({ path: path.join(outDir, 'admin-record-detail-mobile-mid-after.png'), fullPage: false });

  await browser.close();
  console.log(outDir);
})();
