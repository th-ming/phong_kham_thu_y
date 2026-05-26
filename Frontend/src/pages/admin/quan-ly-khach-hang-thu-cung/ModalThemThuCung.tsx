import React from "react";
import { Modal } from "@components/CommonUI";

// Interface Props định nghĩa chặt chẽ để đảm bảo compiler không gắt lỗi.
interface ModalThemThuCungProps {
  isOpen: boolean;
  onClose: () => void;
  editingPetId: number | null;
  petFormData: {
    ten_thu_cung: string;
    loai: string;
    giong: string;
    gioi_tinh: string;
    mau_sac: string;
    trong_luong: string;
    ngay_sinh: string;
    id_khach_hang: string;
  };
  setPetFormData: React.Dispatch<React.SetStateAction<{
    ten_thu_cung: string;
    loai: string;
    giong: string;
    gioi_tinh: string;
    mau_sac: string;
    trong_luong: string;
    ngay_sinh: string;
    id_khach_hang: string;
  }>>;
  khachHang: any[];
  onSubmit: (e: React.FormEvent) => void;
  isSaving: boolean;
  petSelectStyle: React.CSSProperties;
  petFieldStyle: React.CSSProperties;
}

export const ModalThemThuCung: React.FC<ModalThemThuCungProps> = ({
  isOpen,
  onClose,
  editingPetId,
  petFormData,
  setPetFormData,
  khachHang,
  onSubmit,
  isSaving,
  petSelectStyle,
  petFieldStyle
}) => {
  return (
    // Modal đăng ký bé mới hoặc chỉnh sửa thông tin bé cưng.
    // Tách riêng ra để tránh làm phình file cha, dễ bảo trì logic form thú cưng sau này.
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={editingPetId ? "Cập nhật thú cưng" : "Đăng ký bé mới"} 
      maxWidth="620px"
    >
      <div style={{ display: 'grid', gap: '16px', width: '100%', overflowX: 'hidden' }}>
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: '16px' }}>
          
          {/* Chủ sở hữu - Link kết nối thú cưng sang KHACH_HANG cụ thể */}
          <div style={{ display: 'grid', gap: '8px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)' }}>
              CHỦ SỞ HỮU <span style={{ color: '#ff4d4f' }}>*</span>
            </label>
            <select 
              data-ai-id="select-quanlykhachhangthucung-nqxg" 
              required 
              className="btn" 
              style={petSelectStyle} 
              value={petFormData.id_khach_hang} 
              onChange={e => setPetFormData({ ...petFormData, id_khach_hang: e.target.value })}
            >
              <option value="">-- Chọn khách hàng --</option>
              {khachHang.map(kh => (
                <option key={kh.id_khach_hang} value={kh.id_khach_hang}>
                  {kh.ten_khach_hang} - {kh.sdt}
                </option>
              ))}
            </select>
          </div>

          <div className="responsive-grid-1-5-1">
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)' }}>
                TÊN BÉ <span style={{ color: '#ff4d4f' }}>*</span>
              </label>
              <input 
                data-ai-id="input-quanlykhachhangthucung-ub0z" 
                required 
                className="btn" 
                style={petFieldStyle} 
                value={petFormData.ten_thu_cung} 
                onChange={e => setPetFormData({ ...petFormData, ten_thu_cung: e.target.value })} 
              />
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)' }}>LOÀI</label>
              <select 
                data-ai-id="select-quanlykhachhangthucung-36r6" 
                className="btn" 
                style={petSelectStyle} 
                value={petFormData.loai} 
                onChange={e => setPetFormData({ ...petFormData, loai: e.target.value })}
              >
                <option value="Chó">Chó</option>
                <option value="Mèo">Mèo</option>
                <option value="Khác">Khác</option>
              </select>
            </div>
          </div>

          <div className="responsive-grid-2">
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)' }}>GIỐNG</label>
              <input 
                data-ai-id="input-quanlykhachhangthucung-y0af" 
                className="btn" 
                style={petFieldStyle} 
                value={petFormData.giong} 
                onChange={e => setPetFormData({ ...petFormData, giong: e.target.value })} 
              />
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)' }}>CÂN NẶNG (KG)</label>
              <input 
                data-ai-id="input-quanlykhachhangthucung-ccuw" 
                type="number" 
                step="0.1" 
                className="btn" 
                style={petFieldStyle} 
                value={petFormData.trong_luong} 
                onChange={e => setPetFormData({ ...petFormData, trong_luong: e.target.value })} 
              />
            </div>
          </div>

          <div className="responsive-grid-3">
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)' }}>GIỚI TÍNH</label>
              <select 
                data-ai-id="select-quanlykhachhangthucung-1av9" 
                className="btn" 
                style={petSelectStyle} 
                value={petFormData.gioi_tinh} 
                onChange={e => setPetFormData({ ...petFormData, gioi_tinh: e.target.value })}
              >
                <option value="Đực">Đực</option>
                <option value="Cái">Cái</option>
                <option value="Không xác định">Không xác định</option>
              </select>
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)' }}>NGÀY SINH</label>
              <input 
                data-ai-id="input-quanlykhachhangthucung-guzt" 
                type="date" 
                className="btn" 
                style={{ ...petFieldStyle, padding: '14px 12px' }} 
                value={petFormData.ngay_sinh} 
                onChange={e => setPetFormData({ ...petFormData, ngay_sinh: e.target.value })} 
                max={new Date().toISOString().split("T")[0]} 
              />
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)' }}>MÀU SẮC</label>
              <input 
                data-ai-id="input-quanlykhachhangthucung-h9m1" 
                className="btn" 
                style={petFieldStyle} 
                value={petFormData.mau_sac} 
                onChange={e => setPetFormData({ ...petFormData, mau_sac: e.target.value })} 
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button 
              data-ai-id="button-quanlykhachhangthucung-czfa" 
              type="submit" 
              disabled={isSaving} 
              className="btn btn-primary btn-pill" 
              style={{ flex: 1 }}
            >
              {isSaving ? 'Đang lưu...' : (editingPetId ? 'Lưu thay đổi' : 'Đăng ký bé')}
            </button>
            <button 
              data-ai-id="button-quanlykhachhangthucung-hkxr" 
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
