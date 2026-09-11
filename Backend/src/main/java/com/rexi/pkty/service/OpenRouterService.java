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

    @Value("${openrouter.model:google/gemma-4-31b-it:free}")
    private String modelName;

    @Value("${app.frontend-url:http://localhost:3005}")
    private String frontendUrl;

    private static final String OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";

    // Biến lưu Cache danh sách Model
    private volatile List<FreeModelInfo> cachedFreeModelInfos = List.of();
    private volatile Set<String> cachedKnownModelIds = Set.of();
    private volatile long lastModelFetchTime = 0;
    private volatile long lastFetchAttemptTime = 0;
    private static final long CACHE_DURATION_MS = 24 * 60 * 60 * 1000L; // 24 giờ
    private static final long FAILED_FETCH_RETRY_MS = 5 * 60 * 1000L; // fetch fail thì 5 phút sau mới thử lại

    /**
     * Bản ghi rút gọn của 1 model free trên OpenRouter, đủ để lọc curated
     * mà không cần giữ nguyên cả JSON snapshot trong RAM.
     */
    static record FreeModelInfo(
            String id,
            String name,
            String description,
            boolean reasoningMandatory,
            boolean textOutput) {}

    // Thứ tự ưu tiên model free general chat/instruct (đã đối chiếu live /models).
    // Preferred list được allowlist: bỏ qua heuristic loại trừ bên dưới.
    private static final List<String> GENERAL_PREFERRED_FREE = List.of(
            "google/gemma-4-31b-it:free",
            "thinkingmachines/inkling-small:free",
            "nvidia/nemotron-3.5-lightning:free",
            "google/gemma-4-26b-a4b-it:free",
            "nex-agi/nex-n2.5-pro:free");

    // Nhánh medical: ưu tiên model health/medicine + reasoning giữ lại cho ca khó.
    private static final List<String> MEDICAL_PREFERRED_FREE = List.of(
            "inclusionai/ling-3.0-flash-sante:free",
            "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
            "google/gemma-4-31b-it:free",
            "thinkingmachines/inkling-small:free",
            "nvidia/nemotron-3.5-lightning:free");

    // Cụm từ trong name/description cho thấy model KHÔNG hợp chat thường
    // (code-only/agentic-coding, guardrail/moderation, chuyên ngành hẹp).
    private static final List<String> CHAT_EXCLUDED_PHRASES = List.of(
            "coding agent", "agentic coding", "code model",
            "guardrail", "content safety", "content moderation",
            "finance-focused", "finance focused");

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
            String trimmed = configuredModel.trim();
            if (isModelAlive(trimmed)) {
                models.add(trimmed);
            } else {
                logger.warning("OpenRouter configured model '" + trimmed
                        + "' không còn tồn tại trên live /models, bỏ qua và dùng dynamic curated.");
            }
        }
        models.addAll(getCuratedDynamicModels(isMedical));
        models.addAll(getStaticFallbackModels(isMedical));

        // OpenRouter gioi han mang 'models' toi da 3 items.
        List<String> list = new ArrayList<>(models);
        if (list.size() > 3) {
            return list.subList(0, 3);
        }
        return list;
    }

    private List<String> getStaticFallbackModels(boolean isMedical) {
        // Toàn bộ ID dưới đây đã đối chiếu còn sống trên live /models (snapshot 436 models).
        if (isMedical) {
            return List.of(
                    "inclusionai/ling-3.0-flash-sante:free",
                    "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
                    "google/gemma-4-31b-it:free");
        }
        return List.of(
                "google/gemma-4-31b-it:free",
                "thinkingmachines/inkling-small:free",
                "nvidia/nemotron-3.5-lightning:free");
    }

    /**
     * Model curated từ snapshot live /models (cache 24h). Trả về rỗng nếu chưa
     * từng quét thành công — caller sẽ rơi xuống static fallback.
     */
    private List<String> getCuratedDynamicModels(boolean isMedical) {
        refreshModelSnapshotIfStale();
        List<FreeModelInfo> snapshot = cachedFreeModelInfos;
        if (snapshot.isEmpty()) {
            return List.of();
        }
        return curateFreeModels(snapshot, isMedical);
    }

    /**
     * Kiểm tra model còn sống theo snapshot live /models gần nhất.
     * Nếu chưa có snapshot (API /models fail) thì TRẢ VỀ TRUE để giữ
     * configured model — không được drop model chỉ vì không verify được.
     */
    private boolean isModelAlive(String modelId) {
        refreshModelSnapshotIfStale();
        Set<String> known = cachedKnownModelIds;
        if (known.isEmpty()) {
            return true;
        }
        return known.contains(modelId);
    }

    /**
     * Lọc curated (pure function — có unit test riêng):
     * preferred∩alive trước, rồi fill thêm model free alive không bị loại,
     * tối đa 5. Preferred được allowlist, bỏ qua heuristic loại trừ.
     */
    static List<String> curateFreeModels(List<FreeModelInfo> all, boolean isMedical) {
        Set<String> aliveIds = new LinkedHashSet<>();
        for (FreeModelInfo info : all) {
            if (info == null || info.id() == null || info.id().isBlank()) {
                continue;
            }
            aliveIds.add(info.id());
        }

        List<String> preferred = isMedical ? MEDICAL_PREFERRED_FREE : GENERAL_PREFERRED_FREE;
        LinkedHashSet<String> curated = new LinkedHashSet<>();
        for (String id : preferred) {
            if (aliveIds.contains(id)) {
                curated.add(id);
            }
        }
        for (FreeModelInfo info : all) {
            if (curated.size() >= 5) {
                break;
            }
            if (info == null || info.id() == null || curated.contains(info.id())) {
                continue;
            }
            if (!isExcludedFromChat(info, isMedical)) {
                curated.add(info.id());
            }
        }
        return new ArrayList<>(curated);
    }

    /**
     * Loại khỏi chat thường: code-only/agentic-coding, guardrail/moderation,
     * chuyên ngành hẹp (finance), output không phải text, và reasoning-only
     * (reasoning mandatory — chỉ giữ lại cho nhánh medical).
     */
    static boolean isExcludedFromChat(FreeModelInfo info, boolean isMedical) {
        if (info == null || info.id() == null) {
            return true;
        }
        String idLower = info.id().toLowerCase();
        if (idLower.contains("content-safety") || idLower.contains("guard")) {
            return true;
        }
        if (!info.textOutput()) {
            return true;
        }
        if (info.reasoningMandatory() && !isMedical) {
            return true;
        }
        String haystack = ((info.name() == null ? "" : info.name()) + " "
                + (info.description() == null ? "" : info.description())).toLowerCase();
        for (String phrase : CHAT_EXCLUDED_PHRASES) {
            if (haystack.contains(phrase)) {
                return true;
            }
        }
        return false;
    }

    private synchronized void refreshModelSnapshotIfStale() {
        long now = System.currentTimeMillis();
        if (!cachedFreeModelInfos.isEmpty() && (now - lastModelFetchTime < CACHE_DURATION_MS)) {
            return;
        }
        // Vừa thử fetch gần đây (fail hoặc rỗng) thì không spam lại /models mỗi request chat.
        if (now - lastFetchAttemptTime < FAILED_FETCH_RETRY_MS) {
            return;
        }
        lastFetchAttemptTime = now;

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(OPENROUTER_MODELS_URL))
                    .GET()
                    .timeout(Duration.ofSeconds(10))
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(response.body());
                JsonNode dataNode = root.path("data");
                List<FreeModelInfo> freeModels = new ArrayList<>();
                Set<String> knownIds = new LinkedHashSet<>();

                if (dataNode.isArray()) {
                    for (JsonNode modelNode : dataNode) {
                        String id = modelNode.path("id").asText(null);
                        if (id == null || id.isBlank()) {
                            continue;
                        }
                        knownIds.add(id);
                        if (isFreePricing(modelNode.path("pricing"))) {
                            freeModels.add(new FreeModelInfo(
                                    id,
                                    modelNode.path("name").asText(""),
                                    modelNode.path("description").asText(""),
                                    modelNode.path("reasoning").path("mandatory").asBoolean(false),
                                    hasTextOutput(modelNode.path("architecture"))));
                        }
                    }
                }

                if (!freeModels.isEmpty()) {
                    cachedFreeModelInfos = List.copyOf(freeModels);
                    cachedKnownModelIds = Set.copyOf(knownIds);
                    lastModelFetchTime = now;
                    logger.info("Đã quét tự động và cập nhật " + freeModels.size()
                            + " model Free từ OpenRouter (biết tổng " + knownIds.size() + " IDs).");
                    return;
                }
                // /models trả 200 nhưng không parse được free nào: vẫn lưu known IDs
                // để isModelAlive() hoạt động, nhưng không reset timer về now hoàn toàn.
                if (!knownIds.isEmpty()) {
                    cachedKnownModelIds = Set.copyOf(knownIds);
                }
            }
        } catch (Exception e) {
            logger.warning("Lỗi tự động quét model Free từ OpenRouter: " + e.getMessage());
        }

        // Danh sách dự phòng cứng (toàn ID :free đã đối chiếu còn sống) khi /models sập
        // và chưa có cache nào. Không đụng tới known IDs ở đây.
        if (cachedFreeModelInfos.isEmpty()) {
            cachedFreeModelInfos = List.of(
                    new FreeModelInfo("google/gemma-4-31b-it:free", "", "", false, true),
                    new FreeModelInfo("thinkingmachines/inkling-small:free", "", "", false, true),
                    new FreeModelInfo("nvidia/nemotron-3.5-lightning:free", "", "", false, true),
                    new FreeModelInfo("inclusionai/ling-3.0-flash-sante:free", "", "", false, true),
                    new FreeModelInfo("nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free", "", "", false, true));
            logger.warning("Dùng backup cứng curated OpenRouter vì /models không khả dụng.");
        }
    }

    private static boolean isFreePricing(JsonNode pricing) {
        String promptPrice = pricing.path("prompt").asText("");
        String completionPrice = pricing.path("completion").asText("");
        return ("0".equals(promptPrice) || "0.0".equals(promptPrice))
                && ("0".equals(completionPrice) || "0.0".equals(completionPrice));
    }

    private static boolean hasTextOutput(JsonNode architecture) {
        JsonNode out = architecture.path("output_modalities");
        if (!out.isArray() || out.isEmpty()) {
            // Snapshot cũ không có trường này: mặc định coi là text để không drop oan.
            return true;
        }
        for (JsonNode m : out) {
            if ("text".equalsIgnoreCase(m.asText())) {
                return true;
            }
        }
        return false;
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
