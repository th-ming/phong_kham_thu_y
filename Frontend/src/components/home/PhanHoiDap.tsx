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
            <section className="home-faq-section" style={{ padding: "110px 0", background: "var(--background)", position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(15,157,138,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

                <style>{`
                    .faq-item { transition: all 0.3s ease; }
                    .faq-item:hover .faq-number { color: var(--primary) !important; }
                    .faq-toggle-btn { transition: all 0.3s ease; }
                    .faq-toggle-btn:hover { background: var(--primary-light) !important; }
                    @keyframes faqIconPulse {
                        0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(34, 211, 238, 0.22); }
                        50% { transform: scale(1.06); box-shadow: 0 0 0 10px rgba(34, 211, 238, 0); }
                    }
                    @keyframes faqCallShine {
                        0% { opacity: 0; transform: translateX(-130%) skewX(-18deg); }
                        18%, 76% { opacity: 0.42; }
                        100% { opacity: 0; transform: translateX(170%) skewX(-18deg); }
                    }
                    .faq-contact-card {
                        position: relative;
                        overflow: hidden;
                        transition: transform 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease;
                    }
                    .faq-contact-card::before {
                        content: "";
                        position: absolute;
                        inset: -50%;
                        background: radial-gradient(circle at 20% 20%, rgba(34, 211, 238, 0.2), transparent 36%);
                        opacity: 0;
                        transition: opacity 0.35s ease;
                        pointer-events: none;
                    }
                    .faq-contact-card:hover {
                        transform: translateY(-6px);
                        border-color: rgba(34, 211, 238, 0.55) !important;
                        box-shadow: 0 22px 48px rgba(34, 211, 238, 0.16) !important;
                    }
                    .faq-contact-card:hover::before { opacity: 1; }
                    .faq-contact-icon {
                        position: relative;
                        animation: faqIconPulse 2.3s ease-in-out infinite;
                    }
                    .faq-call-link {
                        position: relative;
                        overflow: hidden;
                        transition: transform 0.28s ease, box-shadow 0.28s ease, filter 0.28s ease;
                    }
                    .faq-call-link::before {
                        content: "";
                        position: absolute;
                        top: -45%;
                        bottom: -45%;
                        left: 0;
                        width: 42%;
                        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.42), transparent);
                        transform: translateX(-130%) skewX(-18deg);
                        animation: faqCallShine 5.2s linear infinite;
                    }
                    .faq-call-link .call-icon {
                        transition: transform 0.24s ease;
                    }
                    .faq-call-link:hover {
                        transform: translateY(-2px);
                        filter: brightness(1.05);
                        box-shadow: 0 12px 28px rgba(34, 211, 238, 0.28);
                    }
                    .faq-call-link:hover .call-icon {
                        transform: rotate(-10deg) scale(1.08);
                    }
                    [data-theme='dark'] .faq-contact-card {
                        background: linear-gradient(145deg, rgba(15, 23, 42, 0.92), rgba(8, 47, 73, 0.34)) !important;
                        border-color: rgba(34, 211, 238, 0.24) !important;
                        box-shadow: 0 18px 48px rgba(0, 0, 0, 0.24) !important;
                    }
                    [data-theme='dark'] .faq-call-link {
                        background: var(--primary-gradient) !important;
                        box-shadow: 0 10px 26px rgba(34, 211, 238, 0.22);
                    }
                    @keyframes slideDownFaq {
                        from { opacity: 0; transform: translateY(-8px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @media (max-width: 700px) {
                        .home-faq-section {
                            padding: 68px 0 !important;
                        }
                        .faq-layout {
                            display: block !important;
                        }
                        .faq-side {
                            position: static !important;
                            width: 100% !important;
                            margin-bottom: 20px;
                        }
                        .faq-side .section-label {
                            margin-bottom: 12px !important;
                        }
                        .faq-side h2 {
                            max-width: 300px;
                            font-size: 2rem !important;
                            line-height: 1.12 !important;
                            margin-bottom: 10px !important;
                            letter-spacing: 0 !important;
                        }
                        .faq-side > p {
                            max-width: 330px;
                            font-size: 0.86rem !important;
                            line-height: 1.48 !important;
                            margin-bottom: 16px !important;
                        }
                        .faq-contact-card {
                            display: grid;
                            grid-template-columns: 42px 1fr auto;
                            align-items: center;
                            column-gap: 11px;
                            padding: 13px !important;
                            border-radius: 18px !important;
                            box-shadow: var(--shadow-sm) !important;
                        }
                        .faq-contact-icon {
                            width: 42px !important;
                            height: 42px !important;
                            margin-bottom: 0 !important;
                            border-radius: 13px !important;
                        }
                        .faq-contact-card > div:nth-child(2) {
                            margin-bottom: 0 !important;
                            font-size: 0.84rem !important;
                        }
                        .faq-contact-card > div:nth-child(3) {
                            display: none;
                        }
                        .faq-call-link {
                            width: 40px;
                            height: 40px;
                            padding: 0 !important;
                            border-radius: 13px !important;
                            display: grid !important;
                            place-items: center;
                        }
                        .faq-call-link span:last-child {
                            display: none;
                        }
                        .faq-call-link .call-icon {
                            font-size: 19px !important;
                        }
                        .faq-list {
                            min-width: 0 !important;
                            gap: 10px !important;
                        }
                        .faq-item {
                            border: 1px solid var(--gray-200) !important;
                            border-radius: 18px;
                            background: var(--surface);
                            box-shadow: var(--shadow-sm);
                            overflow: hidden;
                            transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
                        }
                        .faq-item:has(button:active),
                        .faq-item:hover {
                            transform: translateY(-2px);
                            border-color: var(--primary) !important;
                            box-shadow: var(--shadow-md);
                        }
                        .faq-toggle-btn {
                            padding: 15px 13px !important;
                            align-items: center !important;
                            gap: 10px !important;
                        }
                        .faq-toggle-btn > div:first-child {
                            gap: 11px !important;
                            align-items: center !important;
                            min-width: 0;
                        }
                        .faq-number {
                            width: 34px;
                            height: 34px;
                            display: grid;
                            place-items: center;
                            border-radius: 12px;
                            background: var(--primary-light);
                            color: var(--primary) !important;
                            font-size: 0.9rem !important;
                            font-family: Inter, system-ui, sans-serif !important;
                        }
                        .faq-toggle-btn > div:first-child > span:last-child {
                            font-size: 0.84rem !important;
                            line-height: 1.36 !important;
                            padding-top: 0 !important;
                            min-width: 0;
                        }
                        .faq-toggle-btn > div:last-child {
                            width: 30px !important;
                            height: 30px !important;
                            margin-top: 0 !important;
                        }
                        .faq-item > div {
                            padding: 0 13px 16px 58px !important;
                            font-size: 0.8rem !important;
                            line-height: 1.62 !important;
                        }
                    }
                `}</style>

                <div className="container">
                    {/* Two-column layout: Header left + FAQ list right */}
                    <div className="faq-layout" style={{ display: 'flex', gap: '80px', alignItems: 'flex-start', flexWrap: 'wrap' }}>

                        {/* LEFT: Sticky header */}
                        <div className="faq-side" style={{ flex: '0 0 auto', width: '300px', position: 'sticky', top: '120px' }}>
                            <div className="section-label" style={{ marginBottom: '20px' }}>? Hỏi Đáp</div>
                            <h2 style={{ fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 950, color: 'var(--ink)', lineHeight: 1.2, letterSpacing: '-1px', marginBottom: '20px' }}>
                                Câu Hỏi <span style={{ color: 'var(--primary)' }}>Thường Gặp</span>
                            </h2>
                            <p style={{ color: 'var(--gray-500)', lineHeight: 1.7, fontWeight: 500, fontSize: '0.95rem', marginBottom: '32px' }}>
                                Giải đáp mọi thắc mắc của bạn về quy trình khám, chi phí và dịch vụ tại Rexi.
                            </p>
                            {/* Still have questions CTA */}
                            <div className="faq-contact-card" style={{ background: 'var(--surface)', borderRadius: '24px', padding: '24px', border: '1px solid var(--gray-200)', boxShadow: 'var(--shadow-sm)' }}>
                                <div className="faq-contact-icon" style={{ width: '48px', height: '48px', background: 'var(--primary-light)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '24px', color: 'var(--primary)' }}>chat_bubble</span>
                                </div>
                                <div style={{ fontWeight: 900, color: 'var(--ink)', fontSize: '0.95rem', marginBottom: '8px', position: 'relative', zIndex: 1 }}>Còn câu hỏi khác?</div>
                                <div style={{ color: 'var(--gray-500)', fontSize: '0.85rem', fontWeight: 500, marginBottom: '16px', lineHeight: 1.5, position: 'relative', zIndex: 1 }}>Hãy chat trực tiếp với Trợ lý Rexi hoặc gọi hotline.</div>
                                <a data-ai-id="link_faq_call" href="tel:02412345678" className="faq-call-link" style={{ background: 'var(--primary)', color: 'white', padding: '10px 20px', borderRadius: '50px', fontWeight: 800, textDecoration: 'none', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '8px', position: 'relative', zIndex: 1 }}>
                                    <span className="material-symbols-outlined call-icon" style={{ fontSize: '16px', position: 'relative', zIndex: 1 }}>call</span>
                                    <span style={{ position: 'relative', zIndex: 1 }}>Gọi ngay</span>
                                </a>
                            </div>
                        </div>

                        {/* RIGHT: FAQ accordion - single column, full width */}
                        <div className="faq-list" style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '0' }}>
                            {faqs.map((faq, i) => (
                                <div key={i} className="faq-item" style={{ borderBottom: '1px solid var(--gray-200)' }}>
                                    <button data-ai-id="button-phanhoidap-67qz"
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
