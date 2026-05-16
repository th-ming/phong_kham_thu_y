import React, { useState, useEffect } from 'react';
import axiosInstance from '@services/axios';
import { toast } from '@components/Toast';
import { RevealSection } from '@components/SpecialEffects';
import { getUserProfile } from '@utils/index';
import { Modal } from '@components/CommonUI';

const ThongTinCaNhanNhanVien: React.FC = () => {
    const user = getUserProfile() || {};
    const currentUserId = user?.id_nhan_vien || user?.id || 'NV-SYSTEM';
    const userRole = (user.loai_tai_khoan || user.ten_vai_tro || 'STAFF').toUpperCase();

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

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (currentUserId) {
            fetchProfile();
        } else {
            setLoading(false);
        }
    }, [currentUserId]);

    const fetchProfile = async () => {
        try {
            const res = await axiosInstance.get(`/api/nhan-vien/profile/${currentUserId}`);
            setProfile(res.data);
            setFormData(res.data);
        } catch (error) {
            console.error("Lỗi lấy thông tin cá nhân:", error);
            const fallbackProfile = { ho_ten: user.ho_ten || user.display_name || 'Admin', email: user.email || 'admin@rexi.vn', id_nhan_vien: currentUserId };
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
            if (currentUserId === 'NV-SYSTEM' || currentUserId === '1') {
                toast.success("Cập nhật thông tin thành công (Giả lập cho Admin gốc)!");
                setProfile(payload);
                setIsEditing(false);
                return;
            }
            await axiosInstance.put(`/api/nhan-vien/${currentUserId}`, payload);
            toast.success("Cập nhật thông tin thành công!");
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
        if (passwords.newPass.length < 6) {
            toast.error("Mật khẩu mới phải có ít nhất 6 ký tự!");
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

    const displayHoTen = userRole === 'ADMIN' || userRole.includes('QUẢN TRỊ') ? 'Admin Rexi System' : (profile?.ho_ten || profile?.hoTen || 'Nhân viên');
    const displayRole = userRole === 'ADMIN' || userRole.includes('QUẢN TRỊ') ? 'Quản trị viên tối cao' : (profile?.chuyen_mon || profile?.chuyenMon || profile?.chuc_vu || 'Nhân viên hệ thống');

    return (
        <div style={{ padding: '32px 40px', minHeight: '100vh', background: 'var(--background)' }}>
            <style>{`
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
            `}</style>
            <RevealSection>
                <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 950, color: 'var(--ink)', margin: 0, letterSpacing: '-1.5px' }}>
                            Hồ Sơ <span style={{ color: 'var(--primary)' }}>Nhân Sự</span>
                        </h1>
                        <p style={{ color: 'var(--gray-500)', fontWeight: 600, marginTop: '8px' }}>
                            Quản lý thông tin hiển thị và bảo mật tài khoản cá nhân nội bộ.
                        </p>
                    </div>
                    {!isEditing ? (
                        <button className="btn btn-primary btn-pill hover-lift" onClick={() => setIsEditing(true)}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                            Chỉnh sửa hồ sơ
                        </button>
                    ) : (
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="btn btn-pill" style={{ background: 'var(--gray-100)', color: 'var(--ink)' }} onClick={() => { setIsEditing(false); setFormData(profile); }}>Hủy</button>
                            <button className="btn btn-primary btn-pill hover-lift" onClick={handleSave}>Lưu thay đổi</button>
                        </div>
                    )}
                </div>

                <div className="profile-grid">
                    {/* Cột trái: Avatar và Thông tin cơ bản */}
                    <div className="glass-card" style={{ padding: '40px 32px', borderRadius: '32px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '120px', background: 'var(--primary-gradient)', opacity: 0.1 }}></div>
                        
                        <div style={{ width: '140px', height: '140px', margin: '0 auto 24px', borderRadius: '50%', background: 'var(--surface)', padding: '6px', border: '3px solid var(--primary)', position: 'relative', zIndex: 1, boxShadow: '0 10px 25px var(--primary-shadow)' }}>
                            <img 
                                src={formData.hinh_anh || profile.hinh_anh || user.avatar || "/img/avtpkty.png"} 
                                alt={profile.ho_ten || 'Avatar'} 
                                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
                            />
                            {isEditing && (
                                <label style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 'calc(100% - 12px)', height: 'calc(100% - 12px)', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', cursor: 'pointer', transition: 'all 0.3s', zIndex: 10 }}>
                                    <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                                    <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>photo_camera</span>
                                </label>
                            )}
                            {(profile.trang_thai === 'ACTIVE' || profile.trang_thai === 'Đang làm việc' || !profile.trang_thai) && (
                                <div style={{ position: 'absolute', bottom: '5px', right: '5px', width: '20px', height: '20px', background: '#10b981', border: '4px solid var(--surface)', borderRadius: '50%', zIndex: 2 }}></div>
                            )}
                        </div>
                        
                        {isEditing ? (
                            <input 
                                type="text" 
                                name="ho_ten" 
                                value={formData.ho_ten || formData.hoTen || ''} 
                                onChange={handleChange} 
                                className="form-input-edit" 
                                style={{ marginBottom: '10px', textAlign: 'center', fontSize: '1.2rem' }}
                                placeholder="Họ và tên"
                            />
                        ) : (
                            <h2 style={{ fontSize: '1.6rem', fontWeight: 950, color: 'var(--ink)', margin: '0 0 10px 0', letterSpacing: '-0.5px' }}>{displayHoTen}</h2>
                        )}
                        
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--primary-light)', color: 'var(--primary)', padding: '8px 20px', borderRadius: '50px', fontSize: '0.85rem', fontWeight: 800, marginBottom: '32px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>verified_user</span>
                            {displayRole}
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'var(--background)', borderRadius: '20px', border: '1px solid var(--gray-100)' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span className="material-symbols-outlined">badge</span>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--gray-400)', letterSpacing: '1px' }}>MÃ NHÂN SỰ</div>
                                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--ink)' }}>{profile.id_nhan_vien || currentUserId}</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'var(--background)', borderRadius: '20px', border: '1px solid var(--gray-100)' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--blue-50)', color: 'var(--blue-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span className="material-symbols-outlined">mail</span>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--gray-400)', letterSpacing: '1px' }}>EMAIL LIÊN HỆ</div>
                                    {isEditing ? (
                                        <input 
                                            type="email" 
                                            name="email" 
                                            value={formData.email || ''} 
                                            onChange={handleChange} 
                                            className="form-input-edit" 
                                        />
                                    ) : (
                                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile.email || 'Chưa cập nhật'}</div>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'var(--background)', borderRadius: '20px', border: '1px solid var(--gray-100)' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--green-50)', color: 'var(--green-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span className="material-symbols-outlined">call</span>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--gray-400)', letterSpacing: '1px' }}>ĐIỆN THOẠI</div>
                                    {isEditing ? (
                                        <input 
                                            type="tel" 
                                            name="so_dien_thoai" 
                                            value={formData.so_dien_thoai || formData.soDienThoai || ''} 
                                            onChange={handleChange} 
                                            className="form-input-edit" 
                                        />
                                    ) : (
                                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--ink)' }}>{profile.so_dien_thoai || profile.soDienThoai || 'Chưa cập nhật'}</div>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', background: 'var(--background)', borderRadius: '20px', border: '1px solid var(--gray-100)' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--orange-50)', color: 'var(--orange-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span className="material-symbols-outlined">event_available</span>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--gray-400)', letterSpacing: '1px' }}>NGÀY GIA NHẬP</div>
                                    <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--ink)' }}>{profile.ngay_vao_lam ? new Date(profile.ngay_vao_lam).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Cột phải: Chi tiết và Đổi mật khẩu */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        <div className="glass-card" style={{ padding: '40px', borderRadius: '32px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '1.4rem', fontWeight: 950, color: 'var(--ink)', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>history_edu</span>
                                    </div>
                                    Thông Tin Chuyên Môn
                                </h3>
                            </div>
                            
                            <div style={{ padding: '24px', background: 'var(--gray-50)', borderRadius: '20px', color: 'var(--ink)', fontStyle: (profile.gioi_thieu || profile.gioiThieu) ? 'normal' : 'italic', lineHeight: '1.8', fontSize: '0.95rem', border: '1px solid var(--gray-100)' }}>
                                {isEditing ? (
                                    <textarea 
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

                        <div className="glass-card" style={{ padding: '40px', borderRadius: '32px' }}>
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
                                        <span className="material-symbols-outlined" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }}>lock</span>
                                        <input 
                                            type="password" 
                                            required 
                                            value={passwords.currentPass}
                                            onChange={e => setPasswords({...passwords, currentPass: e.target.value})}
                                            placeholder="Nhập mật khẩu đang sử dụng"
                                            style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '12px', border: '1px solid var(--gray-200)', background: 'var(--background)', outline: 'none' }}
                                        />
                                    </div>
                                </div>
                                
                                <div style={{ display: 'grid', gap: '10px' }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--gray-500)', letterSpacing: '1px' }}>MẬT KHẨU MỚI</label>
                                    <div style={{ position: 'relative' }}>
                                        <span className="material-symbols-outlined" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }}>key</span>
                                        <input 
                                            type="password" 
                                            required 
                                            value={passwords.newPass}
                                            onChange={e => setPasswords({...passwords, newPass: e.target.value})}
                                            placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
                                            style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '12px', border: '1px solid var(--gray-200)', background: 'var(--background)', outline: 'none' }}
                                        />
                                    </div>
                                </div>
                                
                                <div style={{ display: 'grid', gap: '10px' }}>
                                    <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--gray-500)', letterSpacing: '1px' }}>XÁC NHẬN MẬT KHẨU MỚI</label>
                                    <div style={{ position: 'relative' }}>
                                        <span className="material-symbols-outlined" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)' }}>fact_check</span>
                                        <input 
                                            type="password" 
                                            required 
                                            value={passwords.confirmPass}
                                            onChange={e => setPasswords({...passwords, confirmPass: e.target.value})}
                                            placeholder="Nhập lại mật khẩu mới"
                                            style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '12px', border: '1px solid var(--gray-200)', background: 'var(--background)', outline: 'none' }}
                                        />
                                    </div>
                                </div>
                                
                                <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '8px' }}>
                                    <button 
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
                        
                        <div style={{ padding: '32px', borderRadius: '32px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                            <h4 style={{ color: '#ef4444', fontWeight: 900, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span className="material-symbols-outlined">warning</span>
                                Vùng Nguy Hiểm
                            </h4>
                            <p style={{ fontSize: '0.9rem', color: 'var(--ink)', fontWeight: 600, lineHeight: '1.6', marginBottom: '20px' }}>Hành động này sẽ vô hiệu hóa tài khoản của bạn vĩnh viễn và không thể hoàn tác.</p>
                            <button className="btn btn-pill hover-lift" style={{ background: '#ef4444', color: 'white', padding: '12px 24px', fontWeight: 800 }} onClick={() => setShowDeleteModal(true)}>
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

export default ThongTinCaNhanNhanVien;
