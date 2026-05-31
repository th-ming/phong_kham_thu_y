export const getDynamicLoadingText = (query: string, elapsedTime: number, isAgent: boolean) => {
    const queryLower = (query || "").toLowerCase();

    if (queryLower.includes("lịch") || queryLower.includes("hen") || queryLower.includes("hẹn") || queryLower.includes("book")) {
        if (elapsedTime <= 2) return "📅 Đang kết nối phân hệ đặt lịch khám thú cưng...";
        if (elapsedTime <= 5) return "🔍 Đang rà soát trạng thái phòng khám & lịch trống của bác sĩ...";
        return `⏳ Thiết lập lịch hẹn lâm sàng và tạo VietQR đặt cọc... (${elapsedTime}s)`;
    }
    if (queryLower.includes("khách") || queryLower.includes("người") || queryLower.includes("phone") || queryLower.includes("sdt") || queryLower.includes("sđt") || queryLower.includes("chủ")) {
        if (elapsedTime <= 2) return "📂 Đang truy vấn hồ sơ chủ nuôi trong cơ sở dữ liệu phòng khám...";
        if (elapsedTime <= 5) return "🧠 Đối chiếu số điện thoại và thông tin liên lạc...";
        return `⏳ Trích xuất lịch sử khám & thú cưng sở hữu... (${elapsedTime}s)`;
    }
    if (queryLower.includes("chó") || queryLower.includes("mèo") || queryLower.includes("thú cưng") || queryLower.includes("pet") || queryLower.includes("bệnh") || queryLower.includes("kham") || queryLower.includes("khám")) {
        if (elapsedTime <= 2) return "🐾 Đang mở bệnh án lâm sàng của bé thú cưng...";
        if (elapsedTime <= 5) return "📖 Đối chiếu chuyên khoa y học thú y & triệu chứng nguy cấp...";
        return `⏳ Tổng hợp chỉ định điều trị & phác đồ chăm sóc... (${elapsedTime}s)`;
    }
    if (queryLower.includes("tiền") || queryLower.includes("hóa đơn") || queryLower.includes("bill") || queryLower.includes("thanh toán") || queryLower.includes("doanh thu")) {
        if (elapsedTime <= 2) return "💳 Kết nối cổng kế toán & lịch sử hóa đơn dịch vụ...";
        if (elapsedTime <= 5) return "📊 Đang đối soát công nợ & chi tiết dịch vụ thú y...";
        return `⏳ Tổng hợp báo cáo thống kê tài chính... (${elapsedTime}s)`;
    }

    if (isAgent) {
        if (elapsedTime <= 2) return "🤖 Siêu tác tử Rexi đang được kích hoạt...";
        if (elapsedTime <= 5) return "⚙️ Đang phân tích yêu cầu nâng cao & lập kế hoạch ReAct...";
        if (elapsedTime <= 9) return "🛠️ Đang gọi công cụ nghiệp vụ (Function Calling) & đọc cơ sở dữ liệu...";
        return `⏳ Vòng lặp ReAct đang xử lý suy nghĩ nâng cao... (${elapsedTime}s)`;
    }

    if (elapsedTime <= 2) return "🐾 Rexi đang đón nhận yêu cầu của sếp...";
    if (elapsedTime <= 5) return "🧠 Đang chẩn đoán ý định & xem xét bối cảnh giao diện...";
    if (elapsedTime <= 8) return "🌐 Kết nối đến mô hình AI & tạo câu trả lời tối ưu...";
    return `✍️ Đang soạn thảo câu trả lời lâm sàng... (${elapsedTime}s)`;
};
