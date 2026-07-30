import React, { useState, useEffect } from "react";
import axios from "axios";

const QuanLyChucNang: React.FC = () => {
  const [chucNangs, setChucNangs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("http://localhost:8081/api/system/chuc-nang")
      .then(res => {
        setChucNangs(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi lấy danh sách chức năng:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ padding: "32px" }}>Đang tải dữ liệu hệ thống...</div>;

  return (
    <div style={{ padding: "32px", minHeight: "100%" }}>
      <div className="admin-header" style={{ marginBottom: "32px" }}>
        <h1>Quản Lý Chức Năng</h1>
        <p className="sec-desc">Danh mục các tính năng và quyền hạn trong hệ thống quản trị.</p>
      </div>

      <div className="table-container">
        <table className="table-premium">
          <thead>
            <tr>
              <th>ID</th>
              <th>Mã chức năng</th>
              <th>Tên chức năng</th>
              <th>Mô tả</th>
            </tr>
          </thead>
          <tbody>
            {chucNangs.map((cn) => (
              <tr key={cn.id_chuc_nang}>
                <td style={{ fontWeight: "700" }}>#{cn.id_chuc_nang}</td>
                <td style={{ fontWeight: "800", color: "var(--teal)", fontFamily: "monospace" }}>{cn.ma_chuc_nang}</td>
                <td style={{ fontWeight: "700" }}>{cn.ten_chuc_nang}</td>
                <td style={{ color: "var(--gray-500)", fontSize: "13px" }}>{cn.mo_ta}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default React.memo(QuanLyChucNang);
