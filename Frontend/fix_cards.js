const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/pages/customer/HoaDonThanhToan.tsx');
let content = fs.readFileSync(file, 'utf8');

const targetRegex = /<div className="stagger-2" style={{ display: 'grid', gridTemplateColumns: 'repeat\(auto-fit, minmax\(240px, 1fr\)\)', gap: '24px', marginBottom: '40px' }}>[\s\S]*?<\/div>\s*<\/div>\s*<div className="stagger-3"/;

const replacement = `<div className="stagger-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px' }}>
        <div className="glass-card hover-lift stat-card-group" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(15, 23, 42, 0.6) 100%)', border: '1px solid rgba(59, 130, 246, 0.2)', cursor: 'default' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '8px' }}>TỔNG HÓA ĐƠN</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#38bdf8' }}>{stats.total}</h3>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
              <span className="material-symbols-outlined">receipt_long</span>
            </div>
          </div>
          <div className="stat-tooltip">
            Tổng số lượng hóa đơn đã phát sinh từ trước đến nay.
          </div>
        </div>
        <div className="glass-card hover-lift stat-card-group" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(15, 23, 42, 0.6) 100%)', border: '1px solid rgba(16, 185, 129, 0.2)', cursor: 'default' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--success)', marginBottom: '8px' }}>ĐÃ THANH TOÁN</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#34d399' }}>{stats.paidCount}</h3>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
              <span className="material-symbols-outlined">check_circle</span>
            </div>
          </div>
          <div className="stat-tooltip">
            Số lượng hóa đơn bạn đã hoàn tất thanh toán.
          </div>
        </div>
        <div className="glass-card hover-lift stat-card-group" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(15, 23, 42, 0.6) 100%)', border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'default' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--danger)', marginBottom: '8px' }}>ĐANG CHỜ</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f87171' }}>{stats.unpaidCount}</h3>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}>
              <span className="material-symbols-outlined">pending_actions</span>
            </div>
          </div>
          <div className="stat-tooltip">
            Số lượng hóa đơn chưa được thanh toán (đang chờ xử lý).
          </div>
        </div>
        <div className="glass-card hover-lift stat-card-group" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.2) 0%, rgba(15, 23, 42, 0.8) 100%)', border: '1px solid rgba(20, 184, 166, 0.4)', color: 'white', cursor: 'default' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ fontSize: '0.75rem', fontWeight: 800, color: '#5eead4', marginBottom: '8px' }}>TỔNG CHI TIÊU</p>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ccfbf1', textShadow: '0 0 10px rgba(45, 212, 191, 0.5)' }}>{formatTienVND(stats.totalPaid)}</h3>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(20, 184, 166, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccfbf1' }}>
              <span className="material-symbols-outlined">payments</span>
            </div>
          </div>
          <div className="stat-tooltip">
            Tổng số tiền bạn đã thanh toán thành công.
          </div>
        </div>
      </div>

      <div className="stagger-3"`;

content = content.replace(targetRegex, replacement);
fs.writeFileSync(file, content, 'utf8');
console.log("Done");
