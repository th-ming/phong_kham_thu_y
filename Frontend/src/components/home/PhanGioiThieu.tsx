import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RevealSection, LottiePlayer, Typewriter, TransparentVideo } from "@components/SpecialEffects";
import { useCountUp } from "@hooks/useCountUp";
import { useTheme } from "../../contexts/ThemeContextV2";
import { getUserProfile, normalizeUserRole } from "@utils/index";
import { toast } from "@components/Toast";
import { useLiveUserProfile } from "@hooks/useLiveUserProfile";

type BannerTextStyle = {
    top: string;
    left: string;
    fontSize: string;
};

const getBannerPetFilter = (isDark: boolean): string => isDark
    ? 'brightness(1.02) contrast(1.05) drop-shadow(0 10px 18px rgba(0, 0, 0, 0.26))'
    : 'contrast(1.04) drop-shadow(0 12px 20px rgba(0, 0, 0, 0.11))';

const BANNER_PET_SWAP_DURATION = '10s';

const bannerPetVideoStyle: React.CSSProperties = {
    width: '168%',
    height: '168%',
    objectFit: 'contain',
    position: 'relative',
    bottom: '-5%',
    objectPosition: 'center',
};

const bannerTextStyles: Record<string, BannerTextStyle> = {
    "Hello bạn! 🐶": { top: "-2.7%", left: "39%", fontSize: "clamp(2.35rem, 3.45vw, 3.8rem)" },
    "Gâu gâu! Xin chào!": { top: "-2.5%", left: "39%", fontSize: "clamp(2.2rem, 3.18vw, 3.52rem)" },
    "Chào mừng đến với Rexi! ✨": { top: "-2.3%", left: "39%", fontSize: "clamp(1.95rem, 2.72vw, 3.12rem)" },
    "Rất vui được gặp bạn! 💓": { top: "-2.3%", left: "39%", fontSize: "clamp(2rem, 2.86vw, 3.2rem)" },
    "Meow meow~ 😽": { top: "-2.7%", left: "39%", fontSize: "clamp(2.3rem, 3.35vw, 3.68rem)" },
    "Xin chào con sen! 🐾": { top: "-2.4%", left: "39%", fontSize: "clamp(2.05rem, 2.98vw, 3.3rem)" },
    "Meow! Rexi Vet xin chào!": { top: "-2.1%", left: "39%", fontSize: "clamp(1.92rem, 2.68vw, 3.05rem)" }
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
    const liveUser = useLiveUserProfile();
    const profileUser = liveUser || getUserProfile();
    const profileBirthYear = Number(profileUser?.nam_sinh || 0);
    const isCustomer = normalizeUserRole(profileUser) === "khach_hang";
    const isGenZCustomer = isCustomer && profileBirthYear >= 1997;
    const isMatureCustomer = isCustomer && profileBirthYear >= 1900 && profileBirthYear < 1997;

    const dogTextSet = useMemo(() => isGenZCustomer
        ? ["Hi sen! 🐶", "Gâu gâu boss khỏe chứ?", "Rexi chào sen nè! ✨", "Vui gặp sen ghê! 💓"]
        : isMatureCustomer
            ? ["Rexi kính chào anh/chị! 🐶", "Chúc thú cưng luôn khỏe mạnh", "Chào mừng anh/chị đến Rexi! ✨", "Rất hân hạnh được hỗ trợ! 💓"]
            : ["Hello bạn! 🐶", "Gâu gâu! Xin chào!", "Chào mừng đến với Rexi! ✨", "Rất vui được gặp bạn! 💓"], [isGenZCustomer, isMatureCustomer]);

    const catTextSet = useMemo(() => isGenZCustomer
        ? ["Meow sen ơi~ 😽", "Xin chào con sen! 🐾", "Boss cần Rexi là có liền!", "Meow sen ơi~ 😽"]
        : isMatureCustomer
            ? ["Rexi mèo kính chào! 😽", "Chào anh/chị và thú cưng! 🐾", "Rexi Vet sẵn sàng hỗ trợ!", "Rexi mèo kính chào! 😽"]
            : ["Meow meow~ 😽", "Xin chào bạn! 🐾", "Meow! Rexi Vet xin chào!", "Meow meow~ 😽"], [isGenZCustomer, isMatureCustomer]);

    const getDogBannerText = useCallback((currentTime: number, duration: number) => {
        const phase = duration > 0 ? currentTime / duration : (currentTime % 6) / 6;
        if (phase < 0.20) return dogTextSet[0];
        if (phase < 0.44) return dogTextSet[1];
        if (phase < 0.76) return dogTextSet[2];
        return dogTextSet[3];
    }, [dogTextSet]);

    const getCatBannerText = useCallback((currentTime: number, duration: number) => {
        const phase = duration > 0 ? currentTime / duration : (currentTime % 6) / 6;
        if (phase < 0.34) return catTextSet[0];
        if (phase < 0.59) return catTextSet[1];
        if (phase < 0.92) return catTextSet[2];
        return catTextSet[3];
    }, [catTextSet]);

    const handleDogVideoTime = useCallback((currentTime: number, duration: number) => {
        const nextText = getDogBannerText(currentTime, duration);
        setDogBannerText((current) => current === nextText ? current : nextText);
    }, [getDogBannerText]);

    const handleCatVideoTime = useCallback((currentTime: number, duration: number) => {
        const nextText = getCatBannerText(currentTime, duration);
        setCatBannerText((current) => current === nextText ? current : nextText);
    }, [getCatBannerText]);

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
        setDogBannerText(dogTextSet[0]);
        setCatBannerText(catTextSet[0]);
    }, [dogTextSet, catTextSet]);

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
                    .banner-pet-stage {
                        position: relative;
                        width: 100%;
                        height: 100%;
                        overflow: visible;
                        isolation: isolate;
                    }
                    /* 10s = 1 vòng video @ playbackRate 0.6 — 0% và 100% khớp nhau, không khựng loop */
                    @keyframes bannerPetDog {
                        0%, 41% { opacity: 1; }
                        49%, 91% { opacity: 0; }
                        100% { opacity: 1; }
                    }
                    @keyframes bannerPetCat {
                        0%, 41% { opacity: 0; }
                        49%, 91% { opacity: 1; }
                        100% { opacity: 0; }
                    }
                    @keyframes bannerPetTextDog {
                        0%, 41% { opacity: 1; transform: translateX(-50%); }
                        49%, 91% { opacity: 0; transform: translateX(-50%); }
                        100% { opacity: 1; transform: translateX(-50%); }
                    }
                    @keyframes bannerPetTextCat {
                        0%, 41% { opacity: 0; transform: translateX(-50%); }
                        49%, 91% { opacity: 1; transform: translateX(-50%); }
                        100% { opacity: 0; transform: translateX(-50%); }
                    }
                    .banner-pet-layer {
                        position: absolute;
                        inset: 0;
                        display: flex;
                        align-items: flex-end;
                        justify-content: center;
                        pointer-events: none;
                        will-change: opacity;
                        backface-visibility: hidden;
                        -webkit-backface-visibility: hidden;
                    }
                    .banner-pet-layer--dog {
                        z-index: 2;
                        animation: bannerPetDog ${BANNER_PET_SWAP_DURATION} cubic-bezier(0.42, 0, 0.58, 1) infinite;
                    }
                    .banner-pet-layer--cat {
                        z-index: 1;
                        animation: bannerPetCat ${BANNER_PET_SWAP_DURATION} cubic-bezier(0.42, 0, 0.58, 1) infinite;
                    }
                    .banner-sync-text-slot {
                        position: absolute;
                        top: var(--banner-text-top);
                        left: var(--banner-text-left);
                        z-index: 8;
                        pointer-events: none;
                        white-space: nowrap;
                        will-change: opacity;
                        backface-visibility: hidden;
                        -webkit-backface-visibility: hidden;
                    }
                    .banner-sync-text-slot--dog {
                        animation: bannerPetTextDog ${BANNER_PET_SWAP_DURATION} cubic-bezier(0.42, 0, 0.58, 1) infinite;
                    }
                    .banner-sync-text-slot--cat {
                        animation: bannerPetTextCat ${BANNER_PET_SWAP_DURATION} cubic-bezier(0.42, 0, 0.58, 1) infinite;
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
                    .mobile-speech-bubble {
                        display: none;
                    }
                    .mobile-speech-bubble--dog,
                    .mobile-speech-bubble--cat {
                        display: none;
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
                    
                    /* BASE STYLES FOR FLOATING GLASS CARD (DESKTOP) */
                    .floating-glass-card {
                        position: absolute !important;
                        bottom: 20px !important;
                        left: 10px !important;
                        background: var(--glass) !important;
                        backdrop-filter: var(--glass-blur) !important;
                        -webkit-backdrop-filter: var(--glass-blur) !important;
                        padding: 14px 20px !important;
                        border-radius: 22px !important;
                        display: flex !important;
                        align-items: center !important;
                        gap: 14px !important;
                        z-index: 10 !important;
                        box-shadow: var(--shadow-xl) !important;
                        border: 1px solid var(--glass-border) !important;
                        white-space: nowrap !important;
                        width: auto !important;
                    }
                    .floating-glass-card .floating-badge-icon-box {
                        background: linear-gradient(135deg, var(--rose-500), var(--rose-400)) !important;
                        width: 44px !important;
                        height: 44px !important;
                        border-radius: 14px !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        flex-shrink: 0 !important;
                        box-shadow: 0 8px 15px var(--rose-shadow) !important;
                    }
                    .floating-glass-card .glow-text-title {
                        font-weight: 950 !important;
                        color: var(--ink) !important;
                        font-size: 1.15rem !important;
                        line-height: 1.2 !important;
                        white-space: nowrap !important;
                    }
                    .floating-glass-card .glow-text-sub {
                        color: var(--ink) !important;
                        opacity: 0.9 !important;
                        font-size: 0.85rem !important;
                        font-weight: 800 !important;
                        white-space: nowrap !important;
                    }
                    
                    /* TỐI ƯU GIAO DIỆN DI ĐỘNG PREMIUM (MOBILE RESPONSIVE REDESIGN) */
                    @media screen and (max-width: 768px) {
                        .hero-section {
                            padding: 0 !important;
                            min-height: calc(100svh - 160px) !important;
                            background: var(--background) !important;
                        }
                        .hero-section > .container {
                            max-width: none !important;
                            width: 100% !important;
                            padding-left: 0 !important;
                            padding-right: 0 !important;
                        }
                        .hero-bg-layer {
                            display: block !important;
                            background-position: center center !important;
                            opacity: 1 !important;
                        }
                        .hero-overlay-layer {
                            background: ${isDark
                                ? 'linear-gradient(180deg, rgba(2, 6, 23, 0.62), rgba(2, 6, 23, 0.86))'
                                : 'linear-gradient(180deg, rgba(255,255,255,0.22), rgba(15, 23, 42, 0.30), rgba(8, 47, 73, 0.56))'} !important;
                        }
                        .floating-bg {
                            display: block !important;
                            opacity: 0.14 !important;
                        }
                        .floating-paw-1,
                        .floating-paw-2 {
                            display: inline-block !important;
                            opacity: 0.22 !important;
                        }
                        .hero-layout-grid {
                            display: block !important;
                            position: relative !important;
                            min-height: calc(100svh - 160px) !important;
                            height: calc(100svh - 160px) !important;
                            max-height: 720px !important;
                            border-radius: 0 !important;
                            overflow: hidden !important;
                            text-align: left !important;
                            padding: 0 !important;
                            background:
                                linear-gradient(180deg, rgba(255, 255, 255, 0.04) 0%, rgba(8, 47, 73, 0.08) 42%, rgba(8, 47, 73, 0.58) 100%) !important;
                        }
                        [data-theme='dark'] .hero-layout-grid {
                            background:
                                linear-gradient(180deg, rgba(2, 6, 23, 0.05) 0%, rgba(2, 6, 23, 0.18) 42%, rgba(2, 6, 23, 0.92) 100%) !important;
                        }
                        .hero-layout-grid::before {
                            display: none !important;
                        }
                        [data-theme='light'] .hero-layout-grid::before {
                            display: none !important;
                        }
                        .hero-layout-grid .hero-content {
                            position: relative !important;
                            z-index: 5 !important;
                            width: 100% !important;
                            min-height: 100% !important;
                            height: 100% !important;
                            display: flex !important;
                            flex-direction: column !important;
                            justify-content: flex-end !important;
                            padding: min(55vh, 360px) 20px 18px !important;
                            color: #fff !important;
                        }
                        .hero-layout-grid .hero-image-container {
                            position: absolute !important;
                            inset: 0 0 auto 0 !important;
                            z-index: 2 !important;
                            width: 100% !important;
                            height: 50vh !important;
                            min-height: 285px !important;
                            margin: 0 !important;
                            pointer-events: none !important;
                            --mobile-speech-top: clamp(42px, 10vh, 64px);
                            --mobile-speech-dog-x: 55%;
                            --mobile-speech-cat-x: 54%;
                        }
                        .hero-title {
                            font-size: clamp(2.2rem, 10.5vw, 3.35rem) !important;
                            line-height: 1.02 !important;
                            margin-bottom: 10px !important;
                            letter-spacing: 0 !important;
                            word-break: keep-all !important;
                            color: #fff !important;
                            text-shadow: 0 4px 22px rgba(0, 0, 0, 0.56) !important;
                            font-family: Inter, system-ui, sans-serif !important;
                            max-width: 11em !important;
                        }
                        .hero-glow-text {
                            color: #fff !important;
                            text-shadow: none !important;
                            animation: none !important;
                        }
                        .hero-typewriter-desktop {
                            display: inline !important;
                        }
                        .hero-typewriter-mobile {
                            display: none !important;
                        }
                        .mission-text {
                            font-size: 0.86rem !important;
                            line-height: 1.45 !important;
                            margin-bottom: 14px !important;
                            padding-left: 0 !important;
                            border-left: 0 !important;
                            color: rgba(255, 255, 255, 0.9) !important;
                            font-family: Inter, system-ui, sans-serif !important;
                            font-style: normal !important;
                            max-width: 100% !important;
                        }
                        .mission-text span {
                            display: none !important;
                        }
                        .hero-cta-grid {
                            display: grid !important;
                            grid-template-columns: 1.05fr 0.95fr !important;
                            width: 100% !important;
                            gap: 10px !important;
                            margin-top: 0 !important;
                        }
                        .hero-cta-grid a {
                            width: 100% !important;
                            flex: none !important;
                            text-align: center !important;
                            padding: 13px 10px !important;
                            font-size: 0.72rem !important;
                            border-radius: 10px !important;
                            min-width: unset !important;
                            white-space: nowrap !important;
                        }
                        .hero-secondary-cta {
                            background: rgba(15, 23, 42, 0.52) !important;
                            border-color: rgba(255, 255, 255, 0.26) !important;
                            color: #fff !important;
                        }
                        [data-theme='light'] .hero-secondary-cta {
                            background: rgba(255, 255, 255, 0.18) !important;
                            border-color: rgba(255, 255, 255, 0.34) !important;
                        }
                        .hero-stat-pill-container {
                            display: grid !important;
                            grid-template-columns: repeat(3, 1fr) !important;
                            width: 100% !important;
                            gap: 6px !important;
                            margin-top: 12px !important;
                        }
                        .hero-stat-pill {
                            padding: 8px 6px !important;
                            border-radius: 9px !important;
                            width: 100% !important;
                            min-width: unset !important;
                            gap: 5px !important;
                            align-items: center !important;
                            background: rgba(255, 255, 255, 0.9) !important;
                            border: 0 !important;
                            backdrop-filter: blur(8px) !important;
                        }
                        [data-theme='dark'] .hero-stat-pill {
                            background: rgba(15, 23, 42, 0.72) !important;
                            border: 1px solid rgba(125, 211, 252, 0.16) !important;
                            box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06) !important;
                        }
                        .hero-stat-pill div div:first-child {
                            font-size: 0.46rem !important;
                            color: #64748b !important;
                        }
                        [data-theme='dark'] .hero-stat-pill div div:first-child {
                            color: rgba(203, 213, 225, 0.72) !important;
                        }
                        .hero-stat-pill div div:last-child {
                            font-size: 0.68rem !important;
                            line-height: 1.05 !important;
                            color: #0f172a !important;
                        }
                        [data-theme='dark'] .hero-stat-pill div div:last-child {
                            color: #f8fafc !important;
                        }
                        .hero-stat-pill span {
                            font-size: 15px !important;
                        }
                        .hero-stat-pill div:first-child {
                            width: 28px !important;
                            height: 28px !important;
                            border-radius: 7px !important;
                        }
                        
                        /* Khung video/ảnh động bo tròn sang trọng trên mobile */
                        .banner-pet-stage {
                            background: transparent !important;
                            border: 0 !important;
                            border-radius: 0 !important;
                            height: 100% !important;
                            overflow: visible !important;
                            box-shadow: none !important;
                        }
                        [data-theme='dark'] .banner-pet-stage {
                            background: rgba(15, 23, 42, 0.4) !important;
                            border-color: rgba(34, 211, 238, 0.15) !important;
                        }
                        .banner-pet-video {
                            width: 114% !important;
                            height: 114% !important;
                            object-fit: contain !important;
                            bottom: 10% !important;
                            filter: drop-shadow(0 24px 30px rgba(0, 0, 0, 0.32)) !important;
                        }
                        @media screen and (min-width: 520px) and (max-width: 768px) {
                            .hero-layout-grid .hero-image-container {
                                height: 54vh !important;
                                min-height: 360px !important;
                            }
                            .hero-layout-grid .hero-content {
                                padding-top: min(58vh, 430px) !important;
                            }
                            .banner-pet-video {
                                width: 138% !important;
                                height: 138% !important;
                                bottom: 0 !important;
                            }
                        }
                        [data-theme='dark'] .banner-pet-video {
                            filter: drop-shadow(0 24px 30px rgba(0, 0, 0, 0.42)) !important;
                        }
                        .banner-pet-layer--dog {
                            animation: bannerPetDog ${BANNER_PET_SWAP_DURATION} cubic-bezier(0.42, 0, 0.58, 1) infinite !important;
                        }
                        .banner-pet-layer--cat {
                            display: flex !important;
                            animation: bannerPetCat ${BANNER_PET_SWAP_DURATION} cubic-bezier(0.42, 0, 0.58, 1) infinite !important;
                        }
                        .banner-sync-text-slot--cat,
                        .banner-sync-text-slot--dog {
                            display: none !important;
                        }
                        .banner-sync-text {
                            display: none !important;
                        }
                        .mobile-speech-bubble {
                            position: absolute !important;
                            top: var(--mobile-speech-top) !important;
                            left: var(--mobile-speech-x, 54%) !important;
                            transform: translateX(-50%) !important;
                            z-index: 9 !important;
                            display: block !important;
                            max-width: min(78vw, 250px) !important;
                            min-width: 0 !important;
                            padding: 9px 15px !important;
                            border-radius: 999px !important;
                            background: rgba(255, 255, 255, 0.9) !important;
                            border: 1px solid rgba(255, 255, 255, 0.38) !important;
                            color: #0f766e !important;
                            opacity: 1 !important;
                            font-family: Inter, system-ui, sans-serif !important;
                            font-size: 0.95rem !important;
                            font-style: normal !important;
                            font-weight: 900 !important;
                            line-height: 1.15 !important;
                            overflow: visible !important;
                            text-overflow: clip !important;
                            white-space: nowrap !important;
                            text-align: center !important;
                            text-shadow: none !important;
                            box-shadow: 0 12px 26px rgba(2, 6, 23, 0.14), 0 0 22px rgba(45, 212, 191, 0.22) !important;
                            filter: none !important;
                        }
                        .mobile-speech-bubble::after {
                            content: "";
                            position: absolute;
                            left: var(--mobile-speech-tail-x, 50%);
                            bottom: -7px;
                            width: 13px;
                            height: 13px;
                            background: inherit;
                            border-right: inherit;
                            border-bottom: inherit;
                            transform: translateX(-50%) rotate(45deg);
                            box-shadow: 7px 7px 12px rgba(2, 6, 23, 0.08);
                        }
                        .mobile-speech-bubble--dog {
                            --mobile-speech-x: var(--mobile-speech-dog-x);
                            --mobile-speech-tail-x: 52%;
                        }
                        .mobile-speech-bubble--cat {
                            --mobile-speech-x: var(--mobile-speech-cat-x);
                            --mobile-speech-tail-x: 49%;
                            max-width: min(64vw, 205px) !important;
                            padding: 7px 12px !important;
                            font-size: 0.82rem !important;
                            line-height: 1.12 !important;
                        }
                        [data-theme='dark'] .mobile-speech-bubble {
                            background: rgba(2, 6, 23, 0.82) !important;
                            border-color: rgba(34, 211, 238, 0.34) !important;
                            color: #e0f2fe !important;
                            font-size: 1rem !important;
                            box-shadow: 0 14px 30px rgba(0, 0, 0, 0.42), 0 0 24px rgba(34, 211, 238, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.08) !important;
                        }
                        @media screen and (max-width: 390px) {
                            .hero-layout-grid .hero-image-container {
                                --mobile-speech-top: clamp(38px, 8vh, 54px);
                                --mobile-speech-dog-x: 57%;
                                --mobile-speech-cat-x: 56%;
                            }
                            .mobile-speech-bubble {
                                max-width: 74vw !important;
                                padding: 8px 13px !important;
                                font-size: 0.86rem !important;
                            }
                            .mobile-speech-bubble--cat {
                                max-width: 60vw !important;
                                padding: 7px 11px !important;
                                font-size: 0.78rem !important;
                            }
                        }
                        
                        /* Badge cấp cứu lơ lửng trên mobile */
                        .floating-glass-card {
                            display: none !important;
                        }
                        .floating-glass-card .glow-text-title {
                            font-size: 0.8rem !important;
                            white-space: nowrap !important;
                        }
                        .floating-glass-card .glow-text-sub {
                            font-size: 0.65rem !important;
                            opacity: 0.82 !important;
                            white-space: nowrap !important;
                        }
                        .floating-glass-card div:first-child {
                            width: 26px !important;
                            height: 26px !important;
                            border-radius: 6px !important;
                        }
                        .floating-glass-card span {
                            font-size: 14px !important;
                        }
                        .section-label {
                            display: none !important;
                        }
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
                                Cho <span className="hero-typewriter-desktop"><Typewriter words={["Thú Cưng", "Chó Cưng", "Mèo Cưng", "Người Bạn Nhỏ"]} /></span><span className="hero-typewriter-mobile" style={{ display: 'none' }}>Thú Cưng</span>
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
                            <div className="glass-card floating-glass-card">
                                <div className="floating-badge-icon-box">
                                    <span className="material-symbols-outlined" style={{ color: 'var(--white)', fontSize: '24px' }}>volunteer_activism</span>
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <div className="glow-text-title">Tận Tâm 24/7</div>
                                    <div className="glow-text-sub">Cấp cứu kịp thời</div>
                                </div>
                            </div>

                             {/* Khu vực trình diễn chó mèo động */}
                            <div className="banner-pet-stage">
                                <div
                                    className="banner-sync-text-slot banner-sync-text-slot--dog banner-sync-text"
                                    style={getBannerTextStyle(dogBannerText)}
                                >
                                    {dogBannerText}
                                </div>
                                <div
                                    className="banner-sync-text-slot banner-sync-text-slot--cat banner-sync-text"
                                    style={getBannerTextStyle(catBannerText)}
                                >
                                    {catBannerText}
                                </div>

                                <div className="banner-pet-layer banner-pet-layer--dog">
                                    <div className="mobile-speech-bubble mobile-speech-bubble--dog">{dogBannerText}</div>
                                    <TransparentVideo 
                                        src="/img/video_cho_chao.webm" 
                                        playbackRate={0.6} 
                                        isDark={isDark} 
                                        isCat={false}
                                        variant="banner-dog"
                                        className="banner-pet-video"
                                        onVideoTime={handleDogVideoTime}
                                        style={{
                                            ...bannerPetVideoStyle,
                                            filter: getBannerPetFilter(isDark)
                                        }} 
                                    />
                                </div>

                                <div className="banner-pet-layer banner-pet-layer--cat">
                                    <div className="mobile-speech-bubble mobile-speech-bubble--cat">{catBannerText}</div>
                                    <TransparentVideo 
                                        src="/img/video_meo_chao.webm" 
                                        playbackRate={0.6} 
                                        isDark={isDark} 
                                        isCat={true}
                                        variant="banner-cat"
                                        className="banner-pet-video"
                                        onVideoTime={handleCatVideoTime}
                                        style={{
                                            ...bannerPetVideoStyle,
                                            filter: getBannerPetFilter(isDark)
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
