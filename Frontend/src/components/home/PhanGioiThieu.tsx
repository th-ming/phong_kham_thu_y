import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RevealSection, LottiePlayer, Typewriter, TransparentVideo } from "@components/SpecialEffects";
import { useCountUp } from "@hooks/useCountUp";
import { useTheme } from "../../contexts/ThemeContextV2";
import { getUserProfile, normalizeUserRole } from "@utils/index";
import { toast } from "@components/Toast";

type BannerTextStyle = {
    top: string;
    left: string;
    fontSize: string;
};

const bannerTextStyles: Record<string, BannerTextStyle> = {
    "Hello bạn! 🐶": { top: "-2.7%", left: "39%", fontSize: "clamp(2.2rem, 3.2vw, 3.5rem)" },
    "Gâu gâu! Xin chào!": { top: "-2.5%", left: "39%", fontSize: "clamp(2.05rem, 2.95vw, 3.25rem)" },
    "Chào mừng đến Rexi!": { top: "-2.3%", left: "39%", fontSize: "clamp(1.9rem, 2.62vw, 3rem)" },
    "Rất vui được gặp bạn!": { top: "-2.3%", left: "39%", fontSize: "clamp(1.95rem, 2.78vw, 3.1rem)" },
    "Meow meow~ 😽": { top: "-2.7%", left: "39%", fontSize: "clamp(2.15rem, 3.1vw, 3.4rem)" },
    "Xin chào con sen!": { top: "-2.4%", left: "39%", fontSize: "clamp(2rem, 2.9vw, 3.2rem)" },
    "Meow! Rexi Vet xin chào!": { top: "-2.1%", left: "39%", fontSize: "clamp(1.78rem, 2.48vw, 2.82rem)" }
};

const getBannerTextStyle = (text: string): React.CSSProperties => {
    const style = bannerTextStyles[text] ?? bannerTextStyles["Hello bạn! 🐶"];
    return {
        '--banner-text-top': style.top,
        '--banner-text-left': style.left,
        '--banner-text-size': style.fontSize
    } as React.CSSProperties;
};

// banner giới thiệu trang chủ
const PhanGioiThieu: React.FC = () => {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const { count: petCount, elementRef: petRef } = useCountUp(5000);
    const heroRef = useRef<HTMLDivElement>(null);
    const [dogBannerText, setDogBannerText] = useState("Hello bạn! 🐶");
    const [catBannerText, setCatBannerText] = useState("Meow meow~ 😽");

    const getDogBannerText = (currentTime: number, duration: number) => {
        const phase = duration > 0 ? currentTime / duration : (currentTime % 6) / 6;
        if (phase < 0.20) return "Hello bạn! 🐶";
        if (phase < 0.44) return "Gâu gâu! Xin chào!";
        if (phase < 0.76) return "Chào mừng đến Rexi!";
        return "Rất vui được gặp bạn!";
    };

    const getCatBannerText = (currentTime: number, duration: number) => {
        const phase = duration > 0 ? currentTime / duration : (currentTime % 6) / 6;
        if (phase < 0.34) return "Meow meow~ 😽";
        if (phase < 0.59) return "Xin chào con sen!";
        if (phase < 0.92) return "Meow! Rexi Vet xin chào!";
        return "Meow meow~ 😽";
    };

    const handleDogVideoTime = useCallback((currentTime: number, duration: number) => {
        const nextText = getDogBannerText(currentTime, duration);
        setDogBannerText((current) => current === nextText ? current : nextText);
    }, []);

    const handleCatVideoTime = useCallback((currentTime: number, duration: number) => {
        const nextText = getCatBannerText(currentTime, duration);
        setCatBannerText((current) => current === nextText ? current : nextText);
    }, []);

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
                padding: "72px 0 62px",
                position: "relative",
                overflow: "hidden",
                background: "var(--background)",
                // @ts-ignore
                '--mouse-x': '50%',
                '--mouse-y': '50%',
                '--parallax-x': '0px',
                '--parallax-y': '0px'
            }}>
                <style>{`
                    @keyframes gradientAnimation {
                        0% { background-position: 0% 50%; }
                        50% { background-position: 100% 50%; }
                        100% { background-position: 0% 50%; }
                    }
                    .hero-gradient-backdrop {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: linear-gradient(-45deg, rgba(34, 211, 238, 0.08), rgba(20, 184, 166, 0.08), rgba(16, 185, 129, 0.05), rgba(34, 211, 238, 0.03));
                        background-size: 400% 400%;
                        animation: gradientAnimation 12s ease infinite;
                        z-index: 1;
                        pointer-events: none;
                    }
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
                        ? 'linear-gradient(180deg, rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.72))'
                        : 'linear-gradient(180deg, rgba(255,255,255,0.89), rgba(255,255,255,0.78))'};
                        z-index: 1;
                    }
                    .hero-light-effect {
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: radial-gradient(circle at var(--mouse-x) var(--mouse-y), rgba(255,255,255,0.25) 0%, transparent 60%);
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
                    @keyframes bannerTextCrossFade {
                        0%, 45% { opacity: 1; filter: blur(0); transform: translateX(-50%) scale(1); }
                        50%, 95% { opacity: 0; filter: blur(10px); transform: translateX(-50%) scale(0.95); }
                        100% { opacity: 1; filter: blur(0); transform: translateX(-50%) scale(1); }
                    }
                    @keyframes bannerTextCrossFadeReverse {
                        0%, 45% { opacity: 0; filter: blur(10px); transform: translateX(-50%) scale(0.95); }
                        50%, 95% { opacity: 1; filter: blur(0); transform: translateX(-50%) scale(1); }
                        100% { opacity: 0; filter: blur(10px); transform: translateX(-50%) scale(0.95); }
                    }
                    @keyframes floatSlow {
                        0% { transform: translateY(0) rotate(0deg); opacity: 0.15; }
                        50% { transform: translateY(-20px) rotate(15deg); opacity: 0.35; }
                        100% { transform: translateY(0) rotate(0deg); opacity: 0.15; }
                    }
                    .floating-paw-1 {
                        animation: floatSlow 7s ease-in-out infinite;
                    }
                    .floating-paw-2 {
                        animation: floatSlow 9s ease-in-out infinite 2s;
                    }
                    
                    /* HIỆU ỨNG PHÁT SÁNG NÚT CTA BẰNG GRADIENT WADHAH ALOUI STYLE */
                    .cta-invite {
                        position: relative;
                        overflow: hidden;
                        box-shadow: 0 0 20px rgba(34, 211, 238, 0.35);
                        background: var(--primary-gradient) !important;
                        border: none !important;
                        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                    }
                    .cta-invite:hover {
                        transform: translateY(-3px) scale(1.03);
                        box-shadow: 0 12px 28px rgba(34, 211, 238, 0.55);
                    }
                    .cta-invite::after {
                        content: '';
                        position: absolute;
                        top: -50%;
                        left: -60%;
                        width: 30%;
                        height: 200%;
                        background: rgba(255, 255, 255, 0.38);
                        transform: rotate(35deg);
                        pointer-events: none;
                        transition: none;
                    }
                    .cta-invite:hover::after {
                        left: 140%;
                        transition: all 0.8s ease-in-out;
                    }

                    .hero-title {
                        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
                    }
                    [data-theme='dark'] .hero-title {
                        text-shadow: 0 0 55px rgba(45, 212, 191, 0.28), 0 0 22px rgba(15, 157, 138, 0.35), 0 2px 8px rgba(0, 0, 0, 0.55);
                    }
                    .hero-glow-text {
                        color: #0f9d8a;
                        text-shadow: 0 0 6px rgba(15, 157, 138, 0.32), 0 0 14px rgba(45, 212, 191, 0.18);
                        animation: glowPulse 3s ease-in-out infinite;
                        font-weight: 900;
                    }
                    [data-theme='dark'] .hero-glow-text {
                        color: var(--primary);
                        text-shadow: 0 0 8px rgba(45, 212, 191, 0.58), 0 0 18px rgba(34, 211, 238, 0.30);
                    }
                    
                    /* Chữ chào phát sáng lớn phía sau động vật */
                    .glow-bg-text {
                        color: #ffffff;
                        text-shadow: 
                            0 0 10px rgba(15, 157, 138, 0.4), 
                            0 0 20px rgba(15, 157, 138, 0.3), 
                            0 0 40px rgba(45, 212, 191, 0.2);
                        filter: drop-shadow(0 4px 8px rgba(0,0,0,0.06));
                    }
                    [data-theme='dark'] .glow-bg-text {
                        color: #ffffff;
                        text-shadow: 
                            0 0 15px rgba(45, 212, 191, 0.95), 
                            0 0 30px rgba(15, 157, 138, 0.75), 
                            0 0 45px rgba(20, 184, 166, 0.55),
                            0 0 60px rgba(34, 211, 238, 0.35);
                    }

                    @keyframes glowPulse {
                        0%, 100% { filter: drop-shadow(0 0 1px rgba(15, 157, 138, 0.18)); }
                        50% { filter: drop-shadow(0 0 4px rgba(15, 157, 138, 0.36)) drop-shadow(0 0 8px rgba(45, 212, 191, 0.22)); }
                    }
                    .banner-sync-text {
                        position: absolute;
                        top: var(--banner-text-top);
                        left: var(--banner-text-left);
                        transform: translateX(-50%);
                        z-index: 8;
                        pointer-events: none;
                        white-space: nowrap;
                        font-family: 'Lora', serif;
                        font-size: var(--banner-text-size);
                        line-height: 1;
                        font-weight: 950;
                        font-style: italic;
                        letter-spacing: 0;
                        color: #0f9d8a;
                        text-align: center;
                        text-rendering: geometricPrecision;
                        -webkit-font-smoothing: antialiased;
                        text-shadow:
                            0 1px 0 rgba(255,255,255,0.32),
                            0 0 10px rgba(15, 157, 138, 0.42),
                            0 0 24px rgba(45, 212, 191, 0.28),
                            0 8px 20px rgba(0,0,0,0.16);
                        filter: drop-shadow(0 0 10px rgba(20, 184, 166, 0.34));
                    }
                    [data-theme='dark'] .banner-sync-text {
                        color: #7dd3fc;
                        text-shadow:
                            0 1px 0 rgba(255,255,255,0.12),
                            0 0 10px rgba(125, 211, 252, 0.46),
                            0 0 22px rgba(34, 211, 238, 0.30),
                            0 10px 24px rgba(0,0,0,0.45);
                        filter: drop-shadow(0 0 10px rgba(34, 211, 238, 0.34));
                    }
                    [data-theme='dark'] .hero-light-effect {
                        mix-blend-mode: soft-light;
                        opacity: 0.8;
                    }
                    [data-theme='dark'] .floating-glass-card {
                        background: rgba(15, 23, 42, 0.92) !important;
                        border-color: rgba(45, 212, 191, 0.5) !important;
                        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5) !important;
                    }
                `}</style>

                {/* nền banner */}
                <div className="hero-bg-layer" />
                <div className="hero-gradient-backdrop" />
                <div className="hero-overlay-layer" />
                <div className="hero-light-effect" />

                {/* hiệu ứng trang trí lơ lửng động */}
                <span className="material-symbols-outlined floating-paw-1" style={{ position: 'absolute', top: '15%', left: '15%', fontSize: '42px', color: 'var(--primary)', pointerEvents: 'none', zIndex: 3 }}>pets</span>
                <span className="material-symbols-outlined floating-paw-2" style={{ position: 'absolute', bottom: '25%', right: '25%', fontSize: '36px', color: '#14b8a6', pointerEvents: 'none', zIndex: 3 }}>favorite</span>

                <div className="floating-bg" style={{ position: 'absolute', top: '10%', left: '3%', width: '220px', opacity: 0.18, pointerEvents: 'none', zIndex: 3 }}>
                    <LottiePlayer url="https://assets3.lottiefiles.com/packages/lf20_syqnfe7c.json" />
                </div>
                <span className="material-symbols-outlined floating-bg" style={{ position: 'absolute', bottom: '15%', right: '35%', fontSize: '200px', color: 'var(--primary)', opacity: 0.03, pointerEvents: 'none', animationDelay: '1s', zIndex: 3 }}>pets</span>

                <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '450px', height: '450px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(15,157,138,0.07) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 3 }} />
                <div style={{ position: 'absolute', bottom: '-120px', left: '-80px', width: '380px', height: '380px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(45,212,191,0.06) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 3 }} />

                <div className="hero-hero-background" />
                <div className="container" style={{ position: 'relative', zIndex: 4 }}>
                    <div className="hero-layout-grid">
                        <div className="hero-content">
                            {/* nhãn tin cậy */}
                            <div ref={petRef as any} className="section-label" style={{ marginBottom: "28px", cursor: 'default', background: isDark ? 'rgba(217, 119, 6, 0.15)' : '#fffbeb', color: isDark ? '#fbbf24' : '#d97706', borderColor: isDark ? 'rgba(251, 191, 36, 0.3)' : '#fde68a' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>verified</span>
                                TIN CẬY TỪ {petCount.toLocaleString()}+ THÚ CƯNG
                            </div>

                            <h1 className="hero-title" style={{ fontSize: "clamp(2.4rem, 4.5vw, 3.6rem)", fontWeight: 950, color: "var(--ink)", lineHeight: 1.1, marginBottom: "22px", fontFamily: "'Lora', serif", letterSpacing: "-1.5px" }}>
                                Sức Khoẻ <span className="hero-glow-text">Trọn Vẹn</span><br />
                                Cho <Typewriter words={["Thú Cưng", "Chó Cưng", "Mèo Cưng", "Người Bạn Nhỏ"]} />
                            </h1>
                            <p className="mission-text" style={{ 
                                fontSize: "1.15rem", 
                                color: isDark ? 'rgba(255, 255, 255, 0.85)' : '#4b5563', 
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
                            <div className="hero-cta-grid" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                <a href="#" data-ai-id="button-hero-datlich-ngay" onClick={handleBookingClick} className="btn btn-primary btn-pill hero-cta-btn cta-invite" style={{ fontWeight: 900 }}>ĐẶT LỊCH HẸN NGAY</a>
                                <a href="#services" data-ai-id="button-hero-xem-dich-vu" onClick={(e) => { e.preventDefault(); document.querySelector('#services')?.scrollIntoView({ behavior: 'smooth' }); }} className="btn btn-outline btn-pill hero-secondary-cta" style={{ color: 'var(--ink)', background: 'var(--surface)', borderColor: 'var(--gray-300)', fontWeight: 900 }}>XEM DỊCH VỤ</a>
                            </div>

                            {/* Khối Chứng nhận & Đánh giá */}
                            <div className="hero-stat-pill-container" style={{ display: "flex", gap: "14px", marginTop: "24px", flexWrap: 'wrap' }}>
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

                        <div className="hero-image-container">
                            {/* Khối Glassmorphism Cấp cứu */}
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

                             {/* Khu vực trình diễn chó mèo động */}
                            <div style={{ position: "relative", width: "100%", height: "100%", overflow: "visible" }}>
                                <div className="banner-sync-text" style={{ ...getBannerTextStyle(dogBannerText), animation: 'bannerTextCrossFade 10s infinite' }}>
                                    {dogBannerText}
                                </div>
                                <div className="banner-sync-text" style={{ ...getBannerTextStyle(catBannerText), animation: 'bannerTextCrossFadeReverse 10s infinite' }}>
                                    {catBannerText}
                                </div>

                                {/* VIDEO CHÓ VẪY TAY CHÀO */}
                                <div style={{
                                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                    zIndex: 3, animation: 'crossFade 10s infinite'
                                }}>
                                    <TransparentVideo 
                                        src="/img/video_cho_chao.webm" 
                                        playbackRate={0.6} 
                                        isDark={isDark} 
                                        isCat={false}
                                        variant="banner-dog"
                                        onVideoTime={handleDogVideoTime}
                                        style={{
                                            width: '170%', height: '170%', objectFit: 'contain',
                                            position: 'absolute', bottom: '-7%', left: '50%', transform: 'translateX(-50%)',
                                            objectPosition: 'center',
                                            imageRendering: 'auto',
                                            filter: isDark 
                                                ? 'contrast(1.08) saturate(1.08) drop-shadow(0 18px 36px rgba(0, 0, 0, 0.55)) drop-shadow(0 4px 14px rgba(45, 212, 191, 0.24)) drop-shadow(0 0 8px rgba(34, 211, 238, 0.18))' 
                                                : 'contrast(1.05) saturate(1.05) drop-shadow(0 15px 30px rgba(0, 0, 0, 0.16)) drop-shadow(0 0 6px rgba(34, 211, 238, 0.12))'
                                        }} 
                                    />
                                </div>

                                {/* VIDEO MÈO VẪY TAY CHÀO */}
                                <div style={{
                                    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                    zIndex: 2, animation: 'crossFadeReverse 10s infinite'
                                }}>
                                    <TransparentVideo 
                                        src="/img/video_meo_chao.webm" 
                                        playbackRate={0.6} 
                                        isDark={isDark} 
                                        isCat={true}
                                        variant="banner-cat"
                                        onVideoTime={handleCatVideoTime}
                                        style={{
                                            width: '170%', height: '170%', objectFit: 'contain',
                                            position: 'absolute', bottom: '-3%', left: '50%', transform: 'translateX(-50%)',
                                            objectPosition: 'center',
                                            imageRendering: 'auto',
                                            filter: isDark 
                                                ? 'contrast(1.08) saturate(1.08) drop-shadow(0 18px 36px rgba(0, 0, 0, 0.55)) drop-shadow(0 4px 14px rgba(45, 212, 191, 0.24)) drop-shadow(0 0 8px rgba(34, 211, 238, 0.18))' 
                                                : 'contrast(1.05) saturate(1.05) drop-shadow(0 15px 30px rgba(0, 0, 0, 0.16)) drop-shadow(0 0 6px rgba(34, 211, 238, 0.12))'
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
