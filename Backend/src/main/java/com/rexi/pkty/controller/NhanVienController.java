package com.rexi.pkty.controller;

import com.rexi.pkty.entity.LichLamViecNhanVien;
import com.rexi.pkty.entity.NhanVien;
import com.rexi.pkty.repository.LichLamViecNhanVienRepository;
import com.rexi.pkty.repository.NhanVienRepository;
import com.rexi.pkty.repository.TaiKhoanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.jdbc.core.JdbcTemplate;
import com.rexi.pkty.service.AuditLogService;
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

    @Autowired
    private LichLamViecNhanVienRepository lichLamViecRepository;

    @Autowired
    private TaiKhoanRepository taiKhoanRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private AuditLogService auditLogService;

    @GetMapping("/nhan-vien")
    public List<NhanVien> getAllNhanVien() {
        return nhanVienRepository.findAll();
    }

    @GetMapping("/bac-si")
    @org.springframework.cache.annotation.Cacheable(value = "bacSiCache", key = "#ngay != null ? #ngay : 'all'")
    public List<?> getBacSi(@RequestParam(required = false) String ngay) {
        try {
            if (ngay != null && !ngay.trim().isEmpty()) {
                String sql = "SELECT DISTINCT nv.id_nhan_vien, nv.ho_ten, nv.chuyen_mon, nv.sdt, nv.email, nv.dia_chi, nv.luong " +
                             "FROM NhanVien nv " +
                             "JOIN LichLamViecNhanVien l ON nv.id_nhan_vien = l.id_nhan_vien " +
                             "WHERE nv.id_nhan_vien IN (SELECT id_nhan_vien FROM TaiKhoan WHERE id_vai_tro = 'VT-BS') " +
                             "AND nv.da_xoa = 0 AND l.ngay_lam = ? " +
                             "ORDER BY nv.ho_ten ASC";
                return jdbcTemplate.queryForList(sql, ngay);
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
    @org.springframework.cache.annotation.CacheEvict(value = "bacSiCache", allEntries = true)
    public org.springframework.http.ResponseEntity<?> addLichLamViec(@RequestBody LichLamViecNhanVien lich,
            @RequestHeader(value = "Role", required = false) String roleHeader) {
        try {
            // BẢO MẬT 1: Lấy thông tin user hiện tại
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            String username = (auth != null) ? auth.getName() : null;
            if (username == null || username.equals("anonymousUser")) {
                return org.springframework.http.ResponseEntity.status(401).body(Map.of("message", "Token không hợp lệ!"));
            }

            boolean isAdmin = roleHeader != null && (roleHeader.toLowerCase().contains("admin") || roleHeader.toLowerCase().contains("quan_ly"));
            
            // BẢO MẬT 2: Phân quyền - Nhân viên chỉ được đăng ký ca trực cho bản thân
            com.rexi.pkty.entity.TaiKhoan tk = taiKhoanRepository.findByTenDangNhap(username).orElse(null);
            if (!isAdmin && tk != null) {
                String currentNhanVienId = null;
                try {
                    java.util.List<String> allowedIds = jdbcTemplate.queryForList(
                            "SELECT id_nhan_vien FROM NhanVien WHERE id_tai_khoan = ?", String.class, tk.getId_tai_khoan());
                    if (!allowedIds.isEmpty()) currentNhanVienId = allowedIds.get(0);
                } catch (Exception ignored) {}

                if (currentNhanVienId == null || !currentNhanVienId.equals(lich.getId_nhan_vien())) {
                    return org.springframework.http.ResponseEntity.status(403).body(Map.of("message", "Cảnh báo bảo mật: Bạn không thể đăng ký ca trực cho nhân viên khác!"));
                }
            }

            // BẢO MẬT 3: Ràng buộc "Tuần hiện tại" - Chỉ Admin mới được can thiệp tuần hiện tại
            java.time.LocalDate today = java.time.LocalDate.now();
            java.time.LocalDate currentMonday = today.with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
            java.time.LocalDate currentSunday = currentMonday.plusDays(6);

            if (!isAdmin && !lich.getNgay_lam().isAfter(currentSunday)) {
                return org.springframework.http.ResponseEntity.status(403).body(Map.of("message", "Bạn chỉ có thể đăng ký lịch trực cho các tuần tiếp theo. Tuần hiện tại chỉ Admin/Quản lý mới có quyền điều chỉnh."));
            }

            // 1. Kiểm tra xem ca trực này đã được chính nhân sự này đăng ký hay chưa
            String checkDupSql = "SELECT COUNT(*) FROM LichLamViecNhanVien WHERE id_nhan_vien = ? AND ngay_lam = ? AND gio_bat_dau = ?";
            Integer dupCount = jdbcTemplate.queryForObject(checkDupSql, Integer.class, lich.getId_nhan_vien(), lich.getNgay_lam(), lich.getGio_bat_dau());
            if (dupCount != null && dupCount > 0) {
                return org.springframework.http.ResponseEntity.status(409)
                        .body(Map.of("message", "Nhân viên này đã được đăng ký ca trực vào khung giờ " + 
                                     lich.getGio_bat_dau() + " ngày " + lich.getNgay_lam() + " rồi sếp ơi! 🐾"));
            }

            // 2. Lấy vai trò của nhân viên đang đăng ký để tính giới hạn riêng
            String getRoleSql = "SELECT TOP 1 id_vai_tro FROM TaiKhoan WHERE id_nhan_vien = ?";
            String roleId = null;
            try {
                roleId = jdbcTemplate.queryForObject(getRoleSql, String.class, lich.getId_nhan_vien());
            } catch (Exception ignored) {}

            // Nếu không tìm thấy vai trò trong tài khoản, tự động phán đoán qua tiền tố mã nhân viên
            if (roleId == null && lich.getId_nhan_vien() != null) {
                String id = lich.getId_nhan_vien();
                if (id.startsWith("BS")) roleId = "VT-BS";
                else if (id.startsWith("YT")) roleId = "VT-YT";
                else if (id.startsWith("TT")) roleId = "VT-TT";
                else if (id.startsWith("KT")) roleId = "VT-KT";
                else if (id.startsWith("QL")) roleId = "VT-QL";
            }

            if (roleId != null) {
                // 3. Đếm số nhân sự cùng vai trò đã đăng ký trực trong cùng ngày và giờ bắt đầu
                String countRoleSql = "SELECT COUNT(DISTINCT l.id_nhan_vien) FROM LichLamViecNhanVien l " +
                                      "JOIN TaiKhoan t ON l.id_nhan_vien = t.id_nhan_vien " +
                                      "WHERE l.ngay_lam = ? AND l.gio_bat_dau = ? AND t.id_vai_tro = ?";
                Integer roleCount = jdbcTemplate.queryForObject(countRoleSql, Integer.class, lich.getNgay_lam(), lich.getGio_bat_dau(), roleId);
                
                int limit = "VT-BS".equals(roleId) ? 4 : 2;
                String roleName = "VT-BS".equals(roleId) ? "bác sĩ" : 
                                  "VT-YT".equals(roleId) ? "y tá" : 
                                  "VT-TT".equals(roleId) ? "lễ tân" : 
                                  "VT-KT".equals(roleId) ? "kế toán" : "nhân viên cùng chức vụ";
                
                if (roleCount != null && roleCount >= limit) {
                    return org.springframework.http.ResponseEntity.status(409)
                            .body(Map.of("message", "Đã có tối đa " + limit + " " + roleName + " trực trong khung giờ " + 
                                         lich.getGio_bat_dau() + " ngày " + lich.getNgay_lam() + " rồi sếp ơi! 🐾"));
                }
            }

            // Tự động gán giờ kết thúc (30 phút từ giờ bắt đầu) nếu trống
            if (lich.getGio_ket_thuc() == null && lich.getGio_bat_dau() != null) {
                lich.setGio_ket_thuc(lich.getGio_bat_dau().plusMinutes(30));
            }

            return org.springframework.http.ResponseEntity.ok(lichLamViecRepository.save(lich));
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.status(500)
                    .body(Map.of("message", "Lỗi lưu lịch làm việc: " + e.getMessage()));
        }
    }

    @DeleteMapping("/nhan-vien/lich-lam-viec/{id}")
    @org.springframework.cache.annotation.CacheEvict(value = "bacSiCache", allEntries = true)
    public org.springframework.http.ResponseEntity<?> deleteLichLamViec(@PathVariable Long id,
            @RequestHeader(value = "Role", required = false) String roleHeader) {
        try {
            // Lấy thông tin ca trực chuẩn bị xóa
            LichLamViecNhanVien lichToXoa = lichLamViecRepository.findById(id).orElse(null);
            if (lichToXoa == null) {
                return org.springframework.http.ResponseEntity.status(404).body(Map.of("message", "Không tìm thấy ca trực cần xóa!"));
            }

            // BẢO MẬT 1: Lấy thông tin user hiện tại
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            String username = (auth != null) ? auth.getName() : null;
            if (username == null || username.equals("anonymousUser")) {
                return org.springframework.http.ResponseEntity.status(401).body(Map.of("message", "Token không hợp lệ!"));
            }

            boolean isAdmin = roleHeader != null && (roleHeader.toLowerCase().contains("admin") || roleHeader.toLowerCase().contains("quan_ly"));

            // BẢO MẬT 2: Phân quyền - Nhân viên chỉ được xóa ca trực của bản thân
            com.rexi.pkty.entity.TaiKhoan tk = taiKhoanRepository.findByTenDangNhap(username).orElse(null);
            if (!isAdmin && tk != null) {
                String currentNhanVienId = null;
                try {
                    java.util.List<String> allowedIds = jdbcTemplate.queryForList(
                            "SELECT id_nhan_vien FROM NhanVien WHERE id_tai_khoan = ?", String.class, tk.getId_tai_khoan());
                    if (!allowedIds.isEmpty()) currentNhanVienId = allowedIds.get(0);
                } catch (Exception ignored) {}

                if (currentNhanVienId == null || !currentNhanVienId.equals(lichToXoa.getId_nhan_vien())) {
                    return org.springframework.http.ResponseEntity.status(403).body(Map.of("message", "Cảnh báo bảo mật: Bạn không thể hủy ca trực của nhân viên khác!"));
                }
            }

            // BẢO MẬT 3: Ràng buộc "Tuần hiện tại" - Chỉ Admin mới được xóa tuần hiện tại
            java.time.LocalDate today = java.time.LocalDate.now();
            java.time.LocalDate currentMonday = today.with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
            java.time.LocalDate currentSunday = currentMonday.plusDays(6);

            if (!isAdmin && !lichToXoa.getNgay_lam().isAfter(currentSunday)) {
                return org.springframework.http.ResponseEntity.status(403).body(Map.of("message", "Bạn không thể xóa lịch trực ở tuần hiện tại. Vui lòng liên hệ Admin."));
            }

            // BẢO MẬT 4: Kiểm tra xung đột với lịch khám của khách hàng
            java.time.LocalTime shiftStart = lichToXoa.getGio_bat_dau();
            java.time.LocalTime shiftEnd = lichToXoa.getGio_ket_thuc();
            if (shiftEnd == null) shiftEnd = shiftStart.plusMinutes(30);

            java.util.List<Map<String, Object>> existingApps = jdbcTemplate.queryForList(
                    "SELECT lh.gio_kham, dv.thoi_luong_phut FROM LichHen lh JOIN DichVu dv ON lh.id_dich_vu = dv.id_dich_vu WHERE lh.id_bac_si = ? AND lh.ngay_kham = ? AND lh.trang_thai NOT IN (N'Đã hủy', 'da_huy')",
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

            // Thực hiện xóa
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
    @org.springframework.cache.annotation.CacheEvict(value = "bacSiCache", allEntries = true)
    public org.springframework.http.ResponseEntity<?> updateNhanVien(@PathVariable String id,
            @RequestBody NhanVien nv) {
        try {
            nv.setId_nhan_vien(id);
            return org.springframework.http.ResponseEntity.ok(nhanVienRepository.save(nv));
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.status(500)
                    .body(Map.of("message", "Lỗi khi cập nhật nhân viên: " + e.getMessage()));
        }
    }

    @PostMapping("/nhan-vien")
    @org.springframework.cache.annotation.CacheEvict(value = "bacSiCache", allEntries = true)
    public org.springframework.http.ResponseEntity<?> addNhanVien(@RequestBody NhanVien nv) {
        try {
            // 1. Tự động sinh ID theo chức vụ / chuyên môn (Admin: 1-99, Quản lý: QL-, etc.)
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

            // 2. Lưu NhanVien trước để có ID trong DB (Tránh lỗi FK_TaiKhoan_NhanVien)
            NhanVien savedNv = nhanVienRepository.save(nv);

            // 3. Tự động tạo Tài Khoản Đăng Nhập cho nhân sự mới (Kèm Role tương ứng)
            if (savedNv.getEmail() != null && !savedNv.getEmail().isEmpty()) {
                // Đảm bảo tên đăng nhập không bị trùng (tự động thêm số nếu trùng)
                String baseUsername = savedNv.getEmail().split("@")[0];
                String username = baseUsername;
                int suffix = 0;
                while (!taiKhoanRepository.findByTenDangNhap(username).isEmpty()) {
                    suffix++;
                    username = baseUsername + suffix;
                }
                if (taiKhoanRepository.findByTenDangNhap(username).isEmpty()) {

                    com.rexi.pkty.entity.TaiKhoan tk = new com.rexi.pkty.entity.TaiKhoan();
                    tk.setId_tai_khoan("TK-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase());
                    tk.setTen_dang_nhap(username);
                    tk.setId_nhan_vien(savedNv.getId_nhan_vien());

                    // Phân quyền Role chuẩn dựa theo ID vừa sinh (Đã đồng bộ với DB)
                    if (savedNv.getId_nhan_vien().matches("\\d+"))
                        tk.setId_vai_tro("VT-ADMIN"); // Admin
                    else if (savedNv.getId_nhan_vien().startsWith("QL-"))
                        tk.setId_vai_tro("VT-QL"); // Quản lý
                    else if (savedNv.getId_nhan_vien().startsWith("BS-"))
                        tk.setId_vai_tro("VT-BS"); // Bác sĩ
                    else if (savedNv.getId_nhan_vien().startsWith("KT-"))
                        tk.setId_vai_tro("VT-KT"); // Kế toán
                    else if (savedNv.getId_nhan_vien().startsWith("TT-"))
                        tk.setId_vai_tro("VT-TT"); // Tiếp tân
                    else if (savedNv.getId_nhan_vien().startsWith("YT-"))
                        tk.setId_vai_tro("VT-YT"); // Y tá
                    else
                        tk.setId_vai_tro("VT-3"); // Nhân viên mặc định (VT-3)

                    tk.setTrang_thai("active");
                    tk.setNgay_tao(LocalDateTime.now());

                    // Đặt mật khẩu mặc định dựa trên vai trò: [chức vụ]@rexi.com
                    String defaultPassword = "nhanvien@rexi.com"; // Mặc định chung
                    if ("VT-ADMIN".equals(tk.getId_vai_tro())) {
                        defaultPassword = "admin@rexi.com";
                    } else if ("VT-QL".equals(tk.getId_vai_tro())) {
                        defaultPassword = "quanly@rexi.com";
                    } else if ("VT-BS".equals(tk.getId_vai_tro())) {
                        defaultPassword = "bacsi@rexi.com";
                    } else if ("VT-KT".equals(tk.getId_vai_tro())) {
                        defaultPassword = "ketoan@rexi.com";
                    } else if ("VT-TT".equals(tk.getId_vai_tro())) {
                        defaultPassword = "tieptan@rexi.com";
                    } else if ("VT-YT".equals(tk.getId_vai_tro())) {
                        defaultPassword = "yta@rexi.com";
                    } else if ("VT-3".equals(tk.getId_vai_tro())) {
                        String cmLower = savedNv.getChuyen_mon() != null ? savedNv.getChuyen_mon().toLowerCase() : "";
                        if (cmLower.contains("trợ lý") || cmLower.contains("assistant")) {
                            defaultPassword = "troly@rexi.com";
                        }
                    }

                    String rawPassword = (nv.getMat_khau() != null && !nv.getMat_khau().isEmpty()) ? nv.getMat_khau() : defaultPassword;
                    String encodedPassword = passwordEncoder.encode(rawPassword);
                    tk.setMat_khau(encodedPassword);
                    tk.setMat_khau_hash(encodedPassword);

                    taiKhoanRepository.save(tk);
                    
                    // Cập nhật ngược lại ID tài khoản cho Nhân viên
                    savedNv.setId_tai_khoan(tk.getId_tai_khoan());
                    nhanVienRepository.save(savedNv);
                }
            }

            return org.springframework.http.ResponseEntity.ok(savedNv);
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.status(500)
                    .body(Map.of("message", "Lỗi khi thêm nhân viên: " + e.getMessage()));
        }
    }

    @DeleteMapping("/nhan-vien/{id}")
    @org.springframework.cache.annotation.CacheEvict(value = "bacSiCache", allEntries = true)
    public org.springframework.http.ResponseEntity<?> deleteNhanVien(@PathVariable String id) {
        try {
            Optional<NhanVien> nvOpt = nhanVienRepository.findById(id);
            if (nvOpt.isPresent()) {
                NhanVien nv = nvOpt.get();
                nv.setDa_xoa(true);
                nv.setTrang_thai("INACTIVE");
                nhanVienRepository.save(nv);
                return org.springframework.http.ResponseEntity.ok(Map.of("message", "Đã xóa nhân viên thành công!"));
            }
            return org.springframework.http.ResponseEntity.status(404)
                    .body(Map.of("message", "Không tìm thấy nhân viên!"));
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.status(500)
                    .body(Map.of("message", "Lỗi: " + e.getMessage()));
        }
    }


}
