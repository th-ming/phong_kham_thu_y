package com.rexi.pkty.controller;

import com.rexi.pkty.service.EmailService;
import com.rexi.pkty.service.DatabaseBackupService;
import com.rexi.pkty.service.AuditLogService;
import com.rexi.pkty.service.SecurityAlertService;
import com.rexi.pkty.util.DatabaseDialect;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.security.access.prepost.PreAuthorize;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.security.SecureRandom;
import java.util.concurrent.ConcurrentHashMap;
import java.util.logging.Logger;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/system")
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

    @Autowired(required = false)
    private SecurityAlertService securityAlertService;

    // Bien dung chung cho AuthController
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
    private final ObjectMapper objectMapper = new ObjectMapper();

    @org.springframework.beans.factory.annotation.Value("${app.frontend-url:http://localhost:3005}")
    private String frontendUrl;

    // Rate limit gửi mass email: mỗi user chỉ được gửi 1 lần/giờ
    private final Map<String, Long> massEmailLastSentAt = new ConcurrentHashMap<>();
    private static final long MASS_EMAIL_COOLDOWN_MS = 60 * 60 * 1000; // 1 giờ
    private static final int MASS_EMAIL_MAX_BATCH = 500; // Giới hạn tối đa 500 địa chỉ 1 lần
    private final HttpClient aiTestClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(8))
            .build();

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        return ResponseEntity.ok(Map.of("status", "UP"));
    }

    @PostMapping("/client-error")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> reportClientError(@RequestBody Map<String, Object> payload, HttpServletRequest request) {
        try {
            if (securityAlertService == null) {
                return ResponseEntity.ok(Map.of("received", true, "realtime", false));
            }
            // Dùng extractRealIp để hỗ trợ Cloudflare / nginx proxy — tránh chặn nhầm IP proxy
            String ip = securityAlertService.extractRealIp(request);
            String userAgent = request.getHeader("User-Agent");
            Map<String, Object> alert = securityAlertService.reportClientError(payload, ip, userAgent);
            return ResponseEntity.ok(Map.of("received", true, "alertId", alert.get("id")));
        } catch (Exception e) {
            logger.warning("Không thể ghi nhận lỗi frontend: " + e.getMessage());
            return ResponseEntity.ok(Map.of("received", false));
        }
    }

    @GetMapping("/cau-hinh")
    @PreAuthorize("hasRole('ADMIN')")
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

    @GetMapping("/public-cau-hinh")
    public ResponseEntity<?> getPublicCauHinh() {
        try {
            String appName = readConfig("app_name");
            return ResponseEntity.ok(Map.of(
                    "app_name", appName == null || appName.isBlank() ? "Rexi - Phong Kham Thu Y" : appName
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("app_name", "Rexi - Phong Kham Thu Y"));
        }
    }

    @PostMapping("/cau-hinh")
    @PreAuthorize("hasRole('ADMIN')")
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
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getNhatKy() {
        try {
            StringBuilder logsSql = new StringBuilder("SELECT * FROM NhatKyHeThong ORDER BY ngay_tao DESC");
            DatabaseDialect.appendPagination(logsSql, DatabaseDialect.isPostgres(jdbcTemplate), 100, 0);
            List<Map<String, Object>> logs = jdbcTemplate.queryForList(logsSql.toString());
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

    @GetMapping("/security/blocked-ips")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> getBlockedIps() {
        if (securityAlertService == null) {
            return ResponseEntity.ok(Map.of("blockedIps", List.of(), "alerts", List.of()));
        }
        return ResponseEntity.ok(Map.of(
                "blockedIps", securityAlertService.getBlockedIps(),
                "alerts", securityAlertService.getRecentAlerts()
        ));
    }

    @DeleteMapping("/security/blocked-ips/{ip}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> unblockIp(@PathVariable String ip) {
        if (securityAlertService == null) {
            return ResponseEntity.status(503).body(Map.of("message", "Security service chưa sẵn sàng"));
        }
        securityAlertService.removeBlockedIp(ip);
        auditLogService.logAction("UNBLOCK_IP", "Security", "Admin gỡ chặn IP: " + ip);
        return ResponseEntity.ok(Map.of("message", "Đã gỡ chặn IP " + ip));
    }

    @PostMapping("/security/simulate-alert")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> simulateSecurityAlert(@RequestBody Map<String, String> payload) {
        if (securityAlertService == null) {
            return ResponseEntity.status(503).body(Map.of("message", "Security service chưa sẵn sàng"));
        }
        Map<String, Object> alert = securityAlertService.reportAndBlock(
                payload.getOrDefault("ip", "203.0.113.10"),
                payload.getOrDefault("attackType", "SQL injection"),
                payload.getOrDefault("path", "/api/demo?id=1 OR 1=1"),
                payload.getOrDefault("method", "GET"),
                payload.getOrDefault("userAgent", "sqlmap"),
                payload.getOrDefault("evidence", "simulate"),
                payload.getOrDefault("locationHint", "Mô phỏng kiểm thử nội bộ")
        );
        return ResponseEntity.ok(alert);
    }

    @GetMapping("/chuc-nang")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getChucNang() {
        List<Map<String, Object>> features = List.of(
            Map.of("id_chuc_nang", "1", "ma_chuc_nang", "TONG_QUAN", "ten_chuc_nang", "Tổng quan quản trị", "mo_ta", "Bảng điều khiển vận hành theo vai trò", "duong_dan", "/quan-ly/dashboard", "vai_tro", "ADMIN, QUAN_LY, BAC_SI, KE_TOAN, TIEP_TAN, Y_TA, STAFF"),
            Map.of("id_chuc_nang", "2", "ma_chuc_nang", "BAO_CAO", "ten_chuc_nang", "Báo cáo & Thống kê", "mo_ta", "KPI doanh thu, ca điều trị, bác sĩ và dịch vụ", "duong_dan", "/quan-ly/bao-cao-thong-ke", "vai_tro", "ADMIN, QUAN_LY, KE_TOAN"),
            Map.of("id_chuc_nang", "3", "ma_chuc_nang", "LICH_HEN", "ten_chuc_nang", "Quản lý lịch hẹn", "mo_ta", "Điều phối, xác nhận, check-in và hoàn tất lịch khám", "duong_dan", "/quan-ly/lich-hen", "vai_tro", "ADMIN, QUAN_LY, STAFF, BAC_SI, TIEP_TAN, Y_TA"),
            Map.of("id_chuc_nang", "4", "ma_chuc_nang", "LICH_TRUC", "ten_chuc_nang", "Điều hành nhân sự", "mo_ta", "Quản lý lịch trực, ca làm và tải nhân sự", "duong_dan", "/quan-ly/lich-lam-viec", "vai_tro", "ADMIN, QUAN_LY, STAFF, BAC_SI, TIEP_TAN, Y_TA, KE_TOAN"),
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

    @PostMapping("/du-lieu-nen")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> taoDuLieuNenThieu() {
        try {
            Integer idChucNang = jdbcTemplate.queryForObject(
                    "SELECT id_chuc_nang FROM ChucNang WHERE ma_chuc_nang = ? " + DatabaseDialect.topN(DatabaseDialect.isPostgres(jdbcTemplate), 1),
                    Integer.class,
                    "XET_NGHIEM");
            return ResponseEntity.ok(Map.of("message", "Dữ liệu nền đã tồn tại.", "id_chuc_nang", idChucNang));
        } catch (Exception ignored) {
            return ResponseEntity.status(409).body(Map.of(
                    "message", "Thiếu dữ liệu nền thật trong DB. Hệ thống đã dừng, không tự tạo dữ liệu vào DB.",
                    "missing", "XET_NGHIEM"));
        }
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
    @PreAuthorize("hasRole('ADMIN')")
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
            // Chan Path Traversal
            if (filename.contains("..") || filename.contains("/") || filename.contains("\\")
                    || !filename.toLowerCase().endsWith(".bak")) {
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
            // Chan Path Traversal
            if (filename.contains("..") || filename.contains("/") || filename.contains("\\")
                    || !filename.toLowerCase().endsWith(".bak")) {
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

    @PostMapping("/restore/{filename}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> restoreDatabase(@PathVariable String filename) {
        try {
            // Delegate hoàn toàn sang service — đã có bảo vệ path traversal và kiểm tra tên file
            databaseBackupService.restoreDatabase(filename);
            auditLogService.logAction("RESTORE", "DATABASE", "Khôi phục CSDL từ file: " + filename);
            logger.info("✅ Đã khôi phục CSDL từ file: " + filename);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Khôi phục dữ liệu thành công từ file: " + filename
            ));
        } catch (IllegalArgumentException | SecurityException e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        } catch (Exception e) {
            logger.severe("Lỗi khi khôi phục CSDL: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                "message", "Lỗi khôi phục CSDL: " + e.getMessage()
            ));
        }
    }

    @GetMapping("/newsletter/count")
    @PreAuthorize("hasAnyRole('ADMIN', 'QUAN_LY')")
    public ResponseEntity<?> getNewsletterCount() {
        try {
            // KhachHang nhan email, da_xoa = 0
            boolean pg = DatabaseDialect.isPostgres(jdbcTemplate);
            Integer count = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM KhachHang WHERE email IS NOT NULL AND email <> '' AND (" + DatabaseDialect.isActive(pg, "nhan_email") + " OR nhan_email IS NULL) AND " + DatabaseDialect.isNotDeleted(pg, "da_xoa"),
                    Integer.class);
            return ResponseEntity.ok(Map.of("count", count != null ? count : 0));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("count", 0));
        }
    }

    @PostMapping("/newsletter")
    public ResponseEntity<?> subscribeNewsletter(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Vui lòng nhập email"));
        }

        email = email.trim().toLowerCase(Locale.ROOT);
        if (!email.matches("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$") || email.length() > 100) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email không hợp lệ"));
        }

        try {
            Integer marketingExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM EmailMarketing WHERE email = ?",
                Integer.class,
                email);
            if (marketingExists == null || marketingExists == 0) {
                jdbcTemplate.update(
                    "INSERT INTO EmailMarketing (email, ngay_dang_ky, trang_thai) VALUES (?, CURRENT_TIMESTAMP, 1)",
                    email);
            }

            Integer legacyExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM DangKyNhanTin WHERE Email = ?",
                Integer.class,
                email);
            if (legacyExists == null || legacyExists == 0) {
                jdbcTemplate.update(
                    "INSERT INTO DangKyNhanTin (Email, NgayDangKy) VALUES (?, CURRENT_TIMESTAMP)",
                    email);
            }

            return ResponseEntity.ok(Map.of("success", true, "message", "Đăng ký nhận tin thành công"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi đăng ký nhận tin: " + e.getMessage()));
        }
    }

    @PostMapping("/send-mass-email")
    @PreAuthorize("hasAnyRole('ADMIN', 'QUAN_LY')")
    public ResponseEntity<?> sendMassEmail(
            @RequestBody Map<String, String> payload,
            org.springframework.security.core.Authentication authentication) {

        String subject = payload.get("subject");
        String content = payload.get("content");
        if (subject == null || subject.isBlank() || content == null || content.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Thiếu tiêu đề hoặc nội dung email"));
        }

        // Giới hạn độ dài để tránh payload khổng lồ
        if (subject.length() > 200) {
            return ResponseEntity.badRequest().body(Map.of("message", "Tiêu đề không được vượt quá 200 ký tự"));
        }
        if (content.length() > 50000) {
            return ResponseEntity.badRequest().body(Map.of("message", "Nội dung email quá dài (tối đa 50.000 ký tự)"));
        }

        // Rate limit: 1 lần/giờ per user — chặn spam nếu tài khoản bị chiếm
        String userKey = authentication != null ? authentication.getName() : "anonymous";
        Long lastSent = massEmailLastSentAt.get(userKey);
        long now = System.currentTimeMillis();
        if (lastSent != null && now - lastSent < MASS_EMAIL_COOLDOWN_MS) {
            long minutesLeft = (MASS_EMAIL_COOLDOWN_MS - (now - lastSent)) / 60000;
            return ResponseEntity.status(429).body(Map.of(
                "message", "Bạn vừa gửi email hàng loạt. Vui lòng chờ thêm " + minutesLeft + " phút nữa trước khi gửi tiếp."
            ));
        }

        try {
            boolean pg = DatabaseDialect.isPostgres(jdbcTemplate);
            List<String> emails = jdbcTemplate.queryForList(
                "SELECT email FROM KhachHang " +
                "WHERE email IS NOT NULL AND email <> '' AND (" + DatabaseDialect.isActive(pg, "nhan_email") + " OR nhan_email IS NULL) " +
                "AND " + DatabaseDialect.isNotDeleted(pg, "da_xoa") + " " +
                DatabaseDialect.topN(pg, MASS_EMAIL_MAX_BATCH),
                String.class
            );

            if (emails.isEmpty()) {
                return ResponseEntity.ok(Map.of("success", true, "message", "Không có khách hàng nào đăng ký nhận email.", "count", 0));
            }

            // Ghi thời điểm gửi vào rate limit map TRƯỚC khi gửi để tránh double-click
            massEmailLastSentAt.put(userKey, now);

            for (String email : emails) {
                emailService.sendMassEmail(email, subject, content);
            }

            auditLogService.logAction("MARKETING", "EMAIL",
                "Gửi mail marketing tới " + emails.size() + " khách hàng. Người gửi: " + userKey);
            logger.info("Mass email sent by " + userKey + " to " + emails.size() + " recipients");

            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Đã bắt đầu gửi email tới " + emails.size() + " khách hàng",
                "count", emails.size()
            ));
        } catch (Exception e) {
            // Xóa rate limit nếu gửi thất bại để cho phép thử lại
            massEmailLastSentAt.remove(userKey);
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi hệ thống khi gửi email hàng loạt. Vui lòng thử lại sau."));
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
            props.put("mail.transport.protocol", "smtp");
            props.put("mail.smtp.timeout", "5000");
            props.put("mail.smtp.connectiontimeout", "5000");

            if ("465".equals(portStr != null ? portStr.trim() : "")) {
                props.put("mail.smtp.ssl.enable", "true");
                props.put("mail.smtp.socketFactory.port", "465");
                props.put("mail.smtp.socketFactory.class", "javax.net.ssl.SSLSocketFactory");
            } else {
                props.put("mail.smtp.starttls.enable", "true");
            }

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

    @PostMapping("/ai-provider/test")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> testAiProvider(@RequestBody Map<String, String> payload) {
        String provider = normalizeProvider(payload.get("provider"));
        if (provider == null) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "errorCode", "invalid_provider",
                    "message", "Provider AI không hợp lệ. Chỉ hỗ trợ groq, gemini, openrouter."));
        }

        String apiKey = firstNonBlank(payload.get("apiKey"), readConfig(provider + "_api_key"));
        String model = firstNonBlank(payload.get("model"), readConfig(provider + "_model"));
        if (apiKey == null || apiKey.isBlank()) {
            return ResponseEntity.ok(buildAiTestResult(false, provider, model, null, "missing_api_key",
                    "Chưa cấu hình API key cho " + providerLabel(provider) + ".",
                    "Chưa có API key để kiểm tra. Vui lòng nhập key rồi kiểm tra lại."));
        }
        if (model == null || model.isBlank()) {
            return ResponseEntity.ok(buildAiTestResult(false, provider, model, null, "missing_model",
                    "Chưa cấu hình model cho " + providerLabel(provider) + ".",
                    "Chưa có model để kiểm tra. Vui lòng nhập model rồi kiểm tra lại."));
        }

        try {
            HttpRequest request = buildAiProviderRequest(provider, apiKey, model);
            HttpResponse<String> response = aiTestClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            boolean ok = response.statusCode() >= 200 && response.statusCode() < 300;
            String errorCode = ok ? "ok" : classifyAiProviderError(response.statusCode(), response.body());
            String technicalMessage = ok
                    ? "Provider phản hồi thành công."
                    : "Provider trả lỗi " + response.statusCode() + ": " + abbreviate(response.body(), 500);
            return ResponseEntity.ok(buildAiTestResult(ok, provider, model, response.statusCode(), errorCode,
                    technicalMessage, roleAwareAiConfigMessage(errorCode, provider, model)));
        } catch (java.net.http.HttpTimeoutException e) {
            return ResponseEntity.ok(buildAiTestResult(false, provider, model, null, "timeout",
                    "Timeout khi kiểm tra provider: " + e.getMessage(),
                    roleAwareAiConfigMessage("timeout", provider, model)));
        } catch (Exception e) {
            String errorCode = classifyAiException(e);
            return ResponseEntity.ok(buildAiTestResult(false, provider, model, null, errorCode,
                    "Không thể kết nối provider: " + e.getMessage(),
                    roleAwareAiConfigMessage(errorCode, provider, model)));
        }
    }

    private HttpRequest buildAiProviderRequest(String provider, String apiKey, String model) throws Exception {
        if ("gemini".equals(provider)) {
            String key = apiKey.split(",")[0].trim();
            String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + key;
            String body = objectMapper.writeValueAsString(Map.of(
                    "contents", List.of(Map.of(
                            "role", "user",
                            "parts", List.of(Map.of("text", "Ping. Reply with OK."))))));
            return HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
                    .timeout(Duration.ofSeconds(20))
                    .build();
        }

        String url = "groq".equals(provider)
                ? "https://api.groq.com/openai/v1/chat/completions"
                : "https://openrouter.ai/api/v1/chat/completions";
        String body = objectMapper.writeValueAsString(Map.of(
                "model", model,
                "messages", List.of(Map.of("role", "user", "content", "Ping. Reply with OK.")),
                "max_tokens", 8));
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey.trim())
                .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
                .timeout(Duration.ofSeconds(20));
        if ("openrouter".equals(provider)) {
            builder.header("HTTP-Referer", frontendUrl)
                    .header("X-Title", "Rexi Vet Clinic");
        }
        return builder.build();
    }

    private Map<String, Object> buildAiTestResult(boolean success, String provider, String model,
            Integer statusCode, String errorCode, String technicalMessage, String adminMessage) {
        return Map.of(
                "success", success,
                "provider", provider,
                "providerLabel", providerLabel(provider),
                "model", model == null ? "" : model,
                "statusCode", statusCode == null ? "" : statusCode,
                "errorCode", errorCode,
                "message", adminMessage,
                "technicalMessage", technicalMessage,
                "checkedAt", Instant.now().toString());
    }

    private String roleAwareAiConfigMessage(String errorCode, String provider, String model) {
        String label = providerLabel(provider);
        return switch (errorCode) {
            case "ok" -> label + " đang hoạt động với model `" + model + "`.";
            case "quota_exceeded" -> label + " đang hết quota hoặc bị giới hạn tốc độ. Admin nên nâng quota, đổi key hoặc chuyển provider/model dự phòng.";
            case "invalid_api_key" -> "API key của " + label + " không hợp lệ hoặc đã bị thu hồi. Key không được hiển thị thô; vui lòng cập nhật key mới.";
            case "model_not_found", "model_not_supported" -> "Model `" + model + "` của " + label + " không tồn tại hoặc không được key hiện tại hỗ trợ. Vui lòng chọn model khác.";
            case "timeout" -> label + " phản hồi quá lâu. Có thể provider đang nghẽn hoặc mạng máy chủ không ổn định.";
            case "missing_api_key" -> "Chưa có API key cho " + label + ".";
            case "missing_model" -> "Chưa có model cho " + label + ".";
            default -> label + " chưa kiểm tra thành công. Vui lòng xem mã lỗi kỹ thuật và thử provider/model khác nếu cần.";
        };
    }

    private String classifyAiProviderError(int statusCode, String body) {
        String text = (body == null ? "" : body).toLowerCase(Locale.ROOT);
        if (statusCode == 401 || statusCode == 403 || text.contains("api key") || text.contains("unauthorized")) {
            return "invalid_api_key";
        }
        if (statusCode == 429 || text.contains("quota") || text.contains("rate limit") || text.contains("too many requests")) {
            return "quota_exceeded";
        }
        if (statusCode == 404 || text.contains("model not found")) {
            return "model_not_found";
        }
        if (statusCode == 400 && (text.contains("model") || text.contains("unsupported"))) {
            return "model_not_supported";
        }
        return "provider_error";
    }

    private String classifyAiException(Exception e) {
        String text = e.getMessage() == null ? "" : e.getMessage().toLowerCase(Locale.ROOT);
        if (text.contains("timeout") || text.contains("timed out")) return "timeout";
        if (text.contains("429") || text.contains("quota") || text.contains("rate limit")) return "quota_exceeded";
        if (text.contains("401") || text.contains("403") || text.contains("api key") || text.contains("unauthorized")) return "invalid_api_key";
        if (text.contains("model not found") || text.contains("404")) return "model_not_found";
        if (text.contains("model") || text.contains("unsupported")) return "model_not_supported";
        return "network_error";
    }

    private String normalizeProvider(String provider) {
        if (provider == null) return null;
        String normalized = provider.trim().toLowerCase(Locale.ROOT);
        return switch (normalized) {
            case "groq", "gemini", "openrouter" -> normalized;
            default -> null;
        };
    }

    private String providerLabel(String provider) {
        return switch (provider) {
            case "groq" -> "Groq";
            case "gemini" -> "Gemini";
            case "openrouter" -> "OpenRouter";
            default -> "AI Provider";
        };
    }

    private String readConfig(String key) {
        try {
            return jdbcTemplate.queryForObject("SELECT gia_tri FROM CauHinhHeThong WHERE ten_cau_hinh = ?", String.class, key);
        } catch (Exception e) {
            return "";
        }
    }

    private String firstNonBlank(String first, String second) {
        if (first != null && !first.trim().isEmpty()) return first.trim();
        if (second != null && !second.trim().isEmpty()) return second.trim();
        return "";
    }

    private String abbreviate(String value, int maxLength) {
        if (value == null) return "";
        String normalized = value.replaceAll("\\s+", " ").trim();
        return normalized.length() <= maxLength ? normalized : normalized.substring(0, maxLength) + "...";
    }

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> payload,
            jakarta.servlet.http.HttpServletRequest request) {
        String email = normalizeEmail(payload.get("email"));
        if (email == null || email.isEmpty()) return ResponseEntity.badRequest().body(Map.of("message", "Email trống", "success", false));

        String rateKey = getInteractionSource(request) + "|" + email + "|" + getClientIp(request);
        ResponseEntity<?> rateLimitResponse = checkOtpSendRateLimit(rateKey);
        if (rateLimitResponse != null) return rateLimitResponse;
        
        // Chk email exist in db
        String sql = "SELECT COUNT(*) FROM (SELECT email FROM KhachHang WHERE LOWER(email) = LOWER(?) UNION SELECT email FROM NhanVien WHERE LOWER(email) = LOWER(?)) AS tbl";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, email, email);
        if (count == null || count == 0) {
            return ResponseEntity.status(400).body(Map.of("message", "Email không tồn tại trên hệ thống!", "success", false));
        }

        String otp = String.format("%06d", OTP_RANDOM.nextInt(1_000_000));
        otpStorage.put(email, otp);
        otpExpiry.put(email, System.currentTimeMillis() + OTP_TTL_MS);
        
        // Send OTP mail
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
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> payload,
            jakarta.servlet.http.HttpServletRequest request) {
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
        // Dùng extractRealIp để nhất quán với RateLimitFilter (Cloudflare, nginx, X-Forwarded-For)
        if (securityAlertService != null) {
            return securityAlertService.extractRealIp(request);
        }
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (forwardedFor != null && !forwardedFor.isBlank()) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private String getInteractionSource(jakarta.servlet.http.HttpServletRequest request) {
        String source = request.getHeader("X-Interaction-Source");
        if (source != null && source.equalsIgnoreCase("human")) {
            return "human";
        }
        String aiAction = request.getHeader("X-AI-ACTION");
        if (aiAction != null && !aiAction.isBlank()) {
            return "automation";
        }
        return "unknown";
    }
}
