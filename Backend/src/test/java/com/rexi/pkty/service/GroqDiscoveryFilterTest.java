package com.rexi.pkty.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Kiểm tra filter /models của Groq với JSON mẫu (không gọi mạng).
 * JSON mô phỏng đúng response thật của https://api.groq.com/openai/v1/models
 * (đã đối chiếu live 25/9): có TTS (orpheus, output=speech), ASR (whisper,
 * input=audio/output=transcription), guard (prompt-guard/safeguard).
 */
class GroqDiscoveryFilterTest {

    private static final String SAMPLE_MODELS = """
            {
              "object": "list",
              "data": [
                { "id": "openai/gpt-oss-20b", "active": true,
                  "input_modalities": ["text"], "output_modalities": ["text"] },
                { "id": "meta-llama/llama-prompt-guard-2-86m", "active": true,
                  "input_modalities": ["text"], "output_modalities": ["text"] },
                { "id": "openai/gpt-oss-safeguard-20b", "active": true,
                  "input_modalities": ["text"], "output_modalities": ["text"] },
                { "id": "whisper-large-v3", "active": true,
                  "input_modalities": ["audio"], "output_modalities": ["transcription"] },
                { "id": "qwen/qwen3.8-27b", "active": true,
                  "input_modalities": ["text", "image"], "output_modalities": ["text"] },
                { "id": "canopylabs/orpheus-v1-english", "active": true,
                  "input_modalities": ["text"], "output_modalities": ["speech"] },
                { "id": "canopylabs/orpheus-arabic-saudi", "active": true,
                  "input_modalities": ["text"], "output_modalities": ["speech"] },
                { "id": "allam-2-7b", "active": true,
                  "input_modalities": ["text"], "output_modalities": ["text"] },
                { "id": "whisper-large-v3-turbo", "active": true,
                  "input_modalities": ["audio"], "output_modalities": ["transcription"] },
                { "id": "meta-llama/llama-prompt-guard-2-22m", "active": true,
                  "input_modalities": ["text"], "output_modalities": ["text"] },
                { "id": "openai/gpt-oss-120b", "active": true,
                  "input_modalities": ["text"], "output_modalities": ["text"] },
                { "id": "old-retired-model", "active": false,
                  "input_modalities": ["text"], "output_modalities": ["text"] }
              ]
            }
            """;

    @Test
    void keepsOnlyTextChatModelsAndDropsTtsAsrGuardInactive() throws Exception {
        JsonNode root = new ObjectMapper().readTree(SAMPLE_MODELS);

        List<String> ids = GroqService.extractGroqChatModels(root);

        assertEquals(List.of(
                "openai/gpt-oss-20b",
                "qwen/qwen3.8-27b",
                "allam-2-7b",
                "openai/gpt-oss-120b"), ids);
    }

    @Test
    void orpheusTtsIsNotAChatModel() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        JsonNode tts = mapper.readTree(
                """
                { "id": "canopylabs/orpheus-v1-english", "active": true,
                  "input_modalities": ["text"], "output_modalities": ["speech"] }
                """);
        assertFalse(GroqService.isGroqChatModel(tts));
    }

    @Test
    void qwenVisionCapableChatModelIsKept() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        JsonNode qwen = mapper.readTree(
                """
                { "id": "qwen/qwen3.8-27b", "active": true,
                  "input_modalities": ["text", "image"], "output_modalities": ["text"] }
                """);
        assertTrue(GroqService.isGroqChatModel(qwen));
    }

    @Test
    void inactiveOrNullReturnsEmpty() {
        assertTrue(GroqService.extractGroqChatModels(null).isEmpty());
    }
}
