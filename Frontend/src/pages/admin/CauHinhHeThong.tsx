import React, { useState, useEffect } from 'react';
import axiosInstance from '@services/axios';
import { toast } from '@components/Toast';

const chuyenNgayGioISO_SangVN = (dateString: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
};

const ROLES = ['admin', 'staff', 'doctor', 'guest'];
const ACTIONS = [
    { id: 'ADD_PET', name: 'Thêm Thú cưng' },
    { id: 'BOOK_APPOINTMENT', name: 'Đặt Lịch' },
    { id: 'VIEW_REPORT', name: 'Xem Báo cáo' },
    { id: 'MANAGE_USERS', name: 'Quản lý ND' },
    { id: 'SETTINGS', name: 'Cấu hình' }
];

const CauHinhHeThong: React.FC = () => {
    const [configs, setConfigs] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [backingUp, setBackingUp] = useState(false);
    const [logs, setLogs] = useState<any[]>([]);
    const [backups, setBackups] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState('general');

    // Trạng thái kiểm tra email
    const [testEmailTo, setTestEmailTo] = useState('');
    const [testingEmail, setTestingEmail] = useState(false);
    const [testEmailResult, setTestEmailResult] = useState<{success: boolean, message: string} | null>(null);

    // Trạng thái ma trận Phân quyền AI
    const [aiPolicy, setAiPolicy] = useState<Record<string, string[]>>({});

    useEffect(() => {
        fetchConfigs();
        fetchLogs();
        fetchBackups();
    }, []);

    const fetchConfigs = async () => {
        try {
            const res = await axiosInstance.get('/api/system/cau-hinh');
            setConfigs(res.data);
            
            // Phân tích cú pháp Phân quyền AI
            try {
                if (res.data.ai_action_policy) {
                    setAiPolicy(JSON.parse(res.data.ai_action_policy));
                } else {
                    setAiPolicy({
                        admin: ['ADD_PET', 'BOOK_APPOINTMENT', 'VIEW_REPORT', 'MANAGE_USERS', 'SETTINGS'],
                        staff: ['ADD_PET', 'BOOK_APPOINTMENT'],
                        guest: ['BOOK_APPOINTMENT']
                    });
                }
            } catch(e) {}
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
        } catch (error: any) {}
    };

    const fetchBackups = async () => {
        try {
            const res = await axiosInstance.get('/api/system/backups');
            setBackups(res.data);
        } catch (error: any) {}
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                ...configs,
                ai_action_policy: JSON.stringify(aiPolicy)
            };
            await axiosInstance.post('/api/system/cau-hinh', payload);
            toast.success('Đã lưu cấu hình thành công!');
            fetchLogs();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Lỗi khi lưu cấu hình');
        } finally {
            setSaving(false);
        }
    };

    const handleTestEmail = async () => {
        if (!testEmailTo) {
            toast.error('Vui lòng nhập email nhận test');
            return;
        }
        setTestingEmail(true);
        setTestEmailResult(null);
        try {
            await axiosInstance.post('/api/system/test-email', {
                toEmail: testEmailTo,
                mail_host: configs.mail_host || '',
                mail_port: (configs.mail_port || '587').toString(),
                mail_username: configs.mail_username || '',
                mail_password: configs.mail_password || ''
            });
            setTestEmailResult({ success: true, message: 'Gửi email test thành công! Vui lòng kiểm tra hộp thư.' });
        } catch (error: any) {
            setTestEmailResult({ 
                success: false, 
                message: error.response?.data?.message || 'Lỗi gửi email test. Vui lòng kiểm tra lại cấu hình SMTP.'
            });
        } finally {
            setTestingEmail(false);
        }
    };

    const handlePolicyToggle = (role: string, action: string) => {
        setAiPolicy(prev => {
            const roleActions = prev[role] || [];
            if (roleActions.includes(action)) {
                return { ...prev, [role]: roleActions.filter(a => a !== action) };
            } else {
                return { ...prev, [role]: [...roleActions, action] };
            }
        });
    };

    const handleDeleteBackup = async (filename: string) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa bản sao lưu "${filename}"?`)) return;
        try {
            await axiosInstance.delete(`/api/system/backups/${filename}`);
            toast.success('Đã xóa bản sao lưu!');
            fetchBackups();
            fetchLogs();
        } catch (error: any) {
            toast.error('Lỗi khi xóa file: ' + (error.response?.data?.message || error.message));
        }
    };

    // Tải file backup về máy thông qua anchor tag ẩn
    const handleDownloadBackup = (filename: string) => {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
        const url = `/api/system/backups/download/${encodeURIComponent(filename)}`;
        // Dùng fetch để lấy blob kèm header Authorization, sau đó tạo link tải
        toast.success(`Đang chuẩn bị tải "${filename}"...`);
        fetch(url, { headers: { 'Authorization': `Bearer ${token}` } })
            .then(res => {
                if (!res.ok) throw new Error('Không thể tải file backup');
                return res.blob();
            })
            .then(blob => {
                const objectUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = objectUrl;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(objectUrl);
            })
            .catch(err => toast.error('Lỗi khi tải file: ' + err.message));
    };

    const handleCreateBackup = async () => {
        try {
            const confirm = window.confirm('Quá trình sao lưu có thể mất vài giây. Bạn có chắc chắn muốn tiến hành sao lưu ngay bây giờ?');
            if (!confirm) return;
            
            setBackingUp(true);
            const res = await axiosInstance.post('/api/system/backup');
            toast.success(res.data.message || 'Sao lưu thành công!');
            fetchBackups();
            fetchLogs();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Lỗi khi sao lưu dữ liệu');
        } finally {
            setBackingUp(false);
        }
    };

    if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><div className="dot-pulse"></div></div>;

    const renderTabButton = (id: string, icon: string, label: string) => (
        <button
            onClick={() => setActiveTab(id)}
            style={{
                padding: '12px 24px',
                borderRadius: '12px',
                border: activeTab === id ? '1px solid var(--gray-200)' : '1px solid transparent',
                background: activeTab === id ? 'var(--surface)' : 'transparent',
                color: activeTab === id ? 'var(--primary)' : 'var(--gray-500)',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: activeTab === id ? 'var(--shadow-sm)' : 'none',
            }}
        >
            <span className="material-symbols-outlined">{icon}</span>
            {label}
        </button>
    );

    return (
        <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-1px', marginBottom: '8px' }}>Cấu hình hệ thống</h1>
                    <p style={{ color: 'var(--gray-500)', fontWeight: 600, margin: 0 }}>Quản lý tham số động, phân quyền AI và hệ thống lõi.</p>
                </div>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ padding: '12px 24px', borderRadius: '12px', fontWeight: 800 }}>
                    <span className="material-symbols-outlined">{saving ? 'sync' : 'save'}</span>
                    {saving ? 'Đang lưu...' : 'Lưu tất cả thay đổi'}
                </button>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
                {renderTabButton('general', 'settings', 'Cấu hình chung')}
                {renderTabButton('payment', 'payments', 'Thanh toán')}
                {renderTabButton('ai', 'smart_toy', 'AI & Phân quyền')}
                {renderTabButton('email', 'mail', 'Email SMTP')}
                {renderTabButton('backup', 'inventory_2', 'Backup & Nhật ký')}
            </div>

            <div className="glass-card" style={{ padding: '40px', borderRadius: 'var(--radius-xl)', minHeight: '500px' }}>
                {activeTab === 'general' && (
                    <div className="animate-fade-in" style={{ display: 'grid', gap: '24px' }}>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--ink)' }}>Cấu hình cơ bản</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: 'var(--gray-600)' }}>Tên hệ thống</label>
                                <input type="text" className="form-input" value={configs.app_name || ''} onChange={e => setConfigs({...configs, app_name: e.target.value})} placeholder="Rexi Veterinary Clinic" />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: 'var(--gray-600)' }}>Số ngày lưu trữ Backup</label>
                                <input type="number" className="form-input" value={configs.backup_retention_days || '7'} onChange={e => setConfigs({...configs, backup_retention_days: e.target.value})} />
                            </div>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: 'var(--gray-600)' }}>Danh sách IP bị chặn (Blacklist)</label>
                            <textarea className="form-input" style={{ minHeight: '100px', resize: 'vertical' }} value={configs.blocked_ips || ''} onChange={e => setConfigs({...configs, blocked_ips: e.target.value})} placeholder="192.168.1.1, 10.0.0.5" />
                            <p style={{ fontSize: '0.85rem', color: 'var(--gray-400)', marginTop: '8px' }}>Phân cách nhiều IP bằng dấu phẩy (,).</p>
                        </div>
                    </div>
                )}

                {activeTab === 'payment' && (
                    <div className="animate-fade-in" style={{ display: 'grid', gap: '32px' }}>
                        <div>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>qr_code_2</span> Cấu hình VietQR
                            </h2>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: 'var(--gray-600)' }}>Mã Ngân Hàng (Bank ID)</label>
                                    <input type="text" className="form-input" value={configs.vietqr_bank_id || ''} onChange={e => setConfigs({...configs, vietqr_bank_id: e.target.value})} placeholder="VD: MB, VCB, TCB..." />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: 'var(--gray-600)' }}>Số Tài Khoản</label>
                                    <input type="text" className="form-input" value={configs.vietqr_account_no || ''} onChange={e => setConfigs({...configs, vietqr_account_no: e.target.value})} placeholder="Nhập số tài khoản nhận tiền..." />
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: 'var(--gray-600)' }}>Tên Chủ Tài Khoản</label>
                                    <input type="text" className="form-input" value={configs.vietqr_account_name || ''} onChange={e => setConfigs({...configs, vietqr_account_name: e.target.value})} placeholder="TRAN MINH HOANG" />
                                </div>
                            </div>
                        </div>

                        <hr style={{ border: 'none', borderTop: '1px dashed var(--gray-200)' }} />

                        <div>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                <span className="material-symbols-outlined" style={{ color: '#005baa' }}>account_balance</span> Cổng thanh toán VNPay
                            </h2>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: 'var(--gray-600)' }}>vnp_TmnCode (Mã Website)</label>
                                    <input type="text" className="form-input" value={configs.vnpay_tmn_code || ''} onChange={e => setConfigs({...configs, vnpay_tmn_code: e.target.value})} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: 'var(--gray-600)' }}>vnp_HashSecret (Chuỗi Bí Mật)</label>
                                    <input type="password" className="form-input" value={configs.vnpay_hash_secret || ''} onChange={e => setConfigs({...configs, vnpay_hash_secret: e.target.value})} />
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: 'var(--gray-600)' }}>vnp_Url (URL Cổng Thanh Toán)</label>
                                    <input type="text" className="form-input" value={configs.vnpay_url || ''} onChange={e => setConfigs({...configs, vnpay_url: e.target.value})} placeholder="https://sandbox.vnpayment.vn/paymentv2/vpcpay.html" />
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: 'var(--gray-600)' }}>vnp_ReturnUrl (URL Trả Về)</label>
                                    <input type="text" className="form-input" value={configs.vnpay_return_url || ''} onChange={e => setConfigs({...configs, vnpay_return_url: e.target.value})} placeholder="http://localhost:5173/khach-hang/hoa-don-thanh-toan" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'email' && (
                    <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                        <div>
                            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '24px' }}>Thông số máy chủ SMTP</h2>
                            <div style={{ display: 'grid', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: 'var(--gray-600)' }}>Máy chủ Mail (Host)</label>
                                    <input type="text" className="form-input" value={configs.mail_host || ''} onChange={e => setConfigs({...configs, mail_host: e.target.value})} placeholder="smtp.gmail.com" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: 'var(--gray-600)' }}>Cổng (Port)</label>
                                    <input type="number" className="form-input" value={configs.mail_port || ''} onChange={e => setConfigs({...configs, mail_port: e.target.value})} placeholder="587" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: 'var(--gray-600)' }}>Tên đăng nhập (Username)</label>
                                    <input type="text" className="form-input" value={configs.mail_username || ''} onChange={e => setConfigs({...configs, mail_username: e.target.value})} placeholder="rexi.clinic@gmail.com" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: 'var(--gray-600)' }}>Mật khẩu ứng dụng (Password)</label>
                                    <input type="password" className="form-input" value={configs.mail_password || ''} onChange={e => setConfigs({...configs, mail_password: e.target.value})} placeholder="••••••••••••••••" />
                                </div>
                            </div>
                        </div>
                        <div style={{ background: 'var(--gray-50)', padding: '30px', borderRadius: '16px', border: '1px solid var(--gray-200)' }}>
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '16px' }}>Kiểm tra cấu hình (Gửi Test)</h2>
                            <p style={{ fontSize: '0.9rem', color: 'var(--gray-500)', marginBottom: '20px' }}>
                                Thử nghiệm gửi email bằng các thông số SMTP bạn vừa nhập bên trên. Lệnh test sẽ được gửi trực tiếp mà không cần lưu.
                            </p>
                            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: 'var(--gray-600)' }}>Gửi đến địa chỉ Email</label>
                            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
                                <input type="email" className="form-input" style={{ flex: 1 }} value={testEmailTo} onChange={e => setTestEmailTo(e.target.value)} placeholder="example@gmail.com" />
                                <button className="btn btn-primary" onClick={handleTestEmail} disabled={testingEmail} style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {testingEmail ? <span className="material-symbols-outlined" style={{ animation: 'spinBtn 1s linear infinite' }}>sync</span> : <span className="material-symbols-outlined">send</span>}
                                    {testingEmail ? 'Đang gửi...' : 'Gửi Test'}
                                </button>
                            </div>
                            {testEmailResult && (
                                <div style={{ 
                                    padding: '16px', 
                                    borderRadius: '12px', 
                                    background: testEmailResult.success ? 'var(--success-light)' : 'var(--danger-light)', 
                                    color: testEmailResult.success ? 'var(--success)' : 'var(--danger)',
                                    border: `1px solid ${testEmailResult.success ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                                    display: 'flex', gap: '12px', alignItems: 'flex-start'
                                }}>
                                    <span className="material-symbols-outlined">{testEmailResult.success ? 'check_circle' : 'error'}</span>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 600, wordBreak: 'break-word' }}>
                                        {testEmailResult.message}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'ai' && (
                    <div className="animate-fade-in">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '40px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: 'var(--gray-600)' }}>OpenRouter API Key (Mặc định)</label>
                                <input type="password" className="form-input" value={configs.openrouter_api_key || ''} onChange={e => setConfigs({...configs, openrouter_api_key: e.target.value})} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: 'var(--gray-600)' }}>OpenRouter Model</label>
                                <input type="text" className="form-input" value={configs.openrouter_model || ''} onChange={e => setConfigs({...configs, openrouter_model: e.target.value})} placeholder="deepseek/deepseek-v4-flash:free" />
                            </div>
                        </div>

                        <hr style={{ border: 'none', borderTop: '1px dashed var(--gray-200)', marginBottom: '30px' }} />
                        
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '8px' }}>Ma trận phân quyền tác vụ AI (Action Policy)</h2>
                        <p style={{ color: 'var(--gray-500)', marginBottom: '24px' }}>Cấu hình những hành động mà Trợ lý ảo Rexi được phép thực hiện dựa trên vai trò của người dùng đang chat.</p>

                        <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid var(--gray-200)', boxShadow: 'var(--shadow-sm)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', background: 'var(--surface)' }}>
                                <thead style={{ background: 'var(--gray-50)' }}>
                                    <tr>
                                        <th style={{ padding: '16px', textAlign: 'left', fontWeight: 800, color: 'var(--gray-600)', borderBottom: '2px solid var(--gray-200)' }}>Hành động (Action)</th>
                                        {ROLES.map(role => (
                                            <th key={role} style={{ padding: '16px', fontWeight: 800, color: 'var(--primary)', borderBottom: '2px solid var(--gray-200)', textTransform: 'capitalize' }}>
                                                {role === 'guest' ? 'Khách (Guest)' : role}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {ACTIONS.map(action => (
                                        <tr key={action.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                                            <td style={{ padding: '16px', textAlign: 'left', fontWeight: 700, color: 'var(--ink)' }}>
                                                {action.name} <br/>
                                                <span style={{ fontSize: '0.75rem', color: 'var(--gray-400)', fontWeight: 500 }}>{action.id}</span>
                                            </td>
                                            {ROLES.map(role => {
                                                const isChecked = (aiPolicy[role] || []).includes(action.id);
                                                return (
                                                    <td key={role} style={{ padding: '16px' }}>
                                                        <label style={{ display: 'inline-flex', cursor: 'pointer', position: 'relative' }}>
                                                            <input 
                                                                type="checkbox" 
                                                                checked={isChecked}
                                                                onChange={() => handlePolicyToggle(role, action.id)}
                                                                style={{ 
                                                                    width: '24px', height: '24px', 
                                                                    accentColor: 'var(--primary)',
                                                                    cursor: 'pointer' 
                                                                }} 
                                                            />
                                                        </label>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'backup' && (
                    <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
                        <div>
                            <div style={{ padding: '24px', background: 'var(--gray-50)', borderRadius: '16px', border: '1px solid var(--gray-200)', marginBottom: '24px' }}>
                                <h3 style={{ fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><span className="material-symbols-outlined" style={{ color: 'var(--success)' }}>inventory_2</span> Sao lưu thủ công</h3>
                                <p style={{ fontSize: '0.9rem', color: 'var(--gray-500)', marginBottom: '20px' }}>Tạo ngay một bản sao lưu toàn bộ cơ sở dữ liệu hệ thống.</p>
                                <button className="btn btn-outline" onClick={() => fetchBackups()} style={{ width: '100%', marginBottom: '12px' }}>Làm mới danh sách</button>
                                <button className="btn btn-primary" onClick={handleCreateBackup} disabled={backingUp} style={{ width: '100%', background: 'var(--success)', borderColor: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <span className="material-symbols-outlined" style={{ animation: backingUp ? 'spinBtn 1s linear infinite' : 'none' }}>{backingUp ? 'sync' : 'backup'}</span>
                                    {backingUp ? 'Đang sao lưu...' : 'Sao lưu ngay'}
                                </button>
                            </div>
                            
                            <h3 style={{ fontWeight: 800, marginBottom: '12px' }}>Danh sách bản sao lưu</h3>
                            <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--gray-200)', borderRadius: '12px', background: 'var(--surface)' }}>
                                {backups.length === 0 ? <p style={{ padding: '20px', textAlign: 'center', color: 'var(--gray-400)' }}>Chưa có file backup.</p> : (
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                        {backups.map((b, idx) => (
                                            <li key={idx} style={{ padding: '12px', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{b.filename}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{(b.size/1024/1024).toFixed(2)} MB • {new Date(b.lastModified).toLocaleDateString('vi-VN')}</div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                                    {/* Nút tải file backup về máy */}
                                                    <button
                                                        title="Tải xuống"
                                                        style={{ background: 'none', border: 'none', color: 'var(--success)', cursor: 'pointer', padding: '4px' }}
                                                        onClick={() => handleDownloadBackup(b.filename)}
                                                    >
                                                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
                                                    </button>
                                                    {/* Nút xóa file backup */}
                                                    <button
                                                        title="Xóa"
                                                        style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}
                                                        onClick={() => handleDeleteBackup(b.filename)}
                                                    >
                                                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <h3 style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}><span className="material-symbols-outlined" style={{ color: 'var(--warning)' }}>history</span> Nhật ký hoạt động</h3>
                                <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                                    onClick={async () => {
                                        if (window.confirm('Bạn có chắc chắn muốn xóa sạch toàn bộ nhật ký hệ thống?')) {
                                            try {
                                                await axiosInstance.delete('/api/system/nhat-ky/clear');
                                                toast.success('Đã xóa sạch nhật ký!');
                                                fetchLogs();
                                            } catch (err: any) {
                                                toast.error('Lỗi khi xóa nhật ký: ' + err.message);
                                            }
                                        }
                                    }}
                                >
                                    Xóa nhật ký
                                </button>
                            </div>
                            <div style={{ maxHeight: '500px', overflowY: 'auto', border: '1px solid var(--gray-200)', borderRadius: '12px', background: 'var(--surface)' }}>
                                {logs.length === 0 ? <p style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-400)' }}>Chưa có nhật ký.</p> : (
                                    <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                                        <tbody>
                                            {logs.map((log) => (
                                                <tr key={log.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                                                    <td style={{ padding: '12px', color: 'var(--gray-500)', whiteSpace: 'nowrap' }}>{chuyenNgayGioISO_SangVN(log.ngay_tao)}</td>
                                                    <td style={{ padding: '12px', fontWeight: 800, color: 'var(--primary)' }}>{log.nguoi_thao_tac}</td>
                                                    <td style={{ padding: '12px', fontWeight: 700 }}>
                                                        <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'var(--gray-100)', marginRight: '8px' }}>{log.hanh_dong}</span>
                                                        {log.bang_du_lieu}
                                                    </td>
                                                    <td style={{ padding: '12px', color: 'var(--gray-500)' }}>{log.chi_tiet}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .form-input {
                    width: 100%;
                    padding: 12px 16px;
                    border-radius: 12px;
                    border: 1px solid var(--gray-200);
                    background: var(--surface);
                    color: var(--ink);
                    outline: none;
                    transition: all 0.2s;
                    font-family: inherit;
                }
                .form-input:focus {
                    border-color: var(--primary);
                    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
                }
            `}</style>
        </div>
    );
};

export default CauHinhHeThong;
