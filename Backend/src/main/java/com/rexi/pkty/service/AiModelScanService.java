package com.rexi.pkty.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.function.Supplier;
import java.util.logging.Logger;

/**
 * Quét chủ động danh sách model live của 3 provider AI (Groq, Gemini,
 * OpenRouter) để snapshot luôn mới ngay cả khi không có request nào.
 * Runtime chat vốn đã tự heal qua dynamic candidates (lazy refresh 24h);
 * scheduler này đảm bảo snapshot được làm mới định kỳ + log rõ ràng.
 */
@Component
public class AiModelScanService {

    private static final Logger logger = Logger.getLogger(AiModelScanService.class.getName());

    private final GroqService groqService;
    private final GeminiService geminiService;
    private final OpenRouterService openRouterService;

    public AiModelScanService(GroqService groqService, GeminiService geminiService,
                              OpenRouterService openRouterService) {
        this.groqService = groqService;
        this.geminiService = geminiService;
        this.openRouterService = openRouterService;
    }

    /**
     * Chạy 03:30 và 15:30 giờ VN mỗi ngày (2 lần/ngày): provider gỡ model
     * bất kỳ lúc nào nên 24h/lần là tối thiểu, 12h/lần cho an toàn.
     */
    @Scheduled(cron = "0 30 3,15 * * *", zone = "Asia/Ho_Chi_Minh")
    public void scanAllProvidersTwiceDaily() {
        logger.info("[AI-SCAN] Bắt đầu quét model tự động 3 provider...");
        boolean groqOk = safeScan("Groq", groqService::forceModelScan);
        boolean geminiOk = safeScan("Gemini", geminiService::forceModelScan);
        boolean openRouterOk = safeScan("OpenRouter", openRouterService::forceModelScan);
        logger.info("[AI-SCAN] Kết quả: groq=" + groqOk + " gemini=" + geminiOk
                + " openrouter=" + openRouterOk);
    }

    private boolean safeScan(String provider, Supplier<Boolean> scan) {
        try {
            return Boolean.TRUE.equals(scan.get());
        } catch (Exception e) {
            logger.warning("[AI-SCAN] " + provider + " quét lỗi: " + e.getMessage());
            return false;
        }
    }
}
