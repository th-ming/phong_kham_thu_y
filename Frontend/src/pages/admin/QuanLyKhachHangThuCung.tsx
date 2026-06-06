import React, { useState, useEffect } from "react";
import axiosInstance from "@services/axios";
import { toast } from "@components/Toast";
import { matchesSearchFields } from "@utils/index";
import { useAutoRefresh } from "@hooks/useAutoRefresh";
import { ModalThemKhachHang } from "./quan-ly-khach-hang-thu-cung/ModalThemKhachHang";
import { ModalThemThuCung } from "./quan-ly-khach-hang-thu-cung/ModalThemThuCung";

const QuanLyKhachHangThuCung: React.FC = () => {
  const [thuCung, setThuCung] = useState<any[]>([]);
  const [khachHang, setKhachHang] = useState<any[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true); // Tránh giật màn hình khi gõ phím
  const [scrollTop, setScrollTop] = useState(0);

  const ROW_HEIGHT = 72; // Chiều cao cố định mỗi dòng khách hàng
  const VISIBLE_HEIGHT = 432; // Hiển thị 6 dòng cùng lúc cùng thanh cuộn mượt mà
  const [showAddKhModal, setShowAddKhModal] = useState(false);
  const [showAddPetModal, setShowAddPetModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingPetId, setEditingPetId] = useState<number | null>(null);
  
  const [searchKhachHang, setSearchKhachHang] = useState("");
  const [searchThuCungInput, setSearchThuCungInput] = useState(""); // Lưu giá trị ô gõ phím thực tế
  const [searchThuCung, setSearchThuCung] = useState(""); // Lưu giá trị sau khi đã Debounce 300ms

  // State hỗ trợ Phân trang Server-side
  const [totalServerPages, setTotalServerPages] = useState(1);
  const [isServerPaginated, setIsServerPaginated] = useState(false);

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Form lưu thô data chủ nuôi mới, nạp thêm nam_sinh để phân loại GENZ vs MATURE ngay từ khi TIEP_TAN gõ đơn.
  // Ông nào sau này mở rộng form nhớ sync trường này lên CSDL khớp với Snake Case nam_sinh ở DB nha.
  const [khFormData, setKhFormData] = useState({ ten_khach_hang: "", sdt: "", email: "", nam_sinh: "" });
  const [petFormData, setPetFormData] = useState({
    ten_thu_cung: "", loai: "Chó", giong: "", gioi_tinh: "Đực",
    mau_sac: "", trong_luong: "", ngay_sinh: "", id_khach_hang: ""
  });

  const petFieldStyle: React.CSSProperties = {
    width: '100%',
    minWidth: 0,
    background: 'var(--gray-50)',
    textAlign: 'left',
    cursor: 'text',
    padding: '14px 16px',
    justifyContent: 'flex-start'
  };

  const petSelectStyle: React.CSSProperties = {
    ...petFieldStyle,
    cursor: 'pointer'
  };

  const filteredKhachHang = React.useMemo(() => {
    return khachHang.filter((kh) => {
      return matchesSearchFields(searchKhachHang, [
        kh.id_khach_hang,
        kh.ten_khach_hang,
        kh.sdt,
        kh.email,
        kh.dia_chi,
        kh.trang_thai,
        kh.ngay_tao
      ]);
    });
  }, [khachHang, searchKhachHang]);

  const fetchData = () => {
    Promise.all([
      axiosInstance.get("/api/thu-cung", {
        params: { page: currentPage - 1, size: ITEMS_PER_PAGE, search: searchThuCung }
      }),
      axiosInstance.get("/api/khach-hang")
    ])
      .then(([thuCungRes, khachHangRes]) => {
        if (thuCungRes.data && thuCungRes.data.content) {
          setThuCung(thuCungRes.data.content);
          setTotalServerPages(thuCungRes.data.totalPages);
          setIsServerPaginated(true);
        } else {
          setThuCung(thuCungRes.data || []);
          setIsServerPaginated(false);
        }
        setKhachHang(khachHangRes.data);
        setIsInitialLoading(false);
      })
      .catch(err => {
        console.error("Lỗi tải dữ liệu khách hàng thú cưng:", err);
        setIsInitialLoading(false);
      });
  };

  // Debounce tìm kiếm Thú cưng để tránh spam API liên tục khi gõ phím
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchThuCung(searchThuCungInput);
      setCurrentPage(1);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchThuCungInput]);

  useEffect(() => {
    fetchData();
  }, [currentPage, searchThuCung]);

  useAutoRefresh(fetchData, { runImmediately: false });

  // Bẫy nghiệp vụ đăng ký nhanh dành riêng cho TIEP_TAN hoặc ADMIN nhập lẹ khi khách đưa chó mèo tới phòng khám gấp.
  // API register-simple ở backend sẽ tự bóc sđt làm tên đăng nhập và tự hash pass ngẫu nhiên.
  // Nhớ reset sạch form kể cả nam_sinh để tránh lưu đè nhầm thông tin cho ca tiếp theo.
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await axiosInstance.post("/api/auth/register-simple", khFormData);
      setShowAddKhModal(false);
      // Dọn dẹp form hoàn toàn từ tên, sđt, email cho tới nam_sinh
      setKhFormData({ ten_khach_hang: "", sdt: "", email: "", nam_sinh: "" });
      fetchData();
      toast.success("Thêm khách hàng thành công!");
    } catch (err: any) {
      let errorMessage = "Lỗi khi thêm khách hàng.";
      if (err.response?.data) {
        const d = err.response.data;
        if (typeof d === 'string' && d.trim() !== '' && !d.startsWith('<')) errorMessage = d;
        else if (d.errors && Array.isArray(d.errors)) {
          const msgs = d.errors.map((x: any) => x.defaultMessage).filter(Boolean);
          if (msgs.length > 0) errorMessage = msgs.join(', ');
        } else if (d.message && typeof d.message === 'string') errorMessage = d.message;
      }
      const lowerMsg = errorMessage.toLowerCase();
      if (lowerMsg.includes('validation') || lowerMsg.includes('null')) errorMessage = "Thông tin không hợp lệ. Vui lòng điền đủ các trường bắt buộc.";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddPet = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        ...petFormData,
        id_khach_hang: petFormData.id_khach_hang,
        trong_luong: petFormData.trong_luong ? Number(petFormData.trong_luong) : 0,
        can_nang: petFormData.trong_luong ? Number(petFormData.trong_luong) : 0, // Fallback chống Crash DB
        giong_loai: petFormData.loai, // Fallback
        tuoi: 0,
        ...(editingPetId && { id_thu_cung: editingPetId })
      };

      if (!payload.ngay_sinh) delete (payload as any).ngay_sinh;

      if (editingPetId) {
        await axiosInstance.put(`/api/thu-cung/${editingPetId}`, payload);
        toast.success("Cập nhật thú cưng thành công!");
      } else {
        await axiosInstance.post("/api/thu-cung", payload);
        toast.success("Thêm thú cưng thành công!");
      }

      setShowAddPetModal(false);
      setEditingPetId(null);
      setPetFormData({ ten_thu_cung: "", loai: "Chó", giong: "", gioi_tinh: "Đực", mau_sac: "", trong_luong: "", ngay_sinh: "", id_khach_hang: "" });
      fetchData();
    } catch (err: any) {
      let errorMessage = "Lỗi khi lưu thú cưng.";
      if (err.response?.data) {
        const d = err.response.data;
        if (typeof d === 'string' && d.trim() !== '' && !d.startsWith('<')) errorMessage = d;
        else if (d.errors && Array.isArray(d.errors)) {
          const msgs = d.errors.map((x: any) => x.defaultMessage).filter(Boolean);
          if (msgs.length > 0) errorMessage = msgs.join(', ');
        } else if (d.message && typeof d.message === 'string') errorMessage = d.message;
      }
      const lowerMsg = errorMessage.toLowerCase();
      if (lowerMsg.includes('validation') || lowerMsg.includes('null')) errorMessage = "Vui lòng kiểm tra lại thông tin, đảm bảo nhập đúng định dạng và đủ các trường bắt buộc.";
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditPetClick = (pet: any) => {
    setEditingPetId(pet.id_thu_cung);
    setPetFormData({
      ten_thu_cung: pet.ten_thu_cung || "",
      loai: pet.loai || "Chó",
      giong: pet.giong || "",
      gioi_tinh: pet.gioi_tinh || "Đực",
      mau_sac: pet.mau_sac || "",
      trong_luong: pet.trong_luong ? String(pet.trong_luong) : (pet.can_nang ? String(pet.can_nang) : ""),
      ngay_sinh: pet.ngay_sinh ? pet.ngay_sinh.split('T')[0] : "",
      id_khach_hang: String(pet.id_khach_hang)
    });
    setShowAddPetModal(true);
  };

  const handleDeletePet = async (id: number) => {
    if (!id) {
      toast.error("Không tìm thấy mã thú cưng!");
      return;
    }
    if (window.confirm("Bạn có chắc chắn muốn xóa thú cưng này?")) {
      try {
        await axiosInstance.delete(`/api/thu-cung/${id}`);
        toast.success("Xóa thú cưng thành công!");
        fetchData();
      } catch (err: any) {
        let errorMessage = "Không thể xóa thú cưng. Bé có thể đang có lịch hẹn hoặc bệnh án.";
        if (err.response?.data) {
          const d = err.response.data;
          if (typeof d === 'string' && d.trim() !== '' && !d.startsWith('<')) errorMessage = d;
          else if (d.message && typeof d.message === 'string') errorMessage = d.message;
        }
        const lowerMsg = errorMessage.toLowerCase();
        if (lowerMsg.includes('constraint') || lowerMsg.includes('foreign key')) {
          errorMessage = "Không thể xóa vì thú cưng này đang có lịch hẹn hoặc hồ sơ bệnh án.";
        }
        toast.error(errorMessage);
      }
    }
  };

  const openAddPetModal = () => {
    setEditingPetId(null);
    setPetFormData({ ten_thu_cung: "", loai: "Chó", giong: "", gioi_tinh: "Đực", mau_sac: "", trong_luong: "", ngay_sinh: "", id_khach_hang: "" });
    setShowAddPetModal(true);
  };

  const handleLockKhachHang = async (id: number) => {
    if (window.confirm("Khóa tài khoản khách hàng này? Họ sẽ không thể đăng nhập cho đến khi Admin mở khóa.")) {
      try {
        await axiosInstance.delete(`/api/khach-hang/${id}`);
        toast.success("Đã khóa tài khoản khách hàng!");
        fetchData();
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Lỗi khi khóa tài khoản.");
      }
    }
  };

  const handleUnlockKhachHang = async (id: number) => {
    if (window.confirm("Phục hồi và mở khóa tài khoản khách hàng này?")) {
      try {
        await axiosInstance.put(`/api/khach-hang/${id}/unlock`);
        toast.success("Đã mở khóa tài khoản thành công!");
        fetchData();
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Lỗi khi mở khóa tài khoản.");
      }
    }
  };

  const getTenKhachHang = (id: number) => {
    const kh = khachHang.find(k => k.id_khach_hang === id);
    return kh ? kh.ten_khach_hang : `KH-${id}`;
  };

  const totalPages = isServerPaginated ? totalServerPages : Math.ceil(thuCung.length / ITEMS_PER_PAGE);
  const currentRows = isServerPaginated ? thuCung : thuCung.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  if (isInitialLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div className="dot-pulse"></div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div className="admin-mobile-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-1px' }}>Khách hàng & Thú cưng</h1>
          <p style={{ color: 'var(--gray-500)', fontWeight: 600 }}>Quản lý thông tin chủ nuôi và các bạn nhỏ trong hệ thống.</p>
        </div>
        <div className="admin-mobile-actions" style={{ display: 'flex', gap: '12px' }}>
          <button data-ai-id="button-quanlykhachhangthucung-pac0" className="btn btn-pill" style={{ background: 'var(--gray-50)', color: 'var(--ink)' }} onClick={() => setShowAddKhModal(true)}>
            <span className="material-symbols-outlined">person_add</span>
            Thêm chủ nuôi
          </button>
          <button data-ai-id="button-quanlykhachhangthucung-324x" className="btn btn-primary btn-pill" onClick={openAddPetModal}>
            <span className="material-symbols-outlined">pets</span>
            Thêm bé mới
          </button>
        </div>
      </div>

      <style>{`
        .admin-customer-mobile-list,
        .admin-pet-mobile-list {
          display: none;
        }
        .virtual-row-hover {
          transition: background-color 0.25s cubic-bezier(0.4, 0, 0.2, 1), transform 0.15s ease;
        }
        .virtual-row-hover:hover {
          background-color: var(--gray-50) !important;
        }
        @keyframes slideUpFade { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
        .admin-customer-card, .admin-pet-card { transition: transform 0.2s ease, box-shadow 0.2s ease; animation: slideUpFade 0.4s cubic-bezier(.22,.68,0,1.2) both; }
        .admin-customer-card:hover, .admin-pet-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
        @media screen and (max-width: 1024px) {
          .admin-customer-mobile-list,
          .admin-pet-mobile-list {
            display: grid !important;
            gap: 10px;
            padding: 10px;
          }
          .admin-customer-desktop-table,
          .admin-pet-desktop-table {
            display: none !important;
          }
          .admin-customer-card,
          .admin-pet-card {
            display: grid;
            gap: 10px;
            padding: 12px;
            border-radius: 18px;
            background: var(--surface);
            border: 1px solid var(--gray-100);
          }
          .admin-customer-card-top,
          .admin-pet-card-top {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 10px;
            align-items: start;
          }
          .admin-customer-card h3,
          .admin-pet-card h3 {
            margin: 0;
            color: var(--ink);
            font-size: 0.95rem;
            line-height: 1.22;
            font-weight: 950;
            overflow-wrap: anywhere;
          }
          .admin-customer-card p,
          .admin-pet-card p {
            margin: 4px 0 0;
            color: var(--gray-500);
            font-size: 0.72rem;
            line-height: 1.35;
            font-weight: 700;
            overflow-wrap: anywhere;
          }
          .admin-customer-status,
          .admin-pet-meta-chip {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 28px;
            padding: 5px 9px;
            border-radius: 999px;
            font-size: 0.66rem;
            line-height: 1;
            font-weight: 950;
            white-space: nowrap;
          }
          .admin-customer-status {
            background: rgba(34,197,94,0.12);
            color: #16a34a;
          }
          .admin-customer-status.locked {
            background: rgba(239,68,68,0.12);
            color: var(--danger);
          }
          .admin-pet-meta {
            display: flex;
            flex-wrap: wrap;
            gap: 7px;
          }
          .admin-pet-meta-chip {
            background: var(--primary-light);
            color: var(--primary);
          }
          .admin-customer-card .btn,
          .admin-pet-card .btn {
            width: 100%;
            min-height: 36px;
            justify-content: center;
            border-radius: 13px !important;
            padding: 7px 10px !important;
          }
          .admin-pet-actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }
        }
      `}</style>

      {/* BẢNG QUẢN LÝ KHÁCH HÀNG */}
      <div className="glass-card" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', marginBottom: '32px' }}>
        <div className="admin-mobile-card-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', background: 'var(--surface)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--ink)', margin: 0 }}>
            Danh sách khách hàng ({filteredKhachHang.length})
          </h2>
          <div className="glass-card admin-mobile-search-box" style={{ display: 'flex', alignItems: 'center', padding: '0 16px', borderRadius: '16px', border: '1px solid var(--gray-200)', background: 'var(--surface)', width: '300px', maxWidth: '100%' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--gray-400)', marginRight: '8px' }}>search</span>
            <input data-ai-id="input-quanlykhachhangthucung-ous7"
              type="text"
              placeholder="Tìm khách hàng, số điện thoại..."
              value={searchKhachHang}
              onChange={(e) => setSearchKhachHang(e.target.value)}
              style={{ border: 'none', outline: 'none', background: 'transparent', padding: '10px 0', fontWeight: 600, width: '100%', color: 'var(--ink)', fontSize: '0.9rem' }}
            />
          </div>
        </div>

        <div className="admin-customer-mobile-list">
          {filteredKhachHang.length === 0 ? (
            <div className="admin-empty-state" style={{ padding: '18px 10px', textAlign: 'center', color: 'var(--gray-500)', fontWeight: 800 }}>
              Không tìm thấy chủ nuôi nào phù hợp.
            </div>
          ) : filteredKhachHang.slice(0, 30).map((kh: any) => (
            <article key={kh.id_khach_hang} className="admin-customer-card">
              <div className="admin-customer-card-top">
                <div>
                  <h3 style={{ textDecoration: kh.da_xoa ? 'line-through' : 'none', color: kh.da_xoa ? 'var(--gray-400)' : 'var(--ink)' }}>
                    {kh.ten_khach_hang || 'Khách hàng chưa cập nhật'}
                  </h3>
                  <p>{kh.sdt || 'Chưa có SĐT'} · {kh.email || 'Chưa có email'}</p>
                </div>
                <span className={`admin-customer-status ${kh.da_xoa ? 'locked' : ''}`}>{kh.da_xoa ? 'Đã khóa' : 'Hoạt động'}</span>
              </div>
              <p>{kh.nam_sinh ? `Năm sinh ${kh.nam_sinh}` : 'Chưa cập nhật năm sinh'}</p>
              {kh.da_xoa ? (
                <button data-ai-id="button-quanlykhachhangthucung-mobile-unlock" className="btn btn-pill" onClick={() => handleUnlockKhachHang(kh.id_khach_hang)} style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#16a34a' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>lock_open</span>
                  Mở khóa
                </button>
              ) : (
                <button data-ai-id="button-quanlykhachhangthucung-mobile-lock" className="btn btn-pill" onClick={() => handleLockKhachHang(kh.id_khach_hang)} style={{ background: 'var(--danger-light, rgba(239, 68, 68, 0.15))', color: 'var(--danger)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>lock</span>
                  Khóa
                </button>
              )}
            </article>
          ))}
        </div>
        <div className="table-responsive-wrapper admin-customer-desktop-table">
          <div style={{ minWidth: '800px' }}>

        {/* Tiêu đề cột dạng CSS Grid - layout 5 cột cao cấp và khoa học */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1.5fr 1fr 1.2fr 0.8fr 1fr', 
          background: 'var(--gray-50)', 
          padding: '16px 20px',
          borderBottom: '1px solid var(--gray-100)',
          boxSizing: 'border-box'
        }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>TÊN KHÁCH HÀNG</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>NĂM SINH</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>LIÊN HỆ</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>TRẠNG THÁI</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800, textAlign: 'center' }}>THAO TÁC</div>
        </div>

        {/* Thân danh sách cuộn ảo hiệu năng cao */}
        <div 
          onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
          style={{ 
            height: `${VISIBLE_HEIGHT}px`, 
            overflowY: 'auto', 
            position: 'relative',
            background: 'var(--surface)'
          }}
        >
          {filteredKhachHang.length === 0 ? (
            <div className="admin-empty-state" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--gray-400)', fontWeight: 700 }}>
              Không tìm thấy chủ nuôi nào phù hợp.
            </div>
          ) : (
            <div style={{ height: `${filteredKhachHang.length * ROW_HEIGHT}px`, position: 'relative', width: '100%' }}>
              {(() => {
                const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 1);
                const endIndex = Math.min(filteredKhachHang.length, Math.ceil((scrollTop + VISIBLE_HEIGHT) / ROW_HEIGHT) + 1);
                const visibleCustomers = filteredKhachHang.slice(startIndex, endIndex);

                return visibleCustomers.map((kh: any, idx: number) => {
                  const globalIndex = startIndex + idx;
                  return (
                    <div 
                      key={kh.id_khach_hang} 
                      className="virtual-row-hover"
                      style={{
                        position: 'absolute',
                        top: `${globalIndex * ROW_HEIGHT}px`,
                        left: 0,
                        width: '100%',
                        height: `${ROW_HEIGHT}px`,
                        display: 'grid',
                        gridTemplateColumns: '1.5fr 1fr 1.2fr 0.8fr 1fr',
                        alignItems: 'center',
                        borderBottom: '1px solid var(--gray-50)',
                        padding: '0 20px',
                        boxSizing: 'border-box'
                      }}
                    >
                      {/* Tên khách hàng */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', background: kh.da_xoa ? 'rgba(239,68,68,0.1)' : 'var(--primary-light)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: kh.da_xoa ? 'var(--danger)' : 'var(--primary)' }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{kh.da_xoa ? 'person_off' : 'person'}</span>
                        </div>
                        <span style={{ fontWeight: 800, color: kh.da_xoa ? 'var(--gray-400)' : 'var(--ink)', textDecoration: kh.da_xoa ? 'line-through' : 'none', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {kh.ten_khach_hang}
                        </span>
                      </div>

                      {/* Lọc năm sinh của chủ nuôi ra đây để TIEP_TAN nhìn phát biết ngay khách thuộc lứa GENZ hay MATURE */}
                      {/* Mục đích: Biết đường sync tone giọng nhây/nghiêm túc của AI chatbot và giao diện meme cho chuẩn chỉ. */}
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--ink)' }}>
                          {kh.nam_sinh ? `${kh.nam_sinh}` : "—"}
                        </div>
                        {kh.nam_sinh ? (
                          <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 700 }}>
                            {kh.nam_sinh >= 1997 ? "Khách trẻ" : "Khách trưởng thành"}
                          </div>
                        ) : null}
                      </div>

                      {/* Liên hệ */}
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{kh.sdt || '—'}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{kh.email || ''}</div>
                      </div>

                      {/* Trạng thái */}
                      <div>
                        <span style={{
                          padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 900,
                          background: kh.da_xoa ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
                          color: kh.da_xoa ? 'var(--danger)' : '#16a34a'
                        }}>
                          {kh.da_xoa ? 'Đã khóa' : 'Hoạt động'}
                        </span>
                      </div>

                      {/* Thao tác */}
                      <div style={{ textAlign: 'center', display: 'flex', justifyContent: 'center' }}>
                        {kh.da_xoa ? (
                          <button data-ai-id="button-quanlykhachhangthucung-6qtm"
                            className="btn btn-pill"
                            onClick={() => handleUnlockKhachHang(kh.id_khach_hang)}
                            style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#16a34a', padding: '6px 14px', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>lock_open</span>
                            Mở khóa
                          </button>
                        ) : (
                          <button data-ai-id="button-quanlykhachhangthucung-f9k2"
                            className="btn btn-pill"
                            onClick={() => handleLockKhachHang(kh.id_khach_hang)}
                            style={{ background: 'var(--danger-light, rgba(239, 68, 68, 0.15))', color: 'var(--danger)', padding: '6px 14px', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>lock</span>
                            Khóa
                          </button>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          )}
        </div>
        </div>
      </div>
      </div>

      {/* BẢNG QUẢN LÝ THÚ CƯNG */}
      <div className="glass-card" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
        <div className="admin-mobile-card-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', background: 'var(--surface)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--ink)', margin: 0 }}>Danh sách thú cưng ({thuCung.length})</h2>
          <div className="glass-card admin-mobile-search-box" style={{ display: 'flex', alignItems: 'center', padding: '0 16px', borderRadius: '16px', border: '1px solid var(--gray-200)', background: 'var(--surface)', width: '300px', maxWidth: '100%' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--gray-400)', marginRight: '8px' }}>search</span>
            <input data-ai-id="input-quanlykhachhangthucung-1lnd"
              type="text"
              placeholder="Tìm tên bé, loài, giống..."
              value={searchThuCungInput}
              onChange={(e) => setSearchThuCungInput(e.target.value)}
              style={{ border: 'none', outline: 'none', background: 'transparent', padding: '10px 0', fontWeight: 600, width: '100%', color: 'var(--ink)', fontSize: '0.9rem' }}
            />
          </div>
        </div>
        <div className="admin-pet-mobile-list">
          {currentRows.length === 0 ? (
            <div className="admin-empty-state" style={{ padding: '18px 10px', textAlign: 'center', color: 'var(--gray-500)', fontWeight: 800 }}>
              Không có thú cưng phù hợp.
            </div>
          ) : currentRows.map((t) => (
            <article key={t.id_thu_cung} className="admin-pet-card">
              <div className="admin-pet-card-top">
                <div>
                  <h3>{t.ten_thu_cung || 'Chưa có tên'}</h3>
                  <p>Chủ: {getTenKhachHang(t.id_khach_hang)}</p>
                </div>
                <span className="admin-pet-meta-chip">#{t.id_thu_cung}</span>
              </div>
              <div className="admin-pet-meta">
                <span className="admin-pet-meta-chip">{t.loai || 'Chưa rõ loài'}</span>
                <span className="admin-pet-meta-chip">{t.giong || 'Chưa rõ giống'}</span>
                <span className="admin-pet-meta-chip">{t.trong_luong ?? '—'} kg</span>
              </div>
              <p>{t.gioi_tinh || 'Chưa rõ giới tính'} · {t.mau_sac || 'Không rõ màu'}{t.ngay_sinh ? ` · Sinh ${new Date(t.ngay_sinh).getFullYear()}` : ''}</p>
              <div className="admin-pet-actions">
                <button data-ai-id="button-quanlykhachhangthucung-mobile-edit-pet" className="btn" onClick={() => handleEditPetClick(t)} style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                </button>
                <button data-ai-id="button-quanlykhachhangthucung-mobile-delete-pet" className="btn" onClick={() => handleDeletePet(t.id_thu_cung)} style={{ background: 'var(--danger-light, rgba(239, 68, 68, 0.15))', color: 'var(--danger)' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                </button>
              </div>
            </article>
          ))}
        </div>
        <div className="table-responsive-wrapper admin-pet-desktop-table">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--gray-50)', textAlign: 'left' }}>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>ID</th>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>THÚ CƯNG</th>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>ĐẶC ĐIỂM</th>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>CHỦ SỞ HỮU</th>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>THỂ TRẠNG</th>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800, textAlign: 'center' }}>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {currentRows.length === 0 ? (
              <tr>
                <td className="admin-empty-state" colSpan={6} style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--gray-500)', fontWeight: 700 }}>
                  Không có thú cưng phù hợp.
                </td>
              </tr>
            ) : currentRows.map((t) => (
              <tr key={t.id_thu_cung} style={{ borderBottom: '1px solid var(--gray-50)', transition: 'all 0.2s' }}>
                <td style={{ padding: '20px', fontWeight: 800, color: 'var(--gray-400)' }}>#{t.id_thu_cung}</td>
                <td style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', background: 'var(--primary-light)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>pets</span>
                    </div>
                    <span style={{ fontWeight: 800, color: 'var(--ink)' }}>{t.ten_thu_cung}</span>
                  </div>
                </td>
                <td style={{ padding: '20px' }}>
                  <div style={{ fontWeight: 700 }}>{t.loai || '—'} - {t.giong || '—'}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 600 }}>
                    {t.gioi_tinh || 'Chưa rõ GT'} • {t.mau_sac || 'Không rõ màu'}
                  </div>
                </td>
                <td style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--gray-400)' }}>person</span>
                    <span style={{ fontWeight: 700 }}>{getTenKhachHang(t.id_khach_hang)}</span>
                  </div>
                </td>
                <td style={{ padding: '20px' }}>
                  <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '4px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 800, marginRight: '8px' }}>
                    {t.trong_luong ?? '—'} kg
                  </span>
                  {t.ngay_sinh && (
                    <span style={{ background: 'var(--gray-50)', color: 'var(--gray-500)', padding: '4px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 800 }}>
                      Sinh: {new Date(t.ngay_sinh).getFullYear()}
                    </span>
                  )}
                </td>
                <td style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button data-ai-id="button-quanlykhachhangthucung-plw0" className="btn" onClick={() => handleEditPetClick(t)} style={{ padding: '8px', background: 'var(--primary-light)', color: 'var(--primary)' }} title="Chỉnh sửa">
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                    <button data-ai-id="button-quanlykhachhangthucung-nf2l" className="btn" onClick={() => handleDeletePet(t.id_thu_cung)} style={{ padding: '8px', background: 'var(--danger-light, rgba(239, 68, 68, 0.15))', color: 'var(--danger)' }} title="Xóa thú cưng">
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      {/* BỘ NÚT ĐIỀU HƯỚNG PHÂN TRANG */}
      {totalPages > 1 && (
        <div className="stagger-2" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '20px', marginBottom: '20px' }}>
          <button data-ai-id="button-quanlykhachhangthucung-me5f"
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
          <button data-ai-id="button-quanlykhachhangthucung-dom5"
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

      {/* MODAL THÊM KHÁCH HÀNG - Được tách dạng module gọn gàng */}
      <ModalThemKhachHang
        isOpen={showAddKhModal}
        onClose={() => setShowAddKhModal(false)}
        khFormData={khFormData}
        setKhFormData={setKhFormData}
        onSubmit={handleAddCustomer}
        isSaving={isSaving}
      />

      {/* MODAL THÊM THÚ CƯNG - Được tách dạng module gọn gàng */}
      <ModalThemThuCung
        isOpen={showAddPetModal}
        onClose={() => setShowAddPetModal(false)}
        editingPetId={editingPetId}
        petFormData={petFormData}
        setPetFormData={setPetFormData}
        khachHang={khachHang}
        onSubmit={handleAddPet}
        isSaving={isSaving}
        petSelectStyle={petSelectStyle}
        petFieldStyle={petFieldStyle}
      />
    </div>
  );
};

export default React.memo(QuanLyKhachHangThuCung);
