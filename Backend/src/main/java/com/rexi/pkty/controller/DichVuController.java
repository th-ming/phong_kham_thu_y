package com.rexi.pkty.controller;

import com.rexi.pkty.entity.DichVu;
import com.rexi.pkty.repository.DichVuRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/dich-vu")
@CrossOrigin(origins = "${cors.allowed-origins:http://localhost:3000}")
public class DichVuController {

    @Autowired
    private DichVuRepository dichVuRepository;

    @Autowired
    private com.rexi.pkty.service.AuditLogService auditLogService;

    @GetMapping(produces = "application/json;charset=UTF-8")
    public List<DichVu> getAll() {
        return dichVuRepository.findAll();
    }

    // Tối ưu: Chỉ lấy dịch vụ đang hoạt động (cho trang đặt lịch, bảng giá)
    @GetMapping(value = "/active", produces = "application/json;charset=UTF-8")
    public List<DichVu> getActive() {
        return dichVuRepository.findAllActiveServices();
    }

    @PostMapping
    public org.springframework.http.ResponseEntity<?> create(@RequestBody DichVu dv) {
        if (!isAdmin())
            return org.springframework.http.ResponseEntity.status(403).body("Chỉ Admin mới được thêm dịch vụ!");
        DichVu saved = dichVuRepository.save(dv);
        // GHI LOG
        auditLogService.logAction("THÊM MỚI", "DichVu",
                "Thêm dịch vụ: " + saved.getTen_dich_vu() + " - Giá: " + saved.getGia());
        return org.springframework.http.ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public org.springframework.http.ResponseEntity<?> update(@PathVariable String id, @RequestBody DichVu dv) {
        if (!isAdmin())
            return org.springframework.http.ResponseEntity.status(403).body("Chỉ Admin mới được sửa dịch vụ!");
        return dichVuRepository.findById(id).map(existing -> {
            String tenCu = existing.getTen_dich_vu();
            java.math.BigDecimal giaCu = existing.getGia();
            if (dv.getTen_dich_vu() != null)
                existing.setTen_dich_vu(dv.getTen_dich_vu());
            if (dv.getGia() != null)
                existing.setGia(dv.getGia());
            if (dv.getTrang_thai() != null)
                existing.setTrang_thai(dv.getTrang_thai());
            DichVu saved = dichVuRepository.save(existing);
            // GHI LOG
            auditLogService.logAction("CẬP NHẬT", "DichVu", "Sửa dịch vụ ID " + id + ": " + tenCu + " (Giá cũ: " + giaCu
                    + ") -> " + saved.getTen_dich_vu() + " (Giá mới: " + saved.getGia() + ")");
            return org.springframework.http.ResponseEntity.ok(saved);
        }).orElse(org.springframework.http.ResponseEntity.notFound().build());
    }

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @DeleteMapping("/{id}")
    public org.springframework.http.ResponseEntity<?> delete(@PathVariable String id) {
        if (!isAdmin())
            return org.springframework.http.ResponseEntity.status(403).body(java.util.Map.of("message", "Chỉ Admin mới được xóa dịch vụ!"));

        try {
            // BẢO VỆ DỮ LIỆU CỐT LÕI (CHỐNG XÓA MÙ)
            // Kiểm tra xem dịch vụ này có đang được sử dụng trong Lịch Hẹn không
            Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM LichHen WHERE id_dich_vu = ?", Integer.class, id);
            if (count != null && count > 0) {
                return org.springframework.http.ResponseEntity.status(400).body(
                        java.util.Map.of("message", "Không thể xóa! Dịch vụ này đang nằm trong " + count + " lịch hẹn. Hãy vào chế độ Cập nhật và tắt 'Trạng thái hoạt động' thay vì xóa."));
            }

            dichVuRepository.findById(id).ifPresent(dv -> {
                auditLogService.logAction("XÓA", "DichVu", "Xóa dịch vụ: " + dv.getTen_dich_vu());
            });
            dichVuRepository.deleteById(id);
            return org.springframework.http.ResponseEntity.ok(java.util.Map.of("message", "Đã xóa dịch vụ thành công!"));
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.status(500).body(java.util.Map.of("message", "Lỗi khi xóa dịch vụ: " + e.getMessage()));
        }
    }

    private boolean isAdmin() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        String role = (auth != null) ? auth.getAuthorities().toString().toUpperCase() : "";
        return role.contains("ADMIN") || role.contains("QUAN_LY");
    }
}


