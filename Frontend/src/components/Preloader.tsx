import React, { useState, useEffect } from "react";
import { LottiePlayer } from "./SpecialEffects";

/* màn hình chờ tải trang */
export const Preloader: React.FC = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Tự động ẩn màn hình chờ sau 2.5 giây
    const timer = setTimeout(() => setLoading(false), 2600); // Fix: 2600ms để khớp với animation delay (1.8s) + duration (0.8s)
    return () => clearTimeout(timer);
  }, []);

  if (!loading) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'var(--background)', zIndex: 9999,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      animation: 'preloader-exit 0.8s cubic-bezier(0.8, 0, 0.2, 1) forwards 1.8s'
    }}>
      {/* ảnh hoạt họa loading */}
      <div style={{ width: '250px', height: '250px', marginBottom: '-20px' }}>
        <LottiePlayer url="https://assets9.lottiefiles.com/packages/lf20_tr1pjkop.json" />
      </div>

      <div style={{ color: 'var(--ink)', fontSize: '1.8rem', fontWeight: 950, letterSpacing: '5px', textTransform: 'uppercase' }}>
        REXI <span style={{ color: '#0f9d8a' }}>VET</span>
      </div>

      <div style={{ color: 'var(--gray-500)', fontSize: '0.9rem', fontWeight: 700, marginTop: '10px', letterSpacing: '2px' }}>
        ĐANG CHUẨN BỊ PHÒNG KHÁM...
      </div>

      {/* thanh tiến trình */}
      <div style={{ width: '200px', height: '4px', background: 'var(--gray-200)', marginTop: '30px', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
        <div style={{
          position: 'absolute', top: 0, left: '-100%', width: '100%', height: '100%',
          background: 'linear-gradient(to right, transparent, #0f9d8a, transparent)',
          animation: 'shimmer 1.5s infinite'
        }}></div>
      </div>
    </div>
  );
};
