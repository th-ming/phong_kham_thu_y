package com.rexi.pkty.controller;

import com.rexi.pkty.entity.Thuoc;
import com.rexi.pkty.repository.ThuocRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/thuoc")
@CrossOrigin(origins = "${cors.allowed-origins:http://localhost:3000}")
public class ThuocController {

    @Autowired
    private ThuocRepository thuocRepository;

    @Autowired
    private com.rexi.pkty.service.AuditLogService auditLogService;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @GetMapping
    public List<Thuoc> getAllThuoc() {
        return thuocRepository.findAll();
    }

    // API Dành cho cơ chế Autocomplete ở Frontend
    @GetMapping("/search")
    public List<Thuoc> searchThuoc(@RequestParam String keyword) {
        if (keyword == null || keyword.trim().isEmpty())
            return List.of();
        return thuocRepository.findAll().stream()
                .filter(t -> t.getDa_xoa() == null || !t.getDa_xoa())
                .filter(t -> com.rexi.pkty.util.SmartSearchSql.matchesFields(keyword,
                        t.getId_thuoc(),
                        t.getTen_thuoc(),
                        t.getThanh_phan(),
                        t.getDang_bao_che(),
                        t.getDon_vi(),
                        t.getMo_ta(),
                        t.getGia_ban(),
                        t.getTrang_thai()))
                .limit(20)
                .toList();
    }

    @PostMapping
    public org.springframework.http.ResponseEntity<?> createThuoc(@RequestBody Thuoc thuoc) {
        if (!isAdmin())
            return org.springframework.http.ResponseEntity.status(403).body("Bạn không có quyền quản lý kho thuốc!");
        Thuoc saved = thuocRepository.save(thuoc);
        // GHI LOG
        auditLogService.logAction("THÊM MỚI", "Thuoc", "Thêm thuốc: " + saved.getTen_thuoc());
        return org.springframework.http.ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public org.springframework.http.ResponseEntity<?> updateThuoc(@PathVariable String id, @RequestBody Thuoc thuoc) {
        if (!isAdmin())
            return org.springframework.http.ResponseEntity.status(403).body("Bạn không có quyền sửa thông tin thuốc!");
        return thuocRepository.findById(id).map(existing -> {
            String tenCu = existing.getTen_thuoc();
            if (thuoc.getTen_thuoc() != null)
                existing.setTen_thuoc(thuoc.getTen_thuoc());
            if (thuoc.getGia_ban() != null)
                existing.setGia_ban(thuoc.getGia_ban());
            if (thuoc.getThanh_phan() != null)
                existing.setThanh_phan(thuoc.getThanh_phan());
            if (thuoc.getDang_bao_che() != null)
                existing.setDang_bao_che(thuoc.getDang_bao_che());
            if (thuoc.getDon_vi() != null)
                existing.setDon_vi(thuoc.getDon_vi());
            if (thuoc.getMo_ta() != null)
                existing.setMo_ta(thuoc.getMo_ta());
            
            Thuoc saved = thuocRepository.save(existing);
            // GHI LOG
            auditLogService.logAction("CẬP NHẬT", "Thuoc", "Sửa thuốc ID " + id + ": " + tenCu 
                    + " -> " + saved.getTen_thuoc());
            return org.springframework.http.ResponseEntity.ok(saved);
        }).orElse(org.springframework.http.ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public org.springframework.http.ResponseEntity<?> deleteThuoc(@PathVariable String id) {
        if (!isAdmin())
            return org.springframework.http.ResponseEntity.status(403)
                    .body(java.util.Map.of("message", "Bạn không có quyền xóa thuốc khỏi hệ thống!"));
                    
        return thuocRepository.findById(id).map(t -> {
            // Kiểm tra liên kết trong LoThuoc và DonThuocChiTiet
            int countLoThuoc = 0;
            int countDonThuoc = 0;
            try {
                countLoThuoc = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM LoThuoc WHERE id_thuoc = ?", Integer.class, id);
            } catch (Exception e) {}
            try {
                countDonThuoc = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM DonThuocChiTiet WHERE id_thuoc = ?", Integer.class, id);
            } catch (Exception e) {}
            
            // XÓA MỀM TUYỆT ĐỐI (100% KHÔNG DÙNG deleteById ĐỂ BẢO TOÀN LỊCH SỬ)
            t.setDa_xoa(true);
            t.setTrang_thai(false);
            thuocRepository.save(t);
            
            if (countLoThuoc > 0 || countDonThuoc > 0) {
                auditLogService.logAction("XÓA MỀM", "Thuoc", "Đã ẩn thuốc do có dữ liệu liên kết: " + t.getTen_thuoc());
                return org.springframework.http.ResponseEntity.ok(java.util.Map.of("message", "Thuốc đang được sử dụng trong kho hoặc đơn thuốc. Đã chuyển sang trạng thái Xóa mềm (Ngừng kinh doanh) để bảo toàn dữ liệu lịch sử!"));
            } else {
                auditLogService.logAction("XÓA MỀM", "Thuoc", "Đã ẩn thuốc: " + t.getTen_thuoc());
                return org.springframework.http.ResponseEntity.ok(java.util.Map.of("message", "Đã xóa (ẩn) thuốc thành công!"));
            }
        }).orElse(org.springframework.http.ResponseEntity.status(404).body(java.util.Map.of("message", "Không tìm thấy thuốc!")));
    }

    private boolean isAdmin() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
            .getContext().getAuthentication();
        String role = (auth != null) ? auth.getAuthorities().toString().toUpperCase() : "";
        return role.contains("ADMIN") || role.contains("KE_TOAN") || role.contains("KETOAN") || role.contains("QUAN_LY");
    }
}
