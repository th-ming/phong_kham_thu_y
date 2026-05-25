import React, { useState, useEffect } from "react";
import { useRef } from "react";
import axiosInstance from "@services/axios";
import { useNavigate } from "react-router-dom";
import { Modal } from "@components/CommonUI";
import { getUserProfile, normalizeUserRole } from "@utils/index";
import { toast } from "@components/Toast";
import { isValidPassword, PASSWORD_POLICY_MESSAGE } from "@utils/passwordPolicy";

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
  const userInitial = String(data?.ten_khach_hang || data?.ho_ten || data?.ten_dang_nhap || "R").trim().charAt(0).toUpperCase();

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
                <button data-ai-id="button-thongtincanhan-ixxz" className="btn btn-primary btn-pill" onClick={() => setIsEditing(true)}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                  Chỉnh sửa
                </button>
              ) : (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button data-ai-id="button-thongtincanhan-7lpc" className="btn btn-pill" style={{ background: 'var(--gray-100)', color: 'var(--ink)' }} onClick={() => setIsEditing(false)}>Hủy</button>
                  <button data-ai-id="button-thongtincanhan-0z5q" className="btn btn-primary btn-pill" onClick={handleSave}>Lưu thay đổi</button>
                </div>
              )}
            </div>

            <div className="responsive-grid-2">
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
                  <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '12px', display: 'block', textTransform: 'uppercase' }}>NĂM SINH (CÁ NHÂN HÓA TRẢI NGHIỆM)</label>
                  {isEditing ? (
                    <input
                      data-ai-id="input-thongtincanhan-namsinh"
                      type="number"
                      name="nam_sinh"
                      min="1920"
                      max={new Date().getFullYear()}
                      value={formData.nam_sinh || ''}
                      onChange={handleChange}
                      style={{ width: '100%', padding: '14px 18px', borderRadius: '14px', border: '1px solid var(--gray-200)', background: 'var(--gray-50)', color: 'var(--ink)', fontWeight: 600, outline: 'none' }}
                    />
                  ) : (
                    <div style={{ fontWeight: 700, color: 'var(--ink)' }}>
                      {data?.nam_sinh ? `${data.nam_sinh} (${data.nam_sinh >= 1997 ? "Gen Z vui vẻ 🐱🎉" : "Trưởng thành chuẩn mực 🩺✨"})` : "Chưa cập nhật năm sinh"}
                    </div>
                  )}
                </div>
              )}
              <div style={{ gridColumn: '1 / -1' }}>
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
            <button data-ai-id="button-thongtincanhan-hydh" className="btn btn-outline btn-pill" onClick={() => setShowPasswordModal(true)} style={{ padding: '14px 40px' }}>
              <span className="material-symbols-outlined">lock_reset</span>
              Thay đổi mật khẩu
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div className="glass-card" style={{ padding: '40px', borderRadius: 'var(--radius-xl)', textAlign: 'center' }}>
            <div style={{ 
              width: '140px', 
              height: '140px', 
              borderRadius: '50%', 
              background: 'var(--primary-gradient)', 
              display: 'grid', 
              placeItems: 'center', 
              margin: '0 auto 28px auto', 
              boxShadow: '0 15px 35px var(--primary-shadow)',
              position: 'relative',
              cursor: isEditing ? 'pointer' : 'default'
            }} onClick={() => isEditing && avatarInputRef.current?.click()}>
              <div style={{ width: '130px', height: '130px', borderRadius: '50%', overflow: 'hidden', border: '4px solid white', background: 'var(--primary)', display: 'grid', placeItems: 'center', color: 'white', fontWeight: 950, fontSize: '3.2rem' }}>
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <span>{userInitial}</span>
                )}
              </div>
              {isEditing && (
                <div style={{
                  position: 'absolute',
                  bottom: '4px',
                  right: '4px',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'var(--ink)',
                  color: 'white',
                  display: 'grid',
                  placeItems: 'center',
                  boxShadow: 'var(--shadow-md)',
                  border: '2px solid white'
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>photo_camera</span>
                </div>
              )}
            </div>
            <input type="file" ref={avatarInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleAvatarChange} />
            <h4 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--ink)', margin: '0 0 6px 0' }}>{profile?.ten_khach_hang || profile?.ho_ten || "Khách hàng"}</h4>
            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)', margin: '0 0 16px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>{isCustomer ? "Khách hàng thân thiết" : "Nhân viên phòng khám"}</p>
          </div>

          <div className="glass-card" style={{ padding: '40px', borderRadius: 'var(--radius-xl)' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '28px' }}>Tùy chọn nhận tin</h3>
            <div style={{ display: 'grid', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontWeight: 700, color: 'var(--ink)', fontSize: '0.95rem' }}>Email Marketing</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 600 }}>Nhận tin ưu đãi, khuyến mãi hàng tuần</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={emailNoti} onChange={(e) => handleMarketingChange("email", e.target.checked)} />
                  <span className="toggle-slider"></span>
                </label>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontWeight: 700, color: 'var(--ink)', fontSize: '0.95rem' }}>Tin nhắn nhắc lịch (SMS)</h4>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 600 }}>Nhận thông báo nhắc lịch khám, chăm sóc bé</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" checked={smsNoti} onChange={(e) => handleMarketingChange("sms", e.target.checked)} />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>

          {isCustomer && (
            <div className="glass-card" style={{ padding: '40px', borderRadius: 'var(--radius-xl)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ef4444', marginBottom: '12px' }}>Khu vực nguy hiểm</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--gray-400)', fontWeight: 600, marginBottom: '24px', lineHeight: 1.5 }}>Một khi bạn xóa hồ sơ, mọi thông tin thú cưng, lịch sử bệnh án và hóa đơn liên quan sẽ bị ẩn vĩnh viễn.</p>
              <button data-ai-id="button-thongtincanhan-643m" className="btn btn-pill" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1.5px solid rgba(239, 68, 68, 0.2)', width: '100%', fontWeight: 800 }} onClick={() => setShowDeleteModal(true)}>Xóa tài khoản vĩnh viễn</button>
            </div>
          )}
        </div>
      </div>

      {/* MODAL ĐỔI MẬT KHẨU */}
      <Modal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="Thay đổi mật khẩu bảo mật">
        <div style={{ display: 'grid', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '8px', display: 'block' }}>MẬT KHẨU HIỆN TẠI</label>
            <div style={{ position: 'relative' }}>
              <input data-ai-id="input-thongtincanhan-qj3x" type={showCurrentPass ? "text" : "password"} name="currentPass" value={passData.currentPass} onChange={handlePassChange} style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', border: '1px solid var(--gray-200)', background: 'var(--gray-50)', color: 'var(--ink)', fontWeight: 600, paddingRight: '48px', outline: 'none' }} />
              <span className="material-symbols-outlined" style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--gray-400)', fontSize: '20px' }} onClick={() => setShowCurrentPass(!showCurrentPass)}>
                {showCurrentPass ? "visibility" : "visibility_off"}
              </span>
            </div>
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '8px', display: 'block' }}>MẬT KHẨU MỚI</label>
            <div style={{ position: 'relative' }}>
              <input data-ai-id="input-thongtincanhan-wcr0" type={showNewPass ? "text" : "password"} name="newPass" value={passData.newPass} onChange={handlePassChange} style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', border: '1px solid var(--gray-200)', background: 'var(--gray-50)', color: 'var(--ink)', fontWeight: 600, paddingRight: '48px', outline: 'none' }} />
              <span className="material-symbols-outlined" style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--gray-400)', fontSize: '20px' }} onClick={() => setShowNewPass(!showNewPass)}>
                {showNewPass ? "visibility" : "visibility_off"}
              </span>
            </div>
            <p style={{ margin: '8px 0 0 0', fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 600, lineHeight: 1.4 }}>{PASSWORD_POLICY_MESSAGE}</p>
          </div>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '8px', display: 'block' }}>XÁC NHẬN MẬT KHẨU MỚI</label>
            <div style={{ position: 'relative' }}>
              <input data-ai-id="input-thongtincanhan-8kpl" type={showConfirmPass ? "text" : "password"} name="confirmPass" value={passData.confirmPass} onChange={handlePassChange} style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', border: '1px solid var(--gray-200)', background: 'var(--gray-50)', color: 'var(--ink)', fontWeight: 600, paddingRight: '48px', outline: 'none' }} />
              <span className="material-symbols-outlined" style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--gray-400)', fontSize: '20px' }} onClick={() => setShowConfirmPass(!showConfirmPass)}>
                {showConfirmPass ? "visibility" : "visibility_off"}
              </span>
            </div>
          </div>
          <button data-ai-id="button-thongtincanhan-n7s4" className="btn btn-primary" onClick={handleSavePass} style={{ padding: '16px', borderRadius: '12px', fontWeight: 800, marginTop: '12px' }}>Cập nhật mật khẩu mới</button>
        </div>
      </Modal>

      {/* MODAL XÁC NHẬN XÓA TÀI KHOẢN */}
      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Xác nhận xóa tài khoản vĩnh viễn">
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div style={{ width: '72px', height: '72px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '50%', display: 'grid', placeItems: 'center', margin: '0 auto 20px auto' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '36px' }}>warning</span>
          </div>
          <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--ink)', margin: '0 0 12px 0' }}>Hành động này không thể khôi phục!</h4>
          <p style={{ fontSize: '0.9rem', color: 'var(--gray-400)', fontWeight: 600, lineHeight: 1.6, margin: '0 0 32px 0', padding: '0 20px' }}>
            Bạn có chắc chắn muốn xóa tài khoản này? Toàn bộ dữ liệu thú cưng, lịch sử khám bệnh và dịch vụ của bạn sẽ bị ẩn hoàn toàn khỏi hệ thống phòng khám.
          </p>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button data-ai-id="button-thongtincanhan-1d70" className="btn" style={{ flex: 1, background: 'var(--gray-100)', color: 'var(--ink)', fontWeight: 800, padding: '14px' }} onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>Hủy bỏ</button>
            <button data-ai-id="button-thongtincanhan-m1b4" className="btn" style={{ flex: 1, background: '#ef4444', color: 'white', fontWeight: 800, padding: '14px', boxShadow: '0 8px 20px rgba(239, 68, 68, 0.25)' }} onClick={handleDeleteAccount} disabled={isDeleting}>
              {isDeleting ? "Đang xử lý..." : "Xác nhận xóa"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default React.memo(ThongTinCaNhan);
