import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "@services/axios";
import { getUserProfile } from "@utils/index";
import ModalTaoLichHenAdmin from "./ModalTaoLichHenAdmin";
import { toast } from "@components/Toast";

const TiepTanDashboard: React.FC = () => {
    const [appointments, setAppointments] = useState<any[]>([]);
    const [stats, setStats] = useState({ pendingConfirmation: 0, pendingPayment: 0, checkedIn: 0 });
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const user = useMemo(() => getUserProfile() || {}, []);

    const fetchData = (showLoading = true) => {
        if (showLoading) {
            setLoading(true);
        }
        const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
        Promise.all([
            axiosInstance.get(`/api/lich-hen?page=0&size=200`),
            axiosInstance.get('/api/hoa-don')
        ]).then(([appsRes, invoicesRes]) => {
            const extractArray = (data: any): any[] => {
                if (!data) return [];
                if (Array.isArray(data)) return data;
                return data.content || data || [];
            };

            const allApps = extractArray(appsRes.data);
            const todaysApps = allApps.filter((l: any) => l.ngay_kham === todayStr);
            setAppointments(todaysApps);

            const pendingConfirmation = todaysApps.filter(a => a.trang_thai?.toUpperCase() === 'DA_DAT' || a.trang_thai === 'Chờ xác nhận').length;
            const checkedIn = todaysApps.filter(a => a.trang_thai?.toUpperCase() === 'DANG_KHAM').length;

            const allInvoices = extractArray(invoicesRes.data);
            const pendingPayment = allInvoices.filter(inv => inv.trang_thai === 'cho_thanh_toan').length;

            setStats({ pendingConfirmation, pendingPayment, checkedIn });

        }).catch(err => {
            console.error("Lỗi tải dữ liệu dashboard tiếp tân:", err);
            toast.error("Không thể tải dữ liệu dashboard.");
        }).finally(() => {
            setLoading(false);
        });
    };

    useEffect(() => {
        fetchData();

        const interval = setInterval(() => {
            fetchData(false); // Làm mới ngầm, không hiện loading
        }, 30000); // 30 giây

        return () => clearInterval(interval); // Dọn dẹp interval khi rời khỏi trang
    }, []);

    const filteredAppointments = useMemo(() => {
        if (!searchTerm.trim()) return appointments;
        const lowerTerm = searchTerm.toLowerCase();
        return appointments.filter(app =>
            app.ten_khach_hang?.toLowerCase().includes(lowerTerm) ||
            app.sdt?.includes(searchTerm)
        );
    }, [appointments, searchTerm]);

    const statusStats = useMemo(() => {
        let pending = 0, confirmed = 0, checkingIn = 0, completed = 0, canceled = 0;
        appointments.forEach(a => {
            const status = a.trang_thai?.toUpperCase() || '';
            if (status === 'DA_DAT' || status === 'CHỜ XÁC NHẬN') pending++;
            else if (status === 'DA_XAC_NHAN') confirmed++;
            else if (status === 'DANG_KHAM') checkingIn++;
            else if (status === 'HOAN_THANH') completed++;
            else if (status === 'DA_HUY' || status === 'HUY') canceled++;
            else pending++;
        });
        const total = appointments.length || 1;
        return {
            pending: { count: pending, pct: (pending / total) * 100, color: '#f59e0b', label: 'Chờ XN' },
            confirmed: { count: confirmed, pct: (confirmed / total) * 100, color: '#3b82f6', label: 'Đã XN' },
            checkingIn: { count: checkingIn, pct: (checkingIn / total) * 100, color: '#8b5cf6', label: 'Đang Khám' },
            completed: { count: completed, pct: (completed / total) * 100, color: '#10b981', label: 'Hoàn Thành' },
            canceled: { count: canceled, pct: (canceled / total) * 100, color: '#ef4444', label: 'Đã Hủy' }
        };
    }, [appointments]);

    const conicGradient = useMemo(() => {
        let cumulativePercent = 0;
        const stops = Object.values(statusStats).map(stat => {
            if (stat.count === 0) return '';
            const start = cumulativePercent;
            cumulativePercent += stat.pct;
            return `${stat.color} ${start}% ${cumulativePercent}%`;
        }).filter(s => s).join(', ');
        return `conic-gradient(${stops || '#f3f4f6 0% 100%'})`;
    }, [statusStats]);

    const handleUpdateStatus = async (id: number, newStatus: string) => {
        try {
            await axiosInstance.put(`/api/lich-hen/${id}/status`, { trang_thai: newStatus });
            toast.success("Đã cập nhật trạng thái lịch hẹn!");
            fetchData(false);
        } catch (err) {
            toast.error("Lỗi khi cập nhật trạng thái.");
        }
    };

    if (loading) {
        return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}><div className="dot-pulse"></div></div>;
    }

    return (
        <div className="animate-fade-in">
            <style>{`
                @keyframes pulseDanger {
                    0% { transform: scale(1); text-shadow: 0 0 0 rgba(239, 68, 68, 0); }
                    50% { transform: scale(1.05); text-shadow: 0 0 15px rgba(239, 68, 68, 0.7); }
                    100% { transform: scale(1); text-shadow: 0 0 0 rgba(239, 68, 68, 0); }
                }
                .pulse-danger-text {
                    animation: pulseDanger 1.5s infinite ease-in-out;
                }
            `}</style>
            <ModalTaoLichHenAdmin isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => fetchData(false)} />

            <div className="animate-slide-up stagger-1" style={{ marginBottom: '40px', padding: '48px', borderRadius: 'var(--radius-xl)', background: 'var(--primary-gradient)', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-2xl)' }}>
                <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '300px', height: '300px', background: 'radial-gradient(circle, var(--primary-light) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
                <h1 style={{ fontSize: '3rem', fontWeight: 950, letterSpacing: '-1.5px', position: 'relative', zIndex: 1, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span>Sảnh Chờ <span style={{ color: '#c4b5fd' }}>Tiếp Tân</span></span>
                    <span style={{ filter: 'drop-shadow(0 5px 15px rgba(0,0,0,0.2))' }}>🛎️</span>
                </h1>
                <p style={{ fontWeight: 700, color: 'rgba(255,255,255,0.95)', position: 'relative', zIndex: 1, margin: 0, fontSize: '1.2rem', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>Chào mừng, {user.ho_ten || 'Lễ tân'}. Quản lý luồng khách hàng và điều phối lịch hẹn hôm nay.</p>
            </div>

            {/* Các thẻ thống kê */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                <div className="glass-card" style={{ padding: '24px', borderRadius: '24px', borderLeft: '4px solid #3b82f6' }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gray-400)', margin: '0 0 8px 0' }}>TỔNG LỊCH HẸN NAY</p>
                    <h3 style={{ fontSize: '2rem', fontWeight: 900, color: '#3b82f6', margin: 0 }}>{appointments.length} ca</h3>
                </div>
                <div className="glass-card" style={{ padding: '24px', borderRadius: '24px', borderLeft: '4px solid #f59e0b' }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gray-400)', margin: '0 0 8px 0' }}>CHỜ XÁC NHẬN</p>
                    <h3 style={{ fontSize: '2rem', fontWeight: 900, color: '#f59e0b', margin: 0 }}>{stats.pendingConfirmation} ca</h3>
                </div>
                <div className="glass-card" style={{ padding: '24px', borderRadius: '24px', borderLeft: '4px solid #ef4444' }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gray-400)', margin: '0 0 8px 0' }}>HÓA ĐƠN CHỜ THU</p>
                    <h3 className={stats.pendingPayment > 0 ? "pulse-danger-text" : ""} style={{ fontSize: '2rem', fontWeight: 900, color: '#ef4444', margin: 0, display: 'inline-block', transformOrigin: 'left center' }}>
                        {stats.pendingPayment} hóa đơn
                    </h3>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', alignItems: 'start' }}>
                {/* Bảng điều phối */}
                <div className="glass-card" style={{ borderRadius: '24px', overflow: 'hidden' }}>
                    <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--gray-100)', flexWrap: 'wrap', gap: '12px' }}>
                        <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 800 }}>Điều phối lịch hẹn hôm nay</h2>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                            <div style={{ position: 'relative' }}>
                                <span className="material-symbols-outlined" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)', fontSize: '20px', pointerEvents: 'none' }}>search</span>
                                <input
                                    type="text"
                                    placeholder="Tìm theo tên/SĐT chủ..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    style={{ padding: '8px 16px 8px 40px', borderRadius: '12px', border: '1px solid var(--gray-200)', background: 'var(--gray-50)', outline: 'none', fontSize: '0.85rem', minWidth: '220px', fontWeight: 600, color: 'var(--ink)' }}
                                />
                            </div>
                            <button className="btn btn-primary btn-pill" onClick={() => setIsModalOpen(true)}>
                                <span className="material-symbols-outlined">add_task</span> Thêm lịch hẹn mới
                            </button>
                        </div>
                    </div>
                    <div style={{ overflowX: 'auto', maxHeight: '500px' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: 'var(--gray-50)' }}>
                                    <th style={{ padding: '16px 24px', fontSize: '0.8rem', color: 'var(--gray-500)' }}>THỜI GIAN</th>
                                    <th style={{ padding: '16px 24px', fontSize: '0.8rem', color: 'var(--gray-500)' }}>BỆNH NHÂN & CHỦ</th>
                                    <th style={{ padding: '16px 24px', fontSize: '0.8rem', color: 'var(--gray-500)' }}>BÁC SĨ</th>
                                    <th style={{ padding: '16px 24px', fontSize: '0.8rem', color: 'var(--gray-500)' }}>TRẠNG THÁI</th>
                                    <th style={{ padding: '16px 24px', fontSize: '0.8rem', color: 'var(--gray-500)' }}>THAO TÁC</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAppointments.length === 0 ? (
                                    <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-400)', fontWeight: 600 }}>{searchTerm ? 'Không tìm thấy kết quả phù hợp.' : 'Hôm nay không có lịch hẹn nào.'}</td></tr>
                                ) : (
                                    filteredAppointments.sort((a, b) => a.gio_kham.localeCompare(b.gio_kham)).map(app => (
                                        <tr key={app.id_lich_hen} style={{ borderBottom: '1px solid var(--gray-50)' }}>
                                            <td style={{ padding: '16px 24px', fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>{app.gio_kham?.substring(0, 5)}</td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <div style={{ fontWeight: 700 }}>{app.ten_thu_cung}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>{app.ten_khach_hang} ({app.sdt})</div>
                                            </td>
                                            <td style={{ padding: '16px 24px', fontWeight: 600 }}>{app.ten_bac_si || 'Chưa xếp'}</td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <span style={{ padding: '6px 12px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 800, background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                                                    {app.trang_thai?.toUpperCase()}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    {(app.trang_thai?.toUpperCase() === 'DA_DAT' || app.trang_thai === 'Chờ xác nhận') &&
                                                        <button onClick={() => handleUpdateStatus(app.id_lich_hen, 'DA_XAC_NHAN')} className="btn btn-pill" style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '8px 16px', fontSize: '0.8rem' }}>Xác nhận</button>
                                                    }
                                                    {app.trang_thai?.toUpperCase() === 'DA_XAC_NHAN' &&
                                                        <button onClick={() => handleUpdateStatus(app.id_lich_hen, 'DANG_KHAM')} className="btn btn-pill" style={{ background: 'var(--blue-50)', color: 'var(--blue-600)', padding: '8px 16px', fontSize: '0.8rem' }}>Check-in</button>
                                                    }
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Biểu đồ Doughnut */}
                <div className="glass-card" style={{ padding: '24px', borderRadius: '24px' }}>
                    <h2 style={{ fontSize: '1.2rem', margin: '0 0 24px 0', fontWeight: 800 }}>Tỷ lệ trạng thái</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
                        <div style={{
                            width: '180px', height: '180px', borderRadius: '50%',
                            background: conicGradient,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.05)'
                        }}>
                            <div style={{
                                width: '130px', height: '130px', borderRadius: '50%', background: 'white',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                flexDirection: 'column'
                            }}>
                                <span style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--ink)', lineHeight: 1 }}>{appointments.length}</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--gray-500)', fontWeight: 700, marginTop: '4px' }}>TỔNG CA</span>
                            </div>
                        </div>
                        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {Object.values(statusStats).map((stat, idx) => (
                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: '12px', height: '12px', borderRadius: '4px', background: stat.color }}></div>
                                        <span style={{ fontWeight: 600, color: 'var(--gray-600)' }}>{stat.label}</span>
                                    </div>
                                    <span style={{ fontWeight: 800, color: 'var(--ink)' }}>{stat.count} <span style={{ color: 'var(--gray-400)', fontSize: '0.75rem', fontWeight: 600 }}>({Math.round(stat.pct || 0)}%)</span></span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TiepTanDashboard;