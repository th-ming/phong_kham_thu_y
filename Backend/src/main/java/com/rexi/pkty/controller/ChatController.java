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

    // Wrapper má»›i an toÃ n hÆ¡n Headers
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
        logger.info("Báº¯t Ä‘áº§u dá»n dáº¹p ConcurrentHashMap rateLimiter trÃ¡nh rÃ² rá»‰ bá»™ nhá»› mÃ¡y chá»§... ðŸ§¹");
        int beforeSize = rateLimiter.size();
        rateLimiter.entrySet().removeIf(entry -> java.time.Instant.now().isAfter(entry.getValue().resetTime));
        int afterSize = rateLimiter.size();
        logger.info("ÄÃ£ dá»n dáº¹p xong rateLimiter. KÃ­ch thÆ°á»›c trÆ°á»›c: " + beforeSize + ", KÃ­ch thÆ°á»›c sau: " + afterSize);
    }

    @PostMapping("/prewarm")
    public Map<String, Object> prewarm() {
        java.util.concurrent.CompletableFuture.runAsync(() -> {
            try {
                groqService.prewarm();
            } catch (Exception e) {
                logger.warning("KhÃ´ng thá»ƒ prewarm Groq: " + e.getMessage());
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
            logger.severe("Lá»—i dá»‹ch giá»ng nÃ³i Whisper: " + e.getMessage());
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
                ? "Sen Æ¡i, gá»­i video liÃªn tá»¥c tá»‘n nhiá»u nÄƒng lÆ°á»£ng cá»§a Rexi quÃ¡! ðŸ™€ Sen Ä‘á»£i 1 phÃºt ná»¯a rá»“i gá»­i tiáº¿p video cho Rexi xem nha!"
                : "Dáº¡ Sen Æ¡i, Sen chat nhanh quÃ¡ Rexi Ä‘á»c khÃ´ng ká»‹p luÃ´n nÃ¨! ðŸ¾ Sen nghá»‰ ngÆ¡i xÃ­u rá»“i 1 phÃºt sau quay láº¡i trÃ² chuyá»‡n tiáº¿p nha!";
            return Map.of("reply", warning);
        }

        try {
            if (history == null || history.isEmpty()) {
                String welcomeMessage = "Xin chÃ o Sen! ðŸ¾ ChÃ o má»«ng Sen Ä‘áº¿n vá»›i **PhÃ²ng khÃ¡m ThÃº y Rexi**! ðŸ¥âœ¨\n\n" +
                                        "Rexi cÃ³ thá»ƒ giÃºp Sen:\n" +
                                        "ðŸ“… **Äáº·t lá»‹ch khÃ¡m** nhanh gá»n.\n" +
                                        "ðŸ¶ **Táº¡o há»“ sÆ¡ thÃº cÆ°ng**.\n" +
                                        "ðŸ©º **TÆ° váº¥n y táº¿ & sÆ¡ cá»©u** cho bÃ©.\n\n" +
                                        "Sen cáº§n Rexi há»— trá»£ gÃ¬ hÃ´m nay áº¡?";
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
                        "Sen Æ¡i tin nháº¯n hÆ¡i dÃ i quÃ¡ Ã²i! ðŸ˜¿ Sen tÃ³m táº¯t láº¡i tÃ¬nh tráº¡ng cá»§a bÃ© ngáº¯n gá»n (dÆ°á»›i 1000 kÃ½ tá»±) Ä‘á»ƒ Rexi Ä‘á»c vÃ  tÆ° váº¥n chuáº©n xÃ¡c nháº¥t nha!");
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
                                        : "KhÃ´ng cÃ³ bá»‘i cáº£nh giao diá»‡n.";
            
            String currentActivityLogs = "KhÃ´ng cÃ³ nháº­t kÃ½ hÃ nh Ä‘á»™ng gáº§n Ä‘Ã¢y.";
            if (autopilotRequested && payload.activityLogs != null) {
                 try {
                     currentActivityLogs = new ObjectMapper().writeValueAsString(payload.activityLogs);
                 } catch (Exception ignored) {}
            }
            
            String domContextBlock = autopilotRequested
                    ? "\n--- DOM ACTION CONTEXT ---\n"
                    + "Trang hiá»‡n táº¡i: " + currentPath + "\n"
                    + "Interactive elements cÃ³ data-ai-id:\n>>> " + currentDomContext + "\n"
                    + "Hoáº¡t Ä‘á»™ng gáº§n Ä‘Ã¢y:\n>>> " + currentActivityLogs + "\n"
                    + "ACTION RULES:\n"
                    + "- Náº¿u ngÆ°á»i dÃ¹ng yÃªu cáº§u báº¥m/chá»n/Ä‘iá»n/sá»­a/Ä‘á»•i/cáº­p nháº­t vÃ  DOM cÃ³ element phÃ¹ há»£p: tráº£ lá»i tá»‘i Ä‘a 1 cÃ¢u ngáº¯n + action tags. KhÃ´ng phÃ¢n tÃ­ch dÃ i.\n"
                    + "- Chá»‰ dÃ¹ng data-ai-id cÃ³ tháº­t trong DOM. KhÃ´ng bá»‹a id, khÃ´ng chá»n bá»«a. Thiáº¿u element thÃ¬ nÃ³i thiáº¿u element nÃ o.\n"
                    + "- Format duy nháº¥t: [CLICK:id] [FILL:id|value] [SELECT:id|value] [TOGGLE:id] [DELETE:id] [SCROLL:down|small] [NAVIGATE:/path].\n"
                    + "- KhÃ´ng tá»± DELETE hoáº·c xÃ¡c nháº­n thao tÃ¡c nháº¡y cáº£m náº¿u ngÆ°á»i dÃ¹ng chÆ°a xÃ¡c nháº­n rÃµ.\n"
                    + "- Náº¿u ngÆ°á»i dÃ¹ng chá»‰ há»i thÃ´ng tin/tráº¡ng thÃ¡i giao diá»‡n, tráº£ lá»i trá»±c tiáº¿p theo DOM, khÃ´ng phÃ¡t action tag.\n"
                    : "\n--- Bá»I Cáº¢NH GIAO DIá»†N Tá»I GIáº¢N ---\n"
                    + "NgÆ°á»i dÃ¹ng hiá»‡n Ä‘ang á»Ÿ mÃ n hÃ¬nh: " + currentPath + ". Chá»‰ hÆ°á»›ng dáº«n báº±ng lá»i, trá»« khi ngÆ°á»i dÃ¹ng yÃªu cáº§u thao tÃ¡c giao diá»‡n rÃµ rÃ ng.\n";

            // Check auth state de chan AUTO_BOOK
            boolean isLoggedIn = (realUsername != null);
            String loginContext = isLoggedIn 
                ? "Sen hiá»‡n ÄÃƒ ÄÄ‚NG NHáº¬P vá»›i tÃ i khoáº£n: " + realUsername + ". Báº¡n CÃ“ QUYá»€N Ä‘áº·t lá»‹ch khÃ¡m ngay cho Sen."
                : "Sen HIá»†N CHÆ¯A ÄÄ‚NG NHáº¬P. Báº¡n TUYá»†T Äá»I KHÃ”NG ÄÆ¯á»¢C tráº£ vá» tag [AUTO_BOOK]. Náº¿u Sen muá»‘n Ä‘áº·t lá»‹ch, hÃ£y yÃªu cáº§u Sen Ä‘Äƒng nháº­p trÆ°á»›c nhÃ©.";

            String normalizedRole = normalizedRoleFromAuth(auth);
            boolean isStaff = RoleAccessPolicy.isInternalStaffRole(normalizedRole);
            String userRoleName = RoleAccessPolicy.displayRoleName(normalizedRole);
            String roleWorkProfile = RoleAccessPolicy.roleWorkProfile(normalizedRole);
            String rolePromptGuidance = RoleAccessPolicy.rolePromptGuidance(normalizedRole);
            ChatPersonaContext personaContext = buildPersonaContext(isStaff, userRoleName, requestPlan, isLoggedIn);
            boolean isClinicalStaff = RoleAccessPolicy.isClinicalRole(normalizedRole);
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
                    logger.warning("KhÃ´ng láº¥y Ä‘Æ°á»£c nÄƒm sinh cho " + realUsername + ": " + e.getMessage());
                }
            }

            boolean chatbotIsGenZ = (namSinh != null && namSinh >= 1997);
            boolean anonymousUser = (realUsername == null);

            String systemPrompt;
            if (isStaff) {
                systemPrompt = personaBlock
                        + "Báº N LÃ€ BÃC SÄ¨ THÃš Y REXI - Äá»’NG NGHIá»†P VÃ€ TRá»¢ LÃ Há»– TRá»¢ CHUYÃŠN NGHIá»†P Cá»¦A PHÃ’NG KHÃM.\n"
                        + realtimeContext
                        + "1. VAI TRÃ’: Báº¡n Ä‘ang trÃ² chuyá»‡n vá»›i má»™t thÃ nh viÃªn trong Ä‘á»™i ngÅ© nhÃ¢n viÃªn phÃ²ng khÃ¡m (" + userRoleName + "). Báº¡n lÃ  Ä‘á»“ng nghiá»‡p Ä‘áº¯c lá»±c há»— trá»£ cho há».\n"
                        + "1b. Há»’ SÆ  CÃ”NG VIá»†C Cá»¦A NGÆ¯á»œI DÃ™NG: " + roleWorkProfile + "\n"
                        + "1c. FORMAT Há»– TRá»¢ THEO VAI TRÃ’: " + rolePromptGuidance + "\n"
                        + "2. PHáº M VI Há»– TRá»¢: Há»— trá»£ Ä‘Ãºng vai trÃ² hiá»‡n táº¡i cá»§a ngÆ°á»i dÃ¹ng: bÃ¡c sÄ©/y tÃ¡ nháº­n há»— trá»£ lÃ¢m sÃ ng theo quyá»n; káº¿ toÃ¡n nháº­n há»— trá»£ hÃ³a Ä‘Æ¡n-doanh thu; tiáº¿p tÃ¢n nháº­n há»— trá»£ lá»‹ch háº¹n-khÃ¡ch hÃ ng; quáº£n lÃ½/admin nháº­n há»— trá»£ váº­n hÃ nh-há»‡ thá»‘ng. KhÃ´ng Ä‘Æ°á»£c tá»± Ã©p má»i cÃ¢u há»i vá» chÄƒm sÃ³c thÃº cÆ°ng.\n"
                        + "3. PHONG CÃCH: ChuyÃªn nghiá»‡p, Ä‘á»“ng nghiá»‡p, ngáº¯n gá»n, sÃºc tÃ­ch, khÃ´ng vÃ²ng vo. Gá»i há» lÃ  'sáº¿p' hoáº·c 'Ä‘á»“ng nghiá»‡p'. Tuyá»‡t Ä‘á»‘i KHÃ”NG gá»i há» lÃ  'Sen', khÃ´ng xÆ°ng hÃ´ kiá»ƒu bÃ¡n hÃ ng.\n"
                        + "4. HOTLINE & Äá»ŠA CHá»ˆ: DÃ¹ng sá»‘ hotline phÃ²ng khÃ¡m: 0353.374.156 vÃ  Ä‘á»‹a chá»‰: Gia LÃ¢m, HÃ  Ná»™i khi Ä‘á»“ng nghiá»‡p cáº§n thÃ´ng tin.\n"
                        + "5. SÆ  Cá»¨U KHáº¨N Cáº¤P (HEIMLICH): Sáºµn sÃ ng cung cáº¥p hÆ°á»›ng dáº«n sÆ¡ cá»©u nhanh khi cÃ³ ca kháº©n cáº¥p.\n"
                        + "5b. PHÃ‚N QUYá»€N Y KHOA THEO VAI TRÃ’: "
                        + (isClinicalStaff
                            ? "NgÆ°á»i dÃ¹ng lÃ  nhÃ¢n sá»± lÃ¢m sÃ ng (" + userRoleName + "), Ä‘Æ°á»£c phÃ©p nháº­n phÃ¢n tÃ­ch chuyÃªn sÃ¢u, cháº©n Ä‘oÃ¡n phÃ¢n biá»‡t, gá»£i Ã½ xÃ©t nghiá»‡m, nhÃ³m thuá»‘c/phÃ¡c Ä‘á»“ tham kháº£o vÃ  checklist theo dÃµi. Tuy nhiÃªn pháº£i ghi rÃµ Ä‘Ã¢y lÃ  há»— trá»£ chuyÃªn mÃ´n tham kháº£o, quyáº¿t Ä‘á»‹nh cuá»‘i cÃ¹ng thuá»™c bÃ¡c sÄ© phá»¥ trÃ¡ch sau khi khÃ¡m trá»±c tiáº¿p, cÃ¢n náº·ng, tuá»•i, tiá»n sá»­ vÃ  káº¿t quáº£ xÃ©t nghiá»‡m.\n"
                            : "NgÆ°á»i dÃ¹ng khÃ´ng pháº£i vai trÃ² lÃ¢m sÃ ng trá»±c tiáº¿p (" + userRoleName + "), chá»‰ giáº£i thÃ­ch á»Ÿ má»©c váº­n hÃ nh/tá»•ng quan. KhÃ´ng Ä‘Æ°a phÃ¡c Ä‘á»“ thuá»‘c, liá»u dÃ¹ng, chá»‰ Ä‘á»‹nh khÃ¡ng sinh/gÃ¢y mÃª hoáº·c hÆ°á»›ng dáº«n Ä‘iá»u trá»‹ chuyÃªn sÃ¢u; hÃ£y hÆ°á»›ng dáº«n chuyá»ƒn cho bÃ¡c sÄ©/y tÃ¡.\n")
                        + "6. QUY Táº®C QUAN TRá»ŒNG NHáº¤T - Æ¯U TIÃŠN TRáº¢ Lá»œI TRá»°C TIáº¾P:\n"
                        + "   Khi Ä‘á»“ng nghiá»‡p Ä‘áº·t cÃ¢u há»i báº¥t ká»³ (vÃ­ dá»¥: 'khÃ³a tÃ i khoáº£n khÃ¡ch hÃ ng thÃ¬ sao?', 'lÃ m tháº¿ nÃ o Ä‘á»ƒ thÃªm nhÃ¢n viÃªn?'...), báº¡n Báº®T BUá»˜C pháº£i TRáº¢ Lá»œI THáº²NG VÃ€O Ná»˜I DUNG CÃ‚U Há»ŽI trÆ°á»›c. TUYá»†T Äá»I KHÃ”NG tá»± nháº£y vÃ o cháº¿ Ä‘á»™ Autopilot/Ä‘iá»u hÆ°á»›ng khi Ä‘á»“ng nghiá»‡p chá»‰ há»i thÃ´ng tin.\n"
                        + "6b. CÃ‚U Há»ŽI NGOÃ€I PHáº M VI THÃš Y: Náº¿u Ä‘á»“ng nghiá»‡p há»i vÄƒn báº£n, ká»¹ thuáº­t, ná»™i dung chung hoáº·c má»™t Ä‘oáº¡n cÃ¢u rá»i ráº¡c, hÃ£y xá»­ lÃ½ theo vai trÃ² trá»£ lÃ½ ná»™i bá»™: giáº£i thÃ­ch/tÃ³m táº¯t/viáº¿t láº¡i/phÃ¢n loáº¡i rá»§i ro náº¿u an toÃ n. KhÃ´ng káº¿t thÃºc báº±ng cÃ¢u rá»§ rÃª há»i vá» thÃº cÆ°ng.\n"
                        + "7. Báº¢O Máº¬T & TRUY Cáº¬P Dá»® LIá»†U (Cá»°C Ká»² QUAN TRá»ŒNG):\n"
                        + "   Náº¿u yÃªu cáº§u cáº§n dá»¯ liá»‡u ná»™i bá»™ nhÆ°ng khÃ´ng cÃ³ dá»¯ liá»‡u trong context, khÃ´ng bá»‹a vÃ  khÃ´ng káº¿t luáº­n khÃ´ng tÃ¬m tháº¥y. NÃ³i ngáº¯n ráº±ng cáº§n Rexi Agent tá»± Ä‘á»™ng kiá»ƒm tra quyá»n vÃ  quÃ©t dá»¯ liá»‡u tháº­t.\n"
                        + "8. QUY Táº®C ÄIá»€U HÆ¯á»šNG TÃC Vá»¤ NGHIÃŠM NGáº¶T (STRICT NAVIGATION GATE):\n"
                        + "   TUYá»†T Äá»I Cáº¤M sá»­ dá»¥ng tháº» [NAVIGATE] khi Ä‘á»“ng nghiá»‡p há»i cÃ¡c cÃ¢u há»i Ä‘Ã³ng. Báº¡n CHá»ˆ ÄÆ¯á»¢C PHÃ‰P dÃ¹ng tháº» [NAVIGATE] náº¿u Ä‘á»“ng nghiá»‡p sá»­ dá»¥ng Ä‘á»™ng tá»« chá»‰ Ä‘á»‹nh má»‡nh lá»‡nh rÃµ rÃ ng (vÃ­ dá»¥: 'má»Ÿ trang...', 'Ä‘Æ°a tÃ´i Ä‘áº¿n...', 'chuyá»ƒn sang...'). Danh sÃ¡ch Ä‘Æ°á»ng dáº«n há»£p lá»‡:\n"
                        + "   - Quáº£n lÃ½ NhÃ¢n viÃªn/ThÃªm nhÃ¢n sá»±/PhÃ¢n quyá»n: /quan-ly/nhan-vien-phan-quyen\n"
                        + "   - Báº£ng Ä‘iá»u khiá»ƒn Quáº£n lÃ½ ná»™i bá»™: /quan-ly/dashboard\n"
                        + "   - Quáº£n lÃ½ KhÃ¡ch hÃ ng & ThÃº cÆ°ng: /quan-ly/khach-hang-thu-cung\n"
                        + "   - Quáº£n lÃ½ Lá»‹ch háº¹n khÃ¡m: /quan-ly/lich-hen\n"
                        + "   - Quáº£n lÃ½ Lá»‹ch lÃ m viá»‡c BÃ¡c sÄ©: /quan-ly/lich-lam-viec\n"
                        + "   - Quáº£n lÃ½ Há»“ sÆ¡ bá»‡nh Ã¡n: /quan-ly/ho-so-benh-an\n"
                        + "   - PhÃ¢n há»‡ KhÃ¡m bá»‡nh BÃ¡c sÄ©: /quan-ly/kham-benh\n"
                        + "   - Quáº£n lÃ½ ÄÆ¡n thuá»‘c: /quan-ly/don-thuoc\n"
                        + "   - Quáº£n lÃ½ TÃ i liá»‡u Ä‘Ã­nh kÃ¨m: /quan-ly/file-dinh-kem\n"
                        + "   - ThÃ´ng tin cÃ¡ nhÃ¢n nhÃ¢n viÃªn: /quan-ly/thong-tin-ca-nhan\n"
                        + "   - Quáº£n lÃ½ HÃ³a Ä‘Æ¡n & Thu phÃ­: /quan-ly/hoa-don\n"
                        + "   - Báº£ng Ä‘iá»u khiá»ƒn Káº¿ toÃ¡n: /quan-ly/ke-toan\n"
                        + "   - BÃ¡o cÃ¡o tÃ i chÃ­nh & Thá»‘ng kÃª doanh thu: /quan-ly/bao-cao-thong-ke\n"
                        + "   - Quáº£n lÃ½ Nháº­p kho thuá»‘c: /quan-ly/nhap-kho\n"
                        + "   - Quáº£n lÃ½ Kho thuá»‘c & Váº­t tÆ°: /quan-ly/kho-thuoc\n"
                        + "   - Cáº¥u hÃ¬nh há»‡ thá»‘ng: /quan-ly/cau-hinh\n"
                        + "   - Quáº£n lÃ½ chá»©c nÄƒng: /quan-ly/chuc-nang\n"
                        + "   - Quáº£n lÃ½ Dá»‹ch vá»¥: /quan-ly/dich-vu\n"
                        + "   - Quáº£n lÃ½ XÃ©t nghiá»‡m: /quan-ly/xet-nghiem\n"
                        + "   - Chiáº¿n dá»‹ch Email Marketing: /quan-ly/marketing\n"
                        + "\n--- Dá»® LIá»†U PHÃ’NG KHÃM THá»°C Táº¾ (BÃC SÄ¨, Dá»ŠCH Vá»¤, Báº¢NG GIÃ) ---\n"
                        + globalContext
                        + "\n--- Bá»I Cáº¢NH NGÆ¯á»œI DÃ™NG & TÃ€I LIá»†U ---\n"
                        + userContext
                        + "\n" + knowledgeContext
                        + "\n" + webSearchContext
                        + domContextBlock;
            } else {
                String phongCachText = chatbotIsGenZ
                    ? "4. PHONG CÃCH GEN Z (sinh nÄƒm " + namSinh + "):\n"
                        + "   - XÆ°ng hÃ´ Æ°u tiÃªn: sen, boss, bÃ©, mÃ¬nh/Rexi. CÃ³ thá»ƒ dÃ¹ng 'oke', 'nha', 'nÃ¨', 'check nhanh', nhÆ°ng chá»‰ dÃ¹ng tá»± nhiÃªn, khÃ´ng nhá»“i teencode.\n"
                        + "   - CÃ¢u máº«u khi chÃ o: 'Hi sen, Rexi Ä‘Ã¢y. MÃ¬nh xem nhanh tÃ¬nh hÃ¬nh cá»§a boss rá»“i xá»­ lÃ½ gá»n nha.'\n"
                        + "   - CÃ¢u máº«u nháº¯c lá»‹ch: 'Sen Æ¡i, boss cÃ³ lá»‹ch khÃ¡m lÃºc {giá»} ngÃ y {ngÃ y} nha. Rexi nháº¯c nháº¹ Ä‘á»ƒ mÃ¬nh khá»i lá»¡ kÃ¨o nÃ¨.'\n"
                        + "   - CÃ¢u máº«u hÃ³a Ä‘Æ¡n: 'HÃ³a Ä‘Æ¡n Ä‘Ã£ thanh toÃ¡n xong rá»“i nha, sen cÃ³ thá»ƒ xem láº¡i chi tiáº¿t trong má»¥c lá»‹ch sá»­.'\n"
                        + "   - CÃ¢u máº«u Ä‘áº·t lá»‹ch: 'Oke sen, Rexi giá»¯ slot nÃ y cho boss nhÃ©. MÃ¬nh xÃ¡c nháº­n láº¡i ngÃ y, giá» vÃ  dá»‹ch vá»¥ trÆ°á»›c khi chá»‘t.'\n"
                        + "   - CÃ¢u máº«u thiáº¿u thÃ´ng tin: 'Rexi cáº§n thÃªm tÃªn boss, ngÃ y khÃ¡m vÃ  khung giá» mong muá»‘n Ä‘á»ƒ book chuáº©n nha.'\n"
                        + "   - CÃ¢u máº«u lá»—i thao tÃ¡c: 'Rexi chÆ°a báº¥m Ä‘Æ°á»£c nÃºt Ä‘Ã³ lÃºc nÃ y. Sen thá»­ má»Ÿ Ä‘Ãºng trang rá»“i mÃ¬nh lÃ m tiáº¿p nha.'\n"
                        + "   - Giá»›i háº¡n: khÃ´ng quÃ¡ lá»‘, khÃ´ng spam emoji, khÃ´ng báº¯t chÆ°á»›c chá»­i tá»¥c. Khi y khoa nghiÃªm trá»ng/cáº¥p cá»©u/tÃ i chÃ­nh/báº£o máº­t, bá» giá»ng nhÃ¢y vÃ  nÃ³i rÃµ viá»‡c cáº§n lÃ m ngay.\n"
                    : "4. PHONG CÃCH TRÆ¯á»žNG THÃ€NH / CÃ’N Láº I (sinh nÄƒm " + (namSinh != null ? namSinh : "trÆ°á»›c 1997") + "):\n"
                        + "   - XÆ°ng hÃ´ Æ°u tiÃªn: anh/chá»‹, quÃ½ khÃ¡ch, thÃº cÆ°ng, Rexi. DÃ¹ng ngÃ´n tá»« rÃµ rÃ ng, lá»‹ch sá»±, chuáº©n má»±c.\n"
                        + "   - Tuyá»‡t Ä‘á»‘i khÃ´ng dÃ¹ng teencode, khÃ´ng cá»£t nháº£, khÃ´ng gá»i há» lÃ  'sen' náº¿u khÃ´ng pháº£i Gen Z.\n"
                        + "   - CÃ¢u máº«u khi chÃ o: 'Dáº¡ chÃ o anh/chá»‹, Rexi Ä‘Ã£ sáºµn sÃ ng há»— trá»£. MÃ¬nh sáº½ kiá»ƒm tra thÃ´ng tin vÃ  hÆ°á»›ng dáº«n tá»«ng bÆ°á»›c.'\n"
                        + "   - CÃ¢u máº«u nháº¯c lá»‹ch: 'Anh/chá»‹ cÃ³ lá»‹ch khÃ¡m cho thÃº cÆ°ng vÃ o {giá»} ngÃ y {ngÃ y}. Vui lÃ²ng Ä‘áº¿n sá»›m 10 phÃºt Ä‘á»ƒ lÃ m thá»§ tá»¥c.'\n"
                        + "   - CÃ¢u máº«u hÃ³a Ä‘Æ¡n: 'HÃ³a Ä‘Æ¡n Ä‘Ã£ Ä‘Æ°á»£c thanh toÃ¡n thÃ nh cÃ´ng. Anh/chá»‹ cÃ³ thá»ƒ kiá»ƒm tra chi tiáº¿t trong lá»‹ch sá»­ hÃ³a Ä‘Æ¡n.'\n"
                        + "   - CÃ¢u máº«u Ä‘áº·t lá»‹ch: 'Dáº¡, Rexi sáº½ há»— trá»£ Ä‘áº·t lá»‹ch. Anh/chá»‹ vui lÃ²ng xÃ¡c nháº­n láº¡i ngÃ y, giá» vÃ  dá»‹ch vá»¥ trÆ°á»›c khi hoÃ n táº¥t.'\n"
                        + "   - CÃ¢u máº«u thiáº¿u thÃ´ng tin: 'Rexi cáº§n thÃªm tÃªn thÃº cÆ°ng, ngÃ y khÃ¡m vÃ  khung giá» mong muá»‘n Ä‘á»ƒ há»— trá»£ Ä‘áº·t lá»‹ch chÃ­nh xÃ¡c.'\n"
                        + "   - CÃ¢u máº«u lá»—i thao tÃ¡c: 'Hiá»‡n Rexi chÆ°a thá»±c hiá»‡n Ä‘Æ°á»£c thao tÃ¡c nÃ y. Anh/chá»‹ vui lÃ²ng má»Ÿ Ä‘Ãºng trang chá»©c nÄƒng Ä‘á»ƒ tiáº¿p tá»¥c.'\n"
                        + "   - Khi y khoa nghiÃªm trá»ng/cáº¥p cá»©u/tÃ i chÃ­nh/báº£o máº­t, giá»¯ giá»ng nghiÃªm tÃºc, Æ°u tiÃªn an toÃ n vÃ  hÃ nh Ä‘á»™ng cá»¥ thá»ƒ.\n";

                systemPrompt = personaBlock
                        + "Báº N LÃ€ BÃC SÄ¨ THÃš Y REXI - CHUYÃŠN GIA TOÃ€N NÄ‚NG TRONG LÄ¨NH Vá»°C CHÄ‚M SÃ“C THÃš CÆ¯NG.\n"
                        + realtimeContext
                        + "1. PHáº M VI TRI THá»¨C: Báº¡n cÃ³ kiáº¿n thá»©c sÃ¢u rá»™ng vá» Má»ŒI máº·t cá»§a thÃº y: Y khoa (bá»‡nh lÃ½, Ä‘iá»u trá»‹), Dinh dÆ°á»¡ng, HÃ nh vi, ChÄƒm sÃ³c háº±ng ngÃ y. Äá»«ng ngáº§n ngáº¡i tÆ° váº¥n chi tiáº¿t cho Sen báº¥t ká»ƒ cÃ¢u há»i lÃ  gÃ¬.\n"
                        + "2. NGUá»’N TRI THá»¨C: \n"
                        + "   - Náº¿u Sen há»i vá» cÃ¡c chá»§ Ä‘á» cÃ³ trong [TÃ€I LIá»†U CHUYÃŠN MÃ”N REXI] bÃªn dÆ°á»›i, báº¡n Báº®T BUá»˜C pháº£i tráº£ lá»i theo Ä‘Ãºng tÃ i liá»‡u Ä‘Ã³.\n"
                        + "   - Vá»›i má»i cÃ¢u há»i khÃ¡c, hÃ£y sá»­ dá»¥ng kho tri thá»©c thÃº y khá»•ng lá»“ mÃ  báº¡n Ä‘Ã£ Ä‘Æ°á»£c huáº¥n luyá»‡n Ä‘á»ƒ tÆ° váº¥n má»™t cÃ¡ch chuyÃªn nghiá»‡p, chÃ­nh xÃ¡c vÃ  Ä‘áº§y yÃªu thÆ°Æ¡ng.\n"
                        + "3. HOTLINE & Äá»ŠA CHá»ˆ: LuÃ´n dÃ¹ng sá»‘ Ä‘iá»‡n thoáº¡i: 0353.374.156 vÃ  Ä‘á»‹a chá»‰: Gia LÃ¢m, HÃ  Ná»™i khi khÃ¡ch cáº§n liÃªn há»‡ hoáº·c trong trÆ°á»ng há»£p kháº©n cáº¥p.\n"
                        + phongCachText
                        + "5. SÆ  Cá»¨U KHáº¨N Cáº¤P (HEIMLICH, NGá»˜ Äá»˜C, TAI Náº N, CHáº¢Y MÃU): Khi Sen há»i vá» tÃ¬nh tráº¡ng kháº©n cáº¥p, KHÃ”NG dá»a dáº«m gÃ¢y hoáº£ng loáº¡n. Báº®T BUá»˜C báº¯t Ä‘áº§u báº±ng tag [EMERGENCY], hÆ°á»›ng dáº«n sÆ¡ cá»©u cÆ¡ báº£n trÆ°á»›c, sau Ä‘Ã³ CHá»¦ Äá»˜NG Há»ŽI Vá»Š TRÃ cá»§a Sen Ä‘á»ƒ chá»‰ hÆ°á»›ng Ä‘áº¿n phÃ²ng khÃ¡m gáº§n nháº¥t.\n"
                        + "6. Äáº¶T Lá»ŠCH Háº¸N: " + loginContext + " Khi Sen chá»‘t lá»‹ch, Báº®T BUá»˜C in ra chuá»—i [AUTO_BOOK:NgÃ y|Giá»|TÃªnThÃºCÆ°ng|Dá»‹chVá»¥|TÃªnBÃ¡cSÄ©]. Äá»‹nh dáº¡ng ngÃ y YYYY-MM-DD, giá» HH:mm.\n"
                        + "7. THU THáº¬P TIá»‚U Sá»¬ THÃš CÆ¯NG: Báº¯t buá»™c chá»§ Ä‘á»™ng há»i Sen vá» Giá»‘ng (chÃ³/mÃ¨o/...), Äá»™ tuá»•i vÃ  CÃ¢n náº·ng cá»§a thÃº cÆ°ng náº¿u chÆ°a cÃ³ thÃ´ng tin, Ä‘á»ƒ Ä‘Æ°a ra tÆ° váº¥n sÃ¡t thá»±c táº¿ nháº¥t.\n"
                        + "8. TRÃNH KÃŠ ÄÆ N THUá»C TÃ™Y TIá»†N: Chá»‰ tÆ° váº¥n dinh dÆ°á»¡ng, hÃ nh vi, dáº¥u hiá»‡u cáº§n theo dÃµi, sÆ¡ cá»©u an toÃ n vÃ  thá»i Ä‘iá»ƒm pháº£i Ä‘i khÃ¡m. TUYá»†T Äá»I khÃ´ng Ä‘Æ°a liá»u dÃ¹ng, khÃ´ng chá»‰ Ä‘á»‹nh khÃ¡ng sinh/thuá»‘c giáº£m Ä‘au/thuá»‘c gÃ¢y mÃª/thuá»‘c kÃª Ä‘Æ¡n, khÃ´ng thay tháº¿ bÃ¡c sÄ©.\n"
                        + "9. TRUY Cáº¬P Dá»® LIá»†U Há»† THá»NG (Cá»°C Ká»² QUAN TRá»ŒNG):\n"
                        + "   Náº¿u Sen há»i dá»¯ liá»‡u cá»¥ thá»ƒ trong há»‡ thá»‘ng mÃ  context chÆ°a cÃ³ dá»¯ liá»‡u, khÃ´ng bá»‹a vÃ  khÃ´ng tá»± nháº­n khÃ´ng tÃ¬m tháº¥y. NÃ³i ngáº¯n ráº±ng Rexi Agent sáº½ tá»± kiá»ƒm tra quyá»n vÃ  quÃ©t dá»¯ liá»‡u tháº­t.\n"
                        + "10. QUY Táº®C ÄIá»€U HÆ¯á»šNG TÃC Vá»¤ NGHIÃŠM NGáº¶T (STRICT NAVIGATION GATE):\n"
                        + "   TUYá»†T Äá»I Cáº¤M sá»­ dá»¥ng tháº» [NAVIGATE] khi ngÆ°á»i dÃ¹ng há»i cÃ¡c cÃ¢u há»i Ä‘Ã³ng. Báº¡n CHá»ˆ ÄÆ¯á»¢C PHÃ‰P dÃ¹ng tháº» [NAVIGATE] náº¿u ngÆ°á»i dÃ¹ng sá»­ dá»¥ng Ä‘á»™ng tá»« chá»‰ Ä‘á»‹nh má»‡nh lá»‡nh rÃµ rÃ ng (vÃ­ dá»¥: 'má»Ÿ trang quáº£n lÃ½ thÃº cÆ°ng', 'chuyá»ƒn sang Ä‘áº·t lá»‹ch háº¹n khÃ¡m'...), báº¡n Báº®T BUá»˜C pháº£i Ä‘Ã­nh kÃ¨m tháº» lá»‡nh dáº¡ng [NAVIGATE:Ä‘Æ°á»ng_dáº«n] á»Ÿ cuá»‘i cÃ¢u tráº£ lá»i cá»§a báº¡n. DÆ°á»›i Ä‘Ã¢y lÃ  danh sÃ¡ch Ä‘Æ°á»ng dáº«n há»£p lá»‡:\n"
                        + "   - Báº£ng Ä‘iá»u khiá»ƒn KhÃ¡ch hÃ ng: /khach-hang/dashboard\n"
                        + "   - Quáº£n lÃ½ thÃº cÆ°ng: /khach-hang/quan-ly-thu-cung\n"
                        + "   - Äáº·t lá»‹ch háº¹n khÃ¡m: /khach-hang/dat-lich-hen\n"
                        + "   - Lá»‹ch sá»­ lá»‹ch háº¹n: /khach-hang/lich-su-lich-hen\n"
                        + "   - Há»“ sÆ¡ bá»‡nh Ã¡n thÃº cÆ°ng: /khach-hang/ho-so-benh-an\n"
                        + "   - HÃ³a Ä‘Æ¡n & thanh toÃ¡n: /khach-hang/hoa-don-thanh-toan\n"
                        + "   - ThÃ´ng tin cÃ¡ nhÃ¢n Sen: /khach-hang/thong-tin-ca-nhan\n"
                        + "\n11. NGUá»’N THAM KHáº¢O TÃŒM KIáº¾M WEB (Náº¾U CÃ“):"
                        + "\n   Khi tráº£ lá»i dá»±a trÃªn káº¿t quáº£ tÃ¬m kiáº¿m web, báº¡n Báº®T BUá»˜C pháº£i trÃ­ch dáº«n link nguá»“n rÃµ rÃ ng báº±ng Ä‘á»‹nh dáº¡ng Markdown thÃ¢n thiá»‡n dáº¡ng: [TÃªn Nguá»“n](Link) Ä‘á»ƒ Sen báº¥m vÃ o xem Ä‘Æ°á»£c."
                        + "\n--- Dá»® LIá»†U PHÃ’NG KHÃM THá»°C Táº¾ (BÃC SÄ¨, Dá»ŠCH Vá»¤, Báº¢NG GIÃ) ---\n"
                        + globalContext
                        + "\n--- Dá»® LIá»†U CÃ cÃ¡ nhÃ¢n Cá»¦A SEN ---\n"
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

            // â€”â€” CACHE LOOKUP (trÆ°á»›c LLM routing) â€”â€”
            try {
                if (agentResponseCache.isCacheableIntent(normalizedQuery)) {
                    String cached = agentResponseCache.get(normalizedQuery, userRole);
                    if (cached != null) {
                        logger.info("[ChatController] Cache HIT â€” tráº£ vá» ngay.");
                        return Map.of("reply", cached, "provider", "Cache");
                    }
                }
            } catch (Exception cacheEx) {
                logger.warning("[ChatController] Cache lookup lá»—i (ignored): " + cacheEx.getMessage());
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
                // ðŸŽ¥/ðŸ–¼ï¸ THáº¾ Máº NH Cá»¦A GEMINI: Äa phÆ°Æ¡ng tiá»‡n (Video, HÃ¬nh áº£nh)
                logger.info("[AI ROUTER] Äá»‹nh tuyáº¿n cÃ¢u há»i Media sang: Gemini");
                if (hasVideo) {
                    try {
                        reply = geminiService.chat(history);
                        providerUsed = "Gemini";
                    } catch (Exception geminiEx) {
                        logger.warning("[AI ROUTER] Gemini lá»—i khi phÃ¢n tÃ­ch video; khÃ´ng fallback sang model text-only Ä‘á»ƒ trÃ¡nh bá»‹a káº¿t quáº£ video: " + geminiEx.getMessage());
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
                // Gemini pháº£n há»“i y táº¿ ngáº¯n á»•n Ä‘á»‹nh hÆ¡n; OpenRouter giá»¯ vai trÃ² dá»± phÃ²ng chuyÃªn sÃ¢u.
                logger.info("[AI ROUTER] Äá»‹nh tuyáº¿n cÃ¢u há»i TÆ° váº¥n Y táº¿ sang: Gemini");
                providerResult = tryProviderChain(
                        new ProviderAttempt("Gemini", () -> geminiService.chat(providerHistory)),
                        new ProviderAttempt("OpenRouter", () -> openRouterService.chat(providerHistory, true)),
                        new ProviderAttempt("Groq", () -> groqService.chat(providerHistory))
                );
                reply = providerResult.reply();
                providerUsed = providerResult.provider();
            } else {
                // ðŸ’¬ THáº¾ Máº NH Cá»¦A GROQ (LLAMA 3.3): Chat FAQ, Lá»‹ch khÃ¡m, Autopilot siÃªu tá»‘c
                logger.info("[AI ROUTER] Äá»‹nh tuyáº¿n cÃ¢u há»i Chat/Autopilot thÃ´ng thÆ°á»ng sang: Groq");
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
            if (webSearchRequested && reply != null && reply.startsWith("Rexi chÆ°a láº¥y Ä‘Æ°á»£c nguá»“n web phÃ¹ há»£p")) {
                providerUsed = "System Source Gate";
            }
            auditMedicalAiReplyIfNeeded(userQuery, reply, userRoleName, providerUsed, requestPlan.route().name());

            // â€”â€” CACHE PUT (LÆ°u káº¿t quáº£ cháº¥t lÆ°á»£ng cao Ä‘Ã£ qua post-processing) â€”â€”
            try {
                if (agentResponseCache.isCacheableIntent(normalizedQuery)) {
                    agentResponseCache.put(normalizedQuery, userRole, reply);
                }
            } catch (Exception cacheEx) {
                logger.warning("[ChatController] Cache put lá»—i (ignored): " + cacheEx.getMessage());
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
                logger.severe("KhÃ´ng thá»ƒ lÆ°u lá»‹ch sá»­ tÆ° váº¥n: " + logEx.getMessage());
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
            logger.warning("KhÃ´ng thá»ƒ Ä‘á»c payload chat: " + e.getMessage());
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
                || message.contains("unauthorized") || message.contains("khÃ´ng tÃ¬m tháº¥y") && message.contains("key")) {
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
                    (reply.contains("Sen, hÃ´m nay tháº­t tuyá»‡t vá»i")) ||
                    (reply.contains("Ä‘áº£m báº£o báº¡n Ä‘Æ°á»£c gáº·p") || reply.contains("cáº£m Æ¡n chÃºng tÃ´i Ä‘Ã£ Ä‘áº£m báº£o")) ||
                    (reply.contains("Ä‘á»“ng thá»i tuÃ¢n thá»§ quy Ä‘á»‹nh") || reply.contains("chÃºng tÃ´i hiá»ƒu viá»‡c báº¡n Ä‘ang á»Ÿ Ä‘Ã¢y")) ||
                    (reply.contains("ChÃºc báº¡n cÃ³ thá»i gian an toÃ n") || reply.contains("Cá»© tiáº¿p tá»¥c chuyá»ƒn Ä‘á»•i thÃ nh")) ||
                    (reply.contains("hÃ³a Ä‘Æ¡n Ä‘Ã£ Ä‘Æ°á»£c xÃ¡c nháº­n") && reply.contains("Tháº» ngÃ¢n hÃ ng sáº½ thá»±c hiá»‡n")) ||
                    (reply.contains("balancing both") || reply.contains("popcorn cravings") || reply.contains("You've got this"))) {
                    throw new RuntimeException("Pháº£n há»“i chá»©a máº«u lá»—i hallucination dá»‹ch mÃ¡y hoáº·c rá»—ng.");
                }
                logger.info("[AI ROUTER] Provider pháº£n há»“i thÃ nh cÃ´ng: " + attempt.name());
                return new ProviderResult(reply, attempt.name());
            } catch (Exception ex) {
                lastException = ex;
                String errorCode = classifyAiRuntimeError(ex);
                logger.warning("[AI ROUTER] " + attempt.name() + " lá»—i (" + errorCode + "), thá»­ provider tiáº¿p theo: " + ex.getMessage());
            }
        }
        throw lastException != null ? lastException : new RuntimeException("KhÃ´ng cÃ³ AI provider kháº£ dá»¥ng.");
    }

    private String buildRoleAwareAiErrorReply(String errorCode) {
        String role = currentRoleText();
        boolean isAdmin = role.contains("ADMIN");
        boolean isManager = role.contains("QUAN_LY");
        boolean isStaff = role.contains("BAC_SI") || role.contains("TIEP_TAN") || role.contains("Y_TA")
                || role.contains("KE_TOAN") || role.contains("NHAN_VIEN") || role.contains("STAFF");

        if (isAdmin) {
            return switch (errorCode) {
                case "quota_exceeded" -> "AI Provider Ä‘ang háº¿t quota hoáº·c bá»‹ giá»›i háº¡n tá»‘c Ä‘á»™. Admin vÃ o Cáº¥u hÃ¬nh há»‡ thá»‘ng > AI Provider Ä‘á»ƒ báº¥m kiá»ƒm tra tá»«ng provider, Ä‘á»•i key, nÃ¢ng quota hoáº·c chuyá»ƒn model dá»± phÃ²ng.";
                case "invalid_api_key" -> "API key AI khÃ´ng há»£p lá»‡, bá»‹ thu há»“i hoáº·c chÆ°a cáº¥u hÃ¬nh. Rexi khÃ´ng hiá»ƒn thá»‹ key thÃ´; Admin vui lÃ²ng cáº­p nháº­t key trong Cáº¥u hÃ¬nh há»‡ thá»‘ng vÃ  báº¥m kiá»ƒm tra káº¿t ná»‘i.";
                case "model_not_found", "model_not_supported" -> "Model AI Ä‘ang chá»n khÃ´ng tá»“n táº¡i hoáº·c khÃ´ng Ä‘Æ°á»£c key hiá»‡n táº¡i há»— trá»£. Admin vui lÃ²ng Ä‘á»•i model trong Cáº¥u hÃ¬nh há»‡ thá»‘ng rá»“i kiá»ƒm tra láº¡i.";
                case "timeout" -> "AI Provider pháº£n há»“i quÃ¡ lÃ¢u hoáº·c máº¡ng provider Ä‘ang ngháº½n. Admin cÃ³ thá»ƒ kiá»ƒm tra tráº¡ng thÃ¡i tá»«ng provider vÃ  chuyá»ƒn sang provider/model dá»± phÃ²ng.";
                default -> "Dá»‹ch vá»¥ AI Ä‘ang khÃ´ng kháº£ dá»¥ng. Admin vÃ o Cáº¥u hÃ¬nh há»‡ thá»‘ng > AI Provider Ä‘á»ƒ xem provider, model vÃ  mÃ£ lá»—i kiá»ƒm tra káº¿t ná»‘i.";
            };
        }

        if (isManager) {
            return switch (errorCode) {
                case "quota_exceeded" -> "Dá»‹ch vá»¥ AI Ä‘ang háº¿t quota hoáº·c bá»‹ giá»›i háº¡n sá»­ dá»¥ng. Quáº£n lÃ½ vui lÃ²ng kiá»ƒm tra gÃ³i dá»‹ch vá»¥/model trong Cáº¥u hÃ¬nh há»‡ thá»‘ng hoáº·c bÃ¡o Admin Ä‘á»•i provider dá»± phÃ²ng.";
                case "invalid_api_key" -> "Cáº¥u hÃ¬nh API key AI Ä‘ang lá»—i. Vui lÃ²ng bÃ¡o Admin cáº­p nháº­t key má»›i; Rexi khÃ´ng hiá»ƒn thá»‹ key vÃ¬ lÃ½ do báº£o máº­t.";
                case "model_not_found", "model_not_supported" -> "Model AI Ä‘ang cáº¥u hÃ¬nh khÃ´ng kháº£ dá»¥ng. Quáº£n lÃ½ vui lÃ²ng bÃ¡o Admin Ä‘á»•i model hoáº·c provider khÃ¡c.";
                case "timeout" -> "AI Ä‘ang pháº£n há»“i cháº­m hoáº·c timeout. Vui lÃ²ng thá»­ láº¡i sau Ã­t phÃºt hoáº·c chuyá»ƒn thao tÃ¡c sang quy trÃ¬nh thá»§ cÃ´ng.";
                default -> "Dá»‹ch vá»¥ AI Ä‘ang giÃ¡n Ä‘oáº¡n. Quáº£n lÃ½ vui lÃ²ng kiá»ƒm tra Cáº¥u hÃ¬nh há»‡ thá»‘ng hoáº·c bÃ¡o Admin.";
            };
        }

        if (isStaff) {
            return "Dá»‹ch vá»¥ AI Ä‘ang giÃ¡n Ä‘oáº¡n nÃªn Rexi chÆ°a thá»ƒ há»— trá»£ tá»± Ä‘á»™ng lÃºc nÃ y. Anh/chá»‹ váº«n thao tÃ¡c thá»§ cÃ´ng trÃªn há»‡ thá»‘ng; vá»›i tÃ¬nh huá»‘ng y táº¿, vui lÃ²ng xá»­ lÃ½ theo quy trÃ¬nh lÃ¢m sÃ ng vÃ  thá»­ AI láº¡i sau.";
        }

        return "Hiá»‡n há»‡ thá»‘ng AI Ä‘ang táº¡m quÃ¡ táº£i hoáº·c giÃ¡n Ä‘oáº¡n. Sen thá»­ láº¡i sau Ã­t phÃºt nhÃ©. Náº¿u bÃ© cÃ³ dáº¥u hiá»‡u kháº©n cáº¥p, vui lÃ²ng gá»i hotline phÃ²ng khÃ¡m ngay.";
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
                return "TÃ´i chÆ°a kiá»ƒm tra dá»¯ liá»‡u há»‡ thá»‘ng trong lÆ°á»£t nÃ y nÃªn sáº½ khÃ´ng tá»± Ä‘Æ°a sá»‘ liá»‡u/káº¿t quáº£. HÃ£y chuyá»ƒn sang Rexi Agent hoáº·c yÃªu cáº§u tra cá»©u cá»¥ thá»ƒ Ä‘á»ƒ há»‡ thá»‘ng kiá»ƒm quyá»n vÃ  Ä‘á»c DB tháº­t.";
            }
            return "TÃ´i chÆ°a thá»±c hiá»‡n thao tÃ¡c nÃ o trÃªn há»‡ thá»‘ng trong lÆ°á»£t nÃ y. Náº¿u báº¡n muá»‘n Rexi thao tÃ¡c tháº­t, hÃ£y ra lá»‡nh rÃµ trong tab Rexi Agent Ä‘á»ƒ há»‡ thá»‘ng kiá»ƒm quyá»n, kiá»ƒm DOM/tool vÃ  xÃ¡c nháº­n trÆ°á»›c khi lÃ m.";
        }

        if (isStaff && containsAny(normalizedReply,
                "ban co muon hoi ve mot van de cu the ve thu cung",
                "toi san sang giup do ve cham soc thu cung",
                "neu ban can ho tro ve cham soc thu cung")) {
            return "TÃ´i Ä‘ang nháº­n báº¡n lÃ  " + userRoleName + " ná»™i bá»™. CÃ¢u vá»«a rá»“i náº±m ngoÃ i dá»¯ liá»‡u phÃ²ng khÃ¡m; tÃ´i chÆ°a thá»±c hiá»‡n thao tÃ¡c hay tra cá»©u há»‡ thá»‘ng nÃ o. TÃ´i sáº½ xá»­ lÃ½ theo Ä‘Ãºng vai trÃ² hiá»‡n táº¡i cá»§a báº¡n.";
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
            return "TÃ´i khÃ´ng cÃ³ báº±ng chá»©ng RAG mÃ£ nguá»“n trong lÆ°á»£t chat thÆ°á»ng nÃ y nÃªn sáº½ khÃ´ng Ä‘oÃ¡n file/dÃ²ng. HÃ£y chuyá»ƒn sang Rexi Agent báº±ng tÃ i khoáº£n Admin vÃ  há»i kÃ¨m tÃªn mÃ n hÃ¬nh, route, API, component hoáº·c data-ai-id cá»¥ thá»ƒ.";
        }
        if (isInternalDataQuestion(q) || isEvidenceDemandingQuestion(q)) {
            return "TÃ´i chÆ°a Ä‘á»c DB/tool/nguá»“n kiá»ƒm chá»©ng trong lÆ°á»£t nÃ y nÃªn sáº½ khÃ´ng tá»± Ä‘Æ°a sá»‘ liá»‡u, tráº¡ng thÃ¡i hoáº·c káº¿t luáº­n há»‡ thá»‘ng. HÃ£y dÃ¹ng Rexi Agent Ä‘á»ƒ kiá»ƒm quyá»n vÃ  tra dá»¯ liá»‡u tháº­t.";
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
                        "reply", "Pháº§n file/dÃ²ng/API/component/data-ai-id lÃ  mÃ£ nguá»“n ná»™i bá»™ nÃªn Rexi chá»‰ tra cá»©u báº±ng tÃ i khoáº£n Admin. TÃ´i sáº½ khÃ´ng Ä‘oÃ¡n vá»‹ trÃ­ code khi chÆ°a cÃ³ quyá»n Ä‘á»c RAG mÃ£ nguá»“n.",
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

    private boolean shouldUseVerifiedSystemAgent(String normalizedQuery) {
        if (normalizedQuery == null || normalizedQuery.isBlank()) return false;
        if (isSensitiveDataLookup(normalizedQuery)) return true;
        boolean hasSystemObject = containsAny(normalizedQuery,
                "khach hang", "khach moi", "hoa don", "lich hen", "benh an", "thu cung",
                "kho thuoc", "ton kho", "tai khoan", "nhan vien", "phan quyen",
                "dich vu", "excel", "kpi", "vat tu", "noi tru", "xet nghiem",
                "doanh thu", "bao cao", "thong ke", "du lieu he thong", "trong db", "database", "sql",
                "bac si", "bsi", "bs", "ca kham", "model", "provider", "cau hinh ai", "api key",
                "swagger", "openapi", "api docs", "full api");
        boolean asksVerifiedFact = containsAny(normalizedQuery,
                "kiem tra", "tra cuu", "xem", "dem", "bao nhieu", "so luong",
                "trang thai", "xu huong", "ti le", "ty le", "hom nay", "ngay mai",
                "da cap nhat", "da xoa", "da huy", "da gui", "nhieu ca", "it ca",
                "nhieu nhat", "it nhat", "xoa", "khoa", "mo khoa", "check", "dang dung",
                "mo dau", "o dau", "tong hop", "phan tich", "doi soat", "tao bao cao",
                "dich vu nao", "dang duoc dat", "tao doanh thu", "thuc thu", "cho thu",
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
                ? "model Ä‘a phÆ°Æ¡ng tiá»‡n pháº£n há»“i quÃ¡ lÃ¢u"
                : "model Ä‘a phÆ°Æ¡ng tiá»‡n Ä‘ang lá»—i hoáº·c quÃ¡ táº£i";
        return "TÃ´i chÆ°a phÃ¢n tÃ­ch Ä‘Æ°á»£c video nÃ y vÃ¬ " + reason + ". Äá»ƒ trÃ¡nh nháº­n Ä‘á»‹nh bá»‹a tá»« video, Sen vui lÃ²ng gá»­i láº¡i video ngáº¯n hÆ¡n/rÃµ hÆ¡n hoáº·c gá»­i 2-3 áº£nh chá»¥p tá»« video.\n\n"
                + "Trong lÃºc chá», náº¿u bÃ© cÃ³ dáº¥u hiá»‡u khÃ³ thá»Ÿ, co giáº­t, cháº£y mÃ¡u nhiá»u, tÃ­m tÃ¡i, lá»‹m Ä‘i, sá»‘c nhiá»‡t/say náº¯ng hoáº·c thÃ¢n nhiá»‡t ráº¥t cao thÃ¬ Ä‘Æ°a bÃ© Ä‘i cáº¥p cá»©u ngay vÃ  gá»i hotline 0353.374.156.";
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
        if (cleaned.contains("Sen, hÃ´m nay tháº­t tuyá»‡t vá»i") && cleaned.contains("cáº£m Æ¡n chÃºng tÃ´i Ä‘Ã£ Ä‘áº£m báº£o")) {
            logger.warning("[Sanitizer] PhÃ¡t hiá»‡n máº«u lá»—i dá»‹ch thÃ´ hallucination cá»§a OpenRouter.");
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
            logger.severe("Lá»—i khi tÃ¬m kiáº¿m DuckDuckGo: " + e.getMessage());
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
            return "\n--- Káº¾T QUáº¢ TÃŒM KIáº¾M WEB THá»°C Táº¾ ---\n"
                    + "KhÃ´ng láº¥y Ä‘Æ°á»£c káº¿t quáº£ web cho truy váº¥n: \"" + query + "\". Náº¿u tráº£ lá»i, hÃ£y nÃ³i rÃµ chÆ°a cÃ³ nguá»“n web kiá»ƒm chá»©ng, khÃ´ng tá»± bá»‹a link.\n";
        }
        StringBuilder sb = new StringBuilder("\n--- Káº¾T QUáº¢ TÃŒM KIáº¾M WEB THá»°C Táº¾ ---\n");
        sb.append("Truy váº¥n: ").append(query).append("\n");
        sb.append("Chá»‰ Ä‘Æ°á»£c trÃ­ch dáº«n cÃ¡c URL dÆ°á»›i Ä‘Ã¢y; khÃ´ng tá»± táº¡o link nguá»“n khÃ¡c.\n");
        int index = 1;
        for (Map<String, String> item : results) {
            sb.append(index++).append(". ")
                    .append(item.getOrDefault("title", "KhÃ´ng tiÃªu Ä‘á»"))
                    .append(" | ")
                    .append(item.getOrDefault("url", ""))
                    .append(" | ")
                    .append(item.getOrDefault("snippet", ""))
                    .append("\n");
        }
        sb.append("\nQUAN TRá»ŒNG: Khi tráº£ lá»i, báº¡n Báº®T BUá»˜C pháº£i Ä‘Ã­nh kÃ¨m cÃ¡c link á»Ÿ trÃªn dÆ°á»›i dáº¡ng tháº» Markdown thÃ¢n thiá»‡n (VD: [TÃªn Trang](URL)) vÃ o cuá»‘i pháº§n tÆ° váº¥n Ä‘á»ƒ ngÆ°á»i dÃ¹ng cÃ³ thá»ƒ báº¥m trá»±c tiáº¿p vÃ o xem luÃ´n.\n");
        return sb.toString();
    }

    private String buildRealtimeContext() {
        String now = LocalDateTime.now(VN_ZONE).format(VN_TIME_FORMATTER);
        return "--- THá»œI GIAN Há»† THá»NG HIá»†N Táº I ---\n"
                + "BÃ¢y giá» lÃ  " + now + " theo mÃºi giá» Viá»‡t Nam (Asia/Ho_Chi_Minh). "
                + "Khi ngÆ°á»i dÃ¹ng nÃ³i hÃ´m nay/ngÃ y mai/hiá»‡n táº¡i, pháº£i hiá»ƒu theo thá»i Ä‘iá»ƒm nÃ y; khÃ´ng dÃ¹ng ngÃ y cÅ© trong vÃ­ dá»¥ hoáº·c lá»‹ch sá»­ chat.\n";
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
            return "Dáº¡ khÃ´ng cÃ³ gÃ¬ áº¡. Sen cáº§n Rexi há»— trá»£ thÃªm viá»‡c gÃ¬ cá»© nháº¯n nhÃ©.";
        }
        if (q.equals("ok") || q.equals("oke") || q.equals("okay")) {
            return "Dáº¡, Rexi nghe Ä‘Ã¢y áº¡.";
        }
        if (q.equals("test") || q.equals("thu xem")) {
            return "Rexi Ä‘ang hoáº¡t Ä‘á»™ng bÃ¬nh thÆ°á»ng áº¡.";
        }
        if (q.contains("hotline") || q.contains("so dien thoai")) {
            return "Hotline PhÃ²ng khÃ¡m ThÃº y Rexi: 0353.374.156.";
        }
        if (q.contains("dia chi")) {
            return "Äá»‹a chá»‰ PhÃ²ng khÃ¡m ThÃº y Rexi: Sá»‘ 68, NgÃµ 10, ÄÆ°á»ng NgÃ´ XuÃ¢n Quáº£ng, TrÃ¢u Quá»³, Gia LÃ¢m, HÃ  Ná»™i.";
        }
        if (q.contains("gio lam viec")) {
            return "Rexi chÆ°a cÃ³ lá»‹ch giá» lÃ m viá»‡c cá»‘ Ä‘á»‹nh trong tin nháº¯n nhanh nÃ y. Sen gá»i hotline 0353.374.156 Ä‘á»ƒ xÃ¡c nháº­n khung giá» khÃ¡m chÃ­nh xÃ¡c nhÃ©.";
        }
        if (q.contains("rexi la gi")) {
            return "Rexi lÃ  trá»£ lÃ½ thÃº y cá»§a PhÃ²ng khÃ¡m ThÃº y Rexi, há»— trá»£ tÆ° váº¥n chÄƒm sÃ³c thÃº cÆ°ng, Ä‘áº·t lá»‹ch, tra cá»©u thÃ´ng tin phÃ²ng khÃ¡m vÃ  hÆ°á»›ng dáº«n thao tÃ¡c trÃªn há»‡ thá»‘ng.";
        }
        if (q.contains("ban ho tro gi")) {
            return "Rexi cÃ³ thá»ƒ há»— trá»£ tÆ° váº¥n chÄƒm sÃ³c thÃº cÆ°ng, Ä‘áº·t lá»‹ch khÃ¡m, hÆ°á»›ng dáº«n dÃ¹ng há»‡ thá»‘ng, tra cá»©u dá»‹ch vá»¥ vÃ  cung cáº¥p thÃ´ng tin liÃªn há»‡ phÃ²ng khÃ¡m.";
        }
        return "Dáº¡ Rexi Ä‘Ã¢y áº¡. Sen cáº§n há»— trá»£ gÃ¬ hÃ´m nay?";
    }

    private String tryShortAnimalClarificationReply(String normalizedQuery) {
        if (normalizedQuery == null || normalizedQuery.isBlank()) return null;
        String q = normalizedQuery.trim().replaceAll("\\s+", " ");
        String animalName = switch (q) {
            case "ga", "gia cam" -> "gÃ /gia cáº§m";
            case "chim" -> "chim";
            case "cho", "cun" -> "chÃ³";
            case "meo" -> "mÃ¨o";
            case "tho" -> "thá»";
            case "hamster" -> "hamster";
            default -> null;
        };
        if (animalName == null) return null;

        if ("gÃ /gia cáº§m".equals(animalName) || "chim".equals(animalName)) {
            return "Rexi hiá»ƒu Sen Ä‘ang há»i vá» " + animalName + ". Sen nÃ³i rÃµ giÃºp Rexi bÃ© Ä‘ang gáº·p váº¥n Ä‘á» gÃ¬: bá» Äƒn, tiÃªu cháº£y, thá»Ÿ khÃ³, á»§ rÅ©, bá»‹ thÆ°Æ¡ng, hay cáº§n há»i phÃ²ng khÃ¡m cÃ³ há»— trá»£ khÃ´ng? Vá»›i gia cáº§m/chim, Rexi sáº½ tÆ° váº¥n an toÃ n á»Ÿ má»©c sÆ¡ bá»™ vÃ  nháº¯c Ä‘i cÆ¡ sá»Ÿ thÃº y chuyÃªn gia cáº§m náº¿u cÃ³ dáº¥u hiá»‡u náº·ng.";
        }
        return "Rexi hiá»ƒu Sen Ä‘ang há»i vá» " + animalName + ". Sen nÃ³i rÃµ thÃªm bÃ© Ä‘ang bá»‹ gÃ¬ hoáº·c Sen muá»‘n há»i pháº§n nÃ o: triá»‡u chá»©ng, chÄƒm sÃ³c, dinh dÆ°á»¡ng, Ä‘áº·t lá»‹ch khÃ¡m hay báº£ng giÃ¡?";
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
            return "MÃ¬nh hiá»ƒu lÃ  báº¡n Ä‘ang bá»‹ vÆ°á»›ng cÃ¡ch dÃ¹ng. Báº¡n cho Rexi biáº¿t báº¡n Ä‘ang á»Ÿ trang nÃ o hoáº·c muá»‘n lÃ m viá»‡c gÃ¬: Ä‘áº·t lá»‹ch, xem hÃ³a Ä‘Æ¡n, tÃ¬m khÃ¡ch hÃ ng, xem bá»‡nh Ã¡n hay dÃ¹ng chatbot? Rexi sáº½ hÆ°á»›ng dáº«n Ä‘Ãºng tá»«ng bÆ°á»›c, khÃ´ng cáº§n báº¡n nháº­p cÃ¢u lá»‡nh chuáº©n.";
        }
        return "MÃ¬nh hiá»ƒu lÃ  báº¡n Ä‘ang pháº£n Ã¡nh há»‡ thá»‘ng/chatbot pháº£n há»“i cháº­m. TrÆ°á»›c máº¯t báº¡n thá»­ táº£i láº¡i trang, kiá»ƒm tra máº¡ng vÃ  Ä‘Ã³ng bá»›t tab náº·ng. Náº¿u váº«n cháº­m, Admin nÃªn kiá»ƒm tra 3 Ä‘iá»ƒm: backend `/api/system/health`, log lá»—i provider AI, vÃ  thá»i gian pháº£n há»“i cá»§a `/api/chat` hoáº·c `/api/agent/react`. Rexi sáº½ khÃ´ng Ä‘oÃ¡n dá»¯ liá»‡u; náº¿u backend/AI ngháº½n thÃ¬ nÃªn bÃ¡o rÃµ thay vÃ¬ tráº£ lá»i lung tung.";
    }

    private String tryLocalEverydayReply(String normalizedQuery, String rawQuery) {
        if (normalizedQuery == null || normalizedQuery.isBlank()) return null;
        String q = normalizedQuery.trim();
        boolean shortQuery = isShortSimpleQuery(rawQuery);
        if (!shortQuery) return null;

        if (containsAny(q, "cam on", "thank", "thanks", "thank you")) {
            return "KhÃ´ng cÃ³ gÃ¬ áº¡. Rexi váº«n á»Ÿ Ä‘Ã¢y, Sen cáº§n há»i thÃªm vá» Ä‘áº·t lá»‹ch, dá»‹ch vá»¥ hoáº·c chÄƒm sÃ³c bÃ© thÃ¬ nháº¯n tiáº¿p nhÃ©.";
        }

        if (containsAny(q, "viet lai", "sua cau", "noi lich su hon", "lich su hon")) {
            return "Sen cÃ³ thá»ƒ viáº¿t lá»‹ch sá»± hÆ¡n lÃ : \"Dáº¡, anh/chá»‹ cÃ³ thá»ƒ ghÃ© phÃ²ng khÃ¡m vÃ o ngÃ y mai Ä‘Æ°á»£c khÃ´ng áº¡? Rexi sáº½ há»— trá»£ sáº¯p xáº¿p lá»‹ch phÃ¹ há»£p cho bÃ©.\"";
        }

        if (containsAny(q, "phong kham minh co gi hay", "phong kham co gi hay", "rexi co gi hay")) {
            return "PhÃ²ng khÃ¡m Rexi táº­p trung khÃ¡m chÃ³ mÃ¨o, tiÃªm phÃ²ng, xÃ©t nghiá»‡m, siÃªu Ã¢m, chÄƒm sÃ³c da/tai vÃ  há»— trá»£ Ä‘áº·t lá»‹ch nhanh. Äiá»ƒm tiá»‡n lÃ  Sen cÃ³ thá»ƒ há»i Rexi trÆ°á»›c Ä‘á»ƒ chá»n dá»‹ch vá»¥ phÃ¹ há»£p, lÆ°u há»“ sÆ¡ bÃ© vÃ  theo dÃµi hÃ³a Ä‘Æ¡n/lá»‹ch háº¹n trÃªn há»‡ thá»‘ng.";
        }

        if (containsAny(q, "dat lich") && containsAny(q, "chua biet chon dich vu", "khong biet chon dich vu", "chon dich vu nao")) {
            return "Náº¿u chÆ°a biáº¿t chá»n dá»‹ch vá»¥ nÃ o, Sen chá»n **KhÃ¡m tá»•ng quÃ¡t** trÆ°á»›c lÃ  an toÃ n nháº¥t cho chÃ³/mÃ¨o. Khi tá»›i phÃ²ng khÃ¡m, bÃ¡c sÄ© sáº½ kiá»ƒm tra bÃ© rá»“i chuyá»ƒn sang tiÃªm phÃ²ng, xÃ©t nghiá»‡m, da liá»…u, siÃªu Ã¢m hoáº·c cáº¥p cá»©u náº¿u cáº§n. Náº¿u bÃ© Ä‘ang khÃ³ thá»Ÿ, co giáº­t, cháº£y mÃ¡u, lá»« Ä‘á»« náº·ng hoáº·c nghi ngá»™ Ä‘á»™c thÃ¬ gá»i hotline 0353.374.156 ngay.";
        }

        if (containsAny(q, "noi chuyen", "tam su", "stress", "met qua")
                && containsAny(q, "thu cung", "meo", "cho", "boss", "be nha", "bo an", "khong an")) {
            return "Rexi nghe Sen. Náº¿u bÃ© bá» Äƒn hoáº·c khÃ¡c thÆ°á»ng thÃ¬ mÃ¬nh vá»«a tráº¥n tÄ©nh vá»«a theo dÃµi má»‘c nguy hiá»ƒm nhÃ©: mÃ¨o bá» Äƒn quÃ¡ 24 giá», chÃ³ bá» Äƒn kÃ¨m nÃ´n/tiÃªu cháº£y/lá»« Ä‘á»«/sá»‘t hoáº·c khÃ³ thá»Ÿ thÃ¬ nÃªn Ä‘i khÃ¡m sá»›m. Sen cÃ³ thá»ƒ nháº¯n loÃ i, tuá»•i, bÃ© bá» Äƒn bao lÃ¢u vÃ  cÃ³ nÃ´n/tiÃªu cháº£y khÃ´ng Ä‘á»ƒ Rexi hÆ°á»›ng dáº«n bÆ°á»›c tiáº¿p theo.";
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
            return "Vá»›i chÃ³/mÃ¨o náº¿u chÆ°a rÃµ bá»‡nh cá»¥ thá»ƒ, Sen/sáº¿p chá»n **KhÃ¡m Äa Khoa** trÆ°á»›c. Náº¿u bÃ© cÃ³ váº¥n Ä‘á» rÃµ hÆ¡n thÃ¬ chá»n phÃ¢n há»‡ phÃ¹ há»£p: da/tai/ngá»©a chá»n khÃ¡m da liá»…u, tiÃªm phÃ²ng chá»n tiÃªm chá»§ng, xÃ©t nghiá»‡m chá»n xÃ©t nghiá»‡m, cáº¥p cá»©u thÃ¬ gá»i hotline 0353.374.156 hoáº·c Ä‘Æ°a bÃ© tá»›i phÃ²ng khÃ¡m ngay.";
        }

        if (containsAny(q, "huong dan thanh toan", "thanh toan online", "cach thanh toan", "thanh toan nhu the nao")
                && !containsAny(q, "cap nhat", "xac nhan", "huy", "xoa", "doi trang thai", "da thanh toan")
                && isShortQuery) {
            return "Äá»ƒ xem hÆ°á»›ng dáº«n thanh toÃ¡n online, Sen/sáº¿p má»Ÿ má»¥c **HÃ³a Ä‘Æ¡n & Thanh toÃ¡n**, chá»n hÃ³a Ä‘Æ¡n cáº§n xem rá»“i lÃ m theo hÆ°á»›ng dáº«n chuyá»ƒn khoáº£n/VNPay hiá»ƒn thá»‹ trÃªn mÃ n hÃ¬nh. Náº¿u chá»‰ cáº§n hÆ°á»›ng dáº«n thÃ¬ Rexi khÃ´ng thay Ä‘á»•i tráº¡ng thÃ¡i hÃ³a Ä‘Æ¡n; má»i thao tÃ¡c xÃ¡c nháº­n/há»§y/cáº­p nháº­t thanh toÃ¡n sáº½ cáº§n Rexi Agent kiá»ƒm tra quyá»n vÃ  xÃ¡c nháº­n riÃªng.";
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
        Matcher important = Pattern.compile("(?i)(Chi tiáº¿t quan trá»ng|Chi tiet quan trong)\\s*:\\s*([^\\.\\n]+(?:\\.[^\\.\\n]+){0,2})").matcher(compact);
        if (important.find()) {
            return "Chi tiáº¿t quan trá»ng trong tÃ i liá»‡u lÃ : " + important.group(2).trim()
                    + "\n\nRexi Ä‘Ã£ xá»­ lÃ½ pháº§n nÃ y báº±ng bá»™ Ä‘á»c ná»™i bá»™ Ä‘á»ƒ trÃ¡nh gá»­i toÃ n bá»™ tÃ i liá»‡u dÃ i lÃªn provider AI.";
        }

        int questionIndex = Math.max(compact.toLowerCase(Locale.ROOT).lastIndexOf("há»i:"), compact.toLowerCase(Locale.ROOT).lastIndexOf("hoi:"));
        String body = questionIndex > 0 ? compact.substring(0, questionIndex).trim() : compact;
        String sample = body.length() > 700 ? body.substring(0, 700) + "..." : body;
        return "TÃ³m táº¯t nhanh tÃ i liá»‡u: " + sample
                + "\n\nTÃ i liá»‡u khÃ¡ dÃ i nÃªn Rexi chá»‰ trÃ­ch pháº§n liÃªn quan/tÃ³m táº¯t cá»¥c bá»™ trÆ°á»›c, khÃ´ng Ä‘áº©y toÃ n bá»™ ná»™i dung lÃªn AI Ä‘á»ƒ trÃ¡nh tá»‘n token vÃ  lá»™ ngá»¯ cáº£nh khÃ´ng cáº§n thiáº¿t.";
    }

    private String tryLocalVeterinaryReply(String normalizedQuery, String rawQuery) {
        if (normalizedQuery == null || normalizedQuery.isBlank()) return null;
        String q = normalizedQuery.trim();
        boolean isShortQuery = isShortSimpleQuery(rawQuery);

        if (containsAny(q, "ca rong", "chim canh", "chim", "ca canh", "bo sat", "ran canh")
                && containsAny(q, "ban", "kham", "dich vu", "ho tro", "web minh", "phong kham")
                && isShortQuery) {
            return "Dáº¡ hiá»‡n táº¡i Rexi táº­p trung há»— trá»£ thÃº cÆ°ng phá»• biáº¿n nhÆ° chÃ³, mÃ¨o vÃ  má»™t sá»‘ thÃº nhá». Vá»›i cÃ¡ rá»“ng/chim cáº£nh, phÃ²ng khÃ¡m chÆ°a cÃ³ dá»‹ch vá»¥ chuyÃªn sÃ¢u cá»‘ Ä‘á»‹nh nÃªn Rexi khÃ´ng muá»‘n tÆ° váº¥n quÃ¡ tay. Náº¿u bÃ© cÃ³ dáº¥u hiá»‡u nguy cáº¥p, Sen nÃªn liÃªn há»‡ cÆ¡ sá»Ÿ thÃº y chuyÃªn cÃ¡/chim cáº£nh gáº§n nháº¥t hoáº·c gá»i Rexi Ä‘á»ƒ Ä‘Æ°á»£c hÆ°á»›ng dáº«n kÃªnh phÃ¹ há»£p.";
        }

        if (isPrescriptionRequest(q)) {
            return "Rexi khÃ´ng thá»ƒ kÃª Ä‘Æ¡n, chá»‰ Ä‘á»‹nh khÃ¡ng sinh hoáº·c Ä‘Æ°a liá»u dÃ¹ng cho thÃº cÆ°ng qua chat. Vá»›i viÃªm da/nhiá»…m trÃ¹ng, bÃ¡c sÄ© cáº§n khÃ¡m da, cÃ¢n náº·ng, tuá»•i, loÃ i vÃ  cÃ³ thá»ƒ cáº§n soi da/xÃ©t nghiá»‡m trÆ°á»›c khi chá»n thuá»‘c. Viá»‡c an toÃ n nÃªn lÃ m ngay: giá»¯ vÃ¹ng da sáº¡ch vÃ  khÃ´, trÃ¡nh Ä‘á»ƒ bÃ© gÃ£i/liáº¿m, khÃ´ng tá»± dÃ¹ng thuá»‘c ngÆ°á»i hoáº·c khÃ¡ng sinh cÃ²n thá»«a, vÃ  Ä‘áº·t lá»‹ch khÃ¡m da liá»…u náº¿u cÃ³ má»§, lan rá»™ng, hÃ´i, sá»‘t, bá» Äƒn hoáº·c ngá»©a nhiá»u.";
        }

        if (isPostVisitCareQuery(q) && isShortQuery) {
            return "Sau khi bÃ© vá»«a khÃ¡m xong, Sen theo dÃµi 24-48 giá» Ä‘áº§u: Äƒn uá»‘ng, nÃ´n/tiÃªu cháº£y, má»©c tá»‰nh tÃ¡o, váº¿t tiÃªm/váº¿t thÆ°Æ¡ng, nhá»‹p thá»Ÿ vÃ  viá»‡c Ä‘i vá»‡ sinh. Cho bÃ© nghá»‰ á»Ÿ nÆ¡i yÃªn tÄ©nh, dÃ¹ng thuá»‘c Ä‘Ãºng Ä‘Æ¡n náº¿u bÃ¡c sÄ© Ä‘Ã£ kÃª, khÃ´ng tá»± thÃªm thuá»‘c ngÆ°á»i. Cáº§n gá»i láº¡i phÃ²ng khÃ¡m hoáº·c Ä‘Æ°a bÃ© tÃ¡i khÃ¡m sá»›m náº¿u bÃ© lá»« Ä‘á»« tÄƒng, bá» Äƒn, nÃ´n nhiá»u, khÃ³ thá»Ÿ, sá»‘t, cháº£y mÃ¡u, sÆ°ng Ä‘au nhiá»u hoáº·c cÃ³ dáº¥u hiá»‡u láº¡ sau dÃ¹ng thuá»‘c.";
        }

        if (isVaccineScheduleQuery(q) && isShortQuery) {
            return "Lá»‹ch vaccine phá»¥ thuá»™c tuá»•i, loÃ i, vaccine Ä‘Ã£ tiÃªm vÃ  nguy cÆ¡ tiáº¿p xÃºc. ThÃ´ng thÆ°á»ng chÃ³/mÃ¨o con báº¯t Ä‘áº§u tiÃªm tá»« khoáº£ng 6-8 tuáº§n tuá»•i, nháº¯c theo lá»‹ch bÃ¡c sÄ© Ä‘áº¿n khi hoÃ n táº¥t mÅ©i cÆ¡ báº£n, sau Ä‘Ã³ nháº¯c Ä‘á»‹nh ká»³ háº±ng nÄƒm hoáº·c theo khuyáº¿n cÃ¡o tá»«ng loáº¡i vaccine. Sen nÃªn mang sá»• tiÃªm/áº£nh mÅ©i cÅ© khi Ä‘áº·t lá»‹ch Ä‘á»ƒ bÃ¡c sÄ© Rexi chá»‘t lá»‹ch chÃ­nh xÃ¡c, khÃ´ng tiÃªm khi bÃ© Ä‘ang sá»‘t, tiÃªu cháº£y hoáº·c quÃ¡ yáº¿u.";
        }

        if (isPregnantCatCareQuery(q) && isShortQuery) {
            return "Vá»›i mÃ¨o mang thai, Sen giá»¯ mÃ´i trÆ°á»ng yÃªn tÄ©nh, sáº¡ch, áº¥m vá»«a pháº£i; cho Äƒn kháº©u pháº§n Ä‘á»§ nÄƒng lÆ°á»£ng, dá»… tiÃªu vÃ  luÃ´n cÃ³ nÆ°á»›c sáº¡ch; háº¡n cháº¿ stress, nháº£y cao/va cháº¡m; chuáº©n bá»‹ á»• Ä‘áº» khÃ´ kÃ­n. KhÃ´ng tá»± dÃ¹ng thuá»‘c, táº©y giun hay bá»• sung canxi liá»u cao náº¿u chÆ°a há»i bÃ¡c sÄ©. Cáº§n Ä‘i khÃ¡m náº¿u mÃ¨o bá» Äƒn, sá»‘t, cháº£y dá»‹ch hÃ´i/mÃ¡u nhiá»u, ráº·n lÃ¢u khÃ´ng ra con, Ä‘au nhiá»u hoáº·c thai ká»³ cÃ³ dáº¥u hiá»‡u báº¥t thÆ°á»ng.";
        }

        if (isNutritionByAgeWeightQuery(q) && isShortQuery) {
            return "Äá»ƒ tÆ° váº¥n kháº©u pháº§n chuáº©n, Rexi cáº§n loÃ i, tuá»•i, cÃ¢n náº·ng, tÃ¬nh tráº¡ng triá»‡t sáº£n, má»©c váº­n Ä‘á»™ng vÃ  bá»‡nh ná»n. NguyÃªn táº¯c nhanh: chá»n thá»©c Äƒn Ä‘Ãºng lá»©a tuá»•i, chia bá»¯a Ä‘á»u, Ä‘á»•i thá»©c Äƒn tá»« tá»« 5-7 ngÃ y, luÃ´n cÃ³ nÆ°á»›c sáº¡ch, khÃ´ng cho xÆ°Æ¡ng náº¥u chÃ­n/socola/hÃ nh tá»i. Náº¿u Sen gá»­i tuá»•i + cÃ¢n náº·ng + bÃ© Ä‘ang Äƒn gÃ¬, Rexi sáº½ gá»£i Ã½ cÃ¡ch chia bá»¯a an toÃ n hÆ¡n.";
        }

        if (isEducationalPoisoningQuery(q) && isShortQuery) {
            return "Náº¿u nghi mÃ¨o/chÃ³ ngá»™ Ä‘á»™c, Æ°u tiÃªn Ä‘Æ°a Ä‘i cáº¥p cá»©u thÃº y ngay vÃ  gá»i hotline 0353.374.156. Trong lÃºc Ä‘i: láº¥y máº«u/thÃ´ng tin thá»© bÃ© Ä‘Ã£ Äƒn, khÃ´ng tá»± gÃ¢y nÃ´n, khÃ´ng cho uá»‘ng thuá»‘c ngÆ°á»i, than hoáº¡t hay sá»¯a náº¿u chÆ°a Ä‘Æ°á»£c bÃ¡c sÄ© hÆ°á»›ng dáº«n, giá»¯ bÃ© yÃªn vÃ  trÃ¡nh Ä‘á»ƒ tiáº¿p tá»¥c Äƒn liáº¿m cháº¥t Ä‘á»™c. Dáº¥u hiá»‡u nguy hiá»ƒm gá»“m nÃ´n liÃªn tá»¥c, co giáº­t, khÃ³ thá»Ÿ, lá»« Ä‘á»«, cháº£y dÃ£i nhiá»u, tiÃªu cháº£y mÃ¡u hoáº·c tÃ­m tÃ¡i.";
        }

        if (isHeimlichTechniqueQuery(q) && isShortQuery) {
            return "Náº¿u bÃ© nghi hÃ³c dá»‹ váº­t nhÆ°ng cÃ²n thá»Ÿ/ho Ä‘Æ°á»£c, Ä‘á»«ng mÃ³c há»ng sÃ¢u vÃ¬ cÃ³ thá»ƒ Ä‘áº©y dá»‹ váº­t vÃ o trong; hÃ£y Ä‘Æ°a Ä‘i cáº¥p cá»©u ngay. Náº¿u bÃ© khÃ´ng thá»Ÿ, tÃ­m tÃ¡i hoáº·c ngÃ£ lá»‹m: kiá»ƒm tra miá»‡ng chá»‰ láº¥y dá»‹ váº­t nhÃ¬n tháº¥y rÃµ, giá»¯ Ä‘áº§u tháº¥p hÆ¡n thÃ¢n vá»›i bÃ© nhá» vÃ  vá»— lÆ°ng dá»©t khoÃ¡t; vá»›i chÃ³ lá»›n cÃ³ thá»ƒ Ã©p bá»¥ng/ngá»±c ngáº¯n theo hÆ°á»›ng lÃªn-trÆ°á»›c rá»“i láº­p tá»©c Ä‘áº¿n cÆ¡ sá»Ÿ thÃº y. Gá»i Rexi 0353.374.156 trong lÃºc di chuyá»ƒn.";
        }

        if (isGeneralVetVisitWarningQuery(q) && isShortQuery) {
            return "Nhá»¯ng dáº¥u hiá»‡u nÃªn Ä‘Æ°a chÃ³/mÃ¨o Ä‘i khÃ¡m ngay gá»“m: khÃ³ thá»Ÿ, tÃ­m tÃ¡i, co giáº­t, lá»‹m Ä‘i; nÃ´n/tiÃªu cháº£y liÃªn tá»¥c hoáº·c cÃ³ mÃ¡u; bá» Äƒn hÆ¡n 24 giá» á»Ÿ mÃ¨o; sá»‘t cao, Ä‘au nhiá»u, bá»¥ng chÆ°á»›ng; tai náº¡n, cháº£y mÃ¡u, nghi gÃ£y xÆ°Æ¡ng; nghi ngá»™ Ä‘á»™c/nuá»‘t dá»‹ váº­t; tiá»ƒu khÃ´ng ra, ráº·n nhiá»u; máº¯t Ä‘á»¥c/Ä‘au/nháº¯m nghiá»n. Náº¿u Ä‘ang cÃ³ dáº¥u hiá»‡u cáº¥p cá»©u, Sen gá»i hotline Rexi 0353.374.156 vÃ  Ä‘Æ°a bÃ© tá»›i phÃ²ng khÃ¡m/cÆ¡ sá»Ÿ thÃº y gáº§n nháº¥t.";
        }

        if (isVomitingFoamCatQuery(q)) {
            return "MÃ¨o nÃ´n ra bá»t tráº¯ng cÃ³ thá»ƒ do kÃ­ch á»©ng dáº¡ dÃ y, nuá»‘t lÃ´ng, Äƒn quÃ¡ nhanh, kÃ½ sinh trÃ¹ng, viÃªm dáº¡ dÃ y-ruá»™t hoáº·c bá»‡nh náº·ng hÆ¡n náº¿u Ä‘i kÃ¨m lá»« Ä‘á»«/sá»‘t/tiÃªu cháº£y. TrÆ°á»›c máº¯t cho bÃ© nghá»‰ Äƒn 2-4 giá» náº¿u váº«n tá»‰nh tÃ¡o, luÃ´n Ä‘á»ƒ nÆ°á»›c sáº¡ch, khÃ´ng tá»± cho uá»‘ng thuá»‘c ngÆ°á»i. Cáº§n Ä‘i khÃ¡m sá»›m náº¿u nÃ´n láº·p láº¡i nhiá»u láº§n, khÃ´ng uá»‘ng Ä‘Æ°á»£c nÆ°á»›c, bá» Äƒn trÃªn 24 giá», tiÃªu cháº£y/ra mÃ¡u, bá»¥ng Ä‘au, lá»« Ä‘á»«, mÃ¨o con hoáº·c nghi nuá»‘t dá»‹ váº­t/cháº¥t Ä‘á»™c.";
        }

        if (containsAny(q, "meo con") && containsAny(q, "moi ve", "moi nhan", "moi don", "can chuan bi", "chuan bi gi") && isShortQuery) {
            return "MÃ¨o con má»›i vá» cáº§n chuáº©n bá»‹: á»• náº±m áº¥m vÃ  kÃ­n giÃ³, khay cÃ¡t tháº¥p, bÃ¡t nÆ°á»›c/thá»©c Äƒn riÃªng, thá»©c Äƒn Ä‘Ãºng tuá»•i, Ä‘á»“ cÃ o mÃ³ng vÃ  khu vá»±c yÃªn tÄ©nh Ä‘á»ƒ bÃ© lÃ m quen. 3-7 ngÃ y Ä‘áº§u nÃªn háº¡n cháº¿ táº¯m, khÃ´ng Ä‘á»•i thá»©c Äƒn Ä‘á»™t ngá»™t, theo dÃµi Äƒn uá»‘ng/phÃ¢n/nÃ´n/háº¯t hÆ¡i. Náº¿u bÃ© chÆ°a rÃµ lá»‹ch vaccine/táº©y giun, Sen Ä‘áº·t lá»‹ch khÃ¡m tá»•ng quÃ¡t Ä‘á»ƒ bÃ¡c sÄ© kiá»ƒm tra tuá»•i, cÃ¢n náº·ng vÃ  lÃªn lá»‹ch chÄƒm sÃ³c phÃ¹ há»£p.";
        }

        if (isPetEyeProblemQuery(q) && isShortQuery) {
            return "Rexi hiá»ƒu lÃ  máº¯t cá»§a mÃ¨o Ä‘ang cÃ³ dáº¥u hiá»‡u báº¥t thÆ°á»ng kiá»ƒu Ä‘á»‘m/lá»‘m Ä‘á»‘m, nhÃ¬n láº¡ hoáº·c cÃ³ váº» khÃ³ chá»‹u. Vá»›i máº¯t thÃ¬ khÃ´ng nÃªn chá» lÃ¢u vÃ¬ cÃ³ thá»ƒ liÃªn quan viÃªm káº¿t máº¡c, loÃ©t giÃ¡c máº¡c, dá»‹ váº­t, cháº¥n thÆ°Æ¡ng, nhiá»…m trÃ¹ng hoáº·c tÄƒng nhÃ£n Ã¡p. TrÆ°á»›c máº¯t khÃ´ng nhá» thuá»‘c ngÆ°á»i, khÃ´ng tá»± dÃ¹ng khÃ¡ng sinh/corticoid, khÃ´ng dá»¥i/rá»­a máº¡nh; náº¿u cÃ³ ghÃ¨n nhiá»u, Ä‘á», nheo máº¯t, cháº£y nÆ°á»›c máº¯t, Ä‘á»¥c/tráº¯ng xanh, sÆ°ng, Ä‘au, bÃ© dá»¥i máº¯t hoáº·c nhÃ¬n kÃ©m thÃ¬ nÃªn Ä‘i khÃ¡m thÃº y trong ngÃ y Ä‘á»ƒ soi máº¯t vÃ  nhuá»™m fluorescein kiá»ƒm tra loÃ©t giÃ¡c máº¡c.";
        }

        if (containsAny(q, "meo") && containsAny(q, "moi de", "vua de", "de con", "meo con", "meo me") && isShortQuery) {
            return "Vá»›i mÃ¨o máº¹ má»›i Ä‘áº», Sen Æ°u tiÃªn 4 viá»‡c: giá»¯ á»• áº¥m, khÃ´ vÃ  yÃªn tÄ©nh; cho mÃ¨o máº¹ Äƒn kháº©u pháº§n giÃ u nÄƒng lÆ°á»£ng/Ä‘áº¡m vÃ  luÃ´n cÃ³ nÆ°á»›c sáº¡ch; theo dÃµi mÃ¨o con bÃº Ä‘á»u, khÃ´ng bá»‹ láº¡nh, khÃ´ng kÃªu yáº¿u kÃ©o dÃ i; khÃ´ng táº¯m hoáº·c báº¿ mÃ¨o con quÃ¡ nhiá»u trong vÃ i ngÃ y Ä‘áº§u. Náº¿u mÃ¨o máº¹ bá» Äƒn, sá»‘t, cháº£y dá»‹ch hÃ´i, bá» con hoáº·c mÃ¨o con láº¡nh/yáº¿u khÃ´ng bÃº thÃ¬ nÃªn Ä‘Æ°a tá»›i bÃ¡c sÄ© thÃº y sá»›m.";
        }

        if (containsAny(q, "di ngoai ra nuoc", "di ngoai", "tieu chay", "phan long")
                && containsAny(q, "mui hoi", "hoi lam", "ra nuoc", "cun", "cho")
                && isShortQuery) {
            return "Rexi hiá»ƒu lÃ  cÃºn Ä‘ang cÃ³ dáº¥u hiá»‡u **tiÃªu cháº£y nÆ°á»›c, mÃ¹i hÃ´i**. ÄÃ¢y cÃ³ thá»ƒ lÃ  rá»‘i loáº¡n tiÃªu hÃ³a, nhiá»…m khuáº©n/kÃ½ sinh trÃ¹ng, vÃ  á»Ÿ chÃ³ con hoáº·c chÃ³ chÆ°a tiÃªm Ä‘á»§ vaccine cáº§n Ä‘áº·c biá»‡t cáº£nh giÃ¡c **Parvovirus**. Viá»‡c cáº§n lÃ m ngay: cho bÃ© uá»‘ng nÆ°á»›c tá»«ng Ã­t má»™t, khÃ´ng tá»± dÃ¹ng thuá»‘c cáº§m tiÃªu cháº£y cá»§a ngÆ°á»i, theo dÃµi nÃ´n/sá»‘t/lá»« Ä‘á»«/phÃ¢n mÃ¡u. Náº¿u bÃ© cÃ²n nhá», bá» Äƒn, nÃ´n, lá»« Ä‘á»« hoáº·c tiÃªu cháº£y liÃªn tá»¥c thÃ¬ nÃªn mang tá»›i phÃ²ng khÃ¡m trong ngÃ y Ä‘á»ƒ test vÃ  truyá»n dá»‹ch náº¿u cáº§n.";
        }

        if (containsAny(q, "bo an", "khong an", "an it")
                && containsAny(q, "nguoi nong", "nong lam", "sot", "meo")
                && isShortQuery) {
            return "Rexi hiá»ƒu theo ngÃ´n ngá»¯ thÃº y lÃ  mÃ¨o cÃ³ dáº¥u hiá»‡u **bá» Äƒn kÃ¨m nghi sá»‘t**. MÃ¨o bá» Äƒn quÃ¡ 24 giá» Ä‘Ã£ Ä‘Ã¡ng lo, nháº¥t lÃ  náº¿u ngÆ°á»i nÃ³ng, lá»« Ä‘á»«, trá»‘n, thá»Ÿ nhanh hoáº·c nÃ´n. Sen nÃªn Ä‘o nhiá»‡t Ä‘á»™ háº­u mÃ´n náº¿u cÃ³ nhiá»‡t káº¿ thÃº y; mÃ¨o thÆ°á»ng khoáº£ng 38-39.2Â°C, cao hÆ¡n nÃªn Ä‘i khÃ¡m. TrÆ°á»›c máº¯t giá»¯ bÃ© á»Ÿ nÆ¡i mÃ¡t, cÃ³ nÆ°á»›c sáº¡ch, khÃ´ng tá»± cho uá»‘ng thuá»‘c háº¡ sá»‘t cá»§a ngÆ°á»i vÃ¬ cÃ³ thá»ƒ gÃ¢y ngá»™ Ä‘á»™c. NÃªn Ä‘áº·t lá»‹ch khÃ¡m sá»›m Ä‘á»ƒ bÃ¡c sÄ© kiá»ƒm tra nguyÃªn nhÃ¢n nhiá»…m trÃ¹ng/Ä‘au/stress.";
        }

        if (containsAny(q, "ngua tai", "gay tai", "lac dau", "hoi tai", "poodle") && isShortQuery) {
            return "Dáº¥u hiá»‡u ngá»©a tai/láº¯c Ä‘áº§u á»Ÿ Poodle thÆ°á»ng liÃªn quan viÃªm tai ngoÃ i, náº¥m/vi khuáº©n, ve tai hoáº·c dá»‹ á»©ng da. KhÃ´ng nÃªn tá»± nhá» thuá»‘c khi chÆ°a soi tai vÃ¬ náº¿u mÃ ng nhÄ© tá»•n thÆ°Æ¡ng cÃ³ thá»ƒ nguy hiá»ƒm. Sen nÃªn Ä‘áº·t lá»‹ch khÃ¡m da liá»…u/tai Ä‘á»ƒ bÃ¡c sÄ© soi tai, vá»‡ sinh Ä‘Ãºng cÃ¡ch vÃ  kÃª thuá»‘c phÃ¹ há»£p.";
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
                case "cat" -> "mÃ¨o";
                case "dog" -> "chÃ³";
                default -> "thÃº cÆ°ng";
            };
            return "Rexi hiá»ƒu lÃ  " + species + " Ä‘ang cÃ³ dáº¥u hiá»‡u báº¥t thÆ°á»ng á»Ÿ máº¯t. Vá»›i máº¯t thÃ¬ nÃªn xá»­ lÃ½ tháº­n trá»ng vÃ¬ cÃ³ thá»ƒ liÃªn quan viÃªm káº¿t máº¡c, loÃ©t giÃ¡c máº¡c, dá»‹ váº­t, cháº¥n thÆ°Æ¡ng, nhiá»…m trÃ¹ng hoáº·c tÄƒng nhÃ£n Ã¡p. TrÆ°á»›c máº¯t khÃ´ng nhá» thuá»‘c ngÆ°á»i, khÃ´ng tá»± dÃ¹ng khÃ¡ng sinh/corticoid, khÃ´ng dá»¥i/rá»­a máº¡nh; giá»¯ bÃ© trÃ¡nh gÃ£i máº¯t. Náº¿u máº¯t Ä‘á», Ä‘á»¥c, cÃ³ Ä‘á»‘m/lá»‘m Ä‘á»‘m, ghÃ¨n nhiá»u, cháº£y nÆ°á»›c máº¯t, nheo máº¯t, sÆ°ng, Ä‘au hoáº·c nhÃ¬n kÃ©m thÃ¬ nÃªn Ä‘i khÃ¡m thÃº y trong ngÃ y Ä‘á»ƒ soi máº¯t vÃ  kiá»ƒm tra loÃ©t giÃ¡c máº¡c.";
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
        String petText = petName.isBlank() ? "bÃ©" : "bÃ© " + petName;
        return "ÄÆ°á»£c áº¡, Rexi hiá»ƒu mÃ¬nh váº«n Ä‘ang nÃ³i vá» lá»‹ch tiÃªm phÃ²ng/khÃ¡m cho " + petText
                + ". Náº¿u chuyá»ƒn sang sÃ¡ng Chá»§ nháº­t thÃ¬ nÃªn chá»n khung 08:00-10:30 Ä‘á»ƒ bÃ© Ä‘á»¡ má»‡t vÃ  phÃ²ng khÃ¡m dá»… sáº¯p bÃ¡c sÄ©. "
                + "Äá»ƒ chá»‘t lá»‹ch tháº­t trÃªn há»‡ thá»‘ng, Sen/Sáº¿p chuyá»ƒn sang Rexi Agent hoáº·c cung cáº¥p thÃªm ngÃ y cá»¥ thá»ƒ, SÄT khÃ¡ch hÃ ng, thÃº cÆ°ng vÃ  dá»‹ch vá»¥ cáº§n Ä‘áº·t.";
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

            boolean clinicalRole = "BÃ¡c sÄ©".equals(userRoleName) || "Y tÃ¡".equals(userRoleName);
            String detail = "scope=" + (clinicalRole ? "CLINICAL_REFERENCE" : "CUSTOMER_SAFE_ADVICE")
                    + "; role=" + userRoleName
                    + "; provider=" + provider
                    + "; route=" + route
                    + "; query=" + compactForAudit(userQuery)
                    + "; replyPreview=" + compactForAudit(reply);
            auditLogService.logAction("AI_MEDICAL_ADVICE", "ChatController", detail);
        } catch (Exception ex) {
            logger.warning("KhÃ´ng thá»ƒ ghi audit y khoa AI: " + ex.getMessage());
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
            return "Rexi khÃ´ng thá»ƒ kÃª Ä‘Æ¡n, chá»‰ Ä‘á»‹nh khÃ¡ng sinh hoáº·c Ä‘Æ°a liá»u dÃ¹ng cho thÃº cÆ°ng qua chat. Vá»›i viÃªm da/nhiá»…m trÃ¹ng, bÃ¡c sÄ© cáº§n khÃ¡m da, cÃ¢n náº·ng, tuá»•i, loÃ i vÃ  cÃ³ thá»ƒ cáº§n soi da/xÃ©t nghiá»‡m trÆ°á»›c khi chá»n thuá»‘c. Viá»‡c an toÃ n nÃªn lÃ m ngay: giá»¯ vÃ¹ng da sáº¡ch vÃ  khÃ´, trÃ¡nh Ä‘á»ƒ bÃ© gÃ£i/liáº¿m, khÃ´ng tá»± dÃ¹ng thuá»‘c ngÆ°á»i hoáº·c khÃ¡ng sinh cÃ²n thá»«a, vÃ  Ä‘áº·t lá»‹ch khÃ¡m da liá»…u náº¿u cÃ³ má»§, lan rá»™ng, hÃ´i, sá»‘t, bá» Äƒn hoáº·c ngá»©a nhiá»u.";
        }

        if (isVomitingFoamCatQuery(q) && isClearlyOffTopic(q, normalizedReply)) {
            return "MÃ¨o nÃ´n ra bá»t tráº¯ng cÃ³ thá»ƒ do kÃ­ch á»©ng dáº¡ dÃ y, nuá»‘t lÃ´ng, Äƒn quÃ¡ nhanh, kÃ½ sinh trÃ¹ng, viÃªm dáº¡ dÃ y-ruá»™t hoáº·c bá»‡nh náº·ng hÆ¡n náº¿u Ä‘i kÃ¨m lá»« Ä‘á»«/sá»‘t/tiÃªu cháº£y. TrÆ°á»›c máº¯t cho bÃ© nghá»‰ Äƒn 2-4 giá» náº¿u váº«n tá»‰nh tÃ¡o, luÃ´n Ä‘á»ƒ nÆ°á»›c sáº¡ch, khÃ´ng tá»± cho uá»‘ng thuá»‘c ngÆ°á»i. Cáº§n Ä‘i khÃ¡m sá»›m náº¿u nÃ´n láº·p láº¡i nhiá»u láº§n, khÃ´ng uá»‘ng Ä‘Æ°á»£c nÆ°á»›c, bá» Äƒn trÃªn 24 giá», tiÃªu cháº£y/ra mÃ¡u, bá»¥ng Ä‘au, lá»« Ä‘á»«, mÃ¨o con hoáº·c nghi nuá»‘t dá»‹ váº­t/cháº¥t Ä‘á»™c.";
        }

        if (route == ChatRoute.WEB_AI) {
            if (isEducationalEmergencyQuestion(q) && normalizedReply.startsWith("[emergency]")) {
                safeReply = safeReply.replaceFirst("(?i)^\\[EMERGENCY\\]\\s*", "");
            }
            if (webResults == null || webResults.isEmpty()) {
                return "Rexi chÆ°a láº¥y Ä‘Æ°á»£c nguá»“n web phÃ¹ há»£p tá»« DuckDuckGo cho cÃ¢u há»i nÃ y, nÃªn khÃ´ng coi pháº§n tráº£ lá»i lÃ  thÃ´ng tin Ä‘Ã£ kiá»ƒm chá»©ng báº±ng nguá»“n ngoÃ i. Báº¡n cÃ³ thá»ƒ há»i láº¡i vá»›i tÃªn bá»‡nh/loÃ i cá»¥ thá»ƒ hÆ¡n, vÃ­ dá»¥: \"giáº£m báº¡ch cáº§u á»Ÿ mÃ¨o FPV\" hoáº·c \"parvo á»Ÿ chÃ³ dáº¥u hiá»‡u cáº¥p cá»©u\".";
            }
            String deterministicWebAnswer = buildDeterministicVeterinaryWebAnswer(q, webResults);
            if (deterministicWebAnswer != null) {
                return deterministicWebAnswer;
            }
            if (!mentionsAnyResultUrl(safeReply, webResults)) {
                StringBuilder sb = new StringBuilder(safeReply);
                sb.append("\n\nNguá»“n DuckDuckGo Rexi Ä‘Ã£ Ä‘á»‘i chiáº¿u:\n");
                for (Map<String, String> item : webResults) {
                    sb.append("- [")
                            .append(item.getOrDefault("title", "Nguá»“n tham kháº£o").replace("[", "").replace("]", ""))
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
            topic = "Parvo á»Ÿ chÃ³";
            summary = "Parvo á»Ÿ chÃ³ lÃ  bá»‡nh truyá»n nhiá»…m nguy hiá»ƒm, tiáº¿n triá»ƒn nhanh, thÆ°á»ng gÃ¢y nÃ´n, tiÃªu cháº£y náº·ng, phÃ¢n hÃ´i hoáº·c cÃ³ mÃ¡u, bá» Äƒn, sá»‘t hoáº·c háº¡ thÃ¢n nhiá»‡t, lá»« Ä‘á»« vÃ  máº¥t nÆ°á»›c. Cáº§n Ä‘Æ°a Ä‘i cáº¥p cá»©u thÃº y ngay náº¿u chÃ³ con/chÃ³ chÆ°a tiÃªm Ä‘á»§ vaccine cÃ³ nÃ´n liÃªn tá»¥c, tiÃªu cháº£y mÃ¡u, kiá»‡t sá»©c, khÃ´ng uá»‘ng Ä‘Æ°á»£c nÆ°á»›c, bá»¥ng Ä‘au, náº±m báº¹p hoáº·c dáº¥u hiá»‡u máº¥t nÆ°á»›c. KhÃ´ng tá»± dÃ¹ng khÃ¡ng sinh/thuá»‘c cáº§m tiÃªu cháº£y cá»§a ngÆ°á»i; Æ°u tiÃªn cÃ¡ch ly, giá»¯ áº¥m vá»«a pháº£i vÃ  Ä‘Æ°a tá»›i cÆ¡ sá»Ÿ thÃº y Ä‘á»ƒ test nhanh, truyá»n dá»‹ch vÃ  Ä‘iá»u trá»‹ há»— trá»£.";
        } else if (containsAny(normalizedQuery, "bach cau", "fpv", "panleukopenia")) {
            topic = "Giáº£m báº¡ch cáº§u á»Ÿ mÃ¨o";
            summary = "Giáº£m báº¡ch cáº§u á»Ÿ mÃ¨o thÆ°á»ng Ä‘Æ°á»£c nháº¯c tá»›i nhÆ° FPV/feline panleukopenia, má»™t bá»‡nh virus nguy hiá»ƒm lÃ m mÃ¨o suy sá»¥p nhanh, nÃ´n, tiÃªu cháº£y, bá» Äƒn, sá»‘t hoáº·c háº¡ thÃ¢n nhiá»‡t, máº¥t nÆ°á»›c vÃ  giáº£m miá»…n dá»‹ch. ÄÃ¢y khÃ´ng pháº£i bá»‡nh nÃªn tá»± xá»­ lÃ½ táº¡i nhÃ . Náº¿u mÃ¨o con, mÃ¨o chÆ°a tiÃªm phÃ²ng, lá»« Ä‘á»«, nÃ´n/tiÃªu cháº£y, bá» Äƒn hoáº·c nghi tiáº¿p xÃºc mÃ¨o bá»‡nh thÃ¬ nÃªn Ä‘i khÃ¡m sá»›m Ä‘á»ƒ test vÃ  Ä‘iá»u trá»‹ há»— trá»£.";
        } else if (containsAny(normalizedQuery, "da cho", "za cho", "benh da cho", "viem da cho")) {
            topic = "Bá»‡nh da á»Ÿ chÃ³";
            summary = "Bá»‡nh da á»Ÿ chÃ³ cÃ³ thá»ƒ do náº¥m, gháº»/ve Demodex-Sarcoptes, dá»‹ á»©ng, vi khuáº©n, kÃ½ sinh trÃ¹ng ngoÃ i da hoáº·c rá»‘i loáº¡n ná»™i tiáº¿t. Dáº¥u hiá»‡u cáº§n chÃº Ã½ gá»“m ngá»©a nhiá»u, rá»¥ng lÃ´ng tá»«ng máº£ng, da Ä‘á», váº£y gÃ u, mÃ¹i hÃ´i, má»¥n má»§, cháº£y dá»‹ch hoáº·c bÃ© liáº¿m/gÃ£i liÃªn tá»¥c. Viá»‡c nÃªn lÃ m lÃ  táº¯m/vá»‡ sinh theo hÆ°á»›ng dáº«n thÃº y, háº¡n cháº¿ gÃ£i/liáº¿m báº±ng vÃ²ng chá»‘ng liáº¿m náº¿u cáº§n, giáº·t á»• náº±m vÃ  Ä‘Æ°a chÃ³ Ä‘i khÃ¡m da liá»…u Ä‘á»ƒ soi da/cáº¡o da/xÃ©t nghiá»‡m náº¥m khi tá»•n thÆ°Æ¡ng lan rá»™ng, cÃ³ má»§, hÃ´i, Ä‘au hoáº·c kÃ©o dÃ i. KhÃ´ng tá»± dÃ¹ng thuá»‘c ngÆ°á»i, corticoid hay khÃ¡ng sinh khi chÆ°a khÃ¡m.";
        } else if (containsAny(normalizedQuery, "nam da", "viem da", "da lieu")) {
            topic = "Náº¥m/viÃªm da á»Ÿ mÃ¨o";
            summary = "Náº¥m da á»Ÿ mÃ¨o thÆ°á»ng liÃªn quan dermatophyte nhÆ° Microsporum canis, cÃ³ thá»ƒ gÃ¢y rá»¥ng lÃ´ng tá»«ng máº£ng, da Ä‘á», váº£y gÃ u, ngá»©a vÃ  cÃ³ kháº£ nÄƒng lÃ¢y sang ngÆ°á»i hoáº·c thÃº khÃ¡c. NÃªn cÃ¡ch ly tÆ°Æ¡ng Ä‘á»‘i, vá»‡ sinh chÄƒn á»•/dá»¥ng cá»¥, rá»­a tay sau tiáº¿p xÃºc vÃ  Ä‘Æ°a mÃ¨o Ä‘i khÃ¡m Ä‘á»ƒ soi da/Ä‘Ã¨n Wood/nuÃ´i cáº¥y khi cáº§n. KhÃ´ng tá»± bÃ´i thuá»‘c ngÆ°á»i hoáº·c dÃ¹ng khÃ¡ng sinh náº¿u chÆ°a cÃ³ bÃ¡c sÄ© thÃº y chá»‰ Ä‘á»‹nh.";
        } else {
            return null;
        }

        StringBuilder sb = new StringBuilder();
        sb.append("Dáº¡, Rexi Ä‘Ã£ tra DuckDuckGo vÃ  lá»c nguá»“n Ä‘Ãºng chá»§ Ä‘á» **").append(topic).append("**.\n\n");
        sb.append(summary).append("\n\n");
        sb.append("Nguá»“n tham kháº£o:\n");
        for (Map<String, String> item : webResults) {
            sb.append("- [")
                    .append(item.getOrDefault("title", "Nguá»“n tham kháº£o").replace("[", "").replace("]", ""))
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
                || containsAny(normalizedQuery, "con mat", "máº¯t", "eye", "giac mac", "dong tu");
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
        String audience = isStaff ? ("nhÃ¢n sá»± ná»™i bá»™ phÃ²ng khÃ¡m - " + userRoleName) : "khÃ¡ch hÃ ng/chá»§ nuÃ´i";
        String tone = isStaff
                ? "chuyÃªn nghiá»‡p, ngáº¯n gá»n, trá»±c tiáº¿p, gá»i lÃ  sáº¿p hoáº·c Ä‘á»“ng nghiá»‡p"
                : "áº¥m Ã¡p, dá»… hiá»ƒu, tráº¥n an, gá»i khÃ¡ch lÃ  Sen vÃ  thÃº cÆ°ng lÃ  bÃ©/boss";

        String mode = switch (plan.route()) {
            case MEDIA_AI -> "phÃ¢n tÃ­ch áº£nh/video thÃº y";
            case MEDICAL_AI -> "tÆ° váº¥n y khoa thÃº y";
            case WEB_AI -> "tÃ¬m kiáº¿m web cÃ³ trÃ­ch nguá»“n";
            case AUTOPILOT_AI -> "há»— trá»£ thao tÃ¡c giao diá»‡n cÃ³ kiá»ƒm soÃ¡t";
            case CHAT_AI -> "chat tÆ° váº¥n nhanh";
            case DB_LOCAL -> "tra cá»©u dá»¯ liá»‡u há»‡ thá»‘ng";
            case SENSITIVE_HANDOFF -> "chuyá»ƒn giao sang agent dá»¯ liá»‡u";
            case QUICK_LOCAL -> "tráº£ lá»i nhanh ná»™i bá»™";
        };

        boolean isClinicalStaff = isStaff && ("BÃ¡c sÄ©".equals(userRoleName) || "Y tÃ¡".equals(userRoleName));

        String allowedActions = switch (plan.route()) {
            case MEDIA_AI -> "mÃ´ táº£ dáº¥u hiá»‡u nhÃ¬n tháº¥y, Ä‘Ã¡nh giÃ¡ má»©c Ä‘á»™ kháº©n, há»i thÃªm thÃ´ng tin cÃ²n thiáº¿u";
            case MEDICAL_AI -> isClinicalStaff
                    ? "há»— trá»£ lÃ¢m sÃ ng chuyÃªn sÃ¢u: cháº©n Ä‘oÃ¡n phÃ¢n biá»‡t, xÃ©t nghiá»‡m cáº§n cÃ¢n nháº¯c, nhÃ³m thuá»‘c/phÃ¡c Ä‘á»“ tham kháº£o, cáº£nh bÃ¡o chá»‘ng chá»‰ Ä‘á»‹nh"
                    : "tÆ° váº¥n chÄƒm sÃ³c/sÆ¡ cá»©u, nÃªu kháº£ nÄƒng, khuyáº¿n nghá»‹ Ä‘i khÃ¡m khi cÃ³ dáº¥u hiá»‡u nguy hiá»ƒm";
            case WEB_AI -> "tá»•ng há»£p thÃ´ng tin tá»« nguá»“n tháº­t vÃ  trÃ­ch link rÃµ rÃ ng";
            case AUTOPILOT_AI -> "chá»‰ dÃ¹ng tag thao tÃ¡c khi ngÆ°á»i dÃ¹ng yÃªu cáº§u rÃµ vÃ  data-ai-id tá»“n táº¡i";
            case CHAT_AI -> "tráº£ lá»i trá»±c tiáº¿p, há»i thÃªm khi thiáº¿u dá»¯ kiá»‡n, hÆ°á»›ng dáº«n dÃ¹ng há»‡ thá»‘ng";
            default -> "tráº£ lá»i theo dá»¯ liá»‡u Ä‘Ã£ Ä‘Æ°á»£c backend cung cáº¥p";
        };

        String medicalForbidden = isClinicalStaff
                ? "khÃ´ng ra quyáº¿t Ä‘á»‹nh thay bÃ¡c sÄ© phá»¥ trÃ¡ch; khÃ´ng kháº³ng Ä‘á»‹nh cháº©n Ä‘oÃ¡n khi thiáº¿u khÃ¡m trá»±c tiáº¿p/xÃ©t nghiá»‡m; khÃ´ng bá» qua cÃ¢n náº·ng, tuá»•i, loÃ i vÃ  chá»‘ng chá»‰ Ä‘á»‹nh khi nháº¯c tá»›i thuá»‘c; "
                : "khÃ´ng cháº©n Ä‘oÃ¡n cháº¯c cháº¯n, khÃ´ng kÃª Ä‘Æ¡n thuá»‘c, khÃ´ng nÃªu liá»u dÃ¹ng/khÃ¡ng sinh/thuá»‘c kÃª Ä‘Æ¡n; ";

        String forbiddenActions = "khÃ´ng bá»‹a dá»¯ liá»‡u há»‡ thá»‘ng; khÃ´ng tá»± nháº­n Ä‘Ã£ tra DB náº¿u route khÃ´ng cho Ä‘á»c DB; "
                + medicalForbidden
                + "khÃ´ng táº¡o link nguá»“n giáº£; "
                + (isLoggedIn ? "" : "khÃ´ng táº¡o lá»‹ch/Ä‘Æ¡n/hÃ nh Ä‘á»™ng tÃ i khoáº£n khi ngÆ°á»i dÃ¹ng chÆ°a Ä‘Äƒng nháº­p; ")
                + "khÃ´ng dÃ¹ng Autopilot náº¿u ngÆ°á»i dÃ¹ng chá»‰ há»i thÃ´ng tin.";

        return new ChatPersonaContext(audience, mode, tone, allowedActions, forbiddenActions);
    }

    private String renderPersonaBlock(ChatPersonaContext persona, ChatRequestPlan plan, String currentPath) {
        return "--- CHAT PERSONA CONTEXT (Báº®T BUá»˜C TUÃ‚N THá»¦) ---\n"
                + "NgÆ°á»i Ä‘ang nÃ³i chuyá»‡n: " + persona.audience() + ".\n"
                + "Cháº¿ Ä‘á»™ xá»­ lÃ½ request: " + persona.mode() + " (" + plan.route() + ").\n"
                + "Provider Æ°u tiÃªn: " + plan.providerHint() + ".\n"
                + "MÃ n hÃ¬nh hiá»‡n táº¡i: " + currentPath + ".\n"
                + "Giá»ng Ä‘iá»‡u: " + persona.tone() + ".\n"
                + "ÄÆ°á»£c phÃ©p: " + persona.allowedActions() + ".\n"
                + "KhÃ´ng Ä‘Æ°á»£c phÃ©p: " + persona.forbiddenActions() + ".\n"
                + "NguyÃªn táº¯c tá»‘c Ä‘á»™/Ä‘á»™ Ä‘Ãºng: tráº£ lá»i ngáº¯n vÃ  Ä‘Ãºng viá»‡c trÆ°á»›c; náº¿u cÃ¢u há»i lÃ  lá»‡nh chuyá»ƒn trang/thao tÃ¡c rÃµ rÃ ng thÃ¬ pháº£n há»“i báº±ng hÃ nh Ä‘á»™ng hoáº·c tag Ä‘iá»u hÆ°á»›ng ngay, khÃ´ng giáº£i thÃ­ch dÃ i; chá»‰ Ä‘á»c DB, web, DOM hoáº·c gá»i AI náº·ng khi route cho phÃ©p; náº¿u thiáº¿u dá»¯ liá»‡u thÃ¬ nÃ³i rÃµ thiáº¿u dá»¯ liá»‡u thay vÃ¬ Ä‘oÃ¡n.\n"
                + "Hiá»ƒu ngÃ´n ngá»¯ tá»± nhiÃªn vÃ  Gen Z: cÃ¡c cÃ¡ch nÃ³i nhÆ° 'check giÃºp', 'qua trang', 'tele qua', 'book lá»‹ch', 'bill', 'acc', 'boss/be nhÃ  tÃ´i', 'khum/hÃ´ng' pháº£i Ä‘Æ°á»£c hiá»ƒu theo Ã½ Ä‘á»‹nh tháº­t, khÃ´ng báº¯t ngÆ°á»i dÃ¹ng nÃ³i Ä‘Ãºng thuáº­t ngá»¯ há»‡ thá»‘ng.\n"
                + "--- Háº¾T PERSONA CONTEXT ---\n\n";
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
            logger.warning("[FAST_DB] KhÃ´ng thá»ƒ tráº£ lá»i nhanh báº±ng DB: " + e.getMessage());
            return "Dá»¯ liá»‡u há»‡ thá»‘ng hiá»‡n chÆ°a sáºµn sÃ ng Ä‘á»ƒ tra cá»©u chÃ­nh xÃ¡c. TÃ´i sáº½ khÃ´ng Ä‘oÃ¡n bá»«a pháº§n nÃ y; báº¡n kiá»ƒm tra láº¡i káº¿t ná»‘i SQL Server hoáº·c thá»­ láº¡i sau Ã­t giÃ¢y.";
        }
        return "TÃ´i chÆ°a tÃ¬m tháº¥y dá»¯ liá»‡u khá»›p rÃµ trong há»‡ thá»‘ng. Báº¡n nháº­p cá»¥ thá»ƒ hÆ¡n tÃªn dá»‹ch vá»¥, bÃ¡c sÄ©, lá»‹ch trá»±c hoáº·c chuyá»ƒn sang Rexi Agent Ä‘á»ƒ quÃ©t dá»¯ liá»‡u sÃ¢u hÆ¡n.";
    }

    private String buildSensitiveDataHandoffReply() {
        return "Dáº¡ pháº§n tra cá»©u khÃ¡ch hÃ ng, thÃº cÆ°ng, bá»‡nh Ã¡n hoáº·c hÃ³a Ä‘Æ¡n lÃ  dá»¯ liá»‡u ná»™i bá»™. Sen/sáº¿p vui lÃ²ng chuyá»ƒn sang **Rexi Agent** Ä‘á»ƒ há»‡ thá»‘ng kiá»ƒm tra quyá»n vÃ  quÃ©t dá»¯ liá»‡u tháº­t, trÃ¡nh chatbot thÆ°á»ng tÃ¬m nháº§m hoáº·c lá»™ dá»¯ liá»‡u.";
    }

    private Map<String, Object> runAgentFromChat(
            String userQuery,
            String username,
            org.springframework.security.core.Authentication auth
    ) {
        if (username == null || auth == null) {
            return Map.of(
                    "reply", "Dáº¡ pháº§n nÃ y cáº§n tra cá»©u dá»¯ liá»‡u ná»™i bá»™ thá»i gian thá»±c. Sen/sáº¿p Ä‘Äƒng nháº­p tÃ i khoáº£n trÆ°á»›c Ä‘á»ƒ Rexi kiá»ƒm tra quyá»n vÃ  láº¥y dá»¯ liá»‡u chÃ­nh xÃ¡c nhÃ©.",
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
            logger.severe("[CHAT->AGENT] Lá»—i tá»± chuyá»ƒn Rexi Agent: " + e.getMessage());
            return Map.of(
                    "reply", "Rexi Ä‘Ã£ tá»± chuyá»ƒn sang Agent Ä‘á»ƒ tra dá»¯ liá»‡u tháº­t nhÆ°ng gáº·p lá»—i há»‡ thá»‘ng. Sáº¿p thá»­ láº¡i sau Ã­t giÃ¢y hoáº·c kiá»ƒm tra backend/AI provider giÃºp em nhÃ©.",
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
                        + "ORDER BY ten_dich_vu LIMIT 30");
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
            return "Rexi chÆ°a tÃ¬m tháº¥y dá»‹ch vá»¥ khá»›p rÃµ trong báº£ng giÃ¡. Sen nháº­p tÃªn dá»‹ch vá»¥ cá»¥ thá»ƒ hÆ¡n, vÃ­ dá»¥: khÃ¡m tá»•ng quÃ¡t, tiÃªm phÃ²ng, xÃ©t nghiá»‡m mÃ¡u.";
        }
        if (matched.isEmpty()) return null;
        StringBuilder sb = new StringBuilder("Rexi tra báº£ng giÃ¡ trá»±c tiáº¿p tá»« há»‡ thá»‘ng:\n");
        int count = 0;
        for (Map<String, Object> row : matched) {
            if (++count > 8) break;
            sb.append("- ").append(row.get("ten_dich_vu"))
                    .append(": ").append(formatMoney(row.get("gia"))).append(" VND");
            Object minutes = row.get("thoi_luong_phut");
            if (minutes != null) sb.append(" (~").append(minutes).append(" phÃºt)");
            sb.append("\n");
        }
        if (matched.size() > 8) sb.append("... cÃ²n ").append(matched.size() - 8).append(" dá»‹ch vá»¥ khÃ¡c, Sen há»i tÃªn dá»‹ch vá»¥ cá»¥ thá»ƒ Ä‘á»ƒ Rexi lá»c tiáº¿p.");
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
                        + "AND (LOWER(COALESCE(nv.chuyen_mon, '')) LIKE '%bÃ¡c sÄ©%' "
                        + "OR LOWER(COALESCE(nv.chuyen_mon, '')) LIKE '%bac si%' "
                        + "OR LOWER(COALESCE(nv.chuyen_mon, '')) LIKE '%doctor%' "
                        + "OR EXISTS (SELECT 1 FROM TaiKhoan tk WHERE tk.id_nhan_vien = nv.id_nhan_vien "
                        + "AND (tk.id_vai_tro IN ('VT-BS', 'VT-2', '2') OR UPPER(COALESCE(tk.id_vai_tro, '')) LIKE '%BS%'))) "
                        + "AND LOWER(COALESCE(nv.ho_ten, '')) NOT LIKE '%kiá»ƒm thá»­%' "
                        + "AND LOWER(COALESCE(nv.ho_ten, '')) NOT LIKE '%admin%' "
                        + "AND LOWER(COALESCE(nv.ho_ten, '')) NOT LIKE '%tiáº¿p tÃ¢n%' "
                        + "ORDER BY llv.ngay_lam, llv.gio_bat_dau LIMIT 12",
                java.sql.Date.valueOf(from), java.sql.Date.valueOf(to));
        if (rows.isEmpty()) {
            return "Rexi chÆ°a tháº¥y lá»‹ch trá»±c phÃ¹ há»£p trong há»‡ thá»‘ng cho khoáº£ng thá»i gian nÃ y. Sen gá»i hotline 0353.374.156 Ä‘á»ƒ Ä‘Æ°á»£c xÃ¡c nháº­n lá»‹ch khÃ¡m má»›i nháº¥t.";
        }
        StringBuilder sb = new StringBuilder("Rexi tra lá»‹ch trá»±c trá»±c tiáº¿p tá»« há»‡ thá»‘ng:\n");
        for (Map<String, Object> row : rows) {
            sb.append("- ").append(row.get("ngay_lam"))
                    .append(": BS. ").append(row.get("ho_ten"))
                    .append(" tá»« ").append(row.get("gio_bat_dau"))
                    .append(" Ä‘áº¿n ").append(row.get("gio_ket_thuc"));
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
                        + "AND (LOWER(COALESCE(chuyen_mon, '')) LIKE '%bÃ¡c sÄ©%' "
                        + "OR LOWER(COALESCE(chuyen_mon, '')) LIKE '%bac si%' "
                        + "OR LOWER(COALESCE(chuyen_mon, '')) LIKE '%doctor%' "
                        + "OR EXISTS (SELECT 1 FROM TaiKhoan tk WHERE tk.id_nhan_vien = NhanVien.id_nhan_vien "
                        + "AND (tk.id_vai_tro IN ('VT-BS', 'VT-2', '2') OR UPPER(COALESCE(tk.id_vai_tro, '')) LIKE '%BS%'))) "
                        + "AND LOWER(COALESCE(ho_ten, '')) NOT LIKE '%kiá»ƒm thá»­%' "
                        + "AND LOWER(COALESCE(ho_ten, '')) NOT LIKE '%admin%' "
                        + "AND LOWER(COALESCE(ho_ten, '')) NOT LIKE '%tiáº¿p tÃ¢n%' "
                        + "AND (chuyen_mon IS NOT NULL OR gioi_thieu IS NOT NULL) "
                        + "ORDER BY ho_ten LIMIT 8");
        if (rows.isEmpty()) return null;
        StringBuilder sb = new StringBuilder("Rexi tra danh sÃ¡ch bÃ¡c sÄ©/nhÃ¢n sá»± chuyÃªn mÃ´n tá»« há»‡ thá»‘ng:\n");
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
        String mediaType = hasImage && hasVideo ? "áº£nh vÃ  video" : hasVideo ? "video" : "áº£nh";
        String base = "Báº¡n Ä‘ang phÃ¢n tÃ­ch " + mediaType + " thÃº y báº±ng nÄƒng lá»±c Ä‘a phÆ°Æ¡ng tiá»‡n. "
                + "HÃ£y mÃ´ táº£ dáº¥u hiá»‡u nhÃ¬n tháº¥y Ä‘Æ°á»£c, má»©c Ä‘á»™ kháº©n cáº¥p, cÃ¡c kháº£ nÄƒng nguyÃªn nhÃ¢n theo thá»© tá»± Æ°u tiÃªn, "
                + "viá»‡c chá»§ nuÃ´i cÃ³ thá»ƒ lÃ m ngay, dáº¥u hiá»‡u cáº§n Ä‘i cáº¥p cá»©u vÃ  thÃ´ng tin cÃ²n thiáº¿u cáº§n há»i thÃªm. "
                + "KhÃ´ng Ä‘Æ°á»£c cháº©n Ä‘oÃ¡n cháº¯c cháº¯n hoáº·c kÃª Ä‘Æ¡n chá»‰ dá»±a trÃªn áº£nh/video; náº¿u hÃ¬nh/video má» hoáº·c khÃ´ng Ä‘á»§ dá»¯ liá»‡u pháº£i nÃ³i rÃµ.";
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
                .replace("Ä‘", "d")
                .replace("Ä", "D");
        return normalized
                .replaceAll("[Ã Ã¡áº¡áº£Ã£Ã¢áº§áº¥áº­áº©áº«Äƒáº±áº¯áº·áº³áºµ]", "a")
                .replaceAll("[Ã¨Ã©áº¹áº»áº½Ãªá»áº¿á»‡á»ƒá»…]", "e")
                .replaceAll("[Ã¬Ã­á»‹á»‰Ä©]", "i")
                .replaceAll("[Ã²Ã³á»á»ÃµÃ´á»“á»‘á»™á»•á»—Æ¡á»á»›á»£á»Ÿá»¡]", "o")
                .replaceAll("[Ã¹Ãºá»¥á»§Å©Æ°á»«á»©á»±á»­á»¯]", "u")
                .replaceAll("[á»³Ã½á»µá»·á»¹]", "y")
                .replaceAll("[Ä‘]", "d");
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
        reply.append("[EMERGENCY] Sen bÃ¬nh tÄ©nh lÃ m ngay cÃ¡c bÆ°á»›c sÆ¡ cá»©u dÆ°á»›i Ä‘Ã¢y vÃ  gá»i Rexi theo hotline 0353.374.156.\n\n");

        if ("airway".equals(triage.category())) {
            reply.append("**Nghi hÃ³c dá»‹ váº­t/ngáº¡t thá»Ÿ:**\n")
                    .append("1. Má»Ÿ miá»‡ng bÃ© kiá»ƒm tra nhanh. Chá»‰ láº¥y dá»‹ váº­t ra náº¿u nhÃ¬n tháº¥y rÃµ vÃ  gáº¯p Ä‘Æ°á»£c an toÃ n.\n")
                    .append("2. KhÃ´ng mÃ³c tay sÃ¢u vÃ¬ cÃ³ thá»ƒ Ä‘áº©y dá»‹ váº­t vÃ o trong.\n")
                    .append("3. Náº¿u bÃ© khÃ´ng thá»Ÿ hoáº·c tÃ­m tÃ¡i, thá»±c hiá»‡n Heimlich cho thÃº cÆ°ng: Ä‘áº·t hai tay ngay sau xÆ°Æ¡ng sÆ°á»n, Ã©p nhanh hÆ°á»›ng lÃªn trÃªn 3-5 láº§n, rá»“i kiá»ƒm tra miá»‡ng.\n")
                    .append("4. Náº¿u bÃ© nhá», cÃ³ thá»ƒ nÃ¢ng pháº§n thÃ¢n sau cao hÆ¡n Ä‘áº§u vÃ  vá»— cháº¯c 3-5 cÃ¡i giá»¯a hai báº£ vai.\n\n");
        } else if ("poison".equals(triage.category())) {
            reply.append("**Nghi ngá»™ Ä‘á»™c:**\n")
                    .append("1. Ngá»«ng cho Äƒn/uá»‘ng thÃªm vÃ  Ä‘Æ°a bÃ© trÃ¡nh xa nguá»“n Ä‘á»™c.\n")
                    .append("2. KhÃ´ng tá»± gÃ¢y nÃ´n náº¿u chÆ°a cÃ³ bÃ¡c sÄ© hÆ°á»›ng dáº«n.\n")
                    .append("3. Mang theo bao bÃ¬/cháº¥t nghi Ä‘á»™c khi Ä‘áº¿n phÃ²ng khÃ¡m.\n\n");
        } else if ("neuro".equals(triage.category())) {
            reply.append("**Co giáº­t/ngáº¥t/lá»‹m:**\n")
                    .append("1. Dá»n váº­t cá»©ng quanh bÃ©, khÃ´ng giá»¯ cháº·t miá»‡ng hoáº·c kÃ©o lÆ°á»¡i.\n")
                    .append("2. Ghi láº¡i thá»i gian co giáº­t vÃ  quay video ngáº¯n náº¿u an toÃ n.\n")
                    .append("3. Náº¿u cÆ¡n kÃ©o dÃ i hÆ¡n 2-3 phÃºt hoáº·c láº·p láº¡i, Ä‘Æ°a bÃ© Ä‘i cáº¥p cá»©u ngay.\n\n");
        } else if ("heatstroke".equals(triage.category())) {
            reply.append("**Sá»‘c nhiá»‡t/Say náº¯ng:**\n")
                    .append("1. ÄÆ°a bÃ© vÃ o nÆ¡i bÃ³ng rÃ¢m, mÃ¡t máº» hoáº·c phÃ²ng cÃ³ Ä‘iá»u hÃ²a ngay láº­p tá»©c.\n")
                    .append("2. DÃ¹ng khÄƒn Æ°á»›t (nÆ°á»›c mÃ¡t, KHÃ”NG dÃ¹ng nÆ°á»›c Ä‘Ã¡) lau vÃ  Ä‘áº¯p lÃªn vÃ¹ng bá»¥ng, nÃ¡ch, báº¹n vÃ  Ä‘á»‡m chÃ¢n bÃ©.\n")
                    .append("3. Cho bÃ© uá»‘ng má»™t Ã­t nÆ°á»›c mÃ¡t náº¿u bÃ© cÃ²n tá»‰nh tÃ¡o, rá»“i Ä‘Æ°a Ä‘i cáº¥p cá»©u.\n\n");
        } else if ("trauma".equals(triage.category())) {
            reply.append("**Cháº£y mÃ¡u/tai náº¡n:**\n")
                    .append("1. DÃ¹ng gáº¡c sáº¡ch Ã©p trá»±c tiáº¿p lÃªn Ä‘iá»ƒm cháº£y mÃ¡u 5-10 phÃºt.\n")
                    .append("2. Háº¡n cháº¿ di chuyá»ƒn bÃ© náº¿u nghi gÃ£y xÆ°Æ¡ng hoáº·c cháº¥n thÆ°Æ¡ng náº·ng.\n")
                    .append("3. KhÃ´ng tá»± bÃ´i thuá»‘c dÃ¢n gian lÃªn váº¿t thÆ°Æ¡ng.\n\n");
        } else {
            reply.append("**ChÆ°a rÃµ tÃ¬nh huá»‘ng nhÆ°ng cÃ³ dáº¥u hiá»‡u kháº©n cáº¥p:**\n")
                    .append("1. Äáº·t bÃ© á»Ÿ nÆ¡i thoÃ¡ng, yÃªn tÄ©nh, trÃ¡nh tá»¥ táº­p hoáº·c lay máº¡nh.\n")
                    .append("2. Kiá»ƒm tra nhanh: bÃ© cÃ²n thá»Ÿ khÃ´ng, nÆ°á»›u/lÆ°á»¡i cÃ³ tÃ­m tÃ¡i khÃ´ng, cÃ³ cháº£y mÃ¡u hoáº·c co giáº­t khÃ´ng.\n")
                    .append("3. Nháº¯n ngay triá»‡u chá»©ng chÃ­nh: khÃ³ thá»Ÿ, hÃ³c, ngá»™ Ä‘á»™c, co giáº­t, cháº£y mÃ¡u, tai náº¡n hoáº·c lá»‹m Ä‘i.\n\n");
        }

        reply.append("Sen cho Rexi biáº¿t vá»‹ trÃ­ hiá»‡n táº¡i cá»§a Sen Ä‘á»ƒ Rexi hÆ°á»›ng dáº«n Ä‘Æ°á»ng Ä‘áº¿n cÆ¡ sá»Ÿ thÃº y gáº§n nháº¥t. Náº¿u á»Ÿ Gia LÃ¢m/HÃ  Ná»™i, Ä‘Æ°a bÃ© tá»›i PhÃ²ng khÃ¡m ThÃº y Rexi, Sá»‘ 68, NgÃµ 10, ÄÆ°á»ng NgÃ´ XuÃ¢n Quáº£ng, TrÃ¢u Quá»³, Gia LÃ¢m, HÃ  Ná»™i.");
        return reply.toString();
    }
}



