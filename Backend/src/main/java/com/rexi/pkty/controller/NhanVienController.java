package com.rexi.pkty.controller;

import com.rexi.pkty.entity.LichLamViecNhanVien;
import com.rexi.pkty.entity.NhanVien;
import com.rexi.pkty.repository.LichLamViecNhanVienRepository;
import com.rexi.pkty.repository.NhanVienRepository;
import com.rexi.pkty.repository.TaiKhoanRepository;
import com.rexi.pkty.security.PasswordPolicy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.jdbc.core.JdbcTemplate;
import com.rexi.pkty.service.AuditLogService;
import com.rexi.pkty.util.DatabaseDialect;
import jakarta.annotation.PostConstruct;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.logging.Logger;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "${cors.allowed-origins:http://localhost:3000}")
public class NhanVienController {

    private static final Logger logger = Logger.getLogger(NhanVienController.class.getName());

    @Autowired
    private NhanVienRepository nhanVienRepository;

    @Autowired(required = false)
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private LichLamViecNhanVienRepository lichLamViecRepository;

    private void broadcastDataChanged(String resource, String action, String id, String scope) {
        if (messagingTemplate == null) {
            return;
        }
        try {
            messagingTemplate.convertAndSend("/topic/data-changes", Map.of(
                    "resource", resource,
                    "action", action,
                    "id", id,
                    "scope", scope,
                    "timestamp", System.currentTimeMillis()));
        } catch (Exception e) {
            logger.warning("Không thể phát realtime dữ liệu: " + e.getMessage());
        }
    }

    @Autowired
    private TaiKhoanRepository taiKhoanRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private AuditLogService auditLogService;

    private Optional<com.rexi.pkty.entity.TaiKhoan> getAuthenticatedAccount() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        String username = (auth != null) ? auth.getName() : null;
        if (username == null || username.equals("anonymousUser")) {
            return Optional.empty();
        }
        return taiKhoanRepository.findByTenDangNhap(username);
    }

    private boolean isAdmin(org.springframework.security.core.Authentication auth,
            com.rexi.pkty.entity.TaiKhoan tk) {
        String authorities = (auth != null && auth.getAuthorities() != null)
                ? auth.getAuthorities().toString().toUpperCase()
                : "";
        String role = tk.getId_vai_tro() != null ? tk.getId_vai_tro().toUpperCase() : "";
        return authorities.contains("ADMIN") || role.equals("VT-ADMIN") || role.equals("VT-1");
    }

    private boolean canManageAnySchedule(org.springframework.security.core.Authentication auth,
            com.rexi.pkty.entity.TaiKhoan tk) {
        String authorities = (auth != null && auth.getAuthorities() != null)
                ? auth.getAuthorities().toString().toUpperCase()
                : "";
        String role = tk != null && tk.getId_vai_tro() != null ? tk.getId_vai_tro().toUpperCase() : "";
        return authorities.contains("ADMIN")
                || authorities.contains("QUAN_LY")
                || role.equals("VT-ADMIN")
                || role.equals("VT-1")
                || role.equals("VT-QL")
                || role.equals("VT-6");
    }

    private boolean canEmployeeManageScheduleNow() {
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        java.time.DayOfWeek day = now.getDayOfWeek();
        if (day == java.time.DayOfWeek.SUNDAY) return false;
        if (day == java.time.DayOfWeek.SATURDAY) return now.toLocalTime().isBefore(java.time.LocalTime.NOON);
        return true;
    }

    private boolean isNextWeekDate(java.time.LocalDate targetDate) {
        java.time.LocalDate today = java.time.LocalDate.now();
        java.time.LocalDate currentMonday = today.with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
        java.time.LocalDate nextWeekMonday = currentMonday.plusWeeks(1);
        java.time.LocalDate nextWeekSunday = nextWeekMonday.plusDays(6);
        return !targetDate.isBefore(nextWeekMonday) && !targetDate.isAfter(nextWeekSunday);
    }

    private boolean canManageNhanVien(String id) {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        Optional<com.rexi.pkty.entity.TaiKhoan> tkOpt = getAuthenticatedAccount();
        if (tkOpt.isEmpty()) {
            return false;
        }
        com.rexi.pkty.entity.TaiKhoan tk = tkOpt.get();
        return isAdmin(auth, tk) || (tk.getId_nhan_vien() != null && tk.getId_nhan_vien().equals(id));
    }

    private boolean isSelfNhanVien(String id) {
        Optional<com.rexi.pkty.entity.TaiKhoan> tkOpt = getAuthenticatedAccount();
        return tkOpt.isPresent()
                && tkOpt.get().getId_nhan_vien() != null
                && tkOpt.get().getId_nhan_vien().equals(id);
    }

    @GetMapping("/nhan-vien")
    public List<NhanVien> getAllNhanVien(@RequestParam(defaultValue = "false") boolean includeDeleted) {
        boolean canViewDeleted = includeDeleted && getAuthenticatedAccount()
                .map(tk -> {
                    String role = tk.getId_vai_tro() != null ? tk.getId_vai_tro().toUpperCase() : "";
                    return role.equals("VT-ADMIN") || role.equals("VT-1") || role.equals("VT-QL") || role.equals("VT-2");
                })
                .orElse(false);

        return nhanVienRepository.findAll()
                .stream()
                .filter(nv -> canViewDeleted || !Boolean.TRUE.equals(nv.getDa_xoa()))
                .toList();
    }

    @GetMapping("/bac-si")
    public List<?> getBacSi(@RequestParam(required = false) String ngay) {
        try {
            if (ngay != null && !ngay.trim().isEmpty()) {
                boolean pg = DatabaseDialect.isPostgres(jdbcTemplate);
                String sql = "SELECT DISTINCT nv.id_nhan_vien, nv.ho_ten, nv.chuyen_mon, nv.so_dien_thoai, nv.email, nv.dia_chi " +
                             "FROM NhanVien nv " +
                             "JOIN LichLamViecNhanVien l ON nv.id_nhan_vien = l.id_nhan_vien " +
                             "WHERE " + DatabaseDialect.isNotDeleted(pg, "nv.da_xoa") + " " +
                             "AND (LOWER(COALESCE(nv.chuyen_mon, '')) LIKE '%bác sĩ%' " +
                             "OR LOWER(COALESCE(nv.chuyen_mon, '')) LIKE '%bac si%' " +
                             "OR LOWER(COALESCE(nv.chuyen_mon, '')) LIKE '%doctor%' " +
                             "OR EXISTS (SELECT 1 FROM TaiKhoan tk WHERE tk.id_nhan_vien = nv.id_nhan_vien " +
                             "AND (tk.id_vai_tro IN ('VT-BS', 'VT-2', '2') OR UPPER(COALESCE(tk.id_vai_tro, '')) LIKE '%BS%'))) " +
                             "AND l.ngay_lam = ? " +
                             "ORDER BY nv.ho_ten ASC";
                java.sql.Date ngaySql = java.sql.Date.valueOf(ngay);
                return jdbcTemplate.queryForList(sql, ngaySql);
            }
            return nhanVienRepository.findAllBacSi();
        } catch (Exception e) {
            logger.severe("Lỗi lấy danh sách bác sĩ: " + e.getMessage());
            return new java.util.ArrayList<>();
        }
    }

    @GetMapping("/bac-si/thong-ke")
    public List<Map<String, Object>> getBacSiStats() {
        return nhanVienRepository.getBacSiStats();
    }

    @GetMapping("/nhan-vien/lich-lam-viec")
    public List<LichLamViecNhanVien> getLichLamViec(@RequestParam(required = false) String id_nhan_vien) {
        if (id_nhan_vien != null) {
            return lichLamViecRepository.findByIdNhanVien(id_nhan_vien);
        }
        return lichLamViecRepository.findAll();
    }

    @PostMapping("/nhan-vien/lich-lam-viec")
    @org.springframework.transaction.annotation.Transactional
    public org.springframework.http.ResponseEntity<?> addLichLamViec(@RequestBody LichLamViecNhanVien lich) {
        try {
            // Xác thực token — lấy thông tin từ JWT, không tin header tùy ý
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            String username = (auth != null) ? auth.getName() : null;
            if (username == null || username.equals("anonymousUser")) {
                return org.springframework.http.ResponseEntity.status(401).body(Map.of("message", "Token không hợp lệ!"));
            }

            // Đọc role từ DB qua token đã xác thực — không tin header từ client
            com.rexi.pkty.entity.TaiKhoan tk = taiKhoanRepository.findByTenDangNhap(username).orElse(null);
            String tkRole = (tk != null && tk.getId_vai_tro() != null) ? tk.getId_vai_tro().toUpperCase() : "";
            boolean isAdmin = canManageAnySchedule(auth, tk);

            // Validate dữ liệu đầu vào bắt buộc
            if (lich.getId_nhan_vien() == null || lich.getId_nhan_vien().isBlank()) {
                return org.springframework.http.ResponseEntity.status(400).body(Map.of("message", "Thiếu mã nhân viên!"));
            }
            if (lich.getNgay_lam() == null) {
                return org.springframework.http.ResponseEntity.status(400).body(Map.of("message", "Thiếu ngày làm!"));
            }
            if (lich.getGio_bat_dau() == null) {
                return org.springframework.http.ResponseEntity.status(400).body(Map.of("message", "Thiếu giờ bắt đầu ca trực!"));
            }
            // Giờ phải nằm trong khung giờ hoạt động 8:00 - 20:00
            int startHour = lich.getGio_bat_dau().getHour();
            if (startHour < 8 || startHour > 19) {
                return org.springframework.http.ResponseEntity.status(400).body(Map.of("message", "Giờ bắt đầu ca phải nằm trong khoảng 8:00 - 20:00!"));
            }

            boolean pg = DatabaseDialect.isPostgres(jdbcTemplate);
            Integer activeStaffCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM NhanVien nv " +
                            "JOIN TaiKhoan tk ON tk.id_nhan_vien = nv.id_nhan_vien " +
                            "WHERE nv.id_nhan_vien = ? " +
                            "AND " + DatabaseDialect.isNotDeleted(pg, "nv.da_xoa") + " " +
                            "AND LOWER(COALESCE(tk.trang_thai, '')) IN ('active', 'hoạt động', 'đang làm việc')",
                    Integer.class, lich.getId_nhan_vien());
            if (activeStaffCount == null || activeStaffCount == 0) {
                return org.springframework.http.ResponseEntity.status(409)
                        .body(Map.of("message", "Không thể đăng ký lịch làm việc cho nhân viên đã khóa hoặc đã xóa mềm."));
            }

            // Kiểm tra quyền sở hữu: nhân viên chỉ được đăng ký cho chính mình
            if (!isAdmin && tk != null) {
                String currentNhanVienId = tk.getId_nhan_vien();
                // Fallback: nếu TaiKhoan không có id_nhan_vien, tra thêm qua bảng NhanVien
                if (currentNhanVienId == null) {
                    try {
                        java.util.List<String> allowedIds = jdbcTemplate.queryForList(
                                "SELECT id_nhan_vien FROM NhanVien WHERE id_tai_khoan = ?", String.class, tk.getId_tai_khoan());
                        if (!allowedIds.isEmpty()) currentNhanVienId = allowedIds.get(0);
                    } catch (Exception ignored) {}
                }

                if (currentNhanVienId == null || !currentNhanVienId.equals(lich.getId_nhan_vien())) {
                    return org.springframework.http.ResponseEntity.status(403).body(Map.of("message", "Cảnh báo bảo mật: Bạn không thể đăng ký ca trực cho nhân viên khác!"));
                }
            }

            if (!isAdmin && !canEmployeeManageScheduleNow() && isNextWeekDate(lich.getNgay_lam())) {
                return org.springframework.http.ResponseEntity.status(403).body(Map.of("message", "Nhân viên không thể đăng ký/chỉnh lịch tuần tới từ 12:00 Thứ 7 đến hết Chủ nhật. Tuần sau nữa vẫn đăng ký được."));
            }

            // Kiểm tra trùng ca (cùng nhân viên, cùng ngày, cùng giờ)
            String checkDupSql = "SELECT COUNT(*) FROM LichLamViecNhanVien WHERE id_nhan_vien = ? AND ngay_lam = ? AND CAST(gio_bat_dau AS time) = CAST(? AS time)";
            Integer dupCount = jdbcTemplate.queryForObject(checkDupSql, Integer.class,
                    lich.getId_nhan_vien(), lich.getNgay_lam(), lich.getGio_bat_dau());
            if (dupCount != null && dupCount > 0) {
                return org.springframework.http.ResponseEntity.status(409)
                        .body(Map.of("message", "Nhân viên này đã được đăng ký ca trực vào khung giờ " +
                                lich.getGio_bat_dau() + " ngày " + lich.getNgay_lam() + " rồi sếp ơi! 🐾"));
            }

            // Lấy role nhân viên từ DB (không fallback đoán bằng prefix)
            String getRoleSql = "SELECT id_vai_tro FROM TaiKhoan WHERE id_nhan_vien = ? " + com.rexi.pkty.util.DatabaseDialect.topN(com.rexi.pkty.util.DatabaseDialect.isPostgres(jdbcTemplate), 1);
            String staffRoleId = null;
            try {
                staffRoleId = jdbcTemplate.queryForObject(getRoleSql, String.class, lich.getId_nhan_vien());
            } catch (Exception ignored) {}

            // Nếu không tìm được role thì bỏ qua giới hạn số người (không đoán bừa)
            if (!isAdmin && staffRoleId != null) {
                // Kiểm tra số nhân sự cùng chức vụ trực cùng khung giờ đó
                String countRoleSql = "SELECT COUNT(DISTINCT l.id_nhan_vien) FROM LichLamViecNhanVien l " +
                        "JOIN TaiKhoan t ON l.id_nhan_vien = t.id_nhan_vien " +
                        "WHERE l.ngay_lam = ? AND CAST(l.gio_bat_dau AS time) = CAST(? AS time) AND t.id_vai_tro = ?";
                Integer roleCount = jdbcTemplate.queryForObject(countRoleSql, Integer.class,
                        lich.getNgay_lam(), lich.getGio_bat_dau(), staffRoleId);

                int limit = "VT-BS".equals(staffRoleId) ? 3 :
                            "VT-YT".equals(staffRoleId) ? 3 : 2;
                String roleName = "VT-BS".equals(staffRoleId) ? "bác sĩ" :
                                  "VT-YT".equals(staffRoleId) ? "y tá" :
                                  "VT-TT".equals(staffRoleId) ? "lễ tân" :
                                  "VT-KT".equals(staffRoleId) ? "kế toán" : "nhân viên cùng chức vụ";

                if (roleCount != null && roleCount >= limit) {
                    return org.springframework.http.ResponseEntity.status(409)
                            .body(Map.of("message", "Đã có tối đa " + limit + " " + roleName + " trực trong khung giờ " +
                                    lich.getGio_bat_dau() + " ngày " + lich.getNgay_lam() + " rồi sếp ơi! 🐾"));
                }
            }

            // Gán giờ kết thúc: ưu tiên dùng giá trị từ request, fallback mới tính +30p
            if (lich.getGio_ket_thuc() == null) {
                lich.setGio_ket_thuc(lich.getGio_bat_dau().plusMinutes(30));
            }

            return org.springframework.http.ResponseEntity.ok(lichLamViecRepository.save(lich));
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.status(500)
                    .body(Map.of("message", "Lỗi lưu lịch làm việc: " + e.getMessage()));
        }
    }

    @DeleteMapping("/nhan-vien/lich-lam-viec/{id}")
    @org.springframework.transaction.annotation.Transactional
    public org.springframework.http.ResponseEntity<?> deleteLichLamViec(@PathVariable Long id) {
        try {
            // Lấy ca trực cần xóa
            LichLamViecNhanVien lichToXoa = lichLamViecRepository.findById(id).orElse(null);
            if (lichToXoa == null) {
                return org.springframework.http.ResponseEntity.status(404).body(Map.of("message", "Không tìm thấy ca trực cần xóa!"));
            }

            // Xác thực token — đọc role từ DB, không tin header từ client
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            String username = (auth != null) ? auth.getName() : null;
            if (username == null || username.equals("anonymousUser")) {
                return org.springframework.http.ResponseEntity.status(401).body(Map.of("message", "Token không hợp lệ!"));
            }

            // Đọc role từ tài khoản đã xác thực trong DB
            com.rexi.pkty.entity.TaiKhoan tk = taiKhoanRepository.findByTenDangNhap(username).orElse(null);
            String tkRole = (tk != null && tk.getId_vai_tro() != null) ? tk.getId_vai_tro().toUpperCase() : "";
            boolean isAdmin = canManageAnySchedule(auth, tk);

            // Chỉ được hủy ca trực của chính mình
            if (!isAdmin && tk != null) {
                String currentNhanVienId = tk.getId_nhan_vien();
                // Fallback: nếu TaiKhoan không có id_nhan_vien, tra thêm qua bảng NhanVien
                if (currentNhanVienId == null) {
                    try {
                        java.util.List<String> allowedIds = jdbcTemplate.queryForList(
                                "SELECT id_nhan_vien FROM NhanVien WHERE id_tai_khoan = ?", String.class, tk.getId_tai_khoan());
                        if (!allowedIds.isEmpty()) currentNhanVienId = allowedIds.get(0);
                    } catch (Exception ignored) {}
                }

                if (currentNhanVienId == null || !currentNhanVienId.equals(lichToXoa.getId_nhan_vien())) {
                    return org.springframework.http.ResponseEntity.status(403).body(Map.of("message", "Cảnh báo bảo mật: Bạn không thể hủy ca trực của nhân viên khác!"));
                }
            }

            if (!isAdmin && !canEmployeeManageScheduleNow() && isNextWeekDate(lichToXoa.getNgay_lam())) {
                return org.springframework.http.ResponseEntity.status(403).body(Map.of("message", "Nhân viên không thể đăng ký/chỉnh lịch tuần tới từ 12:00 Thứ 7 đến hết Chủ nhật. Tuần sau nữa vẫn đăng ký được."));
            }

            // Nhân viên phải hủy ca trước ít nhất 2 giờ so với giờ bắt đầu ca
            if (!isAdmin && lichToXoa.getNgay_lam() != null && lichToXoa.getGio_bat_dau() != null) {
                java.time.LocalDateTime caStart = java.time.LocalDateTime.of(lichToXoa.getNgay_lam(), lichToXoa.getGio_bat_dau());
                java.time.LocalDateTime now = java.time.LocalDateTime.now();
                if (now.isAfter(caStart.minusHours(2))) {
                    return org.springframework.http.ResponseEntity.status(403).body(Map.of("message",
                            "Bạn chỉ được hủy ca trực trước ít nhất 2 giờ so với giờ bắt đầu ca. Vui lòng liên hệ Admin."));
                }
            }

            // Kiểm tra conflict với lịch khám của khách hàng
            java.time.LocalTime shiftStart = lichToXoa.getGio_bat_dau();
            java.time.LocalTime shiftEnd = lichToXoa.getGio_ket_thuc();
            if (shiftEnd == null) shiftEnd = shiftStart.plusMinutes(30);

            java.util.List<Map<String, Object>> existingApps = jdbcTemplate.queryForList(
                    "SELECT lh.gio_kham, dv.thoi_luong_phut FROM LichHen lh JOIN DichVu dv ON lh.id_dich_vu = dv.id_dich_vu WHERE lh.id_bac_si = ? AND lh.ngay_kham = ? AND lh.trang_thai NOT IN ('Đã hủy', 'da_huy')",
                    lichToXoa.getId_nhan_vien(), java.sql.Date.valueOf(lichToXoa.getNgay_lam()));

            boolean isConflict = false;
            for (Map<String, Object> app : existingApps) {
                String appGioStr = app.get("gio_kham").toString();
                String[] appParts = appGioStr.split(":");
                java.time.LocalTime appStart = java.time.LocalTime.of(Integer.parseInt(appParts[0]), Integer.parseInt(appParts[1]));
                Integer duration = app.get("thoi_luong_phut") != null ? ((Number) app.get("thoi_luong_phut")).intValue() : 30;
                java.time.LocalTime appEnd = appStart.plusMinutes(duration);

                if (shiftStart.isBefore(appEnd) && shiftEnd.isAfter(appStart)) {
                    isConflict = true;
                    break;
                }
            }

            if (isConflict) {
                return org.springframework.http.ResponseEntity.status(409).body(Map.of("message",
                        "Không thể hủy ca! Khung giờ này đang nằm trong khoảng thời gian diễn ra dịch vụ của một khách hàng đã đặt trước. Vui lòng liên hệ lễ tân để dời lịch của khách."));
            }

            // Xóa ca trực
            lichLamViecRepository.deleteById(id);
            return org.springframework.http.ResponseEntity.ok(Map.of("message", "Đã hủy ca trực thành công."));
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.status(500).body(Map.of("message", "Lỗi hủy ca trực: " + e.getMessage()));
        }
    }

    @GetMapping("/nhan-vien/profile/{id}")
    public NhanVien getProfile(@PathVariable String id) {
        return nhanVienRepository.findById(id).orElse(null);
    }

    @PutMapping("/nhan-vien/{id}")
    public org.springframework.http.ResponseEntity<?> updateNhanVien(@PathVariable String id,
            @RequestBody NhanVien nv) {
        try {
            if (!canManageNhanVien(id)) {
                return org.springframework.http.ResponseEntity.status(403)
                        .body(Map.of("message", "Bạn chỉ được cập nhật hồ sơ của chính mình."));
            }

            Optional<NhanVien> existingOpt = nhanVienRepository.findById(id);
            if (existingOpt.isEmpty()) {
                return org.springframework.http.ResponseEntity.status(404)
                        .body(Map.of("message", "Không tìm thấy nhân viên!"));
            }

            NhanVien existing = existingOpt.get();
            boolean selfUpdate = isSelfNhanVien(id);
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                    .getContext().getAuthentication();
            boolean adminUpdate = getAuthenticatedAccount().map(tk -> isAdmin(auth, tk)).orElse(false);

            if (adminUpdate && !selfUpdate) {
                nv.setId_nhan_vien(id);
                NhanVien saved = nhanVienRepository.save(nv);
                broadcastDataChanged("profile", "updated", id, "staff");
                return org.springframework.http.ResponseEntity.ok(saved);
            }

            existing.setHo_ten(nv.getHo_ten());
            existing.setEmail(nv.getEmail());
            existing.setSo_dien_thoai(nv.getSo_dien_thoai());
            existing.setDia_chi(nv.getDia_chi());
            existing.setHinh_anh(nv.getHinh_anh());
            existing.setGioi_thieu(nv.getGioi_thieu());
            NhanVien saved = nhanVienRepository.save(existing);
            broadcastDataChanged("profile", "updated", id, "staff");
            return org.springframework.http.ResponseEntity.ok(saved);
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.status(500)
                    .body(Map.of("message", "Lỗi khi cập nhật nhân viên: " + e.getMessage()));
        }
    }

    @PostMapping("/nhan-vien")
    @PreAuthorize("hasAnyRole('ADMIN', 'QUAN_LY')")
    public org.springframework.http.ResponseEntity<?> addNhanVien(@RequestBody NhanVien nv) {
        try {
            // Gen ID theo chức vụ (Admin: 1-99, NV-, QL-, ...)
            if (nv.getId_nhan_vien() == null || nv.getId_nhan_vien().isEmpty()) {
                String cm = nv.getChuyen_mon() != null ? nv.getChuyen_mon().toLowerCase() : "";

                if (cm.contains("admin") || cm.contains("tối cao")) {
                    // Cấp ID từ 1 đến 99 CHỈ dành cho Admin, fallback UUID nếu hết
                    String newAdminId = null;
                    List<String> existingIds = jdbcTemplate.queryForList("SELECT id_nhan_vien FROM NhanVien", String.class);
                    for (int i = 1; i <= 99; i++) {
                        if (!existingIds.contains(String.valueOf(i))) {
                            newAdminId = String.valueOf(i);
                            break;
                        }
                    }
                    if (newAdminId == null) {
                        // Khi không còn số khả dụng, dùng UUID có tiền tố "AD-"
                        newAdminId = "AD-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase();
                    }
                    nv.setId_nhan_vien(newAdminId);
                } else {
                    // Cấp ID cho các chức vụ khác có tiền tố (Prefix)
                    String prefix = "NV-";
                    if (cm.contains("quản lý") || cm.contains("manager")) {
                        prefix = "QL-";
                    } else if (cm.contains("tiếp tân") || cm.contains("lễ tân")) {
                        prefix = "TT-";
                    } else if (cm.contains("bác sĩ") || cm.contains("doctor")) {
                        prefix = "BS-";
                    } else if (cm.contains("kế toán")) {
                        prefix = "KT-";
                    } else if (cm.contains("y tá") || cm.contains("điều dưỡng") || cm.contains("nurse")) {
                        prefix = "YT-";
                    } else if (cm.contains("chăm sóc khách hàng") || cm.contains("marketing") || cm.contains("cskh")) {
                        prefix = "CS-";
                    }
                    // Đảm bảo ID duy nhất bằng vòng lặp kiểm tra tồn tại
                    String generatedId;
                    do {
                        generatedId = prefix + java.util.UUID.randomUUID().toString().substring(0, 6).toUpperCase();
                    } while (jdbcTemplate.queryForObject("SELECT COUNT(*) FROM NhanVien WHERE id_nhan_vien = ?", Integer.class, generatedId) > 0);
                    nv.setId_nhan_vien(generatedId);
                }
            }

            if (nv.getNgay_vao_lam() == null)
                nv.setNgay_vao_lam(LocalDate.now());
            nv.setTrang_thai("ACTIVE");
            nv.setDa_xoa(false);

            boolean shouldCreateAccount = Boolean.TRUE.equals(nv.getTao_tai_khoan());
            String requestedUsername = nv.getTen_dang_nhap() != null ? nv.getTen_dang_nhap().trim() : "";
            String requestedPassword = nv.getMat_khau() != null ? nv.getMat_khau().trim() : "";
            if (shouldCreateAccount) {
                if (requestedUsername.isEmpty() || requestedPassword.isEmpty()) {
                    return org.springframework.http.ResponseEntity.status(400)
                            .body(Map.of("message", "Vui lòng nhập tên đăng nhập và mật khẩu khi tạo tài khoản cho nhân sự."));
                }
                if (!PasswordPolicy.isValid(requestedPassword)) {
                    return org.springframework.http.ResponseEntity.status(400)
                            .body(Map.of("message", PasswordPolicy.message()));
                }
                if (taiKhoanRepository.findByTenDangNhap(requestedUsername).isPresent()) {
                    return org.springframework.http.ResponseEntity.status(409)
                            .body(Map.of("message", "Tên đăng nhập đã tồn tại. Vui lòng chọn tên khác."));
                }
            }

            // Lưu NhanVien lấy ID tránh lỗi FK
            NhanVien savedNv = nhanVienRepository.save(nv);

            // Tạo tài khoản đăng nhập nếu có username/pass
            if (shouldCreateAccount) {
                com.rexi.pkty.entity.TaiKhoan tk = new com.rexi.pkty.entity.TaiKhoan();
                tk.setId_tai_khoan("TK-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase());
                tk.setTen_dang_nhap(requestedUsername);
                tk.setId_nhan_vien(savedNv.getId_nhan_vien());

                if (savedNv.getId_nhan_vien().matches("\\d+"))
                    tk.setId_vai_tro("VT-ADMIN");
                else if (savedNv.getId_nhan_vien().startsWith("QL-"))
                    tk.setId_vai_tro("VT-QL");
                else if (savedNv.getId_nhan_vien().startsWith("BS-"))
                    tk.setId_vai_tro("VT-BS");
                else if (savedNv.getId_nhan_vien().startsWith("KT-"))
                    tk.setId_vai_tro("VT-KT");
                else if (savedNv.getId_nhan_vien().startsWith("TT-"))
                    tk.setId_vai_tro("VT-TT");
                else if (savedNv.getId_nhan_vien().startsWith("YT-"))
                    tk.setId_vai_tro("VT-YT");
                else
                    tk.setId_vai_tro("VT-3");

                tk.setTrang_thai("active");
                tk.setNgay_tao(LocalDateTime.now());
                tk.setMat_khau("[ENCRYPTED]");
                tk.setMat_khau_hash(passwordEncoder.encode(requestedPassword));

                taiKhoanRepository.save(tk);

                savedNv.setId_tai_khoan(tk.getId_tai_khoan());
                nhanVienRepository.save(savedNv);
            }

            return org.springframework.http.ResponseEntity.ok(savedNv);
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.status(500)
                    .body(Map.of("message", "Lỗi khi thêm nhân viên: " + e.getMessage()));
        }
    }

    @DeleteMapping("/nhan-vien/{id}")
    public org.springframework.http.ResponseEntity<?> deleteNhanVien(@PathVariable String id) {
        try {
            if (isSelfNhanVien(id)) {
                return org.springframework.http.ResponseEntity.status(400)
                        .body(Map.of("message", "Không thể tự vô hiệu hóa tài khoản nhân viên đang đăng nhập."));
            }
            if (!canManageNhanVien(id)) {
                return org.springframework.http.ResponseEntity.status(403)
                        .body(Map.of("message", "Chỉ Admin mới được vô hiệu hóa tài khoản nhân viên khác."));
            }

            Optional<NhanVien> nvOpt = nhanVienRepository.findById(id);
            if (nvOpt.isPresent()) {
                NhanVien nv = nvOpt.get();
                nv.setDa_xoa(true);
                nv.setTrang_thai("INACTIVE");
                nv.setNgay_nghi_viec(java.time.LocalDate.now());
                nhanVienRepository.save(nv);
                Optional<com.rexi.pkty.entity.TaiKhoan> tkToLock =
                        nv.getId_tai_khoan() != null && !nv.getId_tai_khoan().isEmpty()
                                ? taiKhoanRepository.findById(nv.getId_tai_khoan())
                                : taiKhoanRepository.findByIdNhanVien(id);
                tkToLock.ifPresent(tk -> {
                    tk.setTrang_thai("inactive");
                    taiKhoanRepository.save(tk);
                });
                return org.springframework.http.ResponseEntity.ok(Map.of("message", "Đã xóa nhân viên thành công!"));
            }
            return org.springframework.http.ResponseEntity.status(404)
                    .body(Map.of("message", "Không tìm thấy nhân viên!"));
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.status(500)
                    .body(Map.of("message", "Lỗi: " + e.getMessage()));
        }
    }

    @PutMapping("/nhan-vien/{id}/restore")
    public org.springframework.http.ResponseEntity<?> restoreNhanVien(@PathVariable String id) {
        try {
            boolean canRestore = getAuthenticatedAccount()
                    .map(tk -> {
                        String role = tk.getId_vai_tro() != null ? tk.getId_vai_tro().toUpperCase() : "";
                        return role.equals("VT-ADMIN") || role.equals("VT-1") || role.equals("VT-QL") || role.equals("VT-2");
                    })
                    .orElse(false);

            if (!canRestore) {
                return org.springframework.http.ResponseEntity.status(403)
                        .body(Map.of("message", "Chỉ Admin/Quản lý mới được phục hồi nhân viên đã xóa mềm."));
            }

            Optional<NhanVien> nvOpt = nhanVienRepository.findById(id);
            if (nvOpt.isEmpty()) {
                return org.springframework.http.ResponseEntity.status(404)
                        .body(Map.of("message", "Không tìm thấy nhân viên!"));
            }

            NhanVien nv = nvOpt.get();
            nv.setDa_xoa(false);
            nv.setTrang_thai("Đang làm việc");
            nv.setNgay_nghi_viec(null);
            nhanVienRepository.save(nv);

            Optional<com.rexi.pkty.entity.TaiKhoan> tkToUnlock =
                    nv.getId_tai_khoan() != null && !nv.getId_tai_khoan().isEmpty()
                            ? taiKhoanRepository.findById(nv.getId_tai_khoan())
                            : taiKhoanRepository.findByIdNhanVien(id);
            tkToUnlock.ifPresent(tk -> {
                tk.setTrang_thai("active");
                taiKhoanRepository.save(tk);
            });

            return org.springframework.http.ResponseEntity.ok(Map.of("message", "Đã phục hồi nhân viên và mở khóa tài khoản liên kết."));
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.status(500)
                    .body(Map.of("message", "Lỗi: " + e.getMessage()));
        }
    }


}



