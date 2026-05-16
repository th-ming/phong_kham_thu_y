import React, { useState, useEffect, useMemo } from 'react';
import axiosInstance from '@services/axios';
import { formatTienVND } from '@utils/index';
import { toast } from '@components/Toast';
import { Modal } from '@components/CommonUI';
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
    const ITEMS_PER_PAGE = 10;

    const fetchData = async () => {
        setLoading(true);
        try {
            const [invRes, revRes] = await Promise.all([
                axiosInstance.get('/api/hoa-don'),
                axiosInstance.get('/api/bao-cao/doanh-thu-ngay')
            ]);
            setInvoices(invRes.data || []);
            setRevenueData(revRes.data || []);
        } catch (error) {
            console.error("Lỗi tải dữ liệu kế toán:", error);
            toast.error("Không thể tải dữ liệu hóa đơn!");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [filterStatus, fromDate, toDate]);

    // Hàm Kế toán xác nhận khách đã đóng tiền (Tiền mặt / Chuyển khoản thủ công)
    const handleConfirmPayment = async (id: number) => {
        if (window.confirm('Xác nhận khách hàng đã thanh toán hóa đơn này?')) {
            try {
                await axiosInstance.put(`/api/hoa-don/${id}/status`, { status: 'da_thanh_toan' });
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

        const paidInvoices = invoices.filter(inv => inv.trang_thai === 'da_thanh_toan');
        const unpaidInvoices = invoices.filter(inv => inv.trang_thai === 'cho_thanh_toan');

        const todayRevenue = revenueData.find((d: any) => d.Ngay?.startsWith(todayStr))?.TongDoanhThu || 0;
        const totalUnpaid = unpaidInvoices.reduce((sum, inv) => sum + (inv.tong_tien_cuoi || 0), 0);

        return {
            paidCount: paidInvoices.length,
            unpaidCount: unpaidInvoices.length,
            todayRevenue: todayRevenue,
            totalUnpaid: totalUnpaid
        };
    }, [invoices, revenueData]);

    const filteredInvoices = useMemo(() => {
        let result = invoices;
        if (filterStatus !== 'all') {
            result = result.filter(inv => inv.trang_thai === filterStatus);
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

    // Chuẩn bị dữ liệu cho biểu đồ Chart.js
    const chartData = useMemo(() => {
        let labels: string[] = [];
        let data: number[] = [];

        if (!revenueData || revenueData.length === 0) {
            // Hiển thị mặc định 7 ngày gần nhất với doanh thu 0 nếu không có dữ liệu
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                labels.push(`${d.getDate()}/${d.getMonth() + 1}`);
                data.push(0);
            }
        } else {
            // Sắp xếp ngày tăng dần và lấy 7 ngày gần nhất
            const sortedData = [...revenueData].sort((a, b) => {
                const dateA = new Date(a.Ngay || a.ngay).getTime();
                const dateB = new Date(b.Ngay || b.ngay).getTime();
                return dateA - dateB;
            }).slice(-7);

            labels = sortedData.map(d => {
                const dateObj = new Date(d.Ngay || d.ngay);
                return `${dateObj.getDate()}/${dateObj.getMonth() + 1}`;
            });

            data = sortedData.map(d => d.TongDoanhThu || d.doanh_thu || d.tong_doanh_thu || 0);
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
                suggestedMax: 1000000, // Đảm bảo trục Y không bị co lại quá mức khi doanh thu bằng 0
                grid: { color: 'rgba(0, 0, 0, 0.05)' },
                ticks: { 
                    callback: (value: any) => {
                        if (value === 0) return '0 Tr';
                        return (value / 1000000).toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' Tr';
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
            `HD-${inv.id_hoa_don}`,
            inv.ten_khach_hang || 'Khách vãng lai',
            inv.sdt || '',
            inv.ngay_lap_hoa_don?.split('T')[0].split('-').reverse().join('/') || "",
            inv.tong_tien_cuoi || 0,
            inv.trang_thai === 'da_thanh_toan' ? 'Đã thu tiền' : 'Chờ thanh toán'
        ]);

        // BẢO MẬT: Chống CSV Injection bằng cách thêm dấu nháy đơn trước các ký tự nhạy cảm
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

    return (
        <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
            <div className="animate-slide-up" style={{ marginBottom: '40px', padding: '48px', borderRadius: '24px', background: 'var(--primary-gradient)', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 40px var(--primary-shadow)' }}>
                <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
                <h1 style={{ fontSize: '3rem', fontWeight: 950, letterSpacing: '-1.5px', position: 'relative', zIndex: 1, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span>Bảng Điều Khiển <span style={{ color: '#c4b5fd' }}>Kế Toán</span></span> 
                  <span style={{ filter: 'drop-shadow(0 5px 15px rgba(0,0,0,0.2))' }}>📊</span>
                </h1>
                <p style={{ fontWeight: 700, color: 'rgba(255,255,255,0.95)', position: 'relative', zIndex: 1, margin: 0, fontSize: '1.2rem', textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>Theo dõi dòng tiền, hóa đơn và vận hành tài chính hôm nay.</p>
            </div>

            {/* Các thẻ thống kê */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '40px' }}>
                <div className="glass-card" style={{ padding: '24px', borderRadius: '24px', borderLeft: '4px solid #10b981' }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gray-400)', margin: '0 0 8px 0' }}>DOANH THU HÔM NAY</p>
                    <h3 style={{ fontSize: '2rem', fontWeight: 900, color: '#10b981', margin: 0 }}>{formatTienVND(stats.todayRevenue)}</h3>
                </div>
                <div className="glass-card" style={{ padding: '24px', borderRadius: '24px', borderLeft: '4px solid #f59e0b' }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gray-400)', margin: '0 0 8px 0' }}>CÔNG NỢ CHƯA THU</p>
                    <h3 style={{ fontSize: '2rem', fontWeight: 900, color: '#f59e0b', margin: 0 }}>{formatTienVND(stats.totalUnpaid)}</h3>
                </div>
                <div className="glass-card" style={{ padding: '24px', borderRadius: '24px', borderLeft: '4px solid #3b82f6' }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gray-400)', margin: '0 0 8px 0' }}>HÓA ĐƠN CHƯA THANH TOÁN</p>
                    <h3 style={{ fontSize: '2rem', fontWeight: 900, color: '#3b82f6', margin: 0 }}>{stats.unpaidCount} <span style={{ fontSize: '1rem', color: 'var(--gray-400)' }}>phiếu</span></h3>
                </div>
            </div>

            {/* Biểu đồ doanh thu 7 ngày */}
            <div className="glass-card" style={{ padding: '32px', borderRadius: '24px', marginBottom: '40px' }}>
                <h2 style={{ fontSize: '1.2rem', margin: '0 0 24px 0', fontWeight: 800, color: 'var(--ink)' }}>Biến động doanh thu (7 ngày gần nhất)</h2>
                <div style={{ height: '350px', width: '100%' }}>
                    <Line data={chartData} options={chartOptions} />
                </div>
            </div>

            {/* Danh sách hóa đơn */}
            <div className="glass-card" style={{ borderRadius: '24px', overflow: 'hidden' }}>
                <div style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--gray-100)', flexWrap: 'wrap', gap: '16px' }}>
                    <h2 style={{ fontSize: '1.2rem', margin: 0, fontWeight: 800 }}>Danh sách Hóa đơn</h2>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <button onClick={handleExportExcel} className="btn btn-pill hover-lift" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '10px 16px', fontSize: '0.85rem', fontWeight: 800 }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>download</span>
                            Xuất Excel
                        </button>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={e => setFromDate(e.target.value)}
                            style={{ padding: '10px 16px', borderRadius: '12px', outline: 'none', border: '1px solid var(--gray-200)', fontWeight: 600, color: 'var(--ink)' }}
                        />
                        <span style={{ display: 'flex', alignItems: 'center', fontWeight: 600, color: 'var(--gray-400)' }}>-</span>
                        <input
                            type="date"
                            value={toDate}
                            onChange={e => setToDate(e.target.value)}
                            style={{ padding: '10px 16px', borderRadius: '12px', outline: 'none', border: '1px solid var(--gray-200)', fontWeight: 600, color: 'var(--ink)' }}
                        />
                        <select
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                            style={{ padding: '10px 20px', borderRadius: '12px', outline: 'none', border: '1px solid var(--gray-200)', fontWeight: 700 }}
                        >
                            <option value="all">Tất cả hóa đơn</option>
                            <option value="cho_thanh_toan">Chờ thanh toán (Nợ)</option>
                            <option value="da_thanh_toan">Đã thanh toán</option>
                        </select>
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
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
                                                background: inv.trang_thai === 'da_thanh_toan' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                                color: inv.trang_thai === 'da_thanh_toan' ? '#10b981' : '#f59e0b'
                                            }}>
                                                {inv.trang_thai === 'da_thanh_toan' ? 'ĐÃ THU TIỀN' : 'CHỜ THANH TOÁN'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button
                                                    onClick={() => handleViewDetails(inv)}
                                                    className="btn btn-pill"
                                                    style={{ background: 'var(--gray-50)', color: 'var(--ink)', padding: '8px 16px', fontSize: '0.8rem' }}
                                                >
                                                    Xem chi tiết
                                                </button>
                                                {inv.trang_thai === 'cho_thanh_toan' && (
                                                    <button
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
                </div>

                {/* BỘ NÚT ĐIỀU HƯỚNG PHÂN TRANG */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', padding: '20px', borderTop: '1px solid var(--gray-100)' }}>
                        <button
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
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span> Trước
                        </button>
                        <span style={{ fontWeight: 800, color: 'var(--ink)', fontSize: '0.85rem' }}>
                            Trang {currentPage} / {totalPages}
                        </span>
                        <button
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
                            Sau <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
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
                                body * { visibility: hidden; }
                                #print-section, #print-section * { visibility: visible; }
                                #print-section { position: absolute; left: 0; top: 0; width: 100%; }
                                .no-print { display: none !important; }
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
                                <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--primary)' }}>#HD-{viewingHD.id_hoa_don}</div>
                                <div style={{ fontSize: '0.9rem', color: 'var(--gray-500)' }}>{viewingHD.ngay_lap_hoa_don?.split('T')[0].split('-').reverse().join('/') || "---"}</div>
                            </div>
                        </div>

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

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }} className="no-print">
                            <button className="btn btn-pill" onClick={() => setViewingHD(null)} style={{ background: 'var(--gray-100)', color: 'var(--ink)', padding: '10px 20px' }}>Đóng</button>
                            <button className="btn btn-pill" onClick={() => window.print()} style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '10px 20px' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>print</span> In hóa đơn
                            </button>
                            {viewingHD.trang_thai === 'cho_thanh_toan' && (
                                <button className="btn btn-primary btn-pill" onClick={() => { handleConfirmPayment(viewingHD.id_hoa_don); setViewingHD(null); }} style={{ padding: '10px 20px' }}>Xác nhận thu tiền</button>
                            )}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default KeToanDashboard;
