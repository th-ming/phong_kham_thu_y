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

// * * ReAct Agent Service — vòng lặp Reason → Act → Observe (Level 5).
// * AI tự lên kế hoạch, gọi tools, quan sát kết quả và lặp lại tới khi hoàn thành.
@Service
public class ReActAgentService {

    private static final Logger logger = Logger.getLogger(ReActAgentService.class.getName());
    private static final int MAX_ITERATIONS = 4;
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

        // Greeting thuan tuy - chi xu ly instant, moi cau hoi thuc te de LLM tu phan tich.
        if (normalizedQuery.matches("^(hi|hello|helo|chao|xin chao|alo|hey|test|ping|yo|sup)$")) {
            String greeting = "Dạ, Rexi đây ạ! Sếp/bạn cần hỗ trợ gì — đặt lịch, xem hồ sơ, tra cứu thú cưng hay hỏi thú y đều được nha!";
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
                        String answer = node.get("final_answer").asText();
                        if (answer == null || answer.isBlank() || "null".equalsIgnoreCase(answer.trim())) {
                            answer = "Tôi chưa đủ dữ liệu để hoàn tất tác vụ này. Bạn gửi thêm SĐT khách hàng, tên thú cưng, ngày/giờ mong muốn hoặc chuyển sang thao tác thủ công trên đúng phân hệ giúp tôi.";
                        }
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

                        // Kiểm tra phân quyền tool của vai trò
                        if (!canUseTool(userRole, toolName)) {
                            String observation = "LỖI BẢO MẬT: Quyền hạn hiện tại của bạn không được phép sử dụng công cụ '" + toolName + "'.";
                            steps.add(new ReActStep("TOOL_UNAUTHORIZED", "Gọi tool thất bại do thiếu quyền", toolName, params, observation));
                            
                            ChatMessage systemWarningMsg = new ChatMessage();
                            systemWarningMsg.setRole("user");
                            systemWarningMsg.setContent("[HỆ THỐNG] Lỗi gọi tool " + toolName + " do vai trò " + userRole + " bị cấm. Hãy đưa ra câu trả lời final_answer từ chối ngắn gọn và thân thiện.");
                            history.add(systemWarningMsg);
                            continue;
                        }

                        logger.info("[ReAct] Thực thi tool: " + toolName + " với params: " + params);
                        String observation;
                        try {
                            observation = toolService.executeTool(toolName, params, username, userRole);
                        } catch (Exception e) {
                            logger.severe("[ReAct] Lỗi thực thi tool: " + e.getMessage());
                            observation = "Lỗi hệ thống khi chạy tool: " + e.getMessage();
                        }

                        steps.add(new ReActStep("TOOL", "Gọi tool " + toolName, toolName, params, observation));

                        ChatMessage assistantMsg = new ChatMessage();
                        assistantMsg.setRole("assistant");
                        assistantMsg.setContent(cleaned);
                        history.add(assistantMsg);

                        ChatMessage toolResultMsg = new ChatMessage();
                        toolResultMsg.setRole("user");
                        toolResultMsg.setContent("[KẾT QUẢ TOOL " + toolName.toUpperCase() + "]\n" + observation.substring(0, Math.min(600, observation.length())) + "\n\nfinal_answer ngay, <= 3 cau, khong mo dau.");
                        history.add(toolResultMsg);

                        if (history.size() > 7) {
                            List<ChatMessage> trimmed = new ArrayList<>();
                            trimmed.add(history.get(0));
                            trimmed.addAll(history.subList(history.size() - 6, history.size()));
                            history.clear();
                            history.addAll(trimmed);
                        }
                        continue;
                    }

                } catch (Exception parseEx) {
                    logger.warning("[ReAct] Không parse được JSON: " + parseEx.getMessage());
                }
            }

            // Nếu ko phải JSON hợp lệ -> coi đây là câu trả lời cuối
            steps.add(new ReActStep("FINAL", cleaned, null, null, null));
            return new ReActResult(cleaned, steps);
        }

        String fallback = "Rexi cần thêm thông tin. Bạn có thể bổ sung không?";
        return new ReActResult(fallback, steps);
    }

    private boolean isAffirmation(String normalizedQuery) {
        if (normalizedQuery == null || normalizedQuery.isBlank()) return false;
        String q = normalizedQuery.trim();
        if (q.matches("^(ok|oke|okay|k|dong y|xac nhan|chot|chot di|lam di|mo di|duoc|yes|y|yep|yeap|sure|confirm|ung|di|lam luon|mo luon|chot luon|approved|go)$")) {
            return true;
        }
        return (q.contains("chot") || q.contains("xac nhan") || q.contains("dong y")
                || q.contains("lam di") || q.contains("mo di") || q.contains("di thoi"))
                && q.length() <= 35;
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
        return input
                .replaceAll("[àáạảãâầấậẩẫăằắặẳẵ]", "a")
                .replaceAll("[èéẹẻẽêềếệểễ]", "e")
                .replaceAll("[ìíịỉĩ]", "i")
                .replaceAll("[òóọỏõôồốộổỗơờớợởỡ]", "o")
                .replaceAll("[ùúụủũưừứựửữ]", "u")
                .replaceAll("[ỳýỵỷỹ]", "y")
                .replaceAll("[đ]", "d");
    }

    private String buildSystemPrompt(String userQuery, String username, String userRole) {
        String globalCtx = memoryService.getGlobalContext(userQuery);
        String userCtx   = (username != null) ? memoryService.getUserContext(username) : "";
        boolean isStaff  = isStaffRole(userRole);
        String toolsSchema = toolService.getToolsSchemaForRole(userRole);
        String normalizedRole = RoleAccessPolicy.normalizeRole(userRole);

        String medicalRule = switch (normalizedRole) {
            case "bac_si" ->
                "- Y te: ho tro chuyen sau (phan oan, nhom thuoc, lieu tham khao). Ghi ro la tham khao, quyet dinh cuoi do bac si.\n";
            case "y_ta" ->
                "- Y te: ho tro cham soc, huong dan sau dieu tri. KHONG ke phac do/lieu; chuyen bac si xu ly.\n";
            default ->
                "- Y te: KHONG chan doan, KHONG ke thuoc, KHONG neu lieu. Chi so cap an toan va huong dan gap bac si.\n";
        };

        String roleCtx = isStaff
            ? "Nhan vien noi bo - vai tro: " + userRole + ". Chi dung tool trong danh sach quyen."
            : "Khach hang - username: " + username + ". Chi dung tool khach duoc phep.";

        return buildAgentIdentityBlock(userRole, isStaff)
            + "\n\n" + toolsSchema
            + "\n\n=== NGU CANH PHONG KHAM ===\n" + globalCtx
            + "\n=== THONG TIN NGUOI DUNG ===\n" + userCtx
            + "\n=== VAI TRO ===\n" + roleCtx
            + "\n\n=== LUAT HANH DONG (BAT BUOC) ===\n"
            + "1. UI ACTION FIRST: neu user yeu cau doi/sua/dien/chon/bam tren man hinh va DOM co data-ai-id phu hop, final_answer = 1 cau ngan + action tags. Khong goi DB tool cho viec sua form thuong.\n"
            + "2. Format UI duy nhat: [CLICK:id] [FILL:id|value] [SELECT:id|value] [TOGGLE:id] [DELETE:id] [SCROLL:down|small] [NAVIGATE:/path]. Chi dung id co trong DOM.\n"
            + "3. DATA TOOL: neu can tra cuu/tao/sua du lieu he thong va du thong tin -> goi tool ngay, khong bao truoc.\n"
            + "4. Thieu 1 truong bat buoc -> hoi duy nhat 1 cau <= 10 tu. Thieu element DOM -> noi ro thieu element nao.\n"
            + "5. final_answer toi da 2-3 cau. Khong mo dau, khong tong ket tool data, khong viet phan tich dai.\n"
            + "6. Ngon ngu Gen Z/teencode/khong dau -> hieu y, tra loi tieng Viet ngan.\n"
            + "7. Chuan hoa tool input: loai=Meo/Cho, ngay=YYYY-MM-DD, gio=HH:mm.\n"
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

    private boolean isStaffRole(String userRole) {
        return RoleAccessPolicy.isInternalStaffRole(userRole);
    }

    // Bổ sung phương thức trích xuất ý định nguyên bản của người dùng
    private String extractOriginalUserIntent(String query) {
        if (query == null) return "";
        return query;
    }

    // Bổ sung phương thức xử lý xác nhận tài khoản chờ đồng bộ (deterministic pending confirmation)
    private ReActResult handleDeterministicPendingConfirmation(
            String query, String originalIntent, String normalizedQuery,
            boolean isStaff, String userRole, List<ReActStep> steps) {
        return null;
    }
}
