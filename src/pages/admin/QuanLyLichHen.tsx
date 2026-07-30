import React, { useState, useEffect } from "react";
import axios from "axios";

// Helpers
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
    case "cho_xac_nhan": return "Chờ xác nhận";
    case "da_xac_nhan": return "Đã xác nhận";
    case "da_kham": return "Đã khám xong";
    case "da_huy": return "Đã hủy";
    default: return status || "Chưa rõ";
  }
};

const QuanLyLichHen: React.FC = () => {
  const [lichHens, setLichHens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("http://localhost:8081/api/lich-hen")
      .then(res => {
        setLichHens(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi lấy danh sách lịch hẹn:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ padding: "32px", minHeight: "100%" }}>Đang tải dữ liệu...</div>;

  return (
    <div style={{ padding: "32px", minHeight: "100%" }}>
      <div className="admin-header" style={{ marginBottom: "32px" }}>
        <h1>Quản Lý Lịch Hẹn</h1>
        <p className="sec-desc">Xem và điều phối tất cả các lịch hẹn khám tại phòng khám.</p>
      </div>

      <div className="admin-actions">
        <button className="btn-book">
          <span className="material-symbols-outlined">add</span>
          Đặt lịch mới
        </button>
      </div>

      <div className="table-container">
        <table className="table-premium">
          <thead>
            <tr>
              <th>ID</th>
              <th>Thời gian</th>
              <th>Thú cưng</th>
              <th>Bác sĩ</th>
              <th>Lý do</th>
              <th>Phòng</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {lichHens.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "40px" }}>Chưa có lịch hẹn nào.</td>
              </tr>
            ) : lichHens.map((l) => (
              <tr key={l.id_lich_hen}>
                <td>#{l.id_lich_hen}</td>
                <td>
                  <div style={{ fontWeight: "800", color: "var(--ink)" }}>{chuyenNgayISO_SangVN(l.ngay_kham)}</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--gray-500)", fontWeight: "500" }}>{gioRutGon(l.gio_kham)}</div>
                </td>
                <td style={{ fontWeight: "700", color: "var(--teal)" }}>{l.ten_thu_cung || "Chưa rõ"}</td>
                <td style={{ fontWeight: "600" }}>{l.ten_bac_si || "Chưa xếp"}</td>
                <td style={{ color: "var(--gray-600)" }}>{l.ly_do || "Khám bệnh"}</td>
                <td>
                  <span style={{ 
                    background: "var(--gray-50)", 
                    padding: "4px 12px", 
                    borderRadius: "8px", 
                    fontWeight: "700",
                    border: "1px solid var(--gray-100)"
                  }}>
                    {l.phong_kham ?? "—"}
                  </span>
                </td>
                <td>
                  <span style={{ 
                    padding: "6px 14px", 
                    borderRadius: "50px", 
                    fontSize: "0.8rem", 
                    fontWeight: "800",
                    background: l.trang_thai === "da_kham" ? "#dcfce7" : l.trang_thai === "cho_xac_nhan" ? "#fef9c3" : (l.trang_thai === "da_huy" ? "#fee2e2" : "#f1f5f9"),
                    color: l.trang_thai === "da_kham" ? "#15803d" : l.trang_thai === "cho_xac_nhan" ? "#a16207" : (l.trang_thai === "da_huy" ? "#b91c1c" : "#475569")
                  }}>
                    {hienThiTrangThaiLich(l.trang_thai)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default React.memo(QuanLyLichHen);
