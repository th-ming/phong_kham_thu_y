import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axiosInstance from "@services/axios";

/**
 * FIX #10 & #14: Use environment variables for API URL and Google Client ID
 * FIX #15: Use axios interceptor instead of plain axios
 */
const API_URL = `${import.meta.env.VITE_API_URL}/api/auth`;
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const DangNhapDangKy: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();

  // State cho Đăng nhập
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);

  // State cho Đăng ký
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regFullname, setRegFullname] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regAddress, setRegAddress] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Tích hợp Google Login
  React.useEffect(() => {
    const loadGoogle = () => {
      if ((window as any).google && GOOGLE_CLIENT_ID) {
        (window as any).google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse
        });
        
        if (isLogin) {
          (window as any).google.accounts.id.renderButton(
            document.getElementById("googleBtn"),
            { 
              theme: "outline", 
              size: "large", 
              width: 400,
              text: "continue_with",
              shape: "rectangular"
            }
          );
        }
      }
    };

    loadGoogle();
  }, [isLogin]);

  const handleGoogleResponse = async (response: any) => {
    try {
      setLoading(true);
      // Decode JWT từ Google (phần payload nằm ở giữa dấu .)
      const base64Url = response.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const userObject = JSON.parse(jsonPayload);
      
      const res = await axiosInstance.post(`${API_URL}/google-login`, {
        email: userObject.email,
        name: userObject.name,
        googleId: userObject.sub,
        picture: userObject.picture
      });

      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        navigate("/");
      }
    } catch (err: any) {
      console.error("Google Login Error:", err.response?.data || err.message);
      setError("Đăng nhập bằng Google không thành công. Bạn thử lại nhé!");
    } finally {
      setLoading(false);
    }
  };

  // Xử lý Đăng nhập
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      const response = await axiosInstance.post(`${API_URL}/login`, {
        username: username,
        password: password
      });

      const data = response.data;
      if (data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        // Điều hướng dựa trên vai trò
        const role = data.user.ten_vai_tro?.toLowerCase().trim();
        const staffRoles = ["admin", "nhân viên", "bác sĩ", "quản lý", "tiếp tân", "y tá"];
        
        if (staffRoles.includes(role)) {
          navigate("/quan-ly/dashboard");
        } else {
          navigate("/");
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "";
      if (msg.includes("Mật khẩu không đúng") || msg.includes("password")) {
        setError("Mật khẩu không đúng rồi, bạn kiểm tra lại xem có gõ nhầm 'phím' nào không nhé! 🔑");
      } else if (msg.includes("không tồn tại") || msg.includes("User not found")) {
        setError("Tài khoản này chưa có trong hệ thống Rexi, bạn đăng ký một cái mới nhé! ✨");
      } else {
        setError("Đăng nhập không thành công, bạn kiểm tra lại tài khoản và mật khẩu nhé!");
      }
    } finally {
      setLoading(false);
    }
  };

  // Xử lý Đăng ký
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axiosInstance.post(`${API_URL}/register`, {
        ten_dang_nhap: regUsername,
        mat_khau: regPassword,
        ten_khach_hang: regFullname,
        email: regEmail,
        sdt: regPhone,
        dia_chi: regAddress
      });

      if (response.data.ThongBao === "Đăng ký thành công") {
        alert("Đăng ký thành công! Mời bạn đăng nhập.");
        setIsLogin(true);
        // Reset form
        setRegUsername("");
        setRegPassword("");
        setRegFullname("");
        setRegEmail("");
        setRegPhone("");
        setRegAddress("");
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "";
      if (msg.includes("UNIQUE KEY") || msg.includes("duplicate")) {
        setError("Tên đăng nhập này đã có chủ rồi bạn ơi, thử một tên khác 'kêu' hơn nhé! 😊");
      } else if (msg.includes("email")) {
        setError("Email này đã được dùng rồi, bạn kiểm tra lại xem nhé!");
      } else {
        setError("Có chút trục trặc nhỏ khi đăng ký, bạn thử lại sau giây lát nhé!");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--gray-50)", fontFamily: "'Inter', sans-serif" }}>
      <nav style={{
        position: 'fixed',
        top: 0,
        width: '100%',
        height: '96px',
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(20px)',
        zIndex: 50,
        padding: '0 40px',
        borderBottom: '1px solid var(--gray-100)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '44px', 
            height: '44px', 
            background: 'var(--teal)', 
            borderRadius: '16px', 
            boxShadow: '0 8px 16px rgba(15, 157, 138, 0.2)',
            overflow: 'hidden'
          }}>
            <img src='/img/avtpkty.png' alt='Rexi Logo' style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} />
          </div>
          <span style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--ink)', letterSpacing: '-1px' }}>Rexi</span>
        </div>
        <Link to="/" style={{ fontSize: '0.875rem', fontWeight: '900', color: 'var(--teal)', textDecoration: 'underline', textUnderlineOffset: '8px' }}>
          VỀ TRANG CHỦ
        </Link>
      </nav>

      <div style={{
        paddingTop: '128px',
        paddingBottom: '48px',
        maxWidth: '1200px',
        margin: '0 auto',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '48px',
          alignItems: 'center',
          padding: '0 20px'
        }}>
          
          <div style={{
            background: 'white',
            padding: '40px',
            borderRadius: '48px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)',
            border: '1px solid var(--gray-100)',
            maxWidth: '480px',
            margin: '0 auto',
            width: '100%'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <h2 style={{ fontSize: '1.875rem', fontWeight: '900', color: 'var(--ink)', marginBottom: '8px' }}>
                {isLogin ? 'ĐĂNG NHẬP' : 'ĐĂNG KÝ'}
              </h2>
              {error && <p style={{ color: 'red', fontSize: '0.875rem', marginBottom: '8px' }}>{error}</p>}
              <p style={{ color: 'var(--gray-500)', fontWeight: '500' }}>
                {isLogin ? 'Chào mừng quay trở lại' : 'Tạo tài khoản mới'}
              </p>
            </div>
            
            {isLogin ? (
              <form style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} onSubmit={handleLogin}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ position: 'relative' }}>
                    <span className="material-symbols-outlined" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }}>person</span>
                    <input 
                      type='text' 
                      placeholder='Tên đăng nhập' 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '16px 16px 16px 48px',
                        backgroundColor: 'var(--gray-50)',
                        border: '1px solid var(--gray-100)',
                        borderRadius: '16px',
                        outline: 'none',
                        fontSize: '1rem'
                      }} 
                      required 
                    />
                  </div>
                  <div style={{ position: 'relative' }}>
                    <span className="material-symbols-outlined" style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }}>lock</span>
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      placeholder='Mật khẩu' 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '16px 48px 16px 48px',
                        backgroundColor: 'var(--gray-50)',
                        border: '1px solid var(--gray-100)',
                        borderRadius: '16px',
                        outline: 'none',
                        fontSize: '1rem'
                      }} 
                      required 
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--gray-400)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4px'
                      }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type='checkbox' style={{ accentColor: 'var(--teal)' }} />
                    <span style={{ color: 'var(--gray-600)' }}>Ghi nhớ đăng nhập</span>
                  </label>
                  <a href='#' style={{ color: 'var(--teal)', fontWeight: '700', textDecoration: 'none' }}>Quên mật khẩu?</a>
                </div>
                
                <button className="btn-book" type="submit" disabled={loading} style={{ width: '100%', padding: '16px', opacity: loading ? 0.7 : 1 }}>
                  <span>{loading ? 'ĐANG XỬ LÝ...' : 'ĐĂNG NHẬP'}</span>
                  {!loading && <span className="material-symbols-outlined">arrow_forward</span>}
                </button>
                
                <div style={{ position: 'relative', margin: '8px 0' }}>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: '100%', borderTop: '1px solid var(--gray-200)' }}></div>
                  </div>
                  <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
                    <span style={{ padding: '0 16px', backgroundColor: 'white', color: 'var(--gray-500)', fontSize: '0.875rem' }}>hoặc</span>
                  </div>
                </div>
                
                <div id="googleBtn" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}></div>

                <div style={{ textAlign: 'center', marginTop: '12px' }}>
                  <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>Chưa có tài khoản? 
                    <button type="button" onClick={() => setIsLogin(false)} style={{ color: 'var(--teal)', fontWeight: '800', background: 'none', border: 'none', cursor: 'pointer', paddingLeft: '8px' }}>Đăng ký ngay</button>
                  </p>
                </div>
              </form>
            ) : (
              <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} onSubmit={handleRegister}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                  <input 
                    type='text' 
                    placeholder='Họ và tên khách hàng' 
                    value={regFullname}
                    onChange={(e) => setRegFullname(e.target.value)}
                    style={{ padding: '14px', backgroundColor: 'var(--gray-50)', border: '1px solid var(--gray-100)', borderRadius: '16px', outline: 'none' }} 
                    required 
                  />
                </div>
                <input 
                  type='text' 
                  placeholder='Tên đăng nhập' 
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  style={{ padding: '14px', backgroundColor: 'var(--gray-50)', border: '1px solid var(--gray-100)', borderRadius: '16px', outline: 'none' }} 
                  required 
                />
                <input 
                  type='email' 
                  placeholder='Email' 
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  style={{ padding: '14px', backgroundColor: 'var(--gray-50)', border: '1px solid var(--gray-100)', borderRadius: '16px', outline: 'none' }} 
                  required 
                />
                <input 
                  type='tel' 
                  placeholder='Số điện thoại' 
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  style={{ padding: '14px', backgroundColor: 'var(--gray-50)', border: '1px solid var(--gray-100)', borderRadius: '16px', outline: 'none' }} 
                  required 
                />
                <input 
                    type='text' 
                    placeholder='Địa chỉ' 
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    style={{ padding: '14px', backgroundColor: 'var(--gray-50)', border: '1px solid var(--gray-100)', borderRadius: '16px', outline: 'none' }} 
                />
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showRegPassword ? 'text' : 'password'} 
                    placeholder='Mật khẩu' 
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    style={{ width: '100%', padding: '14px 48px 14px 14px', backgroundColor: 'var(--gray-50)', border: '1px solid var(--gray-100)', borderRadius: '16px', outline: 'none' }} 
                    required 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--gray-400)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '4px'
                    }}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                      {showRegPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
                
                {/* FIX #18: Add loading state to register button */}
                <button className="btn-book" type="submit" disabled={loading} style={{ width: '100%', padding: '16px', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}>
                  <span>{loading ? 'ĐANG XỬ LÝ...' : 'ĐĂNG KÝ'}</span>
                  {!loading && <span className="material-symbols-outlined">person_add</span>}
                </button>
                
                <div style={{ textAlign: 'center', marginTop: '12px' }}>
                  <p style={{ color: 'var(--gray-500)', fontSize: '0.9rem' }}>Đã có tài khoản? 
                    <button type="button" onClick={() => setIsLogin(true)} style={{ color: 'var(--teal)', fontWeight: '800', background: 'none', border: 'none', cursor: 'pointer', paddingLeft: '8px' }}>Đăng nhập</button>
                  </p>
                </div>
              </form>
            )}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ textAlign: 'left' }}>
              <h1 style={{ fontSize: '4rem', fontWeight: '900', color: 'var(--ink)', lineHeight: 0.9, letterSpacing: '-2px', marginBottom: '24px' }}>
                Chào mừng đến với <br/>
                <span style={{ color: 'var(--teal)', fontStyle: 'italic' }}>Rexi</span>
              </h1>
              <p style={{ fontSize: '1.125rem', color: 'var(--gray-500)', lineHeight: 1.6, maxWidth: '400px', fontWeight: '500' }}>
                Nơi chăm sóc sức khỏe cho những người bạn bốn chân của bạn với tình yêu và chuyên môn cao nhất.
              </p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div style={{ background: 'white', padding: '24px', borderRadius: '32px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', border: '1px solid var(--gray-100)', textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', background: '#ecfdf5', color: 'var(--teal)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>pets</span>
                </div>
                <p style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--ink)', margin: 0 }}>10k+</p>
                <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Thú cưng đã chăm sóc</p>
              </div>
              <div style={{ background: 'white', padding: '24px', borderRadius: '32px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', border: '1px solid var(--gray-100)', textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', background: '#ecfdf5', color: 'var(--teal)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>local_hospital</span>
                </div>
                <p style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--ink)', margin: 0 }}>24/7</p>
                <p style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Dịch vụ khẩn cấp</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(DangNhapDangKy);
