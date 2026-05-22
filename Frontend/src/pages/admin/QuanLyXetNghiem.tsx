import React, { useState, useEffect } from "react";
import axiosInstance from "@services/axios";
import { Modal, InfoRow } from "@components/CommonUI";
import { matchesSearchFields } from "@utils/index";

const chuyenNgayISO_SangVN = (dateString: string) => {
  if (!dateString) return "—";
  const parts = dateString.split('T')[0].split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateString;
};

const QuanLyXetNghiem: React.FC = () => {
  const [xetNghiems, setXetNghiems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingXN, setViewingXN] = useState<any>(null);
  const [searchXetNghiem, setSearchXetNghiem] = useState("");

  useEffect(() => {
    axiosInstance.get("/api/ho-so-benh-an/xet-nghiem")
      .then(res => {
        setXetNghiems(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi lấy danh sách xét nghiệm:", err);
        setLoading(false);
      });
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-1px' }}>Quản lý Xét nghiệm</h1>
          <p style={{ color: 'var(--gray-500)', fontWeight: 600 }}>Theo dõi các chỉ số và kết quả xét nghiệm lâm sàng.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', padding: '0 16px', borderRadius: '16px', border: '1px solid var(--gray-200)', background: 'var(--surface)', width: '260px' }}>
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
        <div className="table-responsive-wrapper">
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
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 600 }}>Hồ sơ: HS-{xn.id_ho_so}</div>
                </td>
                <td style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>medical_information</span>
                    <span style={{ fontWeight: 700 }}>{xn.ten_bac_si || "—"}</span>
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
                <InfoRow label="Mã hồ sơ" value={`#HS-${viewingXN.id_ho_so}`} />
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
