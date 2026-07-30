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
const BaoCaoThongKe = lazy(() => import("@pages/admin/BaoCaoThongKe"));

/**
 * FIX #17: Wrap app with Error Boundary
 * FIX #9: Loading indicator for lazy components
 */
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<div className="loading">Đang tải...</div>}>
          <Routes>
            <Route path="/" element={<TrangChu />} />
            <Route path="/dich-vu/:slug" element={<ChiTietDichVu />} />
            <Route path="/dang-nhap" element={<DangNhapDangKy />} />
            <Route path="*" element={<Loi404 />} />
            <Route element={<PublicLayout />}>
              <Route path="/google-account-link" element={<GoogleAccountLink />} />
            </Route>

            <Route element={<CustomerLayout />}>
              <Route
                path="/khach-hang/dashboard"
                element={<DashboardKhachHang />}
              />
              <Route
                path="/khach-hang/quan-ly-thu-cung"
                element={<QuanLyThuCung />}
              />
              <Route path="/khach-hang/dat-lich-hen" element={<DatLichHen />} />
              <Route
                path="/khach-hang/lich-su-lich-hen"
                element={<LichSuLichHen />}
              />
              <Route path="/khach-hang/ho-so-benh-an" element={<HoSoBenhAn />} />
              <Route
                path="/khach-hang/hoa-don-thanh-toan"
                element={<HoaDonThanhToan />}
              />
              <Route
                path="/khach-hang/thong-tin-ca-nhan"
                element={<ThongTinCaNhan />}
              />
            </Route>

            <Route element={<AdminLayout />}>
              <Route path="/quan-ly/dashboard" element={<DashboardQuanLy />} />
              <Route
                path="/quan-ly/khach-hang-thu-cung"
                element={<QuanLyKhachHangThuCung />}
              />
              <Route path="/quan-ly/lich-hen" element={<QuanLyLichHen />} />
              <Route
                path="/quan-ly/ho-so-benh-an"
                element={<QuanLyHoSoBenhAn />}
              />
              <Route
                path="/quan-ly/chi-tiet-benh-an/:id"
                element={<ChiTietHoSoBenhAn />}
              />
              <Route path="/quan-ly/xet-nghiem" element={<QuanLyXetNghiem />} />
              <Route path="/quan-ly/hoa-don" element={<QuanLyHoaDon />} />
              <Route path="/quan-ly/kho-thuoc" element={<QuanLyKhoThuoc />} />
              <Route path="/quan-ly/nhap-kho" element={<QuanLyNhapKho />} />
              <Route
                path="/quan-ly/nhan-vien-phan-quyen"
                element={<QuanLyNhanVienPhanQuyen />}
              />
              <Route
                path="/quan-ly/bao-cao-thong-ke"
                element={<BaoCaoThongKe />}
              />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
};

export default React.memo(App);
