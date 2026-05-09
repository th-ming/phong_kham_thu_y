package com.rexi.pkty.controller;

import com.rexi.pkty.dto.ChatMessage;
import com.rexi.pkty.entity.LichSuTuVan;
import com.rexi.pkty.repository.LichSuTuVanRepository;
import com.rexi.pkty.service.GroqService;
import com.rexi.pkty.service.GeminiService;
import com.rexi.pkty.service.AiMemoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;
import jakarta.servlet.http.HttpServletRequest;
import java.util.concurrent.ConcurrentHashMap;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private static final Logger logger = Logger.getLogger(ChatController.class.getName());

    @Autowired
    private GroqService groqService;

    @Autowired
    private GeminiService geminiService;

    @Autowired
    private AiMemoryService aiMemoryService;

    @Autowired
    private LichSuTuVanRepository lichSuTuVanRepository;

    // Cấu trúc giới hạn Rate Limit đơn giản trong RAM
    private static class RateLimit {
        int count;
        Instant resetTime;

        RateLimit() {
            this.count = 1;
            this.resetTime = Instant.now().plus(1, ChronoUnit.MINUTES);
        }
    }

    private final ConcurrentHashMap<String, RateLimit> rateLimiter = new ConcurrentHashMap<>();

    @PostMapping
    public Map<String, String> chat(
            @RequestBody List<ChatMessage> history,
            HttpServletRequest request) {

        // BẢO MẬT LỚP 1: Rate Limiting chống Spam dựa trên Username thực tế (Token)
        // hoặc IP
        String clientIp = request.getRemoteAddr();
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        String realUsername = (auth != null && !auth.getName().equals("anonymousUser")) ? auth.getName() : null;
        String rateKey = (realUsername != null) ? realUsername : clientIp;

        // Dọn rác RAM nếu danh sách lưu quá lớn
        if (rateLimiter.size() > 1000) {
            rateLimiter.entrySet().removeIf(entry -> Instant.now().isAfter(entry.getValue().resetTime));
        }

        RateLimit limit = rateLimiter.compute(rateKey, (key, currentLimit) -> {
            if (currentLimit == null || Instant.now().isAfter(currentLimit.resetTime)) {
                return new RateLimit();
            }
            currentLimit.count++;
            return currentLimit;
        });

        if (limit.count > 10) {
            return Map.of("reply",
                    "Dạ Sen ơi, hệ thống AI đang hơi quá tải vì nhận quá nhiều tin nhắn liên tục. Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện với Rexi nhé! 🐾");
        }

        try {
            if (history == null || history.isEmpty()) {
                return Map.of("reply", "Xin chào Sen! 🐾 Rexi có thể giúp gì cho bé nhà mình ạ?");
            }

            // BẢO MẬT: Giới hạn mảng lịch sử (Chỉ nhớ 10 tin nhắn gần nhất) để tránh cạn
            // kiệt Token / Tràn RAM
            if (history.size() > 10) {
                history = new java.util.ArrayList<>(history.subList(history.size() - 10, history.size()));
            }

            // Lấy nội dung câu hỏi cuối cùng của khách hàng
            ChatMessage lastMsg = history.get(history.size() - 1);
            String userQuery = lastMsg.getContent() != null ? lastMsg.getContent() : "";

            // BẢO MẬT: Chặn đứng các đoạn chat siêu dài (Tránh tấn công Token Exhaustion)
            if (userQuery.length() > 1000) {
                return Map.of("reply",
                        "Sen ơi tin nhắn hơi dài quá òi! 😿 Sen tóm tắt lại tình trạng của bé ngắn gọn (dưới 1000 ký tự) để Rexi đọc và tư vấn chuẩn xác nhất nha!");
            }

            // Lấy bối cảnh dữ liệu THÔNG MINH (Cần gì lấy nấy dựa trên userQuery)
            String userContext = aiMemoryService.getUserContext(userQuery);

            // Tạo chỉ thị hệ thống tổng hợp
            String systemPrompt = "Bạn là Bác sĩ Thú y Rexi - Siêu trợ lý hóm hỉnh và thông minh. Hãy trò chuyện như một con người có khiếu hài hước.\n"
                    +
                    "1. TƯ DUY LINH HOẠT: Biết phân biệt khi nào Sen đang lo lắng thực sự (cần tư vấn y khoa) và khi nào Sen đang trêu đùa/nói đùa (cần đối đáp hóm hỉnh). Đừng 'nghiêm túc quá đà' khi Sen đang troll.\n"
                    +
                    "2. PHONG CÁCH: Gọi khách là 'Sen', gọi thú cưng là 'Bé/Boss'. Nếu Sen đùa, hãy biết đùa lại hoặc 'bắt thóp' cái sự lầy lội của Sen một cách dễ thương.\n"
                    +
                    "3. KIẾN THỨC: Vẫn là một chuyên gia sơ cứu khi cần, nhưng phải biết 'nhảy số' theo ngữ cảnh. Đừng tư vấn y khoa cho con đom đóm phát sáng!\n"
                    +
                    "4. KHẨN CẤP: Chỉ dùng tag [EMERGENCY] cho các ca bệnh thật sự nguy kịch.\n" +
                    "5. ĐẶT LỊCH TRỰC TIẾP: Thay vì bảo khách chuyển trang, HÃY TỰ ĐỘNG HỎI khách 5 thông tin: Ngày khám (Định dạng YYYY-MM-DD), Giờ khám (Định dạng HH:MM), Tên thú cưng, Dịch vụ muốn làm, và Bác sĩ mong muốn (Nếu khách không yêu cầu, ghi 'Bất kỳ'). Khi có đủ 5 thông tin, BẮT BUỘC trả về định dạng: [AUTO_BOOK:Ngày|Giờ|Tên bé|Dịch vụ|Tên bác sĩ] (VD: [AUTO_BOOK:2026-05-15|14:30|Miu|Tiêm phòng|BS. Minh Anh]). Tuyệt đối KHÔNG trả về [LINK ĐẶT LỊCH] nữa.\n"
                    +
                    "6. THÊM THÚ CƯNG TỰ ĐỘNG: Nếu khách yêu cầu thêm hồ sơ thú cưng, hãy tự động hỏi 5 thông tin: Tên bé, Loài (Chó/Mèo/Khác), Giống, Cân nặng (kg), Giới tính. Khi có đủ 5 thông tin, BẮT BUỘC trả về cú pháp: [ADD_PET:Tên|Loài|Giống|Cân nặng|Giới tính] (VD: [ADD_PET:Milo|Chó|Corgi|5|Đực]).\n"
                    +
                    userContext;

            // Chèn vào đầu lịch sử hội thoại để AI luôn nhớ
            ChatMessage systemMsg = new ChatMessage();
            systemMsg.setRole("system");
            systemMsg.setContent(systemPrompt);
            history.add(0, systemMsg);

            ChatMessage latest = history.get(history.size() - 1);
            boolean hasVideo = latest.getVideo() != null && !latest.getVideo().isEmpty();

            String reply;
            // Routing Logic
            if (hasVideo) {
                reply = geminiService.chat(history);
            } else {
                try {
                    reply = groqService.chat(history);
                } catch (Exception groqException) {
                    System.err.println("Groq failed, falling back to Gemini...");
                    reply = geminiService.chat(history);
                }
            }

            // BẢO MẬT: Làm sạch dữ liệu chống XSS (Stored XSS) trước khi lưu vào CSDL
            String safeUserQuery = org.springframework.web.util.HtmlUtils.htmlEscape(userQuery);

            // --- LƯU LỊCH SỬ TƯ VẤN VÀO DATABASE ---
            try {
                String customerId = aiMemoryService.getCurrentCustomerId();
                if (customerId != null) {
                    LichSuTuVan log = new LichSuTuVan();
                    log.setId_tu_van("TV-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase());
                    log.setId_khach_hang(customerId);
                    log.setNoi_dung_khach(safeUserQuery);
                    log.setNoi_dung_rexi(reply);
                    lichSuTuVanRepository.save(log);
                }
            } catch (Exception logEx) {
                System.err.println("Không thể lưu lịch sử tư vấn: " + logEx.getMessage());
            }

            return Map.of("reply", reply);
        } catch (Exception e) {
            logger.severe("Chat API error: " + e.getMessage());
            // Không lộ chi tiết Exception cho Client (bảo mật)
            return Map.of("reply",
                    "Sen ơi, não bộ của Rexi đang được bảo trì nâng cấp xíu nên hơi lác. Sen đợi một chút rồi thử lại nha! 🛠️🐾");
        }
    }
}

