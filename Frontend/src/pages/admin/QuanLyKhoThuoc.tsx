import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "@services/axios";
import { getUserProfile } from "@utils/index";

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
  const userRoleRaw = (user?.loai_tai_khoan || user?.ten_vai_tro || 'staff').toLowerCase();
  const canManageInventory = userRoleRaw.includes('admin') || userRoleRaw.includes('quản lý') || userRoleRaw.includes('kế toán') || userRoleRaw.includes('manager') || userRoleRaw.includes('accountant');

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div className="dot-pulse"></div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-1px' }}>Quản lý Kho thuốc</h1>
          <p style={{ color: 'var(--gray-500)', fontWeight: 600 }}>Theo dõi tồn kho, hạn sử dụng và phân phối dược phẩm.</p>
        </div>
        {canManageInventory && (
          <Link to="/quan-ly/nhap-kho" className="btn btn-primary btn-pill" style={{ textDecoration: 'none' }}>
            <span className="material-symbols-outlined">add_box</span>
            Nhập thuốc mới
          </Link>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '32px' }}>
        <div className="glass-card" style={{ padding: '32px', borderRadius: 'var(--radius-xl)' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px' }}>Danh mục thuốc</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--gray-100)' }}>
                  <th style={{ padding: '16px 8px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>TÊN THUỐC</th>
                  <th style={{ padding: '16px 8px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>DẠNG</th>
                  <th style={{ padding: '16px 8px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800, textAlign: 'right' }}>GIÁ BÁN</th>
                </tr>
              </thead>
              <tbody>
                {thuocs.map(t => (
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
          </div>
        </div>

        <div className="glass-card" style={{ padding: '32px', borderRadius: 'var(--radius-xl)', background: 'var(--secondary)', color: 'white' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px' }}>Lô thuốc & Hạn dùng</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {loThuocs.map(l => (
              <div key={l.id_lo} style={{ background: 'rgba(255,255,255,0.1)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 800 }}>Lô: {l.so_lo}</span>
                  <span style={{
                    fontSize: '0.7rem', fontWeight: 800, padding: '4px 10px', borderRadius: '50px',
                    background: l.so_luong_ton < 10 ? 'var(--danger)' : 'rgba(255,255,255,0.2)',
                    color: 'white'
                  }}>
                    TỒN: {l.so_luong_ton}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', opacity: 0.7 }}>
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
