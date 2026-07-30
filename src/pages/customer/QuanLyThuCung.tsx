import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";

// Helper function
const chuyenNgayISO_SangVN = (dateString: string) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN').format(date);
};

const QuanLyThuCung: React.FC = () => {
  const [thuCung, setThuCung] = useState<any[]>([]);
  const [lichHen, setLichHen] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingPet, setEditingPet] = useState<any>(null);
  const [formData, setFormData] = useState({
    ten_thu_cung: "",
    loai: "",
    giong: "",
    gioi_tinh: "Đực",
    ngay_sinh: "",
    mau_sac: "",
    trong_luong: ""
  });

  const fetchUserData = () => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      const id = user.id_khach_hang || user.id;
      
      setLoading(true);
      Promise.all([
        axios.get(`http://localhost:8081/api/thu-cung/khach/${id}`),
        axios.get(`http://localhost:8081/api/lich-hen/khach/${id}`)
      ])
      .then(([thuCungRes, lichHenRes]) => {
        setThuCung(thuCungRes.data);
        setLichHen(lichHenRes.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi lấy dữ liệu:", err);
        setLoading(false);
      });
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleOpenForm = (pet: any = null) => {
    if (pet) {
      setEditingPet(pet);
      setFormData({
        ten_thu_cung: pet.ten_thu_cung || "",
        loai: pet.loai || "",
        giong: pet.giong || "",
        gioi_tinh: pet.gioi_tinh || "Đực",
        ngay_sinh: pet.ngay_sinh ? pet.ngay_sinh.split("T")[0] : "",
        mau_sac: pet.mau_sac || "",
        trong_luong: pet.trong_luong?.toString() || ""
      });
    } else {
      setEditingPet(null);
      setFormData({
        ten_thu_cung: "",
        loai: "",
        giong: "",
        gioi_tinh: "Đực",
        ngay_sinh: "",
        mau_sac: "",
        trong_luong: ""
      });
    }
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userStr = localStorage.getItem("user");
    if (!userStr) return;
    const user = JSON.parse(userStr);
    const idKhachHang = user.id_khach_hang || user.id;

    const payload = {
      ...formData,
      id_khach_hang: idKhachHang,
      trong_luong: formData.trong_luong ? parseFloat(formData.trong_luong) : null
    };

    try {
      if (editingPet) {
        await axios.put(`http://localhost:8081/api/thu-cung/${editingPet.id_thu_cung}`, payload);
      } else {
        await axios.post("http://localhost:8081/api/thu-cung", payload);
      }
      setShowForm(false);
      fetchUserData();
    } catch (err: any) {
      console.error("Lỗi lưu thú cưng:", err);
      const errorMsg = err.response?.data?.message || err.response?.data || err.message || "Không xác định";
      alert("Có lỗi xảy ra khi lưu thông tin: " + JSON.stringify(errorMsg));
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa thú cưng này?")) {
      try {
        await axios.delete(`http://localhost:8081/api/thu-cung/${id}`);
        fetchUserData();
      } catch (err) {
        console.error("Lỗi xóa thú cưng:", err);
        alert("Không thể xóa thú cưng này.");
      }
    }
  };

  const withLastVisit = useMemo(() => {
    return thuCung.map((pet) => {
      const last = lichHen
        .filter((l) => l.id_thu_cung === pet.id_thu_cung && l.trang_thai === "hoan_thanh")
        .sort((a, b) => new Date(b.ngay_kham).getTime() - new Date(a.ngay_kham).getTime())[0];
      return { pet, last };
    });
  }, [thuCung, lichHen]);

  if (loading && thuCung.length === 0) return <div style={{ padding: "32px" }}>Đang tải dữ liệu thú cưng...</div>;

  return (
    <div style={{ padding: "32px", background: "var(--gray-50)", minHeight: "100%" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "36px", fontWeight: "900", color: "var(--ink)", marginBottom: "8px", letterSpacing: "-0.5px" }}>Thú Cưng Của Tôi</h1>
          <p style={{ color: "var(--gray-500)", fontWeight: "500", fontSize: "1.1rem" }}>Quản lý và theo dõi sức khỏe cho các bạn nhỏ của bạn</p>
        </div>
        {!showForm && (
          <button className="btn-book" type="button" onClick={() => handleOpenForm()}>
            <span className="material-symbols-outlined">add_circle</span>
            Thêm thú cưng mới
          </button>
        )}
      </div>

      {showForm && (
        <div className="card" style={{ padding: "32px", marginBottom: "32px", background: "white", maxWidth: "800px", border: "2px solid var(--teal-light)" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "900", marginBottom: "24px", color: "var(--ink)" }}>
            {editingPet ? "Cập nhật thông tin bé" : "Thêm bé mới vào đại gia đình"}
          </h2>
          <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div style={{ display: "grid", gap: "8px" }}>
              <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--gray-500)" }}>Tên bé</label>
              <input required type="text" value={formData.ten_thu_cung} onChange={(e) => setFormData({...formData, ten_thu_cung: e.target.value})} style={{ padding: "12px", borderRadius: "12px", border: "1.5px solid var(--gray-100)", outline: "none" }} />
            </div>
            <div style={{ display: "grid", gap: "8px" }}>
              <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--gray-500)" }}>Loài (Chó, mèo, thỏ...)</label>
              <input required type="text" value={formData.loai} onChange={(e) => setFormData({...formData, loai: e.target.value})} style={{ padding: "12px", borderRadius: "12px", border: "1.5px solid var(--gray-100)", outline: "none" }} />
            </div>
            <div style={{ display: "grid", gap: "8px" }}>
              <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--gray-500)" }}>Giống</label>
              <input type="text" value={formData.giong} onChange={(e) => setFormData({...formData, giong: e.target.value})} style={{ padding: "12px", borderRadius: "12px", border: "1.5px solid var(--gray-100)", outline: "none" }} />
            </div>
            <div style={{ display: "grid", gap: "8px" }}>
              <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--gray-500)" }}>Giới tính</label>
              <select value={formData.gioi_tinh} onChange={(e) => setFormData({...formData, gioi_tinh: e.target.value})} style={{ padding: "12px", borderRadius: "12px", border: "1.5px solid var(--gray-100)", outline: "none" }}>
                <option value="Đực">Đực</option>
                <option value="Cái">Cái</option>
              </select>
            </div>
            <div style={{ display: "grid", gap: "8px" }}>
              <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--gray-500)" }}>Ngày sinh</label>
              <input type="date" value={formData.ngay_sinh} onChange={(e) => setFormData({...formData, ngay_sinh: e.target.value})} style={{ padding: "12px", borderRadius: "12px", border: "1.5px solid var(--gray-100)", outline: "none" }} />
            </div>
            <div style={{ display: "grid", gap: "8px" }}>
              <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--gray-500)" }}>Cân nặng (kg)</label>
              <input type="number" step="0.1" value={formData.trong_luong} onChange={(e) => setFormData({...formData, trong_luong: e.target.value})} style={{ padding: "12px", borderRadius: "12px", border: "1.5px solid var(--gray-100)", outline: "none" }} />
            </div>
            <div style={{ gridColumn: "1 / -1", display: "flex", gap: "12px", marginTop: "12px" }}>
              <button type="submit" className="btn-book" style={{ padding: "12px 32px" }}>Xác nhận</button>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: "12px 32px", borderRadius: "12px", background: "var(--gray-100)", border: "none", fontWeight: "700", color: "var(--gray-600)", cursor: "pointer" }}>Hủy bỏ</button>
            </div>
          </form>
        </div>
      )}

      {withLastVisit.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px", color: "var(--gray-500)", background: "white", borderRadius: "24px", boxShadow: "var(--shadow-sm)" }}>
          <span className="material-symbols-outlined" style={{ fontSize: "64px", color: "var(--gray-200)", marginBottom: "16px" }}>pets</span>
          <p style={{ fontSize: "1.1rem", fontWeight: "600" }}>Bạn chưa có thú cưng nào trong hệ thống.</p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
            gap: "24px",
          }}
        >
          {withLastVisit.map(({ pet, last }) => (
            <div
              key={pet.id_thu_cung}
              className="card"
              style={{
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                position: "relative",
                overflow: "hidden"
              }}
            >
              <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                <div
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "24px",
                    backgroundColor: "rgba(15, 157, 138, 0.1)",
                    color: "var(--teal)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: "40px" }}>
                    pets
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ fontSize: "24px", fontWeight: "900", color: "var(--ink)", marginBottom: "4px" }}>{pet.ten_thu_cung}</h3>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "12px", background: "var(--gray-100)", padding: "4px 10px", borderRadius: "8px", fontWeight: "700", color: "var(--gray-600)" }}>
                      {pet.loai || "Chưa rõ"}
                    </span>
                    <span style={{ fontSize: "12px", background: "var(--gray-100)", padding: "4px 10px", borderRadius: "8px", fontWeight: "700", color: "var(--gray-600)" }}>
                      {pet.giong || "Chưa rõ"}
                    </span>
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "var(--gray-50)", padding: "16px", borderRadius: "16px" }}>
                <div>
                  <p style={{ fontSize: "11px", color: "var(--gray-400)", fontWeight: "800", textTransform: "uppercase", marginBottom: "4px" }}>Cân nặng</p>
                  <p style={{ fontSize: "16px", fontWeight: "800", color: "var(--ink)" }}>{pet.trong_luong ?? "—"} kg</p>
                </div>
                <div>
                  <p style={{ fontSize: "11px", color: "var(--gray-400)", fontWeight: "800", textTransform: "uppercase", marginBottom: "4px" }}>Giới tính</p>
                  <p style={{ fontSize: "16px", fontWeight: "800", color: "var(--ink)" }}>{pet.gioi_tinh || "—"}</p>
                </div>
              </div>

              {last && (
                <div style={{ display: "flex", alignItems: "center", gap: "12px", borderTop: "1px dashed var(--gray-200)", paddingTop: "16px" }}>
                  <span className="material-symbols-outlined" style={{ color: "var(--teal)", fontSize: "20px" }}>history</span>
                  <p style={{ fontSize: "13px", color: "var(--gray-600)", fontWeight: "500", margin: 0 }}>
                    Lần khám cuối: <b>{chuyenNgayISO_SangVN(last.ngay_kham)}</b>
                  </p>
                </div>
              )}

              <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
                <button
                  type="button"
                  style={{ flex: 1, padding: "10px", borderRadius: "12px", background: "rgba(15, 157, 138, 0.05)", color: "var(--teal)", fontWeight: "700", border: "none", cursor: "pointer" }}
                  onClick={() => handleOpenForm(pet)}
                >
                  Chỉnh sửa
                </button>
                <button
                  type="button"
                  style={{ padding: "10px", borderRadius: "12px", background: "#fef2f2", color: "#ef4444", border: "none", cursor: "pointer" }}
                  onClick={() => handleDelete(pet.id_thu_cung)}
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default React.memo(QuanLyThuCung);
