package com.rexi.pkty.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rexi.pkty.dto.ChatMessage;
import com.rexi.pkty.entity.LichSuTuVan;
import com.rexi.pkty.repository.LichSuTuVanRepository;
import com.rexi.pkty.service.GroqService;
import com.rexi.pkty.service.GeminiService;
import com.rexi.pkty.service.OpenRouterService;
import com.rexi.pkty.service.AiMemoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.logging.Logger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import jakarta.servlet.http.HttpServletRequest;
import java.util.concurrent.ConcurrentHashMap;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Locale;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private static final Logger logger = Logger.getLogger(ChatController.class.getName());

    @Autowired
    private GroqService groqService;

    @Autowired
    private GeminiService geminiService;

    @Autowired
    private OpenRouterService openRouterService;

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
                String welcomeMessage = "Xin chào Sen! 🐾 Chào mừng Sen đến với **Phòng khám Thú y Rexi**! 🏥✨\n\n" +
                                        "Rexi có thể giúp Sen:\n" +
                                        "📅 **Đặt lịch khám** nhanh gọn.\n" +
                                        "🐶 **Tạo hồ sơ thú cưng**.\n" +
                                        "🩺 **Tư vấn y tế & sơ cứu** cho bé.\n\n" +
                                        "Sen cần Rexi hỗ trợ gì hôm nay ạ?";
                return Map.of("reply", welcomeMessage);
            }

            // BẢO MẬT: Giới hạn mảng lịch sử (Nhớ 40 tin nhắn gần nhất) để ngữ cảnh hội thoại đủ dài và phong phú
            if (history.size() > 40) {
                history = new ArrayList<>(history.subList(history.size() - 40, history.size()));
            }

            // Lấy nội dung câu hỏi cuối cùng của khách hàng
            ChatMessage lastMsg = history.get(history.size() - 1);
            String userQuery = lastMsg.getContent() != null ? lastMsg.getContent() : "";
            String normalizedUserQuery = normalizeVietnamese(userQuery.toLowerCase());

            // BẢO MẬT: Chặn đứng các đoạn chat siêu dài (Tránh tấn công Token Exhaustion)
            if (userQuery.length() > 1000) {
                return Map.of("reply",
                        "Sen ơi tin nhắn hơi dài quá òi! 😿 Sen tóm tắt lại tình trạng của bé ngắn gọn (dưới 1000 ký tự) để Rexi đọc và tư vấn chuẩn xác nhất nha!");
            }

            if (isEmergencyQuery(normalizedUserQuery)) {
                return Map.of("reply", buildEmergencyReply(normalizedUserQuery));
            }

            // Lấy bối cảnh dữ liệu THÔNG MINH (Cần gì lấy nấy dựa trên userQuery)
            String userContext = aiMemoryService.getUserContext(realUsername);
            String knowledgeContext = aiMemoryService.getKnowledgeBaseContext(userQuery);
            // Inject dữ liệu phòng khám thực tế theo RAG định tuyến từ khóa thông minh
            String globalContext = aiMemoryService.getGlobalContext(userQuery);
            String webSearchContext = "";

            // Đọc các Header bối cảnh DOM từ frontend truyền qua
            String rawPath = request.getHeader("X-Current-Path");
            String rawDomContext = request.getHeader("X-Current-DOM-Context");
            String rawActivityLogs = request.getHeader("X-User-Activity-Logs");
            
            String currentPath = "/";
            String currentDomContext = "Không có bối cảnh giao diện.";
            String currentActivityLogs = "Không có nhật ký hành động gần đây.";
            
            if (rawPath != null && !rawPath.isEmpty()) {
                try {
                    currentPath = java.net.URLDecoder.decode(rawPath, java.nio.charset.StandardCharsets.UTF_8);
                } catch (Exception e) {
                    logger.warning("Không thể giải mã X-Current-Path: " + e.getMessage());
                }
            }
            
            if (rawDomContext != null && !rawDomContext.isEmpty()) {
                try {
                    currentDomContext = java.net.URLDecoder.decode(rawDomContext, java.nio.charset.StandardCharsets.UTF_8);
                } catch (Exception e) {
                    logger.warning("Không thể giải mã X-Current-DOM-Context: " + e.getMessage());
                }
            }

            if (rawActivityLogs != null && !rawActivityLogs.isEmpty()) {
                try {
                    currentActivityLogs = java.net.URLDecoder.decode(rawActivityLogs, java.nio.charset.StandardCharsets.UTF_8);
                } catch (Exception e) {
                    logger.warning("Không thể giải mã X-User-Activity-Logs: " + e.getMessage());
                }
            }
            
            String domContextBlock = "\n--- THÔNG TIN TRANG & BỐI CẢNH GIAO DIỆN (EYES & DOM CONTEXT) ---\n"
                    + "Người dùng hiện đang ở màn hình: " + currentPath + "\n"
                    + "Các dữ liệu chỉ số, bảng biểu và phần tử tương tác (Interactive Elements) có thuộc tính data-ai-id đang hiển thị trên màn hình hiện tại:\n"
                    + ">>> " + currentDomContext + "\n\n"
                    + "LỊCH SỬ THAO TÁC VÀ HÀNH VI GẦN ĐÂY CỦA NGƯỜI DÙNG VỚI MÀN HÌNH (Thời gian thực):\n"
                    + ">>> " + currentActivityLogs + "\n\n"
                    + "HƯỚNG DẪN AUTOPILOT (LÁI TỰ ĐỘNG THAO TÁC TRỰC QUAN):\n"
                    + "1. Bạn có quyền điều khiển trình duyệt của người dùng để thực hiện các thao tác click, điền form, chọn select, bấm nút. Để thực hiện, hãy trả về các thẻ lệnh Autopilot dạng sau ở cuối câu trả lời của bạn:\n"
                    + "   - Click một phần tử: [CLICK:data-ai-id]\n"
                    + "   - Điền giá trị vào ô input/textarea: [FILL:data-ai-id|giá_trị_cần_điền]\n"
                    + "   - Chọn tùy chọn của thẻ select: [SELECT:data-ai-id|giá_trị_option]\n"
                    + "   - Bật/tắt nút toggle: [TOGGLE:data-ai-id]\n"
                    + "   - Xác nhận xóa: [DELETE:data-ai-id]\n"
                    + "2. CHỈ ĐƯỢC PHÉP sử dụng các giá trị data-ai-id thực sự tồn tại trong danh sách 'Interactive Elements' hiển thị ở bối cảnh giao diện trên. Tuyệt đối KHÔNG tự nghĩ ra data-ai-id không tồn tại.\n"
                    + "3. Ví dụ: Nếu người dùng ở trang Đặt lịch hẹn (/khach-hang/dat-lich-hen) và nhờ bạn đặt lịch giúp hoặc điền giúp, bạn hãy phân tích các data-ai-id của thú cưng, dịch vụ, ngày, giờ rảnh, ghi chú và xuất ra chuỗi thẻ lệnh Autopilot liên tiếp như:\n"
                    + "   \"Dạ để tôi giúp Sen chọn thú cưng, chọn dịch vụ khám và điền thông tin đặt lịch nhé! [SELECT:select-datlichhen-688p|id_thú_cưng_của_sen] [CLICK:div-datlichhen-service-id_dịch_vụ] [FILL:input-datlichhen-mc0h|2026-05-20] [CLICK:button-datlichhen-rvj4_giờ_khám] [FILL:textarea-datlichhen-note|Triệu chứng của bé] [CLICK:button-datlichhen-66iq]\"\n"
                    + "4. THÔNG TIN CHẨN ĐOÁN VÀ ĐIỀU TRỊ Y KHOA: Khi người dùng hoặc bác sĩ hỏi về thông tin chẩn đoán, cách hoạt động của thuốc, phác đồ điều trị, bạn phải cung cấp thông tin y khoa chính xác cao. ĐẶC BIỆT, TUYỆT ĐỐI không tự bịa ra link URL tham khảo giả mạo. Chỉ trích dẫn link nguồn thực tế nếu nguồn tin có sẵn hoặc nếu bạn tìm kiếm web thực tế trả về các URL thật uy tín (như Vinmec, Pethealth, WHO). Nếu không có, tuyệt đối KHÔNG đưa link bịa.\n"
                    + "6. PHÁT HIỆN LỖI SAI VÀ TỰ ĐỘNG SỬA (AUTOPILOT ERROR CORRECTION):\n"
                    + "   Bạn phải giám sát dữ liệu người dùng nhập so với bối cảnh màn hình (DOM Context). Nếu phát hiện họ nhập sai (ví dụ: gõ sai ngày khám, thiếu thông tin bắt buộc, sai chính tả tên thuốc/dịch vụ), hãy thực hiện đủ 3 bước:\n"
                    + "   - Chỉ ra lỗi sai một cách tinh tế, nhẹ nhàng.\n"
                    + "   - Nói: 'Để Rexi tự động sửa lỗi và điền lại giúp Sen nhé'.\n"
                    + "   - TUYỆT ĐỐI PHẢI phát ra chuỗi lệnh Autopilot như [FILL:data-ai-id|giá_trị_đúng] hoặc [SELECT:data-ai-id|giá_trị_đúng] ngay cuối câu.\n"
                    + "5. Hãy phân tích LỊCH SỬ THAO TÁC gần đây để thấu hiểu người dùng vừa thực hiện thao tác gì, vừa nhấp chuột ở đâu, có gặp lỗi hay cuộn trang ở đâu không để tư vấn và chủ động gợi ý hỗ trợ thông minh, tinh tế nhất.\n";

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

            String systemPrompt;
            if (isStaff) {
                systemPrompt = "BẠN LÀ BÁC SĨ THÚ Y REXI - ĐỒNG NGHIỆP VÀ TRỢ LÝ HỖ TRỢ CHUYÊN NGHIỆP CỦA PHÒNG KHÁM.\n"
                        + "1. VAI TRÒ: Bạn đang trò chuyện với một thành viên trong đội ngũ nhân viên phòng khám (" + userRoleName + "). Bạn là đồng nghiệp đắc lực hỗ trợ cho họ.\n"
                        + "2. PHẠM VI HỖ TRỢ: Hỗ trợ tra cứu kiến thức chuyên môn y khoa, quy trình làm việc, tư vấn phác đồ điều trị nâng cao, quản lý danh mục thuốc, quy định nghiệp vụ hoặc giải đáp thắc mắc chuyên môn.\n"
                        + "3. PHONG CÁCH: Chuyên nghiệp, đồng nghiệp, ngắn gọn, súc tích, không vòng vo. Gọi họ là 'sếp' hoặc 'đồng nghiệp'. Tuyệt đối KHÔNG gọi họ là 'Sen', không xưng hô kiểu bán hàng.\n"
                        + "4. HOTLINE & ĐỊA CHỈ: Dùng số hotline phòng khám: 0353.374.156 và địa chỉ: Gia Lâm, Hà Nội khi đồng nghiệp cần thông tin.\n"
                        + "5. SƠ CỨU KHẨN CẤP (HEIMLICH): Sẵn sàng cung cấp hướng dẫn sơ cứu nhanh khi có ca khẩn cấp.\n"
                        + "6. QUY TẮC QUAN TRỌNG NHẤT - ƯU TIÊN TRẢ LỜI TRỰC TIẾP:\n"
                        + "   Khi đồng nghiệp đặt câu hỏi bất kỳ (ví dụ: 'khóa tài khoản khách hàng thì sao?', 'làm thế nào để thêm nhân viên?'...), bạn BẮT BUỘC phải TRẢ LỜI THẲNG VÀO NỘI DUNG CÂU HỎI trước. TUYỆT ĐỐI KHÔNG tự nhảy vào chế độ Autopilot/điều hướng khi đồng nghiệp chỉ hỏi thông tin.\n"
                        + "7. BẢO MẬT & TRUY CẬP DỮ LIỆU (CỰC KỲ QUAN TRỌNG):\n"
                        + "   Ở chế độ chat này, bạn KHÔNG CÓ CÔNG CỤ TRUY CẬP TRỰC TIẾP VÀO DATABASE để tìm khách hàng, bệnh án, hóa đơn... Nếu đồng nghiệp yêu cầu tìm kiếm dữ liệu (ví dụ: 'có khách hàng nào tên X không?'), TUYỆT ĐỐI KHÔNG BỊA ĐẶT DỮ LIỆU HOẶC BÁO KHÔNG TÌM THẤY. Bắt buộc phải trả lời: 'Dạ sếp ơi, ở chế độ Trợ lý cơ bản này em chưa được gắn công cụ tra cứu Database. Sếp vui lòng bấm sang tab **Tác vụ Agent v2** ở góc trên cùng của khung chat để em dùng công cụ AI Level 5 quét dữ liệu thực tế cho sếp nhé!'.\n"
                        + "8. QUY TẮC ĐIỀU HƯỚNG TÁC VỤ NGHIÊM NGẶT (STRICT NAVIGATION GATE):\n"
                        + "   TUYỆT ĐỐI CẤM sử dụng thẻ [NAVIGATE] khi đồng nghiệp hỏi các câu hỏi đóng. Bạn CHỈ ĐƯỢC PHÉP dùng thẻ [NAVIGATE] nếu đồng nghiệp sử dụng động từ chỉ định mệnh lệnh rõ ràng (ví dụ: 'mở trang...', 'đưa tôi đến...', 'chuyển sang...'). Danh sách đường dẫn hợp lệ:\n"
                        + "   - Quản lý Nhân viên/Thêm nhân sự/Phân quyền: /quan-ly/nhan-vien-phan-quyen\n"
                        + "   - Bảng điều khiển Quản lý nội bộ: /quan-ly/dashboard\n"
                        + "   - Quản lý Khách hàng & Thú cưng: /quan-ly/khach-hang-thu-cung\n"
                        + "   - Quản lý Lịch hẹn khám: /quan-ly/lich-hen\n"
                        + "   - Quản lý Lịch làm việc Bác sĩ: /quan-ly/lich-lam-viec\n"
                        + "   - Quản lý Hồ sơ bệnh án: /quan-ly/ho-so-benh-an\n"
                        + "   - Phân hệ Khám bệnh Bác sĩ: /quan-ly/kham-benh\n"
                        + "   - Quản lý Đơn thuốc: /quan-ly/don-thuoc\n"
                        + "   - Quản lý Tài liệu đính kèm: /quan-ly/file-dinh-kem\n"
                        + "   - Thông tin cá nhân nhân viên: /quan-ly/thong-tin-ca-nhan\n"
                        + "   - Quản lý Hóa đơn & Thu phí: /quan-ly/hoa-don\n"
                        + "   - Bảng điều khiển Kế toán: /quan-ly/ke-toan\n"
                        + "   - Báo cáo tài chính & Thống kê doanh thu: /quan-ly/bao-cao-thong-ke\n"
                        + "   - Quản lý Nhập kho thuốc: /quan-ly/nhap-kho\n"
                        + "   - Quản lý Kho thuốc & Vật tư: /quan-ly/kho-thuoc\n"
                        + "   - Cấu hình hệ thống: /quan-ly/cau-hinh\n"
                        + "   - Quản lý chức năng: /quan-ly/chuc-nang\n"
                        + "   - Quản lý Dịch vụ: /quan-ly/dich-vu\n"
                        + "   - Quản lý Xét nghiệm: /quan-ly/xet-nghiem\n"
                        + "   - Chiến dịch Email Marketing: /quan-ly/marketing\n"
                        + "\n--- DỮ LIỆU PHÒNG KHÁM THỰC TẾ (BÁC SĨ, DỊCH VỤ, BẢNG GIÁ) ---\n"
                        + globalContext
                        + "\n--- BỐI CẢNH NGƯỜI DÙNG & TÀI LIỆU ---\n"
                        + userContext
                        + "\n" + knowledgeContext
                        + "\n" + webSearchContext
                        + domContextBlock;
            } else {
                systemPrompt = "BẠN LÀ BÁC SĨ THÚ Y REXI - CHUYÊN GIA TOÀN NĂNG TRONG LĨNH VỰC CHĂM SÓC THÚ CƯNG.\n"
                        + "1. PHẠM VI TRI THỨC: Bạn có kiến thức sâu rộng về MỌI mặt của thú y: Y khoa (bệnh lý, điều trị), Dinh dưỡng, Hành vi, Chăm sóc hằng ngày. Đừng ngần ngại tư vấn chi tiết cho Sen bất kể câu hỏi là gì.\n"
                        + "2. NGUỒN TRI THỨC: \n"
                        + "   - Nếu Sen hỏi về các chủ đề có trong [TÀI LIỆU CHUYÊN MÔN REXI] bên dưới, bạn BẮT BUỘC phải trả lời theo đúng tài liệu đó.\n"
                        + "   - Với mọi câu hỏi khác, hãy sử dụng kho tri thức thú y khổng lồ mà bạn đã được huấn luyện để tư vấn một cách chuyên nghiệp, chính xác và đầy yêu thương.\n"
                        + "3. HOTLINE & ĐỊA CHỈ: Luôn dùng số điện thoại: 0353.374.156 và địa chỉ: Gia Lâm, Hà Nội khi khách cần liên hệ hoặc trong trường hợp khẩn cấp.\n"
                        + "4. PHONG CÁCH: Một bác sĩ thông thái, hóm hỉnh, luôn gọi khách là 'Sen' và thú cưng là 'Bé/Boss'.\n"
                        + "5. SƠ CỨU KHẨN CẤP (HEIMLICH, NGỘ ĐỘC, TAI NẠN, CHẢY MÁU): Khi Sen hỏi về tình trạng khẩn cấp, KHÔNG dọa dẫm gây hoảng loạn. BẮT BUỘC bắt đầu bằng tag [EMERGENCY], hướng dẫn sơ cứu cơ bản trước, sau đó CHỦ ĐỘNG HỎI VỊ TRÍ của Sen để chỉ hướng đến phòng khám gần nhất.\n"
                        + "6. ĐẶT LỊCH HẸN: " + loginContext + " Khi Sen chốt lịch, BẮT BUỘC in ra chuỗi [AUTO_BOOK:Ngày|Giờ|TênThúCưng|DịchVụ|TênBácSĩ]. Định dạng ngày YYYY-MM-DD, giờ HH:mm.\n"
                        + "7. THU THẬP TIỂU SỬ THÚ CƯNG: Bắt buộc chủ động hỏi Sen về Giống (chó/mèo/...), Độ tuổi và Cân nặng của thú cưng nếu chưa có thông tin, để đưa ra tư vấn sát thực tế nhất.\n"
                        + "8. TRÁNH KÊ ĐƠN THUỐC TÙY TIỆN: Chỉ tư vấn dinh dưỡng, hành vi, và hướng dẫn sơ cứu. TUYỆT ĐỐI KHÔNG TỰ TIỆN KÊ ĐƠN THUỐC.\n"
                        + "9. TRUY CẬP DỮ LIỆU HỆ THỐNG (CỰC KỲ QUAN TRỌNG):\n"
                        + "   Ở chế độ này, bạn KHÔNG CÓ CÔNG CỤ tra cứu CSDL (tìm khách hàng, bệnh án). Nếu Sen yêu cầu tra cứu thông tin cụ thể trong hệ thống, TUYỆT ĐỐI KHÔNG BỊA ĐẶT DỮ LIỆU HOẶC TỰ NHẬN LÀ KHÔNG TÌM THẤY. Bắt buộc trả lời: 'Dạ Sen ơi, ở chế độ này em không thể xem dữ liệu hệ thống ạ. Sen bấm chuyển sang tab **Tác vụ Agent v2** ở trên cùng khung chat để em dùng siêu năng lực quét dữ liệu thực tế giúp Sen nha!'.\n"
                        + "10. QUY TẮC ĐIỀU HƯỚNG TÁC VỤ NGHIÊM NGẶT (STRICT NAVIGATION GATE):\n"
                        + "   TUYỆT ĐỐI CẤM sử dụng thẻ [NAVIGATE] khi người dùng hỏi các câu hỏi đóng. Bạn CHỈ ĐƯỢC PHÉP dùng thẻ [NAVIGATE] nếu người dùng sử dụng động từ chỉ định mệnh lệnh rõ ràng (ví dụ: 'mở trang quản lý thú cưng', 'chuyển sang đặt lịch hẹn khám'...), bạn BẮT BUỘC phải đính kèm thẻ lệnh dạng [NAVIGATE:đường_dẫn] ở cuối câu trả lời của bạn. Dưới đây là danh sách đường dẫn hợp lệ:\n"
                        + "   - Bảng điều khiển Khách hàng: /khach-hang/dashboard\n"
                        + "   - Quản lý thú cưng: /khach-hang/quan-ly-thu-cung\n"
                        + "   - Đặt lịch hẹn khám: /khach-hang/dat-lich-hen\n"
                        + "   - Lịch sử lịch hẹn: /khach-hang/lich-su-lich-hen\n"
                        + "   - Hồ sơ bệnh án thú cưng: /khach-hang/ho-so-benh-an\n"
                        + "   - Hóa đơn & thanh toán: /khach-hang/hoa-don-thanh-toan\n"
                        + "   - Thông tin cá nhân Sen: /khach-hang/thong-tin-ca-nhan\n"
                        + "\n11. NGUỒN THAM KHẢO TÌM KIẾM WEB (NẾU CÓ):"
                        + "\n   Khi trả lời dựa trên kết quả tìm kiếm web, bạn BẮT BUỘC phải trích dẫn link nguồn rõ ràng bằng định dạng Markdown thân thiện dạng: [Tên Nguồn](Link) để Sen bấm vào xem được."
                        + "\n--- DỮ LIỆU PHÒNG KHÁM THỰC TẾ (BÁC SĨ, DỊCH VỤ, BẢNG GIÁ) ---\n"
                        + globalContext
                        + "\n--- DỮ LIỆU CÁ cá nhân CỦA SEN ---\n"
                        + userContext
                        + "\n" + knowledgeContext
                        + "\n" + webSearchContext
                        + domContextBlock;
            }
ChatMessage systemMsg = new ChatMessage();
            systemMsg.setRole("system");
            systemMsg.setContent(systemPrompt);
            history.add(0, systemMsg);

            ChatMessage latest = history.get(history.size() - 1);
            boolean hasVideo = latest.getVideos() != null && !latest.getVideos().isEmpty();
            boolean hasImage = latest.getImages() != null && !latest.getImages().isEmpty();
            boolean hasMedia = hasVideo || hasImage;

            // Phân tích từ khóa để định tuyến thông minh dựa trên thế mạnh của từng AI
            String userQueryStr = latest.getContent() != null ? latest.getContent() : "";
            String normalizedQuery = normalizeVietnamese(userQueryStr.toLowerCase());

            // Tập hợp từ khóa y tế mở rộng bao gồm cả viết tắt, tiếng lóng, từ địa phương và gõ sai bộ gõ telex
            String[] medicalKeywords = {
                "benh", "trieu chung", "trieu chuong", "thuoc", "thuooc", "dau", "daau", "sot", "soot", 
                "non", "tieu chay", "tieu chai", "dieu tri", "chan doan", "toa thuoc", "ke don", "suc khoe", 
                "kham", "bnh", "bsi", "bac si", "bac sy", "cap cuu", "tai nan", "chong mat", "oi", "ia", "phan", "cut"
            };
            boolean isMedicalQuery = false;
            for (String kw : medicalKeywords) {
                if (normalizedQuery.contains(kw)) {
                    isMedicalQuery = true;
                    break;
                }
            }

            String reply;
            // LUỒNG ĐỊNH TUYẾN THÔNG MINH (INTELLIGENT AI ROUTING)
            if (hasMedia) {
                // 🎥/🖼️ THẾ MẠNH CỦA GEMINI: Đa phương tiện (Video, Hình ảnh)
                logger.info("[AI ROUTER] Định tuyến câu hỏi Media sang: Gemini");
                try {
                    reply = geminiService.chat(history);
                } catch (Exception geminiEx) {
                    logger.warning("[AI ROUTER] Gemini lỗi, chuyển hướng dự phòng sang: OpenRouter (DeepSeek V4)...");
                    reply = openRouterService.chat(history);
                }
            } else if (isMedicalQuery) {
                // 🩺 THẾ MẠNH CỦA DEEPSEEK V4: Tư duy Y khoa, Logic và Chẩn đoán
                logger.info("[AI ROUTER] Định tuyến câu hỏi Tư vấn Y tế sang: OpenRouter (DeepSeek V4)");
                try {
                    reply = openRouterService.chat(history);
                } catch (Exception openRouterEx) {
                    logger.warning("[AI ROUTER] OpenRouter lỗi, chuyển hướng dự phòng sang: Gemini...");
                    try {
                        reply = geminiService.chat(history);
                    } catch (Exception geminiEx) {
                        logger.warning("[AI ROUTER] Gemini lỗi, chuyển hướng dự phòng cuối cùng sang: Groq...");
                        reply = groqService.chat(history);
                    }
                }
            } else {
                // 💬 THẾ MẠNH CỦA GROQ (LLAMA 3.3): Chat FAQ, Lịch khám, Autopilot siêu tốc
                logger.info("[AI ROUTER] Định tuyến câu hỏi Chat/Autopilot thông thường sang: Groq");
                try {
                    reply = groqService.chat(history);
                } catch (Exception groqException) {
                    logger.warning("[AI ROUTER] Groq lỗi, chuyển hướng dự phòng sang: Gemini...");
                    try {
                        reply = geminiService.chat(history);
                    } catch (Exception geminiException) {
                        logger.warning("[AI ROUTER] Gemini lỗi, chuyển hướng dự phòng cuối cùng sang: OpenRouter (DeepSeek V4)...");
                        reply = openRouterService.chat(history);
                    }
                }
            }

            reply = sanitizeChatReply(reply);

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
                logger.severe("Không thể lưu lịch sử tư vấn: " + logEx.getMessage());
            }

            return Map.of("reply", reply);
        } catch (Exception e) {
            logger.severe("Chat API error: " + e.getMessage());
            String errorCode = classifyAiRuntimeError(e);
            return Map.of(
                    "reply", buildRoleAwareAiErrorReply(errorCode),
                    "errorCode", errorCode);
        }
    }

    private String classifyAiRuntimeError(Exception e) {
        String message = e.getMessage() == null ? "" : e.getMessage().toLowerCase(Locale.ROOT);
        if (message.contains("429") || message.contains("quota") || message.contains("rate limit")
                || message.contains("too many requests")) {
            return "quota_exceeded";
        }
        if (message.contains("401") || message.contains("403") || message.contains("api key")
                || message.contains("unauthorized") || message.contains("không tìm thấy") && message.contains("key")) {
            return "invalid_api_key";
        }
        if (message.contains("timeout") || message.contains("timed out")) {
            return "timeout";
        }
        if (message.contains("model not found") || message.contains("404")) {
            return "model_not_found";
        }
        if (message.contains("model") || message.contains("unsupported")) {
            return "model_not_supported";
        }
        return "ai_provider_unavailable";
    }

    private String buildRoleAwareAiErrorReply(String errorCode) {
        String role = currentRoleText();
        boolean isAdmin = role.contains("ADMIN");
        boolean isManager = role.contains("QUAN_LY");
        boolean isStaff = role.contains("BAC_SI") || role.contains("TIEP_TAN") || role.contains("Y_TA")
                || role.contains("KE_TOAN") || role.contains("NHAN_VIEN") || role.contains("STAFF");

        if (isAdmin) {
            return switch (errorCode) {
                case "quota_exceeded" -> "AI Provider đang hết quota hoặc bị giới hạn tốc độ. Admin vào Cấu hình hệ thống > AI Provider để bấm kiểm tra từng provider, đổi key, nâng quota hoặc chuyển model dự phòng.";
                case "invalid_api_key" -> "API key AI không hợp lệ, bị thu hồi hoặc chưa cấu hình. Rexi không hiển thị key thô; Admin vui lòng cập nhật key trong Cấu hình hệ thống và bấm kiểm tra kết nối.";
                case "model_not_found", "model_not_supported" -> "Model AI đang chọn không tồn tại hoặc không được key hiện tại hỗ trợ. Admin vui lòng đổi model trong Cấu hình hệ thống rồi kiểm tra lại.";
                case "timeout" -> "AI Provider phản hồi quá lâu hoặc mạng provider đang nghẽn. Admin có thể kiểm tra trạng thái từng provider và chuyển sang provider/model dự phòng.";
                default -> "Dịch vụ AI đang không khả dụng. Admin vào Cấu hình hệ thống > AI Provider để xem provider, model và mã lỗi kiểm tra kết nối.";
            };
        }

        if (isManager) {
            return switch (errorCode) {
                case "quota_exceeded" -> "Dịch vụ AI đang hết quota hoặc bị giới hạn sử dụng. Quản lý vui lòng kiểm tra gói dịch vụ/model trong Cấu hình hệ thống hoặc báo Admin đổi provider dự phòng.";
                case "invalid_api_key" -> "Cấu hình API key AI đang lỗi. Vui lòng báo Admin cập nhật key mới; Rexi không hiển thị key vì lý do bảo mật.";
                case "model_not_found", "model_not_supported" -> "Model AI đang cấu hình không khả dụng. Quản lý vui lòng báo Admin đổi model hoặc provider khác.";
                case "timeout" -> "AI đang phản hồi chậm hoặc timeout. Vui lòng thử lại sau ít phút hoặc chuyển thao tác sang quy trình thủ công.";
                default -> "Dịch vụ AI đang gián đoạn. Quản lý vui lòng kiểm tra Cấu hình hệ thống hoặc báo Admin.";
            };
        }

        if (isStaff) {
            return "Dịch vụ AI đang gián đoạn nên Rexi chưa thể hỗ trợ tự động lúc này. Anh/chị vẫn thao tác thủ công trên hệ thống; với tình huống y tế, vui lòng xử lý theo quy trình lâm sàng và thử AI lại sau.";
        }

        return "Hiện hệ thống AI đang tạm quá tải hoặc gián đoạn. Sen thử lại sau ít phút nhé. Nếu bé có dấu hiệu khẩn cấp, vui lòng gọi hotline phòng khám ngay.";
    }

    private String currentRoleText() {
        try {
            var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            return auth == null ? "" : auth.getAuthorities().toString().toUpperCase(Locale.ROOT);
        } catch (Exception ignored) {
            return "";
        }
    }

    private String sanitizeChatReply(String reply) {
        if (reply == null) {
            return "";
        }
        String cleaned = reply.trim();

        Pattern fencePattern = Pattern.compile("(?s)```(?:json)?\\s*([\\[{][\\s\\S]*?[\\]}])\\s*```", Pattern.CASE_INSENSITIVE);
        Matcher fenceMatcher = fencePattern.matcher(cleaned);
        if (fenceMatcher.find()) {
            String beforeText = cleaned.substring(0, fenceMatcher.start()).trim();
            String jsonPayload = fenceMatcher.group(1).trim();
            String extracted = extractTextFromJson(jsonPayload);
            if (!beforeText.isEmpty()) {
                return extracted.isEmpty() ? beforeText : beforeText + "\n\n" + extracted;
            }
            if (!extracted.isEmpty()) {
                return extracted;
            }
        }

        if (cleaned.startsWith("{") || cleaned.startsWith("[")) {
            String extracted = extractTextFromJson(cleaned);
            if (!extracted.isEmpty()) {
                return extracted;
            }
        }

        return cleaned;
    }

    private String extractTextFromJson(String jsonText) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode node = mapper.readTree(jsonText);
            if (node.has("reply") && node.get("reply").isTextual()) {
                return node.get("reply").asText();
            }
            if (node.has("final_answer") && node.get("final_answer").isTextual()) {
                return node.get("final_answer").asText();
            }
            if (node.has("text") && node.get("text").isTextual()) {
                return node.get("text").asText();
            }
            if (node.has("message") && node.get("message").isTextual()) {
                return node.get("message").asText();
            }
            if (node.isTextual()) {
                return node.asText();
            }
            if (node.isObject() && node.size() == 1) {
                JsonNode onlyValue = node.elements().next();
                if (onlyValue.isTextual()) {
                    return onlyValue.asText();
                }
            }
        } catch (Exception ignored) {
        }
        return "";
    }

    private List<Map<String, String>> searchWebDuckDuckGo(String query) {
        List<Map<String, String>> results = new java.util.ArrayList<>();
        try {
            String encodedQuery = java.net.URLEncoder.encode(query, "UTF-8");
            String urlStr = "https://html.duckduckgo.com/html/";
            String postData = "q=" + encodedQuery;

            java.net.URL url = new java.net.URL(urlStr);
            java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setDoOutput(true);
            conn.setRequestProperty("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
            conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");

            try (java.io.OutputStream os = conn.getOutputStream()) {
                os.write(postData.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            }

            StringBuilder response = new StringBuilder();
            try (java.io.BufferedReader in = new java.io.BufferedReader(
                    new java.io.InputStreamReader(conn.getInputStream(), java.nio.charset.StandardCharsets.UTF_8))) {
                String line;
                while ((line = in.readLine()) != null) {
                    response.append(line).append("\n");
                }
            }

            String html = response.toString();

            // Regex patterns to match results in DuckDuckGo HTML Lite
            java.util.regex.Pattern titlePattern = java.util.regex.Pattern.compile(
                "<a rel=\"nofollow\" class=\"result__a\" href=\"([^\"]+)\">([^<]+)</a>"
            );
            java.util.regex.Pattern snippetPattern = java.util.regex.Pattern.compile(
                "<a class=\"result__snippet\"[^>]*>(.*?)</a>"
            );

            java.util.regex.Matcher titleMatcher = titlePattern.matcher(html);
            java.util.regex.Matcher snippetMatcher = snippetPattern.matcher(html);

            List<String> urls = new java.util.ArrayList<>();
            List<String> titles = new java.util.ArrayList<>();
            while (titleMatcher.find()) {
                urls.add(titleMatcher.group(1).trim());
                titles.add(titleMatcher.group(2).trim());
            }

            List<String> snippets = new java.util.ArrayList<>();
            while (snippetMatcher.find()) {
                String snippetHtml = snippetMatcher.group(1);
                String snippetText = snippetHtml.replaceAll("<[^>]+>", "").trim();
                snippets.add(snippetText);
            }

            for (int i = 0; i < urls.size() && i < 5; i++) {
                Map<String, String> item = new java.util.HashMap<>();
                item.put("url", urls.get(i));
                item.put("title", titles.get(i));
                item.put("snippet", i < snippets.size() ? snippets.get(i) : "");
                results.add(item);
            }
        } catch (Exception e) {
            logger.severe("Lỗi khi tìm kiếm DuckDuckGo: " + e.getMessage());
        }
        return results;
    }

    private String normalizeVietnamese(String input) {
        if (input == null) return "";
        return input
                .replaceAll("[àáạảãâầấậẩẫăằắặẳẵ]", "a")
                .replaceAll("[èéẹẻẽêềếệểễ]", "e")
                .replaceAll("[ìíịỉĩ]", "i")
                .replaceAll("[òóọỏõôồốộổỗơờớợởỡ]", "o")
                .replaceAll("[ùúụủũưừứựửữ]", "u")
                .replaceAll("[ỳýỵỷỹ]", "y")
                .replaceAll("[đ]", "d");
    }

    private boolean isEmergencyQuery(String normalizedQuery) {
        if (normalizedQuery == null || normalizedQuery.isBlank()) {
            return false;
        }
        String[] emergencyKeywords = {
                "cap cuu", "hoc", "ngat tho", "kho tho", "khong tho", "di vat",
                "ngo doc", "co giat", "chay mau", "tai nan", "bat tinh", "soc"
        };
        for (String kw : emergencyKeywords) {
            if (normalizedQuery.contains(kw)) {
                return true;
            }
        }
        return false;
    }

    private String buildEmergencyReply(String normalizedQuery) {
        StringBuilder reply = new StringBuilder();
        reply.append("[EMERGENCY] Sen bình tĩnh làm ngay các bước sơ cứu dưới đây và gọi Rexi theo hotline 0353.374.156.\n\n");

        if (normalizedQuery.contains("hoc") || normalizedQuery.contains("ngat tho")
                || normalizedQuery.contains("khong tho") || normalizedQuery.contains("di vat")) {
            reply.append("**Nghi hóc dị vật/ngạt thở:**\n")
                    .append("1. Mở miệng bé kiểm tra nhanh. Chỉ lấy dị vật ra nếu nhìn thấy rõ và gắp được an toàn.\n")
                    .append("2. Không móc tay sâu vì có thể đẩy dị vật vào trong.\n")
                    .append("3. Nếu bé không thở hoặc tím tái, thực hiện Heimlich cho thú cưng: đặt hai tay ngay sau xương sườn, ép nhanh hướng lên trên 3-5 lần, rồi kiểm tra miệng.\n")
                    .append("4. Nếu bé nhỏ, có thể nâng phần thân sau cao hơn đầu và vỗ chắc 3-5 cái giữa hai bả vai.\n\n");
        } else if (normalizedQuery.contains("ngo doc")) {
            reply.append("**Nghi ngộ độc:**\n")
                    .append("1. Ngừng cho ăn/uống thêm và đưa bé tránh xa nguồn độc.\n")
                    .append("2. Không tự gây nôn nếu chưa có bác sĩ hướng dẫn.\n")
                    .append("3. Mang theo bao bì/chất nghi độc khi đến phòng khám.\n\n");
        } else if (normalizedQuery.contains("co giat")) {
            reply.append("**Co giật:**\n")
                    .append("1. Dọn vật cứng quanh bé, không giữ chặt miệng hoặc kéo lưỡi.\n")
                    .append("2. Ghi lại thời gian co giật và quay video ngắn nếu an toàn.\n")
                    .append("3. Nếu cơn kéo dài hơn 2-3 phút hoặc lặp lại, đưa bé đi cấp cứu ngay.\n\n");
        } else if (normalizedQuery.contains("chay mau") || normalizedQuery.contains("tai nan")) {
            reply.append("**Chảy máu/tai nạn:**\n")
                    .append("1. Dùng gạc sạch ép trực tiếp lên điểm chảy máu 5-10 phút.\n")
                    .append("2. Hạn chế di chuyển bé nếu nghi gãy xương hoặc chấn thương nặng.\n")
                    .append("3. Không tự bôi thuốc dân gian lên vết thương.\n\n");
        }

        reply.append("Sen cho Rexi biết vị trí hiện tại của Sen để Rexi hướng dẫn đường đến cơ sở thú y gần nhất. Nếu ở Gia Lâm/Hà Nội, đưa bé tới Phòng khám Thú y Rexi, Số 68, Ngõ 10, Đường Ngô Xuân Quảng, Trâu Quỳ, Gia Lâm, Hà Nội.");
        return reply.toString();
    }
}
