package com.rexi.pkty.controller;

import com.rexi.pkty.entity.LichHen;
import com.rexi.pkty.entity.TaiKhoan;
import com.rexi.pkty.repository.LichHenRepository;
import com.rexi.pkty.security.RexiSecurityRoles;
import com.rexi.pkty.util.DatabaseDialect;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import org.springframework.http.ResponseEntity;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.logging.Logger;

@RestController
@RequestMapping("/api/lich-hen")
@CrossOrigin(origins = "${cors.allowed-origins:http://localhost:3000,http://localhost:5173}")
public class LichHenController {

    private static final Logger logger = Logger.getLogger(LichHenController.class.getName());

    @Autowired
    private LichHenRepository lichHenRepository;

    @Autowired(required = false)
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private com.rexi.pkty.service.EmailService emailService;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Autowired
    private com.rexi.pkty.repository.TaiKhoanRepository taiKhoanRepository;

    @Autowired
    private com.rexi.pkty.service.AuditLogService auditLogService;

    private String blankToNull(String value) {
        return value == null || value.trim().isEmpty() ? null : value.trim();
    }

    private String newAppointmentId() {
        return "LH-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
    }

    private void broadcastLichHenChanged(String action, LichHen lichHen) {
        if (messagingTemplate == null || lichHen == null) {
            return;
        }
        try {
            messagingTemplate.convertAndSend("/topic/appointments", Map.of(
                    "type", "appointments-changed",
                    "action", action,
                    "id_lich_hen", lichHen.getId_lich_hen(),
                    "id_khach_hang", lichHen.getId_khach_hang() != null ? lichHen.getId_khach_hang() : "",
                    "ngay_kham", lichHen.getNgay_kham() != null ? lichHen.getNgay_kham().toString() : "",
                    "timestamp", System.currentTimeMillis()));
        } catch (Exception e) {
            logger.warning("Không thể phát realtime lịch hẹn: " + e.getMessage());
        }
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> createLichHen(@RequestBody LichHen lichHen) {
        try {
            lichHen.setId_lich_hen(newAppointmentId());
            lichHen.setId_khach_hang(blankToNull(lichHen.getId_khach_hang()));
            lichHen.setId_thu_cung(blankToNull(lichHen.getId_thu_cung()));
            lichHen.setId_bac_si(blankToNull(lichHen.getId_bac_si()));
            lichHen.setId_dich_vu(blankToNull(lichHen.getId_dich_vu()));
            lichHen.setId_nguoi_dat(blankToNull(lichHen.getId_nguoi_dat()));

            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                    .getContext().getAuthentication();
            String username = (auth != null) ? auth.getName() : null;

            if (username != null && !username.equals("anonymousUser")) {
                taiKhoanRepository.findByTenDangNhap(username).ifPresent(tk -> {
                    // Chỉ cho khách hàng đặt lịch của chính mình
                    if (tk.getId_vai_tro() != null && "VT-5".equals(tk.getId_vai_tro())) { 
                        if (lichHen.getId_khach_hang() == null || lichHen.getId_khach_hang().isEmpty()) {
                            lichHen.setId_khach_hang(tk.getId_khach_hang());
                        } else if (!lichHen.getId_khach_hang().equals(tk.getId_khach_hang())) {
                            throw new RuntimeException("Cảnh báo bảo mật: Bạn không thể đặt lịch cho khách hàng khác!");
                        }
                    }
                });
            }

            if (lichHen.getId_khach_hang() == null || lichHen.getId_khach_hang().isEmpty()) {
                throw new RuntimeException(
                        "Tài khoản nội bộ (Admin/Nhân viên) vui lòng chọn khách hàng để đặt lịch. Nếu bạn là khách hàng, vui lòng dùng tài khoản Khách hàng!");
            }

            if (lichHen.getNgay_kham() == null) {
                throw new RuntimeException("Ngày khám không được để trống!");
            }

            if (lichHen.getId_thu_cung() == null) {
                throw new RuntimeException("Vui lòng chọn thú cưng cần khám!");
            }

            boolean pg = DatabaseDialect.isPostgres(jdbcTemplate);

            Integer petOwnerCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM ThuCung WHERE id_thu_cung = ? AND id_khach_hang = ? AND " + DatabaseDialect.isNotDeleted(pg, "da_xoa"),
                    Integer.class, lichHen.getId_thu_cung(), lichHen.getId_khach_hang());
            if (petOwnerCount == null || petOwnerCount == 0) {
                throw new RuntimeException("Thú cưng đã chọn không thuộc hồ sơ khách hàng này hoặc đã bị xóa!");
            }

            if (lichHen.getId_dich_vu() == null) {
                throw new RuntimeException("Vui lòng chọn dịch vụ trước khi đặt lịch!");
            }

            Integer activeServiceCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM DichVu WHERE id_dich_vu = ? AND " + DatabaseDialect.isActive(pg, "trang_thai"),
                    Integer.class, lichHen.getId_dich_vu());
            if (activeServiceCount == null || activeServiceCount == 0) {
                throw new RuntimeException("Dịch vụ đã chọn không còn khả dụng. Vui lòng chọn dịch vụ khác!");
            }

            Integer thoiLuongMoi = 30;
            if (lichHen.getId_dich_vu() != null) {
                try {
                    thoiLuongMoi = jdbcTemplate.queryForObject("SELECT thoi_luong_phut FROM DichVu WHERE id_dich_vu = ?",
                            Integer.class, lichHen.getId_dich_vu());
                    if (thoiLuongMoi == null)
                        thoiLuongMoi = 30;
                } catch (Exception ignored) {
                }
            }

            LocalTime newStart = lichHen.getGio_kham();
            if (newStart == null) {
                throw new RuntimeException("Giờ khám không được để trống sếp ơi!");
            }

            ZoneId vnZone = ZoneId.of("Asia/Ho_Chi_Minh");
            java.time.LocalDate today = java.time.LocalDate.now(vnZone);
            if (lichHen.getNgay_kham().isBefore(today)) {
                throw new RuntimeException("Sếp ơi, ngày khám không được ở quá khứ đâu ạ!");
            }
            if (lichHen.getNgay_kham().isAfter(today.plusDays(90))) {
                throw new RuntimeException("Chỉ được đặt lịch trong vòng 90 ngày tới!");
            }
            if (lichHen.getNgay_kham().isEqual(today) && !newStart.isAfter(LocalTime.now(vnZone))) {
                throw new RuntimeException("Khung giờ này đã qua rồi. Vui lòng chọn giờ khám muộn hơn!");
            }
            LocalTime newEnd = newStart.plusMinutes(thoiLuongMoi);
            int newStartMinute = newStart.getHour() * 60 + newStart.getMinute();
            int newEndMinute = newEnd.getHour() * 60 + newEnd.getMinute();

            if (lichHen.getId_bac_si() == null || lichHen.getId_bac_si().isEmpty() || lichHen.getId_bac_si().equals("0")) {
                String busyStartMinute = pg
                        ? "(EXTRACT(HOUR FROM h.gio_kham::time) * 60 + EXTRACT(MINUTE FROM h.gio_kham::time))::int"
                        : "(DATEPART(HOUR, h.gio_kham) * 60 + DATEPART(MINUTE, h.gio_kham))";
                String findDocQuery = "SELECT l.id_nhan_vien FROM LichLamViecNhanVien l " +
                        "JOIN NhanVien nv ON l.id_nhan_vien = nv.id_nhan_vien " +
                        "WHERE l.ngay_lam = ? AND l.gio_bat_dau <= CAST(? AS time) AND l.gio_ket_thuc > CAST(? AS time) " +
                        "AND " + DatabaseDialect.isNotDeleted(pg, "nv.da_xoa") + " " +
                        "AND (LOWER(COALESCE(nv.chuyen_mon, '')) LIKE '%bác sĩ%' " +
                        "  OR LOWER(COALESCE(nv.chuyen_mon, '')) LIKE '%bac si%' " +
                        "  OR LOWER(COALESCE(nv.chuyen_mon, '')) LIKE '%doctor%' " +
                        "  OR EXISTS (SELECT 1 FROM TaiKhoan tk WHERE tk.id_nhan_vien = nv.id_nhan_vien " +
                        "    AND (tk.id_vai_tro IN ('VT-BS', 'VT-2', '2') OR UPPER(COALESCE(tk.id_vai_tro, '')) LIKE '%BS%'))) " +
                        "AND NOT EXISTS (SELECT 1 FROM LichHen h " +
                        "  LEFT JOIN DichVu d ON h.id_dich_vu = d.id_dich_vu " +
                        "  WHERE h.id_bac_si = l.id_nhan_vien AND h.ngay_kham = l.ngay_lam " +
                        "  AND " + busyStartMinute + " < ? " +
                        "  AND " + busyStartMinute + " + COALESCE(d.thoi_luong_phut, 30) > ? " +
                        "  AND h.trang_thai NOT IN ('Đã hủy', 'DA_HUY', 'da_huy', 'TU_CHOI', 'Hết hạn')" +
                        ") ORDER BY l.id_nhan_vien " + DatabaseDialect.topN(pg, 1);
                try {
                    String autoDocId = jdbcTemplate.queryForObject(findDocQuery, String.class,
                            lichHen.getNgay_kham(), java.sql.Time.valueOf(newStart), java.sql.Time.valueOf(newStart), newEndMinute, newStartMinute);
                    lichHen.setId_bac_si(autoDocId);
                } catch (Exception e) {
                    logger.severe("Lỗi tìm bác sĩ tự động: " + e.getMessage());
                    throw new RuntimeException(
                            "Rất tiếc! Không còn bác sĩ nào rảnh vào khung giờ này sếp ơi. Sếp chọn giờ khác nhé! 🐾");
                }
            }

            // Kiểm tra bác sĩ có ca làm việc bao phủ toàn bộ thời lượng dịch vụ không
            // Dùng gio_ket_thuc để kiểm tra đúng — tránh lỗi khi 1 row = 1 ca dài (vd 8:00-17:00)
            List<Map<String, Object>> gioBacSiMoList = jdbcTemplate.queryForList(
                    "SELECT gio_bat_dau, gio_ket_thuc FROM LichLamViecNhanVien WHERE id_nhan_vien = ? AND ngay_lam = ?",
                    lichHen.getId_bac_si(), lichHen.getNgay_kham());

            // Kiểm tra toàn bộ thời gian dịch vụ (newStart → newEnd) có nằm trong ít nhất 1 ca làm việc không
            boolean shiftCoversService = false;
            for (Map<String, Object> map : gioBacSiMoList) {
                Object bdObj = map.get("gio_bat_dau");
                Object ktObj = map.get("gio_ket_thuc");
                LocalTime batDau = null, ketThuc = null;
                if (bdObj instanceof java.sql.Time) batDau = ((java.sql.Time) bdObj).toLocalTime();
                else if (bdObj != null) { String[] p = bdObj.toString().split(":"); batDau = LocalTime.of(Integer.parseInt(p[0]), Integer.parseInt(p[1])); }
                if (ktObj instanceof java.sql.Time) ketThuc = ((java.sql.Time) ktObj).toLocalTime();
                else if (ktObj != null) { String[] p = ktObj.toString().split(":"); ketThuc = LocalTime.of(Integer.parseInt(p[0]), Integer.parseInt(p[1])); }
                // Ca làm việc phải bắt đầu <= newStart VÀ kết thúc >= newEnd
                if (batDau != null && !batDau.isAfter(newStart) && (ketThuc == null || !ketThuc.isBefore(newEnd))) {
                    shiftCoversService = true;
                    break;
                }
            }

            if (!shiftCoversService) {
                throw new RuntimeException("Dịch vụ này cần " + thoiLuongMoi
                        + " phút nhưng bác sĩ chưa mở đủ ca trực liên tiếp. Vui lòng chọn giờ sớm hơn hoặc khung giờ khác!");
            }

            boolean isConflict = false;
            List<Map<String, Object>> existingApps = jdbcTemplate.queryForList(
                    "SELECT lh.gio_kham, dv.thoi_luong_phut FROM LichHen lh LEFT JOIN DichVu dv ON lh.id_dich_vu = dv.id_dich_vu WHERE lh.id_bac_si = ? AND lh.ngay_kham = ? AND lh.trang_thai NOT IN ('Đã hủy', 'DA_HUY', 'da_huy', 'TU_CHOI', 'Hết hạn')",
                    lichHen.getId_bac_si(), lichHen.getNgay_kham());

            for (Map<String, Object> app : existingApps) {
                Object existingGioObj = app.get("gio_kham");
                LocalTime existingStart;
                if (existingGioObj instanceof java.sql.Time) {
                    existingStart = ((java.sql.Time) existingGioObj).toLocalTime();
                } else {
                    String existingGioStr = existingGioObj.toString();
                    String[] eParts = existingGioStr.split(":");
                    existingStart = LocalTime.of(Integer.parseInt(eParts[0]), Integer.parseInt(eParts[1]));
                }

                Integer duration = app.get("thoi_luong_phut") != null ? ((Number) app.get("thoi_luong_phut")).intValue()
                        : 30;
                LocalTime existingEnd = existingStart.plusMinutes(duration);

                if (newStart.isBefore(existingEnd) && newEnd.isAfter(existingStart)) {
                    isConflict = true;
                    break;
                }
            }

            if (isConflict) {
                throw new RuntimeException("Rất tiếc! Lịch khám này sẽ bị trùng thời gian (" + thoiLuongMoi
                        + " phút) với một khách hàng khác. Vui lòng chọn khung giờ rộng hơn nhé!");
            }

            // Ktra xem bé cưng bị trùng lịch hẹn khác cùng giờ không
            boolean isPetConflict = false;
            if (lichHen.getId_thu_cung() != null && !lichHen.getId_thu_cung().isEmpty()) {
                List<Map<String, Object>> existingPetApps = jdbcTemplate.queryForList(
                        "SELECT lh.gio_kham, dv.thoi_luong_phut FROM LichHen lh LEFT JOIN DichVu dv ON lh.id_dich_vu = dv.id_dich_vu WHERE lh.id_thu_cung = ? AND lh.ngay_kham = ? AND lh.trang_thai NOT IN ('Đã hủy', 'DA_HUY', 'da_huy', 'TU_CHOI', 'Hết hạn')",
                        lichHen.getId_thu_cung(), lichHen.getNgay_kham());

                for (Map<String, Object> app : existingPetApps) {
                    Object existingGioObj = app.get("gio_kham");
                    LocalTime existingStart;
                    if (existingGioObj instanceof java.sql.Time) {
                        existingStart = ((java.sql.Time) existingGioObj).toLocalTime();
                    } else {
                        String existingGioStr = existingGioObj.toString();
                        String[] eParts = existingGioStr.split(":");
                        existingStart = LocalTime.of(Integer.parseInt(eParts[0]), Integer.parseInt(eParts[1]));
                    }

                    Integer duration = app.get("thoi_luong_phut") != null ? ((Number) app.get("thoi_luong_phut")).intValue() : 30;
                    LocalTime existingEnd = existingStart.plusMinutes(duration);

                    if (newStart.isBefore(existingEnd) && newEnd.isAfter(existingStart)) {
                        isPetConflict = true;
                        break;
                    }
                }
            }

            if (isPetConflict) {
                throw new RuntimeException("Sếp ơi! Bé cưng này đã có một lịch hẹn khám khác trùng vào khung giờ này rồi ạ. Vui lòng chọn khung giờ khác nhé! 🐾");
            }

            if (lichHen.getLy_do() != null)
                lichHen.setLy_do(org.springframework.web.util.HtmlUtils.htmlEscape(lichHen.getLy_do()));
            if (lichHen.getGhi_chu() != null && (lichHen.getGhi_chu_noi_bo() == null || lichHen.getGhi_chu_noi_bo().isBlank()))
                lichHen.setGhi_chu_noi_bo(lichHen.getGhi_chu());
            if (lichHen.getGhi_chu_noi_bo() != null)
                lichHen.setGhi_chu_noi_bo(org.springframework.web.util.HtmlUtils.htmlEscape(lichHen.getGhi_chu_noi_bo()));

            if (lichHen.getNgay_tao() == null) {
                lichHen.setNgay_tao(LocalDateTime.now());
            }

            boolean isInternal = auth != null && auth.getAuthorities() != null &&
                    (auth.getAuthorities().toString().toUpperCase().contains("ADMIN") ||
                            auth.getAuthorities().toString().toUpperCase().contains("QUAN_LY") ||
                            auth.getAuthorities().toString().toUpperCase().contains("BAC_SI") ||
                            auth.getAuthorities().toString().toUpperCase().contains("STAFF") ||
                            auth.getAuthorities().toString().toUpperCase().contains("TIEP_TAN"));

            if (!isInternal || lichHen.getTrang_thai() == null || lichHen.getTrang_thai().isEmpty()) {
                lichHen.setTrang_thai("CHO_XAC_NHAN");
            }

            LichHen saved = lichHenRepository.save(lichHen);
            broadcastLichHenChanged("created", saved);

            // Gửi email xác nhận cho CẢ customer VÀ internal user
            try {
                String emailQuery = "SELECT kh.email, kh.ten_khach_hang, tc.ten_thu_cung, nv.ho_ten as ten_bac_si, dv.ten_dich_vu " +
                        "FROM KhachHang kh " +
                        "LEFT JOIN ThuCung tc ON tc.id_thu_cung = ? " +
                        "LEFT JOIN NhanVien nv ON nv.id_nhan_vien = ? " +
                        "LEFT JOIN DichVu dv ON dv.id_dich_vu = ? " +
                        "WHERE kh.id_khach_hang = ?";
                List<Map<String, Object>> info = jdbcTemplate.queryForList(emailQuery,
                        saved.getId_thu_cung(), saved.getId_bac_si(), saved.getId_dich_vu(), saved.getId_khach_hang());

                if (!info.isEmpty() && info.get(0).get("email") != null && !info.get(0).get("email").toString().isEmpty()) {
                    String toEmail = info.get(0).get("email").toString();
                    String tenKhachHang = info.get(0).get("ten_khach_hang") != null
                            ? info.get(0).get("ten_khach_hang").toString()
                            : "Khách hàng";
                    String tenThuCung = info.get(0).get("ten_thu_cung") != null ? info.get(0).get("ten_thu_cung").toString()
                            : "Thú cưng";
                    String tenBacSi = info.get(0).get("ten_bac_si") != null ? info.get(0).get("ten_bac_si").toString()
                            : "Bác sĩ Rexi";
                    String tenDichVu = info.get(0).get("ten_dich_vu") != null ? info.get(0).get("ten_dich_vu").toString()
                            : "Dịch vụ Thú y";

                    emailService.sendBookingConfirmation(toEmail, tenKhachHang, tenThuCung, tenBacSi,
                            saved.getNgay_kham().toString(), saved.getGio_kham().toString(), tenDichVu);
                }
            } catch (Exception e) {
                logger.severe("Lỗi gửi email confirmation: " + e.getMessage());
            }
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage() != null ? e.getMessage() : "Đã xảy ra lỗi nghiệp vụ khi tạo lịch hẹn."));
        }
    }

    private boolean isInternalUser() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        if (auth == null || auth.getName().equals("anonymousUser"))
            return false;
        String roles = auth.getAuthorities().toString().toUpperCase();
        return roles.contains("ADMIN") || roles.contains("QUAN_LY") || roles.contains("BAC_SI") || roles.contains("STAFF") || roles.contains("NHAN_VIEN") || roles.contains("TIEP_TAN");
    }

    @PostMapping("/dat-lich-nhanh")
    @Transactional
    public ResponseEntity<?> datLichNhanh(@RequestBody Map<String, Object> payload) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, String> kh = (Map<String, String>) payload.get("khach_hang");
            @SuppressWarnings("unchecked")
            Map<String, String> tc = (Map<String, String>) payload.get("thu_cung");
            @SuppressWarnings("unchecked")
            Map<String, Object> lh = (Map<String, Object>) payload.get("lich_hen");

            if (kh == null || tc == null || lh == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Dữ liệu không hợp lệ: thiếu thông tin khách hàng, thú cưng hoặc lịch hẹn"));
            }

            String sdt = kh.get("sdt");
            String email = kh.get("email");

            // Validate required fields
            if (sdt == null || sdt.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Số điện thoại không được để trống"));
            }
            if (lh.get("ngay_kham") == null || lh.get("ngay_kham").toString().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Ngày khám không được để trống"));
            }
            if (lh.get("gio_kham") == null || lh.get("gio_kham").toString().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Giờ khám không được để trống"));
            }
            if (lh.get("id_dich_vu") == null || lh.get("id_dich_vu").toString().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Dịch vụ không được để trống"));
            }
            if (lh.get("id_bac_si") == null || lh.get("id_bac_si").toString().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Bác sĩ không được để trống"));
            }

            // Validate date not in the past
            java.time.LocalDate ngayKham = java.time.LocalDate.parse(lh.get("ngay_kham").toString());
            if (ngayKham.isBefore(java.time.LocalDate.now())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Không thể đặt lịch cho ngày trong quá khứ"));
            }

            List<Map<String, Object>> existingKh = jdbcTemplate
                    .queryForList("SELECT id_khach_hang FROM KhachHang WHERE sdt = ?", sdt);
            String idKhachHang;

            if (existingKh.isEmpty()) {
                String idTaiKhoan = "TK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
                String generatedPass = "Rexi@" + UUID.randomUUID().toString().substring(0, 8);

                jdbcTemplate.update(
                        "INSERT INTO TaiKhoan (id_tai_khoan, ten_dang_nhap, mat_khau, mat_khau_hash, id_vai_tro, trang_thai, ngay_tao) VALUES (?, ?, ?, ?, 'VT-5', 'Hoạt động', CURRENT_TIMESTAMP)",
                        idTaiKhoan, (email != null && !email.isEmpty() ? email : sdt + "@rexi.vn"), "[ENCRYPTED]", passwordEncoder.encode(generatedPass));

                if (email != null && !email.isEmpty()) {
                    emailService.sendPasswordEmail(email, kh.get("ten_khach_hang"), generatedPass);
                }

                idKhachHang = "KH-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
                jdbcTemplate.update(
                        "INSERT INTO KhachHang (id_khach_hang, ten_khach_hang, sdt, email, ngay_tao, da_xoa) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, 0)",
                        idKhachHang, kh.get("ten_khach_hang"), sdt, (email != null && !email.isEmpty() ? email : sdt + "@rexi.vn"));
            } else {
                idKhachHang = existingKh.get(0).get("id_khach_hang").toString();
            }

            String idThuCung;
            String tenThuCung = tc.get("ten_thu_cung") != null ? tc.get("ten_thu_cung").toString().trim() : null;
            if (tenThuCung == null || tenThuCung.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Tên thú cung không được để trống"));
            }

            // Check if pet already exists for this customer
            List<Map<String, Object>> existingPet = jdbcTemplate.queryForList(
                    "SELECT id_thu_cung FROM ThuCung WHERE id_khach_hang = ? AND ten_thu_cung = ? AND (da_xoa = 0 OR da_xoa IS NULL)",
                    idKhachHang, tenThuCung);
            if (!existingPet.isEmpty()) {
                idThuCung = existingPet.get(0).get("id_thu_cung").toString();
            } else {
                idThuCung = "TC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
                jdbcTemplate.update(
                        "INSERT INTO ThuCung (id_thu_cung, id_khach_hang, ten_thu_cung, loai, giong) VALUES (?, ?, ?, 'Chưa xác định', 'Chưa xác định')",
                        idThuCung, idKhachHang, tenThuCung);
            }

            LichHen lichHen = new LichHen();
            lichHen.setId_lich_hen(newAppointmentId());
            lichHen.setId_khach_hang(idKhachHang);
            lichHen.setId_thu_cung(idThuCung);
            lichHen.setId_dich_vu(lh.get("id_dich_vu") != null ? lh.get("id_dich_vu").toString() : null);
            lichHen.setId_bac_si(lh.get("id_bac_si") != null ? lh.get("id_bac_si").toString() : null);
            lichHen.setNgay_kham(java.time.LocalDate.parse(lh.get("ngay_kham").toString()));

            String gioKhamStr = lh.get("gio_kham").toString();
            if (gioKhamStr.length() == 5) gioKhamStr += ":00";
            lichHen.setGio_kham(java.time.LocalTime.parse(gioKhamStr));

            lichHen.setLy_do(lh.get("ly_do") != null ? lh.get("ly_do").toString() : null);
            lichHen.setGhi_chu_noi_bo(lh.get("ghi_chu") != null ? lh.get("ghi_chu").toString() : null);
            lichHen.setTrang_thai("CHO_XAC_NHAN");
            lichHen.setNgay_tao(LocalDateTime.now());

            // Overlap check for doctor
            String idBacSi = lichHen.getId_bac_si();
            if (idBacSi != null && !idBacSi.isEmpty()) {
                Integer thoiLuong = 30;
                try {
                    List<Map<String, Object>> dvRows = jdbcTemplate.queryForList(
                            "SELECT thoi_luong_phut FROM DichVu WHERE id_dich_vu = ?", lichHen.getId_dich_vu());
                    if (!dvRows.isEmpty() && dvRows.get(0).get("thoi_luong_phut") != null) {
                        thoiLuong = ((Number) dvRows.get(0).get("thoi_luong_phut")).intValue();
                    }
                } catch (Exception ignored) {}

                LocalTime newStart = lichHen.getGio_kham();
                LocalTime newEnd = newStart.plusMinutes(thoiLuong);
                int newStartMin = newStart.getHour() * 60 + newStart.getMinute();
                int newEndMin = newEnd.getHour() * 60 + newEnd.getMinute();

                List<Map<String, Object>> conflicts = jdbcTemplate.queryForList(
                        "SELECT lh.gio_kham, dv.thoi_luong_phut FROM LichHen lh " +
                        "LEFT JOIN DichVu dv ON lh.id_dich_vu = dv.id_dich_vu " +
                        "WHERE lh.id_bac_si = ? AND lh.ngay_kham = ? " +
                        "AND lh.trang_thai NOT IN ('Đã hủy', 'DA_HUY', 'da_huy', 'TU_CHOI', 'Hết hạn')",
                        idBacSi, lichHen.getNgay_kham());

                for (Map<String, Object> row : conflicts) {
                    Object gioObj = row.get("gio_kham");
                    LocalTime existStart;
                    if (gioObj instanceof java.sql.Time) {
                        existStart = ((java.sql.Time) gioObj).toLocalTime();
                    } else {
                        String[] parts = gioObj.toString().split(":");
                        existStart = java.time.LocalTime.of(Integer.parseInt(parts[0]), Integer.parseInt(parts[1]));
                    }
                    Integer dur = row.get("thoi_luong_phut") != null ? ((Number) row.get("thoi_luong_phut")).intValue() : 30;
                    LocalTime existEnd = existStart.plusMinutes(dur);
                    if (newStart.isBefore(existEnd) && newEnd.isAfter(existStart)) {
                        return ResponseEntity.badRequest().body(Map.of("message",
                                "Bác sĩ đã có lịch khám trùng giờ này. Vui lòng chọn khung giờ khác!"));
                    }
                }
            }

            LichHen saved = lichHenRepository.save(lichHen);
            broadcastLichHenChanged("quick-created", saved);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi đặt lịch nhanh: " + e.getMessage()));
        }
    }

    @GetMapping
    @PreAuthorize(RexiSecurityRoles.APPOINTMENT_READ)
    public ResponseEntity<?> getAll(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search) {
        // Gen SQL loc trang thai & search keyword
        StringBuilder where = new StringBuilder("WHERE 1=1");
        java.util.List<Object> params = new java.util.ArrayList<>();
        if (status != null && !status.isEmpty()) {
            where.append(" AND lh.trang_thai = ?");
            params.add(status.toUpperCase());
        }
        com.rexi.pkty.util.SmartSearchSql.appendTokenSearch(where, params, search,
                "CAST(lh.id_lich_hen AS varchar) LIKE ?",
                "LOWER(COALESCE(tc.ten_thu_cung, '')) LIKE LOWER(?)",
                "LOWER(COALESCE(kh.ten_khach_hang, '')) LIKE LOWER(?)",
                "kh.sdt LIKE ?",
                "LOWER(COALESCE(nv.ho_ten, '')) LIKE LOWER(?)",
                "LOWER(COALESCE(dv.ten_dich_vu, '')) LIKE LOWER(?)",
                "LOWER(COALESCE(lh.ly_do, '')) LIKE LOWER(?)",
                "LOWER(COALESCE(lh.ghi_chu_noi_bo, '')) LIKE LOWER(?)");

        String baseSelect = "SELECT lh.*, kh.ten_khach_hang, kh.sdt, tc.ten_thu_cung, nv.ho_ten as ten_bac_si, dv.ten_dich_vu " +
                "FROM LichHen lh " +
                "LEFT JOIN KhachHang kh ON lh.id_khach_hang = kh.id_khach_hang " +
                "LEFT JOIN ThuCung tc ON lh.id_thu_cung = tc.id_thu_cung " +
                "LEFT JOIN NhanVien nv ON lh.id_bac_si = nv.id_nhan_vien " +
                "LEFT JOIN DichVu dv ON lh.id_dich_vu = dv.id_dich_vu ";

        // Phan trang neu co page & size
        if (page != null && size != null && size > 0) {
            try {
                Integer total = jdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM LichHen lh " +
                                "LEFT JOIN KhachHang kh ON lh.id_khach_hang = kh.id_khach_hang " +
                                "LEFT JOIN ThuCung tc ON lh.id_thu_cung = tc.id_thu_cung " +
                                "LEFT JOIN NhanVien nv ON lh.id_bac_si = nv.id_nhan_vien " +
                                "LEFT JOIN DichVu dv ON lh.id_dich_vu = dv.id_dich_vu " +
                                where, Integer.class, params.toArray());
                int totalPages = (int) Math.ceil((double) (total != null ? total : 0) / size);

                java.util.List<Object> dataParams = new java.util.ArrayList<>(params);

                StringBuilder sqlBuilder = new StringBuilder(baseSelect).append(where)
                        .append(" ORDER BY lh.ngay_kham DESC, lh.gio_kham DESC");
                DatabaseDialect.appendPagination(sqlBuilder, DatabaseDialect.isPostgres(jdbcTemplate), size, page * size);

                java.util.List<Map<String, Object>> content = jdbcTemplate.queryForList(sqlBuilder.toString(), dataParams.toArray());
                return ResponseEntity.ok(Map.of(
                        "content", content,
                        "totalPages", totalPages,
                        "totalElements", total != null ? total : 0,
                        "currentPage", page
                ));
            } catch (Exception e) {
                logger.severe("Lỗi phân trang lịch hẹn: " + e.getMessage());
                return ResponseEntity.status(500).body(Map.of("message", "Lỗi phân trang lịch hẹn: " + e.getMessage()));
            }
        }

        // Dự phòng: lấy tất cả nếu không có page size
        String sql = baseSelect + where + " ORDER BY lh.ngay_kham DESC, lh.gio_kham DESC";
        java.util.List<Map<String, Object>> all = jdbcTemplate.queryForList(sql, params.toArray());
        return ResponseEntity.ok(all);
    }

    @GetMapping("/hom-nay")
    @PreAuthorize(RexiSecurityRoles.APPOINTMENT_READ)
    public ResponseEntity<?> getTodayAppointments(@RequestParam(required = false, defaultValue = "ngay_kham") String loai) {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        String username = (auth != null) ? auth.getName() : null;
        boolean byCreatedToday = "dat_hom_nay".equalsIgnoreCase(loai)
                || "ngay_tao".equalsIgnoreCase(loai)
                || "created_today".equalsIgnoreCase(loai);

        StringBuilder sql = new StringBuilder(
                "SELECT lh.*, kh.ten_khach_hang, kh.sdt, tc.ten_thu_cung, nv.ho_ten as ten_bac_si, dv.ten_dich_vu " +
                        "FROM LichHen lh " +
                        "LEFT JOIN KhachHang kh ON lh.id_khach_hang = kh.id_khach_hang " +
                        "LEFT JOIN ThuCung tc ON lh.id_thu_cung = tc.id_thu_cung " +
                        "LEFT JOIN NhanVien nv ON lh.id_bac_si = nv.id_nhan_vien " +
                        "LEFT JOIN DichVu dv ON lh.id_dich_vu = dv.id_dich_vu " +
                        "WHERE CAST(" + (byCreatedToday ? "lh.ngay_tao" : "lh.ngay_kham") + " AS DATE) = ? ");
        java.util.List<Object> params = new java.util.ArrayList<>();
        params.add(java.sql.Date.valueOf(java.time.LocalDate.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh"))));

        if (username != null && !username.equals("anonymousUser")) {
            TaiKhoan tk = taiKhoanRepository.findByTenDangNhap(username).orElse(null);
            if (tk != null) {
                String role = tk.getId_vai_tro() != null ? tk.getId_vai_tro().toUpperCase() : "";
                boolean isAdminView = role.equals("VT-1") || role.contains("ADMIN") || role.contains("QUAN_LY") || role.contains("TIEP_TAN") || role.contains("STAFF");
                boolean isDoctorView = role.contains("BAC_SI") || role.equals("VT-2") || role.equals("VT_BS") || role.equals("VT-8") || role.contains("Y_TA");
                boolean isCustomerView = role.equals("VT-5") || role.contains("KHACH_HANG");

                if (isDoctorView && tk.getId_nhan_vien() != null && !tk.getId_nhan_vien().isBlank()) {
                    sql.append(" AND lh.id_bac_si = ? ");
                    params.add(tk.getId_nhan_vien());
                } else if (isCustomerView && tk.getId_khach_hang() != null && !tk.getId_khach_hang().isBlank()) {
                    sql.append(" AND lh.id_khach_hang = ? ");
                    params.add(tk.getId_khach_hang());
                } else if (!isAdminView && tk.getId_nhan_vien() != null && !tk.getId_nhan_vien().isBlank()) {
                    sql.append(" AND lh.id_bac_si = ? ");
                    params.add(tk.getId_nhan_vien());
                }
            }
        }

        sql.append(byCreatedToday ? " ORDER BY lh.ngay_tao DESC, lh.gio_kham ASC" : " ORDER BY lh.gio_kham ASC");
        return ResponseEntity.ok(jdbcTemplate.queryForList(sql.toString(), params.toArray()));
    }

    @GetMapping("/khach-hang/{idKhachHang}")
    public ResponseEntity<?> getByKhachHang(@PathVariable String idKhachHang) {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        String username = (auth != null) ? auth.getName() : null;
        if (username == null || username.equals("anonymousUser")) {
            return ResponseEntity.status(401)
                    .body(Map.of("message", "Cảnh báo bảo mật: Yêu cầu không có Token xác thực hợp lệ!"));
        }
        com.rexi.pkty.entity.TaiKhoan tk = taiKhoanRepository.findByTenDangNhap(username).orElse(null);
        if (tk != null && "VT-5".equals(tk.getId_vai_tro())) { // Là khách hàng
            if (tk.getId_khach_hang() == null || !tk.getId_khach_hang().equals(idKhachHang)) {
                return ResponseEntity.status(403)
                        .body(Map.of("message", "Cảnh báo bảo mật: Bạn không có quyền xem dữ liệu của người khác!"));
            }
        }

        List<Map<String, Object>> result = jdbcTemplate.queryForList(
                "SELECT lh.*, tc.ten_thu_cung, nv.ho_ten as ten_bac_si, dv.ten_dich_vu " +
                        "FROM LichHen lh " +
                        "LEFT JOIN ThuCung tc ON lh.id_thu_cung = tc.id_thu_cung " +
                        "LEFT JOIN NhanVien nv ON lh.id_bac_si = nv.id_nhan_vien " +
                        "LEFT JOIN DichVu dv ON lh.id_dich_vu = dv.id_dich_vu " +
                        "WHERE lh.id_khach_hang = ? " +
                        "ORDER BY lh.ngay_tao DESC",
                idKhachHang);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/khach/{idKhachHang}")
    public ResponseEntity<?> getByKhachHangAlias(
            @PathVariable String idKhachHang,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String petId) {

        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        String username = (auth != null) ? auth.getName() : null;
        if (username == null || username.equals("anonymousUser")) {
            return ResponseEntity.status(401)
                    .body(Map.of("message", "Cảnh báo bảo mật: Yêu cầu không có Token xác thực hợp lệ!"));
        }
        com.rexi.pkty.entity.TaiKhoan tk = taiKhoanRepository.findByTenDangNhap(username).orElse(null);
        if (tk != null && "VT-5".equals(tk.getId_vai_tro())) { // Là khách hàng
            if (tk.getId_khach_hang() == null || !tk.getId_khach_hang().equals(idKhachHang)) {
                return ResponseEntity.status(403)
                        .body(Map.of("message", "Cảnh báo bảo mật: Bạn không có quyền xem dữ liệu của người khác!"));
            }
        }

        StringBuilder where = new StringBuilder("WHERE lh.id_khach_hang = ?");
        java.util.List<Object> params = new java.util.ArrayList<>();
        params.add(idKhachHang);

        if (status != null && !status.isEmpty()) {
            if ("DA_KHAM".equalsIgnoreCase(status)) {
                where.append(" AND (lh.trang_thai = 'DA_KHAM' OR lh.trang_thai = 'HOAN_THANH')");
            } else {
                where.append(" AND lh.trang_thai = ?");
                params.add(status.toUpperCase());
            }
        }
        if (petId != null && !petId.isEmpty()) {
            where.append(" AND lh.id_thu_cung = ?");
            params.add(petId);
        }

        try {
            int safeSize = Math.max(1, Math.min(size, 100));
            int safePage = Math.max(0, page);
            Integer total = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM LichHen lh " + where, Integer.class, params.toArray());
            int totalPages = (int) Math.ceil((double) (total != null ? total : 0) / safeSize);

            java.util.List<Object> dataParams = new java.util.ArrayList<>(params);
            StringBuilder sqlBuilder = new StringBuilder("SELECT lh.*, tc.ten_thu_cung, nv.ho_ten as ten_bac_si, dv.ten_dich_vu " +
                  "FROM LichHen lh " +
                  "LEFT JOIN ThuCung tc ON lh.id_thu_cung = tc.id_thu_cung " +
                  "LEFT JOIN NhanVien nv ON lh.id_bac_si = nv.id_nhan_vien " +
                  "LEFT JOIN DichVu dv ON lh.id_dich_vu = dv.id_dich_vu " +
                  where + " ORDER BY lh.ngay_tao DESC");
            DatabaseDialect.appendPagination(sqlBuilder, DatabaseDialect.isPostgres(jdbcTemplate), safeSize, safePage * safeSize);
            
            List<Map<String, Object>> content = jdbcTemplate.queryForList(sqlBuilder.toString(), dataParams.toArray());

            return ResponseEntity.ok(Map.of(
                    "content", content,
                    "totalPages", totalPages,
                    "totalElements", total != null ? total : 0,
                    "currentPage", safePage
            ));
        } catch (Exception e) {
            e.printStackTrace();
            logger.severe("Lỗi lấy lịch hẹn cho khách " + idKhachHang + ": " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                    "message", "Lỗi truy vấn lịch hẹn: " + e.getMessage(),
                    "content", new java.util.ArrayList<>(),
                    "totalPages", 0,
                    "totalElements", 0,
                    "currentPage", page
            ));
        }
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable String id, @RequestBody Map<String, String> body) {
        LichHen lh = lichHenRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy lịch hẹn"));

        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        String username = (auth != null) ? auth.getName() : null;
        boolean isCustomer = false;

        if (username == null || username.equals("anonymousUser")) {
            return ResponseEntity.status(401)
                    .body(Map.of("message", "Cảnh báo bảo mật: Yêu cầu không có Token xác thực hợp lệ!"));
        } else {
            com.rexi.pkty.entity.TaiKhoan tk = taiKhoanRepository.findByTenDangNhap(username).orElse(null);
            if (tk != null && tk.getId_vai_tro() != null && tk.getId_vai_tro().equals("VT-5")) {
                isCustomer = true;
                if (!tk.getId_khach_hang().equals(lh.getId_khach_hang())) {
                    return ResponseEntity.status(403).body(
                            Map.of("message", "Cảnh báo bảo mật: Bạn không có quyền thao tác trên lịch hẹn này!"));
                }
                String status = body.get("trang_thai");
                if (status != null && !status.equalsIgnoreCase("DA_HUY") && !status.equalsIgnoreCase("Đã hủy")) {
                    return ResponseEntity.status(403)
                            .body(Map.of("message", "Cảnh báo bảo mật: Khách hàng chỉ có quyền Hủy lịch hẹn!"));
                }
            }
        }

        String status = body.get("trang_thai");
        if (status != null) {
            status = status.toUpperCase();

            // Validate status transitions — không cho phép quay lại trạng thái đã qua
            if (!isCustomer) {
                String currentStatus = lh.getTrang_thai();
                java.util.Map<String, java.util.Set<String>> allowedTransitions = java.util.Map.of(
                    "CHO_XAC_NHAN", java.util.Set.of("DA_XAC_NHAN", "DA_HUY", "TU_CHOI", "KHONG_DEN"),
                    "DA_XAC_NHAN", java.util.Set.of("DANG_KHAM", "DA_HUY", "KHONG_DEN"),
                    "DANG_KHAM", java.util.Set.of("HOAN_THANH", "DA_HUY"),
                    "HOAN_THANH", java.util.Set.of(),
                    "DA_HUY", java.util.Set.of(),
                    "KHONG_DEN", java.util.Set.of()
                );
                java.util.Set<String> allowed = allowedTransitions.getOrDefault(currentStatus, java.util.Set.of());
                if (!allowed.contains(status) && !status.equals(currentStatus)) {
                    return ResponseEntity.status(400).body(Map.of("message",
                        "Không thể chuyển từ trạng thái '" + currentStatus + "' sang '" + status + "'"));
                }
            }

            lh.setTrang_thai(status);
            if (body.containsKey("ghi_chu_noi_bo") && !isCustomer) {
                lh.setGhi_chu_noi_bo(org.springframework.web.util.HtmlUtils.htmlEscape(body.get("ghi_chu_noi_bo")));
            }
        }

        LichHen saved = lichHenRepository.save(lh);
        broadcastLichHenChanged("status-updated", saved);
        if (!isCustomer) {
            auditLogService.logAction("ĐỔI TRẠNG THÁI", "LichHen",
                    "Cập nhật trạng thái lịch hẹn ID " + id + " thành " + status);
        }
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteLichHen(@PathVariable String id) {
        LichHen lh = lichHenRepository.findById(id).orElse(null);
        if (lh != null) {
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                    .getContext().getAuthentication();
            String username = (auth != null) ? auth.getName() : null;
            boolean isCustomer = false;

            if (username == null || username.equals("anonymousUser")) {
                return ResponseEntity.status(401)
                        .body(Map.of("message", "Cảnh báo bảo mật: Yêu cầu không có Token xác thực hợp lệ!"));
            } else {
                com.rexi.pkty.entity.TaiKhoan tk = taiKhoanRepository.findByTenDangNhap(username).orElse(null);
                if (tk != null && tk.getId_vai_tro() != null && tk.getId_vai_tro().equals("VT-5")) {
                    isCustomer = true;
                    if (!tk.getId_khach_hang().equals(lh.getId_khach_hang())) {
                        return ResponseEntity.status(403)
                                .body(Map.of("message", "Cảnh báo bảo mật: Bạn không có quyền hủy lịch hẹn này!"));
                    }
                }
            }

            // Chan xoa neu da co hoa don/benh an
            int usageCount = 0;
            try {
                usageCount += jdbcTemplate.queryForObject("SELECT COUNT(*) FROM HoSoBenhAn WHERE id_lich_hen = ?", Integer.class, id);
                usageCount += jdbcTemplate.queryForObject("SELECT COUNT(*) FROM HoaDon WHERE id_lich_hen = ?", Integer.class, id);
            } catch (Exception e) {}
            
            if (usageCount > 0) {
                return ResponseEntity.status(409).body(Map.of("message", "Không thể hủy lịch hẹn vì đã có Hóa đơn hoặc Hồ sơ Bệnh án liên kết. Nếu có sai sót, vui lòng liên hệ Quản lý để xử lý."));
            }

            // Xoa mem: set trang thai DA_HUY
            lh.setTrang_thai("DA_HUY");
            LichHen saved = lichHenRepository.save(lh);
            broadcastLichHenChanged("cancelled", saved);

            if (!isCustomer) {
                auditLogService.logAction("HỦY LỊCH (XÓA MỀM)", "LichHen", "Đã hủy lịch hẹn ID " + id);
            }
            return ResponseEntity.ok(Map.of("message", "Đã hủy lịch hẹn thành công (Dữ liệu vẫn được giữ lại để đối soát)"));
        }
        return ResponseEntity.status(404).body(Map.of("message", "Không tìm thấy lịch hẹn"));
    }

    // Helper: expand shift windows (gio_bat_dau → gio_ket_thuc) thành các slot 30 phút
    private List<LocalTime> expandShiftToSlots(LocalTime batDau, LocalTime ketThuc) {
        List<LocalTime> slots = new java.util.ArrayList<>();
        if (batDau == null) return slots;
        // Nếu không có gio_ket_thuc, coi ca làm việc chỉ có 1 slot 30 phút
        LocalTime end = (ketThuc != null) ? ketThuc : batDau.plusMinutes(30);
        LocalTime cur = batDau;
        while (cur.isBefore(end)) {
            slots.add(cur);
            cur = cur.plusMinutes(30);
        }
        return slots;
    }

    @GetMapping("/gio-ranh")
    public List<String> getGioRanh(
            @RequestParam(required = false) String id_nhan_vien,
            @RequestParam String ngay,
            @RequestParam(required = false) String id_dich_vu) {

        id_nhan_vien = blankToNull(id_nhan_vien);
        id_dich_vu = blankToNull(id_dich_vu);
        java.sql.Date ngaySql = java.sql.Date.valueOf(ngay);

        List<LocalTime> caTrucList = new java.util.ArrayList<>();
        List<Map<String, Object>> existingApps = new java.util.ArrayList<>();

        if (id_nhan_vien != null) {
            // Lấy ca làm việc của bác sĩ cụ thể — bao gồm gio_ket_thuc để expand đủ slot
            List<Map<String, Object>> gioBacSiMoList = jdbcTemplate.queryForList(
                    "SELECT gio_bat_dau, gio_ket_thuc FROM LichLamViecNhanVien WHERE id_nhan_vien = ? AND ngay_lam = ?",
                    id_nhan_vien, ngaySql);
            for (Map<String, Object> map : gioBacSiMoList) {
                Object bdObj = map.get("gio_bat_dau");
                Object ktObj = map.get("gio_ket_thuc");
                LocalTime batDau = null, ketThuc = null;
                if (bdObj instanceof java.sql.Time) batDau = ((java.sql.Time) bdObj).toLocalTime();
                else if (bdObj != null) batDau = LocalTime.parse(bdObj.toString());
                if (ktObj instanceof java.sql.Time) ketThuc = ((java.sql.Time) ktObj).toLocalTime();
                else if (ktObj != null) ketThuc = LocalTime.parse(ktObj.toString());
                // Expand ca làm việc thành từng slot 30 phút
                for (LocalTime slot : expandShiftToSlots(batDau, ketThuc)) {
                    if (!caTrucList.contains(slot)) caTrucList.add(slot);
                }
            }
            existingApps = jdbcTemplate.queryForList(
                    "SELECT lh.gio_kham, dv.thoi_luong_phut FROM LichHen lh LEFT JOIN DichVu dv ON lh.id_dich_vu = dv.id_dich_vu WHERE lh.id_bac_si = ? AND lh.ngay_kham = ? AND lh.trang_thai NOT IN ('Đã hủy', 'DA_HUY', 'da_huy', 'TU_CHOI', 'Hết hạn')",
                    id_nhan_vien, ngaySql);
            
            // Lọc bỏ giờ bận
            List<LocalTime[]> busyIntervals = new java.util.ArrayList<>();
            for (Map<String, Object> app : existingApps) {
                Object gkObj = app.get("gio_kham");
                if (gkObj != null) {
                    LocalTime bStart;
                    if (gkObj instanceof java.sql.Time) bStart = ((java.sql.Time) gkObj).toLocalTime();
                    else bStart = LocalTime.parse(gkObj.toString());
                    int duration = app.get("thoi_luong_phut") != null ? ((Number) app.get("thoi_luong_phut")).intValue() : 30;
                    LocalTime bEnd = bStart.plusMinutes(duration);
                    busyIntervals.add(new LocalTime[]{bStart, bEnd});
                }
            }
            caTrucList.removeIf(slot -> {
                for (LocalTime[] interval : busyIntervals) {
                    if (!slot.isBefore(interval[0]) && slot.isBefore(interval[1])) {
                        return true;
                    }
                }
                return false;
            });
        } else {
            boolean pg = DatabaseDialect.isPostgres(jdbcTemplate);
            // Lấy cả gio_ket_thuc để expand đủ slot 30 phút cho từng ca
            List<Map<String, Object>> allShifts = jdbcTemplate.queryForList(
                    "SELECT l.id_nhan_vien, l.gio_bat_dau, l.gio_ket_thuc FROM LichLamViecNhanVien l " +
                    "JOIN NhanVien nv ON l.id_nhan_vien = nv.id_nhan_vien " +
                    "WHERE l.ngay_lam = ? " +
                    "AND " + DatabaseDialect.isNotDeleted(pg, "nv.da_xoa") + " " +
                    "AND (LOWER(COALESCE(nv.chuyen_mon, '')) LIKE '%bác sĩ%' " +
                    "  OR LOWER(COALESCE(nv.chuyen_mon, '')) LIKE '%bac si%' " +
                    "  OR LOWER(COALESCE(nv.chuyen_mon, '')) LIKE '%doctor%' " +
                    "  OR EXISTS (SELECT 1 FROM TaiKhoan tk WHERE tk.id_nhan_vien = nv.id_nhan_vien " +
                    "    AND (tk.id_vai_tro IN ('VT-BS', 'VT-2', '2') OR UPPER(COALESCE(tk.id_vai_tro, '')) LIKE '%BS%')))",
                    ngaySql);

            List<Map<String, Object>> allBusy = jdbcTemplate.queryForList(
                    "SELECT lh.id_bac_si, lh.gio_kham, dv.thoi_luong_phut " +
                            "FROM LichHen lh LEFT JOIN DichVu dv ON lh.id_dich_vu = dv.id_dich_vu " +
                            "WHERE lh.ngay_kham = ? AND lh.trang_thai NOT IN ('Đã hủy', 'DA_HUY', 'da_huy', 'TU_CHOI', 'Hết hạn')",
                    ngaySql);

            Map<String, List<Map<String, Object>>> parsedBusyByDoctor = new java.util.HashMap<>();
            for (Map<String, Object> busy : allBusy) {
                String dId = String.valueOf(busy.get("id_bac_si"));
                if (dId != null && !dId.equals("null")) {
                    LocalTime bStart;
                    Object bObj = busy.get("gio_kham");
                    if (bObj instanceof java.sql.Time)
                        bStart = ((java.sql.Time) bObj).toLocalTime();
                    else
                        bStart = LocalTime.parse(bObj.toString());

                    int duration = busy.get("thoi_luong_phut") != null
                            ? ((Number) busy.get("thoi_luong_phut")).intValue()
                            : 30;
                    LocalTime bEnd = bStart.plusMinutes(duration);

                    busy.put("parsed_start", bStart);
                    busy.put("parsed_end", bEnd);

                    parsedBusyByDoctor.computeIfAbsent(dId, k -> new java.util.ArrayList<>()).add(busy);
                }
            }

            Map<String, List<LocalTime>> doctorFreeSlots = new java.util.HashMap<>();
            for (Map<String, Object> shift : allShifts) {
                String docId = String.valueOf(shift.get("id_nhan_vien"));
                Object bdObj = shift.get("gio_bat_dau");
                Object ktObj = shift.get("gio_ket_thuc");
                LocalTime batDau = null, ketThuc = null;
                if (bdObj instanceof java.sql.Time) batDau = ((java.sql.Time) bdObj).toLocalTime();
                else if (bdObj != null) batDau = LocalTime.parse(bdObj.toString());
                if (ktObj instanceof java.sql.Time) ketThuc = ((java.sql.Time) ktObj).toLocalTime();
                else if (ktObj != null) ketThuc = LocalTime.parse(ktObj.toString());

                // Expand ca làm việc thành từng slot 30 phút, lọc bỏ slot bận
                for (LocalTime slotTime : expandShiftToSlots(batDau, ketThuc)) {
                    boolean isBusy = false;
                    List<Map<String, Object>> docBusyList = parsedBusyByDoctor.get(docId);
                    if (docBusyList != null) {
                        for (Map<String, Object> busy : docBusyList) {
                            LocalTime bStart = (LocalTime) busy.get("parsed_start");
                            LocalTime bEnd = (LocalTime) busy.get("parsed_end");
                            if (!slotTime.isBefore(bStart) && slotTime.isBefore(bEnd)) {
                                isBusy = true;
                                break;
                            }
                        }
                    }
                    if (!isBusy) {
                        doctorFreeSlots.computeIfAbsent(docId, k -> new java.util.ArrayList<>()).add(slotTime);
                    }
                }
            }

            for (List<LocalTime> freeTimes : doctorFreeSlots.values()) {
                for (LocalTime t : freeTimes) {
                    if (!caTrucList.contains(t))
                        caTrucList.add(t);
                }
            }

            java.util.Collections.sort(caTrucList);

            // Neu la ngay hom nay, loai bo cac khung gio da qua
            java.time.LocalTime nowVn = java.time.LocalTime.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh"));
            if (ngaySql.toLocalDate().isEqual(java.time.LocalDate.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh")))) {
                caTrucList.removeIf(t -> !t.isAfter(nowVn));
            }

            List<String> finalGioRanh = new java.util.ArrayList<>();

            Integer thoiLuong = 30;
            if (id_dich_vu != null) {
                try {
                    thoiLuong = jdbcTemplate.queryForObject("SELECT thoi_luong_phut FROM DichVu WHERE id_dich_vu = ?",
                            Integer.class, id_dich_vu);
                } catch (Exception ignored) {
                }
            }
            int slotsNeeded = (int) Math.ceil((thoiLuong != null ? thoiLuong : 30) / 30.0);

            Map<String, java.util.Set<LocalTime>> doctorFreeSets = new java.util.HashMap<>();
            for (Map.Entry<String, List<LocalTime>> entry : doctorFreeSlots.entrySet()) {
                doctorFreeSets.put(entry.getKey(), new java.util.HashSet<>(entry.getValue()));
            }

            for (LocalTime slotStart : caTrucList) {
                boolean anyoneFree = false;
                for (Map.Entry<String, java.util.Set<LocalTime>> entry : doctorFreeSets.entrySet()) {
                    java.util.Set<LocalTime> slots = entry.getValue();
                    boolean hasAll = true;
                    for (int i = 0; i < slotsNeeded; i++) {
                        if (!slots.contains(slotStart.plusMinutes((long) i * 30))) {
                            hasAll = false;
                            break;
                        }
                    }
                    if (hasAll) {
                        anyoneFree = true;
                        break;
                    }
                }
                if (anyoneFree) {
                    finalGioRanh.add(String.format("%02d:%02d", slotStart.getHour(), slotStart.getMinute()));
                }
            }
            java.util.Collections.sort(finalGioRanh);
            return finalGioRanh;
        }

        Integer thoiLuongMoi2 = 30;
        if (id_dich_vu != null) {
            try {
                thoiLuongMoi2 = jdbcTemplate.queryForObject("SELECT thoi_luong_phut FROM DichVu WHERE id_dich_vu = ?",
                        Integer.class, id_dich_vu);
                if (thoiLuongMoi2 == null)
                    thoiLuongMoi2 = 30;
            } catch (Exception ignored) {
            }
        }

        for (Map<String, Object> app : existingApps) {
            if (!app.containsKey("parsed_start")) {
                Object existingGioObj = app.get("gio_kham");
                LocalTime existingStart;
                if (existingGioObj instanceof java.sql.Time) {
                    existingStart = ((java.sql.Time) existingGioObj).toLocalTime();
                } else {
                    String existingGioStr = existingGioObj.toString();
                    String[] eParts = existingGioStr.split(":");
                    existingStart = LocalTime.of(Integer.parseInt(eParts[0]), Integer.parseInt(eParts[1]));
                }
                Integer duration = app.get("thoi_luong_phut") != null ? ((Number) app.get("thoi_luong_phut")).intValue()
                        : 30;
                LocalTime existingEnd = existingStart.plusMinutes(duration);

                app.put("parsed_start", existingStart);
                app.put("parsed_end", existingEnd);
            }
        }

        // Neu la ngay hom nay, loai bo cac khung gio da qua
        java.time.LocalTime nowVn2 = java.time.LocalTime.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh"));
        if (ngaySql.toLocalDate().isEqual(java.time.LocalDate.now(java.time.ZoneId.of("Asia/Ho_Chi_Minh")))) {
            caTrucList.removeIf(t -> !t.isAfter(nowVn2));
        }

        List<String> gioRanh = new java.util.ArrayList<>();
        java.util.Set<LocalTime> caTrucSet = new java.util.HashSet<>(caTrucList);

        for (LocalTime slotStart : caTrucList) {
            LocalTime slotEnd = slotStart.plusMinutes(thoiLuongMoi2);

            boolean isConflict = false;
            for (Map<String, Object> app : existingApps) {
                LocalTime existingStart = (LocalTime) app.get("parsed_start");
                LocalTime existingEnd = (LocalTime) app.get("parsed_end");

                if (slotStart.isBefore(existingEnd) && slotEnd.isAfter(existingStart)) {
                    isConflict = true;
                    break;
                }
            }

            if (!isConflict) {
                int requiredSlots = (int) Math.ceil(thoiLuongMoi2 / 30.0);
                boolean hasEnoughSlots = true;
                for (int i = 0; i < requiredSlots; i++) {
                    LocalTime requiredSlot = slotStart.plusMinutes((long) i * 30);
                    if (!caTrucSet.contains(requiredSlot)) {
                        hasEnoughSlots = false;
                        break;
                    }
                }
                if (hasEnoughSlots)
                    gioRanh.add(String.format("%02d:%02d", slotStart.getHour(), slotStart.getMinute()));
            }
        }
        java.util.Collections.sort(gioRanh);
        return gioRanh;
    }

    @GetMapping("/count")
    public long countLichHen() {
        return lichHenRepository.count();
    }
}

