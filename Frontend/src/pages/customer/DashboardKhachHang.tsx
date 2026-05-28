import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "@services/axios";
import { Modal } from "@components/CommonUI";
import { getUserProfile } from "@utils/index";
import { useAutoRefresh } from "@hooks/useAutoRefresh";
import { toast } from "@components/Toast";

const formatTienVND = (tien: number) => {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(tien);
};

const PET_CARE_TIPS = [
  { title: "Tẩy giun định kỳ", content: "Đừng quên tẩy giun định kỳ 6 tháng một lần cho các bé nhé!", icon: "medication" },
  { title: "Tiêm phòng dại", content: "Tiêm phòng dại hàng năm là cách tốt nhất bảo vệ bé và gia đình.", icon: "vaccines" },
  { title: "Dinh dưỡng", content: "Chế độ ăn giàu protein giúp lông bé mượt mà và khỏe mạnh hơn.", icon: "nutrition" },
  { title: "Khám định kỳ", content: "Khám sức khỏe tổng quát giúp phát hiện sớm các bệnh lý tiềm ẩn.", icon: "monitor_heart" },
  { title: "Vệ sinh răng miệng", content: "Vệ sinh răng miệng thường xuyên giúp bé tránh được các bệnh về nướu.", icon: "dentistry" },
  { title: "Uống đủ nước", content: "Luôn đảm bảo bé có đủ nước sạch, đặc biệt là trong mùa hè nóng bức.", icon: "water_drop" },
  { title: "Vận động", content: "Dành ít nhất 30 phút mỗi ngày để chơi cùng bé giúp giải tỏa năng lượng.", icon: "pets" },
  { title: "Chải lông", content: "Chải lông hàng ngày giúp giảm tình trạng rụng lông và búi lông ở mèo.", icon: "content_cut" }
];

const isPetActive = (pet: any) => pet?.da_xoa !== true && pet?.daXoa !== true;
const AUTO_REFRESH_MS = 10_000;
const hasValidBirthYear = (value: any) => {
  if (value === undefined || value === null || value === "") return false;
  const year = Number(value);
  const currentYear = new Date().getFullYear();
  return Number.isInteger(year) && year >= 1900 && year <= currentYear;
};

const DashboardKhachHang: React.FC = () => {
  const navigate = useNavigate();
  const [pets, setPets] = useState<any[]>([]);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [allAppointments, setAllAppointments] = useState<any[]>([]);
  const [paidInvoices, setPaidInvoices] = useState<any[]>([]);
  const [hoanTat, setHoanTat] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isTipsModalOpen, setIsTipsModalOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [petRowsForTrend, setPetRowsForTrend] = useState<any[]>([]);

  // Các state cho Modal hỏi năm sinh tự động kích hoạt
  const [showAgeModal, setShowAgeModal] = useState(() => {
    const cachedUser = getUserProfile();
    return !hasValidBirthYear(cachedUser?.nam_sinh);
  });
  const [inputNamSinh, setInputNamSinh] = useState("");
  const [savingAge, setSavingAge] = useState(false);
  const [ageError, setAgeError] = useState("");
  const [confettiActive, setConfettiActive] = useState(false);

  const handleSaveAge = async (e: React.FormEvent) => {
    e.preventDefault();
    setAgeError("");
    const namSinhNum = Number(inputNamSinh);
    const currentYear = new Date().getFullYear();
    if (!inputNamSinh || isNaN(namSinhNum) || namSinhNum < 1900 || namSinhNum > currentYear) {
      setAgeError(`Vui lòng nhập năm sinh hợp lệ (từ 1900 đến ${currentYear})!`);
      return;
    }

    setSavingAge(true);
    try {
      const idKhachHang = user.id_khach_hang || user.id_tai_khoan || user.id;
      await axiosInstance.put(`/api/khach-hang/${idKhachHang}`, {
        ten_khach_hang: user.ten_khach_hang || user.displayName || user.ho_ten || user.fullName || user.ten_dang_nhap || "",
        email: user.email || "",
        sdt: user.sdt || "",
        dia_chi: user.dia_chi || "",
        nam_sinh: namSinhNum
      });
      
      const updatedUser = { ...user, nam_sinh: namSinhNum };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      
      setConfettiActive(true);
      toast.success("Đã kích hoạt phong cách phục vụ mới! 🎉");
      
      setTimeout(() => {
        setShowAgeModal(false);
        setConfettiActive(false);
        window.location.reload();
      }, 2000);
    } catch (err) {
      console.error("Lỗi cập nhật năm sinh:", err);
      setAgeError("Không thể cập nhật năm sinh lúc này. Sếp thử lại sau nhé!");
    } finally {
      setSavingAge(false);
    }
  };

  const randomTip = useMemo(() => PET_CARE_TIPS[Math.floor(Math.random() * PET_CARE_TIPS.length)], []);

  const user = getUserProfile();
  const userName = user?.display_name || user?.displayName || user?.ho_ten || user?.hoTen || user?.fullName || user?.ten_khach_hang || user?.ten_dang_nhap || user?.username || "Sen";
  const userAvatar = user?.hinh_anh || user?.avatar || "";
  const userInitial = String(userName).replace(/^\d+\.\s*/, '').trim().charAt(0).toUpperCase() || "S";

  React.useEffect(() => {
    // Khi profile đã có năm sinh hợp lệ (VD đồng bộ từ backend), tắt popup vĩnh viễn ở phiên hiện tại.
    if (hasValidBirthYear(user?.nam_sinh)) {
      setShowAgeModal(false);
    }
  }, [user?.nam_sinh]);

  // Bẫy nghiệp vụ phân loại KHACH_HANG: Cắt mốc từ 1997 trở đi gán cứng là GENZ.
  // Quyết định này giúp đổi banner động dới chatbot Rexi nhây nhây siêu bựa.
  // Ông nào sau này bảo trì muốn đổi mốc 1997 sang mốc khác thì đổi ở đây dới đồng bộ DB nha.
  const isGenZ = useMemo(() => {
    if (!user) return false;
    const userNamSinh = user.nam_sinh;
    return userNamSinh !== undefined && userNamSinh !== null && Number(userNamSinh) >= 1997;
  }, [user]);

  const fetchDashboardData = React.useCallback(async () => {
    if (!user) {
      navigate("/dang-nhap");
      return;
    }

    const idKhachHang = user.id_khach_hang || user.id_tai_khoan || user.id;

    if (!idKhachHang) {
      setLoading(false);
      return;
    }

    try {
      // Bổ sung params phân trang (page, size) để tránh lỗi 400 Bad Request từ Backend
      const [petRes, appRes, invRes] = await Promise.allSettled([
        axiosInstance.get(`/api/thu-cung/khach/${idKhachHang}`, { params: { page: 0, size: 999 } }),
        axiosInstance.get(`/api/lich-hen/khach/${idKhachHang}`, { params: { page: 0, size: 999 } }),
        axiosInstance.get(`/api/hoa-don/khach/${idKhachHang}`, { params: { page: 0, size: 999 } })
      ]);

      const extractArray = (data: any): any[] => {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        const possibleArrays = [data.data, data.content, data.result, data.items, data.records];
        for (const arr of possibleArrays) {
          if (Array.isArray(arr)) return arr;
          if (arr && typeof arr === 'object' && Array.isArray(arr.content)) return arr.content;
          if (arr && typeof arr === 'object' && Array.isArray(arr.data)) return arr.data;
        }
        return [];
      };

      if (petRes.status === 'fulfilled') {
        const allPetRows = extractArray(petRes.value);
        setPetRowsForTrend(allPetRows);
        setPets(allPetRows.filter(isPetActive));
      }
      if (appRes.status === 'fulfilled') {
        const appointments = extractArray(appRes.value);
        setAllAppointments(appointments);
        const upcomingList = appointments.filter((l: any) => {
          const st = String(l.trang_thai || l.trangThai || '').toUpperCase();
          return st === 'CHO_XAC_NHAN' || st === 'DA_XAC_NHAN' || st === 'DANG_KHAM';
        });
        setUpcoming(upcomingList);

        const hoanTatCount = appointments.filter((l: any) => {
          const st = String(l.trang_thai || l.trangThai || '').toUpperCase();
          return st === 'DA_KHAM' || st === 'HOAN_THANH' || st === 'HOAN_TAT';
        }).length;
        setHoanTat(hoanTatCount);
      }
      if (invRes.status === 'fulfilled') {
        const invoices = extractArray(invRes.value);
        const paidInvs = invoices.filter((inv: any) => (inv.trang_thai || inv.trangThai)?.toLowerCase() === 'da_thanh_toan');
        setPaidInvoices(paidInvs);
        const parseCurrency = (val: any) => {
          if (!val) return 0;
          if (typeof val === 'number') return val;
          const cleanStr = String(val).replace(/[^0-9.-]+/g, "");
          return Number(cleanStr) || 0;
        };
        const total = paidInvs.reduce((sum: number, inv: any) => sum + parseCurrency(inv.tong_tien_cuoi || inv.tongTienCuoi || inv.tong_tien_ban_dau || inv.tongTienBanDau), 0);
        setTotalSpent(total);
      }
    } catch (err) {
      console.error("Lỗi đồng bộ dữ liệu Dashboard Khách:", err);
    } finally {
      setLoading(false);

      const now = new Date();
      const formatTime = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      setLastUpdated(formatTime);
    }
  }, [navigate, user]);

  useAutoRefresh(fetchDashboardData, { intervalMs: AUTO_REFRESH_MS });

  const isDateInThisMonth = (value: any) => {
    if (!value) return false;
    const date = new Date(value);
    if (isNaN(date.getTime())) return false;
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  };

  const calculatePetNetTrend = (allPetRows: any[]) => {
    if (!allPetRows || allPetRows.length === 0) return { trend: "Chưa có", tone: "neutral" };

    const addedThisMonth = allPetRows.filter(pet =>
      isPetActive(pet) && isDateInThisMonth(pet.ngay_tao || pet.ngayTao)
    ).length;
    const deletedThisMonth = allPetRows.filter(pet =>
      !isPetActive(pet) && isDateInThisMonth(pet.ngay_cap_nhat || pet.ngayCapNhat || pet.ngay_xoa || pet.ngayXoa)
    ).length;
    const net = addedThisMonth - deletedThisMonth;

    if (net > 0) return { trend: `+${net} tháng này`, tone: "up" };
    if (net < 0) return { trend: `${net} tháng này`, tone: "down" };
    return { trend: "Không đổi", tone: "neutral" };
  };

  const calculateRealGrowth = (dataArray: any[], dateFields: string[], amountField?: string) => {
    if (!dataArray || dataArray.length === 0) return { trend: "Chưa có", tone: "neutral" };
    
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
    
    let thisMonthCount = 0;
    let lastMonthCount = 0;

    dataArray.forEach(item => {
      let d = null;
      for (const field of dateFields) {
        if (item[field]) {
          d = new Date(item[field]);
          if (!isNaN(d.getTime())) break;
        }
      }
      if (!d || isNaN(d.getTime())) return;
      
      const t = d.getTime();
      let value = 1;
      if (amountField) {
        const val = item[amountField] || item.tongTienCuoi || item.tong_tien_ban_dau || item.tongTienBanDau;
        value = typeof val === 'number' ? val : (Number(String(val).replace(/[^0-9.-]+/g, "")) || 0);
      }

      if (t >= startOfThisMonth) {
        thisMonthCount += value;
      } else if (t >= startOfLastMonth && t < startOfThisMonth) {
        lastMonthCount += value;
      }
    });

    if (lastMonthCount === 0) {
      if (thisMonthCount > 0) return { trend: `+${amountField ? formatTienVND(thisMonthCount) : thisMonthCount} tháng này`, tone: "up" };
      return { trend: "Chưa có", tone: "neutral" };
    }

    const percentage = ((thisMonthCount - lastMonthCount) / lastMonthCount) * 100;
    if (percentage === 0) return { trend: "Không đổi", tone: "neutral" };
    
    const sign = percentage > 0 ? "+" : "";
    const tone = percentage > 0 ? "up" : "down";
    
    return { trend: `${sign}${Math.round(percentage)}%`, tone };
  };

  const stats = useMemo(() => {
    const petsTrend = calculatePetNetTrend(petRowsForTrend);
    const upcTrend = calculateRealGrowth(allAppointments.filter((l: any) => {
      const st = String(l.trang_thai || l.trangThai || '').toUpperCase();
      return st === 'CHO_XAC_NHAN' || st === 'DA_XAC_NHAN' || st === 'DANG_KHAM';
    }), ['ngay_tao', 'ngayTao', 'ngay_kham']);
    
    const completedApps = allAppointments.filter((l: any) => {
      const st = String(l.trang_thai || l.trangThai || '').toUpperCase();
      return st === 'DA_KHAM' || st === 'HOAN_THANH' || st === 'HOAN_TAT';
    });
    const hoanTatTrend = calculateRealGrowth(completedApps, ['ngay_tao', 'ngayTao', 'ngay_cap_nhat', 'ngay_kham']);
    const spentTrend = calculateRealGrowth(paidInvoices, ['ngay_lap_hoa_don', 'ngay_lap', 'ngay_tao', 'ngayTao'], 'tong_tien_cuoi');

    // TÓM TẮT DỮ LIỆU THỰC TẾ (DATA BREAKDOWN) CHO HIỆU ỨNG HOVER
    
    // Tóm tắt Bé Cưng
    let petsSummary = "Chưa có dữ liệu chi tiết";
    if (pets.length > 0) {
      const dogs = pets.filter(p => String(p.loai_thu_cung || p.giong || '').toLowerCase().includes('chó')).length;
      const cats = pets.filter(p => String(p.loai_thu_cung || p.giong || '').toLowerCase().includes('mèo')).length;
      const other = pets.length - dogs - cats;
      
      const parts = [];
      if (dogs > 0) parts.push(`Chó: ${dogs}`);
      if (cats > 0) parts.push(`Mèo: ${cats}`);
      if (other > 0) parts.push(`Khác: ${other}`);
      
      petsSummary = parts.length > 0 ? `Bao gồm: ${parts.join(', ')}` : `Danh sách: ${pets.slice(0, 3).map(p => p.ten_thu_cung || 'Bé').join(', ')}...`;
    }

    // Tóm tắt Lịch hẹn
    let upcSummary = "Không có lịch hẹn nào sắp tới";
    if (upcoming.length > 0) {
      const sortedUpc = [...upcoming].sort((a, b) => new Date(a.ngay_kham).getTime() - new Date(b.ngay_kham).getTime());
      const nextApp = sortedUpc[0];
      const dateStr = nextApp.ngay_kham?.split('T')[0].split('-').reverse().join('/') || '---';
      upcSummary = `Gần nhất: ${dateStr} lúc ${nextApp.gio_kham?.substring(0, 5) || '---'}`;
    }

    // Tóm tắt Đã khám
    let hoanTatSummary = "Chưa có lịch sử khám bệnh";
    if (completedApps.length > 0) {
      const sortedCompleted = [...completedApps].sort((a, b) => new Date(b.ngay_kham).getTime() - new Date(a.ngay_kham).getTime());
      const lastApp = sortedCompleted[0];
      const dateStr = lastApp.ngay_kham?.split('T')[0].split('-').reverse().join('/') || '---';
      hoanTatSummary = `Lần khám gần nhất: ${dateStr}`;
    }

    // Tóm tắt Chi tiêu
    let spentSummary = "Chưa có giao dịch nào";
    if (paidInvoices.length > 0) {
      const thisMonthInvoices = paidInvoices.filter(inv => {
        const d = new Date(inv.ngay_lap_hoa_don || inv.ngay_lap || inv.ngay_tao);
        return !isNaN(d.getTime()) && d.getMonth() === new Date().getMonth() && d.getFullYear() === new Date().getFullYear();
      });
      const parseCurrency = (val: any) => typeof val === 'number' ? val : (Number(String(val).replace(/[^0-9.-]+/g, "")) || 0);
      const thisMonthSpent = thisMonthInvoices.reduce((sum, inv) => sum + parseCurrency(inv.tong_tien_cuoi || inv.tongTienCuoi), 0);
      spentSummary = `Đã chi trong tháng này: ${formatTienVND(thisMonthSpent)}`;
    }

    return [
      { label: "BÉ CƯNG", value: pets.length, icon: "pets", color: "var(--primary)", trendData: petsTrend, summary: petsSummary },
      { label: "LỊCH HẸN", value: upcoming.length, icon: "calendar_month", color: "#3b82f6", trendData: upcTrend, summary: upcSummary },
      { label: "ĐÃ KHÁM", value: hoanTat, icon: "verified", color: "#f59e0b", trendData: hoanTatTrend, summary: hoanTatSummary },
      { label: "CHI TIÊU", value: formatTienVND(totalSpent), icon: "payments", color: "#14b8a6", trendData: spentTrend, summary: spentSummary },
    ];
  }, [pets, petRowsForTrend, upcoming, allAppointments, hoanTat, paidInvoices, totalSpent]);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><div className="dot-pulse"></div></div>;

  return (
    <div className="animate-fade-in">
      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0px); }
        }
        @keyframes bounceLocal {
          0% { transform: translateY(0); }
          100% { transform: translateY(-4px); }
        }
        .stagger-1 { animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both; }
        .stagger-2 { animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both; }
        .stagger-3 { animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both; }
        
        .hover-lift { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; }
        .hover-lift:hover { transform: translateY(-6px); box-shadow: 0 20px 40px rgba(0,0,0,0.06); }
        
        .appointment-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); border: 1px solid var(--gray-100); }
        .appointment-card:hover { border-color: var(--primary) !important; background: var(--surface) !important; transform: scale(1.02) translateX(8px); box-shadow: -5px 15px 25px rgba(15, 157, 138, 0.12); z-index: 10; }
        
        .icon-bounce:hover span { animation: bounceLocal 0.3s ease infinite alternate; }

        .kpi-card { position: relative; overflow: visible; }
        .kpi-trend-badge {
          position: absolute;
          top: 22px;
          right: 22px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 7px 9px;
          border-radius: 999px;
          font-size: 0.72rem;
          font-weight: 950;
          border: 1px solid rgba(148, 163, 184, 0.18);
          background: rgba(255,255,255,0.74);
          box-shadow: 0 12px 26px rgba(15, 23, 42, 0.08);
          cursor: help;
          z-index: 2;
          transition: transform 0.2s ease, filter 0.2s ease;
        }
        .kpi-trend-badge:hover {
          transform: scale(1.05);
          filter: brightness(1.05);
        }
        .kpi-trend-badge.up { color: #16a34a; background: rgba(240, 253, 244, 0.92); border-color: rgba(34, 197, 94, 0.28); }
        .kpi-trend-badge.down { color: #e11d48; background: rgba(255, 241, 242, 0.92); border-color: rgba(244, 63, 94, 0.26); }
        .kpi-trend-badge.neutral { color: var(--gray-500); background: rgba(248, 250, 252, 0.92); }
        [data-theme='dark'] .kpi-trend-badge {
          background: rgba(15, 23, 42, 0.82);
          border-color: rgba(148, 163, 184, 0.22);
          box-shadow: 0 14px 30px rgba(0, 0, 0, 0.24), inset 0 1px 0 rgba(255,255,255,0.04);
          backdrop-filter: blur(10px);
        }
        [data-theme='dark'] .kpi-trend-badge.up {
          color: #86efac;
          background: rgba(20, 83, 45, 0.34);
          border-color: rgba(74, 222, 128, 0.32);
        }
        [data-theme='dark'] .kpi-trend-badge.down {
          color: #fda4af;
          background: rgba(136, 19, 55, 0.34);
          border-color: rgba(251, 113, 133, 0.32);
        }
        [data-theme='dark'] .kpi-trend-badge.neutral {
          color: #cbd5e1;
          background: rgba(30, 41, 59, 0.72);
          border-color: rgba(148, 163, 184, 0.28);
        }
        .kpi-trend-popover {
          position: absolute;
          top: 58px;
          right: 18px;
          width: min(250px, calc(100% - 36px));
          padding: 14px 15px;
          border-radius: 16px;
          transition: all 0.3s ease;
        }
        .kpi-trend-badge:hover + .kpi-trend-popover,
        .kpi-trend-badge:focus + .kpi-trend-popover,
        .kpi-trend-popover:hover,
        .kpi-card:hover .kpi-trend-popover {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }

        .stat-card-container:hover .stat-summary {
          opacity: 1;
          transform: translateY(0);
        }

        .trend-badge:hover {
          transform: scale(1.05) translateY(-2px);
          filter: brightness(1.1);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        // Hiệu ứng hover cao cấp cho thẻ Cẩm nang chăm sóc
        .tip-card {
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          background: var(--surface);
          border: 1px solid var(--gray-200);
          cursor: pointer;
        }
        .tip-card:hover {
          transform: translateY(-4px) scale(1.015);
          border-color: var(--primary) !important;
          background: var(--surface) !important;
          // Hiệu ứng phát sáng (glow) kết hợp bóng đổ mượt mà
          box-shadow: 0 15px 30px rgba(15, 157, 138, 0.2), 0 0 12px rgba(15, 157, 138, 0.15);
          // Tăng độ sáng khi di chuột để làm nổi bật thẻ
          filter: brightness(1.2);
        }
        .tip-card .tip-icon-container {
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          background: var(--background);
          color: var(--primary);
        }
        .tip-card:hover .tip-icon-container {
          background: var(--primary) !important;
          color: white !important;
          transform: scale(1.1) rotate(6deg);
          box-shadow: 0 6px 20px rgba(15, 157, 138, 0.35);
        }
      `}</style>
      <div className="stagger-1" style={{ marginBottom: '40px', padding: '48px', borderRadius: 'var(--radius-xl)', background: 'var(--secondary-gradient)', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 15px 35px rgba(13, 148, 136, 0.2)' }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', bottom: '-20%', left: '0%', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none', opacity: 0.5 }}></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '88px', height: '88px', borderRadius: '50%', background: 'var(--primary-gradient)', display: 'grid', placeItems: 'center', boxShadow: '0 14px 32px rgba(0,0,0,0.18), 0 0 22px var(--primary-shadow)', flexShrink: 0 }}>
            <div style={{ width: '78px', height: '78px', borderRadius: '50%', overflow: 'hidden', border: '3px solid rgba(255,255,255,0.72)', background: 'var(--primary)', display: 'grid', placeItems: 'center', color: 'white', fontWeight: 950, fontSize: '2rem' }}>
              {userAvatar ? (
                <img src={userAvatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span>{userInitial}</span>
              )}
            </div>
          </div>
          <div>
            <h1 className="header-title" style={{ fontSize: '3.5rem', fontWeight: 950, letterSpacing: '-2px', margin: '0 0 8px 0', textShadow: '0 4px 15px rgba(0,0,0,0.2)', color: 'white' }}>
              {isGenZ ? `Hế lô Sen ${userName} nha! 🦖👋` : `Kính chào Quý khách ${userName}! 👋`}
            </h1>
            <p style={{ fontWeight: 700, color: 'rgba(255,255,255,0.95)', margin: 0, fontSize: '1.2rem', textShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
              {isGenZ 
                ? "Hôm nay boss cưng thế nào òi? Cùng xem lịch khám dới chi tiêu dới Rexi nhen! 🐾💖"
                : "Chào mừng Quý khách quay trở lại. Kính chúc Quý khách và các bé cưng một ngày tràn đầy sức khỏe và bình an! 🏥✨"}
            </p>
            {lastUpdated && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 800, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', padding: '6px 14px', borderRadius: '999px', marginTop: '14px', border: '1px solid rgba(255,255,255,0.2)', position: 'relative', zIndex: 1, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#5eead4', animation: 'spin 3s infinite linear' }}>sync</span>
                <span>Dữ liệu thời gian thực cập nhật lúc: {lastUpdated}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '32px', marginBottom: '40px' }}>
        {stats.map((item, i) => (
          <div key={i} className="glass-card hover-lift kpi-card" style={{ padding: '32px', borderRadius: '32px', border: `1px solid ${item.color}20`, minHeight: '190px' }}>
            {item.trendData && (
              <button
                type="button"
                className={`kpi-trend-badge ${item.trendData.tone}`}
                aria-label={`Chi tiết ${item.label}`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                  {item.trendData.tone === 'up' ? 'trending_up' : item.trendData.tone === 'down' ? 'trending_down' : 'trending_flat'}
                </span>
                <span>{item.trendData.trend}</span>
              </button>
            )}
            <div className="kpi-trend-popover">
              <div className="kpi-popover-title">{item.label}</div>
              <div className="kpi-popover-value">
                {item.summary}
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div style={{ background: `${item.color}15`, color: item.color, width: '60px', height: '60px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 20px ${item.color}20` }}>
                <span className="material-symbols-outlined" style={{ fontSize: '30px' }}>{item.icon}</span>
              </div>
            </div>
            <p style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--gray-500)', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>{item.label}</p>
            <h3 style={{ fontSize: '2rem', fontWeight: 950, color: 'var(--ink)', margin: 0 }}>{item.value}</h3>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }} className="stagger-3">
        <div className="glass-card hover-lift" style={{ padding: '32px', borderRadius: 'var(--radius-xl)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--ink)' }}>Lịch hẹn sắp tới</h3>
            <Link to="/khach-hang/dat-lich-hen" className="btn btn-primary btn-pill" style={{ padding: '8px 24px', fontSize: '0.85rem' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>
              Đặt lịch mới
            </Link>
          </div>

          {upcoming.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', background: 'var(--surface)', border: '1px dashed var(--gray-200)', borderRadius: '24px', color: 'var(--gray-400)', transition: 'all 0.3s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(0.98)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
              <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: '16px' }}>event_busy</span>
              <p style={{ fontWeight: 700 }}>Bạn chưa có lịch hẹn nào sắp tới.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {/* Chỉ hiển thị tối đa 3 lịch hẹn sắp tới trên giao diện danh sách */}
              {upcoming.slice(0, 3).map((app, i) => (
                <div key={i} className="appointment-card" style={{ background: 'var(--surface)', padding: '20px', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', background: 'var(--background)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', boxShadow: 'var(--shadow-sm)' }}>
                      <span className="material-symbols-outlined">calendar_today</span>
                    </div>
                    <div>
                      <p style={{ fontWeight: 800, color: 'var(--ink)', margin: 0 }}>{app.ly_do || 'Khám tổng quát'}</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 600, margin: '2px 0 0 0' }}>Dành cho: <b style={{ color: 'var(--primary)' }}>{pets.find(p => p.id_thu_cung === app.id_thu_cung)?.ten_thu_cung || 'Thú cưng'}</b></p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: 900, color: 'var(--ink)', margin: 0 }}>{app.ngay_kham?.split('T')[0].split('-').reverse().join('/') || "---"}</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 900, margin: '2px 0 0 0' }}>{app.gio_kham?.substring(0, 5)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gap: '32px' }}>
          <div className="glass-card hover-lift" style={{ padding: '48px', borderRadius: '40px', background: 'var(--primary-gradient)', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 40px var(--primary-shadow)', border: 'none' }}>
            <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>lightbulb</span>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 900, margin: 0 }}>Mẹo chăm sóc</h3>
            </div>
            <p style={{ opacity: 0.95, fontSize: '1.1rem', lineHeight: '1.8', fontWeight: 600, minHeight: '100px', margin: 0 }}>{randomTip.content}</p>
            <button data-ai-id="button-dashboardkhachhang-tppw" className="btn btn-pill" onClick={() => setIsTipsModalOpen(true)} style={{ background: 'rgba(255,255,255,0.15)', color: 'white', marginTop: '32px', width: '100%', border: '1.5px solid rgba(255,255,255,0.3)', fontWeight: 800, backdropFilter: 'blur(10px)' }}>Xem tất cả mẹo</button>
          </div>

          <a href="tel:***REMOVED***-VIETQR_ACCOUNT_NO" className="glass-card hover-lift" style={{ padding: '32px', borderRadius: 'var(--radius-xl)', display: 'flex', alignItems: 'center', gap: '20px', textDecoration: 'none', cursor: 'pointer' }}>
            <div style={{ width: '56px', height: '56px', background: 'var(--primary-light)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>support_agent</span>
            </div>
            <div>
              <h4 style={{ margin: 0, fontWeight: 800, color: 'var(--ink)' }}>Hỗ trợ 24/7</h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--gray-500)', fontWeight: 600 }}>Cần tư vấn khẩn cấp? Gọi <b style={{ color: 'var(--primary)' }}>0353.374.156</b></p>
            </div>
          </a>
        </div>
      </div>

      {/* MODAL DANH SÁCH MẸO */}
      <Modal isOpen={isTipsModalOpen} onClose={() => setIsTipsModalOpen(false)} title="Cẩm nang chăm sóc thú cưng">
        <div style={{ display: 'grid', gap: '16px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '8px' }}>
          {PET_CARE_TIPS.map((tip, i) => (
            <div key={i} className="tip-card" style={{ display: 'flex', gap: '20px', padding: '20px', borderRadius: '20px', animation: 'slideUpFade 0.5s ease forwards', animationDelay: `${i * 0.1}s`, opacity: 0 }}>
              <div className="tip-icon-container" style={{ width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span className="material-symbols-outlined">{tip.icon}</span>
              </div>
              <div>
                <h4 style={{ margin: '0 0 4px 0', fontWeight: 800, color: 'var(--ink)' }}>{tip.title}</h4>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--gray-500)', fontWeight: 600, lineHeight: 1.6 }}>{tip.content}</p>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      {/* MODAL HỎI NĂM SINH GLASSMORPHISM ĐỘC QUYỀN REXI */}
      {showAgeModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 99999,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(16px)',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          {/* CONFETTI EFFECT */}
          {confettiActive && (
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 10 }}>
              {Array.from({ length: 45 }).map((_, idx) => {
                const colors = ['#0f9d8a', '#14b8a6', '#f59e0b', '#3b82f6', '#e11d48', '#10b981'];
                const left = Math.random() * 100;
                const delay = Math.random() * 2;
                const duration = Math.random() * 2 + 1.5;
                const size = Math.random() * 8 + 6;
                const color = colors[Math.floor(Math.random() * colors.length)];
                return (
                  <div key={idx} style={{
                    position: 'absolute', top: '-20px', left: `${left}%`,
                    width: `${size}px`, height: `${size}px`,
                    background: color, borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                    opacity: 0.8,
                    transform: `rotate(${Math.random() * 360}deg)`,
                    animation: `fallAndSpin ${duration}s linear ${delay}s infinite`
                  }} />
                );
              })}
              <style>{`
                @keyframes fallAndSpin {
                  0% { top: -20px; transform: translateX(0) rotate(0deg); opacity: 1; }
                  100% { top: 105%; transform: translateX(${Math.random() * 100 - 50}px) rotate(${Math.random() * 720}deg); opacity: 0; }
                }
              `}</style>
            </div>
          )}

          <div className="glass-card" style={{
            width: '90%', maxWidth: '500px',
            padding: '48px 40px',
            borderRadius: '40px',
            background: 'var(--surface)',
            border: '2.5px solid var(--primary)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.15), 0 0 30px rgba(15, 157, 138, 0.25)',
            textAlign: 'center',
            position: 'relative',
            animation: 'slideUpFade 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <div style={{
              width: '80px', height: '80px',
              background: 'var(--primary-light)',
              borderRadius: '26px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--primary)',
              margin: '0 auto 24px',
              boxShadow: '0 10px 24px rgba(15, 157, 138, 0.15)'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: '40px' }}>face_5</span>
            </div>

            <h2 style={{ fontSize: '1.8rem', fontWeight: 950, color: 'var(--ink)', margin: '0 0 12px 0', letterSpacing: '-1px' }}>
              Chào mừng Sen ghé thăm! 🐾
            </h2>
            <p style={{ fontSize: '0.98rem', color: 'var(--gray-500)', fontWeight: 650, margin: '0 0 32px 0', lineHeight: 1.6 }}>
              Sen cho Rexi biết năm sinh của Sen nha! Rexi muốn chọn đúng phong cách trò chuyện phù hợp dới Sen nhất đó meow~ 🐱
            </p>

            <form onSubmit={handleSaveAge} style={{ display: 'grid', gap: '24px' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  placeholder="Nhập năm sinh của bạn (Ví dụ: 1999)"
                  value={inputNamSinh}
                  onChange={(e) => {
                    setInputNamSinh(e.target.value);
                    setAgeError("");
                  }}
                  disabled={savingAge}
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    borderRadius: '20px',
                    border: '2px solid var(--gray-200)',
                    background: 'var(--background)',
                    color: 'var(--ink)',
                    fontSize: '1rem',
                    fontWeight: 800,
                    outline: 'none',
                    textAlign: 'center',
                    transition: 'all 0.3s'
                  }}
                  className="yob-input-neon"
                />
                <style>{`
                  .yob-input-neon:focus {
                    border-color: var(--primary) !important;
                    box-shadow: 0 0 15px rgba(15, 157, 138, 0.25) !important;
                  }
                  /* Ẩn nút tăng giảm của input number */
                  input::-webkit-outer-spin-button,
                  input::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                  }
                  input[type=number] {
                    -moz-appearance: textfield;
                  }
                `}</style>
              </div>

              {/* DỰ ĐOÁN PHONG CÁCH CHAT DỘNG THỜI GIAN THỰC */}
              {inputNamSinh && !isNaN(Number(inputNamSinh)) && Number(inputNamSinh) >= 1900 && Number(inputNamSinh) <= new Date().getFullYear() && (
                <div className="animate-fade-in" style={{
                  padding: '16px 20px',
                  borderRadius: '20px',
                  background: Number(inputNamSinh) >= 1997 ? 'rgba(20, 184, 166, 0.08)' : 'rgba(245, 158, 11, 0.06)',
                  border: `1.5px dashed ${Number(inputNamSinh) >= 1997 ? 'var(--primary)' : '#f59e0b'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  animation: 'slideUpFade 0.3s ease-out'
                }}>
                  <span className="material-symbols-outlined" style={{ color: Number(inputNamSinh) >= 1997 ? 'var(--primary)' : '#f59e0b' }}>
                    {Number(inputNamSinh) >= 1997 ? 'celebration' : 'workspace_premium'}
                  </span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 900, color: Number(inputNamSinh) >= 1997 ? 'var(--primary)' : '#f59e0b' }}>
                    {Number(inputNamSinh) >= 1997 ? "PHONG CÁCH: Gen Z vui tươi nhí nhố 🐱🎉" : "PHONG CÁCH: Trưởng thành chu đáo chuẩn mực 🩺✨"}
                  </span>
                </div>
              )}

              {ageError && (
                <div style={{ color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 800, textAlign: 'center', animation: 'shake 0.3s ease' }}>
                  {ageError}
                </div>
              )}

              <button
                type="submit"
                disabled={savingAge || !inputNamSinh}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '50px',
                  fontSize: '1rem',
                  fontWeight: 900,
                  boxShadow: '0 10px 20px var(--primary-shadow)',
                  opacity: (!inputNamSinh || savingAge) ? 0.6 : 1,
                  cursor: (!inputNamSinh || savingAge) ? 'not-allowed' : 'pointer'
                }}
              >
                {savingAge ? "Đang chuẩn bị lộ trình..." : "Bắt đầu hành trình cùng Rexi 🐾"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(DashboardKhachHang);
