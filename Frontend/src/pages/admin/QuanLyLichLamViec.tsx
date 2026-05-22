import React, { useState, useEffect, useMemo } from 'react';
import axiosInstance from '@services/axios';
import { toast } from '@components/Toast';
import { RevealSection } from '@components/SpecialEffects';
import { getUserProfile, includesSearch, normalizeSearchText, normalizeUserRole } from '@utils/index';

const HOURS = Array.from({ length: 13 }).map((_, i) => i + 8); // 8:00 đến 20:00
const DAYS = [
    { label: 'Thứ 2', key: 'Monday', index: 1 },
    { label: 'Thứ 3', key: 'Tuesday', index: 2 },
    { label: 'Thứ 4', key: 'Wednesday', index: 3 },
    { label: 'Thứ 5', key: 'Thursday', index: 4 },
    { label: 'Thứ 6', key: 'Friday', index: 5 },
    { label: 'Thứ 7', key: 'Saturday', index: 6 },
    { label: 'Chủ Nhật', key: 'Sunday', index: 0 }
];

const DOCTOR_COLORS = [
    { bg: 'rgba(15, 157, 138, 0.15)', border: '#0f9d8a', text: '#0f9d8a' }, // Teal (Màu chuẩn Rexi)
    { bg: 'rgba(59, 130, 246, 0.15)', border: '#3b82f6', text: '#2563eb' }, // Blue
    { bg: 'rgba(236, 72, 153, 0.15)', border: '#ec4899', text: '#db2777' }, // Pink
    { bg: 'rgba(139, 92, 246, 0.15)', border: '#14b8a6', text: '#115e59' }, // teal
    { bg: 'rgba(16, 185, 129, 0.15)', border: '#10b981', text: '#059669' }, // Emerald
    { bg: 'rgba(244, 63, 94, 0.15)', border: '#f43f5e', text: '#e11d48' }, // Rose
    { bg: 'rgba(245, 158, 11, 0.15)', border: '#f59e0b', text: '#d97706' }, // Amber
    { bg: 'rgba(99, 102, 241, 0.15)', border: '#6366f1', text: '#4f46e5' }, // Indigo
];

const QuanLyLichLamViec: React.FC = () => {
    const user = getUserProfile();
    const userRole = useMemo(() => normalizeUserRole(user), [user]);
    const userRoleRaw = userRole;

    const isAdmin = userRole === 'admin' || userRole === 'quan_ly';
    
    console.log('--- DEBUG SCHEDULE ---', { userRole, isAdmin });

    const [staffs, setStaffs] = useState<any[]>([]);
    const [schedules, setSchedules] = useState<any[]>([]);
    const [filterRole, setFilterRole] = useState('all');
    const [searchName, setSearchName] = useState('');

    // Quản lý tuần
    const [weekOffset, setWeekOffset] = useState(0); // 0: Tuần hiện tại, 1: Tuần tới...

    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<any>(null);
    const [selectedStaffId, setSelectedStaffId] = useState<string>('');
    const [staffPickerOpen, setStaffPickerOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'all' | 'personal'>(isAdmin ? 'all' : 'personal');
    const isAllStaffView = isAdmin && viewMode === 'all';
    const hiddenWhenPersonal = isAllStaffView
        ? {}
        : { visibility: 'hidden' as const, pointerEvents: 'none' as const };

    const [hoveredStaffId, setHoveredStaffId] = useState<string | null>(null);
    const [draggedShift, setDraggedShift] = useState<any>(null);
    const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);
    const [isCopying, setIsCopying] = useState(false);
    const currentStaffId = useMemo(() => {
        const directStaffId = user?.id_nhan_vien || user?.idNhanVien;
        if (directStaffId) return String(directStaffId);

        const accountId = user?.id_tai_khoan || user?.idTaiKhoan || user?.id;
        const staff = staffs.find(st => String(st.id_tai_khoan || st.idTaiKhoan || '') === String(accountId || ''));
        return staff?.id_nhan_vien ? String(staff.id_nhan_vien) : '';
    }, [user, staffs]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [staffRes, scheduleRes] = await Promise.all([
                axiosInstance.get('/api/nhan-vien'),
                axiosInstance.get('/api/nhan-vien/lich-lam-viec')
            ]);
            setStaffs(staffRes.data);
            setSchedules(scheduleRes.data);
            if (!isAdmin && user) {
                const accountId = user.id_tai_khoan || user.idTaiKhoan || user.id;
                const staff = staffRes.data.find((st: any) => String(st.id_tai_khoan || st.idTaiKhoan || '') === String(accountId || ''));
                setSelectedStaffId(String(user.id_nhan_vien || user.idNhanVien || staff?.id_nhan_vien || ''));
            }
        } catch (error) {
            toast.error("Lỗi tải dữ liệu lịch trực");
        }
    };

    // Tính toán ngày trong tuần dựa trên weekOffset
    const weekDates = useMemo(() => {
        const now = new Date();
        const currentDay = now.getDay(); // 0 (Sun) to 6 (Sat)
        const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;

        const monday = new Date(now);
        monday.setDate(now.getDate() + diffToMonday + (weekOffset * 7));
        monday.setHours(0, 0, 0, 0);

        return DAYS.map(day => {
            const date = new Date(monday);
            // Monday is index 0 in our DAYS mapping for calculation
            const dayOffset = day.index === 0 ? 6 : day.index - 1;
            date.setDate(monday.getDate() + dayOffset);

            // Tối ưu múi giờ (Tránh bị lùi ngày do GMT+7 ở Việt Nam)
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');

            return {
                ...day,
                date: date,
                dateStr: `${year}-${month}-${d}`
            };
        });
    }, [weekOffset]);

    const visibleSchedules = useMemo(() => {
        let filtered = schedules;

        // Lọc theo chế độ xem (Cá nhân vs Tất cả)
        if (viewMode === 'personal' && user) {
            const userId = currentStaffId;
            filtered = schedules.filter(s => String(s.id_nhan_vien) === String(userId));
        }

        return filtered.filter(s => {
            const staffInfo = staffs.find(st => String(st.id_nhan_vien) === String(s.id_nhan_vien));
            const role = staffInfo ? (staffInfo.chuyen_mon || staffInfo.chuc_vu || 'Nhân viên') : 'Nhân viên';
            const matchRole = filterRole === 'all' || normalizeSearchText(role) === normalizeSearchText(filterRole);
            const hoTen = staffInfo ? staffInfo.ho_ten : (s.ho_ten || '');
            const matchName = includesSearch(hoTen, searchName) || includesSearch(staffInfo?.so_dien_thoai, searchName) || includesSearch(staffInfo?.email, searchName);
            return matchRole && matchName;
        });
    }, [schedules, filterRole, searchName, viewMode, user, staffs, currentStaffId]);

    const staffWorkingHours = useMemo(() => {
        if (!isAllStaffView) return [];
        const weekDateStrs = weekDates.map(d => d.dateStr);
        const shiftsThisWeek = visibleSchedules.filter(s => weekDateStrs.includes(s.ngay_lam));

        const stats: Record<string, { id_nhan_vien: string, ho_ten: string, chuc_vu: string, hours: number }> = {};

        shiftsThisWeek.forEach(s => {
            if (!stats[s.id_nhan_vien]) {
                const staffInfo = staffs.find(st => String(st.id_nhan_vien) === String(s.id_nhan_vien));
                stats[s.id_nhan_vien] = { id_nhan_vien: s.id_nhan_vien, ho_ten: staffInfo ? staffInfo.ho_ten : 'Nhân viên', chuc_vu: staffInfo ? (staffInfo.chuyen_mon || staffInfo.chuc_vu || 'Nhân viên') : 'Nhân viên', hours: 0 };
            }
            stats[s.id_nhan_vien].hours += 0.5; // Mỗi ca 30 phút = 0.5 giờ
        });

        return Object.values(stats).sort((a, b) => b.hours - a.hours);
    }, [visibleSchedules, weekDates, isAllStaffView, staffs]);

    const allRoles = useMemo(() => {
        const roles = new Set<string>();
        staffs.forEach(s => {
            const r = s.chuyen_mon || s.chuc_vu;
            if (r) roles.add(r);
        });
        return Array.from(roles);
    }, [staffs]);

    const staffsByRole = useMemo(() => {
        const grouped: Record<string, any[]> = {};
        staffs.forEach(s => {
            const r = s.chuyen_mon || s.chuc_vu || 'Nhân viên';
            if (!grouped[r]) grouped[r] = [];
            grouped[r].push(s);
        });
        return grouped;
    }, [staffs]);

    const selectedStaff = useMemo(() => {
        return staffs.find(s => String(s.id_nhan_vien) === String(selectedStaffId));
    }, [staffs, selectedStaffId]);

    const handleAddShift = (day: any, hour: number) => {
        // RÀNG BUỘC: Nhân viên chỉ được đăng ký lịch cho tuần sau (weekOffset >= 1)
        if (!isAdmin && weekOffset < 1) {
            toast.error("Bạn chỉ có thể đăng ký lịch trực cho các tuần tiếp theo. Tuần hiện tại chỉ Admin mới có quyền điều chỉnh.");
            return;
        }

        setSelectedSlot({ day, hour });
        // Ở chế độ cá nhân, chỉ đăng ký cho chính người đang đăng nhập.
        if (!isAllStaffView) setSelectedStaffId(currentStaffId);
        setShowAddModal(true);
    };

    const confirmAddShift = async () => {
        if (!selectedStaffId || !selectedSlot) return;

        try {
            const payload = {
                id_nhan_vien: selectedStaffId,
                ngay_lam: selectedSlot.day.dateStr,
                gio_bat_dau: `${String(selectedSlot.hour).padStart(2, '0')}:00:00`,
                ghi_chu: isAdmin ? "Admin sắp xếp lịch" : "Đăng ký lịch trực"
            };

            const headers = { Role: userRoleRaw };
            await axiosInstance.post('/api/nhan-vien/lich-lam-viec', payload, { headers });
            toast.success(isAdmin ? "Đã cập nhật ca trực!" : "Đã đăng ký ca trực thành công!");
            setShowAddModal(false);
            setStaffPickerOpen(false);
            fetchData();
        } catch (error: any) {
            console.error('Server Error Details:', error.response?.data || error.message);
            toast.error(error.response?.data?.message || "Lỗi khi đăng ký ca trực. Vui lòng kiểm tra lại dữ liệu.");
        }
    };

    const handleExportExcel = () => {
        try {
            let csvContent = "\uFEFF"; // Thêm BOM để Excel đọc tiếng Việt không bị lỗi font
            csvContent += "LỊCH TRỰC NHÂN SỰ REXI\n";
            csvContent += `Từ ${weekDates[0].dateStr} đến ${weekDates[6].dateStr}\n\n`;

            csvContent += "Ngày,Thứ,Ca làm việc,Tên nhân viên,Chức vụ\n";

            // Lọc ra các ca trực trong tuần hiện tại đang xem
            const weekDateStrs = weekDates.map(d => d.dateStr);
            const shiftsToExport = visibleSchedules.filter(s => weekDateStrs.includes(s.ngay_lam));

            // Sắp xếp theo ngày -> giờ -> tên
            shiftsToExport.sort((a, b) => {
                if (a.ngay_lam !== b.ngay_lam) return a.ngay_lam.localeCompare(b.ngay_lam);
                if (a.gio_bat_dau !== b.gio_bat_dau) return a.gio_bat_dau.localeCompare(b.gio_bat_dau);
                return a.id_nhan_vien.localeCompare(b.id_nhan_vien);
            });

            shiftsToExport.forEach(shift => {
                const dayObj = weekDates.find(d => d.dateStr === shift.ngay_lam);
                const dayLabel = dayObj ? dayObj.label : "";
                const staffInfo = staffs.find(st => String(st.id_nhan_vien) === String(shift.id_nhan_vien));
                csvContent += `${shift.ngay_lam},${dayLabel},${shift.gio_bat_dau?.substring(0, 5)},"${staffInfo?.ho_ten || 'Nhân viên'}","${staffInfo?.chuyen_mon || 'Nhân viên'}"\n`;
            });

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `LichTruc_Rexi_${weekDates[0].dateStr}_${weekDates[6].dateStr}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast.success("Đã xuất lịch trực ra file Excel thành công!");
        } catch (err) {
            toast.error("Lỗi khi xuất file Excel!");
        }
    };

    const handleCopyScheduleToNextWeek = async (staffId: string) => {
        if (!window.confirm("Bạn có chắc chắn muốn sao chép toàn bộ lịch trực của nhân viên này sang tuần tiếp theo không?")) return;

        const weekDateStrs = weekDates.map(d => d.dateStr);
        const shiftsToCopy = schedules.filter(s => String(s.id_nhan_vien) === String(staffId) && weekDateStrs.includes(s.ngay_lam));

        if (shiftsToCopy.length === 0) {
            toast.info("Nhân viên này không có ca trực nào trong tuần hiện tại để sao chép!");
            return;
        }

        let successCount = 0;
        const headers = { Role: userRole };


        for (const shift of shiftsToCopy) {
            try {
                const date = new Date(`${shift.ngay_lam}T00:00:00`);
                date.setDate(date.getDate() + 7);
                const nextWeekDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

                const payload = {
                    id_nhan_vien: shift.id_nhan_vien,
                    ngay_lam: nextWeekDateStr,
                    gio_bat_dau: shift.gio_bat_dau,
                    ghi_chu: shift.ghi_chu || "Sao chép lịch trực từ tuần trước"
                };
                await axiosInstance.post('/api/nhan-vien/lich-lam-viec', payload, { headers });
                successCount++;
            } catch (error) {
                // Bỏ qua lỗi trùng lịch
            }
        }

        if (successCount > 0) {
            toast.success(`Đã sao chép thành công ${successCount} ca trực sang tuần tới!`);
            fetchData();
        } else {
            toast.error("Không thể sao chép ca trực nào (Có thể do trùng lịch ở tuần tới).");
        }
    };

    const handleCopyAllSchedulesToNextWeek = async () => {
        if (!window.confirm("Bạn có chắc chắn muốn sao chép toàn bộ lịch trực của TẤT CẢ nhân viên trong tuần này sang tuần tiếp theo không?")) return;

        const weekDateStrs = weekDates.map(d => d.dateStr);
        const shiftsToCopy = schedules.filter(s => weekDateStrs.includes(s.ngay_lam));

        if (shiftsToCopy.length === 0) {
            toast.info("Không có ca trực nào trong tuần hiện tại để sao chép!");
            return;
        }

        setIsCopying(true);
        let successCount = 0;
        let failCount = 0;
        const headers = { Role: userRoleRaw };

        try {
            for (const shift of shiftsToCopy) {
                try {
                    const date = new Date(`${shift.ngay_lam}T00:00:00`);
                    date.setDate(date.getDate() + 7);
                    const nextWeekDateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

                    const payload = {
                        id_nhan_vien: shift.id_nhan_vien,
                        ngay_lam: nextWeekDateStr,
                        gio_bat_dau: shift.gio_bat_dau,
                        ghi_chu: shift.ghi_chu || "Sao chép lịch trực từ tuần trước"
                    };
                    await axiosInstance.post('/api/nhan-vien/lich-lam-viec', payload, { headers });
                    successCount++;
                } catch (error) {
                    failCount++;
                }
            }
            
            if (successCount > 0) {
                toast.success(`Đã sao chép thành công ${successCount} ca trực sang tuần tới!`);
                if (failCount > 0) toast.info(`Có ${failCount} ca bị trùng hoặc lỗi không thể sao chép.`);
                fetchData();
            } else {
                toast.error("Không thể sao chép ca trực nào. Có thể tất cả các ca đều đã tồn tại ở tuần tới.");
            }
        } finally {
            setIsCopying(false);
        }
    };

    const handleMoveShift = async (shift: any, targetDay: any, targetHour: number) => {
        // KIỂM TRA QUYỀN SỞ HỮU: Nhân viên không được động vào lịch người khác
        if (!isAdmin && String(shift.id_nhan_vien) !== currentStaffId) {
            toast.error("Bạn không có quyền di chuyển lịch trực của người khác!");
            return;
        }

        if (!isAdmin && weekOffset < 1) {
            toast.error("Bạn chỉ có thể điều chỉnh lịch của chính mình cho các tuần tiếp theo.");
            return;
        }

        const newDateStr = targetDay.dateStr;
        const newTimeStr = `${String(targetHour).padStart(2, '0')}:00:00`;

        if (shift.ngay_lam === newDateStr && shift.gio_bat_dau?.startsWith(String(targetHour).padStart(2, '0'))) {
            return; // Đã ở đúng vị trí
        }

        try {
            const headers = { Role: userRoleRaw };

            // Xóa lịch cũ trước
            await axiosInstance.delete(`/api/nhan-vien/lich-lam-viec/${shift.id_lich_lam_viec}`, { headers });

            // Thêm lịch mới
            const payload = {
                id_nhan_vien: shift.id_nhan_vien,
                ngay_lam: newDateStr,
                gio_bat_dau: newTimeStr,
                ghi_chu: shift.ghi_chu || "Chuyển lịch trực"
            };
            await axiosInstance.post('/api/nhan-vien/lich-lam-viec', payload, { headers });

            toast.success("Đã cập nhật ca trực!");
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi khi chuyển ca trực");
            fetchData(); // Phục hồi dữ liệu giao diện nếu lỗi
        }
    };

    const handleDeleteShift = async (id: number, shiftStaffId: string) => {
        // KIỂM TRA QUYỀN SỞ HỮU
        if (!isAdmin && String(shiftStaffId) !== currentStaffId) {
            toast.error("Bạn không có quyền xóa lịch trực của người khác!");
            return;
        }

        // RÀNG BUỘC: Tương tự khi xóa
        if (!isAdmin && weekOffset < 1) {
            toast.error("Bạn không thể xóa lịch trực ở tuần hiện tại. Vui lòng liên hệ Admin.");
            return;
        }

        if (!window.confirm("Bạn có chắc chắn muốn hủy ca trực này?")) return;

        try {
            const headers = { Role: userRoleRaw };
            await axiosInstance.delete(`/api/nhan-vien/lich-lam-viec/${id}`, { headers });
            toast.success("Đã hủy ca trực");
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi khi hủy ca trực");
        }
    };


    const getShiftColor = (id: string | number, role: string) => {
        const r = role?.toLowerCase() || '';
        const safeId = String(id || '');
        if (r.includes('bác sĩ') || r.includes('bac si')) {
            return DOCTOR_COLORS[safeId.length % DOCTOR_COLORS.length] || DOCTOR_COLORS[0];
        }
        if (r.includes('y tá') || r.includes('y ta')) return { bg: 'rgba(59, 130, 246, 0.1)', border: '#3b82f6', text: '#3b82f6' };
        if (r.includes('tiếp tân') || r.includes('tiep tan')) return { bg: 'rgba(245, 158, 11, 0.1)', border: '#f59e0b', text: '#f59e0b' };
        return { bg: 'rgba(107, 114, 128, 0.1)', border: '#6b7280', text: '#6b7280' };
    };

    return (
        <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #print-section, #print-section * { visibility: visible; }
                    #print-section { position: absolute; left: 0; top: 0; width: 100%; padding: 0; margin: 0; }
                    .no-print { display: none !important; }
                    .print-only { display: block !important; }
                    /* Mở rộng chiều cao để in được hết */
                    .print-scroll-area { height: auto !important; overflow: visible !important; }
                    .glass-card { box-shadow: none !important; border: 1px solid #ccc !important; }
                }
                .schedule-scroll-wrap {
                    width: 100%;
                    max-height: 700px;
                    overflow: auto;
                }
                .schedule-scroll-wrap::-webkit-scrollbar,
                .slot-shift-list::-webkit-scrollbar {
                    height: 8px;
                    width: 8px;
                }
                .schedule-scroll-wrap::-webkit-scrollbar-thumb,
                .slot-shift-list::-webkit-scrollbar-thumb {
                    background: rgba(13, 148, 136, 0.24);
                    border-radius: 999px;
                }
                .schedule-grid {
                    min-width: 1320px;
                    display: grid;
                    grid-template-columns: 76px repeat(7, minmax(170px, 1fr));
                }
                .schedule-header-grid {
                    position: sticky;
                    top: 0;
                    z-index: 5;
                    background: var(--background);
                }
                .slot-shift-list {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    max-height: 98px;
                    overflow-y: auto;
                    padding-right: 2px;
                }
                .shift-card {
                    width: 100%;
                    min-width: 0;
                    overflow: hidden;
                }
                .shift-main-text,
                .shift-sub-text {
                    display: block;
                    max-width: 100%;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .shift-sub-text {
                    opacity: 0.72;
                    font-size: 0.65rem;
                }
                .slot-summary {
                    min-height: 22px;
                    overflow: hidden;
                }
                .staff-picker-menu::-webkit-scrollbar {
                    width: 8px;
                }
                .staff-picker-menu::-webkit-scrollbar-thumb {
                    background: rgba(20, 184, 166, 0.45);
                    border-radius: 999px;
                }
            `}</style>
            <main style={{ flex: 1, padding: '32px 40px', overflowY: 'auto' }}>
                <RevealSection>
                    <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px', flexWrap: 'wrap', gap: '32px' }}>
                        <div style={{ flex: '1', minWidth: '350px' }}>
                            <h1 style={{ fontSize: '2.5rem', fontWeight: 950, color: 'var(--ink)', margin: 0, letterSpacing: '-1.5px' }}>
                                {viewMode === 'all' ? 'Điều Hành' : 'Lịch Trực'} <span style={{ color: 'var(--primary)' }}>{viewMode === 'all' ? 'Nhân Sự' : 'Cá Nhân'}</span>
                            </h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '12px', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', gap: '8px', background: 'var(--surface)', padding: '6px', borderRadius: '12px', border: '1px solid var(--gray-200)', flexShrink: 0 }}>
                                    <button data-ai-id="button-quanlylichlamviec-4q8w"
                                        onClick={() => setWeekOffset(0)}
                                        style={{
                                            background: weekOffset === 0 ? 'var(--primary)' : 'transparent',
                                            color: weekOffset === 0 ? 'white' : 'var(--ink)',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: '8px 16px',
                                            borderRadius: '8px',
                                            fontWeight: 800,
                                            fontSize: '0.8rem',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        TUẦN NÀY
                                    </button>
                                    <button data-ai-id="button-quanlylichlamviec-z8sa"
                                        onClick={() => setWeekOffset(1)}
                                        style={{
                                            background: weekOffset === 1 ? 'var(--primary)' : 'transparent',
                                            color: weekOffset === 1 ? 'white' : 'var(--ink)',
                                            border: 'none',
                                            cursor: 'pointer',
                                            padding: '8px 16px',
                                            borderRadius: '8px',
                                            fontWeight: 800,
                                            fontSize: '0.8rem',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        TUẦN TỚI
                                    </button>
                                    <div style={{ width: '1px', background: 'var(--gray-200)', margin: '4px 8px' }}></div>
                                    <button data-ai-id="button-quanlylichlamviec-qxer"
                                        onClick={() => setWeekOffset(prev => prev - 1)}
                                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}
                                    >
                                        <span className="material-symbols-outlined">chevron_left</span>
                                    </button>
                                    <span style={{ fontWeight: 800, padding: '0 12px', color: 'var(--ink)', display: 'flex', alignItems: 'center', fontSize: '0.9rem', minWidth: '100px', justifyContent: 'center' }}>
                                        {weekOffset === 0 ? 'Tuần hiện tại' : weekOffset === 1 ? 'Tuần tới' : `Tuần +${weekOffset}`}
                                    </span>
                                    <button data-ai-id="button-quanlylichlamviec-xis7"
                                        onClick={() => setWeekOffset(prev => prev + 1)}
                                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex' }}
                                    >
                                        <span className="material-symbols-outlined">chevron_right</span>
                                    </button>
                                </div>
                                <p style={{ color: 'var(--gray-500)', fontWeight: 600, margin: 0 }}>
                                    {viewMode === 'all' ? 'Quản lý và điều phối lịch làm việc của toàn bộ đội ngũ.' : 'Theo dõi lịch trực cá nhân và đăng ký ca mới.'}
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            {isAdmin && (
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', ...hiddenWhenPersonal }}>
                                    <button data-ai-id="button-quanlylichlamviec-z4n2" className="btn btn-pill no-print" disabled={isCopying || !isAllStaffView} onClick={handleCopyAllSchedulesToNextWeek} style={{ background: isCopying ? 'var(--gray-200)' : 'var(--gray-100)', color: 'var(--ink)', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 800 }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>{isCopying ? 'sync' : 'content_paste'}</span>
                                        {isCopying ? 'Đang sao chép...' : 'Sao chép tất cả'}
                                    </button>
                                    <button data-ai-id="button-quanlylichlamviec-8viu" className="btn btn-pill no-print" onClick={handleExportExcel} style={{ background: 'var(--gray-100)', color: 'var(--ink)', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 800 }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
                                        Xuất Excel
                                    </button>
                                    <button data-ai-id="button-quanlylichlamviec-juro" className="btn btn-pill no-print" onClick={() => window.print()} style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 800 }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>print</span>
                                        In lịch trực
                                    </button>
                                </div>
                            )}

                            {isAdmin && (
                                <div style={{ display: 'flex', gap: '4px', background: 'var(--gray-100)', padding: '4px', borderRadius: '12px' }}>
                                    <button data-ai-id="button-quanlylichlamviec-4x0m"
                                        onClick={() => setViewMode('all')}
                                        style={{
                                            background: viewMode === 'all' ? 'white' : 'transparent',
                                            color: viewMode === 'all' ? 'var(--primary)' : 'var(--gray-500)',
                                            border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.3s',
                                            boxShadow: viewMode === 'all' ? 'var(--shadow-sm)' : 'none'
                                        }}
                                    >
                                        TẤT CẢ
                                    </button>
                                    <button data-ai-id="button-quanlylichlamviec-6ewm"
                                        onClick={() => {
                                            setViewMode('personal');
                                            setFilterRole('all');
                                            setSearchName('');
                                            setSelectedStaffId(currentStaffId);
                                        }}
                                        style={{
                                            background: viewMode === 'personal' ? 'white' : 'transparent',
                                            color: viewMode === 'personal' ? 'var(--primary)' : 'var(--gray-500)',
                                            border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: 800, fontSize: '0.75rem', cursor: 'pointer', transition: 'all 0.3s',
                                            boxShadow: viewMode === 'personal' ? 'var(--shadow-sm)' : 'none'
                                        }}
                                    >
                                        CÁ NHÂN
                                    </button>
                                </div>
                            )}

                            {isAdmin && (
                                <div style={{ display: 'flex', gap: '12px', ...hiddenWhenPersonal }}>
                                    <div className="glass-card" style={{ display: 'flex', alignItems: 'center', padding: '0 16px', borderRadius: '16px', border: '1px solid var(--gray-200)', background: 'var(--surface)' }}>
                                        <span className="material-symbols-outlined" style={{ color: 'var(--gray-400)', marginRight: '8px' }}>search</span>
                                        <input data-ai-id="input-quanlylichlamviec-aiab"
                                            type="text"
                                            placeholder="Tên nhân viên..."
                                            value={searchName}
                                            onChange={(e) => setSearchName(e.target.value)}
                                            style={{ border: 'none', outline: 'none', background: 'transparent', padding: '12px 0', fontWeight: 600, width: '150px', color: 'var(--ink)' }}
                                        />
                                    </div>
                                    <select data-ai-id="select-quanlylichlamviec-xcaz"
                                        value={filterRole}
                                        onChange={(e) => setFilterRole(e.target.value)}
                                        style={{ padding: '12px 20px', borderRadius: '16px', border: '1px solid var(--gray-200)', outline: 'none', fontWeight: 800, cursor: 'pointer', background: 'var(--surface)', color: 'var(--ink)' }}
                                    >
                                        <option value="all">Tất cả chức vụ</option>
                                        {allRoles.map(role => (
                                            <option key={role} value={role}>{role}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    {isAdmin && (
                            <div className="no-print" style={{ minHeight: '74px', marginBottom: '24px', animation: isAllStaffView ? 'fadeInUp 0.4s ease-out' : 'none', ...hiddenWhenPersonal }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--gray-500)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    ⏱️ THỐNG KÊ GIỜ LÀM TRONG TUẦN
                                </div>
                                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                    {staffWorkingHours.map((staff, idx) => (
                                        <div key={idx} style={{
                                            background: staff.hours > 48 ? 'var(--danger-light, rgba(239, 68, 68, 0.15))' : 'var(--surface)',
                                            border: staff.hours > 48 ? '1px dashed var(--danger)' : '1px solid var(--gray-200)',
                                            padding: '8px 16px',
                                            borderRadius: '50px',
                                            fontSize: '0.85rem',
                                            fontWeight: 700,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            color: staff.hours > 48 ? 'var(--danger)' : 'var(--ink)',
                                            boxShadow: 'var(--shadow-sm)'
                                        }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                                                {staff.hours > 48 ? 'warning' : 'account_circle'}
                                            </span>
                                            {staff.ho_ten}: <span style={{ fontWeight: 900, fontSize: '0.9rem' }}>{staff.hours} giờ</span>
                                            {isAdmin && (
                                                <button data-ai-id="button-quanlylichlamviec-rjkj"
                                                    onClick={() => handleCopyScheduleToNextWeek(staff.id_nhan_vien)}
                                                    title="Sao chép lịch sang tuần tiếp theo"
                                                    style={{ background: 'var(--primary-light)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--primary)', padding: '4px', borderRadius: '50%', marginLeft: '4px', transition: 'transform 0.2s' }}
                                                    onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
                                                    onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                                >
                                                    <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>content_copy</span>
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div id="print-section">
                            <div className="print-only" style={{ display: 'none', marginBottom: '20px', textAlign: 'center' }}>
                                <h2 style={{ fontSize: '1.8rem', fontWeight: 900 }}>{viewMode === 'all' ? 'Lịch Trực Nhân Sự Rexi' : 'Lịch Trực Cá Nhân'}</h2>
                                <p style={{ fontSize: '1rem', color: '#555' }}>Từ {weekDates[0].dateStr} đến {weekDates[6].dateStr}</p>
                            </div>
                            <div className="glass-card" style={{ borderRadius: '32px', border: '1px solid var(--gray-200)', background: 'var(--surface)', overflow: 'hidden', boxShadow: 'var(--shadow-xl)' }}>
                                <div className="schedule-scroll-wrap">
                                <div className="schedule-grid schedule-header-grid">
                                    <div style={{ padding: '20px', borderRight: '1px solid var(--gray-200)' }}></div>
                                    {weekDates.map(day => (
                                        <div key={day.key} style={{ padding: '15px 10px', textAlign: 'center', borderRight: '1px solid var(--gray-200)' }}>
                                            <div style={{ fontWeight: 900, color: 'var(--ink)', fontSize: '0.85rem' }}>{day.label}</div>
                                            <div style={{ color: 'var(--gray-400)', fontSize: '0.75rem', fontWeight: 700, marginTop: '4px' }}>
                                                {day.date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="print-scroll-area schedule-grid">
                                    {HOURS.map(hour => (
                                        <React.Fragment key={hour}>
                                            <div style={{
                                                padding: '20px 0',
                                                textAlign: 'center',
                                                borderTop: '1px solid var(--gray-100)',
                                                borderRight: '1px solid var(--gray-200)',
                                                color: 'var(--gray-400)',
                                                fontWeight: 800,
                                                fontSize: '0.75rem',
                                                background: 'var(--background)'
                                            }}>
                                                {hour}:00
                                            </div>
                                            {weekDates.map(day => {
                                                const today = new Date();
                                                today.setHours(0, 0, 0, 0);
                                                const cellDate = new Date(`${day.dateStr}T00:00:00`);
                                                const isPastDay = cellDate < today;
                                                const isLockedSlot = isPastDay || (!isAdmin && weekOffset < 1);

                                                const shiftsInSlot = visibleSchedules.filter(s => {
                                                    return s.ngay_lam === day.dateStr && parseInt(s.gio_bat_dau?.split(':')[0]) === hour;
                                                });

                                                const isShortStaffed = !isPastDay && shiftsInSlot.length > 0 && shiftsInSlot.length < 2;
                                                const isDragOver = dragOverSlot === `${day.key}-${hour}`;

                                                return (
                                                    <div
                                                        key={`${day.key}-${hour}`}
                                                        onDragOver={(e) => {
                                                            if (!isLockedSlot) {
                                                                e.preventDefault();
                                                                e.dataTransfer.dropEffect = 'move';
                                                                setDragOverSlot(`${day.key}-${hour}`);
                                                            }
                                                        }}
                                                        onDragLeave={() => setDragOverSlot(null)}
                                                        onDrop={(e) => {
                                                            e.preventDefault();
                                                            setDragOverSlot(null);
                                                            if (!isLockedSlot && draggedShift) handleMoveShift(draggedShift, day, hour);
                                                        }}
                                                        style={{
                                                            minHeight: '138px',
                                                            borderTop: '1px solid var(--gray-100)',
                                                            borderRight: '1px solid var(--gray-100)',
                                                            padding: '6px',
                                                            background: isDragOver ? 'var(--primary-light)' : (isPastDay ? 'var(--gray-50)' : (isShortStaffed ? 'rgba(239, 68, 68, 0.08)' : 'transparent')),
                                                            boxShadow: isDragOver ? 'inset 0 0 0 2px var(--primary)' : 'none',
                                                            opacity: isPastDay ? 0.6 : 1,
                                                            position: 'relative',
                                                            transition: 'background 0.2s',
                                                            minWidth: 0,
                                                            overflow: 'hidden'
                                                        }}
                                                    >
                                                        {shiftsInSlot.length > 0 && (
                                                            <div className="slot-summary" style={{ fontSize: '0.65rem', fontWeight: 900, color: isShortStaffed ? 'var(--danger)' : 'var(--gray-400)', marginBottom: '6px', textAlign: 'left', paddingLeft: '4px', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                                                                <span><span style={{ color: isShortStaffed ? 'var(--danger)' : 'var(--primary)' }}>{shiftsInSlot.length}</span> nhân sự trực</span>
                                                                {isShortStaffed && <span style={{ color: 'var(--danger)', fontSize: '0.6rem', background: 'rgba(239, 68, 68, 0.15)', padding: '2px 6px', borderRadius: '6px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>Thiếu người</span>}
                                                            </div>
                                                        )}
                                                        <div className="slot-shift-list">
                                                            {shiftsInSlot.map(shift => {
                                                                const staffInfo = staffs.find(s => s.id_nhan_vien === shift.id_nhan_vien);
                                                                const colors = getShiftColor(shift.id_nhan_vien, staffInfo?.chuyen_mon || 'staff');
                                                                const avatar = staffInfo?.hinh_anh || "/img/avtpkty.png";
                                                                return (
                                                                    <div
                                                                        className="shift-card"
                                                                        key={shift.id_lich_lam_viec}
                                                                        draggable={!isLockedSlot}
                                                                        onDragStart={() => !isLockedSlot && setDraggedShift(shift)}
                                                                        style={{
                                                                            background: colors.bg,
                                                                            border: `1px solid ${colors.border}`,
                                                                            color: colors.text,
                                                                            padding: '8px',
                                                                            borderRadius: '12px',
                                                                            fontSize: '0.75rem',
                                                                            fontWeight: 800,
                                                                            boxShadow: 'var(--shadow-sm)',
                                                                            position: 'relative',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: '8px',
                                                                            cursor: isLockedSlot ? 'default' : 'grab',
                                                                            minHeight: '52px'
                                                                        }}
                                                                        onMouseEnter={() => setHoveredStaffId(shift.id_nhan_vien)}
                                                                        onMouseLeave={() => setHoveredStaffId(null)}
                                                                    >
                                                                        <div style={{ position: 'relative', display: 'inline-block' }}>
                                                                            <img src={avatar} alt={shift.ho_ten} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: `1px solid ${colors.border}`, background: 'white' }} />
                                                                            {hoveredStaffId === shift.id_nhan_vien && staffInfo && (
                                                                                <div style={{
                                                                                    position: 'absolute',
                                                                                    bottom: '100%', // Position above the avatar
                                                                                    left: '50%',
                                                                                    transform: 'translateX(-50%) translateY(-10px)', // Adjust for spacing
                                                                                    background: 'var(--surface)',
                                                                                    border: '1px solid var(--gray-200)',
                                                                                    borderRadius: '12px',
                                                                                    padding: '10px 15px',
                                                                                    boxShadow: 'var(--shadow-lg)',
                                                                                    zIndex: 100,
                                                                                    whiteSpace: 'nowrap',
                                                                                    fontSize: '0.75rem',
                                                                                    fontWeight: 600,
                                                                                    color: 'var(--ink)',
                                                                                    minWidth: '150px',
                                                                                    textAlign: 'left'
                                                                                }}>
                                                                                    <p style={{ margin: '0 0 4px 0', fontWeight: 800 }}>{staffInfo.ho_ten}</p>
                                                                                    {staffInfo.email && <p style={{ margin: '0 0 2px 0', display: 'flex', alignItems: 'center', gap: '4px' }}><span className="material-symbols-outlined" style={{ fontSize: '14px' }}>mail</span> {staffInfo.email}</p>}
                                                                                    {staffInfo.so_dien_thoai && <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}><span className="material-symbols-outlined" style={{ fontSize: '14px' }}>call</span> {staffInfo.so_dien_thoai}</p>}
                                                                                    <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: '8px solid var(--gray-200)' }} />
                                                                                    <div style={{ position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%) translateY(-1px)', width: 0, height: 0, borderLeft: '8px solid transparent', borderRight: '8px solid transparent', borderTop: '8px solid var(--surface)' }} />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <div style={{ flex: 1, minWidth: 0, textAlign: 'left', paddingRight: '14px' }}>
                                                                            <div className="shift-main-text" title={staffInfo ? staffInfo.ho_ten : shift.id_nhan_vien} style={{ textTransform: 'uppercase', marginBottom: '2px' }}>{staffInfo ? staffInfo.ho_ten : shift.id_nhan_vien}</div>
                                                                            <div className="shift-sub-text" title={staffInfo ? (staffInfo.chuyen_mon || staffInfo.chuc_vu) : 'Nhân viên'}>{staffInfo ? (staffInfo.chuyen_mon || staffInfo.chuc_vu) : 'Nhân viên'}</div>
                                                                        </div>

                                                                        {!isPastDay && (
                                                                            <button data-ai-id="button-quanlylichlamviec-axos"
                                                                                className="no-print"
                                                                                onClick={() => handleDeleteShift(shift.id_lich_lam_viec, shift.id_nhan_vien)}
                                                                                style={{ position: 'absolute', top: '4px', right: '4px', background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}
                                                                            >
                                                                                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>cancel</span>
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>

                                                        {!isPastDay && (
                                                            <button data-ai-id="button-quanlylichlamviec-r0au"
                                                                className="no-print"
                                                                data-testid="add-shift-btn"
                                                                style={{ position: 'absolute', bottom: '6px', right: '6px', background: 'transparent', border: 'none', color: 'var(--gray-300)', cursor: 'pointer', transition: 'color 0.2s' }}
                                                                onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                                                                onMouseLeave={e => e.currentTarget.style.color = 'var(--gray-300)'}
                                                                onClick={() => handleAddShift(day, hour)}
                                                            >
                                                                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add_circle</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </React.Fragment>
                                    ))}
                                </div>
                                </div>
                            </div>
                        </div>
                </RevealSection>
            </main>

            {/* MODAL THÊM CA TRỰC */}
            {showAddModal && (
                <div onClick={() => setStaffPickerOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="glass-card" style={{ width: '450px', padding: '40px', borderRadius: '32px', background: 'var(--surface)' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 950, marginBottom: '24px', letterSpacing: '-0.5px' }}>Đăng Ký <span style={{ color: 'var(--primary)' }}>Ca Trực</span></h2>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px', color: 'var(--gray-500)', fontSize: '0.85rem' }}>NHÂN VIÊN</label>
                            {isAllStaffView ? (
                                <div data-ai-id="select-quanlylichlamviec-atmu" onClick={(e) => e.stopPropagation()} style={{ position: 'relative' }}>
                                    <button
                                        type="button"
                                        onClick={() => setStaffPickerOpen(v => !v)}
                                        style={{
                                            width: '100%',
                                            padding: '14px 16px',
                                            borderRadius: '16px',
                                            border: '1px solid var(--primary)',
                                            outline: 'none',
                                            fontWeight: 800,
                                            background: 'var(--gray-50)',
                                            color: 'var(--ink)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            cursor: 'pointer',
                                            textAlign: 'left'
                                        }}
                                    >
                                        <span>{selectedStaff?.ho_ten || 'Chọn nhân viên...'}</span>
                                        <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--primary)' }}>
                                            {staffPickerOpen ? 'expand_less' : 'expand_more'}
                                        </span>
                                    </button>
                                    {staffPickerOpen && (
                                        <div
                                            className="staff-picker-menu"
                                            style={{
                                                position: 'absolute',
                                                zIndex: 1002,
                                                top: 'calc(100% + 8px)',
                                                left: 0,
                                                right: 0,
                                                maxHeight: '320px',
                                                overflowY: 'auto',
                                                background: 'var(--surface)',
                                                color: 'var(--ink)',
                                                border: '1px solid var(--primary)',
                                                borderRadius: '18px',
                                                boxShadow: 'var(--shadow-xl)',
                                                padding: '8px'
                                            }}
                                        >
                                            {Object.entries(staffsByRole).map(([role, list]) => (
                                                <div key={role}>
                                                    <div style={{ padding: '10px 12px 6px', color: 'var(--gray-400)', fontSize: '0.72rem', fontWeight: 950, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                                                        {role}
                                                    </div>
                                                    {list.map(s => {
                                                        const active = String(selectedStaffId) === String(s.id_nhan_vien);
                                                        return (
                                                            <button
                                                                key={s.id_nhan_vien}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSelectedStaffId(String(s.id_nhan_vien));
                                                                    setStaffPickerOpen(false);
                                                                }}
                                                                style={{
                                                                    width: '100%',
                                                                    border: 'none',
                                                                    borderRadius: '12px',
                                                                    padding: '12px',
                                                                    marginBottom: '4px',
                                                                    background: active ? 'var(--primary)' : 'transparent',
                                                                    color: active ? '#fff' : 'var(--ink)',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: '10px',
                                                                    cursor: 'pointer',
                                                                    fontWeight: 850,
                                                                    textAlign: 'left'
                                                                }}
                                                                onMouseEnter={e => {
                                                                    if (!active) e.currentTarget.style.background = 'var(--gray-50)';
                                                                }}
                                                                onMouseLeave={e => {
                                                                    if (!active) e.currentTarget.style.background = 'transparent';
                                                                }}
                                                            >
                                                                <span className="material-symbols-outlined" style={{ fontSize: '18px', color: active ? '#fff' : 'var(--primary)' }}>person</span>
                                                                <span>{s.ho_ten}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div style={{ padding: '14px', background: 'var(--gray-50)', borderRadius: '16px', fontWeight: 700 }}>
                                    {user.ho_ten || user.ten_dang_nhap || 'Bác sĩ'}
                                </div>
                            )}
                        </div>

                        <div className="responsive-grid-2">
                            <div>
                                <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px', color: 'var(--gray-500)', fontSize: '0.85rem' }}>NGÀY</label>
                                <div style={{ fontWeight: 700 }}>{selectedSlot?.day.label} ({selectedSlot?.day.dateStr})</div>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: 800, marginBottom: '8px', color: 'var(--gray-500)', fontSize: '0.85rem' }}>GIỜ BẮT ĐẦU</label>
                                <div style={{ fontWeight: 700 }}>{selectedSlot?.hour}:00</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button data-ai-id="button-quanlylichlamviec-9xrv" className="btn btn-outline btn-pill" style={{ flex: 1 }} onClick={() => { setShowAddModal(false); setStaffPickerOpen(false); }}>HỦY</button>
                            <button data-ai-id="button-quanlylichlamviec-76g1" className="btn btn-primary btn-pill" style={{ flex: 1, fontWeight: 900 }} onClick={confirmAddShift}>XÁC NHẬN</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuanLyLichLamViec;
