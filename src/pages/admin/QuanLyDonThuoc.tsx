import React, { useState, useEffect } from "react";
import axios from "axios";

const QuanLyDonThuoc: React.FC = () => {
  const [donThuocs, setDonThuocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("http://localhost:8081/api/ho-so-benh-an/don-thuoc")
      .then(res => {
        setDonThuocs(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi lấy danh sách đơn thuốc:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ padding: "32px" }}>Đang tải dữ liệu đơn thuốc...</div>;

  return (
    <div style={{ padding: "32px", minHeight: "100%" }}>
      <div className="admin-header" style={{ marginBottom: "32px" }}>
        <h1>Quản Lý Đơn Thuốc</h1>
        <p className="sec-desc">Theo dõi các đơn thuốc đã kê cho bệnh nhân tại phòng khám.</p>
      </div>

      <div className="table-container">
        <table className="table-premium">
          <thead>
            <tr>
              <th>ID Đơn</th>
              <th>Hồ sơ</th>
              <th>Bệnh nhân</th>
              <th>Thuốc</th>
              <th style={{ textAlign: "right" }}>Số lượng</th>
              <th>Cách dùng</th>
              <th>Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            {donThuocs.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "40px" }}>Chưa có đơn thuốc nào.</td>
              </tr>
            ) : donThuocs.map((dt) => (
              <tr key={dt.id_don_thuoc}>
                <td style={{ fontWeight: "700" }}>#DT-{dt.id_don_thuoc}</td>
                <td>HS-{dt.id_ho_so_benh_an}</td>
                <td style={{ fontWeight: "600" }}>{dt.ten_thu_cung || "—"}</td>
                <td style={{ fontWeight: "800", color: "var(--teal)" }}>{dt.ten_thuoc}</td>
                <td style={{ textAlign: "right", fontWeight: "700" }}>{dt.so_luong}</td>
                <td style={{ fontSize: "13px", maxWidth: "200px" }}>{dt.cach_dung}</td>
                <td style={{ fontSize: "13px", color: "var(--gray-500)" }}>{dt.ghi_chu}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default React.memo(QuanLyDonThuoc);
