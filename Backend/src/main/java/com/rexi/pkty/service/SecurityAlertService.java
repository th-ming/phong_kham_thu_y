package com.rexi.pkty.service;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SecurityAlertService {

    private static final String BLOCKED_IPS_KEY = "blocked_ips";
    private static final int MAX_ALERTS = 100;
    private static final long EMAIL_COOLDOWN_MS = 5 * 60 * 1000L;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired(required = false)
    private SimpMessagingTemplate messagingTemplate;

    @Autowired(required = false)
    private EmailService emailService;

    private final CopyOnWriteArrayList<Map<String, Object>> recentAlerts = new CopyOnWriteArrayList<>();
    private final ConcurrentHashMap<String, Long> lastEmailByIp = new ConcurrentHashMap<>();

    public Map<String, Object> reportAndBlock(String ip, String attackType, String path, String method, String userAgent, String evidence, String locationHint) {
        String cleanIp = normalizeIp(ip);
        if (cleanIp.isEmpty()) cleanIp = "unknown";

        addBlockedIp(cleanIp);
        Map<String, Object> analysis = analyzeAttack(attackType, path, method, evidence);

        Map<String, Object> alert = new LinkedHashMap<>();
        alert.put("id", "SEC-" + Instant.now().toEpochMilli());
        alert.put("ip", cleanIp);
        alert.put("attackType", attackType);
        alert.put("path", path == null ? "" : path);
        alert.put("method", method == null ? "" : method);
        alert.put("userAgent", userAgent == null ? "" : userAgent);
        alert.put("evidence", evidence == null ? "" : evidence);
        alert.put("locationHint", locationHint == null || locationHint.isBlank() ? "Không xác định; chỉ có thể suy đoán qua IP/proxy header" : locationHint);
        alert.put("blocked", true);
        alert.putAll(analysis);
        alert.put("message", "Phát hiện IP " + cleanIp + " có dấu hiệu " + attackType + ". Hệ thống đã tự động chặn vĩnh viễn cho tới khi Admin gỡ.");
        alert.put("detectedAt", Instant.now().toString());

        recentAlerts.add(0, alert);
        while (recentAlerts.size() > MAX_ALERTS) {
            recentAlerts.remove(recentAlerts.size() - 1);
        }

        try {
            jdbcTemplate.update(
                    "INSERT INTO NhatKyHeThong (nguoi_thao_tac, hanh_dong, bang_du_lieu, chi_tiet, ip_address, device_info) VALUES (?, ?, ?, ?, ?, ?)",
                    "AUTO_SECURITY",
                    "SECURITY_BLOCK",
                    "Security",
                    alert.get("message") + " Path=" + path + " Evidence=" + evidence,
                    cleanIp,
                    userAgent == null ? "" : userAgent
            );
        } catch (Exception ignored) {
            // Nhật ký là phụ trợ; ko được làm hỏng luồng chặn.
        }

        if (messagingTemplate != null) {
            messagingTemplate.convertAndSend("/topic/security-alerts", alert);
            messagingTemplate.convertAndSend("/topic/public", Map.of(
                    "type", "error",
                    "title", "Cảnh báo tấn công",
                    "content", alert.get("message")
            ));
        }

        maybeSendEmail(alert);
        return alert;
    }

    public boolean isBlocked(String ip) {
        return false;
    }

    public List<String> getBlockedIps() {
        try {
            String value = jdbcTemplate.queryForObject(
                    "SELECT gia_tri FROM CauHinhHeThong WHERE ten_cau_hinh = ?",
                    String.class,
                    BLOCKED_IPS_KEY
            );
            if (value == null || value.isBlank()) return new ArrayList<>();
            return Arrays.stream(value.split(","))
                    .map(this::normalizeIp)
                    .filter(item -> !item.isBlank())
                    .distinct()
                    .toList();
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    public List<Map<String, Object>> getRecentAlerts() {
        return new ArrayList<>(recentAlerts);
    }

    public Map<String, Object> reportClientError(Map<String, Object> payload, String ip, String userAgent) {
        Map<String, Object> alert = new LinkedHashMap<>();
        alert.put("id", "WEB-" + Instant.now().toEpochMilli());
        alert.put("severity", String.valueOf(payload.getOrDefault("severity", "MEDIUM")));
        alert.put("errorType", String.valueOf(payload.getOrDefault("type", "CLIENT_ERROR")));
        alert.put("message", trimForLog(String.valueOf(payload.getOrDefault("message", "Lỗi web không rõ nội dung")), 500));
        alert.put("path", trimForLog(String.valueOf(payload.getOrDefault("path", "")), 300));
        alert.put("source", trimForLog(String.valueOf(payload.getOrDefault("source", "")), 300));
        alert.put("status", payload.getOrDefault("status", ""));
        alert.put("method", payload.getOrDefault("method", ""));
        alert.put("url", trimForLog(String.valueOf(payload.getOrDefault("url", "")), 500));
        alert.put("user", trimForLog(String.valueOf(payload.getOrDefault("user", "")), 200));
        alert.put("ip", normalizeIp(ip));
        alert.put("userAgent", userAgent == null ? "" : trimForLog(userAgent, 500));
        alert.put("detectedAt", Instant.now().toString());
        alert.put("riskSummary", "Frontend vừa phát hiện lỗi thật từ trình duyệt/API. Admin nên kiểm tra trang, endpoint và thao tác người dùng gây lỗi.");
        alert.put("recommendedActions", List.of(
                "Mở đúng trang được báo lỗi và thử lại thao tác vừa xảy ra.",
                "Kiểm tra Network/Console trên trình duyệt và log backend cùng thời điểm.",
                "Nếu là API 5xx, kiểm tra controller/service/database của endpoint tương ứng; nếu là JS error, kiểm tra component nguồn."
        ));
        alert.put("adminDecision", "Ưu tiên xử lý nếu lỗi lặp lại nhiều lần, ảnh hưởng đặt lịch, thanh toán, đăng nhập hoặc hồ sơ bệnh án.");

        try {
            jdbcTemplate.update(
                    "INSERT INTO NhatKyHeThong (nguoi_thao_tac, hanh_dong, bang_du_lieu, chi_tiet, ip_address, device_info) VALUES (?, ?, ?, ?, ?, ?)",
                    "AUTO_WEB_MONITOR",
                    "CLIENT_ERROR",
                    "Frontend",
                    alert.get("errorType") + " " + alert.get("message") + " Path=" + alert.get("path") + " Url=" + alert.get("url"),
                    normalizeIp(ip),
                    userAgent == null ? "" : userAgent
            );
        } catch (Exception ignored) {
            // ko để lỗi ghi log làm hỏng trải nghiệm người dùng.
        }

        if (messagingTemplate != null) {
            messagingTemplate.convertAndSend("/topic/web-errors", alert);
        }
        return alert;
    }

    public void removeBlockedIp(String ip) {
        String cleanIp = normalizeIp(ip);
        Set<String> next = new LinkedHashSet<>(getBlockedIps());
        next.remove(cleanIp);
        saveBlockedIps(next);
    }

    private void addBlockedIp(String ip) {
        Set<String> next = new LinkedHashSet<>(getBlockedIps());
        next.add(normalizeIp(ip));
        saveBlockedIps(next);
    }

    private void saveBlockedIps(Set<String> ips) {
        String value = String.join(",", ips);
        int updated = jdbcTemplate.update(
                "UPDATE CauHinhHeThong SET gia_tri = ? WHERE ten_cau_hinh = ?",
                value,
                BLOCKED_IPS_KEY
        );
        if (updated == 0) {
            jdbcTemplate.update(
                    "INSERT INTO CauHinhHeThong (ten_cau_hinh, gia_tri) VALUES (?, ?)",
                    BLOCKED_IPS_KEY,
                    value
            );
        }
    }

    private void maybeSendEmail(Map<String, Object> alert) {
        if (emailService == null) return;
        String ip = String.valueOf(alert.get("ip"));
        long now = System.currentTimeMillis();
        Long lastSent = lastEmailByIp.get(ip);
        if (lastSent != null && now - lastSent < EMAIL_COOLDOWN_MS) return;
        lastEmailByIp.put(ip, now);
        emailService.sendSecurityAlertEmail("rexivetsys@gmail.com", alert);
    }

    private Map<String, Object> analyzeAttack(String attackType, String path, String method, String evidence) {
        String type = attackType == null ? "" : attackType.toLowerCase();
        String safePath = path == null ? "" : path;
        String safeMethod = method == null ? "" : method;
        List<String> actions = new ArrayList<>();
        String severity = "HIGH";
        String summary = "Request có dấu hiệu không giống thao tác người dùng bình thường và đã bị chặn để bảo vệ hệ thống.";
        String adminDecision = "Giữ IP trong danh sách chặn. Chỉ gỡ nếu xác minh đây là kiểm thử nội bộ hoặc false-positive.";

        if (type.contains("sql")) {
            severity = "CRITICAL";
            summary = "Đối tượng đang thử chèn câu lệnh SQL để đọc/sửa/xóa dữ liệu hoặc dò cấu trúc database.";
            actions.add("Kiểm tra log endpoint bị gọi, đặc biệt các tham số query/body liên quan tìm kiếm, lọc dữ liệu, đăng nhập.");
            actions.add("Đảm bảo endpoint dùng prepared statement/JPA parameter, không nối chuỗi SQL từ input người dùng.");
            actions.add("Rà soát bảng tài khoản, hóa đơn, bệnh án nếu request đã từng lọt qua trước thời điểm bị chặn.");
        } else if (type.contains("xss")) {
            severity = "HIGH";
            summary = "Đối tượng đang thử nhúng script để đánh cắp session/token hoặc điều khiển trình duyệt admin/người dùng.";
            actions.add("Kiểm tra các trường nhập liệu hiển thị lại trên UI: tên, mô tả, ghi chú, nội dung chat, bình luận.");
            actions.add("Escape output trên frontend và backend; không render HTML thô từ dữ liệu người dùng.");
            actions.add("Xóa hoặc vô hiệu hóa dữ liệu vừa được gửi nếu đã được lưu vào database.");
        } else if (type.contains("command")) {
            severity = "CRITICAL";
            summary = "Đối tượng đang thử thực thi lệnh hệ điều hành từ xa.";
            actions.add("Kiểm tra ngay các endpoint upload, backup, xử lý file, import/export và mọi nơi gọi shell/process.");
            actions.add("Không truyền input người dùng vào command line; dùng API thư viện thay vì chạy lệnh shell.");
            actions.add("Kiểm tra server log để xác nhận không có process lạ được tạo.");
        } else if (type.contains("ssrf")) {
            severity = "CRITICAL";
            summary = "Đối tượng đang cố ép server gọi vào mạng nội bộ, metadata cloud hoặc file/protocol nguy hiểm.";
            actions.add("Chặn request tới localhost, private IP, metadata IP và protocol không phải http/https trong mọi chức năng fetch URL.");
            actions.add("Nếu có tính năng lấy ảnh/link/PDF từ URL, thêm allowlist domain hoặc resolver kiểm tra IP đích.");
            actions.add("Rà soát credential cloud/API key nếu endpoint liên quan từng xử lý URL ngoài.");
        } else if (type.contains("credential") || type.contains("brute")) {
            severity = "HIGH";
            summary = "Đối tượng đang dò tài khoản, mật khẩu, token hoặc API key.";
            actions.add("Kiểm tra log đăng nhập thất bại theo IP/tài khoản trong cùng khoảng thời gian.");
            actions.add("Buộc đổi mật khẩu tài khoản bị nhắm tới nếu có nhiều lần thử sai.");
            actions.add("Xoay vòng API key/token nếu request đã lộ pattern tên khóa hoặc endpoint nhạy cảm.");
        } else if (type.contains("path traversal")) {
            severity = "HIGH";
            summary = "Đối tượng đang thử đọc file hệ thống hoặc vượt khỏi thư mục được phép.";
            actions.add("Kiểm tra các endpoint tải file, download backup, xem ảnh/tài liệu đính kèm.");
            actions.add("Chuẩn hóa đường dẫn và chỉ cho phép đọc file nằm trong thư mục upload/backup hợp lệ.");
            actions.add("Không trả lỗi chứa đường dẫn thật của server cho client.");
        } else if (type.contains("scanner")) {
            severity = "MEDIUM";
            summary = "Đây giống bot quét lỗ hổng tự động, thường thử nhiều đường dẫn phổ biến như .env, phpMyAdmin, wp-admin.";
            actions.add("Giữ chặn IP và theo dõi xem có nhiều IP cùng dải mạng lặp lại không.");
            actions.add("Ẩn thông tin version/framework trong response lỗi.");
            actions.add("Đảm bảo không public endpoint quản trị hoặc file cấu hình nhạy cảm.");
        } else if (type.contains("flood") || type.contains("ddos")) {
            severity = "HIGH";
            summary = "IP gửi quá nhiều request trong thời gian ngắn, có thể là spam, crawler lỗi hoặc DDoS lớp ứng dụng.";
            actions.add("Kiểm tra endpoint bị gọi nhiều nhất và tài nguyên CPU/RAM/database tại thời điểm cảnh báo.");
            actions.add("Nếu nhiều IP cùng tấn công, bật rate-limit ở Nginx/Cloudflare và cân nhắc challenge/captcha cho form công khai.");
            actions.add("Tạm giảm ngưỡng request nếu server bắt đầu quá tải.");
        } else {
            actions.add("Giữ chặn IP và xem lại path/evidence để phân loại thủ công.");
            actions.add("Kiểm tra log trong 15 phút trước/sau cảnh báo để phát hiện chuỗi hành vi liên quan.");
            actions.add("Nếu là false-positive, gỡ IP trong tab Bảo mật và bổ sung ngoại lệ phù hợp.");
        }

        Map<String, Object> analysis = new LinkedHashMap<>();
        analysis.put("severity", severity);
        analysis.put("riskSummary", summary);
        analysis.put("recommendedActions", actions);
        analysis.put("adminDecision", adminDecision);
        analysis.put("affectedSurface", safeMethod + " " + safePath);
        analysis.put("analysisSource", "Rexi Security heuristic playbook");
        return analysis;
    }

    // Chột IP raw từ chuỗi (tương thích ngược với các caller nội bộ)
    private String normalizeIp(String ip) {
        if (ip == null) return "";
        return ip.trim().replace(" ", "");
    }

    // Trích xuất IP thực của người dùng qua proxy/CDN — ưu tiên header của proxy/Cloudflare
    public String extractRealIp(HttpServletRequest request) {
        if (request == null) return "unknown";

        // Thứ tự ưu tiên: Cloudflare > nginx X-Real-IP > X-Forwarded-For > remote addr
        String[] proxyHeaders = {
            "CF-Connecting-IP",       // Cloudflare: IP client thực
            "X-Real-IP",              // Nginx proxy_pass thường set header này
            "X-Forwarded-For",        // Chuẩn mạng, có thể chứa nhiều IP (chọn cái đầu tiên)
            "X-Forwarded",
            "Forwarded-For",
            "Forwarded"
        };

        for (String header : proxyHeaders) {
            String value = request.getHeader(header);
            if (value != null && !value.isBlank()) {
                // X-Forwarded-For có dạng: "client, proxy1, proxy2" — lấy phần tử đầu
                String firstIp = value.split(",")[0].trim();
                if (!firstIp.isEmpty()) {
                    return normalizeIp(firstIp);
                }
            }
        }

        return normalizeIp(request.getRemoteAddr());
    }

    private String trimForLog(String value, int maxLength) {
        if (value == null) return "";
        String cleaned = value.replaceAll("[\\r\\n\\t]+", " ").trim();
        return cleaned.length() <= maxLength ? cleaned : cleaned.substring(0, maxLength);
    }
}
