import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";

interface DichVu {
  id_dich_vu: number;
  ten_dich_vu: string;
  mo_ta: string;
  gia: number;
  thoi_luong_phut?: number;
  trang_thai: boolean;
}

const QuanLyDichVu: React.FC = () => {
  const [dichVus, setDichVus] = useState<DichVu[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<DichVu>>({});

  useEffect(() => {
    fetchDichVus();
  }, []);

  const fetchDichVus = () => {
    setLoading(true);
    axios.get("http://localhost:8081/api/dich-vu")
      .then(res => {
        setDichVus(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi lấy danh sách dịch vụ:", err);
        setLoading(false);
      });
  };

  const handleEdit = (dichVu: DichVu) => {
    setEditingId(dichVu.id_dich_vu);
    setFormData(dichVu);
  };

  const handleSave = () => {
    if (editingId) {
      axios.put(`http://localhost:8081/api/dich-vu/${editingId}`, formData)
        .then(() => {
          fetchDichVus();
          setEditingId(null);
          setFormData({});
        })
        .catch(err => console.error("Lỗi cập nhật dịch vụ:", err));
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({});
  };

  const handleAdd = () => {
    axios.post("http://localhost:8081/api/dich-vu", { ...formData, trang_thai: true })
      .then(() => {
        fetchDichVus();
        setFormData({});
      })
      .catch(err => console.error("Lỗi thêm dịch vụ:", err));
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa dịch vụ này?")) {
      axios.delete(`http://localhost:8081/api/dich-vu/${id}`)
        .then(() => fetchDichVus())
        .catch(err => console.error("Lỗi xóa dịch vụ:", err));
    }
  };

  if (loading && dichVus.length === 0) return <div style={{ padding: "32px" }}>Đang tải dữ liệu dịch vụ...</div>;

  return (
    <div style={{ padding: "32px", minHeight: "100%" }}>
      <div className="admin-header" style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1>Quản Lý Dịch Vụ</h1>
          <p className="sec-desc">Thiết lập danh mục dịch vụ và bảng giá niêm yết của phòng khám.</p>
        </div>
        <button
          onClick={() => setFormData({ ten_dich_vu: "", mo_ta: "", gia: 0 })}
          className="btn-book"
        >
          <span className="material-symbols-outlined">add</span>
          Thêm dịch vụ mới
        </button>
      </div>

      {formData.ten_dich_vu !== undefined && (
        <div className="card" style={{ padding: "24px", marginBottom: "32px", background: "white", border: "2px solid var(--teal-light)" }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: "800", marginBottom: "20px", color: "var(--ink)" }}>
            {editingId ? "Chỉnh sửa dịch vụ" : "Thêm dịch vụ mới"}
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "20px", marginBottom: "20px" }}>
            <div style={{ display: "grid", gap: "8px" }}>
              <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--gray-500)" }}>Tên dịch vụ</label>
              <input
                type="text"
                value={formData.ten_dich_vu || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, ten_dich_vu: e.target.value }))}
                style={{ padding: "12px", borderRadius: "12px", border: "1.5px solid var(--gray-100)", outline: "none" }}
              />
            </div>
            <div style={{ display: "grid", gap: "8px" }}>
              <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--gray-500)" }}>Đơn giá (VND)</label>
              <input
                type="number"
                value={formData.gia || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, gia: Number(e.target.value) }))}
                style={{ padding: "12px", borderRadius: "12px", border: "1.5px solid var(--gray-100)", outline: "none" }}
              />
            </div>
            <div style={{ display: "grid", gap: "8px" }}>
              <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--gray-500)" }}>Thời lượng (phút)</label>
              <input
                type="number"
                value={formData.thoi_luong_phut || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, thoi_luong_phut: Number(e.target.value) }))}
                style={{ padding: "12px", borderRadius: "12px", border: "1.5px solid var(--gray-100)", outline: "none" }}
              />
            </div>
            <div style={{ display: "grid", gap: "8px", gridColumn: "1 / -1" }}>
              <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--gray-500)" }}>Mô tả dịch vụ</label>
              <textarea
                value={formData.mo_ta || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, mo_ta: e.target.value }))}
                style={{ padding: "12px", borderRadius: "12px", border: "1.5px solid var(--gray-100)", outline: "none", minHeight: "80px" }}
              />
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              onClick={editingId ? handleSave : handleAdd}
              className="btn-book"
              style={{ padding: "10px 24px" }}
            >
              {editingId ? "Lưu thay đổi" : "Xác nhận thêm"}
            </button>
            <button
              onClick={handleCancel}
              style={{ padding: "10px 24px", borderRadius: "12px", background: "var(--gray-100)", border: "none", fontWeight: "700", color: "var(--gray-600)", cursor: "pointer" }}
            >
              Hủy bỏ
            </button>
          </div>
        </div>
      )}

      <div className="table-container">
        <table className="table-premium">
          <thead>
            <tr>
              <th>ID</th>
              <th>Tên dịch vụ</th>
              <th>Mô tả</th>
              <th style={{ textAlign: "right" }}>Thời lượng</th>
              <th style={{ textAlign: "right" }}>Đơn giá</th>
              <th style={{ textAlign: "center" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {dichVus.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "40px" }}>Chưa có dữ liệu dịch vụ.</td>
              </tr>
            ) : dichVus.map((dv) => (
              <tr key={dv.id_dich_vu}>
                <td>#{dv.id_dich_vu}</td>
                <td style={{ fontWeight: "800", color: "var(--teal)" }}>{dv.ten_dich_vu}</td>
                <td style={{ color: "var(--gray-600)", maxWidth: "300px" }}>{dv.mo_ta}</td>
                <td style={{ textAlign: "right", fontWeight: "600" }}>{dv.thoi_luong_phut || "—"} ph</td>
                <td style={{ textAlign: "right", fontWeight: "900", color: "var(--teal)" }}>
                  {dv.gia ? dv.gia.toLocaleString('vi-VN') : "0"} đ
                </td>
                <td style={{ textAlign: "center" }}>
                  <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                    <button
                      onClick={() => handleEdit(dv)}
                      style={{ padding: "8px", borderRadius: "10px", background: "rgba(15, 157, 138, 0.05)", color: "var(--teal)", border: "none", cursor: "pointer" }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(dv.id_dich_vu)}
                      style={{ padding: "8px", borderRadius: "10px", background: "#fef2f2", color: "#ef4444", border: "none", cursor: "pointer" }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default React.memo(QuanLyDichVu);
