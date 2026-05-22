import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "@services/axios";
import { getUserProfile, normalizeUserRole } from "@utils/index";
import KeToanDashboard from "./KeToanDashboard";
import BacSiDashboard from "./BacSiDashboard";
import TiepTanDashboard from "./TiepTanDashboard";
import CanhBaoThuoc from "@components/admin/CanhBaoThuoc";

const formatTienVND = (tien: number) => {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(tien);
};

const toLocalDateKey = (date: Date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().split('T')[0];

const getDateKey = (value: any) => {
  if (!value) return "";
  return String(value).substring(0, 10);
};

const getPercentChange = (today: number, yesterday: number) => {
  if (yesterday === 0 && today === 0) return { text: "Không đổi", tone: "neutral" as const };
  if (yesterday === 0) return { text: "+100%", tone: "up" as const };
  const percent = ((today - yesterday) / yesterday) * 100;
  const sign = percent > 0 ? "+" : "";
  const tone = percent > 0 ? "up" : percent < 0 ? "down" : "neutral";
  return { text: `${sign}${percent.toFixed(0)}%`, tone: tone as "up" | "down" | "neutral" };
};

const DashboardQuanLy: React.FC = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = useState<any[]>([]);
  const [revenue, setRevenue] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [kpiCompare, setKpiCompare] = useState({
    customers: { today: 0, yesterday: 0 },
    appointments: { today: 0, yesterday: 0 },
    revenue: { today: 0, yesterday: 0 }
  });
  const [customerGrowthData, setCustomerGrowthData] = useState<{ month: string, count: number }[]>([]);

  const user = useMemo(() => getUserProfile() || {}, []);
  const userRole = normalizeUserRole(user);

  useEffect(() => {
    // Nếu role có dashboard riêng, không cần fetch data cho dashboard chung
    if (['ke_toan', 'bac_si', 'y_ta', 'tiep_tan'].includes(userRole)) return;

    const fetchData = async () => {
      try {
        const fetchSafety = async (url: string) => {
          try {
            return await axiosInstance.get(url);
          } catch (e) {
            console.warn(`Lỗi gọi API ${url} (Có thể do phân quyền):`, e);
            return { data: null };
          }
        };

        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(today.getDate() - 1);
        const todayStr = toLocalDateKey(today);
        const yesterdayStr = toLocalDateKey(yesterday);

        // PHÂN QUYỀN GỌI API LINH HOẠT
        const canViewCustomers = ['admin', 'quan_ly', 'tiep_tan'].includes(userRole);
        const canViewAppointments = ['admin', 'quan_ly', 'tiep_tan', 'bac_si', 'y_ta'].includes(userRole);
        const canViewInventory = ['admin', 'quan_ly', 'y_ta', 'staff'].includes(userRole);
        const canViewRevenue = ['admin', 'quan_ly', 'ke_toan'].includes(userRole);

        const [customers, apps, loThuocs, thuocs, invoices] = await Promise.all([
          canViewCustomers ? fetchSafety("/api/khach-hang") : Promise.resolve({ data: null }),
          canViewAppointments ? fetchSafety("/api/lich-hen?page=0&size=999") : Promise.resolve({ data: null }),
          canViewInventory ? fetchSafety("/api/kho/lo-thuoc") : Promise.resolve({ data: null }),
          canViewInventory ? fetchSafety("/api/kho/thuoc") : Promise.resolve({ data: null }),
          canViewRevenue ? fetchSafety("/api/hoa-don") : Promise.resolve({ data: null })
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

        if (customers.data !== null) {
          const arr = extractArray(customers.data);
          setCustomerCount(arr.length);
          const customersToday = arr.filter((c: any) => getDateKey(c.ngay_tao || c.created_at || c.ngay_dang_ky) === todayStr).length;
          const customersYesterday = arr.filter((c: any) => getDateKey(c.ngay_tao || c.created_at || c.ngay_dang_ky) === yesterdayStr).length;
          setKpiCompare(prev => ({ ...prev, customers: { today: customersToday, yesterday: customersYesterday } }));

          const last6Months = Array.from({ length: 6 }, (_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            return { month: d.getMonth() + 1, year: d.getFullYear(), label: `Tháng ${d.getMonth() + 1}` };
          }).reverse();

          const growthData = last6Months.map(m => {
            const count = arr.filter((c: any) => {
              const dateStr = c.ngay_tao || c.created_at || c.ngay_dang_ky;
              if (!dateStr) return false;
              const d = new Date(dateStr);
              return d.getMonth() + 1 === m.month && d.getFullYear() === m.year;
            }).length;
            return { month: m.label, count };
          });
          setCustomerGrowthData(growthData);
        }

        if (apps.data !== null) {
          const arr = extractArray(apps.data);
          // BUG FIX: Backend có thể trả "2025-05-20T00:00:00" nên dùng startsWith thay vì ===
          const homNay = arr.filter((l: any) => {
            const ngay = l.ngay_kham ? String(l.ngay_kham).substring(0, 10) : '';
            return ngay === todayStr;
          });
          const homQua = arr.filter((l: any) => {
            const ngay = l.ngay_kham ? String(l.ngay_kham).substring(0, 10) : '';
            return ngay === yesterdayStr;
          });
          setAppointments(homNay);
          setKpiCompare(prev => ({ ...prev, appointments: { today: homNay.length, yesterday: homQua.length } }));
        }

        if (loThuocs.data !== null && thuocs.data !== null) {
          const arrLo = extractArray(loThuocs.data);
          const arrThuoc = extractArray(thuocs.data);
          const canhBao = arrLo.filter((l: any) => l.so_luong_ton < 10).map((l: any) => {
            const thuocInfo = arrThuoc.find((t: any) => String(t.id_thuoc) === String(l.id_thuoc));
            return {
              ten_thuoc: thuocInfo ? thuocInfo.ten_thuoc : `Lô ${l.so_lo}`,
              so_luong_ton: l.so_luong_ton,
              han_dung: l.han_su_dung || l.han_dung
            };
          });
          setInventoryAlerts(canhBao);
        }

        if (invoices.data !== null) {
          const invArray = extractArray(invoices.data);
          const paidInvoices = invArray.filter((inv: any) => (inv.trang_thai || inv.trangThai || '').toUpperCase() === 'DA_THANH_TOAN');
          const todayRevenue = paidInvoices.reduce((sum: number, inv: any) => {
            return getDateKey(inv.ngay_lap_hoa_don || inv.ngay_lap) === todayStr ? sum + Number(inv.tong_tien_cuoi || inv.tongTienCuoi || 0) : sum;
          }, 0);
          const yesterdayRevenue = paidInvoices.reduce((sum: number, inv: any) => {
            return getDateKey(inv.ngay_lap_hoa_don || inv.ngay_lap) === yesterdayStr ? sum + Number(inv.tong_tien_cuoi || inv.tongTienCuoi || 0) : sum;
          }, 0);
          setRevenue(todayRevenue);
          setKpiCompare(prev => ({ ...prev, revenue: { today: todayRevenue, yesterday: yesterdayRevenue } }));
        }
      } catch (err) {
        console.error("Lỗi đồng bộ dữ liệu Dashboard:", err);
      }
    };
    fetchData();
  }, [userRole]);

  const stats = useMemo(() => {
    const allStats = [];
    const customerChange = getPercentChange(kpiCompare.customers.today, kpiCompare.customers.yesterday);
    const appointmentChange = getPercentChange(kpiCompare.appointments.today, kpiCompare.appointments.yesterday);
    const revenueChange = getPercentChange(kpiCompare.revenue.today, kpiCompare.revenue.yesterday);
    if (['admin', 'quan_ly', 'tiep_tan'].includes(userRole)) {
      allStats.push({ label: "Khách Hàng", value: customerCount, icon: "groups", color: "#0f9d8a", trend: customerChange, caption: `${kpiCompare.customers.today} mới hôm nay / ${kpiCompare.customers.yesterday} hôm qua` });
    }
    if (['admin', 'quan_ly', 'tiep_tan', 'bac_si', 'y_ta'].includes(userRole)) {
      allStats.push({ label: "Lịch Hẹn Nay", value: appointments.length, icon: "calendar_today", color: "#3b82f6", trend: appointmentChange, caption: `${kpiCompare.appointments.today} hôm nay / ${kpiCompare.appointments.yesterday} hôm qua` });
    }
    if (['admin', 'quan_ly', 'ke_toan'].includes(userRole)) {
      allStats.push({ label: "Doanh Thu", value: formatTienVND(revenue), icon: "payments", color: "#f59e0b", trend: revenueChange, caption: `${formatTienVND(kpiCompare.revenue.yesterday)} hôm qua` });
    }
    if (['admin', 'quan_ly', 'y_ta', 'staff'].includes(userRole)) {
      allStats.push({ label: "Kho Thuốc", value: inventoryAlerts.length, icon: "inventory_2", color: "#ef4444", trend: { text: inventoryAlerts.length > 0 ? "Cần xử lý" : "Ổn định", tone: inventoryAlerts.length > 0 ? "down" as const : "up" as const }, caption: "Cảnh báo tồn kho thấp hiện tại" });
    }
    return allStats;
  }, [customerCount, appointments.length, revenue, inventoryAlerts.length, userRole, kpiCompare]);

  const cleanName = (name: string) => name ? name.replace(/^\d+\.\s*/, '').trim() : '';
  const currentName = cleanName(user.ho_ten || user.displayName || user.display_name || 'Admin Rexi');

  // ĐIỀU HƯỚNG DASHBOARD THEO VAI TRÒ (đặt SAU tất cả hooks để tuân thủ Rules of Hooks)
  if (userRole === 'ke_toan') return <KeToanDashboard />;
  if (userRole === 'bac_si' || userRole === 'y_ta') return <BacSiDashboard />;
  if (userRole === 'tiep_tan') return <TiepTanDashboard />;

  // Hàm lấy màu theo trạng thái để đồng bộ UI
  const getStatusColor = (status: string) => {
    const s = status?.toUpperCase() || '';
    if (s === 'DA_DAT' || s === 'CHỜ XÁC NHẬN') return '#f59e0b';
    if (s === 'DA_XAC_NHAN') return '#3b82f6';
    if (s === 'DANG_KHAM') return '#14b8a6';
    if (s === 'HOAN_THANH') return '#10b981';
    if (s === 'DA_HUY' || s === 'HUY') return '#ef4444';
    return 'var(--gray-400)';
  };

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
        .hover-lift { transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); cursor: default; }
        .hover-lift:hover { transform: translateY(-8px); box-shadow: 0 25px 50px rgba(0,0,0,0.08); }
        .table-row:hover { background-color: var(--gray-50) !important; }
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
          background: var(--surface);
          border: 1px solid var(--gray-200);
          box-shadow: 0 20px 44px rgba(15, 23, 42, 0.16);
          color: var(--ink);
          opacity: 0;
          transform: translateY(-6px);
          pointer-events: none;
          transition: opacity 0.18s ease, transform 0.18s ease;
          z-index: 4;
        }
        .kpi-trend-badge:hover + .kpi-trend-popover,
        .kpi-trend-badge:focus + .kpi-trend-popover,
        .kpi-trend-popover:hover {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }
        .kpi-popover-title {
          font-size: 0.78rem;
          font-weight: 950;
          color: var(--gray-500);
          text-transform: uppercase;
          letter-spacing: 0.4px;
          margin-bottom: 8px;
        }
        .kpi-popover-value {
          font-size: 0.92rem;
          line-height: 1.45;
          font-weight: 850;
          color: var(--ink);
        }
      `}</style>
      <div className="stagger-1" style={{ marginBottom: '40px', padding: '48px', borderRadius: 'var(--radius-xl)', background: 'var(--primary-gradient)', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-2xl)' }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '300px', height: '300px', background: 'radial-gradient(circle, var(--primary-light) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', bottom: '-20%', left: '0%', width: '250px', height: '250px', background: 'radial-gradient(circle, var(--primary-light) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none', opacity: 0.5 }}></div>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 950, letterSpacing: '-2px', position: 'relative', zIndex: 1, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span>Tổng quan hệ thống</span>
          <span style={{ filter: 'drop-shadow(0 5px 15px rgba(0,0,0,0.2))' }}>📊</span>
        </h1>
        <p style={{ fontWeight: 700, color: 'rgba(255,255,255,0.95)', position: 'relative', zIndex: 1, margin: 0, fontSize: '1.2rem', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>Xin chào {currentName}, đây là báo cáo hoạt động và vận hành hôm nay.</p>
      </div>

      <CanhBaoThuoc />

      <div className="stagger-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '32px', marginBottom: '40px' }}>
        {stats.map((item, i) => (
          <div key={i} className="glass-card hover-lift kpi-card" style={{ padding: '32px', borderRadius: '32px', border: `1px solid ${item.color}20`, minHeight: '190px' }}>
            <button
              type="button"
              className={`kpi-trend-badge ${item.trend.tone}`}
              aria-label={`Chi tiết tăng trưởng ${item.label}`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>
                {item.trend.tone === 'up' ? 'trending_up' : item.trend.tone === 'down' ? 'trending_down' : 'trending_flat'}
              </span>
              <span>{item.trend.text}</span>
            </button>
            <div className="kpi-trend-popover">
              <div className="kpi-popover-title">{item.label}</div>
              <div className="kpi-popover-value">
                {item.trend.text} so với hôm qua
                <br />
                {item.caption}
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

      <div className="stagger-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        {(['admin', 'quan_ly', 'tiep_tan', 'bac_si', 'y_ta'].includes(userRole)) && (
          <div className="glass-card hover-lift" style={{ padding: '32px', borderRadius: 'var(--radius-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--ink)' }}>Lịch hẹn hôm nay</h3>
              <Link to="/quan-ly/lich-hen" className="btn btn-pill" style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '8px 20px', fontSize: '0.8rem', textDecoration: 'none' }}>Tất cả</Link>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--gray-100)' }}>
                    <th style={{ padding: '16px 8px', color: 'var(--gray-400)', fontSize: '0.8rem', fontWeight: 700 }}>GIỜ</th>
                    <th style={{ padding: '16px 8px', color: 'var(--gray-400)', fontSize: '0.8rem', fontWeight: 700 }}>BỆNH NHÂN</th>
                    <th style={{ padding: '16px 8px', color: 'var(--gray-400)', fontSize: '0.8rem', fontWeight: 700 }}>BÁC SĨ</th>
                    <th style={{ padding: '16px 8px', color: 'var(--gray-400)', fontSize: '0.8rem', fontWeight: 700 }}>TRẠNG THÁI</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((app, i) => (
                    <tr key={i} className="table-row" style={{ borderBottom: '1px solid var(--gray-200)', transition: 'all 0.2s' }}>
                      <td style={{ padding: '16px 8px', fontWeight: 800, color: 'var(--ink)' }}>{app.gio_kham?.substring(0, 5)}</td>
                      <td style={{ padding: '16px 8px', fontWeight: 700, color: 'var(--ink)' }}>{app.ten_thu_cung} <span style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--gray-400)' }}>{app.ten_khach_hang}</span></td>
                      <td style={{ padding: '16px 8px' }}><span style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '4px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}>{app.ten_bac_si || 'Chưa xếp'}</span></td>
                      <td style={{ padding: '16px 8px' }}>
                        <span style={{ color: getStatusColor(app.trang_thai), fontWeight: 800, fontSize: '0.8rem' }}>
                          ● {app.trang_thai?.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(['admin', 'quan_ly'].includes(userRole)) && (
          <div className="glass-card hover-lift" style={{ padding: '32px', borderRadius: 'var(--radius-xl)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px', color: 'var(--ink)' }}>Tăng trưởng khách hàng (6 tháng)</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '180px', borderBottom: '1px solid var(--gray-100)', paddingBottom: '8px' }}>
              {customerGrowthData.map((stat, idx) => {
                const maxCount = Math.max(...customerGrowthData.map(s => s.count), 1);
                const heightPct = (stat.count / maxCount) * 100;
                return (
                  <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', height: '100%', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gray-500)' }}>{stat.count}</span>
                    <div style={{ width: '100%', maxWidth: '32px', height: `${heightPct}%`, minHeight: '6px', background: stat.count > 0 ? '#0f9d8a' : 'var(--gray-100)', borderRadius: '6px 6px 0 0', transition: 'height 0.4s ease' }}></div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 600 }}>{stat.month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {(['admin', 'quan_ly', 'y_ta', 'staff'].includes(userRole)) && (
          <div className="glass-card hover-lift" style={{ padding: '32px', borderRadius: 'var(--radius-xl)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px', color: 'var(--ink)' }}>Cảnh báo kho</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {inventoryAlerts.length === 0 ? <p style={{ opacity: 0.6, color: 'var(--gray-500)', fontWeight: 600 }}>Hệ thống ổn định</p> : inventoryAlerts.map((item, i) => (
                <div key={i} style={{ background: 'var(--primary-light)', padding: '16px', borderRadius: '16px', border: '1px solid var(--primary-border, rgba(15, 157, 138, 0.1))' }}>
                  <p style={{ fontWeight: 800, marginBottom: '4px', color: 'var(--ink)' }}>{item.ten_thuoc}</p>
                  <p style={{ fontSize: '0.8rem', opacity: 0.8, color: 'var(--gray-500)', fontWeight: 600 }}>Tồn kho: {item.so_luong_ton} | Hạn: {item.han_dung?.substring(0, 10)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardQuanLy;
