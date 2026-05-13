import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ChuyenCheDoMau from "./ChuyenCheDoMau";
import { getUserProfile } from "../utils/index";

const DauTrang: React.FC<{ hideMenu?: boolean }> = ({ hideMenu }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const user = getUserProfile();

  // Hàm xóa số thứ tự ở đầu tên (Ví dụ: "1. Nguyễn Văn A" -> "Nguyễn Văn A")
  const cleanName = (name: string) => {
    return name ? name.replace(/^\d+\.\s*/, '').trim() : '';
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
      <div style={{ background: 'var(--primary)', color: 'white', padding: '10px 0', fontSize: '0.85rem', fontWeight: 700 }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <span>Đường dây cấp cứu 24/7 - ***REMOVED***-VIETQR_ACCOUNT_NO - Phục vụ không nghỉ</span>
        </div>
      </div>

      {/* dòng cảnh báo mùa dịch bệnh */}
      <div style={{ background: '#ef4444', color: 'white', padding: '12px 0', fontSize: '0.85rem', fontWeight: 900, textAlign: 'center', borderBottom: '1px solid #dc2626', boxShadow: '0 4px 10px rgba(239, 68, 68, 0.2)' }}>
        <span className="text-blink-red">Mùa bệnh dại đang gia tăng — Nhớ tiêm phòng trước 30/06! <Link to="/khach-hang/dat-lich-hen" style={{ color: '#fef08a', textDecoration: 'underline' }}>Đặt lịch ngay →</Link></span>
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
          <div className="logo-container">
            <span className="logo-rexi">Rexi</span>
            <span className="logo-sub">Phòng Khám Thú Y</span>
          </div>
        </Link>

        {/* menu điều hướng */}
        {!hideMenu && (
          <div className="mobile-hide" style={{ display: 'flex', gap: '35px' }}>
            {navItems.map((item, idx) => (
              <button
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
          <ChuyenCheDoMau />

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
                    alt={user?.display_name || "Avatar"}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).parentElement!.innerHTML = '<span class="material-symbols-outlined" style="font-size: 28px; color: white;">account_circle</span>';
                    }}
                  />
                ) : (
                  <span className="material-symbols-outlined" style={{ fontSize: '28px', color: 'white' }}>account_circle</span>
                )}
              </div>
              <span className="mobile-hide" style={{ fontSize: '0.85rem' }}>{cleanName(user.ten_khach_hang || user.ho_ten || user.display_name || "Cá nhân")}</span>
            </Link>
          ) : (
            <Link to="/dang-nhap" style={{ textDecoration: 'none', color: 'var(--ink)', fontWeight: 700, border: '1px solid var(--gray-200)', padding: '8px 20px', borderRadius: '50px' }}>Đăng nhập</Link>
          )}
          <Link to="/khach-hang/dat-lich-hen" className="mobile-hide" style={{ background: 'var(--primary-gradient)', color: 'white', padding: '10px 24px', borderRadius: '50px', textDecoration: 'none', fontWeight: 800, fontSize: '0.9rem', boxShadow: '0 10px 20px rgba(15, 157, 138, 0.25)', border: 'none', transition: 'all 0.3s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>Đặt lịch hẹn</Link>

          {/* nút mở menu trên điện thoại */}
          <button
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
            <button
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
      @keyframes textBlinkRed { 0%, 100% { color: white; } 50% { color: #fef08a; } }
      .animate-blink { animation: blink 2s infinite; }
      .text-blink-red { animation: textBlinkRed 1s infinite; }
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

export default DauTrang;
