package com.rexi.pkty.service;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.io.File;
import java.io.IOException;
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
            Path knowledgePath = Paths.get(KNOWLEDGE_DIR);
            File dir = knowledgePath.toFile();
            if (!dir.exists() || !dir.isDirectory()) {
                logger.info("[KnowledgeIndexer] Knowledge directory not found: " + KNOWLEDGE_DIR);
                indexingComplete = true;
                return;
            }

            Set<String> alreadyIndexed = vectorKnowledgeService.getIndexedFiles();
            List<File> filesToIndex = new ArrayList<>();

            File[] files = dir.listFiles((f, name) -> name.endsWith(".md"));
            if (files == null) {
                indexingComplete = true;
                return;
            }

            for (File file : files) {
                if (!alreadyIndexed.contains(file.getName())) {
                    filesToIndex.add(file);
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
            for (File file : filesToIndex) {
                try {
                    String content = Files.readString(file.toPath());
                    int chunks = vectorKnowledgeService.indexDocument(file.getName(), content);
                    totalIndexed += chunks;
                    logger.info("[KnowledgeIndexer] Indexed " + file.getName() +
                            " -> " + chunks + " chunks");
                } catch (IOException e) {
                    logger.warning("[KnowledgeIndexer] Failed to read " + file.getName() +
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
     * Trigger a manual reindex of all files.
     */
    public int reindexAll() {
        if (vectorKnowledgeService == null || !vectorKnowledgeService.isVectorSearchAvailable()) {
            logger.warning("[KnowledgeIndexer] Cannot reindex: vector search not available");
            return 0;
        }

        try {
            Path knowledgePath = Paths.get(KNOWLEDGE_DIR);
            File dir = knowledgePath.toFile();
            if (!dir.exists() || !dir.isDirectory()) {
                logger.warning("[KnowledgeIndexer] Knowledge directory not found");
                return 0;
            }

            Map<String, String> documents = new LinkedHashMap<>();
            File[] files = dir.listFiles((f, name) -> name.endsWith(".md"));
            if (files != null) {
                for (File file : files) {
                    try {
                        documents.put(file.getName(), Files.readString(file.toPath()));
                    } catch (IOException e) {
                        logger.warning("[KnowledgeIndexer] Failed to read " + file.getName());
                    }
                }
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
