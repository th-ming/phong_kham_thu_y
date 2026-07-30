import React, { useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Header from '@components/Header';
import Footer from '@components/Footer';
import { ScrollToTop, ChatAI } from '@components/SpecialEffects';

const ChiTietDichVu: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const services = useMemo(() => [
    {
      id: 'kham-da-khoa',
      title: 'Khám Đa Khoa',
      icon: 'stethoscope',
      desc: 'Dịch vụ khám sức khỏe toàn diện cho thú cưng của bạn. Chúng tôi sử dụng các thiết bị hiện đại để kiểm tra nhịp tim, phổi, da, tai và mắt.',
      detail: 'Quy trình bao gồm: Kiểm tra cân nặng, nhiệt độ, nghe tim phổi, kiểm tra răng miệng và tư vấn dinh dưỡng. Đây là bước quan trọng nhất để phát hiện sớm các bệnh lý tiềm ẩn.',
      price: '150.000đ - 300.000đ',
      time: '20 - 30 phút',
      image: '/img/kham_da_khoa.png'
    },
    {
      id: 'tiem-chung',
      title: 'Tiêm Chủng',
      icon: 'vaccines',
      desc: 'Bảo vệ thú cưng khỏi các bệnh truyền nhiễm nguy hiểm bằng hệ thống vaccine nhập khẩu chất lượng cao.',
      detail: 'Chúng tôi cung cấp đầy đủ các loại vaccine cho chó (5 bệnh, 7 bệnh, dại) và mèo (4 bệnh, dại). Mỗi bé sẽ có sổ theo dõi tiêm chủng riêng biệt.',
      price: '200.000đ - 500.000đ',
      time: '15 phút',
      image: '/img/tiem_chung.png'
    },
    {
      id: 'chan-doan-hinh-anh',
      title: 'Chẩn đoán hình ảnh',
      icon: 'radiology',
      desc: 'Sử dụng X-quang và siêu âm để nhìn rõ bên trong cơ thể thú cưng mà không gây đau đớn.',
      detail: 'Hệ thống X-quang kỹ thuật số cho kết quả ngay lập tức. Siêu âm giúp kiểm tra ổ bụng, tim và theo dõi thai kỳ cho thú cưng.',
      price: '300.000đ - 800.000đ',
      time: '30 - 45 phút',
      image: '/img/chan_doan_hinh_anh.png'
    },
    {
      id: 'phau-thuat',
      title: 'Phẫu thuật',
      icon: 'surgical',
      desc: 'Phòng mổ vô trùng tiêu chuẩn quốc tế với đội ngũ bác sĩ ngoại khoa giàu kinh nghiệm.',
      detail: 'Từ các ca phẫu thuật mô mềm (triệt sản, lấy sỏi) đến phẫu thuật xương khớp. Hệ thống gây mê an toàn và theo dõi nhịp sinh tồn liên tục.',
      price: 'Từ 1.500.000đ',
      time: '60 - 120 phút',
      image: '/img/phau_thuat.png'
    },
    {
      id: 'noi-tru-cham-soc',
      title: 'Nội trú & Chăm sóc',
      icon: 'home_health',
      desc: 'Khu vực lưu trú sạch sẽ, thoáng mát cho thú cưng cần theo dõi y tế hoặc khi chủ vắng nhà.',
      detail: 'Chế độ ăn uống khoa học, được nhân viên y tế kiểm tra sức khỏe 2 lần mỗi ngày. Có khu vực riêng biệt cho chó và mèo để tránh stress.',
      price: '250.000đ - 500.000đ/ngày',
      time: 'Theo ngày',
      image: '/img/noi_tru.png'
    },
    {
      id: 'spa-grooming',
      title: 'Spa & Grooming',
      icon: 'spa',
      desc: 'Dịch vụ làm đẹp giúp thú cưng luôn sạch sẽ, thơm tho và tự tin.',
      detail: 'Bao gồm: Tắm sấy, vệ sinh tai, cắt móng, vắt tuyến hôi và cắt tỉa lông tạo kiểu theo yêu cầu của chủ nuôi.',
      price: '100.000đ - 600.000đ',
      time: '60 - 90 phút',
      image: '/img/spa_grooming.png'
    }
  ], []);

  const service = useMemo(() => services.find(s => s.id === slug), [slug, services]);

  if (!service) {
    return <div style={{ padding: '100px', textAlign: 'center' }}>
      <h2>Dịch vụ không tồn tại</h2>
      <Link to="/" style={{ color: 'var(--teal)' }}>Quay về trang chủ</Link>
    </div>;
  }

  return (
    <div style={{ background: 'white', minHeight: '100vh', fontFamily: "'Inter', sans-serif" }}>
      <Header />
      
      <main style={{ paddingTop: '120px', paddingBottom: '80px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--gray-400)', fontSize: '14px', marginBottom: '32px', fontWeight: 600 }}>
            <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Trang chủ</Link>
            <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
            <span style={{ color: 'var(--teal)' }}>{service.title}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '64px', alignItems: 'start' }}>
            {/* Left: Content */}
            <div>
              <div style={{ 
                width: '64px', 
                height: '64px', 
                background: 'rgba(15, 157, 138, 0.1)', 
                color: 'var(--teal)', 
                borderRadius: '20px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                marginBottom: '24px'
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>{service.icon}</span>
              </div>
              
              <h1 style={{ fontSize: '48px', fontWeight: '900', color: 'var(--ink)', marginBottom: '24px', letterSpacing: '-1.5px' }}>
                {service.title}
              </h1>
              
              <p style={{ fontSize: '20px', color: 'var(--gray-600)', lineHeight: 1.6, marginBottom: '40px', fontWeight: '500' }}>
                {service.desc}
              </p>

              <div style={{ borderRadius: '32px', overflow: 'hidden', marginBottom: '48px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                <img src={service.image} alt={service.title} style={{ width: '100%', height: '400px', objectFit: 'cover' }} />
              </div>

              <h2 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--ink)', marginBottom: '16px' }}>Chi tiết dịch vụ</h2>
              <p style={{ fontSize: '18px', color: 'var(--gray-500)', lineHeight: 1.8, marginBottom: '48px' }}>
                {service.detail}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '64px' }}>
                <div style={{ background: 'var(--gray-50)', padding: '32px', borderRadius: '24px' }}>
                  <h4 style={{ color: 'var(--gray-400)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: 800 }}>Giá tham khảo</h4>
                  <p style={{ fontSize: '24px', fontWeight: '900', color: 'var(--teal)' }}>{service.price}</p>
                </div>
                <div style={{ background: 'var(--gray-50)', padding: '32px', borderRadius: '24px' }}>
                  <h4 style={{ color: 'var(--gray-400)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', fontWeight: 800 }}>Thời gian thực hiện</h4>
                  <p style={{ fontSize: '24px', fontWeight: '900', color: 'var(--ink)' }}>{service.time}</p>
                </div>
              </div>
            </div>

            {/* Right: Sidebar / CTA */}
            <aside style={{ position: 'sticky', top: '120px' }}>
              <div style={{ background: 'var(--ink)', padding: '40px', borderRadius: '32px', color: 'white', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                <h3 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '16px' }}>Đặt lịch ngay hôm nay</h3>
                <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '32px', lineHeight: 1.5 }}>Đảm bảo sức khỏe cho thú cưng của bạn với lịch hẹn ưu tiên.</p>
                
                <button 
                  onClick={() => navigate('/dang-nhap')}
                  style={{ 
                    width: '100%', 
                    padding: '18px', 
                    borderRadius: '16px', 
                    background: 'var(--teal)', 
                    color: 'white', 
                    border: 'none', 
                    fontWeight: '800', 
                    fontSize: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'none'}
                >
                  <span className="material-symbols-outlined">calendar_month</span>
                  Đặt lịch khám
                </button>
                
                <div style={{ marginTop: '32px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--teal)' }}>verified</span>
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>Bác sĩ chuyên khoa giàu kinh nghiệm</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--teal)' }}>medical_services</span>
                    <span style={{ fontSize: '14px', fontWeight: '500' }}>Thiết bị y tế hiện đại nhất</span>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '32px', padding: '24px', border: '1px solid var(--gray-100)', borderRadius: '32px', textAlign: 'center' }}>
                <p style={{ color: 'var(--gray-400)', fontSize: '14px', marginBottom: '12px', fontWeight: '600' }}>Bạn cần tư vấn trực tiếp?</p>
                <p style={{ fontSize: '20px', fontWeight: '900', color: 'var(--ink)' }}>024 1234 5678</p>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
      <ScrollToTop />
    </div>
  );
};

export default React.memo(ChiTietDichVu);
