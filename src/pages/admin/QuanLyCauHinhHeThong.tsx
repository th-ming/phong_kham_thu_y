import React, { useState, useEffect } from "react";
import axios from "axios";

const QuanLyCauHinhHeThong: React.FC = () => {
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("http://localhost:8081/api/system/cau-hinh")
      .then(res => {
        setConfigs(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi lấy cấu hình:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ padding: "32px" }}>Đang tải cấu hình...</div>;

  return (
    <div style={{ padding: "32px", minHeight: "100%" }}>
      <div className="admin-header" style={{ marginBottom: "32px" }}>
        <h1>Cấu Hình Hệ Thống</h1>
        <p className="sec-desc">Thiết lập các tham số vận hành và giới hạn của phòng khám.</p>
      </div>

      <div className="table-container">
        <table className="table-premium">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tham số</th>
              <th>Giá trị</th>
              <th>Diễn giải</th>
            </tr>
          </thead>
          <tbody>
            {configs.map((c) => (
              <tr key={c.id_cau_hinh}>
                <td>#{c.id_cau_hinh}</td>
                <td style={{ fontWeight: "800", color: "var(--teal)", fontFamily: "monospace" }}>{c.ten_cau_hinh}</td>
                <td>
                  <span style={{ padding: "4px 12px", background: "var(--teal-light)", color: "var(--teal)", borderRadius: "8px", fontWeight: "900" }}>
                    {c.gia_tri}
                  </span>
                </td>
                <td style={{ color: "var(--gray-500)", fontSize: "13px" }}>{c.mo_ta}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default React.memo(QuanLyCauHinhHeThong);
