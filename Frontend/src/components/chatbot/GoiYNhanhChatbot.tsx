import React from "react";

export type QuickSuggestion = {
    label: string;
    prompt: string;
    tone?: "default" | "danger" | "warning" | "success" | "info" | "agent" | "doctor";
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
        { label: "Chăm sóc mèo mang thai", prompt: "Cách chăm sóc mèo mang thai an toàn tại nhà?", tone: "success" },
        { label: "Hướng dẫn đặt lịch", prompt: "Hướng dẫn tôi cách đặt lịch khám cho thú cưng", tone: "info" },
        { label: "Thanh toán hóa đơn", prompt: "Hướng dẫn thanh toán hóa đơn online", tone: "warning" },
        { label: "Theo dõi sức khỏe", prompt: "Cách tự theo dõi sức khỏe cho thú cưng tại nhà", tone: "success" },
        ...sharedClinicalSuggestions,
    ],
    admin: [
        { label: "Khi nào dùng Agent?", prompt: "Phân biệt khi nào nên dùng Trợ lý Rexi và khi nào nên dùng Rexi Agent?", tone: "info" },
        { label: "Quy trình phân quyền", prompt: "Giải thích nguyên tắc phân quyền nội bộ cho admin khi dùng hệ thống", tone: "default" },
        { label: "Kiểm tra lỗi hệ thống", prompt: "Nếu hệ thống phản hồi chậm hoặc lỗi API thì admin nên kiểm tra theo thứ tự nào?", tone: "warning" },
        { label: "Bảo mật dữ liệu", prompt: "Những dữ liệu nào không nên hiển thị trong chat thường?", tone: "danger" },
        { label: "Vận hành phòng khám", prompt: "Gợi ý checklist vận hành phòng khám đầu ngày cho quản trị viên", tone: "success" },
        { label: "Giao việc đúng vai trò", prompt: "Admin nên phân công tác vụ nào cho quản lý, kế toán, tiếp tân, bác sĩ và y tá?", tone: "default" },
        ...sharedClinicalSuggestions.slice(0, 3),
    ],
    manager: [
        { label: "Điều phối ca khám", prompt: "Quản lý nên điều phối lịch hẹn và nhân sự phòng khám theo nguyên tắc nào?", tone: "info" },
        { label: "Ưu tiên vận hành", prompt: "Khi phòng khám đông khách, nên ưu tiên xử lý những nhóm việc nào trước?", tone: "warning" },
        { label: "Chất lượng dịch vụ", prompt: "Gợi ý cách đánh giá chất lượng dịch vụ phòng khám thú y trong ngày", tone: "success" },
        { label: "Phối hợp vai trò", prompt: "Quản lý nên phối hợp với bác sĩ, y tá, kế toán và tiếp tân thế nào để tránh nghẽn việc?", tone: "default" },
        { label: "Báo cáo cần có", prompt: "Một báo cáo vận hành phòng khám nên gồm những chỉ số nào?", tone: "info" },
        ...sharedClinicalSuggestions.slice(0, 3),
    ],
    doctor: [
        { label: "Ưu tiên ca khám", prompt: "Bác sĩ nên ưu tiên ca khám thú y theo dấu hiệu nguy hiểm nào?", tone: "info" },
        { label: "Ghi bệnh án tốt", prompt: "Một bệnh án thú y nên ghi những trường thông tin nào để dễ theo dõi?", tone: "default" },
        { label: "Nguyên tắc dùng thuốc", prompt: "Những nguyên tắc an toàn khi cân nhắc thuốc cấp cứu cho chó mèo?", tone: "danger" },
        { label: "Sơ cứu Heimlich", prompt: "Hướng dẫn kỹ thuật Heimlich cho chó mèo?", tone: "danger" },
        { label: "Đọc xét nghiệm", prompt: "Gợi ý cách đọc kết quả xét nghiệm máu chó mèo", tone: "info" },
        { label: "Dặn dò chủ nuôi", prompt: "Sau khám, bác sĩ nên dặn dò chủ nuôi theo cấu trúc nào?", tone: "warning" },
        ...sharedClinicalSuggestions.slice(2, 5),
    ],
    accountant: [
        { label: "Đối soát an toàn", prompt: "Quy trình đối soát hóa đơn và thanh toán nên kiểm tra những điểm nào?", tone: "warning" },
        { label: "Báo cáo tài chính", prompt: "Một báo cáo doanh thu ngày của phòng khám nên có những mục nào?", tone: "success" },
        { label: "Sai lệch thanh toán", prompt: "Khi hóa đơn và giao dịch thanh toán lệch nhau thì nên xử lý theo bước nào?", tone: "agent" },
        { label: "Xuất Excel", prompt: "Hướng dẫn xuất file Excel hóa đơn và doanh thu", tone: "info" },
        { label: "Bảo mật hóa đơn", prompt: "Kế toán cần lưu ý gì khi trao đổi thông tin hóa đơn trong chat?", tone: "danger" },
        ...sharedClinicalSuggestions.slice(3, 5),
    ],
    reception: [
        { label: "Xác nhận lịch", prompt: "Tiếp tân nên xác nhận lịch hẹn với khách theo kịch bản nào?", tone: "warning" },
        { label: "Check-in", prompt: "Quy trình check-in khách đã tới phòng khám gồm những bước nào?", tone: "success" },
        { label: "Tạo lịch mới", prompt: "Khi tạo lịch hẹn mới, tiếp tân cần hỏi khách những thông tin nào?", tone: "info" },
        { label: "Tra khách an toàn", prompt: "Khi khách gọi điện, tiếp tân nên xác minh thông tin thế nào trước khi tra hồ sơ?", tone: "agent" },
        { label: "Khách không đến", prompt: "Nên xử lý lịch hẹn khách không đến như thế nào cho đúng quy trình?", tone: "danger" },
        ...sharedClinicalSuggestions.slice(0, 3),
    ],
    nurse: [
        { label: "Ca cần hỗ trợ", prompt: "Y tá nên chuẩn bị hỗ trợ ca khám theo checklist nào?", tone: "info" },
        { label: "Chuẩn bị xét nghiệm", prompt: "Danh sách việc cần chuẩn bị trước khi lấy mẫu xét nghiệm", tone: "warning" },
        { label: "Theo dõi nội trú", prompt: "Các chỉ số cần theo dõi cho thú cưng nội trú", tone: "success" },
        { label: "Vật tư ca trực", prompt: "Y tá nên kiểm tra vật tư gì trước khi bắt đầu ca trực?", tone: "agent" },
        ...sharedClinicalSuggestions.slice(0, 3),
    ],
    staff: [
        { label: "Dùng hệ thống", prompt: "Nhân viên mới nên dùng các phân hệ phòng khám theo thứ tự nào?", tone: "info" },
        { label: "Tra cứu an toàn", prompt: "Khi nào nhân viên nên chuyển sang Rexi Agent để tra dữ liệu thật?", tone: "success" },
        { label: "Quy trình kho", prompt: "Khi kiểm kho thuốc, nhân viên cần lưu ý những điểm nào?", tone: "warning" },
        ...sharedClinicalSuggestions.slice(0, 3),
    ],
    guest: [
        { label: "Thông tin bác sĩ", prompt: "Cho tôi biết thông tin bác sĩ của phòng khám", tone: "info" },
        ...sharedClinicalSuggestions,
    ],
};

const agentSuggestionMap: Record<string, QuickSuggestion[]> = { 
    customer: [
        { label: "Mở đặt lịch", prompt: "Mở trang đặt lịch khám cho thú cưng của tôi", tone: "agent" },
        { label: "Mở lịch đã đặt", prompt: "Mở trang lịch sử lịch hẹn của tôi", tone: "info" },
        { label: "Mở hóa đơn", prompt: "Mở trang hóa đơn và thanh toán của tôi", tone: "warning" },
        { label: "Mở hồ sơ y tế", prompt: "Mở hồ sơ y tế thú cưng của tôi", tone: "info" },
        { label: "Tìm tài liệu mèo mang thai", prompt: "Lên mạng tìm tài liệu chăm sóc mèo mang thai y khoa", tone: "success" },
        { label: "Mở thông tin bác sĩ", prompt: "Mở trang đội ngũ bác sĩ của phòng khám", tone: "doctor" },
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
        { label: "Tìm hóa đơn", prompt: "Mở trang hóa đơn để tìm theo mã hoặc số điện thoại khách hàng", tone: "info" },
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
        { label: "Thông tin bác sĩ", prompt: "Cho tôi biết thông tin bác sĩ của phòng khám", tone: "doctor" },
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
    doctor: { borderColor: "rgba(168, 85, 247, 0.65)", background: "rgba(168, 85, 247, 0.14)", color: "#a855f7" },
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
