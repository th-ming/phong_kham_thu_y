import React from "react";

export const LopKeoThaFileChatbot: React.FC<{ isVisible: boolean }> = ({ isVisible }) => {
    if (!isVisible) return null;

    return (
        <div style={{
            position: 'absolute', inset: 0, background: 'rgba(16, 185, 129, 0.9)',
            zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', color: 'white', backdropFilter: 'blur(6px)'
        }}>
            <span className="material-symbols-outlined" style={{ fontSize: '80px', marginBottom: '16px', animation: 'chatIconWaggle 2s infinite' }}>cloud_upload</span>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 950 }}>Thả file vào đây</h3>
            <p style={{ fontWeight: 600, fontSize: '0.9rem', marginTop: '8px' }}>Hỗ trợ Ảnh và Video cấp cứu (Tối đa 20MB)</p>
        </div>
    );
};
