package com.rexi.pkty.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rexi.pkty.dto.ChatMessage;
import org.springframework.beans.factory.annotation.Value;
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
import java.util.logging.Logger;

/**
 * Provider Kilo AI Gateway (ai-gateway.kilo.ai) — tương thích OpenAI.
 * Các model hậu tố ":free" KHÔNG cần API key (anonymous), dùng làm dự phòng
 * thay cho OpenRouter trong cascade chat/agent.
 */
@Service
public class KiloService {

    private static final Logger logger = Logger.getLogger(KiloService.class.getName());

    private static final String KILO_CHAT_URL = "https://ai-gateway.kilo.ai/api/v1/chat/completions";
    private static final String KILO_MODELS_URL = "https://ai-gateway.kilo.ai/api/v1/models";

    private static final long CACHE_DURATION_MS = 24 * 60 * 60 * 1000L;
    private static final long FAILED_FETCH_RETRY_MS = 5 * 60 * 1000L;

    /** Thứ tự ưu tiên model :free cho chat thường (đã đối chiếu live /models 05/11/2026). */
    private static final List<String> GENERAL_PREFERRED_FREE = List.of(
            "nvidia/nemotron-3.5-lightning:free",
            "nvidia/nemotron-3-ultra-550b-a55b:free",
            "dots-studio/dots-3-note-preview:free");

    /** Nhánh medical: ưu tiên reasoning/omni cho ca khó. */
    private static final List<String> MEDICAL_PREFERRED_FREE = List.of(
            "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
            "nvidia/nemotron-3-ultra-550b-a55b:free",
            "nvidia/nemotron-3.5-lightning:free");

    private static final List<String> STATIC_FALLBACK_GENERAL = List.of(
            "nvidia/nemotron-3.5-lightning:free",
            "nvidia/nemotron-3-ultra-550b-a55b:free",
            "dots-studio/dots-3-note-preview:free");

    private static final List<String> STATIC_FALLBACK_MEDICAL = List.of(
            "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
            "nvidia/nemotron-3-ultra-550b-a55b:free",
            "nvidia/nemotron-3.5-lightning:free");

    private static final List<String> CHAT_EXCLUDED_PHRASES = List.of(
            "coding agent", "agentic coding", "code model",
            "guardrail", "content safety", "content moderation");

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${kilo.api.key:}")
    private String apiKey;

    @Value("${kilo.model:nvidia/nemotron-3.5-lightning:free}")
    private String modelName;

    @Value("${kilo.medical.model:nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free}")
    private String medicalModelName;

    private final HttpClient client = HttpClient.newBuilder()
            .version(HttpClient.Version.HTTP_2)
            .connectTimeout(Duration.ofSeconds(6))
            .build();

    private static final long CONFIG_CACHE_TTL_MS = 30_000L;
    private final ConcurrentHashMap<String, CachedConfig> configCache = new ConcurrentHashMap<>();
    private record CachedConfig(String value, long expiresAtMs) {}

    private volatile List<FreeModelInfo> cachedFreeModelInfos = List.of();
    private volatile Set<String> cachedKnownModelIds = Set.of();
    private volatile long lastModelFetchTime = 0;
    private volatile long lastFetchAttemptTime = 0;

    static record FreeModelInfo(String id, String name, String description, boolean reasoningMandatory, boolean textOutput) {}

    public KiloService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public String getMedicalModelName() {
        return getCachedConfig("kilo_medical_model", medicalModelName);
    }

    public String getModelName() {
        return getCachedConfig("kilo_model", modelName);
    }

    private String getCachedConfig(String configName, String fallback) {
        long now = System.currentTimeMillis();
        CachedConfig cached = configCache.get(configName);
        if (cached != null && cached.expiresAtMs() > now) {
            return cached.value();
        }
        String value = fallback;
        try {
            String dbValue = jdbcTemplate.queryForObject(
                    "SELECT gia_tri FROM CauHinhHeThong WHERE ten_cau_hinh = ?",
                    String.class, configName);
            if (dbValue != null && !dbValue.trim().isEmpty()) {
                value = dbValue.trim();
            }
        } catch (Exception ignored) {
        }
        configCache.put(configName, new CachedConfig(value, now + CONFIG_CACHE_TTL_MS));
        return value;
    }

    private String getApiKey() {
        try {
            String dbKey = jdbcTemplate.queryForObject(
                    "SELECT gia_tri FROM CauHinhHeThong WHERE ten_cau_hinh = 'kilo_api_key'",
                    String.class);
            if (dbKey != null && !dbKey.isBlank()) {
                return dbKey.trim();
            }
        } catch (Exception ignored) {
        }
        return apiKey == null ? "" : apiKey.trim();
    }

    public String chat(List<ChatMessage> history) throws Exception {
        return chat(history, false);
    }

    public String chat(List<ChatMessage> history, boolean isMedical) throws Exception {
        List<Map<String, Object>> messagesForApi = new ArrayList<>();
        for (ChatMessage msg : history) {
            String content = msg.getContent() != null && !msg.getContent().isBlank() ? msg.getContent() : "";
            if (!content.isBlank()) {
                messagesForApi.add(Map.of("role", msg.getRole(), "content", content));
            }
        }
        if (messagesForApi.isEmpty()) {
            throw new RuntimeException("Kilo: không có nội dung để gửi.");
        }

        Exception lastException = null;
        for (String candidateModel : getCandidateModels(isMedical)) {
            try {
                HttpResponse<String> response = callKilo(candidateModel, messagesForApi);
                if (response.statusCode() == 200) {
                    return parseKiloReply(response.body());
                }
                RuntimeException apiException = new RuntimeException(
                        "Kilo API Error " + response.statusCode() + ": " + response.body());
                lastException = apiException;
                if (!shouldTryNextModel(response.statusCode(), response.body())) {
                    throw apiException;
                }
                logger.warning("Kilo model '" + candidateModel + "' lỗi, thử model tiếp theo. status="
                        + response.statusCode());
            } catch (Exception e) {
                lastException = e;
                if (!shouldTryNextModel(e)) {
                    throw e;
                }
                logger.warning("Kilo model '" + candidateModel + "' không khả dụng, thử tiếp theo. error="
                        + e.getMessage());
            }
        }
        throw new RuntimeException("Tất cả model Kilo :free đều không khả dụng: "
                + (lastException != null ? lastException.getMessage() : "không rõ lỗi"));
    }

    private List<String> getCandidateModels(boolean isMedical) {
        Set<String> models = new LinkedHashSet<>();
        String configured = isMedical ? getMedicalModelName() : getModelName();
        if (configured != null && !configured.trim().isEmpty()) {
            String trimmed = configured.trim();
            if (isModelAlive(trimmed)) {
                models.add(trimmed);
            } else {
                logger.warning("Kilo configured model '" + trimmed
                        + "' không còn trong live /models, bỏ qua và dùng dynamic curated.");
            }
        }
        models.addAll(getCuratedDynamicModels(isMedical));
        models.addAll(isMedical ? STATIC_FALLBACK_MEDICAL : STATIC_FALLBACK_GENERAL);
        return new ArrayList<>(models);
    }

    private List<String> getCuratedDynamicModels(boolean isMedical) {
        refreshModelSnapshotIfStale();
        List<FreeModelInfo> snapshot = cachedFreeModelInfos;
        if (snapshot.isEmpty()) {
            return List.of();
        }
        return curateFreeModels(snapshot, isMedical);
    }

    private boolean isModelAlive(String modelId) {
        refreshModelSnapshotIfStale();
        Set<String> known = cachedKnownModelIds;
        if (known.isEmpty()) {
            return true;
        }
        return known.contains(modelId);
    }

    static List<String> curateFreeModels(List<FreeModelInfo> all, boolean isMedical) {
        Set<String> aliveIds = new LinkedHashSet<>();
        for (FreeModelInfo info : all) {
            if (info != null && info.id() != null && !info.id().isBlank()) {
                aliveIds.add(info.id());
            }
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

    /** Quét chủ động (scheduler gọi): reset timer rồi refresh snapshot /models. */
    public boolean forceModelScan() {
        lastModelFetchTime = 0L;
        lastFetchAttemptTime = 0L;
        refreshModelSnapshotIfStale();
        return !cachedFreeModelInfos.isEmpty();
    }

    /** Gợi ý tối đa 5 model :free còn sống theo snapshot gần nhất (cho /api/system/ai-provider/test). */
    public List<String> getLiveTextModelSuggestions() {
        refreshModelSnapshotIfStale();
        return cachedFreeModelInfos.stream().map(FreeModelInfo::id).limit(5).toList();
    }

    private synchronized void refreshModelSnapshotIfStale() {
        long now = System.currentTimeMillis();
        if (!cachedFreeModelInfos.isEmpty() && (now - lastModelFetchTime < CACHE_DURATION_MS)) {
            return;
        }
        if (now - lastFetchAttemptTime < FAILED_FETCH_RETRY_MS) {
            return;
        }
        lastFetchAttemptTime = now;

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(KILO_MODELS_URL))
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
                        if (id.endsWith(":free")) {
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
                            + " model :free từ Kilo Gateway (biết tổng " + knownIds.size() + " IDs).");
                    return;
                }
                if (!knownIds.isEmpty()) {
                    cachedKnownModelIds = Set.copyOf(knownIds);
                }
            }
        } catch (Exception e) {
            logger.warning("Lỗi tự động quét model :free từ Kilo: " + e.getMessage());
        }

        if (cachedFreeModelInfos.isEmpty()) {
            List<FreeModelInfo> fallback = new ArrayList<>();
            for (String id : STATIC_FALLBACK_GENERAL) {
                fallback.add(new FreeModelInfo(id, "", "", false, true));
            }
            fallback.add(new FreeModelInfo(MEDICAL_PREFERRED_FREE.get(0), "", "", false, true));
            cachedFreeModelInfos = List.copyOf(fallback);
            logger.warning("Dùng backup cứng curated Kilo vì /models không khả dụng.");
        }
    }

    private static boolean hasTextOutput(JsonNode architecture) {
        JsonNode out = architecture.path("output_modalities");
        if (!out.isArray() || out.isEmpty()) {
            return true;
        }
        for (JsonNode m : out) {
            if ("text".equalsIgnoreCase(m.asText())) {
                return true;
            }
        }
        return false;
    }

    private HttpResponse<String> callKilo(String model, List<Map<String, Object>> messagesForApi) throws Exception {
        Map<String, Object> requestBodyMap = Map.of(
                "model", model,
                "messages", messagesForApi,
                "max_tokens", 2000,
                "temperature", 0.35);
        String requestBody = objectMapper.writeValueAsString(requestBodyMap);

        String key = getApiKey();
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(KILO_CHAT_URL))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8))
                .timeout(Duration.ofSeconds(45));
        if (!key.isBlank()) {
            builder.header("Authorization", "Bearer " + key);
        }
        return client.send(builder.build(), HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
    }

    private String parseKiloReply(String responseBody) throws Exception {
        JsonNode rootNode = objectMapper.readTree(responseBody);
        try {
            return rootNode.path("choices").get(0).path("message").path("content").asText();
        } catch (Exception e) {
            logger.severe("Lỗi parse phản hồi từ Kilo. Nội dung: " + responseBody);
            throw new RuntimeException("Lỗi Parse Kilo: " + responseBody);
        }
    }

    private boolean shouldTryNextModel(int statusCode, String responseBody) {
        String body = responseBody == null ? "" : responseBody.toLowerCase();
        return statusCode == 400 || statusCode == 402 || statusCode == 404 || statusCode == 408
                || statusCode == 409 || statusCode == 429 || statusCode >= 500
                || body.contains("rate-limited") || body.contains("no endpoints")
                || body.contains("insufficient_quota") || body.contains("not a valid model");
    }

    private boolean shouldTryNextModel(Exception e) {
        String message = e.getMessage() == null ? "" : e.getMessage().toLowerCase();
        return message.contains("timeout") || message.contains("timed out") || message.contains("rate")
                || message.contains("quota") || message.contains("402") || message.contains("404")
                || message.contains("429") || message.contains("500") || message.contains("502")
                || message.contains("503") || message.contains("504") || message.contains("no endpoints")
                || message.contains("not a valid model");
    }
}
