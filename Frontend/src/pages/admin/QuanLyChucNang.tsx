import React, { useState, useEffect } from "react";
import axiosInstance from "@services/axios";
import { useAutoRefresh } from "@hooks/useAutoRefresh";

const QuanLyChucNang: React.FC = () => {
  const [chucNangs, setChucNangs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const getIcon = (code: string) => {
    if (code.includes("LICH")) return "calendar_month";
    if (code.includes("KHAM") || code.includes("BENH") || code.includes("DON_THUOC")) return "medical_services";
    if (code.includes("KHO") || code.includes("NHAP")) return "inventory_2";
    if (code.includes("HOA_DON") || code.includes("KE_TOAN")) return "receipt_long";
    if (code.includes("NHAN_SU")) return "badge";
    if (code.includes("KHACH")) return "pets";
    if (code.includes("DICH_VU")) return "local_activity";
    if (code.includes("CAU_HINH")) return "settings";
    if (code.includes("MARKETING")) return "campaign";
    return "extension";
  };

  const fetchChucNangs = () => {
    axiosInstance.get("/api/system/chuc-nang")
      .then(res => {
        setChucNangs(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi lấy danh sách chức năng:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchChucNangs();
  }, []);

  useAutoRefresh(fetchChucNangs, { runImmediately: false });

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div className="dot-pulse"></div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <style>{`
        .admin-feature-mobile-list { display: none; }
        @media screen and (max-width: 1024px) {
          .admin-feature-header {
            margin-bottom: 16px !important;
          }
          .admin-feature-header h1 {
            max-width: 12ch !important;
            font-size: clamp(1.42rem, 6.4vw, 1.78rem) !important;
            line-height: 1.08 !important;
            letter-spacing: -0.02em !important;
            margin: 0 0 6px !important;
          }
          .admin-feature-header p {
            max-width: 32ch !important;
            margin: 0 !important;
            font-size: 0.82rem !important;
            line-height: 1.45 !important;
          }
          .admin-feature-kpis {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
            margin-bottom: 16px !important;
          }
          .admin-feature-kpis .glass-card {
            padding: 13px !important;
            border-radius: 16px !important;
          }
          .admin-feature-kpis .glass-card > div:first-child {
            font-size: 0.66rem !important;
          }
          .admin-feature-kpis .glass-card > div:last-child {
            font-size: 1.35rem !important;
            line-height: 1.15 !important;
          }
          .admin-feature-desktop-table {
            display: none !important;
          }
          .admin-feature-mobile-list {
            display: grid !important;
            gap: 10px;
            padding: 10px;
          }
          .admin-feature-card {
            display: grid;
            gap: 10px;
            padding: 12px;
            border-radius: 18px;
            background: var(--surface);
            border: 1px solid var(--gray-100);
          }
          .admin-feature-card-top {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 10px;
            align-items: start;
          }
          .admin-feature-card h3 {
            margin: 0;
            color: var(--ink);
            font-size: 0.95rem;
            line-height: 1.22;
            font-weight: 950;
          }
          .admin-feature-card p {
            margin: 4px 0 0;
            color: var(--gray-500);
            font-size: 0.72rem;
            line-height: 1.35;
            font-weight: 700;
            overflow-wrap: anywhere;
          }
          .admin-feature-code,
          .admin-feature-status {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 28px;
            padding: 5px 9px;
            border-radius: 999px;
            font-size: 0.62rem;
            line-height: 1;
            font-weight: 950;
            white-space: nowrap;
          }
          .admin-feature-code {
            background: var(--primary-light);
            color: var(--primary);
            font-family: monospace;
          }
          .admin-feature-status {
            justify-self: start;
            background: rgba(34,197,94,0.12);
            color: #16a34a;
          }
        }
      `}</style>
      <div className="admin-feature-header" style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-1px' }}>Phân hệ chức năng</h1>
        <p style={{ color: 'var(--gray-500)', fontWeight: 600 }}>Quản trị các mô-đun nghiệp vụ và phân cấp tính năng hệ thống.</p>
      </div>

      <div className="admin-feature-kpis" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="glass-card" style={{ padding: '18px', borderRadius: '18px', borderLeft: '4px solid var(--primary)' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)', fontWeight: 900, letterSpacing: '0.8px' }}>TỔNG PHÂN HỆ</div>
          <div style={{ fontSize: '2rem', color: 'var(--ink)', fontWeight: 950 }}>{chucNangs.length}</div>
        </div>
        <div className="glass-card" style={{ padding: '18px', borderRadius: '18px', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)', fontWeight: 900, letterSpacing: '0.8px' }}>ĐANG HOẠT ĐỘNG</div>
          <div style={{ fontSize: '2rem', color: '#10b981', fontWeight: 950 }}>{chucNangs.length}</div>
        </div>
        <div className="glass-card" style={{ padding: '18px', borderRadius: '18px', borderLeft: '4px solid #06b6d4' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--gray-500)', fontWeight: 900, letterSpacing: '0.8px' }}>NGUỒN DỮ LIỆU</div>
          <div style={{ fontSize: '1rem', color: 'var(--ink)', fontWeight: 900, marginTop: '10px' }}>Đồng bộ route & quyền thật</div>
        </div>
      </div>

      <div className="glass-card" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
        <div className="admin-feature-mobile-list">
          {chucNangs.map((cn) => (
            <article key={cn.id_chuc_nang} className="admin-feature-card">
              <div className="admin-feature-card-top">
                <div>
                  <h3>{cn.ten_chuc_nang}</h3>
                  <p>{cn.mo_ta || 'Chưa có mô tả'}</p>
                </div>
                <span className="admin-feature-code">{cn.ma_chuc_nang}</span>
              </div>
              <p>{cn.duong_dan || 'Chưa gắn route'} · Quyền: {cn.vai_tro || '—'}</p>
              <span className="admin-feature-status">HOẠT ĐỘNG</span>
            </article>
          ))}
        </div>
        <div className="table-responsive-wrapper admin-feature-desktop-table">
<div style={{ minWidth: '800px' }}>
<table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--gray-50)', textAlign: 'left' }}>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>ID</th>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>MÃ PHÂN HỆ</th>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>TÊN CHỨC NĂNG</th>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>MÔ TẢ CHI TIẾT</th>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>ROUTE</th>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>QUYỀN</th>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800, textAlign: 'center' }}>TRẠNG THÁI</th>
            </tr>
          </thead>
          <tbody>
            {chucNangs.map((cn) => (
              <tr key={cn.id_chuc_nang} style={{ borderBottom: '1px solid var(--gray-50)', transition: 'all 0.2s' }}>
                <td style={{ padding: '20px', fontWeight: 800, color: 'var(--gray-400)' }}>#{cn.id_chuc_nang}</td>
                <td style={{ padding: '20px' }}>
                  <span style={{ padding: '6px 14px', background: 'var(--secondary)', color: 'white', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 900, fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                    {cn.ma_chuc_nang}
                  </span>
                </td>
                <td style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', background: 'var(--primary-light)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{getIcon(cn.ma_chuc_nang || "")}</span>
                    </div>
                    <span style={{ fontWeight: 800, color: 'var(--ink)' }}>{cn.ten_chuc_nang}</span>
                  </div>
                </td>
                <td style={{ padding: '20px', color: 'var(--gray-500)', fontWeight: 600, fontSize: '0.85rem', maxWidth: '300px' }}>{cn.mo_ta}</td>
                <td style={{ padding: '20px', color: 'var(--primary)', fontWeight: 800, fontSize: '0.78rem', fontFamily: 'monospace', maxWidth: '220px', wordBreak: 'break-word' }}>{cn.duong_dan || "—"}</td>
                <td style={{ padding: '20px', color: 'var(--gray-500)', fontWeight: 800, fontSize: '0.76rem', maxWidth: '260px', wordBreak: 'break-word' }}>{cn.vai_tro || "—"}</td>
                <td style={{ padding: '20px', textAlign: 'center' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 900, fontSize: '0.8rem' }}>● HOẠT ĐỘNG</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
</div></div>
      </div>
    </div>
  );
};

export default React.memo(QuanLyChucNang);
