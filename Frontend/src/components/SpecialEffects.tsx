import React, { useState, useEffect, useRef } from "react";
import Lottie from "lottie-react";
import { useLiveUserProfile } from "@hooks/useLiveUserProfile";

// Bộ nhớ đệm toàn cục (Global Cache) để lưu trữ dữ liệu JSON Lottie trên RAM, tránh tải lại nhiều lần
const lottieCache: Record<string, any> = {};

// * * TRÌNH PHÁT LOTTIE
export const LottiePlayer: React.FC<{ url: string, style?: React.CSSProperties }> = ({ url, style }) => {
  const [animationData, setAnimationData] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    if (lottieCache[url]) {
      setAnimationData(lottieCache[url]);
      return;
    }
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        lottieCache[url] = data;
        if (isMounted) setAnimationData(data);
      })
      .catch(() => {
        if (isMounted) setAnimationData(null);
      });
    return () => { isMounted = false; };
  }, [url]);

  if (!animationData) return <div style={style}></div>;
  return <Lottie animationData={animationData} loop={true} style={style} />;
};

// * * MÈO MEME (BANANA CAT)
export const MemeCat: React.FC = () => {
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
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
  const [isBubbleDismissed, setIsBubbleDismissed] = useState(false);
  const videoUrl = "/img/video_meo_chay.webm";
  const mousePosRef = useRef({ x: -1000, y: -1000 });
  const [isVisible, setIsVisible] = useState(true);

  const [trail, setTrail] = useState<{ id: number, x: number, y: number, rotation: number, image: string, age: number, size: number }[]>([]);
  const isSprintingRef = useRef(false);
  const trailIdCounter = useRef(0);
  const frameCountRef = useRef(0);
  const liveUser = useLiveUserProfile();

  useEffect(() => {
    const handleVisibilityChange = () => setIsVisible(!document.hidden);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    const userNamSinh = liveUser?.nam_sinh !== undefined && liveUser?.nam_sinh !== null
      ? Number(liveUser.nam_sinh)
      : null;
    const isGenZ = userNamSinh !== null && userNamSinh >= 1997;

    const baseMessages = isGenZ 
      ? [
          "Hi sen, Rexi mèo đang tuần tra nè! 🐾",
          "Boss khỏe là Rexi vui liền á! ✨",
          "Nhớ đặt lịch khám cho boss nha!",
          "Đang chạy KPI chăm boss nè meow... 🙀",
          "Pate đâu rồi sen? Boss hỏi nhẹ đó! 🐟",
          "Sen ơi, boss đói rồi, check bữa ăn chưa? 😾",
          "Chạy nhanh để kịp lịch khám cho boss! 🏃‍♂️💨",
          "Bác sĩ dặn rồi, súp thưởng cũng phải đúng cữ nha! 🩺",
          "Thấy Rexi chạy lẹ không? Đặt lịch cũng lẹ vậy á! 🐾",
          "Boss cần bàn cào móng mới chưa sen? 😿",
          "Lạc đường hả sen? Rexi dẫn tới đúng trang nè! 🧭",
          "Cấp cứu là nghiêm túc nha: gọi 0353.374.156 liền! 🚑",
          "Boss rụng lông nhiều thì mình đặt lịch khám nha! 🙀"
        ]
      : [
          "Rexi kính chào anh/chị! 🐾",
          "Rexi luôn sẵn sàng hỗ trợ chăm sóc thú cưng. ✨",
          "Anh/chị đừng quên lịch khám định kỳ cho thú cưng.",
          "Kính chúc anh/chị và các bé luôn khỏe mạnh. ❤️",
          "Hôm nay thú cưng của anh/chị ăn uống ổn định chứ ạ? 🐟",
          "Cần hỗ trợ thú y, Rexi luôn sẵn sàng. 🩺",
          "Rexi đang kiểm tra hệ thống hỗ trợ anh/chị. 🏃‍♂️💨",
          "Rexi đồng hành cùng sức khỏe thú cưng của gia đình. 🐾",
          "Chăm sóc chu đáo như một thành viên thân yêu. 🥰",
          "Đặt lịch online nhanh chóng và thuận tiện. 📅",
          "Cần tư vấn khẩn cấp, vui lòng liên hệ Rexi ngay. 🩺",
          "Hotline hỗ trợ nhanh: 0353.374.156. 🚑",
          "Chăm sóc tận tâm, nâng niu từng bé thú cưng. 🐱🐶"
        ];

    const interval = setInterval(() => {
      if (!isVisible || (isMobile && isBubbleDismissed)) return;
      const randomMsg = baseMessages[Math.floor(Math.random() * baseMessages.length)];
      setMessage(randomMsg);
      setTimeout(() => setMessage(""), 3500);
    }, 15000);
    return () => clearInterval(interval);
  }, [isVisible, isMobile, isBubbleDismissed, liveUser?.nam_sinh]);

  useEffect(() => {
    let sprintTimeout: number;
    let checkInterval: number;

    const triggerSprint = () => {
      if (!isVisible) return;
      isSprintingRef.current = true;
      sprintTimeout = window.setTimeout(() => {
        isSprintingRef.current = false;
      }, Math.random() * 1500 + 1000);
    };

    const scheduleNextCheck = () => {
      checkInterval = window.setTimeout(() => {
        if (Math.random() > 0.7) triggerSprint();
        scheduleNextCheck();
      }, Math.random() * 4000 + 3000);
    };

    scheduleNextCheck();

    return () => {
      clearTimeout(sprintTimeout);
      clearTimeout(checkInterval);
    };
  }, [isVisible]);

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

      if (video.currentTime < 0.2) video.currentTime = 0.2;
      if (video.duration > 0 && video.currentTime > video.duration - 0.2) video.currentTime = 0.2;

      if (video.readyState >= 2) {
        if (!videoReadyRef.current) { videoReadyRef.current = true; setShowCanvas(true); }

        const baseSize = Math.max(65, Math.min(120, window.innerWidth * 0.075));
        const targetSize = isSprintingRef.current ? baseSize * 0.7 : baseSize;
        const size = pos.size + (targetSize - pos.size) * 0.1;
        const intSize = Math.round(size);

        if (canvas.width !== intSize) { canvas.width = intSize; canvas.height = intSize; }

        ctx.clearRect(0, 0, intSize, intSize);
        const videoRatio = video.videoHeight / video.videoWidth;
        let drawW = intSize, drawH = intSize * videoRatio;
        if (drawH > intSize) { drawH = intSize; drawW = intSize / videoRatio; }
        ctx.drawImage(video, (intSize - drawW) / 2, (intSize - drawH) / 2, drawW, drawH);

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

        const isSprinting = isSprintingRef.current;
        const currentSpeed = isHovered ? baseSpeed * 0.25 : (isSprinting ? baseSpeed * 2.8 : baseSpeed);
        video.playbackRate = isHovered ? 0.45 : (isSprinting ? 2.8 : 1.95);

        if (isSprinting) {
          frameCountRef.current += 1;
          if (frameCountRef.current % 3 === 0) {
            const snapshot = canvas.toDataURL('image/webp', 0.3);
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

  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1280;
  const edgeGap = isMobile ? 8 : 16;
  const bubbleWidth = Math.min(
    isMobile ? 132 : 190,
    Math.max(isMobile ? 104 : 138, pos.size * (isMobile ? 1.42 : 1.52))
  );
  const catCenterX = pos.x + pos.size / 2;
  const bubbleLeft = Math.min(
    Math.max(catCenterX - bubbleWidth / 2, edgeGap),
    viewportWidth - bubbleWidth - edgeGap
  );
  const bubbleTailX = Math.min(
    Math.max(catCenterX - bubbleLeft, isMobile ? 18 : 24),
    bubbleWidth - (isMobile ? 18 : 24)
  );
  const bubbleBelowCat = pos.y < (isMobile ? 72 : 96);
  const bubbleTop = bubbleBelowCat
    ? pos.y + pos.size + Math.max(8, pos.size * 0.08)
    : pos.y - (isMobile ? 56 : 70);

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
      {message && !(isMobile && isBubbleDismissed) && (
        <div className="cat-bubble-animate" style={{
          position: 'fixed', zIndex: 999999,
          top: bubbleTop,
          left: bubbleLeft,
          width: bubbleWidth,
          boxSizing: 'border-box',
          background: 'var(--surface)',
          backdropFilter: 'blur(12px)',
          padding: isMobile ? '5px 9px' : '8px 12px',
          borderRadius: isMobile ? '14px' : '18px',
          border: '1.5px solid var(--primary)',
          color: 'var(--primary)',
          fontWeight: 700,
          fontSize: isMobile ? '0.72rem' : (message.length > 30 ? '0.78rem' : '0.85rem'),
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          letterSpacing: '0.3px',
          textShadow: '0px 1px 2px rgba(0,0,0,0.15)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '4px',
          textAlign: 'center',
          wordBreak: 'break-word',
          lineHeight: '1.25',
          transform: 'translateZ(0)'
        }}>
          {isMobile && (
            <button
              type="button"
              className="cat-bubble-close"
              aria-label="Đóng bong bóng chat mèo chuối"
              onClick={(event) => {
                event.stopPropagation();
                setIsBubbleDismissed(true);
                setMessage("");
              }}
            >
              x
            </button>
          )}
          <span className="material-symbols-outlined" style={{ fontSize: isMobile ? '14px' : '18px', opacity: 0.7 }}>pets</span>
          {message}
          {bubbleBelowCat ? (
            <div style={{
              position: 'absolute',
              top: isMobile ? '-5px' : '-7px',
              left: `${bubbleTailX}px`,
              transform: 'translateX(-50%)',
              width: 0, height: 0,
              borderLeft: isMobile ? '5px solid transparent' : '7px solid transparent',
              borderRight: isMobile ? '5px solid transparent' : '7px solid transparent',
              borderBottom: isMobile ? '5px solid var(--primary)' : '7px solid var(--primary)',
            }} />
          ) : (
            <div style={{
              position: 'absolute',
              bottom: isMobile ? '-5px' : '-7px',
              left: `${bubbleTailX}px`,
              transform: 'translateX(-50%)',
              width: 0, height: 0,
              borderLeft: isMobile ? '5px solid transparent' : '7px solid transparent',
              borderRight: isMobile ? '5px solid transparent' : '7px solid transparent',
              borderTop: isMobile ? '5px solid var(--primary)' : '7px solid var(--primary)',
            }} />
          )}
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
          .cat-bubble-close {
            position: absolute;
            top: -5px;
            right: -5px;
            width: 15px;
            height: 15px;
            border: 1px solid rgba(15, 157, 138, 0.18);
            border-radius: 999px;
            background: var(--surface);
            color: var(--primary);
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0;
            font-size: 9px;
            font-weight: 950;
            line-height: 1;
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(15, 23, 42, 0.12);
            -webkit-tap-highlight-color: transparent;
          }
          .cat-bubble-close:active {
            transform: scale(0.94);
          }
          [data-theme='dark'] .cat-bubble-close {
            background: rgba(15, 23, 42, 0.96);
            border-color: rgba(34, 211, 238, 0.36);
            color: #22d3ee;
          }
          @keyframes bananaAuraPulse {
            0%, 100% { filter: none; }
            50% { filter: none; }
          }
          @keyframes bananaAuraWave {
            0% { opacity: 0; transform: translate(-50%, -50%) scale(0.6); }
            18% { opacity: 0.16; }
            76%, 100% { opacity: 0; transform: translate(-50%, -50%) scale(1.18); }
          }
          @keyframes bananaAuraPulseDark {
            0%, 100% {
              filter:
                drop-shadow(0 0 5px rgba(250, 204, 21, 0.35))
                drop-shadow(0 0 10px rgba(245, 158, 11, 0.22));
            }
            50% {
              filter:
                drop-shadow(0 0 11px rgba(251, 191, 36, 0.72))
                drop-shadow(0 0 20px rgba(245, 158, 11, 0.36));
            }
          }
          .banana-cat-aura {
            isolation: isolate;
            overflow: visible;
            animation: none;
          }
          .banana-cat-aura::before,
          .banana-cat-aura::after {
            content: "";
            position: absolute;
            left: 50%;
            top: 50%;
            width: 54%;
            height: 54%;
            border-radius: 999px;
            border: 1px solid rgba(250, 204, 21, 0.08);
            box-shadow: 0 0 8px rgba(245, 158, 11, 0.08), inset 0 0 8px rgba(254, 240, 138, 0.06);
            pointer-events: none;
            transform: translate(-50%, -50%);
            z-index: -1;
            animation: none;
          }
          .banana-cat-aura::after {
            width: 70%;
            height: 70%;
            border-color: rgba(251, 191, 36, 0.06);
            animation-delay: 0.65s;
          }
          [data-theme='dark'] .banana-cat-aura {
            animation: bananaAuraPulseDark 2.25s ease-in-out infinite;
          }
          [data-theme='dark'] .banana-cat-aura::before,
          [data-theme='dark'] .banana-cat-aura::after {
            animation: bananaAuraWave 2.6s ease-out infinite;
          }
          [data-theme='dark'] .banana-cat-aura::before {
            border-color: rgba(250, 204, 21, 0.16);
            box-shadow: 0 0 10px rgba(245, 158, 11, 0.12), inset 0 0 10px rgba(254, 240, 138, 0.08);
          }
          [data-theme='dark'] .banana-cat-aura::after {
            border-color: rgba(251, 191, 36, 0.1);
          }
          .banana-cat-aura-sprint::before,
          .banana-cat-aura-sprint::after {
            animation-duration: 2s;
          }
          [data-theme='light'] .banana-cat-canvas,
          :root:not([data-theme='dark']) .banana-cat-canvas {
            filter:
              contrast(1.18)
              brightness(1.08)
              saturate(1.16)
              drop-shadow(0 5px 10px rgba(0,0,0,0.24)) !important;
          }
        `}</style>

      {trail.map((t) => (
        <React.Fragment key={t.id}>
          <div style={{
            position: 'fixed', top: t.y + t.size / 2, left: t.x + t.size / 2,
            width: `${t.size * 1.5}px`, height: `${t.size * 0.15}px`,
            zIndex: 9997 - t.age, pointerEvents: 'none',
            transform: `translate(-50%, -50%) rotate(${t.rotation}deg) translateX(${t.size * 0.75}px)`,
            opacity: 0.5 * (1 - t.age / 6),
            background: 'linear-gradient(90deg, rgba(250, 204, 21, 0.9) 0%, rgba(251, 191, 36, 0.32) 48%, rgba(255,255,255,0) 100%)',
            filter: `blur(${t.age * 0.5 + 2}px)`,
            mixBlendMode: 'screen',
            borderRadius: '50px'
          }} />

          <img src={t.image} alt="trail" style={{
            position: 'fixed', top: t.y, left: t.x,
            width: `${t.size}px`, height: `${t.size}px`,
            zIndex: 9998 - t.age, pointerEvents: 'none', transform: `rotate(${t.rotation}deg)`,
            opacity: 0.4 * (1 - t.age / 6),
            filter: `blur(${t.age * 1}px) brightness(1.12) saturate(1.7) sepia(0.24) drop-shadow(0 0 12px rgba(250, 204, 21, 0.48))`,
            mixBlendMode: 'lighten',
          }} />
        </React.Fragment>
      ))}

      <div className={`banana-cat-aura ${isSprintingRef.current ? 'banana-cat-aura-sprint' : ''}`} style={{
        position: 'fixed', top: pos.y, left: pos.x,
        width: `${pos.size}px`,
        height: `${pos.size * (canvasRef.current ? (canvasRef.current.height / canvasRef.current.width) : 1)}px`,
        zIndex: 9999, pointerEvents: 'none', transform: `rotate(${pos.rotation}deg)`,
        display: (pos.x === -200 || !showCanvas) ? 'none' : 'block',
        transition: 'filter 0.1s ease'
      }}>
        <canvas ref={canvasRef} className="banana-cat-canvas" style={{
          width: '100%',
          height: '100%',
          imageRendering: 'auto',
          filter: `
            contrast(1.18) 
            brightness(1.12) 
            saturate(1.28) 
            drop-shadow(0 5px 10px rgba(0,0,0,0.28))
            drop-shadow(0 0 12px rgba(250, 204, 21, 0.95))
            drop-shadow(0 0 28px rgba(245, 158, 11, 0.62))
            drop-shadow(0 0 46px rgba(251, 191, 36, 0.34))
            ${isSprintingRef.current ? 'blur(2px)' : ''}
          `,
          transition: 'filter 0.1s ease'
        }} />
      </div>
    </>
  );
};

type TransparentVideoVariant = 'banner-dog' | 'banner-cat' | 'footer-cat' | 'generic';

type BannerCopyRegion = { minX: number; maxX: number; minY: number; maxY: number };

const BANNER_COPY_REGION: BannerCopyRegion = { minX: 0.08, maxX: 0.99, minY: 0.00, maxY: 0.52 };

const isBannerDarkFrame = (data: Uint8ClampedArray): boolean => {
  let sampled = 0;
  let darkSamples = 0;
  for (let i = 0; i < data.length; i += 64) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const brightness = (r + g + b) / 3;
    const greenScore = g - Math.max(r, b);
    sampled++;
    if (brightness < 24 && greenScore < 18) darkSamples++;
  }
  return sampled > 0 && darkSamples / sampled > 0.82;
};

const removeEmbeddedBannerText = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  region: BannerCopyRegion
) => {
  for (let i = 0; i < data.length; i += 4) {
    const pixelIndex = i / 4;
    const x = pixelIndex % width;
    const y = Math.floor(pixelIndex / width);
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const greenScore = g - Math.max(r, b);
    const brightness = (r + g + b) / 3;
    const isInDeepCopyBand = y <= height * 0.38;
    const isDarkTextOrIcon = greenScore < 32
      && (brightness < 110 || (isInDeepCopyBand && brightness < 210));
    const isInTextRegion = x >= width * region.minX
      && x <= width * region.maxX
      && y >= height * region.minY
      && y <= height * region.maxY;

    if (isDarkTextOrIcon && isInTextRegion) {
      data[i + 3] = 0;
    }
  }
};

type BannerPetTune = {
  brightProtectFrom: number;
  brightSpillGreenMax: number;
  minDiff: number;
  hardCutFrom: number;
};

const BANNER_DOG_TUNE: BannerPetTune = {
  brightProtectFrom: 138,
  brightSpillGreenMax: 22,
  minDiff: 3.0,
  hardCutFrom: 11,
};

const BANNER_CAT_TUNE: BannerPetTune = {
  brightProtectFrom: 118,
  brightSpillGreenMax: 24,
  minDiff: 3.0,
  hardCutFrom: 11,
};

/** Banner chó/mèo — key sắc, không feather (tránh nhòe). */
const processBannerPetPixels = (data: Uint8ClampedArray, tune: BannerPetTune) => {
  const { brightProtectFrom, brightSpillGreenMax, minDiff, hardCutFrom } = tune;
  const edgeSpan = 7;

  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;

    const r = data[i], g = data[i + 1], b = data[i + 2];
    const greenScore = g - Math.max(r, b);
    const brightness = (r + g + b) / 3;
    const maxNonGreen = Math.max(r, b);

    if (greenScore >= hardCutFrom) {
      data[i + 3] = 0;
      continue;
    }

    if (brightness > brightProtectFrom) {
      if (greenScore > 0 && greenScore <= brightSpillGreenMax) {
        data[i + 1] = maxNonGreen;
      }
      if (greenScore <= minDiff) {
        data[i + 3] = 255;
      }
      continue;
    }

    if (greenScore > minDiff) {
      const alpha = 1 - Math.min((greenScore - minDiff) / edgeSpan, 1);
      data[i + 3] = Math.round(alpha * 255);
      if (alpha < 1) {
        data[i + 1] = Math.round(g * alpha + maxNonGreen * (1 - alpha));
      }
    }
  }
};

const getBannerCanvasSize = (video: HTMLVideoElement) => {
  const dpr = window.devicePixelRatio || 1;
  const renderScale = Math.min(Math.max(dpr, 1.25), 2);
  return {
    width: Math.round(video.videoWidth * renderScale),
    height: Math.round(video.videoHeight * renderScale),
    renderScale,
  };
};

/** Footer mèo — giữ nguyên logic cũ. */
const processFooterCatPixels = (data: Uint8ClampedArray) => {
  const minDiff = 3.0;
  const maxDiff = 16.0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const greenScore = g - Math.max(r, b);
    const brightness = (r + g + b) / 3;

    if (greenScore > minDiff) {
      const alpha = 1 - Math.min((greenScore - minDiff) / (maxDiff - minDiff), 1);
      if (alpha < 1) {
        data[i + 1] = Math.round(g * alpha + Math.max(r, b) * (1 - alpha));
      }
      data[i + 3] = Math.min(data[i + 3], Math.round(alpha * 255));
    }

    if (r < 20 && g < 20 && b < 20) {
      data[i + 3] = 0;
    } else if (greenScore > -3.5 && brightness >= 35 && brightness < 70) {
      const catEdgeAlpha = Math.min(Math.max((brightness - 12) / 58, 0), 1);
      data[i + 3] = Math.round(data[i + 3] * catEdgeAlpha);
    }
  }
};

/** Trang 404 / fallback — key đơn giản, tách khỏi banner. */
const processGenericPixels = (data: Uint8ClampedArray) => {
  const minDiff = 2.5;
  const maxDiff = 15.0;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const greenScore = g - Math.max(r, b);
    const brightness = (r + g + b) / 3;

    if (greenScore > minDiff) {
      const alpha = 1 - Math.min((greenScore - minDiff) / (maxDiff - minDiff), 1);
      if (alpha < 1) {
        data[i + 1] = Math.round(g * alpha + Math.max(r, b) * (1 - alpha));
      }
      data[i + 3] = Math.min(data[i + 3], Math.round(alpha * 255));
    } else if (greenScore > -3 && brightness >= 35 && brightness < 52) {
      const edgeAlpha = Math.min(Math.max((brightness - 15) / 37, 0), 1);
      data[i + 3] = Math.round(data[i + 3] * edgeAlpha);
    }
  }
};

export const TransparentVideo: React.FC<{ 
  src: string, 
  style?: React.CSSProperties, 
  className?: string, 
  playbackRate?: number, 
  isDark?: boolean, 
  loop?: boolean, 
  muted?: boolean, 
  onEnded?: () => void, 
  removeBlack?: boolean,
  isCat?: boolean,
  variant?: TransparentVideoVariant,
  onVideoTime?: (currentTime: number, duration: number) => void
}> = ({ src, style, className, playbackRate = 1, isDark = false, loop = true, muted = true, onEnded, removeBlack = false, isCat = false, variant, onVideoTime }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [inView, setInView] = useState(false);
  const lastTimeNotifyRef = useRef(0);

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
        if (onVideoTime && Math.abs(video.currentTime - lastTimeNotifyRef.current) > 0.08) {
          lastTimeNotifyRef.current = video.currentTime;
          onVideoTime(video.currentTime, video.duration || 0);
        }

        const effectiveVariant: TransparentVideoVariant = variant ?? (isCat ? 'footer-cat' : 'generic');
        const isBannerVideo = effectiveVariant === 'banner-dog' || effectiveVariant === 'banner-cat';

        let canvasWidth: number;
        let canvasHeight: number;
        let bannerRenderScale = 1;

        if (isBannerVideo) {
          const bannerSize = getBannerCanvasSize(video);
          canvasWidth = bannerSize.width;
          canvasHeight = bannerSize.height;
          bannerRenderScale = bannerSize.renderScale;
        } else {
          const dpr = window.devicePixelRatio || 1;
          const scale = Math.min(Math.max(dpr, 1.2), 1.3);
          const baseWidth = Math.min(video.videoWidth, 1024);
          canvasWidth = Math.round(baseWidth * scale);
          canvasHeight = Math.round((video.videoHeight / video.videoWidth) * baseWidth * scale);
        }

        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = bannerRenderScale !== 1;
        ctx.imageSmoothingQuality = 'high';
        
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = frame.data;
        const width = canvas.width;
        const height = canvas.height;

        if (isBannerVideo && isBannerDarkFrame(data)) {
          ctx.clearRect(0, 0, width, height);
          animationFrameId = requestAnimationFrame(processFrame);
          return;
        }

        if (effectiveVariant === 'banner-dog') {
          removeEmbeddedBannerText(data, width, height, BANNER_COPY_REGION);
          processBannerPetPixels(data, BANNER_DOG_TUNE);
        } else if (effectiveVariant === 'banner-cat') {
          removeEmbeddedBannerText(data, width, height, BANNER_COPY_REGION);
          processBannerPetPixels(data, BANNER_CAT_TUNE);
        } else if (effectiveVariant === 'footer-cat') {
          processFooterCatPixels(data);
        } else {
          processGenericPixels(data);
        }

        ctx.putImageData(frame, 0, 0);
      }
      animationFrameId = requestAnimationFrame(processFrame);
    };

    animationFrameId = requestAnimationFrame(processFrame);
    return () => cancelAnimationFrame(animationFrameId);
  }, [src, inView, playbackRate, isDark, removeBlack, isCat, variant, onVideoTime]);

  return (
    <>
      <video
        ref={videoRef}
        src={inView ? src : ""}
        autoPlay
        loop={loop}
        muted={muted}
        playsInline
        onEnded={onEnded}
        style={{ display: 'none' }}
      />
      <canvas ref={canvasRef} className={className} style={{ ...style, background: 'transparent' }} />
    </>
  );
};

// * * CON TRỎ CHUỘT TÙY CHỈNH (HIỆU ỨNG REXI)
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

// * * NÚT CUỘN LÊN ĐẦU TRANG
export const ScrollToTop: React.FC = () => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const checkScroll = () => setShow(window.scrollY > 400);
    window.addEventListener("scroll", checkScroll, { passive: true });
    return () => window.removeEventListener("scroll", checkScroll);
  }, []);
  if (!show) return null;
  return (
    <button data-ai-id="button-specialeffects-bkru"
      className="scroll-to-top-glass"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      style={{
        position: "fixed", bottom: "30px", left: "30px", width: "56px", height: "56px", borderRadius: "50%",
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
      }}
    >
      <span className="material-symbols-outlined">arrow_upward</span>
    </button>
  );
};

// * * HIỆU ỨNG HIỆN DẦN KHI CUỘN TRANG (REVEAL)
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

// * * HIỆU ỨNG ĐÁNH MÁY CHỮ (TYPEWRITER)
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
    <span style={{
      color: "#0f9d8a",
      textShadow: "0 0 7px rgba(15, 157, 138, 0.46), 0 0 14px rgba(45, 212, 191, 0.24)",
      borderRight: "3px solid #0f9d8a",
      paddingRight: "4px",
      filter: "drop-shadow(0 0 2px rgba(15, 157, 138, 0.28))"
    }}>{text}</span>
  );
};
