package com.rexi.pkty.service;

import java.util.logging.Logger;
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
import java.util.List;
import java.util.Map;

@Service
public class GroqService {

    private static final Logger logger = java.util.logging.Logger.getLogger(GroqService.class.getName());

    @Value("${groq.api.key}")
    private String apiKey;

    private static final String GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

    @Value("${groq.model:llama-3.3-70b-versatile}")
    private String modelName;

    // Model Ä‘á»ƒ phÃ¢n tÃ­ch hÃ¬nh áº£nh
    @Value("${groq.vision.model:meta-llama/llama-4-scout-17b-16e-instruct}")
    private String visionModelName;

    private final ObjectMapper objectMapper = new ObjectMapper();

    // Sá»­ dá»¥ng chung 1 HttpClient cho toÃ n bá»™ service Ä‘á»ƒ táº­n dá»¥ng Connection Pooling
    private final HttpClient client = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(20))
            .build();

    public String chat(List<ChatMessage> history) throws Exception {
        ChatMessage latest = history.get(history.size() - 1);
        String latestContent = latest.getContent() != null ? latest.getContent() : "";
        String latestNormalized = normalizeVietnamese(latestContent.toLowerCase());

        // Hard Filter cho Ä‘á»‹a chá»‰/vá»‹ trÃ­
        if (latestNormalized.contains("dia chi") || latestNormalized.contains("o dau") ||
                latestNormalized.contains("vi tri") || latestNormalized.contains("duong di")) {
            return "Dáº¡ Sen Æ¡i, PhÃ²ng khÃ¡m Rexi tá»a láº¡c táº¡i: **Sá»‘ 68, NgÃµ 10, ÄÆ°á»ng NgÃ´ XuÃ¢n Quáº£ng, TrÃ¢u Quá»³, Gia LÃ¢m, HÃ  Ná»™i** nha! Sen cÃ³ thá»ƒ xem chá»‰ Ä‘Æ°á»ng chi tiáº¿t táº¡i Ä‘Ã¢y áº¡: [LINK Báº¢N Äá»’] ðŸ¾";
        }

        // Kiá»ƒm tra áº£nh â†’ chá»n model phÃ¹ há»£p
        boolean hasImage = latest.getImage() != null && !latest.getImage().isEmpty();
        String selectedModel = hasImage ? visionModelName : modelName;

        // Chuáº©n bá»‹ danh sÃ¡ch messages cho API
        List<Map<String, Object>> messagesForApi = new ArrayList<>();

        for (int i = 0; i < history.size(); i++) {
            ChatMessage msg = history.get(i);
            String msgContent = msg.getContent() != null && !msg.getContent().isBlank() ? msg.getContent() : "";

            boolean isLatest = (i == history.size() - 1);

            if (isLatest && msg.getImage() != null && !msg.getImage().isEmpty()) {
                String textForImage = msgContent.isBlank() ? "PhÃ¢n tÃ­ch áº£nh nÃ y vÃ  nháº­n Ä‘á»‹nh sá»©c khá»e cá»§a bÃ©."
                        : msgContent;
                List<Map<String, Object>> content = new ArrayList<>();
                content.add(Map.of("type", "text", "text", textForImage));
                content.add(Map.of(
                        "type", "image_url",
                        "image_url", Map.of("url", "data:image/jpeg;base64," + msg.getImage())));
                messagesForApi.add(Map.of("role", msg.getRole(), "content", content));
            } else if (!msgContent.isBlank()) {
                messagesForApi.add(Map.of("role", msg.getRole(), "content", msgContent));
            }
        }

        // DÃ¹ng model phÃ¹ há»£p: vision cho áº£nh, text cho chat thÆ°á»ng
        Map<String, Object> requestBodyMap = Map.of(
                "model", selectedModel,
                "messages", messagesForApi);

        String requestBody = objectMapper.writeValueAsString(requestBodyMap);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(GROQ_API_URL))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8))
                .timeout(Duration.ofSeconds(15)) // Set timeout tá»‘i Ä‘a 15s cho thá»i gian sinh cÃ¢u tráº£ lá»i
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

        // Xá»­ lÃ½ lá»—i API - log chi tiáº¿t Ä‘á»ƒ debug
        if (response.statusCode() != 200) {
            logger.severe("Groq API Error - Status: " + response.statusCode() + " Body: " + response.body());

            // NÃ©m lá»—i Ä‘á»ƒ ChatController cÃ³ thá»ƒ thá»±c hiá»‡n Fallback sang Gemini
            throw new RuntimeException("Groq API Error " + response.statusCode());
        }

        JsonNode rootNode = objectMapper.readTree(response.body());
        try {
            return rootNode.path("choices").get(0).path("message").path("content").asText();
        } catch (Exception e) {
            return "TÃ´i ráº¥t lo cho bÃ© nhÆ°ng há»‡ thá»‘ng Ä‘ang trá»¥c tráº·c. Báº¡n hÃ£y Ä‘Æ°a bÃ© Ä‘áº¿n Rexi sá»›m Ä‘á»ƒ bÃ¡c sÄ© kiá»ƒm tra cho yÃªn tÃ¢m nhÃ©!";
        }
    }

    /**
     * Bá» dáº¥u tiáº¿ng Viá»‡t Ä‘á»ƒ so sÃ¡nh tá»« khÃ³a kháº©n cáº¥p,
     * giÃºp nháº­n diá»‡n khi user gÃµ khÃ´ng dáº¥u.
     */
    private String normalizeVietnamese(String input) {
        String result = input
                .replaceAll("[Ã Ã¡áº¡áº£Ã£Ã¢áº§áº¥áº­áº©áº«Äƒáº±áº¯áº·áº³áºµ]", "a")
                .replaceAll("[Ã¨Ã©áº¹áº»áº½Ãªá»áº¿á»‡á»ƒá»…]", "e")
                .replaceAll("[Ã¬Ã­á»‹á»‰Ä©]", "i")
                .replaceAll("[Ã²Ã³á»á»ÃµÃ´á»“á»‘á»™á»•á»—Æ¡á»á»›á»£á»Ÿá»¡]", "o")
                .replaceAll("[Ã¹Ãºá»¥á»§Å©Æ°á»«á»©á»±á»­á»¯]", "u")
                .replaceAll("[á»³Ã½á»µá»·á»¹]", "y")
                .replaceAll("[Ä‘]", "d");
        return result;
    }
}

