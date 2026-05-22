import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import SidebarAdmin from "@components/SidebarAdmin";
import { ScrollToTop } from "@components/SpecialEffects";
import { ChatBot } from "@components/ChatBot";
import { normalizeUserRole } from "@utils/index";

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
      const role = normalizeUserRole(user);
      if (role === "khach_hang" || role === "guest") {
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
      <ChatBot />
    </div>
  );
};

export default React.memo(AdminLayout);

