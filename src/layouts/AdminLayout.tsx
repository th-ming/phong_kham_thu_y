import React, { useMemo, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import SidebarAdmin from "@components/SidebarAdmin";
import { ScrollToTop } from "@components/SpecialEffects";

/**
 * Layout cho phía quản lý / nhân viên
 * Includes: Header, Sidebar bên trái, Content chính, Footer
 */
const AdminLayout: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    if (!token || !userStr) {
      alert("Vui lòng đăng nhập bằng tài khoản Quản lý/Nhân viên!");
      navigate("/dang-nhap", { replace: true });
      return;
    }
    
    try {
      const user = JSON.parse(userStr);
      if (user.loai_tai_khoan === "khach_hang") {
        alert("Bạn không có quyền truy cập trang Quản lý!");
        navigate("/khach-hang/dashboard", { replace: true });
      }
    } catch (e) {
      navigate("/dang-nhap");
    }
  }, [navigate]);

  const layoutContent = useMemo(
    () => (
      <div style={{ display: "flex", minHeight: "100vh" }}>
        <SidebarAdmin />
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

export default React.memo(AdminLayout);
