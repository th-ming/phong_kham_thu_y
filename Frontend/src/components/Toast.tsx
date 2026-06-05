import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

// Object tiện ích để gọi toast từ bất kỳ đâu
export const toast = {
    success: (message: string, options?: any) => window.dispatchEvent(new CustomEvent('rexi-toast', { detail: { message, type: 'success', ...options } })),
    error: (message: string, options?: any) => window.dispatchEvent(new CustomEvent('rexi-toast', { detail: { message, type: 'error', ...options } })),
    info: (message: string, options?: any) => window.dispatchEvent(new CustomEvent('rexi-toast', { detail: { message, type: 'info', ...options } }))
};

export const ToastContainer: React.FC = () => {
    const [toasts, setToasts] = useState<any[]>([]);
    const isMobile = typeof window !== 'undefined' && window.innerWidth <= 640;

    useEffect(() => {
        const handleToast = (e: any) => {
            const id = Date.now();
            setToasts(prev => [...prev, { id, ...e.detail }]);

            // Tự động xóa thông báo sau 3 giây
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, 3000);
        };

        window.addEventListener('rexi-toast', handleToast);
        return () => window.removeEventListener('rexi-toast', handleToast);
    }, []);

    return createPortal(
        <div style={{
            position: 'fixed',
            top: isMobile ? '12px' : '30px',
            right: isMobile ? '12px' : '30px',
            left: isMobile ? '12px' : 'auto',
            zIndex: 'var(--z-toast)' as any,
            display: 'flex',
            flexDirection: 'column',
            gap: isMobile ? '8px' : '12px',
            pointerEvents: 'none'
        }}>
            {toasts.map(t => (
                <div key={t.id} style={{
                    padding: isMobile ? '12px 14px' : '18px 28px',
                    background: t.type === 'error' ? 'rgba(244, 63, 94, 0.9)' : t.type === 'success' ? 'rgba(13, 148, 136, 0.9)' : 'rgba(59, 130, 246, 0.9)',
                    backgroundImage: t.type === 'error' ? 'var(--accent-gradient)' : t.type === 'success' ? 'var(--primary-gradient)' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                    color: 'white',
                    borderRadius: isMobile ? '16px' : '20px',
                    boxShadow: t.type === 'error' ? '0 15px 30px rgba(244, 63, 94, 0.3)' : t.type === 'success' ? '0 15px 30px rgba(13, 148, 136, 0.3)' : '0 15px 30px rgba(59, 130, 246, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '16px',
                    width: isMobile ? '100%' : 'auto',
                    minWidth: isMobile ? 0 : '320px',
                    maxWidth: isMobile ? 'calc(100vw - 24px)' : '420px',
                    pointerEvents: 'none',
                    animation: 'toastSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards, toastFadeOut 0.5s cubic-bezier(0.16, 1, 0.3, 1) 2.5s forwards'
                }}>
                    <div style={{ background: 'rgba(255,255,255,0.2)', width: isMobile ? '32px' : '40px', height: isMobile ? '32px' : '40px', borderRadius: isMobile ? '10px' : '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: isMobile ? '20px' : '24px' }}>
                            {t.type === 'error' ? 'error' : t.type === 'success' ? 'check_circle' : 'info'}
                        </span>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 900, fontSize: isMobile ? '0.78rem' : '1rem', letterSpacing: '0.2px' }}>{t.type === 'error' ? 'THẤT BẠI' : t.type === 'success' ? 'THÀNH CÔNG' : 'THÔNG BÁO'}</div>
                        <div style={{ fontWeight: 600, fontSize: isMobile ? '0.78rem' : '0.9rem', lineHeight: isMobile ? 1.28 : 1.4, opacity: 0.9 }}>{t.message}</div>
                    </div>
                </div>
            ))}
            <style>{`
        @keyframes toastSlideIn { from { transform: translateX(120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes toastFadeOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(120%); opacity: 0; } }
      `}</style>
        </div>,
        document.body
    );
};
