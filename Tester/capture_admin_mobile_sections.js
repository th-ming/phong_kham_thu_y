const { chromium } = require('playwright');
const path = require('path');

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:3005';
const outDir = path.resolve(__dirname, '..', 'output', 'playwright', 'admin-mobile-sections');

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

const staff = [
  { id_nhan_vien: 'BS-001', ho_ten: 'Bác sĩ Kiểm thử', chuyen_mon: 'Bác sĩ', chuc_vu: 'Bác sĩ', email: 'bs@rexi.local', so_dien_thoai: '0901234567', trang_thai: 'Đang làm việc' },
  { id_nhan_vien: 'KT-001', ho_ten: 'Kế toán Rexi', chuyen_mon: 'Kế toán', chuc_vu: 'Kế toán', email: 'kt@rexi.local', so_dien_thoai: '0907654321', trang_thai: 'Đang làm việc' }
];
const appointments = [
  { id_lich_hen: 'LH-001', ngay_kham: '2026-07-11', gio_kham: '08:00:00', ngay_hen: '2026-07-11', gio_hen: '08:00', ten_khach_hang: 'Khách kiểm thử', ten_thu_cung: 'Milo', so_dien_thoai: '0900000000', trang_thai: 'CHO_XAC_NHAN', ten_bac_si: 'Bác sĩ Kiểm thử', ly_do: 'Khám tổng quát' },
  { id_lich_hen: 'LH-002', ngay_kham: '2026-07-11', gio_kham: '10:30:00', ten_khach_hang: 'Chủ Rexi', ten_thu_cung: 'Bông', trang_thai: 'DA_XAC_NHAN', ten_bac_si: 'Bác sĩ Kiểm thử', ly_do: 'Tái khám' }
];
const records = [
  { id_ho_so: 'HS-001', id_benh_an: 'BA-001', ten_thu_cung: 'Milo', ten_khach_hang: 'Khách kiểm thử', ngay_kham: '2026-06-05', chan_doan: 'Kiểm tra tổng quát', trang_thai_ho_so: 'hoan_tat' }
];
const invoices = [
  { id_hoa_don: 'HD-001', ten_khach_hang: 'Khách kiểm thử', sdt: '0900000000', tong_tien_cuoi: 480000, tong_tien_ban_dau: 480000, tong_giam_gia: 0, trang_thai: 'CHO_THANH_TOAN', ngay_lap_hoa_don: '2026-06-05' }
];
const medicines = [
  { id_thuoc: 'T001', ma_thuoc: 'AMOX-250', ten_thuoc: 'Amoxicillin 250mg', thanh_phan: 'Amoxicillin', dang_bao_che: 'Viên nén', loai_thuoc: 'Kháng sinh', don_vi: 'Hộp', don_vi_tinh: 'Hộp', gia_ban: 125000 },
  { id_thuoc: 'T002', ma_thuoc: 'VIT-C', ten_thuoc: 'Vitamin C thú y', thanh_phan: 'Acid ascorbic', dang_bao_che: 'Dung dịch', loai_thuoc: 'Bổ sung', don_vi: 'Chai', don_vi_tinh: 'Chai', gia_ban: 89000 }
];
const batches = [
  { id_lo: 'L001', id_thuoc: 'T001', so_lo: 'LOT-2026-001', ngay_nhap: '2026-05-31', han_su_dung: '2027-12-31', so_luong_nhap: 120, so_luong_ton: 38, gia_nhap: 85000 },
  { id_lo: 'L002', id_thuoc: 'T002', so_lo: 'LOT-2026-002', ngay_nhap: '2026-06-01', han_su_dung: '2027-11-30', so_luong_nhap: 80, so_luong_ton: 7, gia_nhap: 52000 }
];

function json(body) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(body) };
}

async function installMocks(page) {
  await page.route('**/api/**', async (route) => {
    const url = route.request().url().toLowerCase();
    if (url.includes('/api/admin/tai-khoan')) return route.fulfill(json([
      { id_tai_khoan: 'TK-001', ten_dang_nhap: 'admin', id_vai_tro: 'VT-ADMIN', trang_thai: 'active', id_nhan_vien: 'ADMIN-AUDIT', nhan_vien: staff[0] }
    ]));
    if (url.includes('/api/nhan-vien/profile/')) return route.fulfill(json({ ...staff[1], id_nhan_vien: 'ADMIN-AUDIT', ho_ten: 'Admin Rexi', chuc_vu: 'Quản trị viên' }));
    if (url.includes('/api/nhan-vien/lich-lam-viec')) return route.fulfill(json([
      { id_lich_lam_viec: 'LLV-001', id_nhan_vien: 'BS-001', ngay_lam: '2026-06-08', gio_bat_dau: '08:00:00', gio_ket_thuc: '12:00:00', ghi_chu: 'Ca sáng' },
      { id_lich_lam_viec: 'LLV-002', id_nhan_vien: 'KT-001', ngay_lam: '2026-06-09', gio_bat_dau: '13:00:00', gio_ket_thuc: '17:00:00', ghi_chu: 'Ca chiều' }
    ]));
    if (url.includes('/api/nhan-vien')) return route.fulfill(json(staff));
    if (url.includes('/api/kho/thuoc-sap-het-han')) return route.fulfill(json([{ ten_thuoc: 'Vitamin C thú y', so_lo: 'LOT-2026-002', so_luong_ton: 7, han_dung: '2026-07-01' }]));
    if (url.includes('/api/kho/thuoc')) return route.fulfill(json(medicines));
    if (url.includes('/api/kho/lo-thuoc')) return route.fulfill(json(batches));
    if (url.includes('/api/lich-hen')) return route.fulfill(json(appointments));
    if (url.includes('/api/hoa-don')) return route.fulfill(json(invoices));
    if (url.includes('/api/ho-so-benh-an/don-thuoc')) return route.fulfill(json([{ id_don_thuoc: '001', id_ho_so_benh_an: 'HS-001', ten_thu_cung: 'Milo', ten_thuoc: 'Amoxicillin 250mg', so_luong: 2, cach_dung: 'Uống sau ăn', ghi_chu: 'Theo dõi 3 ngày' }]));
    if (url.includes('/api/ho-so-benh-an/xet-nghiem')) return route.fulfill(json([{ id_xet_nghiem_benh_an: '001', id_ho_so: 'HS-001', ten_xet_nghiem: 'Tổng quát', ten_bac_si: 'Bác sĩ Kiểm thử', ngay_lay_mau: '2026-06-05', trang_thai: 'hoan_thanh', ket_qua: 'Chỉ số ổn định' }]));
    if (url.includes('/api/benh-an') || url.includes('/api/ho-so')) return route.fulfill(json(records));
    if (url.includes('/api/dich-vu')) return route.fulfill(json([{ id_dich_vu: 'DV-001', ten_dich_vu: 'Khám tổng quát', mo_ta: 'Kiểm tra sức khỏe định kỳ', gia: 120000, thoi_luong_phut: 30, trang_thai: true }]));
    if (url.includes('/api/thu-cung')) return route.fulfill(json([{ id_thu_cung: 'PET-001', ten_thu_cung: 'Milo', loai: 'Chó', giong: 'Poodle', trong_luong: 4.2, id_khach_hang: 'KH-001' }]));
    if (url.includes('/api/khach-hang')) return route.fulfill(json([{ id_khach_hang: 'KH-001', ten_khach_hang: 'Khách kiểm thử', sdt: '0900000000', email: 'khach@rexi.local', nam_sinh: 1998 }]));
    if (url.includes('/api/system/chuc-nang')) return route.fulfill(json([{ id_chuc_nang: 'CN-001', ma_chuc_nang: 'LICH_HEN', ten_chuc_nang: 'Quản lý lịch hẹn', mo_ta: 'Điều phối lịch khám', duong_dan: '/quan-ly/lich-hen', vai_tro: 'Admin, Quản lý' }]));
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
    hasTouch: true
  });
  await context.addInitScript((user) => {
    window.localStorage.setItem('token', 'admin-mobile-audit-token');
    window.localStorage.setItem('user', JSON.stringify(user));
  }, adminUser);
  const page = await context.newPage();
  await installMocks(page);

  for (const [name, routePath] of routes) {
    await page.goto(`${baseUrl}${routePath}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1400);
    const docHeight = await page.evaluate(() => {
      const scroller = document.querySelector('.admin-main-content') || document.scrollingElement || document.documentElement;
      return Math.max(scroller.scrollHeight, document.body.scrollHeight, document.documentElement.scrollHeight);
    });
    const stops = [
      ['top', 0],
      ['mid', Math.max(0, Math.floor((docHeight - 844) / 2))],
      ['bottom', Math.max(0, docHeight - 844)]
    ];
    const uniqueStops = stops.filter((item, index, arr) => arr.findIndex(other => Math.abs(other[1] - item[1]) < 20) === index);
    for (const [label, y] of uniqueStops) {
      await page.evaluate((scrollY) => {
        const scroller = document.querySelector('.admin-main-content') || document.scrollingElement || document.documentElement;
        scroller.scrollTo(0, scrollY);
        window.scrollTo(0, scrollY);
      }, y);
      await page.waitForTimeout(250);
      const filePath = path.join(outDir, `${name}-${label}.png`);
      await page.screenshot({ path: filePath, fullPage: false });
      console.log(filePath);
    }
  }
  await browser.close();
})();
