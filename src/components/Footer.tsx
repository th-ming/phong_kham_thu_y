import React from 'react'


const Footer: React.FC = () => {
  return (
    <footer style={{
      background: '#f8fafb',
      borderTop: '1px solid #dde3e8',
      padding: '40px 32px',
      marginTop: '60px',
      textAlign: 'center',
      fontSize: '0.875rem',
      color: '#5a6470'
    }}>
      <p>© 2026 Phòng Khám Thú Y Rexi. Tất cả quyền được bảo lưu.</p>
      <p>Địa chỉ: Số 68, Ngõ 10, Đường Ngô Xuân Quảng, Trâu Quỳ, Hà Nội | Hotline: 024.1234.5678 | Email: contact@rexi.vn</p>
    </footer>
  )
}

export default React.memo(Footer)
