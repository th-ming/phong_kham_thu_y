import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { RevealSection } from "@components/SpecialEffects";
import axiosInstance from "@services/axios";
import { formatTienVND, generateSlug, getUserProfile, normalizeUserRole } from "@utils/index";
import { toast } from "@components/Toast";

const MOCK_SERVICES = [
    { id_dich_vu: 201, ten_dich_vu: "Khám Đa Khoa", icon: "stethoscope", gia: 150000, mo_ta: "Kiểm tra sức khỏe toàn diện, xét nghiệm máu, chẩn đoán hình ảnh. Phát hiện sớm vấn đề sức khỏe.", badge: "Phổ biến" },
    { id_dich_vu: 202, ten_dich_vu: "Tiêm Chủng", icon: "vaccines", gia: 200000, mo_ta: "Lịch tiêm chủng cá nhân hóa theo tuổi và lối sống. Vaccine nhập khẩu chính hãng từ Châu Âu." },
    { id_dich_vu: 203, ten_dich_vu: "Chẩn đoán hình ảnh", icon: "biotech", gia: 300000, mo_ta: "X-quang kỹ thuật số, siêu âm bụng, nội soi. Kết quả rõ nét trong thời gian ngắn." },
    { id_dich_vu: 204, ten_dich_vu: "Phẫu thuật", icon: "surgical", gia: 1500000, mo_ta: "Phòng mổ vô trùng đạt chuẩn quốc tế, gây mê an toàn, theo dõi sau phẫu thuật 24/7.", badge: "Mới" },
    { id_dich_vu: 205, ten_dich_vu: "Xét nghiệm máu & Sinh hóa", icon: "science", gia: 250000, mo_ta: "Xét nghiệm máu, nước tiểu, tầm soát bệnh lý nội tạng. Kết quả chính xác nhờ hệ thống máy hiện đại." },
    { id_dich_vu: 206, ten_dich_vu: "Spa & Grooming", icon: "spa", gia: 100000, mo_ta: "Tắm rửa, vệ sinh, cắt tỉa lông tạo kiểu chuyên nghiệp. Sử dụng sữa tắm cao cấp nhập khẩu." },
    { id_dich_vu: 207, ten_dich_vu: "Nha Khoa Thú Cưng", icon: "dentistry", gia: 180000, mo_ta: "Lấy cao răng siêu âm, nhổ răng sâu, điều trị viêm nướu giúp hơi thở thơm tho." }
];

const PhanDichVu: React.FC = () => {
    const navigate = useNavigate();
    const [services, setServices] = useState<any[]>(MOCK_SERVICES);
    const [activeIdx, setActiveIdx] = useState(0);
    const serviceListRef = useRef<HTMLDivElement>(null);
    const [mobileScrollState, setMobileScrollState] = useState({ top: 0, max: 1, view: 1, content: 1 });

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
        const fetchServices = async () => {
            try {
                // Ở trang chủ ta cũng có thể gọi /api/dich-vu/active luôn để tối ưu
                const response = await axiosInstance.get('/api/dich-vu/active');
                const data = response.data;
                if (data && data.length > 0) {
                    const filtered = data.filter((s: any) => s.trang_thai);
                    if (filtered.length > 0) {
                        setServices(filtered);
                        setActiveIdx(0);
                    }
                }
            } catch (error) {
                console.error("Dùng dữ liệu dự phòng cho Dịch vụ");
            }
        };
        
        fetchServices();

        // Smart Polling ngầm mỗi 10 giây
        const interval = setInterval(() => {
            fetchServices();
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    const updateServiceScrollState = () => {
        const el = serviceListRef.current;
        if (!el) return;
        setMobileScrollState({
            top: el.scrollTop,
            max: Math.max(el.scrollHeight - el.clientHeight, 1),
            view: Math.max(el.clientHeight, 1),
            content: Math.max(el.scrollHeight, 1)
        });
    };

    useEffect(() => {
        updateServiceScrollState();
        window.addEventListener("resize", updateServiceScrollState);
        return () => window.removeEventListener("resize", updateServiceScrollState);
    }, [services.length]);

    const getServiceInfo = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes("khám")) return { icon: "stethoscope", img: "/img/kham_da_khoa.png" };
        if (lower.includes("tiêm") || lower.includes("vắc")) return { icon: "vaccines", img: "/img/tiem_chung.png" };
        if (lower.includes("giun")) return { icon: "medication", img: "/img/tay_giun.png" };
        if (lower.includes("triệt sản") || lower.includes("triệt") || lower.includes("thiến")) return { icon: "medical_services", img: "/img/triet_san.png" };
        if (lower.includes("hình ảnh") || lower.includes("x-quang") || lower.includes("siêu âm")) return { icon: "biotech", img: "/img/chan_doan_hinh_anh.png" };
        if (lower.includes("phẫu thuật") || lower.includes("mổ")) return { icon: "surgical", img: "/img/phau_thuat.png" };
        if (lower.includes("nội trú") || lower.includes("lưu trú")) return { icon: "hotel", img: "/img/noi_tru.png" };
        if (lower.includes("răng") || lower.includes("nha khoa")) return { icon: "dentistry", img: "/img/nho_rang_nha_khoa.png" };
        if (lower.includes("spa") || lower.includes("tắm") || lower.includes("cắt tỉa") || lower.includes("grooming")) return { icon: "spa", img: "/img/spa_grooming.png" };
        if (lower.includes("xét nghiệm")) return { icon: "science", img: "/img/xet_nghiem_mau.png" };
        return { icon: "medical_services", img: "/img/avtpkty.png" };
    };

    const featured = services[activeIdx] || services[0];
    const featuredInfo = getServiceInfo(featured.ten_dich_vu);
    const scrollbarThumbHeight = Math.max(34, Math.min(96, (mobileScrollState.view / mobileScrollState.content) * 100));
    const scrollbarThumbTop = (mobileScrollState.top / mobileScrollState.max) * Math.max(0, 100 - scrollbarThumbHeight);

    return (
        <RevealSection>
            <section id="services" className="home-services-section" style={{ padding: "110px 0", background: "var(--background)", position: 'relative' }}>
                <style>{`
                    .service-tab {
                        transition: all 0.3s ease;
                        cursor: pointer;
                        border: 1.5px solid var(--gray-200);
                        border-radius: 20px;
                        padding: 16px 20px;
                        display: flex;
                        align-items: center;
                        gap: 14px;
                        background: var(--surface);
                    }
                    .service-tab:hover { border-color: var(--primary); background: var(--primary-light); transform: translateX(4px); }
                    .service-tab.active { border-color: var(--primary); background: var(--primary-light); box-shadow: var(--shadow-lg); transform: translateX(8px); }
                    .featured-service-card { transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1); }
                    .featured-service-image {
                        width: 100%;
                        border-radius: 24px;
                        object-fit: cover;
                        height: 170px;
                    }
                    .featured-service-footer {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-top: 24px;
                        gap: 16px;
                    }
                    .service-tab-thumb,
                    .mobile-service-detail {
                        display: none;
                    }
                    .service-list-shell {
                        position: relative;
                    }
                    .service-mobile-scrollbar {
                        display: none;
                        position: absolute;
                        top: 12px;
                        right: 4px;
                        bottom: 12px;
                        width: 4px;
                        border-radius: 999px;
                        background: rgba(148, 163, 184, 0.18);
                        pointer-events: none;
                        z-index: 3;
                    }
                    .service-mobile-scrollbar-thumb {
                        position: absolute;
                        left: 0;
                        right: 0;
                        border-radius: 999px;
                        background: linear-gradient(180deg, #22d3ee, #14b8a6);
                        box-shadow: 0 0 10px rgba(34, 211, 238, 0.45);
                        transition: top 0.08s linear;
                    }
                    @keyframes serviceCtaShine {
                        0% { opacity: 0; transform: translateX(-130%) skewX(-18deg); }
                        18%, 76% { opacity: 0.42; }
                        100% { opacity: 0; transform: translateX(170%) skewX(-18deg); }
                    }
                    @keyframes serviceIconBreath {
                        0%, 100% { transform: translateY(0) scale(1); box-shadow: 0 0 0 0 rgba(255,255,255,0.22); }
                        50% { transform: translateY(-3px) scale(1.04); box-shadow: 0 0 0 12px rgba(255,255,255,0); }
                    }
                    .service-booking-btn,
                    .service-detail-link {
                        position: relative;
                        overflow: hidden;
                        transition: transform 0.28s ease, box-shadow 0.28s ease, filter 0.28s ease;
                    }
                    .service-booking-btn::before,
                    .service-detail-link::before {
                        content: "";
                        position: absolute;
                        top: -45%;
                        bottom: -45%;
                        left: 0;
                        width: 42%;
                        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.42), transparent);
                        transform: translateX(-130%) skewX(-18deg);
                        animation: serviceCtaShine 5.2s linear infinite;
                    }
                    .service-booking-btn:hover,
                    .service-detail-link:hover {
                        transform: translateY(-3px);
                        filter: brightness(1.05);
                    }
                    .service-detail-link .detail-arrow {
                        transition: transform 0.24s ease;
                    }
                    .service-detail-link:hover .detail-arrow {
                        transform: translateX(5px);
                    }
                    .featured-service-icon {
                        animation: serviceIconBreath 2.6s ease-in-out infinite;
                    }
                    .service-tab:hover span:last-child,
                    .service-tab.active span:last-child {
                        transform: translateX(4px);
                    }
                    
                    /* Tùy chỉnh thanh cuộn siêu mượt và trong suốt cho danh sách dịch vụ */
                    .service-list-container {
                        max-height: 600px;
                        overflow-y: auto;
                        padding-right: 8px;
                        scroll-behavior: smooth;
                    }
                    .service-list-container::-webkit-scrollbar {
                        width: 6px;
                    }
                    .service-list-container::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .service-list-container::-webkit-scrollbar-thumb {
                        background: var(--gray-300);
                        border-radius: 10px;
                        transition: background 0.3s;
                    }
                    .service-list-container::-webkit-scrollbar-thumb:hover {
                        background: var(--primary);
                    }
                    @media (max-width: 900px) {
                        .service-layout { flex-direction: column !important; }
                        .service-tab { transform: none !important; }
                        .service-tab.active { transform: none !important; }
                        .service-list-container { max-height: none !important; overflow-y: visible !important; padding-right: 0 !important; }
                    }
                    @media (max-width: 768px) {
                        .home-services-section {
                            padding: 60px 0 !important;
                        }
                        .home-services-heading {
                            margin-bottom: 26px !important;
                            gap: 16px !important;
                        }
                        .home-services-heading > div {
                            width: 100%;
                        }
                        .home-services-heading h2 {
                            font-size: 2rem !important;
                            line-height: 1.12 !important;
                            margin-bottom: 10px !important;
                        }
                        .home-services-heading p {
                            font-size: 0.9rem !important;
                            line-height: 1.55 !important;
                        }
                        .service-booking-btn {
                            width: 100%;
                            justify-content: center;
                            padding: 13px 20px !important;
                        }
                        .featured-service-card {
                            display: block !important;
                            height: 190px !important;
                            min-height: 0 !important;
                            border-radius: 20px !important;
                            padding: 0 !important;
                            margin-bottom: 14px;
                            isolation: isolate;
                        }
                        .featured-service-card > div:first-of-type,
                        .featured-service-card > div:nth-of-type(2),
                        .featured-service-card > div[style*="position: absolute"][style*="top: 28px"] {
                            display: none !important;
                        }
                        .featured-service-content {
                            display: flex;
                            flex-direction: column;
                            justify-content: flex-end;
                            height: 100%;
                            padding: 18px !important;
                            position: relative;
                            z-index: 1;
                        }
                        .featured-service-content::before {
                            content: "";
                            position: absolute;
                            inset: 0;
                            z-index: -1;
                            background:
                                linear-gradient(90deg, rgba(2, 6, 23, 0.64) 0%, rgba(2, 6, 23, 0.34) 48%, rgba(2, 6, 23, 0.04) 100%),
                                linear-gradient(0deg, rgba(2, 6, 23, 0.54), rgba(2, 6, 23, 0.02) 58%);
                        }
                        [data-theme='dark'] .featured-service-content::before {
                            background:
                                linear-gradient(90deg, rgba(2, 6, 23, 0.88) 0%, rgba(2, 6, 23, 0.62) 48%, rgba(2, 6, 23, 0.2) 100%),
                                linear-gradient(0deg, rgba(2, 6, 23, 0.74), rgba(2, 6, 23, 0.08) 54%);
                        }
                        .featured-service-icon {
                            width: 44px !important;
                            height: 44px !important;
                            border-radius: 14px !important;
                            margin-bottom: 12px !important;
                            background: rgba(34, 211, 238, 0.2) !important;
                            border: 1px solid rgba(255,255,255,0.28) !important;
                            backdrop-filter: blur(8px);
                        }
                        .featured-service-icon span {
                            font-size: 24px !important;
                        }
                        .featured-service-card h3 {
                            max-width: 56%;
                            font-size: 1.28rem !important;
                            line-height: 1.15 !important;
                            margin: 0 0 7px !important;
                            text-shadow: 0 2px 12px rgba(2, 6, 23, 0.38);
                        }
                        .featured-service-card p {
                            display: -webkit-box !important;
                            max-width: 56%;
                            font-size: 0.78rem !important;
                            line-height: 1.35 !important;
                            margin: 0 0 12px !important;
                            opacity: 0.86 !important;
                            -webkit-line-clamp: 2 !important;
                            -webkit-box-orient: vertical;
                            overflow: hidden;
                            text-shadow: 0 2px 10px rgba(2, 6, 23, 0.34);
                        }
                        .featured-service-image {
                            position: absolute;
                            inset: 0;
                            z-index: -2;
                            width: 100% !important;
                            height: 100% !important;
                            min-height: 0;
                            border-radius: inherit !important;
                            object-fit: cover;
                        }
                        .featured-service-footer {
                            display: flex !important;
                            position: absolute !important;
                            left: 14px;
                            right: 14px;
                            bottom: 14px;
                            z-index: 2;
                            width: 100%;
                            width: auto;
                            align-items: flex-end !important;
                            justify-content: space-between !important;
                            margin-top: 0 !important;
                            gap: 12px;
                        }
                        .featured-service-footer > div:first-child {
                            display: none;
                        }
                        .service-detail-link {
                            margin-left: auto;
                            padding: 10px 14px !important;
                            border-radius: 999px !important;
                            font-size: 0.78rem !important;
                            background: rgba(255, 255, 255, 0.92) !important;
                            color: var(--primary) !important;
                            border: 1px solid rgba(255, 255, 255, 0.58);
                            box-shadow: 0 10px 26px rgba(2, 6, 23, 0.2) !important;
                            backdrop-filter: blur(10px);
                        }
                        [data-theme='dark'] .service-detail-link {
                            background: var(--tien-ich-gradient) !important;
                            color: white !important;
                            border-color: rgba(255,255,255,0.18);
                        }
                        .featured-service-card {
                            height: 176px !important;
                        }
                        .featured-service-content {
                            padding: 14px !important;
                        }
                        .featured-service-card h3,
                        .featured-service-card p {
                            max-width: 62%;
                        }
                        .featured-service-icon {
                            width: 38px !important;
                            height: 38px !important;
                            margin-bottom: 9px !important;
                        }
                        .featured-service-card h3 {
                            font-size: 1.12rem !important;
                        }
                        .service-list-container {
                            display: flex !important;
                            flex-direction: column !important;
                            gap: 0 !important;
                            max-height: 486px !important;
                            overflow-y: auto !important;
                            overflow-x: hidden !important;
                            padding: 0 10px 0 0 !important;
                            border-radius: 22px;
                            background: color-mix(in srgb, var(--surface) 82%, transparent);
                            border: 1px solid var(--gray-200);
                            box-shadow: 0 18px 42px rgba(15, 23, 42, 0.08);
                            scroll-behavior: smooth;
                            overscroll-behavior-y: auto;
                            -webkit-overflow-scrolling: touch;
                            scrollbar-width: thin;
                            scrollbar-color: rgba(34, 211, 238, 0.45) transparent;
                        }
                        .service-list-container::-webkit-scrollbar {
                            width: 4px;
                        }
                        .service-list-container::-webkit-scrollbar-track {
                            background: transparent;
                        }
                        .service-list-container::-webkit-scrollbar-thumb {
                            background: rgba(34, 211, 238, 0.45);
                            border-radius: 999px;
                        }
                        .service-tab {
                            position: relative;
                            min-height: 74px;
                            display: flex;
                            flex-direction: row;
                            align-items: center;
                            justify-content: flex-start;
                            border-radius: 0 !important;
                            border-width: 0 0 1px 0 !important;
                            border-color: var(--gray-200) !important;
                            padding: 12px 12px !important;
                            gap: 12px !important;
                            background: transparent !important;
                            box-shadow: none !important;
                        }
                        .service-tab:last-child {
                            border-bottom: 0 !important;
                        }
                        .service-tab-thumb {
                            display: none;
                            width: 46px;
                            height: 46px;
                            border-radius: 12px;
                            object-fit: cover;
                            background: var(--primary-light);
                        }
                        .service-tab:hover,
                        .service-tab.active {
                            transform: none !important;
                        }
                        .service-tab-icon {
                            position: static;
                            width: 42px !important;
                            height: 42px !important;
                            border-radius: 14px !important;
                            box-shadow: none;
                        }
                        .service-tab-icon span {
                            font-size: 22px !important;
                        }
                        .service-tab-copy {
                            width: auto;
                            flex: 1;
                            padding-top: 0;
                        }
                        .service-tab-title {
                            font-size: 0.88rem !important;
                            line-height: 1.25 !important;
                            margin-bottom: 3px !important;
                            display: -webkit-box;
                            -webkit-line-clamp: 2;
                            -webkit-box-orient: vertical;
                            overflow: hidden;
                        }
                        .service-tab-price {
                            font-size: 0.72rem !important;
                        }
                        .service-tab-badge {
                            position: static;
                            padding: 3px 7px !important;
                            font-size: 0.62rem !important;
                            margin-top: 3px;
                            width: fit-content;
                        }
                        .service-tab-chevron {
                            display: none !important;
                        }
                        .mobile-service-detail {
                            display: flex;
                            width: auto;
                            min-width: 76px;
                            height: 34px;
                            min-height: 34px;
                            align-items: center;
                            justify-content: center;
                            gap: 4px;
                            padding: 0 10px;
                            border-radius: 999px;
                            background: var(--primary-light);
                            color: var(--primary);
                            text-decoration: none;
                            font-size: 0.68rem;
                            font-weight: 850;
                            white-space: nowrap;
                        }
                        .mobile-service-detail span {
                            font-size: 17px;
                        }
                    }
                `}</style>
                <div className="container">
                    {/* tiêu đề dịch vụ */}
                    <div className="home-services-heading" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '56px', flexWrap: 'wrap', gap: '20px' }}>
                        <div>
                            <div className="section-label" style={{ marginBottom: '16px' }}>✦ Dịch vụ Thú y</div>
                            <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 950, color: "var(--ink)", marginBottom: '12px', letterSpacing: '-1px' }}>Chăm Sóc <span style={{ color: "var(--primary)" }}>Toàn Diện</span></h2>
                            <p style={{ color: "var(--gray-500)", fontWeight: 500, fontSize: '1rem', maxWidth: '480px', lineHeight: 1.6 }}>Đầy đủ dịch vụ thú y từ khám tổng quát đến phẫu thuật phức tạp.</p>
                        </div>
                                        <a data-ai-id="link_home_service_booking" href="#" onClick={handleBookingClick} className="btn service-booking-btn" style={{ padding: '14px 28px', borderRadius: '50px', background: 'var(--primary)', color: 'white', textDecoration: 'none', fontWeight: 800, fontSize: '0.9rem', boxShadow: '0 8px 20px var(--primary-light)', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center' }}><span style={{ position: 'relative', zIndex: 1 }}>Đặt lịch ngay →</span></a>
                    </div>

                    {/* bố cục dịch vụ */}
                    <div className="service-layout-grid">

                        {/* cột thẻ dịch vụ nổi bật */}
                        <div className="featured-service-card premium-fluid-gradient" style={{ height: '600px', borderRadius: '32px', padding: '48px', color: 'white', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 30px 80px var(--primary-light)' }}>
                            {/* nền trang trí */}
                            <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '280px', height: '280px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
                            <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

                            {featured.badge && (
                                <div style={{ position: 'absolute', top: '28px', right: '28px', background: featured.badge === 'Mới' ? '#3b82f6' : '#f59e0b', color: 'white', padding: '6px 16px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 900 }}>★ {featured.badge}</div>
                            )}

                            <div className="featured-service-content">
                                <div className="featured-service-icon" style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.15)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '28px', backdropFilter: 'blur(8px)' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'white' }}>{featuredInfo.icon}</span>
                                </div>
                                <h3 style={{ fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)', fontWeight: 950, marginBottom: '16px', lineHeight: 1.2, letterSpacing: '-0.5px' }}>{featured.ten_dich_vu}</h3>
                                <p style={{ fontSize: '1rem', lineHeight: 1.7, opacity: 0.85, fontWeight: 400, marginBottom: '28px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' }}>{featured.mo_ta || featured.desc}</p>
                                <img src={featuredInfo.img} alt={featured.ten_dich_vu} className="featured-service-image" />
                            </div>

                            <div className="featured-service-footer">
                                <div>
                                    <div style={{ fontSize: '0.65rem', opacity: 0.7, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Chi phí từ</div>
                                    <div className="featured-service-price" style={{ fontSize: '1.6rem', fontWeight: 950 }}>{featured.gia ? formatTienVND(featured.gia) : featured.price}</div>
                                </div>
                                <Link to={`/dich-vu/${generateSlug(featured.ten_dich_vu)}`} className="service-detail-link" style={{ background: 'var(--tien-ich-gradient)', color: 'white', padding: '14px 28px', borderRadius: '50px', fontWeight: 900, textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 8px 20px var(--primary-light)' }}>
                                    <span style={{ position: 'relative', zIndex: 1 }}>Chi tiết</span> <span className="material-symbols-outlined detail-arrow" style={{ fontSize: '18px', position: 'relative', zIndex: 1 }}>arrow_forward</span>
                                </Link>
                            </div>
                        </div>

                        {/* cột danh sách dịch vụ cuộn slider cao cấp */}
                        <div className="service-list-shell">
                        <div
                            ref={serviceListRef}
                            className="service-list-container"
                            onScroll={updateServiceScrollState}
                            style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}
                        >
                            {services.map((s, i) => {
                                const info = getServiceInfo(s.ten_dich_vu);
                                const serviceUrl = `/dich-vu/${generateSlug(s.ten_dich_vu)}`;
                                return (
                                <div key={i} className={`service-tab ${activeIdx === i ? 'active' : ''}`} onClick={() => setActiveIdx(i)} onDoubleClick={() => navigate(serviceUrl)}>
                                    <img className="service-tab-thumb" src={info.img} alt={s.ten_dich_vu} loading="lazy" />
                                    <div className="service-tab-icon" style={{ width: '50px', height: '50px', background: activeIdx === i ? 'var(--primary)' : 'var(--primary-light)', color: activeIdx === i ? 'white' : 'var(--primary)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.3s' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>{s.icon || info.icon}</span>
                                    </div>
                                    <div className="service-tab-copy" style={{ flex: 1, minWidth: 0 }}>
                                        <div className="service-tab-title" style={{ fontWeight: 800, color: activeIdx === i ? 'var(--primary)' : 'var(--ink)', fontSize: '0.95rem', marginBottom: '3px' }}>{s.ten_dich_vu}</div>
                                        <div className="service-tab-price" style={{ color: 'var(--gray-400)', fontSize: '0.78rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.gia ? formatTienVND(s.gia) : s.price}</div>
                                    </div>
                                    {s.badge && <div className="service-tab-badge" style={{ background: s.badge === 'Mới' ? 'rgba(14, 165, 233, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: s.badge === 'Mới' ? '#0ea5e9' : '#f59e0b', padding: '3px 10px', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 900, flexShrink: 0 }}>{s.badge}</div>}
                                    <Link
                                        to={serviceUrl}
                                        className="mobile-service-detail"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        Chi tiết <span className="material-symbols-outlined">arrow_forward</span>
                                    </Link>
                                    <span 
                                        className="material-symbols-outlined service-tab-chevron" 
                                        onClick={(e) => { e.stopPropagation(); navigate(serviceUrl); }}
                                        style={{ fontSize: '18px', color: activeIdx === i ? 'var(--primary)' : '#cbd5e1', transition: 'all 0.3s', cursor: 'pointer' }}
                                    >chevron_right</span>
                                </div>
                                );
                            })}
                        </div>
                        <div className="service-mobile-scrollbar" aria-hidden="true">
                            <div
                                className="service-mobile-scrollbar-thumb"
                                style={{
                                    height: `${scrollbarThumbHeight}%`,
                                    top: `${scrollbarThumbTop}%`
                                }}
                            />
                        </div>
                        </div>
                    </div>
                </div>
            </section>
        </RevealSection>
    );
};

export default React.memo(PhanDichVu);
