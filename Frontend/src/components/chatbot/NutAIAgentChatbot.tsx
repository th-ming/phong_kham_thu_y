import React, { useEffect, useRef, useState } from "react";

const STORAGE_KEY = 'pageagent-btn-position';

const loadPosition = (): { x: number; y: number } | null => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const p = JSON.parse(raw);
        if (typeof p.x === 'number' && typeof p.y === 'number') return p;
    } catch {}
    return null;
};

const savePosition = (x: number, y: number) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ x, y })); } catch {}
};

export const NutAIAgentChatbot: React.FC<{
    isMobile: boolean;
    pageAgentVisible: boolean;
    onTogglePageAgent: () => void;
    onDismiss?: () => void;
}> = ({ isMobile, pageAgentVisible, onTogglePageAgent, onDismiss }) => {
    const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
    const [hovered, setHovered] = useState(false);
    const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
    const initRef = useRef(false);
    const lastClickRef = useRef(0);

    useEffect(() => {
        if (initRef.current) return;
        initRef.current = true;
        const saved = loadPosition();
        if (saved) {
            setPosition(saved);
        } else {
            const el = document.getElementById('chatWindow');
            if (el) {
                const r = el.getBoundingClientRect();
                setPosition({ x: r.left - 37, y: r.top + r.height / 2 - 20 });
            } else {
                setPosition({ x: window.innerWidth - 120, y: window.innerHeight / 2 });
            }
        }
    }, []);

    const handleDragStart = (clientX: number, clientY: number) => {
        if (!position) return;
        dragRef.current = { startX: clientX, startY: clientY, origX: position.x, origY: position.y };
        const handleMove = (ev: MouseEvent | TouchEvent) => {
            if (!dragRef.current) return;
            const cx = 'touches' in ev ? ev.touches[0].clientX : ev.clientX;
            const cy = 'touches' in ev ? ev.touches[0].clientY : ev.clientY;
            setPosition({
                x: dragRef.current.origX + cx - dragRef.current.startX,
                y: dragRef.current.origY + cy - dragRef.current.startY,
            });
        };
        const handleEnd = () => {
            if (dragRef.current && position) savePosition(position.x, position.y);
            dragRef.current = null;
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleEnd);
            document.removeEventListener('touchmove', handleMove);
            document.removeEventListener('touchend', handleEnd);
        };
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleEnd);
        document.addEventListener('touchmove', handleMove, { passive: false });
        document.addEventListener('touchend', handleEnd);
    };

    if (!position) return null;

    const sz = isMobile ? 32 : 36;
    const logoSize = Math.round(sz * 0.7);
    const logoLeft = Math.round((sz - logoSize) / 2);
    const gap = 10;
    const textW = isMobile ? 80 : 95;
    const textLeft = logoLeft + logoSize + gap;
    const doorW = logoLeft + logoSize + gap + textW + 6;

    return (
        <div
            style={{
                position: 'fixed',
                zIndex: 1102,
                left: hovered ? `${position.x - (doorW - sz)}px` : `${position.x}px`,
                top: `${position.y}px`,
                width: hovered ? `${doorW}px` : `${sz}px`,
                height: `${sz}px`,
                borderRadius: '8px',
                overflow: 'hidden',
                background: hovered ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.08)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: hovered ? '0 2px 12px rgba(0, 0, 0, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.12)',
                cursor: dragRef.current ? 'grabbing' : 'grab',
                userSelect: 'none',
                transition: dragRef.current ? 'none' : 'all 0.3s cubic-bezier(0.25, 1, 0.5, 1)',
            }}
            data-ai-id="button-toggle-pageagent"
            onClick={() => {
                if (dragRef.current) return;
                if (!pageAgentVisible && onDismiss) {
                    const now = Date.now();
                    if (now - lastClickRef.current < 400) {
                        onDismiss();
                        lastClickRef.current = 0;
                        return;
                    }
                    lastClickRef.current = now;
                }
                onTogglePageAgent();
            }}
            onMouseDown={(e) => { if (e.button !== 0) return; handleDragStart(e.clientX, e.clientY); }}
            onTouchStart={(e) => { handleDragStart(e.touches[0].clientX, e.touches[0].clientY); }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            title={pageAgentVisible ? 'Đóng PageAgent' : 'Mở PageAgent'}
            aria-label={pageAgentVisible ? 'Đóng PageAgent' : 'Mở PageAgent'}
        >
            <div style={{
                position: 'relative',
                width: '100%',
                height: '100%',
            }}>
                <span style={{
                    position: 'absolute',
                    left: `${textLeft}px`,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'white',
                    fontSize: isMobile ? '0.75rem' : '0.8rem',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    opacity: hovered ? 1 : 0,
                    transition: 'opacity 0.15s ease 0.1s',
                }}>
                    {pageAgentVisible ? 'Đóng Agent' : 'Mở Agent'}
                </span>
                <img
                    src="/pageagent-logo.webp"
                    alt=""
                    style={{
                        position: 'absolute',
                        left: `${logoLeft}px`,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: `${logoSize}px`,
                        height: `${logoSize}px`,
                    }}
                />
            </div>
        </div>
    );
};
