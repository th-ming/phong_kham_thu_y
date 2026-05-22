import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

export interface ConfirmModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  message?: string;
}

// 1. Component Modal dùng chung với Glassmorphism Design chuẩn dự án
export const ConfirmModal: React.FC<ConfirmModalProps> = ({ open, onConfirm, onCancel, message }) => {
  if (!open) return null;

  return createPortal(
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(15, 23, 42, 0.4)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 'var(--z-modal)' as any,
      animation: 'fadeIn 0.3s ease'
    }}>
      <div className="glass-card" style={{
        padding: '32px',
        borderRadius: 'var(--radius-lg)',
        minWidth: '320px',
        maxWidth: '400px',
        textAlign: 'center',
        animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)',
          color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px auto'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>warning</span>
        </div>

        <h3 style={{ margin: '0 0 12px 0', fontSize: '1.25rem', fontWeight: 900, color: 'var(--ink)' }}>
          Xác nhận hành động
        </h3>

        <p style={{ margin: '0 0 24px 0', fontWeight: 600, color: 'var(--gray-500)', fontSize: '0.95rem' }}>
          {message || 'Bạn có chắc muốn thực hiện hành động này?'}
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button data-ai-id="button-confirmmodal-3fau"
            onClick={onCancel}
            className="btn btn-outline"
            style={{ flex: 1, padding: '12px' }}
          >
            Hủy
          </button>
          <button data-ai-id="button-confirmmodal-hrud"
            onClick={onConfirm}
            className="btn"
            style={{ flex: 1, padding: '12px', background: 'var(--danger)', color: 'white', border: 'none' }}
          >
            Đồng ý
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// 2. Cơ chế gọi Confirm Global cho AI Agent (Tương tự hệ thống Toast)
export const confirmAction = (message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    window.dispatchEvent(new CustomEvent('rexi-confirm-action', { detail: { message, resolve } }));
  });
};

export const GlobalConfirmModal: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [resolver, setResolver] = useState<(v: boolean) => void>();

  useEffect(() => {
    const handler = (e: any) => {
      setMessage(e.detail.message);
      setResolver(() => e.detail.resolve);
      setOpen(true);
    };
    window.addEventListener('rexi-confirm-action', handler);
    return () => window.removeEventListener('rexi-confirm-action', handler);
  }, []);

  return (
    <ConfirmModal
      open={open}
      message={message}
      onCancel={() => { setOpen(false); if (resolver) resolver(false); }}
      onConfirm={() => { setOpen(false); if (resolver) resolver(true); }}
    />
  );
};
