import React, { useState, useEffect } from "react";
import { useRef } from "react";
import axiosInstance from "@services/axios";
import { useNavigate } from "react-router-dom";
import { Modal } from "@components/CommonUI";
import BirthYearSelect from "@components/BirthYearSelect";
import { getUserProfile, normalizeUserRole } from "@utils/index";
import { customerToneCopy, isGenZBirthYear } from "@utils/customerTone";
import { toast } from "@components/Toast";
import { isValidPassword, PASSWORD_POLICY_MESSAGE } from "@utils/passwordPolicy";
import { notifyUserProfileChanged } from "@hooks/useLiveUserProfile";

const ThongTinCaNhan: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [emailNoti, setEmailNoti] = useState(true);
  const [smsNoti, setSmsNoti] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [passData, setPassData] = useState({ currentPass: "", newPass: "", confirmPass: "" });
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState("");
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const user = getUserProfile();
      if (user) {
        const role = normalizeUserRole(user);
        const customerId = user.id_khach_hang || user.idKhachHang;
        const staffId = user.id_nhan_vien || user.idNhanVien;
        if (role !== "khach_hang" && !staffId) {
          console.warn("Không tìm thấy ID người dùng!");
          setLoading(false);
          return;
        }
        const primaryEndpoint = role === "khach_hang"
          ? (customerId ? `/api/khach-hang/${customerId}` : `/api/khach-hang/me`)
          : `/api/nhan-vien/profile/${staffId}`;
        const fallbackEndpoint = role === "khach_hang" && primaryEndpoint !== "/api/khach-hang/me"
          ? "/api/khach-hang/me"
          : null;

        const loadProfile = (endpoint: string) => axiosInstance.get(endpoint);

        loadProfile(primaryEndpoint)
          .catch(err => {
            if (!fallbackEndpoint || ![403, 404].includes(err.response?.status)) {
              throw err;
            }
            return loadProfile(fallbackEndpoint);
          })
          .then(res => {
            const profileData = {
              ...user,
              ...res.data,
              id_khach_hang: res.data.id_khach_hang || customerId || user.id_khach_hang,
              id_nhan_vien: res.data.id_nhan_vien || staffId || user.id_nhan_vien,
            };
            setData(profileData);
            setFormData(profileData);
            const nextUser = {
              ...user,
              id_khach_hang: profileData.id_khach_hang || user.id_khach_hang,
              id_nhan_vien: profileData.id_nhan_vien || user.id_nhan_vien,
              ten_khach_hang: profileData.ten_khach_hang || profileData.ho_ten || user.ten_khach_hang,
              ho_ten: profileData.ho_ten || profileData.ten_khach_hang || user.ho_ten,
              email: profileData.email || user.email,
              sdt: profileData.sdt || profileData.so_dien_thoai || user.sdt,
              hinh_anh: profileData.hinh_anh || profileData.avatar || user.hinh_anh,
              avatar: profileData.avatar || profileData.hinh_anh || user.avatar,
              nam_sinh: profileData.nam_sinh !== undefined ? profileData.nam_sinh : user.nam_sinh,
            };
            localStorage.setItem("user", JSON.stringify(nextUser));
            notifyUserProfileChanged(nextUser);
            // Đọc config nhận tin từ db lên, lỡ db lỗi trả về null thì cho mặc định bật hết (true).
            // Khúc này cực kỳ quan trọng để gửi email chúc mừng sinh nhật boss hoặc sms nhắc lịch khám nha.
            setEmailNoti(profileData.nhan_email ?? true);
            setSmsNoti(profileData.nhan_sms ?? true);
            setAvatarPreview(profileData.hinh_anh || profileData.avatar || "");
            setLoading(false);
          })
          .catch(err => {
            console.error("Lỗi tải thông tin:", err);
            setLoading(false);
          });
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error("Lỗi khi đọc thông tin user từ localStorage", error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handleRealtimeProfile = (event: Event) => {
      const payload = (event as CustomEvent).detail || {};
      if (payload.resource !== "profile") return;

      const user = getUserProfile();
      const role = normalizeUserRole(user);
      const customerId = user?.id_khach_hang || user?.idKhachHang;
      const staffId = user?.id_nhan_vien || user?.idNhanVien;
      const ownProfileChanged =
        (payload.scope === "customer" && payload.id === customerId) ||
        (payload.scope === "staff" && payload.id === staffId);
      if (!ownProfileChanged) return;

      const endpoint = role === "khach_hang"
        ? `/api/khach-hang/${customerId}`
        : `/api/nhan-vien/profile/${staffId}`;
      axiosInstance.get(endpoint).then(res => {
        const profileData = {
          ...user,
          ...res.data,
          id_khach_hang: res.data.id_khach_hang || customerId || user?.id_khach_hang,
          id_nhan_vien: res.data.id_nhan_vien || staffId || user?.id_nhan_vien,
        };
        setData(profileData);
        setFormData(profileData);
        setAvatarPreview(profileData.hinh_anh || profileData.avatar || "");
        setEmailNoti(profileData.nhan_email ?? true);
        setSmsNoti(profileData.nhan_sms ?? true);
      }).catch(err => {
        console.error("Lỗi đồng bộ thông tin cá nhân realtime:", err);
      });
    };

    window.addEventListener("rexi-data-changed", handleRealtimeProfile);
    return () => window.removeEventListener("rexi-data-changed", handleRealtimeProfile);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn đúng file ảnh!");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ảnh avatar nên nhỏ hơn 2MB để tải nhanh hơn!");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const imageUrl = String(reader.result || "");
      setAvatarPreview(imageUrl);
      setFormData((prev: any) => ({
        ...prev,
        hinh_anh: imageUrl,
        avatar: imageUrl,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handlePassChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassData({ ...passData, [e.target.name]: e.target.value });
  };

  const handleSavePass = async () => {
    if (passData.newPass !== passData.confirmPass) {
      toast.error("Mật khẩu xác nhận không khớp!");
      return;
    }
    if (!isValidPassword(passData.newPass)) {
      toast.error(PASSWORD_POLICY_MESSAGE);
      return;
    }
    try {
      await axiosInstance.post("/api/auth/change-password", {
        currentPass: passData.currentPass,
        newPass: passData.newPass
      });
      toast.success("Đổi mật khẩu thành công! Vui lòng dùng mật khẩu mới cho lần đăng nhập sau.");
      setShowPasswordModal(false);
      setPassData({ currentPass: "", newPass: "", confirmPass: "" });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại.");
    }
  };

  const handleSave = () => {
    try {
      const user = getUserProfile();
      const isCustomerUser = !!(data?.id_khach_hang || user?.id_khach_hang || normalizeUserRole(user) === "khach_hang");
      const userId = isCustomerUser
        ? (data?.id_khach_hang || user?.id_khach_hang || user?.idKhachHang)
        : (data?.id_nhan_vien || user?.id_nhan_vien || user?.idNhanVien);

      if (!userId) {
        toast.error("Không tìm thấy thông tin tài khoản. Vui lòng đăng nhập lại!");
        return;
      }

      const tenHienTai = formData.ten_khach_hang || formData.ho_ten || '';
      if (!tenHienTai.trim()) {
        toast.error("Họ và tên không được để trống!");
        return;
      }

      const endpoint = isCustomerUser
        ? `/api/khach-hang/${userId}`
        : `/api/nhan-vien/${userId}`;

      axiosInstance.put(endpoint, formData)
        .then(res => {
          const savedData = {
            ...formData,
            ...(res.data || {}),
            id_khach_hang: res.data?.id_khach_hang || formData.id_khach_hang || user?.id_khach_hang || user?.idKhachHang,
            id_nhan_vien: res.data?.id_nhan_vien || formData.id_nhan_vien || user?.id_nhan_vien || user?.idNhanVien,
          };
          toast.success("Cập nhật thông tin thành công!");
          setData(savedData);
          setFormData(savedData);
          const currentUser = getUserProfile();
          if (currentUser) {
            const nextUser = {
              ...currentUser,
              id_khach_hang: savedData.id_khach_hang || currentUser.id_khach_hang,
              id_nhan_vien: savedData.id_nhan_vien || currentUser.id_nhan_vien,
              ho_ten: savedData.ho_ten || savedData.ten_khach_hang || currentUser.ho_ten,
              ten_khach_hang: savedData.ten_khach_hang || savedData.ho_ten || currentUser.ten_khach_hang,
              email: savedData.email || currentUser.email,
              sdt: savedData.sdt || savedData.so_dien_thoai || currentUser.sdt,
              hinh_anh: savedData.hinh_anh || savedData.avatar || currentUser.hinh_anh,
              avatar: savedData.avatar || savedData.hinh_anh || currentUser.avatar,
              // ĐỒNG BỘ (sync) năm sinh ngay xuống localStorage.user để UI và chatbot REXI đổi giọng GENZ nhây vs MATURE nghiêm túc tức thì.
              // KHACH_HANG bấm lưu phát là Boss mèo meme ở góc màn hình tự động bóc tách đổi tone luôn, khum cần F5 làm gì cho mệt.
              nam_sinh: savedData.nam_sinh !== undefined ? savedData.nam_sinh : currentUser.nam_sinh,
            };
            localStorage.setItem("user", JSON.stringify(nextUser));
            notifyUserProfileChanged(nextUser);
          }
          setIsEditing(false);
        })
        .catch(err => {
          console.error(err);
          toast.error("Cập nhật thất bại!");
        });
    } catch (error) {
      console.error(error);
      toast.error("Đã xảy ra lỗi hệ thống!");
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const user = getUserProfile();
      const userId = data?.id_khach_hang || user?.id_khach_hang || user?.idKhachHang;
      if (!userId) {
        toast.error("Không tìm thấy thông tin tài khoản. Vui lòng đăng nhập lại!");
        return;
      }
      await axiosInstance.delete(`/api/khach-hang/${userId}`);
      toast.success("Tài khoản của bạn đã được vô hiệu hóa. Chào tạm biệt!");
      localStorage.clear();
      navigate("/dang-nhap");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi khi xóa tài khoản. Vui lòng thử lại sau.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Cập nhật cài đặt nhận thông báo của khách hàng và đồng bộ xuống DB ngay lập tức
  const handleToggleMarketing = async (type: "email" | "sms", currentValue: boolean) => {
    try {
      const user = getUserProfile();
      const userId = data?.id_khach_hang || data?.idKhachHang || user?.id_khach_hang || user?.idKhachHang;
      if (!userId) {
        toast.error("Không tìm thấy thông tin tài khoản. Vui lòng đăng nhập lại!");
        return;
      }

      const newValue = !currentValue;
      const payloadKey = type === "email" ? "nhan_email" : "nhan_sms";

      await axiosInstance.put(`/api/khach-hang/${userId}/marketing-preferences`, {
        [payloadKey]: newValue
      });

      if (type === "email") {
        setEmailNoti(newValue);
      } else {
        setSmsNoti(newValue);
      }
      toast.success("Cập nhật cài đặt nhận thông báo thành công!");
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Cập nhật cài đặt thất bại, vui lòng thử lại sau!");
    }
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><div className="dot-pulse"></div></div>;

  const localUser = getUserProfile();
  const profile = { ...(localUser || {}), ...(data || {}) };
  const isCustomer = !!(profile.id_khach_hang || normalizeUserRole(localUser) === "khach_hang");
  const toneCopy = customerToneCopy[isGenZBirthYear(profile?.nam_sinh) ? "genz" : "mature"];

  return (
    <div className="animate-fade-in customer-profile-page">
      <style>{`
        @keyframes slideUpFade { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes editSlide { from { opacity: 0; transform: translateX(-6px); } to { opacity: 1; transform: translateX(0); } }
        .stagger-1 { animation: slideUpFade 0.5s cubic-bezier(.22,.68,0,1.2) 0.05s both; }
        .stagger-2 { animation: slideUpFade 0.5s cubic-bezier(.22,.68,0,1.2) 0.12s both; }
        .stagger-3 { animation: slideUpFade 0.5s cubic-bezier(.22,.68,0,1.2) 0.19s both; }
        .customer-profile-card { animation: slideUpFade 0.45s cubic-bezier(.22,.68,0,1.2) 0.08s both; }
        .customer-profile-security-card { animation: slideUpFade 0.45s cubic-bezier(.22,.68,0,1.2) 0.16s both; }
        .customer-profile-avatar-card { animation: slideUpFade 0.45s cubic-bezier(.22,.68,0,1.2) 0.04s both; transition: transform 0.2s ease; }
        .customer-profile-avatar-card:hover { transform: translateY(-2px); }
        @media (max-width: 768px) {
          .customer-profile-page {
            display: grid;
            gap: 18px;
            padding-bottom: 92px;
          }
          .customer-profile-hero {
            margin-bottom: 0 !important;
            padding: 24px !important;
            border-radius: 28px !important;
            min-height: 0 !important;
          }
          .customer-profile-hero h1 {
            display: block !important;
            font-size: 1.78rem !important;
            line-height: 1.1 !important;
            letter-spacing: 0 !important;
            margin-bottom: 12px !important;
          }
          .customer-profile-hero h1 span {
            font-size: 1.8rem !important;
            vertical-align: middle;
          }
          .customer-profile-hero p {
            font-size: 0.92rem !important;
            line-height: 1.55 !important;
          }
          .customer-profile-layout {
            display: flex !important;
            flex-direction: column;
            grid-template-columns: 1fr !important;
            gap: 18px !important;
          }
          .customer-profile-main-stack,
          .customer-profile-side-stack {
            gap: 16px !important;
            display: contents !important;
          }
          .customer-profile-avatar-card {
            order: 1 !important;
          }
          .customer-profile-card {
            order: 2 !important;
          }
          .customer-profile-security-card {
            order: 3 !important;
          }
          .customer-profile-side-stack > .glass-card:not(.customer-profile-avatar-card) {
            order: 4 !important;
          }
          .customer-profile-side-stack > div:not(.glass-card) {
            order: 5 !important;
          }
          .customer-profile-card,
          .customer-profile-security-card,
          .customer-profile-avatar-card,
          .customer-profile-notify-card {
            padding: 20px !important;
            border-radius: 24px !important;
          }
          .customer-profile-card-header {
            display: grid !important;
            grid-template-columns: 1fr;
            gap: 14px !important;
            align-items: start !important;
            margin-bottom: 22px !important;
          }
          .customer-profile-card-header h3 {
            font-size: 1.2rem !important;
            line-height: 1.25 !important;
          }
          .customer-profile-edit-actions {
            display: grid !important;
            grid-template-columns: 1fr 1fr;
            gap: 10px !important;
          }
          .customer-profile-card-header .btn,
          .customer-profile-edit-actions .btn,
          .customer-profile-security-card .btn {
            width: 100%;
            justify-content: center;
            min-height: 44px;
          }
          .customer-profile-fields {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .customer-profile-fields > div {
            grid-column: auto !important;
            min-width: 0;
          }
          .customer-profile-fields input,
          .customer-profile-fields textarea,
          .customer-profile-fields select {
            font-size: 16px !important;
          }
          .customer-profile-fields div[style*="font-size: 1.4rem"] {
            font-size: 1.1rem !important;
            line-height: 1.35 !important;
            overflow-wrap: anywhere;
          }
          .customer-profile-avatar-card {
            display: grid !important;
            grid-template-columns: auto 1fr;
            align-items: center;
            justify-items: start !important;
            gap: 14px !important;
            text-align: left !important;
            padding: 16px 18px !important;
            border-color: rgba(34, 211, 238, 0.35) !important;
          }
          .customer-profile-avatar-card button[aria-label="Đổi avatar"] {
            width: 72px !important;
            height: 72px !important;
          }
          .customer-profile-avatar-card button[aria-label="Đổi avatar"] > div:last-child {
            width: 66px !important;
            height: 66px !important;
          }
          .customer-profile-avatar-card button[aria-label="Đổi avatar"] span {
            font-size: 1.85rem !important;
          }
          .customer-profile-avatar-card > div:last-child h3 {
            font-size: 1.05rem !important;
            line-height: 1.25 !important;
          }
          .customer-profile-avatar-card > div:last-child p {
            margin-top: 4px !important;
            font-size: 0.68rem !important;
          }
          .customer-profile-notify-card label {
            gap: 12px;
          }
          .customer-profile-danger {
            padding: 18px !important;
            border-radius: 20px !important;
          }
        }
        
        .customer-profile-hero {
          --hero-bg-start: #db2777;
          --hero-bg-mid: #c026d3;
          --hero-bg-end: #7c3aed;
          --hero-shadow-color: rgba(219, 39, 119, 0.22);
        }
        
        [data-theme='dark'] .customer-profile-hero {
          --hero-bg-start: #881337;
          --hero-bg-mid: #4c0519;
          --hero-bg-end: #0f172a;
          --hero-shadow-color: rgba(136, 19, 55, 0.25);
        }
      `}</style>
      <div className="stagger-1 customer-profile-hero" style={{ 
        marginBottom: '40px', 
        padding: '60px 48px', 
        borderRadius: 'var(--radius-xl)', 
        background: 'linear-gradient(135deg, var(--hero-bg-start) 0%, var(--hero-bg-mid) 50%, var(--hero-bg-end) 100%)', 
        color: 'white', 
        position: 'relative', 
        overflow: 'hidden', 
        boxShadow: '0 20px 50px var(--hero-shadow-color)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        {/* Decorative elements */}
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(255,255,255,0.25) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none', filter: 'blur(50px)' }}></div>
        <div style={{ position: 'absolute', bottom: '-20%', left: '-5%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none', filter: 'blur(40px)' }}></div>
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ 
            fontSize: '3.6rem', 
            fontWeight: 950, 
            letterSpacing: '-2.5px', 
            margin: '0 0 16px 0', 
            textShadow: '0 10px 30px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '20px'
          }}>
            Hồ sơ của tôi <span style={{ fontSize: '3.2rem', filter: 'drop-shadow(0 4px 15px rgba(0,0,0,0.3))' }}>👤</span>
          </h1>
          <p style={{ 
            fontWeight: 700, 
            color: 'rgba(255,255,255,0.95)', 
            margin: 0, 
            fontSize: '1.25rem',
            maxWidth: '650px',
            lineHeight: 1.6,
            textShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>
            Quản lý thông tin bảo mật và tùy chỉnh trải nghiệm cá nhân của bạn tại Rexi System.
          </p>
        </div>
      </div>

      <div className="customer-profile-layout" style={{ display: 'grid', gridTemplateColumns: '2.4fr 1fr', gap: '32px' }}>
        <div className="customer-profile-main-stack" style={{ display: 'grid', gap: '32px' }}>
          <div className="glass-card customer-profile-card" style={{ padding: '40px', borderRadius: 'var(--radius-xl)' }}>
            <div className="customer-profile-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>Thông tin cơ bản</h3>
              {!isEditing ? (
                <button data-ai-id="button-thongtincanhan-ixxz" className="btn btn-primary btn-pill" onClick={() => setIsEditing(true)}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                  Chỉnh sửa
                </button>
              ) : (
                <div className="customer-profile-edit-actions" style={{ display: 'flex', gap: '12px' }}>
                  <button data-ai-id="button-thongtincanhan-7lpc" className="btn btn-pill" style={{ background: 'var(--gray-100)', color: 'var(--ink)' }} onClick={() => setIsEditing(false)}>Hủy</button>
                  <button data-ai-id="button-thongtincanhan-0z5q" className="btn btn-primary btn-pill" onClick={handleSave}>Lưu thay đổi</button>
                </div>
              )}
            </div>

            <div className="responsive-grid-2 customer-profile-fields">
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '12px', display: 'block', textTransform: 'uppercase' }}>HỌ VÀ TÊN <span style={{ color: '#ff4d4f' }}>*</span></label>
                {isEditing ? (
                  <input data-ai-id="input-thongtincanhan-yly7" type="text" name={isCustomer ? "ten_khach_hang" : "ho_ten"} value={formData.ten_khach_hang || formData.ho_ten || ''} onChange={handleChange} style={{ width: '100%', padding: '14px 18px', borderRadius: '14px', border: '1px solid var(--gray-200)', background: 'var(--gray-50)', color: 'var(--ink)', fontWeight: 600, outline: 'none' }} />
                ) : (
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--ink)' }}>{profile?.ten_khach_hang || profile?.ho_ten || profile?.displayName || "Khách hàng"}</div>
                )}
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '12px', display: 'block', textTransform: 'uppercase' }}>SỐ ĐIỆN THOẠI <span style={{ color: '#ff4d4f' }}>*</span></label>
                {isEditing ? <input data-ai-id="input-thongtincanhan-6uth" type="tel" name={isCustomer ? "sdt" : "so_dien_thoai"} value={formData.sdt || formData.so_dien_thoai || ''} onChange={handleChange} style={{ width: '100%', padding: '14px 18px', borderRadius: '14px', border: '1px solid var(--gray-200)', background: 'var(--gray-50)', color: 'var(--ink)', fontWeight: 600, outline: 'none' }} /> : <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{data?.sdt || data?.so_dien_thoai || "—"}</div>}
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '12px', display: 'block', textTransform: 'uppercase' }}>EMAIL <span style={{ color: '#ff4d4f' }}>*</span></label>
                {isEditing ? <input data-ai-id="input-thongtincanhan-1qez" type="email" name="email" value={formData.email || ''} onChange={handleChange} style={{ width: '100%', padding: '14px 18px', borderRadius: '14px', border: '1px solid var(--gray-200)', background: 'var(--gray-50)', color: 'var(--ink)', fontWeight: 600, outline: 'none' }} /> : <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{data?.email || "—"}</div>}
              </div>
              {isCustomer && (
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '12px', display: 'block', textTransform: 'uppercase' }}>{toneCopy.profileBirthYearLabel}</label>
                  {isEditing ? (
                    <BirthYearSelect
                      data-ai-id="select-thongtincanhan-namsinh"
                      value={formData.nam_sinh || ''}
                      onChange={(value) => setFormData({ ...formData, nam_sinh: value })}
                      placeholder="Chọn năm sinh"
                      style={{ width: '100%', padding: '14px 18px', borderRadius: '14px', border: '1px solid var(--gray-200)', backgroundColor: 'var(--gray-50)', color: 'var(--ink)', fontWeight: 600, outline: 'none' }}
                    />
                  ) : (
                    <div style={{ fontWeight: 700, color: 'var(--ink)' }}>
                      {data?.nam_sinh ? `${data.nam_sinh} (${toneCopy.profileBirthYearBadge})` : "Chưa cập nhật năm sinh"}
                    </div>
                  )}
                </div>
              )}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '12px', display: 'block', textTransform: 'uppercase' }}>ĐỊA CHỈ LIÊN HỆ</label>
                {isEditing ? (
                  <textarea data-ai-id="textarea-thongtincanhan-diachi" className="form-input" name="dia_chi" value={formData.dia_chi || ''} onChange={handleChange} rows={3} style={{ width: '100%', background: 'var(--gray-50)', color: 'var(--ink)' }} />
                ) : (
                  <div style={{ fontWeight: 700, color: 'var(--ink)', lineHeight: '1.6' }}>{data?.dia_chi || "Chưa cập nhật địa chỉ"}</div>
                )}
              </div>
            </div>
          </div>

          <div className="glass-card customer-profile-security-card" style={{ padding: '48px', borderRadius: 'var(--radius-xl)', border: '1.5px solid var(--primary)' }}>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '16px' }}>Bảo mật & Quyền riêng tư</h3>
            <p style={{ color: 'var(--gray-400)', fontWeight: 600, marginBottom: '32px', fontSize: '1rem' }}>Chúng tôi khuyên bạn nên cập nhật mật khẩu 6 tháng một lần để bảo vệ tài khoản.</p>
            <button data-ai-id="button-thongtincanhan-hydh" className="btn btn-outline btn-pill" onClick={() => setShowPasswordModal(true)} style={{ padding: '14px 40px' }}>
              <span className="material-symbols-outlined">lock_reset</span>
              Thay đổi mật khẩu
            </button>
          </div>
        </div>

        <div className="customer-profile-side-stack" style={{ display: 'grid', gap: '32px', height: 'fit-content' }}>
          <div className="glass-card customer-profile-avatar-card" style={{ padding: '34px 28px', textAlign: 'center', borderRadius: 'var(--radius-xl)', display: 'grid', justifyItems: 'center', gap: '18px' }}>
            <input
              data-ai-id="input-thongtincanhan-avatar"
              ref={avatarInputRef}
              type="file"
              accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} /> <button data-ai-id="button-thongtincanhan-avatar" type="button" aria-label="Đổi avatar" onClick={() => isEditing && avatarInputRef.current?.click()} style={{ width: '124px', height: '124px', padding: 0, border: 'none', borderRadius: '50%', background: 'transparent', position: 'relative', display: 'grid', placeItems: 'center', cursor: isEditing ? 'pointer' : 'default', }} > <div style={{ position: 'absolute', inset: '-4px', borderRadius: '50%', border: '2px solid var(--primary)', boxShadow: '0 0 15px var(--primary), inset 0 0 15px var(--primary)', animation: 'pulse 2s infinite', opacity: 0.8 }} /> <div style={{ position: 'relative', width: '112px', height: '112px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', overflow: 'hidden', border: '2px solid rgba(255,255,255,0.2)', boxShadow: '0 0 20px rgba(13, 148, 136, 0.4)', }}> {avatarPreview ? ( <img src={avatarPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> ) : ( <span style={{ fontSize: '3rem', fontWeight: 900 }}>{(data?.ten_khach_hang || data?.ho_ten || "K").charAt(0).toUpperCase()}</span> )} {isEditing && ( <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(2, 6, 23, 0.48)', color: 'white', }}> <span className="material-symbols-outlined" style={{ fontSize: '34px' }}>photo_camera</span> </div> )} </div> </button> {isEditing && ( <div style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.82rem', marginTop: '-4px' }}> Nhấn vào ảnh để đổi avatar </div> )} <div> <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--ink)', margin: 0 }}>{profile?.ten_khach_hang || profile?.ho_ten || profile?.displayName || "Khách hàng"}</h3> <p style={{ color: 'var(--gray-400)', fontWeight: 800, fontSize: '0.75rem', marginTop: '8px' }}>ID: #{profile?.id_khach_hang || profile?.id_nhan_vien || profile?.id || "—"}</p> </div> </div> {isCustomer && ( <> <div className="glass-card" style={{ padding: '32px', borderRadius: 'var(--radius-xl)' }}> <h4 style={{ fontWeight: 800, marginBottom: '20px', color: 'var(--ink)' }}>Thông báo</h4> <div style={{ display: 'grid', gap: '16px' }}> <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '12px 0', borderBottom: '1px solid var(--gray-100)' }}> <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--ink)' }}>Email Marketing</span> <div data-ai-id="toggle-thongtincanhan-email-marketing" onClick={() => handleToggleMarketing('email', emailNoti)} style={{ width: '50px', height: '26px', background: emailNoti ? 'var(--primary)' : 'var(--gray-200)', borderRadius: '50px', position: 'relative', transition: 'all 0.3s', cursor: 'pointer' }}> <div style={{ width: '18px', height: '18px', background: 'white', borderRadius: '50%', position: 'absolute', top: '4px', left: emailNoti ? '28px' : '4px', transition: 'all 0.3s', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}></div> </div> </label> <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '12px 0' }}> <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--ink)' }}>Thông báo SMS</span> <div data-ai-id="toggle-thongtincanhan-sms-marketing" onClick={() => handleToggleMarketing('sms', smsNoti)} style={{ width: '50px', height: '26px', background: smsNoti ? 'var(--primary)' : 'var(--gray-200)', borderRadius: '50px', position: 'relative', transition: 'all 0.3s', cursor: 'pointer' }}> <div style={{ width: '18px', height: '18px', background: 'white', borderRadius: '50%', position: 'absolute', top: '4px', left: smsNoti ? '28px' : '4px', transition: 'all 0.3s', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}></div> </div> </label> </div> </div> <div style={{ padding: '24px', borderRadius: '24px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', textAlign: 'center' }}> <h4 style={{ color: '#ef4444', fontWeight: 900, fontSize: '0.9rem', marginBottom: '4px' }}>Khu vực nguy hiểm</h4> <p style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 600, marginBottom: '16px', opacity: 0.7 }}>Thao tác này ko thể khôi phục</p> <button data-ai-id="button-thongtincanhan-3fft" className="btn btn-pill" style={{ background: '#ef4444', color: 'white', width: '100%', fontWeight: 800, padding: '12px' }} onClick={() => setShowDeleteModal(true)} > Xóa tài khoản </button> </div> </> )} </div> </div> {/* MODAL ĐỔI MẬT KHẨU */}
      <Modal isOpen={showPasswordModal} onClose={() => { setShowPasswordModal(false); setShowCurrentPass(false); setShowNewPass(false); setShowConfirmPass(false); }} title="Thay đổi mật khẩu" maxWidth="450px">
        <div style={{ display: 'grid', gap: '20px', marginBottom: '32px' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '8px', display: 'block' }}>MẬT KHẨU HIỆN TẠI</label>
            <div style={{ position: "relative" }}>
              <input data-ai-id="input-thongtincanhan-pym5" type={showCurrentPass ? "text" : "password"} name="currentPass" value={passData.currentPass} onChange={handlePassChange} style={{ width: '100%', paddingRight: '48px', background: 'var(--gray-50)', padding: '14px 48px 14px 18px', borderRadius: '14px', border: '1px solid var(--gray-200)', color: 'var(--ink)', fontWeight: 600, outline: 'none' }} />
              <span className="material-symbols-outlined" onClick={() => setShowCurrentPass(!showCurrentPass)} style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "var(--gray-400)", userSelect: "none", zIndex: 10 }}>
                {showCurrentPass ? "visibility" : "visibility_off"}
              </span>
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '8px', display: 'block' }}>MẬT KHẨU MỚI</label>
            <div style={{ position: "relative" }}>
              <input data-ai-id="input-thongtincanhan-lmif" type={showNewPass ? "text" : "password"} name="newPass" value={passData.newPass} onChange={handlePassChange} style={{ width: '100%', paddingRight: '48px', background: 'var(--gray-50)', padding: '14px 48px 14px 18px', borderRadius: '14px', border: '1px solid var(--gray-200)', color: 'var(--ink)', fontWeight: 600, outline: 'none' }} />
              <span className="material-symbols-outlined" onClick={() => setShowNewPass(!showNewPass)} style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "var(--gray-400)", userSelect: "none", zIndex: 10 }}>
                {showNewPass ? "visibility" : "visibility_off"}
              </span>
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '8px', display: 'block' }}>XÁC NHẬN MẬT KHẨU MỚI</label>
            <div style={{ position: "relative" }}>
              <input data-ai-id="input-thongtincanhan-xz62" type={showConfirmPass ? "text" : "password"} name="confirmPass" value={passData.confirmPass} onChange={handlePassChange} style={{ width: '100%', paddingRight: '48px', background: 'var(--gray-50)', padding: '14px 48px 14px 18px', borderRadius: '14px', border: '1px solid var(--gray-200)', color: 'var(--ink)', fontWeight: 600, outline: 'none' }} />
              <span className="material-symbols-outlined" onClick={() => setShowConfirmPass(!showConfirmPass)} style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "var(--gray-400)", userSelect: "none", zIndex: 10 }}>
                {showConfirmPass ? "visibility" : "visibility_off"}
              </span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button data-ai-id="button-thongtincanhan-zsem" className="btn btn-pill" style={{ background: 'var(--gray-100)', color: 'var(--ink)' }} onClick={() => setShowPasswordModal(false)}>Hủy</button>
          <button data-ai-id="button-thongtincanhan-52rs" className="btn btn-primary btn-pill" onClick={handleSavePass}>Lưu mật khẩu</button>
        </div>
      </Modal>

      {/* MODAL XÓA TÀI KHOẢN */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Xác nhận xóa tài khoản" maxWidth="450px">
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ width: '64px', height: '64px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>warning</span>
          </div>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '1.2rem', fontWeight: 950, color: 'var(--ink)' }}>XÁC NHẬN XÓA TÀI KHOẢN?</h4>
          <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--gray-500)', fontWeight: 600, lineHeight: 1.6 }}>
            Hành động này <span style={{ color: '#ef4444', fontWeight: 800 }}>KHÔNG THỂ HOÀN TÁC</span>. 
            Tất cả hồ sơ thú cưng, lịch hẹn và dữ liệu liên quan sẽ bị xóa vĩnh viễn khỏi hệ thống của chúng tôi.
          </p>
        </div>
        <div style={{ display: 'grid', gap: '12px' }}>
          <button data-ai-id="button-thongtincanhan-gl4d"
            className="btn btn-pill"
            style={{ background: '#ef4444', color: 'white', width: '100%', padding: '14px', fontWeight: 800 }}
            onClick={handleDeleteAccount}
            disabled={isDeleting}
          >
            {isDeleting ? "Đang xử lý..." : "Xác nhận xóa vĩnh viễn"}
          </button>
          <button data-ai-id="button-thongtincanhan-g7jh"
            className="btn btn-pill"
            style={{ background: 'var(--gray-100)', color: 'var(--ink)', width: '100%', padding: '14px', fontWeight: 800 }}
            onClick={() => setShowDeleteModal(false)}
            disabled={isDeleting}
          >
            Tôi muốn quay lại
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default React.memo(ThongTinCaNhan);
