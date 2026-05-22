import React, { useMemo, useState, useEffect } from "react";
import axiosInstance from "@services/axios";
import { formatTienVND, getUserProfile, matchesSearchFields } from "@utils/index";
import { Modal } from "@components/CommonUI";
import { useLocation } from "react-router-dom";
import { toast } from "@components/Toast";

const chuyenNgayISO_SangVN = (dateString: string) => {
  if (!dateString) return "—";
  // BẢO MẬT GIAO DIỆN: Chống lỗi lệch múi giờ
  const parts = dateString.split('T')[0].split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateString;
};

const getCustomerId = (user: any) => user?.id_khach_hang ?? user?.idKhachHang ?? user?.id_tai_khoan ?? user?.idTaiKhoan ?? user?.id;
const getInvoiceId = (hd: any) => hd?.id_hoa_don ?? hd?.idHoaDon ?? hd?.id;
const getInvoiceStatus = (hd: any) => String(hd?.trang_thai ?? hd?.trangThai ?? "").toLowerCase();
const getInvoiceDate = (hd: any) => hd?.ngay_lap_hoa_don ?? hd?.ngayLapHoaDon ?? hd?.createdAt;
const getCustomerName = (hd: any) => hd?.ten_khach_hang ?? hd?.tenKhachHang ?? hd?.khachHang?.ho_ten ?? hd?.khachHang?.hoTen ?? "Khách vãng lai";
const getPetName = (hd: any) => hd?.ten_thu_cung ?? hd?.tenThuCung ?? hd?.thuCung?.ten_thu_cung ?? hd?.thuCung?.tenThuCung ?? "";
const getInvoiceTotal = (hd: any) => Number(hd?.tong_tien_cuoi ?? hd?.tongTienCuoi ?? hd?.tong_tien ?? hd?.tongTien ?? hd?.thanh_tien ?? hd?.thanhTien ?? 0);
const getInvoiceBaseTotal = (hd: any) => Number(hd?.tong_tien_ban_dau ?? hd?.tongTienBanDau ?? getInvoiceTotal(hd));
const getInvoiceDiscount = (hd: any) => Number(hd?.tong_giam_gia ?? hd?.tongGiamGia ?? 0);

const HoaDonThanhToan: React.FC = () => {
  const [status, setStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [hoaDons, setHoaDons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingHD, setViewingHD] = useState<any>(null);
  const [chiTietHD, setChiTietHD] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const location = useLocation();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrData, setQrData] = useState<{ url: string, info: string, amount: number } | null>(null);

  // State hỗ trợ Phân trang Server-side
  const [totalServerPages, setTotalServerPages] = useState(1);
  const [isServerPaginated, setIsServerPaginated] = useState(false);

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // Hứng kết quả trả về từ VNPay khi redirect lại trang này
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.has("vnp_SecureHash")) {
      axiosInstance.get(`/api/payment/vnpay/return${location.search}`)
        .then(res => {
          if (res.data.success) {
            toast.success(res.data.message);
            setRefreshTrigger(prev => prev + 1); // Cập nhật lại danh sách hóa đơn ngay lập tức
          } else {
            toast.error(res.data.message);
          }
          // Dọn dẹp URL rác của VNPay trên thanh địa chỉ
          window.history.replaceState(null, '', window.location.pathname);
        })
        .catch(() => toast.error("Lỗi xác thực thanh toán từ VNPay"));
    }
  }, [location.search]);

  useEffect(() => {
    const user = getUserProfile();
    if (user) {
      const userId = getCustomerId(user);
      if (!userId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      axiosInstance.get(`/api/hoa-don/khach/${userId}`, {
        params: { page: currentPage - 1, size: ITEMS_PER_PAGE, status: status !== 'all' ? status : undefined, search: debouncedSearch }
      })
        .then(res => {
          if (res.data && res.data.content) {
            setHoaDons(res.data.content);
            setTotalServerPages(res.data.totalPages);
            setIsServerPaginated(true);
          } else {
            setHoaDons(res.data || []);
            setIsServerPaginated(false);
          }
          setLoading(false);
        })
        .catch(err => {
          console.error("Lỗi tải hóa đơn:", err);
          setLoading(false);
        });
    }
  }, [currentPage, status, debouncedSearch, refreshTrigger]);

  // Hiệu ứng Debounce cho ô tìm kiếm
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300); // Đợi 300ms sau khi ngừng gõ
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Reset về trang 1 mỗi khi đổi bộ lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [status, debouncedSearch]);

  const filteredList = useMemo(() => {
    if (isServerPaginated) return hoaDons;
    return hoaDons.filter(h => {
      if (status !== "all" && getInvoiceStatus(h) !== status.toLowerCase()) return false;
      if (debouncedSearch) {
        if (!matchesSearchFields(debouncedSearch, [
          getInvoiceId(h),
          `HD-${getInvoiceId(h)}`,
          getPetName(h),
          getCustomerName(h),
          getInvoiceDate(h),
          getInvoiceStatus(h),
          getInvoiceTotal(h),
        ])) return false;
      }
      return true;
    });
  }, [status, hoaDons, debouncedSearch, isServerPaginated]);

  // Tính toán dữ liệu hiển thị cho trang hiện tại
  const totalPages = isServerPaginated ? totalServerPages : Math.ceil(filteredList.length / ITEMS_PER_PAGE);
  const currentRows = isServerPaginated ? filteredList : filteredList.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const stats = useMemo(() => {
    const paid = hoaDons.filter(h => (h.trang_thai || h.trangThai)?.toLowerCase() === "da_thanh_toan");
    return {
      total: hoaDons.length,
      paidCount: paid.length,
      unpaidCount: hoaDons.filter(h => (h.trang_thai || h.trangThai)?.toLowerCase() === "cho_thanh_toan").length,
      totalPaid: paid.reduce((s, h) => s + getInvoiceTotal(h), 0)
    };
  }, [hoaDons]);

  const handleExportExcel = () => {
    if (filteredList.length === 0) {
      return;
    }
    const headers = ["Mã HĐ", "Ngày lập", "Thành tiền", "Trạng thái"];
    const rows = filteredList.map(h => [
      `HD-${getInvoiceId(h)}`,
      getInvoiceDate(h)?.split('T')[0] || "",
      getInvoiceTotal(h),
      getInvoiceStatus(h) === 'da_thanh_toan' ? 'Đã thanh toán' : 'Chưa thanh toán'
    ]);

    // BẢO MẬT: Chống CSV Injection bằng cách thêm dấu nháy đơn trước các ký tự nhạy cảm
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
    link.download = `Rexi_HoaDon_${new Date().getTime()}.csv`;
    link.click();
  };

  const handleViewDetails = async (hd: any) => {
    setViewingHD(hd);
    setLoadingDetails(true);
    try {
      const res = await axiosInstance.get(`/api/hoa-don/${getInvoiceId(hd)}/chi-tiet`);
      setChiTietHD(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải chi tiết hóa đơn.");
      setChiTietHD([]);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handlePaymentVNPay = async (hd: any) => {
    try {
      const amount = getInvoiceTotal(hd);
      if (!amount || amount <= 0) {
        toast.error("Hóa đơn chưa có số tiền hợp lệ để thanh toán.");
        return;
      }
      const res = await axiosInstance.post('/api/payment/vnpay/create-url', {
        id_hoa_don: getInvoiceId(hd),
        amount
      });
      if (res.data && res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (error) {
      toast.error("Không thể tạo link thanh toán VNPay lúc này.");
    }
  };


  const handlePaymentVietQR = async (hd: any) => {
    try {
      const amount = getInvoiceTotal(hd);
      if (!amount || amount <= 0) {
        toast.error("Hóa đơn chưa có số tiền hợp lệ để thanh toán.");
        return;
      }
      const res = await axiosInstance.post('/api/payment/vietqr/generate', {
        id_hoa_don: getInvoiceId(hd),
        amount
      });
      if (res.data && res.data.qr_url) {
        setQrData({ url: res.data.qr_url, info: res.data.add_info, amount });
        setShowQRModal(true);
      }
    } catch (error) {
      toast.error("Không thể tạo mã VietQR lúc này.");
    }
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><div className="dot-pulse"></div></div>;

  return (
    <div className="animate-fade-in">
      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .stagger-1 { animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both; }
        .stagger-2 { animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both; }
        .stagger-3 { animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both; }
        .hover-lift { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: default; }
        .hover-lift:hover { transform: translateY(-6px); box-shadow: 0 20px 40px rgba(0,0,0,0.06); }
        .item-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); border: 1px solid transparent; background: var(--surface); }
        .item-card:hover { border-color: var(--primary) !important; background: var(--surface) !important; transform: translateY(-4px) scale(1.01); box-shadow: 0 20px 40px rgba(15, 157, 138, 0.08); z-index: 10; position: relative; }
        @media print {
          body * { visibility: hidden; }
          #print-section, #print-section * { visibility: visible; }
          #print-section { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
      <div className="stagger-1" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', padding: '36px 48px', borderRadius: 'var(--radius-xl)', background: 'linear-gradient(135deg, #db2777 0%, #e11d48 100%)', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 15px 30px rgba(225, 29, 72, 0.2)', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ position: 'absolute', top: '-50px', right: '10%', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 950, letterSpacing: '-1px', margin: '0 0 8px 0' }}>Hóa đơn & Thanh toán 💳</h1>
          <p style={{ fontWeight: 600, opacity: 0.9, margin: 0, fontSize: '1.05rem' }}>Quản lý chi tiêu và lịch sử giao dịch dịch vụ thú y.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input data-ai-id="input-hoadonthanhtoan-z5a1"
              type="text"
              className="btn"
              placeholder="Tìm HĐ, tên khách, thú cưng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ background: 'white', border: 'none', color: '#e11d48', fontWeight: 700, padding: '10px 36px 10px 16px', outline: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
            />
            {searchTerm && (
              <span
                className="material-symbols-outlined"
                onClick={() => setSearchTerm("")}
                style={{ position: 'absolute', right: '10px', cursor: 'pointer', color: 'var(--gray-400)', fontSize: '18px' }}
                title="Xóa tìm kiếm"
              >
                close
              </span>
            )}
          </div>
          <select data-ai-id="select-hoadonthanhtoan-uf4y" className="btn" style={{ background: 'white', border: 'none', color: '#e11d48', fontWeight: 800, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} value={status} onChange={e => setStatus(e.target.value)}>
            <option value="all">Tất cả</option>
            <option value="da_thanh_toan">Đã trả</option>
            <option value="cho_thanh_toan">Chưa trả</option>
          </select>
          <button data-ai-id="button-hoadonthanhtoan-qe5v" className="btn btn-pill" style={{ background: '#fecdd3', color: '#be123c', fontWeight: 900, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }} onClick={handleExportExcel}>
            <span className="material-symbols-outlined">download</span>
            Xuất báo cáo
          </button>
        </div>
      </div>

      <div className="stagger-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        <div className="glass-card hover-lift" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '8px' }}>TỔNG HÓA ĐƠN</p>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--ink)' }}>{stats.total}</h3>
        </div>
        <div className="glass-card hover-lift" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--success)', marginBottom: '8px' }}>ĐÃ THANH TOÁN</p>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--ink)' }}>{stats.paidCount}</h3>
        </div>
        <div className="glass-card hover-lift" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--danger)', marginBottom: '8px' }}>ĐANG CHỜ</p>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--ink)' }}>{stats.unpaidCount}</h3>
        </div>
        <div className="glass-card hover-lift" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', background: 'var(--primary-gradient)', color: 'white' }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 800, opacity: 0.8, marginBottom: '8px' }}>TỔNG CHI TIÊU</p>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 900 }}>{formatTienVND(stats.totalPaid)}</h3>
        </div>
      </div>

      <div className="stagger-3" style={{ display: 'grid', gap: '24px' }}>
        {filteredList.length === 0 ? (
          <div className="glass-card" style={{ padding: '80px', textAlign: 'center', borderRadius: 'var(--radius-xl)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '64px', color: 'var(--gray-200)', marginBottom: '24px' }}>receipt_long</span>
            <p style={{ fontSize: '1.2rem', color: 'var(--gray-400)', fontWeight: 700 }}>Không tìm thấy hóa đơn nào.</p>
          </div>
        ) : currentRows.map(hd => (
          <div key={getInvoiceId(hd)} className="glass-card item-card" style={{ padding: '32px', borderRadius: 'var(--radius-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{ width: '64px', height: '64px', background: 'var(--primary-light)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>receipt_long</span>
              </div>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--ink)', margin: 0 }}>Hóa đơn #HD-{getInvoiceId(hd)}</h3>
                <p style={{ color: 'var(--gray-400)', fontWeight: 700, margin: '4px 0', fontSize: '0.85rem' }}>{chuyenNgayISO_SangVN(getInvoiceDate(hd))} {getPetName(hd) ? `· ${getPetName(hd)}` : ''}</p>
              </div>
            </div>
            <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '40px' }}>
              <div>
                <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '4px' }}>TỔNG TIỀN</p>
                <b style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)' }}>{formatTienVND(getInvoiceTotal(hd))}</b>
              </div>
              <span style={{
                padding: '8px 20px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 900,
                background: getInvoiceStatus(hd) === 'da_thanh_toan' ? 'var(--primary-light)' : '#fef9c3',
                color: getInvoiceStatus(hd) === 'da_thanh_toan' ? 'var(--primary)' : '#a16207'
              }}>
                {getInvoiceStatus(hd) === 'da_thanh_toan' ? 'ĐÃ TRẢ' : 'CHỜ TRẢ'}
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                {getInvoiceStatus(hd) === 'cho_thanh_toan' && (
                  <>
                    <button data-ai-id="button-hoadonthanhtoan-9z33" className="btn hover-scale" style={{ padding: '12px 20px', background: '#005baa', color: 'white', fontWeight: 800, borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => handlePaymentVNPay(hd)} title="Thanh toán qua VNPay">
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>account_balance_wallet</span> VNPay
                    </button>
                    <button data-ai-id="button-hoadonthanhtoan-szsp" className="btn hover-scale" style={{ padding: '12px 20px', background: 'var(--success)', color: 'white', fontWeight: 800, borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => handlePaymentVietQR(hd)} title="Chuyển khoản VietQR">
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>qr_code_scanner</span> VietQR
                    </button>
                  </>
                )}
                <button data-ai-id="button-hoadonthanhtoan-ik3g" className="btn" style={{ padding: '12px', background: 'var(--gray-50)', color: 'var(--ink)' }} onClick={() => handleViewDetails(hd)} title="Xem chi tiết">
                  <span className="material-symbols-outlined">visibility</span>
                </button>
                <button data-ai-id="button-hoadonthanhtoan-xuzd" className="btn" style={{ padding: '12px', background: 'var(--gray-50)', color: 'var(--ink)' }} onClick={async () => { await handleViewDetails(hd); window.print(); }} title="In hóa đơn">
                  <span className="material-symbols-outlined">print</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* BỘ NÚT ĐIỀU HƯỚNG PHÂN TRANG */}
        {totalPages > 1 && (
          <div className="stagger-2" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '20px' }}>
            <button data-ai-id="button-hoadonthanhtoan-sxcp"
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
            <button data-ai-id="button-hoadonthanhtoan-umxy"
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

        {/* MODAL CHI TIẾT HÓA ĐƠN */}
        <Modal isOpen={!!viewingHD} onClose={() => setViewingHD(null)} title="Chi tiết Hóa đơn" maxWidth="700px">
          {viewingHD && (
            <div id="print-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                <div>
                  <div style={{ fontWeight: 900, fontSize: '1.5rem', color: 'var(--primary)', marginBottom: '4px' }}>PHÒNG KHÁM REXI</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', fontWeight: 600 }}>Số 68, Ngô Xuân Quảng, Trâu Quỳ, Gia Lâm, HN</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', fontWeight: 600 }}>Hotline: ***REMOVED***-VIETQR_ACCOUNT_NO</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--ink)' }}>HÓA ĐƠN #HD-{getInvoiceId(viewingHD)}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--gray-400)', fontWeight: 700 }}>Ngày: {chuyenNgayISO_SangVN(getInvoiceDate(viewingHD))}</div>
                </div>
              </div>

              <div className="responsive-grid-2">
                <div style={{ background: 'var(--surface)', border: '1px solid var(--gray-200)', padding: '20px', borderRadius: '20px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--gray-400)', letterSpacing: '1px', marginBottom: '12px' }}>KHÁCH HÀNG</div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--ink)' }}>{getCustomerName(viewingHD)}</div>
                </div>
                <div style={{ background: 'var(--surface)', border: '1px solid var(--gray-200)', padding: '20px', borderRadius: '20px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--gray-400)', letterSpacing: '1px', marginBottom: '12px' }}>THÚ CƯNG</div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--ink)' }}>{getPetName(viewingHD) || 'N/A'}</div>
                </div>
              </div>

              <div className="table-responsive-wrapper">
<div style={{ minWidth: '800px' }}>
<table style={{ width: '100%', marginBottom: '32px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--gray-100)' }}>
                    <th style={{ textAlign: 'left', padding: '12px 0', fontSize: '0.8rem', fontWeight: 900, color: 'var(--gray-500)' }}>MẶT HÀNG / DỊCH VỤ</th>
                    <th style={{ textAlign: 'center', padding: '12px 0', fontSize: '0.8rem', fontWeight: 900, color: 'var(--gray-500)' }}>SL</th>
                    <th style={{ textAlign: 'right', padding: '12px 0', fontSize: '0.8rem', fontWeight: 900, color: 'var(--gray-500)' }}>ĐƠN GIÁ</th>
                    <th style={{ textAlign: 'right', padding: '12px 0', fontSize: '0.8rem', fontWeight: 900, color: 'var(--gray-500)' }}>THÀNH TIỀN</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingDetails ? (
                    <tr><td colSpan={4} style={{ padding: '20px', textAlign: 'center' }}><div className="dot-pulse" style={{ margin: '0 auto' }}></div></td></tr>
                  ) : chiTietHD.length === 0 ? (
                    <tr style={{ borderBottom: '1px solid var(--gray-50)' }}>
                      <td style={{ padding: '16px 0', fontWeight: 700, color: 'var(--ink)' }}>Tổng tiền dịch vụ & vật tư</td>
                      <td style={{ padding: '16px 0', textAlign: 'center', fontWeight: 600, color: 'var(--ink)' }}>1</td>
                      <td style={{ padding: '16px 0', textAlign: 'right', fontWeight: 600, color: 'var(--ink)' }}>{formatTienVND(getInvoiceBaseTotal(viewingHD))}</td>
                      <td style={{ padding: '16px 0', textAlign: 'right', fontWeight: 800, color: 'var(--ink)' }}>{formatTienVND(getInvoiceBaseTotal(viewingHD))}</td>
                    </tr>
                  ) : (
                    chiTietHD.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--gray-50)' }}>
                        <td style={{ padding: '16px 0', fontWeight: 700, color: 'var(--ink)' }}>{item.ten_muc ?? item.tenMuc ?? item.ten_dich_vu ?? item.tenDichVu ?? 'Dịch vụ'}</td>
                        <td style={{ padding: '16px 0', textAlign: 'center', fontWeight: 600, color: 'var(--ink)' }}>{item.so_luong ?? item.soLuong ?? 1}</td>
                        <td style={{ padding: '16px 0', textAlign: 'right', fontWeight: 600, color: 'var(--ink)' }}>{formatTienVND(item.don_gia ?? item.donGia ?? 0)}</td>
                        <td style={{ padding: '16px 0', textAlign: 'right', fontWeight: 800, color: 'var(--ink)' }}>{formatTienVND(item.thanh_tien ?? item.thanhTien ?? 0)}</td>
                      </tr>
                    ))
                  )}
                  {getInvoiceDiscount(viewingHD) > 0 && (
                    <tr style={{ borderBottom: '1px solid var(--gray-50)' }}>
                      <td colSpan={3} style={{ padding: '16px 0', color: 'var(--danger)', fontWeight: 700, textAlign: 'right' }}>Giảm giá (Ưu đãi)</td>
                      <td style={{ padding: '16px 0', textAlign: 'right', color: 'var(--danger)', fontWeight: 800 }}>-{formatTienVND(getInvoiceDiscount(viewingHD))}</td>
                    </tr>
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={3} style={{ padding: '24px 0', fontSize: '1.1rem', fontWeight: 950, color: 'var(--ink)', textAlign: 'right' }}>TỔNG CỘNG THANH TOÁN</td>
                    <td style={{ padding: '24px 0', textAlign: 'right', fontSize: '1.4rem', fontWeight: 950, color: 'var(--primary)' }}>{formatTienVND(getInvoiceTotal(viewingHD))}</td>
                  </tr>
                </tfoot>
              </table>
</div></div>

              <div style={{ textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                Cảm ơn bạn đã tin tưởng dịch vụ tại Rexi!
              </div>

              <div style={{ marginTop: '32px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }} className="no-print">
                <button data-ai-id="button-hoadonthanhtoan-12y5" className="btn btn-pill" onClick={() => setViewingHD(null)} style={{ background: 'var(--gray-100)', color: 'var(--ink)' }}>Đóng</button>
                <button data-ai-id="button-hoadonthanhtoan-qkgo" className="btn btn-primary btn-pill" onClick={() => window.print()}>
                  <span className="material-symbols-outlined">print</span> In hóa đơn
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* MODAL QUÉT MÃ VIETQR */}
        <Modal isOpen={showQRModal} onClose={() => setShowQRModal(false)} title="Thanh toán chuyển khoản" maxWidth="450px">
          {qrData && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ marginBottom: '16px', color: 'var(--gray-500)', fontWeight: 600, fontSize: '0.95rem' }}>
                Mở ứng dụng ngân hàng và quét mã QR bên dưới:
              </div>
              <div style={{ background: 'white', padding: '16px', borderRadius: '24px', display: 'inline-block', boxShadow: 'var(--shadow-md)', marginBottom: '24px', border: '1px solid var(--gray-200)' }}>
                <img src={qrData.url} alt="VietQR" style={{ width: '100%', maxWidth: '300px', height: 'auto', borderRadius: '12px' }} />
              </div>
              <div style={{ background: 'var(--primary-light)', padding: '16px', borderRadius: '16px', border: '1px dashed var(--primary)', marginBottom: '24px' }}>
                <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)', fontWeight: 700, marginBottom: '8px' }}>NỘI DUNG CHUYỂN KHOẢN (BẮT BUỘC)</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '1px' }}>{qrData.info}</div>
              </div>
              <p style={{ color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 700, fontStyle: 'italic', marginBottom: '24px' }}>*Hệ thống sẽ tự động xác nhận hóa đơn sau 1-3 phút kể từ khi nhận được tiền.</p>
              <button data-ai-id="button-hoadonthanhtoan-aaj9" className="btn btn-pill" style={{ background: 'var(--gray-100)', color: 'var(--ink)', width: '100%' }} onClick={() => setShowQRModal(false)}>Đóng</button>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default React.memo(HoaDonThanhToan);
