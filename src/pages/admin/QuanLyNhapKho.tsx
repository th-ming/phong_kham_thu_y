import React, { useState, useEffect } from "react";
import axios from "axios";

const chuyenNgayISO_SangVN = (dateString: string) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN').format(date);
};

const QuanLyNhapKho: React.FC = () => {
  const [loThuocs, setLoThuocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("http://localhost:8081/api/kho/lo-thuoc")
      .then(res => {
        setLoThuocs(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi lấy lịch sử nhập kho:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ padding: "32px" }}>Đang tải lịch sử nhập kho...</div>;

  return (
    <div style={{ padding: "32px", minHeight: "100%" }}>
      <div className="admin-header" style={{ marginBottom: "32px" }}>
        <h1>Quản Lý Nhập Kho</h1>
        <p className="sec-desc">Lịch sử các lần nhập hàng và cập nhật tồn kho từ nhà cung cấp.</p>
      </div>

      <button className="btn-book" style={{ marginBottom: "24px" }} onClick={() => alert("Tính năng tạo phiếu nhập mới đang phát triển")}>
        <span className="material-symbols-outlined">add_business</span>
        Tạo phiếu nhập kho mới
      </button>

      <div className="table-container">
        <table className="table-premium">
          <thead>
            <tr>
              <th>ID Lô</th>
              <th>Số Lô</th>
              <th>Thuốc ID</th>
              <th>Ngày nhập</th>
              <th>Hạn sử dụng</th>
              <th style={{ textAlign: "right" }}>Số lượng nhập</th>
              <th style={{ textAlign: "right" }}>Giá nhập</th>
            </tr>
          </thead>
          <tbody>
            {loThuocs.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "40px" }}>Chưa có lịch sử nhập kho.</td>
              </tr>
            ) : loThuocs.map((l) => (
              <tr key={l.id_lo}>
                <td style={{ fontWeight: "700" }}>#LÔ-{l.id_lo}</td>
                <td style={{ fontWeight: "800", color: "var(--teal)" }}>{l.so_lo}</td>
                <td>#{l.id_thuoc}</td>
                <td>{l.ngay_nhap ? chuyenNgayISO_SangVN(l.ngay_nhap) : "—"}</td>
                <td style={{ color: "var(--gray-600)" }}>{l.han_su_dung ? chuyenNgayISO_SangVN(l.han_su_dung) : "—"}</td>
                <td style={{ textAlign: "right", fontWeight: "700" }}>{l.so_luong_nhap}</td>
                <td style={{ textAlign: "right", fontWeight: "800", color: "var(--teal)" }}>
                  {l.gia_nhap ? l.gia_nhap.toLocaleString('vi-VN') : "0"} đ
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default React.memo(QuanLyNhapKho);
