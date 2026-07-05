# HƯỚNG DẪN CHỌN MODEL

## CÁCH ĐỌC
- **Mạnh**: ⭐⭐⭐ (3 sao) - Làm được mọi thứ, suy luận tốt
- **Khá**: ⭐⭐ (2 sao) - Làm được, có thể sai vài thứ
- **Yếu**: ⭐ (1 sao) - Chỉ dùng cho chat đơn giản, không phức tạp

---

## OPENROUTER

### Tier 1: XÀI FREE/GIÁ RẺ, CHẤT LƯỢNG CAO

| Model | Tác dụng | Mạnh/Yếu | Khi nào xài |
|-------|----------|----------|-------------|
| `deepseek/deepseek-v4-flash` | Chat thông minh, code tốt, giá rẻ | ⭐⭐⭐ | Tổng quát, thay GPT-4o tiết kiệm 80% |
| `deepseek/deepseek-v4-pro` | Code cực mạnh, suy luận sâu | ⭐⭐⭐ | Code phức tạp, refactor, debug nặng |
| `deepseek/deepseek-chat-v3-0324` | Code khá, giá thấp | ⭐⭐ | Tiết kiệm, dự án vừa |
| `google/gemini-2.5-flash` | Nhanh, rẻ, 1M token context | ⭐⭐⭐ | Đọc file lớn, context dài, tổng quát |
| `google/gemini-2.5-pro` | Suy luận cực mạnh, reasoning | ⭐⭐⭐ | Phân tích phức tạp, architecture design |
| `google/gemini-3.5-flash` | Gemini 3.5 mới nhất | ⭐⭐⭐ | Chat thông minh, nhanh hơn 2.5 |
| `google/gemini-3.1-pro-preview` | Pro reasoning version | ⭐⭐⭐ | Suy luận nặng, planning |

### Tier 2: PREMIUM (NGON NHƯNG ĐẮT HƠN)

| Model | Tác dụng | Mạnh/Yếu | Khi nào xài |
|-------|----------|----------|-------------|
| `anthropic/claude-sonnet-4` | Tổng quát cực tốt, code + reasoning | ⭐⭐⭐ | Thay thế GPT-4o mọi việc |
| `anthropic/claude-sonnet-5` | Sonnet 4 được upgrade | ⭐⭐⭐ | Phiên bản mới hơn, mạnh hơn |
| `anthropic/claude-fable-5` | Nhẹ, nhanh, tổng quát | ⭐⭐ | Chat nhanh, không cần suy luận sâu |
| `openai/gpt-4o` | All-rounder, ổn định | ⭐⭐⭐ | Khi cần ổn định, GPT quen thuộc |

### Tier 3: OPEN-SOURCE MIỄN PHÍ (CẦN TEST)

| Model | Tác dụng | Mạnh/Yếu | Khi nào xài |
|-------|----------|----------|-------------|
| `meta-llama/llama-3.3-70b-instruct` | Open-source mạnh, free | ⭐⭐ | Tiết kiệm, dự án cá nhân |
| `qwen/qwen-2.5-72b-instruct` | Qwen 72B, code OK | ⭐⭐ | Open-source thay thế GPT |
| `qwen/qwen3.7-max` | Qwen 3.7 max, mới nhất | ⭐⭐⭐ | Qwen top, cực mạnh |
| `qwen/qwen3.7-plus` | Plus version | ⭐⭐⭐ | Khác max chút, vẫn rất mạnh |
| `qwen/qwen3.6-max-preview` | Qwen 3.6 preview | ⭐⭐⭐ | Khá mới, mạnh |
| `mistralai/mistral-medium-3-5` | Mistral Medium 3.5 | ⭐⭐ | European model, hơi yếu hơn Qwen |
| `minimax/minimax-m3` | MiniMax M3 mới | ⭐⭐ | Trung bình, chat được |
| `x-ai/grok-4.20` | Grok 4.20, Elon Musk | ⭐⭐ | Creative, hài hước, khác style |
| `x-ai/grok-4.3` | Grok 4.3 | ⭐⭐ | Giống 4.20, phiên bản khác |

---

## GROQ (NHANH NHẤT - GPU SPEED)

| Model | Tác dụng | Mạnh/Yếu | Khi nào xài |
|-------|----------|----------|-------------|
| `llama-3.3-70b-versatile` | Nhanh + khỏe, Groq đặc biệt | ⭐⭐⭐ | Khi cần tốc độ (GPU groq nhanh hơn cloud khác) |
| `qwen3-32b` | Qwen 32B trên Groq | ⭐⭐ | Nhanh + rẻ, code vừa |
| `qwen3.6-27b` | Qwen 3.6 27B | ⭐⭐ | Khá, code được |
| `llama-4-scout-17b` | Llama 4 Scout | ⭐⭐ | Mới hơn, decent |
| `llama-3.1-8b-instant` | **Chat thường thôi** | ⭐ | Tổng quát, không code nặng, rẻ |
| `gpt-oss-120b` | GPT open-source 120B | ⭐⭐ | To xong yếu hơn closed-source |
| `gpt-oss-20b` | GPT open-source 20B | ⭐ | Yếu, chỉ chat đơn giản |
| `groq/compound` | Groq's own agentic model | ⭐⭐ | Agentic tasks, multi-step |
| `groq/compound-mini` | Groq mini cho agents | ⭐⭐ | Agent nhẹ, nhanh |
| `allam-2-7b` | Allam 2 7B | ⭐ | Chat cơ bản, không code |

---

## NVIDIA NIM (KHẢ NĂNG CAO)

| Model | Tác dụng | Mạnh/Yếu | Khi nào xài |
|-------|----------|----------|-------------|
| `deepseek-ai/deepseek-v4-pro` | DeepSeek V4 Pro - coding cực mạnh | ⭐⭐⭐ | Code phức tạp, debug nặng |
| `mistralai/mistral-large-3-675b` | Mistral Large 3 - code xuất sắc | ⭐⭐⭐ | Code chuyên nghiệp, architecture |
| `mistralai/mistral-medium-3.5-128b` | Mistral Medium 3.5 - khá | ⭐⭐ | Code vừa, reasoning OK |
| `mistralai/mistral-small-4-119b-2603` | Mistral Small 4 - mới | ⭐⭐ | Large model mới, mạnh |
| `qwen/qwen3.5-122b-a10b` | Qwen 122B - rất mạnh | ⭐⭐⭐ | Code + reasoning tốt |
| `moonshotai/kimi-k2.6` | Kimi K2.6 - creative + reasoning | ⭐⭐⭐ | Creative work, analysis, reasoning |
| `meta/llama-4-maverick-17b` | Llama 4 Maverick - decent | ⭐⭐ | Mới, ổn định |
| `nvidia/nemotron-3-ultra-550b-a55b` | Nemotron Ultra 550B - KHỔNG LỒ | ⭐⭐ | To xong không nổi bật lắm |
| `nvidia/nemotron-3-super-120b-a12b` | Nemotron Super 120B | ⭐ | To nhưng code không tốt |
| `nvidia/llama-3.3-nemotron-super-49b-v1.5` | Nemotron Super 49B - dựa trên Llama | ⭐⭐ | Decent, Llama-based nên ổn |
| `nvidia/nemotron-nano-12b-v2-vl` | Tiny + vision-language | ⭐ | Vision nhẹ, chat cơ bản |
| `minimaxai/minimax-m2.7` | MiniMax M2.7 - trung bình | ⭐⭐ | Chat được, không nổi bật |
| `minimaxai/minimax-m3` | MiniMax M3 - mới hơn | ⭐⭐ | Tốt hơn M2.7 |
| `google/gemma-4-31b-it` | Gemma 4 31B - Google small | ⭐⭐ | Google model, ổn |
| `stepfun-ai/step-3.7-flash` | Step function 3.7 | ⭐⭐ | Chinese model, decent |
| `z-ai/glm-5.2` | GLM 5.2 - Chinese | ⭐⭐ | Chinese model, decent |

---

## CEREBRAS (GPU SPEED - FREE)

| Model | Tác dụng | Mạnh/Yếu | Khi nào xài |
|-------|----------|----------|-------------|
| `llama-3.3-70b` | Llama 3.3 70B - KHỎE + FREE | ⭐⭐⭐ | Code vừa, chat tốt, FREE không giới hạn |
| `qwen-2.5-72b` | Qwen 2.5 72B - rất mạnh | ⭐⭐⭐ | Code + reasoning tốt, thay GPT tiết kiệm |

---

## GEMINI NATIVE API (1M TOKEN CONTEXT - RẺ + NHANH)

| Model | Tác dụng | Mạnh/Yếu | Khi nào xài |
|-------|----------|----------|-------------|
| `gemini-2.5-flash` | Nhanh, rẻ, 1M token context | ⭐⭐⭐ | Đọc file lớn cực, context dài |
| `gemini-2.5-pro` | Reasoning mạnh, 1M context | ⭐⭐⭐ | Phân tích sâu, architecture |
| `gemini-3.5-flash` | Gemini 3.5 mới nhất | ⭐⭐⭐ | Phiên bản mới, nhanh + thông minh |
| `gemini-3.1-pro-preview` | Pro reasoning | ⭐⭐⭐ | Suy luận nặng, best Gemini Pro |
| `gemini-3.1-flash-lite-preview` | Lite version - rẻ nhất | ⭐⭐ | Chat đơn giản, tiết kiệm |
| `gemini-3-pro-preview` | Gemini 3 Pro | ⭐⭐⭐ | Model mới, flagship |

---

## MẸO CHỌN MODEL

### Code phức tạp (refactor, debug nặng, architecture)
→ `deepseek-v4-pro` (NVIDIA) hoặc `deepseek/deepseek-v4-pro` (OR)

### Tiết kiệm, tốt (70-80% chất lượng, 20% giá)
→ `deepseek-v4-flash` (OR) hoặc `gemini-2.5-flash`

### Đọc file lớn (50k+ tokens)
→ `gemini-2.5-flash` hoặc `gemini-2.5-pro` - 1M context

### Chat thường, nhanh
→ `llama-3.3-70b` (Groq) - nhanh nhất

### Suy luận nặng (planning, analysis)
→ `claude-sonnet-5` hoặc `gemini-2.5-pro`

### Creative work (viết content, brainstorming)
→ `kimi-k2.6` hoặc `grok-4.20`

### Agentic / multi-step tasks
→ `groq/compound` hoặc `groq/compound-mini`