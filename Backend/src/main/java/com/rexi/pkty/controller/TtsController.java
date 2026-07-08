package com.rexi.pkty.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.logging.Logger;

@RestController
@RequestMapping("/api/tts")
public class TtsController {

    private static final Logger logger = Logger.getLogger(TtsController.class.getName());
    private static final long CONFIG_CACHE_TTL_MS = 300_000; // 5 phút

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private volatile String cachedKiraApiKey = null;
    private volatile String cachedTtsModel = null;
    private volatile String cachedTtsVoice = null;
    private volatile long cacheUntilMs = 0L;

    /**
     * Đọc config Kira TTS từ DB CauHinhHeThong, cache 5 phút.
     * Keys trong DB: kira_api_key, kira_tts_model, kira_tts_voice
     */
    private void refreshConfig() {
        long now = System.currentTimeMillis();
        if (now < cacheUntilMs && cachedKiraApiKey != null) return;
        try {
            String key = jdbcTemplate.queryForObject(
                "SELECT gia_tri FROM CauHinhHeThong WHERE ten_cau_hinh = 'kira_api_key'",
                String.class);
            cachedKiraApiKey = (key != null && !key.isBlank()) ? key.trim() : null;
        } catch (Exception e) {
            cachedKiraApiKey = null;
        }
        try {
            String model = jdbcTemplate.queryForObject(
                "SELECT gia_tri FROM CauHinhHeThong WHERE ten_cau_hinh = 'kira_tts_model'",
                String.class);
            cachedTtsModel = (model != null && !model.isBlank()) ? model.trim() : "kira-3.0-flash-tts";
        } catch (Exception e) {
            cachedTtsModel = "kira-3.0-flash-tts";
        }
        try {
            String voice = jdbcTemplate.queryForObject(
                "SELECT gia_tri FROM CauHinhHeThong WHERE ten_cau_hinh = 'kira_tts_voice'",
                String.class);
            cachedTtsVoice = (voice != null && !voice.isBlank()) ? voice.trim() : "alloy";
        } catch (Exception e) {
            cachedTtsVoice = "alloy";
        }
        cacheUntilMs = now + CONFIG_CACHE_TTL_MS;
        logger.info("Kira TTS config loaded from DB — key: " + (cachedKiraApiKey != null ? "***configured" : "missing"));
    }

    private String getApiKey() { refreshConfig(); return cachedKiraApiKey; }
    private String getModel() { refreshConfig(); return cachedTtsModel; }
    private String getVoice() { refreshConfig(); return cachedTtsVoice; }

    /**
     * Proxy endpoint: Frontend gửi text → Backend gọi Kira AI TTS → trả về audio mp3.
     * API key được đọc từ DB CauHinhHeThong (an toàn, không lộ env).
     */
    @PostMapping("/kira-audio")
    public ResponseEntity<byte[]> kiraTts(@RequestBody Map<String, String> body) {
        String text = body.getOrDefault("text", "").trim();
        String voice = body.getOrDefault("voice", getVoice());
        int textLength = text.length();

        if (text.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        String apiKey = getApiKey();
        if (apiKey == null || apiKey.isBlank()) {
            logger.warning("Kira TTS: kira_api_key chưa cấu hình trong CauHinhHeThong — bỏ qua.");
            byte[] errorBytes = "{\"error\":\"kira_api_key missing in DB\"}".getBytes();
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .header(HttpHeaders.CONTENT_TYPE, "application/json")
                    .body(errorBytes);
        }

        // Giới hạn 500 ký tự để tiết kiệm quota $50/ngày
        if (textLength > 500) {
            text = text.substring(0, 500);
        }

        try {
            java.net.http.HttpClient client = java.net.http.HttpClient.newBuilder()
                    .connectTimeout(java.time.Duration.ofSeconds(10))
                    .build();

            String escapedText = text.replace("\\", "\\\\")
                    .replace("\"", "\\\"")
                    .replace("\n", " ");
            String requestBody = """
                    {
                        "model": "%s",
                        "input": "%s",
                        "voice": "%s"
                    }
                    """.formatted(getModel(), escapedText, voice);

            java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create("https://kiraai.vn/api/v1/audio/speech"))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + apiKey)
                    .POST(java.net.http.HttpRequest.BodyPublishers.ofString(requestBody))
                    .timeout(java.time.Duration.ofSeconds(15))
                    .build();

            java.net.http.HttpResponse<byte[]> response = client.send(request,
                    java.net.http.HttpResponse.BodyHandlers.ofByteArray());

            if (response.statusCode() == 200 && response.body() != null && response.body().length > 0) {
                logger.info("Kira TTS OK: " + textLength + " chars → " + response.body().length + " bytes audio");
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_TYPE, "audio/mpeg")
                        .header(HttpHeaders.CACHE_CONTROL, "no-cache")
                        .body(response.body());
            }

            String errorBody = response.statusCode() == 200 ? "empty audio" : "HTTP " + response.statusCode();
            String bodyStr = (response.body() != null && response.body().length > 0) 
                ? new String(response.body()).replace("\"", "'") 
                : "null";
            if (bodyStr.length() > 200) bodyStr = bodyStr.substring(0, 197) + "...";
            logger.warning("Kira TTS lỗi: " + errorBody + " — body: " + bodyStr);
            byte[] errorBytes = ("{\"error\":\"Kira API error: " + errorBody + " body:'" + bodyStr + "'\"}").getBytes();
            int responseStatus = response.statusCode();
            return ResponseEntity.status(responseStatus)
                    .header(HttpHeaders.CONTENT_TYPE, "application/json")
                    .body(errorBytes);

        } catch (Exception e) {
            logger.severe("Kira TTS exception: " + e.getMessage());
            String errorMsg = e.getMessage().replace("\"", "'");
            byte[] errorBytes = ("{\"error\":\"Backend proxy error: " + errorMsg + "\"}").getBytes();
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .header(HttpHeaders.CONTENT_TYPE, "application/json")
                    .body(errorBytes);
        }
    }

    /**
     * Health check: frontend gọi để biết Kira TTS có sẵn sàng không.
     */
    @GetMapping("/health")
    public Map<String, Object> health() {
        refreshConfig();
        boolean configured = cachedKiraApiKey != null && !cachedKiraApiKey.isBlank();
        return Map.of(
                "kira_configured", configured,
                "model", getModel(),
                "voice", getVoice()
        );
    }
}
