import React, { useState, useEffect } from "react";
import axiosInstance from "@services/axios";
import { Modal } from "@components/CommonUI";
import { toast } from "@components/Toast";
import { toastError } from '@utils/toastHelpers';
import { matchesSearchFields } from "@utils/index";
import { useAutoRefresh } from "@hooks/useAutoRefresh";

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
  const [searchLo, setSearchLo] = useState("");

  const [formData, setFormData] = useState({
    id_thuoc: "",
    so_lo: "",
    ngay_nhap: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0],
    han_su_dung: "",
    so_luong_nhap: 0,
    gia_nhap: 0
  });

  const fetchData = async () => {
    if (loThuocs.length === 0) setLoading(true);
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

  useAutoRefresh(fetchData, { runImmediately: false });

  useEffect(() => {
    const handleRealtimeUpdate = () => {
      fetchData();
    };
    window.addEventListener("rexi-data-changed", handleRealtimeUpdate);
    return () => window.removeEventListener("rexi-data-changed", handleRealtimeUpdate);
  }, []);

  const filteredLoThuocs = React.useMemo(() => {
    if (!searchLo.trim()) return loThuocs;
    return loThuocs.filter(l => {
      const thuoc = thuocs.find(t => t.id_thuoc === l.id_thuoc);
      return matchesSearchFields(searchLo, [
        l.id_lo_thuoc,
        l.id_thuoc,
        l.so_lo,
        thuoc?.ten_thuoc,
        thuoc?.thanh_phan,
        l.ngay_nhap,
        l.han_su_dung,
        l.so_luong_nhap,
        l.so_luong_ton,
        l.gia_nhap
      ]);
    });
  }, [loThuocs, thuocs, searchLo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate expiration date is not in the past
    const isDateBeforeToday = (dateString: string) => {
      if (!dateString) return false;
      const sel = new Date(dateString);
      const today = new Date();
      sel.setHours(0,0,0,0);
      today.setHours(0,0,0,0);
      return sel < today;
    };

    if (isDateBeforeToday(formData.han_su_dung)) {
      toastError("Hạn sử dụng không được đặt trong quá khứ!");
      return;
    }

    if (formData.so_luong_nhap <= 0) {
      toastError("Số lượng nhập kho phải lớn hơn 0!");
      return;
    }
    try {
      // ensure id_lo is provided (backend expects id_lo non-null)
      const payload = { ...formData, id_lo: formData.so_lo ? `LO-${Date.now().toString(36).toUpperCase()}` : `LO-${Date.now().toString(36).toUpperCase()}` };
      await axiosInstance.post("/api/kho/lo-thuoc", payload);
      toast.success("Đã tạo phiếu nhập kho thành công! (Dữ liệu đã được đồng bộ với kho)");
      setIsModalOpen(false);
      setFormData({ ...formData, so_lo: "", han_su_dung: "", so_luong_nhap: 0, gia_nhap: 0 });
      fetchData();
    } catch (err: any) {
      toastError(err, "Lỗi khi tạo phiếu nhập.");
    }
  };

  if (loading && loThuocs.length === 0) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div className="dot-pulse"></div>
    </div>
  );

  return (
    <div className="animate-fade-in admin-inventory-page">
      <style>{`
        @media screen and (max-width: 1024px) {
          .admin-inventory-page {
            display: grid !important;
            gap: 14px !important;
          }
          .admin-inventory-header {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 12px !important;
            margin-bottom: 10px !important;
            align-items: start !important;
          }
          .admin-inventory-header h1 {
            max-width: 14ch !important;
            font-size: clamp(1.24rem, 5.5vw, 1.52rem) !important;
            line-height: 1.08 !important;
            letter-spacing: -0.02em !important;
          }
          .admin-inventory-header p {
            max-width: 34ch !important;
            margin-top: 6px !important;
            font-size: 0.66rem !important;
            line-height: 1.32 !important;
          }
          .admin-inventory-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
            width: min(100%, 300px) !important;
            gap: 8px !important;
          }
          .admin-inventory-search {
            width: 100% !important;
            min-height: 38px !important;
            height: 38px !important;
            padding-inline: 12px !important;
            border-radius: 14px !important;
          }
          .admin-inventory-search input {
            padding-block: 7px !important;
            font-size: 0.82rem !important;
          }
          .admin-inventory-actions .btn {
            width: 100% !important;
            min-height: 38px !important;
            padding: 7px 11px !important;
            border-radius: 14px !important;
            font-size: 0.74rem !important;
          }
          .admin-inventory-actions .btn .material-symbols-outlined {
            font-size: 18px !important;
          }
          .admin-inventory-list-card {
            padding: 10px !important;
            border-radius: 18px !important;
            overflow: hidden !important;
          }
          .admin-inventory-desktop-table {
            display: none !important;
          }
          .admin-inventory-mobile-list {
            display: grid !important;
            gap: 10px !important;
          }
          .admin-inventory-mobile-card {
            padding: 10px !important;
            border-radius: 16px !important;
            gap: 10px !important;
          }
          .admin-inventory-mobile-card h3 {
            font-size: 0.82rem !important;
            line-height: 1.2 !important;
          }
          .admin-inventory-mobile-card p {
            font-size: 0.66rem !important;
            line-height: 1.3 !important;
          }
          .admin-inventory-mobile-meta span {
            padding: 8px 9px !important;
            font-size: 0.64rem !important;
            border-radius: 12px !important;
          }
        }
      `}</style>
      <div className="admin-mobile-page-header admin-inventory-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-1px' }}>Quản lý Nhập kho</h1>
          <p style={{ color: 'var(--gray-500)', fontWeight: 600 }}>Theo dõi lịch sử nhập hàng và quản lý lô thuốc.</p>
        </div>
        <div className="admin-inventory-actions" style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="glass-card admin-mobile-search-box admin-inventory-search" style={{ display: 'flex', alignItems: 'center', padding: '0 16px', borderRadius: '16px', border: '1px solid var(--gray-200)', background: 'var(--surface)', width: '260px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--gray-400)', marginRight: '8px' }}>search</span>
            <input data-ai-id="input-quanlynhapkho-1t1k"
              type="text"
              placeholder="Tìm số lô, tên thuốc..."
              value={searchLo}
              onChange={(e) => setSearchLo(e.target.value)}
              style={{ border: 'none', outline: 'none', background: 'transparent', padding: '10px 0', fontWeight: 600, width: '100%', color: 'var(--ink)', fontSize: '0.9rem' }}
            />
          </div>
          <button data-ai-id="button-quanlynhapkho-au1n" className="btn btn-primary btn-pill" onClick={() => setIsModalOpen(true)}>
            <span className="material-symbols-outlined">add_business</span>
            Tạo phiếu nhập mới
          </button>
        </div>
      </div>

      <div className="glass-card admin-inventory-list-card" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
        <div className="admin-inventory-mobile-list">
          {filteredLoThuocs.map((l) => {
            const thuoc = thuocs.find(t => t.id_thuoc === l.id_thuoc);
            return (
              <article key={l.id_lo} className="admin-inventory-mobile-card">
                <div className="admin-inventory-mobile-card-head">
                  <div>
                    <span className="admin-inventory-kicker">#LÔ-{l.id_lo}</span>
                    <h3>{l.so_lo}</h3>
                    <p>{thuoc?.ten_thuoc || `#${l.id_thuoc}`}</p>
                  </div>
                  <span className="admin-inventory-pill">{l.so_luong_nhap}</span>
                </div>
                <div className="admin-inventory-mobile-meta">
                  <span><strong>Ngày nhập</strong>{chuyenNgayISO_SangVN(l.ngay_nhap)}</span>
                  <span><strong>Hạn dùng</strong>{chuyenNgayISO_SangVN(l.han_su_dung)}</span>
                  <span className="is-wide"><strong>Giá nhập</strong>{l.gia_nhap?.toLocaleString('vi-VN')} đ</span>
                </div>
              </article>
            );
          })}
        </div>
        <div className="table-responsive-wrapper admin-inventory-desktop-table">
<div style={{ minWidth: '800px' }}>
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
            {filteredLoThuocs.map((l) => (
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
</div></div>
      </div>

      {/* MODAL TẠO PHIẾU NHẬP */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tạo phiếu nhập kho mới">
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '8px', display: 'block' }}>CHỌN THUỐC / VẬT TƯ</label>
            <select data-ai-id="select-quanlynhapkho-v3us"
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

          <div className="responsive-grid-2">
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '8px', display: 'block' }}>SỐ LÔ</label>
              <input data-ai-id="input-quanlynhapkho-pc2b" type="text" className="form-input" placeholder="Ví dụ: LOT2024-001" style={{ width: '100%' }} value={formData.so_lo} onChange={e => setFormData({ ...formData, so_lo: e.target.value })} required />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '8px', display: 'block' }}>HẠN SỬ DỤNG</label>
              <input data-ai-id="input-quanlynhapkho-r92a" type="date" className="form-input" style={{ width: '100%' }} value={formData.han_su_dung} onChange={e => setFormData({ ...formData, han_su_dung: e.target.value })} required />
            </div>
          </div>

          <div className="responsive-grid-2">
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '8px', display: 'block' }}>SỐ LƯỢNG NHẬP</label>
              <input data-ai-id="input-quanlynhapkho-8lya" type="number" min="1" className="form-input" style={{ width: '100%' }} value={formData.so_luong_nhap} onChange={e => setFormData({ ...formData, so_luong_nhap: e.target.value === '' ? 0 : parseInt(e.target.value) })} required />
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '8px', display: 'block' }}>GIÁ NHẬP (VNĐ/ĐƠN VỊ)</label>
              <input data-ai-id="input-quanlynhapkho-ex6w" type="number" min="0" className="form-input" style={{ width: '100%' }} value={formData.gia_nhap} onChange={e => setFormData({ ...formData, gia_nhap: e.target.value === '' ? 0 : parseInt(e.target.value) })} required />
            </div>
          </div>

          <div style={{ marginTop: '20px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button data-ai-id="button-quanlynhapkho-dnwh" type="button" className="btn btn-pill" onClick={() => setIsModalOpen(false)} style={{ background: 'var(--gray-100)', color: 'var(--ink)' }}>Hủy bỏ</button>
            <button data-ai-id="button-quanlynhapkho-fth2" type="submit" className="btn btn-primary btn-pill">Xác nhận nhập kho</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default React.memo(QuanLyNhapKho);
