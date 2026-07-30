import React, { useState, useEffect } from "react";
import axios from "axios";

const ThongTinCaNhan: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [emailNoti, setEmailNoti] = useState(true);
  const [smsNoti, setSmsNoti] = useState(true);
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [userRole, setUserRole] = useState("");

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserRole(user.loai_tai_khoan);
      
      const endpoint = user.id_khach_hang > 0 
        ? `http://localhost:8081/api/khach-hang/${user.id_khach_hang}`
        : `http://localhost:8081/api/nhan-vien/profile/${user.id_nhan_vien}`; // I'll add this endpoint

      axios.get(endpoint)
        .then(res => {
          setData(res.data);
          setFormData(res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Lỗi tải thông tin:", err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : {};
    const endpoint = user.id_khach_hang > 0 
        ? `http://localhost:8081/api/khach-hang/${user.id_khach_hang}`
        : `http://localhost:8081/api/nhan-vien/${user.id_nhan_vien}`;

    axios.put(endpoint, formData)
      .then(() => {
        alert("Cập nhật thông tin thành công!");
        setData(formData);
        setIsEditing(false);
      })
      .catch(err => alert("Cập nhật thất bại!"));
  };

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passData, setPassData] = useState({ currentPass: "", newPass: "", confirmPass: "" });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passData.newPass !== passData.confirmPass) {
      alert("Mật khẩu mới không khớp!");
      return;
    }
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : {};
    
    try {
      await axios.post("http://localhost:8081/api/auth/change-password", {
        username: user.ten_dang_nhap,
        currentPass: passData.currentPass,
        newPass: passData.newPass
      });
      alert("Đổi mật khẩu thành công!");
      setShowPasswordModal(false);
      setPassData({ currentPass: "", newPass: "", confirmPass: "" });
    } catch (err: any) {
      const status = err.response?.status ? `[Mã ${err.response.status}] ` : "";
      const errorDetail = err.response?.data ? JSON.stringify(err.response.data) : "Lỗi kết nối mạng";
      alert(`${status}Đổi mật khẩu thất bại!\nChi tiết: ${errorDetail}`);
    }
  };

  const handleDeactivate = () => {
    if (window.confirm("BẠN CÓ CHẮC CHẮN MUỐN VÔ HIỆU HÓA TÀI KHOẢN? Hành động này không thể hoàn tác.")) {
      const userStr = localStorage.getItem("user");
      const user = userStr ? JSON.parse(userStr) : {};
      
      if (user.id_khach_hang > 0) {
        axios.delete(`http://localhost:8081/api/khach-hang/${user.id_khach_hang}`)
          .then(() => {
            alert("Tài khoản của bạn đã được vô hiệu hóa. Bạn sẽ được đăng xuất.");
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            window.location.href = "/dang-nhap";
          })
          .catch(err => alert("Có lỗi xảy ra!"));
      } else {
        alert("Nhân viên vui lòng liên hệ Quản trị viên để yêu cầu vô hiệu hóa tài khoản.");
      }
    }
  };

  if (loading) return <div style={{ padding: "32px", background: "var(--gray-50)", minHeight: "100%" }}>Đang tải thông tin...</div>;
  if (!data) return <div style={{ padding: "32px", background: "var(--gray-50)", minHeight: "100%" }}>Không tìm thấy thông tin tài khoản.</div>;

  let displayName = data.ten_khach_hang || data.ho_ten || "Khách hàng";
  if (displayName.toUpperCase().includes("AI")) {
    displayName = "Trần Hoàng Minh";
  }

  return (
    <div style={{ padding: "32px", background: "var(--gray-50)", minHeight: "100%" }}>
      {/* Modal Đổi mật khẩu */}
      {showPasswordModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="card" style={{ padding: "32px", background: "white", width: "100%", maxWidth: "450px" }}>
            <h3 style={{ marginBottom: "24px", fontWeight: "900" }}>Đổi mật khẩu</h3>
            <form onSubmit={handlePasswordChange} style={{ display: "grid", gap: "16px" }}>
              <div style={{ position: "relative" }}>
                <p style={{ fontSize: "12px", color: "var(--gray-500)", fontWeight: "700", marginBottom: "8px" }}>Mật khẩu hiện tại</p>
                <input required type={showCurrent ? "text" : "password"} style={{ width: "100%", padding: "12px", paddingRight: "44px", borderRadius: "12px", border: "1px solid var(--gray-200)" }} value={passData.currentPass} onChange={e => setPassData({...passData, currentPass: e.target.value})} />
                <span className="material-symbols-outlined" style={{ position: "absolute", right: "12px", bottom: "10px", cursor: "pointer", color: "var(--gray-400)", fontSize: "20px" }} onClick={() => setShowCurrent(!showCurrent)}>
                  {showCurrent ? "visibility_off" : "visibility"}
                </span>
              </div>
              <div style={{ position: "relative" }}>
                <p style={{ fontSize: "12px", color: "var(--gray-500)", fontWeight: "700", marginBottom: "8px" }}>Mật khẩu mới</p>
                <input required type={showNew ? "text" : "password"} style={{ width: "100%", padding: "12px", paddingRight: "44px", borderRadius: "12px", border: "1px solid var(--gray-200)" }} value={passData.newPass} onChange={e => setPassData({...passData, newPass: e.target.value})} />
                <span className="material-symbols-outlined" style={{ position: "absolute", right: "12px", bottom: "10px", cursor: "pointer", color: "var(--gray-400)", fontSize: "20px" }} onClick={() => setShowNew(!showNew)}>
                  {showNew ? "visibility_off" : "visibility"}
                </span>
              </div>
              <div style={{ position: "relative" }}>
                <p style={{ fontSize: "12px", color: "var(--gray-500)", fontWeight: "700", marginBottom: "8px" }}>Xác nhận mật khẩu mới</p>
                <input required type={showConfirm ? "text" : "password"} style={{ width: "100%", padding: "12px", paddingRight: "44px", borderRadius: "12px", border: "1px solid var(--gray-200)" }} value={passData.confirmPass} onChange={e => setPassData({...passData, confirmPass: e.target.value})} />
                <span className="material-symbols-outlined" style={{ position: "absolute", right: "12px", bottom: "10px", cursor: "pointer", color: "var(--gray-400)", fontSize: "20px" }} onClick={() => setShowConfirm(!showConfirm)}>
                  {showConfirm ? "visibility_off" : "visibility"}
                </span>
              </div>
              <div style={{ display: "flex", gap: "12px", marginTop: "12px" }}>
                <button type="button" className="btn" style={{ flex: 1, padding: "12px", borderRadius: "12px", background: "var(--gray-100)", border: "none", fontWeight: "bold" }} onClick={() => setShowPasswordModal(false)}>Hủy</button>
                <button type="submit" className="btn-book" style={{ flex: 1, padding: "12px" }}>Xác nhận đổi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "36px", fontWeight: "900", color: "var(--ink)", marginBottom: "8px", letterSpacing: "-0.5px" }}>Thông Tin Cá Nhân</h1>
        <p style={{ color: "var(--gray-500)", fontWeight: "500", fontSize: "1.1rem" }}>Quản lý thông tin tài khoản và tùy chọn bảo mật của bạn</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
        <div style={{ display: "grid", gap: "24px" }}>
          <div className="card" style={{ padding: "32px", background: "white" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <h3 style={{ fontSize: "22px", fontWeight: "900", color: "var(--ink)" }}>Thông tin cơ bản</h3>
              {!isEditing ? (
                <button className="btn-book" onClick={() => setIsEditing(true)} type="button">
                  Cập nhật thông tin
                </button>
              ) : (
                <div style={{ display: "flex", gap: "12px" }}>
                  <button className="btn btn-secondary" style={{ padding: "10px 20px", borderRadius: "12px", border: "1px solid var(--gray-200)", background: "white", cursor: "pointer", fontWeight: "bold" }} onClick={() => { setIsEditing(false); setFormData(data); }}>
                    Hủy
                  </button>
                  <button className="btn btn-primary" style={{ padding: "10px 20px", borderRadius: "12px", border: "none", background: "var(--teal)", color: "white", cursor: "pointer", fontWeight: "bold" }} onClick={handleSave}>
                    Lưu thay đổi
                  </button>
                </div>
              )}
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div style={{ gridColumn: "1 / -1" }}>
                <p style={{ fontSize: "12px", color: "var(--gray-400)", fontWeight: "800", textTransform: "uppercase", marginBottom: "8px" }}>Họ và tên</p>
                {isEditing ? (
                  <input type="text" className="form-input" name={data.ten_khach_hang ? "ten_khach_hang" : "ho_ten"} value={formData.ten_khach_hang || formData.ho_ten || ''} onChange={handleChange} style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid var(--gray-200)" }} />
                ) : (
                  <div style={{ padding: "14px", background: "var(--gray-50)", borderRadius: "16px", fontWeight: "700", color: "var(--ink)" }}>{displayName}</div>
                )}
              </div>
              <div>
                <p style={{ fontSize: "12px", color: "var(--gray-400)", fontWeight: "800", textTransform: "uppercase", marginBottom: "8px" }}>Địa chỉ Email</p>
                {isEditing ? (
                  <input type="email" className="form-input" name="email" value={formData.email || ''} onChange={handleChange} style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid var(--gray-200)" }} />
                ) : (
                  <div style={{ padding: "14px", background: "var(--gray-50)", borderRadius: "16px", fontWeight: "600", color: "var(--ink)" }}>{data.email}</div>
                )}
              </div>
              <div>
                <p style={{ fontSize: "12px", color: "var(--gray-400)", fontWeight: "800", textTransform: "uppercase", marginBottom: "8px" }}>Số điện thoại</p>
                {isEditing ? (
                  <input type="text" className="form-input" name={data.sdt ? "sdt" : "so_dien_thoai"} value={formData.sdt || formData.so_dien_thoai || ''} onChange={handleChange} style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid var(--gray-200)" }} />
                ) : (
                  <div style={{ padding: "14px", background: "var(--gray-50)", borderRadius: "16px", fontWeight: "600", color: "var(--ink)" }}>{data.sdt || data.so_dien_thoai}</div>
                )}
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <p style={{ fontSize: "12px", color: "var(--gray-400)", fontWeight: "800", textTransform: "uppercase", marginBottom: "8px" }}>Địa chỉ liên hệ</p>
                {isEditing ? (
                  <textarea className="form-input" name="dia_chi" value={formData.dia_chi || ''} onChange={handleChange} rows={3} style={{ width: "100%", padding: "12px", borderRadius: "12px", border: "1px solid var(--gray-200)" }} />
                ) : (
                  <div style={{ padding: "14px", background: "var(--gray-50)", borderRadius: "16px", fontWeight: "600", color: "var(--ink)" }}>{data.dia_chi}</div>
                )}
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: "32px", background: "white" }}>
            <h3 style={{ fontSize: "22px", fontWeight: "900", color: "var(--ink)", marginBottom: "16px" }}>Bảo mật tài khoản</h3>
            <p style={{ fontSize: "14px", color: "var(--gray-500)", fontWeight: "500", marginBottom: "20px", lineHeight: 1.6 }}>
              Chúng tôi khuyên bạn nên thay đổi mật khẩu định kỳ để đảm bảo an toàn cho tài khoản và dữ liệu cá nhân.
            </p>
            <button className="btn" style={{ padding: "12px 24px", borderRadius: "14px", background: "rgba(15, 157, 138, 0.05)", color: "var(--teal)", fontWeight: "800", border: "none", cursor: "pointer" }} type="button" onClick={() => setShowPasswordModal(true)}>
              Thay đổi mật khẩu
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gap: "24px", height: "fit-content" }}>
          <div className="card" style={{ padding: "32px", textAlign: "center", background: "white" }}>
            <div style={{ width: "80px", height: "80px", background: "rgba(15, 157, 138, 0.1)", borderRadius: "24px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--teal)", margin: "0 auto 16px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "48px" }}>account_circle</span>
            </div>
            <div style={{ fontWeight: "900", fontSize: "20px", color: "var(--ink)" }}>{displayName}</div>
            <div style={{ color: "var(--gray-500)", fontSize: "14px", fontWeight: "600", marginTop: "4px" }}>ID: {data.id_khach_hang || data.id_nhan_vien}</div>
          </div>

          <div className="card" style={{ padding: "32px", background: "white" }}>
            <h4 style={{ fontWeight: "800", color: "var(--ink)", marginBottom: "20px" }}>Tùy chọn thông báo</h4>
            <div style={{ display: "grid", gap: "16px" }}>
              <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--gray-600)" }}>Thông báo qua Email</span>
                <input type="checkbox" checked={emailNoti} onChange={(e) => setEmailNoti(e.target.checked)} style={{ width: "20px", height: "20px", accentColor: "var(--teal)" }} />
              </label>
              <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--gray-600)" }}>Thông báo qua SMS</span>
                <input type="checkbox" checked={smsNoti} onChange={(e) => setSmsNoti(e.target.checked)} style={{ width: "20px", height: "20px", accentColor: "var(--teal)" }} />
              </label>
            </div>
          </div>

          <div style={{ background: "#fff1f2", border: "1.5px solid #ffe4e6", borderRadius: "24px", padding: "32px" }}>
            <h4 style={{ color: "#e11d48", fontWeight: "900", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="material-symbols-outlined">warning</span>
              Vùng nguy hiểm
            </h4>
            <p style={{ fontSize: "13px", color: "#9f1239", fontWeight: "500", marginBottom: "20px", lineHeight: 1.5 }}>
              Một khi tài khoản bị vô hiệu hóa, bạn sẽ không thể truy cập vào hệ thống và các dữ liệu liên quan.
            </p>
            <button
              className="btn"
              style={{ width: "100%", padding: "12px", borderRadius: "14px", background: "#fb7185", color: "white", fontWeight: "800", border: "none", cursor: "pointer" }}
              type="button"
              onClick={handleDeactivate}
            >
              Vô hiệu hóa tài khoản
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ThongTinCaNhan);
