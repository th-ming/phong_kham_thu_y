# BÁO CÁO KIỂM TRA GỢI Ý CHATBOT (Suggestions Audit)

> **Ngày tạo:** 11/06/2026
> **File nguồn:** `Frontend/src/components/chatbot/GoiYNhanhChatbot.tsx`
> **Mục đích:** Review toàn bộ gợi ý nhanh (suggestion chips) theo từng role, đánh dấu các vấn đề cần sửa

---

## 1. GỢI Ý SHARED (Dùng chung cho nhiều role)

```typescript
const sharedClinicalSuggestions: QuickSuggestion[] = [
  { label: "Cấp cứu hóc dị vật",    prompt: "Bé bị hóc dị vật, sơ cứu thế nào?",          tone: "danger" },
  { label: "Lịch tiêm phòng",       prompt: "Lịch tiêm phòng vaccine định kỳ cho chó mèo?", tone: "info" },
  { label: "Dấu hiệu cần đi khám",  prompt: "Những dấu hiệu nào ở chó mèo cần đưa đi khám ngay?", tone: "warning" },
  { label: "Chăm sóc sau khám",     prompt: "Sau khi bé vừa khám xong cần chăm sót thế nào?", tone: "success" },
  { label: "Dinh dưỡng thú cưng",   prompt: "Tư vấn khẩu phần ăn phù hợp cho chó mèo theo tuổi và cân nặng", tone: "default" },
  { label: "Sơ cứu ngộ độc",        prompt: "Cách sơ cứu mèo bị ngộ độc thực phẩm?",         tone: "danger" },
];
```

---

## 2. STANDARD SUGGESTIONS (Tab Rexi 🐾)

### 👤 guest (Khách vãng lai) — 7 gợi ý
| # | Label | Prompt | Tone | ⚠️ Vấn đề |
|---|-------|--------|------|-----------|
| 1 | Thông tin bác sĩ | Cho tôi biết thông tin bác sĩ của phòng khám | info | |
| 2 | Cấp cứu hóc dị vật | Bé bị hóc dị vật, sơ cứu thế nào? | danger | **Shared #0** |
| 3 | Lịch tiêm phòng | Lịch tiêm phòng vaccine định kỳ cho chó mèo? | info | **Shared #1** |
| 4 | Dấu hiệu cần đi khám | Những dấu hiệu nào ở chó mèo cần đưa đi khám ngay? | warning | **Shared #2** |
| 5 | Chăm sóc sau khám | Sau khi bé vừa khám xong cần chăm sóc và theo dõi thế nào? | success | **Shared #3** |
| 6 | Dinh dưỡng thú cưng | Tư vấn khẩu phần ăn phù hợp cho chó mèo theo tuổi và cân nặng | default | **Shared #4** |
| 7 | Sơ cứu ngộ độc | Cách sơ cứu mèo bị ngộ độc thực phẩm? | danger | **Shared #5** |

> **Ghi chú:** Guest chỉ có 1 gợi ý riêng + 6 shared. Các gợi ý cấp cứu cho khách vãng lai chưa đăng nhập có phù hợp không?

---

### 🧑 customer (Khách hàng) — 10 gợi ý
| # | Label | Prompt | Tone | ⚠️ Vấn đề |
|---|-------|--------|------|-----------|
| 1 | **Cần đi khám không?** | Những dấu hiệu nào ở thú cưng cần đưa đi khám ngay? | warning | ❌ **TRÙNG Ý với Shared #2** (cùng hỏi về dấu hiệu đi khám) |
| 2 | Chăm sóc mèo mang thai | Cách chăm sóc mèo mang thai an toàn tại nhà? | success | |
| 3 | **Sau khi khám** | Sau khi thú cưng vừa khám xong cần theo dõi gì? | info | ❌ **TRÙNG Ý với Shared #3** (cùng hỏi chăm sóc sau khám) |
| 4 | **Ăn uống theo tuổi** | Tư vấn khẩu phần ăn phù hợp cho chó mèo theo tuổi và cân nặng | default | ❌ **TRÙNG Ý với Shared #4** (cùng dinh dưỡng) |
| 5 | Cấp cứu hóc dị vật | ... | danger | Shared #0 |
| 6 | Lịch tiêm phòng | ... | info | Shared #1 |
| 7 | Dấu hiệu cần đi khám | ... | warning | Shared #2 |
| 8 | Chăm sóc sau khám | ... | success | Shared #3 |
| 9 | Dinh dưỡng thú cưng | ... | default | Shared #4 |
| 10 | Sơ cứu ngộ độc | ... | danger | Shared #5 |

> **Ghi chú:** Customer có 4 gợi ý riêng NHƯNG items #1, #3, #4 gần như TRÙNG hoàn toàn với shared items #2, #3, #4. => User thấy 2 chip gần giống nhau liền kề.

---

### 🔧 admin (Quản trị) — 9 gợi ý
| # | Label | Prompt | Tone | ⚠️ Vấn đề |
|---|-------|--------|------|-----------|
| 1 | Khi nào dùng Agent? | Phân biệt khi nào nên dùng Trợ lý Rexi và khi nào nên dùng Rexi Agent? | info | |
| 2 | Quy trình phân quyền | Giải thích nguyên tắc phân quyền nội bộ cho admin khi dùng hệ thống | default | |
| 3 | Kiểm tra lỗi hệ thống | Nếu hệ thống phản hồi chậm hoặc lỗi API thì admin nên kiểm tra theo thứ tự nào? | warning | |
| 4 | Bảo mật dữ liệu | Những dữ liệu nào không nên hiển thị trong chat thường? | danger | |
| 5 | Vận hành phòng khám | Gợi ý checklist vận hành phòng khám đầu ngày cho quản trị viên | success | |
| 6 | Giao việc đúng vai trò | Admin nên phân công tác vụ nào cho quản lý, kế toán, tiếp tân, bác sĩ và y tá? | default | |
| 7 | Cấp cứu hóc dị vật | ... | danger | Shared #0 |
| 8 | Lịch tiêm phòng | ... | info | Shared #1 |
| 9 | Dấu hiệu cần đi khám | ... | warning | Shared #2 |

> **Ghi chú:** 6 riêng + 3 shared đầu. Hợp lý.

---

### 📋 manager (Quản lý) — 8 gợi ý
| # | Label | Prompt | Tone | ⚠️ Vấn đề |
|---|-------|--------|------|-----------|
| 1 | Điều phối ca khám | Quản lý nên điều phối lịch hẹn và nhân sự phòng khám theo nguyên tắc nào? | info | |
| 2 | Ưu tiên vận hành | Khi phòng khám đông khách, nên ưu tiên xử lý những nhóm việc nào trước? | warning | |
| 3 | Chất lượng dịch vụ | Gợi ý cách đánh giá chất lượng dịch vụ phòng khám thú y trong ngày | success | |
| 4 | Phối hợp vai trò | Quản lý nên phối hợp với bác sĩ, y tá, kế toán và tiếp tân thế nào để tránh nghẽn việc? | default | |
| 5 | Báo cáo cần có | Một báo cáo vận hành phòng khám nên gồm những chỉ số nào? | info | |
| 6-8 | *(3 shared đầu)* | ... | | |

---

### 🩺 doctor (Bác sĩ) — 9 gợi ý
| # | Label | Prompt | Tone | ⚠️ Vấn đề |
|---|-------|--------|------|-----------|
| 1 | Ưu tiên ca khám | Bác sĩ nên ưu tiên ca khám thú y theo dấu hiệu nguy hiểm nào? | info | |
| 2 | Ghi bệnh án tốt | Một bệnh án thú y nên ghi những trường thông tin nào để dễ theo dõi? | default | |
| 3 | Nguyên tắc dùng thuốc | Những nguyên tắc an toàn khi cân nhắc thuốc cấp cứu cho chó mèo? | danger | |
| 4 | Sơ cứu Heimlich | Hướng dẫn kỹ thuật Heimlich cho chó mèo? | danger | |
| 5 | Đọc xét nghiệm | Gợi ý cách đọc kết quả xét nghiệm máu chó mèo | info | |
| 6 | Dặn dò chủ nuôi | Sau khám, bác sĩ nên dặn dò chủ nuôi theo cấu trúc nào? | warning | |
| 7 | Dấu hiệu cần đi khám | ... | warning | Shared #2 |
| 8 | Chăm sóc sau khám | ... | success | Shared #3 |
| 9 | Dinh dưỡng thú cưng | ... | default | Shared #4 |

> **Ghi chú:** Dùng `sharedClinicalSuggestions.slice(2, 5)` — lấy items #2, #3, #4 → phù hợp với bác sĩ.

---

### 💰 accountant (Kế toán) — 7 gợi ý
| # | Label | Prompt | Tone | ⚠️ Vấn đề |
|---|-------|--------|------|-----------|
| 1 | Đối soát an toàn | Quy trình đối soát hóa đơn và thanh toán nên kiểm tra những điểm nào? | warning | |
| 2 | Báo cáo tài chính | Một báo cáo doanh thu ngày của phòng khám nên có những mục nào? | success | |
| 3 | Sai lệch thanh toán | Khi hóa đơn và giao dịch thanh toán lệch nhau thì nên xử lý theo bước nào? | agent | |
| 4 | Xuất Excel | Hướng dẫn xuất file Excel hóa đơn và doanh thu | info | |
| 5 | Bảo mật hóa đơn | Kế toán cần lưu ý gì khi trao đổi thông tin hóa đơn trong chat? | danger | |
| 6 | Chăm sóc sau khám | ... | success | Shared #3 |
| 7 | Dinh dưỡng thú cưng | ... | default | Shared #4 |

> **Ghi chú:** Dùng `sharedClinicalSuggestions.slice(3, 5)` — lấy items #3, #4. 2 shared này hơi lệch với nghiệp vụ kế toán.

---

### 🏪 reception (Tiếp tân) — 8 gợi ý
| # | Label | Prompt | Tone | ⚠️ Vấn đề |
|---|-------|--------|------|-----------|
| 1 | Xác nhận lịch | Tiếp tân nên xác nhận lịch hẹn với khách theo kịch bản nào? | warning | |
| 2 | Check-in | Quy trình check-in khách đã tới phòng khám gồm những bước nào? | success | |
| 3 | Tạo lịch mới | Khi tạo lịch hẹn mới, tiếp tân cần hỏi khách những thông tin nào? | info | |
| 4 | Tra khách an toàn | Khi khách gọi điện, tiếp tân nên xác minh thông tin thế nào trước khi tra hồ sơ? | agent | |
| 5 | Khách không đến | Nên xử lý lịch hẹn khách không đến như thế nào cho đúng quy trình? | danger | |
| 6-8 | *(3 shared đầu)* | ... | | |

---

### 🧪 nurse (Y tá) — 10 gợi ý
| # | Label | Prompt | Tone | ⚠️ Vấn đề |
|---|-------|--------|------|-----------|
| 1 | Ca cần hỗ trợ | Y tá nên chuẩn bị hỗ trợ ca khám theo checklist nào? | info | |
| 2 | Chuẩn bị xét nghiệm | Danh sách việc cần chuẩn bị trước khi lấy mẫu xét nghiệm | warning | |
| 3 | Theo dõi nội trú | Các chỉ số cần theo dõi cho thú cưng nội trú | success | |
| 4 | Vật tư ca trực | Y tá nên kiểm tra vật tư gì trước khi bắt đầu ca trực? | agent | |
| 5-10 | *(6 shared — tất cả)* | ... | | ⚠️ **RẤT DÀI** — 10 gợi ý, có thể bị tràn |

---

### 👥 staff (Nhân viên) — 9 gợi ý
| # | Label | Prompt | Tone | ⚠️ Vấn đề |
|---|-------|--------|------|-----------|
| 1 | Dùng hệ thống | Nhân viên mới nên dùng các phân hệ phòng khám theo thứ tự nào? | info | |
| 2 | Tra cứu an toàn | Khi nào nhân viên nên chuyển sang Rexi Agent để tra dữ liệu thật? | success | |
| 3 | Quy trình kho | Khi kiểm kho thuốc, nhân viên cần lưu ý những điểm nào? | warning | |
| 4-9 | *(6 shared — tất cả)* | ... | | ⚠️ **RẤT DÀI** — 9 gợi ý |

---

## 3. AGENT SUGGESTIONS (Tab Rexi Agent 🤖)

### guest — 4 gợi ý
| # | Label | Prompt | Tone |
|---|-------|--------|------|
| 1 | Đăng nhập | Tôi cần đăng nhập để sử dụng các chức năng cá nhân | info |
| 2 | Đặt lịch | Hướng dẫn đặt lịch khám thú cưng | success |
| 3 | Dịch vụ Rexi | Rexi có những dịch vụ thú y nào? | default |
| 4 | Thông tin bác sĩ | Cho tôi biết thông tin bác sĩ của phòng khám | doctor |

### customer — 6 gợi ý
| # | Label | Prompt | Tone |
|---|-------|--------|------|
| 1 | Mở đặt lịch | Mở trang đặt lịch khám cho thú cưng của tôi | agent |
| 2 | Mở lịch đã đặt | Mở trang lịch sử lịch hẹn của tôi | info |
| 3 | Mở hóa đơn | Mở trang hóa đơn và thanh toán của tôi | warning |
| 4 | Mở hồ sơ y tế | Mở hồ sơ y tế thú cưng của tôi | info |
| 5 | Tìm tài liệu mèo mang thai | Lên mạng tìm tài liệu chăm sóc mèo mang thai y khoa | success |
| 6 | Mở thông tin bác sĩ | Mở trang đội ngũ bác sĩ của phòng khám | doctor |

### admin — 8 gợi ý
| # | Label | Prompt | Tone |
|---|-------|--------|------|
| 1 | Mở báo cáo thống kê | Mở trang báo cáo thống kê và tóm tắt KPI quan trọng | agent |
| 2 | Tra khách hàng | Tìm danh sách khách hàng phòng khám nhanh | info |
| 3 | Lịch hẹn hôm nay | Xem danh sách lịch hẹn hôm nay | success |
| 4 | Kho thuốc tồn | Kiểm tra kho thuốc tồn kho | warning |
| 5 | Doanh thu hôm nay | Thống kê nhanh số liệu hôm nay | agent |
| 6 | Phân quyền | Mở trang nhân sự và quyền hạn để kiểm tra tài khoản | danger |
| 7 | Dịch vụ | Mở danh mục dịch vụ và kiểm tra dịch vụ đang hoạt động | default |
| 8 | Marketing | Gợi ý một chiến dịch marketing nhắc lịch tái khám | info |

### manager — 5 gợi ý
| # | Label | Prompt | Tone |
|---|-------|--------|------|
| 1 | Điều phối lịch | Mở quản lý lịch hẹn và kiểm tra ca cần điều phối | agent |
| 2 | Lịch trực | Mở điều hành nhân sự và kiểm tra lịch trực tuần này | warning |
| 3 | Báo cáo KPI | Tạo báo cáo nhanh số ca, doanh thu và bác sĩ hoạt động tích cực | success |
| 4 | Tìm khách hàng | Tìm danh sách khách hàng phòng khám nhanh | info |
| 5 | Kho cảnh báo | Kiểm tra thuốc sắp hết hoặc cảnh báo kho | danger |

### doctor — 5 gợi ý
| # | Label | Prompt | Tone |
|---|-------|--------|------|
| 1 | Ca của tôi | Mở danh sách ca khám hôm nay của bác sĩ | agent |
| 2 | Bệnh án | Tìm bệnh án gần đây cần theo dõi | info |
| 3 | Tra cứu y khoa | Lên mạng tìm tài liệu điều trị mèo bị giảm bạch cầu | success |
| 4 | Đơn thuốc | Mở trang kê đơn và kiểm tra đơn thuốc gần nhất | warning |
| 5 | Xét nghiệm | Mở quản lý xét nghiệm và tìm kết quả mới nhất | default |

### accountant — 5 gợi ý
| # | Label | Prompt | Tone |
|---|-------|--------|------|
| 1 | Hóa đơn chờ | Mở quản lý hóa đơn và lọc hóa đơn chờ thanh toán | warning |
| 2 | Đối soát | Thống kê nhanh số tiền đã thu và còn chờ thu hôm nay | agent |
| 3 | Xuất Excel | Mở trang hóa đơn để xuất Excel doanh thu | success |
| 4 | Tìm hóa đơn | Mở trang hóa đơn để tìm theo mã hoặc số điện thoại khách hàng | info |
| 5 | Báo cáo doanh thu | Mở báo cáo thống kê doanh thu | default |

### reception — 5 gợi ý
| # | Label | Prompt | Tone |
|---|-------|--------|------|
| 1 | Chờ xác nhận | Mở quản lý lịch hẹn và lọc lịch chờ xác nhận | warning |
| 2 | Check-in ca | Mở trang tiếp tân để check-in ca đang tới | success |
| 3 | Tạo lịch hộ | Tự động tạo lịch khám nhanh cho khách hàng mới | agent |
| 4 | Tra SĐT khách | Tìm khách hàng theo số điện thoại | info |
| 5 | Ca không đến | Lọc các ca không đến hoặc đã hủy hôm nay | danger |

### nurse — 5 gợi ý
| # | Label | Prompt | Tone |
|---|-------|--------|------|
| 1 | Lịch trực | Mở lịch trực cá nhân và kiểm tra ca sắp tới | info |
| 2 | Ca hỗ trợ | Tìm ca khám cần y tá hỗ trợ hôm nay | agent |
| 3 | Xét nghiệm | Mở quản lý xét nghiệm và cân lâm sàng | success |
| 4 | Kho vật tư | Kiểm tra vật tư hoặc thuốc cần bổ sung | warning |
| 5 | Nội trú | Tạo checklist theo dõi nội trú cho thú cưng | default |

### staff — 4 gợi ý
| # | Label | Prompt | Tone |
|---|-------|--------|------|
| 1 | Lịch hôm nay | Xem danh sách lịch hẹn hôm nay | info |
| 2 | Tìm thú cưng | Tìm bé mèo trong hệ thống | success |
| 3 | Kho thuốc | Kiểm tra kho thuốc tồn kho | warning |
| 4 | Tài liệu y khoa | Lên mạng tìm tài liệu chăm sóc mèo mang thai y khoa | agent |

---

## 4. TỔNG HỢP VẤN ĐỀ PHÁT HIỆN

### 🚩 Vấn đề 1: Customer bị trùng ý — cần gộp/bỏ bớt
**File:** `GoiYNhanhChatbot.tsx` — `standardSuggestionMap.customer`

Customer có 4 gợi ý riêng + cả 6 shared. Trong đó:
- `"Cần đi khám không?"` **trùng ý với** `"Dấu hiệu cần đi khám"` (shared)
- `"Sau khi khám"` **trùng ý với** `"Chăm sóc sau khám"` (shared)
- `"Ăn uống theo tuổi"` **trùng ý với** `"Dinh dưỡng thú cưng"` (shared)

**=> Sửa:** Bỏ 3 gợi ý riêng trùng, chỉ giữ shared, thay bằng gợi ý khác.

### 🚩 Vấn đề 2: nurse và staff quá dài (9-10 chips)
Nurse: 4 riêng + 6 shared = 10 chips (dễ bị tràn UI)
Staff: 3 riêng + 6 shared = 9 chips

**=> Sửa:** Cắt shared xuống còn 3 như các role khác (`slice(0,3)` hoặc `slice(2,5)`).

### 🚩 Vấn đề 3: Guest — gợi ý cấp cứu cho người chưa đăng nhập
Guest standard có cả 6 shared, bao gồm "Cấp cứu hóc dị vật" và "Sơ cứu ngộ độc" — có thể phù hợp (ai cũng cần), nhưng cần xem xét.

### 🚩 Vấn đề 4: Agent — thiếu fallback cho role lạ
Trong `getChatbotSuggestions`, nếu role key không có trong map thì fallback về `staff`. Có thể cần fallback khác.

---

## 5. ĐỀ XUẤT SỬA

| Vấn đề | Mức độ | Hành động đề xuất |
|--------|--------|-------------------|
| Customer trùng ý | 🔴 Cao | Bỏ 3 items trùng, thay bằng gợi ý mới |
| Nurse 10 chips | 🟡 Trung bình | Cắt shared còn 3 |
| Staff 9 chips | 🟡 Trung bình | Cắt shared còn 3 |
| Guest có gợi ý cấp cứu | 🟢 Thấp | Giữ nguyên hoặc thêm disclaimer |

---

*Báo cáo này được tạo tự động từ dữ liệu trong `Frontend/src/components/chatbot/GoiYNhanhChatbot.tsx`.*
