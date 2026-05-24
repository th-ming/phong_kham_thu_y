package com.rexi.pkty.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Arrays;
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

        Map<String, Object> alert = Map.of(
                "id", "SEC-" + Instant.now().toEpochMilli(),
                "ip", cleanIp,
                "attackType", attackType,
                "path", path == null ? "" : path,
                "method", method == null ? "" : method,
                "userAgent", userAgent == null ? "" : userAgent,
                "evidence", evidence == null ? "" : evidence,
                "locationHint", locationHint == null || locationHint.isBlank() ? "Không xác định; chỉ có thể suy đoán qua IP/proxy header" : locationHint,
                "blocked", true,
                "message", "Phát hiện IP " + cleanIp + " có dấu hiệu " + attackType + ". Hệ thống đã tự động chặn vĩnh viễn cho tới khi Admin gỡ.",
                "detectedAt", Instant.now().toString()
        );

        recentAlerts.add(0, alert);
        while (recentAlerts.size() > MAX_ALERTS) {
            recentAlerts.remove(recentAlerts.size() - 1);
        }

        try {
            jdbcTemplate.update(
                    "INSERT INTO NhatKyHeThong (hanh_dong, bang_tac_dong, mo_ta, ngay_tao) VALUES (?, ?, ?, GETDATE())",
                    "SECURITY_BLOCK",
                    "Security",
                    alert.get("message") + " Path=" + path + " Evidence=" + evidence
            );
        } catch (Exception ignored) {
            // Nhật ký là phụ trợ; không được làm hỏng luồng chặn.
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
        return getBlockedIps().contains(normalizeIp(ip));
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

    private String normalizeIp(String ip) {
        if (ip == null) return "";
        return ip.trim().replace(" ", "");
    }
}
