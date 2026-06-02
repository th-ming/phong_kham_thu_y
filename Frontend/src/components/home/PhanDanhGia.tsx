import React from "react";
import { useTheme } from "../../contexts/ThemeContextV2";
import { RevealSection } from "@components/SpecialEffects";


const testimonials = [
    { name: "Trần Minh", pet: "Chủ của Bông - Mèo Anh", text: "Phòng khám rất sạch sẽ, không có mùi hôi như những chỗ khác. BS Khánh Linh phẫu thuật cho bé Bông rất khéo, vết mổ nhỏ và nhanh lành. Cảm ơn đội ngũ Rexi!", star: 5, avatar: "https://files.catbox.moe/dhjgf3.png", petAvatar: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=150&q=80" },
    { name: "Chị Minh Hạnh", pet: "Chủ của Lu - Poodle", text: "Cảm ơn BS Minh Anh đã cực kỳ tận tâm với bé Lu nhà mình. Bé bị viêm phổi nặng nhưng bác sĩ theo dõi sát sao từng giờ, giờ bé đã khỏe mạnh và chạy nhảy bình thường rồi!", star: 5, avatar: "https://images.pexels.com/photos/1382731/pexels-photo-1382731.jpeg?auto=compress&cs=tinysrgb&w=150", petAvatar: "https://images.unsplash.com/photo-1591768575198-88dac53fbd0a?auto=format&fit=crop&w=150&q=80" },
    { name: "Sơn Tùng M-TP", pet: "Chủ của Capy - Chuột lang nước", text: "Phòng khám xịn xò thực sự! Đưa bé đi khám mà có cảm giác như vào resort 5 sao. Không gian sạch, bác sĩ ân cần và quy trình rất chuyên nghiệp. Đánh giá 10 điểm!", star: 5, avatar: "https://files.catbox.moe/9tnz6h.png", petAvatar: "https://files.catbox.moe/xzcfyx.png" },
    { name: "MONO", pet: "Chủ của Leo - Chó Corgi", text: "Thao thức vì bé Corgi bị ốm, nhưng qua Rexi thì u is chời, bác sĩ chữa đỉnh của chóp luôn! Dịch vụ 10 điểm không có nhưng, phòng khám siêu xịn xò. Mãi iu Rexi!", star: 5, avatar: "https://files.catbox.moe/9p85o7.png", petAvatar: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=150&q=80" },
    { name: "Chi Pu", pet: "Chủ của Kitty - Mèo Ba Tư", text: "Bé Kitty nhà mình bị sỏi thận, đội ngũ Rexi xử lý nhanh và rất chuyên nghiệp. Phòng nội trú thơm tho sạch sẽ, bé được chăm sóc tận tình 24/7 luôn nè.", star: 5, avatar: "https://files.catbox.moe/eskus4.png", petAvatar: "https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?auto=format&fit=crop&w=150&q=80" },
    { name: "Jack - J97", pet: "Chủ của Thiên An", text: "Phòng khám tuyệt vời lắm luôn á, hôm trước mang bé chuột qua tiêm phòng mà bác sĩ làm nhẹ nhàng cực kỳ, bé xíu xiu mà không đau khóc gì luôn. Mãi iuuu ❤️", star: 5, avatar: "https://files.catbox.moe/3l1oeh.png", petAvatar: "https://files.catbox.moe/h3ihz1.png" },
    { name: "Cô Thu Hà", pet: "Chủ của MiMi - Phốc sóc", text: "Dịch vụ ở đây đúng là tiền nào của nấy. Nhân viên nhiệt tình, bác sĩ Hoàng Nam giải thích bệnh tình của bé MiMi rất kỹ càng. Rất tin tưởng!", star: 5, petAvatar: "https://images.unsplash.com/photo-1605897472359-85e4b94d685d?auto=format&fit=crop&w=150&q=80" },
    { name: "Chị Hương Giang", pet: "Chủ của Tí - Mèo Xiêm", text: "Phòng khám Rexi phục vụ rất chuyên nghiệp, từ lễ tân đến bác sĩ đều thân thiện. Mình sẽ giới thiệu cho bạn bè.", star: 5, petAvatar: "https://images.unsplash.com/photo-1511044568932-338cba0ad803?auto=format&fit=crop&w=150&q=80" },
];



const PhanDanhGia: React.FC = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    // Double the list for infinite marquee effect
    const marqueeItems = [...testimonials, ...testimonials];
    const [isInView, setIsInView] = React.useState(false);
    const sectionRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => setIsInView(entry.isIntersecting),
            { threshold: 0.05 }
        );
        if (sectionRef.current) observer.observe(sectionRef.current);
        return () => observer.disconnect();
    }, []);

    return (
        <RevealSection>
            <section ref={sectionRef} className="home-reviews-section" style={{ padding: "110px 0", background: "var(--background)", position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 80% 20%, rgba(15,157,138,0.04) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(45,212,191,0.03) 0%, transparent 60%)', pointerEvents: 'none' }} />
                
                {/* Background Pattern */}
                <div style={{ 
                    position: 'absolute', 
                    inset: 0, 
                    backgroundImage: "url('/img/hinh-nen-chan-thu.png')", 
                    backgroundSize: '400px', 
                    opacity: 0.03, 
                    pointerEvents: 'none' 
                }} />

                <style>{`
                    @keyframes marqueeReview {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-50%); }
                    }
                    .review-marquee-track {
                        display: flex;
                        width: max-content;
                        animation: marqueeReview 35s linear infinite;
                        animation-play-state: ${isInView ? 'running' : 'paused'};
                        gap: 24px;
                        will-change: transform;
                    }
                    .review-marquee-track:hover { animation-play-state: paused; }
                     .review-card {
                        flex: 0 0 340px;
                        background: var(--surface) !important;
                        border: 1px solid var(--gray-200);
                        border-radius: 28px;
                        padding: 24px;
                        transition: all 0.3s ease;
                        position: relative;
                        overflow: hidden;
                        display: flex;
                        flex-direction: column;
                        min-height: 300px;
                        backdrop-filter: blur(10px);
                    }
                    .review-card:hover {
                        transform: translateY(-6px);
                        box-shadow: var(--shadow-xl) !important;
                        border-color: var(--primary) !important;
                        background: var(--background) !important;
                    }
                    [data-theme='dark'] .review-card {
                        border-color: rgba(255, 255, 255, 0.1);
                        box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.6);
                    }
                    @media (max-width: 768px) {
                        .home-reviews-section {
                            padding: 66px 0 !important;
                        }
                        .reviews-header {
                            margin-bottom: 24px !important;
                        }
                        .reviews-header-row {
                            align-items: stretch !important;
                            gap: 14px !important;
                        }
                        .reviews-header-row h2 {
                            font-size: 1.85rem !important;
                            line-height: 1.15 !important;
                            letter-spacing: 0 !important;
                        }
                        .reviews-rating-badge {
                            width: 100%;
                            padding: 12px 14px !important;
                            border-radius: 999px !important;
                            justify-content: space-between;
                        }
                        .reviews-rating-badge > div:first-of-type div:first-child {
                            font-size: 2rem !important;
                        }
                        .review-marquee-track {
                            gap: 14px;
                            animation-duration: 46s;
                            align-items: flex-start;
                        }
                        .review-card {
                            flex: 0 0 274px;
                            min-height: 0;
                            border-radius: 22px 22px 22px 8px;
                            padding: 15px;
                            background: var(--surface) !important;
                            box-shadow: var(--shadow-sm) !important;
                        }
                        .review-card:nth-child(even) {
                            margin-top: 28px;
                            border-radius: 22px 22px 8px 22px;
                            background: var(--primary-light) !important;
                            border-color: color-mix(in srgb, var(--primary) 18%, var(--gray-200)) !important;
                        }
                        .review-card:nth-child(3n) {
                            flex-basis: 236px;
                        }
                        .review-card:hover,
                        .review-card:active {
                            transform: translateY(-4px) scale(1.01);
                            border-color: var(--primary) !important;
                        }
                        .review-card p {
                            font-size: 0.78rem !important;
                            line-height: 1.52 !important;
                            display: -webkit-box;
                            -webkit-line-clamp: 4;
                            -webkit-box-orient: vertical;
                            overflow: hidden;
                            margin-bottom: 10px !important;
                        }
                        .review-card > div:first-child {
                            font-size: 88px !important;
                            opacity: 0.16 !important;
                        }
                        .review-card > div:nth-child(2) {
                            margin-bottom: 10px !important;
                        }
                        .review-card > div:last-child {
                            gap: 9px !important;
                            padding-top: 9px !important;
                        }
                        .review-card > div:last-child img,
                        .review-card > div:last-child > div:first-child {
                            width: 36px !important;
                            height: 36px !important;
                        }
                        .review-card > div:last-child div[style*="font-weight: 900"] {
                            font-size: 0.8rem !important;
                        }
                        .review-card > div:last-child div[style*="font-size: 0.78rem"] {
                            font-size: 0.66rem !important;
                        }
                    }
                `}</style>

                {/* Header */}
                <div className="container reviews-header" style={{ marginBottom: '60px' }}>
                    <div className="reviews-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
                        <div>
                            <div className="section-label" style={{ marginBottom: '16px' }}>♥ Nhận xét khách hàng</div>
                            <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 950, color: "var(--ink)", letterSpacing: '-1px' }}>Tin Yêu Từ <span style={{ color: "var(--primary)" }}>Mọi Nhà</span></h2>
                        </div>
                        {/* Star rating badge */}
                        <div className="reviews-rating-badge" style={{ display: 'flex', alignItems: 'center', gap: '20px', background: 'var(--primary-light)', padding: '20px 28px', borderRadius: '24px', border: '1px solid var(--primary-light)', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
                            <img src="/img/phong-kham-sach-se.png" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.07, pointerEvents: 'none' }} />
                            <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
                                <div style={{ fontSize: '2.8rem', fontWeight: 950, color: 'var(--primary)', lineHeight: 1 }}>4.9</div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--gray-500)', fontWeight: 700, marginTop: '4px', letterSpacing: '0.5px' }}>/ 5.0 STARS</div>
                            </div>
                            <div style={{ width: '1px', height: '50px', background: 'var(--primary-light)', filter: 'brightness(0.9)' }} />
                            <div>
                                <div style={{ display: 'flex', gap: '3px', color: '#f59e0b', marginBottom: '6px' }}>
                                    {[...Array(5)].map((_, i) => <span key={i} className="material-symbols-outlined" style={{ fontSize: '18px' }}>star</span>)}
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--ink)', fontWeight: 700 }}>1.200+ đánh giá</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: 500, marginTop: '2px' }}>từ khách hàng thực tế</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Marquee - full width, outside container */}
                <div style={{ overflow: 'hidden', WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)', maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)', paddingBottom: '8px' }}>
                    <div className="review-marquee-track">
                        {marqueeItems.map((t, i) => (
                            <div key={i} className="review-card">
                                {/* Quote decoration */}
                                <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '120px', color: 'var(--primary-light)', opacity: isDark ? 0.05 : 0.4, fontFamily: 'serif', fontWeight: 900, lineHeight: 1, zIndex: 0, pointerEvents: 'none' }}>"</div>

                                {/* Stars */}
                                <div style={{ display: 'flex', gap: '3px', color: '#f59e0b', marginBottom: '16px', position: 'relative', zIndex: 1 }}>
                                    {[...Array(t.star)].map((_, idx) => <span key={idx} className="material-symbols-outlined" style={{ fontSize: '16px' }}>star</span>)}
                                </div>

                                {/* Text */}
                                <p style={{ fontSize: '0.9rem', color: 'var(--gray-600)', lineHeight: 1.75, marginBottom: '12px', fontWeight: 500, fontStyle: 'italic', position: 'relative', zIndex: 1 }}>
                                    "{t.text}"
                                </p>

                                {/* Author */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '10px', borderTop: '1px solid var(--gray-200)' }}>
                                    {t.avatar ? (
                                        <img src={t.avatar} alt={t.name} style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                                    ) : (
                                        <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--primary-gradient)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1rem', flexShrink: 0 }}>
                                            {t.name.charAt(t.name.lastIndexOf(' ') + 1)}
                                        </div>
                                    )}
                                    <div>
                                        <div style={{ fontWeight: 900, fontSize: '0.95rem', color: 'var(--ink)' }}>{t.name}</div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--gray-400)', fontWeight: 600 }}>{t.pet}</div>
                                    </div>
                                    <div style={{ marginLeft: 'auto', background: 'var(--primary-light)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                        {t.petAvatar ? (
                                            <img src={t.petAvatar} alt="Pet" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--primary)' }}>pets</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </RevealSection>
    );
};

export default PhanDanhGia;
