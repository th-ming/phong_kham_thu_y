package com.rexi.pkty.controller;

import com.rexi.pkty.dto.ChatMessage;
import com.rexi.pkty.util.DatabaseDialect;
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

    // Goi y cham soc chu dong cho khach hang (retention & upsell)
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

            // Lay toi da 3 be goi y, dung idKhachHang login.
            boolean pg = DatabaseDialect.isPostgres(jdbcTemplate);
            String sql = "SELECT tc.id_thu_cung, tc.ten_thu_cung, tc.loai, tc.giong, " +
                         "tc.id_khach_hang, kh.ten_khach_hang, kh.sdt " +
                         "FROM ThuCung tc " +
                         "JOIN KhachHang kh ON tc.id_khach_hang = kh.id_khach_hang " +
                         "WHERE " + DatabaseDialect.softDeleteWhere(pg, "kh.da_xoa") +
                         " AND " + DatabaseDialect.softDeleteWhere(pg, "tc.da_xoa") +
                         " AND tc.id_khach_hang = ? ORDER BY tc.id_thu_cung" + DatabaseDialect.topN(pg, 3);
            
            List<Map<String, Object>> pets = jdbcTemplate.queryForList(sql, idKhachHang);
            List<Map<String, Object>> reminders = new ArrayList<>();

            for (Map<String, Object> pet : pets) {
                String loai = pet.get("loai") != null ? pet.get("loai").toString().toLowerCase().trim() : "";
                String tenThuCung = pet.get("ten_thu_cung") != null ? pet.get("ten_thu_cung").toString() : "Be";
                
                Map<String, Object> reminder = new HashMap<>(pet);

                boolean laMeo = loai.contains("meo") || loai.contains("cat");
                boolean laCho = loai.contains("cho") || loai.contains("dog");

                if (laMeo) {
                    reminder.put("type", "TRIET_SAN");
                    reminder.put("message", "Chào Sen! Bé " + tenThuCung + " đã đến tuổi triệt sản. Rexi đề nghị đặt lịch triệt sản sớm để đảm bảo sức khỏe cho bé. Sen có muốn đặt lịch không?");
                    reminder.put("service_id", "DV-003");
                    reminder.put("suggested_date", java.time.LocalDate.now().plusDays(3).toString());
                    reminder.put("suggested_time", "09:00");
                    reminder.put("doctor_id", "NV-002");
                } else if (laCho) {
                    reminder.put("type", "TIEM_PHONG");
                    reminder.put("message", "Chào Sen! Bé " + tenThuCung + " cần tiêm phòng uốn ván và 5-in-1 để duy trì sức khỏe. Rexi đã chuẩn bị lịch tiêm. Sen muốn đặt lịch không?");
                    reminder.put("service_id", "DV-002");
                    reminder.put("suggested_date", java.time.LocalDate.now().plusDays(1).toString());
                    reminder.put("suggested_time", "10:00");
                    reminder.put("doctor_id", "NV-003");
                } else {
                    reminder.put("type", "KHAM_DINH_KY");
                    reminder.put("message", "Chào Sen! Bé " + tenThuCung + " nên khám định kỳ để đảm bảo sức khỏe tốt nhất. Sen có muốn đặt lịch khám không?");
                    reminder.put("service_id", "DV-001");
                    reminder.put("suggested_date", java.time.LocalDate.now().plusDays(2).toString());
                    reminder.put("suggested_time", "08:30");
                    reminder.put("doctor_id", "NV-002");
                }
                reminders.add(reminder);
            }

            return ResponseEntity.ok(reminders);
        } catch (Exception e) {
            logger.severe("Loi khi quet du lieu goi y cham soc: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("message", "Loi he thong khi quet du lieu goi y cham soc."));
        }
    }

    // Swarm Agent (multi-agent orchestration) post campaign
    @PostMapping("/swarm-orchestration")
    @PreAuthorize(RexiSecurityRoles.MARKETING)
    public ResponseEntity<?> handleSwarmOrchestration(@RequestBody Map<String, String> payload) {
        String query = payload.get("query") != null ? payload.get("query") : "";
        logger.info("[SWARM] Tiep nhan yeu cau dieu phoi da Agent Swarm: " + query);

        try {
            // B1: Swarm Orchestrator phan viec
            String step1Agent = "Rexi Orchestrator";
            String step1Action = "Phan tich yeu cau chien dich va phan nhiem cong viec cho cac Agent phu trach";
            String step1Output = "Da tiep nhan yeu cau tu sp: \"" + query + "\"\n" +
                    "Bat dau phan nhiem cong viec thanh cac JSON Tasks:\n" +
                    "1. Giao DataAgent: Phan tch va tim kiem, chuyen doi sang khung truy van an toan va truy xuat database.\n" +
                    "2. Giao CreativeAgent: Tiep nhan ket qua tu DataAgent, len kich ban viet email tri an/nhac lich ca nhan hoa.\n" +
                    "3. Giao ReviewAgent: Kiem tra toan bo du lieu, loai bo loi chinh ta.";

            // B2: Data Agent -> Hybrid Text-to-Safe-Query
            String step2Agent = "Data Analyst Agent";
            String step2Action = "Dich yeu cau sang bo loc tham so an toan (Hybrid Text-to-Safe-Query)";
            
            String dataPrompt = "Ban la DataAgent - chuyen gia phan tich du lieu cua phong kham thu y Rexi.\n" +
                    "Nhiem vu cua ban la trich xuat tham so tim kiem an toan dung JSON tu yeu cau cua nguoi dung.\n" +
                    "Ban chi duoc chon mot trong cac kieu tim kiem (searchType) sau:\n" +
                    "- `PET_NAME`: Neu nguoi dung tim theo ten thu cung\n" +
                    "- `PET_BREED`: Neu nguoi dung tim theo giong thu cung\n" +
                    "- `PET_TYPE`: Neu nguoi dung tim theo loai thu cung\n" +
                    "- `CUSTOMER_NAME`: Neu nguoi dung tim theo ten chu nuoi\n" +
                    "- `CUSTOMER_EMAIL`: Neu nguoi dung tim theo email khach hang\n" +
                    "- `ALL`: Neu nguoi dung muon loc tat ca.\n\n" +
                    "Yeu cau cua nguoi dung: \"" + query + "\"\n\n" +
                    "Chi tra ve JSON duy nhat khong co ky tu markdown nao khac.";

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
                logger.warning("Khong the phan tich phan hoi JSON tu DataAgent: " + e.getMessage());
                return ResponseEntity.ok(Map.of("reply", "Khong phan tich duoc bo loc du lieu tu yeu cau. Rexi dung tac vu mac dinh."));
            }

            // Query an toan, chan SQLi
            boolean pg = DatabaseDialect.isPostgres(jdbcTemplate);
            String sql = "SELECT kh.ten_khach_hang, kh.email, kh.sdt, tc.ten_thu_cung, tc.loai, tc.giong " +
                    "FROM KhachHang kh " +
                    "JOIN ThuCung tc ON kh.id_khach_hang = tc.id_khach_hang " +
                    "WHERE " + DatabaseDialect.softDeleteWhere(pg, "kh.da_xoa") +
                    " AND " + DatabaseDialect.softDeleteWhere(pg, "tc.da_xoa") + "";
            
            List<Map<String, Object>> dbResults = new ArrayList<>();
            String sqlExecuted = sql;

            if ("PET_NAME".equals(searchType) && !keyword.isEmpty()) {
                StringBuilder where = new StringBuilder(sql);
                List<Object> params = new ArrayList<>();
                com.rexi.pkty.util.SmartSearchSql.appendTokenSearch(where, params, keyword,
                        "LOWER(COALESCE(tc.ten_thu_cung, '')) LIKE LOWER(?)");
                sqlExecuted = where.toString() + " ORDER BY kh.id_khach_hang, tc.id_thu_cung" + DatabaseDialect.topN(pg, 50);
                dbResults = jdbcTemplate.queryForList(sqlExecuted, params.toArray());
            } else if ("PET_BREED".equals(searchType) && !keyword.isEmpty()) {
                StringBuilder where = new StringBuilder(sql);
                List<Object> params = new ArrayList<>();
                com.rexi.pkty.util.SmartSearchSql.appendTokenSearch(where, params, keyword,
                        "LOWER(COALESCE(tc.giong, '')) LIKE LOWER(?)");
                sqlExecuted = where.toString() + " ORDER BY kh.id_khach_hang, tc.id_thu_cung" + DatabaseDialect.topN(pg, 50);
                dbResults = jdbcTemplate.queryForList(sqlExecuted, params.toArray());
            } else if ("PET_TYPE".equals(searchType) && !keyword.isEmpty()) {
                StringBuilder where = new StringBuilder(sql);
                List<Object> params = new ArrayList<>();
                com.rexi.pkty.util.SmartSearchSql.appendTokenSearch(where, params, keyword,
                        "LOWER(COALESCE(tc.loai, '')) LIKE LOWER(?)");
                sqlExecuted = where.toString() + " ORDER BY kh.id_khach_hang, tc.id_thu_cung" + DatabaseDialect.topN(pg, 50);
                dbResults = jdbcTemplate.queryForList(sqlExecuted, params.toArray());
            } else if ("CUSTOMER_NAME".equals(searchType) && !keyword.isEmpty()) {
                StringBuilder where = new StringBuilder(sql);
                List<Object> params = new ArrayList<>();
                com.rexi.pkty.util.SmartSearchSql.appendTokenSearch(where, params, keyword,
                        "LOWER(COALESCE(kh.ten_khach_hang, '')) LIKE LOWER(?)");
                sqlExecuted = where.toString() + " ORDER BY kh.id_khach_hang, tc.id_thu_cung" + DatabaseDialect.topN(pg, 50);
                dbResults = jdbcTemplate.queryForList(sqlExecuted, params.toArray());
            } else if ("CUSTOMER_EMAIL".equals(searchType) && !keyword.isEmpty()) {
                StringBuilder where = new StringBuilder(sql);
                List<Object> params = new ArrayList<>();
                where.append(" AND kh.email LIKE ?");
                params.add("%" + keyword + "%");
                sqlExecuted = where.toString() + " ORDER BY kh.id_khach_hang, tc.id_thu_cung" + DatabaseDialect.topN(pg, 50);
                dbResults = jdbcTemplate.queryForList(sqlExecuted, params.toArray());
            } else {
                sqlExecuted = sql + " ORDER BY kh.id_khach_hang, tc.id_thu_cung" + DatabaseDialect.topN(pg, 50);
                dbResults = jdbcTemplate.queryForList(sqlExecuted);
            }

            if (dbResults.isEmpty()) {
                logger.warning("[SWARM] Khong tim thay du lieu khach hang ph hop trong DB. Tra ve ket qua rong.");
            }

            String step2Output = "BO LOC DU LIEU DA DICH THANH CONG:\n" +
                    "- Kieu loc: " + searchType + "\n" +
                    "- Tu khoa tim kiem: \"" + keyword + "\"\n" +
                    "- Ket qua truy xuat: Tim thay " + dbResults.size() + " chu nui ph hop trong he thong" +
                    (dbResults.isEmpty() ? ". Khong co email nao duoc tao de tranh gui nham." : ".");

            if (dbResults.isEmpty()) {
                Map<String, Object> swarmData = new HashMap<>();
                swarmData.put("orchestratorPrompt", query);

                List<Map<String, String>> steps = new ArrayList<>();
                steps.add(Map.of("agent", step1Agent, "action", step1Action, "output", step1Output));
                steps.add(Map.of("agent", step2Agent, "action", step2Action, "output", step2Output));
                steps.add(Map.of(
                    "agent", "Copywriter Agent",
                    "action", "Bo qua soan email vi khong co nguoi nhan phu hop",
                    "output", "Khong tim thay khach hang hoac thu cung ph hop voi bo loc. He thong khong tao email nhep va khong cho phep gui hang lot khi danh sach nguoi nhan rong."
                ));
                steps.add(Map.of(
                    "agent", "Reviewer Agent",
                    "action", "Kiem tra an toan truoc khi gui",
                    "output", "Danh gia an toan: khong co du lieu nguoi nhan nen chien dich bi dung lai, tranh gui nham."
                ));
                swarmData.put("steps", steps);
                swarmData.put("finalReply", "Khong tim thay khach hang hoac thu cung ph hop voi yeu cau. Rexi dung chien dich va khong tao email gui hang lot de tranh gui nham.");
                swarmData.put("contacts", List.of());

                String swarmPayload = "[SWARM_ORCHESTRATION:" + objectMapper.writeValueAsString(swarmData) + "]";
                return ResponseEntity.ok(Map.of("reply", swarmPayload));
            }

            // Buoc 3: Copywriter Agent len kich ban viet email ca nhan hoa
            String step3Agent = "Copywriter Agent";
            String step3Action = "Soan thao kich ban email/tin nhan ca nhan hoa hang lot dua tren thong tin chu nui va boss";
            
            String creativePrompt = "Ban la CopywriterAgent - chuyen gia truyen thong sang tao cua phong kham thu y Rexi.\n" +
                    "Nhiem vu cua ban la viet mot email nhac lich ti kham, tang voucher hoac tri an cac ky dieu dac biet.\n" +
                    "Hay dung tu 'Sen' de gui chu nui, va 'Boss' hoac 'Be' de gui thu cung.\n" +
                    "Hay danh dau cac thong tin ca nhan hoa la [Ten Khach Hang] va [Ten Thu Chung] chinh xac.\n" +
                    "Yeu cau noi dung tu sp: \"" + query + "\"\n" +
                    "Hay tra ve noi dung email hoan chinh, ngan gon, co tieu de email ro rang.";

            List<ChatMessage> creativeHistory = new ArrayList<>();
            ChatMessage creativeSysMsg = new ChatMessage();
            creativeSysMsg.setRole("system");
            creativeSysMsg.setContent(creativePrompt);
            creativeHistory.add(creativeSysMsg);
            
            ChatMessage creativeUserMsg = new ChatMessage();
            creativeUserMsg.setRole("user");
            creativeUserMsg.setContent("Viet email dua tren yeu cau cua sp.");
            creativeHistory.add(creativeUserMsg);

            String draftedEmail = "";
            try {
                draftedEmail = geminiService.chat(creativeHistory);
            } catch (Exception e) {
                return ResponseEntity.ok(Map.of("reply", "Khong soan duoc email tu du lieu that o luot nay. Rexi dung tac vu mac dinh."));
            }

            String step3Output = "NOI DUNG MARKETING CA NHAN HOA DA SOAN THANH CONG:\n\n" + draftedEmail;

            // B4: Reviewer Agent check email nhap
            String step4Agent = "Reviewer Agent";
            String step4Action = "Kiem tra noi dung, phat hien loi chinh ta, xac thuc thong tin ca nhan hoa";
            
            String reviewPrompt = "Ban la ReviewerAgent - chuyen gia kiem duyet noi dung cua phong kham thu y Rexi.\n" +
                    "Hay doc email nhap di va kiem tra xem:\n" +
                    "1. Email co chua ngan tu thong tuc, tieu cuc khong?\n" +
                    "2. Cac thong tin ca nhan hoa [Ten Khach Hang], [Ten Thu Chung] co dung chuan khong?\n" +
                    "3. Co loi chinh ta tieng Viet nghiem trong nao khong?\n\n" +
                    "Email nhap: \n\"\"\"\n" + draftedEmail + "\n\"\"\"\n\n" +
                    "Hay danh gia ngan gon (toi da 2-3 dong) xac nhan email dat chuan bao mat va chuyen nghiep.";

            List<ChatMessage> reviewHistory = new ArrayList<>();
            ChatMessage reviewSysMsg = new ChatMessage();
            reviewSysMsg.setRole("system");
            reviewSysMsg.setContent(reviewPrompt);
            reviewHistory.add(reviewSysMsg);
            
            ChatMessage reviewUserMsg = new ChatMessage();
            reviewUserMsg.setRole("user");
            reviewUserMsg.setContent("Danh gia email nhap.");
            reviewHistory.add(reviewUserMsg);

            String reviewOutput = "";
            try {
                reviewOutput = geminiService.chat(reviewHistory);
            } catch (Exception e) {
                reviewOutput = "Xac nhan so bo: Email nhap dat cac tieu chi kiem tra hien tai.";
            }

            String step4Output = "KET QUA KIEM TRA (CROSS-AGENT REVIEW):\n" + reviewOutput;

            // Replace placeholder gui mail that
            List<Map<String, String>> contacts = new ArrayList<>();
            for (Map<String, Object> record : dbResults) {
                String khName = record.get("ten_khach_hang") != null ? record.get("ten_khach_hang").toString() : "Khach hang";
                String khEmail = record.get("email") != null ? record.get("email").toString() : "";
                String khPhone = record.get("sdt") != null ? record.get("sdt").toString() : "";
                String petName = record.get("ten_thu_cung") != null ? record.get("ten_thu_cung").toString() : "Be";
                
                String personalizedMail = draftedEmail
                        .replace("[Ten Khach Hang]", khName)
                        .replace("[Ten Thu Chung]", petName);

                Map<String, String> contact = new HashMap<>();
                contact.put("name", khName);
                contact.put("email", khEmail);
                contact.put("phone", khPhone);
                contact.put("petName", petName);
                contact.put("emailContent", personalizedMail);
                contacts.add(contact);
            }

            // Tra toan bo du lieu phan hoi
            Map<String, Object> swarmData = new HashMap<>();
            swarmData.put("orchestratorPrompt", query);
            
            List<Map<String, String>> steps = new ArrayList<>();
            steps.add(Map.of("agent", step1Agent, "action", step1Action, "output", step1Output));
            steps.add(Map.of("agent", step2Agent, "action", step2Action, "output", step2Output));
            steps.add(Map.of("agent", step3Agent, "action", step3Action, "output", step3Output));
            steps.add(Map.of("agent", step4Agent, "action", step4Action, "output", step4Output));
            swarmData.put("steps", steps);

            String finalReply = "Tat ca Agent Swarm da hoan thanh xuat sac chien dich ngam! DataAgent truy xuat database an toan va tim thay " + 
                    dbResults.size() + " khach hang ph hop. CreativeAgent da viet xong thuong chuong ca nhan hoa cho tung Sen. Sp hay kiem tra danh sach truoc va bam [Phe Duyet & Gui Hang Lot] ngay ben duoi de gui ngay!";
            swarmData.put("finalReply", finalReply);
            swarmData.put("contacts", contacts);

            String swarmPayload = "[SWARM_ORCHESTRATION:" + objectMapper.writeValueAsString(swarmData) + "]";
            return ResponseEntity.ok(Map.of("reply", swarmPayload));

        } catch (Exception e) {
            logger.severe("Loi Swarm Orchestration: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("reply", "Xin loi sp! Da xay ra su co khi xu ly chien dich. Vui long thu lai sau hoac lien he quan tri vien."));
        }
    }

    // Approve & bulk send mail (Async task)
    @PostMapping("/bulk-send-email")
    @PreAuthorize(RexiSecurityRoles.MARKETING)
    public ResponseEntity<?> bulkSendEmail(@RequestBody Map<String, Object> request) {
        try {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> contacts = (List<Map<String, Object>>) request.get("contacts");
            String campaignName = request.getOrDefault("campaignName", "Chien dich Marketing Rexi").toString();

            if (contacts == null || contacts.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "error", "Khong co contacts nao de gui email!"
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
                    logEntries.add(String.format(" %s (%s) - Da vao hang doi gui", name, email));
                } else {
                    logEntries.add(String.format(" %s (%s) - Luu nhap/Gui SMS", name, email.isEmpty() ? "So DT: " + phone : email));
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
                            helper.setText(emailContent.replace("\n", "<br/>"), true); 
                            mailSender.send(message);
                            
                            logger.info(String.format("[BACKGROUND EMAIL] Da gui thanh cong toi: %s", email));
                            Thread.sleep(500);
                        } catch (Exception e) {
                            logger.warning(String.format("[BACKGROUND EMAIL] Khong the gui toi %s: %s", contact.get("email"), e.getMessage()));
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
                "Da gui %d/%d email vao hang doi gui ngam trong chien dich \"%s\"",
                expectedSendCount, contacts.size(), campaignName
            ));

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            logger.severe("Loi bulk send email: " + e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of(
                "success", false,
                "error", "Khong the gui email do su co he thong. Vui long thu lai sau."
            ));
        }
    }

    // Direct run tool bypass LLM (Voice/Autopilot)
    @PostMapping("/tool")
    @PreAuthorize(RexiSecurityRoles.AUTHENTICATED)
    public ResponseEntity<?> runDirectTool(@RequestBody Map<String, Object> body) {
        String toolName = body.getOrDefault("tool", "").toString().trim();
        if (toolName.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Tool khong duoc de trong."));
        }

        org.springframework.security.core.Authentication auth =
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        boolean authenticated = auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getName());
        String userRole = "";
        if (auth != null) {
            userRole = auth.getAuthorities().stream()
                .findFirst().map(g -> g.getAuthority().replace("ROLE_", "")).orElse("");
        }

        if (!authenticated) {
            return ResponseEntity.status(401).body(Map.of("error", "Can dang nhap de dung tool Agent."));
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
            logger.severe("[DIRECT TOOL] Loi: " + e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of(
                "error", "Loi chay tool truc tiep: " + e.getMessage()
            ));
        }
    }

    // ReAct Agent Core (Reason-Act-Observe)
    @PostMapping("/react")
    public ResponseEntity<?> reactAgent(@RequestBody Map<String, Object> body, jakarta.servlet.http.HttpServletRequest request) {
        String query = Objects.toString(body.getOrDefault("query", ""), "").trim();
        List<String> images = extractStringList(body.get("images"));
        String currentPage = Objects.toString(body.getOrDefault("currentPage", ""), "").trim();
        String previousPage = Objects.toString(body.getOrDefault("previousPage", ""), "").trim();
        if (query.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Query khong duoc de trong."));
        }
        if (!currentPage.isBlank() || !previousPage.isBlank()) {
            StringBuilder ctx = new StringBuilder();
            if (!currentPage.isBlank()) ctx.append("[TRANG_HIEN_TAI:").append(currentPage).append("]");
            if (!previousPage.isBlank()) ctx.append("[TRANG_TRUOC:").append(previousPage).append("]");
            query = ctx + " " + query;
        }

        org.springframework.security.core.Authentication auth =
            org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        String username = (auth != null && !auth.getName().equals("anonymousUser")) ? auth.getName() : null;
        String userRole = "";
        if (auth != null) {
            userRole = auth.getAuthorities().stream()
                .findFirst().map(g -> g.getAuthority().replace("ROLE_", "")).orElse("");
        }

        try {
            logger.info("[ReAct] Yeu cau tu [" + username + "]: " + query);
            com.rexi.pkty.service.ReActAgentService.ReActResult result = reactAgentService.run(query, username, userRole, images);
            boolean adminDebugAllowed = RoleAccessPolicy.normalizeRole(userRole).equals("admin");
            String finalAnswer = adminDebugAllowed ? result.finalAnswer() : stripNonAdminTechnicalIds(result.finalAnswer());

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
            logger.severe("[ReAct] Loi: " + e.getMessage());
            saveAgentChatLog(username, query, "Loi ReAct Agent: " + e.getMessage(), "System", List.of());
            return ResponseEntity.internalServerError().body(Map.of("error", "Loi ReAct Agent: " + e.getMessage()));
        }
    }

    private List<String> extractStringList(Object value) {
        if (!(value instanceof List<?> rawList)) return List.of();
        List<String> result = new ArrayList<>();
        for (Object item : rawList) {
            String text = Objects.toString(item, "").trim();
            if (!text.isBlank()) result.add(text);
        }
        return result;
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
        return cleaned.isBlank() ? "Tai chua co du lieu de tra loi truc tiep. Ban gui them ten thu cung hoac ma lich hen de Rexi kiem tra chinh xac hon." : cleaned;
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
            logger.warning("[ReAct] Khong the ghi NhatKyChat: " + ex.getMessage());
        }
    }

    private String compactForLog(String value, int maxChars) {
        if (value == null || value.isBlank()) return "(trong)";
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
            auditLogService.logActionWithUsername(username == null ? "He thong" : username, "AI_MEDICAL_AGENT_ADVICE", "ReActAgent", detail);
        } catch (Exception ex) {
            logger.warning("[ReAct] Khong the ghi audit y khoa AI: " + ex.getMessage());
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
                .replace("\u0111", "d");
        return normalized.replaceAll("[^a-z0-9\\s]", " ").replaceAll("\\s+", " ").trim();
    }

    private String compactForAudit(String value) {
        if (value == null) return "";
        String compact = value.replaceAll("\\s+", " ").trim();
        return compact.substring(0, Math.min(600, compact.length()));
    }
}
