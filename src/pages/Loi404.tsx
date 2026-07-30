import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { MemeCat } from '@components/SpecialEffects';

const Loi404: React.FC = () => {
  const navigate = useNavigate();
  const catVideoRef = useRef<HTMLVideoElement>(null);
  const catCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const video = catVideoRef.current;
    const canvas = catCanvasRef.current;
    if (!video || !canvas) return;

    let animationFrameId: number;

    const processFrame = () => {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      const render = () => {
        if (video.paused || video.ended) {
          animationFrameId = requestAnimationFrame(render);
          return;
        }

        if (canvas.width === 0 && video.videoWidth > 0) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        if (canvas.width > 0) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = frame.data;
          
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            const isGreen = g > 70 && g > r * 1.35 && g > b * 1.35;
            
            if (isGreen) {
              data[i + 3] = 0;
            }
          }
          ctx.putImageData(frame, 0, 0);
        }
        animationFrameId = requestAnimationFrame(render);
      };

      render();
    };

    video.play().catch(() => {});
    processFrame();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'white', 
      fontFamily: "'Inter', sans-serif", 
      position: 'relative', 
      overflow: 'hidden', 
      display: 'flex', 
      flexDirection: 'column' 
    }}>
      <nav style={{
        position: 'fixed',
        top: 0,
        width: '100%',
        height: '80px',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        zIndex: 50,
        padding: '0 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            background: 'var(--teal)', 
            borderRadius: '12px', 
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img src='/img/avtpkty.png' alt='Rexi Logo' style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} />
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--ink)' }}>Rexi</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <button 
            onClick={() => navigate('/')} 
            style={{ 
              fontSize: '1rem', 
              fontWeight: '600', 
              color: 'var(--gray-600)', 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer' 
            }}
          >
            Trang chủ
          </button>
        </div>
      </nav>

      <main style={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px 24px 48px' }}>
        <div style={{ maxWidth: '1100px', width: '100%', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '80px', alignItems: 'center' }}>
          
          <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', maxWidth: '480px', margin: '0 auto' }}>
            <div style={{ 
              position: 'absolute', 
              inset: 0, 
              backgroundColor: '#f0f6f6', 
              borderRadius: '60px', 
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px'
            }}>
              <div style={{ position: 'relative', width: '380px', height: '380px' }}>
                <video ref={catVideoRef} src="/img/cat404.mp4" autoPlay loop muted playsInline style={{ display: 'none' }} />
                <canvas ref={catCanvasRef} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                
                <div style={{ 
                  position: 'absolute', 
                  bottom: '15%', 
                  right: '5%', 
                  background: 'white', 
                  padding: '12px',
                  borderRadius: '16px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10
                }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--teal)', fontSize: '24px' }}>search</span>
                </div>
              </div>
              <div style={{ marginTop: '0', textAlign: 'center', position: 'relative', zIndex: 5 }}>
                <span style={{ fontSize: '4.5rem', fontWeight: '900', color: '#cdd9d9', letterSpacing: '-2px', opacity: 0.8 }}>LỖI 404</span>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'left' }}>
            <h2 style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--gray-400)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '16px' }}>
              KHÔNG TÌM THẤY TRANG
            </h2>
            <h1 style={{ fontSize: '4.5rem', fontWeight: '900', color: 'var(--ink)', lineHeight: 1.0, marginBottom: '24px', letterSpacing: '-2px' }}>
              Rất tiếc, trang này đã bị <span style={{ color: 'var(--teal)' }}>lạc</span> trong phòng khám.
            </h1>
            <p style={{ fontSize: '1.15rem', color: 'var(--gray-500)', lineHeight: 1.6, maxWidth: '450px', marginBottom: '48px', fontWeight: '500' }}>
              Có vẻ như đường dẫn bạn đang truy cập không chính xác. Ngay cả những bác sĩ giỏi nhất đôi khi cũng lạc đường.
            </p>
            
            <div style={{ display: 'flex', gap: '16px' }}>
              <button onClick={() => window.history.back()} style={{ 
                background: 'linear-gradient(135deg, #42d2bd 0%, #29b49f 100%)',
                color: 'white',
                fontWeight: '800',
                padding: '20px 36px',
                borderRadius: '20px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '1rem',
                boxShadow: '0 10px 20px rgba(41, 180, 159, 0.2)'
              }}>
                <span className="material-symbols-outlined">arrow_back</span>
                Quay lại trang trước
              </button>
              <button onClick={() => navigate('/')} style={{ 
                background: '#e6eeee',
                color: 'var(--ink)',
                fontWeight: '800',
                padding: '20px 36px',
                borderRadius: '20px',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '1rem'
              }}>
                <span className="material-symbols-outlined">home</span>
                Về Trang chủ
              </button>
            </div>

            <div style={{ marginTop: '64px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#d4ece9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--teal)' }}>help</span>
              </div>
              <span style={{ fontSize: '0.9rem', color: 'var(--gray-500)', fontWeight: '600' }}>
                Cần hỗ trợ tìm kiếm? <a href="#" style={{ color: 'var(--teal)', textDecoration: 'underline' }}>Liên hệ Hỗ trợ</a>
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
