const { chromium } = require('playwright');
const path = require('path');

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:3005';
const outDir = path.resolve(__dirname, '..', 'output', 'playwright', 'admin-mobile-audit');

const adminUser = {
  id: 'ADMIN-AUDIT',
  id_nhan_vien: 'ADMIN-AUDIT',
  id_tai_khoan: 'ADMIN-AUDIT',
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

const routes = [
  ['dashboard', '/quan-ly/dashboard'],
  ['lich-lam-viec', '/quan-ly/lich-lam-viec'],
  ['thong-tin-ca-nhan', '/quan-ly/thong-tin-ca-nhan'],
  ['lich-hen', '/quan-ly/lich-hen'],
  ['khach-hang-thu-cung', '/quan-ly/khach-hang-thu-cung'],
  ['ho-so-benh-an', '/quan-ly/ho-so-benh-an'],
  ['kham-benh', '/quan-ly/kham-benh'],
  ['don-thuoc', '/quan-ly/don-thuoc'],
  ['xet-nghiem', '/quan-ly/xet-nghiem'],
  ['file-dinh-kem', '/quan-ly/file-dinh-kem'],
  ['hoa-don', '/quan-ly/hoa-don'],
  ['ke-toan', '/quan-ly/ke-toan'],
  ['bao-cao-thong-ke', '/quan-ly/bao-cao-thong-ke'],
  ['nhap-kho', '/quan-ly/nhap-kho'],
  ['kho-thuoc', '/quan-ly/kho-thuoc'],
  ['nhan-vien-phan-quyen', '/quan-ly/nhan-vien-phan-quyen'],
  ['cau-hinh', '/quan-ly/cau-hinh'],
  ['chuc-nang', '/quan-ly/chuc-nang'],
  ['dich-vu', '/quan-ly/dich-vu'],
  ['marketing', '/quan-ly/marketing']
];

const staff = [
  {
    id_nhan_vien: 'BS-001',
    ho_ten: 'Bác sĩ Kiểm thử',
    chuyen_mon: 'Bác sĩ',
    chuc_vu: 'Bác sĩ',
    email: 'bs@rexi.local',
    so_dien_thoai: '0901234567',
    trang_thai: 'ACTIVE'
  },
  {
    id_nhan_vien: 'KT-001',
    ho_ten: 'Kế toán Rexi',
    chuyen_mon: 'Kế toán tài chính',
    chuc_vu: 'Kế toán',
    email: 'kt@rexi.local',
    so_dien_thoai: '0907654321',
    trang_thai: 'ACTIVE'
  }
];

const medicines = [
  { id_thuoc: 'T001', ma_thuoc: 'AMOX-250', ten_thuoc: 'Amoxicillin 250mg', thanh_phan: 'Amoxicillin', dang_bao_che: 'Viên nén', loai_thuoc: 'Kháng sinh', don_vi: 'Hộp', don_vi_tinh: 'Hộp', gia_ban: 125000 },
  { id_thuoc: 'T002', ma_thuoc: 'VIT-C', ten_thuoc: 'Vitamin C thú y', thanh_phan: 'Acid ascorbic', dang_bao_che: 'Dung dịch', loai_thuoc: 'Bổ sung', don_vi: 'Chai', don_vi_tinh: 'Chai', gia_ban: 89000 }
];

const batches = [
  { id_lo: 'L001', id_thuoc: 'T001', so_lo: 'LOT-2026-001', ngay_nhap: '2026-05-31', han_su_dung: '2027-12-31', so_luong_nhap: 120, so_luong_ton: 38, gia_nhap: 85000 },
  { id_lo: 'L002', id_thuoc: 'T002', so_lo: 'LOT-2026-002', ngay_nhap: '2026-06-01', han_su_dung: '2027-11-30', so_luong_nhap: 80, so_luong_ton: 7, gia_nhap: 52000 }
];

const appointments = [
  {
    id_lich_hen: 'LH-001',
    thoi_gian_bat_dau: '2026-07-11T08:00:00',
    ngay_hen: '2026-07-11',
    gio_hen: '08:00',
    ten_khach_hang: 'Khách kiểm thử',
    ten_thu_cung: 'Milo',
    so_dien_thoai: '0900000000',
    trang_thai: 'CHO_XAC_NHAN',
    id_bac_si: 'BS-001',
    id_thu_cung: 'PET-001'
  }
];

const records = [
  { id_ho_so: 'HS-001', id_benh_an: 'BA-001', ten_thu_cung: 'Milo', ten_khach_hang: 'Khách kiểm thử', ngay_kham: '2026-06-05', chan_doan: 'Kiểm tra tổng quát' }
];

const invoices = [
  { id_hoa_don: 'HD-001', ten_khach_hang: 'Khách kiểm thử', tong_tien_cuoi: 480000, trang_thai: 'CHUA_THANH_TOAN', ngay_tao: '2026-06-05' }
];

function json(body) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(body) };
}

async function installMocks(page) {
  await page.route('**/api/**', async (route) => {
    const url = route.request().url().toLowerCase();
    if (url.includes('/api/nhan-vien/profile/')) return route.fulfill(json({ ...staff[1], id_nhan_vien: 'ADMIN-AUDIT', ho_ten: 'Admin Rexi', chuc_vu: 'Quản trị viên' }));
    if (url.includes('/api/nhan-vien/lich-lam-viec')) return route.fulfill(json([
      { id_lich_lam_viec: 'LLV-001', id_nhan_vien: 'BS-001', ngay_lam: '2026-06-08', gio_bat_dau: '08:00:00', gio_ket_thuc: '12:00:00' }
    ]));
    if (url.includes('/api/nhan-vien')) return route.fulfill(json(staff));
    if (url.includes('/api/kho/thuoc')) return route.fulfill(json(medicines));
    if (url.includes('/api/kho/lo-thuoc')) return route.fulfill(json(batches));
    if (url.includes('/api/lich-hen')) return route.fulfill(json(appointments));
    if (url.includes('/api/benh-an') || url.includes('/api/ho-so')) return route.fulfill(json(records));
    if (url.includes('/api/hoa-don')) return route.fulfill(json(invoices));
    if (url.includes('/api/dich-vu')) return route.fulfill(json([{ id_dich_vu: 'DV-001', ten_dich_vu: 'Khám tổng quát', gia: 120000, trang_thai: true }]));
    if (url.includes('/api/thu-cung')) return route.fulfill(json([{ id_thu_cung: 'PET-001', ten_thu_cung: 'Milo', loai: 'Chó' }]));
    if (url.includes('/api/khach-hang')) return route.fulfill(json([{ id_khach_hang: 'KH-001', ho_ten: 'Khách kiểm thử', so_dien_thoai: '0900000000', email: 'khach@rexi.local' }]));
    if (url.includes('/api/report') || url.includes('/api/thong-ke') || url.includes('/api/dashboard')) {
      return route.fulfill(json({ tongDoanhThu: 480000, tongCaDieuTri: 12, khachHang: 45, appointmentsToday: 5, totalRevenue: 480000 }));
    }
    return route.fulfill(json([]));
  });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  });

  await context.addInitScript((user) => {
    window.localStorage.setItem('token', 'admin-mobile-audit-token');
    window.localStorage.setItem('user', JSON.stringify(user));
  }, adminUser);

  const page = await context.newPage();
  await installMocks(page);

  const results = [];
  for (const [name, routePath] of routes) {
    await page.goto(`${baseUrl}${routePath}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1200);

    const metrics = await page.evaluate(() => {
      const viewport = document.documentElement.clientWidth;
      const main = document.querySelector('.admin-main-content') || document.body;
      const wide = Array.from(main.querySelectorAll('*'))
        .map((el) => {
          const rect = el.getBoundingClientRect();
          return {
            tag: el.tagName.toLowerCase(),
            cls: typeof el.className === 'string' ? el.className.slice(0, 90) : '',
            text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 80),
            width: Math.round(rect.width),
            left: Math.round(rect.left),
            right: Math.round(rect.right)
          };
        })
        .filter((item) => item.width > viewport + 6 || item.left < -6 || item.right > viewport + 6)
        .slice(0, 8);
      const h1 = document.querySelector('h1');
      return {
        scrollWidth: document.documentElement.scrollWidth,
        viewport,
        h1: h1 ? h1.textContent.trim().replace(/\s+/g, ' ') : '',
        wide
      };
    });

    const filePath = path.join(outDir, `${name}.png`);
    await page.screenshot({ path: filePath, fullPage: false });
    results.push({ name, routePath, filePath, metrics });
    console.log(`${name} ${routePath} scroll=${metrics.scrollWidth}/${metrics.viewport} h1="${metrics.h1}" wide=${metrics.wide.length}`);
    metrics.wide.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.tag}.${item.cls} w=${item.width} left=${item.left} right=${item.right} text="${item.text}"`);
    });
  }

  await browser.close();
  console.log(`captured=${results.length}`);
})();
