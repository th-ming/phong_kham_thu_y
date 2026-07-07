import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import { normalizeUserRole } from "../utils/index";
import { toast } from "@components/Toast";
import { notifyUserProfileChanged, useLiveUserProfile } from "@hooks/useLiveUserProfile";

const Header: React.FC<{ hideMenu?: boolean }> = ({ hideMenu }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const user = useLiveUserProfile();

  // Điều hướng đặt lịch thông minh cho Nhân viên / Quản lý / Khách hàng
  const handleBookingRedirect = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    if (user) {
      if (normalizeUserRole(user) !== "khach_hang") {
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
    return normalizeUserRole(user) === "khach_hang" ? "/khach-hang/dashboard" : "/quan-ly/dashboard";
  };

  const getProfileLink = () => {
    if (!user) return "/dang-nhap";
    return normalizeUserRole(user) === "khach_hang" ? "/khach-hang/thong-tin-ca-nhan" : "/quan-ly/thong-tin-ca-nhan";
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    notifyUserProfileChanged(null);
    setIsMenuOpen(false);
    navigate("/dang-nhap");
  };

  const isHomePage = location.pathname === "/";
  const userDisplayName = cleanName(user?.display_name || user?.displayName || user?.ho_ten || user?.hoTen || user?.fullName || user?.ten_khach_hang || user?.ten_dang_nhap || user?.username || "Người dùng Rexi");
  const userAvatar = user?.hinh_anh || user?.avatar || "";
  const userInitial = userDisplayName.charAt(0).toUpperCase() || "R";

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
            <span>Đường dây cấp cứu 24/7: <a data-ai-id="link_header_emergency_phone" href="tel:***REMOVED***-VIETQR_ACCOUNT_NO" style={{ color: 'white', textDecoration: 'none' }}>0353.374.156</a></span>
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
          <button data-ai-id="btn_header_booking_alert" type="button" onClick={handleBookingRedirect} aria-label="Đặt lịch ngay" style={{ background: 'none', border: 'none', padding: 0, color: 'var(--alert-link)', fontWeight: 950, textDecoration: 'underline', marginLeft: '10px', cursor: 'pointer' }}>Đặt lịch ngay →</button>
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

        <div className="header-action-group" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {/* nút giao diện sáng tối */}
          <ThemeToggle />

          {user ? (
            <div className="header-user-menu">
              <Link to={getDashboardLink()} className="header-user-profile" style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--gray-100)', padding: '8px 16px 8px 14px', borderRadius: '22px', border: '1px solid var(--gray-200)', textDecoration: 'none', color: 'var(--ink)', fontWeight: 700 }}>
                <div className="header-user-avatar">
                  <div className="header-user-avatar-ring" aria-hidden="true" />
                  <div className="header-user-avatar-core">
                    {userAvatar && /^(https?:|data:image\/)/.test(userAvatar) ? (
                      <img
                        src={userAvatar}
                        alt={userDisplayName}
                        className="header-user-avatar-img"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="header-user-avatar-initial">{userInitial}</span>
                    )}
                  </div>
                </div>
                <span className="mobile-hide header-user-profile-name" style={{ fontSize: '0.85rem' }}>
                  {userDisplayName}
                </span>
                <span className="material-symbols-outlined header-user-menu-arrow" aria-hidden="true">expand_more</span>
              </Link>
              <div className="header-user-dropdown" aria-label="Tùy chọn tài khoản">
                <Link
                  data-ai-id="link-header-profile"
                  to={getProfileLink()}
                  className="header-user-dropdown-action"
                >
                  <span className="material-symbols-outlined">person</span>
                  Hồ sơ cá nhân
                </Link>
                <button
                  data-ai-id="button-header-logout"
                  type="button"
                  onClick={handleLogout}
                  className="header-user-dropdown-action header-user-logout"
                >
                  <span className="material-symbols-outlined">logout</span>
                  Đăng xuất
                </button>
              </div>
            </div>
          ) : (
            <Link to="/dang-nhap" style={{ textDecoration: 'none', color: 'var(--ink)', fontWeight: 700, border: '1px solid var(--gray-200)', padding: '8px 20px', borderRadius: '50px' }}>Đăng nhập</Link>
          )}
          <button data-ai-id="button-header-datlich" onClick={handleBookingRedirect} className="mobile-hide header-booking-cta" style={{ background: 'var(--primary-gradient)', color: 'white', padding: '10px 24px', borderRadius: '50px', textDecoration: 'none', fontWeight: 800, fontSize: '0.9rem', boxShadow: '0 10px 20px var(--primary-shadow)', border: 'none', cursor: 'pointer' }}><span>Đặt lịch hẹn</span></button>

          {/* nút menu trên dt */}
          <button data-ai-id="button-header-x3hq"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="mobile-show"
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? "Đóng menu điều hướng" : "Mở menu điều hướng"}
            style={{ background: 'var(--gray-100)', border: '1px solid var(--gray-200)', cursor: 'pointer', color: 'var(--ink)', width: '48px', height: '48px', borderRadius: '16px', display: 'grid', placeItems: 'center', transition: 'transform 0.22s ease, background 0.22s ease, border-color 0.22s ease' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>{isMenuOpen ? 'close' : 'menu'}</span>
          </button>
        </div>
      </nav>

      {/* menu hiển thị trên dt */}
      {isMenuOpen && (
        <div className="mobile-nav-panel" style={{ position: 'absolute', top: '100%', left: 0, width: '100%', background: 'var(--background)', padding: '18px 20px 20px', display: 'flex', flexDirection: 'column', gap: '10px', borderBottom: '1px solid var(--gray-200)', zIndex: 10, boxShadow: 'var(--shadow-xl)' }}>
          {navItems.map((item, idx) => (
            <button data-ai-id="button-header-8sdi"
              key={idx}
              onClick={() => handleNavClick(item)}
              className="mobile-menu-action"
              style={{ ['--item-index' as any]: idx, background: 'rgba(15, 157, 138, 0.05)', border: '1px solid transparent', textAlign: 'left', color: 'var(--ink)', fontWeight: 800, padding: '15px 16px', borderRadius: '14px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
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
      @keyframes headerAvatarGlow {
        0%, 100% {
          box-shadow: 0 0 12px rgba(15, 157, 138, 0.35), 0 0 22px rgba(34, 211, 238, 0.22), inset 0 0 10px rgba(15, 157, 138, 0.12);
          opacity: 0.88;
        }
        50% {
          box-shadow: 0 0 18px rgba(15, 157, 138, 0.55), 0 0 32px rgba(34, 211, 238, 0.42), inset 0 0 14px rgba(34, 211, 238, 0.2);
          opacity: 1;
        }
      }
      .header-user-profile {
        align-items: center;
      }
      .header-user-menu-arrow {
        color: var(--gray-500);
        font-size: 20px;
        margin-left: -4px;
        transition: transform 0.18s ease, color 0.18s ease;
      }
      .header-user-menu:hover .header-user-menu-arrow,
      .header-user-menu:focus-within .header-user-menu-arrow {
        color: var(--primary);
        transform: rotate(180deg);
      }
      .header-user-menu {
        position: relative;
        display: flex;
        align-items: center;
      }
      .header-user-dropdown {
        position: absolute;
        top: calc(100% + 10px);
        right: 0;
        min-width: 168px;
        padding: 8px;
        border-radius: 16px;
        background: var(--surface);
        border: 1px solid var(--gray-200);
        box-shadow: var(--shadow-xl);
        opacity: 0;
        visibility: hidden;
        transform: translateY(-6px);
        pointer-events: none;
        transition: opacity 0.18s ease, transform 0.18s ease, visibility 0.18s ease;
        z-index: 30;
      }
      .header-user-dropdown::before {
        content: "";
        position: absolute;
        left: 0;
        right: 0;
        top: -12px;
        height: 12px;
      }
      .header-user-menu:hover .header-user-dropdown,
      .header-user-menu:focus-within .header-user-dropdown {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
        pointer-events: auto;
      }
      .header-user-dropdown-action {
        width: 100%;
        min-height: 42px;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border-radius: 12px;
        border: 1px solid transparent;
        background: transparent;
        color: var(--ink);
        font-weight: 900;
        font-size: 0.88rem;
        cursor: pointer;
        text-decoration: none;
        box-sizing: border-box;
        transition: background 0.18s ease, color 0.18s ease, border-color 0.18s ease;
      }
      .header-user-dropdown-action:hover,
      .header-user-dropdown-action:focus-visible {
        background: rgba(15, 157, 138, 0.08);
        color: var(--primary);
        border-color: rgba(15, 157, 138, 0.16);
        outline: none;
      }
      .header-user-logout {
        margin-top: 4px;
        color: #ef4444;
        background: rgba(239, 68, 68, 0.08);
        border-color: rgba(239, 68, 68, 0.18);
      }
      .header-user-logout:hover,
      .header-user-logout:focus-visible {
        background: #ef4444;
        color: white;
        border-color: #ef4444;
        outline: none;
      }
      .header-user-dropdown-action .material-symbols-outlined {
        font-size: 20px;
      }
      .header-user-profile-name {
        line-height: 1.2;
      }
      .header-user-avatar {
        position: relative;
        width: 48px;
        height: 48px;
        flex-shrink: 0;
        box-sizing: border-box;
      }
      .header-user-avatar-ring {
        position: absolute;
        inset: 0;
        margin: 0;
        border-radius: 50%;
        border: 2px solid var(--primary);
        animation: headerAvatarGlow 2.4s ease-in-out infinite;
        pointer-events: none;
        box-sizing: border-box;
      }
      .header-user-avatar-core {
        position: absolute;
        top: 3px;
        left: 3px;
        width: 42px;
        height: 42px;
        border-radius: 50%;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(15, 157, 138, 0.12);
        color: var(--primary);
        font-weight: 950;
        z-index: 1;
        border: 1.5px solid rgba(15, 157, 138, 0.35);
        box-shadow: 0 0 14px rgba(15, 157, 138, 0.28);
        box-sizing: border-box;
      }
      .header-user-avatar-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center center;
        display: block;
      }
      .header-user-avatar-initial {
        position: absolute;
        left: 50%;
        top: 50%;
        display: block;
        width: auto;
        height: auto;
        font-size: 1.35rem;
        line-height: 1;
        text-shadow: 0 0 10px rgba(34, 211, 238, 0.45);
        padding: 0;
        box-sizing: border-box;
        font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        transform: translate(-50%, -53%);
      }
      .header-user-avatar:hover .header-user-avatar-ring {
        animation-duration: 1.6s;
      }
      .header-user-avatar:hover .header-user-avatar-core {
        box-shadow: 0 0 20px rgba(15, 157, 138, 0.45), 0 0 28px rgba(34, 211, 238, 0.35);
      }
      @keyframes headerCtaGlowBreath {
        0%, 100% {
          box-shadow: 0 10px 20px var(--primary-shadow), 0 0 10px rgba(15, 157, 138, 0.18);
          filter: brightness(1);
        }
        52% {
          box-shadow: 0 12px 26px var(--primary-shadow), 0 0 24px rgba(34, 211, 238, 0.46), 0 0 38px rgba(15, 157, 138, 0.24);
          filter: brightness(1.06);
        }
      }
      .header-booking-cta {
        position: relative;
        isolation: isolate;
        overflow: hidden;
        transition: box-shadow 0.24s ease, filter 0.24s ease;
        animation: headerCtaGlowBreath 3.8s ease-in-out infinite;
      }
      .header-booking-cta > span {
        position: relative;
        z-index: 1;
      }
      .header-booking-cta:hover {
        filter: brightness(1.04);
        box-shadow: 0 12px 26px var(--primary-shadow), 0 0 18px var(--primary-shadow) !important;
      }
      .nav-link-btn:hover { color: var(--primary) !important; }
        .nav-link-btn:hover .material-symbols-outlined { color: var(--primary) !important; }
        .nav-underline { position: absolute; bottom: 0; left: 0; width: 0; height: 2px; background: var(--primary); transition: width 0.3s; }
        .nav-link-btn:hover .nav-underline { width: 100%; }
        .mobile-show:hover { transform: translateY(-1px); background: rgba(15, 157, 138, 0.10) !important; border-color: rgba(15, 157, 138, 0.28) !important; }
        .mobile-show:active { transform: scale(0.94); }
        .mobile-nav-panel {
          transform-origin: top center;
          animation: mobileMenuDrop 0.24s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .mobile-menu-action {
          position: relative;
          overflow: hidden;
          transform: translateY(8px);
          opacity: 0;
          animation: mobileItemIn 0.32s cubic-bezier(0.22, 1, 0.36, 1) both;
          animation-delay: calc(var(--item-index) * 55ms);
          transition: transform 0.2s ease, color 0.2s ease, background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .mobile-menu-action::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
          transform: translateX(-120%);
          transition: transform 0.45s ease;
        }
        .mobile-menu-action:hover,
        .mobile-menu-action:focus-visible {
          color: var(--primary) !important;
          background: rgba(15, 157, 138, 0.12) !important;
          border-color: rgba(15, 157, 138, 0.25) !important;
          box-shadow: 0 10px 24px rgba(15, 157, 138, 0.12);
          transform: translateX(4px);
          outline: none;
        }
        .mobile-menu-action:hover::after,
        .mobile-menu-action:focus-visible::after { transform: translateX(120%); }
        .mobile-menu-action:active { transform: translateX(4px) scale(0.98); }
        .mobile-menu-action .material-symbols-outlined { transition: transform 0.2s ease, color 0.2s ease; }
        .mobile-menu-action:hover .material-symbols-outlined,
        .mobile-menu-action:focus-visible .material-symbols-outlined { transform: translateX(2px) scale(1.08); }
        @keyframes mobileMenuDrop {
          from { opacity: 0; transform: translateY(-10px) scaleY(0.98); }
          to { opacity: 1; transform: translateY(0) scaleY(1); }
        }
        @keyframes mobileItemIn {
          to { opacity: 1; transform: translateY(0); }
        }
        @media (max-width: 991px) { .mobile-hide { display: none !important; } }
        @media (min-width: 992px) { .mobile-show { display: none !important; } }
        @media (max-width: 768px) {
          header > div:first-child {
            padding: 8px 0 !important;
            font-size: 0.85rem !important;
          }
          header > div:first-child .container {
            gap: 8px !important;
            padding-left: 12px !important;
            padding-right: 12px !important;
          }
          header > div:nth-child(2) {
            padding: 9px 10px !important;
            font-size: 0.78rem !important;
            line-height: 1.25 !important;
          }
          header > div:nth-child(2) .text-blink-red {
            gap: 6px !important;
            flex-wrap: nowrap !important;
            justify-content: flex-start !important;
            text-align: left !important;
          }
          header > div:nth-child(2) button {
            margin-left: 4px !important;
            white-space: nowrap !important;
          }
          nav.container {
            height: 72px !important;
            padding-left: 18px !important;
            padding-right: 18px !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            gap: 12px !important;
          }
          nav.container > a {
            justify-self: auto !important;
            min-width: 0 !important;
            flex: 0 1 auto !important;
          }
          nav.container > .header-action-group {
            display: flex !important;
            align-items: center !important;
            justify-content: flex-end !important;
            gap: 12px !important;
            flex: 0 0 auto !important;
          }
          .logo-icon {
            width: 34px !important;
            height: 34px !important;
            border-radius: 9px !important;
          }
          .logo-rexi {
            font-size: 1.45rem !important;
          }
          .logo-sub {
            font-size: 0.58rem !important;
            letter-spacing: 0.8px !important;
          }
          .header-action-group {
            gap: 12px !important;
          }
          .header-action-group > button.mobile-show {
            order: 3 !important;
            justify-self: auto !important;
          }
          .header-action-group > a,
          .header-action-group > .header-user-menu {
            order: 2 !important;
            justify-self: auto !important;
          }
          .header-action-group > button:not(.mobile-show) {
            order: 1 !important;
            justify-self: auto !important;
            transform: none !important;
          }
          .header-user-profile {
            padding: 4px !important;
            border-radius: 999px !important;
          }
          .header-user-dropdown {
            right: -4px !important;
            min-width: 154px !important;
          }
          .header-action-group > a[href="/dang-nhap"] {
            display: grid !important;
            place-items: center !important;
            width: 42px !important;
            height: 42px !important;
            padding: 0 !important;
            border-radius: 12px !important;
            font-size: 0 !important;
            position: relative !important;
            background: var(--gray-100) !important;
            border: 1px solid var(--gray-200) !important;
          }
          .header-action-group > a[href="/dang-nhap"]::before {
            content: "person" !important;
            font-family: "Material Symbols Outlined" !important;
            font-size: 24px !important;
            line-height: 1 !important;
            color: var(--primary) !important;
          }
          .header-user-avatar {
            width: 42px !important;
            height: 42px !important;
          }
          .header-user-avatar-core {
            top: 3px !important;
            left: 3px !important;
            width: 36px !important;
            height: 36px !important;
            display: grid !important;
            place-items: center !important;
          }
          .header-user-avatar-initial {
            position: static !important;
            left: auto !important;
            top: auto !important;
            width: auto !important;
            height: auto !important;
            display: block !important;
            font-size: 1.2rem !important;
            line-height: 1 !important;
            padding: 0 !important;
            transform: translateX(1px) !important;
            text-align: center !important;
          }
          .mobile-show {
            width: 42px !important;
            height: 42px !important;
            border-radius: 12px !important;
          }
        }
        @media screen and (max-height: 500px) and (orientation: landscape) {
          header {
            position: absolute !important;
          }
          header > div:first-child,
          header > div:nth-child(2) {
            display: none !important;
          }
          nav.container {
            height: 54px !important;
          }
        }
        // Tối ưu chống vỡ layout, lệch nút trên màn hình dt cực nhỏ (dưới 380px)
        @media (max-width: 380px) {
          .header-action-group { gap: 8px !important; }
          .logo-container { display: none !important; }
        }
      `}</style>
    </header>
  );
};

export default Header;
