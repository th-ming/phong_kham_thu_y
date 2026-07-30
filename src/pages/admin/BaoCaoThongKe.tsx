import React, { useState, useEffect } from "react";
import axios from "axios";

const formatTienTrieu = (tien: number) => {
  return (tien / 1000000).toFixed(1);
};

const BaoCaoThongKe: React.FC = () => {
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [doctorStats, setDoctorStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get("http://localhost:8081/api/bao-cao/doanh-thu-thang"),
      axios.get("http://localhost:8081/api/bao-cao/thong-ke-bac-si")
    ])
    .then(([revRes, docRes]) => {
      // Đảo ngược để vẽ biểu đồ từ cũ đến mới (max 6 tháng)
      setRevenueData(revRes.data.slice(0, 6).reverse());
      setDoctorStats(docRes.data);
      setLoading(false);
    })
    .catch(err => {
      console.error("Lỗi lấy dữ liệu báo cáo:", err);
      setLoading(false);
    });
  }, []);

  if (loading) return <div style={{ padding: "32px" }}>Đang tổng hợp báo cáo...</div>;

  const totalRevenueThisMonth = revenueData.length > 0 ? revenueData[revenueData.length - 1].TongDoanhThu : 0;
  const totalAppointments = doctorStats.reduce((sum, d) => sum + (d.SoLichHen || 0), 0);

  return (
    <div style={{ padding: "32px", background: "var(--gray-50)", minHeight: "100%" }}>
      <div className="admin-header" style={{ marginBottom: "32px" }}>
        <h1>Báo Cáo & Thống Kê</h1>
        <p className="sec-desc">Phân tích hiệu quả kinh doanh và hiệu suất làm việc của đội ngũ.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "24px" }}>
        {/* Doanh thu xu hướng */}
        <div className="card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: "800", marginBottom: "20px", color: "var(--ink)" }}>Xu hướng doanh thu (triệu VNĐ)</h3>
          <div style={{ display: "flex", alignItems: "end", gap: "12px", height: "240px", paddingBottom: "20px" }}>
            {revenueData.length === 0 ? (
              <div style={{ margin: "auto", color: "var(--gray-400)" }}>Chưa có dữ liệu doanh thu</div>
            ) : revenueData.map((item, idx) => {
              const maxVal = Math.max(...revenueData.map(d => d.TongDoanhThu));
              const height = maxVal > 0 ? (item.TongDoanhThu / maxVal) * 100 : 0;
              return (
                <div key={idx} style={{ flex: 1, textAlign: "center", display: "flex", flexDirection: "column", height: "100%", justifyContent: "flex-end" }}>
                  <div style={{ height: `${height}%`, background: "linear-gradient(180deg, var(--teal) 0%, #0f9d8a 100%)", borderRadius: "8px 8px 4px 4px", transition: "height 0.5s ease", position: "relative" }}>
                    <div style={{ position: "absolute", top: "-25px", left: "50%", transform: "translateX(-50%)", fontSize: "11px", fontWeight: "800", color: "var(--teal)" }}>
                      {formatTienTrieu(item.TongDoanhThu)}
                    </div>
                  </div>
                  <div style={{ marginTop: "12px", fontSize: "12px", color: "var(--gray-500)", fontWeight: "700" }}>
                    T{item.Thang}/{item.Nam.toString().slice(-2)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hiệu suất bác sĩ */}
        <div className="card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: "800", marginBottom: "20px", color: "var(--ink)" }}>Hiệu suất Bác sĩ (Lượt khám)</h3>
          <div style={{ display: "grid", gap: "16px" }}>
            {doctorStats.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "var(--gray-400)" }}>Chưa có dữ liệu thống kê bác sĩ</div>
            ) : doctorStats.map((item) => {
              const maxAppointments = Math.max(...doctorStats.map(d => d.SoHoSo), 1);
              const progress = (item.SoHoSo / maxAppointments) * 100;
              return (
                <div key={item.TenBacSi}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontWeight: "700", color: "var(--ink)" }}>{item.TenBacSi}</span>
                    <span style={{ color: "var(--teal)", fontSize: "13px", fontWeight: "800" }}>{item.SoHoSo} ca khám</span>
                  </div>
                  <div style={{ height: "10px", background: "var(--gray-100)", borderRadius: "999px", overflow: "hidden" }}>
                    <div style={{ width: `${progress}%`, height: "100%", background: "var(--teal)", borderRadius: "999px" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", fontSize: "11px", color: "var(--gray-500)", fontWeight: "600" }}>
                    <span>Lịch hẹn: {item.SoLichHen}</span>
                    <span>Doanh thu: {new Intl.NumberFormat('vi-VN').format(item.TongDoanhThu)} đ</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: "24px", padding: "24px", display: "flex", alignItems: "center", gap: "24px", background: "white", borderLeft: "6px solid var(--teal)" }}>
        <div style={{ width: "64px", height: "64px", background: "var(--teal-light)", borderRadius: "20px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--teal)" }}>
           <span className="material-symbols-outlined" style={{ fontSize: "32px" }}>analytics</span>
        </div>
        <div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "800", marginBottom: "4px" }}>Tóm tắt hoạt động tháng này</h3>
          <p style={{ color: "var(--gray-600)", fontSize: "1rem" }}>
            Tổng ca điều trị: <b style={{ color: "var(--ink)" }}>{totalAppointments}</b> · Doanh thu đạt: <b style={{ color: "var(--teal)" }}>{new Intl.NumberFormat('vi-VN').format(totalRevenueThisMonth)} đ</b>
          </p>
        </div>
      </div>
    </div>
  );
};

export default React.memo(BaoCaoThongKe);
