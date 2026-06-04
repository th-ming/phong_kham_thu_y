import React from "react";

export const NutNoiChatbot: React.FC<{
    isOpen: boolean;
    isMobile: boolean;
    activeTab: 'standard' | 'agent';
    isCustomerRoute: boolean;
    onToggle: () => void;
}> = ({ isOpen, isMobile, activeTab, isCustomerRoute, onToggle }) => (
    <button
        data-ai-id="button-chatbot-yhoj"
        id="chatBtn"
        className={isOpen ? 'is-open' : undefined}
        onClick={onToggle}
        style={{
            position: 'fixed', 
            bottom: isMobile 
                ? (isCustomerRoute ? '108px' : '24px') 
                : '30px', 
            right: isMobile ? '24px' : '30px', 
            zIndex: 1101,
            background: activeTab === 'agent' ? 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)' : 'var(--chat-gradient)',
            color: 'white', border: '1.5px solid rgba(255, 255, 255, 0.1)',
            width: isMobile ? '56px' : '64px', height: isMobile ? '56px' : '64px', borderRadius: '50%', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: activeTab === 'agent' ? '0 10px 40px rgba(244, 63, 94, 0.4)' : '0 10px 40px var(--primary-light)',
            transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            animation: 'none',
            backdropFilter: 'blur(5px)'
        }}
    >
        <span className="material-symbols-outlined" style={{ position: 'relative', zIndex: 1, fontSize: '32px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))', animation: isOpen ? 'none' : 'chatIconWaggle 6s infinite ease-in-out' }}>
            {isOpen ? 'close' : 'pets'}
        </span>
    </button>
);
