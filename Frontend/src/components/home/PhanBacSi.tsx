import React from "react";
import { Link } from "react-router-dom";
import { RevealSection } from "@components/SpecialEffects";

import { useTheme } from "../../contexts/ThemeContextV2";

const MOCK_DOCTORS = [
    { ho_ten: "BS. Minh Anh", chuyen_mon: "Nội khoa & Bệnh truyền nhiễm", hinh_anh: "/img/bac_si_minh_anh.png", exp: "8 năm kinh nghiệm", mo_ta: "Chuyên gia hàng đầu về nội khoa và bệnh truyền nhiễm ở thú cưng. Tốt nghiệp Học viện Nông nghiệp Việt Nam, tu nghiệp tại Nhật Bản." },
    { ho_ten: "BS. Khánh Linh", chuyen_mon: "Phẫu thuật tổng quát", hinh_anh: "/img/bac_si_khanh_linh.png", exp: "6 năm kinh nghiệm" },
    { ho_ten: "BS. Hoàng Nam", chuyen_mon: "Chẩn đoán hình ảnh", hinh_anh: "/img/bac_si_hoang_nam.png", exp: "5 năm kinh nghiệm" },
    { ho_ten: "BS. Thu Thủy", chuyen_mon: "Dinh dưỡng & Nội tiết", hinh_anh: "/img/bac_si_thu_thuy.png", exp: "4 năm kinh nghiệm" }
];

const PhanBacSi: React.FC = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <RevealSection>
            <section id="doctors" style={{ padding: "110px 0", background: "var(--background)", position: 'relative', overflow: 'hidden' }}>
                <style>{`
                    .doc-card-small { 
                        transition: all 0.4s ease; 
                        border: 1px solid var(--gray-200); 
                        background: var(--surface) !important;
                        backdrop-filter: blur(8px);
                    }
                    .doc-card-small:hover { 
                        transform: translateY(-8px); 
                        box-shadow: var(--shadow-lg) !important; 
                        border-color: var(--primary) !important; 
                    }
                    [data-theme='dark'] .doc-card-small {
                        border-color: rgba(255, 255, 255, 0.1);
                        box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
                    }
                    .doc-card-small .doctor-img { transition: transform 0.6s ease; }
                    .doc-card-small:hover .doctor-img { transform: scale(1.05); }
                    .doc-featured {
                        transition: all 0.4s ease;
                        backdrop-filter: blur(12px);
                    }
                    [data-theme='dark'] .doc-featured {
                        border-color: rgba(255, 255, 255, 0.1) !important;
                    }
                    .doc-featured-img { transition: transform 0.6s ease; }
                    .doc-featured:hover .doc-featured-img { transform: scale(1.03); }
                    @keyframes doctorCtaPulse {
                        0%, 100% { transform: translateY(0) scale(1); box-shadow: 0 10px 26px rgba(245, 158, 11, 0.18); }
                        50% { transform: translateY(-2px) scale(1.03); box-shadow: 0 14px 34px rgba(245, 158, 11, 0.32); }
                    }
                    @keyframes doctorCtaGlow {
                        0% { opacity: 0; transform: translateX(-130%) skewX(-18deg); }
                        18%, 76% { opacity: 0.40; }
                        100% { opacity: 0; transform: translateX(170%) skewX(-18deg); }
                    }
                    .doctor-all-card {
                        position: relative;
                        overflow: hidden;
                        transition: transform 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease, background 0.35s ease;
                    }
                    .doctor-all-card::before {
                        content: "";
                        position: absolute;
                        inset: -40%;
                        background: radial-gradient(circle at 30% 20%, rgba(251, 191, 36, 0.24), transparent 38%);
                        opacity: 0;
                        transition: opacity 0.35s ease;
                        pointer-events: none;
                    }
                    .doctor-all-card:hover {
                        transform: translateY(-8px);
                        border-color: rgba(245, 158, 11, 0.72) !important;
                        box-shadow: 0 22px 48px rgba(245, 158, 11, 0.22);
                    }
                    .doctor-all-card:hover::before { opacity: 1; }
                    .doctor-all-icon {
                        position: relative;
                        transition: transform 0.35s ease, box-shadow 0.35s ease;
                        animation: doctorCtaPulse 2.4s ease-in-out infinite;
                    }
                    .doctor-all-card:hover .doctor-all-icon {
                        transform: translateY(-4px) rotate(-4deg) scale(1.08);
                    }
                    .doctor-all-link {
                        position: relative;
                        overflow: hidden;
                        transition: transform 0.28s ease, box-shadow 0.28s ease, filter 0.28s ease;
                    }
                    .doctor-all-link::before {
                        content: "";
                        position: absolute;
                        top: -40%;
                        bottom: -40%;
                        left: 0;
                        width: 42%;
                        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.40), transparent);
                        transform: translateX(-130%) skewX(-18deg);
                        animation: doctorCtaGlow 5.2s linear infinite;
                    }
                    .doctor-all-link span {
                        transition: transform 0.25s ease;
                    }
                    .doctor-all-link:hover {
                        transform: translateY(-2px);
                        filter: brightness(1.05);
                        box-shadow: 0 12px 28px rgba(245, 158, 11, 0.42) !important;
                    }
                    .doctor-all-link:hover span {
                        transform: translateX(4px);
                    }
                    [data-theme='dark'] .doctor-all-card {
                        background: linear-gradient(135deg, rgba(245, 158, 11, 0.13), rgba(234, 88, 12, 0.08)) !important;
                        border-color: rgba(251, 191, 36, 0.32) !important;
                    }
                    [data-theme='dark'] .doctor-all-card:hover {
                        box-shadow: 0 0 0 1px rgba(251, 191, 36, 0.25), 0 24px 55px rgba(245, 158, 11, 0.18);
                    }
                    @media (max-width: 1024px) {
                        .doctors-layout { flex-direction: column !important; }
                        .doc-featured { width: 100% !important; max-width: 100% !important; }
                        .doc-grid { grid-template-columns: repeat(3, 1fr) !important; }
                    }
                    @media (max-width: 700px) {
                        .doc-grid { grid-template-columns: 1fr !important; }
                    }
                `}</style>

                {/* tiêu đề bác sĩ */}
                <div className="container">
                    <div style={{ marginBottom: '56px' }}>
                        <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 950, color: "var(--ink)", letterSpacing: '-1px' }}>Chuyên Gia <span style={{ color: "var(--primary)" }}>Tận Tâm</span></h2>
                    </div>

                    {/* bố cục bác sĩ */}
                    <div className="doctors-layout" style={{ display: 'flex', gap: '28px', alignItems: 'stretch' }}>

                        {/* cột bác sĩ nổi bật */}
                        <div className="doc-featured" style={{ flex: '0 0 auto', width: '38%', borderRadius: '32px', overflow: 'hidden', background: 'var(--surface)', border: '1px solid var(--gray-300)', boxShadow: 'var(--shadow-xl)', display: 'flex', flexDirection: 'column', cursor: 'default' }}>
                            <div style={{ height: '400px', position: 'relative', overflow: 'hidden', background: isDark ? 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' : 'linear-gradient(180deg, #f0fdfa 0%, #ccfbf1 100%)' }}>

                                <img src={MOCK_DOCTORS[0].hinh_anh} alt={MOCK_DOCTORS[0].ho_ten} className="doc-featured-img" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
                                {/* nhãn bác sĩ */}
                                <div style={{ position: 'absolute', top: '20px', left: '20px', background: 'var(--surface)', padding: '8px 16px', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 900, color: 'var(--primary)', border: '1px solid var(--gray-200)', display: 'flex', alignItems: 'center', gap: '6px', backdropFilter: 'blur(8px)' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>verified</span>
                                    BÁC SĨ CHUYÊN KHOA
                                </div>
                                {/* hiệu ứng mờ nền */}
                                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '120px', background: isDark ? 'linear-gradient(to top, var(--surface) 0%, transparent 100%)' : 'linear-gradient(to top, rgba(255,255,255,1) 0%, transparent 100%)' }} />
                            </div>

                            <div style={{ padding: '28px 32px 32px' }}>
                                <h3 style={{ fontSize: '1.6rem', fontWeight: 950, color: 'var(--ink)', marginBottom: '6px' }}>{MOCK_DOCTORS[0].ho_ten}</h3>
                                <p style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.9rem', marginBottom: '16px' }}>{MOCK_DOCTORS[0].chuyen_mon}</p>
                                <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem', lineHeight: 1.7, fontWeight: 500, marginBottom: '20px' }}>{MOCK_DOCTORS[0].mo_ta}</p>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--gray-400)', fontSize: '0.8rem', fontWeight: 700, paddingTop: '16px', borderTop: '1px dashed var(--gray-200)' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>history</span>
                                    {MOCK_DOCTORS[0].exp}
                                </div>
                            </div>
                        </div>

                        {/* cột danh sách bác sĩ */}
                        <div className="doc-grid" style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '20px', alignContent: 'start' }}>
                            {MOCK_DOCTORS.slice(1).map((d, i) => (
                                <div key={i} className="doc-card-small glass-card" style={{ borderRadius: '24px', overflow: 'hidden', background: 'var(--surface)', display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ height: '200px', position: 'relative', overflow: 'hidden', background: isDark ? 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' : 'linear-gradient(180deg, #f0fdfa 0%, #ccfbf1 100%)' }}>
                                        <img src={d.hinh_anh} alt={d.ho_ten} className="doctor-img" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center' }} />
                                        <div style={{ position: 'absolute', inset: 0, background: isDark ? 'linear-gradient(to top, var(--surface) 0%, transparent 50%)' : 'linear-gradient(to top, rgba(255,255,255,0.8) 0%, transparent 50%)' }} />
                                    </div>
                                    <div style={{ padding: '16px 18px' }}>
                                        <h4 style={{ fontSize: '1rem', fontWeight: 950, marginBottom: '4px', color: 'var(--ink)' }}>{d.ho_ten}</h4>
                                        <p style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.78rem', marginBottom: '10px' }}>{d.chuyen_mon}</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--gray-400)', fontSize: '0.75rem', fontWeight: 700, paddingTop: '10px', borderTop: '1px dashed var(--gray-200)' }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>history</span>
                                            {d.exp}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* thẻ xem tất cả */}
                            <div className="doctor-all-card" style={{ borderRadius: '24px', background: isDark ? 'rgba(217, 119, 6, 0.1)' : 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', gap: '16px', border: isDark ? '1px solid rgba(251, 191, 36, 0.2)' : '1px solid #fde68a' }}>
                                <div className="doctor-all-icon" style={{ width: '56px', height: '56px', background: 'var(--background)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-sm)' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '28px', color: '#f59e0b' }}>groups</span>
                                </div>
                                <div style={{ position: 'relative', zIndex: 1 }}>
                                    <div style={{ fontWeight: 900, color: '#92400e', fontSize: '1rem', marginBottom: '6px' }}>Xem tất cả bác sĩ</div>
                                    <div style={{ color: '#b45309', fontSize: '0.8rem', fontWeight: 600 }}>Đội ngũ 10+ chuyên gia</div>
                                </div>
                                <Link to="/bac-si" className="doctor-all-link" style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)', color: 'white', padding: '10px 22px', borderRadius: '50px', fontWeight: 800, textDecoration: 'none', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 8px 20px rgba(245,158,11,0.25)', zIndex: 1 }}>
                                    <span style={{ position: 'relative', zIndex: 1 }}>Xem hồ sơ</span> <span className="material-symbols-outlined" style={{ fontSize: '16px', position: 'relative', zIndex: 1 }}>arrow_forward</span>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </RevealSection>
    );
};

export default React.memo(PhanBacSi);
