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
        const data = Array.isArray(res.data) ? res.data : Object.entries(res.data).map(([k, v], i) => ({
          id_cau_hinh: i + 1,
          ten_cau_hinh: k,
          gia_tri: v,
          mo_ta: "Tham số hệ thống tự động"
        }));
        setConfigs(data);
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
      await axiosInstance.put(`/api/system/cau-hinh/${editingConfig.ten_cau_hinh}`, {
        gia_tri: newValue
      });
      toast.success("Cập nhật tham số hệ thống thành công! ✨");
      setEditingConfig(null);
      fetchConfigs();
    } catch (err) {
      toast.error("Lỗi cập nhật cấu hình. Vui lòng kiểm tra lại kết nối.");
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
    <div className="animate-fade-in" style={{ padding: '20px' }}>
      <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 className="auth-title" style={{ fontSize: '3rem', marginBottom: '10px' }}>Cấu hình hệ thống</h1>
          <p style={{ color: 'var(--gray-400)', fontWeight: 600, fontSize: '1.1rem' }}>
            Điều khiển các "mạch máu" vận hành của toàn bộ hệ thống Rexi.
          </p>
        </div>
        <div style={{ padding: '12px 24px', background: 'var(--primary-light)', borderRadius: '16px', border: '1px solid var(--primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>security</span>
          <span style={{ color: 'var(--primary)', fontWeight: 800, fontSize: '0.9rem' }}>CHẾ ĐỘ QUẢN TRỊ VIÊN</span>
        </div>
      </div>

      <div className="glass-card" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--glass-border)', boxShadow: 'var(--card-glow)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.03)', textAlign: 'left' }}>
                <th style={{ padding: '24px', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>ID</th>
                <th style={{ padding: '24px', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>Tham số cấu hình</th>
                <th style={{ padding: '24px', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>Giá trị hiện tại</th>
                <th style={{ padding: '24px', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>Mô tả</th>
                <th style={{ padding: '24px', fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {configs.map((c) => (
                <tr key={c.id_cau_hinh} className="table-row-hover" style={{ borderBottom: '1px solid var(--glass-border)', transition: 'all 0.3s' }}>
                  <td style={{ padding: '24px', fontWeight: 800, color: 'var(--gray-400)', fontFamily: 'monospace' }}>#{c.id_cau_hinh}</td>
                  <td style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={{ width: '40px', height: '40px', background: 'var(--primary-gradient)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 10px var(--primary-shadow)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>settings_input_component</span>
                      </div>
                      <span style={{ fontWeight: 800, color: 'var(--ink)', fontSize: '1rem' }}>{c.ten_cau_hinh}</span>
                    </div>
                  </td>
                  <td style={{ padding: '24px' }}>
                    <div style={{ padding: '8px 16px', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '10px', border: '1px solid var(--primary)', display: 'inline-block', fontWeight: 900, fontSize: '1rem' }}>
                      {c.gia_tri}
                    </div>
                  </td>
                  <td style={{ padding: '24px', color: 'var(--gray-500)', fontWeight: 600, fontSize: '0.9rem', maxWidth: '300px', lineHeight: 1.5 }}>{c.mo_ta}</td>
                  <td style={{ padding: '24px', textAlign: 'center' }}>
                    <button className="btn" onClick={() => { setEditingConfig(c); setNewValue(c.gia_tri); }} 
                      style={{ padding: '12px', background: 'var(--surface)', color: 'var(--primary)', border: '1px solid var(--glass-border)', borderRadius: '12px' }}>
                      <span className="material-symbols-outlined">edit_square</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={!!editingConfig} onClose={() => setEditingConfig(null)} title="Thay đổi tham số hệ thống" maxWidth="500px">
        {editingConfig && (
          <div style={{ display: 'grid', gap: '25px', padding: '10px' }}>
            <div style={{ padding: '20px', background: 'var(--primary-light)', borderRadius: '20px', border: '1px solid var(--primary)' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--primary)', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '1px' }}>Tên tham số</label>
              <div style={{ fontWeight: 950, color: 'var(--ink)', fontSize: '1.2rem', letterSpacing: '-0.5px' }}>{editingConfig.ten_cau_hinh}</div>
            </div>
            
            <div style={{ display: 'grid', gap: '12px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '1px' }}>Giá trị mới</label>
              <div style={{ position: 'relative' }}>
                <input type="text" value={newValue} onChange={e => setNewValue(e.target.value)} 
                  style={{ width: '100%', background: 'var(--background)', border: '1.5px solid var(--glass-border)', padding: '16px 20px', borderRadius: '16px', color: 'var(--ink)', fontWeight: 700, fontSize: '1.1rem', outline: 'none' }} 
                  autoFocus />
                <div style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', opacity: 0.5 }}>
                   <span className="material-symbols-outlined">edit</span>
                </div>
              </div>
              <p style={{ marginTop: '5px', fontSize: '0.85rem', color: 'var(--gray-500)', lineHeight: 1.6, display: 'flex', gap: '10px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>info</span>
                <span>{editingConfig.mo_ta}</span>
              </p>
            </div>

            <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
              <button className="btn" onClick={() => setEditingConfig(null)} style={{ flex: 1, background: 'var(--gray-100)', color: 'var(--ink)', borderRadius: '15px', fontWeight: 800 }}>Hủy bỏ</button>
              <button className="btn-auth" onClick={handleUpdate} disabled={isSaving} style={{ flex: 2, padding: '15px' }}>
                {isSaving ? "Đang lưu..." : "Cập nhật ngay"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <style>{`
        .table-row-hover:hover {
          background: rgba(13, 148, 136, 0.05);
        }
        [data-theme='dark'] .table-row-hover:hover {
          background: rgba(34, 211, 238, 0.05);
        }
      `}</style>
    </div>
  );
};

export default React.memo(QuanLyCauHinhHeThong);
