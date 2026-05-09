import React, { useState, useEffect } from 'react';
import axiosInstance from '@services/axios';
import { toast } from '@components/Toast';

const chuyenNgayGioISO_SangVN = (dateString: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
};

const CauHinhHeThong: React.FC = () => {
    const [configs, setConfigs] = useState<{ [key: string]: string }>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [backingUp, setBackingUp] = useState(false);
    const [logs, setLogs] = useState<any[]>([]);

    useEffect(() => {
        fetchConfigs();
        fetchLogs();
    }, []);

    const fetchConfigs = async () => {
        try {
            const res = await axiosInstance.get('/api/system/cau-hinh');
            setConfigs(res.data);
        } catch (error: any) {
            toast.error('Lỗi khi tải cấu hình hệ thống: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchLogs = async () => {
        try {
            const res = await axiosInstance.get('/api/system/nhat-ky');
            setLogs(res.data);
        } catch (error: any) {
            console.error('Lỗi khi tải nhật ký: ' + error.message);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await axiosInstance.post('/api/system/cau-hinh', configs);
            toast.success('Đã lưu cấu hình thành công!');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Lỗi khi lưu cấu hình');
        } finally {
            setSaving(false);
        }
    };

    const handleBackup = async () => {
        if (!window.confirm('Quá trình sao lưu có thể mất vài giây. Bạn có chắc chắn muốn tiến hành sao lưu ngay bây giờ?')) {
            return;
        }
        setBackingUp(true);
        try {
            const res = await axiosInstance.post('/api/system/backup');
            toast.success(res.data.message || 'Sao lưu thành công!');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Lỗi khi sao lưu dữ liệu');
        } finally {
            setBackingUp(false);
        }
    };

    if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><div className="dot-pulse"></div></div>;

    return (
        <div className="animate-fade-in">
            <div style={{ marginBottom: '40px' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-1px' }}>Cấu hình hệ thống</h1>
                <p style={{ color: 'var(--gray-500)', fontWeight: 600 }}>Quản lý các thông số kỹ thuật và bảo trì hệ thống lõi.</p>
            </div>

            <div className="responsive-grid">
                <div className="glass-card" style={{ padding: '30px', borderRadius: 'var(--radius-xl)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>database</span>
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Sao lưu Dữ liệu</h2>
                            <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', margin: 0 }}>Cấu hình thời gian giữ file backup</p>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gap: '16px', marginBottom: '30px' }}>
                        <div>
                            <label>SỐ NGÀY LƯU TRỮ BACKUP</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <input type="number" min="1" max="365" value={configs.backup_retention_days || '7'} onChange={(e) => setConfigs({ ...configs, backup_retention_days: e.target.value })} style={{ width: '100px' }} />
                                <span style={{ fontSize: '0.9rem', color: 'var(--gray-500)', fontWeight: 600 }}>Ngày</span>
                            </div>
                            <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginTop: '8px' }}>Hệ thống sẽ tự động xóa các bản sao lưu cũ hơn số ngày này để tiết kiệm dung lượng ổ cứng.</p>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 800, color: 'var(--gray-400)' }}>DANH SÁCH IP BỊ CHẶN (BLACKLIST)</label>
                            <textarea
                                value={configs.blocked_ips || ''}
                                onChange={(e) => setConfigs({ ...configs, blocked_ips: e.target.value })}
                                placeholder="Nhập các IP cần chặn, cách nhau bằng dấu phẩy (VD: 192.168.1.1, 10.0.0.5)"
                                style={{ width: '100%', minHeight: '80px', padding: '12px', borderRadius: '12px', border: '1px solid var(--gray-200)', background: 'var(--surface)', color: 'var(--ink)', outline: 'none' }}
                            />
                            <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', marginTop: '8px' }}>Hệ thống sẽ từ chối mọi yêu cầu truy cập từ các địa chỉ IP này. Phân cách nhiều IP bằng dấu phẩy (,).</p>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button className="btn btn-primary" onClick={handleSave} disabled={saving}><span className="material-symbols-outlined">save</span>{saving ? 'Đang lưu...' : 'Lưu cấu hình'}</button>
                        <button className="btn btn-outline" onClick={handleBackup} disabled={backingUp} style={{ borderColor: 'var(--success)', color: 'var(--success)' }}><span className="material-symbols-outlined" style={{ animation: backingUp ? 'spinBtn 1s linear infinite' : 'none' }}>{backingUp ? 'sync' : 'backup'}</span>{backingUp ? 'Đang sao lưu...' : 'Sao lưu ngay'}</button>
                    </div>
                </div>

                <div className="glass-card" style={{ padding: '30px', borderRadius: 'var(--radius-xl)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--warning-light, rgba(245, 158, 11, 0.15))', color: 'var(--warning, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>history</span>
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Nhật ký hoạt động (Audit Log)</h2>
                            <p style={{ fontSize: '0.85rem', color: 'var(--gray-500)', margin: 0 }}>Theo dõi thao tác sửa/xóa của nhân viên</p>
                        </div>
                    </div>

                    <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--gray-200)', borderRadius: '12px', padding: '10px', background: 'var(--surface)' }}>
                        {logs.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--gray-400)' }}>Chưa có ghi nhận nào.</p> : (
                            <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                                <tbody>
                                    {logs.map((log) => (
                                        <tr key={log.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                                            <td style={{ padding: '8px', color: 'var(--gray-400)', whiteSpace: 'nowrap' }}>{chuyenNgayGioISO_SangVN(log.ngay_tao)}</td>
                                            <td style={{ padding: '8px', fontWeight: 800, color: 'var(--primary)' }}>{log.nguoi_thao_tac}</td>
                                            <td style={{ padding: '8px', fontWeight: 700 }}>[{log.hanh_dong}] {log.bang_du_lieu}</td>
                                            <td style={{ padding: '8px', color: 'var(--gray-500)' }}>
                                                {log.chi_tiet}
                                                {(log.ip_address || log.device_info) && (
                                                    <div style={{ marginTop: '4px', fontSize: '0.75rem', color: 'var(--gray-400)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                        {log.ip_address && <span>🌐 IP: {log.ip_address}</span>}
                                                        {log.device_info && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }} title={log.device_info}>💻 Thiết bị: {log.device_info}</span>}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CauHinhHeThong;