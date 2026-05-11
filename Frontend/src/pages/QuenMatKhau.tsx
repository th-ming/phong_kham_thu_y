
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "@services/axios";
import { toast } from "@components/Toast";

const QuenMatKhau: React.FC = () => {
  const [method, setMethod] = useState<"quick" | "otp">("quick");
  const [step, setStep] = useState(1); // 1: Verify, 3: OTP, 4: Reset
  const [loading, setLoading] = useState(false);
  const [accountInfo, setAccountInfo] = useState({ username: "", email: "", phone: "" });
  const [otp, setOtp] = useState("");
  const [passwords, setPasswords] = useState({ newPass: "", confirmPass: "" });
  const navigate = useNavigate();

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
      toast.success(`Đã gửi mã OTP tới ${accountInfo.email}`);
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
        .auth-container { min-height: 100vh; background: #f0f2f5 !important; display: flex; flex-direction: column; position: relative; overflow: hidden; }
        .auth-card { background: #ffffff !important; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1); overflow: hidden; position: relative; z-index: 10; display: grid; grid-template-columns: 1.1fr 1.2fr; width: 100%; max-width: 1050px; margin: auto; border: 1px solid #f1f5f9; }
        .auth-sidebar { background: #0d9488 !important; padding: 60px; color: white !important; display: flex; flex-direction: column; justify-content: center; text-align: center; }
        .input-group { background: #f8fafc !important; border: 1.5px solid #e2e8f0 !important; border-radius: 12px; padding: 4px 16px; margin-bottom: 12px; }
        .input-group input { background: transparent !important; border: none !important; width: 100%; padding: 14px 0; outline: none !important; font-weight: 600; color: #1e293b !important; }
        .btn-auth { background: #0d9488 !important; color: white !important; border: none !important; border-radius: 50px !important; padding: 16px !important; font-weight: 800 !important; cursor: pointer !important; width: 100% !important; transition: all 0.3s !important; }
        .tab-btn { flex: 1; padding: 12px; border-radius: 12px; border: none; font-weight: 800; cursor: pointer; transition: all 0.3s; }
      `}</style>

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
        <Link to="/dang-nhap" style={{ background: 'white', color: '#1e293b', padding: '12px 24px', borderRadius: '50px', textDecoration: 'none', fontWeight: 800, border: '1px solid #e2e8f0' }}>Quay lại đăng nhập</Link>
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div className="auth-card">
          <div className="auth-sidebar">
            <div style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.2)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '40px' }}>{step === 4 ? 'lock_reset' : 'person_search'}</span>
            </div>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 950, lineHeight: 1.1, marginBottom: '20px' }}>{step === 4 ? 'Mật khẩu mới' : 'Quên mật khẩu?'}</h2>
            <p style={{ opacity: 0.9 }}>Rexi sẽ giúp sếp lấy lại tài khoản nhanh nhất! 🐾</p>
          </div>

          <div style={{ padding: '60px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {step === 1 && (
              <div>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', background: '#f1f5f9', padding: '6px', borderRadius: '16px' }}>
                  <button onClick={() => setMethod('quick')} className="tab-btn" style={{ background: method === 'quick' ? '#fff' : 'transparent', color: method === 'quick' ? '#0d9488' : '#64748b' }}>Xác minh nhanh</button>
                  <button onClick={() => setMethod('otp')} className="tab-btn" style={{ background: method === 'otp' ? '#fff' : 'transparent', color: method === 'otp' ? '#0d9488' : '#64748b' }}>Dùng mã OTP</button>
                </div>

                {method === 'quick' ? (
                  <form onSubmit={handleQuickVerify}>
                    <div className="input-group"><input placeholder="Tên đăng nhập" value={accountInfo.username} onChange={e => setAccountInfo({...accountInfo, username: e.target.value})} required /></div>
                    <div className="input-group"><input placeholder="Số điện thoại đăng ký" value={accountInfo.phone} onChange={e => setAccountInfo({...accountInfo, phone: e.target.value})} required /></div>
                    <div className="input-group"><input type="email" placeholder="Email đăng ký" value={accountInfo.email} onChange={e => setAccountInfo({...accountInfo, email: e.target.value})} required /></div>
                    <button type="submit" disabled={loading} className="btn-auth">XÁC MINH NGAY</button>
                  </form>
                ) : (
                  <form onSubmit={handleSendOtp}>
                    <div className="input-group"><input type="email" placeholder="Nhập Email để nhận mã OTP" value={accountInfo.email} onChange={e => setAccountInfo({...accountInfo, email: e.target.value})} required /></div>
                    <button type="submit" disabled={loading} className="btn-auth">GỬI MÃ OTP</button>
                  </form>
                )}
              </div>
            )}

            {step === 3 && (
              <form onSubmit={handleVerifyOtp}>
                <div className="input-group"><input placeholder="Nhập 6 chữ số OTP" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} required style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px' }} /></div>
                <button type="submit" disabled={loading} className="btn-auth">XÁC MINH OTP</button>
              </form>
            )}

            {step === 4 && (
              <form onSubmit={handleResetPassword}>
                <div className="input-group"><input type="password" placeholder="Mật khẩu mới" value={passwords.newPass} onChange={e => setPasswords({...passwords, newPass: e.target.value})} required /></div>
                <div className="input-group"><input type="password" placeholder="Xác nhận mật khẩu" value={passwords.confirmPass} onChange={e => setPasswords({...passwords, confirmPass: e.target.value})} required /></div>
                <button type="submit" disabled={loading} className="btn-auth">ĐẶT LẠI MẬT KHẨU</button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default QuenMatKhau;
