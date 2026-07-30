import React, { useState, useEffect } from "react";
import axios from "axios";

const chuyenNgayISO_SangVN = (dateString: string) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN').format(date);
};

const QuanLyKhoThuoc: React.FC = () => {
  const [thuocs, setThuocs] = useState<any[]>([]);
  const [loThuocs, setLoThuocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get("http://localhost:8081/api/kho/thuoc"),
      axios.get("http://localhost:8081/api/kho/lo-thuoc")
    ])
    .then(([thuocRes, loRes]) => {
      setThuocs(thuocRes.data);
      setLoThuocs(loRes.data);
      setLoading(false);
    })
    .catch(err => {
      console.error("Lỗi lấy dữ liệu kho thuốc:", err);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ padding: "32px", minHeight: "100%" }}>Đang tải dữ liệu kho...</div>;

  return (
    <div style={{ padding: "32px", minHeight: "100%" }}>
      <div className="admin-header" style={{ marginBottom: "32px" }}>
        <h1>Quản Lý Kho Thuốc</h1>
        <p className="sec-desc">Quản lý tồn kho, hạn sử dụng và đơn giá thuốc.</p>
      </div>

      <button className="btn btn-primary" style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }} onClick={() => alert("Tính năng thêm thuốc đang phát triển")}>
        <span className="material-symbols-outlined">add</span>
        Thêm thuốc mới
      </button>

      <div style={{ marginTop: "24px" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--ink)", marginBottom: "16px" }}>Danh sách Thuốc</h2>
        <div className="table-container">
          <table className="table-premium">
            <thead>
              <tr>
                <th>ID</th>
                <th>Tên thuốc</th>
                <th>Thành phần</th>
                <th>Dạng / Đơn vị</th>
                <th style={{ textAlign: "right" }}>Giá bán</th>
              </tr>
            </thead>
            <tbody>
              {thuocs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "40px" }}>Chưa có dữ liệu thuốc.</td>
                </tr>
              ) : thuocs.map(t => (
                <tr key={t.id_thuoc}>
                  <td>#{t.id_thuoc}</td>
                  <td style={{ fontWeight: "800", color: "var(--teal)" }}>{t.ten_thuoc}</td>
                  <td style={{ color: "var(--gray-600)" }}>{t.thanh_phan || "—"}</td>
                  <td style={{ fontWeight: "600" }}>{t.dang_bao_che || "—"} / {t.don_vi || "—"}</td>
                  <td style={{ textAlign: "right", fontWeight: "900", color: "var(--teal)" }}>
                    {t.gia_ban ? t.gia_ban.toLocaleString('vi-VN') : "0"} đ
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginTop: "32px" }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--ink)", marginBottom: "16px" }}>Lô Thuốc & Tồn Kho</h2>
        <div className="table-container">
          <table className="table-premium">
            <thead>
              <tr>
                <th>Số Lô</th>
                <th>Thuốc ID</th>
                <th>Hạn sử dụng</th>
                <th style={{ textAlign: "right" }}>Tồn kho</th>
              </tr>
            </thead>
            <tbody>
              {loThuocs.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: "40px" }}>Chưa có dữ liệu lô thuốc.</td>
                </tr>
              ) : loThuocs.map(l => (
                <tr key={l.id_lo}>
                  <td style={{ fontWeight: "800" }}>{l.so_lo}</td>
                  <td>#{l.id_thuoc}</td>
                  <td style={{ color: "var(--gray-600)" }}>{l.han_su_dung ? chuyenNgayISO_SangVN(l.han_su_dung) : "—"}</td>
                  <td style={{ 
                    textAlign: "right", 
                    fontWeight: "900", 
                    color: l.so_luong_ton > 10 ? "var(--teal)" : "#ef4444" 
                  }}>
                    {l.so_luong_ton ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default React.memo(QuanLyKhoThuoc);
