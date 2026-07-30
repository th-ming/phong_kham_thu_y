import React, { useState, useEffect } from "react";
import axios from "axios";

const chuyenNgayISO_SangVN = (dateString: string) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN').format(date);
};

const QuanLyXetNghiem: React.FC = () => {
  const [xetNghiems, setXetNghiems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("http://localhost:8081/api/ho-so-benh-an/xet-nghiem")
      .then(res => {
        setXetNghiems(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi lấy danh sách xét nghiệm:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{ padding: "32px", minHeight: "100%" }}>Đang tải dữ liệu...</div>;

  return (
    <div style={{ padding: "32px", minHeight: "100%" }}>
      <div className="admin-header" style={{ marginBottom: "32px" }}>
        <h1>Quản Lý Xét Nghiệm</h1>
        <p className="sec-desc">Quản lý các chỉ định xét nghiệm, cập nhật kết quả và duyệt kết quả.</p>
      </div>

      <div className="admin-actions">
        <button className="btn-book">
          <span className="material-symbols-outlined">biotech</span>
          Tạo Phiếu Xét Nghiệm Mới
        </button>
      </div>

      <div className="table-container">
        <table className="table-premium">
          <thead>
            <tr>
              <th>Mã XN</th>
              <th>Hồ sơ ID</th>
              <th>Loại xét nghiệm</th>
              <th>Bác sĩ chỉ định</th>
              <th>Ngày lấy mẫu</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {xetNghiems.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "40px" }}>Chưa có phiếu xét nghiệm nào.</td>
              </tr>
            ) : xetNghiems.map(xn => (
              <tr key={xn.id_xet_nghiem_benh_an}>
                <td style={{ fontWeight: "700" }}>#XN-{xn.id_xet_nghiem_benh_an}</td>
                <td>HS-{xn.id_ho_so}</td>
                <td style={{ fontWeight: "600" }}>{xn.ten_xet_nghiem || "Chưa rõ"}</td>
                <td style={{ fontWeight: "600" }}>{xn.ten_bac_si || "Chưa xếp"}</td>
                <td>{xn.ngay_lay_mau ? chuyenNgayISO_SangVN(xn.ngay_lay_mau) : "—"}</td>
                <td>
                  <span style={{ 
                    padding: "6px 14px", 
                    borderRadius: "50px", 
                    fontSize: "0.8rem", 
                    fontWeight: "800",
                    background: xn.trang_thai === 'hoan_thanh' ? '#dcfce7' : '#fef9c3',
                    color: xn.trang_thai === 'hoan_thanh' ? '#15803d' : '#a16207'
                  }}>
                    {xn.trang_thai === 'hoan_thanh' ? 'Hoàn thành' : (xn.trang_thai || "Đang xử lý")}
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

export default React.memo(QuanLyXetNghiem);
