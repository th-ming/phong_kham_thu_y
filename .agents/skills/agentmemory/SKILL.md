---
name: agentmemory
description: >
  #1 persistent memory for AI coding agents. Works with Claude Code, Cursor,
  Gemini CLI, OpenCode, Hermes, and any MCP client. 95.2% retrieval R@5,
  92% fewer tokens. BM25 + vector + knowledge graph hybrid search.
  Zero external databases (SQLite + iii engine).
allowed-tools: Read, WebFetch, WebSearch
---

# AgentMemory — Persistent Memory for AI Coding Agents

Your coding agent remembers everything across sessions. No more re-explaining.

## Quick Start

```bash
npm install -g @agentmemory/agentmemory
agentmemory                           # Start server on :3111
agentmemory connect opencode          # Wire MCP into agent
```

## Key Features

- **Auto-capture** — 12 lifecycle hooks, zero manual effort
- **Hybrid search** — BM25 + vector + knowledge graph (RRF fusion)
- **95.2% retrieval R@5** — LongMemEval benchmark
- **~1,900 tokens/session** — 92% less than built-in memory
- **53 MCP tools** — memory_save, memory_recall, memory_smart_search, etc.
- **Real-time viewer** — knowledge graph viz on port 3113
- **Multi-agent** — shared memory across Claude Code, Cursor, OpenCode, etc.
- **Zero external DBs** — SQLite + iii engine, no Postgres/Redis

## Memory Pipeline

1. **Capture** — PostToolUse hook → SHA-256 dedup → Privacy filter
2. **Store** — Raw observation → LLM compress → structured facts
3. **Index** — BM25 + vector embedding + knowledge graph
4. **Recall** — SessionStart → hybrid search → top-K injection

## Comparison

| Feature | agentmemory | Built-in (CLAUDE.md) |
|---------|-------------|---------------------|
| Scale | Unlimited | 200-line cap |
| Search | BM25 + vector + graph | Load all into context |
| Token cost | ~1,900/session | 22K+ at 240 obs |
| Cross-agent | MCP + REST | Per-agent files |
| Coordination | Leases, signals, routines | None |

## Key Facts

- GitHub: https://github.com/rohitg00/agentmemory
- npm: `@agentmemory/agentmemory`
- 25K+ GitHub stars
- Apache-2.0 License
