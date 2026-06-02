import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { MemeCat, RevealSection, ScrollToTop } from "@components/SpecialEffects";
import axiosInstance from "@services/axios";
import { useAutoRefresh } from "@hooks/useAutoRefresh";
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
    const isDark = theme === "dark";
    const [doctors, setDoctors] = useState<DoctorData[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    const fetchDoctors = useCallback(async () => {
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
            setLoading(false);
        }
    }, []);

    useAutoRefresh(fetchDoctors);

    const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches;
    const doctorsPerPage = isMobile ? 14 : 15;
    const totalPages = Math.max(1, Math.ceil(doctors.length / doctorsPerPage));
    const pagedDoctors = useMemo(() => {
        const start = (currentPage - 1) * doctorsPerPage;
        return doctors.slice(start, start + doctorsPerPage);
    }, [currentPage, doctors, doctorsPerPage]);

    useEffect(() => {
        if (currentPage > totalPages) setCurrentPage(totalPages);
    }, [currentPage, totalPages]);

    const paginationItems = useMemo(() => {
        if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
        const items: Array<number | "..."> = [1];
        const start = Math.max(2, currentPage - 1);
        const end = Math.min(totalPages - 1, currentPage + 1);
        if (start > 2) items.push("...");
        for (let page = start; page <= end; page += 1) items.push(page);
        if (end < totalPages - 1) items.push("...");
        items.push(totalPages);
        return items;
    }, [currentPage, totalPages]);

    const calculateExp = (dateStr: string) => {
        if (!dateStr) return "Chuyên gia giàu kinh nghiệm";
        const start = new Date(dateStr);
        const now = new Date();
        const years = now.getFullYear() - start.getFullYear();
        if (isNaN(years)) return "Chuyên gia giàu kinh nghiệm";
        return `${years > 0 ? years : 1} năm kinh nghiệm`;
    };

    return (
        <div style={{ background: "var(--background)", minHeight: "100vh" }}>
            <style>{`
                .doctors-page-grid {
                    display: grid;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 28px;
                }
                .doctor-card {
                    border-radius: 28px;
                    overflow: hidden;
                    border: 1px solid var(--gray-200);
                    background: var(--surface);
                    position: relative;
                    transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
                    box-shadow: var(--shadow-md);
                }
                .doctor-card:hover {
                    transform: translateY(-6px);
                    border-color: var(--primary);
                    box-shadow: var(--shadow-xl);
                }
                .doctor-card-image {
                    height: 300px;
                    overflow: hidden;
                    position: relative;
                    background-color: var(--gray-50);
                }
                .doctor-card-image img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .doctor-card-overlay {
                    position: absolute;
                    inset: auto 0 0;
                    padding: 34px 20px 18px;
                    background: linear-gradient(to top, rgba(15,23,42,0.85), transparent);
                    color: white;
                }
                .doctor-card-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    background: rgba(255,255,255,0.15);
                    backdrop-filter: blur(8px);
                    padding: 6px 12px;
                    border-radius: 20px;
                    font-size: 0.65rem;
                    font-weight: 900;
                    border: 1px solid rgba(255,255,255,0.1);
                }
                .doctor-card-body {
                    padding: 24px 20px;
                }
                .doctor-card-body h3 {
                    font-size: 1.35rem;
                    font-weight: 950;
                    margin-bottom: 8px;
                    color: var(--ink);
                }
                .doctor-card-specialty {
                    color: var(--primary);
                    font-weight: 900;
                    font-size: 0.92rem;
                    margin-bottom: 12px;
                }
                .doctor-card-intro {
                    color: var(--gray-500);
                    font-size: 0.88rem;
                    line-height: 1.55;
                    margin-bottom: 18px;
                    font-weight: 500;
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                .doctor-card-exp {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: var(--gray-400);
                    font-size: 0.8rem;
                    font-weight: 800;
                    padding-top: 14px;
                    border-top: 1px dashed var(--gray-200);
                }
                .doctors-pagination {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 8px;
                    margin-top: 36px;
                    flex-wrap: wrap;
                }
                .doctors-page-btn {
                    min-width: 40px;
                    height: 40px;
                    border-radius: 12px;
                    border: 1px solid var(--gray-200);
                    background: var(--surface);
                    color: var(--ink);
                    font-weight: 850;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.2s ease, border-color 0.2s ease, background 0.2s ease;
                }
                .doctors-page-btn:hover {
                    transform: translateY(-2px);
                    border-color: var(--primary);
                }
                .doctors-page-btn.active {
                    background: var(--primary-gradient);
                    color: white;
                    border-color: transparent;
                    box-shadow: 0 10px 24px var(--primary-shadow);
                }
                .doctors-page-btn:disabled {
                    cursor: not-allowed;
                    opacity: 0.45;
                    transform: none;
                }
                .doctors-page-ellipsis {
                    min-width: 28px;
                    color: var(--gray-400);
                    font-weight: 900;
                    text-align: center;
                }
                @media (max-width: 768px) {
                    .doctors-hero {
                        padding: 76px 0 50px !important;
                    }
                    .doctors-hero h1 {
                        font-size: 2rem !important;
                        line-height: 1.14 !important;
                    }
                    .doctors-hero p {
                        font-size: 0.92rem !important;
                    }
                    .doctors-main {
                        padding: 34px 0 96px !important;
                    }
                    .doctors-breadcrumb {
                        margin-bottom: 28px !important;
                    }
                    .doctors-page-grid {
                        grid-template-columns: repeat(2, minmax(0, 1fr));
                        gap: 12px;
                    }
                    .doctor-card {
                        border-radius: 18px;
                    }
                    .doctor-card-image {
                        height: 176px;
                    }
                    .doctor-card-badge {
                        padding: 5px 8px;
                        font-size: 0.56rem;
                    }
                    .doctor-card-body {
                        padding: 13px 12px 14px;
                    }
                    .doctor-card-body h3 {
                        font-size: 0.92rem;
                        line-height: 1.25;
                        margin-bottom: 5px;
                    }
                    .doctor-card-specialty {
                        font-size: 0.7rem;
                        line-height: 1.3;
                        margin-bottom: 8px;
                        display: -webkit-box;
                        -webkit-line-clamp: 2;
                        -webkit-box-orient: vertical;
                        overflow: hidden;
                    }
                    .doctor-card-intro {
                        display: none;
                    }
                    .doctor-card-exp {
                        font-size: 0.66rem;
                        padding-top: 8px;
                    }
                    .doctors-pagination {
                        margin-top: 24px;
                        gap: 6px;
                    }
                    .doctors-page-btn {
                        min-width: 36px;
                        height: 36px;
                        border-radius: 10px;
                        font-size: 0.82rem;
                    }
                }
            `}</style>

            <section className="doctors-hero" style={{ padding: "100px 0 80px", background: isDark ? "var(--secondary-gradient)" : "var(--primary-gradient)", color: "white", textAlign: "center", position: "relative", overflow: "hidden" }}>
                <div style={{ position: "absolute", inset: 0, opacity: isDark ? 0.05 : 0.1, backgroundImage: "radial-gradient(#ffffff 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
                <div style={{ position: "absolute", top: "-50%", left: "-10%", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(13, 148, 136, 0.25) 0%, transparent 70%)", borderRadius: "50%" }} />
                <div style={{ position: "absolute", bottom: "-40%", right: "-10%", width: "600px", height: "600px", background: "radial-gradient(circle, rgba(34, 211, 238, 0.15) 0%, transparent 70%)", borderRadius: "50%" }} />
                <div className="container" style={{ position: "relative", zIndex: 1 }}>
                    <RevealSection>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.1)", padding: "8px 20px", borderRadius: "50px", fontSize: "0.85rem", fontWeight: 900, marginBottom: "24px", border: "1px solid rgba(255,255,255,0.1)", letterSpacing: "1px" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "#2dd4bf" }}>medical_information</span>
                            ĐỘI NGŨ CHUYÊN GIA
                        </div>
                        <h1 style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", fontWeight: 950, marginBottom: "24px", letterSpacing: "-1px" }}>
                            Bác Sĩ <span style={{ color: "#2dd4bf" }}>Thú Y Rexi</span>
                        </h1>
                        <p style={{ fontSize: "1.15rem", maxWidth: "650px", margin: "0 auto", lineHeight: 1.6, fontWeight: 500, color: "#cbd5e1" }}>
                            Đội ngũ y bác sĩ chuyên nghiệp, tận tâm, luôn sẵn sàng chăm sóc tốt nhất cho thú cưng của bạn.
                        </p>
                    </RevealSection>
                </div>
            </section>

            <main className="doctors-main" style={{ padding: "60px 0 120px" }}>
                <div className="container">
                    <div className="doctors-breadcrumb" style={{ display: "flex", gap: "12px", alignItems: "center", color: "var(--gray-400)", fontSize: "0.85rem", marginBottom: "60px", fontWeight: 700, letterSpacing: "1px" }}>
                        <Link to="/" style={{ color: "inherit", textDecoration: "none" }}>TRANG CHỦ</Link>
                        <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>chevron_right</span>
                        <span style={{ color: "var(--primary)" }}>BÁC SĨ</span>
                    </div>

                    {loadError && (
                        <div style={{ background: "rgba(245, 158, 11, 0.12)", border: "1px solid rgba(245, 158, 11, 0.28)", color: "var(--ink)", borderRadius: "20px", padding: "16px 20px", marginBottom: "28px", fontWeight: 700, lineHeight: 1.5 }}>
                            Danh sách đang hiển thị thông tin tham khảo vì hệ thống chưa tải được dữ liệu mới nhất. Vui lòng liên hệ hotline để xác nhận lịch làm việc của bác sĩ.
                        </div>
                    )}

                    {loading ? (
                        <div style={{ textAlign: "center", padding: "100px" }}>
                            <div className="dot-pulse" style={{ margin: "0 auto" }} />
                        </div>
                    ) : doctors.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "60px", background: "var(--surface)", border: "1px solid var(--gray-200)", borderRadius: "32px" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: "48px", color: "var(--gray-300)", marginBottom: "16px" }}>person_off</span>
                            <p style={{ fontWeight: 700, color: "var(--gray-400)" }}>Hiện chưa có danh sách bác sĩ. Vui lòng quay lại sau.</p>
                        </div>
                    ) : (
                        <>
                            <div className="doctors-page-grid">
                                {pagedDoctors.map((d) => (
                                    <div key={d.id_nhan_vien} className="doctor-card">
                                        <div className="doctor-card-image">
                                            <img src={d.hinh_anh?.trim() || "/img/avtpkty.png"} alt={d.ho_ten} style={{ objectFit: d.hinh_anh?.trim() ? "cover" : "contain", padding: d.hinh_anh?.trim() ? 0 : "32px" }} />
                                            <div className="doctor-card-overlay">
                                                <div className="doctor-card-badge">
                                                    <span className="material-symbols-outlined" style={{ fontSize: "16px", color: "#4ade80" }}>verified</span>
                                                    BÁC SĨ CHUYÊN KHOA
                                                </div>
                                            </div>
                                        </div>
                                        <div className="doctor-card-body">
                                            <h3>{d.ho_ten}</h3>
                                            <p className="doctor-card-specialty">{d.chuyen_mon || "Bác sĩ thú y"}</p>
                                            <p className="doctor-card-intro">{d.gioi_thieu || "Đang cập nhật giới thiệu..."}</p>
                                            <div className="doctor-card-exp">
                                                <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>history</span>
                                                {calculateExp(d.ngay_vao_lam)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {totalPages > 1 && (
                                <div className="doctors-pagination" aria-label="Phân trang bác sĩ">
                                    <button className="doctors-page-btn" type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
                                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>chevron_left</span>
                                    </button>
                                    {paginationItems.map((item, idx) => item === "..." ? (
                                        <span key={`ellipsis-${idx}`} className="doctors-page-ellipsis">...</span>
                                    ) : (
                                        <button key={item} className={`doctors-page-btn ${item === currentPage ? "active" : ""}`} type="button" onClick={() => setCurrentPage(item)}>
                                            {item}
                                        </button>
                                    ))}
                                    <button className="doctors-page-btn" type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}>
                                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>chevron_right</span>
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </main>

            <ScrollToTop />
            <MemeCat />
        </div>
    );
};

export default React.memo(BacSi);
