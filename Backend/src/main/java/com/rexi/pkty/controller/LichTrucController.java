package com.rexi.pkty.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.time.LocalTime;

import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.time.DayOfWeek;
import org.springframework.http.ResponseEntity;
import com.rexi.pkty.util.DatabaseDialect;

@RestController
@RequestMapping("/api/lich-truc")
@CrossOrigin(origins = "${cors.allowed-origins:http://localhost:3000}")
public class LichTrucController {

        @Autowired
        private JdbcTemplate jdbcTemplate;

        @Autowired
        private com.rexi.pkty.repository.TaiKhoanRepository taiKhoanRepository;

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
                DayOfWeek day = now.getDayOfWeek();
                if (day == DayOfWeek.SUNDAY) return false;
                if (day == DayOfWeek.SATURDAY) return now.toLocalTime().isBefore(LocalTime.NOON);
                return true;
        }

        private boolean isNextWeekDate(LocalDate targetDate) {
                LocalDate today = LocalDate.now();
                LocalDate currentMonday = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                LocalDate nextWeekMonday = currentMonday.plusWeeks(1);
                LocalDate nextWeekSunday = nextWeekMonday.plusDays(6);
                return !targetDate.isBefore(nextWeekMonday) && !targetDate.isAfter(nextWeekSunday);
        }

        @GetMapping
        public List<Map<String, Object>> getAllLichTruc() {
                String sql = "SELECT l.id_lich_lam_viec, l.id_nhan_vien, nv.ho_ten, nv.chuyen_mon as chuc_vu, " +
                                "l.ngay_lam as ngay_lam_viec, l.gio_bat_dau as ca_lam_viec, l.ghi_chu " +
                                "FROM LichLamViecNhanVien l " +
                                "JOIN NhanVien nv ON l.id_nhan_vien = nv.id_nhan_vien " +
                                "WHERE l.ngay_lam >= ? " +
                                "AND l.ngay_lam <= ? " +
                                "ORDER BY l.ngay_lam DESC";
                LocalDate today = LocalDate.now();
                return jdbcTemplate.queryForList(sql, java.sql.Date.valueOf(today.minusMonths(1)), java.sql.Date.valueOf(today.plusMonths(3)));
        }

        @PostMapping
        public ResponseEntity<?> addLichTruc(@RequestBody Map<String, Object> payload) {
                String ngayLamStr = (String) payload.get("ngay_lam_viec");
                LocalDate ngayLam = LocalDate.parse(ngayLamStr);
                LocalDate today = LocalDate.now();

                org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                                .getContext().getAuthentication();
                String username = (auth != null) ? auth.getName() : null;
                com.rexi.pkty.entity.TaiKhoan tk = username == null || username.equals("anonymousUser")
                                ? null
                                : taiKhoanRepository.findByTenDangNhap(username).orElse(null);
                boolean isAdmin = canManageAnySchedule(auth, tk);

                LocalDate currentMonday = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                LocalDate currentSunday = currentMonday.plusDays(6);

                if (!isAdmin && !canEmployeeManageScheduleNow() && isNextWeekDate(ngayLam)) {
                        return ResponseEntity.status(403).body(Map.of("message",
                                        "Nhân viên không thể đăng ký/chỉnh lịch tuần tới từ 12:00 Thứ 7 đến hết Chủ nhật. Tuần sau nữa vẫn đăng ký được."));
                }

                String targetNhanVienId = String.valueOf(payload.get("id_nhan_vien"));

                if (username == null || username.equals("anonymousUser")) {
                        return ResponseEntity.status(401).body(Map.of("message", "Token không hợp lệ!"));
                }

                if (!isAdmin && tk != null && tk.getId_vai_tro() != null && !tk.getId_vai_tro().equals("4")
                                && targetNhanVienId != null) {
                        List<String> allowedIds = jdbcTemplate.queryForList(
                                        "SELECT id_nhan_vien FROM NhanVien WHERE id_tai_khoan = ?", String.class,
                                        tk.getId_tai_khoan());
                        if (allowedIds.isEmpty() || !allowedIds.get(0).equals(targetNhanVienId)) {
                                return ResponseEntity.status(403).body(Map.of("message", "Bạn không thể đăng ký ca trực cho nhân viên khác!"));
                        }
                }

                String gioBatDauStr = (String) payload.get("ca_lam_viec");
                LocalTime gioBatDau = LocalTime.parse(gioBatDauStr);
                LocalTime gioKetThuc = gioBatDau.plusMinutes(30);

                boolean pg = DatabaseDialect.isPostgres(jdbcTemplate);
                Integer activeStaffCount = jdbcTemplate.queryForObject(
                                "SELECT COUNT(*) FROM NhanVien nv " +
                                                "JOIN TaiKhoan tk ON tk.id_nhan_vien = nv.id_nhan_vien " +
                                                "WHERE nv.id_nhan_vien = ? " +
                                                "AND " + DatabaseDialect.isNotDeleted(pg, "nv.da_xoa") + " " +
                                                "AND LOWER(COALESCE(tk.trang_thai, '')) IN ('active', 'hoạt động', 'đang làm việc')",
                                Integer.class, targetNhanVienId);
                if (activeStaffCount == null || activeStaffCount == 0) {
                        return ResponseEntity.status(409).body(Map.of("message",
                                        "Không thể đăng ký lịch trực cho nhân viên đã khóa hoặc đã xóa mềm."));
                }

                String sqlCheck = "SELECT COUNT(*) FROM LichLamViecNhanVien WHERE id_nhan_vien = ? AND ngay_lam = ? AND CAST(gio_bat_dau AS time) = CAST(? AS time)";
                Integer count = jdbcTemplate.queryForObject(sqlCheck, Integer.class, targetNhanVienId, ngayLamStr, gioBatDauStr);
                if (count != null && count > 0) {
                    return ResponseEntity.status(409).body(Map.of("message", "Ca trực này đã được đăng ký rồi, sếp không cần đăng ký lại đâu! 🐾"));
                }

                // Check neu nv la bac si
                String roleCheckSql = "SELECT COUNT(*) FROM NhanVien WHERE id_nhan_vien = ? " +
                                      "AND (LOWER(COALESCE(chuyen_mon, '')) LIKE '%bác sĩ%' OR LOWER(COALESCE(chuyen_mon, '')) LIKE '%doctor%')";
                Integer isDoctor = jdbcTemplate.queryForObject(roleCheckSql, Integer.class, targetNhanVienId);
                
                if (isDoctor != null && isDoctor > 0) {
                    // Đếm số BS trực cùng giờ cùng ngày
                    String countSql = "SELECT COUNT(DISTINCT l.id_nhan_vien) FROM LichLamViecNhanVien l " +
                                      "JOIN NhanVien n ON l.id_nhan_vien = n.id_nhan_vien " +
                        "WHERE l.ngay_lam = ? AND CAST(l.gio_bat_dau AS time) = CAST(? AS time) " +
                                      "AND (LOWER(COALESCE(n.chuyen_mon, '')) LIKE '%bác sĩ%' OR LOWER(COALESCE(n.chuyen_mon, '')) LIKE '%doctor%')";
                    Integer doctorCount = jdbcTemplate.queryForObject(countSql, Integer.class, ngayLamStr, gioBatDauStr);
                    
                    if (doctorCount != null && doctorCount >= 3) {
                        return ResponseEntity.status(409)
                                .body(Map.of("message", "Đã có tối đa 3 bác sĩ trực trong khung giờ " + 
                                             gioBatDauStr + " ngày " + ngayLamStr + " rồi sếp ơi! 🐾"));
                    }
                }

                String sql = "INSERT INTO LichLamViecNhanVien (id_nhan_vien, ngay_lam, gio_bat_dau, gio_ket_thuc, ghi_chu) VALUES (?, ?, ?, ?, ?)";
                jdbcTemplate.update(sql, targetNhanVienId, ngayLamStr, gioBatDauStr, gioKetThuc.toString(), payload.get("ghi_chu"));
                return ResponseEntity.ok(Map.of("message", "Đã thêm lịch trực thành công"));
        }

        @DeleteMapping("/{id}")
        public ResponseEntity<?> deleteLichTruc(@PathVariable String id,
                        @RequestHeader(value = "Role", required = false) String role) {
                String checkSql = "SELECT id_nhan_vien, ngay_lam, gio_bat_dau FROM LichLamViecNhanVien WHERE id_lich_lam_viec = ?";
                List<Map<String, Object>> results = jdbcTemplate.queryForList(checkSql, id);

                if (!results.isEmpty()) {
                        LocalDate ngayLam = ((java.sql.Date) results.get(0).get("ngay_lam")).toLocalDate();
                        java.sql.Date sqlDate = (java.sql.Date) results.get(0).get("ngay_lam");
                        String idNhanVien = String.valueOf(results.get(0).get("id_nhan_vien"));
                        String timeStr = results.get(0).get("gio_bat_dau").toString();

                        LocalDate today = LocalDate.now();
                        LocalDate currentMonday = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                        LocalDate currentSunday = currentMonday.plusDays(6);

                        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                                        .getContext().getAuthentication();
                        String username = (auth != null) ? auth.getName() : null;
                        com.rexi.pkty.entity.TaiKhoan tk = username == null || username.equals("anonymousUser")
                                        ? null
                                        : taiKhoanRepository.findByTenDangNhap(username).orElse(null);
                        boolean isAdmin = canManageAnySchedule(auth, tk);

                        if (!isAdmin && !canEmployeeManageScheduleNow() && isNextWeekDate(ngayLam)) {
                                return ResponseEntity.status(403).body(
                                                Map.of("message",
                                                                "Nhân viên không thể đăng ký/chỉnh lịch tuần tới từ 12:00 Thứ 7 đến hết Chủ nhật. Tuần sau nữa vẫn đăng ký được."));
                        }

                        if (username == null || username.equals("anonymousUser")) {
                                return ResponseEntity.status(401)
                                                .body(Map.of("message", "Token ko hop le"));
                        }

                        if (!isAdmin && tk != null && tk.getId_vai_tro() != null && !tk.getId_vai_tro().equals("4")) {
                                List<String> allowedIds = jdbcTemplate.queryForList(
                                                "SELECT id_nhan_vien FROM NhanVien WHERE id_tai_khoan = ?",
                                                String.class,
                                                tk.getId_tai_khoan());
                                if (allowedIds.isEmpty() || !allowedIds.get(0).equals(idNhanVien)) {
                                        return ResponseEntity.status(403)
                                                        .body(Map.of("message", "Ko the huy ca truc nv khac"));
                                }
                        }

                        String[] parts = timeStr.split(":");
                        LocalTime shiftStart = LocalTime.of(Integer.parseInt(parts[0]), Integer.parseInt(parts[1]));
                        LocalTime shiftEnd = shiftStart.plusMinutes(30);

                        List<Map<String, Object>> existingApps = jdbcTemplate.queryForList(
                                        "SELECT lh.gio_kham, dv.thoi_luong_phut FROM LichHen lh LEFT JOIN DichVu dv ON lh.id_dich_vu = dv.id_dich_vu WHERE lh.id_bac_si = ? AND lh.ngay_kham = ? AND lh.trang_thai NOT IN ('Đã hủy', 'DA_HUY', 'da_huy', 'TU_CHOI', 'Hết hạn')",
                                        idNhanVien, sqlDate);

                        boolean isConflict = false;
                        for (Map<String, Object> app : existingApps) {
                                String appGioStr = app.get("gio_kham").toString();
                                String[] appParts = appGioStr.split(":");
                                LocalTime appStart = LocalTime.of(Integer.parseInt(appParts[0]),
                                                 Integer.parseInt(appParts[1]));
                                Integer duration = app.get("thoi_luong_phut") != null
                                                ? ((Number) app.get("thoi_luong_phut")).intValue()
                                                : 30;
                                LocalTime appEnd = appStart.plusMinutes(duration);

                                if (shiftStart.isBefore(appEnd) && shiftEnd.isAfter(appStart)) {
                                        isConflict = true;
                                        break;
                                }
                        }

                        if (isConflict) {
                                return ResponseEntity.status(409).body(Map.of("message",
                                                "Không thể hủy ca! Khung giờ này đang nằm trong khoảng thời gian diễn ra dịch vụ của một khách hàng đã đặt trước. Vui lòng liên hệ khách hàng."));
                        }
                }

                try {
                        String sql = "DELETE FROM LichLamViecNhanVien WHERE id_lich_lam_viec = ?";
                        jdbcTemplate.update(sql, id);
                        return ResponseEntity.ok(Map.of("message", "Đã xóa lịch trực"));
                } catch (Exception e) {
                        return ResponseEntity.status(500)
                                        .body(Map.of("message", "Lỗi xóa lịch trực: " + e.getMessage()));
                }
        }
}


