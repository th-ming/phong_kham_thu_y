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

@RestController
@RequestMapping("/api/lich-truc")
@CrossOrigin(origins = "${cors.allowed-origins:http://localhost:3000}")
public class LichTrucController {

        @Autowired
        private JdbcTemplate jdbcTemplate;

        @Autowired
        private com.rexi.pkty.repository.TaiKhoanRepository taiKhoanRepository;

        @GetMapping
        public List<Map<String, Object>> getAllLichTruc() {
                String sql = "SELECT l.id_lich_lam_viec, l.id_nhan_vien, nv.ho_ten, nv.chuc_vu, " +
                                "l.ngay_lam as ngay_lam_viec, l.gio_bat_dau as ca_lam_viec, l.ghi_chu " +
                                "FROM LichLamViecNhanVien l " +
                                "JOIN NhanVien nv ON l.id_nhan_vien = nv.id_nhan_vien " +
                                "WHERE l.ngay_lam >= DATEADD(month, -1, GETDATE()) " +
                                "AND l.ngay_lam <= DATEADD(month, 3, GETDATE()) " +
                                "ORDER BY l.ngay_lam DESC";
                return jdbcTemplate.queryForList(sql);
        }

        @PostMapping
        public ResponseEntity<?> addLichTruc(@RequestBody Map<String, Object> payload) {
                String ngayLamStr = (String) payload.get("ngay_lam_viec");
                LocalDate ngayLam = LocalDate.parse(ngayLamStr);
                LocalDate today = LocalDate.now();

                org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                                .getContext().getAuthentication();
                String username = (auth != null) ? auth.getName() : null;
                String roles = (auth != null) ? auth.getAuthorities().toString().toUpperCase() : "";
                boolean isAdmin = roles.contains("ADMIN") || roles.contains("QUANLY");

                LocalDate currentMonday = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
                LocalDate currentSunday = currentMonday.plusDays(6);

                if (!isAdmin && !ngayLam.isAfter(currentSunday)) {
                        return ResponseEntity.status(403).body(Map.of("message",
                                        "Báº¡n chá»‰ cÃ³ thá»ƒ Ä‘Äƒng kÃ½ lá»‹ch trá»±c cho cÃ¡c tuáº§n tiáº¿p theo. Tuáº§n hiá»‡n táº¡i chá»‰ Admin má»›i cÃ³ quyá»n Ä‘iá»u chá»‰nh."));
                }

                String targetNhanVienId = String.valueOf(payload.get("id_nhan_vien"));

                if (username == null || username.equals("anonymousUser")) {
                        return ResponseEntity.status(401).body(Map.of("message", "Token khÃ´ng há»£p lá»‡!"));
                }

                com.rexi.pkty.entity.TaiKhoan tk = taiKhoanRepository.findByTenDangNhap(username).orElse(null);
                if (!isAdmin && tk != null && tk.getId_vai_tro() != null && !tk.getId_vai_tro().equals("4")
                                && targetNhanVienId != null) {
                        List<String> allowedIds = jdbcTemplate.queryForList(
                                        "SELECT id_nhan_vien FROM NhanVien WHERE id_tai_khoan = ?", String.class,
                                        tk.getId_tai_khoan());
                        if (allowedIds.isEmpty() || !allowedIds.get(0).equals(targetNhanVienId)) {
                                return ResponseEntity.status(403).body(Map.of("message", "Báº¡n khÃ´ng thá»ƒ Ä‘Äƒng kÃ½ ca trá»±c cho nhÃ¢n viÃªn khÃ¡c!"));
                        }
                }

                String gioBatDauStr = (String) payload.get("ca_lam_viec");
                LocalTime gioBatDau = LocalTime.parse(gioBatDauStr);
                LocalTime gioKetThuc = gioBatDau.plusMinutes(30);

                String sqlCheck = "SELECT COUNT(*) FROM LichLamViecNhanVien WHERE id_nhan_vien = ? AND ngay_lam = ? AND gio_bat_dau = ?";
                Integer count = jdbcTemplate.queryForObject(sqlCheck, Integer.class, targetNhanVienId, ngayLamStr, gioBatDau);
                if (count != null && count > 0) {
                    return ResponseEntity.status(409).body(Map.of("message", "Ca trá»±c nÃ y Ä‘Ã£ Ä‘Æ°á»£c Ä‘Äƒng kÃ½ rá»“i, sáº¿p khÃ´ng cáº§n Ä‘Äƒng kÃ½ láº¡i Ä‘Ã¢u! ðŸ¾"));
                }

                String sql = "INSERT INTO LichLamViecNhanVien (id_nhan_vien, ngay_lam, gio_bat_dau, gio_ket_thuc, ghi_chu) VALUES (?, ?, ?, ?, ?)";
                jdbcTemplate.update(sql, targetNhanVienId, ngayLamStr, gioBatDau, gioKetThuc, payload.get("ghi_chu"));
                return ResponseEntity.ok(Map.of("message", "ÄÃ£ thÃªm lá»‹ch trá»±c thÃ nh cÃ´ng"));
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

                        boolean isAdmin = "admin".equalsIgnoreCase(role) || "quan-ly".equalsIgnoreCase(role);

                        if (!isAdmin && !ngayLam.isAfter(currentSunday)) {
                                return ResponseEntity.status(403).body(
                                                Map.of("message",
                                                                "Báº¡n khÃ´ng thá»ƒ xÃ³a lá»‹ch trá»±c á»Ÿ tuáº§n hiá»‡n táº¡i. Vui lÃ²ng liÃªn há»‡ Admin."));
                        }

                        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                                        .getContext().getAuthentication();
                        String username = (auth != null) ? auth.getName() : null;

                        if (username == null || username.equals("anonymousUser")) {
                                return ResponseEntity.status(401)
                                                .body(Map.of("message",
                                                                "Cáº£nh bÃ¡o báº£o máº­t: YÃªu cáº§u khÃ´ng cÃ³ Token xÃ¡c thá»±c há»£p lá»‡!"));
                        }

                        com.rexi.pkty.entity.TaiKhoan tk = taiKhoanRepository.findByTenDangNhap(username).orElse(null);
                        if (!isAdmin && tk != null && tk.getId_vai_tro() != null && !tk.getId_vai_tro().equals("4")) {
                                List<String> allowedIds = jdbcTemplate.queryForList(
                                                "SELECT id_nhan_vien FROM NhanVien WHERE id_tai_khoan = ?",
                                                String.class,
                                                tk.getId_tai_khoan());
                                if (allowedIds.isEmpty() || !allowedIds.get(0).equals(idNhanVien)) {
                                        return ResponseEntity.status(403)
                                                        .body(Map.of("message",
                                                                        "Cáº£nh bÃ¡o báº£o máº­t: Báº¡n khÃ´ng thá»ƒ há»§y ca trá»±c cá»§a nhÃ¢n viÃªn khÃ¡c!"));
                                }
                        }

                        String[] parts = timeStr.split(":");
                        LocalTime shiftStart = LocalTime.of(Integer.parseInt(parts[0]), Integer.parseInt(parts[1]));
                        LocalTime shiftEnd = shiftStart.plusMinutes(30);

                        List<Map<String, Object>> existingApps = jdbcTemplate.queryForList(
                                        "SELECT lh.gio_kham, dv.thoi_luong_phut FROM LichHen lh JOIN DichVu dv ON lh.id_dich_vu = dv.id_dich_vu WHERE lh.id_bac_si = ? AND lh.ngay_kham = ? AND lh.trang_thai NOT IN (N'ÄÃ£ há»§y', 'da_huy')",
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
                                                "KhÃ´ng thá»ƒ há»§y ca! Khung giá» nÃ y Ä‘ang náº±m trong khoáº£ng thá»i gian diá»…n ra dá»‹ch vá»¥ cá»§a má»™t khÃ¡ch hÃ ng Ä‘Ã£ Ä‘áº·t trÆ°á»›c. Vui lÃ²ng liÃªn há»‡ khÃ¡ch hÃ ng."));
                        }
                }

                try {
                        String sql = "DELETE FROM LichLamViecNhanVien WHERE id_lich_lam_viec = ?";
                        jdbcTemplate.update(sql, id);
                        return ResponseEntity.ok(Map.of("message", "ÄÃ£ xÃ³a lá»‹ch trá»±c"));
                } catch (Exception e) {
                        return ResponseEntity.status(500)
                                        .body(Map.of("message", "Lá»—i xÃ³a lá»‹ch trá»±c: " + e.getMessage()));
                }
        }
}
