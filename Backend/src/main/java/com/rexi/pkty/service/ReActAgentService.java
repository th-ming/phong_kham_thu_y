package com.rexi.pkty.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rexi.pkty.dto.ChatMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.logging.Logger;

/**
 * ReAct Agent Service — vòng lặp Reason → Act → Observe (Level 5).
 * AI tự lên kế hoạch, gọi tools, quan sát kết quả và lặp lại tới khi hoàn thành.
 * Tối đa 6 bước để tránh vòng lặp vô hạn.
 */
@Service
public class ReActAgentService {

    private static final Logger logger = Logger.getLogger(ReActAgentService.class.getName());
    private static final int MAX_ITERATIONS = 6;
    private static final Set<String> CUSTOMER_SAFE_TOOLS = Set.of(
            "tim_lich_trong",
            "tim_kiem_web",
            "kiem_tra_phan_he"
    );

    @Autowired private OpenRouterService openRouterService;
    @Autowired private GeminiService geminiService;
    @Autowired private GroqService groqService;
    @Autowired private AiToolService toolService;
    @Autowired private AiMemoryService memoryService;
    @Autowired private JdbcTemplate jdbcTemplate;

    private final ObjectMapper mapper = new ObjectMapper();

    public record ReActStep(String type, String content, String toolName, Map<String, Object> toolParams, String observation) {}
    public record ReActResult(String finalAnswer, List<ReActStep> steps) {}

    /**
     * Điểm vào chính — chạy vòng lặp ReAct cho một yêu cầu của người dùng.
     */
    public ReActResult run(String userQuery, String username, String userRole) {
        List<ReActStep> steps = new ArrayList<>();
        String originalUserIntent = extractOriginalUserIntent(userQuery);
        String normalizedQuery = normalizeVietnamese(originalUserIntent.trim().toLowerCase());

        ReActResult pendingConfirmationResult = handleDeterministicPendingConfirmation(
                userQuery,
                originalUserIntent,
                normalizedQuery,
                steps
        );
        if (pendingConfirmationResult != null) {
            return pendingConfirmationResult;
        }

        if (normalizedQuery.matches("^(hi|hello|helo|chao|xin chao|alo|hey|test)$")) {
            String greeting = "Dạ, Rexi Agent đang hoạt động bình thường. Bạn cần tôi hỗ trợ đặt lịch, xem hồ sơ, tra cứu lịch hẹn hay tìm thông tin thú y nào?";
            steps.add(new ReActStep("FINAL", greeting, null, null, null));
            return new ReActResult(greeting, steps);
        }

        // Xây dựng system prompt với tool schema + ngữ cảnh người dùng
        String systemPrompt = buildSystemPrompt(userQuery, username, userRole);

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

        // ── VÒNG LẶP ReAct ──
        for (int i = 0; i < MAX_ITERATIONS; i++) {
            logger.info("[ReAct] Vòng lặp #" + (i + 1));

            String rawResponse;
            try {
                rawResponse = callBestAvailableModel(history);
            } catch (Exception e) {
                logger.severe("[ReAct] Lỗi gọi LLM: " + e.getMessage());
                String fallback = "Rexi Agent đang bị lỗi kết nối tới nhà cung cấp AI bên ngoài. Các tác vụ tra cứu dữ liệu nội bộ vẫn cần cấu hình lại API key hoặc mạng trước khi chạy tiếp.";
                steps.add(new ReActStep("ERROR", fallback, null, null, e.getMessage()));
                return new ReActResult(fallback, steps);
            }

            // Cắt bỏ markdown code block nếu model trả về ```json ... ```
            String cleaned = rawResponse.trim();
            if (cleaned.startsWith("```")) {
                cleaned = cleaned.replaceAll("^```[a-z]*\\s*", "").replaceAll("\\s*```$", "").trim();
            }
            
            // Trích xuất block JSON phòng khi AI sinh ra văn bản "suy nghĩ" phía trước
            int jsonStartIndex = cleaned.indexOf("{");
            String possibleJson = jsonStartIndex >= 0 ? cleaned.substring(jsonStartIndex) : cleaned;

            // Kiểm tra xem đây có phải JSON tool call không
            if (jsonStartIndex >= 0) {
                try {
                    JsonNode node = mapper.readTree(possibleJson);

                    // ── FINAL ANSWER ──
                    if (node.has("final_answer")) {
                        String answer = node.get("final_answer").asText();
                        steps.add(new ReActStep("FINAL", answer, null, null, null));
                        return new ReActResult(answer, steps);
                    }

                    // ── TOOL CALL ──
                    if (node.has("tool")) {
                        String toolName = node.get("tool").asText();
                        Map<String, Object> params = new HashMap<>();
                        if (node.has("params") && node.get("params").isObject()) {
                            node.get("params").fields().forEachRemaining(entry ->
                                params.put(entry.getKey(), entry.getValue().asText()));
                        }

                        // Ghi lại bước Think
                        steps.add(new ReActStep("TOOL_CALL", "Gọi tool: " + toolName, toolName, params, null));
                        logger.info("[ReAct] Gọi tool: " + toolName + " | Params: " + params);

                        // Thực thi tool, nhưng không cho khách/ẩn danh quét dữ liệu nội bộ.
                        String observation = canUseTool(userRole, toolName)
                                ? toolService.executeTool(toolName, params)
                                : "Từ chối chạy tool nội bộ '" + toolName
                                        + "'. Tool này chỉ dành cho tài khoản nhân sự đã đăng nhập.";
                        logger.info("[ReAct] Kết quả tool: " + observation.substring(0, Math.min(200, observation.length())));

                        // Thêm kết quả vào steps
                        steps.set(steps.size() - 1, new ReActStep("TOOL_CALL", "Gọi tool: " + toolName, toolName, params, observation));

                        // Thêm kết quả tool vào lịch sử hội thoại để AI suy luận tiếp
                        ChatMessage assistantMsg = new ChatMessage();
                        assistantMsg.setRole("assistant");
                        assistantMsg.setContent(cleaned); // lệnh tool call gốc
                        history.add(assistantMsg);

                        ChatMessage toolResultMsg = new ChatMessage();
                        toolResultMsg.setRole("user");
                        toolResultMsg.setContent("[KẾT QUẢ TOOL " + toolName.toUpperCase() + "]\n" + observation + "\n\nDựa trên kết quả trên, hãy tiếp tục hoặc trả lời final_answer.");
                        history.add(toolResultMsg);

                        continue; // tiếp tục vòng lặp
                    }

                } catch (Exception parseEx) {
                    logger.warning("[ReAct] Không parse được JSON: " + parseEx.getMessage());
                }
            }

            // Nếu không phải JSON hợp lệ → coi đây là câu trả lời cuối
            steps.add(new ReActStep("FINAL", cleaned, null, null, null));
            return new ReActResult(cleaned, steps);
        }

        // Vượt quá số vòng lặp tối đa
        String fallback = "Đã hoàn thành phân tích sau " + MAX_ITERATIONS + " bước. Dựa trên dữ liệu thu thập được, tôi đã cố gắng hết sức để hỗ trợ bạn. Có thể yêu cầu của bạn cần thêm thông tin bổ sung.";
        return new ReActResult(fallback, steps);
    }

    private String extractOriginalUserIntent(String userQuery) {
        if (userQuery == null) return "";
        for (String line : userQuery.split("\\R")) {
            String normalizedLine = normalizeVietnamese(line.toLowerCase());
            if (normalizedLine.startsWith("yeu cau nguoi dung:")) {
                return line.substring(line.indexOf(":") + 1).trim();
            }
        }
        return userQuery.trim();
    }

    private ReActResult handleDeterministicPendingConfirmation(
            String fullQuery,
            String originalUserIntent,
            String normalizedQuery,
            List<ReActStep> steps
    ) {
        if (!isAffirmation(normalizedQuery) || fullQuery == null) {
            return null;
        }

        String normalizedFullQuery = normalizeVietnamese(fullQuery.toLowerCase());
        boolean hasSpecificPendingUnlockTarget = normalizedFullQuery.contains("da xac dinh duoc tai khoan")
                || normalizedFullQuery.contains("tai khoan ban muon mo khoa")
                || normalizedFullQuery.contains("sep xac nhan co muon mo khoa");
        boolean hasPendingUnlock = normalizedFullQuery.contains("mo khoa")
                && (normalizedFullQuery.contains("xac nhan") || normalizedFullQuery.contains("co muon") || normalizedFullQuery.contains("trang thai"))
                && normalizedFullQuery.contains("lich su chat gan nhat")
                && hasSpecificPendingUnlockTarget;

        if (!hasPendingUnlock) {
            return null;
        }

        Map<String, Object> params = new HashMap<>();
        String customerId = extractFirstGroup(fullQuery, "(?i)(?:ID khách hàng|ID khach hang)\\s*:?\\s*([A-Za-z0-9_-]+)");
        String accountId = extractFirstGroup(fullQuery, "(?i)(?:ID tài khoản|ID tai khoan|Tên đăng nhập|Ten dang nhap)\\s*:?\\s*([A-Za-z0-9_.@-]+)");
        String phone = extractFirstGroup(fullQuery, "(?:SĐT|SDT|Sdt|sdt)\\s*:?\\s*([0-9]{8,12})");
        String name = extractPendingName(fullQuery);

        if (customerId != null && !customerId.isBlank() && !"N".equalsIgnoreCase(customerId)) {
            params.put("id_khach_hang", customerId);
        } else if (accountId != null && !accountId.isBlank()) {
            params.put("id_tai_khoan", accountId);
        } else {
            String foundCustomerId = findLockedCustomerId(name, phone);
            if (foundCustomerId != null && !foundCustomerId.isBlank()) {
                params.put("id_khach_hang", foundCustomerId);
            }
        }

        if (!params.containsKey("id_khach_hang") && !params.containsKey("id_tai_khoan")) {
            String answer = "Tôi hiểu đây là xác nhận mở khóa, nhưng chưa xác định được ID tài khoản trong ngữ cảnh trước. Sếp gửi lại tên hoặc SĐT tài khoản cần mở khóa giúp tôi.";
            steps.add(new ReActStep("FINAL", answer, null, null, null));
            return new ReActResult(answer, steps);
        }

        params.put("hanh_dong", "MO_KHOA");
        steps.add(new ReActStep("TOOL_CALL", "Xác nhận trước đó hợp lệ, gọi tool mở khóa tài khoản.", "thao_tac_tai_khoan", params, null));
        String observation = toolService.executeTool("thao_tac_tai_khoan", params);
        steps.set(steps.size() - 1, new ReActStep("TOOL_CALL", "Xác nhận trước đó hợp lệ, gọi tool mở khóa tài khoản.", "thao_tac_tai_khoan", params, observation));

        String answer = observation.startsWith("✅")
                ? observation + " Sếp có thể kiểm tra lại danh sách tài khoản bị khóa để xác nhận."
                : observation;
        steps.add(new ReActStep("FINAL", answer, null, null, null));
        return new ReActResult(answer, steps);
    }

    private boolean isAffirmation(String normalizedQuery) {
        return normalizedQuery.matches("^(ok|oke|okay|dong y|xac nhan|chot|lam di|mo di|duoc|yes|y)$");
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
                "SELECT TOP 1 tk.id_khach_hang FROM TaiKhoan tk " +
                "LEFT JOIN KhachHang kh ON tk.id_khach_hang = kh.id_khach_hang " +
                "WHERE tk.id_khach_hang IS NOT NULL " +
                "AND (tk.trang_thai = N'Đã khóa' OR tk.trang_thai = 'inactive')"
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

    private String callBestAvailableModel(List<ChatMessage> history) throws Exception {
        Exception lastError = null;
        try {
            return openRouterService.chat(history);
        } catch (Exception e) {
            lastError = e;
            logger.warning("[ReAct] OpenRouter lỗi, fallback sang Gemini: " + e.getMessage());
        }

        try {
            return geminiService.chat(history);
        } catch (Exception e) {
            lastError = e;
            logger.warning("[ReAct] Gemini lỗi, fallback sang Groq: " + e.getMessage());
        }

        try {
            return groqService.chat(history);
        } catch (Exception e) {
            lastError = e;
            logger.warning("[ReAct] Groq lỗi: " + e.getMessage());
        }

        throw lastError != null ? lastError : new RuntimeException("Không có provider AI khả dụng.");
    }

    private String normalizeVietnamese(String input) {
        return input
                .replaceAll("[àáạảãâầấậẩẫăằắặẳẵ]", "a")
                .replaceAll("[èéẹẻẽêềếệểễ]", "e")
                .replaceAll("[ìíịỉĩ]", "i")
                .replaceAll("[òóọỏõôồốộổỗơờớợởỡ]", "o")
                .replaceAll("[ùúụủũưừứựửữ]", "u")
                .replaceAll("[ỳýỵỷỹ]", "y")
                .replaceAll("[đ]", "d");
    }

    /**
     * Xây dựng system prompt tích hợp ngữ cảnh người dùng + tool schema.
     */
    private String buildSystemPrompt(String userQuery, String username, String userRole) {
        // Cung cấp thông tin phòng khám và các RAG context
        String globalCtx = memoryService.getGlobalContext(userQuery);
        String userCtx   = (username != null) ? memoryService.getUserContext(username) : "";

        boolean isStaff = userRole != null && !userRole.isEmpty()
                && !userRole.equalsIgnoreCase("CUSTOMER")
                && !userRole.equalsIgnoreCase("KHACH_HANG");

        String roleContext = isStaff
            ? "Bạn đang hỗ trợ nhân viên nội bộ (vai trò: " + userRole + "). Có thể truy cập đầy đủ dữ liệu phòng khám."
            : "Bạn đang hỗ trợ khách hàng (username: " + username + "). Chỉ truy cập dữ liệu liên quan đến họ.";

        return toolService.getToolsSchema()
            + "\n\n=== NGỮ CẢNH PHÒNG KHÁM ===\n" + globalCtx
            + "\n=== THÔNG TIN NGƯỜI DÙNG ===\n" + userCtx
            + "\n=== VAI TRÒ ===\n" + roleContext
            + "\n\nQUY TẮC QUAN TRỌNG:\n"
            + "- Đọc kỹ phần 'Yêu cầu người dùng', 'Trang hiện tại', 'Bối cảnh giao diện hiện tại' và 'Nhật ký thao tác gần đây' nếu có trong tin nhắn user.\n"
            + "- Phân biệt rõ CÂU HỎI và LỆNH THAO TÁC: nếu người dùng hỏi 'có hoạt động không', 'vì sao', 'là gì', hãy giải thích/đề xuất kiểm tra; không tự điều hướng hoặc thao tác.\n"
            + "- Nếu người dùng muốn thao tác thật, hãy chọn tool phù hợp trước. Nếu tool chưa đủ dữ liệu, hỏi lại đúng một câu ngắn, không tự bịa dữ liệu.\n"
            + "- Nếu thấy người dùng đang ở sai trang, thiếu dữ liệu nhập, chưa lưu cấu hình, hoặc hành động có rủi ro, hãy cảnh báo và gợi ý bước tiếp theo.\n"
            + "- Tối ưu token: chỉ tóm tắt đúng dữ liệu cần thiết, không lặp lại toàn bộ DOM hoặc lịch sử dài.\n"
            + "- Sau khi có đủ thông tin từ tools, trả về final_answer bằng tiếng Việt rõ, ngắn, đúng vai trò hiện tại.\n"
            + "- Nếu câu hỏi đơn giản (chào hỏi, hỏi thông tin chung) → trả final_answer ngay, không cần dùng tool.\n"
            + "- KHÔNG bịa đặt dữ liệu. Chỉ dùng thông tin từ tool, bối cảnh màn hình được gửi lên hoặc kiến thức y khoa thực tế.\n";
    }

    private boolean canUseTool(String userRole, String toolName) {
        boolean isStaff = userRole != null && !userRole.isBlank()
                && !userRole.equalsIgnoreCase("CUSTOMER")
                && !userRole.equalsIgnoreCase("KHACH_HANG");
        return isStaff || CUSTOMER_SAFE_TOOLS.contains(toolName);
    }
}
