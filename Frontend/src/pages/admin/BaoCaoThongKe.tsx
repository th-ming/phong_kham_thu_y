import React, { useState, useEffect, useMemo } from "react";
import axiosInstance from "@services/axios";
import { toast } from "@components/Toast";
import { Modal } from "@components/CommonUI";
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

const formatTienTrieu = (tien: number) => {
  return (tien / 1000000).toFixed(1);
};

const BaoCaoThongKe: React.FC = () => {
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [doctorStats, setDoctorStats] = useState<any[]>([]);
  const [dailyRevenueData, setDailyRevenueData] = useState<any[]>([]);
  const [petStats, setPetStats] = useState<any[]>([]);
  const [serviceStats, setServiceStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // State quản lý Modal danh sách thú cưng
  const [selectedPetType, setSelectedPetType] = useState<string | null>(null);
  const [petDetails, setPetDetails] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [revRes, docRes, dailyRevRes, petStatsRes, serviceStatsRes] = await Promise.all([
          axiosInstance.get("/api/bao-cao/doanh-thu-thang"),
          axiosInstance.get("/api/bao-cao/thong-ke-bac-si"),
          axiosInstance.get("/api/bao-cao/doanh-thu-ngay"),
          axiosInstance.get("/api/bao-cao/thong-ke-thu-cung"),
          axiosInstance.get("/api/bao-cao/doanh-thu-dich-vu")
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

        setRevenueData(extractArray(revRes.data).slice(0, 12).reverse());
        setDoctorStats(extractArray(docRes.data));
        setDailyRevenueData(extractArray(dailyRevRes.data));
        setPetStats(extractArray(petStatsRes.data));
        setServiceStats(extractArray(serviceStatsRes.data));
      } catch (err) {
        console.error("Lỗi lấy dữ liệu báo cáo:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalRevenue = useMemo(() => revenueData.reduce((sum, d) => sum + (d.TongDoanhThu || d.doanh_thu || d.tong_doanh_thu || 0), 0), [revenueData]);
  const totalApps = useMemo(() => doctorStats.reduce((sum, d) => sum + (d.SoHoSo || d.so_ho_so || 0), 0), [doctorStats]);

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
            label += val;
            if (context.chart.config.type === 'doughnut') {
              label += ' bé';
            } else {
              label += ' Triệu VNĐ';
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: { beginAtZero: true, display: false },
      x: { grid: { display: false }, ticks: { font: { weight: 'bold' }, color: '#94a3b8' } }
    }
  };

  const revenueChartData = {
    labels: revenueData.map(d => `T${d.Thang || d.thang}`),
    datasets: [{
      label: 'Doanh thu (Triệu)',
      data: revenueData.map(d => (d.TongDoanhThu || d.doanh_thu || d.tong_doanh_thu || 0) / 1000000),
      backgroundColor: 'rgba(15, 157, 138, 0.8)',
      borderRadius: 8,
      hoverBackgroundColor: '#0f9d8a',
    }]
  };

  const dailyChartData = {
    labels: sortedDailyData.map(d => {
      const date = new Date(d.Ngay || d.ngay);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    }),
    datasets: [{
      label: 'Doanh thu (Triệu)',
      data: sortedDailyData.map(d => (d.TongDoanhThu || d.doanh_thu || d.tong_doanh_thu || 0) / 1000000),
      backgroundColor: 'rgba(245, 158, 11, 0.8)',
      borderRadius: 8,
      hoverBackgroundColor: '#f59e0b',
    }]
  };

  const petChartData = {
    labels: petStats.map(s => s.LoaiThuCung || s.loai_thu_cung || 'Khác'),
    datasets: [{
      label: 'Số lượng',
      data: petStats.map(s => s.SoLuong || s.so_luong || 0),
      backgroundColor: ['#0ea5e9', '#f59e0b', '#8b5cf6', '#10b981', '#ec4899'],
      borderWidth: 0,
      hoverOffset: 15
    }]
  };

  const serviceChartData = {
    labels: serviceStats.map(s => s.TenDichVu || s.ten_dich_vu),
    datasets: [{
      label: 'Doanh thu',
      data: serviceStats.map(s => (s.DoanhThu || s.doanh_thu || s.tong_doanh_thu || 0) / 1000000),
      backgroundColor: 'rgba(234, 88, 12, 0.8)',
      borderRadius: 8,
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
      const filtered = allPets.filter(p => (p.loai || p.LoaiThuCung || 'Khác') === type);
      setPetDetails(filtered);
    } catch (err) {
      toast.error("Không thể tải danh sách thú cưng!");
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleExportExcel = () => {
    try {
      let csvContent = "\uFEFF";
      csvContent += "BÁO CÁO DOANH THU\nMonth,Year,Revenue (VNĐ)\n";
      revenueData.forEach(item => csvContent += `${item.Thang},${item.Nam},${item.TongDoanhThu}\n`);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", `Rexi_Report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Đã xuất báo cáo thành công!");
    } catch (err) {
      toast.error("Lỗi khi xuất file!");
    }
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><div className="dot-pulse"></div></div>;

  return (
    <div className="animate-fade-in" id="print-report">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-report, #print-report * { visibility: visible; }
          #print-report { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          .glass-card { box-shadow: none !important; border: 1px solid #e2e8f0 !important; break-inside: avoid; }
        }
      `}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-1px' }}>Phân tích & Báo cáo</h1>
          <p style={{ color: 'var(--gray-500)', fontWeight: 600 }}>Cái nhìn chuyên sâu về hiệu suất và tăng trưởng của phòng khám.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }} className="no-print">
          <button className="btn btn-pill" onClick={() => window.print()} style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
            <span className="material-symbols-outlined">print</span> In Báo Cáo
          </button>
          <button className="btn btn-primary btn-pill" onClick={handleExportExcel}>
            <span className="material-symbols-outlined">download</span> Xuất Excel
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px', marginBottom: '40px' }}>
        {/* Doanh thu 12 tháng */}
        <div className="glass-card" style={{ padding: '32px', borderRadius: 'var(--radius-xl)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px', color: 'var(--ink)' }}>Xu hướng doanh thu</h3>
          <div style={{ height: '300px' }}>
            <Bar options={commonOptions} data={revenueChartData} />
          </div>
        </div>

        {/* Doanh thu 7 ngày */}
        <div className="glass-card" style={{ padding: '32px', borderRadius: 'var(--radius-xl)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px', color: 'var(--ink)' }}>Doanh thu 7 ngày qua</h3>
          <div style={{ height: '300px' }}>
            <Bar options={commonOptions} data={dailyChartData} />
          </div>
        </div>

        {/* Tỷ lệ thú cưng */}
        <div className="glass-card" style={{ padding: '32px', borderRadius: 'var(--radius-xl)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px', color: 'var(--ink)' }}>Tỷ lệ thú cưng</h3>
          <div style={{ display: 'flex', alignItems: 'center', height: '300px' }}>
            <div style={{ flex: 1, height: '100%' }}>
              <Doughnut
                data={petChartData}
                options={{
                  ...commonOptions,
                  scales: undefined,
                  cutout: '70%',
                  plugins: { ...commonOptions.plugins, legend: { display: true, position: 'right', labels: { usePointStyle: true, font: { weight: 'bold' } } } }
                }}
              />
            </div>
          </div>
        </div>

        {/* Hiệu suất bác sĩ */}
        <div className="glass-card" style={{ padding: '32px', borderRadius: 'var(--radius-xl)' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px', color: 'var(--ink)' }}>Hiệu suất đội ngũ</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {doctorStats.map((doc, idx) => {
              const maxApps = Math.max(...doctorStats.map(d => d.SoHoSo || d.so_ho_so || 0));
              const width = maxApps === 0 ? 0 : ((doc.SoHoSo || doc.so_ho_so || 0) / maxApps) * 100;
              return (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--ink)' }}>{doc.TenBacSi || doc.ten_bac_si}</span>
                    <span style={{ fontWeight: 900, color: 'var(--primary)' }}>{doc.SoHoSo || doc.so_ho_so || 0} ca</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--gray-100)', borderRadius: '10px', overflow: 'hidden' }}>
                    <div style={{ width: `${width}%`, height: '100%', background: 'var(--primary-gradient)', borderRadius: '10px' }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Doanh thu dịch vụ */}
        <div className="glass-card" style={{ padding: '32px', borderRadius: 'var(--radius-xl)', gridColumn: 'span 2' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px', color: 'var(--ink)' }}>Phân bổ doanh thu dịch vụ</h3>
          <div style={{ height: '400px' }}>
            <Bar
              options={{
                ...commonOptions,
                indexAxis: 'y' as const,
                scales: {
                  x: { beginAtZero: true, grid: { display: false }, ticks: { font: { weight: 'bold' } } },
                  y: { grid: { display: false }, ticks: { font: { weight: 'bold' } } }
                }
              }}
              data={serviceChartData}
            />
          </div>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '40px', borderRadius: 'var(--radius-xl)', background: 'var(--secondary-gradient)', color: 'white', display: 'flex', alignItems: 'center', gap: '32px' }}>
        <div style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.1)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '40px' }}>trending_up</span>
        </div>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, margin: 0 }}>Tổng doanh thu thực tế</h2>
          <p style={{ margin: '8px 0 0 0', fontSize: '1.1rem', opacity: 0.8, fontWeight: 600 }}>Hệ thống đã xử lý <b style={{ color: '#0ea5e9' }}>{totalApps}</b> ca bệnh với tổng giá trị <b style={{ color: '#10b981' }}>{totalRevenue.toLocaleString('vi-VN')} đ</b></p>
        </div>
      </div>

      {/* MODAL DANH SÁCH THÚ CƯNG */}
      <Modal isOpen={!!selectedPetType} onClose={() => setSelectedPetType(null)} title={`Danh sách ${selectedPetType}`} maxWidth="600px">
        {loadingDetails ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="dot-pulse"></div></div>
        ) : (
          <div style={{ display: 'grid', gap: '16px', maxHeight: '60vh', overflowY: 'auto', padding: '8px' }}>
            {petDetails.map((pet, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', background: 'var(--surface)', borderRadius: '20px', border: '1px solid var(--gray-200)' }}>
                <div style={{ width: '48px', height: '48px', background: 'var(--primary-light)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                  <span className="material-symbols-outlined">pets</span>
                </div>
                <div>
                  <div style={{ fontWeight: 900, color: 'var(--ink)' }}>{pet.ten_thu_cung || pet.TenThuCung}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)', fontWeight: 600 }}>{pet.giong || pet.Giong} • {pet.trong_luong || pet.TrongLuong}kg</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default React.memo(BaoCaoThongKe);
