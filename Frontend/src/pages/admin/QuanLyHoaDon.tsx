import React, { useState, useEffect } from "react";
import axiosInstance from "@services/axios";
import { formatTienVND } from "@utils/index";
import { Modal } from "@components/CommonUI";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { toast } from "@components/Toast";

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


  const fetchHoaDons = () => {
    setLoading(true);
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
  }, []);

  const handleConfirmPayment = async (id: number) => {
    if (!window.confirm(`Xác nhận đã nhận đủ tiền cho hóa đơn #HD-${id}?`)) return;
    try {
      await axiosInstance.put(`/api/hoa-don/${id}/status`, { status: 'da_thanh_toan' });
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

    // BẢO MẬT: Chống CSV Injection bằng cách thêm dấu nháy đơn trước các ký tự nhạy cảm (=, +, -, @)
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
    <div className="animate-fade-in">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-section, #print-section * { visibility: visible; }
          #print-section { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-1px' }}>Quản lý Hóa đơn</h1>
          <p style={{ color: 'var(--gray-500)', fontWeight: 600 }}>Theo dõi dòng tiền và lịch sử thanh toán của khách hàng.</p>
        </div>
        <button onClick={handleExportExcel} className="btn btn-pill" style={{ background: '#10b981', color: 'white', padding: '10px 20px', fontSize: '0.9rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>download</span> Xuất Excel
        </button>
      </div>

      <div className="glass-card" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--gray-50)', textAlign: 'left' }}>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>MÃ HÓA ĐƠN</th>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>NGÀY LẬP</th>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>KHÁCH HÀNG</th>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800, textAlign: 'right' }}>TỔNG TIỀN</th>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>TRẠNG THÁI</th>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800, textAlign: 'center' }}>XEM</th>
            </tr>
          </thead>
          <tbody>
            {hoaDons.map((h) => (
              <tr key={h.id_hoa_don} style={{ borderBottom: '1px solid var(--gray-50)', transition: 'all 0.2s' }}>
                <td style={{ padding: '20px', fontWeight: 800, color: 'var(--gray-400)' }}>#HD-{h.id_hoa_don}</td>
                <td style={{ padding: '20px', fontWeight: 700 }}>{chuyenNgayISO_SangVN(h.ngay_lap_hoa_don)}</td>
                <td style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--gray-400)' }}>person</span>
                    <span style={{ fontWeight: 800 }}>{h.ten_khach_hang || `KH-${h.id_khach_hang}`}</span>
                  </div>
                </td>
                <td style={{ padding: '20px', textAlign: 'right', fontWeight: 900, color: 'var(--primary)', fontSize: '1.1rem' }}>
                  {formatTienVND(h.tong_tien_cuoi ?? 0)}
                </td>
                <td style={{ padding: '20px' }}>
                  <span style={{
                    padding: '6px 16px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 800,
                    background: h.trang_thai?.toLowerCase() === 'da_thanh_toan' ? 'var(--primary-light)' : 'var(--warning-light, rgba(245, 158, 11, 0.15))',
                    color: h.trang_thai?.toLowerCase() === 'da_thanh_toan' ? 'var(--primary)' : 'var(--warning, #d97706)'
                  }}>
                    {h.trang_thai?.toLowerCase() === 'da_thanh_toan' ? 'ĐÃ QUYẾT TOÁN' : 'CHỜ THANH TOÁN'}
                  </span>
                </td>
                <td style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button className="btn" onClick={() => setViewingHD(h)} style={{ padding: '8px', background: 'var(--gray-50)', color: 'var(--ink)' }} title="Xem chi tiết">
                      <span className="material-symbols-outlined">visibility</span>
                    </button>
                    {h.trang_thai?.toLowerCase() === 'cho_thanh_toan' && (
                      <button className="btn" onClick={() => handleConfirmPayment(h.id_hoa_don)} style={{ padding: '8px', background: 'var(--primary-light)', color: 'var(--primary)' }} title="Xác nhận đã nhận tiền">
                        <span className="material-symbols-outlined">check_circle</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL CHI TIẾT HÓA ĐƠN */}
      <Modal isOpen={!!viewingHD} onClose={() => setViewingHD(null)} title="Chi tiết Hóa đơn" maxWidth="700px">
        {viewingHD && (
          <div id="print-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
              <div>
                <div style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--primary)', marginBottom: '4px' }}>PHÒNG KHÁM REXI</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', fontWeight: 600 }}>123 Đường Láng, Đống Đa, Hà Nội</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', fontWeight: 600 }}>Hotline: 024 1234 5678</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--ink)' }}>HÓA ĐƠN #HD-{viewingHD.id_hoa_don}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--gray-400)', fontWeight: 700 }}>Ngày: {chuyenNgayISO_SangVN(viewingHD.ngay_lap_hoa_don)}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
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

            <div style={{ textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.8rem', fontStyle: 'italic' }}>
              Cảm ơn bạn đã tin tưởng dịch vụ tại Rexi!
            </div>

            <div style={{ marginTop: '32px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }} className="no-print">
              <button className="btn btn-pill" onClick={() => setViewingHD(null)} style={{ background: 'var(--gray-100)', color: 'var(--ink)' }}>Đóng</button>
              {viewingHD.trang_thai?.toLowerCase() === 'cho_thanh_toan' && (
                <button className="btn btn-primary btn-pill" onClick={() => handleConfirmPayment(viewingHD.id_hoa_don)}>
                  <span className="material-symbols-outlined">payments</span> Xác nhận đã nhận tiền
                </button>
              )}
              <button className="btn btn-pill" onClick={handleDownloadPDF} style={{ background: 'var(--danger-light, rgba(239, 68, 68, 0.1))', color: 'var(--danger)' }}>
                <span className="material-symbols-outlined">picture_as_pdf</span>
                Tải PDF
              </button>
              <button className="btn btn-primary btn-pill" onClick={handlePrint}>
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
