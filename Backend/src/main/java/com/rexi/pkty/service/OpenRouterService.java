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
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class OpenRouterService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static final long CONFIG_CACHE_TTL_MS = 30_000L;
    private volatile long apiKeysCacheUntilMs = 0L;
    private volatile List<String> cachedApiKeys = List.of();
    private final ConcurrentHashMap<String, CachedConfig> configCache = new ConcurrentHashMap<>();

    private record CachedConfig(String value, long expiresAtMs) {}

    private String getModelName() {
        return getCachedConfig("openrouter_model", modelName);
    }

    public String getMedicalModelName() {
        return getCachedConfig("openrouter_medical_model", getModelName());
    }

    private String getCachedConfig(String configName, String fallback) {
        long now = System.currentTimeMillis();
        CachedConfig cached = configCache.get(configName);
        if (cached != null && cached.expiresAtMs() > now) {
            return cached.value();
        }

        String value = fallback;
        try {
            String dbModel = jdbcTemplate.queryForObject(
                "SELECT gia_tri FROM CauHinhHeThong WHERE ten_cau_hinh = ?",
                String.class,
                configName);
            if (dbModel != null && !dbModel.trim().isEmpty()) {
                value = dbModel.trim();
            }
        } catch (Exception e) {
        }
        configCache.put(configName, new CachedConfig(value, now + CONFIG_CACHE_TTL_MS));
        return value;
    }

    private String getApiKey() {
        List<String> keys = getApiKeys();
        return keys.isEmpty() ? "" : keys.get(0);
    }

    private List<String> getApiKeys() {
        long now = System.currentTimeMillis();
        if (apiKeysCacheUntilMs > now && !cachedApiKeys.isEmpty()) {
            return cachedApiKeys;
        }

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
        List<String> resolvedKeys = List.copyOf(keys);
        cachedApiKeys = resolvedKeys;
        apiKeysCacheUntilMs = now + CONFIG_CACHE_TTL_MS;
        return resolvedKeys;
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

    @Value("${openrouter.model:deepseek/deepseek-chat-v3-0324:free}")
    private String modelName;

    @Value("${app.frontend-url:http://localhost:3005}")
    private String frontendUrl;

    // Biến lưu Cache danh sách Model
    private List<String> cachedFreeModels = new ArrayList<>();
    private long lastModelFetchTime = 0;
    private static final long CACHE_DURATION_MS = 24 * 60 * 60 * 1000L; // 24 giờ

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final AtomicInteger keyCursor = new AtomicInteger(0);
    private final AtomicInteger modelCursor = new AtomicInteger(0);

    private final HttpClient client = HttpClient.newBuilder()
            .version(HttpClient.Version.HTTP_2)
            .connectTimeout(Duration.ofSeconds(6))
            .build();

    public String chat(List<ChatMessage> history) throws Exception {
        return chat(history, false);
    }

    public String chat(List<ChatMessage> history, boolean isMedical) throws Exception {
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
        List<String> candidateModels = getCandidateModels(isMedical);
        int keyStart = Math.floorMod(keyCursor.getAndIncrement(), apiKeys.size());
        
        for (int keyOffset = 0; keyOffset < apiKeys.size(); keyOffset++) {
            String currentApiKey = apiKeys.get((keyStart + keyOffset) % apiKeys.size());
            
            try {
                HttpResponse<String> response = callOpenRouter(currentApiKey, candidateModels, messagesForApi);
                if (response.statusCode() == 200) {
                    return parseOpenRouterReply(response.body());
                }

                RuntimeException apiException = new RuntimeException(
                        "OpenRouter API Error " + response.statusCode() + ": " + response.body());
                lastException = apiException;
                if (!shouldTryNextModel(response.statusCode(), response.body())) {
                    throw apiException;
                }
                logger.warning("OpenRouter key lỗi, thử dự phòng tiếp theo. status=" + response.statusCode());
            } catch (Exception e) {
                lastException = e;
                if (!shouldTryNextModel(e)) {
                    throw e;
                }
                logger.warning("OpenRouter key không khả dụng, thử dự phòng tiếp theo. error=" + e.getMessage());
            }
        }

        throw new RuntimeException("Tất cả OpenRouter API Key đều không khả dụng: "
                + (lastException != null ? lastException.getMessage() : "không rõ lỗi"));
    }

    private List<String> getCandidateModels(boolean isMedical) {
        Set<String> models = new LinkedHashSet<>();
        String configuredModel = isMedical ? getMedicalModelName() : getModelName();
        if (configuredModel != null && !configuredModel.trim().isEmpty()) {
            models.add(configuredModel.trim());
        }
        models.addAll(getStaticFallbackModels(isMedical));

        // Giới hạn tối đa 3 models để request ổn định, tránh provider tự chọn model free kém chất lượng.
        List<String> list = new ArrayList<>(models);
        if (list.size() > 3) {
            return list.subList(0, 3);
        }
        return list;
    }

    private List<String> getStaticFallbackModels(boolean isMedical) {
        if (isMedical) {
            return List.of(
                    "deepseek/deepseek-chat-v3-0324:free",
                    "google/gemini-2.0-flash-exp:free"
            );
        }
        return List.of(
                "deepseek/deepseek-chat-v3-0324:free",
                "google/gemini-2.0-flash-exp:free"
        );
    }

    private synchronized List<String> getDynamicFreeModels() {
        long now = System.currentTimeMillis();
        // Trả về cache nếu chưa hết hạn (chưa qua 24 giờ)
        if (!cachedFreeModels.isEmpty() && (now - lastModelFetchTime < CACHE_DURATION_MS)) {
            return cachedFreeModels;
        }

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://openrouter.ai/api/v1/models"))
                    .GET()
                    .timeout(Duration.ofSeconds(10))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());
                JsonNode dataNode = root.path("data");
                List<String> freeModels = new ArrayList<>();
                
                if (dataNode.isArray()) {
                    for (JsonNode modelNode : dataNode) {
                        String id = modelNode.path("id").asText();
                        JsonNode pricing = modelNode.path("pricing");
                        
                        String promptPrice = pricing.path("prompt").asText();
                        String completionPrice = pricing.path("completion").asText();
                        
                        // OpenRouter quy định model free có giá prompt & completion đều bằng "0"
                        if (("0".equals(promptPrice) || "0.0".equals(promptPrice)) && 
                            ("0".equals(completionPrice) || "0.0".equals(completionPrice))) {
                            freeModels.add(id);
                        }
                    }
                }
                
                if (!freeModels.isEmpty()) {
                    // Giới hạn lấy tối đa 10 model free để ko làm mảng API quá dài gây nghẽn
                    cachedFreeModels = freeModels.subList(0, Math.min(freeModels.size(), 10));
                    lastModelFetchTime = now;
                    logger.info("Đã quét tự động và cập nhật " + cachedFreeModels.size() + " model Free từ OpenRouter.");
                    return cachedFreeModels;
                }
            }
        } catch (Exception e) {
            logger.warning("Lỗi tự động quét model Free từ OpenRouter: " + e.getMessage());
        }

        // Danh sách dự phòng cứng (Hardcode) nếu API /models bị sập
        if (cachedFreeModels.isEmpty()) {
            return List.of(
                    "openrouter/free",
                    "deepseek/deepseek-v4-flash:free",
                    "openrouter/owl-alpha",
                    "baidu/cobuddy:free",
                    "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free"
            );
        }
        return cachedFreeModels;
    }

    private HttpResponse<String> callOpenRouter(String currentApiKey, List<String> candidateModels,
            List<Map<String, Object>> messagesForApi) throws Exception {
        Map<String, Object> requestBodyMap = Map.of(
                "models", candidateModels,
                "messages", messagesForApi,
                "max_tokens", 2000,
                "temperature", 0.35);

        String requestBody = objectMapper.writeValueAsString(requestBodyMap);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(OPENROUTER_API_URL))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + currentApiKey)
                .header("HTTP-Referer", frontendUrl)
                .header("X-Title", "Rexi Vet Clinic")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8))
                .timeout(Duration.ofSeconds(12))
                .build();

        return client.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
    }

    private String parseOpenRouterReply(String responseBody) throws Exception {
        JsonNode rootNode = objectMapper.readTree(responseBody);
        try {
            return rootNode.path("choices").get(0).path("message").path("content").asText();
        } catch (Exception e) {
            logger.severe("Lỗi parse phản hồi từ OpenRouter. Nội dung: " + responseBody);
            throw new RuntimeException("Lỗi Parse OpenRouter: " + responseBody);
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
