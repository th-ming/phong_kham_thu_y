package com.rexi.pkty.controller;

import com.rexi.pkty.entity.LichHen;
import com.rexi.pkty.repository.LichHenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import org.springframework.http.ResponseEntity;
import java.time.LocalTime;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/lich-hen")
@CrossOrigin(origins = "${cors.allowed-origins:http://localhost:3000,http://localhost:5173}")
public class LichHenController {

    @Autowired
    private LichHenRepository lichHenRepository;

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

    @PostMapping
    @Transactional
    public ResponseEntity<?> createLichHen(@RequestBody LichHen lichHen) {
        try {
            lichHen.setId_lich_hen(null);

            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                    .getContext().getAuthentication();
            String username = (auth != null) ? auth.getName() : null;

            if (username != null && !username.equals("anonymousUser")) {
                taiKhoanRepository.findByTenDangNhap(username).ifPresent(tk -> {
                    // Nếu là khách hàng, tự động điền id_khach_hang nếu thiếu, hoặc kiểm tra quyền
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
                        "Tài khoản nội bộ (Admin/Nhân viên) vui lòng chọn khách hàng để đặt lịch. Nếu sếp là khách hàng, vui lòng dùng tài khoản Khách hàng!");
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
            LocalTime newEnd = newStart.plusMinutes(thoiLuongMoi);

            if (lichHen.getId_bac_si() == null || lichHen.getId_bac_si().isEmpty() || lichHen.getId_bac_si().equals("0")) {
                String findDocQuery = "SELECT TOP 1 l.id_nhan_vien FROM LichLamViecNhanVien l " +
                        "WHERE l.ngay_lam = ? AND l.gio_bat_dau = ? " +
                        "AND NOT EXISTS (SELECT 1 FROM LichHen h " +
                        "  LEFT JOIN DichVu d ON h.id_dich_vu = d.id_dich_vu " +
                        "  WHERE h.id_bac_si = l.id_nhan_vien AND h.ngay_kham = l.ngay_lam " +
                        "  AND h.gio_kham < ? AND DATEADD(minute, ISNULL(d.thoi_luong_phut, 30), h.gio_kham) > ? " +
                        "  AND h.trang_thai NOT IN (N'Đã hủy', 'DA_HUY', 'da_huy', 'TU_CHOI', N'Hết hạn')" +
                        ")";
                try {
                    String autoDocId = jdbcTemplate.queryForObject(findDocQuery, String.class,
                            lichHen.getNgay_kham(), newStart, newEnd, newStart);
                    lichHen.setId_bac_si(autoDocId);
                } catch (Exception e) {
                    throw new RuntimeException(
                            "Rất tiếc! Không còn bác sĩ nào rảnh vào khung giờ này sếp ơi. Sếp chọn giờ khác nhé! 🐾");
                }
            }

            int requiredSlots = (int) Math.ceil(thoiLuongMoi / 30.0);
            List<Map<String, Object>> gioBacSiMoList = jdbcTemplate.queryForList(
                    "SELECT gio_bat_dau FROM LichLamViecNhanVien WHERE id_nhan_vien = ? AND ngay_lam = ?",
                    lichHen.getId_bac_si(), lichHen.getNgay_kham());

            List<LocalTime> caTrucList = new java.util.ArrayList<>();
            for (Map<String, Object> map : gioBacSiMoList) {
                Object obj = map.get("gio_bat_dau");
                if (obj instanceof java.sql.Time) {
                    caTrucList.add(((java.sql.Time) obj).toLocalTime());
                } else if (obj != null) {
                    String[] p = obj.toString().split(":");
                    caTrucList.add(LocalTime.of(Integer.parseInt(p[0]), Integer.parseInt(p[1])));
                }
            }

            for (int i = 0; i < requiredSlots; i++) {
                LocalTime requiredSlot = newStart.plusMinutes((long) i * 30);
                if (!caTrucList.contains(requiredSlot)) {
                    throw new RuntimeException("Dịch vụ này cần " + thoiLuongMoi
                            + " phút nhưng bác sĩ chưa mở đủ ca trực liên tiếp. Vui lòng chọn giờ sớm hơn hoặc khung giờ khác!");
                }
            }

            boolean isConflict = false;
            List<Map<String, Object>> existingApps = jdbcTemplate.queryForList(
                    "SELECT lh.gio_kham, dv.thoi_luong_phut FROM LichHen lh LEFT JOIN DichVu dv ON lh.id_dich_vu = dv.id_dich_vu WHERE lh.id_bac_si = ? AND lh.ngay_kham = ? AND lh.trang_thai NOT IN (N'Đã hủy', 'DA_HUY', 'da_huy', 'TU_CHOI', N'Hết hạn')",
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

            if (lichHen.getLy_do() != null)
                lichHen.setLy_do(org.springframework.web.util.HtmlUtils.htmlEscape(lichHen.getLy_do()));
            if (lichHen.getGhi_chu_noi_bo() != null)
                lichHen.setGhi_chu_noi_bo(org.springframework.web.util.HtmlUtils.htmlEscape(lichHen.getGhi_chu_noi_bo()));

            if (lichHen.getNgay_tao() == null) {
                lichHen.setNgay_tao(LocalDateTime.now());
            }

            boolean isInternal = auth != null && auth.getAuthorities() != null &&
                    (auth.getAuthorities().toString().toUpperCase().contains("ADMIN") ||
                            auth.getAuthorities().toString().toUpperCase().contains("QUAN_LY") ||
                            auth.getAuthorities().toString().toUpperCase().contains("BAC_SI") ||
                            auth.getAuthorities().toString().toUpperCase().contains("STAFF"));

            if (!isInternal || lichHen.getTrang_thai() == null || lichHen.getTrang_thai().isEmpty()) {
                lichHen.setTrang_thai("CHO_XAC_NHAN");
            }

            LichHen saved = lichHenRepository.save(lichHen);

            if (isInternal) {
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
                    System.err.println("Lỗi gửi email confirmation: " + e.getMessage());
                }
            }
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", e.getMessage()));
        }
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

            String sdt = kh.get("sdt");
            String email = kh.get("email");

            List<Map<String, Object>> existingKh = jdbcTemplate
                    .queryForList("SELECT id_khach_hang FROM KhachHang WHERE sdt = ?", sdt);
            String idKhachHang;

            if (existingKh.isEmpty()) {
                String idTaiKhoan = "TK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
                String generatedPass = UUID.randomUUID().toString().substring(0, 6);

                jdbcTemplate.update(
                        "INSERT INTO TaiKhoan (id_tai_khoan, ten_dang_nhap, mat_khau, mat_khau_hash, id_vai_tro, trang_thai, ngay_tao) VALUES (?, ?, ?, ?, 'VT-5', N'Hoạt động', GETDATE())",
                        idTaiKhoan, (email != null && !email.isEmpty() ? email : sdt + "@rexi.vn"), "[ENCRYPTED]", passwordEncoder.encode(generatedPass));

                if (email != null && !email.isEmpty()) {
                    emailService.sendPasswordEmail(email, kh.get("ten_khach_hang"), generatedPass);
                }

                idKhachHang = "KH-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
                jdbcTemplate.update(
                        "INSERT INTO KhachHang (id_khach_hang, ten_khach_hang, sdt, email, ngay_tao, da_xoa) VALUES (?, ?, ?, ?, GETDATE(), 0)",
                        idKhachHang, kh.get("ten_khach_hang"), sdt, (email != null && !email.isEmpty() ? email : sdt + "@rexi.vn"));
            } else {
                idKhachHang = existingKh.get(0).get("id_khach_hang").toString();
            }

            String idThuCung = "TC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            jdbcTemplate.update(
                    "INSERT INTO ThuCung (id_thu_cung, id_khach_hang, ten_thu_cung, loai, giong) VALUES (?, ?, ?, N'Chưa xác định', N'Chưa xác định')",
                    idThuCung, idKhachHang, tc.get("ten_thu_cung"));

            LichHen lichHen = new LichHen();
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

            LichHen saved = lichHenRepository.save(lichHen);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi đặt lịch nhanh: " + e.getMessage()));
        }
    }

    @GetMapping
    public List<Map<String, Object>> getAll() {
        return jdbcTemplate.queryForList(
                "SELECT lh.*, kh.ten_khach_hang, kh.sdt, tc.ten_thu_cung, nv.ho_ten as ten_bac_si, dv.ten_dich_vu " +
                        "FROM LichHen lh " +
                        "LEFT JOIN KhachHang kh ON lh.id_khach_hang = kh.id_khach_hang " +
                        "LEFT JOIN ThuCung tc ON lh.id_thu_cung = tc.id_thu_cung " +
                        "LEFT JOIN NhanVien nv ON lh.id_bac_si = nv.id_nhan_vien " +
                        "LEFT JOIN DichVu dv ON lh.id_dich_vu = dv.id_dich_vu " +
                        "ORDER BY lh.ngay_kham DESC, lh.gio_kham DESC");
    }

    @GetMapping("/hom-nay")
    public List<Map<String, Object>> getTodayAppointments() {
        return jdbcTemplate.queryForList(
                "SELECT lh.*, kh.ten_khach_hang, kh.sdt, tc.ten_thu_cung, nv.ho_ten as ten_bac_si, dv.ten_dich_vu " +
                        "FROM LichHen lh " +
                        "LEFT JOIN KhachHang kh ON lh.id_khach_hang = kh.id_khach_hang " +
                        "LEFT JOIN ThuCung tc ON lh.id_thu_cung = tc.id_thu_cung " +
                        "LEFT JOIN NhanVien nv ON lh.id_bac_si = nv.id_nhan_vien " +
                        "LEFT JOIN DichVu dv ON lh.id_dich_vu = dv.id_dich_vu " +
                        "WHERE CAST(lh.ngay_kham AS DATE) = CAST(GETDATE() AS DATE) " +
                        "ORDER BY lh.gio_kham ASC");
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
            Integer total = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM LichHen lh " + where, Integer.class, params.toArray());
            int totalPages = (int) Math.ceil((double) (total != null ? total : 0) / size);

            java.util.List<Object> dataParams = new java.util.ArrayList<>(params);
            
            String sql;
            if (size > 500) {
                sql = "SELECT lh.*, tc.ten_thu_cung, nv.ho_ten as ten_bac_si, dv.ten_dich_vu " +
                      "FROM LichHen lh " +
                      "LEFT JOIN ThuCung tc ON lh.id_thu_cung = tc.id_thu_cung " +
                      "LEFT JOIN NhanVien nv ON lh.id_bac_si = nv.id_nhan_vien " +
                      "LEFT JOIN DichVu dv ON lh.id_dich_vu = dv.id_dich_vu " +
                      where + " ORDER BY lh.ngay_tao DESC";
            } else {
                dataParams.add(page * size);
                dataParams.add(size);
                sql = "SELECT lh.*, tc.ten_thu_cung, nv.ho_ten as ten_bac_si, dv.ten_dich_vu " +
                      "FROM LichHen lh " +
                      "LEFT JOIN ThuCung tc ON lh.id_thu_cung = tc.id_thu_cung " +
                      "LEFT JOIN NhanVien nv ON lh.id_bac_si = nv.id_nhan_vien " +
                      "LEFT JOIN DichVu dv ON lh.id_dich_vu = dv.id_dich_vu " +
                      where + " ORDER BY lh.ngay_tao DESC " +
                      "OFFSET CAST(? AS INT) ROWS FETCH NEXT CAST(? AS INT) ROWS ONLY";
            }
            
            List<Map<String, Object>> content = jdbcTemplate.queryForList(sql, dataParams.toArray());

            return ResponseEntity.ok(Map.of(
                    "content", content,
                    "totalPages", totalPages,
                    "totalElements", total != null ? total : 0,
                    "currentPage", page
            ));
        } catch (Exception e) {
            e.printStackTrace();
            System.err.println("Lỗi lấy lịch hẹn cho khách " + idKhachHang + ": " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                    "message", "Lỗi server khi lấy lịch hẹn: " + e.getMessage(),
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
            lh.setTrang_thai(status.toUpperCase());
            if (body.containsKey("ghi_chu_noi_bo") && !isCustomer) {
                lh.setGhi_chu_noi_bo(org.springframework.web.util.HtmlUtils.htmlEscape(body.get("ghi_chu_noi_bo")));
            }
        }

        LichHen saved = lichHenRepository.save(lh);
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
                                .body(Map.of("message", "Cảnh báo bảo mật: Bạn không có quyền xóa lịch hẹn này!"));
                    }
                }
            }
            lichHenRepository.deleteById(id);

            if (!isCustomer) {
                auditLogService.logAction("XÓA", "LichHen", "Xóa lịch hẹn ID " + id);
            }
            return ResponseEntity.ok(Map.of("message", "Xóa lịch hẹn thành công"));
        }
        return ResponseEntity.status(404).body(Map.of("message", "Không tìm thấy lịch hẹn"));
    }

    @GetMapping("/gio-ranh")
    public List<String> getGioRanh(
            @RequestParam(required = false) String id_nhan_vien,
            @RequestParam String ngay,
            @RequestParam(required = false) String id_dich_vu) {

        List<LocalTime> caTrucList = new java.util.ArrayList<>();
        List<Map<String, Object>> existingApps = new java.util.ArrayList<>();

        if (id_nhan_vien != null) {
            List<Map<String, Object>> gioBacSiMoList = jdbcTemplate.queryForList(
                    "SELECT gio_bat_dau FROM LichLamViecNhanVien WHERE id_nhan_vien = ? AND ngay_lam = ?",
                    id_nhan_vien, ngay);
            for (Map<String, Object> map : gioBacSiMoList) {
                Object obj = map.get("gio_bat_dau");
                if (obj instanceof java.sql.Time)
                    caTrucList.add(((java.sql.Time) obj).toLocalTime());
                else if (obj != null)
                    caTrucList.add(LocalTime.parse(obj.toString()));
            }
            existingApps = jdbcTemplate.queryForList(
                    "SELECT lh.gio_kham, dv.thoi_luong_phut FROM LichHen lh LEFT JOIN DichVu dv ON lh.id_dich_vu = dv.id_dich_vu WHERE lh.id_bac_si = ? AND lh.ngay_kham = ? AND lh.trang_thai NOT IN (N'Đã hủy', 'DA_HUY', 'da_huy', 'TU_CHOI', N'Hết hạn')",
                    id_nhan_vien, ngay);
        } else {
            List<Map<String, Object>> allShifts = jdbcTemplate.queryForList(
                    "SELECT id_nhan_vien, gio_bat_dau FROM LichLamViecNhanVien WHERE ngay_lam = ?", ngay);

            List<Map<String, Object>> allBusy = jdbcTemplate.queryForList(
                    "SELECT lh.id_bac_si, lh.gio_kham, dv.thoi_luong_phut " +
                            "FROM LichHen lh LEFT JOIN DichVu dv ON lh.id_dich_vu = dv.id_dich_vu " +
                            "WHERE lh.ngay_kham = ? AND lh.trang_thai NOT IN (N'Đã hủy', 'DA_HUY', 'da_huy', 'TU_CHOI', N'Hết hạn')",
                    ngay);

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
                LocalTime time = null;
                Object obj = shift.get("gio_bat_dau");
                if (obj instanceof java.sql.Time)
                    time = ((java.sql.Time) obj).toLocalTime();
                else if (obj != null)
                    time = LocalTime.parse(obj.toString());

                if (time != null) {
                    boolean isBusy = false;
                    List<Map<String, Object>> docBusyList = parsedBusyByDoctor.get(docId);
                    if (docBusyList != null) {
                        for (Map<String, Object> busy : docBusyList) {
                            LocalTime bStart = (LocalTime) busy.get("parsed_start");
                            LocalTime bEnd = (LocalTime) busy.get("parsed_end");

                            if (!time.isBefore(bStart) && time.isBefore(bEnd)) {
                                isBusy = true;
                                break;
                            }
                        }
                    }
                    if (!isBusy) {
                        doctorFreeSlots.computeIfAbsent(docId, k -> new java.util.ArrayList<>()).add(time);
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

