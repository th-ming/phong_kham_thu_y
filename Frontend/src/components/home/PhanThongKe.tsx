import React, { useRef, useState, useEffect } from "react";

interface StatItem {
    value: number;
    suffix: string;
    label: string;
    sublabel: string;
    icon: string;
    color: string;
    bg: string;
}

const stats: StatItem[] = [
    { value: 5000, suffix: "+", label: "Thú cưng", sublabel: "Đã được điều trị thành công", icon: "pets", color: "#0f9d8a", bg: "#f0fdfa" },
    { value: 10, suffix: "+", label: "Năm kinh nghiệm", sublabel: "Hoạt động liên tục tại Hà Nội", icon: "workspace_premium", color: "#16a34a", bg: "#f0fdf4" },
    { value: 15, suffix: "+", label: "Bác sĩ chuyên khoa", sublabel: "Được đào tạo bài bản trong & ngoài nước", icon: "stethoscope", color: "#ea580c", bg: "#fff7ed" },
    { value: 98, suffix: "%", label: "Khách hài lòng", sublabel: "Dựa trên 1.200+ đánh giá thực tế", icon: "thumb_up", color: "#2563eb", bg: "#eff6ff" },
];

/**
 * PHẦN SỐ LIỆU THỐNG KÊ - Đếm số tự động khi scroll vào view
 * Hiển thị các con số ấn tượng của phòng khám Rexi
 */
const PhanThongKe: React.FC = () => {
    const [counts, setCounts] = useState(stats.map(() => 0));
    const [started, setStarted] = useState(false);
    const ref = useRef<HTMLElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) setStarted(true); },
            { threshold: 0.3 }
        );
        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!started) return;
        const duration = 2200;
        const startTime = Date.now();
        let animationFrameId: number;

        const tick = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const ease = 1 - Math.pow(1 - progress, 3);
            setCounts(stats.map(s => Math.floor(s.value * ease)));
            if (progress < 1) animationFrameId = requestAnimationFrame(tick);
        };
        animationFrameId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(animationFrameId);
    }, [started]);

    return (
        <section ref={ref} className="premium-fluid-gradient" style={{
            padding: "100px 0",
            position: "relative",
            overflow: "hidden"
        }}>
            {/* Họa tiết chân thú ở nền */}
            <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: "url('/img/hinh-nen-chan-thu.png')",
                backgroundSize: '400px',
                opacity: 0.04,
                pointerEvents: 'none'
            }} />
            <style>{`
                .stat-card {
                    background: rgba(255, 255, 255, 0.08);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.15);
                    border-radius: 28px;
                    padding: 36px 28px;
                    text-align: center;
                    transition: all 0.4s ease;
                    position: relative;
                    overflow: hidden;
                    cursor: default;
                }
                .stat-card::before {
                    content: '';
                    position: absolute;
                    inset: 0;
                    background: rgba(15,157,138,0.0);
                    transition: background 0.4s ease;
                    border-radius: inherit;
                }
                .stat-card:hover { transform: translateY(-8px); border-color: rgba(255,255,255,0.4); box-shadow: 0 15px 30px rgba(0,0,0,0.1); }
                .stat-card:hover::before { background: rgba(255,255,255,0.05); }
                .stat-icon-box { transition: transform 0.4s ease; }
                .stat-card:hover .stat-icon-box { transform: scale(1.1) rotate(-5deg); }
                @media (max-width: 768px) {
                    .stats-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 16px !important; }
                }
                @media (max-width: 460px) {
                    .stats-grid { grid-template-columns: 1fr !important; }
                }
            `}</style>

            {/* Decorative elements */}
            <div style={{ position: 'absolute', top: '-120px', right: '-120px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 65%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', bottom: '-80px', left: '-80px', width: '350px', height: '350px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 65%)', pointerEvents: 'none' }} />

            <div className="container">
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: '56px' }}>
                    <div className="section-label" style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', marginBottom: '20px' }}>📊 Con số ấn tượng</div>
                    <h2 style={{ fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)', fontWeight: 950, color: 'white', letterSpacing: '-1px', marginBottom: '12px' }}>
                        Hơn <span style={{ color: '#ccfbf1' }}>10 Năm</span> Đồng Hành
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500, fontSize: '1rem' }}>Những con số minh chứng cho cam kết của Rexi</p>
                </div>

                {/* Stats grid */}
                <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px' }}>
                    {stats.map((s, i) => (
                        <div key={i} className="stat-card">
                            {/* Icon */}
                            <div className="stat-icon-box" style={{ width: '64px', height: '64px', background: s.bg, borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: `0 8px 24px ${s.color}22` }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '30px', color: s.color }}>{s.icon}</span>
                            </div>
                            {/* Number */}
                            <div style={{ fontSize: 'clamp(2.2rem, 3.5vw, 3rem)', fontWeight: 950, color: 'white', lineHeight: 1, marginBottom: '8px', fontFamily: "'Lora', serif" }}>
                                {counts[i].toLocaleString()}<span style={{ color: '#ccfbf1' }}>{s.suffix}</span>
                            </div>
                            {/* Label */}
                            <div style={{ fontWeight: 900, color: 'white', fontSize: '1rem', marginBottom: '8px' }}>{s.label}</div>
                            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem', fontWeight: 500, lineHeight: 1.5 }}>{s.sublabel}</div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PhanThongKe;
