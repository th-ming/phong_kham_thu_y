import React from "react";

export type QuickSuggestion = {
    label: string;
    prompt: string;
    tone?: "default" | "danger" | "warning" | "success" | "info" | "agent";
};

const sharedClinicalSuggestions: QuickSuggestion[] = [
    { label: "Cấp cứu hóc dị vật", prompt: "Bé bị hóc dị vật, sơ cứu thế nào?", tone: "danger" },
    { label: "Lịch tiêm phòng", prompt: "Lịch tiêm phòng vaccine định kỳ cho chó mèo?", tone: "info" },
    { label: "Dấu hiệu cần đi khám", prompt: "Những dấu hiệu nào ở chó mèo cần đưa đi khám ngay?", tone: "warning" },
    { label: "Chăm sóc sau khám", prompt: "Sau khi bé vừa khám xong cần chăm sóc và theo dõi thế nào?", tone: "success" },
    { label: "Dinh dưỡng thú cưng", prompt: "Tư vấn khẩu phần ăn phù hợp cho chó mèo theo tuổi và cân nặng", tone: "default" },
    { label: "Sơ cứu ngộ độc", prompt: "Cách sơ cứu mèo bị ngộ độc thực phẩm?", tone: "danger" },
];

const standardSuggestionMap: Record<string, QuickSuggestion[]> = {
    customer: [
        { label: "Đặt lịch khám", prompt: "Tôi muốn đặt lịch khám sức khỏe cho thú cưng", tone: "success" },
        { label: "Hồ sơ bé", prompt: "Tôi muốn xem và hiểu hồ sơ y tế của thú cưng", tone: "info" },
        { label: "Hóa đơn của tôi", prompt: "Tôi muốn kiểm tra các hóa đơn và trạng thái thanh toán", tone: "warning" },
        ...sharedClinicalSuggestions,
    ],
    admin: [
        { label: "Tổng quan hôm nay", prompt: "Tóm tắt nhanh tình hình vận hành phòng khám hôm nay", tone: "agent" },
        { label: "Lịch hẹn hôm nay", prompt: "Xem danh sách lịch hẹn hôm nay và ca cần xử lý", tone: "info" },
        { label: "Khách hàng mới", prompt: "Kiểm tra số khách hàng mới và xu hướng hôm nay", tone: "success" },
        { label: "Doanh thu", prompt: "Phân tích nhanh doanh thu và hóa đơn hôm nay", tone: "warning" },
        { label: "Kho thuốc cảnh báo", prompt: "Kiểm tra thuốc sắp hết hoặc cần nhập thêm", tone: "danger" },
        { label: "Nhân sự & quyền", prompt: "Gợi ý kiểm tra phân quyền và tài khoản nhân sự", tone: "default" },
        ...sharedClinicalSuggestions.slice(0, 3),
    ],
    manager: [
        { label: "Tải vận hành", prompt: "Đánh giá tải vận hành theo lịch hẹn và ca khám hôm nay", tone: "agent" },
        { label: "Bác sĩ bận", prompt: "Bác sĩ nào đang có nhiều ca nhất hôm nay?", tone: "info" },
        { label: "Dịch vụ nổi bật", prompt: "Dịch vụ nào đang được đặt nhiều hoặc tạo doanh thu tốt?", tone: "success" },
        { label: "Lịch trực", prompt: "Kiểm tra lịch trực và nhân sự thiếu ca", tone: "warning" },
        { label: "Báo cáo nhanh", prompt: "Tạo báo cáo nhanh hoạt động phòng khám hôm nay", tone: "agent" },
        ...sharedClinicalSuggestions.slice(0, 3),
    ],
    doctor: [
        { label: "Ca khám hôm nay", prompt: "Xem các ca khám hôm nay của bác sĩ và thứ tự ưu tiên", tone: "info" },
        { label: "Bệnh án gần đây", prompt: "Tóm tắt các bệnh án gần đây cần theo dõi", tone: "agent" },
        { label: "Liều Diazepam", prompt: "Cần chuẩn bị liều lượng Diazepam cấp cứu thế nào?", tone: "danger" },
        { label: "Sơ cứu Heimlich", prompt: "Hướng dẫn kỹ thuật Heimlich cho chó mèo?", tone: "danger" },
        { label: "Đọc xét nghiệm", prompt: "Gợi ý cách đọc kết quả xét nghiệm máu chó mèo", tone: "info" },
        { label: "Phác đồ điều trị", prompt: "Gợi ý lập phác đồ điều trị ban đầu theo triệu chứng", tone: "warning" },
        ...sharedClinicalSuggestions.slice(2, 5),
    ],
    accountant: [
        { label: "Hóa đơn chờ thu", prompt: "Kiểm tra hóa đơn đang chờ thanh toán hôm nay", tone: "warning" },
        { label: "Doanh thu ngày", prompt: "Tổng hợp doanh thu thực thu trong ngày", tone: "success" },
        { label: "Đối soát thanh toán", prompt: "Gợi ý đối soát hóa đơn đã thanh toán và chưa thanh toán", tone: "agent" },
        { label: "Xuất Excel", prompt: "Hướng dẫn xuất file Excel hóa đơn và doanh thu", tone: "info" },
        { label: "Công nợ khách", prompt: "Tìm các khách hàng còn hóa đơn chưa thanh toán", tone: "danger" },
        ...sharedClinicalSuggestions.slice(3, 5),
    ],
    reception: [
        { label: "Xác nhận lịch", prompt: "Xem các lịch hẹn đang chờ xác nhận", tone: "warning" },
        { label: "Check-in", prompt: "Hướng dẫn check-in khách đã tới phòng khám", tone: "success" },
        { label: "Tạo lịch mới", prompt: "Tạo lịch hẹn mới cho khách hàng và thú cưng", tone: "info" },
        { label: "Tìm khách hàng", prompt: "Tìm nhanh khách hàng theo tên hoặc số điện thoại", tone: "agent" },
        { label: "Không đến", prompt: "Các ca nào cần cập nhật trạng thái không đến?", tone: "danger" },
        ...sharedClinicalSuggestions.slice(0, 3),
    ],
    nurse: [
        { label: "Ca cần hỗ trợ", prompt: "Xem các ca khám cần y tá hỗ trợ hôm nay", tone: "info" },
        { label: "Chuẩn bị xét nghiệm", prompt: "Danh sách việc cần chuẩn bị trước khi lấy mẫu xét nghiệm", tone: "warning" },
        { label: "Theo dõi nội trú", prompt: "Các chỉ số cần theo dõi cho thú cưng nội trú", tone: "success" },
        { label: "Vật tư cần kiểm", prompt: "Kiểm tra vật tư hoặc thuốc cần bổ sung cho ca trực", tone: "agent" },
        ...sharedClinicalSuggestions,
    ],
    staff: [
        { label: "Lịch hẹn hôm nay", prompt: "Xem danh sách lịch hẹn hôm nay", tone: "info" },
        { label: "Tìm thú cưng", prompt: "Tìm bé mèo trong hệ thống", tone: "success" },
        { label: "Kho thuốc", prompt: "Kiểm tra kho thuốc tồn kho", tone: "warning" },
        ...sharedClinicalSuggestions,
    ],
    guest: sharedClinicalSuggestions,
};

const agentSuggestionMap: Record<string, QuickSuggestion[]> = {
    customer: [
        { label: "Tự điền lịch khám", prompt: "Tự động điền lịch khám cho thú cưng của tôi vào khung giờ phù hợp", tone: "agent" },
        { label: "Tìm hóa đơn", prompt: "Mở trang hóa đơn và tìm hóa đơn chưa thanh toán của tôi", tone: "warning" },
        { label: "Mở hồ sơ y tế", prompt: "Mở hồ sơ y tế thú cưng của tôi", tone: "info" },
        { label: "Tìm tài liệu mèo mang thai", prompt: "Lên mạng tìm tài liệu chăm sóc mèo mang thai y khoa", tone: "success" },
        { label: "Sơ cứu hóc xương", prompt: "Tìm tài liệu về cách sơ cứu hóc xương ở mèo", tone: "danger" },
    ],
    admin: [
        { label: "Mở báo cáo thống kê", prompt: "Mở trang báo cáo thống kê và tóm tắt KPI quan trọng", tone: "agent" },
        { label: "Tra khách hàng", prompt: "Tìm danh sách khách hàng phòng khám nhanh", tone: "info" },
        { label: "Lịch hẹn hôm nay", prompt: "Xem danh sách lịch hẹn hôm nay", tone: "success" },
        { label: "Kho thuốc tồn", prompt: "Kiểm tra kho thuốc tồn kho", tone: "warning" },
        { label: "Doanh thu hôm nay", prompt: "Thống kê nhanh số liệu hôm nay", tone: "agent" },
        { label: "Phân quyền", prompt: "Mở trang nhân sự và quyền hạn để kiểm tra tài khoản", tone: "danger" },
        { label: "Dịch vụ", prompt: "Mở danh mục dịch vụ và kiểm tra dịch vụ đang hoạt động", tone: "default" },
        { label: "Marketing", prompt: "Gợi ý một chiến dịch marketing nhắc lịch tái khám", tone: "info" },
    ],
    manager: [
        { label: "Điều phối lịch", prompt: "Mở quản lý lịch hẹn và kiểm tra ca cần điều phối", tone: "agent" },
        { label: "Lịch trực", prompt: "Mở điều hành nhân sự và kiểm tra lịch trực tuần này", tone: "warning" },
        { label: "Báo cáo KPI", prompt: "Tạo báo cáo nhanh số ca, doanh thu và bác sĩ hoạt động tích cực", tone: "success" },
        { label: "Tìm khách hàng", prompt: "Tìm danh sách khách hàng phòng khám nhanh", tone: "info" },
        { label: "Kho cảnh báo", prompt: "Kiểm tra thuốc sắp hết hoặc cảnh báo kho", tone: "danger" },
    ],
    doctor: [
        { label: "Ca của tôi", prompt: "Mở danh sách ca khám hôm nay của bác sĩ", tone: "agent" },
        { label: "Bệnh án", prompt: "Tìm bệnh án gần đây cần theo dõi", tone: "info" },
        { label: "Tra cứu y khoa", prompt: "Lên mạng tìm tài liệu điều trị mèo bị giảm bạch cầu", tone: "success" },
        { label: "Đơn thuốc", prompt: "Mở trang kê đơn và kiểm tra đơn thuốc gần nhất", tone: "warning" },
        { label: "Xét nghiệm", prompt: "Mở quản lý xét nghiệm và tìm kết quả mới nhất", tone: "default" },
    ],
    accountant: [
        { label: "Hóa đơn chờ", prompt: "Mở quản lý hóa đơn và lọc hóa đơn chờ thanh toán", tone: "warning" },
        { label: "Đối soát", prompt: "Thống kê nhanh số tiền đã thu và còn chờ thu hôm nay", tone: "agent" },
        { label: "Xuất Excel", prompt: "Mở trang hóa đơn để xuất Excel doanh thu", tone: "success" },
        { label: "Tìm hóa đơn", prompt: "Tìm hóa đơn theo mã hoặc số điện thoại khách hàng", tone: "info" },
        { label: "Báo cáo doanh thu", prompt: "Mở báo cáo thống kê doanh thu", tone: "default" },
    ],
    reception: [
        { label: "Chờ xác nhận", prompt: "Mở quản lý lịch hẹn và lọc lịch chờ xác nhận", tone: "warning" },
        { label: "Check-in ca", prompt: "Mở trang tiếp tân để check-in ca đang tới", tone: "success" },
        { label: "Tạo lịch hộ", prompt: "Tự động tạo lịch khám nhanh cho khách hàng mới", tone: "agent" },
        { label: "Tra SĐT khách", prompt: "Tìm khách hàng theo số điện thoại", tone: "info" },
        { label: "Ca không đến", prompt: "Lọc các ca không đến hoặc đã hủy hôm nay", tone: "danger" },
    ],
    nurse: [
        { label: "Lịch trực", prompt: "Mở lịch trực cá nhân và kiểm tra ca sắp tới", tone: "info" },
        { label: "Ca hỗ trợ", prompt: "Tìm ca khám cần y tá hỗ trợ hôm nay", tone: "agent" },
        { label: "Xét nghiệm", prompt: "Mở quản lý xét nghiệm và cân lâm sàng", tone: "success" },
        { label: "Kho vật tư", prompt: "Kiểm tra vật tư hoặc thuốc cần bổ sung", tone: "warning" },
        { label: "Nội trú", prompt: "Tạo checklist theo dõi nội trú cho thú cưng", tone: "default" },
    ],
    staff: [
        { label: "Lịch hôm nay", prompt: "Xem danh sách lịch hẹn hôm nay", tone: "info" },
        { label: "Tìm thú cưng", prompt: "Tìm bé mèo trong hệ thống", tone: "success" },
        { label: "Kho thuốc", prompt: "Kiểm tra kho thuốc tồn kho", tone: "warning" },
        { label: "Tài liệu y khoa", prompt: "Lên mạng tìm tài liệu chăm sóc mèo mang thai y khoa", tone: "agent" },
    ],
    guest: [
        { label: "Đăng nhập", prompt: "Tôi cần đăng nhập để sử dụng các chức năng cá nhân", tone: "info" },
        { label: "Đặt lịch", prompt: "Hướng dẫn đặt lịch khám thú cưng", tone: "success" },
        { label: "Dịch vụ Rexi", prompt: "Rexi có những dịch vụ thú y nào?", tone: "default" },
    ],
};

export const getChatbotSuggestions = (roleSuggestionKey: string) => ({
    standardSuggestions: standardSuggestionMap[roleSuggestionKey] || standardSuggestionMap.staff,
    agentSuggestions: agentSuggestionMap[roleSuggestionKey] || agentSuggestionMap.staff,
});

const suggestionToneStyles: Record<NonNullable<QuickSuggestion["tone"]>, React.CSSProperties> = {
    default: { borderColor: "var(--gray-300)", background: "var(--background)", color: "var(--ink)" },
    danger: { borderColor: "rgba(239, 68, 68, 0.55)", background: "rgba(239, 68, 68, 0.08)", color: "#ef4444" },
    warning: { borderColor: "rgba(245, 158, 11, 0.55)", background: "rgba(245, 158, 11, 0.10)", color: "#f59e0b" },
    success: { borderColor: "rgba(16, 185, 129, 0.55)", background: "rgba(16, 185, 129, 0.10)", color: "#10b981" },
    info: { borderColor: "rgba(34, 211, 238, 0.55)", background: "rgba(34, 211, 238, 0.10)", color: "#22d3ee" },
    agent: { borderColor: "rgba(244, 63, 94, 0.55)", background: "rgba(244, 63, 94, 0.10)", color: "#f43f5e" },
};

interface GoiYNhanhChatbotProps {
    suggestions: QuickSuggestion[];
    onSelect: (prompt: string) => void;
    prefix: "standard" | "agent";
}

export const GoiYNhanhChatbot: React.FC<GoiYNhanhChatbotProps> = ({ suggestions, onSelect, prefix }) => (
    <div className="chat-suggestion-shell" data-ai-id={`chat-suggestions-${prefix}`} aria-label={`Gợi ý nhanh ${prefix}`}>
        <div className="chat-suggestion-track">
            {suggestions.map((item, idx) => (
                <button
                    key={`${prefix}-${idx}-${item.label}`}
                    data-ai-id={`button-chatbot-suggestion-${prefix}-${idx}`}
                    onClick={() => onSelect(item.prompt)}
                    className="chat-suggestion-chip"
                    style={suggestionToneStyles[item.tone || "default"]}
                    type="button"
                >
                    {item.label}
                </button>
            ))}
        </div>
    </div>
);
