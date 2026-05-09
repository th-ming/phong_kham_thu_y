import React from "react";
import { RevealSection } from "@components/SpecialEffects";
import { useTheme } from "../../contexts/ThemeContext";

/**
 * Contact Section
 */
const PhanLienHe: React.FC = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        card.style.setProperty('--x', `${x}px`);
        card.style.setProperty('--y', `${y}px`);
    };

    const contactDetails = [
        {
            icon: 'location_on',
            label: 'Địa chỉ phòng khám',
            value: 'Số 68, Ngõ 10, Đường Ngô Xuân Quảng, Trâu Quỳ, Gia Lâm, Hà Nội',
            color: '#0f9d8a',
            bg: '#f0fdfa'
        },
        {
            icon: 'call',
            label: 'Hotline & Cấp cứu',
            value: '024 1234 5678',
            subValue: 'Cấp cứu 24/7: 0909 123 456',
            color: '#f43f5e',
            bg: '#fff1f2'
        },
        {
            icon: 'mail',
            label: 'Hỗ trợ trực tuyến',
            value: 'contact@rexi.vn',
            color: '#3b82f6',
            bg: '#eff6ff'
        },
        {
            icon: 'schedule',
            label: 'Thời gian làm việc',
            value: 'Thứ 2 - CN: 08:00 - 20:00',
            subValue: 'Phục vụ không nghỉ lễ',
            color: '#8b5cf6',
            bg: '#f5f3ff'
        }
    ];

    return (
        <RevealSection>
            <section id="contact" style={{ padding: "110px 0", background: "var(--background)", position: 'relative', overflow: 'hidden' }}>
                {/* Background Pattern */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: "url('/img/hinh-nen-chan-thu.png')",
                    backgroundSize: '400px',
                    opacity: 0.03,
                    pointerEvents: 'none'
                }} />
                <style>{`
                    .contact-card-main { transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.5s ease; position: relative; overflow: hidden; z-index: 1; }
                    .contact-card-main:hover { transform: translateY(-5px); box-shadow: 0 50px 100px rgba(15,157,138,0.08) !important; }
                    .contact-card-main::before {
                        content: ''; position: absolute; top: var(--y, -200px); left: var(--x, -200px);
                        width: 600px; height: 600px; background: radial-gradient(circle, rgba(45, 212, 191, 0.15) 0%, transparent 60%);
                        transform: translate(-50%, -50%); pointer-events: none; transition: opacity 0.3s ease; opacity: 0; z-index: -1;
                    }
                    .contact-card-main:hover::before { opacity: 1; }
                    .contact-info-row { transition: all 0.3s ease; padding: 16px; border-radius: 24px; border: 1px solid transparent; margin-left: -16px; cursor: default; }
                    .contact-info-row:hover { background: var(--surface); border-color: var(--gray-200); box-shadow: 0 15px 30px rgba(0,0,0,0.04); transform: translateX(10px); }
                    .contact-info-row .icon-box { transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
                    .contact-info-row:hover .icon-box { transform: scale(1.15) rotate(-8deg); }
                    .btn-direction:hover { background: linear-gradient(135deg, #f59e0b, #ea580c) !important; transform: translateY(-3px); box-shadow: 0 12px 25px rgba(245, 158, 11, 0.35) !important; }
                    @media (max-width: 991px) {
                        .contact-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
                        .contact-info-col { border-right: none !important; padding-right: 0 !important; border-bottom: 1px dashed #e2e8f0; padding-bottom: 40px; }
                    }
                `}</style>
                <div className="container">
                    {/* Header Section */}
                    <div style={{ marginBottom: "60px", textAlign: 'center' }}>
                        <div className="section-label" style={{ margin: '0 auto 20px' }}>📍 Liên hệ</div>
                        <h2 style={{ fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 950, color: "var(--ink)", margin: 0, letterSpacing: '-1.5px' }}>Kết Nối Với <span style={{ color: "#0f9d8a" }}>Rexi</span></h2>
                        <p style={{ color: "var(--gray-500)", marginTop: '16px', fontWeight: 500, fontSize: '1.05rem', maxWidth: '600px', margin: '16px auto 0' }}>Chúng tôi luôn sẵn sàng lắng nghe và đồng hành cùng hành trình sức khỏe của thú cưng của bạn.</p>
                    </div>

                    <div className="contact-card-main" onMouseMove={handleMouseMove} style={{
                        background: "var(--surface)",
                        padding: "clamp(30px, 5vw, 60px)",
                        borderRadius: "48px",
                        boxShadow: "0 40px 100px rgba(0,0,0,0.05)",
                        border: "1px solid rgba(15,157,138,0.08)"
                    }}>
                        <div className="contact-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "60px" }}>

                            {/* LEFT: Contact Information */}
                            <div className="contact-info-col" style={{ borderRight: "1px dashed #e2e8f0", paddingRight: "30px" }}>
                                <h3 style={{ fontSize: "1.8rem", fontWeight: 950, color: "var(--ink)", marginBottom: "12px", letterSpacing: '-0.5px' }}>Thông Tin</h3>
                                <p style={{ color: "var(--gray-500)", fontSize: "0.95rem", marginBottom: "45px", fontWeight: 500 }}>Phòng khám Rexi mở cửa tất cả các ngày trong tuần, kể cả ngày lễ.</p>

                                <div style={{ display: "grid", gap: "28px" }}>
                                    {contactDetails.map((detail, idx) => (
                                        <div key={idx} className="contact-info-row" style={{ display: "flex", gap: "20px", alignItems: 'center' }}>
                                            <div className="icon-box" style={{ width: "60px", height: "60px", background: detail.bg, borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center", color: detail.color, flexShrink: 0, boxShadow: `0 8px 16px ${detail.color}15` }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: "30px" }}>{detail.icon}</span>
                                            </div>
                                            <div>
                                                <p style={{ margin: "0 0 4px 0", fontSize: "0.7rem", color: "var(--gray-400)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "1px" }}>{detail.label}</p>
                                                <p style={{ margin: 0, color: "var(--ink)", fontSize: "1.05rem", fontWeight: 800, lineHeight: 1.4 }}>{detail.value}</p>
                                                {detail.subValue && <p style={{ margin: "4px 0 0 0", color: detail.color, fontSize: "0.85rem", fontWeight: 700 }}>{detail.subValue}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* RIGHT: Interactive Map Area */}
                            <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
                                <div style={{
                                    height: "100%",
                                    minHeight: "450px",
                                    borderRadius: "32px",
                                    overflow: "hidden",
                                    border: "1px solid rgba(0,0,0,0.04)",
                                    position: "relative",
                                    boxShadow: '0 20px 40px rgba(0,0,0,0.03)'
                                }}>
                                    <iframe
                                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.8471526438833!2d105.92823617596856!3d21.00243438879685!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135a90022370c67%3A0xe2128b9d453303d3!2zUGjDsm5nIEtow6FtIFRoxdynamicWIFkgUmV4aQ!5e0!3m2!1svi!2s!4v1714421111111!5m2!1svi!2s"
                                        width="100%"
                                        height="100%"
                                        style={{ border: 0, filter: isDark ? 'invert(90%) hue-rotate(180deg) brightness(95%) contrast(85%)' : 'none', transition: 'filter 0.3s ease' }}
                                        allowFullScreen={true}
                                        loading="lazy"
                                        title="Bản đồ Rexi"
                                    ></iframe>
                                </div>

                                {/* Location Info Bar */}
                                <div style={{
                                    background: "var(--surface)",
                                    padding: "24px 30px",
                                    borderRadius: "28px",
                                    display: "flex",
                                    justifyContent: "space-between",
                                    alignItems: "center",
                                    border: "1px solid var(--gray-200)",
                                    boxShadow: "0 10px 30px rgba(0,0,0,0.02)"
                                }}>
                                    <div className="mobile-hide">
                                        <p style={{ margin: "0 0 4px 0", fontSize: "0.65rem", color: "#0f9d8a", fontWeight: 900, letterSpacing: "1.5px", textTransform: 'uppercase' }}>Cơ sở chính</p>
                                        <p style={{ margin: 0, fontSize: "1rem", color: "var(--ink)", fontWeight: 800 }}>Gia Lâm, Hà Nội</p>
                                    </div>
                                    <a
                                        href="https://www.google.com/maps/search/?api=1&query=Phòng+khám+thú+y+Rexi+Gia+Lâm"
                                        target="_blank"
                                        rel="noreferrer"
                                        style={{
                                            background: "linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)",
                                            color: "white",
                                            textDecoration: "none",
                                            padding: "14px 32px",
                                            borderRadius: "50px",
                                            fontSize: "0.95rem",
                                            fontWeight: 900,
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "12px",
                                            transition: "all 0.3s",
                                            boxShadow: "0 10px 25px rgba(234, 88, 12, 0.25)",
                                            whiteSpace: 'nowrap'
                                        }}
                                        className="btn-direction"
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>directions</span>
                                        Chỉ đường ngay
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </RevealSection>
    );
};

export default PhanLienHe;
