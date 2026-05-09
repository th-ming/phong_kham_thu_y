import React, { useState } from "react";
import { RevealSection } from "@components/SpecialEffects";

const faqs = [
    { q: "Rexi có làm việc ngoài giờ hành chính hoặc Lễ/Tết không?", a: "Chúng tôi thấu hiểu bệnh lý có thể xảy ra bất cứ lúc nào. Vì vậy, hệ thống cấp cứu và nội trú của Rexi hoạt động 24/7, xuyên suốt 365 ngày trong năm, kể cả Lễ, Tết để luôn đồng hành cùng thú cưng của bạn.", icon: "event_available" },
    { q: "Tôi có cần đặt lịch hẹn trước khi đưa bé đến khám không?", a: "Để tối ưu thời gian chờ đợi, chúng tôi khuyến khích bạn đặt lịch trước qua Website hoặc Hotline. Tuy nhiên, với các trường hợp khẩn cấp, đội ngũ y bác sĩ luôn ưu tiên tiếp nhận và xử lý ngay lập tức.", icon: "schedule" },
    { q: "Chi phí khám chữa bệnh tại Rexi được tính như thế nào?", a: "Mọi chi phí tại Rexi đều được minh bạch và niêm yết rõ ràng. Trước khi tiến hành xét nghiệm hay điều trị, bác sĩ sẽ tư vấn phác đồ chi tiết và thông báo trước mức phí dự kiến để bạn hoàn toàn yên tâm.", icon: "payments" },
    { q: "Phòng khám có hỗ trợ đưa đón thú cưng tại nhà không?", a: "Có. Rexi sở hữu hệ thống xe vận chuyển y tế chuyên dụng, hỗ trợ đưa đón thú cưng tận nhà trong khu vực nội thành với điều kiện an toàn, vô trùng và thoải mái nhất.", icon: "local_shipping" }
];

const PhanHoiDap: React.FC = () => {
    const [activeFaq, setActiveFaq] = useState<number | null>(null);

    return (
        <RevealSection>
            <section style={{ padding: "110px 0", background: "var(--background)", position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(15,157,138,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

                <style>{`
                    .faq-item { transition: all 0.3s ease; }
                    .faq-item:hover .faq-number { color: var(--primary) !important; }
                    .faq-toggle-btn { transition: all 0.3s ease; }
                    .faq-toggle-btn:hover { background: var(--primary-light) !important; }
                    @keyframes slideDownFaq {
                        from { opacity: 0; transform: translateY(-8px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                `}</style>

                <div className="container">
                    {/* Two-column layout: Header left + FAQ list right */}
                    <div style={{ display: 'flex', gap: '80px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

                        {/* LEFT: Sticky header */}
                        <div style={{ flex: '0 0 auto', width: '300px', position: 'sticky', top: '120px' }}>
                            <div className="section-label" style={{ marginBottom: '20px' }}>? Hỏi Đáp</div>
                            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 950, color: 'var(--ink)', lineHeight: 1.2, letterSpacing: '-1px', marginBottom: '20px' }}>
                                Câu Hỏi <span style={{ color: 'var(--primary)' }}>Thường Gặp</span>
                            </h2>
                            <p style={{ color: 'var(--gray-500)', lineHeight: 1.7, fontWeight: 500, fontSize: '0.95rem', marginBottom: '32px' }}>
                                Giải đáp mọi thắc mắc của bạn về quy trình khám, chi phí và dịch vụ tại Rexi.
                            </p>
                            {/* Still have questions CTA */}
                            <div style={{ background: 'var(--surface)', borderRadius: '24px', padding: '24px', border: '1px solid var(--gray-200)', boxShadow: 'var(--shadow-sm)' }}>
                                <div style={{ width: '48px', height: '48px', background: 'var(--primary-light)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--primary)' }}>chat_bubble</span>
                                </div>
                                <div style={{ fontWeight: 900, color: 'var(--ink)', fontSize: '0.95rem', marginBottom: '8px' }}>Còn câu hỏi khác?</div>
                                <div style={{ color: 'var(--gray-500)', fontSize: '0.85rem', fontWeight: 500, marginBottom: '16px', lineHeight: 1.5 }}>Hãy chat trực tiếp với Trợ lý Rexi hoặc gọi hotline.</div>
                                <a href="tel:02412345678" style={{ background: 'var(--primary)', color: 'white', padding: '10px 20px', borderRadius: '50px', fontWeight: 800, textDecoration: 'none', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>call</span>
                                    Gọi ngay
                                </a>
                            </div>
                        </div>

                        {/* RIGHT: FAQ accordion - single column, full width */}
                        <div style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '0' }}>
                            {faqs.map((faq, i) => (
                                <div key={i} className="faq-item" style={{ borderBottom: '1px solid var(--gray-200)' }}>
                                    <button
                                        className="faq-toggle-btn"
                                        onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                                        style={{ width: '100%', padding: '28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', borderRadius: '8px', gap: '20px' }}
                                    >
                                        <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
                                            {/* Large number */}
                                            <span className="faq-number" style={{ fontSize: '2rem', fontWeight: 950, color: activeFaq === i ? 'var(--primary)' : 'var(--gray-200)', lineHeight: 1, transition: 'color 0.3s ease', flexShrink: 0, fontFamily: "'Lora', serif" }}>
                                                {String(i + 1).padStart(2, '0')}
                                            </span>
                                            <span style={{ fontWeight: 800, color: activeFaq === i ? 'var(--primary)' : 'var(--ink)', fontSize: '1rem', lineHeight: 1.5, paddingTop: '4px', transition: 'color 0.3s' }}>{faq.q}</span>
                                        </div>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: activeFaq === i ? 'var(--primary)' : 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)', marginTop: '2px', border: activeFaq === i ? 'none' : '1px solid var(--gray-200)' }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: activeFaq === i ? 'white' : 'var(--gray-500)', transform: activeFaq === i ? 'rotate(180deg)' : 'none', transition: 'all 0.3s' }}>expand_more</span>
                                        </div>
                                    </button>
                                    {activeFaq === i && (
                                        <div style={{ padding: '0 0 28px 62px', color: 'var(--gray-500)', lineHeight: 1.75, fontWeight: 500, fontSize: '0.95rem', animation: 'slideDownFaq 0.3s ease-out forwards' }}>
                                            {faq.a}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </RevealSection>
    );
};

export default PhanHoiDap;
