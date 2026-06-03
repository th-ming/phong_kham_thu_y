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

        ReActResult sensitiveGateResult = handleSensitiveCommandGate(normalizedQuery, steps);
        if (sensitiveGateResult != null) {
            return sensitiveGateResult;
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

        // Greeting thuan tuy - chi xu ly instant, moi cau hoi thuc te de LLM tu phan tich.
        ReActResult deterministicIntent = handleDeterministicIntent(normalizedQuery, isStaff, userRole, username, steps);
        if (deterministicIntent != null) {
            return deterministicIntent;
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
            steps.add(new ReActStep("FINAL", cleaned, null, null, null));
            return new ReActResult(cleaned, steps);
        }

        String fallback = "Rexi cần thêm thông tin. Bạn có thể bổ sung không?";
        return new ReActResult(fallback, steps);
    }

    private ReActResult handleDeterministicIntent(String normalizedQuery, boolean isStaff, String userRole, String username, List<ReActStep> steps) {
        if (normalizedQuery == null || normalizedQuery.isBlank()) {
            return finalResult(steps, "Bạn muốn Rexi hỗ trợ phần nào?");
        }

        String q = normalizeSlangCommand(normalizedQuery.replaceAll("[^a-z0-9\\s_/.-]", " ").replaceAll("\\s+", " ").trim());
        boolean greetingLike = q.matches("^(hi|hello|helo|hilo|halo|alo|chao|xin chao|hey|test|ping|yo|sup)(\\s+.*)?$")
                || (containsAny(q, "hi", "hello", "helo", "hilo", "alo", "chao") && containsAny(q, "help", "giup", "ho tro"));
        if (greetingLike) {
            return finalResult(steps, "Rexi đây. Tôi giúp được: mở lịch hẹn, tra khách hàng, xem hóa đơn, kiểm kho, xem bệnh án hoặc điều phối tác vụ theo màn hình.");
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

        if (isAppointmentDataLookupQuery(q)) {
            if (!RoleAccessPolicy.canUseAgentTool(userRole, "tim_lich_hen_hom_nay")) {
                return finalResult(steps, RoleAccessPolicy.permissionDeniedMessage("tim_lich_hen_hom_nay", userRole));
            }
            if (toolService == null) {
                return finalResult(steps, "Rexi cần truy vấn cơ sở dữ liệu lịch hẹn, nhưng tool hệ thống chưa sẵn sàng.");
            }
            Map<String, Object> params = new HashMap<>();
            params.put("pham_vi", containsAny(q, "hom nay", "today") ? "hom_nay" : "all");
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

        if (containsAny(q, "them thu cung", "them 2 thu cung", "them pet", "them boss")
                && containsAny(q, "bong", "holi")) {
            if (!RoleAccessPolicy.canUseAgentTool(userRole, "them_thu_cung")) {
                return finalResult(steps, RoleAccessPolicy.permissionDeniedMessage("them_thu_cung", userRole));
            }
            Map<String, Object> bong = new HashMap<>();
            bong.put("ten_thu_cung", "Bông");
            bong.put("loai", "Mèo");
            bong.put("giong", "Anh lông ngắn");
            bong.put("gioi_tinh", "Cái");
            bong.put("mau_sac", "Trắng");
            bong.put("trong_luong", "3.2");
            bong.put("ngay_sinh", "2024-03-10");
            bong.put("ghi_chu", "Thêm bởi Rexi Agent theo yêu cầu khách hàng.");

            Map<String, Object> holi = new HashMap<>();
            holi.put("ten_thu_cung", "Holi");
            holi.put("loai", "Chó");
            holi.put("giong", "Corgi");
            holi.put("gioi_tinh", "Đực");
            holi.put("mau_sac", "Vàng trắng");
            holi.put("trong_luong", "8.4");
            holi.put("ngay_sinh", "2023-11-05");
            holi.put("ghi_chu", "Thêm bởi Rexi Agent theo yêu cầu khách hàng.");

            String obs1 = toolService.executeTool("them_thu_cung", bong, userRole, username);
            steps.add(new ReActStep("TOOL", "Gọi tool them_thu_cung cho Bông", "them_thu_cung", bong, obs1));
            String obs2 = toolService.executeTool("them_thu_cung", holi, userRole, username);
            steps.add(new ReActStep("TOOL", "Gọi tool them_thu_cung cho Holi", "them_thu_cung", holi, obs2));
            return finalResult(steps, obs1 + " " + obs2 + " Mở lại danh sách thú cưng để kiểm tra. [NAVIGATE:/khach-hang/quan-ly-thu-cung]");
        }

        if (containsAny(q, "tra khach", "tim khach", "kiem khach", "khach hang", "chu nuoi", "sen nao")) {
            if (RoleAccessPolicy.canUseAgentTool(userRole, "tim_khach_hang")) {
                return finalResult(steps, "Mở trang khách hàng để tra cứu. [NAVIGATE:/quan-ly/khach-hang-thu-cung]");
            }
            return finalResult(steps, RoleAccessPolicy.permissionDeniedMessage("tim_khach_hang", userRole));
        }

        if (containsAny(q, "hoa don", "bill", "thanh toan")) {
            if (RoleAccessPolicy.canUseAgentTool(userRole, "xem_hoa_don")) {
                return finalResult(steps, "Mở trang hóa đơn cho bạn. [NAVIGATE:/quan-ly/hoa-don]");
            }
            return finalResult(steps, RoleAccessPolicy.permissionDeniedMessage("xem_hoa_don", userRole));
        }

        if (containsAny(q, "kho", "thuoc", "ton kho")) {
            if (RoleAccessPolicy.canUseAgentTool(userRole, "xem_kho_thuoc")) {
                return finalResult(steps, "Mở kho thuốc cho bạn. [NAVIGATE:/quan-ly/kho-thuoc]");
            }
            return finalResult(steps, RoleAccessPolicy.permissionDeniedMessage("xem_kho_thuoc", userRole));
        }

        return null;
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
        q = q.replaceAll("\\b(nay|ni|nì|ne|nek|nhe|nha|coi|cai)\\b", " ");
        q = q.replaceAll("\\b(z|v|dz|zay|vay)\\b", " vay ");
        q = q.replaceAll("\\b(choa|chua|chóa|choaz|doggo|cun|cún)\\b", " cho ");
        q = q.replaceAll("\\b(miu|mew|meow)\\b", " meo ");
        q = q.replaceAll("\\b(chin|chinh|chinh cho|fix)\\b", " chinh ");
        q = q.replaceAll("\\b(tun|len|up)\\b", " tang ");
        q = q.replaceAll("\\b(bam|nhan|tap)\\b", " nhan ");
        return q.replaceAll("\\s+", " ").trim();
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
                "tim", "tra", "tra cuu", "kiem tra", "xem", "liet ke", "danh sach", "co lich", "dang co", "hom nay co");
        boolean hasAppointmentContext = containsAny(q,
                "lich kham", "lich hen", "ca kham", "lich cua bac si", "lich bac si");
        boolean hasDoctorContext = containsAny(q, "bac si", "bsi", "bs ");
        boolean hasCreateIntent = containsAny(q, "dat lich", "book lich", "lap lich", "tao lich");
        boolean hasNavigationIntent = containsAny(q, "mo trang", "vao trang", "chuyen sang", "di toi", "dua toi", "qua trang");
        return !hasCreateIntent && !hasNavigationIntent && hasLookupVerb && hasAppointmentContext && hasDoctorContext;
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

    private boolean isCustomerDoctorInfoQuery(String q) {
        if (q == null || q.isBlank()) return false;
        boolean hasDoctor = containsAny(q, "bac si", "bsi", "bs");
        boolean asksInfo = containsAny(q, "thong tin", "cho toi biet", "ai phu trach", "phu trach", "kham cho", "lich kham");
        boolean hasPetContext = containsAny(q, "thu cung", "boss", "be", "pet", "cho", "meo", "cun", "miu");
        boolean isBookingCreate = containsAny(q, "dat lich", "tao lich", "book lich", "lap lich");
        return hasDoctor && asksInfo && hasPetContext && !isBookingCreate;
    }

    private String extractStatsRange(String q) {
        if (containsAny(q, "hom nay", "today")) return "hom_nay";
        if (containsAny(q, "tuan nay", "week")) return "tuan_nay";
        if (containsAny(q, "thang nay", "month")) return "thang_nay";
        return "all";
    }

    private String extractDoctorKeyword(String q) {
        if (q == null || q.isBlank()) return null;
        String cleaned = q.replaceAll("[^a-z0-9\\s]", " ").replaceAll("\\s+", " ").trim();
        String name = extractFirstGroup(cleaned, "(?:bac si|bsi|bs)\\s+([a-z0-9\\s]{2,40})");
        if (name == null || name.isBlank()) return null;
        name = name.replaceAll("\\b(lich|kham|hen|hom nay|ngay mai|dang co|co|khong|nao|cho toi|cua|tim|tra|xem)\\b", " ")
                .replaceAll("\\s+", " ")
                .trim();
        return name.isBlank() ? null : name;
    }

    private String buildSafePetMedicalAdvice(String q) {
        if (containsAny(q, "kho tho", "co giat", "nam im", "li bi", "chay mau", "cuu", "run")) {
            return "Đây có thể là dấu hiệu khẩn cấp. Giữ bé nằm yên, không tự cho uống thuốc, gọi phòng khám hoặc đưa bé đi khám ngay.";
        }
        if (containsAny(q, "gai", "ngua")) {
            return "Gãi nhiều có thể do ký sinh trùng, dị ứng hoặc viêm da. Tạm tránh tắm/thuốc lạ, kiểm tra da có đỏ/rụng lông không và đặt lịch khám nếu kéo dài.";
        }
        if (q.matches(".*\\b(oi|non)\\b.*") || containsAny(q, "bo an", "khong an")) {
            return "Bé nôn/bỏ ăn cần theo dõi sát. Cho nước sạch, không ép ăn hay tự dùng thuốc; nếu lặp lại, lừ đừ hoặc quá 12-24 giờ thì nên đưa đi khám.";
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
                    .replaceAll("\\s+", " ")
                    .trim();
        }
        if (answer == null || answer.isBlank() || "null".equalsIgnoreCase(answer.trim())) {
            if (normalizedQuery != null && !normalizedQuery.isBlank() && normalizedQuery.length() <= 80) {
                return "Tôi chưa hiểu đủ ý. Bạn muốn mở trang nào hoặc thêm/sửa mục gì?";
            }
            return "Tôi chưa đủ dữ liệu để hoàn tất tác vụ này. Bạn gửi thêm SĐT khách hàng, tên thú cưng, ngày/giờ mong muốn hoặc tên phân hệ cần mở.";
        }
        return answer.trim();
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

    private boolean containsAnyTokenOrPhrase(String value, String... terms) {
        return containsAny(value, terms);
    }

    private SensitiveCommand classifySensitiveCommand(String q) {
        if (q == null) return null;

        if (containsAnyTokenOrPhrase(q, "chuyen trang", "mo trang", "vao trang", "qua trang", "di toi trang", "dua toi trang")) {
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
        String globalCtx = compactForModel(memoryService.getGlobalContext(userQuery), MAX_CONTEXT_CHARS);
        String userCtx   = (username != null) ? compactForModel(memoryService.getUserContext(username), MAX_CONTEXT_CHARS) : "";
        boolean isStaff  = isStaffRole(userRole);
        String toolsSchema = compactToolsSchemaForQuery(toolService.getToolsSchemaForRole(userRole), userQuery);
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
