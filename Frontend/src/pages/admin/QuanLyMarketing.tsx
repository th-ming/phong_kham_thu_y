import React, { useState, useEffect } from 'react';
import axiosInstance from '@services/axios';

const QuanLyMarketing: React.FC = () => {
    const [subscribersCount, setSubscribersCount] = useState(0);
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

    // Lấy số lượng người đăng ký thực tế từ Backend
    useEffect(() => {
        axiosInstance.get('/api/system/newsletter/count')
            .then(res => {
                setSubscribersCount(res.data.count || 0);
            })
            .catch(err => {
                console.error("Lỗi lấy số lượng sub:", err);
                setSubscribersCount(0);
            });
    }, []);

    const handleSend = async () => {
        if (!subject || !content) {
            setStatus({ type: 'error', msg: 'Sếp vui lòng nhập đủ tiêu đề và nội dung nhé!' });
            return;
        }

        setLoading(true);
        setStatus(null);

        try {
            const response = await axiosInstance.post('/api/system/send-mass-email', {
                subject,
                content
            });

            if (response.data.success) {
                setStatus({ type: 'success', msg: `Bắn mail thành công tới ${subscribersCount} khách hàng! 🚀` });
                setSubject('');
                setContent('');
            }
        } catch (error) {
            setStatus({ type: 'error', msg: 'Có lỗi khi gửi mail, sếp kiểm tra lại quyền hạn hoặc kết nối nhé!' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '40px', background: 'var(--background)', minHeight: '100vh' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <header style={{ marginBottom: '40px' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--ink)', marginBottom: '10px' }}>
                        Trung Tâm <span style={{ color: 'var(--primary)' }}>Marketing</span> 🚀
                    </h1>
                    <p style={{ color: 'var(--gray-500)', fontSize: '1.1rem' }}>Gửi chương trình ưu đãi và kiến thức tới hàng ngàn khách hàng của Rexi.</p>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }}>
                    {/* Thống kê nhanh */}
                    <div className="glass-card" style={{ padding: '30px', borderRadius: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', width: '60px', height: '60px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                            <span className="material-symbols-outlined">group</span>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.9rem', color: 'var(--gray-500)', fontWeight: 600 }}>Người đăng ký nhận tin</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--ink)' }}>{subscribersCount} khách hàng</div>
                        </div>
                    </div>

                    {/* Form soạn thảo */}
                    <div className="glass-card" style={{ padding: '40px', borderRadius: '32px' }}>
                        <h3 style={{ marginBottom: '25px', fontWeight: 800, fontSize: '1.3rem', color: 'var(--ink)' }}>Soạn chiến dịch mới</h3>

                        <div style={{ marginBottom: '25px' }}>
                            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 700, color: 'var(--gray-500)' }}>Tiêu đề email</label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Ví dụ: 🎁 Ưu đãi 50% Spa cuối tuần..."
                                style={{ width: '100%', padding: '16px 20px', borderRadius: '16px', border: '1px solid var(--gray-200)', background: 'var(--surface)', color: 'var(--ink)', outline: 'none', transition: '0.3s', fontSize: '1rem' }}
                            />
                        </div>

                        <div style={{ marginBottom: '30px' }}>
                            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 700, color: 'var(--gray-500)' }}>Nội dung thông điệp</label>
                            <textarea
                                rows={8}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Sếp nhập nội dung ưu đãi vào đây nhé..."
                                style={{ width: '100%', padding: '20px', borderRadius: '20px', border: '1px solid var(--gray-200)', background: 'var(--surface)', color: 'var(--ink)', outline: 'none', transition: '0.3s', fontSize: '1rem', resize: 'vertical' }}
                            />
                        </div>

                        {status && (
                            <div style={{
                                padding: '16px 20px',
                                borderRadius: '16px',
                                marginBottom: '25px',
                                background: status.type === 'success' ? 'var(--green-50)' : 'var(--red-50)',
                                color: status.type === 'success' ? 'var(--green-600)' : 'var(--red-600)',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                border: `1px solid ${status.type === 'success' ? 'var(--green-200)' : 'var(--red-200)'}`
                            }}>
                                <span className="material-symbols-outlined">{status.type === 'success' ? 'check_circle' : 'error'}</span>
                                {status.msg}
                            </div>
                        )}

                        <button
                            onClick={handleSend}
                            disabled={loading}
                            className={loading ? "btn" : "btn btn-primary hover-lift"}
                            style={{
                                width: '100%',
                                padding: '18px',
                                borderRadius: '18px',
                                border: 'none',
                                background: loading ? 'var(--gray-300)' : 'var(--primary-gradient)',
                                color: 'white',
                                fontWeight: 800,
                                fontSize: '1.1rem',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                transition: '0.3s'
                            }}
                        >
                            {loading ? 'Đang "bắn" mail...' : 'GỬI CHIẾN DỊCH NGAY 🚀'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuanLyMarketing;
