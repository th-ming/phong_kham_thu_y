import React, { useState, useEffect } from "react";
import axios from "axios";

const QuanLyKhachHangThuCung: React.FC = () => {
  const [thuCung, setThuCung] = useState<any[]>([]);
  const [khachHang, setKhachHang] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get("http://localhost:8081/api/thu-cung"),
      axios.get("http://localhost:8081/api/khach-hang")
    ])
    .then(([thuCungRes, khachHangRes]) => {
      setThuCung(thuCungRes.data);
      setKhachHang(khachHangRes.data);
      setLoading(false);
    })
    .catch(err => {
      console.error("Lỗi tải dữ liệu khách hàng thú cưng:", err);
      setLoading(false);
    });
  }, []);

  const getTenKhachHang = (id: number) => {
    const kh = khachHang.find(k => k.id_khach_hang === id);
    return kh ? kh.ten_khach_hang : `KH-${id}`;
  };

  if (loading) return <div style={{ padding: "32px", minHeight: "100%" }}>Đang tải danh sách thú cưng...</div>;

  return (
    <div style={{ padding: "32px", minHeight: "100%" }}>
      <div className="admin-header" style={{ marginBottom: "32px" }}>
        <h1>Khách Hàng & Thú Cưng</h1>
        <p className="sec-desc">Quản lý thông tin chủ nuôi và danh sách thú cưng của họ.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "32px" }}>
        <section>
          <div className="table-container">
            <table className="table-premium">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tên Thú Cưng</th>
                  <th>Loài / Giống</th>
                  <th>Chủ Sở Hữu</th>
                  <th>Cân Nặng</th>
                </tr>
              </thead>
              <tbody>
                {thuCung.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "40px" }}>Chưa có dữ liệu.</td>
                  </tr>
                ) : thuCung.map((t) => (
                  <tr key={t.id_thu_cung}>
                    <td>#{t.id_thu_cung}</td>
                    <td style={{ fontWeight: "800", color: "var(--teal)" }}>{t.ten_thu_cung}</td>
                    <td style={{ fontWeight: "600" }}>{t.loai || "Chưa rõ"} / {t.giong || "Chưa rõ"}</td>
                    <td style={{ fontWeight: "500", color: "var(--ink)" }}>
                      {getTenKhachHang(t.id_khach_hang)}
                    </td>
                    <td>
                      <span style={{ 
                        background: "rgba(15, 157, 138, 0.05)", 
                        padding: "4px 12px", 
                        borderRadius: "8px", 
                        fontWeight: "700",
                        color: "var(--teal)"
                      }}>
                        {t.trong_luong ?? "—"} kg
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default React.memo(QuanLyKhachHangThuCung);
