import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MemeCat, ScrollToTop, RevealSection } from "@components/SpecialEffects";
import axiosInstance from "@services/axios";
import { formatTienVND, getUserProfile, normalizeUserRole } from "@utils/index";
import { toast } from "@components/Toast";
import { useTheme } from "../contexts/ThemeContextV2";

interface ServiceData {
    id_dich_vu: number | string;
    ten_dich_vu: string;
    mo_ta: string;
    gia: number;
    trang_thai: boolean;
}

const FALLBACK_SERVICES: ServiceData[] = [
    { id_dich_vu: "fallback-kham", ten_dich_vu: "Khám tổng quát", mo_ta: "Kiểm tra sức khỏe toàn diện cho thú cưng.", gia: 150000, trang_thai: true },
    { id_dich_vu: "fallback-tiem", ten_dich_vu: "Tiêm phòng", mo_ta: "Tiêm vaccine định kỳ theo lịch.", gia: 200000, trang_thai: true },
    { id_dich_vu: "fallback-xn", ten_dich_vu: "Xét nghiệm máu", mo_ta: "Xét nghiệm máu toàn phần.", gia: 280000, trang_thai: true },
    { id_dich_vu: "fallback-sieu-am", ten_dich_vu: "Siêu âm", mo_ta: "Chẩn đoán hình ảnh bằng siêu âm.", gia: 350000, trang_thai: true },
    { id_dich_vu: "fallback-pt", ten_dich_vu: "Phẫu thuật nhỏ", mo_ta: "Các ca phẫu thuật nhỏ theo chỉ định.", gia: 1500000, trang_thai: true },
    { id_dich_vu: "fallback-spa", ten_dich_vu: "Spa & Grooming", mo_ta: "Tắm, vệ sinh và cắt tỉa lông.", gia: 100000, trang_thai: true },
];

const priceGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 450px), 1fr))',
    gap: '32px'
};

const BangGiaDichVu: React.FC = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const navigate = useNavigate();
    const [services, setServices] = useState<ServiceData[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);

    const handleBookingClick = (e: React.MouseEvent) => {
        e.preventDefault();
        const user = getUserProfile();
        if (user) {
            if (normalizeUserRole(user) !== "khach_hang") {
                toast.info("Bạn đang đăng nhập với tài khoản nhân sự. Hệ thống đang chuyển hướng bạn đến Trang quản lý lịch hẹn nội bộ!");
                navigate("/quan-ly/lich-hen");
                return;
            }
        }
        navigate('/khach-hang/dat-lich-hen');
    };

    useEffect(() => {

        const fetchServices = async (showLoading = true) => {
            if (showLoading) setLoading(true);
            try {
                const response = await axiosInstance.get('/api/dich-vu/active');
                const nextServices = Array.isArray(response.data) ? response.data : [];
                setServices(nextServices);
                setLoadError(false);
            } catch (error) {
                console.error("Lỗi lấy bảng giá:", error);
                setLoadError(true);
                setServices((current) => current.length > 0 ? current : FALLBACK_SERVICES);
            } finally {
                if (showLoading) setLoading(false);
            }
        };
        
        fetchServices(true);

        // Smart Polling: Lấy dữ liệu ngầm mỗi 10 giây. Không load lại trang, không nháy màn hình, số tự nhảy cực kỳ êm ái!
        const interval = setInterval(() => {
            fetchServices(false);
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    // Logic phân loại dịch vụ động
    const categorizedServices = useMemo(() => {
        const categories = [
            { title: "Khám Lâm Sàng & Chẩn Đoán", icon: "stethoscope", color: "#0ea5e9", keywords: ["khám", "siêu âm", "x-quang", "xét nghiệm", "chẩn đoán"] },
            { title: "Tiêm Phòng & Tẩy Giun", icon: "vaccines", color: "#10b981", keywords: ["tiêm", "vaccine", "vắc", "giun", "ký sinh"] },
            { title: "Phẫu Thuật & Can Thiệp", icon: "surgical", color: "#f59e0b", keywords: ["phẫu thuật", "mổ", "triệt sản", "răng", "xương"] },
            { title: "Lưu Chuồng & Grooming", icon: "spa", color: "#14b8a6", keywords: ["tắm", "cắt tỉa", "spa", "lưu chuồng", "nội trú", "grooming"] }
        ];

        return categories.map(cat => {
            const items = services.filter(s =>
                s.trang_thai && cat.keywords.some(key => s.ten_dich_vu.toLowerCase().includes(key))
            );
            return { ...cat, items };
        }).filter(cat => cat.items.length > 0);
    }, [services]);

    // Những dịch vụ không thuộc nhóm nào sẽ vào nhóm "Dịch vụ khác"
    const otherServices = useMemo(() => {
        return services.filter(s =>
            s.trang_thai && !categorizedServices.some(cat => cat.items.some(item => item.id_dich_vu === s.id_dich_vu))
        );
    }, [services, categorizedServices]);

    return (
        <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
            <section style={{ padding: '100px 0 80px', background: isDark ? 'var(--secondary-gradient)' : 'var(--primary-gradient)', color: 'white', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: isDark ? 0.05 : 0.1, backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
                <div style={{ position: 'absolute', top: '-50%', left: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(13, 148, 136, 0.25) 0%, transparent 70%)', borderRadius: '50%' }}></div>
                <div style={{ position: 'absolute', bottom: '-40%', right: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(34, 211, 238, 0.15) 0%, transparent 70%)', borderRadius: '50%' }}></div>
                <div className="container" style={{ position: 'relative', zIndex: 1 }}>
                    <RevealSection>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', padding: '8px 20px', borderRadius: '50px', fontSize: '0.85rem', fontWeight: 900, marginBottom: '24px', border: '1px solid rgba(255,255,255,0.1)', letterSpacing: '1px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#2dd4bf' }}>verified</span>
                            MINH BẠCH & RÕ RÀNG
                        </div>
                        <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 950, marginBottom: "24px", letterSpacing: "-1px" }}>
                            Bảng Giá <span style={{ color: "#2dd4bf" }}>Dịch Vụ</span>
                        </h1>
                        <p style={{ fontSize: "1.15rem", maxWidth: "650px", margin: "0 auto", lineHeight: 1.6, fontWeight: 500, color: '#cbd5e1' }}>
                            Rexi Vet cam kết cung cấp dịch vụ y tế chuẩn quốc tế. Mọi chi phí được cập nhật chính xác từ hệ thống quản lý của chúng tôi.
                        </p>
                    </RevealSection>
                </div>
            </section>

            <section style={{ padding: '80px 0 40px' }}>
                <div className="container">
                    {loadError && (
                        <div style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.28)', color: 'var(--ink)', borderRadius: '20px', padding: '16px 20px', marginBottom: '28px', fontWeight: 700, lineHeight: 1.5 }}>
                            Bảng giá đang hiển thị dữ liệu tham khảo vì hệ thống chưa tải được dữ liệu mới nhất. Vui lòng gọi hotline để xác nhận chi phí trước khi đặt lịch.
                        </div>
                    )}
                    {loading ? (
                        <>
                            <style>{`
                                @keyframes skeleton-shimmer {
                                    0% { background-position: -1000px 0; }
                                    100% { background-position: 1000px 0; }
                                }
                                .skeleton-box {
                                    background: linear-gradient(90deg, rgba(128,128,128,0.08) 25%, rgba(128,128,128,0.18) 50%, rgba(128,128,128,0.08) 75%);
                                    background-size: 1000px 100%;
                                    animation: skeleton-shimmer 2s infinite linear;
                                }
                            `}</style>
                            <div style={priceGridStyle}>
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="glass-card" style={{ background: 'var(--surface)', borderRadius: '32px', padding: '40px', border: '1px solid var(--gray-200)', height: '100%' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', paddingBottom: '24px', borderBottom: '2px dashed var(--gray-200)' }}>
                                            <div className="skeleton-box" style={{ width: '56px', height: '56px', borderRadius: '16px' }}></div>
                                            <div className="skeleton-box" style={{ width: '180px', height: '24px', borderRadius: '12px' }}></div>
                                        </div>
                                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                            {[1, 2, 3, 4].map((item, index) => {
                                                const widths = ['60%', '45%', '70%', '55%'];
                                                return (
                                                    <li key={item} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <div className="skeleton-box" style={{ width: widths[index], height: '20px', borderRadius: '8px' }}></div>
                                                        <div className="skeleton-box" style={{ width: '25%', height: '20px', borderRadius: '8px' }}></div>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : categorizedServices.length === 0 && otherServices.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '56px 24px', background: 'var(--surface)', border: '1px solid var(--gray-200)', borderRadius: '24px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '44px', color: 'var(--gray-300)', marginBottom: '14px' }}>medical_services</span>
                            <p style={{ margin: 0, color: 'var(--gray-500)', fontWeight: 700 }}>Bảng giá đang được cập nhật. Vui lòng liên hệ hotline để được tư vấn chi phí.</p>
                        </div>
                    ) : (
                        <div style={priceGridStyle}>
                            {categorizedServices.map((cat, idx) => (
                                <RevealSection key={idx}>
                                    <div className="glass-card" style={{ background: 'var(--surface)', borderRadius: '32px', padding: '40px', border: '1px solid var(--gray-200)', height: '100%' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', paddingBottom: '24px', borderBottom: '2px dashed var(--gray-200)' }}>
                                            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: `${cat.color}15`, color: cat.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>{cat.icon}</span>
                                            </div>
                                            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--ink)', margin: 0, letterSpacing: '-0.5px' }}>{cat.title}</h2>
                                        </div>
                                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                            {cat.items.map((item) => (
                                                <li key={item.id_dich_vu} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', color: 'var(--ink)' }}>
                                                    <span style={{ fontSize: '1.05rem', color: 'var(--gray-500)', fontWeight: 600, minWidth: 0 }}>{item.ten_dich_vu}</span>
                                                    <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f9d8a', whiteSpace: 'nowrap' }}>{item.gia > 0 ? formatTienVND(item.gia) : "Liên hệ"}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </RevealSection>
                            ))}

                            {otherServices.length > 0 && (
                                <RevealSection>
                                    <div className="glass-card" style={{ background: 'var(--surface)', borderRadius: '32px', padding: '40px', border: '1px solid var(--gray-200)', height: '100%' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', paddingBottom: '24px', borderBottom: '2px dashed var(--gray-200)' }}>
                                            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: `#64748b15`, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>more_horiz</span>
                                            </div>
                                            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--ink)', margin: 0 }}>Dịch Vụ Khác</h2>
                                        </div>
                                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                            {otherServices.map((item) => (
                                                <li key={item.id_dich_vu} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', color: 'var(--ink)' }}>
                                                    <span style={{ fontSize: '1.05rem', color: 'var(--gray-500)', fontWeight: 600, minWidth: 0 }}>{item.ten_dich_vu}</span>
                                                    <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f9d8a', whiteSpace: 'nowrap' }}>{item.gia > 0 ? formatTienVND(item.gia) : "Liên hệ"}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </RevealSection>
                            )}
                        </div>
                    )}
                </div>
            </section>

            <section style={{ padding: '40px 0 80px' }}>
                <div className="container">
                    <RevealSection>
                        <div style={{ background: 'rgba(59, 130, 246, 0.1)', borderRadius: '24px', padding: '32px 40px', border: '1px solid rgba(59, 130, 246, 0.2)', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                            <span className="material-symbols-outlined" style={{ color: '#3b82f6', fontSize: '32px' }}>info</span>
                            <div>
                                <h4 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--ink)', marginBottom: '12px' }}>Lưu ý về chi phí</h4>
                                <p style={{ fontSize: '0.95rem', color: 'var(--gray-500)', lineHeight: 1.7, margin: 0, fontWeight: 500 }}>
                                    Chi phí trên là giá niêm yết cơ bản. Chi phí thực tế có thể thay đổi dựa trên tình trạng cụ thể của thú cưng. Bác sĩ sẽ luôn tư vấn báo giá trước khi thực hiện.
                                </p>
                            </div>
                        </div>
                    </RevealSection>
                </div>
            </section>

            <section style={{
                padding: '80px 0',
                background: isDark
                    ? 'linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(8, 47, 73, 0.92) 100%)'
                    : 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)',
                color: 'white',
                textAlign: 'center',
                borderTop: isDark ? '1px solid rgba(34, 211, 238, 0.16)' : 'none',
                borderBottom: isDark ? '1px solid rgba(34, 211, 238, 0.16)' : 'none',
                boxShadow: isDark ? 'inset 0 1px 0 rgba(255,255,255,0.04), 0 -24px 80px rgba(34, 211, 238, 0.08)' : 'none'
            }}>
                <div className="container">
                    <RevealSection>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 950, marginBottom: '24px' }}>Cần Báo Giá Chi Tiết Hơn?</h2>
                        <a href="#" onClick={handleBookingClick} style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: isDark ? 'var(--primary-gradient)' : 'white',
                            color: isDark ? '#ffffff' : '#0d9488',
                            padding: '16px 32px',
                            borderRadius: '50px',
                            textDecoration: 'none',
                            fontWeight: 900,
                            fontSize: '1rem',
                            boxShadow: isDark ? '0 14px 34px rgba(34, 211, 238, 0.22)' : '0 10px 20px rgba(0,0,0,0.1)',
                            border: isDark ? '1px solid rgba(255,255,255,0.12)' : 'none',
                            transition: 'transform 0.2s'
                        }}>
                            <span className="material-symbols-outlined">calendar_today</span> Đặt Lịch Tư Vấn
                        </a>
                    </RevealSection>
                </div>
            </section>

            <ScrollToTop />
            <MemeCat />
        </div>
    );
};

export default React.memo(BangGiaDichVu);
