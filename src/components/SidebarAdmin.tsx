import React, { useMemo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

const SidebarAdmin: React.FC = () => {
  const location = useLocation()
  const navigate = useNavigate()

  const user = useMemo(() => {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : { displayName: "Admin", loai_tai_khoan: "admin" };
  }, [location.pathname]);

  const sidebarItems = useMemo(() => {
    const allItems = [
      { label: 'Tổng quan', path: '/quan-ly/dashboard', icon: 'dashboard', roles: ['admin', 'bac_si', 'staff'] },
      { label: 'Quản lý Lịch hẹn', path: '/quan-ly/lich-hen', icon: 'calendar_month', roles: ['admin', 'staff', 'bac_si'] },
      { label: 'Khách hàng & Thú cưng', path: '/quan-ly/khach-hang-thu-cung', icon: 'groups', roles: ['admin', 'staff'] },
      { label: 'Khám & Bệnh án', path: '/quan-ly/ho-so-benh-an', icon: 'clinical_notes', roles: ['admin', 'bac_si'] },
      { label: 'Xét nghiệm', path: '/quan-ly/xet-nghiem', icon: 'biotech', roles: ['admin', 'bac_si'] },
      { label: 'Hóa đơn & Thu ngân', path: '/quan-ly/hoa-don', icon: 'receipt_long', roles: ['admin', 'staff'] },
      { label: 'Kho thuốc & Vật tư', path: '/quan-ly/kho-thuoc', icon: 'medication', roles: ['admin', 'staff'] },
      { label: 'Nhập kho', path: '/quan-ly/nhap-kho', icon: 'input', roles: ['admin', 'staff'] },
      { label: 'Nhân sự & Phân quyền', path: '/quan-ly/nhan-vien-phan-quyen', icon: 'manage_accounts', roles: ['admin'] },
      { label: 'Báo cáo & Thống kê', path: '/quan-ly/bao-cao-thong-ke', icon: 'query_stats', roles: ['admin'] },
      { label: 'Thông tin cá nhân', path: '/khach-hang/thong-tin-ca-nhan', icon: 'account_circle', roles: ['admin', 'staff', 'bac_si'] },
    ];
    return allItems.filter(item => item.roles.includes(user.loai_tai_khoan));
  }, [user.loai_tai_khoan])

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    window.location.href = "/dang-nhap";
  }

  const roleName = useMemo(() => {
    if (user.loai_tai_khoan === 'admin') return 'Quản trị viên';
    if (user.loai_tai_khoan === 'bac_si') return 'Bác sĩ thú y';
    if (user.loai_tai_khoan === 'staff') return 'Nhân viên lễ tân';
    return user.ten_vai_tro || 'Người dùng hệ thống';
  }, [user.loai_tai_khoan, user.ten_vai_tro]);

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
          <span style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--ink)', letterSpacing: '-0.5px' }}>Rexi Admin</span>
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
            <span className='material-symbols-outlined' style={{ color: 'var(--teal)' }}>
              {user.role === 'admin' ? 'admin_panel_settings' : user.role === 'doctor' ? 'medical_services' : 'person'}
            </span>
          </div>
          <div>
            <p style={{ fontWeight: '700', color: 'var(--ink)', margin: 0 }}>{user.displayName}</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--gray-500)', margin: 0 }}>{roleName}</p>
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

export default React.memo(SidebarAdmin)

