package com.rexi.pkty.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import jakarta.annotation.PostConstruct;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Controller quản lý cấu hình hệ thống và dữ liệu nền tảng.
 */
@RestController
@RequestMapping("/api/system")
public class HeThongController {

    // Map lưu trữ email đã xác thực OTP (để dùng cho quên mật khẩu)
    public static final Map<String, Boolean> verifiedEmails = new ConcurrentHashMap<>();

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void init() {
        try {
            // Hệ thống khởi động với Database sạch theo yêu cầu của sếp.
            jdbcTemplate.execute("UPDATE DichVu SET trang_thai = 'HOAT_DONG' WHERE trang_thai IS NULL");
        } catch (Exception ignored) {
            // Bỏ qua nếu cơ sở dữ liệu chưa sẵn sàng hoặc bảng chưa tồn tại
        }
    }

    // Lấy thông tin cấu hình phòng khám
    @GetMapping("/cau-hinh")
    public ResponseEntity<?> getCauHinh() {
        try {
            String sql = "SELECT ma_cau_hinh, gia_tri FROM CauHinhHeThong";
            return ResponseEntity.ok(jdbcTemplate.queryForList(sql));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi lấy cấu hình hệ thống: " + e.getMessage()));
        }
    }

    // Cập nhật cấu hình hệ thống
    @PutMapping("/cau-hinh")
    public ResponseEntity<?> updateCauHinh(@RequestBody Map<String, String> cauHinh) {
        try {
            for (Map.Entry<String, String> entry : cauHinh.entrySet()) {
                jdbcTemplate.update("UPDATE CauHinhHeThong SET gia_tri = ? WHERE ma_cau_hinh = ?", 
                                   entry.getValue(), entry.getKey());
            }
            return ResponseEntity.ok(Map.of("message", "Cập nhật cấu hình thành công!"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi cập nhật cấu hình: " + e.getMessage()));
        }
    }

    // Reset dữ liệu hệ thống (Dọn sạch Database 100%)
    @PostMapping("/reset-du-lieu")
    public ResponseEntity<?> resetDatabase() {
        try {
            jdbcTemplate.execute("DELETE FROM LichHen");
            jdbcTemplate.execute("DELETE FROM HoSoBenhAn");
            jdbcTemplate.execute("DELETE FROM ThuCung");
            return ResponseEntity.ok(Map.of("message", "Đã dọn dẹp Database sạch 100%!"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi khi reset dữ liệu: " + e.getMessage()));
        }
    }

    // Endpoint SOI DATABASE thực tế
    @GetMapping("/soi-db")
    public ResponseEntity<?> soiDatabase() {
        try {
            String[] tables = {"DichVu", "NhanVien", "TaiKhoan", "ThuCung", "LichHen", "HoSoBenhAn", "Thuoc"};
            java.util.Map<String, List<String>> result = new java.util.HashMap<>();
            for (String table : tables) {
                List<String> columns = jdbcTemplate.execute((java.sql.Connection conn) -> {
                    try (java.sql.ResultSet rs = conn.createStatement().executeQuery("SELECT TOP 0 * FROM " + table)) {
                        java.sql.ResultSetMetaData rsmd = rs.getMetaData();
                        List<String> cols = new java.util.ArrayList<>();
                        for (int i = 1; i <= rsmd.getColumnCount(); i++) {
                            cols.add(rsmd.getColumnName(i));
                        }
                        return cols;
                    }
                });
                result.put(table, columns);
            }
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi soi DB: " + e.getMessage()));
        }
    }
}
