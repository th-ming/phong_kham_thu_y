import React, { useState, useEffect } from "react";
import axiosInstance from "@services/axios";
import { Modal } from "@components/CommonUI";
import { toast } from "@components/Toast";

const QuanLyKhachHangThuCung: React.FC = () => {
  const [thuCung, setThuCung] = useState<any[]>([]);
  const [khachHang, setKhachHang] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddKhModal, setShowAddKhModal] = useState(false);
  const [showAddPetModal, setShowAddPetModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingPetId, setEditingPetId] = useState<number | null>(null);

  // State hỗ trợ Phân trang Server-side
  const [totalServerPages, setTotalServerPages] = useState(1);
  const [isServerPaginated, setIsServerPaginated] = useState(false);

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [khFormData, setKhFormData] = useState({ ten_khach_hang: "", sdt: "", email: "" });
  const [petFormData, setPetFormData] = useState({
    ten_thu_cung: "", loai: "Chó", giong: "", gioi_tinh: "Đực",
    mau_sac: "", trong_luong: "", ngay_sinh: "", id_khach_hang: ""
  });
  const fetchData = () => {
    setLoading(true);
    Promise.all([
      axiosInstance.get("/api/thu-cung", {
        params: { page: currentPage - 1, size: ITEMS_PER_PAGE }
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
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi tải dữ liệu khách hàng thú cưng:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, [currentPage]);

  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await axiosInstance.post("/api/auth/register-simple", khFormData);
      setShowAddKhModal(false);
      setKhFormData({ ten_khach_hang: "", sdt: "", email: "" });
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

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div className="dot-pulse"></div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-1px' }}>Khách hàng & Thú cưng</h1>
          <p style={{ color: 'var(--gray-500)', fontWeight: 600 }}>Quản lý thông tin chủ nuôi và các bạn nhỏ trong hệ thống.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-pill" style={{ background: 'var(--gray-50)', color: 'var(--ink)' }} onClick={() => setShowAddKhModal(true)}>
            <span className="material-symbols-outlined">person_add</span>
            Thêm chủ nuôi
          </button>
          <button className="btn btn-primary btn-pill" onClick={openAddPetModal}>
            <span className="material-symbols-outlined">pets</span>
            Thêm bé mới
          </button>
        </div>
      </div>

      {/* BẢNG QUẢN LÝ KHÁCH HÀNG */}
      <div className="glass-card" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', marginBottom: '32px' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--ink)', margin: 0 }}>Danh sách khách hàng ({khachHang.length})</h2>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--gray-50)', textAlign: 'left' }}>
              <th style={{ padding: '16px 20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>TÊN KHÁCH HÀNG</th>
              <th style={{ padding: '16px 20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>LIÊN HỆ</th>
              <th style={{ padding: '16px 20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>TRẠNG THÁI</th>
              <th style={{ padding: '16px 20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800, textAlign: 'center' }}>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {khachHang.map((kh: any) => (
              <tr key={kh.id_khach_hang} style={{ borderBottom: '1px solid var(--gray-50)', transition: 'all 0.2s' }}>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '36px', height: '36px', background: kh.da_xoa ? 'rgba(239,68,68,0.1)' : 'var(--primary-light)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: kh.da_xoa ? 'var(--danger)' : 'var(--primary)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{kh.da_xoa ? 'person_off' : 'person'}</span>
                    </div>
                    <span style={{ fontWeight: 800, color: kh.da_xoa ? 'var(--gray-400)' : 'var(--ink)', textDecoration: kh.da_xoa ? 'line-through' : 'none' }}>{kh.ten_khach_hang}</span>
                  </div>
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{kh.sdt || '—'}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 600 }}>{kh.email || ''}</div>
                </td>
                <td style={{ padding: '16px 20px' }}>
                  <span style={{
                    padding: '4px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 900,
                    background: kh.da_xoa ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
                    color: kh.da_xoa ? 'var(--danger)' : '#16a34a'
                  }}>
                    {kh.da_xoa ? 'Đã khóa' : 'Hoạt động'}
                  </span>
                </td>
                <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    {kh.da_xoa ? (
                      <button
                        className="btn btn-pill"
                        onClick={() => handleUnlockKhachHang(kh.id_khach_hang)}
                        style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#16a34a', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 800 }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>lock_open</span>
                        Mở khóa
                      </button>
                    ) : (
                      <button
                        className="btn btn-pill"
                        onClick={() => handleLockKhachHang(kh.id_khach_hang)}
                        style={{ background: 'var(--danger-light, rgba(239, 68, 68, 0.15))', color: 'var(--danger)', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 800 }}
                      >
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>lock</span>
                        Khóa
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* BẢNG QUẢN LÝ THÚ CƯNG */}
      <div className="glass-card" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
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
            {currentRows.map((t) => (
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
                    <button className="btn" onClick={() => handleEditPetClick(t)} style={{ padding: '8px', background: 'var(--primary-light)', color: 'var(--primary)' }} title="Chỉnh sửa">
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                    <button className="btn" onClick={() => handleDeletePet(t.id_thu_cung)} style={{ padding: '8px', background: 'var(--danger-light, rgba(239, 68, 68, 0.15))', color: 'var(--danger)' }} title="Xóa thú cưng">
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* BỘ NÚT ĐIỀU HƯỚNG PHÂN TRANG */}
      {totalPages > 1 && (
        <div className="stagger-2" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '20px', marginBottom: '20px' }}>
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

      {/* MODAL THÊM KHÁCH HÀNG */}
      <Modal isOpen={showAddKhModal} onClose={() => setShowAddKhModal(false)} title="Thêm chủ nuôi mới" maxWidth="450px">
        <div style={{ display: 'grid', gap: '20px' }}>
          <form onSubmit={handleAddCustomer} style={{ display: 'grid', gap: '20px' }}>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)' }}>TÊN KHÁCH HÀNG</label>
              <input required className="btn" style={{ background: 'var(--gray-50)', textAlign: 'left', cursor: 'text' }} value={khFormData.ten_khach_hang} onChange={e => setKhFormData({ ...khFormData, ten_khach_hang: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)' }}>SỐ ĐIỆN THOẠI</label>
              <input required className="btn" style={{ background: 'var(--gray-50)', textAlign: 'left', cursor: 'text' }} value={khFormData.sdt} onChange={e => setKhFormData({ ...khFormData, sdt: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)' }}>EMAIL (TÙY CHỌN)</label>
              <input className="btn" style={{ background: 'var(--gray-50)', textAlign: 'left', cursor: 'text' }} value={khFormData.email} onChange={e => setKhFormData({ ...khFormData, email: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <button type="submit" disabled={isSaving} className="btn btn-primary btn-pill" style={{ flex: 1 }}>{isSaving ? 'Đang lưu...' : 'Lưu thông tin'}</button>
              <button type="button" onClick={() => setShowAddKhModal(false)} className="btn btn-pill" style={{ flex: 1, background: 'var(--gray-100)', color: 'var(--ink)' }}>Hủy</button>
            </div>
          </form>
        </div>
      </Modal>

      {/* MODAL THÊM THÚ CƯNG */}
      <Modal isOpen={showAddPetModal} onClose={() => setShowAddPetModal(false)} title={editingPetId ? "Cập nhật thú cưng" : "Đăng ký bé mới"} maxWidth="500px">
        <div style={{ display: 'grid', gap: '16px' }}>
          <form onSubmit={handleAddPet} style={{ display: 'grid', gap: '16px' }}>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)' }}>CHỦ SỞ HỮU</label>
              <select required className="btn" style={{ background: 'var(--gray-50)', textAlign: 'left' }} value={petFormData.id_khach_hang} onChange={e => setPetFormData({ ...petFormData, id_khach_hang: e.target.value })}>
                <option value="">-- Chọn khách hàng --</option>
                {khachHang.map(kh => <option key={kh.id_khach_hang} value={kh.id_khach_hang}>{kh.ten_khach_hang} - {kh.sdt}</option>)}
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '12px' }}>
              <div style={{ display: 'grid', gap: '8px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)' }}>TÊN BÉ</label>
                <input required className="btn" style={{ background: 'var(--gray-50)', textAlign: 'left', cursor: 'text' }} value={petFormData.ten_thu_cung} onChange={e => setPetFormData({ ...petFormData, ten_thu_cung: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gap: '8px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)' }}>LOÀI</label>
                <select className="btn" style={{ background: 'var(--gray-50)', textAlign: 'left' }} value={petFormData.loai} onChange={e => setPetFormData({ ...petFormData, loai: e.target.value })}>
                  <option value="Chó">Chó</option>
                  <option value="Mèo">Mèo</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'grid', gap: '8px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)' }}>GIỐNG</label>
                <input className="btn" style={{ background: 'var(--gray-50)', textAlign: 'left', cursor: 'text' }} value={petFormData.giong} onChange={e => setPetFormData({ ...petFormData, giong: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gap: '8px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)' }}>CÂN NẶNG (KG)</label>
                <input type="number" step="0.1" className="btn" style={{ background: 'var(--gray-50)', textAlign: 'left', cursor: 'text' }} value={petFormData.trong_luong} onChange={e => setPetFormData({ ...petFormData, trong_luong: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div style={{ display: 'grid', gap: '8px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)' }}>GIỚI TÍNH</label>
                <select className="btn" style={{ background: 'var(--gray-50)', textAlign: 'left' }} value={petFormData.gioi_tinh} onChange={e => setPetFormData({ ...petFormData, gioi_tinh: e.target.value })}>
                  <option value="Đực">Đực</option>
                  <option value="Cái">Cái</option>
                  <option value="Không xác định">Không xác định</option>
                </select>
              </div>
              <div style={{ display: 'grid', gap: '8px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)' }}>NGÀY SINH</label>
                <input type="date" className="btn" style={{ background: 'var(--gray-50)', textAlign: 'left', cursor: 'text', padding: '0 12px' }} value={petFormData.ngay_sinh} onChange={e => setPetFormData({ ...petFormData, ngay_sinh: e.target.value })} max={new Date().toISOString().split("T")[0]} />
              </div>
              <div style={{ display: 'grid', gap: '8px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)' }}>MÀU SẮC</label>
                <input className="btn" style={{ background: 'var(--gray-50)', textAlign: 'left', cursor: 'text' }} value={petFormData.mau_sac} onChange={e => setPetFormData({ ...petFormData, mau_sac: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
              <button type="submit" disabled={isSaving} className="btn btn-primary btn-pill" style={{ flex: 1 }}>{isSaving ? 'Đang lưu...' : (editingPetId ? 'Lưu thay đổi' : 'Đăng ký bé')}</button>
              <button type="button" onClick={() => setShowAddPetModal(false)} className="btn btn-pill" style={{ flex: 1, background: 'var(--gray-100)', color: 'var(--ink)' }}>Hủy</button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
};

export default React.memo(QuanLyKhachHangThuCung);
