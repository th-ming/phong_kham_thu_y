import React, { useState, useEffect } from "react";
import axiosInstance from "@services/axios";
import { Modal } from "@components/CommonUI";
import { matchesSearchFields } from "@utils/index";
import { useAutoRefresh } from "@hooks/useAutoRefresh";

const QuanLyDonThuoc: React.FC = () => {
  const [donThuocs, setDonThuocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingDT, setViewingDT] = useState<any>(null);
  const [searchDonThuoc, setSearchDonThuoc] = useState("");

  const fetchDonThuocs = () => {
    axiosInstance.get("/api/ho-so-benh-an/don-thuoc")
      .then(res => {
        setDonThuocs(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi lấy danh sách đơn thuốc:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDonThuocs();
  }, []);

  useAutoRefresh(fetchDonThuocs, { runImmediately: false });

  const filteredDonThuocs = React.useMemo(() => {
    if (!searchDonThuoc.trim()) return donThuocs;
    return donThuocs.filter(dt => matchesSearchFields(searchDonThuoc, [
      dt.id_don_thuoc,
      dt.id_ho_so,
      dt.ten_thu_cung,
      dt.ten_khach_hang,
      dt.ten_thuoc,
      dt.cach_dung,
      dt.lieu_dung,
      dt.ghi_chu,
      dt.ngay_ke_don
    ]));
  }, [donThuocs, searchDonThuoc]);

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
          @page { size: A4 portrait; margin: 12mm; }
          html, body { background: #ffffff !important; overflow: visible !important; }
          body * { visibility: hidden; }
          .modal-wrapper,
          .modal-wrapper *,
          .modal-content,
          .glass-card {
            overflow: visible !important;
            max-height: none !important;
            animation: none !important;
            transform: none !important;
          }
          .modal-wrapper {
            position: static !important;
            inset: auto !important;
            display: block !important;
            padding: 0 !important;
            background: transparent !important;
            backdrop-filter: none !important;
          }
          .modal-content { padding: 0 !important; }
          .no-print, .no-print * {
            display: none !important;
            visibility: hidden !important;
          }
          #print-prescription, #print-prescription * { visibility: visible; }
          #print-prescription {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 186mm !important;
            margin: 0 !important;
            padding: 12mm !important;
            background: #ffffff !important;
            color: #111827 !important;
            box-shadow: none !important;
            border: 1px solid #d1d5db !important;
            border-radius: 12px !important;
          }
        }
        .admin-prescription-mobile-list { display: none; }
        @media screen and (max-width: 1024px) {
          .admin-prescription-header {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 12px !important;
            margin-bottom: 16px !important;
          }
          .admin-prescription-header h1 {
            max-width: 12ch !important;
            font-size: clamp(1.42rem, 6.4vw, 1.78rem) !important;
            line-height: 1.08 !important;
            letter-spacing: -0.02em !important;
            margin: 0 0 6px !important;
          }
          .admin-prescription-header p {
            max-width: 32ch !important;
            margin: 0 !important;
            font-size: 0.82rem !important;
            line-height: 1.45 !important;
          }
          .admin-prescription-search {
            width: min(100%, 300px) !important;
            min-height: 42px !important;
            border-radius: 16px !important;
          }
          .admin-prescription-desktop-table {
            display: none !important;
          }
          .admin-prescription-mobile-list {
            display: grid !important;
            gap: 10px;
            padding: 10px;
          }
          .admin-prescription-card {
            display: grid;
            gap: 10px;
            padding: 12px;
            border-radius: 18px;
            background: var(--surface);
            border: 1px solid var(--gray-100);
          }
          .admin-prescription-card-top {
            display: grid;
            grid-template-columns: minmax(0, 1fr) auto;
            gap: 10px;
            align-items: start;
          }
          .admin-prescription-card h3 {
            margin: 0;
            color: var(--ink);
            font-size: 0.95rem;
            line-height: 1.22;
            font-weight: 950;
          }
          .admin-prescription-card p {
            margin: 4px 0 0;
            color: var(--gray-500);
            font-size: 0.72rem;
            line-height: 1.35;
            font-weight: 700;
            overflow-wrap: anywhere;
          }
          .admin-prescription-qty {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-height: 28px;
            padding: 5px 9px;
            border-radius: 999px;
            background: var(--primary-light);
            color: var(--primary);
            font-size: 0.68rem;
            line-height: 1;
            font-weight: 950;
            white-space: nowrap;
          }
          .admin-prescription-card .btn {
            width: 100%;
            min-height: 36px;
            justify-content: center;
            border-radius: 13px !important;
            padding: 7px 10px !important;
          }
        }
      `}</style>

      <div className="admin-prescription-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-1px' }}>Quản lý Đơn thuốc</h1>
          <p style={{ color: 'var(--gray-500)', fontWeight: 600 }}>Theo dõi lịch sử cấp phát thuốc và hướng dẫn điều trị tại nhà.</p>
        </div>
        <div className="glass-card admin-prescription-search" style={{ display: 'flex', alignItems: 'center', padding: '0 16px', borderRadius: '16px', border: '1px solid var(--gray-200)', background: 'var(--surface)', width: '300px' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--gray-400)', marginRight: '8px' }}>search</span>
          <input data-ai-id="input-quanlydonthuoc-3bsc"
            type="text"
            placeholder="Tìm mã đơn, thú cưng, thuốc..."
            value={searchDonThuoc}
            onChange={(e) => setSearchDonThuoc(e.target.value)}
            style={{ border: 'none', outline: 'none', background: 'transparent', padding: '10px 0', fontWeight: 600, width: '100%', color: 'var(--ink)', fontSize: '0.9rem' }}
          />
        </div>
      </div>

      <div className="glass-card" style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
        <div className="admin-prescription-mobile-list">
          {filteredDonThuocs.length === 0 ? (
            <div className="admin-empty-state" style={{ padding: '18px 10px', textAlign: 'center', color: 'var(--gray-500)', fontWeight: 800 }}>
              Không có đơn thuốc phù hợp.
            </div>
          ) : filteredDonThuocs.map((dt) => (
            <article key={dt.id_don_thuoc} className="admin-prescription-card">
              <div className="admin-prescription-card-top">
                <div>
                  <h3>#DT-{dt.id_don_thuoc} · {dt.ten_thuoc || 'Thuốc chưa cập nhật'}</h3>
                  <p>{dt.ten_thu_cung || 'Bệnh nhân chưa cập nhật'} · HS-{dt.id_ho_so_benh_an}</p>
                </div>
                <span className="admin-prescription-qty">SL {dt.so_luong || '—'}</span>
              </div>
              <p>{dt.cach_dung || 'Chưa có hướng dẫn dùng'}</p>
              {dt.ghi_chu && <p>{dt.ghi_chu}</p>}
              <button data-ai-id="button-quanlydonthuoc-mobile-view" className="btn" onClick={() => setViewingDT(dt)} style={{ background: 'var(--gray-50)', color: 'var(--ink)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>description</span>
              </button>
            </article>
          ))}
        </div>
        <div className="table-responsive-wrapper admin-prescription-desktop-table">
<div style={{ minWidth: '800px' }}>
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
            {filteredDonThuocs.map((dt) => (
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
                  <button data-ai-id="button-quanlydonthuoc-4ivd" className="btn" onClick={() => setViewingDT(dt)} style={{ padding: '8px', background: 'var(--gray-50)', color: 'var(--ink)' }}>
                    <span className="material-symbols-outlined">description</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
</div></div>
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
                <div className="responsive-grid-2">
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
               <button data-ai-id="button-quanlydonthuoc-oxr6" className="btn btn-pill" onClick={() => setViewingDT(null)} style={{ background: 'var(--gray-100)' }}>Đóng</button>
               <button data-ai-id="button-quanlydonthuoc-ojcy" className="btn btn-primary btn-pill" onClick={handlePrint}>
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
