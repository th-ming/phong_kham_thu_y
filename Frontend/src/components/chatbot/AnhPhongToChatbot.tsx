import React from "react";

export const AnhPhongToChatbot: React.FC<{
    src: string | null;
    onClose: () => void;
}> = ({ src, onClose }) => {
    if (!src) return null;

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
            <img alt="zoomed" src={src} style={{ maxWidth: '90%', maxHeight: '90%', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }} />
            <span className="material-symbols-outlined" style={{ position: 'absolute', top: '30px', right: '30px', color: 'white', fontSize: '32px', cursor: 'pointer' }}>close</span>
        </div>
    );
};
