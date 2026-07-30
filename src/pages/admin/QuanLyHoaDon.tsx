import React, { useState, useEffect } from "react";
import axios from "axios";
import { formatTienVND } from "@utils/index";

const chuyenNgayISO_SangVN = (dateString: string) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN').format(date);
};

const QuanLyHoaDon: React.FC = () => {
  const [hoaDons, setHoaDons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("http://localhost:8081/api/hoa-don")
      .then(res => {
        setHoaDons(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi lấy danh sách hóa đơn:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ padding: "32px", minHeight: "100%" }}>Đang tải dữ liệu...</div>;

  return (
    <div style={{ padding: "32px", minHeight: "100%" }}>
      <div className="admin-header" style={{ marginBottom: "32px" }}>
        <h1>Quản Lý Hóa Đơn</h1>
        <p className="sec-desc">Theo dõi doanh thu và trạng thái thanh toán của khách hàng.</p>
      </div>

      <div className="table-container">
        <table className="table-premium">
          <thead>
            <tr>
              <th>Mã HD</th>
              <th>Ngày lập</th>
              <th>Khách hàng</th>
              <th style={{ textAlign: "right" }}>Tổng cộng</th>
              <th>Trạng thái</th>
              <th style={{ textAlign: "center" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {hoaDons.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "40px" }}>Chưa có hóa đơn nào.</td>
              </tr>
            ) : hoaDons.map((h) => (
              <tr key={h.id_hoa_don}>
                <td style={{ fontWeight: "700" }}>#HD-{h.id_hoa_don}</td>
                <td>{h.ngay_lap_hoa_don ? chuyenNgayISO_SangVN(h.ngay_lap_hoa_don) : "—"}</td>
                <td style={{ fontWeight: "500" }}>{h.ten_khach_hang || `KH-${h.id_khach_hang}`}</td>
                <td style={{ fontWeight: "900", color: "var(--teal)", textAlign: "right" }}>
                  {formatTienVND(h.tong_tien_cuoi ?? 0)}
                </td>
                <td>
                  <span style={{ 
                    padding: "6px 14px", 
                    borderRadius: "50px", 
                    fontSize: "0.8rem", 
                    fontWeight: "800",
                    background: h.trang_thai === "da_thanh_toan" ? "#dcfce7" : "#fef9c3",
                    color: h.trang_thai === "da_thanh_toan" ? "#15803d" : "#a16207"
                  }}>
                    {h.trang_thai === "da_thanh_toan" ? "Đã thanh toán" : (h.trang_thai || "Chờ thanh toán")}
                  </span>
                </td>
                <td style={{ textAlign: "center" }}>
                  <button className="btn" style={{ padding: "8px", borderRadius: "12px", background: "rgba(15, 157, 138, 0.05)", color: "var(--teal)", border: "none", cursor: "pointer" }} onClick={() => alert("Chức năng xem chi tiết đang phát triển")}>
                    <span className="material-symbols-outlined">visibility</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default React.memo(QuanLyHoaDon);
