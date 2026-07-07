---
name: stagehand
description: >
  SDK for AI-powered browser automation by Browserbase. Use this skill when
  the user needs to control a browser with natural language using Stagehand's
  act(), extract(), observe(), and agent() APIs. Combines AI (GPT-4o/Claude)
  with Playwright for resilient, self-healing automations. Supports local
  (Playwright) and cloud (Browserbase) execution.
allowed-tools: Read, WebFetch, WebSearch
---

# Stagehand — AI Browser Automation SDK

Stagehand is an open-source SDK by **Browserbase** that lets you control browsers with natural language + code.

## Installation

```bash
npm install @browserbasehq/stagehand
# Python
pip install stagehand
```

## Quick Start (TypeScript)

```ts
import { Stagehand } from "@browserbasehq/stagehand";

const stagehand = new Stagehand({
  env: "LOCAL",
  modelName: "gpt-4o",
  modelClientOptions: { apiKey: process.env.OPENAI_API_KEY },
  enableCaching: true,
});

await stagehand.init();
const page = stagehand.page;

await page.goto("https://example.com");
await stagehand.act("Click the sign-in button");
const data = await stagehand.extract({
  instruction: "Extract all product names and prices",
  schema: {
    type: "object",
    properties: {
      products: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            price: { type: "number" },
          },
        },
      },
    },
  },
});

await stagehand.close();
```

## Core APIs

| API | Purpose |
|-----|---------|
| `act()` | Single action by natural language (click, type, select, scroll) |
| `extract()` | Extract structured data from page with JSON schema |
| `observe()` | Find possible actions without executing |
| `agent()` | Multi-step autonomous workflow |

## Configuration

```ts
new Stagehand({
  env: "LOCAL" | "BROWSERBASE",
  modelName: "gpt-4o" | "claude-sonnet-4-20250514",
  enableCaching: true,            // cache AI decisions, save tokens
  verbose: true,                   // debug logging
  domSettleTimeoutMs: 5000,        // wait for DOM to settle
});
```

## Cloud (Browserbase)

```ts
new Stagehand({
  env: "BROWSERBASE",
  modelName: "gpt-4o",
  browserbaseSessionCreateParams: {
    projectId: process.env.BROWSERBASE_PROJECT_ID,
    proxies: true,
  },
});
```

## Best Practices

- Use `act()` for dynamic pages, Playwright API for stable interactions
- Always provide a schema to `extract()`
- Use `observe()` before `act()` for conditional UI
- Enable `enableCaching: true` to reduce LLM costs
- Keep credentials in `variables` param, not in action strings
- Use Browserbase cloud for parallel/scaled automation
