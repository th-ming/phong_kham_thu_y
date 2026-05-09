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
        return dichVuRepository.findTop8ActiveServices();
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

    @DeleteMapping("/{id}")
    public org.springframework.http.ResponseEntity<?> delete(@PathVariable String id) {
        if (!isAdmin())
            return org.springframework.http.ResponseEntity.status(403).body("Chỉ Admin mới được xóa dịch vụ!");

        dichVuRepository.findById(id).ifPresent(dv -> {
            auditLogService.logAction("XÓA", "DichVu", "Xóa dịch vụ: " + dv.getTen_dich_vu());
        });
        dichVuRepository.deleteById(id);
        return org.springframework.http.ResponseEntity.ok("Đã xóa dịch vụ thành công!");
    }

    private boolean isAdmin() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        String role = (auth != null) ? auth.getAuthorities().toString().toUpperCase() : "";
        return role.contains("ADMIN") || role.contains("QUANLY");
    }
}

