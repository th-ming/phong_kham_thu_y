type ContextualTipOptions = {
    isClinicStaff: boolean;
    isMobile: boolean;
    shouldUseMatureCustomerTone: boolean;
};

export const getContextualTip = (
    path: string,
    { isClinicStaff, isMobile, shouldUseMatureCustomerTone }: ContextualTipOptions
) => {
    const lowerPath = path.toLowerCase();
    if (isClinicStaff) {
        if (lowerPath.includes("/quan-ly/kho-thuoc")) {
            return isMobile ? "Tra cứu thuốc? 💊" : "Cần lọc thuốc sắp hết hạn hay tìm nhanh loại thuốc nào không ạ? 💊";
        }
        if (lowerPath.includes("/quan-ly/hoa-don")) {
            return isMobile ? "Check hóa đơn? 💳" : "Cần hỗ trợ tìm nhanh hóa đơn hay lọc doanh thu ca trực không ạ? 💳";
        }
        if (lowerPath.includes("/quan-ly/xet-nghiem")) {
            return isMobile ? "Chỉ số máu? 🧪" : "Cần tra cứu nhanh chỉ số sinh hóa máu chuẩn để đối chiếu không ạ? 🧪";
        }
        if (lowerPath.includes("/quan-ly/ho-so-benh-an") || lowerPath.includes("/ho-so-benh-an")) {
            return isMobile ? "Xem bệnh án? 🩺" : "Cần em tìm lại lịch sử điều trị hay phác đồ ca bệnh này không ạ? 🩺";
        }
        if (lowerPath.includes("/tiep-tan") || lowerPath.includes("/quan-ly-lich-hen")) {
            return isMobile ? "Lịch hẹn mới? 🗓️" : "Có ca đặt lịch mới kìa! Cần check-in nhanh hay tìm lịch trống bác sĩ không ạ? 🗓️";
        }
        return isMobile ? "Rexi hỗ trợ 24/7! 🐾" : "Cần Rexi hỗ trợ nghiệp vụ ca trực hay tra cứu y khoa gì không ạ? 🐾";
    }

    if (lowerPath.includes("/dat-lich-hen")) {
        return shouldUseMatureCustomerTone
            ? (isMobile ? "Đặt lịch khám? 🗓️" : "Anh/chị chọn ngày giờ phù hợp. Rexi có thể hỗ trợ kiểm tra và hoàn tất lịch hẹn. 🗓️")
            : (isMobile ? "Đặt lịch boss? 🗓️" : "Sen ơi, chọn ngày giờ rảnh nha! Hoặc gõ 'Autopilot' để Rexi đặt lịch hộ boss! 🗓️");
    }
    if (lowerPath.includes("/hoa-don-thanh-toan")) {
        return shouldUseMatureCustomerTone
            ? (isMobile ? "Thanh toán QR? 💳" : "Anh/chị đang xem hóa đơn. Rexi có thể hướng dẫn quét QR và kiểm tra trạng thái thanh toán. 💳")
            : (isMobile ? "Thanh toán QR? 💳" : "Sen đang xem hóa đơn à? Rexi hướng dẫn quét QR thanh toán nhanh cho boss nha? 💳");
    }
    if (lowerPath.includes("/lich-su-lich-hen")) {
        return shouldUseMatureCustomerTone
            ? (isMobile ? "Lịch sử khám? 🐾" : "Anh/chị muốn kiểm tra lịch sử khám, đổi giờ hoặc hủy lịch hẹn nào không? 🐾")
            : (isMobile ? "Lịch sử boss? 🐾" : "Sen muốn xem lịch sử khám của boss? Cần Rexi hỗ trợ đổi giờ hoặc hủy lịch không? 🐾");
    }
    if (lowerPath.includes("/thong-tin-ca-nhan")) {
        return shouldUseMatureCustomerTone
            ? (isMobile ? "Hồ sơ cá nhân? ❤️" : "Anh/chị đang cập nhật hồ sơ. Rexi có thể kiểm tra thông tin liên hệ để hỗ trợ đặt lịch chính xác. ❤️")
            : (isMobile ? "Hồ sơ boss? ❤️" : "Sen đang cập nhật hồ sơ à? Nhớ ghi đúng số điện thoại để Rexi đặt lịch nhanh nha! ❤️");
    }
    return shouldUseMatureCustomerTone
        ? (isMobile ? "Chat với Rexi! 🐾" : "Anh/chị cần tư vấn sức khỏe, tiêm phòng hoặc dinh dưỡng cho thú cưng không ạ? 🐾")
        : (isMobile ? "Chat với Rexi! 🐾" : "Sen ơi, có câu hỏi gì về sức khỏe, tiêm phòng hay ăn uống của boss không nè? 🐾");
};
