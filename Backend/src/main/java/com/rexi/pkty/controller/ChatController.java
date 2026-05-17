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
import java.util.ArrayList;

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

        // BẢO MẬT LỚP 1: Rate Limiting chống Spam (20/phút cho text, 15/phút cho video)
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

        // Kiểm tra xem tin nhắn cuối cùng có video không
        boolean hasVideoInRequest = history != null && !history.isEmpty() && 
                                   history.get(history.size()-1).getVideos() != null && 
                                   !history.get(history.size()-1).getVideos().isEmpty();

        int maxAllowed = hasVideoInRequest ? 15 : 20;

        if (limit.count > maxAllowed) {
            String warning = hasVideoInRequest 
                ? "Sen ơi, gửi video liên tục tốn nhiều năng lượng của Rexi quá! 🙀 Sen đợi 1 phút nữa rồi gửi tiếp video cho Rexi xem nha!"
                : "Dạ Sen ơi, Sen chat nhanh quá Rexi đọc không kịp luôn nè! 🐾 Sen nghỉ ngơi xíu rồi 1 phút sau quay lại trò chuyện tiếp nha!";
            return Map.of("reply", warning);
        }

        try {
            if (history == null || history.isEmpty()) {
                String welcomeMessage = "Xin chào Sen! 🐾 Chào mừng Sen đã đến với **Phòng khám Thú y Rexi** - Nơi yêu thương và chăm sóc các Boss tận tình nhất! 🏥✨\n\n" +
                                        "Rexi là trợ lý AI siêu cấp thông minh của phòng khám. Tại đây, Sen có thể yêu cầu Rexi:\n" +
                                        "📅 **Đặt lịch khám bệnh** nhanh chóng không cần chờ đợi.\n" +
                                        "🐶 **Tạo hồ sơ thú cưng** để theo dõi sức khỏe dễ dàng.\n" +
                                        "🩺 **Tư vấn y tế, sơ cứu** cho các bé mọi lúc mọi nơi.\n\n" +
                                        "Hôm nay Sen cần Rexi hỗ trợ gì cho bé nhà mình ạ? Cứ nhắn tự nhiên nhé!";
                return Map.of("reply", welcomeMessage);
            }

            // BẢO MẬT: Giới hạn mảng lịch sử (Chỉ nhớ 10 tin nhắn gần nhất) để tránh cạn kiệt Token / Tràn RAM
            if (history.size() > 10) {
                history = new ArrayList<>(history.subList(history.size() - 10, history.size()));
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

            // Xác định trạng thái đăng nhập để AI biết đường tư vấn
            boolean isLoggedIn = (realUsername != null);
            String loginContext = isLoggedIn 
                ? "Sen hiện ĐÃ ĐĂNG NHẬP với tài khoản: " + realUsername + ". Bạn CÓ QUYỀN đặt lịch khám ngay cho Sen."
                : "Sen HIỆN CHƯA ĐĂNG NHẬP. Bạn TUYỆT ĐỐI KHÔNG ĐƯỢC trả về tag [AUTO_BOOK]. Nếu Sen muốn đặt lịch, hãy yêu cầu Sen đăng nhập trước nhé.";

            boolean isStaff = false;
            String userRoleName = "Khách hàng";
            if (auth != null) {
                for (org.springframework.security.core.GrantedAuthority ga : auth.getAuthorities()) {
                    String r = ga.getAuthority().replace("ROLE_", "").toUpperCase();
                    if (r.equals("ADMIN") || r.equals("QUAN_LY") || r.equals("BAC_SI") || r.equals("KE_TOAN") || r.equals("TIEP_TAN") || r.equals("Y_TA") || r.equals("STAFF")) {
                        isStaff = true;
                        if (r.equals("ADMIN")) userRoleName = "Quản trị viên";
                        else if (r.equals("QUAN_LY")) userRoleName = "Quản lý";
                        else if (r.equals("BAC_SI")) userRoleName = "Bác sĩ";
                        else if (r.equals("KE_TOAN")) userRoleName = "Kế toán";
                        else if (r.equals("TIEP_TAN")) userRoleName = "Tiếp tân";
                        else if (r.equals("Y_TA")) userRoleName = "Y tá";
                        else if (r.equals("STAFF")) userRoleName = "Nhân viên";
                        break;
                    }
                }
            }

            // Tạo chỉ thị hệ thống tổng hợp (CHUYÊN GIA TOÀN NĂNG)
            String systemPrompt;
            if (isStaff) {
                systemPrompt = "BẠN LÀ BÁC SĨ THÚ Y REXI - ĐỒNG NGHIỆP VÀ TRỢ LÝ HỖ TRỢ CHUYÊN NGHIỆP CỦA PHÒNG KHÁM.\n"
                        + "1. VAI TRÒ: Bạn đang trò chuyện với một thành viên trong đội ngũ nhân viên phòng khám (" + userRoleName + "). Bạn là đồng nghiệp đắc lực hỗ trợ cho họ.\n"
                        + "2. PHẠM VI HỖ TRỢ: Hỗ trợ tra cứu kiến thức chuyên môn y khoa, quy trình làm việc, tư vấn phác đồ điều trị nâng cao, quản lý danh mục thuốc, quy định nghiệp vụ hoặc giải đáp thắc mắc chuyên môn.\n"
                        + "3. PHONG CÁCH: Chuyên nghiệp, đồng nghiệp, hóm hỉnh, tôn trọng và lịch sự. Gọi họ là 'Đồng nghiệp " + userRoleName + "' hoặc xưng hô tên trực tiếp nếu có. Tuyệt đối KHÔNG gọi họ là 'Sen', không xưng hô kiểu bán hàng và không hỏi thú cưng/boss nhà họ thế nào (trừ khi họ tự đề cập).\n"
                        + "4. HOTLINE & ĐỊA CHỈ: Dùng số hotline phòng khám: 0353.374.156 và địa chỉ: Gia Lâm, Hà Nội khi đồng nghiệp cần thông tin để cung cấp cho khách hàng.\n"
                        + "5. SƠ CỨU KHẨN CẤP (HEIMLICH): Sẵn sàng cung cấp hướng dẫn sơ cứu nhanh cho đồng nghiệp khi có ca khẩn cấp.\n"
                        + "\n--- BỐI CẢNH PHÒNG KHÁM & TÀI LIỆU ---\n"
                        + userContext;
            } else {
                systemPrompt = "BẠN LÀ BÁC SĨ THÚ Y REXI - CHUYÊN GIA TOÀN NĂNG TRONG LĨNH VỰC CHĂM SÓC THÚ CƯNG.\n"
                        + "1. PHẠM VI TRI THỨC: Bạn có kiến thức sâu rộng về MỌI mặt của thú y: Y khoa (bệnh lý, điều trị), Dinh dưỡng, Hành vi, Chăm sóc hằng ngày. Đừng ngần ngại tư vấn chi tiết cho Sen bất kể câu hỏi là gì.\n"
                        + "2. NGUỒN TRI THỨC: \n"
                        + "   - Nếu Sen hỏi về các chủ đề có trong [TÀI LIỆU CHUYÊN MÔN REXI] bên dưới, bạn BẮT BUỘC phải trả lời theo đúng tài liệu đó.\n"
                        + "   - Với mọi câu hỏi khác, hãy sử dụng kho tri thức thú y khổng lồ mà bạn đã được huấn luyện để tư vấn một cách chuyên nghiệp, chính xác và đầy yêu thương.\n"
                        + "3. HOTLINE & ĐỊA CHỈ: Luôn dùng số điện thoại: 0353.374.156 và địa chỉ: Gia Lâm, Hà Nội khi khách cần liên hệ hoặc trong trường hợp khẩn cấp.\n"
                        + "4. PHONG CÁCH: Một bác sĩ thông thái, hóm hỉnh, luôn gọi khách là 'Sen' và thú cưng là 'Bé/Boss'.\n"
                        + "5. SƠ CỨU KHẨN CẤP (HEIMLICH): Nếu khách báo thú cưng bị hóc dị vật/nghẹt thở, BẮT BUỘC bắt đầu bằng tag [EMERGENCY] và hướng dẫn thủ thuật Heimlich: Chó/mèo nhỏ (Giữ hông, dốc ngược, vỗ 5 lần vào giữa 2 bả vai); Chó lớn (Đứng từ phía sau, vòng tay ôm vùng bụng ngay dưới xương sườn, giật mạnh hướng lên trên). Khuyên đưa đến phòng khám ngay lập tức.\n"
                        + "6. ĐẶT LỊCH HẸN: " + loginContext + " Khi Sen chốt lịch, BẮT BUỘC in ra chuỗi [AUTO_BOOK:Ngày|Giờ|TênThúCưng|DịchVụ|TênBácSĩ]. Định dạng ngày YYYY-MM-DD, giờ HH:mm.\n"
                        + "\n--- DỮ LIỆU CÁ NHÂN CỦA SEN ---\n"
                        + userContext;
            }

            ChatMessage systemMsg = new ChatMessage();
            systemMsg.setRole("system");
            systemMsg.setContent(systemPrompt);
            history.add(0, systemMsg);

            ChatMessage latest = history.get(history.size() - 1);
            boolean hasVideo = latest.getVideos() != null && !latest.getVideos().isEmpty();

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
            return Map.of("reply",
                    "Sen ơi, não bộ của Rexi đang được bảo trì nâng cấp xíu nên hơi lác. Sen đợi một chút rồi thử lại nha! 🛠️🐾");
        }
    }
}
