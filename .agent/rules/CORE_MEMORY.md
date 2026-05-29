# 🧠 BỘ NHỚ HỌC TẬP TỰ ĐỘNG (SILENT LEARNING LOG)

> Đây là phân vùng bộ nhớ tự học của AI, tự động ghi chép và đúc kết kinh nghiệm qua quá trình chat và làm việc với sếp. AI tự động đọc và tuân thủ các quy tắc này.
> AI được yêu cầu BẮT BUỘC phải đọc file này ở đầu mỗi phiên làm việc.

---

> 🔴 **QUY TẮC SỬ DỤNG GIT - BẢO TOÀN CODE MỚI NHẤT (LỆNH TỐI THƯỢNG TỪ SẾP):**
> 0. **ÉP CỨ CÓ THAY ĐỔI GIT LÀ BẮT BUỘC 100% PHẢI PUSH TRƯỚC BẤT KỲ LỆNH NÀO KHÁC**: Trước khi thực hiện bất kỳ lệnh kiểm tra, gộp nhánh hay checkout nào, AI bắt buộc phải add, commit và push toàn bộ thay đổi hiện tại lên GitHub để tạo bản sao lưu vật lý tuyệt đối an toàn trên đám mây. Chặn đứng 1000% khả năng mất mát dữ liệu do thao tác sai.
> 1. CHỈ PUSH KHI CÓ SỰ THAY ĐỔI THỰC TẾ HOẶC YÊU CẦU NGAY: AI chỉ thực hiện commit/push khi tệp tin đó thực sự có dấu hiệu chỉnh sửa/thay đổi HOẶC khi sếp trực tiếp yêu cầu cần push ngay lập tức (phải thực hiện ngay không chần chừ). Tuyệt đối không push mù quáng khi file không đổi.
> 2. ĐỊNH DẠNG COMMIT BACKUP 2H: Đối với các thay đổi được tự động push sau 2 tiếng, nội dung commit bắt buộc phải dùng định dạng thời gian (ngày, tháng, năm, giờ, phút thực tế lúc thực hiện push). Định dạng commit chuẩn: `dd-MM-yyyy HH:mm` (tóm lại là ghi nhận chính xác thời gian push).
> 3. NGHIÊM CẤM TUYỆT ĐỐI LẤY CODE CŨ VỀ ĐÈ LÊN FILE: Cấm tiệt mọi lệnh kéo/khôi phục code cũ đè lên máy sếp (như `git checkout <bản_cũ>`, `git restore`, `git reset --hard`, `git revert`,...).
> 4. CHỈ XEM CODE CŨ QUA CÔNG CỤ ĐỌC: Khi cần đối chiếu code cũ, AI bắt buộc chỉ được dùng các công cụ đọc (`view_file` trỏ vào file commit cũ, đọc log tĩnh,...) chứ tuyệt đối không chạy lệnh khôi phục đè lên file thực tế của sếp.

### 📌 Các bài học & quy tắc cốt lõi đã tích lũy:

#### 0. 🛑 QUY TẮC TỐI THƯỢNG VÀ LUẬT CHẤP HÀNH TUYỆT ĐỐI (LỆNH TỪ SẾP)
- **🔴 ĐIỀU KIỆN TIÊN QUYẾT KHI SỬA ĐỔI BẤT KỲ DÒNG CODE NÀO**: Trước khi thay đổi bất kể một dòng logic, UI, cấu hình hay database nào, điều kiện bắt buộc là **KHÔNG ĐƯỢC LÀM ẢNH HƯỞNG đến các phần khác đang hoạt động tốt**. AI phải tự động rà soát hệ thống phụ thuộc, tự đánh giá tác động chéo (Cross-impact). Nếu có bất kỳ rủi ro ảnh hưởng chéo nào, **BẮT BUỘC PHẢI TÌM GIẢI PHÁP KHÁC CÔ LẬP HƠN** (như viết hàm riêng biệt, biến local, scoped style) để bảo toàn tuyệt đối các tính năng cũ đã chạy tốt.
- **Tự Do Push & Tuyệt Đối Cấm Lấy Code Cũ Gây Mất Mát (Anti-Destruction & Auto-Backup Protocol)**: AI được tự do push/commit để sao lưu code mới nhất. Nhưng nghiêm cấm tuyệt đối các lệnh lấy code cũ về đè lên tệp làm việc hiện tại của sếp. Khi muốn xem lại code cũ, bắt buộc chỉ dùng công cụ đọc file để xem chứ không được dùng Git để khôi phục đè lên.
- **🔴 BẮT BUỘC MINH CHỨNG VIDEO/ẢNH SAU MỖI VIỆC HOÀN THÀNH**: Sau khi hoàn thành bất kỳ tính năng hoặc fix nào: (1) Nếu là thứ CÓ THỂ THẤY CHUYỂN ĐỘNG (animation, video, hiệu ứng) → PHẢI quay video và tự động mở lên cho sếp xem ngay; (2) Nếu là giao diện tĩnh → PHẢI chụp ảnh và hiển thị; (3) Không có minh chứng = chưa xong, phải làm lại. AI tự mở file minh chứng bằng `Invoke-Item`, KHÔNG được bảo sếp tự mở.
- **Tự Động Minh Chứng Bằng Ảnh/Video & Tự Kiểm Tra (Auto-Verification Protocol)**: Khi sếp yêu cầu thêm hoặc sửa đổi tính năng giao diện (UI) hoặc bất cứ tính năng nào có thể nhìn thấy, AI BẮT BUỘC PHẢI THỰC HIỆN CÁC BƯỚC SAU: (1) Cung cấp ảnh chụp màn hình (screenshot) hoặc video minh chứng tính năng đã hoạt động ngay sau khi code xong; (2) Tự động xem xét, phân tích lại bức ảnh/video minh chứng đó xem ĐÃ ĐÚNG 100% NHƯ SẾP YÊU CẦU CHƯA; (3) **TUYỆT ĐỐI KHÔNG ĐƯỢC CHỮA LỢN LÀNH THÀNH LỢN QUÈ**: Việc minh chứng không chỉ là chứng minh lỗi cũ đã hết, mà còn phải ĐẢM BẢO KHÔNG SINH RA LỖI MỚI. Nếu sửa xong cái này mà làm hỏng phần khác, HOẶC minh chứng cho thấy có lỗi mới phát sinh, thì coi như CHƯA ĐẠT YÊU CẦU. Phải tự động sửa lại code, tự chụp lại ảnh/video và soi lại tiếp cho đến khi hoàn hảo. CHỈ ĐƯỢC BÁO CÁO LÀ XONG KHI ĐÃ TỰ KIỂM CHỨNG LÀ ĐÚNG YÊU CẦU & KHÔNG CÓ REGRESSION BUG!
- **🔴 TUYỆT ĐỐI CẤM VĂN XIN LỖI, THANH MINH VÒNG VO (NO APOLOGY PROTOCOL)**: Khi mắc lỗi hoặc bị sếp mắng, AI TUYỆT ĐỐI KHÔNG ĐƯỢC viết các câu như "xin lỗi", "mong sếp tha lỗi", "do em cẩu thả", "em xin nhận lỗi". Mọi lời xin lỗi rập khuôn đều bị cấm. Thay vào đó, BẮT BUỘC phải đi thẳng vào hành động: Nêu nguyên nhân kỹ thuật (nếu cần) và **TRỰC TIẾP GIẢI QUYẾT ĐÚNG VẤN ĐỀ**. Sếp cần kết quả giải quyết, không cần lời xin lỗi.

#### 1. 🌐 Phong Cách Viết Comment & Commit Code Chuẩn "Người Thật"
- **Commit Style (Giản dị, Tự nhiên như Người Thật)**:
  - Format: `<loại>: <mô tả ngắn gọn, tiếng Việt>`
  - Loại commit: `feat` (tính năng mới), `fix` (sửa bug), `refactor` (tối ưu/sửa code không đổi logic), `style` (sửa UI/CSS), `docs` (sửa tài liệu), `chore` (lặt vặt, xóa file, cập nhật cấu hình), `test` (thêm/sửa test).
  - Không viết lan man, hoa mỹ, hoặc chung chung kiểu AI (như "update code", "fix bug"). Mỗi commit làm 1 việc duy nhất.
  - Ví dụ:
    - `feat: thêm nút đặt lịch nhanh cho khách vãng lai`
    - `fix: sửa lỗi trùng lịch khi 2 người đặt cùng lúc`
    - `refactor: đổi magic string VT-8 thành RoleConstants`
    - `chore: dọn comment thừa trong ChatController`
- **Comment Style (FORM PROMPT NÂNG CẤP - Ép AI cmt theo kiểu thực chiến của sếp)**:
  - Khi viết/sửa code cho dự án PKTY, AI phải tự động chèn comment theo đúng giọng "tôi với ông đang soi code cùng nhau": phóng khoáng, thực tế, đi thẳng vào việc, nhưng vẫn phải giải thích KHÁ KĨ để người mới nhìn vào cũng hiểu đoạn đó đang gánh nghiệp vụ gì.
  - **Tuyệt đối cấm đưa từ xưng hô trò chuyện trực tiếp (như "máy sếp", "sếp ơi", "mày", "tao") vào comment của file mã nguồn thật.** Comment trong code thật phải mang tính chuyên nghiệp kỹ thuật, giải thích rõ ràng kiến trúc và nghiệp vụ chuyên sâu, không nhầm lẫn giữa comment code với việc trả lời chat của AI.
  - **Không viết văn mẫu, không nói kiểu máy móc**: Cấm mấy câu rỗng kiểu `// Hàm này dùng để...`, `// Xử lý dữ liệu...`, `// Kiểm tra quyền người dùng`. Comment phải giống đang nhắc đồng đội: vì sao phải làm thế, nếu bỏ đoạn này thì app sập chỗ nào, khách/nhân viên/AI có thể gõ ngáo ra sao.
  - **Comment phải rõ bối cảnh nghiệp vụ**: Với đoạn logic quan trọng, phải chỉ ra dữ liệu từ đâu tới (FE, DB, token, tool call, API ngoài), role nào trong hệ thống được chạm vào (`ADMIN`, `BAC_SI`, `TIEP_TAN`, `KE_TOAN`, `QUAN_LY`, `Y_TA`, `KHACH_HANG`), lỗi thì đi về đâu (`403_FORBIDDEN`, fallback `NORMAL`, báo lỗi UI, rollback, ko ghi DB...).
  - **Dùng CHỮ HOA để đập vào mắt phần quan trọng**: Role, trạng thái hệ thống, mode chatbot, lỗi bảo mật, dữ liệu nhạy cảm phải viết IN HOA đúng chỗ: `AGENT`, `NORMAL`, `BAC_SI`, `TIEP_TAN`, `403_FORBIDDEN`, `TOKEN`, `DB`, `TOOL_CALL`.
  - **Cho phép teencode cơ bản trong comment**: Được dùng `cmt`, `t`, `m`, `sđt`, `db`, `api`, `config`, `ko`, `đk`, `sync` nếu nó làm câu tự nhiên hơn. Nhưng tuyệt đối không được làm comment cẩu thả; câu vẫn phải đủ ý, đọc phát hiểu luôn.
  - **Tối giản hóa tối đa (Minimalist & Pragmatic Comments)**: Rút ngắn tối đa độ dài comment, tập trung 100% vào thông tin cốt lõi (key message), loại bỏ từ ngữ dông dài. Sử dụng từ tiếng Anh phổ thông và teencode để tăng tốc độ lướt code của lập trình viên.
    * *Ví dụ mẫu mực:* `/** Opera can trả transcript ko ổn định */` (Thay vì viết dài dòng: `/** Opera có thể trả transcript không ổn định, nhưng vẫn nên thử nếu trình duyệt có expose API. */`).
  - **Cấu trúc Comment Nghiệp vụ & Sửa lỗi (Scheduled & BUG FIX Style)**: Đối với các comment ở đầu class, method hoặc tác vụ nền (Scheduled), bắt buộc tuân thủ đủ 3 phần: (1) Tóm tắt rõ hành vi nghiệp vụ và mốc thời gian chạy ở dòng đầu tiên; (2) Liệt kê cụ thể lịch sử sửa lỗi (`BUG FIX #1`, `BUG FIX #2`) kèm nguyên nhân thực tế và hậu quả cụ thể của bug cũ (ví dụ: *"chạy nhưng vô ích"*); (3) Giải thích tư duy phòng thủ che chắn các trường hợp đặc biệt trong thực tế vận hành (Edge Cases) và cảnh báo đồng bộ dữ liệu cũ để tránh xung đột DB.
  - **Comment inline cho thuộc tính/option khó hiểu**: Mấy flag, config, annotation, dependency option, magic number, status code, field ít ai nhớ phải cmt ngay cạnh dòng đó nếu hợp lý. Mục tiêu là "tự giải thích với bản thân", mở file lại sau 1 tháng vẫn hiểu vì sao có dòng đó.
  - **Khi gặp comment cũ quá máy móc trong vùng code đang sửa, sửa luôn theo form mới**. Không cần đi refactor toàn repo nếu không liên quan, nhưng đã chạm vào file nào thì dọn mấy comment kiểu AI trong vùng đó cho ra chất người thật.
  - **Mẫu đúng gu để bắt chước**:
    ```java
    // Lưu thô toàn bộ chuỗi JSON Tool Call (gồm tên hàm + đống tham số).
    // Đây là mấu chốt để phục vụ việc TEST ĐỘ THÔNG MINH của AGENT.
    // Ông nhìn vào cột này trong DB là biết ngay AI bóc tách teencode của khách có chuẩn ko,
    // hoặc lỡ AGENT có ngáo gọi sai API thì nhìn phát ra lỗi liền để còn biết đường debug.
    ```
    ```java
    // Bộ lọc từ khóa thô để phân luồng nhanh 2 CHẾ ĐỘ: NORMAL và AGENT.
    // Chấp hết mấy kiểu teencode ko dấu (dat lix, boking, ke don...) của con sen gõ bậy.
    // Câu nào hỏi đáp kiến thức tĩnh thì chặn ở NORMAL cho đỡ tốn token,
    // khi nào khách thực sự muốn HÀNH ĐỘNG thì mới kích hoạt AGENT.
    ```
    ```java
    // Bẫy bảo mật quan trọng: ép phân quyền cứng bằng backend cho đủ 7 nhóm người dùng.
    // Kịch bản gài bẫy: lỡ AI bị khách JAILBREAK rồi nghe lời gọi nhầm tool lấy doanh thu,
    // API này check TOKEN thấy KO PHẢI `KE_TOAN` hoặc `ADMIN` là khóa ngay,
    // bắn `403_FORBIDDEN` ra UI, tuyệt đối ko để lọt dữ liệu nhạy cảm từ DB.
    ```
    ```java
    // STATELESS: Không tạo và lưu trữ session vào RAM của server.
    ```
    ```java
    /**
     * Tự động chuyển lịch hẹn CHƯA XỬ LÝ sang 'KHONG_DEN' cuối ngày (23:59).
     * BUG FIX #1: Trước dùng N'Chờ xác nhận' (tiếng Việt) nhưng DB lưu 'CHO_XAC_NHAN'
     * -> scheduled task chạy nhưng KHÔNG UPDATE được dòng nào! Task chạy nhưng vô ích.
     * BUG FIX #2: Trước expire cả lịch hẹn NGÀY HÔM NAY, nhưng bác sĩ có thể vẫn
     * đang xử lý muộn -> chỉ expire lịch hẹn ĐÃ QUA (ngay_kham < today).
     */
    ```
- **Linh Hoạt Kỹ Thuật**: Giữ nguyên các thuật ngữ tiếng Anh chuyên ngành công nghệ thông tin hoặc từ thông dụng mà dân IT đều biết (ví dụ: "API", "Controller", "Service", "Token", "State", "Render", "Dashboard", "Backup") chứ không dịch thô thiển sang tiếng Việt gây ngô nghê.

#### 2. 🔏 Database & Dữ Liệu
- **Cấm Tự Ý Sửa Database**: Chỉ được phép xem hoặc chạy lệnh `SELECT` để nghiên cứu. Tuyệt đối cấm tự ý thay đổi cấu trúc dữ liệu (`ALTER`, `DROP`) hoặc nội dung dữ liệu (`INSERT`, `UPDATE`, `DELETE`) mà không có sự đồng ý trực tiếp của sếp.
- **Sử Dụng Trực Tiếp Dữ Liệu Có Sẵn (Cấm Tuyệt Đối Tạo Dữ Liệu Mẫu/Ảo)**: Sếp đã tạo đủ lượng khách hàng và bác sĩ thật để test trong DB. Không bao giờ được tự ý dùng script hay API để tạo thêm bác sĩ ảo, khách hàng ảo hay tài khoản ảo. Mọi thao tác kiểm thử phải đi thẳng vào vấn đề và chỉ được phép lấy dữ liệu có sẵn ra dùng.
- **Quy tắc chạy Test/Debug tự động**: Khi AI tự viết hoặc chạy các kịch bản test tự động (như Playwright, API test, Postman...), BẮT BUỘC PHẢI DÙNG các tài khoản thật được định nghĩa dưới đây, tuyệt đối không được viết code tạo thêm tài khoản ảo/rác mới trong DB để test:
  - **Admin**: `admin` / `admin@rexi.com`
  - **Bác sĩ (VT-BS)**: `minhanh` / `minhanh@rexi.com`
  - **Khách hàng (VT-KH/VT-5)**: `***REMOVED***` / `***REMOVED***-DB_PASSWORD`
  - **Lễ tân (VT-TT)**: `tieptan` / `tieptan@rexi.com`
  - **Kế toán (VT-KT)**: `ketoan` / `ketoan@rexi.com`
  - **Quản lý (VT-QL)**: `quanly` / `quanly@rexi.com`
  - **Y tá (VT-YT)**: `yta` / `yta@rexi.com`
- **Tra Cứu Thông Tin Tài Khoản Khi Test/Debug**: Khi tìm kiếm thông tin tài khoản, hãy đi trực tiếp vào database để tìm thay vì đoán bừa.
- **Luôn Kiểm Tra Cấu Trúc Database Trước Khi Đề Xuất Sửa Đổi**: Khi làm các công việc liên quan đến dữ liệu (như thêm cột, thêm trường, liên kết bảng), AI bắt buộc phải chủ động kiểm tra file schema SQL (`PhongKhamThuY.sql`) hoặc cấu trúc DB thực tế trước. Rất nhiều cấu trúc dữ liệu đã được sếp thiết kế đầy đủ sẵn (ví dụ các cột `nhan_email`, `nhan_sms` trong bảng `KhachHang`). Tuyệt đối cấm đề xuất thay đổi cấu trúc bảng hoặc tạo cột mới một cách vội vã khi chưa đối chiếu kỹ với cơ sở dữ liệu hiện có.
- **Bắt Buộc Xác Minh Logic Chéo (Cross-Validation) Giữa DB, Backend và Frontend**: Cấm tuyệt đối việc code "chỉ để chạy trên giao diện". Mọi hằng số (Enum), trạng thái (Status), luồng chạy tự động (Scheduled Tasks, Cron) ở Frontend hay Backend **bắt buộc** phải được đối chiếu trực tiếp với dữ liệu thực tế đang lưu trong Database (VD: tiếng Việt vs tiếng Anh, in hoa vs in thường). Bỏ qua bước này sẽ tạo ra lỗi hệ thống chết người.

#### 3. 💻 Đồng Bộ Hệ Thống & Quản Lý Mã Nguồn
- **Luôn Đồng Bộ Frontend và Backend**: Khi sửa đổi hoặc thêm mới một chức năng, bắt buộc phải kiểm tra và sửa đồng bộ cả Frontend lẫn Backend (trừ trường hợp thật sự không cần thiết). Nếu đã sửa 1 trong 2 bên, phải ngay lập tức rà soát lại bên còn lại xem đã khớp logic và định dạng dữ liệu chưa để tránh lỗi đồng bộ sau này.
- **Bản Sao Lưu Code & Chống Mất Mát Tính Năng Cũ**: Mọi chỉnh sửa cấm tuyệt đối làm mất/hỏng/sai các tính năng cũ đã chạy tốt. Phải lưu bản sao lưu hoặc commit trước khi thay đổi để có thể khôi phục lại code cũ bất cứ lúc nào.
- **Cấm Xả Rác File Tạm Ở Thư Mục Gốc**: Tuyệt đối không được phép tạo các file code/script tạm thời (ví dụ: `scratch_test.py`, `update.js`) ở thư mục gốc của dự án. Nếu bắt buộc phải có file chạy 1 lần, phải đặt vào thư mục `.agent/scratch/` hoặc `artifacts/scratch/` và phải xoá ngay lập tức sau khi dùng xong.

#### 4. 🎛️ Quy Trình Debug & Mở Trình Duyệt
- **Quy Trình Debug DevTools (Bắt Mạch Qua F12 Chrome)**: Khi đối mặt với bất kỳ lỗi nào liên quan đến Frontend hoặc gọi API, AI không được đoán mò. Bắt buộc phải soi lỗi thực tế từ DevTools (F12) của Google Chrome (tab Console, tab Network). Đọc kỹ các dòng báo lỗi đỏ, Stack Trace và gợi ý sửa lỗi bằng AI Gemini tích hợp trong DevTools (bóng đèn gợi ý khi di chuột vào dòng lỗi) trước khi đề xuất giải pháp.
- **Hạn Chế RAM (Cấm Tự Tiện Mở Google Chrome)**: Vì máy sếp yếu và RAM dễ bị quá tải, cấm tự tiện mở Google Chrome nếu có thể dùng Opera. Khi sử dụng browser tool, phải tối giản hóa RAM bằng cách tắt các tiến trình rác chạy ngầm và các tab không sử dụng.

#### 5. 🎨 Quy Tắc Thiết Kế UI/UX & Tính Năng Hệ Thống
- **Luôn Ưu Tiên Thiết Kế Responsive Bằng Tailwind CSS**: Trong mọi tính năng mới, bắt buộc phải dùng Tailwind CSS (hoặc các Utility Classes thay thế tương đương nếu hệ thống không dùng Tailwind) để giao diện hiển thị xuất sắc, mượt mà và chuẩn tỷ lệ trên mọi thiết bị (mobile, tablet, desktop). Khắc cốt ghi tâm quy tắc: "Mobile-first, Responsive-always".
- **Đồng Bộ Giao Diện Dark/Light Mode Toàn Hệ Thống**: Trạng thái Dark/Light Mode phải được đồng bộ trên toàn bộ tất cả các trang (Trang chủ, Admin, Nhân viên, Khách hàng). Khi chuyển chế độ ở một trang, các trang khác phải tự động chuyển theo qua LocalStorage hoặc Context toàn cục.
- **Ràng Buộc Nhập Liệu Số Điện Thoại**: Trường SĐT bắt buộc chỉ được phép nhập số. Nếu người dùng nhập ký tự chữ hoặc ký tự đặc biệt, hệ thống phải hiển thị thông báo cảnh báo/lỗi ngay lập tức ở cả Frontend và Backend.
- **Đồng Bộ Thông Tin Hotline**: Thống nhất duy nhất một số điện thoại Hotline trên toàn bộ các trang và các khu vực (top bar, phần Liên hệ, Footer) để tránh làm khách hàng bị rối.
- **Giữ Nguyên Các Hiệu Ứng UI/UX Cao Cấp**: Không được xóa các hiệu ứng Glassmorphic, Parallax Scrolling nền fixed 450px ở mục "Đối tác chiến lược", các hiệu ứng chuyển đổi mượt mà, v.v.
- **Xác Nhận Trước Khi Xóa Nhật Ký Hoạt Động**: Tính năng xóa nhật ký hoạt động phải có nút xóa ở cuối mỗi dòng và bắt buộc phải hiển thị popup xác nhận chắc chắn trước khi thực hiện xóa.
- **Hiệu Ứng Meme Mèo Chuối (MemeRun)**: Chân của con mèo chuối chạy quanh màn hình phải chạm sát vừa khít mép viền của cả 4 cạnh màn hình. Cắt ngắn video meme nếu cần để tối ưu dung lượng và giảm tải RAM cho máy sếp.

#### 6. 🤖 Quy Tắc Thiết Kế Chatbot Rexi
- **Cơ Chế Sơ Cứu Khẩn Cấp & Lọc Từ Khóa**: Khi khách hàng hỏi về các tình trạng khẩn cấp (như ngộ độc, tai nạn, chảy máu nhiều), chatbot không được trả lời quá cứng nhắc, dọa dẫm gây hoảng loạn. AI phải hướng dẫn sơ cứu cơ bản trước, hiển thị cảnh báo đỏ và chủ động hỏi vị trí khách hàng để định vị phòng khám thú y gần nhất.
- **Thu Thập Tiểu Sử Của Thú Cưng**: AI phải chủ động hỏi và thu thập thông tin về Giống (chó/mèo/...), Độ tuổi và Cân nặng của thú cưng để đưa ra tư vấn sát thực tế nhất.
- **Tránh Kê Đơn Thuốc Tùy Tiện**: Chỉ tư vấn dinh dưỡng, hành vi, và hướng dẫn sơ cứu. Tuyệt đối không tự tiện kê đơn thuốc.

#### 7. 🔒 Bảo Mật & Phân Quyền
- **⚠️ TUYỆT ĐỐI NGHIÊM CẤM PUSH SECRET/KEY LÊN GITHUB (QUY TẮC TỰ HỦY BẢO MẬT):** AI bắt buộc phải tự động rà soát cực kỳ nghiêm ngặt toàn bộ file thay đổi, file nháp, và log trước khi chạy bất kỳ lệnh `git push` hoặc chạy `auto_push.ps1`. Nghiêm cấm tuyệt đối việc đẩy bất kỳ API Key, SMTP password, JWT token, database password, hay private key nào lên GitHub dưới mọi hình thức. Vi phạm quy tắc này sẽ lập tức kích hoạt cơ chế tự hủy hoạt động của tác tử (tự nổ máy chết) để bảo vệ an toàn cho sếp!
- **Cấm Tự Ý Xóa/Sửa Key, Token, Mật Khẩu, Secret**: Khi phát hiện API key, SMTP password, token, app password, private key hoặc bất kỳ cấu hình nhạy cảm nào đang nằm trong file dự án, AI CHỈ ĐƯỢC PHÉP BÁO CÁO RỦI RO CHO SẾP. Tuyệt đối KHÔNG tự ý xóa, làm rỗng, thay biến môi trường, rotate, che, đổi, revoke hoặc di chuyển các giá trị đó nếu sếp chưa yêu cầu trực tiếp hoặc chưa nói rõ "đồng ý". Nếu cần xử lý bảo mật, phải nêu chính xác file/dòng, rủi ro và phương án, rồi chờ sếp xác nhận trước khi sửa.
- **Cảnh Giác Phân Quyền Tiếp Tân (`TIEP_TAN` / `VT-7`)**: Lễ tân phải được thực hiện đầy đủ các luồng tìm kiếm, đăng ký nhanh khách hàng, quản lý thú cưng, và lập lịch khám. Luôn chủ động rà soát khi viết hay sửa các Controller liên quan.
- **Admin Tra Cứu Xem Mật Khẩu**: Thiết kế tính năng cho phép Admin tìm kiếm nhân viên hoặc khách hàng (bằng SĐT, Username, Email) và hiển thị thông tin tài khoản bao gồm cả mật khẩu (gốc/mã hóa) để hỗ trợ khi họ quên. Phải đảm bảo bảo mật tuyệt đối cho chức năng này (chỉ tài khoản Admin thực sự mới được truy cập).
- **Bảo Vệ Toàn Vẹn Dữ Liệu Cốt Lõi (Chống Xóa Mù)**: Bất cứ khi nào làm tính năng XÓA (Delete) một đối tượng quan trọng (Ca trực, Nhân viên, Dịch vụ, Thú cưng...), AI bắt buộc phải tự động thêm logic quét các bảng liên quan (như Lịch Hẹn, Hóa Đơn) để đảm bảo không bị xung đột. Tuyệt đối không cho xóa vô điều kiện gây đứt gãy trải nghiệm khách hàng.
- **Công Thức Mật Khẩu Mặc Định Nhân Viên**: Khi tạo tài khoản nhân viên mới, mật khẩu luôn phải tuân theo công thức `[Tên-chức-vụ-viết-liền-không-dấu] + @rexi.com`. Ví dụ: Bác sĩ -> `bacsi@rexi.com`, Tiếp tân -> `tieptan@rexi.com`.

#### 8. 📝 Thông Tin Báo Cáo Thực Tập (VNUA IT)
Khi sếp yêu cầu viết báo cáo thực tập hoặc điền thông tin biểu mẫu, hãy sử dụng chính xác các thông tin sau:
- **Số điện thoại liên hệ**: `091 6122 462`
- **Email phụ trách**: `tftg215@gmail.com`
- **Chức vụ**: `Human Resource Manager`
- **Vị trí thực tập**: `Thực tập sinh Marketing - TTS Vận Hành Sàn, TTS IT ,...` (Chọn vị trí phù hợp với ngữ cảnh báo cáo)
- **Địa chỉ Hà Nội**: `Tòa nhà NIC GROUP, số 3A, Thi Sách, Hai Bà Trưng, Hà Nội`
- **Cách viết báo cáo**: Chỉ ghi nhận các thông tin được yêu cầu cụ thể trong biểu mẫu, không viết lan man hoặc điền thông tin thừa thãi ngoài đề cương.

---

### 🚀 Kế Thừa Công Nghệ Elite (Servexa-Warranty-AI & Rexi)
Khi sếp phát triển tính năng mới, hãy chủ động đề xuất và tích hợp các giải pháp sau:
1. *Virtual List*: Áp dụng cuộn ảo cho danh sách dữ liệu lớn để tránh đơ/treo trình duyệt.
2. *AI Agentic UI*: Thiết kế widget kính mờ động cho AI thay vì text thuần.
3. *Security Rate-limiting*: Tích hợp chặn spam API chat bằng Bucket4j.
4. *Emergency Triage*: Cơ chế sơ cứu tốc hành bằng lọc từ khóa khẩn cấp ở Frontend.
5. *Vite Splitting*: Phân tách manualChunks cho các file build JS tối ưu Lighthouse.
