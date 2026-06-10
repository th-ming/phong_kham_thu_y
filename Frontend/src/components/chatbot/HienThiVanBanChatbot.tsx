import React from "react";

export const HienThiVanBanChatbot: React.FC<{ text: string }> = ({ text }) => {
    const boldRegex = /\*\*([^*]+)\*\*/g;
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

    const parts = text.split("\n").map((line, idx) => {
        const boldMatches = [...line.matchAll(boldRegex)];
        const linkMatches = [...line.matchAll(linkRegex)];

        if (boldMatches.length === 0 && linkMatches.length === 0) {
            return <p key={idx} style={{ margin: '4px 0', lineHeight: '1.45', fontSize: '0.88rem' }}>{line}</p>;
        }

        return (
            <p key={idx} style={{ margin: '4px 0', lineHeight: '1.45', fontSize: '0.88rem' }}>
                {line.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g).map((subPart, sIdx) => {
                    if (subPart.startsWith("**") && subPart.endsWith("**")) {
                        return <strong key={sIdx} style={{ fontWeight: 900 }}>{subPart.slice(2, -2)}</strong>;
                    }
                    if (subPart.startsWith("[") && subPart.includes("](")) {
                        const match = subPart.match(/\[([^\]]+)\]\(([^)]+)\)/);
                        if (match) {
                            return (
                                <a key={sIdx} data-ai-id={`link_chat_rendered_url_${sIdx}`} href={match[2]} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontWeight: 800, textDecoration: 'underline' }}>
                                    {match[1]}
                                </a>
                            );
                        }
                    }
                    return subPart;
                })}
            </p>
        );
    });

    return <>{parts}</>;
};
