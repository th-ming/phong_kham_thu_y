import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import SidebarAdmin from "@components/SidebarAdmin";
import { ScrollToTop } from "@components/SpecialEffects";
import { ChatBot } from "@components/ChatBot";
import { normalizeUserRole } from "@utils/index";

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const [securityAlert, setSecurityAlert] = useState<any | null>(null);

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

  useEffect(() => {
    const handler = (event: Event) => {
      setSecurityAlert((event as CustomEvent).detail);
    };
    window.addEventListener("rexi-security-alert", handler);
    return () => window.removeEventListener("rexi-security-alert", handler);
  }, []);

  return (
    // Đổi minHeight thành height và chặn cuộn tổng thể để Sidebar được ghim cố định
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--background)" }}>
      <SidebarAdmin />
      <main className="main-content admin-main-content" style={{ flex: 1, padding: "40px", overflowY: "auto", position: 'relative' }}>
        {securityAlert && (
          <div style={{
            position: "sticky",
            top: 0,
            zIndex: 50,
            marginBottom: 18,
            padding: "14px 18px",
            borderRadius: 14,
            background: "linear-gradient(135deg, #991b1b, #e11d48)",
            color: "white",
            boxShadow: "0 18px 40px rgba(225,29,72,0.28)",
            border: "1px solid rgba(255,255,255,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16
          }}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 28 }}>shield_lock</span>
              <div>
                <div style={{ fontWeight: 950, fontSize: "0.95rem" }}>CẢNH BÁO TẤN CÔNG - IP ĐÃ BỊ CHẶN</div>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, opacity: 0.95, marginTop: 4 }}>
                  IP {securityAlert.ip} | {securityAlert.attackType} | {securityAlert.locationHint || "Không rõ vị trí"} | {securityAlert.path}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSecurityAlert(null)}
              style={{ border: "1px solid rgba(255,255,255,0.45)", background: "rgba(255,255,255,0.12)", color: "white", borderRadius: 10, padding: "8px 10px", cursor: "pointer", fontWeight: 900 }}
            >
              Đóng
            </button>
          </div>
        )}
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

