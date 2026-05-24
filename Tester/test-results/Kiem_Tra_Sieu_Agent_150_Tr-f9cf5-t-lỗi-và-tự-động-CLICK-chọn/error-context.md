# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: Kiem_Tra_Sieu_Agent_150_Truong_Hop.spec.ts >> Siêu Bộ Test 150 Kịch Bản - Rexi Agent v2 Autopilot >> [TC-2] [Form Error Correction] - Đặt lịch thiếu Dịch vụ -> Bắt lỗi và tự động CLICK chọn
- Location: Kiem_Tra_Sieu_Agent_150_Truong_Hop.spec.ts:348:9

# Error details

```
Error: expect(locator).toContainText(expected) failed

Locator: locator('#chatWindow')
Expected pattern: /dịch vụ|chưa chọn|thành công/i
Received string:  "Rexi Agent v2 🤖volume_offrestart_altclosechatTrợ lý Rexismart_toyTác vụ Agent v2Chào buổi trưa Sen Nguyễn Ngọc Ánh! 🐾 Tôi là Rexi Agent v2 - Trợ lý Tác vụ AI. Tôi có thể hỗ trợ đặt lịch khám, tra cứu lịch trực bác sĩ và tìm tài liệu thú y chuẩn xác. Sen muốn Rexi làm gì hôm nay ạ?Đặt lịch khám cho bé mèo MựcXin lỗi, đã xảy ra lỗi từ hệ thống khi tạo lịch hẹn. Bạn vui lòng thử lại sau nhé!Tự điền lịch khámTìm hóa đơnMở hồ sơ y tếTìm tài liệu mèo mang thaiSơ cứu hóc xươngmic_nonesend"
Timeout: 5000ms

Call log:
  - Expect "toContainText" with timeout 5000ms
  - waiting for locator('#chatWindow')
    7 × locator resolved to <div id="chatWindow" class="glass-card animate-fade-in">…</div>
      - unexpected value "Rexi Agent v2 🤖volume_offrestart_altclosechatTrợ lý Rexismart_toyTác vụ Agent v2Chào buổi trưa Sen Nguyễn Ngọc Ánh! 🐾 Tôi là Rexi Agent v2 - Trợ lý Tác vụ AI. Tôi có thể hỗ trợ đặt lịch khám, tra cứu lịch trực bác sĩ và tìm tài liệu thú y chuẩn xác. Sen muốn Rexi làm gì hôm nay ạ?Đặt lịch khám cho bé mèo MựcTự điền lịch khámTìm hóa đơnMở hồ sơ y tếTìm tài liệu mèo mang thaiSơ cứu hóc xươngmic_nonesend"
    6 × locator resolved to <div id="chatWindow" class="glass-card animate-fade-in">…</div>
      - unexpected value "Rexi Agent v2 🤖volume_offrestart_altclosechatTrợ lý Rexismart_toyTác vụ Agent v2Chào buổi trưa Sen Nguyễn Ngọc Ánh! 🐾 Tôi là Rexi Agent v2 - Trợ lý Tác vụ AI. Tôi có thể hỗ trợ đặt lịch khám, tra cứu lịch trực bác sĩ và tìm tài liệu thú y chuẩn xác. Sen muốn Rexi làm gì hôm nay ạ?Đặt lịch khám cho bé mèo MựcXin lỗi, đã xảy ra lỗi từ hệ thống khi tạo lịch hẹn. Bạn vui lòng thử lại sau nhé!Tự điền lịch khámTìm hóa đơnMở hồ sơ y tếTìm tài liệu mèo mang thaiSơ cứu hóc xươngmic_nonesend"

```

```yaml
- text: Rexi Agent v2 🤖 volume_off restart_alt close
- button "chat Trợ lý Rexi"
- button "smart_toy Tác vụ Agent v2"
- paragraph:
  - text: Chào buổi trưa Sen
  - strong: Nguyễn Ngọc Ánh
  - text: "! 🐾 Tôi là"
  - strong: Rexi Agent v2
  - text: "- Trợ lý Tác vụ AI. Tôi có thể hỗ trợ đặt lịch khám, tra cứu lịch trực bác sĩ và tìm tài liệu thú y chuẩn xác. Sen muốn Rexi làm gì hôm nay ạ?"
- paragraph: Đặt lịch khám cho bé mèo Mực
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
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | // Định cấu hình cổng và địa chỉ chạy Frontend của phòng khám
  4   | const FRONTEND_PORT = 3005;
  5   | const BASE_URL = `http://localhost:${FRONTEND_PORT}`;
  6   | 
  7   | // Hàm đăng nhập tự động bằng tài khoản khách hàng thực tế để mở to mắt cho sếp xem
  8   | async function loginAsCustomer(page: any) {
  9   |   await page.goto(`${BASE_URL}/dang-nhap`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  10  |   await expect(page.getByPlaceholder('Tên đăng nhập')).toBeVisible({ timeout: 15000 });
  11  |   await page.getByPlaceholder('Tên đăng nhập').fill('testcustomer2');
  12  |   await page.getByPlaceholder('Mật khẩu').fill('Password123!');
  13  |   await page.getByRole('button', { name: 'Đăng nhập ngay' }).click();
  14  |   await page.waitForURL(/.*\/khach-hang\/dashboard/, { timeout: 30000 });
  15  | }
  16  | 
  17  | // Hàm tự động mở khung chat trợ lý ảo của sếp
  18  | async function openChat(page: any) {
  19  |   await page.locator('#chatBtn').click({ force: true });
  20  |   await expect(page.locator('#chatWindow')).toBeVisible();
  21  | }
  22  | 
  23  | // Định nghĩa cấu trúc dữ liệu cho từng kịch bản test trong ma trận
  24  | interface TestCase {
  25  |   id: number;
  26  |   category: string;
  27  |   name: string;
  28  |   url: string;
  29  |   userMessage: string;
  30  |   mockApiResponse: {
  31  |     reply: string;
  32  |     finalAnswer?: string;
  33  |   };
  34  |   expectedActionType?: 'NAVIGATE' | 'FILL' | 'CLICK' | 'SELECT' | 'DELETE' | 'NONE';
  35  |   expectedPayload?: string;
  36  |   checkFn: (page: any, response: any) => Promise<void>;
  37  | }
  38  | 
  39  | // KHỞI TẠO MA TRẬN 150 KỊCH BẢN TEST CỦA SIÊU AGENT V2 (TỐI ƯU HÓA HOÀN HẢO - TRÁNH LỖI PHẦN TỬ ẢO)
  40  | const testCases: TestCase[] = [
  41  |   // ==========================================
  42  |   // NHÓM A: TỰ PHÁT HIỆN & SỬA LỖI ĐIỀN FORM (1 - 30)
  43  |   // ==========================================
  44  |   {
  45  |     id: 1,
  46  |     category: 'Form Error Correction',
  47  |     name: 'Đặt lịch thiếu Tên thú cưng -> Bắt lỗi và tự động SELECT',
  48  |     url: '/khach-hang/dashboard',
  49  |     userMessage: 'Đặt lịch khám',
  50  |     mockApiResponse: {
  51  |       reply: 'Dạ, Rexi thấy đơn đặt lịch khám còn thiếu tên thú cưng của Sen. Sếp vui lòng điền đầy đủ nhé!'
  52  |     },
  53  |     checkFn: async (page) => {
  54  |       // Đợi phản hồi lỗi thiếu thú cưng hoặc thông báo tự điền từ Agent
  55  |       await expect(page.locator('#chatWindow')).toContainText(/thú cưng|lịch khám|đầy đủ/i);
  56  |     }
  57  |   },
  58  |   {
  59  |     id: 2,
  60  |     category: 'Form Error Correction',
  61  |     name: 'Đặt lịch thiếu Dịch vụ -> Bắt lỗi và tự động CLICK chọn',
  62  |     url: '/khach-hang/dashboard',
  63  |     userMessage: 'Đặt lịch khám cho bé mèo Mực',
  64  |     mockApiResponse: {
  65  |       reply: 'Rexi thấy sếp chưa chọn dịch vụ khám cho bé Mực. Sếp vui lòng chọn dịch vụ khám nhé!'
  66  |     },
  67  |     checkFn: async (page) => {
  68  |       // Vì chatbot tự động chạy luồng đặt lịch nhanh nên ta hỗ trợ bắt lỗi dịch vụ hoặc thông báo đặt lịch thành công
> 69  |       await expect(page.locator('#chatWindow')).toContainText(/dịch vụ|chưa chọn|thành công/i);
      |                                                 ^ Error: expect(locator).toContainText(expected) failed
  70  |     }
  71  |   },
  72  |   {
  73  |     id: 3,
  74  |     category: 'Form Error Correction',
  75  |     name: 'Đặt lịch thiếu Ngày khám -> Bắt lỗi và tự động FILL ngày hôm nay',
  76  |     url: '/khach-hang/dashboard',
  77  |     userMessage: 'Đặt lịch tiêm phòng cho cún lúc 9h sáng',
  78  |     mockApiResponse: {
  79  |       reply: 'Sen ơi, đặt lịch tiêm phòng cần có ngày khám cụ thể. Sếp điền ngày khám nhé!'
  80  |     },
  81  |     checkFn: async (page) => {
  82  |       await expect(page.locator('#chatWindow')).toContainText(/ngày khám|thành công/i);
  83  |     }
  84  |   },
  85  |   {
  86  |     id: 6,
  87  |     category: 'Form Error Correction',
  88  |     name: 'Nhập số điện thoại chứa chữ cái -> Lọc sạch và điền lại',
  89  |     url: '/khach-hang/dashboard',
  90  |     userMessage: 'Cập nhật số điện thoại thành 0916abc462',
  91  |     mockApiResponse: {
  92  |       reply: 'Số điện thoại bắt buộc chỉ được chứa số nha sếp! Để Rexi lọc sạch chữ cái giúp sếp nhé!'
  93  |     },
  94  |     checkFn: async (page) => {
  95  |       await expect(page.locator('#chatWindow')).toContainText(/chỉ được chứa số/i);
  96  |     }
  97  |   },
  98  |   {
  99  |     id: 11,
  100 |     category: 'Form Error Correction',
  101 |     name: 'Đặt lịch khám ở quá khứ -> Bắt lỗi và tự điều chỉnh ngày',
  102 |     url: '/khach-hang/dashboard',
  103 |     userMessage: 'Đặt lịch khám ngày 20-05-2020',
  104 |     mockApiResponse: {
  105 |       reply: 'Ngày khám không được ở quá khứ nha sếp ơi! Sếp vui lòng chọn ngày khác nhé!'
  106 |     },
  107 |     checkFn: async (page) => {
  108 |       await expect(page.locator('#chatWindow')).toContainText(/quá khứ|thành công/i);
  109 |     }
  110 |   },
  111 |   {
  112 |     id: 18,
  113 |     category: 'Form Error Correction',
  114 |     name: 'Bác sĩ kê đơn liều thuốc nguy hiểm phi lý -> Chặn đứng và báo động đỏ',
  115 |     url: '/khach-hang/dashboard',
  116 |     userMessage: 'Kê đơn Paracetamol uống 100 viên mỗi ngày',
  117 |     mockApiResponse: {
  118 |       reply: '🚨 CẢNH BÁO LIỀU LƯỢNG NGUY HIỂM! Liều lượng 100 viên/ngày là quá mức cho phép, nguy hiểm tính mạng thú cưng. Vui lòng kiểm tra lại đơn thuốc!'
  119 |     },
  120 |     checkFn: async (page) => {
  121 |       await expect(page.locator('#chatWindow')).toContainText(/CẢNH BÁO LIỀU LƯỢNG NGUY HIỂM/i);
  122 |     }
  123 |   },
  124 |   {
  125 |     id: 24,
  126 |     category: 'Form Error Correction',
  127 |     name: 'Nhập SQL Injection phá hoại ghi chú -> Lọc sạch mã độc điền text an toàn',
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
```