import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { ChatBot } from "@components/ChatBot";
import { MemeCat, ScrollToTop, RevealSection } from "@components/SpecialEffects";

const VeChungToi: React.FC = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
            <style>{`
                .about-hero {
                    height: 500px;
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    overflow: hidden;
                }
                .about-hero-bg {
                    position: absolute;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: url('/img/anh_nen_gioi_thieu.png') center/cover no-repeat;
                    filter: brightness(0.6) blur(2px);
                    z-index: -1;
                    transform: scale(1.1);
                }
                .mission-card {
                    padding: 48px;
                    border-radius: 32px;
                    background: var(--surface);
                    border: 1.5px solid var(--gray-200);
                    transition: all 0.4s ease;
                    text-align: center;
                }
                .mission-card:hover {
                    transform: translateY(-12px);
                    border-color: #0f9d8a;
                    box-shadow: 0 30px 60px -12px rgba(15,157,138,0.15);
                }
                .facility-img {
                    width: 100%;
                    height: 300px;
                    object-fit: cover;
                    border-radius: 24px;
                    transition: transform 0.6s ease;
                }
                .facility-item:hover .facility-img {
                    transform: scale(1.05);
                }
                .history-img-box {
                    position: relative;
                    border-radius: 32px;
                    overflow: hidden;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                }
            `}</style>

            {/* PHẦN 1: HERO BANNER */}
            <section className="about-hero">
                <div className="about-hero-bg"></div>
                <div className="container" style={{ textAlign: 'center', color: 'white', position: 'relative', zIndex: 1 }}>
                    <RevealSection>
                        <p style={{ color: "#2dd4bf", fontWeight: 900, fontSize: "1rem", letterSpacing: "3px", textTransform: "uppercase", marginBottom: '16px' }}>VỀ CHÚNG TÔI</p>
                        <h1 style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)", fontWeight: 1000, marginBottom: "24px", letterSpacing: "-2px", textShadow: '0 4px 20px rgba(0,0,0,0.4)' }}>
                            Nâng Tầm Sức Khỏe <br /> <span style={{ color: "#2dd4bf" }}>Yêu Thương Thú Cưng</span>
                        </h1>
                        <p style={{ fontSize: "1.25rem", maxWidth: "700px", margin: "0 auto", lineHeight: 1.6, fontWeight: 500, opacity: 0.9 }}>
                            Hành trình hơn 10 năm đồng hành và chăm sóc hàng ngàn gia đình nhỏ tại Việt Nam.
                        </p>
                    </RevealSection>
                </div>
            </section>

            {/* PHẦN 2: LỊCH SỬ HÌNH THÀNH */}
            <section style={{ padding: '80px 0', background: 'var(--background)' }}>
                <div className="container">
                    {/* BREADCRUMB */}
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', color: 'var(--gray-400)', fontSize: '0.85rem', marginBottom: '60px', fontWeight: 700, letterSpacing: '1px' }}>
                        <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>TRANG CHỦ</Link>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
                        <span style={{ color: '#0f9d8a' }}>VỀ CHÚNG TÔI</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '80px', alignItems: 'center' }}>
                        <RevealSection>
                            <div>
                                <p style={{ color: "#0f9d8a", fontWeight: 900, fontSize: "0.85rem", letterSpacing: "2px", textTransform: "uppercase" }}>— CÂU CHUYỆN CỦA REXI</p>
                                <h2 style={{ fontSize: "3rem", fontWeight: 950, color: "var(--ink)", marginBottom: '32px', lineHeight: 1.1 }}>Hành Trình Kiến Tạo <br /> <span style={{ color: "#0f9d8a" }}>Niềm Tin</span></h2>
                                <p style={{ color: 'var(--gray-500)', fontSize: '1.1rem', lineHeight: 1.8, marginBottom: '24px', fontWeight: 500 }}>
                                    Khởi đầu từ một phòng khám nhỏ vào năm 2015, Rexi được thành lập bởi đội ngũ bác sĩ tâm huyết với mong muốn mang tiêu chuẩn y tế quốc tế về Việt Nam.
                                </p>
                                <p style={{ color: 'var(--gray-500)', fontSize: '1.1rem', lineHeight: 1.8, marginBottom: '40px', fontWeight: 500 }}>
                                    Chúng tôi tin rằng mỗi thú cưng đều xứng đáng nhận được sự chăm sóc tốt nhất, không chỉ về y tế mà còn là sự thấu hiểu và yêu thương chân thành nhất.
                                </p>
                                <div style={{ display: 'flex', gap: '40px' }}>
                                    <div>
                                        <h3 style={{ fontSize: '2.5rem', fontWeight: 1000, color: '#0f9d8a', margin: 0 }}>10+</h3>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--gray-400)', fontWeight: 800 }}>NĂM KINH NGHIỆM</p>
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '2.5rem', fontWeight: 1000, color: 'var(--ink)', margin: 0 }}>50k+</h3>
                                        <p style={{ fontSize: '0.9rem', color: 'var(--gray-400)', fontWeight: 800 }}>THÚ CƯNG ĐÃ KHÁM</p>
                                    </div>
                                </div>
                            </div>
                        </RevealSection>
                        <RevealSection>
                            <div className="history-img-box">
                                <img src="/img/noi_tru.png" alt="Rexi History" style={{ width: '100%', display: 'block' }} />
                                <div style={{ position: 'absolute', inset: 0, border: '20px solid rgba(255,255,255,0.1)' }}></div>
                            </div>
                        </RevealSection>
                    </div>
                </div>
            </section>

            {/* PHẦN 3: TẦM NHÌN & SỨ MỆNH */}
            <section style={{ padding: '100px 0', background: 'var(--gray-50)' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', marginBottom: '80px' }}>
                        <p style={{ color: "#0f9d8a", fontWeight: 900, fontSize: "0.85rem", letterSpacing: "2px", textTransform: "uppercase" }}>— GIÁ TRỊ CỐT LÕI</p>
                        <h2 style={{ fontSize: "3rem", fontWeight: 950, color: "var(--ink)" }}>Sứ Mệnh <span style={{ color: "#0f9d8a" }}>Của Chúng Tôi</span></h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
                        {[
                            { title: "Tầm Nhìn", icon: "visibility", text: "Trở thành hệ thống bệnh viện thú y hàng đầu Đông Nam Á, dẫn đầu về công nghệ và chất lượng điều trị.", color: "#0ea5e9" },
                            { title: "Sứ Mệnh", icon: "favorite", text: "Mang lại cuộc sống khỏe mạnh và hạnh phúc cho thú cưng thông qua dịch vụ y tế tận tâm và hiện đại nhất.", color: "#0f9d8a" },
                            { title: "Giá Trị", icon: "verified", text: "Minh bạch trong điều trị, không ngừng học hỏi và luôn đặt phúc lợi của thú cưng lên hàng đầu.", color: "#f59e0b" }
                        ].map((m, i) => (
                            <RevealSection key={i}>
                                <div className="mission-card">
                                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: `${m.color}15`, color: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '40px' }}>{m.icon}</span>
                                    </div>
                                    <h3 style={{ fontSize: '1.6rem', fontWeight: 950, color: 'var(--ink)', marginBottom: '16px' }}>{m.title}</h3>
                                    <p style={{ color: 'var(--gray-500)', lineHeight: 1.7, fontWeight: 500 }}>{m.text}</p>
                                </div>
                            </RevealSection>
                        ))}
                    </div>
                </div>
            </section>

            {/* PHẦN 4: THƯ VIỆN ẢNH KHÔNG GIAN */}
            <section style={{ padding: '120px 0', background: 'var(--background)' }}>
                <div className="container">
                    <div style={{ marginBottom: '60px' }}>
                        <p style={{ color: "#0f9d8a", fontWeight: 900, fontSize: "0.85rem", letterSpacing: "2px", textTransform: "uppercase" }}>— CƠ SỞ VẬT CHẤT</p>
                        <h2 style={{ fontSize: "3rem", fontWeight: 950, color: "var(--ink)" }}>Không Gian <span style={{ color: "#0f9d8a" }}>Tiêu Chuẩn 5★</span></h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '24px' }}>
                        {[
                            { title: "Phòng Phẫu Thuật Vô Trùng", img: "/img/phong_phau_thuat.png" },
                            { title: "Khu Vực Nội Trú Cao Cấp", img: "/img/noi_tru.png" },
                            { title: "Trung Tâm Hồi Sức Tích Cực", img: "/img/phong_hoi_suc.png" },
                            { title: "Phòng Khám Đa Khoa Hiện Đại", icon: "biotech", img: "/img/chan_doan_hinh_anh.png" },
                            { title: "Khu Vực Chờ Thư Giãn", icon: "spa", img: "/img/about_hero.png" },
                            { title: "Phòng Chẩn Đoán Hình Ảnh", icon: "medical_services", img: "/img/chan_doan_hinh_anh.png" }
                        ].map((f, i) => (
                            <RevealSection key={i}>
                                <div className="facility-item" style={{ position: 'relative', overflow: 'hidden', borderRadius: '32px' }}>
                                    <img src={f.img} alt={f.title} className="facility-img" />
                                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '40px 24px 24px', background: 'linear-gradient(to top, rgba(15,23,42,0.8), transparent)', color: 'white' }}>
                                        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>{f.title}</h4>
                                    </div>
                                </div>
                            </RevealSection>
                        ))}
                    </div>
                </div>
            </section>

            {/* PHẦN 5: CALL TO ACTION */}
            <section style={{ padding: '80px 0', background: 'linear-gradient(135deg, #0f9d8a 0%, #2dd4bf 100%)', color: 'white', textAlign: 'center' }}>
                <div className="container">
                    <RevealSection>
                        <h2 style={{ fontSize: '2.5rem', fontWeight: 950, marginBottom: '24px' }}>Bạn Đã Sẵn Sàng Trải Nghiệm Dịch Vụ?</h2>
                        <p style={{ fontSize: '1.1rem', marginBottom: '40px', opacity: 0.9, maxWidth: '600px', margin: '0 auto 40px', lineHeight: 1.6 }}>Hãy để đội ngũ y bác sĩ tại Rexi chăm sóc người bạn nhỏ của bạn một cách chuyên nghiệp và tận tâm nhất.</p>
                        <a href="/khach-hang/dat-lich-hen" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'white', color: '#0f9d8a', padding: '16px 32px', borderRadius: '50px', textDecoration: 'none', fontWeight: 900, fontSize: '1rem', boxShadow: '0 10px 20px rgba(0,0,0,0.1)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                            <span className="material-symbols-outlined">calendar_today</span> Đặt Lịch Hẹn Ngay
                        </a>
                    </RevealSection>
                </div>
            </section>

            <ScrollToTop />
            <MemeCat />
            <ChatBot />
        </div>
    );
};

export default React.memo(VeChungToi);
