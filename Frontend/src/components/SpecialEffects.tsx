import React, { useState, useEffect, useRef } from "react";
import Lottie from "lottie-react";

// Bộ nhớ đệm toàn cục (Global Cache) để lưu trữ dữ liệu JSON Lottie trên RAM, tránh tải lại nhiều lần
const lottieCache: Record<string, any> = {};

/**
 * TRÌNH PHÁT LOTTIE
 */
export const LottiePlayer: React.FC<{ url: string, style?: React.CSSProperties }> = ({ url, style }) => {
  const [animationData, setAnimationData] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    if (lottieCache[url]) {
      setAnimationData(lottieCache[url]);
      return;
    }
    fetch(url)
      .then(res => res.json())
      .then(data => {
        lottieCache[url] = data;
        if (isMounted) setAnimationData(data);
      })
      .catch(err => console.error("Lỗi tải Lottie:", err));
    return () => { isMounted = false; };
  }, [url]);

  if (!animationData) return <div style={style}></div>;
  return <Lottie animationData={animationData} loop={true} style={style} />;
};

/**
 * MÈO MEME (BANANA CAT)
 */
export const MemeCat: React.FC = () => {
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    // TỐI ƯU THÔNG MINH: Chỉ hiện nếu mạng ngon (4G/5G)
    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    const isSlowNetwork = conn && (conn.saveData || ['slow-2g', '2g', '3g'].includes(conn.effectiveType));
    
    if (isSlowNetwork) setShouldRender(false);
    else setShouldRender(true);
  }, []);

  const isMobile = window.innerWidth <= 768;

  if (!shouldRender) return null;
  return <MemeCatCore isMobile={isMobile} />;
};

const MemeCatCore: React.FC<{ isMobile: boolean }> = ({ isMobile }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(true);
  const videoReadyRef = useRef(false);
  const [showCanvas, setShowCanvas] = useState(false);
  const [pos, setPos] = useState({ x: -200, y: -200, rotation: 0, size: isMobile ? 80 : 150 });
  const [message, setMessage] = useState("");
  const [videoUrl, setVideoUrl] = useState("/img/video_meo_chay.webm");
  const mousePosRef = useRef({ x: -1000, y: -1000 });
  const [isVisible, setIsVisible] = useState(true);

  const [trail, setTrail] = useState<{ id: number, x: number, y: number, rotation: number, image: string, age: number, size: number }[]>([]);
  const isSprintingRef = useRef(false);
  const trailIdCounter = useRef(0);
  const frameCountRef = useRef(0);

  // KIỂM TRA TRẠNG THÁI TAB TRÌNH DUYỆT
  useEffect(() => {
    const handleVisibilityChange = () => setIsVisible(!document.hidden);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // LỜI THOẠI NGẪU NHIÊN CỦA BOSS
  useEffect(() => {
    const baseMessages = [
      "Meow~ 🐾", "Rexi số 1 meow! ✨", "Nhớ đặt lịch khám nha!", "Đang chạy bộ nè meow... 🙀", "Pate đâu rồi sen? 🐟",
      "Sen ơi, trẫm đói! Đưa pate đây! 😾",
      "Chạy sút quần để trốn đi tắm nè meow! 🏃‍♂️💨",
      "Bác sĩ dặn rồi, ngày chỉ ăn 3 cữ súp thưởng thôi! 🩺",
      "Thấy trẫm chạy lẹ không? Tránh đường cho bổn cung! 🐾",
      "Trầm cảm vì sen nghèo không có tiền mua bàn cào móng... 😿",
      "Ủa đang ở đâu đây? Lạc đường mất tiêu rồi meow~ 🧭",
      "Cấp cứu! Bụng đói cồn cào! Gọi ***REMOVED***-VIETQR_ACCOUNT_NO lẹ! 🚑",
      "Bế trẫm đi Rexi khám lẹ, dạo này rụng lông quá! 🙀"
    ];
    const interval = setInterval(() => {
      if (!isVisible) return;
      const randomMsg = baseMessages[Math.floor(Math.random() * baseMessages.length)];
      setMessage(randomMsg);
      setTimeout(() => setMessage(""), 3500);
    }, 15000);
    return () => clearInterval(interval);
  }, [isVisible]);

  // CHẠY NHANH NGẪU NHIÊN (SPRINT) - KHÔNG CẦN CUỘN TRANG
  useEffect(() => {
    let sprintTimeout: number;
    let checkInterval: number;

    const triggerSprint = () => {
      if (!isVisible) return;
      isSprintingRef.current = true;
      // Phóng nhanh trong 1 đến 2.5 giây
      sprintTimeout = window.setTimeout(() => {
        isSprintingRef.current = false;
      }, Math.random() * 1500 + 1000);
    };

    const scheduleNextCheck = () => {
      checkInterval = window.setTimeout(() => {
        if (Math.random() > 0.7) triggerSprint(); // 30% cơ hội phóng nhanh
        scheduleNextCheck();
      }, Math.random() * 4000 + 3000); // Lặp lại ngẫu nhiên sau 3-7 giây
    };

    scheduleNextCheck();

    return () => {
      clearTimeout(sprintTimeout);
      clearTimeout(checkInterval);
    };
  }, [isVisible]);

  // TỐI ƯU HIỆU NĂNG 1: Tách sự kiện chuột ra riêng để không bị tháo lắp 60 lần/giây
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => { mousePosRef.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true, alpha: true });

    const baseSpeed = 4.8;
    let animationId: number;
    let lastRenderTime = 0;

    const render = (time: number) => {
      if (!ctx || !video || !isVisible) {
        animationId = requestAnimationFrame(render);
        return;
      }

      if (time - lastRenderTime < 16) {
        animationId = requestAnimationFrame(render);
        return;
      }
      lastRenderTime = time;

      if (video.paused) video.play().catch(() => { });

      // XỬ LÝ LẶP VIDEO MƯỢT MÀ
      if (video.currentTime < 0.2) video.currentTime = 0.2;
      if (video.duration > 0 && video.currentTime > video.duration - 0.2) video.currentTime = 0.2;

      if (video.readyState >= 2) {
        if (!videoReadyRef.current) { videoReadyRef.current = true; setShowCanvas(true); }

        const baseSize = Math.max(65, Math.min(120, window.innerWidth * 0.075));
        const targetSize = isSprintingRef.current ? baseSize * 0.7 : baseSize;
        const size = pos.size + (targetSize - pos.size) * 0.1; // Chuyển đổi kích thước mượt mà
        const intSize = Math.round(size);

        if (canvas.width !== intSize) { canvas.width = intSize; canvas.height = intSize; }

        ctx.clearRect(0, 0, intSize, intSize);
        const videoRatio = video.videoHeight / video.videoWidth;
        let drawW = intSize, drawH = intSize * videoRatio;
        if (drawH > intSize) { drawH = intSize; drawW = intSize / videoRatio; }
        ctx.drawImage(video, (intSize - drawW) / 2, (intSize - drawH) / 2, drawW, drawH);

        // TẨY PHÔNG XANH (GREEN SCREEN)
        const frame = ctx.getImageData(0, 0, intSize, intSize);
        const data = frame.data;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const maxRB = Math.max(r, b), diff = g - maxRB, luma = 0.299 * r + 0.587 * g + 0.114 * b;
          if (diff > 18) { data[i + 3] = 0; }
          else if ((luma > 160 && diff < 12) || (luma < 60 && diff < 15)) { if (g > maxRB) data[i + 1] = maxRB * 0.85; }
          else if (diff > 4) { data[i + 3] = Math.max(0, 255 * (1 - (diff - 4) / 14)); data[i + 1] = maxRB * 0.8; }
          else if (g > maxRB) data[i + 1] = maxRB;
        }
        ctx.putImageData(frame, 0, 0);

        const w = window.innerWidth, h = window.innerHeight;
        const offset = size * 0.2;
        let { x, y, rotation } = pos;

        const isHovered = mousePosRef.current.x >= x && mousePosRef.current.x <= x + size && mousePosRef.current.y >= y && mousePosRef.current.y <= y + size;

        // TỐC ĐỘ DI CHUYỂN VÀ TỐC ĐỘ PHÁT VIDEO DỰA TRÊN NGẪU NHIÊN
        const isSprinting = isSprintingRef.current;
        const currentSpeed = isHovered ? baseSpeed * 0.25 : (isSprinting ? baseSpeed * 2.8 : baseSpeed);
        video.playbackRate = isHovered ? 0.45 : (isSprinting ? 2.8 : 1.95);

        // CHỤP ẢNH TÀN ẢNH (SNAPSHOT) KHI ĐANG CHẠY NHANH
        if (isSprinting) {
          frameCountRef.current += 1;
          // TỐI ƯU HIỆU NĂNG 2: Giảm tải RAM bằng cách chỉ chụp tàn ảnh mỗi 3 frame
          if (frameCountRef.current % 3 === 0) {
            const snapshot = canvas.toDataURL('image/webp', 0.3); // Giảm chất lượng ảnh để tối ưu tốc độ
            trailIdCounter.current += 1;
            setTrail(prev => [{ id: trailIdCounter.current, x, y, rotation, image: snapshot, age: 0, size: intSize }, ...prev.map(t => ({ ...t, age: t.age + 1 })).filter(t => t.age < 6)]);
          }
        } else {
          setTrail(prev => prev.length > 0 ? prev.map(t => ({ ...t, age: t.age + 1 })).filter(t => t.age < 6) : []);
        }

        let side = Math.floor(rotation / 90);
        if (side === 0) { x -= currentSpeed; y = h - size + offset; if (x < -offset) { x = -offset; side = 1; } }
        else if (side === 1) { y -= currentSpeed; x = -offset; if (y < -offset) { y = -offset; side = 2; } }
        else if (side === 2) { x += currentSpeed; y = -offset; if (x > w - size + offset) { x = w - size + offset; side = 3; } }
        else if (side === 3) { y += currentSpeed; x = w - size + offset; if (y > h - size + offset) { y = h - size + offset; side = 0; } }

        setPos({ x, y, rotation: side * 90, size });
      }
      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isVisible, pos]);

  if (!active) return null;

  return (
    <>
      <video
        ref={videoRef}
        src={videoUrl}
        autoPlay
        loop
        muted
        playsInline
        style={{ display: 'none' }}
        onError={() => setActive(false)}
      />
      {message && (
        <div className="cat-bubble-animate" style={{
          position: 'fixed', zIndex: 999999,
          top: pos.y < 80 ? pos.y + pos.size + (isMobile ? 10 : 15) : pos.y - (isMobile ? 48 : 65),
          left: isMobile
            ? `clamp(10px, ${pos.x + pos.size / 2}px, calc(100vw - 150px))`
            : `clamp(20px, ${pos.x + pos.size / 2}px, calc(100vw - 250px))`,
          background: 'var(--surface)',
          backdropFilter: 'blur(12px)',
          padding: isMobile ? '6px 12px' : '10px 18px',
          borderRadius: isMobile ? '16px' : '22px',
          border: '1.5px solid var(--primary)',
          color: 'var(--primary)',
          fontWeight: 800,
          fontSize: isMobile ? '0.7rem' : (message.length > 30 ? '0.8rem' : '0.9rem'),
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          maxWidth: isMobile ? '130px' : '220px',
          textAlign: 'center',
          wordBreak: 'break-word',
          lineHeight: '1.3'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: isMobile ? '14px' : '18px', opacity: 0.7 }}>pets</span>
          {message}
          {/* Đuôi bong bóng chat */}
          <div style={{
            position: 'absolute',
            bottom: isMobile ? '-5px' : '-8px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: isMobile ? '5px solid transparent' : '8px solid transparent',
            borderRight: isMobile ? '5px solid transparent' : '8px solid transparent',
            borderTop: isMobile ? '5px solid var(--primary)' : '8px solid var(--primary)',
          }} />
        </div>
      )}

      <style>{`
          @keyframes darkBubblePulse {
            0%, 100% { border-color: rgba(34, 211, 238, 0.2); box-shadow: 0 8px 32px rgba(0,0,0,0.2); }
            50% { border-color: rgba(34, 211, 238, 1); box-shadow: 0 0 15px rgba(34, 211, 238, 0.6), 0 8px 32px rgba(0,0,0,0.2); }
          }
          [data-theme='dark'] .cat-bubble-animate {
            background: rgba(15, 23, 42, 0.85) !important;
            color: #22d3ee !important;
            animation: darkBubblePulse 1.8s infinite ease-in-out !important;
          }
        `}</style>

      {/* HIỂN THỊ CÁC TÀN ẢNH TRUY ĐUỔI (GHOST TRAIL) */}
      {trail.map((t) => (
        <React.Fragment key={t.id}>
          {/* VỆT SÁNG TRẮNG TỐC ĐỘ CAO (SPEED TRAIL) */}
          <div style={{
            position: 'fixed', top: t.y + t.size / 2, left: t.x + t.size / 2,
            width: `${t.size * 1.5}px`, height: `${t.size * 0.15}px`,
            zIndex: 9997 - t.age, pointerEvents: 'none',
            transform: `translate(-50%, -50%) rotate(${t.rotation}deg) translateX(${t.size * 0.75}px)`,
            opacity: 0.5 * (1 - t.age / 6),
            background: 'linear-gradient(90deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 100%)',
            filter: `blur(${t.age * 0.5 + 2}px)`,
            mixBlendMode: 'screen',
            borderRadius: '50px'
          }} />

          <img src={t.image} alt="trail" style={{
            position: 'fixed', top: t.y, left: t.x,
            width: `${t.size}px`, height: `${t.size}px`,
            zIndex: 9998 - t.age, pointerEvents: 'none', transform: `rotate(${t.rotation}deg)`,
            opacity: 0.4 * (1 - t.age / 6),
            filter: `blur(${t.age * 1}px) brightness(1.1) saturate(3) hue-rotate(${t.age * 60}deg)`,
            mixBlendMode: 'lighten',
          }} />
        </React.Fragment>
      ))}

      <canvas ref={canvasRef} style={{
        position: 'fixed', top: pos.y, left: pos.x,
        width: `${pos.size}px`,
        height: `${pos.size * (canvasRef.current ? (canvasRef.current.height / canvasRef.current.width) : 1)}px`,
        zIndex: 9999, pointerEvents: 'none', transform: `rotate(${pos.rotation}deg)`,
        display: (pos.x === -200 || !showCanvas) ? 'none' : 'block',
        imageRendering: 'auto',
        filter: `
          contrast(1.15) 
          brightness(1.1) 
          saturate(1.2) 
          drop-shadow(0 5px 10px rgba(0,0,0,0.3))
          drop-shadow(0 0 15px rgba(15, 157, 138, 0.8)) 
          drop-shadow(0 0 30px rgba(15, 157, 138, 0.4))
          ${isSprintingRef.current ? `blur(2px)` : ''}
        `,
        transition: 'filter 0.1s ease'
      }} />
    </>
  );
};

/**
 * TRÌNH PHÁT VIDEO NỀN TRONG SUỐT (TÍCH HỢP TẨY PHÔNG XANH)
 */
export const TransparentVideo: React.FC<{ src: string, style?: React.CSSProperties, playbackRate?: number, isDark?: boolean }> = ({ src, style, playbackRate = 1, isDark = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0 });
    if (canvasRef.current) observer.observe(canvasRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current, canvas = canvasRef.current;
    if (!video || !canvas || !inView) return;

    video.playbackRate = playbackRate;
    video.play().catch(() => { });
    const ctx = canvas.getContext('2d', { willReadFrequently: true, alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    const processFrame = () => {
      if (video.paused || video.ended) { animationFrameId = requestAnimationFrame(processFrame); return; }

      if (video.videoWidth > 0) {
        canvas.width = Math.min(video.videoWidth, 1024);
        canvas.height = (video.videoHeight / video.videoWidth) * canvas.width;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = frame.data;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const idx = i / 4, py = (idx / canvas.width) | 0, px = idx % canvas.width;

          // TỰ ĐỘNG LÀM TRONG SUỐT CẠNH TRÊN/DƯỚI
          const isExtremeVerticalEdge = py < canvas.height * 0.02 || py > canvas.height * 0.98;
          if (isExtremeVerticalEdge && r < 45 && g < 45 && b < 45) {
            data[i + 3] = 0; continue;
          }

          const maxRB = Math.max(r, b), diff = g - maxRB, luma = 0.299 * r + 0.587 * g + 0.114 * b;
          const isTextArea = (py < canvas.height * 0.45) && (px > canvas.width * 0.40);

          // XỬ LÝ ĐẶC BIỆT CHO CHỮ TRÊN CHẾ ĐỘ TỐI (LÀM TRẮNG CHỮ)
          if (isDark && isTextArea && diff < 15 && luma < 240) {
            data[i] = 255; data[i + 1] = 255; data[i + 2] = 255; data[i + 3] = 255;
          } else if (diff > 20) { data[i + 3] = 0; }
          else if (diff > 5) { data[i + 3] = Math.max(0, 255 * (1 - (diff - 5) / 15)); data[i + 1] = maxRB * 0.7; }
          else if (g > maxRB) data[i + 1] = maxRB;
        }
        ctx.putImageData(frame, 0, 0);
      }
      animationFrameId = requestAnimationFrame(processFrame);
    };
    processFrame();
    return () => cancelAnimationFrame(animationFrameId);
  }, [src, playbackRate, inView, isDark]);

  return (
    <>
      <video
        ref={videoRef}
        src={inView ? src : ""}
        autoPlay
        loop
        muted
        playsInline
        style={{ display: 'none' }}
      />
      <canvas ref={canvasRef} style={{ ...style, background: 'transparent' }} />
    </>
  );
};

/**
 * CON TRỎ CHUỘT TÙY CHỈNH (HIỆU ỨNG REXI)
 */
export const CustomCursor: React.FC = () => {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [isHover, setIsHover] = useState(false);
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      const target = e.target as HTMLElement;
      setIsHover(window.getComputedStyle(target).cursor === 'pointer' || target.closest('a, button, .glass-card, input') !== null);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  return (
    <div style={{
      position: 'fixed', top: pos.y, left: pos.x,
      width: isHover ? '50px' : '20px', height: isHover ? '50px' : '20px',
      background: isHover ? 'rgba(15, 157, 138, 0.1)' : 'rgba(15, 157, 138, 0.5)',
      border: isHover ? '2px solid #0f9d8a' : 'none',
      borderRadius: '50%', transform: 'translate(-50%, -50%)',
      pointerEvents: 'none', zIndex: 99999, transition: 'all 0.3s'
    }} />
  );
};

/**
 * NÚT CUỘN LÊN ĐẦU TRANG
 */
export const ScrollToTop: React.FC = () => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const checkScroll = () => setShow(window.scrollY > 400);
    window.addEventListener("scroll", checkScroll, { passive: true });
    return () => window.removeEventListener("scroll", checkScroll);
  }, []);
  if (!show) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      style={{
        position: "fixed", bottom: "30px", left: "30px", width: "56px", height: "56px", borderRadius: "50%",
        background: "var(--surface)", color: "var(--primary)", border: "1px solid var(--gray-200)",
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        boxShadow: "var(--shadow-md)", backdropFilter: "var(--glass-blur)", transition: "all 0.3s"
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'var(--primary)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.color = 'var(--primary)'; e.currentTarget.style.background = 'var(--surface)'; }}
    >
      <span className="material-symbols-outlined">arrow_upward</span>
    </button>
  );
};

/**
 * HIỆU ỨNG HIỆN DẦN KHI CUỘN TRANG (REVEAL)
 */
export const RevealSection: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) setIsVisible(true); });
    }, { threshold: 0.1 });
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={sectionRef} style={{
      opacity: isVisible ? 1 : 0, transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
      transition: 'all 0.8s ease-out'
    }}>{children}</div>
  );
};

/**
 * HIỆU ỨNG ĐÁNH MÁY CHỮ (TYPEWRITER)
 */
export const Typewriter: React.FC<{ words: string[] }> = ({ words }) => {
  const [index, setIndex] = useState(0);
  const [text, setText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  useEffect(() => {
    let innerTimeout: number;
    const timeout = setTimeout(() => {
      const currentWord = words[index];
      if (isDeleting) setText(currentWord.substring(0, text.length - 1));
      else setText(currentWord.substring(0, text.length + 1));
      if (!isDeleting && text === currentWord) innerTimeout = window.setTimeout(() => setIsDeleting(true), 2000);
      else if (isDeleting && text === '') { setIsDeleting(false); setIndex((index + 1) % words.length); }
    }, isDeleting ? 40 : 100);
    return () => { clearTimeout(timeout); clearTimeout(innerTimeout); };
  }, [text, isDeleting, index, words]);
  return (
    <span style={{ color: "#0f9d8a", borderRight: "4px solid #0f9d8a", paddingRight: "4px" }}>{text}</span>
  );
};
