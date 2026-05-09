import React, { useState, useEffect } from "react";
import axiosInstance from "@services/axios";
import ModalTaoLichHenAdmin from "./ModalTaoLichHenAdmin";
import { Modal, InfoRow } from "@components/CommonUI";
import { toast } from "@components/Toast";

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

  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingLichHen, setViewingLichHen] = useState<any>(null);
  const [editingLichHen, setEditingLichHen] = useState<any>(null);
  const [updating, setUpdating] = useState(false);

  // State hỗ trợ Phân trang Server-side
  const [totalServerPages, setTotalServerPages] = useState(1);
  const [isServerPaginated, setIsServerPaginated] = useState(false);

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const fetchData = () => {
    setLoading(true);
    axiosInstance.get("/api/lich-hen", {
      params: { page: currentPage - 1, size: ITEMS_PER_PAGE, status: filterStatus !== 'all' ? filterStatus : undefined }
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
  };

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    setUpdating(true);
    try {
      await axiosInstance.put(`/api/lich-hen/${id}/trang-thai`, { trang_thai: newStatus });
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
  }, [currentPage, filterStatus]);

  // Reset về trang 1 mỗi khi đổi bộ lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus]);

  const rows = React.useMemo(() => {
    if (isServerPaginated) return lichHens;
    return lichHens.filter(l => filterStatus === 'all' || l.trang_thai?.toLowerCase() === filterStatus.toLowerCase() || (filterStatus === 'da_kham' && l.trang_thai?.toUpperCase() === 'HOAN_THANH'));
  }, [lichHens, filterStatus, isServerPaginated]);

  const totalPages = isServerPaginated ? totalServerPages : Math.ceil(rows.length / ITEMS_PER_PAGE);
  const currentRows = isServerPaginated ? rows : rows.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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
        .table-row:hover { background-color: white !important; transform: scale(1.01) translateX(8px); box-shadow: -10px 10px 20px rgba(15, 157, 138, 0.08); z-index: 10; position: relative; border-radius: 16px; }
      `}</style>
      <div className="stagger-1" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 950, color: 'var(--ink)', letterSpacing: '-1.5px' }}>Điều phối lịch hẹn</h1>
          <p style={{ color: 'var(--gray-500)', fontWeight: 600 }}>Quản lý lộ trình khám và điều phối đội ngũ y bác sĩ.</p>
        </div>
        <button className="btn btn-primary btn-pill" onClick={() => setIsModalOpen(true)}>
          <span className="material-symbols-outlined">add_task</span>
          Thêm lịch hẹn
        </button>
      </div>

      <div className="stagger-1" style={{ display: 'flex', gap: '12px', marginBottom: '32px', overflowX: 'auto', paddingBottom: '8px' }}>
        {[
          { id: 'all', label: 'TẤT CẢ', icon: 'list' },
          { id: 'da_dat', label: 'CHỜ XÁC NHẬN', icon: 'pending' },
          { id: 'da_xac_nhan', label: 'ĐÃ XÁC NHẬN', icon: 'check_circle' },
          { id: 'dang_kham', label: 'ĐANG KHÁM', icon: 'medical_services' },
          { id: 'da_kham', label: 'HOÀN TẤT', icon: 'verified' },
          { id: 'da_huy', label: 'ĐÃ HỦY', icon: 'cancel' },
        ].map(tab => (
          <button
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

      <div className="glass-card stagger-2" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
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
            {currentRows.map((l) => (
              <tr key={l.id_lich_hen} className="table-row" style={{ borderBottom: '1px solid var(--gray-50)', transition: 'all 0.3s ease' }}>
                <td style={{ padding: '20px', fontWeight: 800, color: 'var(--gray-400)', borderTopLeftRadius: '16px', borderBottomLeftRadius: '16px' }}>#{l.id_lich_hen}</td>
                <td style={{ padding: '20px' }}>
                  <div style={{ fontWeight: 900, color: 'var(--ink)' }}>{chuyenNgayISO_SangVN(l.ngay_kham)}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 800 }}>{gioRutGon(l.gio_kham)}</div>
                </td>
                <td style={{ padding: '20px' }}>
                  <div style={{ fontWeight: 900, color: 'var(--ink)' }}>{l.ten_thu_cung || "N/A"}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 700 }}>{l.ten_khach_hang || "Khách vãng lai"}</div>
                </td>
                <td style={{ padding: '20px' }}>
                  <div style={{ fontWeight: 800, color: 'var(--ink)' }}>{l.ly_do || "Khám tổng quát"}</div>
                  <div style={{ fontSize: '0.8rem', color: l.ghi_chu?.includes('[CẤP CỨU]') ? 'var(--danger)' : 'var(--gray-500)', fontWeight: 700, maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {l.ghi_chu ? l.ghi_chu : "Không có ghi chú"}
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
                    background: (l.trang_thai?.toLowerCase() === 'da_kham' || l.trang_thai?.toUpperCase() === 'HOAN_THANH') ? 'var(--primary-light)' : (l.trang_thai?.toLowerCase() === 'da_huy' ? 'var(--danger-light, rgba(239, 68, 68, 0.15))' : 'var(--warning-light, rgba(245, 158, 11, 0.15))'),
                    color: (l.trang_thai?.toLowerCase() === 'da_kham' || l.trang_thai?.toUpperCase() === 'HOAN_THANH') ? 'var(--primary)' : (l.trang_thai?.toLowerCase() === 'da_huy' ? 'var(--danger, #ef4444)' : 'var(--warning, #d97706)')
                  }}>
                    {l.trang_thai?.toUpperCase() || 'CHO_XAC_NHAN'}
                  </span>
                </td>
                <td style={{ padding: '20px', textAlign: 'center', borderTopRightRadius: '16px', borderBottomRightRadius: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                    <button className="btn" onClick={() => setViewingLichHen(l)} style={{ padding: '10px', background: 'var(--gray-50)', color: 'var(--ink)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>visibility</span>
                    </button>
                    <button className="btn" onClick={() => setEditingLichHen(l)} style={{ padding: '10px', background: 'var(--primary-light)', color: 'var(--primary)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>edit_square</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* BỘ NÚT ĐIỀU HƯỚNG PHÂN TRANG */}
      {totalPages > 1 && (
        <div className="stagger-2" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '20px', marginBottom: '20px' }}>
          <button
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
          <button
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
                background: (viewingLichHen.trang_thai?.toLowerCase() === 'da_kham' || viewingLichHen.trang_thai?.toUpperCase() === 'HOAN_THANH') ? 'var(--primary)' : (viewingLichHen.trang_thai?.toLowerCase() === 'da_huy' ? 'var(--danger)' : 'var(--warning, #f59e0b)'),
                color: 'white'
              }}>
                {viewingLichHen.trang_thai?.toUpperCase()}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
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
                <InfoRow label="Tên bé" value={viewingLichHen.ten_thu_cung || 'N/A'} />
                <InfoRow label="Giống loài" value={viewingLichHen.giong_loai || 'Chưa rõ'} />
              </div>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--gray-200)', padding: '24px', borderRadius: '24px' }}>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '0.9rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>medical_services</span> Nội dung khám
              </h4>
              <InfoRow label="Lý do khám" value={viewingLichHen.ly_do} />
              <InfoRow label="Thời gian" value={`${chuyenNgayISO_SangVN(viewingLichHen.ngay_kham)} - ${gioRutGon(viewingLichHen.gio_kham)}`} />
              <InfoRow label="Bác sĩ" value={viewingLichHen.ten_bac_si || 'Chưa phân bổ'} />
              <div style={{ marginTop: '16px', padding: '16px', background: 'var(--gray-50)', borderRadius: '16px' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '8px' }}>GHI CHÚ CHI TIẾT</div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: viewingLichHen.ghi_chu?.includes('[CẤP CỨU]') ? 'var(--danger)' : 'var(--ink)', fontWeight: 700 }}>
                  {viewingLichHen.ghi_chu || 'Không có ghi chú thêm.'}
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
                { id: 'da_dat', label: 'CHỜ XÁC NHẬN', color: 'var(--warning, #d97706)', bg: 'var(--warning-light, rgba(245, 158, 11, 0.15))' },
                { id: 'da_xac_nhan', label: 'ĐÃ XÁC NHẬN', color: 'var(--primary)', bg: 'var(--primary-light)' },
                { id: 'dang_kham', label: 'ĐANG KHÁM', color: 'var(--info, #2563eb)', bg: 'var(--info-light, rgba(59, 130, 246, 0.15))' },
                { id: 'da_kham', label: 'HOÀN THÀNH', color: 'var(--success, #059669)', bg: 'var(--success-light, rgba(16, 185, 129, 0.15))' },
                { id: 'da_huy', label: 'HỦY LỊCH', color: 'var(--danger)', bg: 'var(--danger-light, rgba(239, 68, 68, 0.15))' },
              ].map(status => (
                <button
                  key={status.id}
                  disabled={updating}
                  onClick={() => handleUpdateStatus(editingLichHen.id_lich_hen, status.id)}
                  style={{
                    padding: '16px', borderRadius: '16px', border: (editingLichHen.trang_thai?.toLowerCase() === status.id || (status.id === 'da_kham' && editingLichHen.trang_thai?.toUpperCase() === 'HOAN_THANH')) ? '2px solid ' + status.color : '1px solid var(--gray-100)',
                    background: status.bg, color: status.color, fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s'
                  }}
                >
                  {status.label}
                  {(editingLichHen.trang_thai?.toLowerCase() === status.id || (status.id === 'da_kham' && editingLichHen.trang_thai?.toUpperCase() === 'HOAN_THANH')) && <span className="material-symbols-outlined">check_circle</span>}
                </button>
              ))}
            </div>

            <button
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
