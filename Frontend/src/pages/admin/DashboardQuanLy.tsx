import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "@services/axios";
import CanhBaoThuoc from "@components/admin/CanhBaoThuoc";

const formatTienVND = (tien: number) => {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(tien);
};

const DashboardQuanLy: React.FC = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = useState<any[]>([]);
  const [revenue, setRevenue] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customers, apps, inventory, revData] = await Promise.all([
          axiosInstance.get("/api/khach-hang/count"), // Đã tối ưu bằng cách lấy đếm thay vì toàn bộ danh sách
          axiosInstance.get("/api/lich-hen/hom-nay"),
          axiosInstance.get("/api/kho/thuoc-sap-het-han"),
          axiosInstance.get("/api/bao-cao/doanh-thu-thang")
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

        setCustomerCount(typeof customers.data === 'number' ? customers.data : (customers.data || 0));
        setAppointments(extractArray(apps.data));
        setInventoryAlerts(extractArray(inventory.data));

        const revArray = extractArray(revData.data);
        if (revArray.length > 0) {
          const currentMonth = new Date().getMonth() + 1;
          const currentYear = new Date().getFullYear();
          // Sửa lại thuộc tính cho khớp với JSON trả về từ API giống bên BaoCaoThongKe
          const currentData = revArray.find((d: any) => (Number(d.Thang) === currentMonth || Number(d.thang) === currentMonth) && (Number(d.Nam) === currentYear || Number(d.nam) === currentYear));
          if (currentData) setRevenue(currentData.TongDoanhThu || currentData.doanh_thu || currentData.tong_doanh_thu || 0);
        }
      } catch (err) {
        console.error("Lỗi đồng bộ dữ liệu Dashboard:", err);
      }
    };
    fetchData();
  }, []);

  const stats = useMemo(() => [
    { label: "Khách Hàng", value: customerCount, icon: "groups", color: "#0f9d8a" },
    { label: "Lịch Hẹn Nay", value: appointments.length, icon: "calendar_today", color: "#3b82f6" },
    { label: "Doanh Thu", value: formatTienVND(revenue), icon: "payments", color: "#f59e0b" },
    { label: "Kho Thuốc", value: inventoryAlerts.length, icon: "inventory_2", color: "#ef4444" },
  ], [customerCount, appointments.length, revenue, inventoryAlerts.length]);

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
      <div className="stagger-1" style={{ marginBottom: '40px', padding: '48px', borderRadius: 'var(--radius-xl)', background: 'var(--secondary-gradient)', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-2xl)' }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '300px', height: '300px', background: 'radial-gradient(circle, var(--primary-light) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', bottom: '-20%', left: '0%', width: '250px', height: '250px', background: 'radial-gradient(circle, var(--primary-light) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none', opacity: 0.5 }}></div>
        <h1 className="text-gradient" style={{ fontSize: '3.5rem', fontWeight: 950, letterSpacing: '-2px', position: 'relative', zIndex: 1, margin: '0 0 12px 0' }}>Tổng quan hệ thống 📊</h1>
        <p style={{ fontWeight: 600, color: 'rgba(255,255,255,0.7)', position: 'relative', zIndex: 1, margin: 0, fontSize: '1.1rem' }}>Xin chào Admin, đây là báo cáo hoạt động và vận hành hôm nay.</p>
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

      <div className="stagger-3" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
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
                    <td style={{ padding: '16px 8px' }}><span style={{ color: app.trang_thai?.toLowerCase() === 'da_xac_nhan' ? 'var(--success)' : 'var(--gray-400)', fontWeight: 800, fontSize: '0.8rem' }}>● {app.trang_thai?.toUpperCase()}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

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
      </div>
    </div>
  );
};

export default DashboardQuanLy;
