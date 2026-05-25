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
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.logging.Logger;
import java.util.concurrent.atomic.AtomicInteger;

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
        List<String> keys = getApiKeys();
        return keys.isEmpty() ? "" : keys.get(0);
    }

    private List<String> getApiKeys() {
        Set<String> keys = new LinkedHashSet<>();
        try {
            List<String> dbKeys = jdbcTemplate.queryForList(
                    "SELECT gia_tri FROM CauHinhHeThong "
                            + "WHERE ten_cau_hinh LIKE 'gemini_api_key%' "
                            + "ORDER BY CASE WHEN ten_cau_hinh = 'gemini_api_key' THEN 0 ELSE 1 END, ten_cau_hinh",
                    String.class);
            for (String dbKey : dbKeys) {
                addKeys(keys, dbKey);
            }
        } catch (Exception e) {}
        addKeys(keys, apiKey);
        return new ArrayList<>(keys);
    }

    private void addKeys(Set<String> keys, String rawValue) {
        if (rawValue == null) return;
        for (String key : rawValue.split(",")) {
            String trimmed = key.trim();
            if (!trimmed.isEmpty()) {
                keys.add(trimmed);
            }
        }
    }

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final AtomicInteger keyCursor = new AtomicInteger(0);
    private final AtomicInteger modelCursor = new AtomicInteger(0);

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
        List<String> keys = getApiKeys();
        if (keys.isEmpty()) {
            throw new RuntimeException("Không tìm thấy Gemini API Key nào được cấu hình!");
        }

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
                    textContent = "Phân tích các ảnh này theo góc nhìn bác sĩ thú y. Nêu rõ những dấu hiệu nhìn thấy, mức độ khẩn cấp, khả năng nguyên nhân, khuyến nghị chăm sóc ban đầu và khi nào cần đưa bé đi khám. Không chẩn đoán chắc chắn chỉ dựa trên ảnh.";
                parts.add(Map.of("text", textContent));
                for (String imgBase64 : msg.getImages()) {
                    String mimeType = "image/jpeg";
                    String base64Data = imgBase64;
                    if (base64Data != null && base64Data.startsWith("data:")) {
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
            } else if (msg.getVideos() != null && !msg.getVideos().isEmpty()) {
                if (textContent.isBlank())
                    textContent = "Phân tích video này theo góc nhìn bác sĩ thú y. Mô tả chuyển động/hành vi bất thường, mức độ khẩn cấp, khả năng nguyên nhân, khuyến nghị chăm sóc ban đầu và khi nào cần đưa bé đi khám. Không chẩn đoán chắc chắn chỉ dựa trên video.";
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

        List<String> modelCandidates = getModelCandidates();
        int keyStart = Math.floorMod(keyCursor.getAndIncrement(), keys.size());
        int modelStart = Math.floorMod(modelCursor.getAndIncrement(), modelCandidates.size());

        // Duyệt round-robin qua danh sách model/key để tránh dồn tải vào key đầu.
        for (int modelOffset = 0; modelOffset < modelCandidates.size(); modelOffset++) {
            String selectedModel = modelCandidates.get((modelStart + modelOffset) % modelCandidates.size());
            for (int keyOffset = 0; keyOffset < keys.size(); keyOffset++) {
                int keyIndex = (keyStart + keyOffset) % keys.size();
                String currentKey = keys.get(keyIndex).trim();
                if (currentKey.isEmpty()) continue;

                String apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/" + selectedModel + ":generateContent?key="
                        + currentKey;

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(apiUrl))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8))
                        .timeout(Duration.ofMinutes(3)) // Gemini xử lý video có thể lâu, cho phép tối đa 3 phút
                        .build();

                try {
                    logger.info("Đang gọi Gemini API model=" + selectedModel + " keyIndex=" + keyIndex);
                    HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

                    if (response.statusCode() == 200) {
                        JsonNode rootNode = objectMapper.readTree(response.body());
                        try {
                            return rootNode.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
                        } catch (Exception e) {
                            logger.severe("Lỗi phân tích phản hồi từ Gemini (model " + selectedModel + ", keyIndex " + keyIndex + "). Nội dung: " + response.body());
                            lastException = new RuntimeException("Lỗi Parse Gemini: " + response.body());
                            continue; // Thử key tiếp theo
                        }
                    } else {
                        logger.severe("=== LỖI KẾT NỐI GEMINI API (model " + selectedModel + ", keyIndex " + keyIndex + ") ===");
                        logger.severe("Trạng thái: " + response.statusCode());
                        logger.severe("Nội dung lỗi: " + response.body());
                        lastException = new RuntimeException("Gemini API gặp lỗi " + response.statusCode() + ": " + response.body());
                        // Tiếp tục thử key/model tiếp theo.
                    }
                } catch (Exception e) {
                    logger.severe("Lỗi kết nối mạng với Gemini API (model " + selectedModel + ", keyIndex " + keyIndex + "): " + e.getMessage());
                    lastException = e;
                }
            }
        }

        if (lastException != null) {
            throw lastException;
        }
        throw new RuntimeException("Tất cả các Gemini API Key đều thất bại hoặc không hợp lệ!");
    }

    private List<String> getModelCandidates() {
        Set<String> models = new LinkedHashSet<>();
        String configured = getModelName();
        if (configured != null && !configured.trim().isEmpty()) {
            models.add(configured.trim());
        }
        models.add("gemini-flash-lite-latest");
        models.add("gemini-2.5-flash");
        models.add("gemini-2.0-flash");
        return new ArrayList<>(models);
    }
}
