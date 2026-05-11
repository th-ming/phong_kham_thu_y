import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "@services/axios";

const API_URL = `/api/auth`;

const DangNhapDangKy: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const GOOGLE_CLIENT_ID = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    const savedUsername = localStorage.getItem("rememberedUsername");
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);

  useEffect(() => {
    let timer: number;
    let isMounted = true;
    const initGoogle = () => {
      if ((window as any).google) {
        if (GOOGLE_CLIENT_ID) {
          (window as any).google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleResponse
          });
          const googleBtnEl = document.getElementById("googleBtn");
          if (googleBtnEl) {
            googleBtnEl.replaceChildren();
            (window as any).google.accounts.id.renderButton(
              googleBtnEl,
              { theme: "outline", size: "large", width: "100%", shape: "pill" }
            );
          }
        }
      } else {
        if (isMounted) timer = window.setTimeout(initGoogle, 500);
      }
    };
    initGoogle();
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, []);

  const handleGoogleResponse = async (response: any) => {
    try {
      setLoading(true);
      const res = await axiosInstance.post(`${API_URL}/google-login`, {
        token: response.credential
      });
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        if (res.data.refreshToken) {
          localStorage.setItem("refreshToken", res.data.refreshToken);
        }
        localStorage.setItem("user", JSON.stringify(res.data.user));

        const role = (res.data.user.loai_tai_khoan || res.data.user.ten_vai_tro || '').toLowerCase();
        if (role.includes('admin') || role.includes('staff') || role.includes('bac_si') || role.includes('bác sĩ') || 
            role.includes('quan-ly') || role.includes('quản trị') || role.includes('nhan-vien') || role.includes('kế toán') || role.includes('ke-toan')) {
          navigate("/quan-ly/dashboard");
        } else {
          navigate("/");
        }
      }
    } catch (err: any) {
      console.error("Lỗi Google Login:", err);
      let errorMessage = "Đăng nhập Google thất bại.";
      if (err.response?.data) {
        const d = err.response.data;
        if (typeof d === 'string' && d.trim() !== '' && !d.startsWith('<')) errorMessage = d;
        else if (d.message && typeof d.message === 'string') errorMessage = d.message;
      } else if (err.message) {
        errorMessage = `Lỗi kết nối: ${err.message}`;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!isLogin) {
      if (password !== confirmPassword) {
        setError("Mật khẩu xác nhận không khớp!");
        setLoading(false);
        return;
      }
    }

    try {
      const endpoint = isLogin ? "/login" : "/register";
      const payload = isLogin ? { username, password } : { ten_dang_nhap: username, mat_khau: password, ten_khach_hang: fullname, email, sdt: phone, dia_chi: address };
      const res = await axiosInstance.post(`${API_URL}${endpoint}`, payload);
      if (isLogin && res.data.token) {
        localStorage.setItem("token", res.data.token);
        if (res.data.refreshToken) {
          localStorage.setItem("refreshToken", res.data.refreshToken);
        }
        localStorage.setItem("user", JSON.stringify(res.data.user));

        if (rememberMe) {
          localStorage.setItem("rememberedUsername", username);
        } else {
          localStorage.removeItem("rememberedUsername");
        }

        const role = (res.data.user.loai_tai_khoan || res.data.user.ten_vai_tro || '').toLowerCase();
        if (role.includes('admin') || role.includes('staff') || role.includes('bac_si') || role.includes('bác sĩ') || 
            role.includes('quan-ly') || role.includes('quản trị') || role.includes('nhan-vien') || role.includes('kế toán') || role.includes('ke-toan')) {
          navigate("/quan-ly/dashboard");
        } else {
          navigate("/");
        }
      } else if (!isLogin) {
        setIsLogin(true);
        setPassword("");
        setConfirmPassword("");
        setSuccess("Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.");
      }
    } catch (err: any) {
      let errorMessage = "Đã xảy ra lỗi không xác định. Vui lòng thử lại.";
      if (err.response?.data) {
        const d = err.response.data;
        if (typeof d === 'string' && d.trim() !== '' && !d.startsWith('<')) errorMessage = d;
        else if (d.message && typeof d.message === 'string') errorMessage = d.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="aura-blob blob-1"></div>
      <div className="aura-blob blob-2"></div>

      <style>{`
        /* --- CƯỠNG BỨC MÀU SÁNG CHO TRANG ĐĂNG NHẬP (ANTI-DUMB) --- */
        
        .auth-container {
          min-height: 100vh;
          background: #f0f2f5 !important; /* Cưỡng bức nền trắng sáng */
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
          transition: background 0.4s ease;
        }

        .auth-card {
          background: #ffffff !important; /* Cưỡng bức card trắng */
          border-radius: 24px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          position: relative;
          z-index: 10;
          display: grid;
          grid-template-columns: 1.1fr 1.2fr; /* Tăng tỷ lệ cho phần form */
          width: 100%;
          max-width: 1150px; /* Nới rộng card */
          margin: auto;
          border: 1px solid #f1f5f9;
        }

        .auth-sidebar {
          background: #0d9488 !important; /* Xanh Teal chuẩn sếp yêu cầu */
          padding: 40px; /* Thu nhỏ padding sidebar */
          color: white !important;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: center;
          overflow: hidden;
        }

        .auth-title {
          font-size: 2rem;
          font-weight: 800;
          color: #1e293b !important; /* Chữ đen đậm */
          letter-spacing: -1px;
        }

        .input-group {
          background: #f8fafc !important;
          border: 1.5px solid #e2e8f0 !important;
          border-radius: 12px;
          padding: 2px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .input-group input {
          background: transparent !important;
          border: none !important;
          width: 100%;
          padding: 14px 0;
          outline: none !important;
          font-weight: 600;
          color: #1e293b !important;
        }

        /* CHỈ KHI CÓ DATA-THEME DARK THÌ MỚI ĐƯỢC PHÉP TỐI */
        [data-theme='dark'] .auth-container { background: #020617 !important; }
        [data-theme='dark'] .auth-card { background: rgba(15, 23, 42, 0.7) !important; border: 1px solid rgba(255,255,255,0.1) !important; }
        [data-theme='dark'] .auth-sidebar { background: linear-gradient(135deg, #0d9488 0%, #8b5cf6 100%) !important; }
        [data-theme='dark'] .auth-title { color: #fff !important; }
        [data-theme='dark'] .input-group { background: rgba(255,255,255,0.03) !important; border-color: rgba(255,255,255,0.1) !important; }
        [data-theme='dark'] .input-group input { color: #fff !important; }
        [data-theme='dark'] .aura-blob { opacity: 0.3; }

        .aura-blob {
          position: absolute;
          width: 600px;
          height: 600px;
          border-radius: 50%;
          filter: blur(120px);
          z-index: 0;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.5s ease;
        }
        .blob-1 { top: -150px; left: -150px; background: #0d9488; }
        .blob-2 { bottom: -150px; right: -150px; background: #8b5cf6; }

        @media (max-width: 900px) {
          .auth-card { grid-template-columns: 1fr; }
          .auth-sidebar { display: none; }
        }
      `}</style>

      {/* HEADER CỦA SẾP */}
      <header style={{ padding: '30px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 10 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '15px', textDecoration: 'none' }}>
          <div style={{ background: '#0d9488', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/img/avtpkty.png" alt="Rexi" style={{ width: '70%', filter: 'brightness(0) invert(1)' }} />
          </div>
          <div className="logo-container">
            <div style={{ fontSize: '1.8rem', fontWeight: 950, color: '#0d9488' }}>Rexi</div>
            <div style={{ fontSize: '0.7rem', fontWeight: 850, color: '#0d9488', opacity: 0.8 }}>Phòng Khám Thú Y</div>
          </div>
        </Link>
        <Link to="/" style={{ background: 'white', color: '#1e293b', padding: '12px 24px', borderRadius: '50px', textDecoration: 'none', fontWeight: 800, border: '1px solid #e2e8f0' }}>Về trang chủ</Link>
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div className="auth-card">
          <div className="auth-sidebar">
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 800, marginBottom: '24px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>verified</span> HỆ THỐNG THÚ Y SỐ 1
              </div>
              <h2 style={{ fontSize: '3.5rem', fontWeight: 950, lineHeight: 1.1, marginBottom: '32px', letterSpacing: '-2px' }}>Đồng hành <br /> cùng bé yêu</h2>
              <p style={{ fontSize: '1.1rem', opacity: 0.9, lineHeight: 1.8, marginBottom: '48px', maxWidth: '400px' }}>Hơn 10,000 chủ nuôi đã tin tưởng Rexi. Hãy đăng nhập để quản lý sức khỏe thú cưng của bạn một cách chuyên nghiệp nhất.</p>
              
              <div style={{ display: 'grid', gap: '20px' }}>
                {[{ t: 'Đặt lịch nhanh chóng', i: 'schedule' }, { t: 'Theo dõi bệnh án online', i: 'description' }, { t: 'Nhận tư vấn từ bác sĩ', i: 'chat' }].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '32px', height: '32px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{item.i}</span>
                    </div>
                    <span style={{ fontWeight: 700 }}>{item.t}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ padding: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ marginBottom: '40px' }}>
              <h3 className="auth-title">{isLogin ? 'Chào mừng trở lại!' : 'Tham gia cùng Rexi'}</h3>
              <p style={{ color: '#64748b', fontWeight: 600, marginTop: '8px' }}>Vui lòng nhập thông tin tài khoản</p>
            </div>

            {error && <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#b91c1c', padding: '14px', borderRadius: '16px', marginBottom: '24px', fontSize: '0.85rem', fontWeight: 700 }}>{error}</div>}
            {success && <div style={{ background: '#f0fdf4', border: '1px solid #dcfce7', color: '#15803d', padding: '14px', borderRadius: '16px', marginBottom: '24px', fontSize: '0.85rem', fontWeight: 700 }}>{success}</div>}

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '12px' }}>
              {!isLogin ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="input-group">
                    <span className="material-symbols-outlined" style={{ color: '#0d9488', opacity: 0.7, fontSize: '18px' }}>badge</span>
                    <input placeholder="Họ và tên" value={fullname} onChange={e => setFullname(e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <span className="material-symbols-outlined" style={{ color: '#0d9488', opacity: 0.7, fontSize: '18px' }}>mail</span>
                    <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <span className="material-symbols-outlined" style={{ color: '#0d9488', opacity: 0.7, fontSize: '18px' }}>phone</span>
                    <input placeholder="Số điện thoại" value={phone} onChange={e => setPhone(e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <span className="material-symbols-outlined" style={{ color: '#0d9488', opacity: 0.7, fontSize: '18px' }}>location_on</span>
                    <input placeholder="Địa chỉ" value={address} onChange={e => setAddress(e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <span className="material-symbols-outlined" style={{ color: '#0d9488', opacity: 0.7, fontSize: '18px' }}>person</span>
                    <input placeholder="Tên đăng nhập" value={username} onChange={e => setUsername(e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <span className="material-symbols-outlined" style={{ color: '#0d9488', opacity: 0.7, fontSize: '18px' }}>lock</span>
                    <input type={showPassword ? "text" : "password"} placeholder="Mật khẩu" value={password} onChange={e => setPassword(e.target.value)} required />
                  </div>
                  <div className="input-group" style={{ gridColumn: 'span 2' }}>
                    <span className="material-symbols-outlined" style={{ color: '#0d9488', opacity: 0.7, fontSize: '18px' }}>lock_reset</span>
                    <input type={showPassword ? "text" : "password"} placeholder="Xác nhận mật khẩu" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                  </div>
                </div>
              ) : (
                <>
                  <div className="input-group">
                    <span className="material-symbols-outlined" style={{ color: '#0d9488', opacity: 0.7 }}>person</span>
                    <input placeholder="Tên đăng nhập" value={username} onChange={e => setUsername(e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <span className="material-symbols-outlined" style={{ color: '#0d9488', opacity: 0.7 }}>lock</span>
                    <input type={showPassword ? "text" : "password"} placeholder="Mật khẩu" value={password} onChange={e => setPassword(e.target.value)} required />
                    <span className="material-symbols-outlined" onClick={() => setShowPassword(!showPassword)} style={{ cursor: 'pointer', color: '#94a3b8' }}>{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </div>
                  
                  {/* CHỨC NĂNG GHI NHỚ & QUÊN MẬT KHẨU CỦA SẾP ĐÂY Ạ */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0, textTransform: 'none', color: '#64748b', fontSize: '0.9rem' }}>
                      <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                      Ghi nhớ đăng nhập
                    </label>
                    <Link to="/quen-mat-khau" style={{ color: '#0d9488', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 800 }}>Quên mật khẩu?</Link>
                  </div>
                </>
              )}
              <button type="submit" className="btn-auth" style={{ background: '#0d9488', color: 'white', border: 'none', borderRadius: '50px', padding: '16px', fontWeight: 800, cursor: 'pointer', marginTop: '10px' }}>{loading ? 'Đang xử lý...' : (isLogin ? 'Đăng nhập ngay' : 'Đăng ký')}</button>
            </form>

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <p style={{ color: '#64748b', fontWeight: 700, fontSize: '0.9rem' }}>
                {isLogin ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
                <span 
                  onClick={() => setIsLogin(!isLogin)} 
                  style={{ color: '#0d9488', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  {isLogin ? "Đăng ký ngay" : "Đăng nhập"}
                </span>
              </p>
            </div>

            <div style={{ margin: '30px 0', textAlign: 'center', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', left: 0, width: '100%', height: '1px', background: '#e2e8f0', zIndex: 0 }}></div>
              <span style={{ position: 'relative', zIndex: 1, background: 'white', padding: '0 15px', fontSize: '0.75rem', color: '#94a3b8', fontWeight: 900 }}>HOẶC</span>
            </div>
            <div id="googleBtn" style={{ width: '100%' }}></div>
          </div>
        </div>
      </main>
      <footer style={{ padding: '40px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', fontWeight: 700 }}>© 2026 REXI VETERINARY SYSTEM. ALL RIGHTS RESERVED.</p>
      </footer>
    </div>
  );
};

export default React.memo(DangNhapDangKy);
