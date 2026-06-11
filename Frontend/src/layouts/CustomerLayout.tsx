import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import SidebarKhachHang from "@components/SidebarKhachHang";
import { ScrollToTop } from "@components/SpecialEffects";
import { ChatBot } from "@components/ChatBot";
import { toast } from "@components/Toast";
import BirthYearSelect from "@components/BirthYearSelect";
import axiosInstance from "@services/axios";
import { getCustomerIdFromProfile, getUserProfile, normalizeUserRole } from "@utils/index";
import { notifyUserProfileChanged } from "@hooks/useLiveUserProfile";

const CustomerLayout: React.FC = () => {
  const navigate = useNavigate();
  const [showBirthYearGate, setShowBirthYearGate] = useState(false);
  const [birthYear, setBirthYear] = useState("");
  const [savingBirthYear, setSavingBirthYear] = useState(false);
  const [customerProfile, setCustomerProfile] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;

    const syncCustomerProfile = async () => {
      const currentUser = getUserProfile();
      if (!currentUser) return;

      const idKhachHang = getCustomerIdFromProfile(currentUser);
      if (!idKhachHang) return;

      try {
        const res = await axiosInstance.get(`/api/khach-hang/${idKhachHang}`);
        if (!isMounted) return;

        const profile = res.data;
        setCustomerProfile(profile);

        const nextUser = {
          ...currentUser,
          id_khach_hang: profile.id_khach_hang || currentUser.id_khach_hang,
          ten_khach_hang: profile.ten_khach_hang || currentUser.ten_khach_hang,
          ho_ten: profile.ten_khach_hang || currentUser.ho_ten,
          email: profile.email || currentUser.email,
          sdt: profile.sdt || currentUser.sdt,
          dia_chi: profile.dia_chi || currentUser.dia_chi,
          hinh_anh: profile.hinh_anh || currentUser.hinh_anh,
          avatar: profile.hinh_anh || currentUser.avatar,
          nam_sinh: profile.nam_sinh !== undefined ? profile.nam_sinh : currentUser.nam_sinh
        };
        localStorage.setItem("user", JSON.stringify(nextUser));
        notifyUserProfileChanged(nextUser);

        if (profile?.nam_sinh === undefined || profile?.nam_sinh === null || Number(profile.nam_sinh) === 0) {
          setShowBirthYearGate(true);
          return;
        }
      } catch (err) {
        console.error("Lỗi khi kiểm tra năm sinh khách hàng sau đăng nhập:", err);
      }
    };

    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    if (!token || !userStr) {
      navigate("/dang-nhap", { replace: true });
      return () => {
        isMounted = false;
      };
    }

    try {
      const user = JSON.parse(userStr);
      const role = normalizeUserRole(user);
      if (role !== "khach_hang") {
        toast.error("Tài khoản nhân sự/quản lý không có quyền sử dụng phân hệ đặt lịch và quản lý của Khách hàng!");
        navigate("/quan-ly/dashboard", { replace: true });
        return () => {
          isMounted = false;
        };
      }
      syncCustomerProfile();
    } catch (e) {
      navigate("/dang-nhap");
    }

    const handleRealtimeDataChange = (event: Event) => {
      const payload = (event as CustomEvent).detail || {};
      const currentUser = getUserProfile();
      const currentCustomerId = getCustomerIdFromProfile(currentUser);
      if (payload.resource === "profile" && payload.scope === "customer" && payload.id === currentCustomerId) {
        syncCustomerProfile();
      }
    };
    window.addEventListener("rexi-data-changed", handleRealtimeDataChange);

    return () => {
      isMounted = false;
      window.removeEventListener("rexi-data-changed", handleRealtimeDataChange);
    };
  }, [navigate]);

  const handleSaveBirthYear = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!birthYear || isNaN(Number(birthYear))) {
      toast.error("Vui lòng nhập năm sinh hợp lệ!");
      return;
    }

    const yearNum = Number(birthYear);
    const currentYear = new Date().getFullYear();
    if (yearNum < 1900 || yearNum > currentYear) {
      toast.error(`Năm sinh phải nằm trong khoảng từ 1900 đến ${currentYear}!`);
      return;
    }

    const currentUser = getUserProfile();
    const idKhachHang = getCustomerIdFromProfile(currentUser);
    if (!currentUser || !idKhachHang) {
      toast.error("Không tìm thấy thông tin khách hàng. Vui lòng đăng nhập lại!");
      return;
    }

    setSavingBirthYear(true);
    try {
      const nextProfile = {
        ...customerProfile,
        id_khach_hang: idKhachHang,
        ten_khach_hang: customerProfile?.ten_khach_hang || currentUser.ten_khach_hang || currentUser.ho_ten || currentUser.displayName,
        email: customerProfile?.email || currentUser.email,
        sdt: customerProfile?.sdt || currentUser.sdt,
        dia_chi: customerProfile?.dia_chi || currentUser.dia_chi || "",
        nam_sinh: yearNum
      };

      await axiosInstance.put(`/api/khach-hang/${idKhachHang}`, nextProfile);

      const nextUser = {
        ...currentUser,
        nam_sinh: yearNum
      };
      localStorage.setItem("user", JSON.stringify(nextUser));
      notifyUserProfileChanged(nextUser);

      setShowBirthYearGate(false);
      setCustomerProfile(nextProfile);

      if (yearNum >= 1997) {
        toast.success("Đã thiết lập phong cách Gen Z vui vẻ cho Rexi!");
      } else {
        toast.success("Đã thiết lập phong cách trò chuyện trưởng thành, lịch sự cho Rexi!");
      }
    } catch (err: any) {
      console.error("Lỗi khi lưu năm sinh sau đăng nhập:", err);
      toast.error(err.response?.data?.message || "Cập nhật năm sinh thất bại. Vui lòng thử lại!");
    } finally {
      setSavingBirthYear(false);
    }
  };

  return (
    <div className="customer-shell" style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--background)" }}>
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
      {showBirthYearGate && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(15, 23, 42, 0.52)",
          backdropFilter: "blur(18px) saturate(170%)",
          WebkitBackdropFilter: "blur(18px) saturate(170%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "20px"
        }}>
          <div style={{
            width: "100%",
            maxWidth: "760px",
            padding: "36px",
            borderRadius: "28px",
            background: "var(--surface)",
            border: "1px solid var(--gray-200)",
            boxShadow: "0 30px 70px rgba(15, 23, 42, 0.24)",
            textAlign: "center"
          }}>
            <img
              src="/img/rexi_brand_logo.png"
              alt="Rexi Logo"
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "20px",
                margin: "0 auto 22px",
                boxShadow: "0 12px 26px rgba(16, 185, 129, 0.35)",
                objectFit: "cover"
              }}
            />

            <h3 style={{ fontSize: "1.55rem", fontWeight: 900, color: "var(--ink)", margin: "0 0 12px" }}>
              Cho Rexi biết năm sinh của bạn
            </h3>
            <p style={{ fontSize: "0.95rem", color: "var(--gray-500)", fontWeight: 600, lineHeight: 1.65, margin: "0 0 28px" }}>
              Thông tin này giúp hệ thống phân loại độ tuổi và chọn phong cách trò chuyện phù hợp ngay từ lần đăng nhập đầu tiên.
            </p>

            <form onSubmit={handleSaveBirthYear} style={{ marginTop: "22px" }}>
              <BirthYearSelect
                data-ai-id="select-customerlayout-namsinh"
                minYear={1900}
                placeholder="Chọn năm sinh"
                value={birthYear}
                onChange={setBirthYear}
                disabled={savingBirthYear}
                required
                style={{
                  width: "100%",
                  padding: "16px 18px",
                  borderRadius: "16px",
                  border: "2px solid rgba(15, 157, 138, 0.22)",
                  backgroundColor: "var(--gray-50)",
                  color: "var(--ink)",
                  fontSize: "1.05rem",
                  fontWeight: 800,
                  textAlign: "center",
                  outline: "none",
                  marginBottom: "18px"
                }}
                onFocus={(e) => e.target.style.borderColor = "var(--primary)"}
                onBlur={(e) => e.target.style.borderColor = "rgba(15, 157, 138, 0.22)"}
              />

              <button
                data-ai-id="btn_customer_birth_year_submit"
                type="submit"
                disabled={savingBirthYear}
                className="btn btn-primary"
                style={{
                  width: "100%",
                  padding: "15px",
                  borderRadius: "16px",
                  fontWeight: 850,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
              >
                {savingBirthYear ? (
                  <>
                    <div className="dot-pulse" style={{ scale: "0.82" }} />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    Xác nhận
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(CustomerLayout);

