import React, { useState, useEffect } from "react";
import axiosInstance from "@services/axios";

const QuanLyChucNang: React.FC = () => {
  const [chucNangs, setChucNangs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance.get("/api/system/chuc-nang")
      .then(res => {
        setChucNangs(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi lấy danh sách chức năng:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div className="dot-pulse"></div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-1px' }}>Phân hệ chức năng</h1>
        <p style={{ color: 'var(--gray-500)', fontWeight: 600 }}>Quản trị các mô-đun nghiệp vụ và phân cấp tính năng hệ thống.</p>
      </div>

      <div className="glass-card" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--gray-50)', textAlign: 'left' }}>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>ID</th>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>MÃ PHÂN HỆ</th>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>TÊN CHỨC NĂNG</th>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>MÔ TẢ CHI TIẾT</th>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800, textAlign: 'center' }}>TRẠNG THÁI</th>
            </tr>
          </thead>
          <tbody>
            {chucNangs.map((cn) => (
              <tr key={cn.id_chuc_nang} style={{ borderBottom: '1px solid var(--gray-50)', transition: 'all 0.2s' }}>
                <td style={{ padding: '20px', fontWeight: 800, color: 'var(--gray-400)' }}>#{cn.id_chuc_nang}</td>
                <td style={{ padding: '20px' }}>
                  <span style={{ padding: '6px 14px', background: 'var(--secondary)', color: 'white', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 900, fontFamily: 'monospace' }}>
                    {cn.ma_chuc_nang}
                  </span>
                </td>
                <td style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', background: 'var(--primary-light)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>extension</span>
                    </div>
                    <span style={{ fontWeight: 800, color: 'var(--ink)' }}>{cn.ten_chuc_nang}</span>
                  </div>
                </td>
                <td style={{ padding: '20px', color: 'var(--gray-500)', fontWeight: 600, fontSize: '0.85rem', maxWidth: '300px' }}>{cn.mo_ta}</td>
                <td style={{ padding: '20px', textAlign: 'center' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 900, fontSize: '0.8rem' }}>● HOẠT ĐỘNG</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default React.memo(QuanLyChucNang);
