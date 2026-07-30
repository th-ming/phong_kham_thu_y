import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";

const formatTienVND = (tien: number) => {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(tien);
};

const DashboardQuanLy: React.FC = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = useState<any[]>([]);
  const [revenue, setRevenue] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);

  useEffect(() => {
    // Lấy tổng khách hàng
    axios.get("http://localhost:8081/api/khach-hang/count")
      .then(res => setCustomerCount(res.data))
      .catch(err => console.error("Lỗi lấy số lượng khách hàng:", err));

    // Lấy lịch hẹn hôm nay
    axios.get("http://localhost:8081/api/lich-hen/hom-nay")
      .then(res => setAppointments(res.data))
      .catch(err => console.error("Lỗi lấy lịch hẹn:", err));

    // Lấy cảnh báo kho thuốc
    axios.get("http://localhost:8081/api/kho/thuoc-sap-het-han")
      .then(res => setInventoryAlerts(res.data))
      .catch(err => console.error("Lỗi lấy cảnh báo kho:", err));

    // Lấy doanh thu tháng
    axios.get("http://localhost:8081/api/bao-cao/doanh-thu-thang")
      .then(res => {
        if (res.data && res.data.length > 0) {
          // Lấy tháng hiện tại
          const currentMonth = new Date().getMonth() + 1;
          const currentYear = new Date().getFullYear();
          const currentData = res.data.find((d: any) => d.thang === currentMonth && d.nam === currentYear);
          if (currentData) setRevenue(currentData.doanh_thu);
        }
      })
      .catch(err => console.error("Lỗi lấy doanh thu:", err));
  }, []);

  const stats = useMemo(
    () => [
      {
        label: "Tổng Khách Hàng",
        value: String(customerCount),
        icon: "groups",
        color: "#0f9d8a",
        trend: "+0%",
      },
      {
        label: "Lịch Hẹn Hôm Nay",
        value: String(appointments.length),
        icon: "calendar_month",
        color: "#2196f3",
        trend: "Mới",
      },
      {
        label: "Doanh Thu Tháng",
        value: formatTienVND(revenue),
        icon: "payments",
        color: "#f5a623",
        trend: "Tốt",
      },
      {
        label: "Thuốc sắp hết hạn",
        value: String(inventoryAlerts.length),
        icon: "science",
        color: "#9c27b0",
        trend: inventoryAlerts.length > 0 ? "Ưu tiên" : "Bình thường",
      },
    ],
    [appointments.length, revenue, inventoryAlerts.length]
  );

  return (
    <div style={{ padding: "32px", minHeight: "100%" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "32px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "36px",
              fontWeight: "900",
              color: "var(--ink)",
              marginBottom: "8px",
              letterSpacing: "-0.5px"
            }}
          >
            Tổng Quan Hoạt Động
          </h1>
          <p style={{ color: "var(--gray-500)", fontWeight: "500", fontSize: "1.1rem" }}>
            Theo dõi các chỉ số quan trọng của phòng khám
          </p>
        </div>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "16px", 
          background: "white", 
          padding: "12px 20px", 
          borderRadius: "16px",
          border: "1px solid var(--gray-100)",
          boxShadow: "var(--shadow-sm)"
        }}>
          <span className="material-symbols-outlined" style={{ color: "var(--gray-400)" }}>calendar_today</span>
          <span style={{ fontWeight: "700", color: "var(--gray-700)" }}>{new Date().toLocaleDateString('vi-VN')}</span>
        </div>
      </div>

      {/* Grid thống kê */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "24px",
          marginBottom: "32px",
        }}
      >
        {stats.map((item, index) => (
          <div
            key={index}
            className="card"
            style={{
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  backgroundColor: `${item.color}15`,
                  color: item.color,
                  padding: "12px",
                  borderRadius: "12px",
                  display: "flex",
                }}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
              </div>
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: "700",
                  color: item.trend.includes("+") || item.trend === "Tốt" ? "#2e7d32" : (item.trend === "Ưu tiên" ? "#d32f2f" : item.color),
                  backgroundColor: item.trend.includes("+") || item.trend === "Tốt"
                    ? "#e8f5e9"
                    : (item.trend === "Ưu tiên" ? "#ffebee" : "#f5f5f5"),
                  padding: "4px 8px",
                  borderRadius: "6px",
                }}
              >
                {item.trend}
              </span>
            </div>
            <p
              style={{
                color: "var(--gray-600)",
                fontSize: "14px",
                fontWeight: "600",
                marginBottom: "4px",
              }}
            >
              {item.label}
            </p>
            <h3
              style={{
                fontSize: "28px",
                fontWeight: "800",
                color: "var(--ink)",
              }}
            >
              {item.value}
            </h3>
          </div>
        ))}
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}
      >
        {/* Bảng lịch hẹn hôm nay */}
        <div className="card" style={{ padding: "24px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <h3 style={{ fontSize: "18px", fontWeight: "700" }}>
              Lịch Hẹn Hôm Nay
            </h3>
            <button
              style={{
                color: "var(--teal)",
                fontWeight: "700",
                fontSize: "14px",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              Xem tất cả
            </button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    textAlign: "left",
                    borderBottom: "1px solid var(--gray-100)",
                  }}
                >
                  <th
                    style={{
                      padding: "12px 8px",
                      color: "var(--gray-600)",
                      fontSize: "14px",
                    }}
                  >
                    Giờ
                  </th>
                  <th
                    style={{
                      padding: "12px 8px",
                      color: "var(--gray-600)",
                      fontSize: "14px",
                    }}
                  >
                    Bệnh nhân
                  </th>
                  <th
                    style={{
                      padding: "12px 8px",
                      color: "var(--gray-600)",
                      fontSize: "14px",
                    }}
                  >
                    Chủ nuôi
                  </th>
                  <th
                    style={{
                      padding: "12px 8px",
                      color: "var(--gray-600)",
                      fontSize: "14px",
                    }}
                  >
                    Bác sĩ
                  </th>
                  <th
                    style={{
                      padding: "12px 8px",
                      color: "var(--gray-600)",
                      fontSize: "14px",
                    }}
                  >
                    Trạng thái
                  </th>
                </tr>
              </thead>
              <tbody>
                {appointments.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "20px", color: "var(--gray-500)" }}>Chưa có lịch hẹn nào hôm nay</td>
                  </tr>
                )}
                {appointments.map((app) => (
                  <tr
                    key={app.id_lich_hen}
                    style={{ borderBottom: "1px solid var(--gray-50)" }}
                  >
                    <td
                      style={{
                        padding: "16px 8px",
                        fontWeight: "700",
                        fontSize: "14px",
                      }}
                    >
                      {app.gio_kham ? app.gio_kham.substring(0,5) : "—"}
                    </td>
                    <td style={{ padding: "16px 8px", fontWeight: "600" }}>
                      {app.ten_thu_cung || `ID: ${app.id_thu_cung}`}
                    </td>
                    <td
                      style={{
                        padding: "16px 8px",
                        color: "var(--gray-600)",
                        fontSize: "14px",
                      }}
                    >
                      {app.ten_khach_hang || `ID: ${app.id_khach_hang}`}
                    </td>
                    <td style={{ padding: "16px 8px", fontSize: "14px" }}>
                      <span
                        style={{
                          backgroundColor: "var(--teal-light)",
                          color: "var(--teal)",
                          padding: "4px 10px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: "700",
                        }}
                      >
                        {app.ten_bac_si || "Chưa xếp"}
                      </span>
                    </td>
                    <td style={{ padding: "16px 8px" }}>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: "700",
                          color:
                            app.trang_thai === "da_xac_nhan"
                              ? "var(--teal)"
                              : "var(--gray-600)",
                          textTransform: "capitalize"
                        }}
                      >
                        {app.trang_thai}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Phần bổ sung: Cảnh báo kho và Hoạt động */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "24px",
            marginTop: "24px",
          }}
        >
          {/* Thuốc sắp hết hạn - Theo View v_ThuocSapHetHan */}
          <div
            className="card"
            style={{ padding: "24px", borderLeft: "4px solid var(--orange)" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{ color: "var(--orange)" }}
              >
                warning
              </span>
              <h3 style={{ fontSize: "18px", fontWeight: "700" }}>
                Cảnh Báo Kho Thuốc
              </h3>
            </div>
            {inventoryAlerts.length === 0 ? (
              <div style={{ textAlign: "center", color: "var(--gray-500)", padding: "20px 0" }}>
                Không có thuốc nào sắp hết hạn hoặc hết hàng.
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr
                    style={{
                      textAlign: "left",
                      borderBottom: "1px solid var(--gray-100)",
                    }}
                  >
                    <th
                      style={{
                        padding: "10px",
                        fontSize: "13px",
                        color: "var(--gray-600)",
                      }}
                    >
                      Tên thuốc
                    </th>
                    <th
                      style={{
                        padding: "10px",
                        fontSize: "13px",
                        color: "var(--gray-600)",
                      }}
                    >
                      Hạn dùng
                    </th>
                    <th
                      style={{
                        padding: "10px",
                        fontSize: "13px",
                        color: "var(--gray-600)",
                      }}
                    >
                      Tồn
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {inventoryAlerts.map((item, idx) => (
                    <tr
                      key={idx}
                      style={{ borderBottom: "1px solid var(--gray-50)" }}
                    >
                      <td style={{ padding: "12px 10px", fontWeight: "600" }}>
                        {item.ten_thuoc}
                      </td>
                      <td
                        style={{
                          padding: "12px 10px",
                          color: "#ff4d4f",
                          fontSize: "13px",
                        }}
                      >
                        {item.han_dung ? item.han_dung.substring(0, 10) : "—"}
                      </td>
                      <td style={{ padding: "12px 10px", fontWeight: "700" }}>
                        {item.so_luong_ton}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Hoạt động gần đây */}
          <div className="card" style={{ padding: "24px" }}>
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "700",
                marginBottom: "20px",
              }}
            >
              Hoạt Động Gần Đây
            </h3>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              <div style={{ textAlign: "center", color: "var(--gray-500)", padding: "20px 0" }}>
                Đang chờ đồng bộ dữ liệu...
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(DashboardQuanLy);

