import React, { useEffect, useState, useRef } from 'react';

/**
 * MÀN HÌNH CHỜ (PRELOADER) "MÈO CHẠY" - ĐÃ SỬA LỖI MÉO VÀ NGƯỢC HƯỚNG
 * Khắc phục tỉ lệ khung hình và hướng chạy của mèo để trông tự nhiên nhất.
 */
export const Preloader: React.FC = () => {
    const [isVisible, setIsVisible] = useState(() => {
        // Chỉ hiện preloader khi vào trang lần đầu tiên trong phiên làm việc
        return !sessionStorage.getItem("rexi_preloader_loaded");
    });
    const [isExiting, setIsExiting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [message, setMessage] = useState("Đang đi mua pate...");
    
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const messages = [
        "Đang đi mua pate...",
        "Đang rượt đuổi lỗi...",
        "Chờ tí, đang liếm lông...",
        "Đang mài móng chuẩn bị đón khách...",
        "Đang tìm đồ chơi bị mất...",
        "Sắp xong rồi meow meow...",
        "Đang khởi tạo hệ thống chăm sóc..."
    ];

    useEffect(() => {
        const hasLoaded = sessionStorage.getItem("rexi_preloader_loaded");
        if (hasLoaded) {
            setIsVisible(false);
            return;
        }

        // Đánh dấu đã load lần đầu
        sessionStorage.setItem("rexi_preloader_loaded", "true");

        const msgInterval = setInterval(() => {
            setMessage(messages[Math.floor(Math.random() * messages.length)]);
        }, 1200);

        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) return 100;
                return prev + Math.random() * 12;
            });
        }, 80);

        const timer = setTimeout(() => {
            setIsExiting(true);
            setTimeout(() => setIsVisible(false), 400);
        }, 1200);

        return () => {
            clearInterval(msgInterval);
            clearInterval(interval);
            clearTimeout(timer);
        };
    }, []);

    useEffect(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        let animationFrameId: number;

        const processFrame = () => {
            if (video.paused || video.ended) {
                animationFrameId = requestAnimationFrame(processFrame);
                return;
            }

            if (video.videoWidth > 0) {
                // Giữ nguyên tỉ lệ khung hình để không bị méo
                const aspectRatio = video.videoWidth / video.videoHeight;
                const displayHeight = 150; 
                const displayWidth = displayHeight * aspectRatio;
                
                if (canvas.width !== video.videoWidth) {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                }

                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = frame.data;

                for (let i = 0; i < data.length; i += 4) {
                    const r = data[i], g = data[i + 1], b = data[i + 2];
                    const maxRB = Math.max(r, b);
                    const diff = g - maxRB;
                    if (diff > 15) data[i + 3] = 0;
                    else if (diff > 5) data[i + 3] = Math.max(0, 255 * (1 - (diff - 5) / 10));
                }
                ctx.putImageData(frame, 0, 0);
            }
            animationFrameId = requestAnimationFrame(processFrame);
        };

        video.play().catch(() => {});
        processFrame();
        
        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    if (!isVisible) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            background: 'var(--background)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            animation: isExiting ? 'preloader-exit-cat 0.4s cubic-bezier(0.85, 0, 0.15, 1) forwards' : 'none',
            overflow: 'hidden'
        }}>
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '400px' }}>
                
                {/* KHU VỰC MÈO CHẠY */}
                <div 
                    className="preloader-cat-container"
                    style={{ 
                        position: 'relative', 
                        width: '100%', 
                        height: '160px',
                        marginBottom: '10px'
                    }}
                >
                    <video
                        ref={videoRef}
                        src="/img/video_meo_chay.webm"
                        loop
                        muted
                        playsInline
                        style={{ display: 'none' }}
                    />
                    
                    <canvas
                        ref={canvasRef}
                        className="preloader-canvas"
                        style={{
                            height: '150px',
                            width: 'auto',
                            position: 'absolute',
                            // Chạy từ trái qua phải: Bắt đầu ở -50px, kết thúc ở calc(100% - 100px)
                            left: `calc(${progress}% - 75px)`, 
                            bottom: '0',
                            zIndex: 2,
                            filter: 'drop-shadow(0 10px 15px rgba(0,0,0,0.2))',
                            // QUAN TRỌNG: Lật ngược hình ảnh mèo nếu video gốc chạy ngược
                            transform: 'scaleX(-1)' 
                        }}
                    />

                    {/* Vệt bụi mờ dưới chân */}
                    <div 
                        className="preloader-dust"
                        style={{
                            position: 'absolute',
                            left: `calc(${progress}% - 50px)`,
                            bottom: '15px',
                            width: '60px',
                            height: '15px',
                            background: 'rgba(15, 157, 138, 0.15)',
                            borderRadius: '50%',
                            filter: 'blur(8px)',
                            animation: 'dust-cat 0.3s infinite'
                        }} 
                    />
                </div>

                {/* THANH TIẾN TRÌNH (CON ĐƯỜNG) */}
                <div 
                    className="preloader-road"
                    style={{
                        width: '320px',
                        height: '6px',
                        background: 'var(--gray-100)',
                        borderRadius: '20px',
                        overflow: 'hidden',
                        position: 'relative',
                        border: '1px solid var(--gray-200)'
                    }}
                >
                    <div style={{
                        position: 'absolute',
                        height: '100%',
                        width: `${progress}%`,
                        background: 'linear-gradient(90deg, #0f9d8a, #2dd4bf)',
                        borderRadius: '20px',
                        transition: 'width 0.3s ease-out'
                    }} />
                </div>

                <div style={{ marginTop: '25px', textAlign: 'center' }}>
                    <div 
                        className="preloader-message"
                        style={{ 
                            fontSize: '1.2rem', 
                            fontWeight: 950, 
                            color: 'var(--primary)',
                            marginBottom: '6px',
                            fontFamily: "'Inter', sans-serif"
                        }}
                    >
                        {message}
                    </div>
                    <div 
                        className="preloader-percentage"
                        style={{
                            fontSize: '0.85rem',
                            fontWeight: 800,
                            color: 'var(--gray-400)',
                            letterSpacing: '1.5px'
                        }}
                    >
                        {Math.round(progress)}% - LOADING...
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes preloader-exit-cat {
                    0% { transform: scale(1); opacity: 1; }
                    100% { transform: scale(1.05); opacity: 0; visibility: hidden; }
                }
                @keyframes dust-cat {
                    0%, 100% { transform: scale(1); opacity: 0.1; }
                    50% { transform: scale(1.3); opacity: 0.3; }
                }
                
                /* TỐI ƯU HÓA PHÂN TỈ LỆ RESPONSIVE CHO ĐIỆN THOẠI NHỎ (DƯỚI 480PX) */
                @media (max-width: 480px) {
                    .preloader-cat-container {
                        height: 110px !important;
                    }
                    .preloader-canvas {
                        height: 95px !important;
                        left: calc(${progress}% - 48px) !important;
                    }
                    .preloader-dust {
                        left: calc(${progress}% - 35px) !important;
                        bottom: 8px !important;
                        width: 40px !important;
                        height: 10px !important;
                    }
                    .preloader-road {
                        width: 240px !important;
                        height: 5px !important;
                    }
                    .preloader-message {
                        font-size: 0.95rem !important;
                    }
                    .preloader-percentage {
                        font-size: 0.75rem !important;
                    }
                }
            `}</style>
        </div>
    );
};
