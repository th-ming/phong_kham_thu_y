import React, { useState, useEffect } from "react";
import axiosInstance from "@services/axios";
import { Modal, InfoRow } from "@components/CommonUI";
import { matchesSearchFields } from "@utils/index";
import { useAutoRefresh } from "@hooks/useAutoRefresh";

const chuyenNgayISO_SangVN = (dateString: string) => {
  if (!dateString) return "";
  const parts = dateString.split('T')[0].split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateString;
};

const QuanLyXetNghiem: React.FC = () => {
  const [xetNghiems, setXetNghiems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingXN, setViewingXN] = useState<any>(null);
  const [searchXetNghiem, setSearchXetNghiem] = useState("");

  const fetchXetNghiems = () => {
    axiosInstance.get("/api/ho-so-benh-an/xet-nghiem")
      .then(res => {
        setXetNghiems(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi lấy danh sách xét nghiệm:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchXetNghiems();
  }, []);

  useAutoRefresh(fetchXetNghiems, { runImmediately: false });

  useEffect(() => {
    const handleRealtimeUpdate = () => {
      fetchXetNghiems();
    };
    window.addEventListener("rexi-data-changed", handleRealtimeUpdate);
    return () => window.removeEventListener("rexi-data-changed", handleRealtimeUpdate);
  }, []);

  const filteredXetNghiems = React.useMemo(() => {
    if (!searchXetNghiem.trim()) return xetNghiems;
    return xetNghiems.filter(xn => matchesSearchFields(searchXetNghiem, [
      xn.id_xet_nghiem_benh_an,
      xn.id_ho_so,
      xn.ten_xet_nghiem,
      xn.ten_bac_si,
      xn.trang_thai,
      xn.ket_qua_tong_quat,
      xn.ngay_chi_dinh,
      xn.ngay_lay_mau
    ]));
  }, [xetNghiems, searchXetNghiem]);

  if (loading && xetNghiems.length === 0) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div className="dot-pulse"></div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <style>{`
        .admin-lab-mobile-list { display: none; }
        @media screen and (max-width: 1024px) {
          .admin-lab-header {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 12px !important;
            margin-bottom: 16px !important;
          }
          .admin-lab-header h1 {
            max-width: 100% !important;
            font-size: clamp(1.42rem, 6.4vw, 1.78rem) !important;
            line-height: 1.08 !important;
            letter-spacing: -0.02em !important;
            margin: 0 0 6px !important;
          }
          .admin-lab-header p {
            max-width: 32ch !important;
            margin: 0 !important;
            font-size: 0.82rem !important;
            line-height: 1.45 !important;
          }
          .admin-lab-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
            width: min(100%, 300px) !important;
            gap: 8px !important;
          }
          .admin-lab-search {
            width: 100% !important;
            min-height: 42px !important;
            border-radius: 16px !important;
          }
          .admin-lab-actions .btn {
            width: 100% !important;
            min-height: 42px !important;
            justify-content: center !important;
            border-radius: 16px !important;
            padding: 9px 14px !important;
            font-size: 0.8rem !important;
          }
          .admin-lab-desktop-table {
            display: none !important;
          }
          .admin-lab-mobile-list {
            display: grid !important;
            gap: 10px;
            padding: 10px;
          }
          .admin-lab-card {
            display: grid;
            gap: 10px;
            padding: 12px;
            border-radius: 18px;
            background: var(--surface);
            border: 1px solid var(--gray-100);
          }
          .admin-lab-card-top {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 10px;
            align-items: start;
          }
          .admin-lab-card h3 {
            margin: 0;
            color: var(--ink);
            font-size: 0.95rem;
            line-height: 1.22;
            font-weight: 950;
          }
          .admin-lab-card p {
            margin: 4px 0 0;
            color: var(--gray-500);
            font-size: 0.72rem;
            line-height: 1.35;
            font-weight: 700;
            overflow-wrap: anywhere;
          }
          .admin-lab-status {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 28px;
            padding: 5px 9px;
            border-radius: 999px;
            font-size: 0.66rem;
            line-height: 1;
            font-weight: 950;
            white-space: nowrap;
          }
          .admin-lab-card .btn {
            width: 100%;
            min-height: 36px;
            justify-content: center;
            border-radius: 13px !important;
            padding: 7px 10px !important;
          }
        }
      `}</style>
      <div className="admin-lab-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-1px' }}>Quản lý Xét nghiệm</h1>
          <p style={{ color: 'var(--gray-500)', fontWeight: 600 }}>Theo dõi các chỉ số và kết quả xét nghiệm lâm sàng.</p>
        </div>
        <div className="admin-lab-actions" style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="glass-card admin-lab-search" style={{ display: 'flex', alignItems: 'center', padding: '0 16px', borderRadius: '16px', border: '1px solid var(--gray-200)', background: 'var(--surface)', width: '260px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--gray-400)', marginRight: '8px' }}>search</span>
            <input data-ai-id="input-quanlyxetnghiem-xn2r"
              type="text"
              placeholder="Tìm mã XN, loại, bác sĩ, HS..."
              value={searchXetNghiem}
              onChange={(e) => setSearchXetNghiem(e.target.value)}
              style={{ border: 'none', outline: 'none', background: 'transparent', padding: '10px 0', fontWeight: 600, width: '100%', color: 'var(--ink)', fontSize: '0.9rem' }}
            />
          </div>
          <button data-ai-id="button-quanlyxetnghiem-hrp9" className="btn btn-primary btn-pill" onClick={() => alert("Hệ thống đang chờ tích hợp máy xét nghiệm hardware. Vui lòng nhập kết quả thủ công trong hồ sơ bệnh án.")}>
            <span className="material-symbols-outlined">biotech</span>
            Tạo phiếu mới
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
        <div className="admin-lab-mobile-list">
          {filteredXetNghiems.length === 0 ? (
            <div className="admin-empty-state" style={{ padding: '18px 10px', textAlign: 'center', color: 'var(--gray-500)', fontWeight: 800 }}>
              Không có xét nghiệm phù hợp.
            </div>
          ) : filteredXetNghiems.map((xn) => (
            <article key={xn.id_xet_nghiem_benh_an} className="admin-lab-card">
              <div className="admin-lab-card-top">
                <div>
                  <h3>#XN-{xn.id_xet_nghiem_benh_an} · {xn.ten_xet_nghiem || "Tổng quát"}</h3>
                  <p>{xn.id_ho_so?.startsWith('HS-') ? xn.id_ho_so : `HS-${xn.id_ho_so}`} · {xn.ten_bac_si || "Chưa có bác sĩ"}</p>
                </div>
                <span
                  className="admin-lab-status"
                  style={{
                    background: xn.trang_thai?.toLowerCase() === 'hoan_thanh' ? 'var(--primary-light)' : 'var(--warning-light, rgba(245, 158, 11, 0.15))',
                    color: xn.trang_thai?.toLowerCase() === 'hoan_thanh' ? 'var(--primary)' : 'var(--warning, #d97706)'
                  }}
                >
                  {xn.trang_thai?.toUpperCase() || 'ĐANG XỬ LÝ'}
                </span>
              </div>
              <p>Ngày lấy mẫu: {chuyenNgayISO_SangVN(xn.ngay_lay_mau)}</p>
              <button data-ai-id="button-quanlyxetnghiem-mobile-view" className="btn" onClick={() => setViewingXN(xn)} style={{ background: 'var(--gray-50)', color: 'var(--ink)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>visibility</span>
              </button>
            </article>
          ))}
        </div>
        <div className="table-responsive-wrapper admin-lab-desktop-table">
<div style={{ minWidth: '800px' }}>
<table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--gray-50)', textAlign: 'left' }}>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>MÃ XN</th>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>LOẠI XÉT NGHIỆM</th>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>BÁC SĨ CHỈ ĐỊNH</th>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>NGÀY LẤY MẪU</th>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>TRẠNG THÁI</th>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800, textAlign: 'center' }}>XEM</th>
            </tr>
          </thead>
          <tbody>
            {filteredXetNghiems.map((xn) => (
              <tr key={xn.id_xet_nghiem_benh_an} style={{ borderBottom: '1px solid var(--gray-50)', transition: 'all 0.2s' }}>
                <td style={{ padding: '20px', fontWeight: 800, color: 'var(--gray-400)' }}>#XN-{xn.id_xet_nghiem_benh_an}</td>
                <td style={{ padding: '20px' }}>
                  <div style={{ fontWeight: 800, color: 'var(--ink)' }}>{xn.ten_xet_nghiem || "Tổng quát"}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 600 }}>Hồ sơ: {xn.id_ho_so?.startsWith('HS-') ? xn.id_ho_so : `HS-${xn.id_ho_so}`}</div>
                </td>
                <td style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>medical_information</span>
                    <span style={{ fontWeight: 700 }}>{xn.ten_bac_si || ""}</span>
                  </div>
                </td>
                <td style={{ padding: '20px', fontWeight: 700 }}>{chuyenNgayISO_SangVN(xn.ngay_lay_mau)}</td>
                <td style={{ padding: '20px' }}>
                  <span style={{
                    padding: '6px 16px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 800,
                    background: xn.trang_thai?.toLowerCase() === 'hoan_thanh' ? 'var(--primary-light)' : 'var(--warning-light, rgba(245, 158, 11, 0.15))',
                    color: xn.trang_thai?.toLowerCase() === 'hoan_thanh' ? 'var(--primary)' : 'var(--warning, #d97706)'
                  }}>
                    {xn.trang_thai?.toUpperCase() || 'ĐANG XỬ LÝ'}
                  </span>
                </td>
                <td style={{ padding: '20px', textAlign: 'center' }}>
                  <button data-ai-id="button-quanlyxetnghiem-xupv" className="btn" onClick={() => setViewingXN(xn)} style={{ padding: '8px', background: 'var(--gray-50)', color: 'var(--ink)' }}>
                    <span className="material-symbols-outlined">visibility</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
</div></div>
      </div>

      <Modal isOpen={!!viewingXN} onClose={() => setViewingXN(null)} title="Kết quả xét nghiệm" maxWidth="600px">
        {viewingXN && (
          <div style={{ display: 'grid', gap: '24px' }}>
            <div style={{ background: 'var(--gray-50)', padding: '24px', borderRadius: '24px' }}>
              <div className="responsive-grid-2">
                <InfoRow label="Loại xét nghiệm" value={viewingXN.ten_xet_nghiem || 'Tổng quát'} />
                <InfoRow label="Ngày lấy mẫu" value={chuyenNgayISO_SangVN(viewingXN.ngay_lay_mau)} />
                <InfoRow label="Bác sĩ" value={viewingXN.ten_bac_si || '—'} />
                <InfoRow label="Mã hồ sơ" value={viewingXN.id_ho_so?.startsWith('HS-') ? `#${viewingXN.id_ho_so}` : `#HS-${viewingXN.id_ho_so}`} />
              </div>
            </div>

            <div>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', fontWeight: 900, color: 'var(--ink)' }}>KẾT QUẢ PHÂN TÍCH</h4>
              <div style={{ padding: '20px', background: 'var(--surface)', border: '1px solid var(--gray-200)', borderRadius: '16px' }}>
                <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--ink)', lineHeight: 1.6, fontWeight: 700 }}>
                  {viewingXN.ket_qua || "Chưa có kết quả phân tích chi tiết. Vui lòng liên hệ phòng lab hoặc đợi máy đồng bộ."}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button data-ai-id="button-quanlyxetnghiem-bsqm" className="btn btn-pill" onClick={() => setViewingXN(null)} style={{ background: 'var(--gray-100)', color: 'var(--ink)' }}>Đóng</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default React.memo(QuanLyXetNghiem);
