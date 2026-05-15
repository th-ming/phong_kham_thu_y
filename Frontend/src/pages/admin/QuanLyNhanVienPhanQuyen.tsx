import React, { useState, useEffect, useMemo } from "react";
import axiosInstance from "@services/axios";
import { Modal } from "@components/CommonUI";
import { toast } from "@components/Toast";
import { getUserProfile } from "@utils/index";

const QuanLyNhanVienPhanQuyen: React.FC = () => {
  const [nhanViens, setNhanViens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterRole, setFilterRole] = useState("all");
  const [showPassword, setShowPassword] = useState(false);

  const currentUser = getUserProfile();

  const [formData, setFormData] = useState({
    ho_ten: "", so_dien_thoai: "", email: "", chuyen_mon: "Bác sĩ", trang_thai: "Đang làm việc",
    hinh_anh: "", gioi_thieu: "", ngay_vao_lam: "", mat_khau: ""
  });

  const tinhKinhNghiem = (ngayVaoLam: string) => {
    if (!ngayVaoLam) return "Mới vào làm";
    const start = new Date(ngayVaoLam);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) return "Mới vào làm";
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng`;
    const years = (diffDays / 365).toFixed(1);
    return `${years} năm`;
  };

  const fetchNhanViens = () => {
    setLoading(true);
    axiosInstance.get("/api/nhan-vien")
      .then(res => {
        setNhanViens(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi lấy danh sách nhân viên:", err);
        setLoading(false);
      });
  };

  useEffect(() => { fetchNhanViens(); }, []);

  const handleOpenEdit = (nv: any) => {
    setEditingId(nv.id_nhan_vien);
    setFormData({
      ho_ten: nv.ho_ten || "",
      so_dien_thoai: nv.so_dien_thoai || "",
      email: nv.email || "",
      chuyen_mon: nv.chuyen_mon || "Bác sĩ",
      trang_thai: nv.trang_thai || "Đang làm việc",
      hinh_anh: nv.hinh_anh || "",
      gioi_thieu: nv.gioi_thieu || "",
      ngay_vao_lam: nv.ngay_vao_lam || "",
      mat_khau: ""
    });
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Fix: Loại bỏ trường ngày rỗng để tránh lỗi Parse Date của Spring Boot
      const payload = { ...formData };
      if (!payload.ngay_vao_lam) delete (payload as any).ngay_vao_lam;

      if (editingId) {
        await axiosInstance.put(`/api/nhan-vien/${editingId}`, payload);
        toast.success("Đã cập nhật thông tin nhân sự!");
      } else {
        await axiosInstance.post("/api/nhan-vien", payload);
        toast.success("Đã thêm nhân sự mới!");
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({ ho_ten: "", so_dien_thoai: "", email: "", chuyen_mon: "Bác sĩ", trang_thai: "Đang làm việc", hinh_anh: "", gioi_thieu: "", ngay_vao_lam: "", mat_khau: "" });
      fetchNhanViens();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Lỗi khi lưu thông tin nhân viên.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa/cho nhân viên này nghỉ việc? Tài khoản của họ sẽ bị khóa ngay lập tức.")) {
      try {
        await axiosInstance.delete(`/api/nhan-vien/${id}`);
        toast.success("Đã xóa nhân viên thành công!");
        fetchNhanViens();
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Lỗi khi xóa nhân viên.");
      }
    }
  };

  const filteredNhanViens = useMemo(() => {
    if (filterRole === "all") return nhanViens;
    return nhanViens.filter(nv => nv.chuyen_mon?.toLowerCase() === filterRole.toLowerCase());
  }, [nhanViens, filterRole]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div className="dot-pulse"></div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .stagger-1 { animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both; }
        .stagger-2 { animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both; }
        .table-row:hover { background-color: white !important; transform: scale(1.005) translateX(4px); box-shadow: -10px 10px 20px rgba(15, 157, 138, 0.05); z-index: 10; position: relative; }
      `}</style>
      <div className="stagger-1" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 950, color: 'var(--ink)', letterSpacing: '-1.5px', margin: 0 }}>Nhân sự & <span style={{ color: 'var(--primary)' }}>Quyền hạn</span></h1>
          <p style={{ color: 'var(--gray-500)', fontWeight: 600, marginTop: '8px' }}>Quản lý đội ngũ y bác sĩ và phân cấp quyền truy cập hệ thống.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            style={{ padding: '12px 20px', borderRadius: '16px', border: '1px solid var(--gray-200)', outline: 'none', fontWeight: 800, cursor: 'pointer', background: 'var(--surface)', color: 'var(--ink)' }}
          >
            <option value="all">Tất cả chức vụ</option>
            <option value="Bác sĩ">Bác sĩ</option>
            <option value="Y tá">Y tá</option>
            <option value="Tiếp tân">Tiếp tân</option>
            <option value="Kế toán">Kế toán</option>
            <option value="Quản lý">Quản lý</option>
            <option value="Chăm sóc khách hàng">Chăm sóc khách hàng</option>
          </select>
          <button className="btn btn-primary btn-pill" onClick={() => { setEditingId(null); setShowModal(true); }}>
            <span className="material-symbols-outlined">person_add</span>
            Thêm nhân sự
          </button>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setShowPassword(false); }} title={editingId ? "Cập nhật nhân viên" : "Thêm nhân viên mới"} maxWidth="500px">
        <div style={{ display: 'grid', gap: '20px' }}>
          <form onSubmit={handleSave} style={{ display: 'grid', gap: '20px' }}>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label htmlFor="ho_ten" style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)' }}>HỌ VÀ TÊN</label>
              <input id="ho_ten" required className="btn" style={{ background: 'var(--gray-50)', textAlign: 'left', cursor: 'text' }} value={formData.ho_ten} onChange={e => setFormData({ ...formData, ho_ten: e.target.value })} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'grid', gap: '8px' }}>
                <label htmlFor="chuyen_mon" style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)' }}>CHUYÊN MÔN</label>
                <select id="chuyen_mon" className="btn" style={{ background: 'var(--gray-50)', textAlign: 'left' }} value={formData.chuyen_mon} onChange={e => setFormData({ ...formData, chuyen_mon: e.target.value })}>
                  <option value="Bác sĩ">Bác sĩ</option>
                  <option value="Y tá">Y tá</option>
                  <option value="Tiếp tân">Tiếp tân</option>
                  <option value="Kế toán">Kế toán</option>
                  <option value="Quản lý">Quản lý</option>
                  <option value="Chăm sóc khách hàng">Chăm sóc khách hàng</option>
                </select>
              </div>
              <div style={{ display: 'grid', gap: '8px' }}>
                <label htmlFor="trang_thai" style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)' }}>TRẠNG THÁI</label>
                <select id="trang_thai" className="btn" style={{ background: 'var(--gray-50)', textAlign: 'left' }} value={formData.trang_thai} onChange={e => setFormData({ ...formData, trang_thai: e.target.value })}>
                  <option value="Đang làm việc">Đang làm việc</option>
                  <option value="Tạm nghỉ">Tạm nghỉ</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '8px' }}>
              <label htmlFor="so_dien_thoai" style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)' }}>SỐ ĐIỆN THOẠI</label>
              <input id="so_dien_thoai" required className="btn" style={{ background: 'var(--gray-50)', textAlign: 'left', cursor: 'text' }} value={formData.so_dien_thoai} onChange={e => setFormData({ ...formData, so_dien_thoai: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label htmlFor="email" style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)' }}>EMAIL (SỬ DỤNG LÀM TÊN ĐĂNG NHẬP)</label>
              <input id="email" required type="email" className="btn" style={{ background: 'var(--gray-50)', textAlign: 'left', cursor: 'text' }} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
            </div>

            {!editingId && (
              <div style={{ display: 'grid', gap: '8px' }}>
                <label htmlFor="mat_khau" style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)' }}>MẬT KHẨU BAN ĐẦU</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    id="mat_khau"
                    required 
                    type={showPassword ? "text" : "password"} 
                    placeholder="Nhập mật khẩu cho tài khoản mới" 
                    className="btn" 
                    style={{ background: 'var(--gray-50)', textAlign: 'left', cursor: 'text', width: '100%', paddingRight: '45px' }} 
                    value={formData.mat_khau} 
                    onChange={e => setFormData({ ...formData, mat_khau: e.target.value })} 
                  />
                  <span 
                    className="material-symbols-outlined" 
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ 
                      position: 'absolute', 
                      right: '15px', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      cursor: 'pointer', 
                      color: 'var(--gray-400)',
                      userSelect: 'none',
                      fontSize: '20px'
                    }}
                  >
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gap: '8px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)' }}>HÌNH ẢNH NHÂN SỰ</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <img src={formData.hinh_anh || "/img/avtpkty.png"} alt="Preview" style={{ width: '64px', height: '64px', borderRadius: '16px', objectFit: 'cover', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--gray-100)' }} />
                <div style={{ flex: 1 }}>
                  <label htmlFor="upload-avatar" className="btn" style={{ background: 'var(--primary-light)', color: 'var(--primary)', width: '100%', cursor: 'pointer', border: '1px dashed var(--primary)', display: 'flex', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>upload</span>
                    {formData.hinh_anh ? 'Đổi ảnh khác' : 'Tải ảnh lên'}
                  </label>
                  <input id="upload-avatar" type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => setFormData({ ...formData, hinh_anh: reader.result as string });
                      reader.readAsDataURL(file);
                    }
                  }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '8px' }}>
              <label htmlFor="ngay_vao_lam" style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)' }}>NGÀY VÀO LÀM (ĐỂ TÍNH KINH NGHIỆM)</label>
              <input id="ngay_vao_lam" type="date" required className="btn" style={{ background: 'var(--gray-50)', textAlign: 'left', cursor: 'text' }} value={formData.ngay_vao_lam} onChange={e => setFormData({ ...formData, ngay_vao_lam: e.target.value })} />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button type="submit" disabled={isSaving} className="btn btn-primary btn-pill" style={{ flex: 1, fontWeight: 900 }}>{isSaving ? 'ĐANG LƯU...' : 'LƯU THÔNG TIN'}</button>
              <button type="button" onClick={() => setShowModal(false)} className="btn btn-pill" style={{ flex: 1, background: 'var(--gray-100)', color: 'var(--ink)', fontWeight: 800 }}>HỦY</button>
            </div>
          </form>
        </div>
      </Modal>

      <div className="glass-card stagger-2" style={{ borderRadius: '32px', overflow: 'hidden', border: '1px solid var(--gray-100)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--gray-50)', textAlign: 'left' }}>
              <th style={{ padding: '24px 20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>NHÂN VIÊN</th>
              <th style={{ padding: '24px 20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>LIÊN HỆ</th>
              <th style={{ padding: '24px 20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>TRẠNG THÁI</th>
              <th style={{ padding: '24px 20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>THÂM NIÊN</th>
              <th style={{ padding: '24px 20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>HÀNH ĐỘNG</th>
            </tr>
          </thead>
          <tbody>
            {filteredNhanViens.map((b) => (
              <tr key={b.id_nhan_vien} className="table-row" style={{ borderBottom: '1px solid var(--gray-50)', transition: 'all 0.3s ease' }}>
                <td style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', position: 'relative' }}>
                      <img src={b.hinh_anh || "/img/avtpkty.png"} style={{ width: '100%', height: '100%', borderRadius: '14px', objectFit: 'cover' }} alt={b.ho_ten} />
                      {b.trang_thai === 'Đang làm việc' && <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '14px', height: '14px', background: '#22c55e', border: '3px solid white', borderRadius: '50%' }}></div>}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, color: 'var(--ink)', fontSize: '1rem' }}>{b.ho_ten}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 900, textTransform: 'uppercase' }}>{b.chuyen_mon || 'Nhân viên'}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '20px' }}>
                  <div style={{ fontWeight: 700, color: 'var(--ink)', fontSize: '0.9rem' }}>{b.so_dien_thoai || "—"}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 600 }}>{b.email}</div>
                </td>
                <td style={{ padding: '20px' }}>
                  <span style={{
                    padding: '8px 16px', borderRadius: '50px', fontSize: '0.7rem', fontWeight: 900,
                    background: b.trang_thai === 'Đang làm việc' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: b.trang_thai === 'Đang làm việc' ? '#16a34a' : '#dc2626',
                    border: b.trang_thai === 'Đang làm việc' ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)'
                  }}>
                    {b.trang_thai?.toUpperCase() || 'KHÔNG XÁC ĐỊNH'}
                  </span>
                </td>
                <td style={{ padding: '20px' }}>
                  <div style={{ fontWeight: 800, color: 'var(--ink)', fontSize: '0.9rem' }}>{tinhKinhNghiem(b.ngay_vao_lam)}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 600 }}>{b.ngay_vao_lam || "N/A"}</div>
                </td>
                <td style={{ padding: '20px' }}>
                  {b.chuyen_mon?.toLowerCase() === 'quản lý' ? (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: 'var(--danger-light, rgba(239, 68, 68, 0.1))', color: 'var(--danger)', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 900 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>admin_panel_settings</span>
                      QUẢN TRỊ VIÊN
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-pill" onClick={() => handleOpenEdit(b)} style={{ background: 'var(--gray-50)', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 800 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                        Sửa
                      </button>
                      {currentUser?.id_nhan_vien !== b.id_nhan_vien && (
                        <button className="btn btn-pill" onClick={() => handleDelete(b.id_nhan_vien)} style={{ background: 'var(--danger-light, rgba(239, 68, 68, 0.15))', color: 'var(--danger)', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 800 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                          Xóa
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default React.memo(QuanLyNhanVienPhanQuyen);
