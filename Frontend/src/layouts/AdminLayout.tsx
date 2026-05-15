import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import SidebarAdmin from "@components/SidebarAdmin";
import { ScrollToTop } from "@components/SpecialEffects";

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    if (!token || !userStr) {
      navigate("/dang-nhap", { replace: true });
      return;
    }

    try {
      const user = JSON.parse(userStr);
      const role = (user.loai_tai_khoan || user.ten_vai_tro || "").toLowerCase();
      // Chặn triệt để cả trường hợp backend trả về "customer" hoặc "khach_hang"
      if (role === "customer" || role === "khach_hang") {
        navigate("/khach-hang/dashboard", { replace: true });
      }
    } catch (e) {
      navigate("/dang-nhap");
    }
  }, [navigate]);

  return (
    // Đổi minHeight thành height và chặn cuộn tổng thể để Sidebar được ghim cố định
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--background)" }}>
      <SidebarAdmin />
      <main className="main-content" style={{ flex: 1, padding: "40px", overflowY: "auto", position: 'relative' }}>
        <div className="animate-fade-in">
          <React.Suspense fallback={
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
              <div className="dot-pulse"></div>
            </div>
          }>
            <Outlet />
          </React.Suspense>
        </div>
      </main>
      <ScrollToTop />
    </div>
  );
};

export default React.memo(AdminLayout);
