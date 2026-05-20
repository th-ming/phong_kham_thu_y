import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { RevealSection } from "@components/SpecialEffects";
import axiosInstance from "@services/axios";
import { formatTienVND, generateSlug, getUserProfile } from "@utils/index";
import { toast } from "@components/Toast";

const MOCK_SERVICES = [
    { id_dich_vu: 201, ten_dich_vu: "Khám Đa Khoa", icon: "stethoscope", gia: 150000, mo_ta: "Kiểm tra sức khỏe toàn diện, xét nghiệm máu, chẩn đoán hình ảnh. Phát hiện sớm vấn đề sức khỏe.", badge: "Phổ biến" },
    { id_dich_vu: 202, ten_dich_vu: "Tiêm Chủng", icon: "vaccines", gia: 200000, mo_ta: "Lịch tiêm chủng cá nhân hóa theo tuổi và lối sống. Vaccine nhập khẩu chính hãng từ Châu Âu." },
    { id_dich_vu: 203, ten_dich_vu: "Chẩn đoán hình ảnh", icon: "biotech", gia: 300000, mo_ta: "X-quang kỹ thuật số, siêu âm bụng, nội soi. Kết quả rõ nét trong thời gian ngắn.", badge: "Mới" },
    { id_dich_vu: 204, ten_dich_vu: "Phẫu thuật", icon: "surgical", gia: 1500000, mo_ta: "Phòng mổ vô trùng đạt chuẩn quốc tế, gây mê an toàn, theo dõi sau phẫu thuật 24/7." },
    { id_dich_vu: 205, ten_dich_vu: "Xét nghiệm máu & Sinh hóa", icon: "science", gia: 250000, mo_ta: "Xét nghiệm máu, nước tiểu, tầm soát bệnh lý nội tạng. Kết quả chính xác nhờ hệ thống máy hiện đại." },
    { id_dich_vu: 206, ten_dich_vu: "Spa & Grooming", icon: "spa", gia: 100000, mo_ta: "Tắm rửa, vệ sinh, cắt tỉa lông tạo kiểu chuyên nghiệp. Sử dụng sữa tắm cao cấp nhập khẩu." },
    { id_dich_vu: 207, ten_dich_vu: "Nha Khoa Thú Cưng", icon: "dentistry", gia: 180000, mo_ta: "Lấy cao răng siêu âm, nhổ răng sâu, điều trị viêm nướu giúp hơi thở thơm tho." }
];

const PhanDichVu: React.FC = () => {
    const navigate = useNavigate();
    const [services, setServices] = useState<any[]>(MOCK_SERVICES);
    const [activeIdx, setActiveIdx] = useState(0);

    const handleBookingClick = (e: React.MouseEvent) => {
        e.preventDefault();
        const user = getUserProfile();
        if (user) {
            const role = (user.ten_vai_tro || user.loai_tai_khoan || "").toLowerCase();
            if (role !== "customer" && role !== "khach_hang" && !role.includes("khách hàng")) {
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

    const getServiceInfo = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes("khám")) return { icon: "stethoscope", img: "/img/kham_da_khoa.png" };
        if (lower.includes("tiêm") || lower.includes("vắc")) return { icon: "vaccines", img: "/img/tiem_chung.png" };
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

    return (
        <RevealSection>
            <section id="services" style={{ padding: "110px 0", background: "var(--background)", position: 'relative' }}>
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
                `}</style>
                <div className="container">
                    {/* tiêu đề dịch vụ */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '56px', flexWrap: 'wrap', gap: '20px' }}>
                        <div>
                            <div className="section-label" style={{ marginBottom: '16px' }}>✦ Dịch vụ Thú y</div>
                            <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 950, color: "var(--ink)", marginBottom: '12px', letterSpacing: '-1px' }}>Chăm Sóc <span style={{ color: "var(--primary)" }}>Toàn Diện</span></h2>
                            <p style={{ color: "var(--gray-500)", fontWeight: 500, fontSize: '1rem', maxWidth: '480px', lineHeight: 1.6 }}>Đầy đủ dịch vụ thú y từ khám tổng quát đến phẫu thuật phức tạp.</p>
                        </div>
                        <a href="#" onClick={handleBookingClick} className="btn" style={{ padding: '14px 28px', borderRadius: '50px', background: 'var(--primary)', color: 'white', textDecoration: 'none', fontWeight: 800, fontSize: '0.9rem', boxShadow: '0 8px 20px var(--primary-light)', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center' }}>Đặt lịch ngay →</a>
                    </div>

                    {/* bố cục dịch vụ */}
                    <div className="service-layout" style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>

                        {/* cột thẻ dịch vụ nổi bật */}
                        <div className="featured-service-card premium-fluid-gradient" style={{ flex: '0 0 auto', width: '48%', height: '600px', borderRadius: '32px', padding: '48px', color: 'white', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 30px 80px var(--primary-light)' }}>
                            {/* nền trang trí */}
                            <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '280px', height: '280px', borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
                            <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

                            {featured.badge && (
                                <div style={{ position: 'absolute', top: '28px', right: '28px', background: featured.badge === 'Mới' ? '#3b82f6' : '#f59e0b', color: 'white', padding: '6px 16px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 900 }}>★ {featured.badge}</div>
                            )}

                            <div>
                                <div style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.15)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '28px', backdropFilter: 'blur(8px)' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'white' }}>{featuredInfo.icon}</span>
                                </div>
                                <h3 style={{ fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)', fontWeight: 950, marginBottom: '16px', lineHeight: 1.2, letterSpacing: '-0.5px' }}>{featured.ten_dich_vu}</h3>
                                <p style={{ fontSize: '1rem', lineHeight: 1.7, opacity: 0.85, fontWeight: 400, marginBottom: '28px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis' }}>{featured.mo_ta || featured.desc}</p>
                                <img src={featuredInfo.img} alt={featured.ten_dich_vu} style={{ width: '100%', borderRadius: '24px', objectFit: 'cover', height: '170px' }} />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
                                <div>
                                    <div style={{ fontSize: '0.65rem', opacity: 0.7, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>Chi phí từ</div>
                                    <div style={{ fontSize: '1.6rem', fontWeight: 950 }}>{featured.gia ? formatTienVND(featured.gia) : featured.price}</div>
                                </div>
                                <Link to={`/dich-vu/${generateSlug(featured.ten_dich_vu)}`} style={{ background: 'var(--tien-ich-gradient)', color: 'white', padding: '14px 28px', borderRadius: '50px', fontWeight: 900, textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.3s', boxShadow: '0 8px 20px var(--primary-light)' }} onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')} onMouseLeave={e => (e.currentTarget.style.transform = 'none')}>
                                    Chi tiết <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span>
                                </Link>
                            </div>
                        </div>

                        {/* cột danh sách dịch vụ cuộn slider cao cấp */}
                        <div className="service-list-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {services.map((s, i) => (
                                <div key={i} className={`service-tab ${activeIdx === i ? 'active' : ''}`} onClick={() => setActiveIdx(i)}>
                                    <div style={{ width: '50px', height: '50px', background: activeIdx === i ? 'var(--primary)' : 'var(--primary-light)', color: activeIdx === i ? 'white' : 'var(--primary)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.3s' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>{s.icon || getServiceInfo(s.ten_dich_vu).icon}</span>
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 800, color: activeIdx === i ? 'var(--primary)' : 'var(--ink)', fontSize: '0.95rem', marginBottom: '3px' }}>{s.ten_dich_vu}</div>
                                        <div style={{ color: 'var(--gray-400)', fontSize: '0.78rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.gia ? formatTienVND(s.gia) : s.price}</div>
                                    </div>
                                    {s.badge && <div style={{ background: s.badge === 'Mới' ? 'rgba(14, 165, 233, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: s.badge === 'Mới' ? '#0ea5e9' : '#f59e0b', padding: '3px 10px', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 900, flexShrink: 0 }}>{s.badge}</div>}
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: activeIdx === i ? 'var(--primary)' : '#cbd5e1', transition: 'all 0.3s' }}>chevron_right</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </RevealSection>
    );
};

export default React.memo(PhanDichVu);
