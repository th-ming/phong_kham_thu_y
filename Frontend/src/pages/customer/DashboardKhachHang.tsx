import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "@services/axios";
import { Modal } from "@components/CommonUI";
import { getUserProfile } from "@utils/index";

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

const DashboardKhachHang: React.FC = () => {
  const navigate = useNavigate();
  const [pets, setPets] = useState<any[]>([]);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [hoanTat, setHoanTat] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isTipsModalOpen, setIsTipsModalOpen] = useState(false);

  const randomTip = useMemo(() => PET_CARE_TIPS[Math.floor(Math.random() * PET_CARE_TIPS.length)], []);

  useEffect(() => {
    const user = getUserProfile();
    if (!user) {
      navigate("/dang-nhap");
      return;
    }

    const idKhachHang = user.id_khach_hang || user.id_tai_khoan || user.id;

    if (!idKhachHang) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
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

        if (petRes.status === 'fulfilled') setPets(extractArray(petRes.value));
        if (appRes.status === 'fulfilled') {
          const appointments = extractArray(appRes.value);
          const upcomingList = appointments.filter((l: any) => {
            const st = String(l.trang_thai || l.trangThai || '').toUpperCase();
            return st === 'CHO_XAC_NHAN' || st === 'DA_XAC_NHAN' || st === 'DANG_KHAM';
          });
          setUpcoming(upcomingList.slice(0, 3));

          const hoanTatCount = appointments.filter((l: any) => {
            const st = String(l.trang_thai || l.trangThai || '').toUpperCase();
            return st === 'DA_KHAM' || st === 'HOAN_THANH' || st === 'HOAN_TAT';
          }).length;
          setHoanTat(hoanTatCount);
        }
        if (invRes.status === 'fulfilled') {
          const invoices = extractArray(invRes.value);
          const paidInvoices = invoices.filter((inv: any) => (inv.trang_thai || inv.trangThai)?.toLowerCase() === 'da_thanh_toan');
          const parseCurrency = (val: any) => {
            if (!val) return 0;
            if (typeof val === 'number') return val;
            const cleanStr = String(val).replace(/[^0-9.-]+/g, "");
            return Number(cleanStr) || 0;
          };
          const total = paidInvoices.reduce((sum: number, inv: any) => sum + parseCurrency(inv.tong_tien_cuoi || inv.tongTienCuoi || inv.tong_tien_ban_dau || inv.tongTienBanDau), 0);
          setTotalSpent(total);
        }
      } catch (err) {
        console.error("Lỗi đồng bộ dữ liệu Dashboard Khách:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const stats = useMemo(() => [
    { label: "BÉ CƯNG", value: pets.length, icon: "pets", color: "var(--primary)" },
    { label: "LỊCH HẸN", value: upcoming.length, icon: "calendar_month", color: "#3b82f6" },
    { label: "ĐÃ KHÁM", value: hoanTat, icon: "verified", color: "#f59e0b" },
    { label: "CHI TIÊU", value: formatTienVND(totalSpent), icon: "payments", color: "#8b5cf6" },
  ], [pets, upcoming, hoanTat, totalSpent]);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><div className="dot-pulse"></div></div>;

  return (
    <div className="animate-fade-in">
      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounceLocal {
          0% { transform: translateY(0); }
          100% { transform: translateY(-4px); }
        }
        .stagger-1 { animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both; opacity: 0; }
        .stagger-2 { animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both; opacity: 0; }
        .stagger-3 { animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both; opacity: 0; }
        
        .hover-lift { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; }
        .hover-lift:hover { transform: translateY(-6px); box-shadow: 0 20px 40px rgba(0,0,0,0.06); }
        
        .appointment-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); border: 1px solid var(--gray-100); }
        .appointment-card:hover { border-color: var(--primary) !important; background: var(--surface) !important; transform: scale(1.02) translateX(8px); box-shadow: -5px 15px 25px rgba(15, 157, 138, 0.12); z-index: 10; }
        
        .icon-bounce:hover span { animation: bounceLocal 0.3s ease infinite alternate; }
      `}</style>
      <div className="stagger-1" style={{ marginBottom: '40px', padding: '48px', borderRadius: 'var(--radius-xl)', background: 'var(--secondary-gradient)', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 15px 35px rgba(13, 148, 136, 0.2)' }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', bottom: '-20%', left: '0%', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none', opacity: 0.5 }}></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '24px', overflow: 'hidden', border: '3px solid rgba(255,255,255,0.3)', boxShadow: '0 10px 20px rgba(0,0,0,0.2)' }}>
            {getUserProfile()?.hinh_anh || getUserProfile()?.avatar ? (
              <img src={getUserProfile()?.hinh_anh || getUserProfile()?.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'white' }}>person</span>
              </div>
            )}
          </div>
          <div>
            <h1 className="header-title" style={{ fontSize: '3.5rem', fontWeight: 950, letterSpacing: '-2px', margin: '0 0 8px 0', textShadow: '0 4px 15px rgba(0,0,0,0.2)', color: 'white' }}>Xin chào! 👋</h1>
            <p style={{ fontWeight: 700, color: 'rgba(255,255,255,0.95)', margin: 0, fontSize: '1.2rem', textShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>Cùng theo dõi và chăm sóc sức khỏe cho các bạn nhỏ nhà mình nhé.</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '32px', marginBottom: '40px' }}>
        {stats.map((item, i) => (
          <div key={i} className="glass-card hover-lift stagger-2" style={{ padding: '32px', borderRadius: '32px', animationDelay: `${0.1 + i * 0.1}s`, border: `1px solid ${item.color}20` }}>
            <div className="icon-bounce" style={{ background: `${item.color}15`, color: item.color, width: '60px', height: '60px', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px', transition: 'transform 0.4s', boxShadow: `0 0 20px ${item.color}20` }}>
              <span className="material-symbols-outlined" style={{ fontSize: '30px' }}>{item.icon}</span>
            </div>
            <p style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--gray-400)', margin: '0 0 6px 0', letterSpacing: '1px' }}>{item.label}</p>
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
              {upcoming.map((app, i) => (
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
            <button className="btn btn-pill" onClick={() => setIsTipsModalOpen(true)} style={{ background: 'rgba(255,255,255,0.15)', color: 'white', marginTop: '32px', width: '100%', border: '1.5px solid rgba(255,255,255,0.3)', fontWeight: 800, backdropFilter: 'blur(10px)' }}>Xem tất cả mẹo</button>
          </div>

          <div className="glass-card hover-lift" style={{ padding: '32px', borderRadius: 'var(--radius-xl)', display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ width: '56px', height: '56px', background: 'var(--primary-light)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>support_agent</span>
            </div>
            <div>
              <h4 style={{ margin: 0, fontWeight: 800, color: 'var(--ink)' }}>Hỗ trợ 24/7</h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--gray-500)', fontWeight: 600 }}>Cần tư vấn khẩn cấp? Hãy liên hệ ngay.</p>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DANH SÁCH MẸO */}
      <Modal isOpen={isTipsModalOpen} onClose={() => setIsTipsModalOpen(false)} title="Cẩm nang chăm sóc thú cưng">
        <div style={{ display: 'grid', gap: '16px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '8px' }}>
          {PET_CARE_TIPS.map((tip, i) => (
            <div key={i} style={{ display: 'flex', gap: '20px', padding: '20px', background: 'var(--surface)', border: '1px solid var(--gray-200)', borderRadius: '20px', animation: 'slideUpFade 0.5s ease forwards', animationDelay: `${i * 0.1}s`, opacity: 0 }}>
              <div style={{ width: '48px', height: '48px', background: 'var(--background)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
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
    </div>
  );
};

export default React.memo(DashboardKhachHang);
