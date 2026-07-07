import React, { useState, useEffect, useMemo } from "react";
import axiosInstance from "@services/axios";
import { toast } from "@components/Toast";
import { toastError } from '@utils/toastHelpers';
import { Modal } from "@components/CommonUI";
import { useAutoRefresh } from "@hooks/useAutoRefresh";
import useVirtualScroll from "@hooks/useVirtualScroll";
import KpiIcon from "@components/KpiIcon";
import { getUserProfile, normalizeUserRole } from "@utils/index";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

// Đăng ký các thành phần Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

const formatChartTick = (value: number) => {
  if (value === 0) return '0';
  if (value >= 1000000) {
    const val = value / 1000000;
    return `${val % 1 === 0 ? val : val.toFixed(1)} Tr`;
  }
  if (value >= 1000) {
    const val = value / 1000;
    return `${val % 1 === 0 ? val : val.toFixed(1)}k`;
  }
  return value.toString();
};

const BaoCaoThongKe: React.FC = () => {
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [doctorStats, setDoctorStats] = useState<any[]>([]);
  const [dailyRevenueData, setDailyRevenueData] = useState<any[]>([]);
  const [petStats, setPetStats] = useState<any[]>([]);
  const [serviceStats, setServiceStats] = useState<any[]>([]);
  const [financeSummary, setFinanceSummary] = useState<any>(null);
  const [allDoctors, setAllDoctors] = useState<any[]>([]);
  const [allServices, setAllServices] = useState<any[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKpi, setSelectedKpi] = useState<"revenue" | "cases" | "doctor" | "service" | null>(null);

  // State quản lý Modal danh sách thú cưng
  const [selectedPetType, setSelectedPetType] = useState<string | null>(null);
  const [petDetails, setPetDetails] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const { visibleItems: visiblePetDetails, containerRef: petContainerRef, onScrollHandler: onPetScroll, visibleRange: petRange, shouldVirtualize: shouldVirtualizePet } = useVirtualScroll({
    items: petDetails,
    itemHeight: 90,
    containerHeight: 500,
    visibleCount: 6
  });

  const currentRole = useMemo(() => normalizeUserRole(getUserProfile() || {}), []);
  const canReadMedicalRecords = currentRole !== "ke_toan";

  const fetchData = async () => {
      try {
        const medicalRecordsRequest = canReadMedicalRecords
          ? axiosInstance.get("/api/ho-so-benh-an", { params: { page: 0, size: 999 } })
          : Promise.resolve({ data: [] });

        const [
          revRes,
          docRes,
          dailyRevRes,
          petStatsRes,
          serviceStatsRes,
          financeSummaryRes,
          doctorsRes,
          servicesRes,
          recordsRes
        ] = await Promise.allSettled([
          axiosInstance.get("/api/bao-cao/doanh-thu-thang"),
          axiosInstance.get("/api/bao-cao/thong-ke-bac-si"),
          axiosInstance.get("/api/bao-cao/doanh-thu-ngay"),
          axiosInstance.get("/api/bao-cao/thong-ke-thu-cung"),
          axiosInstance.get("/api/bao-cao/doanh-thu-dich-vu"),
          axiosInstance.get("/api/bao-cao/tong-quan-tai-chinh"),
          axiosInstance.get("/api/bac-si"),
          axiosInstance.get("/api/dich-vu"),
          medicalRecordsRequest
        ]);

        const extractArray = (data: any): any[] => {
          if (!data) return [];
          if (Array.isArray(data)) return data;
          const possibleArrays = [data.value, data.data, data.content, data.result, data.items, data.records];
          for (const arr of possibleArrays) {
            if (Array.isArray(arr)) return arr;
            if (arr && typeof arr === 'object' && Array.isArray(arr.content)) return arr.content;
            if (arr && typeof arr === 'object' && Array.isArray(arr.data)) return arr.data;
          }
          return [];
        };

        const valueOf = (res: PromiseSettledResult<any>) => res.status === "fulfilled" ? res.value.data : null;

        setRevenueData(extractArray(valueOf(revRes)).slice(0, 12).reverse());
        setDoctorStats(extractArray(valueOf(docRes)));
        setDailyRevenueData(extractArray(valueOf(dailyRevRes)));
        setPetStats(extractArray(valueOf(petStatsRes)));
        setServiceStats(extractArray(valueOf(serviceStatsRes)));
        setFinanceSummary(valueOf(financeSummaryRes) || null);
        setAllDoctors(extractArray(valueOf(doctorsRes)));
        setAllServices(extractArray(valueOf(servicesRes)));
        setMedicalRecords(extractArray(valueOf(recordsRes)));
      } catch (err) {
        console.error("Lỗi lấy dữ liệu báo cáo:", err);
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useAutoRefresh(fetchData, { runImmediately: false });

  const totalRevenue = useMemo(() => {
    const directTotal = financeSummary?.TongDoanhThu ?? financeSummary?.tongDoanhThu ?? financeSummary?.tongdoanhthu ?? financeSummary?.tong_doanh_thu;
    if (directTotal !== undefined && directTotal !== null) return Number(directTotal) || 0;
    return revenueData.reduce((sum, d) => sum + (d.TongDoanhThu || d.tongdoanhthu || d.doanhthu || d.doanh_thu || d.tong_doanh_thu || 0), 0);
  }, [financeSummary, revenueData]);
  const totalApps = useMemo(() => doctorStats.reduce((sum, d) => sum + (d.SoHoSo || d.sohoso || d.so_ho_so || 0), 0), [doctorStats]);
  const getDoctorCases = (d: any) => d?.SoHoSo || d?.sohoso || d?.so_ho_so || 0;

  const formatMoney = (value: number) => `${Number(value || 0).toLocaleString('vi-VN')} đ`;
  const getRevenueValue = (item: any) => Number(item?.TongDoanhThu || item?.tongdoanhthu || item?.doanhthu || item?.doanh_thu || item?.tong_doanh_thu || 0);
  const getRecordDate = (item: any) => {
    const raw = item?.ngay_kham || item?.NgayKham || item?.ngay_tao || item?.NgayTao;
    if (!raw) return "";
    return new Date(raw).toISOString().slice(0, 10);
  };
  const getDoctorName = (item: any) => item?.TenBacSi || item?.tenbacsi || item?.ten_bac_si || item?.ho_ten || item?.HoTen || "";
  const getServiceName = (item: any) => item?.TenDichVu || item?.tendichvu || item?.ten_dich_vu || "";
  const normalizeText = (value: any) => String(value || "").trim().toLowerCase();

  const latestRevenueCompare = useMemo(() => {
    const list = [...dailyRevenueData]
      .sort((a, b) => new Date(a.Ngay || a.ngay).getTime() - new Date(b.Ngay || b.ngay).getTime());
    const current = getRevenueValue(list[list.length - 1]);
    const previous = getRevenueValue(list[list.length - 2]);
    const diff = current - previous;
    const percent = previous > 0 ? (diff / previous) * 100 : current > 0 ? null : 0;
    return { current, previous, diff, percent };
  }, [dailyRevenueData]);

  const caseCompare = useMemo(() => {
    const counts = medicalRecords.reduce<Record<string, number>>((acc, item) => {
      const date = getRecordDate(item);
      if (date) acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {});
    const dates = Object.keys(counts).sort();
    const current = dates.length ? counts[dates[dates.length - 1]] : totalApps;
    const previous = dates.length > 1 ? counts[dates[dates.length - 2]] : 0;
    const diff = current - previous;
    const percent = previous > 0 ? (diff / previous) * 100 : current > 0 ? null : 0;
    return { current, previous, diff, percent };
  }, [medicalRecords, totalApps]);

  const formatTrend = (diff: number, percent: number | null, unit: string) => {
    const direction = diff > 0 ? "Tăng" : diff < 0 ? "Giảm" : "Không đổi";
    const absDiff = Math.abs(diff);
    if (percent === null) {
      return `Phát sinh mới (+${unit === "đ" ? formatMoney(absDiff) : `${absDiff} ${unit}`})`;
    }
    const percentText = `${Math.abs(percent).toFixed(1)}%`;
    return `${direction} ${percentText} (${diff >= 0 ? "+" : "-"}${unit === "đ" ? formatMoney(absDiff) : `${absDiff} ${unit}`})`;
  };

  // bs có hiệu suất cao nhất (nhiều ca hoàn thành nhất)
  const topDoctor = useMemo(() => {
    if (doctorStats.length === 0) return null;
    return [...doctorStats].sort((a, b) => getDoctorCases(b) - getDoctorCases(a))[0];
  }, [doctorStats]);

  const topDoctorProfile = useMemo(() => {
    if (!topDoctor) return null;
    const topName = normalizeText(getDoctorName(topDoctor));
    return allDoctors.find(d => normalizeText(d.ho_ten || d.HoTen) === topName) || null;
  }, [allDoctors, topDoctor]);

  const topDoctorRecords = useMemo(() => {
    if (!topDoctor) return [];
    const topName = normalizeText(getDoctorName(topDoctor));
    const topId = topDoctorProfile?.id_nhan_vien || topDoctorProfile?.idNhanVien || topDoctorProfile?.id;
    return medicalRecords.filter(record => {
      const recordDoctorId = record.id_bac_si || record.IdBacSi || record.id_nhan_vien;
      return (topId && String(recordDoctorId) === String(topId)) || normalizeText(record.ten_bac_si || record.TenBacSi) === topName;
    }).slice(0, 8);
  }, [medicalRecords, topDoctor, topDoctorProfile]);

  // Dịch vụ phổ biến mang lại doanh thu cao nhất
  const topService = useMemo(() => {
    if (serviceStats.length === 0) return null;
    return [...serviceStats].sort((a, b) => (b.DoanhThu || b.doanhthu || b.doanh_thu || b.tong_doanh_thu || 0) - (a.DoanhThu || a.doanhthu || a.doanh_thu || a.tong_doanh_thu || 0))[0];
  }, [serviceStats]);

  const topServiceProfile = useMemo(() => {
    if (!topService) return null;
    const topName = normalizeText(getServiceName(topService));
    return allServices.find(s => normalizeText(s.ten_dich_vu || s.TenDichVu) === topName) || null;
  }, [allServices, topService]);

  // Lọc và sắp xếp để đảm bảo biểu đồ chỉ lấy đúng 7 ngày gần nhất theo thứ tự tăng dần
  const sortedDailyData = useMemo(() => {
    return [...dailyRevenueData].sort((a, b) => {
      const dateA = new Date(a.Ngay || a.ngay).getTime();
      const dateB = new Date(b.Ngay || b.ngay).getTime();
      return dateA - dateB;
    }).slice(-7);
  }, [dailyRevenueData]);

  // Chart Options & Data
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#1e293b',
        bodyColor: '#1e293b',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        usePointStyle: true,
        callbacks: {
          label: (context: any) => {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            let val = context.parsed;
            if (typeof val === 'object' && val !== null) {
              val = context.chart.options.indexAxis === 'y' ? context.parsed.x : context.parsed.y;
            }
            if (context.chart.config.type === 'doughnut') {
              label += `${val} bé`;
            } else {
              label += `${val.toLocaleString('vi-VN')} đ`;
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        display: true,
        grid: {
          color: 'rgba(148, 163, 184, 0.08)'
        },
        ticks: {
          color: '#94a3b8',
          font: { weight: 'bold' as const },
          callback: (value: any) => formatChartTick(value)
        }
      },
      x: { grid: { display: false }, ticks: { font: { weight: 'bold' as const }, color: '#94a3b8' } }
    }
  };

  const revenueChartData = {
    labels: revenueData.map(d => `T${d.Thang || d.thang}`),
    datasets: [{
      label: 'Doanh thu',
      data: revenueData.map(d => (d.TongDoanhThu || d.tongdoanhthu || d.doanhthu || d.doanh_thu || d.tong_doanh_thu || 0)),
      backgroundColor: (context: any) => {
        const ctx = context.chart.ctx;
        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, 'rgba(15, 157, 138, 1)');
        gradient.addColorStop(1, 'rgba(20, 184, 166, 0.2)');
        return gradient;
      },
      borderRadius: 12,
      hoverBackgroundColor: '#0f9d8a',
      maxBarThickness: 45,
    }]
  };

  const dailyChartData = {
    labels: sortedDailyData.map(d => {
      // Use string slice to avoid UTC timezone shift (Date object treats YYYY-MM-DD as UTC)
      const rawDate = String(d.Ngay || d.ngay || '');
      if (/^\d{4}-\d{2}-\d{2}/.test(rawDate)) {
        const [, month, day] = rawDate.split('-');
        return `${parseInt(day)}/${parseInt(month)}`;
      }
      const date = new Date(rawDate);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    }),
    datasets: [{
      label: 'Doanh thu',
      data: sortedDailyData.map(d => (d.TongDoanhThu || d.tongdoanhthu || d.doanhthu || d.doanh_thu || d.tong_doanh_thu || 0)),
      backgroundColor: 'rgba(245, 158, 11, 0.8)',
      borderRadius: 8,
      hoverBackgroundColor: '#f59e0b',
      maxBarThickness: 45,
    }]
  };

  // Normalize & deduplicate petStats: merge same-named types (handle encoding issues)
  const normalizedPetStats = useMemo(() => {
    const map = new Map<string, number>();
    petStats.forEach((s: any) => {
      const rawType: string = s.LoaiThuCung || s.loaithucung || s.loai_thu_cung || 'Khác';
      const count: number = Number(s.SoLuong ?? s.soluong ?? s.so_luong ?? 0);
      // Normalize common encoding errors
      let type = rawType
        .replace(/MÃ¨o|MÃ©o|M\u00c3\u00a8o/gi, 'Mèo')
        .replace(/Ch\u00c3\u00b3|ChÃ³/gi, 'Chó')
        .replace(/\bCho\b/gi, 'Chó');
      map.set(type, (map.get(type) || 0) + count);
    });
    return Array.from(map.entries()).map(([loai, soLuong]) => ({ loai, soLuong }));
  }, [petStats]);

  const petChartData = {
    labels: normalizedPetStats.map(s => s.loai),
    datasets: [{
      label: 'Số lượng',
      data: normalizedPetStats.map(s => s.soLuong),
      backgroundColor: ['#0ea5e9', '#f59e0b', '#14b8a6', '#10b981', '#ec4899'],
      borderWidth: 0,
      hoverOffset: 15
    }]
  };

  const serviceChartItems = useMemo(() => {
    if (serviceStats.length > 0) return serviceStats;
    return allServices.map(service => ({
      TenDichVu: service.tendichvu || service.ten_dich_vu || service.TenDichVu,
      DoanhThu: 0
    }));
  }, [allServices, serviceStats]);

  const serviceChartData = {
    labels: serviceChartItems.map(s => s.TenDichVu || s.tendichvu || s.ten_dich_vu),
    datasets: [{
      label: 'Doanh thu',
      data: serviceChartItems.map(s => (s.DoanhThu || s.doanhthu || s.doanh_thu || s.tong_doanh_thu || 0)),
      backgroundColor: (context: any) => {
        const chart = context.chart;
        const { ctx, chartArea } = chart;
        if (!chartArea) return 'rgba(34, 211, 238, 0.75)';
        const gradient = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
        gradient.addColorStop(0, 'rgba(34, 211, 238, 0.95)');
        gradient.addColorStop(1, 'rgba(20, 184, 166, 0.72)');
        return gradient;
      },
      borderColor: 'rgba(125, 211, 252, 0.9)',
      borderWidth: 1,
      borderRadius: 8,
      hoverBackgroundColor: 'rgba(34, 211, 238, 1)',
      maxBarThickness: 45,
    }]
  };

  const handlePetTypeClick = async (type: string) => {
    setSelectedPetType(type);
    setLoadingDetails(true);
    try {
      const res = await axiosInstance.get("/api/thu-cung", { params: { page: 0, size: 999 } });
      const extractArray = (data: any): any[] => {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        const possibleArrays = [data.data, data.content, data.result, data.items, data.records];
        for (const arr of possibleArrays) {
          if (Array.isArray(arr)) return arr;
        }
        return [];
      };
      const allPets = extractArray(res.data);
      const filtered = allPets.filter(p => {
        const petType = p.loai || p.LoaiThuCung || 'Khác';
        return petType.toLowerCase() === type.toLowerCase();
      });
      setPetDetails(filtered);
    } catch (err) {
      toastError("Không thể tải danh sách thú cưng. Vui lòng thử lại sau.");
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleExportExcel = () => {
    try {
      // Khử các ký tự nhạy cảm ở đầu ô để tránh lỗi CSV Injection khi xuất file
      const sanitizeCSV = (val: string) => {
        if (/^[=+\-@]/.test(val)) return `'${val}`;
        return val;
      };

      let csvContent = "\uFEFF"; // BOM tiếng Việt
      
      // 1. TỔNG QUAN PHÒNG KHÁM
      csvContent += "=== BÁO CÁO TỔNG HỢP VẬN HÀNH PHÒNG KHÁM THÚ Y REXI ===\n";
      csvContent += `Tổng doanh thu tích lũy,${totalRevenue} đ\n`;
      csvContent += `Tổng số ca khám điều trị,${totalApps} ca\n`;
      csvContent += `Bác sĩ tích cực nhất,${topDoctor ? (topDoctor.TenBacSi || topDoctor.tenbacsi || topDoctor.ten_bac_si) : "Chưa có"}\n`;
      csvContent += `Dịch vụ đắt khách nhất,${topService ? (topService.TenDichVu || topService.tendichvu || topService.ten_dich_vu) : "Chưa có"}\n\n`;

      // 2. DOANH THU 12 THÁNG
      csvContent += "1. XU HƯỚNG DOANH THU CÁC THÁNG\nTháng,Năm,Doanh thu (VNĐ)\n";
      revenueData.forEach(item => {
        csvContent += `${item.Thang || item.thang},${item.Nam || item.nam},${item.TongDoanhThu || item.tongdoanhthu || item.doanh_thu || 0}\n`;
      });
      csvContent += "\n";

      // 3. HIỆU SUẤT CA KHÁM BÁC SĨ
      csvContent += "2. XẾP HẠNG HIỆU SUẤT BÁC SĨ ĐIỀU TRỊ\nBác sĩ,Số ca khám hoàn thành\n";
      doctorStats.forEach(item => {
        csvContent += `"${sanitizeCSV(item.TenBacSi || item.tenbacsi || item.ten_bac_si)}",${item.SoHoSo || item.sohoso || item.so_ho_so || 0}\n`;
      });
      csvContent += "\n";

      // 4. PHÂN BỔ LOÀI THÚ CƯNG
      csvContent += "3. PHÂN BỔ CÁC LOÀI THÚ CƯNG ĐĂNG KÝ\nLoài thú cưng,Số lượng bé\n";
      petStats.forEach(item => {
        csvContent += `"${sanitizeCSV(item.LoaiThuCung || item.loai_thu_cung || 'Khác')}",${item.SoLuong || item.so_luong || 0}\n`;
      });
      csvContent += "\n";

      // 5. DOANH THU THEO CÁC MỤC DỊCH VỤ
      csvContent += "4. DOANH THU CHI TIẾT THEO MỤC DỊCH VỤ Y TẾ\nTên dịch vụ y tế,Doanh thu (VNĐ)\n";
      serviceStats.forEach(item => {
        csvContent += `"${sanitizeCSV(item.TenDichVu || item.tendichvu || item.ten_dich_vu)}",${item.DoanhThu || item.doanhthu || item.doanh_thu || item.tong_doanh_thu || 0}\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", `Rexi_BaoCaoTongHop_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Đã xuất báo cáo tổng hợp phòng khám thành công!");
    } catch (err) {
      toastError("Không thể xuất file báo cáo. Vui lòng thử lại sau.");
    }
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><div className="dot-pulse"></div></div>;

  return (
    <div className="animate-fade-in" id="print-report">
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 12mm; }
          html, body { background: #ffffff !important; overflow: visible !important; }
          body * { visibility: hidden; }
          #print-report, #print-report * { visibility: visible; }
          #print-report {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 186mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #111827 !important;
          }
          #print-report .glass-card {
            box-shadow: none !important;
            border: 1px solid #e2e8f0 !important;
            break-inside: avoid;
            page-break-inside: avoid;
            margin-bottom: 14px !important;
          }
          .no-print, .no-print * {
            display: none !important;
            visibility: hidden !important;
          }
        }
        .hover-lift { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: default; }
        .hover-lift:hover { transform: translateY(-6px); box-shadow: 0 20px 40px rgba(15, 157, 138, 0.08) !important; }
        @keyframes slideUpFade { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes growBar { from { width: 0 !important; } to {} }
        .report-kpi-card { animation: slideUpFade 0.5s cubic-bezier(.22,.68,0,1.2) both; }
        .report-kpi-card {
          position: relative;
          min-height: 190px;
          overflow: visible;
          cursor: pointer;
          border-left: none !important;
        }
        .report-kpi-card::after {
          display: none !important;
          content: none !important;
        }
        .report-kpi-card::before {
          content: "Chi tiết";
          position: absolute;
          inset: auto;
          top: 22px;
          right: 22px;
          display: inline-flex;
          align-items: center;
          padding: 7px 10px;
          border-radius: 999px;
          border: 1px solid rgba(20, 184, 166, 0.28);
          background: rgba(20, 184, 166, 0.1);
          color: var(--primary);
          font-size: 0.72rem;
          font-weight: 950;
          box-shadow: 0 12px 26px rgba(15, 23, 42, 0.08);
          -webkit-mask: none;
          mask: none;
          pointer-events: none;
        }
        .kpi-hover-detail {
          position: absolute;
          left: 18px;
          right: 18px;
          top: 70px;
          z-index: 90;
          padding: 16px;
          border-radius: 16px;
          border: 1px solid rgba(20, 184, 166, 0.35);
          background: var(--surface);
          box-shadow: 0 24px 56px rgba(15, 23, 42, 0.22);
          opacity: 0;
          transform: translateY(-6px);
          pointer-events: none;
          transition: opacity 0.18s ease, transform 0.18s ease;
          color: var(--ink);
          font-size: 0.86rem;
          font-weight: 800;
          line-height: 1.45;
        }
        .report-kpi-card:hover .kpi-hover-detail {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }
        .kpi-hover-detail b {
          color: var(--ink);
          font-weight: 950;
        }
        .kpi-detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
          gap: 12px;
        }
        .kpi-detail-tile {
          padding: 14px;
          border: 1px solid var(--gray-200);
          border-radius: 14px;
          background: var(--surface);
        }
        .kpi-detail-label {
          font-size: 0.72rem;
          color: var(--gray-400);
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          margin-bottom: 6px;
        }
        .kpi-detail-value {
          color: var(--ink);
          font-size: 1.05rem;
          font-weight: 950;
          word-break: break-word;
        }
      `}</style>

      {/* TIÊU ĐỀ TRANG */}
      <div className="admin-mobile-page-header report-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-1px' }}>Phân tích & Báo cáo</h1>
          <p style={{ color: 'var(--gray-500)', fontWeight: 600 }}>Cái nhìn chuyên sâu về hiệu suất và tăng trưởng của phòng khám.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }} className="no-print">
          <button data-ai-id="button-baocaothongke-31pb" className="btn btn-pill" onClick={() => window.print()} style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
            <KpiIcon name="print" size={18} /> In Báo Cáo
          </button>
          <button data-ai-id="button-baocaothongke-wnuj" className="btn btn-primary btn-pill" onClick={handleExportExcel}>
            <KpiIcon name="download" size={18} /> Xuất Excel
          </button>
        </div>
      </div>

      {/* HÀNG THẺ KPI KÍNH MỜ CAO CẤP */}
      <div className="stagger-1 no-print admin-report-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        <div className="glass-card hover-lift report-kpi-card" onClick={() => setSelectedKpi("revenue")} title="Bấm để xem chi tiết doanh thu" style={{ padding: '32px', borderRadius: '32px', border: '1px solid rgba(20, 184, 166, 0.25)', background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.15) 0%, var(--surface) 100%)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '20px', background: 'rgba(20, 184, 166, 0.18)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(20, 184, 166, 0.12)', fontSize: '1.55rem', fontWeight: 950, marginBottom: '16px' }}><KpiIcon name="money" /></div>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>TỔNG DOANH THU</span>
          </div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 950, color: 'var(--ink)', margin: 0 }}>{totalRevenue.toLocaleString('vi-VN')} đ</h3>
          <div className="kpi-hover-detail">
            <b>So với ngày trước:</b> {formatTrend(latestRevenueCompare.diff, latestRevenueCompare.percent, "đ")}. Bấm để xem ngày hiện tại và ngày trước đó.
          </div>
        </div>

        <div className="glass-card hover-lift report-kpi-card" onClick={() => setSelectedKpi("cases")} title="Bấm để xem chi tiết ca điều trị" style={{ padding: '32px', borderRadius: '32px', border: '1px solid rgba(59, 130, 246, 0.25)', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, var(--surface) 100%)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '20px', background: 'rgba(59, 130, 246, 0.18)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(59, 130, 246, 0.12)', fontSize: '1.55rem', fontWeight: 950, marginBottom: '16px' }}><KpiIcon name="medical" /></div>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>TỔNG CA ĐIỀU TRỊ</span>
          </div>
          <h3 style={{ fontSize: '1.8rem', fontWeight: 950, color: 'var(--ink)', margin: 0 }}>{totalApps} ca</h3>
          <div className="kpi-hover-detail">
            <b>So với ngày trước:</b> {formatTrend(caseCompare.diff, caseCompare.percent, "ca")}. Bấm để xem phân bổ theo bác sĩ.
          </div>
        </div>

        <div className="glass-card hover-lift report-kpi-card" onClick={() => setSelectedKpi("doctor")} title="Bấm để xem hồ sơ bác sĩ" style={{ padding: '32px', borderRadius: '32px', border: '1px solid rgba(245, 158, 11, 0.25)', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, var(--surface) 100%)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '20px', background: 'rgba(245, 158, 11, 0.18)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(245, 158, 11, 0.12)', fontSize: '1.55rem', fontWeight: 950, marginBottom: '16px' }}><KpiIcon name="star" /></div>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>BÁC SĨ TÍCH CỰC</span>
          </div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--ink)', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {topDoctor ? (topDoctor.TenBacSi || topDoctor.tenbacsi || topDoctor.ten_bac_si) : 'Chưa có'}
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 700 }}>
            {topDoctor ? `${topDoctor.SoHoSo || topDoctor.sohoso || topDoctor.so_ho_so || 0} ca hoàn thành` : '—'}
          </span>
          <div className="kpi-hover-detail">
            <b>Thông tin:</b> {topDoctorProfile ? `${topDoctorProfile.so_dien_thoai || topDoctorProfile.sdt || "chưa có SĐT"} • ${topDoctorProfile.email || "chưa có email"}` : "Bấm để xem ca hoàn thành và hồ sơ liên quan."}
          </div>
        </div>

        <div className="glass-card hover-lift report-kpi-card" onClick={() => setSelectedKpi("service")} title="Bấm để xem chi tiết dịch vụ" style={{ padding: '32px', borderRadius: '32px', border: '1px solid rgba(236, 72, 153, 0.25)', background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, var(--surface) 100%)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ width: '60px', height: '60px', borderRadius: '20px', background: 'rgba(236, 72, 153, 0.18)', color: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(236, 72, 153, 0.12)', fontSize: '1.55rem', fontWeight: 950, marginBottom: '16px' }}><KpiIcon name="service" /></div>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>DỊCH VỤ HÀNG ĐẦU</span>
          </div>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--ink)', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {topService ? (topService.TenDichVu || topService.tendichvu || topService.ten_dich_vu) : 'Chưa có'}
          </h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 700 }}>
            {topService ? `${((topService.DoanhThu || topService.doanhthu || topService.doanh_thu || 0) / 1000000).toFixed(1)} Tr VNĐ` : '—'}
          </span>
          <div className="kpi-hover-detail">
            <b>Thông tin:</b> {topServiceProfile ? `${formatMoney(Number(topServiceProfile.gia || 0))} • ${topServiceProfile.thoi_luong_phut || "—"} phút` : "Bấm để xem tên, giá, trạng thái và doanh thu."}
          </div>
        </div>
      </div>

      {/* KHU VỰC BIỂU ĐỒ CHÍNH */}
      <div className="admin-report-charts-grid">
        {/* Doanh thu 12 tháng */}
        <div className="glass-card admin-report-chart-card">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px', color: 'var(--ink)' }}>Xu hướng doanh thu</h3>
          <div style={{ height: '300px' }}>
            <Bar options={commonOptions} data={revenueChartData} />
          </div>
        </div>

        {/* Doanh thu 7 ngày */}
        <div className="glass-card admin-report-chart-card">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px', color: 'var(--ink)' }}>Doanh thu 7 ngày qua</h3>
          <div style={{ height: '300px' }}>
            <Bar options={commonOptions} data={dailyChartData} />
          </div>
        </div>

        {/* Tỷ lệ thú cưng (Kèm Legend Pills tương tác Drill-down) */}
        <div className="glass-card admin-report-chart-card">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '20px', color: 'var(--ink)' }}>Tỷ lệ loài thú cưng</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '300px' }}>
            <div style={{ flex: 1, height: '180px', minHeight: '180px' }}>
              <Doughnut
                data={petChartData}
                options={{
                  ...commonOptions,
                  scales: undefined,
                  cutout: '70%',
                  plugins: { ...commonOptions.plugins, legend: { display: false } }
                }}
              />
            </div>
            
            {/* Interactive Legend pills drill-down */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', overflowY: 'auto' }} className="no-print">
              {normalizedPetStats.map((s, idx) => {
                const type = s.loai;
                const count = s.soLuong;
                const colors = ['#0ea5e9', '#f59e0b', '#14b8a6', '#10b981', '#ec4899'];
                const color = colors[idx % colors.length];
                return (
                  <button data-ai-id="button-baocaothongke-tlo0"
                    key={idx}
                    onClick={() => handlePetTypeClick(type)}
                    className="btn btn-pill hover-lift"
                    title={`Bấm để xem danh sách bé thuộc loài ${type}`}
                    style={{
                      background: 'var(--surface)',
                      border: `1.5px solid ${color}`,
                      color: 'var(--ink)',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      padding: '6px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '14px', color: color }}>pets</span>
                    {type.toUpperCase()}: <span style={{ color: color, fontWeight: 900 }}>{count} bé</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Hiệu suất bs */}
        <div className="glass-card admin-report-chart-card">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px', color: 'var(--ink)' }}>Hiệu suất đội ngũ</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {doctorStats.map((doc, idx) => {
              const maxApps = Math.max(...doctorStats.map(d => d.SoHoSo || d.sohoso || d.so_ho_so || 0));
              const width = maxApps === 0 ? 0 : ((doc.SoHoSo || doc.sohoso || doc.so_ho_so || 0) / maxApps) * 100;
              return (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--ink)' }}>{doc.TenBacSi || doc.tenbacsi || doc.ten_bac_si}</span>
                    <span style={{ fontWeight: 900, color: 'var(--primary)' }}>{doc.SoHoSo || doc.sohoso || doc.so_ho_so || 0} ca</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--gray-100)', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ width: `${width}%`, height: '100%', background: 'var(--primary-gradient)', borderRadius: '10px', animation: 'growBar 0.8s cubic-bezier(.22,.68,0,1.2) both', animationDelay: `${idx * 0.1}s` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Doanh thu dịch vụ */}
        <div className="glass-card admin-report-chart-card span-2">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px', color: 'var(--ink)' }}>Phân bổ doanh thu dịch vụ</h3>
          <div style={{ height: '400px', position: 'relative' }}>
            <Bar
              options={{
                ...commonOptions,
                indexAxis: 'y' as const,
                plugins: {
                  ...commonOptions.plugins,
                  tooltip: {
                    ...commonOptions.plugins.tooltip,
                    callbacks: {
                      label: (context: any) => {
                        const value = Number(context.parsed.x || 0);
                        return `Doanh thu: ${formatMoney(value)}`;
                      }
                    }
                  }
                },
                scales: {
                  x: {
                    beginAtZero: true,
                    grid: { color: 'rgba(148, 163, 184, 0.18)' },
                    ticks: {
                      font: { weight: 'bold' as const },
                      color: '#94a3b8',
                      padding: 8,
                      callback: (value: any) => formatChartTick(value)
                    }
                  },
                  y: {
                    grid: { display: false },
                    ticks: { font: { weight: 'bold' as const }, color: '#64748b', padding: 10 }
                  }
                }
              }}
              data={serviceChartData}
            />
          </div>
        </div>
      </div>

      {/* BANNER TỔNG DOANH THU THỰC TẾ DƯỚI CÙNG */}
      <div className="glass-card admin-report-banner">
        <div style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.1)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span className="material-symbols-outlined" style={{ fontSize: '40px' }}>trending_up</span>
        </div>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, margin: 0 }}>Tổng doanh thu thực tế</h2>
          <p style={{ margin: '8px 0 0 0', fontSize: '1.1rem', opacity: 0.8, fontWeight: 600 }}>Hệ thống đã xử lý <b style={{ color: '#0ea5e9' }}>{totalApps}</b> ca bệnh với tổng giá trị <b style={{ color: '#10b981' }}>{totalRevenue.toLocaleString('vi-VN')} đ</b></p>
        </div>
      </div>

      <Modal
        isOpen={!!selectedKpi}
        onClose={() => setSelectedKpi(null)}
        title={
          selectedKpi === "revenue" ? "Chi tiết tổng doanh thu" :
          selectedKpi === "cases" ? "Chi tiết tổng ca điều trị" :
          selectedKpi === "doctor" ? "Thông tin bác sĩ tích cực" :
          "Thông tin dịch vụ hàng đầu"
        }
        maxWidth="760px"
      >
        {selectedKpi === "revenue" && (
          <div style={{ display: 'grid', gap: '18px' }}>
            <div className="kpi-detail-grid">
              <div className="kpi-detail-tile">
                <div className="kpi-detail-label">Tổng thực thu</div>
                <div className="kpi-detail-value">{formatMoney(totalRevenue)}</div>
              </div>
              <div className="kpi-detail-tile">
                <div className="kpi-detail-label">Ngày gần nhất</div>
                <div className="kpi-detail-value">{formatMoney(latestRevenueCompare.current)}</div>
              </div>
              <div className="kpi-detail-tile">
                <div className="kpi-detail-label">Ngày trước đó</div>
                <div className="kpi-detail-value">{formatMoney(latestRevenueCompare.previous)}</div>
              </div>
              <div className="kpi-detail-tile">
                <div className="kpi-detail-label">Chênh lệch</div>
                <div className="kpi-detail-value" style={{ color: latestRevenueCompare.diff >= 0 ? 'var(--primary)' : '#ef4444' }}>
                  {formatTrend(latestRevenueCompare.diff, latestRevenueCompare.percent, "đ")}
                </div>
              </div>
            </div>
            <div style={{ fontWeight: 800, color: 'var(--gray-500)', lineHeight: 1.55 }}>
              Dữ liệu lấy từ hóa đơn đã thanh toán. Phần tăng/giảm được tính bằng doanh thu ngày gần nhất trong báo cáo 7 ngày so với ngày liền trước có dữ liệu.
            </div>
          </div>
        )}

        {selectedKpi === "cases" && (
          <div style={{ display: 'grid', gap: '18px' }}>
            <div className="kpi-detail-grid">
              <div className="kpi-detail-tile">
                <div className="kpi-detail-label">Tổng ca ghi nhận</div>
                <div className="kpi-detail-value">{totalApps} ca</div>
              </div>
              <div className="kpi-detail-tile">
                <div className="kpi-detail-label">Ngày gần nhất</div>
                <div className="kpi-detail-value">{caseCompare.current} ca</div>
              </div>
              <div className="kpi-detail-tile">
                <div className="kpi-detail-label">Ngày trước đó</div>
                <div className="kpi-detail-value">{caseCompare.previous} ca</div>
              </div>
              <div className="kpi-detail-tile">
                <div className="kpi-detail-label">Chênh lệch</div>
                <div className="kpi-detail-value" style={{ color: caseCompare.diff >= 0 ? 'var(--primary)' : '#ef4444' }}>
                  {formatTrend(caseCompare.diff, caseCompare.percent, "ca")}
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gap: '10px', maxHeight: '260px', overflowY: 'auto' }}>
              {doctorStats.map((doc, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', padding: '14px 16px', border: '1px solid var(--gray-200)', borderRadius: '14px', background: 'var(--surface)' }}>
                  <span style={{ fontWeight: 900, color: 'var(--ink)' }}>{getDoctorName(doc)}</span>
                  <span style={{ fontWeight: 950, color: '#3b82f6' }}>{doc.SoHoSo || doc.sohoso || doc.so_ho_so || 0} ca</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedKpi === "doctor" && (
          <div style={{ display: 'grid', gap: '18px' }}>
            <div className="kpi-detail-grid">
              <div className="kpi-detail-tile">
                <div className="kpi-detail-label">Họ tên</div>
                <div className="kpi-detail-value">{topDoctor ? getDoctorName(topDoctor) : "Chưa có"}</div>
              </div>
              <div className="kpi-detail-tile">
                <div className="kpi-detail-label">Ngày sinh</div>
                <div className="kpi-detail-value">{topDoctorProfile?.ngay_sinh ? new Date(topDoctorProfile.ngay_sinh).toLocaleDateString('vi-VN') : "Chưa cập nhật"}</div>
              </div>
              <div className="kpi-detail-tile">
                <div className="kpi-detail-label">Số điện thoại</div>
                <div className="kpi-detail-value">{topDoctorProfile?.so_dien_thoai || topDoctorProfile?.sdt || "Chưa cập nhật"}</div>
              </div>
              <div className="kpi-detail-tile">
                <div className="kpi-detail-label">Email</div>
                <div className="kpi-detail-value">{topDoctorProfile?.email || "Chưa cập nhật"}</div>
              </div>
              <div className="kpi-detail-tile">
                <div className="kpi-detail-label">Chuyên môn</div>
                <div className="kpi-detail-value">{topDoctorProfile?.chuyen_mon || topDoctorProfile?.chuyenMon || "Bác sĩ"}</div>
              </div>
              <div className="kpi-detail-tile">
                <div className="kpi-detail-label">Ca hoàn thành</div>
                <div className="kpi-detail-value">{topDoctor ? (topDoctor.SoHoSo || topDoctor.sohoso || topDoctor.so_ho_so || 0) : 0} ca</div>
              </div>
            </div>
            {topDoctorProfile?.gioi_thieu && (
              <div style={{ padding: '14px 16px', borderRadius: '14px', background: 'var(--primary-light)', color: 'var(--ink)', fontWeight: 800, lineHeight: 1.55 }}>
                {topDoctorProfile.gioi_thieu}
              </div>
            )}
            <div style={{ display: 'grid', gap: '10px', maxHeight: '220px', overflowY: 'auto' }}>
              {topDoctorRecords.length === 0 ? (
                <div style={{ color: 'var(--gray-400)', fontWeight: 800 }}>Chưa có hồ sơ chi tiết tương ứng để hiển thị.</div>
              ) : topDoctorRecords.map((record, idx) => (
                <div key={idx} style={{ padding: '14px 16px', border: '1px solid var(--gray-200)', borderRadius: '14px', background: 'var(--surface)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', marginBottom: '6px' }}>
                    <b style={{ color: 'var(--ink)' }}>{record.ten_thu_cung || record.TenThuCung || "Bệnh án"}</b>
                    <span style={{ color: 'var(--gray-400)', fontWeight: 800 }}>{record.ngay_kham ? new Date(record.ngay_kham).toLocaleDateString('vi-VN') : "—"}</span>
                  </div>
                  <div style={{ color: 'var(--gray-500)', fontWeight: 700 }}>{record.chan_doan || record.ChanDoan || record.trieu_chung || "Chưa có chẩn đoán"}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedKpi === "service" && (
          <div style={{ display: 'grid', gap: '18px' }}>
            <div className="kpi-detail-grid">
              <div className="kpi-detail-tile">
                <div className="kpi-detail-label">Tên dịch vụ</div>
                <div className="kpi-detail-value">{topService ? getServiceName(topService) : "Chưa có"}</div>
              </div>
              <div className="kpi-detail-tile">
                <div className="kpi-detail-label">Giá niêm yết</div>
                <div className="kpi-detail-value">{formatMoney(Number(topServiceProfile?.gia || 0))}</div>
              </div>
              <div className="kpi-detail-tile">
                <div className="kpi-detail-label">Thời lượng</div>
                <div className="kpi-detail-value">{topServiceProfile?.thoi_luong_phut ? `${topServiceProfile.thoi_luong_phut} phút` : "Chưa cập nhật"}</div>
              </div>
              <div className="kpi-detail-tile">
                <div className="kpi-detail-label">Trạng thái</div>
                <div className="kpi-detail-value">{topServiceProfile?.trang_thai === false ? "Tạm ngừng" : "Đang hoạt động"}</div>
              </div>
              <div className="kpi-detail-tile">
                <div className="kpi-detail-label">Doanh thu ghi nhận</div>
                <div className="kpi-detail-value">{formatMoney(topService?.DoanhThu || topService?.doanhthu || topService?.doanh_thu || topService?.tong_doanh_thu || 0)}</div>
              </div>
            </div>
            <div style={{ padding: '14px 16px', borderRadius: '14px', background: 'var(--surface)', border: '1px solid var(--gray-200)', color: 'var(--gray-500)', fontWeight: 800, lineHeight: 1.55 }}>
              {topServiceProfile?.mo_ta || "Dịch vụ này chưa có mô tả chi tiết trong danh mục dịch vụ."}
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!selectedPetType} onClose={() => setSelectedPetType(null)} title={`Danh sách bé thuộc nhóm: ${selectedPetType}`} maxWidth="600px">
        {loadingDetails ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="dot-pulse"></div></div>
        ) : (
          <div 
            ref={petContainerRef}
            onScroll={onPetScroll}
            style={{ display: 'grid', gap: '16px', maxHeight: '500px', overflowY: 'auto', padding: '8px' }}>
            {petDetails.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '20px', fontWeight: 700 }}>Không tìm thấy thú cưng nào thuộc loài này.</p>
            ) : (
              <>
                {shouldVirtualizePet && petRange.start > 0 && (
                  <div style={{ height: petRange.start * 90 }} />
                )}
                {(shouldVirtualizePet ? visiblePetDetails : petDetails).map((pet, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', background: 'var(--surface)', borderRadius: '20px', border: '1px solid var(--gray-200)', height: '90px' }}>
                    <div style={{ width: '48px', height: '48px', background: 'var(--primary-light)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                      <span className="material-symbols-outlined">pets</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 900, color: 'var(--ink)' }}>{pet.ten_thu_cung || pet.TenThuCung}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)', fontWeight: 600 }}>{pet.giong || pet.Giong || 'Chưa rõ giống'} • {pet.trong_luong || pet.TrongLuong || '—'} kg</div>
                    </div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, background: 'var(--gray-100)', color: 'var(--gray-500)', padding: '4px 10px', borderRadius: '8px' }}>{pet.gioi_tinh || '—'}</span>
                  </div>
                ))}
                {shouldVirtualizePet && petRange.end < petDetails.length && (
                  <div style={{ height: (petDetails.length - petRange.end) * 90 }} />
                )}
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default React.memo(BaoCaoThongKe);
