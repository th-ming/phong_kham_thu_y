import React from "react";

export const PhieuDieuTriChatbot: React.FC<{
    treatmentData: any;
    isDark: boolean;
    color?: string;
    onDownload: (data: any) => void;
}> = ({ treatmentData, isDark, color = "#e11d48", onDownload }) => {
    if (!treatmentData) return null;

    return (
        <div style={{
            marginTop: '12px', padding: '16px', borderRadius: '16px',
            background: isDark ? 'rgba(225, 29, 72, 0.1)' : 'rgba(225, 29, 72, 0.05)',
            border: '1.5px dashed rgba(225, 29, 72, 0.4)',
            boxShadow: 'var(--shadow-sm)', color: 'var(--ink)'
        }}>
            <div style={{ fontWeight: 950, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', color, fontSize: '0.85rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>medication</span>
                PHÁC ĐỒ & ĐƠN THUỐC ĐIỆN TỬ REXI
            </div>
            <div style={{ fontSize: '0.78rem', opacity: 0.9, marginBottom: '12px', lineHeight: 1.5, fontWeight: 600 }}>
                Hồ sơ y khoa của bé <b>{treatmentData.petName}</b> đã được bác sĩ Rexi thiết lập chuẩn lâm sàng. Vui lòng tải phiếu điều trị PDF để in ấn hoặc lưu trữ nhé!
            </div>
            <button
                onClick={() => onDownload(treatmentData)}
                style={{
                    background: color, color: 'white', border: 'none',
                    borderRadius: '10px', padding: '10px 14px', fontWeight: 900, fontSize: '0.75rem',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    width: '100%', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(225, 29, 72, 0.25)'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>picture_as_pdf</span>
                TẢI PHIẾU ĐIỀU TRỊ & ĐƠN THUỐC (PDF)
            </button>
        </div>
    );
};
