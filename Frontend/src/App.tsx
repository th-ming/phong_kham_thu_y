import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "@components/ErrorBoundary";
import PublicLayout from "@layouts/PublicLayout";
import CustomerLayout from "@layouts/CustomerLayout";
import AdminLayout from "@layouts/AdminLayout";

const TrangChu = lazy(() => import("@pages/TrangChu"));
const DangNhapDangKy = lazy(() => import("@pages/DangNhapDangKy"));
const GoogleAccountLink = lazy(() => import("@pages/GoogleAccountLink"));
const ChiTietDichVu = lazy(() => import("@pages/ChiTietDichVu"));
const VeChungToi = lazy(() => import("@pages/VeChungToi"));
const BangGiaDichVu = lazy(() => import("@pages/BangGiaDichVu"));
const LienHe = lazy(() => import("@pages/LienHe"));
const BacSi = lazy(() => import("@pages/BacSi"));
const QuenMatKhau = lazy(() => import("@pages/QuenMatKhau"));
const Loi404 = lazy(() => import("@pages/Loi404"));
const DashboardKhachHang = lazy(
  () => import("@pages/customer/DashboardKhachHang"),
);
const QuanLyThuCung = lazy(() => import("@pages/customer/QuanLyThuCung"));
const DatLichHen = lazy(() => import("@pages/customer/DatLichHen"));
const LichSuLichHen = lazy(() => import("@pages/customer/LichSuLichHen"));
const HoSoBenhAn = lazy(() => import("@pages/customer/HoSoBenhAn"));
const HoaDonThanhToan = lazy(() => import("@pages/customer/HoaDonThanhToan"));
const ThongTinCaNhan = lazy(() => import("@pages/customer/ThongTinCaNhan"));
const DashboardQuanLy = lazy(() => import("@pages/admin/DashboardQuanLy"));
const QuanLyKhachHangThuCung = lazy(
  () => import("@pages/admin/QuanLyKhachHangThuCung"),
);
const QuanLyLichHen = lazy(() => import("@pages/admin/QuanLyLichHen"));
const QuanLyHoSoBenhAn = lazy(() => import("@pages/admin/QuanLyHoSoBenhAn"));
const ChiTietHoSoBenhAn = lazy(() => import("@pages/admin/ChiTietHoSoBenhAn"));
const QuanLyXetNghiem = lazy(() => import("@pages/admin/QuanLyXetNghiem"));
const QuanLyHoaDon = lazy(() => import("@pages/admin/QuanLyHoaDon"));
const QuanLyKhoThuoc = lazy(() => import("@pages/admin/QuanLyKhoThuoc"));
const QuanLyNhapKho = lazy(() => import("@pages/admin/QuanLyNhapKho"));
const QuanLyNhanVienPhanQuyen = lazy(
  () => import("@pages/admin/QuanLyNhanVienPhanQuyen"),
);
const QuanLyLichLamViec = lazy(() => import("@pages/admin/QuanLyLichLamViec"));
const QuanLyBenhAn = lazy(() => import("@pages/admin/QuanLyBenhAn"));
const BaoCaoThongKe = lazy(() => import("@pages/admin/BaoCaoThongKe"));
const KeToanDashboard = lazy(() => import("@pages/admin/KeToanDashboard"));
const CauHinhHeThong = lazy(() => import("@pages/admin/CauHinhHeThong"));
const QuanLyChucNang = lazy(() => import("@pages/admin/QuanLyChucNang"));
const QuanLyDichVu = lazy(() => import("@pages/admin/QuanLyDichVu"));
const QuanLyDonThuoc = lazy(() => import("@pages/admin/QuanLyDonThuoc"));
const QuanLyFileDinhKem = lazy(() => import("@pages/admin/QuanLyFileDinhKem"));
const QuanLyMarketing = lazy(() => import("@pages/admin/QuanLyMarketing"));
const ThongTinCaNhanNhanVien = lazy(() => import("@pages/admin/ThongTinCaNhanNhanVien"));

import LoadingSpinner from "@components/LoadingSpinner";
import { ToastContainer } from "@components/Toast";
import ProtectedRoute from "@components/ProtectedRoute";

/**
 * Xử lý lỗi tập trung bằng Error Boundary
 * Tự động hiển thị chỉ báo khi các trang đang tải
 */
const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ToastContainer />
        <Suspense fallback={
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            background: 'var(--background)'
          }}>
            <LoadingSpinner size="large" />
          </div>
        }>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<TrangChu />} />
            <Route path="/ve-chung-toi" element={<VeChungToi />} />
            <Route path="/bang-gia" element={<BangGiaDichVu />} />
            <Route path="/lien-he" element={<LienHe />} />
            <Route path="/bac-si" element={<BacSi />} />
            <Route path="/dich-vu/:slug" element={<ChiTietDichVu />} />
            <Route path="/google-account-link" element={<GoogleAccountLink />} />
          </Route>

          <Route path="/dang-nhap" element={<DangNhapDangKy />} />
          <Route path="/quen-mat-khau" element={<QuenMatKhau />} />
          <Route path="*" element={<Loi404 />} />

          <Route element={<CustomerLayout />}>
            <Route path="/khach-hang/dashboard" element={<DashboardKhachHang />} />
            <Route path="/khach-hang/quan-ly-thu-cung" element={<QuanLyThuCung />} />
            <Route path="/khach-hang/dat-lich-hen" element={<DatLichHen />} />
            <Route path="/khach-hang/lich-su-lich-hen" element={<LichSuLichHen />} />
            <Route path="/khach-hang/ho-so-benh-an" element={<HoSoBenhAn />} />
            <Route path="/khach-hang/hoa-don-thanh-toan" element={<HoaDonThanhToan />} />
            <Route path="/khach-hang/thong-tin-ca-nhan" element={<ThongTinCaNhan />} />
          </Route>

          {/* HỆ THỐNG QUẢN TRỊ NỘI BỘ - ĐƯỢC BẢO VỆ 3 LỚP */}
          <Route element={<AdminLayout />}>
            {/* LỚP 1: Các trang nội bộ dùng chung cho mọi nhân viên */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'quan_ly', 'bac_si', 'ke_toan', 'tiep_tan', 'y_ta', 'staff']} />}>
              <Route path="/quan-ly/dashboard" element={<DashboardQuanLy />} />
              <Route path="/quan-ly/khach-hang-thu-cung" element={<QuanLyKhachHangThuCung />} />
              <Route path="/quan-ly/lich-hen" element={<QuanLyLichHen />} />
              <Route path="/quan-ly/lich-lam-viec" element={<QuanLyLichLamViec />} />
              <Route path="/quan-ly/ho-so-benh-an" element={<QuanLyHoSoBenhAn />} />
              <Route path="/quan-ly/kham-benh" element={<QuanLyBenhAn />} />
              <Route path="/quan-ly/chi-tiet-benh-an/:id" element={<ChiTietHoSoBenhAn />} />
              <Route path="/quan-ly/don-thuoc" element={<QuanLyDonThuoc />} />
              <Route path="/quan-ly/file-dinh-kem" element={<QuanLyFileDinhKem />} />
              <Route path="/quan-ly/thong-tin-ca-nhan" element={<ThongTinCaNhanNhanVien />} />
            </Route>

            {/* LỚP 2: Các trang TÀI CHÍNH - QUẢN LÝ TÀI SẢN */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'quan_ly', 'ke_toan', 'tiep_tan']} />}>
              <Route path="/quan-ly/hoa-don" element={<QuanLyHoaDon />} />
            </Route>
            
            <Route element={<ProtectedRoute allowedRoles={['admin', 'quan_ly', 'ke_toan']} />}>
              <Route path="/quan-ly/ke-toan" element={<KeToanDashboard />} />
              <Route path="/quan-ly/bao-cao-thong-ke" element={<BaoCaoThongKe />} />
              <Route path="/quan-ly/nhap-kho" element={<QuanLyNhapKho />} />
            </Route>

            {/* LỚP 2.5: KHO THUỐC (Mọi nhân viên chuyên môn đều được xem tồn kho) */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'quan_ly', 'ke_toan', 'bac_si', 'y_ta', 'tiep_tan']} />}>
              <Route path="/quan-ly/kho-thuoc" element={<QuanLyKhoThuoc />} />
            </Route>

            {/* LỚP 3: Các trang QUẢN TRỊ HỆ THỐNG - CHỈ ADMIN TỐI CAO */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/quan-ly/nhan-vien-phan-quyen" element={<QuanLyNhanVienPhanQuyen />} />
              <Route path="/quan-ly/marketing" element={<QuanLyMarketing />} />
              <Route path="/quan-ly/cau-hinh" element={<CauHinhHeThong />} />
              <Route path="/quan-ly/chuc-nang" element={<QuanLyChucNang />} />
            </Route>

            {/* LỚP 4: QUẢN LÝ NGHIỆP VỤ CAO CẤP - ADMIN & QUẢN LÝ */}
            <Route element={<ProtectedRoute allowedRoles={['admin', 'quan_ly']} />}>
              <Route path="/quan-ly/dich-vu" element={<QuanLyDichVu />} />
              <Route path="/quan-ly/xet-nghiem" element={<QuanLyXetNghiem />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default React.memo(App);
