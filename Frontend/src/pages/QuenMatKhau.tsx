
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "@services/axios";
import { toast } from "@components/Toast";

const QuenMatKhau: React.FC = () => {
  const [step, setStep] = useState(1); // 1: Verify Account, 2: Choose Method, 3: Input OTP, 4: Reset Password
  const [loading, setLoading] = useState(false);
  const [accountInfo, setAccountInfo] = useState({ username: "", email: "" });
  const [method, setMethod] = useState("email"); // 'email' or 'sms'
  const [otp, setOtp] = useState("");
  const [passwords, setPasswords] = useState({ newPass: "", confirmPass: "" });
  const navigate = useNavigate();

  // BƯỚC 1: XÁC MINH USERNAME/EMAIL
  const handleVerifyAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axiosInstance.post("/api/auth/forgot-password-verify", { 
        username: accountInfo.username, 
        email: accountInfo.email 
      });
      if (res.status === 200) {
        setStep(2);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Thông tin tài khoản không chính xác!");
    } finally {
      setLoading(false);
    }
  };

  // BƯỚC 2: GỬI OTP
  const handleSendOtp = async () => {
    setLoading(true);
    try {
      // Gọi endpoint gửi OTP thật mà mình vừa làm ở Backend
      await axiosInstance.post("/api/system/send-otp", { email: accountInfo.email });
      toast.success(`Đã gửi mã OTP tới ${method === 'email' ? accountInfo.email : 'số điện thoại của bạn'}`);
      setStep(3);
    } catch (err: any) {
      toast.error("Lỗi khi gửi mã OTP. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  // BƯỚC 3: XÁC MINH OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axiosInstance.post("/api/system/verify-otp", { email: accountInfo.email, otp });
      toast.success("Xác minh OTP thành công!");
      setStep(4);
    } catch (err: any) {
      toast.error("Mã OTP không chính xác hoặc đã hết hạn!");
    } finally {
      setLoading(false);
    }
  };

  // BƯỚC 4: ĐẶT LẠI MẬT KHẨU
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPass !== passwords.confirmPass) {
      toast.error("Mật khẩu xác nhận không khớp!");
      return;
    }
    setLoading(true);
    try {
      await axiosInstance.post("/api/auth/reset-password", { 
        username: accountInfo.username, 
        newPass: passwords.newPass 
      });
      toast.success("Đặt lại mật khẩu thành công! Đang chuyển hướng...");
      setTimeout(() => navigate("/dang-nhap"), 2000);
    } catch (err: any) {
      toast.error("Lỗi đặt lại mật khẩu!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      <style>{`
        .auth-card { background: var(--surface); border-radius: 40px; box-shadow: 0 40px 100px rgba(15, 157, 138, 0.1); border: 1px solid var(--gray-200); }
        .input-group { background: var(--gray-50); border: 2px solid transparent; border-radius: 16px; padding: 4px 16px; transition: all 0.3s; margin-bottom: 16px; }
        .input-group:focus-within { background: var(--surface); border-color: var(--primary); box-shadow: 0 10px 20px rgba(15, 157, 138, 0.05); }
        .method-card { padding: 20px; border: 2px solid var(--gray-100); border-radius: 20px; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; gap: 16px; margin-bottom: 16px; }
        .method-card.active { border-color: var(--primary); background: rgba(15, 157, 138, 0.05); }
        .btn-primary { background: #0f9d8a; color: white; border: none; border-radius: 50px; font-weight: 900; transition: all 0.3s; cursor: pointer; padding: 18px; width: 100%; font-size: 1rem; }
        .btn-primary:hover:not(:disabled) { transform: translateY(-3px); box-shadow: 0 15px 30px rgba(15, 157, 138, 0.3); }
        .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      <header style={{ padding: '30px 60px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 10 }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '15px', textDecoration: 'none' }}>
           <div style={{ background: '#0f9d8a', width: '44px', height: '44px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/img/avtpkty.png" alt="Rexi" style={{ width: '70%' }} />
          </div>
          <span style={{ fontSize: '2rem', fontWeight: 950, color: 'var(--ink)', letterSpacing: '-1.5px' }}>Rexi <span style={{ color: '#0f9d8a' }}>Vet</span></span>
        </Link>
      </header>

      <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', zIndex: 1 }}>
        <div className="auth-card" style={{ width: '100%', maxWidth: '900px', display: 'grid', gridTemplateColumns: '1fr 1.2fr', overflow: 'hidden' }}>
          
          <div style={{ padding: '50px', background: '#0f9d8a', color: 'white', display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
            <div style={{ width: '80px', height: '80px', background: 'rgba(255,255,255,0.2)', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '40px' }}>
                {step === 1 ? 'person_search' : step === 2 ? 'send_to_mobile' : step === 3 ? 'verified_user' : 'lock_reset'}
              </span>
            </div>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 950, lineHeight: 1.1, marginBottom: '20px' }}>
              {step === 1 ? 'Xác minh tài khoản' : step === 2 ? 'Chọn phương thức' : step === 3 ? 'Nhập mã OTP' : 'Mật khẩu mới'}
            </h2>
            <p style={{ opacity: 0.9 }}>Bảo vệ tài khoản của sếp là ưu tiên hàng đầu của Rexi! 🐾</p>
          </div>

          <div style={{ padding: '60px' }}>
            {/* STEP 1: VERIFY ACCOUNT */}
            {step === 1 && (
              <form onSubmit={handleVerifyAccount}>
                <div className="input-group">
                  <input placeholder="Tên đăng nhập" value={accountInfo.username} onChange={e => setAccountInfo({...accountInfo, username: e.target.value})} required style={{ background: 'transparent', border: 'none', width: '100%', padding: '14px 0', outline: 'none', fontWeight: 700 }} />
                </div>
                <div className="input-group">
                  <input type="email" placeholder="Email đăng ký" value={accountInfo.email} onChange={e => setAccountInfo({...accountInfo, email: e.target.value})} required style={{ background: 'transparent', border: 'none', width: '100%', padding: '14px 0', outline: 'none', fontWeight: 700 }} />
                </div>
                <button type="submit" disabled={loading} className="btn-primary">TIẾP TỤC</button>
              </form>
            )}

            {/* STEP 2: CHOOSE METHOD (Sếp đã bỏ SMS nên ta chỉ hiện xác nhận Email) */}
            {step === 2 && (
              <div>
                <div className="method-card active">
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>mail</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontWeight: 900, color: 'var(--ink)' }}>Gửi mã qua Email</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>{accountInfo.email}</div>
                  </div>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', marginBottom: '24px', fontWeight: 600 }}>
                  Chúng tôi sẽ gửi mã OTP gồm 6 chữ số tới hòm thư này để xác minh danh tính của sếp.
                </p>
                <button onClick={handleSendOtp} disabled={loading} className="btn-primary">GỬI MÃ XÁC MINH</button>
                <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: 'var(--gray-400)', width: '100%', marginTop: '16px', fontWeight: 800, cursor: 'pointer' }}>Quay lại</button>
              </div>
            )}

            {/* STEP 3: INPUT OTP */}
            {step === 3 && (
              <form onSubmit={handleVerifyOtp}>
                <p style={{ textAlign: 'center', color: 'var(--gray-500)', marginBottom: '24px', fontWeight: 600 }}>Mã OTP đã được gửi tới {method === 'email' ? accountInfo.email : 'điện thoại'}.</p>
                <div className="input-group">
                  <input placeholder="Nhập 6 chữ số" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} required style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px', background: 'transparent', border: 'none', width: '100%', padding: '14px 0', outline: 'none', fontWeight: 900 }} />
                </div>
                <button type="submit" disabled={loading} className="btn-primary">XÁC MINH OTP</button>
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                  <span style={{ color: 'var(--gray-400)', fontWeight: 700 }}>Chưa nhận được mã? </span>
                  <span onClick={handleSendOtp} style={{ color: 'var(--primary)', fontWeight: 900, cursor: 'pointer' }}>Gửi lại</span>
                </div>
              </form>
            )}

            {/* STEP 4: RESET PASSWORD */}
            {step === 4 && (
              <form onSubmit={handleResetPassword}>
                <div className="input-group">
                  <input type="password" placeholder="Mật khẩu mới" value={passwords.newPass} onChange={e => setPasswords({...passwords, newPass: e.target.value})} required style={{ background: 'transparent', border: 'none', width: '100%', padding: '14px 0', outline: 'none', fontWeight: 700 }} />
                </div>
                <div className="input-group">
                  <input type="password" placeholder="Xác nhận mật khẩu" value={passwords.confirmPass} onChange={e => setPasswords({...passwords, confirmPass: e.target.value})} required style={{ background: 'transparent', border: 'none', width: '100%', padding: '14px 0', outline: 'none', fontWeight: 700 }} />
                </div>
                <button type="submit" disabled={loading} className="btn-primary">ĐẶT LẠI MẬT KHẨU</button>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default QuenMatKhau;
