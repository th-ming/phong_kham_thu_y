import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axiosInstance from "@services/axios";
import { Skeleton } from "@components/CommonUI";

const ChiTietHoSoBenhAn: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<any>(null);
  const [consultations, setConsultations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingConsult, setLoadingConsult] = useState(false);

  useEffect(() => {
    if (id) {
      // FIX N+1: Gọi đúng API lấy 1 bản ghi thay vì tải toàn bộ danh sách
      axiosInstance.get(`/api/ho-so-benh-an/${id}`)
        .then(res => {
          setRecord(res.data);
          setLoading(false);
          // BUG FIX: Lịch sử tư vấn (Chatbot AI) được lưu theo Khách hàng, không phải Thú cưng
          if (res.data?.id_khach_hang) {
            setLoadingConsult(true);
            axiosInstance.get(`/api/lich-su-tu-van/khach-hang/${res.data.id_khach_hang}`)
              .then(cRes => setConsultations(cRes.data || []))
              .catch(e => console.error("Lỗi lấy lịch sử tư vấn:", e))
              .finally(() => setLoadingConsult(false));
          }
        })
        .catch(err => {
          console.error("Lỗi lấy chi tiết hồ sơ:", err);
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="animate-fade-in">
        <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Skeleton width="48px" height="48px" borderRadius="12px" />
          <div>
            <Skeleton width="300px" height="40px" borderRadius="12px" style={{ marginBottom: '8px' }} />
            <Skeleton width="200px" height="20px" borderRadius="8px" />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '32px' }}>
          <div style={{ display: 'grid', gap: '32px' }}>
            <div className="glass-card" style={{ padding: '40px', borderRadius: 'var(--radius-xl)' }}>
              <Skeleton width="250px" height="28px" borderRadius="8px" style={{ marginBottom: '32px' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                <div><Skeleton width="100%" height="60px" borderRadius="8px" /></div>
                <div><Skeleton width="100%" height="60px" borderRadius="8px" /></div>
                <div style={{ gridColumn: '1 / -1' }}><Skeleton width="100%" height="100px" borderRadius="8px" /></div>
              </div>
            </div>
            <div className="glass-card" style={{ padding: '40px', borderRadius: 'var(--radius-xl)' }}>
              <Skeleton width="100%" height="80px" borderRadius="8px" />
            </div>
          </div>
          <div style={{ display: 'grid', gap: '32px', height: 'fit-content' }}>
            <div className="glass-card" style={{ padding: '32px', borderRadius: 'var(--radius-xl)' }}>
              <Skeleton width="100%" height="200px" borderRadius="12px" />
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (!record) return <div style={{ padding: '40px', textAlign: 'center' }}>Không tìm thấy hồ sơ bệnh án.</div>;

  return (
    <div className="animate-fade-in" id="print-medical-record">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-medical-record, #print-medical-record * { visibility: visible; }
          #print-medical-record { position: absolute; left: 0; top: 0; width: 100%; padding: 0; margin: 0; }
          .no-print { display: none !important; }
          .glass-card { box-shadow: none !important; border: 1px solid #ccc !important; break-inside: avoid; }
        }
      `}</style>
      <div style={{ marginBottom: '40px', display: 'flex', alignItems: 'center', gap: '20px' }}>
        <Link to="/quan-ly/ho-so-benh-an" className="btn btn-pill no-print" style={{ background: 'var(--surface)', border: '1px solid var(--gray-200)', padding: '12px' }}>
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--ink)', letterSpacing: '-1px' }}>Chi tiết bệnh án</h1>
          <p style={{ color: 'var(--gray-500)', fontWeight: 600 }}>Mã hồ sơ điện tử: #HS-{id}</p>
        </div>
        <button className="btn btn-primary btn-pill no-print" onClick={() => window.print()} style={{ padding: '12px 24px' }}>
          <span className="material-symbols-outlined">print</span> In Bệnh Án
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '32px' }}>
        <div style={{ display: 'grid', gap: '32px' }}>
          <div className="glass-card" style={{ padding: '40px', borderRadius: 'var(--radius-xl)' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>clinical_notes</span>
              Thông tin lâm sàng
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--gray-400)' }}>TRIỆU CHỨNG</label>
                <p style={{ marginTop: '12px', fontWeight: 700, fontSize: '1.1rem', color: 'var(--ink)' }}>{record.trieu_chung || "Không ghi nhận"}</p>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--gray-400)' }}>CHẨN ĐOÁN XÁC ĐỊNH</label>
                <p style={{ marginTop: '12px', fontWeight: 900, fontSize: '1.1rem', color: 'var(--danger)' }}>{record.chan_doan || "Chưa có chẩn đoán"}</p>
              </div>
              <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--gray-50)', paddingTop: '24px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--gray-400)' }}>PHÁC ĐỒ ĐIỀU TRỊ</label>
                <p style={{ marginTop: '12px', whiteSpace: 'pre-wrap', lineHeight: '1.8', color: 'var(--gray-600)' }}>{record.phac_do_dieu_tri || "—"}</p>
              </div>
            </div>
          </div>

          <div className="glass-card" style={{ padding: '40px', borderRadius: 'var(--radius-xl)' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '24px' }}>Hướng dẫn chăm sóc</h3>
            <p style={{ color: 'var(--gray-600)', lineHeight: '1.8', fontSize: '1rem' }}>{record.huong_dan_cham_soc || "Không có ghi chú thêm cho chủ nuôi."}</p>
          </div>

          <div className="glass-card" style={{ padding: '40px', borderRadius: 'var(--radius-xl)' }}>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>history_edu</span>
              Lịch sử tư vấn (Chatbot & BS)
            </h3>
            {loadingConsult ? <div className="dot-pulse"></div> : (
              <div style={{ display: 'grid', gap: '20px' }}>
                {consultations.length === 0 ? (
                  <p style={{ color: 'var(--gray-400)', fontStyle: 'italic' }}>Bệnh nhân này chưa có dữ liệu tư vấn trước đó.</p>
                ) : (
                  consultations.map((c, idx) => (
                    <div key={idx} style={{
                      padding: '24px', borderRadius: '20px', background: 'var(--gray-50)',
                      border: '1px solid var(--gray-100)', position: 'relative', overflow: 'hidden'
                    }}>
                      <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--primary)' }}></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ fontWeight: 900, color: 'var(--ink)' }}>Hỏi về: {c.cau_hoi || c.noi_dung_khach || "Câu hỏi"}</span>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray-400)' }}>{(c.ngay_tu_van || c.ngay_tao)?.split('T')[0].split('-').reverse().join('/') || "---"}</span>
                      </div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--gray-600)', lineHeight: '1.6' }}>
                        <b style={{ color: 'var(--primary)' }}>💡 Phản hồi:</b> {c.tra_loi || c.noi_dung_rexi || ""}
                      </div>
                      {c.ghi_chu && (
                        <div style={{ marginTop: '12px', padding: '10px', background: 'var(--warning-light, rgba(245, 158, 11, 0.15))', borderRadius: '10px', fontSize: '0.8rem', color: 'var(--warning, #d97706)', fontWeight: 600 }}>
                          📌 Ghi chú BS: {c.ghi_chu}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gap: '32px', height: 'fit-content' }}>
          <div className="glass-card" style={{ padding: '32px', borderRadius: 'var(--radius-xl)', background: 'var(--secondary-gradient)', color: 'white' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '24px' }}>Bệnh nhân & Bác sĩ</h3>
            <div style={{ display: 'grid', gap: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.8 }}>
                <span>Thú cưng:</span>
                <b style={{ color: 'var(--primary)' }}>{record.ten_thu_cung}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.8 }}>
                <span>Chủ nuôi:</span>
                <b>{record.ten_khach_hang}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.8 }}>
                <span>Bác sĩ:</span>
                <b style={{ color: 'var(--primary)' }}>{record.ten_bac_si}</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.8 }}>
                <span>Ngày khám:</span>
                <b>{record.ngay_kham?.split('T')[0].split('-').reverse().join('/') || "---"}</b>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="glass-card" style={{ padding: '24px', borderRadius: 'var(--radius-xl)', background: 'var(--primary-gradient)', color: 'white', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.2)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>monitor_weight</span>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', opacity: 0.9, fontWeight: 700, marginBottom: '4px' }}>CÂN NẶNG</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900 }}>{record.can_nang || "—"} <small style={{ fontSize: '0.9rem' }}>kg</small></div>
              </div>
            </div>
            <div className="glass-card" style={{ padding: '24px', borderRadius: 'var(--radius-xl)', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ width: '48px', height: '48px', background: 'rgba(255,255,255,0.2)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>device_thermostat</span>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', opacity: 0.9, fontWeight: 700, marginBottom: '4px' }}>NHIỆT ĐỘ</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 900 }}>{record.nhiet_do || "—"} <small style={{ fontSize: '0.9rem' }}>°C</small></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(ChiTietHoSoBenhAn);
