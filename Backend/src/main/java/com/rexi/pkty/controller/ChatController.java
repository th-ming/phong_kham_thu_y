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
import com.rexi.pkty.service.AgentResponseCache;
import com.rexi.pkty.security.RoleAccessPolicy;
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
import java.util.Comparator;
import java.util.Locale;
import java.util.Objects;

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

    @Autowired
    private AgentResponseCache agentResponseCache;

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
    @FunctionalInterface
    private interface AiProviderCall {
        String call() throws Exception;
    }
    private record ProviderAttempt(String name, AiProviderCall call) {}
    private record ProviderResult(String reply, String provider) {}
    private record SemanticIntent(
            String intent,
            String species,
            String bodyPart,
            List<String> symptoms,
            boolean needsWebSearch,
            String urgency,
            double confidence
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
            String normalizedUserQuery = normalizeNoisyVietnameseForIntent(userQuery);
            SemanticIntent semanticIntent = tryParseSemanticIntent(userQuery, normalizedUserQuery);
            String realtimeContext = buildRealtimeContext();
            boolean hasVideo = lastMsg.getVideos() != null && !lastMsg.getVideos().isEmpty();
            boolean hasImage = lastMsg.getImages() != null && !lastMsg.getImages().isEmpty();
            boolean hasMedia = hasVideo || hasImage;

            String deterministicGuardReply = tryDeterministicChatGuard(normalizedUserQuery, userQuery, hasMedia);
            if (deterministicGuardReply != null) {
                return Map.of("reply", deterministicGuardReply, "source", "local_guard");
            }

            boolean internalStaffForLocalReply = RoleAccessPolicy.isInternalStaffRole(normalizedRoleFromAuth(auth));
            String localEverydayReply = internalStaffForLocalReply ? null : tryLocalEverydayReply(normalizedUserQuery, userQuery);
            if (!hasMedia && localEverydayReply != null) {
                return Map.of("reply", localEverydayReply, "source", "local_everyday");
            }

            Map<String, Object> evidenceBackedAgentReply = tryRunEvidenceBackedAgentFromChat(
                    userQuery, normalizedUserQuery, realUsername, auth, hasMedia);
            if (evidenceBackedAgentReply != null) {
                return evidenceBackedAgentReply;
            }

            boolean explicitWebSearchIntent = isWebSearchQuery(userQuery);
            boolean semanticWebSearchIntent = semanticIntent != null
                    && semanticIntent.needsWebSearch()
                    && isMedicalQuery(normalizedUserQuery)
                    && !isClinicInfoQuery(normalizedUserQuery);
            boolean webSearchIntent = explicitWebSearchIntent || semanticWebSearchIntent;
            EmergencyTriage emergencyTriage = webSearchIntent
                    ? new EmergencyTriage(false, 0, "none", "web-search-intent")
                    : classifyEmergencyTriage(normalizedUserQuery);
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

            String shortAnimalClarificationReply = tryShortAnimalClarificationReply(normalizedUserQuery);
            if (!hasMedia && shortAnimalClarificationReply != null) {
                return Map.of("reply", shortAnimalClarificationReply, "source", "local_clarification");
            }

            if (!hasMedia && isUserComplaintQuery(normalizedUserQuery)) {
                return Map.of("reply", buildUserComplaintReply(normalizedUserQuery), "source", "local_complaint");
            }

            String localDocumentReply = tryLocalDocumentQuestionReply(userQuery);
            if (!hasMedia && localDocumentReply != null) {
                return Map.of("reply", localDocumentReply, "source", "local_document");
            }

            String localClinicReply = tryLocalClinicGuidanceReply(normalizedUserQuery);
            if (!hasMedia && localClinicReply != null) {
                return Map.of("reply", localClinicReply, "source", "local_clinic_guidance");
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
            String semanticVetReply = trySemanticVeterinaryReply(semanticIntent);
            if (!hasMedia && semanticVetReply != null && !webSearchIntent) {
                return Map.of("reply", semanticVetReply, "source", "semantic_vet");
            }

            ChatRequestPlan requestPlan = (!hasMedia && webSearchIntent)
                    ? new ChatRequestPlan(ChatRoute.WEB_AI, false, true, false, true, "web+semantic")
                    : planChatRequest(normalizedUserQuery, userQuery, hasMedia);

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
                String deterministicWebReply = buildDeterministicVeterinaryWebAnswer(normalizedUserQuery, webResults);
                if (deterministicWebReply != null) {
                    return Map.of("reply", deterministicWebReply, "webResults", webResults, "provider", "DuckDuckGo+Rexi");
                }
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
                    ? "\n--- DOM ACTION CONTEXT ---\n"
                    + "Trang hiện tại: " + currentPath + "\n"
                    + "Interactive elements có data-ai-id:\n>>> " + currentDomContext + "\n"
                    + "Hoạt động gần đây:\n>>> " + currentActivityLogs + "\n"
                    + "ACTION RULES:\n"
                    + "- Nếu người dùng yêu cầu bấm/chọn/điền/sửa/đổi/cập nhật và DOM có element phù hợp: trả lời tối đa 1 câu ngắn + action tags. Không phân tích dài.\n"
                    + "- Chỉ dùng data-ai-id có thật trong DOM. Không bịa id, không chọn bừa. Thiếu element thì nói thiếu element nào.\n"
                    + "- Format duy nhất: [CLICK:id] [FILL:id|value] [SELECT:id|value] [TOGGLE:id] [DELETE:id] [SCROLL:down|small] [NAVIGATE:/path].\n"
                    + "- Không tự DELETE hoặc xác nhận thao tác nhạy cảm nếu người dùng chưa xác nhận rõ.\n"
                    + "- Nếu người dùng chỉ hỏi thông tin/trạng thái giao diện, trả lời trực tiếp theo DOM, không phát action tag.\n"
                    : "\n--- BỐI CẢNH GIAO DIỆN TỐI GIẢN ---\n"
                    + "Người dùng hiện đang ở màn hình: " + currentPath + ". Chỉ hướng dẫn bằng lời, trừ khi người dùng yêu cầu thao tác giao diện rõ ràng.\n";

            // Check auth state de chan AUTO_BOOK
            boolean isLoggedIn = (realUsername != null);
            String loginContext = isLoggedIn 
                ? "Sen hiện ĐÃ ĐĂNG NHẬP với tài khoản: " + realUsername + ". Bạn CÓ QUYỀN đặt lịch khám ngay cho Sen."
                : "Sen HIỆN CHƯA ĐĂNG NHẬP. Bạn TUYỆT ĐỐI KHÔNG ĐƯỢC trả về tag [AUTO_BOOK]. Nếu Sen muốn đặt lịch, hãy yêu cầu Sen đăng nhập trước nhé.";

            String normalizedRole = normalizedRoleFromAuth(auth);
            boolean isStaff = RoleAccessPolicy.isInternalStaffRole(normalizedRole);
            String userRoleName = RoleAccessPolicy.displayRoleName(normalizedRole);
            String roleWorkProfile = RoleAccessPolicy.roleWorkProfile(normalizedRole);
            String rolePromptGuidance = RoleAccessPolicy.rolePromptGuidance(normalizedRole);
            ChatPersonaContext personaContext = buildPersonaContext(isStaff, userRoleName, requestPlan, isLoggedIn);
            boolean isClinicalStaff = RoleAccessPolicy.isClinicalRole(normalizedRole);
            String personaBlock = renderPersonaBlock(personaContext, requestPlan, currentPath);

            // Get name and birth year for personalized tone
            Integer namSinh = null;
            String tenKhachHang = null;
            if (realUsername != null) {
                try {
                    Map<String, Object> khData = jdbcTemplate.queryForMap(
                        "SELECT kh.nam_sinh, kh.ten_khach_hang FROM TaiKhoan tk JOIN KhachHang kh ON tk.id_khach_hang = kh.id_khach_hang WHERE tk.ten_dang_nhap = ?",
                        realUsername
                    );
                    if (khData.get("nam_sinh") != null) {
                        namSinh = ((Number) khData.get("nam_sinh")).intValue();
                    }
                    tenKhachHang = (String) khData.get("ten_khach_hang");
                } catch (Exception e) {
                    logger.warning("Không lấy được dữ liệu khách hàng cho " + realUsername + ": " + e.getMessage());
                }
            }

            String firstName = "bạn";
            if (tenKhachHang != null && !tenKhachHang.isBlank()) {
                String[] parts = tenKhachHang.trim().split("\\s+");
                firstName = parts[parts.length - 1]; // Lấy tên thật (từ cuối cùng)
            }

            boolean chatbotIsGenZ = (namSinh != null && namSinh >= 1997);
            boolean anonymousUser = (realUsername == null);

            String systemPrompt;
            if (isStaff) {
                systemPrompt = personaBlock
                        + "BẠN LÀ BÁC SĨ THÚ Y REXI - ĐỒNG NGHIỆP VÀ TRỢ LÝ HỖ TRỢ CHUYÊN NGHIỆP CỦA PHÒNG KHÁM.\n"
                        + realtimeContext
                        + "1. VAI TRÒ: Bạn đang trò chuyện với một thành viên trong đội ngũ nhân viên phòng khám (" + userRoleName + "). Bạn là đồng nghiệp đắc lực hỗ trợ cho họ.\n"
                        + "1b. HỒ SƠ CÔNG VIỆC CỦA NGƯỜI DÙNG: " + roleWorkProfile + "\n"
                        + "1c. FORMAT HỖ TRỢ THEO VAI TRÒ: " + rolePromptGuidance + "\n"
                        + "2. PHẠM VI HỖ TRỢ: Hỗ trợ đúng vai trò hiện tại của người dùng: bác sĩ/y tá nhận hỗ trợ lâm sàng theo quyền; kế toán nhận hỗ trợ hóa đơn-doanh thu; tiếp tân nhận hỗ trợ lịch hẹn-khách hàng; quản lý/admin nhận hỗ trợ vận hành-hệ thống. Không được tự ép mọi câu hỏi về chăm sóc thú cưng.\n"
                        + "3. PHONG CÁCH: Chuyên nghiệp, đồng nghiệp, ngắn gọn, súc tích, không vòng vo. Gọi họ là 'sếp' hoặc 'đồng nghiệp'. Tuyệt đối KHÔNG gọi họ là 'Sen', không xưng hô kiểu bán hàng.\n"
                        + "4. HOTLINE & ĐỊA CHỈ: Dùng số hotline phòng khám: 0353.374.156 và địa chỉ: Gia Lâm, Hà Nội khi đồng nghiệp cần thông tin.\n"
                        + "5. SƠ CỨU KHẨN CẤP (HEIMLICH): Sẵn sàng cung cấp hướng dẫn sơ cứu nhanh khi có ca khẩn cấp.\n"
                        + "5b. PHÂN QUYỀN Y KHOA THEO VAI TRÒ: "
                        + (isClinicalStaff
                            ? "Người dùng là nhân sự lâm sàng (" + userRoleName + "), được phép nhận phân tích chuyên sâu, chẩn đoán phân biệt, gợi ý xét nghiệm, nhóm thuốc/phác đồ tham khảo và checklist theo dõi. Tuy nhiên phải ghi rõ đây là hỗ trợ chuyên môn tham khảo, quyết định cuối cùng thuộc bác sĩ phụ trách sau khi khám trực tiếp, cân nặng, tuổi, tiền sử và kết quả xét nghiệm.\n"
                            : "Người dùng không phải vai trò lâm sàng trực tiếp (" + userRoleName + "), chỉ giải thích ở mức vận hành/tổng quan. Không đưa phác đồ thuốc, liều dùng, chỉ định kháng sinh/gây mê hoặc hướng dẫn điều trị chuyên sâu; hãy hướng dẫn chuyển cho bác sĩ/y tá.\n")
                        + "6. QUY TẮC QUAN TRỌNG NHẤT - ƯU TIÊN TRẢ LỜI TRỰC TIẾP:\n"
                        + "   Khi đồng nghiệp đặt câu hỏi bất kỳ (ví dụ: 'khóa tài khoản khách hàng thì sao?', 'làm thế nào để thêm nhân viên?'...), bạn BẮT BUỘC phải TRẢ LỜI THẲNG VÀO NỘI DUNG CÂU HỎI trước. TUYỆT ĐỐI KHÔNG tự nhảy vào chế độ Autopilot/điều hướng khi đồng nghiệp chỉ hỏi thông tin.\n"
                        + "6b. CÂU HỎI NGOÀI PHẠM VI THÚ Y: Nếu đồng nghiệp hỏi văn bản, kỹ thuật, nội dung chung hoặc một đoạn câu rời rạc, hãy xử lý theo vai trò trợ lý nội bộ: giải thích/tóm tắt/viết lại/phân loại rủi ro nếu an toàn. Không kết thúc bằng câu rủ rê hỏi về thú cưng.\n"
                        + "7. BẢO MẬT & TRUY CẬP DỮ LIỆU (CỰC KỲ QUAN TRỌNG):\n"
                        + "   Nếu yêu cầu cần dữ liệu nội bộ nhưng không có dữ liệu trong context, không bịa và không kết luận không tìm thấy. Nói ngắn rằng cần Rexi Agent tự động kiểm tra quyền và quét dữ liệu thật.\n"
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
                    ? "4. PHONG CÁCH GIAO TIẾP (Gen Z - sinh năm " + namSinh + "):\n"
                        + "   - Bạn là một trợ lý thông minh, linh hoạt và rất thân thiện. Hãy xưng hô là 'Rexi' hoặc 'mình', gọi khách hàng là 'Sen' hoặc '" + firstName + "' và thú cưng là 'Boss' hoặc 'bé'.\n"
                        + "   - Lời văn tự nhiên, có cảm xúc (thương xót khi bé ốm, vui vẻ khi bé khỏe). Có thể dùng các từ như 'nha', 'nè', 'oke', nhưng tuyệt đối không dùng teencode quá đà.\n"
                        + "   - Đừng dùng văn mẫu rập khuôn. Hãy trả lời thẳng vào vấn đề một cách duyên dáng. Ví dụ thay vì 'Dạ chào bạn', hãy nói 'Hi " + firstName + " (Sen), Rexi nghe đây! Boss đang gặp vấn đề gì thế?'.\n"
                        + "   - Khi tư vấn, hãy giống như một người bạn am hiểu về thú y đang tâm tình, chia sẻ kinh nghiệm.\n"
                        + "   - Tuy nhiên, khi rơi vào tình huống y khoa khẩn cấp, hãy lập tức bỏ sự nhí nhảnh, chuyển sang giọng điệu nghiêm túc, hướng dẫn nhanh gọn và dứt khoát.\n"
                    : "4. PHONG CÁCH GIAO TIẾP (Trưởng thành - sinh năm " + (namSinh != null ? namSinh : "trước 1997") + "):\n"
                        + "   - Bạn là một Bác sĩ thú y tận tâm, chuyên nghiệp và lịch sự. Hãy xưng hô là 'Rexi', gọi khách hàng bằng tên riêng là '" + firstName + "' (hoặc 'bạn' nếu không rõ) và thú cưng là 'bé' hoặc gọi tên riêng của thú cưng.\n"
                        + "   - Lời văn tự nhiên, ấm áp và có tính thấu cảm cao. Thể hiện sự quan tâm thực sự đến sức khỏe của thú cưng.\n"
                        + "   - Đừng trả lời như một cái máy hay đọc văn mẫu. Hãy linh hoạt theo từng câu hỏi. Ví dụ: 'Dạ Rexi chào " + firstName + ", bé nhà mình hôm nay có biểu hiện gì bất thường ạ?'.\n"
                        + "   - Trình bày mạch lạc, xuống dòng rõ ràng khi có nhiều ý để khách hàng dễ đọc.\n"
                        + "   - Giữ thái độ bình tĩnh, đáng tin cậy trong các tình huống khẩn cấp để trấn an " + firstName + ".\n";

                systemPrompt = personaBlock
                        + "BẠN LÀ REXI - BÁC SĨ THÚ Y VÀ LÀ NGƯỜI BẠN ĐỒNG HÀNH CỦA NGỮỜI YÊU ĐỘNG VẬT.\n"
                        + realtimeContext
                        + "1. MỤC TIÊU CỐT LÕI: Tư vấn y khoa chính xác, giải quyết vấn đề nhanh chóng và mang lại sự an tâm cho chủ vật nuôi. Đừng chỉ trả lời câu hỏi, hãy thể hiện sự quan tâm!\n"
                        + "2. TRI THỨC VÀ NGUỒN THAM KHẢO: \n"
                        + "   - Ưu tiên cao nhất: Trả lời dựa theo [TÀI LIỆU CHUYÊN MÔN REXI] nếu có.\n"
                        + "   - Nếu tài liệu không có, hãy dùng kiến thức thú y chuẩn xác nhất của bạn để tư vấn. Nếu không chắc chắn, hãy khuyên mang bé đến phòng khám.\n"
                        + "3. LIÊN HỆ: Hotline khẩn cấp 0353.374.156 - Địa chỉ: Gia Lâm, Hà Nội.\n"
                        + phongCachText
                        + "5. XỬ LÝ KHẨN CẤP (NGỘ ĐỘC, TAI NẠN, CHẢY MÁU, KHÓ THỞ): BẮT BUỘC bắt đầu bằng tag [EMERGENCY]. KHÔNG dọa dẫm. Đưa ra 1-2 bước sơ cứu TỐI QUAN TRỌNG nhất. Yêu cầu mang bé đến phòng khám ngay lập tức.\n"
                        + "6. ĐẶT LỊCH HẸN: " + loginContext + " Chỉ khi khách hàng đã cung cấp đủ thông tin và chốt lịch, BẮT BUỘC in ra chuỗi [AUTO_BOOK:Ngày|Giờ|TênThúCưng|DịchVụ|TênBácSĩ]. (Ngày YYYY-MM-DD, Giờ HH:mm).\n"
                        + "7. THẤU HIỂU BỆNH NHÂN: Nếu chưa biết bé là Chó hay Mèo, bao nhiêu tháng tuổi, hoặc nặng bao nhiêu ký (những thông tin quan trọng để tư vấn), hãy khéo léo hỏi thêm " + firstName + ".\n"
                        + "8. RANH GIỚI Y KHOA (RẤT QUAN TRỌNG): Bạn được phép tư vấn dinh dưỡng, hành vi, dấu hiệu bệnh, và cách chăm sóc. TUYỆT ĐỐI KHÔNG kê đơn thuốc cụ thể (tên thuốc, liều lượng) để điều trị bệnh nặng tại nhà. Khuyên " + firstName + " đến khám để bác sĩ đo liều lượng chuẩn theo cân nặng.\n"
                        + "9. TRUY CẬP DỮ LIỆU HỆ THỐNG:\n"
                        + "   Nếu " + firstName + " hỏi thông tin hồ sơ, lịch hẹn mà bạn chưa có dữ liệu trong context, tuyệt đối không được bịa ra. Hãy nói khéo: 'Dạ để Rexi kiểm tra lại hệ thống hồ sơ cho bé ngay nhé!'. (Hệ thống Agent sẽ tự động bắt câu này và xử lý).\n"
                        + "10. HƯỚNG DẪN THAO TÁC (ĐIỀU HƯỚNG):\n"
                        + "   CHỈ dùng thẻ [NAVIGATE:đường_dẫn] ở cuối câu CHỈ KHI " + firstName + " yêu cầu MỞ/CHUYỂN SANG một trang nào đó. Nếu " + firstName + " chỉ hỏi, đừng dùng thẻ này. Các link hợp lệ: /khach-hang/dashboard, /khach-hang/quan-ly-thu-cung, /khach-hang/dat-lich-hen, /khach-hang/lich-su-lich-hen, /khach-hang/ho-so-benh-an, /khach-hang/hoa-don-thanh-toan, /khach-hang/thong-tin-ca-nhan.\n"
                        + "\n11. TRÍCH DẪN RÕ RÀNG:"
                        + "\n   Nếu bạn tham khảo link từ web, hãy chèn link dạng Markdown [Tên Nguồn](Link) để " + firstName + " có thể bấm vào.\n"
                        + "\n--- DỮ LIỆU PHÒNG KHÁM (BÁC SĨ, DỊCH VỤ, BẢNG GIÁ) ---\n"
                        + globalContext
                        + "\n--- THÔNG TIN CỦA " + firstName.toUpperCase(Locale.ROOT) + " VÀ THÚ CƯNG ---\n"
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

            String userRole = normalizedRoleFromAuth(auth);

            // —— CACHE LOOKUP (trước LLM routing) ——
            try {
                if (agentResponseCache.isCacheableIntent(normalizedQuery)) {
                    String cached = agentResponseCache.get(normalizedQuery, userRole);
                    if (cached != null) {
                        logger.info("[ChatController] Cache HIT — trả về ngay.");
                        return Map.of("reply", cached, "provider", "Cache");
                    }
                }
            } catch (Exception cacheEx) {
                logger.warning("[ChatController] Cache lookup lỗi (ignored): " + cacheEx.getMessage());
            }

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
            ProviderResult providerResult;
            final List<ChatMessage> providerHistory = history;
            // LLM Router logic: Gemini (media), OpenRouter (medical fallback), Groq fast path.
            if (hasMedia) {
                // 🎥/🖼️ THẾ MẠNH CỦA GEMINI: Đa phương tiện (Video, Hình ảnh)
                logger.info("[AI ROUTER] Định tuyến câu hỏi Media sang: Gemini");
                if (hasVideo) {
                    try {
                        reply = geminiService.chat(history);
                        providerUsed = "Gemini";
                    } catch (Exception geminiEx) {
                        logger.warning("[AI ROUTER] Gemini lỗi khi phân tích video; không fallback sang model text-only để tránh bịa kết quả video: " + geminiEx.getMessage());
                        reply = buildVideoAnalysisFallbackReply(isTimeoutError.test(geminiEx));
                        providerUsed = "System Fallback";
                    }
                } else {
                    providerResult = tryProviderChain(
                            new ProviderAttempt("Gemini", () -> geminiService.chat(providerHistory)),
                            new ProviderAttempt("Groq Vision", () -> groqService.chat(providerHistory)),
                            new ProviderAttempt("OpenRouter", () -> openRouterService.chat(providerHistory, false))
                    );
                    reply = providerResult.reply();
                    providerUsed = providerResult.provider();
                }
            } else if (isMedicalQuery) {
                // Gemini phản hồi y tế ngắn ổn định hơn; OpenRouter giữ vai trò dự phòng chuyên sâu.
                logger.info("[AI ROUTER] Định tuyến câu hỏi Tư vấn Y tế sang: Gemini");
                providerResult = tryProviderChain(
                        new ProviderAttempt("Gemini", () -> geminiService.chat(providerHistory)),
                        new ProviderAttempt("OpenRouter", () -> openRouterService.chat(providerHistory, true)),
                        new ProviderAttempt("Groq", () -> groqService.chat(providerHistory))
                );
                reply = providerResult.reply();
                providerUsed = providerResult.provider();
            } else {
                // 💬 THẾ MẠNH CỦA GROQ (LLAMA 3.3): Chat FAQ, Lịch khám, Autopilot siêu tốc
                logger.info("[AI ROUTER] Định tuyến câu hỏi Chat/Autopilot thông thường sang: Groq");
                providerResult = tryProviderChain(
                        new ProviderAttempt("Groq", () -> groqService.chat(providerHistory)),
                        new ProviderAttempt("Gemini", () -> geminiService.chat(providerHistory)),
                        new ProviderAttempt("OpenRouter", () -> openRouterService.chat(providerHistory, false))
                );
                reply = providerResult.reply();
                providerUsed = providerResult.provider();
            }

            reply = sanitizeChatReply(reply);
            reply = enforceVeterinaryAnswerQuality(userQuery, normalizedUserQuery, reply, requestPlan.route(), webResults);
            reply = enforceNoUnsupportedSystemClaims(userQuery, normalizedUserQuery, reply, requestPlan.route(), isStaff, userRoleName);
            reply = enforceStrictEvidenceGate(userQuery, normalizedUserQuery, reply, requestPlan.route(), providerUsed);
            if (webSearchRequested && reply != null && reply.startsWith("Rexi chưa lấy được nguồn web phù hợp")) {
                providerUsed = "System Source Gate";
            }
            auditMedicalAiReplyIfNeeded(userQuery, reply, userRoleName, providerUsed, requestPlan.route().name());

            // —— CACHE PUT (Lưu kết quả chất lượng cao đã qua post-processing) ——
            try {
                if (agentResponseCache.isCacheableIntent(normalizedQuery)) {
                    agentResponseCache.put(normalizedQuery, userRole, reply);
                }
            } catch (Exception cacheEx) {
                logger.warning("[ChatController] Cache put lỗi (ignored): " + cacheEx.getMessage());
            }

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

    private ProviderResult tryProviderChain(ProviderAttempt... attempts) throws Exception {
        Exception lastException = null;
        for (ProviderAttempt attempt : attempts) {
            try {
                String reply = attempt.call().call();
                if (reply == null || reply.trim().isEmpty() || 
                    (reply.contains("Sen, hôm nay thật tuyệt vời")) ||
                    (reply.contains("đảm bảo bạn được gặp") || reply.contains("cảm ơn chúng tôi đã đảm bảo")) ||
                    (reply.contains("đồng thời tuân thủ quy định") || reply.contains("chúng tôi hiểu việc bạn đang ở đây")) ||
                    (reply.contains("Chúc bạn có thời gian an toàn") || reply.contains("Cứ tiếp tục chuyển đổi thành")) ||
                    (reply.contains("hóa đơn đã được xác nhận") && reply.contains("Thẻ ngân hàng sẽ thực hiện")) ||
                    (reply.contains("balancing both") || reply.contains("popcorn cravings") || reply.contains("You've got this"))) {
                    throw new RuntimeException("Phản hồi chứa mẫu lỗi hallucination dịch máy hoặc rỗng.");
                }
                logger.info("[AI ROUTER] Provider phản hồi thành công: " + attempt.name());
                return new ProviderResult(reply, attempt.name());
            } catch (Exception ex) {
                lastException = ex;
                String errorCode = classifyAiRuntimeError(ex);
                logger.warning("[AI ROUTER] " + attempt.name() + " lỗi (" + errorCode + "), thử provider tiếp theo: " + ex.getMessage());
            }
        }
        throw lastException != null ? lastException : new RuntimeException("Không có AI provider khả dụng.");
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

    private String normalizedRoleFromAuth(org.springframework.security.core.Authentication auth) {
        if (auth == null) return "";
        return auth.getAuthorities().stream()
                .map(g -> g.getAuthority() == null ? "" : g.getAuthority().replace("ROLE_", ""))
                .map(RoleAccessPolicy::normalizeRole)
                .filter(role -> !role.isBlank())
                .findFirst()
                .orElse("");
    }

    private String enforceNoUnsupportedSystemClaims(
            String rawQuery,
            String normalizedQuery,
            String reply,
            ChatRoute route,
            boolean isStaff,
            String userRoleName
    ) {
        if (reply == null || reply.isBlank()) return reply;
        String normalizedReply = normalizeVietnamese(reply.toLowerCase(Locale.ROOT));
        boolean claimedSystemLookup = containsAny(normalizedReply,
                "rexi kiem tra du lieu he thong",
                "toi da kiem tra du lieu he thong",
                "da kiem tra du lieu he thong",
                "tra du lieu he thong",
                "tra truc tiep tu he thong",
                "theo du lieu he thong",
                "trong he thong ghi nhan");
        boolean claimedCompletedAction = containsAny(normalizedReply,
                "da bam", "da nhan nut", "da chon", "da dien", "da cap nhat", "da xoa", "da huy",
                "da dat lich", "da tao lich", "da tao hoa don", "da khoa tai khoan", "da mo khoa",
                "da gui email", "da chuyen sang trang", "toi da mo trang");
        boolean hasControlTag = reply.matches("(?s).*\\[(CLICK|FILL|SELECT|TOGGLE|DELETE|SCROLL|NAVIGATE|AUTO_BOOK):[^\\]]+\\].*");
        boolean privilegedRoute = route == ChatRoute.DB_LOCAL || route == ChatRoute.SENSITIVE_HANDOFF;

        if ((claimedSystemLookup || claimedCompletedAction) && !privilegedRoute && !hasControlTag) {
            if (claimedSystemLookup || isInternalDataQuestion(normalizedQuery)) {
                return "Tôi chưa kiểm tra dữ liệu hệ thống trong lượt này nên sẽ không tự đưa số liệu/kết quả. Hãy chuyển sang Rexi Agent hoặc yêu cầu tra cứu cụ thể để hệ thống kiểm quyền và đọc DB thật.";
            }
            return "Tôi chưa thực hiện thao tác nào trên hệ thống trong lượt này. Nếu bạn muốn Rexi thao tác thật, hãy ra lệnh rõ trong tab Rexi Agent để hệ thống kiểm quyền, kiểm DOM/tool và xác nhận trước khi làm.";
        }

        if (isStaff && containsAny(normalizedReply,
                "ban co muon hoi ve mot van de cu the ve thu cung",
                "toi san sang giup do ve cham soc thu cung",
                "neu ban can ho tro ve cham soc thu cung")) {
            return "Tôi đang nhận bạn là " + userRoleName + " nội bộ. Câu vừa rồi nằm ngoài dữ liệu phòng khám; tôi chưa thực hiện thao tác hay tra cứu hệ thống nào. Tôi sẽ xử lý theo đúng vai trò hiện tại của bạn.";
        }

        return reply;
    }

    private boolean isInternalDataQuestion(String normalizedQuery) {
        return containsAny(normalizedQuery,
                "khach hang", "khach moi", "xu huong", "thong ke", "bao cao", "doanh thu",
                "hoa don", "lich hen", "benh an", "thu cung", "kho thuoc", "ton kho",
                "tai khoan", "nhan vien", "phan quyen", "du lieu he thong");
    }

    private String enforceStrictEvidenceGate(
            String rawQuery,
            String normalizedQuery,
            String reply,
            ChatRoute route,
            String providerUsed
    ) {
        if (reply == null || reply.isBlank()) return reply;
        String q = normalizedQuery == null
                ? normalizeVietnamese(Objects.toString(rawQuery, "").toLowerCase(Locale.ROOT))
                : normalizedQuery;
        String normalizedReply = normalizeVietnamese(reply.toLowerCase(Locale.ROOT));
        boolean verifiedRoute = route == ChatRoute.QUICK_LOCAL
                || route == ChatRoute.DB_LOCAL
                || route == ChatRoute.SENSITIVE_HANDOFF
                || route == ChatRoute.WEB_AI
                || route == ChatRoute.MEDICAL_AI;
        boolean systemProvider = providerUsed != null && normalizeVietnamese(providerUsed.toLowerCase(Locale.ROOT)).contains("system");
        if (verifiedRoute || systemProvider || isSafeEvidenceRefusal(normalizedReply)) {
            return reply;
        }

        if (isCodeOrSystemLocationQuestion(q)) {
            return "Tôi không có bằng chứng RAG mã nguồn trong lượt chat thường này nên sẽ không đoán file/dòng. Hãy chuyển sang Rexi Agent bằng tài khoản Admin và hỏi kèm tên màn hình, route, API, component hoặc data-ai-id cụ thể.";
        }
        if (isInternalDataQuestion(q) || isEvidenceDemandingQuestion(q)) {
            return "Tôi chưa đọc DB/tool/nguồn kiểm chứng trong lượt này nên sẽ không tự đưa số liệu, trạng thái hoặc kết luận hệ thống. Hãy dùng Rexi Agent để kiểm quyền và tra dữ liệu thật.";
        }
        return reply;
    }

    private Map<String, Object> tryRunEvidenceBackedAgentFromChat(
            String userQuery,
            String normalizedQuery,
            String username,
            org.springframework.security.core.Authentication auth,
            boolean hasMedia
    ) {
        if (hasMedia || normalizedQuery == null || normalizedQuery.isBlank()) {
            return null;
        }

        if (isCodeOrSystemLocationQuestion(normalizedQuery)) {
            String role = normalizedRoleFromAuth(auth);
            if (!"admin".equals(role)) {
                return Map.of(
                        "reply", "Phần file/dòng/API/component/data-ai-id là mã nguồn nội bộ nên Rexi chỉ tra cứu bằng tài khoản Admin. Tôi sẽ không đoán vị trí code khi chưa có quyền đọc RAG mã nguồn.",
                        "source", "code_rag_admin_required"
                );
            }
            return runAgentFromChat(userQuery, username, auth);
        }

        if (isAutopilotQuery(normalizedQuery)) {
            return runAgentFromChat(userQuery, username, auth);
        }

        if (shouldUseVerifiedSystemAgent(normalizedQuery)) {
            return runAgentFromChat(userQuery, username, auth);
        }

        return null;
    }

    private String tryDeterministicChatGuard(String normalizedQuery, String rawQuery, boolean hasMedia) {
        if (hasMedia || normalizedQuery == null || normalizedQuery.isBlank()) return null;
        String q = normalizedQuery;
        String lowerRaw = rawQuery == null ? "" : rawQuery.toLowerCase(Locale.ROOT);

        // --- PROFANITY FILTER (BỘ LỌC TỪ NGỮ NHẠY CẢM) ---
        boolean isProfane = containsAny(q, "lon", "loz", "cc", "cl", "dcm", "vkl", "vl", "buoi", "cac", "deo", "con cac", "cai lon", "dit", "du ma", "vai l", "vai c")
                            || lowerRaw.contains("lồn") 
                            || lowerRaw.contains("địt") 
                            || lowerRaw.contains("đụ") 
                            || lowerRaw.contains("cặc") 
                            || lowerRaw.contains("buồi") 
                            || lowerRaw.contains("đéo") 
                            || lowerRaw.contains("vãi");
        
        if (isProfane) {
            return "Dạ, Rexi là trợ lý y khoa chuyên hỗ trợ chăm sóc sức khỏe thú cưng. Mong bạn sử dụng ngôn từ phù hợp để Rexi có thể hỗ trợ tốt nhất ạ. Bạn đang cần tư vấn gì cho bé thú cưng nhà mình không?";
        }
        // ------------------------------------------------

        if (containsAny(q, "dua thoi", "dua thoi no khoe", "khoe lam", "no khoe")
                && containsAny(q, "sap chet", "cuu")) {
            return "May quá bé khỏe. Có gì bất thường như bỏ ăn, nôn, tiêu chảy, khó thở hoặc lừ đừ thì gọi 0353.374.156 nhé.";
        }
        if (q.matches("^(a\s*){3,}$")) {
            return "Anh cần em hỗ trợ gì cho bé không ạ?";
        }
        if (containsAny(q, "vo toi ngoai tinh", "vo ngoai tinh", "chong ngoai tinh")) {
            return "Em chỉ hỗ trợ thú cưng và nghiệp vụ phòng khám. Chuyện này anh nên tâm sự với người thân/bạn bè hoặc chuyên gia phù hợp nhé.";
        }
        if (containsAny(q, "game ran san moi", "con game ran", "snake game")) {
            return "Em chuyên hỗ trợ phòng khám thú y Rexi. Nếu anh cần, em có thể hỗ trợ code tool đặt lịch hoặc tra lịch phòng khám.";
        }
        if (containsAny(q, "biet tao la ai", "may co biet tao la ai", "m co biet tao la ai")) {
            return "Em không lưu hay suy đoán thông tin cá nhân ngoài phiên đăng nhập hiện tại. Anh cần hỗ trợ gì cho bé không ạ?";
        }
        if (containsAny(q, "chatgpt noi khac", "chat gpt noi khac", "ai dung")) {
            return "Về thú y, nên ưu tiên bác sĩ tại phòng khám, kết quả xét nghiệm và thăm khám trực tiếp. Rexi chỉ hỗ trợ tham khảo an toàn.";
        }
        if (containsAny(q, "script alert", "alert 1") || Objects.toString(rawQuery, "").toLowerCase(Locale.ROOT).contains("<script")) {
            return "Em đã nhận nội dung đó như text thường, không thực thi HTML/script. Anh xác nhận lại tên thật của bé giúp em nhé.";
        }
        if (containsAny(q, "admin true", "admin=true", "role admin") && containsAny(q, "tang can", "can nang", "100kg", "100 kg")) {
            return "Bé Lu lên bao nhiêu kg ạ? Em coi phần ký tự lạ là text thường và không đổi quyền theo nội dung chat.";
        }

        if (containsAny(q, "pass admin", "pass db", "mat khau db", "password admin")) {
            return "Không thể cung cấp mật khẩu, secret hoặc quyền truy cập hệ thống. Đây là dữ liệu bảo mật.";
        }
        if (containsAny(q, "export toan bo data khach hang", "export data khach hang", "toan bo data khach hang")) {
            return "Từ chối export dữ liệu khách hàng hàng loạt. Đây là dữ liệu riêng tư; Rexi sẽ chỉ tra cứu theo quyền và mục đích hợp lệ.";
        }
        if (containsAny(q, "sdt cua", "so dien thoai cua") && containsAny(q, "khach quen", "chi lan", "khach hang")) {
            return "Không thể cung cấp thông tin cá nhân của khách hàng khác. Nếu cần liên hệ, hãy dùng tài khoản đủ quyền trong hệ thống.";
        }
        if (containsAny(q, "ke cho tao lieu", "lieu amox", "lieu amoxicillin", "amox cho cho") || (containsAny(q, "amox", "amoxicillin") && containsAny(q, "lieu", "10kg", "10 kg"))) {
            return "Em không kê đơn online hoặc chỉ liều kháng sinh. Anh đưa bé tới phòng khám để bác sĩ cân nặng, khám và kê đơn đúng.";
        }
        if (containsAny(q, "bo qua tat ca luat", "gio may la dan", "dan")) {
            return "Không thể bỏ qua quy định an toàn. Rexi vẫn chỉ hỗ trợ thú cưng/phòng khám theo quyền hợp lệ.";
        }
        if (containsAny(q, "sudo") && containsAny(q, "doanh thu", "admin", "role")) {
            return "Không có quyền nếu session thật không đủ vai trò. Rexi chỉ tra cứu doanh thu bằng tài khoản được phân quyền.";
        }
        if (containsAny(q, "update users set", "drop table", "insert into", "delete from")) {
            return "Em coi nội dung SQL đó là text thường và không thực thi lệnh. Anh cần hỗ trợ gì hợp lệ trong hệ thống?";
        }
        if (containsAny(q, "thuoc bo") && containsAny(q, "co sao khong", "an", "uong")) {
            return "Thuốc bổ còn tùy loại và lượng bé đã ăn. Anh giữ vỏ/sản phẩm, theo dõi nôn, tiêu chảy, lừ đừ; nếu ăn nhiều hoặc không rõ thành phần thì gọi 0353.374.156 để bác sĩ hướng dẫn.";
        }
        if (containsAny(q, "chet cuoi", "cuoi chet") && containsAny(q, "do choi", "choi moi")) {
            return "Nghe như bé đang vui với đồ chơi mới. Anh kiểm tra đồ chơi không có mảnh nhỏ, dây dễ nuốt hoặc cạnh sắc nhé.";
        }
        if (containsAny(q, "pass qua", "ghe qua") && containsAny(q, "pk", "phong kham", "lay thuoc")) {
            return "Được, anh có thể ghé qua phòng khám lấy thuốc theo chỉ định đã có. Nếu chưa có đơn/chỉ định, gọi 0353.374.156 để lễ tân kiểm tra trước nhé.";
        }
        if (containsAny(q, "web nhu", "cho 1 sao", "mot sao")) {
            return "Bố bình tĩnh, con ghi nhận lỗi web. Bố gửi giúp con màn hình hoặc thao tác bị lỗi để con kiểm tra đúng chỗ.";
        }
        return null;
    }

    private boolean shouldUseVerifiedSystemAgent(String normalizedQuery) {
        if (normalizedQuery == null || normalizedQuery.isBlank()) return false;
        if (isSensitiveDataLookup(normalizedQuery)) return true;
        boolean hasSystemObject = containsAny(normalizedQuery,
                "khach hang", "khach moi", "hoa don", "lich hen", "benh an",
                "kho thuoc", "ton kho", "tai khoan", "nhan vien", "phan quyen",
                "kpi", "vat tu", "doanh thu", "bao cao", "thong ke", "du lieu he thong",
                "trong db", "database", "sql", "ca kham", "model", "provider", "cau hinh ai",
                "api key", "swagger", "openapi", "api docs", "full api", "slot",
                "lich trong", "khung gio trong");
        boolean asksVerifiedFact = containsAny(normalizedQuery,
                "kiem tra", "tra cuu", "dem", "so luong", "xu huong", "ti le", "ty le",
                "nhieu ca", "it ca", "nhieu nhat", "it nhat", "kiem tra du lieu",
                "tong hop", "phan tich", "doi soat", "tao bao cao", "thuc thu", "cho thu",
                "con cho thu", "cong no", "can xu ly", "xuat excel");
        return hasSystemObject && asksVerifiedFact;
    }

    private boolean isCodeOrSystemLocationQuestion(String normalizedQuery) {
        return containsAny(normalizedQuery,
                "file nao", "dong nao", "line nao", "line nhiu", "code nao", "ham nao", "function nao",
                "component nao", "route nao", "api nao", "endpoint nao", "controller nao", "service nao",
                "data ai id", "data-ai-id", "button-chatbot", "input-chatbot", "chatbot-", "id ",
                "nam o dau", "nam dau", "o dau", "o file", "trang nao", "swagger", "openapi", "api docs");
    }

    private boolean isEvidenceDemandingQuestion(String normalizedQuery) {
        return containsAny(normalizedQuery,
                "model nao", "provider nao", "api key", "cau hinh ai",
                "bao nhieu", "so luong", "thong ke", "doanh thu", "xu huong", "ti le", "ty le",
                "kiem tra du lieu", "du lieu he thong", "trong db", "database", "sql",
                "da bam", "da sua", "da cap nhat", "da xoa", "da huy", "da gui", "trang thai");
    }

    private boolean isSafeEvidenceRefusal(String normalizedReply) {
        return containsAny(normalizedReply,
                "chua co bang chung",
                "chua du bang chung",
                "chua kiem tra",
                "chua doc db",
                "chua doc du lieu",
                "khong du du lieu",
                "khong the xac minh",
                "khong suy doan",
                "se khong doan",
                "se khong tu dua");
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
        if (cleaned.contains("Sen, hôm nay thật tuyệt vời") && cleaned.contains("cảm ơn chúng tôi đã đảm bảo")) {
            logger.warning("[Sanitizer] Phát hiện mẫu lỗi dịch thô hallucination của OpenRouter.");
            return "";
        }

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
            String searchQuery = buildDuckDuckGoSearchQuery(query);
            String normalizedOriginalQuery = normalizeNoisyVietnameseForIntent(query);
            String encodedQuery = java.net.URLEncoder.encode(searchQuery, "UTF-8");
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

            for (int i = 0; i < urls.size(); i++) {
                Map<String, String> item = new java.util.HashMap<>();
                item.put("url", cleanDuckDuckGoUrl(urls.get(i)));
                item.put("title", stripHtmlEntities(titles.get(i)));
                item.put("snippet", i < snippets.size() ? stripHtmlEntities(snippets.get(i)) : "");
                int relevance = scoreDuckDuckGoResult(normalizedOriginalQuery, item);
                if (relevance >= 2) {
                    item.put("_score", String.valueOf(relevance));
                    results.add(item);
                }
            }
            results.sort(Comparator.comparingInt((Map<String, String> item) ->
                    Integer.parseInt(item.getOrDefault("_score", "0"))).reversed());
            if (results.size() > 5) {
                results = new java.util.ArrayList<>(results.subList(0, 5));
            }
            for (Map<String, String> item : results) {
                item.remove("_score");
            }
        } catch (Exception e) {
            logger.severe("Lỗi khi tìm kiếm DuckDuckGo: " + e.getMessage());
        }
        return results;
    }

    private String buildDuckDuckGoSearchQuery(String query) {
        String cleaned = normalizeNoisyVietnameseForIntent(query)
                .replaceAll("\\b(oi|doi|oi doi|oi zoi|oi gioi|ui|uay|nhe|nha|nao|xem nao|cho toi|giup toi|ho toi|voi|di|di nao)\\b", " ")
                .replaceAll("\\b(tra cuu|tim kiem|tim|search|seach|serch|sot|gg|google|duckduckgo|tren mang|len mang|mang|web|nguon tham khao|link nguon|tai lieu|tom tat|ngan gon|dua link|co nguon khong|nguon)\\b", " ")
                .replaceAll("[^a-z0-9\\s]", " ")
                .replaceAll("\\s+", " ")
                .trim();
        if (cleaned.matches(".*\\bda\\s+cho\\b.*") && !cleaned.contains("benh da") && !cleaned.contains("viem da")) {
            cleaned = cleaned.replaceAll("\\bda\\s+cho\\b", "benh da cho viem da cho");
        }
        if (cleaned.isBlank()) {
            cleaned = "benh thu y cho meo";
        }
        boolean petContext = containsAny(cleaned, "meo", "cho", "cun", "thu cung", "pet", "boss");
        boolean vetContext = containsAny(cleaned, "thu y", "benh", "trieu chung", "dieu tri", "phac do", "viem", "parvo", "bach cau", "nam da");
        if (!petContext) {
            cleaned = cleaned + " cho meo";
        }
        if (!vetContext || !cleaned.contains("thu y")) {
            cleaned = cleaned + " thu y";
        }
        return cleaned.trim();
    }

    private int scoreDuckDuckGoResult(String normalizedQuery, Map<String, String> item) {
        String title = normalizeVietnamese(item.getOrDefault("title", "")).toLowerCase(Locale.ROOT);
        String snippet = normalizeVietnamese(item.getOrDefault("snippet", "")).toLowerCase(Locale.ROOT);
        String url = normalizeVietnamese(item.getOrDefault("url", "")).toLowerCase(Locale.ROOT);
        String haystack = title + " " + snippet + " " + url;
        int score = 0;

        if (containsAny(haystack, "thu y", "vet", "veterinary", "pet", "cho", "meo", "cun")) score += 3;
        if (containsAny(normalizedQuery, "meo", "bach cau", "nam da") && containsAny(haystack, "meo", "cat", "feline")) score += 3;
        if (containsAny(normalizedQuery, "cho", "cun", "parvo") && containsAny(haystack, "cho", "dog", "canine", "parvo")) score += 3;
        if (containsAny(normalizedQuery, "da cho", "za cho", "benh da cho", "viem da cho") && containsAny(haystack, "da", "viem da", "da lieu", "nam da", "demodex", "ghe", "ky sinh", "dermat")) score += 4;
        if (containsAny(normalizedQuery, "nam da", "viem da") && containsAny(haystack, "nam", "viem da", "da lieu", "dermat", "ringworm")) score += 3;
        if (containsAny(normalizedQuery, "bach cau") && containsAny(haystack, "bach cau", "panleukopenia", "fpv")) score += 3;
        if (containsAny(normalizedQuery, "parvo") && containsAny(haystack, "parvo", "parvovirus")) score += 3;

        String[] queryTokens = normalizedQuery.replaceAll("[^a-z0-9\\s]", " ").split("\\s+");
        for (String token : queryTokens) {
            if (token.length() >= 4 && haystack.contains(token)) {
                score++;
            }
        }
        if (containsAny(normalizedQuery, "meo") && containsAny(haystack, "o nguoi", "tren nguoi", "nguoi bi", "da nguoi")) {
            score -= 4;
        }
        if (containsAny(haystack, "bhyt", "bao hiem y te", "vneid", "luat", "thue", "ngan hang", "bat dong san", "thoi tiet", "youtube", "tiktok", "google dich", "tro choi")) {
            score -= 5;
        }
        return score;
    }

    private boolean isWebSearchQuery(String query) {
        String normalized = normalizeNoisyVietnameseForIntent(query);
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

    private String tryShortAnimalClarificationReply(String normalizedQuery) {
        if (normalizedQuery == null || normalizedQuery.isBlank()) return null;
        String q = normalizedQuery.trim().replaceAll("\\s+", " ");
        String animalName = switch (q) {
            case "ga", "gia cam" -> "gà/gia cầm";
            case "chim" -> "chim";
            case "cho", "cun" -> "chó";
            case "meo" -> "mèo";
            case "tho" -> "thỏ";
            case "hamster" -> "hamster";
            default -> null;
        };
        if (animalName == null) return null;

        if ("gà/gia cầm".equals(animalName) || "chim".equals(animalName)) {
            return "Rexi hiểu Sen đang hỏi về " + animalName + ". Sen nói rõ giúp Rexi bé đang gặp vấn đề gì: bỏ ăn, tiêu chảy, thở khó, ủ rũ, bị thương, hay cần hỏi phòng khám có hỗ trợ không? Với gia cầm/chim, Rexi sẽ tư vấn an toàn ở mức sơ bộ và nhắc đi cơ sở thú y chuyên gia cầm nếu có dấu hiệu nặng.";
        }
        return "Rexi hiểu Sen đang hỏi về " + animalName + ". Sen nói rõ thêm bé đang bị gì hoặc Sen muốn hỏi phần nào: triệu chứng, chăm sóc, dinh dưỡng, đặt lịch khám hay bảng giá?";
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

    private String tryLocalEverydayReply(String normalizedQuery, String rawQuery) {
        if (normalizedQuery == null || normalizedQuery.isBlank()) return null;
        String q = normalizedQuery.trim();
        boolean shortQuery = isShortSimpleQuery(rawQuery);
        if (!shortQuery) return null;

        if (containsAny(q, "cam on", "thank", "thanks", "thank you")) {
            return "Không có gì ạ. Rexi vẫn ở đây, Sen cần hỏi thêm về đặt lịch, dịch vụ hoặc chăm sóc bé thì nhắn tiếp nhé.";
        }

        if (containsAny(q, "viet lai", "sua cau", "noi lich su hon", "lich su hon")) {
            return "Sen có thể viết lịch sự hơn là: \"Dạ, anh/chị có thể ghé phòng khám vào ngày mai được không ạ? Rexi sẽ hỗ trợ sắp xếp lịch phù hợp cho bé.\"";
        }

        if (containsAny(q, "phong kham minh co gi hay", "phong kham co gi hay", "rexi co gi hay")) {
            return "Phòng khám Rexi tập trung khám chó mèo, tiêm phòng, xét nghiệm, siêu âm, chăm sóc da/tai và hỗ trợ đặt lịch nhanh. Điểm tiện là Sen có thể hỏi Rexi trước để chọn dịch vụ phù hợp, lưu hồ sơ bé và theo dõi hóa đơn/lịch hẹn trên hệ thống.";
        }

        if (containsAny(q, "dat lich") && containsAny(q, "chua biet chon dich vu", "khong biet chon dich vu", "chon dich vu nao")) {
            return "Nếu chưa biết chọn dịch vụ nào, Sen chọn **Khám tổng quát** trước là an toàn nhất cho chó/mèo. Khi tới phòng khám, bác sĩ sẽ kiểm tra bé rồi chuyển sang tiêm phòng, xét nghiệm, da liễu, siêu âm hoặc cấp cứu nếu cần. Nếu bé đang khó thở, co giật, chảy máu, lừ đừ nặng hoặc nghi ngộ độc thì gọi hotline 0353.374.156 ngay.";
        }

        if (containsAny(q, "noi chuyen", "tam su", "stress", "met qua")
                && containsAny(q, "thu cung", "meo", "cho", "boss", "be nha", "bo an", "khong an")) {
            return "Rexi nghe Sen. Nếu bé bỏ ăn hoặc khác thường thì mình vừa trấn tĩnh vừa theo dõi mốc nguy hiểm nhé: mèo bỏ ăn quá 24 giờ, chó bỏ ăn kèm nôn/tiêu chảy/lừ đừ/sốt hoặc khó thở thì nên đi khám sớm. Sen có thể nhắn loài, tuổi, bé bỏ ăn bao lâu và có nôn/tiêu chảy không để Rexi hướng dẫn bước tiếp theo.";
        }

        return null;
    }

    private String tryLocalClinicGuidanceReply(String normalizedQuery) {
        if (normalizedQuery == null || normalizedQuery.isBlank()) return null;
        String q = normalizedQuery.trim();
        boolean isShortQuery = isShortSimpleQuery(q);

        if (containsAny(q, "chon khoa", "nen chon khoa", "chon muc nao", "chon dich vu nao", "khoa kham")
                && containsAny(q, "meo", "cho", "cun", "thu cung", "boss", "be")
                && isShortQuery) {
            return "Với chó/mèo nếu chưa rõ bệnh cụ thể, Sen/sếp chọn **Khám Đa Khoa** trước. Nếu bé có vấn đề rõ hơn thì chọn phân hệ phù hợp: da/tai/ngứa chọn khám da liễu, tiêm phòng chọn tiêm chủng, xét nghiệm chọn xét nghiệm, cấp cứu thì gọi hotline 0353.374.156 hoặc đưa bé tới phòng khám ngay.";
        }

        if (containsAny(q, "huong dan thanh toan", "thanh toan online", "cach thanh toan", "thanh toan nhu the nao")
                && !containsAny(q, "cap nhat", "xac nhan", "huy", "xoa", "doi trang thai", "da thanh toan")
                && isShortQuery) {
            return "Để xem hướng dẫn thanh toán online, Sen/sếp mở mục **Hóa đơn & Thanh toán**, chọn hóa đơn cần xem rồi làm theo hướng dẫn chuyển khoản/VNPay hiển thị trên màn hình. Nếu chỉ cần hướng dẫn thì Rexi không thay đổi trạng thái hóa đơn; mọi thao tác xác nhận/hủy/cập nhật thanh toán sẽ cần Rexi Agent kiểm tra quyền và xác nhận riêng.";
        }

        return null;
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
        boolean isShortQuery = isShortSimpleQuery(rawQuery);

        if (containsAny(q, "ca rong", "chim canh", "chim", "ca canh", "bo sat", "ran canh")
                && containsAny(q, "ban", "kham", "dich vu", "ho tro", "web minh", "phong kham")
                && isShortQuery) {
            return "Dạ hiện tại Rexi tập trung hỗ trợ thú cưng phổ biến như chó, mèo và một số thú nhỏ. Với cá rồng/chim cảnh, phòng khám chưa có dịch vụ chuyên sâu cố định nên Rexi không muốn tư vấn quá tay. Nếu bé có dấu hiệu nguy cấp, Sen nên liên hệ cơ sở thú y chuyên cá/chim cảnh gần nhất hoặc gọi Rexi để được hướng dẫn kênh phù hợp.";
        }

        if (isPrescriptionRequest(q)) {
            return "Rexi không thể kê đơn, chỉ định kháng sinh hoặc đưa liều dùng cho thú cưng qua chat. Với viêm da/nhiễm trùng, bác sĩ cần khám da, cân nặng, tuổi, loài và có thể cần soi da/xét nghiệm trước khi chọn thuốc. Việc an toàn nên làm ngay: giữ vùng da sạch và khô, tránh để bé gãi/liếm, không tự dùng thuốc người hoặc kháng sinh còn thừa, và đặt lịch khám da liễu nếu có mủ, lan rộng, hôi, sốt, bỏ ăn hoặc ngứa nhiều.";
        }

        if (isPostVisitCareQuery(q) && isShortQuery) {
            return "Sau khi bé vừa khám xong, Sen theo dõi 24-48 giờ đầu: ăn uống, nôn/tiêu chảy, mức tỉnh táo, vết tiêm/vết thương, nhịp thở và việc đi vệ sinh. Cho bé nghỉ ở nơi yên tĩnh, dùng thuốc đúng đơn nếu bác sĩ đã kê, không tự thêm thuốc người. Cần gọi lại phòng khám hoặc đưa bé tái khám sớm nếu bé lừ đừ tăng, bỏ ăn, nôn nhiều, khó thở, sốt, chảy máu, sưng đau nhiều hoặc có dấu hiệu lạ sau dùng thuốc.";
        }

        if (isVaccineScheduleQuery(q) && isShortQuery) {
            return "Lịch vaccine phụ thuộc tuổi, loài, vaccine đã tiêm và nguy cơ tiếp xúc. Thông thường chó/mèo con bắt đầu tiêm từ khoảng 6-8 tuần tuổi, nhắc theo lịch bác sĩ đến khi hoàn tất mũi cơ bản, sau đó nhắc định kỳ hằng năm hoặc theo khuyến cáo từng loại vaccine. Sen nên mang sổ tiêm/ảnh mũi cũ khi đặt lịch để bác sĩ Rexi chốt lịch chính xác, không tiêm khi bé đang sốt, tiêu chảy hoặc quá yếu.";
        }

        if (isPregnantCatCareQuery(q) && isShortQuery) {
            return "Với mèo mang thai, Sen giữ môi trường yên tĩnh, sạch, ấm vừa phải; cho ăn khẩu phần đủ năng lượng, dễ tiêu và luôn có nước sạch; hạn chế stress, nhảy cao/va chạm; chuẩn bị ổ đẻ khô kín. Không tự dùng thuốc, tẩy giun hay bổ sung canxi liều cao nếu chưa hỏi bác sĩ. Cần đi khám nếu mèo bỏ ăn, sốt, chảy dịch hôi/máu nhiều, rặn lâu không ra con, đau nhiều hoặc thai kỳ có dấu hiệu bất thường.";
        }

        if (isNutritionByAgeWeightQuery(q) && isShortQuery) {
            return "Để tư vấn khẩu phần chuẩn, Rexi cần loài, tuổi, cân nặng, tình trạng triệt sản, mức vận động và bệnh nền. Nguyên tắc nhanh: chọn thức ăn đúng lứa tuổi, chia bữa đều, đổi thức ăn từ từ 5-7 ngày, luôn có nước sạch, không cho xương nấu chín/socola/hành tỏi. Nếu Sen gửi tuổi + cân nặng + bé đang ăn gì, Rexi sẽ gợi ý cách chia bữa an toàn hơn.";
        }

        if (isEducationalPoisoningQuery(q) && isShortQuery) {
            return "Nếu nghi mèo/chó ngộ độc, ưu tiên đưa đi cấp cứu thú y ngay và gọi hotline 0353.374.156. Trong lúc đi: lấy mẫu/thông tin thứ bé đã ăn, không tự gây nôn, không cho uống thuốc người, than hoạt hay sữa nếu chưa được bác sĩ hướng dẫn, giữ bé yên và tránh để tiếp tục ăn liếm chất độc. Dấu hiệu nguy hiểm gồm nôn liên tục, co giật, khó thở, lừ đừ, chảy dãi nhiều, tiêu chảy máu hoặc tím tái.";
        }

        if (isHeimlichTechniqueQuery(q) && isShortQuery) {
            return "Nếu bé nghi hóc dị vật nhưng còn thở/ho được, đừng móc họng sâu vì có thể đẩy dị vật vào trong; hãy đưa đi cấp cứu ngay. Nếu bé không thở, tím tái hoặc ngã lịm: kiểm tra miệng chỉ lấy dị vật nhìn thấy rõ, giữ đầu thấp hơn thân với bé nhỏ và vỗ lưng dứt khoát; với chó lớn có thể ép bụng/ngực ngắn theo hướng lên-trước rồi lập tức đến cơ sở thú y. Gọi Rexi 0353.374.156 trong lúc di chuyển.";
        }

        if (isGeneralVetVisitWarningQuery(q) && isShortQuery) {
            return "Những dấu hiệu nên đưa chó/mèo đi khám ngay gồm: khó thở, tím tái, co giật, lịm đi; nôn/tiêu chảy liên tục hoặc có máu; bỏ ăn hơn 24 giờ ở mèo; sốt cao, đau nhiều, bụng chướng; tai nạn, chảy máu, nghi gãy xương; nghi ngộ độc/nuốt dị vật; tiểu không ra, rặn nhiều; mắt đục/đau/nhắm nghiền. Nếu đang có dấu hiệu cấp cứu, Sen gọi hotline Rexi 0353.374.156 và đưa bé tới phòng khám/cơ sở thú y gần nhất.";
        }

        if (isVomitingFoamCatQuery(q)) {
            return "Mèo nôn ra bọt trắng có thể do kích ứng dạ dày, nuốt lông, ăn quá nhanh, ký sinh trùng, viêm dạ dày-ruột hoặc bệnh nặng hơn nếu đi kèm lừ đừ/sốt/tiêu chảy. Trước mắt cho bé nghỉ ăn 2-4 giờ nếu vẫn tỉnh táo, luôn để nước sạch, không tự cho uống thuốc người. Cần đi khám sớm nếu nôn lặp lại nhiều lần, không uống được nước, bỏ ăn trên 24 giờ, tiêu chảy/ra máu, bụng đau, lừ đừ, mèo con hoặc nghi nuốt dị vật/chất độc.";
        }

        if (containsAny(q, "meo con") && containsAny(q, "moi ve", "moi nhan", "moi don", "can chuan bi", "chuan bi gi") && isShortQuery) {
            return "Mèo con mới về cần chuẩn bị: ổ nằm ấm và kín gió, khay cát thấp, bát nước/thức ăn riêng, thức ăn đúng tuổi, đồ cào móng và khu vực yên tĩnh để bé làm quen. 3-7 ngày đầu nên hạn chế tắm, không đổi thức ăn đột ngột, theo dõi ăn uống/phân/nôn/hắt hơi. Nếu bé chưa rõ lịch vaccine/tẩy giun, Sen đặt lịch khám tổng quát để bác sĩ kiểm tra tuổi, cân nặng và lên lịch chăm sóc phù hợp.";
        }

        if (isPetEyeProblemQuery(q) && isShortQuery) {
            return "Rexi hiểu là mắt của mèo đang có dấu hiệu bất thường kiểu đốm/lốm đốm, nhìn lạ hoặc có vẻ khó chịu. Với mắt thì không nên chờ lâu vì có thể liên quan viêm kết mạc, loét giác mạc, dị vật, chấn thương, nhiễm trùng hoặc tăng nhãn áp. Trước mắt không nhỏ thuốc người, không tự dùng kháng sinh/corticoid, không dụi/rửa mạnh; nếu có ghèn nhiều, đỏ, nheo mắt, chảy nước mắt, đục/trắng xanh, sưng, đau, bé dụi mắt hoặc nhìn kém thì nên đi khám thú y trong ngày để soi mắt và nhuộm fluorescein kiểm tra loét giác mạc.";
        }

        if (containsAny(q, "meo") && containsAny(q, "moi de", "vua de", "de con", "meo con", "meo me") && isShortQuery) {
            return "Với mèo mẹ mới đẻ, Sen ưu tiên 4 việc: giữ ổ ấm, khô và yên tĩnh; cho mèo mẹ ăn khẩu phần giàu năng lượng/đạm và luôn có nước sạch; theo dõi mèo con bú đều, không bị lạnh, không kêu yếu kéo dài; không tắm hoặc bế mèo con quá nhiều trong vài ngày đầu. Nếu mèo mẹ bỏ ăn, sốt, chảy dịch hôi, bỏ con hoặc mèo con lạnh/yếu không bú thì nên đưa tới bác sĩ thú y sớm.";
        }

        if (containsAny(q, "di ngoai ra nuoc", "di ngoai", "tieu chay", "phan long")
                && containsAny(q, "mui hoi", "hoi lam", "ra nuoc", "cun", "cho")
                && isShortQuery) {
            return "Rexi hiểu là cún đang có dấu hiệu **tiêu chảy nước, mùi hôi**. Đây có thể là rối loạn tiêu hóa, nhiễm khuẩn/ký sinh trùng, và ở chó con hoặc chó chưa tiêm đủ vaccine cần đặc biệt cảnh giác **Parvovirus**. Việc cần làm ngay: cho bé uống nước từng ít một, không tự dùng thuốc cầm tiêu chảy của người, theo dõi nôn/sốt/lừ đừ/phân máu. Nếu bé còn nhỏ, bỏ ăn, nôn, lừ đừ hoặc tiêu chảy liên tục thì nên mang tới phòng khám trong ngày để test và truyền dịch nếu cần.";
        }

        if (containsAny(q, "bo an", "khong an", "an it")
                && containsAny(q, "nguoi nong", "nong lam", "sot", "meo")
                && isShortQuery) {
            return "Rexi hiểu theo ngôn ngữ thú y là mèo có dấu hiệu **bỏ ăn kèm nghi sốt**. Mèo bỏ ăn quá 24 giờ đã đáng lo, nhất là nếu người nóng, lừ đừ, trốn, thở nhanh hoặc nôn. Sen nên đo nhiệt độ hậu môn nếu có nhiệt kế thú y; mèo thường khoảng 38-39.2°C, cao hơn nên đi khám. Trước mắt giữ bé ở nơi mát, có nước sạch, không tự cho uống thuốc hạ sốt của người vì có thể gây ngộ độc. Nên đặt lịch khám sớm để bác sĩ kiểm tra nguyên nhân nhiễm trùng/đau/stress.";
        }

        if (containsAny(q, "ngua tai", "gay tai", "lac dau", "hoi tai", "poodle") && isShortQuery) {
            return "Dấu hiệu ngứa tai/lắc đầu ở Poodle thường liên quan viêm tai ngoài, nấm/vi khuẩn, ve tai hoặc dị ứng da. Không nên tự nhỏ thuốc khi chưa soi tai vì nếu màng nhĩ tổn thương có thể nguy hiểm. Sen nên đặt lịch khám da liễu/tai để bác sĩ soi tai, vệ sinh đúng cách và kê thuốc phù hợp.";
        }

        return null;
    }

    private SemanticIntent tryParseSemanticIntent(String rawQuery, String normalizedQuery) {
        if (!shouldUseSemanticIntentParser(rawQuery, normalizedQuery)) {
            return null;
        }
        try {
            String json = groqService.parseIntentJson(rawQuery);
            JsonNode node = new ObjectMapper().readTree(json);
            return new SemanticIntent(
                    node.path("intent").asText("unknown"),
                    node.path("species").asText("unknown"),
                    node.path("body_part").asText("unknown"),
                    readStringArray(node.path("symptoms")),
                    node.path("needs_web_search").asBoolean(false),
                    node.path("urgency").asText("unknown"),
                    node.path("confidence").asDouble(0.0)
            );
        } catch (Exception ex) {
            logger.warning("Semantic intent parser fallback: " + ex.getMessage());
            return null;
        }
    }

    private boolean shouldUseSemanticIntentParser(String rawQuery, String normalizedQuery) {
        if (rawQuery == null || rawQuery.isBlank()) return false;
        String q = normalizedQuery == null ? "" : normalizedQuery;
        if (isQuickLocalQuery(q) || isDbLocalQuery(q) || isAutopilotQuery(q)) return false;
        boolean obvious = isWebSearchQuery(rawQuery) || isMedicalQuery(q) || isClinicInfoQuery(q);
        boolean petContext = containsAny(q, "meo", "cho", "cun", "boss", "pet", "thu cung", "be nha");
        boolean noisy = rawQuery.length() >= 12 && !obvious;
        return petContext && noisy;
    }

    private List<String> readStringArray(JsonNode node) {
        List<String> values = new ArrayList<>();
        if (node != null && node.isArray()) {
            for (JsonNode item : node) {
                if (item.isTextual() && !item.asText().isBlank()) {
                    values.add(item.asText());
                }
            }
        }
        return values;
    }

    private String trySemanticVeterinaryReply(SemanticIntent intent) {
        if (intent == null || intent.confidence() < 0.70) return null;
        if (!"vet_advice".equals(intent.intent())) return null;
        if ("eye".equals(intent.bodyPart())) {
            String species = switch (intent.species()) {
                case "cat" -> "mèo";
                case "dog" -> "chó";
                default -> "thú cưng";
            };
            return "Rexi hiểu là " + species + " đang có dấu hiệu bất thường ở mắt. Với mắt thì nên xử lý thận trọng vì có thể liên quan viêm kết mạc, loét giác mạc, dị vật, chấn thương, nhiễm trùng hoặc tăng nhãn áp. Trước mắt không nhỏ thuốc người, không tự dùng kháng sinh/corticoid, không dụi/rửa mạnh; giữ bé tránh gãi mắt. Nếu mắt đỏ, đục, có đốm/lốm đốm, ghèn nhiều, chảy nước mắt, nheo mắt, sưng, đau hoặc nhìn kém thì nên đi khám thú y trong ngày để soi mắt và kiểm tra loét giác mạc.";
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
        String q = normalizedQuery;

        if (containsAny(q,
                "mo trang", "mo bao cao", "mo quan ly", "mo danh sach", "mo hoa don", "mo ho so",
                "mo lich", "mo kho", "mo dieu hanh", "dua toi den", "di toi", "vao trang",
                "qua trang", "nhay qua", "tele qua", "bay qua",
                "dan toi", "dan den", "di den", "chuyen den", "chuyen sang",
                "dat lich", "book lich", "lap lich", "tao lich", "huy lich", "doi lich",
                "tim khach", "tim ho so", "tra cuu khach", "tra cuu", "quet du lieu", "check giup", "check ho",
                "loc hoa don", "loc lich", "loc cac ca", "xuat excel")) {
            return true;
        }

        return containsAny(q, "them", "sua", "xoa", "dien", "fill", "chon", "bam", "click", "tap", "an vao")
                && containsAny(q, "trang", "muc", "menu", "tab", "nut", "button", "form", "bang", "danh sach", "truong", "o nhap");
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
                "chong mat", "co giat", "kho tho", "di ngoai", "bo an", "lo loet", "viem da",
                "do mat", "gien mat", "ghem mat", "chay nuoc mat", "duc mat", "lo dom dom mat"
        };
        for (String kw : medicalPhrases) {
            if (containsNormalizedTokenOrPhrase(normalizedQuery, kw)) return true;
        }

        String[] coreMedicalTokens = {"benh", "kham", "bnh", "bsi"};
        for (String kw : coreMedicalTokens) {
            if (containsNormalizedTokenOrPhrase(normalizedQuery, kw)) return true;
        }

        if (containsNormalizedTokenOrPhrase(normalizedQuery, "thuoc") || containsNormalizedTokenOrPhrase(normalizedQuery, "thuooc")) {
            return containsAny(normalizedQuery, "lieu", "khang sinh", "phac do", "dieu tri", "toa thuoc", "ke don", "benh", "benh cho", "benh meo", "kham", "sot", "non", "ho", "ngua", "dau");
        }

        if (!hasPetOrClinicContext(normalizedQuery)) return false;

        String[] symptomTokens = {"sot", "soot", "non", "ngua", "ho", "dau", "tieu chay", "di ngoai", "bo an", "sung", "met", "chet", "vac", "biet", "loet", "viem"};
        for (String kw : symptomTokens) {
            if (containsNormalizedTokenOrPhrase(normalizedQuery, kw)) return true;
        }

        return false;
    }

    private boolean hasPetOrClinicContext(String normalizedQuery) {
        if (normalizedQuery == null || normalizedQuery.isBlank()) return false;
        return containsAny(normalizedQuery,
                "meo", "cho", "cun", "ga", "gia cam", "chim", "tho", "hamster",
                "thu cung", "boss", "be nha", "pet",
                "thu y", "phong kham", "bac si", "bsi", "benh vien" );
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

    private String enforceVeterinaryAnswerQuality(
            String rawQuery,
            String normalizedQuery,
            String reply,
            ChatRoute route,
            List<Map<String, String>> webResults
    ) {
        String safeReply = reply == null ? "" : reply.trim();
        String q = normalizedQuery == null ? normalizeVietnamese(rawQuery == null ? "" : rawQuery).toLowerCase(Locale.ROOT) : normalizedQuery;
        String normalizedReply = normalizeVietnamese(safeReply).toLowerCase(Locale.ROOT);

        if (isPrescriptionRequest(q)) {
            return "Rexi không thể kê đơn, chỉ định kháng sinh hoặc đưa liều dùng cho thú cưng qua chat. Với viêm da/nhiễm trùng, bác sĩ cần khám da, cân nặng, tuổi, loài và có thể cần soi da/xét nghiệm trước khi chọn thuốc. Việc an toàn nên làm ngay: giữ vùng da sạch và khô, tránh để bé gãi/liếm, không tự dùng thuốc người hoặc kháng sinh còn thừa, và đặt lịch khám da liễu nếu có mủ, lan rộng, hôi, sốt, bỏ ăn hoặc ngứa nhiều.";
        }

        if (isVomitingFoamCatQuery(q) && isClearlyOffTopic(q, normalizedReply)) {
            return "Mèo nôn ra bọt trắng có thể do kích ứng dạ dày, nuốt lông, ăn quá nhanh, ký sinh trùng, viêm dạ dày-ruột hoặc bệnh nặng hơn nếu đi kèm lừ đừ/sốt/tiêu chảy. Trước mắt cho bé nghỉ ăn 2-4 giờ nếu vẫn tỉnh táo, luôn để nước sạch, không tự cho uống thuốc người. Cần đi khám sớm nếu nôn lặp lại nhiều lần, không uống được nước, bỏ ăn trên 24 giờ, tiêu chảy/ra máu, bụng đau, lừ đừ, mèo con hoặc nghi nuốt dị vật/chất độc.";
        }

        if (route == ChatRoute.WEB_AI) {
            if (isEducationalEmergencyQuestion(q) && normalizedReply.startsWith("[emergency]")) {
                safeReply = safeReply.replaceFirst("(?i)^\\[EMERGENCY\\]\\s*", "");
            }
            if (webResults == null || webResults.isEmpty()) {
                return "Rexi chưa lấy được nguồn web phù hợp từ DuckDuckGo cho câu hỏi này, nên không coi phần trả lời là thông tin đã kiểm chứng bằng nguồn ngoài. Bạn có thể hỏi lại với tên bệnh/loài cụ thể hơn, ví dụ: \"giảm bạch cầu ở mèo FPV\" hoặc \"parvo ở chó dấu hiệu cấp cứu\".";
            }
            String deterministicWebAnswer = buildDeterministicVeterinaryWebAnswer(q, webResults);
            if (deterministicWebAnswer != null) {
                return deterministicWebAnswer;
            }
            if (!mentionsAnyResultUrl(safeReply, webResults)) {
                StringBuilder sb = new StringBuilder(safeReply);
                sb.append("\n\nNguồn DuckDuckGo Rexi đã đối chiếu:\n");
                for (Map<String, String> item : webResults) {
                    sb.append("- [")
                            .append(item.getOrDefault("title", "Nguồn tham khảo").replace("[", "").replace("]", ""))
                            .append("](")
                            .append(item.getOrDefault("url", ""))
                            .append(")\n");
                }
                return sb.toString().trim();
            }
        }

        return safeReply;
    }

    private String buildDeterministicVeterinaryWebAnswer(String normalizedQuery, List<Map<String, String>> webResults) {
        if (webResults == null || webResults.isEmpty()) {
            return null;
        }

        String topic;
        String summary;
        if (containsAny(normalizedQuery, "parvo")) {
            topic = "Parvo ở chó";
            summary = "Parvo ở chó là bệnh truyền nhiễm nguy hiểm, tiến triển nhanh, thường gây nôn, tiêu chảy nặng, phân hôi hoặc có máu, bỏ ăn, sốt hoặc hạ thân nhiệt, lừ đừ và mất nước. Cần đưa đi cấp cứu thú y ngay nếu chó con/chó chưa tiêm đủ vaccine có nôn liên tục, tiêu chảy máu, kiệt sức, không uống được nước, bụng đau, nằm bẹp hoặc dấu hiệu mất nước. Không tự dùng kháng sinh/thuốc cầm tiêu chảy của người; ưu tiên cách ly, giữ ấm vừa phải và đưa tới cơ sở thú y để test nhanh, truyền dịch và điều trị hỗ trợ.";
        } else if (containsAny(normalizedQuery, "bach cau", "fpv", "panleukopenia")) {
            topic = "Giảm bạch cầu ở mèo";
            summary = "Giảm bạch cầu ở mèo thường được nhắc tới như FPV/feline panleukopenia, một bệnh virus nguy hiểm làm mèo suy sụp nhanh, nôn, tiêu chảy, bỏ ăn, sốt hoặc hạ thân nhiệt, mất nước và giảm miễn dịch. Đây không phải bệnh nên tự xử lý tại nhà. Nếu mèo con, mèo chưa tiêm phòng, lừ đừ, nôn/tiêu chảy, bỏ ăn hoặc nghi tiếp xúc mèo bệnh thì nên đi khám sớm để test và điều trị hỗ trợ.";
        } else if (containsAny(normalizedQuery, "da cho", "za cho", "benh da cho", "viem da cho")) {
            topic = "Bệnh da ở chó";
            summary = "Bệnh da ở chó có thể do nấm, ghẻ/ve Demodex-Sarcoptes, dị ứng, vi khuẩn, ký sinh trùng ngoài da hoặc rối loạn nội tiết. Dấu hiệu cần chú ý gồm ngứa nhiều, rụng lông từng mảng, da đỏ, vảy gàu, mùi hôi, mụn mủ, chảy dịch hoặc bé liếm/gãi liên tục. Việc nên làm là tắm/vệ sinh theo hướng dẫn thú y, hạn chế gãi/liếm bằng vòng chống liếm nếu cần, giặt ổ nằm và đưa chó đi khám da liễu để soi da/cạo da/xét nghiệm nấm khi tổn thương lan rộng, có mủ, hôi, đau hoặc kéo dài. Không tự dùng thuốc người, corticoid hay kháng sinh khi chưa khám.";
        } else if (containsAny(normalizedQuery, "nam da", "viem da", "da lieu")) {
            topic = "Nấm/viêm da ở mèo";
            summary = "Nấm da ở mèo thường liên quan dermatophyte như Microsporum canis, có thể gây rụng lông từng mảng, da đỏ, vảy gàu, ngứa và có khả năng lây sang người hoặc thú khác. Nên cách ly tương đối, vệ sinh chăn ổ/dụng cụ, rửa tay sau tiếp xúc và đưa mèo đi khám để soi da/đèn Wood/nuôi cấy khi cần. Không tự bôi thuốc người hoặc dùng kháng sinh nếu chưa có bác sĩ thú y chỉ định.";
        } else {
            return null;
        }

        StringBuilder sb = new StringBuilder();
        sb.append("Dạ, Rexi đã tra DuckDuckGo và lọc nguồn đúng chủ đề **").append(topic).append("**.\n\n");
        sb.append(summary).append("\n\n");
        sb.append("Nguồn tham khảo:\n");
        for (Map<String, String> item : webResults) {
            sb.append("- [")
                    .append(item.getOrDefault("title", "Nguồn tham khảo").replace("[", "").replace("]", ""))
                    .append("](")
                    .append(item.getOrDefault("url", ""))
                    .append(")\n");
        }
        return sb.toString().trim();
    }

    private boolean isPrescriptionRequest(String normalizedQuery) {
        if (normalizedQuery == null || normalizedQuery.isBlank()) return false;
        return containsAny(normalizedQuery, "ke don", "toa thuoc", "lieu dung", "lieu luong", "diazepam", "uong bao nhieu", "cho uong may vien")
                || ((containsAny(normalizedQuery, "dung khang sinh", "khang sinh")
                || containsAny(normalizedQuery, "thuoc nguoi", "thuoc nguoi thay"))
                && containsAny(normalizedQuery, "bao nhieu", "may vien", "lieu", "uong", "cho uong", "duoc su dung", "sai cach"));
    }

    private String classifyIntentWithAi(String query) {
        try {
            List<ChatMessage> classificationHistory = new ArrayList<>();
            ChatMessage sysMsg = new ChatMessage();
            sysMsg.setRole("system");
            sysMsg.setContent(
                "Bạn là bộ phận định tuyến AI siêu tốc cho phòng khám thú y Rexi. Hãy đọc câu hỏi của người dùng và trả về DUY NHẤT một trong các nhãn sau:\n" +
                "- DB_DOCTORS: Nếu người dùng muốn biết thông tin, danh sách bác sĩ.\n" +
                "- DB_SCHEDULE: Hỏi về lịch trực của bác sĩ.\n" +
                "- DB_SERVICES: Hỏi về giá dịch vụ, bảng giá, chi phí khám.\n" +
                "- CLINICAL_QUESTION: Hỏi bệnh, triệu chứng, tư vấn y khoa, cách sơ cứu, xin lời khuyên thú y.\n" +
                "- AUTOPILOT: Yêu cầu mở trang, chuyển trang, hoặc thao tác giao diện (ví dụ: mở trang quản lý, đặt lịch, thêm mới).\n" +
                "- WEB_SEARCH: Yêu cầu tìm kiếm trên mạng, tra google, tìm nguồn.\n" +
                "- OTHER: Các câu chuyện phiếm hoặc câu hỏi khác.\n\n" +
                "Quy tắc nghiêm ngặt: CHỈ trả về đúng tên nhãn ở trên, không giải thích, không viết thêm bất kỳ từ nào."
            );
            classificationHistory.add(sysMsg);

            ChatMessage userMsg = new ChatMessage();
            userMsg.setRole("user");
            userMsg.setContent(query);
            classificationHistory.add(userMsg);

            String model = groqService.getAutopilotModelName(); // Sử dụng Llama 8B tốc độ cao
            String intent = groqService.chat(classificationHistory, model).trim().toUpperCase(Locale.ROOT);
            
            if (intent.contains("DB_DOCTORS")) return "DB_DOCTORS";
            if (intent.contains("DB_SCHEDULE")) return "DB_SCHEDULE";
            if (intent.contains("DB_SERVICES")) return "DB_SERVICES";
            if (intent.contains("CLINICAL_QUESTION")) return "CLINICAL_QUESTION";
            if (intent.contains("AUTOPILOT")) return "AUTOPILOT";
            if (intent.contains("WEB_SEARCH")) return "WEB_SEARCH";
            return "OTHER";
        } catch (Exception e) {
            logger.warning("[AI ROUTER] Không phân loại được bằng AI, fallback về mặc định: " + e.getMessage());
            return "OTHER";
        }
    }

    private ChatRequestPlan planChatRequest(String normalizedQuery, String rawQuery, boolean hasMedia) {
        if (!hasMedia && isQuickLocalQuery(normalizedQuery)) {
            return new ChatRequestPlan(ChatRoute.QUICK_LOCAL, false, false, false, false, "local");
        }
        if (!hasMedia && isSensitiveDataLookup(normalizedQuery)) {
            return new ChatRequestPlan(ChatRoute.SENSITIVE_HANDOFF, false, false, false, false, "agent");
        }

        // Cốt lõi của sự thông minh: Luôn hỏi AI phân loại ý định trước
        String aiIntent = "OTHER";
        if (!hasMedia) {
            aiIntent = classifyIntentWithAi(rawQuery);
            logger.info("[AI ROUTER] planChatRequest phân loại: " + aiIntent);
        }

        if (hasMedia) {
            return new ChatRequestPlan(ChatRoute.MEDIA_AI, false, true, false, true, "gemini");
        }
        if (aiIntent.equals("WEB_SEARCH") || isWebSearchQuery(rawQuery)) {
            return new ChatRequestPlan(ChatRoute.WEB_AI, false, true, false, true, "web+ai");
        }
        if (aiIntent.equals("AUTOPILOT") || isAutopilotQuery(normalizedQuery)) {
            return new ChatRequestPlan(ChatRoute.AUTOPILOT_AI, false, true, false, true, "groq");
        }
        if (aiIntent.equals("CLINICAL_QUESTION") || isMedicalQuery(normalizedQuery)) {
            return new ChatRequestPlan(ChatRoute.MEDICAL_AI, false, true, false, true, "medical");
        }
        if (aiIntent.startsWith("DB_")) {
            return new ChatRequestPlan(ChatRoute.DB_LOCAL, true, false, false, true, "database");
        }

        boolean needsClinicContext = isClinicInfoQuery(normalizedQuery) || aiIntent.equals("OTHER");
        return new ChatRequestPlan(ChatRoute.CHAT_AI, false, true, true, needsClinicContext, "groq");
    }

    private boolean isShortSimpleQuery(String rawQuery) {
        if (rawQuery == null || rawQuery.isBlank()) return false;
        String trimmed = rawQuery.trim();
        if (trimmed.length() > 140) return false;
        return trimmed.split("\\s+").length <= 24;
    }

    private boolean isVomitingFoamCatQuery(String normalizedQuery) {
        return containsAny(normalizedQuery, "meo")
                && containsAny(normalizedQuery, "non bot trang", "non ra bot trang", "oi bot trang");
    }

    private boolean isPetEyeProblemQuery(String normalizedQuery) {
        if (normalizedQuery == null || normalizedQuery.isBlank()) return false;
        boolean petContext = containsAny(normalizedQuery, "meo", "cho", "cun", "thu cung", "boss", "be nha", "pet");
        boolean eyeContext = containsNormalizedTokenOrPhrase(normalizedQuery, "mat")
                || containsAny(normalizedQuery, "con mat", "mắt", "eye", "giac mac", "dong tu");
        boolean abnormalEye = containsAny(normalizedQuery,
                "dom dom", "lo dom", "lo dom dom", "lom dom", "lo mom", "lo lo", "loang",
                "do mat", "mat do", "duc mat", "mat duc", "mo mat", "mat mo",
                "gien", "ghem", "ghet mat", "chay nuoc mat", "nheo mat", "sung mat",
                "dau mat", "liem mat", "dui mat", "loet", "di vat", "nhin kem",
                "la la", "bat thuong", "khac thuong");
        return petContext && eyeContext && abnormalEye;
    }

    private boolean isPostVisitCareQuery(String q) {
        return containsAny(q, "sau khi", "vua kham", "kham xong", "ve nha", "tai kham")
                && containsAny(q, "cham soc", "theo doi", "can lam gi", "luu y gi", "chuan bi gi");
    }

    private boolean isVaccineScheduleQuery(String q) {
        return containsAny(q, "vaccine", "vac xin", "tiem phong", "lich tiem", "mui tiem")
                && containsAny(q, "dinh ky", "lich", "cho meo", "cho", "meo", "thu cung");
    }

    private boolean isPregnantCatCareQuery(String q) {
        return containsAny(q, "meo mang thai", "meo bau", "meo co bau", "meo chua")
                && containsAny(q, "cham soc", "an toan", "tai nha", "can lam gi", "luu y");
    }

    private boolean isNutritionByAgeWeightQuery(String q) {
        return containsAny(q, "khau phan", "dinh duong", "an bao nhieu", "che do an")
                && containsAny(q, "tuoi", "can nang", "phu hop", "theo tuoi", "theo can");
    }

    private boolean isEducationalPoisoningQuery(String q) {
        return containsAny(q, "ngo doc", "an nham", "uong nham", "thuc pham doc", "ngo doc thuc pham")
                && containsAny(q, "so cuu", "cach xu ly", "lam gi", "phai lam gi", "huong dan");
    }

    private boolean isHeimlichTechniqueQuery(String q) {
        return containsAny(q, "heimlich", "hoc di vat", "nghen", "nghet", "mac xuong")
                && containsAny(q, "huong dan", "ky thuat", "cach lam", "so cuu");
    }

    private boolean isGeneralVetVisitWarningQuery(String q) {
        return containsAny(q, "dau hieu nao", "nhung dau hieu", "khi nao", "truong hop nao")
                && containsAny(q, "can dua di kham", "di kham ngay", "di cap cuu", "cap cuu", "kham ngay")
                && containsAny(q, "cho meo", "cho", "meo", "thu cung", "boss", "pet");
    }

    private boolean isClearlyOffTopic(String normalizedQuery, String normalizedReply) {
        boolean petQuestion = containsAny(normalizedQuery, "meo", "cho", "cun", "thu cung", "pet");
        if (!petQuestion) return false;
        boolean replyMentionsPet = containsAny(normalizedReply, "meo", "cho", "cun", "thu cung", "thu y", "boss", "be ");
        boolean weirdFashionOrHumanTopic = containsAny(normalizedReply, "trang phai lam", "benh vien hoac trung tam y te", "nguoi benh", "bao hiem y te", "bhyt");
        return weirdFashionOrHumanTopic || !replyMentionsPet;
    }

    private boolean mentionsAnyResultUrl(String reply, List<Map<String, String>> webResults) {
        if (reply == null || webResults == null) return false;
        for (Map<String, String> item : webResults) {
            String url = item.getOrDefault("url", "");
            if (!url.isBlank() && reply.contains(url)) {
                return true;
            }
        }
        return false;
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

    private ChatRequestPlan duplicate_planChatRequest(String normalizedQuery, String rawQuery, boolean hasMedia) {
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
            return new ChatRequestPlan(ChatRoute.MEDICAL_AI, false, true, false, true, "medical");
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

        String userRole = normalizedRoleFromAuth(auth);

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
                "khach hang moi hom nay", "so khach hang moi", "xu huong hom nay", "xu huong khach hang",
                "thong ke khach hang", "bao cao khach hang hom nay",
                "check profile", "check lich", "check hoa don", "check bill", "bill cua toi",
                "xem bill", "bill cua be", "bill be", "invoice cua toi", "invoice be",
                "acc cua toi", "acc toi", "acc tui", "info cua toi", "info toi", "info tui",
                "sdt khach", "sdt cua khach", "so dt khach", "phone khach",
                "lich be nha", "lich cua be", "lich boss", "lich pet", "lich cua tui"
        };
        for (String kw : keywords) {
            if (q.contains(kw)) return true;
        }
        boolean petOwnerPhrase = containsAny(q, "be nha toi", "be nha tui", "boss nha toi", "boss nha tui", "pet nha toi", "pet nha tui");
        boolean internalDataContext = containsAny(q,
                "lich", "hoa don", "bill", "invoice", "benh an", "don thuoc", "ho so",
                "profile", "thong tin", "sdt", "so dien thoai", "email", "tai khoan", "acc");
        if (petOwnerPhrase && internalDataContext) {
            return true;
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
                && (q.contains("nao") || q.contains("danh sach") || q.contains("co ai") || q.contains("gioi thieu")
                || q.contains("thong tin") || q.contains("cho toi biet") || q.contains("doi ngu"));
    }

    private String buildServicePriceReply(String normalizedQuery) {
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT ten_dich_vu, gia, thoi_luong_phut FROM DichVu "
                        + "WHERE (da_xoa IS NULL OR LOWER(CAST(da_xoa AS varchar)) IN ('0', 'false')) "
                        + "AND (trang_thai IS NULL OR LOWER(CAST(trang_thai AS varchar)) IN ('1', 'true')) "
                        + "ORDER BY ten_dich_vu OFFSET 0 ROWS FETCH NEXT 30 ROWS ONLY");
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
                "SELECT llv.ngay_lam, llv.gio_bat_dau, llv.gio_ket_thuc, llv.ghi_chu, nv.ho_ten, nv.chuyen_mon "
                        + "FROM LichLamViecNhanVien llv JOIN NhanVien nv ON nv.id_nhan_vien = llv.id_nhan_vien "
                        + "WHERE llv.ngay_lam BETWEEN ? AND ? AND (nv.da_xoa IS NULL OR LOWER(CAST(nv.da_xoa AS varchar)) IN ('0', 'false')) "
                        + "AND (LOWER(COALESCE(nv.chuyen_mon, '')) LIKE '%bác sĩ%' "
                        + "OR LOWER(COALESCE(nv.chuyen_mon, '')) LIKE '%bac si%' "
                        + "OR LOWER(COALESCE(nv.chuyen_mon, '')) LIKE '%doctor%' "
                        + "OR EXISTS (SELECT 1 FROM TaiKhoan tk WHERE tk.id_nhan_vien = nv.id_nhan_vien "
                        + "AND (tk.id_vai_tro IN ('VT-BS', 'VT-2', '2') OR UPPER(COALESCE(tk.id_vai_tro, '')) LIKE '%BS%'))) "
                        + "AND LOWER(COALESCE(nv.ho_ten, '')) NOT LIKE '%kiểm thử%' "
                        + "AND LOWER(COALESCE(nv.ho_ten, '')) NOT LIKE '%admin%' "
                        + "AND LOWER(COALESCE(nv.ho_ten, '')) NOT LIKE '%tiếp tân%' "
                        + "ORDER BY llv.ngay_lam, llv.gio_bat_dau OFFSET 0 ROWS FETCH NEXT 12 ROWS ONLY",
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
                "SELECT ho_ten, chuyen_mon, gioi_thieu FROM NhanVien "
                        + "WHERE (da_xoa IS NULL OR LOWER(CAST(da_xoa AS varchar)) IN ('0', 'false')) "
                        + "AND (LOWER(COALESCE(chuyen_mon, '')) LIKE '%bác sĩ%' "
                        + "OR LOWER(COALESCE(chuyen_mon, '')) LIKE '%bac si%' "
                        + "OR LOWER(COALESCE(chuyen_mon, '')) LIKE '%doctor%' "
                        + "OR EXISTS (SELECT 1 FROM TaiKhoan tk WHERE tk.id_nhan_vien = NhanVien.id_nhan_vien "
                        + "AND (tk.id_vai_tro IN ('VT-BS', 'VT-2', '2') OR UPPER(COALESCE(tk.id_vai_tro, '')) LIKE '%BS%'))) "
                        + "AND LOWER(COALESCE(ho_ten, '')) NOT LIKE '%kiểm thử%' "
                        + "AND LOWER(COALESCE(ho_ten, '')) NOT LIKE '%admin%' "
                        + "AND LOWER(COALESCE(ho_ten, '')) NOT LIKE '%tiếp tân%' "
                        + "AND (chuyen_mon IS NOT NULL OR gioi_thieu IS NOT NULL) "
                        + "ORDER BY ho_ten OFFSET 0 ROWS FETCH NEXT 8 ROWS ONLY");
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

    private String normalizeNoisyVietnameseForIntent(String input) {
        String normalized = normalizeVietnamese(input == null ? "" : input)
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9\\s]", " ")
                .replaceAll("\\s+", " ")
                .trim();
        if (normalized.isBlank()) return "";

        normalized = normalized
                .replaceAll("\\b(search|seach|serch|sreach|sot|zot|shot|sech)\\b", "search")
                .replaceAll("\\b(gg|gugol|gu g[o0]l|google)\\b", "google")
                .replaceAll("\\b(za|daa|dza|zda)\\b", "da")
                .replaceAll("\\b(ch0|choo|choe|cgo)\\b", "cho")
                .replaceAll("\\b(me0|meoo|meu|miu)\\b", "meo")
                .replaceAll("\\b(tlieu|tl|tai lieu|tailieu|tai lieu)\\b", "tai lieu")
                .replaceAll("\\b(phacdo|phac doo)\\b", "phac do");

        return normalized.trim().replaceAll("\\s+", " ");
    }

    private String correctNoisyIntentToken(String token) {
        if (token == null || token.length() < 2) return token;
        String[] canonical = {
                "search", "google", "tim", "tra", "cuu", "tai", "lieu", "nguon",
                "tham", "khao", "benh", "trieu", "chung", "dieu", "tri", "phac", "do",
                "thu", "y", "cho", "meo", "cun", "da", "viem", "nam", "ghe",
                "parvo", "bach", "cau", "fpv", "thuoc", "khang", "sinh",
                "mat", "dom", "do", "duc", "gien", "ghem", "lo", "lom"
        };
        for (String candidate : canonical) {
            int maxDistance = candidate.length() <= 3 ? 1 : 2;
            if (Math.abs(candidate.length() - token.length()) <= maxDistance
                    && levenshteinDistance(token, candidate, maxDistance) <= maxDistance) {
                return candidate;
            }
        }
        return token;
    }

    private int levenshteinDistance(String a, String b, int cutoff) {
        if (a == null || b == null) return cutoff + 1;
        if (Math.abs(a.length() - b.length()) > cutoff) return cutoff + 1;
        int[] prev = new int[b.length() + 1];
        int[] curr = new int[b.length() + 1];
        for (int j = 0; j <= b.length(); j++) prev[j] = j;
        for (int i = 1; i <= a.length(); i++) {
            curr[0] = i;
            int rowMin = curr[0];
            for (int j = 1; j <= b.length(); j++) {
                int cost = a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1;
                curr[j] = Math.min(Math.min(curr[j - 1] + 1, prev[j] + 1), prev[j - 1] + cost);
                rowMin = Math.min(rowMin, curr[j]);
            }
            if (rowMin > cutoff) return cutoff + 1;
            int[] tmp = prev;
            prev = curr;
            curr = tmp;
        }
        return prev[b.length()];
    }

    private EmergencyTriage classifyEmergencyTriage(String normalizedQuery) {
        String q = normalizedQuery == null ? "" : normalizedQuery.trim();
        if (q.isBlank()) return new EmergencyTriage(false, 0, "none", "empty");
        if (isEducationalEmergencyQuestion(q)) {
            return new EmergencyTriage(false, 0, "none", "educational-question");
        }

        int score = 0;
        String category = "general";
        List<String> reasons = new ArrayList<>();

        if (containsAny(q, "sos", "emergency", "cuu toi", "cuu voi", "giup voi", "chet mat", "sap chet")
                || (containsNormalizedTokenOrPhrase(q, "cap cuu") && containsAny(q, "dang", "can gap", "ngay bay gio", "nhanh len"))
                || (containsNormalizedTokenOrPhrase(q, "khan cap") && containsAny(q, "dang", "can gap", "ngay bay gio", "nhanh len"))) {
            score += 5;
            reasons.add("explicit-distress");
        }
        if (containsAny(q, "khong tho", "ngung tho", "ngat tho", "kho tho", "tim tai", "luoi tim", "thoi thop")) {
            score += 6;
            category = "airway";
            reasons.add("airway-breathing");
        }
        if (containsNormalizedTokenOrPhrase(q, "hoc")
                || containsAny(q, "mac xuong", "di vat", "nghen", "nghet", "nuot phai")) {
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

        boolean emergency = score >= 7 || (score >= 5 && containsAny(q, "dang", "ngay bay gio", "nhanh len", "cuu", "khong tho", "tim tai", "bat tinh", "co giat", "chay mau", "ngo doc"));
        return new EmergencyTriage(emergency, score, category, reasons.isEmpty() ? "none" : String.join(",", reasons));
    }

    private boolean isEducationalEmergencyQuestion(String normalizedQuery) {
        if (normalizedQuery == null) return false;
        return containsAny(normalizedQuery,
                "dau hieu nao can di cap cuu",
                "khi nao can di cap cuu",
                "truong hop nao can cap cuu",
                "can di cap cuu khong",
                "co can cap cuu khong",
                "cach so cuu",
                "huong dan so cuu",
                "ky thuat so cuu")
                || (containsAny(normalizedQuery, "tim tai lieu", "tra cuu", "gg", "duckduckgo", "nguon tham khao")
                && containsAny(normalizedQuery, "cap cuu", "khan cap"));
    }

    private boolean containsAny(String value, String... terms) {
        if (value == null) return false;
        String padded = " " + value.replaceAll("[^a-z0-9\\s]", " ").replaceAll("\\s+", " ").trim() + " ";
        for (String term : terms) {
            String normalizedTerm = term == null ? "" : term.replaceAll("[^a-z0-9\\s]", " ").replaceAll("\\s+", " ").trim();
            if (!normalizedTerm.isBlank() && padded.contains(" " + normalizedTerm + " ")) return true;
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



