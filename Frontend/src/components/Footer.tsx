import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { generateSlug } from "@utils/index";
import axiosInstance from "@services/axios";
import { TransparentVideo } from './SpecialEffects';
import { useLiveUserProfile } from '@hooks/useLiveUserProfile';
import { isGenZBirthYear } from '@utils/customerTone';

// =========================================================================
// HỆ THỐNG THÚ CƯNG ẢO CAO CẤP (PREMIUM VIRTUAL PETS)
// =========================================================================
const VirtualPets: React.FC<{ containerRef: React.RefObject<HTMLElement> }> = ({ containerRef }) => {
    const foodsRef = useRef<{ id: number, x: number, y: number, emoji: string }[]>([]);
    const [foodsRender, setFoodsRender] = useState<{ id: number, x: number, y: number, emoji: string }[]>([]);

    const petsRef = useRef([
        { id: 1, type: '🐕', img: '/img/pet_dog.gif', x: 100, y: 50, tx: 100, ty: 50, vx: 0, vy: 0, state: 'idle', speed: 2.2, wait: 0, scale: 1 },
        { id: 2, type: '🐈', img: '/img/pet_cat.gif', x: 300, y: 80, tx: 300, ty: 80, vx: 0, vy: 0, state: 'idle', speed: 2.5, wait: 0, scale: 1 },
        { id: 3, type: '🐇', img: '/img/pet_rabbit.gif', x: 500, y: 60, tx: 500, ty: 60, vx: 0, vy: 0, state: 'idle', speed: 3.2, wait: 0, scale: 1 },
        { id: 4, type: '🐹', img: '/img/pet_hamster.gif', x: 750, y: 45, tx: 750, ty: 45, vx: 0, vy: 0, state: 'idle', speed: 4.0, wait: 0, scale: 1 }
    ]);

    const handleFeed = useCallback((e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('a, button, input')) return;
        if (!containerRef.current) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (foodsRef.current.length < 20) {
            const emojis = ['🦴', '🐟', '🥩', '🥕', '🍎', '🧀', '🍪'];
            const emoji = emojis[Math.floor(Math.random() * emojis.length)];
            foodsRef.current.push({ id: Date.now() + Math.random(), x, y, emoji });
            setFoodsRender([...foodsRef.current]);
        }
    }, [containerRef]);

    useEffect(() => {
        const parent = containerRef.current;
        if (parent) parent.addEventListener('click', handleFeed);
        return () => parent?.removeEventListener('click', handleFeed);
    }, [containerRef, handleFeed]);

    useEffect(() => {
        let rafId: number;
        const update = () => {
            if (!containerRef.current) return; // FIX: Stop if no container
            const w = containerRef.current.clientWidth;
            const h = containerRef.current.clientHeight;
            let needsFoodRender = false;

            petsRef.current.forEach(pet => {
                const el = document.getElementById(`vp-pet-${pet.id}`);
                if (!el) return;

                if (pet.wait > 0) {
                    pet.wait--;
                    const flip = pet.tx >= pet.x ? 1 : -1;
                    if (pet.state === 'eating') {
                        const munch = Math.abs(Math.sin(pet.wait * 0.3)) * 0.2;
                        el.style.transform = `translate(${pet.x}px, ${pet.y}px) scaleX(${flip}) scaleY(${1 - munch})`;
                    } else {
                        const breathe = Math.sin(Date.now() * 0.005 + pet.id) * 0.03;
                        el.style.transform = `translate(${pet.x}px, ${pet.y}px) scaleX(${flip}) scaleY(${1 + breathe})`;
                    }
                    return;
                }

                if (foodsRef.current.length > 0) {
                    let closest = foodsRef.current[0];
                    let minDist = Infinity;
                    foodsRef.current.forEach(f => {
                        const d = Math.hypot(f.x - pet.x, f.y - pet.y);
                        if (d < minDist) { minDist = d; closest = f; }
                    });
                    if (minDist < 400) {
                        pet.tx = closest.x; pet.ty = closest.y; pet.state = 'chasing';
                        if (minDist < 25) {
                            foodsRef.current = foodsRef.current.filter(f => f.id !== closest.id);
                            needsFoodRender = true; pet.state = 'eating'; pet.wait = 60; return;
                        }
                    }
                } else if (pet.state === 'idle' || Math.random() < 0.005) {
                    pet.tx = Math.random() * (w - 100) + 50;
                    pet.ty = Math.random() * (h - 60) + 30;
                    pet.state = 'wandering';
                }

                const dx = pet.tx - pet.x, dy = pet.ty - pet.y, dist = Math.hypot(dx, dy);
                if (dist > 5) {
                    const angle = Math.atan2(dy, dx);
                    const currentSpeed = pet.state === 'chasing' ? pet.speed * 1.6 : pet.speed;
                    pet.vx += (Math.cos(angle) * currentSpeed - pet.vx) * 0.1;
                    pet.vy += (Math.sin(angle) * currentSpeed - pet.vy) * 0.1;
                    pet.x += pet.vx; pet.y += pet.vy;
                } else {
                    pet.vx *= 0.8; pet.vy *= 0.8;
                    if (Math.abs(pet.vx) < 0.1) { pet.state = 'idle'; pet.wait = Math.random() * 200 + 100; }
                }
                const flip = pet.vx >= 0 ? 1 : -1;
                const tilt = pet.vx * 2.5;
                const bounce = pet.state !== 'idle' ? Math.abs(Math.sin(Date.now() * 0.012)) * 6 : 0;
                el.style.transform = `translate(${pet.x}px, ${pet.y - bounce}px) scaleX(${flip}) rotate(${tilt}deg)`;
            });

            if (needsFoodRender) setFoodsRender([...foodsRef.current]);
            rafId = requestAnimationFrame(update);
        };
        rafId = requestAnimationFrame(update);
        return () => cancelAnimationFrame(rafId);
    }, [containerRef]);

    return (
        <div className="footer-virtual-pets" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'auto', zIndex: 0 }}>
            <style>{`
                @keyframes foodDrop {
                    0% { transform: scale(0) rotate(-45deg); opacity: 0; }
                    60% { transform: scale(1.3) rotate(15deg); opacity: 1; }
                    100% { transform: scale(1) rotate(0deg); opacity: 1; }
                }
                .pet-container {
                    position: absolute; left: -40px; top: -60px; width: 80px; height: 80px;
                    transition: filter 0.3s; will-change: transform;
                    display: flex; alignItems: flex-end; justifyContent: center;
                    filter: drop-shadow(0 10px 15px rgba(0,0,0,0.35));
                }
            `}</style>
            {foodsRender.map(f => (
                <div key={f.id} style={{
                    position: 'absolute', left: f.x - 5, top: f.y - 5, fontSize: '10px',
                    animation: 'foodDrop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                    zIndex: 10,
                    pointerEvents: 'none'
                }}>
                    {f.emoji}
                </div>
            ))}
            {petsRef.current.map(p => (
                <div id={`vp-pet-${p.id}`} key={p.id} className="pet-container">
                    <img src={p.img} alt={p.type} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
            ))}
        </div>
    );
};

// * * FOOTER COMPONENT * Footer chính của toàn bộ hệ thống
const Footer: React.FC<{ isSimple?: boolean }> = ({ isSimple }) => {
    const footerRef = useRef<HTMLElement>(null);
    const liveUser = useLiveUserProfile();
    const footerBubbleText = isGenZBirthYear(liveUser?.nam_sinh)
        ? "Sen! Click xem trẫm múa nè! 🐾"
        : "Nhấn để xem mèo nhảy! 🐾";
    const [services, setServices] = useState<any[]>([]);
    const [isMemePlaying, setIsMemePlaying] = useState(false);

    const fallbackServices = ["Khám Đa Khoa", "Tiêm Chủng", "Chẩn đoán hình ảnh", "Phẫu thuật", "Xét nghiệm máu & Sinh hóa", "Spa & Grooming"];

    const normalizeServicePayload = (payload: any): any[] => {
        if (Array.isArray(payload)) return payload;
        if (Array.isArray(payload?.data)) return payload.data;
        if (Array.isArray(payload?.content)) return payload.content;
        if (Array.isArray(payload?.items)) return payload.items;
        return [];
    };

    useEffect(() => {
        if (!isSimple) {
            axiosInstance.get('/api/dich-vu/active')
                .then(res => setServices(normalizeServicePayload(res.data).slice(0, 6)))
                .catch(err => console.error("Lỗi lấy dịch vụ footer:", err));
        }
    }, [isSimple]);

    const safeServices = Array.isArray(services) ? services : [];
    const displayServices = safeServices.length > 0
        ? safeServices.map(s => s?.ten_dich_vu || s?.tenDichVu).filter(Boolean)
        : fallbackServices;
    const safeDisplayServices = displayServices.length > 0 ? displayServices : fallbackServices;

    return (
        <footer ref={footerRef} className="premium-footer" style={{
            background: 'linear-gradient(to bottom, #0f172a, #020617)',
            color: '#94a3b8',
            padding: isSimple ? '40px 0' : '100px 0 40px',
            position: 'relative',
            overflow: 'hidden',
            cursor: isSimple ? 'default' : 'crosshair'
        }}>
            {!isSimple && !isMemePlaying && <VirtualPets containerRef={footerRef} />}

            {/* LỚP BONG BÓNG CHAT (TỰ NHIÊN & SINH ĐỘNG HƠN) */}
            {!isSimple && !isMemePlaying && (
                <div className="footer-cat-bubble-wrap" style={{
                    position: 'absolute',
                    bottom: '273px', // Đặt vừa khít trên đỉnh đầu ảnh tĩnh 130px
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 11,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer'
                    }} onClick={() => setIsMemePlaying(true)}>
                    <div className="footer-chat-bubble">
                        {footerBubbleText}
                    </div>
                </div>
            )}

            {/* LỚP CHỨA ẢNH/VIDEO */}
            {!isSimple && (
                <div className="footer-cat-media" style={{
                    position: 'absolute',
                    bottom: '143px', 
                    left: '50%',
                    transform: 'translateX(-50%)',
                    zIndex: 10,
                    display: 'flex',
                    justifyContent: 'center',
                    cursor: 'pointer'
                }}>
                    {isMemePlaying ? (
                        // VIDEO KHI ĐƯỢC CLICK
                        <div style={{ 
                            height: '250px', display: 'flex', alignItems: 'flex-end',
                            filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.45))',
                            position: 'relative'
                        }}
                        onClick={() => setIsMemePlaying(false)}
                        title="Click để dừng video"
                        >
                            <TransparentVideo
                                src="/img/meonhayfooter_v3.webm"
                                loop={false}
                                muted={false}
                                removeBlack={true}
                                isCat={true}
                                variant="footer-cat"
                                onEnded={() => setIsMemePlaying(false)}
                                style={{ height: '100%', width: 'auto', objectFit: 'contain', cursor: 'pointer' }}
                            />
                        </div>
                    ) : (
                        // ẢNH TĨNH LÚC CHỜ (Chỉnh cho tự nhiên như Thú cưng ảo)
                        <div style={{ 
                            height: '130px', display: 'flex', alignItems: 'flex-end',
                            filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.35))',
                            transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.15) translateY(-5px)'}
                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1) translateY(0)'}
                        onClick={() => setIsMemePlaying(true)}>
                            <img
                                src="/img/anh_meo_nhay.png"
                                alt="Click để xem video"
                                style={{ height: '100%', width: 'auto', objectFit: 'contain' }}
                            />
                        </div>
                    )}
                </div>
            )}

            <style>{`
                @keyframes floatBubble { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
            `}</style>

            <div className="container" style={{ position: 'relative', zIndex: 1 }}>
                {!isSimple && (
                    <div className="footer-main-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '60px', marginBottom: '80px' }}>
                        <div className="footer-brand-block" style={{ gridColumn: 'span 2' }}>
                            <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '14px', textDecoration: 'none', marginBottom: '28px' }}>
                                <div style={{ width: '56px', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <img src="/img/avtpkty.png" alt="Rexi" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
                                </div>
                                <div className="logo-container">
                                    <span className="logo-rexi" style={{ color: '#0f9d8a', fontSize: '2.2rem', fontWeight: 950, letterSpacing: '-1px' }}>Rexi Vet</span>
                                    <span className="logo-sub" style={{ color: 'white', fontSize: '0.9rem', fontWeight: 700, display: 'block', marginTop: '-5px', letterSpacing: '1px' }}>HỆ THỐNG THÚ Y CAO CẤP</span>
                                </div>
                            </Link>
                            <p style={{ lineHeight: 1.8, marginBottom: '32px', maxWidth: '420px', fontSize: '1rem', color: '#94a3b8', fontWeight: 500 }}>
                                Đăng ký nhận tin để không bỏ lỡ các kiến thức chăm sóc thú cưng bổ ích và chương trình ưu đãi độc quyền từ Rexi.
                            </p>
                            {/* Newsletter Input */}
                            <div className="footer-newsletter" style={{ position: 'relative', maxWidth: '420px', marginBottom: '32px' }}>
                                <input data-ai-id="input-footer-xw4d"
                                    className="footer-newsletter-input"
                                    type="email"
                                    placeholder="Email của bạn..."
                                    id="newsletter-email"
                                    style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '16px 24px', borderRadius: '50px', color: 'white', outline: 'none' }}
                                />
                                <button data-ai-id="button-footer-onwp"
                                    className="footer-newsletter-button"
                                    onClick={async () => {
                                        const email = (document.getElementById('newsletter-email') as HTMLInputElement).value;
                                        if (!email || !email.includes('@')) {
                                            alert('Vui lòng nhập email hợp lệ nhé ạ!');
                                            return;
                                        }
                                        try {
                                            await axiosInstance.post('/api/system/newsletter', { email });
                                            {
                                                alert('Đăng ký nhận tin thành công! Cảm ơn bạn đã tin tưởng Rexi 🐾');
                                                (document.getElementById('newsletter-email') as HTMLInputElement).value = '';
                                            }
                                        } catch (e) {
                                            alert('Không kết nối được tới máy chủ, vui lòng thử lại sau nhé ạ!');
                                        }
                                    }}
                                    style={{ position: 'absolute', right: '6px', top: '6px', bottom: '6px', background: 'linear-gradient(135deg, #f59e0b, #ea580c)', border: 'none', color: 'white', padding: '0 24px', borderRadius: '50px', fontWeight: 800, cursor: 'pointer' }}
                                >
                                    ĐĂNG KÝ
                                </button>
                            </div>
                        </div>
                        <div>
                            <h4 style={{ color: 'white', fontWeight: 800, marginBottom: '32px', letterSpacing: '1px', fontSize: '0.9rem' }}>DỊCH VỤ</h4>
                            {/* BUG FIX & UX: Tăng khoảng cách gap lên 12px để tránh con sen bấm trượt trên di động */}
                            <div className="footer-service-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {safeDisplayServices.map((name, index) => (
                                    <Link key={index} to={`/dich-vu/${generateSlug(name)}`} className="footer-link">
                                        {name}
                                    </Link>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h4 style={{ color: 'white', fontWeight: 800, marginBottom: '32px', letterSpacing: '1px', fontSize: '0.9rem' }}>LIÊN HỆ</h4>
                            <div className="footer-contact-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <span className="material-symbols-outlined" style={{ color: '#0f9d8a', fontSize: '20px' }}>location_on</span>
                                    <span style={{ fontSize: '0.95rem' }}>Số 68, Ngõ 10, Ngô Xuân Quảng, Trâu Quỳ, Gia Lâm, Hà Nội</span>
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <span className="material-symbols-outlined" style={{ color: '#0f9d8a', fontSize: '20px' }}>call</span>
                                    <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'white' }}>***REMOVED***-VIETQR_ACCOUNT_NO</span>
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <span className="material-symbols-outlined" style={{ color: '#0f9d8a', fontSize: '20px' }}>mail</span>
                                    <span style={{ fontSize: '0.95rem' }}>rexivetsys@gmail.com</span>
                                </div>
                                <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                                    <a data-ai-id="link_footer_facebook" href="https://www.facebook.com/share/1Dv1fqqejf/" className="social-circle-fb" title="Facebook" target="_blank" rel="noopener noreferrer">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="currentColor" /></svg>
                                    </a>
                                    <a data-ai-id="link_footer_tiktok" href="https://www.tiktok.com/@rixi404" className="social-circle-tiktok" title="TikTok" target="_blank" rel="noopener noreferrer">
                                        <svg width="22" height="22" fill="white" viewBox="0 0 24 24"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" /></svg>
                                    </a>
                                    <a data-ai-id="link_footer_zalo" href="https://zalo.me/***REMOVED***-VIETQR_ACCOUNT_NO" className="social-circle-zalo" title="Zalo" target="_blank" rel="noopener noreferrer">
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/9/91/Icon_of_Zalo.svg" alt="Zalo" style={{ width: '24px', height: '24px' }} />
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                <div className="footer-bottom-row" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>© 2026 REXI VETERINARY SYSTEM. All rights reserved.</p>
                </div>

                <div style={{ marginTop: '32px', paddingTop: '32px', borderTop: '1px solid rgba(255,255,255,0.05)', textAlign: 'center' }}>
                    <h4 style={{ color: '#0f9d8a', marginBottom: '20px', fontSize: '1rem' }}>🐾 Mèo Nhảy Footer 🐾</h4>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
                        <div style={{ flex: '0 1 auto' }}>
                            <img 
                                src="/img/anhmeonhayfooter.jpg" 
                                alt="Mèo nhảy" 
                                style={{ maxWidth: '150px', height: 'auto', borderRadius: '12px', boxShadow: '0 4px 15px rgba(15, 157, 138, 0.3)' }}
                            />
                        </div>
                        <div style={{ flex: '0 1 auto' }}>
                            <video 
                                src="/img/meonhayfooter.mp4" 
                                controls
                                style={{ maxWidth: '200px', height: 'auto', borderRadius: '12px', boxShadow: '0 4px 15px rgba(15, 157, 138, 0.3)', backgroundColor: '#000' }}
                            />
                        </div>
                    </div>
                </div>
                {!isSimple && (
                    <div className="footer-feed-tip" style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.2)', fontWeight: 800 }}>
                        🐾 Mẹo nhỏ: Click vào khoảng trống bất kỳ để thả thức ăn cho thú cưng!
                    </div>
                )}
            </div>

            {!isSimple && (
                <div style={{ display: 'none', position: 'absolute', right: '2rem', bottom: '1.75rem', width: '180px', maxWidth: '22%', zIndex: 2, pointerEvents: 'none', filter: 'drop-shadow(0 20px 45px rgba(0,0,0,0.35))' }}>
                    <img src="/img/anh_meo_nhay.png" alt="Mèo nhảy" style={{ width: '100%', height: 'auto', display: 'block' }} />
                </div>
            )}

            <style>{`
                /* TỰ HỌC & TỐI ƯU: Thiết lập vùng chạm tối thiểu 44px chuẩn Fitts Law tránh bấm nhầm */
                .footer-link { color: #94a3b8; text-decoration: none; padding: 12px 0; font-size: 0.95rem; transition: all 0.3s; display: inline-flex; align-items: center; min-height: 44px; }
                .footer-link:hover { color: #0f9d8a; transform: translateX(5px); }
                .social-circle-dark { display: flex; align-items: center; justify-content: center; border-radius: 50%; background: rgba(255,255,255,0.05); color: white; width: 40px; height: 40px; transition: all 0.3s; text-decoration: none; border: 1px solid rgba(255,255,255,0.1); }
                .social-circle-dark:hover { background: #0f9d8a; border-color: #0f9d8a; transform: translateY(-3px); }
                
                .social-circle-fb { display: flex; align-items: center; justify-content: center; border-radius: 50%; background: rgba(24, 119, 242, 0.1); width: 44px; height: 44px; transition: all 0.3s; border: 1px solid rgba(24, 119, 242, 0.2); color: #1877F2; }
                .social-circle-fb:hover { background: #1877F2; border-color: #1877F2; transform: translateY(-3px); box-shadow: 0 0 15px rgba(24, 119, 242, 0.5); color: white; }

                .social-circle-tiktok { display: flex; align-items: center; justify-content: center; border-radius: 50%; background: rgba(255,255,255,0.05); width: 44px; height: 44px; transition: all 0.3s; border: 1px solid rgba(255,255,255,0.1); }
                .social-circle-tiktok:hover { background: #000000; border-color: #ff0050; transform: translateY(-3px); box-shadow: 2px 0 10px #ff0050, -2px 0 10px #00f2ea; }

                .social-circle-zalo { display: flex; align-items: center; justify-content: center; border-radius: 50%; background: rgba(0, 104, 255, 0.1); width: 44px; height: 44px; transition: all 0.3s; border: 1px solid rgba(0, 104, 255, 0.2); }
                .social-circle-zalo:hover { background: rgba(0, 104, 255, 0.2); border-color: #0068FF; transform: translateY(-3px); box-shadow: 0 0 15px rgba(0, 104, 255, 0.5); }
                .social-circle-zalo:hover img { transform: scale(1.1); }

                @media (max-width: 700px) {
                    .premium-footer {
                        padding: 56px 0 28px !important;
                        cursor: default !important;
                    }

                    .premium-footer .container {
                        padding-left: 18px !important;
                        padding-right: 18px !important;
                    }

                    .footer-virtual-pets {
                        display: block !important;
                    }

                    .pet-container {
                        width: 45px !important;
                        height: 45px !important;
                        left: -22px !important;
                        top: -33px !important;
                    }

                    .footer-cat-media {
                        display: flex !important;
                        left: 50% !important;
                        right: auto !important;
                        bottom: 40px !important;
                        transform: translateX(-50%) !important;
                    }

                    .footer-cat-media img {
                        height: 60px !important;
                    }

                    .footer-cat-media .transparent-video-container,
                    .footer-cat-media video {
                        height: 110px !important;
                    }

                    .footer-cat-bubble-wrap {
                        display: flex !important;
                        left: 50% !important;
                        right: auto !important;
                        bottom: 105px !important;
                        transform: translateX(-50%) !important;
                    }

                    .footer-chat-bubble {
                        font-size: 0.65rem !important;
                        padding: 6px 12px !important;
                    }

                    .footer-main-grid {
                        grid-template-columns: 1fr !important;
                        gap: 28px !important;
                        margin-bottom: 32px !important;
                    }

                    .footer-brand-block {
                        grid-column: auto !important;
                    }

                    .footer-brand-block > a {
                        margin-bottom: 18px !important;
                    }

                    .footer-brand-block img {
                        width: 44px !important;
                        height: 44px !important;
                    }

                    .footer-brand-block .logo-rexi {
                        font-size: 1.7rem !important;
                        letter-spacing: 0 !important;
                    }

                    .footer-brand-block .logo-sub {
                        font-size: 0.68rem !important;
                    }

                    .footer-brand-block p {
                        font-size: 0.86rem !important;
                        line-height: 1.6 !important;
                        margin-bottom: 18px !important;
                    }

                    .footer-newsletter {
                        max-width: none !important;
                        display: grid !important;
                        gap: 8px !important;
                        margin-bottom: 20px !important;
                    }

                    .footer-newsletter-input {
                        padding: 14px 16px !important;
                        border-radius: 16px !important;
                    }

                    .footer-newsletter-button {
                        position: static !important;
                        width: 100% !important;
                        min-height: 44px !important;
                        border-radius: 16px !important;
                    }

                    .footer-service-list {
                        display: grid !important;
                        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
                        gap: 6px 12px !important;
                    }

                    .footer-link {
                        min-height: 38px !important;
                        padding: 6px 0 !important;
                        font-size: 0.82rem !important;
                    }

                    .footer-contact-list {
                        gap: 12px !important;
                    }

                    .footer-contact-list > div {
                        gap: 10px !important;
                    }

                    .footer-contact-list span:not(.material-symbols-outlined) {
                        font-size: 0.84rem !important;
                        line-height: 1.55 !important;
                    }

                    .social-circle-fb,
                    .social-circle-tiktok,
                    .social-circle-zalo {
                        width: 40px !important;
                        height: 40px !important;
                    }

                    .footer-bottom-row {
                        padding-top: 24px !important;
                        justify-content: center !important;
                        text-align: center !important;
                    }

                    .footer-bottom-row p {
                        font-size: 0.74rem !important;
                        line-height: 1.5 !important;
                    }

                    .footer-feed-tip {
                        display: none !important;
                    }
                }
            `}</style>
        </footer>
    );
};

export default React.memo(Footer);
