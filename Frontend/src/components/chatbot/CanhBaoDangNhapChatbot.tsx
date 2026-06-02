import React from "react";

export const CanhBaoDangNhapChatbot: React.FC<{
    isVisible?: boolean;
    isDark: boolean;
    accentColor?: string;
    loginButtonId: string;
    registerButtonId: string;
    onGoLogin: () => void;
}> = ({ isVisible, isDark, accentColor = "#10b981", loginButtonId, registerButtonId, onGoLogin }) => {
    if (!isVisible) return null;

    return (
        <div style={{
            marginTop: '12px', padding: '16px', borderRadius: '16px',
            background: isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)',
            border: `1.5px solid ${accentColor === "#10b981" ? "rgba(239, 68, 68, 0.3)" : "rgba(244, 63, 94, 0.3)"}`,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)', color: 'var(--ink)'
        }}>
            <div style={{ fontWeight: 950, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', color: accentColor === "#10b981" ? "#ef4444" : accentColor, fontSize: '0.9rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '20px', animation: 'blink 1.5s infinite' }}>security</span>
                YÊU CẦU ĐĂNG NHẬP AN TOÀN
            </div>
            <div style={{ fontSize: '0.78rem', opacity: 0.9, marginBottom: '14px', lineHeight: 1.5, fontWeight: 600 }}>
                Các tác vụ tự động lập lịch khám, quản lý bệnh án thú y và tra cứu dữ liệu khách hàng yêu cầu tài khoản bảo mật của Bệnh viện Thú y Rexi. Vui lòng đăng nhập hoặc đăng ký tài khoản để Rexi hỗ trợ chính xác.
            </div>
            <div className="responsive-grid-2">
                <button data-ai-id={loginButtonId} onClick={onGoLogin} style={{
                    background: accentColor, color: 'white', border: 'none',
                    borderRadius: '10px', padding: '10px', fontWeight: 900, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>login</span>
                    ĐĂNG NHẬP NGAY
                </button>
                <button data-ai-id={registerButtonId} onClick={onGoLogin} style={{
                    background: 'transparent', border: `1.5px solid ${accentColor}`, color: accentColor,
                    borderRadius: '10px', padding: '10px', fontWeight: 900, fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '15px' }}>person_add</span>
                    ĐĂNG KÝ NHANH
                </button>
            </div>
        </div>
    );
};
