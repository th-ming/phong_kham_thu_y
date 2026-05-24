import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "@services/axios";
import { getUserProfile, matchesSearchFields, normalizeUserRole } from "@utils/index";
import { Modal } from "@components/CommonUI";
import { toast } from "@components/Toast";
import thuocService from "@services/thuocService";

const chuyenNgayISO_SangVN = (dateString: string) => {
  if (!dateString) return "—";
  const parts = dateString.split('T')[0].split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateString;
};

const QuanLyKhoThuoc: React.FC = () => {
  const [thuocs, setThuocs] = useState<any[]>([]);
  const [loThuocs, setLoThuocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchThuoc, setSearchThuoc] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newThuoc, setNewThuoc] = useState<any>({
    id_thuoc: '',
    ten_thuoc: '',
    ma_thuoc: '',
    loai_thuoc: '',
    don_vi: '',
    gia_ban: 0,
    cach_dung: '',
    trang_thai: true,
    da_xoa: false
  });

  useEffect(() => {
    Promise.all([
      axiosInstance.get("/api/kho/thuoc"),
      axiosInstance.get("/api/kho/lo-thuoc")
    ])
      .then(([thuocRes, loRes]) => {
        setThuocs(thuocRes.data);
        setLoThuocs(loRes.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi lấy dữ liệu kho thuốc:", err);
        setLoading(false);
      });
  }, []);

  const user = getUserProfile();
  const userRole = normalizeUserRole(user);
  const canManageInventory = userRole === 'admin' || userRole === 'quan_ly' || userRole === 'ke_toan';

  const filteredThuocs = React.useMemo(() => {
    if (!searchThuoc.trim()) return thuocs;
    return thuocs.filter(t => matchesSearchFields(searchThuoc, [
      t.id_thuoc,
      t.ten_thuoc,
      t.thanh_phan,
      t.dang_bao_che,
      t.don_vi,
      t.mo_ta,
      t.gia_ban,
      t.so_luong_ton,
      t.trang_thai ? "đang bán active" : "ngừng bán inactive"
    ]));
  }, [thuocs, searchThuoc]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div className="dot-pulse"></div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-1px' }}>Quản lý Kho thuốc</h1>
          <p style={{ color: 'var(--gray-500)', fontWeight: 600 }}>Theo dõi tồn kho, hạn sử dụng và phân phối dược phẩm.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', padding: '0 16px', borderRadius: '16px', border: '1px solid var(--gray-200)', background: 'var(--surface)', width: '260px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--gray-400)', marginRight: '8px' }}>search</span>
            <input data-ai-id="input-quanlykhothuoc-8v88"
              type="text"
              placeholder="Tìm tên thuốc, thành phần..."
              value={searchThuoc}
              onChange={(e) => setSearchThuoc(e.target.value)}
              style={{ border: 'none', outline: 'none', background: 'transparent', padding: '10px 0', fontWeight: 600, width: '100%', color: 'var(--ink)', fontSize: '0.9rem' }}
            />
          </div>
          {canManageInventory && (
            <>
              <Link data-ai-id="button-quanlykhothuoc-nhapkho" to="/quan-ly/nhap-kho" className="btn btn-primary btn-pill" style={{ textDecoration: 'none' }}>
                <span className="material-symbols-outlined">add_box</span>
                Nhập thuốc mới
              </Link>
              <button data-ai-id="button-quanlykhothuoc-themthuoc" type="button" className="btn btn-outline btn-pill" style={{ marginLeft: 8 }} onClick={() => setIsAddModalOpen(true)}>
                <span className="material-symbols-outlined">add</span>
                Thêm thuốc
              </button>
            </>
          )}
        </div>
        {/* Add Thuoc modal */}
        <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Thêm thuốc mới">
          <form onSubmit={async (e) => {
            e.preventDefault();
            try {
              // ensure an id is provided (backend requires id_thuoc)
              if (!newThuoc.id_thuoc || !newThuoc.ten_thuoc) {
                toast.error('Vui lòng nhập `id_thuoc` và `ten_thuoc`.');
                return;
              }
              const saved = await thuocService.create(newThuoc);
              setThuocs(prev => [...prev, saved]);
              toast.success('Đã thêm thuốc thành công');
              setIsAddModalOpen(false);
              setNewThuoc({ id_thuoc: '', ten_thuoc: '', ma_thuoc: '', loai_thuoc: '', don_vi: '', gia_ban: 0, cach_dung: '', trang_thai: true, da_xoa: false });
            } catch (err: any) {
              toast.error(err?.response?.data || 'Lỗi khi thêm thuốc');
            }
          }} style={{ display: 'grid', gap: 12 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 800, color: 'var(--gray-400)' }}>Mã thuốc (id_thuoc)</label>
              <input data-ai-id="input-quanlykhothuoc-idthuoc" className="form-input" value={newThuoc.id_thuoc} onChange={e => setNewThuoc({ ...newThuoc, id_thuoc: e.target.value })} required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 800, color: 'var(--gray-400)' }}>Tên thuốc</label>
              <input data-ai-id="input-quanlykhothuoc-tenthuoc" className="form-input" value={newThuoc.ten_thuoc} onChange={e => setNewThuoc({ ...newThuoc, ten_thuoc: e.target.value })} required />
            </div>
            <div className="responsive-grid-2">
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 800, color: 'var(--gray-400)' }}>Mã thuốc (ma_thuoc)</label>
                <input data-ai-id="input-quanlykhothuoc-mathuoc" className="form-input" value={newThuoc.ma_thuoc} onChange={e => setNewThuoc({ ...newThuoc, ma_thuoc: e.target.value })} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 800, color: 'var(--gray-400)' }}>Đơn vị</label>
                <input data-ai-id="input-quanlykhothuoc-donvi" className="form-input" value={newThuoc.don_vi} onChange={e => setNewThuoc({ ...newThuoc, don_vi: e.target.value })} />
              </div>
            </div>
            <div className="responsive-grid-2">
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 800, color: 'var(--gray-400)' }}>Giá bán</label>
                <input data-ai-id="input-quanlykhothuoc-giaban" type="number" className="form-input" value={newThuoc.gia_ban} onChange={e => setNewThuoc({ ...newThuoc, gia_ban: Number(e.target.value) })} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 800, color: 'var(--gray-400)' }}>Loại</label>
                <input data-ai-id="input-quanlykhothuoc-loai" className="form-input" value={newThuoc.loai_thuoc} onChange={e => setNewThuoc({ ...newThuoc, loai_thuoc: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
              <button data-ai-id="button-quanlykhothuoc-huy" type="button" className="btn btn-pill" onClick={() => setIsAddModalOpen(false)} style={{ background: 'var(--gray-100)', color: 'var(--ink)' }}>Hủy</button>
              <button data-ai-id="button-quanlykhothuoc-taothuoc" type="submit" className="btn btn-primary btn-pill">Tạo thuốc</button>
            </div>
          </form>
        </Modal>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '32px' }}>
        <div className="glass-card" style={{ padding: '32px', borderRadius: 'var(--radius-xl)' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px' }}>Danh mục thuốc</h2>
          <div style={{ overflowX: 'auto' }}>
            <div className="table-responsive-wrapper">
<div style={{ minWidth: '800px' }}>
<table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--gray-100)' }}>
                  <th style={{ padding: '16px 8px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>TÊN THUỐC</th>
                  <th style={{ padding: '16px 8px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>DẠNG</th>
                  <th style={{ padding: '16px 8px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800, textAlign: 'right' }}>GIÁ BÁN</th>
                </tr>
              </thead>
              <tbody>
                {filteredThuocs.map(t => (
                  <tr key={t.id_thuoc} style={{ borderBottom: '1px solid var(--gray-50)' }}>
                    <td style={{ padding: '16px 8px' }}>
                      <div style={{ fontWeight: 800, color: 'var(--ink)' }}>{t.ten_thuoc}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 600 }}>{t.thanh_phan || "Dược chất"}</div>
                    </td>
                    <td style={{ padding: '16px 8px' }}>
                      <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}>{t.dang_bao_che}</span>
                    </td>
                    <td style={{ padding: '16px 8px', textAlign: 'right', fontWeight: 900, color: 'var(--primary)' }}>
                      {t.gia_ban?.toLocaleString('vi-VN')} đ
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
</div></div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: '32px', borderRadius: 'var(--radius-xl)', background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--gray-200)' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px', color: 'var(--ink)' }}>Lô thuốc & Hạn dùng</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {loThuocs.map(l => (
              <div key={l.id_lo} style={{ background: 'var(--primary-light)', padding: '16px', borderRadius: '16px', border: '1px solid var(--primary-border, rgba(15, 157, 138, 0.18))' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 800, color: 'var(--ink)' }}>Lô: {l.so_lo}</span>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 800, padding: '4px 10px', borderRadius: '50px',
                    background: l.so_luong_ton < 10 ? 'var(--danger)' : 'var(--primary)',
                    color: '#fff'
                  }}>
                    TỒN: {l.so_luong_ton}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--gray-500)', fontWeight: 650 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>event</span>
                  Hạn dùng: {chuyenNgayISO_SangVN(l.han_su_dung)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(QuanLyKhoThuoc);
