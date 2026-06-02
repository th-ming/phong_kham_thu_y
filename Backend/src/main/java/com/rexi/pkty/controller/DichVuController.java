package com.rexi.pkty.controller;

import com.rexi.pkty.entity.DichVu;
import com.rexi.pkty.repository.DichVuRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dich-vu")
@CrossOrigin(origins = "${cors.allowed-origins:http://localhost:3000}")
public class DichVuController {

    @Autowired
    private DichVuRepository dichVuRepository;

    @Autowired
    private com.rexi.pkty.service.AuditLogService auditLogService;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void ensureServiceMetadataColumns() {
        try {
            jdbcTemplate.execute("""
                    IF COL_LENGTH('dbo.DichVu', 'ngay_tao') IS NULL
                    BEGIN
                        ALTER TABLE dbo.DichVu ADD ngay_tao DATETIME NULL
                    END
                    """);
        } catch (Exception ignored) {
            // Metadata is an enhancement for public badges; core service CRUD still works without it.
        }
    }

    @GetMapping(produces = "application/json;charset=UTF-8")
    public List<DichVu> getAll() {
        return dichVuRepository.findAll();
    }

    // Lay dich vu active (dat lich, bang gia)
    @GetMapping(value = "/active", produces = "application/json;charset=UTF-8")
    public List<Map<String, Object>> getActive() {
        Map<String, Map<String, Object>> publicServices = new LinkedHashMap<>();
        for (Map<String, Object> service : fetchActiveServiceRows()) {
            String publicName = toPublicServiceName(asString(service.get("ten_dich_vu")));
            if (!isPublicServiceNameAllowed(publicName)) {
                continue;
            }
            String key = publicName.toLowerCase(java.util.Locale.ROOT);
            Map<String, Object> next = copyForPublic(service, publicName);
            Map<String, Object> existing = publicServices.get(key);
            if (existing == null || usageCount(next) > usageCount(existing)) {
                publicServices.put(key, next);
            }
        }
        List<Map<String, Object>> result = new ArrayList<>(publicServices.values());
        long maxUsage = result.stream().mapToLong(this::usageCount).max().orElse(0);
        result.forEach(service -> {
            long count = usageCount(service);
            boolean isNew = isNewService(service.get("ngay_tao"));
            if (maxUsage > 0 && count == maxUsage) {
                service.put("badge", "Phổ biến");
            } else if (isNew) {
                service.put("badge", "Mới");
            } else {
                service.put("badge", null);
            }
        });
        result.sort(Comparator
                .comparingLong((Map<String, Object> service) -> usageCount(service)).reversed()
                .thenComparing(service -> !"Mới".equals(service.get("badge")))
                .thenComparing(service -> asString(service.get("ten_dich_vu"))));
        return result;
    }

    @PostMapping
    public org.springframework.http.ResponseEntity<?> create(@RequestBody DichVu dv) {
        if (!isAdmin())
            return org.springframework.http.ResponseEntity.status(403).body("Chỉ Admin mới được thêm dịch vụ!");
        if (dv.getId_dich_vu() == null || dv.getId_dich_vu().isBlank()) {
            dv.setId_dich_vu("DV-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        }
        if (dv.getTrang_thai() == null) {
            dv.setTrang_thai(true);
        }
        DichVu saved = dichVuRepository.save(dv);
        jdbcTemplate.update("UPDATE DichVu SET ngay_tao = COALESCE(ngay_tao, GETDATE()) WHERE id_dich_vu = ?",
                saved.getId_dich_vu());
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
            if (dv.getMo_ta() != null)
                existing.setMo_ta(dv.getMo_ta());
            if (dv.getThoi_luong_phut() != null)
                existing.setThoi_luong_phut(dv.getThoi_luong_phut());
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
            return org.springframework.http.ResponseEntity.status(403).body(java.util.Map.of("message", "Chỉ Admin mới được xóa dịch vụ!"));

        try {
            return dichVuRepository.findById(id).map(dv -> {
                dichVuRepository.delete(dv);
                auditLogService.logAction("XÓA CỨNG", "DichVu", "Đã xóa cứng dịch vụ: " + dv.getTen_dich_vu());
                return org.springframework.http.ResponseEntity.ok(java.util.Map.of("message", "Đã xóa cứng dịch vụ thành công!"));
            }).orElse(org.springframework.http.ResponseEntity.status(404).body(java.util.Map.of("message", "Không tìm thấy dịch vụ!")));
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.status(409).body(java.util.Map.of("message", "Không thể xóa cứng dịch vụ vì còn dữ liệu liên kết: " + e.getMessage()));
        }
    }

    private boolean isAdmin() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        String role = (auth != null) ? auth.getAuthorities().toString().toUpperCase() : "";
        return role.contains("ADMIN") || role.contains("QUAN_LY");
    }

    private String toPublicServiceName(String name) {
        if (name == null) {
            return "";
        }
        return name.trim()
                .replaceFirst("\\s+giá\\s+\\d+(?:[.,]\\d+)?\\s*$", "")
                .replaceFirst("\\s+\\d{10,}$", "")
                .trim();
    }

    private boolean isPublicServiceNameAllowed(String name) {
        if (name == null || name.isBlank()) {
            return false;
        }
        String lower = name.toLowerCase(java.util.Locale.ROOT);
        return !lower.contains("dịch vụ agent")
                && !lower.contains("agent tổng quát")
                && !lower.contains("test");
    }

    private List<Map<String, Object>> fetchActiveServiceRows() {
        boolean hasCreatedAt = hasColumn("DichVu", "ngay_tao");
        String createdAtSelect = hasCreatedAt ? "dv.ngay_tao" : "CAST(NULL AS DATETIME) AS ngay_tao";
        String sql = """
                SELECT dv.id_dich_vu, dv.ten_dich_vu, dv.mo_ta, dv.gia, dv.thoi_luong_phut,
                       dv.trang_thai, %s, COUNT(lh.id_lich_hen) AS so_lan_dat
                FROM DichVu dv
                LEFT JOIN LichHen lh ON lh.id_dich_vu = dv.id_dich_vu
                    AND (lh.trang_thai IS NULL OR lh.trang_thai NOT IN (N'Đã hủy', 'DA_HUY', 'da_huy', 'TU_CHOI', N'Hết hạn'))
                WHERE dv.trang_thai = 1
                  AND (dv.da_xoa = 0 OR dv.da_xoa IS NULL)
                GROUP BY dv.id_dich_vu, dv.ten_dich_vu, dv.mo_ta, dv.gia, dv.thoi_luong_phut, dv.trang_thai, %s
                """.formatted(createdAtSelect, hasCreatedAt ? "dv.ngay_tao" : "CAST(NULL AS DATETIME)");
        return jdbcTemplate.queryForList(sql);
    }

    private Map<String, Object> copyForPublic(Map<String, Object> source, String publicName) {
        Map<String, Object> copy = new LinkedHashMap<>();
        copy.put("id_dich_vu", source.get("id_dich_vu"));
        copy.put("ten_dich_vu", publicName);
        copy.put("mo_ta", source.get("mo_ta"));
        copy.put("gia", source.get("gia"));
        copy.put("thoi_luong_phut", source.get("thoi_luong_phut"));
        copy.put("trang_thai", source.get("trang_thai"));
        copy.put("ngay_tao", source.get("ngay_tao"));
        copy.put("so_lan_dat", source.get("so_lan_dat"));
        return copy;
    }

    private boolean hasColumn(String tableName, String columnName) {
        Integer count = jdbcTemplate.queryForObject("""
                SELECT COUNT(*)
                FROM INFORMATION_SCHEMA.COLUMNS
                WHERE TABLE_NAME = ? AND COLUMN_NAME = ?
                """, Integer.class, tableName, columnName);
        return count != null && count > 0;
    }

    private long usageCount(Map<String, Object> service) {
        Object value = service.get("so_lan_dat");
        return value instanceof Number number ? number.longValue() : 0;
    }

    private boolean isNewService(Object createdAt) {
        if (!(createdAt instanceof java.sql.Timestamp timestamp)) {
            return false;
        }
        LocalDateTime sixMonthsAgo = LocalDateTime.now(ZoneId.of("Asia/Ho_Chi_Minh")).minusMonths(6);
        return timestamp.toLocalDateTime().isAfter(sixMonthsAgo);
    }

    private String asString(Object value) {
        return value == null ? "" : value.toString();
    }
}


