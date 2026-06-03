import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import ThemeToggle from './ThemeToggle'
import { useLiveUserProfile } from '@hooks/useLiveUserProfile'
import { isGenZBirthYear } from '@utils/customerTone'

const SidebarKhachHang: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const user = useLiveUserProfile();
  const isGenZCustomer = isGenZBirthYear(user?.nam_sinh);

  const sidebarItems = [
    { label: 'Tổng quan', path: '/khach-hang/dashboard', icon: 'dashboard' },
    { label: 'Thú cưng', path: '/khach-hang/quan-ly-thu-cung', icon: 'pets' },
    { label: 'Đặt lịch hẹn', path: '/khach-hang/dat-lich-hen', icon: 'edit_calendar' },
    { label: 'Xem lịch hẹn', path: '/khach-hang/lich-su-lich-hen', icon: 'calendar_month' },
    { label: 'Hồ sơ y tế', path: '/khach-hang/ho-so-benh-an', icon: 'medical_information' },
    { label: 'Hóa đơn', path: '/khach-hang/hoa-don-thanh-toan', icon: 'receipt' },
    { label: 'Cá nhân', path: '/khach-hang/thong-tin-ca-nhan', icon: 'person' },
  ];
  const mobileNavItems = [sidebarItems[0], sidebarItems[1], sidebarItems[2], sidebarItems[3], sidebarItems[6]];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/dang-nhap");
  }

  // Hàm xóa số thứ tự ở đầu tên (Ví dụ: "1. Nguyễn Văn A" -> "Nguyễn Văn A")
  const cleanName = (name: string) => {
    if (!name) return '';
    const cleaned = name.replace(/^\d+\.\s*/, '').trim();
    return cleaned.toLowerCase() === 'admin' ? 'Quản trị viên' : cleaned;
  };
  const userDisplayName = cleanName(user?.display_name || user?.displayName || user?.ho_ten || user?.hoTen || user?.fullName || user?.ten_khach_hang || user?.ten_dang_nhap || user?.username || "Thành viên");
  const userAvatar = user?.hinh_anh || user?.avatar || "";
  const userInitial = userDisplayName.charAt(0).toUpperCase() || "S";
  const [avatarFailed, setAvatarFailed] = useState(false);

  useEffect(() => {
    setAvatarFailed(false);
  }, [userAvatar]);

  return (
    <>
      {/* Nút Hamburger nổi trên mobile */}
      {!isMobileOpen && (
        <button data-ai-id="button-sidebarkhachhang-u7rt"
          className="mobile-show sidebar-fab customer-menu-fab"
          onClick={() => setIsMobileOpen(true)}
          style={{
            position: 'fixed', bottom: '24px', left: '24px', zIndex: 1001,
            background: 'var(--primary)', color: 'white', border: 'none',
            width: '56px', height: '56px', borderRadius: '50%',
            boxShadow: '0 4px 15px rgba(15, 157, 138, 0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>menu</span>
        </button>
      )}

      {/* Lớp phủ mờ khi mở menu trên mobile */}
      {isMobileOpen && (
        <div
          className="mobile-show"
          onClick={() => setIsMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, backdropFilter: 'blur(4px)' }}
        />
      )}

      <aside className={`sidebar customer-sidebar ${isMobileOpen ? 'active' : ''}`} style={{
        width: '280px', background: 'var(--glass)', backdropFilter: 'var(--glass-blur)',
        borderRight: '1.5px solid var(--glass-border)',
        display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0, zIndex: 1000
      }}>
        {isMobileOpen && (
          <button
            data-ai-id="button-sidebarkhachhang-close-panel"
            className="mobile-show customer-sidebar-close"
            onClick={() => setIsMobileOpen(false)}
            aria-label="Đóng menu khách hàng"
            title="Đóng menu"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        )}
        <div style={{ padding: '40px 24px', borderBottom: '1.5px solid var(--glass-border)' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px', textDecoration: 'none', padding: '0 10px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '16px', overflow: 'hidden', background: 'var(--primary-gradient)', border: '2.5px solid rgba(255,255,255,0.2)', boxShadow: '0 0 30px var(--primary-shadow)' }}>
              <img src="/img/avtpkty.png" alt="Rexi" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px', filter: 'brightness(0) invert(1)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h2 className="text-gradient" style={{ fontSize: '2.1rem', margin: 0, letterSpacing: '-1.5px', fontWeight: 950, lineHeight: 0.9, color: 'var(--primary)' }}>REXI</h2>
              <p style={{ fontSize: '0.72rem', fontWeight: 950, color: 'var(--primary)', margin: '4px 0 0 0', letterSpacing: '2px', textTransform: 'uppercase', opacity: 0.9, whiteSpace: 'nowrap' }}>{isGenZCustomer ? 'GÓC CỦA SEN' : 'KHU VỰC KHÁCH HÀNG'}</p>
            </div>
          </Link>

          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', borderRadius: '24px', border: '1px solid var(--glass-border)', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.3)', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0, position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid var(--primary)', boxShadow: '0 0 15px var(--primary), inset 0 0 15px var(--primary)', animation: 'pulse 2s infinite' }} />
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', overflow: 'hidden', background: 'rgba(20, 184, 166, 0.1)', display: 'grid', placeItems: 'center', color: 'var(--primary)', fontWeight: 950, fontSize: '1.5rem', position: 'relative', zIndex: 1, textShadow: '0 0 10px var(--primary)' }}>
                {userAvatar && !avatarFailed ? (
                  <img
                    src={userAvatar}
                    alt={userDisplayName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={() => setAvatarFailed(true)}
                  />
                ) : (
                  <span>{userInitial}</span>
                )}
              </div>
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ fontWeight: 950, fontSize: '1rem', color: 'var(--ink)', margin: 0, whiteSpace: 'nowrap', textOverflow: 'ellipsis', letterSpacing: '-0.5px' }}>
                {userDisplayName}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '12px', color: 'var(--primary)' }}>stars</span>
                <p style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 900, margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>KHTT</p>
              </div>
            </div>
          </div>
        </div>

        <nav style={{ padding: '32px 16px', flex: 1, overflowY: 'auto' }}>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sidebarItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path)
              return (
                <li key={item.path}>
                  <Link to={item.path} onClick={() => setIsMobileOpen(false)} style={{
                    display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 24px',
                    color: isActive ? 'white' : 'var(--gray-500)',
                    background: isActive ? 'var(--primary-gradient)' : 'transparent',
                    borderRadius: '20px', fontWeight: isActive ? 950 : 700, fontSize: '1rem',
                    textDecoration: 'none', transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
                    boxShadow: isActive ? '0 15px 30px -10px var(--primary-shadow)' : 'none',
                    border: isActive ? '1.5px solid rgba(255,255,255,0.2)' : '1px solid transparent',
                    position: 'relative'
                  }}>
                    {isActive && <div style={{ position: 'absolute', left: '-16px', width: '6px', height: '30px', background: 'var(--primary)', borderRadius: '0 10px 10px 0', boxShadow: '0 0 15px var(--primary)' }}></div>}
                    <span className="material-symbols-outlined" style={{ fontSize: '26px', filter: isActive ? 'drop-shadow(0 0 8px rgba(255,255,255,0.5))' : 'none' }}>{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div style={{ padding: '24px 16px', borderTop: '1.5px solid var(--glass-border)', display: 'grid', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <Link to="/" style={{
              flex: 1, display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px',
              color: 'var(--ink)', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '18px',
              fontWeight: 800, textDecoration: 'none', fontSize: '0.95rem', transition: 'all 0.4s'
            }}>
              <span className="material-symbols-outlined">home</span>
              Trang chủ
            </Link>
            <ThemeToggle />
          </div>
          <button data-ai-id="button-sidebarkhachhang-vked" onClick={handleLogout} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px',
            color: 'white', background: 'rgba(255, 77, 77, 0.8)', border: 'none', borderRadius: '18px',
            fontWeight: 900, cursor: 'pointer', fontSize: '0.95rem', transition: 'all 0.4s',
            boxShadow: '0 8px 20px rgba(255, 77, 77, 0.2)'
          }}>
            <span className="material-symbols-outlined">logout</span>
            Đăng xuất
          </button>
        </div>
      </aside>

      <nav className="customer-mobile-tabbar" aria-label="Điều hướng khách hàng nhanh">
        {mobileNavItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileOpen(false)}
              className={`customer-mobile-tab ${isActive ? 'active' : ''}`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  )
}

export default React.memo(SidebarKhachHang)
