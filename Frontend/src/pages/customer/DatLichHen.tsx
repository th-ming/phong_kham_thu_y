import React, { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import axiosInstance from "@services/axios";
import { formatTienVND, getUserProfile, normalizeUserRole } from "@utils/index";
import { toast } from "@components/Toast";

const DatLichHen: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [pets, setPets] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);

  const [idThuCung, setIdThuCung] = useState(searchParams.get("id_thu_cung") || "");
  const [idDichVu, setIdDichVu] = useState(searchParams.get("id_dich_vu") || "");
  const [idBacSi, setIdBacSi] = useState(searchParams.get("id_bac_si") || "");
  const [date, setDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serviceScrollHintOpacity, setServiceScrollHintOpacity] = useState(1);

  // Trạng thái của lái tự động (Autopilot) cho Sếp/Khách hàng
  const [autopilotStep, setAutopilotStep] = useState(0);
  const [autopilotMsg, setAutopilotMsg] = useState("");
  const [isAutopilotRunning, setIsAutopilotRunning] = useState(false);

  // CHUYỂN GET USER RA NGOÀI CÙNG COMPONENT ĐỂ KHÔNG VI PHẠM LUẬT HOOK
  const user = useMemo(() => getUserProfile(), []);
  const userRole = normalizeUserRole(user);
  const isCustomerUser = userRole === "khach_hang";
  const idKhachHang = user?.id_khach_hang || (isCustomerUser ? user?.id : undefined);

  const bookingStateRef = useRef({
    idThuCung,
    idDichVu,
    idBacSi,
    date,
    time,
    note,
    availableSlots,
    services,
  });

  useEffect(() => {
    bookingStateRef.current = { idThuCung, idDichVu, idBacSi, date, time, note, availableSlots, services };
  }, [idThuCung, idDichVu, idBacSi, date, time, note, availableSlots, services]);

  useEffect(() => {
    const isAutopilot = searchParams.get("autopilot") === "true";
    if (!isAutopilot || isAutopilotRunning || pets.length === 0 || services.length === 0) return;

    setIsAutopilotRunning(true);
    setAutopilotStep(1);
    setAutopilotMsg("🤖 Rexi Autopilot: Đang khởi động tiến trình đặt lịch trực quan...");

    // Bước 1: Tự động chọn thú cưng sau 1.5 giây
    setTimeout(() => {
      const petParam = searchParams.get("id_thu_cung");
      if (petParam) {
        setIdThuCung(petParam);
      } else if (pets.length > 0) {
        setIdThuCung(String(pets[0].id_thu_cung));
      }
      setAutopilotStep(2);
      setAutopilotMsg("🤖 [1/5] Thú cưng: Đã chọn em bé nhà Sen!");

      // Bước 2: Tự động chọn dịch vụ sau 1.2 giây
      setTimeout(() => {
        const dvParam = searchParams.get("id_dich_vu");
        if (dvParam) {
          setIdDichVu(dvParam);
        } else if (services.length > 0) {
          setIdDichVu(String(services[0].id_dich_vu));
        }
        setAutopilotStep(3);
        setAutopilotMsg("🤖 [2/5] Dịch vụ: Đã tự động kích hoạt thẻ dịch vụ!");

        // Bước 3: Tự động chọn ngày khám (Ngày mai) sau 1.2 giây
        setTimeout(() => {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
          setDate(tomorrowStr);
          setAutopilotStep(4);
          setAutopilotMsg("🤖 [3/5] Ngày khám: Đã lên lịch hẹn ngày mai (" + tomorrowStr.split('-').reverse().join('/') + ")!");

          // Bước 4: Đợi tải giờ rảnh từ server và tự động chọn khung giờ rảnh đầu tiên
          let checkSlotsCount = 0;
          const checkSlotsInterval = setInterval(() => {
            checkSlotsCount++;
            const latestSlots = bookingStateRef.current.availableSlots;
            if (latestSlots && latestSlots.length > 0) {
              clearInterval(checkSlotsInterval);
              const targetTime = latestSlots[0];
              setTime(targetTime);
              setAutopilotStep(5);
              setAutopilotMsg("🤖 [4/5] Khung giờ: Đã chọn khung giờ trống sớm nhất lúc " + targetTime.substring(0, 5) + "!");

              // Bước 5: Giả lập hiệu ứng gõ phím triệu chứng vào textarea
              setTimeout(() => {
                const noteText = "Lịch khám sức khỏe định kỳ cho bé cưng, tạo tự động trực quan qua Rexi AI Autopilot.";
                let charIndex = 0;
                let typedText = "";
                const typeInterval = setInterval(() => {
                  if (charIndex < noteText.length) {
                    typedText += noteText[charIndex];
                    setNote(typedText);
                    charIndex++;
                  } else {
                    clearInterval(typeInterval);
                    setAutopilotStep(6);
                    setAutopilotMsg("🤖 [5/5] Ghi chú triệu chứng: Đã điền xong! Đang nhấp chuột AI vào nút XÁC NHẬN...");

                    // Bước 6: Highlight và tự động gửi đi sau 1.5 giây
                    setTimeout(() => {
                      toast.success("Autopilot hoàn tất! Đang gửi thông tin đặt lịch...");
                      
                      // Gọi hàm submit form
                      handleBooking(undefined, {
                        idThuCung: bookingStateRef.current.idThuCung,
                        idDichVu: bookingStateRef.current.idDichVu,
                        idBacSi: bookingStateRef.current.idBacSi,
                        date: bookingStateRef.current.date,
                        time: bookingStateRef.current.time,
                        note: bookingStateRef.current.note,
                      });
                    }, 1500);
                  }
                }, 45);
              }, 1200);
            } else if (checkSlotsCount > 15) {
              // Timeout sau 3 giây nếu không lấy được slot
              clearInterval(checkSlotsInterval);
              toast.error("Không thể tải giờ rảnh tự động. Sen vui lòng chọn giờ thủ công nhé!");
              setIsAutopilotRunning(false);
            }
          }, 200);

        }, 1200);
      }, 1200);
    }, 1500);

  }, [pets, services]);

  useEffect(() => {
    const fetchBaseData = async () => {
      if (idKhachHang) {
          axiosInstance.get(`/api/thu-cung/khach/${idKhachHang}`, { params: { page: 0, size: 999 } }).then(res => {
            const data = res.data;
            setPets(Array.isArray(data) ? data : (data.content || data.data || []));
          }).catch(e => console.error(e));
      }
      axiosInstance.get("/api/dich-vu/active").then(res => setServices(res.data)).catch(e => console.error(e));
    };

    fetchBaseData();

    // Smart Polling: Cập nhật ngầm mỗi 10 giây để nhận giá/dịch vụ/thú cưng mới
    const interval = setInterval(() => {
      fetchBaseData();
    }, 10000);

    return () => clearInterval(interval);
  }, [idKhachHang]);

  useEffect(() => {
    if (!date) {
      setDoctors([]);
      setIdBacSi("");
      return;
    }
    const url = `/api/bac-si?ngay=${date}`;
    axiosInstance.get(url)
      .then(res => {
        setDoctors(res.data);
        if (idBacSi && !res.data.some((d: any) => String(d.id_nhan_vien) === idBacSi)) {
          setIdBacSi("");
        }
      })
      .catch(e => console.error("Lỗi lấy danh sách bác sĩ theo ngày:", e));
  }, [date]);

  useEffect(() => {
    if (date && idDichVu) {
      setLoadingSlots(true);
      const params = new URLSearchParams({ ngay: date, id_dich_vu: idDichVu });
      if (idBacSi) params.set("id_nhan_vien", idBacSi);
      axiosInstance.get(`/api/lich-hen/gio-ranh?${params.toString()}`)
        .then(res => {
          const now = new Date();
          const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
          const isToday = date === todayStr;
          let slots = res.data;

          if (isToday) {
            slots = slots.filter((slot: string) => {
              const [slotHour, slotMinute] = slot.split(':').map(Number);
              return slotHour > now.getHours() || (slotHour === now.getHours() && slotMinute > now.getMinutes());
            });
          }
          setAvailableSlots(slots);
          if (time && !slots.some((slot: string) => slot.startsWith(time))) setTime("");
        })
        .catch(err => {
          console.error("Lỗi lấy giờ rảnh:", err);
          setAvailableSlots([]);
        })
        .finally(() => setLoadingSlots(false));
    } else {
      setAvailableSlots([]);
    }
  }, [idBacSi, date, idDichVu]);

  const dv = useMemo(() => services.find(d => String(d.id_dich_vu) === idDichVu), [idDichVu, services]);
  const selectedPrice = dv ? (dv.gia > 0 ? `Từ ${formatTienVND(dv.gia)}` : "Theo thực tế") : "—";

  const handleServiceScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const nextOpacity = Math.max(0, Math.min(1, 1 - scrollTop / 110));
    setServiceScrollHintOpacity(nextOpacity);
  };

  const handleBooking = async (
    e?: React.FormEvent,
    override?: Partial<{
      idThuCung: string;
      idDichVu: string;
      idBacSi: string;
      date: string;
      time: string;
      note: string;
    }>
  ) => {
    e?.preventDefault();

    if (!isCustomerUser) {
      toast.error("Tài khoản nội bộ (Admin/Nhân viên) không được phép đặt lịch khám. Vui lòng dùng tài khoản Khách hàng!");
      return;
    }

    const formIdThuCung = override?.idThuCung ?? idThuCung;
    const formIdDichVu = override?.idDichVu ?? idDichVu;
    const formIdBacSi = override?.idBacSi ?? idBacSi;
    const formDate = override?.date ?? date;
    const formTime = override?.time ?? time;
    const formNote = override?.note ?? note;
    const selectedService = services.find(d => String(d.id_dich_vu) === formIdDichVu);
    const selectedPet = pets.find(p => String(p.id_thu_cung) === formIdThuCung);

    if (!formIdThuCung) {
      toast.info("Vui lòng chọn thú cưng cần khám!");
      return;
    }

    if (!selectedPet) {
      toast.error("Thú cưng đã chọn không còn trong hồ sơ của tài khoản này. Vui lòng tải lại trang!");
      return;
    }

    if (!formIdDichVu) {
      toast.info("Vui lòng chọn một dịch vụ cho bé nhé!");
      return;
    }

    if (!selectedService) {
      toast.error("Dịch vụ đã chọn không còn khả dụng. Vui lòng chọn lại dịch vụ!");
      return;
    }

    if (!formDate) {
      toast.info("Vui lòng chọn ngày khám!");
      return;
    }

    if (!formTime) {
      toast.info("Vui lòng chọn khung giờ khám!");
      return;
    }

    setLoading(true);
    if (!idKhachHang) {
      toast.error("Không tìm thấy thông tin tài khoản. Vui lòng đăng nhập lại!");
      setLoading(false);
      return;
    }

    const payload = {
      ngay_kham: formDate,
      gio_kham: formTime.length === 5 ? `${formTime}:00` : formTime,
      ly_do: selectedService?.ten_dich_vu || "Khám bệnh",
      ghi_chu: formNote,
      id_khach_hang: idKhachHang,
      id_thu_cung: formIdThuCung,
      id_bac_si: formIdBacSi || null,
      id_dich_vu: formIdDichVu,
      id_nguoi_dat: idKhachHang
    };

    try {
      await axiosInstance.post("/api/lich-hen", payload);
      toast.success("Đặt lịch thành công! Chúng tôi sẽ sớm liên hệ xác nhận.");
      setIdThuCung(""); setIdDichVu(""); setIdBacSi(""); setDate(""); setTime(""); setNote("");
      navigate("/khach-hang/lich-su-lich-hen");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Đặt lịch không thành công. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      <style>{`
        @keyframes slideUpFade {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spinBtn {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .icon-spin {
          animation: spinBtn 1.2s linear infinite;
        }
        .stagger-1 { animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both; }
        .stagger-2 { animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both; }
        .hover-scale { transition: transform 0.2s; }
        .hover-scale:hover { transform: scale(1.02); }
        .summary-card { transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); }
        .summary-card:hover { transform: translateY(-5px); box-shadow: 0 25px 50px rgba(0,0,0,0.3); }
        .booking-service-scroll {
          position: relative;
          max-height: 332px;
          overflow-y: scroll;
          overflow-x: hidden;
          padding: 2px 20px 42px 2px;
          margin-right: -12px;
          scroll-behavior: smooth;
          scrollbar-gutter: stable;
          border-radius: 24px;
          border: 1px solid rgba(34, 211, 238, 0.12);
          background: rgba(15, 23, 42, 0.16);
        }
        .booking-service-scroll::-webkit-scrollbar {
          width: 10px;
        }
        .booking-service-scroll::-webkit-scrollbar-track {
          background: rgba(34, 211, 238, 0.08);
          border-radius: 999px;
        }
        .booking-service-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, var(--primary), #14b8a6);
          border-radius: 999px;
          border: 2px solid rgba(15, 23, 42, 0.9);
        }
        .booking-service-list {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }
        .booking-service-list .service-card-select {
          min-height: 103px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .booking-service-fade {
          pointer-events: none;
          position: absolute;
          left: 2px;
          right: 18px;
          bottom: 0;
          height: 88px;
          background: linear-gradient(to bottom, rgba(15, 23, 42, 0), rgba(15, 23, 42, 0.88) 74%);
          border-radius: 0 0 22px 22px;
          transition: opacity 0.22s ease;
        }
        .booking-service-more-hint {
          pointer-events: none;
          position: absolute;
          left: 50%;
          bottom: 13px;
          transform: translateX(-50%);
          padding: 8px 16px;
          border-radius: 999px;
          background: rgba(34, 211, 238, 0.18);
          border: 1px solid rgba(34, 211, 238, 0.38);
          color: var(--primary);
          font-size: 0.78rem;
          font-weight: 900;
          letter-spacing: 0.3px;
          backdrop-filter: blur(10px);
          box-shadow: 0 10px 28px rgba(34, 211, 238, 0.16);
          white-space: nowrap;
          transition: opacity 0.22s ease, transform 0.22s ease;
        }
        .booking-service-count {
          color: var(--gray-400);
          font-size: 0.78rem;
          font-weight: 800;
          margin-left: 8px;
        }
        @media (max-width: 900px) {
          .booking-service-list {
            grid-template-columns: 1fr;
          }
          .booking-service-scroll {
            max-height: 462px;
          }
        }
      `}</style>
      <div className="stagger-1" style={{ display: 'block', width: '100%', margin: '10px 0 40px 0', padding: '48px', borderRadius: '32px', background: 'var(--secondary-gradient)', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-xl)', zIndex: 1 }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '300px', height: '300px', background: 'radial-gradient(circle, var(--primary-light) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '250px', height: '250px', background: 'radial-gradient(circle, var(--primary-light) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none', opacity: 0.5 }}></div>
        <h1 style={{ fontSize: '3rem', fontWeight: 950, letterSpacing: '-2px', position: 'relative', zIndex: 1, margin: '0 0 12px 0', textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>Đặt lịch khám 📅</h1>
        <p style={{ fontWeight: 600, color: 'rgba(255,255,255,0.7)', position: 'relative', zIndex: 1, margin: 0, fontSize: '1.1rem', maxWidth: '600px' }}>Mang đến dịch vụ chăm sóc y tế chuẩn quốc tế cho người bạn nhỏ của bạn ngay tại Rexi.</p>
      </div>

      <div className="stagger-2" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px', alignItems: 'start' }}>
        <form className="glass-card" style={{ padding: '40px', borderRadius: 'var(--radius-xl)', display: 'grid', gap: '32px' }} onSubmit={handleBooking}>
          <div style={{ display: 'grid', gap: '12px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--gray-400)', letterSpacing: '1px' }}>1. CHỌN THÚ CƯNG <span style={{ color: '#ff4d4f' }}>*</span></label>
            {pets.length === 0 ? (
              <div style={{ padding: '24px', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '20px', border: '1px dashed var(--accent)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '1rem', fontWeight: 700 }}>Bạn chưa có hồ sơ thú cưng nào.</span>
                <Link to="/khach-hang/quan-ly-thu-cung" className="btn btn-primary btn-pill" style={{ padding: '10px 24px', textDecoration: 'none', fontSize: '0.9rem' }}>+ Thêm bé ngay</Link>
              </div>
            ) : (
              <select data-ai-id="select-datlichhen-688p" required value={idThuCung} onChange={e => setIdThuCung(e.target.value)}>
                <option value="">-- Danh sách bé nhà mình --</option>
                {pets.map(p => <option key={p.id_thu_cung} value={p.id_thu_cung}>{p.ten_thu_cung} ({p.loai})</option>)}
              </select>
            )}
          </div>

          <div style={{ display: 'grid', gap: '12px' }}>
            <label>
              2. CHỌN DỊCH VỤ <span style={{ color: '#ff4d4f' }}>*</span>
              {services.length > 6 && <span className="booking-service-count">({services.length} dịch vụ, kéo trong khung để xem thêm)</span>}
            </label>
            <div style={{ position: 'relative' }}>
              <div className="booking-service-scroll" aria-label="Danh sách dịch vụ có thể cuộn" onScroll={handleServiceScroll}>
                <div className="booking-service-list">
                  {services.map(s => (
                    <div key={s.id_dich_vu} data-ai-id={`div-datlichhen-service-${s.id_dich_vu}`} className={`service-card-select ${idDichVu === String(s.id_dich_vu) ? 'selected' : ''}`} onClick={() => setIdDichVu(String(s.id_dich_vu))}>
                      <div style={{ fontWeight: 800, color: idDichVu === String(s.id_dich_vu) ? 'var(--primary)' : 'var(--ink)', fontSize: '1.05rem', marginBottom: '4px' }}>{s.ten_dich_vu}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--gray-400)', fontWeight: 700 }}>{s.gia > 0 ? `Từ ${formatTienVND(s.gia)}` : 'Theo thực tế'}</div>
                    </div>
                  ))}
                </div>
              </div>
              {services.length > 6 && (
                <>
                  <div className="booking-service-fade" style={{ opacity: serviceScrollHintOpacity }} />
                  <div
                    className="booking-service-more-hint"
                    style={{
                      opacity: serviceScrollHintOpacity,
                      transform: `translateX(-50%) translateY(${(1 - serviceScrollHintOpacity) * 8}px)`,
                    }}
                  >
                    Cuộn xuống để xem thêm dịch vụ
                  </div>
                </>
              )}
            </div>
          </div>

          <div style={{ display: 'grid', gap: '12px' }}>
            <label>3. CHỌN BÁC SĨ & NGÀY KHÁM</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }}>
              <select data-ai-id="select-datlichhen-33v9" value={idBacSi} onChange={e => setIdBacSi(e.target.value)} disabled={!date}>
                <option value="">{date ? "-- Bác sĩ khám (Tùy chọn) --" : "-- Vui lòng chọn ngày khám trước --"}</option>
                {doctors.map(d => <option key={d.id_nhan_vien} value={d.id_nhan_vien}>{d.ho_ten} ({d.chuyen_mon})</option>)}
              </select>
              <div style={{ display: 'grid', gap: '8px' }}>
                <input data-ai-id="input-datlichhen-mc0h" required type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '16px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--gray-400)', letterSpacing: '1px' }}>4. CHỌN KHUNG GIỜ <span style={{ color: '#ff4d4f' }}>*</span></label>
            {!date || !idDichVu ? (
              <div style={{ padding: '24px', background: 'var(--gray-50)', borderRadius: '20px', border: '1px dashed var(--gray-200)', color: 'var(--gray-400)', textAlign: 'center', fontWeight: 600 }}>
                Vui lòng chọn Dịch vụ and Ngày để xem giờ rảnh.
              </div>
            ) : loadingSlots ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}><div className="dot-pulse"></div></div>
            ) : availableSlots.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {availableSlots.map(t => {
                  return (
                    <button data-ai-id="button-datlichhen-rvj4"
                      key={t}
                      type="button"
                      onClick={() => setTime(t)}
                      style={{
                        padding: '12px 20px',
                        borderRadius: '14px',
                        border: time === t ? '2px solid var(--primary)' : '1px solid var(--gray-200)',
                        background: time === t ? 'var(--primary-light)' : 'var(--surface)',
                        color: time === t ? 'var(--primary)' : 'var(--ink)',
                        fontWeight: 800,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontSize: '0.9rem',
                      }}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '24px', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '20px', border: '1px dashed var(--accent)', color: 'var(--accent)', textAlign: 'center', fontWeight: 700 }}>
                Rất tiếc! Đã hết lịch trống cho ngày này hoặc dịch vụ bạn chọn yêu cầu thời gian dài hơn các ca trống còn lại. Hãy thử chọn ngày/bác sĩ khác nhé!
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gap: '12px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--gray-400)' }}>5. TRIỆU CHỨNG / GHI CHÚ</label>
            <textarea data-ai-id="textarea-datlichhen-note" className="btn" style={{ background: 'var(--gray-50)', textAlign: 'left', minHeight: '100px', padding: '16px', lineHeight: '1.6', borderRadius: '16px', border: '1px solid var(--gray-200)', outline: 'none' }} placeholder="Mô tả tình trạng bé hoặc các yêu cầu đặc biệt..." value={note} onChange={e => setNote(e.target.value)} />
          </div>

          <button data-ai-id="button-datlichhen-66iq" type="submit" className="btn btn-primary btn-pill" disabled={loading} style={{ padding: '16px', fontSize: '1.1rem' }}>
            {loading ? (
              <>
                <span className="material-symbols-outlined icon-spin">autorenew</span>
                Đang xử lý...
              </>
            ) : 'XÁC NHẬN ĐẶT LỊCH'}
          </button>
        </form>

        <div className="summary-panel" style={{ position: 'sticky', top: '40px' }}>
          <div className="glass-card" style={{ padding: '40px', borderRadius: '40px', boxShadow: 'var(--shadow-2xl)', border: '1px solid rgba(255,255,255,0.1)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: 0, right: 0, width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(15, 157, 138, 0.1) 0%, transparent 70%)', zIndex: 0 }}></div>

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>receipt_long</span>
                </div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 950, margin: 0, color: 'var(--ink)', letterSpacing: '-0.5px' }}>Tóm tắt lịch</h2>
              </div>

              <div style={{ display: 'grid', gap: '32px', position: 'relative' }}>
                {/* Vertical line connector */}
                <div style={{ position: 'absolute', left: '19px', top: '20px', bottom: '20px', width: '2px', background: 'linear-gradient(to bottom, var(--primary) 0%, var(--gray-100) 100%)', opacity: 0.3 }}></div>

                {[
                  { label: 'Thú cưng', value: idThuCung ? pets.find(p => String(p.id_thu_cung) === idThuCung)?.ten_thu_cung : 'Chưa chọn', icon: 'pets', color: '#f59e0b' },
                  { label: 'Dịch vụ', value: dv?.ten_dich_vu || 'Chưa chọn', icon: 'medical_services', color: '#10b981' },
                  { label: 'Bác sĩ', value: idBacSi ? doctors.find(d => String(d.id_nhan_vien) === idBacSi)?.ho_ten : 'Bác sĩ bất kỳ', icon: 'stethoscope', color: '#3b82f6' },
                  { label: 'Thời gian', value: date ? `${date.split('-').reverse().join('/')} ${time ? '• ' + time.substring(0, 5) : ''}` : 'Chưa chọn ngày', icon: 'schedule', color: '#14b8a6' }
                ].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '20px', position: 'relative', zIndex: 1 }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--surface)', border: `2px solid ${item.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color, boxShadow: 'var(--shadow-sm)', flexShrink: 0 }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{item.icon}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '1px' }}>{item.label}</span>
                      <b style={{ fontSize: '1.05rem', color: 'var(--ink)', fontWeight: 800 }}>{item.value}</b>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '48px', padding: '32px', background: 'linear-gradient(135deg, var(--secondary) 0%, #0f172a 100%)', borderRadius: '32px', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%', background: 'url("https://www.transparenttextures.com/patterns/cubes.png")', opacity: 0.05, pointerEvents: 'none' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', position: 'relative' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Phí dự kiến</span>
                  <span className="material-symbols-outlined" style={{ color: 'var(--primary)', fontSize: '24px' }}>info</span>
                </div>
                <div style={{ fontSize: '2.1rem', fontWeight: 950, color: 'white', letterSpacing: '-1px', textShadow: '0 2px 10px rgba(0,0,0,0.3)', position: 'relative', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedPrice}
                </div>
                <div style={{ marginTop: '16px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', fontWeight: 600, fontStyle: 'italic', position: 'relative' }}>
                  * Giá trên mang tính chất tham khảo, có thể thay đổi tùy tình trạng thực tế của bé.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isAutopilotRunning && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          background: 'rgba(15, 23, 42, 0.9)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(15, 157, 138, 0.5)',
          borderRadius: '24px',
          padding: '16px 28px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5), inset 0 0 20px rgba(15, 157, 138, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          color: 'white',
          animation: 'slideUpFade 0.5s ease-out',
          minWidth: '420px'
        }}>
          <div style={{
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: '#10b981',
            boxShadow: '0 0 10px #10b981',
            animation: 'pulse 1.5s infinite'
          }}></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '1px' }}>REXI AI AUTOPILOT ACTIVE (Bước {autopilotStep}/5)</span>
            <span style={{ fontSize: '0.95rem', fontWeight: 800 }}>{autopilotMsg}</span>
          </div>
          <button data-ai-id="button-datlichhen-tr4m" 
            onClick={() => setIsAutopilotRunning(false)} 
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: 'none',
              borderRadius: '50px',
              padding: '6px 12px',
              color: '#ef4444',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            HỦY
          </button>
        </div>
      )}
    </div>
  );
};

export default React.memo(DatLichHen);
