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
        // BẢO MẬT: Kiểm tra IDOR, ngăn chặn hacker đọc trộm đoạn chat của khách hàng
        // khác
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        String username = (auth != null) ? auth.getName() : null;

        if (username == null || username.equals("anonymousUser")) {
            return ResponseEntity.status(401)
                    .body(Map.of("message", "Cảnh báo bảo mật: Yêu cầu không có Token xác thực!"));
        }

        com.rexi.pkty.entity.TaiKhoan tk = taiKhoanRepository.findByTenDangNhap(username).orElse(null);
        if (tk != null && "VT-5".equals(tk.getId_vai_tro())) { // Là Khách hàng (Sử dụng ID đã chuẩn hóa)
            java.util.List<String> ownerIds = jdbcTemplate
                    .queryForList("SELECT id_khach_hang FROM ThuCung WHERE id_thu_cung = ?", String.class, id);
            if (ownerIds.isEmpty() || !ownerIds.get(0).equals(tk.getId_khach_hang())) {
                return ResponseEntity.status(403).body(
                        Map.of("message", "Cảnh báo bảo mật: Bạn không có quyền xem lịch sử tư vấn của thú cưng này!"));
            }
        }
        return ResponseEntity.ok(repository.findByThuCungId(id));
    }

    @PostMapping
    public ResponseEntity<?> save(@RequestBody LichSuTuVan tuVan) {
        // BẢO MẬT: Chặn hacker gọi trực tiếp API này để bơm rác dữ liệu
        return ResponseEntity.status(403).body(Map.of("message", "API nội bộ, không cho phép truy cập trực tiếp!"));
    }
}
