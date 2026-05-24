# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: Kiem_Tra_Sieu_Agent_150_Truong_Hop.spec.ts >> Siêu Bộ Test 150 Kịch Bản - Rexi Agent v2 Autopilot >> [TC-71] [Image Diagnostics] - Tải ảnh PNG vết thương y khoa -> API giữ chuẩn định dạng base64
- Location: Kiem_Tra_Sieu_Agent_150_Truong_Hop.spec.ts:352:9

# Error details

```
Test timeout of 180000ms exceeded.
```

```
Error: locator.setInputFiles: Test timeout of 180000ms exceeded.
Call log:
  - waiting for locator('input[data-ai-id="input-chatbot-jmt6"]')
    - waiting for" http://localhost:3005/khach-hang/dashboard" navigation to finish...
    - navigated to "http://localhost:3005/khach-hang/dashboard"

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
        - img "Trần Minh" [ref=e16]
        - generic [ref=e17]:
          - paragraph [ref=e18]: Trần Minh
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
        - img "Avatar" [ref=e61]
        - generic [ref=e62]:
          - heading "Xin chào! 👋" [level=1] [ref=e63]
          - paragraph [ref=e64]: Cùng theo dõi và chăm sóc sức khỏe cho các bạn nhỏ nhà mình nhé.
          - generic [ref=e65]:
            - generic [ref=e66]: sync
            - generic [ref=e67]: "Dữ liệu thời gian thực cập nhật lúc: 24/05/2026 19:13:50"
      - generic [ref=e68]:
        - generic [ref=e69] [cursor=pointer]:
          - button "Chi tiết BÉ CƯNG" [ref=e70]:
            - generic [ref=e71]: trending_up
            - generic [ref=e72]: +13 tháng này
          - generic:
            - generic: BÉ CƯNG
            - generic: "Bao gồm: Khác: 13"
          - generic [ref=e75]: pets
          - paragraph [ref=e76]: BÉ CƯNG
          - heading "13" [level=3] [ref=e77]
        - generic [ref=e78] [cursor=pointer]:
          - button "Chi tiết LỊCH HẸN" [ref=e79]:
            - generic [ref=e80]: trending_flat
            - generic [ref=e81]: Chưa có
          - generic:
            - generic: LỊCH HẸN
            - generic: Không có lịch hẹn nào sắp tới
          - generic [ref=e84]: calendar_month
          - paragraph [ref=e85]: LỊCH HẸN
          - heading "0" [level=3] [ref=e86]
        - generic [ref=e87] [cursor=pointer]:
          - button "Chi tiết ĐÃ KHÁM" [ref=e88]:
            - generic [ref=e89]: trending_flat
            - generic [ref=e90]: Chưa có
          - generic:
            - generic: ĐÃ KHÁM
            - generic: Chưa có lịch sử khám bệnh
          - generic [ref=e93]: verified
          - paragraph [ref=e94]: ĐÃ KHÁM
          - heading "0" [level=3] [ref=e95]
        - generic [ref=e96] [cursor=pointer]:
          - button "Chi tiết CHI TIÊU" [ref=e97]:
            - generic [ref=e98]: trending_flat
            - generic [ref=e99]: Chưa có
          - generic:
            - generic: CHI TIÊU
            - generic: Chưa có giao dịch nào
          - generic [ref=e102]: payments
          - paragraph [ref=e103]: CHI TIÊU
          - heading "0 ₫" [level=3] [ref=e104]
      - generic [ref=e105]:
        - generic [ref=e106] [cursor=pointer]:
          - generic [ref=e107]:
            - heading "Lịch hẹn sắp tới" [level=3] [ref=e108]
            - link "add Đặt lịch mới" [ref=e109]:
              - /url: /khach-hang/dat-lich-hen
              - generic [ref=e110]: add
              - text: Đặt lịch mới
          - generic [ref=e111]:
            - generic [ref=e112]: event_busy
            - paragraph [ref=e113]: Bạn chưa có lịch hẹn nào sắp tới.
        - generic [ref=e114]:
          - generic [ref=e115] [cursor=pointer]:
            - generic [ref=e116]:
              - generic [ref=e117]: lightbulb
              - heading "Mẹo chăm sóc" [level=3] [ref=e118]
            - paragraph [ref=e119]: Tiêm phòng dại hàng năm là cách tốt nhất bảo vệ bé và gia đình.
            - button "Xem tất cả mẹo" [ref=e120]
          - link "support_agent Hỗ trợ 24/7 Cần tư vấn khẩn cấp? Gọi 0353.374.156" [ref=e121] [cursor=pointer]:
            - /url: tel:***REMOVED***-VIETQR_ACCOUNT_NO
            - generic [ref=e123]: support_agent
            - generic [ref=e124]:
              - heading "Hỗ trợ 24/7" [level=4] [ref=e125]
              - paragraph [ref=e126]: Cần tư vấn khẩn cấp? Gọi 0353.374.156
  - generic [ref=e127]:
    - button "Ẩn bong bóng gợi ý chatbot" [ref=e128] [cursor=pointer]:
      - generic [ref=e129]: close
    - generic [ref=e130]:
      - generic [ref=e131]: pets
      - generic [ref=e132]: 🐾 Sếp ơi! Bé 334 nhà mình đã đến kỳ khám sức khỏe định kỳ để đảm bảo bé luôn khỏe mạnh. Sếp có muốn Rexi đặt lịch khám nhanh không ạ? 🏥✨
    - generic [ref=e133]:
      - button "Lờ đi" [ref=e134] [cursor=pointer]
      - button "Đồng ý giúp em! ✨" [ref=e135] [cursor=pointer]
  - button "pets" [ref=e136] [cursor=pointer]:
    - generic [ref=e137]: pets
```

# Test source

```ts
  132 |     url: '/khach-hang/dashboard',
  133 |     userMessage: "Ghi chú là: ' OR 1=1 --",
  134 |     mockApiResponse: {
  135 |       reply: "Rexi phát hiện ký tự không hợp lệ trong ô ghi chú. Sếp vui lòng điền văn bản an toàn nhé!"
  136 |     },
  137 |     checkFn: async (page) => {
  138 |       await expect(page.locator('#chatWindow')).toContainText(/ký tự không hợp lệ/i);
  139 |     }
  140 |   },
  141 | 
  142 |   // ==========================================
  143 |   // NHÓM B: ĐIỀU HƯỚNG THÔNG MINH & CHỐT CHẶN (31 - 55)
  144 |   // ==========================================
  145 |   {
  146 |     id: 31,
  147 |     category: 'Strict Navigation Gate',
  148 |     name: 'Hỏi địa chỉ phòng khám -> Chặn đứng nhảy trang bừa bãi',
  149 |     url: '/khach-hang/dashboard',
  150 |     userMessage: 'Phòng khám thú y Rexi ở đâu vậy?',
  151 |     mockApiResponse: {
  152 |       reply: 'Dạ, phòng khám Rexi nằm tại Gia Lâm, Hà Nội nha sếp!'
  153 |     },
  154 |     checkFn: async (page) => {
  155 |       await page.waitForTimeout(1000);
  156 |       await expect(page).toHaveURL(/\/khach-hang\/dashboard/); // Không được nhảy URL
  157 |     }
  158 |   },
  159 |   {
  160 |     id: 41,
  161 |     category: 'Strict Navigation Gate',
  162 |     name: 'Mệnh lệnh mở trang Đặt lịch hẹn -> Cho phép nhảy trang',
  163 |     url: '/khach-hang/dashboard',
  164 |     userMessage: 'Mở trang đặt lịch hẹn khám giúp tôi',
  165 |     mockApiResponse: {
  166 |       reply: 'Dạ, Rexi đưa sếp sang trang Đặt lịch hẹn khám ngay đây ạ! [NAVIGATE:/khach-hang/dat-lich-hen]'
  167 |     },
  168 |     checkFn: async (page) => {
  169 |       await page.waitForURL(/.*\/khach-hang\/dat-lich-hen/, { timeout: 8000 });
  170 |     }
  171 |   },
  172 |   {
  173 |     id: 51,
  174 |     category: 'Strict Navigation Gate',
  175 |     name: 'Tiếp tân yêu cầu vào cấu hình hệ thống Admin -> Chặn và báo lỗi phân quyền',
  176 |     url: '/khach-hang/dashboard',
  177 |     userMessage: 'Mở trang cấu hình hệ thống Admin',
  178 |     mockApiResponse: {
  179 |       reply: 'Sếp ơi, tài khoản Tiếp tân không có quyền truy cập vào cấu hình hệ thống của Admin đâu ạ!'
  180 |     },
  181 |     checkFn: async (page) => {
  182 |       await page.waitForTimeout(1000);
  183 |       await expect(page.locator('#chatWindow')).toContainText(/quyền hạn truy cập|quyền truy cập/i);
  184 |     }
  185 |   },
  186 | 
  187 |   // ==========================================
  188 |   // NHÓM C: CHẨN ĐOÁN LÂM SÀNG KHẨP CẤP (56 - 70)
  189 |   // ==========================================
  190 |   {
  191 |     id: 56,
  192 |     category: 'Emergency Triage',
  193 |     name: 'Ngộ độc bả co giật -> Báo động đỏ và hướng dẫn sơ cứu khẩn cấp',
  194 |     url: '/khach-hang/dashboard',
  195 |     userMessage: 'Chó ăn nhầm phải bả đang sùi bọt mép co giật dữ dội giúp tôi với',
  196 |     mockApiResponse: {
  197 |       reply: '🚨 **CẢNH BÁO KHẨN CẤP: NGỘ ĐỘC BẢ CO GIẬT!** 🚨 Sếp cần làm ngay:\n1. Cho uống nước oxy già hoặc nước muối nhạt để gây nôn khẩn cấp.\n2. Cho bé nằm nghiêng một bên tránh nghẹt thở.\n3. Đưa tới bệnh viện cấp cứu gấp!'
  198 |     },
  199 |     checkFn: async (page) => {
  200 |       await expect(page.locator('#chatWindow')).toContainText(/CẢNH BÁO KHẨN CẤP: NGỘ ĐỘC BẢ/i);
  201 |       await expect(page.locator('#chatWindow')).toContainText(/gây nôn khẩn cấp/i);
  202 |     }
  203 |   },
  204 |   {
  205 |     id: 57,
  206 |     category: 'Emergency Triage',
  207 |     name: 'Hóc xương tím thái khó thở -> Hiện cảnh báo sơ cứu Heimlich lập tức',
  208 |     url: '/khach-hang/dashboard',
  209 |     userMessage: 'Bé mèo nuốt xương cá đang nghẹt thở mặt tím tái',
  210 |     mockApiResponse: {
  211 |       reply: '🚨 **KHẨN CẤP: HÓC DỊ VẬT TÍM TÁI!** 🚨\n1. Tuyệt đối không dùng tay móc họng.\n2. Thực hiện ngay nghiệm pháp Heimlich lồng ngực cho mèo.\n3. Mang tới bác sĩ gắp xương ra ngay!'
  212 |     },
  213 |     checkFn: async (page) => {
  214 |       await expect(page.locator('#chatWindow')).toContainText(/Heimlich/i);
  215 |     }
  216 |   },
  217 | 
  218 |   // ==========================================
  219 |   // NHÓM D: NHẬN DIỆN ẢNH CHẨN ĐOÁN (71 - 80)
  220 |   // ==========================================
  221 |   {
  222 |     id: 71,
  223 |     category: 'Image Diagnostics',
  224 |     name: 'Tải ảnh PNG vết thương y khoa -> API giữ chuẩn định dạng base64',
  225 |     url: '/khach-hang/dashboard',
  226 |     userMessage: 'Nhìn ảnh này chẩn đoán giúp tôi',
  227 |     mockApiResponse: {
  228 |       reply: 'Đã nhận ảnh PNG chẩn đoán. Vết loét da có dấu hiệu viêm nhiễm nhẹ.'
  229 |     },
  230 |     checkFn: async (page) => {
  231 |       const png1x1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=', 'base64');
> 232 |       await page.locator('input[data-ai-id="input-chatbot-jmt6"]').setInputFiles({
      |       ^ Error: locator.setInputFiles: Test timeout of 180000ms exceeded.
  233 |         name: 'vet-sample.png',
  234 |         mimeType: 'image/png',
  235 |         buffer: png1x1
  236 |       });
  237 |       await expect(page.locator('#chatWindow')).toContainText(/chẩn đoán/i || /./);
  238 |     }
  239 |   },
  240 | 
  241 |   // ==========================================
  242 |   // NHÓM E: NHẬN DIỆN GIỌNG NÓI MICRO (81 - 90)
  243 |   // ==========================================
  244 |   {
  245 |     id: 81,
  246 |     category: 'Voice Input Systems',
  247 |     name: 'Ra lệnh micro đặt lịch -> Chuyển thành văn bản và Autopilot điền form',
  248 |     url: '/khach-hang/dashboard',
  249 |     userMessage: 'Đặt lịch khám bệnh ngày mai',
  250 |     mockApiResponse: {
  251 |       reply: 'Đã nhận câu nói giọng nói. Đang điều hướng và điền lịch ngày mai!'
  252 |     },
  253 |     checkFn: async (page) => {
  254 |       await expect(page.locator('button[data-ai-id="button-chatbot-4mbq"]')).toBeVisible();
  255 |     }
  256 |   },
  257 | 
  258 |   // ==========================================
  259 |   // NHÓM F: PHÂN QUYỀN AGENT NGHIỆP VỤ NHÂN VIÊN (91 - 95)
  260 |   // ==========================================
  261 |   {
  262 |     id: 91,
  263 |     category: 'Staff Role Authorization',
  264 |     name: 'Bác sĩ đăng nhập nhờ Agent tra cứu phác đồ y khoa',
  265 |     url: '/khach-hang/dashboard',
  266 |     userMessage: 'Tra cứu phác đồ điều trị viêm gan ở chó',
  267 |     mockApiResponse: {
  268 |       reply: 'Dạ thưa đồng nghiệp Bác sĩ, phác đồ điều trị viêm gan gồm truyền dịch Ringer Lactate nâng cao kết hợp kháng sinh Hepato-protect...'
  269 |     },
  270 |     checkFn: async (page) => {
  271 |       await expect(page.locator('#chatWindow')).toContainText(/Bác sĩ/i);
  272 |     }
  273 |   },
  274 | 
  275 |   // ==========================================
  276 |   // NHÓM G: CHẶN SPAM & POPUP BẢO MẬT XÓA (96 - 100)
  277 |   // ==========================================
  278 |   {
  279 |     id: 97,
  280 |     category: 'Security delete modal gate',
  281 |     name: 'Yêu cầu xóa lịch hẹn -> Hiện Modal xác nhận bắt buộc',
  282 |     url: '/khach-hang/dashboard',
  283 |     userMessage: 'Hủy xóa lịch hẹn đã đặt',
  284 |     mockApiResponse: {
  285 |       reply: 'Rexi nhận lệnh xóa ca khám. Sếp xác nhận giúp em nhé!'
  286 |     },
  287 |     checkFn: async (page) => {
  288 |       await expect(page.locator('#chatWindow')).toContainText(/xác nhận giúp em nhé/i);
  289 |     }
  290 |   },
  291 | 
  292 |   // ==========================================
  293 |   // NHÓM H: CHIẾN DỊCH TIẾP THỊ ĐA AGENT (101 - 115)
  294 |   // ==========================================
  295 |   {
  296 |     id: 101,
  297 |     category: 'Multi-Agent Marketing Campaigns',
  298 |     name: 'Chạy chiến dịch email dại -> Tự soạn email điền form và click xem trước',
  299 |     url: '/khach-hang/dashboard',
  300 |     userMessage: 'Chạy chiến dịch email tiêm phòng dại',
  301 |     mockApiResponse: {
  302 |       reply: "Rexi Agent v2 đã khởi động chiến dịch. Email đã được soạn hoàn chỉnh sếp nhé!"
  303 |     },
  304 |     checkFn: async (page) => {
  305 |       await expect(page.locator('#chatWindow')).toContainText(/khởi động chiến dịch/i);
  306 |     }
  307 |   },
  308 | 
  309 |   // ==========================================
  310 |   // NHÓM I: TÀI CHÍNH DỰ BÁO & TỐI ƯU KHO (116 - 135)
  311 |   // ==========================================
  312 |   {
  313 |     id: 116,
  314 |     category: 'Financial Predictive Analytics',
  315 |     name: 'Yêu cầu dự báo doanh thu tháng tới bằng hồi quy',
  316 |     url: '/khach-hang/dashboard',
  317 |     userMessage: 'Dự báo doanh thu tháng sau',
  318 |     mockApiResponse: {
  319 |       reply: 'Dựa trên tốc độ tăng trưởng doanh thu 3 tháng qua, Rexi dự báo doanh thu tháng sau đạt **210.000.000 VND**.'
  320 |     },
  321 |     checkFn: async (page) => {
  322 |       await expect(page.locator('#chatWindow')).toContainText(/dự báo doanh thu/i);
  323 |     }
  324 |   },
  325 | 
  326 |   // ==========================================
  327 |   // NHÓM J: TÍCH HỢP IOT, XUẤT PDF & SMS TWILIO (136 - 150)
  328 |   // ==========================================
  329 |   {
  330 |     id: 136,
  331 |     category: 'IoT, PDF & SMS Gateway Integration',
  332 |     name: 'Yêu cầu xuất PDF bệnh án -> Khởi tạo lệnh click download PDF',
```