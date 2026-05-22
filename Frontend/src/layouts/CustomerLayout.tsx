import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import SidebarKhachHang from "@components/SidebarKhachHang";
import { ScrollToTop } from "@components/SpecialEffects";
import { ChatBot } from "@components/ChatBot";
import { toast } from "@components/Toast";
import { normalizeUserRole } from "@utils/index";

const CustomerLayout: React.FC = () => {
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
      if (role !== "khach_hang") {
        toast.error("Tài khoản nhân sự/quản lý không có quyền sử dụng phân hệ đặt lịch và quản lý của Khách hàng!");
        navigate("/quan-ly/dashboard", { replace: true });
      }
    } catch (e) {
      navigate("/dang-nhap");
    }
  }, [navigate]);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--background)" }}>
      <SidebarKhachHang />
      <main className="main-content customer-main-content" style={{ flex: 1, padding: "40px", overflowY: "auto", position: 'relative' }}>
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

export default React.memo(CustomerLayout);

