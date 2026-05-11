package com.rexi.pkty.controller;

import com.rexi.pkty.service.EmailService;
import com.rexi.pkty.service.DatabaseBackupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.concurrent.ConcurrentHashMap;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/system")
@CrossOrigin(origins = "${cors.allowed-origins:http://localhost:3000}")
public class SystemController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private EmailService emailService;

    @Autowired
    private DatabaseBackupService databaseBackupService;

    @Autowired
    private com.rexi.pkty.service.AuditLogService auditLogService;

    public static final java.util.Map<String, String> verifiedEmails = new java.util.concurrent.ConcurrentHashMap<>();
    private final Map<String, String> otpStorage = new ConcurrentHashMap<>();
    private final Map<String, Long> otpExpiry = new ConcurrentHashMap<>();
    private static final long OTP_TTL_MS = 5 * 60 * 1000;

    @Autowired
    public SystemController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
        init();
    }

    public void init() {
        try {
            // Tạo bảng Đăng ký nhận tin (Newsletter) - Phiên bản chuẩn tiếng Việt
            jdbcTemplate.execute("IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='DangKyNhanTin' AND xtype='U') " +
                    "CREATE TABLE DangKyNhanTin (id INT IDENTITY(1,1) PRIMARY KEY, Email NVARCHAR(255) UNIQUE NOT NULL, NgayDangKy DATETIME DEFAULT GETDATE())");

            // Tạo bảng Cấu hình hệ thống
            jdbcTemplate.execute("IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='CauHinhHeThong' AND xtype='U') " +
                    "CREATE TABLE CauHinhHeThong (id_cau_hinh INT IDENTITY(1,1) PRIMARY KEY, ten_cau_hinh VARCHAR(100) UNIQUE, gia_tri NVARCHAR(500), mo_ta NVARCHAR(500))");

            jdbcTemplate.execute("IF NOT EXISTS (SELECT * FROM CauHinhHeThong WHERE ten_cau_hinh='maintenance_mode') " +
                    "INSERT INTO CauHinhHeThong (ten_cau_hinh, gia_tri, mo_ta) VALUES ('maintenance_mode', 'false', N'Bật/Tắt chế độ bảo trì toàn hệ thống.')");

            // Nâng cấp Schema
            try {
                jdbcTemplate.execute(
                        "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('NhanVien') AND name = 'gioi_thieu') ALTER TABLE NhanVien ADD gioi_thieu NVARCHAR(MAX)");
                jdbcTemplate.execute(
                        "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('NhanVien') AND name = 'hinh_anh') ALTER TABLE NhanVien ADD hinh_anh NVARCHAR(MAX)");
                jdbcTemplate.execute(
                        "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('NhanVien') AND name = 'da_xoa') ALTER TABLE NhanVien ADD da_xoa BIT DEFAULT 0");
                jdbcTemplate.execute(
                        "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ThuCung') AND name = 'ghi_chu') ALTER TABLE ThuCung ADD ghi_chu NVARCHAR(MAX)");
                jdbcTemplate.execute(
                        "IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('DichVu') AND name = 'trang_thai') ALTER TABLE DichVu ADD trang_thai BIT DEFAULT 1");
                jdbcTemplate.execute("UPDATE DichVu SET trang_thai = 1 WHERE trang_thai IS NULL");
            } catch (Exception ignored) {
            }

            seedData();
        } catch (Exception e) {
            System.err.println("Lỗi khởi tạo hệ thống: " + e.getMessage());
        }
    }

    private void seedData() {
        try {
            Integer existing = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM LichHen", Integer.class);
            if (existing != null && existing > 10)
                return;

            System.out.println("Bắt đầu tự động Seeding dữ liệu Rexi...");

            // Seeding Khách hàng
            String sampleKhId = null;
            try {
                sampleKhId = jdbcTemplate.queryForObject("SELECT TOP 1 id_khach_hang FROM KhachHang", String.class);
            } catch (Exception e) {
                jdbcTemplate.update(
                        "INSERT INTO KhachHang (id_khach_hang, ten_khach_hang, sdt, email, ngay_tao, da_xoa) VALUES ('KH001', N'Khách Hàng Test', '0912345678', 'test@rexi.com', GETDATE(), 0)");
                sampleKhId = "KH001";
            }

            // Seeding Thú cưng
            String sampleTcId = null;
            try {
                sampleTcId = jdbcTemplate.queryForObject("SELECT TOP 1 id_thu_cung FROM ThuCung", String.class);
            } catch (Exception e) {
                jdbcTemplate.update(
                        "INSERT INTO ThuCung (id_thu_cung, ten_thu_cung, loai, giong, id_khach_hang) VALUES ('TC001', N'Mèo Mướp', N'Mèo', N'Ta', ?)",
                        sampleKhId);
                sampleTcId = "TC001";
            }

            // Seeding Dịch vụ
            try {
                Integer dvCount = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM DichVu", Integer.class);
                if (dvCount == 0) {
                    jdbcTemplate.update(
                            "INSERT INTO DichVu (ten_dich_vu, gia, thoi_luong_phut, mo_ta, trang_thai) VALUES (N'Khám tổng quát', 150000, 30, N'Kiểm tra sức khỏe định kỳ', 1)");
                    jdbcTemplate.update(
                            "INSERT INTO DichVu (ten_dich_vu, gia, thoi_luong_phut, mo_ta, trang_thai) VALUES (N'Siêu âm', 350000, 30, N'Chẩn đoán hình ảnh', 1)");
                }
            } catch (Exception ignored) {
            }

        } catch (Exception e) {
            System.err.println("Lỗi Seeding: " + e.getMessage());
        }
    }

    @GetMapping("/debug-data")
    public ResponseEntity<?> getDebugData() {
        Map<String, Object> data = new HashMap<>();
        data.put("doctors", jdbcTemplate.queryForList("SELECT ho_ten, chuyen_mon, email, id_tai_khoan FROM NhanVien"));
        data.put("all_nhan_vien", jdbcTemplate.queryForList("SELECT * FROM NhanVien"));
        data.put("services", jdbcTemplate.queryForList("SELECT ten_dich_vu, gia, trang_thai FROM DichVu"));
        data.put("accounts", jdbcTemplate.queryForList("SELECT ten_dang_nhap, id_vai_tro FROM TaiKhoan"));
        data.put("roles", jdbcTemplate.queryForList("SELECT * FROM VaiTroHeThong"));
        data.put("stats", Map.of(
                "appointments", jdbcTemplate.queryForObject("SELECT COUNT(*) FROM LichHen", Integer.class),
                "pets", jdbcTemplate.queryForObject("SELECT COUNT(*) FROM ThuCung", Integer.class),
                "customers", jdbcTemplate.queryForObject("SELECT COUNT(*) FROM KhachHang", Integer.class),
                "schedules", jdbcTemplate.queryForObject("SELECT COUNT(*) FROM LichLamViecNhanVien", Integer.class)));
        data.put("recent_schedules",
                jdbcTemplate.queryForList("SELECT TOP 5 * FROM LichLamViecNhanVien ORDER BY ngay DESC"));
        return ResponseEntity.ok(data);
    }

    @GetMapping("/cau-hinh")
    public ResponseEntity<?> getCauHinh() {
        return ResponseEntity.ok(jdbcTemplate.queryForList("SELECT * FROM CauHinhHeThong"));
    }

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        if (email == null || email.isEmpty())
            return ResponseEntity.badRequest().body("Email trống");
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

        if (email == null || otp == null || email.isEmpty() || otp.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Thiếu email hoặc mã OTP"));
        }

        Long expiry = otpExpiry.get(email);
        if (expiry == null || System.currentTimeMillis() > expiry) {
            return ResponseEntity.status(400).body(Map.of("message", "Mã OTP đã hết hạn"));
        }

        String storedOtp = otpStorage.get(email);
        if (storedOtp != null && storedOtp.equals(otp)) {
            verifiedEmails.put(email, "VERIFIED");
            otpStorage.remove(email); // Xóa OTP sau khi xác minh thành công
            otpExpiry.remove(email);
            return ResponseEntity.ok(Map.of("message", "Xác minh OTP thành công", "success", true));
        }

        return ResponseEntity.status(400).body(Map.of("message", "Mã OTP không chính xác"));
    }
}
