import React, { useCallback, useState, useMemo, useEffect } from "react";
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

    // Lắng nghe sự kiện realtime khi có lịch hẹn mới/thay đổi trạng thái
    // (WebSocket gửi qua /topic/appointments -> WebSocketProvider dispatch ra đây)
    useEffect(() => {
        const handleAppointmentChanged = () => {
            fetchData();
        };
        window.addEventListener('rexi-appointments-changed', handleAppointmentChanged);
        return () => window.removeEventListener('rexi-appointments-changed', handleAppointmentChanged);
    }, [fetchData]);

    const waitingPatients = myAppointments.filter(a => a.trang_thai?.toUpperCase() === 'DA_XAC_NHAN').length;
    const completedPatients = myAppointments.filter(a => a.trang_thai?.toUpperCase() === 'HOAN_THANH').length;
    const inProgressPatients = myAppointments.filter(a => a.trang_thai?.toUpperCase() === 'DANG_KHAM').length;
    const nextAppointment = [...myAppointments]
        .filter(a => !['HOAN_THANH', 'DA_HUY', 'KHONG_DEN'].includes(String(a.trang_thai || '').toUpperCase()))
        .sort((a, b) => String(a.gio_kham || '').localeCompare(String(b.gio_kham || '')))[0];

    const ClinicalKpiCard = ({ accent, title, value, icon, details, pulse = false, badgeText, badgeTone = 'neutral', sparkline, to }: {
        accent: string;
        title: string;
        value: React.ReactNode;
        icon: React.ReactNode;
        details: React.ReactNode;
        pulse?: boolean;
        badgeText?: string;
        badgeTone?: 'up' | 'down' | 'neutral';
        sparkline?: string;
        to?: string;
    }) => {
        const cardStyle: React.CSSProperties = {
            padding: '24px', 
            borderRadius: '24px', 
            border: `1px solid ${accent}20`, 
            background: `linear-gradient(135deg, ${accent}08 0%, var(--surface) 100%)`, 
            minHeight: '160px',
            boxShadow: 'var(--shadow-md)',
            position: 'relative',
            transition: 'transform 0.28s cubic-bezier(0.22, 0.68, 0, 1.2), box-shadow 0.28s ease, border-color 0.28s ease, background 0.28s ease, filter 0.28s ease, opacity 0.28s ease',
            overflow: 'hidden',
            willChange: 'transform, box-shadow',
            display: 'block',
            textDecoration: 'none',
            color: 'inherit',
            cursor: to ? 'pointer' : 'default'
        };

        const content = (
            <>
                {/* SVG Sparkline Background */}
                {sparkline && (
                    <svg style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '55px', pointerEvents: 'none', opacity: 0.22, zIndex: 0 }} viewBox="0 0 100 50" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id={`gradient-${accent.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={accent} stopOpacity="0.4" />
                                <stop offset="100%" stopColor={accent} stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        <path d={`${sparkline} L100,50 L0,50 Z`} fill={`url(#gradient-${accent.replace('#', '')})`} />
                        <path d={sparkline} fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" />
                    </svg>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', position: 'relative', zIndex: 1 }}>
                    <div style={{ 
                        width: '48px', 
                        height: '48px', 
                        borderRadius: '16px', 
                        background: `${accent}15`, 
                        color: accent, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        boxShadow: `0 8px 20px ${accent}10`, 
                        fontSize: '1.4rem', 
                        fontWeight: 900 
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>{icon}</div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {badgeText && (
                            <span className={`kpi-trend-badge ${badgeTone}`} style={{ 
                                fontSize: '0.68rem', 
                                fontWeight: 900, 
                                padding: '4px 8px', 
                                borderRadius: '999px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                border: '1px solid rgba(0,0,0,0.05)'
                            }}>
                                {badgeTone === 'up' && '▲'}
                                {badgeTone === 'down' && '▼'}
                                {badgeText}
                            </span>
                        )}
                        {pulse && (
                            <span style={{ display: 'flex', position: 'relative', width: '8px', height: '8px' }}>
                                <span style={{ animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite', position: 'absolute', display: 'inline-flex', height: '100%', width: '100%', borderRadius: '50%', background: accent, opacity: 0.75 }}></span>
                                <span style={{ position: 'relative', display: 'inline-flex', borderRadius: '50%', height: '8px', width: '8px', background: accent }}></span>
                            </span>
                        )}
                    </div>
                </div>
                
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)', margin: '0 0 6px 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</p>
                    <h3 style={{ fontSize: '1.8rem', fontWeight: 950, color: 'var(--ink)', margin: '0 0 12px 0', display: 'inline-block' }}>{value}</h3>
                </div>
                
                <div style={{ 
                    borderTop: '1px solid var(--gray-100)', 
                    paddingTop: '10px', 
                    fontSize: '0.8rem', 
                    color: 'var(--gray-500)',
                    lineHeight: '1.4',
                    position: 'relative',
                    zIndex: 1
                }} className="kpi-mini-details">
                    {details}
                </div>
            </>
        );

        if (to) {
            return (
                <Link to={to} className="clinical-kpi-card hover-lift" style={cardStyle}>
                    {content}
                </Link>
            );
        }

        return (
            <div className="clinical-kpi-card hover-lift" tabIndex={0} style={cardStyle}>
                {content}
            </div>
        );
    };

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}><div className="dot-pulse"></div></div>;
    }

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <style>{`
                @keyframes slideInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
                @keyframes slideUpFade { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
                .clinical-kpi-card { animation: slideUpFade 0.45s cubic-bezier(.22,.68,0,1.2) both; transition: transform 0.28s cubic-bezier(.22,.68,0,1.2), box-shadow 0.28s ease, border-color 0.28s ease, filter 0.28s ease; position: relative; }
                .clinical-kpi-card::before { content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,0.36) 0%, rgba(255,255,255,0) 45%); opacity: 0; transition: opacity 0.28s ease; pointer-events: none; z-index: 0; }
                .clinical-kpi-card:hover { transform: translateY(-8px) scale(1.01); box-shadow: 0 18px 40px rgba(15, 23, 42, 0.12); filter: saturate(1.05); }
                .clinical-kpi-card:hover::before { opacity: 1; }
                .clinical-kpi-card:hover > div:first-child > div { transform: translateY(-2px) scale(1.06); box-shadow: 0 12px 26px rgba(15, 23, 42, 0.12); }
                .clinical-kpi-card:hover .kpi-mini-details { opacity: 1; transform: translateY(0); }
                .kpi-mini-details { transition: opacity 0.28s ease, transform 0.28s ease; opacity: 0.82; transform: translateY(6px); }
                .timeline-card { animation: slideUpFade 0.35s cubic-bezier(.22,.68,0,1.2) both; transition: all 0.25s ease; }
                .timeline-card:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); border-color: var(--primary-light); }
                .quick-btn { transition: all 0.2s ease; border: 1px solid transparent; }
                .quick-btn:hover { transform: translateX(4px); box-shadow: var(--shadow-sm); }
                .quick-btn:active { transform: scale(0.98); }
                .chart-bar-container:hover .chart-bar { background: linear-gradient(to top, var(--primary) 0%, var(--primary-light) 100%) !important; filter: drop-shadow(0 4px 8px rgba(20, 184, 166, 0.3)); }
                .chart-bar-container:hover .chart-val { opacity: 1 !important; transform: translateY(0) !important; }
                
                /* Responsive Dashboard Grid System */
                .dashboard-kpi-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                    gap: 24px;
                }
                .dashboard-row-1 {
                    display: grid;
                    grid-template-columns: 2fr 1fr;
                    gap: 32px;
                    align-items: stretch;
                }
                .dashboard-row-2 {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 32px;
                    align-items: stretch;
                }
                
                .appointments-timeline-scroll {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                    max-height: 480px;
                    overflow-y: auto;
                    padding-right: 6px;
                }
                .appointments-timeline-scroll::-webkit-scrollbar {
                    width: 6px;
                }
                .appointments-timeline-scroll::-webkit-scrollbar-track {
                    background: transparent;
                }
                .appointments-timeline-scroll::-webkit-scrollbar-thumb {
                    background: var(--gray-200);
                    border-radius: 10px;
                }
                .appointments-timeline-scroll::-webkit-scrollbar-thumb:hover {
                    background: var(--primary);
                }

                @media (max-width: 1024px) {
                    .dashboard-row-1, .dashboard-row-2 {
                        grid-template-columns: 1fr !important;
                        gap: 24px !important;
                    }
                    .dashboard-kpi-grid {
                        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)) !important;
                        gap: 16px !important;
                    }
                }
                @media (max-width: 768px) {
                    /* Custom mobile optimized doctor hero */
                    .animate-slide-up.stagger-1 {
                        padding: 20px !important;
                        border-radius: 20px !important;
                    }
                    .animate-slide-up.stagger-1 h1 {
                        font-size: 1.5rem !important;
                        line-height: 1.2 !important;
                        white-space: normal !important;
                        word-break: break-word !important;
                    }
                    .animate-slide-up.stagger-1 p {
                        font-size: 0.85rem !important;
                        line-height: 1.4 !important;
                    }

                    /* Horizontal or grid KPI cards so they don't eat vertical space */
                    .dashboard-kpi-grid {
                        grid-template-columns: repeat(3, 1fr) !important;
                        gap: 10px !important;
                    }
                    .clinical-kpi-card {
                        min-width: 0 !important;
                        flex-shrink: 1 !important;
                        padding: 12px !important;
                        border-radius: 16px !important;
                        min-height: auto !important;
                    }
                    .clinical-kpi-card > div:first-of-type {
                        margin-bottom: 8px !important;
                    }
                    .clinical-kpi-card > div:first-of-type > div {
                        width: 36px !important;
                        height: 36px !important;
                        border-radius: 10px !important;
                        font-size: 1.1rem !important;
                    }
                    .clinical-kpi-card p {
                        font-size: 0.65rem !important;
                        font-weight: 800 !important;
                    }
                    .clinical-kpi-card h3 {
                        font-size: 1.15rem !important;
                        font-weight: 900 !important;
                        margin-bottom: 6px !important;
                    }
                    .clinical-kpi-card .kpi-mini-details {
                        display: none !important;
                    }

                    /* Compact horizontal button grid for quick shortcuts */
                    .quick-btn-container {
                        display: grid !important;
                        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
                        gap: 8px !important;
                    }
                    .quick-btn {
                        flex-direction: column !important;
                        align-items: center !important;
                        justify-content: center !important;
                        text-align: center !important;
                        padding: 12px 6px !important;
                        font-size: 0.7rem !important;
                        font-weight: 900 !important;
                        border-radius: 12px !important;
                        gap: 6px !important;
                        min-height: 72px !important;
                    }
                    .quick-btn div {
                        flex: none !important;
                        white-space: normal !important;
                        line-height: 1.2 !important;
                    }
                    .quick-btn span:last-child {
                        display: none !important; /* hide right chevron */
                    }
                    .quick-btn span.material-symbols-outlined {
                        font-size: 20px !important;
                    }

                    /* Timeline cards compact layout */
                    .timeline-card {
                        padding: 14px !important;
                        gap: 12px !important;
                    }
                    .timeline-card h4 {
                        font-size: 0.95rem !important;
                    }

                    /* Tighten grid spacing */
                    .dashboard-row-1, .dashboard-row-2 {
                        gap: 16px !important;
                    }
                    
                    /* Desktop has normal ordering, Mobile places shortcuts (2nd child) first */
                    .dashboard-row-1 {
                        display: flex !important;
                        flex-direction: column !important;
                    }
                    .dashboard-row-1 > div:nth-child(1) {
                        order: 2 !important; /* Appointments timeline goes second */
                    }
                    .dashboard-row-1 > div:nth-child(2) {
                        order: 1 !important; /* Shortcuts goes first */
                    }
                    
                    .appointments-timeline-scroll {
                        max-height: 380px !important;
                    }
                }
            `}</style>

            {/* Header / Hero Section */}
            <div className="animate-slide-up stagger-1" style={{ 
                padding: '40px', 
                borderRadius: '24px', 
                background: 'linear-gradient(135deg, var(--primary) 0%, #0d9488 100%)', 
                color: 'white', 
                position: 'relative', 
                overflow: 'hidden', 
                boxShadow: 'var(--shadow-xl)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
                <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 60%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ background: 'rgba(255,255,255,0.2)', padding: '6px 12px', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', border: '1px solid rgba(255,255,255,0.2)' }}>
                            🩺 Khu vực bác sĩ
                        </span>
                    </div>
                    <div>
                        <h1 style={{ fontSize: '2.4rem', fontWeight: 950, letterSpacing: '-1px', margin: '0 0 8px 0' }}>
                            Xin chào, {user.ho_ten || 'Bác sĩ'}!
                        </h1>
                        <p style={{ fontWeight: 600, color: 'rgba(255,255,255,0.9)', margin: 0, fontSize: '1.05rem' }}>
                            Hôm nay bạn có <span style={{ color: '#2dd4bf', fontWeight: 900 }}>{myAppointments.length} ca khám</span> trong lịch trình. Hãy cùng chăm sóc tốt cho các bé nhé!
                        </p>
                    </div>
                    {lastUpdated && (
                        <div style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '6px', 
                            fontSize: '0.78rem', 
                            fontWeight: 800, 
                            background: 'rgba(0,0,0,0.15)', 
                            backdropFilter: 'blur(8px)', 
                            padding: '6px 14px', 
                            borderRadius: '999px', 
                            width: 'fit-content',
                            border: '1px solid rgba(255,255,255,0.08)'
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#2dd4bf', animation: 'spin 4s infinite linear' }}>sync</span>
                            <span>Đồng bộ thực tế: {lastUpdated}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* KPI Cards Grid */}
            <div className="dashboard-kpi-grid">
                <ClinicalKpiCard
                    accent="#3b82f6"
                    title="Ca khám trong ngày"
                    value={<><AnimatedNumber value={myAppointments.length} /> ca</>}
                    icon={<KpiIcon name="calendar" />}
                    badgeText="Hôm nay"
                    badgeTone="neutral"
                    sparkline="M0,30 Q15,20 30,35 T60,20 T90,28 T100,8"
                    to="/quan-ly/kham-benh"
                    details={
                        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                            <span>Chờ tiếp nhận: <strong>{waitingPatients}</strong></span>
                            <span>Đang khám: <strong>{inProgressPatients}</strong></span>
                        </div>
                    }
                />
                <ClinicalKpiCard
                    accent="#f59e0b"
                    title="Bệnh nhân chờ khám"
                    value={<><AnimatedNumber value={waitingPatients} /> bé</>}
                    icon={<KpiIcon name="clock" />}
                    pulse={waitingPatients > 0}
                    badgeText={waitingPatients > 0 ? "Ưu tiên" : "Ổn định"}
                    badgeTone={waitingPatients > 0 ? "down" : "up"}
                    sparkline="M0,35 Q15,40 30,22 T60,38 T90,12 T100,28"
                    to="/quan-ly/kham-benh"
                    details={
                        <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {nextAppointment ? (
                                <span>Ca tiếp theo: <strong>{nextAppointment.gio_kham?.substring(0, 5)} - {nextAppointment.ten_thu_cung}</strong></span>
                            ) : (
                                <span>Không có bé nào đang chờ khám.</span>
                            )}
                        </div>
                    }
                />
                <ClinicalKpiCard
                    accent="#10b981"
                    title="Ca khám hoàn thành"
                    value={<><AnimatedNumber value={completedPatients} /> ca</>}
                    icon={<KpiIcon name="check" />}
                    badgeText={myAppointments.length ? `${Math.round((completedPatients / myAppointments.length) * 100)}%` : "0%"}
                    badgeTone="up"
                    sparkline="M0,42 Q15,35 30,12 T60,28 T90,6 T100,2"
                    to="/quan-ly/ho-so-benh-an"
                    details={
                        <div>
                            <span>Hiệu suất ngày: <strong>{myAppointments.length ? Math.round((completedPatients / myAppointments.length) * 100) : 0}%</strong></span>
                        </div>
                    }
                />
            </div>

            {/* Row 1: Today's Appointments & Shortcuts */}
            <div className="dashboard-grid-row dashboard-row-1">
                
                {/* Column Left: Today's Appointments Timeline */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ink)' }}>
                            <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '20px' }}>format_list_bulleted</span>
                            Lịch khám hôm nay
                        </h2>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--gray-400)', background: 'var(--gray-50)', padding: '4px 10px', borderRadius: '50px' }}>
                            {myAppointments.length} ca
                        </span>
                    </div>

                    <div className="appointments-timeline-scroll" style={{ height: '100%', justifyContent: myAppointments.length === 0 ? 'center' : 'flex-start' }}>
                        {myAppointments.length === 0 ? (
                            <div className="glass-card" style={{ padding: '48px 24px', textAlign: 'center', borderRadius: '20px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--gray-300)', marginBottom: '12px' }}>event_busy</span>
                                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--gray-500)', margin: '0 0 4px 0' }}>Lịch trình trống</h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--gray-400)', margin: 0 }}>Hôm nay bạn không có lịch hẹn khám bệnh nào.</p>
                            </div>
                        ) : (
                            myAppointments.map(app => {
                                const isCompleted = app.trang_thai?.toUpperCase() === 'HOAN_THANH';
                                const isPending = app.trang_thai?.toUpperCase() === 'DA_XAC_NHAN' || app.trang_thai?.toUpperCase() === 'CHO_KHAM';
                                const isProgress = app.trang_thai?.toUpperCase() === 'DANG_KHAM';
                                
                                let statusBg = 'var(--gray-50)';
                                let statusColor = 'var(--gray-500)';
                                let statusLabel = app.trang_thai;
                                
                                if (isCompleted) {
                                    statusBg = 'rgba(16, 185, 129, 0.08)';
                                    statusColor = '#10b981';
                                    statusLabel = 'Đã hoàn thành';
                                } else if (isPending) {
                                    statusBg = 'rgba(245, 158, 11, 0.08)';
                                    statusColor = '#d97706';
                                    statusLabel = 'Đang chờ';
                                } else if (isProgress) {
                                    statusBg = 'rgba(59, 130, 246, 0.08)';
                                    statusColor = '#3b82f6';
                                    statusLabel = 'Đang khám';
                                }

                                return (
                                    <div key={app.id_lich_hen} className="timeline-card glass-card" style={{ 
                                        padding: '20px', 
                                        borderRadius: '20px', 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        gap: '16px',
                                        borderLeft: `5px solid ${isCompleted ? '#10b981' : isProgress ? '#3b82f6' : '#f59e0b'}`
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                                            <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                                                <div style={{ 
                                                    width: '44px', 
                                                    height: '44px', 
                                                    borderRadius: '50px', 
                                                    background: isCompleted ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)', 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    justifyContent: 'center',
                                                    fontSize: '1.2rem'
                                                }}>
                                                    {app.ten_thu_cung?.toLowerCase().includes('mèo') || app.ten_thu_cung?.toLowerCase().includes('mimi') ? '🐱' : '🐶'}
                                                </div>
                                                <div>
                                                    <h4 style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--ink)', margin: '0 0 2px 0' }}>{app.ten_thu_cung}</h4>
                                                    <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', fontWeight: 700, margin: 0 }}>
                                                        Khách hàng: <span style={{ color: 'var(--gray-600)' }}>{app.ten_khach_hang || 'Vãng lai'}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                                                <span style={{ 
                                                    display: 'inline-flex', 
                                                    alignItems: 'center', 
                                                    gap: '4px', 
                                                    fontSize: '0.78rem', 
                                                    fontWeight: 900, 
                                                    background: 'var(--gray-50)', 
                                                    color: 'var(--primary)', 
                                                    padding: '4px 8px', 
                                                    borderRadius: '8px' 
                                                }}>
                                                    <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>schedule</span>
                                                    {app.gio_kham?.substring(0, 5)}
                                                </span>
                                                <span style={{ 
                                                    padding: '3px 8px', 
                                                    borderRadius: '6px', 
                                                    fontSize: '0.7rem', 
                                                    fontWeight: 850, 
                                                    textTransform: 'uppercase', 
                                                    background: statusBg, 
                                                    color: statusColor 
                                                }}>
                                                    {statusLabel}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--gray-100)', paddingTop: '12px' }}>
                                            <span style={{ fontSize: '0.78rem', color: 'var(--gray-400)', fontWeight: 600 }}>
                                                Mã ca khám: <strong style={{ color: 'var(--gray-600)' }}>#{app.id_lich_hen}</strong>
                                            </span>
                                            
                                            {!isCompleted && (
                                                <Link to="/quan-ly/kham-benh" className="btn btn-pill" style={{ 
                                                    padding: '6px 16px', 
                                                    fontSize: '0.8rem', 
                                                    fontWeight: 800,
                                                    background: 'var(--primary)',
                                                    color: 'white',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    textDecoration: 'none'
                                                }}>
                                                    <span>Khám bệnh</span>
                                                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_forward</span>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Quick Action shortcuts */}
                <div className="glass-card" style={{ padding: '24px', borderRadius: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                    <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--ink)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>bolt</span>
                            Lối tắt nghiệp vụ
                        </h3>
                        <div className="quick-btn-container" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <Link to="/quan-ly/kham-benh" className="quick-btn" style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '12px', 
                                padding: '14px', 
                                borderRadius: '16px', 
                                background: 'linear-gradient(135deg, rgba(20, 184, 166, 0.08) 0%, rgba(20, 184, 166, 0.02) 100%)', 
                                color: 'var(--primary)', 
                                fontWeight: 850, 
                                fontSize: '0.9rem',
                                textDecoration: 'none'
                            }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>stethoscope</span>
                                <div style={{ flex: 1 }}>Khám bệnh & Kê đơn</div>
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
                            </Link>

                            <Link to="/quan-ly/lich-lam-viec" className="quick-btn" style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '12px', 
                                padding: '14px', 
                                borderRadius: '16px', 
                                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(245, 158, 11, 0.02) 100%)', 
                                color: '#d97706', 
                                fontWeight: 850, 
                                fontSize: '0.9rem',
                                textDecoration: 'none'
                            }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>edit_calendar</span>
                                <div style={{ flex: 1 }}>Đăng ký lịch làm việc</div>
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
                            </Link>

                            <Link to="/quan-ly/ho-so-benh-an" className="quick-btn" style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '12px', 
                                padding: '14px', 
                                borderRadius: '16px', 
                                background: 'linear-gradient(135deg, rgba(100, 116, 139, 0.08) 0%, rgba(100, 116, 139, 0.02) 100%)', 
                                color: 'var(--gray-600)', 
                                fontWeight: 850, 
                                fontSize: '0.9rem',
                                textDecoration: 'none'
                            }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>clinical_notes</span>
                                <div style={{ flex: 1 }}>Xem Hồ sơ Bệnh án</div>
                                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Row 2: Weekly Performance Chart & Recent Records */}
            <div className="dashboard-grid-row dashboard-row-2">
                
                {/* Chart Container */}
                <div className="glass-card" style={{ padding: '24px', borderRadius: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
                    <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--ink)', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>bar_chart</span>
                            Hiệu suất 7 ngày qua
                        </h3>
                        <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)', margin: '0 0 20px 0', fontWeight: 700 }}>Số ca khám hoàn thành mỗi ngày</p>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', height: '140px', paddingBottom: '4px', position: 'relative' }}>
                        {weeklyStats.map((stat, idx) => {
                            const maxCount = Math.max(...weeklyStats.map(s => s.count), 1);
                            const heightPct = (stat.count / maxCount) * 100;
                            return (
                                <div key={idx} className="chart-bar-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', height: '100%', justifyContent: 'flex-end', cursor: 'pointer' }}>
                                    <span className="chart-val" style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--primary)', opacity: stat.count > 0 ? 0.9 : 0, transition: 'all 0.2s ease', transform: 'translateY(2px)' }}>{stat.count}</span>
                                    <div className="chart-bar" style={{ 
                                        width: '100%', 
                                        height: `${heightPct}%`, 
                                        minHeight: '6px', 
                                        background: stat.count > 0 ? 'linear-gradient(to top, #0d9488 0%, #2dd4bf 100%)' : 'var(--gray-100)', 
                                        borderRadius: '6px 6px 0 0', 
                                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' 
                                    }}></div>
                                    <span style={{ fontSize: '0.68rem', color: 'var(--gray-400)', fontWeight: 800 }}>{stat.date}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Recent records */}
                <div className="glass-card" style={{ padding: '24px', borderRadius: '24px', display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--ink)', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>history</span>
                        Hồ sơ bệnh án gần đây
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, justifyContent: 'flex-start' }}>
                        {myMedicalRecords.length === 0 ? (
                            <p style={{ fontSize: '0.85rem', color: 'var(--gray-400)', margin: 0, textAlign: 'center', padding: '16px' }}>Chưa lưu hồ sơ nào gần đây.</p>
                        ) : (
                            myMedicalRecords.map(rec => (
                                <Link key={rec.id_ho_so} to={`/quan-ly/ho-so-benh-an/${rec.id_ho_so}`} style={{ 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: '12px', 
                                    padding: '10px 12px', 
                                    borderRadius: '12px', 
                                    textDecoration: 'none', 
                                    color: 'inherit',
                                    transition: 'background 0.2s ease',
                                    background: 'rgba(0,0,0,0.01)',
                                    border: '1px solid var(--gray-50)'
                                }} onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-50)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.01)'}>
                                    <div style={{ 
                                        width: '32px', 
                                        height: '32px', 
                                        borderRadius: '8px', 
                                        background: 'var(--primary-light)', 
                                        color: 'var(--primary)', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center' 
                                    }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>folder_open</span>
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {rec.id_ho_so?.startsWith('HS-') ? rec.id_ho_so : `HS-${rec.id_ho_so}`}: {rec.ten_thu_cung}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                                            Chẩn đoán: {rec.chan_doan}
                                        </div>
                                    </div>
                                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: 'var(--gray-300)' }}>open_in_new</span>
                                </Link>
                            ))
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default BacSiDashboard;



