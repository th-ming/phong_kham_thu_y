import React, { useState, useEffect } from "react";
import axiosInstance from "@services/axios";
import { formatTienVND, matchesSearchFields } from "@utils/index";
import { Modal } from "@components/CommonUI";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "@components/Toast";
import { useAutoRefresh } from "@hooks/useAutoRefresh";

const chuyenNgayISO_SangVN = (dateString: string) => {
  if (!dateString) return "—";
  const parts = dateString.split('T')[0].split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateString;
};

const QuanLyHoaDon: React.FC = () => {
  const [hoaDons, setHoaDons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingHD, setViewingHD] = useState<any>(null);
  const [searchHoaDon, setSearchHoaDon] = useState("");
  const [scrollTop, setScrollTop] = useState(0);

  const ROW_HEIGHT = 72; // Chiều cao cố định mỗi dòng hóa đơn
  const VISIBLE_HEIGHT = 432; // Hiển thị 6 dòng cùng lúc cùng thanh cuộn mượt mà

  const filteredHoaDons = React.useMemo(() => {
    return hoaDons.filter((h) => {
      const status = h.trang_thai?.toLowerCase() === 'da_thanh_toan' ? 'đã quyết toán đã thanh toán đã thu tiền paid' : 'chờ thanh toán chưa thu tiền unpaid';
      return matchesSearchFields(searchHoaDon, [
        `HD-${h.id_hoa_don}`,
        h.id_hoa_don,
        h.ten_khach_hang,
        h.ten_thu_cung,
        h.sdt,
        h.ten_nhan_vien,
        h.tong_tien_cuoi,
        h.ngay_lap_hoa_don,
        status
      ]);
    });
  }, [hoaDons, searchHoaDon]);

  const fetchHoaDons = () => {
    if (hoaDons.length === 0) setLoading(true);
    axiosInstance.get("/api/hoa-don")
      .then(res => {
        setHoaDons(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi lấy danh sách hóa đơn:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchHoaDons();
    const params = new URLSearchParams(window.location.search);
    const searchQuery = params.get("search");
    const isAutopilot = params.get("autopilot") === "true";
    if (searchQuery) {
      if (isAutopilot) {
        // Hiệu ứng gõ phím giả lập của Trợ lý Đồng nghiệp Rexi
        let currentText = "";
        let index = 0;
        const interval = setInterval(() => {
          if (index < searchQuery.length) {
            currentText += searchQuery[index];
            setSearchHoaDon(currentText);
            index++;
          } else {
            clearInterval(interval);
            toast.success("Trợ lý Rexi đã hoàn thành lọc hóa đơn cho Đồng nghiệp!");
          }
        }, 120);
      } else {
        setSearchHoaDon(searchQuery);
      }
    }
  }, []);

  useAutoRefresh(fetchHoaDons, { runImmediately: false });

  const handleConfirmPayment = async (id: number) => {
    if (!window.confirm(`Xác nhận đã nhận đủ tiền cho hóa đơn #HD-${id}?`)) return;
    try {
      await axiosInstance.put(`/api/hoa-don/${id}/status`, { status: 'DA_THANH_TOAN' });
      toast.success("Đã quyết toán hóa đơn thành công!");
      fetchHoaDons(); // Tải lại danh sách
      if (viewingHD) setViewingHD(null);
    } catch (error) {
      toast.error("Không thể cập nhật trạng thái hóa đơn.");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const element = document.getElementById("print-section");
    if (!element || !viewingHD) return;

    // Ẩn các nút thao tác (class no-print) trước khi chụp ảnh
    const actionButtons = element.querySelector('.no-print') as HTMLElement;
    if (actionButtons) actionButtons.style.opacity = '0';

    // Chụp ảnh vùng hóa đơn với độ phân giải cao
    html2canvas(element, {
      scale: 3,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true
    }).then((canvas: HTMLCanvasElement) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      pdf.save(`HoaDon_Rexi_HD${viewingHD.id_hoa_don}.pdf`);

      // Hiện lại các nút thao tác
      if (actionButtons) actionButtons.style.opacity = '1';
      toast.success("Đã tải hóa đơn PDF thành công!");
    }).catch((err: any) => {
      console.error("Lỗi xuất PDF:", err);
      toast.error("Không thể xuất file PDF lúc này.");
      if (actionButtons) actionButtons.style.opacity = '1';
    });
  };

  const handleExportExcel = () => {
    if (hoaDons.length === 0) {
      toast.info("Không có dữ liệu để xuất!");
      return;
    }

    const headers = ["Mã HĐ", "Khách hàng", "Số điện thoại", "Ngày lập", "Tổng tiền (VNĐ)", "Trạng thái", "Nhân viên lập"];
    const rows = hoaDons.map(h => [
      `HD-${h.id_hoa_don}`,
      h.ten_khach_hang || 'Khách vãng lai',
      h.sdt || '',
      h.ngay_lap_hoa_don?.split('T')[0].split('-').reverse().join('/') || "",
      h.tong_tien_cuoi || 0,
      h.trang_thai?.toLowerCase() === 'da_thanh_toan' ? 'Đã thu tiền' : 'Chờ thanh toán',
      h.ten_nhan_vien || 'Hệ thống'
    ]);

    // Thêm dấu nháy đơn để tránh lỗi CSV Injection khi xuất file hóa đơn
    const sanitizeCSV = (val: string) => {
      if (/^[=+\-@]/.test(val)) return `'${val}`;
      return val;
    };

    const csvContent = "\ufeff" + [
      headers.map(h => `"${h}"`).join(","),
      ...rows.map(r => r.map(cell => `"${sanitizeCSV(String(cell ?? "").replace(/"/g, '""'))}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `DanhSachHoaDon_ToanBo_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success("Đã xuất danh sách hóa đơn ra file Excel!");
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div className="dot-pulse"></div>
    </div>
  );

  return (
    <div className="animate-fade-in invoice-admin-page" style={{ margin: '-40px', padding: '40px', minHeight: '100vh', background: 'var(--background)', color: 'var(--ink)' }}>
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 12mm; }
          html, body { background: #ffffff !important; overflow: visible !important; }
          body * { visibility: hidden; }
          .modal-wrapper,
          .modal-wrapper *,
          .modal-content,
          .glass-card {
            overflow: visible !important;
            max-height: none !important;
            animation: none !important;
            transform: none !important;
          }
          .modal-wrapper {
            position: static !important;
            inset: auto !important;
            display: block !important;
            padding: 0 !important;
            background: transparent !important;
            backdrop-filter: none !important;
          }
          .modal-content { padding: 0 !important; }
          .no-print, .no-print * {
            display: none !important;
            visibility: hidden !important;
          }
          #print-section, #print-section * { visibility: visible; }
          #print-section {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 186mm !important;
            margin: 0 !important;
            padding: 12mm !important;
            background: #ffffff !important;
            color: #111827 !important;
            box-shadow: none !important;
            border: 1px solid #d1d5db !important;
            border-radius: 12px !important;
          }
          #print-section .table-responsive-wrapper,
          #print-section .table-responsive-wrapper > div {
            overflow: visible !important;
            min-width: 0 !important;
            width: 100% !important;
          }
          #print-section table {
            width: 100% !important;
            min-width: 0 !important;
            border-collapse: collapse !important;
          }
        }
        .virtual-row-hover {
          transition: background-color 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.18s ease;
        }
        .virtual-row-hover:hover {
          background-color: var(--gray-50) !important;
        }
        @keyframes slideUpFade { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        .invoice-admin-page > div:first-child { animation: slideUpFade 0.45s cubic-bezier(.22,.68,0,1.2) both; }
        .invoice-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .invoice-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
        .invoice-mobile-list { display: none; }
        @media screen and (max-width: 1024px) {
          .invoice-admin-page {
            margin: 0 !important;
            padding: 0 !important;
            min-height: auto !important;
          }
          .invoice-mobile-list {
            display: grid !important;
            gap: 10px;
            padding: 10px;
          }
          .invoice-desktop-table {
            display: none !important;
          }
          .invoice-card {
            display: grid;
            gap: 10px;
            padding: 12px;
            border-radius: 18px;
            background: var(--surface);
            border: 1px solid var(--gray-100);
          }
          .invoice-card-top {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 10px;
            align-items: start;
          }
          .invoice-card h3 {
            margin: 0;
            color: var(--ink);
            font-size: 0.95rem;
            line-height: 1.22;
            font-weight: 950;
          }
          .invoice-card p {
            margin: 4px 0 0;
            color: var(--gray-500);
            font-size: 0.72rem;
            line-height: 1.35;
            font-weight: 700;
            overflow-wrap: anywhere;
          }
          .invoice-amount {
            color: var(--primary);
            font-size: 0.92rem;
            font-weight: 950;
            white-space: nowrap;
          }
          .invoice-status {
            justify-self: start;
            padding: 6px 10px;
            border-radius: 999px;
            font-size: 0.66rem;
            line-height: 1;
            font-weight: 950;
          }
          .invoice-actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }
          .invoice-actions .btn {
            width: 100%;
            min-height: 36px;
            justify-content: center;
            border-radius: 13px !important;
            padding: 7px 10px !important;
          }
        }
      `}</style>

      <div className="admin-mobile-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-1px' }}>Quản lý Hóa đơn</h1>
          <p style={{ color: 'var(--gray-500)', fontWeight: 600 }}>Theo dõi dòng tiền và lịch sử thanh toán của khách hàng.</p>
        </div>
        <button data-ai-id="button-quanlyhoadon-5wcs" onClick={handleExportExcel} className="btn btn-primary btn-pill hover-lift" style={{ background: 'var(--primary)', color: '#ffffff', border: '1px solid var(--primary)', padding: '10px 20px', fontSize: '0.9rem', fontWeight: 800, boxShadow: '0 12px 28px rgba(15, 157, 138, 0.22)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>download</span> Xuất Excel
        </button>
      </div>

      <div className="glass-card" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
        <div className="admin-mobile-card-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', background: 'var(--surface)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--ink)', margin: 0 }}>Danh sách hóa đơn ({filteredHoaDons.length})</h2>
          <div className="glass-card admin-mobile-search-box" style={{ display: 'flex', alignItems: 'center', padding: '0 16px', borderRadius: '16px', border: '1px solid var(--gray-200)', background: 'var(--surface)', width: '300px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--gray-400)', marginRight: '8px' }}>search</span>
            <input data-ai-id="input-quanlyhoadon-unv9"
              type="text"
              placeholder="Tìm mã HĐ, khách hàng, số điện thoại..."
              value={searchHoaDon}
              onChange={(e) => setSearchHoaDon(e.target.value)}
              style={{ border: 'none', outline: 'none', background: 'transparent', padding: '10px 0', fontWeight: 600, width: '100%', color: 'var(--ink)', fontSize: '0.9rem' }}
            />
          </div>
        </div>
        <div className="invoice-mobile-list">
          {filteredHoaDons.length === 0 ? (
            <div className="admin-empty-state" style={{ padding: '18px 10px', textAlign: 'center', color: 'var(--gray-500)', fontWeight: 800 }}>
              Không tìm thấy hóa đơn nào phù hợp.
            </div>
          ) : filteredHoaDons.map((h) => (
            <article key={h.id_hoa_don} className="invoice-card">
              <div className="invoice-card-top">
                <div>
                  <h3>#HD-{h.id_hoa_don} · {h.ten_khach_hang || `KH-${h.id_khach_hang}`}</h3>
                  <p>{chuyenNgayISO_SangVN(h.ngay_lap_hoa_don)} · {h.sdt || 'Chưa có SĐT'}</p>
                </div>
                <span className="invoice-amount">{formatTienVND(h.tong_tien_cuoi ?? 0)}</span>
              </div>
              <span
                className="invoice-status"
                style={{
                  background: h.trang_thai?.toLowerCase() === 'da_thanh_toan' ? 'var(--primary-light)' : 'var(--warning-light, rgba(245, 158, 11, 0.15))',
                  color: h.trang_thai?.toLowerCase() === 'da_thanh_toan' ? 'var(--primary)' : 'var(--warning, #d97706)'
                }}
              >
                {h.trang_thai?.toLowerCase() === 'da_thanh_toan' ? 'ĐÃ QUYẾT TOÁN' : 'CHỜ THANH TOÁN'}
              </span>
              <div className="invoice-actions">
                <button data-ai-id="button-quanlyhoadon-mobile-view" className="btn" onClick={() => setViewingHD(h)} style={{ background: 'var(--gray-50)', color: 'var(--ink)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>visibility</span>
                </button>
                {h.trang_thai?.toLowerCase() === 'cho_thanh_toan' && (
                  <button data-ai-id="button-quanlyhoadon-mobile-paid" className="btn" onClick={() => handleConfirmPayment(h.id_hoa_don)} style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check_circle</span>
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
        <div className="table-responsive-wrapper invoice-desktop-table">
          <div style={{ minWidth: '800px' }}>
            {/* Tiêu đề cột dạng CSS Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.2fr 1.2fr 1.5fr 1.2fr 1.2fr 0.8fr',
              background: 'var(--gray-50)',
              padding: '16px 20px',
              borderBottom: '1px solid var(--gray-100)',
              boxSizing: 'border-box'
            }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>MÃ HÓA ĐƠN</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>NGÀY LẬP</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>KHÁCH HÀNG</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800, textAlign: 'right' }}>TỔNG TIỀN</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800, paddingLeft: '20px' }}>TRẠNG THÁI</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800, textAlign: 'center' }}>XEM</div>
            </div>

            {/* Thân danh sách cuộn ảo hiệu năng cao */}
            <div
              onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
              style={{
                height: `${VISIBLE_HEIGHT}px`,
                overflowY: 'auto',
                position: 'relative',
                background: 'var(--surface)'
              }}
            >
              {filteredHoaDons.length === 0 ? (
                <div className="admin-empty-state" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--gray-400)', fontWeight: 700 }}>
                  Không tìm thấy hóa đơn nào phù hợp.
                </div>
              ) : (
                <div style={{ height: `${filteredHoaDons.length * ROW_HEIGHT}px`, position: 'relative', width: '100%' }}>
                  {(() => {
                    const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 1);
                    const endIndex = Math.min(filteredHoaDons.length, Math.ceil((scrollTop + VISIBLE_HEIGHT) / ROW_HEIGHT) + 1);
                    const visibleInvoices = filteredHoaDons.slice(startIndex, endIndex);

                    return visibleInvoices.map((h: any, idx: number) => {
                      const globalIndex = startIndex + idx;
                      return (
                        <div
                           key={h.id_hoa_don}
                           className="virtual-row-hover"
                           style={{
                             position: 'absolute',
                             top: `${globalIndex * ROW_HEIGHT}px`,
                             left: 0,
                             width: '100%',
                             height: `${ROW_HEIGHT}px`,
                             display: 'grid',
                             gridTemplateColumns: '1.2fr 1.2fr 1.5fr 1.2fr 1.2fr 0.8fr',
                             alignItems: 'center',
                             borderBottom: '1px solid var(--gray-50)',
                             padding: '0 20px',
                             boxSizing: 'border-box'
                           }}
                        >
                          {/* Mã hóa đơn */}
                          <div style={{ fontWeight: 800, color: 'var(--gray-400)' }}>
                            #HD-{h.id_hoa_don}
                          </div>

                          {/* Ngày lập */}
                          <div style={{ fontWeight: 700 }}>
                            {chuyenNgayISO_SangVN(h.ngay_lap_hoa_don)}
                          </div>

                          {/* Khách hàng */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--gray-400)' }}>person</span>
                            <span style={{ fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {h.ten_khach_hang || `KH-${h.id_khach_hang}`}
                            </span>
                          </div>

                          {/* Tổng tiền */}
                          <div style={{ textAlign: 'right', fontWeight: 900, color: 'var(--primary)', fontSize: '1.1rem' }}>
                            {formatTienVND(h.tong_tien_cuoi ?? 0)}
                          </div>

                          {/* Trạng thái */}
                          <div style={{ paddingLeft: '20px' }}>
                            <span style={{
                              padding: '6px 16px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 800,
                              background: h.trang_thai?.toLowerCase() === 'da_thanh_toan' ? 'var(--primary-light)' : 'var(--warning-light, rgba(245, 158, 11, 0.15))',
                              color: h.trang_thai?.toLowerCase() === 'da_thanh_toan' ? 'var(--primary)' : 'var(--warning, #d97706)'
                            }}>
                              {h.trang_thai?.toLowerCase() === 'da_thanh_toan' ? 'ĐÃ QUYẾT TOÁN' : 'CHỜ THANH TOÁN'}
                            </span>
                          </div>

                          {/* Xem */}
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                            <button data-ai-id="button-quanlyhoadon-1zou" className="btn" onClick={() => setViewingHD(h)} style={{ padding: '8px', background: 'var(--gray-50)', color: 'var(--ink)' }} title="Xem chi tiết">
                              <span className="material-symbols-outlined">visibility</span>
                            </button>
                            {h.trang_thai?.toLowerCase() === 'cho_thanh_toan' && (
                              <button data-ai-id="button-quanlyhoadon-h34e" className="btn" onClick={() => handleConfirmPayment(h.id_hoa_don)} style={{ padding: '8px', background: 'var(--primary-light)', color: 'var(--primary)' }} title="Xác nhận đã nhận tiền">
                                <span className="material-symbols-outlined">check_circle</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL CHI TIẾT HÓA ĐƠN */}
      <Modal isOpen={!!viewingHD} onClose={() => setViewingHD(null)} title="Chi tiết Hóa đơn" maxWidth="700px">
        {viewingHD && (
          <div id="print-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--primary)', marginBottom: '4px' }}>PHÒNG KHÁM REXI</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', fontWeight: 600 }}>{localStorage.getItem('clinic_address') || "Hệ thống Thú y Rexi Clinic"}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', fontWeight: 600 }}>Hotline: {localStorage.getItem('clinic_phone') || "1900 xxxx"}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--ink)' }}>HÓA ĐƠN #HD-{viewingHD.id_hoa_don}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--gray-400)', fontWeight: 700 }}>Ngày: {chuyenNgayISO_SangVN(viewingHD.ngay_lap_hoa_don)}</div>
              </div>
            </div>

            <div className="responsive-grid-2">
              <div style={{ background: 'var(--surface)', border: '1px solid var(--gray-200)', padding: '20px', borderRadius: '20px' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--gray-400)', letterSpacing: '1px', marginBottom: '12px' }}>KHÁCH HÀNG</div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--ink)' }}>{viewingHD.ten_khach_hang || 'Khách vãng lai'}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginTop: '4px' }}>SĐT: {viewingHD.sdt || 'N/A'}</div>
              </div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--gray-200)', padding: '20px', borderRadius: '20px' }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--gray-400)', letterSpacing: '1px', marginBottom: '12px' }}>NHÂN VIÊN LẬP</div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--ink)' }}>{viewingHD.ten_nhan_vien || 'Hệ thống'}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginTop: '4px' }}>ID NV: {viewingHD.id_nhan_vien || 'SYS'}</div>
              </div>
            </div>

            <div className="table-responsive-wrapper">
              <table style={{ width: '100%', marginBottom: '32px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--gray-100)' }}>
                    <th style={{ textAlign: 'left', padding: '12px 0', fontSize: '0.8rem', fontWeight: 900, color: 'var(--ink)' }}>DIỄN GIẢI</th>
                    <th style={{ textAlign: 'right', padding: '12px 0', fontSize: '0.8rem', fontWeight: 900, color: 'var(--ink)' }}>THÀNH TIỀN</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--gray-50)' }}>
                    <td style={{ padding: '16px 0', fontWeight: 700, color: 'var(--ink)' }}>Tổng tiền dịch vụ & vật tư</td>
                    <td style={{ padding: '16px 0', textAlign: 'right', fontWeight: 800, color: 'var(--ink)' }}>{formatTienVND(viewingHD.tong_tien_ban_dau)}</td>
                  </tr>
                  {viewingHD.tong_giam_gia > 0 && (
                    <tr style={{ borderBottom: '1px solid var(--gray-50)' }}>
                      <td style={{ padding: '16px 0', color: 'var(--danger)', fontWeight: 700 }}>Giảm giá (Ưu đãi)</td>
                      <td style={{ padding: '16px 0', textAlign: 'right', color: 'var(--danger)', fontWeight: 800 }}>-{formatTienVND(viewingHD.tong_giam_gia)}</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td style={{ padding: '24px 0', fontSize: '1.1rem', fontWeight: 950, color: 'var(--ink)' }}>TỔNG CỘNG THANH TOÁN</td>
                    <td style={{ padding: '24px 0', textAlign: 'right', fontSize: '1.4rem', fontWeight: 950, color: 'var(--primary)' }}>{formatTienVND(viewingHD.tong_tien_cuoi)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div style={{ textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.8rem', fontStyle: 'italic' }}>
              Cảm ơn bạn đã tin tưởng dịch vụ tại Rexi!
            </div>

            <div style={{ marginTop: '32px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }} className="no-print">
              <button data-ai-id="button-quanlyhoadon-talh" className="btn btn-pill" onClick={() => setViewingHD(null)} style={{ background: 'var(--gray-100)', color: 'var(--ink)' }}>Đóng</button>
              {viewingHD.trang_thai?.toLowerCase() === 'cho_thanh_toan' && (
                <button data-ai-id="button-quanlyhoadon-9rt0" className="btn btn-primary btn-pill" onClick={() => handleConfirmPayment(viewingHD.id_hoa_don)}>
                  <span className="material-symbols-outlined">payments</span> Xác nhận đã nhận tiền
                </button>
              )}
              <button data-ai-id="button-quanlyhoadon-1v4i" className="btn btn-pill" onClick={handleDownloadPDF} style={{ background: 'var(--danger-light, rgba(239, 68, 68, 0.1))', color: 'var(--danger)' }}>
                <span className="material-symbols-outlined">picture_as_pdf</span>
                Tải PDF
              </button>
              <button data-ai-id="button-quanlyhoadon-9rwt" className="btn btn-primary btn-pill" onClick={handlePrint}>
                <span className="material-symbols-outlined">print</span>
                In hóa đơn
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default React.memo(QuanLyHoaDon);
