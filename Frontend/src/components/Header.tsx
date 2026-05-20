import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import { getUserProfile } from "../utils/index";
import { toast } from "@components/Toast";

const Header: React.FC<{ hideMenu?: boolean }> = ({ hideMenu }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const user = getUserProfile();

  // Điều hướng đặt lịch thông minh cho Nhân viên / Quản lý / Khách hàng
  const handleBookingRedirect = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (user) {
      const vaiTro = (user.ten_vai_tro || user.loai_tai_khoan || "").toLowerCase();
      if (vaiTro !== "customer" && vaiTro !== "khach_hang" && !vaiTro.includes("khách hàng")) {
        toast.info("Bạn đang đăng nhập với tài khoản nhân sự. Hệ thống đang chuyển hướng bạn đến Trang quản lý lịch hẹn nội bộ!");
        navigate("/quan-ly/lich-hen");
        return;
      }
    }
    navigate("/khach-hang/dat-lich-hen");
  };

  // Hàm xóa số thứ tự ở đầu tên (Ví dụ: "1. Nguyễn Văn A" -> "Nguyễn Văn A")
  const cleanName = (name: string) => {
    if (!name) return '';
    const cleaned = name.replace(/^\d+\.\s*/, '').trim();
    return cleaned.toLowerCase() === 'admin' ? 'Quản trị viên' : cleaned;
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const getDashboardLink = () => {
    if (!user) return "/dang-nhap";
    const vaiTro = user.ten_vai_tro?.toLowerCase() || user.loai_tai_khoan?.toLowerCase();
    return (vaiTro && !vaiTro.includes("khách hàng")) ? "/quan-ly/dashboard" : "/khach-hang/dashboard";
  };

  const isHomePage = location.pathname === "/";

  const navItems = [
    { label: 'Dịch vụ', path: '/#services', anchor: '#services', icon: 'medical_services' },
    { label: 'Bảng giá', path: '/bang-gia', anchor: null, icon: 'payments' },
    { label: 'Bác sĩ', path: '/bac-si', anchor: isHomePage ? '#doctors' : null, icon: 'stethoscope' },
    { label: 'Liên hệ', path: '/lien-he', anchor: isHomePage ? '#contact' : null, icon: 'location_on' }
  ];

  const handleNavClick = (item: any) => {
    setIsMenuOpen(false);
    if (isHomePage && item.anchor) {
      const element = document.querySelector(item.anchor);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (item.anchor && !isHomePage) {
      navigate('/' + item.anchor);
    } else {
      navigate(item.path);
    }
  };

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 1000,
      background: isScrolled ? 'var(--surface)' : 'var(--background)',
      backdropFilter: isScrolled ? 'var(--glass-blur) saturate(150%)' : 'none',
      boxShadow: isScrolled ? 'var(--shadow-lg)' : 'none',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      borderBottom: isScrolled ? '1px solid var(--gray-200)' : '1px solid transparent'
    }}>
      {/* đường dây cấp cứu 24/7 trên header */}
      <div style={{ background: 'var(--primary)', color: 'white', padding: '12px 0', fontSize: '0.9rem', fontWeight: 800, position: 'relative', overflow: 'hidden' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '25px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-symbols-outlined animate-pulse" style={{ fontSize: '20px' }}>support_agent</span>
            <span>Đường dây cấp cứu 24/7: <a href="tel:***REMOVED***-VIETQR_ACCOUNT_NO" style={{ color: 'white', textDecoration: 'none' }}>0353.374.156</a></span>
          </div>
          <div className="mobile-hide" style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: 0.9 }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>schedule</span>
            <span>Phục vụ không nghỉ lễ</span>
          </div>
        </div>
        {/* Hiệu ứng ánh sáng chạy ngang banner */}
        <div className="shimmer" style={{ position: 'absolute', inset: 0, opacity: 0.1 }}></div>
      </div>

      {/* dòng cảnh báo mùa dịch bệnh */}
      <div style={{ 
        background: 'var(--alert-bg)', 
        color: 'var(--alert-text)', 
        padding: '12px 0', 
        fontSize: '0.85rem', 
        fontWeight: 900, 
        textAlign: 'center', 
        borderBottom: '1px solid var(--alert-border)', 
        boxShadow: '0 4px 15px rgba(225, 29, 72, 0.05)',
        backdropFilter: 'var(--glass-blur)',
        transition: 'all 0.3s ease'
      }}>
        <span className="text-blink-red" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--alert-icon-color)' }}>warning</span>
          Mùa bệnh dại đang gia tăng — Nhớ tiêm phòng trước 30/06! 
          <a href="#" onClick={handleBookingRedirect} style={{ color: 'var(--alert-link)', fontWeight: 950, textDecoration: 'underline', marginLeft: '10px' }}>Đặt lịch ngay →</a>
        </span>
      </div>

      <nav className="container" style={{ height: '80px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '14px', textDecoration: 'none' }}>
          <div className="logo-icon" style={{
            background: 'var(--primary)',
            width: '50px',
            height: '50px',
            borderRadius: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            boxShadow: '0 8px 16px rgba(15, 157, 138, 0.2)'
          }}>
            {/* logo phòng khám góc trái */}
            <img src="/img/avtpkty.png" alt="Rexi" style={{ width: '65%', filter: 'brightness(0) invert(1)' }} />
          </div>
          <div className="logo-container" style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="logo-rexi" style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>Rexi</span>
            <span className="logo-sub" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-500)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>Phòng Khám Thú Y</span>
          </div>
        </Link>

        {/* menu điều hướng */}
        {!hideMenu && (
          <div className="mobile-hide" style={{ display: 'flex', gap: '45px' }}>
            {navItems.map((item, idx) => (
              <button data-ai-id="button-header-5v15"
                key={idx}
                onClick={() => handleNavClick(item)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--ink)',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 0',
                  position: 'relative',
                  transition: 'color 0.3s'
                }}
                className="nav-link-btn"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--gray-500)' }}>{item.icon}</span>
                {item.label}
                <div className="nav-underline"></div>
              </button>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {/* nút giao diện sáng tối */}
          <ThemeToggle />

          {user ? (
            <Link to={getDashboardLink()} style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--gray-100)', padding: '12px', borderRadius: '20px', border: '1px solid var(--gray-200)', textDecoration: 'none', color: 'var(--ink)', fontWeight: 700 }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px', overflow: 'hidden',
                border: '2px solid var(--background)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                background: (user?.hinh_anh || user?.avatar) ? 'transparent' : 'var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {/* avatar người dùng: Ưu tiên ảnh Google, nếu không có dùng icon hình người chuyên nghiệp */}
                {user?.hinh_anh || user?.avatar ? (
                  <img
                    src={user.hinh_anh || user.avatar}
                    alt={user?.displayName || "Avatar"}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="material-symbols-outlined" style="font-size: 28px; color: white;">account_circle</span>';
                    }}
                  />
                ) : (
                  <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'white' }}>account_circle</span>
                )}
              </div>
              <span className="mobile-hide" style={{ fontSize: '0.85rem' }}>
                {cleanName(user.display_name || user.displayName || user.ho_ten || user.hoTen || user.fullName || user.ten_khach_hang || user.ten_dang_nhap || user.username || "Người dùng Rexi")}
              </span>
            </Link>
          ) : (
            <Link to="/dang-nhap" style={{ textDecoration: 'none', color: 'var(--ink)', fontWeight: 700, border: '1px solid var(--gray-200)', padding: '8px 20px', borderRadius: '50px' }}>Đăng nhập</Link>
          )}
          <button data-ai-id="button-header-datlich" onClick={handleBookingRedirect} className="mobile-hide" style={{ background: 'var(--primary-gradient)', color: 'white', padding: '10px 24px', borderRadius: '50px', textDecoration: 'none', fontWeight: 800, fontSize: '0.9rem', boxShadow: '0 10px 20px rgba(15, 157, 138, 0.25)', border: 'none', transition: 'all 0.3s', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>Đặt lịch hẹn</button>

          {/* nút mở menu trên điện thoại */}
          <button data-ai-id="button-header-x3hq"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="mobile-show"
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? "Đóng menu điều hướng" : "Mở menu điều hướng"}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink)' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '30px' }}>{isMenuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </nav>

      {/* menu hiển thị trên điện thoại */}
      {isMenuOpen && (
        <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', background: 'var(--background)', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px', borderBottom: '1px solid var(--gray-200)', zIndex: 10, boxShadow: 'var(--shadow-xl)' }}>
          {navItems.map((item, idx) => (
            <button data-ai-id="button-header-8sdi"
              key={idx}
              onClick={() => handleNavClick(item)}
              style={{ background: 'none', border: 'none', textAlign: 'left', color: 'var(--ink)', fontWeight: 700, padding: '15px', borderRadius: '12px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '12px' }}
            >
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </div>
      )}

      <style>{`
      @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
      @keyframes textBlinkRed { 0%, 100% { color: var(--alert-text); } 50% { opacity: 0.8; } }
      .animate-blink { animation: blink 2s infinite; }
      .text-blink-red { animation: textBlinkRed 1.8s infinite ease-in-out; }
      .nav-link-btn:hover { color: var(--primary) !important; }
        .nav-link-btn:hover .material-symbols-outlined { color: var(--primary) !important; }
        .nav-underline { position: absolute; bottom: 0; left: 0; width: 0; height: 2px; background: var(--primary); transition: width 0.3s; }
        .nav-link-btn:hover .nav-underline { width: 100%; }
        @media (max-width: 991px) { .mobile-hide { display: none !important; } }
        @media (min-width: 992px) { .mobile-show { display: none !important; } }
      `}</style>
    </header>
  );
};

export default Header;
