import React, { useState, useEffect } from "react";
import axiosInstance from "@services/axios";
import { toast } from "@components/Toast";

const QuanLyBenhAn: React.FC = () => {
    const [lichHens, setLichHens] = useState<any[]>([]);
    const [thuocs, setThuocs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [selectedLich, setSelectedLich] = useState<any>(null);
    const [trieuChung, setTrieuChung] = useState("");
    const [chanDoan, setChanDoan] = useState("");
    const [donThuocGhiChu, setDonThuocGhiChu] = useState("");

    // Quản lý danh sách thuốc đang kê
    const [chiTietDonThuoc, setChiTietDonThuoc] = useState<any[]>([]);



    useEffect(() => {
        const fetchData = async () => {
            try {
                const extractArray = (data: any): any[] => {
                    if (!data) return [];
                    if (Array.isArray(data)) return data;
                    const possibleArrays = [data.data, data.content, data.result, data.items, data.records];
                    for (const arr of possibleArrays) {
                        if (Array.isArray(arr)) return arr;
                        if (arr && typeof arr === 'object' && Array.isArray(arr.content)) return arr.content;
                        if (arr && typeof arr === 'object' && Array.isArray(arr.data)) return arr.data;
                    }
                    return [];
                };

                // Lấy Lịch hẹn chờ khám/đang khám trong ngày
                const resLich = await axiosInstance.get("/api/lich-hen", { params: { page: 0, size: 999 } });
                const d = new Date();
                const today = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
                const pendingLich = extractArray(resLich.data).filter((l: any) =>
                    l.ngay_kham === today &&
                    (l.trang_thai?.toUpperCase() === 'DA_XAC_NHAN' || l.trang_thai === 'Đã xác nhận')
                );
                setLichHens(pendingLich);

                // Lấy danh sách thuốc trong kho
                const resThuoc = await axiosInstance.get("/api/kho/thuoc");
                setThuocs(extractArray(resThuoc.data));
            } catch (err) {
                toast.error("Lỗi tải dữ liệu bệnh án");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleAddThuoc = () => {
        setChiTietDonThuoc([...chiTietDonThuoc, { id_thuoc: "", so_luong: 1, lieu_dung: "" }]);
    };

    const handleRemoveThuoc = (index: number) => {
        setChiTietDonThuoc(chiTietDonThuoc.filter((_, i) => i !== index));
    };

    const handleThuocChange = (index: number, field: string, value: any) => {
        const newList = [...chiTietDonThuoc];
        // Fix lỗi Mutation State của React
        newList[index] = { ...newList[index], [field]: value };
        setChiTietDonThuoc(newList);
    };

    const handleSaveBenhAn = async () => {
        if (!selectedLich) return toast.error("Vui lòng chọn ca khám!");
        if (!chanDoan) return toast.error("Vui lòng nhập chẩn đoán!");
        // Fix lỗi gửi mảng thuốc rỗng lên Backend gây Crash
        if (chiTietDonThuoc.some(t => !t.id_thuoc)) return toast.error("Vui lòng chọn loại thuốc cho tất cả các dòng kê đơn!");

        // KIỂM TRA BẢO MẬT: Chặn kê đơn vượt quá số lượng tồn kho
        for (const item of chiTietDonThuoc) {
            const thuocTrongKho = thuocs.find(t => String(t.id_thuoc) === String(item.id_thuoc));
            if (thuocTrongKho && item.so_luong > (thuocTrongKho.so_luong_ton || 0)) {
                setIsSaving(false);
                return toast.error(`Thuốc "${thuocTrongKho.ten_thuoc}" chỉ còn tồn ${thuocTrongKho.so_luong_ton || 0}. Vui lòng giảm số lượng kê đơn!`);
            }
        }

        setIsSaving(true);
        try {
            // Lưu Bệnh Án
            const benhAnRes = await axiosInstance.post("/api/ho-so-benh-an", {
                id_thu_cung: selectedLich.id_thu_cung,
                // Fix: Bắt buộc dùng ID Bác sĩ của lịch hẹn, tránh việc Admin lưu hộ bị ghi nhầm tên
                id_bac_si: selectedLich.id_bac_si,
                id_lich_hen: selectedLich.id_lich_hen,
                trieu_chung: trieuChung,
                chan_doan: chanDoan
            });

            const idBenhAn = benhAnRes.data.id_ho_so_benh_an;

            // Lưu Đơn thuốc (Nếu có kê thuốc)
            if (chiTietDonThuoc.length > 0 && chiTietDonThuoc[0].id_thuoc) {
                await axiosInstance.post(`/api/ho-so-benh-an/${idBenhAn}/don-thuoc`, {
                    id_bac_si: selectedLich.id_bac_si,
                    ghi_chu: donThuocGhiChu,
                    chi_tiet: chiTietDonThuoc.map(t => ({
                        id_thuoc: parseInt(t.id_thuoc),
                        so_luong: parseInt(t.so_luong),
                        lieu_dung: t.lieu_dung
                    }))
                });
            }

            // TỰ ĐỘNG CHỐT HÓA ĐƠN (TIỀN KHÁM + TIỀN THUỐC)
            await axiosInstance.post(`/api/ho-so-benh-an/${idBenhAn}/chot-hoa-don`, {
                id_lich_hen: selectedLich.id_lich_hen
            });

            // Đổi trạng thái lịch hẹn thành Đã Hoàn Thành
            await axiosInstance.put(`/api/lich-hen/${selectedLich.id_lich_hen}/status`, { trang_thai: 'HOAN_THANH' });

            toast.success("Đã lưu Bệnh án, Kê đơn & Xuất Hóa đơn thành công!");
            setSelectedLich(null);
            setTrieuChung(""); setChanDoan(""); setDonThuocGhiChu(""); setChiTietDonThuoc([]);
            setLichHens(lichHens.filter(l => l.id_lich_hen !== selectedLich.id_lich_hen));
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Lỗi lưu bệnh án!");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><div className="dot-pulse"></div></div>;

    return (
        <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '30px', alignItems: 'start' }}>
            {/* CỘT TRÁI: CHỌN CA KHÁM VÀ CHẨN ĐOÁN */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="glass-card" style={{ padding: '24px', borderRadius: '24px' }}>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '16px' }}>1. Chọn Ca Khám (Hôm nay)</h2>
                    <select
                        className="form-input"
                        style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--gray-50)', fontWeight: 700 }}
                        onChange={(e) => setSelectedLich(lichHens.find(l => l.id_lich_hen.toString() === e.target.value))}
                    >
                        <option value="">-- Chọn bệnh nhân đang chờ --</option>
                        {lichHens.map(l => (
                            <option key={l.id_lich_hen} value={l.id_lich_hen}>
                                {l.gio_kham.substring(0, 5)} - Bé {l.ten_thu_cung} (Chủ: {l.ten_khach_hang})
                            </option>
                        ))}
                    </select>
                    {lichHens.length === 0 && <div style={{ fontSize: '0.8rem', color: 'var(--danger)', marginTop: '8px', fontWeight: 600 }}>Không có ca chờ khám nào trong hôm nay.</div>}
                </div>

                {selectedLich && (
                    <div className="glass-card animate-fade-in" style={{ padding: '24px', borderRadius: '24px', border: '1px solid var(--primary-light)' }}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '16px', color: 'var(--primary)' }}>2. Chẩn Đoán Lâm Sàng</h2>
                        <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--gray-400)', display: 'block', marginBottom: '8px' }}>TRIỆU CHỨNG BAN ĐẦU</label>
                        <textarea className="form-input" value={trieuChung} onChange={e => setTrieuChung(e.target.value)} style={{ width: '100%', minHeight: '80px', background: 'var(--gray-50)', marginBottom: '16px' }} placeholder="Ghi nhận triệu chứng..." />

                        <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--gray-400)', display: 'block', marginBottom: '8px' }}>KẾT LUẬN CHẨN ĐOÁN <span style={{ color: 'red' }}>*</span></label>
                        <textarea className="form-input" value={chanDoan} onChange={e => setChanDoan(e.target.value)} style={{ width: '100%', minHeight: '100px', background: 'var(--gray-50)' }} placeholder="Nhập kết luận bệnh..." />
                    </div>
                )}
            </div>

            {/* CỘT PHẢI: KÊ ĐƠN THUỐC */}
            {selectedLich && (
                <div className="glass-card animate-fade-in" style={{ padding: '30px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 900, borderBottom: '2px solid var(--gray-100)', paddingBottom: '16px' }}>3. Kê Đơn Thuốc (Tùy chọn)</h2>

                    {chiTietDonThuoc.map((item, index) => (
                        <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 80px 2fr 40px', gap: '12px', alignItems: 'center', background: 'var(--gray-50)', padding: '12px', borderRadius: '12px' }}>
                            <select className="form-input" value={item.id_thuoc} onChange={e => handleThuocChange(index, 'id_thuoc', e.target.value)}>
                                <option value="">-- Chọn thuốc --</option>
                                {thuocs.map(t => <option key={t.id_thuoc} value={t.id_thuoc}>{t.ten_thuoc} (Tồn: {t.so_luong_ton || 0})</option>)}
                            </select>
                            <input type="number" min="1" className="form-input" value={item.so_luong} onChange={e => handleThuocChange(index, 'so_luong', e.target.value)} placeholder="SL" />
                            <input type="text" className="form-input" value={item.lieu_dung} onChange={e => handleThuocChange(index, 'lieu_dung', e.target.value)} placeholder="Liều dùng (VD: Sáng 1 viên)" />
                            <button onClick={() => handleRemoveThuoc(index)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><span className="material-symbols-outlined">delete</span></button>
                        </div>
                    ))}

                    <button onClick={handleAddThuoc} className="btn" style={{ background: 'var(--primary-light)', color: 'var(--primary)', width: 'fit-content', padding: '8px 16px', borderRadius: '12px' }}>
                        <span className="material-symbols-outlined">add</span> Thêm thuốc
                    </button>

                    <div style={{ marginTop: '16px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--gray-400)', display: 'block', marginBottom: '8px' }}>LỜI DẶN BÁC SĨ</label>
                        <textarea className="form-input" value={donThuocGhiChu} onChange={e => setDonThuocGhiChu(e.target.value)} style={{ width: '100%', minHeight: '80px', background: 'var(--gray-50)' }} placeholder="VD: Kiêng ăn mặn, uống nhiều nước..." />
                    </div>

                    <div style={{ marginTop: '30px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            onClick={handleSaveBenhAn}
                            disabled={isSaving}
                            className="btn btn-primary btn-pill"
                            style={{ padding: '16px 40px', fontSize: '1.1rem', boxShadow: '0 10px 20px rgba(15,157,138,0.3)' }}
                        >
                            {isSaving ? "ĐANG XỬ LÝ..." : "LƯU BỆNH ÁN & HOÀN THÀNH"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
export default QuanLyBenhAn;
