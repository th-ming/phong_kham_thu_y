import React from "react";
import { useTheme } from "../../contexts/ThemeContextV2";

const PhanTienIch: React.FC = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const features = [
        { icon: "emergency_home", title: "Cấp cứu 24/7", desc: "Luôn sẵn sàng" },
        { icon: "lab_research", title: "Xét nghiệm tại chỗ", desc: "Kết quả trong 30 phút" },
        { icon: "vaccines", title: "Vaccine chính hãng", desc: "Nhập khẩu Châu Âu" },
        { icon: "payments", title: "Thanh toán linh hoạt", desc: "Tiền mặt, Thẻ, QR" },
        { icon: "headset_mic", title: "Tư vấn miễn phí", desc: "Qua điện thoại & Zalo" }
    ];

    return (
        <>
            <section style={{
                background: isDark
                    ? "linear-gradient(135deg, #0f172a 0%, #0d8a7a 100%)"
                    : "linear-gradient(135deg, #0d8a7a 0%, #0f9d8a 50%, #1ab8a4 100%)",
                padding: "22px 0",
                color: "white",
                position: 'relative',
                overflow: 'hidden',
                transition: 'background 0.5s ease'
            }}>
                {/* Hover styles cho feature-item */}
                <style>{`
                .feature-item { 
                    transition: transform 0.3s ease; 
                    cursor: default; 
                    color: white !important; 
                    background: rgba(255,255,255,0.15) !important; 
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.25) !important; 
                    border-radius: 24px !important; 
                    padding: 20px 18px !important; 
                }
                .feature-item:hover { transform: translateY(-4px); background: rgba(255,255,255,0.25) !important; box-shadow: 0 15px 35px rgba(0,0,0,0.1) !important; }
                .feature-item:hover .feature-icon-box { background: rgba(255, 255, 255, 0.4) !important; border-color: rgba(255, 255, 255, 0.6) !important; transform: scale(1.05) rotate(-2deg) !important; }
                .feature-item h4, .feature-item p, .feature-item span { color: white !important; }
                .feature-item p { opacity: 0.8 !important; margin-top: 6px !important; }
                .feature-icon-box { background: rgba(255, 255, 255, 0.2) !important; border: 1px solid rgba(255, 255, 255, 0.3) !important; }
                .feature-icon-box span { color: white !important; }
                .feature-item { min-width: 220px !important; }
            `}</style>
                {/* Shimmer overlay */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)', pointerEvents: 'none' }} />
                <div className="container">
                    <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        flexWrap: "wrap",
                        gap: "20px"
                    }}>
                        {features.map((f, idx) => (
                            <div key={idx} className="feature-item" style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "14px",
                                flex: "1 1 180px",
                                position: 'relative'
                            }}>
                                {idx < features.length - 1 && (
                                    <div style={{ position: 'absolute', right: '-10px', top: '50%', transform: 'translateY(-50%)', width: '1px', height: '30px', background: 'rgba(255,255,255,0.15)' }} />
                                )}
                                <div className="feature-icon-box" style={{
                                    width: "46px",
                                    height: "46px",
                                    borderRadius: "14px",
                                    border: "1px solid rgba(255,255,255,0.25)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background: "rgba(255,255,255,0.12)",
                                    backdropFilter: 'blur(8px)',
                                    transition: "all 0.3s ease",
                                    flexShrink: 0
                                }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>{f.icon}</span>
                                </div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: "0.88rem", fontWeight: 900, letterSpacing: '-0.2px' }}>{f.title}</h4>
                                    <p style={{ margin: 0, fontSize: "0.73rem", opacity: 0.75, fontWeight: 500, marginTop: '2px' }}>{f.desc}</p>
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
