import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

// Hàm tiện ích format
const chuyenNgayISO_SangVN = (isoString: string) => {
  if (!isoString) return "";
  const [y, m, d] = isoString.split("T")[0].split("-");
  return `${d}/${m}/${y}`;
};

const hienThiTrangThaiLich = (tt: string) => {
  if (tt === "da_dat") return "Đã đặt";
  if (tt === "cho_xac_nhan") return "Chờ duyệt";
  if (tt === "da_xac_nhan") return "Đã xác nhận";
  if (tt === "da_kham") return "Đã khám";
  if (tt === "hoan_thanh" || tt === "da_hoan_thanh") return "Hoàn thành";
  if (tt === "da_huy") return "Đã hủy";
  return tt;
};

const formatTienVND = (tien: number) => {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(tien);
};

const DashboardKhachHang: React.FC = () => {
  const [pets, setPets] = useState<any[]>([]);
  const [upcoming, setUpcoming] = useState<any[]>([]);
  const [hoanTat, setHoanTat] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      const idKhachHang = user.id_khach_hang || user.id || 1;

      // Lấy danh sách thú cưng
      axios.get(`http://localhost:8081/api/thu-cung/khach/${idKhachHang}`)
        .then(res => setPets(res.data))
        .catch(err => console.error("Lỗi lấy thú cưng:", err));

      // Lấy lịch hẹn
      axios.get(`http://localhost:8081/api/lich-hen/khach/${idKhachHang}`)
        .then(res => {
          const data = res.data || [];
          const upc = data.filter((l: any) => l.trang_thai === "cho_xac_nhan" || l.trang_thai === "da_xac_nhan");
          setUpcoming(upc.slice(0, 3)); 
          setHoanTat(data.filter((l: any) => l.trang_thai === "hoan_thanh").length);
        })
        .catch(err => console.error("Lỗi lấy lịch hẹn:", err));

      // Lấy hóa đơn để tính tổng chi phí
      axios.get(`http://localhost:8081/api/hoa-don/khach/${idKhachHang}`)
        .then(res => {
          const invoices = res.data || [];
          const total = invoices.reduce((sum: number, inv: any) => sum + (inv.tong_tien_cuoi || 0), 0);
          setTotalSpent(total);
        })
        .catch(err => console.error("Lỗi lấy hóa đơn:", err));
    }
  }, []);

  const stats = useMemo(() => {
    return [
      { label: "Thú cưng", value: String(pets.length), icon: "pets", trend: "+1", color: "#3b82f6" },
      { label: "Lịch hẹn sắp tới", value: String(upcoming.length), icon: "calendar_today", trend: "Mới", color: "#10b981" },
      { label: "Lần khám (hoàn tất)", value: String(hoanTat), icon: "medical_services", trend: "—", color: "#f59e0b" },
      { label: "Tổng chi phí (đã TT)", value: formatTienVND(totalSpent), icon: "payments", trend: "—", color: "#8b5cf6" },
    ];
  }, [pets, upcoming, hoanTat, totalSpent]);

  return (
    <div style={{ padding: "32px", minHeight: "100%", background: "var(--gray-50)" }}>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "36px", fontWeight: "900", color: "var(--ink)", marginBottom: "8px", letterSpacing: "-0.5px" }}>Chào mừng trở lại!</h1>
        <p style={{ color: "var(--gray-500)", fontWeight: "500", fontSize: "1.1rem" }}>
          Hôm nay là ngày tuyệt vời để chăm sóc thú cưng của bạn
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "24px", marginBottom: "32px" }}>
        {stats.map((item) => (
          <div key={item.label} className="card" style={{ padding: "24px", border: "1px solid var(--gray-100)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ width: "48px", height: "48px", background: `${item.color}15`, color: item.color, borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="material-symbols-outlined" style={{ margin: "auto" }}>{item.icon}</span>
              </div>
              <span style={{ fontSize: "12px", fontWeight: "800", background: item.trend.startsWith("+") ? "#dcfce7" : "#f1f5f9", color: item.trend.startsWith("+") ? "#15803d" : "#64748b", padding: "4px 8px", borderRadius: "8px" }}>{item.trend}</span>
            </div>
            <div style={{ fontSize: "28px", fontWeight: "900", color: "var(--ink)", marginBottom: "4px" }}>{item.value}</div>
            <div style={{ fontSize: "13px", color: "var(--gray-500)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em" }}>{item.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "24px", marginBottom: "24px" }}>
        <div className="card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <h3 style={{ fontSize: "22px", fontWeight: "900", color: "var(--ink)" }}>Lịch hẹn sắp tới</h3>
            <Link to="/khach-hang/dat-lich-hen" className="btn-book" style={{ textDecoration: "none" }}>
              Đặt lịch mới
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", background: "var(--gray-50)", borderRadius: "24px" }}>
              <span className="material-symbols-outlined" style={{ fontSize: "48px", color: "var(--gray-300)", marginBottom: "12px" }}>calendar_today</span>
              <p style={{ color: "var(--gray-500)", fontWeight: "600" }}>Bạn chưa có lịch hẹn nào sắp tới.</p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {upcoming.map((item) => (
                <div key={item.id_lich_hen} style={{ background: "white", border: "1px solid var(--gray-100)", borderRadius: "20px", padding: "16px", display: "grid", gridTemplateColumns: "auto 1fr auto auto", alignItems: "center", gap: "16px" }}>
                  <div style={{ width: "40px", height: "40px", background: "var(--teal-light)", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--teal)" }}>
                    <span className="material-symbols-outlined" style={{ margin: "auto" }}>event</span>
                  </div>
                  <div>
                    <div style={{ fontWeight: "800", color: "var(--ink)" }}>{item.ly_do ?? "Khám bệnh"} (ID Thú cưng: {item.id_thu_cung})</div>
                    <div style={{ fontSize: "13px", color: "var(--gray-500)", fontWeight: "500" }}>ID Bác sĩ: {item.id_bac_si || "Chưa phân công"}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontWeight: "800", color: "var(--teal)" }}>{chuyenNgayISO_SangVN(item.ngay_kham)}</div>
                    <div style={{ fontSize: "13px", color: "var(--gray-500)", fontWeight: "600" }}>{item.gio_kham ? item.gio_kham.substring(0,5) : "—"}</div>
                  </div>
                  <div style={{ fontSize: "11px", fontWeight: "800", borderRadius: "8px", padding: "6px 12px", background: item.trang_thai === "cho_xac_nhan" ? "#fef9c3" : "#dcfce7", color: item.trang_thai === "cho_xac_nhan" ? "#a16207" : "#15803d", textTransform: "uppercase" }}>
                    {hienThiTrangThaiLich(item.trang_thai)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
            <h3 style={{ fontSize: "22px", fontWeight: "900", color: "var(--ink)" }}>Hóa đơn gần đây</h3>
            <Link to="/khach-hang/hoa-don-thanh-toan" style={{ fontWeight: "700", color: "var(--teal)", textDecoration: "none", fontSize: "14px" }}>Xem tất cả</Link>
          </div>
          <div style={{ textAlign: "center", padding: "40px", background: "var(--gray-50)", borderRadius: "24px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "48px", color: "var(--gray-300)", marginBottom: "12px" }}>receipt_long</span>
            <p style={{ color: "var(--gray-500)", fontWeight: "600" }}>Chưa có hóa đơn nào.</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
          <h3 style={{ fontSize: "22px", fontWeight: "900", color: "var(--ink)" }}>Thú cưng của tôi</h3>
          <Link to="/khach-hang/quan-ly-thu-cung" style={{ fontWeight: "700", color: "var(--teal)", textDecoration: "none", fontSize: "14px" }}>Quản lý thú cưng</Link>
        </div>
        
        {pets.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", background: "var(--gray-50)", borderRadius: "24px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "48px", color: "var(--gray-300)", marginBottom: "12px" }}>pets</span>
            <p style={{ color: "var(--gray-500)", fontWeight: "600" }}>Bạn chưa thêm thú cưng nào.</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
            {pets.map((pet) => (
              <div key={pet.id_thu_cung} style={{ background: "white", border: "1px solid var(--gray-100)", borderRadius: "24px", padding: "20px", display: "flex", gap: "16px", alignItems: "center" }}>
                <div style={{ width: "56px", height: "56px", background: "rgba(15, 157, 138, 0.05)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--teal)" }}>
                  <span className="material-symbols-outlined" style={{ margin: "auto" }}>pets</span>
                </div>
                <div>
                  <div style={{ fontWeight: "900", color: "var(--ink)", fontSize: "18px" }}>{pet.ten_thu_cung}</div>
                  <div style={{ fontSize: "13px", color: "var(--gray-500)", fontWeight: "600" }}>{pet.loai ?? "—"} — {pet.giong ?? "—"}</div>
                  <div style={{ fontSize: "12px", marginTop: "4px", color: "var(--teal)", fontWeight: "700" }}>Cân nặng: {pet.trong_luong ? `${pet.trong_luong} kg` : "—"}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default React.memo(DashboardKhachHang);
