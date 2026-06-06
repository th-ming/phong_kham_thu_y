package com.rexi.pkty.controller;
 
import com.rexi.pkty.entity.ThuCung;
import com.rexi.pkty.repository.ThuCungRepository;
import com.rexi.pkty.security.RexiSecurityRoles;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
 
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
 
@RestController
@RequestMapping("/api/thu-cung")
@CrossOrigin(origins = "${cors.allowed-origins:http://localhost:3000,http://localhost:5173}")
public class ThuCungController {
 
    @Autowired
    private ThuCungRepository thuCungRepository;
 
    @Autowired
    private com.rexi.pkty.repository.TaiKhoanRepository taiKhoanRepository;
 
    @Autowired
    private com.rexi.pkty.service.AuditLogService auditLogService;

    @Autowired
    private com.rexi.pkty.repository.TiemChungRepository tiemChungRepository;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @GetMapping
    @PreAuthorize(RexiSecurityRoles.CUSTOMER_PET_READ)
    public ResponseEntity<?> getAllThuCung(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search) {
        try {
            // Dung JdbcTemplate tranh serialization error
            String sql;
            List<Map<String, Object>> allPets;
            if (search != null && !search.trim().isEmpty()) {
                java.util.List<Object> params = new java.util.ArrayList<>();
                StringBuilder where = new StringBuilder("WHERE (t.da_xoa IS NULL OR LOWER(CAST(t.da_xoa AS varchar)) IN ('0', 'false'))");
                com.rexi.pkty.util.SmartSearchSql.appendTokenSearch(where, params, search,
                        "LOWER(COALESCE(t.ten_thu_cung, '')) LIKE LOWER(?)",
                        "LOWER(COALESCE(t.loai, '')) LIKE LOWER(?)",
                        "LOWER(COALESCE(t.giong, '')) LIKE LOWER(?)",
                        "LOWER(COALESCE(k.ten_khach_hang, '')) LIKE LOWER(?)");
                sql = "SELECT t.*, k.ten_khach_hang FROM ThuCung t " +
                      "LEFT JOIN KhachHang k ON t.id_khach_hang = k.id_khach_hang " +
                      where + " " +
                      "ORDER BY t.ngay_tao DESC";
                allPets = jdbcTemplate.queryForList(sql, params.toArray());
            } else {
                sql = "SELECT * FROM ThuCung WHERE da_xoa IS NULL OR LOWER(CAST(da_xoa AS varchar)) IN ('0', 'false') ORDER BY ngay_tao DESC";
                allPets = jdbcTemplate.queryForList(sql);
            }

            int start = Math.min(page * size, allPets.size());
            int end = Math.min(start + size, allPets.size());
            List<Map<String, Object>> content = allPets.subList(start, end);
            int totalPages = (int) Math.max(1, Math.ceil((double) allPets.size() / size));

            return ResponseEntity.ok(Map.of(
                "content", content,
                "totalPages", totalPages,
                "totalElements", allPets.size(),
                "currentPage", page
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi DB: " + e.getMessage()));
        }
    }

    @GetMapping("/khach/{idKhachHang}")
    public ResponseEntity<?> getThuCungByKhachHang(
            @PathVariable String idKhachHang,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "999") int size) {
        try {
            // Chk IDOR get pet detail
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
            
            List<Map<String, Object>> allPets = thuCungRepository.findByKhachHang(idKhachHang);
            
            // Fake paging tuong thich FE query
            int start = Math.min(page * size, allPets.size());
            int end = Math.min(start + size, allPets.size());
            List<Map<String, Object>> content = allPets.subList(start, end);
            int totalPages = (int) Math.ceil((double) allPets.size() / size);
            
            return ResponseEntity.ok(Map.of(
                "content", content,
                "totalPages", totalPages,
                "totalElements", allPets.size(),
                "currentPage", page
            ));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi lấy danh sách thú cưng của khách " + idKhachHang + ": " + e.getMessage()));
        }
    }
 
    @PutMapping("/{id}")
    public ResponseEntity<Object> updateThuCung(@PathVariable String id, @RequestBody ThuCung nv) {
        try {
            Optional<ThuCung> optional = thuCungRepository.findById(id);
            if (optional.isPresent()) {
                ThuCung tc = optional.get();
 
                // Chk IDOR update pet
                org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                        .getContext().getAuthentication();
                String username = (auth != null) ? auth.getName() : null;
                if (username != null && !username.equals("anonymousUser")) {
                    com.rexi.pkty.entity.TaiKhoan tk = taiKhoanRepository.findByTenDangNhap(username).orElse(null);
                    if (tk != null && "VT-5".equals(tk.getId_vai_tro())) { // Là khách hàng
                        if (tk.getId_khach_hang() == null || !tk.getId_khach_hang().equals(tc.getId_khach_hang())) {
                            return ResponseEntity.status(403).body(
                                    Map.of("message", "Cảnh báo bảo mật: Bạn không có quyền sửa thú cưng của người khác!"));
                        }
                    }
                }
 
                tc.setTen_thu_cung(nv.getTen_thu_cung());
                tc.setLoai(nv.getLoai());
                tc.setGiong(nv.getGiong());
                tc.setNgay_sinh(nv.getNgay_sinh());
                tc.setGioi_tinh(nv.getGioi_tinh());
                tc.setMau_sac(nv.getMau_sac());
                tc.setTrong_luong(nv.getTrong_luong());
                tc.setGhi_chu(nv.getGhi_chu());
                tc.setHinh_anh(nv.getHinh_anh());
                tc.setNgay_cap_nhat(java.time.LocalDateTime.now());
 
                ThuCung saved = thuCungRepository.save(tc);
                auditLogService.logAction("CẬP NHẬT", "ThuCung",
                        "Cập nhật thú cưng: " + saved.getTen_thu_cung() + " (ID: " + saved.getId_thu_cung() + ") bởi " + (username != null ? username : "Hệ thống"));
                return ResponseEntity.ok(saved);
            } else {
                return ResponseEntity.status(404).body(Map.of("message", "Không tìm thấy thú cưng để cập nhật!"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi cập nhật thú cưng: " + e.getMessage()));
        }
    }
 
    @PostMapping
    public ResponseEntity<Object> addThuCung(@RequestBody ThuCung thuCung) {
        try {
            if (thuCung.getId_khach_hang() == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Lỗi: Thiếu ID Khách hàng!"));
            }
 
            // Chk IDOR add pet
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                    .getContext().getAuthentication();
            String username = (auth != null) ? auth.getName() : null;
            boolean isCustomer = false;
            if (username != null && !username.equals("anonymousUser")) {
                com.rexi.pkty.entity.TaiKhoan tk = taiKhoanRepository.findByTenDangNhap(username).orElse(null);
                if (tk != null && "VT-5".equals(tk.getId_vai_tro())) { // Là khách hàng
                    isCustomer = true;
                    if (tk.getId_khach_hang() == null || !tk.getId_khach_hang().equals(thuCung.getId_khach_hang())) {
                        return ResponseEntity.status(403).body(Map.of("message",
                                "Cảnh báo bảo mật: Bạn không có quyền thêm thú cưng cho khách hàng khác!"));
                    }
                }
            }
 
            if (thuCung.getId_thu_cung() == null || thuCung.getId_thu_cung().isEmpty()) {
                thuCung.setId_thu_cung("TC-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            }
 
            if (thuCung.getNgay_tao() == null) {
                thuCung.setNgay_tao(java.time.LocalDateTime.now());
            }
            if (thuCung.getDa_xoa() == null) {
                thuCung.setDa_xoa(false);
            }
 
            ThuCung saved = thuCungRepository.save(thuCung);
            if (!isCustomer) {
                auditLogService.logAction("THÊM MỚI", "ThuCung",
                        "Thêm thú cưng: " + saved.getTen_thu_cung() + " cho khách hàng ID " + saved.getId_khach_hang());
            }
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi thêm thú cưng: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/tiem-chung")
    @PreAuthorize(RexiSecurityRoles.AUTHENTICATED)
    public ResponseEntity<?> addTiemChung(@PathVariable String id, @RequestBody Map<String, Object> payload) {
        try {
            if (!thuCungRepository.existsById(id)) {
                return ResponseEntity.status(404).body(Map.of("message", "Không tìm thấy thú cưng."));
            }
            com.rexi.pkty.entity.TiemChung tiemChung = new com.rexi.pkty.entity.TiemChung();
            Long nextId = jdbcTemplate.queryForObject("SELECT COALESCE(MAX(id_tiem_chung), 0) + 1 FROM TiemChung", Long.class);
            tiemChung.setId_tiem_chung(nextId);
            tiemChung.setId_thu_cung(id);
            tiemChung.setTen_vaccine(String.valueOf(payload.getOrDefault("ten_vaccine", "Vaccine test")));
            tiemChung.setLoai_vaccine(String.valueOf(payload.getOrDefault("loai_vaccine", "Tiêm chủng định kỳ")));
            tiemChung.setNgay_tiem(java.time.LocalDate.parse(String.valueOf(payload.getOrDefault("ngay_tiem", java.time.LocalDate.now().toString()))));
            Object ngayTiemLai = payload.get("ngay_tiem_lai");
            if (ngayTiemLai != null && !String.valueOf(ngayTiemLai).isBlank()) {
                tiemChung.setNgay_tiem_lai(java.time.LocalDate.parse(String.valueOf(ngayTiemLai)));
            }
            Object idBacSi = payload.get("id_bac_si");
            if (idBacSi != null && !String.valueOf(idBacSi).isBlank()) {
                tiemChung.setId_bac_si(String.valueOf(idBacSi));
            }
            tiemChung.setGhi_chu(String.valueOf(payload.getOrDefault("ghi_chu", "")));
            com.rexi.pkty.entity.TiemChung saved = tiemChungRepository.save(tiemChung);
            auditLogService.logAction("THÊM MỚI", "TiemChung", "Thêm lịch sử tiêm chủng cho thú cưng " + id);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", "Không thể tạo bản ghi tiêm chủng: " + e.getMessage()));
        }
    }
 
    @DeleteMapping({ "/{id}", "/delete/{id}" })
    public ResponseEntity<Object> deleteThuCung(@PathVariable String id) {
        try {
            Optional<ThuCung> optional = thuCungRepository.findById(id);
 
            if (optional.isPresent()) {
                ThuCung tc = optional.get();
 
                // Chk IDOR delete pet
                org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                        .getContext().getAuthentication();
                String username = (auth != null) ? auth.getName() : null;
                if (username != null && !username.equals("anonymousUser")) {
                    com.rexi.pkty.entity.TaiKhoan tk = taiKhoanRepository.findByTenDangNhap(username).orElse(null);
                    if (tk != null && "VT-5".equals(tk.getId_vai_tro())) { // Là khách hàng
                        if (tk.getId_khach_hang() == null || !tk.getId_khach_hang().equals(tc.getId_khach_hang())) {
                            return ResponseEntity.status(403).body(
                                    Map.of("message", "Cảnh báo bảo mật: Bạn không có quyền xóa thú cưng của người khác!"));
                        }
                    }
                }
 
                thuCungRepository.delete(tc);
                auditLogService.logAction("XÓA CỨNG", "ThuCung", "Xoa cung thu cung: " + tc.getTen_thu_cung());
                return ResponseEntity.ok(Map.of("message", "Da xoa cung thu cung"));
            } else {
                return ResponseEntity.status(404).body(Map.of("message", "Không tìm thấy thú cưng này!"));
            }
        } catch (Exception e) {
            return ResponseEntity.status(409).body(Map.of("message", "Không thể xóa cứng thú cưng vì còn dữ liệu liên kết: " + e.getMessage()));
        }
    }

    private boolean hasBusinessData(String idThuCung) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT " +
                "(SELECT COUNT(1) FROM LichHen WHERE id_thu_cung = ?) + " +
                "(SELECT COUNT(1) FROM HoSoBenhAn WHERE id_thu_cung = ?) + " +
                "(SELECT COUNT(1) FROM LichSuTuVan WHERE id_thu_cung = ?) + " +
                "(SELECT COUNT(1) FROM TiemChung WHERE id_thu_cung = ?)",
                Integer.class,
                idThuCung,
                idThuCung,
                idThuCung,
                idThuCung
        );
        return count != null && count > 0;
    }
}
