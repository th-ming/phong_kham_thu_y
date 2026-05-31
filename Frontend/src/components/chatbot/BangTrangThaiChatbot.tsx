import React, { useState } from "react";

interface BoTaiSuyNghiProps {
    elapsedTime: number;
    loadingText: string;
    isDark: boolean;
}

export const BoTaiSuyNghi: React.FC<BoTaiSuyNghiProps> = ({ elapsedTime, loadingText, isDark }) => {
    const getLoaderIcon = (text: string) => {
        if (text.includes("📅") || text.includes("lịch")) return "calendar_today";
        if (text.includes("📂") || text.includes("hồ sơ")) return "folder_open";
        if (text.includes("🐾") || text.includes("thú cưng")) return "pets";
        if (text.includes("💳") || text.includes("toán")) return "payments";
        if (text.includes("🤖")) return "smart_toy";
        return "psychology";
    };

    const currentIcon = getLoaderIcon(loadingText);

    return (
        <div
            data-ai-id="chatbot-thought-loader"
            style={{
                alignSelf: "flex-start",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 18px",
                borderRadius: "20px 20px 20px 4px",
                background: isDark ? "rgba(30, 41, 59, 0.75)" : "rgba(241, 245, 249, 0.95)",
                backdropFilter: "blur(12px)",
                border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0, 0, 0, 0.05)",
                boxShadow: isDark ? "0 8px 32px rgba(0, 0, 0, 0.25)" : "0 8px 32px rgba(0, 0, 0, 0.05)",
                maxWidth: "85%",
                marginTop: "6px",
                animation: "pulse-soft 2s infinite ease-in-out",
                transition: "all 0.3s ease",
            }}
        >
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                background: isDark ? "rgba(244, 63, 94, 0.15)" : "rgba(244, 63, 94, 0.1)",
                border: "1px solid rgba(244, 63, 94, 0.25)",
                color: "var(--primary)",
                flexShrink: 0,
            }}>
                <span className="material-symbols-outlined" style={{
                    fontSize: "18px",
                    animation: "spin 3s infinite linear",
                }}>
                    {currentIcon}
                </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                <span style={{
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    color: "var(--primary)",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                }}>
                    Rexi đang làm việc ({elapsedTime}s)
                </span>
                <span style={{
                    fontSize: "0.78rem",
                    color: isDark ? "#cbd5e1" : "#334155",
                    fontWeight: 600,
                    lineHeight: 1.35,
                }}>
                    {loadingText}
                </span>
            </div>

            <div className="dot-pulse" style={{ marginLeft: "4px", transform: "scale(0.8)", border: "none", background: "transparent", padding: 0 }}>
                <span style={{ background: "var(--primary)", width: "6px", height: "6px", borderRadius: "50%" }}></span>
                <span style={{ background: "var(--primary)", width: "6px", height: "6px", borderRadius: "50%", animationDelay: "0.2s" }}></span>
                <span style={{ background: "var(--primary)", width: "6px", height: "6px", borderRadius: "50%", animationDelay: "0.4s" }}></span>
            </div>
        </div>
    );
};

export interface ThoughtStep {
    type: string;
    content?: string;
    tool?: string;
    params?: Record<string, any>;
    observation?: string;
}

interface BangQuaTrinhSuyNghiProps {
    steps: ThoughtStep[];
    isDark: boolean;
}

export const BangQuaTrinhSuyNghi: React.FC<BangQuaTrinhSuyNghiProps> = ({ steps, isDark }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!steps || steps.length === 0) return null;

    const getStepBadge = (step: ThoughtStep) => {
        switch (step.type) {
            case "TOOL":
                return {
                    icon: "build",
                    text: `Gọi công cụ: ${step.tool}`,
                    bg: isDark ? "rgba(16, 185, 129, 0.15)" : "rgba(16, 185, 129, 0.1)",
                    border: "1px solid rgba(16, 185, 129, 0.25)",
                    color: "#10b981",
                };
            case "TOOL_UNAUTHORIZED":
                return {
                    icon: "gpp_maybe",
                    text: `Từ chối công cụ: ${step.tool}`,
                    bg: isDark ? "rgba(239, 68, 68, 0.15)" : "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.25)",
                    color: "#ef4444",
                };
            case "FINAL":
                return {
                    icon: "task_alt",
                    text: "Hoàn tất kế hoạch",
                    bg: isDark ? "rgba(59, 130, 246, 0.15)" : "rgba(59, 130, 246, 0.1)",
                    border: "1px solid rgba(59, 130, 246, 0.25)",
                    color: "#3b82f6",
                };
            case "ERROR":
                return {
                    icon: "error_outline",
                    text: "Gặp sự cố hệ thống",
                    bg: isDark ? "rgba(244, 63, 94, 0.15)" : "rgba(244, 63, 94, 0.1)",
                    border: "1px solid rgba(244, 63, 94, 0.25)",
                    color: "#f43f5e",
                };
            default:
                return {
                    icon: "psychology",
                    text: "Phân tích tư duy",
                    bg: isDark ? "rgba(244, 63, 94, 0.15)" : "rgba(244, 63, 94, 0.1)",
                    border: "1px solid rgba(244, 63, 94, 0.25)",
                    color: "var(--primary)",
                };
        }
    };

    return (
        <div style={{
            margin: "8px 0 12px 0",
            borderRadius: "12px",
            border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid rgba(0, 0, 0, 0.06)",
            background: isDark ? "rgba(30, 41, 59, 0.4)" : "rgba(248, 250, 252, 0.65)",
            overflow: "hidden",
            transition: "all 0.2s ease",
            width: "100%",
        }}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    cursor: "pointer",
                    userSelect: "none",
                    background: isDark ? "rgba(30, 41, 59, 0.2)" : "rgba(241, 245, 249, 0.3)",
                    transition: "all 0.2s",
                }}
                onMouseOver={(e) => e.currentTarget.style.background = isDark ? "rgba(255, 255, 255, 0.02)" : "rgba(0, 0, 0, 0.02)"}
                onMouseOut={(e) => e.currentTarget.style.background = isDark ? "rgba(30, 41, 59, 0.2)" : "rgba(241, 245, 249, 0.3)"}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: isDark ? "#cbd5e1" : "#475569", fontSize: "0.78rem", fontWeight: 800 }}>
                    <span className="material-symbols-outlined" style={{ fontSize: "18px", color: "var(--primary)", animation: !isOpen ? "pulse-soft 2s infinite" : "none" }}>
                        psychology
                    </span>
                    QUÁ TRÌNH SUY NGHĨ CỦA REXI ({steps.length} bước)
                </div>
                <span className="material-symbols-outlined" style={{
                    fontSize: "18px",
                    color: isDark ? "#64748b" : "#94a3b8",
                    transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                }}>
                    expand_more
                </span>
            </div>

            {isOpen && (
                <div style={{
                    padding: "12px 14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                    borderTop: isDark ? "1px solid rgba(255, 255, 255, 0.06)" : "1px solid rgba(0, 0, 0, 0.04)",
                    background: isDark ? "rgba(15, 23, 42, 0.25)" : "rgba(255, 255, 255, 0.5)",
                }}>
                    {steps.map((step, idx) => {
                        const badge = getStepBadge(step);
                        return (
                            <div key={idx} style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "6px",
                                paddingLeft: "12px",
                                borderLeft: `2.5px solid ${badge.color}`,
                                position: "relative",
                            }}>
                                <div style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "6px",
                                    padding: "3px 8px",
                                    borderRadius: "6px",
                                    background: badge.bg,
                                    border: badge.border,
                                    color: badge.color,
                                    fontSize: "0.68rem",
                                    fontWeight: 900,
                                    width: "fit-content",
                                }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>
                                        {badge.icon}
                                    </span>
                                    {badge.text}
                                </div>

                                {step.content && (
                                    <div style={{
                                        fontSize: "0.75rem",
                                        color: isDark ? "#cbd5e1" : "#334155",
                                        lineHeight: 1.45,
                                        fontWeight: 600,
                                        whiteSpace: "pre-wrap",
                                    }}>
                                        {step.content}
                                    </div>
                                )}

                                {step.type === "TOOL" && step.params && Object.keys(step.params).length > 0 && (
                                    <div style={{
                                        fontSize: "0.7rem",
                                        background: isDark ? "rgba(0, 0, 0, 0.2)" : "rgba(0, 0, 0, 0.02)",
                                        border: isDark ? "1px solid rgba(255, 255, 255, 0.05)" : "1px solid rgba(0, 0, 0, 0.05)",
                                        padding: "8px 10px",
                                        borderRadius: "6px",
                                        fontFamily: "monospace",
                                        color: isDark ? "#a7f3d0" : "#047857",
                                    }}>
                                        <b>Tham số gửi đi:</b> {JSON.stringify(step.params, null, 2)}
                                    </div>
                                )}

                                {step.observation && (
                                    <div style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: "4px",
                                        fontSize: "0.7rem",
                                        background: isDark ? "rgba(30, 41, 59, 0.8)" : "rgba(241, 245, 249, 0.8)",
                                        padding: "8px 10px",
                                        borderRadius: "6px",
                                        border: isDark ? "1px solid rgba(255, 255, 255, 0.05)" : "1px solid rgba(0, 0, 0, 0.05)",
                                        color: isDark ? "#94a3b8" : "#475569",
                                    }}>
                                        <span style={{ fontWeight: 800, color: isDark ? "#38bdf8" : "#0284c7", fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                                            Kết quả quan sát thực tế (Observation)
                                        </span>
                                        <span style={{ fontFamily: "monospace", whiteSpace: "pre-wrap", lineHeight: 1.4 }}>
                                            {step.observation}
                                        </span>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
