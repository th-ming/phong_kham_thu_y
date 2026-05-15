import React, { useState, useEffect } from "react";
import axiosInstance from "@services/axios";
import { useNavigate } from "react-router-dom";
import { Modal } from "@components/CommonUI";
import { getUserProfile } from "@utils/index";
import { toast } from "@components/Toast";

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
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const user = getUserProfile();
      if (user) {
        const userId = user.id_khach_hang || user.id || user.id_nhan_vien;
        if (!userId) {
          console.warn("Không tìm thấy ID người dùng!");
          setLoading(false);
          return;
        }
        const endpoint = (user.id_khach_hang || user.id)
          ? `/api/khach-hang/${user.id_khach_hang || user.id}`
          : `/api/nhan-vien/profile/${user.id_nhan_vien}`;

        axiosInstance.get(endpoint)
          .then(res => {
            setData(res.data);
            setFormData(res.data);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePassChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassData({ ...passData, [e.target.name]: e.target.value });
  };

  const handleSavePass = async () => {
    if (passData.newPass !== passData.confirmPass) {
      toast.error("Mật khẩu xác nhận không khớp!");
      return;
    }
    try {
      const user = getUserProfile();
      const username = user?.ten_dang_nhap || user?.username || user?.email;

      await axiosInstance.post("/api/auth/change-password", {
        username: username,
        currentPass: passData.currentPass,
        newPassword: passData.newPass
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
      const userId = user?.id_khach_hang || user?.id || user?.id_nhan_vien;

      if (!userId) {
        toast.error("Không tìm thấy thông tin tài khoản. Vui lòng đăng nhập lại!");
        return;
      }

      const tenHienTai = formData.ten_khach_hang || formData.ho_ten || '';
      if (!tenHienTai.trim()) {
        toast.error("Họ và tên không được để trống!");
        return;
      }

      const isCustomerUser = !!(user?.id_khach_hang || user?.id);
      const endpoint = isCustomerUser
        ? `/api/khach-hang/${userId}`
        : `/api/nhan-vien/${userId}`;

      axiosInstance.put(endpoint, formData)
        .then(() => {
          toast.success("Cập nhật thông tin thành công!");
          setData(formData);
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
      const userId = user?.id_khach_hang || user?.id || data?.id_khach_hang;
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

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><div className="dot-pulse"></div></div>;

  const isCustomer = data && (data.id_khach_hang != null || data.id != null || getUserProfile()?.id_khach_hang != null);

  return (
    <div className="animate-fade-in">
      <div className="stagger-1" style={{ 
        marginBottom: '40px', 
        padding: '60px 48px', 
        borderRadius: 'var(--radius-xl)', 
        background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)', 
        color: 'white', 
        position: 'relative', 
        overflow: 'hidden', 
        boxShadow: '0 20px 50px rgba(168, 85, 247, 0.25)',
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

      <div style={{ display: 'grid', gridTemplateColumns: '2.4fr 1fr', gap: '32px' }}>
        <div style={{ display: 'grid', gap: '32px' }}>
          <div className="glass-card" style={{ padding: '40px', borderRadius: 'var(--radius-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>Thông tin cơ bản</h3>
              {!isEditing ? (
                <button className="btn btn-primary btn-pill" onClick={() => setIsEditing(true)}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                  Chỉnh sửa
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn btn-pill" style={{ background: 'var(--gray-100)', color: 'var(--ink)' }} onClick={() => setIsEditing(false)}>Hủy</button>
                  <button className="btn btn-primary btn-pill" onClick={handleSave}>Lưu thay đổi</button>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '12px', display: 'block', textTransform: 'uppercase' }}>HỌ VÀ TÊN <span style={{ color: '#ff4d4f' }}>*</span></label>
                {isEditing ? (
                  <input type="text" name={isCustomer ? "ten_khach_hang" : "ho_ten"} value={formData.ten_khach_hang || formData.ho_ten || ''} onChange={handleChange} style={{ width: '100%', padding: '14px 18px', borderRadius: '14px', border: '1px solid var(--gray-200)', background: 'var(--gray-50)', color: 'var(--ink)', fontWeight: 600, outline: 'none' }} />
                ) : (
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--ink)' }}>{data?.ten_khach_hang || data?.ho_ten || "Khách hàng"}</div>
                )}
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '12px', display: 'block', textTransform: 'uppercase' }}>SỐ ĐIỆN THOẠI <span style={{ color: '#ff4d4f' }}>*</span></label>
                {isEditing ? <input type="tel" name={isCustomer ? "sdt" : "so_dien_thoai"} value={formData.sdt || formData.so_dien_thoai || ''} onChange={handleChange} style={{ width: '100%', padding: '14px 18px', borderRadius: '14px', border: '1px solid var(--gray-200)', background: 'var(--gray-50)', color: 'var(--ink)', fontWeight: 600, outline: 'none' }} /> : <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{data?.sdt || data?.so_dien_thoai || "—"}</div>}
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '12px', display: 'block', textTransform: 'uppercase' }}>EMAIL <span style={{ color: '#ff4d4f' }}>*</span></label>
                {isEditing ? <input type="email" name="email" value={formData.email || ''} onChange={handleChange} style={{ width: '100%', padding: '14px 18px', borderRadius: '14px', border: '1px solid var(--gray-200)', background: 'var(--gray-50)', color: 'var(--ink)', fontWeight: 600, outline: 'none' }} /> : <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{data?.email || "—"}</div>}
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '12px', display: 'block', textTransform: 'uppercase' }}>ĐỊA CHỈ LIÊN HỆ</label>
                {isEditing ? (
                  <textarea className="form-input" name="dia_chi" value={formData.dia_chi || ''} onChange={handleChange} rows={3} style={{ width: '100%', background: 'var(--gray-50)', color: 'var(--ink)' }} />
                ) : (
                  <div style={{ fontWeight: 700, color: 'var(--ink)', lineHeight: '1.6' }}>{data?.dia_chi || "Chưa cập nhật địa chỉ"}</div>
                )}
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '48px', borderRadius: 'var(--radius-xl)', border: '1.5px solid var(--primary)' }}>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '16px' }}>Bảo mật & Quyền riêng tư</h3>
            <p style={{ color: 'var(--gray-400)', fontWeight: 600, marginBottom: '32px', fontSize: '1rem' }}>Chúng tôi khuyên bạn nên cập nhật mật khẩu 6 tháng một lần để bảo vệ tài khoản.</p>
            <button className="btn btn-outline btn-pill" onClick={() => setShowPasswordModal(true)} style={{ padding: '14px 40px' }}>
              <span className="material-symbols-outlined">lock_reset</span>
              Thay đổi mật khẩu
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gap: '32px', height: 'fit-content' }}>
          <div className="glass-card" style={{ padding: '32px', textAlign: 'center', borderRadius: 'var(--radius-xl)' }}>
            <div style={{ width: '100px', height: '100px', background: 'var(--primary-gradient)', borderRadius: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', margin: '0 auto 24px', boxShadow: 'var(--shadow-lg)', overflow: 'hidden' }}>
              {getUserProfile()?.hinh_anh || getUserProfile()?.avatar ? (
                <img src={getUserProfile()?.hinh_anh || getUserProfile()?.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span className="material-symbols-outlined" style={{ fontSize: '48px' }}>person</span>
              )}
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--ink)', margin: 0 }}>{data?.ten_khach_hang || data?.ho_ten}</h3>
            <p style={{ color: 'var(--gray-400)', fontWeight: 800, fontSize: '0.75rem', marginTop: '8px' }}>ID: #{data?.id_khach_hang || data?.id_nhan_vien || data?.id}</p>
          </div>

          <div className="glass-card" style={{ padding: '32px', borderRadius: 'var(--radius-xl)' }}>
            <h4 style={{ fontWeight: 800, marginBottom: '20px', color: 'var(--ink)' }}>Thông báo</h4>
            <div style={{ display: 'grid', gap: '16px' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '12px 0', borderBottom: '1px solid var(--gray-100)' }}>
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--ink)' }}>Email Marketing</span>
                <div onClick={() => setEmailNoti(!emailNoti)} style={{ width: '50px', height: '26px', background: emailNoti ? 'var(--primary)' : 'var(--gray-200)', borderRadius: '50px', position: 'relative', transition: 'all 0.3s', cursor: 'pointer' }}>
                  <div style={{ width: '18px', height: '18px', background: 'white', borderRadius: '50%', position: 'absolute', top: '4px', left: emailNoti ? '28px' : '4px', transition: 'all 0.3s', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}></div>
                </div>
              </label>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', padding: '12px 0' }}>
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--ink)' }}>Thông báo SMS</span>
                <div onClick={() => setSmsNoti(!smsNoti)} style={{ width: '50px', height: '26px', background: smsNoti ? 'var(--primary)' : 'var(--gray-200)', borderRadius: '50px', position: 'relative', transition: 'all 0.3s', cursor: 'pointer' }}>
                  <div style={{ width: '18px', height: '18px', background: 'white', borderRadius: '50%', position: 'absolute', top: '4px', left: smsNoti ? '28px' : '4px', transition: 'all 0.3s', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}></div>
                </div>
              </label>
            </div>
          </div>

          <div style={{ 
            padding: '24px', 
            borderRadius: '24px', 
            background: 'rgba(239, 68, 68, 0.05)', 
            border: '1px solid rgba(239, 68, 68, 0.1)',
            textAlign: 'center'
          }}>
            <h4 style={{ color: '#ef4444', fontWeight: 900, fontSize: '0.9rem', marginBottom: '4px' }}>Khu vực nguy hiểm</h4>
            <p style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 600, marginBottom: '16px', opacity: 0.7 }}>Thao tác này không thể khôi phục</p>
            <button 
              className="btn btn-pill" 
              style={{ background: '#ef4444', color: 'white', width: '100%', fontWeight: 800, padding: '12px' }} 
              onClick={() => setShowDeleteModal(true)}
            >
              Xóa tài khoản
            </button>
          </div>
        </div>
      </div>

      {/* MODAL ĐỔI MẬT KHẨU */}
      <Modal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="Thay đổi mật khẩu" maxWidth="450px">
        <div style={{ display: 'grid', gap: '20px', marginBottom: '32px' }}>
          <div>
            <label>MẬT KHẨU HIỆN TẠI</label>
            <input type="password" name="currentPass" value={passData.currentPass} onChange={handlePassChange} style={{ width: '100%' }} />
          </div>
          <div>
            <label>MẬT KHẨU MỚI</label>
            <input type="password" name="newPass" value={passData.newPass} onChange={handlePassChange} style={{ width: '100%' }} />
          </div>
          <div>
            <label>XÁC NHẬN MẬT KHẨU MỚI</label>
            <input type="password" name="confirmPass" value={passData.confirmPass} onChange={handlePassChange} style={{ width: '100%' }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button className="btn btn-pill" style={{ background: 'var(--gray-100)', color: 'var(--ink)' }} onClick={() => setShowPasswordModal(false)}>Hủy</button>
          <button className="btn btn-primary btn-pill" onClick={handleSavePass}>Lưu mật khẩu</button>
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
          <button
            className="btn btn-pill"
            style={{ background: '#ef4444', color: 'white', width: '100%', padding: '14px', fontWeight: 800 }}
            onClick={handleDeleteAccount}
            disabled={isDeleting}
          >
            {isDeleting ? "Đang xử lý..." : "Xác nhận xóa vĩnh viễn"}
          </button>
          <button
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
