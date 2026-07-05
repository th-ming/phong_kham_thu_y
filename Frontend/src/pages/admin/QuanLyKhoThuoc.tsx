import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "@services/axios";
import { getUserProfile, matchesSearchFields, normalizeUserRole } from "@utils/index";
import { Modal } from "@components/CommonUI";
import { toast } from "@components/Toast";
import { toastError } from '@utils/toastHelpers';
import thuocService from "@services/thuocService";
import { useAutoRefresh } from "@hooks/useAutoRefresh";
import useVirtualScroll from "@hooks/useVirtualScroll";

const chuyenNgayISO_SangVN = (dateString: string) => {
  if (!dateString) return "—";
  const parts = dateString.split('T')[0].split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateString;
};

const QuanLyKhoThuoc: React.FC = () => {
  const [thuocs, setThuocs] = useState<any[]>([]);
  const [loThuocs, setLoThuocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchThuoc, setSearchThuoc] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newThuoc, setNewThuoc] = useState<any>({
    id_thuoc: '',
    ten_thuoc: '',
    ma_thuoc: '',
    loai_thuoc: '',
    don_vi: '',
    gia_ban: 0,
    cach_dung: '',
    dang_bao_che: '',
    thanh_phan: '',
    trang_thai: true,
    da_xoa: false
  });

  const fetchData = () => {
    Promise.all([
      axiosInstance.get("/api/kho/thuoc"),
      axiosInstance.get("/api/kho/lo-thuoc")
    ])
      .then(([thuocRes, loRes]) => {
        setThuocs(thuocRes.data);
        setLoThuocs(loRes.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi lấy dữ liệu kho thuốc:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  useAutoRefresh(fetchData, { runImmediately: false });

  useEffect(() => {
    const handleRealtimeUpdate = () => {
      fetchData();
    };
    window.addEventListener("rexi-data-changed", handleRealtimeUpdate);
    return () => window.removeEventListener("rexi-data-changed", handleRealtimeUpdate);
  }, []);

  const user = getUserProfile();
  const userRole = normalizeUserRole(user);
  const canManageInventory = userRole === 'admin' || userRole === 'quan_ly' || userRole === 'ke_toan';

  const filteredThuocs = React.useMemo(() => {
    if (!searchThuoc.trim()) return thuocs;
    return thuocs.filter(t => matchesSearchFields(searchThuoc, [
      t.id_thuoc,
      t.ten_thuoc,
      t.thanh_phan,
      t.dang_bao_che,
      t.don_vi,
      t.mo_ta,
      t.gia_ban,
      t.so_luong_ton,
      t.trang_thai ? "đang bán active" : "ngừng bán inactive"
    ]));
  }, [thuocs, searchThuoc]);

  const { visibleItems, containerRef, onScrollHandler, visibleRange, shouldVirtualize } = useVirtualScroll({
    items: filteredThuocs,
    itemHeight: 80,
    containerHeight: 600,
    visibleCount: 8
  });

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div className="dot-pulse"></div>
    </div>
  );

  return (
    <div className="animate-fade-in admin-inventory-page">
      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes growBar {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        .inv-header-anim { animation: slideUpFade 0.5s cubic-bezier(.22,.68,0,1.2) both; }
        .inv-card-anim   { animation: slideUpFade 0.5s cubic-bezier(.22,.68,0,1.2) both; }
        .inv-row-anim    { animation: slideUpFade 0.4s cubic-bezier(.22,.68,0,1.2) both; }
        .inv-lot-anim    { animation: slideUpFade 0.45s cubic-bezier(.22,.68,0,1.2) both; }
        .admin-inventory-mobile-card {
          transition: transform 0.22s cubic-bezier(.22,.68,0,1.2), box-shadow 0.22s;
        }
        .admin-inventory-mobile-card:hover {
          transform: translateY(-3px) scale(1.01);
          box-shadow: 0 8px 28px rgba(15,157,138,0.13);
        }
        tbody tr {
          transition: background 0.18s ease;
        }
        tbody tr:hover {
          background: var(--primary-light) !important;
        }
        @media screen and (max-width: 1024px) {
          .admin-inventory-page {
            display: grid !important;
            gap: 14px !important;
          }
          .admin-inventory-header {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 12px !important;
            margin-bottom: 10px !important;
            align-items: start !important;
          }
          .admin-inventory-header h1 {
            max-width: 14ch !important;
            font-size: clamp(1.24rem, 5.5vw, 1.52rem) !important;
            line-height: 1.08 !important;
            letter-spacing: -0.02em !important;
          }
          .admin-inventory-header p {
            max-width: 34ch !important;
            margin-top: 6px !important;
            font-size: 0.66rem !important;
            line-height: 1.32 !important;
          }
          .admin-inventory-actions {
            display: grid !important;
            grid-template-columns: 1fr !important;
            width: min(100%, 300px) !important;
            gap: 8px !important;
          }
          .admin-inventory-search {
            width: 100% !important;
            min-height: 38px !important;
            height: 38px !important;
            padding-inline: 12px !important;
            border-radius: 14px !important;
          }
          .admin-inventory-search input {
            padding-block: 7px !important;
            font-size: 0.82rem !important;
          }
          .admin-inventory-actions .btn {
            width: 100% !important;
            min-height: 38px !important;
            padding: 7px 11px !important;
            border-radius: 14px !important;
            font-size: 0.74rem !important;
            margin-left: 0 !important;
          }
          .admin-inventory-actions .btn .material-symbols-outlined {
            font-size: 18px !important;
          }
          .admin-inventory-grid {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
          .admin-inventory-list-card,
          .admin-inventory-side-card {
            padding: 10px !important;
            border-radius: 18px !important;
            overflow: hidden !important;
          }
          .admin-inventory-list-card h2,
          .admin-inventory-side-card h2 {
            margin-bottom: 10px !important;
            font-size: 0.86rem !important;
            line-height: 1.2 !important;
          }
          .admin-inventory-desktop-table {
            display: none !important;
          }
          .admin-inventory-mobile-list {
            display: grid !important;
            gap: 10px !important;
          }
          .admin-inventory-mobile-card {
            padding: 10px !important;
            border-radius: 16px !important;
            gap: 10px !important;
          }
          .admin-inventory-mobile-card h3 {
            font-size: 0.82rem !important;
            line-height: 1.2 !important;
          }
          .admin-inventory-mobile-card p {
            font-size: 0.66rem !important;
            line-height: 1.3 !important;
          }
          .admin-inventory-mobile-meta span {
            padding: 8px 9px !important;
            font-size: 0.64rem !important;
            border-radius: 12px !important;
          }
        }
      `}</style>
      <div className="admin-mobile-page-header admin-inventory-header inv-header-anim" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '20px', animationDelay: '0.05s' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-1px' }}>Quản lý Kho thuốc</h1>
          <p style={{ color: 'var(--gray-500)', fontWeight: 600 }}>Theo dõi tồn kho, hạn sử dụng và phân phối dược phẩm.</p>
        </div>
        <div className="admin-inventory-actions" style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="glass-card admin-mobile-search-box admin-inventory-search" style={{ display: 'flex', alignItems: 'center', padding: '0 16px', borderRadius: '16px', border: '1px solid var(--gray-200)', background: 'var(--surface)', width: '260px' }}>
            <span className="material-symbols-outlined" style={{ color: 'var(--gray-400)', marginRight: '8px' }}>search</span>
            <input data-ai-id="input-quanlykhothuoc-8v88"
              type="text"
              placeholder="Tìm tên thuốc, thành phần..."
              value={searchThuoc}
              onChange={(e) => setSearchThuoc(e.target.value)}
              style={{ border: 'none', outline: 'none', background: 'transparent', padding: '10px 0', fontWeight: 600, width: '100%', color: 'var(--ink)', fontSize: '0.9rem' }}
            />
          </div>
          {canManageInventory && (
            <>
              <Link data-ai-id="button-quanlykhothuoc-nhapkho" to="/quan-ly/nhap-kho" className="btn btn-primary btn-pill" style={{ textDecoration: 'none' }}>
                <span className="material-symbols-outlined">add_box</span>
                Nhập thuốc mới
              </Link>
              <button data-ai-id="button-quanlykhothuoc-themthuoc" type="button" className="btn btn-outline btn-pill" style={{ marginLeft: 8 }} onClick={() => setIsAddModalOpen(true)}>
                <span className="material-symbols-outlined">add</span>
                Thêm thuốc
              </button>
            </>
          )}
        </div>
        {/* Add Thuoc modal */}
        <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Thêm thuốc mới">
          <form onSubmit={async (e) => {
            e.preventDefault();
            try {
              // ensure an id is provided (backend requires id_thuoc)
              if (!newThuoc.id_thuoc || !newThuoc.ten_thuoc) {
                toastError('Vui lòng nhập `id_thuoc` và `ten_thuoc`.');
                return;
              }
              const saved = await thuocService.create(newThuoc);
              setThuocs(prev => [...prev, saved]);
              toast.success('Đã thêm thuốc thành công');
              setIsAddModalOpen(false);
              setNewThuoc({ id_thuoc: '', ten_thuoc: '', ma_thuoc: '', loai_thuoc: '', don_vi: '', gia_ban: 0, cach_dung: '', dang_bao_che: '', thanh_phan: '', trang_thai: true, da_xoa: false });
            } catch (err: any) {
              toastError(err, 'Lỗi khi thêm thuốc');
            }
          }} style={{ display: 'grid', gap: 12 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 800, color: 'var(--gray-400)' }}>Mã thuốc (id_thuoc)</label>
              <input data-ai-id="input-quanlykhothuoc-idthuoc" className="form-input" value={newThuoc.id_thuoc} onChange={e => setNewThuoc({ ...newThuoc, id_thuoc: e.target.value })} required />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 800, color: 'var(--gray-400)' }}>Tên thuốc</label>
              <input data-ai-id="input-quanlykhothuoc-tenthuoc" className="form-input" value={newThuoc.ten_thuoc} onChange={e => setNewThuoc({ ...newThuoc, ten_thuoc: e.target.value })} required />
            </div>
            <div className="responsive-grid-2">
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 800, color: 'var(--gray-400)' }}>Mã thuốc (ma_thuoc)</label>
                <input data-ai-id="input-quanlykhothuoc-mathuoc" className="form-input" value={newThuoc.ma_thuoc} onChange={e => setNewThuoc({ ...newThuoc, ma_thuoc: e.target.value })} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 800, color: 'var(--gray-400)' }}>Đơn vị</label>
                <input data-ai-id="input-quanlykhothuoc-donvi" className="form-input" value={newThuoc.don_vi} onChange={e => setNewThuoc({ ...newThuoc, don_vi: e.target.value })} />
              </div>
            </div>
            <div className="responsive-grid-2">
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 800, color: 'var(--gray-400)' }}>Dạng bào chế</label>
                <input data-ai-id="input-quanlykhothuoc-dangbaoche" className="form-input" placeholder="Viên nén, siro, tiêm..." value={newThuoc.dang_bao_che} onChange={e => setNewThuoc({ ...newThuoc, dang_bao_che: e.target.value })} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 800, color: 'var(--gray-400)' }}>Thành phần</label>
                <input data-ai-id="input-quanlykhothuoc-thanhphan" className="form-input" placeholder="Hoạt chất chính..." value={newThuoc.thanh_phan} onChange={e => setNewThuoc({ ...newThuoc, thanh_phan: e.target.value })} />
              </div>
            </div>
            <div className="responsive-grid-2">
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 800, color: 'var(--gray-400)' }}>Giá bán</label>
                <input data-ai-id="input-quanlykhothuoc-giaban" type="number" className="form-input" value={newThuoc.gia_ban} onChange={e => setNewThuoc({ ...newThuoc, gia_ban: Number(e.target.value) })} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 800, color: 'var(--gray-400)' }}>Loại</label>
                <input data-ai-id="input-quanlykhothuoc-loai" className="form-input" value={newThuoc.loai_thuoc} onChange={e => setNewThuoc({ ...newThuoc, loai_thuoc: e.target.value })} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
              <button data-ai-id="button-quanlykhothuoc-huy" type="button" className="btn btn-pill" onClick={() => setIsAddModalOpen(false)} style={{ background: 'var(--gray-100)', color: 'var(--ink)' }}>Hủy</button>
              <button data-ai-id="button-quanlykhothuoc-taothuoc" type="submit" className="btn btn-primary btn-pill">Tạo thuốc</button>
            </div>
          </form>
        </Modal>
      </div>

      <div className="admin-inventory-grid" style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '32px' }}>
        <div className="glass-card admin-inventory-list-card inv-card-anim" style={{ padding: '32px', borderRadius: 'var(--radius-xl)', animationDelay: '0.1s' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px' }}>Danh mục thuốc</h2>
          <div className="admin-inventory-mobile-list">
            {(shouldVirtualize ? visibleItems : filteredThuocs).map((t, idx) => (
              <article key={t.id_thuoc} className="admin-inventory-mobile-card inv-row-anim" style={{ animationDelay: `${0.05 + idx * 0.02}s` }}>
                <div className="admin-inventory-mobile-card-head">
                  <div>
                    <span className="admin-inventory-kicker">{t.ma_thuoc || t.id_thuoc}</span>
                    <h3>{t.ten_thuoc}</h3>
                    <p>{t.thanh_phan || "Dược chất"}</p>
                  </div>
                  <span className="admin-inventory-pill">{t.don_vi || t.don_vi_tinh || "Đơn vị"}</span>
                </div>
                <div className="admin-inventory-mobile-meta">
                  <span><strong>Dạng</strong>{t.dang_bao_che || "—"}</span>
                  <span><strong>Loại</strong>{t.loai_thuoc || "—"}</span>
                  <span className="is-wide"><strong>Giá bán</strong>{t.gia_ban?.toLocaleString('vi-VN')} đ</span>
                </div>
              </article>
            ))}
          </div>
          <div style={{ overflowX: 'auto' }}>
            <div className="table-responsive-wrapper admin-inventory-desktop-table"
              ref={containerRef}
              onScroll={onScrollHandler}
              style={{ maxHeight: '600px', overflowY: 'auto' }}>
              <div style={{ minWidth: '800px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--surface)' }}>
                    <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--gray-100)' }}>
                       <th style={{ padding: '16px 8px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>TÊN THUỐC</th>
                       <th style={{ padding: '16px 8px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800 }}>DẠNG</th>
                       <th style={{ padding: '16px 8px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800, textAlign: 'right' }}>TỒN KHO</th>
                       <th style={{ padding: '16px 8px', fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 800, textAlign: 'right' }}>GIÁ BÁN</th>
                     </tr>
                  </thead>
                  <tbody>
                    {shouldVirtualize && visibleRange.start > 0 && (
                      <tr style={{ height: visibleRange.start * 80 }}><td colSpan={4} /></tr>
                    )}
                    {(shouldVirtualize ? visibleItems : filteredThuocs).map((t, idx) => (
                      <tr key={t.id_thuoc} className="inv-row-anim" style={{ borderBottom: '1px solid var(--gray-50)', animationDelay: `${0.05 + idx * 0.02}s`, height: '80px' }}>
                        <td style={{ padding: '16px 8px' }}>
                          <div style={{ fontWeight: 800, color: 'var(--ink)' }}>{t.ten_thuoc}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 600 }}>{t.thanh_phan || "Dược chất"}</div>
                        </td>
                        <td style={{ padding: '16px 8px' }}>
                          {t.dang_bao_che ? (
                            <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700 }}>
                              {t.dang_bao_che}
                            </span>
                          ) : (
                            <span style={{ color: 'var(--gray-450)', fontWeight: 600 }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                          <span style={{
                            fontWeight: 900,
                            color: (t.so_luong_ton ?? 0) <= 0 ? '#ef4444'
                              : (t.so_luong_ton ?? 0) < 10 ? '#f59e0b'
                              : 'var(--ink)'
                          }}>
                            {t.so_luong_ton ?? 0}
                          </span>
                          <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', fontWeight: 600 }}>{t.don_vi || ''}</div>
                        </td>
                        <td style={{ padding: '16px 8px', textAlign: 'right', fontWeight: 900, color: 'var(--primary)' }}>
                          {t.gia_ban?.toLocaleString('vi-VN')} đ
                        </td>
                      </tr>
                    ))}
                    {shouldVirtualize && visibleRange.end < filteredThuocs.length && (
                      <tr style={{ height: (filteredThuocs.length - visibleRange.end) * 80 }}><td colSpan={4} /></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card admin-inventory-side-card inv-card-anim" style={{ padding: '32px', borderRadius: 'var(--radius-xl)', background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--gray-200)', animationDelay: '0.18s' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px', color: 'var(--ink)' }}>Lô thuốc & Hạn dùng</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {loThuocs.map((l, idx) => {
              const thuoc = thuocs.find(t => t.id_thuoc === l.id_thuoc);
              return (
                <div key={l.id_lo} className="inv-lot-anim" style={{ background: 'var(--primary-light)', padding: '16px', borderRadius: '16px', border: '1px solid var(--primary-border, rgba(15, 157, 138, 0.18))', animationDelay: `${0.2 + idx * 0.07}s`, transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default' }}>
                  {/* Hiển thị tên thuốc của lô */}
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '6px' }}>
                    {thuoc?.ten_thuoc || l.id_thuoc}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 800, color: 'var(--ink)' }}>Lô: {l.so_lo}</span>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 800, padding: '4px 10px', borderRadius: '50px',
                      background: (l.so_luong_ton ?? 0) <= 0 ? '#ef4444'
                        : (l.so_luong_ton ?? 0) < 10 ? '#f59e0b'
                        : 'var(--primary)',
                      color: '#fff'
                    }}>
                      TỒN: {l.so_luong_ton}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--gray-500)', fontWeight: 650 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>event</span>
                    Hạn dùng: {chuyenNgayISO_SangVN(l.han_su_dung)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(QuanLyKhoThuoc);
