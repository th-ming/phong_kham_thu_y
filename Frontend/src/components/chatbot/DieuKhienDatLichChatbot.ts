import { normalizeSearchText, scoreSearchFields } from "../../utils/index";

export const getBookingServiceCardTitle = (card: HTMLElement) => {
    const titleDiv = card.children[0] as HTMLElement | undefined;
    if (titleDiv?.textContent?.trim()) return titleDiv.textContent.trim();
    return (card.textContent || "")
        .replace(/\s+/g, " ")
        .replace(/\s*(Từ|Tu)\s*[\d.,\s₫dđ]+.*$/i, "")
        .trim();
};

const extractBookingServiceQuery = (normalized: string) =>
    normalized
        .replace(/\b(chon|chon giup|giup chon|dich vu|dichvu|cho toi|giup toi|bat ky|bat ki|ngau nhien|moi|mot|1|giup)\b/g, " ")
        .replace(/\s+/g, " ")
        .trim();

export const pickBookingServiceCard = (normalized: string): HTMLElement | null => {
    const cards = Array.from(document.querySelectorAll(".service-card-select[data-ai-id]")) as HTMLElement[];
    if (cards.length === 0) return null;

    const query = extractBookingServiceQuery(normalized);
    if (!query) return cards[0];

    const aliasGroups: { keys: string[]; labelNeedles: string[] }[] = [
        { keys: ["phau thuat", "phau tha", "phau th", "mo", "surgery"], labelNeedles: ["phau thuat", "phau"] },
        { keys: ["cat tia", "tao long", "spa", "grooming"], labelNeedles: ["cat tia", "tao long"] },
        { keys: ["cap cuu", "24/7"], labelNeedles: ["cap cuu"] },
        { keys: ["xet nghiem", "mau", "sinh hoa"], labelNeedles: ["xet nghiem"] },
        { keys: ["chan doan", "hinh anh", "sieu am"], labelNeedles: ["chan doan", "hinh anh"] },
        { keys: ["tiem chung", "vacxin", "vaccine"], labelNeedles: ["tiem chung", "tiem"] },
        { keys: ["kham tong quat", "kham benh", "kham da khoa"], labelNeedles: ["kham"] },
    ];

    let best: { card: HTMLElement; score: number } | null = null;
    for (const card of cards) {
        const label = normalizeSearchText(getBookingServiceCardTitle(card));
        let score = scoreSearchFields(query, [label]);
        for (const group of aliasGroups) {
            if (group.keys.some(k => query.includes(k))) {
                if (group.labelNeedles.some(needle => label.includes(needle))) score += 28;
            }
        }
        if (!best || score > best.score) best = { card, score };
    }
    if (best && best.score >= 15) return best.card;

    const tokens = query.split(/\s+/).filter(t => t.length >= 3);
    const partial = cards.find(card => {
        const label = normalizeSearchText(getBookingServiceCardTitle(card));
        return tokens.some(t => label.includes(t));
    });
    return partial || null;
};

export type BookingPageSummary = {
    pet: string;
    service: string;
    doctor: string;
    datetime: string;
    note: string;
    ready: boolean;
    missing: string[];
};

export const readBookingSummaryFromPage = (): BookingPageSummary => {
    const missing: string[] = [];
    const petSelect = document.querySelector('select[data-ai-id="select_appointment_pet"]') as HTMLSelectElement | null;
    const pet = petSelect?.selectedOptions?.[0]?.textContent?.trim() || "Chưa chọn";
    if (!petSelect?.value) missing.push("thú cưng");

    const serviceCard = document.querySelector(".service-card-select.selected") as HTMLElement | null;
    const service = serviceCard ? getBookingServiceCardTitle(serviceCard) : "Chưa chọn";
    if (!serviceCard) missing.push("dịch vụ");

    const doctorSelect = document.querySelector('select[data-ai-id="dropdown_doctor"]') as HTMLSelectElement | null;
    const doctor = doctorSelect?.value
        ? (doctorSelect.selectedOptions?.[0]?.textContent?.trim() || "Đã chọn bác sĩ")
        : "Bác sĩ bất kỳ";

    const dateInput = document.querySelector('input[data-ai-id="input_appointment_date"]') as HTMLInputElement | null;
    const dateValue = dateInput?.value || "";
    if (!dateValue) missing.push("ngày khám");

    const slotButtons = Array.from(document.querySelectorAll('button[data-ai-id="button-datlichhen-rvj4"]')) as HTMLButtonElement[];
    const selectedSlot = slotButtons.find(btn => {
        const style = btn.getAttribute("style") || "";
        return style.includes("var(--primary)") || style.includes("background: var(--primary");
    });
    const timeLabel = selectedSlot?.textContent?.trim() || "";
    if (!timeLabel) missing.push("khung giờ");

    const datetime = dateValue
        ? `${dateValue.split("-").reverse().join("/")}${timeLabel ? ` • ${timeLabel}` : ""}`
        : "Chưa chọn ngày/giờ";

    const noteInput = document.querySelector('textarea[data-ai-id="textarea_symptom"]') as HTMLTextAreaElement | null;
    const note = noteInput?.value?.trim() || "(chưa ghi chú)";

    return {
        pet,
        service,
        doctor,
        datetime,
        note,
        ready: missing.length === 0,
        missing,
    };
};

export const formatBookingSummaryMessage = (summary: BookingPageSummary) =>
    [
        "Tóm tắt lịch trên form:",
        `• Thú cưng: ${summary.pet}`,
        `• Dịch vụ: ${summary.service}`,
        `• Bác sĩ: ${summary.doctor}`,
        `• Thời gian: ${summary.datetime}`,
        `• Ghi chú: ${summary.note}`,
    ].join("\n");
