import React, { useState, useEffect } from "react";
import axiosInstance from "@services/axios";
import ModalTaoLichHenAdmin from "./ModalTaoLichHenAdmin";
import { Modal, InfoRow } from "@components/CommonUI";
import { toast } from "@components/Toast";
import { matchesSearchFields, fixVietnameseEncoding } from "@utils/index";
import { useAutoRefresh } from "@hooks/useAutoRefresh";
import useVirtualScroll from "@hooks/useVirtualScroll";

const chuyenNgayISO_SangVN = (dateString: string) => {
  if (!dateString) return "—";
  const parts = dateString.split('T')[0].split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateString;
};

const gioRutGon = (timeString: string) => {
  if (!timeString) return "—";
  return timeString.substring(0, 5);
};

const QuanLyLichHen: React.FC = () => {
  const [lichHens, setLichHens] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchLichHen, setSearchLichHen] = useState("");

  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingLichHen, setViewingLichHen] = useState<any>(null);
  const [editingLichHen, setEditingLichHen] = useState<any>(null);
  const [updating, setUpdating] = useState(false);

  // State hỗ trợ Phân trang Server-side
  const [totalServerPages, setTotalServerPages] = useState(1);
  const [isServerPaginated, setIsServerPaginated] = useState(false);

  // Phân trang - Tăng size để Virtual Scroll có ý nghĩa (audit 40-500+ items)
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 200;

  const fetchData = React.useCallback(() => {
    if (lichHens.length === 0) setLoading(true);
    // Truyền page/size để backend có thể phân trang nếu hỗ trợ
    axiosInstance.get("/api/lich-hen", {
      params: {
        page: currentPage - 1,
        size: ITEMS_PER_PAGE,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        search: searchLichHen.trim() || undefined
      }
    })
      .then(res => {
        if (res.data && res.data.content) {
          setLichHens(res.data.content);
          setTotalServerPages(res.data.totalPages);
          setIsServerPaginated(true);
        } else {
          setLichHens(res.data || []);
          setIsServerPaginated(false);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi lấy dữ liệu:", err);
        setLoading(false);
      });
  }, [currentPage, filterStatus, lichHens.length, searchLichHen]);

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    setUpdating(true);
    try {
      await axiosInstance.put(`/api/lich-hen/${id}/status`, { trang_thai: newStatus });
      setEditingLichHen(null);
      toast.success("Đã cập nhật trạng thái lịch hẹn!");
      fetchData();
    } catch (err) {
      toast.error("Lỗi khi cập nhật trạng thái.");
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, filterStatus, searchLichHen]);

  useAutoRefresh(fetchData, { runImmediately: false });

  useEffect(() => {
    const handleRealtimeUpdate = () => {
      fetchData();
    };
    window.addEventListener('rexi-appointments-changed', handleRealtimeUpdate);
    return () => window.removeEventListener('rexi-appointments-changed', handleRealtimeUpdate);
  }, [fetchData]);

  // Reset về trang 1 mỗi khi đổi bộ lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchLichHen]);

  const rows = React.useMemo(() => {
    let filtered = lichHens;
    if (!isServerPaginated) {
      filtered = lichHens.filter(l => filterStatus === 'all' || l.trang_thai?.toUpperCase() === filterStatus.toUpperCase());
    }
    if (!isServerPaginated && searchLichHen.trim() !== "") {
      filtered = filtered.filter(l => {
        return matchesSearchFields(searchLichHen, [
          l.id_lich_hen,
          l.ten_thu_cung,
          l.ten_khach_hang,
          l.sdt,
          l.ten_bac_si,
          l.ten_dich_vu,
          l.ly_do,
          l.ghi_chu,
          l.trang_thai
        ]);
      });
    }
    return filtered;
  }, [lichHens, filterStatus, isServerPaginated, searchLichHen]);

  const totalPages = isServerPaginated ? totalServerPages : Math.ceil(rows.length / ITEMS_PER_PAGE);
  const currentRows = isServerPaginated ? rows : rows.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Virtual Scrolling configuration
  const VIRTUAL_ITEM_HEIGHT = 80;
  const VIRTUAL_CONTAINER_HEIGHT = 500;
  const { visibleItems, containerRef, onScrollHandler, visibleRange, shouldVirtualize } = useVirtualScroll({
    items: currentRows,
    itemHeight: VIRTUAL_ITEM_HEIGHT,
    containerHeight: VIRTUAL_CONTAINER_HEIGHT,
    visibleCount: 8,
    threshold: 4
  });

  if (loading && lichHens.length === 0) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><div className="dot-pulse"></div></div>;


  return (
    <div className="animate-fade-in" style={{ position: 'relative' }}>
      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .stagger-1 { animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both; }
        .stagger-2 { animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both; }
        .table-row:hover { background-color: var(--surface) !important; transform: scale(1.01) translateX(8px); box-shadow: -10px 10px 20px rgba(15, 157, 138, 0.08); z-index: 10; position: relative; border-radius: 16px; }
        [data-theme='dark'] .table-row:hover { background-color: rgba(15, 23, 42, 0.96) !important; box-shadow: -10px 10px 24px rgba(34, 211, 238, 0.08); }
        .admin-appointment-mobile-card { transition: transform 0.2s ease, box-shadow 0.2s ease; animation: slideUpFade 0.4s cubic-bezier(.22,.68,0,1.2) both; }
        .admin-appointment-mobile-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
        .admin-appointment-mobile-list { display: none; }
        @media screen and (max-width: 1024px) {
          .admin-mobile-page-header {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 12px !important;
            margin-bottom: 16px !important;
          }
          .admin-mobile-page-header h1 {
            max-width: 12ch !important;
            font-size: clamp(1.42rem, 6.4vw, 1.78rem) !important;
            line-height: 1.08 !important;
            letter-spacing: -0.02em !important;
            margin: 0 0 6px !important;
          }
          .admin-mobile-page-header p {
            max-width: 32ch !important;
            margin: 0 !important;
            font-size: 0.82rem !important;
            line-height: 1.45 !important;
          }
          .admin-mobile-page-header .btn {
            width: min(100%, 290px) !important;
            min-height: 42px !important;
            justify-content: center !important;
            padding: 9px 14px !important;
            border-radius: 16px !important;
            font-size: 0.82rem !important;
          }
          .admin-mobile-filter-bar {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 10px !important;
            margin-bottom: 16px !important;
          }
          .admin-mobile-filter-tabs {
            width: 100% !important;
            max-width: 100% !important;
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 8px !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          .admin-mobile-filter-tabs button {
            width: 100% !important;
            min-width: 0 !important;
            min-height: 38px !important;
            padding: 8px 10px !important;
            border-radius: 14px !important;
            font-size: 0.66rem !important;
            line-height: 1.12 !important;
            justify-content: center !important;
          }
          .admin-mobile-filter-tabs button .material-symbols-outlined {
            font-size: 16px !important;
          }
          .admin-mobile-search-box {
            width: 100% !important;
            min-height: 42px !important;
            border-radius: 16px !important;
          }
          .admin-appointment-table {
            display: none !important;
          }
          .admin-appointment-mobile-list {
            display: grid !important;
            gap: 10px;
            padding: 10px;
          }
          .admin-appointment-mobile-card {
            display: grid;
            gap: 10px;
            padding: 12px;
            border-radius: 18px;
            background: var(--surface);
            border: 1px solid var(--gray-100);
          }
          .admin-appointment-mobile-top {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 10px;
            align-items: start;
          }
          .admin-appointment-mobile-card h3 {
            margin: 0;
            color: var(--ink);
            font-size: 0.95rem;
            line-height: 1.22;
            font-weight: 950;
          }
          .admin-appointment-mobile-card p {
            margin: 3px 0 0;
            color: var(--gray-500);
            font-size: 0.74rem;
            line-height: 1.35;
            font-weight: 700;
          }
          .admin-appointment-mobile-time,
          .admin-appointment-mobile-status {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 28px;
            padding: 5px 9px;
            border-radius: 999px;
            font-size: 0.68rem;
            line-height: 1;
            font-weight: 950;
            white-space: nowrap;
          }
          .admin-appointment-mobile-time {
            background: var(--primary-light);
            color: var(--primary);
          }
          .admin-appointment-mobile-status {
            justify-self: start;
            max-width: 100%;
            background: rgba(245, 158, 11, 0.14);
            color: #d97706;
          }
          .admin-appointment-mobile-meta {
            display: grid;
            gap: 7px;
            font-size: 0.74rem;
            line-height: 1.35;
            color: var(--gray-500);
            font-weight: 750;
          }
          .admin-appointment-mobile-actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }
          .admin-appointment-mobile-actions .btn {
            min-height: 36px;
            justify-content: center;
            padding: 7px 10px !important;
            border-radius: 13px !important;
          }
        }
        @media screen and (min-width: 1025px) {
          .admin-appointment-mobile-list { display: none !important; }
        }
      `}</style>
      <div className="stagger-1 admin-mobile-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 950, color: 'var(--ink)', letterSpacing: '-1.5px' }}>Điều phối lịch hẹn</h1>
          <p style={{ color: 'var(--gray-500)', fontWeight: 600 }}>Quản lý lộ trình khám và điều phối đội ngũ y bác sĩ.</p>
        </div>
        <button data-ai-id="button-quanlylichhen-nwji" className="btn btn-primary btn-pill" onClick={() => setIsModalOpen(true)}>
          <span className="material-symbols-outlined">add_task</span>
          Thêm lịch hẹn
        </button>
      </div>

      <div className="stagger-1 admin-mobile-filter-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
        <div className="admin-mobile-filter-tabs" style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '4px' }}>
          {[
            { id: 'all', label: 'TẤT CẢ', icon: 'list' },
            { id: 'CHO_XAC_NHAN', label: 'CHỜ XÁC NHẬN', icon: 'pending' },
            { id: 'DA_XAC_NHAN', label: 'ĐÃ XÁC NHẬN', icon: 'check_circle' },
            { id: 'DANG_KHAM', label: 'ĐANG KHÁM', icon: 'medical_services' },
            { id: 'HOAN_THANH', label: 'HOÀN TẤT', icon: 'verified' },
            { id: 'KHONG_DEN', label: 'KHÔNG ĐẾN', icon: 'event_busy' },
            { id: 'DA_HUY', label: 'ĐÃ HỦY', icon: 'cancel' },
          ].map(tab => (
            <button data-ai-id="button-quanlylichhen-rml0"
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              style={{
                padding: '10px 20px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 800,
                background: filterStatus === tab.id ? 'var(--primary)' : 'var(--surface)',
                color: filterStatus === tab.id ? 'white' : 'var(--ink)',
                boxShadow: filterStatus === tab.id ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                transition: 'all 0.3s'
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="glass-card admin-mobile-search-box" style={{ display: 'flex', alignItems: 'center', padding: '0 16px', borderRadius: '16px', border: '1px solid var(--gray-200)', background: 'var(--surface)', width: '300px' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--gray-400)', marginRight: '8px' }}>search</span>
          <input data-ai-id="input-quanlylichhen-zzak"
            type="text"
            placeholder="Tìm tên bé, chủ, bác sĩ, SĐT..."
            value={searchLichHen}
            onChange={(e) => setSearchLichHen(e.target.value)}
            style={{ border: 'none', outline: 'none', background: 'transparent', padding: '10px 0', fontWeight: 600, width: '100%', color: 'var(--ink)', fontSize: '0.9rem' }}
          />
        </div>
      </div>

      <div className="glass-card stagger-2" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
        <div className="admin-appointment-mobile-list">
          {currentRows.length === 0 ? (
            <div className="admin-empty-state" style={{ padding: '18px 10px', textAlign: 'center', color: 'var(--gray-500)', fontWeight: 800 }}>
              Không có lịch hẹn phù hợp.
            </div>
          ) : currentRows.map((l) => (
            <article key={l.id_lich_hen} className="admin-appointment-mobile-card">
              <div className="admin-appointment-mobile-top">
                <div>
                  <h3>{fixVietnameseEncoding(l.ten_thu_cung) || "Bệnh nhân chưa cập nhật"}</h3>
                  <p>{l.ten_khach_hang || "Khách vãng lai"} · #{l.id_lich_hen}</p>
                </div>
                <span className="admin-appointment-mobile-time">{gioRutGon(l.gio_kham)}</span>
              </div>
              <span className="admin-appointment-mobile-status">{l.trang_thai?.toUpperCase() || 'CHO_XAC_NHAN'}</span>
              <div className="admin-appointment-mobile-meta">
                <span><strong>{chuyenNgayISO_SangVN(l.ngay_kham)}</strong> · {l.ten_bac_si || "Chưa phân bổ"}</span>
                <span>{fixVietnameseEncoding(l.ly_do) || "Khám tổng quát"}</span>
                {l.ghi_chu && <span>{fixVietnameseEncoding(l.ghi_chu)}</span>}
              </div>
              <div className="admin-appointment-mobile-actions">
                <button data-ai-id="button-quanlylichhen-mobile-view" className="btn" onClick={() => setViewingLichHen(l)} style={{ background: 'var(--gray-50)', color: 'var(--ink)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>visibility</span>
                </button>
                <button data-ai-id="button-quanlylichhen-mobile-edit" className="btn" onClick={() => setEditingLichHen(l)} style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit_square</span>
                </button>
              </div>
            </article>
          ))}
        </div>
        <div className="table-responsive-wrapper admin-appointment-table">
          <div style={{ minWidth: '800px' }}>
            <div
              ref={containerRef}
              onScroll={onScrollHandler}
              style={shouldVirtualize ? { height: `${VIRTUAL_CONTAINER_HEIGHT}px`, overflowY: 'auto', overflowX: 'hidden' } : {}}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: shouldVirtualize ? 'sticky' : undefined, top: shouldVirtualize ? 0 : undefined, zIndex: shouldVirtualize ? 2 : undefined, background: 'var(--gray-50)' }}>
                  <tr style={{ background: 'var(--gray-50)' }}>
                    <th style={{ padding: '24px 20px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 900, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '1px' }}>ID</th>
                    <th style={{ padding: '24px 20px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 900, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '1px' }}>THỜI GIAN</th>
                    <th style={{ padding: '24px 20px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 900, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '1px' }}>BỆNH NHÂN / CHỦ</th>
                    <th style={{ padding: '24px 20px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 900, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '1px' }}>LÝ DO / GHI CHÚ</th>
                    <th style={{ padding: '24px 20px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 900, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '1px' }}>BÁC SĨ PHỤ TRÁCH</th>
                    <th style={{ padding: '24px 20px', textAlign: 'left', fontSize: '0.75rem', fontWeight: 900, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '1px' }}>TRẠNG THÁI</th>
                    <th style={{ padding: '24px 20px', textAlign: 'center', fontSize: '0.75rem', fontWeight: 900, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '1px' }}>THAO TÁC</th>
                  </tr>
                </thead>
                <tbody>
                  {shouldVirtualize && visibleRange.start > 0 && (
                    <tr style={{ height: `${visibleRange.start * VIRTUAL_ITEM_HEIGHT}px` }} aria-hidden="true"><td colSpan={7} /></tr>
                  )}
                  {currentRows.length === 0 ? (
                    <tr>
                      <td className="admin-empty-state" colSpan={7} style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--gray-500)', fontWeight: 700 }}>
                        Không có lịch hẹn phù hợp.
                      </td>
                    </tr>
                  ) : (shouldVirtualize ? visibleItems : currentRows).map((l) => (
                    <tr key={l.id_lich_hen} className="table-row" style={{ borderBottom: '1px solid var(--gray-50)', transition: 'all 0.3s ease', height: `${VIRTUAL_ITEM_HEIGHT}px` }}>
                      <td style={{ padding: '20px', fontWeight: 800, color: 'var(--gray-400)', borderTopLeftRadius: '16px', borderBottomLeftRadius: '16px' }}>#{l.id_lich_hen}</td>
                      <td style={{ padding: '20px' }}>
                        <div style={{ fontWeight: 900, color: 'var(--ink)' }}>{chuyenNgayISO_SangVN(l.ngay_kham)}</div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 800 }}>{gioRutGon(l.gio_kham)}</div>
                      </td>
                      <td style={{ padding: '20px' }}>
                        <div style={{ fontWeight: 900, color: 'var(--ink)' }}>{fixVietnameseEncoding(l.ten_thu_cung) || "N/A"}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 700 }}>{l.ten_khach_hang || "Khách vãng lai"}</div>
                      </td>
                      <td style={{ padding: '20px' }}>
                        <div style={{ fontWeight: 800, color: 'var(--ink)' }}>{(() => {
                          if (!l.ly_do) return "Khám tổng quát";
                          const txt = document.createElement("textarea");
                          txt.innerHTML = l.ly_do;
                          return fixVietnameseEncoding(txt.value) || txt.value;
                        })()}</div>
                        <div style={{ fontSize: '0.8rem', color: l.ghi_chu?.includes('[CẤP CỨU]') ? 'var(--danger)' : 'var(--gray-500)', fontWeight: 700, maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {l.ghi_chu ? fixVietnameseEncoding(l.ghi_chu) || l.ghi_chu : "Không có ghi chú"}
                        </div>
                      </td>
                      <td style={{ padding: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '32px', height: '32px', background: 'var(--primary-light)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>medical_information</span>
                          </div>
                          <span style={{ fontWeight: 800, color: 'var(--ink)' }}>{l.ten_bac_si || "Chưa phân bổ"}</span>
                        </div>
                      </td>
                      <td style={{ padding: '20px' }}>
                        <span style={{
                          padding: '8px 16px', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 900, border: '1px solid transparent',
                          background: l.trang_thai?.toUpperCase() === 'HOAN_THANH' ? 'var(--primary-light)' : (['DA_HUY', 'KHONG_DEN'].includes(l.trang_thai?.toUpperCase()) ? 'var(--danger-light, rgba(239, 68, 68, 0.15))' : 'var(--warning-light, rgba(245, 158, 11, 0.15))'),
                          color: l.trang_thai?.toUpperCase() === 'HOAN_THANH' ? 'var(--primary)' : (['DA_HUY', 'KHONG_DEN'].includes(l.trang_thai?.toUpperCase()) ? 'var(--danger, #ef4444)' : 'var(--warning, #d97706)')
                        }}>
                          {l.trang_thai?.toUpperCase() || 'CHO_XAC_NHAN'}
                        </span>
                      </td>
                      <td style={{ padding: '20px', textAlign: 'center', borderTopRightRadius: '16px', borderBottomRightRadius: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                          <button data-ai-id="button-quanlylichhen-kp9o" className="btn" aria-label={`Xem chi tiết lịch hẹn ${l.id_lich_hen ? `#${l.id_lich_hen}` : ''}`} title={`Xem lịch hẹn ${l.id_lich_hen ? `#${l.id_lich_hen}` : ''}`} onClick={() => setViewingLichHen(l)} style={{ padding: '10px', background: 'var(--gray-50)', color: 'var(--ink)' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>visibility</span>
                          </button>
                          <button data-ai-id="button-quanlylichhen-4icp" className="btn" aria-label={`Chỉnh sửa lịch hẹn ${l.id_lich_hen ? `#${l.id_lich_hen}` : ''}`} title={`Chỉnh sửa lịch hẹn ${l.id_lich_hen ? `#${l.id_lich_hen}` : ''}`} onClick={() => setEditingLichHen(l)} style={{ padding: '10px', background: 'var(--primary-light)', color: 'var(--primary)' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>edit_square</span>
                          </button>
                        </div>
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
        <div className="stagger-2" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '20px', marginBottom: '20px' }}>
          <button data-ai-id="button-quanlylichhen-lq9e"
            className="btn btn-pill"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            style={{
              background: 'var(--surface)', border: '1px solid var(--gray-200)',
              color: currentPage === 1 ? 'var(--gray-300)' : 'var(--ink)',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            <span className="material-symbols-outlined">chevron_left</span> Trước
          </button>
          <span style={{ fontWeight: 800, color: 'var(--ink)', fontSize: '0.9rem' }}>
            Trang {currentPage} / {totalPages}
          </span>
          <button data-ai-id="button-quanlylichhen-v4lf"
            className="btn btn-pill"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            style={{
              background: 'var(--surface)', border: '1px solid var(--gray-200)',
              color: currentPage === totalPages ? 'var(--gray-300)' : 'var(--ink)',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            Sau <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      )}

      {/* MODAL CHI TIẾT LỊCH HẸN */}
      <Modal isOpen={!!viewingLichHen} onClose={() => setViewingLichHen(null)} title="Chi tiết lịch hẹn">
        {viewingLichHen && (
          <div style={{ display: 'grid', gap: '24px' }}>
            <div style={{ background: 'var(--gray-50)', padding: '24px', borderRadius: '24px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--gray-400)', letterSpacing: '1px', marginBottom: '8px' }}>TRẠNG THÁI HIỆN TẠI</div>
              <span style={{
                padding: '10px 24px', borderRadius: '50px', fontSize: '0.85rem', fontWeight: 950, border: '1px solid transparent',
                background: viewingLichHen.trang_thai?.toUpperCase() === 'HOAN_THANH' ? 'var(--primary)' : (['DA_HUY', 'KHONG_DEN'].includes(viewingLichHen.trang_thai?.toUpperCase()) ? 'var(--danger)' : 'var(--warning, #f59e0b)'),
                color: 'white'
              }}>
                {viewingLichHen.trang_thai?.toUpperCase()}
              </span>
            </div>

            <div className="responsive-grid-2">
              <div style={{ background: 'var(--surface)', border: '1px solid var(--gray-200)', padding: '20px', borderRadius: '20px' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '0.9rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>person</span> Thông tin chủ nuôi
                </h4>
                <InfoRow label="Họ tên" value={viewingLichHen.ten_khach_hang || 'Khách vãng lai'} />
                <InfoRow label="Số điện thoại" value={viewingLichHen.sdt || 'N/A'} />
              </div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--gray-200)', padding: '20px', borderRadius: '20px' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '0.9rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>pets</span> Thông tin thú cưng
                </h4>
                <InfoRow label="Tên bé" value={fixVietnameseEncoding(viewingLichHen.ten_thu_cung) || viewingLichHen.ten_thu_cung || 'N/A'} />
                <InfoRow label="Giống loài" value={fixVietnameseEncoding(viewingLichHen.giong_loai) || viewingLichHen.giong_loai || 'Chưa rõ'} />
              </div>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--gray-200)', padding: '24px', borderRadius: '24px' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '0.9rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>medical_services</span> Nội dung khám
              </h4>
              <InfoRow label="Lý do khám" value={fixVietnameseEncoding(viewingLichHen.ly_do) || viewingLichHen.ly_do} />
              <InfoRow label="Thời gian" value={`${chuyenNgayISO_SangVN(viewingLichHen.ngay_kham)} - ${gioRutGon(viewingLichHen.gio_kham)}`} />
              <InfoRow label="Bác sĩ" value={viewingLichHen.ten_bac_si || 'Chưa phân bổ'} />
              <div style={{ marginTop: '16px', padding: '16px', background: 'var(--gray-50)', borderRadius: '16px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '8px' }}>GHI CHÚ CHI TIẾT</div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: viewingLichHen.ghi_chu?.includes('[CẤP CỨU]') ? 'var(--danger)' : 'var(--ink)', fontWeight: 700 }}>
                  {fixVietnameseEncoding(viewingLichHen.ghi_chu) || viewingLichHen.ghi_chu || 'Không có ghi chú thêm.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* TÍCH HỢP MODAL XỊN */}
      <ModalTaoLichHenAdmin
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchData}
      />

      {/* MODAL CẬP NHẬT TRẠNG THÁI */}
      <Modal isOpen={!!editingLichHen} onClose={() => setEditingLichHen(null)} title={`Cập nhật trạng thái #${editingLichHen?.id_lich_hen}`} maxWidth="400px">
        {editingLichHen && (
          <>
            <div style={{ display: 'grid', gap: '12px' }}>
              {[
                { id: 'CHO_XAC_NHAN', label: 'CHỜ XÁC NHẬN', color: 'var(--warning, #d97706)', bg: 'var(--warning-light, rgba(245, 158, 11, 0.15))' },
                { id: 'DA_XAC_NHAN', label: 'ĐÃ XÁC NHẬN', color: 'var(--primary)', bg: 'var(--primary-light)' },
                { id: 'DANG_KHAM', label: 'ĐANG KHÁM', color: 'var(--info, #2563eb)', bg: 'var(--info-light, rgba(59, 130, 246, 0.15))' },
                { id: 'HOAN_THANH', label: 'HOÀN THÀNH', color: 'var(--success, #059669)', bg: 'var(--success-light, rgba(16, 185, 129, 0.15))' },
                { id: 'KHONG_DEN', label: 'KHÔNG ĐẾN', color: 'var(--danger)', bg: 'var(--danger-light, rgba(239, 68, 68, 0.15))' },
                { id: 'DA_HUY', label: 'HỦY LỊCH', color: 'var(--danger)', bg: 'var(--danger-light, rgba(239, 68, 68, 0.15))' },
              ].map(status => (
                <button data-ai-id="button-quanlylichhen-z0vb"
                  key={status.id}
                  disabled={updating}
                  onClick={() => handleUpdateStatus(editingLichHen.id_lich_hen, status.id)}
                  style={{
                    padding: '16px', borderRadius: '16px', border: editingLichHen.trang_thai?.toUpperCase() === status.id ? '2px solid ' + status.color : '1px solid var(--gray-100)',
                    background: status.bg, color: status.color, fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s'
                  }}
                >
                  {status.label}
                  {editingLichHen.trang_thai?.toUpperCase() === status.id && <span className="material-symbols-outlined">check_circle</span>}
                </button>
              ))}
            </div>

            <button data-ai-id="button-quanlylichhen-m2up"
              onClick={() => setEditingLichHen(null)}
              className="btn"
              style={{ width: '100%', marginTop: '24px', padding: '14px', borderRadius: '16px', fontWeight: 800, color: 'var(--gray-500)', background: 'var(--gray-50)' }}
            >
              Hủy bỏ
            </button>
          </>
        )}
      </Modal>
    </div>
  );
};

export default React.memo(QuanLyLichHen);
