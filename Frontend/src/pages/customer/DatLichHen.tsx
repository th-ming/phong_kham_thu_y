import React, { useCallback, useMemo, useState, useEffect, useRef } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import axiosInstance from "@services/axios";
import { formatTienVND, getCustomerIdFromProfile, getUserProfile, normalizeUserRole } from "@utils/index";
import { customerToneCopy, isGenZBirthYear } from "@utils/customerTone";
import { toast } from "@components/Toast";
import { useAutoRefresh } from "@hooks/useAutoRefresh";

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

  // Trạng thái của lái tự động (Autopilot) cho /Khách hàng
  const [autopilotStep, setAutopilotStep] = useState(0);
  const [autopilotMsg, setAutopilotMsg] = useState("");
  const [isAutopilotRunning, setIsAutopilotRunning] = useState(false);

  // CHUYỂN GET USER RA NGOÀI CÙNG COMPONENT ĐỂ KHÔNG VI PHẠM LUẬT HOOK
  const user = useMemo(() => getUserProfile(), []);
  const userRole = normalizeUserRole(user);
  const isCustomerUser = userRole === "khach_hang";
  const idKhachHang = getCustomerIdFromProfile(user);
  const isGenZCustomer = isGenZBirthYear(user?.nam_sinh);
  const toneCopy = customerToneCopy[isGenZCustomer ? "genz" : "mature"];

  const currentStep = useMemo(() => {
    if (!idThuCung) return 1;
    if (!idDichVu) return 2;
    if (!date || !time) return 3;
    return 4;
  }, [idThuCung, idDichVu, date, time]);

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
      setAutopilotMsg(isGenZCustomer ? "🤖 [1/5] Thú cưng: Đã chọn em bé nhà Sen!" : "🤖 [1/5] Thú cưng: Đã chọn hồ sơ thú cưng phù hợp.");

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
              // Timeout sau 3 giây nếu ko lấy được slot
              clearInterval(checkSlotsInterval);
      toast.error(isGenZCustomer ? "Không thể tải giờ rảnh tự động. Sen vui lòng chọn giờ thủ công nhé!" : "Không thể tải giờ rảnh tự động. Anh/chị vui lòng chọn giờ thủ công.");
              setIsAutopilotRunning(false);
            }
          }, 200);

        }, 1200);
      }, 1200);
    }, 1500);

  }, [pets, services]);

  const fetchBaseData = useCallback(async () => {
    const requests: Promise<any>[] = [];

    if (idKhachHang) {
      requests.push(axiosInstance.get(`/api/thu-cung/khach/${idKhachHang}`, { params: { page: 0, size: 999 } }).then(res => {
        const data = res.data;
        const petList = Array.isArray(data) ? data : (data.content || data.data || []);
        setPets(petList.filter((pet: any) => pet?.da_xoa !== true && pet?.daXoa !== true));
      }).catch(e => console.error(e)));
    }
    requests.push(axiosInstance.get("/api/dich-vu/active").then(res => setServices(res.data)).catch(e => console.error(e)));

    await Promise.allSettled(requests);
  }, [idKhachHang]);

  useAutoRefresh(fetchBaseData);

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

  const notifyBookingValidationIssue = (message: string) => {
    window.dispatchEvent(new CustomEvent("rexi-booking-validation", {
      detail: { message }
    }));
  };

  const notifyCurrentBookingDraftIssue = () => {
    if (!idThuCung) {
      notifyBookingValidationIssue("Rexi thấy đơn đặt lịch khám còn thiếu thông tin: chưa chọn thú cưng cần khám.");
      return;
    }
    if (!idDichVu) {
      notifyBookingValidationIssue("Rexi thấy đơn đặt lịch khám còn thiếu thông tin: chưa chọn dịch vụ khám.");
      return;
    }
    if (!date) {
      notifyBookingValidationIssue("Rexi thấy đơn đặt lịch khám còn thiếu thông tin: chưa chọn ngày khám.");
      return;
    }
    if (!time) {
      notifyBookingValidationIssue("Rexi thấy đơn đặt lịch khám còn thiếu thông tin: chưa chọn khung giờ khám.");
    }
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
      notifyBookingValidationIssue("Rexi thấy đơn đặt lịch khám còn thiếu thông tin: chưa chọn thú cưng cần khám.");
      toast.info("Vui lòng chọn thú cưng cần khám!");
      return;
    }

    if (!selectedPet) {
      toast.error("Thú cưng đã chọn không còn trong hồ sơ của tài khoản này. Vui lòng tải lại trang!");
      return;
    }

    if (!formIdDichVu) {
      notifyBookingValidationIssue("Rexi thấy đơn đặt lịch khám còn thiếu thông tin: chưa chọn dịch vụ khám.");
      toast.info("Vui lòng chọn một dịch vụ cho bé nhé!");
      return;
    }

    if (!selectedService) {
      toast.error("Dịch vụ đã chọn không còn khả dụng. Vui lòng chọn lại dịch vụ!");
      return;
    }

    if (!formDate) {
      notifyBookingValidationIssue("Rexi thấy đơn đặt lịch khám còn thiếu thông tin: chưa chọn ngày khám.");
      toast.info("Vui lòng chọn ngày khám!");
      return;
    }

    if (!formTime) {
      notifyBookingValidationIssue("Rexi thấy đơn đặt lịch khám còn thiếu thông tin: chưa chọn khung giờ khám.");
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
    <div className="animate-fade-in customer-booking-page">
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
          background: var(--primary-light);
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
          border: 2px solid var(--surface);
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
        @media (max-width: 768px) {
          .customer-booking-page {
            display: grid;
            gap: 20px;
            padding-bottom: 92px;
          }

          .customer-booking-hero {
            margin: 0 !important;
            padding: 24px !important;
            border-radius: 28px !important;
          }

          .customer-booking-hero h1 {
            font-size: 1.75rem !important;
            line-height: 1.08 !important;
            letter-spacing: 0 !important;
          }

          .customer-booking-hero p {
            font-size: 0.9rem !important;
            line-height: 1.55 !important;
          }

          .customer-booking-grid {
            grid-template-columns: 1fr !important;
            gap: 18px !important;
          }

          .customer-booking-form {
            padding: 18px !important;
            border-radius: 26px !important;
            gap: 22px !important;
          }

          .customer-booking-progress {
            overflow-x: auto;
            justify-content: flex-start !important;
            gap: 10px !important;
            padding: 12px !important;
            margin-bottom: 0 !important;
            scrollbar-width: none;
          }

          .customer-booking-progress::-webkit-scrollbar {
            display: none;
          }

          .customer-booking-progress > div {
            min-width: max-content;
          }

          .customer-booking-progress > div:nth-child(even) {
            display: none !important;
          }

          .customer-pet-missing {
            display: grid !important;
            gap: 12px !important;
            align-items: stretch !important;
          }

          .booking-service-scroll {
            max-height: 310px !important;
            padding: 2px 10px 40px 2px !important;
            margin-right: 0 !important;
          }

          .booking-service-list {
            gap: 10px !important;
          }

          .booking-service-list .service-card-select {
            min-height: 84px !important;
            border-radius: 18px !important;
            padding: 14px !important;
          }

          .customer-booking-date-doctor {
            grid-template-columns: 1fr !important;
          }

          .customer-booking-slots {
            display: grid !important;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 9px !important;
          }

          .customer-booking-slots button {
            padding: 11px 8px !important;
            border-radius: 13px !important;
            font-size: 0.82rem !important;
          }

          .customer-booking-submit {
            position: static !important;
            width: 100%;
            margin-top: 2px;
            box-shadow: 0 12px 24px var(--primary-shadow);
          }

          .summary-panel {
            position: static !important;
            margin-top: 10px;
          }

          .customer-booking-summary-card {
            padding: 20px !important;
            border-radius: 26px !important;
            margin-bottom: 34px;
          }

          .customer-booking-form textarea {
            min-height: 132px !important;
          }
        }
        
        .customer-booking-hero {
          --hero-bg-start: #2563eb;
          --hero-bg-mid: #1d4ed8;
          --hero-bg-end: #0ea5e9;
          --hero-shadow-color: rgba(37, 99, 235, 0.22);
          --hero-glow: rgba(14, 165, 233, 0.3);
        }
        
        [data-theme='dark'] .customer-booking-hero {
          --hero-bg-start: #1e3a8a;
          --hero-bg-mid: #172554;
          --hero-bg-end: #0f172a;
          --hero-shadow-color: rgba(30, 58, 138, 0.2);
          --hero-glow: rgba(56, 189, 248, 0.15);
        }
      `}</style>
      <div className="stagger-1 customer-booking-hero" style={{ display: 'block', width: '100%', margin: '10px 0 40px 0', padding: '48px', borderRadius: '32px', background: 'linear-gradient(135deg, var(--hero-bg-start) 0%, var(--hero-bg-mid) 50%, var(--hero-bg-end) 100%)', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 20px 40px var(--hero-shadow-color)', zIndex: 1 }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: '300px', height: '300px', background: 'radial-gradient(circle, var(--hero-glow) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }}></div>
        <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: '250px', height: '250px', background: 'radial-gradient(circle, var(--hero-glow) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none', opacity: 0.5 }}></div>
        <h1 style={{ fontSize: '3rem', fontWeight: 950, letterSpacing: '-2px', position: 'relative', zIndex: 1, margin: '0 0 12px 0', textShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>{toneCopy.bookingTitle}</h1>
        <p style={{ fontWeight: 600, color: 'rgba(255,255,255,0.7)', position: 'relative', zIndex: 1, margin: 0, fontSize: '1.1rem', maxWidth: '600px' }}>{toneCopy.bookingSubtitle}</p>
      </div>

      <div className="stagger-2 responsive-grid-booking customer-booking-grid">
        <form className="glass-card customer-booking-form" style={{ padding: '40px', borderRadius: 'var(--radius-xl)', display: 'grid', gap: '32px' }} onSubmit={handleBooking}>
          {/* 🚀 Thanh Tiến Trình (Progress Steps Bar) chuẩn Wadhah Aloui */}
          <div className="customer-booking-progress" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', background: 'rgba(34, 211, 238, 0.04)', padding: '20px 24px', borderRadius: '24px', border: '1px solid rgba(34, 211, 238, 0.08)' }}>
            {[
              { step: 1, label: 'Bé yêu', icon: 'pets' },
              { step: 2, label: 'Dịch vụ', icon: 'medical_services' },
              { step: 3, label: 'Thời gian & BS', icon: 'schedule' },
              { step: 4, label: 'Xác nhận', icon: 'check_circle' }
            ].map((item, idx) => {
              const isCompleted = currentStep > item.step;
              const isActive = currentStep === item.step;
              return (
                <React.Fragment key={idx}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', opacity: isActive || isCompleted ? 1 : 0.4, transition: 'all 0.3s' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: isCompleted ? 'var(--primary)' : isActive ? 'var(--primary-gradient)' : 'var(--gray-200)',
                      color: isCompleted || isActive ? 'white' : 'var(--gray-400)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      boxShadow: isActive ? '0 8px 16px rgba(34, 211, 238, 0.25)' : 'none'
                    }}>
                      {isCompleted ? '✓' : item.step}
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: isActive || isCompleted ? 800 : 600, color: isActive ? 'var(--primary)' : 'var(--ink)' }}>{item.label}</span>
                  </div>
                  {idx < 3 && <div style={{ flex: 1, height: '2px', background: currentStep > item.step ? 'var(--primary)' : 'var(--gray-200)', margin: '0 12px', opacity: 0.2, transition: 'all 0.3s' }}></div>}
                </React.Fragment>
              );
            })}
          </div>

          <div style={{ display: 'grid', gap: '16px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gray-400)', letterSpacing: '1px', textTransform: 'uppercase' }}>1. CHỌN THÚ CƯNG <span style={{ color: '#ff4d4f' }}>*</span></label>
            {pets.length === 0 ? (
              <div className="customer-pet-missing" style={{ padding: '24px', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '24px', border: '1px dashed var(--accent)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.3s' }}>
                <span style={{ fontSize: '1rem', fontWeight: 800 }}>{isGenZCustomer ? "Sen chưa có hồ sơ boss nào." : "Anh/chị chưa có hồ sơ thú cưng nào."}</span>
                <Link to="/khach-hang/quan-ly-thu-cung" className="btn btn-primary btn-pill" style={{ padding: '10px 24px', textDecoration: 'none', fontSize: '0.9rem', boxShadow: '0 8px 20px rgba(245, 158, 11, 0.25)' }}>{isGenZCustomer ? "+ Thêm boss ngay" : "+ Thêm thú cưng"}</Link>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <select 
                  data-ai-id="select_appointment_pet" 
                  required 
                  value={idThuCung} 
                  onChange={e => setIdThuCung(e.target.value)}
                  style={{ width: '100%', padding: '16px 20px', borderRadius: '16px', border: '1.5px solid var(--gray-200)', background: 'var(--surface)', color: 'var(--ink)', fontWeight: 750, fontSize: '1rem', outline: 'none', transition: 'all 0.3s', boxShadow: 'var(--shadow-sm)' }}
                  onFocus={e => {
                    e.target.style.borderColor = 'var(--primary)';
                    e.target.style.boxShadow = '0 0 0 4px var(--primary-light)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'var(--gray-200)';
                    e.target.style.boxShadow = 'var(--shadow-sm)';
                  }}
                >
                  <option value="">{isGenZCustomer ? "-- Danh sách boss nhà Sen --" : "-- Danh sách thú cưng --"}</option>
                  {pets.map(p => <option key={p.id_thu_cung} value={p.id_thu_cung}>{p.ten_thu_cung} ({p.loai})</option>)}
                </select>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gap: '16px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gray-400)', letterSpacing: '1px', textTransform: 'uppercase' }}>
              2. CHỌN DỊCH VỤ <span style={{ color: '#ff4d4f' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <div className="booking-service-scroll" aria-label="Danh sách dịch vụ có thể cuộn" onScroll={handleServiceScroll}>
                <div className="booking-service-list">
                  {services.map(s => (
                    <div 
                      key={s.id_dich_vu} 
                      data-ai-id={`div-datlichhen-service-${s.id_dich_vu}`} 
                      className={`service-card-select ${idDichVu === String(s.id_dich_vu) ? 'selected' : ''}`} 
                      onClick={() => setIdDichVu(String(s.id_dich_vu))}
                      style={{
                        padding: '20px',
                        borderRadius: '20px',
                        border: idDichVu === String(s.id_dich_vu) ? '2px solid var(--primary)' : '1px solid var(--gray-200)',
                        background: idDichVu === String(s.id_dich_vu) ? 'var(--primary-light)' : 'var(--surface)',
                        cursor: 'pointer',
                        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                        boxShadow: idDichVu === String(s.id_dich_vu) ? '0 12px 28px rgba(34, 211, 238, 0.15)' : 'var(--shadow-sm)'
                      }}
                      onMouseEnter={e => {
                        if (idDichVu !== String(s.id_dich_vu)) {
                          e.currentTarget.style.borderColor = 'rgba(34, 211, 238, 0.5)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }
                      }}
                      onMouseLeave={e => {
                        if (idDichVu !== String(s.id_dich_vu)) {
                          e.currentTarget.style.borderColor = 'var(--gray-200)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }
                      }}
                    >
                      <div style={{ fontWeight: 900, color: idDichVu === String(s.id_dich_vu) ? 'var(--primary)' : 'var(--ink)', fontSize: '1.1rem', marginBottom: '6px' }}>{s.ten_dich_vu}</div>
                      <div style={{ fontSize: '0.88rem', color: 'var(--gray-400)', fontWeight: 800 }}>{s.gia > 0 ? `Từ ${formatTienVND(s.gia)}` : 'Theo thực tế'}</div>
                    </div>
                  ))}
                </div>
              </div>
              {services.length > 6 && (
                <>
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

          <div style={{ display: 'grid', gap: '16px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gray-400)', letterSpacing: '1px', textTransform: 'uppercase' }}>3. CHỌN NGÀY KHÁM & BÁC SĨ MONG MUỐN</label>
            <div className="customer-booking-date-doctor" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <input 
                  data-ai-id="input_appointment_date" 
                  required 
                  type="date" 
                  value={date} 
                  onChange={e => setDate(e.target.value)} 
                  min={new Date().toISOString().split("T")[0]} 
                  style={{ width: '100%', boxSizing: 'border-box', padding: '16px 20px', borderRadius: '16px', border: '1.5px solid var(--gray-200)', background: 'var(--surface)', color: 'var(--ink)', fontWeight: 750, fontSize: '1rem', outline: 'none', transition: 'all 0.3s', boxShadow: 'var(--shadow-sm)' }}
                  onFocus={e => {
                    e.target.style.borderColor = 'var(--primary)';
                    e.target.style.boxShadow = '0 0 0 4px var(--primary-light)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'var(--gray-200)';
                    e.target.style.boxShadow = 'var(--shadow-sm)';
                  }}
                />
              </div>
              <div style={{ position: 'relative' }}>
                <select 
                  data-ai-id="dropdown_doctor" 
                  value={idBacSi} 
                  onChange={e => setIdBacSi(e.target.value)} 
                  disabled={!date}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '16px 20px', borderRadius: '16px', border: '1.5px solid var(--gray-200)', background: 'var(--surface)', color: 'var(--ink)', fontWeight: 750, fontSize: '1rem', outline: 'none', transition: 'all 0.3s', boxShadow: 'var(--shadow-sm)', opacity: date ? 1 : 0.6 }}
                  onFocus={e => {
                    e.target.style.borderColor = 'var(--primary)';
                    e.target.style.boxShadow = '0 0 0 4px var(--primary-light)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'var(--gray-200)';
                    e.target.style.boxShadow = 'var(--shadow-sm)';
                  }}
                >
                  <option value="">{date ? "-- Bác sĩ khám (Tùy chọn) --" : "-- Vui lòng chọn ngày khám trước --"}</option>
                  {doctors.map(d => <option key={d.id_nhan_vien} value={d.id_nhan_vien}>{d.ho_ten} ({d.chuyen_mon})</option>)}
                </select>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '16px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gray-400)', letterSpacing: '1px', textTransform: 'uppercase' }}>4. CHỌN KHUNG GIỜ <span style={{ color: '#ff4d4f' }}>*</span></label>
            {!date || !idDichVu ? (
              <div style={{ padding: '32px 24px', background: 'rgba(34, 211, 238, 0.02)', borderRadius: '24px', border: '1px dashed var(--gray-200)', color: 'var(--gray-450)', textAlign: 'center', fontWeight: 800, fontSize: '0.95rem' }}>
                Vui lòng chọn Dịch vụ và Ngày để xem các ca trống.
              </div>
            ) : loadingSlots ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '30px' }}><div className="dot-pulse"></div></div>
            ) : availableSlots.length > 0 ? (
              <div className="customer-booking-slots" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px' }}>
                {availableSlots.map(t => {
                  const isSelected = time === t;
                  return (
                    <button data-ai-id={`btn_appointment_slot_${t.replace(/[^0-9]/g, '')}`}
                      key={t}
                      type="button"
                      onClick={() => setTime(t)}
                      style={{
                        padding: '14px 10px',
                        borderRadius: '16px',
                        border: isSelected ? '2.5px solid var(--primary)' : '1.5px solid var(--gray-200)',
                        background: isSelected ? 'var(--primary-light)' : 'var(--surface)',
                        color: isSelected ? 'var(--primary)' : 'var(--ink)',
                        fontWeight: 900,
                        cursor: 'pointer',
                        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                        fontSize: '0.95rem',
                        boxShadow: isSelected ? '0 8px 20px rgba(34, 211, 238, 0.12)' : 'var(--shadow-sm)'
                      }}
                      onMouseEnter={e => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = 'rgba(34, 211, 238, 0.5)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = 'var(--gray-200)';
                          e.currentTarget.style.transform = 'translateY(0)';
                        }
                      }}
                    >
                      {t.substring(0, 5)}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '32px 24px', background: 'rgba(239, 68, 68, 0.04)', borderRadius: '24px', border: '1px dashed #ef4444', color: '#ef4444', textAlign: 'center', fontWeight: 800 }}>
                Rất tiếc! Đã hết lịch trống cho ngày này hoặc dịch vụ bạn chọn yêu cầu thời gian dài hơn các ca trống còn lại. Hãy thử chọn ngày/bác sĩ khác nhé!
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gap: '16px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gray-400)', letterSpacing: '1px', textTransform: 'uppercase' }}>5. TRIỆU CHỨNG KHÁM / GHI CHÚ</label>
            <textarea 
              data-ai-id="textarea_symptom" 
              style={{ background: 'var(--gray-50)', textAlign: 'left', minHeight: '130px', padding: '20px', lineHeight: '1.6', borderRadius: '20px', border: '1.5px solid var(--gray-200)', outline: 'none', color: 'var(--ink)', fontWeight: 650, fontSize: '0.95rem', transition: 'all 0.3s', boxShadow: 'var(--shadow-sm) inset' }} 
              placeholder={toneCopy.bookingNotePlaceholder} 
              value={note} 
              onChange={e => setNote(e.target.value)}
              onFocus={e => {
                e.target.style.borderColor = 'var(--primary)';
                e.target.style.background = 'var(--surface)';
                e.target.style.boxShadow = '0 0 0 4px var(--primary-light)';
              }}
              onBlur={e => {
                e.target.style.borderColor = 'var(--gray-200)';
                e.target.style.background = 'var(--gray-50)';
                e.target.style.boxShadow = 'var(--shadow-sm) inset';
              }}
            />
          </div>

          <button 
            data-ai-id="btn_appointment_submit" 
            type="submit" 
            className="btn btn-primary btn-pill customer-booking-submit" 
            disabled={loading} 
            onClick={notifyCurrentBookingDraftIssue} 
            style={{ 
              padding: '18px 30px', 
              fontSize: '1.15rem', 
              fontWeight: 950, 
              letterSpacing: '0.5px', 
              background: 'var(--primary-gradient)', 
              color: 'white', 
              border: 'none',
              borderRadius: '50px',
              boxShadow: '0 12px 28px var(--primary-shadow)',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              transition: 'all 0.3s'
            }}
          >
            {loading ? (
              <>
                <span className="material-symbols-outlined icon-spin">autorenew</span>
                Đang xử lý...
              </>
            ) : 'XÁC NHẬN ĐẶT LỊCH NGAY'}
          </button>
        </form>

        <div className="summary-panel" style={{ position: 'sticky', top: '40px' }}>
          <div className="glass-card customer-booking-summary-card" style={{ padding: '40px', borderRadius: '40px', boxShadow: 'var(--shadow-2xl)', border: '1px solid rgba(255,255,255,0.1)', position: 'relative', overflow: 'hidden' }}>
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

              <div style={{ marginTop: '48px', padding: '32px', background: 'var(--primary-gradient)', borderRadius: '32px', position: 'relative', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', border: '1px solid rgba(255,255,255,0.2)' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '100%', background: 'url("https://www.transparenttextures.com/patterns/cubes.png")', opacity: 0.05, pointerEvents: 'none' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', position: 'relative' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'rgba(255,255,255,0.95)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>Phí dự kiến</span>
                  <span className="material-symbols-outlined" style={{ color: 'rgba(255,255,255,0.95)', fontSize: '24px' }}>info</span>
                </div>
                <div style={{ fontSize: '2.1rem', fontWeight: 950, color: 'white', letterSpacing: '-1px', textShadow: '0 2px 10px rgba(0,0,0,0.3)', position: 'relative', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {selectedPrice}
                </div>
                <div style={{ marginTop: '16px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.9)', fontWeight: 600, fontStyle: 'italic', position: 'relative' }}>
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
