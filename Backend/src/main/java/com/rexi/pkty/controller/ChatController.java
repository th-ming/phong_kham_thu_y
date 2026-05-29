package com.rexi.pkty.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rexi.pkty.dto.ChatMessage;
import com.rexi.pkty.entity.LichSuTuVan;
import com.rexi.pkty.repository.LichSuTuVanRepository;
import com.rexi.pkty.service.GroqService;
import com.rexi.pkty.service.GeminiService;
import com.rexi.pkty.service.OpenRouterService;
import com.rexi.pkty.service.AiMemoryService;
import com.rexi.pkty.service.AuditLogService;
import com.rexi.pkty.service.ReActAgentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import jakarta.servlet.http.HttpServletRequest;
import java.util.concurrent.ConcurrentHashMap;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Locale;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private static final Logger logger = Logger.getLogger(ChatController.class.getName());
    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter VN_TIME_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    @Autowired
    private GroqService groqService;

    @Autowired
    private GeminiService geminiService;

    @Autowired
    private OpenRouterService openRouterService;

    @Autowired
    private AiMemoryService aiMemoryService;

    @Autowired
    private LichSuTuVanRepository lichSuTuVanRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private ReActAgentService reactAgentService;

    // Rate Limit RAM logic
    private static class RateLimit {
        int count;
        Instant resetTime;

        RateLimit() {
            this.count = 1;
            this.resetTime = Instant.now().plus(1, ChronoUnit.MINUTES);
        }
    }

    private record EmergencyTriage(boolean emergency, int score, String category, String reason) {}
    private enum ChatRoute {
        QUICK_LOCAL,
        SENSITIVE_HANDOFF,
        DB_LOCAL,
        MEDIA_AI,
        MEDICAL_AI,
        WEB_AI,
        AUTOPILOT_AI,
        CHAT_AI
    }
    private record ChatRequestPlan(
            ChatRoute route,
            boolean requiresDb,
            boolean requiresAi,
            boolean allowStreaming,
            boolean needsClinicContext,
            String providerHint
    ) {}
    private record ChatPersonaContext(
            String audience,
            String mode,
            String tone,
            String allowedActions,
            String forbiddenActions
    ) {}

    // Wrapper mới an toàn hơn Headers
    public static class ChatPayload {
        public List<ChatMessage> history;
        public String currentPath;
        public String domContext;
        public Object activityLogs;
    }

    private final ConcurrentHashMap<String, RateLimit> rateLimiter = new ConcurrentHashMap<>();

    // Auto clean rateLimit map moi 1 tieng tranh mem leak RAM
    @org.springframework.scheduling.annotation.Scheduled(fixedDelay = 3600000)
    public void cleanExpiredRateLimits() {
        logger.info("Bắt đầu dọn dẹp ConcurrentHashMap rateLimiter tránh rò rỉ bộ nhớ máy chủ... 🧹");
        int beforeSize = rateLimiter.size();
        rateLimiter.entrySet().removeIf(entry -> java.time.Instant.now().isAfter(entry.getValue().resetTime));
        int afterSize = rateLimiter.size();
        logger.info("Đã dọn dẹp xong rateLimiter. Kích thước trước: " + beforeSize + ", Kích thước sau: " + afterSize);
    }

    @PostMapping("/prewarm")
    public Map<String, Object> prewarm() {
        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                groqService.prewarm();
            } catch (Exception e) {
                logger.warning("Không thể prewarm Groq: " + e.getMessage());
            }
        });
        return Map.of("ok", true, "provider", "groq", "mode", "background");
    }

    @PostMapping("/transcribe")
    public Map<String, Object> transcribeAudio(@RequestParam("file") org.springframework.web.multipart.MultipartFile file) {
        try {
            String text = groqService.transcribeAudio(file);
            return Map.of("text", text);
        } catch (Exception e) {
            logger.severe("Lỗi dịch giọng nói Whisper: " + e.getMessage());
            return Map.of("error", e.getMessage());
        }
    }

    @PostMapping
    public Object chat(
            @RequestBody JsonNode requestBody,
            HttpServletRequest request,
            @RequestHeader(value = "Accept", defaultValue = "application/json") String acceptHeader) {

        ChatPayload payload = parseChatPayload(requestBody);
        // ArrayList mutable 100% de tranh unsupported exception
        List<ChatMessage> history = payload.history != null
                ? new ArrayList<>(payload.history)
                : new ArrayList<>();
        // Rate limit chong spam chat
        String clientIp = request.getRemoteAddr();
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        String realUsername = (auth != null && !auth.getName().equals("anonymousUser")) ? auth.getName() : null;
        String rateKey = (realUsername != null) ? realUsername : clientIp;

        // Auto clean map neu > 1000 items
        if (rateLimiter.size() > 1000) {
            rateLimiter.entrySet().removeIf(entry -> Instant.now().isAfter(entry.getValue().resetTime));
        }

        RateLimit limit = rateLimiter.compute(rateKey, (key, currentLimit) -> {
            if (currentLimit == null || Instant.now().isAfter(currentLimit.resetTime)) {
                return new RateLimit();
            }
            currentLimit.count++;
            return currentLimit;
        });

        // Check neu tin cuoi co video
        boolean hasVideoInRequest = history != null && !history.isEmpty() && 
                                   history.get(history.size()-1).getVideos() != null && 
                                   !history.get(history.size()-1).getVideos().isEmpty();

        int maxAllowed = hasVideoInRequest ? 15 : 20;

        if (limit.count > maxAllowed) {
            String warning = hasVideoInRequest 
                ? "Sen ơi, gửi video liên tục tốn nhiều năng lượng của Rexi quá! 🙀 Sen đợi 1 phút nữa rồi gửi tiếp video cho Rexi xem nha!"
                : "Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!";
            return Map.of("reply", warning);
        }

        try {
            if (history == null || history.isEmpty()) {
                String welcomeMessage = "Xin chào Sen! 🐾 Chào mừng Sen đến với **Phòng khám Thú y Rexi**! 🏥✨\n\n" +
                                        "Rexi có thể giúp Sen:\n" +
                                        "📅 **Đặt lịch khám** nhanh gọn.\n" +
                                        "🐶 **Tạo hồ sơ thú cưng**.\n" +
                                        "🩺 **Tư vấn y tế & sơ cứu** cho bé.\n\n" +
                                        "Sen cần Rexi hỗ trợ gì hôm nay ạ?";
                return Map.of("reply", welcomeMessage);
            }

            // Max 40 tin nhan gan nhat de tiet kiem token
            if (history.size() > 40) {
                history = new ArrayList<>(history.subList(history.size() - 40, history.size()));
            }

            // Lay cu phap chat cuoi
            ChatMessage lastMsg = history.get(history.size() - 1);
            String userQuery = lastMsg.getContent() != null ? lastMsg.getContent() : "";
            String normalizedUserQuery = normalizeVietnamese(userQuery.toLowerCase());
            String realtimeContext = buildRealtimeContext();
            boolean hasVideo = lastMsg.getVideos() != null && !lastMsg.getVideos().isEmpty();
            boolean hasImage = lastMsg.getImages() != null && !lastMsg.getImages().isEmpty();
            boolean hasMedia = hasVideo || hasImage;

            EmergencyTriage emergencyTriage = classifyEmergencyTriage(normalizedUserQuery);
            if (emergencyTriage.emergency()) {
                return Map.of(
                        "reply", buildEmergencyReply(normalizedUserQuery, emergencyTriage),
                        "source", "local_triage",
                        "triage", Map.of(
                                "score", emergencyTriage.score(),
                                "category", emergencyTriage.category(),
                                "reason", emergencyTriage.reason()
                        )
                );
            }

            String localFollowUpReply = tryLocalFollowUpReply(history, normalizedUserQuery);
            if (!hasMedia && localFollowUpReply != null) {
                return Map.of("reply", localFollowUpReply, "source", "local_follow_up");
            }

            if (!hasMedia && isUserComplaintQuery(normalizedUserQuery)) {
                return Map.of("reply", buildUserComplaintReply(normalizedUserQuery), "source", "local_complaint");
            }

            String localDocumentReply = tryLocalDocumentQuestionReply(userQuery);
            if (!hasMedia && localDocumentReply != null) {
                return Map.of("reply", localDocumentReply, "source", "local_document");
            }

            // Max 1000 ky tu de tranh spam tin sieu dai
            if (userQuery.length() > 1000) {
                return Map.of("reply",
                        "Sen ơi tin nhắn hơi dài quá òi! 😿 Sen tóm tắt lại tình trạng của bé ngắn gọn (dưới 1000 ký tự) để Rexi đọc và tư vấn chuẩn xác nhất nha!");
            }

            String localVetReply = tryLocalVeterinaryReply(normalizedUserQuery, userQuery);
            if (!hasMedia && localVetReply != null) {
                return Map.of("reply", localVetReply, "source", "local_vet");
            }

            ChatRequestPlan requestPlan = planChatRequest(normalizedUserQuery, userQuery, hasMedia);

            if (requestPlan.route() == ChatRoute.QUICK_LOCAL) {
                return Map.of("reply", buildQuickLocalReply(normalizedUserQuery));
            }

            if (requestPlan.route() == ChatRoute.SENSITIVE_HANDOFF) {
                return runAgentFromChat(userQuery, realUsername, auth);
            }

            if (requestPlan.route() == ChatRoute.DB_LOCAL) {
                String fastDbReply = tryFastDbReply(normalizedUserQuery, userQuery);
                return Map.of("reply", fastDbReply, "source", "fast_db");
            }

            boolean medicalQuery = requestPlan.route() == ChatRoute.MEDICAL_AI;
            boolean webSearchRequested = requestPlan.route() == ChatRoute.WEB_AI;
            boolean autopilotRequested = requestPlan.route() == ChatRoute.AUTOPILOT_AI;
            boolean clinicContextNeeded = requestPlan.needsClinicContext();

            // Smart context filter truoc khi goi LLM
            String userContext = (realUsername != null && clinicContextNeeded)
                    ? aiMemoryService.getUserContext(realUsername)
                    : "";
            String knowledgeContext = (medicalQuery || hasMedia || webSearchRequested)
                    ? aiMemoryService.getKnowledgeBaseContext(userQuery)
                    : "";
            // Context clinic kem theo
            String globalContext = clinicContextNeeded ? aiMemoryService.getGlobalContext(userQuery) : "";
            String webSearchContext = "";
            List<Map<String, String>> webResults = java.util.Collections.emptyList();
            if (webSearchRequested) {
                webResults = searchWebDuckDuckGo(userQuery);
                webSearchContext = buildWebSearchContext(userQuery, webResults);
            }

            // Get payload currentPath va domContext tu HTTP body
            String currentPath = payload.currentPath != null ? payload.currentPath : "/";
            String currentDomContext = autopilotRequested && payload.domContext != null && !payload.domContext.isBlank() 
                                        ? payload.domContext 
                                        : "Không có bối cảnh giao diện.";
            
            String currentActivityLogs = "Không có nhật ký hành động gần đây.";
            if (autopilotRequested && payload.activityLogs != null) {
                 try {
                     currentActivityLogs = new ObjectMapper().writeValueAsString(payload.activityLogs);
                 } catch (Exception ignored) {}
            }
            
            String domContextBlock = autopilotRequested
                    ? "\n--- THÔNG TIN TRANG & BỐI CẢNH GIAO DIỆN (EYES & DOM CONTEXT) ---\n"
                    + "Người dùng hiện đang ở màn hình: " + currentPath + "\n"
                    + "Các dữ liệu chỉ số, bảng biểu và phần tử tương tác (Interactive Elements) có thuộc tính data-ai-id đang hiển thị trên màn hình hiện tại:\n"
                    + ">>> " + currentDomContext + "\n\n"
                    + "LỊCH SỬ THAO TÁC VÀ HÀNH VI GẦN ĐÂY CỦA NGƯỜI DÙNG VỚI MÀN HÌNH (Thời gian thực):\n"
                    + ">>> " + currentActivityLogs + "\n\n"
                    + "HƯỚNG DẪN AUTOPILOT (LÁI TỰ ĐỘNG THAO TÁC TRỰC QUAN):\n"
                    + "1. Bạn có quyền điều khiển trình duyệt của người dùng để thực hiện các thao tác click, cuộn trang, điền form, chọn select, bấm nút. Để thực hiện, hãy trả về các thẻ lệnh Autopilot dạng sau ở cuối câu trả lời của bạn:\n"
                    + "   - Click một phần tử: [CLICK:data-ai-id]\n"
                    + "   - Cuộn trang: [SCROLL:down|small], [SCROLL:up|small], [SCROLL:top], [SCROLL:bottom] hoặc [SCROLL:data-ai-id]\n"
                    + "   - Điền giá trị vào ô input/textarea: [FILL:data-ai-id|giá_trị_cần_điền]\n"
                    + "   - Chọn tùy chọn của thẻ select: [SELECT:data-ai-id|giá_trị_option]\n"
                    + "   - Bật/tắt nút toggle: [TOGGLE:data-ai-id]\n"
                    + "   - Xác nhận xóa: [DELETE:data-ai-id]\n"
                    + "2. CHỈ ĐƯỢC PHÉP sử dụng các giá trị data-ai-id thực sự tồn tại trong danh sách 'Interactive Elements' hiển thị ở bối cảnh giao diện trên. Tuyệt đối KHÔNG tự nghĩ ra data-ai-id không tồn tại. Nếu người dùng yêu cầu chọn một mục (ví dụ: dịch vụ phẫu thuật) mà KHÔNG CÓ trong danh sách, TUYỆT ĐỐI KHÔNG chọn bừa một mục khác. Hãy thông báo rõ ràng là không tìm thấy.\n"
                    + "3. Ví dụ: Nếu người dùng ở trang Đặt lịch hẹn (/khach-hang/dat-lich-hen) và nhờ bạn đặt lịch giúp hoặc điền giúp, bạn hãy phân tích các data-ai-id của thú cưng, dịch vụ, ngày, giờ rảnh, ghi chú và xuất ra chuỗi thẻ lệnh Autopilot liên tiếp như:\n"
                    + "   \"Dạ để tôi giúp Sen chọn thú cưng, chọn dịch vụ khám và điền thông tin đặt lịch nhé! [SELECT:select-datlichhen-688p|id_thú_cưng_của_sen] [CLICK:div-datlichhen-service-id_dịch_vụ] [FILL:input-datlichhen-mc0h|YYYY-MM-DD_hợp_lệ] [CLICK:button-datlichhen-rvj4_giờ_khám] [FILL:textarea-datlichhen-note|Triệu chứng của bé] [CLICK:button-datlichhen-66iq]\"\n"
                    + "4. THÔNG TIN CHẨN ĐOÁN VÀ ĐIỀU TRỊ Y KHOA: Khi người dùng hoặc bác sĩ hỏi về thông tin chẩn đoán, cách hoạt động của thuốc, phác đồ điều trị, bạn phải cung cấp thông tin y khoa chính xác cao. ĐẶC BIỆT, TUYỆT ĐỐI không tự bịa ra link URL tham khảo giả mạo. Chỉ trích dẫn link nguồn thực tế nếu nguồn tin có sẵn hoặc nếu bạn tìm kiếm web thực tế trả về các URL thật uy tín (như Vinmec, Pethealth, WHO). Nếu không có, tuyệt đối KHÔNG đưa link bịa.\n"
                    + "6. PHÁT HIỆN LỖI SAI VÀ TỰ ĐỘNG SỬA (AUTOPILOT ERROR CORRECTION):\n"
                    + "   Bạn phải giám sát dữ liệu người dùng nhập so với bối cảnh màn hình (DOM Context). Nếu phát hiện họ nhập sai (ví dụ: gõ sai ngày khám, thiếu thông tin bắt buộc, sai chính tả tên thuốc/dịch vụ), hãy thực hiện đủ 3 bước:\n"
                    + "   - Chỉ ra lỗi sai một cách tinh tế, nhẹ nhàng.\n"
                    + "   - Nói: 'Để Rexi tự động sửa lỗi và điền lại giúp Sen nhé'.\n"
                    + "   - TUYỆT ĐỐI PHẢI phát ra chuỗi lệnh Autopilot như [FILL:data-ai-id|giá_trị_đúng] hoặc [SELECT:data-ai-id|giá_trị_đúng] ngay cuối câu.\n"
                    + "5. Hãy phân tích LỊCH SỬ THAO TÁC gần đây để thấu hiểu người dùng vừa thực hiện thao tác gì, vừa nhấp chuột ở đâu, có gặp lỗi hay cuộn trang ở đâu không để tư vấn và chủ động gợi ý hỗ trợ thông minh, tinh tế nhất.\n"
                    + "7. TRẢ LỜI CÂU HỎI VỀ TRẠNG THÁI GIAO DIỆN: Nếu người dùng hỏi 'có bác sĩ nào đang trống lịch không', 'còn giờ nào trống không', hãy đọc kỹ danh sách Interactive Elements (đặc biệt là các nút chọn giờ, chọn bác sĩ) và trả lời TRỰC TIẾP cho họ dựa trên dữ liệu đó. Đừng chỉ trả lời chung chung hoặc hướng dẫn các bước.\n"
                    : "\n--- BỐI CẢNH GIAO DIỆN TỐI GIẢN ---\n"
                    + "Người dùng hiện đang ở màn hình: " + currentPath + ". Chỉ hướng dẫn bằng lời, không dùng thẻ Autopilot trừ khi người dùng yêu cầu thao tác giao diện rõ ràng.\n";

            // Check auth state de chan AUTO_BOOK
            boolean isLoggedIn = (realUsername != null);
            String loginContext = isLoggedIn 
                ? "Sen hiện ĐÃ ĐĂNG NHẬP với tài khoản: " + realUsername + ". Bạn CÓ QUYỀN đặt lịch khám ngay cho Sen."
                : "Sen HIỆN CHƯA ĐĂNG NHẬP. Bạn TUYỆT ĐỐI KHÔNG ĐƯỢC trả về tag [AUTO_BOOK]. Nếu Sen muốn đặt lịch, hãy yêu cầu Sen đăng nhập trước nhé.";

            boolean isStaff = false;
            String userRoleName = "Khách hàng";
            if (auth != null) {
                for (org.springframework.security.core.GrantedAuthority ga : auth.getAuthorities()) {
                    String r = ga.getAuthority().replace("ROLE_", "").toUpperCase();
                    if (r.equals("ADMIN") || r.equals("QUAN_LY") || r.equals("BAC_SI") || r.equals("KE_TOAN") || r.equals("TIEP_TAN") || r.equals("Y_TA") || r.equals("STAFF")) {
                        isStaff = true;
                        if (r.equals("ADMIN")) userRoleName = "Quản trị viên";
                        else if (r.equals("QUAN_LY")) userRoleName = "Quản lý";
                        else if (r.equals("BAC_SI")) userRoleName = "Bác sĩ";
                        else if (r.equals("KE_TOAN")) userRoleName = "Kế toán";
                        else if (r.equals("TIEP_TAN")) userRoleName = "Tiếp tân";
                        else if (r.equals("Y_TA")) userRoleName = "Y tá";
                        else if (r.equals("STAFF")) userRoleName = "Nhân viên";
                        break;
                    }
                }
            }
            ChatPersonaContext personaContext = buildPersonaContext(isStaff, userRoleName, requestPlan, isLoggedIn);
            boolean isClinicalStaff = "Bác sĩ".equals(userRoleName) || "Y tá".equals(userRoleName);
            String personaBlock = renderPersonaBlock(personaContext, requestPlan, currentPath);

            // Get nam sinh KHACH_HANG tu DB de phan loai style chat GenZ/Mature
            Integer namSinh = null;
            if (realUsername != null) {
                try {
                    namSinh = jdbcTemplate.queryForObject(
                        "SELECT kh.nam_sinh FROM TaiKhoan tk JOIN KhachHang kh ON tk.id_khach_hang = kh.id_khach_hang WHERE tk.ten_dang_nhap = ?",
                        Integer.class,
                        realUsername
                    );
                } catch (Exception e) {
                    logger.warning("Không lấy được năm sinh cho " + realUsername + ": " + e.getMessage());
                }
            }

            boolean chatbotIsGenZ = (namSinh != null && namSinh >= 1997);

            String systemPrompt;
            if (isStaff) {
                systemPrompt = personaBlock
                        + "BẠN LÀ BÁC SĨ THÚ Y REXI - ĐỒNG NGHIỆP VÀ TRỢ LÝ HỖ TRỢ CHUYÊN NGHIỆP CỦA PHÒNG KHÁM.\n"
                        + realtimeContext
                        + "1. VAI TRÒ: Bạn đang trò chuyện với một thành viên trong đội ngũ nhân viên phòng khám (" + userRoleName + "). Bạn là đồng nghiệp đắc lực hỗ trợ cho họ.\n"
                        + "2. PHẠM VI HỖ TRỢ: Hỗ trợ tra cứu kiến thức chuyên môn y khoa, quy trình làm việc, tư vấn phác đồ điều trị nâng cao, quản lý danh mục thuốc, quy định nghiệp vụ hoặc giải đáp thắc mắc chuyên môn.\n"
                        + "3. PHONG CÁCH: Chuyên nghiệp, đồng nghiệp, ngắn gọn, súc tích, không vòng vo. Gọi họ là 'sếp' hoặc 'đồng nghiệp'. Tuyệt đối KHÔNG gọi họ là 'Sen', không xưng hô kiểu bán hàng.\n"
                        + "4. HOTLINE & ĐỊA CHỈ: Dùng số hotline phòng khám: 0353.374.156 và địa chỉ: Gia Lâm, Hà Nội khi đồng nghiệp cần thông tin.\n"
                        + "5. SƠ CỨU KHẨN CẤP (HEIMLICH): Sẵn sàng cung cấp hướng dẫn sơ cứu nhanh khi có ca khẩn cấp.\n"
                        + "5b. PHÂN QUYỀN Y KHOA THEO VAI TRÒ: "
                        + (isClinicalStaff
                            ? "Người dùng là nhân sự lâm sàng (" + userRoleName + "), được phép nhận phân tích chuyên sâu, chẩn đoán phân biệt, gợi ý xét nghiệm, nhóm thuốc/phác đồ tham khảo và checklist theo dõi. Tuy nhiên phải ghi rõ đây là hỗ trợ chuyên môn tham khảo, quyết định cuối cùng thuộc bác sĩ phụ trách sau khi khám trực tiếp, cân nặng, tuổi, tiền sử và kết quả xét nghiệm.\n"
                            : "Người dùng không phải vai trò lâm sàng trực tiếp (" + userRoleName + "), chỉ giải thích ở mức vận hành/tổng quan. Không đưa phác đồ thuốc, liều dùng, chỉ định kháng sinh/gây mê hoặc hướng dẫn điều trị chuyên sâu; hãy hướng dẫn chuyển cho bác sĩ/y tá.\n")
                        + "6. QUY TẮC QUAN TRỌNG NHẤT - ƯU TIÊN TRẢ LỜI TRỰC TIẾP:\n"
                        + "   Khi đồng nghiệp đặt câu hỏi bất kỳ (ví dụ: 'khóa tài khoản khách hàng thì sao?', 'làm thế nào để thêm nhân viên?'...), bạn BẮT BUỘC phải TRẢ LỜI THẲNG VÀO NỘI DUNG CÂU HỎI trước. TUYỆT ĐỐI KHÔNG tự nhảy vào chế độ Autopilot/điều hướng khi đồng nghiệp chỉ hỏi thông tin.\n"
                        + "7. BẢO MẬT & TRUY CẬP DỮ LIỆU (CỰC KỲ QUAN TRỌNG):\n"
                        + "   Ở chế độ chat này, bạn KHÔNG CÓ CÔNG CỤ TRUY CẬP TRỰC TIẾP VÀO DATABASE để tìm khách hàng, bệnh án, hóa đơn... Nếu đồng nghiệp yêu cầu tìm kiếm dữ liệu (ví dụ: 'có khách hàng nào tên X không?'), TUYỆT ĐỐI KHÔNG BỊA ĐẶT DỮ LIỆU HOẶC BÁO KHÔNG TÌM THẤY. Bắt buộc phải trả lời: 'Dạ sếp ơi, ở chế độ Trợ lý cơ bản này em chưa được gắn công cụ tra cứu Database. Sếp vui lòng bấm nút **Chuyển sang Rexi Agent** ngay dưới tin nhắn này hoặc mở tab **Rexi Agent** ở góc trên cùng của khung chat để em dùng công cụ quét dữ liệu thực tế cho sếp nhé!'.\n"
                        + "8. QUY TẮC ĐIỀU HƯỚNG TÁC VỤ NGHIÊM NGẶT (STRICT NAVIGATION GATE):\n"
                        + "   TUYỆT ĐỐI CẤM sử dụng thẻ [NAVIGATE] khi đồng nghiệp hỏi các câu hỏi đóng. Bạn CHỈ ĐƯỢC PHÉP dùng thẻ [NAVIGATE] nếu đồng nghiệp sử dụng động từ chỉ định mệnh lệnh rõ ràng (ví dụ: 'mở trang...', 'đưa tôi đến...', 'chuyển sang...'). Danh sách đường dẫn hợp lệ:\n"
                        + "   - Quản lý Nhân viên/Thêm nhân sự/Phân quyền: /quan-ly/nhan-vien-phan-quyen\n"
                        + "   - Bảng điều khiển Quản lý nội bộ: /quan-ly/dashboard\n"
                        + "   - Quản lý Khách hàng & Thú cưng: /quan-ly/khach-hang-thu-cung\n"
                        + "   - Quản lý Lịch hẹn khám: /quan-ly/lich-hen\n"
                        + "   - Quản lý Lịch làm việc Bác sĩ: /quan-ly/lich-lam-viec\n"
                        + "   - Quản lý Hồ sơ bệnh án: /quan-ly/ho-so-benh-an\n"
                        + "   - Phân hệ Khám bệnh Bác sĩ: /quan-ly/kham-benh\n"
                        + "   - Quản lý Đơn thuốc: /quan-ly/don-thuoc\n"
                        + "   - Quản lý Tài liệu đính kèm: /quan-ly/file-dinh-kem\n"
                        + "   - Thông tin cá nhân nhân viên: /quan-ly/thong-tin-ca-nhan\n"
                        + "   - Quản lý Hóa đơn & Thu phí: /quan-ly/hoa-don\n"
                        + "   - Bảng điều khiển Kế toán: /quan-ly/ke-toan\n"
                        + "   - Báo cáo tài chính & Thống kê doanh thu: /quan-ly/bao-cao-thong-ke\n"
                        + "   - Quản lý Nhập kho thuốc: /quan-ly/nhap-kho\n"
                        + "   - Quản lý Kho thuốc & Vật tư: /quan-ly/kho-thuoc\n"
                        + "   - Cấu hình hệ thống: /quan-ly/cau-hinh\n"
                        + "   - Quản lý chức năng: /quan-ly/chuc-nang\n"
                        + "   - Quản lý Dịch vụ: /quan-ly/dich-vu\n"
                        + "   - Quản lý Xét nghiệm: /quan-ly/xet-nghiem\n"
                        + "   - Chiến dịch Email Marketing: /quan-ly/marketing\n"
                        + "\n--- DỮ LIỆU PHÒNG KHÁM THỰC TẾ (BÁC SĨ, DỊCH VỤ, BẢNG GIÁ) ---\n"
                        + globalContext
                        + "\n--- BỐI CẢNH NGƯỜI DÙNG & TÀI LIỆU ---\n"
                        + userContext
                        + "\n" + knowledgeContext
                        + "\n" + webSearchContext
                        + domContextBlock;
            } else {
                String phongCachText = chatbotIsGenZ
                    ? "4. PHONG CÁCH: Bạn đang trò chuyện với một Sen thế hệ Gen Z (sinh năm " + namSinh + "). Hãy trò chuyện cực kỳ hóm hỉnh, năng động, nhây nhây vui tươi, thỉnh thoảng trêu chọc đùa giỡn nhẹ nhàng. Hãy chêm các từ teencode phổ biến của giới trẻ một cách tự nhiên (như: 'khum', 'iu', 'z', 'hông', 'sen', 'boss', 'dạ', 'oke'). Tuy nhiên, nếu họ hỏi về cấp cứu y tế hoặc tình huống khẩn cấp, bạn phải ngay lập tức chuyển sang chế độ nghiêm túc và ân cần 100% để hướng dẫn.\n"
                    : "4. PHONG CÁCH: Bạn đang trò chuyện với khách hàng lớn tuổi/trưởng thành (sinh năm " + (namSinh != null ? namSinh : "trước 1997") + "). Hãy trò chuyện cực kỳ kính trọng, lịch sự, ân cần, ngôn từ nghiêm túc, chuẩn mực. TUYỆT ĐỐI KHÔNG dùng teencode, không cợt nhả, và TUYỆT ĐỐI KHÔNG được gọi họ là 'Sen' (họ sẽ thấy khó chịu), hãy gọi họ là 'Quý khách' hoặc xưng hô lịch thiệp 'Dạ thưa anh/chị'.\n";

                systemPrompt = personaBlock
                        + "BẠN LÀ BÁC SĨ THÚ Y REXI - CHUYÊN GIA TOÀN NĂNG TRONG LĨNH VỰC CHĂM SÓC THÚ CƯNG.\n"
                        + realtimeContext
                        + "1. PHẠM VI TRI THỨC: Bạn có kiến thức sâu rộng về MỌI mặt của thú y: Y khoa (bệnh lý, điều trị), Dinh dưỡng, Hành vi, Chăm sóc hằng ngày. Đừng ngần ngại tư vấn chi tiết cho Sen bất kể câu hỏi là gì.\n"
                        + "2. NGUỒN TRI THỨC: \n"
                        + "   - Nếu Sen hỏi về các chủ đề có trong [TÀI LIỆU CHUYÊN MÔN REXI] bên dưới, bạn BẮT BUỘC phải trả lời theo đúng tài liệu đó.\n"
                        + "   - Với mọi câu hỏi khác, hãy sử dụng kho tri thức thú y khổng lồ mà bạn đã được huấn luyện để tư vấn một cách chuyên nghiệp, chính xác và đầy yêu thương.\n"
                        + "3. HOTLINE & ĐỊA CHỈ: Luôn dùng số điện thoại: 0353.374.156 và địa chỉ: Gia Lâm, Hà Nội khi khách cần liên hệ hoặc trong trường hợp khẩn cấp.\n"
                        + phongCachText
                        + "5. SƠ CỨU KHẨN CẤP (HEIMLICH, NGỘ ĐỘC, TAI NẠN, CHẢY MÁU): Khi Sen hỏi về tình trạng khẩn cấp, KHÔNG dọa dẫm gây hoảng loạn. BẮT BUỘC bắt đầu bằng tag [EMERGENCY], hướng dẫn sơ cứu cơ bản trước, sau đó CHỦ ĐỘNG HỎI VỊ TRÍ của Sen để chỉ hướng đến phòng khám gần nhất.\n"
                        + "6. ĐẶT LỊCH HẸN: " + loginContext + " Khi Sen chốt lịch, BẮT BUỘC in ra chuỗi [AUTO_BOOK:Ngày|Giờ|TênThúCưng|DịchVụ|TênBácSĩ]. Định dạng ngày YYYY-MM-DD, giờ HH:mm.\n"
                        + "7. THU THẬP TIỂU SỬ THÚ CƯNG: Bắt buộc chủ động hỏi Sen về Giống (chó/mèo/...), Độ tuổi và Cân nặng của thú cưng nếu chưa có thông tin, để đưa ra tư vấn sát thực tế nhất.\n"
                        + "8. TRÁNH KÊ ĐƠN THUỐC TÙY TIỆN: Chỉ tư vấn dinh dưỡng, hành vi, dấu hiệu cần theo dõi, sơ cứu an toàn và thời điểm phải đi khám. TUYỆT ĐỐI không đưa liều dùng, không chỉ định kháng sinh/thuốc giảm đau/thuốc gây mê/thuốc kê đơn, không thay thế bác sĩ.\n"
                        + "9. TRUY CẬP DỮ LIỆU HỆ THỐNG (CỰC KỲ QUAN TRỌNG):\n"
                        + "   Ở chế độ này, bạn KHÔNG CÓ CÔNG CỤ tra cứu CSDL (tìm khách hàng, bệnh án). Nếu Sen yêu cầu tra cứu thông tin cụ thể trong hệ thống, TUYỆT ĐỐI KHÔNG BỊA ĐẶT DỮ LIỆU HOẶC TỰ NHẬN LÀ KHÔNG TÌM THẤY. Bắt buộc trả lời: 'Dạ Sen ơi, ở chế độ này em không thể xem dữ liệu hệ thống ạ. Sen bấm nút **Chuyển sang Rexi Agent** ngay dưới tin nhắn này hoặc mở tab **Rexi Agent** ở trên cùng khung chat để em quét dữ liệu thực tế giúp Sen nha!'.\n"
                        + "10. QUY TẮC ĐIỀU HƯỚNG TÁC VỤ NGHIÊM NGẶT (STRICT NAVIGATION GATE):\n"
                        + "   TUYỆT ĐỐI CẤM sử dụng thẻ [NAVIGATE] khi người dùng hỏi các câu hỏi đóng. Bạn CHỈ ĐƯỢC PHÉP dùng thẻ [NAVIGATE] nếu người dùng sử dụng động từ chỉ định mệnh lệnh rõ ràng (ví dụ: 'mở trang quản lý thú cưng', 'chuyển sang đặt lịch hẹn khám'...), bạn BẮT BUỘC phải đính kèm thẻ lệnh dạng [NAVIGATE:đường_dẫn] ở cuối câu trả lời của bạn. Dưới đây là danh sách đường dẫn hợp lệ:\n"
                        + "   - Bảng điều khiển Khách hàng: /khach-hang/dashboard\n"
                        + "   - Quản lý thú cưng: /khach-hang/quan-ly-thu-cung\n"
                        + "   - Đặt lịch hẹn khám: /khach-hang/dat-lich-hen\n"
                        + "   - Lịch sử lịch hẹn: /khach-hang/lich-su-lich-hen\n"
                        + "   - Hồ sơ bệnh án thú cưng: /khach-hang/ho-so-benh-an\n"
                        + "   - Hóa đơn & thanh toán: /khach-hang/hoa-don-thanh-toan\n"
                        + "   - Thông tin cá nhân Sen: /khach-hang/thong-tin-ca-nhan\n"
                        + "\n11. NGUỒN THAM KHẢO TÌM KIẾM WEB (NẾU CÓ):"
                        + "\n   Khi trả lời dựa trên kết quả tìm kiếm web, bạn BẮT BUỘC phải trích dẫn link nguồn rõ ràng bằng định dạng Markdown thân thiện dạng: [Tên Nguồn](Link) để Sen bấm vào xem được."
                        + "\n--- DỮ LIỆU PHÒNG KHÁM THỰC TẾ (BÁC SĨ, DỊCH VỤ, BẢNG GIÁ) ---\n"
                        + globalContext
                        + "\n--- DỮ LIỆU CÁ cá nhân CỦA SEN ---\n"
                        + userContext
                        + "\n" + knowledgeContext
                        + "\n" + webSearchContext
                        + domContextBlock;
            }
ChatMessage systemMsg = new ChatMessage();
            systemMsg.setRole("system");
            systemMsg.setContent(systemPrompt);
            history.removeIf(msg -> "system".equalsIgnoreCase(msg.getRole()));
            history.add(0, systemMsg);

            ChatMessage latest = history.get(history.size() - 1);
            if (hasMedia) {
                latest.setContent(buildMediaPrompt(latest.getContent(), hasImage, hasVideo));
            }

            // LLM routing kem y te va teencode check
            String userQueryStr = latest.getContent() != null ? latest.getContent() : "";
            String normalizedQuery = normalizeVietnamese(userQueryStr.toLowerCase());

            // Check tu khoa y te
            boolean isMedicalQuery = isMedicalQuery(normalizedQuery);

            // Chan streaming neu co media hoac la cau y te
            if (acceptHeader != null && acceptHeader.contains("text/event-stream") && !hasMedia && !isMedicalQuery) {
                org.springframework.web.servlet.mvc.method.annotation.SseEmitter emitter = new org.springframework.web.servlet.mvc.method.annotation.SseEmitter(-1L);
                try {
                    // Stream luong chat qua Groq
                    if (autopilotRequested) {
                        groqService.streamChat(history, emitter, groqService.getAutopilotModelName());
                    } else {
                        groqService.streamChat(history, emitter);
                    }
                } catch (Exception e) {
                    emitter.completeWithError(e);
                }
                return emitter;
            }

            // Predicate check Timeout error
            java.util.function.Predicate<Exception> isTimeoutError = (ex) -> {
                String msg = ex.getMessage() != null ? ex.getMessage().toLowerCase(Locale.ROOT) : "";
                return msg.contains("timeout") || msg.contains("timed out") || msg.contains("read timed out");
            };

            String reply;
            String providerUsed = "Unknown";
            // LLM Router logic: Gemini (media), Deepseek (medical), Groq (FAQ/Autopilot)
            if (hasMedia) {
                // 🎥/🖼️ THẾ MẠNH CỦA GEMINI: Đa phương tiện (Video, Hình ảnh)
                logger.info("[AI ROUTER] Định tuyến câu hỏi Media sang: Gemini");
                try {
                    reply = geminiService.chat(history);
                    providerUsed = "Gemini";
                } catch (Exception geminiEx) {
                    if (hasVideo) {
                        logger.warning("[AI ROUTER] Gemini lỗi khi phân tích video; không fallback sang model text-only để tránh bịa kết quả video: " + geminiEx.getMessage());
                        reply = buildVideoAnalysisFallbackReply(isTimeoutError.test(geminiEx));
                        providerUsed = "System Fallback";
                    } else {
                        logger.warning("[AI ROUTER] Gemini lỗi khi phân tích ảnh, chuyển dự phòng sang Groq Vision...");
                        reply = groqService.chat(history);
                        providerUsed = "Groq Vision";
                    }
                }
            } else if (isMedicalQuery) {
                // Gemini phản hồi y tế ngắn ổn định hơn; OpenRouter giữ vai trò dự phòng chuyên sâu.
                logger.info("[AI ROUTER] Định tuyến câu hỏi Tư vấn Y tế sang: Gemini");
                try {
                    reply = geminiService.chat(history);
                    providerUsed = "Gemini";
                } catch (Exception geminiEx) {
                    if (isTimeoutError.test(geminiEx)) {
                        logger.warning("[AI ROUTER] Gemini timeout, chuyển nhanh sang Groq để tránh treo chat...");
                        reply = groqService.chat(history);
                        providerUsed = "Groq";
                    } else {
                        logger.warning("[AI ROUTER] Gemini lỗi, chuyển hướng dự phòng sang: OpenRouter...");
                        try {
                            reply = openRouterService.chat(history, true);
                            providerUsed = "OpenRouter";
                        } catch (Exception openRouterEx) {
                            logger.warning("[AI ROUTER] OpenRouter lỗi, chuyển hướng dự phòng cuối cùng sang: Groq...");
                            reply = groqService.chat(history);
                            providerUsed = "Groq";
                        }
                    }
                }
            } else {
                // 💬 THẾ MẠNH CỦA GROQ (LLAMA 3.3): Chat FAQ, Lịch khám, Autopilot siêu tốc
                logger.info("[AI ROUTER] Định tuyến câu hỏi Chat/Autopilot thông thường sang: Groq");
                try {
                    reply = groqService.chat(history);
                    providerUsed = "Groq";
                } catch (Exception groqException) {
                    if (isTimeoutError.test(groqException)) {
                        // Groq là model nhanh nhất mà còn timeout thì mạng hoặc server đang có vấn đề nặng. Báo lỗi ngay lập tức.
                        throw new RuntimeException("Groq timeout", groqException);
                    }
                    logger.warning("[AI ROUTER] Groq lỗi, chuyển hướng dự phòng sang: Gemini...");
                    try {
                        reply = geminiService.chat(history);
                        providerUsed = "Gemini";
                    } catch (Exception geminiException) {
                        logger.warning("[AI ROUTER] Gemini lỗi, chuyển hướng dự phòng cuối cùng sang: OpenRouter (DeepSeek V4)...");
                        reply = openRouterService.chat(history, false);
                        providerUsed = "OpenRouter";
                    }
                }
            }

            reply = sanitizeChatReply(reply);
            auditMedicalAiReplyIfNeeded(userQuery, reply, userRoleName, providerUsed, requestPlan.route().name());

            // HtmlEscape tranh XSS injection
            String safeUserQuery = org.springframework.web.util.HtmlUtils.htmlEscape(userQuery);

            // Luu lich su chat vao DB tu van
            try {
                String customerId = aiMemoryService.getCurrentCustomerId();
                if (customerId != null) {
                    LichSuTuVan log = new LichSuTuVan();
                    log.setId_tu_van("TV-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase());
                    log.setId_khach_hang(customerId);
                    log.setNoi_dung_khach(safeUserQuery);
                    log.setNoi_dung_rexi(reply);
                    lichSuTuVanRepository.save(log);
                }
            } catch (Exception logEx) {
                logger.severe("Không thể lưu lịch sử tư vấn: " + logEx.getMessage());
            }

            if (!webResults.isEmpty()) {
                return Map.of("reply", reply, "webResults", webResults, "provider", providerUsed);
            }
            return Map.of("reply", reply, "provider", providerUsed);
        } catch (Exception e) {
            logger.severe("Chat API error: " + e.getMessage());
            String errorCode = classifyAiRuntimeError(e);
            return Map.of(
                    "reply", buildRoleAwareAiErrorReply(errorCode),
                    "errorCode", errorCode);
        }
    }

    private ChatPayload parseChatPayload(JsonNode requestBody) {
        ChatPayload payload = new ChatPayload();
        if (requestBody == null || requestBody.isNull()) {
            return payload;
        }

        ObjectMapper mapper = new ObjectMapper();
        try {
            if (requestBody.isArray()) {
                // ArrayList mutable 100% de tranh loi add/remove
                payload.history = new ArrayList<>(Arrays.asList(mapper.treeToValue(requestBody, ChatMessage[].class)));
                return payload;
            }

            ChatPayload parsedPayload = mapper.treeToValue(requestBody, ChatPayload.class);
            return parsedPayload != null ? parsedPayload : payload;
        } catch (Exception e) {
            logger.warning("Không thể đọc payload chat: " + e.getMessage());
            return payload;
        }
    }

    private String classifyAiRuntimeError(Exception e) {
        String message = e.getMessage() == null ? "" : e.getMessage().toLowerCase(Locale.ROOT);
        if (message.contains("429") || message.contains("quota") || message.contains("rate limit")
                || message.contains("too many requests")) {
            return "quota_exceeded";
        }
        if (message.contains("401") || message.contains("403") || message.contains("api key")
                || message.contains("unauthorized") || message.contains("không tìm thấy") && message.contains("key")) {
            return "invalid_api_key";
        }
        if (message.contains("timeout") || message.contains("timed out")) {
            return "timeout";
        }
        if (message.contains("model not found") || message.contains("404")) {
            return "model_not_found";
        }
        if (message.contains("model") || message.contains("unsupported")) {
            return "model_not_supported";
        }
        return "ai_provider_unavailable";
    }

    private String buildRoleAwareAiErrorReply(String errorCode) {
        String role = currentRoleText();
        boolean isAdmin = role.contains("ADMIN");
        boolean isManager = role.contains("QUAN_LY");
        boolean isStaff = role.contains("BAC_SI") || role.contains("TIEP_TAN") || role.contains("Y_TA")
                || role.contains("KE_TOAN") || role.contains("NHAN_VIEN") || role.contains("STAFF");

        if (isAdmin) {
            return switch (errorCode) {
                case "quota_exceeded" -> "AI Provider đang hết quota hoặc bị giới hạn tốc độ. Admin vào Cấu hình hệ thống > AI Provider để bấm kiểm tra từng provider, đổi key, nâng quota hoặc chuyển model dự phòng.";
                case "invalid_api_key" -> "API key AI không hợp lệ, bị thu hồi hoặc chưa cấu hình. Rexi không hiển thị key thô; Admin vui lòng cập nhật key trong Cấu hình hệ thống và bấm kiểm tra kết nối.";
                case "model_not_found", "model_not_supported" -> "Model AI đang chọn không tồn tại hoặc không được key hiện tại hỗ trợ. Admin vui lòng đổi model trong Cấu hình hệ thống rồi kiểm tra lại.";
                case "timeout" -> "AI Provider phản hồi quá lâu hoặc mạng provider đang nghẽn. Admin có thể kiểm tra trạng thái từng provider và chuyển sang provider/model dự phòng.";
                default -> "Dịch vụ AI đang không khả dụng. Admin vào Cấu hình hệ thống > AI Provider để xem provider, model và mã lỗi kiểm tra kết nối.";
            };
        }

        if (isManager) {
            return switch (errorCode) {
                case "quota_exceeded" -> "Dịch vụ AI đang hết quota hoặc bị giới hạn sử dụng. Quản lý vui lòng kiểm tra gói dịch vụ/model trong Cấu hình hệ thống hoặc báo Admin đổi provider dự phòng.";
                case "invalid_api_key" -> "Cấu hình API key AI đang lỗi. Vui lòng báo Admin cập nhật key mới; Rexi không hiển thị key vì lý do bảo mật.";
                case "model_not_found", "model_not_supported" -> "Model AI đang cấu hình không khả dụng. Quản lý vui lòng báo Admin đổi model hoặc provider khác.";
                case "timeout" -> "AI đang phản hồi chậm hoặc timeout. Vui lòng thử lại sau ít phút hoặc chuyển thao tác sang quy trình thủ công.";
                default -> "Dịch vụ AI đang gián đoạn. Quản lý vui lòng kiểm tra Cấu hình hệ thống hoặc báo Admin.";
            };
        }

        if (isStaff) {
            return "Dịch vụ AI đang gián đoạn nên Rexi chưa thể hỗ trợ tự động lúc này. Anh/chị vẫn thao tác thủ công trên hệ thống; với tình huống y tế, vui lòng xử lý theo quy trình lâm sàng và thử AI lại sau.";
        }

        return "Hiện hệ thống AI đang tạm quá tải hoặc gián đoạn. Sen thử lại sau ít phút nhé. Nếu bé có dấu hiệu khẩn cấp, vui lòng gọi hotline phòng khám ngay.";
    }

    private String buildVideoAnalysisFallbackReply(boolean timeout) {
        String reason = timeout
                ? "model đa phương tiện phản hồi quá lâu"
                : "model đa phương tiện đang lỗi hoặc quá tải";
        return "Tôi chưa phân tích được video này vì " + reason + ". Để tránh nhận định bịa từ video, Sen vui lòng gửi lại video ngắn hơn/rõ hơn hoặc gửi 2-3 ảnh chụp từ video.\n\n"
                + "Trong lúc chờ, nếu bé có dấu hiệu khó thở, co giật, chảy máu nhiều, tím tái, lịm đi, sốc nhiệt/say nắng hoặc thân nhiệt rất cao thì đưa bé đi cấp cứu ngay và gọi hotline 0353.374.156.";
    }

    private String currentRoleText() {
        try {
            var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            return auth == null ? "" : auth.getAuthorities().toString().toUpperCase(Locale.ROOT);
        } catch (Exception ignored) {
            return "";
        }
    }

    private String sanitizeChatReply(String reply) {
        if (reply == null) {
            return "";
        }
        String cleaned = reply.trim();

        Pattern fencePattern = Pattern.compile("(?s)```(?:json)?\\s*([\\[{][\\s\\S]*?[\\]}])\\s*```", Pattern.CASE_INSENSITIVE);
        Matcher fenceMatcher = fencePattern.matcher(cleaned);
        if (fenceMatcher.find()) {
            String beforeText = cleaned.substring(0, fenceMatcher.start()).trim();
            String jsonPayload = fenceMatcher.group(1).trim();
            String extracted = extractTextFromJson(jsonPayload);
            if (!beforeText.isEmpty()) {
                return extracted.isEmpty() ? beforeText : beforeText + "\n\n" + extracted;
            }
            if (!extracted.isEmpty()) {
                return extracted;
            }
        }

        if (cleaned.startsWith("{") || cleaned.startsWith("[")) {
            String extracted = extractTextFromJson(cleaned);
            if (!extracted.isEmpty()) {
                return extracted;
            }
        }

        return cleaned;
    }

    private String extractTextFromJson(String jsonText) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode node = mapper.readTree(jsonText);
            if (node.has("reply") && node.get("reply").isTextual()) {
                return node.get("reply").asText();
            }
            if (node.has("final_answer") && node.get("final_answer").isTextual()) {
                return node.get("final_answer").asText();
            }
            if (node.has("text") && node.get("text").isTextual()) {
                return node.get("text").asText();
            }
            if (node.has("message") && node.get("message").isTextual()) {
                return node.get("message").asText();
            }
            if (node.isTextual()) {
                return node.asText();
            }
            if (node.isObject() && node.size() == 1) {
                JsonNode onlyValue = node.elements().next();
                if (onlyValue.isTextual()) {
                    return onlyValue.asText();
                }
            }
        } catch (Exception ignored) {
        }
        return "";
    }

    private List<Map<String, String>> searchWebDuckDuckGo(String query) {
        List<Map<String, String>> results = new java.util.ArrayList<>();
        try {
            String encodedQuery = java.net.URLEncoder.encode(query, "UTF-8");
            String urlStr = "https://html.duckduckgo.com/html/";
            String postData = "q=" + encodedQuery;

            java.net.URL url = new java.net.URL(urlStr);
            java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setDoOutput(true);
            conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(7000);

            try (java.io.OutputStream os = conn.getOutputStream()) {
                os.write(postData.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            }

            StringBuilder response = new StringBuilder();
            try (java.io.BufferedReader in = new java.io.BufferedReader(
                    new java.io.InputStreamReader(conn.getInputStream(), java.nio.charset.StandardCharsets.UTF_8))) {
                String line;
                while ((line = in.readLine()) != null) {
                    response.append(line).append("\n");
                }
            }

            String html = response.toString();

            // Regex patterns to match results in DuckDuckGo HTML Lite
            java.util.regex.Pattern titlePattern = java.util.regex.Pattern.compile(
                "<a rel=\"nofollow\" class=\"result__a\" href=\"([^\"]+)\">([^<]+)</a>"
            );
            java.util.regex.Pattern snippetPattern = java.util.regex.Pattern.compile(
                "<a class=\"result__snippet\"[^>]*>(.*?)</a>"
            );

            java.util.regex.Matcher titleMatcher = titlePattern.matcher(html);
            java.util.regex.Matcher snippetMatcher = snippetPattern.matcher(html);

            List<String> urls = new java.util.ArrayList<>();
            List<String> titles = new java.util.ArrayList<>();
            while (titleMatcher.find()) {
                urls.add(titleMatcher.group(1).trim());
                titles.add(titleMatcher.group(2).trim());
            }

            List<String> snippets = new java.util.ArrayList<>();
            while (snippetMatcher.find()) {
                String snippetHtml = snippetMatcher.group(1);
                String snippetText = snippetHtml.replaceAll("<[^>]+>", "").trim();
                snippets.add(snippetText);
            }

            for (int i = 0; i < urls.size() && i < 5; i++) {
                Map<String, String> item = new java.util.HashMap<>();
                item.put("url", cleanDuckDuckGoUrl(urls.get(i)));
                item.put("title", stripHtmlEntities(titles.get(i)));
                item.put("snippet", i < snippets.size() ? stripHtmlEntities(snippets.get(i)) : "");
                results.add(item);
            }
        } catch (Exception e) {
            logger.severe("Lỗi khi tìm kiếm DuckDuckGo: " + e.getMessage());
        }
        return results;
    }

    private boolean isWebSearchQuery(String query) {
        String normalized = normalizeVietnamese(query == null ? "" : query).toLowerCase(Locale.ROOT);
        return normalized.contains("google")
                || normalized.contains("len mang")
                || normalized.contains("tra cuu mang")
                || normalized.contains("tim tai lieu")
                || normalized.contains("tim tren web")
                || normalized.contains("tim kiem web")
                || normalized.contains("nguon tham khao")
                || normalized.contains("link nguon")
                || normalized.contains("moi nhat")
                || normalized.matches(".*\\b(gg|gugol|gut go|sot|search|seach|serch|tra gg|hoi gg|len gg|tim gg|sot gg)\\b.*");
    }

    private String buildWebSearchContext(String query, List<Map<String, String>> results) {
        if (results == null || results.isEmpty()) {
            return "\n--- KẾT QUẢ TÌM KIẾM WEB THỰC TẾ ---\n"
                    + "Không lấy được kết quả web cho truy vấn: \"" + query + "\". Nếu trả lời, hãy nói rõ chưa có nguồn web kiểm chứng, không tự bịa link.\n";
        }
        StringBuilder sb = new StringBuilder("\n--- KẾT QUẢ TÌM KIẾM WEB THỰC TẾ ---\n");
        sb.append("Truy vấn: ").append(query).append("\n");
        sb.append("Chỉ được trích dẫn các URL dưới đây; không tự tạo link nguồn khác.\n");
        int index = 1;
        for (Map<String, String> item : results) {
            sb.append(index++).append(". ")
                    .append(item.getOrDefault("title", "Không tiêu đề"))
                    .append(" | ")
                    .append(item.getOrDefault("url", ""))
                    .append(" | ")
                    .append(item.getOrDefault("snippet", ""))
                    .append("\n");
        }
        sb.append("\nQUAN TRỌNG: Khi trả lời, bạn BẮT BUỘC phải đính kèm các link ở trên dưới dạng thẻ Markdown thân thiện (VD: [Tên Trang](URL)) vào cuối phần tư vấn để người dùng có thể bấm trực tiếp vào xem luôn.\n");
        return sb.toString();
    }

    private String buildRealtimeContext() {
        String now = LocalDateTime.now(VN_ZONE).format(VN_TIME_FORMATTER);
        return "--- THỜI GIAN HỆ THỐNG HIỆN TẠI ---\n"
                + "Bây giờ là " + now + " theo múi giờ Việt Nam (Asia/Ho_Chi_Minh). "
                + "Khi người dùng nói hôm nay/ngày mai/hiện tại, phải hiểu theo thời điểm này; không dùng ngày cũ trong ví dụ hoặc lịch sử chat.\n";
    }

    private boolean isQuickLocalQuery(String normalizedQuery) {
        if (normalizedQuery == null) return false;
        String q = normalizedQuery.trim().replaceAll("[!?.\\s]+$", "");
        if (q.isEmpty()) return true;
        String[] quickPhrases = {
                "hi", "hello", "helo", "hey", "alo", "chao", "xin chao", "chao rexi",
                "ok", "oke", "okay", "cam on", "thanks", "thank you", "test", "thu xem"
        };
        for (String phrase : quickPhrases) {
            if (q.equals(phrase)) {
                return true;
            }
        }
        if (q.contains("ban ho tro gi") || q.contains("rexi la gi")
                || q.contains("hotline") || q.contains("so dien thoai")
                || q.contains("dia chi") || q.contains("gio lam viec")) {
            return true;
        }
        return q.length() <= 12 && (q.startsWith("hi ") || q.startsWith("chao "));
    }

    private String buildQuickLocalReply(String normalizedQuery) {
        String q = normalizedQuery == null ? "" : normalizedQuery.trim();
        if (q.contains("cam on") || q.contains("thank")) {
            return "Dạ không có gì ạ. Sen cần Rexi hỗ trợ thêm việc gì cứ nhắn nhé.";
        }
        if (q.equals("ok") || q.equals("oke") || q.equals("okay")) {
            return "Dạ, Rexi nghe đây ạ.";
        }
        if (q.equals("test") || q.equals("thu xem")) {
            return "Rexi đang hoạt động bình thường ạ.";
        }
        if (q.contains("hotline") || q.contains("so dien thoai")) {
            return "Hotline Phòng khám Thú y Rexi: 0353.374.156.";
        }
        if (q.contains("dia chi")) {
            return "Địa chỉ Phòng khám Thú y Rexi: Số 68, Ngõ 10, Đường Ngô Xuân Quảng, Trâu Quỳ, Gia Lâm, Hà Nội.";
        }
        if (q.contains("gio lam viec")) {
            return "Rexi chưa có lịch giờ làm việc cố định trong tin nhắn nhanh này. Sen gọi hotline 0353.374.156 để xác nhận khung giờ khám chính xác nhé.";
        }
        if (q.contains("rexi la gi")) {
            return "Rexi là trợ lý thú y của Phòng khám Thú y Rexi, hỗ trợ tư vấn chăm sóc thú cưng, đặt lịch, tra cứu thông tin phòng khám và hướng dẫn thao tác trên hệ thống.";
        }
        if (q.contains("ban ho tro gi")) {
            return "Rexi có thể hỗ trợ tư vấn chăm sóc thú cưng, đặt lịch khám, hướng dẫn dùng hệ thống, tra cứu dịch vụ và cung cấp thông tin liên hệ phòng khám.";
        }
        return "Dạ Rexi đây ạ. Sen cần hỗ trợ gì hôm nay?";
    }

    private boolean isUserComplaintQuery(String normalizedQuery) {
        if (normalizedQuery == null || normalizedQuery.isBlank()) return false;
        String q = normalizedQuery.trim();
        boolean slowComplaint = q.contains("chay nhu rua")
                || q.contains("chay cham")
                || q.contains("phan hoi lau")
                || q.contains("lag")
                || q.contains("giat")
                || q.contains("treo")
                || q.contains("loading lau")
                || q.contains("khong hieu gi")
                || q.contains("dung kieu gi")
                || q.contains("kho dung");
        boolean mentionsSystem = q.contains("web") || q.contains("chatbot") || q.contains("agent")
                || q.contains("trang") || q.contains("he thong") || q.contains("app");
        return slowComplaint && mentionsSystem;
    }

    private String buildUserComplaintReply(String normalizedQuery) {
        if (normalizedQuery != null && (normalizedQuery.contains("khong hieu gi") || normalizedQuery.contains("dung kieu gi"))) {
            return "Mình hiểu là bạn đang bị vướng cách dùng. Bạn cho Rexi biết bạn đang ở trang nào hoặc muốn làm việc gì: đặt lịch, xem hóa đơn, tìm khách hàng, xem bệnh án hay dùng chatbot? Rexi sẽ hướng dẫn đúng từng bước, không cần bạn nhập câu lệnh chuẩn.";
        }
        return "Mình hiểu là bạn đang phản ánh hệ thống/chatbot phản hồi chậm. Trước mắt bạn thử tải lại trang, kiểm tra mạng và đóng bớt tab nặng. Nếu vẫn chậm, Admin nên kiểm tra 3 điểm: backend `/api/system/health`, log lỗi provider AI, và thời gian phản hồi của `/api/chat` hoặc `/api/agent/react`. Rexi sẽ không đoán dữ liệu; nếu backend/AI nghẽn thì nên báo rõ thay vì trả lời lung tung.";
    }

    private String tryLocalDocumentQuestionReply(String userQuery) {
        if (userQuery == null || userQuery.length() <= 1000) return null;
        String normalized = normalizeVietnamese(userQuery.toLowerCase());
        boolean asksSummaryOrDetail = normalized.contains("tom tat")
                || normalized.contains("chi tiet quan trong")
                || normalized.contains("tim mot chi tiet")
                || normalized.contains("noi dung quan trong")
                || normalized.contains("hoi:");
        if (!asksSummaryOrDetail) return null;

        String compact = userQuery.replaceAll("\\s+", " ").trim();
        Matcher important = Pattern.compile("(?i)(Chi tiết quan trọng|Chi tiet quan trong)\\s*:\\s*([^\\.\\n]+(?:\\.[^\\.\\n]+){0,2})").matcher(compact);
        if (important.find()) {
            return "Chi tiết quan trọng trong tài liệu là: " + important.group(2).trim()
                    + "\n\nRexi đã xử lý phần này bằng bộ đọc nội bộ để tránh gửi toàn bộ tài liệu dài lên provider AI.";
        }

        int questionIndex = Math.max(compact.toLowerCase(Locale.ROOT).lastIndexOf("hỏi:"), compact.toLowerCase(Locale.ROOT).lastIndexOf("hoi:"));
        String body = questionIndex > 0 ? compact.substring(0, questionIndex).trim() : compact;
        String sample = body.length() > 700 ? body.substring(0, 700) + "..." : body;
        return "Tóm tắt nhanh tài liệu: " + sample
                + "\n\nTài liệu khá dài nên Rexi chỉ trích phần liên quan/tóm tắt cục bộ trước, không đẩy toàn bộ nội dung lên AI để tránh tốn token và lộ ngữ cảnh không cần thiết.";
    }

    private String tryLocalVeterinaryReply(String normalizedQuery, String rawQuery) {
        if (normalizedQuery == null || normalizedQuery.isBlank()) return null;
        String q = normalizedQuery.trim();

        if (containsAny(q, "ca rong", "chim canh", "chim", "ca canh", "bo sat", "ran canh")
                && containsAny(q, "ban", "kham", "dich vu", "ho tro", "web minh", "phong kham")) {
            return "Dạ hiện tại Rexi tập trung hỗ trợ thú cưng phổ biến như chó, mèo và một số thú nhỏ. Với cá rồng/chim cảnh, phòng khám chưa có dịch vụ chuyên sâu cố định nên Rexi không muốn tư vấn quá tay. Nếu bé có dấu hiệu nguy cấp, Sen nên liên hệ cơ sở thú y chuyên cá/chim cảnh gần nhất hoặc gọi Rexi để được hướng dẫn kênh phù hợp.";
        }

        if (containsAny(q, "meo") && containsAny(q, "moi de", "vua de", "de con", "meo con", "meo me")) {
            return "Với mèo mẹ mới đẻ, Sen ưu tiên 4 việc: giữ ổ ấm, khô và yên tĩnh; cho mèo mẹ ăn khẩu phần giàu năng lượng/đạm và luôn có nước sạch; theo dõi mèo con bú đều, không bị lạnh, không kêu yếu kéo dài; không tắm hoặc bế mèo con quá nhiều trong vài ngày đầu. Nếu mèo mẹ bỏ ăn, sốt, chảy dịch hôi, bỏ con hoặc mèo con lạnh/yếu không bú thì nên đưa tới bác sĩ thú y sớm.";
        }

        if (containsAny(q, "di ngoai ra nuoc", "di ngoai", "tieu chay", "phan long")
                && containsAny(q, "mui hoi", "hoi lam", "ra nuoc", "cun", "cho")) {
            return "Rexi hiểu là cún đang có dấu hiệu **tiêu chảy nước, mùi hôi**. Đây có thể là rối loạn tiêu hóa, nhiễm khuẩn/ký sinh trùng, và ở chó con hoặc chó chưa tiêm đủ vaccine cần đặc biệt cảnh giác **Parvovirus**. Việc cần làm ngay: cho bé uống nước từng ít một, không tự dùng thuốc cầm tiêu chảy của người, theo dõi nôn/sốt/lừ đừ/phân máu. Nếu bé còn nhỏ, bỏ ăn, nôn, lừ đừ hoặc tiêu chảy liên tục thì nên mang tới phòng khám trong ngày để test và truyền dịch nếu cần.";
        }

        if (containsAny(q, "bo an", "khong an", "an it")
                && containsAny(q, "nguoi nong", "nong lam", "sot", "meo")) {
            return "Rexi hiểu theo ngôn ngữ thú y là mèo có dấu hiệu **bỏ ăn kèm nghi sốt**. Mèo bỏ ăn quá 24 giờ đã đáng lo, nhất là nếu người nóng, lừ đừ, trốn, thở nhanh hoặc nôn. Sen nên đo nhiệt độ hậu môn nếu có nhiệt kế thú y; mèo thường khoảng 38-39.2°C, cao hơn nên đi khám. Trước mắt giữ bé ở nơi mát, có nước sạch, không tự cho uống thuốc hạ sốt của người vì có thể gây ngộ độc. Nên đặt lịch khám sớm để bác sĩ kiểm tra nguyên nhân nhiễm trùng/đau/stress.";
        }

        if (containsAny(q, "ngua tai", "gay tai", "lac dau", "hoi tai", "poodle", "da lieu")) {
            return "Dấu hiệu ngứa tai/lắc đầu ở Poodle thường liên quan viêm tai ngoài, nấm/vi khuẩn, ve tai hoặc dị ứng da. Không nên tự nhỏ thuốc khi chưa soi tai vì nếu màng nhĩ tổn thương có thể nguy hiểm. Sen nên đặt lịch khám da liễu/tai để bác sĩ soi tai, vệ sinh đúng cách và kê thuốc phù hợp.";
        }

        return null;
    }

    private String tryLocalFollowUpReply(List<ChatMessage> history, String normalizedLatestQuery) {
        if (history == null || history.size() < 2 || normalizedLatestQuery == null) return null;
        boolean asksScheduleFollowUp = normalizedLatestQuery.contains("chu nhat")
                || normalizedLatestQuery.contains("sang chu nhat")
                || normalizedLatestQuery.contains("chieu chu nhat")
                || normalizedLatestQuery.contains("cuoi tuan")
                || normalizedLatestQuery.matches(".*\\b(thay|chuyen|doi)\\b.*\\b(sang|chieu|toi|ngay)\\b.*");
        if (!asksScheduleFollowUp) return null;

        StringBuilder recent = new StringBuilder();
        int start = Math.max(0, history.size() - 6);
        for (int i = start; i < history.size() - 1; i++) {
            ChatMessage msg = history.get(i);
            if (msg.getContent() != null) {
                recent.append(' ').append(normalizeVietnamese(msg.getContent().toLowerCase()));
            }
        }
        String ctx = recent.toString();
        boolean appointmentContext = ctx.contains("dat lich") || ctx.contains("lich kham") || ctx.contains("tiem phong");
        if (!appointmentContext) return null;

        String petName = extractPetNameFromContext(ctx);
        String petText = petName.isBlank() ? "bé" : "bé " + petName;
        return "Được ạ, Rexi hiểu mình vẫn đang nói về lịch tiêm phòng/khám cho " + petText
                + ". Nếu chuyển sang sáng Chủ nhật thì nên chọn khung 08:00-10:30 để bé đỡ mệt và phòng khám dễ sắp bác sĩ. "
                + "Để chốt lịch thật trên hệ thống, Sen/Sếp chuyển sang Rexi Agent hoặc cung cấp thêm ngày cụ thể, SĐT khách hàng, thú cưng và dịch vụ cần đặt.";
    }

    private String extractPetNameFromContext(String normalizedContext) {
        if (normalizedContext == null || normalizedContext.isBlank()) return "";
        Matcher matcher = Pattern.compile("\\bbe\\s+([a-z0-9_-]{2,20})").matcher(normalizedContext);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return "";
    }

    private boolean isAutopilotQuery(String normalizedQuery) {
        if (normalizedQuery == null || normalizedQuery.isBlank()) return false;
        String[] actionKeywords = {
                "mo trang", "dua toi den", "chuyen sang", "di toi", "vao trang",
                "qua trang", "nhay qua", "tele qua", "bay qua", "dan toi", "dan den",
                "dat lich", "book lich", "lap lich", "tao lich", "huy lich", "doi lich",
                "them", "sua", "xoa", "dien", "fill", "chon", "bam", "click", "tap", "an vao",
                "tim khach", "tim ho so", "tra cuu khach", "quet du lieu", "check giup", "check ho"
        };
        for (String kw : actionKeywords) {
            if (normalizedQuery.contains(kw)) {
                return true;
            }
        }
        return false;
    }

    private boolean isClinicInfoQuery(String normalizedQuery) {
        if (normalizedQuery == null || normalizedQuery.isBlank()) return false;
        String[] clinicKeywords = {
                "bang gia", "gia tien", "chi phi", "dich vu", "lich lam viec",
                "bac si", "bsi", "dia chi", "hotline", "so dien thoai", "phong kham",
                "gio mo cua", "gio lam viec", "rexi"
        };
        for (String kw : clinicKeywords) {
            if (normalizedQuery.contains(kw)) {
                return true;
            }
        }
        return false;
    }

    private boolean isMedicalQuery(String normalizedQuery) {
        if (normalizedQuery == null || normalizedQuery.isBlank()) return false;
        String[] medicalPhrases = {
                "trieu chung", "trieu chuong", "tieu chay", "tieu chai", "dieu tri", "chan doan",
                "toa thuoc", "ke don", "suc khoe", "bac si", "bac sy", "cap cuu", "tai nan",
                "chong mat", "co giat", "kho tho", "di ngoai", "bo an", "lo loet", "viem da"
        };
        for (String kw : medicalPhrases) {
            if (containsNormalizedTokenOrPhrase(normalizedQuery, kw)) return true;
        }
        String[] medicalTokens = {
                "benh", "thuoc", "thuooc", "sot", "soot", "non", "kham", "bnh", "bsi",
                "oi", "ia", "ngua", "ho", "dau"
        };
        for (String kw : medicalTokens) {
            if (containsNormalizedTokenOrPhrase(normalizedQuery, kw)) return true;
        }
        return false;
    }

    private boolean containsNormalizedTokenOrPhrase(String normalizedQuery, String keyword) {
        if (normalizedQuery == null || keyword == null || keyword.isBlank()) return false;
        String paddedQuery = " " + normalizedQuery + " ";
        String normalizedKeyword = normalizeVietnamese(keyword.toLowerCase(Locale.ROOT));
        return normalizedKeyword.contains(" ")
                ? paddedQuery.contains(" " + normalizedKeyword + " ")
                : Arrays.asList(normalizedQuery.split("\\s+")).contains(normalizedKeyword);
    }

    private void auditMedicalAiReplyIfNeeded(String userQuery, String reply, String userRoleName, String provider, String route) {
        try {
            String combined = normalizeVietnamese(((userQuery == null ? "" : userQuery) + " " + (reply == null ? "" : reply)).toLowerCase(Locale.ROOT));
            boolean medical = containsAny(combined,
                    "thuoc", "duoc", "lieu", "khang sinh", "phac do", "dieu tri", "chan doan",
                    "xet nghiem", "benh", "trieu chung", "cap cuu", "ngo doc", "gay me");
            if (!medical) return;

            boolean clinicalRole = "Bác sĩ".equals(userRoleName) || "Y tá".equals(userRoleName);
            String detail = "scope=" + (clinicalRole ? "CLINICAL_REFERENCE" : "CUSTOMER_SAFE_ADVICE")
                    + "; role=" + userRoleName
                    + "; provider=" + provider
                    + "; route=" + route
                    + "; query=" + compactForAudit(userQuery)
                    + "; replyPreview=" + compactForAudit(reply);
            auditLogService.logAction("AI_MEDICAL_ADVICE", "ChatController", detail);
        } catch (Exception ex) {
            logger.warning("Không thể ghi audit y khoa AI: " + ex.getMessage());
        }
    }

    private String compactForAudit(String value) {
        if (value == null) return "";
        return value.replaceAll("\\s+", " ").trim().substring(0, Math.min(600, value.replaceAll("\\s+", " ").trim().length()));
    }

    private ChatPersonaContext buildPersonaContext(boolean isStaff, String userRoleName, ChatRequestPlan plan, boolean isLoggedIn) {
        String audience = isStaff ? ("nhân sự nội bộ phòng khám - " + userRoleName) : "khách hàng/chủ nuôi";
        String tone = isStaff
                ? "chuyên nghiệp, ngắn gọn, trực tiếp, gọi là sếp hoặc đồng nghiệp"
                : "ấm áp, dễ hiểu, trấn an, gọi khách là Sen và thú cưng là bé/boss";

        String mode = switch (plan.route()) {
            case MEDIA_AI -> "phân tích ảnh/video thú y";
            case MEDICAL_AI -> "tư vấn y khoa thú y";
            case WEB_AI -> "tìm kiếm web có trích nguồn";
            case AUTOPILOT_AI -> "hỗ trợ thao tác giao diện có kiểm soát";
            case CHAT_AI -> "chat tư vấn nhanh";
            case DB_LOCAL -> "tra cứu dữ liệu hệ thống";
            case SENSITIVE_HANDOFF -> "chuyển giao sang agent dữ liệu";
            case QUICK_LOCAL -> "trả lời nhanh nội bộ";
        };

        boolean isClinicalStaff = isStaff && ("Bác sĩ".equals(userRoleName) || "Y tá".equals(userRoleName));

        String allowedActions = switch (plan.route()) {
            case MEDIA_AI -> "mô tả dấu hiệu nhìn thấy, đánh giá mức độ khẩn, hỏi thêm thông tin còn thiếu";
            case MEDICAL_AI -> isClinicalStaff
                    ? "hỗ trợ lâm sàng chuyên sâu: chẩn đoán phân biệt, xét nghiệm cần cân nhắc, nhóm thuốc/phác đồ tham khảo, cảnh báo chống chỉ định"
                    : "tư vấn chăm sóc/sơ cứu, nêu khả năng, khuyến nghị đi khám khi có dấu hiệu nguy hiểm";
            case WEB_AI -> "tổng hợp thông tin từ nguồn thật và trích link rõ ràng";
            case AUTOPILOT_AI -> "chỉ dùng tag thao tác khi người dùng yêu cầu rõ và data-ai-id tồn tại";
            case CHAT_AI -> "trả lời trực tiếp, hỏi thêm khi thiếu dữ kiện, hướng dẫn dùng hệ thống";
            default -> "trả lời theo dữ liệu đã được backend cung cấp";
        };

        String medicalForbidden = isClinicalStaff
                ? "không ra quyết định thay bác sĩ phụ trách; không khẳng định chẩn đoán khi thiếu khám trực tiếp/xét nghiệm; không bỏ qua cân nặng, tuổi, loài và chống chỉ định khi nhắc tới thuốc; "
                : "không chẩn đoán chắc chắn, không kê đơn thuốc, không nêu liều dùng/kháng sinh/thuốc kê đơn; ";

        String forbiddenActions = "không bịa dữ liệu hệ thống; không tự nhận đã tra DB nếu route không cho đọc DB; "
                + medicalForbidden
                + "không tạo link nguồn giả; "
                + (isLoggedIn ? "" : "không tạo lịch/đơn/hành động tài khoản khi người dùng chưa đăng nhập; ")
                + "không dùng Autopilot nếu người dùng chỉ hỏi thông tin.";

        return new ChatPersonaContext(audience, mode, tone, allowedActions, forbiddenActions);
    }

    private String renderPersonaBlock(ChatPersonaContext persona, ChatRequestPlan plan, String currentPath) {
        return "--- CHAT PERSONA CONTEXT (BẮT BUỘC TUÂN THỦ) ---\n"
                + "Người đang nói chuyện: " + persona.audience() + ".\n"
                + "Chế độ xử lý request: " + persona.mode() + " (" + plan.route() + ").\n"
                + "Provider ưu tiên: " + plan.providerHint() + ".\n"
                + "Màn hình hiện tại: " + currentPath + ".\n"
                + "Giọng điệu: " + persona.tone() + ".\n"
                + "Được phép: " + persona.allowedActions() + ".\n"
                + "Không được phép: " + persona.forbiddenActions() + ".\n"
                + "Nguyên tắc tốc độ/độ đúng: trả lời ngắn và đúng việc trước; nếu câu hỏi là lệnh chuyển trang/thao tác rõ ràng thì phản hồi bằng hành động hoặc tag điều hướng ngay, không giải thích dài; chỉ đọc DB, web, DOM hoặc gọi AI nặng khi route cho phép; nếu thiếu dữ liệu thì nói rõ thiếu dữ liệu thay vì đoán.\n"
                + "Hiểu ngôn ngữ tự nhiên và Gen Z: các cách nói như 'check giúp', 'qua trang', 'tele qua', 'book lịch', 'bill', 'acc', 'boss/be nhà tôi', 'khum/hông' phải được hiểu theo ý định thật, không bắt người dùng nói đúng thuật ngữ hệ thống.\n"
                + "--- HẾT PERSONA CONTEXT ---\n\n";
    }

    private ChatRequestPlan planChatRequest(String normalizedQuery, String rawQuery, boolean hasMedia) {
        if (!hasMedia && isQuickLocalQuery(normalizedQuery)) {
            return new ChatRequestPlan(ChatRoute.QUICK_LOCAL, false, false, false, false, "local");
        }
        if (!hasMedia && isSensitiveDataLookup(normalizedQuery)) {
            return new ChatRequestPlan(ChatRoute.SENSITIVE_HANDOFF, false, false, false, false, "agent");
        }
        if (!hasMedia && isDbLocalQuery(normalizedQuery)) {
            return new ChatRequestPlan(ChatRoute.DB_LOCAL, true, false, false, true, "database");
        }
        if (hasMedia) {
            return new ChatRequestPlan(ChatRoute.MEDIA_AI, false, true, false, true, "gemini");
        }
        if (isWebSearchQuery(rawQuery)) {
            return new ChatRequestPlan(ChatRoute.WEB_AI, false, true, false, true, "web+ai");
        }
        if (isAutopilotQuery(normalizedQuery)) {
            return new ChatRequestPlan(ChatRoute.AUTOPILOT_AI, false, true, false, true, "groq");
        }
        if (isMedicalQuery(normalizedQuery)) {
            return new ChatRequestPlan(ChatRoute.MEDICAL_AI, false, true, false, true, "gemini");
        }
        boolean needsClinicContext = isClinicInfoQuery(normalizedQuery);
        return new ChatRequestPlan(ChatRoute.CHAT_AI, false, true, true, needsClinicContext, "groq");
    }

    private boolean isDbLocalQuery(String normalizedQuery) {
        return isServicePriceQuery(normalizedQuery)
                || isScheduleQuery(normalizedQuery)
                || isDoctorListQuery(normalizedQuery);
    }

    private String tryFastDbReply(String normalizedQuery, String rawQuery) {
        if (normalizedQuery == null || normalizedQuery.isBlank()) return null;
        if (isSensitiveDataLookup(normalizedQuery)) {
            return buildSensitiveDataHandoffReply();
        }
        try {
            if (isServicePriceQuery(normalizedQuery)) {
                return buildServicePriceReply(normalizedQuery);
            }
            if (isScheduleQuery(normalizedQuery)) {
                return buildScheduleReply(normalizedQuery);
            }
            if (isDoctorListQuery(normalizedQuery)) {
                return buildDoctorListReply();
            }
        } catch (Exception e) {
            logger.warning("[FAST_DB] Không thể trả lời nhanh bằng DB: " + e.getMessage());
            return "Dữ liệu hệ thống hiện chưa sẵn sàng để tra cứu chính xác. Tôi sẽ không đoán bừa phần này; bạn kiểm tra lại kết nối SQL Server hoặc thử lại sau ít giây.";
        }
        return "Tôi chưa tìm thấy dữ liệu khớp rõ trong hệ thống. Bạn nhập cụ thể hơn tên dịch vụ, bác sĩ, lịch trực hoặc chuyển sang Rexi Agent để quét dữ liệu sâu hơn.";
    }

    private String buildSensitiveDataHandoffReply() {
        return "Dạ phần tra cứu khách hàng, thú cưng, bệnh án hoặc hóa đơn là dữ liệu nội bộ. Sen/sếp vui lòng chuyển sang **Rexi Agent** để hệ thống kiểm tra quyền và quét dữ liệu thật, tránh chatbot thường tìm nhầm hoặc lộ dữ liệu.";
    }

    private Map<String, Object> runAgentFromChat(
            String userQuery,
            String username,
            org.springframework.security.core.Authentication auth
    ) {
        if (username == null || auth == null) {
            return Map.of(
                    "reply", "Dạ phần này cần tra cứu dữ liệu nội bộ thời gian thực. Sen/sếp đăng nhập tài khoản trước để Rexi kiểm tra quyền và lấy dữ liệu chính xác nhé.",
                    "source", "agent_auth_required"
            );
        }

        String userRole = auth.getAuthorities().stream()
                .findFirst()
                .map(g -> g.getAuthority().replace("ROLE_", ""))
                .orElse("");

        try {
            ReActAgentService.ReActResult result = reactAgentService.run(userQuery, username, userRole);
            List<Map<String, Object>> stepsData = new ArrayList<>();
            for (var step : result.steps()) {
                Map<String, Object> s = new java.util.LinkedHashMap<>();
                s.put("type", step.type());
                s.put("content", step.content());
                if (step.toolName() != null) s.put("tool", step.toolName());
                if (step.toolParams() != null) s.put("params", step.toolParams());
                if (step.observation() != null) s.put("observation", step.observation());
                stepsData.add(s);
            }

            return Map.of(
                    "reply", result.finalAnswer(),
                    "source", "react_agent_auto",
                    "provider", result.provider(),
                    "steps", stepsData,
                    "totalSteps", stepsData.size()
            );
        } catch (Exception e) {
            logger.severe("[CHAT->AGENT] Lỗi tự chuyển Rexi Agent: " + e.getMessage());
            return Map.of(
                    "reply", "Rexi đã tự chuyển sang Agent để tra dữ liệu thật nhưng gặp lỗi hệ thống. Sếp thử lại sau ít giây hoặc kiểm tra backend/AI provider giúp em nhé.",
                    "source", "react_agent_auto_error"
            );
        }
    }

    private boolean isSensitiveDataLookup(String q) {
        String[] keywords = {
                "tim khach", "tra khach", "tim thu cung", "tim boss", "tim benh an",
                "tra benh an", "tim hoa don", "hoa don cua", "lich su kham cua",
                "khach hang ten", "so dien thoai khach", "email khach", "email cua khach",
                "thong tin ca nhan", "profile cua toi", "ho so cua toi", "tai khoan cua toi",
                "lich hen cua toi", "lich kham cua toi", "hoa don cua toi", "thu cung cua toi",
                "be cua toi", "pet cua toi", "don thuoc cua toi", "benh an cua toi",
                "lich hen hom nay", "hoa don chua thanh toan", "kho thuoc", "ton kho",
                "khach hang nao", "co khach hang", "co hoa don", "co lich hen",
                "check profile", "check lich", "check hoa don", "check bill", "bill cua toi",
                "boss cua toi", "be nha toi", "pet nha toi", "acc cua toi", "info cua toi"
        };
        for (String kw : keywords) {
            if (q.contains(kw)) return true;
        }
        return false;
    }

    private boolean isServicePriceQuery(String q) {
        return q.contains("bang gia") || q.contains("gia dich vu") || q.contains("chi phi")
                || q.contains("bao nhieu tien") || q.contains("gia bao nhieu")
                || (q.contains("gia") && (q.contains("kham") || q.contains("tiem") || q.contains("spa")
                        || q.contains("sieu am") || q.contains("xet nghiem") || q.contains("dich vu")));
    }

    private boolean isScheduleQuery(String q) {
        return (q.contains("lich") || q.contains("truc") || q.contains("hom nay") || q.contains("ngay mai"))
                && (q.contains("bac si") || q.contains("bsi") || q.contains("kham") || q.contains("truc"));
    }

    private boolean isDoctorListQuery(String q) {
        return (q.contains("bac si") || q.contains("bsi"))
                && (q.contains("nao") || q.contains("danh sach") || q.contains("co ai") || q.contains("gioi thieu"));
    }

    private String buildServicePriceReply(String normalizedQuery) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT TOP 30 ten_dich_vu, gia, thoi_luong_phut FROM DichVu "
                        + "WHERE (da_xoa = 0 OR da_xoa IS NULL) AND (trang_thai = 1 OR trang_thai IS NULL) "
                        + "ORDER BY ten_dich_vu");
        List<String> terms = extractDbSearchTerms(normalizedQuery);
        List<Map<String, Object>> matched = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            String name = normalizeVietnamese(String.valueOf(row.getOrDefault("ten_dich_vu", "")).toLowerCase(Locale.ROOT));
            boolean match = terms.isEmpty();
            for (String term : terms) {
                if (name.contains(term)) {
                    match = true;
                    break;
                }
            }
            if (match) matched.add(row);
        }
        if (matched.isEmpty() && !terms.isEmpty()) {
            return "Rexi chưa tìm thấy dịch vụ khớp rõ trong bảng giá. Sen nhập tên dịch vụ cụ thể hơn, ví dụ: khám tổng quát, tiêm phòng, xét nghiệm máu.";
        }
        if (matched.isEmpty()) return null;
        StringBuilder sb = new StringBuilder("Rexi tra bảng giá trực tiếp từ hệ thống:\n");
        int count = 0;
        for (Map<String, Object> row : matched) {
            if (++count > 8) break;
            sb.append("- ").append(row.get("ten_dich_vu"))
                    .append(": ").append(formatMoney(row.get("gia"))).append(" VND");
            Object minutes = row.get("thoi_luong_phut");
            if (minutes != null) sb.append(" (~").append(minutes).append(" phút)");
            sb.append("\n");
        }
        if (matched.size() > 8) sb.append("... còn ").append(matched.size() - 8).append(" dịch vụ khác, Sen hỏi tên dịch vụ cụ thể để Rexi lọc tiếp.");
        return sb.toString().trim();
    }

    private String buildScheduleReply(String normalizedQuery) {
        LocalDateTime now = LocalDateTime.now(VN_ZONE);
        java.time.LocalDate from = now.toLocalDate();
        java.time.LocalDate to = normalizedQuery.contains("ngay mai") ? from.plusDays(1) : from.plusDays(7);
        if (normalizedQuery.contains("hom nay")) {
            to = from;
        }
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT TOP 12 llv.ngay_lam, llv.gio_bat_dau, llv.gio_ket_thuc, llv.ghi_chu, nv.ho_ten, nv.chuyen_mon "
                        + "FROM LichLamViecNhanVien llv JOIN NhanVien nv ON nv.id_nhan_vien = llv.id_nhan_vien "
                        + "WHERE llv.ngay_lam BETWEEN ? AND ? AND (nv.da_xoa = 0 OR nv.da_xoa IS NULL) "
                        + "AND EXISTS (SELECT 1 FROM TaiKhoan tk WHERE tk.id_nhan_vien = nv.id_nhan_vien AND tk.id_vai_tro = 'VT-BS') "
                        + "AND nv.ho_ten NOT LIKE N'%Kiểm thử%' AND nv.ho_ten NOT LIKE N'%Admin%' AND nv.ho_ten NOT LIKE N'%Tiếp tân%' "
                        + "ORDER BY llv.ngay_lam, llv.gio_bat_dau",
                java.sql.Date.valueOf(from), java.sql.Date.valueOf(to));
        if (rows.isEmpty()) {
            return "Rexi chưa thấy lịch trực phù hợp trong hệ thống cho khoảng thời gian này. Sen gọi hotline 0353.374.156 để được xác nhận lịch khám mới nhất.";
        }
        StringBuilder sb = new StringBuilder("Rexi tra lịch trực trực tiếp từ hệ thống:\n");
        for (Map<String, Object> row : rows) {
            sb.append("- ").append(row.get("ngay_lam"))
                    .append(": BS. ").append(row.get("ho_ten"))
                    .append(" từ ").append(row.get("gio_bat_dau"))
                    .append(" đến ").append(row.get("gio_ket_thuc"));
            Object note = row.get("ghi_chu");
            if (note != null && !String.valueOf(note).isBlank()) sb.append(" (").append(note).append(")");
            sb.append("\n");
        }
        return sb.toString().trim();
    }

    private String buildDoctorListReply() {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT TOP 8 ho_ten, chuyen_mon, gioi_thieu FROM NhanVien "
                        + "WHERE (da_xoa = 0 OR da_xoa IS NULL) "
                        + "AND EXISTS (SELECT 1 FROM TaiKhoan tk WHERE tk.id_nhan_vien = NhanVien.id_nhan_vien AND tk.id_vai_tro = 'VT-BS') "
                        + "AND ho_ten NOT LIKE N'%Kiểm thử%' AND ho_ten NOT LIKE N'%Admin%' AND ho_ten NOT LIKE N'%Tiếp tân%' "
                        + "AND (chuyen_mon IS NOT NULL OR gioi_thieu IS NOT NULL) "
                        + "ORDER BY ho_ten");
        if (rows.isEmpty()) return null;
        StringBuilder sb = new StringBuilder("Rexi tra danh sách bác sĩ/nhân sự chuyên môn từ hệ thống:\n");
        for (Map<String, Object> row : rows) {
            String doctorName = String.valueOf(row.get("ho_ten"));
            sb.append("- ");
            if (!normalizeVietnamese(doctorName.toLowerCase(Locale.ROOT)).startsWith("bs")) {
                sb.append("BS. ");
            }
            sb.append(doctorName);
            Object specialty = row.get("chuyen_mon");
            if (specialty != null && !String.valueOf(specialty).isBlank()) {
                sb.append(" - ").append(specialty);
            }
            sb.append("\n");
        }
        return sb.toString().trim();
    }

    private List<String> extractDbSearchTerms(String normalizedQuery) {
        String cleaned = normalizedQuery
                .replace("bang gia", " ")
                .replace("gia dich vu", " ")
                .replace("chi phi", " ")
                .replace("bao nhieu tien", " ")
                .replace("gia bao nhieu", " ")
                .replace("dich vu", " ")
                .replace("gia", " ");
        List<String> terms = new ArrayList<>();
        for (String term : cleaned.split("\\s+")) {
            if (term.length() >= 3 && !List.of("cho", "toi", "xem", "cua", "bao", "nhieu", "tien", "rexi").contains(term)) {
                terms.add(term);
            }
        }
        return terms;
    }

    private String formatMoney(Object value) {
        if (value == null) return "0";
        try {
            java.math.BigDecimal number = new java.math.BigDecimal(String.valueOf(value));
            return String.format(Locale.US, "%,.0f", number);
        } catch (Exception ignored) {
            return String.valueOf(value);
        }
    }

    private String buildMediaPrompt(String rawPrompt, boolean hasImage, boolean hasVideo) {
        String userPrompt = rawPrompt == null ? "" : rawPrompt.trim();
        String mediaType = hasImage && hasVideo ? "ảnh và video" : hasVideo ? "video" : "ảnh";
        String base = "Bạn đang phân tích " + mediaType + " thú y bằng năng lực đa phương tiện. "
                + "Hãy mô tả dấu hiệu nhìn thấy được, mức độ khẩn cấp, các khả năng nguyên nhân theo thứ tự ưu tiên, "
                + "việc chủ nuôi có thể làm ngay, dấu hiệu cần đi cấp cứu và thông tin còn thiếu cần hỏi thêm. "
                + "Không được chẩn đoán chắc chắn hoặc kê đơn chỉ dựa trên ảnh/video; nếu hình/video mờ hoặc không đủ dữ liệu phải nói rõ.";
        return userPrompt.isBlank() ? base : userPrompt + "\n\n" + base;
    }

    private String cleanDuckDuckGoUrl(String rawUrl) {
        if (rawUrl == null) return "";
        String decoded = stripHtmlEntities(rawUrl);
        try {
            if (decoded.contains("uddg=")) {
                String query = java.net.URI.create(decoded).getRawQuery();
                if (query != null) {
                    for (String part : query.split("&")) {
                        if (part.startsWith("uddg=")) {
                            return java.net.URLDecoder.decode(part.substring(5), java.nio.charset.StandardCharsets.UTF_8);
                        }
                    }
                }
            }
        } catch (Exception ignored) {
        }
        return decoded;
    }

    private String stripHtmlEntities(String value) {
        if (value == null) return "";
        return value.replace("&amp;", "&")
                .replace("&quot;", "\"")
                .replace("&#x27;", "'")
                .replace("&#39;", "'")
                .replace("&lt;", "<")
                .replace("&gt;", ">")
                .replaceAll("<[^>]+>", "")
                .trim();
    }

    private String normalizeVietnamese(String input) {
        if (input == null) return "";
        String normalized = java.text.Normalizer.normalize(input, java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .replace("đ", "d")
                .replace("Đ", "D");
        return normalized
                .replaceAll("[àáạảãâầấậẩẫăằắặẳẵ]", "a")
                .replaceAll("[èéẹẻẽêềếệểễ]", "e")
                .replaceAll("[ìíịỉĩ]", "i")
                .replaceAll("[òóọỏõôồốộổỗơờớợởỡ]", "o")
                .replaceAll("[ùúụủũưừứựửữ]", "u")
                .replaceAll("[ỳýỵỷỹ]", "y")
                .replaceAll("[đ]", "d");
    }

    private EmergencyTriage classifyEmergencyTriage(String normalizedQuery) {
        String q = normalizedQuery == null ? "" : normalizedQuery.trim();
        if (q.isBlank()) return new EmergencyTriage(false, 0, "none", "empty");

        int score = 0;
        String category = "general";
        List<String> reasons = new ArrayList<>();

        if (containsAny(q, "cap cuu", "khan cap", "sos", "emergency", "cuu toi", "cuu voi", "giup voi", "chet mat", "sap chet")) {
            score += 5;
            reasons.add("explicit-distress");
        }
        if (containsAny(q, "khong tho", "ngung tho", "ngat tho", "kho tho", "tim tai", "luoi tim", "thoi thop")) {
            score += 6;
            category = "airway";
            reasons.add("airway-breathing");
        }
        if (containsAny(q, "hoc", "mac xuong", "di vat", "nghen", "nghet", "nuot phai")) {
            score += 5;
            category = "airway";
            reasons.add("choking-risk");
        }
        if (containsAny(q, "co giat", "dong kinh", "run giat", "mat y thuc", "bat tinh", "hon me", "lim di", "khong dung day")) {
            score += 5;
            category = "neuro";
            reasons.add("neuro-collapse");
        }
        if (containsAny(q, "soc nhiet", "say nang", "tho gap", "nong qua")) {
            score += 5;
            category = "heatstroke";
            reasons.add("heatstroke-risk");
        }
        if (containsAny(q, "ngo doc", "an ba", "thuoc chuot", "ba chuot", "socola", "chocolate", "thuoc tru sau", "hoa chat", "chat tay", "uong nham", "an nham", "nuot nham")) {
            score += 5;
            category = "poison";
            reasons.add("poison-risk");
        }
        if (containsAny(q, "chay mau", "mau chay", "mau nhieu", "ra mau", "di ngoai ra mau", "ia ra mau", "i a ra mau", "phan mau", "tai nan", "bi xe tong", "xe quet", "xe quet trung", "xe can", "dam xe", "va xe", "nga cao", "gay xuong", "vet thuong sau", "can nhau")) {
            score += 4;
            category = "trauma";
            reasons.add("trauma-bleeding");
        }
        if (containsAny(q, "meo", "cho", "cun", "boss", "thu cung", "be nha", "be no", "pet")) {
            score += 1;
            reasons.add("pet-context");
        }
        if (containsAny(q, "lam sao", "phai lam gi", "xu ly sao", "gio sao", "khong biet lam gi", "toi voi", "nhanh len")) {
            score += 2;
            reasons.add("urgent-help-seeking");
        }

        boolean emergency = score >= 5 || (score >= 4 && q.length() <= 80);
        return new EmergencyTriage(emergency, score, category, reasons.isEmpty() ? "none" : String.join(",", reasons));
    }

    private boolean containsAny(String value, String... terms) {
        for (String term : terms) {
            if (value.contains(term)) return true;
        }
        return false;
    }

    private String buildEmergencyReply(String normalizedQuery, EmergencyTriage triage) {
        StringBuilder reply = new StringBuilder();
        reply.append("[EMERGENCY] Sen bình tĩnh làm ngay các bước sơ cứu dưới đây và gọi Rexi theo hotline 0353.374.156.\n\n");

        if ("airway".equals(triage.category())) {
            reply.append("**Nghi hóc dị vật/ngạt thở:**\n")
                    .append("1. Mở miệng bé kiểm tra nhanh. Chỉ lấy dị vật ra nếu nhìn thấy rõ và gắp được an toàn.\n")
                    .append("2. Không móc tay sâu vì có thể đẩy dị vật vào trong.\n")
                    .append("3. Nếu bé không thở hoặc tím tái, thực hiện Heimlich cho thú cưng: đặt hai tay ngay sau xương sườn, ép nhanh hướng lên trên 3-5 lần, rồi kiểm tra miệng.\n")
                    .append("4. Nếu bé nhỏ, có thể nâng phần thân sau cao hơn đầu và vỗ chắc 3-5 cái giữa hai bả vai.\n\n");
        } else if ("poison".equals(triage.category())) {
            reply.append("**Nghi ngộ độc:**\n")
                    .append("1. Ngừng cho ăn/uống thêm và đưa bé tránh xa nguồn độc.\n")
                    .append("2. Không tự gây nôn nếu chưa có bác sĩ hướng dẫn.\n")
                    .append("3. Mang theo bao bì/chất nghi độc khi đến phòng khám.\n\n");
        } else if ("neuro".equals(triage.category())) {
            reply.append("**Co giật/ngất/lịm:**\n")
                    .append("1. Dọn vật cứng quanh bé, không giữ chặt miệng hoặc kéo lưỡi.\n")
                    .append("2. Ghi lại thời gian co giật và quay video ngắn nếu an toàn.\n")
                    .append("3. Nếu cơn kéo dài hơn 2-3 phút hoặc lặp lại, đưa bé đi cấp cứu ngay.\n\n");
        } else if ("heatstroke".equals(triage.category())) {
            reply.append("**Sốc nhiệt/Say nắng:**\n")
                    .append("1. Đưa bé vào nơi bóng râm, mát mẻ hoặc phòng có điều hòa ngay lập tức.\n")
                    .append("2. Dùng khăn ướt (nước mát, KHÔNG dùng nước đá) lau và đắp lên vùng bụng, nách, bẹn và đệm chân bé.\n")
                    .append("3. Cho bé uống một ít nước mát nếu bé còn tỉnh táo, rồi đưa đi cấp cứu.\n\n");
        } else if ("trauma".equals(triage.category())) {
            reply.append("**Chảy máu/tai nạn:**\n")
                    .append("1. Dùng gạc sạch ép trực tiếp lên điểm chảy máu 5-10 phút.\n")
                    .append("2. Hạn chế di chuyển bé nếu nghi gãy xương hoặc chấn thương nặng.\n")
                    .append("3. Không tự bôi thuốc dân gian lên vết thương.\n\n");
        } else {
            reply.append("**Chưa rõ tình huống nhưng có dấu hiệu khẩn cấp:**\n")
                    .append("1. Đặt bé ở nơi thoáng, yên tĩnh, tránh tụ tập hoặc lay mạnh.\n")
                    .append("2. Kiểm tra nhanh: bé còn thở không, nướu/lưỡi có tím tái không, có chảy máu hoặc co giật không.\n")
                    .append("3. Nhắn ngay triệu chứng chính: khó thở, hóc, ngộ độc, co giật, chảy máu, tai nạn hoặc lịm đi.\n\n");
        }

        reply.append("Sen cho Rexi biết vị trí hiện tại của Sen để Rexi hướng dẫn đường đến cơ sở thú y gần nhất. Nếu ở Gia Lâm/Hà Nội, đưa bé tới Phòng khám Thú y Rexi, Số 68, Ngõ 10, Đường Ngô Xuân Quảng, Trâu Quỳ, Gia Lâm, Hà Nội.");
        return reply.toString();
    }
}
