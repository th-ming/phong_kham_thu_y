import React from 'react';
import { HieuUngHienDan } from '../../components/HieuUngDacBiet';
import { useTheme } from '../../contexts/ThemeContext';

const ThongTinCaNhanNhanVien: React.FC = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const infoItems = [
        { label: 'MÃ NHÂN VIÊN', value: 'NV-2024-001', icon: 'badge' },
        { label: 'CHỨC VỤ', value: 'Bác sĩ thú y chính', icon: 'medical_services' },
        { label: 'PHÒNG BAN', value: 'Khoa Nội', icon: 'account_tree' },
        { label: 'NGÀY VÀO LÀM', value: '15/01/2024', icon: 'event' },
        { label: 'TRẠNG THÁI', value: 'Đang làm việc', icon: 'verified' },
        { label: 'LOẠI HỢP ĐỒNG', value: 'Chính thức', icon: 'description' },
    ];

    return (
        <div style={{ padding: '32px', background: 'var(--background)', minHeight: '100vh' }}>
            <HieuUngHienDan>
                <div style={{ marginBottom: '32px' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--ink)', margin: 0 }}>Thông Tin Nhân Viên</h1>
                    <p style={{ color: 'var(--gray-500)', marginTop: '4px' }}>Chi tiết hồ sơ nhân sự và thông tin nghề nghiệp</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px' }}>
                    {/* CỘT TRÁI: THÔNG TIN CHI TIẾT */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        <div className="glass-card" style={{ padding: '40px', borderRadius: '32px', background: 'var(--surface)', border: '1px solid var(--gray-200)' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--ink)', marginBottom: '32px', borderLeft: '4px solid var(--primary)', paddingLeft: '16px' }}>Thông tin nghề nghiệp</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '40px' }}>
                                {infoItems.map((item, index) => (
                                    <div key={index} style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                        <div style={{ width: '50px', height: '50px', borderRadius: '16px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                            <span className="material-symbols-outlined">{item.icon}</span>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 800, margin: '0 0 4px 0', letterSpacing: '0.5px' }}>{item.label}</p>
                                            <p style={{ color: 'var(--ink)', fontWeight: 700, fontSize: '1.05rem', margin: 0 }}>{item.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="glass-card" style={{ padding: '40px', borderRadius: '32px', background: 'var(--surface)', border: '1px solid var(--gray-200)' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--ink)', marginBottom: '32px', borderLeft: '4px solid var(--primary)', paddingLeft: '16px' }}>Kỹ năng & Chuyên môn</h3>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                {['Phẫu thuật ngoại khoa', 'Nội soi thú cưng', 'Chẩn đoán hình ảnh', 'Cấp cứu 24/7', 'Quản lý kho dược'].map((skill, i) => (
                                    <div key={i} style={{ padding: '10px 20px', borderRadius: '12px', background: 'var(--gray-100)', color: 'var(--ink)', fontWeight: 700, fontSize: '0.9rem' }}>
                                        {skill}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* CỘT PHẢI: THẺ NHÂN VIÊN */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        <div className="id-card" style={{ 
                            background: isDark ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' : 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)',
                            borderRadius: '32px',
                            padding: '40px',
                            color: 'white',
                            textAlign: 'center',
                            position: 'relative',
                            overflow: 'hidden',
                            boxShadow: isDark ? '0 20px 40px rgba(0,0,0,0.4)' : '0 20px 40px rgba(13, 148, 136, 0.2)'
                        }}>
                            <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(45, 212, 191, 0.1)' }}></div>
                            
                            <img 
                                src="/img/avtpkty.png" 
                                alt="Nhân viên" 
                                style={{ width: '120px', height: '120px', borderRadius: '30px', border: '3px solid rgba(255,255,255,0.2)', marginBottom: '20px', position: 'relative', zIndex: 1 }} 
                            />
                            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: '8px', position: 'relative', zIndex: 1 }}>TRẦN MINH ĐỨC</h2>
                            <p style={{ color: '#2dd4bf', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '32px', position: 'relative', zIndex: 1 }}>BÁC SĨ CHÍNH</p>
                            
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px', display: 'flex', justifyContent: 'center' }}>
                                <img src="/img/barcode.png" alt="Barcode" style={{ height: '40px', filter: 'invert(1)', opacity: 0.7 }} />
                            </div>
                        </div>

                        <div className="glass-card" style={{ padding: '32px', borderRadius: '32px', background: 'var(--surface)', border: '1px solid var(--gray-200)' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--ink)', marginBottom: '20px' }}>Ghi chú quản lý</h3>
                            <p style={{ color: 'var(--gray-500)', lineHeight: 1.6, fontSize: '0.9rem' }}>
                                Nhân viên ưu tú tháng 4/2024. Có khả năng xử lý tốt các tình huống khẩn cấp và giao tiếp tốt với khách hàng.
                            </p>
                        </div>
                    </div>
                </div>
            </HieuUngHienDan>
        </div>
    );
};

export default ThongTinCaNhanNhanVien;
