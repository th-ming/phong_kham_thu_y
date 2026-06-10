package com.rexi.pkty.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import com.rexi.pkty.util.DatabaseDialect;

import java.util.*;
import java.util.logging.Logger;
import java.util.stream.Collectors;

/**
 * Vector-aware knowledge search service.
 * <p>
 * Uses pgvector (PostgreSQL) to store and search embeddings of veterinary knowledge documents.
 * Falls back to keyword search when vector search is unavailable or returns no results.
 */
@Service
public class VectorKnowledgeService {

    private static final Logger logger = Logger.getLogger(VectorKnowledgeService.class.getName());

    private static final int MAX_RESULTS = 4;
    private static final double MIN_SIMILARITY = 0.45;
    private static final int MAX_CHUNK_LENGTH = 1800;
    private static final int CHUNK_SIZE = 800;     // characters per chunk
    private static final int CHUNK_OVERLAP = 150;   // overlap between chunks

    @Autowired(required = false)
    private EmbeddingService embeddingService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Search the knowledge base using vector similarity.
     * Returns up to MAX_RESULTS matching chunks with their source file names.
     */
    public List<KnowledgeHit> search(String query) {
        if (query == null || query.trim().length() < 4) return List.of();

        // 1. Check if pgvector is available
        if (!isVectorSearchAvailable()) {
            logger.fine("[VectorKnowledge] pgvector not available, returning empty");
            return List.of();
        }

        // 2. Generate embedding for the query
        float[] queryVector = embeddingService != null
                ? embeddingService.embed(query)
                : EmbeddingService.fallbackHashEmbedding(query);

        if (queryVector == null) {
            logger.warning("[VectorKnowledge] Failed to generate query embedding");
            return List.of();
        }

        // 3. Search by cosine similarity
        try {
            return searchByVector(queryVector);
        } catch (Exception e) {
            logger.warning("[VectorKnowledge] Vector search failed: " + e.getMessage());
            return List.of();
        }
    }

    /**
     * Search by vector similarity using pgvector's <=> (cosine distance) operator.
     */
    private List<KnowledgeHit> searchByVector(float[] queryVector) {
        // pgvector accepts format "[0.1, 0.2, 0.3]" directly from Arrays.toString()
        String vectorStr = Arrays.toString(queryVector);

        // Use cosine distance (<=>): lower distance = more similar
        String sql = "SELECT file_name, chunk_text, " +
                     "  (embedding <=> ?::vector) AS distance " +
                     "FROM knowledge_embeddings " +
                     "WHERE (embedding <=> ?::vector) < ? " +
                     "ORDER BY distance ASC " +
                     "LIMIT ?";

        double maxDistance = 1.0 - MIN_SIMILARITY; // convert similarity threshold to distance

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                sql,
                vectorStr,
                vectorStr,
                maxDistance,
                MAX_RESULTS
        );

        if (rows.isEmpty()) {
            logger.fine("[VectorKnowledge] No vector matches found");
            return List.of();
        }

        List<KnowledgeHit> results = new ArrayList<>();
        for (Map<String, Object> row : rows) {
            double distance = row.get("distance") instanceof Number
                    ? ((Number) row.get("distance")).doubleValue()
                    : 1.0;
            double similarity = 1.0 - distance;

            results.add(new KnowledgeHit(
                    Objects.toString(row.get("file_name"), "unknown.md"),
                    Objects.toString(row.get("chunk_text"), ""),
                    similarity
            ));
        }

        results.sort(Comparator.comparingDouble(KnowledgeHit::similarity).reversed());
        return results;
    }

    /**
     * Index a document: chunk it, generate embeddings, store in pgvector.
     */
    public int indexDocument(String fileName, String content) {
        if (content == null || content.isBlank()) return 0;
        if (!DatabaseDialect.isPostgres(jdbcTemplate)) return 0;

        List<String> chunks = chunkDocument(content);
        int indexed = 0;

        for (int i = 0; i < chunks.size(); i++) {
            String chunk = chunks.get(i);
            String chunkHash = EmbeddingService.sha256(chunk);

            // Skip if already indexed (dedup by hash)
            if (isChunkIndexed(chunkHash)) {
                indexed++;
                continue;
            }

            float[] embedding = embeddingService != null
                    ? embeddingService.embed(chunk)
                    : EmbeddingService.fallbackHashEmbedding(chunk);

            if (embedding == null) continue;

            try {
                String vectorStr = Arrays.toString(embedding);

                jdbcTemplate.update(
                        "INSERT INTO knowledge_embeddings " +
                        "(chunk_hash, file_name, chunk_index, chunk_text, embedding) " +
                        "VALUES (?, ?, ?, ?, ?::vector) " +
                        "ON CONFLICT (chunk_hash) DO NOTHING",
                        chunkHash,
                        fileName,
                        i,
                        chunk,
                        vectorStr
                );
                indexed++;
            } catch (Exception e) {
                logger.warning("[VectorKnowledge] Failed to index chunk " + i +
                        " of " + fileName + ": " + e.getMessage());
            }
        }

        logger.info("[VectorKnowledge] Indexed " + indexed + "/" + chunks.size() +
                " chunks for " + fileName);
        return indexed;
    }

    /**
     * Remove all embeddings for a given file.
     */
    public void removeDocument(String fileName) {
        try {
            int deleted = jdbcTemplate.update(
                    "DELETE FROM knowledge_embeddings WHERE file_name = ?",
                    fileName);
            logger.info("[VectorKnowledge] Removed " + deleted +
                    " embeddings for " + fileName);
        } catch (Exception e) {
            logger.warning("[VectorKnowledge] Failed to remove " + fileName + ": " + e.getMessage());
        }
    }

    /**
     * Delete all embeddings and re-index from scratch.
     */
    public void reindexAll(Map<String, String> documents) {
        try {
            jdbcTemplate.update("DELETE FROM knowledge_embeddings");
            logger.info("[VectorKnowledge] Cleared all embeddings");
        } catch (Exception e) {
            logger.warning("[VectorKnowledge] Failed to clear embeddings: " + e.getMessage());
        }

        for (Map.Entry<String, String> entry : documents.entrySet()) {
            indexDocument(entry.getKey(), entry.getValue());
        }

        logger.info("[VectorKnowledge] Reindexed " + documents.size() + " documents");
    }

    /**
     * Get the total number of indexed chunks.
     */
    public int getIndexedChunkCount() {
        try {
            Integer count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM knowledge_embeddings", Integer.class);
            return count != null ? count : 0;
        } catch (Exception e) {
            return 0;
        }
    }

    /**
     * Check if vector search is available (pgvector extension + table exist).
     */
    public boolean isVectorSearchAvailable() {
        try {
            jdbcTemplate.queryForObject(
                    "SELECT 1 FROM pg_extension WHERE extname = 'vector'",
                    Integer.class);
            // Also check table exists
            jdbcTemplate.queryForObject(
                    "SELECT 1 FROM information_schema.tables " +
                    "WHERE table_name = 'knowledge_embeddings'",
                    Integer.class);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Get the list of indexed file names.
     */
    public Set<String> getIndexedFiles() {
        try {
            List<String> files = jdbcTemplate.queryForList(
                    "SELECT DISTINCT file_name FROM knowledge_embeddings ORDER BY file_name",
                    String.class);
            return new LinkedHashSet<>(files);
        } catch (Exception e) {
            return Set.of();
        }
    }

    // ---- Internal helpers ----

    /**
     * Check if a chunk hash is already indexed.
     */
    private boolean isChunkIndexed(String chunkHash) {
        try {
            Integer count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM knowledge_embeddings WHERE chunk_hash = ?",
                    Integer.class, chunkHash);
            return count != null && count > 0;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Split a document into overlapping chunks.
     * Chunks are split at sentence boundaries when possible.
     */
    static List<String> chunkDocument(String content) {
        if (content == null || content.isBlank()) return List.of();

        List<String> chunks = new ArrayList<>();
        int start = 0;
        int chunkIndex = 0;

        while (start < content.length()) {
            int end = Math.min(start + CHUNK_SIZE, content.length());

            // Try to break at a sentence boundary
            if (end < content.length()) {
                int sentenceEnd = findSentenceBoundary(content, end, CHUNK_OVERLAP);
                if (sentenceEnd > start) {
                    end = sentenceEnd;
                }
            }

            String chunk = content.substring(start, end).trim();
            if (!chunk.isBlank()) {
                chunks.add(chunk);
                chunkIndex++;
            }

            start = end - (end < content.length() ? CHUNK_OVERLAP : 0);
            if (start >= content.length() || start >= end) break;
        }

        // If the document is short, keep it as one chunk
        if (chunks.isEmpty() && !content.isBlank()) {
            chunks.add(content.trim());
        }

        return chunks;
    }

    /**
     * Find the nearest sentence boundary (., !, ?, \n) near the target position.
     */
    private static int findSentenceBoundary(String text, int target, int lookAhead) {
        int end = Math.min(target + lookAhead, text.length());
        int bestBreak = -1;

        for (int i = target; i < end; i++) {
            char c = text.charAt(i);
            if (c == '\n' && i + 1 < end) {
                bestBreak = i + 1;
                break; // Prefer newline breaks
            }
            if (c == '.' || c == '!' || c == '?') {
                bestBreak = i + 1;
            }
        }

        // If no sentence boundary found, try word boundary
        if (bestBreak < 0) {
            for (int i = target; i < end; i++) {
                if (Character.isWhitespace(text.charAt(i))) {
                    bestBreak = i;
                    break;
                }
            }
        }

        return bestBreak > target ? bestBreak : target;
    }

    // ---- DTO ----

    public record KnowledgeHit(String fileName, String snippet, double similarity) {}
}
