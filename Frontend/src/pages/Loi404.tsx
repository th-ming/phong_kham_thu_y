import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
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
                .btn-404-primary { 
                    background: var(--primary-gradient);
                    color: white; border: none; cursor: pointer;
                    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                    display: flex; align-items: center; gap: 12px;
                    padding: 18px 36px; border-radius: 50px; font-weight: 900;
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
                    border-radius: 60px;
                }
            `}</style>

            <nav style={{
                position: 'fixed', top: 0, width: '100%', height: '80px',
                background: 'var(--glass)', backdropFilter: 'var(--glass-blur)',
                zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderBottom: '1px solid var(--glass-border)'
            }}>
                <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', textDecoration: 'none' }}>
                        <div style={{ width: '40px', height: '40px', background: 'var(--primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {/* logo ở trang lỗi 404 */}
                            <img src='/img/avtpkty.png' alt='Rexi Logo' style={{ width: '70%', height: '70%', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
                        </div>
                        <span style={{ fontSize: '1.5rem', fontWeight: 950, color: 'var(--ink)', letterSpacing: '-1px' }}>Rexi</span>
                    </Link>
                    <Link to="/" style={{ background: 'none', border: 'none', color: 'var(--gray-500)', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'none' }}>Trang chủ</Link>
                </div>
            </nav>

            <main style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px 24px' }}>
                <div style={{ maxWidth: '1100px', width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '60px', alignItems: 'center' }}>

                    {/* KHỐI CON MÈO */}
                    <div style={{ position: 'relative', width: '100%', aspectRatio: '1', maxWidth: '480px', margin: '0 auto' }} className="cat-card">
                        <div style={{ position: 'absolute', top: '50%', left: '0', transform: 'translateY(-50%)', width: '100%', textAlign: 'center', zIndex: 0 }}>
                            <span style={{ fontSize: '12rem', fontWeight: 1000, color: 'var(--primary)', opacity: 0.1, letterSpacing: '-10px' }}>404</span>
                        </div>

                        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
                            <div style={{ transform: 'translateY(-12%)', width: '100%', display: 'flex', justifyContent: 'center' }}>
                                <TransparentVideo src="/img/video_loi_404.mp4" style={{ width: '85%', height: '85%', objectFit: 'contain', position: 'relative', zIndex: 2 }} />
                            </div>

                            <div style={{
                                position: 'absolute', top: '22%', right: '15%',
                                background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
                                width: '60px', height: '60px', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                zIndex: 10, animation: 'floatQuestion 3s ease-in-out infinite',
                                color: 'white'
                            }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '32px', fontWeight: 900 }}>question_mark</span>
                            </div>
                        </div>
                    </div>

                    {/* NỘI DUNG */}
                    <div style={{ textAlign: 'left' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '50px', marginBottom: '24px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>error</span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 900, letterSpacing: '1px', textTransform: 'uppercase' }}>KHÔNG TÌM THẤY TRANG</span>
                        </div>

                        <h1 style={{ fontSize: '3.5rem', fontWeight: 950, color: 'var(--ink)', lineHeight: 1.1, marginBottom: '24px', letterSpacing: '-2px' }}>
                            Rất tiếc, trang này đã bị <span style={{ color: 'var(--primary)' }}>lạc</span> trong phòng khám.
                        </h1>

                        <p style={{ fontSize: '1.2rem', color: 'var(--gray-500)', lineHeight: 1.7, maxWidth: '480px', marginBottom: '48px', fontWeight: 500 }}>
                            Có vẻ như đường dẫn bạn đang truy cập không chính xác. Ngay cả những bác sĩ giỏi nhất đôi khi cũng lạc đường.
                        </p>

                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                            <button className="btn-404-primary" onClick={() => navigate(-1)}>
                                <span className="material-symbols-outlined">arrow_back</span>
                                Quay lại trang trước
                            </button>
                            <button className="btn-404-secondary" onClick={() => navigate('/')}>
                                <span className="material-symbols-outlined">home</span>
                                Về Trang chủ
                            </button>
                        </div>

                        <div style={{ marginTop: '60px', display: 'flex', alignItems: 'center', gap: '12px', opacity: 0.8 }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--gray-500)' }}>help</span>
                            </div>
                            <span style={{ fontSize: '0.95rem', color: 'var(--gray-500)', fontWeight: 600 }}>
                                Cần hỗ trợ tìm kiếm? <a href="#" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 800 }}>Liên hệ Hỗ trợ</a>
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
