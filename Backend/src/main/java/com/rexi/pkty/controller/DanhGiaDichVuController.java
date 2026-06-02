package com.rexi.pkty.controller;

import com.rexi.pkty.entity.DanhGiaDichVu;
import com.rexi.pkty.repository.DanhGiaDichVuRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/danh-gia-dich-vu")
@CrossOrigin(origins = "${cors.allowed-origins:http://localhost:3000,http://localhost:5173}")
public class DanhGiaDichVuController {

    @Autowired
    private DanhGiaDichVuRepository danhGiaDichVuRepository;

    @Autowired
    private com.rexi.pkty.service.AuditLogService auditLogService;

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, Object> payload) {
        try {
            String idKhachHang = String.valueOf(payload.get("id_khach_hang"));
            Integer soSao = Integer.parseInt(String.valueOf(payload.getOrDefault("so_sao", "5")));
            if (idKhachHang == null || idKhachHang.isBlank() || "null".equals(idKhachHang)) {
                return ResponseEntity.badRequest().body(Map.of("message", "Thiếu khách hàng đánh giá."));
            }
            if (soSao < 1 || soSao > 5) {
                return ResponseEntity.badRequest().body(Map.of("message", "Số sao phải nằm trong khoảng 1-5."));
            }
            DanhGiaDichVu danhGia = DanhGiaDichVu.builder()
                    .idKhachHang(idKhachHang)
                    .idDichVu(payload.get("id_dich_vu") != null ? String.valueOf(payload.get("id_dich_vu")) : null)
                    .soSao(soSao)
                    .noiDung(String.valueOf(payload.getOrDefault("noi_dung", "")))
                    .build();
            DanhGiaDichVu saved = danhGiaDichVuRepository.save(danhGia);
            auditLogService.logAction("THÊM MỚI", "DanhGiaDichVu", "Khách hàng " + idKhachHang + " đánh giá dịch vụ");
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", "Không thể lưu đánh giá: " + e.getMessage()));
        }
    }
}
