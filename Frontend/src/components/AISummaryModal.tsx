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
      background: 'rgba(15, 23, 42, 0.35)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999,
      animation: 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { 
          from { transform: scale(0.96) translateY(8px); opacity: 0; } 
          to { transform: scale(1) translateY(0); opacity: 1; } 
        }
        @keyframes shimmer {
          0% { background-position: -468px 0; }
          100% { background-position: 468px 0; }
        }
        .skeleton {
          background: #edeef1;
          background-image: linear-gradient(to right, #edeef1 0%, #f4f4f7 20%, #edeef1 40%, #edeef1 100%);
          background-repeat: no-repeat;
          background-size: 800px 100px; 
          animation: shimmer 1.5s infinite linear;
          border-radius: 8px;
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.72) !important;
          backdrop-filter: blur(20px) !important;
          -webkit-backdrop-filter: blur(20px) !important;
          border: 1px solid rgba(255, 255, 255, 0.45) !important;
          box-shadow: 
            0 4px 6px -1px rgba(0, 0, 0, 0.05),
            0 20px 40px -15px rgba(15, 23, 42, 0.12),
            inset 0 1px 0 rgba(255, 255, 255, 0.6) !important;
        }

        [data-theme='dark'] .glass-card {
          background: rgba(15, 23, 42, 0.68) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          box-shadow: 
            0 10px 15px -3px rgba(0, 0, 0, 0.3),
            0 25px 60px -15px rgba(0, 0, 0, 0.55),
            inset 0 1px 0 rgba(255, 255, 255, 0.04) !important;
        }

        .summary-box {
          background: rgba(255, 255, 255, 0.35) !important;
          border: 1px solid rgba(255, 255, 255, 0.5) !important;
          color: #1e293b !important;
        }

        [data-theme='dark'] .summary-box {
          background: rgba(10, 15, 30, 0.25) !important;
          border: 1px solid rgba(255, 255, 255, 0.04) !important;
          color: #cbd5e1 !important;
        }

        [data-theme='dark'] .skeleton {
          background: #1e293b;
          background-image: linear-gradient(to right, #1e293b 0%, #334155 20%, #1e293b 40%, #1e293b 100%);
        }

        .close-btn {
          background: rgba(15, 23, 42, 0.04) !important;
          color: #64748b !important;
          transition: all 0.2s ease;
        }
        .close-btn:hover {
          background: rgba(15, 23, 42, 0.08) !important;
          color: #0f172a !important;
          transform: scale(1.05);
        }

        [data-theme='dark'] .close-btn {
          background: rgba(255, 255, 255, 0.05) !important;
          color: #94a3b8 !important;
        }
        [data-theme='dark'] .close-btn:hover {
          background: rgba(255, 255, 255, 0.1) !important;
          color: #f8fafc !important;
        }
      `}</style>
      <div className="glass-card" style={{
        padding: '36px', borderRadius: '28px',
        width: '90%', maxWidth: '650px',
        animation: 'scaleIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative',
        transition: 'background-color 0.4s ease, border-color 0.4s ease'
      }}>
        <button data-ai-id="button-aisummarymodal-2x0y" onClick={onClose} className="close-btn" style={{
          position: 'absolute', top: '24px', right: '24px',
          border: 'none', width: '36px', height: '36px', borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>close</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
          <div style={{
            width: '48px', height: '48px', background: 'var(--primary-light)', borderRadius: '16px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)',
            boxShadow: '0 8px 16px rgba(13, 148, 136, 0.15)'
          }}>
            <span className="material-symbols-outlined">auto_awesome</span>
          </div>
          <div>
            <h2 className="summary-title" style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: 'var(--ink)' }}>AI Tóm Tắt Bệnh Án</h2>
            <p style={{ margin: '4px 0 0 0', color: 'var(--gray-400)', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phân tích bởi Rexi AI (Gemini)</p>
          </div>
        </div>

        <div className="summary-box" style={{ 
          padding: '28px', 
          borderRadius: '20px', 
          minHeight: '160px',
          transition: 'background-color 0.4s ease, border-color 0.4s ease'
        }}>
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="skeleton" style={{ height: '18px', width: '100%' }}></div>
              <div className="skeleton" style={{ height: '18px', width: '92%' }}></div>
              <div className="skeleton" style={{ height: '18px', width: '96%' }}></div>
              <div className="skeleton" style={{ height: '18px', width: '78%' }}></div>
            </div>
          ) : (
            <div style={{ 
              lineHeight: '1.65', 
              fontWeight: 650, 
              fontSize: '1rem', 
              whiteSpace: 'pre-line',
              maxWidth: '65ch', // Khống chế độ rộng lý tưởng cho mắt khi đọc văn bản dài
              margin: '0 auto'
            }}>
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
