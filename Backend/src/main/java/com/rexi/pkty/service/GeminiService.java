package com.rexi.pkty.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rexi.pkty.dto.ChatMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;

@Service
public class GeminiService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private String getModelName() {
        try {
            String dbModel = jdbcTemplate.queryForObject(
                "SELECT gia_tri FROM CauHinhHeThong WHERE ten_cau_hinh = 'gemini_model'", 
                String.class);
            if (dbModel != null && !dbModel.trim().isEmpty()) {
                return dbModel.trim();
            }
        } catch (Exception e) {
            // Fallback
        }
        return modelName;
    }

    private static final Logger logger = Logger.getLogger(GeminiService.class.getName());

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.model:gemini-3.5-flash}")
    private String modelName;

    private String getApiKey() {
        try {
            String dbKey = jdbcTemplate.queryForObject(
                "SELECT gia_tri FROM CauHinhHeThong WHERE ten_cau_hinh = 'gemini_api_key'", 
                String.class);
            if (dbKey != null && !dbKey.trim().isEmpty()) {
                return dbKey.trim();
            }
        } catch (Exception e) {}
        return apiKey;
    }

    private final ObjectMapper objectMapper = new ObjectMapper();

    // Sử dụng chung 1 HttpClient cho toàn bộ service để tăng hiệu suất
    private final HttpClient client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(180)) // Cho phép kết nối tối đa 3 phút
            .build();

        public String summarizeMedicalRecords(String thuCungName, String rawData) throws Exception {
        String systemPrompt = "Bạn là bác sĩ thú y giàu kinh nghiệm. Hãy đọc danh sách các bệnh án dưới đây của thú cưng " + thuCungName + 
                ". Trả về TÓM TẮT NGẮN GỌN (tối đa 4-5 gạch đầu dòng) về tiền sử bệnh, dị ứng, hoặc lưu ý quan trọng. Chỉ trả về nội dung y khoa, không chào hỏi dư thừa.";
        List<ChatMessage> history = new ArrayList<>();
        ChatMessage sysMsg = new ChatMessage();
        sysMsg.setRole("system");
        sysMsg.setContent(systemPrompt);
        history.add(sysMsg);
        
        ChatMessage userMsg = new ChatMessage();
        userMsg.setRole("user");
        userMsg.setContent("Dữ liệu bệnh án: \n" + rawData);
        history.add(userMsg);
        
        return chat(history);
    }

    public String chat(List<ChatMessage> history) throws Exception {
        String currentApiKey = getApiKey();
        if (currentApiKey == null || currentApiKey.trim().isEmpty()) {
            throw new RuntimeException("Không tìm thấy Gemini API Key nào được cấu hình!");
        }

        String[] keys = currentApiKey.split(",");
        Exception lastException = null;

        Map<String, Object> requestBodyMap = new HashMap<>();

        // Tách riêng prompt hệ thống và lịch sử chat
        String dynamicSystemPrompt = "";
        List<ChatMessage> userModelHistory = new ArrayList<>();
        for (ChatMessage msg : history) {
            if ("system".equals(msg.getRole())) {
                dynamicSystemPrompt = msg.getContent();
            } else {
                userModelHistory.add(msg);
            }
        }

        // Thiết lập hướng dẫn hệ thống (System Instruction)
        if (!dynamicSystemPrompt.isEmpty()) {
            Map<String, Object> systemInstruction = new HashMap<>();
            systemInstruction.put("parts", List.of(Map.of("text", dynamicSystemPrompt)));
            requestBodyMap.put("system_instruction", systemInstruction);
        }

        // Thiết lập nội dung hội thoại (Contents)
        List<Map<String, Object>> contents = new ArrayList<>();

        for (ChatMessage msg : userModelHistory) {
            Map<String, Object> contentItem = new HashMap<>();

            // Chuyển role sang chuẩn của Gemini (user / model)
            String role = (msg.getRole() != null && msg.getRole().equals("assistant")) ? "model" : "user";
            contentItem.put("role", role);

            List<Map<String, Object>> parts = new ArrayList<>();

            String textContent = (msg.getContent() != null && !msg.getContent().isBlank()) ? msg.getContent() : "";

            if (msg.getImages() != null && !msg.getImages().isEmpty()) {
                if (textContent.isBlank())
                    textContent = "Phân tích các ảnh này giúp tôi.";
                parts.add(Map.of("text", textContent));
                for (String imgBase64 : msg.getImages()) {
                    parts.add(Map.of("inlineData", Map.of(
                            "mimeType", "image/jpeg",
                            "data", imgBase64)));
                }
            } else if (msg.getVideos() != null && !msg.getVideos().isEmpty()) {
                if (textContent.isBlank())
                    textContent = "Phân tích video này giúp tôi.";
                parts.add(Map.of("text", textContent));

                for (String vidData : msg.getVideos()) {
                    String mimeType = "video/mp4";
                    String base64Data = vidData;

                    // Trích xuất chính xác mimeType từ chuỗi data URL
                    if (base64Data.startsWith("data:")) {
                        int semicolonIdx = base64Data.indexOf(";");
                        if (semicolonIdx != -1) {
                            mimeType = base64Data.substring(5, semicolonIdx);
                        }
                        int commaIdx = base64Data.indexOf(",");
                        if (commaIdx != -1) {
                            base64Data = base64Data.substring(commaIdx + 1);
                        }
                    }

                    parts.add(Map.of("inlineData", Map.of(
                            "mimeType", mimeType,
                            "data", base64Data)));
                }
            } else {
                if (!textContent.isBlank()) {
                    parts.add(Map.of("text", textContent));
                }
            }

            if (!parts.isEmpty()) {
                contentItem.put("parts", parts);
                contents.add(contentItem);
            }
        }

        requestBodyMap.put("contents", contents);

        String requestBody = objectMapper.writeValueAsString(requestBodyMap);

        // Duyệt qua danh sách các API Key để thử kết nối
        for (int i = 0; i < keys.length; i++) {
            String currentKey = keys[i].trim();
            if (currentKey.isEmpty()) continue;

            String apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/" + getModelName() + ":generateContent?key="
                    + currentKey;

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(apiUrl))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8))
                    .timeout(Duration.ofMinutes(3)) // Gemini xử lý video có thể lâu, cho phép tối đa 3 phút
                    .build();

            try {
                logger.info("Đang gọi Gemini API sử dụng Key index: " + i);
                HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() == 200) {
                    JsonNode rootNode = objectMapper.readTree(response.body());
                    try {
                        return rootNode.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
                    } catch (Exception e) {
                        logger.severe("Lỗi phân tích phản hồi từ Gemini (Key index " + i + "). Nội dung: " + response.body());
                        lastException = new RuntimeException("Lỗi Parse Gemini: " + response.body());
                        continue; // Thử key tiếp theo
                    }
                } else {
                    logger.severe("=== LỖI KẾT NỐI GEMINI API (Key index " + i + ") ===");
                    logger.severe("Trạng thái: " + response.statusCode());
                    logger.severe("Nội dung lỗi: " + response.body());
                    lastException = new RuntimeException("Gemini API gặp lỗi " + response.statusCode() + ": " + response.body());
                    // Tiếp tục thử key tiếp theo (nếu bị quá tải 429 hoặc lỗi khác)
                }
            } catch (Exception e) {
                logger.severe("Lỗi kết nối mạng với Gemini API (Key index " + i + "): " + e.getMessage());
                lastException = e;
            }
        }

        if (lastException != null) {
            throw lastException;
        }
        throw new RuntimeException("Tất cả các Gemini API Key đều thất bại hoặc không hợp lệ!");
    }
}
