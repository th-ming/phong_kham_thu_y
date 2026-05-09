import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@components/Header';
import Footer from '@components/Footer';
import axiosInstance from '@services/axios';
import { toast } from '@components/Toast';
import { getUserProfile } from '@utils/index';

interface Pet {
    id_thu_cung?: number;
    ten_thu_cung: string;
    giong_loai: string;
    tuoi: number;
    can_nang: number;
}

const DashboardKhachHang: React.FC = () => {
    const user = getUserProfile();
    const navigate = useNavigate();
    const [pets, setPets] = useState<Pet[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    // Form Add State
    const [tenThuCung, setTenThuCung] = useState('');
    const [giongLoai, setGiongLoai] = useState('Chó');
    const [tuoi, setTuoi] = useState('');
    const [canNang, setCanNang] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!user) {
            toast.info("Vui lòng đăng nhập để xem thông tin!");
            navigate('/dang-nhap');
            return;
        }
        fetchPets();
    }, [navigate]);

    const fetchPets = async () => {
        const customerId = user?.id_khach_hang || user?.id;
        if (!customerId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const res = await axiosInstance.get(`/api/thu-cung/khach/${customerId}`);
            setPets(res.data);
        } catch (err) {
            toast.error("Lỗi lấy danh sách thú cưng");
        } finally {
            setLoading(false);
        }
    };

    const handleAddPet = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!tenThuCung.trim()) {
            toast.error("Vui lòng nhập Tên thú cưng!");
            return;
        }

        const customerId = user?.id_khach_hang || user?.id;
        if (!customerId) {
            toast.error("Không tìm thấy thông tin tài khoản. Vui lòng đăng nhập lại!");
            return;
        }

        setIsSubmitting(true);
        try {
            await axiosInstance.post('/api/thu-cung', {
                id_khach_hang: customerId,
                ten_thu_cung: tenThuCung,
                giong_loai: giongLoai,
                loai: giongLoai, // Fallback đảm bảo không bao giờ bị Crash DB
                tuoi: tuoi ? parseInt(tuoi) : 0,
                can_nang: canNang ? parseFloat(canNang) : 0
            });
            toast.success("Đã thêm hồ sơ thú cưng thành công!");
            setShowModal(false);
            setTenThuCung(''); setTuoi(''); setCanNang('');
            fetchPets(); // Refresh danh sách
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Lỗi lưu thú cưng. Hệ thống từ chối truy cập!");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
            <Header />
            <main style={{ padding: '100px 0 120px' }}>
                <div className="container" style={{ maxWidth: '1000px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
                        <div>
                            <h1 style={{ fontSize: '2.5rem', fontWeight: 950, color: 'var(--ink)' }}>Xin chào, <span style={{ color: 'var(--primary)' }}>{user?.ho_ten || user?.ten_dang_nhap}</span>!</h1>
                            <p style={{ color: 'var(--gray-500)', fontSize: '1.1rem', fontWeight: 500, marginTop: '8px' }}>Quản lý hồ sơ các bé cưng của bạn tại đây.</p>
                        </div>
                        <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ padding: '14px 28px', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="material-symbols-outlined">add</span> Thêm thú cưng
                        </button>
                    </div>

                    {loading ? (
                        <div className="dot-pulse" style={{ margin: '60px auto' }}></div>
                    ) : pets.length === 0 ? (
                        <div className="glass-card" style={{ background: 'var(--surface)', padding: '60px', textAlign: 'center', borderRadius: '32px', border: '2px dashed var(--gray-300)' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '64px', color: 'var(--gray-300)', marginBottom: '16px' }}>pets</span>
                            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--ink)', marginBottom: '8px' }}>Bạn chưa có thú cưng nào</h3>
                            <p style={{ color: 'var(--gray-500)', marginBottom: '24px' }}>Hãy tạo hồ sơ để dễ dàng đặt lịch khám bệnh nhé!</p>
                            <button onClick={() => setShowModal(true)} className="btn btn-primary" style={{ borderRadius: '50px', padding: '12px 24px' }}>Thêm bé ngay</button>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                            {pets.map((pet, idx) => (
                                <div key={idx} className="glass-card" style={{ background: 'var(--surface)', padding: '24px', borderRadius: '24px', border: '1px solid var(--gray-200)', display: 'flex', alignItems: 'center', gap: '20px', transition: 'all 0.3s', boxShadow: 'var(--shadow-sm)' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                                    <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: pet.giong_loai === 'Mèo' ? '#fef08a' : '#bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: pet.giong_loai === 'Mèo' ? '#b45309' : '#1d4ed8' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: '40px' }}>pets</span>
                                    </div>
                                    <div>
                                        <h3 style={{ margin: '0 0 4px 0', fontSize: '1.4rem', fontWeight: 900, color: 'var(--ink)' }}>{pet.ten_thu_cung}</h3>
                                        <div style={{ display: 'flex', gap: '12px', fontSize: '0.85rem', color: 'var(--gray-500)', fontWeight: 600 }}>
                                            <span>{pet.giong_loai}</span> • <span>{pet.tuoi} tuổi</span> • <span>{pet.can_nang} kg</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* Modal Thêm Thú Cưng */}
            {showModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div style={{ background: 'var(--surface)', padding: '40px', borderRadius: '32px', width: '100%', maxWidth: '450px', boxShadow: 'var(--shadow-2xl)', animation: 'slideUp 0.3s ease' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900, color: 'var(--ink)' }}>Khai báo Thú Cưng</h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-500)' }}><span className="material-symbols-outlined">close</span></button>
                        </div>
                        <form onSubmit={handleAddPet} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: 'var(--ink)' }}>Tên gọi ở nhà *</label>
                                <input required value={tenThuCung} onChange={e => setTenThuCung(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--gray-300)', outline: 'none', background: 'var(--background)', color: 'var(--ink)' }} placeholder="VD: Mực, Bông..." />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: 'var(--ink)' }}>Giống loài *</label>
                                <select value={giongLoai} onChange={e => setGiongLoai(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--gray-300)', outline: 'none', background: 'var(--background)', color: 'var(--ink)' }}>
                                    <option value="Chó">Chó</option><option value="Mèo">Mèo</option><option value="Khác">Khác</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: 'var(--ink)' }}>Tuổi (Năm)</label>
                                    <input type="number" min="0" value={tuoi} onChange={e => setTuoi(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--gray-300)', outline: 'none', background: 'var(--background)', color: 'var(--ink)' }} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ display: 'block', fontWeight: 700, marginBottom: '8px', color: 'var(--ink)' }}>Cân nặng (Kg)</label>
                                    <input type="number" step="0.1" min="0" value={canNang} onChange={e => setCanNang(e.target.value)} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--gray-300)', outline: 'none', background: 'var(--background)', color: 'var(--ink)' }} />
                                </div>
                            </div>
                            <button disabled={isSubmitting} type="submit" className="btn btn-primary" style={{ padding: '16px', borderRadius: '50px', fontSize: '1rem', marginTop: '16px' }}>{isSubmitting ? 'ĐANG LƯU...' : 'HOÀN TẤT'}</button>
                        </form>
                    </div>
                </div>
            )}
            <Footer />
        </div>
    );
};

export default DashboardKhachHang;