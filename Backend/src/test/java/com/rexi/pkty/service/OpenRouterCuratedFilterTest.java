package com.rexi.pkty.service;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Kiểm tra curated filter của OpenRouter với dữ liệu mẫu mô phỏng
 * snapshot live /models (không gọi mạng, không tốn quota).
 */
class OpenRouterCuratedFilterTest {

    private static OpenRouterService.FreeModelInfo info(String id, String name, String desc,
            boolean reasoningMandatory) {
        return new OpenRouterService.FreeModelInfo(id, name, desc, reasoningMandatory, true);
    }

    private static List<OpenRouterService.FreeModelInfo> sampleSnapshot() {
        return List.of(
                info("google/gemma-4-31b-it:free", "Google: Gemma 4 31B",
                        "Gemma 4 31B Instruct is Google DeepMind's dense multimodal model", false),
                info("thinkingmachines/inkling-small:free", "Thinking Machines: Inkling Small",
                        "open-weight multimodal mixture-of-experts model", false),
                info("cohere/north-mini-code:free", "Cohere: North Mini Code",
                        "North Mini Code is Cohere's first agentic coding model", false),
                info("nvidia/nemotron-3.5-content-safety:free", "NVIDIA: Nemotron 3.5 Content Safety",
                        "compact multimodal guardrail model, moderates inputs and responses", false),
                info("inclusionai/ling-3.0-flash-fin:free", "inclusionAI: Ling 3.0 Flash Fin",
                        "finance-focused mixture-of-experts model for investment tasks", false),
                info("inclusionai/ling-3.0-flash-sante:free", "inclusionAI: Ling 3.0 Flash Sante",
                        "health and medicine-focused mixture-of-experts model", false),
                info("liquid/lfm-2.5-2.6b:free", "LiquidAI: LFM2.5-2.6B",
                        "compact reasoning model for agent workflows", true),
                info("nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
                        "NVIDIA: Nemotron 3 Nano Omni",
                        "open multimodal model, perception and context sub-agent", false),
                info("nvidia/nemotron-3.5-lightning:free", "NVIDIA: Nemotron 3.5 Lightning",
                        "open mixture-of-experts model for high-throughput agentic workloads", false));
    }

    @Test
    void generalChatExcludesCodeOnlySafetyFinanceAndReasoningOnly() {
        List<String> curated = OpenRouterService.curateFreeModels(sampleSnapshot(), false);

        assertFalse(curated.contains("cohere/north-mini-code:free"), "code-only phải bị loại");
        assertFalse(curated.contains("nvidia/nemotron-3.5-content-safety:free"), "guardrail phải bị loại");
        assertFalse(curated.contains("inclusionai/ling-3.0-flash-fin:free"), "finance phải bị loại");
        assertFalse(curated.contains("liquid/lfm-2.5-2.6b:free"), "reasoning-only phải bị loại khỏi chat thường");
        assertTrue(curated.contains("google/gemma-4-31b-it:free"));
        assertTrue(curated.size() <= 5);
    }

    @Test
    void medicalBranchKeepsReasoningAndPrefersHealthModel() {
        List<String> curated = OpenRouterService.curateFreeModels(sampleSnapshot(), true);

        assertTrue(curated.contains("inclusionai/ling-3.0-flash-sante:free"),
                "nhánh medical phải ưu tiên model health/medicine");
        assertTrue(curated.contains("nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free"),
                "reasoning được giữ cho nhánh medical");
        assertEquals("inclusionai/ling-3.0-flash-sante:free", curated.get(0));
        assertFalse(curated.contains("cohere/north-mini-code:free"));
        assertFalse(curated.contains("nvidia/nemotron-3.5-content-safety:free"));
    }

    @Test
    void preferredOrderRespectedAndDeadIdsSkipped() {
        List<String> curated = OpenRouterService.curateFreeModels(sampleSnapshot(), false);

        // gemma-4-31b-it đứng đầu GENERAL_PREFERRED và alive → phải đứng đầu curated
        assertEquals("google/gemma-4-31b-it:free", curated.get(0));
        // nex-n2.5-pro trong preferred nhưng chết (không có trong snapshot) → bị bỏ qua im lặng
        assertFalse(curated.contains("nex-agi/nex-n2.5-pro:free"));
    }

    @Test
    void nonTextOutputExcluded() {
        OpenRouterService.FreeModelInfo tts =
                new OpenRouterService.FreeModelInfo("some/tts:free", "TTS", "text to speech", false, false);
        assertTrue(OpenRouterService.isExcludedFromChat(tts, false));
        assertTrue(OpenRouterService.isExcludedFromChat(tts, true));
    }
}
