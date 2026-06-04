import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import axiosInstance from "@services/axios";
import { getCustomerIdFromProfile, getUserProfile, matchesSearchFields } from "@utils/index";
import { toast } from "@components/Toast";
import { Skeleton } from "@components/CommonUI";
import { useAutoRefresh } from "@hooks/useAutoRefresh";

const chuyenNgayISO_SangVN = (dateString: string) => {
  if (!dateString || typeof dateString !== 'string') return "—";
  // Ép kiểu chuỗi thay vì dùng new Date() để tránh bị nhảy lùi 1 ngày do lệch múi giờ
  const parts = dateString.split('T')[0].split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateString;
};

const tinhTuoi = (ngaySinh: string) => {
  if (!ngaySinh || typeof ngaySinh !== 'string') return '';
  const diff = Date.now() - new Date(ngaySinh).getTime();
  if (diff < 0) return 'Chưa sinh';
  const ageDate = new Date(diff);
  const years = Math.abs(ageDate.getUTCFullYear() - 1970);
  const months = ageDate.getUTCMonth();
  if (years > 0) return `${years} tuổi ${months > 0 ? months + ' tháng' : ''}`;
  if (months > 0) return `${months} tháng tuổi`;
  return `Dưới 1 tháng tuổi`;
};

const isPetActive = (pet: any) => pet?.da_xoa !== true && pet?.daXoa !== true;
const AUTO_REFRESH_MS = 10_000;

const layBieuTuongThuCung = (loai?: string) => {
  const normalized = (loai || "").toLowerCase();
  if (normalized.includes("mèo") || normalized.includes("meo") || normalized.includes("cat")) return "🐱";
  if (normalized.includes("chó") || normalized.includes("cho") || normalized.includes("dog")) return "🐶";
  if (normalized.includes("hamster") || normalized.includes("chuột") || normalized.includes("chuot") || normalized.includes("mouse")) return "🐹";
  if (normalized.includes("thỏ") || normalized.includes("tho") || normalized.includes("rabbit")) return "🐰";
  if (normalized.includes("chim") || normalized.includes("bird")) return "🐦";
  return "🐾";
};

const QuanLyThuCung: React.FC = () => {
  const [thuCung, setThuCung] = useState<any[]>([]);
  const [lichHen, setLichHen] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPet, setEditingPet] = useState<any>(null);
  const [formData, setFormData] = useState({
    ten_thu_cung: "", loai: "", giong: "", gioi_tinh: "Đực", ngay_sinh: "", mau_sac: "", trong_luong: ""
  });
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const formCardRef = useRef<HTMLDivElement | null>(null);
  const firstFieldRef = useRef<HTMLInputElement | null>(null);

  const fetchUserData = useCallback(async () => {
    const user = getUserProfile();
    if (!user) {
      setLoading(false);
      return;
    }
    const id = getCustomerIdFromProfile(user);
    if (!id) {
      console.warn("Không xác định được id_khach_hang từ hồ sơ đăng nhập:", user);
      setThuCung([]);
      setLichHen([]);
      setLoading(false);
      return;
    }

    try {
      const [thuCungRes, lichHenRes] = await Promise.allSettled([
        axiosInstance.get(`/api/thu-cung/khach/${id}`, { params: { page: 0, size: 999 } }),
        axiosInstance.get(`/api/lich-hen/khach/${id}`, { params: { page: 0, size: 999 } })
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

      if (thuCungRes.status === 'fulfilled') setThuCung(extractArray(thuCungRes.value).filter(isPetActive));
      if (lichHenRes.status === 'fulfilled') setLichHen(extractArray(lichHenRes.value));
    } catch (err) {
      console.error("Lỗi lấy dữ liệu thú cưng:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useAutoRefresh(fetchUserData, { intervalMs: AUTO_REFRESH_MS });

  const handleOpenForm = (pet: any = null) => {
    if (pet) {
      setEditingPet(pet);
      setFormData({
        ten_thu_cung: pet.ten_thu_cung || "",
        loai: pet.loai || "",
        giong: pet.giong || "",
        gioi_tinh: pet.gioi_tinh || "Đực",
        ngay_sinh: pet.ngay_sinh ? pet.ngay_sinh.split("T")[0] : "",
        mau_sac: pet.mau_sac || "",
        trong_luong: pet.trong_luong?.toString() || pet.can_nang?.toString() || ""
      });
    } else {
      setEditingPet(null);
      setFormData({ ten_thu_cung: "", loai: "", giong: "", gioi_tinh: "Đực", ngay_sinh: "", mau_sac: "", trong_luong: "" });
    }
    setShowForm(true);
  };

  useEffect(() => {
    if (!showForm) return;

    const timeoutId = window.setTimeout(() => {
      formCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      firstFieldRef.current?.focus({ preventScroll: true });
    }, 80);

    return () => window.clearTimeout(timeoutId);
  }, [showForm, editingPet?.id_thu_cung]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = getUserProfile();
    if (!user) {
      toast.error("Phiên làm việc hết hạn. Vui lòng đăng nhập lại.");
      return;
    }
    const idKhachHang = getCustomerIdFromProfile(user);
    if (!idKhachHang) {
      toast.error("Không xác định được mã khách hàng. Vui lòng đăng nhập lại.");
      return;
    }

    if (!formData.ten_thu_cung.trim()) {
      toast.error("Vui lòng nhập tên cho bé cưng của bạn nhé!");
      return;
    }
    if (!formData.loai.trim()) {
      toast.error("Vui lòng cho biết bé thuộc giống loài nào (VD: Chó, Mèo...)!");
      return;
    }

    const trongLuongNum = formData.trong_luong ? parseFloat(formData.trong_luong) : null;
    if (trongLuongNum !== null && trongLuongNum <= 0) {
      toast.error("Cân nặng của bé phải lớn hơn 0 kg nhé!");
      return;
    }

    const payload = {
      ...formData,
      id_khach_hang: idKhachHang,
      trong_luong: trongLuongNum || 0,
      can_nang: trongLuongNum || 0,
      giong_loai: formData.loai,
      tuoi: 0,
      ...(editingPet && { 
        id_thu_cung: editingPet.id_thu_cung,
        hinh_anh: editingPet.hinh_anh
      })
    };

    // FIX: Xóa trường ngày sinh nếu để trống để tránh lỗi Parse Date của Spring Boot gây Crash
    if (!payload.ngay_sinh) {
      delete (payload as any).ngay_sinh;
    }

    setIsSaving(true);
    try {
      if (editingPet) await axiosInstance.put(`/api/thu-cung/${editingPet.id_thu_cung}`, payload);
      else await axiosInstance.post("/api/thu-cung", payload);
      toast.success(editingPet ? "Cập nhật thành công!" : "Thêm thú cưng thành công!");
      setShowForm(false);
      fetchUserData();
    } catch (err: any) {
      console.error("Lỗi lưu thú cưng:", err);
      let errorMessage = "Rất tiếc, hệ thống không thể lưu thông tin thú cưng lúc này. Bạn thử lại sau nhé!";
      if (err.response?.data) {
        const d = err.response.data;
        if (typeof d === 'string' && d.trim() !== '' && !d.startsWith('<')) {
          errorMessage = d;
        } else if (d.errors && Array.isArray(d.errors)) {
          const msgs = d.errors.map((x: any) => x.defaultMessage).filter(Boolean);
          if (msgs.length > 0) errorMessage = msgs.join(', ');
        } else if (d.message && typeof d.message === 'string') {
          errorMessage = d.message;
        }
      }
      const lowerMsg = errorMessage.toLowerCase();
      if (lowerMsg.includes('validation') || lowerMsg.includes('null')) {
        errorMessage = "Vui lòng kiểm tra lại các trường thông tin bắt buộc và đảm bảo đúng định dạng.";
      }
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!id) {
      toast.error("Lỗi: Không tìm thấy mã thú cưng!");
      return;
    }
    setDeletingId(id);
    try {
      await axiosInstance.delete(`/api/thu-cung/${id}`);
      toast.success("Đã xóa bé cưng thành công!", { duration: 3000 });
      
      // Optimistic UI update: remove immediately from state
      setThuCung(prev => prev.filter(pet => pet.id_thu_cung !== id));
      setLichHen(prev => prev.filter(l => l.id_thu_cung !== id));
    } catch (err: any) {
      console.error("Lỗi xóa thú cưng:", err);
      let errorMessage = "Không thể xóa bé lúc này. Vui lòng thử lại sau!";
      if (err.response?.data) {
        const d = err.response.data;
        if (typeof d === 'string' && d.trim() !== '' && !d.startsWith('<')) {
          errorMessage = d;
        } else if (d.message && typeof d.message === 'string') {
          errorMessage = d.message;
        }
      }
      const lowerMsg = errorMessage.toLowerCase();
      if (lowerMsg.includes('constraint') || lowerMsg.includes('foreign key')) {
        errorMessage = "Không thể xóa vì bé đã có lịch hẹn hoặc bệnh án. Bạn hãy kiểm tra lại nhé!";
      }
      toast.error(errorMessage, { duration: 5000 });
    } finally {
      setDeletingId(null);
    }
  };

  const handleUploadImage = async (pet: any, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Kích thước ảnh quá lớn! Vui lòng chọn ảnh dưới 2MB nhé.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64String = reader.result as string;
      const payload = {
        id_thu_cung: pet.id_thu_cung,
        id_khach_hang: pet.id_khach_hang,
        ten_thu_cung: pet.ten_thu_cung,
        loai: pet.loai,
        giong: pet.giong,
        gioi_tinh: pet.gioi_tinh,
        ngay_sinh: pet.ngay_sinh ? pet.ngay_sinh.split("T")[0] : undefined,
        mau_sac: pet.mau_sac,
        trong_luong: pet.trong_luong || pet.can_nang || 0,
        can_nang: pet.trong_luong || pet.can_nang || 0,
        giong_loai: pet.loai,
        hinh_anh: base64String
      };

      try {
        await axiosInstance.put(`/api/thu-cung/${pet.id_thu_cung}`, payload);
        toast.success(`Đã cập nhật ảnh cho bé ${pet.ten_thu_cung}! 🎉`);
        fetchUserData();
      } catch (err: any) {
        console.error("Lỗi cập nhật ảnh thú cưng:", err);
        toast.error("Không thể tải lên ảnh lúc này. Bạn thử lại sau nhé!");
      }
    };
    reader.readAsDataURL(file);
  };

  const petsWithHistory = useMemo(() => {
    return thuCung.map(pet => ({
      ...pet,
      lastVisit: lichHen.filter(l => l.id_thu_cung === pet.id_thu_cung && (l.trang_thai?.toLowerCase() === "da_kham" || l.trang_thai?.toUpperCase() === "HOAN_THANH"))
        .sort((a, b) => new Date(b.ngay_kham).getTime() - new Date(a.ngay_kham).getTime())[0]
    }));
  }, [thuCung, lichHen]);

  const filteredPets = useMemo(() => {
    if (!searchQuery.trim()) return petsWithHistory;
    return petsWithHistory.filter(pet => matchesSearchFields(searchQuery, [
      pet.ten_thu_cung,
      pet.tenThuCung,
      pet.ten,
      pet.loai,
      pet.loai_thu_cung,
      pet.loaiThuCung,
      pet.giong,
      pet.giong_loai,
      pet.giongLoai,
      pet.gioi_tinh,
      pet.gioiTinh,
      pet.mau_sac,
      pet.mauSac,
      pet.trong_luong,
      pet.can_nang,
      pet.canNang,
      pet.ngay_sinh,
      pet.ngaySinh
    ]));
  }, [petsWithHistory, searchQuery]);

  if (loading) {
    return (
      <div className="animate-fade-in">
        {/* Khung xương Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <Skeleton width="300px" height="40px" borderRadius="12px" style={{ marginBottom: '12px' }} />
            <Skeleton width="400px" height="20px" borderRadius="8px" />
          </div>
          <Skeleton width="180px" height="48px" borderRadius="50px" />
        </div>

        {/* Khung xương Card Thú cưng */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card" style={{ padding: '32px', borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <Skeleton width="80px" height="80px" borderRadius="24px" />
                <div>
                  <Skeleton width="150px" height="28px" borderRadius="8px" style={{ marginBottom: '12px' }} />
                  <Skeleton width="80px" height="20px" borderRadius="8px" />
                </div>
              </div>
              <div className="responsive-grid-2">
                <Skeleton width="100%" height="40px" borderRadius="8px" />
                <Skeleton width="100%" height="40px" borderRadius="8px" />
                <Skeleton width="100%" height="40px" borderRadius="8px" />
                <Skeleton width="100%" height="40px" borderRadius="8px" />
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                <Skeleton width="100%" height="48px" borderRadius="50px" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in customer-pets-page">
      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .stagger-1 { animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both; }
        .btn-action { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important; font-weight: 800; }
        .btn-action:hover:not(:disabled) { transform: translateY(-3px) scale(1.02); box-shadow: 0 10px 20px rgba(13, 148, 136, 0.2); filter: brightness(1.05); }
        .btn-action.btn-delete:hover:not(:disabled) { box-shadow: 0 10px 20px rgba(239, 68, 68, 0.2); background: var(--danger) !important; color: white !important; }
        .camera-upload-btn:hover {
          transform: scale(1.18) rotate(-8deg) !important;
          background: var(--ink) !important;
          box-shadow: 0 6px 14px rgba(15, 157, 138, 0.5) !important;
        }
        @media (max-width: 768px) {
          .customer-pets-page {
            display: grid;
            gap: 18px;
            padding-bottom: 92px;
          }

          .customer-pets-hero {
            display: grid !important;
            gap: 18px !important;
            align-items: start !important;
            margin-bottom: 0 !important;
            padding: 24px !important;
            border-radius: 28px !important;
          }

          .customer-pets-hero h1 {
            font-size: 1.75rem !important;
            line-height: 1.08 !important;
            letter-spacing: 0 !important;
          }

          .customer-pets-hero p {
            font-size: 0.9rem !important;
            line-height: 1.5 !important;
          }

          .customer-pets-hero .btn {
            width: 100%;
            justify-content: center;
          }

          .customer-pet-form-card {
            padding: 20px !important;
            border-radius: 26px !important;
            margin-bottom: 0 !important;
          }

          .customer-pet-form-card h2 {
            font-size: 1.35rem !important;
            margin-bottom: 20px !important;
          }

          .customer-pet-form {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }

          .customer-pet-form-actions {
            display: grid !important;
            grid-template-columns: 1fr 1fr;
            gap: 10px !important;
            margin-top: 8px !important;
          }

          .customer-pet-form-actions .btn {
            padding-inline: 12px !important;
          }

          .customer-pet-search {
            max-width: none !important;
            margin-bottom: 0 !important;
          }

          .customer-pet-grid {
            grid-template-columns: 1fr !important;
            gap: 14px !important;
          }

          .customer-pet-card {
            padding: 16px !important;
            border-radius: 24px !important;
            gap: 14px !important;
            border-color: rgba(34, 211, 238, 0.28) !important;
          }

          .customer-pet-card h3 {
            font-size: 1.08rem !important;
            line-height: 1.22 !important;
          }

          .customer-pet-card-head {
            display: grid !important;
            grid-template-columns: 68px 1fr;
            gap: 14px !important;
            align-items: center !important;
            padding-bottom: 12px;
            border-bottom: 1px solid var(--gray-150);
          }

          .customer-pet-avatar {
            width: 68px !important;
            height: 68px !important;
          }

          .customer-pet-avatar > div:first-child {
            border-radius: 20px !important;
          }

          .customer-pet-avatar .camera-upload-btn {
            width: 26px !important;
            height: 26px !important;
            right: -5px !important;
            bottom: -5px !important;
          }

          .customer-pet-title-block {
            min-width: 0;
          }

          .customer-pet-type-badge {
            width: fit-content;
          }

          .customer-pet-card .responsive-grid-2 {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 8px !important;
            padding: 10px;
            border-radius: 18px;
            background: var(--background);
          }

          .customer-pet-card .responsive-grid-2 > div {
            padding: 10px 11px;
            border-radius: 14px;
            background: var(--surface);
            border: 1px solid var(--gray-150);
          }

          .customer-pet-card .responsive-grid-2 p:first-child {
            font-size: 0.64rem !important;
            margin-bottom: 3px !important;
          }

          .customer-pet-card .responsive-grid-2 p:last-child,
          .customer-pet-card .responsive-grid-2 span {
            font-size: 0.82rem !important;
            line-height: 1.3 !important;
          }

          .customer-pet-fact-wide {
            grid-column: 1 / -1;
          }

          .customer-pet-extra-row {
            display: none !important;
          }

          .customer-pet-actions {
            display: grid !important;
            grid-template-columns: 1fr 1fr;
            gap: 10px !important;
            margin-top: 2px !important;
            padding-top: 12px;
            border-top: 1px solid var(--gray-150);
          }

          .customer-pet-actions .btn {
            min-height: 44px;
            justify-content: center;
            border-radius: 16px !important;
          }

          .customer-pet-actions .btn-delete {
            gap: 6px;
          }
        }
        
        .customer-pets-hero {
          --hero-bg-start: #f59e0b;
          --hero-bg-mid: #f97316;
          --hero-bg-end: #f43f5e;
          --hero-shadow-color: rgba(245, 158, 11, 0.22);
          --hero-glow: rgba(244, 63, 94, 0.25);
        }
        
        [data-theme='dark'] .customer-pets-hero {
          --hero-bg-start: #78350f;
          --hero-bg-mid: #431407;
          --hero-bg-end: #0f172a;
          --hero-shadow-color: rgba(120, 53, 15, 0.2);
          --hero-glow: rgba(251, 146, 60, 0.15);
        }
      `}</style>
      <div className="stagger-1 customer-pets-hero" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', padding: '48px', borderRadius: 'var(--radius-xl)', background: 'linear-gradient(135deg, var(--hero-bg-start) 0%, var(--hero-bg-mid) 50%, var(--hero-bg-end) 100%)', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 40px var(--hero-shadow-color)' }}>
        <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '300px', height: '300px', background: 'radial-gradient(circle, var(--hero-glow) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', bottom: '-20%', right: '0%', width: '250px', height: '250px', background: 'radial-gradient(circle, var(--hero-glow) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none', opacity: 0.5 }}></div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 950, letterSpacing: '-2px', margin: '0 0 12px 0', textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>Thú cưng của tôi 🐾</h1>
          <p style={{ fontWeight: 600, color: 'rgba(255,255,255,0.7)', margin: 0, fontSize: '1.1rem' }}>Nơi lưu giữ hành trình trưởng thành và chăm sóc sức khỏe cho bé yêu.</p>
        </div>
        {!showForm && (
          <button data-ai-id="button-quanlythucung-h990" className="btn btn-primary btn-pill" style={{ position: 'relative', zIndex: 1 }} onClick={() => handleOpenForm()}>
            <span className="material-symbols-outlined">add_circle</span>
            Thêm thú cưng
          </button>
        )}
      </div>

      {showForm && (
        <div ref={formCardRef} className="glass-card stagger-2 customer-pet-form-card" style={{ padding: '48px', borderRadius: 'var(--radius-xl)', marginBottom: '48px', maxWidth: '900px', border: '1.5px solid var(--primary)', scrollMarginTop: '24px' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '32px', color: 'var(--primary)' }}>{editingPet ? 'Cập nhật thông tin' : 'Đăng ký bé mới'}</h2>

          <form className="customer-pet-form" onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label>TÊN BÉ <span style={{ color: '#ff4d4f' }}>*</span></label>
              <input ref={firstFieldRef} data-ai-id="input-quanlythucung-u5s4" required value={formData.ten_thu_cung} onChange={e => setFormData({ ...formData, ten_thu_cung: e.target.value })} placeholder="VD: Bé Lu, Miu Miu..." />
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label>LOÀI <span style={{ color: '#ff4d4f' }}>*</span></label>
              <input data-ai-id="input-quanlythucung-dk38" required value={formData.loai} onChange={e => setFormData({ ...formData, loai: e.target.value })} placeholder="VD: Chó, Mèo, Thỏ..." />
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label>GIỐNG</label>
              <input data-ai-id="input-quanlythucung-16e1" value={formData.giong} onChange={e => setFormData({ ...formData, giong: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label>CÂN NẶNG (KG)</label>
              <input data-ai-id="input-quanlythucung-nrh9" type="number" step="0.1" min="0.1" value={formData.trong_luong} onChange={e => setFormData({ ...formData, trong_luong: e.target.value })} placeholder="Ví dụ: 5.5" />
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label>GIỚI TÍNH</label>
              <select data-ai-id="select-quanlythucung-ewxq" required value={formData.gioi_tinh} onChange={e => setFormData({ ...formData, gioi_tinh: e.target.value })}>
                <option value="Đực">Đực</option>
                <option value="Cái">Cái</option>
                <option value="Không xác định">Không xác định</option>
              </select>
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label>NGÀY SINH</label>
              <input data-ai-id="input-quanlythucung-u4k6" type="date" value={formData.ngay_sinh} max={new Date().toISOString().split("T")[0]} onChange={e => setFormData({ ...formData, ngay_sinh: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label>MÀU SẮC</label>
              <input data-ai-id="input-quanlythucung-cvx3" value={formData.mau_sac} onChange={e => setFormData({ ...formData, mau_sac: e.target.value })} />
            </div>
            <div className="customer-pet-form-actions" style={{ gridColumn: '1 / -1', display: 'flex', gap: '16px', marginTop: '24px' }}>
              <button data-ai-id="button-quanlythucung-gfz2" type="submit" className="btn btn-primary btn-pill" style={{ padding: '14px 60px' }} disabled={isSaving}>
                {isSaving ? 'Đang lưu...' : 'Lưu thông tin'}
              </button>
              <button data-ai-id="button-quanlythucung-ri0f" type="button" className="btn btn-outline btn-pill" onClick={() => setShowForm(false)} disabled={isSaving}>Hủy bỏ</button>
            </div>
          </form>
        </div>
      )}

      {/* THANH TÌM KIẾM THÚ CƯNG */}
      <div className="stagger-2 customer-pet-search" style={{ marginBottom: '32px', maxWidth: '400px' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: '16px', color: 'var(--gray-400)', pointerEvents: 'none' }}>search</span>
          <input data-ai-id="input-quanlythucung-search"
            type="text"
            placeholder="Tìm kiếm bé cưng (tên, loài, giống)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 40px 14px 48px',
              borderRadius: '16px',
              border: '1px solid var(--gray-200)',
              background: 'var(--surface)',
              color: 'var(--ink)',
              fontWeight: 700,
              fontSize: '0.95rem',
              outline: 'none',
              transition: 'all 0.3s'
            }}
          />
          {searchQuery && (
            <span className="material-symbols-outlined" onClick={() => setSearchQuery("")} style={{ position: 'absolute', right: '16px', color: 'var(--gray-400)', cursor: 'pointer', userSelect: 'none' }}>close</span>
          )}
        </div>
      </div>

      {filteredPets.length === 0 ? (
        <div className="glass-card stagger-2" style={{ padding: '60px', textAlign: 'center', borderRadius: 'var(--radius-xl)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--gray-300)', marginBottom: '16px' }}>pets</span>
          <p style={{ color: 'var(--gray-500)', fontWeight: 700, margin: 0 }}>Không tìm thấy bé cưng nào phù hợp! 😿</p>
        </div>
      ) : (
        <div className="stagger-2 customer-pet-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {filteredPets.map(pet => (
            <div key={pet.id_thu_cung} className="glass-card customer-pet-card" style={{ padding: '32px', borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="customer-pet-card-head" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <div className="customer-pet-avatar" style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0 }}>
                  <div style={{ 
                    width: '100%', 
                    height: '100%', 
                    background: 'var(--primary-light)', 
                    borderRadius: '24px', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    color: 'var(--primary)',
                    overflow: 'hidden',
                    border: '2px solid var(--gray-100)'
                  }}>
                    {pet.hinh_anh ? (
                      <img
                        src={pet.hinh_anh}
                        alt={pet.ten_thu_cung}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement | null;
                          if (fallback) fallback.style.display = 'inline';
                        }}
                      />
                    ) : (
                      null
                    )}
                    <span style={{ fontSize: '2rem', display: pet.hinh_anh ? 'none' : 'inline' }}>
                      {layBieuTuongThuCung(pet.loai)}
                    </span>
                  </div>
                  
                  {/* Icon máy ảnh đổi avatar nhanh */}
                  <label 
                    htmlFor={`upload-avatar-${pet.id_thu_cung}`} 
                    style={{ 
                      position: 'absolute', 
                      bottom: '-4px', 
                      right: '-4px', 
                      width: '28px', 
                      height: '28px', 
                      borderRadius: '50%', 
                      background: 'var(--primary)', 
                      color: 'white', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      cursor: 'pointer',
                      boxShadow: '0 4px 10px rgba(15, 157, 138, 0.4)',
                      border: '2px solid var(--surface)',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      zIndex: 2
                    }}
                    className="camera-upload-btn"
                    title="Đổi ảnh đại diện"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>photo_camera</span>
                  </label>
                  <input 
                    data-ai-id={`input-quanlythucung-avatar-${pet.id_thu_cung}`}
                    type="file" 
                    id={`upload-avatar-${pet.id_thu_cung}`} 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                    onChange={(e) => handleUploadImage(pet, e)} 
                  />
                </div>
                <div className="customer-pet-title-block">
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--ink)', margin: 0 }}>{pet.ten_thu_cung}</h3>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                    <span className="customer-pet-type-badge" style={{ fontSize: '0.7rem', fontWeight: 800, background: 'var(--gray-50)', color: 'var(--gray-500)', padding: '4px 10px', borderRadius: '8px' }}>{pet.loai?.toUpperCase()}</span>
                  </div>
                </div>
              </div>

              <div className="responsive-grid-2">
                <div>
                  <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '4px' }}>GIỚI TÍNH</p>
                  <p style={{ fontWeight: 800, margin: 0, color: 'var(--ink)' }}>{pet.gioi_tinh || '—'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '4px' }}>MÀU SẮC</p>
                  <p style={{ fontWeight: 800, margin: 0, color: 'var(--ink)' }}>{pet.mau_sac || '—'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '4px' }}>GIỐNG</p>
                  <p style={{ fontWeight: 800, margin: 0, color: 'var(--ink)' }}>{pet.giong || '—'}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '4px' }}>CÂN NẶNG</p>
                  <p style={{ fontWeight: 800, margin: 0, color: 'var(--ink)' }}>{pet.trong_luong || '—'} kg</p>
                </div>
                {pet.ngay_sinh && (
                  <div className="customer-pet-fact-wide">
                    <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '4px' }}>NGÀY SINH</p>
                    <p style={{ fontWeight: 800, margin: 0, color: 'var(--ink)' }}>{chuyenNgayISO_SangVN(pet.ngay_sinh)} ({tinhTuoi(pet.ngay_sinh)})</p>
                  </div>
                )}
              </div>

              {pet.ngay_sinh && (
                <div className="customer-pet-extra-row" style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: 0.7 }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '20px' }}>cake</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Ngày sinh: {chuyenNgayISO_SangVN(pet.ngay_sinh)} ({tinhTuoi(pet.ngay_sinh)})</span>
                </div>
              )}

              {pet.lastVisit && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: 0.7 }}>
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '20px' }}>history</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Lần khám cuối: {chuyenNgayISO_SangVN(pet.lastVisit.ngay_kham)}</span>
                </div>
              )}

              <div className="customer-pet-actions" style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                <button data-ai-id="button-quanlythucung-7v0f" className="btn btn-pill btn-action" style={{ flex: 1, background: 'var(--primary-light)', color: 'var(--primary)' }} onClick={() => handleOpenForm(pet)} disabled={!!deletingId}>Sửa</button>
                <button data-ai-id="button-quanlythucung-zykg" 
                  className="btn btn-pill btn-action btn-delete" 
                  style={{ 
                    background: deletingId === pet.id_thu_cung ? 'var(--gray-100)' : 'var(--danger-light, rgba(239, 68, 68, 0.15))', 
                    color: deletingId === pet.id_thu_cung ? 'var(--gray-400)' : 'var(--danger)',
                    minWidth: '48px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }} 
                  onClick={() => handleDelete(pet.id_thu_cung)}
                  disabled={!!deletingId}
                >
                  {deletingId === pet.id_thu_cung ? (
                    <div className="spinner-small" style={{ width: '20px', height: '20px', border: '2px solid var(--gray-300)', borderTopColor: 'var(--danger)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">delete</span>
                      <span>Xóa</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(QuanLyThuCung);
