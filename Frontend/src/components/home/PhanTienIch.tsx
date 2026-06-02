import React from "react";

const PhanTienIch: React.FC = () => {
    const features = [
        { icon: "emergency_home", title: "Cấp cứu 24/7", mobileTitle: "Cấp cứu", desc: "Luôn sẵn sàng" },
        { icon: "lab_research", title: "Xét nghiệm tại chỗ", mobileTitle: "Xét nghiệm", desc: "Kết quả trong 30 phút" },
        { icon: "vaccines", title: "Vaccine chính hãng", mobileTitle: "Vaccine", desc: "Nhập khẩu Châu Âu" },
        { icon: "payments", title: "Thanh toán linh hoạt", mobileTitle: "Thanh toán", desc: "Tiền mặt, Thẻ, QR" },
        { icon: "headset_mic", title: "Tư vấn miễn phí", mobileTitle: "Tư vấn", desc: "Qua điện thoại & Zalo" }
    ];

    return (
        <>
            <section className="premium-fluid-gradient home-feature-strip">
                {/* Style riêng cho dải tiện ích trang chủ */}
                <style>{`
                .home-feature-strip {
                    padding: 16px 0;
                    color: white;
                    position: relative;
                    overflow: hidden;
                }
                .home-feature-strip .container {
                    position: relative;
                    z-index: 1;
                }
                .home-feature-grid {
                    display: grid;
                    grid-template-columns: repeat(5, minmax(0, 1fr));
                    gap: 12px;
                    align-items: stretch;
                }
                .home-feature-card {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    min-width: 0;
                    min-height: 76px;
                    position: relative;
                    cursor: default;
                    color: white !important;
                    background: rgba(255,255,255,0.16) !important;
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.24) !important;
                    border-radius: 18px !important;
                    padding: 12px 14px !important;
                    box-shadow: 0 10px 26px rgba(15, 23, 42, 0.08);
                    transition: transform 0.3s ease, background 0.3s ease, box-shadow 0.3s ease;
                }
                .home-feature-card:hover {
                    transform: translateY(-3px);
                    background: rgba(255,255,255,0.22) !important;
                    box-shadow: 0 14px 30px rgba(0,0,0,0.12) !important;
                }
                .home-feature-card:hover .home-feature-icon {
                    background: rgba(255, 255, 255, 0.34) !important;
                    border-color: rgba(255, 255, 255, 0.52) !important;
                    transform: scale(1.04) rotate(-2deg);
                }
                .home-feature-icon {
                    width: 44px;
                    height: 44px;
                    border-radius: 14px;
                    border: 1px solid rgba(255,255,255,0.28);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(255,255,255,0.18);
                    backdrop-filter: blur(6px);
                    -webkit-backdrop-filter: blur(6px);
                    transition: all 0.3s ease;
                    flex: 0 0 auto;
                }
                .home-feature-icon span {
                    color: white !important;
                    font-size: 22px;
                }
                .home-feature-copy {
                    min-width: 0;
                }
                .home-feature-card h4 {
                    margin: 0;
                    color: white !important;
                    font-family: 'Be Vietnam Pro', sans-serif;
                    font-size: 0.82rem;
                    font-weight: 850;
                    line-height: 1.25;
                }
                .home-feature-card p {
                    margin: 3px 0 0;
                    color: rgba(255,255,255,0.86) !important;
                    font-size: 0.68rem;
                    font-weight: 650;
                    line-height: 1.35;
                }
                .home-feature-mobile-title {
                    display: none;
                }
                .home-feature-divider {
                    position: absolute;
                    right: -7px;
                    top: 50%;
                    transform: translateY(-50%);
                    width: 1px;
                    height: 26px;
                    background: rgba(255,255,255,0.15);
                }
                @media screen and (max-width: 1200px) {
                    .home-feature-grid {
                        grid-template-columns: repeat(3, minmax(0, 1fr));
                    }
                    .home-feature-divider {
                        display: none !important;
                    }
                }
                @media screen and (max-width: 768px) {
                    .home-feature-strip {
                        padding: 9px 0;
                    }
                    .home-feature-strip .container {
                        padding: 0;
                        max-width: none;
                    }
                    .home-feature-grid {
                        display: flex;
                        gap: 0;
                        overflow-x: auto;
                        overflow-y: hidden;
                        padding: 0 12px;
                        margin: 0;
                        scroll-snap-type: x mandatory;
                        scrollbar-width: none;
                    }
                    .home-feature-grid::-webkit-scrollbar {
                        display: none;
                    }
                    .home-feature-card {
                        flex: 0 0 auto;
                        min-height: 42px;
                        min-width: max-content;
                        flex-direction: row;
                        justify-content: flex-start;
                        gap: 7px;
                        padding: 7px 12px !important;
                        border-radius: 999px !important;
                        text-align: left;
                        scroll-snap-align: start;
                        background: rgba(255,255,255,0.12) !important;
                        border-color: rgba(255,255,255,0.18) !important;
                        box-shadow: none !important;
                    }
                    .home-feature-card + .home-feature-card {
                        margin-left: 8px;
                    }
                    .home-feature-card:active {
                        transform: translateY(-2px) scale(1.02);
                        background: rgba(255,255,255,0.22) !important;
                    }
                    .home-feature-icon {
                        width: 28px;
                        height: 28px;
                        border-radius: 999px;
                    }
                    .home-feature-icon span {
                        font-size: 16px;
                    }
                    .home-feature-card h4 {
                        font-family: 'Be Vietnam Pro', sans-serif;
                        font-size: 0.68rem;
                        font-weight: 850;
                        line-height: 1;
                        white-space: nowrap;
                    }
                    .home-feature-card p {
                        display: none;
                    }
                    .home-feature-full-title {
                        display: none;
                    }
                    .home-feature-mobile-title {
                        display: inline;
                    }
                }
                @media screen and (max-width: 430px) {
                    .home-feature-strip .container {
                        padding: 0;
                    }
                    .home-feature-grid {
                        gap: 0;
                        padding: 0 10px;
                    }
                    .home-feature-card {
                        min-height: 40px;
                        padding: 6px 10px !important;
                    }
                    .home-feature-card h4 {
                        font-size: 0.64rem;
                    }
                    .home-feature-icon {
                        width: 26px;
                        height: 26px;
                        border-radius: 999px;
                    }
                    .home-feature-icon span {
                        font-size: 16px;
                    }
                }
            `}</style>
                {/* Shimmer overlay */}
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)', pointerEvents: 'none' }} />
                <div className="container">
                    <div className="home-feature-grid">
                        {features.map((f, idx) => (
                            <div key={idx} className="home-feature-card">
                                {idx < features.length - 1 && (
                                    <div className="home-feature-divider" />
                                )}
                                <div className="home-feature-icon">
                                    <span className="material-symbols-outlined">{f.icon}</span>
                                </div>
                                <div className="home-feature-copy">
                                    <h4>
                                        <span className="home-feature-full-title">{f.title}</span>
                                        <span className="home-feature-mobile-title">{f.mobileTitle}</span>
                                    </h4>
                                    <p>{f.desc}</p>
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
