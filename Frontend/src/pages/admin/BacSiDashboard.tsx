import React, { useCallback, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "@services/axios";
import { getUserProfile } from "@utils/index";
import { useAutoRefresh } from "@hooks/useAutoRefresh";
import KpiIcon from "@components/KpiIcon";
import { AnimatedNumber } from "@components/CommonUI";

const BacSiDashboard: React.FC = () => {
    const [myAppointments, setMyAppointments] = useState<any[]>([]);
    const [myMedicalRecords, setMyMedicalRecords] = useState<any[]>([]);
    const [weeklyStats, setWeeklyStats] = useState<{ date: string, count: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<string>("");
    const user = useMemo(() => getUserProfile() || {}, []);
    const currentUserId = user?.id_nhan_vien || user?.id;

    const fetchData = useCallback(async () => {
        if (!currentUserId) {
            setLoading(false);
            return;
        }
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
                // BUG FIX #4: Backend có thể trả ISO datetime "2025-05-20T00:00:00"
                // → phải dùng substring(0,10) thay vì === để tránh lọc trả 0 kết quả
                const myTodaysApps = allApps.filter(a => {
                    const ngay = a.ngay_kham ? String(a.ngay_kham).substring(0, 10) : '';
                    return ngay === todayStr && String(a.id_bac_si) === String(currentUserId);
                });
                setMyAppointments(myTodaysApps);

                const last7Days = Array.from({ length: 7 }, (_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
                }).reverse();

                const weeklyData = last7Days.map(dateStr => {
                    // BUG FIX #5: Cùng vấn đề substring cho weekly stats
                    const count = allApps.filter(a => {
                        const ngay = a.ngay_kham ? String(a.ngay_kham).substring(0, 10) : '';
                        return ngay === dateStr && String(a.id_bac_si) === String(currentUserId) && a.trang_thai?.toUpperCase() === 'HOAN_THANH';
                    }).length;
                    const [, month, day] = dateStr.split('-');
                    return { date: `${day}/${month}`, count };
                });
                setWeeklyStats(weeklyData);

                const allRecords = extractArray(recordsRes.data);
                const myRecentRecords = allRecords.filter(r => String(r.id_bac_si) === String(currentUserId)).slice(0, 5);
                setMyMedicalRecords(myRecentRecords);

                // Cập nhật nhãn thời gian thực khi tải dữ liệu thành công
                const now = new Date();
                const formatTime = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
                setLastUpdated(formatTime);
        } catch (err) {
            console.error("Lỗi tải dữ liệu dashboard bác sĩ:", err);
        } finally {
            setLoading(false);
        }
    }, [currentUserId]);

    useAutoRefresh(fetchData);

    const waitingPatients = myAppointments.filter(a => a.trang_thai?.toUpperCase() === 'DA_XAC_NHAN').length;
    const completedPatients = myAppointments.filter(a => a.trang_thai?.toUpperCase() === 'HOAN_THANH').length;
    const inProgressPatients = myAppointments.filter(a => a.trang_thai?.toUpperCase() === 'DANG_KHAM').length;
    const nextAppointment = [...myAppointments]
        .filter(a => !['HOAN_THANH', 'DA_HUY', 'KHONG_DEN'].includes(String(a.trang_thai || '').toUpperCase()))
        .sort((a, b) => String(a.gio_kham || '').localeCompare(String(b.gio_kham || '')))[0];

    const ClinicalKpiCard = ({ accent, title, value, icon, details, pulse = false }: {
        accent: string;
        title: string;
        value: React.ReactNode;
        icon: React.ReactNode;
        details: React.ReactNode;
        pulse?: boolean;
    }) => (
        <div className="clinical-kpi-card glass-card hover-lift" tabIndex={0} style={{ padding: '32px', borderRadius: '32px', border: `1px solid ${accent}25`, background: `linear-gradient(135deg, ${accent}15 0%, var(--surface) 100%)`, minHeight: '190px' }}>
            <div className="clinical-kpi-badge" style={{ color: accent, borderColor: `${accent}35`, background: `${accent}12` }}>
                <span>Chi tiết</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '20px', background: `${accent}22`, color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 20px ${accent}15`, fontSize: '1.55rem', fontWeight: 950 }}>
                    {icon}
                </div>
            </div>
            <p style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--gray-500)', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>{title}</p>
            <h3 className={pulse ? 'pulse-text' : ''} style={{ fontSize: '2rem', fontWeight: 950, color: accent, margin: 0, display: 'inline-block', transformOrigin: 'left center', textShadow: `0 2px 10px ${accent}18` }}>{value}</h3>
            <div className="clinical-kpi-popover">{details}</div>
        </div>
    );

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}><div className="dot-pulse"></div></div>;
    }

    return (
        <div className="animate-fade-in">
            <style>{`
                @keyframes slideInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
                @keyframes slideUpFade { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
                .clinical-kpi-card { animation: slideUpFade 0.45s cubic-bezier(.22,.68,0,1.2) both; }
                .appointment-row { animation: slideUpFade 0.35s cubic-bezier(.22,.68,0,1.2) both; }
                .sidebar-card { animation: slideInRight 0.45s cubic-bezier(.22,.68,0,1.2) both; }
                @keyframes pulseWarning {
                    0% { transform: scale(1); text-shadow: 0 0 0 rgba(245, 158, 11, 0); }
                    50% { transform: scale(1.05); text-shadow: 0 0 15px rgba(245, 158, 11, 0.7); }
                    100% { transform: scale(1); text-shadow: 0 0 0 rgba(245, 158, 11, 0); }
                }
                .pulse-text {
                    animation: pulseWarning 1.5s infinite ease-in-out;
                }
                .clinical-kpi-card {
                    position: relative;
                    cursor: help;
                    overflow: visible;
                    transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
                }
                .clinical-kpi-card:hover,
                .clinical-kpi-card:focus {
                    transform: translateY(-4px);
                    box-shadow: 0 18px 42px rgba(15, 23, 42, 0.12);
                    outline: none;
                    z-index: 120;
                }
                .clinical-kpi-badge {
                    position: absolute;
                    top: 22px;
                    right: 22px;
                    display: inline-flex;
                    align-items: center;
                    padding: 7px 10px;
                    border-radius: 999px;
                    border: 1px solid;
                    font-size: 0.72rem;
                    font-weight: 950;
                    box-shadow: 0 12px 26px rgba(15, 23, 42, 0.08);
                }
                .clinical-kpi-popover {
                    position: absolute;
                    left: 18px;
                    right: 18px;
                    top: 70px;
                    z-index: 90;
                    padding: 16px;
                    border-radius: 16px;
                    border: 1px solid rgba(20, 184, 166, 0.35);
                    background: var(--surface);
                    color: var(--ink);
                    box-shadow: 0 24px 56px rgba(15, 23, 42, 0.22);
                    opacity: 0;
                    transform: translateY(-6px);
                    pointer-events: none;
                    transition: opacity 0.18s ease, transform 0.18s ease;
                    font-size: 0.86rem;
                    line-height: 1.45;
                }
                .clinical-kpi-popover strong {
                    display: block;
                    margin-bottom: 8px;
                    color: var(--primary);
                    font-size: 0.92rem;
                    font-weight: 950;
                }
                .clinical-kpi-popover p {
                    margin: 6px 0;
                    color: var(--ink);
                    font-weight: 800;
                }
                .clinical-kpi-card:hover .clinical-kpi-popover,
                .clinical-kpi-card:focus .clinical-kpi-popover {
                    opacity: 1;
                    transform: translateY(0);
                    pointer-events: auto;
                }
            `}</style>
            <div className="animate-slide-up stagger-1" style={{ marginBottom: '40px', padding: '48px', borderRadius: 'var(--radius-xl)', background: 'var(--primary-gradient)', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-2xl)' }}>
                <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '300px', height: '300px', background: 'radial-gradient(circle, var(--primary-light) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
                <h1 style={{ fontSize: '3rem', fontWeight: 950, letterSpacing: '-1.5px', position: 'relative', zIndex: 1, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span>Bảng điều khiển <span style={{ color: '#5eead4' }}>Bác sĩ & Y tá</span></span>
                    <span style={{ filter: 'drop-shadow(0 5px 15px rgba(0,0,0,0.2))' }}>🩺</span>
                </h1>
                <p style={{ fontWeight: 700, color: 'rgba(255,255,255,0.95)', position: 'relative', zIndex: 1, margin: 0, fontSize: '1.2rem', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>Chào mừng trở lại, {user.ho_ten || 'Bác sĩ'}. Dưới đây là lịch trình và công việc của bạn hôm nay.</p>
                {lastUpdated && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 800, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', padding: '6px 14px', borderRadius: '999px', marginTop: '14px', border: '1px solid rgba(255,255,255,0.2)', position: 'relative', zIndex: 1, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#5eead4', animation: 'spin 3s infinite linear' }}>sync</span>
                        <span>Dữ liệu thời gian thực cập nhật lúc: {lastUpdated}</span>
                    </div>
                )}
            </div>

            {/* Các thẻ thống kê */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px', position: 'relative', zIndex: 80 }}>
                <ClinicalKpiCard
                    accent="#3b82f6"
                    title="Ca khám hôm nay"
                    value={<><AnimatedNumber value={myAppointments.length} /> ca</>}
                    icon={<KpiIcon name="calendar" />}
                    details={
                        <div>
                            <strong>Tổng quan lịch khám</strong>
                            <p>{waitingPatients} ca đang chờ bác sĩ tiếp nhận.</p>
                            <p>{inProgressPatients} ca đang khám, {completedPatients} ca đã hoàn thành.</p>
                            <p>Ca kế tiếp: {nextAppointment ? `${nextAppointment.gio_kham?.substring(0, 5) || "--:--"} - ${nextAppointment.ten_thu_cung || "chưa có tên"}` : "Không còn ca cần xử lý."}</p>
                        </div>
                    }
                />
                <ClinicalKpiCard
                    accent="#f59e0b"
                    title="Bệnh nhân đang chờ"
                    value={<><AnimatedNumber value={waitingPatients} /> bé</>}
                    icon={<KpiIcon name="clock" />}
                    pulse={waitingPatients > 0}
                    details={
                        <div>
                            <strong>Danh sách cần ưu tiên</strong>
                            {myAppointments.filter(a => String(a.trang_thai || '').toUpperCase() === 'DA_XAC_NHAN').slice(0, 4).map(app => (
                                <p key={app.id_lich_hen}>{app.gio_kham?.substring(0, 5) || "--:--"} - {app.ten_thu_cung || "chưa có tên"} ({app.ten_khach_hang || "chưa có chủ"})</p>
                            ))}
                            {waitingPatients === 0 && <p>Hiện không có bệnh nhân nào đang chờ.</p>}
                        </div>
                    }
                />
                <ClinicalKpiCard
                    accent="#10b981"
                    title="Ca đã hoàn thành"
                    value={<><AnimatedNumber value={completedPatients} /> ca</>}
                    icon={<KpiIcon name="check" />}
                    details={
                        <div>
                            <strong>Kết quả trong ngày</strong>
                            <p>{completedPatients}/{myAppointments.length || 0} ca đã hoàn thành hôm nay.</p>
                            <p>7 ngày qua: {weeklyStats.reduce((sum, stat) => sum + stat.count, 0)} ca hoàn thành.</p>
                            <p>Hồ sơ gần đây đang hiển thị: {myMedicalRecords.length} hồ sơ.</p>
                        </div>
                    }
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', alignItems: 'start' }}>
                {/* Danh sách lịch hẹn hôm nay */}
                <div className="glass-card" style={{ borderRadius: '24px', overflow: 'hidden' }}>
                    <div style={{ padding: '24px', borderBottom: '1px solid var(--gray-100)' }}>
                        <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 800 }}>Lịch hẹn của bạn hôm nay</h2>
                    </div>
                    <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
                        <div className="table-responsive-wrapper">
<div style={{ minWidth: '800px' }}>
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
</div></div>
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
