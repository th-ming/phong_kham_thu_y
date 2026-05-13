package com.rexi.pkty.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class DichVuNhatKyHeThong {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Ghi lại hành động của hệ thống với tên bảng và mô tả chi tiết.
     */
    public void logAction(String action, String tableName, String description) {
        try {
            String sql = "INSERT INTO NhatKyHeThong (hanh_dong, ten_bang, mo_ta, thoi_gian) VALUES (?, ?, ?, GETDATE())";
            jdbcTemplate.update(sql, action, tableName, description);
        } catch (Exception e) {
            System.err.println("Lỗi ghi nhật ký hệ thống: " + e.getMessage());
        }
    }

    /**
     * Ghi lại hành động kèm theo tên đăng nhập của người thực hiện.
     */
    public void logActionWithUsername(String username, String action, String tableName, String description) {
        try {
            String sql = "INSERT INTO NhatKyHeThong (ten_dang_nhap, hanh_dong, ten_bang, mo_ta, thoi_gian) VALUES (?, ?, ?, ?, GETDATE())";
            jdbcTemplate.update(sql, username, action, tableName, description);
        } catch (Exception e) {
            System.err.println("Lỗi ghi nhật ký hệ thống (có username): " + e.getMessage());
        }
    }

    /**
     * Lấy danh sách lịch sử hoạt động mới nhất.
     */
    public List<Map<String, Object>> getRecentLogs(int limit) {
        String sql = "SELECT TOP " + limit + " * FROM NhatKyHeThong ORDER BY thoi_gian DESC";
        return jdbcTemplate.queryForList(sql);
    }

    /**
     * Xóa nhật ký cũ (trên 30 ngày) để giải phóng dung lượng DB.
     */
    public void cleanOldLogs() {
        String sql = "DELETE FROM NhatKyHeThong WHERE thoi_gian < DATEADD(day, -30, GETDATE())";
        jdbcTemplate.update(sql);
    }
}
