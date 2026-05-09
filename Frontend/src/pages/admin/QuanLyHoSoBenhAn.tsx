import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "@services/axios";

const chuyenNgayISO_SangVN = (dateString: string) => {
  if (!dateString) return "—";
  const parts = dateString.split('T')[0].split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateString;
};

const QuanLyHoSoBenhAn: React.FC = () => {
  const [hoSos, setHoSos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // State hỗ trợ Phân trang Server-side
  const [totalServerPages, setTotalServerPages] = useState(1);
  const [isServerPaginated, setIsServerPaginated] = useState(false);

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const fetchData = () => {
    setLoading(true);
    axiosInstance.get("/api/ho-so-benh-an", {
      params: { page: currentPage - 1, size: ITEMS_PER_PAGE }
    })
      .then(res => {
        if (res.data && res.data.content) {
          setHoSos(res.data.content);
          setTotalServerPages(res.data.totalPages);
          setIsServerPaginated(true);
        } else {
          setHoSos(res.data || []);
          setIsServerPaginated(false);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi lấy danh sách hồ sơ:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  const totalPages = isServerPaginated ? totalServerPages : Math.ceil(hoSos.length / ITEMS_PER_PAGE);
  const currentRows = isServerPaginated ? hoSos : hoSos.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (loading && hoSos.length === 0) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div className="dot-pulse"></div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '40px' }}>
        <h1 className="text-gradient" style={{ fontSize: '2.8rem', fontWeight: 950, letterSpacing: '-2px', margin: '0 0 8px 0' }}>Hồ sơ bệnh án</h1>
        <p style={{ color: 'var(--gray-500)', fontWeight: 600, fontSize: '1.05rem' }}>Quản lý bệnh án điện tử và lịch sử điều trị của bệnh nhân chuẩn quốc tế.</p>
      </div>

      <div className="glass-card" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--secondary-gradient)', color: 'white', textAlign: 'left' }}>
              <th style={{ padding: '24px 20px', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>MÃ HỒ SƠ</th>
              <th style={{ padding: '24px 20px', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>NGÀY KHÁM</th>
              <th style={{ padding: '24px 20px', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>THÚ CƯNG</th>
              <th style={{ padding: '24px 20px', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>BÁC SĨ ĐIỀU TRỊ</th>
              <th style={{ padding: '24px 20px', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>CHẨN ĐOÁN</th>
              <th style={{ padding: '24px 20px', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>TRẠNG THÁI</th>
              <th style={{ padding: '24px 20px', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center' }}>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {currentRows.map((h) => (
              <tr key={h.id_ho_so} style={{ borderBottom: '1px solid var(--gray-50)', transition: 'all 0.2s' }}>
                <td style={{ padding: '20px', fontWeight: 800, color: 'var(--gray-400)' }}>#HS-{h.id_ho_so}</td>
                <td style={{ padding: '20px', fontWeight: 700 }}>{chuyenNgayISO_SangVN(h.ngay_kham)}</td>
                <td style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '32px', height: '32px', background: 'var(--primary-light)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>pets</span>
                    </div>
                    <span style={{ fontWeight: 800, color: 'var(--ink)' }}>{h.ten_thu_cung || "Chưa rõ"}</span>
                  </div>
                </td>
                <td style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>medical_information</span>
                    <span style={{ fontWeight: 700 }}>{h.ten_bac_si || "Đang chờ"}</span>
                  </div>
                </td>
                <td style={{ padding: '20px', color: 'var(--ink)', fontWeight: 500, maxWidth: '250px' }}>{h.chan_doan || "—"}</td>
                <td style={{ padding: '20px' }}>
                  <span style={{
                    padding: '6px 16px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 800,
                    background: h.trang_thai_ho_so?.toLowerCase() === 'hoan_tat' ? 'var(--primary-light)' : 'var(--gray-100)',
                    color: h.trang_thai_ho_so?.toLowerCase() === 'hoan_tat' ? 'var(--primary)' : 'var(--gray-500)'
                  }}>
                    {h.trang_thai_ho_so?.toUpperCase() || 'LƯU NHÁP'}
                  </span>
                </td>
                <td style={{ padding: '20px', textAlign: 'center' }}>
                  <Link to={`/quan-ly/ho-so-benh-an/${h.id_ho_so}`} className="btn" style={{ padding: '8px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'inline-flex' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>visibility</span>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* BỘ NÚT ĐIỀU HƯỚNG PHÂN TRANG */}
      {totalPages > 1 && (
        <div className="stagger-2" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '30px', marginBottom: '20px' }}>
          <button
            className="btn btn-pill"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            style={{
              background: 'var(--surface)', border: '1px solid var(--glass-border)',
              color: currentPage === 1 ? 'var(--gray-300)' : 'var(--ink)',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              padding: '12px 24px', fontWeight: 800, boxShadow: 'var(--shadow-sm)'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span> Trước
          </button>
          <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '10px 20px', borderRadius: '12px', fontWeight: 900, fontSize: '0.9rem' }}>
            Trang {currentPage} / {totalPages}
          </div>
          <button
            className="btn btn-pill"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            style={{
              background: 'var(--surface)', border: '1px solid var(--glass-border)',
              color: currentPage === totalPages ? 'var(--gray-300)' : 'var(--ink)',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              padding: '12px 24px', fontWeight: 800, boxShadow: 'var(--shadow-sm)'
            }}
          >
            Sau <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default React.memo(QuanLyHoSoBenhAn);
