import React, { useMemo, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import SidebarKhachHang from "@components/SidebarKhachHang";
import { ScrollToTop } from "@components/SpecialEffects";

/**
 * Layout cho phía khách hàng
 * Includes: Header, Sidebar bên trái, Content chính, Footer
 */
const CustomerLayout: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    if (!token || !userStr) {
      alert("Vui lòng đăng nhập để truy cập trang này!");
      navigate("/dang-nhap", { replace: true });
    }
  }, [navigate]);

  const layoutContent = useMemo(
    () => (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <SidebarKhachHang />
        <main style={{ flex: 1, background: "var(--gray-50)", overflowY: "auto" }}>
          <Outlet />
        </main>
        <ScrollToTop />
      </div>
    ),
    [],
  );

  return <>{layoutContent}</>;
};

export default React.memo(CustomerLayout);
