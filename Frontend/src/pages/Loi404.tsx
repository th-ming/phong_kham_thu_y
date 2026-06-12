import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContextV2';
import { TransparentVideo, MemeCat } from '../components/SpecialEffects';

const Loi404: React.FC = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const navigate = useNavigate();

    return (
        <div style={{
            minHeight: '100vh',
            background: isDark
                ? 'radial-gradient(circle at 0% 0%, #0f172a 0%, #1e293b 100%)'
                : 'radial-gradient(circle at 0% 0%, #f0fdfa 0%, #ffffff 50%, #f8fafc 100%)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            transition: 'background 0.5s ease',
            color: 'var(--ink)'
        }}>
            <style>{`
                .error-404-main {
                    flex-grow: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 120px 24px 80px;
                }
                .btn-404-primary { 
                    background: var(--primary-gradient);
                    color: white; border: none; cursor: pointer;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex; align-items: center; gap: 12px;
                    padding: 18px 36px; border-radius: 50px; font-weight: 900;
                    justify-content: center;
                    white-space: nowrap;
                }
                .btn-404-primary:hover { 
                    transform: translateY(-5px); 
                    box-shadow: 0 15px 35px var(--primary-shadow);
                }
                .btn-404-secondary {
                    background: var(--surface); border: 1.5px solid var(--gray-200); color: var(--ink);
                    cursor: pointer; transition: all 0.4s ease;
                    display: flex; align-items: center; gap: 12px;
                    padding: 18px 36px; border-radius: 50px; font-weight: 800;
                    backdrop-filter: blur(10px);
                    justify-content: center;
                    white-space: nowrap;
                }
                .btn-404-secondary:hover {
                    background: var(--gray-50); border-color: var(--primary); transform: translateY(-5px);
                }
                @keyframes floatQuestion { 
                    0%, 100% { transform: translateY(0px) rotate(15deg) scale(1); box-shadow: 0 10px 25px rgba(245, 158, 11, 0.4); } 
                    50% { transform: translateY(-20px) rotate(-10deg) scale(1.15); box-shadow: 0 20px 45px rgba(245, 158, 11, 0.7); } 
                }
                .cat-card {
                    background: var(--glass);
                    backdrop-filter: var(--glass-blur);
                    border: 1px solid var(--glass-border);
                    box-shadow: var(--shadow-2xl);
                    border-radius: 48px;
                    overflow: hidden;
                }
                .cat-404-number {
                    position: absolute;
                    inset: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 0;
                    pointer-events: none;
                }
                .cat-404-number span {
                    color: var(--primary);
                    font-size: clamp(8rem, 28vw, 13rem);
                    font-weight: 1000;
                    letter-spacing: -0.08em;
                    line-height: 0.85;
                    opacity: 0.1;
                }
                .cat-404-video {
                    position: absolute;
                    left: 50%;
                    bottom: 5%;
                    transform: translateX(-50%);
                    width: min(72%, 350px);
                    height: auto;
                    z-index: 2;
                    filter: drop-shadow(0 24px 18px rgba(0, 0, 0, 0.24));
                }
                .cat-404-question {
                    position: absolute;
                    top: 10%;
                    right: 14%;
                    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
                    width: 64px;
                    height: 64px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10;
                    animation: floatQuestion 3s ease-in-out infinite;
                    color: white;
                    box-shadow: 0 16px 34px rgba(245, 158, 11, 0.32);
                }
                .error-actions-row {
                    display: flex;
                    gap: 16px;
                    flex-wrap: wrap;
                }
                @media (max-width: 720px) {
                    .error-404-main {
                        padding: 100px 16px 40px !important;
                    }
                    .cat-card {
                        max-width: 260px !important;
                        border-radius: 28px;
                    }
                    .cat-404-video {
                        width: min(76%, 190px);
                        bottom: 4%;
                    }
                    .cat-404-question {
                        width: 40px;
                        height: 40px;
                        top: 9%;
                        right: 12%;
                    }
                    .cat-404-question span {
                        font-size: 20px !important;
                    }
                    .error-actions-row {
                        flex-direction: row !important;
                        flex-wrap: nowrap !important;
                        gap: 10px !important;
                    }
                    .btn-404-primary, .btn-404-secondary {
                        flex: 1;
                        padding: 14px 12px !important;
                        font-size: 0.78rem !important;
                        gap: 6px !important;
                        border-radius: 24px !important;
                    }
                    .btn-404-primary span, .btn-404-secondary span {
                        font-size: 16px !important;
                    }
                }
            `}</style>

            {/* THANH HEADER ĐỘC LẬP CHO TRANG 404 */}
            <nav style={{
                position: 'fixed', top: 0, width: '100%', height: '80px',
                background: 'var(--glass)', backdropFilter: 'var(--glass-blur)',
                zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderBottom: '1px solid var(--glass-border)'
            }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', textDecoration: 'none' }}>
                        <div style={{ width: '40px', height: '40px', background: 'var(--primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img src='/img/avtpkty.png' alt='Rexi Logo' style={{ width: '70%', height: '70%', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
                        </div>
                        <span style={{ fontSize: '1.5rem', fontWeight: 950, color: 'var(--ink)', letterSpacing: '-1px' }}>Rexi</span>
                    </Link>
                    <Link to="/" style={{ background: 'none', border: 'none', color: 'var(--gray-500)', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'none' }}>Trang chủ</Link>
                </div>
            </nav>

            <main className="error-404-main">
                <div style={{ maxWidth: '1100px', width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px', alignItems: 'center' }}>

                    {/* KHỐI CON MÈO */}
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '1', maxWidth: '380px', margin: '0 auto' }} className="cat-card">
                        <div className="cat-404-number">
                            <span>404</span>
                        </div>

                        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                            <TransparentVideo src="/img/video_loi_404.mp4" className="cat-404-video" style={{ display: 'block' }} />
                            <div className="cat-404-question">
                                <span className="material-symbols-outlined" style={{ fontSize: '24px', fontWeight: 900 }}>question_mark</span>
                            </div>
                        </div>
                    </div>

                    {/* NỘI DUNG */}
                    <div style={{ textAlign: 'left' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '50px', marginBottom: '16px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>error</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase' }}>KHÔNG TÌM THẤY TRANG</span>
                        </div>

                        <h1 style={{ fontSize: '2.5rem', fontWeight: 950, color: 'var(--ink)', lineHeight: 1.15, marginBottom: '16px', letterSpacing: '-1.5px' }}>
                            Rất tiếc, trang này đã bị <span style={{ color: 'var(--primary)' }}>lạc</span> trong phòng khám.
                        </h1>

                        <p style={{ fontSize: '1.05rem', color: 'var(--gray-500)', lineHeight: 1.6, maxWidth: '480px', marginBottom: '32px', fontWeight: 500 }}>
                            Có vẻ như đường dẫn bạn đang truy cập không chính xác. Ngay cả những bác sĩ giỏi nhất đôi khi cũng lạc đường.
                        </p>

                        <div className="error-actions-row">
                            <button data-ai-id="button-loi404-zek7" className="btn-404-primary" onClick={() => navigate(-1)}>
                                <span className="material-symbols-outlined">arrow_back</span>
                                Quay lại
                            </button>
                            <button data-ai-id="button-loi404-imjf" className="btn-404-secondary" onClick={() => navigate('/')}>
                                <span className="material-symbols-outlined">home</span>
                                Về Trang chủ
                            </button>
                        </div>

                        <div style={{ marginTop: '40px', display: 'flex', alignItems: 'center', gap: '10px', opacity: 0.8 }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--gray-500)' }}>help</span>
                            </div>
                            <span style={{ fontSize: '0.9rem', color: 'var(--gray-500)', fontWeight: 600 }}>
                                Cần hỗ trợ tìm kiếm? <a data-ai-id="link_404_support" href="#" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 800 }}>Liên hệ Hỗ trợ</a>
                            </span>
                        </div>
                    </div>
                </div>
            </main>

            <MemeCat />
        </div>
    );
};

export default React.memo(Loi404);
