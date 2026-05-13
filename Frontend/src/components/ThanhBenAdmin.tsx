import React, { useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getUserProfile } from '../utils/index';

import ChuyenCheDoMau from './ChuyenCheDoMau';

const ThanhBenAdmin: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();



  const user = useMemo(() => {
    try {
      const u = getUserProfile();
      return u || {};
    } catch (e) {
      return {};
    }
  }, []);

  // Ưu tiên dùng loai_tai_khoan vì đây là mã hệ thống chuẩn từ DB
  let userRole = 'staff';
  try {
    const rawRole = (user?.loai_tai_khoan || user?.ten_vai_tro || 'staff').toLowerCase();
    userRole = rawRole;

    // Chuẩn hóa nếu có tiếng Việt hoặc mã hệ thống
    if (userRole.includes('quản trị') || userRole.includes('admin')) userRole = 'admin';
    else if (userRole.includes('kế toán') || userRole.includes('ke_toan')) userRole = 'ke_toan';
    else if (userRole.includes('bác sĩ') || userRole.includes('bac_si')) userRole = 'bac_si';
    else if (userRole.includes('quản lý') || userRole.includes('quan_ly')) userRole = 'quan_ly';
    else if (userRole.includes('tiếp tân') || userRole.includes('tiep_tan')) userRole = 'tiep_tan';
    else if (userRole.includes('y tá') || userRole.includes('điều dưỡng') || userRole.includes('y_ta')) userRole = 'y_ta';
    else if (userRole.includes('nhân viên') || userRole.includes('staff')) userRole = 'staff';
  } catch (e) {
    userRole = 'staff';
  }

  const allMenuItems = [
    { path: '/quan-ly/dashboard', icon: 'dashboard', label: 'Tổng quan', roles: ['admin', 'staff', 'bac_si', 'quan_ly', 'tiep_tan', 'y_ta', 'ke_toan'] },
    { path: '/quan-ly/lich-hen', icon: 'calendar_month', label: 'Lịch hẹn', roles: ['admin', 'staff', 'bac_si', 'quan_ly', 'tiep_tan', 'y_ta'] },
    { path: '/quan-ly/lich-lam-viec', icon: 'edit_calendar', label: 'Lịch làm việc nhân sự', roles: ['admin', 'staff', 'bac_si', 'quan_ly', 'tiep_tan', 'y_ta', 'ke_toan'] },
    { path: '/quan-ly/nhan-vien-phan-quyen', icon: 'badge', label: 'Nhân sự & Phân quyền', roles: ['admin'] },
    { path: '/quan-ly/khach-hang-thu-cung', icon: 'groups', label: 'Khách hàng', roles: ['admin', 'staff', 'bac_si', 'quan_ly', 'tiep_tan', 'y_ta'] },
    { path: '/quan-ly/khach-hang-thu-cung', icon: 'pets', label: 'Thú cưng', roles: ['admin', 'staff', 'bac_si', 'quan_ly', 'tiep_tan', 'y_ta'] },
    { path: '/quan-ly/dich-vu', icon: 'medical_information', label: 'Dịch vụ', roles: ['admin', 'quan_ly', 'staff', 'tiep_tan', 'y_ta'] },
    { path: '/quan-ly/kho-thuoc', icon: 'medication', label: 'Kho thuốc', roles: ['admin', 'staff', 'bac_si', 'quan_ly', 'y_ta', 'ke_toan'] },
    { path: '/quan-ly/ho-so-benh-an', icon: 'clinical_notes', label: 'Bệnh án', roles: ['admin', 'bac_si', 'quan_ly', 'y_ta'] },
    { path: '/quan-ly/don-thuoc', icon: 'description', label: 'Đơn thuốc', roles: ['admin', 'bac_si', 'quan_ly', 'y_ta'] },
    { path: '/quan-ly/xet-nghiem', icon: 'biotech', label: 'Xét nghiệm', roles: ['admin', 'bac_si', 'quan_ly', 'y_ta'] },
    { path: '/quan-ly/hoa-don', icon: 'receipt_long', label: 'Hóa đơn', roles: ['admin', 'quan_ly', 'ke_toan', 'tiep_tan'] },
    { path: '/quan-ly/ke-toan', icon: 'account_balance', label: 'Tài chính - Kế toán', roles: ['admin', 'quan_ly', 'ke_toan'] },
    { path: '/quan-ly/bao-cao-thong-ke', icon: 'monitoring', label: 'Thống kê', roles: ['admin', 'quan_ly', 'ke_toan'] },
    { path: '/quan-ly/marketing', icon: 'campaign', label: 'Marketing', roles: ['admin', 'quan_ly', 'tiep_tan'] },
    { path: '/quan-ly/file-dinh-kem', icon: 'folder_open', label: 'Tệp đính kèm', roles: ['admin', 'quan_ly', 'bac_si', 'y_ta'] },
    { path: '/quan-ly/cau-hinh', icon: 'settings', label: 'Cấu hình hệ thống', roles: ['admin'] },
    { path: '/quan-ly/chuc-nang', icon: 'extension', label: 'Phân hệ chức năng', roles: ['admin'] },
    { path: '/quan-ly/thong-tin-ca-nhan', icon: 'account_circle', label: 'Thông tin cá nhân', roles: ['admin', 'staff', 'bac_si', 'quan_ly', 'tiep_tan', 'y_ta', 'ke_toan'] },
  ];

  const menuItems = allMenuItems.filter(item => item.roles.some(role => userRole.includes(role)));

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate('/');
    window.location.reload();
  };

  // Hàm xóa số thứ tự ở đầu tên (Ví dụ: "1. Nguyễn Văn A" -> "Nguyễn Văn A")
  const cleanName = (name: string) => name ? name.replace(/^\d+\.\s*/, '').trim() : '';

  return (
    <div className="glass-card" style={{
      width: 'var(--sidebar-width)',
      height: 'calc(100vh - 40px)',
      margin: '20px',
      borderRadius: 'var(--radius-lg)',
      display: 'flex',
      flexDirection: 'column',
      padding: '30px 20px',
      position: 'sticky',
      top: '20px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px', padding: '0 10px' }}>
        <div style={{ width: '42px', height: '42px', borderRadius: '12px', overflow: 'hidden', background: 'var(--primary-gradient)', border: '2px solid rgba(255,255,255,0.2)', boxShadow: '0 0 20px var(--primary-shadow)' }}>
          <img src="/img/avtpkty.png" alt="Rexi" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '6px' }} />
        </div>
        <div>
          <h2 className="text-gradient" style={{ fontSize: '1.4rem', margin: 0, letterSpacing: '-1.5px', fontWeight: 950 }}>REXI ADMIN</h2>
          <p style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--primary)', margin: 0, letterSpacing: '2px', textTransform: 'uppercase', opacity: 0.8 }}>HỆ THỐNG QUẢN TRỊ</p>
        </div>
      </div>

      <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '20px', marginBottom: '30px', border: '1px solid var(--glass-border)' }}>
        <div style={{ background: 'var(--primary-gradient)', color: 'white', width: '42px', height: '42px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 5px 15px var(--primary-shadow)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>
            {
              userRole.includes('bac_si') ? 'medical_services' :
                userRole.includes('admin') ? 'shield_person' :
                  userRole.includes('quan_ly') ? 'manage_accounts' :
                    userRole.includes('tiep_tan') ? 'concierge' :
                      userRole.includes('ke_toan') ? 'account_balance' :
                        userRole.includes('y_ta') ? 'health_and_safety' : 'badge'
            }
          </span>
        </div>
        <div style={{ overflow: 'hidden' }}>
          <p style={{ fontWeight: 900, fontSize: '0.9rem', color: 'var(--ink)', margin: 0, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{cleanName(user.ho_ten || user.display_name || 'Nhân viên')}</p>
          <p style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--primary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {
              userRole.includes('bac_si') ? 'Bác sĩ chuyên khoa' :
                userRole.includes('admin') ? 'Quản trị tối cao' :
                  userRole.includes('quan_ly') ? 'Quản lý điều hành' :
                    userRole.includes('tiep_tan') ? 'Tiếp tân chuyên nghiệp' :
                      userRole.includes('ke_toan') ? 'Kế toán viên' :
                        userRole.includes('y_ta') ? 'Điều dưỡng viên' : 'Nhân viên hệ thống'
            }
          </p>
        </div>
      </div>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
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
          Về trang chủ
        </Link>
        <ChuyenCheDoMau />
      </div>

      <button
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
  );
};

export default React.memo(ThanhBenAdmin);
