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

    // Tá»‘i Æ°u: Chá»‰ láº¥y dá»‹ch vá»¥ Ä‘ang hoáº¡t Ä‘á»™ng (cho trang Ä‘áº·t lá»‹ch, báº£ng giÃ¡)
    @GetMapping(value = "/active", produces = "application/json;charset=UTF-8")
    public List<DichVu> getActive() {
        return dichVuRepository.findTop8ActiveServices();
    }

    @PostMapping
    public org.springframework.http.ResponseEntity<?> create(@RequestBody DichVu dv) {
        if (!isAdmin())
            return org.springframework.http.ResponseEntity.status(403).body("Chá»‰ Admin má»›i Ä‘Æ°á»£c thÃªm dá»‹ch vá»¥!");
        DichVu saved = dichVuRepository.save(dv);
        // GHI LOG
        auditLogService.logAction("THÊM MỚI", "DichVu",
                "Thêm dịch vụ: " + saved.getTenDichVu() + " - Giá: " + saved.getGiaTien());
        return org.springframework.http.ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public org.springframework.http.ResponseEntity<?> update(@PathVariable String id, @RequestBody DichVu dv) {
        if (!isAdmin())
            return org.springframework.http.ResponseEntity.status(403).body("Chỉ Admin mới được sửa dịch vụ!");
        return dichVuRepository.findById(id).map(existing -> {
            String tenCu = existing.getTenDichVu();
            java.math.BigDecimal giaCu = existing.getGiaTien();
            if (dv.getTenDichVu() != null)
                existing.setTenDichVu(dv.getTenDichVu());
            if (dv.getGiaTien() != null)
                existing.setGiaTien(dv.getGiaTien());
            if (dv.getTrangThai() != null)
                existing.setTrangThai(dv.getTrangThai());
            DichVu saved = dichVuRepository.save(existing);
            // GHI LOG
            auditLogService.logAction("CẬP NHẬT", "DichVu", "Sửa dịch vụ ID " + id + ": " + tenCu + " (Giá cũ: " + giaCu
                    + ") -> " + saved.getTenDichVu() + " (Giá mới: " + saved.getGiaTien() + ")");
            return org.springframework.http.ResponseEntity.ok(saved);
        }).orElse(org.springframework.http.ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public org.springframework.http.ResponseEntity<?> delete(@PathVariable String id) {
        if (!isAdmin())
            return org.springframework.http.ResponseEntity.status(403).body("Chá»‰ Admin má»›i Ä‘Æ°á»£c xÃ³a dá»‹ch vá»¥!");

        dichVuRepository.findById(id).ifPresent(dv -> {
            auditLogService.logAction("XÓA", "DichVu", "Xóa dịch vụ: " + dv.getTenDichVu());
        });
        dichVuRepository.deleteById(id);
        return org.springframework.http.ResponseEntity.ok("ÄÃ£ xÃ³a dá»‹ch vá»¥ thÃ nh cÃ´ng!");
    }

    private boolean isAdmin() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        String role = (auth != null) ? auth.getAuthorities().toString().toUpperCase() : "";
        return role.contains("ADMIN") || role.contains("QUANLY");
    }
}


