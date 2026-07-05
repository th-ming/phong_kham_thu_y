import React, { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import ErrorBoundary from "@components/ErrorBoundary";
import PublicLayout from "@layouts/PublicLayout";
import CustomerLayout from "@layouts/CustomerLayout";
import AdminLayout from "@layouts/AdminLayout";
import axiosInstance from "@services/axios";

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
import { GlobalConfirmModal } from "@components/ConfirmModal";
import { ROLE_GROUPS } from "@utils/permissions";

const routeTitleMap: Record<string, string> = {
  "/": "Trang chủ",
  "/dang-nhap": "Đăng nhập",
  "/quan-ly/dashboard": "Tổng quan quản trị",
  "/quan-ly/cau-hinh": "Cấu hình hệ thống",
  "/khach-hang/dashboard": "Bảng điều khiển khách hàng",
  "/khach-hang/dat-lich-hen": "Đặt lịch hẹn",
};

const SystemTitle: React.FC = () => {
  const location = useLocation();
  const [appName, setAppName] = useState(() => localStorage.getItem("rexi_app_name") || "Rexi - Phòng Khám Thú Y");

  useEffect(() => {
    let mounted = true;
    axiosInstance.get("/api/system/public-cau-hinh")
      .then((res) => {
        const configuredName = String(res.data?.app_name || "").trim();
        if (mounted && configuredName) {
          localStorage.setItem("rexi_app_name", configuredName);
          setAppName(configuredName);
        }
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const pageTitle = routeTitleMap[location.pathname] || "Rexi";
    document.title = `${pageTitle} | ${appName}`;
  }, [appName, location.pathname]);

  return null;
};

// * * Scroll Restoration and Navigation Handler — F5-proof
// Saves scroll on scroll + beforeunload; restores after document fully loaded.
const ScrollRestorationAndNavigation: React.FC = () => {
  const location = useLocation();
  const lastPathname = React.useRef(location.pathname);

  // 1. Save scroll position on every scroll
  useEffect(() => {
    const key = `rexi_scroll_${location.pathname}`;
    const handleScroll = () => {
      if (window.scrollY > 0) {
        sessionStorage.setItem(key, window.scrollY.toString());
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location.pathname]);

  // 2. Backup save on beforeunload — guarantees position is captured before F5
  useEffect(() => {
    const key = `rexi_scroll_${location.pathname}`;
    const handleBeforeUnload = () => {
      if (window.scrollY > 0) {
        sessionStorage.setItem(key, window.scrollY.toString());
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [location.pathname]);

  // 3. Handle mount (F5 reload) and navigation
  useEffect(() => {
    // Case A: Pathname changed → scroll to top (user navigated)
    if (lastPathname.current !== location.pathname) {
      lastPathname.current = location.pathname;
      window.scrollTo(0, 0);
      sessionStorage.removeItem(`rexi_scroll_${location.pathname}`);
      return;
    }

    // Case B: Same pathname (F5 reload) → restore scroll position
    const savedScroll = sessionStorage.getItem(`rexi_scroll_${location.pathname}`);
    const hash = window.location.hash;
    if (!savedScroll && !hash) return;

    let cancelled = false;

    const doRestore = () => {
      if (cancelled) return;
      if (hash) {
        const el = document.querySelector(hash);
        if (el) {
          el.scrollIntoView({ behavior: "instant" });
          return;
        }
      }
      if (savedScroll) {
        const y = parseInt(savedScroll, 10);
        if (!isNaN(y) && y > 0) {
          window.scrollTo({ top: y, behavior: "instant" });
        }
      }
    };

    // If the page is already fully loaded (warm cache), restore after a short paint cycle
    if (document.readyState === "complete") {
      const t = setTimeout(() => requestAnimationFrame(doRestore), 300);
      return () => { cancelled = true; clearTimeout(t); };
    }

    // Otherwise wait for the load event, then restore after paint
    const onLoad = () => requestAnimationFrame(doRestore);
    window.addEventListener("load", onLoad, { once: true });
    return () => { cancelled = true; window.removeEventListener("load", onLoad); };
  }, [location.pathname]);

  return null;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ScrollRestorationAndNavigation />
      <ErrorBoundary>
        <SystemTitle />
        <ToastContainer />
        <GlobalConfirmModal />
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
            <Route element={<ProtectedRoute allowedRoles={ROLE_GROUPS.dashboard} />}>
              <Route path="/quan-ly/dashboard" element={<DashboardQuanLy />} />
              <Route path="/quan-ly/lich-lam-viec" element={<QuanLyLichLamViec />} />
              <Route path="/quan-ly/thong-tin-ca-nhan" element={<ThongTinCaNhanNhanVien />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={ROLE_GROUPS.appointment} />}>
              <Route path="/quan-ly/lich-hen" element={<QuanLyLichHen />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={ROLE_GROUPS.customerAndPet} />}>
              <Route path="/quan-ly/khach-hang-thu-cung" element={<QuanLyKhachHangThuCung />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={ROLE_GROUPS.clinicalRecord} />}>
              <Route path="/quan-ly/ho-so-benh-an" element={<QuanLyHoSoBenhAn />} />
              <Route path="/quan-ly/ho-so-benh-an/:id" element={<ChiTietHoSoBenhAn />} />
              <Route path="/quan-ly/chi-tiet-benh-an/:id" element={<ChiTietHoSoBenhAn />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={ROLE_GROUPS.prescription} />}>
              <Route path="/quan-ly/kham-benh" element={<QuanLyBenhAn />} />
              <Route path="/quan-ly/don-thuoc" element={<QuanLyDonThuoc />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={ROLE_GROUPS.lab} />}>
              <Route path="/quan-ly/xet-nghiem" element={<QuanLyXetNghiem />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={ROLE_GROUPS.files} />}>
              <Route path="/quan-ly/file-dinh-kem" element={<QuanLyFileDinhKem />} />
            </Route>

            {/* LỚP 2: Các trang TÀI CHÍNH - QUẢN LÝ TÀI SẢN */}
            <Route element={<ProtectedRoute allowedRoles={ROLE_GROUPS.invoice} />}>
              <Route path="/quan-ly/hoa-don" element={<QuanLyHoaDon />} />
            </Route>
            
            <Route element={<ProtectedRoute allowedRoles={ROLE_GROUPS.finance} />}>
              <Route path="/quan-ly/ke-toan" element={<KeToanDashboard />} />
              <Route path="/quan-ly/bao-cao-thong-ke" element={<BaoCaoThongKe />} />
              <Route path="/quan-ly/nhap-kho" element={<QuanLyNhapKho />} />
            </Route>

            {/* LỚP 2.5: KHO THUỐC (Mọi nhân viên chuyên môn đều được xem tồn kho) */}
            <Route element={<ProtectedRoute allowedRoles={ROLE_GROUPS.inventory} />}>
              <Route path="/quan-ly/kho-thuoc" element={<QuanLyKhoThuoc />} />
            </Route>

            {/* LỚP 3: Nhân sự cho ADMIN/Quản lý, config hệ thống chỉ ADMIN */}
            <Route element={<ProtectedRoute allowedRoles={ROLE_GROUPS.staffAccountManage} />}>
              <Route path="/quan-ly/nhan-vien-phan-quyen" element={<QuanLyNhanVienPhanQuyen />} />
            </Route>

            {/* LỚP 3.5: Các trang QUẢN TRỊ HỆ THỐNG - CHỈ ADMIN TỐI CAO */}
            <Route element={<ProtectedRoute allowedRoles={ROLE_GROUPS.adminOnly} />}>
              <Route path="/quan-ly/cau-hinh" element={<CauHinhHeThong />} />
              <Route path="/quan-ly/chuc-nang" element={<QuanLyChucNang />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={ROLE_GROUPS.serviceCatalog} />}>
              <Route path="/quan-ly/dich-vu" element={<QuanLyDichVu />} />
            </Route>

            {/* LỚP 4: QUẢN LÝ NGHIỆP VỤ CAO CẤP - ADMIN & QUẢN LÝ */}
            <Route element={<ProtectedRoute allowedRoles={ROLE_GROUPS.marketing} />}>
              <Route path="/quan-ly/marketing" element={<QuanLyMarketing />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default React.memo(App);
