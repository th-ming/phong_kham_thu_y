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
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import jakarta.servlet.http.HttpServletRequest;
import java.util.concurrent.ConcurrentHashMap;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private static final Logger logger = Logger.getLogger(ChatController.class.getName());

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

    // Cấu trúc giới hạn Rate Limit đơn giản trong RAM
    private static class RateLimit {
        int count;
        Instant resetTime;

        RateLimit() {
            this.count = 1;
            this.resetTime = Instant.now().plus(1, ChronoUnit.MINUTES);
        }
    }

    private final ConcurrentHashMap<String, RateLimit> rateLimiter = new ConcurrentHashMap<>();

    @PostMapping
    public Map<String, String> chat(
            @RequestBody List<ChatMessage> history,
            HttpServletRequest request) {

        // BẢO MẬT LỚP 1: Rate Limiting chống Spam (20/phút cho text, 15/phút cho video)
        String clientIp = request.getRemoteAddr();
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        String realUsername = (auth != null && !auth.getName().equals("anonymousUser")) ? auth.getName() : null;
        String rateKey = (realUsername != null) ? realUsername : clientIp;

        // Dọn rác RAM nếu danh sách lưu quá lớn
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

        // Kiểm tra xem tin nhắn cuối cùng có video không
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

            // BẢO MẬT: Giới hạn mảng lịch sử (Nhớ 40 tin nhắn gần nhất) để ngữ cảnh hội thoại đủ dài và phong phú
            if (history.size() > 40) {
                history = new ArrayList<>(history.subList(history.size() - 40, history.size()));
            }

            // Lấy nội dung câu hỏi cuối cùng của khách hàng
            ChatMessage lastMsg = history.get(history.size() - 1);
            String userQuery = lastMsg.getContent() != null ? lastMsg.getContent() : "";
            String normalizedUserQuery = normalizeVietnamese(userQuery.toLowerCase());

            // BẢO MẬT: Chặn đứng các đoạn chat siêu dài (Tránh tấn công Token Exhaustion)
            if (userQuery.length() > 1000) {
                return Map.of("reply",
                        "Sen ơi tin nhắn hơi dài quá òi! 😿 Sen tóm tắt lại tình trạng của bé ngắn gọn (dưới 1000 ký tự) để Rexi đọc và tư vấn chuẩn xác nhất nha!");
            }

            if (isEmergencyQuery(normalizedUserQuery)) {
                return Map.of("reply", buildEmergencyReply(normalizedUserQuery));
            }

            // Lấy bối cảnh dữ liệu THÔNG MINH (Cần gì lấy nấy dựa trên userQuery)
            String userContext = aiMemoryService.getUserContext(realUsername);
            String knowledgeContext = aiMemoryService.getKnowledgeBaseContext(userQuery);
            // Inject dữ liệu phòng khám thực tế theo RAG định tuyến từ khóa thông minh
            String globalContext = aiMemoryService.getGlobalContext(userQuery);

            // Đọc các Header bối cảnh DOM từ frontend truyền qua
            String rawPath = request.getHeader("X-Current-Path");
            String rawDomContext = request.getHeader("X-Current-DOM-Context");
            String rawActivityLogs = request.getHeader("X-User-Activity-Logs");
            
            String currentPath = "/";
            String currentDomContext = "Không có bối cảnh giao diện.";
            String currentActivityLogs = "Không có nhật ký hành động gần đây.";
            
            if (rawPath != null && !rawPath.isEmpty()) {
                try {
                    currentPath = java.net.URLDecoder.decode(rawPath, java.nio.charset.StandardCharsets.UTF_8);
                } catch (Exception e) {
                    logger.warning("Không thể giải mã X-Current-Path: " + e.getMessage());
                }
            }
            
            if (rawDomContext != null && !rawDomContext.isEmpty()) {
                try {
                    currentDomContext = java.net.URLDecoder.decode(rawDomContext, java.nio.charset.StandardCharsets.UTF_8);
                } catch (Exception e) {
                    logger.warning("Không thể giải mã X-Current-DOM-Context: " + e.getMessage());
                }
            }

            if (rawActivityLogs != null && !rawActivityLogs.isEmpty()) {
                try {
                    currentActivityLogs = java.net.URLDecoder.decode(rawActivityLogs, java.nio.charset.StandardCharsets.UTF_8);
                } catch (Exception e) {
                    logger.warning("Không thể giải mã X-User-Activity-Logs: " + e.getMessage());
                }
            }
            
            String domContextBlock = "\n--- THÔNG TIN TRANG & BỐI CẢNH GIAO DIỆN (EYES & DOM CONTEXT) ---\n"
                    + "Người dùng hiện đang ở màn hình: " + currentPath + "\n"
                    + "Các dữ liệu chỉ số, bảng biểu và phần tử tương tác (Interactive Elements) có thuộc tính data-ai-id đang hiển thị trên màn hình hiện tại:\n"
                    + ">>> " + currentDomContext + "\n\n"
                    + "LỊCH SỬ THAO TÁC VÀ HÀNH VI GẦN ĐÂY CỦA NGƯỜI DÙNG VỚI MÀN HÌNH (Thời gian thực):\n"
                    + ">>> " + currentActivityLogs + "\n\n"
                    + "HƯỚNG DẪN AUTOPILOT (LÁI TỰ ĐỘNG THAO TÁC TRỰC QUAN):\n"
                    + "1. Bạn có quyền điều khiển trình duyệt của người dùng để thực hiện các thao tác click, điền form, chọn select, bấm nút. Để thực hiện, hãy trả về các thẻ lệnh Autopilot dạng sau ở cuối câu trả lời của bạn:\n"
                        + "8. TRÁNH KÊ ĐƠN THUỐC TÙY TIỆN: Chỉ tư vấn dinh dưỡng, hành vi, và hướng dẫn sơ cứu. TUYỆT ĐỐI KHÔNG TỰ TIỆN KÊ ĐƠN THUỐC.\n"
                        + "9. TRUY CẬP DỮ LIỆU HỆ THỐNG (CỰC KỲ QUAN TRỌNG):\n"
                        + "   Ở chế độ này, bạn KHÔNG CÓ CÔNG CỤ tra cứu CSDL (tìm khách hàng, bệnh án). Nếu Sen yêu cầu tra cứu thông tin cụ thể trong hệ thống, TUYỆT ĐỐI KHÔNG BỊA ĐẶT DỮ LIỆU HOẶC TỰ NHẬN LÀ KHÔNG TÌM THẤY. Bắt buộc trả lời: 'Dạ Sen ơi, ở chế độ này em không thể xem dữ liệu hệ thống ạ. Sen bấm chuyển sang tab **Tác vụ Agent v2** ở trên cùng khung chat để em dùng siêu năng lực quét dữ liệu thực tế giúp Sen nha!'.\n"
                        + "10. HƯỚNG DẪN ĐIỀU HƯỚNG TÁC VỤ (NAVIGATE AUTOPILOT):\n"
                        + "   Khi Sen yêu cầu mở trang hoặc chuyển trang (ví dụ: 'mở trang quản lý thú cưng', 'chuyển sang đặt lịch hẹn khám'...), bạn BẮT BUỘC phải đính kèm thẻ lệnh dạng [NAVIGATE:đường_dẫn] ở cuối câu trả lời của bạn. Dưới đây là danh sách đường dẫn hợp lệ:\n"
                        + "   - Bảng điều khiển Khách hàng: /khach-hang/dashboard\n"
                        + "   - Quản lý thú cưng: /khach-hang/quan-ly-thu-cung\n"
                        + domContextBlock;
            }

            ChatMessage systemMsg = new ChatMessage();
            systemMsg.setRole("system");
            systemMsg.setContent(systemPrompt);
            history.add(0, systemMsg);

            ChatMessage latest = history.get(history.size() - 1);
            boolean hasVideo = latest.getVideos() != null && !latest.getVideos().isEmpty();
            boolean hasImage = latest.getImages() != null && !latest.getImages().isEmpty();
            boolean hasMedia = hasVideo || hasImage;

            // Phân tích từ khóa để định tuyến thông minh dựa trên thế mạnh của từng AI
            String userQueryStr = latest.getContent() != null ? latest.getContent() : "";
            normalizedQuery = normalizeVietnamese(userQueryStr.toLowerCase());

            // Tập hợp từ khóa y tế mở rộng bao gồm cả viết tắt, tiếng lóng, từ địa phương và gõ sai bộ gõ telex
            String[] medicalKeywords = {
                "benh", "trieu chung", "trieu chuong", "thuoc", "thuooc", "dau", "daau", "sot", "soot", 
                "non", "tieu chay", "tieu chai", "dieu tri", "chan doan", "toa thuoc", "ke don", "suc khoe", 
                "kham", "bnh", "bsi", "bac si", "bac sy", "cap cuu", "tai nan", "chong mat", "oi", "ia", "phan", "cut"
            };
            boolean isMedicalQuery = false;
            for (String kw : medicalKeywords) {
                if (normalizedQuery.contains(kw)) {
                    isMedicalQuery = true;
                    break;
                }
            }

            String reply;
            // LUỒNG ĐỊNH TUYẾN THÔNG MINH (INTELLIGENT AI ROUTING)
            if (hasMedia) {
                // 🎥/🖼️ THẾ MẠNH CỦA GEMINI: Đa phương tiện (Video, Hình ảnh)
                logger.info("[AI ROUTER] Định tuyến câu hỏi Media sang: Gemini");
                try {
                    reply = geminiService.chat(history);
                } catch (Exception geminiEx) {
                    logger.warning("[AI ROUTER] Gemini lỗi, chuyển hướng dự phòng sang: OpenRouter (DeepSeek V4)...");
                    reply = openRouterService.chat(history);
                }
            } else if (isMedicalQuery) {
                // 🩺 THẾ MẠNH CỦA DEEPSEEK V4: Tư duy Y khoa, Logic và Chẩn đoán
                logger.info("[AI ROUTER] Định tuyến câu hỏi Tư vấn Y tế sang: OpenRouter (DeepSeek V4)");
                try {
                    reply = openRouterService.chat(history);
                } catch (Exception openRouterEx) {
                    logger.warning("[AI ROUTER] OpenRouter lỗi, chuyển hướng dự phòng sang: Gemini...");
                    try {
                        reply = geminiService.chat(history);
                    } catch (Exception geminiEx) {
                        logger.warning("[AI ROUTER] Gemini lỗi, chuyển hướng dự phòng cuối cùng sang: Groq...");
                        reply = groqService.chat(history);
                    }
                }
            } else {
                // 💬 THẾ MẠNH CỦA GROQ (LLAMA 3.3): Chat FAQ, Lịch khám, Autopilot siêu tốc
                logger.info("[AI ROUTER] Định tuyến câu hỏi Chat/Autopilot thông thường sang: Groq");
                try {
                    reply = groqService.chat(history);
                } catch (Exception groqException) {
                    logger.warning("[AI ROUTER] Groq lỗi, chuyển hướng dự phòng sang: Gemini...");
                    try {
                        reply = geminiService.chat(history);
                    } catch (Exception geminiException) {
                        logger.warning("[AI ROUTER] Gemini lỗi, chuyển hướng dự phòng cuối cùng sang: OpenRouter (DeepSeek V4)...");
                        reply = openRouterService.chat(history);
                    }
                }
            }

            reply = sanitizeChatReply(reply);

            // BẢO MẬT: Làm sạch dữ liệu chống XSS (Stored XSS) trước khi lưu vào CSDL
            String safeUserQuery = org.springframework.web.util.HtmlUtils.htmlEscape(userQuery);

            // --- LƯU LỊCH SỬ TƯ VẤN VÀO DATABASE ---
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

            return Map.of("reply", reply);
        } catch (Exception e) {
            logger.severe("Chat API error: " + e.getMessage());
            return Map.of("reply",
                    "Sen ơi, não bộ của Rexi đang được bảo trì nâng cấp xíu nên hơi lác. Sen đợi một chút rồi thử lại nha! 🛠️🐾");
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
                item.put("url", urls.get(i));
                item.put("title", titles.get(i));
                item.put("snippet", i < snippets.size() ? snippets.get(i) : "");
                results.add(item);
            }
        } catch (Exception e) {
            logger.severe("Lỗi khi tìm kiếm DuckDuckGo: " + e.getMessage());
        }
        return results;
    }

    private String normalizeVietnamese(String input) {
        if (input == null) return "";
        return input
                .replaceAll("[àáạảãâầấậẩẫăằắặẳẵ]", "a")
                .replaceAll("[èéẹẻẽêềếệểễ]", "e")
                .replaceAll("[ìíịỉĩ]", "i")
                .replaceAll("[òóọỏõôồốộổỗơờớợởỡ]", "o")
                .replaceAll("[ùúụủũưừứựửữ]", "u")
                .replaceAll("[ỳýỵỷỹ]", "y")
                .replaceAll("[đ]", "d");
    }

    private boolean isEmergencyQuery(String normalizedQuery) {
        if (normalizedQuery == null || normalizedQuery.isBlank()) {
            return false;
        }
        String[] emergencyKeywords = {
                "cap cuu", "hoc", "ngat tho", "kho tho", "khong tho", "di vat",
                "ngo doc", "co giat", "chay mau", "tai nan", "bat tinh", "soc"
        };
        for (String kw : emergencyKeywords) {
            if (normalizedQuery.contains(kw)) {
                return true;
            }
        }
        return false;
    }

    private String buildEmergencyReply(String normalizedQuery) {
        StringBuilder reply = new StringBuilder();
        reply.append("[EMERGENCY] Sen bình tĩnh làm ngay các bước sơ cứu dưới đây và gọi Rexi theo hotline 0353.374.156.\n\n");

        if (normalizedQuery.contains("hoc") || normalizedQuery.contains("ngat tho")
                || normalizedQuery.contains("khong tho") || normalizedQuery.contains("di vat")) {
            reply.append("**Nghi hóc dị vật/ngạt thở:**\n")
                    .append("1. Mở miệng bé kiểm tra nhanh. Chỉ lấy dị vật ra nếu nhìn thấy rõ và gắp được an toàn.\n")
                    .append("2. Không móc tay sâu vì có thể đẩy dị vật vào trong.\n")
                    .append("3. Nếu bé không thở hoặc tím tái, thực hiện Heimlich cho thú cưng: đặt hai tay ngay sau xương sườn, ép nhanh hướng lên trên 3-5 lần, rồi kiểm tra miệng.\n")
                    .append("4. Nếu bé nhỏ, có thể nâng phần thân sau cao hơn đầu và vỗ chắc 3-5 cái giữa hai bả vai.\n\n");
        } else if (normalizedQuery.contains("ngo doc")) {
            reply.append("**Nghi ngộ độc:**\n")
                    .append("1. Ngừng cho ăn/uống thêm và đưa bé tránh xa nguồn độc.\n")
                    .append("2. Không tự gây nôn nếu chưa có bác sĩ hướng dẫn.\n")
                    .append("3. Mang theo bao bì/chất nghi độc khi đến phòng khám.\n\n");
        } else if (normalizedQuery.contains("co giat")) {
            reply.append("**Co giật:**\n")
                    .append("1. Dọn vật cứng quanh bé, không giữ chặt miệng hoặc kéo lưỡi.\n")
                    .append("2. Ghi lại thời gian co giật và quay video ngắn nếu an toàn.\n")
                    .append("3. Nếu cơn kéo dài hơn 2-3 phút hoặc lặp lại, đưa bé đi cấp cứu ngay.\n\n");
        } else if (normalizedQuery.contains("chay mau") || normalizedQuery.contains("tai nan")) {
            reply.append("**Chảy máu/tai nạn:**\n")
                    .append("1. Dùng gạc sạch ép trực tiếp lên điểm chảy máu 5-10 phút.\n")
                    .append("2. Hạn chế di chuyển bé nếu nghi gãy xương hoặc chấn thương nặng.\n")
                    .append("3. Không tự bôi thuốc dân gian lên vết thương.\n\n");
        }

        reply.append("Sen cho Rexi biết vị trí hiện tại của Sen để Rexi hướng dẫn đường đến cơ sở thú y gần nhất. Nếu ở Gia Lâm/Hà Nội, đưa bé tới Phòng khám Thú y Rexi, Số 68, Ngõ 10, Đường Ngô Xuân Quảng, Trâu Quỳ, Gia Lâm, Hà Nội.");
        return reply.toString();
    }
}
