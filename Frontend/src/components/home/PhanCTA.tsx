import React from "react";
import { useNavigate } from "react-router-dom";
import { getUserProfile, normalizeUserRole } from "@utils/index";
import { toast } from "@components/Toast";

// * * PHẦN KÊU GỌI HÀNH ĐỘNG (CTA)
const PhanCTA: React.FC = () => {
    const navigate = useNavigate();

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
    return (
        <section className="premium-fluid-gradient home-cta-section" style={{
            padding: "80px 0",
            position: "relative",
            overflow: "hidden"
        }}>
            <style>{`
                @keyframes ctaPulse {
                    0%, 100% { transform: scale(1); opacity: 0.5; }
                    50% { transform: scale(1.1); opacity: 0.8; }
                }
                @keyframes ctaButtonShine {
                    0% { transform: translateX(-130%) skewX(-18deg); }
                    56%, 100% { transform: translateX(170%) skewX(-18deg); }
                }
                @keyframes ctaAvatarFloat {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-5px); }
                }
                .cta-action-card {
                    transition: transform 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease;
                }
                .cta-action-card:hover {
                    transform: translateY(-6px);
                    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.22);
                    border-color: rgba(255,255,255,0.36) !important;
                }
                .cta-avatar {
                    animation: ctaAvatarFloat 3s ease-in-out infinite;
                    transition: transform 0.25s ease;
                }
                .cta-action-card:hover .cta-avatar {
                    transform: translateY(-4px) scale(1.04);
                }
                .cta-btn-primary,
                .cta-btn-outline {
                    position: relative;
                    overflow: hidden;
                }
                .cta-btn-primary::before,
                .cta-btn-outline::before {
                    content: "";
                    position: absolute;
                    top: -45%;
                    bottom: -45%;
                    left: 0;
                    width: 42%;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.58), transparent);
                    transform: translateX(-130%) skewX(-18deg);
                    animation: ctaButtonShine 2.8s ease-in-out infinite;
                }
                .cta-btn-primary:hover { background: #fffbeb !important; color: #ea580c !important; transform: translateY(-3px); box-shadow: 0 15px 35px rgba(0,0,0,0.2) !important; }
                .cta-btn-outline:hover { background: rgba(255,255,255,0.14) !important; border-color: white !important; transform: translateY(-3px); box-shadow: 0 12px 28px rgba(255,255,255,0.14); }
                .cta-btn-primary span,
                .cta-btn-outline span {
                    position: relative;
                    z-index: 1;
                    transition: transform 0.25s ease;
                }
                .cta-btn-primary:hover .cta-btn-icon,
                .cta-btn-outline:hover .cta-btn-icon {
                    transform: rotate(-8deg) scale(1.08);
                }
                @media (max-width: 1024px) {
                    .cta-layout { flex-direction: column !important; text-align: center !important; }
                    .cta-btn-group { justify-content: center !important; }
                    .cta-badges { justify-content: center !important; }
                }
                @media (max-width: 700px) {
                    .home-cta-section {
                        padding: 58px 0 !important;
                    }
                    .home-cta-section .container {
                        padding-left: 18px !important;
                        padding-right: 18px !important;
                    }
                    .cta-layout {
                        align-items: stretch !important;
                        gap: 18px !important;
                        text-align: left !important;
                        display: grid !important;
                        grid-template-columns: 1fr !important;
                    }
                    .cta-badges {
                        justify-content: flex-start !important;
                        flex-wrap: nowrap !important;
                        gap: 8px !important;
                        overflow-x: auto;
                        margin: 0 -18px 18px 0 !important;
                        padding: 0 18px 2px 0;
                        scrollbar-width: none;
                    }
                    .cta-badges::-webkit-scrollbar {
                        display: none;
                    }
                    .cta-badges > div {
                        flex: 0 0 auto;
                        padding: 6px 12px !important;
                    }
                    .cta-badges span:last-child {
                        font-size: 0.7rem !important;
                    }
                    .cta-layout h2 {
                        max-width: 320px;
                        font-size: 2.05rem !important;
                        line-height: 1.12 !important;
                        letter-spacing: 0 !important;
                        margin-bottom: 12px !important;
                    }
                    .cta-layout h2 span {
                        color: #ffedd5 !important;
                    }
                    .cta-layout p {
                        max-width: 330px !important;
                        font-size: 0.86rem !important;
                        line-height: 1.55 !important;
                    }
                    .cta-action-card {
                        min-width: 0 !important;
                        width: 100% !important;
                        display: grid;
                        grid-template-columns: 1fr;
                        padding: 0 !important;
                        border-radius: 24px !important;
                        background: rgba(255,255,255,0.10) !important;
                        text-align: left !important;
                        overflow: hidden;
                    }
                    .cta-action-card > div:first-child {
                        justify-content: flex-start !important;
                        margin: 0 !important;
                        padding: 18px 18px 6px;
                        background: rgba(255,255,255,0.08);
                    }
                    .cta-action-card > div:nth-child(2) {
                        padding: 10px 18px 0;
                        font-size: 0.76rem !important;
                        margin-bottom: 4px !important;
                    }
                    .cta-action-card > div:nth-child(3) {
                        padding: 0 18px;
                        font-size: 0.95rem !important;
                        margin-bottom: 16px !important;
                    }
                    .cta-btn-group {
                        display: grid !important;
                        grid-template-columns: 1fr 48px;
                        gap: 10px !important;
                        padding: 0 18px 18px;
                    }
                    .cta-btn-primary,
                    .cta-btn-outline {
                        border-radius: 16px !important;
                        padding: 13px 16px !important;
                        font-size: 0.84rem !important;
                    }
                    .cta-btn-outline {
                        width: 48px;
                        height: 48px;
                        padding: 0 !important;
                        background: rgba(255,255,255,0.08) !important;
                        border-width: 1px !important;
                    }
                    .cta-btn-outline span:last-child {
                        display: none;
                    }
                    .cta-action-card:hover,
                    .cta-action-card:active {
                        transform: translateY(-4px);
                    }
                }
            `}</style>

            {/* Các vòng tròn trang trí nghệ thuật */}
            <div style={{ position: 'absolute', top: '-100px', right: '10%', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', animation: 'ctaPulse 6s ease-in-out infinite', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '-80px', left: '5%', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', animation: 'ctaPulse 8s ease-in-out infinite 2s', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: '50%', right: '-50px', transform: 'translateY(-50%)', fontSize: '18rem', fontWeight: 950, color: 'rgba(255,255,255,0.04)', fontFamily: "'Lora', serif", lineHeight: 1, pointerEvents: 'none', letterSpacing: '-8px' }}>REXI</div>

            <div className="container">
                <div className="cta-layout" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '48px' }}>

                    {/* Nội dung bên trái */}
                    <div style={{ flex: 1 }}>
                        {/* Nhãn chứng nhận uy tín */}
                        <div className="cta-badges" style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
                            <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', padding: '6px 16px', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(255,255,255,0.2)' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#fbbf24' }}>star</span>
                                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'white' }}>4.9/5 đánh giá</span>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', padding: '6px 16px', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(255,255,255,0.2)' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#86efac' }}>verified</span>
                                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'white' }}>WSAVA Certified</span>
                            </div>
                            <div style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', padding: '6px 16px', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(255,255,255,0.2)' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'white' }}>emergency_home</span>
                                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'white' }}>Cấp cứu 24/7</span>
                            </div>
                        </div>

                        <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 950, color: 'white', lineHeight: 1.2, letterSpacing: '-1px', marginBottom: '16px' }}>
                            Đặt Lịch Hẹn Cho Bé<br />
                            <span style={{ color: 'rgba(255,255,255,0.75)', fontStyle: 'italic' }}>Ngay Hôm Nay!</span>
                        </h2>
                        <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '1rem', fontWeight: 500, lineHeight: 1.7, maxWidth: '480px' }}>
                            Chỉ 2 phút để đặt lịch. Bác sĩ xác nhận trong vòng 30 phút. Chúng tôi luôn sẵn sàng vì sức khoẻ của người bạn nhỏ.
                        </p>
                    </div>

                    {/* Bên phải: Thẻ đăng ký trực tuyến */}
                    <div className="cta-action-card" style={{ flex: '0 0 auto', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)', borderRadius: '32px', padding: '40px 36px', border: '1px solid rgba(255,255,255,0.2)', minWidth: '320px', textAlign: 'center' }}>
                        {/* Nhóm ảnh đại diện bs nổi bật */}
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                            {["/img/bac_si_minh_anh.png", "/img/bac_si_khanh_linh.png", "/img/bac_si_hoang_nam.png"].map((src, i) => (
                                <div key={i} className="cta-avatar" style={{ width: '52px', height: '52px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.5)', overflow: 'hidden', marginLeft: i === 0 ? 0 : '-16px', position: 'relative', zIndex: 3 - i, background: 'var(--primary)', animationDelay: `${i * 0.18}s` }}>
                                    <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
                                </div>
                            ))}
                            <div style={{ width: '52px', height: '52px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '-16px', fontSize: '0.7rem', fontWeight: 900, color: 'white' }}>+12</div>
                        </div>

                        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>15+ bác sĩ đang chờ bạn</div>
                        <div style={{ fontWeight: 900, color: 'white', fontSize: '1.1rem', marginBottom: '28px' }}>Thời gian chờ trung bình: <span style={{ color: '#a7f3d0' }}>~5 phút</span></div>

                        <div className="cta-btn-group" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <a href="#" onClick={handleBookingClick} className="cta-btn-primary" style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)', color: 'white', padding: '16px 32px', borderRadius: '50px', fontWeight: 900, textDecoration: 'none', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.3s', boxShadow: '0 8px 24px rgba(245,158,11,0.3)', border: 'none' }}>
                                <span className="material-symbols-outlined cta-btn-icon" style={{ fontSize: '20px' }}>calendar_month</span>
                                <span>Đặt lịch hẹn ngay</span>
                            </a>
                            <a href="tel:02412345678" className="cta-btn-outline" style={{ background: 'transparent', color: 'white', padding: '14px 32px', borderRadius: '50px', fontWeight: 800, textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', border: '2px solid rgba(255,255,255,0.4)', transition: 'all 0.3s' }}>
                                <span className="material-symbols-outlined cta-btn-icon" style={{ fontSize: '18px' }}>call</span>
                                <span>024 1234 5678</span>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default PhanCTA;
