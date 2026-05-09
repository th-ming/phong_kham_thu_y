package com.rexi.pkty.controller;

import com.rexi.pkty.service.EmailService;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.boot.CommandLineRunner;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/system")
@CrossOrigin(origins = "${cors.allowed-origins:http://localhost:3000}")
public class SystemController implements CommandLineRunner {

    // Bộ nhớ tạm lưu mã OTP (Email -> OTP)
    private static final ConcurrentHashMap<String, String> otpStorage = new ConcurrentHashMap<>();
    // Thời điểm hết hạn của OTP (milliseconds)
    private static final ConcurrentHashMap<String, Long> otpExpiry = new ConcurrentHashMap<>();
    // Danh sách email đã xác minh OTP thành công — AuthController dùng để cho phép
    // reset password
    public static final java.util.Set<String> verifiedEmails = java.util.Collections
            .newSetFromMap(new ConcurrentHashMap<>());
    private static final long OTP_TTL_MS = 5 * 60 * 1000; // 5 phút

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private EmailService emailService;

    @Autowired
    private com.rexi.pkty.service.DatabaseBackupService databaseBackupService;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("Hệ thống Rexi đang khởi tạo (CommandLineRunner)...");
        init();
    }

    public void init() {
        try {
            // Tạo bảng Newsletter nếu chưa có
            jdbcTemplate.execute("IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Newsletter' AND xtype='U') " +
                    "CREATE TABLE Newsletter (id INT IDENTITY(1,1) PRIMARY KEY, email NVARCHAR(255) UNIQUE, ngay_dang_ky DATETIME DEFAULT GETDATE())");

            // Tạo bảng Cấu hình hệ thống
            jdbcTemplate.execute("IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='CauHinhHeThong' AND xtype='U') " +
                    "CREATE TABLE CauHinhHeThong (ten_cau_hinh VARCHAR(100) PRIMARY KEY, gia_tri NVARCHAR(500))");
            jdbcTemplate.execute(
                    "IF NOT EXISTS (SELECT * FROM CauHinhHeThong WHERE ten_cau_hinh='backup_retention_days') " +
                            "INSERT INTO CauHinhHeThong (ten_cau_hinh, gia_tri) VALUES ('backup_retention_days', '7')");
            jdbcTemplate.execute(
                    "IF NOT EXISTS (SELECT * FROM CauHinhHeThong WHERE ten_cau_hinh='blocked_ips') " +
                            "INSERT INTO CauHinhHeThong (ten_cau_hinh, gia_tri) VALUES ('blocked_ips', '')");

            // Tạo bảng Nhật ký hệ thống (Audit Log)
            jdbcTemplate.execute("IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='NhatKyHeThong' AND xtype='U') " +
                    "CREATE TABLE NhatKyHeThong (id INT IDENTITY(1,1) PRIMARY KEY, nguoi_thao_tac VARCHAR(100), hanh_dong NVARCHAR(255), bang_du_lieu VARCHAR(100), chi_tiet NVARCHAR(MAX), ngay_tao DATETIME DEFAULT GETDATE())");

            // TỰ ĐỘNG BƠM DỮ LIỆU TEST (SEEDER)
            seedData();
        } catch (Exception e) {
            System.err.println("Lỗi khởi tạo hệ thống: " + e.getMessage());
        }
    }

    private void seedData() {
        try {
            // Kiểm tra xem đã có dữ liệu chưa để tránh bơm trùng
            Integer existing = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM LichHen", Integer.class);
            if (existing != null && existing > 10) {
                System.out.println("Hệ thống đã có dữ liệu lịch hẹn, bỏ qua Seeding.");
                return;
            }

            System.out.println("Bắt đầu tự động Seeding dữ liệu Rexi...");

            // Đảm bảo có dữ liệu mẫu
            String sampleKhId = null;
            try {
                sampleKhId = jdbcTemplate.queryForObject("SELECT TOP 1 id_khach_hang FROM KhachHang", String.class);
            } catch (Exception e) {
                jdbcTemplate.update(
                        "INSERT INTO KhachHang (id_khach_hang, ten_khach_hang, sdt, email, mat_khau, trang_thai) VALUES ('KH001', N'Khách Hàng Test', '0912345678', 'test@rexi.com', '123456', 'ACTIVE')");
                sampleKhId = jdbcTemplate.queryForObject(
                        "SELECT TOP 1 id_khach_hang FROM KhachHang ORDER BY id_khach_hang DESC", String.class);
            }

            String sampleTcId = null;
            try {
                sampleTcId = jdbcTemplate.queryForObject("SELECT TOP 1 id_thu_cung FROM ThuCung", String.class);
            } catch (Exception e) {
                jdbcTemplate.update(
                        "INSERT INTO ThuCung (id_thu_cung, ten_thu_cung, loai, giong, id_khach_hang) VALUES ('TC001', N'Boss Test', N'Mèo', N'Anh lông ngắn', ?)",
                        sampleKhId);
                sampleTcId = jdbcTemplate.queryForObject(
                        "SELECT TOP 1 id_thu_cung FROM ThuCung ORDER BY id_thu_cung DESC", String.class);
            }

            String sampleDvId = null;
            try {
                sampleDvId = jdbcTemplate.queryForObject("SELECT TOP 1 id_dich_vu FROM DichVu", String.class);
            } catch (Exception e) {
                jdbcTemplate.update(
                        "INSERT INTO DichVu (id_dich_vu, ten_dich_vu, gia, thoi_luong_phut, mo_ta) VALUES ('DV001', N'Khám tổng quát', 150000, 30, N'Dịch vụ test')");
                sampleDvId = jdbcTemplate.queryForObject("SELECT TOP 1 id_dich_vu FROM DichVu ORDER BY id_dich_vu DESC",
                        String.class);
            }

            // Lấy danh sách bác sĩ
            List<String> doctorIds = jdbcTemplate
                    .queryForList("SELECT id_nhan_vien FROM NhanVien WHERE chuyen_mon LIKE N'%Bác sĩ%'", String.class);
            if (doctorIds.isEmpty()) {
                System.out.println("Không có bác sĩ để bơm lịch!");
                return;
            }

            // Bơm lịch 14 ngày tới
            String[] slots = { "08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00" };
            java.time.LocalDate today = java.time.LocalDate.now();
            int count = 0;

            for (int i = 0; i < 14; i++) {
                java.time.LocalDate date = today.plusDays(i);
                for (String docId : doctorIds) {
                    for (String t : slots) {
                        if (Math.random() > 0.3) {
                            try {
                                jdbcTemplate.update(
                                        "INSERT INTO LichHen (ngay_kham, gio_kham, id_bac_si, id_khach_hang, id_thu_cung, id_dich_vu, ly_do, trang_thai, ngay_tao, id_nguoi_dat) VALUES (?, ?, ?, ?, ?, ?, N'Auto Seeded', 'CHO_XAC_NHAN', GETDATE(), ?)",
                                        date, java.time.LocalTime.parse(t), docId, sampleKhId, sampleTcId, sampleDvId,
                                        sampleKhId);
                                count++;
                            } catch (Exception ignored) {
                            }
                        }
                    }
                }
            }
            System.out.println("Tự động bơm thành công " + count + " lịch hẹn!");
        } catch (Exception e) {
            System.err.println("Lỗi Seeding: " + e.getMessage());
        }
    }

    @GetMapping("/chuc-nang")
    public List<Map<String, Object>> getChucNang() {
        return jdbcTemplate.queryForList("SELECT * FROM ChucNang");
    }

    @PostMapping("/newsletter")
    public ResponseEntity<?> subscribeNewsletter(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        if (email == null || email.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email không được trống"));
        }
        try {
            // Lưu vào DB (Dùng MERGE hoặc kiểm tra tồn tại để tránh lỗi trùng lặp)
            jdbcTemplate.update(
                    "IF NOT EXISTS (SELECT 1 FROM Newsletter WHERE email = ?) INSERT INTO Newsletter (email) VALUES (?)",
                    email, email);

            emailService.sendNewsletterWelcomeEmail(email);
            return ResponseEntity.ok(Map.of("message", "Đăng ký thành công", "success", true));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi lưu DB: " + e.getMessage()));
        }
    }

    @GetMapping("/newsletter/count")
    public ResponseEntity<?> getNewsletterCount() {
        try {
            Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM Newsletter", Integer.class);
            return ResponseEntity.ok(Map.of("count", count != null ? count : 0));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi đếm subscriber: " + e.getMessage()));
        }
    }

    @GetMapping("/cau-hinh")
    public ResponseEntity<?> getCauHinh() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        String role = (auth != null) ? auth.getAuthorities().toString().toUpperCase() : "";
        if (!role.contains("ADMIN")) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Cảnh báo bảo mật: Chỉ Admin mới có quyền xem cấu hình!"));
        }
        List<Map<String, Object>> configs = jdbcTemplate.queryForList("SELECT * FROM CauHinhHeThong");
        Map<String, String> result = new java.util.HashMap<>();
        for (Map<String, Object> row : configs) {
            result.put((String) row.get("ten_cau_hinh"), (String) row.get("gia_tri"));
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/cau-hinh")
    public ResponseEntity<?> updateCauHinh(@RequestBody Map<String, String> payload) {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        String role = (auth != null) ? auth.getAuthorities().toString().toUpperCase() : "";
        if (!role.contains("ADMIN")) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Cảnh báo bảo mật: Chỉ Admin mới có quyền sửa cấu hình!"));
        }
        try {
            for (Map.Entry<String, String> entry : payload.entrySet()) {
                int updated = jdbcTemplate.update("UPDATE CauHinhHeThong SET gia_tri = ? WHERE ten_cau_hinh = ?",
                        entry.getValue(), entry.getKey());
                if (updated == 0) {
                    jdbcTemplate.update("INSERT INTO CauHinhHeThong (ten_cau_hinh, gia_tri) VALUES (?, ?)",
                            entry.getKey(), entry.getValue());
                }
            }
            return ResponseEntity.ok(Map.of("message", "Cập nhật cấu hình thành công!"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi: " + e.getMessage()));
        }
    }

    @PostMapping("/send-mass-email")
    public ResponseEntity<?> sendMassEmail(@RequestBody Map<String, String> payload) {
        // BẢO MẬT: Cho phép Admin và Nhân viên (Tiếp tân) gửi mail hàng loạt
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        String role = (auth != null) ? auth.getAuthorities().toString().toUpperCase() : "";
        if (!role.contains("ADMIN") && !role.contains("STAFF")) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Chỉ Admin hoặc Nhân viên/Tiếp tân mới có quyền gửi email hàng loạt!"));
        }

        String subject = payload.get("subject");
        String content = payload.get("content");

        if (subject == null || content == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Tiêu đề và nội dung không được để trống sếp ơi!"));
        }

        try {
            List<String> emails = jdbcTemplate.queryForList("SELECT email FROM Newsletter", String.class);

            // HIỆU NĂNG: Đưa tiến trình gửi mail xuống chạy ngầm để không gây treo
            new Thread(() -> {
                for (String email : emails) {
                    try {
                        emailService.sendCustomEmail(email, subject, content);
                    } catch (Exception ignored) {
                    }
                }
            }).start();

            return ResponseEntity.ok(Map.of("message",
                    "Hệ thống đang tiến hành gửi mail ngầm tới " + emails.size() + " khách hàng! 🚀", "success", true));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi gửi mail hàng loạt: " + e.getMessage()));
        }
    }

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String phone = payload.get("phone");
        String target = (email != null && !email.isEmpty()) ? email : phone;

        if (target == null || target.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email hoặc Số điện thoại không được trống"));
        }
        try {
            String otp = String.format("%06d", (int) (Math.random() * 1000000));
            otpStorage.put(target, otp);
            otpExpiry.put(target, System.currentTimeMillis() + OTP_TTL_MS);
            verifiedEmails.remove(target); // Xóa trạng thái verified cũ khi gửi OTP mới

            if (email != null && !email.isEmpty()) {
                emailService.sendCustomEmail(email, "🐾 MÃ XÁC MINH REXI VET - OTP",
                        "Chào sếp! Mã xác minh OTP của sếp là: [" + otp
                                + "]. Mã này có hiệu lực trong 5 phút. Vui lòng không chia sẻ mã này cho bất kỳ ai! 🐾");
            } else {
                // GIẢ LẬP GỬI SMS (Trong thực tế sẽ gọi API Twilio/SpeedSMS tại đây)
                // KHÔNG in OTP ra console ở môi trường Production
            }

            return ResponseEntity
                    .ok(Map.of("message", "Đã gửi mã OTP tới " + target, "success", true, "simulated", email == null));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi gửi OTP: " + e.getMessage()));
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String phone = payload.get("phone");
        String target = (email != null && !email.isEmpty()) ? email : phone;
        String otp = payload.get("otp");

        if (target == null || otp == null) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Thông tin xác thực (Email/SĐT) và OTP không được trống"));
        }

        String storedOtp = otpStorage.get(target);
        Long expiry = otpExpiry.get(target);
        boolean isExpired = (expiry == null || System.currentTimeMillis() > expiry);

        if (storedOtp != null && !isExpired && storedOtp.equals(otp)) {
            otpStorage.remove(target); // Xóa OTP sau khi dùng — tránh tái sử dụng
            otpExpiry.remove(target);
            verifiedEmails.add(target); // Đánh dấu đã qua xác minh OTP
            return ResponseEntity.ok(Map.of("message", "Xác minh OTP thành công", "success", true));
        } else {
            String reason = isExpired ? "đã hết hạn (5 phút)" : "không chính xác";
            return ResponseEntity.status(401).body(Map.of("message", "Mã OTP " + reason, "success", false));
        }
    }

    // REMOVED: /reset-admin endpoint đã bị xóa vì đây là backdoor nguy hiểm trong
    // Production

    // BẢO MẬT: API Sao lưu Cơ sở dữ liệu thủ công (Chỉ dành cho ADMIN)
    @PostMapping("/backup")
    public ResponseEntity<?> manualBackup() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        String role = (auth != null) ? auth.getAuthorities().toString().toUpperCase() : "";
        if (!role.contains("ADMIN")) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Cảnh báo bảo mật: Chỉ Admin mới có quyền sao lưu dữ liệu hệ thống!"));
        }
        try {
            String fileName = databaseBackupService.backupDatabaseManual();
            return ResponseEntity.ok(Map.of("message", "Sao lưu CSDL thành công!", "file_path", fileName));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi trong quá trình sao lưu: " + e.getMessage()));
        }
    }

    // BẢO MẬT: API Xem nhật ký hệ thống (Chỉ dành cho ADMIN/QUẢN LÝ)
    @GetMapping("/nhat-ky")
    public ResponseEntity<?> getNhatKyHeThong() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        String role = (auth != null) ? auth.getAuthorities().toString().toUpperCase() : "";
        if (!role.contains("ADMIN") && !role.contains("QUANLY")) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Cảnh báo bảo mật: Chỉ Admin và Quản lý mới được xem nhật ký hệ thống!"));
        }
        return ResponseEntity
                .ok(jdbcTemplate.queryForList("SELECT TOP 500 * FROM NhatKyHeThong ORDER BY ngay_tao DESC"));
    }
}

