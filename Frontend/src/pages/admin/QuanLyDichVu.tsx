import React, { useState, useEffect, useRef } from "react";
import axiosInstance from "@services/axios";
import { formatTienVND, getUserProfile, matchesSearchFields, normalizeUserRole } from "@utils/index";
import { toast } from "@components/Toast";
import { toastError } from '@utils/toastHelpers';
import { useAutoRefresh } from "@hooks/useAutoRefresh";

interface DichVu {
  id_dich_vu: number | string;
  ten_dich_vu: string;
  mo_ta: string;
  gia: number;
  thoi_luong_phut?: number;
  trang_thai: boolean;
}

const QuanLyDichVu: React.FC = () => {
  const [dichVus, setDichVus] = useState<DichVu[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [formData, setFormData] = useState<Partial<DichVu>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [searchDichVu, setSearchDichVu] = useState("");
  const formRef = useRef<HTMLDivElement | null>(null);

  const currentUser = getUserProfile();
  const userRole = normalizeUserRole(currentUser);
  const canEdit = userRole === "admin" || userRole === "quan_ly";

  const filteredDichVus = React.useMemo(() => {
    if (!searchDichVu.trim()) return dichVus;
    return dichVus.filter(dv => matchesSearchFields(searchDichVu, [
      dv.id_dich_vu,
      dv.ten_dich_vu,
      dv.mo_ta,
      dv.gia,
      dv.thoi_luong_phut,
      dv.trang_thai ? "đang hoạt động active" : "tạm ngừng inactive"
    ]));
  }, [dichVus, searchDichVu]);

  useEffect(() => { fetchDichVus(); }, []);

  const fetchDichVus = async () => {
    try {
      const res = await axiosInstance.get("/api/dich-vu");
      const rows = Array.isArray(res.data) ? res.data.filter((dv: DichVu) => dv.trang_thai !== false) : [];
      setDichVus(rows);
    } catch (err) {
      console.error("Lỗi lấy danh sách dịch vụ:", err);
      toastError("Không thể tải danh sách dịch vụ. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  useAutoRefresh(fetchDichVus, { runImmediately: false });

  const handleEdit = (dichVu: DichVu) => {
    setEditingId(dichVu.id_dich_vu);
    setFormData(dichVu);
    window.requestAnimationFrame(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handleSave = async () => {
    if (!editingId) return;
    if (!formData.ten_dich_vu?.trim()) {
      toastError("Vui lòng nhập tên dịch vụ!");
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
      toastError(err, "Lỗi khi cập nhật dịch vụ.");
      console.error(err);
    }
    finally { setIsSaving(false); }
  };

  const handleAdd = async () => {
    if (!formData.ten_dich_vu?.trim()) {
      toastError("Vui lòng nhập tên dịch vụ!");
      return;
    }
    setIsSaving(true);
    try {
      await axiosInstance.post("/api/dich-vu", { ...formData, trang_thai: true });
      toast.success("Thêm dịch vụ mới thành công!");
      fetchDichVus();
      setFormData({});
    } catch (err: any) {
      toastError(err, "Lỗi khi thêm dịch vụ.");
      console.error(err);
    }
    finally { setIsSaving(false); }
  };

  const handleDelete = async (id: number | string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa dịch vụ này?")) {
      try {
        await axiosInstance.delete(`/api/dich-vu/${id}`);
        setDichVus(prev => prev.filter(dv => String(dv.id_dich_vu) !== String(id)));
        toast.success("Đã xóa dịch vụ!");
        fetchDichVus();
      } catch (err: any) {
        toastError("Không thể xóa! Dịch vụ này có thể đang được sử dụng trong lịch hẹn hoặc hóa đơn.");
        console.error(err);
      }
    }
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><div className="dot-pulse"></div></div>;

  return (
    <div className="animate-fade-in">
      <style>{`
        .table-row:hover { background-color: var(--gray-50) !important; transform: translateX(2px); }
        @keyframes slideUpFade { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeInScale { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
        .admin-service-form { animation: fadeInScale 0.35s cubic-bezier(.22,.68,0,1.2) both !important; }
        .table-row { animation: slideUpFade 0.4s cubic-bezier(.22,.68,0,1.2) both; }
        .admin-service-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .admin-service-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
        .admin-service-icon-button {
          width: 40px !important;
          height: 40px !important;
          min-width: 40px !important;
          min-height: 40px !important;
          padding: 0 !important;
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          line-height: 1 !important;
          border-radius: 12px !important;
          flex: 0 0 40px !important;
        }
        .admin-service-icon-button .material-symbols-outlined {
          display: block;
          width: 20px;
          height: 20px;
          font-size: 20px !important;
          line-height: 20px !important;
        }
        .input-with-icon { position: relative; }
        .input-with-icon .icon { position: absolute; left: 16px; bottom: 18px; width: 20px; height: 20px; color: var(--gray-400); font-size: 20px; line-height: 20px; pointer-events: none; }
        .input-with-icon input { padding-left: 48px !important; }
        .admin-service-mobile-list { display: none; }
        @media screen and (max-width: 1024px) {
          .admin-service-header {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 12px !important;
            margin-bottom: 16px !important;
          }
          .admin-service-header h1 {
            max-width: 12ch !important;
            font-size: clamp(1.42rem, 6.4vw, 1.78rem) !important;
            line-height: 1.08 !important;
            letter-spacing: -0.02em !important;
            margin: 0 0 6px !important;
          }
          .admin-service-header p {
            max-width: 32ch !important;
            margin: 0 !important;
            font-size: 0.82rem !important;
            line-height: 1.45 !important;
          }
          .admin-service-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
            width: min(100%, 300px) !important;
            gap: 8px !important;
          }
          .admin-service-search {
            width: 100% !important;
            min-height: 40px !important;
            border-radius: 14px !important;
          }
          .admin-service-actions .btn {
            width: 100% !important;
            min-height: 40px !important;
            justify-content: center !important;
            border-radius: 14px !important;
            padding: 8px 12px !important;
            font-size: 0.78rem !important;
          }
          .admin-service-form {
            padding: 14px !important;
            border-radius: 20px !important;
            margin-bottom: 16px !important;
          }
          .admin-service-form h2 {
            margin-bottom: 14px !important;
            font-size: 1rem !important;
            line-height: 1.25 !important;
          }
          .admin-service-form-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
            margin-bottom: 12px !important;
          }
          .admin-service-form-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 8px !important;
          }
          .admin-service-form-actions .btn {
            width: 100% !important;
            justify-content: center !important;
          }
          .admin-service-desktop-table {
            display: none !important;
          }
          .admin-service-mobile-list {
            display: grid !important;
            gap: 10px;
            padding: 10px;
          }
          .admin-service-card {
            display: grid;
            gap: 10px;
            padding: 12px;
            border-radius: 18px;
            background: var(--surface);
            border: 1px solid var(--gray-100);
          }
          .admin-service-card-top {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 10px;
            align-items: start;
          }
          .admin-service-card h3 {
            margin: 0;
            color: var(--ink);
            font-size: 0.95rem;
            line-height: 1.22;
            font-weight: 950;
          }
          .admin-service-card p {
            margin: 4px 0 0;
            color: var(--gray-500);
            font-size: 0.72rem;
            line-height: 1.35;
            font-weight: 700;
          }
          .admin-service-price {
            color: var(--primary);
            font-size: 0.9rem;
            font-weight: 950;
            white-space: nowrap;
          }
          .admin-service-meta {
            display: inline-flex;
            width: fit-content;
            padding: 6px 10px;
            border-radius: 999px;
            background: var(--primary-light);
            color: var(--primary);
            font-size: 0.68rem;
            line-height: 1;
            font-weight: 950;
          }
          .admin-service-card-actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }
          .admin-service-card-actions .btn {
            width: 100%;
            min-height: 36px;
            justify-content: center;
            border-radius: 13px !important;
            padding: 7px 10px !important;
          }
        }
      `}</style>
      <div className="admin-service-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-1px' }}>Danh mục dịch vụ</h1>
          <p style={{ color: 'var(--gray-500)', fontWeight: 600 }}>Quản lý bảng giá và thông tin các dịch vụ thú y.</p>
        </div>
        <div className="admin-service-actions" style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="glass-card admin-service-search" style={{ display: 'flex', alignItems: 'center', padding: '0 16px', borderRadius: '16px', border: '1px solid var(--gray-200)', background: 'var(--surface)', width: '260px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--gray-400)', marginRight: '8px' }}>search</span>
            <input data-ai-id="input-quanlydichvu-qkhi"
              type="text"
              placeholder="Tìm tên dịch vụ, mô tả..."
              value={searchDichVu}
              onChange={(e) => setSearchDichVu(e.target.value)}
              style={{ border: 'none', outline: 'none', background: 'transparent', padding: '10px 0', fontWeight: 600, width: '100%', color: 'var(--ink)', fontSize: '0.9rem' }}
            />
          </div>
          {canEdit && formData.ten_dich_vu === undefined && (
            <button data-ai-id="btn_service_add" className="btn btn-primary btn-pill" onClick={() => setFormData({ ten_dich_vu: "", mo_ta: "", gia: 0 })}>
              <span className="material-symbols-outlined">add</span>
              Thêm dịch vụ
            </button>
          )}
        </div>
      </div>

      {formData.ten_dich_vu !== undefined && (
        <div ref={formRef} className="glass-card admin-service-form" style={{ padding: '40px', borderRadius: 'var(--radius-xl)', marginBottom: '40px', scrollMarginTop: '24px' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '32px' }}>{editingId ? 'Cập nhật dịch vụ' : 'Định nghĩa dịch vụ mới'}</h2>
          <div className="admin-service-form-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '24px', marginBottom: '24px' }}>
            <div className="input-with-icon" style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--gray-400)' }}>TÊN DỊCH VỤ</label>
              <span className="material-symbols-outlined icon">medical_services</span>
            <input data-ai-id="input_service_name" className="btn" style={{ background: 'var(--gray-50)', textAlign: 'left', cursor: 'text' }} value={formData.ten_dich_vu} onChange={e => setFormData({ ...formData, ten_dich_vu: e.target.value })} />
            </div>
            <div className="input-with-icon" style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--gray-400)' }}>GIÁ NIÊM YẾT</label>
              <span className="material-symbols-outlined icon">payments</span>
            <input data-ai-id="input_service_price" type="number" className="btn" style={{ background: 'var(--gray-50)', textAlign: 'left', cursor: 'text' }} value={formData.gia} onChange={e => setFormData({ ...formData, gia: Number(e.target.value) })} />
            </div>
            <div className="input-with-icon" style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--gray-400)' }}>THỜI LƯỢNG (PHÚT)</label>
              <span className="material-symbols-outlined icon">timer</span>
            <input data-ai-id="input_service_duration" type="number" className="btn" style={{ background: 'var(--gray-50)', textAlign: 'left', cursor: 'text' }} value={formData.thoi_luong_phut} onChange={e => setFormData({ ...formData, thoi_luong_phut: Number(e.target.value) })} />
            </div>
          </div>
          <div style={{ display: 'grid', gap: '8px', marginBottom: '32px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--gray-400)' }}>MÔ TẢ CHI TIẾT</label>
            <textarea data-ai-id="textarea_service_description" className="btn" style={{ background: 'var(--gray-50)', textAlign: 'left', cursor: 'text', minHeight: '100px', lineHeight: '1.5', padding: '16px' }} value={formData.mo_ta} onChange={e => setFormData({ ...formData, mo_ta: e.target.value })} />
          </div>
          <div className="admin-service-form-actions" style={{ display: 'flex', gap: '12px' }}>
            <button data-ai-id="btn_service_save" className="btn btn-primary btn-pill" style={{ padding: '12px 40px' }} onClick={editingId ? handleSave : handleAdd} disabled={isSaving}>
              {isSaving ? 'Đang lưu...' : 'Lưu dịch vụ'}
            </button>
            <button data-ai-id="button-quanlydichvu-g56d" className="btn btn-pill" style={{ background: 'var(--gray-100)', color: 'var(--ink)' }} onClick={() => { setEditingId(null); setFormData({}); }} disabled={isSaving}>Hủy</button>
          </div>
        </div>
      )}

      <div className="glass-card" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
        <div className="admin-service-mobile-list">
          {filteredDichVus.length === 0 ? (
            <div className="admin-empty-state" style={{ padding: '18px 10px', textAlign: 'center', color: 'var(--gray-500)', fontWeight: 800 }}>
              Không có dịch vụ phù hợp.
            </div>
          ) : filteredDichVus.map((dv) => (
            <article key={dv.id_dich_vu} className="admin-service-card">
              <div className="admin-service-card-top">
                <div>
                  <h3>{dv.ten_dich_vu}</h3>
                  {dv.mo_ta && <p>{dv.mo_ta}</p>}
                </div>
                <span className="admin-service-price">{formatTienVND(dv.gia)}</span>
              </div>
              <span className="admin-service-meta">{dv.thoi_luong_phut || '—'} phút</span>
              {canEdit && (
                <div className="admin-service-card-actions">
                  <button data-ai-id="button-quanlydichvu-mobile-edit" className="btn admin-service-icon-button" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }} onClick={() => handleEdit(dv)} aria-label="Sửa dịch vụ">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                  </button>
                  <button data-ai-id="button-quanlydichvu-mobile-delete" className="btn admin-service-icon-button" style={{ background: 'var(--danger-light, rgba(239, 68, 68, 0.15))', color: 'var(--danger)' }} onClick={() => handleDelete(dv.id_dich_vu)} aria-label="Xóa dịch vụ">
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                  </button>
                </div>
              )}
            </article>
          ))}
        </div>
        <div className="table-responsive-wrapper admin-service-desktop-table">
<div style={{ minWidth: '800px' }}>
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
            {filteredDichVus.map((dv) => (
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
                      <button data-ai-id="button-quanlydichvu-1qtr" className="btn admin-service-icon-button" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }} onClick={() => handleEdit(dv)} aria-label="Sửa dịch vụ">
                        <span className="material-symbols-outlined">edit</span>
                      </button>
                      <button data-ai-id="button-quanlydichvu-5ywo" className="btn admin-service-icon-button" style={{ background: 'var(--danger-light, rgba(239, 68, 68, 0.15))', color: 'var(--danger)' }} onClick={() => handleDelete(dv.id_dich_vu)} aria-label="Xóa dịch vụ">
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
</div></div>
      </div>
    </div>
  );
};

export default React.memo(QuanLyDichVu);

