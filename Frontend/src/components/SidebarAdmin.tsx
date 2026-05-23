import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getUserProfile, normalizeUserRole } from "@utils/index";
import { ADMIN_ROUTE_ROLES } from "@utils/permissions";

import ThemeToggle from './ThemeToggle';

const SidebarAdmin: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [isMobileOpen, setIsMobileOpen] = useState(false);



  const user = getUserProfile() || {};

  const userRole = normalizeUserRole(user);

  const allMenuItems = [
    { isHeader: true, label: 'TỔNG QUAN', roles: ['admin', 'staff', 'bac_si', 'quan_ly', 'tiep_tan', 'y_ta', 'ke_toan'] },
    { path: '/quan-ly/dashboard', icon: 'dashboard', label: 'Bảng điều khiển', roles: ['admin', 'staff', 'bac_si', 'quan_ly', 'tiep_tan', 'y_ta', 'ke_toan'] },
    { path: '/quan-ly/bao-cao-thong-ke', icon: 'monitoring', label: 'Báo cáo & Thống kê', roles: ['admin', 'quan_ly', 'ke_toan'] },

    { isHeader: true, label: 'LỊCH TRÌNH & NHÂN SỰ', roles: ['admin', 'quan_ly', 'staff', 'bac_si', 'tiep_tan', 'y_ta'] },
    { path: '/quan-ly/lich-hen', icon: 'calendar_month', label: 'Quản lý lịch hẹn', roles: ['admin', 'staff', 'bac_si', 'quan_ly', 'tiep_tan', 'y_ta'] },
    { 
      path: '/quan-ly/lich-lam-viec', 
      icon: 'edit_calendar', 
      label: (userRole === 'admin' || userRole === 'quan_ly') ? 'Điều hành nhân sự' : 'Lịch trực của tôi', 
      roles: ['admin', 'staff', 'bac_si', 'quan_ly', 'tiep_tan', 'y_ta', 'ke_toan'] 
    },
    { path: '/quan-ly/nhan-vien-phan-quyen', icon: 'badge', label: 'Nhân sự & Quyền hạn', roles: ['admin', 'quan_ly'] },

    { isHeader: true, label: 'KHÁCH HÀNG & DỊCH VỤ', roles: ['admin', 'quan_ly', 'tiep_tan', 'bac_si', 'y_ta'] },
    { path: '/quan-ly/khach-hang-thu-cung', icon: 'groups', label: 'Khách hàng & Thú cưng', roles: ['admin', 'quan_ly', 'tiep_tan', 'bac_si', 'y_ta'] },
    { path: '/quan-ly/dich-vu', icon: 'medical_information', label: 'Danh mục dịch vụ', roles: ['admin', 'quan_ly', 'tiep_tan'] },

    { isHeader: true, label: 'CHUYÊN MÔN LÂM SÀNG', roles: ['admin', 'bac_si', 'quan_ly', 'y_ta'] },
    { path: '/quan-ly/kham-benh', icon: 'stethoscope', label: 'Khám bệnh & Kê đơn', roles: ['admin', 'bac_si'] },
    { path: '/quan-ly/ho-so-benh-an', icon: 'clinical_notes', label: 'Hồ sơ bệnh án', roles: ['admin', 'bac_si', 'quan_ly', 'y_ta'] },
    { path: '/quan-ly/don-thuoc', icon: 'description', label: 'Kê đơn & Thuốc', roles: ['admin', 'bac_si'] },    
    { path: '/quan-ly/xet-nghiem', icon: 'biotech', label: 'Xét nghiệm & Cận lâm sàng', roles: ['admin', 'bac_si', 'y_ta'] },

    { isHeader: true, label: 'KHO & TÀI CHÍNH', roles: ['admin', 'quan_ly', 'ke_toan', 'tiep_tan'] },
    { path: '/quan-ly/kho-thuoc', icon: 'medication', label: 'Danh mục kho thuốc', roles: ['admin', 'quan_ly', 'ke_toan', 'bac_si', 'y_ta', 'tiep_tan'] },
    { path: '/quan-ly/nhap-kho', icon: 'inventory_2', label: 'Nhập kho & Kiểm kê', roles: ['admin', 'quan_ly', 'ke_toan'] },
    { path: '/quan-ly/hoa-don', icon: 'receipt_long', label: 'Hóa đơn & Thanh toán', roles: ['admin', 'quan_ly', 'ke_toan', 'tiep_tan'] },
    { path: '/quan-ly/ke-toan', icon: 'account_balance', label: 'Tài chính - Kế toán', roles: ['admin', 'quan_ly', 'ke_toan'] },

    { isHeader: true, label: 'TIỆN ÍCH & MARKETING', roles: ['admin', 'quan_ly', 'tiep_tan', 'bac_si', 'y_ta'] },
    { path: '/quan-ly/marketing', icon: 'campaign', label: 'Chiến dịch Marketing', roles: ['admin', 'quan_ly'] },
    { path: '/quan-ly/file-dinh-kem', icon: 'folder_open', label: 'Quản lý tệp tin', roles: ['admin', 'quan_ly', 'bac_si', 'y_ta'] },

    { isHeader: true, label: 'CẤU HÌNH', roles: ['admin', 'staff', 'bac_si', 'quan_ly', 'tiep_tan', 'y_ta', 'ke_toan'] },
    { path: '/quan-ly/cau-hinh', icon: 'settings', label: 'Cài đặt chung', roles: ['admin'] },
    { path: '/quan-ly/chuc-nang', icon: 'extension', label: 'Phân hệ chức năng', roles: ['admin'] },
    { path: '/quan-ly/thong-tin-ca-nhan', icon: 'person', label: 'Hồ sơ cá nhân', roles: ['admin', 'staff', 'bac_si', 'quan_ly', 'tiep_tan', 'y_ta', 'ke_toan'] },
  ];

  // Chỉ lấy những mục mà user có quyền truy cập
  const menuItems = allMenuItems.filter(item => {
    const routeRoles = item.path ? ADMIN_ROUTE_ROLES[item.path] : undefined;
    return (routeRoles || item.roles).includes(userRole);
  });
  
  // Loại bỏ các header liên tiếp hoặc header ở cuối (do các menu con bên trong bị ẩn)
  const filteredMenuItems = menuItems.filter((item, index, array) => {
    if (item.isHeader) {
      // Nếu là phần tử cuối cùng thì ẩn
      if (index === array.length - 1) return false;
      // Nếu phần tử tiếp theo cũng là header thì ẩn
      if (array[index + 1].isHeader) return false;
    }
    return true;
  });

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate('/');
    window.location.reload();
  };

  // Hàm xóa số thứ tự ở đầu tên (Ví dụ: "1. Nguyễn Văn A" -> "Nguyễn Văn A")
  const cleanName = (name: string) => {
    if (!name) return '';
    const cleaned = name.replace(/^\d+\.\s*/, '').trim();
    return cleaned.toLowerCase() === 'admin' ? 'Quản trị viên' : cleaned;
  };
  const userDisplayName = cleanName(user.display_name || user.displayName || user.ho_ten || user.hoTen || user.fullName || user.ten_khach_hang || user.ten_dang_nhap || user.username || 'Người dùng Rexi');
  const userAvatar = user.hinh_anh || user.avatar || "";
  const userInitial = userDisplayName.charAt(0).toUpperCase() || "A";

  return (
    <>
      {/* Nút Hamburger nổi trên mobile */}
      <button data-ai-id="button-sidebaradmin-mobile"
        className="mobile-show"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        style={{
          position: 'fixed', bottom: '24px', left: '24px', zIndex: 1001,
          background: 'var(--primary)', color: 'white', border: 'none',
          width: '56px', height: '56px', borderRadius: '50%',
          boxShadow: '0 4px 15px rgba(15, 157, 138, 0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>{isMobileOpen ? 'close' : 'menu'}</span>
      </button>

      {/* Lớp phủ mờ khi mở menu trên mobile */}
      {isMobileOpen && (
        <div
          className="mobile-show"
          onClick={() => setIsMobileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, backdropFilter: 'blur(4px)' }}
        />
      )}

      <div className={`glass-card sidebar ${isMobileOpen ? 'active' : ''}`} style={{
        width: isMobileOpen ? '280px' : 'var(--sidebar-width)',
        height: 'calc(100vh - 40px)',
        margin: '20px',
        borderRadius: 'var(--radius-lg)',
        display: 'flex',
        flexDirection: 'column',
        padding: '30px 20px',
        position: 'sticky',
        top: '20px',
        zIndex: 1000
      }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px', padding: '0 10px' }}>
        <div style={{ width: '42px', height: '42px', borderRadius: '12px', overflow: 'hidden', background: 'var(--primary-gradient)', border: '2px solid rgba(255,255,255,0.2)', boxShadow: '0 0 20px var(--primary-shadow)' }}>
          <img src="/img/avtpkty.png" alt="Rexi" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px', filter: 'brightness(0) invert(1)' }} />
        </div>
        <div>
          <h2 className="text-gradient" style={{ fontSize: '1.4rem', margin: 0, letterSpacing: '-1.5px', fontWeight: 950, color: 'var(--primary)' }}>REXI ADMIN</h2>
          <p style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--primary)', margin: 0, letterSpacing: '2px', textTransform: 'uppercase', opacity: 0.8 }}>HỆ THỐNG QUẢN TRỊ</p>
        </div>
      </div>

      <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '20px', marginBottom: '30px', border: '1px solid var(--glass-border)' }}>
        <div style={{ width: '50px', height: '50px', borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0, position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid var(--primary)', boxShadow: '0 0 15px var(--primary), inset 0 0 15px var(--primary)', animation: 'pulse 2s infinite' }} />
          <div style={{ width: '42px', height: '42px', borderRadius: '50%', overflow: 'hidden', background: 'rgba(20, 184, 166, 0.1)', display: 'grid', placeItems: 'center', color: 'var(--primary)', fontWeight: 950, fontSize: '1.15rem', position: 'relative', zIndex: 1, textShadow: '0 0 10px var(--primary)' }}>
            {userAvatar ? (
              <img src={userAvatar} alt={userDisplayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span>{userInitial}</span>
            )}
          </div>
        </div>
        <div style={{ overflow: 'hidden', flex: 1 }}>
          <p style={{ fontWeight: 950, fontSize: '1rem', color: 'var(--ink)', margin: 0, whiteSpace: 'nowrap', textOverflow: 'ellipsis', letterSpacing: '-0.5px' }}>
            {userDisplayName}
          </p>
          <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)', margin: '2px 0 0 0', textTransform: 'uppercase', letterSpacing: '1px' }}>
            {
              userRole === 'bac_si' ? 'Bác sĩ chuyên khoa' :
                userRole === 'admin' ? 'Quản trị tối cao' :
                  userRole === 'quan_ly' ? 'Quản lý điều hành' :
                    userRole === 'tiep_tan' ? 'Tiếp tân chuyên nghiệp' :
                      userRole === 'ke_toan' ? 'Kế toán viên' :
                        userRole === 'y_ta' ? 'Điều dưỡng viên' : 'Nhân viên hệ thống'
            }
          </p>
        </div>
      </div>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
        {filteredMenuItems.map((item, index) => {
          if (item.isHeader) {
            return (
              <div key={`header-${index}`} style={{ marginTop: index === 0 ? '0' : '16px', marginBottom: '4px', padding: '0 12px' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--gray-400)', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  {item.label}
                </span>
              </div>
            );
          }

          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path || '#'}
              onClick={() => setIsMobileOpen(false)}
              className="sidebar-link"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 18px',
                borderRadius: '16px',
                textDecoration: 'none',
                color: isActive ? 'white' : 'var(--gray-500)',
                background: isActive ? 'var(--primary-gradient)' : 'transparent',
                fontWeight: isActive ? 900 : 600,
                fontSize: '0.9rem',
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: isActive ? '0 8px 20px -5px var(--primary-shadow)' : 'none',
                border: isActive ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent',
                position: 'relative'
              }}
            >
              {isActive && <div style={{ position: 'absolute', left: '-12px', width: '4px', height: '24px', background: 'var(--primary)', borderRadius: '0 10px 10px 0', boxShadow: '0 0 10px var(--primary)' }}></div>}
              <span className="material-symbols-outlined" style={{ fontSize: '22px', filter: isActive ? 'drop-shadow(0 0 5px rgba(255,255,255,0.4))' : 'none' }}>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div style={{ marginTop: '20px', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <Link
          to="/"
          className="sidebar-link"
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '12px',
            textDecoration: 'none',
            color: 'var(--gray-500)',
            fontWeight: 700,
            fontSize: '0.9rem',
            border: '1px solid var(--gray-200)'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>home</span>
          Về trang chủ
        </Link>
        <ThemeToggle />
      </div>

      <button data-ai-id="button-sidebaradmin-yuhf"
        onClick={handleLogout}
        className="btn"
        style={{
          marginTop: '8px',
          background: 'rgba(239, 68, 68, 0.1)',
          color: '#ef4444',
          width: '100%',
          justifyContent: 'flex-start',
          padding: '14px 18px',
          borderRadius: '16px',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          fontWeight: 800,
          transition: 'all 0.3s'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = 'white'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; e.currentTarget.style.color = '#ef4444'; }}
      >
        <span className="material-symbols-outlined">logout</span>
        Đăng xuất
      </button>
    </div>
    </>
  );
};

export default React.memo(SidebarAdmin);
