import React from "react";

type ChatbotTab = 'standard' | 'agent';

export const TabChatbot: React.FC<{
    activeTab: ChatbotTab;
    isDark: boolean;
    isMobile: boolean;
    onChangeTab: (tab: ChatbotTab) => void;
}> = ({ activeTab, isDark, isMobile, onChangeTab }) => (
    <div style={{
        display: 'flex', background: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(241, 245, 249, 0.9)',
        borderBottom: '1px solid var(--gray-200)', position: 'relative', padding: '6px', gap: '6px'
    }}>
        <div style={{
            position: 'absolute', top: '6px', bottom: '6px',
            left: activeTab === 'standard' ? '6px' : 'calc(50% + 3px)',
            width: 'calc(50% - 9px)',
            background: activeTab === 'agent' ? 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)' : 'var(--chat-gradient)',
            borderRadius: '14px', transition: 'all 0.35s cubic-bezier(0.25, 1, 0.5, 1)', zIndex: 1,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}></div>

        <button
            type="button"
            data-ai-id="button-chatbot-6hgf"
            onMouseDown={() => onChangeTab('standard')}
            onClick={() => onChangeTab('standard')}
            className={`chat-tab-btn ${activeTab === 'standard' ? 'active-tab' : ''}`}
            style={{ zIndex: 2 }}
        >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chat</span>
            {isMobile ? 'Trợ lý' : 'Trợ lý Rexi'}
        </button>
        <button
            type="button"
            data-ai-id="button-chatbot-jdzj"
            onMouseDown={() => onChangeTab('agent')}
            onClick={() => onChangeTab('agent')}
            className={`chat-tab-btn ${activeTab === 'agent' ? 'active-tab' : ''}`}
            style={{ zIndex: 2 }}
        >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>smart_toy</span>
            Rexi Agent
        </button>
    </div>
);
