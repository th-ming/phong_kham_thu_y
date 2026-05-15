import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { ChatBot } from "@components/ChatBot";
import { MemeCat, ScrollToTop, RevealSection } from "@components/SpecialEffects";
import { useTheme } from "../contexts/ThemeContextV2";

const LienHe: React.FC = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const mapUrl = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3724.8471526438833!2d105.92823617596856!3d21.00243438879685!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135a90022370c67%3A0xe2128b9d453303d3!2zUGjDsm5nIEtow6FtIFRoxdynamicWIFkgUmV4aQ!5e0!3m2!1svi!2s!4v1714421111111!5m2!1svi!2s";

    return (
        <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
            {/* banner trang liên hệ */}
            <section style={{ padding: '100px 0 80px', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-50%', left: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(45,212,191,0.15) 0%, transparent 70%)', borderRadius: '50%' }}></div>
                <div className="container" style={{ position: 'relative', zIndex: 1 }}>
                    <RevealSection>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', padding: '8px 20px', borderRadius: '50px', fontSize: '0.85rem', fontWeight: 900, marginBottom: '24px', border: '1px solid rgba(255,255,255,0.1)', letterSpacing: '1px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#2dd4bf' }}>support_agent</span>
                            LUÔN SẴN SÀNG HỖ TRỢ
                        </div>
                        <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 950, marginBottom: "24px", letterSpacing: "-1px" }}>
                            Liên Hệ <span style={{ color: "#2dd4bf" }}>Rexi</span>
                        </h1>
                        <p style={{ fontSize: '1.05rem', color: 'var(--gray-500)', lineHeight: 1.8, marginBottom: '40px', fontWeight: 500 }}>
                            Chúng tôi luôn sẵn lòng lắng nghe và hỗ trợ bạn. Mọi thắc mắc về dịch vụ y tế, đặt lịch hẹn hoặc phản hồi chất lượng, vui lòng liên hệ với Rexi qua các kênh dưới đây.
                        </p>
                    </RevealSection>
                </div>
            </section>

            <section style={{ padding: '60px 0 80px' }}>
                <div className="container">
                    {/* thanh điều hướng */}
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', color: 'var(--gray-400)', fontSize: '0.85rem', marginBottom: '60px', fontWeight: 700, letterSpacing: '1px' }}>
                        <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>TRANG CHỦ</Link>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
                        <span style={{ color: '#0f9d8a' }}>LIÊN HỆ</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', marginBottom: '80px' }}>
                        {/* địa chỉ phòng khám trang liên hệ */}
                        <RevealSection>
                            <div className="glass-card" style={{ background: 'var(--surface)', padding: '40px', borderRadius: '32px', textAlign: 'center', height: '100%', border: '1px solid var(--gray-200)' }}>
                                <div style={{ width: '64px', height: '64px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>location_on</span>
                                </div>
                                <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--ink)', marginBottom: '16px' }}>Địa chỉ phòng khám</h3>
                                <p style={{ color: 'var(--gray-500)', lineHeight: 1.6, fontSize: '1.05rem', fontWeight: 500 }}>Số 68, Ngô Xuân Quảng, Trâu Quỳ<br />Gia Lâm, Hà Nội</p>
                            </div>
                        </RevealSection>

                        {/* đường dây cấp cứu 24/7 trang liên hệ */}
                        <RevealSection>
                            <div className="glass-card" style={{ background: 'var(--surface)', padding: '40px', borderRadius: '32px', textAlign: 'center', height: '100%', border: '1px solid var(--gray-200)' }}>
                                <div style={{ width: '64px', height: '64px', background: 'var(--danger-light, rgba(239,68,68,0.1))', color: 'var(--danger)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>emergency</span>
                                </div>
                                <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--ink)', marginBottom: '16px' }}>Cấp cứu 24/7</h3>
                                <p style={{ color: '#ef4444', fontWeight: 900, fontSize: '1.5rem', marginBottom: '8px' }}>***REMOVED***-VIETQR_ACCOUNT_NO</p>
                                <p style={{ color: 'var(--gray-500)', fontSize: '0.95rem', fontWeight: 500 }}>Trực cấp cứu không ngày nghỉ</p>
                            </div>
                        </RevealSection>

                        {/* số hotline tư vấn thông thường trang liên hệ */}
                        <RevealSection>
                            <div className="glass-card" style={{ background: 'var(--surface)', padding: '40px', borderRadius: '32px', textAlign: 'center', height: '100%', border: '1px solid var(--gray-200)' }}>
                                <div style={{ width: '64px', height: '64px', background: 'var(--primary-light)', color: '#3b82f6', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>support_agent</span>
                                </div>
                                <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--ink)', marginBottom: '16px' }}>Tư vấn & Đặt lịch</h3>
                                <p style={{ color: '#3b82f6', fontWeight: 900, fontSize: '1.5rem', marginBottom: '8px' }}>***REMOVED***-VIETQR_ACCOUNT_NO</p>
                                <p style={{ color: 'var(--gray-500)', fontSize: '0.95rem', fontWeight: 500 }}>rexivetsys@gmail.com</p>
                            </div>
                        </RevealSection>
                    </div>

                    {/* bản đồ google maps */}
                    <RevealSection>
                        <div style={{ background: 'var(--surface)', borderRadius: '40px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', border: '1px solid var(--gray-200)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 40px', background: isDark ? 'var(--background)' : 'var(--ink)', color: isDark ? 'var(--ink)' : 'var(--surface)', borderBottom: isDark ? '1px solid var(--gray-200)' : 'none' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span className="material-symbols-outlined" style={{ color: isDark ? 'var(--primary)' : '#2dd4bf', fontSize: '28px' }}>map</span>
                                    <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900 }}>Bản Đồ Chỉ Đường</h3>
                                </div>
                                <a href="https://www.google.com/maps/search/?api=1&query=Phòng+khám+thú+y+Rexi+Gia+Lâm" target="_blank" rel="noreferrer" className="btn-primary" style={{ background: '#0f9d8a', color: 'white', padding: '10px 24px', borderRadius: '50px', textDecoration: 'none', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>navigation</span>
                                    Mở Google Maps
                                </a>
                            </div>
                            <div style={{ width: '100%', height: '550px', background: 'var(--gray-100)' }}>
                                <iframe
                                    src={mapUrl}
                                    width="100%" height="100%" style={{ border: 0, filter: isDark ? 'invert(90%) hue-rotate(180deg) brightness(95%) contrast(85%)' : 'none', transition: 'filter 0.3s ease' }} allowFullScreen={true} loading="lazy" referrerPolicy="no-referrer-when-downgrade"
                                ></iframe>
                            </div>
                        </div>
                    </RevealSection>
                </div>
            </section>

            <ScrollToTop />
            <MemeCat />
            <ChatBot />
        </div>
    );
};

export default React.memo(LienHe);
