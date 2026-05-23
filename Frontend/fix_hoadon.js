const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/pages/customer/HoaDonThanhToan.tsx');
let content = fs.readFileSync(file, 'utf8');

const targetStr = `      const res = await axiosInstance.post('/api/payment/vietqr/generate', {
        id_hoa_don: getInvoiceId(hd),
        amount
            {searchTerm && (
              <span
                className="material-symbols-outlined"`;

const replacementStr = `      const res = await axiosInstance.post('/api/payment/vietqr/generate', {
        id_hoa_don: getInvoiceId(hd),
        amount
      });
      if (res.data && res.data.qr_url) {
        setQrData({ url: res.data.qr_url, info: res.data.add_info, amount });
        setShowQRModal(true);
      }
    } catch (error) {
      toast.error("Không thể tạo mã VietQR lúc này.");
    }
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><div className="dot-pulse"></div></div>;

  return (
    <div className="animate-fade-in">
      <style>{\`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .stagger-1 { animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both; }
        .stagger-2 { animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both; }
        .stagger-3 { animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both; }
        .hover-lift { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: default; }
        .hover-lift:hover { transform: translateY(-6px); box-shadow: 0 20px 40px rgba(0,0,0,0.06); }
        .item-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); border: 1px solid transparent; background: var(--surface); }
        .item-card:hover { border-color: var(--primary) !important; background: var(--surface) !important; transform: translateY(-4px) scale(1.01); box-shadow: 0 20px 40px rgba(15, 157, 138, 0.08); z-index: 10; position: relative; }
        .stat-card-group:hover .stat-tooltip { opacity: 1; max-height: 40px; margin-top: 12px; }
        .stat-tooltip { opacity: 0; max-height: 0; overflow: hidden; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); font-size: 0.75rem; color: var(--gray-400); line-height: 1.4; }
        @media print {
          body * { visibility: hidden; }
          #print-section, #print-section * { visibility: visible; }
          #print-section { position: absolute; left: 0; top: 0; width: 100%; }
        }
      \`}</style>
      <div className="stagger-1" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', padding: '36px 48px', borderRadius: 'var(--radius-xl)', background: 'var(--secondary-gradient)', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 15px 30px rgba(225, 29, 72, 0.2)', flexWrap: 'wrap', gap: '20px' }}>
        <div style={{ position: 'absolute', top: '-50px', right: '10%', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 950, letterSpacing: '-1px', margin: '0 0 8px 0' }}>Hóa đơn & Thanh toán 💳</h1>
          <p style={{ fontWeight: 600, opacity: 0.9, margin: 0, fontSize: '1.05rem' }}>Quản lý chi tiêu và lịch sử giao dịch dịch vụ thú y.</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input data-ai-id="input-hoadonthanhtoan-z5a1"
              type="text"
              className="btn"
              placeholder="Tìm HĐ, tên khách, thú cưng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ background: 'white', border: 'none', color: '#e11d48', fontWeight: 700, padding: '10px 36px 10px 16px', outline: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}
            />
            {searchTerm && (
              <span
                className="material-symbols-outlined"`;

content = content.replace(targetStr, replacementStr);
fs.writeFileSync(file, content, 'utf8');
console.log('Fixed');
