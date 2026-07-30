import React, { useMemo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

const SidebarKhachHang: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const user = useMemo(() => {
    const saved = localStorage.getItem("user");
    const u = saved ? JSON.parse(saved) : null;
    if (u && u.displayName && u.displayName.toUpperCase().includes("AI")) {
      u.displayName = "Trần Hoàng Minh";
    }
    return u || { displayName: "Trần Hoàng Minh", ten_vai_tro: "Thành viên" };
  }, [location.pathname]);

  const sidebarItems = useMemo(() => [
    { label: 'Bảng điều khiển', path: '/khach-hang/dashboard', icon: 'dashboard' },
    { label: 'Thú cưng của tôi', path: '/khach-hang/quan-ly-thu-cung', icon: 'pets' },
    { label: 'Đặt lịch khám', path: '/khach-hang/dat-lich-hen', icon: 'calendar_add_on' },
    { label: 'Lịch sử lịch hẹn', path: '/khach-hang/lich-su-lich-hen', icon: 'history' },
    { label: 'Hồ sơ bệnh án', path: '/khach-hang/ho-so-benh-an', icon: 'medical_information' },
    { label: 'Hóa đơn', path: '/khach-hang/hoa-don-thanh-toan', icon: 'receipt' },
    { label: 'Thông tin cá nhân', path: '/khach-hang/thong-tin-ca-nhan', icon: 'person' },
  ], [])

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "/dang-nhap";
  }

  return (
    <aside style={{
      width: '320px',
      background: 'white',
      boxShadow: 'var(--shadow-lg)',
      borderRight: '1px solid var(--gray-100)',
      zIndex: 40,
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0
    }}>
      <div style={{ padding: '32px', borderBottom: '1px solid var(--gray-100)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <div style={{ 
            width: '44px', 
            height: '44px', 
            background: 'var(--teal)', 
            borderRadius: '16px', 
            boxShadow: '0 8px 16px rgba(15, 157, 138, 0.2)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <img src='/img/avtpkty.png' alt='Logo' style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} />
          </div>
          <span style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--ink)', letterSpacing: '-0.5px' }}>Rexi</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            background: 'rgba(15, 157, 138, 0.1)', 
            borderRadius: '16px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <span className='material-symbols-outlined' style={{ color: 'var(--teal)' }}>person</span>
          </div>
          <div>
            <p style={{ fontWeight: '700', color: 'var(--ink)', margin: 0 }}>{user.displayName}</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', margin: 0 }}>{user.ten_vai_tro || "Khách hàng"}</p>
          </div>
        </div>
      </div>

      <nav style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {sidebarItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path)
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '12px 16px',
                    color: isActive ? 'var(--teal)' : 'var(--gray-600)',
                    textDecoration: 'none',
                    background: isActive ? 'rgba(15, 157, 138, 0.1)' : 'transparent',
                    borderRadius: '16px',
                    fontWeight: isActive ? '700' : '500',
                    transition: 'all 0.2s',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div style={{ padding: '24px', borderTop: '1px solid var(--gray-100)', flexShrink: 0 }}>
        <button 
          onClick={handleLogout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '12px 16px',
            color: '#ef4444',
            background: 'transparent',
            border: 'none',
            borderRadius: '16px',
            fontWeight: '700',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#fef2f2'}
          onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
        >
          <span className="material-symbols-outlined">logout</span>
          <span>Đăng xuất</span>
        </button>
      </div>
    </aside>
  )
}

export default React.memo(SidebarKhachHang)

