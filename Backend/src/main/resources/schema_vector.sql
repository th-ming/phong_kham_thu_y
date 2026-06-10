-- ============================================
-- VECTOR SEARCH: pgvector extension + embeddings
-- ============================================
-- Enable pgvector extension (PostgreSQL only)
-- Run this manually on PostgreSQL/Supabase:
--   psql -U postgres -d PhongKhamThuY -f schema_vector.sql

CREATE EXTENSION IF NOT EXISTS vector;

-- Drop table if exists for idempotency
DROP TABLE IF EXISTS knowledge_embeddings CASCADE;

CREATE TABLE knowledge_embeddings (
    id              SERIAL PRIMARY KEY,
    chunk_hash      VARCHAR(64) NOT NULL UNIQUE,   -- SHA-256 of the chunk text for dedup
    file_name       VARCHAR(255) NOT NULL,          -- e.g. "benh_cho_meo.md"
    chunk_index     INT NOT NULL,                   -- sequential index within the file
    chunk_text      TEXT NOT NULL,                   -- the actual text content
    embedding       vector(768) NOT NULL,            -- Gemini text-embedding-004 produces 768-dim vectors
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for cosine similarity search
CREATE INDEX idx_knowledge_embeddings_vector ON knowledge_embeddings 
    USING ivfflat (embedding vector_cosine_ops) 
    WITH (lists = 100);

-- Index for filename lookups
CREATE INDEX idx_knowledge_embeddings_file ON knowledge_embeddings (file_name);

-- Index for text dedup
CREATE INDEX idx_knowledge_embeddings_hash ON knowledge_embeddings (chunk_hash);
