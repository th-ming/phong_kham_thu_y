import React, { useEffect, useState } from "react";
import axiosInstance from "@services/axios";

interface BuocSwarm {
    agent: string;
    action: string;
    output: string;
}

interface LienHeSwarm {
    name: string;
    email: string;
    phone: string;
    petName: string;
    emailContent: string;
}

interface DuLieuSwarm {
    orchestratorPrompt: string;
    steps: BuocSwarm[];
    finalReply: string;
    contacts?: LienHeSwarm[];
}

interface BangDieuPhoiSwarmProps {
    data: DuLieuSwarm;
    isDark: boolean;
}

export const BangDieuPhoiSwarm: React.FC<BangDieuPhoiSwarmProps> = ({ data, isDark }) => {
    const [currentStep, setCurrentStep] = useState<number>(0);
    const [typingText, setTypingText] = useState<string>("");
    const [isComplete, setIsComplete] = useState<boolean>(false);
    const [isSending, setIsSending] = useState<boolean>(false);
    const [isSent, setIsSent] = useState<boolean>(false);
    const [isCancelled, setIsCancelled] = useState<boolean>(false);
    const [sendError, setSendError] = useState<string>("");
    const [previewIdx, setPreviewIdx] = useState<number | null>(null);

    const contacts = data.contacts || [];

    useEffect(() => {
        if (currentStep < data.steps.length) {
            const step = data.steps[currentStep];
            let charIndex = 0;
            setTypingText("");
            const typingInterval = setInterval(() => {
                if (charIndex < step.output.length) {
                    const chunk = step.output.slice(0, charIndex + 3);
                    setTypingText(chunk);
                    charIndex += 3;
                } else {
                    clearInterval(typingInterval);
                    setTimeout(() => setCurrentStep(prev => prev + 1), 1200);
                }
            }, 8);
            return () => clearInterval(typingInterval);
        }
        setIsComplete(true);
    }, [currentStep, data.steps]);

    const handleApproveAndSend = async () => {
        setIsSending(true);
        setSendError("");
        try {
            await axiosInstance.post("/api/agent/bulk-send-email", {
                contacts,
                campaignName: data.orchestratorPrompt?.slice(0, 60) || "Chiến dịch Marketing Rexi",
            });
            setIsSent(true);
        } catch (err) {
            console.error("Lỗi gửi email:", err);
            setIsSent(false);
            setSendError("Không gửi được chiến dịch email. Vui lòng kiểm tra cấu hình email hoặc thử lại sau.");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div style={{
            marginTop: "12px", padding: "16px", borderRadius: "20px",
            background: isDark ? "rgba(15, 23, 42, 0.95)" : "rgba(248, 250, 252, 0.95)",
            border: "2px solid #3b82f6",
            boxShadow: "0 8px 32px rgba(59, 130, 246, 0.25)",
            fontFamily: "monospace", fontSize: "0.8rem", color: isDark ? "#38bdf8" : "#0369a1",
        }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(59, 130, 246, 0.3)", paddingBottom: "10px", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 900, color: "#3b82f6" }}>
                    <span className="material-symbols-outlined" style={{ animation: "spin 4s infinite linear", fontSize: "18px" }}>sync_alt</span>
                    MULTI-AGENT SWARM CONSOLE
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444" }}></div>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#f59e0b" }}></div>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }}></div>
                </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {data.steps.map((step, idx) => {
                    const isActive = idx === currentStep;
                    const isPassed = idx < currentStep;
                    if (!isActive && !isPassed) return null;
                    return (
                        <div key={idx} style={{
                            padding: "10px 14px", borderRadius: "12px",
                            background: isDark ? "rgba(30, 41, 59, 0.6)" : "rgba(241, 245, 249, 0.9)",
                            border: isActive ? "1px solid #3b82f6" : "1px solid rgba(148, 163, 184, 0.2)",
                            boxShadow: isActive ? "0 0 12px rgba(59, 130, 246, 0.15)" : "none",
                        }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                                <div style={{ fontWeight: 900, color: isActive ? "#3b82f6" : (isDark ? "#e2e8f0" : "#1e293b") }}>{step.agent}</div>
                                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.7rem", fontWeight: 800 }}>
                                    {isActive && (<><span className="material-symbols-outlined" style={{ animation: "spin 1.5s infinite linear", fontSize: "14px", color: "#3b82f6" }}>sync</span><span style={{ color: "#3b82f6" }}>Đang chạy...</span></>)}
                                    {isPassed && (<><span className="material-symbols-outlined" style={{ fontSize: "14px", color: "#10b981" }}>check_circle</span><span style={{ color: "#10b981" }}>Hoàn thành</span></>)}
                                </div>
                            </div>
                            <div style={{ fontSize: "0.72rem", color: isDark ? "#94a3b8" : "#475569", fontStyle: "italic", marginBottom: "6px" }}>Tasks: {step.action}</div>
                            <div style={{ padding: "8px 12px", borderRadius: "8px", background: isDark ? "#0f172a" : "#f8fafc", borderLeft: isActive ? "3px solid #3b82f6" : "3px solid #10b981", color: isDark ? "#38bdf8" : "#0284c7", whiteSpace: "pre-wrap", lineHeight: 1.4, fontSize: "0.75rem" }}>
                                {isActive ? typingText : step.output}
                                {isActive && <span style={{ animation: "blink 0.8s infinite", fontWeight: 900 }}>|</span>}
                            </div>
                        </div>
                    );
                })}
            </div>

            {isComplete && (
                <div className="animate-fade-in">
                    <div style={{ marginTop: "14px", padding: "12px 16px", borderRadius: "14px", background: isDark ? "rgba(16, 185, 129, 0.15)" : "rgba(230, 244, 234, 0.9)", border: "1px solid rgba(16, 185, 129, 0.4)", color: isDark ? "#34d399" : "#15803d", fontWeight: 900, display: "flex", alignItems: "center", gap: "8px", lineHeight: 1.4 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>verified_user</span>
                        <div>{data.finalReply}</div>
                    </div>

                    {contacts.length > 0 && !isSent && !isCancelled && (
                        <div style={{ marginTop: "12px" }}>
                            <div style={{ fontSize: "0.72rem", fontWeight: 900, color: "#3b82f6", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                                <span className="material-symbols-outlined" style={{ fontSize: "14px" }}>group</span>
                                DANH SÁCH {contacts.length} KHÁCH HÀNG - XEM TRƯỚC EMAIL
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "180px", overflowY: "auto" }}>
                                {contacts.map((c, i) => (
                                    <div key={i} style={{ padding: "8px 12px", borderRadius: "10px", background: isDark ? "rgba(30,41,59,0.7)" : "#f1f5f9", border: "1px solid rgba(59,130,246,0.2)", fontSize: "0.72rem" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                            <div>
                                                <span style={{ fontWeight: 900, color: isDark ? "#e2e8f0" : "#1e293b" }}>{c.name}</span>
                                                <span style={{ color: isDark ? "#94a3b8" : "#64748b", marginLeft: "6px" }}>({c.petName})</span>
                                            </div>
                                            <button
                                                data-ai-id={`btn_swarm_preview_${i}`}
                                                onClick={() => setPreviewIdx(previewIdx === i ? null : i)}
                                                style={{ background: "transparent", border: "1px solid #3b82f6", color: "#3b82f6", borderRadius: "6px", padding: "2px 8px", fontSize: "0.65rem", cursor: "pointer", fontWeight: 800 }}
                                            >
                                                {previewIdx === i ? "Ẩn" : "Xem thư"}
                                            </button>
                                        </div>
                                        <div style={{ color: isDark ? "#94a3b8" : "#475569", marginTop: "2px" }}>{c.email || "Chưa có email"} - {c.phone || "---"}</div>
                                        {previewIdx === i && c.emailContent && (
                                            <div style={{ marginTop: "8px", padding: "8px", background: isDark ? "#0f172a" : "#fff", borderRadius: "8px", border: "1px solid rgba(59,130,246,0.3)", color: isDark ? "#cbd5e1" : "#334155", whiteSpace: "pre-wrap", fontSize: "0.7rem", lineHeight: 1.5 }}>
                                                {c.emailContent}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            {!isSending && (
                                <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                                    <button
                                        data-ai-id="btn_swarm_approve_send"
                                        onClick={handleApproveAndSend}
                                        style={{
                                            flex: 1, padding: "12px",
                                            background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
                                            color: "white", border: "none", borderRadius: "12px",
                                            fontWeight: 900, fontSize: "0.82rem", cursor: "pointer",
                                            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                                            boxShadow: "0 4px 16px rgba(59,130,246,0.4)",
                                            transition: "all 0.2s", fontFamily: "inherit",
                                        }}
                                        onMouseOver={e => (e.currentTarget.style.transform = "scale(1.02)")}
                                        onMouseOut={e => (e.currentTarget.style.transform = "scale(1)")}
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>send</span>
                                        PHÊ DUYỆT & GỬI ĐỒNG LOẠT ({contacts.length} EMAIL)
                                    </button>

                                    <button
                                        data-ai-id="btn_swarm_cancel"
                                        onClick={() => setIsCancelled(true)}
                                        style={{
                                            padding: "12px",
                                            background: "transparent",
                                            color: isDark ? "#f87171" : "#ef4444", border: "1.5px solid " + (isDark ? "#f87171" : "#ef4444"), borderRadius: "12px",
                                            fontWeight: 900, fontSize: "0.82rem", cursor: "pointer",
                                            display: "flex", alignItems: "center", justifyContent: "center", gap: "4px",
                                            transition: "all 0.2s", fontFamily: "inherit",
                                        }}
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>close</span>
                                    </button>
                                </div>
                            )}

                            {isSending && (
                                <div style={{ marginTop: "12px", padding: "12px", borderRadius: "12px", background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", color: "white", fontWeight: 900, fontSize: "0.82rem" }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: "18px", animation: "spin 1s infinite linear" }}>autorenew</span>
                                    Đang gửi {contacts.length} email...
                                </div>
                            )}
                            {sendError && (
                                <div style={{ marginTop: "12px", padding: "12px", borderRadius: "12px", background: isDark ? "rgba(127, 29, 29, 0.32)" : "#fef2f2", border: "1px solid rgba(239, 68, 68, 0.45)", color: isDark ? "#fecaca" : "#b91c1c", fontWeight: 850, fontSize: "0.78rem", lineHeight: 1.45 }}>
                                    {sendError}
                                </div>
                            )}
                        </div>
                    )}

                    {isCancelled && (
                        <div style={{ marginTop: "12px", padding: "12px", borderRadius: "12px", background: isDark ? "rgba(100, 116, 139, 0.3)" : "#f1f5f9", border: "1px dashed " + (isDark ? "#475569" : "#cbd5e1"), color: isDark ? "#94a3b8" : "#64748b", fontSize: "0.8rem", fontStyle: "italic", display: "flex", alignItems: "center", gap: "8px" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: "18px" }}>block</span>
                            Đã hủy bỏ chiến dịch gửi email.
                        </div>
                    )}

                    {isSent && (
                        <div style={{ marginTop: "12px", padding: "14px 16px", borderRadius: "14px", background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", color: "white", fontWeight: 900, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "10px", boxShadow: "0 8px 24px rgba(16,185,129,0.35)" }}>
                            <span className="material-symbols-outlined" style={{ fontSize: "24px" }}>mark_email_read</span>
                            <div>
                                <div>Đã gửi thành công {contacts.length} email.</div>
                                <div style={{ fontSize: "0.72rem", fontWeight: 600, opacity: 0.9, marginTop: "4px" }}>Chiến dịch marketing đã hoàn thành. Khách hàng sẽ nhận được thư trong vài phút tới.</div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
