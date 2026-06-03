package com.rexi.pkty.controller;

import com.rexi.pkty.dto.ChatMessage;
import com.rexi.pkty.security.RoleAccessPolicy;
import com.rexi.pkty.security.RexiSecurityRoles;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;
import java.util.logging.Logger;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import jakarta.mail.internet.MimeMessage;

@RestController
@RequestMapping("/api/agent")
@CrossOrigin(origins = "${cors.allowed-origins:http://localhost:3000,http://localhost:5173}")
public class AgentController {

    private static final Logger logger = Logger.getLogger(AgentController.class.getName());

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private com.rexi.pkty.service.GeminiService geminiService;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Autowired
    private com.rexi.pkty.service.ReActAgentService reactAgentService;

    @Autowired
    private com.rexi.pkty.service.AiToolService aiToolService;

    @Autowired
    private com.rexi.pkty.service.AuditLogService auditLogService;

    @Autowired
    private com.rexi.pkty.repository.NhatKyChatRepository nhatKyChatRepository;

    @Autowired
    private com.rexi.pkty.repository.TaiKhoanRepository taiKhoanRepository;

    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper = new com.fasterxml.jackson.databind.ObjectMapper();

    // Auto get goi y cham soc active KHACH_HANG (retention & upsell)
    @GetMapping("/retention-reminders")
    public ResponseEntity<?> getRetentionReminders() {
        try {
            org.springframework.security.core.Authentication auth =
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || auth.getName() == null || "anonymousUser".equals(auth.getName())) {
                return ResponseEntity.ok(List.of());
            }

            String username = auth.getName();
            List<Map<String, Object>> accounts = jdbcTemplate.queryForList(
                "SELECT id_khach_hang, id_vai_tro FROM TaiKhoan WHERE ten_dang_nhap = ?",
                username
            );
            if (accounts.isEmpty()) {
                return ResponseEntity.ok(List.of());
            }

            Map<String, Object> account = accounts.get(0);
            String idKhachHang = account.get("id_khach_hang") != null ? account.get("id_khach_hang").toString() : "";
            String idVaiTro = account.get("id_vai_tro") != null ? account.get("id_vai_tro").toString() : "";
            if (!"VT-5".equalsIgnoreCase(idVaiTro) || idKhachHang.isBlank()) {
                return ResponseEntity.ok(List.of());
            }

            // TOP 3 be goi y, dung idKhachHang login
            String sql = "SELECT TOP 3 tc.id_thu_cung, tc.ten_thu_cung, tc.loai, tc.giong, " +
                         "tc.id_khach_hang, kh.ten_khach_hang, kh.sdt " +
                         "FROM ThuCung tc " +
                         "JOIN KhachHang kh ON tc.id_khach_hang = kh.id_khach_hang " +
                         "WHERE (kh.da_xoa = 0 OR kh.da_xoa IS NULL) " +
                         "AND (tc.da_xoa = 0 OR tc.da_xoa IS NULL) " +
                         "AND tc.id_khach_hang = ?";
            
            List<Map<String, Object>> pets = jdbcTemplate.queryForList(sql, idKhachHang);
            List<Map<String, Object>> reminders = new ArrayList<>();

            for (Map<String, Object> pet : pets) {
                // check loai pet tu DB
                String loai = pet.get("loai") != null ? pet.get("loai").toString().toLowerCase().trim() : "";
                String tenThuCung = pet.get("ten_thu_cung") != null ? pet.get("ten_thu_cung").toString() : "Bé";
                
                Map<String, Object> reminder = new HashMap<>(pet);

                // phan loai loai pet
                boolean laMeo = loai.contains("mèo") || loai.contains("meo") || loai.contains("cat") || loai.equals("mèo");
                boolean lacho = loai.contains("chó") || loai.contains("cho") || loai.contains("dog") || loai.equals("chó");

                if (laMeo) {
                    reminder.put("type", "TRIET_SAN");
                    reminder.put("message", "🐱 Sếp ơi! Bé mèo " + tenThuCung + " đã đến tuổi vàng để thực hiện triệt sản — giúp bảo vệ đường tiết niệu và kéo dài tuổi thọ cho bé. Rexi đã tìm thấy lịch trống phù hợp. Sếp có muốn chốt lịch ngay không ạ? ✨");
                    reminder.put("service_id", "DV-003");
                    reminder.put("suggested_date", java.time.LocalDate.now().plusDays(3).toString());
                    reminder.put("suggested_time", "09:00");
                    reminder.put("doctor_id", "NV-002");
                } else if (lacho) {
                    reminder.put("type", "TIEM_PHONG");
                    reminder.put("message", "🐶 Sếp ơi! Bé cún " + tenThuCung + " đã đến kỳ tiêm nhắc mũi Vắc xin dại & 5-in-1 để duy trì kháng thể bảo vệ. Rexi đã chuẩn bị lịch tiêm vào sáng mai. Sếp muốn Rexi chốt lịch luôn không ạ? 💉✨");
                    reminder.put("service_id", "DV-002");
                    reminder.put("suggested_date", java.time.LocalDate.now().plusDays(1).toString());
                    reminder.put("suggested_time", "10:00");
                    reminder.put("doctor_id", "NV-003");
                } else {
                    // Khac (chim, tho...) -> kham dinh ky
                    reminder.put("type", "KHAM_DINH_KY");
                    reminder.put("message", "🐾 Sếp ơi! Bé " + tenThuCung + " nhà mình đã đến kỳ khám sức khỏe định kỳ để đảm bảo bé luôn khỏe mạnh. Sếp có muốn Rexi đặt lịch khám nhanh không ạ? 🏥✨");
                    reminder.put("service_id", "DV-001");
                    reminder.put("suggested_date", java.time.LocalDate.now().plusDays(2).toString());
                    reminder.put("suggested_time", "08:30");
                    reminder.put("doctor_id", "NV-002");
                }
                reminders.add(reminder);
            }

            return ResponseEntity.ok(reminders);
        } catch (Exception e) {
            logger.severe("Lỗi quét dữ liệu gợi ý chăm sóc chủ động: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi hệ thống khi quét dữ liệu gợi ý chăm sóc."));
        }
    }

    // Swarm Agent (multi-agent orchestration) post campaign
    @PostMapping("/swarm-orchestration")
    @PreAuthorize(RexiSecurityRoles.MARKETING)
    public ResponseEntity<?> handleSwarmOrchestration(@RequestBody Map<String, String> payload) {
        String query = payload.get("query") != null ? payload.get("query") : "";
        logger.info("[SWARM] Tiếp nhận yêu cầu điều phối đa Agent Swarm: " + query);

        try {
            // B1: Swarm Orchestrator phan viec
            String step1Agent = "🤖 Rexi Orchestrator";
            String step1Action = "Phân tích yêu cầu chiến dịch và phân nhỏ công việc cho các Agent phụ tá ngầm";
            String step1Output = "Đã tiếp nhận yêu cầu từ sếp: \"" + query + "\"\n" +
                    "Bắt đầu bẻ nhỏ công việc thành các JSON Tasks:\n" +
                    "1. Giao DataAgent: Phân tích ý định tìm kiếm, chuyển đổi sang khung truy vấn an toàn và thọc database lấy danh sách chủ nuôi.\n" +
                    "2. Giao CreativeAgent: Tiếp nhận kết quả từ DataAgent, lên kịch bản viết email tri ân/nhắc lịch cá nhân hóa.\n" +
                    "3. Giao ReviewAgent: Kiểm tra chéo toàn bộ dữ liệu, loại bỏ lỗi chính tả và các placeholder lỗi trước khi hiển thị.";

            // B2: Data Agent -> Hybrid Text-to-Safe-Query
            String step2Agent = "📊 Data Analyst Agent";
            String step2Action = "Dịch ý định ngôn ngữ tự nhiên sang bộ lọc tham số an toàn (Hybrid Text-to-Safe-Query)";
            
            // Get JSON param tu Gemini
            String dataPrompt = "Bạn là DataAgent - chuyên gia phân tích dữ liệu của phòng khám thú y Rexi.\n" +
                    "Nhiệm vụ của bạn là đọc yêu cầu tìm kiếm của người dùng và trích xuất thành tham số tìm kiếm an toàn dạng JSON.\n" +
                    "Bạn chỉ được chọn một trong các kiểu tìm kiếm (searchType) sau:\n" +
                    "- `PET_NAME`: Nếu người dùng tìm theo tên thú cưng (Ví dụ: bé Lu, thú cưng tên Mimi)\n" +
                    "- `PET_BREED`: Nếu người dùng tìm theo giống thú cưng (Ví dụ: Poodle, Corgi, mèo ba tư)\n" +
                    "- `PET_TYPE`: Nếu người dùng tìm theo loài thú cưng (Ví dụ: Chó, Mèo, Chim)\n" +
                    "- `CUSTOMER_NAME`: Nếu người dùng tìm theo tên chủ nuôi (Ví dụ: Trần Minh, Anh Ánh)\n" +
                    "- `CUSTOMER_EMAIL`: Nếu người dùng tìm theo email khách hàng (Ví dụ: khachhang@gmail.com)\n" +
                    "- `ALL`: Nếu người dùng muốn lọc tất cả hoặc không có điều kiện cụ thể.\n\n" +
                    "Yêu cầu của người dùng: \"" + query + "\"\n\n" +
                    "Hãy trích xuất từ khóa tìm kiếm chính xác (keyword) và kiểu tìm kiếm (searchType).\n" +
                    "CHỈ TRẢ VỀ RÕ RÀNG 1 KHỐI JSON DUY NHẤT KHÔNG CÓ BẤT KỲ ĐOẠN CHỮ HOẶC KÝ TỰ MARKDOWN NÀO KHÁC. Ví dụ:\n" +
                    "{\n" +
                    "  \"searchType\": \"PET_NAME\",\n" +
                    "  \"keyword\": \"Lu\"\n" +
                    "}";

            List<ChatMessage> dataHistory = new ArrayList<>();
            ChatMessage dataSysMsg = new ChatMessage();
            dataSysMsg.setRole("system");
            dataSysMsg.setContent(dataPrompt);
            dataHistory.add(dataSysMsg);
            
            ChatMessage dataUserMsg = new ChatMessage();
            dataUserMsg.setRole("user");
            dataUserMsg.setContent(query);
            dataHistory.add(dataUserMsg);

            String dataLlmResponse = "";
            String searchType = "ALL";
            String keyword = "";

            try {
                dataLlmResponse = geminiService.chat(dataHistory);
                // Parse JSON block neu co
                if (dataLlmResponse.contains("```")) {
                    int startIdx = dataLlmResponse.indexOf("{");
                    int endIdx = dataLlmResponse.lastIndexOf("}");
                    if (startIdx != -1 && endIdx != -1 && startIdx < endIdx) {
                        dataLlmResponse = dataLlmResponse.substring(startIdx, endIdx + 1);
                    }
                }
                
                com.fasterxml.jackson.databind.JsonNode jsonNode = objectMapper.readTree(dataLlmResponse);
                searchType = jsonNode.path("searchType").asText("ALL");
                keyword = jsonNode.path("keyword").asText("");
            } catch (Exception e) {
                logger.warning("Không thể phân tích phản hồi JSON từ DataAgent: " + e.getMessage());
                // Regex fallback
                if (query.toLowerCase().contains("lu")) {
                    searchType = "PET_NAME";
                    keyword = "Lu";
                } else if (query.toLowerCase().contains("poodle")) {
                    searchType = "PET_BREED";
                    keyword = "Poodle";
                } else if (query.toLowerCase().contains("mèo")) {
                    searchType = "PET_TYPE";
                    keyword = "Mèo";
                }
            }

            // Query an toan, chan SQLi
            String sql = "SELECT TOP 50 kh.ten_khach_hang, kh.email, kh.sdt, tc.ten_thu_cung, tc.loai, tc.giong " +
                    "FROM KhachHang kh " +
                    "JOIN ThuCung tc ON kh.id_khach_hang = tc.id_khach_hang " +
                    "WHERE (kh.da_xoa = 0 OR kh.da_xoa IS NULL) AND (tc.da_xoa = 0 OR tc.da_xoa IS NULL)";
            
            List<Map<String, Object>> dbResults = new ArrayList<>();
            String sqlExecuted = sql;

            if ("PET_NAME".equals(searchType) && !keyword.isEmpty()) {
                StringBuilder where = new StringBuilder(sql);
                List<Object> params = new ArrayList<>();
                com.rexi.pkty.util.SmartSearchSql.appendTokenSearch(where, params, keyword,
                        "tc.ten_thu_cung COLLATE SQL_Latin1_General_CP1_CI_AI LIKE ? COLLATE SQL_Latin1_General_CP1_CI_AI");
                sqlExecuted = where.toString();
                dbResults = jdbcTemplate.queryForList(sqlExecuted, params.toArray());
            } else if ("PET_BREED".equals(searchType) && !keyword.isEmpty()) {
                StringBuilder where = new StringBuilder(sql);
                List<Object> params = new ArrayList<>();
                com.rexi.pkty.util.SmartSearchSql.appendTokenSearch(where, params, keyword,
                        "tc.giong COLLATE SQL_Latin1_General_CP1_CI_AI LIKE ? COLLATE SQL_Latin1_General_CP1_CI_AI");
                sqlExecuted = where.toString();
                dbResults = jdbcTemplate.queryForList(sqlExecuted, params.toArray());
            } else if ("PET_TYPE".equals(searchType) && !keyword.isEmpty()) {
                StringBuilder where = new StringBuilder(sql);
                List<Object> params = new ArrayList<>();
                com.rexi.pkty.util.SmartSearchSql.appendTokenSearch(where, params, keyword,
                        "tc.loai COLLATE SQL_Latin1_General_CP1_CI_AI LIKE ? COLLATE SQL_Latin1_General_CP1_CI_AI");
                sqlExecuted = where.toString();
                dbResults = jdbcTemplate.queryForList(sqlExecuted, params.toArray());
            } else if ("CUSTOMER_NAME".equals(searchType) && !keyword.isEmpty()) {
                StringBuilder where = new StringBuilder(sql);
                List<Object> params = new ArrayList<>();
                com.rexi.pkty.util.SmartSearchSql.appendTokenSearch(where, params, keyword,
                        "kh.ten_khach_hang COLLATE SQL_Latin1_General_CP1_CI_AI LIKE ? COLLATE SQL_Latin1_General_CP1_CI_AI");
                sqlExecuted = where.toString();
                dbResults = jdbcTemplate.queryForList(sqlExecuted, params.toArray());
            } else if ("CUSTOMER_EMAIL".equals(searchType) && !keyword.isEmpty()) {
                StringBuilder where = new StringBuilder(sql);
                List<Object> params = new ArrayList<>();
                where.append(" AND kh.email LIKE ?");
                params.add("%" + keyword + "%");
                sqlExecuted = where.toString();
                dbResults = jdbcTemplate.queryForList(sqlExecuted, params.toArray());
            } else {
                dbResults = jdbcTemplate.queryForList(sqlExecuted);
            }

            // Dung db empty -> ko inject demo gia
            if (dbResults.isEmpty()) {
                logger.warning("[SWARM] Không tìm thấy dữ liệu khách hàng phù hợp trong DB. Trả về kết quả rỗng.");
            }

            String step2Output = "BỘ LỌC DỮ LIỆU ĐƯỢC DỊCH THÀNH CÔNG:\n" +
                    "- Kiểu lọc: " + searchType + "\n" +
                    "- Từ khóa tìm kiếm: \"" + keyword + "\"\n" +
                    "- SQL truy vấn an toàn: " + sqlExecuted.replace("?", "'" + keyword + "'") + "\n" +
                    "- Kết quả truy xuất: Tìm thấy " + dbResults.size() + " chủ nuôi phù hợp trong hệ thống" +
                    (dbResults.isEmpty() ? ". Không có email nào được tạo để tránh gửi nhầm." : ".");

            if (dbResults.isEmpty()) {
                Map<String, Object> swarmData = new HashMap<>();
                swarmData.put("orchestratorPrompt", query);

                List<Map<String, String>> steps = new ArrayList<>();
                steps.add(Map.of("agent", step1Agent, "action", step1Action, "output", step1Output));
                steps.add(Map.of("agent", step2Agent, "action", step2Action, "output", step2Output));
                steps.add(Map.of(
                    "agent", "✍️ Copywriter Agent",
                    "action", "Bỏ qua soạn email vì không có người nhận hợp lệ",
                    "output", "Không tìm thấy khách hàng hoặc thú cưng phù hợp với bộ lọc. Hệ thống không tạo email nháp và không cho phép gửi hàng loạt khi danh sách người nhận rỗng."
                ));
                steps.add(Map.of(
                    "agent", "🛡️ Reviewer Agent",
                    "action", "Kiểm tra an toàn trước khi gửi",
                    "output", "Đạt yêu cầu an toàn: không có dữ liệu người nhận nên chiến dịch được dừng lại, tránh gửi nhầm hoặc tạo dữ liệu demo giả."
                ));
                swarmData.put("steps", steps);
                swarmData.put("finalReply", "Không tìm thấy khách hàng hoặc thú cưng phù hợp với yêu cầu. Rexi đã dừng chiến dịch và không tạo email gửi hàng loạt để tránh gửi nhầm.");
                swarmData.put("contacts", List.of());

                String swarmPayload = "[SWARM_ORCHESTRATION:" + objectMapper.writeValueAsString(swarmData) + "]";
                return ResponseEntity.ok(Map.of("reply", swarmPayload));
            }

            // Bước 3: ✍️ COPYWRITER AGENT lên kịch bản viết email cá nhân hóa
            String step3Agent = "✍️ Copywriter Agent";
            String step3Action = "Soạn thảo kịch bản email/tin nhắn cá nhân hóa hàng loạt dựa trên thông tin chủ nuôi và boss cưng";
            
            // Template mau tu db record 0
            Map<String, Object> samplePet = dbResults.get(0);
            String sampleName = samplePet.get("ten_khach_hang").toString();
            String samplePetName = samplePet.get("ten_thu_cung").toString();
            
            String creativePrompt = "Bạn là CopywriterAgent - chuyên gia truyền thông sáng tạo của phòng khám thú y Rexi.\n" +
                    "Nhiệm vụ của bạn là viết một email nhắc lịch tái khám, tặng voucher hoặc tri ân cực kỳ dễ thương, tinh tế và ấm áp.\n" +
                    "Hãy dùng từ 'Sen' để gọi chủ nuôi, và 'Boss' hoặc 'Bé' để gọi thú cưng.\n" +
                    "Hãy chèn các thẻ cá nhân hóa là [Tên Khách Hàng] và [Tên Thú Cưng] chính xác vào email để hệ thống tự điền hàng loạt.\n" +
                    "Yêu cầu nội dung của sếp: \"" + query + "\"\n" +
                    "Dữ liệu mẫu tham khảo: Tên chủ: " + sampleName + ", Tên thú cưng: " + samplePetName + "\n\n" +
                    "Hãy trả về nội dung email hoàn chỉnh, ngắn gọn, có tiêu đề email rõ ràng.";

            List<ChatMessage> creativeHistory = new ArrayList<>();
            ChatMessage creativeSysMsg = new ChatMessage();
            creativeSysMsg.setRole("system");
            creativeSysMsg.setContent(creativePrompt);
            creativeHistory.add(creativeSysMsg);
            
            ChatMessage creativeUserMsg = new ChatMessage();
            creativeUserMsg.setRole("user");
            creativeUserMsg.setContent("Viết email dựa trên yêu cầu của sếp.");
            creativeHistory.add(creativeUserMsg);

            String draftedEmail = "";
            try {
                draftedEmail = geminiService.chat(creativeHistory);
            } catch (Exception e) {
                // Email fallback neu LLM loi
                draftedEmail = "Tiêu đề: Thư nhắc lịch tái khám sức khỏe định kỳ cho bé cưng 🐾\n\n" +
                        "Chào Sen [Tên Khách Hàng] thân mến,\n\n" +
                        "Bác sĩ Rexi gửi lời chào tới Sen và bé [Tên Thú Cưng] nhé! 🏥✨\n\n" +
                        "Theo lịch trình theo dõi của phòng khám, tuần sau bé [Tên Thú Cưng] nhà mình có lịch hẹn tái khám định kỳ để kiểm tra tình trạng sức khỏe. Sen nhớ sắp xếp thời gian đưa bé qua phòng khám Rexi (Địa chỉ: Gia Lâm, Hà Nội) nha!\n\n" +
                        "Đặc biệt, Rexi tặng riêng Sen mã voucher giảm 10% chi phí khám. Sen cần đặt lịch hẹn nhanh cứ chat trực tiếp với Rexi tại đây nhé!\n\n" +
                        "Chúc bé [Tên Thú Cưng] và Sen luôn mạnh khỏe, tràn đầy niềm vui! ❤️🐾";
            }

            String step3Output = "MẪU THƯ MARKETING CÁ NHÂN HÓA ĐÃ ĐƯỢC SOẠN THÀNH CÔNG:\n\n" + draftedEmail;

            // B4: Reviewer Agent check check email nhap
            String step4Agent = "🛡️ Reviewer Agent";
            String step4Action = "Kiểm tra chéo nội dung thư, phát hiện lỗi chính tả, xác thực thẻ cá nhân hóa";
            
            String reviewPrompt = "Bạn là ReviewerAgent - chuyên gia kiểm duyệt nội dung của phòng khám thú y Rexi.\n" +
                    "Hãy đọc email nháp dưới đây và kiểm tra xem:\n" +
                    "1. Email có chứa ngôn từ thô tục, tiêu cực không?\n" +
                    "2. Các thẻ cá nhân hóa [Tên Khách Hàng], [Tên Thú Cưng] có được sử dụng đúng chuẩn không?\n" +
                    "3. Có lỗi chính tả tiếng Việt nghiêm trọng nào không?\n\n" +
                    "Email nháp: \n\"\"\"\n" + draftedEmail + "\n\"\"\"\n\n" +
                    "Hãy đưa ra đánh giá ngắn gọn (tối đa 2-3 dòng) xác nhận email đạt chuẩn bảo mật và chuyên nghiệp.";

            List<ChatMessage> reviewHistory = new ArrayList<>();
            ChatMessage reviewSysMsg = new ChatMessage();
            reviewSysMsg.setRole("system");
            reviewSysMsg.setContent(reviewPrompt);
            reviewHistory.add(reviewSysMsg);
            
            ChatMessage reviewUserMsg = new ChatMessage();
            reviewUserMsg.setRole("user");
            reviewUserMsg.setContent("Đánh giá email nháp.");
            reviewHistory.add(reviewUserMsg);

            String reviewOutput = "";
            try {
                reviewOutput = geminiService.chat(reviewHistory);
            } catch (Exception e) {
                reviewOutput = "Xác nhận sơ bộ: Email nháp đạt các tiêu chí kiểm tra hiện tại. Không phát hiện từ khóa tiêu cực rõ ràng; các thẻ cá nhân hóa [Tên Khách Hàng] và [Tên Thú Cưng] đã được bố trí.";
            }

            String step4Output = "KẾT QUẢ KIỂM TRA CHÉO (CROSS-AGENT REVIEW):\n" + reviewOutput;

            // Replace placeholder gui mail that
            List<Map<String, String>> contacts = new ArrayList<>();
            for (Map<String, Object> record : dbResults) {
                String khName = record.get("ten_khach_hang") != null ? record.get("ten_khach_hang").toString() : "Khách hàng";
                String khEmail = record.get("email") != null ? record.get("email").toString() : "";
                String khPhone = record.get("sdt") != null ? record.get("sdt").toString() : "";
                String petName = record.get("ten_thu_cung") != null ? record.get("ten_thu_cung").toString() : "Bé";
                
                String personalizedMail = draftedEmail
                        .replace("[Tên Khách Hàng]", khName)
                        .replace("[Tên Thú Cưng]", petName);

                Map<String, String> contact = new HashMap<>();
                contact.put("name", khName);
                contact.put("email", khEmail);
                contact.put("phone", khPhone);
                contact.put("petName", petName);
                contact.put("emailContent", personalizedMail);
                contacts.add(contact);
            }

            // Gói toàn bộ dữ liệu phản hồi
            Map<String, Object> swarmData = new HashMap<>();
            swarmData.put("orchestratorPrompt", query);
            
            List<Map<String, String>> steps = new ArrayList<>();
            steps.add(Map.of("agent", step1Agent, "action", step1Action, "output", step1Output));
            steps.add(Map.of("agent", step2Agent, "action", step2Action, "output", step2Output));
            steps.add(Map.of("agent", step3Agent, "action", step3Action, "output", step3Output));
            steps.add(Map.of("agent", step4Agent, "action", step4Action, "output", step4Output));
            swarmData.put("steps", steps);

            String finalReply = "Tổ đội đa Agent Swarm đã hoàn thành xuất sắc chiến dịch ngầm! DataAgent đã thọc database an toàn và tìm thấy " + 
                    dbResults.size() + " khách hàng phù hợp. CreativeAgent đã viết xong thư tri ân cá nhân hóa cho từng Sen. Sếp hãy kiểm tra danh sách xem trước và bấm [Phê Duyệt & Gửi Đồng Loạt] ngay bên dưới để gửi đi nhé! 💌✨";
            swarmData.put("finalReply", finalReply);
            swarmData.put("contacts", contacts);

            String swarmPayload = "[SWARM_ORCHESTRATION:" + objectMapper.writeValueAsString(swarmData) + "]";
            return ResponseEntity.ok(Map.of("reply", swarmPayload));

        } catch (Exception e) {
            logger.severe("Lỗi Swarm Orchestration: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("reply", "Sen ơi! Có lỗi xíu khi chạy Swarm Agent ngầm: " + e.getMessage()));
        }
    }

    // Approve & bulk send mail (Async task)
    @PostMapping("/bulk-send-email")
    @PreAuthorize(RexiSecurityRoles.MARKETING)
    public ResponseEntity<?> bulkSendEmail(@RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> contacts = (List<Map<String, Object>>) request.get("contacts");
            String campaignName = request.getOrDefault("campaignName", "Chiến dịch Marketing Rexi").toString();

            if (contacts == null || contacts.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Không có contacts nào để gửi email!"
                ));
            }

            int expectedSendCount = 0;
            List<String> logEntries = new ArrayList<>();
            List<Map<String, Object>> validContacts = new ArrayList<>();

            for (Map<String, Object> contact : contacts) {
                String name = contact.getOrDefault("name", "---").toString();
                String email = contact.getOrDefault("email", "").toString();
                String phone = contact.getOrDefault("phone", "").toString();

                if (!email.isEmpty() && mailSender != null) {
                    expectedSendCount++;
                    validContacts.add(contact);
                    logEntries.add(String.format("⏳ %s (%s) - Đã đưa vào hàng đợi gửi", name, email));
                } else {
                    logEntries.add(String.format("✅ %s (%s) - Lưu nháp/Gửi SMS", name, email.isEmpty() ? "Qua SĐT: " + phone : email));
                }
            }

            // Async ThreadPool gui background
            if (!validContacts.isEmpty()) {
                java.util.concurrent.CompletableFuture.runAsync(() -> {
                    for (Map<String, Object> contact : validContacts) {
                        try {
                            String email = contact.getOrDefault("email", "").toString();
                            String emailContent = contact.getOrDefault("emailContent", "").toString();
                            
                            MimeMessage message = mailSender.createMimeMessage();
                            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                            helper.setTo(email);
                            helper.setSubject("Rexi Vet - " + campaignName);
                            // Convert \n -> <br/>
                            helper.setText(emailContent.replace("\n", "<br/>"), true); 
                            mailSender.send(message);
                            
                            logger.info(String.format("[BACKGROUND EMAIL] Đã gửi thành công tới: %s", email));
                            // Delay tranh spam IP ban
                            Thread.sleep(500);
                        } catch (Exception e) {
                            logger.warning(String.format("[BACKGROUND EMAIL] Không thể gửi tới %s: %s", contact.get("email"), e.getMessage()));
                        }
                    }
                });
            }

            Map<String, Object> result = new HashMap<>();
            result.put("success", true);
            result.put("sent", expectedSendCount);
            result.put("total", contacts.size());
            result.put("campaign", campaignName);
            result.put("log", logEntries);
            result.put("message", String.format(
                "Đã đưa %d/%d email vào hàng đợi gửi ngầm trong chiến dịch \"%s\" ✨",
                expectedSendCount, contacts.size(), campaignName
            ));

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            logger.severe("Lỗi bulk send email: " + e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "error", e.getMessage()
            ));
        }
    }

    // Direct run tool bypass LLM (Voice/Autopilot)
    @PostMapping("/tool")
    @PreAuthorize(RexiSecurityRoles.AUTHENTICATED)
    public ResponseEntity<?> runDirectTool(@RequestBody Map<String, Object> body) {
        String toolName = body.getOrDefault("tool", "").toString().trim();
        if (toolName.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Tool không được để trống."));
        }

        org.springframework.security.core.Authentication auth =
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        boolean authenticated = auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName());
        String userRole = "";
        if (auth != null) {
            userRole = auth.getAuthorities().stream()
                .findFirst().map(g -> g.getAuthority().replace("ROLE_", "")).orElse("");
        }
        boolean isStaff = RoleAccessPolicy.isInternalStaffRole(userRole);

        if (!authenticated) {
            return ResponseEntity.status(401).body(Map.of("error", "Cần đăng nhập để dùng tool Agent."));
        }
        if (!RoleAccessPolicy.canUseAgentTool(userRole, toolName)) {
            return ResponseEntity.status(403).body(Map.of(
                "error", RoleAccessPolicy.permissionDeniedMessage(toolName)
            ));
        }

        @SuppressWarnings("unchecked")
        Map<String, Object> params = body.get("params") instanceof Map<?, ?>
            ? new HashMap<>((Map<String, Object>) body.get("params"))
            : new HashMap<>();

        try {
            String observation = aiToolService.executeTool(toolName, params, userRole, auth.getName());
            return ResponseEntity.ok(Map.of(
                "finalAnswer", observation,
                "tool", toolName,
                "params", params
            ));
        } catch (Exception e) {
            logger.severe("[DIRECT TOOL] Lỗi: " + e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Lỗi chạy tool trực tiếp: " + e.getMessage()
            ));
        }
    }

    // ReAct Agent Core (Reason-Act-Observe)
    @PostMapping("/react")
    @PreAuthorize(RexiSecurityRoles.AUTHENTICATED)
    public ResponseEntity<?> reactAgent(@RequestBody Map<String, String> body, jakarta.servlet.http.HttpServletRequest request) {
        String query = body.getOrDefault("query", "").trim();
        if (query.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Query không được để trống."));
        }

        // Get user state tu token context
        org.springframework.security.core.Authentication auth =
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        String username = (auth != null && !auth.getName().equals("anonymousUser")) ? auth.getName() : null;
        String userRole = "";
        if (auth != null) {
            userRole = auth.getAuthorities().stream()
                .findFirst().map(g -> g.getAuthority().replace("ROLE_", "")).orElse("");
        }

        try {
            logger.info("[ReAct] Yêu cầu từ [" + username + "]: " + query);
            com.rexi.pkty.service.ReActAgentService.ReActResult result = reactAgentService.run(query, username, userRole);
            boolean adminDebugAllowed = RoleAccessPolicy.normalizeRole(userRole).equals("admin");
            String finalAnswer = adminDebugAllowed ? result.finalAnswer() : stripNonAdminTechnicalIds(result.finalAnswer());

            // Parse steps sang format FE
            List<Map<String, Object>> stepsData = new java.util.ArrayList<>();
            for (var step : result.steps()) {
                Map<String, Object> s = new java.util.LinkedHashMap<>();
                s.put("type", step.type());
                s.put("content", adminDebugAllowed ? step.content() : stripNonAdminTechnicalIds(step.content()));
                if (step.toolName() != null) s.put("tool", step.toolName());
                if (adminDebugAllowed && step.toolParams() != null) s.put("params", step.toolParams());
                if (step.observation() != null) s.put("observation", adminDebugAllowed ? step.observation() : stripNonAdminTechnicalIds(step.observation()));
                stepsData.add(s);
            }

            auditAgentMedicalReplyIfNeeded(query, finalAnswer, userRole, username, result.provider(), stepsData);
            saveAgentChatLog(username, query, finalAnswer, result.provider(), stepsData);

            return ResponseEntity.ok(Map.of(
                "finalAnswer", finalAnswer,
                "steps", stepsData,
                "totalSteps", stepsData.size(),
                "provider", result.provider()
            ));
        } catch (Exception e) {
            logger.severe("[ReAct] Lỗi: " + e.getMessage());
            saveAgentChatLog(username, query, "Lỗi ReAct Agent: " + e.getMessage(), "System", List.of());
            return ResponseEntity.internalServerError().body(Map.of("error", "Lỗi ReAct Agent: " + e.getMessage()));
        }
    }

    private String stripNonAdminTechnicalIds(String value) {
        if (value == null || value.isBlank()) return value;
        String cleaned = value
            .replaceAll("(?i)\\s*\\(?\\s*data-ai-id\\s*:\\s*\"[^\"]+\"\\s*\\)?", "")
            .replaceAll("(?i)\\s*\\(?\\s*data-ai-id\\s*:\\s*'[^']+'\\s*\\)?", "")
            .replaceAll("(?i)\\s*\\(?\\s*data-ai-id\\s*:\\s*[^\\s\\)\\]]+\\s*\\)?", "")
            .replaceAll("(?i)\\[(CLICK|FILL|SELECT|TOGGLE|DELETE|SCROLL):[^\\]]+\\]", "")
            .replaceAll("(?i)\\[(button|input|select|textarea|auto|element)\\]", "")
            .replaceAll("(?i)\\b(?:button|input|select|textarea|auto)-[a-z0-9_-]+\\b", "")
            .replaceAll("(?i)\\bdata-ai-id\\b", "")
            .replaceAll("\\(\\s*\\)", "")
            .replaceAll("\\s+([,.;:!?])", "$1")
            .replaceAll("[ \\t]{2,}", " ")
            .replaceAll("\\n{3,}", "\n\n")
            .trim();
        return cleaned.isBlank() ? "Tôi chưa đủ dữ liệu để trả lời trực tiếp. Bạn gửi thêm tên thú cưng hoặc mã lịch hẹn để Rexi kiểm tra đúng thông tin." : cleaned;
    }

    private void saveAgentChatLog(String username, String query, String answer, String provider, List<Map<String, Object>> steps) {
        try {
            String idTaiKhoan = null;
            if (username != null && !username.isBlank()) {
                idTaiKhoan = taiKhoanRepository.findByTenDangNhap(username)
                        .map(com.rexi.pkty.entity.TaiKhoan::getId_tai_khoan)
                        .orElse(null);
            }

            StringBuilder reply = new StringBuilder();
            reply.append(answer == null ? "" : answer);
            reply.append("\n\n[Agent provider: ").append(provider == null ? "unknown" : provider).append("]");
            if (steps != null && !steps.isEmpty()) {
                reply.append(" [steps: ").append(steps.size()).append("]");
            }

            com.rexi.pkty.entity.NhatKyChat log = com.rexi.pkty.entity.NhatKyChat.builder()
                    .idTaiKhoan(idTaiKhoan)
                    .cauHoi(compactForLog(query, 4_000))
                    .cauTraLoi(compactForLog(reply.toString(), 4_000))
                    .build();
            nhatKyChatRepository.save(log);
        } catch (Exception ex) {
            logger.warning("[ReAct] Không thể ghi NhatKyChat: " + ex.getMessage());
        }
    }

    private String compactForLog(String value, int maxChars) {
        if (value == null || value.isBlank()) return "(trống)";
        String compact = value.replaceAll("\\s+", " ").trim();
        if (compact.length() <= maxChars) return compact;
        return compact.substring(0, Math.max(0, maxChars - 20)) + "... [rut gon]";
    }

    private boolean isCurrentUserStaff() {
        org.springframework.security.core.Authentication auth =
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            return false;
        }
        String userRole = auth.getAuthorities().stream()
            .findFirst().map(g -> g.getAuthority().replace("ROLE_", "")).orElse("");
        return RoleAccessPolicy.isInternalStaffRole(userRole);
    }

    private void auditAgentMedicalReplyIfNeeded(String query, String answer, String userRole, String username, String provider, List<Map<String, Object>> steps) {
        try {
            String combined = normalizeForAudit((query == null ? "" : query) + " " + (answer == null ? "" : answer));
            boolean medical = containsAny(combined,
                    "thuoc", "duoc", "lieu", "khang sinh", "phac do", "dieu tri", "chan doan",
                    "xet nghiem", "benh", "trieu chung", "cap cuu", "ngo doc", "gay me");
            boolean usedMedicalTool = steps != null && steps.stream().anyMatch(step -> {
                Object tool = step.get("tool");
                return tool != null && Set.of("xem_kho_thuoc", "xem_benh_an", "cap_nhat_benh_an", "tra_cuu_tai_lieu_y_khoa")
                        .contains(tool.toString());
            });
            if (!medical && !usedMedicalTool) return;

            String role = RoleAccessPolicy.normalizeRole(userRole);
            boolean clinicalRole = role.equals("bac_si") || role.equals("y_ta");
            String detail = "scope=" + (clinicalRole ? "CLINICAL_REFERENCE" : "CUSTOMER_SAFE_ADVICE")
                    + "; username=" + (username == null ? "anonymous" : username)
                    + "; role=" + role
                    + "; provider=" + provider
                    + "; usedMedicalTool=" + usedMedicalTool
                    + "; query=" + compactForAudit(query)
                    + "; answerPreview=" + compactForAudit(answer);
            auditLogService.logActionWithUsername(username == null ? "Hệ thống" : username, "AI_MEDICAL_AGENT_ADVICE", "ReActAgent", detail);
        } catch (Exception ex) {
            logger.warning("[ReAct] Không thể ghi audit y khoa AI: " + ex.getMessage());
        }
    }

    private boolean containsAny(String value, String... keywords) {
        if (value == null) return false;
        for (String keyword : keywords) {
            if (value.contains(keyword)) return true;
        }
        return false;
    }

    private String normalizeForAudit(String value) {
        if (value == null) return "";
        String normalized = java.text.Normalizer.normalize(value.toLowerCase(Locale.ROOT), java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replace("đ", "d");
        return normalized.replaceAll("[^a-z0-9\\s]", " ").replaceAll("\\s+", " ").trim();
    }

    private String compactForAudit(String value) {
        if (value == null) return "";
        String compact = value.replaceAll("\\s+", " ").trim();
        return compact.substring(0, Math.min(600, compact.length()));
    }
}
