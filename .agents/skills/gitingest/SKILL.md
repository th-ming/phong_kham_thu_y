---
name: gitingest
description: >
  Turn any Git repository into a prompt-friendly text digest for LLMs.
  CLI tool and Python package. Replace 'hub' with 'ingest' in any GitHub URL.
  Smart formatting, file statistics, token count. Chrome/Firefox extension.
allowed-tools: Read, WebFetch, WebSearch
---

# Gitingest — Codebase Digest for LLMs

Turn any git repo into an LLM-optimized text digest.

## Quick Start

```bash
# CLI
pip install gitingest
gitingest /path/to/directory
gitingest https://github.com/user/repo

# Python
from gitingest import ingest
summary, tree, content = ingest("https://github.com/user/repo")
```

## Features

- Smart formatting optimized for LLM prompts
- File/directory structure tree
- Token count statistics
- Support for GitHub, GitLab, Bitbucket, etc.
- Private repos via `--token` / `-t` option
- Chrome + Firefox browser extensions

## URL Hack

Replace `hub` with `ingest` in any GitHub URL:
`https://github.com/user/repo` → `https://gitingest.com/user/repo`

## Key Facts

- Site: https://gitingest.com
- GitHub: https://github.com/coderamp-labs/gitingest
- PyPI: `gitingest`
- 14K+ GitHub stars
- MIT License
