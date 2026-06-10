import { normalizeSearchText } from "../../utils/index";

export const matchesNormalizedIntent = (text: string, phrases: string[]) => {
    const normalized = normalizeSearchText(text);
    const padded = ` ${normalized} `;
    const words = new Set(normalized.split(" ").filter(Boolean));
    return phrases.some((phrase) => {
        const normalizedPhrase = normalizeSearchText(phrase);
        if (!normalizedPhrase) return false;
        return normalizedPhrase.includes(" ")
            ? padded.includes(` ${normalizedPhrase} `)
            : words.has(normalizedPhrase);
    });
};

const matchesPhraseIntent = (text: string, phrases: string[]) => matchesNormalizedIntent(text, phrases);

const hasUiActionTarget = (text: string) => {
    const normalized = normalizeSearchText(text);
    const targets = [
        "trang", "phan he", "muc", "danh sach", "hoa don", "ho so", "thu cung", "form",
        "nut", "button", "bang gia", "tai khoan", "lich", "khach hang", "ho so benh",
        "kho", "kho thuoc", "ton kho", "thuoc", "instr", "chatbot", "chat bot", "rexi agent", "tro ly", "header", "footer", "hotline", "link", "duong link", "giao dien"
    ];
    return targets.some(target => normalized.includes(target));
};

export const hasExplicitAgentActionIntent = (text: string) => {
    const actionPhrases = [
        "dat lich", "book lich", "lap lich", "tao lich", "huy lich", "doi lich",
        "tim khach", "tim thu cung", "tra cuu", "kiem tra form", "xem hoa don", "xem danh sach",
        "xem thu cung", "xem ho so", "quan ly thu cung", "sua thong tin",
        "xoa thong tin", "them moi", "tao moi", "xuat file", "in hoa don", "gui email", "dien form", "them link", "them duong link", "xoa link", "go link"
    ];

    const uiActionVerbs = ["bam", "nhan", "click", "tap", "an vao", "cuon", "keo xuong", "keo len", "doi", "chinh", "sua", "cho", "to", "them", "an", "hien"];
    return matchesPhraseIntent(text, actionPhrases)
        || (matchesPhraseIntent(text, uiActionVerbs) && hasUiActionTarget(text));
};

export const hasExplicitNavigationIntent = (text: string) => {
    const normalized = normalizeSearchText(text);

    // Phân biệt "hỏi data" (có/không/bao nhiêu/dang) vs "mở trang" (mở/vào/chuyển)
    // VD: "kiểm tra xem bác sĩ minh đang có lịch khám nào không" → DATA QUERY, KHÔNG phải navigation
    // VD: "mở trang lịch hẹn cho tôi" → NAVIGATION
    const isDataQueryPattern = /\b(co|dang|khong|bao nhieu|nhu the nao|nao|la gi|la sao|tai sao|vi sao|dang co|dang kiem|dang xem|dang hoi|dang tim|co lich|co khach|co hoa don|co benh|co thuoc)\b/.test(normalized);
    const hasExplicitNavVerb = /\b(mo|vao|chuyen|di toi|dua toi|dua den|dan toi|nhay|tele|bay|vo trang)\b/.test(normalized);
    if (isDataQueryPattern && !hasExplicitNavVerb) return false;

    const navigationPhrases = [
        "mo trang", "mo phan he", "mo muc", "vao trang", "vao phan he", "chuyen sang",
        "chuyen trang", "chuyen toi trang", "chuyen den trang",
        "dieu huong", "truy cap", "open page", "go to", "goto",
        "navigate", "visit"
    ];
    const genericNavigationVerbs = ["di toi", "dua toi", "dua den", "dan toi", "dan den", "nhay sang", "sang trang", "toi trang", "den trang", "qua trang", "nhay qua", "tele qua", "bay qua", "vo trang"];

    return matchesPhraseIntent(text, navigationPhrases)
        || (hasExplicitNavVerb && hasUiActionTarget(text))
        || (matchesPhraseIntent(text, genericNavigationVerbs) && hasUiActionTarget(text));
};

export const resolveRelativeDateValue = (text: string) => {
    const normalized = normalizeSearchText(text);
    const date = new Date();
    if (normalized.includes("hom qua") || normalized.includes("hqua") || normalized.includes("yesterday")) {
        date.setDate(date.getDate() - 1);
    } else if (normalized.includes("hom nay") || normalized.includes("today")) {
        // keep today
    } else if (normalized.includes("ngay mai") || normalized.includes("mai ") || normalized.endsWith(" mai")) {
        date.setDate(date.getDate() + 1);
    } else {
        const iso = text.match(/\b(20\d{2}|19\d{2})[-/](0?[1-9]|1[0-2])[-/](0?[1-9]|[12]\d|3[01])\b/);
        if (iso) {
            const [, y, m, d] = iso;
            return `${y}-${String(Number(m)).padStart(2, "0")}-${String(Number(d)).padStart(2, "0")}`;
        }
        const vn = text.match(/\b(0?[1-9]|[12]\d|3[01])[-/](0?[1-9]|1[0-2])[-/](20\d{2}|19\d{2})\b/);
        if (vn) {
            const [, d, m, y] = vn;
            return `${y}-${String(Number(m)).padStart(2, "0")}-${String(Number(d)).padStart(2, "0")}`;
        }
        return null;
    }
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

export const getSafeStandardNavigationTarget = (text: string): { path: string; label: string } | null => {
    if (!hasExplicitNavigationIntent(text) || isConceptualQuestion(text)) return null;
    const normalized = normalizeSearchText(text);
    const safeRoutes = [
        { keywords: ["hoa don", "thanh toan", "bien lai", "bill", "pay"], path: "/khach-hang/hoa-don-thanh-toan", label: "Hóa đơn & thanh toán" },
        { keywords: ["dat lich", "dat kham", "book lich", "lich hen moi"], path: "/khach-hang/dat-lich-hen", label: "Đặt lịch hẹn khám" },
        { keywords: ["lich su lich hen", "lich su hen", "lich da dat", "lich cua toi"], path: "/khach-hang/lich-su-lich-hen", label: "Lịch sử lịch hẹn" },
        { keywords: ["thu cung", "be cung", "boss", "pet", "cho meo"], path: "/khach-hang/quan-ly-thu-cung", label: "Quản lý thú cưng" },
        { keywords: ["ho so y te", "benh an", "ho so benh", "medical"], path: "/khach-hang/ho-so-benh-an", label: "Hồ sơ bệnh án" },
        { keywords: ["ca nhan", "thong tin cua toi", "profile", "acc", "tai khoan"], path: "/khach-hang/thong-tin-ca-nhan", label: "Thông tin cá nhân" },
        { keywords: ["tong quan", "dashboard", "home khach"], path: "/khach-hang/dashboard", label: "Tổng quan khách hàng" },
        { keywords: ["bang gia", "gia dich vu", "chi phi"], path: "/bang-gia", label: "Bảng giá dịch vụ" },
        { keywords: ["bac si", "doi ngu"], path: "/bac-si", label: "Đội ngũ bác sĩ" },
        { keywords: ["lien he", "hotline", "dia chi"], path: "/lien-he", label: "Liên hệ" },
        { keywords: ["trang chu", "home"], path: "/", label: "Trang chủ" },
    ];
    return safeRoutes.find(route => route.keywords.some(keyword => normalized.includes(keyword))) || null;
};

export const isConceptualQuestion = (text: string) => {
    const normalized = normalizeSearchText(text);
    const questionWords = [
        "la gi", "la sao", "tai sao", "vi sao", "nhu nao", "the nao", "duoc khong",
        "co duoc", "co biet", "biet duoc", "co phai", "nghia la", "dung de lam gi",
        "thi sao", "co nen", "nen khong", "bao nhieu", "khi nao", "o dau", "can luu y gi",
    ];
    return questionWords.some(word => normalized.includes(word));
};

export const isMarketingCampaignIntent = (text: string) => matchesNormalizedIntent(text, [
    "chien dich", "marketing", "gui mail", "gui email", "voucher", "swarm", "da agent",
    "nhac lich", "soan email", "tim khach hang co", "gui thong bao", "tim be bi",
    "tim meo", "tim cho bi",
]);
