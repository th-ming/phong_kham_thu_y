package com.rexi.pkty.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Dịch vụ ghi nhật ký kiểm tra (Audit Log) cho các hành động quan trọng.
 */
@Service
public class DichVuNhatKyKiemTra {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    public void logAction(String action, String tableName, String description) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = (auth != null && !auth.getName().equals("anonymousUser")) ? auth.getName() : "Hệ thống";

        String ip = "unknown";
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                ip = request.getRemoteAddr();
            }
        } catch (Exception ignored) {
            // Bỏ qua lỗi nếu gọi từ môi trường không có HTTP Request
        }

        try {
            String sql = "INSERT INTO NhatKyHeThong (ten_dang_nhap, hanh_dong, ten_bang, mo_ta, ip_thuc_thi, thoi_gian) " +
                         "VALUES (?, ?, ?, ?, ?, GETDATE())";
            jdbcTemplate.update(sql, username, action, tableName, description, ip);
        } catch (Exception e) {
            System.err.println("Lỗi ghi log hệ thống: " + e.getMessage());
        }
    }
}
