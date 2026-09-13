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

    @Autowired
    private com.rexi.pkty.repository.KhachHangRepository khachHangRepository;

    @Autowired
    private com.rexi.pkty.repository.DichVuRepository dichVuRepository;

    // Public: đánh giá mới nhất cho trang chủ (chỉ tên + sao + nội dung, không lộ SĐT/ID nội bộ)
    @GetMapping("/moi-nhat")
    public ResponseEntity<?> moiNhat(@RequestParam(defaultValue = "12") int size) {
        try {
            int limit = Math.min(Math.max(size, 1), 50);
            var list = danhGiaDichVuRepository.findRecentWithContent(
                    org.springframework.data.domain.PageRequest.of(0, limit));
            var khIds = list.stream().map(DanhGiaDichVu::getIdKhachHang)
                    .filter(s -> s != null && !s.isBlank())
                    .collect(java.util.stream.Collectors.toSet());
            var dvIds = list.stream().map(DanhGiaDichVu::getIdDichVu)
                    .filter(s -> s != null && !s.isBlank())
                    .collect(java.util.stream.Collectors.toSet());
            var tenKh = new java.util.HashMap<String, String>();
            if (!khIds.isEmpty()) khachHangRepository.findAllById(khIds)
                    .forEach(kh -> tenKh.put(kh.getId_khach_hang(), kh.getTen_khach_hang()));
            var tenDv = new java.util.HashMap<String, String>();
            if (!dvIds.isEmpty()) dichVuRepository.findAllById(dvIds)
                    .forEach(dv -> tenDv.put(dv.getId_dich_vu(), dv.getTen_dich_vu()));
            var items = new java.util.ArrayList<java.util.Map<String, Object>>();
            for (var dg : list) {
                var m = new java.util.LinkedHashMap<String, Object>();
                m.put("ten_khach_hang", tenKh.getOrDefault(dg.getIdKhachHang(), "Khách hàng Rexi"));
                m.put("so_sao", dg.getSoSao());
                m.put("noi_dung", dg.getNoiDung());
                m.put("ngay_danh_gia", String.valueOf(dg.getNgayDanhGia()));
                m.put("ten_dich_vu", tenDv.get(dg.getIdDichVu()));
                items.add(m);
            }
            Double avg = danhGiaDichVuRepository.avgSaoWithContent();
            var res = new java.util.LinkedHashMap<String, Object>();
            res.put("items", items);
            res.put("avgSao", avg == null ? 0 : Math.round(avg * 10.0) / 10.0);
            res.put("tongSo", danhGiaDichVuRepository.countWithContent());
            return ResponseEntity.ok(res);
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", "Không thể tải đánh giá: " + e.getMessage()));
        }
    }

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
