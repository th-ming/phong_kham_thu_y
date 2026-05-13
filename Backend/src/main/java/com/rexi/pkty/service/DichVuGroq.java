package com.rexi.pkty.service;

import java.util.logging.Logger;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rexi.pkty.dto.TinNhanChat;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class DichVuGroq {

    private static final Logger logger = Logger.getLogger(DichVuGroq.class.getName());

    @Value("${groq.api.key}")
    private String apiKey;

    private static final String GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

    @Value("${groq.model:llama-3.3-70b-versatile}")
    private String modelName;

    // Model để phân tích hình ảnh
    @Value("${groq.vision.model:meta-llama/llama-4-scout-17b-16e-instruct}")
    private String visionModelName;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // Sử dụng chung 1 HttpClient cho toàn bộ service để tận dụng Connection Pooling
    private final HttpClient client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(20))
            .build();

    public String chat(List<TinNhanChat> history) throws Exception {
        TinNhanChat latest = history.get(history.size() - 1);
        String latestContent = latest.getContent() != null ? latest.getContent() : "";
        String latestNormalized = normalizeVietnamese(latestContent.toLowerCase());

        // Hard Filter cho địa chỉ/vị trí
        if (latestNormalized.contains("dia chi") || latestNormalized.contains("o dau") ||
                latestNormalized.contains("vi tri") || latestNormalized.contains("duong di")) {
            return "Dạ Sen ơi, Phòng khám Rexi tọa lạc tại: **Số 68, Ngõ 10, Đường Ngô Xuân Quảng, Trâu Quỳ, Gia Lâm, Hà Nội** nha! Sen có thể xem chỉ đường chi tiết tại đây ạ: [LINK BẢN ĐỒ] 🐾";
        }

        // Kiểm tra ảnh -> chọn model phù hợp
        boolean hasImage = latest.getImage() != null && !latest.getImage().isEmpty();
        String selectedModel = hasImage ? visionModelName : modelName;

        // Chuẩn bị danh sách messages cho API
        List<Map<String, Object>> messagesForApi = new ArrayList<>();

        for (int i = 0; i < history.size(); i++) {
            TinNhanChat msg = history.get(i);
            String msgContent = msg.getContent() != null && !msg.getContent().isBlank() ? msg.getContent() : "";

            boolean isLatest = (i == history.size() - 1);

            if (isLatest && msg.getImage() != null && !msg.getImage().isEmpty()) {
                String textForImage = msgContent.isBlank() ? "Phân tích ảnh này và nhận định sức khỏe của bé."
                        : msgContent;
                List<Map<String, Object>> content = new ArrayList<>();
                content.add(Map.of("type", "text", "text", textForImage));
                content.add(Map.of(
                        "type", "image_url",
                        "image_url", Map.of("url", "data:image/jpeg;base64," + msg.getImage())));
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

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(GROQ_API_URL))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
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
