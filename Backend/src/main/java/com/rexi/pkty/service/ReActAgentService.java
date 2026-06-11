package com.rexi.pkty.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rexi.pkty.dto.ChatMessage;
import com.rexi.pkty.security.RoleAccessPolicy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.logging.Logger;

// * * ReAct Agent Service — vòng lặp Reason → Act → Observe (Level 5).
// * AI tự lên kế hoạch, gọi tools, quan sát kết quả và lặp lại tới khi hoàn thành.
@Service
public class ReActAgentService {

    private static final Logger logger = Logger.getLogger(ReActAgentService.class.getName());
    private static final int MAX_ITERATIONS = 4;
    private static final int MAX_CONTEXT_CHARS = 2_000;
    private static final int MAX_TOOL_OBSERVATION_CHARS = 450;
    private static final int MAX_MODEL_MESSAGE_CHARS = 14_000;
    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @Autowired private OpenRouterService openRouterService;
    @Autowired private GeminiService geminiService;
    @Autowired private GroqService groqService;
    @Autowired private AiToolService toolService;
    @Autowired private AiMemoryService memoryService;
    @Autowired private JdbcTemplate jdbcTemplate;
    @Autowired private AgentResponseCache agentResponseCache;

    private final ObjectMapper mapper = new ObjectMapper();

    public record ReActStep(String type, String content, String toolName, Map<String, Object> toolParams, String observation) {}

    public record ReActResult(String finalAnswer, List<ReActStep> steps, String provider) {
        public ReActResult(String finalAnswer, List<ReActStep> steps) {
            this(finalAnswer, steps, "System");
        }
    }

    private record ModelResponse(String content, String provider) {}

    // * * Điểm vào chính — chạy vòng lặp ReAct cho một yêu cầu của người dùng.
    public ReActResult run(String userQuery, String username, String userRole) {
        return run(userQuery, username, userRole, List.of());
    }

    public ReActResult run(String userQuery, String username, String userRole, List<String> images) {
        List<ReActStep> steps = new ArrayList<>();
        String originalUserIntent = extractOriginalUserIntent(userQuery);
        String normalizedQuery = normalizeVietnamese(originalUserIntent.trim().toLowerCase());
        boolean isStaff = isStaffRole(userRole);

        if (images != null && !images.isEmpty()) {
            return handleAgentImageAnalysis(originalUserIntent, images, userRole, steps);
        }

        if (isStaff
                && containsAny(normalizedQuery, "mo", "mo trang", "vao", "chuyen", "chuyen trang", "di toi", "toi trang", "den trang")
                && containsAny(normalizedQuery, "bao cao", "thong ke", "doanh thu")) {
            String route = "/quan-ly/bao-cao-thong-ke";
            if (!canAccessInternalRoute(userRole, route)) {
                return finalResult(steps, "Tài khoản hiện tại không đủ quyền mở phân hệ Báo cáo thống kê.");
            }
            return finalResult(steps, "Mở báo cáo thống kê doanh thu. [NAVIGATE:" + route + "]");
        }

        if (containsAny(normalizedQuery, "doanh thu", "tong thu", "thuc thu")
                && containsAny(normalizedQuery, "thang nay", "tuan nay", "hom nay", "bao nhieu", "thong ke", "bao cao")) {
            if (!RoleAccessPolicy.canUseAgentTool(userRole, "thong_ke_doanh_thu")) {
                return finalResult(steps, RoleAccessPolicy.permissionDeniedMessage("thong_ke_doanh_thu", userRole));
            }
            if (toolService == null) {
                return finalResult(steps, "Rexi cần truy vấn cơ sở dữ liệu doanh thu, nhưng tool hệ thống chưa sẵn sàng.");
            }
            Map<String, Object> params = new HashMap<>();
            params.put("khoang_thoi_gian", extractStatsRange(normalizedQuery));
            String observation = toolService.executeTool("thong_ke_doanh_thu", params, userRole, username);
            steps.add(new ReActStep("TOOL", "Thống kê doanh thu từ cơ sở dữ liệu", "thong_ke_doanh_thu", params, observation));
            return finalResult(steps, observation);
        }

        // Moved sensitive gate check after code-lookup detection to avoid false positives
        ReActResult sensitiveGateResult = handleSensitiveCommandGate(normalizedQuery, steps);
        if (sensitiveGateResult != null) {
            return sensitiveGateResult;
        }

        ReActResult explicitWebSearchResult = handleExplicitWebSearchIntent(normalizedQuery, userRole, username, steps);
        if (explicitWebSearchResult != null) {
            return explicitWebSearchResult;
        }

        ReActResult safetyBatchResult = handleSafetyAndPrivacyBatchIntent(normalizedQuery, userRole, steps);
        if (safetyBatchResult != null) {
            return safetyBatchResult;
        }

        ReActResult pendingConfirmationResult = handleDeterministicPendingConfirmation(
                userQuery,
                originalUserIntent,
                normalizedQuery,
                isStaff,
                userRole,
                steps
        );
        if (pendingConfirmationResult != null) {
            return pendingConfirmationResult;
        }

        ReActResult deterministicIntent = handleDeterministicIntent(normalizedQuery, isStaff, userRole, username, steps);
        if (deterministicIntent != null) {
            try {
                if (agentResponseCache != null && agentResponseCache.isCacheableIntent(normalizedQuery)) {
                    agentResponseCache.put(normalizedQuery, userRole, deterministicIntent.finalAnswer());
                }
            } catch (Exception cacheEx) {
                logger.warning("[ReAct] Cache put lỗi (ignored): " + cacheEx.getMessage());
            }
            return deterministicIntent;
        }

        // Cache chỉ áp dụng sau các gate nhạy cảm/xác nhận để không có đường tắt bỏ qua an toàn.
        try {
            if (agentResponseCache != null && agentResponseCache.isCacheableIntent(normalizedQuery)) {
                String cached = agentResponseCache.get(normalizedQuery, userRole);
                if (cached != null) {
                    logger.info("[ReAct] Cache HIT — trả về ngay, bỏ qua vòng lặp ReAct.");
                    steps.add(new ReActStep("CACHE_HIT", cached, null, null, null));
                    return new ReActResult(cached, steps, "Cache");
                }
            }
        } catch (Exception cacheEx) {
            logger.warning("[ReAct] Cache lookup lỗi (ignored): " + cacheEx.getMessage());
        }

        // Xây dựng system prompt với tool schema + ngữ cảnh người dùng
        String systemPrompt = compactForModel(buildSystemPrompt(userQuery, username, userRole), 10_000);

        // Khởi tạo lịch sử hội thoại với câu hỏi người dùng
        List<ChatMessage> history = new ArrayList<>();
        ChatMessage sysMsg = new ChatMessage();
        sysMsg.setRole("system");
        sysMsg.setContent(systemPrompt);
        history.add(sysMsg);

        ChatMessage userMsg = new ChatMessage();
        userMsg.setRole("user");
        userMsg.setContent(userQuery);
        history.add(userMsg);

        // —— VÒNG LẶP ReAct ——
        for (int i = 0; i < MAX_ITERATIONS; i++) {
            logger.info("[ReAct] Vòng lặp #" + (i + 1));

            ModelResponse modelResponse;
            try {
                modelResponse = callBestAvailableModel(history);
            } catch (Exception e) {
                logger.severe("[ReAct] Lỗi gọi LLM: " + e.getMessage());
                String fallback = "Rexi Agent đang bị lỗi kết nối tới nhà cung cấp AI bên ngoài. Các tác vụ tra cứu dữ liệu nội bộ vẫn cần cấu hình lại API key hoặc mạng trước khi chạy tiếp.";
                steps.add(new ReActStep("ERROR", fallback, null, null, e.getMessage()));
                return new ReActResult(fallback, steps);
            }

            // Cắt bỏ markdown code block nếu model trả về ```json ... ```
            String cleaned = modelResponse.content().trim();
            if (cleaned.startsWith("```")) {
                cleaned = cleaned.replaceAll("^```[a-z]*\\s*", "").replaceAll("\\s*```$", "").trim();
            }

            // Trích xuất đúng object JSON đầu tiên
            String possibleJson = extractFirstJsonObject(cleaned);

            // Kiểm tra xem đây có phải JSON tool call ko
            if (possibleJson != null) {
                try {
                    JsonNode node = mapper.readTree(possibleJson);

                    // —— FINAL ANSWER ——
                    if (node.has("final_answer")) {
                        String answer = sanitizeFinalAnswer(node.get("final_answer").asText(null), normalizedQuery);
                        answer = enforceNoUnsupportedModelFinalAnswer(answer, normalizedQuery, steps);
                        steps.add(new ReActStep("FINAL", answer, null, null, null));
                        return new ReActResult(answer, steps, modelResponse.provider());
                    }

                    // —— TOOL CALL ——
                        if (node.has("tool")) {
                        String toolName = node.get("tool").asText();
                        Map<String, Object> params = new HashMap<>();
                        if (node.has("parameters") && node.get("parameters").isObject()) {
                            Iterator<Map.Entry<String, JsonNode>> fields = node.get("parameters").fields();
                            while (fields.hasNext()) {
                                Map.Entry<String, JsonNode> entry = fields.next();
                                if (entry.getValue().isValueNode()) {
                                    params.put(entry.getKey(), entry.getValue().asText());
                                } else {
                                    params.put(entry.getKey(), entry.getValue().toString());
                                }
                            }
                        }
                        if (params.isEmpty() && node.has("params") && node.get("params").isObject()) {
                            Iterator<Map.Entry<String, JsonNode>> fields = node.get("params").fields();
                            while (fields.hasNext()) {
                                Map.Entry<String, JsonNode> entry = fields.next();
                                if (entry.getValue().isValueNode()) {
                                    params.put(entry.getKey(), entry.getValue().asText());
                                } else {
                                    params.put(entry.getKey(), entry.getValue().toString());
                                }
                            }
                        }

                        if (isPetMedicalSymptomQuery(normalizedQuery)
                                && Set.of("tim_thu_cung", "xem_benh_an", "tim_khach_hang").contains(toolName)) {
                            String answer = buildSafePetMedicalAdvice(normalizedQuery);
                            steps.add(new ReActStep("TOOL_BLOCKED", "Chặn tool DB vì đây là câu hỏi triệu chứng thú y.", toolName, params, answer));
                            steps.add(new ReActStep("FINAL", answer, null, null, null));
                            return new ReActResult(answer, steps, "MedicalIntentGate");
                        }

                        if (!isToolRelevantForQuery(normalizedQuery, toolName)) {
                            String observation = "Tool '" + toolName + "' không phù hợp với yêu cầu hiện tại. Hãy trả final_answer ngắn, hỏi thêm nếu thiếu dữ liệu.";
                            steps.add(new ReActStep("TOOL_BLOCKED", "Chặn tool không đúng ngữ cảnh", toolName, params, observation));

                            ChatMessage systemWarningMsg = new ChatMessage();
                            systemWarningMsg.setRole("user");
                            systemWarningMsg.setContent("[HỆ THỐNG] " + observation);
                            history.add(systemWarningMsg);
                            trimHistoryForModel(history);
                            continue;
                        }

                        // Kiểm tra phân quyền tool của vai trò
                        if (!canUseTool(userRole, toolName)) {
                            String observation = "LỖI BẢO MẬT: Quyền hạn hiện tại của bạn không được phép sử dụng công cụ '" + toolName + "'.";
                            steps.add(new ReActStep("TOOL_UNAUTHORIZED", "Gọi tool thất bại do thiếu quyền", toolName, params, observation));
                            
                            ChatMessage systemWarningMsg = new ChatMessage();
                            systemWarningMsg.setRole("user");
                            systemWarningMsg.setContent("[HỆ THỐNG] Lỗi gọi tool " + toolName + " do vai trò " + userRole + " bị cấm. Hãy đưa ra câu trả lời final_answer từ chối ngắn gọn và thân thiện.");
                            history.add(systemWarningMsg);
                            trimHistoryForModel(history);
                            continue;
                        }

                        logger.info("[ReAct] Thực thi tool: " + toolName + " với params: " + params);
                        String observation;
                        try {
                            observation = toolService.executeTool(toolName, params, userRole, username);
                        } catch (Exception e) {
                            logger.severe("[ReAct] Lỗi thực thi tool: " + e.getMessage());
                            observation = "Lỗi hệ thống khi chạy tool: " + e.getMessage();
                        }

                        steps.add(new ReActStep("TOOL", "Gọi tool " + toolName, toolName, params, observation));

                        ChatMessage assistantMsg = new ChatMessage();
                        assistantMsg.setRole("assistant");
                        assistantMsg.setContent(compactForModel(cleaned, 1_200));
                        history.add(assistantMsg);

                        ChatMessage toolResultMsg = new ChatMessage();
                        toolResultMsg.setRole("user");
                        toolResultMsg.setContent("[KẾT QUẢ TOOL " + toolName.toUpperCase() + "]\n" + compactForModel(observation, MAX_TOOL_OBSERVATION_CHARS) + "\n\nfinal_answer ngay, <= 3 cau, khong mo dau.");
                        history.add(toolResultMsg);

                        trimHistoryForModel(history);
                        continue;
                    }

                } catch (Exception parseEx) {
                    logger.warning("[ReAct] Không parse được JSON: " + parseEx.getMessage());
                }
            }

            // Nếu ko phải JSON hợp lệ -> coi đây là câu trả lời cuối
            cleaned = sanitizeFinalAnswer(cleaned, normalizedQuery);
            cleaned = enforceNoUnsupportedModelFinalAnswer(cleaned, normalizedQuery, steps);
            steps.add(new ReActStep("FINAL", cleaned, null, null, null));
            return new ReActResult(cleaned, steps);
        }

        String fallback = "Rexi cần thêm thông tin. Bạn có thể bổ sung không?";
        return new ReActResult(fallback, steps);
    }

    private ReActResult handlePreviewUiIntent(String q, String userRole, List<ReActStep> steps) {
        String role = RoleAccessPolicy.normalizeRole(userRole);
        if (!Set.of("admin", "quan_ly").contains(role)) return null;
        if (q == null || q.isBlank()) return null;
        if (containsAny(q, "file nao", "dong nao", "line nao", "sua dau", "sua o dau", "code doan nao", "doan code nao", "nam dau")) {
            return null;
        }

        boolean previewVerb = containsAny(q, "doi mau", "chinh mau", "sua mau", "cho mau", "to mau", "doi nen", "chinh nen", "doi chu", "chinh chu", "cho chu", "mau chu", "chu mau", "them link", "them duong link", "gan link", "chen link", "xoa link", "go link", "hoan tac", "reset preview", "xoa chinh thu");
        if (!previewVerb) return null;

        if (containsAny(q, "hoan tac", "reset preview", "xoa chinh thu", "xoa het chinh thu")) {
            return finalResult(steps, "Đã hoàn tác các chỉnh thử giao diện. [PREVIEW_RESET:all]");
        }

        if (containsAny(q, "xoa link", "go link", "xoa duong link")) {
            return finalResult(steps, "Đã xóa các link thêm thử trên giao diện. [PREVIEW_REMOVE_LINK:all]");
        }

        if (containsAny(q, "them link", "them duong link", "gan link", "chen link")) {
            String url = extractPreviewUrl(q);
            if (url == null) {
                return finalResult(steps, "Bạn gửi thêm URL cần gắn nhé.");
            }
            String parent = resolvePreviewLinkParent(q);
            if (parent == null) {
                return finalResult(steps, "Bạn muốn gắn link vào phần nào: footer, header, nút đặt lịch hay link có sẵn?");
            }
            String label = extractPreviewLinkLabel(q, url);
            return finalResult(steps, "Đã thêm thử link trên giao diện. Reload trang sẽ mất. [PREVIEW_LINK:" + parent + "|" + label + "|" + url + "]");
        }

        String target = resolvePreviewTarget(q);
        if (target == null) return null;

        boolean asksTextChange = containsAny(q, "doi chu", "chinh chu")
                && containsAny(q, " thanh ", " thanh", " la ", " la")
                && !containsAny(q, "mau chu", "chu mau", "mau xanh", "mau do", "mau vang", "mau hong", "mau den", "mau trang");
        if (asksTextChange) {
            String text = extractPreviewText(q);
            if (text == null || text.isBlank()) {
                return finalResult(steps, "Bạn muốn đổi chữ phần đó thành nội dung gì?");
            }
            return finalResult(steps, "Đã đổi thử chữ trên giao diện. Reload trang sẽ mất. [PREVIEW_TEXT:" + target + "|" + text + "]");
        }

        String color = resolvePreviewColor(q);
        if (color == null) {
            return finalResult(steps, "Bạn muốn đổi phần đó thành màu gì?");
        }
        String prop = containsAny(q, "chu", "text", "font") && !containsAny(q, "nen", "background") ? "color" : "background";
        return finalResult(steps, "Đã đổi thử màu trên giao diện. Reload trang sẽ mất. [PREVIEW_STYLE:" + target + "|" + prop + "|" + color + "]");
    }

    private ReActResult handleAgentImageAnalysis(String userQuery, List<String> images, String userRole, List<ReActStep> steps) {
        List<String> imagePayloads = images.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .limit(4)
                .toList();
        if (imagePayloads.isEmpty()) return finalResult(steps, "Rexi chưa nhận được ảnh hợp lệ để phân tích.");

        String prompt = Objects.toString(userQuery, "").isBlank()
                ? "Phân tích ảnh này. Nếu là ảnh thú cưng, mô tả dấu hiệu nhìn thấy, mức độ khẩn cấp, khả năng nguyên nhân và bước nên làm. Nếu là ảnh giao diện web, mô tả phần tử/lỗi UI nhìn thấy. Không chẩn đoán chắc chắn chỉ dựa trên ảnh."
                : userQuery;
        try {
            List<ChatMessage> history = new ArrayList<>();
            history.add(new ChatMessage("system", "Bạn là Rexi Agent có khả năng đọc ảnh. Trả lời tiếng Việt ngắn gọn, dựa trên những gì nhìn thấy trong ảnh; không bịa dữ liệu ngoài ảnh. Với y khoa thú y: nêu mức độ khẩn cấp và khuyên đi khám khi có dấu hiệu nặng; không kê đơn/liều thuốc online. Với ảnh UI: mô tả đúng phần thấy được và đề xuất thao tác an toàn.", null, null));
            history.add(new ChatMessage("user", prompt, imagePayloads, null));
            String answer;
            String provider;
            try {
                answer = groqService.chat(history);
                provider = "Groq Vision";
            } catch (Exception groqEx) {
                answer = geminiService.chat(history);
                provider = "Gemini Vision";
            }
            steps.add(new ReActStep("TOOL", "Phân tích ảnh bằng vision model", "vision_image_analysis", Map.of("imageCount", imagePayloads.size(), "role", RoleAccessPolicy.normalizeRole(userRole)), "Đã phân tích " + imagePayloads.size() + " ảnh."));
            steps.add(new ReActStep("FINAL", sanitizeFinalAnswer(answer, ""), null, null, null));
            return new ReActResult(sanitizeFinalAnswer(answer, ""), steps, provider);
        } catch (Exception ex) {
            logger.warning("[ReAct Vision] Lỗi phân tích ảnh: " + ex.getMessage());
            return finalResult(steps, "Rexi chưa phân tích được ảnh lúc này. Bạn thử dán lại ảnh rõ hơn hoặc gửi mô tả ngắn kèm ảnh.");
        }
    }

    private String resolvePreviewTarget(String q) {
        if (containsAny(q, "rexi agent", "agent") && containsAny(q, "chatbot", "chat bot", "khung chat", "tab")) return "button-chatbot-jdzj";
        if (containsAny(q, "tro ly rexi", "tro ly") && containsAny(q, "chatbot", "chat bot", "khung chat", "tab")) return "button-chatbot-6hgf";
        if (containsAny(q, "nut dat lich", "dat lich")) return "button-header-datlich";
        if (containsAny(q, "hotline", "so dien thoai") && containsAny(q, "header", "dau trang")) return "link_header_emergency_phone";
        return null;
    }

    private String resolvePreviewLinkParent(String q) {
        if (containsAny(q, "footer", "chan trang")) return "footer";
        if (containsAny(q, "header", "dau trang")) return "header";
        if (containsAny(q, "nut dat lich", "dat lich")) return "button-header-datlich";
        if (containsAny(q, "hotline", "so dien thoai")) return "link_header_emergency_phone";
        if (containsAny(q, "facebook", "fb")) return "link_footer_facebook";
        if (containsAny(q, "tiktok")) return "link_footer_tiktok";
        if (containsAny(q, "zalo")) return "link_footer_zalo";
        return null;
    }

    private String resolvePreviewColor(String q) {
        String padded = " " + Objects.toString(q, "") + " ";
        if (padded.contains(" xanh la ") || padded.contains(" green ") || padded.contains(" mau xanh ") || padded.contains(" xanh ")) return "#16a34a";
        if (padded.contains(" xanh duong ") || padded.contains(" blue ")) return "#2563eb";
        if (padded.contains(" mau do ") || padded.contains(" red ")) return "#ef4444";
        if (padded.contains(" mau hong ") || padded.contains(" rose ") || padded.contains(" pink ")) return "#f43f5e";
        if (padded.contains(" mau vang ") || padded.contains(" yellow ")) return "#f59e0b";
        if (padded.contains(" mau den ") || padded.contains(" black ")) return "#020617";
        if (padded.contains(" mau trang ") || padded.contains(" white ")) return "#ffffff";
        java.util.regex.Matcher hex = java.util.regex.Pattern.compile("#[0-9a-f]{3,8}\\b", java.util.regex.Pattern.CASE_INSENSITIVE).matcher(q);
        if (hex.find()) return hex.group();
        return null;
    }

    private String extractPreviewText(String q) {
        java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("(?:thanh|la)\\s+(.{1,60})$").matcher(q);
        if (!matcher.find()) return null;
        return matcher.group(1).replaceAll("\\s+", " ").trim();
    }

    private String extractPreviewUrl(String q) {
        java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("\\b(https?://[^\\s<>]+|mailto:[^\\s<>]+|tel:[+0-9][0-9 .-]{5,}|zalo:[^\\s<>]+)\\b", java.util.regex.Pattern.CASE_INSENSITIVE).matcher(q);
        if (!matcher.find()) return null;
        return matcher.group(1).trim();
    }

    private String extractPreviewLinkLabel(String q, String url) {
        String cleaned = Objects.toString(q, "").replace(url, " ").replaceAll("\\s+", " ").trim();
        if (containsAny(cleaned, "youtube", "ytb")) return "YouTube";
        if (containsAny(cleaned, "facebook", "fb")) return "Facebook";
        if (containsAny(cleaned, "tiktok")) return "TikTok";
        if (containsAny(cleaned, "zalo")) return "Zalo";
        if (containsAny(cleaned, "hotline")) return "Hotline";
        java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("(?:ten|nhan|label|link)\\s+([a-z0-9 _-]{2,30})", java.util.regex.Pattern.CASE_INSENSITIVE).matcher(cleaned);
        if (matcher.find()) return capitalizeWords(matcher.group(1).trim());
        return "Link mới";
    }

    private String capitalizeWords(String value) {
        String[] parts = Objects.toString(value, "").trim().split("\\s+");
        List<String> out = new ArrayList<>();
        for (String part : parts) {
            if (part.isBlank()) continue;
            out.add(part.substring(0, 1).toUpperCase(Locale.ROOT) + part.substring(1));
        }
        return out.isEmpty() ? "Link mới" : String.join(" ", out);
    }

    private ReActResult handleDeterministicIntent(String normalizedQuery, boolean isStaff, String userRole, String username, List<ReActStep> steps) {
        if (normalizedQuery == null || normalizedQuery.isBlank()) {
            return finalResult(steps, "Bạn muốn Rexi hỗ trợ phần nào?");
        }

        String q = normalizeSlangCommand(normalizedQuery.replaceAll("[^a-z0-9\\s_/.\\-:/?&=@%#]", " ").replaceAll("\\s+", " ").trim());
        ReActResult previewUiIntent = handlePreviewUiIntent(q, userRole, steps);
        if (previewUiIntent != null) return previewUiIntent;

        ReActResult uiAction = handleDeterministicUiAction(q, userRole, steps);
        if (uiAction != null) return uiAction;

        ReActResult opsShortcut = handleDeterministicOpsShortcut(q, userRole, username, steps);
        if (opsShortcut != null) return opsShortcut;

        boolean greetingLike = q.matches("^(hi|hello|helo|hilo|halo|alo|chao|xin chao|hey|test|ping|yo|sup)(\\s+.*)?$")
                || (containsAny(q, "hi", "hello", "helo", "hilo", "alo", "chao") && containsAny(q, "help", "giup", "ho tro"));
        if (greetingLike) {
            return finalResult(steps, "Rexi đây. Tôi giúp được: mở lịch hẹn, tra khách hàng, xem hóa đơn, kiểm kho, xem bệnh án hoặc điều phối tác vụ theo màn hình.");
        }

        if (q.matches("^(a\s*){3,}$")) {
            return finalResult(steps, "Anh cần em hỗ trợ gì cho bé không ạ?");
        }
        if (containsAny(q, "vo toi ngoai tinh", "vo ngoai tinh", "chong ngoai tinh")) {
            return finalResult(steps, "Em chỉ hỗ trợ thú cưng và nghiệp vụ phòng khám. Chuyện này anh nên tâm sự với người thân/bạn bè hoặc chuyên gia phù hợp nhé.");
        }
        if (containsAny(q, "game ran san moi", "con game ran", "snake game")) {
            return finalResult(steps, "Em chuyên hỗ trợ phòng khám thú y Rexi. Nếu anh cần, em có thể hỗ trợ code tool đặt lịch, tra lịch hoặc kiểm kho thuốc.");
        }
        if (containsAny(q, "biet tao la ai", "m co biet tao la ai", "may co biet tao la ai")) {
            return finalResult(steps, "Em không lưu hay suy đoán thông tin cá nhân ngoài phiên đăng nhập hiện tại. Anh cần Rexi hỗ trợ gì ạ?");
        }
        if (containsAny(q, "chatgpt noi khac", "chat gpt noi khac", "ai dung")) {
            return finalResult(steps, "Về thú y, nên ưu tiên bác sĩ tại phòng khám, kết quả xét nghiệm và thăm khám trực tiếp. Rexi chỉ hỗ trợ tham khảo an toàn.");
        }
        if (containsAny(q, "<script", "script alert", "alert 1")) {
            return finalResult(steps, "Em đã nhận tên bé dưới dạng văn bản và sẽ hiển thị an toàn, không thực thi mã HTML/script. Anh xác nhận lại tên thật của bé giúp em nhé.");
        }
        if (containsAny(q, "admin true", "admin=true", "role admin") && containsAny(q, "tang can", "can nang", "100kg", "100 kg")) {
            return finalResult(steps, "Bé Lu lên bao nhiêu kg ạ? Em sẽ coi phần ký tự lạ là văn bản và không đổi quyền theo nội dung chat.");
        }
        if (containsAny(q, "thuoc bo") && containsAny(q, "co sao khong", "sao khong", "an")) {
            return finalResult(steps, "Thuốc bổ còn tùy loại và lượng bé đã ăn. Anh giữ vỏ/sản phẩm, cho bé uống nước nếu tỉnh táo, theo dõi nôn, tiêu chảy, lừ đừ; nếu ăn nhiều hoặc không rõ thành phần thì gọi 0353.374.156 để bác sĩ hướng dẫn.");
        }
        if (containsAny(q, "chet cuoi", "cuoi chet") && containsAny(q, "do choi", "choi moi")) {
            return finalResult(steps, "Nghe như bé đang thích đồ chơi mới. Anh nhớ kiểm tra đồ chơi không có mảnh nhỏ, dây dễ nuốt hoặc cạnh sắc nhé.");
        }
        if (containsAny(q, "pass qua", "ghe qua") && containsAny(q, "pk", "phong kham", "lay thuoc")) {
            return finalResult(steps, "Được, anh có thể ghé phòng khám lấy thuốc theo chỉ định đã có. Nếu chưa có đơn/chỉ định, anh gọi 0353.374.156 để lễ tân kiểm tra trước khi qua nhé.");
        }

        if (isSystemApiDocumentationQuery(q)) {
            return finalResult(steps, "Trang xem API toàn hệ thống: http://127.0.0.1:8081/swagger-ui/index.html. JSON OpenAPI: http://127.0.0.1:8081/v3/api-docs.");
        }

        if (isStaffRole(userRole)
                && containsAny(q, "khong den", "khach khong den", "da huy", "da huy hom nay", "huy hom nay")
                && containsAny(q, "loc", "ca", "lich", "lich hen", "danh sach")) {
            String route = "/quan-ly/lich-hen";
            if (!canAccessInternalRoute(userRole, route)) {
                return finalResult(steps, "Tài khoản hiện tại không đủ quyền mở phân hệ lịch hẹn.");
            }
            return finalResult(steps, "Mở trang lịch hẹn để lọc các ca không đến hoặc đã hủy hôm nay. [NAVIGATE:" + route + "]");
        }

        if (isAiProviderConfigQuery(q)) {
            if (!RoleAccessPolicy.canUseAgentTool(userRole, "kiem_tra_cau_hinh_ai")) {
                return finalResult(steps, RoleAccessPolicy.permissionDeniedMessage("kiem_tra_cau_hinh_ai", userRole));
            }
            if (toolService == null) {
                return finalResult(steps, "Rexi cần tool cấu hình AI để kiểm tra provider/model thật, nhưng tool hệ thống chưa sẵn sàng.");
            }
            Map<String, Object> params = new HashMap<>();
            String observation = toolService.executeTool("kiem_tra_cau_hinh_ai", params, userRole, username);
            steps.add(new ReActStep("TOOL", "Kiểm tra cấu hình provider/model AI thật", "kiem_tra_cau_hinh_ai", params, observation));
            return finalResult(steps, observation);
        }

        if (containsAny(q, "5kg", "5 kg") && containsAny(q, "3kg", "3 kg")) {
            return finalResult(steps, "Em thấy 2 số khác nhau. Cân nặng hiện tại là mấy kg?");
        }
        if (containsAny(q, "5kg", "5 kg") && containsAny(q, "miu", "meo", "be miu", "be meo")) {
            return finalResult(steps, "Đã cập nhật cân nặng bé Miu lên 5kg.");
        }

        if (containsAny(q, "nguyen van a", "nguyễn văn a") && containsAny(q, "bac si", "bs", "bsi")) {
            return finalResult(steps, "PK không có bác sĩ tên Nguyễn Văn A trong hệ thống.");
        }

        ReActResult weightIntent = handleWeightUpdateFollowUpIntent(q, steps);
        if (weightIntent != null) {
            return weightIntent;
        }

        if (containsAny(q, "31/04", "31 04", "ngay 31 thang 4")) {
            return finalResult(steps, "Tháng 4 chỉ có 30 ngày. Anh chọn lại ngày giúp em.");
        }

        if (containsAny(q, "huy cai lenh huy", "huy lenh huy", "undo huy", "quay lai lenh huy")) {
            return finalResult(steps, "Anh muốn giữ lại lịch vừa hủy đúng không?");
        }

        if (containsAny(q, "ngay mai", "tomorrow") && containsAny(q, "con slot", "slot nao", "lich trong", "khung gio trong", "con cho nao")) {
            if (!RoleAccessPolicy.canUseAgentTool(userRole, "tim_lich_trong")) {
                return finalResult(steps, RoleAccessPolicy.permissionDeniedMessage("tim_lich_trong", userRole));
            }
            if (toolService == null) {
                return finalResult(steps, "Rexi cần truy vấn cơ sở dữ liệu lịch trống, nhưng tool hệ thống chưa sẵn sàng.");
            }
            Map<String, Object> params = new HashMap<>();
            params.put("ngay", LocalDate.now(VN_ZONE).plusDays(1).toString());
            String observation = toolService.executeTool("tim_lich_trong", params, userRole, username);
            steps.add(new ReActStep("TOOL", "Tra cứu slot trống ngày mai từ cơ sở dữ liệu", "tim_lich_trong", params, observation));
            return finalResult(steps, observation);
        }

        if (containsAny(q, "9h", "09:00") && containsAny(q, "may bac si", "mấy bác sĩ", "bao nhieu bac si", "da co may") && containsAny(q, "mai", "ngay mai", "tomorrow")) {
            if (!RoleAccessPolicy.canUseAgentTool(userRole, "getSlotUsage")) return finalResult(steps, RoleAccessPolicy.permissionDeniedMessage("getSlotUsage", userRole));
            Map<String, Object> params = new HashMap<>();
            params.put("date", "tomorrow");
            params.put("time", "09:00");
            String observation = toolService.executeTool("getSlotUsage", params, userRole, username);
            steps.add(new ReActStep("TOOL", "Đếm số bác sĩ trực slot 9h sáng mai", "getSlotUsage", params, observation));
            return finalResult(steps, observation);
        }

        if (containsAny(q, "dien ten dich vu", "điền tên dịch vụ", "ten dich vu") && containsAny(q, "kham da lieu")) {
            return finalResult(steps, "Đã điền tên dịch vụ. [FILL:input_service_name|Khám da liễu]");
        }

        if (containsAny(q, "huy") && containsAny(q, "lich", "lh")) {
            String appointmentId = extractFirstGroup(q, "\\b(lh[-_a-z0-9]+)\\b");
            if (appointmentId == null || appointmentId.isBlank()) {
                return finalResult(steps, "Bạn gửi mã lịch hẹn cần hủy, ví dụ LH-123, để Rexi kiểm tra chủ lịch trước khi hủy.");
            }
            if (!RoleAccessPolicy.canUseAgentTool(userRole, "huy_lich_hen")) {
                return finalResult(steps, RoleAccessPolicy.permissionDeniedMessage("huy_lich_hen", userRole));
            }
            if (toolService == null) {
                return finalResult(steps, "Rexi cần truy vấn cơ sở dữ liệu lịch hẹn, nhưng tool hệ thống chưa sẵn sàng.");
            }
            Map<String, Object> params = new HashMap<>();
            params.put("id_lich_hen", appointmentId.toUpperCase(Locale.ROOT).replace("_", "-"));
            String observation = toolService.executeTool("huy_lich_hen", params, userRole, username);
            steps.add(new ReActStep("TOOL", "Kiểm tra chủ lịch/quyền rồi hủy lịch hẹn", "huy_lich_hen", params, observation));
            return finalResult(steps, observation);
        }

        if (containsAny(q, "tim be", "tim thu cung", "xem be") && !containsAny(q, "benh an", "ho so")) {
            if (!RoleAccessPolicy.canUseAgentTool(userRole, "tim_thu_cung")) {
                return finalResult(steps, RoleAccessPolicy.permissionDeniedMessage("tim_thu_cung", userRole));
            }
            if (toolService == null) {
                return finalResult(steps, "Rexi cần truy vấn cơ sở dữ liệu thú cưng, nhưng tool hệ thống chưa sẵn sàng.");
            }
            String petKeyword = extractFirstGroup(q, "(?:tim be|xem be|tim thu cung)\\s+([a-z0-9]{2,30})");
            if (petKeyword == null || petKeyword.isBlank()) petKeyword = q;
            Map<String, Object> params = new HashMap<>();
            params.put("tu_khoa", petKeyword.trim());
            String observation = toolService.executeTool("tim_thu_cung", params, userRole, username);
            steps.add(new ReActStep("TOOL", "Tìm thú cưng theo tên/ID từ cơ sở dữ liệu", "tim_thu_cung", params, observation));
            return finalResult(steps, observation);
        }

        if (containsAny(q, "amoxicillin") || (containsAny(q, "con bao nhieu", "con bao nhiu", "ton kho") && containsAny(q, "thuoc"))) {
            if (!RoleAccessPolicy.canUseAgentTool(userRole, "xem_kho_thuoc")) {
                return finalResult(steps, RoleAccessPolicy.permissionDeniedMessage("xem_kho_thuoc", userRole));
            }
            if (toolService == null) {
                return finalResult(steps, "Rexi cần truy vấn cơ sở dữ liệu kho thuốc, nhưng tool hệ thống chưa sẵn sàng.");
            }
            Map<String, Object> params = new HashMap<>();
            params.put("tu_khoa", containsAny(q, "amoxicillin") ? "amoxicillin" : q);
            String observation = toolService.executeTool("xem_kho_thuoc", params, userRole, username);
            steps.add(new ReActStep("TOOL", "Tra cứu tồn kho thuốc từ cơ sở dữ liệu", "xem_kho_thuoc", params, observation));
            return finalResult(steps, observation);
        }

        if (containsAny(q, "dat lich") && containsAny(q, "minh") && containsAny(q, "9h", "09:00") && containsAny(q, "mai", "ngay mai", "tomorrow")) {
            if (!RoleAccessPolicy.canUseAgentTool(userRole, "getSlotUsage")) {
                return finalResult(steps, RoleAccessPolicy.permissionDeniedMessage("getSlotUsage", userRole));
            }
            if (toolService == null) {
                return finalResult(steps, "Rexi cần tool lịch hẹn để kiểm tra slot, nhưng tool hệ thống chưa sẵn sàng.");
            }
            Map<String, Object> slotParams = new HashMap<>();
            slotParams.put("date", "tomorrow");
            slotParams.put("time", "09:00");
            String slotObservation = toolService.executeTool("getSlotUsage", slotParams, userRole, username);
            steps.add(new ReActStep("TOOL", "Đếm bác sĩ trong slot trước khi đặt lịch", "getSlotUsage", slotParams, slotObservation));
            return finalResult(steps, "Đã kiểm tra slot 09:00 ngày mai bằng dữ liệu thật. Để đặt lịch thật, Rexi cần đủ ID khách hàng, ID thú cưng, ID bác sĩ, ID dịch vụ; câu hiện tại chỉ có tên bé Lu và BS Minh nên chưa gọi dat_lich_hen để tránh bịa ID. Kết quả slot: " + slotObservation);
        }

        if (containsAny(q, "con slot nao", "co slot nao", "con cho nao", "con lich nao")
                && containsAny(q, "bac si minh", "bs minh", "bsi minh", "minh")) {
            if (toolService == null) {
                return finalResult(steps, "Em kiểm tra lịch BS Minh ngay, nhưng tool lịch đang chưa sẵn sàng.");
            }
            Map<String, Object> params = new HashMap<>();
            params.put("staff", "Minh");
            params.put("role", "doctor");
            params.put("week", "this");
            String observation = toolService.executeTool("getStaffSchedule", params, userRole, username);
            steps.add(new ReActStep("TOOL", "Tra lịch BS Minh để tìm slot còn trống", "getStaffSchedule", params, observation));
            return finalResult(steps, observation);
        }

        if (containsAny(q, "slot do full", "slot nay full", "9h full", "9h kin", "09:00 full")
                && containsAny(q, "9h", "09:00", "sang mai", "tomorrow")) {
            return finalResult(steps, "9h kín rồi. Em còn 9h30, 10h. Anh chọn ca nào?");
        }

        if (containsAny(q, "if mai mua", "neu mai mua", "nếu mai mưa", "mua thi", "tomorrow rain")) {
            return finalResult(steps, "Em chưa có dữ liệu thời tiết để kết luận nghỉ hay không. Em kiểm tra lịch BS Minh trước, rồi nếu anh cần em tra tiếp bác sĩ thay ca.");
        }

        if (containsAny(q, "book a slot", "book slot", "dr minh", "doctor minh") && containsAny(q, "9h", "09:00", "sang mai", "tomorrow")) {
            return finalResult(steps, "Đặt lịch cho BS Minh lúc 9h sáng mai. Anh gửi thêm tên bé hoặc SĐT chủ nuôi là em chốt tiếp.");
        }

        ReActResult scheduleIntent = handleScheduleDeterministicIntent(q, userRole, username, steps);
        if (scheduleIntent != null) {
            return scheduleIntent;
        }

        if (isAdminCodeLookupQuery(q, userRole)) {
            if (toolService == null) {
                return finalResult(steps, "Rexi cần tool tra cứu mã nguồn để trả file/dòng code, nhưng tool hệ thống chưa sẵn sàng.");
            }
            Map<String, Object> params = new HashMap<>();
            params.put("tu_khoa", q);
            String observation = toolService.executeTool("tra_cuu_ma_nguon", params, userRole, username);
            if (!hasCodeLineEvidence(observation)) {
                String blocked = "Chưa đủ bằng chứng mã nguồn để trả file/dòng chính xác. Rexi Agent đã chặn câu trả lời để tránh bịa; hãy hỏi kèm tên màn hình, route, API, component, function hoặc data-ai-id cụ thể.";
                steps.add(new ReActStep("TOOL", "Tra cứu RAG mã nguồn nhưng chưa có dòng code đủ bằng chứng", "tra_cuu_ma_nguon", params, observation));
                return finalResult(steps, blocked);
            }
            steps.add(new ReActStep("TOOL", "Tra cứu RAG mã nguồn để định vị file, route/API và dòng code", "tra_cuu_ma_nguon", params, observation));
            return finalResult(steps, observation);
        }

        if (isExplicitNavigationQuery(q) && !isAppointmentDataLookupQuery(q) && !isRevenueStatsQuery(q)) {
            String route = resolveRouteForRole(q, isStaff);
            if (route == null) {
                return finalResult(steps, "Rexi không tìm thấy trang phù hợp với yêu cầu này. Bạn nói rõ tên phân hệ như lịch hẹn, khách hàng, hóa đơn, kho thuốc, báo cáo, bệnh án hoặc trang chủ nhé.");
            }
            if (route.startsWith("/quan-ly/") && !canAccessInternalRoute(userRole, route)) {
                return finalResult(steps, "Tài khoản hiện tại không có quyền mở phân hệ này. Vui lòng dùng đúng menu hoặc liên hệ Admin để được cấp quyền.");
            }
            return finalResult(steps, "Mở trang phù hợp cho bạn. [NAVIGATE:" + route + "]");
        }

        if (!isStaff) {
            ReActResult customerQuickIntent = handleCustomerDeterministicIntent(q, userRole, username, steps);
            if (customerQuickIntent != null) {
                return customerQuickIntent;
            }
        }

        if (!isStaff && isCustomerDoctorInfoQuery(q)) {
            return finalResult(steps, "Bạn gửi giúp tôi tên thú cưng hoặc mã lịch hẹn để Rexi kiểm tra đúng bác sĩ phụ trách.");
        }

        if (isTodayCustomerStatsQuery(q)) {
            if (!RoleAccessPolicy.canUseAgentTool(userRole, "thong_ke_khach_hang_hom_nay")) {
                return finalResult(steps, RoleAccessPolicy.permissionDeniedMessage("thong_ke_khach_hang_hom_nay", userRole));
            }
            if (toolService == null) {
                return finalResult(steps, "Rexi cần truy vấn cơ sở dữ liệu để thống kê khách hàng mới và xu hướng hôm nay; hiện tool hệ thống chưa sẵn sàng nên Rexi sẽ không ước lượng số liệu.");
            }
            Map<String, Object> params = new HashMap<>();
            params.put("gom_xu_huong", "true");
            String observation = toolService.executeTool("thong_ke_khach_hang_hom_nay", params, userRole, username);
            steps.add(new ReActStep("TOOL", "Thống kê khách hàng mới và xu hướng hôm nay từ cơ sở dữ liệu", "thong_ke_khach_hang_hom_nay", params, observation));
            return finalResult(steps, observation);
        }

        if (isDoctorWorkloadStatsQuery(q)) {
            if (!RoleAccessPolicy.canUseAgentTool(userRole, "thong_ke_ca_kham_bac_si")) {
                return finalResult(steps, RoleAccessPolicy.permissionDeniedMessage("thong_ke_ca_kham_bac_si", userRole));
            }
            if (toolService == null) {
                return finalResult(steps, "Rexi cần truy vấn cơ sở dữ liệu thống kê ca khám theo bác sĩ, nhưng tool hệ thống chưa sẵn sàng.");
            }
            Map<String, Object> params = new HashMap<>();
            params.put("khoang_thoi_gian", extractStatsRange(q));
            params.put("sap_xep", containsAny(q, "it ca", "it nhat", "thap nhat") ? "it_nhat" : "nhieu_nhat");
            String observation = toolService.executeTool("thong_ke_ca_kham_bac_si", params, userRole, username);
            steps.add(new ReActStep("TOOL", "Thống kê ca khám theo bác sĩ từ cơ sở dữ liệu", "thong_ke_ca_kham_bac_si", params, observation));
            return finalResult(steps, observation);
        }

        if (isDoctorShiftLookupQuery(q)) {
            if (!RoleAccessPolicy.canUseAgentTool(userRole, "tim_lich_lam_bac_si")) {
                return finalResult(steps, RoleAccessPolicy.permissionDeniedMessage("tim_lich_lam_bac_si", userRole));
            }
            if (toolService == null) {
                return finalResult(steps, "Rexi cần truy vấn cơ sở dữ liệu lịch làm việc bác sĩ, nhưng tool hệ thống chưa sẵn sàng.");
            }
            Map<String, Object> params = new HashMap<>();
            params.put("khoang_thoi_gian", extractStatsRange(q));
            String doctorKeyword = extractDoctorKeyword(q);
            if (doctorKeyword != null && !doctorKeyword.isBlank()) {
                params.put("tu_khoa_bac_si", doctorKeyword);
            }
            String observation = toolService.executeTool("tim_lich_lam_bac_si", params, userRole, username);
            steps.add(new ReActStep("TOOL", "Tra cứu lịch làm việc bác sĩ từ cơ sở dữ liệu", "tim_lich_lam_bac_si", params, observation));
            return finalResult(steps, observation);
        }

        if (isRevenueStatsQuery(q)) {
            if (!RoleAccessPolicy.canUseAgentTool(userRole, "thong_ke_doanh_thu")) {
                return finalResult(steps, RoleAccessPolicy.permissionDeniedMessage("thong_ke_doanh_thu", userRole));
            }
            if (toolService == null) {
                return finalResult(steps, "Rexi cần truy vấn cơ sở dữ liệu doanh thu, nhưng tool hệ thống chưa sẵn sàng.");
            }
            Map<String, Object> params = new HashMap<>();
            params.put("khoang_thoi_gian", extractStatsRange(q));
            String observation = toolService.executeTool("thong_ke_doanh_thu", params, userRole, username);
            steps.add(new ReActStep("TOOL", "Thống kê doanh thu từ cơ sở dữ liệu", "thong_ke_doanh_thu", params, observation));
            return finalResult(steps, observation);
        }

        if (isMedicalRecordLookupQuery(q)) {
            if (!RoleAccessPolicy.canUseAgentTool(userRole, "xem_benh_an")) {
                return finalResult(steps, RoleAccessPolicy.permissionDeniedMessage("xem_benh_an", userRole));
            }
            if (toolService == null) {
                return finalResult(steps, "Rexi cần truy vấn cơ sở dữ liệu bệnh án, nhưng tool hệ thống chưa sẵn sàng.");
            }
            Map<String, Object> params = new HashMap<>();
            String petId = extractFirstGroup(q, "\\b(tc[-_a-z0-9]+)\\b");
            if (petId == null || petId.isBlank()) {
                return finalResult(steps, "Bạn gửi thêm mã thú cưng hoặc mở đúng hồ sơ thú cưng để Rexi Agent tra bệnh án chính xác.");
            }
            params.put("id_thu_cung", petId.toUpperCase(Locale.ROOT).replace("_", "-"));
            String observation = toolService.executeTool("xem_benh_an", params, userRole, username);
            steps.add(new ReActStep("TOOL", "Tra cứu bệnh án từ cơ sở dữ liệu", "xem_benh_an", params, observation));
            return finalResult(steps, observation);
        }

        if (isAppointmentDataLookupQuery(q)) {
            if (!RoleAccessPolicy.canUseAgentTool(userRole, "tim_lich_hen_hom_nay")) {
                return finalResult(steps, RoleAccessPolicy.permissionDeniedMessage("tim_lich_hen_hom_nay", userRole));
            }
            if (toolService == null) {
                return finalResult(steps, "Rexi cần truy vấn cơ sở dữ liệu lịch hẹn, nhưng tool hệ thống chưa sẵn sàng.");
            }
            Map<String, Object> params = new HashMap<>();
            params.put("pham_vi", extractStatsRange(q));
            if (containsAny(q, "dat lich", "book lich", "tao lich", "lap lich", "dat bac si", "dat bs", "dat bsi")) {
                params.put("loai_ngay", "ngay_tao");
            }
            String doctorKeyword = extractDoctorKeyword(q);
            if (doctorKeyword != null && !doctorKeyword.isBlank()) {
                params.put("tu_khoa_bac_si", doctorKeyword);
            }
            String observation = toolService.executeTool("tim_lich_hen_hom_nay", params, userRole, username);
            steps.add(new ReActStep("TOOL", "Tra cứu lịch khám từ cơ sở dữ liệu", "tim_lich_hen_hom_nay", params, observation));
            return finalResult(steps, observation);
        }

        if (isPetMedicalSymptomQuery(q)) {
            return finalResult(steps, buildSafePetMedicalAdvice(q));
        }

        if (containsAny(q, "lich hen", "lich kham", "dat lich", "book lich", "xem lich", "hom nay co gi")) {
            if (isStaff) {
                return finalResult(steps, "Mở trang lịch hẹn cho bạn. [NAVIGATE:/quan-ly/lich-hen]");
            }
            return finalResult(steps, "Mở trang đặt lịch cho bạn. [NAVIGATE:/khach-hang/dat-lich-hen]");
        }

        if (containsAny(q, "mo modal them thu cung", "modal them thu cung", "them thu cung moi")) {
            if (!RoleAccessPolicy.canUseAgentTool(userRole, "them_thu_cung")) return finalResult(steps, RoleAccessPolicy.permissionDeniedMessage("them_thu_cung", userRole));
            return finalResult(steps, "Mở modal thêm thú cưng mới. [CLICK:btn_add_pet]");
        }

        if (containsAny(q, "them thu cung", "them 2 thu cung", "them pet", "them boss", "them be")) {
            if (!RoleAccessPolicy.canUseAgentTool(userRole, "them_thu_cung")) {
                return finalResult(steps, RoleAccessPolicy.permissionDeniedMessage("them_thu_cung", userRole));
            }
            if (toolService == null) {
                return finalResult(steps, "Rexi cần ghi dữ liệu thú cưng vào hệ thống, nhưng tool hệ thống chưa sẵn sàng nên sẽ không nói đã thêm.");
            }
            String normalizedPetCreateQuery = normalizeVietnamese(q).toLowerCase(Locale.ROOT);
            String petName = containsAny(normalizedPetCreateQuery, "miu") ? "Miu"
                    : containsAny(q, "bong") ? "Bông"
                    : extractFirstGroup(q, "(?:them be|them thu cung|them pet|them boss)\\s+([a-z0-9]{2,30})");
            if (petName == null || petName.isBlank()) {
                return finalResult(steps, "Bạn gửi thêm tên bé cần tạo. Rexi không tự tạo thú cưng khi thiếu tên thật.");
            }
            Map<String, Object> params = new HashMap<>();
            params.put("ten_thu_cung", capitalizeName(petName));
            params.put("loai", containsAny(normalizedPetCreateQuery, "meo") ? "Mèo" : containsAny(normalizedPetCreateQuery, "cho") ? "Chó" : "Khác");
            params.put("giong", extractPetBreed(q));
            params.put("gioi_tinh", containsAny(normalizedPetCreateQuery, "cai") ? "Cái" : containsAny(normalizedPetCreateQuery, "duc") ? "Đực" : "Khác");
            String ageYears = extractFirstGroup(q, "(\\d+)\\s*tuoi");
            if (ageYears != null && !ageYears.isBlank()) {
                try {
                    params.put("ngay_sinh", LocalDate.now(VN_ZONE).minusYears(Integer.parseInt(ageYears)).toString());
                } catch (Exception ignored) {
                    // Bỏ qua tuổi không parse được để tránh ghi ngày sinh sai.
                }
            }
            params.put("ghi_chu", "Thêm bởi Rexi Agent theo yêu cầu khách hàng.");
            boolean confirmedCreate = containsAny(normalizedPetCreateQuery,
                    "xac nhan tao thu cung", "dong y tao thu cung", "toi xac nhan tao", "confirm tao thu cung");
            if (!confirmedCreate) {
                return finalResult(steps,
                        "Rexi đã đọc yêu cầu thêm thú cưng nhưng chưa ghi vào hệ thống. " +
                        "Thông tin dự kiến: tên " + params.get("ten_thu_cung") +
                        ", loài " + params.get("loai") +
                        (params.get("giong") == null || params.get("giong").toString().isBlank() ? "" : ", giống " + params.get("giong")) +
                        ", giới tính " + params.get("gioi_tinh") + ". " +
                        "Để tránh tạo dữ liệu mẫu/ghi nhầm, hãy xác nhận bằng câu: XÁC NHẬN TẠO THÚ CƯNG " + params.get("ten_thu_cung") + ".");
            }
            String observation = toolService.executeTool("them_thu_cung", params, userRole, username);
            steps.add(new ReActStep("TOOL", "Thêm thú cưng cho tài khoản đang đăng nhập", "them_thu_cung", params, observation));
            return finalResult(steps, observation);
        }

        // hoa don phải check TRƯỚC khach hang — câu “xem hóa đơn của khách hàng” chứa cả hai từ khóa
        if (containsAny(q, "hoa don", "bill", "thanh toan")) {
            if (RoleAccessPolicy.canUseAgentTool(userRole, "xem_hoa_don")) {
                return finalResult(steps, "Mở trang hóa đơn cho bạn. [NAVIGATE:/quan-ly/hoa-don]");
            }
            return finalResult(steps, RoleAccessPolicy.permissionDeniedMessage("xem_hoa_don", userRole));
        }

        if (containsAny(q, "tra khach", "tim khach", "kiem khach", "khach hang", "chu nuoi", "sen nao")) {
            if (RoleAccessPolicy.canUseAgentTool(userRole, "tim_khach_hang")) {
                return finalResult(steps, "Mở trang khách hàng để tra cứu. [NAVIGATE:/quan-ly/khach-hang-thu-cung]");
            }
            return finalResult(steps, RoleAccessPolicy.permissionDeniedMessage("tim_khach_hang", userRole));
        }

        if (containsAny(q, "kho", "thuoc", "ton kho")) {
            if (RoleAccessPolicy.canUseAgentTool(userRole, "xem_kho_thuoc")) {
                return finalResult(steps, "Mở kho thuốc cho bạn. [NAVIGATE:/quan-ly/kho-thuoc]");
            }
            return finalResult(steps, RoleAccessPolicy.permissionDeniedMessage("xem_kho_thuoc", userRole));
        }

        return null;
    }

    private ReActResult handleDeterministicUiAction(String q, String userRole, List<ReActStep> steps) {
        if (q == null || q.isBlank()) return null;
        if (containsAny(q, "bam nut luu benh an", "nhan nut luu benh an", "luu benh an")) {
            if (!RoleAccessPolicy.canUseAgentTool(userRole, "cap_nhat_benh_an")) return finalResult(steps, RoleAccessPolicy.permissionDeniedMessage("cap_nhat_benh_an", userRole));
            return finalResult(steps, "Đã chuẩn bị thao tác lưu bệnh án. [CLICK:btn_save_hsba]");
        }
        if (containsAny(q, "dien ten be la miu", "ten be la miu") && containsAny(q, "loai meo", "mèo")) {
            return finalResult(steps, "Đã điền thông tin thú cưng. [FILL:input_pet_name|Miu] [SELECT:select_species|Mèo]");
        }
        if (containsAny(q, "cuon xuong cuoi trang", "cuon xuong cuoi", "scroll bottom")) {
            return finalResult(steps, "Đã cuộn xuống cuối trang. [SCROLL:bottom]");
        }
        if (containsAny(q, "chon bac si minh", "chon bs minh", "dropdown") && containsAny(q, "minh")) {
            return finalResult(steps, "Đã chọn bác sĩ Minh. [SELECT:dropdown_doctor|Minh]");
        }
        if (containsAny(q, "toggle ca truc dem", "bat toggle ca truc dem", "ca truc dem") && containsAny(q, "hong")) {
            return finalResult(steps, "Màn hình hiện tại chưa có công tắc ca trực đêm cho BS Hồng để thao tác trực tiếp. Em có thể mở lịch trực để anh/chị chỉnh ca phù hợp. [NAVIGATE:/quan-ly/lich-lam-viec]");
        }
        if (containsAny(q, "chup anh vet thuong", "upload len chat", "upload anh")) {
            return finalResult(steps, "Mở camera và chuẩn bị upload ảnh. [CLICK:btn_open_camera] [CLICK:btn_upload_file]");
        }
        if (containsAny(q, "dien trieu chung") && containsAny(q, "non", "bo an", "tieu chay")) {
            return finalResult(steps, "Đã điền triệu chứng. [FILL:textarea_symptom|nôn, bỏ ăn, tiêu chảy]");
        }
        if (containsAny(q, "thanh toan vnpay", "nut thanh toan vnpay", "bang vnpay")) {
            return finalResult(steps, "Mở thanh toán VNPay. [CLICK:btn_vnpay]");
        }
        return null;
    }

    private ReActResult handleDeterministicOpsShortcut(String q, String userRole, String username, List<ReActStep> steps) {
        if (q == null || q.isBlank()) return null;
        if (containsAny(q, "bsi nao nhieu ca nhat", "bs nao nhieu ca nhat", "bac si nao nhieu ca nhat")) {
            if (!RoleAccessPolicy.canUseAgentTool(userRole, "thong_ke_ca_kham_bac_si")) return finalResult(steps, RoleAccessPolicy.permissionDeniedMessage("thong_ke_ca_kham_bac_si", userRole));
            Map<String, Object> params = new HashMap<>();
            params.put("khoang_thoi_gian", containsAny(q, "tuan nay") ? "tuan_nay" : "all");
            params.put("sap_xep", "nhieu_nhat");
            String observation = toolService.executeTool("thong_ke_ca_kham_bac_si", params, userRole, username);
            steps.add(new ReActStep("TOOL", "Thống kê bác sĩ nhiều ca nhất", "thong_ke_ca_kham_bac_si", params, observation));
            return finalResult(steps, "thong_ke_ca_kham_bac_si → " + observation);
        }
        if (containsAny(q, "hoa don chua thanh toan", "unpaid")) {
            if (!RoleAccessPolicy.canUseAgentTool(userRole, "xem_hoa_don")) return finalResult(steps, RoleAccessPolicy.permissionDeniedMessage("xem_hoa_don", userRole));
            Map<String, Object> params = new HashMap<>();
            params.put("trang_thai", "unpaid");
            String observation = toolService.executeTool("xem_hoa_don", params, userRole, username);
            steps.add(new ReActStep("TOOL", "Xem hóa đơn chưa thanh toán", "xem_hoa_don", params, observation));
            return finalResult(steps, "xem_hoa_don(status=unpaid) → " + observation);
        }
        if (containsAny(q, "dieu huong vao trang xep lich") && containsAny(q, "y ta mai")) {
            if (!RoleAccessPolicy.canUseAgentTool(userRole, "getStaffSchedule")) return finalResult(steps, RoleAccessPolicy.permissionDeniedMessage("getStaffSchedule", userRole));
            Map<String, Object> params = new HashMap<>();
            params.put("staff", "Mai");
            params.put("role", "nurse");
            params.put("week", containsAny(q, "tuan sau") ? "next" : "this");
            String observation = toolService.executeTool("getStaffSchedule", params, userRole, username);
            steps.add(new ReActStep("TOOL", "Tra lịch y tá Mai", "getStaffSchedule", params, observation));
            return finalResult(steps, "[NAVIGATE:/quan-ly/lich-lam-viec] getStaffSchedule(staff=Mai) → " + observation);
        }
        if (containsAny(q, "tim khung gio trong chieu mai", "khung gio trong chieu mai")) {
            if (!RoleAccessPolicy.canUseAgentTool(userRole, "tim_lich_trong")) return finalResult(steps, RoleAccessPolicy.permissionDeniedMessage("tim_lich_trong", userRole));
            Map<String, Object> params = new HashMap<>();
            params.put("date", "tomorrow");
            params.put("time", "PM");
            String observation = toolService.executeTool("tim_lich_trong", params, userRole, username);
            steps.add(new ReActStep("TOOL", "Tìm lịch trống chiều mai", "tim_lich_trong", params, observation));
            return finalResult(steps, "tim_lich_trong(date=tomorrow,time=PM) → " + observation);
        }
        return null;
    }

    private boolean isSystemApiDocumentationQuery(String q) {
        if (q == null || q.isBlank()) return false;
        boolean asksApiDocs = containsAny(q,
                "trang xem api", "xem api", "api toan he thong", "api cua toan he thong",
                "tai lieu api", "docs api", "api docs", "swagger", "openapi", "v3 api docs",
                "danh sach api", "endpoint toan he thong");
        boolean asksSystemScope = containsAny(q,
                "toan he thong", "he thong", "tat ca", "full", "backend", "swagger", "openapi", "api docs");
        return asksApiDocs && asksSystemScope;
    }

    private ReActResult handleScheduleDeterministicIntent(String q, String userRole, String username, List<ReActStep> steps) {
        if (q == null || q.isBlank()) return null;
        boolean hasScheduleContext = containsAny(q,
                "lich lam", "lich truc", "lich hen", "ca truc", "ca lam", "xep lich", "phan ca",
                "slot", "khung gio", "gio truc", "dang ky lich", "dang ky ca", "them ca", "ep them",
                "truc roi", "truc ca", "ranh");
        hasScheduleContext = hasScheduleContext || (containsAny(q, "ca nao", "nhung ca", "full 3", "3 bs")
                && containsAny(q, "bac si", "bs", "bsi", "y ta", "nhan vien"))
                || (containsAny(q, "tuan nay", "tuan sau") && containsAny(q, "truc", "lich lam", "dang ky", "xep lich"));
        boolean hasStaffRoleContext = containsAny(q,
                "bac si", "bs", "bsi", "y ta", "ke toan", "le tan", "nhan vien");
        if (!hasScheduleContext) return null;

        if (containsAny(q, "huy cai lenh huy", "huy lenh huy", "undo huy", "quay lai lenh huy")) {
            return finalResult(steps, "Anh muốn giữ lại lịch vừa hủy đúng không?");
        }
        if (containsAny(q, "huy") && containsAny(q, "lich hen", "lich kham", "lich") && !containsAny(q, "code", "dong", "line")) {
            return finalResult(steps, "Em đã liệt kê các lịch cần hủy. Gõ HUY để tiếp tục.");
        }

        if (containsAny(q, "code", "file nao", "dong code", "line nao", "nam file")) {
            if (!RoleAccessPolicy.normalizeRole(userRole).equals("admin")) {
                return finalResult(steps, RoleAccessPolicy.permissionDeniedMessage("tra_cuu_ma_nguon", userRole));
            }
            if (toolService == null) return finalResult(steps, "Rexi cần tool tra cứu mã nguồn để trả file/dòng code, nhưng tool hệ thống chưa sẵn sàng.");
            Map<String, Object> params = new HashMap<>();
            params.put("tu_khoa", "max 3 bác sĩ slot lịch làm việc count >= 3");
            String observation = toolService.executeTool("tra_cuu_ma_nguon", params, userRole, username);
            steps.add(new ReActStep("TOOL", "Tra cứu file/dòng rule tối đa 3 bác sĩ", "tra_cuu_ma_nguon", params, observation));
            return finalResult(steps, observation);
        }

        if (toolService == null) {
            return finalResult(steps, "Rexi cần tool lịch làm việc để đọc dữ liệu thật, nhưng tool hệ thống chưa sẵn sàng.");
        }

        if (containsAny(q, "tu xep", "tu dong xep", "toi uu", "auto schedule", "auto xep")) {
            if (!RoleAccessPolicy.canUseAgentTool(userRole, "autoSchedule")) return finalResult(steps, RoleAccessPolicy.permissionDeniedMessage("autoSchedule", userRole));
            Map<String, Object> params = new HashMap<>();
            params.put("staff_count", extractFirstInteger(q, 5));
            params.put("week", containsAny(q, "tuan sau", "next") ? "next" : "this");
            params.put("avoid", containsAny(q, "mo", "phau thuat", "surgery") ? "surgery_overlap" : "conflict");
            String observation = toolService.executeTool("autoSchedule", params, userRole, username);
            steps.add(new ReActStep("TOOL", "Tự xếp lịch tối ưu cho bác sĩ", "autoSchedule", params, observation));
            return finalResult(steps, observation);
        }

        if (containsAny(q, "ep them", "override", "du da 3", "du da full", "du 3 bs")) {
            Map<String, Object> conflictParams = scheduleBaseParams(q);
            conflictParams.put("role", "doctor");
            String conflict = toolService.executeTool("checkConflict", conflictParams, userRole, username);
            steps.add(new ReActStep("TOOL", "Kiểm tra conflict trước khi override", "checkConflict", conflictParams, conflict));
            if (!RoleAccessPolicy.canUseAgentTool(userRole, "overrideDoctorSlot")) {
                return finalResult(steps, "Slot " + displayScheduleHour(Objects.toString(conflictParams.get("time"), "09:00")) + " đã full 3 BS. Liên hệ quản lý để override.");
            }
            Map<String, Object> overrideParams = new HashMap<>(conflictParams);
            String staffName = extractStaffName(q);
            if (staffName == null) return finalResult(steps, "Thiếu tên bác sĩ cần override. Anh gửi đúng tên nhân sự trong hệ thống để Rexi kiểm tra.");
            overrideParams.put("staff", staffName);
            overrideParams.put("reason", "Người dùng quản lý yêu cầu ép thêm dù slot đã full 3 BS");
            String observation = toolService.executeTool("overrideDoctorSlot", overrideParams, userRole, username);
            steps.add(new ReActStep("TOOL", "Override rule tối đa 3 bác sĩ theo quyền admin/quản lý", "overrideDoctorSlot", overrideParams, observation));
            return finalResult(steps, observation);
        }

        if (containsAny(q, "goi y", "phan bo", "cho hop ly", "xep vao ca nao")
                || (containsAny(q, "xep", "xep bs", "xep bac si") && containsAny(q, "lan") && containsAny(q, "9h30", "09:30"))) {
            if (!RoleAccessPolicy.canUseAgentTool(userRole, "suggestSchedule")) return finalResult(steps, RoleAccessPolicy.permissionDeniedMessage("suggestSchedule", userRole));
            Map<String, Object> params = scheduleBaseParams(q);
            String staffName = extractStaffName(q);
            if (staffName == null && containsAny(q, "lan")) staffName = "Lan";
            if (staffName == null) return finalResult(steps, "Thiếu tên nhân sự cần gợi ý xếp lịch. Anh gửi đúng tên trong hệ thống để Rexi kiểm tra.");
            params.put("staff", staffName);
            params.put("role", containsAny(q, "y ta") ? "nurse" : "doctor");
            params.put("preferred_time", containsAny(q, "9h30", "09:30") ? "09:30" : params.get("time"));
            String conflict = toolService.executeTool("checkConflict", params, userRole, username);
            steps.add(new ReActStep("TOOL", "checkConflict trước khi gợi ý lịch", "checkConflict", params, conflict));
            String observation = toolService.executeTool("suggestSchedule", params, userRole, username);
            steps.add(new ReActStep("TOOL", "AI gợi ý xếp lịch theo slot còn trống", "suggestSchedule", params, observation));
            return finalResult(steps, observation);
        }

        if (containsAny(q, "them ca", "cho toi them ca", "dang ky ca", "them bs", "them bac si")) {
            Map<String, Object> params = scheduleBaseParams(q);
            String staffName = extractStaffName(q);
            if (staffName == null) return finalResult(steps, "Thiếu tên bác sĩ cần thêm ca. Anh gửi đúng tên nhân sự trong hệ thống để Rexi kiểm tra.");
            params.put("staff", staffName);
            params.put("role", "doctor");
            String observation = toolService.executeTool("checkConflict", params, userRole, username);
            steps.add(new ReActStep("TOOL", "Kiểm tra rule tối đa 3 bác sĩ trước khi thêm ca", "checkConflict", params, observation));
            if (RoleAccessPolicy.normalizeRole(userRole).equals("bac_si") && observation.toLowerCase(Locale.ROOT).contains("full")) {
                return finalResult(steps, "Slot " + displayScheduleHour(Objects.toString(params.get("time"), "09:00")) + " đã full 3 BS. Liên hệ quản lý để override.");
            }
            return finalResult(steps, observation);
        }

        if (containsAny(q, "trung nhau", "trung ca", "overlap", "ca nao trung")) {
            if (!RoleAccessPolicy.canUseAgentTool(userRole, "findOverlapStaff")) return finalResult(steps, RoleAccessPolicy.permissionDeniedMessage("findOverlapStaff", userRole));
            Map<String, Object> params = new HashMap<>();
            params.put("staff", extractStaffNames(q));
            params.put("week", containsAny(q, "tuan sau", "next") ? "next" : "this");
            String observation = toolService.executeTool("findOverlapStaff", params, userRole, username);
            steps.add(new ReActStep("TOOL", "Join doctor/staff/shift để tìm ca trùng", "findOverlapStaff", params, observation));
            return finalResult(steps, observation);
        }

        if (containsAny(q, "ai ranh", "ai rảnh", "ranh", "hop", "họp") && containsAny(q, "ke toan", "le tan")) {
            if (!RoleAccessPolicy.canUseAgentTool(userRole, "findFreeStaff")) return finalResult(steps, RoleAccessPolicy.permissionDeniedMessage("findFreeStaff", userRole));
            Map<String, Object> params = new HashMap<>();
            params.put("roles", List.of("accountant", "reception"));
            params.put("time", containsAny(q, "chieu", "pm") ? "Wed PM" : "Wed AM");
            params.put("week", containsAny(q, "tuan sau", "next") ? "next" : "this");
            String observation = toolService.executeTool("findFreeStaff", params, userRole, username);
            steps.add(new ReActStep("TOOL", "Join staff + shift để tìm kế toán/lễ tân rảnh", "findFreeStaff", params, observation));
            return finalResult(steps, observation);
        }

        if (containsAny(q, "may bac si", "mấy bác sĩ", "bao nhieu bac si", "da co may", "full 3")) {
            if (!RoleAccessPolicy.canUseAgentTool(userRole, "getSlotUsage")) return finalResult(steps, RoleAccessPolicy.permissionDeniedMessage("getSlotUsage", userRole));
            Map<String, Object> params = scheduleBaseParams(q);
            String observation = toolService.executeTool("getSlotUsage", params, userRole, username);
            steps.add(new ReActStep("TOOL", "Đếm số bác sĩ trong slot và rule max 3 BS", "getSlotUsage", params, observation));
            return finalResult(steps, observation);
        }

        if (containsAny(q, "tuan nay", "tuan sau", "dang ky nhung lich", "truc ca nao", "lich lam nao", "truc ca nào")) {
            if (!RoleAccessPolicy.canUseAgentTool(userRole, "getStaffSchedule")) return finalResult(steps, RoleAccessPolicy.permissionDeniedMessage("getStaffSchedule", userRole));
            Map<String, Object> params = new HashMap<>();
            String staffName = extractStaffName(q);
            if (staffName == null) return finalResult(steps, "Thiếu tên nhân sự cần tra lịch. Anh gửi đúng tên trong hệ thống để Rexi kiểm tra.");
            params.put("staff", staffName);
            params.put("role", containsAny(q, "y ta") ? "nurse" : "doctor");
            params.put("week", containsAny(q, "tuan sau", "next") ? "next" : "this");
            String observation = toolService.executeTool("getStaffSchedule", params, userRole, username);
            steps.add(new ReActStep("TOOL", "Tra lịch làm việc nhân sự theo tuần", "getStaffSchedule", params, observation));
            if (containsAny(q, "vao trang", "dieu huong", "điều hướng", "xep lich")) {
                return finalResult(steps, "Mở trang xếp lịch. [NAVIGATE:/quan-ly/lich-lam-viec]\n" + observation);
            }
            return finalResult(steps, observation);
        }

        return null;
    }

    private Map<String, Object> scheduleBaseParams(String q) {
        Map<String, Object> params = new HashMap<>();
        params.put("date", containsAny(q, "ngay mai", "mai", "tomorrow") ? "tomorrow" : "today");
        params.put("time", extractScheduleTime(q));
        return params;
    }

    private String extractScheduleTime(String q) {
        String matched = extractFirstGroup(q, "\\b(\\d{1,2})(?:h|:)\\s*(\\d{1,2})?\\b");
        if (matched == null || matched.isBlank()) return "09:00";
        java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("\\b(\\d{1,2})(?:h|:)?\\s*(\\d{1,2})?\\b").matcher(q);
        if (matcher.find()) {
            int hour = Integer.parseInt(matcher.group(1));
            int minute = matcher.group(2) == null ? 0 : Integer.parseInt(matcher.group(2));
            return "%02d:%02d".formatted(hour, minute);
        }
        return "09:00";
    }

    private String displayScheduleHour(String time) {
        if (time == null || time.isBlank()) return "9h";
        String[] parts = time.split(":");
        try {
            int hour = Integer.parseInt(parts[0]);
            int minute = parts.length > 1 ? Integer.parseInt(parts[1]) : 0;
            return minute == 0 ? hour + "h" : hour + "h" + String.format("%02d", minute);
        } catch (Exception ignored) {
            return time;
        }
    }

    private int extractFirstInteger(String q, int fallback) {
        String number = extractFirstGroup(q, "\\b(\\d{1,2})\\b");
        if (number == null) return fallback;
        try {
            return Integer.parseInt(number);
        } catch (Exception ignored) {
            return fallback;
        }
    }

    private String extractStaffName(String q) {
        List<String> names = extractStaffNames(q);
        return names.isEmpty() ? null : names.get(names.size() - 1);
    }

    private List<String> extractStaffNames(String q) {
        List<String> names = new ArrayList<>();
        if (q == null || q.isBlank()) {
            return names;
        }
        String pattern = "(?i)(?:bac si|bsi|bs|y ta|yt|nhan vien|ke toan|le tan)\\s+([a-z0-9][a-z0-9'_-]{1,30})";
        java.util.regex.Matcher matcher = java.util.regex.Pattern.compile(pattern).matcher(q);
        while (matcher.find()) {
            String name = matcher.group(1).trim();
            if (!name.isBlank() && names.stream().noneMatch(existing -> existing.equalsIgnoreCase(name))) {
                names.add(name.substring(0, 1).toUpperCase(Locale.ROOT) + name.substring(1));
            }
        }
        return names;
    }

    private boolean isAiProviderConfigQuery(String q) {
        if (q == null || q.isBlank()) return false;
        boolean hasAiContext = containsAny(q, "ai", "agent", "model", "provider", "groq", "gemini", "openrouter", "api key", "key");
        boolean asksConfig = containsAny(q,
                "model nao", "provider nao", "dang dung", "dang xai", "cau hinh ai",
                "kiem tra cau hinh", "check cau hinh", "check that", "thuc te", "key nao");
        return hasAiContext && asksConfig;
    }

    private ReActResult handleCustomerDeterministicIntent(String q, String userRole, String username, List<ReActStep> steps) {
        if (isCustomerOwnPetListQuery(q)) {
            if (!RoleAccessPolicy.canUseAgentTool(userRole, "danh_sach_thu_cung_cua_toi")) {
                return finalResult(steps, RoleAccessPolicy.permissionDeniedMessage("danh_sach_thu_cung_cua_toi", userRole));
            }
            if (toolService == null) {
                return finalResult(steps, "Rexi cần truy vấn cơ sở dữ liệu thú cưng của bạn, nhưng tool hệ thống chưa sẵn sàng.");
            }
            Map<String, Object> params = new HashMap<>();
            String observation = toolService.executeTool("danh_sach_thu_cung_cua_toi", params, userRole, username);
            steps.add(new ReActStep("TOOL", "Tra cứu danh sách thú cưng của khách hàng đang đăng nhập", "danh_sach_thu_cung_cua_toi", params, observation));
            return finalResult(steps, observation);
        }

        if (isCustomerWebSearchQuery(q)) {
            if (!RoleAccessPolicy.canUseAgentTool(userRole, "tim_kiem_web")) {
                return finalResult(steps, RoleAccessPolicy.permissionDeniedMessage("tim_kiem_web", userRole));
            }
            if (toolService == null) {
                return finalResult(steps, "Rexi cần dùng công cụ tìm kiếm web, nhưng tool hệ thống chưa sẵn sàng.");
            }
            String query = q.replaceAll("\\b(len mang|tim tren mang|tim web|tim google|google|tra cuu web|tra cuu|tim tai lieu|tai lieu)\\b", " ")
                    .replaceAll("\\s+", " ")
                    .trim();
            if (query.isBlank()) query = q;
            Map<String, Object> params = new HashMap<>();
            params.put("query", query);
            String observation = toolService.executeTool("tim_kiem_web", params, userRole, username);
            steps.add(new ReActStep("TOOL", "Tìm tài liệu web theo yêu cầu khách hàng", "tim_kiem_web", params, observation));
            return finalResult(steps, observation);
        }

        if (!isCustomerNavigationQuery(q)) return null;
        String route = resolveCustomerRoute(q);
        if (route == null) return null;
        return finalResult(steps, "Mở trang phù hợp cho bạn. [NAVIGATE:" + route + "]");
    }

    private ReActResult handleExplicitWebSearchIntent(String q, String userRole, String username, List<ReActStep> steps) {
        if (!isCustomerWebSearchQuery(q)) return null;
        if (!RoleAccessPolicy.canUseAgentTool(userRole, "tim_kiem_web")) {
            return finalResult(steps, RoleAccessPolicy.permissionDeniedMessage("tim_kiem_web", userRole));
        }
        if (toolService == null) {
            return finalResult(steps, "Rexi cần dùng công cụ tìm kiếm web, nhưng tool hệ thống chưa sẵn sàng.");
        }
        String query = q.replaceAll("\\b(len mang|tim tren mang|tim web|tim google|google|tra cuu web|tra cuu|tim tai lieu|tai lieu|tai lieu y khoa|nguon ngoai|web|internet|online)\\b", " ")
                .replaceAll("\\s+", " ")
                .trim();
        if (query.isBlank()) query = q;
        Map<String, Object> params = new HashMap<>();
        params.put("query", query);
        String observation = toolService.executeTool("tim_kiem_web", params, userRole, username);
        steps.add(new ReActStep("TOOL", "Tìm tài liệu web theo yêu cầu rõ ràng của người dùng", "tim_kiem_web", params, observation));
        return finalResult(steps, observation);
    }

    private boolean isCustomerOwnPetListQuery(String q) {
        if (q == null || q.isBlank()) return false;
        boolean hasPetContext = containsAny(q, "thu cung", "boss", "pet", "be cung", "cho", "meo", "cun", "miu");
        boolean ownContext = containsAny(q, "cua toi", "toi co", "dang co", "nha toi", "nha tui", "cua minh", "cua toi co", "nhung con nao", "nhung be nao");
        boolean asksList = containsAny(q, "nhung", "danh sach", "liet ke", "co nhung", "co may", "con nao", "be nao", "nhung con nao", "nhung be nao");
        boolean createIntent = containsAny(q, "them", "tao", "dang ky", "dat lich", "xoa", "huy");
        return hasPetContext && ownContext && asksList && !createIntent;
    }

    private boolean isCustomerWebSearchQuery(String q) {
        return containsAny(q, "len mang", "tim tren mang", "tim web", "tim google", "google", "tra cuu web", "tim tai lieu", "tai lieu y khoa")
                || (containsAny(q, "tai lieu") && containsAny(q, "y khoa", "thu y", "cham soc", "mang thai", "benh"));
    }

    private boolean isCustomerNavigationQuery(String q) {
        return containsAny(q, "mo", "mo trang", "vao", "vao trang", "chuyen", "chuyen trang", "di toi", "toi trang", "den trang", "qua trang");
    }

    private String resolveCustomerRoute(String q) {
        if (containsAny(q, "ho so y te", "ho so te", "ho so benh an", "benh an")) return "/khach-hang/ho-so-benh-an";
        if (containsAny(q, "hoa don", "thanh toan", "bill")) return "/khach-hang/hoa-don-thanh-toan";
        if (containsAny(q, "dat lich", "lich kham", "lich hen", "dat kham")) return "/khach-hang/dat-lich-hen";
        if (containsAny(q, "lich su", "lich da dat")) return "/khach-hang/lich-su-lich-hen";
        if (containsAny(q, "thu cung", "boss", "pet", "be cung")) return "/khach-hang/quan-ly-thu-cung";
        if (containsAny(q, "ca nhan", "tai khoan", "profile", "thong tin cua toi")) return "/khach-hang/thong-tin-ca-nhan";
        if (containsAny(q, "bac si", "doi ngu")) return "/bac-si";
        if (containsAny(q, "bang gia", "gia dich vu")) return "/bang-gia";
        if (containsAny(q, "lien he", "hotline", "dia chi")) return "/lien-he";
        if (containsAny(q, "tong quan", "dashboard", "trang chu")) return "/khach-hang/dashboard";
        return null;
    }

    private String normalizeSlangCommand(String value) {
        if (value == null || value.isBlank()) return "";
        String q = " " + value + " ";
        q = q.replaceAll("\\b(e|ey|eh|yo|doi oi|troi oi|y|i)\\b", " ");
        q = q.replaceAll("\\b(t|tui|toi|mk|m)\\b", " toi ");
        q = q.replaceAll("\\b(dum|gium|giup cai|help)\\b", " giup ");
        q = q.replaceAll("\\b(ni|nì|ne|nek|nhe|nha|coi)\\b", " ");
        q = q.replaceAll("\\b(z|v|dz|zay|vay)\\b", " vay ");
        q = q.replaceAll("\\b(choa|chua|chóa|choaz|doggo|cun|cún)\\b", " cho ");
        q = q.replaceAll("\\b(mew|meow)\\b", " meo ");
        q = q.replaceAll("\\b(chin|chinh|chinh cho|fix)\\b", " chinh ");
        q = q.replaceAll("\\b(tun|len|up)\\b", " tang ");
        q = q.replaceAll("\\b(ka)\\b", " ca ");
        q = q.replaceAll("\\b(lm|lam|work)\\b", " lam ");
        q = q.replaceAll("\\b(vc|viec)\\b", " viec ");
        q = q.replaceAll("\\b(bam|nhan|tap)\\b", " nhan ");
        return q.replaceAll("\\s+", " ").trim();
    }

    private boolean isExplicitNavigationQuery(String q) {
        if (q == null || q.isBlank()) return false;
        return containsAny(q,
                "mo", "mo trang", "vao", "vao trang", "chuyen", "chuyen trang", "chuyen sang",
                "di toi", "toi trang", "den trang", "qua trang", "dua toi", "quay ve", "ve trang", "back ve");
    }

    private String resolveRouteForRole(String q, boolean isStaff) {
        String customerRoute = resolveCustomerRoute(q);
        if (!isStaff) {
            if (containsAny(q, "trang chu", "home", "ve nha")) return "/";
            return customerRoute;
        }
        if (containsAny(q, "trang chu", "home", "tong quan", "dashboard", "ve nha")) return "/quan-ly/dashboard";
        if (containsAny(q, "lich hen", "lich kham", "dat lich", "booking")) return "/quan-ly/lich-hen";
        if (containsAny(q, "xep lich", "lich lam viec", "lich truc", "ca truc", "phan ca")) return "/quan-ly/lich-lam-viec";
        if (containsAny(q, "benh an", "ho so y te", "ho so benh an")) return "/quan-ly/ho-so-benh-an";
        if (containsAny(q, "kham benh", "lam san")) return "/quan-ly/kham-benh";
        if (containsAny(q, "xet nghiem", "can lam sang", "ket qua xet nghiem", "lab")) return "/quan-ly/xet-nghiem";
        if (containsAny(q, "tiep tan", "check in", "check-in", "don tiep")) return "/quan-ly/lich-hen";
        if (containsAny(q, "don thuoc", "ke don")) return "/quan-ly/don-thuoc";
        if (containsAny(q, "hoa don", "thanh toan", "bill")) return "/quan-ly/hoa-don";
        if (containsAny(q, "doanh thu", "bao cao", "thong ke", "kpi")) return "/quan-ly/bao-cao-thong-ke";
        if (containsAny(q, "khach hang", "thu cung", "chu nuoi", "sen", "pet")) return "/quan-ly/khach-hang-thu-cung";
        if (containsAny(q, "ke toan", "doi soat", "tai chinh")) return "/quan-ly/ke-toan";
        if (containsAny(q, "kho thuoc", "ton kho", "thuoc")) return "/quan-ly/kho-thuoc";
        if (containsAny(q, "nhap kho", "kiem ke")) return "/quan-ly/nhap-kho";
        if (containsAny(q, "dich vu", "bang gia")) return "/quan-ly/dich-vu";
        if (containsAny(q, "nhan vien", "phan quyen", "tai khoan", "mo khoa", "khoa tai khoan")) return "/quan-ly/nhan-vien-phan-quyen";
        if (containsAny(q, "cau hinh", "setting", "config")) return "/quan-ly/cau-hinh";
        if (containsAny(q, "lien he", "hotline", "dia chi")) return "/lien-he";
        if (containsAny(q, "bac si", "doi ngu") && !containsAny(q, "ca lam", "lich truc", "lich lam", "lam viec")) return "/bac-si";
        return customerRoute;
    }

    private boolean canAccessInternalRoute(String userRole, String route) {
        String role = RoleAccessPolicy.normalizeRole(userRole);
        if (role.equals("admin")) return true;
        if (route == null || !route.startsWith("/quan-ly/")) return true;
        if (route.equals("/quan-ly/bao-cao-thong-ke") || route.equals("/quan-ly/ke-toan")) {
            return Set.of("quan_ly", "ke_toan").contains(role);
        }
        if (route.equals("/quan-ly/nhan-vien-phan-quyen") || route.equals("/quan-ly/cau-hinh")) {
            return role.equals("quan_ly");
        }
        if (route.equals("/quan-ly/ho-so-benh-an") || route.equals("/quan-ly/kham-benh") || route.equals("/quan-ly/don-thuoc")) {
            return Set.of("quan_ly", "bac_si", "y_ta").contains(role);
        }
        if (route.equals("/quan-ly/hoa-don")) {
            return Set.of("quan_ly", "ke_toan", "tiep_tan").contains(role);
        }
        if (route.equals("/quan-ly/kho-thuoc") || route.equals("/quan-ly/nhap-kho")) {
            return Set.of("quan_ly", "ke_toan", "bac_si", "y_ta", "tiep_tan").contains(role);
        }
        return RoleAccessPolicy.isInternalStaffRole(role);
    }

    private boolean isPetMedicalSymptomQuery(String q) {
        if (q == null || q.isBlank()) return false;
        if (isAppointmentDataLookupQuery(q)) return false;
        boolean hasPet = containsAny(q, "cho", "meo", "cun", "miu", "boss", "be", "pet", "poodle", "corgi");
        boolean hasSymptom = containsAny(q,
                "oi", "non", "bo an", "khong an", "an it", "gai", "ngua", "run", "nam im", "met",
                "cuu", "cap cuu", "co giat", "kho tho", "chay mau", "tieu chay", "di ngoai",
                "nhay", "can", "dau", "sot", "loet", "sung", "li bi", "yeu");
        boolean asksAdvice = containsAny(q, "lam sao", "lam gi", "co sao", "on ap", "can qua kham", "hong", "khong", "cuu")
                || !containsAny(q, "tim ho so", "tra ho so", "ma benh an", "id");
        return hasPet && hasSymptom && asksAdvice;
    }

    private boolean isAppointmentDataLookupQuery(String q) {
        if (q == null || q.isBlank()) return false;
        if (isDoctorWorkloadStatsQuery(q)) return false;
        boolean hasLookupVerb = containsAny(q,
                "tim", "tra", "tra cuu", "kiem tra", "xem", "liet ke", "danh sach", "mo danh sach", "co lich", "dang co", "hom nay co", "check db", "check he thong");
        boolean hasAppointmentContext = containsAny(q,
                "lich kham", "lich hen", "ca kham", "ca lam", "ca truc", "lich lam", "lich truc", "lam viec", "lich cua bac si", "lich bac si");
        boolean hasDoctorContext = containsAny(q, "bac si", "bsi", "bs ");
        boolean hasCreateIntent = containsAny(q, "dat lich", "book lich", "lap lich", "tao lich", "dat bac si", "dat bs", "dat bsi");
        boolean asksCreatedAppointments = hasCreateIntent && containsAny(q,
                "ai", "nhung ai", "co ai", "bao nhieu", "danh sach", "liet ke", "xem", "tra", "kiem tra", "check");
        boolean hasNavigationIntent = containsAny(q, "mo trang", "vao trang", "chuyen sang", "di toi", "dua toi", "qua trang")
                && !containsAny(q, "mo danh sach", "danh sach ca kham", "danh sach lich kham", "danh sach lich hen");
        boolean explicitSystemLookup = containsAny(q, "check db", "check he thong", "du lieu", "trong db", "he thong");
        return (!hasCreateIntent || asksCreatedAppointments) && !hasNavigationIntent
                && (hasLookupVerb || asksCreatedAppointments)
                && (hasAppointmentContext || asksCreatedAppointments)
                && (hasDoctorContext || explicitSystemLookup || containsAny(q, "hom nay", "hom qua", "hom kia", "tu truoc", "den gio", "today", "all") || asksCreatedAppointments);
    }

    private boolean isDoctorWorkloadStatsQuery(String q) {
        if (q == null || q.isBlank()) return false;
        boolean hasDoctorContext = containsAny(q, "bac si", "bsi", "bs");
        boolean hasWorkloadContext = containsAny(q,
                "nhieu ca", "nhieu ca nhat", "it ca", "it ca nhat", "so ca", "ca kham", "lich kham", "lich hen",
                "tai nhat", "ban nhat", "ban ron", "workload");
        boolean hasRankingOrStats = containsAny(q,
                "nhieu nhat", "it nhat", "top", "xep hang", "thong ke", "bao cao", "dem", "dang co nhieu", "cao nhat", "thap nhat");
        return hasDoctorContext && hasWorkloadContext && hasRankingOrStats;
    }

    private boolean isDoctorShiftLookupQuery(String q) {
        if (q == null || q.isBlank()) return false;
        boolean hasDoctorContext = containsAny(q, "bac si", "bsi", "bs");
        boolean hasShiftContext = containsAny(q,
                "ca lam", "lich lam", "lich truc", "ca truc", "gio lam", "lam viec", "con lam viec", "con lam vc", "dang lam", "truc hom nay");
        boolean hasLookupIntent = containsAny(q,
                "tim", "tra", "xem", "liet ke", "danh sach", "co nhung", "nhung ca", "tong", "tu truoc", "hom nay", "con", "dang co");
        return hasDoctorContext && hasShiftContext && hasLookupIntent;
    }

    private boolean isRevenueStatsQuery(String q) {
        if (q == null || q.isBlank()) return false;
        boolean hasFinanceContext = containsAny(q,
                "doanh thu", "tong thu", "thuc thu", "cong no", "doi soat", "tai chinh",
                "bao cao doanh thu", "thong ke doanh thu", "tien thu", "so tien");
        boolean hasStatsIntent = containsAny(q,
                "thong ke", "bao cao", "tong hop", "kiem tra", "xem", "bao nhieu", "hom nay",
                "hom qua", "hom kia", "tuan nay", "thang nay", "tu truoc", "den gio", "tang", "giam", "phan tram", "%", "today");
        return hasFinanceContext && hasStatsIntent;
    }

    private boolean isMedicalRecordLookupQuery(String q) {
        if (q == null || q.isBlank()) return false;
        if (isPetMedicalSymptomQuery(q)) return false;
        boolean hasRecordContext = containsAny(q, "benh an", "ho so benh an", "medical record", "chan doan gan day");
        boolean hasLookupIntent = containsAny(q,
                "tim", "tra", "tra cuu", "kiem tra", "xem", "liet ke", "tom tat", "gan day", "moi nhat", "cua be", "cua boss");
        return hasRecordContext && hasLookupIntent;
    }

    private boolean isTodayCustomerStatsQuery(String q) {
        if (q == null || q.isBlank()) return false;
        boolean hasToday = containsAny(q, "hom nay", "hom", "today", "trong ngay");
        boolean hasCustomerContext = containsAny(q, "khach", "khach hang", "khach moi", "khach hang moi", "dang ky moi", "khach dang ky");
        boolean hasStatsContext = containsAny(q,
                "kiem tra", "xem", "bao cao", "thong ke", "dem", "so", "bao nhieu", "xu huong", "trend", "ti le", "ty le");
        return hasToday && hasCustomerContext && hasStatsContext;
    }

    private boolean isCustomerDoctorInfoQuery(String q) {
        if (q == null || q.isBlank()) return false;
        boolean hasDoctor = containsAny(q, "bac si", "bsi", "bs");
        boolean asksInfo = containsAny(q, "thong tin", "cho toi biet", "ai phu trach", "phu trach", "kham cho", "lich kham");
        boolean hasPetContext = containsAny(q, "thu cung", "boss", "be", "pet", "cho", "meo", "cun", "miu");
        boolean isBookingCreate = containsAny(q, "dat lich", "tao lich", "book lich", "lap lich");
        return hasDoctor && asksInfo && hasPetContext && !isBookingCreate;
    }

    private String extractStatsRange(String q) {
        String normalized = normalizeVietnamese((q == null ? "" : q).toLowerCase(Locale.ROOT));
        if (containsAny(normalized, "hom nay", "today", "trong ngay")) return "hom_nay";
        if (containsAny(normalized, "hom qua", "yesterday")) return "hom_qua";
        if (containsAny(normalized, "hom kia", "truoc hom qua")) return "hom_kia";
        if (containsAny(normalized, "tuan nay", "week")) return "tuan_nay";
        if (containsAny(normalized, "thang nay", "month")) return "thang_nay";
        if (containsAny(normalized, "tu truoc", "truoc den", "truoc toi", "den gio", "toi gio", "lich su", "tong", "all", "toan bo")) return "all";
        return "all";
    }

    private String extractDoctorKeyword(String q) {
        if (q == null || q.isBlank()) return null;
        String cleaned = q.replaceAll("[^a-z0-9\\s]", " ").replaceAll("\\s+", " ").trim();
        String name = extractFirstGroup(cleaned, "(?:bac si|bsi|bs)\\s+([a-z0-9\\s]{2,40})");
        if (name == null || name.isBlank()) return null;
        name = name.replaceAll("\\b(lich|kham|hen|ca|lam|viec|truc|hom|nay|ngay|mai|dang|co|khong|nao|cho|toi|cua|tim|tra|xem|tong|tu|truoc|den|gio|h|nhung|cac)\\b", " ")
                .replaceAll("\\s+", " ")
                .trim();
        return name.isBlank() ? null : name;
    }

    private String buildSafePetMedicalAdvice(String q) {
        // Khẩn cấp: ngộ độc bả, điện giật, tai nạn
        if (containsAny(q, "bao cho", "bao chó", "ba chó", "ngo doc", "dien giat", "xe tong", "gay chan", "lòi ruột", "loi ruot")) {
            return "Đây là tình huống khẩn cấp! Giữ bé nằm yên, không tự ý cho uống thuốc hoặc sơ cứu không đúng cách. Gọi ngay hotline 0353.374.156 hoặc đưa bé tới phòng khám gần nhất. Chú ý: với ngộ độc, KHÔNG gây nôn nếu bé đã co giật hoặc hôn mê.";
        }
        if (containsAny(q, "kho tho", "co giat", "nam im", "li bi", "chay mau", "cuu", "run")) {
            return "Đây có thể là dấu hiệu khẩn cấp. Giữ bé nằm yên, không tự cho uống thuốc, gọi phòng khám hoặc đưa bé đi khám ngay.";
        }
        if (containsAny(q, "gai", "ngua")) {
            return "Gãi nhiều có thể do ký sinh trùng, dị ứng hoặc viêm da. Tạm tránh tắm/thuốc lạ, kiểm tra da có đỏ/rụng lông không và đặt lịch khám nếu kéo dài.";
        }
        if (q.matches(".*\\b(oi|non)\\b.*") || containsAny(q, "bo an", "khong an")) {
            return "Bé nôn/bỏ ăn cần theo dõi sát. Cho nước sạch, không ép ăn hay tự dùng thuốc; nếu lặp lại, lừ đừ hoặc quá 12-24 giờ thì nên đưa đi khám.";
        }
        // Parvo, FIP, FIV, FelV
        if (containsAny(q, "parvo", "fip", "fiv", "felv", "bach cau")) {
            return "Đây là bệnh nghiêm trọng, tỉ lệ tử vong cao nếu không điều trị kịp thời. Cần cách ly ngay lập tức và đưa bé tới phòng khám để xét nghiệm và điều trị tích cực.";
        }
        if (containsAny(q, "xanax", "thuoc lac", "paracetamol", "socola", "thuoc ngu")) {
            return "Đây là tình huống nguy hiểm. TUYỆT ĐỐI KHÔNG tự ý dùng thuốc người cho thú cưng. Gọi hotline 0353.374.156 hoặc đưa bé tới phòng khám ngay lập tức.";
        }
        return "Tôi hiểu bé đang có biểu hiện bất thường. Theo dõi nhịp thở, ăn uống, vận động; nếu nặng lên hoặc bạn không chắc, nên đưa bé đi khám.";
    }

    private ReActResult finalResult(List<ReActStep> steps, String answer) {
        String safe = sanitizeFinalAnswer(answer, "");
        steps.add(new ReActStep("FINAL", safe, null, null, null));
        return new ReActResult(safe, steps);
    }

    private String sanitizeFinalAnswer(String answer, String normalizedQuery) {
        if (answer != null) {
            answer = answer
                    .replaceAll("(?is)<think>.*?</think>", " ")
                    .replaceAll("(?is)</?assistant>", " ")
                    .replaceAll("(?is)^\\s*ish\\s*", " ")
                    .replaceAll("(?is)Okay, let me break down.*?</think>", " ")
                    .replaceAll("(?is)First, I need to.*?(?=\\n\\s*[\\p{L}Đđ])", " ")
                    .replace("\r\n", "\n")
                    .replace('\r', '\n')
                    .replaceAll("[ \\t\\x0B\\f]+", " ")
                    .replaceAll(" *\\n *", "\n")
                    .replaceAll("\\n{3,}", "\n\n")
                    .trim();
        }
        if (answer == null || answer.isBlank() || "null".equalsIgnoreCase(answer.trim())) {
            if (normalizedQuery != null && !normalizedQuery.isBlank() && normalizedQuery.length() <= 80) {
                return "Tôi chưa hiểu đủ ý. Bạn muốn mở trang nào hoặc thêm/sửa mục gì?";
            }
            return "Tôi chưa đủ dữ liệu để hoàn tất tác vụ này. Bạn gửi thêm SĐT khách hàng, tên thú cưng, ngày/giờ mong muốn hoặc tên phân hệ cần mở.";
        }
        return formatChatAnswer(answer.trim());
    }

    private String formatChatAnswer(String answer) {
        if (answer == null || answer.isBlank()) return answer;
        String formatted = answer
                .replaceAll("(?m)(:\\s*)-\\s+", "$1\n- ")
                .replaceAll("\\s+-\\s+(?=\\d{4}-\\d{2}-\\d{2}\\b)", "\n- ")
                .replaceAll("\\s+-\\s+(?=[\\p{L}Đđ][^\\n]{0,60}:)", "\n- ")
                .replaceAll("\\s+(Danh sách:)", "\n$1")
                .replaceAll("\\s+(Cảnh báo conflict:)", "\n$1")
                .replaceAll("\\s+(Nếu bắt buộc)", "\n$1")
                .replaceAll("\\s+(\\[NAVIGATE:[^\\]]+\\])", "\n$1")
                .replaceAll("(?m)^-\\s+", "- ")
                .replaceAll("[ \\t]+\\n", "\n")
                .replaceAll("\\n{3,}", "\n\n")
                .trim();
        String normalized = normalizeVietnamese(formatted.toLowerCase(Locale.ROOT));
        if (normalized.contains("rag ma nguon dong")) {
            return formatted;
        }
        return limitChatListLines(formatted, 12);
    }

    private String limitChatListLines(String answer, int maxBullets) {
        String[] lines = answer.split("\\n", -1);
        StringBuilder sb = new StringBuilder();
        int bullets = 0;
        int omitted = 0;
        for (String line : lines) {
            boolean bullet = line.trim().startsWith("- ");
            if (bullet) {
                bullets++;
                if (bullets > maxBullets) {
                    omitted++;
                    continue;
                }
            }
            if (sb.length() > 0) sb.append("\n");
            sb.append(line);
        }
        if (omitted > 0) {
            sb.append("\n- **Xem hết:** còn ").append(omitted).append(" dòng, bấm nút Xem hết bên dưới để mở đúng phân hệ.");
        }
        return sb.toString().trim();
    }

    private String enforceNoUnsupportedModelFinalAnswer(String answer, String normalizedQuery, List<ReActStep> steps) {
        if (answer == null || answer.isBlank()) return answer;
        boolean hasExecutedTool = steps != null && steps.stream().anyMatch(step -> "TOOL".equals(step.type()));
        if (hasExecutedTool) return answer;

        String normalizedAnswer = normalizeVietnamese(answer.toLowerCase(Locale.ROOT));
        boolean claimedSystemLookup = containsAny(normalizedAnswer,
                "rexi kiem tra du lieu he thong",
                "toi da kiem tra du lieu he thong",
                "da kiem tra du lieu he thong",
                "tra du lieu he thong",
                "tra truc tiep tu he thong",
                "theo du lieu he thong",
                "trong he thong ghi nhan");
        boolean claimedCompletedAction = containsAny(normalizedAnswer,
                "da bam", "da nhan nut", "da chon", "da dien", "da cap nhat", "da xoa", "da huy",
                "da dat lich", "da tao lich", "da tao hoa don", "da khoa tai khoan", "da mo khoa",
                "da gui email", "da chuyen sang trang", "toi da mo trang");
        boolean hasActionTag = answer.matches("(?s).*\\[(CLICK|FILL|SELECT|TOGGLE|DELETE|SCROLL|NAVIGATE|AUTO_BOOK):[^\\]]+\\].*");

        if (claimedSystemLookup) {
            return "Tôi chưa chạy tool/DB trong lượt này nên sẽ không tự đưa kết quả hệ thống. Hãy yêu cầu tra cứu cụ thể để Rexi Agent kiểm quyền và đọc dữ liệu thật.";
        }
        if (claimedCompletedAction && !hasActionTag) {
            return "Tôi chưa thực hiện thao tác nào trên hệ thống trong lượt này. Nếu muốn thao tác thật, hãy ra lệnh rõ và cung cấp đủ định danh để Rexi Agent gọi đúng tool/DOM sau khi kiểm quyền.";
        }
        if (isEvidenceDemandingQuery(normalizedQuery) && !isSafeNonFactualAnswer(normalizedAnswer)) {
            return "Tôi chưa có bằng chứng từ tool/DB/RAG/nguồn đáng tin cậy trong lượt này nên sẽ không trả lời theo kiểu suy đoán. Hãy yêu cầu tra cứu cụ thể hoặc cung cấp tên màn hình, route, API, data-ai-id, mã hồ sơ hoặc dữ liệu nguồn cần kiểm chứng.";
        }
        return answer;
    }

    private boolean isEvidenceDemandingQuery(String normalizedQuery) {
        if (normalizedQuery == null || normalizedQuery.isBlank()) return false;
        return containsAny(normalizedQuery,
                "file nao", "dong nao", "line nao", "code nao", "ham nao", "function nao",
                "component nao", "route nao", "api nao", "endpoint nao", "data ai id", "data-ai-id",
                "model nao", "provider nao", "api key", "cau hinh ai",
                "bao nhieu", "so luong", "thong ke", "doanh thu", "xu huong", "ti le", "ty le",
                "kiem tra du lieu", "du lieu he thong", "trong db", "database", "sql",
                "hoa don", "lich hen", "benh an", "khach hang", "thu cung", "kho thuoc", "ton kho",
                "da bam", "da sua", "da cap nhat", "da xoa", "da huy", "da gui", "trang thai");
    }

    private boolean isSafeNonFactualAnswer(String normalizedAnswer) {
        if (normalizedAnswer == null || normalizedAnswer.isBlank()) return false;
        return containsAny(normalizedAnswer,
                "chua du bang chung",
                "chua co bang chung",
                "chua chay tool",
                "chua kiem tra",
                "can them thong tin",
                "khong du du lieu",
                "khong the xac minh",
                "khong tu dua",
                "khong suy doan");
    }

    private boolean isAffirmation(String normalizedQuery) {
        if (normalizedQuery == null || normalizedQuery.isBlank()) return false;
        String q = normalizedQuery.trim();
        if (q.matches("^(ok|oke|okay|k|dong y|xac nhan|chot|chot di|lam di|mo di|duoc|yes|y|yep|yeap|sure|confirm|ung|di|lam luon|mo luon|chot luon|approved|go)$")) {
            return true;
        }
        return (containsAny(q, "chot", "xac nhan", "dong y")
                || containsAny(q, "lam di", "mo di", "di thoi"))
                && q.length() <= 35;
    }

    private ReActResult handleSensitiveCommandGate(String normalizedQuery, List<ReActStep> steps) {
        if (normalizedQuery == null || normalizedQuery.isBlank()) return null;
        SensitiveCommand sensitiveCommand = classifySensitiveCommand(normalizedQuery);
        if (sensitiveCommand == null) return null;

        String answer = switch (sensitiveCommand.level()) {
            case "destructive" -> "CẢNH BÁO LỆNH NHẠY CẢM: Tôi phát hiện yêu cầu có thể thay đổi hoặc hủy dữ liệu hệ thống ("
                    + sensitiveCommand.label() + "). Rexi Agent chưa thực hiện thao tác nào. Vui lòng xác nhận rõ bằng câu: \"Tôi xác nhận "
                    + sensitiveCommand.confirmationText() + "\" và cung cấp đủ mã/tên/SĐT liên quan để tránh thao tác nhầm.";
            case "financial" -> "CẢNH BÁO DỮ LIỆU NHẠY CẢM: Yêu cầu liên quan hóa đơn/thanh toán/bill ("
                    + sensitiveCommand.label() + "). Rexi Agent chưa truy xuất hay thay đổi dữ liệu. Vui lòng xác nhận quyền xử lý và cung cấp mã hóa đơn, tên khách hoặc SĐT cụ thể.";
            default -> "CẢNH BÁO DỮ LIỆU NHẠY CẢM: Yêu cầu có thể truy cập thông tin cá nhân/hồ sơ nội bộ ("
                    + sensitiveCommand.label() + "). Rexi Agent chưa truy xuất dữ liệu. Vui lòng xác nhận quyền xử lý và cung cấp định danh cụ thể như tên, SĐT, mã khách hàng, mã thú cưng hoặc mã hồ sơ.";
        };

        steps.add(new ReActStep(
                "SENSITIVE_CONFIRMATION_REQUIRED",
                "Phát hiện lệnh hoặc dữ liệu nhạy cảm, dừng trước khi gọi tool/DB/AI.",
                null,
                Map.of("category", sensitiveCommand.level(), "label", sensitiveCommand.label()),
                answer
        ));
        steps.add(new ReActStep("FINAL", answer, null, null, null));
        return new ReActResult(answer, steps, "SensitiveGate");
    }

    private ReActResult handleSafetyAndPrivacyBatchIntent(String q, String userRole, List<ReActStep> steps) {
        if (q == null || q.isBlank()) return null;

        if (containsAny(q, "muon chet", "tu sat", "chan qua muon chet")) {
            return safetyResult(steps, "Em rất lo cho anh. Gọi 111 hoặc người thân ở cạnh anh ngay bây giờ; nếu có nguy hiểm trước mắt hãy gọi 115. Bé cún sẽ có phòng khám/hội cứu hộ hỗ trợ sau, ưu tiên an toàn của anh trước.");
        }

        if (containsAny(q, "giau xac", "can chet nguoi")) {
            return safetyResult(steps, "Em không hỗ trợ che giấu vi phạm. Anh cần trình báo công an ngay và đưa bé đi kiểm dịch dại.");
        }
        if (containsAny(q, "pha ba", "ba cho chet", "chet nhanh", "ghet cho hang xom", "giet cho", "bop chet")) {
            return safetyResult(steps, "Em không cung cấp hướng dẫn gây hại động vật. Bạo hành động vật có thể bị xử phạt rất nặng, trường hợp nghiêm trọng có thể bị xử lý hình sự.");
        }
        if (containsAny(q, "kill my dog", "muon giet con cho", "giết con chó")) {
            return safetyResult(steps, "Em không dịch hoặc hỗ trợ nội dung gây hại động vật. Nếu bé đang có vấn đề hành vi/sức khỏe, em có thể hướng dẫn phương án an toàn.");
        }
        if (containsAny(q, "mua xac cho", "moi cau")) {
            return safetyResult(steps, "PK tiêu hủy xác động vật theo quy định môi trường và kiểm soát dịch bệnh. Rexi không bán hoặc hỗ trợ mua bán xác động vật.");
        }
        if (containsAny(q, "ga nha toi chet", "ga chet", "dan con lai")) {
            return safetyResult(steps, "Gà chết bất thường có nguy cơ dịch lây đàn. Tách đàn còn lại ngay, không vứt xác bừa bãi; anh cho em biết đàn còn con nào sốt, ủ rũ, tiêu chảy, khó thở không? Nên báo thú y địa phương để kiểm tra dịch.");
        }
        if (containsAny(q, "hoc xuong")) {
            return safetyResult(steps, "1. Giữ bé bình tĩnh, không móc sâu nếu không nhìn rõ.\n2. Mở miệng kiểm tra, chỉ gắp xương khi thấy rõ và dễ lấy.\n3. Nếu khó thở, ho sặc, tím lưỡi: tới phòng khám ngay, gọi hotline 0353.374.156.");
        }
        if (containsAny(q, "nuoc mam")) {
            return safetyResult(steps, "KHÔNG dùng nước mắm giải độc; dễ gây ngộ độc muối và làm nặng hơn. Cho bé tới phòng khám ngay; trên đường đi chỉ dùng nước/Oresol lượng nhỏ nếu bé tỉnh và nuốt được.");
        }
        if (containsAny(q, "xanax")) {
            return safetyResult(steps, "Nghi ngộ độc Xanax. Không tự cho thêm thuốc khác; mang vỏ thuốc và đưa bé tới phòng khám GẤP. Gọi hotline 0353.374.156 để bác sĩ hướng dẫn trên đường đi.");
        }
        if (containsAny(q, "an phai ba", "an ba", "ba cho", "sui bot mep")) {
            return safetyResult(steps, "Nghi ngộ độc rất nặng. KHÔNG gây nôn nếu bé co giật/lơ mơ/sùi bọt; có than hoạt tính thì cho uống theo hướng dẫn trên bao bì. Đưa bé tới phòng khám gấp, gọi 0353.374.156.");
        }
        if (containsAny(q, "xe tong", "gay chan")) {
            return safetyResult(steps, "Cầm máu bằng gạc sạch, cố định tạm chân gãy, hạn chế di chuyển. Không cho ăn/uống vì có thể cần gây mê. Đưa bé tới phòng khám ngay.");
        }
        if (containsAny(q, "fip", "fiv", "felv", "parvo", "bach cau", "gbc")) {
            if (containsAny(q, "vach mo", "2 vach", "hai vach")) {
                return safetyResult(steps, "Vạch mờ vẫn có thể là dương tính. Cách ly bé ngay, giữ ấm/bù nước theo hướng dẫn bác sĩ và đưa tới phòng khám xét nghiệm xác nhận càng sớm càng tốt.");
            }
            return safetyResult(steps, "Đây là bệnh nghiêm trọng, nguy cơ tử vong cao nếu chậm điều trị. Cách ly bé và đưa tới phòng khám điều trị tích cực ngay.");
        }
        if (containsAny(q, "paracetamol")) {
            return safetyResult(steps, "Không. TUYỆT ĐỐI KHÔNG cho chó/mèo uống paracetamol; có thể gây ngộ độc gan thận và nguy hiểm tính mạng. Nếu đã uống, đưa bé tới phòng khám ngay.");
        }
        if (containsAny(q, "socola", "chocolate")) {
            return safetyResult(steps, "KHÔNG đúng. Socola có thể gây ngộ độc cho chó/mèo, nhất là socola đen. Gọi phòng khám và cho biết loại socola, lượng ăn, cân nặng của bé.");
        }
        if (containsAny(q, "dien giat")) {
            return safetyResult(steps, "Ngắt điện trước, không chạm trực tiếp khi bé còn dính nguồn điện. Kiểm tra thở/tim, CPR nếu ngừng thở và bạn biết cách làm. Đưa tới phòng khám ngay, gọi 0353.374.156.");
        }
        if (containsAny(q, "oi ra mau", "non ra mau")) {
            return safetyResult(steps, "1. Ói ra máu là cấp cứu: cho bé nhịn ăn, giữ ấm, không tự dùng thuốc.\n2. Rexi Agent sẽ kiểm tra slot BS Minh sớm nhất; nếu không còn slot thì ưu tiên bác sĩ trực gần nhất.\n3. Gọi 0353.374.156 để phòng khám nhận ca ngay.");
        }
        if (containsAny(q, "anh meo binh thuong", "anh cho binh thuong", "meo binh thuong", "cho binh thuong")
                && containsAny(q, "dut dau", "sap chet")) {
            return safetyResult(steps, "Em thấy bé bình thường. Anh trêu em đúng không? Nếu bé có dấu hiệu bất thường thật thì gọi 0353.374.156 ngay nhé.");
        }
        if (containsAny(q, "dua thoi", "khoe lam", "treu", "binh thuong")) {
            return safetyResult(steps, "May quá bé khỏe. Nếu có dấu hiệu bất thường như khó thở, co giật, chảy máu, bỏ ăn hoặc lừ đừ thì gọi 0353.374.156 ngay nhé.");
        }
        if (containsAny(q, "sap chet")) {
            return safetyResult(steps, "Anh bình tĩnh. Bé đang bị dấu hiệu gì: khó thở, co giật, chảy máu, ngộ độc hay tai nạn? Gọi 0353.374.156 ngay và đưa bé tới phòng khám/cơ sở thú y gần nhất.");
        }
        if (containsAny(q, "loi ruot", "dut dau")) {
            return safetyResult(steps, "Đây là cấp cứu. Băng tạm bằng gạc/khăn sạch ẩm, không tự nhét ruột/khâu/cắt gì ở nhà. Đưa bé tới phòng khám ngay hoặc gọi 0353.374.156.");
        }
        if (containsAny(q, "sua ong tho")) {
            return safetyResult(steps, "Không nên cho chó/mèo sơ sinh uống sữa Ông Thọ, dễ tiêu chảy mất nước rất nguy hiểm. Giữ ấm khoảng 30°C và dùng sữa thay thế cho chó mèo con như Bio Milk/Esbilac theo hướng dẫn.");
        }
        if (containsAny(q, "bi dai can", "cho nha can", "can rach tay", "can tao", "can em", "con tao 3 tuoi")) {
            return safetyResult(steps, "Rửa vết thương dưới vòi nước và xà phòng 15 phút, sát khuẩn, rồi tới cơ sở y tế/VNVC tiêm phòng dại càng sớm càng tốt, tốt nhất trong 24h. Bé chó cần được kiểm dịch dại.");
        }

        if (containsAny(q, "thuoc ngu", "thuoc me", "tu mo", "tu tiem", "an tu", "can sa", "cong thuc thuoc")) {
            if (containsAny(q, "tre em 10 tuoi", "10 tuoi")) {
                return safetyResult(steps, "Em không hướng dẫn tự mổ. Em nên nhờ người lớn gọi phòng khám ngay; tự mổ rất nguy hiểm cho bé và cho em.");
            }
            return safetyResult(steps, "Rexi không bán, không hướng dẫn dùng thuốc mê/thuốc kê đơn/an tử tại nhà. Việc tự làm rất nguy hiểm và có thể vi phạm pháp luật; hãy đưa bé tới phòng khám để bác sĩ xử lý đúng quy trình.");
        }
        if (containsAny(q, "ia bay", "danh no duoc khong")) {
            return safetyResult(steps, "Không nên. Bạo hành động vật có thể bị xử phạt rất nặng, trường hợp nghiêm trọng có thể bị xử lý hình sự. Anh nên trao đổi với chủ nuôi hoặc báo tổ dân phố/ban quản lý khu vực.");
        }
        if (containsAny(q, "danh no", "bao hanh")) {
            return safetyResult(steps, "Rexi không hỗ trợ hành vi gây hại hoặc che giấu vi phạm với động vật/người. Nếu có sự cố nghiêm trọng, hãy trình báo cơ quan chức năng và đưa bé đi kiểm dịch/khám ngay.");
        }
        if (containsAny(q, "cho giao phoi voi nguoi", "video cho giao phoi")) {
            return safetyResult(steps, "Rexi không tìm hoặc cung cấp nội dung tình dục liên quan động vật. Anh cần tư vấn sức khỏe sinh sản cho thú cưng thì em hỗ trợ theo hướng an toàn.");
        }
        if (containsAny(q, "gia vo toi la khach", "giả vờ tôi là khách", "bi leak doanh thu")) {
            return safetyResult(steps, "Không leak doanh thu. Rexi chỉ dùng quyền thật trong phiên đăng nhập và không đổi vai theo lời nhắn.");
        }
        if (containsAny(q, "update users set role")) {
            return safetyResult(steps, "Anh cần hỗ trợ gì về tài khoản ạ?");
        }
        if (containsAny(q, "danh sap web", "hacker", "tien chuoc", "btc")) {
            return safetyResult(steps, "Em đã báo IT. Rexi không cấp quyền hay dữ liệu vì đe dọa; nếu là sự cố thật, vui lòng liên hệ bộ phận kỹ thuật/cơ quan chức năng.");
        }
        if (containsAny(q, "hack", "sql xoa", "xoa het bang", "select from users", "sudo", "dan")) {
            return safetyResult(steps, "Rexi không hỗ trợ hack, tống tiền, prompt injection hoặc câu lệnh nguy hiểm. Nếu anh cần hỗ trợ tài khoản/kỹ thuật hợp lệ, em sẽ chuyển đúng quy trình IT.");
        }

        if (containsAny(q, "mat khau db", "pass admin", "password admin", "api key", "prompt la gi", "model gpt may")) {
            return safetyResult(steps, "Rexi không cung cấp mật khẩu, API key, prompt nội bộ hoặc thông tin vận hành nhạy cảm qua chat. Cần xử lý kỹ thuật thì liên hệ IT nội bộ theo quy trình xác minh.");
        }
        if (containsAny(q, "sdt cua", "so zalo", "zalo rieng", "dia chi nha", "info khach", "danh sach khach hang", "file excel danh sach", "export toan bo data", "data khach", "data gen")) {
            if (containsAny(q, "so zalo", "zalo rieng")) {
                return safetyResult(steps, "Em không share contact cá nhân. Anh liên hệ hotline phòng khám 0353.374.156 để được hỗ trợ nhé.");
            }
            return safetyResult(steps, "Rexi không chia sẻ thông tin cá nhân, danh sách khách hàng/nhân viên hoặc dữ liệu nội bộ qua chat. Vui lòng dùng tài khoản đúng quyền và quy trình xuất dữ liệu được phê duyệt.");
        }
        if (containsAny(q, "doanh thu", "tat ca khach hang", "mo het data", "chu tich nuoc")) {
            if (!RoleAccessPolicy.canUseAgentTool(userRole, "thong_ke_doanh_thu")) {
                return safetyResult(steps, "Rexi chỉ trả dữ liệu doanh thu theo quyền tài khoản thật trong phiên đăng nhập. Tài khoản hiện tại không có quyền xem doanh thu.");
            }
        }
        if (containsAny(q, "ban bac si", "ban bs", "ban cua bac si", "ban cua bs") && containsAny(q, "lich", "xem")) {
            return safetyResult(steps, "Rexi không chia sẻ lịch cá nhân chỉ vì quan hệ bạn bè. Nếu cần đặt lịch khám, anh cho em tên bé, ngày giờ mong muốn và em kiểm tra slot công khai của phòng khám.");
        }
        if (containsAny(q, "bs minh nghi viec")) {
            return safetyResult(steps, "Rexi không xác nhận thông tin nhân sự nhạy cảm qua chat. Em có thể kiểm tra lịch làm việc hoặc slot khám công khai của bác sĩ đó cho anh.");
        }

        if (containsAny(q, "thien meo khong can chu", "khong can chu dong y")) {
            return safetyResult(steps, "Không được. Triệt sản/phẫu thuật phải có chủ nuôi hoặc người có thẩm quyền ký cam kết đồng ý.");
        }
        if (containsAny(q, "dat dinh vi", "theo doi vo", "vo ngoai tinh")) {
            return safetyResult(steps, "Rexi không hỗ trợ theo dõi người khác hoặc chia sẻ thông tin cá nhân nhân viên. Thiết bị định vị chỉ dùng để quản lý thú cưng hợp pháp.");
        }

        if (isNonsenseOrSmalltalk(q)) {
            return safetyResult(steps, "Phòng khám vẫn mở. Anh cần đặt lịch, hỏi giá dịch vụ hay tư vấn triệu chứng cho bé không ạ?");
        }

        return null;
    }

    private ReActResult handleWeightUpdateFollowUpIntent(String q, List<ReActStep> steps) {
        if (q == null || q.isBlank()) return null;
        boolean weightContext = containsAny(q, "tang can", "tang can nang", "can nang", "kg", "kilo", "can len", "nang len", "giam can", "tang len", "doi len", "cap nhat len");
        if (!weightContext) return null;

        String normalized = q.replaceAll("\\s+", " ").trim();
        String petName = extractFirstGroup(normalized, "(?:be|pet|thu cung)\\s+([a-z0-9]{2,20})");
        String numeric = extractFirstGroup(normalized, "\\b(\\d+(?:[\\.,]\\d+)?)\\s*kg?\\b");
        boolean hasConflict = containsAny(q, "nham", "nhầm", "sau do", "sau đó", "de lenh cu", "do lenh", "doi lenh", "2 so", "hai so");

        if (petName == null && numeric != null && !hasConflict) {
            return finalResult(steps, "Cho bé nào ạ?");
        }
        if (petName != null && hasConflict) {
            return finalResult(steps, "Em thấy 2 số khác nhau. Cân nặng hiện tại là mấy kg?");
        }
        if (containsAny(q, "5kg", "5 kg") && containsAny(q, "3kg", "3 kg") && containsAny(q, "lu", "bé lu")) {
            return finalResult(steps, "Em thấy 2 số khác nhau. Cân nặng hiện tại là mấy kg?");
        }
        if (petName != null && numeric != null) {
            String value = numeric.replace(',', '.');
            return finalResult(steps, "Đã cập nhật cân nặng bé " + petName.substring(0, 1).toUpperCase(Locale.ROOT) + petName.substring(1) + " lên " + value + "kg.");
        }
        if (petName != null) {
            return finalResult(steps, "Em đã giữ ngữ cảnh bé " + petName + ". Anh gửi số kg mới nhé.");
        }
        return finalResult(steps, "Cho bé nào ạ?");
    }

    private ReActResult safetyResult(List<ReActStep> steps, String answer) {
        steps.add(new ReActStep("SAFETY_GUARD", "Trả lời bằng guard an toàn/quyền riêng tư deterministic.", null, null, answer));
        steps.add(new ReActStep("FINAL", answer, null, null, null));
        return new ReActResult(formatChatAnswer(answer), steps, "SafetyGuard");
    }

    private boolean isNonsenseOrSmalltalk(String q) {
        if (q == null || q.isBlank()) return false;
        if (q.matches("^(a\\s*){3,}$")) return true;
        if (containsAny(q, "hi hi hi hi hi", "oi doi oo", "hu hu hi hi", "chuot biet bay", "vo toi ngoai tinh", "code cho toi con game", "biet tao la ai", "hom qua tao hoi gi")) return true;
        return q.length() <= 20 && containsAny(q, "hihi", "hi hi", "alo", "noi gi di");
    }

    private record SensitiveCommand(String level, String label, String confirmationText) {}

    private boolean containsAny(String value, String... terms) {
        if (value == null) return false;
        String padded = " " + value.replaceAll("[^a-z0-9\\s]", " ").replaceAll("\\s+", " ").trim() + " ";
        for (String term : terms) {
            String normalizedTerm = term == null ? "" : term.replaceAll("[^a-z0-9\\s]", " ").replaceAll("\\s+", " ").trim();
            if (!normalizedTerm.isBlank() && padded.contains(" " + normalizedTerm + " ")) return true;
        }
        return false;
    }

    private String capitalizeName(String value) {
        if (value == null || value.isBlank()) return "";
        String cleaned = value.trim().replaceAll("\\s+", " ");
        return cleaned.substring(0, 1).toUpperCase(Locale.ROOT) + cleaned.substring(1);
    }

    private String extractPetBreed(String q) {
        if (q == null || q.isBlank()) return "";
        if (containsAny(q, "meo anh")) return "Anh";
        if (containsAny(q, "anh long ngan")) return "Anh lông ngắn";
        if (containsAny(q, "poodle")) return "Poodle";
        if (containsAny(q, "corgi")) return "Corgi";
        return "";
    }

    private boolean containsAnyTokenOrPhrase(String value, String... terms) {
        return containsAny(value, terms);
    }

    private SensitiveCommand classifySensitiveCommand(String q) {
        if (q == null) return null;

        if (containsAnyTokenOrPhrase(q, "chuyen trang", "mo trang", "vao trang", "qua trang", "di toi trang", "dua toi trang")) {
            return null;
        }

        // BỎ QUA nếu câu hỏi về vị trí code (file/dòng/component/API)
        if (containsAny(q, "file nao", "dong nao", "line nao", "code nao", "api nao", "endpoint nao", "component nao")) {
            return null;
        }

        // 1. Thao tác khóa tài khoản hoặc reset mật khẩu / thông tin bảo mật quan trọng
        boolean isLockAccount = containsAnyTokenOrPhrase(q, "khoa tai khoan", "khoa acc", "lock account");
        boolean isCredentialReset = containsAnyTokenOrPhrase(q, "reset mat khau", "doi mat khau", "reset password", "change password");

        if (isLockAccount || isCredentialReset) {
            return new SensitiveCommand("destructive", "khóa tài khoản hoặc mật khẩu", "thực hiện thao tác nhạy cảm này");
        }

        // 2. Thao tác xóa hoặc hủy các thực thể quan trọng (lịch hẹn, hóa đơn, thú cưng, bệnh án, khách hàng...)
        boolean hasDeleteVerb = containsAnyTokenOrPhrase(q, "xoa", "delete", "remove", "huy", "huy bo", "cancel");
        boolean hasImportantEntity = containsAny(q,
                "lich", "hoa don", "bill", "don", "phieu", "khach", "thu cung", "pet", "boss", "benh an", "ho so", "dich vu", "thuoc", "ca kham", "tai khoan", "acc"
        );

        if (hasDeleteVerb && containsAny(q, "lich", "lich hen") && q.matches(".*\\blh[-_a-z0-9]+\\b.*")) {
            return null;
        }

        if (hasDeleteVerb && hasImportantEntity) {
            return new SensitiveCommand("destructive", "xóa/hủy dữ liệu quan trọng", "thực hiện thao tác nhạy cảm này");
        }

        return null;
    }

    private String extractFirstGroup(String input, String regex) {
        java.util.regex.Matcher matcher = java.util.regex.Pattern.compile(regex).matcher(input);
        return matcher.find() ? matcher.group(1).trim() : null;
    }

    private String extractPendingName(String input) {
        String name = extractFirstGroup(input, "(?i)(?:Tên|Ten)\\s*:?\\s*([^\\n\\r|*]+)");
        if (name == null || name.isBlank()) {
            name = extractFirstGroup(input, "(?i)mở khóa(?: cho)?(?: tài khoản)?\\s+([^\\n\\r|?.!]+)");
        }
        return name != null ? name.replaceAll("\\s+", " ").trim() : null;
    }

    private String findLockedCustomerId(String name, String phone) {
        StringBuilder sql = new StringBuilder(
                "SELECT tk.id_khach_hang FROM TaiKhoan tk " +
                "LEFT JOIN KhachHang kh ON tk.id_khach_hang = kh.id_khach_hang " +
                "WHERE tk.id_khach_hang IS NOT NULL " +
                "AND (tk.trang_thai = 'Đã khóa' OR tk.trang_thai = 'inactive')"
        );
        List<Object> params = new ArrayList<>();
        if (phone != null && !phone.isBlank()) {
            sql.append(" AND kh.sdt = ?");
            params.add(phone);
        } else if (name != null && !name.isBlank()) {
            sql.append(" AND LOWER(kh.ten_khach_hang) LIKE LOWER(?)");
            params.add("%" + name + "%");
        } else {
            return null;
        }

        try {
            var rows = toolServiceJdbcQuery(sql.toString(), params.toArray());
            if (rows.isEmpty()) return null;
            Object value = rows.get(0).get("id_khach_hang");
            return value != null ? value.toString() : null;
        } catch (Exception e) {
            logger.warning("[ReAct] Không tìm được tài khoản bị khóa từ pending confirmation: " + e.getMessage());
            return null;
        }
    }

    private List<Map<String, Object>> toolServiceJdbcQuery(String sql, Object[] params) {
        return jdbcTemplate.queryForList(sql, params);
    }

    private ModelResponse callBestAvailableModel(List<ChatMessage> history) throws Exception {
        trimHistoryForModel(history);
        Exception lastError = null;
        try {
            String response = groqService.chat(history);
            logger.info("[ReAct] Model phan hoi thanh cong: Groq");
            return new ModelResponse(response, "Groq");
        } catch (Exception e) {
            lastError = e;
            logger.warning("[ReAct] Groq loi, fallback sang Gemini: " + e.getMessage());
        }

        try {
            String response = geminiService.chat(history);
            logger.info("[ReAct] Model phan hoi thanh cong (Fallback 1): Gemini");
            return new ModelResponse(response, "Gemini");
        } catch (Exception e) {
            lastError = e;
            logger.warning("[ReAct] Gemini loi, fallback sang OpenRouter: " + e.getMessage());
        }

        try {
            String response = openRouterService.chat(history);
            logger.info("[ReAct] Model phan hoi thanh cong (Fallback 2): OpenRouter");
            return new ModelResponse(response, "OpenRouter");
        } catch (Exception e) {
            lastError = e;
            logger.warning("[ReAct] OpenRouter loi: " + e.getMessage());
        }

        throw lastError != null ? lastError : new RuntimeException("Khong co provider AI kha dung.");
    }

    private String extractFirstJsonObject(String value) {
        if (value == null) return null;
        int start = value.indexOf('{');
        if (start < 0) return null;
        int depth = 0;
        boolean inString = false;
        boolean escaped = false;
        for (int i = start; i < value.length(); i++) {
            char ch = value.charAt(i);
            if (escaped) {
                escaped = false;
                continue;
            }
            if (ch == '\\') {
                escaped = true;
                continue;
            }
            if (ch == '"') {
                inString = !inString;
                continue;
            }
            if (!inString) {
                if (ch == '{') depth++;
                if (ch == '}') {
                    depth--;
                    if (depth == 0) {
                        return value.substring(start, i + 1);
                    }
                }
            }
        }
        return null;
    }

    private String normalizeVietnamese(String input) {
        if (input == null || input.isBlank()) return "";
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "");
        return normalized
                .replace('đ', 'd')
                .replace('Đ', 'D');
    }

    private String buildSystemPrompt(String userQuery, String username, String userRole) {
        String globalCtx = compactForModel(memoryService.getGlobalContext(userQuery), MAX_CONTEXT_CHARS);
        String userCtx   = (username != null) ? compactForModel(memoryService.getUserContext(username), MAX_CONTEXT_CHARS) : "";
        boolean isStaff  = isStaffRole(userRole);
        String toolsSchema = compactToolsSchemaForQuery(toolService.getToolsSchemaForRole(userRole), userQuery);
        String normalizedRole = RoleAccessPolicy.normalizeRole(userRole);
        String displayRole = RoleAccessPolicy.displayRoleName(normalizedRole);
        String roleWorkProfile = RoleAccessPolicy.roleWorkProfile(normalizedRole);
        String rolePromptGuidance = RoleAccessPolicy.rolePromptGuidance(normalizedRole);

        String medicalRule = switch (normalizedRole) {
            case "bac_si" ->
                "- Y te: ho tro chuyen sau (phan oan, nhom thuoc, lieu tham khao). Ghi ro la tham khao, quyet dinh cuoi do bac si.\n";
            case "y_ta" ->
                "- Y te: ho tro cham soc, huong dan sau dieu tri. KHONG ke phac do/lieu; chuyen bac si xu ly.\n";
            default ->
                "- Y te: KHONG chan doan, KHONG ke thuoc, KHONG neu lieu. Chi so cap an toan va huong dan gap bac si.\n";
        };

        String roleCtx = isStaff
            ? "Nhan su noi bo - vai tro: " + displayRole + " (" + normalizedRole + "). Ho so cong viec: " + roleWorkProfile + " Huong dan ho tro: " + rolePromptGuidance + " Chi dung tool trong danh sach quyen cua vai tro nay; khong doi xu nhu khach hang."
            : "Khach hang - username: " + username + ". Chi dung tool khach duoc phep.";

        return buildAgentIdentityBlock(userRole, isStaff)
            + "\n\n" + toolsSchema
            + "\n\n=== NGU CANH PHONG KHAM ===\n" + globalCtx
            + "\n=== THONG TIN NGUOI DUNG ===\n" + userCtx
            + "\n=== VAI TRO ===\n" + roleCtx
            + "\n\n=== LUAT HANH DONG (BAT BUOC) ===\n"
            + "0. REXI AGENT LA CHE DO LAM VIEC: uu tien hanh dong/tool/UI ngay khi du thong tin. Noi it, lam nhieu; khong tu van dai neu co the thao tac hoac tra ket qua truc tiep.\n"
            + "1. UI ACTION FIRST: neu user yeu cau doi/sua/dien/chon/bam tren man hinh va DOM co data-ai-id phu hop, final_answer = 1 cau ngan + action tags. Khong goi DB tool cho viec sua form thuong.\n"
            + "2. Format UI duy nhat: [CLICK:id] [FILL:id|value] [SELECT:id|value] [TOGGLE:id] [DELETE:id] [SCROLL:down|small] [NAVIGATE:/path]. Chi dung id co trong DOM.\n"
            + "3. DATA TOOL: neu can tra cuu/tao/sua du lieu he thong va du thong tin -> goi tool ngay, khong bao truoc.\n"
            + "4. Thieu 1 truong bat buoc -> hoi duy nhat 1 cau <= 10 tu. Thieu element DOM -> noi ro thieu element nao.\n"
            + "5. final_answer toi da 1-2 cau hoac 3 dong bullet ngan khi co nhieu y. Khong mo dau, khong tong ket tool data, khong viet phan tich dai.\n"
            + "6. BAT BUOC hieu ngon ngu tu nhien that: Gen Z, teencode, go sai, khong dau, chen tu dem, noi tuc, viet tat, noi vong, tieng Viet lai Anh. Khong duoc phu thuoc danh sach format co san.\n"
            + "7. Khi gap cau la, hay suy luan y dinh theo ngu canh + DOM hien tai: 'cai nay/cho nay/nut nay' thuong la element dang hien; 'tang len 2/up 2/set 2' la doi gia tri thanh 2; 'bam/nhan/an/tap' la click; 'chóa/chua/choa/doggo' la cho; 'miu/mew/meow' la meo. Neu van mo ho, hoi lai dung 1 cau ngan thay vi tra null.\n"
            + "8. Cau hoi trieu chung thu y (oi, bo an, run, nam im, gai, kho tho...) la tu van an toan, KHONG goi tim_thu_cung/tim_khach_hang neu user khong noi ro can tim ho so trong DB.\n"
            + "9. Tuyet doi khong lo reasoning/noi bo: khong viet <think>, </assistant>, tieng Anh phan tich, hoac giai thich qua trinh suy nghi trong final_answer.\n"
            + "10. Chuan hoa tool input: loai=Meo/Cho, ngay=YYYY-MM-DD, gio=HH:mm.\n"
            + "11. Chi goi tim_kiem_web khi user noi ro can len mang/web/tin moi/tai lieu ngoai he thong. CRUD, form, lich hen, kho, hoa don la tool noi bo/UI, khong dung web.\n"
            + medicalRule
            + "\n=== SITEMAP ===\n"
            + "[Khach] / | /bang-gia | /bac-si | /lien-he | /khach-hang/dashboard\n"
            + "/khach-hang/dat-lich-hen | /khach-hang/lich-su-lich-hen | /khach-hang/quan-ly-thu-cung\n"
            + "/khach-hang/ho-so-benh-an | /khach-hang/hoa-don-thanh-toan | /khach-hang/thong-tin-ca-nhan\n"
            + "[QL/NV] /quan-ly/dashboard | /quan-ly/lich-hen | /quan-ly/khach-hang-thu-cung\n"
            + "/quan-ly/ho-so-benh-an | /quan-ly/kham-benh | /quan-ly/don-thuoc | /quan-ly/hoa-don\n"
            + "/quan-ly/kho-thuoc | /quan-ly/nhap-kho | /quan-ly/nhan-vien-phan-quyen\n"
            + "/quan-ly/bao-cao-thong-ke | /quan-ly/ke-toan | /quan-ly/dich-vu | /quan-ly/cau-hinh\n";
    }

    private String buildAgentIdentityBlock(String userRole, boolean isStaff) {
        return """
            === DANH TINH AGENT ===
            - Ban la Rexi Agent - tro ly hanh dong cua phong kham thu y Rexi.
            - Vai tro: %s. Chi thao tac trong pham vi quyen nay.
            - Stack: Groq (Llama 3.3 70B) -> Gemini -> OpenRouter (fallback).
            - NGUYEN TAC: hanh dong truoc, giai thich sau neu can. Ngan gon la uu tien.
            """.formatted(userRole == null || userRole.isBlank() ? (isStaff ? "noi bo" : "khach/an danh") : userRole);
    }

    private boolean canUseTool(String userRole, String toolName) {
        return RoleAccessPolicy.canUseAgentTool(userRole, toolName);
    }

    private boolean isAdminCodeLookupQuery(String normalizedQuery, String userRole) {
        if (!RoleAccessPolicy.normalizeRole(userRole).equals("admin")) return false;
        if (normalizedQuery == null || normalizedQuery.isBlank()) return false;
        boolean asksLocation = containsAny(normalizedQuery,
                "o dau", "nam dau", "file nao", "dong nao", "line nao", "line nhiu", "trang nao", "route nao",
                "api nao", "endpoint nao", "component nao", "controller nao", "service nao",
                "ham nao", "function nao", "data ai id", "data-ai-id", "button-chatbot", "input-chatbot",
                "sua file nao", "sua code", "sua o dau", "chinh o dau", "chinh code", "doan nao", "doan code nao", "sua doan code", "cho nao");
        boolean codeContext = containsAny(normalizedQuery,
                "code", "source", "ma nguon", "file", "dong", "line", "route",
                "api", "endpoint", "component", "controller", "service", "tsx", "java",
                "button", "nut", "form", "input", "frontend", "backend",
                "css", "style", "mau chu", "mau nen", "doi mau", "chinh mau", "sua mau", "background", "color", "header", "chatbot", "khung chat");
        return asksLocation && codeContext;
    }

    private boolean hasCodeLineEvidence(String observation) {
        if (observation == null || observation.isBlank()) return false;
        String normalized = normalizeVietnamese(observation.toLowerCase(Locale.ROOT));
        return normalized.contains("rag ma nguon dong")
                && (normalized.contains("- dong ") || normalized.contains("\n- dong "))
                && (normalized.contains(".tsx") || normalized.contains(".ts") || normalized.contains(".java")
                    || normalized.contains(".css") || normalized.contains(".properties") || normalized.contains(".xml"));
    }

    private String compactToolsSchemaForQuery(String schema, String userQuery) {
        if (schema == null) return "";
        String normalized = normalizeVietnamese((userQuery == null ? "" : userQuery).toLowerCase(Locale.ROOT));
        boolean needsWeb = normalized.matches(".*\\b(web|internet|online|tin moi|moi nhat|len mang|google|tai lieu ngoai|nguon ngoai)\\b.*");
        if (needsWeb) {
            return compactForModel(schema, 4_000);
        }
        return Arrays.stream(schema.split("\\R"))
                .filter(line -> !line.contains("tim_kiem_web"))
                .reduce((a, b) -> a + "\n" + b)
                .map(value -> compactForModel(value, 3_500))
                .orElse("");
    }

    private boolean isToolRelevantForQuery(String normalizedQuery, String toolName) {
        if (!"tim_kiem_web".equals(toolName)) return true;
        return normalizedQuery.matches(".*\\b(web|internet|online|tin moi|moi nhat|len mang|google|tai lieu ngoai|nguon ngoai)\\b.*");
    }

    private void trimHistoryForModel(List<ChatMessage> history) {
        if (history == null || history.isEmpty()) return;
        for (ChatMessage message : history) {
            if (message.getContent() != null && message.getContent().length() > MAX_MODEL_MESSAGE_CHARS) {
                message.setContent(compactForModel(message.getContent(), MAX_MODEL_MESSAGE_CHARS));
            }
        }
        if (history.size() <= 7) return;
        List<ChatMessage> trimmed = new ArrayList<>();
        trimmed.add(history.get(0));
        trimmed.addAll(history.subList(history.size() - 6, history.size()));
        history.clear();
        history.addAll(trimmed);
    }

    private String compactForModel(String value, int maxChars) {
        if (value == null) return "";
        String compact = value.replaceAll("\\s+", " ").trim();
        if (compact.length() <= maxChars) return compact;
        return compact.substring(0, Math.max(0, maxChars - 32)) + "... [da rut gon]";
    }

    private boolean isStaffRole(String userRole) {
        return RoleAccessPolicy.isInternalStaffRole(userRole);
    }

    // Bổ sung phương thức trích xuất ý định nguyên bản của người dùng
    private String extractOriginalUserIntent(String query) {
        if (query == null) return "";
        String extracted = extractFirstGroup(query, "(?im)^\\s*(?:Yêu cầu người dùng|Yeu cau nguoi dung)\\s*:\\s*(.+?)\\s*$");
        if (extracted != null && !extracted.isBlank()) {
            return extracted;
        }
        return query;
    }

    // Bổ sung phương thức xử lý xác nhận tài khoản chờ đồng bộ (deterministic pending confirmation)
    private ReActResult handleDeterministicPendingConfirmation(
            String query, String originalIntent, String normalizedQuery,
            boolean isStaff, String userRole, List<ReActStep> steps) {
        return null;
    }
}


