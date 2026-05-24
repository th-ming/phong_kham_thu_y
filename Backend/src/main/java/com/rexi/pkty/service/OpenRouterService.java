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
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;

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
        List<String> keys = getApiKeys();
        return keys.isEmpty() ? "" : keys.get(0);
    }

    private List<String> getApiKeys() {
        Set<String> keys = new LinkedHashSet<>();
        try {
            List<String> dbKeys = jdbcTemplate.queryForList(
                    "SELECT gia_tri FROM CauHinhHeThong "
                            + "WHERE ten_cau_hinh LIKE 'openrouter_api_key%' "
                            + "ORDER BY CASE WHEN ten_cau_hinh = 'openrouter_api_key' THEN 0 ELSE 1 END, ten_cau_hinh",
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

    private static final Logger logger = java.util.logging.Logger.getLogger(OpenRouterService.class.getName());

    @Value("${openrouter.api.key:}")
    private String apiKey;

    private static final String OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

    @Value("${openrouter.model:deepseek/deepseek-v4-flash:free}")
    private String modelName;

    private static final List<String> FREE_FALLBACK_MODELS = List.of(
            "openrouter/free",
            "deepseek/deepseek-v4-flash:free",
            "openrouter/owl-alpha",
            "baidu/cobuddy:free",
            "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
            "poolside/laguna-m.1:free",
            "poolside/laguna-xs.2:free"
    );

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final AtomicInteger keyCursor = new AtomicInteger(0);
    private final AtomicInteger modelCursor = new AtomicInteger(0);

    private final HttpClient client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(20))
            .build();

    public String chat(List<ChatMessage> history) throws Exception {
        List<String> apiKeys = getApiKeys();
        if (apiKeys.isEmpty()) {
            throw new RuntimeException("Không tìm thấy OpenRouter API Key nào được cấu hình!");
        }

        ChatMessage latest = history.get(history.size() - 1);
        String latestContent = latest.getContent() != null ? latest.getContent() : "";
        String latestNormalized = normalizeVietnamese(latestContent.toLowerCase());

        // Chuẩn bị danh sách messages cho API (OpenAI-compatible format)
        List<Map<String, Object>> messagesForApi = new ArrayList<>();

        for (ChatMessage msg : history) {
            String msgContent = msg.getContent() != null && !msg.getContent().isBlank() ? msg.getContent() : "";
            if (!msgContent.isBlank()) {
                messagesForApi.add(Map.of("role", msg.getRole(), "content", msgContent));
            }
        }

        Exception lastException = null;
        List<String> candidateModels = getCandidateModels();
        int keyStart = Math.floorMod(keyCursor.getAndIncrement(), apiKeys.size());
        int modelStart = Math.floorMod(modelCursor.getAndIncrement(), candidateModels.size());
        for (int keyOffset = 0; keyOffset < apiKeys.size(); keyOffset++) {
            String currentApiKey = apiKeys.get((keyStart + keyOffset) % apiKeys.size());
            for (int modelOffset = 0; modelOffset < candidateModels.size(); modelOffset++) {
                String candidateModel = candidateModels.get((modelStart + modelOffset) % candidateModels.size());
                try {
                    HttpResponse<String> response = callOpenRouter(currentApiKey, candidateModel, messagesForApi);
                    if (response.statusCode() == 200) {
                        return parseOpenRouterReply(response.body(), candidateModel);
                    }

                    RuntimeException apiException = new RuntimeException(
                            "OpenRouter API Error " + response.statusCode() + " (" + candidateModel + "): " + response.body());
                    lastException = apiException;
                    if (!shouldTryNextModel(response.statusCode(), response.body())) {
                        throw apiException;
                    }
                    logger.warning("OpenRouter key/model lỗi, thử dự phòng tiếp theo. model="
                            + candidateModel + " status=" + response.statusCode());
                } catch (Exception e) {
                    lastException = e;
                    if (!shouldTryNextModel(e)) {
                        throw e;
                    }
                    logger.warning("OpenRouter key/model không khả dụng, thử dự phòng tiếp theo. model="
                            + candidateModel + " error=" + e.getMessage());
                }
            }
        }

        throw new RuntimeException("Tất cả OpenRouter free model đều không khả dụng: "
                + (lastException != null ? lastException.getMessage() : "không rõ lỗi"));
    }

    private List<String> getCandidateModels() {
        Set<String> models = new LinkedHashSet<>();
        String configuredModel = getModelName();
        if (configuredModel != null && !configuredModel.trim().isEmpty()) {
            models.add(configuredModel.trim());
        }
        models.addAll(FREE_FALLBACK_MODELS);
        return new ArrayList<>(models);
    }

    private HttpResponse<String> callOpenRouter(String currentApiKey, String selectedModel,
            List<Map<String, Object>> messagesForApi) throws Exception {
        Map<String, Object> requestBodyMap = Map.of(
                "model", selectedModel,
                "messages", messagesForApi,
                "max_tokens", 2048);

        String requestBody = objectMapper.writeValueAsString(requestBodyMap);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(OPENROUTER_API_URL))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + currentApiKey)
                .header("HTTP-Referer", "http://localhost:3000")
                .header("X-Title", "Rexi Vet Clinic")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8))
                .timeout(Duration.ofSeconds(25))
                .build();

        return client.send(request, HttpResponse.BodyHandlers.ofString());
    }

    private String parseOpenRouterReply(String responseBody, String selectedModel) throws Exception {
        JsonNode rootNode = objectMapper.readTree(responseBody);
        try {
            return rootNode.path("choices").get(0).path("message").path("content").asText();
        } catch (Exception e) {
            logger.severe("Lỗi parse phản hồi từ OpenRouter model " + selectedModel + ". Nội dung: " + responseBody);
            throw new RuntimeException("Lỗi Parse OpenRouter (" + selectedModel + "): " + responseBody);
        }
    }

    private boolean shouldTryNextModel(int statusCode, String responseBody) {
        String body = responseBody == null ? "" : responseBody.toLowerCase();
        return statusCode == 400
                || statusCode == 402
                || statusCode == 404
                || statusCode == 408
                || statusCode == 409
                || statusCode == 429
                || statusCode >= 500
                || body.contains("rate-limited")
                || body.contains("no endpoints")
                || body.contains("insufficient_quota")
                || body.contains("not a valid model");
    }

    private boolean shouldTryNextModel(Exception e) {
        String message = e.getMessage() == null ? "" : e.getMessage().toLowerCase();
        return message.contains("timeout")
                || message.contains("timed out")
                || message.contains("rate")
                || message.contains("quota")
                || message.contains("402")
                || message.contains("404")
                || message.contains("429")
                || message.contains("500")
                || message.contains("502")
                || message.contains("503")
                || message.contains("504")
                || message.contains("no endpoints")
                || message.contains("not a valid model");
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
