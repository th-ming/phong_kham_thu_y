import React, { useCallback, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MemeCat, ScrollToTop } from "@components/SpecialEffects";
import axiosInstance from "@services/axios";
import { formatTienVND, generateSlug, getUserProfile, normalizeUserRole } from "@utils/index";
import { toast } from "@components/Toast";
import { useAutoRefresh } from "@hooks/useAutoRefresh";
import Loi404 from "@pages/Loi404";

interface ServiceData {
  id_dich_vu: number;
  ten_dich_vu: string;
  mo_ta: string;
  gia: number;
  thoi_luong_phut: number;
  trang_thai: boolean;
}

const ChiTietDichVu: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [service, setService] = useState<ServiceData | null>(null);
  const [loading, setLoading] = useState(true);

  const handleBookingClick = () => {
    const user = getUserProfile();
    if (user) {
      if (normalizeUserRole(user) !== "khach_hang") {
        toast.info("Bạn đang đăng nhập với tài khoản nhân sự. Hệ thống đang chuyển hướng bạn đến Trang quản lý lịch hẹn nội bộ!");
        navigate("/quan-ly/lich-hen");
        return;
      }
    }
    navigate('/khach-hang/dat-lich-hen');
  };

  const fetchService = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/api/dich-vu');
      const data: any[] = response.data || [];

      const found = data.find(s =>
        String(s.id_dich_vu) === slug ||
        generateSlug(s.ten_dich_vu) === slug
      );
      setService(found || null);
    } catch (error) {
      console.error("Lỗi lấy chi tiết dịch vụ:", error);
      setService(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useAutoRefresh(fetchService);

  // Dữ liệu hình ảnh và icon dự phòng để trang web luôn đẹp
  const getServiceAssets = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("khám")) return { icon: "stethoscope", img: "/img/kham_da_khoa.png" };
    if (lower.includes("tiêm") || lower.includes("vắc")) return { icon: "vaccines", img: "/img/tiem_chung.png" };
    if (lower.includes("giun")) return { icon: "medication", img: "/img/tay_giun.png" };
    if (lower.includes("triệt sản") || lower.includes("triệt") || lower.includes("thiến")) return { icon: "medical_services", img: "/img/triet_san.png" };
    if (lower.includes("x-quang") || lower.includes("siêu âm")) return { icon: "biotech", img: "/img/chan_doan_hinh_anh.png" };
    if (lower.includes("phẫu thuật") || lower.includes("mổ")) return { icon: "surgical", img: "/img/phau_thuat.png" };
    if (lower.includes("nội trú") || lower.includes("lưu trú")) return { icon: "hotel", img: "/img/noi_tru.png" };
    if (lower.includes("răng") || lower.includes("nha khoa")) return { icon: "dentistry", img: "/img/nho_rang_nha_khoa.png" };
    if (lower.includes("spa") || lower.includes("tắm") || lower.includes("tỉa")) return { icon: "spa", img: "/img/spa_grooming.png" };
    if (lower.includes("xét nghiệm") || lower.includes("sinh hóa")) return { icon: "science", img: "/img/xet_nghiem_sinh_hoa.png" };
    return { icon: "medical_services", img: "/img/avtpkty.png" };
  };

  if (loading) {
    return (
      <div style={{ background: 'var(--background)', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="dot-pulse"></div>
      </div>
    );
  }

  if (!service) {
    return <Loi404 />;
  }

  const assets = getServiceAssets(service.ten_dich_vu);

  return (
    <div className="service-detail-page" style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <style>{`
        .service-detail-crumb a:hover { color: var(--primary) !important; }
        .service-detail-hero-img { transition: transform 0.45s ease; }
        .service-detail-image-wrap:hover .service-detail-hero-img { transform: scale(1.025); }
        .service-detail-step { transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease; }
        .service-detail-step:hover { transform: translateX(10px); border-color: var(--primary) !important; box-shadow: var(--shadow-md) !important; }
        @media (max-width: 768px) {
          .service-detail-page #chatBtn,
          .service-detail-page .scroll-to-top-glass {
            bottom: calc(88px + env(safe-area-inset-bottom, 0px)) !important;
          }
          .service-detail-main {
            padding: 28px 0 96px !important;
          }
          .service-detail-page .container {
            padding-left: 18px !important;
            padding-right: 18px !important;
          }
          .service-detail-crumb {
            margin-bottom: 20px !important;
            overflow-x: auto;
            white-space: nowrap;
            scrollbar-width: none;
            font-size: 0.68rem !important;
            letter-spacing: 0.5px !important;
          }
          .service-detail-crumb::-webkit-scrollbar { display: none; }
          .service-detail-layout {
            display: block !important;
          }
          .service-detail-content {
            display: grid;
          }
          .service-detail-image-wrap {
            order: 1;
            margin-bottom: 18px !important;
            border-radius: 24px !important;
            box-shadow: var(--shadow-lg) !important;
            aspect-ratio: 16 / 11;
          }
          .service-detail-image-wrap img {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover;
          }
          .service-detail-icon {
            order: 2;
            width: 52px !important;
            height: 52px !important;
            border-radius: 16px !important;
            margin-bottom: 14px !important;
          }
          .service-detail-icon span {
            font-size: 28px !important;
          }
          .service-detail-title {
            order: 3;
            font-size: 2rem !important;
            line-height: 1.12 !important;
            letter-spacing: 0 !important;
            margin-bottom: 14px !important;
          }
          .service-detail-description {
            order: 4;
            font-size: 0.9rem !important;
            line-height: 1.62 !important;
            margin-bottom: 26px !important;
          }
          .service-detail-process {
            order: 5;
            margin-top: 0 !important;
            padding-top: 28px !important;
          }
          .service-detail-process h3,
          .service-detail-commitment h3 {
            font-size: 1.35rem !important;
            line-height: 1.2 !important;
            margin-bottom: 18px !important;
          }
          .service-detail-steps {
            gap: 0 !important;
            position: relative;
            padding-left: 16px;
          }
          .service-detail-steps::before {
            content: "";
            position: absolute;
            left: 27px;
            top: 10px;
            bottom: 10px;
            width: 2px;
            border-radius: 999px;
            background: linear-gradient(180deg, var(--primary), color-mix(in srgb, var(--primary) 16%, transparent));
          }
          .service-detail-step {
            position: relative;
            gap: 12px !important;
            padding: 10px 0 10px 0 !important;
            border: 0 !important;
            box-shadow: none !important;
            background: transparent !important;
          }
          .service-detail-step:hover,
          .service-detail-step:active {
            transform: translateY(-2px);
          }
          .service-detail-step-number {
            width: 24px !important;
            height: 24px !important;
            border-radius: 999px !important;
            font-size: 0.68rem !important;
            border: 3px solid var(--background);
            z-index: 1;
          }
          .service-detail-step-copy {
            padding: 13px 14px;
            border-radius: 16px;
            background: var(--surface);
            border: 1px solid var(--gray-200);
            box-shadow: var(--shadow-sm);
          }
          .service-detail-step-copy h4 {
            font-size: 0.9rem !important;
            margin-bottom: 5px !important;
          }
          .service-detail-step-copy p {
            font-size: 0.76rem !important;
            line-height: 1.45 !important;
          }
          .service-detail-commitment {
            padding: 20px !important;
            border-radius: 22px !important;
            margin-top: 32px !important;
          }
          .service-detail-commitment li {
            font-size: 0.82rem !important;
            line-height: 1.5 !important;
          }
          .service-detail-sidebar {
            position: fixed !important;
            left: 12px;
            right: 12px;
            bottom: 12px;
            top: auto !important;
            z-index: 900;
          }
          .service-booking-card {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 12px;
            align-items: center;
            padding: 12px !important;
            border-radius: 22px !important;
            box-shadow: 0 16px 42px rgba(15, 23, 42, 0.16) !important;
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
          }
          .service-booking-card::before {
            content: "";
            position: absolute;
            inset: 0;
            border-radius: inherit;
            pointer-events: none;
            background: linear-gradient(135deg, color-mix(in srgb, var(--primary) 10%, transparent), transparent 58%);
          }
          .service-price-block {
            margin-bottom: 0 !important;
            min-width: 0;
          }
          .service-price-block p {
            font-size: 0.58rem !important;
            margin-bottom: 4px !important;
          }
          .service-price-value {
            font-size: 1.18rem !important;
            letter-spacing: 0 !important;
            white-space: nowrap;
          }
          .service-duration-block {
            display: none !important;
          }
          .service-booking-card button {
            width: auto !important;
            min-width: 132px;
            padding: 13px 16px !important;
            border-radius: 16px !important;
            font-size: 0.78rem !important;
            white-space: nowrap;
          }
        }
      `}</style>
      <main className="service-detail-main" style={{ padding: '80px 0 120px' }}>
        <div className="container">
          <div className="service-detail-crumb" style={{ display: 'flex', gap: '12px', alignItems: 'center', color: 'var(--gray-400)', fontSize: '0.85rem', marginBottom: '60px', fontWeight: 700, letterSpacing: '1px' }}>
            <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>TRANG CHỦ</Link>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
            <span style={{ color: 'var(--primary)' }}>{service.ten_dich_vu.toUpperCase()}</span>
          </div>

          <div className="service-detail-layout" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '80px', alignItems: 'start' }}>
            <div className="animate-fade-in service-detail-content">
              <div className="service-detail-image-wrap" style={{ position: 'relative', marginBottom: '56px', borderRadius: '40px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.2)' }}>
                <img
                  src={assets.img}
                  alt={service.ten_dich_vu}
                  className="service-detail-hero-img"
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              </div>

              <div className="service-detail-icon" style={{ background: 'var(--primary-light)', color: 'var(--primary)', width: '80px', height: '80px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '40px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '40px' }}>{assets.icon}</span>
              </div>
              <h1 className="service-detail-title" style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 950, color: 'var(--ink)', letterSpacing: '-2px', lineHeight: 1.1, marginBottom: '32px' }}>
                {service.ten_dich_vu}
              </h1>

              <p className="service-detail-description" style={{ fontSize: '1.25rem', color: 'var(--gray-500)', fontWeight: 600, lineHeight: 1.7, marginBottom: '56px' }}>{service.mo_ta || "Dịch vụ chăm sóc thú cưng chuyên nghiệp tại hệ thống phòng khám Rexi Vet."}</p>

              <div className="service-detail-process" style={{ borderTop: '1px solid var(--gray-200)', paddingTop: '56px', marginTop: '56px' }}>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '32px', color: 'var(--ink)' }}>Quy trình chuẩn y khoa</h3>
                <div className="service-detail-steps" style={{ display: 'grid', gap: '24px' }}>
                  {[
                    { step: '01', title: 'Khám lâm sàng & Tư vấn', desc: 'Bác sĩ kiểm tra tổng quát, đánh giá tình trạng hiện tại và tư vấn phác đồ phù hợp nhất cho bé.' },
                    { step: '02', title: 'Tiến hành dịch vụ', desc: 'Thực hiện dịch vụ trong môi trường vô trùng, an toàn với trang thiết bị hiện đại nhất.' },
                    { step: '03', title: 'Theo dõi & Chăm sóc', desc: 'Bé được theo dõi sát sao phản ứng sau khi thực hiện dịch vụ để đảm bảo sức khỏe ổn định.' },
                    { step: '04', title: 'Hướng dẫn tại nhà', desc: 'Bác sĩ tư vấn chế độ dinh dưỡng và cách chăm sóc tại nhà để bé mau chóng hồi phục.' }
                  ].map((s, i) => (
                    <div key={i} className="service-detail-step" style={{ display: 'flex', gap: '20px', background: 'var(--surface)', padding: '24px', borderRadius: '24px', border: '1px solid var(--gray-200)', boxShadow: 'var(--shadow-sm)', cursor: 'default' }}>
                      <div className="service-detail-step-number" style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.2rem', flexShrink: 0 }}>
                        {s.step}
                      </div>
                      <div className="service-detail-step-copy">
                        <h4 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--ink)', marginBottom: '8px' }}>{s.title}</h4>
                        <p style={{ margin: 0, color: 'var(--gray-500)', lineHeight: 1.6, fontWeight: 500 }}>{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="service-detail-commitment" style={{ background: 'linear-gradient(135deg, rgba(15, 157, 138, 0.08) 0%, rgba(45, 212, 191, 0.03) 100%)', padding: '40px', borderRadius: '32px', marginTop: '56px', border: '1px solid rgba(15, 157, 138, 0.15)' }}>
                <h3 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--ink)', marginBottom: '24px' }}>Cam kết từ Rexi</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: '16px' }}>
                  {['Sử dụng 100% thuốc và thiết bị y tế nhập khẩu chính hãng.', 'Đội ngũ bác sĩ thú y giàu kinh nghiệm, tận tâm.', 'Minh bạch chi phí, không phát sinh ngoài phác đồ đã tư vấn.', 'Hỗ trợ tư vấn trực tuyến 24/7 sau khi sử dụng dịch vụ.'].map((item, i) => (
                    <li key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', color: 'var(--gray-600)', fontWeight: 600, lineHeight: 1.6, fontSize: '1.05rem' }}>
                      <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '22px', marginTop: '2px' }}>verified</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="service-detail-sidebar" style={{ position: 'sticky', top: '140px' }}>
              <div className="glass-card service-booking-card" style={{ padding: '40px', borderRadius: '40px', overflow: 'hidden', position: 'relative', background: 'var(--surface)', border: '1px solid var(--gray-200)' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '8px', background: 'var(--primary-gradient)' }}></div>

                <div className="service-price-block" style={{ marginBottom: '32px' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)', letterSpacing: '1px', marginBottom: '12px' }}>CHI PHÍ TỪ</p>
                  <div className="service-price-value" style={{ fontSize: '2.5rem', fontWeight: 950, color: 'var(--ink)', letterSpacing: '-1px' }}>{formatTienVND(service.gia)}</div>
                </div>

                <div className="service-duration-block" style={{ marginBottom: '48px', display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', background: 'var(--gray-50)', borderRadius: '24px' }}>
                  <div style={{ width: '48px', height: '48px', background: 'var(--surface)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', boxShadow: 'var(--shadow-sm)' }}>
                    <span className="material-symbols-outlined">schedule</span>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 800, color: 'var(--gray-400)' }}>THỜI GIAN DỰ KIẾN</p>
                    <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--ink)' }}>{service.thoi_luong_phut || 30} phút</p>
                  </div>
                </div>

                <button data-ai-id="button-chitietdichvu-wowy" className="btn btn-primary btn-pill" style={{ width: '100%', padding: '24px', fontSize: '1.1rem' }} onClick={handleBookingClick}>
                  ĐẶT LỊCH NGAY
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <ScrollToTop />
      <MemeCat />
    </div>
  );
};

export default React.memo(ChiTietDichVu);
