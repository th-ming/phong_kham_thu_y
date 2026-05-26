import { normalizeSearchText } from "./index";

/**
 * Kiểm tra xem một chuỗi text (từ element hoặc lệnh chat) có phải là hành động nhạy cảm không.
 * Đã xử lý triệt để các trường hợp trùng lặp từ vựng tiếng Việt (khoa khám bệnh vs khóa tài khoản, đo huyết áp vs hủy).
 */
export const isSensitiveAction = (text: string): boolean => {
    if (!text) return false;
    const normalized = normalizeSearchText(text).trim();

    // 1. Các từ nhạy cảm có độ nguy hiểm cao, hiếm khi bị trùng nghĩa trong ngữ cảnh phòng khám
    const strongPhrases = [
        "xoa", "thanh toan", "chinh sua", "cap nhat", "tao moi", "luu"
    ];
    
    // 2. Các từ dễ trùng (huy, khoa, doi) cần phải đi kèm ngữ cảnh (verb + object)
    // hoặc đứng đúng một mình (thường là label của button)
    const conditionalPhrases = {
        "huy": ["huy lich", "huy bo", "huy phieu", "huy hoa don", "huy kham"],
        "khoa": ["khoa tai khoan", "khoa user", "khoa nick", "khoa the", "khoa nhan vien"],
        "doi": ["doi mat khau", "doi pass", "doi lich", "doi ca", "doi thong tin"]
    };

    // Kiểm tra strong phrases (dùng regex word boundary để tránh bắt dính vào từ khác nếu có)
    if (strongPhrases.some(p => new RegExp(`\\b${p}\\b`, 'i').test(normalized))) {
        return true;
    }
    
    // Kiểm tra cụm từ an toàn cho từ dễ trùng
    for (const [, contextList] of Object.entries(conditionalPhrases)) {
        if (contextList.some(p => normalized.includes(p))) {
            return true;
        }
    }
    
    // Rule đặc biệt: Nếu text CHỈ LÀ đúng một chữ "huy", "khoa" hoặc "doi" (thường là text trên 1 button nhỏ)
    if (normalized === "huy" || normalized === "khoa" || normalized === "doi") {
        return true;
    }
    
    return false;
};

/**
 * Kiểm tra xem câu lệnh có phải là câu lệnh xác nhận (đồng ý) không
 */
export const isAffirmationCommand = (text: string): boolean => {
    const normalized = normalizeSearchText(text).trim();
    return /^(ok|oke|okay|dong y|xac nhan|chot|lam di|duoc|yes|y|tiep tuc|toi dong y)$/.test(normalized);
};

/**
 * Kiểm tra xem câu lệnh có phải là lệnh hủy bỏ hành động hiện tại không
 */
export const isCancelCommand = (text: string): boolean => {
    const normalized = normalizeSearchText(text).trim();
    return /^(huy|bo qua|khong|khong lam nua|dung lai|thoi)$/.test(normalized);
};
