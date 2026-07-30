import React, { useMemo, useState, useEffect } from "react";
import axios from "axios";
import { formatTienVND } from "@utils/index";

const chuyenNgayISO_SangVN = (dateString: string) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN').format(date);
};

const ghiChuHoaDon = (hd: any) => {
  return hd.ghi_chu || `Thanh toán phí dịch vụ cho ${hd.ten_thu_cung || "thú cưng"}`;
};

const nhanTienHoaDon = (hd: any) => {
  return formatTienVND(hd.tong_tien_cuoi ?? 0);
};

const HoaDonThanhToan: React.FC = () => {
  const [status, setStatus] = useState("all");
  const [hoaDons, setHoaDons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      axios.get(`http://localhost:8081/api/hoa-don/khach/${user.id_khach_hang}`)
        .then(res => {
          setHoaDons(res.data);
          setLoading(false);
        })
        .catch(err => {
          console.error("Lỗi tải hóa đơn:", err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const list = useMemo(
    () =>
      hoaDons.filter(
        (h) => status === "all" || h.trang_thai === status,
      ),
    [status, hoaDons],
  );

  const stats = useMemo(() => {
    const paid = hoaDons.filter((h) => h.trang_thai === "da_thanh_toan");
    const sum = paid.reduce((s, h) => s + (h.tong_tien_cuoi ?? 0), 0);
    return {
      n: hoaDons.length,
      paid: paid.length,
      unpaid: hoaDons.filter((h) => h.trang_thai === "cho_thanh_toan").length,
      sum,
    };
  }, [hoaDons]);

  const handleExportExcel = () => {
    if (hoaDons.length === 0) {
      alert("Không có dữ liệu để xuất!");
      return;
    }
    // Tạo nội dung CSV đơn giản
    const headers = ["ID Hoa don", "Ngay lap", "Thanh tien", "Trang thai", "Ghi chu"];
    const rows = hoaDons.map(h => [
      `HD-${h.id_hoa_don}`,
      h.ngay_lap_hoa_don ? h.ngay_lap_hoa_don.split('T')[0] : "---",
      h.tong_tien_cuoi,
      h.trang_thai,
      ghiChuHoaDon(h).replace(/,/g, ' ')
    ]);

    const csvContent = "\ufeff" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `LichSuHoaDon_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div style={{ padding: "32px", background: "var(--gray-50)", minHeight: "100%" }}>Đang tải hóa đơn...</div>;

  return (
    <div style={{ padding: "32px", background: "var(--gray-50)", minHeight: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "36px", fontWeight: "900", color: "var(--ink)", marginBottom: "8px", letterSpacing: "-0.5px" }}>Hóa Đơn Thanh Toán</h1>
          <p style={{ color: "var(--gray-500)", fontWeight: "500", fontSize: "1.1rem" }}>Lịch sử thanh toán và chi tiết các dịch vụ đã sử dụng</p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
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
            value={status} 
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="da_thanh_toan">Đã thanh toán</option>
            <option value="cho_thanh_toan">Chờ thanh toán</option>
            <option value="da_huy">Đã hủy</option>
          </select>
          <button className="btn-book" onClick={handleExportExcel}>
            <span className="material-symbols-outlined">download</span>
            Xuất Excel
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gap: "16px" }}>
        {list.length === 0 ? (
          <div className="card" style={{ padding: "60px", textAlign: "center", background: "white", borderRadius: "24px" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "64px", color: "var(--gray-200)", marginBottom: "16px" }}>receipt_long</span>
            <p style={{ fontSize: "18px", color: "var(--gray-500)", fontWeight: "600" }}>Chưa có hóa đơn nào.</p>
          </div>
        ) : list.map((hd) => (
          <div key={hd.id_hoa_don} className="card" style={{ padding: "32px", background: "white", borderRadius: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
              <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
                <div style={{ width: "56px", height: "56px", background: "rgba(15, 157, 138, 0.05)", color: "var(--teal)", borderRadius: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span className="material-symbols-outlined" style={{ fontSize: "32px" }}>receipt_long</span>
                </div>
                <div>
                  <div style={{ fontSize: "22px", fontWeight: "900", color: "var(--ink)", marginBottom: "4px" }}>Hóa đơn #HD-{hd.id_hoa_don}</div>
                  <div style={{ fontSize: "14px", color: "var(--gray-500)", fontWeight: "600" }}>{ghiChuHoaDon(hd)}</div>
                  <div style={{ fontSize: "12px", color: "var(--gray-400)", fontWeight: "700", marginTop: "4px" }}>Ngày lập: {hd.ngay_lap_hoa_don ? chuyenNgayISO_SangVN(hd.ngay_lap_hoa_don) : "—"}</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "28px", color: "var(--teal)", fontWeight: "900", marginBottom: "4px" }}>{nhanTienHoaDon(hd)}</div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "800",
                    textTransform: "uppercase",
                    background: hd.trang_thai === "da_thanh_toan" ? "#dcfce7" : "#fef9c3",
                    color: hd.trang_thai === "da_thanh_toan" ? "#15803d" : "#a16207",
                    borderRadius: "8px",
                    padding: "6px 14px",
                    letterSpacing: "0.05em"
                  }}
                >
                  {hd.trang_thai === "da_thanh_toan" ? "Đã thanh toán" : (hd.trang_thai || "Chờ thanh toán")}
                </span>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid var(--gray-100)", paddingTop: "20px" }}>
              <button className="btn" style={{ padding: "10px 20px", borderRadius: "12px", background: "var(--gray-100)", color: "var(--gray-600)", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px", border: "none", cursor: "pointer" }} onClick={() => alert("Tải PDF (Tính năng đang phát triển)")}>
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>picture_as_pdf</span>
                Tải PDF
              </button>
              <button className="btn" style={{ padding: "10px 20px", borderRadius: "12px", background: "rgba(15, 157, 138, 0.05)", color: "var(--teal)", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px", border: "none", cursor: "pointer" }} onClick={() => window.print()}>
                <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>print</span>
                In hóa đơn
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: "32px", marginTop: "32px", background: "white", border: "1px solid var(--gray-100)", borderRadius: "20px" }}>
        <h3 style={{ fontSize: "22px", fontWeight: "900", color: "var(--ink)", marginBottom: "24px" }}>Tổng kết chi phí</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "24px" }}>
          <div style={{ padding: "20px", background: "var(--gray-50)", borderRadius: "20px" }}>
            <p style={{ fontSize: "12px", color: "var(--gray-400)", fontWeight: "800", textTransform: "uppercase", marginBottom: "8px" }}>Số lượng hóa đơn</p>
            <p style={{ fontSize: "24px", fontWeight: "900", color: "var(--ink)" }}>{stats.n}</p>
          </div>
          <div style={{ padding: "20px", background: "#f0fdf4", borderRadius: "20px" }}>
            <p style={{ fontSize: "12px", color: "#16a34a", fontWeight: "800", textTransform: "uppercase", marginBottom: "8px" }}>Đã thanh toán</p>
            <p style={{ fontSize: "24px", fontWeight: "900", color: "#15803d" }}>{stats.paid}</p>
          </div>
          <div style={{ padding: "20px", background: "#fffbeb", borderRadius: "20px" }}>
            <p style={{ fontSize: "12px", color: "#d97706", fontWeight: "800", textTransform: "uppercase", marginBottom: "8px" }}>Đang chờ</p>
            <p style={{ fontSize: "24px", fontWeight: "900", color: "#b45309" }}>{stats.unpaid}</p>
          </div>
          <div style={{ padding: "20px", background: "rgba(15, 157, 138, 0.05)", borderRadius: "20px" }}>
            <p style={{ fontSize: "12px", color: "var(--teal)", fontWeight: "800", textTransform: "uppercase", marginBottom: "8px" }}>Tổng chi phí đã trả</p>
            <p style={{ fontSize: "24px", fontWeight: "900", color: "var(--teal)" }}>{formatTienVND(stats.sum)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(HoaDonThanhToan);
