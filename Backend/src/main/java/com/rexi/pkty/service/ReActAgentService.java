package com.rexi.pkty.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rexi.pkty.dto.ChatMessage;
import com.rexi.pkty.security.RoleAccessPolicy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.logging.Logger;

// * * ReAct Agent Service — vòng lặp Reason → Act → Observe (Lvv 5).
// * AI tự lên kế hoạch, gọi tools, quan sát kết quả và lặp lại tới khi hoàn thành.
// * Tối đa 6 bước để tránh vòng lặp vô hạn.
@Service
public class ReActAgentService {

    private static final Logger logger = Logger.getLogger(ReActAgentService.class.getName());
    private static final int MAX_ITERATIONS = 6;
    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    @Autowired private OpenRouterService openRouterService;
    @Autowired private GeminiService geminiService;
    @Autowired private GroqService groqService;
    @Autowired private AiToolService toolService;
    @Autowired private AiMemoryService memoryService;
    @Autowired private JdbcTemplate jdbcTemplate;

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
        List<ReActStep> steps = new ArrayList<>();
        String originalUserIntent = extractOriginalUserIntent(userQuery);
        String normalizedQuery = normalizeVietnamese(originalUserIntent.trim().toLowerCase());
        boolean isStaff = isStaffRole(userRole);

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

        if (normalizedQuery.matches("^(hi|hello|helo|chao|xin chao|alo|hey|test)$")) {
            String greeting = "Dạ, Rexi Agent đang hoạt động bình thường. Bạn cần tôi hỗ trợ đặt lịch, xem hồ sơ, tra cứu lịch hẹn hay tìm thông tin thú y nào?";
            steps.add(new ReActStep("FINAL", greeting, null, null, null));
            return new ReActResult(greeting, steps);
        }

        ReActResult deterministicVetResult = handleDeterministicClinicAgentQuery(
                originalUserIntent,
                normalizedQuery,
                userRole,
                steps
        );
        if (deterministicVetResult != null) {
            return deterministicVetResult;
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

            // Trích xuất đúng object JSON đầu tiên, kể cả khi model lỡ thêm text phía trước/sau.
            String possibleJson = extractFirstJsonObject(cleaned);

            // Kiểm tra xem đây có phải JSON tool call ko
            if (possibleJson != null) {
                try {
                    JsonNode node = mapper.readTree(possibleJson);

                    // ── FINAL ANSWER ──
                    if (node.has("final_answer")) {
                        String answer = node.get("final_answer").asText();
                        if (answer == null || answer.isBlank() || "null".equalsIgnoreCase(answer.trim())) {
                            answer = "Tôi chưa đủ dữ liệu để hoàn tất tác vụ này. Bạn gửi thêm SĐT khách hàng, tên thú cưng, ngày/giờ mong muốn hoặc chuyển sang thao tác thủ công trên đúng phân hệ giúp tôi.";
                        }
                        steps.add(new ReActStep("FINAL", answer, null, null, null));
                        return new ReActResult(answer, steps, modelResponse.provider());
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

                        // Thực thi tool — từ chối nếu không đúng vai trò, trả thông báo thân thiện
                        if (!canUseTool(userRole, toolName)) {
                            String denial = RoleAccessPolicy.permissionDeniedMessage(toolName, userRole);
                            steps.set(steps.size() - 1, new ReActStep("TOOL_CALL", "Từ chối tool không đúng vai trò: " + toolName, toolName, params, denial));
                            steps.add(new ReActStep("FINAL", denial, null, null, null));
                            return new ReActResult(denial, steps);
                        }

                        String observation = toolService.executeTool(toolName, params, userRole, username);
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

            // Nếu ko phải JSON hợp lệ → coi đây là câu trả lời cuối
            steps.add(new ReActStep("FINAL", cleaned, null, null, null));
            return new ReActResult(cleaned, steps);
        }

        // Vượt quá số vòng lặp tối đa
        String fallback = "Đã hoàn thành phân tích sau " + MAX_ITERATIONS + " bước. Dựa trên dữ liệu thu thập được, tôi đã cố gắng hết sức để hỗ trợ bạn. Có thể yêu cầu của bạn cần thêm thông tin bổ sung.";
        return new ReActResult(fallback, steps);
    }

    private ReActResult handleDeterministicClinicAgentQuery(
            String originalUserIntent,
            String normalizedQuery,
            String userRole,
            List<ReActStep> steps
    ) {
        if (normalizedQuery == null || normalizedQuery.isBlank()) {
            return null;
        }

        if (containsAny(normalizedQuery, "thuoc", "tri ran", "ve ran", "bọ chét", "bo chet")
                && containsAny(normalizedQuery, "tho", "thỏ")) {
            if (!canUseTool(userRole, "xem_kho_thuoc")) {
                String denial = RoleAccessPolicy.permissionDeniedMessage("xem_kho_thuoc", userRole);
                steps.add(new ReActStep("FINAL", denial, null, null, null));
                return new ReActResult(denial, steps);
            }
            Map<String, Object> params = new HashMap<>();
            params.put("tu_khoa", "rận");
            String observation = toolService.executeTool("xem_kho_thuoc", params, userRole, null);
            steps.add(new ReActStep("TOOL_CALL", "Kiểm tra kho thuốc trị rận trước khi tư vấn cho thỏ.", "xem_kho_thuoc", params, observation));
            String answer = observation.toLowerCase(Locale.ROOT).contains("không tìm thấy")
                    || observation.toLowerCase(Locale.ROOT).contains("khong tim thay")
                ? "Dạ hiện tại kho chưa thấy thuốc trị rận chuyên dụng cho thỏ. Với thỏ không nên tự dùng thuốc của chó/mèo vì dễ quá liều hoặc kích ứng. Anh/chị nên đưa bé qua để bác sĩ kiểm tra da/lông và kê loại an toàn; nếu cần, tôi có thể hỗ trợ tìm lịch khám phù hợp."
                : "Tôi đã kiểm tra kho theo nhóm thuốc trị rận. Kết quả hiện có:\n" + observation
                    + "\nVới thỏ, vẫn cần bác sĩ xác nhận loại dùng được trước khi bán/kê vì thuốc chó/mèo có thể không an toàn cho thú nhỏ.";
            steps.add(new ReActStep("FINAL", answer, null, null, null));
            return new ReActResult(answer, steps);
        }

        if (containsAny(normalizedQuery, "kho", "thuoc", "ton kho", "con thuoc")
                && containsAny(normalizedQuery, "thuoc", "ran", "ve", "bo chet", "tri ran")) {
            if (!canUseTool(userRole, "xem_kho_thuoc")) {
                String denial = RoleAccessPolicy.permissionDeniedMessage("xem_kho_thuoc", userRole);
                steps.add(new ReActStep("FINAL", denial, null, null, null));
                return new ReActResult(denial, steps);
            }
            Map<String, Object> params = new HashMap<>();
            params.put("tu_khoa", containsAny(normalizedQuery, "ran", "ve", "bo chet") ? "rận" : "thuốc");
            String observation = toolService.executeTool("xem_kho_thuoc", params, userRole, null);
            steps.add(new ReActStep("TOOL_CALL", "Kiểm tra kho thuốc theo từ khóa liên quan.", "xem_kho_thuoc", params, observation));
            String answer = observation.toLowerCase(Locale.ROOT).contains("không tìm thấy")
                    || observation.toLowerCase(Locale.ROOT).contains("khong tim thay")
                ? "Tôi đã kiểm tra kho nhưng chưa thấy thuốc khớp từ khóa này. Nếu cần dùng cho thú cưng cụ thể, nên để bác sĩ kiểm tra trước rồi kê loại phù hợp."
                : "Tôi đã kiểm tra kho, kết quả hiện có:\n" + observation;
            steps.add(new ReActStep("FINAL", answer, null, null, null));
            return new ReActResult(answer, steps);
        }

        if (containsAny(normalizedQuery, "ma nguon", "file", "module", "nam o dau", "xu ly o dau")
                && containsAny(normalizedQuery, "chatbot", "giong noi", "voice", "mic", "agent")) {
            if (!canUseTool(userRole, "tra_cuu_ma_nguon")) {
                String denial = RoleAccessPolicy.permissionDeniedMessage("tra_cuu_ma_nguon", userRole);
                steps.add(new ReActStep("FINAL", denial, null, null, null));
                return new ReActResult(denial, steps);
            }
            Map<String, Object> params = new HashMap<>();
            params.put("tu_khoa", originalUserIntent);
            String observation = toolService.executeTool("tra_cuu_ma_nguon", params, userRole, null);
            steps.add(new ReActStep("TOOL_CALL", "Tra cứu index mã nguồn theo yêu cầu admin.", "tra_cuu_ma_nguon", params, observation));
            String answer = observation == null || observation.isBlank()
                    ? "Tôi chưa tìm thấy index mã nguồn phù hợp. Sếp hỏi cụ thể hơn theo nhóm: chatbot mic, agent model, phân quyền, đặt lịch, bệnh án."
                    : observation;
            steps.add(new ReActStep("FINAL", answer, null, null, null));
            return new ReActResult(answer, steps);
        }

        boolean appointmentIntent = containsAny(normalizedQuery, "dat lich", "lap lich", "tao lich", "kham", "lich trong", "gio trong", "khung gio trong");
        if (!appointmentIntent) {
            return null;
        }

        if (containsAny(normalizedQuery, "lich trong", "gio trong", "khung gio trong")
                && containsAny(normalizedQuery, "chieu mai", "ngay mai", "mai")) {
            LocalDate targetDate = LocalDate.now(VN_ZONE).plusDays(1);
            return buildAppointmentSlotReply(userRole, steps, targetDate,
                    "Tôi kiểm tra lịch trống theo yêu cầu.",
                    "kiểm tra lịch trống",
                    normalizedQuery.contains("sang"));
        }

        if (containsAny(normalizedQuery, "doi sang", "doi lich", "a ma thoi", "thoi doi", "9h sang mai", "9 gio sang mai")) {
            LocalDate targetDate = LocalDate.now(VN_ZONE).plusDays(1);
            return buildAppointmentSlotReply(userRole, steps, targetDate,
                    "Tôi bỏ qua mốc 3h chiều nay và kiểm tra lại theo yêu cầu mới: 9h sáng mai.",
                    "khám da liễu cho chó",
                    true);
        }

        if (containsAny(normalizedQuery, "cuoi tuan", "thu bay", "chu nhat")
                && containsAny(normalizedQuery, "poodle", "ngua tai", "da lieu", "tai")) {
            LocalDate targetDate = nextWeekendDate();
            return buildAppointmentSlotReply(userRole, steps, targetDate,
                    "Tôi hiểu bé Poodle bị ngứa tai, phù hợp nhóm khám da liễu/tai. Tôi kiểm tra lịch cuối tuần trước.",
                    "khám da liễu/tai cho Poodle",
                    true);
        }

        if (containsAny(normalizedQuery, "chieu mai", "chiều mai") && containsAny(normalizedQuery, "cun", "cho", "dog")) {
            LocalDate targetDate = LocalDate.now(VN_ZONE).plusDays(1);
            return buildAppointmentSlotReply(userRole, steps, targetDate,
                    "Tôi kiểm tra lịch trống chiều mai trước khi hỏi nốt thông tin còn thiếu.",
                    "khám cho cún",
                    false);
        }

        return null;
    }

    private ReActResult buildAppointmentSlotReply(
            String userRole,
            List<ReActStep> steps,
            LocalDate targetDate,
            String intro,
            String serviceContext,
            boolean preferMorning
    ) {
        if (!canUseTool(userRole, "tim_lich_trong")) {
            String denial = RoleAccessPolicy.permissionDeniedMessage("tim_lich_trong", userRole);
            steps.add(new ReActStep("FINAL", denial, null, null, null));
            return new ReActResult(denial, steps);
        }

        Map<String, Object> params = new HashMap<>();
        params.put("ngay", targetDate.toString());
        String observation = toolService.executeTool("tim_lich_trong", params, userRole, null);
        steps.add(new ReActStep("TOOL_CALL", "Kiểm tra lịch trống ngày " + targetDate + ".", "tim_lich_trong", params, observation));

        String timeHint = preferMorning ? "Nếu muốn buổi sáng, ưu tiên 09:00 nếu còn trống; nếu 09:00 kín thì chọn khung gần nhất trong buổi sáng."
                : "Nếu muốn buổi chiều, có thể chọn một khung cụ thể như 14:00, 15:00 hoặc 16:00 nếu còn trống.";
        String answer = intro + "\n\n"
                + observation + "\n"
                + timeHint + "\n\n"
                + "Để đặt lịch thật, tôi cần thêm đúng các thông tin còn thiếu: SĐT/tên khách hàng, tên bé hoặc ID thú cưng, triệu chứng/lý do khám và khung giờ muốn chốt. Khi đủ dữ liệu tôi sẽ tóm tắt lại " + serviceContext + " rồi mới hỏi xác nhận, không tự tạo lịch khi chưa chốt.";
        steps.add(new ReActStep("FINAL", answer, null, null, null));
        return new ReActResult(answer, steps);
    }

    private LocalDate nextWeekendDate() {
        LocalDate date = LocalDate.now(VN_ZONE);
        for (int i = 1; i <= 7; i++) {
            LocalDate candidate = date.plusDays(i);
            if (candidate.getDayOfWeek() == DayOfWeek.SATURDAY || candidate.getDayOfWeek() == DayOfWeek.SUNDAY) {
                return candidate;
            }
        }
        return date.plusDays(5);
    }

    private boolean containsAny(String value, String... terms) {
        if (value == null) return false;
        for (String term : terms) {
            if (term != null && !term.isBlank() && value.contains(normalizeVietnamese(term.toLowerCase(Locale.ROOT)))) {
                return true;
            }
        }
        return false;
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
            boolean isStaff,
            String userRole,
            List<ReActStep> steps
    ) {
        if (!isAffirmation(normalizedQuery) || fullQuery == null) {
            return null;
        }

        if (!isStaff) {
            String answer = "Tài khoản khách hàng không được xác nhận hoặc thực hiện thao tác nhạy cảm trên tài khoản, khách hàng, hóa đơn hay dữ liệu nội bộ phòng khám.";
            steps.add(new ReActStep("FINAL", answer, null, null, null));
            return new ReActResult(answer, steps);
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

        if (!RoleAccessPolicy.canUseAgentTool(userRole, "thao_tac_tai_khoan")) {
            String answer = RoleAccessPolicy.permissionDeniedMessage("thao_tac_tai_khoan", userRole);
            steps.add(new ReActStep("FINAL", answer, null, null, null));
            return new ReActResult(answer, steps);
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
        String observation = toolService.executeTool("thao_tac_tai_khoan", params, userRole, null);
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

    private ModelResponse callBestAvailableModel(List<ChatMessage> history) throws Exception {
        Exception lastError = null;
        try {
            String response = openRouterService.chat(history);
            logger.info("[ReAct] Model phản hồi thành công: OpenRouter");
            return new ModelResponse(response, "OpenRouter");
        } catch (Exception e) {
            lastError = e;
            logger.warning("[ReAct] OpenRouter lỗi, fallback sang Gemini: " + e.getMessage());
        }

        try {
            String response = geminiService.chat(history);
            logger.info("[ReAct] Model phản hồi thành công (Fallback 1): Gemini");
            return new ModelResponse(response, "Gemini");
        } catch (Exception e) {
            lastError = e;
            logger.warning("[ReAct] Gemini lỗi, fallback sang Groq: " + e.getMessage());
        }

        try {
            String response = groqService.chat(history);
            logger.info("[ReAct] Model phản hồi thành công (Fallback 2): Groq");
            return new ModelResponse(response, "Groq");
        } catch (Exception e) {
            lastError = e;
            logger.warning("[ReAct] Groq lỗi: " + e.getMessage());
        }

        throw lastError != null ? lastError : new RuntimeException("Không có provider AI khả dụng.");
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
        return input
                .replaceAll("[àáạảãâầấậẩẫăằắặẳẵ]", "a")
                .replaceAll("[èéẹẻẽêềếệểễ]", "e")
                .replaceAll("[ìíịỉĩ]", "i")
                .replaceAll("[òóọỏõôồốộổỗơờớợởỡ]", "o")
                .replaceAll("[ùúụủũưừứựửữ]", "u")
                .replaceAll("[ỳýỵỷỹ]", "y")
                .replaceAll("[đ]", "d");
    }

    // * * Xây dựng system prompt tích hợp ngữ cảnh người dùng + tool schema.
    private String buildSystemPrompt(String userQuery, String username, String userRole) {
        String globalCtx = memoryService.getGlobalContext(userQuery);
        String userCtx   = (username != null) ? memoryService.getUserContext(username) : "";

        boolean isStaff = isStaffRole(userRole);

        String roleContext = isStaff
            ? "Bạn đang hỗ trợ nhân viên nội bộ (vai trò: " + userRole + "). CHỈ được dùng tool trong danh sách — không truy vấn dữ liệu ngoài quyền vai trò."
            : "Bạn đang hỗ trợ khách hàng (username: " + username + "). Chỉ dùng tool khách được phép; dữ liệu cá nhân qua trang khách hàng.";

        String toolsSchema = toolService.getToolsSchemaForRole(userRole);
        String normalizedRole = RoleAccessPolicy.normalizeRole(userRole);

        // Tách 3 tầng câu trả lời y tế theo chuyên môn vai trò
        String medicalRule = switch (normalizedRole) {
            case "bac_si" ->
                "- Với yêu cầu y tế từ BÁC SĨ: được hỗ trợ chuyên sâu ở mức tham khảo lâm sàng gồm chẩn đoán phân biệt, xét nghiệm nên cân nhắc, nhóm thuốc/phác đồ tham khảo (bao gồm liều dùng theo cân nặng/loài nếu có trong tài liệu), cảnh báo chống chỉ định và theo dõi điều trị. Luôn nói rõ quyết định cuối cùng thuộc bác sĩ sau thăm khám trực tiếp; không khẳng định chắc chắn khi thiếu dữ kiện loài/tuổi/cân nặng/tiền sử/xét nghiệm.\n";
            case "y_ta" ->
                "- Với yêu cầu y tế từ Y TÁ: được hỗ trợ ở mức chăm sóc và hỗ trợ lâm sàng — mô tả triệu chứng, hướng dẫn chăm sóc sau điều trị, nhận biết dấu hiệu xấu đi cần báo bác sĩ. KHÔNG cung cấp phác đồ điều trị, liều thuốc kê đơn hoặc thay thế quyết định của bác sĩ; mọi chỉ định điều trị phải do bác sĩ phụ trách xác nhận.\n";
            default ->
                "- Với yêu cầu y tế từ khách hàng hoặc nhân sự không lâm sàng: KHÔNG chẩn đoán khẳng định, KHÔNG kê thuốc, KHÔNG nêu liều dùng/kháng sinh/thuốc kê đơn; chỉ tư vấn sơ cứu an toàn, nhận biết dấu hiệu nguy hiểm và hướng dẫn đưa thú cưng đến gặp bác sĩ/phòng khám.\n";
        };

        return buildAgentIdentityBlock(userRole, isStaff)
            + "\n\n" + toolsSchema
            + "\n\n=== NGỮ CẢNH PHÒNG KHÁM ===\n" + globalCtx
            + "\n=== THÔNG TIN NGƯỜI DÙNG ===\n" + userCtx
            + "\n=== VAI TRÒ ===\n" + roleContext
            + "\n\nQUY TẮC QUAN TRỌNG:\n"
            + "- Đọc kỹ phần 'Yêu cầu người dùng', 'Trang hiện tại', 'Bối cảnh giao diện hiện tại' và 'Nhật ký thao tác gần đây' nếu có trong tin nhắn user.\n"
            + "- Phân biệt rõ CÂU HỎI và LỆNH THAO TÁC: nếu người dùng hỏi 'có hoạt động không', 'vì sao', 'là gì', hãy giải thích/đề xuất kiểm tra; không tự điều hướng hoặc thao tác.\n"
            + "- Nếu người dùng muốn thao tác thật, hãy chọn tool phù hợp trước. Nếu tool chưa đủ dữ liệu, hỏi lại đúng một câu ngắn, không tự bịa dữ liệu.\n"
            + "- Người dùng có thể gõ teencode, không dấu, sai chính tả hoặc trộn Anh-Việt: me0/cat = Mèo; cho/cún/dog/gâu gâu = Chó; ear = tai; hair = lông; service = dịch vụ; treat = điều trị; k0/ko = không. Hãy hiểu ý định cốt lõi, nhưng luôn trả lời bằng tiếng Việt chuẩn mực, không nhại lại kiểu gõ loạn.\n"
            + "- KHI GỌI TOOL/FUNCTION: phải chuẩn hóa tham số trước khi truyền API. Ví dụ loai_thu_cung/loai phải là \"Mèo\" hoặc \"Chó\", không truyền \"me0\", \"cat\", \"dog\", \"gâu gâu\"; ngày giờ phải chuẩn YYYY-MM-DD/HH:mm; tên tool phải khớp chính xác danh sách được phép.\n"
            + medicalRule
            + "- Nếu admin hỏi bạn là ai, đang dùng provider/model nào, hoặc AI cấu hình ra sao, hãy dùng tool kiem_tra_cau_hinh_ai nếu được phép rồi trả lời theo kết quả tool.\n"
            + "- Nếu admin hỏi mã nguồn/module/file/API/tool nào xử lý việc gì, hãy dùng tool tra_cuu_ma_nguon trước để định vị đúng nơi; nếu hỏi tổng quan kiến trúc thì dùng kiem_tra_kien_truc_he_thong.\n"
            + "- Không yêu cầu hoặc lặp lại toàn bộ DOM/source. Chỉ xin thêm đúng phần thiếu nếu tool index chưa đủ để trả lời.\n"
            + "- Nếu thấy người dùng đang ở sai trang, thiếu dữ liệu nhập, chưa lưu cấu hình, hoặc hành động có rủi ro, hãy cảnh báo và gợi ý bước tiếp theo.\n"
            + "- Tối ưu token: chỉ tóm tắt đúng dữ liệu cần thiết, không lặp lại toàn bộ DOM hoặc lịch sử dài.\n"
            + "- Sau khi có đủ thông tin từ tools, trả về final_answer bằng tiếng Việt rõ, ngắn, đúng vai trò hiện tại.\n"
            + "- Nếu câu hỏi đơn giản (chào hỏi, hỏi thông tin chung) → trả final_answer ngay, không cần dùng tool.\n"
            + "- BẠN LÀ NGƯỜI LÁI XE CỦA HỆ THỐNG (ĐIỀU HƯỚNG): Nếu người dùng có ý định muốn xem dữ liệu, thực hiện chức năng ở một phân hệ khác (ví dụ: 'về trang chủ', 'mở chỗ nhân sự', 'cho tôi xem kho thuốc'), bạn hãy tự động phân tích ngữ nghĩa, tìm đường dẫn phù hợp trong SITEMAP và BẮT BUỘC chèn thẻ [NAVIGATE:đường_dẫn] ở cuối câu trả lời.\n"
            + "- Với các thao tác tương tác giao diện trực tiếp, hãy dựa vào ID hoặc Role của Element trong 'Bối cảnh giao diện hiện tại' (DOM context). Bạn có thể tự động thực thi bằng cách BẮT BUỘC chèn các thẻ sau vào cuối câu trả lời:\n"
            + "  + Để bấm nút/link: [CLICK:element_id]\n"
            + "  + Để điền chữ vào ô nhập: [FILL:input_id|nội_dung_cần_điền]\n"
            + "  + Để bật/tắt switch/checkbox: [TOGGLE:element_id]\n"
            + "  + Để chọn giá trị dropdown: [SELECT:select_id|giá_trị_chọn]\n"
            + "  + Bạn có thể kết hợp nhiều thẻ cùng lúc (VD: [NAVIGATE:/quan-ly/nhan-vien-phan-quyen][FILL:search|Nguyễn][CLICK:btn-submit]).\n"
            + "- Nếu người dùng nói 'làm đi', 'đổi cho tôi', 'sửa giúp', 'điền giúp' trên form hiện tại, KHÔNG trả lời phân tích dài. Nếu DOM context có data-ai-id phù hợp, hãy phát thẻ [FILL]/[SELECT]/[CLICK] ngay.\n"
            + "\n=== SƠ ĐỒ HỆ THỐNG (SITEMAP) ===\n"
            + "Sử dụng các đường dẫn này cho lệnh [NAVIGATE:...]\n"
            + "[Dành cho Khách hàng]\n"
            + "- / (Trang chủ)\n"
            + "- /ve-chung-toi (Giới thiệu), /bang-gia (Bảng giá), /lien-he (Liên hệ), /bac-si (Bác sĩ)\n"
            + "- /khach-hang/dashboard (Bảng điều khiển)\n"
            + "- /khach-hang/quan-ly-thu-cung (Thú cưng của tôi)\n"
            + "- /khach-hang/dat-lich-hen (Đặt lịch)\n"
            + "- /khach-hang/lich-su-lich-hen (Lịch sử hẹn)\n"
            + "- /khach-hang/ho-so-benh-an (Bệnh án)\n"
            + "- /khach-hang/hoa-don-thanh-toan (Hóa đơn)\n"
            + "- /khach-hang/thong-tin-ca-nhan (Hồ sơ cá nhân)\n"
            + "\n[Dành cho Quản lý / Nhân viên]\n"
            + "- /quan-ly/dashboard (Bảng tổng quan)\n"
            + "- /quan-ly/lich-lam-viec (Lịch làm việc)\n"
            + "- /quan-ly/thong-tin-ca-nhan (Hồ sơ nhân viên)\n"
            + "- /quan-ly/lich-hen (Quản lý lịch hẹn)\n"
            + "- /quan-ly/khach-hang-thu-cung (Khách hàng & Thú cưng)\n"
            + "- /quan-ly/ho-so-benh-an (Hồ sơ bệnh án)\n"
            + "- /quan-ly/kham-benh (Khám bệnh)\n"
            + "- /quan-ly/don-thuoc (Đơn thuốc)\n"
            + "- /quan-ly/xet-nghiem (Xét nghiệm)\n"
            + "- /quan-ly/hoa-don (Hóa đơn & Thanh toán)\n"
            + "- /quan-ly/ke-toan (Kế toán & Thu chi)\n"
            + "- /quan-ly/bao-cao-thong-ke (Báo cáo & Thống kê)\n"
            + "- /quan-ly/nhap-kho, /quan-ly/kho-thuoc (Quản lý Kho thuốc / Vật tư)\n"
            + "- /quan-ly/nhan-vien-phan-quyen (Nhân sự & Phân quyền)\n"
            + "- /quan-ly/cau-hinh (Cấu hình hệ thống)\n"
            + "- /quan-ly/dich-vu (Quản lý dịch vụ)\n"
            + "- /quan-ly/marketing (Chiến dịch Marketing)\n";
    }

    private String buildAgentIdentityBlock(String userRole, boolean isStaff) {
        return """
            === DANH TÍNH VÀ NĂNG LỰC RUNTIME ===
            - Bạn là Rexi Agent, trợ lý tác vụ nội bộ của hệ thống phòng khám thú y Rexi.
            - Người đang dùng có vai trò: %s. Chỉ trả lời và thao tác trong phạm vi quyền của vai trò này.
            - ReAct Agent gọi model theo thứ tự fallback: OpenRouter -> Gemini -> Groq. Model cụ thể lấy từ cấu hình hệ thống hoặc fallback môi trường, không tự bịa tên model.
            - Bạn không tự đọc file mã nguồn trực tiếp ở runtime. Bạn hiểu hệ thống qua tool schema, route map, context giao diện ngắn, nhật ký thao tác và tool tra cứu index mã nguồn/bản đồ kiến trúc nếu được cấp quyền.
            - Chat thường của khách hàng và Rexi Agent nội bộ là hai luồng khác nhau: ChatController xử lý chat thường; AgentController + ReActAgentService xử lý Agent nội bộ.
            - Nếu người dùng là khách hàng/ẩn danh, không tiết lộ kiến trúc nội bộ, cấu hình AI, dữ liệu khách khác, tài khoản, bệnh án, hóa đơn, doanh thu hoặc tool quản trị.
            """.formatted(userRole == null || userRole.isBlank() ? (isStaff ? "nội bộ" : "khách/ẩn danh") : userRole);
    }

    private boolean canUseTool(String userRole, String toolName) {
        return RoleAccessPolicy.canUseAgentTool(userRole, toolName);
    }

    private boolean isStaffRole(String userRole) {
        return RoleAccessPolicy.isInternalStaffRole(userRole);
    }
}
