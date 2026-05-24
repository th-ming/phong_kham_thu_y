
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "@services/axios";
import { toast } from "@components/Toast";
import { isValidPassword, PASSWORD_POLICY_MESSAGE } from "@utils/passwordPolicy";

const QuenMatKhau: React.FC = () => {
  const [method, setMethod] = useState<"quick" | "otp">("quick");
  const [step, setStep] = useState(1); // 1: Verify, 3: OTP, 4: Reset
  const [loading, setLoading] = useState(false);
  const [accountInfo, setAccountInfo] = useState({ username: "", email: "", phone: "" });
  const [otp, setOtp] = useState("");
  const [passwords, setPasswords] = useState({ newPass: "", confirmPass: "" });
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Cập nhật title trang cho SEO
    document.title = 'Quên mật khẩu | Rexi – Phòng Khám Thú Y';
    return () => { document.title = 'Rexi – Phòng Khám Thú Y Chuyên Nghiệp'; };
  }, []);

  // CÁCH 1: XÁC MINH NHANH (USERNAME + SĐT + EMAIL)
  const handleQuickVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axiosInstance.post("/api/auth/forgot-password-verify", {
        username: accountInfo.username,
        email: accountInfo.email,
        phone: accountInfo.phone
      });
      if (res.status === 200) {
        toast.success("Xác minh thông tin thành công!");
        setStep(4); // Nhảy thẳng bước đổi pass
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Thông tin không chính xác!");
    } finally {
      setLoading(false);
    }
  };

  // CÁCH 2: GỬI MÃ OTP QUA EMAIL
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosInstance.post("/api/system/send-otp", { email: accountInfo.email });
      toast.success(`Đã gửi mã OTP tới ${accountInfo.email}. Vui lòng kiểm tra hòm thư (bao gồm cả thư rác/Spam)!`, { duration: 6000 });
      setStep(3); // Sang bước nhập OTP
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi gửi mã OTP!");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosInstance.post("/api/system/verify-otp", { email: accountInfo.email, otp });
      toast.success("Xác minh OTP thành công!");
      setStep(4);
    } catch (err: any) {
      toast.error("Mã OTP không chính xác!");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidPassword(passwords.newPass)) {
      toast.error(PASSWORD_POLICY_MESSAGE);
      return;
    }
    if (passwords.newPass !== passwords.confirmPass) {
      toast.error("Mật khẩu không khớp!");
      return;
    }
    setLoading(true);
    try {
      await axiosInstance.post("/api/auth/reset-password", {
        username: accountInfo.username,
        email: accountInfo.email,
        phone: accountInfo.phone,
        newPass: passwords.newPass,
        method: method
      });
      toast.success("Đổi mật khẩu thành công!");
      setTimeout(() => navigate("/dang-nhap"), 2000);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Lỗi đổi mật khẩu!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <style>{`
        .auth-container { min-height: 100vh; background: var(--background) !important; color: var(--ink); display: flex; flex-direction: column; position: relative; overflow-y: auto; overflow-x: hidden; transition: background 0.4s ease; }
        .auth-card { background: var(--surface) !important; border-radius: 24px; box-shadow: var(--shadow-xl); overflow: hidden; position: relative; z-index: 10; display: grid; grid-template-columns: 1.1fr 1.2fr; width: 100%; max-width: 1050px; margin: auto; border: 1px solid var(--gray-200); }
        .auth-sidebar { background: var(--primary-gradient) !important; padding: 60px; color: white !important; display: flex; flex-direction: column; justify-content: center; text-align: center; }
        .input-group { background: var(--gray-50) !important; border: 1.5px solid var(--gray-200) !important; border-radius: 12px; padding: 4px 16px; margin-bottom: 12px; }
        .input-group input { background: transparent !important; border: none !important; width: 100%; padding: 14px 0; outline: none !important; font-weight: 600; color: var(--ink) !important; }
        .btn-auth { background: var(--primary-gradient) !important; color: white !important; border: none !important; border-radius: 50px !important; padding: 16px !important; font-weight: 800 !important; cursor: pointer !important; width: 100% !important; transition: all 0.3s !important; box-shadow: 0 12px 28px var(--primary-shadow); }
        .tab-btn { flex: 1; padding: 12px; border-radius: 12px; border: none; font-weight: 800; cursor: pointer; transition: all 0.3s; }
        .auth-form-panel { padding: 60px; display: flex; flex-direction: column; justify-content: center; }

        [data-theme='dark'] .auth-container {
          background: var(--background) !important;
          color: var(--ink) !important;
          color-scheme: dark;
        }
        [data-theme='dark'] .auth-card {
          background: var(--surface) !important;
          border: 1px solid var(--glass-border) !important;
          box-shadow: 0 28px 70px rgba(0, 0, 0, 0.45);
          backdrop-filter: var(--glass-blur);
          -webkit-backdrop-filter: var(--glass-blur);
        }
        [data-theme='dark'] .auth-sidebar {
          background:
            linear-gradient(135deg, rgba(6, 182, 212, 0.92) 0%, rgba(20, 184, 166, 0.86) 100%),
            url('/img/hinh-nen-chan-thu.png') center/420px repeat !important;
          background-blend-mode: multiply;
          border-right: 1px solid rgba(34, 211, 238, 0.26);
        }
        [data-theme='dark'] .auth-sidebar h2,
        [data-theme='dark'] .auth-sidebar p,
        [data-theme='dark'] .auth-sidebar span {
          color: #ffffff !important;
        }
        [data-theme='dark'] .auth-sidebar h2 {
          text-shadow: 0 4px 18px rgba(0, 0, 0, 0.24);
        }
        [data-theme='dark'] .auth-sidebar-icon {
          background: rgba(255, 255, 255, 0.22) !important;
          border: 1px solid rgba(255, 255, 255, 0.28);
        }
        [data-theme='dark'] .auth-form-panel {
          background: var(--surface) !important;
        }
        [data-theme='dark'] .input-group {
          background: var(--gray-50) !important;
          border-color: rgba(34, 211, 238, 0.34) !important;
        }
        [data-theme='dark'] .input-group input { color: #f8fafc !important; }
        [data-theme='dark'] .input-group input::placeholder { color: #cbd5e1 !important; opacity: 0.78; }
        [data-theme='dark'] .back-btn {
          background: var(--surface) !important;
          color: #f8fafc !important;
          border-color: rgba(34, 211, 238, 0.34) !important;
        }
        [data-theme='dark'] .tab-container { background: var(--gray-50) !important; }
        [data-theme='dark'] .tab-btn.active { background: var(--surface) !important; color: var(--primary) !important; }
        [data-theme='dark'] .tab-btn:not(.active) { color: #94a3b8 !important; }
        [data-theme='dark'] .auth-logo-box {
          background: var(--primary-gradient) !important;
          box-shadow: 0 12px 28px rgba(34, 211, 238, 0.24);
        }
        [data-theme='dark'] .auth-logo-title { color: var(--primary) !important; }
        [data-theme='dark'] .auth-logo-subtitle { color: var(--gray-400) !important; opacity: 1 !important; }
        @media (max-width: 900px) {
          .auth-card { grid-template-columns: 1fr; }
          .auth-sidebar { display: none; }
          .auth-form-panel { padding: 36px 24px; }
        }
      `}</style>

      <header style={{ padding: '30px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 10 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '15px', textDecoration: 'none' }}>
          <div className="auth-logo-box" style={{ background: 'var(--primary-gradient)', width: '48px', height: '48px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 25px var(--primary-shadow)' }}>
            <img src="/img/avtpkty.png" alt="Rexi" style={{ width: '70%', filter: 'brightness(0) invert(1)' }} />
          </div>
          <div className="logo-container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div className="auth-logo-title" style={{ fontSize: '1.8rem', fontWeight: 950, color: 'var(--primary)', lineHeight: 1 }}>Rexi</div>
            <div className="auth-logo-subtitle" style={{ fontSize: '0.72rem', fontWeight: 850, color: 'var(--gray-500)', opacity: 0.9, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px', lineHeight: 1 }}>Phòng Khám Thú Y</div>
          </div>
        </Link>
        <Link to="/dang-nhap" className="back-btn" style={{ background: 'var(--surface)', color: 'var(--ink)', padding: '12px 24px', borderRadius: '50px', textDecoration: 'none', fontWeight: 800, border: '1px solid var(--gray-200)', transition: 'all 0.3s' }}>Quay lại đăng nhập</Link>
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div className="auth-card">
          <div className="auth-sidebar">
            <div className="auth-sidebar-icon" style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.2)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '40px' }}>{step === 4 ? 'lock_reset' : 'person_search'}</span>
            </div>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 950, lineHeight: 1.1, marginBottom: '20px' }}>{step === 4 ? 'Mật khẩu mới' : 'Quên mật khẩu?'}</h2>
            <p style={{ opacity: 0.9 }}>Rexi sẽ giúp sếp lấy lại tài khoản nhanh nhất! 🐾</p>
          </div>

          <div className="auth-form-panel">
            {step === 1 && (
              <div>
                <div className="tab-container" style={{ display: 'flex', gap: '10px', marginBottom: '24px', background: 'var(--gray-100)', padding: '6px', borderRadius: '16px' }}>
                  <button data-ai-id="button-quenmatkhau-8qgt" onClick={() => setMethod('quick')} className={`tab-btn ${method === 'quick' ? 'active' : ''}`} style={{ background: method === 'quick' ? 'var(--surface)' : 'transparent', color: method === 'quick' ? 'var(--primary)' : 'var(--gray-500)' }}>Xác minh nhanh</button>
                  <button data-ai-id="button-quenmatkhau-8oz9" onClick={() => setMethod('otp')} className={`tab-btn ${method === 'otp' ? 'active' : ''}`} style={{ background: method === 'otp' ? 'var(--surface)' : 'transparent', color: method === 'otp' ? 'var(--primary)' : 'var(--gray-500)' }}>Dùng mã OTP</button>
                </div>

                {method === 'quick' ? (
                  <form onSubmit={handleQuickVerify}>
                    <div className="input-group"><input data-ai-id="input-quenmatkhau-km9b" aria-label="Tên đăng nhập" placeholder="Tên đăng nhập" value={accountInfo.username} onChange={e => setAccountInfo({...accountInfo, username: e.target.value})} required /></div>
                    <div className="input-group"><input data-ai-id="input-quenmatkhau-atk2" aria-label="Số điện thoại đăng ký" placeholder="Số điện thoại đăng ký" value={accountInfo.phone} onChange={e => setAccountInfo({...accountInfo, phone: e.target.value})} required /></div>
                    <div className="input-group"><input data-ai-id="input-quenmatkhau-h40r" aria-label="Email đăng ký" type="email" placeholder="Email đăng ký" value={accountInfo.email} onChange={e => setAccountInfo({...accountInfo, email: e.target.value})} required /></div>
                    <button data-ai-id="button-quenmatkhau-0adg" type="submit" disabled={loading} className="btn-auth">XÁC MINH NGAY</button>
                  </form>
                ) : (
                  <form onSubmit={handleSendOtp}>
                    <div className="input-group"><input data-ai-id="input-quenmatkhau-z287" aria-label="Email nhận mã OTP" type="email" placeholder="Nhập Email để nhận mã OTP" value={accountInfo.email} onChange={e => setAccountInfo({...accountInfo, email: e.target.value})} required /></div>
                    <button data-ai-id="button-quenmatkhau-s92k" type="submit" disabled={loading} className="btn-auth">GỬI MÃ OTP</button>
                  </form>
                )}
              </div>
            )}

            {step === 3 && (
              <form onSubmit={handleVerifyOtp}>
                <div className="input-group"><input data-ai-id="input-quenmatkhau-0jmx" aria-label="Mã OTP" placeholder="Nhập 6 chữ số OTP" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} required style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px' }} /></div>
                <button data-ai-id="button-quenmatkhau-pf2x" type="submit" disabled={loading} className="btn-auth">XÁC MINH OTP</button>
              </form>
            )}

            {step === 4 && (
              <form onSubmit={handleResetPassword}>
                <div className="input-group" style={{ position: "relative" }}>
                  <input data-ai-id="input-quenmatkhau-b80b" type={showNewPass ? "text" : "password"} placeholder="Mật khẩu mới" value={passwords.newPass} onChange={e => setPasswords({...passwords, newPass: e.target.value})} required style={{ paddingRight: "48px", width: "100%" }} />
                  <span className="material-symbols-outlined" onClick={() => setShowNewPass(!showNewPass)} style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "var(--gray-400)", userSelect: "none", zIndex: 10 }}>
                    {showNewPass ? "visibility" : "visibility_off"}
                  </span>
                </div>
                <div className="input-group" style={{ position: "relative" }}>
                  <input data-ai-id="input-quenmatkhau-61yj" type={showConfirmPass ? "text" : "password"} placeholder="Xác nhận mật khẩu" value={passwords.confirmPass} onChange={e => setPasswords({...passwords, confirmPass: e.target.value})} required style={{ paddingRight: "48px", width: "100%" }} />
                  <span className="material-symbols-outlined" onClick={() => setShowConfirmPass(!showConfirmPass)} style={{ position: "absolute", right: "16px", top: "50%", transform: "translateY(-50%)", cursor: "pointer", color: "var(--gray-400)", userSelect: "none", zIndex: 10 }}>
                    {showConfirmPass ? "visibility" : "visibility_off"}
                  </span>
                </div>
                <button data-ai-id="button-quenmatkhau-yr13" type="submit" disabled={loading} className="btn-auth">ĐẶT LẠI MẬT KHẨU</button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default QuenMatKhau;
