import React, { useMemo, useState, useEffect } from "react";
import axios from "axios";
import { formatTienVND } from "@utils/index";

const DatLichHen: React.FC = () => {
  const [pets, setPets] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  
  const [idThuCung, setIdThuCung] = useState("");
  const [idDichVu, setIdDichVu] = useState("");
  const [idBacSi, setIdBacSi] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      const idKhachHang = user.id_khach_hang || user.id || 1;

      // Lấy danh sách thú cưng của khách
      axios.get(`http://localhost:8081/api/thu-cung/khach/${idKhachHang}`)
        .then(res => setPets(res.data))
        .catch(err => console.error("Lỗi lấy thú cưng:", err));
    }

    // Lấy danh sách bác sĩ
    axios.get("http://localhost:8081/api/bac-si")
      .then(res => setDoctors(res.data))
      .catch(err => console.error("Lỗi lấy bác sĩ:", err));

    // Lấy danh sách dịch vụ
    axios.get("http://localhost:8081/api/dich-vu")
      .then(res => setServices(res.data))
      .catch(err => console.error("Lỗi lấy dịch vụ:", err));
  }, []);

  const dv = useMemo(
    () => services.find((d) => String(d.id_dich_vu) === idDichVu),
    [idDichVu, services],
  );
  const selectedPrice =
    dv == null
      ? "—"
      : dv.gia > 0
        ? `Từ ${formatTienVND(dv.gia)}`
        : "Theo thực tế";

  const dateDisplay = date
    ? `${date.split("-")[2]}/${date.split("-")[1]}/${date.split("-")[0]}`
    : "Chưa chọn";

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const userStr = localStorage.getItem("user");
    let idKhachHang = 1;
    if (userStr) {
      const u = JSON.parse(userStr);
      idKhachHang = u.id_khach_hang || u.id;
    }

    const payload: any = {
      ngay_kham: date,
      gio_kham: time.length === 5 ? `${time}:00` : time,
      ly_do: `${dv?.ten_dich_vu || "Khám bệnh"} - ${note}`,
      id_khach_hang: idKhachHang,
      id_thu_cung: Number(idThuCung),
      id_bac_si: idBacSi && idBacSi !== "" ? Number(idBacSi) : null,
      id_nguoi_dat: idKhachHang, 
      phong_kham: "Phòng khám chính",
      ghi_chu_noi_bo: ""
    };

    try {
      console.log("DỮ LIỆU GỬI ĐI:", JSON.stringify(payload));
      const token = localStorage.getItem("token");
      const res = await axios.post("http://localhost:8081/api/lich-hen", payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = res.data;
      console.log("Phản hồi từ Server:", data);
      
      if (data.Error) {
        window.alert("LỖI HỆ THỐNG: " + data.Error);
      } else if (data.ThongBao) {
        window.alert(data.ThongBao);
        if (data.ThongBao.toLowerCase().includes("thành công")) {
          setIdThuCung(""); setIdDichVu(""); setIdBacSi(""); setDate(""); setTime(""); setNote("");
        }
      } else {
        window.alert("THÔNG BÁO: Đặt lịch hoàn tất!");
        setIdThuCung(""); setIdDichVu(""); setIdBacSi(""); setDate(""); setTime(""); setNote("");
      }
    } catch (error: any) {
      console.error("CHI TIẾT LỖI:", error);
      const status = error.response?.status || "Không có mã";
      const detail = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      window.alert(`YÊU CẦU THẤT BẠI!\n- Mã lỗi: ${status}\n- Chi tiết: ${detail}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "32px", background: "var(--gray-50)", minHeight: "100%" }}>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "36px", fontWeight: "900", color: "var(--ink)", marginBottom: "8px", letterSpacing: "-0.5px" }}>Đặt Lịch Khám</h1>
        <p style={{ color: "var(--gray-500)", fontWeight: "500", fontSize: "1.1rem" }}>
          Chọn dịch vụ và thời gian phù hợp cho thú cưng của bạn.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
        <form
          className="card"
          style={{ padding: "32px", display: "grid", gap: "24px", background: "white" }}
          onSubmit={handleBooking}
        >
          <div style={{ display: "grid", gap: "12px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "800", color: "var(--ink)" }}>1) Chọn thú cưng</h3>
            <select
              style={{ padding: "14px", borderRadius: "16px", border: "1.5px solid var(--gray-100)", outline: "none", fontWeight: "600" }}
              required
              value={idThuCung}
              onChange={(e) => setIdThuCung(e.target.value)}
            >
              <option value="">-- Chọn thú cưng của bạn --</option>
              {pets.map((p) => (
                <option key={p.id_thu_cung} value={p.id_thu_cung}>
                  {p.ten_thu_cung} ({p.loai || "Động vật"} - {p.giong || ""})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gap: "12px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "800", color: "var(--ink)" }}>2) Dịch vụ</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {services.map((s) => (
                <label
                  key={s.id_dich_vu}
                  style={{
                    border: idDichVu === String(s.id_dich_vu) ? "2px solid var(--teal)" : "1.5px solid var(--gray-100)",
                    borderRadius: "16px",
                    padding: "16px",
                    background: idDichVu === String(s.id_dich_vu) ? "rgba(15, 157, 138, 0.05)" : "white",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                    <input
                      type="radio"
                      name="dich_vu"
                      value={s.id_dich_vu}
                      checked={idDichVu === String(s.id_dich_vu)}
                      onChange={() => setIdDichVu(String(s.id_dich_vu))}
                      style={{ accentColor: "var(--teal)" }}
                    />
                    <b style={{ color: "var(--ink)" }}>{s.ten_dich_vu}</b>
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--gray-500)", fontWeight: "700", marginLeft: "24px" }}>
                    {s.gia > 0 ? `Từ ${formatTienVND(s.gia)}` : "Theo thực tế"}
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: "grid", gap: "12px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "800", color: "var(--ink)" }}>3) Bác sĩ & Thời gian</h3>
            <select style={{ padding: "14px", borderRadius: "16px", border: "1.5px solid var(--gray-100)", outline: "none", fontWeight: "600", marginBottom: "12px" }} value={idBacSi} onChange={(e) => setIdBacSi(e.target.value)}>
              <option value="">Để hệ thống sắp xếp bác sĩ phù hợp</option>
              {doctors.map((b) => (
                <option key={b.id_nhan_vien} value={b.id_nhan_vien}>
                  Bác sĩ: {b.ho_ten || b.id_nhan_vien}
                </option>
              ))}
            </select>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <input
                style={{ padding: "14px", borderRadius: "16px", border: "1.5px solid var(--gray-100)", outline: "none", fontWeight: "600" }}
                required
                type="date"
                value={date}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setDate(e.target.value)}
              />
              <select
                style={{ padding: "14px", borderRadius: "16px", border: "1.5px solid var(--gray-100)", outline: "none", fontWeight: "600" }}
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
              >
                <option value="">-- Giờ khám --</option>
                {["08:00", "09:00", "10:00", "11:00", "13:30", "15:00", "16:30", "18:00"].map((slot) => (
                  <option key={slot} value={`${slot}:00`}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <textarea
            style={{ padding: "16px", borderRadius: "16px", border: "1.5px solid var(--gray-100)", outline: "none", fontWeight: "500", fontFamily: "inherit" }}
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Lý do khám hoặc ghi chú thêm cho bác sĩ..."
          />

          <button type="submit" className="btn-book" disabled={loading} style={{ justifyContent: "center", padding: "16px", borderRadius: "16px", fontSize: "16px", opacity: loading ? 0.7 : 1 }}>
            {loading ? "Đang xử lý..." : "Xác nhận đặt lịch ngay"}
          </button>
        </form>

        <div className="card" style={{ padding: "32px", height: "fit-content", position: "sticky", top: "24px", background: "white", border: "1px solid var(--gray-100)" }}>
          <h3 style={{ fontSize: "20px", fontWeight: "900", color: "var(--ink)", marginBottom: "24px", borderBottom: "1px solid var(--gray-100)", paddingBottom: "16px" }}>
            Tóm tắt lịch hẹn
          </h3>
          <div style={{ display: "grid", gap: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "14px", color: "var(--gray-500)", fontWeight: "600" }}>Thú cưng:</span>
              <b style={{ color: "var(--ink)" }}>{idThuCung ? pets.find(p => String(p.id_thu_cung) === idThuCung)?.ten_thu_cung : "—"}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "14px", color: "var(--gray-500)", fontWeight: "600" }}>Dịch vụ:</span>
              <b style={{ color: "var(--ink)" }}>{dv?.ten_dich_vu || "—"}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "14px", color: "var(--gray-500)", fontWeight: "600" }}>Bác sĩ:</span>
              <b style={{ color: "var(--ink)" }}>{idBacSi ? doctors.find(b => String(b.id_nhan_vien) === idBacSi)?.ho_ten : "Hệ thống chọn"}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "14px", color: "var(--gray-500)", fontWeight: "600" }}>Ngày khám:</span>
              <b style={{ color: "var(--ink)" }}>{dateDisplay}</b>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "14px", color: "var(--gray-500)", fontWeight: "600" }}>Giờ khám:</span>
              <b style={{ color: "var(--ink)" }}>{time || "—"}</b>
            </div>
            <div style={{ borderTop: "1px dashed var(--gray-200)", marginTop: "12px", paddingTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "16px", fontWeight: "800", color: "var(--ink)" }}>Phí dự kiến:</span>
              <b style={{ color: "var(--teal)", fontSize: "20px", fontWeight: "900" }}>{selectedPrice}</b>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(DatLichHen);
