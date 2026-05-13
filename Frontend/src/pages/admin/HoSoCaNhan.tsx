import React, { useState } from 'react';
import { HieuUngHienDan } from '../../components/HieuUngDacBiet';
import { useTheme } from '../../contexts/ThemeContext';

const HoSoCaNhan: React.FC = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [isEditing, setIsEditing] = useState(false);

    return (
        <div style={{ padding: '32px', background: 'var(--background)', minHeight: '100vh' }}>
            <HieuUngHienDan>
                <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--ink)', margin: 0 }}>Hồ Sơ Cá Nhân</h1>
                        <p style={{ color: 'var(--gray-500)', marginTop: '4px' }}>Quản lý thông tin cá nhân và thiết lập tài khoản của bạn</p>
                    </div>
                    <button 
                        onClick={() => setIsEditing(!isEditing)}
                        style={{
                            padding: '12px 24px',
                            background: isEditing ? 'var(--gray-200)' : 'var(--primary)',
                            color: isEditing ? 'var(--ink)' : 'white',
                            border: 'none',
                            borderRadius: '16px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <span className="material-symbols-outlined">{isEditing ? 'close' : 'edit'}</span>
                        {isEditing ? 'Hủy chỉnh sửa' : 'Chỉnh sửa hồ sơ'}
                    </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '32px' }}>
                    {/* CỘT TRÁI: AVATAR & THÔNG TIN CHUNG */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        <div className="glass-card" style={{ padding: '40px', borderRadius: '32px', textAlign: 'center', background: 'var(--surface)', border: '1px solid var(--gray-200)' }}>
                            <div style={{ position: 'relative', width: '150px', height: '150px', margin: '0 auto 24px' }}>
                                <div style={{ 
                                    width: '100%', 
                                    height: '100%', 
                                    borderRadius: '50%', 
                                    border: '4px solid var(--primary)',
                                    padding: '4px',
                                    background: isDark ? 'rgba(255,255,255,0.1)' : 'var(--background)',
                                    boxShadow: isDark ? '0 0 30px rgba(45, 212, 191, 0.4)' : 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <img 
                                        src="/img/avtpkty.png" 
                                        alt="Avatar" 
                                        style={{ 
                                            width: '90%', 
                                            height: '90%', 
                                            borderRadius: '50%', 
                                            objectFit: 'contain',
                                            filter: isDark ? 'drop-shadow(0 0 10px rgba(255,255,255,0.5))' : 'none'
                                        }} 
                                    />
                                </div>
                                {isEditing && (
                                    <button style={{ position: 'absolute', bottom: '5px', right: '5px', width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', cursor: 'pointer' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>photo_camera</span>
                                    </button>
                                )}
                            </div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--ink)', marginBottom: '4px' }}>Admin Rexi</h2>
                            <p style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '24px' }}>Quản trị viên hệ thống</p>
                            
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                                <div style={{ padding: '12px', borderRadius: '16px', background: 'var(--gray-50)', flex: 1 }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 950, color: 'var(--ink)' }}>1.2k</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', fontWeight: 800 }}>NHIỆM VỤ</div>
                                </div>
                                <div style={{ padding: '12px', borderRadius: '16px', background: 'var(--gray-50)', flex: 1 }}>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 950, color: 'var(--ink)' }}>4.9</div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', fontWeight: 800 }}>ĐÁNH GIÁ</div>
                                </div>
                            </div>
                        </div>

                        <div className="glass-card" style={{ padding: '32px', borderRadius: '32px', background: 'var(--surface)', border: '1px solid var(--gray-200)' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--ink)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>contact_mail</span>
                                Thông tin liên hệ
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 800, marginBottom: '4px' }}>EMAIL</p>
                                    <p style={{ color: 'var(--ink)', fontWeight: 600 }}>admin@rexi.vn</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 800, marginBottom: '4px' }}>SỐ ĐIỆN THOẠI</p>
                                    <p style={{ color: 'var(--ink)', fontWeight: 600 }}>035 337 4156</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 800, marginBottom: '4px' }}>ĐỊA CHỈ</p>
                                    <p style={{ color: 'var(--ink)', fontWeight: 600 }}>Gia Lâm, Hà Nội</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CỘT PHẢI: CHI TIẾT & CÀI ĐẶT */}
                    <div className="glass-card" style={{ padding: '40px', borderRadius: '32px', background: 'var(--surface)', border: '1px solid var(--gray-200)' }}>
                        <div style={{ marginBottom: '40px', borderBottom: '1px solid var(--gray-100)', paddingBottom: '20px', display: 'flex', gap: '32px' }}>
                            <button style={{ background: 'none', border: 'none', padding: '0 0 16px 0', borderBottom: '3px solid var(--primary)', color: 'var(--primary)', fontWeight: 900, cursor: 'pointer' }}>Thông tin chung</button>
                            <button style={{ background: 'none', border: 'none', padding: '0 0 16px 0', color: 'var(--gray-400)', fontWeight: 800, cursor: 'pointer' }}>Bảo mật</button>
                            <button style={{ background: 'none', border: 'none', padding: '0 0 16px 0', color: 'var(--gray-400)', fontWeight: 800, cursor: 'pointer' }}>Thông báo</button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gray-500)' }}>HỌ VÀ TÊN</label>
                                <input 
                                    type="text" 
                                    defaultValue="Admin Rexi" 
                                    disabled={!isEditing}
                                    style={{ padding: '16px', borderRadius: '16px', border: '1px solid var(--gray-200)', background: isEditing ? 'var(--background)' : 'var(--gray-50)', color: 'var(--ink)', fontWeight: 600 }} 
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gray-500)' }}>BIỆT DANH</label>
                                <input 
                                    type="text" 
                                    defaultValue="rexi_admin" 
                                    disabled={!isEditing}
                                    style={{ padding: '16px', borderRadius: '16px', border: '1px solid var(--gray-200)', background: isEditing ? 'var(--background)' : 'var(--gray-50)', color: 'var(--ink)', fontWeight: 600 }} 
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gray-500)' }}>GIỚI TÍNH</label>
                                <select 
                                    disabled={!isEditing}
                                    style={{ padding: '16px', borderRadius: '16px', border: '1px solid var(--gray-200)', background: isEditing ? 'var(--background)' : 'var(--gray-50)', color: 'var(--ink)', fontWeight: 600 }}
                                >
                                    <option>Nam</option>
                                    <option>Nữ</option>
                                    <option>Khác</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gray-500)' }}>NGÀY SINH</label>
                                <input 
                                    type="date" 
                                    defaultValue="1995-01-01" 
                                    disabled={!isEditing}
                                    style={{ padding: '16px', borderRadius: '16px', border: '1px solid var(--gray-200)', background: isEditing ? 'var(--background)' : 'var(--gray-50)', color: 'var(--ink)', fontWeight: 600 }} 
                                />
                            </div>
                        </div>

                        <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gray-500)' }}>TIỂU SỬ / GIỚI THIỆU</label>
                            <textarea 
                                rows={4}
                                defaultValue="Tôi là người yêu động vật và luôn mong muốn mang lại những giá trị tốt nhất cho cộng đồng thú cưng."
                                disabled={!isEditing}
                                style={{ padding: '16px', borderRadius: '16px', border: '1px solid var(--gray-200)', background: isEditing ? 'var(--background)' : 'var(--gray-50)', color: 'var(--ink)', fontWeight: 600, resize: 'none' }} 
                            />
                        </div>

                        {isEditing && (
                            <div style={{ marginTop: '40px', display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                                <button style={{ padding: '14px 32px', borderRadius: '16px', border: '1px solid var(--gray-200)', background: 'none', color: 'var(--ink)', fontWeight: 800, cursor: 'pointer' }}>Mặc định</button>
                                <button style={{ padding: '14px 32px', borderRadius: '16px', border: 'none', background: 'var(--primary)', color: 'white', fontWeight: 900, cursor: 'pointer', boxShadow: '0 8px 16px var(--primary-shadow)' }}>Lưu thay đổi</button>
                            </div>
                        )}
                    </div>
                </div>
            </HieuUngHienDan>
        </div>
    );
};

export default HoSoCaNhan;
