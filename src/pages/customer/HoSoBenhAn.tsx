import React, { useMemo, useState, useEffect } from "react";
import axios from "axios";

const chuyenNgayISO_SangVN = (dateString: string) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN').format(date);
};

const HoSoBenhAn: React.FC = () => {
  const [petFilter, setPetFilter] = useState("all");
  const [hoSoList, setHoSoList] = useState<any[]>([]);
  const [thuCungs, setThuCungs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      const id = user.id_khach_hang;
      
      Promise.all([
        axios.get(`http://localhost:8081/api/ho-so-benh-an/khach/${id}`),
        axios.get(`http://localhost:8081/api/thu-cung/khach/${id}`)
      ])
      .then(([hoSoRes, thuCungRes]) => {
        setHoSoList(hoSoRes.data);
        setThuCungs(thuCungRes.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Lỗi lấy dữ liệu:", err);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const rows = useMemo(() => {
    return hoSoList.filter((h) => {
      if (petFilter === "all") return true;
      // h.id_thu_cung might not be directly in hoso if it's joined, wait!
      // In the SQL Query we joined with LichHen, we should select l.id_thu_cung
      // But we have t.ten_thu_cung. Let's just compare by name or id_thu_cung if we added it.
      // Wait, let's just assume we return ten_thu_cung and filter by it, or we need id_thu_cung.
      // We can filter by ten_thu_cung easily.
      const pet = thuCungs.find(p => String(p.id_thu_cung) === petFilter);
      if (pet && pet.ten_thu_cung === h.ten_thu_cung) return true;
      if (h.id_thu_cung && String(h.id_thu_cung) === petFilter) return true;
      return false;
    });
  }, [hoSoList, petFilter, thuCungs]);

  if (loading) return <div style={{ padding: "32px", background: "var(--gray-50)", minHeight: "100%" }}>Đang tải hồ sơ...</div>;

  return (
    <div style={{ padding: "32px", background: "var(--gray-50)", minHeight: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "36px", fontWeight: "900", color: "var(--ink)", marginBottom: "8px", letterSpacing: "-0.5px" }}>Hồ Sơ Bệnh Án</h1>
          <p style={{ color: "var(--gray-500)", fontWeight: "500", fontSize: "1.1rem" }}>Lịch sử khám bệnh, chẩn đoán và quá trình điều trị của thú cưng</p>
        </div>
        <select 
          style={{ 
            padding: "12px 20px", 
            borderRadius: "16px", 
            border: "1px solid var(--gray-100)", 
            fontWeight: "700",
            color: "var(--ink)",
            background: "white",
            outline: "none"
          }} 
          value={petFilter} 
          onChange={(e) => setPetFilter(e.target.value)}
        >
          <option value="all">Tất cả thú cưng</option>
          {thuCungs.map(pet => (
            <option key={pet.id_thu_cung} value={String(pet.id_thu_cung)}>{pet.ten_thu_cung}</option>
          ))}
        </select>
      </div>

      <div style={{ display: "grid", gap: "20px" }}>
        {rows.length === 0 ? (
          <div className="card" style={{ padding: "60px", textAlign: "center", background: "white", borderRadius: "24px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "64px", color: "var(--gray-200)", marginBottom: "16px" }}>clinical_notes</span>
            <p style={{ fontSize: "18px", color: "var(--gray-500)", fontWeight: "600" }}>Chưa có hồ sơ bệnh án nào.</p>
          </div>
        ) : rows.map((h) => {
          return (
            <div key={h.id_ho_so} className="card" style={{ padding: "32px", background: "white", position: "relative", borderRadius: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
                <div>
                  <div style={{ fontSize: "24px", fontWeight: "900", color: "var(--ink)", marginBottom: "4px" }}>
                    {h.ten_thu_cung || "Không rõ"} — Hồ sơ #{h.id_ho_so}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", color: "var(--gray-500)", fontWeight: "600" }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>event</span>
                    {chuyenNgayISO_SangVN(h.ngay_kham)}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "800",
                    textTransform: "uppercase",
                    background: "#dcfce7",
                    color: "#15803d",
                    borderRadius: "10px",
                    padding: "8px 16px",
                    letterSpacing: "0.05em"
                  }}
                >
                  {h.trang_thai_ho_so === "hoan_tat" ? "Đã hoàn tất" : (h.trang_thai_ho_so || "Đã lưu")}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
                <div style={{ background: "var(--gray-50)", padding: "20px", borderRadius: "20px" }}>
                  <p style={{ fontSize: "11px", color: "var(--gray-400)", fontWeight: "800", textTransform: "uppercase", marginBottom: "8px" }}>Bác sĩ điều trị</p>
                  <p style={{ fontSize: "16px", fontWeight: "800", color: "var(--ink)" }}>{h.ten_bac_si || "Chưa rõ"}</p>
                </div>
                <div style={{ background: "var(--gray-50)", padding: "20px", borderRadius: "20px" }}>
                  <p style={{ fontSize: "11px", color: "var(--gray-400)", fontWeight: "800", textTransform: "uppercase", marginBottom: "8px" }}>Cân nặng</p>
                  <p style={{ fontSize: "16px", fontWeight: "800", color: "var(--ink)" }}>{h.can_nang != null ? `${h.can_nang} kg` : "—"}</p>
                </div>
                <div style={{ gridColumn: "1 / -1", background: "rgba(15, 157, 138, 0.05)", padding: "20px", borderRadius: "20px", border: "1px solid rgba(15, 157, 138, 0.1)" }}>
                  <p style={{ fontSize: "11px", color: "var(--teal)", fontWeight: "800", textTransform: "uppercase", marginBottom: "8px" }}>Triệu chứng</p>
                  <p style={{ fontSize: "15px", fontWeight: "600", color: "var(--ink)", lineHeight: 1.5 }}>{h.trieu_chung ?? "—"}</p>
                </div>
                <div style={{ gridColumn: "1 / -1", background: "var(--gray-50)", padding: "20px", borderRadius: "20px" }}>
                  <p style={{ fontSize: "11px", color: "var(--gray-400)", fontWeight: "800", textTransform: "uppercase", marginBottom: "8px" }}>Chẩn đoán & Kết luận</p>
                  <p style={{ fontSize: "15px", fontWeight: "700", color: "var(--ink)", lineHeight: 1.5 }}>{h.chan_doan ?? "—"}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(HoSoBenhAn);
