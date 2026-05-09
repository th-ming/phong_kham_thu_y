import React, { useState, useEffect } from "react";
import axiosInstance from "@services/axios";
import { Modal } from "@components/CommonUI";

const QuanLyDonThuoc: React.FC = () => {
  const [donThuocs, setDonThuocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingDT, setViewingDT] = useState<any>(null);

  useEffect(() => {
    axiosInstance.get("/api/ho-so-benh-an/don-thuoc")
      .then(res => {
        setDonThuocs(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi lấy danh sách đơn thuốc:", err);
        setLoading(false);
      });
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div className="dot-pulse"></div>
    </div>
  );

  return (
    <div className="animate-fade-in">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-prescription, #print-prescription * { visibility: visible; }
          #print-prescription { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>

      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-1px' }}>Quản lý Đơn thuốc</h1>
        <p style={{ color: 'var(--gray-500)', fontWeight: 600 }}>Theo dõi lịch sử cấp phát thuốc và hướng dẫn điều trị tại nhà.</p>
      </div>

      <div className="glass-card" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--gray-50)', textAlign: 'left' }}>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>MÃ ĐƠN</th>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>BỆNH NHÂN</th>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>DƯỢC PHẨM</th>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800, textAlign: 'right' }}>SỐ LƯỢNG</th>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>LIỀU DÙNG</th>
              <th style={{ padding: '20px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800, textAlign: 'center' }}>XEM</th>
            </tr>
          </thead>
          <tbody>
            {donThuocs.map((dt) => (
              <tr key={dt.id_don_thuoc} style={{ borderBottom: '1px solid var(--gray-50)', transition: 'all 0.2s' }}>
                <td style={{ padding: '20px', fontWeight: 800, color: 'var(--gray-400)' }}>#DT-{dt.id_don_thuoc}</td>
                <td style={{ padding: '20px' }}>
                  <div style={{ fontWeight: 800, color: 'var(--ink)' }}>{dt.ten_thu_cung || "—"}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 600 }}>Hồ sơ: #HS-{dt.id_ho_so_benh_an}</div>
                </td>
                <td style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '32px', height: '32px', background: 'var(--primary-light)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>medication</span>
                    </div>
                    <span style={{ fontWeight: 800, color: 'var(--ink)' }}>{dt.ten_thuoc}</span>
                  </div>
                </td>
                <td style={{ padding: '20px', textAlign: 'right', fontWeight: 900, color: 'var(--ink)' }}>{dt.so_luong}</td>
                <td style={{ padding: '20px' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', maxWidth: '250px' }}>{dt.cach_dung}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontStyle: 'italic' }}>{dt.ghi_chu}</div>
                </td>
                <td style={{ padding: '20px', textAlign: 'center' }}>
                  <button className="btn" onClick={() => setViewingDT(dt)} style={{ padding: '8px', background: 'var(--gray-50)', color: 'var(--ink)' }}>
                    <span className="material-symbols-outlined">description</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL CHI TIẾT ĐƠN THUỐC */}
      <Modal isOpen={!!viewingDT} onClose={() => setViewingDT(null)} title="Chi tiết Đơn thuốc" maxWidth="600px">
        {viewingDT && (
          <div id="print-prescription">
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', borderBottom: '2px solid var(--secondary)', paddingBottom: '16px' }}>
                <div>
                   <div style={{ fontWeight: 950, fontSize: '1.4rem', color: 'var(--ink)' }}>REXIPHARM - ĐƠN THUỐC</div>
                   <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)', fontWeight: 600 }}>Hệ thống phòng khám thú y Rexi</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                   <div style={{ fontSize: '1.1rem', fontWeight: 900, color: 'var(--ink)' }}>Mã đơn: #DT-{viewingDT.id_don_thuoc}</div>
                   <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 700 }}>HSBA: #HS-{viewingDT.id_ho_so_benh_an}</div>
                </div>
             </div>

             <div style={{ background: 'var(--surface)', border: '1px solid var(--gray-200)', padding: '20px', borderRadius: '20px', marginBottom: '32px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                   <div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--gray-400)', letterSpacing: '1px', marginBottom: '4px' }}>BỆNH NHÂN</div>
                      <div style={{ fontWeight: 900, color: 'var(--ink)' }}>{viewingDT.ten_thu_cung || 'N/A'}</div>
                   </div>
                   <div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--gray-400)', letterSpacing: '1px', marginBottom: '4px' }}>CHỦ NUÔI</div>
                      <div style={{ fontWeight: 900, color: 'var(--ink)' }}>{viewingDT.ten_khach_hang || 'N/A'}</div>
                   </div>
                </div>
             </div>

             <div style={{ marginBottom: '32px' }}>
                <h4 style={{ margin: '0 0 16px 0', fontSize: '1rem', fontWeight: 900, color: 'var(--ink)', borderLeft: '4px solid var(--primary)', paddingLeft: '12px' }}>Chỉ định thuốc</h4>
                <div style={{ padding: '20px', border: '1px solid var(--gray-200)', borderRadius: '16px', background: 'var(--surface)' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                      <span style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--ink)' }}>{viewingDT.ten_thuoc}</span>
                      <span style={{ fontWeight: 800, color: 'var(--ink)' }}>SL: {viewingDT.so_luong}</span>
                   </div>
                   <div style={{ color: 'var(--ink)', fontWeight: 700, fontSize: '0.95rem', marginBottom: '12px' }}>
                      HDSD: {viewingDT.cach_dung}
                   </div>
                   {viewingDT.ghi_chu && (
                     <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)', fontStyle: 'italic', background: 'var(--background)', border: '1px solid var(--gray-100)', padding: '12px', borderRadius: '12px' }}>
                        Ghi chú: {viewingDT.ghi_chu}
                     </div>
                   )}
                </div>
             </div>

             <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}>
                <div style={{ textAlign: 'center' }}>
                   <div style={{ fontSize: '0.8rem', fontWeight: 800, marginBottom: '60px', color: 'var(--ink)' }}>CHỦ VẬT NUÔI</div>
                   <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>(Ký và ghi rõ họ tên)</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                   <div style={{ fontSize: '0.8rem', fontWeight: 800, marginBottom: '60px', color: 'var(--ink)' }}>BÁC SĨ ĐIỀU TRỊ</div>
                   <div style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--ink)' }}>{viewingDT.ten_bac_si || 'BS. Rexi'}</div>
                </div>
             </div>

             <div style={{ marginTop: '40px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }} className="no-print">
               <button className="btn btn-pill" onClick={() => setViewingDT(null)} style={{ background: 'var(--gray-100)' }}>Đóng</button>
               <button className="btn btn-primary btn-pill" onClick={handlePrint}>
                  <span className="material-symbols-outlined">print</span>
                  In đơn thuốc
               </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default React.memo(QuanLyDonThuoc);
