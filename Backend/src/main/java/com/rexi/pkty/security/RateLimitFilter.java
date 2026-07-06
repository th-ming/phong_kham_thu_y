package com.rexi.pkty.security;

import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import com.rexi.pkty.service.SecurityAlertService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;

/** BỘ LỌC CHỐNG SPAM & RATE LIMITING TOÀN CỤC */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    @org.springframework.beans.factory.annotation.Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private SecurityAlertService securityAlertService;

    private final ConcurrentHashMap<String, java.util.concurrent.atomic.AtomicInteger> requestCounts = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Long> requestTimestamps = new ConcurrentHashMap<>();
    private static final int MAX_REQUESTS_PER_MINUTE = 200; // Ngưỡng chặn

    // Dùng ConcurrentHashMap.newKeySet() thay vì HashSet để đảm bảo thread-safe
    private final java.util.Set<String> blockedIps = java.util.concurrent.ConcurrentHashMap.newKeySet();
    private long lastCheckTime = 0;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String ip = getClientIP(request);
        String interactionSource = getInteractionSource(request);
        String rateKey = ip + "|" + interactionSource;
        boolean localhost = "127.0.0.1".equals(ip) || "0:0:0:0:0:0:0:1".equals(ip);
        long currentTime = System.currentTimeMillis();

        // Bỏ qua chặn IP bảo mật để tránh chặn nhầm người dùng
        /*
        if (securityAlertService != null && securityAlertService.isBlocked(ip)) {
            writeBlockedResponse(response, "Truy cập bị từ chối: IP của bạn đang nằm trong danh sách chặn bảo mật.");
            return;
        }
        */

        // Check Blacklist IP từ DB (1 phút load 1 lần tránh chậm DB)
        if (currentTime - lastCheckTime > 60000) {
            try {
                String ips = jdbcTemplate.queryForObject(
                        "SELECT gia_tri FROM CauHinhHeThong WHERE ten_cau_hinh = 'blocked_ips'", String.class);
                if (ips != null && !ips.trim().isEmpty()) {
                    // Loại bỏ khoảng trắng và split comma
                    blockedIps.clear();
                    blockedIps.addAll(java.util.Arrays.asList(ips.replace(" ", "").split(",")));
                } else {
                    blockedIps.clear();
                }
            } catch (Exception e) {
                logger.warn("Không thể load blocked IPs từ DB: " + e.getMessage());
            }
            lastCheckTime = currentTime;
        }

        /*
        if (blockedIps.contains(ip)) {
            writeBlockedResponse(response, "Truy cập bị từ chối: Địa chỉ IP của bạn đã bị đưa vào danh sách đen (Blacklist)!");
            return;
        }
        */

        if (localhost) {
            // Localhost trong blacklist vẫn chặn, nhưng skip rate limit để tiện dev
            filterChain.doFilter(request, response);
            return;
        }

        // Không tự động chặn IP khi phát hiện AttackSignal (vẫn cho đi qua)
        /*
        AttackSignal attackSignal = detectAttack(request);
        if (attackSignal != null) {
            if (securityAlertService != null) {
                securityAlertService.reportAndBlock(
                        ip,
                        attackSignal.attackType,
                        request.getRequestURI() + (request.getQueryString() == null ? "" : "?" + request.getQueryString()),
                        request.getMethod(),
                        request.getHeader("User-Agent"),
                        attackSignal.evidence,
                        getLocationHint(request)
                );
            } else {
                persistBlockedIp(ip);
            }
            writeBlockedResponse(response, "Cảnh báo bảo mật: Phát hiện hành vi tấn công. IP đã bị chặn cho tới khi Admin gỡ.");
            return;
        }
        */

        requestTimestamps.compute(rateKey, (key, timestamp) -> {
            if (timestamp == null || (currentTime - timestamp) > 60000) {
                requestCounts.put(rateKey, new java.util.concurrent.atomic.AtomicInteger(1));
                return currentTime;
            } else {
                // AtomicInteger được compute an toàn trong ConcurrentHashMap
                requestCounts.compute(rateKey, (k, existing) -> {
                    if (existing == null) {
                        return new java.util.concurrent.atomic.AtomicInteger(1);
                    }
                    existing.incrementAndGet();
                    return existing;
                });
                return timestamp;
            }
        });

        java.util.concurrent.atomic.AtomicInteger countObj = requestCounts.get(rateKey);
        int requests = (countObj != null) ? countObj.get() : 1;
        if (requests > MAX_REQUESTS_PER_MINUTE) {
            response.setStatus(429);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"message\": \"Bạn thao tác quá nhanh. Vui lòng đợi một lát rồi thử lại.\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIP(HttpServletRequest request) {
        // ưu tiên dùng extractRealIp từ SecurityAlertService (hỗ trợ Cloudflare, nginx, X-Forwarded-For)
        if (securityAlertService != null) {
            return securityAlertService.extractRealIp(request);
        }
        // Fallback nếu service chưa sẵn sàng
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty() || "unknown".equalsIgnoreCase(xfHeader)) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }

    private AttackSignal detectAttack(HttpServletRequest request) {
        String uri = safe(request.getRequestURI());
        String query = safe(request.getQueryString());
        String userAgent = safe(request.getHeader("User-Agent"));
        // Do not inspect X-AI-ACTION as an attack payload. Tool tags like FILL:password
        // describe UI automation and previously caused false credential-attack blocks on /api/auth/login.
        String probe = (uri + " " + query + " " + userAgent).toLowerCase();

        if (probe.matches(".*(union\\s+select|sleep\\s*\\(|benchmark\\s*\\(|information_schema|xp_cmdshell|or\\s+1\\s*=\\s*1|--|/\\*|\\*/).*")) {
            return new AttackSignal("SQL injection", truncate(probe));
        }
        if (probe.matches(".*(<script|javascript:|onerror\\s*=|onload\\s*=|document\\.cookie|<iframe|<svg).*")) {
            return new AttackSignal("Cross-site scripting (XSS)", truncate(probe));
        }
        if (probe.matches(".*(;\\s*(cat|curl|wget|bash|sh|powershell|cmd)|\\$\\(|`|/bin/sh|/bin/bash|\\|\\s*(cat|curl|wget|nc|ncat)|&&\\s*(cat|curl|wget|whoami)).*")) {
            return new AttackSignal("Command injection / remote command execution", truncate(probe));
        }
        if (probe.matches(".*(169\\.254\\.169\\.254|metadata\\.google\\.internal|localhost:|127\\.0\\.0\\.1|file://|gopher://|dict://).*")) {
            return new AttackSignal("SSRF / internal network probing", truncate(probe));
        }
        if (probe.matches(".*(\\.\\./|\\.\\.\\\\|/etc/passwd|boot\\.ini|win\\.ini|%2e%2e|%252e%252e).*")) {
            return new AttackSignal("Path traversal / file probing", truncate(probe));
        }
        if (probe.matches(".*(api[_-]?key|secret|access[_-]?token|refresh[_-]?token|private[_-]?key|\\.aws/credentials|id_rsa).*")) {
            return new AttackSignal("Credential/API key probing", truncate(probe));
        }
        if (probe.matches(".*(/login|/dang-nhap|/api/auth|/wp-login).*") && probe.matches(".*(hydra|patator|bruteforce|credential|password).*")) {
            return new AttackSignal("Credential stuffing / brute force", truncate(probe));
        }
        if (probe.matches(".*(/wp-admin|/wp-login|/phpmyadmin|/\\.env|/actuator/env|/server-status|/vendor/phpunit).*")) {
            return new AttackSignal("Automated vulnerability scanner", truncate(probe));
        }
        if (userAgent.isBlank() || userAgent.toLowerCase().matches(".*(sqlmap|nikto|acunetix|nessus|masscan|nmap|zgrab|dirbuster|gobuster|hydra|burp).*")) {
            return new AttackSignal("Security scanner / non-human client", truncate(userAgent.isBlank() ? "empty user-agent" : userAgent));
        }
        return null;
    }

    private String getInteractionSource(HttpServletRequest request) {
        String source = safe(request.getHeader("X-Interaction-Source"));
        if ("human".equalsIgnoreCase(source)) return "human";
        String aiAction = safe(request.getHeader("X-AI-ACTION"));
        if (!aiAction.isBlank()) return "automation";
        return "unknown";
    }

    private void persistBlockedIp(String ip) {
        try {
            String ips = jdbcTemplate.queryForObject(
                    "SELECT gia_tri FROM CauHinhHeThong WHERE ten_cau_hinh = 'blocked_ips'", String.class);
            java.util.Set<String> next = new java.util.LinkedHashSet<>();
            if (ips != null && !ips.isBlank()) {
                next.addAll(java.util.Arrays.asList(ips.replace(" ", "").split(",")));
            }
            next.add(ip);
            String value = String.join(",", next);
            int updated = jdbcTemplate.update("UPDATE CauHinhHeThong SET gia_tri = ? WHERE ten_cau_hinh = 'blocked_ips'", value);
            if (updated == 0) {
                jdbcTemplate.update("INSERT INTO CauHinhHeThong (ten_cau_hinh, gia_tri) VALUES ('blocked_ips', ?)", value);
            }
            blockedIps.clear();
            blockedIps.addAll(next);
            lastCheckTime = 0;
        } catch (Exception e) {
            logger.warn("Không thể persist blocked IP " + ip + ": " + e.getMessage());
        }
    }

    private String getLocationHint(HttpServletRequest request) {
        String country = safe(request.getHeader("CF-IPCountry"));
        String region = safe(request.getHeader("X-Region"));
        String city = safe(request.getHeader("X-City"));
        String forwarded = safe(request.getHeader("X-Forwarded-For"));
        StringBuilder hint = new StringBuilder();
        if (!city.isBlank()) hint.append(city);
        if (!region.isBlank()) hint.append(hint.length() > 0 ? ", " : "").append(region);
        if (!country.isBlank()) hint.append(hint.length() > 0 ? ", " : "").append(country);
        if (!forwarded.isBlank()) hint.append(hint.length() > 0 ? " | " : "").append("Forwarded: ").append(forwarded);
        return hint.toString();
    }

    private void writeBlockedResponse(HttpServletResponse response, String message) throws IOException {
        response.setStatus(403);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"message\": \"" + message.replace("\"", "'") + "\"}");
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }

    private String truncate(String value) {
        if (value == null) return "";
        return value.length() > 500 ? value.substring(0, 500) : value;
    }

    private static class AttackSignal {
        private final String attackType;
        private final String evidence;

        private AttackSignal(String attackType, String evidence) {
            this.attackType = attackType;
            this.evidence = evidence;
        }
    }
}



