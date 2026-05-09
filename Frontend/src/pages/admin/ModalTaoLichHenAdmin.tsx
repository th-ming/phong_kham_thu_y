import React, { useState, useEffect, useCallback } from 'react';
import axiosInstance from '@services/axios';
import { Modal } from '@components/CommonUI';
import { toast } from '@components/Toast';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void; // Hàm gọi lại để tải lại danh sách lịch hẹn sau khi tạo thành công
}

export const ModalTaoLichHenAdmin: React.FC<ModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [step, setStep] = useState(1); // Bước 1: Tìm khách hàng, Bước 2: Điền thông tin lịch hẹn
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [phoneQuery, setPhoneQuery] = useState('');
    const [foundCustomers, setFoundCustomers] = useState<any[]>([]);
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [customerPets, setCustomerPets] = useState<any[]>([]);

    const [isNewCustomer, setIsNewCustomer] = useState(false);
    const [newCustomerName, setNewCustomerName] = useState('');
    const [newPetName, setNewPetName] = useState('');

    const [selectedPetId, setSelectedPetId] = useState('');
    const [selectedServiceId, setSelectedServiceId] = useState('');
    const [selectedDoctorId, setSelectedDoctorId] = useState('');
    const [appointmentDate, setAppointmentDate] = useState('');
    const [appointmentTime, setAppointmentTime] = useState('');
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [notes, setNotes] = useState('');
    const [isEmergency, setIsEmergency] = useState(false);

    const [services, setServices] = useState<any[]>([]);
    const [doctors, setDoctors] = useState<any[]>([]);

    // Hàm reset toàn bộ trạng thái về ban đầu khi đóng modal
    const resetState = useCallback(() => {
        setStep(1);
        setIsLoading(false);
        setError('');
        setPhoneQuery('');
        setFoundCustomers([]);
        setSelectedCustomer(null);
        setCustomerPets([]);
        setIsNewCustomer(false);
        setNewCustomerName('');
        setNewPetName('');
        setSelectedPetId('');
        setSelectedServiceId('');
        setSelectedDoctorId('');
        setAppointmentDate('');
        setAppointmentTime('');
        setNotes('');
        setIsEmergency(false);
    }, []);

    // Tải danh sách dịch vụ và bác sĩ khi mở modal
    useEffect(() => {
        if (isOpen) {
            axiosInstance.get('/api/dich-vu').then(res => setServices(res.data));
            axiosInstance.get('/api/bac-si').then(res => setDoctors(res.data));
        } else {
            resetState();
        }
    }, [isOpen, resetState]);

    // Tự động tìm kiếm các khung giờ trống của bác sĩ khi các thông tin liên quan thay đổi
    useEffect(() => {
        if (selectedDoctorId && appointmentDate && selectedServiceId) {
            setIsLoadingSlots(true);
            axiosInstance.get(`/api/lich-hen/gio-ranh?id_nhan_vien=${selectedDoctorId}&ngay=${appointmentDate}&id_dich_vu=${selectedServiceId}`)
                .then(res => {
                    setAvailableSlots(res.data);
                    if (!res.data.includes(appointmentTime)) setAppointmentTime('');
                })
                .catch(err => {
                    console.error("Lỗi lấy giờ rảnh:", err);
                    setAvailableSlots([]);
                })
                .finally(() => setIsLoadingSlots(false));
        } else {
            setAvailableSlots([]);
        }
    }, [selectedDoctorId, appointmentDate, selectedServiceId]);

    // Xử lý tìm kiếm khách hàng theo số điện thoại
    const handleSearchCustomer = async () => {
        if (!phoneQuery.trim()) return;
        setIsLoading(true);
        setError('');
        try {
            const res = await axiosInstance.get(`/api/khach-hang/search?sdt=${phoneQuery}`);
            if (res.data && res.data.length > 0) {
                setFoundCustomers(res.data);
            } else {
                setFoundCustomers([]);
                setIsNewCustomer(true);
                setNewCustomerName('');
                setNewPetName('');
            }
        } catch (err) {
            setError('Lỗi hệ thống khi tìm kiếm khách hàng.');
        } finally {
            setIsLoading(false);
        }
    };

    // Chọn khách hàng từ danh sách tìm thấy và tải danh sách thú cưng của họ
    const selectCustomer = async (customer: any) => {
        setSelectedCustomer(customer);
        setIsLoading(true);
        try {
            const res = await axiosInstance.get(`/api/thu-cung/khach/${customer.id_khach_hang}`);
            setCustomerPets(res.data || []);
            setStep(2);
        } catch (err) {
            setError('Không thể tải danh sách thú cưng của khách hàng này.');
        } finally {
            setIsLoading(false);
        }
    };

    // Xử lý luồng tạo lịch hẹn (bao gồm cả tạo khách hàng/thú cưng mới nếu cần)
    const handleCreateAppointment = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            let customerId = selectedCustomer?.id_khach_hang;
            let petId = selectedPetId;

            // Nếu là khách mới hoàn toàn, hệ thống tự động tạo hồ sơ khách và thú cưng trước
            if (isNewCustomer) {
                try {
                    const customerRes = await axiosInstance.post('/api/auth/register-simple', {
                        ten_khach_hang: newCustomerName,
                        sdt: phoneQuery,
                        email: `${phoneQuery}@rexi.vn` // Tạo email ảo dựa trên SĐT
                    });
                    customerId = customerRes.data.user.id_khach_hang;
                } catch (err) {
                    throw new Error("Không thể tạo thông tin khách hàng mới. SĐT có thể đã tồn tại.");
                }

                try {
                    const petRes = await axiosInstance.post('/api/thu-cung', {
                        id_khach_hang: customerId,
                        ten_thu_cung: newPetName,
                        giong: 'Chưa xác định',
                        loai: 'Chưa xác định'
                    });
                    petId = petRes.data.id_thu_cung;
                } catch (err) {
                    // CƠ CHẾ HOÀN TÁC (ROLLBACK): Xóa khách vừa tạo nếu không tạo được thú cưng
                    if (customerId) {
                        await axiosInstance.delete(`/api/khach-hang/${customerId}`).catch(e => console.error("Lỗi hoàn tác khách hàng:", e));
                    }
                    throw new Error("Lỗi hệ thống khi tạo thú cưng mới.");
                }
            }

            if (!petId) {
                setError("Sếp ơi, vui lòng chọn hoặc tạo thú cưng cho bé nhé.");
                setIsLoading(false);
                return;
            }

            const serviceName = services.find(s => String(s.id_dich_vu) === String(selectedServiceId))?.ten_dich_vu || "Khám bệnh";

            try {
                // Cuối cùng: Gửi yêu cầu đặt lịch hẹn chính thức
                await axiosInstance.post('/api/lich-hen', {
                    id_khach_hang: customerId,
                    id_thu_cung: petId,
                    id_dich_vu: selectedServiceId,
                    id_bac_si: selectedDoctorId || null,
                    ngay_kham: appointmentDate,
                    gio_kham: appointmentTime.length === 5 ? `${appointmentTime}:00` : appointmentTime,
                    ly_do: serviceName,
                    ghi_chu: isEmergency ? `[CẤP CỨU] ${notes}` : notes,
                    trang_thai: 'DA_XAC_NHAN'
                });
            } catch (err) {
                // HOÀN TÁC cho khách vãng lai nếu bước cuối cùng bị lỗi để sạch dữ liệu rác
                if (isNewCustomer) {
                    if (petId) await axiosInstance.delete(`/api/thu-cung/${petId}`).catch(e => console.error("Lỗi hoàn tác thú cưng", e));
                    if (customerId) await axiosInstance.delete(`/api/khach-hang/${customerId}`).catch(e => console.error("Lỗi hoàn tác khách hàng", e));
                }
                throw new Error("Hệ thống bận, không thể tạo lịch hẹn lúc này.");
            }

            onSuccess();
            onClose();
            toast.success("Đã tạo lịch hẹn thành công cho sếp rồi nhé! 🐾");
        } catch (err: any) {
            setError(err.message || 'Có lỗi xảy ra, sếp vui lòng thử lại sau.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Tạo Lịch Hẹn Mới" maxWidth="600px">
            <div>
                {/* Hiển thị thông báo lỗi nếu có */}
                {error && (
                    <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.3)', marginBottom: '20px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="material-symbols-outlined">error</span> {error}
                    </div>
                )}

                {/* BƯỚC 1: TÌM KIẾM KHÁCH HÀNG THEO SĐT */}
                {step === 1 && (
                    <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '8px', display: 'block' }}>TÌM KHÁCH HÀNG BẰNG SĐT</label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <span className="material-symbols-outlined" style={{ position: 'absolute', left: '16px', color: 'var(--gray-400)', pointerEvents: 'none' }}>search</span>
                            <input type="tel" value={phoneQuery} onChange={e => setPhoneQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearchCustomer()} placeholder="Nhập số điện thoại khách hàng..." style={{ width: '100%', padding: '14px 14px 14px 48px', borderRadius: '18px', border: '1px solid var(--gray-200)', background: 'var(--gray-50)', outline: 'none', fontWeight: 700, color: 'var(--ink)', fontSize: '1rem', transition: 'all 0.3s' }} autoFocus />
                            <button onClick={handleSearchCustomer} className="btn btn-primary btn-pill" style={{ position: 'absolute', right: '6px', padding: '10px 28px', borderRadius: '14px' }} disabled={isLoading}>{isLoading ? '...' : 'Tìm kiếm'}</button>
                        </div>

                        <div style={{ marginTop: '20px', display: 'grid', gap: '12px' }}>
                            {foundCustomers.map(cust => (
                                <div key={cust.id_khach_hang} onClick={() => selectCustomer(cust)} style={{ padding: '16px', background: 'var(--surface)', border: '1px solid var(--gray-200)', borderRadius: '16px', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '16px' }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--primary-light)'; }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--gray-200)'; e.currentTarget.style.background = 'var(--surface)'; }}>
                                    <div style={{ width: '44px', height: '44px', background: 'var(--gray-100)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-500)' }}>
                                        <span className="material-symbols-outlined">person</span>
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 800, color: 'var(--ink)', fontSize: '1.05rem' }}>{cust.ten_khach_hang}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)', fontWeight: 600 }}>SĐT: {cust.sdt}</div>
                                    </div>
                                    <span className="material-symbols-outlined" style={{ marginLeft: 'auto', color: 'var(--primary)' }}>chevron_right</span>
                                </div>
                            ))}
                        </div>

                        {/* Gợi ý tạo khách mới nếu không tìm thấy SĐT */}
                        {isNewCustomer && (
                            <div style={{ marginTop: '20px', padding: '24px', background: 'var(--primary-light)', border: '1px dashed var(--primary)', borderRadius: '20px' }}>
                                <p style={{ fontWeight: 800, color: 'var(--primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className="material-symbols-outlined">person_add</span> Khách hàng mới
                                </p>
                                <div style={{ display: 'grid', gap: '16px' }}>
                                    <input value={newCustomerName} onChange={e => setNewCustomerName(e.target.value)} placeholder="Họ và tên khách hàng" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(15, 157, 138, 0.3)', outline: 'none', fontWeight: 600 }} autoFocus />
                                    <input value={newPetName} onChange={e => setNewPetName(e.target.value)} placeholder="Tên thú cưng" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid rgba(15, 157, 138, 0.3)', outline: 'none', fontWeight: 600 }} onKeyDown={e => { if (e.key === 'Enter') { if (newCustomerName && newPetName) { setSelectedCustomer({ ten_khach_hang: newCustomerName }); setStep(2); } else { toast.error("Sếp vui lòng nhập đầy đủ Tên khách và Tên bé nhé!"); } } }} />
                                    <button onClick={() => {
                                        if (newCustomerName && newPetName) {
                                            setSelectedCustomer({ ten_khach_hang: newCustomerName }); setStep(2);
                                        } else {
                                            toast.error("Vui lòng nhập đầy đủ Tên khách hàng và Tên thú cưng!");
                                        }
                                    }} className="btn btn-primary btn-pill" style={{ width: '100%', justifyContent: 'center', padding: '14px' }}>Tiếp tục <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_forward</span></button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* BƯỚC 2: ĐIỀN FORM THÔNG TIN LỊCH HẸN */}
                {step === 2 && (
                    <form onSubmit={handleCreateAppointment}>
                        {/* Hiển thị thông báo về khách hàng đang được chọn */}
                        <div style={{ padding: '20px 24px', background: 'var(--primary-light)', borderRadius: '24px', marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(15, 157, 138, 0.2)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ background: 'var(--primary)', color: 'white', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>account_circle</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ color: 'var(--gray-500)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>Khách hàng</span>
                                    <strong style={{ color: 'var(--ink)', fontSize: '1.1rem', fontWeight: 900 }}>{selectedCustomer?.ten_khach_hang}</strong>
                                </div>
                            </div>
                            <button type="button" onClick={() => setStep(1)} className="btn btn-pill" style={{ background: 'var(--surface)', color: 'var(--ink)', padding: '8px 16px', fontSize: '0.85rem', border: '1px solid var(--gray-200)', boxShadow: 'var(--shadow-sm)', fontWeight: 800 }}>Thay đổi</button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '8px', display: 'block' }}>THÚ CƯNG</label>
                                {isNewCustomer ? <input type="text" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--gray-200)', background: 'var(--gray-100)', color: 'var(--gray-500)', outline: 'none', fontWeight: 700 }} value={newPetName} disabled /> : <select value={selectedPetId} onChange={e => setSelectedPetId(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--gray-200)', background: 'var(--gray-50)', outline: 'none', fontWeight: 700, color: 'var(--ink)' }} required><option value="">-- Chọn thú cưng --</option>{customerPets.map(pet => <option key={pet.id_thu_cung} value={pet.id_thu_cung}>{pet.ten_thu_cung}</option>)}</select>}
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '8px', display: 'block' }}>DỊCH VỤ</label>
                                <select value={selectedServiceId} onChange={e => setSelectedServiceId(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--gray-200)', background: 'var(--gray-50)', outline: 'none', fontWeight: 700, color: 'var(--ink)' }} required><option value="">-- Chọn dịch vụ --</option>{services.map(s => <option key={s.id_dich_vu} value={s.id_dich_vu}>{s.ten_dich_vu}</option>)}</select>
                            </div>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '8px', display: 'block' }}>BÁC SĨ PHỤ TRÁCH</label>
                                <select value={selectedDoctorId} onChange={e => setSelectedDoctorId(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--gray-200)', background: 'var(--gray-50)', outline: 'none', fontWeight: 700, color: 'var(--ink)' }} required><option value="">-- Chọn bác sĩ --</option>{doctors.map(d => <option key={d.id_nhan_vien} value={d.id_nhan_vien}>{d.ho_ten} - {d.chuyen_mon}</option>)}</select>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '8px', display: 'block' }}>NGÀY HẸN</label>
                                <input
                                    type="date"
                                    value={appointmentDate}
                                    min={(() => {
                                        const d = new Date();
                                        return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0];
                                    })()}
                                    onChange={e => setAppointmentDate(e.target.value)}
                                    style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--gray-200)', background: 'var(--gray-50)', outline: 'none', fontWeight: 700, color: 'var(--ink)' }}
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '8px', display: 'block' }}>GIỜ HẸN</label>
                                <select value={appointmentTime} onChange={e => setAppointmentTime(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--gray-200)', background: 'var(--gray-50)', outline: 'none', fontWeight: 700, color: 'var(--ink)' }} required disabled={!selectedDoctorId || !appointmentDate || !selectedServiceId || isLoadingSlots}>
                                    <option value="">{isLoadingSlots ? "Đang tải giờ rảnh..." : (!selectedDoctorId || !appointmentDate || !selectedServiceId) ? "-- Chọn thông tin trước --" : "-- Chọn giờ hẹn --"}</option>
                                    {availableSlots.map(slot => (
                                        <option key={slot} value={slot}>{slot}</option>
                                    ))}
                                </select>
                                {(!isLoadingSlots && selectedDoctorId && appointmentDate && selectedServiceId && availableSlots.length === 0) && (
                                    <span style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 600, marginTop: '4px', display: 'block' }}>Bác sĩ này không còn giờ rảnh phù hợp trong ngày này.</span>
                                )}
                            </div>
                        </div>

                        <div style={{ marginTop: '20px' }}>
                            <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--gray-400)', marginBottom: '8px', display: 'block' }}>GHI CHÚ / TRIỆU CHỨNG</label>
                            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Nhập triệu chứng, yêu cầu đặc biệt..." style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid var(--gray-200)', background: 'var(--gray-50)', outline: 'none', fontWeight: 600, color: 'var(--ink)', minHeight: '100px', lineHeight: '1.5' }}></textarea>
                        </div>

                        {/* Tùy chọn đánh dấu ca cấp cứu khẩn cấp */}
                        <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(239, 68, 68, 0.1)', padding: '16px', borderRadius: '16px', border: '1px dashed #ef4444' }}>
                            <input type="checkbox" id="emergencyCheck" checked={isEmergency} onChange={e => setIsEmergency(e.target.checked)} style={{ width: '20px', height: '20px', accentColor: '#ef4444', cursor: 'pointer', flexShrink: 0 }} />
                            <label htmlFor="emergencyCheck" style={{ color: '#ef4444', fontWeight: 800, cursor: 'pointer', margin: 0, userSelect: 'none' }}>Đánh dấu KHẨN CẤP / Ưu tiên xếp lịch ngay</label>
                        </div>

                        <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button type="button" onClick={onClose} className="btn btn-pill" style={{ background: 'var(--gray-100)', color: 'var(--ink)' }}>Hủy bỏ</button>
                            <button type="submit" className="btn btn-primary btn-pill" disabled={isLoading}>
                                {isLoading ? 'Đang xử lý...' : 'Xác nhận Tạo lịch'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </Modal>
    );
};

export default React.memo(ModalTaoLichHenAdmin);