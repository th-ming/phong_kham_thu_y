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
            setStatus({ type: 'error', msg: 'Có lỗi khi gửi mail, sếp kiểm tra lại kết nối nhé!' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '40px', background: '#f8fafc', minHeight: '100vh' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                <header style={{ marginBottom: '40px' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1e293b', marginBottom: '10px' }}>
                        Trung Tâm <span style={{ color: '#0f9d8a' }}>Marketing</span> 🚀
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '1.1rem' }}>Gửi chương trình ưu đãi và kiến thức tới hàng ngàn khách hàng của Rexi.</p>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }}>
                    {/* Thống kê nhanh */}
                    <div style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ background: '#ecfdf5', color: '#059669', width: '60px', height: '60px', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                            <span className="material-symbols-outlined">group</span>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.9rem', color: '#64748b', fontWeight: 600 }}>Người đăng ký nhận tin</div>
                            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#1e293b' }}>{subscribersCount} khách hàng</div>
                        </div>
                    </div>

                    {/* Form soạn thảo */}
                    <div style={{ background: 'white', padding: '40px', borderRadius: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.08)' }}>
                        <h3 style={{ marginBottom: '25px', fontWeight: 800, fontSize: '1.3rem' }}>Soạn chiến dịch mới</h3>

                        <div style={{ marginBottom: '25px' }}>
                            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 700, color: '#475569' }}>Tiêu đề email</label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                placeholder="Ví dụ: 🎁 Ưu đãi 50% Spa cuối tuần..."
                                style={{ width: '100%', padding: '16px 20px', borderRadius: '16px', border: '2px solid #f1f5f9', outline: 'none', transition: '0.3s', fontSize: '1rem' }}
                            />
                        </div>

                        <div style={{ marginBottom: '30px' }}>
                            <label style={{ display: 'block', marginBottom: '10px', fontWeight: 700, color: '#475569' }}>Nội dung thông điệp</label>
                            <textarea
                                rows={8}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Sếp nhập nội dung ưu đãi vào đây nhé..."
                                style={{ width: '100%', padding: '20px', borderRadius: '20px', border: '2px solid #f1f5f9', outline: 'none', transition: '0.3s', fontSize: '1rem', resize: 'vertical' }}
                            />
                        </div>

                        {status && (
                            <div style={{
                                padding: '16px 20px',
                                borderRadius: '16px',
                                marginBottom: '25px',
                                background: status.type === 'success' ? '#f0fdf4' : '#fef2f2',
                                color: status.type === 'success' ? '#15803d' : '#b91c1c',
                                fontWeight: 600,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                <span className="material-symbols-outlined">{status.type === 'success' ? 'check_circle' : 'error'}</span>
                                {status.msg}
                            </div>
                        )}

                        <button
                            onClick={handleSend}
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '18px',
                                borderRadius: '18px',
                                border: 'none',
                                background: loading ? '#94a3b8' : 'linear-gradient(135deg, #0f9d8a, #0d9488)',
                                color: 'white',
                                fontWeight: 800,
                                fontSize: '1.1rem',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                transition: '0.3s',
                                boxShadow: '0 10px 20px rgba(15, 157, 138, 0.3)'
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
