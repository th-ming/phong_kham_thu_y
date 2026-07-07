---
name: stirling-pdf
description: >
  Open-source PDF manipulation platform with 50+ tools. Edit, merge, split,
  sign, redact, convert, OCR, compress. Self-hosted with REST API.
  Desktop client, browser UI, and server deployment. Privacy-first.
allowed-tools: Read, WebFetch, WebSearch
---

# Stirling PDF — Open-Source PDF Platform

#1 PDF application on GitHub. 50+ PDF tools, self-hosted, privacy-first.

## Quick Start (Docker)

```bash
docker run -p 8080:8080 docker.stirlingpdf.com/stirlingtools/stirling-pdf
# Open: http://localhost:8080
```

## Key Features

- **50+ tools** — merge, split, rotate, compress, convert, OCR, watermark, sign, redact
- **REST API** — all operations available via API with Swagger docs
- **Privacy-first** — all processing on your server, no external uploads
- **Authentication** — built-in SSO, admin/user roles
- **40+ languages** — multi-language UI
- **OCR** — Tesseract OCR, downloadable language packs
- **Desktop app** — multi-window, auto-updater
- **Automation** — no-code pipelines, batch processing

## API Example

```bash
curl -X POST http://localhost:8080/api/v1/merge-pdfs \
  -F "fileInput=@doc1.pdf" -F "fileInput=@doc2.pdf" \
  -o merged.pdf
```

## Key Facts

- GitHub: https://github.com/Stirling-Tools/Stirling-PDF
- Docs: https://docs.stirlingpdf.com
- 81K+ GitHub stars
- Java + TypeScript
- Docker, desktop, Kubernetes
