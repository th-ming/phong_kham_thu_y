const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const outDir = path.resolve(__dirname, '..', 'output', 'playwright', 'mobile-fix-evidence');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

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

const customerUser = {
  id: 'KH-FIX-001',
  id_khach_hang: 'KH-FIX-001',
  role: 'customer',
  vai_tro: 'customer',
  ten_khach_hang: 'Trần Hoàng Long',
  display_name: 'Trần Hoàng Long',
  ho_ten: 'Trần Hoàng Long',
  nam_sinh: 1998,
  sdt: '***REMOVED***-VIETQR_ACCOUNT_NO'
};

const mockRecord = {
  id_ho_so: 'HS-FIX-001',
  id_benh_an: 'BA-FIX-001',
  id_khach_hang: 'KH-FIX-001',
  ten_thu_cung: 'Milo',
  ten_khach_hang: 'Trần Hoàng Long',
  ten_bac_si: 'Bác sĩ Vũ Minh Đức',
  ngay_kham: '2026-06-11T08:30:00',
  trieu_chung: 'Kham tong quat, an uong binh thuong, khong ghi nhan bat thuong cap tinh.',
  chan_doan: 'Suc khoe on dinh sau tham kham',
  phac_do_dieu_tri: 'Theo doi tai nha trong 3 ngay. Tai kham neu co dau hieu met moi, bo an hoac sot.',
  huong_dan_cham_soc: 'Cho an thuc an mem, bo sung nuoc sach va giu am ve dem.',
  can_nang: 4.2,
  nhiet_do: 38.4
};

const mockInvoices = [
  {
    id_hoa_don: 'HD-FIX-001',
    id_khach_hang: 'KH-FIX-001',
    ten_khach_hang: 'Trần Hoàng Long',
    sdt: '***REMOVED***-VIETQR_ACCOUNT_NO',
    ngay_lap_hoa_don: '2026-06-11T08:30:00',
    tong_tien_cuoi: 350000,
    tong_tien_ban_dau: 350000,
    tong_giam_gia: 0,
    trang_thai: 'CHO_THANH_TOAN',
    ten_nhan_vien: 'Hệ thống'
  }
];

function json(body) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(body) };
}

async function installMocks(page) {
  await page.route('**/api/**', async (route) => {
    const url = route.request().url().toLowerCase();
    if (url.includes('/api/nhan-vien/profile/')) return route.fulfill(json({ ...adminUser, chuc_vu: 'Quan tri vien' }));
    if (url.includes('/api/khach-hang/profile/')) return route.fulfill(json(customerUser));
    if (url.includes('/api/ho-so-benh-an/xet-nghiem')) return route.fulfill(json([
      { id_xet_nghiem_benh_an: 'XN-001', id_ho_so: 'HS-FIX-001', ten_xet_nghiem: 'Xét nghiệm máu tổng quát', ten_bac_si: 'Vũ Minh Đức', ngay_lay_mau: '2026-06-11', trang_thai: 'hoan_thanh', ket_qua: 'Chỉ số bình thường' }
    ]));
    if (url.includes('/api/ho-so-benh-an/hs-fix-001') || url.includes('/api/ho-so-benh-an/detail/')) return route.fulfill(json(mockRecord));
    if (url.includes('/api/ho-so-benh-an')) return route.fulfill(json([mockRecord]));
    if (url.includes('/api/thu-cung')) return route.fulfill(json([
      { id_thu_cung: 'PET-001', ten_thu_cung: 'Milo', loai: 'Chuột', giong: 'Hamster' },
      { id_thu_cung: 'PET-002', ten_thu_cung: 'Bông', loai: 'Thỏ', giong: 'Angora' }
    ]));
    if (url.includes('/api/hoa-don/hd-fix-001') || url.includes('/api/hoa-don/detail/')) return route.fulfill(json(mockInvoices[0]));
    if (url.includes('/api/hoa-don')) return route.fulfill(json(mockInvoices));
    if (url.includes('/api/lich-hen/cho-xac-nhan') || url.includes('/api/lich-hen')) return route.fulfill(json([]));
    if (url.includes('/api/lich-su-tu-van')) return route.fulfill(json([]));
    return route.fulfill(json([]));
  });
}

async function captureEnv(baseUrl, envName) {
  console.log(`Bắt đầu chụp ảnh môi trường: ${envName} tại ${baseUrl}`);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  });

  const page = await context.newPage();
  await installMocks(page);

  const cb = baseUrl.includes('vercel.app') ? `?cb=${Date.now()}` : '';

  // 1. Đăng nhập
  console.log('Chụp trang Đăng nhập...');
  await page.goto(`${baseUrl}/dang-nhap${cb}`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, `${envName}-login.png`) });

  // 2. Dashboard Khách hàng & Sidebar (Bằng cách ghi localStorage)
  await context.addInitScript((user) => {
    window.localStorage.setItem('token', 'mock-token');
    window.localStorage.setItem('user', JSON.stringify(user));
  }, customerUser);

  console.log('Chụp Customer Dashboard...');
  await page.goto(`${baseUrl}/khach-hang/dashboard${cb}`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(outDir, `${envName}-dashboard-top.png`) });

  // Cuộn xuống chụp hotline
  await page.evaluate(() => window.scrollTo(0, 1100));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, `${envName}-dashboard-bottom.png`) });

  // Chụp Sidebar
  console.log('Chụp Sidebar Khách hàng...');
  await page.goto(`${baseUrl}/khach-hang/dashboard${cb}`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);
  const menuFab = page.locator('.customer-menu-fab, button[data-ai-id="button-sidebarkhachhang-u7rt"]');
  if (await menuFab.isVisible()) {
    await menuFab.click({ force: true });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, `${envName}-sidebar.png`) });
  }

  // 3. Chatbot
  console.log('Chụp Chatbot Suggestions...');
  await page.goto(`${baseUrl}/khach-hang/dashboard${cb}`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);
  const chatbotBtn = page.locator('#chatBtn');
  if (await chatbotBtn.isVisible()) {
    await chatbotBtn.click({ force: true });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, `${envName}-chatbot.png`) });
  }

  // 4. Admin Pages (Quản lý)
  await context.addInitScript((user) => {
    window.localStorage.setItem('token', 'mock-token');
    window.localStorage.setItem('user', JSON.stringify(user));
  }, adminUser);

  console.log('Chụp Xét nghiệm...');
  await page.goto(`${baseUrl}/quan-ly/xet-nghiem${cb}`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, `${envName}-xet-nghiem.png`) });

  console.log('Chụp Cấu hình hệ thống...');
  await page.goto(`${baseUrl}/quan-ly/cau-hinh${cb}`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);
  await page.evaluate(() => window.scrollTo(0, 1200));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, `${envName}-cau-hinh.png`) });

  console.log('Chụp Hồ sơ bệnh án detail...');
  await page.goto(`${baseUrl}/quan-ly/ho-so-benh-an/HS-FIX-001${cb}`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, `${envName}-record-detail-top.png`) });
  await page.evaluate(() => window.scrollTo(0, 750));
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, `${envName}-record-detail-mid.png`) });

  console.log('Chụp Quản lý hóa đơn...');
  await page.goto(`${baseUrl}/quan-ly/hoa-don${cb}`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, `${envName}-hoa-don-list.png`) });

  console.log('Chụp Kế toán Dashboard...');
  await page.goto(`${baseUrl}/quan-ly/ke-toan${cb}`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(outDir, `${envName}-ke-toan.png`) });

  await browser.close();
  console.log(`Đã hoàn tất chụp ảnh môi trường: ${envName}`);
}

(async () => {
  try {
    await captureEnv('http://127.0.0.1:3005', 'local');
    await captureEnv('https://rexi-vet-clinic.vercel.app', 'cloud');
    console.log('Tất cả ảnh minh chứng đã được cập nhật mới nhất!');
  } catch (err) {
    console.error('Lỗi chụp ảnh minh chứng thực tế:', err);
  }
})();
