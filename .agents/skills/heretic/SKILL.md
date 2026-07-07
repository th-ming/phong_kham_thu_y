---
name: heretic
description: >
  Tool for removing censorship (safety alignment) from transformer-based
  language models using automatic abliteration. Combines directional ablation
  with TPE-based parameter optimization. No expensive post-training required.
allowed-tools: Read, WebFetch, WebSearch
---

# Heretic — Automatic Censorship Removal for LLMs

Heretic removes safety alignment from transformer LLMs via automatic abliteration.

## Installation

```bash
pip install -U heretic-llm
```

## Usage

```bash
heretic Qwen/Qwen3-Coder-30B-A3B-Instruct
# Fully automatic — no config needed
```

## How It Works

- **Directional ablation** (abliteration) orthogonalizes refusal directions in attention out-projection and MLP down-projection matrices
- **TPE optimizer** (Optuna) co-minimizes refusal rate + KL divergence
- Preserves model capabilities while removing refusals (~96% reduction)

## Key Facts

- GitHub: https://github.com/p-e-w/heretic
- Python 3.10+, PyTorch 2.2+
- Supports dense, MoE, and hybrid architectures
- Results in KL divergence ~0.16 (vs 0.45-1.04 for manual)
- Research features: extract refusal directions, partial ablation, visualization
