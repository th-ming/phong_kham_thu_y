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
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class GeminiService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static final long CONFIG_CACHE_TTL_MS = 30_000L;
    private volatile long apiKeysCacheUntilMs = 0L;
    private volatile List<String> cachedApiKeys = List.of();
    private final ConcurrentHashMap<String, CachedConfig> configCache = new ConcurrentHashMap<>();

    private record CachedConfig(String value, long expiresAtMs) {}

    private String getModelName() {
        return getCachedConfig("gemini_model", modelName);
    }

    public String getMediaModelName() {
        return getCachedConfig("gemini_media_model", getModelName());
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

    private static final Logger logger = Logger.getLogger(GeminiService.class.getName());

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.model:gemini-2.5-flash}")
    private String modelName;

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
                            + "WHERE ten_cau_hinh LIKE 'gemini_api_key%' "
                            + "ORDER BY CASE WHEN ten_cau_hinh = 'gemini_api_key' THEN 0 ELSE 1 END, ten_cau_hinh",
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

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final AtomicInteger keyCursor = new AtomicInteger(0);
    private final AtomicInteger modelCursor = new AtomicInteger(0);
    // Giới hạn key/model thử khi phân tích video để tránh treo request quá lâu
    private static final int MAX_VIDEO_KEYS_PER_REQUEST = 2;
    private static final int MAX_VIDEO_MODELS_PER_REQUEST = 2;
    // Giới hạn token output video để phản hồi nhanh, đủ thông tin y khoa
    private static final int MAX_VIDEO_OUTPUT_TOKENS = 600;
    // Giới hạn số lượt hội thoại gửi kèm khi có video (chỉ giữ turn cuối để giảm payload)
    private static final int MAX_HISTORY_TURNS_WITH_VIDEO = 1;

    // Sử dụng chung 1 HttpClient cho toàn bộ service để tăng hiệu suất
    private final HttpClient client = HttpClient.newBuilder()
            .version(HttpClient.Version.HTTP_2)
            .connectTimeout(Duration.ofSeconds(10))
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
        boolean hasVideo = false;

        // Kiểm tra trước xem có video không để cắt bớt lịch sử hội thoại
        boolean videoInHistory = userModelHistory.stream().anyMatch(m -> m.getVideos() != null && !m.getVideos().isEmpty());
        boolean imageInHistory = userModelHistory.stream().anyMatch(m -> m.getImages() != null && !m.getImages().isEmpty());
        boolean hasMediaInHistory = videoInHistory || imageInHistory;
        // Nếu có video, chỉ lấy MAX_HISTORY_TURNS_WITH_VIDEO turn cuối để giảm payload gửi lên Gemini
        List<ChatMessage> effectiveHistory = (videoInHistory && userModelHistory.size() > MAX_HISTORY_TURNS_WITH_VIDEO)
                ? userModelHistory.subList(userModelHistory.size() - MAX_HISTORY_TURNS_WITH_VIDEO, userModelHistory.size())
                : userModelHistory;

        for (ChatMessage msg : effectiveHistory) {
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
                    if (imgBase64 == null || imgBase64.isBlank()) {
                        continue;
                    }
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
                hasVideo = true;

                for (String vidData : msg.getVideos()) {
                    if (vidData == null || vidData.isBlank()) {
                        continue;
                    }
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

        // Cấu hình sinh văn bản: giới hạn output token, chỉ 1 candidate, tắt thinking để tăng tốc
        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("candidateCount", 1);
        if (hasVideo) {
            // Video: giới hạn token để phản hồi nhanh, đủ thông tin y khoa
            generationConfig.put("maxOutputTokens", MAX_VIDEO_OUTPUT_TOKENS);
            // Tắt chain-of-thought thinking (tiết kiệm ~30-40% thời gian xử lý)
            generationConfig.put("thinkingConfig", Map.of("thinkingBudget", 0));
        }
        requestBodyMap.put("generationConfig", generationConfig);

        String requestBody = objectMapper.writeValueAsString(requestBodyMap);

        List<String> activeKeys = hasVideo && keys.size() > MAX_VIDEO_KEYS_PER_REQUEST
                ? keys.subList(0, MAX_VIDEO_KEYS_PER_REQUEST)
                : keys;
        List<String> modelCandidates = getModelCandidates(hasMediaInHistory);
        List<String> activeModels = hasVideo && modelCandidates.size() > MAX_VIDEO_MODELS_PER_REQUEST
                ? modelCandidates.subList(0, MAX_VIDEO_MODELS_PER_REQUEST)
                : modelCandidates;
        int keyStart = Math.floorMod(keyCursor.getAndIncrement(), activeKeys.size());
        int modelStart = Math.floorMod(modelCursor.getAndIncrement(), activeModels.size());

        // Duyệt round-robin qua danh sách model/key để tránh dồn tải vào key đầu.
        // Với video, giới hạn số lần thử để một request đa phương tiện ko treo qua nhiều timeout liên tiếp.
        for (int keyOffset = 0; keyOffset < activeKeys.size(); keyOffset++) {
            int keyIndex = (keyStart + keyOffset) % activeKeys.size();
            String currentKey = activeKeys.get(keyIndex).trim();
            if (currentKey.isEmpty()) continue;
            
            for (int modelOffset = 0; modelOffset < activeModels.size(); modelOffset++) {
                String selectedModel = activeModels.get((modelStart + modelOffset) % activeModels.size());

                String apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/" + selectedModel + ":generateContent?key="
                        + currentKey;

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(apiUrl))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8))
                        // Video cần timeout cao hơn (60s) vì payload nặng hơn text; câu hỏi thường rút ngắn còn 5s để failover nhanh
                        .timeout(Duration.ofSeconds(hasVideo ? 60 : 5))
                        .build();

                try {
                    HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));

                    if (response.statusCode() == 200) {
                        JsonNode rootNode = objectMapper.readTree(response.body());
                        try {
                            return rootNode.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
                        } catch (Exception e) {
                            logger.severe("Lỗi phân tích phản hồi từ Gemini (model " + selectedModel + ", keyIndex " + keyIndex + "). Nội dung: " + response.body());
                            lastException = new RuntimeException("Lỗi Parse Gemini: " + response.body());
                            break; // Lỗi parse thì đổi key luôn
                        }
                    } else {
                        lastException = new RuntimeException("Gemini API gặp lỗi " + response.statusCode() + ": " + response.body());
                        
                        if (response.statusCode() == 404) {
                            logger.warning("Gemini model " + selectedModel + " không tồn tại, thử model dự phòng...");
                            continue; // Đổi model
                        } else {
                            logger.warning("Gemini key lỗi (status " + response.statusCode() + "), thử key dự phòng...");
                            break; // Đổi key
                        }
                    }
                } catch (Exception e) {
                    lastException = e;
                    logger.warning("Lỗi mạng Gemini API (timeout/disconnect), thử key dự phòng: " + e.getMessage());
                    break; // Đổi key
                }
            }
        }

        if (lastException != null) {
            throw lastException;
        }
        throw new RuntimeException("Tất cả các Gemini API Key đều thất bại hoặc không hợp lệ!");
    }

    private List<String> getModelCandidates(boolean hasMedia) {
        Set<String> models = new LinkedHashSet<>();
        String configured = hasMedia ? getMediaModelName() : getModelName();
        if (configured != null && !configured.trim().isEmpty()) {
            models.add(configured.trim());
        }
        models.addAll(getDiscoveredModels());
        // Hardcode giữ con đang chạy được + bản lite rẻ; discovery nằm giữa để ưu tiên model live mới hơn.
        models.add("gemini-2.0-flash");
        models.add("gemini-2.5-flash-lite");
        models.add("gemini-flash-lite-latest");
        return new ArrayList<>(models);
    }

    private static final String GEMINI_LIST_MODELS_URL =
            "https://generativelanguage.googleapis.com/v1beta/models";
    private static final long MODEL_DISCOVERY_CACHE_MS = 24 * 60 * 60 * 1000L; // 24 giờ
    private static final long DISCOVERY_RETRY_MS = 5 * 60 * 1000L; // fail thì 5 phút sau thử lại
    private volatile List<String> cachedDiscoveredModels = List.of();
    private volatile long lastDiscoveryTime = 0;
    private volatile long lastDiscoveryAttemptTime = 0;

    /**
     * Discovery model qua ListModels của Gemini (cache 24h, filter
     * supportedGenerationMethods chứa generateContent, stable trước).
     * Key rỗng hoặc API fail → trả rỗng im lặng + log, caller rơi về hardcode.
     */
    private synchronized List<String> getDiscoveredModels() {
        long now = System.currentTimeMillis();
        if (!cachedDiscoveredModels.isEmpty() && (now - lastDiscoveryTime < MODEL_DISCOVERY_CACHE_MS)) {
            return cachedDiscoveredModels;
        }
        if (now - lastDiscoveryAttemptTime < DISCOVERY_RETRY_MS) {
            return cachedDiscoveredModels;
        }
        lastDiscoveryAttemptTime = now;

        List<String> apiKeys = getApiKeys();
        if (apiKeys.isEmpty()) {
            return cachedDiscoveredModels;
        }
        String key = apiKeys.get(0).trim();
        if (key.isEmpty()) {
            return cachedDiscoveredModels;
        }

        try {
            List<String> discovered = new ArrayList<>();
            String pageToken = null;
            // ListModels phân trang (mặc định 50/page): theo tối đa 3 pages là đủ.
            for (int page = 0; page < 3; page++) {
                String url = GEMINI_LIST_MODELS_URL + "?key=" + key + "&pageSize=100"
                        + (pageToken == null ? "" : "&pageToken=" + pageToken);
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .header("Content-Type", "application/json")
                        .GET()
                        .timeout(Duration.ofSeconds(10))
                        .build();
                HttpResponse<String> response =
                        client.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
                if (response.statusCode() != 200) {
                    logger.warning("Gemini ListModels trả lỗi " + response.statusCode()
                            + ", giữ chain hardcode.");
                    return cachedDiscoveredModels;
                }
                JsonNode root = objectMapper.readTree(response.body());
                discovered.addAll(extractGenerateContentModels(root));
                JsonNode tokenNode = root.path("nextPageToken");
                if (tokenNode.isMissingNode() || tokenNode.asText().isBlank()) {
                    break;
                }
                pageToken = tokenNode.asText();
            }
            if (!discovered.isEmpty()) {
                // Stable trước (không chứa preview/exp/beta/alpha), tối đa 2 con để chain gọn.
                List<String> stable = new ArrayList<>();
                List<String> rest = new ArrayList<>();
                for (String id : discovered) {
                    String lower = id.toLowerCase();
                    if (lower.contains("preview") || lower.contains("-exp")
                            || lower.contains("beta") || lower.contains("alpha")) {
                        rest.add(id);
                    } else {
                        stable.add(id);
                    }
                }
                stable.addAll(rest);
                cachedDiscoveredModels = List.copyOf(stable.subList(0, Math.min(2, stable.size())));
                lastDiscoveryTime = now;
                logger.info("Gemini discovery cập nhật " + cachedDiscoveredModels.size()
                        + " model hỗ trợ generateContent.");
            }
        } catch (Exception e) {
            logger.warning("Gemini ListModels fail, giữ chain hardcode: " + e.getMessage());
        }
        return cachedDiscoveredModels;
    }

    /**
     * Lọc model hỗ trợ generateContent từ JSON ListModels (pure function — có unit test).
     * Trả về base model id (bỏ prefix "models/").
     */
    static List<String> extractGenerateContentModels(JsonNode root) {
        List<String> result = new ArrayList<>();
        JsonNode models = root == null ? null : root.path("models");
        if (models == null || !models.isArray()) {
            return result;
        }
        for (JsonNode m : models) {
            String name = m.path("name").asText("");
            if (name.isBlank()) {
                continue;
            }
            JsonNode methods = m.path("supportedGenerationMethods");
            if (!methods.isArray()) {
                continue;
            }
            for (JsonNode method : methods) {
                if ("generateContent".equals(method.asText())) {
                    String id = name.startsWith("models/") ? name.substring("models/".length()) : name;
                    if (!result.contains(id)) {
                        result.add(id);
                    }
                    break;
                }
            }
        }
        return result;
    }
}
