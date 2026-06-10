# Targeted suggestion regression audit

Passed: 6/6

## OK - Admin / standard / Kiem tra loi he thong
- Prompt: Nếu hệ thống phản hồi chậm hoặc lỗi API thì admin nên kiểm tra theo thứ tự nào?
- Reply: health_and_safety Tư vấn an toàn Không thay thế bác sĩ; không tự dùng thuốc kê đơn hoặc kháng sinh. Nếu hệ thống phản hồi chậm hoặc lỗi API, admin nên kiểm tra theo thứ tự sau: 1. Kiểm tra trạng thái hệ thống: Kiểm tra xem hệ thống đang hoạt động bình thường hay không. 2. Kiểm tra API: Kiểm tra xem API đang hoạt động bình thường hay không. 3. Kiểm tra kết nối mạng: Kiểm tra xem kết nối mạng của hệ thống đang ổn định hay không. 4. Kiểm tra cấu hình hệ thống: Kiểm tra xem cấu hình hệ thống đã được thiết lập đúng chưa. 5. Kiểm tra log hệ thống: Kiểm tra xem có thông tin lỗi nào trong log hệ thống hay không. Nếu vẫn không thể xác định được nguyên nhân, admin có thể liên hệ với bộ phận IT để được
- URL: http://127.0.0.1:3005/quan-ly/dashboard
- Screenshot: Frontend\output\chat-evidence\suggestions-targeted\admin-standard-system-errors.png

## OK - Admin / agent / Lich hen hom nay
- Prompt: Xem danh sách lịch hẹn hôm nay
- Reply: psychology QUÁ TRÌNH SUY NGHĨ CỦA REXI (2 bước) expand_more Không tìm thấy lịch hẹn khám hôm nay. Trả lời bởi System
- URL: http://127.0.0.1:3005/quan-ly/dashboard
- Screenshot: Frontend\output\chat-evidence\suggestions-targeted\admin-agent-appointments-today.png

## OK - Quan ly / standard / Cap cuu hoc di vat
- Prompt: Bé bị hóc dị vật, sơ cứu thế nào?
- Reply: health_and_safety Tư vấn an toàn Không thay thế bác sĩ; không tự dùng thuốc kê đơn hoặc kháng sinh. Nếu bé đang hóc dị vật: giữ bé bình tĩnh, không thọc sâu vào họng, kiểm tra miệng chỉ lấy dị vật nhìn thấy rõ, vỗ lưng/ép ngực theo kích thước bé nếu còn thở được, rồi đưa đi cấp cứu thú y ngay hoặc gọi hotline 0353.374.156.
- URL: http://127.0.0.1:3005/quan-ly/dashboard
- Screenshot: Frontend\output\chat-evidence\suggestions-targeted\manager-standard-choking-emergency.png

## OK - Ke toan / agent / Tim hoa don
- Prompt: Mở trang hóa đơn để tìm theo mã hoặc số điện thoại khách hàng
- Reply: Tôi đã chuyển sang trang Hóa đơn.
- URL: http://127.0.0.1:3005/quan-ly/hoa-don
- Screenshot: Frontend\output\chat-evidence\suggestions-targeted\accountant-agent-find-invoice.png

## OK - Ke toan / agent / Bao cao doanh thu
- Prompt: Mở báo cáo thống kê doanh thu
- Reply: psychology QUÁ TRÌNH SUY NGHĨ CỦA REXI (1 bước) expand_more Mở báo cáo thống kê doanh thu. Trả lời bởi System
- URL: http://127.0.0.1:3005/quan-ly/bao-cao-thong-ke
- Screenshot: Frontend\output\chat-evidence\suggestions-targeted\accountant-agent-revenue-report.png

## OK - Tiep tan / agent / Ca khong den
- Prompt: Lọc các ca không đến hoặc đã hủy hôm nay
- Reply: psychology QUÁ TRÌNH SUY NGHĨ CỦA REXI (1 bước) expand_more Mở trang lịch hẹn để lọc các ca không đến hoặc đã hủy hôm nay. Trả lời bởi System
- URL: http://127.0.0.1:3005/quan-ly/lich-hen
- Screenshot: Frontend\output\chat-evidence\suggestions-targeted\reception-agent-no-show.png
