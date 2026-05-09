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
        // BẢO MẬT: Kiểm tra IDOR - Ngăn khách hàng xem thú cưng của người khác
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        String username = (auth != null) ? auth.getName() : null;
        if (username == null || username.equals("anonymousUser")) {
            return ResponseEntity.status(401)
                    .body(Map.of("message", "Cảnh báo bảo mật: Yêu cầu không có Token xác thực hợp lệ!"));
        }
        com.rexi.pkty.entity.TaiKhoan tk = taiKhoanRepository.findByTenDangNhap(username).orElse(null);
        if (tk != null && tk.getId_vai_tro() != null && tk.getId_vai_tro().equals("5")) { // Là khách hàng
            if (!tk.getId_khach_hang().equals(idKhachHang)) {
                return ResponseEntity.status(403)
                        .body(Map.of("message", "Cảnh báo bảo mật: Bạn không có quyền xem dữ liệu của người khác!"));
            }
        }
        return ResponseEntity.ok(thuCungRepository.findByKhachHang(idKhachHang));
    }

    // API Cập nhật thông tin thú cưng (BẢO MẬT: Chống IDOR)
    @PutMapping("/{id}")
    public ResponseEntity<Object> updateThuCung(@PathVariable String id, @RequestBody ThuCung nv) {
        Optional<ThuCung> optional = thuCungRepository.findById(id);
        if (optional.isPresent()) {
            ThuCung tc = optional.get();

            // BẢO MẬT: Kiểm tra IDOR - Ngăn khách hàng sửa thú cưng của người khác
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                    .getContext().getAuthentication();
            String username = (auth != null) ? auth.getName() : null;
            boolean isCustomer = false;
            if (username != null && !username.equals("anonymousUser")) {
                com.rexi.pkty.entity.TaiKhoan tk = taiKhoanRepository.findByTenDangNhap(username).orElse(null);
                if (tk != null && tk.getId_vai_tro().equals("5")) { // Là khách hàng
                    isCustomer = true;
                    if (!tk.getId_khach_hang().equals(tc.getId_khach_hang())) {
                        return ResponseEntity.status(403).body(
                                Map.of("message", "Cảnh báo bảo mật: Bạn không có quyền sửa thú cưng của người khác!"));
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
                auditLogService.logAction("CẬP NHẬT", "ThuCung",
                        "Cập nhật thú cưng: " + saved.getTen_thu_cung() + " (ID: " + saved.getId_thu_cung() + ")");
            }
            return ResponseEntity.ok(saved);
        } else {
            return ResponseEntity.status(404).body(Map.of("message", "Không tìm thấy thú cưng để cập nhật!"));
        }
    }

    // API Thêm thú cưng mới
    @PostMapping
    public ResponseEntity<Object> addThuCung(@RequestBody ThuCung thuCung) {
        try {
            if (thuCung.getId_khach_hang() == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Lỗi: Thiếu ID Khách hàng!"));
            }

            // BẢO MẬT: Kiểm tra IDOR - Ngăn khách hàng thêm thú cưng vào tài khoản của
            // người khác
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                    .getContext().getAuthentication();
            String username = (auth != null) ? auth.getName() : null;
            boolean isCustomer = false;
            if (username != null && !username.equals("anonymousUser")) {
                com.rexi.pkty.entity.TaiKhoan tk = taiKhoanRepository.findByTenDangNhap(username).orElse(null);
                if (tk != null && tk.getId_vai_tro().equals("5")) { // Là khách hàng
                    isCustomer = true;
                    if (!tk.getId_khach_hang().equals(thuCung.getId_khach_hang())) {
                        return ResponseEntity.status(403).body(Map.of("message",
                                "Cảnh báo bảo mật: Bạn không có quyền thêm thú cưng cho khách hàng khác!"));
                    }
                }
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
                auditLogService.logAction("THÊM MỚI", "ThuCung",
                        "Thêm thú cưng: " + saved.getTen_thu_cung() + " cho khách hàng ID " + saved.getId_khach_hang());
            }
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi thêm thú cưng: " + e.getMessage()));
        }
    }

    // API Xóa thú cưng (Xóa mềm & Chống IDOR)
    @DeleteMapping("/{id}")
    public ResponseEntity<Object> deleteThuCung(@PathVariable String id) {
        Optional<ThuCung> optional = thuCungRepository.findById(id);
        if (optional.isPresent()) {
            ThuCung tc = optional.get();

            // BẢO MẬT: Kiểm tra IDOR
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                    .getContext().getAuthentication();
            String username = (auth != null) ? auth.getName() : null;
            boolean isCustomer = false;
            if (username != null && !username.equals("anonymousUser")) {
                com.rexi.pkty.entity.TaiKhoan tk = taiKhoanRepository.findByTenDangNhap(username).orElse(null);
                if (tk != null && tk.getId_vai_tro().equals("5")) { // Là khách hàng
                    isCustomer = true;
                    if (!tk.getId_khach_hang().equals(tc.getId_khach_hang())) {
                        return ResponseEntity.status(403).body(
                                Map.of("message", "Cảnh báo bảo mật: Bạn không có quyền xóa thú cưng của người khác!"));
                    }
                }
            }

            tc.setDa_xoa(true);
            thuCungRepository.save(tc);
            // GHI LOG
            if (!isCustomer) {
                auditLogService.logAction("XÓA", "ThuCung",
                        "Xóa thú cưng: " + tc.getTen_thu_cung() + " (ID: " + tc.getId_thu_cung() + ")");
            }
            return ResponseEntity.ok(Map.of("message", "Đã xóa thú cưng thành công!"));
        } else {
            return ResponseEntity.status(404).body(Map.of("message", "Không tìm thấy thú cưng này!"));
        }
    }
}

