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
    // Kiểm tra xem trước đó người dùng có lưu tên đăng nhập không
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
            googleBtnEl.replaceChildren(); // Dọn dẹp an toàn thay vì innerHTML = ''
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
  }, []); // Bỏ isLogin để tránh Google API render lại nút liên tục gây rò rỉ bộ nhớ

  const handleGoogleResponse = async (response: any) => {
    try {
      setLoading(true);
      const res = await axiosInstance.post(`${API_URL}/google-login`, {
        // Gửi thẳng token gốc xuống Backend để bảo mật tuyệt đối
        token: response.credential
      });
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        if (res.data.refreshToken) {
          localStorage.setItem("refreshToken", res.data.refreshToken);
        }
        localStorage.setItem("user", JSON.stringify(res.data.user));

        // Điều hướng bao quát mọi thể loại tên Role từ Backend
        const role = (res.data.user.loai_tai_khoan || res.data.user.ten_vai_tro || '').toLowerCase();
        if (role.includes('admin') || role.includes('staff') || role.includes('bac_si') || role.includes('bác sĩ') || role.includes('quan-ly') || role.includes('nhan-vien')) {
          navigate("/quan-ly/dashboard");
        } else {
          navigate("/");
        }
      }
    } catch (err: any) {
      if (err.response?.status === 404 || err.response?.data?.message?.toLowerCase().includes('chưa được liên kết')) {
        // BẢO MẬT CAO: Lưu Token gốc vào session để sử dụng ở trang Liên kết
        window.sessionStorage.setItem("pending_google_token", response.credential);

        // Chỉ bóc tách hiển thị UI (không dùng dữ liệu này để gửi lên backend)
        try {
          // Giải mã an toàn JWT chuẩn Base64Url để không làm sập trình duyệt
          const base64Url = response.credential.split('.')[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
          const payload = JSON.parse(jsonPayload);
          window.sessionStorage.setItem("pending_google_user", JSON.stringify({
            name: payload.name, email: payload.email, picture: payload.picture
          }));
        } catch (e) { console.error("Lỗi đọc Token Google:", e); }
        navigate("/google-account-link");
      } else if (err.code === 'ERR_NETWORK') {
        setError("Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng!");
      } else {
        let errorMessage = "Đăng nhập Google thất bại.";
        if (err.response?.data) {
          const d = err.response.data;
          if (typeof d === 'string' && d.trim() !== '' && !d.startsWith('<')) errorMessage = d;
          else if (d.message && typeof d.message === 'string') errorMessage = d.message;
        }
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Bổ sung kiểm tra mật khẩu hợp lệ cho bước đăng ký
    if (!isLogin) {
      if (password !== confirmPassword) {
        setError("Mật khẩu xác nhận không khớp!");
        setLoading(false);
        return;
      }

      const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]*$/;
      if (password.length < 6 || !passwordRegex.test(password)) {
        setError("Mật khẩu phải từ 6 ký tự, gồm ít nhất 1 chữ cái, 1 số và 1 ký tự đặc biệt.");
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

        // Xử lý lưu hoặc xóa tên đăng nhập dựa trên checkbox
        if (rememberMe) {
          localStorage.setItem("rememberedUsername", username);
        } else {
          localStorage.removeItem("rememberedUsername");
        }

        // Điều hướng bao quát
        const role = (res.data.user.loai_tai_khoan || res.data.user.ten_vai_tro || '').toLowerCase();
        if (role.includes('admin') || role.includes('staff') || role.includes('bac_si') || role.includes('bác sĩ') || role.includes('quan-ly') || role.includes('nhan-vien')) {
          navigate("/quan-ly/dashboard");
        } else {
          // Khách hàng thì ở lại trang chủ
          navigate("/");
        }
      } else if (!isLogin) {
        setIsLogin(true);
        setPassword("");
        setConfirmPassword("");
        setSuccess("Đăng ký thành công! Vui lòng đăng nhập để tiếp tục.");
      }
    } catch (err: any) {
      if (err.code === 'ERR_NETWORK') {
        setError("Lỗi kết nối máy chủ. Vui lòng kiểm tra lại mạng hoặc thử lại sau.");
      } else {
        // Bóc tách lỗi chi tiết chuẩn quốc tế
        let errorMessage = "Đã xảy ra lỗi không xác định. Vui lòng thử lại.";
        if (err.response?.data) {
          const d = err.response.data;
          if (typeof d === 'string' && d.trim() !== '' && !d.startsWith('<')) errorMessage = d;
          else if (d.errors && Array.isArray(d.errors)) {
            const msgs = d.errors.map((x: any) => x.defaultMessage).filter(Boolean);
            if (msgs.length > 0) errorMessage = msgs.join(', ');
          } else if (d.message && typeof d.message === 'string') errorMessage = d.message;
        }
        const lowerMsg = errorMessage.toLowerCase();
        if (lowerMsg.includes('duplicate') || lowerMsg.includes('tồn tại')) errorMessage = "Email, SĐT hoặc Tên đăng nhập này đã được sử dụng. Hãy thử thông tin khác nhé!";
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>

      <style>{`
        .auth-card { background: var(--surface); border-radius: 40px; box-shadow: var(--shadow-xl); border: 1px solid var(--gray-200); }
        .input-group { background: var(--gray-50); border: 2px solid transparent; border-radius: 16px; padding: 4px 16px; transition: all 0.3s; }
        .input-group:focus-within { background: var(--surface); border-color: var(--primary); box-shadow: 0 10px 20px rgba(15, 157, 138, 0.05); }
        [data-theme='dark'] .input-group { background: var(--gray-800); }
        [data-theme='dark'] .auth-card { border-color: var(--gray-700); }
        .btn-primary { background: #0f9d8a; color: white; border: none; border-radius: 50px; font-weight: 900; transition: all 0.3s; cursor: pointer; }
        .btn-primary:hover { transform: translateY(-3px); box-shadow: 0 15px 30px rgba(15, 157, 138, 0.3); }
        .bg-wave { position: absolute; bottom: 0; left: 0; width: 100%; height: 50%; background: linear-gradient(to top, var(--primary-light), transparent); z-index: 0; opacity: 0.1; }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
        .floating-pets { position: absolute; top: 10%; right: 10%; animation: float 6s ease-in-out infinite; z-index: 0; opacity: 0.1; font-size: 200px; color: #0f9d8a; }
        .auth-card-layout { display: grid; grid-template-columns: 1.2fr 1fr; overflow: hidden; }
        .reg-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        .logo-text-container { display: flex; flex-direction: column; gap: 0; line-height: 1; }
        @media (max-width: 800px) {
          .auth-card-layout { grid-template-columns: 1fr !important; }
          .auth-sidebar { display: none !important; }
          .reg-grid { grid-template-columns: 1fr !important; }
          .reg-grid > div { grid-column: span 1 !important; }
        }
      `}</style>

      {/* hiệu ứng trang trí */}
      <div className="bg-wave"></div>
      <span className="material-symbols-outlined floating-pets">pets</span>
      <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '30%', height: '40%', background: 'radial-gradient(circle, rgba(15, 157, 138, 0.05) 0%, transparent 70%)', borderRadius: '50%' }}></div>

      {/* header trang đăng nhập */}
      <header style={{ padding: '30px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 10 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '15px', textDecoration: 'none' }}>
          <div style={{ background: '#0f9d8a', width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/img/avtpkty.png" alt="Rexi" style={{ width: '70%', filter: 'brightness(0) invert(1)' }} />
          </div>
          <div className="logo-text-container">
            <div style={{ fontSize: '2.2rem', fontWeight: 950, color: 'var(--ink)', letterSpacing: '-2px' }}>Rexi</div>
            <div style={{ fontSize: '0.8rem', color: '#0f9d8a', fontWeight: 800, letterSpacing: '1px', marginTop: '-5px', textTransform: 'uppercase' }}>Phòng Khám Thú Y</div>
          </div>
        </Link>
        <Link to="/" style={{ background: 'var(--surface)', color: 'var(--ink)', padding: '12px 24px', borderRadius: '50px', textDecoration: 'none', fontWeight: 800, fontSize: '0.9rem', border: '1px solid var(--gray-200)', boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>Về trang chủ</Link>
      </header>

      {/* khu vực form đăng nhập */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', position: 'relative', zIndex: 1 }}>
        <div className="auth-card auth-card-layout" style={{ width: '100%', maxWidth: '1000px' }}>

          {/* cột trái thông tin */}
          <div className="auth-sidebar" style={{ padding: '60px', background: '#0f9d8a', color: 'white', position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: '-20%', right: '-20%', width: '300px', height: '300px', background: 'rgba(255,255,255,0.1)', borderRadius: '50%' }}></div>
              <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '200px', height: '200px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }}></div>
            </div>

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 800, marginBottom: '24px', letterSpacing: '1px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>verified</span> HỆ THỐNG THÚ Y SỐ 1
              </div>
              <h2 style={{ fontSize: '3.5rem', fontWeight: 950, lineHeight: 1, marginBottom: '32px', letterSpacing: '-2px' }}>
                Đồng hành <br /> cùng bé yêu
              </h2>
              <p style={{ fontSize: '1.1rem', opacity: 0.9, lineHeight: 1.8, marginBottom: '48px', maxWidth: '400px' }}>
                Hơn 10,000 chủ nuôi đã tin tưởng Rexi. Hãy đăng nhập để quản lý sức khỏe thú cưng của bạn một cách chuyên nghiệp nhất.
              </p>

              <div style={{ display: 'grid', gap: '20px' }}>
                {[
                  { t: 'Đặt lịch nhanh chóng', i: 'schedule' },
                  { t: 'Theo dõi bệnh án online', i: 'description' },
                  { t: 'Nhận tư vấn từ bác sĩ', i: 'chat' }
                ].map((item, i) => (
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

          {/* cột phải form */}
          <div style={{ padding: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ marginBottom: '40px' }}>
              <h3 style={{ fontSize: '2rem', fontWeight: 950, color: 'var(--ink)', marginBottom: '8px', letterSpacing: '-1px' }}>
                {isLogin ? 'Chào mừng trở lại!' : 'Bắt đầu hành trình'}
              </h3>
              <p style={{ color: 'var(--gray-500)', fontWeight: 600 }}>{isLogin ? 'Nhập thông tin tài khoản của bạn' : 'Điền thông tin để đăng ký'}</p>
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#b91c1c', padding: '14px', borderRadius: '16px', marginBottom: '24px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>info</span> {error}
              </div>
            )}

            {success && (
              <div style={{ background: '#f0fdf4', border: '1px solid #dcfce7', color: '#15803d', padding: '14px', borderRadius: '16px', marginBottom: '24px', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>check_circle</span> {success}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '16px' }}>
              {isLogin ? (
                <>
                  <div className="input-group">
                    <input style={{ background: 'transparent', border: 'none', width: '100%', padding: '14px 0', outline: 'none', fontWeight: 700, color: 'var(--ink)' }} placeholder="Tên đăng nhập hoặc Email" value={username} onChange={e => setUsername(e.target.value)} required />
                  </div>
                  <div className="input-group" style={{ display: 'flex', alignItems: 'center' }}>
                    <input type={showPassword ? "text" : "password"} style={{ background: 'transparent', border: 'none', width: '100%', padding: '14px 0', outline: 'none', fontWeight: 700, color: 'var(--ink)' }} placeholder="Mật khẩu" value={password} onChange={e => setPassword(e.target.value)} required />
                    <span className="material-symbols-outlined" onClick={() => setShowPassword(!showPassword)} style={{ cursor: 'pointer', color: 'var(--gray-400)' }}>{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--gray-500)', fontWeight: 700, cursor: 'pointer' }}>
                      <input type="checkbox" style={{ accentColor: '#0f9d8a' }} checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} /> Ghi nhớ
                    </label>
                    <Link to="/quen-mat-khau" style={{ color: '#0f9d8a', fontWeight: 800, textDecoration: 'none' }}>Quên mật khẩu?</Link>
                  </div>
                </>
              ) : (
                <>
                  <div className="reg-grid">
                    <div className="input-group"><input style={{ background: 'transparent', color: 'var(--ink)', border: 'none', width: '100%', padding: '14px 0', outline: 'none', fontWeight: 700 }} placeholder="Họ và tên" value={fullname} onChange={e => setFullname(e.target.value)} required /></div>
                    <div className="input-group"><input style={{ background: 'transparent', color: 'var(--ink)', border: 'none', width: '100%', padding: '14px 0', outline: 'none', fontWeight: 700 }} placeholder="Số điện thoại" value={phone} onChange={e => setPhone(e.target.value)} required pattern="[0-9]{10,11}" title="Số điện thoại phải bao gồm 10 đến 11 chữ số" /></div>
                    <div className="input-group"><input type="email" style={{ background: 'transparent', color: 'var(--ink)', border: 'none', width: '100%', padding: '14px 0', outline: 'none', fontWeight: 700 }} placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
                    <div className="input-group"><input style={{ background: 'transparent', color: 'var(--ink)', border: 'none', width: '100%', padding: '14px 0', outline: 'none', fontWeight: 700 }} placeholder="Tên đăng nhập" value={username} onChange={e => setUsername(e.target.value)} required /></div>
                    <div className="input-group" style={{ gridColumn: 'span 2' }}><input style={{ background: 'transparent', color: 'var(--ink)', border: 'none', width: '100%', padding: '14px 0', outline: 'none', fontWeight: 700 }} placeholder="Địa chỉ" value={address} onChange={e => setAddress(e.target.value)} required /></div>
                    <div className="input-group" style={{ display: 'flex', alignItems: 'center' }}>
                      <input type={showPassword ? "text" : "password"} style={{ background: 'transparent', color: 'var(--ink)', border: 'none', width: '100%', padding: '14px 0', outline: 'none', fontWeight: 700 }} placeholder="Mật khẩu" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
                      <span className="material-symbols-outlined" onClick={() => setShowPassword(!showPassword)} style={{ cursor: 'pointer', color: 'var(--gray-400)' }}>{showPassword ? 'visibility_off' : 'visibility'}</span>
                    </div>
                    <div className="input-group" style={{ display: 'flex', alignItems: 'center' }}>
                      <input type={showPassword ? "text" : "password"} style={{ background: 'transparent', color: 'var(--ink)', border: 'none', width: '100%', padding: '14px 0', outline: 'none', fontWeight: 700 }} placeholder="Xác nhận mật khẩu" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required minLength={6} />
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '2px', marginLeft: '16px', fontWeight: 600 }}>* Mật khẩu từ 6 ký tự, gồm ít nhất 1 chữ cái, 1 số và 1 ký tự đặc biệt (@$!%*#?&)</div>
                </>
              )}

              <button type="submit" className="btn-primary" style={{ padding: '18px', fontSize: '1rem', marginTop: '10px' }}>
                {loading ? 'ĐANG XỬ LÝ...' : (isLogin ? 'ĐĂNG NHẬP NGAY' : 'HOÀN TẤT ĐĂNG KÝ')}
              </button>
            </form>

            <div style={{ margin: '30px 0', textAlign: 'center', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '50%', left: 0, width: '100%', height: '1px', background: 'var(--gray-200)', zIndex: 0 }}></div>
              <span style={{ position: 'relative', zIndex: 1, background: 'var(--surface)', padding: '0 15px', fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 900 }}>HOẶC</span>
            </div>

            <div id="googleBtn" style={{ width: '100%' }}></div>

            <p style={{ textAlign: 'center', marginTop: '30px', fontSize: '0.9rem', color: '#64748b', fontWeight: 700 }}>
              {isLogin ? 'Chưa có tài khoản?' : 'Đã có tài khoản?'}
              <button onClick={() => { setIsLogin(!isLogin); setError(""); setSuccess(""); setConfirmPassword(""); }} style={{ background: 'none', border: 'none', color: '#0f9d8a', fontWeight: 950, cursor: 'pointer', paddingLeft: '8px' }}>
                {isLogin ? 'Đăng ký ngay' : 'Đăng nhập'}
              </button>
            </p>
          </div>

        </div>
      </main>

      {/* footer trang đăng nhập */}
      <footer style={{ padding: '40px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8', fontWeight: 700, letterSpacing: '1px' }}>© 2026 REXI VETERINARY SYSTEM. ALL RIGHTS RESERVED.</p>
      </footer>

    </div>
  );
};

export default React.memo(DangNhapDangKy);
