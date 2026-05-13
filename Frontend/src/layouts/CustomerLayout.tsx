import React, { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import SidebarKhachHang from "@components/SidebarKhachHang";
import { ScrollToTop } from "@components/SpecialEffects";

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
      const role = user.loai_tai_khoan?.toLowerCase() || "";
      // FIX: Backend trả về "CUSTOMER" (không phải "khach_hang")
      if (role !== "customer") {
        navigate("/quan-ly/dashboard", { replace: true });
      }
    } catch (e) {
      navigate("/dang-nhap");
    }
  }, [navigate]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--background)" }}>
      <SidebarKhachHang />
      <main style={{ flex: 1, padding: "40px", overflowY: "auto", position: 'relative' }}>
        <div className="animate-fade-in">
          <Outlet />
        </div>
      </main>
      <ScrollToTop />
    </div>
  );
};

export default React.memo(CustomerLayout);
