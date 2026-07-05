# 📖 HƯỚNG DẪN SỬ DỤNG HỆ THỐNG QUẢN LÝ PHÒNG KHÁM THÚ Y REXI

> **Phiên bản:** 3.0  
> **Cập nhật:** 03/07/2026  
> **Website:** https://rexi-veterinary.vercel.app

---

# PHẦN 1: TỔNG QUAN HỆ THỐNG

## 1.1 Giới thiệu
**Rexi** là hệ thống quản lý phòng khám thú y toàn diện, giúp quản lý lịch hẹn, bệnh án, thuốc, hóa đơn, nhân sự và tương tác khách hàng qua AI.

## 1.2 Các vai trò trong hệ thống

| Vai trò | Mã quyền | Trang chính |
|---|---|---|
| **Admin** | VT-ADMIN | Toàn quyền hệ thống |
| **Quản lý** | VT-QL | Quản lý nhân sự, DV, Marketing, BC |
| **Bác sĩ** | VT-BS | Khám bệnh, kê đơn, bệnh án |
| **Y tá** | VT-YT | Hỗ trợ khám, kho thuốc |
| **Tiếp tân** | VT-TT | Lịch hẹn, khách hàng, file |
| **Kế toán** | VT-KT | Hóa đơn, kế toán, nhập kho |
| **Khách hàng** | customer | Đặt lịch, thú cưng, bệnh án |

## 1.3 Giao diện chung

### Sidebar (Menu bên trái)
- Sau khi đăng nhập → Sidebar hiển thị bên trái
- **Desktop:** Luôn hiển thị, thu gọn bằng icon khi cần
- **Mobile:** Ẩn mặc định, nhấn ☰ để mở overlay
- Click vào mục menu → chuyển trang tương ứng
- Mục nào không có quyền sẽ **không hiển thị**

### Chế độ Dark/Light
- Nút 🌙/☀️ ở góc trên Sidebar hoặc Header
- Nhấn để chuyển đổi giao diện Sáng/Tối
- Tự động lưu chọn vào localStorage

### Header (Đỉnh trang)
- Hiển thị tên trang hiện tại
- Avatar người dùng + tên
- Nút đăng xuất (🔒)

---

# PHẦN 2: ĐĂNG NHẬP & TÀI KHOẢN

## 2.1 Đăng ký tài khoản mới
1. Truy cập `/dang-nhap` → chuyển tab **"Đăng ký"**
2. Nhập: Họ tên, Email, Mật khẩu, Số điện thoại
3. Nhấn **"Đăng ký"** → Hệ thống tạo tài khoản **Khách hàng**
4. Mật khẩu yêu cầu: ≥ 8 ký tự, có chữ hoa + chữ thường + số

## 2.2 Đăng nhập
1. Truy cập `/dang-nhap` → nhập Email + Mật khẩu → nhấn **"Đăng nhập"**
2. Hệ thống chuyển trang theo vai trò:
   - Khách hàng → `/khach-hang/dashboard`
   - Nhân viên → `/quan-ly/dashboard`

## 2.3 Đăng nhập Google
1. Nhấn **"Đăng nhập bằng Google"** → chọn tài khoản Google
2. Nếu chưa liên kết → trang Liên kết tài khoản → nhập SĐT để ghép
3. Nếu tài khoản Google đã có trong hệ thống → đăng nhập trực tiếp

## 2.4 Quên mật khẩu
1. Nhấn **"Quên mật khẩu?"** ở trang đăng nhập
2. Nhập email đã đăng ký
3. Nhận mã OTP qua email
4. Nhập mã OTP + mật khẩu mới
5. Nhấn **"Đặt lại"** → thành công → đăng nhập lại

## 2.5 Lưu ý bảo mật
- ⚠️ Sau **5 lần nhập sai** → khóa **15 phút**
- ⚠️ Nếu chạy Playwright tests song song → có thể bị khóa do brute-force lockout
- 🔒 Không chia sẻ tài khoản cho người khác
- 🔑 Mật khẩu phải ≥ 8 ký tự, có chữ hoa + chữ thường + số

---

# PHẦN 3: TRANG CÔNG KHAI (PUBLIC)

> **Không cần đăng nhập — Ai cũng truy cập được**

## 3.1 Trang chủ (`/`)
- **Carousel banner:** Quảng cáo dịch vụ nổi bật
- **Video intro:** Meo/chó chào mừng
- **Dịch vụ nổi bật:** Danh sách DV chính
- **ChatBot AI:** Widget góc phải — hỏi đáp miễn phí
- **Footer:** Thông tin liên hệ, giờ mở cửa

## 3.2 Bảng giá dịch vụ (`/bang-gia`)
- **Danh sách dịch vụ:** Tên, Giá, Mô tả, Thời lượng
- **Filter:** Tìm theo tên DV, giá
- **Click vào DV:** Chuyển trang Chi tiết dịch vụ

## 3.3 Chi tiết dịch vụ (`/dich-vu/:slug`)
- **Thông tin DV:** Mô tả chi tiết, Giá niêm yết, Thời lượng
- **Nút "Đặt lịch ngay":** Chuyển trang đặt lịch (cần đăng nhập)

## 3.4 Bác sĩ (`/bac-si`)
- **Danh sách bác sĩ:** Ảnh, Tên, Chuyên môn, Giới thiệu
- **Lịch trực:** Xem khi nào BS làm việc
- **Click vào BS:** Xem chi tiết hồ sơ

## 3.5 Về chúng tôi (`/ve-chung-toi`)
- Giới thiệu phòng khám, đội ngũ, giá trị cốt lõi

## 3.6 Liên hệ (`/lien-he`)
- Form liên hệ / Bản đồ Google Maps
- Thông tin: Địa chỉ, SĐT, Email, Giờ mở cửa

---

# PHẦN 4: HƯỚNG DẪN CHO KHÁCH HÀNG

> **Đăng nhập với vai trò: Khách hàng**

## 4.1 Dashboard tổng quan (`/khach-hang/dashboard`)
- **Tổng quan nhanh:** Số thú cưng, lịch hẹn sắp tới, hóa đơn chờ
- **Lịch hẹn gần nhất:** Danh sách lịch hẹn sắp diễn ra
- **Shortcut nhanh:** Đặt lịch mới, quản lý thú cưng

## 4.2 Quản lý thú cưng (`/khach-hang/quan-ly-thu-cung`)

### Thêm thú cưng mới:
1. Nhấn **"Thêm thú cưng"** (nút 🐾 góc phải)
2. Nhập thông tin:
   - **Tên bé** (bắt buộc)
   - **Loài:** Chó / Mèo / Khác
   - **Giống:** Nhập tay (VD: Alaska, Tabby, Poodle...)
   - **Giới tính:** Đực / Cái
   - **Màu sắc**
   - **Cân nặng** (kg)
   - **Ngày sinh** (tùy chọn)
3. Nhấn **"Lưu"**

### Sửa thông tin:
1. Nhấn biểu tượng ✏️ trên card thú cưng
2. Chỉnh sửa thông tin
3. Nhấn **"Cập nhật"**

### Xóa thú cưng:
1. Nhấn 🗑️ trên card thú cưng
2. Xác nhận **"Có"** trong hộp thoại
3. ⚠️ Không xóa được nếu bé đang có lịch hẹn/bệnh án

### Xem hồ sơ bệnh án:
- Nhấn vào card thú cưng → xem danh sách bệnh án

## 4.3 Đặt lịch hẹn (`/khach-hang/dat-lich-hen`)

### Bước 1: Chọn thú cưng
- Chọn từ danh sách (hoặc thêm mới nếu chưa có)

### Bước 2: Chọn dịch vụ
- Click vào dịch vụ muốn đặt (tiêm phòng, khám tổng quát, spa...)

### Bước 3: Chọn ngày giờ
- Chọn ngày → hệ thống hiển thị **khung giờ trống**
- Chọn giờ khám phù hợp

### Bước 4: Chọn bác sĩ (tùy chọn)
- Nếu không chọn → hệ thống tự phân công bác sĩ trống

### Bước 5: Nhập triệu chứng
- Ghi chú triệu chứng, lý do khám
- VD: "Bé bị ói 3 ngày, bỏ ăn"

### Bước 6: Xác nhận
- Nhấn **"Xác nhận đặt lịch"**
- Nhận thông báo → chờ lễ tân duyệt

## 4.4 Lịch sử lịch hẹn (`/khach-hang/lich-su-lich-hen`)
- **Filter trạng thái:** Tất cả / Chờ duyệt / Đã xác nhận / Đã khám / Đã hủy
- **Xem chi tiết:** Nhấn vào lịch hẹn
- **Hủy lịch:** Nhấn **"Hủy"** (chỉ khi lịch chưa diễn ra)

## 4.5 Hồ sơ bệnh án (`/khach-hang/ho-so-benh-an`)
- Danh sách bệnh án theo thú cưng
- Chi tiết: Chẩn đoán, Đơn thuốc, Kết quả xét nghiệm, Ghi chú BS

## 4.6 Hóa đơn (`/khach-hang/hoa-don-thanh-toan`)
- Danh sách hóa đơn (chờ thanh toán / đã thanh toán)
- Xem chi tiết: Dịch vụ, chi phí, tổng tiền
- Thanh toán tại phòng khám (tiền mặt/QR)

## 4.7 Thông tin cá nhân (`/khach-hang/thong-tin-ca-nhan`)
- Sửa Họ tên, SĐT, Email
- Đổi mật khẩu: Nhập MK cũ → MK mới → Xác nhận

---

# PHẦN 5: HƯỚNG DẪN CHO TIẾP TÂN (LỄ TÂN)

> **Đăng nhập với vai trò: Tiếp tân**
> **Trang có quyền:** Lịch hẹn, Khách hàng & Thú cưng, File đính kèm, Dashboard

## 5.1 Dashboard Tiếp tân (`/quan-ly/dashboard`)
- Dashboard riêng cho lễ tân
- Xem lịch hẹn hôm nay, thống kê nhanh

## 5.2 Quản lý lịch hẹn (`/quan-ly/lich-hen`)

### Duyệt lịch hẹn:
1. Nhấn vào lịch hẹn **"Chờ xác nhận"**
2. Kiểm tra thông tin (thú cưng, dịch vụ, bác sĩ)
3. Nhấn **"Duyệt"** hoặc **"Từ chối"**

### Chuyển trạng thái:
- **Duyệt:** Chờ xác nhận → Đã xác nhận
- **Từ chối:** Chờ xác nhận → Đã hủy
- **Check-in:** Đã xác nhận → Đang khám (giao cho BS)

### Tạo lịch hẹn mới (cho khách vãng lai):
1. Nhấn **"Thêm lịch hẹn"** (nút góc phải)
2. Chọn/thêm khách hàng → chọn thú cưng
3. Chọn dịch vụ → chọn ngày giờ → chọn BS
4. Nhấn **"Xác nhận"**

### Filter & Tìm kiếm:
- **Theo trạng thái:** Tất cả / Chờ xác nhận / Đã xác nhận / Đang khám / Hoàn tất / Không đến / Đã hủy
- **Tìm kiếm:** Tên bé, chủ, bác sĩ, SĐT, lý do

## 5.3 Quản lý khách hàng & thú cưng (`/quan-ly/khach-hang-thu-cung`)

### Thêm chủ nuôi mới:
1. Nhấn **"Thêm chủ nuôi"**
2. Nhập: Họ tên, SĐT, Email, Năm sinh
3. Nhấn **"Lưu"** → Hệ thống tự tạo tài khoản (SĐT = tên đăng nhập)

### Thêm thú cưng mới:
1. Nhấn **"Thêm bé mới"**
2. Chọn chủ nuôi → nhập thông tin thú cưng
3. Nhấn **"Lưu"**

### Khóa/Mở tài khoản khách:
- Nhấn **"Khóa"** → khách không đăng nhập được
- Nhấn **"Mở khóa"** → khôi phục tài khoản

### Phân trang:
- Bảng khách hàng: Cuộn ảo (Virtual Scroll) hiển thị 6 dòng
- Bảng thú cưng: Phân trang server-side, 10 mục/trang

## 5.4 File đính kèm (`/quan-ly/file-dinh-kem`)

### Upload file:
1. Nhấn **"Tải tệp lên"**
2. Kéo thả file hoặc nhấn chọn (ảnh, PDF, Word...)
3. Nhập **Mã hồ sơ bệnh án** cần gắn file
4. Nhấn **"Tải lên hệ thống"**

### Xem/Download file:
- Nhấn icon 👁️ để xem trong tab mới
- Hỗ trợ: Ảnh X-quang, giấy tờ, kết quả xét nghiệm

### Xóa file:
- Nhấn 🗑️ → xác nhận

---

# PHẦN 6: HƯỚNG DẪN CHO BÁC SĨ

> **Đăng nhập với vai trò: Bác sĩ**
> **Trang có quyền:** Khám bệnh, Đơn thuốc, Xét nghiệm, Hồ sơ bệnh án, Lịch hẹn, Lịch làm việc, Dashboard

## 6.1 Dashboard Bác sĩ (`/quan-ly/dashboard`)
- Dashboard riêng cho bác sĩ
- Xem lịch hẹn hôm nay (ca khám của mình)
- Thống kê nhanh: số ca đã khám, bệnh án mới

## 6.2 Khám bệnh (`/quan-ly/kham-benh`)

### Flow khám bệnh từng bước:

**Bước 1: Chọn ca khám hôm nay**
- Nhập từ khóa tìm kiếm (tên bé, chủ, bác sĩ...)
- Chọn bệnh nhân đang chờ trong dropdown
- ⚠️ Chỉ hiển thị lịch hẹn hôm nay, trạng thái "Đã xác nhận" hoặc "Đang khám"

**Bước 2: Xem thông tin ca khám**
- Hiển thị: Thời gian, Trạng thái, Thú cưng, Chủ nuôi, Bác sĩ, Dịch vụ

**Bước 3: Ghi triệu chứng**
- Nhập **Triệu chứng ban đầu** vào textarea
- VD: "Bé bỏ ăn 2 ngày, nôn ra dịch vàng, mệt mỏi"

**Bước 4: Nhập chẩn đoán** (BẮT BUỘC)
- Nhập **Kết luận chẩn đoán**
- VD: "Viêm dạ dày cấp tính, cần theo dõi và kê thuốc"

**Bước 5: Kê đơn thuốc**
- Nhấn **"Thêm thuốc"** để thêm dòng kê
- Chọn thuốc từ kho (hiển thị số lượng tồn)
- Nhập: Số lượng, Liều dùng (VD: "Sáng 1 viên, chiều 1 viên")
- Nhấn 🗑️ để xóa dòng thuốc
- ⚠️ Hệ thống kiểm tra tồn kho tự động — không kê quá số lượng

**Bước 6: Lời dặn bác sĩ**
- Nhập hướng dẫn bổ sung
- VD: "Kiêng ăn mặn, uống nhiều nước, tái khám sau 3 ngày"

**Bước 7: Lưu & Hoàn thành**
- Kiểm tra tổng tiền tạm tính
- Nhấn **"LƯU BỆNH ÁN & HOÀN THÀNH"**
- Hệ thống tự động:
  1. Lưu bệnh án
  2. Tạo đơn thuốc
  3. Tạo hóa đơn (phí khám + thuốc)
  4. Chuyển trạng thái lịch hẹn → Hoàn thành

## 6.3 Đơn thuốc (`/quan-ly/don-thuoc`)
- **Xem danh sách:** Tất cả đơn thuốc đã kê
- **Filter:** Tìm theo mã đơn, tên thú cưng, tên thuốc
- **Xem chi tiết:** Nhấn vào đơn thuốc → xem đầy đủ thông tin
- **Xuất thuốc & Tính tiền:**
  1. Nhấn **"Xuất thuốc & Tính tiền"** trong modal chi tiết
  2. Xác nhận → Thuốc trừ kho, thêm vào hóa đơn
- **In đơn thuốc:** Nhấn **"In đơn"** → in giấy (định dạng A4)

## 6.4 Xét nghiệm (`/quan-ly/xet-nghiem`)
- **Xem danh sách:** Tất cả phiếu xét nghiệm
- **Filter:** Tìm theo mã XN, loại, bác sĩ, hồ sơ
- **Tạo phiếu mới:** Nhấn **"Tạo phiếu mới"** (đang chờ tích hợp máy XN)
- **Xem kết quả:** Nhấn 👁️ → xem kết quả phân tích chi tiết
- **Trạng thái:** Đang xử lý / Hoàn thành

## 6.5 Hồ sơ bệnh án (`/quan-ly/ho-so-benh-an`)
- **Danh sách:** Tất cả bệnh án, filter theo mã HS, thú cưng, BS, chẩn đoán
- **Xem chi tiết:** Nhấn 👁️ → chuyển trang chi tiết `/quan-ly/chi-tiet-benh-an/:id`
- **Phân trang:** Hỗ trợ phân trang server-side với Virtual Scroll

## 6.6 Chi tiết bệnh án (`/quan-ly/chi-tiet-benh-an/:id`)
- **Thông tin bệnh án:** Mã HS, Ngày khám, Thú cưng, Bác sĩ
- **Triệu chứng:** Ghi nhận triệu chứng ban đầu
- **Chẩn đoán:** Kết luận của bác sĩ
- **Đơn thuốc:** Danh sách thuốc đã kê (tên, SL, liều dùng)
- **Xét nghiệm:** Kết quả XN (nếu có)
- **File đính kèm:** Ảnh X-quang, giấy tờ (nếu có)
- **Lời dặn BS:** Hướng dẫn bổ sung

## 6.7 Lịch làm việc cá nhân (`/quan-ly/lich-lam-viec`)

### Xem lịch trực cá nhân:
1. Nhấn **"CÁ NHÂN"** ở nút chuyển chế độ
2. Bảng hiển thị lịch trực của bạn theo tuần
3. Dùng nút **"TUẦN NÀY"** / **"TUẦN TỚI"** để chuyển tuần

### Đăng ký ca trực mới:
1. Nhấn vào ô trống trên bảng lịch (hoặc nhấn ➕)
2. Chọn ngày, giờ bắt đầu
3. Nhấn **"XÁC NHẬN"**

### Hủy ca trực:
1. Nhấn ❌ trên card ca trực
2. Xác nhận hủy

### Lưu ý:
- 🔒 Không được sửa lịch **tuần hiện tại** (sau Thứ 7 12h trưa)
- 🔒 Chỉ đăng ký được lịch **tuần tiếp theo**
- ⚠️ Ca trùng giờ sẽ bị từ chối

---

# PHẦN 7: HƯỚNG DẪN CHO Y TÁ

> **Đăng nhập với vai trò: Y tá**
> **Trang có quyền:** Lịch hẹn, Kho thuốc, Hồ sơ bệnh án, Lịch làm việc, Dashboard

## 7.1 Dashboard (`/quan-ly/dashboard`)
- Dashboard riêng cho y tá
- Xem lịch hẹn hôm nay
- **Cảnh báo kho thuốc:** Thuốc sắp hết, hết hạn

## 7.2 Kho thuốc (`/quan-ly/kho-thuoc`)
- **Xem danh sách thuốc:** Tên, thành phần, dạng bào chế, giá bán
- **Tìm kiếm:** Theo tên thuốc, thành phần, dạng bào chế
- **Xem lô thuốc & hạn dùng:** Panel bên phải hiển thị:
  - Số lô
  - Số lượng tồn (màu đỏ nếu < 10)
  - Hạn sử dụng
- **Thêm thuốc mới** (nếu có quyền Admin/QL/KT):
  1. Nhấn **"Thêm thuốc"**
  2. Nhập: Mã thuốc, Tên thuốc, Mã thuốc (ma_thuoc), Đơn vị, Dạng bào chế, Thành phần, Giá bán, Loại
  3. Nhấn **"Tạo thuốc"**

## 7.3 Các trang khác
- **Lịch hẹn:** Xem danh sách, filter theo trạng thái
- **Hồ sơ bệnh án:** Xem danh sách, filter theo mã HS
- **Lịch làm việc:** Xem + đăng ký ca trực (giống bác sĩ)

---

# PHẦN 8: HƯỚNG DẪN CHO KẾ TOÁN

> **Đăng nhập với vai trò: Kế toán**
> **Trang có quyền:** Kế toán Dashboard, Hóa đơn, Nhập kho, Kho thuốc, Báo cáo, Lịch làm việc

## 8.1 Dashboard Kế toán (`/quan-ly/dashboard`)
- Hiển thị **Bảng điều khiển kế toán** riêng (khác với Admin)
- **KPI (hover để xem chi tiết):**
  - 💰 **Doanh thu hôm nay:** Tổng tiền HĐ đã thanh toán
  - ⚠️ **Công nợ chưa thu:** Tổng HĐ chờ thanh toán + khoản lớn nhất
  - 📋 **Hóa đơn chờ:** Số HĐ + danh sách top
- **Biểu đồ:** Biến động doanh thu 7 ngày (Line chart)
- **Danh sách hóa đơn:** Phân trang 10 mục/trang

### Xác nhận thu tiền:
1. Nhấn **"Xác nhận thu"** trên hóa đơn chờ
2. Xác nhận → Trạng thái chuyển thành "Đã thanh toán"

### Xuất Excel:
- Nhấn **"Xuất Excel"** → tải file CSV danh sách hóa đơn

## 8.2 Quản lý Hóa đơn (`/quan-ly/hoa-don`)
- **Danh sách:** Tất cả hóa đơn, filter theo mã HĐ, khách hàng, SĐT
- **Cuộn ảo:** Hiển thị 6 dòng, scroll mượt mà
- **Xem chi tiết:** Nhấn 👁️ → modal hiển thị:
  - Thông tin phòng khám (tên, địa chỉ, SĐT)
  - Thông tin khách hàng
  - Diễn giải (tổng DV, giảm giá, tổng cộng)
- **Xác nhận thanh toán:** Nhấn **"Xác nhận đã nhận tiền"** (chỉ cho HĐ chờ)
- **Tải PDF:** Nhấn **"Tải PDF"** → tạo file PDF hóa đơn (html2canvas + jsPDF)
- **In hóa đơn:** Nhấn **"In hóa đơn"** → in giấy A4
- **Xuất Excel:** Nhấn **"Xuất Excel"** → tải danh sách

## 8.3 Nhập kho (`/quan-ly/nhap-kho`)
- **Danh sách lô thuốc:** Mã lô, số lô, ngày nhập, hạn dùng, số lượng, giá nhập
- **Tìm kiếm:** Theo số lô, tên thuốc
- **Tạo phiếu nhập mới:**
  1. Nhấn **"Tạo phiếu nhập mới"**
  2. Chọn thuốc từ danh mục dropdown
  3. Nhập: Số lô, Hạn sử dụng, Số lượng nhập, Giá nhập
  4. ⚠️ Hạn dùng không được đặt trong quá khứ
  5. Nhấn **"Xác nhận nhập kho"** → Tự động cập nhật tồn kho

## 8.4 Kho thuốc (`/quan-ly/kho-thuoc`)
- **Danh mục thuốc:** Tên, thành phần, dạng bào chế, giá bán
- **Cuộn ảo:** Hiển thị 8 dòng, scroll mượt
- **Lô thuốc & Hạn dùng:** Panel bên phải
- **Thêm thuốc mới:** Nhấn **"Thêm thuốc"** → nhập chi tiết

## 8.5 Báo cáo thống kê (`/quan-ly/bao-cao-thong-ke`)
- **4 thẻ KPI (click để xem chi tiết):**
  - 💰 **Tổng doanh thu:** So sánh ngày gần nhất vs ngày trước
  - 🏥 **Tổng ca điều trị:** So sánh theo ngày
  - ⭐ **Bác sĩ tích cực:** BS có nhiều ca nhất + hồ sơ liên quan
  - 💎 **Dịch vụ hàng đầu:** DV mang lại doanh thu cao nhất
- **Biểu đồ (5 loại):**
  - Xu hướng doanh thu 12 tháng (Bar chart)
  - Doanh thu 7 ngày (Bar chart)
  - Tỷ lệ thú cưng (Doughnut chart + drill-down)
  - Hiệu suất bác sĩ (Progress bar)
  - Phân bổ doanh thu DV (Horizontal Bar chart)
- **Drill-down:** Nhấn vào KPI → xem chi tiết Modal
- **Click loài thú cưng:** Nhấn pill → xem danh sách bé cụ thể
- **In báo cáo:** Nhấn **"In Báo Cáo"** → in A4
- **Xuất Excel:** Nhấn **"Xuất Excel"** → tải file CSV tổng hợp

---

# PHẦN 9: HƯỚNG DẪN CHO QUẢN LÝ

> **Đăng nhập với vai trò: Quản lý**
> **Trang có quyền:** Tất cả trừ Cấu hình & Chức năng (chỉ Admin)

## 9.1 Dashboard (`/quan-ly/dashboard`)
- **Tổng quan hệ thống:**
  - 👥 Khách hàng: Tổng số + tăng trưởng (6 tháng bar chart)
  - 📅 Lịch hẹn hôm nay: Danh sách chi tiết
  - 💰 Doanh thu: Hôm nay vs hôm qua
  - 💊 Kho thuốc: Cảnh báo tồn kho thấp
- **Cảnh báo kho:** Component `CanhBaoThuoc` hiển thị thuốc sắp hết/hết hạn

## 9.2 Nhân sự & Phân quyền (`/quan-ly/nhan-vien-phan-quyen`)

### Thêm nhân viên mới:
1. Nhấn **"Thêm nhân sự"**
2. Nhập thông tin:
   - Họ tên, SĐT, Email (bắt buộc)
   - Chuyên môn: Bác sĩ / Y tá / Tiếp tân / Kế toán / Quản lý / CSKH
   - Trạng thái: Đang làm việc / Tạm nghỉ
   - Ngày vào làm (tính kinh nghiệm)
3. ✅ Tích **"Tạo tài khoản đăng nhập"** (nếu muốn)
4. Nhập: Tên đăng nhập, Mật khẩu ban đầu
5. Upload ảnh nhân sự (tùy chọn)
6. Nhấn **"LƯU THÔNG TIN"**

### Sửa thông tin nhân viên:
1. Nhấn **"Sửa"** trên dòng nhân viên
2. Chỉnh sửa thông tin
3. Nhấn **"LƯU THÔNG TIN"**

### Xóa / Phục hồi nhân viên:
- **Xóa:** Nhấn **"Xóa"** → xác nhận → Nhân viên bị xóa mềm, tài khoản bị khóa
- **Phục hồi:** Nhấn **"Mở lại"** → xác nhận → Khôi phục nhân viên + tài khoản

### Filter:
- Theo tên, SĐT, email
- Theo chức vụ: Tất cả / Bác sĩ / Y tá / Tiếp tân / Kế toán / Quản lý / CSKH

### Quản lý tài khoản (chỉ Admin):
- **Danh sách tài khoản:** Tên đăng nhập, Vai trò, Mật khẩu hiển thị
- **Sửa tài khoản:** Nhấn **"Sửa"** → đổi tên đăng nhập, vai trò, trạng thái, mật khẩu
- **Liên kết nhân viên:** Gán tài khoản với nhân viên cụ thể
- **Reset mật khẩu:** Nhấn **"Reset MK"** → nhận mật khẩu mới

## 9.3 Quản lý dịch vụ (`/quan-ly/dich-vu`)

### Thêm dịch vụ mới:
1. Nhấn **"Thêm dịch vụ"**
2. Nhập:
   - **Tên DV** (bắt buộc)
   - **Giá niêm yết** (VNĐ)
   - **Thời lượng** (phút)
   - **Mô tả chi tiết** (textarea)
3. Nhấn **"Lưu dịch vụ"**

### Sửa dịch vụ:
1. Nhấn ✏️ trên dòng DV → form hiện ra
2. Chỉnh sửa → **"Lưu dịch vụ"**

### Xóa dịch vụ:
- Nhấn 🗑️ → xác nhận
- ⚠️ Không xóa được nếu DV đang có trong lịch hẹn/hóa đơn

## 9.4 Marketing (`/quan-ly/marketing`)
- **Xem số subscriber:** Hiển thị số khách đăng ký nhận tin (tự cập nhật)
- **Soạn chiến dịch email:**
  1. Nhập **Tiêu đề email** (VD: "🎁 Ưu đãi 50% Spa cuối tuần...")
  2. Nhập **Nội dung thông điệp** (textarea lớn)
  3. Nhấn **"GỬI CHIẾN DỊCH NGAY 🚀"**
- Hệ thống gửi mail đến tất cả khách đăng ký newsletter

## 9.5 Lịch làm việc (`/quan-ly/lich-lam-viec`)

### Chế độ xem:
- **"TẤT CẢ":** Xem lịch trực toàn bộ nhân sự (Admin/QL)
- **"CÁ NHÂN":** Xem lịch của riêng mình

### Bảng lịch:
- **Grid 7 ngày × 13 khung giờ** (8:00 – 20:00)
- Mỗi ô = 1 khung giờ, hiển thị danh sách ca trực
- **Màu sắc theo chức vụ:**
  - Bác sĩ: Teal/Xanh lá
  - Y tá: Xanh dương
  - Tiếp tân: Vàng
  - Khác: Xám

### Thêm ca trực:
1. Nhấn vào ô trống trên bảng
2. Chọn nhân viên (dropdown phân theo chức vụ)
3. Xác nhận ngày, giờ
4. Nhấn **"XÁC NHẬN"**
5. ⚠️ Ca trùng giờ sẽ bị từ chối

### Di chuyển ca trực (Drag & Drop):
1. Kéo card ca trực sang ô khác
2. Thả vào ô mục tiêu
3. Hệ thống tự cập nhật

### Xóa ca trực:
1. Nhấn ❌ trên card ca trực
2. Xác nhận hủy

### Sao chép lịch:
- **Sao chép 1 nhân viên:** Nhấn icon 📋 trên chip giờ làm
- **Sao chép tất cả:** Nhấn **"Sao chép tất cả"** → copy toàn bộ tuần này sang tuần tới
- ⚠️ Bỏ qua ca bị trùng ở tuần tới

### Xuất Excel:
- Nhấn **"Xuất Excel"** → tải file CSV lịch trực

### In lịch trực:
- Nhấn **"In lịch trực"** → in A4 Landscape

### Thống kê giờ làm:
- Hiển thị trên cùng: Mỗi nhân viên + tổng giờ/tuần
- 🔴 Cảnh báo nếu > 48 giờ/tuần

### Lưu ý quan trọng:
- 🔒 **Tuần hiện tại:** Chỉ Admin/QL mới sửa được (sau T7 12h trưa)
- 🔒 **Tuần tới:** Nhân viên không đăng ký được từ T7 12h → hết CN
- ⚠️ Cell quá khứ: Hiển thị sọc chéo, không chỉnh sửa được

## 9.6 Các trang khác
- Lịch hẹn: Quản lý (xem Phần 5.2)
- Khách hàng & Thú cưng: Quản lý (xem Phần 5.3)
- Hồ sơ bệnh án: Xem danh sách + chi tiết
- Kho thuốc, Nhập kho: Xem (xem Phần 8.4, 8.5)

---

# PHẦN 10: HƯỚNG DẪN CHO ADMIN

> **Đăng nhập với vai trò: Admin**
> **Quyền:** Toàn quyền hệ thống — bao gồm tất cả quyền của Quản lý + thêm Cấu hình & Chức năng

## 10.1 Dashboard (`/quan-ly/dashboard`)
- Giống Dashboard Quản lý + toàn quyền truy cập mọi dữ liệu

## 10.2 Cấu hình hệ thống (`/quan-ly/cau-hinh`) — CHỈ ADMIN

### Tab 1: Cấu hình chung
- **Tên hệ thống:** Đặt tên phòng khám
- **Số ngày lưu trữ Backup:** Số ngày giữ file backup
- **Danh sách IP bị chặn:** Nhập IP ngăn cách bằng dấu phẩy

### Tab 2: Thanh toán
- **VietQR:**
  1. Nhập **Bank ID** — Có dropdown tìm kiếm ngân hàng (gọi API VietQR)
  2. Nhập **Số tài khoản** — Tự tra cứu tên chủ TK (VietQR Lookup)
  3. Nhập **Tên chủ tài khoản** (tự điền hoặc nhập tay, IN HOA)
  4. Nhập **Client ID** & **API Key** (lấy từ my.vietqr.io)
- **VNPay:**
  - vnp_TmnCode (Mã Website)
  - vnp_HashSecret (Chuỗi Bí Mật) — ẩn/hiện bằng nút 👁️
  - vnp_Url (URL Cổng Thanh Toán)
  - vnp_ReturnUrl (URL Trả Về)

### Tab 3: AI & Phân quyền
- **AI Provider (3 nhà cung cấp):**
  - **Groq:** API Key chính + 2 dự phòng, Model (VD: llama-3.3-70b-specdec)
  - **Gemini:** API Key, Model (VD: gemini-1.5-flash)
  - **OpenRouter:** API Key, Model (VD: google/gemini-2.0-flash-exp:free)
  - Nhấn **"Kiểm tra [Provider]"** để test kết nối
- **Ma trận Phân quyền AI (Bảng checkbox):**
  - Hàng: 9 vai trò (Admin → Guest)
  - Cột: 5 hành động (CLICK, FILL, SELECT, TOGGLE, DELETE)
  - Admin: Đầy đủ 5 hành động
  - Quản lý/BS/KT/TT/YT: 4 hành động (không DELETE)
  - Nhân viên/KH: 3 hành động
  - Guest: 1 hành động (chỉ CLICK)

### Tab 4: Email SMTP
- **SMTP:** Host (VD: smtp.gmail.com), Port (587), Username, Password
- **Test email:** Nhập email nhận test → **"Gửi Test"** → kiểm tra hộp thư

### Tab 5: Bảo mật
- **IP đang bị chặn:** Danh sách IP bị chặn tự động bởi tường lửa
- **Cảnh báo gần nhất:** Phân tích tấn công:
  - Loại tấn công (SQL Injection, XSS, Brute Force...)
  - Mức độ (HIGH, MEDIUM, LOW)
  - Phương thức & đường dẫn
  - Tóm tắt rủi ro
  - Hành động đề xuất
- **Gỡ chặn IP:** Nhấn **"Gỡ chặn"** trên IP cần gỡ

### Tab 6: Backup & Nhật ký
- **Sao lưu thủ công:**
  1. Nhấn **"Sao lưu ngay"** → xác nhận
  2. File backup được lưu trên server
  3. Tên file: `rexi_backup_YYYYMMDD_HHMMSS.sql`
- **Danh sách backup:**
  - Xem: Tên file, Kích thước (MB), Ngày tạo
  - **Tải về:** Nhấn icon ⬇️ → tải file SQL
  - **Khôi phục:** Nhấn icon 🔄 → XÁC NHẬN 2 LẦN → restore database
  - **Xóa:** Nhấn icon 🗑️ → xác nhận
  - **Xóa tất cả:** Nhấn **"Xóa tất cả"** → xác nhận
- **Nhật ký hoạt động:**
  - Hiển thị: Thời gian, Người thao tác, Hành động, Bảng dữ liệu
  - **Xóa nhật ký:** Nhấn **"Xóa nhật ký"** → xác nhận

### Lưu cấu hình:
- Nhấn **"Lưu tất cả thay đổi"** (góc trên phải) → lưu toàn bộ tab

## 10.3 Phân hệ chức năng (`/quan-ly/chuc-nang`)
- **Danh sách phân hệ:** Mã, Tên, Mô tả, Route, Quyền, Trạng thái
- **KPI:** Tổng phân hệ, Đang hoạt động, Nguồn dữ liệu
- Đây là trang **chỉ xem** — hiển thị tất cả phân hệ quyền hiện có
- Dữ liệu đồng bộ từ route & quyền thật trong hệ thống

## 10.4 Các trang khác
- Quản lý **tất cả** như Quản lý + thêm quyền:
  - ✅ Xóa/Khóa/Mở khóa nhân viên
  - ✅ Reset mật khẩu tài khoản
  - ✅ Quản lý tài khoản (gán vai trò: VT-ADMIN, VT-QL, VT-BS, VT-YT, VT-TT, VT-KT, VT-3)
  - ✅ Cấu hình hệ thống
  - ✅ Quản lý phân hệ chức năng

---

# PHẦN 11: CHATBOT AI REXI

> 💬 Chatbot xuất hiện ở **góc phải** mọi trang (icon 💬)

## 11.1 Cách mở & sử dụng
1. Nhấn 💬 icon góc phải màn hình → mở khung chat
2. Gõ tin nhắn vào ô nhập
3. Nhấn **Enter** hoặc nút **Gửi** → Rexi trả lời
4. Nhấn ❌ để đóng chatbot

## 11.2 Voice Input (Nhập bằng giọng nói)
1. Nhấn icon 🎤 bên phải ô nhập
2. Nói rõ ràng vào microphone
3. Hệ thống tự chuyển giọng nói thành chữ
4. Kiểm tra lại nội dung → nhấn Gửi

## 11.3 Khách hàng có thể hỏi:
- 🐾 "Bé Mun nhà em bị ói phải làm sao?" → Tư vấn triệu chứng
- 📅 "Xem lịch hẹn của em" → Tra cứu lịch
- 💊 "Giá tiêm phòng bao nhiêu?" → Bảng giá
- 📞 "Số điện thoại phòng khám" → Thông tin liên hệ
- 🐕 "Bé chó bị tiêu chảy nên cho ăn gì?" → Tư vấn dinh dưỡng

## 11.4 Nhân viên có thể hỏi:
- 🔍 "Tìm khách hàng Trần Văn A" → Tra cứu DB
- 📊 "Doanh thu hôm nay bao nhiêu?" → Thống kê
- 💊 "Thuốc Amoxicillin còn bao nhiêu?" → Kiểm tra kho
- 📄 "Tài liệu VNUA về viêm ruột" → Tra cứu tài liệu
- 📅 "Lịch trực tuần này của BS Lan" → Tra cứu lịch

## 11.5 Admin có thể hỏi:
- 🔧 "Nút chatbot ở file nào?" → Tra cứu code (tool `tra_cuu_ma_nguon`)
- 🐛 "Lỗi lockout ở đâu?" → Debug hướng dẫn
- 📁 "Route quan-ly-lich-hen nằm ở đâu?" → Source index
- 📊 "Tổng quan hệ thống Rexi" → Thống kê toàn diện

## 11.6 Rexi hiểu ngôn ngữ:
- ✅ Tiếng Việt tự nhiên (không dấu, teencode, Gen Z)
- ✅ Viết tắt ("bs" = bác sĩ, "tk" = tài khoản)
- ✅ Chèn từ đệm ("ê", "khoan", "à")
- ✅ Tiếng Việt lai Anh ("check in", "booking", "review")
- ✅ Hiểu ngữ cảnh: "cái này" = element đang hiện, "tăng lên 2" = đổi giá trị

---

# PHẦN 12: TRANG LỊCH LÀM VIỆC (CHI TIẾT)

> Trang này dùng cho **Tất cả nhân viên** (Bác sĩ, Y tá, Tiếp tân, Kế toán, Quản lý, Admin)

## 12.1 Xem lịch trực cá nhân
1. Vào **Lịch làm việc** (`/quan-ly/lich-lam-viec`)
2. Nhấn **"CÁ NHÂN"** (nếu là Admin/QL)
3. Bảng hiển thị lịch trực của bạn theo tuần

## 12.2 Đăng ký ca trực mới
1. Nhấn vào **ô trống** trên bảng lịch (hoặc nhấn ➕ góc ô)
2. Modal hiện ra → chọn nhân viên (nếu Admin/QL)
3. Kiểm tra: Ngày, Giờ bắt đầu
4. Nhấn **"XÁC NHẬN"**
5. ⚠️ Ca trùng giờ sẽ bị từ chối

## 12.3 Hủy ca trực
1. Nhấn **❌** góc trên card ca trực
2. Xác nhận hủy trong dialog

## 12.4 Di chuyển ca trực (Drag & Drop) — Admin/QL
1. **Kéo** card ca trực từ ô cũ
2. **Thả** vào ô mục tiêu (ngày + giờ mới)
3. Hệ thống tự xóa ca cũ + tạo ca mới

## 12.5 Sao chép lịch sang tuần tới
- **1 nhân viên:** Nhấn icon 📋 trên chip giờ làm
- **Tất cả:** Nhấn **"Sao chép tất cả"**
- ⚠️ Bỏ qua ca bị trùng ở tuần tới

## 12.6 Xuất/In lịch trực
- **Xuất Excel:** Nhấn **"Xuất Excel"** → file CSV
- **In:** Nhấn **"In lịch trực"** → in A4 Landscape

## 12.7 Thống kê giờ làm (Admin/QL)
- Hiển thị trên cùng: Mỗi nhân viên + tổng giờ/tuần
- 🔴 **Cảnh báo:** > 48 giờ/tuần = quá tải

## 12.8 Quy tắc hạn chế
| Thời điểm | Ai được sửa? |
|---|---|
| Thứ 2 – Thứ 6 | Tất cả nhân viên |
| Thứ 7 trước 12h | Tất cả nhân viên |
| Thứ 7 sau 12h → Chủ nhật | Chỉ Admin/QL |
| Tuần hiện tại | Chỉ Admin/QL (sau T7 12h) |
| Tuần quá khứ | Chỉ Admin/QL |

---

# PHẦN 13: CÂU HỎI THƯỜNG GẶP

### ❓ Đăng nhập bị khóa?
→ Đợi 15 phút hoặc dùng "Quên mật khẩu"

### ❓ Lịch hẹn bị từ chối?
→ Liên hệ phòng khám để biết lý do → Đặt lại

### ❓ Không thấy trang quản trị?
→ Kiểm tra đã đăng nhập đúng tài khoản nhân viên chưa

### ❓ Chatbot trả lời sai?
→ Nhập rõ ràng hơn (tên DV, tên BS, ngày cụ thể)

### ❓ Cần sao lưu dữ liệu?
→ Admin → Cấu hình → Backup → **"Sao lưu ngay"**

### ❓ Hệ thống hoạt động trên điện thoại?
→ ✅ Responsive — dùng tốt trên cả máy tính và điện thoại

### ❓ Quên mật khẩu tài khoản nhân viên?
→ Liên hệ Admin → **"Reset MK"** trong Quản lý tài khoản

### ❓ Lịch trực bị trùng giờ?
→ Hệ thống tự động từ chối — chọn giờ khác

### ❓ Không kê được thuốc (vượt tồn kho)?
→ Giảm số lượng kê đơn hoặc liên hệ Admin nhập thêm thuốc

### ❓ In hóa đơn/đơn thuốc bị lỗi?
→ Kiểm tra cài đặt printer → Nhấn **"In"** lại

### ❓ File upload không hiển thị?
→ Kiểm tra định dạng file (hỗ trợ: JPG, PNG, PDF, DOC, DOCX)
→ Kích thước tối đa: 20MB

### ❓ Dark mode không lưu?
→ Kiểm tra localStorage trong trình duyệt (F12 → Application → Local Storage)

### ❓ Chatbot không nghe voice?
→ Kiểm tra quyền microphone trong trình duyệt
→ Dùng Chrome/Edge (tương thích tốt nhất)

---

> 📌 **Mẹo:** Sử dụng chatbot Rexi để tra cứu thông tin nhanh thay vì tìm thủ công!
> 📌 **Mẹo:** Nhấn **F12** trong Chrome để mở Console kiểm tra lỗi khi gặp sự cố.
