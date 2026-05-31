import { executeAction } from "../ActionExecutor";
import { normalizeSearchText } from "../../utils/index";
import { resolveRelativeDateValue } from "./NhanDienYLenhChatbot";

const getVisibleFieldLabel = (el: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement) => {
    const direct = [
        el.getAttribute("aria-label"),
        el.getAttribute("placeholder"),
        el.getAttribute("name"),
        el.id,
        el.getAttribute("data-ai-id"),
    ].filter(Boolean).join(" ");
    const wrappingLabel = el.closest("label")?.textContent || "";
    const containerText = el.closest("div")?.textContent || "";
    return normalizeSearchText(`${direct} ${wrappingLabel} ${containerText}`.slice(0, 500));
};

interface RunFastVisibleFormEditOptions {
    text: string;
    onAgentReply: (reply: string) => void;
    speakText: (reply: string) => void;
}

export const runFastVisibleFormEdit = async ({
    text,
    onAgentReply,
    speakText,
}: RunFastVisibleFormEditOptions) => {
    const normalized = normalizeSearchText(text);
    const wantsEdit = ["doi", "sua", "dien", "nhap", "set", "cap nhat", "fix"].some(keyword => normalized.includes(keyword));
    if (!wantsEdit) return false;
    let handledAny = false;

    const wantsFemale = normalized.includes("gioi tinh cai") || normalized.includes("giong cai") || normalized.includes("la cai") || normalized.endsWith(" cai");
    const wantsMale = normalized.includes("gioi tinh duc") || normalized.includes("giong duc") || normalized.includes("la duc") || normalized.endsWith(" duc");
    if (wantsFemale || wantsMale) {
        const selects = Array.from(document.querySelectorAll<HTMLSelectElement>("select[data-ai-id], select"))
            .filter(select => {
                const rect = select.getBoundingClientRect();
                return rect.width > 0 && rect.height > 0 && !select.disabled;
            });
        const targetSelect = selects
            .map(select => ({ select, label: getVisibleFieldLabel(select) }))
            .find(({ label }) => label.includes("gioi tinh") || label.includes("giong"));
        if (targetSelect) {
            const requested = wantsFemale ? "cai" : "duc";
            const option = Array.from(targetSelect.select.options).find(opt => {
                const optionText = normalizeSearchText(`${opt.value} ${opt.textContent || ""}`);
                return optionText.includes(requested);
            });
            const aiId = targetSelect.select.getAttribute("data-ai-id");
            if (option && aiId) {
                await executeAction(`[SELECT:${aiId}|${option.value}]`, true);
                const reply = `Đã đổi giới tính trên form thành **${option.textContent?.trim() || option.value}**.`;
                onAgentReply(reply);
                speakText(reply);
                handledAny = true;
            }
        }
    }

    const dateValue = resolveRelativeDateValue(text);
    const wantsDateField = dateValue && ["ngay sinh", "nam sinh", "ngay nhap", "ngay thang", "ngay"].some(keyword => normalized.includes(keyword));
    if (!wantsDateField) return handledAny;

    const inputs = Array.from(document.querySelectorAll<HTMLInputElement>("input[data-ai-id], input"));
    const visibleInputs = inputs.filter(input => {
        const rect = input.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && !input.disabled && !input.readOnly;
    });
    const dateCandidates = visibleInputs
        .map(input => ({ input, label: getVisibleFieldLabel(input) }))
        .filter(({ input, label }) => {
            if (input.type === "date") return true;
            if (normalized.includes("ngay sinh") || normalized.includes("nam sinh")) {
                return label.includes("ngay sinh") || label.includes("nam sinh") || label.includes("ngay thang");
            }
            if (normalized.includes("ngay nhap")) {
                return label.includes("ngay nhap") || label.includes("ngay tao") || label.includes("ngay");
            }
            return label.includes("ngay");
        });

    const target = dateCandidates[0]?.input;
    const aiId = target?.getAttribute("data-ai-id");
    if (!target || !aiId) return handledAny;

    await executeAction(`[FILL:${aiId}|${dateValue}]`, true);
    const reply = `Đã đổi trường ngày trên form thành **${dateValue}**. Bạn kiểm tra lại rồi bấm lưu nếu thông tin đã đúng.`;
    onAgentReply(reply);
    speakText(reply);
    return true;
};
