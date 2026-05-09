import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Header from "@components/Header";
import Footer from "@components/Footer";
import { ChatBot } from "@components/ChatBot";
import { MemeCat, ScrollToTop } from "@components/SpecialEffects";
import axiosInstance from "@services/axios";
import { formatTienVND, generateSlug } from "@utils/index";

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
  const [service, setService] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchService = async () => {
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
    };
    fetchService();
  }, [slug]);

  // Dữ liệu hình ảnh và icon dự phòng để trang web luôn đẹp
  const getServiceAssets = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("khám")) return { icon: "stethoscope", img: "/img/kham_da_khoa.png" };
    if (lower.includes("tiêm") || lower.includes("vắc")) return { icon: "vaccines", img: "/img/tiem_chung.png" };
    if (lower.includes("x-quang") || lower.includes("siêu âm")) return { icon: "biotech", img: "/img/chan_doan_hinh_anh.png" };
    if (lower.includes("phẫu thuật") || lower.includes("mổ")) return { icon: "surgical", img: "/img/phau_thuat.png" };
    if (lower.includes("nội trú") || lower.includes("lưu trú")) return { icon: "hotel", img: "/img/noi_tru.png" };
    if (lower.includes("spa") || lower.includes("tắm") || lower.includes("tỉa")) return { icon: "spa", img: "/img/spa_grooming.png" };
    if (lower.includes("xét nghiệm") || lower.includes("sinh hóa")) return { icon: "science", img: "/img/xet_nghiem_sinh_hoa.png" };
    // hình ảnh mặc định avatar dành cho dịch vụ khác
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
    return (
      <div style={{ padding: '150px 20px', textAlign: 'center', background: 'var(--background)', minHeight: '100vh' }}>
        <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--ink)', marginBottom: '24px' }}>Dịch vụ không tồn tại</h2>
        <Link to="/" className="btn btn-primary btn-pill">Quay về trang chủ</Link>
      </div>
    );
  }

  const assets = getServiceAssets(service.ten_dich_vu);

  return (
    <div className="service-detail-page" style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <main style={{ padding: '80px 0 120px' }}>
        <div className="container">
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', color: 'var(--gray-400)', fontSize: '0.85rem', marginBottom: '60px', fontWeight: 700, letterSpacing: '1px' }}>
            <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>TRANG CHỦ</Link>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
            <span style={{ color: 'var(--primary)' }}>{service.ten_dich_vu.toUpperCase()}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '80px', alignItems: 'start' }}>
            <div className="animate-fade-in">
              <div style={{ position: 'relative', marginBottom: '56px', borderRadius: '40px', overflow: 'hidden', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.2)' }}>
                <img
                  src={assets.img}
                  alt={service.ten_dich_vu}
                  style={{ width: '100%', height: 'auto', display: 'block' }}
                />
              </div>

              <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', width: '80px', height: '80px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '40px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '40px' }}>{assets.icon}</span>
              </div>
              <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 950, color: 'var(--secondary)', letterSpacing: '-2px', lineHeight: 1.1, marginBottom: '32px' }}>
                {service.ten_dich_vu}
              </h1>

              <p style={{ fontSize: '1.25rem', color: 'var(--gray-500)', fontWeight: 600, lineHeight: 1.7, marginBottom: '56px' }}>{service.mo_ta || "Dịch vụ chăm sóc thú cưng chuyên nghiệp tại hệ thống phòng khám Rexi Vet."}</p>

              <div style={{ borderTop: '1px solid var(--gray-200)', paddingTop: '56px', marginTop: '56px' }}>
                <h3 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '32px', color: 'var(--secondary)' }}>Quy trình chuẩn y khoa</h3>
                <div style={{ display: 'grid', gap: '24px' }}>
                  {[
                    { step: '01', title: 'Khám lâm sàng & Tư vấn', desc: 'Bác sĩ kiểm tra tổng quát, đánh giá tình trạng hiện tại và tư vấn phác đồ phù hợp nhất cho bé.' },
                    { step: '02', title: 'Tiến hành dịch vụ', desc: 'Thực hiện dịch vụ trong môi trường vô trùng, an toàn với trang thiết bị hiện đại nhất.' },
                    { step: '03', title: 'Theo dõi & Chăm sóc', desc: 'Bé được theo dõi sát sao phản ứng sau khi thực hiện dịch vụ để đảm bảo sức khỏe ổn định.' },
                    { step: '04', title: 'Hướng dẫn tại nhà', desc: 'Bác sĩ tư vấn chế độ dinh dưỡng và cách chăm sóc tại nhà để bé mau chóng hồi phục.' }
                  ].map((s, i) => (
                    <div key={i} style={{ display: 'flex', gap: '20px', background: 'var(--surface)', padding: '24px', borderRadius: '24px', border: '1px solid var(--gray-200)', boxShadow: 'var(--shadow-sm)', transition: 'transform 0.3s', cursor: 'default' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateX(10px)'} onMouseLeave={e => e.currentTarget.style.transform = 'none'}>
                      <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.2rem', flexShrink: 0 }}>
                        {s.step}
                      </div>
                      <div>
                        <h4 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--ink)', marginBottom: '8px' }}>{s.title}</h4>
                        <p style={{ margin: 0, color: 'var(--gray-500)', lineHeight: 1.6, fontWeight: 500 }}>{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: 'linear-gradient(135deg, rgba(15, 157, 138, 0.08) 0%, rgba(45, 212, 191, 0.03) 100%)', padding: '40px', borderRadius: '32px', marginTop: '56px', border: '1px solid rgba(15, 157, 138, 0.15)' }}>
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

            <div style={{ position: 'sticky', top: '140px' }}>
              <div className="glass-card" style={{ padding: '40px', borderRadius: '40px', overflow: 'hidden', position: 'relative', background: 'var(--surface)', border: '1px solid var(--gray-200)' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '8px', background: 'var(--primary-gradient)' }}></div>

                <div style={{ marginBottom: '32px' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)', letterSpacing: '1px', marginBottom: '12px' }}>CHI PHÍ TỪ</p>
                  <div style={{ fontSize: '2.5rem', fontWeight: 950, color: 'var(--secondary)', letterSpacing: '-1px' }}>{formatTienVND(service.gia)}</div>
                </div>

                <div style={{ marginBottom: '48px', display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', background: 'var(--gray-50)', borderRadius: '24px' }}>
                  <div style={{ width: '48px', height: '48px', background: 'var(--surface)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', boxShadow: 'var(--shadow-sm)' }}>
                    <span className="material-symbols-outlined">schedule</span>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 800, color: 'var(--gray-400)' }}>THỜI GIAN DỰ KIẾN</p>
                    <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--secondary)' }}>{service.thoi_luong_phut || 30} phút</p>
                  </div>
                </div>

                <button className="btn btn-primary btn-pill" style={{ width: '100%', padding: '24px', fontSize: '1.1rem' }} onClick={() => navigate('/khach-hang/dat-lich-hen')}>
                  ĐẶT LỊCH NGAY
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <ScrollToTop />
      <MemeCat />
      <ChatBot />
    </div>
  );
};

export default React.memo(ChiTietDichVu);
