import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "@services/axios";
import { getUserProfile } from "@utils/index";
import KeToanDashboard from "./KeToanDashboard";
import BacSiDashboard from "./BacSiDashboard";
import TiepTanDashboard from "./TiepTanDashboard";
import CanhBaoThuoc from "@components/admin/CanhBaoThuoc";

const formatTienVND = (tien: number) => {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(tien);
};

const DashboardQuanLy: React.FC = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = useState<any[]>([]);
  const [revenue, setRevenue] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [customerGrowthData, setCustomerGrowthData] = useState<{ month: string, count: number }[]>([]);

  const user = useMemo(() => getUserProfile() || {}, []);
  const userRole = (user.loai_tai_khoan || user.ten_vai_tro || 'STAFF').toUpperCase();

  useEffect(() => {
    // Nếu role có dashboard riêng, không cần fetch data cho dashboard chung
    if (['KE_TOAN', 'BAC_SI', 'Y_TA', 'TIEP_TAN'].some(r => userRole.includes(r))) return;

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

        const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

        // PHÂN QUYỀN GỌI API LINH HOẠT
        const canViewCustomers = userRole.includes('ADMIN') || userRole.includes('QUAN_LY') || userRole.includes('TIEP_TAN');
        const canViewAppointments = userRole.includes('ADMIN') || userRole.includes('QUAN_LY') || userRole.includes('TIEP_TAN') || userRole.includes('BAC_SI') || userRole.includes('Y_TA');
        const canViewInventory = userRole.includes('ADMIN') || userRole.includes('QUAN_LY') || userRole.includes('Y_TA') || userRole.includes('STAFF');
        const canViewRevenue = userRole.includes('ADMIN') || userRole.includes('QUAN_LY') || userRole.includes('KE_TOAN');

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
          const homNay = arr.filter((l: any) => l.ngay_kham === todayStr);
          setAppointments(homNay);
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
          const currentMonth = new Date().getMonth() + 1;
          const currentYear = new Date().getFullYear();
          let totalRev = 0;
          invArray.forEach((inv: any) => {
            if ((inv.trang_thai || inv.trangThai)?.toLowerCase() === 'da_thanh_toan') {
              const date = new Date(inv.ngay_lap_hoa_don);
              if (date.getMonth() + 1 === currentMonth && date.getFullYear() === currentYear) {
                totalRev += (inv.tong_tien_cuoi || inv.tongTienCuoi || 0);
              }
            }
          });
          setRevenue(totalRev);
        }
      } catch (err) {
        console.error("Lỗi đồng bộ dữ liệu Dashboard:", err);
      }
    };
    fetchData();
  }, [userRole]);

  const stats = useMemo(() => {
    const allStats = [];
    if (userRole.includes('ADMIN') || userRole.includes('QUAN_LY') || userRole.includes('TIEP_TAN')) {
      allStats.push({ label: "Khách Hàng", value: customerCount, icon: "groups", color: "#0f9d8a" });
    }
    if (userRole.includes('ADMIN') || userRole.includes('QUAN_LY') || userRole.includes('TIEP_TAN') || userRole.includes('BAC_SI') || userRole.includes('Y_TA')) {
      allStats.push({ label: "Lịch Hẹn Nay", value: appointments.length, icon: "calendar_today", color: "#3b82f6" });
    }
    if (userRole.includes('ADMIN') || userRole.includes('QUAN_LY') || userRole.includes('KE_TOAN')) {
      allStats.push({ label: "Doanh Thu", value: formatTienVND(revenue), icon: "payments", color: "#f59e0b" });
    }
    if (userRole.includes('ADMIN') || userRole.includes('QUAN_LY') || userRole.includes('Y_TA') || userRole.includes('STAFF')) {
      allStats.push({ label: "Kho Thuốc", value: inventoryAlerts.length, icon: "inventory_2", color: "#ef4444" });
    }
    return allStats;
  }, [customerCount, appointments.length, revenue, inventoryAlerts.length, userRole]);

  const cleanName = (name: string) => name ? name.replace(/^\d+\.\s*/, '').trim() : '';
  const currentName = cleanName(user.ho_ten || user.displayName || user.display_name || 'Admin Rexi');

  // ĐIỀU HƯỚNG DASHBOARD THEO VAI TRÒ (đặt SAU tất cả hooks để tuân thủ Rules of Hooks)
  if (userRole.includes('KE_TOAN')) return <KeToanDashboard />;
  if (userRole.includes('BAC_SI') || userRole.includes('Y_TA')) return <BacSiDashboard />;
  if (userRole.includes('TIEP_TAN')) return <TiepTanDashboard />;

  // Hàm lấy màu theo trạng thái để đồng bộ UI
  const getStatusColor = (status: string) => {
    const s = status?.toUpperCase() || '';
    if (s === 'DA_DAT' || s === 'CHỜ XÁC NHẬN') return '#f59e0b';
    if (s === 'DA_XAC_NHAN') return '#3b82f6';
    if (s === 'DANG_KHAM') return '#8b5cf6';
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
      `}</style>
      <div className="stagger-1" style={{ marginBottom: '40px', padding: '48px', borderRadius: 'var(--radius-xl)', background: 'var(--primary-gradient)', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-2xl)' }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '300px', height: '300px', background: 'radial-gradient(circle, var(--primary-light) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', bottom: '-20%', left: '0%', width: '250px', height: '250px', background: 'radial-gradient(circle, var(--primary-light) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none', opacity: 0.5 }}></div>
        <h1 style={{ fontSize: '3.5rem', fontWeight: 950, letterSpacing: '-2px', position: 'relative', zIndex: 1, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span className="text-gradient">Tổng quan hệ thống</span>
          <span style={{ filter: 'drop-shadow(0 5px 15px rgba(0,0,0,0.2))' }}>📊</span>
        </h1>
        <p style={{ fontWeight: 700, color: 'rgba(255,255,255,0.95)', position: 'relative', zIndex: 1, margin: 0, fontSize: '1.2rem', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>Xin chào {currentName}, đây là báo cáo hoạt động và vận hành hôm nay.</p>
      </div>

      <CanhBaoThuoc />

      <div className="stagger-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '32px', marginBottom: '40px' }}>
        {stats.map((item, i) => (
          <div key={i} className="glass-card hover-lift" style={{ padding: '32px', borderRadius: '32px', border: `1px solid ${item.color}20` }}>
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
        {(userRole.includes('ADMIN') || userRole.includes('QUAN_LY') || userRole.includes('TIEP_TAN') || userRole.includes('BAC_SI') || userRole.includes('Y_TA')) && (
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

        {(userRole.includes('ADMIN') || userRole.includes('QUAN_LY')) && (
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

        {(userRole.includes('ADMIN') || userRole.includes('QUAN_LY') || userRole.includes('Y_TA') || userRole.includes('STAFF')) && (
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
