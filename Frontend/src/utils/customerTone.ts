export type CustomerTone = "genz" | "mature";

export const getCustomerTone = (birthYear: unknown): CustomerTone => {
  const year = Number(birthYear || 0);
  return Number.isInteger(year) && year >= 1997 ? "genz" : "mature";
};

export const isGenZBirthYear = (birthYear: unknown) => getCustomerTone(birthYear) === "genz";

export const customerToneCopy = {
  genz: {
    dashboardTitle: (name: string) => `Hế lô Sen ${name} nha! 🦖👋`,
    dashboardSubtitle: "Hôm nay boss cưng thế nào òi? Cùng xem lịch khám dới chi tiêu dới Rexi nhen! 🐾💖",
    petSectionTitle: "Boss cưng của mình",
    bookingTitle: "Book lịch cho boss 📅",
    bookingSubtitle: "Chọn boss, dịch vụ và khung giờ rảnh; Rexi giữ slot gọn cho Sen nha.",
    bookingNotePlaceholder: "Mô tả tình trạng boss hoặc yêu cầu đặc biệt...",
    appointmentEmptyTitle: "Boss chưa có lịch khám nào",
    appointmentEmptyText: "Có vẻ boss đang ổn áp nè. Sen nhớ đặt lịch định kỳ để Rexi nhắc nhẹ khỏi lỡ kèo nha.",
    appointmentButton: "Book lịch cho boss ngay",
    invoiceTitle: "Bill & thanh toán 💳",
    invoiceSubtitle: "Check chi tiêu, bill đã trả và bill cần xử lý cho boss trong một chỗ.",
    invoiceSearchPlaceholder: "Tìm bill, tên boss...",
    invoicePaidTitle: "Bill xong rồi",
    invoicePaidText: "bill đã thanh toán xong, Sen có thể xem lại chi tiết bất cứ lúc nào.",
    invoiceWaitingTitle: "Bill chờ Sen",
    invoiceWaitingText: "bill đang chờ xử lý. Chọn VNPay hoặc VietQR để thanh toán nhanh nha.",
    profileBirthYearLabel: "NĂM SINH (REXI CHỌN GIỌNG HỢP VỚI SEN)",
    profileBirthYearBadge: "Gen Z vui vẻ"
  },
  mature: {
    dashboardTitle: (name: string) => `Kính chào Quý khách ${name}! 👋`,
    dashboardSubtitle: "Chào mừng Quý khách quay trở lại. Kính chúc Quý khách và các bé cưng một ngày tràn đầy sức khỏe và bình an! 🏥✨",
    petSectionTitle: "Thú cưng của tôi",
    bookingTitle: "Đặt lịch khám 📅",
    bookingSubtitle: "Chọn thú cưng, dịch vụ và thời gian phù hợp; Rexi sẽ hỗ trợ xác nhận lịch hẹn chính xác.",
    bookingNotePlaceholder: "Mô tả tình trạng thú cưng hoặc các yêu cầu đặc biệt...",
    appointmentEmptyTitle: "Chưa có lịch khám nào",
    appointmentEmptyText: "Thú cưng của anh/chị hiện chưa có lịch khám. Vui lòng đặt lịch định kỳ để theo dõi sức khỏe tốt hơn.",
    appointmentButton: "Đặt lịch hẹn ngay",
    invoiceTitle: "Hóa đơn & Thanh toán 💳",
    invoiceSubtitle: "Quản lý chi tiêu, hóa đơn đã thanh toán và các khoản đang chờ xử lý.",
    invoiceSearchPlaceholder: "Tìm hóa đơn, tên thú cưng...",
    invoicePaidTitle: "Hóa đơn đã hoàn tất",
    invoicePaidText: "hóa đơn đã được thanh toán thành công. Anh/chị có thể xem lại chi tiết trong lịch sử.",
    invoiceWaitingTitle: "Cần thanh toán",
    invoiceWaitingText: "hóa đơn đang chờ xử lý hoặc chờ thanh toán. Vui lòng chọn VNPay hoặc VietQR tại từng dòng hóa đơn.",
    profileBirthYearLabel: "NĂM SINH (CÁ NHÂN HÓA TRẢI NGHIỆM)",
    profileBirthYearBadge: "Trưởng thành chuẩn mực"
  }
} as const;
