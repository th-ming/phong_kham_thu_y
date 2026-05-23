import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MemeCat, ScrollToTop, RevealSection } from "@components/SpecialEffects";
import axiosInstance from "@services/axios";
import { useTheme } from "../contexts/ThemeContextV2";

interface DoctorData {
    id_nhan_vien: number | string;
    ho_ten: string;
    chuyen_mon: string;
    hinh_anh: string;
    gioi_thieu: string;
    ngay_vao_lam: string;
}

const FALLBACK_DOCTORS: DoctorData[] = [
    {
        id_nhan_vien: "fallback-ma",
        ho_ten: "BS. Minh Anh",
        chuyen_mon: "Nội khoa & Bệnh truyền nhiễm",
        hinh_anh: "/img/bac_si_minh_anh.png",
        gioi_thieu: "Chuyên gia về bệnh truyền nhiễm và nội khoa thú y.",
        ngay_vao_lam: "2021-01-01",
    },
    {
        id_nhan_vien: "fallback-kl",
        ho_ten: "BS. Khánh Linh",
        chuyen_mon: "Phẫu thuật tổng quát",
        hinh_anh: "/img/bac_si_khanh_linh.png",
        gioi_thieu: "Tận tâm trong phẫu thuật và chăm sóc hồi phục sau mổ.",
        ngay_vao_lam: "2020-01-01",
    },
    {
        id_nhan_vien: "fallback-tt",
        ho_ten: "BS. Thu Thủy",
        chuyen_mon: "Dinh dưỡng & Nội tiết",
        hinh_anh: "/img/bac_si_thu_thuy.png",
        gioi_thieu: "Tư vấn dinh dưỡng và điều trị các bệnh nội tiết phức tạp.",
        ngay_vao_lam: "2022-01-01",
    },
];

const BacSi: React.FC = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [doctors, setDoctors] = useState<DoctorData[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);

    useEffect(() => {


        const fetchDoctors = async (showLoading = true) => {
            if (showLoading) setLoading(true);
            try {
                const res = await axiosInstance.get("/api/bac-si");
                const nextDoctors = Array.isArray(res.data) ? res.data : [];
                setDoctors(nextDoctors);
                setLoadError(false);
            } catch (err) {
                console.error("Lỗi lấy danh sách bác sĩ:", err);
                setLoadError(true);
                setDoctors((current) => current.length > 0 ? current : FALLBACK_DOCTORS);
            } finally {
                if (showLoading) setLoading(false);
            }
        };

        fetchDoctors(true);

        // Smart Polling: Lấy danh sách bác sĩ ngầm mỗi 10 giây. Không reload trang, tự động hiển thị bác sĩ mới cực êm!
        const interval = setInterval(() => {
            fetchDoctors(false);
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    const calculateExp = (dateStr: string) => {
        if (!dateStr) return "Chuyên gia giàu kinh nghiệm";
        const start = new Date(dateStr);
        const now = new Date();
        const years = now.getFullYear() - start.getFullYear();
        if (isNaN(years)) return "Chuyên gia giàu kinh nghiệm"; // Fix: Tránh lỗi NaN khi ngày tháng bị sai định dạng
        return `${years > 0 ? years : 1} năm kinh nghiệm`;
    };

    return (
        <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
            <section style={{ padding: '100px 0 80px', background: isDark ? 'var(--secondary-gradient)' : 'var(--primary-gradient)', color: 'white', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: isDark ? 0.05 : 0.1, backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
                <div style={{ position: 'absolute', top: '-50%', left: '-10%', width: '500px', height: '500px', background: 'radial-gradient(circle, rgba(13, 148, 136, 0.25) 0%, transparent 70%)', borderRadius: '50%' }}></div>
                <div style={{ position: 'absolute', bottom: '-40%', right: '-10%', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(34, 211, 238, 0.15) 0%, transparent 70%)', borderRadius: '50%' }}></div>
                <div className="container" style={{ position: 'relative', zIndex: 1 }}>
                    <RevealSection>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.1)', padding: '8px 20px', borderRadius: '50px', fontSize: '0.85rem', fontWeight: 900, marginBottom: '24px', border: '1px solid rgba(255,255,255,0.1)', letterSpacing: '1px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#2dd4bf' }}>medical_information</span>
                            ĐỘI NGŨ CHUYÊN GIA
                        </div>
                        <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 950, marginBottom: "24px", letterSpacing: "-1px" }}>
                            Bác Sĩ <span style={{ color: "#2dd4bf" }}>Thú Y Rexi</span>
                        </h1>
                        <p style={{ fontSize: "1.15rem", maxWidth: "650px", margin: "0 auto", lineHeight: 1.6, fontWeight: 500, color: '#cbd5e1' }}>
                            Đội ngũ y bác sĩ chuyên nghiệp, tận tâm, luôn sẵn sàng chăm sóc tốt nhất cho thú cưng của bạn.
                        </p>
                    </RevealSection>
                </div>
            </section>

            <main style={{ padding: '60px 0 120px' }}>
                <div className="container">
                    {/* BREADCRUMB */}
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', color: 'var(--gray-400)', fontSize: '0.85rem', marginBottom: '60px', fontWeight: 700, letterSpacing: '1px' }}>
                        <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>TRANG CHỦ</Link>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
                        <span style={{ color: '#0f9d8a' }}>BÁC SĨ</span>
                    </div>

                    {loadError && (
                        <div style={{ background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.28)', color: 'var(--ink)', borderRadius: '20px', padding: '16px 20px', marginBottom: '28px', fontWeight: 700, lineHeight: 1.5 }}>
                            Danh sách đang hiển thị thông tin tham khảo vì hệ thống chưa tải được dữ liệu mới nhất. Vui lòng liên hệ hotline để xác nhận lịch làm việc của bác sĩ.
                        </div>
                    )}

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '100px' }}>
                            <div className="dot-pulse" style={{ margin: '0 auto' }}></div>
                        </div>
                    ) : doctors.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px', background: 'var(--surface)', border: '1px solid var(--gray-200)', borderRadius: '32px' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '48px', color: 'var(--gray-300)', marginBottom: '16px' }}>person_off</span>
                            <p style={{ fontWeight: 700, color: 'var(--gray-400)' }}>Hiện chưa có danh sách bác sĩ. Vui lòng quay lại sau.</p>
                        </div>
                    ) : (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: "40px" }}>
                            {doctors.map((d) => (
                                <div key={d.id_nhan_vien} className="doctor-card" style={{ borderRadius: "32px", overflow: "hidden", border: '1px solid var(--gray-200)', background: 'var(--surface)', position: 'relative', transition: 'all 0.4s ease', boxShadow: 'var(--shadow-md)' }}>
                                    <div style={{ height: "360px", overflow: 'hidden', position: 'relative', backgroundColor: 'var(--gray-50)' }}>
                                        {/* hình ảnh mặc định avatar nếu bác sĩ chưa có ảnh */}
                                        <img
                                            src={d.hinh_anh?.trim() || "/img/avtpkty.png"}
                                            alt={d.ho_ten}
                                            style={{ width: "100%", height: "100%", objectFit: d.hinh_anh?.trim() ? "cover" : "contain", padding: d.hinh_anh?.trim() ? '0' : '40px' }}
                                        />
                                        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '40px 24px 20px', background: 'linear-gradient(to top, rgba(15,23,42,0.85), transparent)', color: 'white' }}>
                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.65rem', fontWeight: 900, border: '1px solid rgba(255,255,255,0.1)' }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#4ade80' }}>verified</span>
                                                BÁC SĨ CHUYÊN KHOA
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ padding: "32px 24px" }}>
                                        <h3 style={{ fontSize: "1.6rem", fontWeight: 950, marginBottom: "8px", color: 'var(--ink)' }}>{d.ho_ten}</h3>
                                        <p style={{ color: "#0f9d8a", fontWeight: 900, fontSize: "1rem", marginBottom: "16px" }}>{d.chuyen_mon || "Bác sĩ thú y"}</p>
                                        <p style={{ color: "var(--gray-500)", fontSize: "0.95rem", lineHeight: 1.6, marginBottom: "24px", fontWeight: 500 }}>{d.gioi_thieu || "Đang cập nhật giới thiệu..."}</p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: "var(--gray-400)", fontSize: "0.85rem", fontWeight: 800, padding: '16px 0 0', borderTop: '1px dashed var(--gray-200)' }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>history</span>
                                            {calculateExp(d.ngay_vao_lam)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            <ScrollToTop />
            <MemeCat />
        </div>
    );
};

export default React.memo(BacSi);
