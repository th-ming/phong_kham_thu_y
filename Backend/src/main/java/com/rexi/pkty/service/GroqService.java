package com.rexi.pkty.service;

import java.util.logging.Logger;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rexi.pkty.dto.ChatMessage;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class GroqService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private String getModelName() {
        try {
            String dbModel = jdbcTemplate.queryForObject(
                "SELECT gia_tri FROM CauHinhHeThong WHERE ten_cau_hinh = 'groq_model'", 
                String.class);
            if (dbModel != null && !dbModel.trim().isEmpty()) {
                return dbModel.trim();
            }
        } catch (Exception e) {
        }
        return modelName;
    }

    private String getVisionModelName() {
        try {
            String dbModel = jdbcTemplate.queryForObject(
                "SELECT gia_tri FROM CauHinhHeThong WHERE ten_cau_hinh = 'groq_vision_model'", 
                String.class);
            if (dbModel != null && !dbModel.trim().isEmpty()) {
                return dbModel.trim();
            }
        } catch (Exception e) {
        }
        return visionModelName;
    }

    private static final Logger logger = java.util.logging.Logger.getLogger(GroqService.class.getName());

    @Value("${groq.api.key}")
    private String apiKey;

    private static final String GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

    @Value("${groq.model:llama-3.3-70b-versatile}")
    private String modelName;

    // Model để phân tích hình ảnh
    @Value("${groq.vision.model:meta-llama/llama-4-scout-17b-16e-instruct}")
    private String visionModelName;

    private String getApiKey() {
        try {
            String dbKey = jdbcTemplate.queryForObject(
                "SELECT gia_tri FROM CauHinhHeThong WHERE ten_cau_hinh = 'groq_api_key'", 
                String.class);
            if (dbKey != null && !dbKey.trim().isEmpty()) {
                return dbKey.trim();
            }
        } catch (Exception e) {}
        return apiKey;
    }

    private final ObjectMapper objectMapper = new ObjectMapper();

    // Sử dụng chung 1 HttpClient cho toàn bộ service để tận dụng Connection Pooling
    private final HttpClient client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(20))
            .build();

    public String chat(List<ChatMessage> history) throws Exception {
        ChatMessage latest = history.get(history.size() - 1);
        String latestContent = latest.getContent() != null ? latest.getContent() : "";
        String latestNormalized = normalizeVietnamese(latestContent.toLowerCase());



        // Kiểm tra ảnh → chọn model phù hợp (Sử dụng list images mới)
        boolean hasImage = latest.getImages() != null && !latest.getImages().isEmpty();
        String selectedModel = hasImage ? getVisionModelName() : getModelName();

        // Chuẩn bị danh sách messages cho API
        List<Map<String, Object>> messagesForApi = new ArrayList<>();

        for (int i = 0; i < history.size(); i++) {
            ChatMessage msg = history.get(i);
            String msgContent = msg.getContent() != null && !msg.getContent().isBlank() ? msg.getContent() : "";

            boolean isLatest = (i == history.size() - 1);

            if (isLatest && msg.getImages() != null && !msg.getImages().isEmpty()) {
                String textForImage = msgContent.isBlank() ? "Phân tích các ảnh này và nhận định sức khỏe của bé."
                        : msgContent;
                List<Map<String, Object>> content = new ArrayList<>();
                content.add(Map.of("type", "text", "text", textForImage));
                
                for (String imgBase64 : msg.getImages()) {
                    content.add(Map.of(
                            "type", "image_url",
                            "image_url", Map.of("url", "data:image/jpeg;base64," + imgBase64)));
                }
                messagesForApi.add(Map.of("role", msg.getRole(), "content", content));
            } else if (!msgContent.isBlank()) {
                messagesForApi.add(Map.of("role", msg.getRole(), "content", msgContent));
            }
        }

        // Dùng model phù hợp: vision cho ảnh, text cho chat thường
        Map<String, Object> requestBodyMap = Map.of(
                "model", selectedModel,
                "messages", messagesForApi);

        String requestBody = objectMapper.writeValueAsString(requestBodyMap);

        String currentApiKey = getApiKey();
        if (currentApiKey == null || currentApiKey.trim().isEmpty()) {
            throw new RuntimeException("Không tìm thấy Groq API Key nào được cấu hình!");
        }

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(GROQ_API_URL))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + currentApiKey)
                .POST(HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8))
                .timeout(Duration.ofSeconds(15)) // Set timeout tối đa 15s cho thời gian sinh câu trả lời
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

        // Xử lý lỗi API - log chi tiết để debug
        if (response.statusCode() != 200) {
            logger.severe("Groq API Error - Status: " + response.statusCode() + " Body: " + response.body());

            // Ném lỗi để ChatController có thể thực hiện Fallback sang Gemini
            throw new RuntimeException("Groq API Error " + response.statusCode());
        }

        JsonNode rootNode = objectMapper.readTree(response.body());
        try {
            return rootNode.path("choices").get(0).path("message").path("content").asText();
        } catch (Exception e) {
            return "Tôi rất lo cho bé nhưng hệ thống đang trục trặc. Bạn hãy đưa bé đến Rexi sớm để bác sĩ kiểm tra cho yên tâm nhé!";
        }
    }

    public void streamChat(List<ChatMessage> history, SseEmitter emitter) throws Exception {
        ChatMessage latest = history.get(history.size() - 1);
        String latestContent = latest.getContent() != null ? latest.getContent() : "";

        boolean hasImage = latest.getImages() != null && !latest.getImages().isEmpty();
        String selectedModel = hasImage ? getVisionModelName() : getModelName();

        List<Map<String, Object>> messagesForApi = new ArrayList<>();

        for (int i = 0; i < history.size(); i++) {
            ChatMessage msg = history.get(i);
            String msgContent = msg.getContent() != null && !msg.getContent().isBlank() ? msg.getContent() : "";
            boolean isLatest = (i == history.size() - 1);

            if (isLatest && msg.getImages() != null && !msg.getImages().isEmpty()) {
                String textForImage = msgContent.isBlank() ? "Phân tích các ảnh này và nhận định sức khỏe của bé."
                        : msgContent;
                List<Map<String, Object>> content = new ArrayList<>();
                content.add(Map.of("type", "text", "text", textForImage));
                
                for (String imgBase64 : msg.getImages()) {
                    content.add(Map.of(
                            "type", "image_url",
                            "image_url", Map.of("url", "data:image/jpeg;base64," + imgBase64)));
                }
                messagesForApi.add(Map.of("role", msg.getRole(), "content", content));
            } else if (!msgContent.isBlank()) {
                messagesForApi.add(Map.of("role", msg.getRole(), "content", msgContent));
            }
        }

        Map<String, Object> requestBodyMap = Map.of(
                "model", selectedModel,
                "messages", messagesForApi,
                "stream", true
        );

        String requestBody = objectMapper.writeValueAsString(requestBodyMap);

        String currentApiKey = getApiKey();
        if (currentApiKey == null || currentApiKey.trim().isEmpty()) {
            emitter.completeWithError(new RuntimeException("Không tìm thấy Groq API Key nào được cấu hình!"));
            return;
        }

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(GROQ_API_URL))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + currentApiKey)
                .POST(HttpRequest.BodyPublishers.ofString(requestBody, java.nio.charset.StandardCharsets.UTF_8))
                .timeout(java.time.Duration.ofSeconds(60))
                .build();

        client.sendAsync(request, HttpResponse.BodyHandlers.ofLines())
            .thenAccept(response -> {
                if (response.statusCode() != 200) {
                    logger.severe("Groq API Error - Status: " + response.statusCode());
                    emitter.completeWithError(new RuntimeException("Groq API Error " + response.statusCode()));
                    return;
                }
                response.body().forEach(line -> {
                    try {
                        if (line.startsWith("data: ")) {
                            String data = line.substring(6).trim();
                            if ("[DONE]".equals(data)) {
                                emitter.complete();
                                return;
                            }
                            JsonNode rootNode = objectMapper.readTree(data);
                            JsonNode deltaNode = rootNode.path("choices").get(0).path("delta");
                            if (deltaNode.has("content")) {
                                String content = deltaNode.path("content").asText();
                                if (content != null && !content.isEmpty()) {
                                    emitter.send(content);
                                }
                            }
                        }
                    } catch (Exception e) {
                        logger.warning("Lỗi phân tích stream Groq: " + e.getMessage());
                    }
                });
            })
            .exceptionally(ex -> {
                logger.severe("Groq Streaming Exception: " + ex.getMessage());
                emitter.completeWithError(ex);
                return null;
            });
    }

    /**
     * Bỏ dấu tiếng Việt để so sánh từ khóa khẩn cấp,
     * giúp nhận diện khi user gõ không dấu.
     */
    private String normalizeVietnamese(String input) {
        String result = input
                .replaceAll("[àáạảãâầấậẩẫăằắặẳẵ]", "a")
                .replaceAll("[èéẹẻẽêềếệểễ]", "e")
                .replaceAll("[ìíịỉĩ]", "i")
                .replaceAll("[òóọỏõôồốộổỗơờớợởỡ]", "o")
                .replaceAll("[ùúụủũưừứựửữ]", "u")
                .replaceAll("[ỳýỵỷỹ]", "y")
                .replaceAll("[đ]", "d");
        return result;
    }
}
