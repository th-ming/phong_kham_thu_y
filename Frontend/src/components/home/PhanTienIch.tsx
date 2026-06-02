import React from "react";

const PhanTienIch: React.FC = () => {
    const features = [
        { icon: "emergency_home", title: "Cấp cứu 24/7", desc: "Luôn sẵn sàng" },
        { icon: "lab_research", title: "Xét nghiệm tại chỗ", desc: "Kết quả trong 30 phút" },
        { icon: "vaccines", title: "Vaccine chính hãng", desc: "Nhập khẩu Châu Âu" },
        { icon: "payments", title: "Thanh toán linh hoạt", desc: "Tiền mặt, Thẻ, QR" },
        { icon: "headset_mic", title: "Tư vấn miễn phí", desc: "Qua điện thoại & Zalo" }
    ];

    return (
        <>
            <section className="premium-fluid-gradient" style={{
                padding: "10px 0",
                color: "white",
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Hover styles cho feature-item */}
                <style>{`
                .feature-item { 
                    transition: transform 0.3s ease; 
                    cursor: default; 
                    color: white !important; 
                    background: rgba(255,255,255,0.12) !important; 
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.2) !important; 
                    border-radius: 16px !important; 
                    padding: 10px 14px !important; 
                }
                .feature-item:hover { transform: translateY(-3px); background: rgba(255,255,255,0.2) !important; box-shadow: 0 10px 25px rgba(0,0,0,0.1) !important; }
                .feature-item:hover .feature-icon-box { background: rgba(255, 255, 255, 0.35) !important; border-color: rgba(255, 255, 255, 0.5) !important; transform: scale(1.05) rotate(-2deg) !important; }
                .feature-item h4, .feature-item p, .feature-item span { color: white !important; }
                .feature-item p { opacity: 0.8 !important; margin-top: 2px !important; }
                .feature-icon-box { background: rgba(255, 255, 255, 0.15) !important; border: 1px solid rgba(255, 255, 255, 0.25) !important; }
                .feature-icon-box span { color: white !important; }
                @media screen and (max-width: 1024px) {
                    .feature-divider { display: none !important; }
                }
            `}</style>
                {/* Shimmer overlay */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)', pointerEvents: 'none' }} />
                <div className="container">
                    <div className="feature-grid">
                        {features.map((f, idx) => (
                            <div key={idx} className="feature-item" style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                position: 'relative'
                            }}>
                                {idx < features.length - 1 && (
                                    <div className="feature-divider" style={{ position: 'absolute', right: '-10px', top: '50%', transform: 'translateY(-50%)', width: '1px', height: '24px', background: 'rgba(255,255,255,0.15)' }} />
                                )}
                                <div className="feature-icon-box" style={{
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "10px",
                                    border: "1px solid rgba(255,255,255,0.2)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background: "rgba(255,255,255,0.1)",
                                    backdropFilter: 'blur(6px)',
                                    transition: "all 0.3s ease",
                                    flexShrink: 0
                                }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>{f.icon}</span>
                                </div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: "0.82rem", fontWeight: 850, letterSpacing: '-0.2px' }}>{f.title}</h4>
                                    <p style={{ margin: 0, fontSize: "0.68rem", opacity: 0.75, fontWeight: 500, marginTop: '1px' }}>{f.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
};

export default PhanTienIch;
