import React from "react";
import { Link } from "react-router-dom";
import { MemeCat, ScrollToTop, RevealSection } from "@components/SpecialEffects";
import { useTheme } from "../contexts/ThemeContextV2";

const LienHe: React.FC = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';

    const clinicAddress = "Số 68, Ngô Xuân Quảng, Trâu Quỳ, Gia Lâm, Hà Nội";
    const mapQuery = encodeURIComponent(`Phòng khám thú y Rexi, ${clinicAddress}`);
    const mapUrl = `https://maps.google.com/maps?q=${mapQuery}&z=16&output=embed`;
    const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

    return (
        <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
            <style>{`
                @keyframes slideUpFade {
                    from { opacity: 0; transform: translateY(18px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes iconPulse {
                    0%, 100% { transform: scale(1); }
                    50%       { transform: scale(1.12); }
                }
                .contact-card {
                    transition: transform 0.22s cubic-bezier(.22,.68,0,1.2), box-shadow 0.22s ease, border-color 0.22s ease !important;
                }
                .contact-card:hover {
                    transform: translateY(-5px) scale(1.01) !important;
                    box-shadow: 0 12px 36px rgba(224,122,63,0.16) !important;
                    border-color: var(--primary) !important;
                }
                .contact-card:hover .contact-icon {
                    animation: iconPulse 0.6s ease;
                }
                .map-card {
                    transition: box-shadow 0.3s ease;
                }
                .map-card:hover {
                    box-shadow: 0 24px 60px rgba(0,0,0,0.13) !important;
                }
            `}</style>
            {/* banner trang liên hệ */}
            <section style={{ padding: '100px 0 80px', background: isDark ? 'var(--secondary-gradient)' : 'var(--primary-gradient)', color: 'white', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: isDark ? 0.05 : 0.1, backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
                <div style={{ position: 'absolute', top: '-50%', left: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(224, 122, 63, 0.25) 0%, transparent 70%)', borderRadius: '50%' }}></div>
                <div style={{ position: 'absolute', bottom: '-40%', right: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(224, 122, 63, 0.15) 0%, transparent 70%)', borderRadius: '50%' }}></div>
                <div className="container" style={{ position: 'relative', zIndex: 1 }}>
                    <RevealSection>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', padding: '8px 20px', borderRadius: '50px', fontSize: '0.85rem', fontWeight: 900, marginBottom: '24px', border: '1px solid rgba(255,255,255,0.1)', letterSpacing: '1px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#e8955c' }}>support_agent</span>
                            LUÔN SẴN SÀNG HỖ TRỢ
                        </div>
                        <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 950, marginBottom: "24px", letterSpacing: "-1px" }}>
                            Liên Hệ <span style={{ color: "#e8955c" }}>Rexi</span>
                        </h1>
                        <p style={{ fontSize: '1.05rem', color: '#cbd5e1', lineHeight: 1.8, marginBottom: '40px', fontWeight: 500 }}>
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
                        <span style={{ color: 'var(--primary)' }}>LIÊN HỆ</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', marginBottom: '80px' }}>
                        {/* địa chỉ phòng khám trang liên hệ */}
                        <RevealSection>
                            <div className="glass-card contact-card" style={{ background: 'var(--surface)', padding: '40px', borderRadius: '32px', textAlign: 'center', height: '100%', border: '1px solid var(--gray-200)' }}>
                                <div className="contact-icon" style={{ width: '64px', height: '64px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>location_on</span>
                                </div>
                                <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--ink)', marginBottom: '16px' }}>Địa chỉ phòng khám</h3>
                                <p style={{ color: 'var(--gray-500)', lineHeight: 1.6, fontSize: '1.05rem', fontWeight: 500 }}>Số 68, Ngô Xuân Quảng, Trâu Quỳ<br />Gia Lâm, Hà Nội</p>
                            </div>
                        </RevealSection>

                        {/* đường dây cấp cứu 24/7 trang liên hệ */}
                        <RevealSection>
                            <div className="glass-card contact-card" style={{ background: 'var(--surface)', padding: '40px', borderRadius: '32px', textAlign: 'center', height: '100%', border: '1px solid var(--gray-200)' }}>
                                <div className="contact-icon" style={{ width: '64px', height: '64px', background: 'var(--danger-light, rgba(239,68,68,0.1))', color: 'var(--danger)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>emergency</span>
                                </div>
                                <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--ink)', marginBottom: '16px' }}>Cấp cứu 24/7</h3>
                                <p style={{ color: '#ef4444', fontWeight: 900, fontSize: '1.5rem', marginBottom: '8px' }}>***REMOVED***-VIETQR_ACCOUNT_NO</p>
                                <p style={{ color: 'var(--gray-500)', fontSize: '0.95rem', fontWeight: 500 }}>Trực cấp cứu không ngày nghỉ</p>
                            </div>
                        </RevealSection>

                        {/* số hotline tư vấn thông thường trang liên hệ */}
                        <RevealSection>
                            <div className="glass-card contact-card" style={{ background: 'var(--surface)', padding: '40px', borderRadius: '32px', textAlign: 'center', height: '100%', border: '1px solid var(--gray-200)' }}>
                                <div className="contact-icon" style={{ width: '64px', height: '64px', background: 'var(--primary-light)', color: '#3b82f6', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
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
                        <div className="map-card" style={{ background: 'var(--surface)', borderRadius: '40px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.08)', border: '1px solid var(--gray-200)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', padding: '24px 40px', background: 'var(--surface)', borderBottom: '1px solid var(--gray-200)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '28px' }}>map</span>
                                    <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: 'var(--ink)' }}>Bản Đồ Chỉ Đường</h3>
                                </div>
                    <a data-ai-id="link_contact_directions" href={directionsUrl} target="_blank" rel="noreferrer" className="btn-primary" style={{ padding: '10px 24px', borderRadius: '50px', textDecoration: 'none', fontWeight: 800, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>navigation</span>
                                    Mở Google Maps
                                </a>
                            </div>
                            <div style={{ width: '100%', height: 'clamp(320px, 52vw, 550px)', background: 'var(--gray-100)' }}>
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
        </div>
    );
};

export default React.memo(LienHe);
