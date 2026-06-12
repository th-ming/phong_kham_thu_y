import React from "react";

export const BangHanhDongAgentChatbot: React.FC<{
    action: any;
    isMobile: boolean;
}> = ({ action, isMobile }) => {
    if (!action) return null;

    return (
        <div style={{
            position: 'fixed',
            bottom: isMobile ? '85px' : '95px',
            right: isMobile ? '16px' : '430px',
            width: isMobile ? 'calc(100vw - 32px)' : '340px',
            padding: '16px',
            borderRadius: '16px',
            background: 'rgba(15, 23, 42, 0.92)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: action.type === 'ERROR'
                ? '1.5px solid rgba(239, 68, 68, 0.45)'
                : action.type === 'SUCCESS'
                    ? '1.5px solid rgba(16, 185, 129, 0.45)'
                    : '1.5px solid rgba(244, 63, 94, 0.45)',
            boxShadow: action.type === 'ERROR'
                ? '0 12px 40px rgba(239, 68, 68, 0.25)'
                : action.type === 'SUCCESS'
                    ? '0 12px 40px rgba(16, 185, 129, 0.25)'
                    : '0 12px 40px rgba(244, 63, 94, 0.25)',
            color: '#f8fafc',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            fontFamily: '"Fira Code", "Courier New", Courier, monospace',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 900, fontSize: '0.8rem', color: '#fda4af', letterSpacing: '0.5px' }}>
                    <span className="material-symbols-outlined" style={{
                        fontSize: '18px',
                        animation: action.type === 'START' || action.type === 'PROGRESS' ? 'blink 1.2s infinite' : 'none',
                        color: action.type === 'ERROR' ? '#ef4444' : action.type === 'SUCCESS' ? '#10b881' : '#f43f5e'
                    }}>
                        {action.type === 'ERROR' ? 'error' : action.type === 'SUCCESS' ? 'check_circle' : 'bolt'}
                    </span>
                    AGENT AUTOMATION HUD
                </div>
                <span style={{ fontSize: '0.62rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(244, 63, 94, 0.2)', color: '#fb7185', fontWeight: 'bold' }}>
                    {action.actionType || 'EXEC'}
                </span>
            </div>

            <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)' }}></div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontSize: '0.78rem', color: '#e2e8f0', lineHeight: '1.4' }}>
                    <span style={{ color: '#64748b' }}>$ </span>
                    {action.type === 'START' && `Đang chuẩn bị thực hiện yêu cầu: ${action.actionType}`}
                    {action.type === 'PROGRESS' && (action.message || 'Đang thực hiện...')}
                    {action.type === 'SUCCESS' && (action.message || 'Thực hiện hành động thành công!')}
                    {action.type === 'ERROR' && (action.message || 'Hành động thất bại hoặc bị hủy!')}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <span style={{ fontSize: '0.66rem', color: '#64748b', fontWeight: 'bold' }}>TARGET:</span>
                    <span style={{ fontSize: '0.66rem', color: '#f472b6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '220px' }} title={action.payload}>
                        {action.payload || 'n/a'}
                    </span>
                </div>
            </div>

            <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{
                    height: '100%',
                    width: action.type === 'SUCCESS' ? '100%' : action.type === 'ERROR' ? '100%' : '55%',
                    background: action.type === 'ERROR'
                        ? '#ef4444'
                        : action.type === 'SUCCESS'
                            ? '#10b881'
                            : 'linear-gradient(90deg, #f43f5e, #fda4af)',
                    transition: 'width 0.4s ease-in-out',
                    animation: action.type === 'START' || action.type === 'PROGRESS' ? 'blink 1.2s infinite' : 'none'
                }}></div>
            </div>
        </div>
    );
};
