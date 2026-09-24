package com.rexi.pkty.service;

import java.util.logging.Logger;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rexi.pkty.dto.ChatMessage;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.*;
import java.io.ByteArrayOutputStream;
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
public class GroqService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private static final long CONFIG_CACHE_TTL_MS = 30_000L;
    private volatile long apiKeysCacheUntilMs = 0L;
    private volatile List<String> cachedApiKeys = List.of();
    private final ConcurrentHashMap<String, CachedConfig> configCache = new ConcurrentHashMap<>();

    private record CachedConfig(String value, long expiresAtMs) {}

    private String getModelName() {
        return getCachedConfig("groq_model", modelName);
    }

    private String getVisionModelName() {
        return getCachedConfig("groq_vision_model", visionModelName);
    }

    public String getAutopilotModelName() {
        String dbModel = getCachedConfig("groq_autopilot_model", "");
        if (dbModel != null && !dbModel.isBlank()) {
            return dbModel;
        }
        return "llama-3.1-8b-instant";
    }

    public static final String REASONING_MODEL_DEFAULT = "llama-3.3-70b-versatile";

    /**
     * Model suy luận cho ReAct agent đa bước + nhánh y tế chuyên sâu (Groq leg cuối).
     * Giữ 70B vì: agent Reason-Act-Observe nhiều vòng + system prompt dài (persona,
     * tools schema, luật y khoa) đòi instruction-following mạnh; 8B gọi tool bừa
     * (always-call) và tốn nhiều vòng lặp hơn. DB key `groq_reasoning_model`
     * override được như các model key khác; thiếu row thì dùng 70B.
     */
    public String getReasoningModelName() {
        String dbModel = getCachedConfig("groq_reasoning_model", "");
        if (dbModel != null && !dbModel.isBlank()) {
            return dbModel;
        }
        return REASONING_MODEL_DEFAULT;
    }

    public String getAudioModelName() {
        return getCachedConfig("groq_audio_model", "whisper-large-v3-turbo");
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

    private static final Logger logger = java.util.logging.Logger.getLogger(GroqService.class.getName());

    @Value("${groq.api.key}")
    private String apiKey;

    private static final String GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
    private static final String GROQ_AUDIO_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
    private static final String GROQ_MODELS_URL = "https://api.groq.com/openai/v1/models";

    @Value("${groq.model:llama-3.1-8b-instant}")
    private String modelName;

    // Model để phân tích hình ảnh
    @Value("${groq.vision.model:meta-llama/llama-4-scout-17b-16e-instruct}")
    private String visionModelName;

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
                            + "WHERE ten_cau_hinh LIKE 'groq_api_key%' "
                            + "ORDER BY CASE WHEN ten_cau_hinh = 'groq_api_key' THEN 0 ELSE 1 END, ten_cau_hinh",
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
    private volatile long lastPrewarmAtMs = 0L;
    private final ConcurrentHashMap<String, Long> keyCooldownUntilMs = new ConcurrentHashMap<>();

    // Cache danh sách model text quét tự động từ Groq /models (24h)
    private volatile List<String> cachedGroqTextModels = List.of();
    private volatile Set<String> cachedGroqKnownIds = Set.of();
    private volatile long lastGroqModelFetchTime = 0L;
    private volatile long lastGroqModelFetchAttemptTime = 0L;
    private static final long GROQ_MODEL_CACHE_DURATION_MS = 24 * 60 * 60 * 1000L; // 24 giờ
    private static final long GROQ_MODEL_FETCH_RETRY_MS = 5 * 60 * 1000L; // fail thì 5 phút sau thử lại

    // HTTP/2 cho phép multiplexing: nhiều request dùng chung 1 TCP connection → giảm ~100-200ms overhead
    private final HttpClient client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(20))
            .version(HttpClient.Version.HTTP_2)
            .build();

    private List<String> getAvailableApiKeys(List<String> apiKeys) {
        long now = System.currentTimeMillis();
        List<String> available = new ArrayList<>();
        List<String> coolingDown = new ArrayList<>();
        for (String key : apiKeys) {
            Long cooldownUntil = keyCooldownUntilMs.get(key);
            if (cooldownUntil == null || cooldownUntil <= now) {
                available.add(key);
            } else {
                coolingDown.add(key);
            }
        }
        return available.isEmpty() ? coolingDown : available;
    }

    private void markKeySuccess(String key) {
        keyCooldownUntilMs.remove(key);
    }

    private void markKeyFailure(String key, int statusCode, String reason) {
        long cooldownMs;
        if (statusCode == 401 || statusCode == 403) {
            cooldownMs = Duration.ofHours(24).toMillis();
        } else if (statusCode == 429) {
            cooldownMs = Duration.ofMinutes(2).toMillis();
        } else if (statusCode >= 500) {
            cooldownMs = Duration.ofSeconds(30).toMillis();
        } else {
            cooldownMs = Duration.ofMinutes(5).toMillis();
        }
        keyCooldownUntilMs.put(key, System.currentTimeMillis() + cooldownMs);
        logger.warning("Groq key cooldown " + maskKey(key) + " status=" + statusCode + " reason=" + reason);
    }

    private void markKeyFailure(String key, Exception e) {
        keyCooldownUntilMs.put(key, System.currentTimeMillis() + Duration.ofSeconds(30).toMillis());
        logger.warning("Groq key cooldown " + maskKey(key) + " error=" + e.getMessage());
    }

    private String maskKey(String key) {
        if (key == null || key.length() < 10) return "****";
        return key.substring(0, 6) + "..." + key.substring(key.length() - 4);
    }

    /**
     * Lọc model chat text từ 1 phần tử model trong JSON /models của Groq.
     * Dùng field chuẩn của API (không match theo tên — tránh để lọt TTS):
     *  - active == true (mặc định true nếu API không trả field)
     *  - input_modalities chứa "text" (chat có thể nhận text; qwen có thêm image vẫn giữ)
     *  - output_modalities chứa "text" (loại speech/transcription: orpheus, whisper)
     *  - loại guard/moderation theo id (prompt-guard, safeguard)
     */
    static boolean isGroqChatModel(JsonNode modelNode) {
        if (modelNode == null || modelNode.isMissingNode()) {
            return false;
        }
        if (!modelNode.path("active").asBoolean(true)) {
            return false;
        }
        String id = modelNode.path("id").asText("").toLowerCase();
        if (id.contains("guard")) {
            return false;
        }
        return modalitiesContain(modelNode.path("input_modalities"), "text")
                && modalitiesContain(modelNode.path("output_modalities"), "text");
    }

    private static boolean modalitiesContain(JsonNode arr, String value) {
        if (arr == null || !arr.isArray()) {
            return false;
        }
        for (JsonNode node : arr) {
            if (value.equals(node.asText())) {
                return true;
            }
        }
        return false;
    }

    /**
     * Trích id các model chat text từ JSON ListModels của Groq (pure function — có unit test).
     */
    static List<String> extractGroqChatModels(JsonNode root) {
        List<String> result = new ArrayList<>();
        if (root == null) {
            return result;
        }
        JsonNode dataNode = root.path("data");
        if (!dataNode.isArray()) {
            return result;
        }
        for (JsonNode modelNode : dataNode) {
            if (isGroqChatModel(modelNode)) {
                String id = modelNode.path("id").asText("");
                if (!id.isBlank() && !result.contains(id)) {
                    result.add(id);
                }
            }
        }
        return result;
    }

    /**
     * Tự động quét model chat text từ Groq /models (cache 24h). API fail hoặc
     * rỗng → fallback cascade static. Cùng cơ chế với OpenRouter và Gemini.
     */
    private synchronized void refreshGroqModelSnapshotIfStale() {
        long now = System.currentTimeMillis();
        if (!cachedGroqTextModels.isEmpty() && (now - lastGroqModelFetchTime < GROQ_MODEL_CACHE_DURATION_MS)) {
            return;
        }
        if (now - lastGroqModelFetchAttemptTime < GROQ_MODEL_FETCH_RETRY_MS) {
            return;
        }
        lastGroqModelFetchAttemptTime = now;

        List<String> keys = getApiKeys();
        if (keys.isEmpty()) {
            return;
        }

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(GROQ_MODELS_URL))
                    .header("Authorization", "Bearer " + keys.get(0))
                    .GET()
                    .timeout(Duration.ofSeconds(10))
                    .build();
            HttpResponse<String> response =
                    client.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());
                JsonNode dataNode = root.path("data");
                Set<String> knownIds = new LinkedHashSet<>();
                if (dataNode.isArray()) {
                    for (JsonNode modelNode : dataNode) {
                        String id = modelNode.path("id").asText(null);
                        if (id != null && !id.isBlank()) {
                            knownIds.add(id);
                        }
                    }
                }
                List<String> textModels = extractGroqChatModels(root);
                if (!textModels.isEmpty()) {
                    cachedGroqTextModels = List.copyOf(textModels);
                    cachedGroqKnownIds = Set.copyOf(knownIds);
                    lastGroqModelFetchTime = now;
                    logger.info("Đã quét tự động " + textModels.size() + " model chat text từ Groq (biết tổng "
                            + knownIds.size() + " IDs).");
                    return;
                }
                if (!knownIds.isEmpty()) {
                    cachedGroqKnownIds = Set.copyOf(knownIds);
                }
            }
        } catch (Exception e) {
            logger.warning("Lỗi tự động quét model Groq: " + e.getMessage());
        }

        if (cachedGroqTextModels.isEmpty()) {
            cachedGroqTextModels = List.of("openai/gpt-oss-20b", "llama-3.3-70b-versatile");
            logger.warning("Dùng fallback static Groq models vì /models không khả dụng.");
        }
    }

    private List<String> getTextModelCandidates(String selectedModel) {
        refreshGroqModelSnapshotIfStale();

        LinkedHashSet<String> models = new LinkedHashSet<>();
        if (selectedModel != null && !selectedModel.isBlank()) {
            String trimmed = selectedModel.trim();
            // Giữ model DB nếu còn sống theo snapshot /models; chưa có snapshot thì giữ.
            if (cachedGroqKnownIds.isEmpty() || cachedGroqKnownIds.contains(trimmed)) {
                models.add(trimmed);
            } else {
                logger.warning("Groq configured model '" + trimmed
                        + "' không còn trên live /models, bỏ qua và dùng dynamic.");
            }
        }
        // Model chat text quét tự động từ /models (đã lọc theo modalities).
        models.addAll(cachedGroqTextModels);
        // Dự phòng cuối khi chưa quét được gì (API fail + chưa có DB model).
        if (models.isEmpty()) {
            models.add("openai/gpt-oss-20b");
            models.add("llama-3.3-70b-versatile");
        }
        return List.copyOf(models);
    }

    public void prewarm() {
        long now = System.currentTimeMillis();
        if (now - lastPrewarmAtMs < 60_000) {
            return;
        }
        lastPrewarmAtMs = now;

        List<String> keys = getAvailableApiKeys(getApiKeys());
        if (keys.isEmpty()) {
            logger.warning("Bỏ qua Groq prewarm vì chưa có API key trong cấu hình.");
            return;
        }

        try {
            String requestBody = objectMapper.writeValueAsString(Map.of(
                    "model", getModelName(),
                    "messages", List.of(
                            Map.of("role", "system", "content", "Warm up Rexi assistant."),
                            Map.of("role", "user", "content", "ping")
                    ),
                    "max_tokens", 1,
                    "temperature", 0
            ));

            int prewarmCount = Math.min(2, keys.size());
            int keyStart = Math.floorMod(keyCursor.getAndIncrement(), keys.size());
            for (int offset = 0; offset < prewarmCount; offset++) {
                String currentApiKey = keys.get((keyStart + offset) % keys.size());
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(GROQ_API_URL))
                        .header("Content-Type", "application/json")
                        .header("Authorization", "Bearer " + currentApiKey)
                        .POST(HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8))
                        .timeout(Duration.ofSeconds(8))
                        .build();

                client.sendAsync(request, HttpResponse.BodyHandlers.discarding())
                        .thenAccept(response -> {
                            if (response.statusCode() == 200) {
                                markKeySuccess(currentApiKey);
                                return;
                            }
                            markKeyFailure(currentApiKey, response.statusCode(), "prewarm");
                        })
                        .exceptionally(ex -> {
                            markKeyFailure(currentApiKey, new RuntimeException(ex));
                            return null;
                        });
            }
        } catch (Exception e) {
            logger.warning("Không tạo được request Groq prewarm: " + e.getMessage());
        }
    }

    public String chat(List<ChatMessage> history) throws Exception {
        return chat(history, null);
    }

    public String chat(List<ChatMessage> history, String modelOverride) throws Exception {
        ChatMessage latest = history.get(history.size() - 1);
        String latestContent = latest.getContent() != null ? latest.getContent() : "";
        String latestNormalized = normalizeVietnamese(latestContent.toLowerCase());



        // Kiểm tra ảnh → chọn model phù hợp (Sử dụng list images mới)
        boolean hasImage = latest.getImages() != null && !latest.getImages().isEmpty();
        String selectedModel;
        if (modelOverride != null && !modelOverride.trim().isEmpty() && !hasImage) {
            selectedModel = modelOverride.trim();
        } else {
            selectedModel = hasImage ? getVisionModelName() : getModelName();
        }

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
                            "image_url", Map.of("url", normalizeImageDataUrl(imgBase64))));
                }
                messagesForApi.add(Map.of("role", msg.getRole(), "content", content));
            } else if (!msgContent.isBlank()) {
                messagesForApi.add(Map.of("role", msg.getRole(), "content", msgContent));
            }
        }

        List<String> apiKeys = getAvailableApiKeys(getApiKeys());
        if (apiKeys.isEmpty()) {
            throw new RuntimeException("Không tìm thấy Groq API Key nào được cấu hình!");
        }

        Exception lastException = null;
        List<String> modelCandidates = hasImage ? List.of(selectedModel) : getTextModelCandidates(selectedModel);
        for (String candidateModel : modelCandidates) {
            Map<String, Object> requestBodyMap = Map.of(
                    "model", candidateModel,
                    "messages", messagesForApi,
                    "max_tokens", hasImage ? 1024 : 500,
                    "temperature", 0.1);
            String requestBody = objectMapper.writeValueAsString(requestBodyMap);

            int keyStart = Math.floorMod(keyCursor.getAndIncrement(), apiKeys.size());
            for (int offset = 0; offset < apiKeys.size(); offset++) {
                int i = (keyStart + offset) % apiKeys.size();
                String currentApiKey = apiKeys.get(i);
                try {
                    HttpRequest request = HttpRequest.newBuilder()
                            .uri(URI.create(GROQ_API_URL))
                            .header("Content-Type", "application/json")
                            .header("Authorization", "Bearer " + currentApiKey)
                            .POST(HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8))
                            .timeout(Duration.ofSeconds(15))
                            .build();                    HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));

                    if (response.statusCode() != 200) {
                        logger.warning("Groq key/model lỗi, thử dự phòng tiếp theo. model=" + candidateModel
                                + " keyIndex=" + i + " status=" + response.statusCode());
                        markKeyFailure(currentApiKey, response.statusCode(), "chat");
                        lastException = new RuntimeException("Groq API Error " + response.statusCode() + ": " + response.body());
                        continue;
                    }

                    markKeySuccess(currentApiKey);
                    prewarm();
                    JsonNode rootNode = objectMapper.readTree(response.body());
                    return rootNode.path("choices").get(0).path("message").path("content").asText();
                } catch (Exception e) {
                    lastException = e;
                    markKeyFailure(currentApiKey, e);
                    logger.warning("Groq key/model không khả dụng, thử dự phòng tiếp theo. model=" + candidateModel
                            + " keyIndex=" + i + " error=" + e.getMessage());
                }
            }
        }

        throw new RuntimeException("Tất cả Groq API Key đều thất bại: "
                + (lastException != null ? lastException.getMessage() : "không rõ lỗi"));
    }

    public String parseIntentJson(String userText) throws Exception {
        List<String> apiKeys = getAvailableApiKeys(getApiKeys());
        if (apiKeys.isEmpty()) {
            throw new RuntimeException("Không tìm thấy Groq API Key nào được cấu hình!");
        }

        String systemPrompt = """
                Bạn là bộ hiểu ý định cho chatbot thú y Rexi. Không trả lời người dùng.
                Đọc câu tiếng Việt tự nhiên, teen code, viết sai chính tả, nói lái, viết không dấu.
                Trả về DUY NHẤT JSON hợp lệ, không markdown:
                {
                  "intent": "exam_before_medication|doctor_list|schedule_lookup|service_price_lookup|appointment_action|clinic_info|vet_advice|web_search|smalltalk|unknown",
                  "species": "dog|cat|pet|unknown",
                  "body_part": "eye|skin|digestive|respiratory|general|unknown",
                  "symptoms": ["..."],
                  "needs_web_search": true|false,
                  "urgency": "emergency|same_day|routine|unknown",
                  "confidence": 0.0
                }
                Ý nghĩa từng intent:
                - exam_before_medication: muốn khám/đánh giá trước, thuốc tính sau, không muốn chốt thuốc ngay.
                - doctor_list: hỏi danh sách, thông tin hoặc bác sĩ nào đang làm việc.
                - schedule_lookup: hỏi lịch trực, giờ làm, hôm nay/ngày mai ai khám.
                - service_price_lookup: hỏi giá, chi phí, bảng giá dịch vụ.
                - appointment_action: muốn đặt, đổi, hủy hoặc điều phối lịch hẹn.
                - clinic_info: hỏi địa chỉ, hotline, giờ mở cửa, giới thiệu phòng khám, dịch vụ/phân hệ.
                - vet_advice: hỏi bệnh, triệu chứng, sơ cứu, chẩn đoán, điều trị, chăm sóc y khoa.
                - web_search: muốn tìm kiếm trên web, nguồn ngoài, tài liệu, tra cứu internet.
                - smalltalk: chào hỏi, cảm ơn, nói chuyện phi vụ thể.
                - unknown: không rõ ý định.
                Ưu tiên hiểu nghĩa, không phụ thuộc từ khóa. Nếu người dùng đòi search/tài liệu/nguồn thì needs_web_search=true.
                Nếu nhiều intent, chọn intent có tính hành động rõ nhất.
                confidence là mức tự tin từ 0.0 đến 1.0; nếu rất mơ hồ thì để thấp.
                """;

        List<Map<String, Object>> messages = List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", userText == null ? "" : userText)
        );
        String requestBody = objectMapper.writeValueAsString(Map.of(
                "model", getModelName(),
                "messages", messages,
                "max_tokens", 180,
                "temperature", 0,
                "response_format", Map.of("type", "json_object")
        ));

        Exception lastException = null;
        int keyStart = Math.floorMod(keyCursor.getAndIncrement(), apiKeys.size());
        for (int offset = 0; offset < Math.min(apiKeys.size(), 2); offset++) {
            String currentApiKey = apiKeys.get((keyStart + offset) % apiKeys.size());
            try {
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(GROQ_API_URL))
                        .header("Content-Type", "application/json")
                        .header("Authorization", "Bearer " + currentApiKey)
                        .POST(HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8))
                        .timeout(Duration.ofSeconds(4))
                        .build();
                HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
                if (response.statusCode() != 200) {
                    markKeyFailure(currentApiKey, response.statusCode(), "intent-parse");
                    lastException = new RuntimeException("Groq intent parse error " + response.statusCode());
                    continue;
                }
                markKeySuccess(currentApiKey);
                JsonNode rootNode = objectMapper.readTree(response.body());
                return rootNode.path("choices").get(0).path("message").path("content").asText();
            } catch (Exception e) {
                lastException = e;
                markKeyFailure(currentApiKey, e);
            }
        }
        throw new RuntimeException("Intent parser không khả dụng: "
                + (lastException != null ? lastException.getMessage() : "không rõ lỗi"));
    }

    public void streamChat(List<ChatMessage> history, SseEmitter emitter) throws Exception {
        streamChat(history, emitter, null);
    }

    public void streamChat(List<ChatMessage> history, SseEmitter emitter, String modelOverride) throws Exception {
        ChatMessage latest = history.get(history.size() - 1);
        String latestContent = latest.getContent() != null ? latest.getContent() : "";

        boolean hasImage = latest.getImages() != null && !latest.getImages().isEmpty();
        String selectedModel;
        if (modelOverride != null && !modelOverride.trim().isEmpty() && !hasImage) {
            selectedModel = modelOverride.trim();
        } else {
            selectedModel = hasImage ? getVisionModelName() : getModelName();
        }

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
                            "image_url", Map.of("url", normalizeImageDataUrl(imgBase64))));
                }
                messagesForApi.add(Map.of("role", msg.getRole(), "content", content));
            } else if (!msgContent.isBlank()) {
                messagesForApi.add(Map.of("role", msg.getRole(), "content", msgContent));
            }
        }

        Map<String, Object> requestBodyMap = Map.of(
                "model", selectedModel,
                "messages", messagesForApi,
                "max_tokens", hasImage ? 1024 : 800,
                "temperature", 0.1,
                "stream", true
        );

        String requestBody = objectMapper.writeValueAsString(requestBodyMap);

        List<String> apiKeys = getAvailableApiKeys(getApiKeys());
        if (apiKeys.isEmpty()) {
            emitter.completeWithError(new RuntimeException("Không tìm thấy Groq API Key nào được cấu hình!"));
            return;
        }
        String currentApiKey = apiKeys.get(Math.floorMod(keyCursor.getAndIncrement(), apiKeys.size()));

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
                    markKeyFailure(currentApiKey, response.statusCode(), "stream");
                    emitter.completeWithError(new RuntimeException("Groq API Error " + response.statusCode()));
                    return;
                }
                markKeySuccess(currentApiKey);
                prewarm();
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
                markKeyFailure(currentApiKey, new RuntimeException(ex));
                emitter.completeWithError(ex);
                return null;
            });
    }

    public String transcribeAudio(MultipartFile file) throws Exception {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("File âm thanh trống.");
        }

        List<String> apiKeys = getAvailableApiKeys(getApiKeys());
        if (apiKeys.isEmpty()) {
            throw new RuntimeException("Không tìm thấy Groq API Key nào được cấu hình!");
        }

        Exception lastException = null;
        int keyStart = Math.floorMod(keyCursor.getAndIncrement(), apiKeys.size());
        for (int offset = 0; offset < apiKeys.size(); offset++) {
            int i = (keyStart + offset) % apiKeys.size();
            String currentApiKey = apiKeys.get(i);
            try {
                String boundary = "----RexiGroqBoundary" + System.currentTimeMillis();
                String filename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "audio.webm";

                ByteArrayOutputStream body = new ByteArrayOutputStream();
                writeMultipartField(body, boundary, "model", getAudioModelName());
                writeMultipartField(body, boundary, "response_format", "json");
                writeMultipartField(body, boundary, "language", "vi");
                body.write(("--" + boundary + "\r\n").getBytes(StandardCharsets.UTF_8));
                body.write(("Content-Disposition: form-data; name=\"file\"; filename=\"" + filename + "\"\r\n").getBytes(StandardCharsets.UTF_8));
                body.write(("Content-Type: " + (file.getContentType() != null ? file.getContentType() : "audio/webm") + "\r\n\r\n").getBytes(StandardCharsets.UTF_8));
                body.write(file.getBytes());
                body.write(("\r\n--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(GROQ_AUDIO_URL))
                        .header("Authorization", "Bearer " + currentApiKey)
                        .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                        .POST(HttpRequest.BodyPublishers.ofByteArray(body.toByteArray()))
                        .timeout(Duration.ofSeconds(60))
                        .build();

                HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
                if (response.statusCode() != 200) {
                    markKeyFailure(currentApiKey, response.statusCode(), "audio-transcription");
                    lastException = new RuntimeException("Groq audio API Error " + response.statusCode() + ": " + response.body());
                    continue;
                }

                markKeySuccess(currentApiKey);
                JsonNode rootNode = objectMapper.readTree(response.body());
                return rootNode.path("text").asText("");
            } catch (Exception e) {
                lastException = e;
                markKeyFailure(currentApiKey, e);
                logger.warning("Groq audio key không khả dụng, thử key dự phòng tiếp theo. keyIndex=" + i
                        + " error=" + e.getMessage());
            }
        }

        throw new RuntimeException("Tất cả Groq API Key đều thất bại khi dịch giọng nói: "
                + (lastException != null ? lastException.getMessage() : "không rõ lỗi"));
    }

    private void writeMultipartField(ByteArrayOutputStream body, String boundary, String name, String value) throws Exception {
        body.write(("--" + boundary + "\r\n").getBytes(StandardCharsets.UTF_8));
        body.write(("Content-Disposition: form-data; name=\"" + name + "\"\r\n\r\n").getBytes(StandardCharsets.UTF_8));
        body.write((value + "\r\n").getBytes(StandardCharsets.UTF_8));
    }

    // * * Bỏ dấu tiếng Việt để so sánh từ khóa khẩn cấp, * giúp nhận diện khi user gõ ko dấu.
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

    private String normalizeImageDataUrl(String raw) {
        if (raw == null || raw.isBlank()) {
            return "data:image/jpeg;base64,";
        }
        if (raw.startsWith("data:")) {
            return raw;
        }
        return "data:image/jpeg;base64," + raw;
    }
}
