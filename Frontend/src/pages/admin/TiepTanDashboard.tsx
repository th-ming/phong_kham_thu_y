import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axiosInstance from "@services/axios";
import { getUserProfile, matchesSearchFields } from "@utils/index";
import ModalTaoLichHenAdmin from "./ModalTaoLichHenAdmin";
import { toast } from "@components/Toast";
import { useAutoRefresh } from "@hooks/useAutoRefresh";
import KpiIcon from "@components/KpiIcon";

const ROW_HEIGHT = 86;
const VISIBLE_ROWS = 8;

const extractArray = (data: any): any[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.content)) return data.content;
  if (Array.isArray(data.data)) return data.data;
  return [];
};

const statusLabel = (status: string) => {
  const normalized = status.toUpperCase();
  if (normalized === "CHO_XAC_NHAN") return "Chờ XN";
  if (normalized === "DA_XAC_NHAN") return "Đã XN";
  if (normalized === "DANG_KHAM") return "Đang khám";
  if (normalized === "HOAN_THANH") return "Hoàn thành";
  if (normalized === "DA_HUY") return "Đã hủy";
  if (normalized === "KHONG_DEN") return "Không đến";
  return normalized || "Chưa rõ";
};

const TiepTanDashboard: React.FC = () => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [pendingInvoices, setPendingInvoices] = useState<any[]>([]);
  const [stats, setStats] = useState({ pendingConfirmation: 0, pendingPayment: 0, checkedIn: 0 });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [tableScrollTop, setTableScrollTop] = useState(0);
  const tableViewportRef = useRef<HTMLDivElement | null>(null);
  const user = useMemo(() => getUserProfile() || {}, []);

  const fetchData = useCallback(async (showLoading = true) => {
    if (showLoading && appointments.length === 0) setLoading(true);
    const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split("T")[0];

    try {
      const [appsRes, invoicesRes] = await Promise.all([
        axiosInstance.get("/api/lich-hen", { params: { page: 0, size: 200 } }),
        axiosInstance.get("/api/hoa-don"),
      ]);

      const allApps = extractArray(appsRes.data);
      const todaysApps = allApps.filter((l: any) => l.ngay_kham && String(l.ngay_kham).substring(0, 10) === todayStr);
      const allInvoices = extractArray(invoicesRes.data);
      const unpaidInvoices = allInvoices.filter(inv => String(inv.trang_thai || "").toUpperCase() === "CHO_THANH_TOAN");

      setAppointments(todaysApps);
      setPendingInvoices(unpaidInvoices);
      setStats({
        pendingConfirmation: todaysApps.filter(a => String(a.trang_thai || "").toUpperCase() === "CHO_XAC_NHAN").length,
        checkedIn: todaysApps.filter(a => String(a.trang_thai || "").toUpperCase() === "DANG_KHAM").length,
        pendingPayment: unpaidInvoices.length,
      });

      const now = new Date();
      setLastUpdated(`${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`);
    } catch (err) {
      console.error("Lỗi tải dữ liệu dashboard tiếp tân:", err);
      toast.error("Không thể tải dữ liệu dashboard.");
    } finally {
      setLoading(false);
    }
  }, [appointments.length]);

  useAutoRefresh(() => fetchData(false), { intervalMs: 10_000 });

  useEffect(() => {
    const handleRealtimeUpdate = () => fetchData(false);
    window.addEventListener("rexi-appointments-changed", handleRealtimeUpdate);
    return () => window.removeEventListener("rexi-appointments-changed", handleRealtimeUpdate);
  }, [fetchData]);

  const filteredAppointments = useMemo(() => {
    if (!searchTerm.trim()) return appointments;
    return appointments.filter(app => matchesSearchFields(searchTerm, [
      app.id_lich_hen,
      app.ten_khach_hang,
      app.ten_thu_cung,
      app.sdt,
      app.ten_bac_si,
      app.ten_dich_vu,
      app.ly_do,
      app.ghi_chu,
      app.trang_thai,
    ]));
  }, [appointments, searchTerm]);

  const sortedAppointments = useMemo(() => {
    return [...filteredAppointments].sort((a, b) => String(a.gio_kham || "").localeCompare(String(b.gio_kham || "")));
  }, [filteredAppointments]);
  const pendingConfirmationList = useMemo(() => appointments.filter(a => String(a.trang_thai || "").toUpperCase() === "CHO_XAC_NHAN"), [appointments]);

  const shouldVirtualize = sortedAppointments.length > 40;
  const visibleRange = useMemo(() => {
    if (!shouldVirtualize) return { start: 0, end: sortedAppointments.length };
    const start = Math.max(0, Math.floor(tableScrollTop / ROW_HEIGHT) - 2);
    const end = Math.min(sortedAppointments.length, start + VISIBLE_ROWS + 5);
    return { start, end };
  }, [shouldVirtualize, sortedAppointments.length, tableScrollTop]);
  const visibleAppointments = shouldVirtualize
    ? sortedAppointments.slice(visibleRange.start, visibleRange.end)
    : sortedAppointments;

  const statusStats = useMemo(() => {
    let pending = 0, confirmed = 0, checkingIn = 0, completed = 0, canceled = 0;
    appointments.forEach(a => {
      const status = String(a.trang_thai || "").toUpperCase();
      if (status === "CHO_XAC_NHAN") pending++;
      else if (status === "DA_XAC_NHAN") confirmed++;
      else if (status === "DANG_KHAM") checkingIn++;
      else if (status === "HOAN_THANH") completed++;
      else if (status === "DA_HUY" || status === "KHONG_DEN") canceled++;
      else pending++;
    });
    const total = appointments.length || 1;
    return {
      pending: { count: pending, pct: (pending / total) * 100, color: "#f59e0b", label: "Chờ XN" },
      confirmed: { count: confirmed, pct: (confirmed / total) * 100, color: "#3b82f6", label: "Đã XN" },
      checkingIn: { count: checkingIn, pct: (checkingIn / total) * 100, color: "#14b8a6", label: "Đang khám" },
      completed: { count: completed, pct: (completed / total) * 100, color: "#10b981", label: "Hoàn thành" },
      canceled: { count: canceled, pct: (canceled / total) * 100, color: "#ef4444", label: "Đã hủy" },
    };
  }, [appointments]);

  const conicGradient = useMemo(() => {
    let cumulativePercent = 0;
    const stops = Object.values(statusStats).map(stat => {
      if (stat.count === 0) return "";
      const start = cumulativePercent;
      cumulativePercent += stat.pct;
      return `${stat.color} ${start}% ${cumulativePercent}%`;
    }).filter(Boolean).join(", ");
    return `conic-gradient(${stops || "#f3f4f6 0% 100%"})`;
  }, [statusStats]);

  const handleUpdateStatus = async (id: number, newStatus: string) => {
    try {
      await axiosInstance.put(`/api/lich-hen/${id}/status`, { trang_thai: newStatus });
      toast.success("Đã cập nhật trạng thái lịch hẹn!");
      fetchData(false);
    } catch {
      toast.error("Lỗi khi cập nhật trạng thái.");
    }
  };

  const ReceptionKpiCard = ({ accent, title, value, icon, details, pulse = false }: {
    accent: string;
    title: string;
    value: React.ReactNode;
    icon: React.ReactNode;
    details: React.ReactNode;
    pulse?: boolean;
  }) => (
    <div className="reception-kpi-card glass-card hover-lift" tabIndex={0} style={{ padding: "32px", borderRadius: "32px", border: `1px solid ${accent}25`, background: `linear-gradient(135deg, ${accent}15 0%, var(--surface) 100%)`, minHeight: "190px" }}>
      <div className="reception-kpi-badge" style={{ color: accent, borderColor: `${accent}35`, background: `${accent}12` }}>
        <span>Chi tiết</span>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div style={{ width: "60px", height: "60px", borderRadius: "20px", background: `${accent}22`, color: accent, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 8px 20px ${accent}15`, fontSize: "1.55rem", fontWeight: 950 }}>
          {icon}
        </div>
      </div>
      <p style={{ fontSize: "0.8rem", fontWeight: 900, color: "var(--gray-500)", margin: "0 0 8px 0", textTransform: "uppercase", letterSpacing: "1px" }}>{title}</p>
      <h3 className={pulse ? "pulse-danger-text" : ""} style={{ fontSize: "2rem", fontWeight: 950, color: accent, margin: 0, display: "inline-block", transformOrigin: "left center" }}>{value}</h3>
      <div className="reception-kpi-popover">{details}</div>
    </div>
  );

  if (loading) {
    return <div style={{ display: "flex", justifyContent: "center", padding: "100px" }}><div className="dot-pulse"></div></div>;
  }

  return (
    <div className="animate-fade-in">
      <style>{`
        @keyframes pulseDanger {
          0% { transform: scale(1); text-shadow: 0 0 0 rgba(239, 68, 68, 0); }
          50% { transform: scale(1.05); text-shadow: 0 0 15px rgba(239, 68, 68, 0.7); }
          100% { transform: scale(1); text-shadow: 0 0 0 rgba(239, 68, 68, 0); }
        }
        .pulse-danger-text { animation: pulseDanger 1.5s infinite ease-in-out; }
        .reception-grid {
          display: grid;
          grid-template-columns: minmax(86px, 0.75fr) minmax(230px, 1.7fr) minmax(170px, 1.1fr) minmax(136px, 0.95fr) minmax(164px, 1fr);
          align-items: center;
          min-width: 900px;
        }
        .reception-head {
          position: sticky;
          top: 0;
          z-index: 2;
          background: var(--gray-50);
          border-bottom: 1px solid var(--gray-100);
        }
        .reception-cell {
          padding: 16px 18px;
          min-width: 0;
        }
        .reception-th {
          color: var(--gray-500);
          font-size: 0.76rem;
          font-weight: 900;
          letter-spacing: 0;
          white-space: nowrap;
        }
        .reception-main-text,
        .reception-sub-text {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .reception-sub-text {
          font-size: 0.8rem;
          color: var(--gray-400);
          font-weight: 700;
          margin-top: 4px;
        }
        .reception-row {
          border-bottom: 1px solid var(--gray-50);
          min-height: ${ROW_HEIGHT}px;
        }
        .reception-row:hover { background: rgba(20, 184, 166, 0.04); }
        .reception-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-start;
          align-items: center;
          min-width: 0;
        }
        .reception-kpi-card {
          position: relative;
          cursor: help;
          overflow: visible;
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
        }
        .reception-kpi-card:hover,
        .reception-kpi-card:focus {
          transform: translateY(-4px);
          box-shadow: 0 18px 42px rgba(15, 23, 42, 0.12);
          outline: none;
          z-index: 120;
        }
        .reception-kpi-badge {
          position: absolute;
          top: 22px;
          right: 22px;
          display: inline-flex;
          align-items: center;
          padding: 7px 10px;
          border-radius: 999px;
          border: 1px solid;
          font-size: 0.72rem;
          font-weight: 950;
          box-shadow: 0 12px 26px rgba(15, 23, 42, 0.08);
        }
        .reception-kpi-popover {
          position: absolute;
          left: 18px;
          right: 18px;
          top: 70px;
          z-index: 90;
          padding: 16px;
          border-radius: 16px;
          border: 1px solid rgba(20, 184, 166, 0.35);
          background: var(--surface);
          color: var(--ink);
          box-shadow: 0 24px 56px rgba(15, 23, 42, 0.22);
          opacity: 0;
          transform: translateY(-6px);
          pointer-events: none;
          transition: opacity 0.18s ease, transform 0.18s ease;
          font-size: 0.86rem;
          line-height: 1.45;
        }
        .reception-kpi-popover strong {
          display: block;
          margin-bottom: 8px;
          color: var(--primary);
          font-size: 0.92rem;
          font-weight: 950;
        }
        .reception-kpi-popover p {
          margin: 6px 0;
          color: var(--ink);
          font-weight: 800;
        }
        .reception-kpi-card:hover .reception-kpi-popover,
        .reception-kpi-card:focus .reception-kpi-popover {
          opacity: 1;
          transform: translateY(0);
          pointer-events: auto;
        }
      `}</style>
      <ModalTaoLichHenAdmin isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => fetchData(false)} />

      <div className="animate-slide-up stagger-1" style={{ marginBottom: "40px", padding: "48px", borderRadius: "var(--radius-xl)", background: "var(--primary-gradient)", color: "white", position: "relative", overflow: "hidden", boxShadow: "var(--shadow-2xl)" }}>
        <div style={{ position: "absolute", top: "-10%", right: "-5%", width: "300px", height: "300px", background: "radial-gradient(circle, var(--primary-light) 0%, transparent 70%)", borderRadius: "50%", pointerEvents: "none" }}></div>
        <h1 style={{ fontSize: "3rem", fontWeight: 950, letterSpacing: "-1.5px", position: "relative", zIndex: 1, margin: "0 0 12px 0", display: "flex", alignItems: "center", gap: "15px" }}>
          <span>Sảnh Chờ <span style={{ color: "#5eead4" }}>Tiếp Tân</span></span>
          <span style={{ filter: "drop-shadow(0 5px 15px rgba(0,0,0,0.2))" }}>🛎️</span>
        </h1>
        <p style={{ fontWeight: 700, color: "rgba(255,255,255,0.95)", position: "relative", zIndex: 1, margin: 0, fontSize: "1.2rem", textShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>Chào mừng, {user.ho_ten || "Lễ tân"}. Quản lý luồng khách hàng và điều phối lịch hẹn hôm nay.</p>
        {lastUpdated && (
          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", fontWeight: 800, background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", padding: "6px 14px", borderRadius: "999px", marginTop: "14px", border: "1px solid rgba(255,255,255,0.2)", position: "relative", zIndex: 1, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
            <span className="material-symbols-outlined" style={{ fontSize: "15px", color: "#5eead4", animation: "spin 3s infinite linear" }}>sync</span>
            <span>Dữ liệu thời gian thực cập nhật lúc: {lastUpdated}</span>
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "24px", marginBottom: "40px", position: "relative", zIndex: 80 }}>
        <ReceptionKpiCard
          accent="#3b82f6"
          title="Tổng lịch hẹn nay"
          value={`${appointments.length} ca`}
          icon={<KpiIcon name="calendar" />}
          details={
            <div>
              <strong>Tổng quan điều phối</strong>
              <p>{stats.pendingConfirmation} ca chờ xác nhận, {stats.checkedIn} ca đang khám.</p>
              <p>{statusStats.completed.count} ca hoàn thành, {statusStats.canceled.count} ca đã hủy/không đến.</p>
              <p>Danh sách bên dưới đang hiển thị {sortedAppointments.length} ca theo bộ lọc hiện tại.</p>
            </div>
          }
        />
        <ReceptionKpiCard
          accent="#f59e0b"
          title="Chờ xác nhận"
          value={`${stats.pendingConfirmation} ca`}
          icon={<KpiIcon name="clock" />}
          details={
            <div>
              <strong>Ca cần gọi xác nhận</strong>
              {pendingConfirmationList.slice(0, 4).map(app => (
                <p key={app.id_lich_hen}>{app.gio_kham?.substring(0, 5) || "--:--"} - {app.ten_thu_cung || "chưa có tên"} ({app.ten_khach_hang || "chưa có chủ"})</p>
              ))}
              {pendingConfirmationList.length === 0 && <p>Không có ca nào đang chờ xác nhận.</p>}
            </div>
          }
        />
        <ReceptionKpiCard
          accent="#ef4444"
          title="Hóa đơn chờ thu"
          value={`${stats.pendingPayment} hóa đơn`}
          icon={<KpiIcon name="receipt" />}
          pulse={stats.pendingPayment > 0}
          details={
            <div>
              <strong>Hóa đơn cần thu tiền</strong>
              {pendingInvoices.slice(0, 4).map(inv => (
                <p key={inv.id_hoa_don || inv.idHoaDon}>#{inv.id_hoa_don || inv.idHoaDon} - {inv.ten_khach_hang || "Khách vãng lai"}: {Number(inv.tong_tien_cuoi || inv.tongTienCuoi || 0).toLocaleString("vi-VN")} đ</p>
              ))}
              {pendingInvoices.length === 0 && <p>Không còn hóa đơn chờ thu.</p>}
            </div>
          }
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(280px, 1fr)", gap: "32px", alignItems: "start" }}>
        <div className="glass-card" style={{ borderRadius: "24px", overflow: "hidden" }}>
          <div style={{ padding: "24px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--gray-100)", flexWrap: "wrap", gap: "12px" }}>
            <h2 style={{ fontSize: "1.2rem", margin: 0, fontWeight: 800 }}>Điều phối lịch hẹn hôm nay</h2>
            <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ position: "relative" }}>
                <span className="material-symbols-outlined" style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)", fontSize: "20px", pointerEvents: "none" }}>search</span>
                <input data-ai-id="input-tieptandashboard-pcmn" type="text" placeholder="Tìm theo tên/SĐT chủ..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ padding: "8px 16px 8px 40px", borderRadius: "12px", border: "1px solid var(--gray-200)", background: "var(--gray-50)", outline: "none", fontSize: "0.85rem", minWidth: "220px", fontWeight: 600, color: "var(--ink)" }} />
              </div>
              <button data-ai-id="button-tieptandashboard-b9mf" className="btn btn-primary btn-pill" onClick={() => setIsModalOpen(true)}>
                <span className="material-symbols-outlined">add_task</span> Thêm lịch hẹn mới
              </button>
            </div>
          </div>

          <div ref={tableViewportRef} onScroll={(e) => setTableScrollTop(e.currentTarget.scrollTop)} style={{ overflow: "auto", maxHeight: `${ROW_HEIGHT * VISIBLE_ROWS + 54}px` }}>
            <div style={{ minWidth: "900px", position: "relative" }}>
              <div className="reception-grid reception-head">
                <div className="reception-cell reception-th">THỜI GIAN</div>
                <div className="reception-cell reception-th">BỆNH NHÂN & CHỦ</div>
                <div className="reception-cell reception-th">BÁC SĨ</div>
                <div className="reception-cell reception-th">TRẠNG THÁI</div>
                <div className="reception-cell reception-th">THAO TÁC</div>
              </div>
              {sortedAppointments.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: "var(--gray-400)", fontWeight: 700 }}>
                  {searchTerm ? "Không tìm thấy kết quả phù hợp." : "Hôm nay không có lịch hẹn nào."}
                </div>
              ) : (
                <div style={{ height: shouldVirtualize ? `${sortedAppointments.length * ROW_HEIGHT}px` : "auto", position: "relative" }}>
                  <div style={{ transform: shouldVirtualize ? `translateY(${visibleRange.start * ROW_HEIGHT}px)` : undefined }}>
                    {visibleAppointments.map(app => {
                      const status = String(app.trang_thai || "").toUpperCase();
                      return (
                        <div key={app.id_lich_hen} className="reception-grid reception-row">
                          <div className="reception-cell" style={{ fontWeight: 900, fontSize: "1.05rem", color: "var(--primary)" }}>{app.gio_kham?.substring(0, 5) || "—"}</div>
                          <div className="reception-cell" style={{ minWidth: 0 }}>
                            <div className="reception-main-text" title={app.ten_thu_cung} style={{ fontWeight: 850, color: "var(--ink)" }}>{app.ten_thu_cung || "Chưa có tên bé"}</div>
                            <div className="reception-sub-text" title={`${app.ten_khach_hang || ""} ${app.sdt || ""}`}>{app.ten_khach_hang || "Chưa có chủ"}{app.sdt ? ` (${app.sdt})` : ""}</div>
                          </div>
                          <div className="reception-cell reception-main-text" title={app.ten_bac_si || "Chưa xếp"} style={{ fontWeight: 700, color: "var(--ink)" }}>{app.ten_bac_si || "Chưa xếp"}</div>
                          <div className="reception-cell">
                            <span style={{ display: "inline-flex", maxWidth: "100%", padding: "6px 12px", borderRadius: "999px", fontSize: "0.72rem", fontWeight: 900, background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", whiteSpace: "nowrap" }}>{statusLabel(status)}</span>
                          </div>
                          <div className="reception-cell">
                            <div className="reception-actions">
                              {status === "CHO_XAC_NHAN" && <button data-ai-id="button-tieptandashboard-wita" onClick={() => handleUpdateStatus(app.id_lich_hen, "DA_XAC_NHAN")} className="btn btn-pill" style={{ background: "var(--primary-light)", color: "var(--primary)", padding: "8px 14px", fontSize: "0.78rem", fontWeight: 900, whiteSpace: "nowrap" }}>Xác nhận</button>}
                              {status === "DA_XAC_NHAN" && <button data-ai-id="button-tieptandashboard-c2d0" onClick={() => handleUpdateStatus(app.id_lich_hen, "DANG_KHAM")} className="btn btn-pill" style={{ background: "var(--blue-50)", color: "var(--blue-600)", padding: "8px 14px", fontSize: "0.78rem", fontWeight: 900, whiteSpace: "nowrap" }}>Check-in</button>}
                              {status !== "CHO_XAC_NHAN" && status !== "DA_XAC_NHAN" && <span style={{ color: "var(--gray-400)", fontWeight: 800, fontSize: "0.78rem", whiteSpace: "nowrap" }}>Không có</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: "24px", borderRadius: "24px" }}>
          <h2 style={{ fontSize: "1.2rem", margin: "0 0 24px 0", fontWeight: 800 }}>Tỷ lệ trạng thái</h2>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "24px" }}>
            <div style={{ width: "180px", height: "180px", borderRadius: "50%", background: conicGradient, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 10px rgba(0,0,0,0.05)" }}>
              <div style={{ width: "130px", height: "130px", borderRadius: "50%", background: "white", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
                <span style={{ fontSize: "1.8rem", fontWeight: 900, color: "var(--ink)", lineHeight: 1 }}>{appointments.length}</span>
                <span style={{ fontSize: "0.75rem", color: "var(--gray-500)", fontWeight: 700, marginTop: "4px" }}>TỔNG CA</span>
              </div>
            </div>
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "12px" }}>
              {Object.values(statusStats).map((stat, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", gap: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                    <div style={{ width: "12px", height: "12px", borderRadius: "4px", background: stat.color, flex: "0 0 auto" }}></div>
                    <span style={{ fontWeight: 700, color: "var(--gray-600)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{stat.label}</span>
                  </div>
                  <span style={{ fontWeight: 900, color: "var(--ink)", whiteSpace: "nowrap" }}>{stat.count} <span style={{ color: "var(--gray-400)", fontSize: "0.75rem", fontWeight: 700 }}>({Math.round(stat.pct || 0)}%)</span></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TiepTanDashboard;
