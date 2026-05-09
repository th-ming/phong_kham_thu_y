import React, { useMemo, useState, useEffect } from "react";
import axiosInstance from "@services/axios";
import { getUserProfile } from "@utils/index";
import { toast } from "@components/Toast";

const chuyenNgayISO_SangVN = (dateString: string) => {
  if (!dateString) return "—";
  const parts = dateString.split('T')[0].split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateString;
};

const hienThiTrangThaiLich = (status: string) => {
  switch (status?.toUpperCase()) {
    case "CHO_XAC_NHAN": return "CHỜ XÁC NHẬN";
    case "DA_XAC_NHAN": return "ĐÃ XÁC NHẬN";
    case "DANG_KHAM": return "ĐANG KHÁM";
    case "DA_KHAM": return "HOÀN TẤT";
    case "HOAN_THANH": return "HOÀN TẤT";
    case "DA_HUY": return "ĐÃ HỦY";
    case "HET_HAN": return "HẾT HẠN";
    default: return status || "CHƯA RÕ";
  }
};

const AppointmentCard: React.FC<{ item: any, thuCungs: any[] }> = ({ item, thuCungs }) => {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="glass-card item-card" style={{ padding: '24px 32px', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '56px', height: '56px', background: 'var(--primary-light)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>event_available</span>
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--ink)', margin: 0 }}>{item.ly_do || "Khám định kỳ"}</h3>
            <p style={{ color: 'var(--gray-400)', fontWeight: 700, margin: '2px 0', fontSize: '0.8rem' }}>
              Bệnh nhân: <b style={{ color: 'var(--ink)' }}>{thuCungs.find(p => p.id_thu_cung === item.id_thu_cung)?.ten_thu_cung || "Thú cưng"}</b>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
          <div style={{ textAlign: 'right' }}>
            <b style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--ink)' }}>{chuyenNgayISO_SangVN(item.ngay_kham)}</b>
            <div style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 800 }}>{item.gio_kham?.substring(0, 5)}</div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              minWidth: '110px', textAlign: 'center', padding: '6px 16px', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 900,
              background: (item.trang_thai || item.trangThai)?.toLowerCase() === 'da_huy' ? 'var(--danger-light, rgba(239, 68, 68, 0.15))' : ((item.trang_thai || item.trangThai)?.toLowerCase() === 'da_xac_nhan' ? 'var(--primary-light)' : 'var(--gray-50)'),
              color: (item.trang_thai || item.trangThai)?.toLowerCase() === 'da_huy' ? 'var(--danger)' : ((item.trang_thai || item.trangThai)?.toLowerCase() === 'da_xac_nhan' ? 'var(--primary)' : 'var(--gray-400)')
            }}>
              {hienThiTrangThaiLich(item.trang_thai || item.trangThai)}
            </span>

            <button
              onClick={() => setShowDetails(!showDetails)}
              className="btn btn-pill"
              style={{ padding: '8px', background: 'var(--gray-50)', color: 'var(--gray-500)', minWidth: '40px' }}
            >
              <span className="material-symbols-outlined" style={{
                transform: showDetails ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.3s'
              }}>expand_more</span>
            </button>
          </div>
        </div>
      </div>

      {showDetails && (
        <div className="animate-fade-in" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--gray-100)', display: 'grid', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '24px' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '4px' }}>BÁC SĨ PHỤ TRÁCH</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>medical_information</span>
                {item.ten_bac_si || "Đang phân bổ"}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '4px' }}>DỊCH VỤ</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>vaccines</span>
                {item.ten_dich_vu || "Khám tổng quát"}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            {/* NÚT HỦY LỊCH - Chỉ hiện khi đang CHỜ XÁC NHẬN hoặc ĐÃ XÁC NHẬN */}
            {(item.trang_thai === 'CHO_XAC_NHAN' || item.trang_thai === 'DA_XAC_NHAN') && (
              <button
                className="btn btn-outline"
                style={{ flex: 1, padding: '10px', color: 'var(--danger)', borderColor: 'var(--danger-light)' }}
                onClick={() => (window as any).handleCancelAppointment(item.id_lich_hen)}
              >
                Hủy lịch hẹn
              </button>
            )}

            {/* NÚT ĐẶT LẠI - Hiện khi đã HOÀN TẤT hoặc ĐÃ HỦY */}
            {(item.trang_thai === 'DA_KHAM' || item.trang_thai === 'HOAN_THANH' || item.trang_thai === 'DA_HUY') && (
              <button
                className="btn btn-primary"
                style={{ flex: 1, padding: '10px' }}
                onClick={() => (window as any).handleRebook(item)}
              >
                Đặt lại lịch này
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const LichSuLichHen: React.FC = () => {
  const [petId, setPetId] = useState("all");
  const [status, setStatus] = useState("all");
  const [lichHens, setLichHens] = useState<any[]>([]);
  const [thuCungs, setThuCungs] = useState<any[]>([]);
  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [totalServerPages, setTotalServerPages] = useState(1);
  const [isServerPaginated, setIsServerPaginated] = useState(false);
  const ITEMS_PER_PAGE = 5;

  const fetchLichHen = () => {
    const user = getUserProfile();
    if (!user) return;
    const id = user?.id_khach_hang;
    setLoading(true);
    Promise.allSettled([
      axiosInstance.get(`/api/lich-hen/khach/${id}`, {
        params: { page: currentPage - 1, size: ITEMS_PER_PAGE, status: status !== 'all' ? status : undefined, petId: petId !== 'all' ? petId : undefined }
      }),
      axiosInstance.get(`/api/thu-cung/khach/${id}`)
    ]).then(([lichHenRes, thuCungRes]) => {
      if (lichHenRes.status === 'fulfilled' && lichHenRes.value.data?.content) {
        setLichHens(lichHenRes.value.data.content);
        setTotalServerPages(lichHenRes.value.data.totalPages);
        setIsServerPaginated(true);
      } else if (lichHenRes.status === 'fulfilled') {
        setLichHens(lichHenRes.value.data || []);
        setIsServerPaginated(false);
      }
      if (thuCungRes.status === 'fulfilled') setThuCungs(thuCungRes.value.data || []);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchLichHen();
  }, [currentPage, status, petId]);

  // Đăng ký hàm global để AppointmentCard gọi được (tránh truyền props sâu)
  useEffect(() => {
    (window as any).handleCancelAppointment = async (id: number) => {
      if (window.confirm("Sếp chắc chắn muốn hủy lịch hẹn này chứ? Bé cưng sẽ buồn lắm đấy... 😿")) {
        try {
          await axiosInstance.put(`/api/lich-hen/${id}/status`, { trang_thai: "DA_HUY" });
          toast.success("Đã hủy lịch hẹn thành công!");
          fetchLichHen();
        } catch (err) {
          toast.error("Không thể hủy lịch lúc này, sếp thử lại sau nhé!");
        }
      }
    };
    (window as any).handleRebook = (item: any) => {
      // Chuyển hướng sang trang đặt lịch kèm theo thông tin cũ
      const query = new URLSearchParams({
        id_thu_cung: item.id_thu_cung,
        id_dich_vu: item.id_dich_vu,
        id_bac_si: item.id_bac_si
      }).toString();
      window.location.href = `/dat-lich?${query}`;
    };
  }, []);

  // Reset về trang 1 mỗi khi đổi bộ lọc
  useEffect(() => {
    setCurrentPage(1);
  }, [petId, status]);

  const rows = useMemo(() => {
    if (isServerPaginated) return lichHens; // Nếu backend đã phân trang thì không cần lọc ở client nữa
    return lichHens
      .filter((l) => (petId === "all" ? true : String(l.id_thu_cung) === petId))
      .filter((l) => (status === "all" ? true : (l.trang_thai || l.trangThai)?.toUpperCase() === status || (status === 'DA_KHAM' && (l.trang_thai || l.trangThai)?.toUpperCase() === 'HOAN_THANH')))
      .sort((a, b) => new Date(b.ngay_kham).getTime() - new Date(a.ngay_kham).getTime());
  }, [lichHens, petId, status, isServerPaginated]);

  // Tính toán dữ liệu hiển thị cho trang hiện tại
  const totalPages = isServerPaginated ? totalServerPages : Math.ceil(rows.length / ITEMS_PER_PAGE);
  const currentRows = isServerPaginated ? rows : rows.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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
        .item-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); border: 1px solid transparent; background: var(--surface); }
        .item-card:hover { border-color: var(--primary) !important; background: var(--surface) !important; transform: translateY(-4px) scale(1.01); box-shadow: 0 20px 40px rgba(15, 157, 138, 0.08); z-index: 10; position: relative; }
      `}</style>
      <div className="stagger-1" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', padding: '48px', borderRadius: 'var(--radius-xl)', background: 'var(--secondary-gradient)', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 15px 35px rgba(13, 148, 136, 0.2)', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', bottom: '-20%', left: '0%', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none', opacity: 0.5 }}></div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 className="header-title" style={{ fontSize: '3.5rem', fontWeight: 950, letterSpacing: '-2px', margin: '0 0 12px 0', textShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>Lịch sử thăm khám 🏥</h1>
          <p style={{ fontWeight: 600, color: 'rgba(255,255,255,0.85)', margin: 0, fontSize: '1.1rem' }}>Theo dõi lộ trình chăm sóc và lịch hẹn của các bé.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px', position: 'relative', zIndex: 1, flexWrap: 'wrap' }}>
          <select value={petId} onChange={e => setPetId(e.target.value)} style={{ minWidth: '220px', borderRadius: '16px', padding: '14px 20px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 700, outline: 'none', cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
            <option value="all" style={{ color: 'var(--ink)' }}>Tất cả thú cưng</option>
            {thuCungs.map(pet => (
              <option key={pet.id_thu_cung} value={String(pet.id_thu_cung)} style={{ color: 'var(--ink)' }}>{pet.ten_thu_cung}</option>
            ))}
          </select>
          <select value={status} onChange={e => setStatus(e.target.value)} style={{ minWidth: '200px', borderRadius: '16px', padding: '14px 20px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: 700, outline: 'none', cursor: 'pointer', backdropFilter: 'blur(10px)' }}>
            <option value="all" style={{ color: 'var(--ink)' }}>Tất cả trạng thái</option>
            <option value="CHO_XAC_NHAN" style={{ color: 'var(--ink)' }}>Chờ xác nhận</option>
            <option value="DA_XAC_NHAN" style={{ color: 'var(--ink)' }}>Đã xác nhận</option>
            <option value="DA_KHAM" style={{ color: 'var(--ink)' }}>Hoàn tất</option>
            <option value="DA_HUY" style={{ color: 'var(--ink)' }}>Đã hủy</option>
            <option value="HET_HAN" style={{ color: 'var(--ink)' }}>Hết hạn</option>
          </select>
        </div>
      </div>

      <div className="stagger-2" style={{ display: 'grid', gap: '24px' }}>
        {rows.length === 0 ? (
          <div className="glass-card" style={{ padding: '120px 40px', textAlign: 'center', borderRadius: '40px', background: 'rgba(255,255,255,0.01)', border: '1px dashed rgba(255,255,255,0.1)' }}>
            <div style={{ width: '120px', height: '120px', background: 'var(--primary-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', border: '1px solid var(--primary-light)', boxShadow: '0 0 40px var(--primary-shadow)' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '64px', color: 'var(--primary)', filter: 'drop-shadow(0 0 10px var(--primary))' }}>calendar_today</span>
            </div>
            <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--ink)', marginBottom: '12px' }}>Chưa có lịch khám nào</h3>
            <p style={{ fontSize: '1.05rem', color: 'var(--gray-400)', fontWeight: 600, maxWidth: '400px', margin: '0 auto' }}>Dường như các bé nhà mình đang rất khỏe mạnh! Đừng quên đặt lịch khám định kỳ nhé.</p>
          </div>
        ) : currentRows.map((item) => (
          <AppointmentCard key={item.id_lich_hen} item={item} thuCungs={thuCungs} />
        ))}

        {/* BỘ NÚT ĐIỀU HƯỚNG PHÂN TRANG */}
        {totalPages > 1 && (
          <div className="stagger-2" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '20px' }}>
            <button
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
            <button
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
      </div>
    </div>
  );
};

export default React.memo(LichSuLichHen);
