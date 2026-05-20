package com.rexi.pkty.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rexi.pkty.dto.ChatMessage;
import org.springframework.beans.factory.annotation.Autowired;
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

    @Autowired private OpenRouterService openRouterService;
    @Autowired private AiToolService toolService;
    @Autowired private AiMemoryService memoryService;

    private final ObjectMapper mapper = new ObjectMapper();

    public record ReActStep(String type, String content, String toolName, Map<String, Object> toolParams, String observation) {}
    public record ReActResult(String finalAnswer, List<ReActStep> steps) {}

    /**
     * Điểm vào chính — chạy vòng lặp ReAct cho một yêu cầu của người dùng.
     */
    public ReActResult run(String userQuery, String username, String userRole) {
        List<ReActStep> steps = new ArrayList<>();

        // Xây dựng system prompt với tool schema + ngữ cảnh người dùng
        String systemPrompt = buildSystemPrompt(username, userRole);

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
                rawResponse = openRouterService.chat(history);
            } catch (Exception e) {
                logger.severe("[ReAct] Lỗi gọi LLM: " + e.getMessage());
                return new ReActResult("Xin lỗi, có lỗi kết nối AI. Vui lòng thử lại sau.", steps);
            }

            // Cắt bỏ markdown code block nếu model trả về ```json ... ```
            String cleaned = rawResponse.trim();
            if (cleaned.startsWith("```")) {
                cleaned = cleaned.replaceAll("^```[a-z]*\\s*", "").replaceAll("\\s*```$", "").trim();
            }

            // Kiểm tra xem đây có phải JSON tool call không
            if (cleaned.startsWith("{")) {
                try {
                    JsonNode node = mapper.readTree(cleaned);

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

                        // Thực thi tool
                        String observation = toolService.executeTool(toolName, params);
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

    /**
     * Xây dựng system prompt tích hợp ngữ cảnh người dùng + tool schema.
     */
    private String buildSystemPrompt(String username, String userRole) {
        String globalCtx = memoryService.getGlobalContext();
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
            + "- Luôn suy nghĩ từng bước: Tôi cần thông tin gì? Tool nào giúp lấy được?\n"
            + "- Sau khi có đủ thông tin từ tools, trả về final_answer bằng tiếng Việt thân thiện.\n"
            + "- Nếu câu hỏi đơn giản (chào hỏi, hỏi thông tin chung) → trả final_answer ngay, không cần dùng tool.\n"
            + "- KHÔNG bịa đặt dữ liệu. Chỉ dùng thông tin từ tool hoặc kiến thức y khoa thực tế.\n";
    }
}
