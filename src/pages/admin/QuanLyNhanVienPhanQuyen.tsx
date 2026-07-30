import React, { useState, useEffect } from "react";
import axios from "axios";

const QuanLyNhanVienPhanQuyen: React.FC = () => {
  const [nhanViens, setNhanViens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("http://localhost:8081/api/nhan-vien")
      .then(res => {
        setNhanViens(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi lấy danh sách nhân viên:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ padding: "32px", minHeight: "100%" }}>Đang tải danh sách nhân sự...</div>;

  return (
    <div style={{ padding: "32px", minHeight: "100%" }}>
      <div className="admin-header" style={{ marginBottom: "24px" }}>
        <h1>Nhân Viên & Phân Quyền</h1>
        <p className="sec-desc">Quản lý đội ngũ y bác sĩ và quyền truy cập hệ thống.</p>
      </div>

      <div className="table-container" style={{ background: "white", borderRadius: "12px", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead style={{ background: "var(--gray-50)", borderBottom: "1px solid var(--gray-200)" }}>
            <tr>
              <th style={{ padding: "16px", textAlign: "left", fontSize: "0.85rem", color: "var(--gray-600)" }}>ID</th>
              <th style={{ padding: "16px", textAlign: "left", fontSize: "0.85rem", color: "var(--gray-600)" }}>Họ tên</th>
              <th style={{ padding: "16px", textAlign: "left", fontSize: "0.85rem", color: "var(--gray-600)" }}>Số điện thoại</th>
              <th style={{ padding: "16px", textAlign: "left", fontSize: "0.85rem", color: "var(--gray-600)" }}>Trạng thái</th>
              <th style={{ padding: "16px", textAlign: "center", fontSize: "0.85rem", color: "var(--gray-600)" }}>Vai trò</th>
            </tr>
          </thead>
          <tbody>
            {nhanViens.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", padding: "40px" }}>Chưa có nhân viên nào.</td>
              </tr>
            ) : nhanViens.map((b) => (
              <tr key={b.id_nhan_vien} style={{ borderBottom: "1px solid var(--gray-100)" }}>
                <td style={{ padding: "16px", fontSize: "0.875rem" }}>{b.id_nhan_vien}</td>
                <td style={{ padding: "16px", fontSize: "0.875rem", fontWeight: "700" }}>{b.ho_ten}</td>
                <td style={{ padding: "16px", fontSize: "0.875rem" }}>{b.so_dien_thoai || "—"}</td>
                <td style={{ padding: "16px" }}>
                  <span style={{ 
                    padding: "4px 10px", 
                    borderRadius: "50px", 
                    fontSize: "0.75rem", 
                    fontWeight: "700",
                    background: b.trang_thai === "dang_lam" ? "#e6f7f5" : "#fff4e5",
                    color: b.trang_thai === "dang_lam" ? "#0f9d8a" : "#f5a623"
                  }}>
                    {b.trang_thai === "dang_lam" ? "Đang làm việc" : (b.trang_thai || "Đang làm việc")}
                  </span>
                </td>
                <td style={{ padding: "16px", textAlign: "center" }}>
                  <span style={{ fontSize: "0.8rem", color: "var(--gray-600)", fontWeight: "600", padding: "4px 8px", background: "var(--gray-50)", borderRadius: "8px" }}>
                    {b.chuyen_mon || "Nhân viên"}
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

export default React.memo(QuanLyNhanVienPhanQuyen);
