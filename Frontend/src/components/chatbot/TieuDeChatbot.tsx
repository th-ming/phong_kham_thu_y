import React from "react";

export const TieuDeChatbot: React.FC<{
    activeTab: 'standard' | 'agent';
    isMobile: boolean;
    isVoiceEnabled: boolean;
    onToggleVoice: () => void;
    onResetChat: () => void;
    onClose: () => void;
}> = ({ activeTab, isMobile, isVoiceEnabled, onToggleVoice, onResetChat, onClose }) => (
    <div style={{
        background: activeTab === 'agent' ? 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)' : 'var(--chat-gradient)',
        padding: isMobile ? '12px 16px' : '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white',
        transition: 'all 0.4s ease',
        borderTopLeftRadius: isMobile ? '0' : '22px',
        borderTopRightRadius: isMobile ? '0' : '22px'
    }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '10px', height: '10px', background: '#4ade80', borderRadius: '50%', boxShadow: '0 0 10px #4ade80' }}></div>
            <span style={{ fontWeight: 900, fontSize: isMobile ? '0.9rem' : '1.05rem', letterSpacing: 0 }}>
                {activeTab === 'agent' ? 'Rexi Agent' : (isMobile ? 'Trợ lý Rexi' : 'Trợ lý Rexi 🐾')}
            </span>
            {isMobile && <span style={{ fontSize: '0.65rem', color: '#86efac', fontWeight: 800, letterSpacing: '0.5px' }}>ONLINE</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '10px' : '14px' }}>
            {!isMobile && (
                <>
                    <span
                        className="material-symbols-outlined"
                        style={{ fontSize: '22px', cursor: 'pointer', color: isVoiceEnabled ? '#4ade80' : 'white', opacity: isVoiceEnabled ? 1 : 0.7 }}
                        onClick={onToggleVoice}
                        title={isVoiceEnabled ? "Tắt đọc thành tiếng" : "Bật đọc thành tiếng"}
                    >
                        {isVoiceEnabled ? 'volume_up' : 'volume_off'}
                    </span>
                    <span className="material-symbols-outlined" style={{ fontSize: '22px', cursor: 'pointer', opacity: 0.8 }} onClick={onResetChat} title="Làm mới cuộc hội thoại">
                        restart_alt
                    </span>
                </>
            )}
            <span className="material-symbols-outlined" style={{ fontSize: isMobile ? '22px' : '22px', cursor: 'pointer', opacity: 0.8 }} onClick={onClose}>
                close
            </span>
        </div>
    </div>
);
