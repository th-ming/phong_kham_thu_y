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

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1.1fr 0.9fr',
                    gap: '40px',
                    alignItems: 'start',
                    marginTop: '56px'
                }}>
                    <div>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                            gap: '24px'
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

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '24px' }}>
                        {partners.map((partner) => (
                            <div key={partner.name} className="partner-card-new">
                                <div className="partner-logo-box">
                                    <img src={partner.logo} alt={partner.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
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
                }
                .stat-card-light:hover { transform: translateY(-5px); box-shadow: var(--shadow-xl); border-color: var(--primary); }
                
                .partner-card-new {
                    background: var(--surface);
                    border-radius: 28px;
                    padding: 24px;
                    border: 1px solid var(--gray-200);
                    box-shadow: var(--shadow-sm);
                    transition: all 0.4s ease;
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .partner-card-new:hover { transform: translateY(-5px); box-shadow: var(--shadow-xl); border-color: var(--primary); }
                
                .partner-logo-box {
                    width: 100%;
                    height: 120px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--background);
                    border-radius: 18px;
                    padding: 4px;
                    transition: all 0.3s ease;
                    border: 1px solid var(--gray-200);
                }
                .partner-card-new:hover .partner-logo-box { background: var(--primary-light); border-color: var(--primary); }

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
