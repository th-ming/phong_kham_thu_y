package com.rexi.pkty.controller;

import com.rexi.pkty.service.EmailService;
import com.rexi.pkty.service.DatabaseBackupService;
import com.rexi.pkty.service.AuditLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.security.access.prepost.PreAuthorize;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/system")
@CrossOrigin(origins = "*")
public class SystemController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private EmailService emailService;

    @Autowired
    private DatabaseBackupService databaseBackupService;

    @Autowired
    private AuditLogService auditLogService;

    // Các biến dùng chung cho AuthController (Duy trì tính tương thích)
    public static final Map<String, String> verifiedEmails = new ConcurrentHashMap<>();
    private final Map<String, String> otpStorage = new ConcurrentHashMap<>();
    private final Map<String, Long> otpExpiry = new ConcurrentHashMap<>();
    private static final long OTP_TTL_MS = 5 * 60 * 1000;

    @GetMapping("/cau-hinh")
    public ResponseEntity<?> getCauHinh() {
        try {
            List<Map<String, Object>> rows = jdbcTemplate.queryForList("SELECT ten_cau_hinh, gia_tri FROM CauHinhHeThong");
            Map<String, String> configs = new HashMap<>();
            for (Map<String, Object> row : rows) {
                configs.put((String) row.get("ten_cau_hinh"), (String) row.get("gia_tri"));
            }
            return ResponseEntity.ok(configs);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi tải cấu hình"));
        }
    }

    @PostMapping("/cau-hinh")
    public ResponseEntity<?> saveCauHinh(@RequestBody Map<String, String> payload) {
        try {
            for (Map.Entry<String, String> entry : payload.entrySet()) {
                jdbcTemplate.update("UPDATE CauHinhHeThong SET gia_tri = ? WHERE ten_cau_hinh = ?", entry.getValue(), entry.getKey());
            }
            auditLogService.logAction("UPDATE", "CauHinhHeThong", "Cập nhật cấu hình hệ thống");
            return ResponseEntity.ok(Map.of("message", "Cập nhật thành công"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi lưu cấu hình"));
        }
    }

    @GetMapping("/nhat-ky")
    public ResponseEntity<?> getNhatKy() {
        try {
            List<Map<String, Object>> logs = jdbcTemplate.queryForList("SELECT TOP 100 * FROM NhatKyHeThong ORDER BY ngay_tao DESC");
            return ResponseEntity.ok(logs);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi tải nhật ký"));
        }
    }

    @DeleteMapping("/nhat-ky/clear")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> clearNhatKy() {
        try {
            jdbcTemplate.execute("DELETE FROM NhatKyHeThong");
            auditLogService.logAction("DELETE", "NhatKyHeThong", "Xóa sạch nhật ký hệ thống");
            return ResponseEntity.ok(Map.of("message", "Đã xóa sạch nhật ký hệ thống!"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi xóa nhật ký"));
        }
    }

    @DeleteMapping("/nhat-ky/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteNhatKyById(@PathVariable Integer id) {
        try {
            jdbcTemplate.update("DELETE FROM NhatKyHeThong WHERE id = ?", id);
            return ResponseEntity.ok(Map.of("message", "Đã xóa bản ghi nhật ký!"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi xóa bản ghi: " + e.getMessage()));
        }
    }

    @GetMapping("/chuc-nang")
    public ResponseEntity<?> getChucNang() {
        List<Map<String, Object>> features = List.of(
            Map.of("id_chuc_nang", "1", "ma_chuc_nang", "DAT_LICH", "ten_chuc_nang", "Quản lý lịch hẹn", "mo_ta", "Hỗ trợ khách hàng đặt lịch trực tuyến"),
            Map.of("id_chuc_nang", "2", "ma_chuc_nang", "KHAM_BENH", "ten_chuc_nang", "Khám bệnh & Kê đơn", "mo_ta", "Ghi nhận bệnh lý và đơn thuốc"),
            Map.of("id_chuc_nang", "3", "ma_chuc_nang", "KHO_HANG", "ten_chuc_nang", "Quản lý kho thuốc", "mo_ta", "Kiểm soát nhập xuất tồn kho"),
            Map.of("id_chuc_nang", "4", "ma_chuc_nang", "KE_TOAN", "ten_chuc_nang", "Hóa đơn & Thanh toán", "mo_ta", "Thu ngân và báo cáo doanh thu")
        );
        return ResponseEntity.ok(features);
    }

    @PostMapping("/backup")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> backupDatabase() {
        try {
            String backupFile = databaseBackupService.backupDatabaseManual();
            auditLogService.logAction("BACKUP", "DATABASE", "Sao lưu dữ liệu: " + backupFile);
            return ResponseEntity.ok(Map.of("message", "Sao lưu thành công! File: " + backupFile));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi sao lưu: " + e.getMessage()));
        }
    }

    @GetMapping("/backups")
    public ResponseEntity<?> listBackups() {
        try {
            String backupDirPath = System.getProperty("user.dir") + java.io.File.separator + "backups";
            java.io.File backupDir = new java.io.File(backupDirPath);
            if (!backupDir.exists()) return ResponseEntity.ok(List.of());
            
            java.io.File[] files = backupDir.listFiles((dir, name) -> name.endsWith(".bak"));
            List<Map<String, Object>> backups = new java.util.ArrayList<>();
            if (files != null) {
                for (java.io.File f : files) {
                    Map<String, Object> info = new HashMap<>();
                    info.put("filename", f.getName());
                    info.put("size", f.length());
                    info.put("lastModified", f.lastModified());
                    backups.add(info);
                }
            }
            return ResponseEntity.ok(backups);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi liệt kê file backup: " + e.getMessage()));
        }
    }

    @DeleteMapping("/backups/{filename}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> deleteBackup(@PathVariable String filename) {
        try {
            // Bảo mật: Chặn Path Traversal
            if (filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
                return ResponseEntity.status(400).body(Map.of("message", "Tên file không hợp lệ!"));
            }
            String backupDirPath = System.getProperty("user.dir") + java.io.File.separator + "backups";
            java.io.File file = new java.io.File(backupDirPath, filename);
            if (file.exists() && file.delete()) {
                auditLogService.logAction("DELETE", "DATABASE_BACKUP", "Xóa bản sao lưu: " + filename);
                return ResponseEntity.ok(Map.of("message", "Đã xóa bản sao lưu thành công!"));
            }
            return ResponseEntity.status(404).body(Map.of("message", "Không tìm thấy file để xóa!"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi xóa file: " + e.getMessage()));
        }
    }

    @GetMapping("/newsletter/count")
    public ResponseEntity<?> getNewsletterCount() {
        try {
            // Lấy từ bảng KhachHang (những người có email)
            Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM KhachHang WHERE email IS NOT NULL AND email <> ''", Integer.class);
            return ResponseEntity.ok(Map.of("count", count != null ? count : 0));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("count", 0));
        }
    }

    @PostMapping("/send-mass-email")
    @PreAuthorize("hasAnyRole('ADMIN', 'QUAN_LY')")
    public ResponseEntity<?> sendMassEmail(@RequestBody Map<String, String> payload) {
        String subject = payload.get("subject");
        String content = payload.get("content");
        if (subject == null || content == null) return ResponseEntity.badRequest().body(Map.of("message", "Thiếu tiêu đề hoặc nội dung"));

        try {
            List<String> emails = jdbcTemplate.queryForList("SELECT email FROM KhachHang WHERE email IS NOT NULL AND email <> ''", String.class);
            for (String email : emails) {
                emailService.sendMassEmail(email, subject, content);
            }
            auditLogService.logAction("MARKETING", "EMAIL", "Gửi mail marketing tới " + emails.size() + " khách hàng");
            return ResponseEntity.ok(Map.of("success", true, "message", "Đã bắt đầu tiến trình gửi mail hàng loạt"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi hệ thống: " + e.getMessage()));
        }
    }

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        if (email == null || email.isEmpty()) return ResponseEntity.badRequest().body("Email trống");
        String otp = String.format("%06d", (int) (Math.random() * 1000000));
        otpStorage.put(email, otp);
        otpExpiry.put(email, System.currentTimeMillis() + OTP_TTL_MS);
        System.out.println("OTP cho " + email + " là: " + otp);
        return ResponseEntity.ok(Map.of("message", "Đã gửi OTP", "success", true));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String otp = payload.get("otp");
        if (email == null || otp == null) return ResponseEntity.badRequest().body(Map.of("message", "Thiếu email hoặc mã OTP"));
        Long expiry = otpExpiry.get(email);
        if (expiry == null || System.currentTimeMillis() > expiry) return ResponseEntity.status(400).body(Map.of("message", "Mã OTP đã hết hạn"));
        String storedOtp = otpStorage.get(email);
        if (storedOtp != null && storedOtp.equals(otp)) {
            verifiedEmails.put(email, "VERIFIED");
            otpStorage.remove(email);
            otpExpiry.remove(email);
            return ResponseEntity.ok(Map.of("message", "Xác minh thành công", "success", true));
        }
        return ResponseEntity.status(400).body(Map.of("message", "Mã OTP không chính xác"));
    }
}
