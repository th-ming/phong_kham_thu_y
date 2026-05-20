package com.rexi.pkty.service;

import java.util.logging.Logger;
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
import java.util.List;
import java.util.Map;

@Service
public class OpenRouterService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private String getModelName() {
        try {
            String dbModel = jdbcTemplate.queryForObject(
                "SELECT gia_tri FROM CauHinhHeThong WHERE ten_cau_hinh = 'openrouter_model'", 
                String.class);
            if (dbModel != null && !dbModel.trim().isEmpty()) {
                return dbModel.trim();
            }
        } catch (Exception e) {
        }
        return modelName;
    }

    private String getApiKey() {
        try {
            String dbKey = jdbcTemplate.queryForObject(
                "SELECT gia_tri FROM CauHinhHeThong WHERE ten_cau_hinh = 'openrouter_api_key'", 
                String.class);
            if (dbKey != null && !dbKey.trim().isEmpty()) {
                return dbKey.trim();
            }
        } catch (Exception e) {}
        return apiKey;
    }

    private static final Logger logger = java.util.logging.Logger.getLogger(OpenRouterService.class.getName());

    @Value("${openrouter.api.key:}")
    private String apiKey;

    private static final String OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

    @Value("${openrouter.model:deepseek/deepseek-v4-flash:free}")
    private String modelName;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private final HttpClient client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(4))
            .build();

    public String chat(List<ChatMessage> history) throws Exception {
        String currentApiKey = getApiKey();
        if (currentApiKey == null || currentApiKey.trim().isEmpty()) {
            throw new RuntimeException("Không tìm thấy OpenRouter API Key nào được cấu hình!");
        }

        ChatMessage latest = history.get(history.size() - 1);
        String latestContent = latest.getContent() != null ? latest.getContent() : "";
        String latestNormalized = normalizeVietnamese(latestContent.toLowerCase());

        // Hard Filter cho địa chỉ/vị trí giống như Groq
        if (latestNormalized.contains("dia chi") || latestNormalized.contains("o dau") ||
                latestNormalized.contains("vi tri") || latestNormalized.contains("duong di")) {
            return "Dạ Sen ơi, Phòng khám Rexi tọa lạc tại: **Số 68, Ngõ 10, Đường Ngô Xuân Quảng, Trâu Quỳ, Gia Lâm, Hà Nội** nha! Sen có thể xem chỉ đường chi tiết tại đây ạ: [LINK BẢN ĐỒ] 🐾";
        }

        // Chuẩn bị danh sách messages cho API (OpenAI-compatible format)
        List<Map<String, Object>> messagesForApi = new ArrayList<>();

        for (ChatMessage msg : history) {
            String msgContent = msg.getContent() != null && !msg.getContent().isBlank() ? msg.getContent() : "";
            if (!msgContent.isBlank()) {
                messagesForApi.add(Map.of("role", msg.getRole(), "content", msgContent));
            }
        }

        Map<String, Object> requestBodyMap = Map.of(
                "model", getModelName(),
                "messages", messagesForApi);

        String requestBody = objectMapper.writeValueAsString(requestBodyMap);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(OPENROUTER_API_URL))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + currentApiKey)
                .header("HTTP-Referer", "http://localhost:3000") // Required for OpenRouter
                .header("X-Title", "Rexi Vet Clinic")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8))
                .timeout(Duration.ofSeconds(4))
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            logger.severe("OpenRouter API Error - Status: " + response.statusCode() + " Body: " + response.body());
            throw new RuntimeException("OpenRouter API Error " + response.statusCode() + ": " + response.body());
        }

        JsonNode rootNode = objectMapper.readTree(response.body());
        try {
            return rootNode.path("choices").get(0).path("message").path("content").asText();
        } catch (Exception e) {
            logger.severe("Lỗi parse phản hồi từ OpenRouter. Nội dung: " + response.body());
            throw new RuntimeException("Lỗi Parse OpenRouter: " + response.body());
        }
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
}
