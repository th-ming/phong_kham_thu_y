---
name: lightpanda
description: >
  Documentation reference for LightPanda — the headless browser built from
  scratch in Zig for AI agents and automation. Use this skill when the user
  needs to install, configure, or write automation scripts using LightPanda,
  including CDP protocol usage, Docker/npm setup, and integration with
  Puppeteer/Playwright. Not a Chromium fork — minimal memory footprint,
  high performance.
allowed-tools: Read, WebFetch, WebSearch
---

# LightPanda Headless Browser Reference

LightPanda is a headless browser written in **Zig** (not a Chromium/WebKit fork), designed for AI agents and web automation with minimal resource usage.

## Installation

### Docker (recommended on Windows)
```bash
docker run -d --name lightpanda -p 127.0.0.1:9222:9222 lightpanda/browser:nightly
```

### npm (auto-downloads binary per platform)
```bash
npm install @lightpanda/browser
```
Binary stored in `~/.cache/lightpanda-node`. Override with env `LIGHTPANDA_EXECUTABLE_PATH`.

### Linux / macOS (nightly binary)
```bash
# Linux x86_64
curl -L -o lightpanda https://github.com/lightpanda-io/browser/releases/download/nightly/lightpanda-x86_64-linux && chmod a+x ./lightpanda

# macOS aarch64
curl -L -o lightpanda https://github.com/lightpanda-io/browser/releases/download/nightly/lightpanda-aarch64-macos && chmod a+x ./lightpanda
```

### Windows
No native Windows binary. Use **Docker** or **WSL2**.

## Usage

### Start CDP server
```bash
./lightpanda
# Listens on ws://127.0.0.1:9222 by default
```

### Verify version
```bash
./lightpanda version
```

### Connect via CDP (Puppeteer example)
```ts
import puppeteer from 'puppeteer';

const browser = await puppeteer.connect({
  browserURL: 'http://127.0.0.1:9222',
});
const page = await browser.newPage();
await page.goto('https://example.com');
console.log(await page.title());
await browser.disconnect();
```

## Key Facts

- Language: **Zig** (not a fork of Chromium/WebKit)
- Protocol: **CDP** (Chrome DevTools Protocol) — compatible with Puppeteer, Playwright, etc.
- Docker image: `lightpanda/browser:nightly` (amd64 + arm64)
- GitHub: https://github.com/lightpanda-io/browser
- License: Apache 2.0
- Use `@lightpanda/browser` npm package for Node.js integration
