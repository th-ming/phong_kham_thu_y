package com.rexi.pkty.controller;

import com.rexi.pkty.entity.ThuCung;
import com.rexi.pkty.repository.ThuCungRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

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

    @GetMapping("/khach/{idKhachHang}")
    public ResponseEntity<?> getThuCungByKhachHang(@PathVariable String idKhachHang) {
        // Báº¢O Máº¬T: Kiá»ƒm tra IDOR - NgÄƒn khÃ¡ch hÃ ng xem thÃº cÆ°ng cá»§a ngÆ°á»i khÃ¡c
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        String username = (auth != null) ? auth.getName() : null;
        if (username == null || username.equals("anonymousUser")) {
            return ResponseEntity.status(401)
                    .body(Map.of("message", "Cáº£nh bÃ¡o báº£o máº­t: YÃªu cáº§u khÃ´ng cÃ³ Token xÃ¡c thá»±c há»£p lá»‡!"));
        }
        com.rexi.pkty.entity.TaiKhoan tk = taiKhoanRepository.findByTenDangNhap(username).orElse(null);
        if (tk != null && tk.getId_vai_tro() != null && tk.getId_vai_tro().equals("VT-KH")) { // LÃ  khÃ¡ch hÃ ng
            if (!tk.getId_khach_hang().equals(idKhachHang)) {
                return ResponseEntity.status(403)
                        .body(Map.of("message", "Cáº£nh bÃ¡o báº£o máº­t: Báº¡n khÃ´ng cÃ³ quyá»n xem dá»¯ liá»‡u cá»§a ngÆ°á»i khÃ¡c!"));
            }
        }
        return ResponseEntity.ok(thuCungRepository.findByKhachHang(idKhachHang));
    }

    // API Cáº­p nháº­t thÃ´ng tin thÃº cÆ°ng (Báº¢O Máº¬T: Chá»‘ng IDOR)
    @PutMapping("/{id}")
    public ResponseEntity<Object> updateThuCung(@PathVariable String id, @RequestBody ThuCung nv) {
        Optional<ThuCung> optional = thuCungRepository.findById(id);
        if (optional.isPresent()) {
            ThuCung tc = optional.get();

            // Báº¢O Máº¬T: Kiá»ƒm tra IDOR - NgÄƒn khÃ¡ch hÃ ng sá»­a thÃº cÆ°ng cá»§a ngÆ°á»i khÃ¡c
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                    .getContext().getAuthentication();
            String username = (auth != null) ? auth.getName() : null;
            boolean isCustomer = false;
            if (username != null && !username.equals("anonymousUser")) {
                com.rexi.pkty.entity.TaiKhoan tk = taiKhoanRepository.findByTenDangNhap(username).orElse(null);
                if (tk != null && tk.getId_vai_tro().equals("VT-KH")) { // LÃ  khÃ¡ch hÃ ng
                    isCustomer = true;
                    if (!tk.getId_khach_hang().equals(tc.getId_khach_hang())) {
                        return ResponseEntity.status(403).body(
                                Map.of("message", "Cáº£nh bÃ¡o báº£o máº­t: Báº¡n khÃ´ng cÃ³ quyá»n sá»­a thÃº cÆ°ng cá»§a ngÆ°á»i khÃ¡c!"));
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
            // GHI LOG
            if (!isCustomer) {
                auditLogService.logAction("Cáº¬P NHáº¬T", "ThuCung",
                        "Cáº­p nháº­t thÃº cÆ°ng: " + saved.getTen_thu_cung() + " (ID: " + saved.getId_thu_cung() + ")");
            }
            return ResponseEntity.ok(saved);
        } else {
            return ResponseEntity.status(404).body(Map.of("message", "KhÃ´ng tÃ¬m tháº¥y thÃº cÆ°ng Ä‘á»ƒ cáº­p nháº­t!"));
        }
    }

    // API ThÃªm thÃº cÆ°ng má»›i
    @PostMapping
    public ResponseEntity<Object> addThuCung(@RequestBody ThuCung thuCung) {
        try {
            if (thuCung.getId_khach_hang() == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Lá»—i: Thiáº¿u ID KhÃ¡ch hÃ ng!"));
            }

            // Báº¢O Máº¬T: Kiá»ƒm tra IDOR - NgÄƒn khÃ¡ch hÃ ng thÃªm thÃº cÆ°ng vÃ o tÃ i khoáº£n cá»§a
            // ngÆ°á»i khÃ¡c
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                    .getContext().getAuthentication();
            String username = (auth != null) ? auth.getName() : null;
            boolean isCustomer = false;
            if (username != null && !username.equals("anonymousUser")) {
                com.rexi.pkty.entity.TaiKhoan tk = taiKhoanRepository.findByTenDangNhap(username).orElse(null);
                if (tk != null && tk.getId_vai_tro().equals("VT-KH")) { // LÃ  khÃ¡ch hÃ ng
                    isCustomer = true;
                    if (!tk.getId_khach_hang().equals(thuCung.getId_khach_hang())) {
                        return ResponseEntity.status(403).body(Map.of("message",
                                "Cáº£nh bÃ¡o báº£o máº­t: Báº¡n khÃ´ng cÃ³ quyá»n thÃªm thÃº cÆ°ng cho khÃ¡ch hÃ ng khÃ¡c!"));
                    }
                }
            }

            // SỬA LỖI: Tự động tạo ID duy nhất cho thú cưng mới nếu chưa có (Tránh lỗi Primary Key Null)
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
            // GHI LOG
            if (!isCustomer) {
                auditLogService.logAction("THÃŠM Má»šI", "ThuCung",
                        "ThÃªm thÃº cÆ°ng: " + saved.getTen_thu_cung() + " cho khÃ¡ch hÃ ng ID " + saved.getId_khach_hang());
            }
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lá»—i thÃªm thÃº cÆ°ng: " + e.getMessage()));
        }
    }

    // API XÃ³a thÃº cÆ°ng (XÃ³a má»m & Chá»‘ng IDOR)
    @DeleteMapping("/{id}")
    public ResponseEntity<Object> deleteThuCung(@PathVariable String id) {
        Optional<ThuCung> optional = thuCungRepository.findById(id);
        if (optional.isPresent()) {
            ThuCung tc = optional.get();

            // Báº¢O Máº¬T: Kiá»ƒm tra IDOR
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                    .getContext().getAuthentication();
            String username = (auth != null) ? auth.getName() : null;
            boolean isCustomer = false;
            if (username != null && !username.equals("anonymousUser")) {
                com.rexi.pkty.entity.TaiKhoan tk = taiKhoanRepository.findByTenDangNhap(username).orElse(null);
                if (tk != null && tk.getId_vai_tro().equals("VT-KH")) { // LÃ  khÃ¡ch hÃ ng
                    isCustomer = true;
                    if (!tk.getId_khach_hang().equals(tc.getId_khach_hang())) {
                        return ResponseEntity.status(403).body(
                                Map.of("message", "Cáº£nh bÃ¡o báº£o máº­t: Báº¡n khÃ´ng cÃ³ quyá»n xÃ³a thÃº cÆ°ng cá»§a ngÆ°á»i khÃ¡c!"));
                    }
                }
            }

            tc.setDa_xoa(true);
            thuCungRepository.save(tc);
            // GHI LOG
            if (!isCustomer) {
                auditLogService.logAction("XÃ“A", "ThuCung",
                        "XÃ³a thÃº cÆ°ng: " + tc.getTen_thu_cung() + " (ID: " + tc.getId_thu_cung() + ")");
            }
            return ResponseEntity.ok(Map.of("message", "ÄÃ£ xÃ³a thÃº cÆ°ng thÃ nh cÃ´ng!"));
        } else {
            return ResponseEntity.status(404).body(Map.of("message", "KhÃ´ng tÃ¬m tháº¥y thÃº cÆ°ng nÃ y!"));
        }
    }
}

