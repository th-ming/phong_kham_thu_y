package com.rexi.pkty.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rexi.pkty.dto.ChatMessage;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.*;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class GeminiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.model:gemini-1.5-flash}")
    private String modelName;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // Sá»­ dá»¥ng chung 1 HttpClient cho toÃ n bá»™ service Ä‘á»ƒ tÄƒng hiá»‡u suáº¥t
    private final HttpClient client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(180)) // Cho phÃ©p káº¿t ná»‘i tá»‘i Ä‘a 3 phÃºt
            .build();

    public String chat(List<ChatMessage> history) throws Exception {
        String apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent?key="
                + apiKey;

        Map<String, Object> requestBodyMap = new HashMap<>();

        // TÃ¡ch riÃªng prompt há»‡ thá»‘ng vÃ  lá»‹ch sá»­ chat
        String dynamicSystemPrompt = "";
        List<ChatMessage> userModelHistory = new ArrayList<>();
        for (ChatMessage msg : history) {
            if ("system".equals(msg.getRole())) {
                dynamicSystemPrompt = msg.getContent();
            } else {
                userModelHistory.add(msg);
            }
        }

        // Set System Instruction
        if (!dynamicSystemPrompt.isEmpty()) {
            Map<String, Object> systemInstruction = new HashMap<>();
            systemInstruction.put("parts", List.of(Map.of("text", dynamicSystemPrompt)));
            requestBodyMap.put("system_instruction", systemInstruction);
        }

        // Set Contents
        List<Map<String, Object>> contents = new ArrayList<>();

        for (ChatMessage msg : userModelHistory) {
            Map<String, Object> contentItem = new HashMap<>();

            // Chuyá»ƒn role sang chuáº©n cá»§a Gemini (user / model)
            String role = (msg.getRole() != null && msg.getRole().equals("assistant")) ? "model" : "user";
            contentItem.put("role", role);

            List<Map<String, Object>> parts = new ArrayList<>();

            String textContent = (msg.getContent() != null && !msg.getContent().isBlank()) ? msg.getContent() : "";

            if (msg.getImage() != null && !msg.getImage().isEmpty()) {
                if (textContent.isBlank())
                    textContent = "PhÃ¢n tÃ­ch áº£nh nÃ y giÃºp tÃ´i.";
                parts.add(Map.of("text", textContent));
                parts.add(Map.of("inlineData", Map.of(
                        "mimeType", "image/jpeg",
                        "data", msg.getImage())));
            } else if (msg.getVideo() != null && !msg.getVideo().isEmpty()) {
                if (textContent.isBlank())
                    textContent = "PhÃ¢n tÃ­ch video nÃ y giÃºp tÃ´i.";
                parts.add(Map.of("text", textContent));

                String mimeType = "video/mp4";
                String base64Data = msg.getVideo();

                // TrÃ­ch xuáº¥t chÃ­nh xÃ¡c mimeType tá»« chuá»—i data URL
                if (base64Data.startsWith("data:")) {
                    int semicolonIdx = base64Data.indexOf(";");
                    if (semicolonIdx != -1) {
                        mimeType = base64Data.substring(5, semicolonIdx);
                    }
                    int commaIdx = base64Data.indexOf(",");
                    if (commaIdx != -1) {
                        base64Data = base64Data.substring(commaIdx + 1);
                    }
                }

                parts.add(Map.of("inlineData", Map.of(
                        "mimeType", mimeType,
                        "data", base64Data)));
            } else {
                if (!textContent.isBlank()) {
                    parts.add(Map.of("text", textContent));
                }
            }

            if (!parts.isEmpty()) {
                contentItem.put("parts", parts);
                contents.add(contentItem);
            }
        }

        requestBodyMap.put("contents", contents);

        String requestBody = objectMapper.writeValueAsString(requestBodyMap);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(apiUrl))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8))
                .timeout(Duration.ofMinutes(3)) // Gemini xá»­ lÃ½ video cÃ³ thá»ƒ lÃ¢u, cho phÃ©p tá»‘i Ä‘a 3 phÃºt
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() != 200) {
            System.err.println("=== Lá»–I Káº¾T Ná»I GEMINI API ===");
            System.err.println("Tráº¡ng thÃ¡i: " + response.statusCode());
            System.err.println("Ná»™i dung lá»—i: " + response.body());
            throw new RuntimeException("Gemini API gáº·p lá»—i " + response.statusCode() + ": " + response.body());
        }

        JsonNode rootNode = objectMapper.readTree(response.body());
        try {
            return rootNode.path("candidates").get(0).path("content").path("parts").get(0).path("text").asText();
        } catch (Exception e) {
            System.err.println("Lá»—i phÃ¢n tÃ­ch pháº£n há»“i tá»« Gemini. Ná»™i dung: " + response.body());
            throw new RuntimeException("Lá»—i Parse Gemini: " + response.body());
        }
    }
}

