import React from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { RevealSection } from "@components/SpecialEffects";


const testimonials = [
    { name: "Chị Minh Hạnh", pet: "Chủ của Lu - Poodle, 2 tuổi", text: "Cảm ơn BS Minh Anh đã cực kỳ tận tâm với bé Lu nhà mình. Bé bị viêm phổi nặng nhưng bác sĩ theo dõi sát sao từng giờ, giờ bé đã khỏe mạnh và chạy nhảy bình thường rồi!", star: 5 },
    { name: "Anh Quốc Trung", pet: "Chủ của Bông - Mèo Anh lông ngắn", text: "Phòng khám rất sạch sẽ, không có mùi hôi như những chỗ khác. BS Khánh Linh phẫu thuật triệt sản cho bé Bông rất khéo, vết mổ nhỏ và nhanh lành. Cảm ơn đội ngũ Rexi!", star: 5 },
    { name: "Cô Thu Hà", pet: "Chủ của MiMi - Phốc sóc", text: "Dịch vụ ở đây đúng là tiền nào của nấy. Nhân viên nhiệt tình, bác sĩ Hoàng Nam giải thích bệnh tình của bé MiMi rất kỹ càng, không vẽ vời xét nghiệm linh tinh. Rất tin tưởng!", star: 5 },
    { name: "Anh Văn Đức", pet: "Chủ của Shiba - 3 tuổi", text: "Mình đã đưa bé đi nhiều phòng khám nhưng chỉ Rexi là mình thực sự tin tưởng. Không gian sạch, bác sĩ ân cần và quy trình chuyên nghiệp.", star: 5 },
    { name: "Chị Lan Phương", pet: "Chủ của Kitty - Mèo Ba Tư", text: "Bé Kitty nhà mình bị sỏi thận, đội ngũ Rexi xử lý nhanh và chuyên nghiệp. Phòng nội trú rất sạch, bé được chăm sóc tận tình 24/7.", star: 5 },
    { name: "Chị Hương Giang", pet: "Chủ của Tí - Mèo Xiêm", text: "Phòng khám Rexi phục vụ rất chuyên nghiệp, từ lễ tân đến bác sĩ đều thân thiện. Bé Tí được khám và điều trị rất cẩn thận.", star: 5 },
    { name: "Anh Thành Long", pet: "Chủ của Leo - Chó Golden", text: "Tôi thực sự ấn tượng với cách đội ngũ ở đây đối xử với thú cưng. Chuyên gia giải thích chi tiết, thuốc an toàn, kết quả tốt.", star: 5 },
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
            <section ref={sectionRef} style={{ padding: "110px 0", background: "var(--background)", position: 'relative', overflow: 'hidden' }}>
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
                        .review-card { flex: 0 0 300px; min-height: 340px; }
                    }
                `}</style>

                {/* Header */}
                <div className="container" style={{ marginBottom: '60px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
                        <div>
                            <div className="section-label" style={{ marginBottom: '16px' }}>♥ Nhận xét khách hàng</div>
                            <h2 style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 950, color: "var(--ink)", letterSpacing: '-1px' }}>Tin Yêu Từ <span style={{ color: "var(--primary)" }}>Mọi Nhà</span></h2>
                        </div>
                        {/* Star rating badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', background: 'var(--primary-light)', padding: '20px 28px', borderRadius: '24px', border: '1px solid var(--primary-light)', flexShrink: 0, position: 'relative', overflow: 'hidden' }}>
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
                                    <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'var(--primary-gradient)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1rem', flexShrink: 0 }}>
                                        {t.name.charAt(t.name.lastIndexOf(' ') + 1)}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 900, fontSize: '0.95rem', color: 'var(--ink)' }}>{t.name}</div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--gray-400)', fontWeight: 600 }}>{t.pet}</div>
                                    </div>
                                    <div style={{ marginLeft: 'auto', background: 'var(--primary-light)', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--primary)' }}>pets</span>
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
