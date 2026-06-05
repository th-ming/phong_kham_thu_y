
import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "@services/axios";
import { AnimatedNumber, Modal, Skeleton } from "@components/CommonUI";
import BirthYearSelect from "@components/BirthYearSelect";
import { decodeHtmlEntities, getUserProfile } from "@utils/index";
import { customerToneCopy, isGenZBirthYear } from "@utils/customerTone";
import { useAutoRefresh } from "@hooks/useAutoRefresh";
import { toast } from "@components/Toast";
import { useLiveUserProfile } from "@hooks/useLiveUserProfile";

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
const layBieuTuongThuCung = (loai?: string) => {
  const normalized = (loai || "").toLowerCase();
  if (normalized.includes("mèo") || normalized.includes("meo") || normalized.includes("cat")) return "🐱";
  if (normalized.includes("chó") || normalized.includes("cho") || normalized.includes("dog")) return "🐶";
  if (normalized.includes("hamster") || normalized.includes("chuột") || normalized.includes("chuot") || normalized.includes("mouse")) return "🐹";
  if (normalized.includes("thỏ") || normalized.includes("tho") || normalized.includes("rabbit")) return "🐰";
  if (normalized.includes("chim") || normalized.includes("bird")) return "🐦";
  return "🐾";
};
const hasValidBirthYear = (value: any) => {
  if (value === undefined || value === null || value === "") return false;
  const year = Number(value);
  const currentYear = new Date().getFullYear();
  return Number.isInteger(year) && year >= 1900 && year <= currentYear;
};

const DashboardKhachHang: React.FC = () => {
  const navigate = useNavigate();
  const liveUser = useLiveUserProfile();
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
  // CustomerLayout là nơi chặn onboarding năm sinh để tránh hai modal đè nhau trên dashboard.
  const [showAgeModal, setShowAgeModal] = useState(false);
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
      setAgeError("Không thể cập nhật năm sinh lúc này. Bạn vui lòng thử lại sau nhé! 🐾");
    } finally {
      setSavingAge(false);
    }
  };

  const randomTip = useMemo(() => PET_CARE_TIPS[Math.floor(Math.random() * PET_CARE_TIPS.length)], []);

  const user = liveUser || getUserProfile();
  const userName = user?.display_name || user?.displayName || user?.ho_ten || user?.hoTen || user?.fullName || user?.ten_khach_hang || user?.ten_dang_nhap || user?.username || "Khách hàng";
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
  const isGenZ = useMemo(() => isGenZBirthYear(user?.nam_sinh), [user]);
  const toneCopy = customerToneCopy[isGenZ ? "genz" : "mature"];

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

  React.useEffect(() => {
    const handleRealtimeUpdate = (event: Event) => {
      const payload = (event as CustomEvent).detail || {};
      const currentCustomerId = user?.id_khach_hang || user?.id_tai_khoan || user?.id;
      if (!payload.id_khach_hang || payload.id_khach_hang === currentCustomerId) {
        fetchDashboardData();
      }
    };
    window.addEventListener('rexi-appointments-changed', handleRealtimeUpdate);
    return () => window.removeEventListener('rexi-appointments-changed', handleRealtimeUpdate);
  }, [fetchDashboardData, user]);

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

  if (loading) {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        {/* Khung xương Header */}
        <div style={{ padding: '48px', borderRadius: 'var(--radius-xl)', background: 'var(--secondary-gradient)', color: 'white', opacity: 0.15, display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Skeleton width="88px" height="88px" borderRadius="50%" />
          <div style={{ flex: 1 }}>
            <Skeleton width="400px" height="40px" borderRadius="12px" style={{ marginBottom: '12px' }} />
            <Skeleton width="600px" height="20px" borderRadius="8px" />
          </div>
        </div>

        {/* Khung xương KPIs (4 cột) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '32px' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card" style={{ padding: '32px', borderRadius: '32px', border: '1px solid var(--gray-100)', minHeight: '190px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Skeleton width="60px" height="60px" borderRadius="20px" />
                <Skeleton width="80px" height="28px" borderRadius="50px" />
              </div>
              <div>
                <Skeleton width="100px" height="16px" borderRadius="6px" style={{ marginBottom: '8px' }} />
                <Skeleton width="180px" height="32px" borderRadius="8px" />
              </div>
            </div>
          ))}
        </div>

        {/* Khung xương Grid dưới */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
          {/* Cột trái: Lịch hẹn sắp tới */}
          <div className="glass-card" style={{ padding: '32px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--gray-100)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <Skeleton width="200px" height="24px" borderRadius="8px" />
              <Skeleton width="120px" height="36px" borderRadius="50px" />
            </div>
            <div style={{ display: 'grid', gap: '16px' }}>
              {[1, 2].map((i) => (
                <div key={i} style={{ padding: '20px', borderRadius: '20px', border: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Skeleton width="48px" height="48px" borderRadius="12px" />
                    <div>
                      <Skeleton width="150px" height="18px" borderRadius="6px" style={{ marginBottom: '6px' }} />
                      <Skeleton width="100px" height="14px" borderRadius="4px" />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                    <Skeleton width="80px" height="16px" borderRadius="4px" />
                    <Skeleton width="50px" height="14px" borderRadius="4px" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cột phải: Mẹo & Hỗ trợ */}
          <div style={{ display: 'grid', gap: '32px' }}>
            <div className="glass-card" style={{ padding: '48px', borderRadius: '40px', background: 'var(--primary-light)', border: '1px solid var(--primary-light)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '220px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Skeleton width="32px" height="32px" borderRadius="50%" />
                <Skeleton width="150px" height="24px" borderRadius="6px" />
              </div>
              <Skeleton width="100%" height="60px" borderRadius="12px" />
              <Skeleton width="100%" height="48px" borderRadius="50px" />
            </div>

            <div className="glass-card" style={{ padding: '32px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--gray-100)', display: 'flex', alignItems: 'center', gap: '20px' }}>
              <Skeleton width="56px" height="56px" borderRadius="16px" />
              <div>
                <Skeleton width="120px" height="20px" borderRadius="6px" style={{ marginBottom: '6px' }} />
                <Skeleton width="220px" height="16px" borderRadius="4px" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in customer-dashboard-page">
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

        .kpi-card {
          position: relative;
          overflow: visible;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
        }
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
          opacity: 0;
          pointer-events: none;
          transform: translateY(-8px);
          z-index: 4;
          background: var(--surface);
          border: 1px solid var(--gray-200);
          box-shadow: var(--shadow-lg);
          transition: all 0.3s ease;
        }
        [data-theme='dark'] .kpi-trend-popover {
          background: rgba(15, 23, 42, 0.96);
          border-color: rgba(148, 163, 184, 0.24);
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.38);
        }
        .kpi-trend-badge:hover + .kpi-trend-popover,
        .kpi-trend-badge:focus + .kpi-trend-popover,
        .kpi-trend-popover:hover {
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

        /* Hiệu ứng hover cao cấp cho thẻ Cẩm nang chăm sóc */
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
          /* Hiệu ứng phát sáng (glow) kết hợp bóng đổ mượt mà */
          box-shadow: 0 15px 30px rgba(15, 157, 138, 0.2), 0 0 12px rgba(15, 157, 138, 0.15);
          /* Tăng độ sáng khi di chuột để làm nổi bật thẻ */
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

        @media (max-width: 768px) {
          .customer-dashboard-page {
            display: grid;
            gap: 22px;
            padding-bottom: 92px;
          }

          .customer-dashboard-hero {
            margin-bottom: 0 !important;
            padding: 22px !important;
            border-radius: 28px !important;
          }

          .customer-dashboard-hero::after {
            content: "";
            position: absolute;
            inset: auto 18px 18px 18px;
            height: 4px;
            border-radius: 999px;
            background: rgba(255,255,255,0.28);
          }

          .customer-dashboard-hero-content {
            align-items: flex-start !important;
            gap: 14px !important;
          }

          .customer-dashboard-avatar {
            width: 58px !important;
            height: 58px !important;
          }

          .customer-dashboard-avatar > div {
            width: 50px !important;
            height: 50px !important;
            font-size: 1.25rem !important;
          }

          .customer-dashboard-hero .header-title {
            font-size: 1.72rem !important;
            line-height: 1.08 !important;
            letter-spacing: 0 !important;
          }

          .customer-dashboard-hero p {
            font-size: 0.9rem !important;
            line-height: 1.5 !important;
          }

          .customer-dashboard-updated {
            max-width: 100%;
            font-size: 0.72rem !important;
            white-space: normal;
            align-items: flex-start !important;
          }

          .customer-kpi-grid {
            display: flex !important;
            gap: 12px !important;
            overflow-x: auto;
            padding: 2px 2px 10px !important;
            margin-bottom: 0 !important;
            scroll-snap-type: x mandatory;
            scrollbar-width: none;
          }

          .customer-kpi-grid::-webkit-scrollbar {
            display: none;
          }

          .customer-kpi-grid .kpi-card {
            min-width: 188px !important;
            min-height: 176px !important;
            padding: 16px !important;
            border-radius: 22px !important;
            scroll-snap-align: start;
            justify-content: flex-start !important;
            gap: 8px;
            overflow: hidden !important;
          }

          .customer-kpi-grid .kpi-card h3 {
            font-size: 1.36rem !important;
            line-height: 1.15 !important;
            word-break: break-word;
            margin-top: 0 !important;
          }

          .customer-kpi-grid .kpi-card p {
            font-size: 0.68rem !important;
            margin: 0 !important;
          }

          .customer-kpi-grid .kpi-card > div:nth-of-type(2) {
            order: 1;
            margin: 2px 0 10px !important;
          }

          .customer-kpi-grid .kpi-card > div:nth-of-type(2) > div {
            width: 44px !important;
            height: 44px !important;
            border-radius: 15px !important;
          }

          .customer-kpi-grid .kpi-card > div:nth-of-type(2) span {
            font-size: 22px !important;
          }

          .customer-kpi-grid .kpi-trend-badge {
            top: 12px !important;
            right: 12px !important;
            max-width: calc(100% - 74px);
            padding: 6px 8px !important;
            font-size: 0.64rem !important;
            line-height: 1;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .customer-kpi-grid .kpi-trend-badge .material-symbols-outlined {
            width: 14px;
            min-width: 14px;
            overflow: hidden;
            font-size: 14px !important;
            line-height: 1;
          }

          .customer-kpi-grid .kpi-trend-popover {
            order: 4;
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin-top: 2px;
            border: 0 !important;
            background: transparent !important;
            box-shadow: none !important;
            opacity: 1 !important;
            transform: none !important;
            pointer-events: none !important;
          }

          .customer-kpi-grid .kpi-popover-title {
            display: none;
          }

          .customer-kpi-grid .kpi-popover-value {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            color: var(--gray-500);
            font-size: 0.72rem;
            font-weight: 750;
            line-height: 1.35;
          }

          .customer-kpi-grid .kpi-card > p {
            order: 2;
          }

          .customer-kpi-grid .kpi-card > h3 {
            order: 3;
          }

          .customer-pets-section {
            margin-bottom: 0 !important;
            padding: 18px 0 2px;
            border-top: 1px solid var(--gray-150);
            border-bottom: 1px solid var(--gray-150);
          }

          .customer-pets-section > h3 {
            font-size: 1rem !important;
            margin-bottom: 12px !important;
          }

          .pet-instagram-slider {
            gap: 12px !important;
            padding: 4px 2px 16px !important;
          }

          .pet-insta-card {
            min-width: 132px !important;
            width: 132px !important;
            padding: 14px 12px !important;
            border-radius: 20px !important;
          }

          .customer-dashboard-lower-grid {
            grid-template-columns: 1fr !important;
            gap: 18px !important;
          }

          .customer-appointments-panel {
            padding: 20px !important;
            border-radius: 24px !important;
            margin-inline: -2px;
          }

          .customer-appointments-header {
            align-items: flex-start !important;
            gap: 12px !important;
            margin-bottom: 18px !important;
          }

          .customer-appointments-header .btn {
            padding: 8px 12px !important;
            white-space: nowrap;
          }

          .appointment-card {
            display: grid !important;
            grid-template-columns: 1fr auto;
            gap: 12px !important;
            align-items: start !important;
            padding: 16px !important;
            border-radius: 18px !important;
          }

          .appointment-card:hover,
          .appointment-card:active {
            transform: translateY(-3px) !important;
          }

          .customer-side-stack {
            gap: 16px !important;
          }

          .customer-quick-card {
            padding: 18px !important;
            border-radius: 24px !important;
          }

          .customer-quick-grid {
            display: flex !important;
            overflow-x: auto;
            gap: 10px !important;
            padding-bottom: 8px;
            scrollbar-width: none;
          }

          .customer-quick-grid::-webkit-scrollbar {
            display: none;
          }

          .customer-quick-action {
            min-width: 116px;
            padding: 14px 10px !important;
            border-radius: 18px !important;
          }

          .customer-care-tip {
            padding: 22px !important;
            border-radius: 26px !important;
          }

          .customer-care-tip p {
            min-height: auto !important;
            font-size: 0.92rem !important;
          }

          .customer-support-card {
            padding: 16px !important;
            border-radius: 22px !important;
            align-items: flex-start !important;
          }
        }
        
        .customer-dashboard-hero {
          --hero-bg-start: #0d9488;
          --hero-bg-mid: #0f766e;
          --hero-bg-end: #10b981;
          --hero-shadow-color: rgba(13, 148, 136, 0.2);
          --hero-glow: rgba(255, 255, 255, 0.15);
        }
        
        [data-theme='dark'] .customer-dashboard-hero {
          --hero-bg-start: #064e3b;
          --hero-bg-mid: #022c22;
          --hero-bg-end: #0f172a;
          --hero-shadow-color: rgba(6, 78, 59, 0.35);
          --hero-glow: rgba(16, 185, 129, 0.1);
        }
      `}</style>
      <div className="stagger-1 customer-dashboard-hero" style={{ marginBottom: '40px', padding: '48px', borderRadius: 'var(--radius-xl)', background: 'linear-gradient(135deg, var(--hero-bg-start) 0%, var(--hero-bg-mid) 50%, var(--hero-bg-end) 100%)', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 15px 35px var(--hero-shadow-color)' }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '300px', height: '300px', background: 'radial-gradient(circle, var(--hero-glow) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', bottom: '-20%', left: '0%', width: '250px', height: '250px', background: 'radial-gradient(circle, var(--hero-glow) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none', opacity: 0.5 }}></div>
        <div className="customer-dashboard-hero-content" style={{ display: 'flex', alignItems: 'center', gap: '24px', position: 'relative', zIndex: 1 }}>
          <div className="customer-dashboard-avatar" style={{ width: '88px', height: '88px', borderRadius: '50%', background: 'var(--primary-gradient)', display: 'grid', placeItems: 'center', boxShadow: '0 14px 32px rgba(0,0,0,0.18), 0 0 22px var(--primary-shadow)', flexShrink: 0 }}>
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
              {toneCopy.dashboardTitle(userName)}
            </h1>
            <p style={{ fontWeight: 700, color: 'rgba(255,255,255,0.95)', margin: 0, fontSize: '1.2rem', textShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
              {toneCopy.dashboardSubtitle}
            </p>
            {lastUpdated && (
              <div className="customer-dashboard-updated" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 800, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', padding: '6px 14px', borderRadius: '999px', marginTop: '14px', border: '1px solid rgba(255,255,255,0.2)', position: 'relative', zIndex: 1, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#5eead4', animation: 'spin 3s infinite linear' }}>sync</span>
                <span>Dữ liệu thời gian thực cập nhật lúc: {lastUpdated}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="customer-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '32px', marginBottom: '40px' }}>
        {stats.map((item, i) => (
          <div key={i} className="glass-card hover-lift kpi-card" style={{ padding: '32px', borderRadius: '32px', border: `1px solid ${item.color}25`, background: `linear-gradient(135deg, ${item.color}15 0%, var(--surface) 100%)`, minHeight: '190px' }}>
            {item.trendData && (
              <button
                data-ai-id={`button-dashboardkhachhang-kpi-trend-${i}`}
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
              <div style={{ background: `${item.color}22`, color: item.color, width: '60px', height: '60px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 20px ${item.color}15` }}>
                <span className="material-symbols-outlined" style={{ fontSize: '30px' }}>{item.icon}</span>
              </div>
            </div>
            <p style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--gray-500)', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>{item.label}</p>
            <h3 style={{ fontSize: '2rem', fontWeight: 950, color: item.color, margin: 0, textShadow: `0 2px 10px ${item.color}10` }}>
              <AnimatedNumber value={item.value} />
            </h3>
          </div>
        ))}
      </div>

      {/* 📸 BỘ SƯU TẬP THẺ THÚ CƯNG ĐẸP NHƯ INSTAGRAM WADHAH ALOUI STYLE */}
      <div className="stagger-2 customer-pets-section" style={{ marginBottom: '40px' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 950, color: 'var(--ink)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '-0.5px' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>photo_library</span>
          {toneCopy.petSectionTitle} ({pets.length})
        </h3>
        {pets.length === 0 ? (
          <div style={{ padding: '32px', background: 'var(--gray-50)', borderRadius: '24px', border: '1px dashed var(--gray-200)', textAlign: 'center' }}>
            <span style={{ fontSize: '2.5rem' }}>🐾</span>
            <p style={{ fontWeight: 800, color: 'var(--gray-400)', marginTop: '8px' }}>Chưa có bé cưng nào trong hồ sơ.</p>
            <Link to="/khach-hang/quan-ly-thu-cung" className="btn btn-primary btn-pill" style={{ marginTop: '12px' }}>+ Thêm bé ngay</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '20px', overflowX: 'auto', padding: '10px 4px 20px 4px', scrollbarWidth: 'none', msOverflowStyle: 'none' }} className="pet-instagram-slider">
            <style>{`
              .pet-instagram-slider::-webkit-scrollbar { display: none; }
              .pet-insta-card {
                min-width: 160px;
                width: 160px;
                background: rgba(255, 255, 255, 0.45) !important;
                backdrop-filter: blur(16px);
                -webkit-backdrop-filter: blur(16px);
                border-radius: 28px;
                border: 1px solid rgba(255, 255, 255, 0.5) !important;
                padding: 20px 16px;
                text-align: center;
                transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
                box-shadow: 0 10px 25px rgba(0,0,0,0.02);
                cursor: pointer;
              }
              [data-theme='dark'] .pet-insta-card {
                background: rgba(30, 41, 59, 0.4) !important;
                border-color: rgba(255, 255, 255, 0.08) !important;
              }
              .pet-insta-card:hover {
                transform: translateY(-8px) scale(1.04) rotate(1deg);
                border-color: var(--primary) !important;
                box-shadow: 0 15px 30px rgba(15, 157, 138, 0.2);
              }
            `}</style>
            {pets.map(p => {
              const avatarChar = layBieuTuongThuCung(p.loai);
              return (
                <div key={p.id_thu_cung} className="pet-insta-card" onClick={() => navigate('/khach-hang/quan-ly-thu-cung')}>
                  <div style={{ 
                    width: '80px', 
                    height: '80px', 
                    borderRadius: '50%', 
                    background: 'var(--primary-light)', 
                    margin: '0 auto 12px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    fontSize: p.hinh_anh ? 'unset' : '2.5rem', 
                    boxShadow: '0 8px 20px rgba(34, 211, 238, 0.15)',
                    overflow: 'hidden',
                    border: '2px solid var(--gray-100)'
                  }}>
                    {p.hinh_anh ? (
                      <img
                        src={p.hinh_anh}
                        alt={p.ten_thu_cung}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                          if (fallback) fallback.style.display = 'inline';
                        }}
                      />
                    ) : (
                      null
                    )}
                    <span style={{ display: p.hinh_anh ? 'none' : 'inline' }}>{avatarChar}</span>
                  </div>
                  <div style={{ fontWeight: 900, color: 'var(--ink)', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.ten_thu_cung}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 800, marginTop: '4px' }}>{p.giong || p.loai}</div>
                </div>
              );
            })}
            {/* Thẻ thêm bé nhanh */}
            <div className="pet-insta-card" onClick={() => navigate('/khach-hang/quan-ly-thu-cung')} style={{ borderStyle: 'dashed', borderColor: 'var(--primary)', background: 'rgba(34, 211, 238, 0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '166px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'var(--primary)', marginBottom: '8px' }}>add_circle</span>
              <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.85rem' }}>Thêm bé mới</span>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }} className="stagger-3 customer-dashboard-lower-grid">
        <div className="glass-card hover-lift customer-appointments-panel" style={{ padding: '32px', borderRadius: 'var(--radius-xl)' }}>
          <div className="customer-appointments-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 950, color: 'var(--ink)', letterSpacing: '-0.5px', margin: 0 }}>Lịch hẹn sắp tới</h3>
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
              {upcoming.slice(0, 3).map((app, i) => (
                <div key={i} className="appointment-card" style={{ background: 'var(--surface)', padding: '20px', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', background: 'var(--background)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', boxShadow: 'var(--shadow-sm)' }}>
                      <span className="material-symbols-outlined">calendar_today</span>
                    </div>
                    <div>
                      <p style={{ fontWeight: 850, color: 'var(--ink)', margin: 0 }}>{decodeHtmlEntities(app.ly_do || app.lyDo || 'Khám tổng quát')}</p>
                      <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 700, margin: '2px 0 0 0' }}>Dành cho: <b style={{ color: 'var(--primary)' }}>{pets.find(p => p.id_thu_cung === app.id_thu_cung)?.ten_thu_cung || 'Thú cưng'}</b></p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                    <p style={{ fontWeight: 900, color: 'var(--ink)', margin: 0 }}>{app.ngay_kham?.split('T')[0].split('-').reverse().join('/') || "---"}</p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 900, margin: 0 }}>{app.gio_kham?.substring(0, 5)}</p>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: app.trang_thai === 'DANG_KHAM' ? 'rgba(20, 184, 166, 0.12)' : 'rgba(59, 130, 246, 0.1)', padding: '4px 10px', borderRadius: '50px', marginTop: '4px' }}>
                      {app.trang_thai === 'DANG_KHAM' && (
                        <span className="pulse-dot" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                      )}
                      <span style={{ fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', color: app.trang_thai === 'DANG_KHAM' ? '#14b8a6' : '#3b82f6' }}>
                        {app.trang_thai === 'DANG_KHAM' ? 'Đang khám' : app.trang_thai === 'DA_XAC_NHAN' ? 'Đã xác nhận' : 'Chờ xác nhận'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="customer-side-stack" style={{ display: 'grid', gap: '32px' }}>
          {/* BẢNG PHÍM TẮT TIỆN ÍCH NHANH */}
          <div className="glass-card hover-lift customer-quick-card" style={{ padding: '32px', borderRadius: '32px', border: '1px solid var(--gray-100)' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 950, color: 'var(--ink)', marginBottom: '20px', letterSpacing: '-0.5px' }}>Thao tác nhanh</h3>
            <div className="customer-quick-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {[
                { label: 'Đặt lịch hẹn', icon: 'calendar_month', path: '/khach-hang/dat-lich-hen', color: 'var(--primary)' },
                { label: 'Hồ sơ bệnh án', icon: 'folder_shared', path: '/khach-hang/ho-so-benh-an', color: '#3b82f6' },
                { label: 'Bé cưng của tôi', icon: 'pets', path: '/khach-hang/quan-ly-thu-cung', color: '#f59e0b' },
                { label: 'Lịch sử hóa đơn', icon: 'receipt_long', path: '/khach-hang/hoa-don-thanh-toan', color: '#14b8a6' }
              ].map((action, idx) => (
                <div
                  key={idx}
                  onClick={() => navigate(action.path)}
                  className="hover-scale customer-quick-action"
                  style={{
                    padding: '16px 12px',
                    borderRadius: '20px',
                    background: 'var(--surface)',
                    border: '1px solid var(--gray-150)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    textAlign: 'center',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                >
                  <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: `${action.color}12`, color: action.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>{action.icon}</span>
                  </div>
                  <span style={{ fontWeight: 850, color: 'var(--ink)', fontSize: '0.8rem' }}>{action.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card hover-lift customer-care-tip" style={{ padding: '40px 32px', borderRadius: '40px', background: 'var(--primary-gradient)', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 40px var(--primary-shadow)', border: 'none' }}>
            <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>lightbulb</span>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 950, margin: 0, letterSpacing: '-0.5px' }}>Mẹo chăm sóc</h3>
            </div>
            <p style={{ opacity: 0.95, fontSize: '1.05rem', lineHeight: '1.7', fontWeight: 600, minHeight: '80px', margin: 0 }}>{randomTip.content}</p>
            <button data-ai-id="button-dashboardkhachhang-tppw" className="btn btn-pill" onClick={() => setIsTipsModalOpen(true)} style={{ background: 'rgba(255,255,255,0.15)', color: 'white', marginTop: '24px', width: '100%', border: '1.5px solid rgba(255,255,255,0.3)', fontWeight: 800, backdropFilter: 'blur(10px)' }}>Xem tất cả mẹo</button>
          </div>

          <a href="tel:***REMOVED***-VIETQR_ACCOUNT_NO" className="glass-card hover-lift customer-support-card" style={{ padding: '24px 32px', borderRadius: 'var(--radius-xl)', display: 'flex', alignItems: 'center', gap: '20px', textDecoration: 'none', cursor: 'pointer' }}>
            <div style={{ width: '56px', height: '56px', background: 'var(--primary-light)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>support_agent</span>
            </div>
            <div>
              <h4 style={{ margin: 0, fontWeight: 900, color: 'var(--ink)' }}>Hỗ trợ 24/7</h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--gray-500)', fontWeight: 700 }}>Cần tư vấn khẩn cấp? Gọi <b style={{ color: 'var(--primary)' }}>0353.374.156</b></p>
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
            width: '90%', maxWidth: '760px',
            padding: '42px 36px',
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
              Chào mừng bạn ghé thăm! 🐾
            </h2>
            <p style={{ fontSize: '0.98rem', color: 'var(--gray-500)', fontWeight: 650, margin: '0 0 32px 0', lineHeight: 1.6 }}>
              Cho Rexi biết năm sinh để hệ thống chọn phong cách trò chuyện phù hợp với từng khách hàng.
            </p>

            <form onSubmit={handleSaveAge} style={{ display: 'grid', gap: '24px', marginTop: '24px' }}>
              <div style={{ position: 'relative' }}>
                <BirthYearSelect
                  data-ai-id="select-dashboardkhachhang-namsinh"
                  placeholder="Chọn năm sinh"
                  value={inputNamSinh}
                  onChange={(value) => {
                    setInputNamSinh(value);
                    setAgeError("");
                  }}
                  disabled={savingAge}
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    borderRadius: '20px',
                    border: '2px solid var(--gray-200)',
                    backgroundColor: 'var(--background)',
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

              {/* GỢI Ý TRẢI NGHIỆM THEO NĂM SINH */}
              {inputNamSinh && !isNaN(Number(inputNamSinh)) && Number(inputNamSinh) >= 1900 && Number(inputNamSinh) <= new Date().getFullYear() && (
                <div className="animate-fade-in" style={{
                  padding: '16px 20px',
                  borderRadius: '20px',
                  background: 'rgba(20, 184, 166, 0.08)',
                  border: '1.5px dashed var(--primary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  animation: 'slideUpFade 0.3s ease-out'
                }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>
                    tune
                  </span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 900, color: 'var(--primary)' }}>
                    Rexi sẽ cá nhân hóa cách hỗ trợ theo thông tin của bạn.
                  </span>
                </div>
              )}

              {ageError && (
                <div style={{ color: 'var(--danger)', fontSize: '0.85rem', fontWeight: 800, textAlign: 'center', animation: 'shake 0.3s ease' }}>
                  {ageError}
                </div>
              )}

              <button
                data-ai-id="button-dashboardkhachhang-save-namsinh"
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
