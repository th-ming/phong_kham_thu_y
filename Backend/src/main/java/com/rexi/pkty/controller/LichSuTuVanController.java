package com.rexi.pkty.controller;

import com.rexi.pkty.entity.LichSuTuVan;
import com.rexi.pkty.repository.LichSuTuVanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import java.util.Map;

import java.util.List;

@RestController
@RequestMapping("/api/lich-su-tu-van")
@CrossOrigin(origins = "${cors.allowed-origins:http://localhost:3000}")
public class LichSuTuVanController {

    @Autowired
    private LichSuTuVanRepository repository;

    @Autowired
    private com.rexi.pkty.repository.TaiKhoanRepository taiKhoanRepository;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @GetMapping("/thu-cung/{id}")
    public ResponseEntity<?> getByThuCung(@PathVariable String id) {
        // Báº¢O Máº¬T: Kiá»ƒm tra IDOR, ngÄƒn cháº·n hacker Ä‘á»c trá»™m Ä‘oáº¡n chat cá»§a khÃ¡ch hÃ ng
        // khÃ¡c
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        String username = (auth != null) ? auth.getName() : null;

        if (username == null || username.equals("anonymousUser")) {
            return ResponseEntity.status(401)
                    .body(Map.of("message", "Cáº£nh bÃ¡o báº£o máº­t: YÃªu cáº§u khÃ´ng cÃ³ Token xÃ¡c thá»±c!"));
        }

        com.rexi.pkty.entity.TaiKhoan tk = taiKhoanRepository.findByTenDangNhap(username).orElse(null);
        if (tk != null && "VT-5".equals(tk.getId_vai_tro())) { // LÃ  KhÃ¡ch hÃ ng (Sá»­ dá»¥ng ID Ä‘Ã£ chuáº©n hÃ³a)
            java.util.List<String> ownerIds = jdbcTemplate
                    .queryForList("SELECT id_khach_hang FROM ThuCung WHERE id_thu_cung = ?", String.class, id);
            if (ownerIds.isEmpty() || !ownerIds.get(0).equals(tk.getId_khach_hang())) {
                return ResponseEntity.status(403).body(
                        Map.of("message", "Cáº£nh bÃ¡o báº£o máº­t: Báº¡n khÃ´ng cÃ³ quyá»n xem lá»‹ch sá»­ tÆ° váº¥n cá»§a thÃº cÆ°ng nÃ y!"));
            }
        }
        return ResponseEntity.ok(repository.findByThuCungId(id));
    }

    @PostMapping
    public ResponseEntity<?> save(@RequestBody LichSuTuVan tuVan) {
        // Báº¢O Máº¬T: Cháº·n hacker gá»i trá»±c tiáº¿p API nÃ y Ä‘á»ƒ bÆ¡m rÃ¡c dá»¯ liá»‡u
        return ResponseEntity.status(403).body(Map.of("message", "API ná»™i bá»™, khÃ´ng cho phÃ©p truy cáº­p trá»±c tiáº¿p!"));
    }
}

