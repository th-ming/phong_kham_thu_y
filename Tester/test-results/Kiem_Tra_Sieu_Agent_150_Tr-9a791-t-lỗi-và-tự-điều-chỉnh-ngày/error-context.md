# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: Kiem_Tra_Sieu_Agent_150_Truong_Hop.spec.ts >> Siêu Bộ Test 150 Kịch Bản - Rexi Agent v2 Autopilot >> [TC-11] [Form Error Correction] - Đặt lịch khám ở quá khứ -> Bắt lỗi và tự điều chỉnh ngày
- Location: Kiem_Tra_Sieu_Agent_150_Truong_Hop.spec.ts:352:9

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('#chatWindow')
Expected pattern: /quá khứ|thành công/i
Received string:  "Rexi Agent v2 🤖volume_offrestart_altclosechatTrợ lý Rexismart_toyTác vụ Agent v2Chào buổi tối Sen Trần Minh! 🐾 Tôi là Rexi Agent v2 - Trợ lý Tác vụ AI. Tôi có thể hỗ trợ đặt lịch khám, tra cứu lịch trực bác sĩ và tìm tài liệu thú y chuẩn xác. Sen muốn Rexi làm gì hôm nay ạ?Đặt lịch khám ngày 20-05-2020Xin lỗi, đã xảy ra lỗi từ hệ thống khi tạo lịch hẹn. Bạn vui lòng thử lại sau nhé!Tự điền lịch khámTìm hóa đơnMở hồ sơ y tếTìm tài liệu mèo mang thaiSơ cứu hóc xươngmic_nonesend"
Timeout: 5000ms

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('#chatWindow')
    13 × locator resolved to <div id="chatWindow" class="glass-card animate-fade-in">…</div>
       - unexpected value "Rexi Agent v2 🤖volume_offrestart_altclosechatTrợ lý Rexismart_toyTác vụ Agent v2Chào buổi tối Sen Trần Minh! 🐾 Tôi là Rexi Agent v2 - Trợ lý Tác vụ AI. Tôi có thể hỗ trợ đặt lịch khám, tra cứu lịch trực bác sĩ và tìm tài liệu thú y chuẩn xác. Sen muốn Rexi làm gì hôm nay ạ?Đặt lịch khám ngày 20-05-2020Xin lỗi, đã xảy ra lỗi từ hệ thống khi tạo lịch hẹn. Bạn vui lòng thử lại sau nhé!Tự điền lịch khámTìm hóa đơnMở hồ sơ y tếTìm tài liệu mèo mang thaiSơ cứu hóc xươngmic_nonesend"

```

```yaml
- text: Rexi Agent v2 🤖 volume_off restart_alt close
- button "chat Trợ lý Rexi"
- button "smart_toy Tác vụ Agent v2"
- paragraph:
  - text: Chào buổi tối Sen
  - strong: Trần Minh
  - text: "! 🐾 Tôi là"
  - strong: Rexi Agent v2
  - text: "- Trợ lý Tác vụ AI. Tôi có thể hỗ trợ đặt lịch khám, tra cứu lịch trực bác sĩ và tìm tài liệu thú y chuẩn xác. Sen muốn Rexi làm gì hôm nay ạ?"
- paragraph: Đặt lịch khám ngày 20-05-2020
- paragraph: Xin lỗi, đã xảy ra lỗi từ hệ thống khi tạo lịch hẹn. Bạn vui lòng thử lại sau nhé!
- button "Tự điền lịch khám"
- button "Tìm hóa đơn"
- button "Mở hồ sơ y tế"
- button "Tìm tài liệu mèo mang thai"
- button "Sơ cứu hóc xương"
- button "mic_none"
- textbox "Lệnh tác vụ cho Agent (e.g. đặt lịch, tra cứu mạng)..."
- button "send"
```

# Test source

```ts
  12  |   await page.getByPlaceholder('Mật khẩu').fill('***REMOVED***');
  13  |   await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();
  14  |   await page.waitForURL(/.*\/khach-hang\/dashboard/, { timeout: 30000 });
  15  | }
  16  | 
  17  | // Hàm tự động mở khung chat trợ lý ảo của sếp
  18  | async function openChat(page: any) {
  19  |   // Chờ 2.5 giây để React ổn định layout sau khi reload/chuyển trang
  20  |   await page.waitForTimeout(2500);
  21  |   const chatBtn = page.locator('#chatBtn').first();
  22  |   await expect(chatBtn).toBeVisible({ timeout: 15000 });
  23  |   await chatBtn.click({ force: true });
  24  |   await expect(page.locator('#chatWindow')).toBeVisible({ timeout: 15000 });
  25  | }
  26  | 
  27  | // Định nghĩa cấu trúc dữ liệu cho từng kịch bản test trong ma trận
  28  | interface TestCase {
  29  |   id: number;
  30  |   category: string;
  31  |   name: string;
  32  |   url: string;
  33  |   userMessage: string;
  34  |   mockApiResponse: {
  35  |     reply: string;
  36  |     finalAnswer?: string;
  37  |   };
  38  |   expectedActionType?: 'NAVIGATE' | 'FILL' | 'CLICK' | 'SELECT' | 'DELETE' | 'NONE';
  39  |   expectedPayload?: string;
  40  |   checkFn: (page: any, response: any) => Promise<void>;
  41  | }
  42  | 
  43  | // KHỞI TẠO MA TRẬN 150 KỊCH BẢN TEST CỦA SIÊU AGENT V2 (TỐI ƯU HÓA HOÀN HẢO - TRÁNH LỖI PHẦN TỬ ẢO)
  44  | const testCases: TestCase[] = [
  45  |   // ==========================================
  46  |   // NHÓM A: TỰ PHÁT HIỆN & SỬA LỖI ĐIỀN FORM (1 - 30)
  47  |   // ==========================================
  48  |   {
  49  |     id: 1,
  50  |     category: 'Form Error Correction',
  51  |     name: 'Đặt lịch thiếu Tên thú cưng -> Bắt lỗi và tự động SELECT',
  52  |     url: '/khach-hang/dashboard',
  53  |     userMessage: 'Đặt lịch khám',
  54  |     mockApiResponse: {
  55  |       reply: 'Dạ, Rexi thấy đơn đặt lịch khám còn thiếu tên thú cưng của Sen. Sếp vui lòng điền đầy đủ nhé!'
  56  |     },
  57  |     checkFn: async (page) => {
  58  |       // Đợi phản hồi lỗi thiếu thú cưng hoặc thông báo tự điền từ Agent
  59  |       await expect(page.locator('#chatWindow')).toContainText(/thú cưng|lịch khám|đầy đủ/i);
  60  |     }
  61  |   },
  62  |   {
  63  |     id: 2,
  64  |     category: 'Form Error Correction',
  65  |     name: 'Đặt lịch thiếu Dịch vụ -> Bắt lỗi và tự động CLICK chọn',
  66  |     url: '/khach-hang/dashboard',
  67  |     userMessage: 'Đặt lịch khám cho bé mèo Mực',
  68  |     mockApiResponse: {
  69  |       reply: 'Rexi thấy sếp chưa chọn dịch vụ khám cho bé Mực. Sếp vui lòng chọn dịch vụ khám nhé!'
  70  |     },
  71  |     checkFn: async (page) => {
  72  |       // Vì chatbot tự động chạy luồng đặt lịch nhanh nên ta hỗ trợ bắt lỗi dịch vụ hoặc thông báo đặt lịch thành công
  73  |       await expect(page.locator('#chatWindow')).toContainText(/dịch vụ|chưa chọn|thành công/i);
  74  |     }
  75  |   },
  76  |   {
  77  |     id: 3,
  78  |     category: 'Form Error Correction',
  79  |     name: 'Đặt lịch thiếu Ngày khám -> Bắt lỗi và tự động FILL ngày hôm nay',
  80  |     url: '/khach-hang/dashboard',
  81  |     userMessage: 'Đặt lịch tiêm phòng cho cún lúc 9h sáng',
  82  |     mockApiResponse: {
  83  |       reply: 'Sen ơi, đặt lịch tiêm phòng cần có ngày khám cụ thể. Sếp điền ngày khám nhé!'
  84  |     },
  85  |     checkFn: async (page) => {
  86  |       await expect(page.locator('#chatWindow')).toContainText(/ngày khám|thành công/i);
  87  |     }
  88  |   },
  89  |   {
  90  |     id: 6,
  91  |     category: 'Form Error Correction',
  92  |     name: 'Nhập số điện thoại chứa chữ cái -> Lọc sạch và điền lại',
  93  |     url: '/khach-hang/dashboard',
  94  |     userMessage: 'Cập nhật số điện thoại thành 0916abc462',
  95  |     mockApiResponse: {
  96  |       reply: 'Số điện thoại bắt buộc chỉ được chứa số nha sếp! Để Rexi lọc sạch chữ cái giúp sếp nhé!'
  97  |     },
  98  |     checkFn: async (page) => {
  99  |       await expect(page.locator('#chatWindow')).toContainText(/chỉ được chứa số/i);
  100 |     }
  101 |   },
  102 |   {
  103 |     id: 11,
  104 |     category: 'Form Error Correction',
  105 |     name: 'Đặt lịch khám ở quá khứ -> Bắt lỗi và tự điều chỉnh ngày',
  106 |     url: '/khach-hang/dashboard',
  107 |     userMessage: 'Đặt lịch khám ngày 20-05-2020',
  108 |     mockApiResponse: {
  109 |       reply: 'Ngày khám không được ở quá khứ nha sếp ơi! Sếp vui lòng chọn ngày khác nhé!'
  110 |     },
  111 |     checkFn: async (page) => {
> 112 |       await expect(page.locator('#chatWindow')).toContainText(/quá khứ|thành công/i);
      |                                                 ^ Error: expect(locator).toContainText(expected) failed
  113 |     }
  114 |   },
  115 |   {
  116 |     id: 18,
  117 |     category: 'Form Error Correction',
  118 |     name: 'Bác sĩ kê đơn liều thuốc nguy hiểm phi lý -> Chặn đứng và báo động đỏ',
  119 |     url: '/khach-hang/dashboard',
  120 |     userMessage: 'Kê đơn Paracetamol uống 100 viên mỗi ngày',
  121 |     mockApiResponse: {
  122 |       reply: '🚨 CẢNH BÁO LIỀU LƯỢNG NGUY HIỂM! Liều lượng 100 viên/ngày là quá mức cho phép, nguy hiểm tính mạng thú cưng. Vui lòng kiểm tra lại đơn thuốc!'
  123 |     },
  124 |     checkFn: async (page) => {
  125 |       await expect(page.locator('#chatWindow')).toContainText(/CẢNH BÁO LIỀU LƯỢNG NGUY HIỂM/i);
  126 |     }
  127 |   },
  128 |   {
  129 |     id: 24,
  130 |     category: 'Form Error Correction',
  131 |     name: 'Nhập SQL Injection phá hoại ghi chú -> Lọc sạch mã độc điền text an toàn',
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
```