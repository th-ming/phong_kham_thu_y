import React, { useCallback, useMemo, useRef, useState, useEffect } from "react";
import axiosInstance from "@services/axios";
import { getUserProfile, matchesSearchFields, fixVietnameseEncoding } from "@utils/index";
import { useAutoRefresh } from "@hooks/useAutoRefresh";

const chuyenNgayISO_SangVN = (dateString: string) => {
  if (!dateString) return "—";
  const parts = dateString.split('T')[0].split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateString;
};

const extractArray = (data: any) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.result)) return data.result;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.records)) return data.records;
  return [];
};

const getCustomerId = (user: any) => user?.id_khach_hang ?? user?.idKhachHang ?? user?.id_tai_khoan ?? user?.idTaiKhoan ?? user?.id;
const getPetId = (item: any) => item?.id_thu_cung ?? item?.idThuCung ?? item?.id;
const getPetName = (item: any) => item?.ten_thu_cung ?? item?.tenThuCung ?? "—";
const getMedicalRecordId = (item: any) => item?.id_ho_so ?? item?.idHoSo ?? item?.id;
const isPetActive = (pet: any) => pet?.da_xoa !== true && pet?.daXoa !== true;

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
  const hasLoadedRef = useRef(false);

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const fetchMedicalRecords = useCallback(async () => {
    const user = getUserProfile();
    if (!user) {
      setLoading(false);
      return;
    }
    const id = getCustomerId(user);
    if (!id) {
      setLoading(false);
      return;
    }

    if (!hasLoadedRef.current) {
      setLoading(true);
    }
    await Promise.allSettled([
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
          setHoSoList(extractArray(data));
          setIsServerPaginated(false);
        }
      }

      // Xử lý danh sách thú cưng
      if (thuCungRes.status === 'fulfilled') {
        setThuCungs(extractArray(thuCungRes.value.data).filter(isPetActive));
      }

      hasLoadedRef.current = true;
      setLoading(false);
    }).catch(err => {
      console.error("Lỗi đồng bộ dữ liệu:", err);
      hasLoadedRef.current = true;
      setLoading(false);
    });
  }, [currentPage, debouncedSearch, petFilter]);

  useEffect(() => {
    fetchMedicalRecords();
  }, [fetchMedicalRecords]);

  useAutoRefresh(fetchMedicalRecords, { runImmediately: false });

  useEffect(() => {
    const handleRealtimeUpdate = () => {
      fetchMedicalRecords();
    };
    window.addEventListener("rexi-data-changed", handleRealtimeUpdate);
    return () => window.removeEventListener("rexi-data-changed", handleRealtimeUpdate);
  }, [fetchMedicalRecords]);

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
      if (debouncedSearch) {
        if (!matchesSearchFields(debouncedSearch, [
          h.ma_ho_so, h.maHoSo, h.id_ho_so, h.idHoSo,
          h.ten_bac_si, h.tenBacSi,
          h.ten_thu_cung, h.tenThuCung,
          h.chan_doan, h.chanDoan,
          h.trieu_chung, h.trieuChung,
          h.phac_do_dieu_tri, h.phacDoDieuTri,
          h.huong_dan_cham_soc, h.huongDanChamSoc,
          h.trang_thai_ho_so, h.trangThaiHoSo,
        ])) return false;
      }

      if (petFilter === "all") return true;
      const recordPetId = getPetId(h);
      if (recordPetId && String(recordPetId) === petFilter) return true;
      const pet = thuCungs.find(p => String(getPetId(p)) === petFilter);
      if (pet && getPetName(pet) === getPetName(h)) return true;
      return false;
    });
  }, [hoSoList, petFilter, thuCungs, debouncedSearch, isServerPaginated]);

  // Tính toán dữ liệu hiển thị cho trang hiện tại
  const totalPages = isServerPaginated ? totalServerPages : Math.ceil(rows.length / ITEMS_PER_PAGE);
  const currentRows = isServerPaginated ? rows : rows.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><div className="dot-pulse"></div></div>;

  return (
    <div className="animate-fade-in customer-medical-page">
      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .stagger-1 { animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both; }
        .stagger-2 { animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both; }
        .item-card {
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1) !important;
          border-radius: 24px !important;
          backdrop-filter: blur(16px);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02), 0 1px 8px rgba(0, 0, 0, 0.01) !important;
          border: 1.5px solid var(--gray-150) !important;
          background: var(--surface);
        }
        .item-card:hover {
          transform: translateY(-6px) !important;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.06), 0 1px 12px rgba(0, 0, 0, 0.02) !important;
        }
        .item-card.cat-theme {
          background: linear-gradient(135deg, var(--surface) 0%, rgba(244, 63, 94, 0.06) 100%);
          border-color: rgba(244, 63, 94, 0.16) !important;
        }
        .item-card.cat-theme:hover {
          border-color: rgba(244, 63, 94, 0.5) !important;
          box-shadow: 0 20px 40px rgba(244, 63, 94, 0.08), 0 1px 12px rgba(0, 0, 0, 0.02) !important;
        }
        .item-card.dog-theme {
          background: linear-gradient(135deg, var(--surface) 0%, rgba(16, 185, 129, 0.06) 100%);
          border-color: rgba(16, 185, 129, 0.16) !important;
        }
        .item-card.dog-theme:hover {
          border-color: rgba(16, 185, 129, 0.5) !important;
          box-shadow: 0 20px 40px rgba(16, 185, 129, 0.08), 0 1px 12px rgba(0, 0, 0, 0.02) !important;
        }
        @media (max-width: 768px) {
          .customer-medical-page {
            display: grid;
            gap: 18px;
            padding-bottom: 92px;
          }
          .customer-medical-hero {
            display: grid !important;
            gap: 18px !important;
            align-items: start !important;
            margin-bottom: 0 !important;
            padding: 24px !important;
            border-radius: 28px !important;
          }
          .customer-medical-hero h1 {
            font-size: 1.75rem !important;
            line-height: 1.08 !important;
            letter-spacing: 0 !important;
          }
          .customer-medical-hero p {
            font-size: 0.9rem !important;
            line-height: 1.5 !important;
          }
          .customer-medical-filters {
            display: grid !important;
            grid-template-columns: 1fr;
            gap: 10px !important;
          }
          .customer-medical-filters > div,
          .customer-medical-filters input,
          .customer-medical-filters select {
            width: 100% !important;
          }
          .customer-medical-list {
            gap: 14px !important;
          }
          .customer-medical-card {
            padding: 18px !important;
            border-radius: 24px !important;
          }
          .customer-medical-card-header {
            display: grid !important;
            gap: 14px !important;
            align-items: start !important;
            margin-bottom: 18px !important;
          }
          .customer-medical-card-title {
            gap: 12px !important;
            align-items: flex-start !important;
          }
          .customer-medical-card-title > div:first-child {
            width: 48px !important;
            height: 48px !important;
            border-radius: 16px !important;
          }
          .customer-medical-card h3 {
            font-size: 1.12rem !important;
          }
          .customer-medical-info-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .customer-medical-info-grid > div {
            padding: 16px !important;
            border-radius: 18px !important;
          }
        }
      `}</style>
      <div className="stagger-1 customer-medical-hero" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', padding: '36px 48px', borderRadius: 'var(--radius-xl)', background: 'var(--secondary-gradient)', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 15px 30px rgba(37, 99, 235, 0.2)', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ position: 'absolute', top: '-50px', left: '-50px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', bottom: '-80px', right: '20%', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 950, letterSpacing: '-1px', margin: '0 0 8px 0' }}>Hồ sơ y tế 🩺</h1>
          <p style={{ fontWeight: 600, opacity: 0.9, margin: 0, fontSize: '1.05rem' }}>Minh bạch toàn bộ quá trình điều trị và sức khỏe của bé.</p>
        </div>
        <div className="customer-medical-filters" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', zIndex: 2, color: '#475569', fontSize: '20px', pointerEvents: 'none' }}>search</span>
            <input data-ai-id="input-hosobenhan-1g80"
              type="text"
              className="btn"
              placeholder="Tìm bác sĩ, bé, chẩn đoán..."
              value={searchDoctor}
              onChange={(e) => setSearchDoctor(e.target.value)}
              style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(15, 23, 42, 0.08)', color: '#0f172a', fontWeight: 700, padding: '12px 38px 12px 46px', outline: 'none', borderRadius: '999px', boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)' }}
            />
            {searchDoctor && (
              <span
                className="material-symbols-outlined"
                onClick={() => setSearchDoctor("")}
                style={{ position: 'absolute', right: '12px', cursor: 'pointer', color: '#64748b', fontSize: '18px' }}
                title="Xóa tìm kiếm"
              >
                close
              </span>
            )}
          </div>
          <select data-ai-id="select-hosobenhan-jt9q"
            className="btn"
            style={{ background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(15, 23, 42, 0.08)', color: '#0f172a', cursor: 'pointer', textAlign: 'left', fontWeight: 800, borderRadius: '999px', boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)' }}
            value={petFilter}
            onChange={(e) => setPetFilter(e.target.value)}
          >
            <option value="all">Tất cả thú cưng</option>
            {thuCungs.map(pet => (
              <option key={getPetId(pet)} value={String(getPetId(pet))}>{getPetName(pet)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="stagger-2 customer-medical-list" style={{ display: 'grid', gap: '32px' }}>
        {rows.length === 0 ? (
          <div className="glass-card" style={{ padding: '80px', textAlign: 'center', borderRadius: 'var(--radius-xl)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '64px', color: 'var(--gray-200)', marginBottom: '24px' }}>folder_off</span>
            <p style={{ fontSize: '1.2rem', color: 'var(--gray-400)', fontWeight: 700 }}>Chưa có bản ghi y tế nào cho thú cưng này.</p>
          </div>
        ) : currentRows.map((h) => {
          const pet = thuCungs.find(p => String(getPetId(p)) === String(h.id_thu_cung ?? h.idThuCung) || getPetName(p) === getPetName(h));
          const loai = pet?.loai;
          const isCat = (loai || "").toLowerCase().match(/(mèo|meo|cat)/);
          const isDog = (loai || "").toLowerCase().match(/(chó|cho|dog)/);
          const themeClass = isCat ? "cat-theme" : isDog ? "dog-theme" : "";
          return (
            <div key={getMedicalRecordId(h)} className={`glass-card item-card customer-medical-card ${themeClass}`} style={{ padding: '40px' }}>
              <div className="customer-medical-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div className="customer-medical-card-title" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    background: isCat ? 'rgba(244, 63, 94, 0.15)' : isDog ? 'rgba(16, 185, 129, 0.15)' : 'var(--primary-light)',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isCat ? '#e11d48' : isDog ? '#059669' : 'var(--primary)',
                    fontSize: '2rem'
                  }}>
                    {isCat ? '🐱' : isDog ? '🐶' : '🐾'}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--ink)', margin: 0 }}>{getPetName(h)}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px', color: 'var(--gray-400)', fontWeight: 700, fontSize: '0.85rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>event</span>
                    {chuyenNgayISO_SangVN(h.ngay_kham ?? h.ngayKham)}
                  </div>
                </div>
              </div>
              <span style={{
                padding: '8px 20px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 900,
                background: (h.trang_thai_ho_so ?? h.trangThaiHoSo ?? h.trang_thai ?? h.trangThai)?.toLowerCase() === 'hoan_tat' ? 'var(--primary-light)' : 'var(--gray-50)',
                color: (h.trang_thai_ho_so ?? h.trangThaiHoSo ?? h.trang_thai ?? h.trangThai)?.toLowerCase() === 'hoan_tat' ? 'var(--primary)' : 'var(--gray-400)'
              }}>
                {(h.trang_thai_ho_so ?? h.trangThaiHoSo ?? h.trang_thai ?? h.trangThai)?.toUpperCase() || 'HOÀN TẤT'}
              </span>
            </div>

            <div className="customer-medical-info-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
              <div style={{ background: 'var(--gray-50)', padding: '24px', borderRadius: '24px' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '8px' }}>BÁC SĨ CHỈ ĐỊNH</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '20px' }}>medical_information</span>
                  <b style={{ fontWeight: 800, color: 'var(--ink)' }}>{h.ten_bac_si ?? h.tenBacSi ?? '—'}</b>
                </div>
              </div>
              <div style={{ background: 'var(--gray-50)', padding: '24px', borderRadius: '24px' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '8px' }}>CÂN NẶNG</p>
                <b style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--ink)' }}>{h.can_nang ?? h.canNang ?? '—'} <small>kg</small></b>
              </div>
              <div style={{ background: 'var(--gray-50)', padding: '24px', borderRadius: '24px' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '8px' }}>NHIỆT ĐỘ</p>
                <b style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--ink)' }}>{h.nhiet_do ?? h.nhietDo ?? '—'} <small>°C</small></b>
              </div>
              <div style={{ gridColumn: '1 / -1', background: 'var(--gray-50)', padding: '24px', borderRadius: '24px' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '8px' }}>TRIỆU CHỨNG LÂM SÀNG</p>
                <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ink)', margin: 0, lineHeight: '1.6' }}>{fixVietnameseEncoding(h.trieu_chung ?? h.trieuChung) || '—'}</p>
              </div>
              <div style={{ gridColumn: '1 / -1', background: 'var(--primary-light)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(15, 157, 138, 0.2)' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '8px' }}>CHẨN ĐOÁN CỦA BÁC SĨ</p>
                <p style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--ink)', margin: 0, lineHeight: '1.6' }}>{fixVietnameseEncoding(h.chan_doan ?? h.chanDoan) || '—'}</p>
              </div>
              <div style={{ gridColumn: '1 / -1', background: 'var(--gray-50)', padding: '24px', borderRadius: '24px' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '8px' }}>PHÁC ĐỒ ĐIỀU TRỊ</p>
                <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ink)', margin: 0, lineHeight: '1.6' }}>{fixVietnameseEncoding(h.phac_do_dieu_tri ?? h.phacDoDieuTri) || '—'}</p>
              </div>
              <div style={{ gridColumn: '1 / -1', background: 'rgba(20, 184, 166, 0.1)', padding: '24px', borderRadius: '24px', border: '1px dashed rgba(20, 184, 166, 0.3)' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '8px' }}>HƯỚNG DẪN CHĂM SÓC TẠI NHÀ</p>
                <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--ink)', margin: 0, lineHeight: '1.6' }}>{fixVietnameseEncoding(h.huong_dan_cham_soc ?? h.huongDanChamSoc) || '—'}</p>
              </div>
            </div>
          </div>
          );
        })}

        {/* BỘ NÚT ĐIỀU HƯỚNG PHÂN TRANG */}
        {totalPages > 1 && (
          <div className="stagger-2" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '20px' }}>
            <button data-ai-id="button-hosobenhan-hnwe"
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
            <button data-ai-id="button-hosobenhan-b589"
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
