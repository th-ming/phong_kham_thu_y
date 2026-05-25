import { normalizeSearchText, type UserRoleCode } from "../../utils/index";

export type SpeechLang = "vi-VN" | "en-US";

export const bilingualChatInstruction = {
    role: "system",
    content: "Người dùng có thể viết hoặc nói lẫn tiếng Việt và tiếng Anh trong cùng một câu. Hãy hiểu cả hai ngôn ngữ, giữ nguyên thuật ngữ tiếng Anh kỹ thuật/nghiệp vụ khi phù hợp, và trả lời chủ yếu bằng tiếng Việt tự nhiên trừ khi người dùng yêu cầu English."
};

export const scoreAssistantVoice = (voice: SpeechSynthesisVoice) => {
    const name = `${voice.name} ${voice.voiceURI}`.toLowerCase();
    const lang = voice.lang.toLowerCase();
    let score = 0;

    if (lang === "vi-vn") score += 160;
    else if (lang.includes("vi")) score += 120;
    if (/multilingual|multi-lingual|multi language|multi-language/.test(name)) score += 80;
    if (/natural|neural|online|premium/.test(name)) score += 55;
    if (/hoaimy|hoai my|linh|an|mai|female|woman|zira/.test(name)) score += 38;
    if (/microsoft/.test(name)) score += 28;
    if (/google/.test(name)) score += 18;
    if (/namminh|nam minh|male|desktop|legacy/.test(name)) score -= 18;
    if (voice.default) score += 4;

    return score;
};

export const scoreEnglishVoice = (voice: SpeechSynthesisVoice) => {
    const name = `${voice.name} ${voice.voiceURI}`.toLowerCase();
    const lang = voice.lang.toLowerCase();
    let score = 0;

    if (lang === "en-us") score += 160;
    else if (lang === "en-gb") score += 135;
    else if (lang.startsWith("en")) score += 115;
    if (/natural|neural|online|premium/.test(name)) score += 55;
    if (/jenny|aria|guy|zira|david|mark|susan|google|microsoft/.test(name)) score += 30;
    if (voice.default) score += 4;

    return score;
};

const englishSpeechWords = new Set([
    "api", "ai", "agent", "chat", "voice", "email", "marketing", "booking", "dashboard", "login", "logout",
    "invoice", "payment", "database", "server", "client", "frontend", "backend", "model", "prompt", "token",
    "stream", "upload", "download", "file", "image", "video", "google", "chrome", "edge", "english", "vietnamese",
    "yes", "no", "ok", "okay", "please", "check", "search", "create", "update", "delete", "send", "open",
    "show", "filter", "report", "status", "error", "bug", "fix", "test", "build", "deploy", "cache", "data",
    "react", "typescript", "javascript", "vite", "node", "npm", "spring", "boot", "java", "maven", "jwt",
    "json", "html", "css", "ui", "ux", "url", "http", "https", "sql", "server", "database", "table",
    "component", "state", "props", "hook", "hooks", "callback", "async", "await", "promise", "function",
    "array", "object", "string", "number", "boolean", "true", "false", "null", "undefined", "browser",
    "localstorage", "sessionstorage", "clipboard", "paste", "drag", "drop", "preview", "agent", "standard"
]);

const strongEnglishSpeechWords = new Set([
    "api", "ai", "ui", "ux", "url", "http", "https", "sql", "jwt", "json", "html", "css", "id",
    "react", "typescript", "javascript", "vite", "node", "npm", "spring", "boot", "java", "maven",
    "frontend", "backend", "localstorage", "sessionstorage", "google", "chrome", "edge", "opera",
    "chatgpt", "openai", "gemini", "vnpay", "vietqr", "agent", "agnet"
]);

const vietnameseAsciiSpeechWords = new Set([
    "anh", "em", "toi", "ban", "minh", "sep", "sen", "hay", "giup", "cho", "voi", "cua", "la", "va", "hoac",
    "khong", "duoc", "dang", "ngay", "luc", "ten", "roi", "nhe", "nha", "hom", "nay", "mai", "qua", "xem",
    "mo", "tim", "loc", "tao", "gui", "kiem", "tra", "hoa", "don", "lich", "hen", "thu", "cung", "khach",
    "hang", "benh", "an", "thuoc", "bac", "si", "doanh", "thu", "bao", "cao"
]);

const getSpeechWord = (token: string) => token.replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, "");

const isStrongEnglishSpeechToken = (token: string) => {
    const rawWord = getSpeechWord(token);
    const word = rawWord.toLowerCase();
    if (!word) return false;
    if (strongEnglishSpeechWords.has(word)) return true;
    if (/^[A-Z]{2,8}s?$/.test(rawWord)) return true;
    if (/[a-z][A-Z]/.test(rawWord)) return true;
    if (/^[a-z]+(?:\.[a-z]+)+$/i.test(rawWord)) return true;
    if (/^[a-z]+[-_][a-z0-9_-]+$/i.test(rawWord) && !vietnameseAsciiSpeechWords.has(word)) return true;
    return false;
};

const isEnglishSpeechToken = (token: string) => {
    const rawWord = getSpeechWord(token);
    const word = rawWord.toLowerCase();
    if (!word) return false;
    if (isStrongEnglishSpeechToken(token)) return true;
    if (englishSpeechWords.has(word)) return true;
    if (/^[A-Z]{2,6}s?$/.test(rawWord)) return true;
    if (vietnameseAsciiSpeechWords.has(word)) return false;
    return /^[a-z][a-z-]{3,}$/i.test(word) && /[qwfjz]|tion|ment|ing|er$|or$|ed$/.test(word);
};

const applyInlineEnglishPronunciation = (text: string) => text
    .replace(/\bAI\s+Agent\b/gi, "ây ai ây dừn")
    .replace(/\bAgent\b/gi, "ây dừn")
    .replace(/\bAgnet\b/gi, "ây dừn")
    .replace(/\bAI\b/g, "ây ai")
    .replace(/\bAPI\b/g, "ây pi ai")
    .replace(/\bUI\b/g, "du ai")
    .replace(/\bUX\b/g, "du ích")
    .replace(/\bURL\b/g, "du a eo")
    .replace(/\bID\b/g, "ai đi")
    .replace(/\bChatGPT\b/gi, "chát gi pi ti")
    .replace(/\bOpenAI\b/gi, "âu pần ây ai")
    .replace(/\bGoogle\b/gi, "gu gồ")
    .replace(/\bChrome\b/gi, "crôm")
    .replace(/\bEdge\b/gi, "ét")
    .replace(/\bEmail\b/gi, "i meo");

export const splitSpeechByLanguage = (text: string): Array<{ text: string; lang: SpeechLang }> => {
    const sentences = text
        .split(/(?<=[.!?])\s+/)
        .flatMap(segment => segment.length > 180 ? segment.match(/.{1,170}(?:\s|$)/g) || [segment] : [segment])
        .map(segment => segment.trim())
        .filter(Boolean);

    const segments: Array<{ text: string; lang: SpeechLang }> = [];
    sentences.forEach(sentence => {
        const tokens = sentence.match(/\S+\s*/g) || [sentence];
        let vietnameseText = "";
        let englishText = "";
        let englishCount = 0;
        let hasStrongEnglish = false;

        const pushVietnamese = () => {
            const trimmed = vietnameseText.trim();
            if (trimmed) segments.push({ text: trimmed, lang: "vi-VN" });
            vietnameseText = "";
        };

        const flushEnglish = () => {
            if (!englishText) return;
            const shouldSwitchVoice = englishCount >= 3 || (hasStrongEnglish && englishCount >= 2);
            if (shouldSwitchVoice) {
                pushVietnamese();
                segments.push({ text: englishText.trim(), lang: "en-US" });
            } else {
                vietnameseText += englishText;
            }
            englishText = "";
            englishCount = 0;
            hasStrongEnglish = false;
        };

        tokens.forEach(token => {
            if (isEnglishSpeechToken(token)) {
                englishText += token;
                englishCount += 1;
                if (isStrongEnglishSpeechToken(token)) hasStrongEnglish = true;
            } else {
                flushEnglish();
                vietnameseText += token;
            }
        });

        flushEnglish();
        pushVietnamese();
    });

    return segments;
};

export const polishTextForSpeech = (text: string) => {
    const withoutMarkup = text
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
        .replace(/<[^>]*>/g, "")
        .replace(/[\*\_`#]/g, "")
        .replace(/^-+\s*/gm, "")
        .replace(/[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]/g, "");

    return applyInlineEnglishPronunciation(withoutMarkup)
        .replace(/\bRexi\b/g, "Rếch xi")
        .replace(/([.!?])\s+/g, "$1 ")
        .replace(/[,;:]\s+/g, ", ")
        .replace(/\s+/g, " ")
        .trim();
};

export const inferChatStyle = (currentText: string, history: any[] = []) => {
    const recentUserText = history
        .filter((msg: any) => msg?.type === "user")
        .slice(-6)
        .map((msg: any) => String(msg.text || ""))
        .join(" ");
    const raw = `${recentUserText} ${currentText}`;
    const normalized = normalizeSearchText(raw);
    const lowerRaw = raw.toLowerCase();

    const playfulScore = [
        "haha", "hihi", "hehe", "kkk", "z", "dz", "nhay", "vui", "huhu", "ui", "ê", "eo",
        ":))", "=))", "lol"
    ].reduce((score, keyword) => score + (lowerRaw.includes(keyword) || normalized.includes(keyword) ? 1 : 0), 0);
    const seriousScore = [
        "nghiem tuc", "chinh xac", "bao cao", "phan tich", "giai thich", "chi tiet", "quy trinh",
        "bao mat", "toi uu", "khong anh huong", "kiem tra", "xac minh"
    ].reduce((score, keyword) => score + (normalized.includes(keyword) ? 1 : 0), 0);
    const frustratedScore = [
        "sao no", "bi loi", "lag", "ngu", "ngo", "cc", "chet", "huhu", "cau cuu", "khong duoc",
        "van khong", "chua duoc"
    ].reduce((score, keyword) => score + (normalized.includes(keyword) ? 1 : 0), 0);
    const wantsConcise = ["ngan gon", "noi nhanh", "tra loi ngan", "tom tat", "nhanh thoi"].some(keyword => normalized.includes(keyword));

    const tone = frustratedScore >= 2
        ? "calm-supportive"
        : playfulScore > seriousScore
            ? "friendly-playful"
            : seriousScore >= 2
                ? "professional"
                : "natural";

    return { tone, wantsConcise, playfulScore, seriousScore, frustratedScore };
};

export type UserRoleContextInput = {
    user: any;
    userName: string;
    userRoleName: string;
    normalizedRoleCode: UserRoleCode;
    isCustomerAccount: boolean;
    isClinicStaff: boolean;
};

export const buildCurrentUserRoleContext = ({
    user,
    userName,
    userRoleName,
    normalizedRoleCode,
    isCustomerAccount,
    isClinicStaff
}: UserRoleContextInput) => {
    if (!user) {
        return [
            "Người đang chat: khách chưa đăng nhập.",
            "Cách hướng dẫn: chỉ hướng dẫn thông tin công khai, đăng nhập/đăng ký, đặt lịch cơ bản; không khẳng định đã xem được dữ liệu cá nhân hay dữ liệu nội bộ."
        ].join("\n");
    }

    const displayName = userName || user?.displayName || user?.ten_dang_nhap || "người dùng hiện tại";
    const accountId = user?.id_tai_khoan || user?.idTaiKhoan || "không rõ";
    const profileId = isCustomerAccount
        ? (user?.id_khach_hang || user?.idKhachHang || "không rõ")
        : (user?.id_nhan_vien || user?.idNhanVien || "không rõ");
    const roleGuidanceMap: Record<string, string> = {
        admin: "Đây là tài khoản quản trị: có thể nói theo góc nhìn điều hành hệ thống, cấu hình, phân quyền, báo cáo và kiểm soát dữ liệu. Vẫn yêu cầu xác nhận với thao tác nhạy cảm.",
        quan_ly: "Đây là tài khoản quản lý: ưu tiên hướng dẫn vận hành, lịch hẹn, nhân sự, doanh thu, báo cáo và điều phối phòng khám.",
        bac_si: "Đây là tài khoản bác sĩ: ưu tiên hướng dẫn ca khám, bệnh án, xét nghiệm, đơn thuốc, phác đồ và thông tin chuyên môn thú y.",
        ke_toan: "Đây là tài khoản kế toán: ưu tiên hóa đơn, thanh toán, công nợ, doanh thu, đối soát và báo cáo tài chính.",
        tiep_tan: "Đây là tài khoản tiếp tân: ưu tiên đặt lịch, check-in, tìm khách hàng, xác nhận lịch và điều phối khách tới khám.",
        y_ta: "Đây là tài khoản y tá: ưu tiên hỗ trợ ca khám, chuẩn bị xét nghiệm/vật tư, nội trú và theo dõi sau khám.",
        staff: "Đây là tài khoản nhân sự phòng khám: hướng dẫn theo nghiệp vụ nội bộ nhưng không vượt quá quyền thực tế.",
        khach_hang: "Đây là tài khoản khách hàng: chỉ hướng dẫn dữ liệu cá nhân của chính khách, thú cưng, lịch hẹn, hóa đơn của họ, đặt lịch và chăm sóc thú cưng; không truy vấn dữ liệu nội bộ phòng khám.",
        guest: "Đây là khách chưa xác định quyền: chỉ hướng dẫn thông tin công khai và luồng đăng nhập."
    };
    const roleGuidance = isCustomerAccount
        ? roleGuidanceMap.khach_hang
        : (roleGuidanceMap[normalizedRoleCode] || roleGuidanceMap.staff);

    return [
        `Người đang chat: ${displayName}.`,
        `Vai trò hiển thị: ${userRoleName}; mã vai trò: ${normalizedRoleCode || "không rõ"}.`,
        `Loại tài khoản: ${isCustomerAccount ? "khách hàng" : isClinicStaff ? "nhân sự phòng khám" : "người dùng hệ thống"}; mã tài khoản: ${accountId}; ${isCustomerAccount ? "mã khách hàng" : "mã nhân sự"}: ${profileId}.`,
        `Cách xưng hô/hướng dẫn: ${roleGuidance}`,
        "Khi trả lời, phải dùng đúng vai trò này để chọn ví dụ, thuật ngữ, quyền truy cập và hướng dẫn thao tác. Nếu thiếu quyền hoặc chưa đăng nhập thì nói rõ, không đoán dữ liệu."
    ].join("\n");
};

type NeedContextInput = {
    currentText: string;
    history?: any[];
    currentPath: string;
    hasNavigationIntent: boolean;
    isCustomerAccount: boolean;
    isClinicStaff: boolean;
};

export const inferLikelyUserNeed = ({
    currentText,
    history = [],
    currentPath,
    hasNavigationIntent,
    isCustomerAccount,
    isClinicStaff
}: NeedContextInput) => {
    const recentUserText = history
        .filter((msg: any) => msg?.type === "user")
        .slice(-4)
        .map((msg: any) => String(msg.text || ""))
        .join(" ");
    const normalized = normalizeSearchText(`${recentUserText} ${currentText}`);

    const needChecks: Array<{ key: string; label: string; score: number; guidance: string }> = [
        {
            key: "debug",
            label: "đang cần sửa lỗi hoặc tối ưu hệ thống",
            score: ["loi", "sao no", "khong duoc", "lag", "toi uu", "bug", "sua", "chay ngam", "an ram"].filter(keyword => normalized.includes(keyword)).length,
            guidance: "Ưu tiên chẩn đoán nguyên nhân, bước kiểm tra, sửa an toàn, nói rõ nếu cần refresh/build; không lan man."
        },
        {
            key: "navigation",
            label: "đang cần được dẫn đường hoặc thao tác trên giao diện",
            score: ["vao trang", "mo trang", "chuyen trang", "bam", "click", "o dau", "tim nut", "huong dan"].filter(keyword => normalized.includes(keyword)).length + (hasNavigationIntent ? 2 : 0),
            guidance: "Ưu tiên chỉ đường theo trang hiện tại, tên nút/menu cụ thể, và nếu là Agent thì thao tác khi đủ quyền."
        },
        {
            key: "identity",
            label: "đang cần câu trả lời cá nhân hóa theo tài khoản/vai trò",
            score: ["toi la ai", "tai khoan", "vai tro", "quyen", "chuc vu", "toi can gi", "phong cach"].filter(keyword => normalized.includes(keyword)).length,
            guidance: "Nêu rõ đang dựa trên phiên đăng nhập, vai trò và ngữ cảnh gần nhất; tránh trả lời chung chung."
        },
        {
            key: "booking",
            label: "đang cần đặt lịch hoặc xử lý lịch hẹn",
            score: ["dat lich", "lich hen", "kham", "gio trong", "xac nhan lich", "huy lich", "check in"].filter(keyword => normalized.includes(keyword)).length + (currentPath.includes("lich") || currentPath.includes("dat-lich") ? 1 : 0),
            guidance: "Ưu tiên hỏi/điền thông tin còn thiếu: thú cưng, dịch vụ, ngày giờ, bác sĩ, số điện thoại; không đoán lịch nếu chưa có dữ liệu."
        },
        {
            key: "medical",
            label: "đang cần tư vấn y khoa thú y",
            score: ["benh", "trieu chung", "thuoc", "phac do", "xet nghiem", "cap cuu", "non", "tieu chay", "co giat", "bo an"].filter(keyword => normalized.includes(keyword)).length,
            guidance: "Ưu tiên an toàn y khoa, cảnh báo cấp cứu khi cần, phân biệt thông tin tham khảo với chẩn đoán chính thức."
        },
        {
            key: "finance",
            label: "đang cần hóa đơn, thanh toán hoặc doanh thu",
            score: ["hoa don", "thanh toan", "doanh thu", "cong no", "doi soat", "thu tien", "vnpay", "vietqr"].filter(keyword => normalized.includes(keyword)).length,
            guidance: isCustomerAccount
                ? "Chỉ hướng dẫn hóa đơn/thanh toán của chính khách hàng."
                : "Ưu tiên số liệu, trạng thái hóa đơn, công nợ và quyền kế toán/quản lý."
        }
    ];

    const ranked = needChecks
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 2);

    if (ranked.length === 0) {
        const fallback = isCustomerAccount
            ? "khả năng cần hỗ trợ dùng hệ thống khách hàng, chăm sóc thú cưng, đặt lịch hoặc xem dữ liệu cá nhân"
            : isClinicStaff
                ? "khả năng cần hỗ trợ nghiệp vụ theo chức vụ hiện tại và trang đang mở"
                : "khả năng cần hướng dẫn công khai hoặc đăng nhập";
        return `Nhu cầu dự đoán: ${fallback}. Hỏi lại ngắn gọn nếu thiếu dữ kiện, nhưng nếu có thể suy ra từ trang hiện tại thì chủ động đề xuất bước tiếp theo.`;
    }

    return [
        `Nhu cầu dự đoán chính: ${ranked[0].label}. ${ranked[0].guidance}`,
        ranked[1] ? `Nhu cầu phụ có thể đi kèm: ${ranked[1].label}. ${ranked[1].guidance}` : "",
        "Khi trả lời, hãy chủ động gợi ý bước tiếp theo phù hợp với nhu cầu này; nếu độ chắc chắn thấp thì nói theo dạng 'có vẻ bạn đang cần...'."
    ].filter(Boolean).join("\n");
};

export type AdaptiveInstructionInput = UserRoleContextInput & {
    currentText: string;
    history?: any[];
    currentPath: string;
    hasNavigationIntent: boolean;
};

export const buildAdaptiveChatInstruction = (input: AdaptiveInstructionInput) => {
    const style = inferChatStyle(input.currentText, input.history || []);
    const userRoleContext = buildCurrentUserRoleContext(input);
    const likelyNeed = inferLikelyUserNeed({
        currentText: input.currentText,
        history: input.history,
        currentPath: input.currentPath,
        hasNavigationIntent: input.hasNavigationIntent,
        isCustomerAccount: input.isCustomerAccount,
        isClinicStaff: input.isClinicStaff
    });
    const toneGuide: Record<string, string> = {
        "calm-supportive": "Người dùng đang có vẻ bực/lo/lỗi gấp: trả lời bình tĩnh, đi thẳng vào cách xử lý, không nhây, không đổ lỗi.",
        "friendly-playful": "Người dùng nói chuyện vui hoặc nhây: có thể thân mật, tự nhiên, hơi dí dỏm ở cách nói; nhưng dữ kiện, y khoa, bảo mật, tài chính và thao tác hệ thống phải chính xác, không bịa.",
        professional: "Người dùng đang nghiêm túc: trả lời gọn, rõ, chuyên nghiệp, ưu tiên căn cứ và bước xử lý.",
        natural: "Giữ giọng tự nhiên, thân thiện vừa phải, không quá màu mè."
    };

    return {
        role: "system",
        content: [
            `Định danh và vai trò hiện tại:\n${userRoleContext}`,
            `Phong cách hội thoại suy ra từ các tin gần đây: ${style.tone}. ${toneGuide[style.tone]}`,
            `Nhu cầu người dùng có khả năng đang cần:\n${likelyNeed}`,
            style.wantsConcise ? "Người dùng có dấu hiệu muốn nhanh/gọn: ưu tiên câu ngắn, hành động trước, giải thích sau." : "Điều chỉnh độ dài theo độ phức tạp câu hỏi; tránh dài dòng.",
            "Không bắt chước chửi tục hoặc xúc phạm. Nếu người dùng nói vui thì chỉ phản hồi vui ở phong cách, không làm sai nội dung."
        ].join("\n")
    };
};
