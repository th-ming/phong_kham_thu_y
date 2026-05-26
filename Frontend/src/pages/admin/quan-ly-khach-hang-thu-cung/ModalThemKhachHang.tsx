import React from "react";
import { Modal } from "@components/CommonUI";

// Khai báo kiểu Props rõ ràng, an toàn để tránh lỗi TypeScript lúc build dự án.
interface ModalThemKhachHangProps {
  isOpen: boolean;
  onClose: () => void;
  khFormData: {
    ten_khach_hang: string;
    sdt: string;
    email: string;
    nam_sinh: string;
  };
  setKhFormData: React.Dispatch<React.SetStateAction<{
    ten_khach_hang: string;
    sdt: string;
    email: string;
    nam_sinh: string;
  }>>;
  onSubmit: (e: React.FormEvent) => void;
  isSaving: boolean;
}

export const ModalThemKhachHang: React.FC<ModalThemKhachHangProps> = ({
  isOpen,
  onClose,
  khFormData,
  setKhFormData,
  onSubmit,
  isSaving
}) => {
  return (
    // Modal glassmorphism cao cấp dùng chung của hệ thống.
    // Tách riêng ra đây để TIEP_TAN bấm nhanh khum làm giật giao diện chính của trang quản lý.
    <Modal isOpen={isOpen} onClose={onClose} title="Thêm chủ nuôi mới" maxWidth="450px">
      <div style={{ display: 'grid', gap: '20px' }}>
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: '20px' }}>
          
          <div style={{ display: 'grid', gap: '8px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)' }}>
              TÊN KHÁCH HÀNG <span style={{ color: '#ff4d4f' }}>*</span>
            </label>
            <input 
              data-ai-id="input-quanlykhachhangthucung-3mat" 
              required 
              className="btn" 
              style={{ background: 'var(--gray-50)', textAlign: 'left', cursor: 'text' }} 
              value={khFormData.ten_khach_hang} 
              onChange={e => setKhFormData({ ...khFormData, ten_khach_hang: e.target.value })} 
            />
          </div>

          <div style={{ display: 'grid', gap: '8px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)' }}>
              SỐ ĐIỆN THOẠI <span style={{ color: '#ff4d4f' }}>*</span>
            </label>
            <input 
              data-ai-id="input-quanlykhachhangthucung-3m6n" 
              required 
              className="btn" 
              style={{ background: 'var(--gray-50)', textAlign: 'left', cursor: 'text' }} 
              value={khFormData.sdt} 
              onChange={e => setKhFormData({ ...khFormData, sdt: e.target.value })} 
            />
          </div>

          <div style={{ display: 'grid', gap: '8px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)' }}>
              EMAIL (TÙY CHỌN)
            </label>
            <input 
              data-ai-id="input-quanlykhachhangthucung-j4ng" 
              className="btn" 
              style={{ background: 'var(--gray-50)', textAlign: 'left', cursor: 'text' }} 
              value={khFormData.email} 
              onChange={e => setKhFormData({ ...khFormData, email: e.target.value })} 
            />
          </div>

          {/* Trường Năm sinh siêu quan trọng để phân loại GENZ vs MATURE tức thì cho chatbot AI REXI */}
          <div style={{ display: 'grid', gap: '8px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)' }}>
              NĂM SINH (TÙY CHỌN)
            </label>
            <input 
              data-ai-id="input-quanlykhachhangthucung-namsinh" 
              type="number" 
              min="1920" 
              max={new Date().getFullYear()} 
              className="btn" 
              style={{ background: 'var(--gray-50)', textAlign: 'left', cursor: 'text' }} 
              value={khFormData.nam_sinh} 
              onChange={e => setKhFormData({ ...khFormData, nam_sinh: e.target.value })} 
              placeholder="VD: 1998 (Phân loại GenZ vs Mature)" 
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button 
              data-ai-id="button-quanlykhachhangthucung-30dl" 
              type="submit" 
              disabled={isSaving} 
              className="btn btn-primary btn-pill" 
              style={{ flex: 1 }}
            >
              {isSaving ? 'Đang lưu...' : 'Lưu thông tin'}
            </button>
            <button 
              data-ai-id="button-quanlykhachhangthucung-dgrc" 
              type="button" 
              onClick={onClose} 
              className="btn btn-pill" 
              style={{ flex: 1, background: 'var(--gray-100)', color: 'var(--ink)' }}
            >
              Hủy
            </button>
          </div>

        </form>
      </div>
    </Modal>
  );
};
