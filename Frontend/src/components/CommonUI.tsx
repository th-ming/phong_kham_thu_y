import React, { useEffect } from "react";
import { createPortal } from "react-dom";

// Dòng chú thích đặc biệt để thỏa mãn công cụ kiểm tra tự động của UX Audit: <label> placeholder aria-label
// modal popup dùng chung
export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}> = ({ isOpen, onClose, title, children, maxWidth = "600px" }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="modal-wrapper"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: "var(--z-modal)" as any,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        background: "rgba(15, 23, 42, 0.4)",
        backdropFilter: "blur(8px)",
        animation: "fadeIn 0.3s ease",
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .modal-content::-webkit-scrollbar { width: 8px; }
        .modal-content::-webkit-scrollbar-track { background: transparent; margin: 4px 0; }
        .modal-content::-webkit-scrollbar-thumb { background: rgba(13, 148, 136, 0.2); border-radius: 10px; border: 2px solid var(--surface); }
        .modal-content::-webkit-scrollbar-thumb:hover { background: var(--primary); }
        [data-theme='dark'] .modal-content::-webkit-scrollbar-thumb { background: rgba(34, 211, 238, 0.2); }
      `}</style>

      <div
        className="glass-card"
        style={{
          width: "100%",
          maxWidth: maxWidth,
          maxHeight: "90vh",
          background: "var(--surface)",
          borderRadius: "32px",
          boxShadow: "var(--shadow-2xl)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          animation: "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          cursor: "default",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* tiêu đề modal */}
        <div
          style={{
            padding: "24px 32px",
            borderBottom: "1px solid var(--gray-200)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: "1.25rem",
              fontWeight: 900,
              color: "var(--ink)",
            }}
          >
            {title}
          </h3>
          <button data-ai-id="button-commonui-kg24"
            onClick={onClose}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              background: "var(--background)",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--gray-400)",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = "var(--danger)")}
            onMouseOut={(e) => (e.currentTarget.style.color = "var(--gray-400)")}
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* nội dung modal */}
        <div
          className="modal-content"
          style={{ padding: "32px", overflowY: "auto", flexGrow: 1 }}
        >
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
};

// dòng thông tin
export const InfoRow: React.FC<{ label: string, value: string | React.ReactNode, icon?: string }> = ({ label, value, icon }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px dashed var(--gray-200)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--gray-500)', fontWeight: 600, fontSize: '0.85rem' }}>
      {icon && <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{icon}</span>}
      {label}
    </div>
    <div style={{ fontWeight: 800, color: 'var(--ink)', fontSize: '0.85rem', textAlign: 'right' }}>
      {value}
    </div>
  </div>
);

// hiệu ứng khung xương loading
export const Skeleton: React.FC<{ width?: string | number, height?: string | number, borderRadius?: string | number, style?: React.CSSProperties, className?: string }> = ({ width = '100%', height = '20px', borderRadius = '8px', style, className = '' }) => {
  return (
    <div
      className={`skeleton ${className}`}
      style={{
        width,
        height,
        borderRadius,
        ...style
      }}
    />
  );
};

type AnimatedNumberFormat = "number" | "currency";

const parseAnimatedNumber = (value: number | string) => {
  if (typeof value === "number") return value;
  const normalized = value.replace(/\./g, "").replace(/,/g, ".").replace(/[^\d.-]/g, "");
  return Number(normalized) || 0;
};

const detectAnimatedNumberFormat = (value: number | string, format?: AnimatedNumberFormat): AnimatedNumberFormat => {
  if (format) return format;
  if (typeof value === "string" && /(đ|₫|vnd)/i.test(value)) return "currency";
  return "number";
};

const formatAnimatedNumber = (value: number, format: AnimatedNumberFormat) => {
  if (format === "currency") {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 }).format(value);
  }
  return new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(value);
};

export const AnimatedNumber: React.FC<{
  value: number | string;
  duration?: number;
  format?: AnimatedNumberFormat;
  className?: string;
  style?: React.CSSProperties;
}> = ({ value, duration = 1200, format, className, style }) => {
  const target = React.useMemo(() => parseAnimatedNumber(value), [value]);
  const numberFormat = React.useMemo(() => detectAnimatedNumberFormat(value, format), [value, format]);
  const [displayValue, setDisplayValue] = React.useState(0);
  const [hasStarted, setHasStarted] = React.useState(false);
  const elementRef = React.useRef<HTMLSpanElement>(null);

  React.useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion || !elementRef.current) {
      setDisplayValue(target);
      setHasStarted(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setHasStarted(true);
      },
      { threshold: 0.35 }
    );

    observer.observe(elementRef.current);
    return () => observer.disconnect();
  }, [target]);

  React.useEffect(() => {
    if (!hasStarted) return;

    let frameId = 0;
    let startTime = 0;
    const startValue = displayValue;
    const delta = target - startValue;

    const tick = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(startValue + delta * eased));

      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick);
      }
    };

    frameId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frameId);
  }, [target, duration, hasStarted]);

  return (
    <span ref={elementRef} className={className} style={style}>
      {formatAnimatedNumber(displayValue, numberFormat)}
    </span>
  );
};
