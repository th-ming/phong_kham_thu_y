import React, { useMemo, useState, useEffect } from "react";
import axios from "axios";

// Helper functions
const chuyenNgayISO_SangVN = (dateString: string) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN').format(date);
};

const gioRutGon = (timeString: string) => {
  if (!timeString) return "—";
  return timeString.substring(0, 5);
};

const hienThiTrangThaiLich = (status: string) => {
  switch (status) {
    case "da_dat": return "Đã đặt";
    case "cho_xac_nhan": return "Chờ xác nhận";
    case "da_xac_nhan": return "Đã xác nhận";
    case "da_kham": return "Đã khám xong";
    case "da_huy": return "Đã hủy";
    default: return status || "Chưa rõ";
  }
};

const LichSuLichHen: React.FC = () => {
  const [petId, setPetId] = useState("all");
  const [status, setStatus] = useState("all");
  
  const [lichHens, setLichHens] = useState<any[]>([]);
  const [thuCungs, setThuCungs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      const id = user.id_khach_hang;
      
      Promise.all([
        axios.get(`http://localhost:8081/api/lich-hen/khach/${id}`),
        axios.get(`http://localhost:8081/api/thu-cung/khach/${id}`)
      ])
      .then(([lichHenRes, thuCungRes]) => {
        setLichHens(lichHenRes.data);
        setThuCungs(thuCungRes.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi lấy dữ liệu:", err);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const getTenThuCung = (id: number) => {
    const pet = thuCungs.find(p => p.id_thu_cung === id);
    return pet ? pet.ten_thu_cung : `Thú cưng ID: ${id}`;
  };

  const rows = useMemo(() => {
    return lichHens
      .filter((l) => (petId === "all" ? true : String(l.id_thu_cung) === petId))
      .filter((l) => (status === "all" ? true : l.trang_thai === status))
      .sort((a, b) => new Date(b.ngay_kham).getTime() - new Date(a.ngay_kham).getTime());
  }, [lichHens, petId, status]);

  if (loading) return <div style={{ padding: "32px", background: "var(--gray-50)", minHeight: "100%" }}>Đang tải lịch sử...</div>;

  return (
    <div style={{ padding: "32px", background: "var(--gray-50)", minHeight: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "36px", fontWeight: "900", color: "var(--ink)", marginBottom: "8px", letterSpacing: "-0.5px" }}>Lịch Sử Lịch Hẹn</h1>
          <p style={{ color: "var(--gray-500)", fontWeight: "500", fontSize: "1.1rem" }}>Theo dõi các lượt khám và trạng thái lịch hẹn của bạn</p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <select 
            style={{ 
              padding: "12px 20px", 
              borderRadius: "16px", 
              border: "1px solid var(--gray-100)", 
              fontWeight: "700",
              color: "var(--ink)",
              background: "white",
              outline: "none"
            }} 
            value={petId} 
            onChange={(e) => setPetId(e.target.value)}
          >
            <option value="all">Tất cả thú cưng</option>
            {thuCungs.map(pet => (
              <option key={pet.id_thu_cung} value={String(pet.id_thu_cung)}>{pet.ten_thu_cung}</option>
            ))}
          </select>
          <select 
            style={{ 
              padding: "12px 20px", 
              borderRadius: "16px", 
              border: "1px solid var(--gray-100)", 
              fontWeight: "700",
              color: "var(--ink)",
              background: "white",
              outline: "none"
            }} 
            value={status} 
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">Mọi trạng thái</option>
            <option value="da_dat">Đã đặt</option>
            <option value="cho_xac_nhan">Chờ xác nhận</option>
            <option value="da_xac_nhan">Đã xác nhận</option>
            <option value="da_kham">Đã khám xong</option>
            <option value="da_huy">Đã hủy</option>
          </select>
        </div>
      </div>

      <div style={{ display: "grid", gap: "16px" }}>
        {rows.length === 0 ? (
          <div className="card" style={{ padding: "60px", textAlign: "center", background: "white", borderRadius: "24px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "64px", color: "var(--gray-200)", marginBottom: "16px" }}>event_busy</span>
            <p style={{ fontSize: "18px", color: "var(--gray-500)", fontWeight: "600" }}>Không tìm thấy lịch hẹn phù hợp.</p>
          </div>
        ) : rows.map((item) => (
            <div
            key={item.id_lich_hen}
            className="card"
            style={{ 
              padding: "24px", 
              borderLeft: `8px solid ${item.trang_thai === "da_dat" || item.trang_thai === "cho_xac_nhan" ? "#f59e0b" : (item.trang_thai === "da_huy" ? "#ef4444" : "var(--teal)")}`,
              background: "white",
              borderRadius: "16px"
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto", gap: "24px", alignItems: "center" }}>
              <div style={{ 
                width: "56px", 
                height: "56px", 
                background: item.trang_thai === "da_dat" || item.trang_thai === "cho_xac_nhan" ? "#fffbeb" : (item.trang_thai === "da_huy" ? "#fef2f2" : "#e6f7f5"), 
                color: item.trang_thai === "da_dat" || item.trang_thai === "cho_xac_nhan" ? "#d97706" : (item.trang_thai === "da_huy" ? "#ef4444" : "var(--teal)"),
                borderRadius: "16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <span className="material-symbols-outlined" style={{ fontSize: "32px" }}>calendar_today</span>
              </div>
              <div>
                <div style={{ fontWeight: "900", fontSize: "20px", color: "var(--ink)", marginBottom: "4px" }}>
                  {item.ly_do || "Khám bệnh"} — {getTenThuCung(item.id_thu_cung)}
                </div>
                <div style={{ color: "var(--gray-500)", fontSize: "14px", fontWeight: "600" }}>
                  Bác sĩ: <b>{item.ten_bac_si || "Chưa xếp"}</b> {item.phong_kham ? `— ${item.phong_kham}` : ""}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: "900", color: "var(--ink)", fontSize: "18px" }}>{chuyenNgayISO_SangVN(item.ngay_kham)}</div>
                <div style={{ color: "var(--gray-500)", fontSize: "14px", fontWeight: "700" }}>{gioRutGon(item.gio_kham)}</div>
              </div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: "800",
                  textTransform: "uppercase",
                  background: item.trang_thai === "da_dat" || item.trang_thai === "cho_xac_nhan" ? "#fef9c3" : (item.trang_thai === "da_huy" ? "#fee2e2" : "#dcfce7"),
                  color: item.trang_thai === "da_dat" || item.trang_thai === "cho_xac_nhan" ? "#a16207" : (item.trang_thai === "da_huy" ? "#b91c1c" : "#15803d"),
                  borderRadius: "10px",
                  padding: "8px 16px",
                  letterSpacing: "0.05em"
                }}
              >
                {hienThiTrangThaiLich(item.trang_thai)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(LichSuLichHen);
