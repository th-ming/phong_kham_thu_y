import React from 'react'

/**
 * Component Footer
 */
const Footer: React.FC = () => {
  return (
    <footer style={{
      background: 'var(--surface)',
      borderTop: '1px solid var(--gray-200)',
      padding: '40px 32px',
      marginTop: '60px',
      textAlign: 'center',
      fontSize: '0.875rem',
      color: 'var(--gray-500)'
    }}>
      <p>© 2026 Phòng Khám Thú Y Rexi. Tất cả quyền được bảo lưu.</p>
      {/* ========================================================================= */}
      {/* ĐÂY LÀ SỐ HOTLINE Ở CHÂN TRANG (FOOTER) CHUNG                             */}
      {/* ========================================================================= */}
      <p>Địa chỉ: 123 Đường ABC, TP. HN | Hotline: 09818 JQKA2 | Email: support@rexi.com</p>
    </footer>
  );
}

export default React.memo(Footer)
