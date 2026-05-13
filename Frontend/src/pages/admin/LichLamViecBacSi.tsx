import React, { useState, useEffect, useMemo } from 'react';
import axiosInstance from '@services/axios';
import { toast } from '@components/ThongBaoNhanh';
import { getUserProfile } from '@utils/index';

interface LichLamViec {
    id_lich_lam_viec?: string;
    id_nhan_vien: string;
    ngay_lam: string;
    gio_bat_dau: string;
}

const LichLamViecBacSi: React.FC = () => {
    const [schedules, setSchedules] = useState<LichLamViec[]>([]);
    const [loading, setLoading] = useState(true);
    const user = getUserProfile();

    const currentWeekStart = useMemo(() => {
        const d = new Date();
        const day = d.getDay(), diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }, []);

    const [weekStart, setWeekStart] = useState<Date>(currentWeekStart);

    const dates = useMemo(() => {
        return Array.from({ length: 7 }).map((_, i) => {
            const d = new Date(weekStart);
            d.setDate(d.getDate() + i);
            return d;
        });
    }, [weekStart]);

    const fetchSchedules = async () => {
        setLoading(true);
        try {
            if (user?.id_nhan_vien) {
                const res = await axiosInstance.get(`/api/nhan-vien/lich-lam-viec?id_nhan_vien=${user.id_nhan_vien}`);
                setSchedules(res.data);
            }
        } catch (error) {
            toast.error("Không thể tải lịch làm việc");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSchedules();
    }, [user?.id_nhan_vien, weekStart]);

    const nextWeek = () => {
        const next = new Date(weekStart);
        next.setDate(next.getDate() + 7);
        setWeekStart(next);
    };

    const prevWeek = () => {
        const prev = new Date(weekStart);
        prev.setDate(prev.getDate() - 7);
        setWeekStart(prev);
    };

    // UX: Nhảy nhanh đến tuần hiện tại
    const jumpToCurrentWeek = () => {
        setWeekStart(currentWeekStart);
    };

    // UX: Nhảy nhanh đến tuần tới
    const jumpToNextWeek = () => {
        const next = new Date(currentWeekStart);
        next.setDate(next.getDate() + 7);
        setWeekStart(next);
    };

    // UX: Sao chép nhanh lịch từ tuần trước sang tuần đang xem
    const handleCopyFromPrevWeek = async () => {
        if (!window.confirm("Bạn có muốn sao chép lịch trực của tuần trước sang tuần này không?")) return;

        const prevWeekStart = new Date(weekStart);
        prevWeekStart.setDate(prevWeekStart.getDate() - 7);
        const prevDates = Array.from({ length: 7 }).map((_, i) => {
            const d = new Date(prevWeekStart);
            d.setDate(d.getDate() + i);
            return formatDate(d);
        });

        const prevSchedules = schedules.filter(s => prevDates.includes(s.ngay_lam));
        if (prevSchedules.length === 0) {
            toast.info("Tuần trước bạn không có ca trực nào để sao chép!");
            return;
        }

        const headers = { Role: user?.ten_vai_tro || user?.loai_tai_khoan || 'bac_si' };
        let successCount = 0;

        for (const shift of prevSchedules) {
            try {
                const date = new Date(`${shift.ngay_lam}T00:00:00`);
                date.setDate(date.getDate() + 7); // Chuyển sang tuần đang xem
                const newDateStr = formatDate(date);

                const payload = {
                    id_nhan_vien: user?.id_nhan_vien,
                    ngay_lam: newDateStr,
                    gio_bat_dau: shift.gio_bat_dau,
                    ghi_chu: "Sao chép từ tuần trước"
                };
                await axiosInstance.post('/api/nhan-vien/lich-lam-viec', payload, { headers });
                successCount++;
            } catch (err) {
                // Bỏ qua lỗi nếu ca này đã được đăng ký từ trước
            }
        }

        if (successCount > 0) {
            toast.success(`Tuyệt vời! Đã chép thành công ${successCount} ca trực sang tuần này!`);
            fetchSchedules();
        } else {
            toast.error("Không thể sao chép (có thể bạn đã đăng ký trùng các ca này rồi).");
        }
    };

    const formatDate = (d: Date) => {
        const offset = d.getTimezoneOffset() * 60000;
        const localISOTime = (new Date(d.getTime() - offset)).toISOString().split('T')[0];
        return localISOTime;
    };

    const getSchedule = (dateStr: string, timeSlot: string) => {
        return schedules.find(s => s.ngay_lam === dateStr && s.gio_bat_dau?.startsWith(timeSlot));
    };

    const handleToggleSlot = async (date: Date, timeSlot: string) => {
        const dateStr = formatDate(date);
        const existing = getSchedule(dateStr, timeSlot);

        const headers = { Role: user?.ten_vai_tro || user?.loai_tai_khoan || 'bac_si' };

        if (existing) {
            try {
                if (existing.id_lich_lam_viec) {
                    await axiosInstance.delete(`/api/nhan-vien/lich-lam-viec/${existing.id_lich_lam_viec}`, { headers });
                    fetchSchedules(); // Reset lại bảng để đồng bộ 100% với DB
                    toast.success("Đã hủy ca trực!");
                }
            } catch (err: any) {
                toast.error(err.response?.data?.message || "Lỗi hủy ca làm việc.");
            }
        } else {
            try {
                const payload = {
                    id_nhan_vien: user?.id_nhan_vien,
                    ngay_lam: dateStr,
                    gio_bat_dau: timeSlot,
                    ghi_chu: "Đăng ký lịch trực cá nhân"
                };
                await axiosInstance.post('/api/nhan-vien/lich-lam-viec', payload, { headers });
                fetchSchedules(); // Gọi lại list sau khi thêm
                toast.success(`Đã mở lịch lúc ${timeSlot}`);
            } catch (err: any) {
                toast.error(err.response?.data?.message || "Lỗi đăng ký ca làm việc");
            }
        }
    };

    // Danh sách các khung giờ (mỗi ca 30 phút)
    const timeSlots = [
        "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
        "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00",
        "18:00", "18:30", "19:00", "19:30"
    ];

    const isLocked = (d: Date) => {
        const today = new Date();
        // Quy tắc: Tuần hiện tại và quá khứ đều bị khóa với Bác sĩ (chỉ Admin mới được sửa)
        const currentDay = today.getDay(); // 0 is Sunday
        const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
        const currentMonday = new Date(today);
        currentMonday.setDate(today.getDate() + diffToMonday);
        currentMonday.setHours(0, 0, 0, 0);

        const currentSunday = new Date(currentMonday);
        currentSunday.setDate(currentMonday.getDate() + 6);
        currentSunday.setHours(23, 59, 59, 999);

        return d.getTime() <= currentSunday.getTime();
    };

    // Tính tổng số giờ làm việc trong tuần hiện tại đang xem (mỗi ca = 0.5 giờ)
    const schedulesInWeek = useMemo(() => {
        const weekDateStrs = dates.map(d => {
            const offset = d.getTimezoneOffset() * 60000;
            return (new Date(d.getTime() - offset)).toISOString().split('T')[0];
        });
        return schedules.filter(s => weekDateStrs.includes(s.ngay_lam));
    }, [schedules, dates]);

    const totalHoursInWeek = schedulesInWeek.length * 0.5;
    const isOvertime = totalHoursInWeek > 48;

    return (
        <div className="animate-fade-in" style={{ padding: '32px 40px', minHeight: '100vh' }}>
            <style>{`
                @keyframes slideUpFade {
                  from { opacity: 0; transform: translateY(30px); }
                  to { opacity: 1; transform: translateY(0); }
                }
                .stagger-1 { animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both; }
            `}</style>
            <div className="stagger-1" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', padding: '36px 48px', borderRadius: 'var(--radius-xl)', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-xl)', flexWrap: 'wrap', gap: '20px' }}>
                <div style={{ position: 'absolute', top: '-50px', left: '-50px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(45,212,191,0.15) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
                <div style={{ position: 'absolute', bottom: '-80px', right: '10%', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(45,212,191,0.1) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 950, letterSpacing: '-1px', margin: '0 0 8px 0' }}>Lịch Làm Việc Của Tôi 🗓️</h1>
                    <p style={{ fontWeight: 600, color: '#cbd5e1', margin: 0, fontSize: '1.05rem' }}>Tự do chọn khung giờ rảnh. Nhấp vào các nút giờ để mở hoặc đóng ca.</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative', zIndex: 1, alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={jumpToCurrentWeek} style={{ background: weekStart.getTime() === currentWeekStart.getTime() ? 'var(--primary)' : 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s' }}>Tuần này</button>
                        <button onClick={jumpToNextWeek} style={{ background: weekStart.getTime() === currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000 ? 'var(--primary)' : 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s' }}>Tuần tới</button>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', background: 'rgba(255,255,255,0.1)', padding: '10px 24px', borderRadius: '50px', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
                        <button onClick={prevWeek} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: 'white', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                            <span className="material-symbols-outlined">chevron_left</span>
                        </button>
                        <span style={{ fontWeight: 800, color: '#2dd4bf', fontSize: '1rem', minWidth: '120px', textAlign: 'center' }}>
                            {weekStart.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} - {dates[6].toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                        </span>
                        <button onClick={nextWeek} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', color: 'white', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.2)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                            <span className="material-symbols-outlined">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* KHUNG CẢNH BÁO LÀM VIỆC QUÁ SỨC */}
            {isOvertime && (
                <div className="animate-fade-in" style={{ marginBottom: '24px', padding: '16px 24px', background: 'var(--danger-light, rgba(239, 68, 68, 0.15))', borderRadius: '16px', border: '1px dashed var(--danger)', display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--danger)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 10px rgba(239, 68, 68, 0.3)' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>warning</span>
                    </div>
                    <div>
                        <h4 style={{ margin: '0 0 4px 0', color: 'var(--danger)', fontWeight: 900, fontSize: '1.1rem' }}>Cảnh báo làm việc quá sức!</h4>
                        <p style={{ margin: 0, color: 'var(--danger)', fontWeight: 600, fontSize: '0.9rem', opacity: 0.9 }}>
                            Bạn đã đăng ký <b>{totalHoursInWeek} giờ</b> làm việc trong tuần này (vượt mức 48 giờ/tuần). Hãy chú ý giữ gìn sức khỏe nhé!
                        </p>
                    </div>
                </div>
            )}

            {loading ? (
                <div style={{ padding: '100px', textAlign: 'center' }}><div className="dot-pulse" style={{ margin: '0 auto' }}></div></div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Nút Copy Lịch xuất hiện nếu tuần này chưa bị khóa (Tức là bác sĩ được quyền đăng ký) */}
                    {!isLocked(dates[6]) && (
                        <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '-10px' }}>
                            <button onClick={handleCopyFromPrevWeek} className="btn btn-pill" style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '10px 20px', fontSize: '0.85rem' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>content_copy</span>
                                Nhấp vào đây để chép lịch từ tuần trước
                            </button>
                        </div>
                    )}
                    {dates.map((d, i) => {
                        const locked = isLocked(d);
                        return (
                            <div key={i} className="glass-card" style={{ background: 'var(--surface)', padding: '28px', borderRadius: '28px', border: '1px solid var(--gray-200)', opacity: locked ? 0.6 : 1, transition: 'all 0.3s', boxShadow: 'var(--shadow-sm)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
                                    <div style={{ width: '64px', height: '64px', background: d.toDateString() === new Date().toDateString() ? 'var(--primary)' : 'var(--gray-100)', color: d.toDateString() === new Date().toDateString() ? 'white' : 'var(--ink)', borderRadius: '18px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: d.toDateString() === new Date().toDateString() ? '0 10px 20px rgba(15,157,138,0.2)' : 'none' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase' }}>{['CN', 'T.2', 'T.3', 'T.4', 'T.5', 'T.6', 'T.7'][d.getDay()]}</span>
                                        <span style={{ fontSize: '1.5rem', fontWeight: 950, marginTop: '-2px' }}>{d.getDate()}</span>
                                    </div>
                                    <div>
                                        <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: 900, color: 'var(--ink)' }}>{d.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
                                        <p style={{ margin: 0, color: 'var(--gray-500)', fontSize: '0.9rem', fontWeight: 600 }}>
                                            {locked ? "Đã khóa (Chỉ Admin mới có quyền điều chỉnh)" : "Nhấp vào các khung giờ bạn muốn làm việc"}
                                        </p>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                    {timeSlots.map(time => {
                                        const isRegistered = !!getSchedule(formatDate(d), time);
                                        return (
                                            <button
                                                key={time}
                                                onClick={() => !locked && handleToggleSlot(d, time)}
                                                disabled={locked}
                                                style={{
                                                    padding: '10px 20px',
                                                    borderRadius: '12px',
                                                    background: isRegistered ? 'var(--primary)' : 'transparent',
                                                    color: isRegistered ? 'white' : 'var(--ink)',
                                                    border: isRegistered ? '2px solid var(--primary)' : '2px solid var(--gray-200)',
                                                    fontWeight: 800,
                                                    fontSize: '0.95rem',
                                                    cursor: locked ? 'not-allowed' : 'pointer',
                                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '6px'
                                                }}
                                                onMouseEnter={e => { if (!locked) e.currentTarget.style.transform = 'translateY(-2px)' }}
                                                onMouseLeave={e => { if (!locked) e.currentTarget.style.transform = 'translateY(0)' }}
                                            >
                                                {isRegistered && <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>check</span>}
                                                {time}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
            <div style={{ marginTop: '32px', padding: '20px 24px', background: 'var(--primary-light)', borderRadius: '20px', display: 'flex', gap: '16px', alignItems: 'flex-start', border: '1px solid rgba(15, 157, 138, 0.2)' }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '28px' }}>info</span>
                <div>
                    <h4 style={{ margin: '0 0 8px 0', fontWeight: 900, color: 'var(--primary)', fontSize: '1rem' }}>Cơ Chế Chống Xung Đột</h4>
                    <ul style={{ margin: 0, paddingLeft: '20px', color: 'var(--ink)', fontSize: '0.95rem', lineHeight: 1.8, fontWeight: 500 }}>
                        <li>Bạn chỉ có thể mở ca làm việc trong <b>tương lai</b>. Các ngày trong quá khứ bị khóa hoàn toàn.</li>
                        <li>Khi bạn nhấn <b>Hủy ca</b>, hệ thống sẽ kiểm tra xem giờ đó đã có khách đặt chưa. Nếu có, phần mềm sẽ <b>từ chối hủy</b> để bảo vệ khách hàng!</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default LichLamViecBacSi;