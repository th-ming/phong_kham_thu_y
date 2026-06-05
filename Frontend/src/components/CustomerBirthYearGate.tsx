import React, { useEffect, useState } from "react";
import axiosInstance from "@services/axios";
import BirthYearSelect from "@components/BirthYearSelect";
import { toast } from "@components/Toast";
import { notifyUserProfileChanged } from "@hooks/useLiveUserProfile";
import { getCustomerIdFromProfile, getUserProfile, normalizeUserRole } from "@utils/index";

const hasMissingBirthYear = (value: any) => value === undefined || value === null || value === "" || Number(value) === 0;

const CustomerBirthYearGate: React.FC = () => {
  const [show, setShow] = useState(false);
  const [birthYear, setBirthYear] = useState("");
  const [saving, setSaving] = useState(false);
  const [customerProfile, setCustomerProfile] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    const checkBirthYear = async () => {
      const token = localStorage.getItem("token");
      const currentUser = getUserProfile();
      if (!token || !currentUser || normalizeUserRole(currentUser) !== "khach_hang") return;

      const idKhachHang = getCustomerIdFromProfile(currentUser);
      if (!idKhachHang) return;

      if (!hasMissingBirthYear(currentUser.nam_sinh)) {
        setShow(false);
        return;
      }

      try {
        const res = await axiosInstance.get(`/api/khach-hang/${idKhachHang}`);
        if (!mounted) return;

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

        setShow(hasMissingBirthYear(profile.nam_sinh));
      } catch (err) {
        console.error("Lỗi kiểm tra năm sinh khách hàng:", err);
        setShow(true);
      }
    };

    checkBirthYear();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const yearNum = Number(birthYear);
    const currentYear = new Date().getFullYear();

    if (!birthYear || !Number.isInteger(yearNum) || yearNum < 1900 || yearNum > currentYear) {
      toast.error(`Năm sinh phải nằm trong khoảng từ 1900 đến ${currentYear}!`);
      return;
    }

    const currentUser = getUserProfile();
    const idKhachHang = getCustomerIdFromProfile(currentUser);
    if (!currentUser || !idKhachHang) {
      toast.error("Không tìm thấy thông tin khách hàng. Vui lòng đăng nhập lại!");
      return;
    }

    setSaving(true);
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

      const nextUser = { ...currentUser, nam_sinh: yearNum };
      localStorage.setItem("user", JSON.stringify(nextUser));
      notifyUserProfileChanged(nextUser);
      setShow(false);
      setCustomerProfile(nextProfile);
      toast.success("Đã lưu năm sinh và cập nhật trải nghiệm cá nhân.");
    } catch (err: any) {
      console.error("Lỗi lưu năm sinh khách hàng:", err);
      toast.error(err.response?.data?.message || "Cập nhật năm sinh thất bại. Vui lòng thử lại!");
    } finally {
      setSaving(false);
    }
  };

  if (!show) return null;

  return (
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
        <p style={{ fontSize: "0.95rem", color: "var(--gray-500)", fontWeight: 600, lineHeight: 1.65, margin: "0 0 22px" }}>
          Popup này xuất hiện khi hồ sơ khách hàng chưa có năm sinh, không phụ thuộc đây có phải lần đăng nhập đầu tiên hay không.
        </p>

        <form onSubmit={handleSave} style={{ marginTop: "22px" }}>
          <BirthYearSelect
            data-ai-id="select-public-birth-year-gate"
            minYear={1900}
            placeholder="Chọn năm sinh"
            value={birthYear}
            onChange={setBirthYear}
            disabled={saving}
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
          />
          <button
            type="submit"
            disabled={saving}
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
            {saving ? "Đang lưu..." : "Xác nhận"}
            {!saving && <span className="material-symbols-outlined">arrow_forward</span>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default React.memo(CustomerBirthYearGate);
