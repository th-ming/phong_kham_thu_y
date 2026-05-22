import React, { useState, useEffect } from 'react';
import axiosInstance from '@services/axios';
import { toast } from '@components/Toast';

const chuyenNgayGioISO_SangVN = (dateString: string) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
};

const ROLES = [
    { id: 'admin', name: 'Admin' },
    { id: 'quan_ly', name: 'Quản lý' },
    { id: 'bac_si', name: 'Bác sĩ' },
    { id: 'ke_toan', name: 'Kế toán' },
    { id: 'tiep_tan', name: 'Tiếp tân' },
    { id: 'y_ta', name: 'Y tá' },
    { id: 'staff', name: 'Nhân viên' },
    { id: 'customer', name: 'Khách hàng' },
    { id: 'guest', name: 'Khách vãng lai' }
];
const ACTIONS = [
    { id: 'CLICK', name: 'Tự bấm nút / mở màn hình' },
    { id: 'FILL', name: 'Tự điền dữ liệu vào form' },
    { id: 'SELECT', name: 'Tự chọn giá trị trong danh sách' },
    { id: 'TOGGLE', name: 'Tự bật / tắt lựa chọn' },
    { id: 'DELETE', name: 'Tự thao tác xóa sau xác nhận' }
];

const DEFAULT_AI_POLICY: Record<string, string[]> = {
    admin: ['CLICK', 'FILL', 'SELECT', 'TOGGLE', 'DELETE'],
    quan_ly: ['CLICK', 'FILL', 'SELECT', 'TOGGLE'],
    bac_si: ['CLICK', 'FILL', 'SELECT', 'TOGGLE'],
    ke_toan: ['CLICK', 'FILL', 'SELECT', 'TOGGLE'],
    tiep_tan: ['CLICK', 'FILL', 'SELECT', 'TOGGLE'],
    y_ta: ['CLICK', 'FILL', 'SELECT', 'TOGGLE'],
    staff: ['CLICK', 'FILL', 'SELECT'],
    customer: ['CLICK', 'FILL', 'SELECT'],
    guest: ['CLICK']
};

const CauHinhHeThong: React.FC = () => {
    const [configs, setConfigs] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [backingUp, setBackingUp] = useState(false);
    const [deletingBackups, setDeletingBackups] = useState(false);
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
                    const parsedPolicy = JSON.parse(res.data.ai_action_policy);
                    const hasRealActionIds = Object.values(parsedPolicy).some((actions: any) =>
                        Array.isArray(actions) && actions.some((action) => ACTIONS.some(a => a.id === action))
                    );
                    setAiPolicy(hasRealActionIds ? { ...DEFAULT_AI_POLICY, ...parsedPolicy } : DEFAULT_AI_POLICY);
                } else {
                    setAiPolicy(DEFAULT_AI_POLICY);
                }
            } catch(e) {
                setAiPolicy(DEFAULT_AI_POLICY);
            }
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
            await axiosInstance.delete(`/api/system/backups/${encodeURIComponent(filename)}`);
            toast.success('Đã xóa bản sao lưu!');
            fetchBackups();
            fetchLogs();
        } catch (error: any) {
            toast.error('Lỗi khi xóa file: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDeleteAllBackups = async () => {
        if (backups.length === 0 || deletingBackups) return;
        const confirm = window.confirm(`Bạn có chắc chắn muốn xóa tất cả ${backups.length} bản sao lưu? Thao tác này không thể khôi phục.`);
        if (!confirm) return;

        setDeletingBackups(true);
        try {
            const results = await Promise.allSettled(
                backups.map((backup) => axiosInstance.delete(`/api/system/backups/${encodeURIComponent(backup.filename)}`))
            );
            const failed = results.filter(result => result.status === 'rejected').length;
            if (failed > 0) {
                toast.error(`Đã xóa một phần, còn ${failed} bản sao lưu chưa xóa được.`);
            } else {
                toast.success('Đã xóa tất cả bản sao lưu!');
            }
            fetchBackups();
            fetchLogs();
        } catch (error: any) {
            toast.error('Lỗi khi xóa tất cả bản sao lưu: ' + (error.response?.data?.message || error.message));
        } finally {
            setDeletingBackups(false);
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

    const handlePanelMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
        const rect = event.currentTarget.getBoundingClientRect();
        event.currentTarget.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
        event.currentTarget.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
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
                        <div className="responsive-grid-2">
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
                            <div className="responsive-grid-2">
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
                            <div className="responsive-grid-2">
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
                        <div style={{ display: 'grid', gap: '24px', marginBottom: '40px' }}>
                            <div>
                                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>hub</span>
                                    Cấu hình các AI Provider
                                </h2>
                                <p style={{ color: 'var(--gray-500)', margin: 0 }}>Các khóa này được backend đọc trực tiếp từ bảng cấu hình khi gọi AI. Để trống thì hệ thống dùng giá trị fallback trong môi trường chạy.</p>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
                                <div style={{ padding: '20px', border: '1px solid var(--gray-200)', borderRadius: '16px', background: 'var(--surface)' }}>
                                    <h3 style={{ margin: '0 0 16px', color: 'var(--ink)', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span className="material-symbols-outlined" style={{ color: '#10b981' }}>speed</span>
                                        Groq
                                    </h3>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: 'var(--gray-600)' }}>API Key</label>
                                    <input type="password" className="form-input" value={configs.groq_api_key || ''} onChange={e => setConfigs({...configs, groq_api_key: e.target.value})} placeholder="gsk_..." />
                                    <label style={{ display: 'block', margin: '14px 0 8px', fontWeight: 700, color: 'var(--gray-600)' }}>Model</label>
                                    <input type="text" className="form-input" value={configs.groq_model || ''} onChange={e => setConfigs({...configs, groq_model: e.target.value})} placeholder="llama-3.3-70b-versatile" />
                                    <label style={{ display: 'block', margin: '14px 0 8px', fontWeight: 700, color: 'var(--gray-600)' }}>Model phân tích ảnh</label>
                                    <input type="text" className="form-input" value={configs.groq_vision_model || ''} onChange={e => setConfigs({...configs, groq_vision_model: e.target.value})} placeholder="meta-llama/llama-4-scout-17b-16e-instruct" />
                                </div>

                                <div style={{ padding: '20px', border: '1px solid var(--gray-200)', borderRadius: '16px', background: 'var(--surface)' }}>
                                    <h3 style={{ margin: '0 0 16px', color: 'var(--ink)', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span className="material-symbols-outlined" style={{ color: '#f59e0b' }}>auto_awesome</span>
                                        Gemini
                                    </h3>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: 'var(--gray-600)' }}>API Key</label>
                                    <input type="password" className="form-input" value={configs.gemini_api_key || ''} onChange={e => setConfigs({...configs, gemini_api_key: e.target.value})} placeholder="AIza... hoặc nhiều key cách nhau bằng dấu phẩy" />
                                    <label style={{ display: 'block', margin: '14px 0 8px', fontWeight: 700, color: 'var(--gray-600)' }}>Model</label>
                                    <input type="text" className="form-input" value={configs.gemini_model || ''} onChange={e => setConfigs({...configs, gemini_model: e.target.value})} placeholder="gemini-3.5-flash" />
                                </div>

                                <div style={{ padding: '20px', border: '1px solid var(--gray-200)', borderRadius: '16px', background: 'var(--surface)' }}>
                                    <h3 style={{ margin: '0 0 16px', color: 'var(--ink)', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span className="material-symbols-outlined" style={{ color: '#22d3ee' }}>route</span>
                                        OpenRouter
                                    </h3>
                                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 700, color: 'var(--gray-600)' }}>API Key</label>
                                    <input type="password" className="form-input" value={configs.openrouter_api_key || ''} onChange={e => setConfigs({...configs, openrouter_api_key: e.target.value})} placeholder="sk-or-..." />
                                    <label style={{ display: 'block', margin: '14px 0 8px', fontWeight: 700, color: 'var(--gray-600)' }}>Model</label>
                                    <input type="text" className="form-input" value={configs.openrouter_model || ''} onChange={e => setConfigs({...configs, openrouter_model: e.target.value})} placeholder="deepseek/deepseek-v4-flash:free" />
                                </div>
                            </div>
                        </div>

                        <hr style={{ border: 'none', borderTop: '1px dashed var(--gray-200)', marginBottom: '30px' }} />
                        
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '8px' }}>Ma trận phân quyền tác vụ AI (Action Policy)</h2>
                        <p style={{ color: 'var(--gray-500)', marginBottom: '24px' }}>Cấu hình những hành động mà Trợ lý ảo Rexi được phép thực hiện dựa trên vai trò của người dùng đang chat.</p>

                        <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid var(--gray-200)', boxShadow: 'var(--shadow-sm)' }}>
                            <div className="table-responsive-wrapper">
<div style={{ minWidth: '800px' }}>
<table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', background: 'var(--surface)' }}>
                                <thead style={{ background: 'var(--gray-50)' }}>
                                    <tr>
                                        <th style={{ padding: '16px', textAlign: 'left', fontWeight: 800, color: 'var(--gray-600)', borderBottom: '2px solid var(--gray-200)' }}>Hành động (Action)</th>
                                        {ROLES.map(role => (
                                            <th key={role.id} style={{ padding: '16px', fontWeight: 800, color: 'var(--primary)', borderBottom: '2px solid var(--gray-200)' }}>
                                                {role.name}
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
                                                const isChecked = (aiPolicy[role.id] || []).includes(action.id);
                                                return (
                                                    <td key={role.id} style={{ padding: '16px' }}>
                                                        <label style={{ display: 'inline-flex', cursor: 'pointer', position: 'relative' }}>
                                                            <input 
                                                                type="checkbox" 
                                                                checked={isChecked}
                                                                onChange={() => handlePolicyToggle(role.id, action.id)}
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
</div></div>
                        </div>
                    </div>
                )}

                {activeTab === 'backup' && (
                    <div className="backup-grid animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 0.9fr) minmax(0, 1.6fr)', gap: '30px', width: '100%', minWidth: 0 }}>
                        <div style={{ minWidth: 0 }}>
                            <div className="settings-panel-interactive" onMouseMove={handlePanelMouseMove} style={{ padding: '24px', background: 'var(--gray-50)', borderRadius: '16px', border: '1px solid var(--gray-200)', marginBottom: '24px', minWidth: 0 }}>
                                <h3 style={{ fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>inventory_2</span> Sao lưu thủ công</h3>
                                <p style={{ fontSize: '0.9rem', color: 'var(--gray-500)', marginBottom: '20px' }}>Tạo ngay một bản sao lưu toàn bộ cơ sở dữ liệu hệ thống.</p>
                                <button className="btn btn-outline settings-action-btn" onClick={() => fetchBackups()} style={{ width: '100%', marginBottom: '12px' }}>Làm mới danh sách</button>
                                <button className="btn btn-primary settings-action-btn" onClick={handleCreateBackup} disabled={backingUp} style={{
                                    width: '100%',
                                    background: backingUp ? 'rgba(34, 211, 238, 0.55)' : 'var(--primary-gradient)',
                                    borderColor: 'rgba(34, 211, 238, 0.45)',
                                    color: 'white',
                                    boxShadow: backingUp ? 'none' : '0 14px 30px rgba(6, 182, 212, 0.24)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px'
                                }}>
                                    <span className="material-symbols-outlined" style={{ animation: backingUp ? 'spinBtn 1s linear infinite' : 'none' }}>{backingUp ? 'sync' : 'backup'}</span>
                                    {backingUp ? 'Đang sao lưu...' : 'Sao lưu ngay'}
                                </button>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <h3 style={{ fontWeight: 800, margin: 0 }}>Danh sách bản sao lưu</h3>
                                <button
                                    className="btn btn-outline settings-action-btn"
                                    disabled={backups.length === 0 || deletingBackups}
                                    onClick={handleDeleteAllBackups}
                                    style={{
                                        padding: '6px 12px',
                                        fontSize: '0.78rem',
                                        color: backups.length === 0 ? 'var(--gray-400)' : 'var(--danger)',
                                        borderColor: backups.length === 0 ? 'var(--gray-200)' : 'var(--danger)',
                                        opacity: backups.length === 0 || deletingBackups ? 0.62 : 1,
                                        whiteSpace: 'nowrap'
                                    }}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: '16px', animation: deletingBackups ? 'spinBtn 1s linear infinite' : 'none' }}>{deletingBackups ? 'sync' : 'delete_sweep'}</span>
                                    {deletingBackups ? 'Đang xóa...' : 'Xóa tất cả'}
                                </button>
                            </div>
                            <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--gray-200)', borderRadius: '12px', background: 'var(--surface)' }}>
                                {backups.length === 0 ? <p style={{ padding: '20px', textAlign: 'center', color: 'var(--gray-400)' }}>Chưa có file backup.</p> : (
                                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                        {backups.map((b, idx) => (
                                            <li className="settings-list-row" key={idx} style={{ padding: '12px', borderBottom: '1px solid var(--gray-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <div>
                                                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{b.filename}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>{(b.size/1024/1024).toFixed(2)} MB • {new Date(b.lastModified).toLocaleDateString('vi-VN')}</div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                                    {/* Nút tải file backup về máy */}
                                                    <button
                                                        title="Tải xuống"
                                                        style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '4px' }}
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

                        <div style={{ minWidth: 0, overflow: 'hidden' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '16px', minWidth: 0 }}>
                                <h3 style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}><span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>history</span> Nhật ký hoạt động</h3>
                                <button className="btn btn-outline settings-action-btn" style={{ padding: '6px 12px', fontSize: '0.8rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}
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
                            <div style={{ maxHeight: '500px', overflow: 'auto', border: '1px solid var(--gray-200)', borderRadius: '12px', background: 'var(--surface)', width: '100%', minWidth: 0 }}>
                                {logs.length === 0 ? <p style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-400)' }}>Chưa có nhật ký.</p> : (
                                    <div className="table-responsive-wrapper">
<div style={{ minWidth: '800px' }}>
<table style={{ width: '100%', minWidth: 0, tableLayout: 'fixed', fontSize: '0.85rem', borderCollapse: 'collapse' }}>
                                        <tbody>
                                            {logs.map((log) => (
                                                <tr className="settings-log-row" key={log.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                                                    <td style={{ padding: '12px', color: 'var(--gray-500)', width: '22%', whiteSpace: 'normal', wordBreak: 'break-word' }}>{chuyenNgayGioISO_SangVN(log.ngay_tao)}</td>
                                                    <td style={{ padding: '12px', fontWeight: 800, color: 'var(--primary)', width: '18%', wordBreak: 'break-word' }}>{log.nguoi_thao_tac}</td>
                                                    <td style={{ padding: '12px', fontWeight: 700, width: '28%', wordBreak: 'break-word' }}>
                                                        <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'var(--gray-100)', marginRight: '8px' }}>{log.hanh_dong}</span>
                                                        {log.bang_du_lieu}
                                                    </td>
                                                    <td style={{ padding: '12px', color: 'var(--gray-500)', width: '32%', wordBreak: 'break-word' }}>{log.chi_tiet}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
</div></div>
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
                .settings-panel-interactive {
                    position: relative;
                    overflow: hidden;
                    transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease, background 0.22s ease;
                }
                .settings-panel-interactive::before {
                    content: "";
                    position: absolute;
                    inset: 0;
                    background: radial-gradient(circle at var(--spot-x, 50%) var(--spot-y, 0%), rgba(34, 211, 238, 0.12), transparent 42%);
                    opacity: 0;
                    transition: opacity 0.22s ease;
                    pointer-events: none;
                }
                .settings-panel-interactive:hover {
                    transform: translateY(-2px);
                    border-color: rgba(34, 211, 238, 0.42) !important;
                    box-shadow: 0 18px 42px rgba(6, 182, 212, 0.12);
                }
                .settings-panel-interactive:hover::before {
                    opacity: 1;
                }
                .settings-action-btn {
                    position: relative;
                    overflow: hidden;
                }
                .settings-action-btn::after {
                    content: "";
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent);
                    transform: translateX(-120%) skewX(-16deg);
                    transition: transform 0.55s ease;
                    pointer-events: none;
                }
                .settings-action-btn:hover::after {
                    transform: translateX(120%) skewX(-16deg);
                }
                .settings-action-btn:hover {
                    filter: brightness(1.06);
                }
                .settings-list-row,
                .settings-log-row {
                    transition: background 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease;
                }
                .settings-list-row:hover {
                    background: rgba(34, 211, 238, 0.07);
                    transform: translateX(3px);
                    box-shadow: inset 3px 0 0 var(--primary);
                }
                .settings-log-row:hover {
                    background: rgba(34, 211, 238, 0.055);
                    box-shadow: inset 3px 0 0 rgba(34, 211, 238, 0.7);
                }
                @media (max-width: 1180px) {
                    .backup-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
                @media (prefers-reduced-motion: reduce) {
                    .settings-panel-interactive,
                    .settings-action-btn,
                    .settings-list-row,
                    .settings-log-row {
                        transition: none !important;
                        animation: none !important;
                    }
                    .settings-panel-interactive:hover,
                    .settings-list-row:hover {
                        transform: none !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default CauHinhHeThong;
