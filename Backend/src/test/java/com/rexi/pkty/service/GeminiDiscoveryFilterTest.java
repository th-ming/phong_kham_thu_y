package com.rexi.pkty.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Kiểm tra filter ListModels của Gemini với JSON mẫu (không gọi mạng).
 */
class GeminiDiscoveryFilterTest {

    private static final String SAMPLE_LIST_MODELS = """
            {
              "models": [
                {
                  "name": "models/gemini-2.5-flash",
                  "supportedGenerationMethods": ["generateContent", "countTokens"]
                },
                {
                  "name": "models/gemini-2.0-flash",
                  "supportedGenerationMethods": ["generateContent"]
                },
                {
                  "name": "models/text-embedding-004",
                  "supportedGenerationMethods": ["embedContent"]
                },
                {
                  "name": "models/broken-entry"
                }
              ]
            }
            """;

    @Test
    void onlyGenerateContentModelsKeptAndPrefixStripped() throws Exception {
        ObjectMapper mapper = new ObjectMapper();
        JsonNode root = mapper.readTree(SAMPLE_LIST_MODELS);

        List<String> ids = GeminiService.extractGenerateContentModels(root);

        assertEquals(List.of("gemini-2.5-flash", "gemini-2.0-flash"), ids);
    }

    @Test
    void nullOrEmptyRootReturnsEmpty() {
        assertTrue(GeminiService.extractGenerateContentModels(null).isEmpty());
    }
}
