import React from "react";
import { RevealSection } from "@components/SpecialEffects";

const partners = [
    { name: "Rexi Veterinary", tagline: "Phòng khám tiêu chuẩn 5 sao", logo: "/img/doi-tac-rexi.png", color: "#0f9d8a" },
    { name: "PetCare Express", tagline: "Giao hàng thuốc thú y nhanh", logo: "/img/doi-tac-petcare.png", color: "#14b8a6" },
    { name: "GreenVet Supply", tagline: "Chuỗi dụng cụ thú y chuyên nghiệp", logo: "/img/doi-tac-greenvet.png", color: "#22c55e" },
    { name: "CarePlus Pharmacy", tagline: "Thuốc và chăm sóc tại nhà", logo: "/img/doi-tac-careplus.png", color: "#0ea5e9" }
];

const PhanDoiTac: React.FC = () => {
    return (
        <section style={{
            backgroundColor: 'var(--background)',
            padding: '100px 0',
            overflow: 'hidden',
            position: 'relative'
        }}>
            {/* Background Pattern */}
            <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: "url('/img/hinh-nen-chan-thu.png')",
                backgroundSize: '400px',
                opacity: 0.03,
                pointerEvents: 'none'
            }} />

            <div className="container" style={{ position: 'relative', zIndex: 1 }}>
                <RevealSection>
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <div className="section-label" style={{
                            margin: '0 auto 16px',
                            background: 'var(--surface)',
                            border: '1px solid var(--gray-200)',
                            color: 'var(--primary)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 18px',
                            borderRadius: '999px',
                            fontWeight: 700,
                            letterSpacing: '0.03em'
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#059669' }}>handshake</span>
                            ĐỐI TÁC TIN CẬY
                        </div>
                        <h2 style={{
                            fontSize: 'clamp(2rem, 3vw, 3rem)',
                            fontWeight: 900,
                            color: 'var(--ink)',
                            margin: 0,
                            lineHeight: 1.05
                        }}>
                            Đồng hành cùng <span style={{ color: 'var(--primary)' }}>thương hiệu thú y uy tín</span>
                        </h2>
                        <p style={{
                            maxWidth: '720px',
                            margin: '18px auto 0',
                            color: 'var(--gray-500)',
                            lineHeight: 1.8,
                            fontSize: '1rem'
                        }}>
                            Giúp phòng khám, nhà thuốc và dịch vụ chăm sóc thú cưng đồng bộ hóa quản lý, tăng trải nghiệm khách hàng và vận hành hiệu quả hơn.
                        </p>
                    </div>
                </RevealSection>

                <div className="responsive-grid-split" style={{
                    gridTemplateColumns: '1.1fr 0.9fr',
                    alignItems: 'center',
                    marginTop: '56px'
                }}>
                    <div>
                        <div className="responsive-grid-split" style={{
                            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))'
                        }}>
                            <div className="stat-card-light">
                                <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#059669' }}>120+</div>
                                <div style={{ marginTop: '10px', color: 'var(--ink)', fontWeight: 700 }}>Đối tác tin cậy</div>
                                <p style={{ marginTop: '12px', color: 'var(--gray-500)', lineHeight: 1.7, fontSize: '0.9rem' }}>
                                    Phòng khám, nhà thuốc và đối tác dịch vụ trên toàn quốc.
                                </p>
                            </div>
                            <div className="stat-card-light">
                                <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#059669' }}>95%</div>
                                <div style={{ marginTop: '10px', color: 'var(--ink)', fontWeight: 700 }}>Hài lòng đối tác</div>
                                <p style={{ marginTop: '12px', color: 'var(--gray-500)', lineHeight: 1.7, fontSize: '0.9rem' }}>
                                    Hệ thống ổn định, hỗ trợ nhanh và báo cáo rõ ràng.
                                </p>
                            </div>
                            <div className="stat-card-light" style={{ gridColumn: 'span 2' }}>
                                <div style={{ fontSize: '2.4rem', fontWeight: 900, color: '#059669' }}>24/7</div>
                                <div style={{ marginTop: '10px', color: 'var(--ink)', fontWeight: 700 }}>Hỗ trợ đối tác</div>
                                <p style={{ marginTop: '12px', color: 'var(--gray-500)', lineHeight: 1.7, fontSize: '0.9rem' }}>
                                    Đội ngũ tư vấn và kỹ thuật luôn sẵn sàng ngay cả cuối tuần.
                                </p>
                            </div>
                        </div>
                    </div>

                <svg aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0, pointerEvents: 'none' }}>
                    <defs>
                        <filter id="smart-knockout" colorInterpolationFilters="sRGB">
                            {/* 1. Tính độ sáng (Luminance) của ảnh gốc */}
                            <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.299 0.587 0.114 0 0" result="luma" />
                            {/* 2. Ép pixel nền trắng thành trong suốt (alpha=0), giữ nguyên pixel màu */}
                            <feComponentTransfer in="luma" result="alphaMask">
                                <feFuncA type="linear" slope="-10" intercept="9.5" />
                            </feComponentTransfer>
                            {/* 3. Phủ mặt nạ trong suốt lên ảnh gốc */}
                            <feComposite in="SourceGraphic" in2="alphaMask" operator="in" />
                        </filter>
                    </defs>
                </svg>

                    <div className="responsive-grid-2">
                        {partners.map((partner) => (
                            <div key={partner.name} className="partner-card-new" style={{ '--partner-accent': partner.color } as React.CSSProperties}>
                                <div className="partner-logo-box">
                                    <img src={partner.logo} alt={partner.name} className="partner-logo-img" loading="lazy" />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 800, color: 'var(--ink)', marginBottom: '4px', fontSize: '1rem' }}>{partner.name}</div>
                                    <div style={{ color: 'var(--gray-400)', fontSize: '0.8rem', lineHeight: 1.5, fontWeight: 500 }}>
                                        {partner.tagline}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
                .stat-card-light {
                    background: var(--surface);
                    border-radius: 28px;
                    padding: 32px;
                    border: 1px solid var(--gray-200);
                    box-shadow: var(--shadow-md);
                    transition: all 0.4s ease;
                    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease, border-color 0.4s ease;
                    position: relative;
                    overflow: hidden;
                }
                .stat-card-light:hover { transform: translateY(-5px); box-shadow: var(--shadow-xl); border-color: var(--primary); }
                .stat-card-light:hover {
                    transform: translateY(-6px) scale(1.02);
                    box-shadow: 0 20px 40px -10px color-mix(in srgb, var(--primary) 20%, transparent);
                    border-color: var(--primary);
                }
                [data-theme='dark'] .stat-card-light {
                    background: color-mix(in srgb, var(--surface) 60%, transparent);
                    border-color: color-mix(in srgb, var(--gray-200) 20%, transparent);
                    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
                }
                [data-theme='dark'] .stat-card-light:hover {
                    border-color: var(--primary);
                    box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5), 0 0 20px color-mix(in srgb, var(--primary) 30%, transparent);
                }
                
                .partner-card-new {
                    background: color-mix(in srgb, var(--surface) 88%, transparent);
                    border-radius: 28px;
                    padding: 24px;
                    border: 1px solid color-mix(in srgb, var(--gray-200) 75%, transparent);
                    box-shadow: var(--shadow-sm);
                    transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease, border-color 0.4s ease;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .partner-card-new:hover {
                    transform: translateY(-6px) scale(1.02);
                    box-shadow: 0 20px 40px -10px color-mix(in srgb, var(--partner-accent) 20%, transparent);
                    border-color: color-mix(in srgb, var(--partner-accent) 45%, var(--gray-200));
                }

                [data-theme='dark'] .partner-card-new {
                    background: color-mix(in srgb, var(--surface) 72%, transparent);
                    border-color: color-mix(in srgb, var(--primary) 18%, var(--gray-200));
                    box-shadow: 0 10px 36px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.05);
                }
                [data-theme='dark'] .partner-card-new:hover {
                    border-color: color-mix(in srgb, var(--partner-accent) 60%, transparent);
                    box-shadow:
                        0 15px 45px rgba(0, 0, 0, 0.5),
                        0 0 30px color-mix(in srgb, var(--partner-accent) 25%, transparent);
                }

                .partner-logo-box {
                    --partner-accent: var(--primary);
                    width: 100%;
                    min-height: 128px;
                    height: 128px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                    border-radius: 18px;
                    padding: 10px 14px;
                    transition: border-color 0.35s ease, background 0.35s ease;
                    border: 1px solid color-mix(in srgb, var(--gray-200) 55%, transparent);
                    /* Nền xám nhạt: multiply xóa trắng PNG mà logo vẫn đậm */
                    background: color-mix(in srgb, var(--gray-100) 85%, var(--surface));
                }
                [data-theme='dark'] .partner-logo-box {
                    background: color-mix(in srgb, var(--background) 92%, var(--partner-accent) 8%);
                    border-color: color-mix(in srgb, var(--gray-200) 28%, transparent);
                }
                .partner-card-new:hover .partner-logo-box {
                    border-color: color-mix(in srgb, var(--partner-accent) 35%, var(--gray-200));
                }

                /* Light: logo gốc rõ — không dùng knockout */
                .partner-logo-img {
                    display: block;
                    width: auto;
                    max-width: min(100%, 200px);
                    height: auto;
                    max-height: 96px;
                    min-height: 56px;
                    object-fit: contain;
                    transition: transform 0.35s ease, filter 0.35s ease, opacity 0.35s ease;
                    mix-blend-mode: multiply;
                    filter: contrast(1.12) saturate(1.15);
                    opacity: 1;
                }

                @keyframes partnerLogoPulse {
                    0%, 100% {
                        filter: url(#smart-knockout) brightness(1.2) drop-shadow(0 0 6px color-mix(in srgb, var(--partner-accent) 50%, transparent));
                        opacity: 0.9;
                    }
                    50% {
                        filter: url(#smart-knockout) brightness(1.5) drop-shadow(0 0 22px color-mix(in srgb, var(--partner-accent) 95%, transparent));
                        opacity: 1;
                    }
                }

                /* Dark mode: Xóa phông trắng bằng SVG Filter, ánh sáng chỉ bám sát viền chữ/logo */
                [data-theme='dark'] .partner-logo-img {
                    mix-blend-mode: normal;
                    animation: partnerLogoPulse 3s ease-in-out infinite;
                }
                .partner-card-new:hover .partner-logo-img {
                    transform: scale(1.05);
                    filter: contrast(1.15) saturate(1.2);
                }
                [data-theme='dark'] .partner-card-new:hover .partner-logo-img {
                    animation: none; /* Tắt nhịp thở khi rê chuột vào để ánh sáng giữ mức rực rỡ nhất */
                    filter: url(#smart-knockout) brightness(1.7) drop-shadow(0 0 32px color-mix(in srgb, var(--partner-accent) 100%, transparent));
                    opacity: 1;
                    transform: scale(1.08);
                }

                @media (max-width: 992px) {
                    .stat-card-light { padding: 24px; }
                }
                @media (max-width: 840px) {
                    .container > div:nth-child(2) { grid-template-columns: 1fr !important; }
                }
                @media (max-width: 640px) {
                    .partner-card-new { padding: 20px; }
                }
            `}</style>
        </section>
    );
};

export default React.memo(PhanDoiTac);
