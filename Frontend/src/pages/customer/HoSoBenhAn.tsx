import React, { useMemo, useState, useEffect } from "react";
import axiosInstance from "@services/axios";
import { getUserProfile } from "@utils/index";

const chuyenNgayISO_SangVN = (dateString: string) => {
  if (!dateString) return "—";
  const parts = dateString.split('T')[0].split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateString;
};

const HoSoBenhAn: React.FC = () => {
  const [petFilter, setPetFilter] = useState("all");
  const [searchDoctor, setSearchDoctor] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [hoSoList, setHoSoList] = useState<any[]>([]);
  const [thuCungs, setThuCungs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // State hỗ trợ Phân trang Server-side
  const [totalServerPages, setTotalServerPages] = useState(1);
  const [isServerPaginated, setIsServerPaginated] = useState(false);

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    const user = getUserProfile();
    if (!user) {
      setLoading(false);
      return;
    }
    const id = user.id_khach_hang || user.id;
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.allSettled([
      axiosInstance.get(`/api/ho-so-benh-an/khach/${id}`, {
        params: { page: currentPage - 1, size: ITEMS_PER_PAGE, search: debouncedSearch, petId: petFilter !== 'all' ? petFilter : undefined }
      }),
      axiosInstance.get(`/api/thu-cung/khach/${id}`)
    ]).then(([hoSoRes, thuCungRes]) => {
      // Xử lý hồ sơ bệnh án
      if (hoSoRes.status === 'fulfilled') {
        const data = hoSoRes.value.data;
        if (data?.content) {
          setHoSoList(data.content);
          setTotalServerPages(data.totalPages);
          setIsServerPaginated(true);
        } else {
          setHoSoList(Array.isArray(data) ? data : []);
          setIsServerPaginated(false);
        }
      }

      // Xử lý danh sách thú cưng
      if (thuCungRes.status === 'fulfilled') {
        setThuCungs(Array.isArray(thuCungRes.value.data) ? thuCungRes.value.data : []);
      }

      setLoading(false);
    }).catch(err => {
      console.error("Lỗi đồng bộ dữ liệu:", err);
      setLoading(false);
    });
  }, [currentPage, debouncedSearch, petFilter]);

  // Hiệu ứng Debounce cho ô tìm kiếm
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchDoctor);
    }, 300); // Đợi 300ms sau khi ngừng gõ mới cập nhật từ khóa
    return () => clearTimeout(handler);
  }, [searchDoctor]);

  // Reset về trang 1 mỗi khi đổi bộ lọc thú cưng
  useEffect(() => {
    setCurrentPage(1);
  }, [petFilter, debouncedSearch]);

  const rows = useMemo(() => {
    if (isServerPaginated) return hoSoList;
    return hoSoList.filter((h) => {
      // Lọc theo tên bác sĩ (không phân biệt chữ hoa, chữ thường)
      if (debouncedSearch) {
        const docName = h.ten_bac_si || "";
        if (!docName.toLowerCase().includes(debouncedSearch.toLowerCase())) return false;
      }

      if (petFilter === "all") return true;
      const pet = thuCungs.find(p => String(p.id_thu_cung) === petFilter);
      if (pet && pet.ten_thu_cung === h.ten_thu_cung) return true;
      if (h.id_thu_cung && String(h.id_thu_cung) === petFilter) return true;
      return false;
    });
  }, [hoSoList, petFilter, thuCungs, debouncedSearch, isServerPaginated]);

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
        .item-card:hover { border-color: var(--primary) !important; background: var(--surface) !important; transform: translateY(-4px); box-shadow: 0 20px 40px rgba(15, 157, 138, 0.08); z-index: 10; position: relative; }
      `}</style>
      <div className="stagger-1" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', padding: '36px 48px', borderRadius: 'var(--radius-xl)', background: 'linear-gradient(135deg, #0284c7 0%, #2563eb 100%)', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 15px 30px rgba(37, 99, 235, 0.2)', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ position: 'absolute', top: '-50px', left: '-50px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', bottom: '-80px', right: '20%', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 950, letterSpacing: '-1px', margin: '0 0 8px 0' }}>Hồ sơ y tế 🩺</h1>
          <p style={{ fontWeight: 600, opacity: 0.9, margin: 0, fontSize: '1.05rem' }}>Minh bạch toàn bộ quá trình điều trị và sức khỏe của bé.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              className="btn"
              placeholder="Tìm tên bác sĩ..."
              value={searchDoctor}
              onChange={(e) => setSearchDoctor(e.target.value)}
              style={{ background: 'white', border: 'none', color: '#2563eb', fontWeight: 700, padding: '10px 36px 10px 16px', outline: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
            />
            {searchDoctor && (
              <span
                className="material-symbols-outlined"
                onClick={() => setSearchDoctor("")}
                style={{ position: 'absolute', right: '10px', cursor: 'pointer', color: 'var(--gray-400)', fontSize: '18px' }}
                title="Xóa tìm kiếm"
              >
                close
              </span>
            )}
          </div>
          <select
            className="btn"
            style={{ background: 'white', border: 'none', color: '#2563eb', cursor: 'pointer', textAlign: 'left', fontWeight: 800, boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
            value={petFilter}
            onChange={(e) => setPetFilter(e.target.value)}
          >
            <option value="all">Tất cả thú cưng</option>
            {thuCungs.map(pet => (
              <option key={pet.id_thu_cung} value={String(pet.id_thu_cung)}>{pet.ten_thu_cung}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="stagger-2" style={{ display: 'grid', gap: '32px' }}>
        {rows.length === 0 ? (
          <div className="glass-card" style={{ padding: '80px', textAlign: 'center', borderRadius: 'var(--radius-xl)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '64px', color: 'var(--gray-200)', marginBottom: '24px' }}>folder_off</span>
            <p style={{ fontSize: '1.2rem', color: 'var(--gray-400)', fontWeight: 700 }}>Chưa có bản ghi y tế nào cho thú cưng này.</p>
          </div>
        ) : currentRows.map((h) => (
          <div key={h.id_ho_so} className="glass-card item-card" style={{ padding: '40px', borderRadius: 'var(--radius-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div style={{ width: '64px', height: '64px', background: 'var(--primary-light)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>pets</span>
                </div>
                <div>
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--ink)', margin: 0 }}>{h.ten_thu_cung}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', color: 'var(--gray-400)', fontWeight: 700, fontSize: '0.85rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>event</span>
                    {chuyenNgayISO_SangVN(h.ngay_kham)}
                  </div>
                </div>
              </div>
              <span style={{
                padding: '8px 20px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 900,
                background: h.trang_thai_ho_so?.toLowerCase() === 'hoan_tat' ? 'var(--primary-light)' : 'var(--gray-50)',
                color: h.trang_thai_ho_so?.toLowerCase() === 'hoan_tat' ? 'var(--primary)' : 'var(--gray-400)'
              }}>
                {h.trang_thai_ho_so ? h.trang_thai_ho_so.toUpperCase() : 'HOÀN TẤT'}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
              <div style={{ background: 'var(--gray-50)', padding: '24px', borderRadius: '24px' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '8px' }}>BÁC SĨ CHỈ ĐỊNH</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '20px' }}>medical_information</span>
                  <b style={{ fontWeight: 800, color: 'var(--ink)' }}>{h.ten_bac_si || '—'}</b>
                </div>
              </div>
              <div style={{ background: 'var(--gray-50)', padding: '24px', borderRadius: '24px' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '8px' }}>CÂN NẶNG</p>
                <b style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--ink)' }}>{h.can_nang || '—'} <small>kg</small></b>
              </div>
              <div style={{ background: 'var(--gray-50)', padding: '24px', borderRadius: '24px' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '8px' }}>NHIỆT ĐỘ</p>
                <b style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--ink)' }}>{h.nhiet_do || '—'} <small>°C</small></b>
              </div>
              <div style={{ gridColumn: '1 / -1', background: 'var(--gray-50)', padding: '24px', borderRadius: '24px' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '8px' }}>TRIỆU CHỨNG LÂM SÀNG</p>
                <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ink)', margin: 0, lineHeight: '1.6' }}>{h.trieu_chung || '—'}</p>
              </div>
              <div style={{ gridColumn: '1 / -1', background: 'var(--primary-light)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(15, 157, 138, 0.2)' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '8px' }}>CHẨN ĐOÁN CỦA BÁC SĨ</p>
                <p style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--ink)', margin: 0, lineHeight: '1.6' }}>{h.chan_doan || '—'}</p>
              </div>
              <div style={{ gridColumn: '1 / -1', background: 'var(--gray-50)', padding: '24px', borderRadius: '24px' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '8px' }}>PHÁC ĐỒ ĐIỀU TRỊ</p>
                <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ink)', margin: 0, lineHeight: '1.6' }}>{h.phac_do_dieu_tri || '—'}</p>
              </div>
              <div style={{ gridColumn: '1 / -1', background: 'rgba(20, 184, 166, 0.1)', padding: '24px', borderRadius: '24px', border: '1px dashed rgba(20, 184, 166, 0.3)' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '8px' }}>HƯỚNG DẪN CHĂM SÓC TẠI NHÀ</p>
                <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ink)', margin: 0, lineHeight: '1.6' }}>{h.huong_dan_cham_soc || '—'}</p>
              </div>
            </div>
          </div>
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

export default React.memo(HoSoBenhAn);
