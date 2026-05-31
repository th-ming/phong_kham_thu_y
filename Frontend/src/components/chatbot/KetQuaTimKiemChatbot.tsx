import React from "react";

export const KetQuaTimKiemChatbot: React.FC<{
    results?: any[];
    isDark: boolean;
}> = ({ results, isDark }) => {
    if (!results || results.length === 0) return null;

    return (
        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {results.map((result: any, rIdx: number) => (
                <div key={rIdx} style={{
                    padding: '10px 14px', borderRadius: '12px', background: isDark ? 'rgba(30, 41, 59, 0.5)' : '#f8fafc',
                    borderLeft: '4px solid #3b82f6', boxShadow: 'var(--shadow-sm)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                        {result.isVerified && (
                            <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#3b82f6' }} title="Đã xác thực bởi Bác sĩ Thú y">
                                verified
                            </span>
                        )}
                        <a href={result.url} target="_blank" rel="noreferrer" style={{ fontWeight: 800, fontSize: '0.8rem', color: '#2563eb', textDecoration: 'none' }}>
                            {result.title}
                        </a>
                    </div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.9, lineHeight: 1.4 }}>{result.snippet}</div>
                </div>
            ))}
            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '12px' }}>info</span>
                Dữ liệu mạng được xác thực y khoa bởi Bác sĩ Rexi.
            </div>
        </div>
    );
};
