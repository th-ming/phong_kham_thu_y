# Báo cáo test gợi ý Chatbot trực tiếp từ API

**Ngày:** 2026-06-11T07:51:44.777Z
**API:** http://127.0.0.1:8081
**Tổng:** 118 | **Passed:** 111 | **Failed:** 7

---

## 🐾 guest > Thông tin bác sĩ
- **Trạng thái:** ✅ PASS
- **Prompt:** Cho tôi biết thông tin bác sĩ của phòng khám
- **Provider:** Gemini
- **Độ dài:** 1183 ký tự
- **Reply:** Chào bạn, Rexi rất vui được chia sẻ thông tin về đội ngũ bác sĩ chuyên môn tại phòng khám để bạn có thể yên tâm gửi gắm bé cưng của mình nhé.

Tại phòng khám, chúng mình có các bác sĩ với chuyên môn rất vững vàng, luôn tận tâm với mọi "boss":

*   **BS. Trần Minh:** Bác sĩ chuyên gia về phẫu thuật và chăm sóc sức khỏe tổng quát.
*   **BS. Hoàng Nam:** Chuyên gia phân tích X-quang và siêu âm với độ chính xác cao.
*   **BS. Khánh Linh:** Được mệnh danh là "bàn tay vàng" trong làng phẫu thuật, rất 

## 🐾 guest > Cấp cứu hóc dị vật
- **Trạng thái:** ✅ PASS
- **Prompt:** Bé bị hóc dị vật, sơ cứu thế nào?
- **Provider:** local_triage
- **Độ dài:** 724 ký tự
- **Reply:** [EMERGENCY] Sen bình tĩnh làm ngay các bước sơ cứu dưới đây và gọi Rexi theo hotline 0353.374.156.

**Nghi hóc dị vật/ngạt thở:**
1. Mở miệng bé kiểm tra nhanh. Chỉ lấy dị vật ra nếu nhìn thấy rõ và gắp được an toàn.
2. Không móc tay sâu vì có thể đẩy dị vật vào trong.
3. Nếu bé không thở hoặc tím tái, thực hiện Heimlich cho thú cưng: đặt hai tay ngay sau xương sườn, ép nhanh hướng lên trên 3-5 lần, rồi kiểm tra miệng.
4. Nếu bé nhỏ, có thể nâng phần thân sau cao hơn đầu và vỗ chắc 3-5 cái giữa 

## 🐾 guest > Lịch tiêm phòng
- **Trạng thái:** ✅ PASS
- **Prompt:** Lịch tiêm phòng vaccine định kỳ cho chó mèo?
- **Provider:** local_vet
- **Độ dài:** 387 ký tự
- **Reply:** Lịch vaccine phụ thuộc tuổi, loài, vaccine đã tiêm và nguy cơ tiếp xúc. Thông thường chó/mèo con bắt đầu tiêm từ khoảng 6-8 tuần tuổi, nhắc theo lịch bác sĩ đến khi hoàn tất mũi cơ bản, sau đó nhắc định kỳ hằng năm hoặc theo khuyến cáo từng loại vaccine. Sen nên mang sổ tiêm/ảnh mũi cũ khi đặt lịch để bác sĩ Rexi chốt lịch chính xác, không tiêm khi bé đang sốt, tiêu chảy hoặc quá yếu.

## 🐾 guest > Dấu hiệu cần đi khám
- **Trạng thái:** ✅ PASS
- **Prompt:** Những dấu hiệu nào ở chó mèo cần đưa đi khám ngay?
- **Provider:** local_vet
- **Độ dài:** 399 ký tự
- **Reply:** Những dấu hiệu nên đưa chó/mèo đi khám ngay gồm: khó thở, tím tái, co giật, lịm đi; nôn/tiêu chảy liên tục hoặc có máu; bỏ ăn hơn 24 giờ ở mèo; sốt cao, đau nhiều, bụng chướng; tai nạn, chảy máu, nghi gãy xương; nghi ngộ độc/nuốt dị vật; tiểu không ra, rặn nhiều; mắt đục/đau/nhắm nghiền. Nếu đang có dấu hiệu cấp cứu, Sen gọi hotline Rexi 0353.374.156 và đưa bé tới phòng khám/cơ sở thú y gần nhất.

## 🐾 guest > Chăm sóc sau khám
- **Trạng thái:** ✅ PASS
- **Prompt:** Sau khi bé vừa khám xong cần chăm sóc và theo dõi thế nào?
- **Provider:** local_vet
- **Độ dài:** 394 ký tự
- **Reply:** Sau khi bé vừa khám xong, Sen theo dõi 24-48 giờ đầu: ăn uống, nôn/tiêu chảy, mức tỉnh táo, vết tiêm/vết thương, nhịp thở và việc đi vệ sinh. Cho bé nghỉ ở nơi yên tĩnh, dùng thuốc đúng đơn nếu bác sĩ đã kê, không tự thêm thuốc người. Cần gọi lại phòng khám hoặc đưa bé tái khám sớm nếu bé lừ đừ tăng, bỏ ăn, nôn nhiều, khó thở, sốt, chảy máu, sưng đau nhiều hoặc có dấu hiệu lạ sau dùng thuốc.

## 🐾 guest > Dinh dưỡng thú cưng
- **Trạng thái:** ✅ PASS
- **Prompt:** Tư vấn khẩu phần ăn phù hợp cho chó mèo theo tuổi và cân nặng
- **Provider:** local_vet
- **Độ dài:** 340 ký tự
- **Reply:** Để tư vấn khẩu phần chuẩn, Rexi cần loài, tuổi, cân nặng, tình trạng triệt sản, mức vận động và bệnh nền. Nguyên tắc nhanh: chọn thức ăn đúng lứa tuổi, chia bữa đều, đổi thức ăn từ từ 5-7 ngày, luôn có nước sạch, không cho xương nấu chín/socola/hành tỏi. Nếu Sen gửi tuổi + cân nặng + bé đang ăn gì, Rexi sẽ gợi ý cách chia bữa an toàn hơn.

## 🐾 guest > Sơ cứu ngộ độc
- **Trạng thái:** ✅ PASS
- **Prompt:** Cách sơ cứu mèo bị ngộ độc thực phẩm?
- **Provider:** local_vet
- **Độ dài:** 386 ký tự
- **Reply:** Nếu nghi mèo/chó ngộ độc, ưu tiên đưa đi cấp cứu thú y ngay và gọi hotline 0353.374.156. Trong lúc đi: lấy mẫu/thông tin thứ bé đã ăn, không tự gây nôn, không cho uống thuốc người, than hoạt hay sữa nếu chưa được bác sĩ hướng dẫn, giữ bé yên và tránh để tiếp tục ăn liếm chất độc. Dấu hiệu nguy hiểm gồm nôn liên tục, co giật, khó thở, lừ đừ, chảy dãi nhiều, tiêu chảy máu hoặc tím tái.

## 🐾 customer > Chăm sóc mèo mang thai
- **Trạng thái:** ✅ PASS
- **Prompt:** Cách chăm sóc mèo mang thai an toàn tại nhà?
- **Provider:** local_vet
- **Độ dài:** 389 ký tự
- **Reply:** Với mèo mang thai, Sen giữ môi trường yên tĩnh, sạch, ấm vừa phải; cho ăn khẩu phần đủ năng lượng, dễ tiêu và luôn có nước sạch; hạn chế stress, nhảy cao/va chạm; chuẩn bị ổ đẻ khô kín. Không tự dùng thuốc, tẩy giun hay bổ sung canxi liều cao nếu chưa hỏi bác sĩ. Cần đi khám nếu mèo bỏ ăn, sốt, chảy dịch hôi/máu nhiều, rặn lâu không ra con, đau nhiều hoặc thai kỳ có dấu hiệu bất thường.

## 🐾 customer > Hướng dẫn đặt lịch
- **Trạng thái:** ✅ PASS
- **Prompt:** Hướng dẫn tôi cách đặt lịch khám cho thú cưng
- **Provider:** local_guard
- **Độ dài:** 93 ký tự
- **Reply:** Không thể bỏ qua quy định an toàn. Rexi vẫn chỉ hỗ trợ thú cưng/phòng khám theo quyền hợp lệ.

## 🐾 customer > Thanh toán hóa đơn
- **Trạng thái:** ✅ PASS
- **Prompt:** Hướng dẫn thanh toán hóa đơn online
- **Provider:** local_guard
- **Độ dài:** 93 ký tự
- **Reply:** Không thể bỏ qua quy định an toàn. Rexi vẫn chỉ hỗ trợ thú cưng/phòng khám theo quyền hợp lệ.

## 🐾 customer > Theo dõi sức khỏe
- **Trạng thái:** ✅ PASS
- **Prompt:** Cách tự theo dõi sức khỏe cho thú cưng tại nhà
- **Provider:** OpenRouter
- **Độ dài:** 2194 ký tự
- **Reply:** **Cách Tự Theo Dõi Sức Khỏe Của Thú Cưng Tại Nhà**  
Dưới đây là hướng dẫn chi tiết để bạn giám sát sức khỏe hiệu quả từ nhà:

---

### **1. Kiểm Tra Đều Đặt Một Cách Thường Xuyên**  
- **Chất lượng ăn:**  
  - Kiểm tra nhỏ mũi, bắp, đầu tay để xem có bàng hoàng, đầy bụng, hoặc mệt mỏi không?  
  - Đánh giá màu sắc và độ dày da (đặc biệt quan trọng cho thú cưng có da dày như chó).  
- **Hạn Chế:**  
  - Động vật cần thiết (nếu là chó/chó hỗn hợp) phải được ăn đủ chất, không bị chế giễu.  
  - Tr

## 🐾 customer > Cấp cứu hóc dị vật
- **Trạng thái:** ✅ PASS
- **Prompt:** Bé bị hóc dị vật, sơ cứu thế nào?
- **Provider:** local_triage
- **Độ dài:** 724 ký tự
- **Reply:** [EMERGENCY] Sen bình tĩnh làm ngay các bước sơ cứu dưới đây và gọi Rexi theo hotline 0353.374.156.

**Nghi hóc dị vật/ngạt thở:**
1. Mở miệng bé kiểm tra nhanh. Chỉ lấy dị vật ra nếu nhìn thấy rõ và gắp được an toàn.
2. Không móc tay sâu vì có thể đẩy dị vật vào trong.
3. Nếu bé không thở hoặc tím tái, thực hiện Heimlich cho thú cưng: đặt hai tay ngay sau xương sườn, ép nhanh hướng lên trên 3-5 lần, rồi kiểm tra miệng.
4. Nếu bé nhỏ, có thể nâng phần thân sau cao hơn đầu và vỗ chắc 3-5 cái giữa 

## 🐾 customer > Lịch tiêm phòng
- **Trạng thái:** ✅ PASS
- **Prompt:** Lịch tiêm phòng vaccine định kỳ cho chó mèo?
- **Provider:** local_vet
- **Độ dài:** 387 ký tự
- **Reply:** Lịch vaccine phụ thuộc tuổi, loài, vaccine đã tiêm và nguy cơ tiếp xúc. Thông thường chó/mèo con bắt đầu tiêm từ khoảng 6-8 tuần tuổi, nhắc theo lịch bác sĩ đến khi hoàn tất mũi cơ bản, sau đó nhắc định kỳ hằng năm hoặc theo khuyến cáo từng loại vaccine. Sen nên mang sổ tiêm/ảnh mũi cũ khi đặt lịch để bác sĩ Rexi chốt lịch chính xác, không tiêm khi bé đang sốt, tiêu chảy hoặc quá yếu.

## 🐾 customer > Dấu hiệu cần đi khám
- **Trạng thái:** ✅ PASS
- **Prompt:** Những dấu hiệu nào ở chó mèo cần đưa đi khám ngay?
- **Provider:** local_vet
- **Độ dài:** 399 ký tự
- **Reply:** Những dấu hiệu nên đưa chó/mèo đi khám ngay gồm: khó thở, tím tái, co giật, lịm đi; nôn/tiêu chảy liên tục hoặc có máu; bỏ ăn hơn 24 giờ ở mèo; sốt cao, đau nhiều, bụng chướng; tai nạn, chảy máu, nghi gãy xương; nghi ngộ độc/nuốt dị vật; tiểu không ra, rặn nhiều; mắt đục/đau/nhắm nghiền. Nếu đang có dấu hiệu cấp cứu, Sen gọi hotline Rexi 0353.374.156 và đưa bé tới phòng khám/cơ sở thú y gần nhất.

## 🐾 customer > Chăm sóc sau khám
- **Trạng thái:** ✅ PASS
- **Prompt:** Sau khi bé vừa khám xong cần chăm sóc và theo dõi thế nào?
- **Provider:** local_vet
- **Độ dài:** 394 ký tự
- **Reply:** Sau khi bé vừa khám xong, Sen theo dõi 24-48 giờ đầu: ăn uống, nôn/tiêu chảy, mức tỉnh táo, vết tiêm/vết thương, nhịp thở và việc đi vệ sinh. Cho bé nghỉ ở nơi yên tĩnh, dùng thuốc đúng đơn nếu bác sĩ đã kê, không tự thêm thuốc người. Cần gọi lại phòng khám hoặc đưa bé tái khám sớm nếu bé lừ đừ tăng, bỏ ăn, nôn nhiều, khó thở, sốt, chảy máu, sưng đau nhiều hoặc có dấu hiệu lạ sau dùng thuốc.

## 🐾 customer > Dinh dưỡng thú cưng
- **Trạng thái:** ✅ PASS
- **Prompt:** Tư vấn khẩu phần ăn phù hợp cho chó mèo theo tuổi và cân nặng
- **Provider:** local_vet
- **Độ dài:** 340 ký tự
- **Reply:** Để tư vấn khẩu phần chuẩn, Rexi cần loài, tuổi, cân nặng, tình trạng triệt sản, mức vận động và bệnh nền. Nguyên tắc nhanh: chọn thức ăn đúng lứa tuổi, chia bữa đều, đổi thức ăn từ từ 5-7 ngày, luôn có nước sạch, không cho xương nấu chín/socola/hành tỏi. Nếu Sen gửi tuổi + cân nặng + bé đang ăn gì, Rexi sẽ gợi ý cách chia bữa an toàn hơn.

## 🐾 customer > Sơ cứu ngộ độc
- **Trạng thái:** ✅ PASS
- **Prompt:** Cách sơ cứu mèo bị ngộ độc thực phẩm?
- **Provider:** local_vet
- **Độ dài:** 386 ký tự
- **Reply:** Nếu nghi mèo/chó ngộ độc, ưu tiên đưa đi cấp cứu thú y ngay và gọi hotline 0353.374.156. Trong lúc đi: lấy mẫu/thông tin thứ bé đã ăn, không tự gây nôn, không cho uống thuốc người, than hoạt hay sữa nếu chưa được bác sĩ hướng dẫn, giữ bé yên và tránh để tiếp tục ăn liếm chất độc. Dấu hiệu nguy hiểm gồm nôn liên tục, co giật, khó thở, lừ đừ, chảy dãi nhiều, tiêu chảy máu hoặc tím tái.

## 🐾 admin > Khi nào dùng Agent?
- **Trạng thái:** ✅ PASS
- **Prompt:** Phân biệt khi nào nên dùng Trợ lý Rexi và khi nào nên dùng Rexi Agent?
- **Provider:** Groq
- **Độ dài:** 1072 ký tự
- **Reply:** Dạ Rexi chào bạn! Rexi là một Bác sĩ thú y tận tâm và chuyên nghiệp, giúp bạn chăm sóc sức khỏe của bé nhà mình. Rexi Agent là một công cụ hỗ trợ của Rexi, giúp bạn thực hiện các thao tác giao diện và truy cập dữ liệu hệ thống một cách dễ dàng.

Khi nào nên dùng Rexi:

- Bạn cần tư vấn y khoa về sức khỏe của bé nhà mình, chẳng hạn như dấu hiệu bệnh, cách chăm sóc, dinh dưỡng, hành vi, v.v.
- Bạn muốn biết thông tin về các dịch vụ thú y, bảng giá, hoặc thông tin về phòng khám.

Khi nào nên dùng R

## 🐾 admin > Quy trình phân quyền
- **Trạng thái:** ✅ PASS
- **Prompt:** Giải thích nguyên tắc phân quyền nội bộ cho admin khi dùng hệ thống
- **Provider:** fast_db
- **Độ dài:** 153 ký tự
- **Reply:** Tôi chưa tìm thấy dữ liệu khớp rõ trong hệ thống. Bạn nhập cụ thể hơn tên dịch vụ, bác sĩ, lịch trực hoặc chuyển sang Rexi Agent để quét dữ liệu sâu hơn.

## 🐾 admin > Kiểm tra lỗi hệ thống
- **Trạng thái:** ❌ FAIL
- **Vấn đề:** Từ chối không rõ lý do
- **Prompt:** Nếu hệ thống phản hồi chậm hoặc lỗi API thì admin nên kiểm tra theo thứ tự nào?
- **Provider:** fast_db
- **Độ dài:** 153 ký tự
- **Reply:** Tôi chưa tìm thấy dữ liệu khớp rõ trong hệ thống. Bạn nhập cụ thể hơn tên dịch vụ, bác sĩ, lịch trực hoặc chuyển sang Rexi Agent để quét dữ liệu sâu hơn.

## 🐾 admin > Bảo mật dữ liệu
- **Trạng thái:** ✅ PASS
- **Prompt:** Những dữ liệu nào không nên hiển thị trong chat thường?
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🐾 admin > Vận hành phòng khám
- **Trạng thái:** ✅ PASS
- **Prompt:** Gợi ý checklist vận hành phòng khám đầu ngày cho quản trị viên
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🐾 admin > Giao việc đúng vai trò
- **Trạng thái:** ✅ PASS
- **Prompt:** Admin nên phân công tác vụ nào cho quản lý, kế toán, tiếp tân, bác sĩ và y tá?
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🐾 admin > Cấp cứu hóc dị vật
- **Trạng thái:** ❌ FAIL
- **Vấn đề:** Câu y tế nguy cấp thiếu hướng dẫn an toàn (hotline/sơ cứu)
- **Prompt:** Bé bị hóc dị vật, sơ cứu thế nào?
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🐾 admin > Lịch tiêm phòng
- **Trạng thái:** ✅ PASS
- **Prompt:** Lịch tiêm phòng vaccine định kỳ cho chó mèo?
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🐾 admin > Dấu hiệu cần đi khám
- **Trạng thái:** ✅ PASS
- **Prompt:** Những dấu hiệu nào ở chó mèo cần đưa đi khám ngay?
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🐾 manager > Điều phối ca khám
- **Trạng thái:** ✅ PASS
- **Prompt:** Quản lý nên điều phối lịch hẹn và nhân sự phòng khám theo nguyên tắc nào?
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🐾 manager > Ưu tiên vận hành
- **Trạng thái:** ✅ PASS
- **Prompt:** Khi phòng khám đông khách, nên ưu tiên xử lý những nhóm việc nào trước?
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🐾 manager > Chất lượng dịch vụ
- **Trạng thái:** ✅ PASS
- **Prompt:** Gợi ý cách đánh giá chất lượng dịch vụ phòng khám thú y trong ngày
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🐾 manager > Phối hợp vai trò
- **Trạng thái:** ✅ PASS
- **Prompt:** Quản lý nên phối hợp với bác sĩ, y tá, kế toán và tiếp tân thế nào để tránh nghẽn việc?
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🐾 manager > Báo cáo cần có
- **Trạng thái:** ✅ PASS
- **Prompt:** Một báo cáo vận hành phòng khám nên gồm những chỉ số nào?
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🐾 manager > Cấp cứu hóc dị vật
- **Trạng thái:** ❌ FAIL
- **Vấn đề:** Câu y tế nguy cấp thiếu hướng dẫn an toàn (hotline/sơ cứu)
- **Prompt:** Bé bị hóc dị vật, sơ cứu thế nào?
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🐾 manager > Lịch tiêm phòng
- **Trạng thái:** ✅ PASS
- **Prompt:** Lịch tiêm phòng vaccine định kỳ cho chó mèo?
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🐾 manager > Dấu hiệu cần đi khám
- **Trạng thái:** ✅ PASS
- **Prompt:** Những dấu hiệu nào ở chó mèo cần đưa đi khám ngay?
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🐾 doctor > Ưu tiên ca khám
- **Trạng thái:** ✅ PASS
- **Prompt:** Bác sĩ nên ưu tiên ca khám thú y theo dấu hiệu nguy hiểm nào?
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🐾 doctor > Ghi bệnh án tốt
- **Trạng thái:** ✅ PASS
- **Prompt:** Một bệnh án thú y nên ghi những trường thông tin nào để dễ theo dõi?
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🐾 doctor > Nguyên tắc dùng thuốc
- **Trạng thái:** ✅ PASS
- **Prompt:** Những nguyên tắc an toàn khi cân nhắc thuốc cấp cứu cho chó mèo?
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🐾 doctor > Sơ cứu Heimlich
- **Trạng thái:** ❌ FAIL
- **Vấn đề:** Câu y tế nguy cấp thiếu hướng dẫn an toàn (hotline/sơ cứu)
- **Prompt:** Hướng dẫn kỹ thuật Heimlich cho chó mèo?
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🐾 doctor > Đọc xét nghiệm
- **Trạng thái:** ✅ PASS
- **Prompt:** Gợi ý cách đọc kết quả xét nghiệm máu chó mèo
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🐾 doctor > Dặn dò chủ nuôi
- **Trạng thái:** ✅ PASS
- **Prompt:** Sau khám, bác sĩ nên dặn dò chủ nuôi theo cấu trúc nào?
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🐾 doctor > Dấu hiệu cần đi khám
- **Trạng thái:** ✅ PASS
- **Prompt:** Những dấu hiệu nào ở chó mèo cần đưa đi khám ngay?
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🐾 doctor > Chăm sóc sau khám
- **Trạng thái:** ✅ PASS
- **Prompt:** Sau khi bé vừa khám xong cần chăm sóc và theo dõi thế nào?
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🐾 doctor > Dinh dưỡng thú cưng
- **Trạng thái:** ✅ PASS
- **Prompt:** Tư vấn khẩu phần ăn phù hợp cho chó mèo theo tuổi và cân nặng
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🐾 accountant > Đối soát an toàn
- **Trạng thái:** ✅ PASS
- **Prompt:** Quy trình đối soát hóa đơn và thanh toán nên kiểm tra những điểm nào?
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🐾 accountant > Báo cáo tài chính
- **Trạng thái:** ✅ PASS
- **Prompt:** Một báo cáo doanh thu ngày của phòng khám nên có những mục nào?
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🐾 accountant > Sai lệch thanh toán
- **Trạng thái:** ✅ PASS
- **Prompt:** Khi hóa đơn và giao dịch thanh toán lệch nhau thì nên xử lý theo bước nào?
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🐾 accountant > Xuất Excel
- **Trạng thái:** ✅ PASS
- **Prompt:** Hướng dẫn xuất file Excel hóa đơn và doanh thu
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🐾 accountant > Bảo mật hóa đơn
- **Trạng thái:** ✅ PASS
- **Prompt:** Kế toán cần lưu ý gì khi trao đổi thông tin hóa đơn trong chat?
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🐾 accountant > Chăm sóc sau khám
- **Trạng thái:** ✅ PASS
- **Prompt:** Sau khi bé vừa khám xong cần chăm sóc và theo dõi thế nào?
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🐾 accountant > Dinh dưỡng thú cưng
- **Trạng thái:** ✅ PASS
- **Prompt:** Tư vấn khẩu phần ăn phù hợp cho chó mèo theo tuổi và cân nặng
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🐾 reception > Xác nhận lịch
- **Trạng thái:** ✅ PASS
- **Prompt:** Tiếp tân nên xác nhận lịch hẹn với khách theo kịch bản nào?
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🐾 reception > Check-in
- **Trạng thái:** ✅ PASS
- **Prompt:** Quy trình check-in khách đã tới phòng khám gồm những bước nào?
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🐾 reception > Tạo lịch mới
- **Trạng thái:** ✅ PASS
- **Prompt:** Khi tạo lịch hẹn mới, tiếp tân cần hỏi khách những thông tin nào?
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🐾 reception > Tra khách an toàn
- **Trạng thái:** ✅ PASS
- **Prompt:** Khi khách gọi điện, tiếp tân nên xác minh thông tin thế nào trước khi tra hồ sơ?
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🐾 reception > Khách không đến
- **Trạng thái:** ✅ PASS
- **Prompt:** Nên xử lý lịch hẹn khách không đến như thế nào cho đúng quy trình?
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🐾 reception > Cấp cứu hóc dị vật
- **Trạng thái:** ❌ FAIL
- **Vấn đề:** Câu y tế nguy cấp thiếu hướng dẫn an toàn (hotline/sơ cứu)
- **Prompt:** Bé bị hóc dị vật, sơ cứu thế nào?
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🐾 reception > Lịch tiêm phòng
- **Trạng thái:** ✅ PASS
- **Prompt:** Lịch tiêm phòng vaccine định kỳ cho chó mèo?
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🐾 reception > Dấu hiệu cần đi khám
- **Trạng thái:** ✅ PASS
- **Prompt:** Những dấu hiệu nào ở chó mèo cần đưa đi khám ngay?
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🐾 nurse > Ca cần hỗ trợ
- **Trạng thái:** ✅ PASS
- **Prompt:** Y tá nên chuẩn bị hỗ trợ ca khám theo checklist nào?
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🐾 nurse > Chuẩn bị xét nghiệm
- **Trạng thái:** ✅ PASS
- **Prompt:** Danh sách việc cần chuẩn bị trước khi lấy mẫu xét nghiệm
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🐾 nurse > Theo dõi nội trú
- **Trạng thái:** ✅ PASS
- **Prompt:** Các chỉ số cần theo dõi cho thú cưng nội trú
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🐾 nurse > Vật tư ca trực
- **Trạng thái:** ✅ PASS
- **Prompt:** Y tá nên kiểm tra vật tư gì trước khi bắt đầu ca trực?
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🐾 nurse > Cấp cứu hóc dị vật
- **Trạng thái:** ❌ FAIL
- **Vấn đề:** Câu y tế nguy cấp thiếu hướng dẫn an toàn (hotline/sơ cứu)
- **Prompt:** Bé bị hóc dị vật, sơ cứu thế nào?
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🐾 nurse > Lịch tiêm phòng
- **Trạng thái:** ✅ PASS
- **Prompt:** Lịch tiêm phòng vaccine định kỳ cho chó mèo?
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🐾 nurse > Dấu hiệu cần đi khám
- **Trạng thái:** ✅ PASS
- **Prompt:** Những dấu hiệu nào ở chó mèo cần đưa đi khám ngay?
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🐾 staff > Dùng hệ thống
- **Trạng thái:** ✅ PASS
- **Prompt:** Nhân viên mới nên dùng các phân hệ phòng khám theo thứ tự nào?
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🐾 staff > Tra cứu an toàn
- **Trạng thái:** ✅ PASS
- **Prompt:** Khi nào nhân viên nên chuyển sang Rexi Agent để tra dữ liệu thật?
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🐾 staff > Quy trình kho
- **Trạng thái:** ✅ PASS
- **Prompt:** Khi kiểm kho thuốc, nhân viên cần lưu ý những điểm nào?
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🐾 staff > Cấp cứu hóc dị vật
- **Trạng thái:** ❌ FAIL
- **Vấn đề:** Câu y tế nguy cấp thiếu hướng dẫn an toàn (hotline/sơ cứu)
- **Prompt:** Bé bị hóc dị vật, sơ cứu thế nào?
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🐾 staff > Lịch tiêm phòng
- **Trạng thái:** ✅ PASS
- **Prompt:** Lịch tiêm phòng vaccine định kỳ cho chó mèo?
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🐾 staff > Dấu hiệu cần đi khám
- **Trạng thái:** ✅ PASS
- **Prompt:** Những dấu hiệu nào ở chó mèo cần đưa đi khám ngay?
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🤖 guest > Đăng nhập
- **Trạng thái:** ✅ PASS
- **Prompt:** Tôi cần đăng nhập để sử dụng các chức năng cá nhân
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🤖 guest > Đặt lịch
- **Trạng thái:** ✅ PASS
- **Prompt:** Hướng dẫn đặt lịch khám thú cưng
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🤖 guest > Dịch vụ Rexi
- **Trạng thái:** ✅ PASS
- **Prompt:** Rexi có những dịch vụ thú y nào?
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🤖 guest > Thông tin bác sĩ
- **Trạng thái:** ✅ PASS
- **Prompt:** Cho tôi biết thông tin bác sĩ của phòng khám
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🤖 customer > Mở đặt lịch
- **Trạng thái:** ✅ PASS
- **Prompt:** Mở trang đặt lịch khám cho thú cưng của tôi
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🤖 customer > Mở lịch đã đặt
- **Trạng thái:** ✅ PASS
- **Prompt:** Mở trang lịch sử lịch hẹn của tôi
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🤖 customer > Mở hóa đơn
- **Trạng thái:** ✅ PASS
- **Prompt:** Mở trang hóa đơn và thanh toán của tôi
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🤖 customer > Mở hồ sơ y tế
- **Trạng thái:** ✅ PASS
- **Prompt:** Mở hồ sơ y tế thú cưng của tôi
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🤖 customer > Tìm tài liệu mèo mang thai
- **Trạng thái:** ✅ PASS
- **Prompt:** Lên mạng tìm tài liệu chăm sóc mèo mang thai y khoa
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🤖 customer > Mở thông tin bác sĩ
- **Trạng thái:** ✅ PASS
- **Prompt:** Mở trang đội ngũ bác sĩ của phòng khám
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🤖 admin > Mở báo cáo thống kê
- **Trạng thái:** ✅ PASS
- **Prompt:** Mở trang báo cáo thống kê và tóm tắt KPI quan trọng
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🤖 admin > Tra khách hàng
- **Trạng thái:** ✅ PASS
- **Prompt:** Tìm danh sách khách hàng phòng khám nhanh
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🤖 admin > Lịch hẹn hôm nay
- **Trạng thái:** ✅ PASS
- **Prompt:** Xem danh sách lịch hẹn hôm nay
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🤖 admin > Kho thuốc tồn
- **Trạng thái:** ✅ PASS
- **Prompt:** Kiểm tra kho thuốc tồn kho
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🤖 admin > Doanh thu hôm nay
- **Trạng thái:** ✅ PASS
- **Prompt:** Thống kê nhanh số liệu hôm nay
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🤖 admin > Phân quyền
- **Trạng thái:** ✅ PASS
- **Prompt:** Mở trang nhân sự và quyền hạn để kiểm tra tài khoản
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🤖 admin > Dịch vụ
- **Trạng thái:** ✅ PASS
- **Prompt:** Mở danh mục dịch vụ và kiểm tra dịch vụ đang hoạt động
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🤖 admin > Marketing
- **Trạng thái:** ✅ PASS
- **Prompt:** Gợi ý một chiến dịch marketing nhắc lịch tái khám
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🤖 manager > Điều phối lịch
- **Trạng thái:** ✅ PASS
- **Prompt:** Mở quản lý lịch hẹn và kiểm tra ca cần điều phối
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🤖 manager > Lịch trực
- **Trạng thái:** ✅ PASS
- **Prompt:** Mở điều hành nhân sự và kiểm tra lịch trực tuần này
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🤖 manager > Báo cáo KPI
- **Trạng thái:** ✅ PASS
- **Prompt:** Tạo báo cáo nhanh số ca, doanh thu và bác sĩ hoạt động tích cực
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🤖 manager > Tìm khách hàng
- **Trạng thái:** ✅ PASS
- **Prompt:** Tìm danh sách khách hàng phòng khám nhanh
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🤖 manager > Kho cảnh báo
- **Trạng thái:** ✅ PASS
- **Prompt:** Kiểm tra thuốc sắp hết hoặc cảnh báo kho
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🤖 doctor > Ca của tôi
- **Trạng thái:** ✅ PASS
- **Prompt:** Mở danh sách ca khám hôm nay của bác sĩ
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🤖 doctor > Bệnh án
- **Trạng thái:** ✅ PASS
- **Prompt:** Tìm bệnh án gần đây cần theo dõi
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🤖 doctor > Tra cứu y khoa
- **Trạng thái:** ✅ PASS
- **Prompt:** Lên mạng tìm tài liệu điều trị mèo bị giảm bạch cầu
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🤖 doctor > Đơn thuốc
- **Trạng thái:** ✅ PASS
- **Prompt:** Mở trang kê đơn và kiểm tra đơn thuốc gần nhất
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🤖 doctor > Xét nghiệm
- **Trạng thái:** ✅ PASS
- **Prompt:** Mở quản lý xét nghiệm và tìm kết quả mới nhất
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🤖 accountant > Hóa đơn chờ
- **Trạng thái:** ✅ PASS
- **Prompt:** Mở quản lý hóa đơn và lọc hóa đơn chờ thanh toán
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🤖 accountant > Đối soát
- **Trạng thái:** ✅ PASS
- **Prompt:** Thống kê nhanh số tiền đã thu và còn chờ thu hôm nay
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🤖 accountant > Xuất Excel
- **Trạng thái:** ✅ PASS
- **Prompt:** Mở trang hóa đơn để xuất Excel doanh thu
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🤖 accountant > Tìm hóa đơn
- **Trạng thái:** ✅ PASS
- **Prompt:** Mở trang hóa đơn để tìm theo mã hoặc số điện thoại khách hàng
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🤖 accountant > Báo cáo doanh thu
- **Trạng thái:** ✅ PASS
- **Prompt:** Mở báo cáo thống kê doanh thu
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🤖 reception > Chờ xác nhận
- **Trạng thái:** ✅ PASS
- **Prompt:** Mở quản lý lịch hẹn và lọc lịch chờ xác nhận
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🤖 reception > Check-in ca
- **Trạng thái:** ✅ PASS
- **Prompt:** Mở trang tiếp tân để check-in ca đang tới
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🤖 reception > Tạo lịch hộ
- **Trạng thái:** ✅ PASS
- **Prompt:** Tự động tạo lịch khám nhanh cho khách hàng mới
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🤖 reception > Tra SĐT khách
- **Trạng thái:** ✅ PASS
- **Prompt:** Tìm khách hàng theo số điện thoại
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🤖 reception > Ca không đến
- **Trạng thái:** ✅ PASS
- **Prompt:** Lọc các ca không đến hoặc đã hủy hôm nay
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🤖 nurse > Lịch trực
- **Trạng thái:** ✅ PASS
- **Prompt:** Mở lịch trực cá nhân và kiểm tra ca sắp tới
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🤖 nurse > Ca hỗ trợ
- **Trạng thái:** ✅ PASS
- **Prompt:** Tìm ca khám cần y tá hỗ trợ hôm nay
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🤖 nurse > Xét nghiệm
- **Trạng thái:** ✅ PASS
- **Prompt:** Mở quản lý xét nghiệm và cân lâm sàng
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🤖 nurse > Kho vật tư
- **Trạng thái:** ✅ PASS
- **Prompt:** Kiểm tra vật tư hoặc thuốc cần bổ sung
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🤖 nurse > Nội trú
- **Trạng thái:** ✅ PASS
- **Prompt:** Tạo checklist theo dõi nội trú cho thú cưng
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🤖 staff > Lịch hôm nay
- **Trạng thái:** ✅ PASS
- **Prompt:** Xem danh sách lịch hẹn hôm nay
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🤖 staff > Tìm thú cưng
- **Trạng thái:** ✅ PASS
- **Prompt:** Tìm bé mèo trong hệ thống
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🤖 staff > Kho thuốc
- **Trạng thái:** ✅ PASS
- **Prompt:** Kiểm tra kho thuốc tồn kho
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!

## 🤖 staff > Tài liệu y khoa
- **Trạng thái:** ✅ PASS
- **Prompt:** Lên mạng tìm tài liệu chăm sóc mèo mang thai y khoa
- **Provider:** N/A
- **Độ dài:** 123 ký tự
- **Reply:** Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!
