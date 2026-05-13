import React from "react";
import { RevealSection } from "@components/SpecialEffects";


const PhanQuyTrinh: React.FC = () => {

    return (
        <RevealSection>
            <section style={{ padding: "110px 0", background: "var(--background)", position: 'relative', overflow: 'hidden' }}>
                {/* Decorative background elements */}
                <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(15,157,138,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '-120px', left: '-80px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(45,212,191,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <div className="container" style={{ textAlign: 'center' }}>
                    <div className="section-label" style={{ marginBottom: '20px' }}>— QUY TRÌNH ĐẶT LỊCH</div>
                    <h2 style={{ fontSize: "3rem", fontWeight: 950, color: "var(--ink)", marginBottom: '16px', letterSpacing: '-1px' }}>Chỉ <span style={{ color: "var(--primary)" }}>4 Bước</span> Đơn Giản</h2>
                    <p style={{ color: 'var(--gray-500)', marginBottom: '64px', fontWeight: 500, fontSize: '1rem' }}>Quy trình đặt lịch nhanh chóng, minh bạch và chuyên nghiệp</p>

                    <div className="process-grid" style={{ position: 'relative' }}>
                        <style>{`
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
                            .step-card:hover .step-icon-wrap { 
                                background: var(--primary-gradient) !important; 
                                border-color: transparent !important; 
                                transform: scale(1.1) rotate(5deg); 
                                box-shadow: 0 0 20px rgba(15,157,138,0.2) !important; 
                            }
                            .step-card:hover .step-icon-wrap span { color: white !important; }
                            .step-badge { transition: all 0.4s ease; }
                            .step-card:hover .step-badge { transform: scale(1.2); }
                            .process-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 40px; }
                            @media (max-width: 991px) {
                                .process-grid { grid-template-columns: repeat(2, 1fr); gap: 30px; }
                                .process-line { display: none; }
                            }
                            @media (max-width: 576px) {
                                .process-grid { grid-template-columns: 1fr; gap: 20px; }
                            }
                        `}</style>
                        <div className="process-line" style={{ position: 'absolute', top: '40px', left: '12%', right: '12%', height: '2px', background: 'linear-gradient(90deg, #ccfbf1 0%, #99f6e4 50%, #ccfbf1 100%)', zIndex: 0, borderRadius: '2px' }}></div>
                        {[
                            { t: "Tạo tài khoản", d: "Đăng ký nhanh qua email hoặc Google", icon: "person_add" },
                            { t: "Chọn dịch vụ", d: "Chọn loại dịch vụ và bác sĩ phù hợp", icon: "stethoscope" },
                            { t: "Đặt lịch hẹn", d: "Chọn ngày giờ, nhận xác nhận qua SMS", icon: "event_available" },
                            { t: "Đến khám", d: "Đến đúng giờ, để chúng tôi lo phần còn lại", icon: "clinical_notes" }
                        ].map((step, i) => (
                            <div key={i} className="step-card" style={{ position: 'relative', zIndex: 1, padding: '36px 24px', borderRadius: '28px' }}>
                                <div className="step-icon-wrap" style={{ width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontWeight: 900, position: 'relative' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '36px' }}>{step.icon}</span>
                                    <div className="step-badge" style={{ position: 'absolute', top: '-5px', right: '-5px', width: '28px', height: '28px', background: '#f59e0b', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 900 }}>{i + 1}</div>
                                </div>
                                <h4 style={{ fontWeight: 900, marginBottom: '12px', fontSize: '1.1rem', color: 'var(--ink)' }}>{step.t}</h4>
                                <p style={{ fontSize: '0.9rem', color: 'var(--gray-500)', fontWeight: 500, lineHeight: 1.6 }}>{step.d}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </RevealSection>
    );
};

export default PhanQuyTrinh;
