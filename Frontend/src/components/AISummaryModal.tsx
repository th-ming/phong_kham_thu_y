import React from 'react';
import { createPortal } from 'react-dom';

interface AISummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summary: string | null;
  loading: boolean;
}

const AISummaryModal: React.FC<AISummaryModalProps> = ({ isOpen, onClose, summary, loading }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999,
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes shimmer {
          0% { background-position: -468px 0; }
          100% { background-position: 468px 0; }
        }
        .skeleton {
          background: #f6f7f8;
          background-image: linear-gradient(to right, #f6f7f8 0%, #edeef1 20%, #f6f7f8 40%, #f6f7f8 100%);
          background-repeat: no-repeat;
          background-size: 800px 100px; 
          animation: shimmer 1.5s infinite linear;
          border-radius: 4px;
        }
      `}</style>
      <div className="glass-card" style={{
        background: 'white', padding: '32px', borderRadius: '24px',
        width: '90%', maxWidth: '600px',
        animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        position: 'relative',
        border: '1px solid var(--gray-100)'
      }}>
        <button data-ai-id="button-aisummarymodal-2x0y" onClick={onClose} style={{
          position: 'absolute', top: '24px', right: '24px', background: 'var(--gray-50)',
          border: 'none', width: '36px', height: '36px', borderRadius: '18px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'var(--gray-500)'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{
            width: '48px', height: '48px', background: 'var(--primary-light)', borderRadius: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)'
          }}>
            <span className="material-symbols-outlined">auto_awesome</span>
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: 'var(--ink)' }}>AI Tóm Tắt Bệnh Án</h2>
            <p style={{ margin: '4px 0 0 0', color: 'var(--gray-400)', fontSize: '0.9rem', fontWeight: 600 }}>Phân tích bởi Rexi AI (Gemini)</p>
          </div>
        </div>

        <div style={{ background: 'var(--gray-50)', padding: '24px', borderRadius: '16px', minHeight: '150px' }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="skeleton" style={{ height: '20px', width: '100%' }}></div>
              <div className="skeleton" style={{ height: '20px', width: '90%' }}></div>
              <div className="skeleton" style={{ height: '20px', width: '95%' }}></div>
              <div className="skeleton" style={{ height: '20px', width: '80%' }}></div>
            </div>
          ) : (
            <div style={{ lineHeight: 1.6, color: 'var(--ink)', fontWeight: 600, fontSize: '1.05rem', whiteSpace: 'pre-line' }}>
              {summary || "Không có dữ liệu tóm tắt."}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default AISummaryModal;
