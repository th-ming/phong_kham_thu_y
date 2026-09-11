package com.rexi.pkty.service;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.logging.Logger;
import java.util.stream.Collectors;

/**
 * Indexes all knowledge markdown files into pgvector on startup.
 * <p>
 * Only runs when vector search is available (PostgreSQL + pgvector).
 * Skips files that have already been indexed (by filename).
 */
@Service
@ConditionalOnProperty(name = "app.vector-index.enabled", havingValue = "true", matchIfMissing = true)
public class KnowledgeIndexer {

    private static final Logger logger = Logger.getLogger(KnowledgeIndexer.class.getName());

    private static final String KNOWLEDGE_DIR = "src/main/resources/knowledge";

    @Autowired(required = false)
    private VectorKnowledgeService vectorKnowledgeService;

    private volatile boolean indexingComplete = false;

    @PostConstruct
    public void init() {
        // Run async to not block startup
        Thread indexer = new Thread(this::indexAllFiles, "knowledge-indexer");
        indexer.setDaemon(true);
        indexer.start();
    }

    /**
     * Index all .md knowledge files that haven't been indexed yet.
     */
    public void indexAllFiles() {
        if (vectorKnowledgeService == null) {
            logger.info("[KnowledgeIndexer] VectorKnowledgeService not available, skipping index");
            indexingComplete = true;
            return;
        }

        if (!vectorKnowledgeService.isVectorSearchAvailable()) {
            logger.info("[KnowledgeIndexer] pgvector not available on this database, skipping index");
            indexingComplete = true;
            return;
        }

        try {
            Map<String, String> documents = loadKnowledgeDocuments();
            if (documents.isEmpty()) {
                logger.info("[KnowledgeIndexer] No knowledge documents found (filesystem or classpath)");
                indexingComplete = true;
                return;
            }

            Set<String> alreadyIndexed = vectorKnowledgeService.getIndexedFiles();

            Map<String, String> filesToIndex = new LinkedHashMap<>();
            for (Map.Entry<String, String> entry : documents.entrySet()) {
                if (!alreadyIndexed.contains(entry.getKey())) {
                    filesToIndex.put(entry.getKey(), entry.getValue());
                }
            }

            if (filesToIndex.isEmpty()) {
                int totalChunks = vectorKnowledgeService.getIndexedChunkCount();
                logger.info("[KnowledgeIndexer] All " + alreadyIndexed.size() +
                        " knowledge files already indexed (" + totalChunks + " chunks)");
                indexingComplete = true;
                return;
            }

            logger.info("[KnowledgeIndexer] Starting index of " + filesToIndex.size() +
                    " new knowledge files...");

            int totalIndexed = 0;
            for (Map.Entry<String, String> entry : filesToIndex.entrySet()) {
                try {
                    int chunks = vectorKnowledgeService.indexDocument(entry.getKey(), entry.getValue());
                    totalIndexed += chunks;
                    logger.info("[KnowledgeIndexer] Indexed " + entry.getKey() +
                            " -> " + chunks + " chunks");
                } catch (Exception e) {
                    logger.warning("[KnowledgeIndexer] Failed to read " + entry.getKey() +
                            ": " + e.getMessage());
                }
            }

            int finalTotal = vectorKnowledgeService.getIndexedChunkCount();
            logger.info("[KnowledgeIndexer] Index complete: indexed " + totalIndexed +
                    " new chunks, total " + finalTotal + " chunks across " +
                    vectorKnowledgeService.getIndexedFiles().size() + " files");

        } catch (Exception e) {
            logger.severe("[KnowledgeIndexer] Index failed: " + e.getMessage());
        } finally {
            indexingComplete = true;
        }
    }

    /**
     * Check if the initial indexing has completed.
     */
    public boolean isIndexingComplete() {
        return indexingComplete;
    }

    /**
     * Load knowledge .md documents với tên file làm key.
     * Ưu tiên classpath (hoạt động cả khi chạy từ jar/Docker), fallback filesystem (dev).
     */
    private Map<String, String> loadKnowledgeDocuments() {
        Map<String, String> documents = new LinkedHashMap<>();
        try {
            Resource[] resources = new PathMatchingResourcePatternResolver()
                    .getResources("classpath*:knowledge/*.md");
            for (Resource resource : resources) {
                String name = resource.getFilename();
                if (name == null || !name.endsWith(".md")) continue;
                try (InputStream in = resource.getInputStream()) {
                    documents.put(name, new String(in.readAllBytes(), StandardCharsets.UTF_8));
                }
            }
        } catch (IOException e) {
            logger.warning("[KnowledgeIndexer] Cannot read knowledge from classpath: " + e.getMessage());
        }
        if (!documents.isEmpty()) return documents;

        Path knowledgePath = Paths.get(KNOWLEDGE_DIR);
        File dir = knowledgePath.toFile();
        if (dir.exists() && dir.isDirectory()) {
            File[] files = dir.listFiles((f, name) -> name.endsWith(".md"));
            if (files != null) {
                for (File file : files) {
                    try {
                        documents.put(file.getName(), Files.readString(file.toPath()));
                    } catch (IOException e) {
                        logger.warning("[KnowledgeIndexer] Failed to read " + file.getName() +
                                ": " + e.getMessage());
                    }
                }
            }
        }
        return documents;
    }

    /**
     * Trigger a manual reindex of all files.
     */
    public int reindexAll() {
        if (vectorKnowledgeService == null || !vectorKnowledgeService.isVectorSearchAvailable()) {
            logger.warning("[KnowledgeIndexer] Cannot reindex: vector search not available");
            return 0;
        }

        try {
            Map<String, String> documents = loadKnowledgeDocuments();
            if (documents.isEmpty()) {
                logger.warning("[KnowledgeIndexer] Knowledge directory not found");
                return 0;
            }

            vectorKnowledgeService.reindexAll(documents);
            int total = vectorKnowledgeService.getIndexedChunkCount();
            logger.info("[KnowledgeIndexer] Reindex complete: " + total + " chunks");
            return total;

        } catch (Exception e) {
            logger.severe("[KnowledgeIndexer] Reindex failed: " + e.getMessage());
            return 0;
        }
    }
}
