import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";

const ChiTietHoSoBenhAn: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      axios.get(`http://localhost:8081/api/ho-so-benh-an`) // Fetching all and filtering for now if specific endpoint not available
        .then(res => {
          const found = res.data.find((r: any) => String(r.id_ho_so) === id);
          setRecord(found);
          setLoading(false);
        })
        .catch(err => {
          console.error("Lỗi lấy chi tiết hồ sơ:", err);
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) return <div style={{ padding: "32px" }}>Đang tải chi tiết hồ sơ...</div>;
  if (!record) return <div style={{ padding: "32px" }}>Không tìm thấy hồ sơ bệnh án.</div>;

  return (
    <div style={{ padding: "32px", minHeight: "100%", background: "var(--gray-50)" }}>
      <div style={{ marginBottom: "24px", display: "flex", alignItems: "center", gap: "12px" }}>
        <Link to="/quan-ly/ho-so-benh-an" style={{ color: "var(--gray-500)", textDecoration: "none" }}>
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1>Chi Tiết Hồ Sơ Bệnh Án #HS-{id}</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
        <div style={{ display: "grid", gap: "24px" }}>
          <div className="card" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: "800", marginBottom: "20px", color: "var(--teal)" }}>Thông tin lâm sàng</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--gray-500)" }}>Triệu chứng</label>
                <p style={{ marginTop: "4px", fontWeight: "600" }}>{record.trieu_chung || "Không ghi nhận"}</p>
              </div>
              <div>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--gray-500)" }}>Chẩn đoán</label>
                <p style={{ marginTop: "4px", fontWeight: "800", color: "#ef4444" }}>{record.chan_doan || "Chưa có chẩn đoán"}</p>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ fontSize: "13px", fontWeight: "700", color: "var(--gray-500)" }}>Phác đồ điều trị</label>
                <p style={{ marginTop: "4px", whiteSpace: "pre-wrap" }}>{record.phac_do_dieu_tri || "—"}</p>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: "800", marginBottom: "20px" }}>Hướng dẫn chăm sóc</h3>
            <p style={{ color: "var(--gray-600)", lineHeight: "1.6" }}>{record.huong_dan_cham_soc || "Không có ghi chú thêm."}</p>
          </div>
        </div>

        <div style={{ display: "grid", gap: "24px", height: "fit-content" }}>
          <div className="card" style={{ padding: "24px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "800", marginBottom: "16px" }}>Bệnh nhân & Bác sĩ</h3>
            <div style={{ display: "grid", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--gray-500)" }}>Thú cưng:</span>
                <b style={{ color: "var(--teal)" }}>{record.ten_thu_cung}</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--gray-500)" }}>Chủ nuôi:</span>
                <b>{record.ten_khach_hang}</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--gray-500)" }}>Bác sĩ điều trị:</span>
                <b style={{ color: "var(--teal)" }}>{record.ten_bac_si}</b>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--gray-500)" }}>Ngày khám:</span>
                <b>{new Date(record.ngay_kham).toLocaleDateString('vi-VN')}</b>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: "20px", background: "var(--teal-light)", border: "none" }}>
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <span className="material-symbols-outlined" style={{ color: "var(--teal)" }}>monitor_weight</span>
              <div>
                <div style={{ fontSize: "12px", color: "var(--gray-500)", fontWeight: "700" }}>Cân nặng</div>
                <div style={{ fontSize: "18px", fontWeight: "900", color: "var(--ink)" }}>{record.can_nang || "—"} kg</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ChiTietHoSoBenhAn);
