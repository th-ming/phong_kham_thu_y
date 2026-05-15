import React, { useState, useEffect, useCallback, useMemo } from "react";
import axiosInstance from "@services/axios";
import { getUserProfile } from "@utils/index";
import { toast } from "@components/Toast";
import { Skeleton } from "@components/CommonUI";

const chuyenNgayISO_SangVN = (dateString: string) => {
  if (!dateString || typeof dateString !== 'string') return "—";
  // BẢO MẬT GIAO DIỆN: Ép kiểu chuỗi thay vì dùng new Date() để chống lỗi nhảy lùi ngày do múi giờ
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

  const fetchUserData = useCallback(async () => {
    const user = getUserProfile();
    if (!user) return;
    const id = user.id_khach_hang || user.id_tai_khoan || user.id;

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

      if (thuCungRes.status === 'fulfilled') setThuCung(extractArray(thuCungRes.value));
      if (lichHenRes.status === 'fulfilled') setLichHen(extractArray(lichHenRes.value));
    } catch (err) {
      console.error("Lỗi lấy dữ liệu thú cưng:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUserData(); }, [fetchUserData]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = getUserProfile();
    if (!user) {
      toast.error("Phiên làm việc hết hạn. Vui lòng đăng nhập lại.");
      return;
    }
    const idKhachHang = user.id_khach_hang || user.id_tai_khoan || user.id;

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
      ...(editingPet && { id_thu_cung: editingPet.id_thu_cung })
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
    if (window.confirm("Bạn có chắc chắn muốn xóa bé cưng này không? Thao tác này không thể hoàn tác.")) {
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
    }
  };

  const petsWithHistory = useMemo(() => {
    return thuCung.map(pet => ({
      ...pet,
      lastVisit: lichHen.filter(l => l.id_thu_cung === pet.id_thu_cung && (l.trang_thai?.toLowerCase() === "da_kham" || l.trang_thai?.toUpperCase() === "HOAN_THANH"))
        .sort((a, b) => new Date(b.ngay_kham).getTime() - new Date(a.ngay_kham).getTime())[0]
    }));
  }, [thuCung, lichHen]);

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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '20px', borderRadius: '20px', background: 'var(--gray-50)' }}>
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
    <div className="animate-fade-in">
      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .stagger-1 { animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both; }
        .stagger-2 { animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both; }
        .item-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); border: 1px solid transparent; background: var(--surface); }
        .item-card:hover { border-color: var(--primary) !important; background: var(--surface) !important; transform: translateY(-6px); box-shadow: 0 20px 40px rgba(15, 157, 138, 0.1); z-index: 10; position: relative; }
      `}</style>
      <div className="stagger-1" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', padding: '48px', borderRadius: 'var(--radius-xl)', background: 'var(--secondary-gradient)', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-2xl)' }}>
        <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '300px', height: '300px', background: 'radial-gradient(circle, var(--primary-light) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', bottom: '-20%', right: '0%', width: '250px', height: '250px', background: 'radial-gradient(circle, var(--primary-light) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none', opacity: 0.5 }}></div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 950, letterSpacing: '-2px', margin: '0 0 12px 0', textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>Thú cưng của tôi 🐾</h1>
          <p style={{ fontWeight: 600, color: 'rgba(255,255,255,0.7)', margin: 0, fontSize: '1.1rem' }}>Nơi lưu giữ hành trình trưởng thành và chăm sóc sức khỏe cho bé yêu.</p>
        </div>
        {!showForm && (
          <button className="btn btn-primary btn-pill" style={{ position: 'relative', zIndex: 1 }} onClick={() => handleOpenForm()}>
            <span className="material-symbols-outlined">add_circle</span>
            Thêm thú cưng
          </button>
        )}
      </div>

      {showForm && (
        <div className="glass-card stagger-2" style={{ padding: '48px', borderRadius: 'var(--radius-xl)', marginBottom: '48px', maxWidth: '900px', border: '1.5px solid var(--primary)' }}>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '32px', color: 'var(--primary)' }}>{editingPet ? 'Cập nhật thông tin' : 'Đăng ký bé mới'}</h2>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label>TÊN BÉ <span style={{ color: '#ff4d4f' }}>*</span></label>
              <input required value={formData.ten_thu_cung} onChange={e => setFormData({ ...formData, ten_thu_cung: e.target.value })} placeholder="VD: Bé Lu, Miu Miu..." />
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label>LOÀI <span style={{ color: '#ff4d4f' }}>*</span></label>
              <input required value={formData.loai} onChange={e => setFormData({ ...formData, loai: e.target.value })} placeholder="VD: Chó, Mèo, Thỏ..." />
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label>GIỐNG</label>
              <input value={formData.giong} onChange={e => setFormData({ ...formData, giong: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label>CÂN NẶNG (KG)</label>
              <input type="number" step="0.1" min="0.1" value={formData.trong_luong} onChange={e => setFormData({ ...formData, trong_luong: e.target.value })} placeholder="Ví dụ: 5.5" />
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label>GIỚI TÍNH</label>
              <select required value={formData.gioi_tinh} onChange={e => setFormData({ ...formData, gioi_tinh: e.target.value })}>
                <option value="Đực">Đực</option>
                <option value="Cái">Cái</option>
                <option value="Không xác định">Không xác định</option>
              </select>
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label>NGÀY SINH</label>
              <input type="date" value={formData.ngay_sinh} max={new Date().toISOString().split("T")[0]} onChange={e => setFormData({ ...formData, ngay_sinh: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label>MÀU SẮC</label>
              <input value={formData.mau_sac} onChange={e => setFormData({ ...formData, mau_sac: e.target.value })} />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '16px', marginTop: '24px' }}>
              <button type="submit" className="btn btn-primary btn-pill" style={{ padding: '14px 60px' }} disabled={isSaving}>
                {isSaving ? 'Đang lưu...' : 'Lưu thông tin'}
              </button>
              <button type="button" className="btn btn-outline btn-pill" onClick={() => setShowForm(false)} disabled={isSaving}>Hủy bỏ</button>
            </div>
          </form>
        </div>
      )}

      <div className="stagger-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
        {petsWithHistory.map(pet => (
          <div key={pet.id_thu_cung} className="glass-card item-card" style={{ padding: '32px', borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <div style={{ width: '80px', height: '80px', background: 'var(--primary-light)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '40px' }}>pets</span>
              </div>
              <div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--ink)', margin: 0 }}>{pet.ten_thu_cung}</h3>
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 800, background: 'var(--gray-50)', color: 'var(--gray-500)', padding: '4px 10px', borderRadius: '8px' }}>{pet.loai?.toUpperCase()}</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '20px', borderRadius: '20px', marginBottom: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
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
            </div>

            {pet.ngay_sinh && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', opacity: 0.7 }}>
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

            <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
              <button className="btn btn-pill" style={{ flex: 1, background: 'var(--primary-light)', color: 'var(--primary)' }} onClick={() => handleOpenForm(pet)} disabled={!!deletingId}>Sửa</button>
              <button 
                className="btn btn-pill" 
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
                  <span className="material-symbols-outlined">delete</span>
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(QuanLyThuCung);
