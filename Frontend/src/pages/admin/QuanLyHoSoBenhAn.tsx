import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "@services/axios";
import { matchesSearchFields } from "@utils/index";
import { useAutoRefresh } from "@hooks/useAutoRefresh";
import useVirtualScroll from "@hooks/useVirtualScroll";

const chuyenNgayISO_SangVN = (dateString: string) => {
  if (!dateString) return "";
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
  const [searchHoSo, setSearchHoSo] = useState("");

  // Phân trang - Tăng size để Virtual Scroll có ý nghĩa (audit 40-300+ items)
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 200;

  // useCallback để tránh tạo function mới mỗi render → ngăn useEffect vòng lặp vô tận
  const fetchData = useCallback(() => {
    if (hoSos.length === 0) setLoading(true);
    axiosInstance.get("/api/ho-so-benh-an", {
      params: { page: currentPage - 1, size: ITEMS_PER_PAGE, search: searchHoSo.trim() || undefined }
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchHoSo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  useAutoRefresh(fetchData, { runImmediately: false });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchHoSo]);

  const filteredHoSos = React.useMemo(() => {
    if (isServerPaginated || !searchHoSo.trim()) return hoSos;
    return hoSos.filter(h => matchesSearchFields(searchHoSo, [
      h.id_ho_so,
      h.ten_thu_cung,
      h.giong_loai,
      h.ten_khach_hang,
      h.ten_bac_si,
      h.trieu_chung,
      h.chan_doan,
      h.trang_thai_ho_so
    ]));
  }, [hoSos, isServerPaginated, searchHoSo]);

  const totalPages = isServerPaginated ? totalServerPages : Math.ceil(filteredHoSos.length / ITEMS_PER_PAGE);
  const currentRows = isServerPaginated ? hoSos : filteredHoSos.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Virtual Scrolling configuration
  const VIRTUAL_ITEM_HEIGHT = 80;
  const VIRTUAL_CONTAINER_HEIGHT = 500;
  const { visibleItems, containerRef, onScrollHandler, visibleRange, shouldVirtualize } = useVirtualScroll({
    items: currentRows,
    itemHeight: VIRTUAL_ITEM_HEIGHT,
    containerHeight: VIRTUAL_CONTAINER_HEIGHT,
    visibleCount: 6,
    threshold: 3
  });

  if (loading && hoSos.length === 0) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div className="dot-pulse"></div>
    </div>
  );


  return (
    <div className="animate-fade-in">
      <style>{`
        .admin-record-mobile-list { display: none; }
        @media screen and (max-width: 1024px) {
          .admin-record-header {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 12px !important;
            margin-bottom: 16px !important;
          }
          .admin-record-header h1 {
            max-width: 12ch !important;
            font-size: clamp(1.42rem, 6.4vw, 1.78rem) !important;
            line-height: 1.08 !important;
            letter-spacing: -0.02em !important;
            margin: 0 0 6px !important;
          }
          .admin-record-header p {
            max-width: 32ch !important;
            margin: 0 !important;
            font-size: 0.82rem !important;
            line-height: 1.45 !important;
          }
          .admin-record-search {
            width: min(100%, 300px) !important;
            min-height: 42px !important;
            border-radius: 16px !important;
          }
          .admin-record-desktop-table {
            display: none !important;
          }
          .admin-record-mobile-list {
            display: grid !important;
            gap: 10px;
            padding: 10px;
          }
          .admin-record-card {
            display: grid;
            gap: 10px;
            padding: 12px;
            border-radius: 18px;
            background: var(--surface);
            border: 1px solid var(--gray-100);
          }
          .admin-record-card-top {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 10px;
            align-items: start;
          }
          .admin-record-card h3 {
            margin: 0;
            color: var(--ink);
            font-size: 0.95rem;
            line-height: 1.22;
            font-weight: 950;
          }
          .admin-record-card p {
            margin: 4px 0 0;
            color: var(--gray-500);
            font-size: 0.72rem;
            line-height: 1.35;
            font-weight: 700;
            overflow-wrap: anywhere;
          }
          .admin-record-status {
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
          .admin-record-card .btn {
            width: 100%;
            min-height: 36px;
            justify-content: center;
            border-radius: 13px !important;
            padding: 7px 10px !important;
          }
        }
      `}</style>
      <div className="admin-record-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2.8rem', fontWeight: 950, letterSpacing: '-2px', margin: '0 0 8px 0' }}>Hồ sơ bệnh án</h1>
          <p style={{ color: 'var(--gray-500)', fontWeight: 600, fontSize: '1.05rem' }}>Quản lý bệnh án điện tử và lịch sử điều trị của bệnh nhân chuẩn quốc tế.</p>
        </div>
        <div className="glass-card admin-record-search" style={{ display: 'flex', alignItems: 'center', padding: '0 16px', borderRadius: '16px', border: '1px solid var(--gray-200)', background: 'var(--surface)', width: '300px' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--gray-400)', marginRight: '8px' }}>search</span>
          <input data-ai-id="input-quanlyhosobenhan-jfml"
            type="text"
            placeholder="Tìm mã HS, thú cưng, bác sĩ, chẩn đoán..."
            value={searchHoSo}
            onChange={(e) => setSearchHoSo(e.target.value)}
            style={{ border: 'none', outline: 'none', background: 'transparent', padding: '10px 0', fontWeight: 600, width: '100%', color: 'var(--ink)', fontSize: '0.9rem' }}
          />
        </div>
      </div>

      <div className="glass-card" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
        <div className="admin-record-mobile-list">
          {currentRows.length === 0 ? (
            <div className="admin-empty-state" style={{ padding: '18px 10px', textAlign: 'center', color: 'var(--gray-500)', fontWeight: 800 }}>
              Không tìm thấy hồ sơ bệnh án phù hợp.
            </div>
          ) : currentRows.map((h) => (
            <article key={h.id_ho_so} className="admin-record-card">
              <div className="admin-record-card-top">
                <div>
                  <h3>{h.id_ho_so?.startsWith('HS-') ? `#${h.id_ho_so}` : `#HS-${h.id_ho_so}`} · {h.ten_thu_cung || "Chưa rõ"}</h3>
                  <p>{chuyenNgayISO_SangVN(h.ngay_kham)} · {h.ten_bac_si || "Đang chờ bác sĩ"}</p>
                </div>
                <span
                  className="admin-record-status"
                  style={{
                    background: h.trang_thai_ho_so?.toLowerCase() === 'hoan_tat' ? 'var(--primary-light)' : 'var(--gray-100)',
                    color: h.trang_thai_ho_so?.toLowerCase() === 'hoan_tat' ? 'var(--primary)' : 'var(--gray-500)'
                  }}
                >
                  {h.trang_thai_ho_so?.toUpperCase() || 'LƯU NHÁP'}
                </span>
              </div>
              <p>{h.chan_doan || "Chưa có chẩn đoán"}</p>
              <Link to={`/quan-ly/chi-tiet-benh-an/${h.id_ho_so}`} className="btn" style={{ background: 'var(--primary-light)', color: 'var(--primary)', display: 'inline-flex' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>visibility</span>
              </Link>
            </article>
          ))}
        </div>
        <div className="table-responsive-wrapper admin-record-desktop-table">
          <div style={{ minWidth: '800px' }}>
            <div
              ref={containerRef}
              onScroll={onScrollHandler}
              style={shouldVirtualize ? { height: `${VIRTUAL_CONTAINER_HEIGHT}px`, overflowY: 'auto', overflowX: 'hidden' } : {}}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: shouldVirtualize ? 'sticky' : undefined, top: shouldVirtualize ? 0 : undefined, zIndex: shouldVirtualize ? 2 : undefined, background: 'var(--gray-50)', color: 'var(--gray-500)', textAlign: 'left', borderBottom: '1px solid var(--gray-200)' }}>
                  <tr>
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
                  {shouldVirtualize && visibleRange.start > 0 && (
                    <tr style={{ height: `${visibleRange.start * VIRTUAL_ITEM_HEIGHT}px` }} aria-hidden="true"><td colSpan={7} /></tr>
                  )}
                  {currentRows.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--gray-500)', fontWeight: 700 }}>
                        Không tìm thấy hồ sơ bệnh án phù hợp. Hãy thử xóa bộ lọc hoặc tìm kiếm khác.
                      </td>
                    </tr>
                  ) : (shouldVirtualize ? visibleItems : currentRows).map((h) => (
                    <tr key={h.id_ho_so} style={{ borderBottom: '1px solid var(--gray-50)', transition: 'all 0.2s', height: `${VIRTUAL_ITEM_HEIGHT}px` }}>
                      <td style={{ padding: '20px', fontWeight: 800, color: 'var(--gray-400)' }}>{h.id_ho_so?.startsWith('HS-') ? `#${h.id_ho_so}` : `#HS-${h.id_ho_so}`}</td>
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
                      <td style={{ padding: '20px', color: 'var(--ink)', fontWeight: 500, maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.chan_doan || ""}</td>
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
                        <Link to={`/quan-ly/chi-tiet-benh-an/${h.id_ho_so}`} aria-label={`Xem hồ sơ bệnh án #${h.id_ho_so}`} title={`Xem hồ sơ bệnh án #${h.id_ho_so}`} className="btn" style={{ padding: '8px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'inline-flex' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>visibility</span>
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {shouldVirtualize && visibleRange.end < currentRows.length && (
                    <tr style={{ height: `${(currentRows.length - visibleRange.end) * VIRTUAL_ITEM_HEIGHT}px` }} aria-hidden="true"><td colSpan={7} /></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

      {/* BỘ NÚT ĐIỀU HƯỚNG PHÂN TRANG */}
      {totalPages > 1 && (
        <div className="stagger-2" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '30px', marginBottom: '20px' }}>
          <button data-ai-id="button-quanlyhosobenhan-irfu"
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
          <button data-ai-id="button-quanlyhosobenhan-jw31"
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
