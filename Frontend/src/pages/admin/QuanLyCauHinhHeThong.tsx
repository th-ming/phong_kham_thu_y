import React, { useState, useEffect } from "react";
import axiosInstance from "@services/axios";
import { Modal } from "@components/CommonUI";
import { toast } from "@components/Toast";

const QuanLyCauHinhHeThong: React.FC = () => {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingConfig, setEditingConfig] = useState<any>(null);
  const [newValue, setNewValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchConfigs = () => {
    setLoading(true);
    axiosInstance.get("/api/system/cau-hinh")
      .then(res => {
        setConfigs(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi lấy cấu hình:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleUpdate = async () => {
    if (!editingConfig) return;
    setIsSaving(true);
    try {
      await axiosInstance.put(`/api/system/cau-hinh/${editingConfig.id_cau_hinh}`, {
        ten_cau_hinh: editingConfig.ten_cau_hinh,
        gia_tri: newValue,
        mo_ta: editingConfig.mo_ta
      });
      toast.success("Cập nhật tham số hệ thống thành công!");
      setEditingConfig(null);
      fetchConfigs();
    } catch (err) {
      toast.error("Lỗi cập nhật cấu hình.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading && configs.length === 0) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div className="dot-pulse"></div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-1px' }}>Cấu hình hệ thống</h1>
        <p style={{ color: 'var(--gray-500)', fontWeight: 600 }}>Thiết lập các tham số vận hành cốt lõi và các giới hạn kỹ thuật.</p>
      </div>

      <div className="glass-card" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--gray-50)', textAlign: 'left' }}>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>ID</th>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>THAM SỐ CẤU HÌNH</th>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>GIÁ TRỊ HIỆN TẠI</th>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>DIỄN GIẢI CHI TIẾT</th>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800, textAlign: 'center' }}>SỬA</th>
            </tr>
          </thead>
          <tbody>
            {configs.map((c) => (
              <tr key={c.id_cau_hinh} style={{ borderBottom: '1px solid var(--gray-50)', transition: 'all 0.2s' }}>
                <td style={{ padding: '20px', fontWeight: 800, color: 'var(--gray-400)' }}>#{c.id_cau_hinh}</td>
                <td style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', background: 'var(--secondary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>settings_ethernet</span>
                    </div>
                    <span style={{ fontWeight: 800, color: 'var(--ink)', fontFamily: 'monospace' }}>{c.ten_cau_hinh}</span>
                  </div>
                </td>
                <td style={{ padding: '20px' }}>
                  <span style={{ padding: '6px 16px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '8px', fontWeight: 900, fontSize: '0.9rem' }}>
                    {c.gia_tri}
                  </span>
                </td>
                <td style={{ padding: '20px', color: 'var(--gray-500)', fontWeight: 600, fontSize: '0.85rem', maxWidth: '300px' }}>{c.mo_ta}</td>
                <td style={{ padding: '20px', textAlign: 'center' }}>
                  <button className="btn" onClick={() => { setEditingConfig(c); setNewValue(c.gia_tri); }} style={{ padding: '8px', background: 'var(--gray-50)', color: 'var(--ink)' }}>
                    <span className="material-symbols-outlined">edit</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={!!editingConfig} onClose={() => setEditingConfig(null)} title="Thay đổi cấu hình" maxWidth="450px">
        {editingConfig && (
          <div style={{ display: 'grid', gap: '20px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '8px', display: 'block' }}>THAM SỐ</label>
              <div style={{ fontWeight: 900, color: 'var(--ink)', fontSize: '1.1rem' }}>{editingConfig.ten_cau_hinh}</div>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '8px', display: 'block' }}>GIÁ TRỊ MỚI</label>
              <input type="text" className="form-input" value={newValue} onChange={e => setNewValue(e.target.value)} style={{ width: '100%', background: 'var(--gray-50)' }} autoFocus />
              <p style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--gray-500)', fontStyle: 'italic', lineHeight: 1.5 }}>
                {editingConfig.mo_ta}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button className="btn btn-pill" onClick={() => setEditingConfig(null)} style={{ background: 'var(--gray-100)', color: 'var(--ink)' }}>Hủy</button>
              <button className="btn btn-primary btn-pill" onClick={handleUpdate} disabled={isSaving}>
                {isSaving ? "Đang lưu..." : "Cập nhật ngay"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default React.memo(QuanLyCauHinhHeThong);
