import React, { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Header from "@components/Header";
import { ChatBot, MemeCat, ScrollToTop } from "@components/SpecialEffects";

const TrangChu: React.FC = () => {
  const [activeVideo, setActiveVideo] = useState(1);
  const [heroMediaAvailable, setHeroMediaAvailable] = useState(true);
  const v1Ref = useRef<HTMLVideoElement>(null);
  const v2Ref = useRef<HTMLVideoElement>(null);

  const handleVideoEnded = (vNum: number) => {
    if (vNum === 1) {
      setActiveVideo(2);
      v2Ref.current?.play();
      if (v2Ref.current) v2Ref.current.currentTime = 0;
      return;
    }
    setActiveVideo(1);
    v1Ref.current?.play();
    if (v1Ref.current) v1Ref.current.currentTime = 0;
  };

  const scrollToServices = () =>
    document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });

  const features = useMemo(
    () => [
      {
        id: "kham-da-khoa",
        icon: "stethoscope",
        title: "Khám Đa Khoa",
        desc: "Kiểm tra sức khỏe toàn diện, xét nghiệm máu, chẩn đoán hình ảnh. Phát hiện sớm vấn đề sức khỏe.",
        price: "Từ 150.000đ",
        tag: "Phổ biến",
      },
      {
        id: "tiem-chung",
        icon: "vaccines",
        title: "Tiêm Chủng",
        desc: "Lịch tiêm chủng cá nhân hóa theo tuổi và lối sống. Vaccine nhập khẩu chính hãng từ châu Âu.",
        price: "Từ 200.000đ",
      },
      {
        id: "chan-doan-hinh-anh",
        icon: "radiology",
        title: "Chẩn đoán hình ảnh",
        desc: "X-quang kỹ thuật số, siêu âm bụng, nội soi. Kết quả rõ nét trong thời gian ngắn.",
        price: "Từ 300.000đ",
        tag: "Mới",
      },
      {
        id: "phau-thuat",
        icon: "surgical",
        title: "Phẫu thuật",
        desc: "Phòng mổ vô trùng đạt chuẩn quốc tế, gây mê an toàn, theo dõi sau phẫu thuật 24/7.",
        price: "Từ 1.500.000đ",
      },
      {
        id: "noi-tru-cham-soc",
        icon: "home_health",
        title: "Nội trú & Chăm sóc",
        desc: "Khu vực lưu trú sạch sẽ, thông thoáng cho chó và mèo. Y tá túc trực 24/7.",
        price: "Từ 250.000đ/ngày",
      },
      {
        id: "spa-grooming",
        icon: "spa",
        title: "Spa & Grooming",
        desc: "Tắm rửa, vệ sinh, cắt tỉa lông tạo kiểu. Sử dụng sữa tắm cao cấp nhập khẩu.",
        price: "Từ 100.000đ",
      },
    ],
    [],
  );

  const doctors = useMemo(
    () => [
      {
        name: "TS.BS. Minh Anh",
        role: "Nội khoa & Bệnh truyền nhiễm",
        experience: "12 năm kinh nghiệm",
        ribbon: "Trưởng khoa",
        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAnzLX55arDOS7p6O2ZJSBzY2gvWUpDWxQzK0yWhKzQB_XM3rV5h38dLkQx3vqMCuz1nsAzS-5sr4M8svOKYmMxcfWh9C7p6XmyRO0U7qLkMFHMADppWVen5GD3cS7ncH9mwZ5a-FPXq67AjnrIS0SLnOBWOK6t4MlK9oHp9R5V_e8D79LQcrFYqSBGpZY9wWwxEhCV_W1VL9PPvjIvegEgSGj-mrUVhjQj76k0h8xmPCuxW3k8DOy-dG-mljPWPjMEwSOnR-ViVBw",
      },
      {
        name: "BS. Khánh Linh",
        role: "Phẫu thuật tổng quát",
        experience: "9 năm kinh nghiệm",
        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuDFq-0VGr-gZx2Yv9FnLQjQ8N-2GWHn1nRsZ6ht6-mCF1ApodPQchXkqAL88fq1zgXQpYozlXN6RQfTDdHoubsIqcYLa800C4BI390tFkKf7OOKiz0_-RPM9268hPnrZWWQE8Y-dFr58rJUB4rCFG7ujb8RUOrbjxE4VhmRPdLQ9-TYhPe2WPjOKDQdSHbi7DVCCO15i0BI_HagOxX4viZhz-_yvWBEfOsBeELCFy9uxmzizMOusb-SKd_cd1F11ObRTj71OsC8MKc",
      },
      {
        name: "BS. Hoàng Nam",
        role: "Chẩn đoán hình ảnh",
        experience: "8 năm kinh nghiệm",
        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBzTfrPVAtg4T_4LwIBU5AIz6RUqUa9PeGSymBBLGc7IrSglrcR_ZkaNv4p_KuL19_rz6_q9_526Z3AfMNjK8j09ApketvZua21BJudbGYBAUhHYqzstGjFDUUT3s4kB5EHrcRMBOxQ3wrI7f4zVIz6wV_U2xhvs0ojNqxTRjipKffTazVw2KxXp9Q_omPFVdW_zW0kbbVF8pcIxPx7gDOEp1GEzw10nPf-duwws-7mA_rduNraZW7pDZdZP1clq0nkF3FlkoBT5QE",
      },
      {
        name: "ThS.BS. Thu Thủy",
        role: "Dinh dưỡng & Nội tiết",
        experience: "7 năm kinh nghiệm",
        img: "https://lh3.googleusercontent.com/aida-public/AB6AXuBADsVeyBCisVAoV5WWEKDLY0cxjPo6X9HPxdcfiPrwbW_2oPY-ArHJz84CYLuhHHwveL6wa9KeaYfEHE_XikP5_eBz1kXyWPp4RfhlxnSiW56MTRfxZX2BOx8JjpPvMublIKgmQyDBtXAfEJOzioX7vPns17fInCyodHnQvPDSP3sukfRgk61qs6hT1W6Ji9Q57oOjDqO3l0PSMowd7JY3S4NaFgpH6BaLXLS9Aleaa__FpP5Gv9tFu5ceJSJm1OhEIM1dyFBA320",
      },
    ],
    [],
  );

  return (
    <div className="trang-chu">
      <Header />
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-left">
            <div className="hero-tag">
              <span className="dot"></span> Tin cậy từ 5,000+ thú cưng
            </div>
            <h1>
              Sức Khoẻ <em>Trọn Vẹn</em>
              <br />
              Cho Người Bạn Nhỏ
            </h1>
            <p className="hero-desc">
              Phòng khám thú y Rexi — nơi kết hợp y khoa hiện đại với tình yêu chân
              thành. Chúng tôi chăm sóc thú cưng như thành viên trong gia đình bạn.
            </p>
            <div className="hero-cta">
              <Link to={localStorage.getItem("user") ? "/khach-hang/dat-lich-hen" : "/dang-nhap"} className="cta-main">
                <span className="material-symbols-outlined">edit_calendar</span> Đặt
                Lịch Hẹn Ngay
              </Link>
              <button className="cta-secondary" onClick={scrollToServices}>
                <span className="material-symbols-outlined">arrow_downward</span> Xem
                Dịch Vụ
              </button>
            </div>
            <div className="hero-badges">
              <div className="hero-badge">
                <span className="material-symbols-outlined">verified</span>
                <div>
                  <div className="badge-t">Chứng nhận quốc tế</div>
                  <div className="badge-s">WSAVA Standard</div>
                </div>
              </div>
              <div className="hero-badge">
                <span className="material-symbols-outlined">local_hospital</span>
                <div>
                  <div className="badge-t">Phòng mổ vô trùng</div>
                  <div className="badge-s">ISO 14644-1</div>
                </div>
              </div>
              <div className="hero-badge">
                <span className="material-symbols-outlined">stars</span>
                <div>
                  <div className="badge-t">Đánh giá 4.9★</div>
                  <div className="badge-s">1,200+ lượt</div>
                </div>
              </div>
            </div>
          </div>
          <div className="hero-right">
            {heroMediaAvailable ? (
              <>
                <video
                  ref={v1Ref}
                  className="hero-img"
                  style={{ opacity: activeVideo === 1 ? 1 : 0 }}
                  src="/img/cathello.mp4"
                  autoPlay
                  muted
                  playsInline
                  onEnded={() => handleVideoEnded(1)}
                  onError={() => setHeroMediaAvailable(false)}
                />
                <video
                  ref={v2Ref}
                  className="hero-img"
                  style={{ opacity: activeVideo === 2 ? 1 : 0 }}
                  src="/img/doghello.mp4"
                  muted
                  playsInline
                  onEnded={() => handleVideoEnded(2)}
                  onError={() => setHeroMediaAvailable(false)}
                />
              </>
            ) : (
              <div className="hero-img" style={{ background: "var(--gray-100)" }} />
            )}
            <div className="hero-stat">
              <div className="stat-ico">
                <span className="material-symbols-outlined">favorite</span>
              </div>
              <div>
                <div className="stat-n">5,000+</div>
                <div className="stat-l">Thú cưng được chăm sóc</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="trust-strip">
        <div className="trust-inner">
          <div className="trust-item"><span className="material-symbols-outlined">emergency</span><div><div className="trust-t">Cấp cứu 24/7</div><div className="trust-s">Luôn sẵn sàng</div></div></div>
          <div className="trust-div"></div>
          <div className="trust-item"><span className="material-symbols-outlined">science</span><div><div className="trust-t">Xét nghiệm tại chỗ</div><div className="trust-s">Kết quả trong 30 phút</div></div></div>
          <div className="trust-div"></div>
          <div className="trust-item"><span className="material-symbols-outlined">vaccines</span><div><div className="trust-t">Vaccine chính hãng</div><div className="trust-s">Nhập khẩu châu Âu</div></div></div>
          <div className="trust-div"></div>
          <div className="trust-item"><span className="material-symbols-outlined">payments</span><div><div className="trust-t">Thanh toán linh hoạt</div><div className="trust-s">Tiền mặt · Thẻ · QR</div></div></div>
          <div className="trust-div"></div>
          <div className="trust-item"><span className="material-symbols-outlined">phone_in_talk</span><div><div className="trust-t">Tư vấn miễn phí</div><div className="trust-s">Qua điện thoại & Zalo</div></div></div>
        </div>
      </div>

      <section id="services" style={{ backgroundColor: "white" }}>
        <div className="section-wrap">
          <div className="section-inner">
            <div className="sec-head">
              <div>
                <div className="sec-label">Dịch vụ của chúng tôi</div>
                <h2 className="sec-title">Chăm Sóc <em>Toàn Diện</em></h2>
                <p className="sec-desc">Đầy đủ dịch vụ thú y từ khám tổng quát đến phẫu thuật phức tạp.</p>
              </div>
              <button className="cta-secondary" onClick={scrollToServices}>Xem tất cả →</button>
            </div>
            <div className="services-grid">
              {features.map((f, i) => (
                <div key={i} className="svc-card">
                  {f.tag && <div className={`svc-tag ${f.tag === "Mới" ? "tag-new" : "tag-pop"}`}>{f.tag === "Mới" ? "Mới" : "★ Phổ biến"}</div>}
                  <div className="svc-ico"><span className="material-symbols-outlined">{f.icon}</span></div>
                  <div className="svc-name">{f.title}</div>
                  <p className="svc-desc">{f.desc}</p>
                  <div className="svc-price"><span className="svc-price-val">{f.price}</span><Link to={`/dich-vu/${f.id}`} className="svc-link">Chi tiết →</Link></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="doctors" style={{ backgroundColor: "var(--gray-50)" }}>
        <div className="section-wrap">
          <div className="section-inner">
            <div className="sec-label">Đội ngũ bác sĩ</div>
            <h2 className="sec-title">Chuyên Gia <em>Tận Tâm</em></h2>
            <p className="sec-desc">Bác sĩ nhiều năm kinh nghiệm, yêu nghề và luôn đặt sức khỏe thú cưng lên hàng đầu.</p>
            <div className="doctors-grid">
              {doctors.map((doc, i) => (
                <div key={i} className="doc-card">
                  {doc.ribbon && <div className="doc-ribbon">{doc.ribbon}</div>}
                  <img className="doc-img" src={doc.img} alt={doc.name} />
                  <div className="doc-info"><div className="doc-name">{doc.name}</div><div className="doc-spec">{doc.role}</div><div className="doc-years">{doc.experience}</div></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="steps" className="steps-bg">
        <div className="section-wrap">
          <div className="section-inner">
            <div style={{ textAlign: "center", marginBottom: "8px" }}><div className="sec-label" style={{ justifyContent: "center" }}>Quy trình đặt lịch</div></div>
            <h2 className="sec-title" style={{ textAlign: "center" }}>Chỉ <em>4 Bước</em> Đơn Giản</h2>
            <div className="steps-grid">
              <div className="step active"><div className="step-num">1</div><div className="step-title">Tạo tài khoản</div><div className="step-desc">Đăng ký nhanh qua email hoặc Google</div></div>
              <div className="step"><div className="step-num">2</div><div className="step-title">Chọn dịch vụ</div><div className="step-desc">Chọn loại dịch vụ và bác sĩ phù hợp</div></div>
              <div className="step"><div className="step-num">3</div><div className="step-title">Đặt lịch hẹn</div><div className="step-desc">Chọn ngày giờ, nhận xác nhận qua SMS</div></div>
              <div className="step"><div className="step-num">4</div><div className="step-title">Đến khám</div><div className="step-desc">Đến đúng giờ, để chúng tôi lo phần còn lại</div></div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ background: "white" }}>
        <div className="section-wrap">
          <div className="section-inner">
            <div className="sec-label">Khách hàng nói gì</div>
            <h2 className="sec-title">Tin Yêu Từ <em>Mọi Nhà</em></h2>
            <div className="testi-grid">
              <div className="testi-card"><div className="testi-stars">★★★★★</div><span className="testi-q">"</span><p className="testi-text">Tôi hoàn toàn yên tâm khi gửi gắm chú cún Milo tại đây. Các bác sĩ không chỉ giỏi mà còn cực kỳ kiên nhẫn và yêu thương Milo như chính thú cưng của mình.</p><div className="testi-author"><div className="testi-av"><img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDe4RlvX3_5p6j9jmF9hrVt6EwgWk-SMCdbM4eOY_8WBkx8HyIiIOs5A8kfGWEBdQlrjdUQMymPnKQyWTWrXySH1ucE9aZNlfA8eSa7-t4Aqi7Q-HWIvkvuzCxpHL_h3ugVU5NMVGhJnX9Lyf-TLpF8lfKTIJLYbW2-CmZ2BzQ52IDz0n-9LhVL5zl4mutydF2UHzEOnOkXtRc3RtkBzQ2efxJaeFD_eHZ7kLyv8izxEBx3ndPPvMo7By_0R0gHCUTE6f0O1dsyNZo" alt="Chị Minh Hạnh" /></div><div><div className="testi-n">Chị Minh Hạnh</div><div className="testi-p">Chủ của Milo · Poodle, 3 tuổi</div></div></div></div>
              <div className="testi-card"><div className="testi-stars">★★★★★</div><span className="testi-q">"</span><p className="testi-text">Bác sĩ Khánh Linh đã phẫu thuật thành công cho bé mèo nhà tôi sau tai nạn. Cả ê-kíp rất tận tâm và thường xuyên cập nhật tình hình.</p><div className="testi-author"><div className="testi-av"><img src="https://lh3.googleusercontent.com/aida-public/AB6AXuB7npLXKRxqd120xZgiO32iqvX8p9PmqMSIxGCKa9zRHeFoDPW6jaID3DyZ-Fd8Bz_2MgfeSlLJiSjKNNw386m4EfzUBqoNnG7Ldf2vdydHyug8TSGEgzO2NIyxl7EqawxOMn2wzmi76iFjDFWTYIe7W0y47D79KAv7EgT8ssrL4AkBgVAkYTaGq8Sm5YY9pyHXgMtbZN-34eZPHoaR0FONVlmplsgWvw0qYSdq9MO7lt688ArUjL4n8IQULBvUCgEPzYDm3Ym5Nj0" alt="Anh Quốc Trung" /></div><div><div className="testi-n">Anh Quốc Trung</div><div className="testi-p">Chủ của Bông · British Shorthair, 5 tuổi</div></div></div></div>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" style={{ background: "var(--gray-50)" }}>
        <div className="section-wrap">
          <div className="section-inner">
            <div className="sec-label">Liên hệ</div>
            <h2 className="sec-title" style={{ marginBottom: "32px" }}>Tìm <em>Chúng Tôi</em></h2>
            <div className="contact-wrap">
              <div className="contact-left">
                <h3>Thông Tin Liên Hệ</h3>
                <p style={{ fontSize: "0.82rem", color: "var(--gray-400)", fontWeight: 600 }}>Luôn sẵn lòng hỗ trợ bạn</p>
                <div className="contact-items">
                  <div className="ci"><div className="ci-ico"><span className="material-symbols-outlined">location_on</span></div><div><div className="ci-l">Địa chỉ</div><div className="ci-v">Số 68, Ngõ 10, Đường Ngô Xuân Quảng<br />Trâu Quỳ, Gia Lâm, Hà Nội</div></div></div>
                  <div className="ci"><div className="ci-ico"><span className="material-symbols-outlined">call</span></div><div><div className="ci-l">Điện thoại & Cấp cứu</div><div className="ci-v">024 1234 5678<br /><span style={{ fontSize: "0.8rem", color: "var(--teal)", fontWeight: 700 }}>Cấp cứu 24/7: 0909 123 456</span></div></div></div>
                  <div className="ci"><div className="ci-ico"><span className="material-symbols-outlined">mail</span></div><div><div className="ci-l">Email</div><div className="ci-v">contact@rexi.vn</div></div></div>
                  <div className="ci"><div className="ci-ico"><span className="material-symbols-outlined">schedule</span></div><div><div className="ci-l">Giờ làm việc</div><div className="ci-v">Thứ 2 - CN: 08:00 - 20:00<br /><span style={{ fontSize: "0.8rem", color: "var(--teal)", fontWeight: 700 }}>★ Cấp cứu: 24/7 không nghỉ</span></div></div></div>
                </div>
              </div>
              <div className="contact-right">
                <img className="contact-map-img" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAKG6VDVkO-asJ5dFAaY6lQzPMzLs7UYJWJITeWEw-sTieCA162GXg9Xxhzp4-a9Yhg6DQyRdcLvKQDm_Byc5NUhoElgEAWhQB0HHvuiz5SoqqOCctju-SR7NgHvrcXXjAo1YweLJ4gnJrbMLm2HQFJG4W7h94j_xoIG2s_9RcohjwlJeksU0_oGDlcJymar2HmTqCIRD0NszjWTG1EK051X2-YsJgsyPHq_0Bc8_iAjB9IfYgln0aW8xcskyQY-ouHL6YF7UN0aqA" alt="Map" />
                <div className="pin-wrap"><div className="pin-ring"></div><div className="pin-line"></div></div>
                <div className="contact-map-body">
                  <div className="map-label">Vị trí phòng khám</div>
                  <div className="map-addr">Số 68, Ngõ 10, Đường Ngô Xuân Quảng<br />Trâu Quỳ, Gia Lâm, Hà Nội</div>
                  <button 
                    className="btn-direction" 
                    onClick={() => window.open('https://www.google.com/maps/dir//68+Ngô+Xuân+Quảng,+Trâu+Quỳ,+Gia+Lâm,+Hà+Nội', '_blank')}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>near_me</span> Chỉ đường đến đây
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="footer-inner">
          <div className="footer-top">
            <div>
              <div className="footer-logo"><img src="/img/avtpkty.png" alt="Rexi Logo" className="footer-logo-icon" style={{ objectFit: "contain", padding: "3px" }} />Rexi</div>
              <p style={{ fontSize: "0.76rem", color: "rgba(255,255,255,0.3)", marginTop: "7px", fontWeight: 500 }}>Phòng Khám Thú Y Chuyên Nghiệp</p>
            </div>
            <div className="footer-links">
              <Link to="/404">Về chúng tôi</Link><span className="footer-sep">·</span><Link to="/404">Dịch vụ</Link><span className="footer-sep">·</span><Link to="/404">Bác sĩ</Link><span className="footer-sep">·</span><Link to="/404">Chính sách bảo mật</Link><span className="footer-sep">·</span><Link to="/404">Điều khoản</Link><span className="footer-sep">·</span><Link to="/404">Tuyển dụng</Link>
            </div>
          </div>
          <div className="footer-bottom">
            <div className="footer-copy">© 2026 Rexi. Đã bảo lưu mọi quyền.</div>
            <div className="footer-heart">Chăm sóc bằng cả trái tim <span className="material-symbols-outlined">favorite</span></div>
          </div>
        </div>
      </footer>

      <ScrollToTop />
      <ChatBot />
      <MemeCat />
    </div>
  );
};

export default React.memo(TrangChu);
