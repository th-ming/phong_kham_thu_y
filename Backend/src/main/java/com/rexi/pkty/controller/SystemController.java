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
import java.security.SecureRandom;
import java.util.concurrent.ConcurrentHashMap;
import java.util.logging.Logger;

@RestController
@RequestMapping("/api/system")
@CrossOrigin(origins = "*")
public class SystemController {

    private static final Logger logger = Logger.getLogger(SystemController.class.getName());

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private EmailService emailService;

    @Autowired
    private DatabaseBackupService databaseBackupService;

    @Autowired
    private AuditLogService auditLogService;

    // Các biến dùng chung cho AuthController (Duy trì tính tương thích)
    public static final Map<String, Long> verifiedEmails = new ConcurrentHashMap<>();
    private final Map<String, String> otpStorage = new ConcurrentHashMap<>();
    private final Map<String, Long> otpExpiry = new ConcurrentHashMap<>();
    private final Map<String, Integer> otpSendCount = new ConcurrentHashMap<>();
    private final Map<String, Long> otpSendWindowStart = new ConcurrentHashMap<>();
    private final Map<String, Long> otpLastSentAt = new ConcurrentHashMap<>();
    private final Map<String, Integer> otpVerifyFailures = new ConcurrentHashMap<>();
    private final Map<String, Long> otpVerifyLockedUntil = new ConcurrentHashMap<>();
    private static final long OTP_TTL_MS = 5 * 60 * 1000;
    public static final long VERIFIED_EMAIL_TTL_MS = 10 * 60 * 1000;
    private static final long OTP_SEND_WINDOW_MS = 10 * 60 * 1000;
    private static final long OTP_RESEND_COOLDOWN_MS = 60 * 1000;
    private static final long OTP_VERIFY_LOCK_MS = 10 * 60 * 1000;
    private static final int MAX_OTP_SENDS_PER_WINDOW = 3;
    private static final int MAX_OTP_VERIFY_FAILURES = 5;
    private static final SecureRandom OTP_RANDOM = new SecureRandom();

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of("status", "UP"));
    }

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
                int rowsUpdated = jdbcTemplate.update("UPDATE CauHinhHeThong SET gia_tri = ? WHERE ten_cau_hinh = ?", entry.getValue(), entry.getKey());
                if (rowsUpdated == 0) {
                    try {
                        jdbcTemplate.update("INSERT INTO CauHinhHeThong (ten_cau_hinh, gia_tri) VALUES (?, ?)", entry.getKey(), entry.getValue());
                    } catch (Exception ex) {
                        logger.warning("Không thể insert cấu hình " + entry.getKey() + ": " + ex.getMessage());
                    }
                }
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
            Map.of("id_chuc_nang", "1", "ma_chuc_nang", "TONG_QUAN", "ten_chuc_nang", "Tổng quan quản trị", "mo_ta", "Bảng điều khiển vận hành theo vai trò", "duong_dan", "/quan-ly/dashboard", "vai_tro", "ADMIN, QUAN_LY, BAC_SI, KE_TOAN, TIEP_TAN, Y_TA, STAFF"),
            Map.of("id_chuc_nang", "2", "ma_chuc_nang", "BAO_CAO", "ten_chuc_nang", "Báo cáo & Thống kê", "mo_ta", "KPI doanh thu, ca điều trị, bác sĩ và dịch vụ", "duong_dan", "/quan-ly/bao-cao-thong-ke", "vai_tro", "ADMIN, QUAN_LY, KE_TOAN"),
            Map.of("id_chuc_nang", "3", "ma_chuc_nang", "LICH_HEN", "ten_chuc_nang", "Quản lý lịch hẹn", "mo_ta", "Điều phối, xác nhận, check-in và hoàn tất lịch khám", "duong_dan", "/quan-ly/lich-hen", "vai_tro", "ADMIN, QUAN_LY, STAFF, BAC_SI, TIEP_TAN, Y_TA"),
            Map.of("id_chuc_nang", "4", "ma_chuc_nang", "LICH_TRUC", "ten_chuc_nang", "Điều hành nhân sự", "mo_ta", "Quản lý lịch trực, ca làm và tải nhân sự", "duong_dan", "/quan-ly/lich-lam-viec", "vai_tro", "ADMIN, QUAN_LY, STAFF, BAC_SI, TIEP_TAN, Y_TA"),
            Map.of("id_chuc_nang", "5", "ma_chuc_nang", "NHAN_SU", "ten_chuc_nang", "Nhân sự & Phân quyền", "mo_ta", "Tài khoản nhân viên, vai trò và quyền truy cập", "duong_dan", "/quan-ly/nhan-vien-phan-quyen", "vai_tro", "ADMIN, QUAN_LY"),
            Map.of("id_chuc_nang", "6", "ma_chuc_nang", "KHACH_HANG", "ten_chuc_nang", "Khách hàng & Thú cưng", "mo_ta", "Quản lý hồ sơ chủ nuôi và thú cưng", "duong_dan", "/quan-ly/khach-hang-thu-cung", "vai_tro", "ADMIN, QUAN_LY, TIEP_TAN, BAC_SI, Y_TA"),
            Map.of("id_chuc_nang", "7", "ma_chuc_nang", "DICH_VU", "ten_chuc_nang", "Danh mục dịch vụ", "mo_ta", "Bảng giá, thời lượng, mô tả dịch vụ và cấu hình hiển thị", "duong_dan", "/quan-ly/dich-vu", "vai_tro", "ADMIN, QUAN_LY, TIEP_TAN"),
            Map.of("id_chuc_nang", "8", "ma_chuc_nang", "KHAM_BENH", "ten_chuc_nang", "Khám bệnh & Kê đơn", "mo_ta", "Chọn ca khám, ghi bệnh án, kê đơn và hoàn tất điều trị", "duong_dan", "/quan-ly/kham-benh", "vai_tro", "ADMIN, BAC_SI"),
            Map.of("id_chuc_nang", "9", "ma_chuc_nang", "HO_SO_BENH_AN", "ten_chuc_nang", "Hồ sơ bệnh án", "mo_ta", "Tra cứu bệnh án, chẩn đoán, phác đồ và lịch sử điều trị", "duong_dan", "/quan-ly/ho-so-benh-an", "vai_tro", "ADMIN, QUAN_LY, BAC_SI, Y_TA"),
            Map.of("id_chuc_nang", "10", "ma_chuc_nang", "DON_THUOC", "ten_chuc_nang", "Kê đơn & Thuốc", "mo_ta", "Quản lý đơn thuốc và liên kết thuốc trong kho", "duong_dan", "/quan-ly/don-thuoc", "vai_tro", "ADMIN, BAC_SI"),
            Map.of("id_chuc_nang", "11", "ma_chuc_nang", "XET_NGHIEM", "ten_chuc_nang", "Xét nghiệm & Cận lâm sàng", "mo_ta", "Phiếu xét nghiệm, chỉ số và kết quả cận lâm sàng", "duong_dan", "/quan-ly/xet-nghiem", "vai_tro", "ADMIN, QUAN_LY, BAC_SI, Y_TA"),
            Map.of("id_chuc_nang", "12", "ma_chuc_nang", "TEP_Y_TE", "ten_chuc_nang", "Kho tệp y tế", "mo_ta", "Ảnh, tài liệu đính kèm và hồ sơ lâm sàng số", "duong_dan", "/quan-ly/file-dinh-kem", "vai_tro", "ADMIN, QUAN_LY, BAC_SI, Y_TA"),
            Map.of("id_chuc_nang", "13", "ma_chuc_nang", "KHO_THUOC", "ten_chuc_nang", "Danh mục kho thuốc", "mo_ta", "Tồn kho, hạn dùng, giá bán và cảnh báo thuốc", "duong_dan", "/quan-ly/kho-thuoc", "vai_tro", "ADMIN, QUAN_LY, KE_TOAN, BAC_SI, Y_TA, TIEP_TAN"),
            Map.of("id_chuc_nang", "14", "ma_chuc_nang", "NHAP_KHO", "ten_chuc_nang", "Nhập kho & Kiểm kê", "mo_ta", "Phiếu nhập, kiểm kê và luồng kho dược", "duong_dan", "/quan-ly/nhap-kho", "vai_tro", "ADMIN, QUAN_LY, KE_TOAN, BAC_SI, Y_TA, TIEP_TAN"),
            Map.of("id_chuc_nang", "15", "ma_chuc_nang", "HOA_DON", "ten_chuc_nang", "Hóa đơn & Thanh toán", "mo_ta", "Thu phí, trạng thái thanh toán và chi tiết hóa đơn", "duong_dan", "/quan-ly/hoa-don", "vai_tro", "ADMIN, QUAN_LY, KE_TOAN, TIEP_TAN"),
            Map.of("id_chuc_nang", "16", "ma_chuc_nang", "KE_TOAN", "ten_chuc_nang", "Tài chính - Kế toán", "mo_ta", "Doanh thu, công nợ, đối soát và xuất báo cáo", "duong_dan", "/quan-ly/ke-toan", "vai_tro", "ADMIN, QUAN_LY, KE_TOAN"),
            Map.of("id_chuc_nang", "17", "ma_chuc_nang", "MARKETING", "ten_chuc_nang", "Email Marketing", "mo_ta", "Chiến dịch chăm sóc khách hàng và nhắc lịch tái khám", "duong_dan", "/quan-ly/marketing", "vai_tro", "ADMIN, QUAN_LY"),
            Map.of("id_chuc_nang", "18", "ma_chuc_nang", "CAU_HINH", "ten_chuc_nang", "Cấu hình hệ thống", "mo_ta", "AI provider, SMTP, thanh toán, backup và nhật ký", "duong_dan", "/quan-ly/cau-hinh", "vai_tro", "ADMIN"),
            Map.of("id_chuc_nang", "19", "ma_chuc_nang", "PHAN_HE", "ten_chuc_nang", "Phân hệ chức năng", "mo_ta", "Bản đồ chức năng, route và quyền truy cập hệ thống", "duong_dan", "/quan-ly/chuc-nang", "vai_tro", "ADMIN"),
            Map.of("id_chuc_nang", "20", "ma_chuc_nang", "KHACH_APP", "ten_chuc_nang", "Cổng khách hàng", "mo_ta", "Thú cưng, đặt lịch, lịch sử khám, hồ sơ y tế, hóa đơn và hồ sơ cá nhân", "duong_dan", "/khach-hang/dashboard", "vai_tro", "KHACH_HANG")
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

    @GetMapping("/backups/download/{filename}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<org.springframework.core.io.Resource> downloadBackup(@PathVariable String filename) {
        try {
            // Bảo mật: Chặn Path Traversal
            if (filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
                return ResponseEntity.status(400).build();
            }
            String backupDirPath = System.getProperty("user.dir") + java.io.File.separator + "backups";
            java.io.File file = new java.io.File(backupDirPath, filename);
            if (!file.exists()) {
                return ResponseEntity.status(404).build();
            }

            org.springframework.core.io.Resource resource = new org.springframework.core.io.UrlResource(file.toURI());
            return ResponseEntity.ok()
                    .header(org.springframework.http.HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getName() + "\"")
                    .contentType(org.springframework.http.MediaType.APPLICATION_OCTET_STREAM)
                    .contentLength(file.length())
                    .body(resource);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/newsletter/count")
    public ResponseEntity<?> getNewsletterCount() {
        try {
            // Lấy từ bảng KhachHang (những người có email và đồng ý nhận email marketing, chưa bị xóa)
            Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM KhachHang WHERE email IS NOT NULL AND email <> '' AND (nhan_email = 1 OR nhan_email IS NULL) AND da_xoa = 0", Integer.class);
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
            // Chỉ lấy email của khách hàng đồng ý nhận email marketing và chưa bị xóa
            List<String> emails = jdbcTemplate.queryForList("SELECT email FROM KhachHang WHERE email IS NOT NULL AND email <> '' AND (nhan_email = 1 OR nhan_email IS NULL) AND da_xoa = 0", String.class);
            for (String email : emails) {
                emailService.sendMassEmail(email, subject, content);
            }
            auditLogService.logAction("MARKETING", "EMAIL", "Gửi mail marketing tới " + emails.size() + " khách hàng");
            return ResponseEntity.ok(Map.of("success", true, "message", "Đã bắt đầu tiến trình gửi mail hàng loạt"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi hệ thống: " + e.getMessage()));
        }
    }
    
    @PostMapping("/test-email")
    @PreAuthorize("hasAnyRole('ADMIN', 'QUAN_LY')")
    public ResponseEntity<?> testEmailConnection(@RequestBody Map<String, String> payload) {
        String host = payload.get("mail_host");
        String portStr = payload.get("mail_port");
        String username = payload.get("mail_username");
        String password = payload.get("mail_password");
        String toEmail = payload.get("toEmail");

        if (host == null || host.trim().isEmpty() ||
            username == null || username.trim().isEmpty() ||
            password == null || password.trim().isEmpty() ||
            toEmail == null || toEmail.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng nhập đầy đủ thông tin SMTP và Email nhận test."));
        }

        try {
            org.springframework.mail.javamail.JavaMailSenderImpl impl = new org.springframework.mail.javamail.JavaMailSenderImpl();
            impl.setHost(host.trim());
            impl.setPort(Integer.parseInt(portStr != null ? portStr.trim() : "587"));
            impl.setUsername(username.trim());
            impl.setPassword(password.trim());

            java.util.Properties props = impl.getJavaMailProperties();
            props.put("mail.smtp.auth", "true");
            props.put("mail.smtp.starttls.enable", "true");
            props.put("mail.transport.protocol", "smtp");
            props.put("mail.smtp.timeout", "5000");
            props.put("mail.smtp.connectiontimeout", "5000");

            org.springframework.mail.SimpleMailMessage message = new org.springframework.mail.SimpleMailMessage();
            message.setTo(toEmail.trim());
            message.setSubject("🐾 Thử nghiệm Kết nối SMTP - Rexi Vet");
            message.setText("Xin chào sếp,\n\nĐây là email kiểm tra kết nối hệ thống SMTP động từ trang quản trị Rexi Vet.\n\nKết nối SMTP đã HOẠT ĐỘNG HOÀN HẢO! 🎉🐾");
            
            impl.send(message);
            return ResponseEntity.ok(Map.of("success", true, "message", "Gửi email thử nghiệm thành công! Vui lòng kiểm tra hộp thư đến của " + toEmail));
        } catch (Exception e) {
            logger.severe("Lỗi kết nối test SMTP: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("success", false, "message", "Kết nối thất bại: " + e.getMessage()));
        }
    }

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> payload,
            jakarta.servlet.http.HttpServletRequest request) {
        String email = normalizeEmail(payload.get("email"));
        if (email == null || email.isEmpty()) return ResponseEntity.badRequest().body(Map.of("message", "Email trống", "success", false));

        String rateKey = email + "|" + getClientIp(request);
        ResponseEntity<?> rateLimitResponse = checkOtpSendRateLimit(rateKey);
        if (rateLimitResponse != null) return rateLimitResponse;
        
        // Kiểm tra xem Email có tồn tại trong hệ thống (nhân viên hoặc khách hàng) không
        String sql = "SELECT COUNT(*) FROM (SELECT email FROM KhachHang WHERE LOWER(email) = LOWER(?) UNION SELECT email FROM NhanVien WHERE LOWER(email) = LOWER(?)) AS tbl";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, email, email);
        if (count == null || count == 0) {
            return ResponseEntity.status(400).body(Map.of("message", "Email không tồn tại trên hệ thống!", "success", false));
        }

        String otp = String.format("%06d", OTP_RANDOM.nextInt(1_000_000));
        otpStorage.put(email, otp);
        otpExpiry.put(email, System.currentTimeMillis() + OTP_TTL_MS);
        
        // Thực tế gửi email OTP cho người dùng
        boolean sent = emailService.sendOtpEmail(email, otp);
        if (!sent) {
            otpStorage.remove(email);
            otpExpiry.remove(email);
            return ResponseEntity.status(500).body(Map.of("message", "Không gửi được email OTP. Vui lòng kiểm tra cấu hình SMTP.", "success", false));
        }

        recordOtpSend(rateKey);
        otpVerifyFailures.remove(email);
        otpVerifyLockedUntil.remove(email);
        
        logger.info("OTP cho " + email + " đã được sinh và gửi.");
        return ResponseEntity.ok(Map.of("message", "Đã gửi OTP", "success", true));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> payload) {
        String email = normalizeEmail(payload.get("email"));
        String otp = payload.get("otp");
        if (email == null || otp == null) return ResponseEntity.badRequest().body(Map.of("message", "Thiếu email hoặc mã OTP"));
        if (!otp.matches("\\d{6}")) return ResponseEntity.status(400).body(Map.of("message", "Mã OTP phải gồm 6 chữ số"));
        Long lockedUntil = otpVerifyLockedUntil.get(email);
        if (lockedUntil != null && System.currentTimeMillis() < lockedUntil) {
            return ResponseEntity.status(429).body(Map.of("message", "Bạn đã nhập sai OTP quá nhiều lần. Vui lòng thử lại sau 10 phút."));
        }
        Long expiry = otpExpiry.get(email);
        if (expiry == null || System.currentTimeMillis() > expiry) return ResponseEntity.status(400).body(Map.of("message", "Mã OTP đã hết hạn"));
        String storedOtp = otpStorage.get(email);
        if (storedOtp != null && storedOtp.equals(otp)) {
            verifiedEmails.put(email, System.currentTimeMillis() + VERIFIED_EMAIL_TTL_MS);
            otpStorage.remove(email);
            otpExpiry.remove(email);
            otpVerifyFailures.remove(email);
            otpVerifyLockedUntil.remove(email);
            return ResponseEntity.ok(Map.of("message", "Xác minh thành công", "success", true));
        }
        int failures = otpVerifyFailures.getOrDefault(email, 0) + 1;
        otpVerifyFailures.put(email, failures);
        if (failures >= MAX_OTP_VERIFY_FAILURES) {
            otpVerifyLockedUntil.put(email, System.currentTimeMillis() + OTP_VERIFY_LOCK_MS);
            otpStorage.remove(email);
            otpExpiry.remove(email);
            return ResponseEntity.status(429).body(Map.of("message", "Bạn đã nhập sai OTP quá nhiều lần. Vui lòng gửi mã mới sau 10 phút."));
        }
        return ResponseEntity.status(400).body(Map.of("message", "Mã OTP không chính xác"));
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase();
    }

    private ResponseEntity<?> checkOtpSendRateLimit(String rateKey) {
        long now = System.currentTimeMillis();
        Long lastSentAt = otpLastSentAt.get(rateKey);
        if (lastSentAt != null && now - lastSentAt < OTP_RESEND_COOLDOWN_MS) {
            return ResponseEntity.status(429).body(Map.of("message", "Vui lòng chờ 60 giây trước khi gửi lại mã OTP.", "success", false));
        }

        Long windowStart = otpSendWindowStart.get(rateKey);
        if (windowStart == null || now - windowStart > OTP_SEND_WINDOW_MS) {
            otpSendWindowStart.put(rateKey, now);
            otpSendCount.put(rateKey, 0);
            return null;
        }

        if (otpSendCount.getOrDefault(rateKey, 0) >= MAX_OTP_SENDS_PER_WINDOW) {
            return ResponseEntity.status(429).body(Map.of("message", "Bạn đã yêu cầu quá nhiều mã OTP. Vui lòng thử lại sau 10 phút.", "success", false));
        }
        return null;
    }

    private void recordOtpSend(String rateKey) {
        otpLastSentAt.put(rateKey, System.currentTimeMillis());
        otpSendCount.put(rateKey, otpSendCount.getOrDefault(rateKey, 0) + 1);
    }

    private String getClientIp(jakarta.servlet.http.HttpServletRequest request) {
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
