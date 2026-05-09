package com.rexi.pkty.security;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * BỘ LỌC CHỐNG SPAM & RATE LIMITING TOÀN CỤC
 * Giới hạn số lượng request từ một IP trong một khoảng thời gian nhất định (ví
 * dụ: 100 requests / 1 phút)
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    @org.springframework.beans.factory.annotation.Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    private final ConcurrentHashMap<String, RequestData> requestCounts = new ConcurrentHashMap<>();
    private static final int MAX_REQUESTS_PER_MINUTE = 200; // Ngưỡng chặn an toàn

    private java.util.Set<String> blockedIps = new java.util.HashSet<>();
    private long lastCheckTime = 0;

    private static class RequestData {
        AtomicInteger count = new AtomicInteger(1);
        long timestamp = System.currentTimeMillis();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String ip = getClientIP(request);
        long currentTime = System.currentTimeMillis();

        // BẢO MẬT: Kiểm tra Blacklist IP (Cập nhật từ DB mỗi phút 1 lần để không làm
        // chậm hệ thống)
        if (currentTime - lastCheckTime > 60000) {
            try {
                String ips = jdbcTemplate.queryForObject(
                        "SELECT gia_tri FROM CauHinhHeThong WHERE ten_cau_hinh = 'blocked_ips'", String.class);
                if (ips != null && !ips.trim().isEmpty()) {
                    // Loại bỏ khoảng trắng thừa và cắt chuỗi theo dấu phẩy
                    blockedIps = new java.util.HashSet<>(java.util.Arrays.asList(ips.replace(" ", "").split(",")));
                } else {
                    blockedIps.clear();
                }
            } catch (Exception e) {
                // Bỏ qua nếu bảng chưa tạo
            }
            lastCheckTime = currentTime;
        }

        if (blockedIps.contains(ip)) {
            response.setStatus(403);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write(
                    "{\"message\": \"Truy cập bị từ chối: Địa chỉ IP của bạn đã bị đưa vào danh sách đen (Blacklist)!\"}");
            return;
        }

        requestCounts.compute(ip, (key, data) -> {
            if (data == null || (currentTime - data.timestamp) > 60000) {
                // Reset sau mỗi phút
                RequestData newData = new RequestData();
                newData.timestamp = currentTime;
                return newData;
            } else {
                data.count.incrementAndGet();
                return data;
            }
        });

        int requests = requestCounts.get(ip).count.get();
        if (requests > MAX_REQUESTS_PER_MINUTE) {
            response.setStatus(429); // 429 Too Many Requests
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write(
                    "{\"message\": \"Cảnh báo bảo mật: Phát hiện dấu hiệu Spam/DDoS. IP của bạn đã bị tạm khóa. Vui lòng thử lại sau 1 phút!\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIP(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty() || !xfHeader.contains(request.getRemoteAddr())) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }
}

