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

    @GetMapping
    public List<Thuoc> getAllThuoc() {
        return thuocRepository.findAll();
    }

    // API Dành cho cơ chế Autocomplete ở Frontend
    @GetMapping("/search")
    public List<Thuoc> searchThuoc(@RequestParam String keyword) {
        if (keyword == null || keyword.trim().isEmpty())
            return List.of();
        return thuocRepository.searchThuoc(keyword);
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
                    .body("Bạn không có quyền xóa thuốc khỏi hệ thống!");
        thuocRepository.findById(id).ifPresent(t -> {
            auditLogService.logAction("XÓA", "Thuoc", "Xóa thuốc: " + t.getTen_thuoc());
        });
        thuocRepository.deleteById(id);
        return org.springframework.http.ResponseEntity.ok("Đã xóa thuốc thành công!");
    }

    private boolean isAdmin() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
            .getContext().getAuthentication();
        String role = (auth != null) ? auth.getAuthorities().toString().toUpperCase() : "";
        return role.contains("ADMIN") || role.contains("KETOAN") || role.contains("QUANLY");
    }
}
