---
name: hermes-agent
description: >
  Self-improving open-source AI agent by Nous Research. Built-in learning loop
  — creates skills from experience, persistent memory, multi-platform gateway
  (Telegram, Discord, Slack, WhatsApp, CLI). 40+ built-in tools. Model-agnostic.
allowed-tools: Read, WebFetch, WebSearch
---

# Hermes Agent — Self-Improving AI Agent

By Nous Research. The agent that grows with you — persistent memory, auto-generated skills, multi-platform.

## Quick Start

```bash
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | sh
hermes setup
hermes              # Start CLI
```

## Key Features

- **Persistent memory** — cross-session recall, FTS5 search, Honcho user modeling
- **Self-improving skills** — automatically creates SKILL.md from complex tasks
- **40+ built-in tools** — web, terminal, browser, vision, image gen, code exec, delegation
- **Multi-platform** — Telegram, Discord, Slack, WhatsApp, Signal, Email, CLI
- **Any model** — OpenRouter (200+), OpenAI, Nous Portal, Ollama, local endpoints
- **MCP integration** — connect any MCP server
- **Cron scheduler** — natural language scheduled tasks

## Commands

```bash
hermes              # Interactive CLI
hermes model        # Choose provider/model
hermes tools        # Enable/disable toolsets
hermes gateway      # Start messaging gateway
hermes config set   # Set config values
```

## Deployment

- Local, Docker, SSH, Modal, Daytona, Singularity
- Works on $5 VPS or GPU cluster
- Serverless (Modal/Daytona) — hibernates when idle

## Key Facts

- GitHub: https://github.com/NousResearch/Hermes-Agent
- Docs: https://hermes-agent.nousresearch.com/docs
- MIT License
- 95K+ GitHub stars
