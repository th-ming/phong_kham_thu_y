import { normalizeSearchText } from "./index";

/**
 * Kiểm tra xem một chuỗi text (từ element hoặc lệnh chat) có phải là hành động nhạy cảm không.
 * Đã xử lý triệt để các trường hợp trùng lặp từ vựng tiếng Việt (khoa khám bệnh vs khóa tài khoản, đo huyết áp vs hủy).
 */
export const isSensitiveAction = (text: string): boolean => {
    // Theo yêu cầu của sếp: Tắt hoàn toàn việc chặn theo từ khóa ở Frontend
    // Để cho AI và Backend tự phân tích ngữ cảnh và quyết định xem có phải thao tác nhạy cảm hay không.
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
