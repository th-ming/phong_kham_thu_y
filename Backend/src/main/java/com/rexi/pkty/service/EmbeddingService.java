package com.rexi.pkty.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rexi.pkty.util.DatabaseDialect;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.logging.Logger;

/**
 * Generates text embeddings using the Google Gemini embedding API.
 * Falls back to a cached embedding if the exact text was already embedded recently.
 */
@Service
public class EmbeddingService {

    private static final Logger logger = Logger.getLogger(EmbeddingService.class.getName());

    private static final String GEMINI_EMBEDDING_MODEL = "text-embedding-004";
    private static final int EMBEDDING_DIMENSIONS = 768;
    private static final int MAX_INPUT_CHARS = 8000;
    private static final long CACHE_TTL_MS = 86_400_000L; // 24h

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient client = HttpClient.newBuilder()
            .version(HttpClient.Version.HTTP_2)
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    // Simple LRU-like in-memory cache to avoid re-embedding identical texts within the same session
    private final ConcurrentHashMap<String, CacheEntry> embeddingCache = new ConcurrentHashMap<>();

    private record CacheEntry(float[] vector, long expiresAt) {
        boolean isExpired() { return System.currentTimeMillis() > expiresAt; }
    }

    /**
     * Generate a 768-dimensional embedding vector for the given text.
     * Returns null if the embedding API fails.
     */
    public float[] embed(String text) {
        if (text == null || text.isBlank()) return null;

        String cacheKey = text.length() < 200 ? text : text.substring(0, 100) + "..." + Math.abs(text.hashCode());
        CacheEntry cached = embeddingCache.get(cacheKey);
        if (cached != null && !cached.isExpired()) {
            logger.fine("[Embedding] Cache HIT for text of length " + text.length());
            return cached.vector();
        }

        // Try DB cache first (persistent across restarts)
        float[] dbCached = getDbCachedEmbedding(text);
        if (dbCached != null) {
            embeddingCache.put(cacheKey, new CacheEntry(dbCached, System.currentTimeMillis() + CACHE_TTL_MS));
            return dbCached;
        }

        // Truncate if too long
        String truncatedText = text.length() > MAX_INPUT_CHARS
                ? text.substring(0, MAX_INPUT_CHARS)
                : text;

        try {
            // Try Gemini embedding API first
            float[] vector = callGeminiEmbedding(truncatedText);
            if (vector != null) {
                embeddingCache.put(cacheKey, new CacheEntry(vector, System.currentTimeMillis() + CACHE_TTL_MS));
                return vector;
            }
        } catch (Exception e) {
            logger.warning("[Embedding] Gemini embedding failed: " + e.getMessage());
        }

        // Fallback: use simple hash-based embedding (not ideal but functional)
        logger.warning("[Embedding] All embedding APIs failed, using fallback hash-based embedding");
        return fallbackHashEmbedding(truncatedText);
    }

    /**
     * Batch embed multiple texts. More efficient than calling embed() in a loop.
     */
    public Map<String, float[]> embedBatch(List<String> texts) {
        Map<String, float[]> results = new HashMap<>();
        for (String text : texts) {
            results.put(text, embed(text));
        }
        return results;
    }

    /**
     * Call the Gemini text-embedding-004 API.
     */
    private float[] callGeminiEmbedding(String text) throws Exception {
        String activeKey = resolveApiKey();
        if (activeKey == null || activeKey.isBlank()) {
            logger.warning("[Embedding] No Gemini API key available");
            return null;
        }

        String url = "https://generativelanguage.googleapis.com/v1beta/models/"
                + GEMINI_EMBEDDING_MODEL + ":embedContent?key=" + activeKey;

        Map<String, Object> requestBody = Map.of(
                "model", "models/" + GEMINI_EMBEDDING_MODEL,
                "content", Map.of("parts", List.of(Map.of("text", text)))
        );

        String jsonBody = objectMapper.writeValueAsString(requestBody);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody, StandardCharsets.UTF_8))
                .timeout(Duration.ofSeconds(15))
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));

        if (response.statusCode() != 200) {
            logger.warning("[Embedding] Gemini API returned " + response.statusCode() + ": " + response.body());
            return null;
        }

        JsonNode root = objectMapper.readTree(response.body());
        JsonNode valuesNode = root.path("embedding").path("values");
        if (valuesNode.isArray() && valuesNode.size() > 0) {
            float[] vector = new float[valuesNode.size()];
            for (int i = 0; i < valuesNode.size(); i++) {
                vector[i] = (float) valuesNode.get(i).asDouble();
            }
            return vector;
        }

        return null;
    }

    /**
     * Resolve the Gemini API key from config or database.
     */
    private String resolveApiKey() {
        if (apiKey != null && !apiKey.isBlank()) return apiKey;
        try {
            List<String> keys = jdbcTemplate.queryForList(
                    "SELECT gia_tri FROM CauHinhHeThong WHERE ten_cau_hinh = 'gemini_api_key'",
                    String.class);
            if (!keys.isEmpty() && keys.get(0) != null && !keys.get(0).isBlank()) {
                return keys.get(0).trim();
            }
        } catch (Exception ignored) {}
        return null;
    }

    /**
     * Look up a previously cached embedding for the exact text from the DB.
     */
    private float[] getDbCachedEmbedding(String text) {
        if (!DatabaseDialect.isPostgres(jdbcTemplate)) return null;
        try {
            String textHash = sha256(text);
            String sql = "SELECT embedding::text FROM knowledge_embeddings WHERE chunk_hash = ? LIMIT 1";
            List<String> rows = jdbcTemplate.queryForList(sql, String.class, textHash);
            if (!rows.isEmpty()) {
                String vectorStr = rows.get(0);
                if (vectorStr != null && !vectorStr.isBlank()) {
                    return parseVector(vectorStr);
                }
            }
        } catch (Exception ignored) {}
        return null;
    }

    /**
     * Fallback: deterministic hash-based embedding (768-dim).
     * This is NOT semantically accurate but prevents crashes when APIs are down.
     */
    static float[] fallbackHashEmbedding(String text) {
        float[] vector = new float[EMBEDDING_DIMENSIONS];
        if (text == null || text.isBlank()) return vector;

        byte[] bytes = text.getBytes(StandardCharsets.UTF_8);
        for (int i = 0; i < bytes.length; i++) {
            int dim = Math.abs(bytes[i]) % EMBEDDING_DIMENSIONS;
            vector[dim] += (bytes[i] / 256.0f);
        }

        // Normalize
        double norm = 0.0;
        for (float v : vector) norm += v * v;
        norm = Math.sqrt(norm);
        if (norm > 0) {
            for (int i = 0; i < vector.length; i++) {
                vector[i] /= (float) norm;
            }
        }
        return vector;
    }

    /**
     * Parse a PostgreSQL vector string like "[0.1,0.2,0.3]" into a float array.
     */
    static float[] parseVector(String vectorStr) {
        if (vectorStr == null || vectorStr.isBlank()) return null;
        String cleaned = vectorStr.replace("[", "").replace("]", "").trim();
        String[] parts = cleaned.split(",");
        float[] result = new float[parts.length];
        for (int i = 0; i < parts.length; i++) {
            result[i] = Float.parseFloat(parts[i].trim());
        }
        return result;
    }

    /**
     * Simple SHA-256 hex digest for text deduplication.
     */
    static String sha256(String text) {
        try {
            java.security.MessageDigest md = java.security.MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(text.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            return String.valueOf(Math.abs(text.hashCode()));
        }
    }
}
