import React, { useState, useEffect } from "react";
import axios from "axios";

const chuyenNgayISO_SangVN = (dateString: string) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN').format(date);
};

const QuanLyHoSoBenhAn: React.FC = () => {
  const [hoSos, setHoSos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("http://localhost:8081/api/ho-so-benh-an")
      .then(res => {
        setHoSos(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi lấy danh sách hồ sơ:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ padding: "32px", minHeight: "100%" }}>Đang tải dữ liệu...</div>;

  return (
    <div style={{ padding: "32px", minHeight: "100%" }}>
      <div className="admin-header" style={{ marginBottom: "32px" }}>
        <h1>Hồ Sơ Bệnh Án</h1>
        <p className="sec-desc">Danh sách bệnh án điện tử của tất cả thú cưng.</p>
      </div>

      <div className="table-container">
        <table className="table-premium">
          <thead>
            <tr>
              <th>ID</th>
              <th>Ngày khám</th>
              <th>Thú cưng</th>
              <th>Bác sĩ</th>
              <th>Chẩn đoán</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {hoSos.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "40px" }}>Chưa có hồ sơ bệnh án nào.</td>
              </tr>
            ) : hoSos.map((h) => {
              return (
                <tr key={h.id_ho_so}>
                  <td>#{h.id_ho_so}</td>
                  <td style={{ fontWeight: "700" }}>{h.ngay_kham ? chuyenNgayISO_SangVN(h.ngay_kham) : "—"}</td>
                  <td style={{ fontWeight: "800", color: "var(--teal)" }}>
                    {h.ten_thu_cung || "Chưa rõ"}
                  </td>
                  <td style={{ fontWeight: "600" }}>{h.ten_bac_si || "Chưa rõ"}</td>
                  <td style={{ color: "var(--gray-600)" }}>{h.chan_doan || "—"}</td>
                  <td>
                    <span style={{ 
                      padding: "6px 14px", 
                      borderRadius: "50px", 
                      fontSize: "0.8rem", 
                      fontWeight: "800",
                      background: h.trang_thai_ho_so === "hoan_tat" ? "#dcfce7" : "#f1f5f9",
                      color: h.trang_thai_ho_so === "hoan_tat" ? "#15803d" : "#475569"
                    }}>
                      {h.trang_thai_ho_so === "hoan_tat" ? "Hoàn tất" : (h.trang_thai_ho_so || "Lưu nháp")}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default React.memo(QuanLyHoSoBenhAn);
