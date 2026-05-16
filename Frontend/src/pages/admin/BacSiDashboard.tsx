import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "@services/axios";
import { getUserProfile } from "@utils/index";

const BacSiDashboard: React.FC = () => {
    const [myAppointments, setMyAppointments] = useState<any[]>([]);
    const [myMedicalRecords, setMyMedicalRecords] = useState<any[]>([]);
    const [weeklyStats, setWeeklyStats] = useState<{ date: string, count: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const user = useMemo(() => getUserProfile() || {}, []);
    const currentUserId = user?.id_nhan_vien || user?.id;

    useEffect(() => {
        const fetchData = async (showLoading = true) => {
            if (!currentUserId) {
                setLoading(false);
                return;
            }
            if (showLoading) setLoading(true);
            try {
                const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

                const [appsRes, recordsRes] = await Promise.all([
                    axiosInstance.get(`/api/lich-hen?page=0&size=200`), // Fetch a large number
                    axiosInstance.get(`/api/ho-so-benh-an?page=0&size=50`)
                ]);

                const extractArray = (data: any): any[] => {
                    if (!data) return [];
                    if (Array.isArray(data)) return data;
                    return data.content || [];
                };

                const allApps = extractArray(appsRes.data);
                const myTodaysApps = allApps.filter(a => a.ngay_kham === todayStr && String(a.id_bac_si) === String(currentUserId));
                setMyAppointments(myTodaysApps);

                const last7Days = Array.from({ length: 7 }, (_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
                }).reverse();

                const weeklyData = last7Days.map(dateStr => {
                    const count = allApps.filter(a => a.ngay_kham === dateStr && String(a.id_bac_si) === String(currentUserId) && a.trang_thai?.toUpperCase() === 'HOAN_THANH').length;
                    const [, month, day] = dateStr.split('-');
                    return { date: `${day}/${month}`, count };
                });
                setWeeklyStats(weeklyData);

                const allRecords = extractArray(recordsRes.data);
                const myRecentRecords = allRecords.filter(r => String(r.id_bac_si) === String(currentUserId)).slice(0, 5);
                setMyMedicalRecords(myRecentRecords);

            } catch (err) {
                console.error("Lỗi tải dữ liệu dashboard bác sĩ:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();

        // Tự động làm mới danh sách bệnh nhân đang chờ ngầm
        const interval = setInterval(() => {
            fetchData(false);
        }, 30000);

        return () => clearInterval(interval);
    }, [currentUserId]);

    const waitingPatients = myAppointments.filter(a => a.trang_thai?.toUpperCase() === 'DA_XAC_NHAN').length;
    const completedPatients = myAppointments.filter(a => a.trang_thai?.toUpperCase() === 'HOAN_THANH').length;

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}><div className="dot-pulse"></div></div>;
    }

    return (
        <div className="animate-fade-in">
            <style>{`
                @keyframes pulseWarning {
                    0% { transform: scale(1); text-shadow: 0 0 0 rgba(245, 158, 11, 0); }
                    50% { transform: scale(1.05); text-shadow: 0 0 15px rgba(245, 158, 11, 0.7); }
                    100% { transform: scale(1); text-shadow: 0 0 0 rgba(245, 158, 11, 0); }
                }
                .pulse-text {
                    animation: pulseWarning 1.5s infinite ease-in-out;
                }
            `}</style>
            <div className="animate-slide-up stagger-1" style={{ marginBottom: '40px', padding: '48px', borderRadius: 'var(--radius-xl)', background: 'var(--primary-gradient)', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-2xl)' }}>
                <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '300px', height: '300px', background: 'radial-gradient(circle, var(--primary-light) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
                <h1 style={{ fontSize: '3rem', fontWeight: 950, letterSpacing: '-1.5px', position: 'relative', zIndex: 1, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span>Bảng điều khiển <span style={{ color: '#c4b5fd' }}>Bác sĩ & Y tá</span></span>
                    <span style={{ filter: 'drop-shadow(0 5px 15px rgba(0,0,0,0.2))' }}>🩺</span>
                </h1>
                <p style={{ fontWeight: 700, color: 'rgba(255,255,255,0.95)', position: 'relative', zIndex: 1, margin: 0, fontSize: '1.2rem', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>Chào mừng trở lại, {user.ho_ten || 'Bác sĩ'}. Dưới đây là lịch trình và công việc của bạn hôm nay.</p>
            </div>

            {/* Các thẻ thống kê */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                <div className="glass-card" style={{ padding: '24px', borderRadius: '24px', borderLeft: '4px solid #3b82f6' }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gray-400)', margin: '0 0 8px 0' }}>CA KHÁM HÔM NAY</p>
                    <h3 style={{ fontSize: '2rem', fontWeight: 900, color: '#3b82f6', margin: 0 }}>{myAppointments.length} ca</h3>
                </div>
                <div className="glass-card" style={{ padding: '24px', borderRadius: '24px', borderLeft: '4px solid #f59e0b' }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gray-400)', margin: '0 0 8px 0' }}>BỆNH NHÂN ĐANG CHỜ</p>
                    <h3 style={{ fontSize: '2rem', fontWeight: 900, color: '#f59e0b', margin: 0 }}>{waitingPatients} bé</h3>
                    <h3 className={waitingPatients > 0 ? "pulse-text" : ""} style={{ fontSize: '2rem', fontWeight: 900, color: '#f59e0b', margin: 0, display: 'inline-block', transformOrigin: 'left center' }}>
                        {waitingPatients} bé
                    </h3>
                </div>
                <div className="glass-card" style={{ padding: '24px', borderRadius: '24px', borderLeft: '4px solid #10b981' }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gray-400)', margin: '0 0 8px 0' }}>CA ĐÃ HOÀN THÀNH</p>
                    <h3 style={{ fontSize: '2rem', fontWeight: 900, color: '#10b981', margin: 0 }}>{completedPatients} ca</h3>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', alignItems: 'start' }}>
                {/* Danh sách lịch hẹn hôm nay */}
                <div className="glass-card" style={{ borderRadius: '24px', overflow: 'hidden' }}>
                    <div style={{ padding: '24px', borderBottom: '1px solid var(--gray-100)' }}>
                        <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 800 }}>Lịch hẹn của bạn hôm nay</h2>
                    </div>
                    <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <tbody>
                                {myAppointments.length === 0 ? (
                                    <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-400)', fontWeight: 600 }}>Hôm nay bạn không có lịch hẹn nào.</td></tr>
                                ) : (
                                    myAppointments.map(app => (
                                        <tr key={app.id_lich_hen} style={{ borderBottom: '1px solid var(--gray-50)' }}>
                                            <td style={{ padding: '16px 24px', fontWeight: 800, color: 'var(--primary)' }}>{app.gio_kham?.substring(0, 5)}</td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <div style={{ fontWeight: 700 }}>{app.ten_thu_cung}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>Chủ: {app.ten_khach_hang}</div>
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <span style={{
                                                    padding: '6px 12px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 800,
                                                    background: app.trang_thai === 'HOAN_THANH' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                    color: app.trang_thai === 'HOAN_THANH' ? '#10b981' : '#f59e0b'
                                                }}>
                                                    {app.trang_thai}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <Link to="/quan-ly/kham-benh" className="btn btn-pill" style={{ padding: '8px 16px', fontSize: '0.8rem', background: 'var(--gray-50)' }}>Khám ngay</Link>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Lối tắt & Hồ sơ gần đây */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div className="glass-card" style={{ padding: '24px', borderRadius: '24px' }}>
                        <h2 style={{ fontSize: '1.2rem', margin: '0 0 16px 0', fontWeight: 800 }}>Lối tắt nhanh</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <Link to="/quan-ly/kham-benh" className="btn" style={{ justifyContent: 'flex-start', background: 'var(--primary-light)', color: 'var(--primary)' }}>
                                <span className="material-symbols-outlined">stethoscope</span> Khám & Kê đơn
                            </Link>
                            <Link to="/quan-ly/ho-so-benh-an" className="btn" style={{ justifyContent: 'flex-start', background: 'var(--gray-50)', color: 'var(--ink)' }}>
                                <span className="material-symbols-outlined">clinical_notes</span> Xem Hồ sơ Bệnh án
                            </Link>
                        </div>
                    </div>
                    <div className="glass-card" style={{ padding: '24px', borderRadius: '24px' }}>
                        <h2 style={{ fontSize: '1.2rem', margin: '0 0 16px 0', fontWeight: 800 }}>Ca khám 7 ngày qua</h2>
                        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', height: '140px', borderBottom: '1px solid var(--gray-100)', paddingBottom: '8px' }}>
                            {weeklyStats.map((stat, idx) => {
                                const maxCount = Math.max(...weeklyStats.map(s => s.count), 1);
                                const heightPct = (stat.count / maxCount) * 100;
                                return (
                                    <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', height: '100%', justifyContent: 'flex-end' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray-500)' }}>{stat.count}</span>
                                        <div style={{ width: '100%', maxWidth: '24px', height: `${heightPct}%`, minHeight: '4px', background: stat.count > 0 ? '#10b981' : 'var(--gray-100)', borderRadius: '4px 4px 0 0', transition: 'height 0.3s ease' }}></div>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--gray-400)' }}>{stat.date}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="glass-card" style={{ padding: '24px', borderRadius: '24px' }}>
                        <h2 style={{ fontSize: '1.2rem', margin: '0 0 16px 0', fontWeight: 800 }}>Hồ sơ gần đây</h2>
                        {myMedicalRecords.map(rec => (
                            <Link key={rec.id_ho_so} to={`/quan-ly/ho-so-benh-an/${rec.id_ho_so}`} style={{ display: 'block', textDecoration: 'none', color: 'inherit', padding: '12px', borderRadius: '12px', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                <div style={{ fontWeight: 700 }}>HS-{rec.id_ho_so}: {rec.ten_thu_cung}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>Chẩn đoán: {rec.chan_doan}</div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BacSiDashboard;