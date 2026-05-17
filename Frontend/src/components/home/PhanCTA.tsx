import React from "react";
import { Link } from "react-router-dom";

/**
 * PHẦN KÊU GỌI HÀNH ĐỘNG (CTA)
 */
const PhanCTA: React.FC = () => {
    return (
        <section className="premium-fluid-gradient" style={{
            padding: "80px 0",
            position: "relative",
            overflow: "hidden"
        }}>
            <style>{`
                @keyframes ctaPulse {
                    0%, 100% { transform: scale(1); opacity: 0.5; }
                    50% { transform: scale(1.1); opacity: 0.8; }
                }
                .cta-btn-primary:hover { background: #fffbeb !important; color: #ea580c !important; transform: translateY(-3px); box-shadow: 0 15px 35px rgba(0,0,0,0.2) !important; }
                .cta-btn-outline:hover { background: rgba(255,255,255,0.1) !important; border-color: white !important; transform: translateY(-3px); }
                @media (max-width: 768px) {
                    .cta-layout { flex-direction: column !important; text-align: center !important; }
                    .cta-btn-group { justify-content: center !important; }
                    .cta-badges { justify-content: center !important; }
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
                    <div style={{ flex: '0 0 auto', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)', borderRadius: '32px', padding: '40px 36px', border: '1px solid rgba(255,255,255,0.2)', minWidth: '320px', textAlign: 'center' }}>
                        {/* Nhóm ảnh đại diện bác sĩ nổi bật */}
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                            {["/img/bac_si_minh_anh.png", "/img/bac_si_khanh_linh.png", "/img/bac_si_hoang_nam.png"].map((src, i) => (
                                <div key={i} style={{ width: '52px', height: '52px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.5)', overflow: 'hidden', marginLeft: i === 0 ? 0 : '-16px', position: 'relative', zIndex: 3 - i, background: 'var(--primary)' }}>
                                    <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
                                </div>
                            ))}
                            <div style={{ width: '52px', height: '52px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginLeft: '-16px', fontSize: '0.7rem', fontWeight: 900, color: 'white' }}>+12</div>
                        </div>

                        <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>15+ bác sĩ đang chờ bạn</div>
                        <div style={{ fontWeight: 900, color: 'white', fontSize: '1.1rem', marginBottom: '28px' }}>Thời gian chờ trung bình: <span style={{ color: '#a7f3d0' }}>~5 phút</span></div>

                        <div className="cta-btn-group" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <Link to="/khach-hang/dat-lich-hen" className="cta-btn-primary" style={{ background: 'linear-gradient(135deg, #f59e0b, #ea580c)', color: 'white', padding: '16px 32px', borderRadius: '50px', fontWeight: 900, textDecoration: 'none', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.3s', boxShadow: '0 8px 24px rgba(245,158,11,0.3)', border: 'none' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>calendar_month</span>
                                Đặt lịch hẹn ngay
                            </Link>
                            <a href="tel:02412345678" className="cta-btn-outline" style={{ background: 'transparent', color: 'white', padding: '14px 32px', borderRadius: '50px', fontWeight: 800, textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', border: '2px solid rgba(255,255,255,0.4)', transition: 'all 0.3s' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>call</span>
                                024 1234 5678
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default PhanCTA;
