export const toSafeContextHeader = (value: string, maxLength = 1000): string => {
    return encodeURIComponent(value.slice(0, maxLength));
};

export const clipContextText = (value: unknown, maxLength = 1200): string => {
    return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, maxLength);
};

export const getApiErrorMessage = (err: any, fallback: string): string => {
    const status = err?.response?.status;
    const data = err?.response?.data;
    const serverMessage = data?.reply || data?.error || data?.message;
    if (serverMessage) return String(serverMessage);
    if (status === 401) return "Phiên đăng nhập đã hết hạn hoặc chưa đăng nhập. Vui lòng đăng nhập lại rồi thử tiếp.";
    if (status === 403) return "Tài khoản hiện tại không đủ quyền thực hiện tác vụ này.";
    if (status === 429) return "Bạn đang gửi yêu cầu quá nhanh. Đợi một chút rồi thử lại.";
    if (status >= 500) return "Máy chủ đang gặp sự cố nên chưa thực hiện được. Vui lòng thử lại sau.";
    return fallback;
};

export const extractTaggedJsonPayload = (replyText: string, tag: string): { cleanedText: string; json: any | null } => {
    const tagIndex = replyText.indexOf(tag);
    if (tagIndex === -1) {
        return { cleanedText: replyText, json: null };
    }

    let jsonStart = tagIndex + tag.length;
    while (jsonStart < replyText.length && /\s/.test(replyText[jsonStart])) {
        jsonStart++;
    }
    if (jsonStart >= replyText.length) {
        return { cleanedText: replyText, json: null };
    }

    let opener = replyText[jsonStart];
    if (opener !== "{" && opener !== "[") {
        const nextBrace = replyText.indexOf("{", jsonStart);
        if (nextBrace === -1) {
            return { cleanedText: replyText, json: null };
        }
        jsonStart = nextBrace;
        opener = "{";
    }

    const closer = opener === "{" ? "}" : "]";
    let depth = 0;
    let inString = false;
    let escaped = false;
    let endPos = -1;

    for (let i = jsonStart; i < replyText.length; i++) {
        const ch = replyText[i];
        if (escaped) {
            escaped = false;
            continue;
        }
        if (ch === "\\") {
            escaped = true;
            continue;
        }
        if (ch === '"') {
            inString = !inString;
            continue;
        }
        if (!inString) {
            if (ch === opener) {
                depth++;
            } else if (ch === closer) {
                depth--;
                if (depth === 0) {
                    endPos = i;
                    break;
                }
            }
        }
    }

    if (endPos === -1) {
        return { cleanedText: replyText, json: null };
    }

    const jsonString = replyText.substring(jsonStart, endPos + 1).trim();
    try {
        const parsed = JSON.parse(jsonString);
        const beforeText = replyText.substring(0, tagIndex).trim();
        const afterText = replyText.substring(endPos + 1).trim();
        const cleanedText = [beforeText, afterText].filter(Boolean).join(" ").trim();
        return { cleanedText, json: parsed };
    } catch (err) {
        console.error("Lỗi parse tagged JSON payload:", err);
        return { cleanedText: replyText, json: null };
    }
};

const pickTextFromJsonPayload = (payload: any): string => {
    if (typeof payload === "string") return payload;
    if (!payload || typeof payload !== "object") return "";

    const directKeys = ["finalAnswer", "final_answer", "reply", "text", "message", "answer", "content", "output"];
    for (const key of directKeys) {
        const value = payload[key];
        if (typeof value === "string" && value.trim()) return value;
    }

    const choiceContent = payload.choices?.[0]?.message?.content || payload.choices?.[0]?.delta?.content;
    if (typeof choiceContent === "string" && choiceContent.trim()) return choiceContent;

    if (Array.isArray(payload)) {
        return payload.map(pickTextFromJsonPayload).filter(Boolean).join("\n");
    }

    return "";
};

const parseAssistantJsonText = (value: string): string => {
    try {
        const parsed = JSON.parse(value);
        return pickTextFromJsonPayload(parsed);
    } catch {
        return "";
    }
};

const stripAssistantInternalText = (value: string): string => {
    return String(value ?? "")
        .replace(/<think>[\s\S]*?<\/think>/gi, " ")
        .replace(/<\/?assistant>/gi, " ")
        .replace(/^\s*ish\s*/i, " ")
        .replace(/Okay, let me break down[\s\S]*?(?=\n\s*[À-ỹA-ZĐ])/i, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
};

export const normalizeRawAssistantReplyText = (raw: unknown, fallback = ""): string => {
    let text = typeof raw === "string" ? raw : pickTextFromJsonPayload(raw);
    if (!text.trim()) text = fallback;
    text = stripAssistantInternalText(text.trim());

    if (/^data:/m.test(text)) {
        const dataText = text
            .replace(/\r\n/g, "\n")
            .split("\n")
            .filter(line => line.startsWith("data:"))
            .map(line => line.replace(/^data:\s?/, ""))
            .filter(line => line && line !== "[DONE]")
            .join("\n")
            .trim();
        if (dataText) text = stripAssistantInternalText(dataText);
    }

    const fencedJson = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fencedJson) {
        const extracted = parseAssistantJsonText(fencedJson[1].trim());
        if (extracted) return stripAssistantInternalText(extracted.trim());
    }

    const jsonText = parseAssistantJsonText(text);
    if (jsonText) return stripAssistantInternalText(jsonText.trim());

    return stripAssistantInternalText(text) || fallback;
};

export const stripChatControlTags = (text: string): string => {
    let cleaned = text;
    ["[AUTO_BOOK:", "[GENERATE_TREATMENT_PDF:", "[SWARM_ORCHESTRATION:"].forEach((tag) => {
        while (cleaned.includes(tag)) {
            const extracted = extractTaggedJsonPayload(cleaned, tag);
            if (extracted.cleanedText === cleaned) break;
            cleaned = extracted.cleanedText;
        }
    });

    return cleaned
        .replace(/\[EMERGENCY\]/gi, "")
        .replace(/\[NAVIGATE:[^\]]+\]/gi, "")
        .replace(/\[(CLICK|FILL|TOGGLE|SELECT|DELETE|SCROLL|PREVIEW_STYLE|PREVIEW_TEXT|PREVIEW_LINK|PREVIEW_REMOVE_LINK|PREVIEW_RESET):[^\]]+\]/gi, "")
        .replace(/\[AUTO_BOOK:[^\]]*\]/gi, "")
        .replace(/\[GENERATE_TREATMENT_PDF:[^\]]*\]/gi, "")
        .replace(/\[SWARM_ORCHESTRATION:[^\]]*\]/gi, "")
        .replace(/[ \t]{2,}/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
};
