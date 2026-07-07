---
name: paper-design
description: >
  HTML/CSS-native design canvas with MCP server for AI agent integration.
  Design on a web-standards canvas — export directly to code (React/Tailwind).
  Bidirectional sync between design and code via MCP. GPU-accelerated shaders.
allowed-tools: Read, WebFetch, WebSearch
---

# Paper.Design — Connected Design Canvas

HTML/CSS-based design tool with native MCP support for AI agents. Canvas = code — no translation layer.

## Key Features

- **HTML/CSS canvas** — every element is real HTML/CSS, not proprietary format
- **MCP server** — 24 tools for agents to read/write designs (read JSX, create artboards, set styles)
- **Bidirectional sync** — design ↔ code, one source of truth
- **GPU shaders** — mesh gradients, liquid metal, glass effects
- **Real data** — connect APIs/DBs directly to canvas

## MCP Integration

```json
{
  "mcpServers": {
    "paper": {
      "command": "npx",
      "args": ["@paper-design/mcp"]
    }
  }
}
```

## Key Facts

- Site: https://paper.design
- Desktop app with MCP server (auto-starts)
- Free tier: 100 MCP calls/week; Pro: $20/mo (1M calls/week)
- Export: React, Tailwind, HTML/CSS
- Open alpha — ships updates daily
