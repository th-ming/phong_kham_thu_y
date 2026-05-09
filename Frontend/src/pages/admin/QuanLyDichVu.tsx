import React, { useState, useEffect } from "react";
import axiosInstance from "@services/axios";
import { formatTienVND, getUserProfile } from "@utils/index";
import { toast } from "@components/Toast";

interface DichVu {
  id_dich_vu: number;
  ten_dich_vu: string;
  mo_ta: string;
  gia: number;
  thoi_luong_phut?: number;
  trang_thai: boolean;
}

const QuanLyDichVu: React.FC = () => {
  const [dichVus, setDichVus] = useState<DichVu[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<DichVu>>({});
  const [isSaving, setIsSaving] = useState(false);

  const currentUser = getUserProfile();
  const userRole = currentUser?.ten_vai_tro?.toLowerCase() || currentUser?.loai_tai_khoan?.toLowerCase() || '';
  const canEdit = userRole.includes('admin') || userRole.includes('quan-ly') || userRole.includes('quản lý');

  useEffect(() => { fetchDichVus(); }, []);

  const fetchDichVus = async () => {
    try {
      const res = await axiosInstance.get("/api/dich-vu");
      setDichVus(res.data);
    } catch (err) {
      console.error("Lỗi lấy danh sách dịch vụ:", err);
      toast.error("Không thể tải danh sách dịch vụ!");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (dichVu: DichVu) => {
    setEditingId(dichVu.id_dich_vu);
    setFormData(dichVu);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSave = async () => {
    if (!editingId) return;
    if (!formData.ten_dich_vu?.trim()) {
      toast.error("Vui lòng nhập tên dịch vụ!");
      return;
    }
    setIsSaving(true);
    try {
      await axiosInstance.put(`/api/dich-vu/${editingId}`, formData);
      toast.success("Đã cập nhật dịch vụ thành công!");
      fetchDichVus();
      setEditingId(null);
      setFormData({});
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi khi cập nhật dịch vụ.");
      console.error(err);
    }
    finally { setIsSaving(false); }
  };

  const handleAdd = async () => {
    if (!formData.ten_dich_vu?.trim()) {
      toast.error("Vui lòng nhập tên dịch vụ!");
      return;
    }
    setIsSaving(true);
    try {
      await axiosInstance.post("/api/dich-vu", { ...formData, trang_thai: true });
      toast.success("Thêm dịch vụ mới thành công!");
      fetchDichVus();
      setFormData({});
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi khi thêm dịch vụ.");
      console.error(err);
    }
    finally { setIsSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa dịch vụ này?")) {
      try {
        await axiosInstance.delete(`/api/dich-vu/${id}`);
        toast.success("Đã xóa dịch vụ!");
        fetchDichVus();
      } catch (err: any) {
        toast.error("Không thể xóa! Dịch vụ này có thể đang được sử dụng trong lịch hẹn hoặc hóa đơn.");
        console.error(err);
      }
    }
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><div className="dot-pulse"></div></div>;

  return (
    <div className="animate-fade-in">
      <style>{`
        .table-row:hover { background-color: var(--gray-50) !important; }
        .input-with-icon { position: relative; }
        .input-with-icon .icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: var(--gray-400); font-size: 20px; }
        .input-with-icon input { padding-left: 48px !important; }
      `}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-1px' }}>Danh mục dịch vụ</h1>
          <p style={{ color: 'var(--gray-500)', fontWeight: 600 }}>Quản lý bảng giá và thông tin các dịch vụ thú y.</p>
        </div>
        {canEdit && formData.ten_dich_vu === undefined && (
          <button className="btn btn-primary btn-pill" onClick={() => setFormData({ ten_dich_vu: "", mo_ta: "", gia: 0 })}>
            <span className="material-symbols-outlined">add</span>
            Thêm dịch vụ
          </button>
        )}
      </div>

      {formData.ten_dich_vu !== undefined && (
        <div className="glass-card" style={{ padding: '40px', borderRadius: 'var(--radius-xl)', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '32px' }}>{editingId ? 'Cập nhật dịch vụ' : 'Định nghĩa dịch vụ mới'}</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            <div className="input-with-icon" style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--gray-400)' }}>TÊN DỊCH VỤ</label>
              <span className="material-symbols-outlined icon">medical_services</span>
              <input className="btn" style={{ background: 'var(--gray-50)', textAlign: 'left', cursor: 'text' }} value={formData.ten_dich_vu} onChange={e => setFormData({ ...formData, ten_dich_vu: e.target.value })} />
            </div>
            <div className="input-with-icon" style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--gray-400)' }}>GIÁ NIÊM YẾT</label>
              <span className="material-symbols-outlined icon">payments</span>
              <input type="number" className="btn" style={{ background: 'var(--gray-50)', textAlign: 'left', cursor: 'text' }} value={formData.gia} onChange={e => setFormData({ ...formData, gia: Number(e.target.value) })} />
            </div>
            <div className="input-with-icon" style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--gray-400)' }}>THỜI LƯỢNG (PHÚT)</label>
              <span className="material-symbols-outlined icon">timer</span>
              <input type="number" className="btn" style={{ background: 'var(--gray-50)', textAlign: 'left', cursor: 'text' }} value={formData.thoi_luong_phut} onChange={e => setFormData({ ...formData, thoi_luong_phut: Number(e.target.value) })} />
            </div>
          </div>
          <div style={{ display: 'grid', gap: '8px', marginBottom: '32px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--gray-400)' }}>MÔ TẢ CHI TIẾT</label>
            <textarea className="btn" style={{ background: 'var(--gray-50)', textAlign: 'left', cursor: 'text', minHeight: '100px', lineHeight: '1.5', padding: '16px' }} value={formData.mo_ta} onChange={e => setFormData({ ...formData, mo_ta: e.target.value })} />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-primary btn-pill" style={{ padding: '12px 40px' }} onClick={editingId ? handleSave : handleAdd} disabled={isSaving}>
              {isSaving ? 'Đang lưu...' : 'Lưu dịch vụ'}
            </button>
            <button className="btn btn-pill" style={{ background: 'var(--gray-100)', color: 'var(--ink)' }} onClick={() => { setEditingId(null); setFormData({}); }} disabled={isSaving}>Hủy</button>
          </div>
        </div>
      )}

      <div className="glass-card" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--gray-50)', textAlign: 'left' }}>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>DỊCH VỤ</th>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800, textAlign: 'right' }}>THỜI LƯỢNG</th>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800, textAlign: 'right' }}>ĐƠN GIÁ</th>
              {canEdit && <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800, textAlign: 'center' }}>HÀNH ĐỘNG</th>}
            </tr>
          </thead>
          <tbody>
            {dichVus.map((dv) => (
              <tr key={dv.id_dich_vu} className="table-row" style={{ borderBottom: '1px solid var(--gray-100)', transition: 'all 0.2s' }}>
                <td style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '40px', height: '40px', background: 'var(--primary-light)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                      <span className="material-symbols-outlined">medical_information</span>
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, color: 'var(--ink)' }}>{dv.ten_dich_vu}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', fontWeight: 600, maxWidth: '400px', marginTop: '4px' }}>{dv.mo_ta}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '20px', textAlign: 'right', fontWeight: 700 }}>{dv.thoi_luong_phut || '—'} phút</td>
                <td style={{ padding: '20px', textAlign: 'right', fontWeight: 900, color: 'var(--primary)', fontSize: '1.05rem' }}>{formatTienVND(dv.gia)}</td>
                {canEdit && (
                  <td style={{ padding: '20px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                      <button className="btn" style={{ padding: '8px', background: 'var(--primary-light)', color: 'var(--primary)' }} onClick={() => handleEdit(dv)}>
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button className="btn" style={{ padding: '8px', background: 'var(--danger-light, rgba(239, 68, 68, 0.15))', color: 'var(--danger)' }} onClick={() => handleDelete(dv.id_dich_vu)}>
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default React.memo(QuanLyDichVu);
