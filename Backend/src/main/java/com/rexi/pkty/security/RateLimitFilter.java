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
 * Bá»˜ Lá»ŒC CHá»NG SPAM & RATE LIMITING TOÃ€N Cá»¤C
 * Giá»›i háº¡n sá»‘ lÆ°á»£ng request tá»« má»™t IP trong má»™t khoáº£ng thá»i gian nháº¥t Ä‘á»‹nh (vÃ­
 * dá»¥: 100 requests / 1 phÃºt)
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    @org.springframework.beans.factory.annotation.Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    private final ConcurrentHashMap<String, RequestData> requestCounts = new ConcurrentHashMap<>();
    private static final int MAX_REQUESTS_PER_MINUTE = 200; // NgÆ°á»¡ng cháº·n an toÃ n

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

        // Báº¢O Máº¬T: Kiá»ƒm tra Blacklist IP (Cáº­p nháº­t tá»« DB má»—i phÃºt 1 láº§n Ä‘á»ƒ khÃ´ng lÃ m
        // cháº­m há»‡ thá»‘ng)
        if (currentTime - lastCheckTime > 60000) {
            try {
                String ips = jdbcTemplate.queryForObject(
                        "SELECT gia_tri FROM CauHinhHeThong WHERE ten_cau_hinh = 'blocked_ips'", String.class);
                if (ips != null && !ips.trim().isEmpty()) {
                    // Loáº¡i bá» khoáº£ng tráº¯ng thá»«a vÃ  cáº¯t chuá»—i theo dáº¥u pháº©y
                    blockedIps = new java.util.HashSet<>(java.util.Arrays.asList(ips.replace(" ", "").split(",")));
                } else {
                    blockedIps.clear();
                }
            } catch (Exception e) {
                // Bá» qua náº¿u báº£ng chÆ°a táº¡o
            }
            lastCheckTime = currentTime;
        }

        if (blockedIps.contains(ip)) {
            response.setStatus(403);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write(
                    "{\"message\": \"Truy cáº­p bá»‹ tá»« chá»‘i: Äá»‹a chá»‰ IP cá»§a báº¡n Ä‘Ã£ bá»‹ Ä‘Æ°a vÃ o danh sÃ¡ch Ä‘en (Blacklist)!\"}");
            return;
        }

        requestCounts.compute(ip, (key, data) -> {
            if (data == null || (currentTime - data.timestamp) > 60000) {
                // Reset sau má»—i phÃºt
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
                    "{\"message\": \"Cáº£nh bÃ¡o báº£o máº­t: PhÃ¡t hiá»‡n dáº¥u hiá»‡u Spam/DDoS. IP cá»§a báº¡n Ä‘Ã£ bá»‹ táº¡m khÃ³a. Vui lÃ²ng thá»­ láº¡i sau 1 phÃºt!\"}");
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

