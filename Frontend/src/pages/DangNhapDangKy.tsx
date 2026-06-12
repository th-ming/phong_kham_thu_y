import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "@services/axios";
import BirthYearSelect from "@components/BirthYearSelect";
import { normalizeUserRole } from "@utils/index";
import { isValidPassword, PASSWORD_POLICY_MESSAGE } from "@utils/passwordPolicy";
import { getApiErrorMessage } from "@utils/apiErrorMessage";

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
  const [birthYear, setBirthYear] = useState("");

  const GOOGLE_CLIENT_ID = "334761445329-iog83fgqrdlo0iavo68pkv17modc85du.apps.googleusercontent.com";

  useEffect(() => {
    if (window.location.hostname === "127.0.0.1") {
      window.location.replace(`http://localhost:${window.location.port}${window.location.pathname}${window.location.search}${window.location.hash}`);
    }
  }, []);

  const [step, setStep] = useState(1);

  const handlePhoneChange = (val: string) => {
    // Bắt buộc SĐT chỉ chứa chữ số để an toàn nghiệp vụ
    const numericValue = val.replace(/[^0-9]/g, "");
    setPhone(numericValue);
  };

  useEffect(() => {
    // Cập nhật title trang để tốt cho SEO theo ngữ cảnh
    document.title = isLogin
      ? 'Đăng nhập | Rexi – Phòng Khám Thú Y'
      : 'Đăng ký tài khoản | Rexi – Phòng Khám Thú Y';
    // Inject meta description cho SEO
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      (metaDesc as HTMLMetaElement).name = 'description';
      document.head.appendChild(metaDesc);
    }
    (metaDesc as HTMLMetaElement).content = isLogin
      ? 'Đăng nhập vào tài khoản Rexi để quản lý sức khỏe thú cưng và đặt lịch khám trực tuyến.'
      : 'Đăng ký tài khoản Rexi – Hệ thống quản lý sức khỏe thú cưng chuyên nghiệp.';
    const savedUsername = localStorage.getItem("rememberedUsername");
    if (savedUsername && !username) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, [isLogin]);

  useEffect(() => {
    let timer: number;
    let isMounted = true;
    const initGoogle = () => {
      if ((window as any).google) {
        if (GOOGLE_CLIENT_ID) {
          // Tránh gọi initialize nhiều lần gây lỗi origin
          if (!(window as any).google_initialized) {
            (window as any).google.accounts.id.initialize({
              client_id: GOOGLE_CLIENT_ID,
              callback: handleGoogleResponse
            });
            (window as any).google_initialized = true;
          }
          const googleBtnEl = document.getElementById("googleBtn");
          if (googleBtnEl) {
            googleBtnEl.replaceChildren();
            const btnWidth = window.innerWidth < 450 ? Math.min(320, window.innerWidth - 48) : 350;
            (window as any).google.accounts.id.renderButton(
              googleBtnEl,
              { theme: "outline", size: "large", shape: "pill", width: btnWidth }
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

        if (normalizeUserRole(res.data.user) === 'khach_hang') {
          navigate("/khach-hang/dashboard");
        } else {
          navigate("/quan-ly/dashboard");
        }
      }
    } catch (err: any) {
      console.error("Lỗi Google Login:", err);
      setError(getApiErrorMessage(err, "Đăng nhập Google thất bại."));
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = (e: React.MouseEvent) => {
    e.preventDefault();
    setError("");
    if (!fullname || !email || !phone || !address || !birthYear) {
      setError("Vui lòng nhập đầy đủ các trường thông tin cá nhân!");
      return;
    }
    const birthYearNum = Number(birthYear);
    const currentYear = new Date().getFullYear();
    if (!Number.isInteger(birthYearNum) || birthYearNum < 1900 || birthYearNum > currentYear) {
      setError(`Năm sinh phải nằm trong khoảng từ 1900 đến ${currentYear}!`);
      return;
    }
    // Validate email đơn giản
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Định dạng Email không hợp lệ!");
      return;
    }
    // Validate SĐT phải đúng 10-11 chữ số (khớp Backend)
    if (!/^\d{10,11}$/.test(phone)) {
      setError("Số điện thoại phải gồm đúng 10-11 chữ số!");
      return;
    }
    setStep(2);
  };

  const handlePrevStep = (e: React.MouseEvent) => {
    e.preventDefault();
    setError("");
    setStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!isLogin) {
      if (step === 1) {
        // Nếu người dùng nhấn Enter và tự động submit khi đang ở bước 1
        if (!fullname || !email || !phone || !address || !birthYear) {
          setError("Vui lòng nhập đầy đủ các trường thông tin cá nhân!");
          setLoading(false);
          return;
        }
        setStep(2);
        setLoading(false);
        return;
      }

      // Xác thực bước 2
      if (!username || !password || !confirmPassword) {
        setError("Vui lòng điền đầy đủ thông tin tài khoản đăng nhập!");
        setLoading(false);
        return;
      }

      // Validate tên đăng nhập 3-50 ký tự (khớp Backend)
      if (username.length < 3 || username.length > 50) {
        setError("Tên đăng nhập phải từ 3 đến 50 ký tự!");
        setLoading(false);
        return;
      }

      if (!isValidPassword(password)) {
        setError(PASSWORD_POLICY_MESSAGE);
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError("Mật khẩu xác nhận không khớp!");
        setLoading(false);
        return;
      }
    }

    try {
      const endpoint = isLogin ? "/login" : "/register";
      const payload = isLogin ? { username, password } : { ten_dang_nhap: username, mat_khau: password, ten_khach_hang: fullname, email, sdt: phone, dia_chi: address, nam_sinh: Number(birthYear) };
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

        if (normalizeUserRole(res.data.user) === 'khach_hang') {
          navigate("/khach-hang/dashboard");
        } else {
          navigate("/quan-ly/dashboard");
        }
      } else if (!isLogin) {
        setIsLogin(true);
        setStep(1);
        setConfirmPassword("");
        setSuccess("Đăng ký thành công! Tài khoản và mật khẩu đã được điền sẵn, bạn chỉ cần đăng nhập để tiếp tục.");
      }
    } catch (err: any) {
      setError(getApiErrorMessage(err, "Đã xảy ra lỗi không xác định. Vui lòng thử lại."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="aura-blob blob-1"></div>
      <div className="aura-blob blob-2"></div>

      <style>{`
        .auth-container {
          min-height: 100vh;
          background: var(--background) !important;
          color: var(--ink);
          display: flex;
          flex-direction: column;
          position: relative;
          overflow-y: auto;
          overflow-x: hidden;
          transition: background 0.4s ease;
        }

        .auth-card {
          background: rgba(255, 255, 255, 0.45) !important;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 32px;
          box-shadow: 0 30px 70px rgba(15, 23, 42, 0.1);
          overflow: hidden;
          position: relative;
          z-index: 10;
          display: grid;
          grid-template-columns: 1.1fr 1.2fr; /* Tăng tỷ lệ cho phần form */
          width: 100%;
          max-width: 1150px; /* Nới rộng card */
          margin: auto;
          border: 1px solid rgba(255, 255, 255, 0.4);
          transition: all 0.4s ease;
        }

        .auth-sidebar {
          background: linear-gradient(135deg, #0d9488 0%, #0f766e 50%, #10b981 100%) !important;
          padding: 48px;
          color: white !important;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: center;
          overflow: hidden;
        }

        .auth-sidebar-copy {
          color: rgba(255, 255, 255, 0.9) !important;
        }

        .auth-form-panel {
          padding: 56px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: rgba(255, 255, 255, 0.3) !important;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }

        .auth-title {
          font-size: 2.2rem;
          font-weight: 950;
          color: var(--ink) !important;
          letter-spacing: -1.5px;
        }

        .input-group {
          background: var(--surface) !important;
          border: 1.5px solid var(--gray-200) !important;
          border-radius: 16px;
          padding: 2px 18px;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.3s ease;
          box-shadow: var(--shadow-sm);
        }

        .input-group:focus-within {
          border-color: var(--primary) !important;
          box-shadow: 0 0 0 4px var(--primary-light) !important;
          transform: translateY(-1px);
        }

        .input-group input {
          background: transparent !important;
          border: none !important;
          width: 100%;
          padding: 16px 0;
          outline: none !important;
          font-weight: 700;
          color: var(--ink) !important;
          font-size: 0.95rem;
        }

        .auth-google-shell {
          display: flex;
          justify-content: center;
          width: 100%;
          min-height: 48px;
          padding-bottom: 20px;
        }

        [data-theme='dark'] .auth-container {
          background: var(--background) !important;
          color: var(--ink) !important;
          color-scheme: dark;
        }
        [data-theme='dark'] .auth-card {
          background: rgba(30, 41, 59, 0.45) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          box-shadow: 0 35px 80px rgba(0, 0, 0, 0.5);
        }
        [data-theme='dark'] .auth-sidebar {
          background:
            linear-gradient(135deg, rgba(6, 182, 212, 0.9) 0%, rgba(20, 184, 166, 0.8) 100%),
            url('/img/hinh-nen-chan-thu.png') center/420px repeat !important;
          background-blend-mode: multiply;
          border-right: 1px solid rgba(34, 211, 238, 0.2);
        }
        [data-theme='dark'] .auth-sidebar-copy,
        [data-theme='dark'] .auth-sidebar span,
        [data-theme='dark'] .auth-sidebar h2 {
          color: #ffffff !important;
        }
        [data-theme='dark'] .auth-sidebar h2 {
          text-shadow: 0 4px 18 rgba(0, 0, 0, 0.24);
        }
        [data-theme='dark'] .auth-sidebar > div > div:first-child {
          background: rgba(255, 255, 255, 0.22) !important;
          border: 1px solid rgba(255, 255, 255, 0.28);
          color: #ffffff !important;
        }
        [data-theme='dark'] .auth-sidebar-copy {
          opacity: 1 !important;
          color: rgba(255, 255, 255, 0.94) !important;
        }
        [data-theme='dark'] .auth-title { color: #f8fafc !important; }
        [data-theme='dark'] .auth-form-panel {
          background: rgba(15, 23, 42, 0.2) !important;
        }
        [data-theme='dark'] .auth-form-panel > div > p,
        [data-theme='dark'] .auth-form-panel label {
          color: #cbd5e1 !important;
        }
        [data-theme='dark'] .input-group {
          background: rgba(30, 41, 59, 0.8) !important;
          border-color: rgba(255, 255, 255, 0.08) !important;
        }
        [data-theme='dark'] .input-group:focus-within {
          border-color: var(--primary) !important;
        }
        [data-theme='dark'] .input-group input { color: #f8fafc !important; }
        [data-theme='dark'] .input-group input::placeholder { color: #94a3b8 !important; opacity: 0.8; }
        [data-theme='dark'] .input-group .material-symbols-outlined { color: var(--primary) !important; opacity: 0.95; }
        [data-theme='dark'] .btn-auth {
          background: var(--primary-gradient) !important;
          color: #ffffff !important;
          box-shadow: 0 16px 32px rgba(34, 211, 238, 0.24);
        }
        [data-theme='dark'] .auth-home-link {
          background: var(--surface) !important;
          color: #f8fafc !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
        }
        [data-theme='dark'] .auth-logo-box {
          background: var(--primary-gradient) !important;
          box-shadow: 0 12px 28px rgba(34, 211, 238, 0.24);
        }
        [data-theme='dark'] .auth-logo-title {
          color: var(--primary) !important;
        }
        [data-theme='dark'] .auth-logo-subtitle {
          color: var(--gray-400) !important;
          opacity: 1 !important;
        }
        [data-theme='dark'] .auth-divider-line { background: rgba(148, 163, 184, 0.12) !important; }
        [data-theme='dark'] .auth-divider-label { background: #0f172a !important; color: #94a3b8 !important; }
        [data-theme='dark'] .auth-register-copy { color: #cbd5e1 !important; }
        [data-theme='dark'] .auth-google-shell {
          filter: none;
        }
        [data-theme='dark'] .aura-blob { opacity: 0.35; }

        .aura-blob {
          position: absolute;
          width: 700px;
          height: 700px;
          border-radius: 50%;
          filter: blur(140px);
          z-index: 0;
          opacity: 0.12;
          pointer-events: none;
          transition: opacity 0.5s ease;
        }
        .blob-1 { top: -200px; left: -200px; background: #0d9488; }
        .blob-2 { bottom: -200px; right: -200px; background: #14b8a6; }

        /* Wizard UI styles */
        .progress-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
          margin-bottom: 40px;
          padding: 0 40px;
        }
        .progress-bar-bg {
          position: absolute;
          top: 50%;
          left: 40px;
          right: 40px;
          height: 4px;
          background: var(--gray-200);
          z-index: 1;
          transform: translateY(-50%);
          border-radius: 2px;
        }
        .progress-bar-fill {
          position: absolute;
          top: 50%;
          left: 40px;
          height: 4px;
          background: #0d9488;
          z-index: 2;
          transform: translateY(-50%);
          transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 2px;
        }
        .step-dot {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--surface);
          border: 2px solid var(--gray-300);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 3;
          font-weight: 800;
          color: var(--gray-500);
          transition: all 0.3s ease;
        }
        .step-dot.active {
          border-color: #0d9488;
          background: #0d9488;
          color: white;
          box-shadow: 0 0 12px rgba(13, 148, 136, 0.4);
        }
        .step-label {
          position: absolute;
          top: 38px;
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--gray-500);
          white-space: nowrap;
          transition: color 0.3s ease;
        }
        .step-label.active {
          color: #0d9488;
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-in {
          animation: slideIn 0.35s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        [data-theme='dark'] .progress-bar-bg {
          background: #334155 !important;
        }
        [data-theme='dark'] .step-dot {
          background: #1e293b !important;
          border-color: #475569 !important;
          color: #94a3b8 !important;
        }
        [data-theme='dark'] .step-dot.active {
          background: #0d9488 !important;
          border-color: #0d9488 !important;
          color: white !important;
        }

        @media (max-width: 900px) {
          .auth-card { 
            grid-template-columns: 1fr; 
            margin: 0;
            border-radius: 20px;
          }
          .auth-sidebar { display: none; }
          .auth-form-panel { padding: 36px 20px; }
          .progress-container { padding: 0 20px; }
          .progress-bar-bg { left: 20px; right: 20px; }
          .progress-bar-fill { left: 20px; }
        }
        @media (max-width: 600px) {
          .auth-header {
            padding: 12px 16px !important;
            flex-direction: row !important;
            justify-content: space-between !important;
            align-items: center !important;
          }
          .auth-logo-box {
            width: 36px !important;
            height: 36px !important;
            border-radius: 10px !important;
          }
          .auth-logo-title {
            font-size: 1.4rem !important;
          }
          .auth-logo-subtitle {
            font-size: 0.6rem !important;
          }
          .auth-home-link {
            padding: 8px 16px !important;
            font-size: 0.8rem !important;
          }
          .auth-form-panel {
            padding: 24px 16px !important;
          }
          .auth-title {
            font-size: 1.8rem !important;
          }
          .auth-container main {
            padding: 10px 10px !important;
          }
          .auth-card {
            border-radius: 16px !important;
          }
          .auth-remember-forgot {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 12px !important;
          }
        }
      `}</style>

      {/* HEADER CỦA */}
      <header className="auth-header" style={{ padding: '30px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 10 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '15px', textDecoration: 'none' }}>
          <div className="auth-logo-box" style={{ background: 'var(--primary-gradient)', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px var(--primary-shadow)' }}>
            <img src="/img/avtpkty.png" alt="Rexi" style={{ width: '70%', filter: 'brightness(0) invert(1)' }} />
          </div>
          <div className="logo-container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="auth-logo-title" style={{ fontSize: '1.8rem', fontWeight: 950, color: 'var(--primary)', lineHeight: 1 }}>Rexi</div>
            <div className="auth-logo-subtitle" style={{ fontSize: '0.72rem', fontWeight: 850, color: 'var(--gray-500)', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px', lineHeight: 1 }}>Phòng Khám Thú Y</div>
          </div>
        </Link>
        <Link to="/" className="auth-home-link" style={{ background: 'var(--surface)', color: 'var(--ink)', padding: '12px 24px', borderRadius: '50px', textDecoration: 'none', fontWeight: 800, border: '1px solid var(--gray-200)' }}>Về trang chủ</Link>
      </header>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '40px 20px', overflowY: 'auto' }}>
        <div className="auth-card">
          <div className="auth-sidebar">
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.2)', padding: '8px 16px', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 800, marginBottom: '24px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>verified</span> HỆ THỐNG THÚ Y SỐ 1
              </div>
              <h2 style={{ fontSize: '3.5rem', fontWeight: 950, lineHeight: 1.1, marginBottom: '32px', letterSpacing: '-2px' }}>Đồng hành <br /> cùng bé yêu</h2>
              <p className="auth-sidebar-copy" style={{ fontSize: '1.1rem', opacity: 0.9, lineHeight: 1.8, marginBottom: '48px', maxWidth: '400px' }}>Hơn 10,000 chủ nuôi đã tin tưởng Rexi. Hãy đăng nhập để quản lý sức khỏe thú cưng của bạn một cách chuyên nghiệp nhất.</p>
              
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

          <div className="auth-form-panel">
            <div style={{ marginBottom: '30px' }}>
              <h3 className="auth-title">{isLogin ? 'Chào mừng trở lại!' : 'Tham gia cùng Rexi'}</h3>
              <p style={{ color: 'var(--gray-500)', fontWeight: 600, marginTop: '8px' }}>
                {isLogin ? 'Vui lòng nhập thông tin tài khoản' : `Bước ${step}: ${step === 1 ? 'Thông tin cá nhân' : 'Thông tin tài khoản'}`}
              </p>
            </div>

            {error && <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#b91c1c', padding: '14px', borderRadius: '16px', marginBottom: '24px', fontSize: '0.85rem', fontWeight: 700 }}>{error}</div>}
            {success && <div style={{ background: '#f0fdf4', border: '1px solid #dcfce7', color: '#15803d', padding: '14px', borderRadius: '16px', marginBottom: '24px', fontSize: '0.85rem', fontWeight: 700 }}>{success}</div>}

            {!isLogin && (
              <div className="progress-container">
                <div className="progress-bar-bg" />
                <div className="progress-bar-fill" style={{ width: step === 1 ? '0%' : '100%' }} />
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                  <div className={`step-dot ${step >= 1 ? 'active' : ''}`}>1</div>
                  <span className={`step-label ${step >= 1 ? 'active' : ''}`} style={{ left: '50%', transform: 'translateX(-50%)' }}>Cá nhân</span>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                  <div className={`step-dot ${step === 2 ? 'active' : ''}`}>2</div>
                  <span className={`step-label ${step === 2 ? 'active' : ''}`} style={{ left: '50%', transform: 'translateX(-50%)' }}>Tài khoản</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '12px' }}>
              {!isLogin ? (
                <div className="animate-slide-in" key={`step-${step}`}>
                  {step === 1 ? (
                    <div style={{ display: 'grid', gap: '12px' }}>
                      <div className="input-group">
                        <span className="material-symbols-outlined" style={{ color: '#0d9488', opacity: 0.7, fontSize: '18px' }}>badge</span>
                        <input data-ai-id="input-dangnhapdangky-wgtk" placeholder="Họ và tên" value={fullname} onChange={e => setFullname(e.target.value)} required />
                      </div>
                      <div className="input-group">
                        <span className="material-symbols-outlined" style={{ color: '#0d9488', opacity: 0.7, fontSize: '18px' }}>mail</span>
                        <input data-ai-id="input-dangnhapdangky-mw60" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
                      </div>
                      <div className="input-group">
                        <span className="material-symbols-outlined" style={{ color: '#0d9488', opacity: 0.7, fontSize: '18px' }}>phone</span>
                        <input data-ai-id="input-dangnhapdangky-v63p" placeholder="Số điện thoại" value={phone} onChange={e => handlePhoneChange(e.target.value)} required />
                      </div>
                      <div className="input-group">
                        <span className="material-symbols-outlined" style={{ color: '#0d9488', opacity: 0.7, fontSize: '18px' }}>location_on</span>
                        <input data-ai-id="input-dangnhapdangky-gejq" placeholder="Địa chỉ" value={address} onChange={e => setAddress(e.target.value)} required />
                      </div>
                      <div className="input-group">
                        <span className="material-symbols-outlined" style={{ color: '#0d9488', opacity: 0.7, fontSize: '18px' }}>cake</span>
                        <BirthYearSelect
                          data-ai-id="select-dangnhapdangky-namsinh"
                          placeholder="Chọn năm sinh"
                          value={birthYear}
                          onChange={setBirthYear}
                          required
                          style={{
                            border: 'none',
                            backgroundColor: 'transparent',
                            color: 'var(--ink)',
                            fontWeight: 600,
                            outline: 'none',
                            padding: '14px 44px 14px 0'
                          }}
                        />
                      </div>
                      <button data-ai-id="button-dangnhapdangky-next" onClick={handleNextStep} className="btn-auth" style={{ width: '100%', background: '#0d9488', color: 'white', border: 'none', borderRadius: '50px', padding: '16px', fontWeight: 800, cursor: 'pointer', marginTop: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        Tiếp theo <span className="material-symbols-outlined">arrow_forward</span>
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: '12px' }}>
                      <div className="input-group">
                        <span className="material-symbols-outlined" style={{ color: '#0d9488', opacity: 0.7, fontSize: '18px' }}>person</span>
                        <input data-ai-id="input-dangnhapdangky-0l0l" placeholder="Tên đăng nhập" value={username} onChange={e => setUsername(e.target.value)} required />
                      </div>
                      <div className="input-group">
                        <span className="material-symbols-outlined" style={{ color: '#0d9488', opacity: 0.7, fontSize: '18px' }}>lock</span>
                        <input data-ai-id="input-dangnhapdangky-ond4" type={showPassword ? "text" : "password"} placeholder="Mật khẩu" value={password} onChange={e => setPassword(e.target.value)} required />
                        <span className="material-symbols-outlined" onClick={() => setShowPassword(!showPassword)} style={{ cursor: 'pointer', color: '#94a3b8', fontSize: '18px' }}>{showPassword ? 'visibility_off' : 'visibility'}</span>
                      </div>
                      <div className="input-group">
                        <span className="material-symbols-outlined" style={{ color: '#0d9488', opacity: 0.7, fontSize: '18px' }}>lock_reset</span>
                        <input data-ai-id="input-dangnhapdangky-t0t3" type={showPassword ? "text" : "password"} placeholder="Xác nhận mật khẩu" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                        <span className="material-symbols-outlined" onClick={() => setShowPassword(!showPassword)} style={{ cursor: 'pointer', color: '#94a3b8', fontSize: '18px' }}>{showPassword ? 'visibility_off' : 'visibility'}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '14px' }}>
                        <button data-ai-id="button-dangnhapdangky-back" onClick={handlePrevStep} className="btn-auth" style={{ flex: 1, background: 'transparent', color: 'var(--ink)', border: '1px solid var(--gray-300)', borderRadius: '50px', padding: '16px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                          <span className="material-symbols-outlined">arrow_back</span> Quay lại
                        </button>
                        <button data-ai-id="button-dangnhapdangky-submit" type="submit" disabled={loading} className="btn-auth" style={{ flex: 2, background: loading ? '#94a3b8' : '#0d9488', color: 'white', border: 'none', borderRadius: '50px', padding: '16px', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer' }}>
                          {loading ? 'Đang xử lý...' : 'Đăng ký ngay'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="input-group">
                    <span className="material-symbols-outlined" style={{ color: '#0d9488', opacity: 0.7 }}>person</span>
                    <input data-ai-id="input-dangnhapdangky-8dku" placeholder="Tên đăng nhập" value={username} onChange={e => setUsername(e.target.value)} required />
                  </div>
                  <div className="input-group">
                    <span className="material-symbols-outlined" style={{ color: '#0d9488', opacity: 0.7 }}>lock</span>
                    <input data-ai-id="input-dangnhapdangky-h1ru" type={showPassword ? "text" : "password"} placeholder="Mật khẩu" value={password} onChange={e => setPassword(e.target.value)} required />
                    <span className="material-symbols-outlined" onClick={() => setShowPassword(!showPassword)} style={{ cursor: 'pointer', color: '#94a3b8' }}>{showPassword ? 'visibility_off' : 'visibility'}</span>
                  </div>
                  
                  {/* CHỨC NĂNG GHI NHỚ & QUÊN MẬT KHẨU CỦA ĐÂY */}
                  <div className="auth-remember-forgot" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0, textTransform: 'none', color: 'var(--gray-500)', fontSize: '0.9rem' }}>
                       <input data-ai-id="input-dangnhapdangky-cyre" type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                      Ghi nhớ đăng nhập
                    </label>
                    <Link to="/quen-mat-khau" style={{ color: '#0d9488', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 800 }}>Quên mật khẩu?</Link>
                  </div>
                  <button data-ai-id="button-dangnhapdangky-xgfa" type="submit" disabled={loading} className="btn-auth" style={{ background: loading ? '#94a3b8' : '#0d9488', color: 'white', border: 'none', borderRadius: '50px', padding: '16px', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', marginTop: '10px' }}>{loading ? 'Đang xử lý...' : 'Đăng nhập ngay'}</button>
                </>
              )}
            </form>

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <p className="auth-register-copy" style={{ color: 'var(--gray-500)', fontWeight: 700, fontSize: '0.9rem' }}>
                {isLogin ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
                <span 
                  onClick={() => { setIsLogin(!isLogin); setStep(1); setError(""); setSuccess(""); }} 
                  style={{ color: '#0d9488', cursor: 'pointer', textDecoration: 'underline' }}
                >
                  {isLogin ? "Đăng ký ngay" : "Đăng nhập"}
                </span>
              </p>
            </div>

            <div style={{ margin: '30px 0', textAlign: 'center', position: 'relative' }}>
              <div className="auth-divider-line" style={{ position: 'absolute', top: '50%', left: 0, width: '100%', height: '1px', background: 'var(--gray-200)', zIndex: 0 }}></div>
              <span className="auth-divider-label" style={{ position: 'relative', zIndex: 1, background: 'var(--surface)', padding: '0 15px', fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 900 }}>HOẶC</span>
            </div>
            <div id="googleBtn" className="auth-google-shell"></div>
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
