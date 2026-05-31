export const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return "Chào buổi sáng";
    if (hour >= 11 && hour < 14) return "Chào buổi trưa";
    if (hour >= 14 && hour < 18) return "Chào buổi chiều";
    if (hour >= 18 && hour <= 23) return "Chào buổi tối";
    return "Chào cú đêm";
};

export const stripMediaFromStoredMessages = (items: any[]) => {
    return items.map(({ images, videos, ...rest }) => {
        const mediaCount = (Array.isArray(images) ? images.length : 0) + (Array.isArray(videos) ? videos.length : 0);
        return mediaCount > 0
            ? { ...rest, mediaSummary: `Đã lược bỏ ${mediaCount} tệp media khỏi lịch sử lưu cục bộ để giảm tải hệ thống.` }
            : rest;
    });
};

export const readScopedChatHistory = (key: string, fallback: any[]) => {
    try {
        const saved = sessionStorage.getItem(key);
        if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) return stripMediaFromStoredMessages(parsed);
        }
    } catch (e) {
        console.error("Lỗi đọc lịch sử chat:", e);
    }
    return fallback;
};

export const buildLocationPrivacyAnswer = (isClinicStaff: boolean) => {
    return [
        `Không tự biết chính xác vị trí khách hàng đâu ${isClinicStaff ? "đồng nghiệp" : "Sen"} ạ.`,
        "",
        "Web chỉ lấy được vị trí thật khi **người dùng bấm cho phép quyền định vị của trình duyệt**. Nếu họ không cho phép thì hệ thống không có GPS/toạ độ chính xác.",
        "",
        "Hệ thống có thể biết một số dữ liệu khác nếu đã có trong hồ sơ, ví dụ: địa chỉ khách nhập, số điện thoại, email, lịch hẹn, thú cưng. Trình duyệt hoặc máy chủ cũng có thể suy đoán vị trí tương đối từ IP, nhưng cái đó không đủ chính xác để coi là vị trí khách hàng.",
        "",
        "Tóm lại: muốn lấy vị trí chuẩn thì phải xin quyền rõ ràng từ khách, không được âm thầm lấy.",
    ].join("\n");
};
