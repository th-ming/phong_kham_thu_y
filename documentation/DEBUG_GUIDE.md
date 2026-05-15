# 🛠️ Rexi Debug & Management Guide

> "Lưu vào đây để sau này làm cho chuẩn - Bí kíp từ Sếp"

## 1. Kiểm tra lỗi nhanh (Frontend)
- Nhấn **F12** trong trình duyệt Chrome.
- Chuyển sang tab **Console**.
- Di chuột vào các dòng lỗi đỏ, nhấn vào biểu tượng **bóng đèn (Gemini)** để xem gợi ý cách sửa từ AI tích hợp sẵn của Google.
- Nếu dữ liệu không hiện lên: Kiểm tra ngay xem API có trả về lỗi 404 hoặc 500 không.

## 2. Xử lý lỗi kết nối Backend
- Nếu lỗi xuất hiện hàng loạt hoặc không tải được dữ liệu, khả năng cao là **Backend chưa chạy** hoặc đang bị treo.
- **Cách khắc phục:**
    1. Tắt hoàn toàn các tiến trình Java đang chạy (`taskkill /F /IM java.exe`).
    2. Chạy lệnh làm sạch và khởi động lại: `.\mvnw.cmd clean spring-boot:run`.
    3. Đợi cho đến khi thấy dòng chữ `Started PktyApplication in ... seconds` thì mới bắt đầu thao tác trên trình duyệt.

## 3. Quản lý Hệ thống (Admin)
- **Sao lưu dữ liệu:** Truy cập trang Cấu hình, nhấn "Sao lưu ngay" và nhớ bấm **"Đồng ý" (OK)** trên bảng xác nhận.
- **Nhật ký hoạt động:** 
    - Xem dòng lịch sử ở bên phải để biết ai đã làm gì. 
    - **Xóa từng dòng:** Nhấn vào biểu tượng thùng rác ở cuối mỗi dòng để xóa bản ghi đó (cần xác nhận).
    - **Xóa sạch:** Nhấn "Xóa nhật ký" ở góc trên để xóa toàn bộ (cần xác nhận).
- **Cấu hình:** Lưu các thông số kỹ thuật và đợi thông báo "Thành công".

## 4. Tiết kiệm Token cho AI (RTK - Rust Token Killer)
- Tôi đã cài đặt **rtk** để giúp bạn tiết kiệm token khi chat với AI.
- **Cách dùng:** Thêm `rtk` trước các lệnh chạy.
- **Frontend:** Chạy `npm run dev:rtk` (thay vì `npm run dev`).
- **Backend:** Chạy `rtk .\mvnw.cmd spring-boot:run`.
- **Lưu ý:** Nếu lệnh `rtk` không nhận, hãy **khởi động lại Terminal** hoặc IDE để cập nhật đường dẫn hệ thống.

---
*Lưu ý: Không sửa code linh tinh khi chưa hiểu rõ nguyên nhân. Ưu tiên Reset hệ thống trước khi can thiệp sâu vào mã nguồn.*
