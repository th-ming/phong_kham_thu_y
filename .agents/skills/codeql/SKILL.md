---
name: codeql
description: >
  GitHub's industry-leading semantic code analysis engine for finding
  security vulnerabilities and code errors. Use this skill when the user
  needs to set up CodeQL scanning, write custom QL queries, configure
  code scanning workflows, or analyze code for CVEs, injections, XSS,
  SQLi, or other vulnerabilities. Works with Java, JavaScript/TypeScript,
  Python, C/C++, C#, Go, Ruby, and Swift.
allowed-tools: Read, WebFetch, WebSearch
---

# CodeQL — Semantic Code Analysis Engine

CodeQL by GitHub lets you query code as data to find vulnerabilities across the entire codebase.

## How It Works

1. **Database creation** — extract code into a relational DB (per language)
2. **Query execution** — run standard or custom QL queries
3. **Results (SARIF)** — upload to GitHub Code Scanning or view locally

## Installation (CLI)

```bash
# Download CodeQL CLI bundle (includes queries)
# https://github.com/github/codeql-cli-binaries/releases
# Add to PATH
codeql version
```

## Quick Start (Local)

```bash
# Create database
codeql database create ./codeql-db --language=javascript --source-root=./Frontend

# Analyze with standard security queries
codeql database analyze ./codeql-db --format=sarif-latest --output=results.sarif

# Upload to GitHub
codeql github upload-results --repository=owner/repo --ref=refs/heads/main --sarif=results.sarif
```

## GitHub Actions (Recommended)

Create `.github/workflows/codeql-analysis.yml`:

```yaml
name: "CodeQL"

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 0'

jobs:
  analyze:
    name: Analyze
    runs-on: ubuntu-latest
    permissions:
      security-events: write
      actions: read
      contents: read

    strategy:
      fail-fast: false
      matrix:
        language: ['javascript', 'java']

    steps:
      - uses: actions/checkout@v4
      - uses: github/codeql-action/init@v3
        with:
          languages: ${{ matrix.language }}
          queries: security-extended
      - uses: github/codeql-action/autobuild@v3
      - uses: github/codeql-action/analyze@v3
```

## Supported Languages

| Language | Extractors |
|----------|-----------|
| JavaScript/TypeScript | `javascript` |
| Java/Kotlin | `java` |
| Python | `python` |
| C/C++ | `cpp` |
| C# | `csharp` |
| Go | `go` |
| Ruby | `ruby` |
| Swift | `swift` |

## Query Suites (built-in)

| Suite | Description |
|-------|-------------|
| `default` | High-precision security queries |
| `security-extended` | Default + lower precision/severity |
| `security-and-quality` | Extended + maintainability/reliability |

## Key Concepts

- **QL** — query language (like SQL but for code structure)
- **SARIF** — standard format for analysis results
- **Extractor** — converts source code into CodeQL database
- **Threat model** — define untrusted data sources (remote, local)

## Links

- Docs: https://codeql.github.com/docs/
- GitHub: https://github.com/github/codeql
- Actions: https://github.com/github/codeql-action
- Playground: https://codeql.github.com/codeql-query-help/
