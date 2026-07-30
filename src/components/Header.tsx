import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const Header: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
  };

  const getDashboardLink = () => {
    if (!user) return "/dang-nhap";
    const role = user.ten_vai_tro?.toLowerCase().trim();
    const staffRoles = ["admin", "nhân viên", "bác sĩ", "quản lý", "tiếp tân", "y tá"];
    return staffRoles.includes(role) ? "/quan-ly/dashboard" : "/khach-hang/dashboard";
  };

  return (
    <header>
      <div className="topbar">
        <span className="material-symbols-outlined">emergency</span>
        Đường dây cấp cứu 24/7 &nbsp;·&nbsp; <strong>024 1234 5678</strong> &nbsp;·&nbsp; Phục vụ không nghỉ
      </div>

      <div className="emergency-banner">
        <span className="material-symbols-outlined">warning</span>
        Mùa bệnh dại đang gia tăng — Nhớ tiêm phòng cho thú cưng trước ngày 30/06!
        <Link to={user ? "/khach-hang/dat-lich-hen" : "/dang-nhap"} style={{ marginLeft: "4px", fontWeight: 900, color: "#c0392b", textDecoration: "none" }}>
          Đặt lịch ngay →
        </Link>
      </div>

      <nav>
        <div className="nav-inner">
          <Link to="/" className="logo">
            <div style={{ 
              width: '44px', 
              height: '44px', 
              background: 'var(--teal)', 
              borderRadius: '16px', 
              boxShadow: '0 8px 16px rgba(15, 157, 138, 0.2)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '12px'
            }}>
              <img src='/img/avtpkty.png' alt='Logo' style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} />
            </div>
            <div>
              <span className="logo-name">Rexi</span>
              <span className="logo-sub">Phòng khám thú y</span>
            </div>
          </Link>

          {isHome && (
            <ul className="nav-links">
              <li>
                <a href="#services" onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
                }}>
                  <span className="material-symbols-outlined">medical_services</span>
                  Dịch vụ
                </a>
              </li>
              <li>
                <a href="#doctors" onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("doctors")?.scrollIntoView({ behavior: "smooth" });
                }}>
                  <span className="material-symbols-outlined">stethoscope</span>
                  Bác sĩ
                </a>
              </li>
              <li>
                <a href="#contact" onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
                }}>
                  <span className="material-symbols-outlined">location_on</span>
                  Liên hệ
                </a>
              </li>
            </ul>
          )}

          <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {user ? (
              <>
                <Link to={getDashboardLink()} className="btn-login" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>account_circle</span>
                  {user.ten_khach_hang || user.ho_ten || "Tài khoản"}
                </Link>
                <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'var(--gray-500)', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>logout</span>
                </button>
              </>
            ) : (
              <Link to="/dang-nhap" className="btn-login">
                Đăng nhập
              </Link>
            )}
            
            {isHome && (
              <Link to={user ? "/khach-hang/dat-lich-hen" : "/dang-nhap"} className="btn-book">
                <span className="material-symbols-outlined" style={{ fontSize: "17px" }}>edit_calendar</span>
                Đặt lịch hẹn
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default React.memo(Header);
