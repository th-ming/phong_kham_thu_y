import React, { useState, useEffect } from 'react';
import axiosInstance from '@services/axios';
import { toast } from '@components/Toast';
import { RevealSection } from '@components/SpecialEffects';
import { getUserProfile, normalizeUserRole } from '@utils/index';
import { Modal } from '@components/CommonUI';
import { isValidPassword, PASSWORD_POLICY_MESSAGE } from '@utils/passwordPolicy';
import { notifyUserProfileChanged } from '@hooks/useLiveUserProfile';

const ThongTinCaNhanNhanVien: React.FC = () => {
    const user = getUserProfile() || {};
    const currentUserId = user?.id_nhan_vien || user?.id || 'NV-SYSTEM';
    const userRole = normalizeUserRole(user);

    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<any>({});

    const [passwords, setPasswords] = useState({
        currentPass: '',
        newPass: '',
        confirmPass: ''
    });
    const [isChangingPass, setIsChangingPass] = useState(false);
    const [showCurrentPass, setShowCurrentPass] = useState(false);
    const [showNewPass, setShowNewPass] = useState(false);
    const [showConfirmPass, setShowConfirmPass] = useState(false);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (currentUserId) {
            fetchProfile();
        } else {
            setLoading(false);
        }
    }, [currentUserId]);

    useEffect(() => {
        const handleRealtimeProfile = (event: Event) => {
            const payload = (event as CustomEvent).detail || {};
            if (payload.resource === "profile" && payload.scope === "staff" && payload.id === currentUserId) {
                fetchProfile();
            }
        };
        window.addEventListener("rexi-data-changed", handleRealtimeProfile);
        return () => window.removeEventListener("rexi-data-changed", handleRealtimeProfile);
    }, [currentUserId]);

    // FIX: API trả null với 200 OK cho Admin tối cao (id_nhan_vien = null → fallback NV-SYSTEM).
    // Axios ko throw error với 200 OK, nên phải check !res.data để ép vào catch kích hoạt fallback profile Admin.
    const fetchProfile = async () => {
        try {
            const res = await axiosInstance.get(`/api/nhan-vien/profile/${currentUserId}`);
            if (!res.data) {
                throw new Error("API trả về null — kích hoạt fallback Admin profile");
            }
            setProfile(res.data);
            setFormData(res.data);
        } catch (error) {
            console.error("Lỗi lấy thông tin cá nhân:", error);
            // Fallback: sinh profile giả lập từ thông tin localStorage cho Admin tối cao
            const fallbackEmail = user.email ||
                                 (user.ten_dang_nhap?.includes('@') ? user.ten_dang_nhap : null) ||
                                 (user.ten_dang_nhap === 'quanly' ? 'quanly@gmail.com' : null) ||
                                 (user.ten_dang_nhap ? `${user.ten_dang_nhap}@rexi.vn` : 'admin@rexi.vn');
            const fallbackProfile = {
                ho_ten: user.ho_ten || user.display_name || 'Admin',
                email: fallbackEmail,
                id_nhan_vien: currentUserId
            };
            setProfile(fallbackProfile);
            setFormData(fallbackProfile);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        const hoTen = formData.hoTen || formData.ho_ten;
        if (!hoTen?.trim()) {
            toast.error("Họ và tên không được để trống!");
            return;
        }
        try {
            const payload = {
                ...profile,
                ...formData
            };

            // Đồng bộ hóa thông tin mới vào localStorage ngay lập tức để Sidebar và Header cập nhật
            const syncLocalStorage = (updatedData: any) => {
                const localUser = JSON.parse(localStorage.getItem("user") || "{}");
                localUser.ho_ten = updatedData.ho_ten || updatedData.hoTen || localUser.ho_ten;
                localUser.display_name = updatedData.ho_ten || updatedData.hoTen || localUser.display_name;
                localUser.displayName = updatedData.ho_ten || updatedData.hoTen || localUser.displayName;
                if (updatedData.hinh_anh) {
                    localUser.avatar = updatedData.hinh_anh;
                    localUser.hinh_anh = updatedData.hinh_anh;
                }
                if (updatedData.email) {
                    localUser.email = updatedData.email;
                }
                localStorage.setItem("user", JSON.stringify(localUser));
                notifyUserProfileChanged(localUser);
            };

            if (currentUserId === 'NV-SYSTEM' || currentUserId === '1') {
                toast.success("Cập nhật thông tin thành công (Giả lập cho Admin gốc)!");
                setProfile(payload);
                syncLocalStorage(payload);
                setIsEditing(false);
                return;
            }

            await axiosInstance.put(`/api/nhan-vien/${currentUserId}`, payload);
            toast.success("Cập nhật thông tin thành công!");
            syncLocalStorage(payload);
            fetchProfile();
            setIsEditing(false);
        } catch (error) {
            console.error(error);
            toast.error("Cập nhật thất bại!");
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwords.newPass !== passwords.confirmPass) {
            toast.error("Mật khẩu xác nhận không khớp!");
            return;
        }
        if (!isValidPassword(passwords.newPass)) {
            toast.error(PASSWORD_POLICY_MESSAGE);
            return;
        }

        setIsChangingPass(true);
        try {
            await axiosInstance.post('/api/auth/change-password', {
                currentPass: passwords.currentPass,
                newPass: passwords.newPass
            });
            toast.success("Đổi mật khẩu thành công! Vui lòng sử dụng mật khẩu mới cho lần đăng nhập sau.");
            setPasswords({ currentPass: '', newPass: '', confirmPass: '' });
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Đổi mật khẩu thất bại!");
        } finally {
            setIsChangingPass(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                toast.error("Ảnh đại diện phải dưới 2MB!");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, hinh_anh: reader.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDeleteAccount = async () => {
        setIsDeleting(true);
        try {
            await axiosInstance.delete(`/api/nhan-vien/${currentUserId}`);
            toast.success("Tài khoản nhân viên đã được vô hiệu hóa.");
            localStorage.clear();
            window.location.href = "/dang-nhap";
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Lỗi khi xóa tài khoản. Vui lòng thử lại sau.");
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <div className="dot-pulse"></div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <h2 style={{ color: 'var(--ink)' }}>Không tìm thấy thông tin hồ sơ cá nhân.</h2>
                <p style={{ color: 'var(--gray-500)' }}>Vui lòng đăng nhập lại hoặc liên hệ quản trị viên.</p>
            </div>
        );
    }

    const displayHoTen = userRole === 'admin' ? 'Admin Rexi System' : (profile?.ho_ten || profile?.hoTen || 'Nhân viên');
    const displayRole = userRole === 'admin' ? 'Quản trị viên tối cao' : (profile?.chuyen_mon || profile?.chuyenMon || profile?.chuc_vu || 'Nhân viên hệ thống');

    return (
        <div className="admin-staff-profile-page" style={{ padding: '32px 40px', minHeight: '100vh', background: 'var(--background)' }}>
            <style>{`
                @keyframes slideUpFade { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes editSlide { from { opacity: 0; transform: translateX(-8px); } to { opacity: 1; transform: translateX(0); } }
                @keyframes pulseSave { 0%, 100% { box-shadow: 0 0 0 0 rgba(20,184,166,0); } 50% { box-shadow: 0 0 0 8px rgba(20,184,166,0.15); } }
                .admin-staff-profile-card { animation: slideUpFade 0.45s cubic-bezier(.22,.68,0,1.2) both; }
                .admin-staff-profile-section { animation: slideUpFade 0.45s cubic-bezier(.22,.68,0,1.2) both; }
                .admin-staff-profile-section:nth-child(2) { animation-delay: 0.08s; }
                .admin-staff-danger { animation: slideUpFade 0.45s cubic-bezier(.22,.68,0,1.2) both; animation-delay: 0.16s; }
                .form-input-edit { animation: editSlide 0.25s ease both; transition: border-color 0.2s, box-shadow 0.2s; }
                .form-input-edit:focus { border-color: var(--primary) !important; box-shadow: 0 0 0 3px rgba(20,184,166,0.15) !important; }
                .profile-grid {
                    display: grid;
                    grid-template-columns: 1fr 2.5fr;
                    gap: 32px;
                    align-items: start;
                }
                @media (max-width: 900px) {
                    .profile-grid {
                        grid-template-columns: 1fr;
                    }
                }
                .form-input-edit {
                    width: 100%;
                    padding: 8px 12px;
                    border-radius: 8px;
                    border: 1px solid var(--primary);
                    background: var(--surface);
                    color: var(--ink);
                    outline: none;
                    font-weight: 700;
                    font-family: inherit;
                }
                @media (max-width: 1024px) {
                    .admin-staff-profile-page {
                        padding: 18px 12px 190px !important;
                    }
                    .admin-staff-profile-header {
                        display: grid !important;
                        grid-template-columns: 1fr !important;
                        gap: 12px !important;
                        margin-bottom: 16px !important;
                    }
                    .admin-staff-profile-header h1 {
                        max-width: 15ch !important;
                        font-size: clamp(1.28rem, 5.8vw, 1.58rem) !important;
                        line-height: 1.08 !important;
                        letter-spacing: -0.02em !important;
                    }
                    .admin-staff-profile-header p {
                        max-width: 32ch !important;
                        margin-top: 6px !important;
                        font-size: 0.72rem !important;
                        line-height: 1.32 !important;
                    }
                    .admin-staff-profile-actions {
                        display: grid !important;
                        grid-template-columns: 1fr !important;
                        gap: 8px !important;
                        width: min(100%, 260px) !important;
                    }
                    .admin-staff-profile-actions .btn,
                    .admin-staff-profile-header > .btn {
                        width: 100% !important;
                        min-height: 38px !important;
                        padding: 7px 12px !important;
                        border-radius: 14px !important;
                        font-size: 0.78rem !important;
                    }
                    .profile-grid {
                        grid-template-columns: 1fr !important;
                        gap: 14px !important;
                    }
                    .admin-staff-profile-card {
                        padding: 12px !important;
                        border-radius: 18px !important;
                    }
                    .admin-staff-profile-card::before {
                        height: 70px !important;
                    }
                    .admin-staff-avatar {
                        width: 72px !important;
                        height: 72px !important;
                        margin-bottom: 8px !important;
                        padding: 4px !important;
                    }
                    .admin-staff-profile-card h2 {
                        font-size: 0.92rem !important;
                        line-height: 1.2 !important;
                        margin-bottom: 6px !important;
                    }
                    .admin-staff-role-chip {
                        padding: 5px 10px !important;
                        font-size: 0.64rem !important;
                        margin-bottom: 10px !important;
                    }
                    .admin-staff-profile-info {
                        display: grid !important;
                        grid-template-columns: 1fr 1fr !important;
                        gap: 8px !important;
                    }
                    .admin-staff-info-row {
                        min-width: 0 !important;
                        padding: 8px !important;
                        border-radius: 12px !important;
                        gap: 8px !important;
                        align-items: flex-start !important;
                    }
                    .admin-staff-info-icon {
                        width: 28px !important;
                        height: 28px !important;
                        border-radius: 9px !important;
                        flex: 0 0 28px !important;
                    }
                    .admin-staff-info-row .material-symbols-outlined {
                        font-size: 17px !important;
                    }
                    .admin-staff-info-label {
                        font-size: 0.52rem !important;
                        letter-spacing: 0.05em !important;
                    }
                    .admin-staff-info-value {
                        font-size: 0.68rem !important;
                        line-height: 1.25 !important;
                        overflow-wrap: anywhere !important;
                    }
                    .admin-staff-profile-stack {
                        gap: 14px !important;
                    }
                    .admin-staff-profile-section {
                        padding: 12px !important;
                        border-radius: 18px !important;
                    }
                    .admin-staff-profile-section h3 {
                        margin-bottom: 10px !important;
                        font-size: 0.86rem !important;
                        line-height: 1.2 !important;
                        gap: 8px !important;
                    }
                    .admin-staff-profile-section h3 > div {
                        width: 28px !important;
                        height: 28px !important;
                        border-radius: 9px !important;
                    }
                    .admin-staff-profile-section textarea,
                    .admin-staff-profile-section input {
                        font-size: 0.82rem !important;
                    }
                    .admin-staff-profile-section .profile-text-panel {
                        padding: 10px !important;
                        border-radius: 12px !important;
                        font-size: 0.7rem !important;
                        line-height: 1.38 !important;
                    }
                    .admin-staff-danger {
                        padding: 16px !important;
                        border-radius: 20px !important;
                    }
                    .admin-staff-danger p {
                        font-size: 0.78rem !important;
                    }
                    .admin-staff-danger .btn,
                    .admin-staff-profile-section .btn {
                        width: 100% !important;
                        min-height: 42px !important;
                        padding: 9px 12px !important;
                        font-size: 0.78rem !important;
                    }
                }
            `}</style>
            <RevealSection>
                <div className="admin-staff-profile-header" style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 950, color: 'var(--ink)', margin: 0, letterSpacing: '-1.5px' }}>
                            Hồ Sơ <span style={{ color: 'var(--primary)' }}>Nhân Sự</span>
                        </h1>
                        <p style={{ color: 'var(--gray-500)', fontWeight: 600, marginTop: '8px' }}>
                            Quản lý thông tin hiển thị và bảo mật tài khoản cá nhân nội bộ.
                        </p>
                    </div>
                    {!isEditing ? (
                        <button data-ai-id="button-thongtincanhannhanvien-ro4p" className="btn btn-primary btn-pill hover-lift" onClick={() => setIsEditing(true)}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                            Chỉnh sửa hồ sơ
                        </button>
                    ) : (
                        <div className="admin-staff-profile-actions" style={{ display: 'flex', gap: '12px' }}>
                            <button data-ai-id="button-thongtincanhannhanvien-18ck" className="btn btn-pill" style={{ background: 'var(--gray-100)', color: 'var(--ink)' }} onClick={() => { setIsEditing(false); setFormData(profile); }}>Hủy</button>
                            <button data-ai-id="button-thongtincanhannhanvien-ripx" className="btn btn-primary btn-pill hover-lift" onClick={handleSave}>Lưu thay đổi</button>
                        </div>
                    )}
                </div>

                <div className="profile-grid">
                    {/* Cột trái: Avatar và Thông tin cơ bản */}
                    <div className="glass-card admin-staff-profile-card" style={{ padding: '40px 32px', borderRadius: '32px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '120px', background: 'var(--primary-gradient)', opacity: 0.1 }}></div>

                        <div className="admin-staff-avatar" style={{ width: '140px', height: '140px', margin: '0 auto 24px', borderRadius: '50%', background: 'var(--surface)', padding: '6px', border: '3px solid var(--primary)', position: 'relative', zIndex: 1, boxShadow: '0 10px 25px var(--primary-shadow)' }}>
                            <img
                                src={formData.hinh_anh || profile.hinh_anh || user.avatar || "/img/avtpkty.png"}
                                alt={profile.ho_ten || 'Avatar'}
                                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                            />
                            {isEditing && (
                                <label style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 'calc(100% - 12px)', height: 'calc(100% - 12px)', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', transition: 'all 0.3s', zIndex: 10 }}>
                                    <input data-ai-id="input-thongtincanhannhanvien-p2ps" type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} /> <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>photo_camera</span> </label>
                            )} {(profile.trang_thai === 'ACTIVE' || profile.trang_thai === 'Đang làm việc' || !profile.trang_thai) && ( <div style={{ position: 'absolute', bottom: '5px', right: '5px', width: '20px', height: '20px', background: '#10b981', border: '4px solid var(--surface)', borderRadius: '50%', zIndex: 2 }}></div> )} </div> {isEditing ? ( <input data-ai-id="input-thongtincanhannhanvien-59by" type="text" name="ho_ten" value={formData.ho_ten || formData.hoTen || ''} onChange={handleChange} className="form-input-edit" style={{ marginBottom: '10px', textAlign: 'center', fontSize: '1.2rem' }} placeholder="Họ và tên" /> ) : ( <h2 style={{ fontSize: '1.6rem', fontWeight: 950, color: 'var(--ink)', margin: '0 0 10px 0', letterSpacing: '-0.5px' }}>{displayHoTen}</h2> )} <div className="admin-staff-role-chip" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--primary-light)', color: 'var(--primary)', padding: '8px 20px', borderRadius: '50px', fontSize: '0.85rem', fontWeight: 800, marginBottom: '32px' }}> <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>verified_user</span> {displayRole} </div> <div className="admin-staff-profile-info" style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}> <div className="admin-staff-info-row" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'var(--background)', borderRadius: '20px', border: '1px solid var(--gray-100)' }}> <div className="admin-staff-info-icon" style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}> <span className="material-symbols-outlined">badge</span> </div> <div> <div className="admin-staff-info-label" style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--gray-400)', letterSpacing: '1px' }}>MÃ NHÂN SỰ</div> <div className="admin-staff-info-value" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--ink)' }}>{profile.id_nhan_vien || currentUserId}</div> </div> </div> <div className="admin-staff-info-row" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'var(--background)', borderRadius: '20px', border: '1px solid var(--gray-100)' }}> <div className="admin-staff-info-icon" style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--blue-50)', color: 'var(--blue-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}> <span className="material-symbols-outlined">mail</span> </div> <div style={{ flex: 1, minWidth: 0 }}> <div className="admin-staff-info-label" style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--gray-400)', letterSpacing: '1px' }}>EMAIL LIÊN HỆ</div> {isEditing ? ( <input data-ai-id="input-thongtincanhannhanvien-8fb5" type="email" name="email" value={formData.email || ''} onChange={handleChange} className="form-input-edit" /> ) : ( <div className="admin-staff-info-value" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile.email || 'Chưa cập nhật'}</div> )} </div> </div> <div className="admin-staff-info-row" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'var(--background)', borderRadius: '20px', border: '1px solid var(--gray-100)' }}> <div className="admin-staff-info-icon" style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--green-50)', color: 'var(--green-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}> <span className="material-symbols-outlined">call</span> </div> <div style={{ flex: 1, minWidth: 0 }}> <div className="admin-staff-info-label" style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--gray-400)', letterSpacing: '1px' }}>ĐIỆN THOẠI</div> {isEditing ? ( <input data-ai-id="input-thongtincanhannhanvien-rivm" type="tel" name="so_dien_thoai" value={formData.so_dien_thoai || formData.soDienThoai || ''} onChange={handleChange} className="form-input-edit" /> ) : ( <div className="admin-staff-info-value" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--ink)' }}>{profile.so_dien_thoai || profile.soDienThoai || 'Chưa cập nhật'}</div> )} </div> </div> <div className="admin-staff-info-row" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'var(--background)', borderRadius: '20px', border: '1px solid var(--gray-100)' }}> <div className="admin-staff-info-icon" style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--orange-50)', color: 'var(--orange-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}> <span className="material-symbols-outlined">event_available</span> </div> <div> <div className="admin-staff-info-label" style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--gray-400)', letterSpacing: '1px' }}>NGÀY GIA NHẬP</div> <div className="admin-staff-info-value" style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--ink)' }}> {(profile.ngay_vao_lam || profile.ngay_tao || profile.createdAt) ? new Date(profile.ngay_vao_lam || profile.ngay_tao || profile.createdAt).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN')} </div> </div> </div> </div> </div> {/* Cột phải: Chi tiết và Đổi mật khẩu */}
                    <div className="admin-staff-profile-stack" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        <div className="glass-card admin-staff-profile-section" style={{ padding: '40px', borderRadius: '32px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '1.4rem', fontWeight: 950, color: 'var(--ink)', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>history_edu</span>
                                    </div>
                                    Thông Tin Chuyên Môn
                                </h3>
                            </div>

                            <div className="profile-text-panel" style={{ padding: '24px', background: 'var(--gray-50)', borderRadius: '20px', color: 'var(--ink)', fontStyle: (profile.gioi_thieu || profile.gioiThieu) ? 'normal' : 'italic', lineHeight: '1.8', fontSize: '0.95rem', border: '1px solid var(--gray-100)' }}>
                                {isEditing ? (
                                    <textarea
                                        data-ai-id="textarea-thongtincanhannhanvien-gioithieu"
                                        name="gioi_thieu"
                                        value={formData.gioi_thieu || formData.gioiThieu || ''}
                                        onChange={handleChange}
                                        className="form-input-edit"
                                        rows={5}
                                        placeholder="Giới thiệu bản thân, chuyên môn, kinh nghiệm làm việc..."
                                    />
                                ) : (
                                    profile.gioi_thieu || profile.gioiThieu || "Chưa có thông tin giới thiệu. Bạn có thể cập nhật thêm chi tiết về kinh nghiệm làm việc, bằng cấp và chuyên môn của mình để khách hàng hiểu rõ hơn."
                                )}
                            </div>
                        </div>

                        <div className="glass-card admin-staff-profile-section" style={{ padding: '40px', borderRadius: '32px' }}>
                            <h3 style={{ fontSize: '1.4rem', fontWeight: 950, color: 'var(--ink)', marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(244, 63, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span className="material-symbols-outlined" style={{ color: '#f43f5e' }}>shield_lock</span>
                                </div>
                                Bảo Mật Tài Khoản
                            </h3>

                            <form onSubmit={handlePasswordChange} style={{ display: 'grid', gap: '24px', maxWidth: '600px' }}>
                                <div style={{ display: 'grid', gap: '10px' }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--gray-500)', letterSpacing: '1px' }}>MẬT KHẨU HIỆN TẠI</label>
                                    <div style={{ position: 'relative' }}>
                                        <span className="material-symbols-outlined" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', pointerEvents: 'none' }}>lock</span>
                                        <input data-ai-id="input-thongtincanhannhanvien-eegh"
                                            type={showCurrentPass ? "text" : "password"}
                                            required
                                            value={passwords.currentPass}
                                            onChange={e => setPasswords({...passwords, currentPass: e.target.value})}
                                            placeholder="Nhập mật khẩu đang sử dụng"
                                            style={{ width: '100%', padding: '14px 48px 14px 48px', borderRadius: '12px', border: '1px solid var(--gray-200)', background: 'var(--background)', outline: 'none' }}
                                        />
                                        <span className="material-symbols-outlined" onClick={() => setShowCurrentPass(!showCurrentPass)} style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "var(--gray-400)", userSelect: "none", zIndex: 10 }}>
                                            {showCurrentPass ? "visibility" : "visibility_off"}
                                        </span>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gap: '10px' }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--gray-500)', letterSpacing: '1px' }}>MẬT KHẨU MỚI</label>
                                    <div style={{ position: 'relative' }}>
                                        <span className="material-symbols-outlined" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', pointerEvents: 'none' }}>key</span>
                                        <input data-ai-id="input-thongtincanhannhanvien-59qv"
                                            type={showNewPass ? "text" : "password"}
                                            required
                                            value={passwords.newPass}
                                            onChange={e => setPasswords({...passwords, newPass: e.target.value})}
                                            placeholder="Nhập mật khẩu mới (7-20 ký tự, có ký tự đặc biệt)"
                                            style={{ width: '100%', padding: '14px 48px 14px 48px', borderRadius: '12px', border: '1px solid var(--gray-200)', background: 'var(--background)', outline: 'none' }}
                                        />
                                        <span className="material-symbols-outlined" onClick={() => setShowNewPass(!showNewPass)} style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "var(--gray-400)", userSelect: "none", zIndex: 10 }}>
                                            {showNewPass ? "visibility" : "visibility_off"}
                                        </span>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gap: '10px' }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--gray-500)', letterSpacing: '1px' }}>XÁC NHẬN MẬT KHẨU MỚI</label>
                                    <div style={{ position: 'relative' }}>
                                        <span className="material-symbols-outlined" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', pointerEvents: 'none' }}>fact_check</span>
                                        <input data-ai-id="input-thongtincanhannhanvien-hgyd"
                                            type={showConfirmPass ? "text" : "password"}
                                            required
                                            value={passwords.confirmPass}
                                            onChange={e => setPasswords({...passwords, confirmPass: e.target.value})}
                                            placeholder="Nhập lại mật khẩu mới"
                                            style={{ width: '100%', padding: '14px 48px 14px 48px', borderRadius: '12px', border: '1px solid var(--gray-200)', background: 'var(--background)', outline: 'none' }}
                                        />
                                        <span className="material-symbols-outlined" onClick={() => setShowConfirmPass(!showConfirmPass)} style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "var(--gray-400)", userSelect: "none", zIndex: 10 }}>
                                            {showConfirmPass ? "visibility" : "visibility_off"}
                                        </span>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '8px' }}>
                                    <button data-ai-id="button-thongtincanhannhanvien-3flh"
                                        type="submit"
                                        disabled={isChangingPass}
                                        className="btn btn-primary btn-pill hover-lift"
                                        style={{ padding: '16px 32px', fontSize: '0.95rem', fontWeight: 900 }}
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>update</span>
                                        {isChangingPass ? 'ĐANG CẬP NHẬT...' : 'CẬP NHẬT MẬT KHẨU MỚI'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div className="admin-staff-danger" style={{ padding: '32px', borderRadius: '32px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                            <h4 style={{ color: '#ef4444', fontWeight: 900, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className="material-symbols-outlined">warning</span>
                                Vùng Nguy Hiểm
                            </h4>
                            <p style={{ fontSize: '0.9rem', color: 'var(--ink)', fontWeight: 600, lineHeight: '1.6', marginBottom: '20px' }}>Hành động này sẽ vô hiệu hóa tài khoản của bạn vĩnh viễn và không thể hoàn tác.</p>
                            <button data-ai-id="button-thongtincanhannhanvien-66if" className="btn btn-pill hover-lift" style={{ background: '#ef4444', color: 'white', padding: '12px 24px', fontWeight: 800 }} onClick={() => setShowDeleteModal(true)}>
                                Yêu Cầu Xóa Tài Khoản
                            </button>
                        </div>
                    </div>
                </div>
            </RevealSection>

            {/* MODAL XÓA TÀI KHOẢN */}
            <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Xác nhận xóa tài khoản" maxWidth="450px">
                <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                    <div style={{ width: '64px', height: '64px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>warning</span>
                    </div>
                    <h4 style={{ margin: '0 0 12px 0', fontSize: '1.1rem', fontWeight: 900, color: 'var(--ink)' }}>Hành động không thể hoàn tác!</h4>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--gray-500)', fontWeight: 600, lineHeight: 1.6 }}>
                        Bạn có chắc chắn muốn xóa tài khoản nhân viên? Mọi quyền truy cập hệ thống sẽ bị vô hiệu hóa ngay lập tức.
                    </p>
                </div>
                <div style={{ display: 'grid', gap: '12px' }}>
                    <button data-ai-id="button-thongtincanhannhanvien-2qks"
                        className="btn btn-pill"
                        style={{ background: '#ef4444', color: 'white', width: '100%', padding: '14px', fontWeight: 800 }}
                        onClick={handleDeleteAccount}
                        disabled={isDeleting}
                    >
                        {isDeleting ? "Đang xử lý..." : "Xác nhận xóa vĩnh viễn"}
                    </button>
                    <button data-ai-id="button-thongtincanhannhanvien-r2p8"
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

export default ThongTinCaNhanNhanVien;
