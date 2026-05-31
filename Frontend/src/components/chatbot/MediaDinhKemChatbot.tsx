import React from "react";

type TepDinhKem = { data: string; type: 'image' | 'video' };

export const MediaDinhKemChatbot: React.FC<{
    files: TepDinhKem[];
    isCompressing: boolean;
    onRemove: (index: number) => void;
}> = ({ files, isCompressing, onRemove }) => {
    if (files.length === 0 && !isCompressing) return null;

    return (
        <div style={{ padding: '10px 20px', background: 'var(--background)', borderTop: '1px solid var(--gray-200)', display: 'flex', gap: '10px', overflowX: 'auto', alignItems: 'center' }}>
            {files.map((file, idx) => (
                <div key={idx} style={{ position: 'relative', display: 'inline-block', flexShrink: 0 }}>
                    {file.type === 'image' ? (
                        <img alt="preview" src={file.data} style={{ height: '60px', width: '60px', borderRadius: '8px', border: '1px solid var(--gray-200)', objectFit: 'cover' }} />
                    ) : (
                        <video src={file.data} style={{ height: '60px', width: '60px', borderRadius: '8px', border: '1px solid var(--gray-200)', objectFit: 'cover' }} />
                    )}
                    <button data-ai-id="button-chatbot-zrmd" onClick={() => onRemove(idx)} style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'white', border: 'none', borderRadius: '50%', color: '#ef4444', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', display: 'flex', padding: '2px' }}>
                        <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>close</span>
                    </button>
                </div>
            ))}
            {isCompressing && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--primary-light)', borderRadius: '12px', color: 'var(--primary)', fontWeight: 850, fontSize: '0.8rem', height: '60px' }}>
                    <span className="icon-spin material-symbols-outlined" style={{ fontSize: '20px' }}>autorenew</span>
                    Đang tải file...
                </div>
            )}
        </div>
    );
};
