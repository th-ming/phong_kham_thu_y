const fs = require("fs");
const path = require("path");
const {
  Document,
  Paragraph,
  TextRun,
  Packer,
  AlignmentType,
  HeadingLevel,
} = require("docx");

const content = `4.5 Hệ quản trị cơ sở dữ liệu Sql server
4.5.1 Khái niệm
SQL Server là một hệ quản trị cơ sở dữ liệu quan hệ (RDBMS) mạnh mẽ do Microsoft phát triển, được sử dụng rộng rãi trong các ứng dụng doanh nghiệp để lưu trữ, truy xuất và quản lý dữ liệu có cấu trúc. SQL Server hỗ trợ ngôn ngữ truy vấn chuẩn SQL (Structured Query Language) và cung cấp rất nhiều tính năng nâng cao như: stored procedure (thủ tục lưu trữ), trigger (bộ kích hoạt), transaction (giao dịch), view, indexing, khóa ngoại (foreign key), và các ràng buộc dữ liệu (constraint). Hệ thống còn đi kèm với SQL Server Management Studio (SSMS) – một công cụ quản trị cơ sở dữ liệu đồ họa giúp dễ dàng thao tác với cơ sở dữ liệu thông qua giao diện trực quan.

4.5.2 Ưu điểm của SQL Server
SQL Server hỗ trợ nhiều cấp độ bảo mật, từ phân quyền người dùng đến mã hóa dữ liệu, giúp bảo vệ hệ thống trước các rủi ro về an toàn thông tin. Ngoài ra, nó cũng tích hợp tốt với các công nghệ .NET, Java (qua JDBC), hoặc Spring Boot (thông qua cấu hình datasource), cho phép truy xuất dữ liệu thông qua các ORM như Hibernate hoặc JPA. SQL Server còn có các tính năng cao cấp như Always On Availability Groups (để đảm bảo tính sẵn sàng cao), SQL Agent (lên lịch job tự động), và tích hợp với công cụ phân tích như Power BI. SQL Server thích hợp cho mọi quy mô hệ thống – từ ứng dụng nhỏ nội bộ đến các giải pháp doanh nghiệp lớn đòi hỏi tính sẵn sàng và hiệu năng cao.

4.6 Các công nghệ khác
4.6.1 Gửi Email tự động (Spring Boot Mail/SMTP)
Hệ thống tích hợp thư viện spring-boot-starter-mail để tự động hóa quy trình gửi email thông báo cho khách hàng và nhân viên phòng khám. Khi có các sự kiện quan trọng xảy ra như khách hàng đặt lịch hẹn khám thành công, bác sĩ hoàn thành hồ sơ bệnh án, hoặc hệ thống xuất hóa đơn thanh toán, một email tự động sẽ được tạo ra thông qua đối tượng JavaMailSender và gửi đi bằng giao thức SMTP (Simple Mail Transfer Protocol). Việc này giúp cải thiện trải nghiệm người dùng, đảm bảo thông tin liên lạc của phòng khám luôn được cập nhật tức thì.

4.6.2 Lưu trữ File đính kèm (Spring Multipart / Local Storage)
Thay vì sử dụng dịch vụ đám mây bên ngoài, hệ thống REXI lựa chọn giải pháp lưu trữ file trực tiếp trên máy chủ thông qua thư mục uploads/ được cấu hình tĩnh trong WebConfig. Khi người dùng hoặc quản trị viên tải file lên (ảnh thú cưng, ảnh dịch vụ, tài liệu bệnh án...), request được tiếp nhận bởi FileDinhKemController thông qua đối tượng MultipartFile của Spring. Hệ thống kiểm tra định dạng file được phép (.jpg, .png, .gif, .pdf, .doc, .docx, .mp4, .mov) và giới hạn dung lượng tối đa 10MB trước khi lưu. Đường dẫn file sau khi lưu được ghi vào bảng FileDinhKem trong cơ sở dữ liệu, giúp truy xuất và hiển thị lại chính xác trên giao diện. Giải pháp này phù hợp với quy mô phòng khám, đảm bảo dữ liệu nội bộ không phụ thuộc vào dịch vụ bên thứ ba.

4.6.3 GOOGLE API
Hệ thống tích hợp Google OAuth2 API, cụ thể là dịch vụ Google OAuth2, để cung cấp giải pháp đăng nhập một chạm (Sign-In with Google) cho người dùng. Điều này cho phép khách hàng đăng nhập nhanh chóng vào hệ thống quản lý phòng khám bằng tài khoản Google sẵn có mà không cần tạo mật khẩu mới. Ngoài ra, hệ thống cũng sử dụng Google Mail API hoặc SMTP của Google để gửi email giao dịch, đảm bảo tỷ lệ vào hộp thư chính (Inbox) cao. Để tích hợp, ứng dụng được cấu hình Client ID và Client Secret thông qua Google Cloud Console, đồng thời tuân thủ các giao thức bảo mật OAuth2 để bảo vệ thông tin tài khoản người dùng.

4.6.4 Giao thức truyền thông Real-time (WebSocket)
Hệ thống tích hợp thư viện Spring WebSocket (STOMP) để thiết lập kết nối hai chiều liên tục giữa Server và Client. Cơ chế này được ứng dụng vào phân hệ Chatbot AI để truyền tải tin nhắn tức thời và hệ thống thông báo đẩy (Push Notification) giúp người dùng nhận được cập nhật trạng thái bệnh án mà không cần tải lại trang.

4.6.5 VietQR / VNPay Payment API
VietQR và VNPay là các giao diện lập trình ứng dụng (API) thanh toán phổ biến tại Việt Nam. VietQR hỗ trợ tạo mã QR thanh toán động chứa đầy đủ thông tin số tài khoản, số tiền và nội dung chuyển khoản tự động, giúp khách hàng thanh toán nhanh chóng qua ứng dụng ngân hàng (Mobile Banking) mà không cần nhập liệu thủ công. Cổng thanh toán VNPay cung cấp giải pháp thanh toán trực tuyến an toàn qua thẻ ngân hàng nội địa, thẻ quốc tế và ví điện tử, kết nối trực tiếp với cổng bảo mật của ngân hàng để xử lý giao dịch chính xác, bảo mật và tức thì.

4.7 Cải thiện hiệu năng bằng cơ chế Cuộn ảo (Virtual Scrolling)
Trong các hệ thống quản lý phòng khám quy mô lớn, danh sách lịch sử bệnh án, lịch hẹn khám, và danh sách nhân viên phân quyền thường lên tới hàng ngàn bản ghi. Việc hiển thị đồng thời toàn bộ các phần tử DOM trên trình duyệt sẽ làm giảm đáng kể tốc độ render, gây ra hiện tượng giật lag giao diện và hao tốn tài nguyên bộ nhớ RAM của thiết bị người dùng. Để giải quyết triệt để vấn đề này, hệ thống REXI đã xây dựng một Custom Hook chuyên biệt mang tên useVirtualScroll ở phía Frontend. Cơ chế vận hành của giải pháp tối ưu này thực hiện bằng cách lắng nghe sự kiện cuộn (scroll event) của vùng chứa danh sách dữ liệu, từ đó tính toán vị trí thanh cuộn theo thời gian thực để xác định chính xác những hàng thông tin nào đang nằm trong khung nhìn (Viewport) của người dùng. Hệ thống sẽ chỉ thực hiện render ra các phần tử đang hiển thị và một số hàng đệm (buffer items) ở phía trên và phía dưới, đồng thời ẩn các phần tử còn lại khỏi DOM và sử dụng một thẻ div đệm (spacer) với chiều cao tương ứng nhằm duy trì thanh cuộn giả lập đúng tỷ lệ kích thước danh sách thực tế. Kết quả thực nghiệm cho thấy sau khi áp dụng cơ chế cuộn ảo, giao diện danh sách phản hồi vô cùng ổn định, giảm tải số lượng thẻ DOM cần xử lý và tiết kiệm tối đa bộ nhớ khi làm việc với các tập dữ liệu lớn. Ngoài ra, hệ thống còn tích hợp Giao thức Y tế Cấp cứu (Emergency Triage Protocol) để tự động nhận diện các từ khóa nguy kịch, từ đó phản hồi hướng dẫn sơ cứu tức thì và đảm bảo an toàn cho thú cưng trong thời gian chờ đợi phản hồi từ mô hình trí tuệ nhân tạo.

4.8 Chatbot REXI AI và cơ chế tự động điều hướng hệ thống (Autopilot)
Trong xu hướng hiện đại hóa các ứng dụng quản lý y tế, việc tích hợp Chatbot REXI AI không chỉ dừng lại ở chức năng giải đáp thông tin thông thường mà còn đóng vai trò như một phân hệ điều hướng tự động (Autopilot). Hệ thống phòng khám thú y REXI triển khai giải pháp này nhằm tối giản hóa các thao tác thủ công cho cả khách hàng lẫn đội ngũ nhân sự. Cụ thể, phân hệ chatbot được tích hợp sâu vào giao diện người dùng, sử dụng mô hình ngôn ngữ lớn để tiếp nhận và hiểu ý định tự nhiên của người dùng, rồi chuyển hóa thành các thẻ lệnh hành động (action tags) tương thích với cấu trúc của trang web. Nhờ cơ chế này, khi người dùng đưa ra các yêu cầu dạng ngôn ngữ tự nhiên, trợ lý ảo sẽ tự động phân tích bối cảnh và kích hoạt các hành động tương ứng trên trình duyệt, mang lại trải nghiệm tương tác thông suốt và tối ưu quy trình.

4.8.1 Cơ chế phân tích ý định và trích xuất tham số tác vụ
Để thực hiện việc điều hướng và hỗ trợ tác vụ tự động, hệ thống áp dụng cơ chế phân tích cú pháp ngữ nghĩa để nhận diện ý định của người dùng. Khi nhận được câu lệnh, bộ xử lý ngôn ngữ sẽ phân tách yêu cầu thành các thành phần chính bao gồm ý định cốt lõi, đối tượng thú cưng, triệu chứng lâm sàng và các yêu cầu về thời gian hoặc nhân sự. Ví dụ, đối với yêu cầu đặt lịch khám, hệ thống sẽ tự động trích xuất các tham số về ngày, giờ, bác sĩ phụ trách và loại hình dịch vụ phù hợp. Sau khi có đủ thông tin đầu vào, một thực thể lịch hẹn nháp sẽ được tự động thiết lập trong cơ sở dữ liệu để nhân viên tiếp tân kiểm duyệt và xác nhận, đảm bảo tính chính xác tuyệt đối trước khi ghi nhận chính thức.

4.8.2 Quy trình thực thi hành động trên giao diện (DOM Autopilot)
Sau khi xác định được ý định thao tác giao diện, Chatbot REXI AI sẽ ánh xạ yêu cầu tới các phần tử tương tác trên trang web thông qua các thuộc tính định danh đặc biệt (chỉ số nhận diện AI). Quá trình này được thực hiện bằng cách đọc bối cảnh cấu trúc tài liệu (DOM Context) hiện tại và tạo ra các chuỗi lệnh hành động cụ thể như nhấp chuột, điền dữ liệu, lựa chọn giá trị hoặc chuyển hướng trang. Hệ thống giới hạn quyền điều hướng trong các đường dẫn nội bộ hợp lệ của phân hệ khách hàng và phân hệ quản lý (chẳng hạn như trang tổng quan, quản lý thú cưng, hồ sơ bệnh án hay báo cáo doanh thu), đảm bảo tiến trình hoạt động diễn ra an toàn và không gây xung đột với các luồng nghiệp vụ thông thường.

4.9 Cơ chế Bảo mật và Xác thực hệ thống (Spring Security & JWT)
Để bảo vệ thông tin bệnh án và ngăn chặn truy cập trái phép, hệ thống REXI được triển khai các giải pháp bảo mật đa tầng chặt chẽ. Mật khẩu người dùng được mã hóa một chiều bằng thuật toán BCrypt. Các API nhạy cảm được giới hạn tần suất truy cập bằng cơ chế Rate Limiting qua thư viện Bucket4j nhằm chặn đứng các cuộc tấn công dò mật khẩu (Brute-force). Sau khi đăng nhập thành công, hệ thống cấp token JWT lưu trữ trong httpOnly Cookie (thông qua CookieUtil.java) thay vì localStorage để ngăn chặn mã độc JavaScript đánh cắp token qua tấn công XSS. Bộ lọc JwtFilter xử lý đọc token từ cookie, đồng thời hỗ trợ đọc từ Bearer Header để tương thích ngược.

Cấu hình CORS trong SecurityConfig.java giúp giới hạn các domain được phép gọi API nhằm ngăn chặn tấn công CSRF từ các trang web độc hại. Ở phía Frontend, thư viện DOMPurify được sử dụng để làm sạch nội dung HTML trả về từ Chatbot REXI AI trước khi hiển thị nhằm ngăn chặn tấn công XSS qua nội dung do mô hình ngôn ngữ sinh ra. Hệ thống cũng tích hợp bộ ghi nhật ký hoạt động (Audit Log) thông qua Interceptor để tự động ghi vết tất cả các thao tác thay đổi dữ liệu nhạy cảm của nhân viên vào nhật ký hệ thống (NhatKyHeThong), kết hợp với phân quyền tài khoản đa tầng (RBAC) cho từng nhóm vai trò từ ADMIN đến khách hàng. Cuối cùng, cơ chế AI Action Policy Map giới hạn quyền gọi hành động của trợ lý ảo dựa trên vai trò thực tế của tài khoản đang tương tác để ngăn chặn hiệu quả các cuộc tấn công Prompt Injection.

4.10 Cấu hình tối ưu cơ sở dữ liệu và máy chủ
Hệ thống hiện được triển khai và kiểm thử linh hoạt với SQL Server (cho môi trường phát triển local) và PostgreSQL/Supabase (cho môi trường Production thực tế) bằng cách cấu hình Datasource động. Ở môi trường vận hành thật, một số log truy vấn SQL chi tiết sẽ được tắt để giảm tải và tránh lộ thông tin cấu trúc dữ liệu không cần thiết. Toàn bộ hệ thống Backend được tối ưu hóa tài nguyên RAM, chạy trên nền tảng máy ảo Java phiên bản mới nhất là JDK 21 LTS (Long-Term Support) để đảm bảo tính ổn định và khả năng xử lý đa luồng tốt nhất cho dịch vụ phòng khám.

4.11 Đặc tả Kiến trúc Chatbot REXI AI (ChatController)
Kiến trúc của phân hệ Chatbot REXI AI được thiết kế theo mô hình tách lớp trách nhiệm rõ ràng ở phía Backend, tích hợp chặt chẽ với Spring Security và cơ sở dữ liệu quan hệ. Lớp điều khiển chính ChatController đóng vai trò là cửa ngõ tiếp nhận các yêu cầu trò chuyện, thực hiện kiểm soát tần suất truy cập (Rate Limiting) để bảo vệ tài nguyên máy chủ và điều phối luồng xử lý thông tin thông qua các dịch vụ nghiệp vụ bổ trợ.

4.11.1 Bộ định tuyến thông minh và Điều phối yêu cầu (LLM Router)
Nhằm tối ưu hóa chi phí vận hành và tốc độ phản hồi, hệ thống triển khai bộ định tuyến thông minh để phân loại yêu cầu ngay khi tiếp nhận. Đối với các truy vấn chứa tệp tin đa phương tiện như hình ảnh hoặc video về tình trạng của vật nuôi, bộ định tuyến sẽ ưu tiên chuyển tiếp xử lý sang các mô hình đa phương thức chuyên sâu như Gemini API để phân tích trực quan. Đối với các yêu cầu thông thường về tra cứu thông tin hoặc thao tác giao diện, hệ thống sử dụng mô hình Llama thông qua dịch vụ Groq API để đạt tốc độ phản hồi nhanh nhất. Các câu hỏi chuyên sâu về y tế hoặc khi xảy ra sự cố kết nối với nhà cung cấp dịch vụ chính sẽ được tự động chuyển hướng (fallback) sang các nhà cung cấp dự phòng thông qua OpenRouter API, đảm bảo tính liên tục và độ tin cậy của hệ thống.

4.11.2 Cơ chế gọi công cụ ReAct Agent và Liên kết dữ liệu (Tool Calling)
Trung tâm xử lý tác vụ nghiệp vụ của Chatbot REXI AI dựa trên lớp dịch vụ ReActAgentService kết hợp với AiToolService. Lớp dịch vụ này định nghĩa hệ thống 24 công cụ thực tế kết nối trực tiếp với cơ sở dữ liệu thông qua JdbcTemplate để thực hiện các truy vấn dữ liệu theo thời gian thực. Quy trình hoạt động tuân thủ cơ chế ReAct (Suy luận và Hành động), cho phép mô hình ngôn ngữ lớn đưa ra các suy luận trung gian và quyết định gọi công cụ thích hợp để lấy dữ liệu như kiểm tra lịch trực của bác sĩ, thống kê doanh thu, tra cứu tồn kho thuốc hoặc thông tin bệnh án trước khi tổng hợp câu trả lời cuối cùng gửi lại cho người dùng.

4.11.3 Các biện pháp kiểm soát chất lượng phản hồi và bảo mật đa tầng
Để đảm bảo an toàn thông tin và tính chính xác của dữ liệu y khoa, hệ thống áp dụng các bộ lọc kiểm soát nghiêm ngặt sau khi nhận kết quả từ mô hình ngôn ngữ. Cơ chế lọc chất lượng y tế (Evidence Gate & Quality Guard) thực hiện kiểm tra và đối chiếu câu trả lời với kho tài liệu y khoa chính thống đã được nạp sẵn để ngăn ngừa hiện tượng ảo giác thông tin của AI, đảm bảo các tư vấn sức khỏe cho vật nuôi luôn có cơ sở khoa học đáng tin cậy. Phân quyền hành động AI (AI Action Policy Map) tích hợp với RoleAccessPolicy để kiểm tra quyền hạn của tài khoản đang đăng nhập trước khi cho phép Chatbot REXI AI thực thi bất kỳ công cụ nhạy cảm nào, ngăn chặn các cuộc tấn công tiêm lệnh nhằm thay đổi quyền hạn hoặc phá hoại dữ liệu. Giao thức Y tế Cấp cứu (Emergency Triage Protocol) tự động phân loại mức độ khẩn cấp của triệu chứng dựa trên các từ khóa nguy kịch, từ đó trực tiếp trả về hướng dẫn sơ cứu khẩn cấp cùng thông tin liên hệ trực tiếp với bác sĩ trực trong tình trạng nguy cấp đe dọa tính mạng vật nuôi.

4.12 Kết chương
Chương 4 đã làm rõ cơ sở lý thuyết và các công nghệ cốt lõi được áp dụng để xây dựng hệ thống phòng khám thú y REXI. Sự kết hợp đồng bộ giữa ngôn ngữ Java/JavaScript, Spring Boot Framework, các giải pháp lưu trữ dữ liệu, giao tiếp thời gian thực, tích hợp cổng thanh toán VietQR/VNPay, Chatbot REXI AI cùng các cơ chế bảo mật đa tầng là nền tảng kỹ thuật vững chắc để triển khai chi tiết các chức năng hệ thống trong chương tiếp theo.`;

// Check if line is a heading level 1 (4.X without .X after)
function isH1(line) {
  return /^4\.\d+\s/.test(line) && !/^4\.\d+\.\d+/.test(line);
}

// Check if line is a heading level 2 (4.X.X)
function isH2(line) {
  return /^4\.\d+\.\d+/.test(line);
}

const lines = content.split("\n");
const paragraphs = [];

for (const line of lines) {
  const trimmed = line.trim();
  if (!trimmed) {
    paragraphs.push(
      new Paragraph({
        spacing: { after: 120 },
        children: [],
      })
    );
    continue;
  }

  if (isH1(trimmed)) {
    paragraphs.push(
      new Paragraph({
        spacing: { before: 300, after: 200 },
        alignment: AlignmentType.JUSTIFIED,
        children: [
          new TextRun({
            text: trimmed,
            bold: true,
            size: 28, // 14pt (half-points: 28 = 14pt) for main heading
            font: "Times New Roman",
          }),
        ],
      })
    );
  } else if (isH2(trimmed)) {
    paragraphs.push(
      new Paragraph({
        spacing: { before: 200, after: 150 },
        alignment: AlignmentType.JUSTIFIED,
        children: [
          new TextRun({
            text: trimmed,
            bold: true,
            size: 26, // 13pt
            font: "Times New Roman",
          }),
        ],
      })
    );
  } else {
    paragraphs.push(
      new Paragraph({
        spacing: { after: 120, line: 360 },
        alignment: AlignmentType.JUSTIFIED,
        indent: { firstLine: 520 }, // First line indent ~1.27cm
        children: [
          new TextRun({
            text: trimmed,
            size: 26, // 13pt
            font: "Times New Roman",
          }),
        ],
      })
    );
  }
}

const doc = new Document({
  sections: [
    {
      properties: {
        page: {
          margin: {
            top: 1440, // 1 inch
            right: 1440,
            bottom: 1440,
            left: 1440,
          },
        },
      },
      children: paragraphs,
    },
  ],
});

// Add title at the beginning
paragraphs.unshift(
  new Paragraph({
    spacing: { after: 300 },
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({
        text: "CHƯƠNG 4: CÔNG NGHỆ SỬ DỤNG",
        bold: true,
        size: 32, // 16pt
        font: "Times New Roman",
      }),
    ],
  })
);

// Recreate document with title
const docWithTitle = new Document({
  sections: [
    {
      properties: {
        page: {
          margin: {
            top: 1440,
            right: 1440,
            bottom: 1440,
            left: 1440,
          },
        },
      },
      children: paragraphs,
    },
  ],
});

const outputPath = path.join(
  "D:",
  "QLy Phòng Khám Thú Y",
  "Báo cáo thực tập",
  "chuong4.docx"
);

Packer.toBuffer(docWithTitle).then((buffer) => {
  fs.writeFileSync(outputPath, buffer);
  console.log("Tạo file thành công:", outputPath);
});
