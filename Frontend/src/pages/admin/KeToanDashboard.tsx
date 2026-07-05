import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '@services/axios';
import { formatTienVND } from '@utils/index';
import { toast } from '@components/Toast';
import { AnimatedNumber, Modal } from '@components/CommonUI';
import { useAutoRefresh } from '@hooks/useAutoRefresh';
import KpiIcon from '@components/KpiIcon';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const KeToanDashboard: React.FC = () => {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [revenueData, setRevenueData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [viewingHD, setViewingHD] = useState<any>(null);
    const [chiTietHD, setChiTietHD] = useState<any[]>([]);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastUpdated, setLastUpdated] = useState<string>("");
    const ITEMS_PER_PAGE = 10;

    const fetchData = useCallback(async (showLoading = true) => {
        if (showLoading && invoices.length === 0) setLoading(true);
        try {
            const [invRes, revRes] = await Promise.all([
                axiosInstance.get('/api/hoa-don'),
                axiosInstance.get('/api/bao-cao/doanh-thu-ngay')
            ]);
            setInvoices(invRes.data || []);
            setRevenueData(revRes.data || []);
            
            // Cập nhật nhãn thời gian thực khi tải dữ liệu thành công
            const now = new Date();
            const formatTime = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
            setLastUpdated(formatTime);
        } catch (error) {
            console.error("Lỗi tải dữ liệu kế toán:", error);
            toast.error("Không thể tải dữ liệu hóa đơn!");
        } finally {
            setLoading(false);
        }
    }, [invoices.length]);

    useAutoRefresh(() => fetchData(false));

    useEffect(() => {
        setCurrentPage(1);
    }, [filterStatus, fromDate, toDate]);

    // Hàm Kế toán xn khách đã đóng tiền (Tiền mặt / Chuyển khoản thủ công)
    const handleConfirmPayment = async (id: number) => {
        if (window.confirm('Xác nhận khách hàng đã thanh toán hóa đơn này?')) {
            try {
                await axiosInstance.put(`/api/hoa-don/${id}/status`, { status: 'DA_THANH_TOAN' });
                toast.success("Đã gạch nợ và ghi nhận thanh toán thành công!");
                fetchData(); // Tải lại dữ liệu
            } catch (error) {
                toast.error("Lỗi khi cập nhật trạng thái hóa đơn.");
            }
        }
    };

    // Hàm xem chi tiết Hóa đơn
    const handleViewDetails = async (inv: any) => {
        setViewingHD(inv);
        setLoadingDetails(true);
        try {
            const res = await axiosInstance.get(`/api/hoa-don/${inv.id_hoa_don}/chi-tiet`);
            setChiTietHD(res.data);
        } catch (error) {
            console.error(error);
            toast.error("Không thể tải chi tiết hóa đơn.");
            setChiTietHD([]);
        } finally {
            setLoadingDetails(false);
        }
    };

    // Tính toán số liệu tổng quan
    const stats = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];

        const paidInvoices = invoices.filter(inv => inv.trang_thai?.toUpperCase() === 'DA_THANH_TOAN');
        const unpaidInvoices = invoices.filter(inv => inv.trang_thai?.toUpperCase() === 'CHO_THANH_TOAN');

        const todayRevenue = revenueData.find((d: any) => (d.Ngay || d.ngay || "")?.startsWith(todayStr))?.TongDoanhThu || revenueData.find((d: any) => (d.Ngay || d.ngay || "")?.startsWith(todayStr))?.tongdoanhthu || 0;
        const totalUnpaid = unpaidInvoices.reduce((sum, inv) => sum + (inv.tong_tien_cuoi || 0), 0);

        return {
            paidCount: paidInvoices.length,
            unpaidCount: unpaidInvoices.length,
            todayRevenue: todayRevenue,
            totalUnpaid: totalUnpaid
        };
    }, [invoices, revenueData]);

    const financeInsight = useMemo(() => {
        const toDateKey = (value: any) => {
            if (!value) return "";
            const date = new Date(value);
            return Number.isNaN(date.getTime()) ? String(value).slice(0, 10) : date.toISOString().slice(0, 10);
        };
        const today = new Date();
        const todayKey = today.toISOString().slice(0, 10);
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const yesterdayKey = yesterday.toISOString().slice(0, 10);

        const paidInvoices = invoices.filter(inv => inv.trang_thai?.toUpperCase() === 'DA_THANH_TOAN');
        const unpaidInvoices = invoices.filter(inv => inv.trang_thai?.toUpperCase() === 'CHO_THANH_TOAN');
        const paidToday = paidInvoices.filter(inv => toDateKey(inv.ngay_lap_hoa_don) === todayKey);
        const paidYesterday = paidInvoices.filter(inv => toDateKey(inv.ngay_lap_hoa_don) === yesterdayKey);
        const yesterdayRevenue = revenueData.find((d: any) => (d.Ngay || d.ngay || "").startsWith(yesterdayKey))?.TongDoanhThu || revenueData.find((d: any) => (d.Ngay || d.ngay || "").startsWith(yesterdayKey))?.tongdoanhthu
            || paidYesterday.reduce((sum, inv) => sum + (Number(inv.tong_tien_cuoi) || 0), 0);
        const diff = stats.todayRevenue - yesterdayRevenue;
        const diffPct = yesterdayRevenue > 0 ? (diff / yesterdayRevenue) * 100 : null;
        const largestUnpaid = [...unpaidInvoices].sort((a, b) => (Number(b.tong_tien_cuoi) || 0) - (Number(a.tong_tien_cuoi) || 0))[0];
        const latestUnpaid = [...unpaidInvoices].sort((a, b) => new Date(b.ngay_lap_hoa_don || 0).getTime() - new Date(a.ngay_lap_hoa_don || 0).getTime())[0];

        return {
            paidToday,
            paidYesterday,
            yesterdayRevenue,
            diff,
            diffPct,
            unpaidInvoices,
            largestUnpaid,
            latestUnpaid
        };
    }, [invoices, revenueData, stats.todayRevenue]);

    const filteredInvoices = useMemo(() => {
        let result = invoices;
        if (filterStatus !== 'all') {
            result = result.filter(inv => inv.trang_thai?.toUpperCase() === filterStatus.toUpperCase());
        }
        if (fromDate) {
            const from = new Date(fromDate);
            result = result.filter(inv => new Date(inv.ngay_lap_hoa_don) >= from);
        }
        if (toDate) {
            const to = new Date(toDate);
            to.setHours(23, 59, 59, 999);
            result = result.filter(inv => new Date(inv.ngay_lap_hoa_don) <= to);
        }
        return result;
    }, [invoices, filterStatus, fromDate, toDate]);

    const totalPages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE);
    const currentRows = filteredInvoices.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const getRevenueDateKey = (item: any) => {
        const rawDate = item?.Ngay || item?.ngay;
        if (!rawDate) return "";
        const date = new Date(rawDate);
        return Number.isNaN(date.getTime()) ? String(rawDate).slice(0, 10) : date.toISOString().slice(0, 10);
    };

    // Chuẩn bị dữ liệu cho biểu đồ Chart.js
    const chartData = useMemo(() => {
        let labels: string[] = [];
        let data: number[] = [];

        const revenueByDate = new Map<string, number>();
        (revenueData || []).forEach((item: any) => {
            const dateKey = getRevenueDateKey(item);
            if (!dateKey) return;
            const revenue = Number(item.TongDoanhThu || item.tongdoanhthu || item.doanhthu || item.doanh_thu || item.tong_doanh_thu || 0);
            revenueByDate.set(dateKey, (revenueByDate.get(dateKey) || 0) + revenue);
        });

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateKey = d.toISOString().slice(0, 10);
            labels.push(`${d.getDate()}/${d.getMonth() + 1}`);
            data.push(revenueByDate.get(dateKey) || 0);
        }

        return {
            labels,
            datasets: [
                {
                    label: 'Doanh thu',
                    data: data,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    borderWidth: 3,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#10b981',
                    pointHoverBackgroundColor: '#10b981',
                    pointHoverBorderColor: '#fff',
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    fill: true,
                    tension: 0.4 // Tạo độ cong mượt mà cho đường Line
                }
            ]
        };
    }, [revenueData]);

    const chartSuggestedMax = useMemo(() => {
        const values = chartData.datasets[0]?.data || [];
        const maxRevenue = Math.max(...values.map(Number), 0);

        if (maxRevenue <= 0) return 100000;

        const paddedMax = maxRevenue * 1.25;
        const step =
            maxRevenue <= 500000 ? 50000 :
            maxRevenue <= 2000000 ? 100000 :
            maxRevenue <= 10000000 ? 500000 :
            1000000;

        return Math.ceil(paddedMax / step) * step;
    }, [chartData]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                padding: 12,
                cornerRadius: 8,
                callbacks: {
                    label: (context: any) => {
                        let label = context.dataset.label || '';
                        if (label) label += ': ';
                        if (context.parsed.y !== null) {
                            label += formatTienVND(context.parsed.y);
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                suggestedMax: chartSuggestedMax,
                grid: { color: 'rgba(0, 0, 0, 0.05)' },
                ticks: { 
                    callback: (value: any) => {
                        const numericValue = Number(value);
                        if (numericValue === 0) return '0 đ';
                        if (numericValue < 1000000) {
                            return `${(numericValue / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 0 })}k`;
                        }
                        return `${(numericValue / 1000000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} Tr`;
                    }
                }
            },
            x: { grid: { display: false } }
        },
        interaction: { mode: 'index' as const, intersect: false }
    };

    const handleExportExcel = () => {
        if (filteredInvoices.length === 0) {
            toast.info("Không có dữ liệu để xuất!");
            return;
        }

        const headers = ["Mã HĐ", "Khách hàng", "Số điện thoại", "Ngày lập", "Tổng tiền (VNĐ)", "Trạng thái"];
        const rows = filteredInvoices.map(inv => [
            inv.id_hoa_don?.startsWith('HD-') ? inv.id_hoa_don : `HD-${inv.id_hoa_don}`,
            inv.ten_khach_hang || 'Khách vãng lai',
            inv.sdt || '',
            inv.ngay_lap_hoa_don?.split('T')[0].split('-').reverse().join('/') || "",
            inv.tong_tien_cuoi || 0,
            inv.trang_thai?.toUpperCase() === 'DA_THANH_TOAN' ? 'Đã thu tiền' : 'Chờ thanh toán'
        ]);

        // Thêm dấu nháy đơn trước các ký tự nhạy cảm để chặn lỗi CSV Injection
        const sanitizeCSV = (val: string) => {
            if (/^[=+\-@]/.test(val)) return `'${val}`;
            return val;
        };

        const csvContent = "\ufeff" + [
            headers.map(h => `"${h}"`).join(","),
            ...rows.map(r => r.map(cell => `"${sanitizeCSV(String(cell ?? "").replace(/"/g, '""'))}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `DanhSachHoaDon_Ketoan_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        toast.success("Đã xuất danh sách hóa đơn ra file Excel!");
    };

    if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}><div className="dot-pulse"></div></div>;

    const KpiCard = ({
        accent,
        title,
        value,
        details,
        icon
    }: {
        accent: string;
        title: string;
        value: React.ReactNode;
        details: React.ReactNode;
        icon: React.ReactNode;
    }) => (
        <div className="ketoan-kpi-card glass-card" tabIndex={0} style={{ padding: '32px', borderRadius: '32px', border: `1px solid ${accent}25`, background: `linear-gradient(135deg, ${accent}15 0%, var(--surface) 100%)`, minHeight: '190px' }}>
            <div className="ketoan-kpi-badge" style={{ color: accent, borderColor: `${accent}35`, background: `${accent}12` }}>Chi tiết</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '20px', background: `${accent}22`, color: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 20px ${accent}15`, fontSize: '1.55rem', fontWeight: 950 }}>
                    {icon}
                </div>
            </div>
            <p style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--gray-500)', margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: '1px' }}>{title}</p>
            <h3 style={{ fontSize: '2rem', fontWeight: 950, color: accent, margin: 0, textShadow: `0 2px 10px ${accent}10` }}>{value}</h3>
            <div className="ketoan-kpi-popover">
                {details}
            </div>
        </div>
    );

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
            <style>{`
                .accounting-mobile-invoice-list { display: none; }
                @keyframes slideUpFade { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
                .ketoan-kpi-card { animation: slideUpFade 0.5s cubic-bezier(.22,.68,0,1.2) both; }
                .ketoan-kpi-card:hover { transform: translateY(-4px) !important; box-shadow: 0 16px 40px rgba(15,157,138,0.15) !important; }
                .accounting-invoice-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
                .accounting-invoice-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.08); }
                tbody tr { transition: background 0.18s ease; }
                tbody tr:hover { background: var(--primary-light) !important; }
                @media screen and (max-width: 1024px) {
                    .accounting-hero {
                        margin-bottom: 16px !important;
                        padding: 18px !important;
                        border-radius: 24px !important;
                    }
                    .accounting-hero h1 {
                        display: grid !important;
                        grid-template-columns: minmax(0, 1fr) auto !important;
                        align-items: center !important;
                        gap: 12px !important;
                        font-size: clamp(1.38rem, 6vw, 1.74rem) !important;
                        line-height: 1.08 !important;
                        letter-spacing: -0.02em !important;
                        margin-bottom: 8px !important;
                    }
                    .accounting-hero p {
                        max-width: 32ch !important;
                        font-size: 0.84rem !important;
                        line-height: 1.45 !important;
                    }
                    .accounting-realtime-badge {
                        max-width: 100% !important;
                        padding: 6px 10px !important;
                        font-size: 0.68rem !important;
                        line-height: 1.25 !important;
                    }
                    .ketoan-kpi-grid {
                        grid-template-columns: 1fr !important;
                        gap: 12px !important;
                        margin-bottom: 18px !important;
                    }
                    .ketoan-kpi-card {
                        min-height: 118px !important;
                        padding: 16px !important;
                        border-radius: 20px !important;
                    }
                    .ketoan-kpi-card h3 {
                        font-size: clamp(1.35rem, 8vw, 1.75rem) !important;
                        line-height: 1.12 !important;
                        overflow-wrap: anywhere !important;
                    }
                    .ketoan-kpi-card > div:first-child {
                        width: 42px !important;
                        height: 42px !important;
                        border-radius: 14px !important;
                    }
                    .accounting-chart-card {
                        padding: 16px !important;
                        border-radius: 20px !important;
                        margin-bottom: 18px !important;
                    }
                    .accounting-chart-card h2,
                    .accounting-list-card h2 {
                        font-size: 1rem !important;
                        line-height: 1.25 !important;
                    }
                    .accounting-list-header {
                        display: grid !important;
                        grid-template-columns: 1fr !important;
                        padding: 14px !important;
                        gap: 12px !important;
                    }
                    .accounting-filter-row {
                        display: grid !important;
                        grid-template-columns: 1fr !important;
                        gap: 8px !important;
                    }
                    .accounting-filter-row .btn,
                    .accounting-filter-row input,
                    .accounting-filter-row select {
                        width: 100% !important;
                        min-height: 40px !important;
                        border-radius: 14px !important;
                        padding: 8px 12px !important;
                        font-size: 0.78rem !important;
                    }
                    .accounting-filter-separator {
                        display: none !important;
                    }
                    .accounting-invoice-table {
                        display: none !important;
                    }
                    .accounting-mobile-invoice-list {
                        display: grid !important;
                        gap: 10px;
                        padding: 10px;
                    }
                    .accounting-invoice-card {
                        display: grid;
                        gap: 10px;
                        padding: 12px;
                        border-radius: 18px;
                        background: var(--surface);
                        border: 1px solid var(--gray-100);
                    }
                    .accounting-invoice-top {
                        display: grid;
                        grid-template-columns: minmax(0, 1fr) auto;
                        gap: 10px;
                        align-items: start;
                    }
                    .accounting-invoice-card h3 {
                        margin: 0;
                        color: var(--ink);
                        font-size: 0.94rem;
                        line-height: 1.22;
                        font-weight: 950;
                    }
                    .accounting-invoice-card p {
                        margin: 4px 0 0;
                        color: var(--gray-500);
                        font-size: 0.72rem;
                        line-height: 1.35;
                        font-weight: 700;
                    }
                    .accounting-invoice-amount {
                        color: var(--primary);
                        font-size: 0.95rem;
                        font-weight: 950;
                        white-space: nowrap;
                    }
                    .accounting-invoice-status {
                        justify-self: start;
                        padding: 6px 10px;
                        border-radius: 999px;
                        font-size: 0.66rem;
                        line-height: 1;
                        font-weight: 950;
                    }
                    .accounting-invoice-actions {
                        display: grid;
                        grid-template-columns: 1fr;
                        gap: 8px;
                    }
                    .accounting-invoice-actions .btn {
                        width: 100%;
                        min-height: 36px;
                        justify-content: center;
                        border-radius: 13px !important;
                        padding: 7px 10px !important;
                    }
                }
            `}</style>
            <div className="animate-slide-up accounting-hero" style={{ marginBottom: '40px', padding: '48px', borderRadius: '24px', background: 'var(--primary-gradient)', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 40px var(--primary-shadow)' }}>
                <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
                <h1 style={{ fontSize: '3rem', fontWeight: 950, letterSpacing: '-1.5px', position: 'relative', zIndex: 1, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span>Bảng Điều Khiển <span style={{ color: '#5eead4' }}>Kế Toán</span></span> 
                  <span style={{ filter: 'drop-shadow(0 5px 15px rgba(0,0,0,0.2))' }}>📊</span>
                </h1>
                <p style={{ fontWeight: 700, color: 'rgba(255,255,255,0.95)', position: 'relative', zIndex: 1, margin: 0, fontSize: '1.2rem', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>Theo dõi dòng tiền, hóa đơn và vận hành tài chính hôm nay.</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '14px', position: 'relative', zIndex: 1 }}>
                    <Link to="/quan-ly/lich-lam-viec" className="btn btn-pill" style={{ background: 'rgba(255,255,255,0.18)', color: 'white', border: '1px solid rgba(255,255,255,0.28)', fontWeight: 800 }}>
                        <span className="material-symbols-outlined">edit_calendar</span>
                        Đặt lịch làm việc
                    </Link>
                    {lastUpdated && (
                        <div className="accounting-realtime-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 800, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', padding: '6px 14px', borderRadius: '999px', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '15px', color: '#5eead4', animation: 'spin 3s infinite linear' }}>sync</span>
                            <span>Dữ liệu thời gian thực cập nhật lúc: {lastUpdated}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Các thẻ thống kê */}
            <div className="ketoan-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                <KpiCard
                    accent="#10b981"
                    title="DOANH THU HÔM NAY"
                    value={<AnimatedNumber value={stats.todayRevenue} format="currency" />}
                    icon={<KpiIcon name="money" />}
                    details={
                        <div>
                            <strong>Chi tiết thực thu hôm nay</strong>
                            <p>{financeInsight.paidToday.length} hóa đơn đã thanh toán, tổng {formatTienVND(stats.todayRevenue)}.</p>
                            <p>Hôm qua: {formatTienVND(financeInsight.yesterdayRevenue)}.</p>
                            <p>Chênh lệch: {financeInsight.diff >= 0 ? "+" : ""}{formatTienVND(financeInsight.diff)}
                                {financeInsight.diffPct !== null ? ` (${financeInsight.diffPct >= 0 ? "+" : ""}${financeInsight.diffPct.toFixed(1)}%)` : " (chưa có mốc so sánh)"}
                            </p>
                        </div>
                    }
                />
                <KpiCard
                    accent="#f59e0b"
                    title="CÔNG NỢ CHƯA THU"
                    value={<AnimatedNumber value={stats.totalUnpaid} format="currency" />}
                    icon={<KpiIcon name="alert" />}
                    details={
                        <div>
                            <strong>Chi tiết công nợ</strong>
                            <p>{financeInsight.unpaidInvoices.length} hóa đơn đang chờ thu, tổng {formatTienVND(stats.totalUnpaid)}.</p>
                            <p>Khoản lớn nhất: {financeInsight.largestUnpaid ? `#${financeInsight.largestUnpaid.id_hoa_don} - ${financeInsight.largestUnpaid.ten_khach_hang || "Khách vãng lai"} (${formatTienVND(financeInsight.largestUnpaid.tong_tien_cuoi)})` : "Chưa có công nợ"}.</p>
                            <p>Hóa đơn mới nhất: {financeInsight.latestUnpaid ? `#${financeInsight.latestUnpaid.id_hoa_don}` : "Không có"}.</p>
                        </div>
                    }
                />
                <KpiCard
                    accent="#3b82f6"
                    title="HÓA ĐƠN CHƯA THANH TOÁN"
                    value={<><AnimatedNumber value={stats.unpaidCount} /> <span style={{ fontSize: '1rem', color: 'var(--gray-400)' }}>phiếu</span></>}
                    icon={<KpiIcon name="receipt" />}
                    details={
                        <div>
                            <strong>Danh sách cần xử lý</strong>
                            {financeInsight.unpaidInvoices.slice(0, 4).map((inv: any) => (
                                <p key={inv.id_hoa_don}>#{inv.id_hoa_don} - {inv.ten_khach_hang || "Khách vãng lai"}: {formatTienVND(inv.tong_tien_cuoi)}</p>
                            ))}
                            {financeInsight.unpaidInvoices.length === 0 && <p>Không còn hóa đơn chờ thanh toán.</p>}
                        </div>
                    }
                />
            </div>

            {/* Biểu đồ doanh thu 7 ngày */}
            <div className="glass-card accounting-chart-card" style={{ padding: '32px', borderRadius: '24px', marginBottom: '40px' }}>
                <h2 style={{ fontSize: '1.2rem', margin: '0 0 24px 0', fontWeight: 800, color: 'var(--ink)' }}>Biến động doanh thu (7 ngày gần nhất)</h2>
                <div style={{ height: '350px', width: '100%' }}>
                    <Line data={chartData} options={chartOptions} />
                </div>
            </div>

            {/* Danh sách hóa đơn */}
            <div className="glass-card accounting-list-card" style={{ borderRadius: '24px', overflow: 'hidden' }}>
                <div className="accounting-list-header" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--gray-100)', flexWrap: 'wrap', gap: '16px' }}>
                    <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 800 }}>Danh sách Hóa đơn</h2>
                    <div className="accounting-filter-row" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <button data-ai-id="button-ketoandashboard-bjms" onClick={handleExportExcel} className="btn btn-pill hover-lift" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '10px 16px', fontSize: '0.85rem', fontWeight: 800 }}>
                            <KpiIcon name="download" size={18} />
                            Xuất Excel
                        </button>
                        <input data-ai-id="input-ketoandashboard-ao0k" aria-label="Từ ngày"
                            type="date"
                            value={fromDate}
                            onChange={e => setFromDate(e.target.value)}
                            style={{ padding: '10px 16px', borderRadius: '12px', outline: 'none', border: '1px solid var(--gray-200)', fontWeight: 600, color: 'var(--ink)' }}
                        />
                        <span className="accounting-filter-separator" style={{ display: 'flex', alignItems: 'center', fontWeight: 600, color: 'var(--gray-400)' }}>-</span>
                        <input data-ai-id="input-ketoandashboard-l5io" aria-label="Đến ngày"
                            type="date"
                            value={toDate}
                            onChange={e => setToDate(e.target.value)}
                            style={{ padding: '10px 16px', borderRadius: '12px', outline: 'none', border: '1px solid var(--gray-200)', fontWeight: 600, color: 'var(--ink)' }}
                        />
                        <select data-ai-id="select-ketoandashboard-ew74" aria-label="Lọc trạng thái thanh toán"
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            style={{ padding: '10px 20px', borderRadius: '12px', outline: 'none', border: '1px solid var(--gray-200)', fontWeight: 700 }}
                        >
                            <option value="all">Tất cả hóa đơn</option>
                            <option value="CHO_THANH_TOAN">Chờ thanh toán (Nợ)</option>
                            <option value="DA_THANH_TOAN">Đã thanh toán</option>
                        </select>
                    </div>
                </div>

                <div className="accounting-mobile-invoice-list">
                    {currentRows.length === 0 ? (
                        <div className="admin-empty-state" style={{ padding: '18px 10px', textAlign: 'center', color: 'var(--gray-500)', fontWeight: 800 }}>Không có dữ liệu hóa đơn.</div>
                    ) : currentRows.map(inv => (
                        <article key={inv.id_hoa_don} className="accounting-invoice-card">
                            <div className="accounting-invoice-top">
                                <div>
                                    <h3>#{inv.id_hoa_don} · {inv.ten_khach_hang || 'Khách vãng lai'}</h3>
                                    <p>{inv.ngay_lap_hoa_don?.split('T')[0].split('-').reverse().join('/') || 'Chưa có ngày'} · SĐT: {inv.sdt || '---'}</p>
                                </div>
                                <span className="accounting-invoice-amount">{formatTienVND(inv.tong_tien_cuoi)}</span>
                            </div>
                            <span
                                className="accounting-invoice-status"
                                style={{
                                    background: inv.trang_thai?.toUpperCase() === 'DA_THANH_TOAN' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                    color: inv.trang_thai?.toUpperCase() === 'DA_THANH_TOAN' ? '#10b981' : '#f59e0b'
                                }}
                            >
                                {inv.trang_thai?.toUpperCase() === 'DA_THANH_TOAN' ? 'ĐÃ THU TIỀN' : 'CHỜ THANH TOÁN'}
                            </span>
                            <div className="accounting-invoice-actions">
                                <button data-ai-id="button-ketoandashboard-mobile-detail" onClick={() => handleViewDetails(inv)} className="btn btn-pill" style={{ background: 'var(--gray-50)', color: 'var(--ink)' }}>
                                    Xem chi tiết
                                </button>
                                {inv.trang_thai?.toUpperCase() === 'CHO_THANH_TOAN' && (
                                    <button data-ai-id="button-ketoandashboard-mobile-pay" onClick={() => handleConfirmPayment(inv.id_hoa_don)} className="btn btn-pill" style={{ background: 'var(--primary)', color: 'white' }}>
                                        Xác nhận thu
                                    </button>
                                )}
                            </div>
                        </article>
                    ))}
                </div>

                <div className="accounting-invoice-table" style={{ overflowX: 'auto' }}>
                    <div className="table-responsive-wrapper">
<div style={{ minWidth: '800px' }}>
<table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead style={{ background: 'var(--gray-50)' }}>
                            <tr>
                                <th style={{ padding: '16px 24px', fontSize: '0.8rem', color: 'var(--gray-500)' }}>MÃ HĐ</th>
                                <th style={{ padding: '16px 24px', fontSize: '0.8rem', color: 'var(--gray-500)' }}>KHÁCH HÀNG</th>
                                <th style={{ padding: '16px 24px', fontSize: '0.8rem', color: 'var(--gray-500)' }}>NGÀY LẬP</th>
                                <th style={{ padding: '16px 24px', fontSize: '0.8rem', color: 'var(--gray-500)' }}>TỔNG TIỀN</th>
                                <th style={{ padding: '16px 24px', fontSize: '0.8rem', color: 'var(--gray-500)' }}>TRẠNG THÁI</th>
                                <th style={{ padding: '16px 24px', fontSize: '0.8rem', color: 'var(--gray-500)' }}>THAO TÁC</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentRows.length === 0 ? (
                                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-400)', fontWeight: 600 }}>Không có dữ liệu hóa đơn.</td></tr>
                            ) : (
                                currentRows.map(inv => (
                                    <tr key={inv.id_hoa_don} style={{ borderBottom: '1px solid var(--gray-50)', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '16px 24px', fontWeight: 800 }}>#{inv.id_hoa_don}</td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ fontWeight: 700 }}>{inv.ten_khach_hang || 'Khách vãng lai'}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>SĐT: {inv.sdt || '---'}</div>
                                        </td>
                                        <td style={{ padding: '16px 24px', fontWeight: 600 }}>
                                            {inv.ngay_lap_hoa_don?.split('T')[0].split('-').reverse().join('/') || "---"}
                                        </td>
                                        <td style={{ padding: '16px 24px', fontWeight: 900, color: 'var(--primary)' }}>
                                            {formatTienVND(inv.tong_tien_cuoi)}
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span style={{
                                                padding: '6px 12px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 800,
                                                background: inv.trang_thai?.toUpperCase() === 'DA_THANH_TOAN' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                color: inv.trang_thai?.toUpperCase() === 'DA_THANH_TOAN' ? '#10b981' : '#f59e0b'
                                            }}>
                                                {inv.trang_thai?.toUpperCase() === 'DA_THANH_TOAN' ? 'ĐÃ THU TIỀN' : 'CHỜ THANH TOÁN'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button data-ai-id="button-ketoandashboard-7ut1"
                                                    onClick={() => handleViewDetails(inv)}
                                                    className="btn btn-pill"
                                                    style={{ background: 'var(--gray-50)', color: 'var(--ink)', padding: '8px 16px', fontSize: '0.8rem' }}
                                                >
                                                    Xem chi tiết
                                                </button>
                                                {inv.trang_thai?.toUpperCase() === 'CHO_THANH_TOAN' && (
                                                    <button data-ai-id="button-ketoandashboard-nymz"
                                                        onClick={() => handleConfirmPayment(inv.id_hoa_don)}
                                                        className="btn btn-pill"
                                                        style={{ background: 'var(--primary)', color: 'white', padding: '8px 16px', fontSize: '0.8rem' }}
                                                    >
                                                        Xác nhận thu
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
</div></div>
                </div>

                {/* BỘ NÚT ĐIỀU HƯỚNG PHÂN TRANG */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', padding: '20px', borderTop: '1px solid var(--gray-100)' }}>
                        <button data-ai-id="button-ketoandashboard-4gli"
                            className="btn btn-pill"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            style={{
                                background: 'var(--surface)', border: '1px solid var(--gray-200)',
                                color: currentPage === 1 ? 'var(--gray-300)' : 'var(--ink)',
                                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                padding: '8px 16px', fontSize: '0.85rem'
                            }}
                        >
                            <KpiIcon name="chevronLeft" size={18} /> Trước
                        </button>
                        <span style={{ fontWeight: 800, color: 'var(--ink)', fontSize: '0.85rem' }}>
                            Trang {currentPage} / {totalPages}
                        </span>
                        <button data-ai-id="button-ketoandashboard-r8hi"
                            className="btn btn-pill"
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            style={{
                                background: 'var(--surface)', border: '1px solid var(--gray-200)',
                                color: currentPage === totalPages ? 'var(--gray-300)' : 'var(--ink)',
                                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                padding: '8px 16px', fontSize: '0.85rem'
                            }}
                        >
                            Sau <KpiIcon name="chevronRight" size={18} />
                        </button>
                    </div>
                )}
            </div>

            {/* MODAL CHI TIẾT HÓA ĐƠN */}
            <Modal isOpen={!!viewingHD} onClose={() => setViewingHD(null)} title="Chi tiết Hóa đơn" maxWidth="700px">
                {viewingHD && (
                    <div id="print-section">
                        <style>{`
                            @media print {
                                @page { size: A4 portrait; margin: 12mm; }
                                html, body { background: #ffffff !important; overflow: visible !important; }
                                body * { visibility: hidden; }
                                .modal-wrapper,
                                .modal-wrapper *,
                                .modal-content,
                                .glass-card {
                                    overflow: visible !important;
                                    max-height: none !important;
                                    animation: none !important;
                                    transform: none !important;
                                }
                                .modal-wrapper {
                                    position: static !important;
                                    inset: auto !important;
                                    display: block !important;
                                    padding: 0 !important;
                                    background: transparent !important;
                                    backdrop-filter: none !important;
                                }
                                .modal-content { padding: 0 !important; }
                                #print-section, #print-section * { visibility: visible; }
                                #print-section {
                                    position: absolute !important;
                                    left: 0 !important;
                                    top: 0 !important;
                                    width: 186mm !important;
                                    margin: 0 !important;
                                    padding: 12mm !important;
                                    background: #ffffff !important;
                                    color: #111827 !important;
                                    box-shadow: none !important;
                                    border: 1px solid #d1d5db !important;
                                    border-radius: 12px !important;
                                }
                                #print-section .table-responsive-wrapper,
                                #print-section .table-responsive-wrapper > div {
                                    overflow: visible !important;
                                    min-width: 0 !important;
                                    width: 100% !important;
                                }
                                #print-section table {
                                    width: 100% !important;
                                    min-width: 0 !important;
                                    border-collapse: collapse !important;
                                }
                                .no-print, .no-print * {
                                    display: none !important;
                                    visibility: hidden !important;
                                }
                            }
                        `}</style>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                            <div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)', fontWeight: 800 }}>KHÁCH HÀNG</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--ink)' }}>{viewingHD.ten_khach_hang || 'Khách vãng lai'}</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--gray-500)' }}>SĐT: {viewingHD.sdt || '---'}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)', fontWeight: 800 }}>MÃ HÓA ĐƠN</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--primary)' }}>{viewingHD.id_hoa_don?.startsWith('HD-') ? `#${viewingHD.id_hoa_don}` : `#HD-${viewingHD.id_hoa_don}`}</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--gray-500)' }}>{viewingHD.ngay_lap_hoa_don?.split('T')[0].split('-').reverse().join('/') || "---"}</div>
                            </div>
                        </div>

                        <div className="table-responsive-wrapper">
<div style={{ minWidth: '800px' }}>
<table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--gray-200)', textAlign: 'left' }}>
                                    <th style={{ padding: '12px 0', fontSize: '0.85rem', color: 'var(--gray-500)' }}>NỘI DUNG</th>
                                    <th style={{ padding: '12px 0', fontSize: '0.85rem', color: 'var(--gray-500)', textAlign: 'center' }}>SL</th>
                                    <th style={{ padding: '12px 0', fontSize: '0.85rem', color: 'var(--gray-500)', textAlign: 'right' }}>ĐƠN GIÁ</th>
                                    <th style={{ padding: '12px 0', fontSize: '0.85rem', color: 'var(--gray-500)', textAlign: 'right' }}>THÀNH TIỀN</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingDetails ? (
                                    <tr><td colSpan={4} style={{ padding: '20px', textAlign: 'center' }}><div className="dot-pulse" style={{ margin: '0 auto' }}></div></td></tr>
                                ) : chiTietHD.length === 0 ? (
                                    <tr><td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: 'var(--gray-400)', fontWeight: 600 }}>Không có chi tiết dịch vụ/thuốc.</td></tr>
                                ) : (
                                    chiTietHD.map((item, idx) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                                            <td style={{ padding: '12px 0', fontWeight: 700, color: 'var(--ink)' }}>{item.ten_muc}</td>
                                            <td style={{ padding: '12px 0', textAlign: 'center', fontWeight: 600 }}>{item.so_luong}</td>
                                            <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 600 }}>{formatTienVND(item.don_gia)}</td>
                                            <td style={{ padding: '12px 0', textAlign: 'right', fontWeight: 800, color: 'var(--ink)' }}>{formatTienVND(item.thanh_tien)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan={3} style={{ padding: '16px 0', fontWeight: 800, textAlign: 'right' }}>TỔNG CỘNG:</td>
                                    <td style={{ padding: '16px 0', fontWeight: 900, textAlign: 'right', color: 'var(--primary)', fontSize: '1.2rem' }}>{formatTienVND(viewingHD.tong_tien_cuoi)}</td>
                                </tr>
                            </tfoot>
                        </table>
</div></div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }} className="no-print">
                            <button data-ai-id="button-ketoandashboard-v1vt" className="btn btn-pill" onClick={() => setViewingHD(null)} style={{ background: 'var(--gray-100)', color: 'var(--ink)', padding: '10px 20px' }}>Đóng</button>
                            <button data-ai-id="button-ketoandashboard-8440" className="btn btn-pill" onClick={() => window.print()} style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '10px 20px' }}>
                                <KpiIcon name="print" size={18} /> In hóa đơn
                            </button>
                            {viewingHD.trang_thai?.toUpperCase() === 'CHO_THANH_TOAN' && (
                                <button data-ai-id="button-ketoandashboard-76wz" className="btn btn-primary btn-pill" onClick={() => { handleConfirmPayment(viewingHD.id_hoa_don); setViewingHD(null); }} style={{ padding: '10px 20px' }}>Xác nhận thu tiền</button>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
            <style>{`
                .ketoan-kpi-card {
                    position: relative;
                    cursor: help;
                    overflow: visible;
                    transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
                }
                .ketoan-kpi-grid {
                    position: relative;
                    z-index: 80;
                }
                .ketoan-kpi-card:hover,
                .ketoan-kpi-card:focus {
                    transform: translateY(-3px);
                    box-shadow: 0 18px 42px rgba(15, 23, 42, 0.12);
                    outline: none;
                    z-index: 120;
                }
                .ketoan-kpi-badge {
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
                .ketoan-kpi-popover {
                    position: absolute;
                    left: 18px;
                    right: 18px;
                    top: 70px;
                    z-index: 90;
                    padding: 16px;
                    border-radius: 16px;
                    border: 1px solid rgba(20, 184, 166, 0.35);
                    background: #ffffff;
                    color: var(--ink);
                    box-shadow: 0 24px 56px rgba(15, 23, 42, 0.24);
                    opacity: 0;
                    transform: translateY(-6px);
                    pointer-events: none;
                    transition: opacity 0.18s ease, transform 0.18s ease;
                    font-size: 0.86rem;
                    line-height: 1.45;
                }
                .ketoan-kpi-popover strong {
                    display: block;
                    margin-bottom: 8px;
                    color: var(--primary);
                    font-size: 0.92rem;
                    font-weight: 900;
                }
                .ketoan-kpi-popover p {
                    margin: 6px 0;
                    color: var(--ink);
                    font-weight: 800;
                }
                .ketoan-kpi-card:hover .ketoan-kpi-popover,
                .ketoan-kpi-card:focus .ketoan-kpi-popover {
                    opacity: 1;
                    transform: translateY(0);
                    pointer-events: auto;
                }
                [data-theme='dark'] .ketoan-kpi-popover {
                    background: #111827;
                    border-color: rgba(34, 211, 238, 0.42);
                    box-shadow: 0 24px 56px rgba(0, 0, 0, 0.42);
                }
            `}</style>
        </div>
    );
};

export default KeToanDashboard;
