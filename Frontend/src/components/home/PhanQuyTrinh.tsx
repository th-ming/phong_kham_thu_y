import React from "react";
import { RevealSection } from "@components/SpecialEffects";


const PhanQuyTrinh: React.FC = () => {

    return (
        <RevealSection>
            <section className="home-process-section" style={{ padding: "110px 0", background: "var(--background)", position: 'relative', overflow: 'hidden' }}>
                {/* Decorative background elements */}
                <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(15,157,138,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '-120px', left: '-80px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(45,212,191,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <div className="container home-process-container" style={{ textAlign: 'center' }}>
                    <div className="section-label" style={{ marginBottom: '20px' }}>— QUY TRÌNH ĐẶT LỊCH</div>
                    <div className="process-mobile-summary" aria-label="Tóm tắt quy trình đặt lịch">
                        <div className="process-mobile-summary-item">
                            <span className="material-symbols-outlined">verified</span>
                            Rexi
                        </div>
                        <div className="process-mobile-summary-item">
                            <span className="material-symbols-outlined">person_add</span>
                            Tạo tài khoản
                        </div>
                        <div className="process-mobile-summary-item">
                            <span className="material-symbols-outlined">bolt</span>
                            Nhanh gọn
                        </div>
                    </div>
                    <h2 style={{ fontSize: "3rem", fontWeight: 950, color: "var(--ink)", marginBottom: '16px', letterSpacing: '-1px' }}>Chỉ <span style={{ color: "var(--primary)" }}>4 Bước</span> Đơn Giản</h2>
                    <p style={{ color: 'var(--gray-500)', marginBottom: '64px', fontWeight: 500, fontSize: '1rem' }}>Quy trình đặt lịch nhanh chóng, minh bạch và chuyên nghiệp</p>

                    <div className="process-grid" style={{ position: 'relative' }}>
                        <style>{`
                            @keyframes processLineFlow {
                                0% { background-position: 0% 50%; }
                                100% { background-position: 200% 50%; }
                            }
                            @keyframes stepBadgePulse {
                                0%, 100% { box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.28); }
                                50% { box-shadow: 0 0 0 9px rgba(245, 158, 11, 0); }
                            }
                            @keyframes stepIconFloat {
                                0%, 100% { transform: translateY(0); }
                                50% { transform: translateY(-4px); }
                            }
                            .step-card { 
                                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); 
                                border: 1px solid var(--gray-200); 
                                background: var(--surface) !important; 
                                backdrop-filter: blur(8px);
                            }
                            .step-card:hover { 
                                transform: translateY(-15px); 
                                box-shadow: var(--shadow-xl) !important; 
                                border-color: var(--primary) !important; 
                                background: var(--background) !important;
                            }
                            [data-theme='dark'] .step-card {
                                border-color: rgba(255, 255, 255, 0.1);
                                box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
                            }
                            .step-icon-wrap { 
                                transition: all 0.4s ease; 
                                background: var(--primary-light) !important; 
                                color: var(--primary) !important; 
                                border: 2px solid var(--primary-light) !important; 
                                box-shadow: 0 0 0 8px rgba(15,157,138,0.05) !important; 
                            }
                            [data-theme='dark'] .step-icon-wrap {
                                background: rgba(15, 157, 138, 0.15) !important;
                                border-color: rgba(15, 157, 138, 0.2) !important;
                            }
                            .step-card .step-icon-wrap {
                                animation: stepIconFloat 3.2s ease-in-out infinite;
                            }
                            .step-card:hover .step-icon-wrap { 
                                background: var(--primary-gradient) !important; 
                                border-color: transparent !important; 
                                transform: scale(1.1) rotate(5deg); 
                                box-shadow: 0 0 20px rgba(15,157,138,0.2) !important; 
                            }
                            .step-card:hover .step-icon-wrap span { color: white !important; }
                            .step-badge { transition: all 0.4s ease; animation: stepBadgePulse 2.8s ease-in-out infinite; }
                            .step-card:hover .step-badge { transform: scale(1.2); }
                            .process-line {
                                background-size: 200% 100% !important;
                                animation: processLineFlow 4s linear infinite;
                                box-shadow: 0 0 18px rgba(15, 157, 138, 0.18);
                            }
                            .process-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 40px; }
                            .process-mobile-summary {
                                display: none;
                            }
                            @media (max-width: 991px) {
                                .process-grid { grid-template-columns: repeat(2, 1fr); gap: 30px; }
                                .process-line { display: none; }
                            }
                            @media (max-width: 768px) {
                                .home-process-section {
                                    padding: 64px 0 !important;
                                    background:
                                        radial-gradient(circle at 16% 8%, rgba(15, 157, 138, 0.08), transparent 32%),
                                        var(--background) !important;
                                }
                                .home-process-container > .section-label {
                                    display: none !important;
                                }
                                .process-mobile-summary {
                                    width: min(100%, 360px) !important;
                                    max-width: 360px !important;
                                    margin: 0 auto 22px !important;
                                    display: flex !important;
                                    flex-direction: row !important;
                                    align-items: stretch !important;
                                    justify-content: center !important;
                                    gap: 0 !important;
                                    overflow: hidden;
                                    border-radius: 20px;
                                    background: var(--surface);
                                    border: 1px solid var(--gray-200);
                                    box-shadow: var(--shadow-sm);
                                }
                                .home-process-section .process-mobile-summary-item {
                                    flex: 1 1 0 !important;
                                    width: auto !important;
                                    min-width: 0 !important;
                                    min-height: 58px !important;
                                    display: flex !important;
                                    flex-direction: row !important;
                                    align-items: center !important;
                                    justify-content: center !important;
                                    gap: 5px !important;
                                    padding: 10px 7px !important;
                                    border-radius: 0 !important;
                                    background: transparent !important;
                                    border: 0 !important;
                                    border-right: 1px solid var(--gray-200) !important;
                                    color: var(--ink);
                                    font-size: 0.68rem;
                                    font-weight: 850;
                                    line-height: 1.15;
                                    white-space: nowrap;
                                }
                                .home-process-section .process-mobile-summary-item:last-child {
                                    border-right: 0 !important;
                                }
                                .process-mobile-summary .material-symbols-outlined {
                                    font-size: 18px;
                                    color: var(--primary);
                                }
                                .home-process-container > h2 {
                                    max-width: 320px;
                                    margin: 0 auto 10px !important;
                                    font-size: 1.95rem !important;
                                    line-height: 1.15 !important;
                                    color: var(--ink) !important;
                                    letter-spacing: 0 !important;
                                }
                                .home-process-container > h2 span {
                                    color: var(--primary) !important;
                                }
                                .home-process-container > p {
                                    max-width: 280px;
                                    margin: 0 auto 26px !important;
                                    font-size: 0.88rem !important;
                                    line-height: 1.5 !important;
                                    color: var(--gray-500) !important;
                                }
                                .process-grid {
                                    max-width: 420px;
                                    margin: 0 auto;
                                    grid-template-columns: 1fr !important;
                                    gap: 0 !important;
                                    padding: 12px 0 0 24px;
                                    position: relative;
                                }
                                .process-grid::before {
                                    content: "";
                                    position: absolute;
                                    left: 44px;
                                    top: 24px;
                                    bottom: 22px;
                                    width: 2px;
                                    border-radius: 999px;
                                    background: linear-gradient(180deg, var(--primary), color-mix(in srgb, var(--primary) 18%, transparent));
                                }
                                .step-card {
                                    min-height: 74px;
                                    display: grid;
                                    grid-template-columns: 46px 1fr;
                                    align-items: center;
                                    text-align: left;
                                    gap: 13px;
                                    padding: 11px 0 11px 0 !important;
                                    border-radius: 0 !important;
                                    background: transparent !important;
                                    border: 0 !important;
                                    box-shadow: none !important;
                                    backdrop-filter: none;
                                    -webkit-backdrop-filter: none;
                                    transition: transform 0.22s ease;
                                }
                                .step-card:hover,
                                .step-card:active {
                                    transform: translateY(-4px) scale(1.015);
                                }
                                .step-icon-wrap {
                                    width: 40px !important;
                                    height: 40px !important;
                                    margin: 0 !important;
                                    background: var(--primary-light) !important;
                                    border: 2px solid var(--surface) !important;
                                    box-shadow: 0 10px 24px var(--primary-shadow) !important;
                                    z-index: 2;
                                }
                                .step-icon-wrap span {
                                    font-size: 22px !important;
                                    color: var(--primary) !important;
                                }
                                .step-badge {
                                    display: none !important;
                                    animation: none !important;
                                }
                                .step-copy {
                                    padding: 13px 15px;
                                    border-radius: 16px;
                                    background: var(--surface);
                                    border: 1px solid var(--gray-200);
                                    box-shadow: var(--shadow-sm);
                                    transition: border-color 0.22s ease, box-shadow 0.22s ease, background 0.22s ease;
                                }
                                .step-card:hover .step-copy,
                                .step-card:active .step-copy {
                                    border-color: var(--primary) !important;
                                    background: var(--primary-light);
                                    box-shadow: var(--shadow-lg);
                                }
                                .step-copy h4 {
                                    font-size: 0.95rem !important;
                                    line-height: 1.25 !important;
                                    margin: 0 0 3px !important;
                                    color: var(--ink) !important;
                                }
                                .step-copy p {
                                    display: block !important;
                                    margin: 0 !important;
                                    font-size: 0.72rem !important;
                                    line-height: 1.35 !important;
                                    color: var(--gray-500) !important;
                                }
                            }
                        `}</style>
                        <div className="process-line" style={{ position: 'absolute', top: '40px', left: '12%', right: '12%', height: '2px', background: 'linear-gradient(90deg, #ccfbf1 0%, #2dd4bf 30%, #0f9d8a 50%, #99f6e4 70%, #ccfbf1 100%)', zIndex: 0, borderRadius: '2px' }}></div>
                        {[
                            { t: "Tạo tài khoản", d: "Đăng ký nhanh qua email hoặc Google", icon: "person_add" },
                            { t: "Chọn dịch vụ", d: "Chọn loại dịch vụ và bác sĩ phù hợp", icon: "stethoscope" },
                            { t: "Đặt lịch hẹn", d: "Chọn ngày giờ, nhận xác nhận qua SMS", icon: "event_available" },
                            { t: "Đến khám", d: "Đến đúng giờ, để chúng tôi lo phần còn lại", icon: "clinical_notes" }
                        ].map((step, i) => (
                            <div key={i} className="step-card" style={{ position: 'relative', zIndex: 1, padding: '36px 24px', borderRadius: '28px' }}>
                                <div className="step-icon-wrap" style={{ width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontWeight: 900, position: 'relative', animationDelay: `${i * 0.18}s` }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '36px' }}>{step.icon}</span>
                                    <div className="step-badge" style={{ position: 'absolute', top: '-5px', right: '-5px', width: '28px', height: '28px', background: '#f59e0b', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 900, animationDelay: `${i * 0.2}s` }}>{i + 1}</div>
                                </div>
                                <div className="step-copy">
                                    <h4 style={{ fontWeight: 900, marginBottom: '12px', fontSize: '1.1rem', color: 'var(--ink)' }}>{step.t}</h4>
                                    <p style={{ fontSize: '0.9rem', color: 'var(--gray-500)', fontWeight: 500, lineHeight: 1.6 }}>{step.d}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </RevealSection>
    );
};

export default PhanQuyTrinh;
