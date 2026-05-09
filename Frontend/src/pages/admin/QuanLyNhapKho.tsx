import React, { useState, useEffect } from "react";
import axiosInstance from "@services/axios";
import { Modal } from "@components/CommonUI";
import { toast } from "@components/Toast";

const chuyenNgayISO_SangVN = (dateString: string) => {
  if (!dateString) return "—";
  const parts = dateString.split('T')[0].split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateString;
};

const QuanLyNhapKho: React.FC = () => {
  const [loThuocs, setLoThuocs] = useState<any[]>([]);
  const [thuocs, setThuocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    id_thuoc: "",
    so_lo: "",
    ngay_nhap: new Date().toISOString().split('T')[0],
    han_su_dung: "",
    so_luong_nhap: 0,
    gia_nhap: 0
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [loRes, thuocRes] = await Promise.all([
        axiosInstance.get("/api/kho/lo-thuoc"),
        axiosInstance.get("/api/kho/thuoc")
      ]);
      setLoThuocs(loRes.data || []);
      setThuocs(thuocRes.data || []);
    } catch (err) {
      console.error("Lỗi lấy dữ liệu kho:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.so_luong_nhap <= 0) {
      toast.error("Số lượng nhập kho phải lớn hơn 0!");
      return;
    }
    try {
      await axiosInstance.post("/api/kho/lo-thuoc", formData);
      toast.success("Đã tạo phiếu nhập kho thành công! (Dữ liệu đã được đồng bộ với kho)");
      setIsModalOpen(false);
      setFormData({ ...formData, so_lo: "", han_su_dung: "", so_luong_nhap: 0, gia_nhap: 0 });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi khi tạo phiếu nhập.");
    }
  };

  if (loading && loThuocs.length === 0) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div className="dot-pulse"></div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-1px' }}>Quản lý Nhập kho</h1>
          <p style={{ color: 'var(--gray-500)', fontWeight: 600 }}>Theo dõi lịch sử nhập hàng và quản lý lô thuốc.</p>
        </div>
        <button className="btn btn-primary btn-pill" onClick={() => setIsModalOpen(true)}>
          <span className="material-symbols-outlined">add_business</span>
          Tạo phiếu nhập mới
        </button>
      </div>

      <div className="glass-card" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--gray-50)', textAlign: 'left' }}>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>LÔ HÀNG</th>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>SỐ LÔ</th>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>NGÀY NHẬP</th>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>HẠN DÙNG</th>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800, textAlign: 'right' }}>SỐ LƯỢNG</th>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800, textAlign: 'right' }}>GIÁ NHẬP</th>
            </tr>
          </thead>
          <tbody>
            {loThuocs.map((l) => (
              <tr key={l.id_lo} style={{ borderBottom: '1px solid var(--gray-50)', transition: 'all 0.2s' }}>
                <td style={{ padding: '20px', fontWeight: 800, color: 'var(--gray-400)' }}>#LÔ-{l.id_lo}</td>
                <td style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)' }}></div>
                    <span style={{ fontWeight: 800, color: 'var(--ink)' }}>{l.so_lo}</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 600 }}>Thuốc: {thuocs.find(t => t.id_thuoc === l.id_thuoc)?.ten_thuoc || `#${l.id_thuoc}`}</div>
                </td>
                <td style={{ padding: '20px', fontWeight: 700 }}>{chuyenNgayISO_SangVN(l.ngay_nhap)}</td>
                <td style={{ padding: '20px' }}>
                  <span style={{
                    padding: '4px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700,
                    background: 'var(--gray-50)', color: 'var(--gray-600)', border: '1px solid var(--gray-100)'
                  }}>
                    {chuyenNgayISO_SangVN(l.han_su_dung)}
                  </span>
                </td>
                <td style={{ padding: '20px', textAlign: 'right', fontWeight: 900, color: 'var(--ink)' }}>{l.so_luong_nhap}</td>
                <td style={{ padding: '20px', textAlign: 'right', fontWeight: 900, color: 'var(--primary)' }}>
                  {l.gia_nhap?.toLocaleString('vi-VN')} đ
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL TẠO PHIẾU NHẬP */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tạo phiếu nhập kho mới">
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '8px', display: 'block' }}>CHỌN THUỐC / VẬT TƯ</label>
            <select
              className="form-input"
              style={{ width: '100%', background: 'var(--gray-50)' }}
              value={formData.id_thuoc}
              onChange={e => setFormData({ ...formData, id_thuoc: e.target.value })}
              required
            >
              <option value="">-- Chọn thuốc trong danh mục --</option>
              {thuocs.map(t => (
                <option key={t.id_thuoc} value={t.id_thuoc}>{t.ten_thuoc} ({t.don_vi_tinh})</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '8px', display: 'block' }}>SỐ LÔ</label>
              <input type="text" className="form-input" placeholder="Ví Gụ: LOT2024-001" style={{ width: '100%' }} value={formData.so_lo} onChange={e => setFormData({ ...formData, so_lo: e.target.value })} required />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '8px', display: 'block' }}>HẠN SỬ DỤNG</label>
              <input type="date" className="form-input" style={{ width: '100%' }} value={formData.han_su_dung} onChange={e => setFormData({ ...formData, han_su_dung: e.target.value })} required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '8px', display: 'block' }}>SỐ LƯỢNG NHẬP</label>
              <input type="number" min="1" className="form-input" style={{ width: '100%' }} value={formData.so_luong_nhap} onChange={e => setFormData({ ...formData, so_luong_nhap: e.target.value === '' ? 0 : parseInt(e.target.value) })} required />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '8px', display: 'block' }}>GIÁ NHẬP (VNĐ/ĐƠN VỊ)</label>
              <input type="number" min="0" className="form-input" style={{ width: '100%' }} value={formData.gia_nhap} onChange={e => setFormData({ ...formData, gia_nhap: e.target.value === '' ? 0 : parseInt(e.target.value) })} required />
            </div>
          </div>

          <div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-pill" onClick={() => setIsModalOpen(false)} style={{ background: 'var(--gray-100)', color: 'var(--ink)' }}>Hủy bỏ</button>
            <button type="submit" className="btn btn-primary btn-pill">Xác nhận nhập kho</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default React.memo(QuanLyNhapKho);
