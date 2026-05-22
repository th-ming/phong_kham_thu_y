import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "@services/axios";
import { toast } from "@components/Toast";
import { matchesSearchFields } from "@utils/index";

const getTodayLocalISO = () => {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split("T")[0];
};

const getDateOnly = (value: any) => String(value || "").slice(0, 10);
const getTimeShort = (value: any) => String(value || "--:--").slice(0, 5);
const getStatusLabel = (status: any) => {
    const normalized = String(status || "").toUpperCase();
    if (normalized === "DANG_KHAM") return "Đang khám";
    if (normalized === "DA_XAC_NHAN") return "Đã xác nhận";
    return normalized || "Chưa rõ";
};

const QuanLyBenhAn: React.FC = () => {
    const [lichHens, setLichHens] = useState<any[]>([]);
    const [thuocs, setThuocs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [selectedLich, setSelectedLich] = useState<any>(null);
    const [appointmentSearch, setAppointmentSearch] = useState("");
    const [trieuChung, setTrieuChung] = useState("");
    const [chanDoan, setChanDoan] = useState("");
    const [donThuocGhiChu, setDonThuocGhiChu] = useState("");

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

                const resLich = await axiosInstance.get("/api/lich-hen", { params: { page: 0, size: 999 } });
                const today = getTodayLocalISO();
                const pendingLich = extractArray(resLich.data).filter((l: any) =>
                    getDateOnly(l.ngay_kham) === today &&
                    (l.trang_thai?.toUpperCase() === 'DA_XAC_NHAN' || l.trang_thai?.toUpperCase() === 'DANG_KHAM')
                );
                setLichHens(pendingLich.sort((a, b) => String(a.gio_kham || "").localeCompare(String(b.gio_kham || ""))));

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

    const filteredLichHens = useMemo(() => {
        return lichHens.filter(l => matchesSearchFields(appointmentSearch, [
            l.id_lich_hen,
            l.ten_thu_cung,
            l.ten_khach_hang,
            l.sdt,
            l.ten_bac_si,
            l.ten_dich_vu,
            l.ly_do,
            l.gio_kham
        ]));
    }, [lichHens, appointmentSearch]);

    const totalEstimated = useMemo(() => {
        if (!selectedLich) return 0;
        const servicePrice = Number(selectedLich.gia || selectedLich.gia_tien || selectedLich.don_gia || 0);
        const medicinePrice = chiTietDonThuoc.reduce((sum, item) => {
            const thuoc = thuocs.find(t => String(t.id_thuoc) === String(item.id_thuoc));
            return sum + Number(item.so_luong || 0) * Number(thuoc?.gia_ban || 0);
        }, 0);
        return servicePrice + medicinePrice;
    }, [selectedLich, chiTietDonThuoc, thuocs]);

    const formatMoney = (value: number) => new Intl.NumberFormat("vi-VN").format(value) + " đ";

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
        if (!selectedLich.id_thu_cung) return toast.error("Ca khám này thiếu thông tin thú cưng, chưa thể lưu bệnh án.");
        if (!selectedLich.id_bac_si) return toast.error("Ca khám này chưa phân công bác sĩ, vui lòng phân công trước khi khám.");
        if (!chanDoan.trim()) return toast.error("Vui lòng nhập chẩn đoán!");
        if (chiTietDonThuoc.some(t => !t.id_thuoc)) return toast.error("Vui lòng chọn loại thuốc cho tất cả các dòng kê đơn!");

        for (const item of chiTietDonThuoc) {
            const thuocTrongKho = thuocs.find(t => String(t.id_thuoc) === String(item.id_thuoc));
            const soLuongKe = Number(item.so_luong);
            const tonKho = Number(thuocTrongKho?.so_luong_ton || 0);
            if (!Number.isFinite(soLuongKe) || soLuongKe <= 0) {
                return toast.error("Số lượng thuốc phải lớn hơn 0!");
            }
            if (thuocTrongKho && soLuongKe > tonKho) {
                return toast.error(`Thuốc "${thuocTrongKho.ten_thuoc}" chỉ còn tồn ${thuocTrongKho.so_luong_ton || 0}. Vui lòng giảm số lượng kê đơn!`);
            }
        }

        setIsSaving(true);
        try {
            if (String(selectedLich.trang_thai || "").toUpperCase() === "DA_XAC_NHAN") {
                await axiosInstance.put(`/api/lich-hen/${selectedLich.id_lich_hen}/status`, { trang_thai: 'DANG_KHAM' });
            }

            const benhAnRes = await axiosInstance.post("/api/ho-so-benh-an", {
                id_thu_cung: selectedLich.id_thu_cung,
                id_bac_si: selectedLich.id_bac_si,
                id_lich_hen: selectedLich.id_lich_hen,
                trieu_chung: trieuChung.trim(),
                chan_doan: chanDoan.trim()
            });

            const idBenhAn = benhAnRes.data.id_ho_so_benh_an;

            if (chiTietDonThuoc.length > 0 && chiTietDonThuoc[0].id_thuoc) {
                await axiosInstance.post(`/api/ho-so-benh-an/${idBenhAn}/don-thuoc`, {
                    id_bac_si: selectedLich.id_bac_si,
                    ghi_chu: donThuocGhiChu.trim(),
                    chi_tiet: chiTietDonThuoc.map(t => ({
                        id_thuoc: t.id_thuoc,
                        so_luong: Number(t.so_luong),
                        lieu_dung: String(t.lieu_dung || "").trim()
                    }))
                });
            }

            await axiosInstance.post(`/api/ho-so-benh-an/${idBenhAn}/chot-hoa-don`, {
                id_lich_hen: selectedLich.id_lich_hen
            });

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
        <div className="animate-fade-in" style={{ display: 'grid', gridTemplateColumns: 'minmax(360px, 1fr) minmax(520px, 1.5fr)', gap: '30px', alignItems: 'start' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="glass-card" style={{ padding: '24px', borderRadius: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '16px' }}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 900, margin: 0 }}>1. Chọn ca khám hôm nay</h2>
                        <span style={{ background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '999px', padding: '6px 12px', fontSize: '0.78rem', fontWeight: 900 }}>
                            {lichHens.length} ca
                        </span>
                    </div>
                    <input
                        className="form-input"
                        value={appointmentSearch}
                        onChange={e => setAppointmentSearch(e.target.value)}
                        placeholder="Tìm bé, chủ, bác sĩ, SĐT..."
                        style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--gray-50)', fontWeight: 700, marginBottom: '12px' }}
                    />
                    <select data-ai-id="select-quanlybenhan-8wqe"
                        value={selectedLich?.id_lich_hen || ""}
                        className="form-input"
                        style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--gray-50)', fontWeight: 700 }}
                        onChange={(e) => setSelectedLich(lichHens.find(l => String(l.id_lich_hen) === e.target.value) || null)}
                    >
                        <option value="">-- Chọn bệnh nhân đang chờ --</option>
                        {filteredLichHens.map(l => (
                            <option key={l.id_lich_hen} value={l.id_lich_hen}>
                                {getTimeShort(l.gio_kham)} - Bé {l.ten_thu_cung || "Chưa rõ"} - {l.ten_khach_hang || "Khách vãng lai"}
                            </option>
                        ))}
                    </select>
                    {lichHens.length === 0 && (
                        <div style={{ marginTop: '14px', padding: '14px', borderRadius: '14px', background: 'rgba(239, 68, 68, 0.08)', color: 'var(--danger)', fontWeight: 800, fontSize: '0.9rem', lineHeight: 1.5 }}>
                            Không có ca đã xác nhận hoặc đang khám trong hôm nay. Nếu khách đã tới, hãy check-in ở trang lịch hẹn trước.
                            <Link to="/quan-ly/lich-hen" style={{ display: 'inline-flex', marginLeft: '8px', color: 'var(--danger)', textDecoration: 'underline' }}>Mở lịch hẹn</Link>
                        </div>
                    )}
                    {lichHens.length > 0 && filteredLichHens.length === 0 && (
                        <div style={{ fontSize: '0.85rem', color: 'var(--gray-400)', marginTop: '8px', fontWeight: 700 }}>Không có ca khớp từ khóa tìm kiếm.</div>
                    )}
                </div>

                {selectedLich && (
                    <div className="glass-card animate-fade-in" style={{ padding: '24px', borderRadius: '24px', border: '1px solid var(--primary-light)' }}>
                        <h2 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '16px', color: 'var(--primary)' }}>2. Thông tin ca khám</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '18px' }}>
                            {[
                                ['Thời gian', `${getDateOnly(selectedLich.ngay_kham)} ${getTimeShort(selectedLich.gio_kham)}`],
                                ['Trạng thái', getStatusLabel(selectedLich.trang_thai)],
                                ['Thú cưng', selectedLich.ten_thu_cung || `TC-${selectedLich.id_thu_cung || '—'}`],
                                ['Chủ nuôi', selectedLich.ten_khach_hang || 'Khách vãng lai'],
                                ['Bác sĩ', selectedLich.ten_bac_si || 'Chưa phân công'],
                                ['Dịch vụ', selectedLich.ten_dich_vu || selectedLich.ly_do || 'Khám bệnh']
                            ].map(([label, value]) => (
                                <div key={label} style={{ background: 'var(--gray-50)', borderRadius: '12px', padding: '12px' }}>
                                    <div style={{ color: 'var(--gray-400)', fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
                                    <div style={{ color: 'var(--ink)', fontWeight: 900, fontSize: '0.95rem' }}>{value}</div>
                                </div>
                            ))}
                        </div>

                        <h2 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '16px', color: 'var(--ink)' }}>3. Chẩn đoán lâm sàng</h2>
                        <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--gray-400)', display: 'block', marginBottom: '8px' }}>TRIỆU CHỨNG BAN ĐẦU</label>
                        <textarea data-ai-id="textarea-quanlybenhan-trieuchung" className="form-input" value={trieuChung} onChange={e => setTrieuChung(e.target.value)} style={{ width: '100%', minHeight: '80px', background: 'var(--gray-50)', marginBottom: '16px' }} placeholder="Ghi nhận triệu chứng..." />

                        <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--gray-400)', display: 'block', marginBottom: '8px' }}>KẾT LUẬN CHẨN ĐOÁN <span style={{ color: 'red' }}>*</span></label>
                        <textarea data-ai-id="textarea-quanlybenhan-chandoan" className="form-input" value={chanDoan} onChange={e => setChanDoan(e.target.value)} style={{ width: '100%', minHeight: '100px', background: 'var(--gray-50)' }} placeholder="Nhập kết luận bệnh..." />
                    </div>
                )}
            </div>

            {selectedLich && (
                <div className="glass-card animate-fade-in" style={{ padding: '30px', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 900, borderBottom: '2px solid var(--gray-100)', paddingBottom: '16px', margin: 0 }}>4. Kê đơn thuốc</h2>

                    {chiTietDonThuoc.map((item, index) => (
                        <div key={index} style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 2fr) 90px minmax(160px, 2fr) 40px', gap: '12px', alignItems: 'center', background: 'var(--gray-50)', padding: '12px', borderRadius: '12px' }}>
                            <select data-ai-id="select-quanlybenhan-dttd" className="form-input" value={item.id_thuoc} onChange={e => handleThuocChange(index, 'id_thuoc', e.target.value)}>
                                <option value="">-- Chọn thuốc --</option>
                                {thuocs.map(t => <option key={t.id_thuoc} value={t.id_thuoc}>{t.ten_thuoc} (Tồn: {t.so_luong_ton || 0})</option>)}
                            </select>
                            <input data-ai-id="input-quanlybenhan-nj8p" type="number" min="1" className="form-input" value={item.so_luong} onChange={e => handleThuocChange(index, 'so_luong', e.target.value)} placeholder="SL" />
                            <input data-ai-id="input-quanlybenhan-vgla" type="text" className="form-input" value={item.lieu_dung} onChange={e => handleThuocChange(index, 'lieu_dung', e.target.value)} placeholder="Liều dùng (VD: Sáng 1 viên)" />
                            <button data-ai-id="button-quanlybenhan-47hl" onClick={() => handleRemoveThuoc(index)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer' }}><span className="material-symbols-outlined">delete</span></button>
                        </div>
                    ))}

                    <button data-ai-id="button-quanlybenhan-8zw3" onClick={handleAddThuoc} className="btn" style={{ background: 'var(--primary-light)', color: 'var(--primary)', width: 'fit-content', padding: '8px 16px', borderRadius: '12px' }}>
                        <span className="material-symbols-outlined">add</span> Thêm thuốc
                    </button>

                    <div style={{ marginTop: '16px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--gray-400)', display: 'block', marginBottom: '8px' }}>LỜI DẶN BÁC SĨ</label>
                        <textarea data-ai-id="textarea-quanlybenhan-loidang" className="form-input" value={donThuocGhiChu} onChange={e => setDonThuocGhiChu(e.target.value)} style={{ width: '100%', minHeight: '80px', background: 'var(--gray-50)' }} placeholder="VD: Kiêng ăn mặn, uống nhiều nước..." />
                    </div>

                    <div style={{ background: 'var(--gray-50)', borderRadius: '16px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                        <div>
                            <div style={{ color: 'var(--gray-400)', fontSize: '0.78rem', fontWeight: 900, textTransform: 'uppercase' }}>Tạm tính hóa đơn</div>
                            <div style={{ color: 'var(--ink)', fontSize: '1.4rem', fontWeight: 950 }}>{formatMoney(totalEstimated)}</div>
                        </div>
                        <div style={{ color: 'var(--gray-400)', fontSize: '0.85rem', fontWeight: 700, textAlign: 'right' }}>Hóa đơn sẽ ở trạng thái chờ thanh toán sau khi lưu.</div>
                    </div>

                    <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                        <button data-ai-id="button-quanlybenhan-1pce"
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
