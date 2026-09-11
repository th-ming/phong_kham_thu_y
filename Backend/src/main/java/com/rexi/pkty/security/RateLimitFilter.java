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
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/** BỘ LỌC CHỐNG SPAM & RATE LIMITING TOÀN CỤC
 *  - Mỗi client (IP thật qua proxy) một bucket riêng → không lockout chéo.
 *  - Endpoint AI (chat/agent/tts) có ngưỡng riêng thấp hơn để chặn đốt quota.
 */
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final int MAX_REQUESTS_PER_MINUTE = 200;
    private static final int MAX_AI_REQUESTS_PER_MINUTE = 20;
    private static final long WINDOW_MS = 60_000L;
    private static final long CLEANUP_INTERVAL_MS = 30_000L;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private SecurityAlertService securityAlertService;

    private final ConcurrentHashMap<String, java.util.concurrent.atomic.AtomicInteger> requestCounts = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Long> requestTimestamps = new ConcurrentHashMap<>();
    private static final int MAX_REQUESTS_PER_MINUTE = 200; // Ngưỡng chặn
    private static final int MAX_TRACKED_CLIENTS = 10_000; // Cap tránh memory leak
    private static final long SWEEP_INTERVAL_MS = 30_000;
    private final Object sweepLock = new Object();
    private volatile long lastSweepTime = 0;

    // Dùng ConcurrentHashMap.newKeySet() thay vì HashSet để đảm bảo thread-safe
    private final java.util.Set<String> blockedIps = java.util.concurrent.ConcurrentHashMap.newKeySet();
    private volatile long lastCheckTime = 0;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String ip = getClientIP(request);
        boolean localhost = "127.0.0.1".equals(ip) || "0:0:0:0:0:0:0:1".equals(ip);
        long currentTime = System.currentTimeMillis();

        // Bỏ qua chặn IP bảo mật để tránh chặn nhầm người dùng
        if (securityAlertService != null && securityAlertService.isBlocked(ip)) {
            writeBlockedResponse(response, "Truy cập bị từ chối: IP của bạn đang nằm trong danh sách chặn bảo mật.");
            return;
        }

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

        if (blockedIps.contains(ip)) {
            writeBlockedResponse(response, "Truy cập bị từ chối: Địa chỉ IP của bạn đã bị đưa vào danh sách đen (Blacklist)!");
            return;
        }

        if (localhost) {
            filterChain.doFilter(request, response);
            return;
        }

        // Tự động chặn IP khi phát hiện AttackSignal (trừ health check cho monitor)
        String requestPath = safe(request.getRequestURI());
        boolean isHealthProbe = requestPath.startsWith("/api/system/health") || requestPath.startsWith("/actuator");
        if (!isHealthProbe) {
            AttackSignal attackSignal = detectAttack(request);
            if (attackSignal != null) {
                if (securityAlertService != null) {
                    try {
                        securityAlertService.reportAndBlock(
                                ip,
                                attackSignal.attackType,
                                request.getRequestURI() + (request.getQueryString() == null ? "" : "?" + request.getQueryString()),
                                request.getMethod(),
                                request.getHeader("User-Agent"),
                                attackSignal.evidence,
                                getLocationHint(request)
                        );
                    } catch (Exception e) {
                        logger.warn("Không thể ghi cảnh báo bảo mật: " + e.getMessage());
                        persistBlockedIp(ip);
                    }
                } else {
                    persistBlockedIp(ip);
                }
                writeBlockedResponse(response, "Cảnh báo bảo mật: Phát hiện hành vi tấn công. IP đã bị chặn cho tới khi Admin gỡ.");
                return;
            }
        }

        String rateKey = ip + "|" + getInteractionSource(request) + "|" + (isAiPath(request) ? "ai" : "std");
        Window window = buckets.compute(rateKey, (key, existing) -> {
            if (existing == null || (currentTime - existing.windowStart.get()) > WINDOW_MS) {
                return new Window();
            }
            existing.count.incrementAndGet();
            return existing;
        });

        int maxRequests = isAiPath(request) ? MAX_AI_REQUESTS_PER_MINUTE : MAX_REQUESTS_PER_MINUTE;
        if (window.count.get() > maxRequests) {
            response.setStatus(429);
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"message\": \"Bạn thao tác quá nhanh. Vui lòng đợi một lát rồi thử lại.\"}");
            return;
        }

        sweepStaleEntries(currentTime);
        filterChain.doFilter(request, response);
    }

    /** Dọn định kỳ các entry rate-limit quá hạn để map không phình vô hạn. */
    private void sweepStaleEntries(long currentTime) {
        boolean due = (currentTime - lastSweepTime) >= SWEEP_INTERVAL_MS;
        if (!due && requestTimestamps.size() < MAX_TRACKED_CLIENTS) return;
        synchronized (sweepLock) {
            if ((currentTime - lastSweepTime) < SWEEP_INTERVAL_MS && requestTimestamps.size() < MAX_TRACKED_CLIENTS) {
                return;
            }
            // Chỉ xóa entry stale quá 2 phút (đủ rộng hơn cửa sổ 60s để không reset nhầm đếm)
            requestTimestamps.entrySet().removeIf(e -> (currentTime - e.getValue()) > 120_000);
            requestCounts.keySet().retainAll(requestTimestamps.keySet());
            lastSweepTime = currentTime;
        }
    }

    private String getClientIP(HttpServletRequest request) {
        // ưu tiên dùng extractRealIp từ SecurityAlertService (hỗ trợ Cloudflare, nginx, X-Forwarded-For)
        if (securityAlertService != null) {
            return securityAlertService.extractRealIp(request);
        }
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
        // Endpoint auth hợp lệ của app: refresh/logout vẫn gửi "token" trong path — không phải probing
        boolean legitAuthFlow = uri.matches(".*/api/auth/(refresh-token|logout).*");

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
        if (probe.matches(".*(api[_-]?key|secret|private[_-]?key|\\.aws/credentials|id_rsa).*")
                || (!legitAuthFlow && probe.matches(".*(access[_-]?token|refresh[_-]?token).*"))) {
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

    private String safe(String value) {
        return value == null ? "" : value;
    }
}
