import React, { useMemo, useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import axiosInstance from "@services/axios";
import { formatTienVND, getUserProfile } from "@utils/index";
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

  // CHUYỂN GET USER RA NGOÀI CÙNG COMPONENT ĐỂ KHÔNG VI PHẠM LUẬT HOOK
  const user = getUserProfile();

  useEffect(() => {
    if (user) {
      const idKhachHang = user?.id_khach_hang || user?.id;
      if (idKhachHang) {
        axiosInstance.get(`/api/thu-cung/khach/${idKhachHang}`, { params: { page: 0, size: 999 } }).then(res => {
          const data = res.data;
          setPets(Array.isArray(data) ? data : (data.content || data.data || []));
        }).catch(e => console.error(e));
      }
    }
    axiosInstance.get("/api/bac-si").then(res => setDoctors(res.data)).catch(e => console.error(e));
    axiosInstance.get("/api/dich-vu/active").then(res => setServices(res.data)).catch(e => console.error(e));
  }, []);

  useEffect(() => {
    if (date && idDichVu) {
      setLoadingSlots(true);
      const bacSiParam = idBacSi || '';
      axiosInstance.get(`/api/lich-hen/gio-ranh?id_nhan_vien=${bacSiParam}&ngay=${date}&id_dich_vu=${idDichVu}`)
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

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();

    const role = String(user?.loai_tai_khoan || '').toLowerCase();
    if (role !== 'khach_hang' && role !== 'customer') {
      toast.error("Tài khoản nội bộ (Admin/Nhân viên) không được phép đặt lịch khám. Vui lòng dùng tài khoản Khách hàng!");
      return;
    }

    if (!idThuCung) {
      toast.info("Vui lòng chọn thú cưng cần khám!");
      return;
    }

    if (!idDichVu) {
      toast.info("Vui lòng chọn một dịch vụ cho bé nhé!");
      return;
    }

    if (!date) {
      toast.info("Vui lòng chọn ngày khám!");
      return;
    }

    if (!time) {
      toast.info("Vui lòng chọn khung giờ khám!");
      return;
    }

    setLoading(true);
    const idKhachHang = user?.id_khach_hang || user?.id;
    if (!idKhachHang) {
      toast.error("Không tìm thấy thông tin tài khoản. Vui lòng đăng nhập lại!");
      setLoading(false);
      return;
    }

    const payload = {
      ngay_kham: date,
      gio_kham: time.length === 5 ? `${time}:00` : time,
      ly_do: dv?.ten_dich_vu || "Khám bệnh",
      ghi_chu: note,
      id_khach_hang: idKhachHang,
      id_thu_cung: idThuCung,
      id_bac_si: idBacSi || null,
      id_dich_vu: idDichVu,
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
              <select required value={idThuCung} onChange={e => setIdThuCung(e.target.value)}>
                <option value="">-- Danh sách bé nhà mình --</option>
                {pets.map(p => <option key={p.id_thu_cung} value={p.id_thu_cung}>{p.ten_thu_cung} ({p.loai})</option>)}
              </select>
            )}
          </div>

          <div style={{ display: 'grid', gap: '12px' }}>
            <label>2. CHỌN DỊCH VỤ <span style={{ color: '#ff4d4f' }}>*</span></label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              {services.map(s => (
                <div key={s.id_dich_vu} className={`service-card-select ${idDichVu === String(s.id_dich_vu) ? 'selected' : ''}`} onClick={() => setIdDichVu(String(s.id_dich_vu))}>
                  <div style={{ fontWeight: 800, color: idDichVu === String(s.id_dich_vu) ? 'var(--primary)' : 'var(--ink)', fontSize: '1.05rem', marginBottom: '4px' }}>{s.ten_dich_vu}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--gray-400)', fontWeight: 700 }}>{s.gia > 0 ? `Từ ${formatTienVND(s.gia)}` : 'Theo thực tế'}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gap: '12px' }}>
            <label>3. CHỌN BÁC SĨ & NGÀY KHÁM</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }}>
              <select value={idBacSi} onChange={e => setIdBacSi(e.target.value)}>
                <option value="">-- Bác sĩ khám (Tùy chọn) --</option>
                {doctors.map(d => <option key={d.id_nhan_vien} value={d.id_nhan_vien}>{d.ho_ten} ({d.chuyen_mon})</option>)}
              </select>
              <div style={{ display: 'grid', gap: '8px' }}>
                <input required type="date" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '16px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--gray-400)', letterSpacing: '1px' }}>4. CHỌN KHUNG GIỜ <span style={{ color: '#ff4d4f' }}>*</span></label>
            {!date || !idDichVu ? (
              <div style={{ padding: '24px', background: 'var(--gray-50)', borderRadius: '20px', border: '1px dashed var(--gray-200)', color: 'var(--gray-400)', textAlign: 'center', fontWeight: 600 }}>
                Vui lòng chọn Dịch vụ và Ngày để xem giờ rảnh.
              </div>
            ) : loadingSlots ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}><div className="dot-pulse"></div></div>
            ) : availableSlots.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                {availableSlots.map(t => {
                  return (
                    <button
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
            <textarea className="btn" style={{ background: 'var(--gray-50)', textAlign: 'left', minHeight: '100px', padding: '16px', lineHeight: '1.6', borderRadius: '16px', border: '1px solid var(--gray-200)', outline: 'none' }} placeholder="Mô tả tình trạng bé hoặc các yêu cầu đặc biệt..." value={note} onChange={e => setNote(e.target.value)} />
          </div>

          <button type="submit" className="btn btn-primary btn-pill" disabled={loading} style={{ padding: '16px', fontSize: '1.1rem' }}>
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
                  { label: 'Thời gian', value: date ? `${date.split('-').reverse().join('/')} ${time ? '• ' + time.substring(0, 5) : ''}` : 'Chưa chọn ngày', icon: 'schedule', color: '#8b5cf6' }
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
    </div>
  );
};

export default React.memo(DatLichHen);
