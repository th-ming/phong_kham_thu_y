import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import axiosInstance from "@services/axios";
import { formatTienVND, getUserProfile, matchesSearchFields } from "@utils/index";
import { customerToneCopy, isGenZBirthYear } from "@utils/customerTone";
import { AnimatedNumber, Modal } from "@components/CommonUI";
import { useLocation } from "react-router-dom";
import { toast } from "@components/Toast";
import { useAutoRefresh } from "@hooks/useAutoRefresh";
import KpiIcon from "@components/KpiIcon";

const chuyenNgayISO_SangVN = (dateString: string) => {
  if (!dateString) return "—";
  // Fix lệch múi giờ để giao diện hiển thị đúng giờ của Việt Nam
  const parts = dateString.split('T')[0].split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateString;
};

const chuyenNgayGioISO_SangVN = (dateString: string) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return chuyenNgayISO_SangVN(dateString);
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const getCustomerId = (user: any) => user?.id_khach_hang ?? user?.idKhachHang ?? user?.id_tai_khoan ?? user?.idTaiKhoan ?? user?.id;
const getInvoiceId = (hd: any) => hd?.id_hoa_don ?? hd?.idHoaDon ?? hd?.id;
const getInvoiceStatus = (hd: any) => String(hd?.trang_thai ?? hd?.trangThai ?? "").toLowerCase();
const isPayableInvoice = (hd: any) => {
  const invoiceStatus = getInvoiceStatus(hd);
  return invoiceStatus === "cho_thanh_toan" || invoiceStatus === "dang_thanh_toan";
};
const getInvoiceStatusLabel = (hd: any) => {
  const invoiceStatus = getInvoiceStatus(hd);
  if (invoiceStatus === "da_thanh_toan") return "ĐÃ TRẢ";
  if (invoiceStatus === "dang_thanh_toan") return "ĐANG CHỜ";
  return "CHỜ TRẢ";
};
const getInvoiceStatusBadgeStyle = (hd: any): React.CSSProperties => {
  const invoiceStatus = getInvoiceStatus(hd);
  if (invoiceStatus === "da_thanh_toan") {
    return {
      background: "var(--primary-light)",
      color: "var(--primary)",
      border: "1px solid rgba(20, 184, 166, 0.28)"
    };
  }
  if (invoiceStatus === "dang_thanh_toan") {
    return {
      background: "linear-gradient(135deg, #fff7c2 0%, #fef3c7 100%)",
      color: "#9a5b05",
      border: "1px solid rgba(245, 158, 11, 0.32)"
    };
  }
  return {
    background: "#fef9c3",
    color: "#a16207",
    border: "1px solid rgba(245, 158, 11, 0.22)"
  };
};
const getInvoiceDate = (hd: any) => hd?.ngay_lap_hoa_don ?? hd?.ngayLapHoaDon ?? hd?.createdAt;
const getCustomerName = (hd: any) => hd?.ten_khach_hang ?? hd?.tenKhachHang ?? hd?.khachHang?.ho_ten ?? hd?.khachHang?.hoTen ?? "Khách vãng lai";
const getPetName = (hd: any) => hd?.ten_thu_cung ?? hd?.tenThuCung ?? hd?.thuCung?.ten_thu_cung ?? hd?.thuCung?.tenThuCung ?? "";
const getInvoiceTotal = (hd: any) => Number(hd?.tong_tien_cuoi ?? hd?.tongTienCuoi ?? hd?.tong_tien ?? hd?.tongTien ?? hd?.thanh_tien ?? hd?.thanhTien ?? 0);
const getInvoiceBaseTotal = (hd: any) => Number(hd?.tong_tien_ban_dau ?? hd?.tongTienBanDau ?? getInvoiceTotal(hd));
const getInvoiceDiscount = (hd: any) => Number(hd?.tong_giam_gia ?? hd?.tongGiamGia ?? 0);
const getPaymentDate = (payment: any) => payment?.ngay_tra_tien ?? payment?.ngayTraTien ?? payment?.createdAt;
const getPaymentMethod = (payment: any) => {
  const method = String(payment?.phuong_thuc ?? payment?.phuongThuc ?? "").toLowerCase();
  if (method.includes("vnpay")) return "VNPay";
  if (method.includes("vietqr")) return "VietQR";
  if (method.includes("tien_mat") || method.includes("tiền mặt")) return "Tiền mặt";
  return payment?.phuong_thuc ?? payment?.phuongThuc ?? "Khác";
};
const getPaymentAmount = (payment: any) => Number(payment?.so_tien ?? payment?.soTien ?? 0);
const getPaymentNote = (payment: any) => payment?.ghi_chu ?? payment?.ghiChu ?? payment?.ma_giao_dich_ngan_hang ?? payment?.maGiaoDichNganHang ?? "—";

const HoaDonThanhToan: React.FC = () => {
  const [status, setStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [hoaDons, setHoaDons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingHD, setViewingHD] = useState<any>(null);
  const [chiTietHD, setChiTietHD] = useState<any[]>([]);

  const [lichSuThanhToan, setLichSuThanhToan] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const location = useLocation();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrData, setQrData] = useState<{ url: string, info: string, amount: number } | null>(null);
  const [printAfterDetailsLoad, setPrintAfterDetailsLoad] = useState(false);
  const [processingPaymentId, setProcessingPaymentId] = useState<string | null>(null);

  // State hỗ trợ Phân trang Server-side
  const [totalServerPages, setTotalServerPages] = useState(1);
  const [isServerPaginated, setIsServerPaginated] = useState(false);
  const hasLoadedRef = useRef(false);

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;
  const currentUser = getUserProfile();
  const toneCopy = customerToneCopy[isGenZBirthYear(currentUser?.nam_sinh) ? "genz" : "mature"];

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

  const fetchInvoices = useCallback(async () => {
    const user = getUserProfile();
    if (user) {
      const userId = getCustomerId(user);
      if (!userId) {
        setLoading(false);
        return;
      }
      if (!hasLoadedRef.current) {
        setLoading(true);
      }
      await axiosInstance.get(`/api/hoa-don/khach/${userId}`, {
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
          hasLoadedRef.current = true;
          setLoading(false);
        })
        .catch(err => {
          console.error("Lỗi tải hóa đơn:", err);
          hasLoadedRef.current = true;
          setLoading(false);
        });
    }
    setLoading(false);
  }, [currentPage, status, debouncedSearch, refreshTrigger]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  useAutoRefresh(fetchInvoices, { runImmediately: false });

  useEffect(() => {
    if (!printAfterDetailsLoad || !viewingHD || loadingDetails || loadingPayments) return;
    const timeoutId = window.setTimeout(() => {
      window.print();
      setPrintAfterDetailsLoad(false);
    }, 150);
    return () => window.clearTimeout(timeoutId);
  }, [printAfterDetailsLoad, viewingHD, loadingDetails, loadingPayments]);

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
      if (status !== "all") {
        const normalizedStatus = status.toLowerCase();
        if (normalizedStatus === "cho_thanh_toan") {
          if (!isPayableInvoice(h)) return false;
        } else if (getInvoiceStatus(h) !== normalizedStatus) {
          return false;
        }
      }
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
      unpaidCount: hoaDons.filter(h => isPayableInvoice(h)).length,
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

    // Tránh lỗi CSV Injection khi xuất hóa đơn bằng dấu nháy đơn
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
    setLoadingPayments(true);
    try {
      const [detailRes, paymentRes] = await Promise.all([
        axiosInstance.get(`/api/hoa-don/${getInvoiceId(hd)}/chi-tiet`),
        axiosInstance.get(`/api/hoa-don/${getInvoiceId(hd)}/thanh-toan`)
      ]);
      setChiTietHD(detailRes.data);
      setLichSuThanhToan(paymentRes.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải chi tiết hóa đơn.");
      setChiTietHD([]);
      setLichSuThanhToan([]);
    } finally {
      setLoadingDetails(false);
      setLoadingPayments(false);
    }
  };

  const handlePaymentVNPay = async (hd: any) => {
    if (processingPaymentId) return;
    try {
      setProcessingPaymentId(getInvoiceId(hd));
      const amount = getInvoiceTotal(hd);
      if (!amount || amount <= 0) {
        toast.error("Hóa đơn chưa có số tiền hợp lệ để thanh toán.");
        return;
      }
      const res = await axiosInstance.post('/api/payment/vnpay/create-url', {
        id_hoa_don: getInvoiceId(hd),
        amount
      });
      if (res.data && res.data.paymentUrl) {
        window.location.href = res.data.paymentUrl;
      }
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error(error.response.data.message || "Hóa đơn đang được xử lý.");
        fetchInvoices();
      } else {
        toast.error("Không thể tạo link thanh toán VNPay lúc này.");
      }
    } finally {
      setProcessingPaymentId(null);
    }
  };

  const handlePaymentVietQR = async (hd: any) => {
    if (processingPaymentId) return;
    try {
      setProcessingPaymentId(getInvoiceId(hd));
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
    } catch (error: any) {
      if (error.response?.status === 409) {
        toast.error(error.response.data.message || "Hóa đơn đang được xử lý.");
        fetchInvoices();
      } else {
        toast.error("Không thể tạo mã VietQR lúc này.");
      }
    } finally {
      setProcessingPaymentId(null);
    }
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><div className="dot-pulse"></div></div>;

  const paidInvoices = hoaDons.filter(h => getInvoiceStatus(h) === "da_thanh_toan");
  const unpaidInvoices = hoaDons.filter(h => isPayableInvoice(h));
  const latestUnpaid = [...unpaidInvoices].sort((a, b) => new Date(getInvoiceDate(b) || 0).getTime() - new Date(getInvoiceDate(a) || 0).getTime())[0];
  const newestInvoice = [...hoaDons].sort((a, b) => new Date(getInvoiceDate(b) || 0).getTime() - new Date(getInvoiceDate(a) || 0).getTime())[0];

  const CustomerKpiCard = ({ accent, title, value, icon, details }: {
    accent: string;
    title: string;
    value: React.ReactNode;
    icon: React.ReactNode;
    details: React.ReactNode;
  }) => (
    <div className="customer-kpi-card glass-card hover-lift" tabIndex={0} style={{ padding: '32px', borderRadius: '32px', border: `1px solid ${accent}25`, background: `linear-gradient(135deg, ${accent}15 0%, var(--surface) 100%)`, minHeight: '190px' }}>
      <div className="customer-kpi-badge" style={{ color: accent, borderColor: `${accent}35`, background: `${accent}12` }}>Chi tiết</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '20px', background: `${accent}22`, color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 20px ${accent}15`, fontSize: '1.55rem', fontWeight: 950 }}>
          {icon}
        </div>
      </div>
      <p style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--gray-500)', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>{title}</p>
      <h3 style={{ fontSize: '1.75rem', fontWeight: 950, color: accent, margin: 0, textShadow: `0 2px 10px ${accent}18` }}>{value}</h3>
      <div className="customer-kpi-popover">{details}</div>
    </div>
  );

  return (
    <div className="animate-fade-in customer-invoice-page">
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
        .item-card {
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
          border-radius: 24px !important;
          backdrop-filter: blur(16px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02), 0 1px 8px rgba(0, 0, 0, 0.01) !important;
          border: 1.5px solid var(--gray-150) !important;
          background: var(--surface);
        }
        .item-card:hover {
          transform: translateY(-6px) !important;
          border-color: var(--primary) !important;
          box-shadow: 0 20px 40px rgba(15, 157, 138, 0.12), 0 1px 12px rgba(0, 0, 0, 0.02) !important;
          z-index: 10;
          position: relative;
        }
        .customer-kpi-card {
          position: relative;
          cursor: help;
          overflow: visible;
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
        }
        .customer-kpi-card:hover,
        .customer-kpi-card:focus {
          transform: translateY(-4px);
          box-shadow: 0 18px 42px rgba(15, 23, 42, 0.12);
          outline: none;
          z-index: 120;
        }
        .customer-kpi-badge {
          position: absolute;
          top: 22px;
          right: 22px;
          display: inline-flex;
          align-items: center;
          padding: 7px 10px;
          border-radius: 999px;
          border: 1px solid;
          font-size: 0.72rem;
          font-weight: 950;
          box-shadow: 0 12px 26px rgba(15, 23, 42, 0.08);
        }
        .customer-kpi-popover {
          position: absolute;
          left: 18px;
          right: 18px;
          top: 70px;
          z-index: 90;
          padding: 16px;
          border-radius: 16px;
          border: 1px solid rgba(20, 184, 166, 0.35);
          background: var(--surface);
          color: var(--ink);
          box-shadow: 0 24px 56px rgba(15, 23, 42, 0.22);
          opacity: 0;
          transform: translateY(-6px);
          pointer-events: none;
          transition: opacity 0.18s ease, transform 0.18s ease;
          font-size: 0.86rem;
          line-height: 1.45;
        }
        .customer-kpi-popover strong {
          display: block;
          margin-bottom: 8px;
          color: var(--primary);
          font-size: 0.92rem;
          font-weight: 950;
        }
        .customer-kpi-popover p {
          margin: 6px 0;
          color: var(--ink);
          font-weight: 800;
        }
        .customer-kpi-card:hover .customer-kpi-popover,
        .customer-kpi-card:focus .customer-kpi-popover {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }
        
        /* 🎫 THIẾT KẾ RĂNG CƯA APPLE WALLET CHO HÓA ĐƠN CHI TIẾT */
        .apple-wallet-receipt {
          background: var(--surface);
          border-radius: 36px;
          border: 1px solid var(--gray-200);
          padding: 40px 32px 64px 32px;
          position: relative;
          box-shadow: 0 20px 50px rgba(0,0,0,0.08);
          overflow: hidden;
        }
        .apple-wallet-receipt::after {
          content: '';
          position: absolute;
          left: 0;
          bottom: 0;
          width: 100%;
          height: 14px;
          background-image: linear-gradient(-45deg, transparent 33.33%, var(--background) 33.33%, var(--background) 66.67%, transparent 66.67%),
                            linear-gradient(45deg, transparent 33.33%, var(--background) 33.33%, var(--background) 66.67%, transparent 66.67%);
          background-size: 16px 32px;
          background-position: 0 -16px;
        }
        @media (max-width: 768px) {
          .customer-invoice-page {
            display: grid;
            gap: 18px;
            padding-bottom: 92px;
          }
          .customer-invoice-hero {
            display: grid !important;
            gap: 18px !important;
            align-items: start !important;
            margin-bottom: 0 !important;
            padding: 24px !important;
            border-radius: 28px !important;
          }
          .customer-invoice-hero h1 {
            font-size: 1.75rem !important;
            line-height: 1.08 !important;
            letter-spacing: 0 !important;
          }
          .customer-invoice-hero p {
            font-size: 0.9rem !important;
            line-height: 1.5 !important;
          }
          .customer-invoice-filters {
            display: grid !important;
            grid-template-columns: 1fr;
            gap: 10px !important;
          }
          .customer-invoice-filters > div,
          .customer-invoice-filters input,
          .customer-invoice-filters select,
          .customer-invoice-filters button {
            width: 100% !important;
          }
          .customer-invoice-kpis {
            display: flex !important;
            gap: 12px !important;
            overflow-x: auto;
            padding: 2px 2px 10px !important;
            margin-bottom: 0 !important;
            scroll-snap-type: x mandatory;
            scrollbar-width: none;
          }
          .customer-invoice-kpis::-webkit-scrollbar {
            display: none;
          }
          .customer-invoice-kpis .customer-kpi-card {
            min-width: 188px !important;
            min-height: 148px !important;
            padding: 18px !important;
            border-radius: 22px !important;
            scroll-snap-align: start;
          }
          .customer-invoice-list {
            gap: 14px !important;
          }
          .customer-invoice-row {
            display: grid !important;
            gap: 16px !important;
            align-items: start !important;
            padding: 18px !important;
            border-radius: 24px !important;
          }
          .customer-invoice-row-main {
            gap: 12px !important;
            align-items: flex-start !important;
          }
          .customer-invoice-row-main > div:first-child {
            width: 48px !important;
            height: 48px !important;
            border-radius: 16px !important;
          }
          .customer-invoice-row h3 {
            font-size: 1.08rem !important;
          }
          .customer-invoice-row-meta {
            display: grid !important;
            grid-template-columns: 1fr;
            gap: 12px !important;
            text-align: left !important;
          }
          .customer-invoice-row-actions {
            display: grid !important;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 8px !important;
          }
          .customer-invoice-row-actions .btn {
            justify-content: center;
            min-height: 42px;
          }
          .apple-wallet-receipt {
            padding: 22px 18px 42px !important;
            border-radius: 24px !important;
          }
        }
        
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm;
          }
          html, body {
            width: 210mm;
            min-height: 297mm;
            background: white !important;
            overflow: visible !important;
          }
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
          .modal-content {
            padding: 0 !important;
          }
          .no-print,
          .no-print * {
            display: none !important;
            visibility: hidden !important;
          }
          #print-section, #print-section * { visibility: visible; }
          #print-section {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 186mm !important;
            min-height: auto !important;
            padding: 12mm !important;
            margin: 0 !important;
            border: 1px solid #d1d5db !important;
            border-radius: 12px !important;
            box-shadow: none !important;
            background: white !important;
            color: #111827 !important;
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .apple-wallet-receipt::after {
            display: none !important;
          }
        }
      `}</style>
      <div className="stagger-1 customer-invoice-hero" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', padding: '36px 48px', borderRadius: 'var(--radius-xl)', background: 'var(--secondary-gradient)', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 15px 30px rgba(225, 29, 72, 0.2)', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ position: 'absolute', top: '-50px', right: '10%', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 950, letterSpacing: '-1px', margin: '0 0 8px 0' }}>{toneCopy.invoiceTitle}</h1>
          <p style={{ fontWeight: 600, opacity: 0.9, margin: 0, fontSize: '1.05rem' }}>{toneCopy.invoiceSubtitle}</p>
        </div>
        <div className="customer-invoice-filters" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', zIndex: 2, color: '#475569', fontSize: '20px', pointerEvents: 'none' }}>search</span>
            <input data-ai-id="input-hoadonthanhtoan-z5a1"
              type="text"
              className="btn"
              placeholder={toneCopy.invoiceSearchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(15, 23, 42, 0.08)', color: '#0f172a', fontWeight: 700, padding: '12px 40px 12px 46px', outline: 'none', borderRadius: '999px', boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)' }}
            />
            {searchTerm && (
              <span
                className="material-symbols-outlined"
                onClick={() => setSearchTerm("")}
                style={{ position: 'absolute', right: '12px', cursor: 'pointer', color: '#64748b', fontSize: '18px' }}
                title="Xóa tìm kiếm"
              >
                close
              </span>
            )}
          </div>
          <select data-ai-id="select-hoadonthanhtoan-uf4y" className="btn" style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(15, 23, 42, 0.08)', color: '#0f172a', fontWeight: 800, borderRadius: '999px', boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)' }} value={status} onChange={e => setStatus(e.target.value)}>
            <option value="all">Tất cả</option>
            <option value="da_thanh_toan">Đã trả</option>
            <option value="cho_thanh_toan">Chưa trả</option>
          </select>
          <button data-ai-id="button-hoadonthanhtoan-qe5v" className="btn btn-pill" style={{ background: 'rgba(254, 205, 211, 0.85)', color: '#be123c', fontWeight: 900, boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)' }} onClick={handleExportExcel}>
            <KpiIcon name="download" size={18} />
            Xuất báo cáo
          </button>
        </div>
      </div>

      <div className="stagger-2 customer-invoice-kpis" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px', position: 'relative', zIndex: 80 }}>
        <CustomerKpiCard
          accent="#3b82f6"
          title="Tổng hóa đơn"
          value={<AnimatedNumber value={stats.total} />}
          icon={<KpiIcon name="receipt" />}
          details={
            <div>
              <strong>Tổng quan hóa đơn</strong>
              <p>{stats.total} hóa đơn đã phát sinh trong tài khoản này.</p>
              <p>Đang hiển thị {filteredList.length} hóa đơn theo bộ lọc hiện tại.</p>
              <p>Mới nhất: {newestInvoice ? `#HD-${getInvoiceId(newestInvoice)} - ${chuyenNgayISO_SangVN(getInvoiceDate(newestInvoice))}` : "Chưa có hóa đơn."}</p>
            </div>
          }
        />
        <CustomerKpiCard
          accent="#10b981"
          title="Đã thanh toán"
          value={<AnimatedNumber value={stats.paidCount} />}
          icon={<KpiIcon name="check" />}
          details={
            <div>
              <strong>{toneCopy.invoicePaidTitle}</strong>
              <p>{stats.paidCount} {toneCopy.invoicePaidText}</p>
              <p>Tổng đã trả: {formatTienVND(stats.totalPaid)}.</p>
              <p>Gần đây: {paidInvoices[0] ? `#HD-${getInvoiceId(paidInvoices[0])}` : "Chưa có giao dịch đã trả."}</p>
            </div>
          }
        />
        <CustomerKpiCard
          accent="#ef4444"
          title="Đang chờ"
          value={<AnimatedNumber value={stats.unpaidCount} />}
          icon={<KpiIcon name="alert" />}
          details={
            <div>
              <strong>{toneCopy.invoiceWaitingTitle}</strong>
              <p>{stats.unpaidCount} {toneCopy.invoiceWaitingText}</p>
              <p>Hóa đơn gần nhất: {latestUnpaid ? `#HD-${getInvoiceId(latestUnpaid)} - ${formatTienVND(getInvoiceTotal(latestUnpaid))}` : "Không còn hóa đơn chờ trả."}</p>
              <p>Chọn VNPay hoặc VietQR tại từng dòng hóa đơn để thanh toán.</p>
            </div>
          }
        />
        <CustomerKpiCard
          accent="#14b8a6"
          title="Tổng chi tiêu"
          value={<AnimatedNumber value={stats.totalPaid} format="currency" />}
          icon={<KpiIcon name="money" />}
          details={
            <div>
              <strong>Chi tiêu đã ghi nhận</strong>
              <p>Tổng số tiền đã thanh toán thành công: {formatTienVND(stats.totalPaid)}.</p>
              <p>Trung bình mỗi hóa đơn đã trả: {stats.paidCount > 0 ? formatTienVND(Math.round(stats.totalPaid / stats.paidCount)) : "0 đ"}.</p>
              <p>Số hóa đơn chờ trả hiện tại: {stats.unpaidCount}.</p>
            </div>
          }
        />
      </div>

      <div className="stagger-3 customer-invoice-list" style={{ display: 'grid', gap: '24px' }}>
        {filteredList.length === 0 ? (
          <div className="glass-card" style={{ padding: '80px', textAlign: 'center', borderRadius: 'var(--radius-xl)' }}>
            <div style={{ color: 'var(--gray-200)', marginBottom: '24px', display: 'inline-flex' }}><KpiIcon name="receipt" size={64} /></div>
            <p style={{ fontSize: '1.2rem', color: 'var(--gray-400)', fontWeight: 700 }}>Không tìm thấy hóa đơn nào.</p>
          </div>
        ) : currentRows.map(hd => (
          <div key={getInvoiceId(hd)} className="glass-card item-card customer-invoice-row" style={{ padding: '32px', borderRadius: 'var(--radius-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="customer-invoice-row-main" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{ width: '64px', height: '64px', background: 'var(--primary-light)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <KpiIcon name="receipt" size={32} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--ink)', margin: 0 }}>Hóa đơn #HD-{getInvoiceId(hd)}</h3>
                <p style={{ color: 'var(--gray-400)', fontWeight: 700, margin: '4px 0', fontSize: '0.85rem' }}>{chuyenNgayISO_SangVN(getInvoiceDate(hd))} {getPetName(hd) ? `· ${getPetName(hd)}` : ''}</p>
              </div>
            </div>
            <div className="customer-invoice-row-meta" style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '40px' }}>
              <div>
                <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '4px' }}>TỔNG TIỀN</p>
                <b style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)' }}>{formatTienVND(getInvoiceTotal(hd))}</b>
              </div>
              <span style={{
                ...getInvoiceStatusBadgeStyle(hd),
                minWidth: '118px',
                height: '40px',
                padding: '0 18px',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 950,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                whiteSpace: 'nowrap',
                lineHeight: 1,
                boxShadow: getInvoiceStatus(hd) === 'dang_thanh_toan' ? '0 8px 18px rgba(245, 158, 11, 0.12)' : 'none'
              }}>
                {getInvoiceStatusLabel(hd)}
              </span>
              <div className="customer-invoice-row-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  {isPayableInvoice(hd) && (
                    <>
                      <button
                        data-ai-id="button-hoadonthanhtoan-vnpay"
                        className="btn btn-pill"
                        style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #005baa 0%, #008cd6 100%)', color: 'white', fontWeight: 700, fontSize: '0.85rem' }}
                        onClick={() => handlePaymentVNPay(hd)}
                        disabled={!!processingPaymentId}
                        title="Thanh toán qua VNPay"
                      >
                        Thanh toán VNPay
                      </button>
                      <button
                        data-ai-id="button-hoadonthanhtoan-vietqr"
                        className="btn btn-pill"
                        style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)', color: 'white', fontWeight: 700, fontSize: '0.85rem' }}
                        onClick={() => handlePaymentVietQR(hd)}
                        disabled={!!processingPaymentId}
                        title="Quét VietQR"
                      >
                        Quét VietQR
                      </button>
                    </>
                  )}
                  <button data-ai-id="button-hoadonthanhtoan-kq3r" className="btn" style={{ padding: '12px', background: 'var(--primary-light)', color: 'var(--primary)' }} onClick={() => handleViewDetails(hd)} title="Xem chi tiết">
                    <KpiIcon name="eye" size={22} />
                  </button>
                  <button data-ai-id="button-hoadonthanhtoan-xuzd" className="btn" style={{ padding: '12px', background: 'var(--gray-50)', color: 'var(--ink)' }} onClick={async () => { setPrintAfterDetailsLoad(true); await handleViewDetails(hd); }} title="In hóa đơn">
                    <KpiIcon name="print" size={22} />
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
              <KpiIcon name="chevronLeft" size={18} /> Trước
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
              Sau <KpiIcon name="chevronRight" size={18} />
            </button>
          </div>
        )}

        {/* MODAL CHI TIẾT HÓA ĐƠN */}
        <Modal isOpen={!!viewingHD} onClose={() => setViewingHD(null)} title="Chi tiết Hóa đơn" maxWidth="700px">
          {viewingHD && (
            <div id="print-section" className="apple-wallet-receipt">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                <div>
                  <div style={{ fontWeight: 950, fontSize: '1.5rem', color: 'var(--primary)', marginBottom: '4px', letterSpacing: '-0.5px' }}>PHÒNG KHÁM REXI</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--gray-450)', fontWeight: 700 }}>Số 68, Ngô Xuân Quảng, Trâu Quỳ, Gia Lâm, HN</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--gray-450)', fontWeight: 700 }}>Hotline: ***REMOVED***-VIETQR_ACCOUNT_NO</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 950, color: 'var(--ink)', letterSpacing: '-0.5px' }}>HÓA ĐƠN #HD-{getInvoiceId(viewingHD)}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--gray-400)', fontWeight: 800 }}>Ngày: {chuyenNgayISO_SangVN(getInvoiceDate(viewingHD))}</div>
                </div>
              </div>

              <div className="responsive-grid-2" style={{ marginBottom: '24px' }}>
                <div style={{ background: 'var(--background)', border: '1px solid var(--gray-150)', padding: '16px 20px', borderRadius: '20px' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 900, color: 'var(--gray-400)', letterSpacing: '1px', marginBottom: '8px' }}>KHÁCH HÀNG</div>
                  <div style={{ fontWeight: 850, fontSize: '0.95rem', color: 'var(--ink)' }}>{getCustomerName(viewingHD)}</div>
                </div>
                <div style={{ background: 'var(--background)', border: '1px solid var(--gray-150)', padding: '16px 20px', borderRadius: '20px' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 900, color: 'var(--gray-400)', letterSpacing: '1px', marginBottom: '8px' }}>THÚ CƯNG</div>
                  <div style={{ fontWeight: 850, fontSize: '0.95rem', color: 'var(--ink)' }}>{getPetName(viewingHD) || 'N/A'}</div>
                </div>
              </div>

              <div className="table-responsive-wrapper">
                <div style={{ minWidth: '100%' }}>
                  <table style={{ width: '100%', marginBottom: '24px', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--gray-150)' }}>
                        <th style={{ textAlign: 'left', padding: '12px 0', fontSize: '0.78rem', fontWeight: 900, color: 'var(--gray-450)' }}>MẶT HÀNG / DỊCH VỤ</th>
                        <th style={{ textAlign: 'center', padding: '12px 0', fontSize: '0.78rem', fontWeight: 900, color: 'var(--gray-450)' }}>SL</th>
                        <th style={{ textAlign: 'right', padding: '12px 0', fontSize: '0.78rem', fontWeight: 900, color: 'var(--gray-450)' }}>ĐƠN GIÁ</th>
                        <th style={{ textAlign: 'right', padding: '12px 0', fontSize: '0.78rem', fontWeight: 900, color: 'var(--gray-450)' }}>THÀNH TIỀN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loadingDetails ? (
                        <tr><td colSpan={4} style={{ padding: '20px', textAlign: 'center' }}><div className="dot-pulse" style={{ margin: '0 auto' }}></div></td></tr>
                      ) : chiTietHD.length === 0 ? (
                        <tr style={{ borderBottom: '1px solid var(--gray-100)' }}>
                          <td style={{ padding: '14px 0', fontWeight: 800, color: 'var(--ink)', fontSize: '0.9rem' }}>Tổng tiền dịch vụ & vật tư</td>
                          <td style={{ padding: '14px 0', textAlign: 'center', fontWeight: 700, color: 'var(--ink)', fontSize: '0.9rem' }}>1</td>
                          <td style={{ padding: '14px 0', textAlign: 'right', fontWeight: 700, color: 'var(--ink)', fontSize: '0.9rem' }}>{formatTienVND(getInvoiceBaseTotal(viewingHD))}</td>
                          <td style={{ padding: '14px 0', textAlign: 'right', fontWeight: 850, color: 'var(--ink)', fontSize: '0.9rem' }}>{formatTienVND(getInvoiceBaseTotal(viewingHD))}</td>
                        </tr>
                      ) : (
                        chiTietHD.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                            <td style={{ padding: '14px 0', fontWeight: 800, color: 'var(--ink)', fontSize: '0.9rem' }}>{item.ten_muc ?? item.tenMuc ?? item.ten_dich_vu ?? item.tenDichVu ?? 'Dịch vụ'}</td>
                            <td style={{ padding: '14px 0', textAlign: 'center', fontWeight: 700, color: 'var(--ink)', fontSize: '0.9rem' }}>{item.so_luong ?? item.soLuong ?? 1}</td>
                            <td style={{ padding: '14px 0', textAlign: 'right', fontWeight: 700, color: 'var(--ink)', fontSize: '0.9rem' }}>{formatTienVND(item.don_gia ?? item.donGia ?? 0)}</td>
                            <td style={{ padding: '14px 0', textAlign: 'right', fontWeight: 850, color: 'var(--ink)', fontSize: '0.9rem' }}>{formatTienVND(item.thanh_tien ?? item.thanhTien ?? 0)}</td>
                          </tr>
                        ))
                      )}
                      {getInvoiceDiscount(viewingHD) > 0 && (
                        <tr style={{ borderBottom: '1px solid var(--gray-100)' }}>
                          <td colSpan={3} style={{ padding: '14px 0', color: 'var(--danger)', fontWeight: 800, textAlign: 'right', fontSize: '0.9rem' }}>Giảm giá (Ưu đãi)</td>
                          <td style={{ padding: '14px 0', textAlign: 'right', color: 'var(--danger)', fontWeight: 900, fontSize: '0.9rem' }}>-{formatTienVND(getInvoiceDiscount(viewingHD))}</td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot>
                      <tr>
                        <td colSpan={3} style={{ padding: '20px 0', fontSize: '1.05rem', fontWeight: 950, color: 'var(--ink)', textAlign: 'right' }}>TỔNG CỘNG THANH TOÁN</td>
                        <td style={{ padding: '20px 0', textAlign: 'right', fontSize: '1.35rem', fontWeight: 950, color: 'var(--primary)' }}>{formatTienVND(getInvoiceTotal(viewingHD))}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span style={{ color: 'var(--primary)', display: 'inline-flex' }}><KpiIcon name="history" size={20} /></span>
                  <div style={{ fontSize: '0.82rem', fontWeight: 950, color: 'var(--ink)', letterSpacing: '0.5px' }}>LỊCH SỬ THANH TOÁN</div>
                </div>
                <div style={{ border: '1px solid var(--gray-200)', borderRadius: '16px', overflow: 'hidden', background: 'var(--background)' }}>
                  {loadingPayments ? (
                    <div style={{ padding: '20px', textAlign: 'center' }}><div className="dot-pulse" style={{ margin: '0 auto' }}></div></div>
                  ) : lichSuThanhToan.length === 0 ? (
                    <div style={{ padding: '14px 18px', color: 'var(--gray-400)', fontWeight: 700, fontSize: '0.85rem' }}>
                      Chưa ghi nhận giao dịch thanh toán cho hóa đơn này.
                    </div>
                  ) : (
                    <div className="table-responsive-wrapper">
                      <div style={{ minWidth: '100%' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                          <thead>
                            <tr style={{ background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                              <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: '0.72rem', fontWeight: 900, color: 'var(--gray-500)' }}>THỜI GIAN</th>
                              <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: '0.72rem', fontWeight: 900, color: 'var(--gray-500)' }}>PHƯƠNG THỨC</th>
                              <th style={{ textAlign: 'right', padding: '10px 16px', fontSize: '0.72rem', fontWeight: 900, color: 'var(--gray-500)' }}>SỐ TIỀN</th>
                              <th style={{ textAlign: 'left', padding: '10px 16px', fontSize: '0.72rem', fontWeight: 900, color: 'var(--gray-500)' }}>GHI CHÚ</th>
                            </tr>
                          </thead>
                          <tbody>
                            {lichSuThanhToan.map((payment, idx) => (
                              <tr key={payment.id_thanh_toan ?? payment.idThanhToan ?? idx} style={{ borderBottom: idx === lichSuThanhToan.length - 1 ? 'none' : '1px solid var(--gray-100)' }}>
                                <td style={{ padding: '12px 16px', fontWeight: 800, color: 'var(--ink)', fontSize: '0.82rem' }}>{chuyenNgayGioISO_SangVN(getPaymentDate(payment))}</td>
                                <td style={{ padding: '12px 16px', fontWeight: 850, color: 'var(--primary)', fontSize: '0.82rem' }}>{getPaymentMethod(payment)}</td>
                                <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 900, color: 'var(--ink)', fontSize: '0.88rem' }}>{formatTienVND(getPaymentAmount(payment))}</td>
                                <td style={{ padding: '12px 16px', color: 'var(--gray-500)', fontWeight: 700, fontSize: '0.82rem' }}>{getPaymentNote(payment)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ textAlign: 'center', color: 'var(--gray-400)', fontSize: '0.78rem', fontStyle: 'italic', marginBottom: '20px' }}>
                Cảm ơn sếp đã tin tưởng dịch vụ tại Rexi!
              </div>

              <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }} className="no-print">
                <button data-ai-id="button-hoadonthanhtoan-12y5" className="btn btn-pill" onClick={() => setViewingHD(null)} style={{ background: 'var(--gray-100)', color: 'var(--ink)', fontWeight: 800 }}>Đóng</button>
                <button data-ai-id="button-hoadonthanhtoan-qkgo" className="btn btn-primary btn-pill" onClick={() => window.print()} style={{ fontWeight: 900 }}>
                  <KpiIcon name="print" size={18} /> In biên lai
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
