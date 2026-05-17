import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { RevealSection, LottiePlayer, Typewriter, TransparentVideo } from "@components/SpecialEffects";
import { useCountUp } from "@hooks/useCountUp";
import { useTheme } from "../../contexts/ThemeContextV2";

/* banner giới thiệu trang chủ */
const PhanGioiThieu: React.FC = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { count: petCount, elementRef: petRef } = useCountUp(5000);
    const heroRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        document.documentElement.style.setProperty('--mouse-x', '50%');
        document.documentElement.style.setProperty('--mouse-y', '50%');

        const handleMouseMove = (e: MouseEvent) => {
            if (!heroRef.current) return;
            const { left, top, width, height } = heroRef.current.getBoundingClientRect();
            const x = (e.clientX - left) / width;
            const y = (e.clientY - top) / height;

            heroRef.current.style.setProperty('--mouse-x', `${x * 100}%`);
            heroRef.current.style.setProperty('--mouse-y', `${y * 100}%`);
            heroRef.current.style.setProperty('--parallax-x', `${(x - 0.5) * 25}px`);
            heroRef.current.style.setProperty('--parallax-y', `${(y - 0.5) * 25}px`);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <RevealSection>
            <section id="home" className="hero-section" ref={heroRef} style={{
                padding: "90px 0 80px",
                position: "relative",
                overflow: "hidden",
                background: "var(--background)",
                //@ts-ignore
                '--mouse-x': '50%',
                '--mouse-y': '50%',
                '--parallax-x': '0px',
                '--parallax-y': '0px'
            }}>
                <style>{`
                    .hero-bg-layer {
                        position: absolute;
                        top: -10%;
                        left: -10%;
                        width: 120%;
                        height: 120%;
                        background: url('/img/hinh-nen-rexi.png') center/cover no-repeat;
                        transform: translate3d(var(--parallax-x), var(--parallax-y), 0);
                        transition: transform 0.1s linear;
                        z-index: 0;
                        will-change: transform;
                    }
                    .hero-overlay-layer {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: ${isDark
                        ? 'linear-gradient(180deg, rgba(15, 23, 42, 0.82), rgba(15, 23, 42, 0.70))'
                        : 'linear-gradient(180deg, rgba(255,255,255,0.87), rgba(255,255,255,0.75))'};
                        z-index: 1;
                    }
                    .hero-light-effect {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: radial-gradient(circle at var(--mouse-x) var(--mouse-y), rgba(255,255,255,0.3) 0%, transparent 60%);
                        pointer-events: none;
                        z-index: 2;
                        mix-blend-mode: overlay;
                        will-change: background;
                    }
                    .stat-item { transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
                    .stat-item:hover { transform: translateY(-5px); }
                    .btn-wave { position: relative; overflow: hidden; }
                    .hero-stat-pill {
                        display: flex; align-items: center; gap: 12px;
                        background: var(--surface) !important; 
                        border-radius: 20px;
                        backdrop-filter: var(--glass-blur);
                        -webkit-backdrop-filter: var(--glass-blur);
                        padding: 12px 18px;
                        border: 1px solid var(--glass-border) !important;
                        box-shadow: none;
                        transition: all 0.3s ease;
                        cursor: default;
                    }
                    @keyframes crossFade {
                        0%, 45% { opacity: 1; filter: blur(0); transform: scale(1); }
                        50%, 95% { opacity: 0; filter: blur(10px); transform: scale(0.95); }
                        100% { opacity: 1; filter: blur(0); transform: scale(1); }
                    }
                    @keyframes crossFadeReverse {
                        0%, 45% { opacity: 0; filter: blur(10px); transform: scale(0.95); }
                        50%, 95% { opacity: 1; filter: blur(0); transform: scale(1); }
                        100% { opacity: 0; filter: blur(10px); transform: scale(0.95); }
                    }
                    
                    /* HIỆU ỨNG PHÁT SÁNG CHO CHỮ TRÊN BANNER (DARK MODE) - LÀM SẮC NÉT HƠN */
                    [data-theme='dark'] .hero-title {
                        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.6); /* Đổ bóng tối sắc nét, tăng độ tương phản và chống mỏi mắt */
                    }
                    [data-theme='dark'] .hero-light-effect {
                        mix-blend-mode: soft-light; /* Chuyển sang soft-light để bớt bị nhòe màu */
                        opacity: 0.8;
                    }
                    [data-theme='dark'] .floating-glass-card {
                        background: rgba(15, 23, 42, 0.92) !important; /* Đậm hơn để nổi bật */
                        border-color: rgba(45, 212, 191, 0.5) !important;
                        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5) !important;
                    }
                `}</style>

                {/* nền banner */}
                <div className="hero-bg-layer" />
                <div className="hero-overlay-layer" />
                <div className="hero-light-effect" />

                {/* hiệu ứng trang trí */}
                <div className="floating-bg" style={{ position: 'absolute', top: '10%', left: '3%', width: '220px', opacity: 0.18, pointerEvents: 'none', zIndex: 3 }}>
                    <LottiePlayer url="https://assets3.lottiefiles.com/packages/lf20_syqnfe7c.json" />
                </div>
                <span className="material-symbols-outlined floating-bg" style={{ position: 'absolute', bottom: '15%', right: '35%', fontSize: '200px', color: 'var(--primary)', opacity: 0.03, pointerEvents: 'none', animationDelay: '1s', zIndex: 3 }}>pets</span>

                <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '450px', height: '450px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(15,157,138,0.07) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 3 }} />
                <div style={{ position: 'absolute', bottom: '-120px', left: '-80px', width: '380px', height: '380px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(45,212,191,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 3 }} />

                <div className="hero-hero-background" />
                <div className="container" style={{ position: 'relative', zIndex: 4 }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1.15fr 0.85fr", gap: "48px", alignItems: "center" }}>
                        <div className="hero-content">
                            {/* nhãn tin cậy */}
                            <div ref={petRef as any} className="section-label" style={{ marginBottom: "28px", cursor: 'default', background: isDark ? 'rgba(217, 119, 6, 0.15)' : '#fffbeb', color: isDark ? '#fbbf24' : '#d97706', borderColor: isDark ? 'rgba(251, 191, 36, 0.3)' : '#fde68a' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>verified</span>
                                TIN CẬY TỪ {petCount.toLocaleString()}+ THÚ CƯNG
                            </div>

                            <h1 className="hero-title" style={{ fontSize: "clamp(2.4rem, 4.5vw, 3.6rem)", fontWeight: 950, color: "var(--ink)", lineHeight: 1.1, marginBottom: "22px", fontFamily: "'Lora', serif", letterSpacing: "-1.5px" }}>
                                Sức Khoẻ <span style={{ color: "var(--primary)" }}>Trọn Vẹn</span><br />
                                Cho <Typewriter words={["Thú Cưng", "Chó Cưng", "Mèo Cưng", "Người Bạn Nhỏ"]} />
                            </h1>
                            <p className="mission-text" style={{ 
                                fontSize: "1.15rem", 
                                color: isDark ? 'rgba(255, 255, 255, 0.85)' : '#4b5563', /* Tăng độ tương phản vượt trội: màu xám đậm trong light mode, trắng dịu trong dark mode */
                                maxWidth: "580px", 
                                marginBottom: "42px", 
                                lineHeight: 1.8, 
                                fontWeight: 500, 
                                fontFamily: "'Lora', serif", 
                                fontStyle: "italic",
                                position: "relative",
                                paddingLeft: "25px",
                                borderLeft: "3px solid var(--primary)"
                            }}>
                                <span style={{ position: "absolute", left: "-5px", top: "-15px", fontSize: "3.5rem", color: "var(--primary)", opacity: 0.15, fontFamily: "serif", userSelect: 'none' }}>“</span>
                                Rexi mang đến tiêu chuẩn y khoa quốc tế kết hợp cùng tình yêu thương vô bờ bến. Chúng tôi cam kết chăm sóc thú cưng của bạn như chính gia đình mình.
                            </p>
                            <div className="hero-cta-grid">
                                {/* ========================================================================= */}
                                {/* ĐÂY LÀ NÚT "ĐẶT LỊCH HẸN NGAY" Ở BANNER CHÍNH TRANG CHỦ                   */}
                                {/* ========================================================================= */}
                                <Link to="/khach-hang/dat-lich-hen" className="btn btn-primary btn-wave btn-pill" style={{ fontWeight: 900, boxShadow: '0 12px 30px var(--primary-shadow)' }}>ĐẶT LỊCH HẸN NGAY</Link>
                                <a href="#services" onClick={(e) => { e.preventDefault(); document.querySelector('#services')?.scrollIntoView({ behavior: 'smooth' }); }} className="btn btn-outline btn-pill" style={{ color: 'var(--ink)', background: 'var(--surface)', borderColor: 'var(--gray-300)', fontWeight: 900 }}>XEM DỊCH VỤ</a>
                            </div>


                            {/* Khối Chứng nhận & Đánh giá - nâng cấp thành pill cards */}
                            <div style={{ display: "flex", gap: "14px", marginTop: "24px", flexWrap: 'wrap' }}>
                                <div className="hero-stat-pill stat-item">
                                    <div style={{ background: "var(--green-50)", color: "var(--green-600)", width: "40px", height: "40px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>workspace_premium</span>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "0.65rem", color: "var(--gray-400)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>Chứng nhận</div>
                                        <div style={{ fontSize: "0.95rem", color: "var(--ink)", fontWeight: 950 }}>WSAVA</div>
                                    </div>
                                </div>

                                <div className="hero-stat-pill stat-item">
                                    <div style={{ background: "var(--orange-50)", color: "var(--orange-600)", width: "40px", height: "40px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>medical_services</span>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "0.65rem", color: "var(--gray-400)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>Phòng mổ</div>
                                        <div style={{ fontSize: "0.95rem", color: "var(--ink)", fontWeight: 950 }}>ISO 14644</div>
                                    </div>
                                </div>

                                <div className="hero-stat-pill stat-item">
                                    <div style={{ background: "var(--blue-50)", color: "var(--blue-600)", width: "40px", height: "40px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>star</span>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: "0.65rem", color: "var(--gray-400)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>Đánh giá</div>
                                        <div style={{ fontSize: "0.95rem", color: "var(--ink)", fontWeight: 950 }}>4.9 / 5.0</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ảnh video banner */}
                        <div style={{ position: "relative", height: window.innerWidth < 768 ? "300px" : "480px" }}>
                            {/* ========================================================================= */}
                            {/* ĐÂY LÀ THẺ "TẬN TÂM 24/7 - CẤP CỨU KỊP THỜI" HIỂN THỊ NỔI TRÊN BANNER      */}
                            {/* ========================================================================= */}
                            <div className="glass-card floating-glass-card" style={{
                                position: 'absolute',
                                bottom: '20px',
                                left: '10px',
                                background: 'var(--glass)',
                                backdropFilter: 'var(--glass-blur)',
                                padding: '14px 20px',
                                borderRadius: '22px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '14px',
                                zIndex: 10,
                                boxShadow: 'var(--shadow-xl)',
                                border: '1px solid var(--glass-border)'
                            }}>
                                <div style={{ background: 'linear-gradient(135deg, var(--rose-500), var(--rose-400))', width: '44px', height: '44px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 8px 15px var(--rose-shadow)' }}>
                                    <span className="material-symbols-outlined" style={{ color: 'var(--white)', fontSize: '24px' }}>volunteer_activism</span>
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <div className="glow-text-title" style={{ fontWeight: 950, color: 'var(--ink)', fontSize: '1.15rem', lineHeight: 1.2 }}>Tận Tâm 24/7</div>
                                    <div className="glow-text-sub" style={{ color: 'var(--ink)', opacity: 0.9, fontSize: '0.85rem', fontWeight: 800 }}>Cấp cứu kịp thời</div>
                                </div>
                            </div>

                            {/* khung chứa vật nuôi trong suốt */}
                            <div style={{ position: "relative", width: "100%", height: "100%", overflow: "visible" }}>
                                <div style={{
                                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                    zIndex: 2, animation: 'crossFade 10s infinite'
                                }}>
                                    <TransparentVideo 
                                        src={isDark ? "/img/video_cho_chao.webm" : "/img/video_cho_chao.webm"} 
                                        playbackRate={0.6} 
                                        isDark={isDark} 
                                        style={{
                                            width: '180%', height: '180%', objectFit: 'contain',
                                            position: 'absolute', bottom: '-8%', left: '50%', transform: 'translateX(-50%)',
                                            objectPosition: 'center',
                                            filter: 'contrast(1.1) saturate(1.05)'
                                        }} 
                                    />
                                </div>

                                <div style={{
                                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                    zIndex: 1, animation: 'crossFadeReverse 10s infinite'
                                }}>
                                    <TransparentVideo 
                                        src="/img/video_meo_chao.webm" 
                                        playbackRate={0.6} 
                                        isDark={isDark} 
                                        style={{
                                            width: '180%', height: '180%', objectFit: 'contain',
                                            position: 'absolute', bottom: '-8%', left: '50%', transform: 'translateX(-50%)',
                                            objectPosition: 'center',
                                            filter: 'contrast(1.1) saturate(1.05)'
                                        }} 
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </RevealSection>
    );
};

export default PhanGioiThieu;
