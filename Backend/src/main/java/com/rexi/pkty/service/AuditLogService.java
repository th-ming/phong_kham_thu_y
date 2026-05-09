package com.rexi.pkty.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;
import jakarta.servlet.http.HttpServletRequest;
import java.util.concurrent.CompletableFuture;

@Service
public class AuditLogService {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public void logAction(String hanhDong, String bangDuLieu, String chiTiet) {
        org.springframework.security.core.Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = (auth != null && !auth.getName().equals("anonymousUser")) ? auth.getName() : "Hệ thống";
        logActionWithUsername(username, hanhDong, bangDuLieu, chiTiet);
    }

    public void logActionWithUsername(String username, String hanhDong, String bangDuLieu, String chiTiet) {
        String ipAddress = "Unknown";
        String deviceInfo = "Unknown";

        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder
                    .getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                ipAddress = request.getHeader("X-Forwarded-For");
                if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
                    ipAddress = request.getRemoteAddr();
                }
                deviceInfo = request.getHeader("User-Agent");
            }
        } catch (Exception e) {
            // Bỏ qua lỗi nếu gọi từ môi trường không có HTTP Request
        }

        final String finalIp = ipAddress;
        final String finalDevice = deviceInfo;

        CompletableFuture.runAsync(() -> {
            try {
                jdbcTemplate.update(
                        "INSERT INTO NhatKyHeThong (nguoi_thao_tac, hanh_dong, bang_du_lieu, chi_tiet, ip_address, device_info) VALUES (?, ?, ?, ?, ?, ?)",
                        username, hanhDong, bangDuLieu, chiTiet, finalIp, finalDevice);
            } catch (Exception e) {
                System.err.println("Lỗi ghi log hệ thống: " + e.getMessage());
            }
        });
    }
}
