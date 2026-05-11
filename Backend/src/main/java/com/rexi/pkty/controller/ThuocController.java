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

    // API DÃ nh cho cÆ¡ cháº¿ Autocomplete á»Ÿ Frontend
    @GetMapping("/search")
    public List<Thuoc> searchThuoc(@RequestParam String keyword) {
        if (keyword == null || keyword.trim().isEmpty())
            return List.of();
        return thuocRepository.searchThuoc(keyword);
    }

    @PostMapping
    public org.springframework.http.ResponseEntity<?> createThuoc(@RequestBody Thuoc thuoc) {
        if (!isAdmin())
            return org.springframework.http.ResponseEntity.status(403).body("Báº¡n khÃ´ng cÃ³ quyá»n quáº£n lÃ½ kho thuá»‘c!");
        Thuoc saved = thuocRepository.save(thuoc);
        // GHI LOG
        auditLogService.logAction("THÃŠM Má»šI", "Thuoc", "ThÃªm thuá»‘c: " + saved.getTen_thuoc());
        return org.springframework.http.ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    public org.springframework.http.ResponseEntity<?> updateThuoc(@PathVariable String id, @RequestBody Thuoc thuoc) {
        if (!isAdmin())
            return org.springframework.http.ResponseEntity.status(403).body("Báº¡n khÃ´ng cÃ³ quyá»n sá»­a thÃ´ng tin thuá»‘c!");
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
            auditLogService.logAction("Cáº¬P NHáº¬T", "Thuoc", "Sá»­a thuá»‘c ID " + id + ": " + tenCu 
                    + " -> " + saved.getTen_thuoc());
            return org.springframework.http.ResponseEntity.ok(saved);
        }).orElse(org.springframework.http.ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public org.springframework.http.ResponseEntity<?> deleteThuoc(@PathVariable String id) {
        if (!isAdmin())
            return org.springframework.http.ResponseEntity.status(403)
                    .body("Báº¡n khÃ´ng cÃ³ quyá»n xÃ³a thuá»‘c khá»i há»‡ thá»‘ng!");
        thuocRepository.findById(id).ifPresent(t -> {
            auditLogService.logAction("XÃ“A", "Thuoc", "XÃ³a thuá»‘c: " + t.getTen_thuoc());
        });
        thuocRepository.deleteById(id);
        return org.springframework.http.ResponseEntity.ok("ÄÃ£ xÃ³a thuá»‘c thÃ nh cÃ´ng!");
    }

    private boolean isAdmin() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
            .getContext().getAuthentication();
        String role = (auth != null) ? auth.getAuthorities().toString().toUpperCase() : "";
        return role.contains("ADMIN") || role.contains("KETOAN") || role.contains("QUANLY");
    }
}

