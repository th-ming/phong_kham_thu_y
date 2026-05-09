import React, { useState, useEffect } from 'react';
import axiosInstance from '../../services/axios';

const CanhBaoThuoc: React.FC = () => {
    const [thuocHetHan, setThuocHetHan] = useState<any[]>([]);

    useEffect(() => {
        // Gọi API lấy danh sách thuốc sắp hết hạn (Đã có sẵn ở FinanceController)
        axiosInstance.get('/api/kho/thuoc-sap-het-han')
            .then(res => {
                setThuocHetHan(res.data || []);
            })
            .catch(err => console.error("Lỗi tải cảnh báo thuốc:", err));
    }, []);

    // Nếu kho thuốc an toàn (Không có gì hết hạn) -> Ẩn widget
    if (thuocHetHan.length === 0) return null;

    return (
        <div className="glass-card animate-fade-in" style={{ padding: '24px', borderRadius: 'var(--radius-xl)', background: 'rgba(239, 68, 68, 0.05)', border: '1px dashed var(--danger)', marginBottom: '32px', display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
            <style>{`
                @keyframes warningPulse {
                    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
                    70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
                    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
            `}</style>
            <div style={{ width: '56px', height: '56px', background: 'var(--danger)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0, animation: 'warningPulse 2s infinite' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>warning</span>
            </div>
            <div style={{ flex: 1 }}>
                <h3 style={{ color: 'var(--danger)', margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: 900 }}>CẢNH BÁO KHẨN: Có {thuocHetHan.length} lô thuốc sắp hoặc đã hết hạn!</h3>
                <div style={{ display: 'grid', gap: '10px' }}>
                    {thuocHetHan.slice(0, 3).map((t, idx) => (
                        <div key={idx} style={{ background: 'var(--surface)', padding: '12px 20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--glass-border)' }}>
                            <div>
                                <div style={{ fontWeight: 800, color: 'var(--ink)', fontSize: '0.95rem' }}>{t.ten_thuoc}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)', fontWeight: 600 }}>Mã Lô: <span style={{ color: 'var(--ink)' }}>{t.so_lo}</span> | Tồn kho: <span style={{ color: 'var(--danger)', fontWeight: 800 }}>{t.so_luong_ton}</span></div>
                            </div>
                            <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '6px 14px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 950, border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                HSD: {t.han_dung ? new Date(t.han_dung).toLocaleDateString('vi-VN') : 'N/A'}
                            </div>
                        </div>
                    ))}
                </div>
                {thuocHetHan.length > 3 && (
                    <div style={{ marginTop: '16px', fontSize: '0.9rem', color: 'var(--danger)', fontWeight: 800, cursor: 'pointer', display: 'inline-block' }}>+ Xem thêm {thuocHetHan.length - 3} lô thuốc khác trong trang Quản lý Kho...</div>
                )}
            </div>
        </div>
    );
};
export default CanhBaoThuoc;
