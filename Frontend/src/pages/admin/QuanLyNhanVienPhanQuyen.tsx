import React, { useState, useEffect, useMemo } from "react";
import axiosInstance from "@services/axios";
import { Modal } from "@components/CommonUI";
import { toast } from "@components/Toast";
import { getUserProfile, matchesSearchFields, normalizeSearchText, normalizeUserRole } from "@utils/index";

const QuanLyNhanVienPhanQuyen: React.FC = () => {
  const [nhanViens, setNhanViens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filterRole, setFilterRole] = useState("all");
  const [showPassword, setShowPassword] = useState(false);
  const [searchNhanVien, setSearchNhanVien] = useState("");
  const [searchAccount, setSearchAccount] = useState("");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any | null>(null);
  const [accountForm, setAccountForm] = useState({ ten_dang_nhap: "", id_vai_tro: "VT-3", trang_thai: "active", mat_khau: "", id_nhan_vien: "" });
  const [showAccountPassword, setShowAccountPassword] = useState(false);

  const currentUser = getUserProfile();
  const currentRole = normalizeUserRole(currentUser);
  const isAdmin = currentRole === "admin";
  const canManageStaff = isAdmin;

  const [formData, setFormData] = useState({
    ho_ten: "", so_dien_thoai: "", email: "", chuyen_mon: "Bác sĩ", trang_thai: "Đang làm việc",
    hinh_anh: "", gioi_thieu: "", ngay_vao_lam: "", tao_tai_khoan: true, ten_dang_nhap: "", mat_khau: ""
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

  const fetchAccounts = () => {
    if (!isAdmin) return;
    axiosInstance.get("/api/admin/tai-khoan/tat-ca")
      .then(res => setAccounts((res.data || []).filter((account: any) => account.id_nhan_vien || account.id_tai_khoan || account.nhan_vien)))
      .catch(err => {
        console.error("Lỗi lấy danh sách tài khoản:", err);
        toast.error(err.response?.data?.message || "Không tải được danh sách tài khoản.");
      });
  };

  useEffect(() => {
    fetchNhanViens();
    fetchAccounts();
  }, [isAdmin]);

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
      tao_tai_khoan: false,
      ten_dang_nhap: "",
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
      setFormData({ ho_ten: "", so_dien_thoai: "", email: "", chuyen_mon: "Bác sĩ", trang_thai: "Đang làm việc", hinh_anh: "", gioi_thieu: "", ngay_vao_lam: "", tao_tai_khoan: true, ten_dang_nhap: "", mat_khau: "" });
      fetchNhanViens();
      fetchAccounts();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Lỗi khi lưu thông tin nhân viên.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenAccountEdit = (account: any) => {
    setEditingAccount(account);
    setAccountForm({
      ten_dang_nhap: account.ten_dang_nhap || "",
      id_vai_tro: account.id_vai_tro || "VT-3",
      trang_thai: account.trang_thai || "active",
      mat_khau: "",
      id_nhan_vien: account.id_nhan_vien || ""
    });
    setShowAccountModal(true);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;
    try {
      const payload: any = { ...accountForm };
      if (!payload.mat_khau.trim()) delete payload.mat_khau;
      if (payload.id_nhan_vien === "") payload.id_nhan_vien = null; // Gửi null nếu không muốn liên kết
      await axiosInstance.put(`/api/admin/tai-khoan/${editingAccount.id_tai_khoan}`, payload);
      toast.success("Đã cập nhật tài khoản!");
      setShowAccountModal(false);
      setEditingAccount(null);
      setAccountForm({ ten_dang_nhap: "", id_vai_tro: "VT-3", trang_thai: "active", mat_khau: "", id_nhan_vien: "" });
      fetchAccounts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi khi cập nhật tài khoản.");
    }
  };

  const handleResetPassword = async (account: any) => {
    if (!window.confirm(`Đặt lại mật khẩu cho tài khoản ${account.ten_dang_nhap}?`)) return;
    try {
      const res = await axiosInstance.post(`/api/admin/tai-khoan/${account.id_tai_khoan}/reset-mk`);
      toast.success(`Mật khẩu mới: ${res.data?.mat_khau_tam_thoi}`);
      fetchAccounts();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi khi đặt lại mật khẩu.");
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
    let result = nhanViens;
    if (filterRole !== "all") {
      result = nhanViens.filter(nv => normalizeSearchText(nv.chuyen_mon) === normalizeSearchText(filterRole));
    }
    if (searchNhanVien.trim() !== "") {
      result = result.filter(nv => {
        return matchesSearchFields(searchNhanVien, [
          nv.id_nhan_vien,
          nv.ho_ten,
          nv.so_dien_thoai,
          nv.sdt,
          nv.email,
          nv.chuyen_mon,
          nv.trang_thai,
          nv.dia_chi
        ]);
      });
    }
    return result;
  }, [nhanViens, filterRole, searchNhanVien]);

  const filteredAccounts = useMemo(() => {
    if (!searchAccount.trim()) return accounts;
    return accounts.filter(account => matchesSearchFields(searchAccount, [
      account.id_tai_khoan,
      account.ten_dang_nhap,
      account.id_vai_tro,
      account.trang_thai,
      account.id_nhan_vien,
      account.mat_khau_hien_thi,
      account.nhan_vien?.ho_ten,
      account.nhan_vien?.email,
      account.nhan_vien?.so_dien_thoai,
      account.nhan_vien?.chuyen_mon
    ]));
  }, [accounts, searchAccount]);

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
        .table-row:hover { background-color: var(--surface) !important; transform: scale(1.005) translateX(4px); box-shadow: -10px 10px 20px rgba(15, 157, 138, 0.05); z-index: 10; position: relative; }
        [data-theme='dark'] .table-row:hover { background-color: rgba(15, 23, 42, 0.96) !important; box-shadow: -10px 10px 24px rgba(34, 211, 238, 0.08); }
      `}</style>
      <div className="stagger-1" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 950, color: 'var(--ink)', letterSpacing: '-1.5px', margin: 0 }}>Nhân sự & <span style={{ color: 'var(--primary)' }}>Quyền hạn</span></h1>
          <p style={{ color: 'var(--gray-500)', fontWeight: 600, marginTop: '8px' }}>Quản lý đội ngũ y bác sĩ và phân cấp quyền truy cập hệ thống.</p>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', padding: '0 16px', borderRadius: '16px', border: '1px solid var(--gray-200)', background: 'var(--surface)', width: '260px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--gray-400)', marginRight: '8px' }}>search</span>
            <input data-ai-id="input-quanlynhanvienphanquyen-14e1"
              type="text"
              placeholder="Tìm tên, SĐT, email..."
              value={searchNhanVien}
              onChange={(e) => setSearchNhanVien(e.target.value)}
              style={{ border: 'none', outline: 'none', background: 'transparent', padding: '10px 0', fontWeight: 600, width: '100%', color: 'var(--ink)', fontSize: '0.9rem' }}
            />
          </div>
          <select data-ai-id="select-quanlynhanvienphanquyen-gi4p"
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
          <button data-ai-id="button-quanlynhanvienphanquyen-qia6" className="btn btn-primary btn-pill" onClick={() => { setEditingId(null); setFormData({ ho_ten: "", so_dien_thoai: "", email: "", chuyen_mon: "Bác sĩ", trang_thai: "Đang làm việc", hinh_anh: "", gioi_thieu: "", ngay_vao_lam: "", tao_tai_khoan: true, ten_dang_nhap: "", mat_khau: "" }); setShowModal(true); }}>
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
              <input data-ai-id="input-quanlynhanvienphanquyen-xxff" id="ho_ten" required className="btn" style={{ background: 'var(--gray-50)', textAlign: 'left', cursor: 'text' }} value={formData.ho_ten} onChange={e => setFormData({ ...formData, ho_ten: e.target.value })} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'grid', gap: '8px' }}>
                <label htmlFor="chuyen_mon" style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)' }}>CHUYÊN MÔN</label>
                <select data-ai-id="select-quanlynhanvienphanquyen-pl4x" id="chuyen_mon" className="btn" style={{ background: 'var(--gray-50)', textAlign: 'left' }} value={formData.chuyen_mon} onChange={e => setFormData({ ...formData, chuyen_mon: e.target.value })}>
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
                <select data-ai-id="select-quanlynhanvienphanquyen-mpwl" id="trang_thai" className="btn" style={{ background: 'var(--gray-50)', textAlign: 'left' }} value={formData.trang_thai} onChange={e => setFormData({ ...formData, trang_thai: e.target.value })}>
                  <option value="Đang làm việc">Đang làm việc</option>
                  <option value="Tạm nghỉ">Tạm nghỉ</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '8px' }}>
              <label htmlFor="so_dien_thoai" style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)' }}>SỐ ĐIỆN THOẠI</label>
              <input data-ai-id="input-quanlynhanvienphanquyen-xg0w" id="so_dien_thoai" required className="btn" style={{ background: 'var(--gray-50)', textAlign: 'left', cursor: 'text' }} value={formData.so_dien_thoai} onChange={e => setFormData({ ...formData, so_dien_thoai: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label htmlFor="email" style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)' }}>EMAIL</label>
              <input data-ai-id="input-quanlynhanvienphanquyen-2gk3" id="email" required type="email" className="btn" style={{ background: 'var(--gray-50)', textAlign: 'left', cursor: 'text' }} value={formData.email} onChange={e => {
                const email = e.target.value;
                const suggestedUsername = email.includes("@") ? email.split("@")[0] : email;
                setFormData({
                  ...formData,
                  email,
                  ten_dang_nhap: (!editingId && (!formData.ten_dang_nhap || formData.ten_dang_nhap === formData.email.split("@")[0])) ? suggestedUsername : formData.ten_dang_nhap
                });
              }} />
            </div>

            {!editingId && (
              <div style={{ display: 'grid', gap: '14px', padding: '16px', border: '1px solid var(--gray-200)', borderRadius: '18px', background: 'var(--surface)' }}>
                <label htmlFor="tao_tai_khoan" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem', fontWeight: 900, color: 'var(--ink)', cursor: 'pointer' }}>
                  <input
                    id="tao_tai_khoan"
                    type="checkbox"
                    checked={formData.tao_tai_khoan}
                    onChange={e => setFormData({ ...formData, tao_tai_khoan: e.target.checked })}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--primary)' }}
                  />
                  Tạo tài khoản đăng nhập cho nhân sự này
                </label>

                {formData.tao_tai_khoan && (
                  <>
                    <div style={{ display: 'grid', gap: '8px' }}>
                      <label htmlFor="ten_dang_nhap" style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)' }}>TÊN ĐĂNG NHẬP</label>
                      <input
                        id="ten_dang_nhap"
                        required={formData.tao_tai_khoan}
                        className="btn"
                        placeholder="Ví dụ: bacsi_lan"
                        style={{ background: 'var(--gray-50)', textAlign: 'left', cursor: 'text' }}
                        value={formData.ten_dang_nhap}
                        onChange={e => setFormData({ ...formData, ten_dang_nhap: e.target.value })}
                      />
                    </div>
                    <div style={{ display: 'grid', gap: '8px' }}>
                      <label htmlFor="mat_khau" style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)' }}>MẬT KHẨU BAN ĐẦU</label>
                      <div style={{ position: 'relative' }}>
                        <input data-ai-id="input-quanlynhanvienphanquyen-mscf"
                          id="mat_khau"
                          required={formData.tao_tai_khoan}
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
                  </>
                )}
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
                  <input data-ai-id="input-quanlynhanvienphanquyen-b8cb" id="upload-avatar" type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => {
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
              <input data-ai-id="input-quanlynhanvienphanquyen-1fk6" id="ngay_vao_lam" type="date" required className="btn" style={{ background: 'var(--gray-50)', textAlign: 'left', cursor: 'text' }} value={formData.ngay_vao_lam} onChange={e => setFormData({ ...formData, ngay_vao_lam: e.target.value })} />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button data-ai-id="button-quanlynhanvienphanquyen-ep1p" type="submit" disabled={isSaving} className="btn btn-primary btn-pill" style={{ flex: 1, fontWeight: 900 }}>{isSaving ? 'ĐANG LƯU...' : 'LƯU THÔNG TIN'}</button>
              <button data-ai-id="button-quanlynhanvienphanquyen-0qxq" type="button" onClick={() => setShowModal(false)} className="btn btn-pill" style={{ flex: 1, background: 'var(--gray-100)', color: 'var(--ink)', fontWeight: 800 }}>HỦY</button>
            </div>
          </form>
        </div>
      </Modal>

      <Modal isOpen={showAccountModal} onClose={() => { setShowAccountModal(false); setShowAccountPassword(false); }} title="Sửa tài khoản đăng nhập" maxWidth="520px">
        <form onSubmit={handleSaveAccount} style={{ display: 'grid', gap: '18px' }}>
          <div style={{ display: 'grid', gap: '8px' }}>
            <label htmlFor="account_username" style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)' }}>TÊN ĐĂNG NHẬP</label>
            <input id="account_username" required className="btn" style={{ background: 'var(--gray-50)', textAlign: 'left', cursor: 'text' }} value={accountForm.ten_dang_nhap} onChange={e => setAccountForm({ ...accountForm, ten_dang_nhap: e.target.value })} />
          </div>
          <div style={{ display: 'grid', gap: '8px' }}>
            <label htmlFor="account_nhan_vien" style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)' }}>LIÊN KẾT NHÂN VIÊN</label>
            <select id="account_nhan_vien" className="btn" style={{ background: 'var(--gray-50)', textAlign: 'left' }} value={accountForm.id_nhan_vien} onChange={e => setAccountForm({ ...accountForm, id_nhan_vien: e.target.value })}>
              <option value="">-- Không liên kết (Tài khoản độc lập) --</option>
              {nhanViens.map(nv => (
                <option key={nv.id_nhan_vien} value={nv.id_nhan_vien}>
                  {nv.ho_ten} ({nv.chuyen_mon})
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label htmlFor="account_role" style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)' }}>VAI TRÒ</label>
              <select id="account_role" className="btn" style={{ background: 'var(--gray-50)', textAlign: 'left' }} value={accountForm.id_vai_tro} onChange={e => setAccountForm({ ...accountForm, id_vai_tro: e.target.value })}>
                <option value="VT-ADMIN">Admin</option>
                <option value="VT-QL">Quản lý</option>
                <option value="VT-BS">Bác sĩ</option>
                <option value="VT-YT">Y tá</option>
                <option value="VT-TT">Tiếp tân</option>
                <option value="VT-KT">Kế toán</option>
                <option value="VT-3">Nhân viên</option>
              </select>
            </div>
            <div style={{ display: 'grid', gap: '8px' }}>
              <label htmlFor="account_status" style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)' }}>TRẠNG THÁI</label>
              <select id="account_status" className="btn" style={{ background: 'var(--gray-50)', textAlign: 'left' }} value={accountForm.trang_thai} onChange={e => setAccountForm({ ...accountForm, trang_thai: e.target.value })}>
                <option value="active">Hoạt động</option>
                <option value="inactive">Khóa</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gap: '8px' }}>
            <label htmlFor="account_password" style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)' }}>MẬT KHẨU MỚI</label>
            <div style={{ position: 'relative' }}>
              <input id="account_password" type={showAccountPassword ? "text" : "password"} placeholder="Bỏ trống nếu không đổi" className="btn" style={{ background: 'var(--gray-50)', textAlign: 'left', cursor: 'text', width: '100%', paddingRight: '45px' }} value={accountForm.mat_khau} onChange={e => setAccountForm({ ...accountForm, mat_khau: e.target.value })} />
              <span className="material-symbols-outlined" onClick={() => setShowAccountPassword(!showAccountPassword)} style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--gray-400)', userSelect: 'none', fontSize: '20px' }}>
                {showAccountPassword ? 'visibility_off' : 'visibility'}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button type="submit" className="btn btn-primary btn-pill" style={{ flex: 1, fontWeight: 900 }}>LƯU TÀI KHOẢN</button>
            <button type="button" onClick={() => setShowAccountModal(false)} className="btn btn-pill" style={{ flex: 1, background: 'var(--gray-100)', color: 'var(--ink)', fontWeight: 800 }}>HỦY</button>
          </div>
        </form>
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
                  {canManageStaff ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button data-ai-id="button-quanlynhanvienphanquyen-z9sz" className="btn btn-pill" onClick={() => handleOpenEdit(b)} style={{ background: 'var(--gray-50)', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 800 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>edit</span>
                        Sửa
                      </button>
                      {currentUser?.id_nhan_vien !== b.id_nhan_vien && (
                        <button data-ai-id="button-quanlynhanvienphanquyen-cjvx" className="btn btn-pill" onClick={() => handleDelete(b.id_nhan_vien)} style={{ background: 'var(--danger-light, rgba(239, 68, 68, 0.15))', color: 'var(--danger)', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 800 }}>
                          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                          Xóa
                        </button>
                      )}
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--gray-400)' }}>CHỈ TẠO MỚI</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isAdmin && (
        <div className="glass-card" style={{ borderRadius: '32px', overflow: 'hidden', border: '1px solid var(--gray-100)', marginTop: '28px' }}>
          <div style={{ padding: '24px 24px 10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 950, color: 'var(--ink)' }}>Tài khoản đăng nhập</h2>
              <p style={{ margin: '6px 0 0 0', color: 'var(--gray-500)', fontWeight: 600, fontSize: '0.9rem' }}>Chỉ Admin được xem mật khẩu, sửa vai trò, khóa tài khoản và reset mật khẩu.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <div className="glass-card" style={{ display: 'flex', alignItems: 'center', padding: '0 14px', borderRadius: '16px', border: '1px solid var(--gray-200)', background: 'var(--surface)', width: '320px' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--gray-400)', marginRight: '8px' }}>search</span>
                <input
                  type="text"
                  placeholder="Tìm tài khoản, tên, email, SĐT..."
                  value={searchAccount}
                  onChange={(e) => setSearchAccount(e.target.value)}
                  style={{ border: 'none', outline: 'none', background: 'transparent', padding: '10px 0', fontWeight: 600, width: '100%', color: 'var(--ink)', fontSize: '0.9rem' }}
                />
              </div>
              <button className="btn btn-pill" onClick={fetchAccounts} style={{ background: 'var(--gray-50)', fontWeight: 800 }}>
                <span className="material-symbols-outlined">refresh</span>
                Tải lại
              </button>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--gray-50)', textAlign: 'left' }}>
                <th style={{ padding: '18px 20px', fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 800 }}>TÀI KHOẢN</th>
                <th style={{ padding: '18px 20px', fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 800 }}>NHÂN VIÊN</th>
                <th style={{ padding: '18px 20px', fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 800 }}>VAI TRÒ</th>
                <th style={{ padding: '18px 20px', fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 800 }}>MẬT KHẨU</th>
                <th style={{ padding: '18px 20px', fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 800 }}>HÀNH ĐỘNG</th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map((account) => (
                <tr key={account.id_tai_khoan} className="table-row" style={{ borderBottom: '1px solid var(--gray-50)', transition: 'all 0.3s ease' }}>
                  <td style={{ padding: '18px 20px' }}>
                    <div style={{ fontWeight: 900, color: 'var(--ink)' }}>{account.ten_dang_nhap}</div>
                    <div style={{ fontSize: '0.75rem', color: account.trang_thai === 'inactive' ? 'var(--danger)' : 'var(--gray-400)', fontWeight: 800 }}>{account.trang_thai || 'active'}</div>
                  </td>
                  <td style={{ padding: '18px 20px' }}>
                    <div style={{ display: 'grid', gap: '4px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 900, color: 'var(--ink)' }}>{account.nhan_vien?.ho_ten || 'Chưa liên kết tên'}</span>
                        <span style={{ padding: '3px 8px', borderRadius: '999px', background: 'var(--primary-light)', color: 'var(--primary)', fontSize: '0.68rem', fontWeight: 900 }}>
                          {account.id_nhan_vien || account.id_tai_khoan}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: 700 }}>
                        <span>{account.nhan_vien?.chuyen_mon || 'Nhân viên'}</span>
                        <span>{account.nhan_vien?.email || 'Chưa có email'}</span>
                        {account.nhan_vien?.so_dien_thoai && <span>{account.nhan_vien.so_dien_thoai}</span>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '18px 20px', fontWeight: 900, color: 'var(--primary)' }}>{account.id_vai_tro}</td>
                  <td style={{ padding: '18px 20px' }}>
                    <code style={{ padding: '6px 10px', borderRadius: '10px', background: 'var(--gray-50)', color: account.mat_khau_hien_thi ? 'var(--ink)' : 'var(--gray-400)', fontWeight: 800 }}>
                      {account.mat_khau_hien_thi || 'Cần reset để xem'}
                    </code>
                  </td>
                  <td style={{ padding: '18px 20px' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button className="btn btn-pill" onClick={() => handleOpenAccountEdit(account)} style={{ background: 'var(--gray-50)', padding: '8px 14px', fontSize: '0.8rem', fontWeight: 800 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>manage_accounts</span>
                        Sửa
                      </button>
                      <button className="btn btn-pill" onClick={() => handleResetPassword(account)} style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '8px 14px', fontSize: '0.8rem', fontWeight: 800 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>key</span>
                        Reset MK
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAccounts.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '28px 20px', textAlign: 'center', color: 'var(--gray-400)', fontWeight: 800 }}>
                    Không tìm thấy tài khoản phù hợp.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default React.memo(QuanLyNhanVienPhanQuyen);
