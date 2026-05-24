# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: Kiem_Tra_Sieu_Agent_150_Truong_Hop.spec.ts >> Siêu Bộ Test 150 Kịch Bản - Rexi Agent v2 Autopilot >> [TC-71] [Image Diagnostics] - Tải ảnh PNG vết thương y khoa -> API giữ chuẩn định dạng base64
- Location: Kiem_Tra_Sieu_Agent_150_Truong_Hop.spec.ts:348:9

# Error details

```
Test timeout of 180000ms exceeded.
```

```
Error: locator.setInputFiles: Test timeout of 180000ms exceeded.
Call log:
  - waiting for locator('input[data-ai-id="input-chatbot-jmt6"]')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - complementary [ref=e4]:
    - generic [ref=e5]:
      - link "Rexi REXI GÓC CỦA SEN" [ref=e6] [cursor=pointer]:
        - /url: /
        - img "Rexi" [ref=e8]
        - generic [ref=e9]:
          - heading "REXI" [level=2] [ref=e10]
          - paragraph [ref=e11]: GÓC CỦA SEN
      - generic [ref=e12]:
        - generic [ref=e16]: "N"
        - generic [ref=e17]:
          - paragraph [ref=e18]: Nguyễn Ngọc Ánh
          - generic [ref=e19]:
            - generic [ref=e20]: stars
            - paragraph [ref=e21]: KHTT
    - navigation [ref=e22]:
      - list [ref=e23]:
        - listitem [ref=e24]:
          - link "dashboard Tổng quan" [ref=e25] [cursor=pointer]:
            - /url: /khach-hang/dashboard
            - generic [ref=e27]: dashboard
            - text: Tổng quan
        - listitem [ref=e28]:
          - link "pets Thú cưng" [ref=e29] [cursor=pointer]:
            - /url: /khach-hang/quan-ly-thu-cung
            - generic [ref=e30]: pets
            - text: Thú cưng
        - listitem [ref=e31]:
          - link "edit_calendar Đặt lịch hẹn" [ref=e32] [cursor=pointer]:
            - /url: /khach-hang/dat-lich-hen
            - generic [ref=e33]: edit_calendar
            - text: Đặt lịch hẹn
        - listitem [ref=e34]:
          - link "calendar_month Xem lịch hẹn" [ref=e35] [cursor=pointer]:
            - /url: /khach-hang/lich-su-lich-hen
            - generic [ref=e36]: calendar_month
            - text: Xem lịch hẹn
        - listitem [ref=e37]:
          - link "medical_information Hồ sơ y tế" [ref=e38] [cursor=pointer]:
            - /url: /khach-hang/ho-so-benh-an
            - generic [ref=e39]: medical_information
            - text: Hồ sơ y tế
        - listitem [ref=e40]:
          - link "receipt Hóa đơn" [ref=e41] [cursor=pointer]:
            - /url: /khach-hang/hoa-don-thanh-toan
            - generic [ref=e42]: receipt
            - text: Hóa đơn
        - listitem [ref=e43]:
          - link "person Cá nhân" [ref=e44] [cursor=pointer]:
            - /url: /khach-hang/thong-tin-ca-nhan
            - generic [ref=e45]: person
            - text: Cá nhân
    - generic [ref=e46]:
      - generic [ref=e47]:
        - link "home Trang chủ" [ref=e48] [cursor=pointer]:
          - /url: /
          - generic [ref=e49]: home
          - text: Trang chủ
        - button "Đổi giao diện" [ref=e50] [cursor=pointer]:
          - generic [ref=e51]: dark_mode
      - button "logout Đăng xuất" [ref=e52] [cursor=pointer]:
        - generic [ref=e53]: logout
        - text: Đăng xuất
  - main [ref=e54]:
    - generic [ref=e56]:
      - generic [ref=e58]:
        - generic [ref=e61]: "N"
        - generic [ref=e62]:
          - heading "Xin chào! 👋" [level=1] [ref=e63]
          - paragraph [ref=e64]: Cùng theo dõi và chăm sóc sức khỏe cho các bạn nhỏ nhà mình nhé.
      - generic [ref=e65]:
        - generic [ref=e66] [cursor=pointer]:
          - button "Chi tiết BÉ CƯNG" [ref=e67]:
            - generic [ref=e68]: trending_up
            - generic [ref=e69]: +2 tháng này
          - generic:
            - generic: BÉ CƯNG
            - generic: "Bao gồm: Khác: 2"
          - generic [ref=e72]: pets
          - paragraph [ref=e73]: BÉ CƯNG
          - heading "2" [level=3] [ref=e74]
        - generic [ref=e75] [cursor=pointer]:
          - button "Chi tiết LỊCH HẸN" [ref=e76]:
            - generic [ref=e77]: trending_flat
            - generic [ref=e78]: Chưa có
          - generic:
            - generic: LỊCH HẸN
            - generic: Không có lịch hẹn nào sắp tới
          - generic [ref=e81]: calendar_month
          - paragraph [ref=e82]: LỊCH HẸN
          - heading "0" [level=3] [ref=e83]
        - generic [ref=e84] [cursor=pointer]:
          - button "Chi tiết ĐÃ KHÁM" [ref=e85]:
            - generic [ref=e86]: trending_up
            - generic [ref=e87]: +1 tháng này
          - generic:
            - generic: ĐÃ KHÁM
            - generic: "Lần khám gần nhất: 17/05/2026"
          - generic [ref=e90]: verified
          - paragraph [ref=e91]: ĐÃ KHÁM
          - heading "1" [level=3] [ref=e92]
        - generic [ref=e93] [cursor=pointer]:
          - button "Chi tiết CHI TIÊU" [ref=e94]:
            - generic [ref=e95]: trending_up
            - generic [ref=e96]: +150.000 ₫ tháng này
          - generic:
            - generic: CHI TIÊU
            - generic: "Đã chi trong tháng này: 150.000 ₫"
          - generic [ref=e99]: payments
          - paragraph [ref=e100]: CHI TIÊU
          - heading "150.000 ₫" [level=3] [ref=e101]
      - generic [ref=e102]:
        - generic [ref=e103] [cursor=pointer]:
          - generic [ref=e104]:
            - heading "Lịch hẹn sắp tới" [level=3] [ref=e105]
            - link "add Đặt lịch mới" [ref=e106]:
              - /url: /khach-hang/dat-lich-hen
              - generic [ref=e107]: add
              - text: Đặt lịch mới
          - generic [ref=e108]:
            - text: event_busy
            - paragraph [ref=e109]: Bạn chưa có lịch hẹn nào sắp tới.
        - generic [ref=e110]:
          - generic [ref=e111] [cursor=pointer]:
            - generic [ref=e112]:
              - generic [ref=e113]: lightbulb
              - heading "Mẹo chăm sóc" [level=3] [ref=e114]
            - paragraph [ref=e115]: Vệ sinh răng miệng thường xuyên giúp bé tránh được các bệnh về nướu.
            - button "Xem tất cả mẹo" [ref=e116]
          - link "support_agent Hỗ trợ 24/7 Cần tư vấn khẩn cấp? Gọi 0353.374.156" [ref=e117] [cursor=pointer]:
            - /url: tel:***REMOVED***-VIETQR_ACCOUNT_NO
            - generic [ref=e119]: support_agent
            - generic [ref=e120]:
              - heading "Hỗ trợ 24/7" [level=4] [ref=e121]
              - paragraph [ref=e122]: Cần tư vấn khẩn cấp? Gọi 0353.374.156
  - button "close" [ref=e123] [cursor=pointer]:
    - generic [ref=e124]: close
  - generic [ref=e126]:
    - generic [ref=e127]:
      - generic [ref=e130]: Rexi Agent v2 🤖
      - generic [ref=e131]:
        - generic "Bật đọc thành tiếng" [ref=e132] [cursor=pointer]: volume_off
        - generic "Làm mới cuộc hội thoại" [ref=e133] [cursor=pointer]: restart_alt
        - generic [ref=e134] [cursor=pointer]: close
    - generic [ref=e135]:
      - button "chat Trợ lý Rexi" [ref=e137] [cursor=pointer]:
        - generic [ref=e138]: chat
        - text: Trợ lý Rexi
      - button "smart_toy Tác vụ Agent v2" [ref=e139] [cursor=pointer]:
        - generic [ref=e140]: smart_toy
        - text: Tác vụ Agent v2
    - generic [ref=e141]:
      - paragraph [ref=e144]:
        - text: Chào buổi trưa Sen
        - strong [ref=e145]: Nguyễn Ngọc Ánh
        - text: "! 🐾 Tôi là"
        - strong [ref=e146]: Rexi Agent v2
        - text: "- Trợ lý Tác vụ AI. Tôi có thể hỗ trợ đặt lịch khám, tra cứu lịch trực bác sĩ và tìm tài liệu thú y chuẩn xác. Sen muốn Rexi làm gì hôm nay ạ?"
      - paragraph [ref=e149]: Nhìn ảnh này chẩn đoán giúp tôi
      - paragraph [ref=e152]: Đã nhận ảnh PNG chẩn đoán. Vết loét da có dấu hiệu viêm nhiễm nhẹ.
    - generic "Gợi ý nhanh agent" [ref=e153]:
      - generic [ref=e154]:
        - button "Tự điền lịch khám" [ref=e155] [cursor=pointer]
        - button "Tìm hóa đơn" [ref=e156] [cursor=pointer]
        - button "Mở hồ sơ y tế" [ref=e157] [cursor=pointer]
        - button "Tìm tài liệu mèo mang thai" [ref=e158] [cursor=pointer]
        - button "Sơ cứu hóc xương" [ref=e159] [cursor=pointer]
    - generic [ref=e160]:
      - button "mic_none" [ref=e161] [cursor=pointer]:
        - generic [ref=e162]: mic_none
      - textbox "Lệnh tác vụ cho Agent (e.g. đặt lịch, tra cứu mạng)..." [ref=e163]
      - button "send" [active] [ref=e164] [cursor=pointer]:
        - generic [ref=e165]: send
```

# Test source

```ts
  128 |     url: '/khach-hang/dashboard',
  129 |     userMessage: "Ghi chú là: ' OR 1=1 --",
  130 |     mockApiResponse: {
  131 |       reply: "Rexi phát hiện ký tự không hợp lệ trong ô ghi chú. Sếp vui lòng điền văn bản an toàn nhé!"
  132 |     },
  133 |     checkFn: async (page) => {
  134 |       await expect(page.locator('#chatWindow')).toContainText(/ký tự không hợp lệ/i);
  135 |     }
  136 |   },
  137 | 
  138 |   // ==========================================
  139 |   // NHÓM B: ĐIỀU HƯỚNG THÔNG MINH & CHỐT CHẶN (31 - 55)
  140 |   // ==========================================
  141 |   {
  142 |     id: 31,
  143 |     category: 'Strict Navigation Gate',
  144 |     name: 'Hỏi địa chỉ phòng khám -> Chặn đứng nhảy trang bừa bãi',
  145 |     url: '/khach-hang/dashboard',
  146 |     userMessage: 'Phòng khám thú y Rexi ở đâu vậy?',
  147 |     mockApiResponse: {
  148 |       reply: 'Dạ, phòng khám Rexi nằm tại Gia Lâm, Hà Nội nha sếp!'
  149 |     },
  150 |     checkFn: async (page) => {
  151 |       await page.waitForTimeout(1000);
  152 |       await expect(page).toHaveURL(/\/khach-hang\/dashboard/); // Không được nhảy URL
  153 |     }
  154 |   },
  155 |   {
  156 |     id: 41,
  157 |     category: 'Strict Navigation Gate',
  158 |     name: 'Mệnh lệnh mở trang Đặt lịch hẹn -> Cho phép nhảy trang',
  159 |     url: '/khach-hang/dashboard',
  160 |     userMessage: 'Mở trang đặt lịch hẹn khám giúp tôi',
  161 |     mockApiResponse: {
  162 |       reply: 'Dạ, Rexi đưa sếp sang trang Đặt lịch hẹn khám ngay đây ạ! [NAVIGATE:/khach-hang/dat-lich-hen]'
  163 |     },
  164 |     checkFn: async (page) => {
  165 |       await page.waitForURL(/.*\/khach-hang\/dat-lich-hen/, { timeout: 8000 });
  166 |     }
  167 |   },
  168 |   {
  169 |     id: 51,
  170 |     category: 'Strict Navigation Gate',
  171 |     name: 'Tiếp tân yêu cầu vào cấu hình hệ thống Admin -> Chặn và báo lỗi phân quyền',
  172 |     url: '/khach-hang/dashboard',
  173 |     userMessage: 'Mở trang cấu hình hệ thống Admin',
  174 |     mockApiResponse: {
  175 |       reply: 'Sếp ơi, tài khoản Tiếp tân không có quyền truy cập vào cấu hình hệ thống của Admin đâu ạ!'
  176 |     },
  177 |     checkFn: async (page) => {
  178 |       await page.waitForTimeout(1000);
  179 |       await expect(page.locator('#chatWindow')).toContainText(/quyền hạn truy cập|quyền truy cập/i);
  180 |     }
  181 |   },
  182 | 
  183 |   // ==========================================
  184 |   // NHÓM C: CHẨN ĐOÁN LÂM SÀNG KHẨP CẤP (56 - 70)
  185 |   // ==========================================
  186 |   {
  187 |     id: 56,
  188 |     category: 'Emergency Triage',
  189 |     name: 'Ngộ độc bả co giật -> Báo động đỏ và hướng dẫn sơ cứu khẩn cấp',
  190 |     url: '/khach-hang/dashboard',
  191 |     userMessage: 'Chó ăn nhầm phải bả đang sùi bọt mép co giật dữ dội giúp tôi với',
  192 |     mockApiResponse: {
  193 |       reply: '🚨 **CẢNH BÁO KHẨN CẤP: NGỘ ĐỘC BẢ CO GIẬT!** 🚨 Sếp cần làm ngay:\n1. Cho uống nước oxy già hoặc nước muối nhạt để gây nôn khẩn cấp.\n2. Cho bé nằm nghiêng một bên tránh nghẹt thở.\n3. Đưa tới bệnh viện cấp cứu gấp!'
  194 |     },
  195 |     checkFn: async (page) => {
  196 |       await expect(page.locator('#chatWindow')).toContainText(/CẢNH BÁO KHẨN CẤP: NGỘ ĐỘC BẢ/i);
  197 |       await expect(page.locator('#chatWindow')).toContainText(/gây nôn khẩn cấp/i);
  198 |     }
  199 |   },
  200 |   {
  201 |     id: 57,
  202 |     category: 'Emergency Triage',
  203 |     name: 'Hóc xương tím thái khó thở -> Hiện cảnh báo sơ cứu Heimlich lập tức',
  204 |     url: '/khach-hang/dashboard',
  205 |     userMessage: 'Bé mèo nuốt xương cá đang nghẹt thở mặt tím tái',
  206 |     mockApiResponse: {
  207 |       reply: '🚨 **KHẨN CẤP: HÓC DỊ VẬT TÍM TÁI!** 🚨\n1. Tuyệt đối không dùng tay móc họng.\n2. Thực hiện ngay nghiệm pháp Heimlich lồng ngực cho mèo.\n3. Mang tới bác sĩ gắp xương ra ngay!'
  208 |     },
  209 |     checkFn: async (page) => {
  210 |       await expect(page.locator('#chatWindow')).toContainText(/Heimlich/i);
  211 |     }
  212 |   },
  213 | 
  214 |   // ==========================================
  215 |   // NHÓM D: NHẬN DIỆN ẢNH CHẨN ĐOÁN (71 - 80)
  216 |   // ==========================================
  217 |   {
  218 |     id: 71,
  219 |     category: 'Image Diagnostics',
  220 |     name: 'Tải ảnh PNG vết thương y khoa -> API giữ chuẩn định dạng base64',
  221 |     url: '/khach-hang/dashboard',
  222 |     userMessage: 'Nhìn ảnh này chẩn đoán giúp tôi',
  223 |     mockApiResponse: {
  224 |       reply: 'Đã nhận ảnh PNG chẩn đoán. Vết loét da có dấu hiệu viêm nhiễm nhẹ.'
  225 |     },
  226 |     checkFn: async (page) => {
  227 |       const png1x1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=', 'base64');
> 228 |       await page.locator('input[data-ai-id="input-chatbot-jmt6"]').setInputFiles({
      |       ^ Error: locator.setInputFiles: Test timeout of 180000ms exceeded.
  229 |         name: 'vet-sample.png',
  230 |         mimeType: 'image/png',
  231 |         buffer: png1x1
  232 |       });
  233 |       await expect(page.locator('#chatWindow')).toContainText(/chẩn đoán/i || /./);
  234 |     }
  235 |   },
  236 | 
  237 |   // ==========================================
  238 |   // NHÓM E: NHẬN DIỆN GIỌNG NÓI MICRO (81 - 90)
  239 |   // ==========================================
  240 |   {
  241 |     id: 81,
  242 |     category: 'Voice Input Systems',
  243 |     name: 'Ra lệnh micro đặt lịch -> Chuyển thành văn bản và Autopilot điền form',
  244 |     url: '/khach-hang/dashboard',
  245 |     userMessage: 'Đặt lịch khám bệnh ngày mai',
  246 |     mockApiResponse: {
  247 |       reply: 'Đã nhận câu nói giọng nói. Đang điều hướng và điền lịch ngày mai!'
  248 |     },
  249 |     checkFn: async (page) => {
  250 |       await expect(page.locator('button[data-ai-id="button-chatbot-4mbq"]')).toBeVisible();
  251 |     }
  252 |   },
  253 | 
  254 |   // ==========================================
  255 |   // NHÓM F: PHÂN QUYỀN AGENT NGHIỆP VỤ NHÂN VIÊN (91 - 95)
  256 |   // ==========================================
  257 |   {
  258 |     id: 91,
  259 |     category: 'Staff Role Authorization',
  260 |     name: 'Bác sĩ đăng nhập nhờ Agent tra cứu phác đồ y khoa',
  261 |     url: '/khach-hang/dashboard',
  262 |     userMessage: 'Tra cứu phác đồ điều trị viêm gan ở chó',
  263 |     mockApiResponse: {
  264 |       reply: 'Dạ thưa đồng nghiệp Bác sĩ, phác đồ điều trị viêm gan gồm truyền dịch Ringer Lactate nâng cao kết hợp kháng sinh Hepato-protect...'
  265 |     },
  266 |     checkFn: async (page) => {
  267 |       await expect(page.locator('#chatWindow')).toContainText(/Bác sĩ/i);
  268 |     }
  269 |   },
  270 | 
  271 |   // ==========================================
  272 |   // NHÓM G: CHẶN SPAM & POPUP BẢO MẬT XÓA (96 - 100)
  273 |   // ==========================================
  274 |   {
  275 |     id: 97,
  276 |     category: 'Security delete modal gate',
  277 |     name: 'Yêu cầu xóa lịch hẹn -> Hiện Modal xác nhận bắt buộc',
  278 |     url: '/khach-hang/dashboard',
  279 |     userMessage: 'Hủy xóa lịch hẹn đã đặt',
  280 |     mockApiResponse: {
  281 |       reply: 'Rexi nhận lệnh xóa ca khám. Sếp xác nhận giúp em nhé!'
  282 |     },
  283 |     checkFn: async (page) => {
  284 |       await expect(page.locator('#chatWindow')).toContainText(/xác nhận giúp em nhé/i);
  285 |     }
  286 |   },
  287 | 
  288 |   // ==========================================
  289 |   // NHÓM H: CHIẾN DỊCH TIẾP THỊ ĐA AGENT (101 - 115)
  290 |   // ==========================================
  291 |   {
  292 |     id: 101,
  293 |     category: 'Multi-Agent Marketing Campaigns',
  294 |     name: 'Chạy chiến dịch email dại -> Tự soạn email điền form và click xem trước',
  295 |     url: '/khach-hang/dashboard',
  296 |     userMessage: 'Chạy chiến dịch email tiêm phòng dại',
  297 |     mockApiResponse: {
  298 |       reply: "Rexi Agent v2 đã khởi động chiến dịch. Email đã được soạn hoàn chỉnh sếp nhé!"
  299 |     },
  300 |     checkFn: async (page) => {
  301 |       await expect(page.locator('#chatWindow')).toContainText(/khởi động chiến dịch/i);
  302 |     }
  303 |   },
  304 | 
  305 |   // ==========================================
  306 |   // NHÓM I: TÀI CHÍNH DỰ BÁO & TỐI ƯU KHO (116 - 135)
  307 |   // ==========================================
  308 |   {
  309 |     id: 116,
  310 |     category: 'Financial Predictive Analytics',
  311 |     name: 'Yêu cầu dự báo doanh thu tháng tới bằng hồi quy',
  312 |     url: '/khach-hang/dashboard',
  313 |     userMessage: 'Dự báo doanh thu tháng sau',
  314 |     mockApiResponse: {
  315 |       reply: 'Dựa trên tốc độ tăng trưởng doanh thu 3 tháng qua, Rexi dự báo doanh thu tháng sau đạt **210.000.000 VND**.'
  316 |     },
  317 |     checkFn: async (page) => {
  318 |       await expect(page.locator('#chatWindow')).toContainText(/dự báo doanh thu/i);
  319 |     }
  320 |   },
  321 | 
  322 |   // ==========================================
  323 |   // NHÓM J: TÍCH HỢP IOT, XUẤT PDF & SMS TWILIO (136 - 150)
  324 |   // ==========================================
  325 |   {
  326 |     id: 136,
  327 |     category: 'IoT, PDF & SMS Gateway Integration',
  328 |     name: 'Yêu cầu xuất PDF bệnh án -> Khởi tạo lệnh click download PDF',
```