package com.rexi.pkty.controller;

import com.rexi.pkty.entity.KhachHang;
import com.rexi.pkty.repository.KhachHangRepository;
import com.rexi.pkty.service.KhachHangService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.rexi.pkty.entity.TaiKhoan;
import com.rexi.pkty.repository.TaiKhoanRepository;

@RestController
@RequestMapping("/api/khach-hang")
@CrossOrigin(origins = "${cors.allowed-origins:http://localhost:3000}")
public class KhachHangController {

    @Autowired
    private KhachHangService khachHangService;

    @Autowired
    private KhachHangRepository khachHangRepository;

    @Autowired
    private TaiKhoanRepository taiKhoanRepository;

    @Autowired
    private com.rexi.pkty.service.AuditLogService auditLogService;

    // BẢO MẬT: Kiểm tra quyền nhân viên nội bộ
    private boolean isInternalStaff() {
        org.springframework.security.core.Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName().equals("anonymousUser"))
            return false;
        String role = auth.getAuthorities().toString().toUpperCase();
        // Chỉ cho phép nhân viên nội bộ xem danh sách khách
        return role.contains("ADMIN") || role.contains("STAFF") || role.contains("BAC_SI") || role.contains("QUAN_LY")
                || role.contains("KETOAN");
    }

    // Lấy danh sách khách hàng
    @GetMapping
    public ResponseEntity<?> getAll() {
        if (!isInternalStaff()) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Cảnh báo bảo mật: Bạn không có quyền xem danh sách khách hàng!"));
        }
        return ResponseEntity.ok(khachHangService.getAllKhachHang());
    }

    // Đếm tổng số khách hàng (cho Dashboard)
    @GetMapping("/count")
    public ResponseEntity<?> countAll() {
        if (!isInternalStaff()) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Cảnh báo bảo mật: Bạn không có quyền xem thống kê!"));
        }
        return ResponseEntity.ok(khachHangRepository.count());
    }

    // Tìm kiếm khách hàng theo SĐT (cho form đặt lịch của Admin)
    @GetMapping("/search")
    public ResponseEntity<?> searchBySdt(@RequestParam String sdt) {
        if (!isInternalStaff()) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Cảnh báo bảo mật: Bạn không có quyền tìm kiếm khách hàng!"));
        }
        return ResponseEntity.ok(khachHangRepository.findBySdtContaining(sdt));
    }

    // Lấy thông tin 1 khách hàng theo ID
    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable String id) {
        // BẢO MẬT: Kiểm tra IDOR - Ngăn khách hàng xem thông tin của người khác
        org.springframework.security.core.Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String username = (auth != null) ? auth.getName() : null;
        if (username != null && !username.equals("anonymousUser")) {
            Optional<TaiKhoan> tkOpt = taiKhoanRepository.findByTenDangNhap(username);
            if (tkOpt.isPresent()) {
                TaiKhoan tk = tkOpt.get();
                if (tk.getId_vai_tro() != null && tk.getId_vai_tro().equals("VT-5")) { // Là khách hàng
                    if (!tk.getId_khach_hang().equals(id)) {
                        return ResponseEntity.status(403).body(Map.of("message",
                                "Cảnh báo bảo mật: Bạn không có quyền xem thông tin của người khác!"));
                    }
                }
            }
        }

        return khachHangRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Cập nhật thông tin khách hàng (Dùng Stored Procedure)
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id, @RequestBody KhachHang kh) {
        try {
            // BẢO MẬT: Kiểm tra IDOR (Xác minh quyền sở hữu)
            org.springframework.security.core.Authentication auth = SecurityContextHolder.getContext()
                    .getAuthentication();
            String username = (auth != null) ? auth.getName() : null;

            if (username == null || username.equals("anonymousUser")) {
                return ResponseEntity.status(401)
                        .body(Map.of("message", "Cảnh báo bảo mật: Yêu cầu không có Token xác thực hợp lệ!"));
            }

            Optional<TaiKhoan> tkOpt = taiKhoanRepository.findByTenDangNhap(username);
            boolean isKhachHang = false;
            boolean isOwner = false;

            if (tkOpt.isPresent()) {
                TaiKhoan tk = tkOpt.get();
                isKhachHang = tk.getId_vai_tro() != null && tk.getId_vai_tro().equals("VT-5");
                isOwner = tk.getId_khach_hang() != null && tk.getId_khach_hang().equals(id);

                if (isKhachHang && !isOwner) {
                    return ResponseEntity.status(403).body(Map.of("message",
                            "Cảnh báo bảo mật: Bạn không có quyền chỉnh sửa thông tin của người khác!"));
                }
            }

            List<Map<String, Object>> result = khachHangRepository.callSpUpdateKhachHang(
                    id,
                    kh.getTen_khach_hang(),
                    kh.getEmail(),
                    kh.getSdt(),
                    kh.getDia_chi());

            if (result != null && !result.isEmpty()) {
                // GHI LOG
                if (!isKhachHang) {
                    auditLogService.logAction("CẬP NHẬT", "KhachHang", "Cập nhật thông tin khách hàng ID " + id);
                }
                return ResponseEntity.ok(result.get(0));
            }
            return ResponseEntity.ok(Map.of("message", "Cập nhật thành công!"));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", "Lỗi cập nhật: " + e.getMessage()));
        }
    }

    // Vô hiệu hóa tài khoản (Vùng nguy hiểm)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deactivate(@PathVariable String id) {
        try {
            // BẢO MẬT: Kiểm tra IDOR (Xác minh quyền sở hữu)
            org.springframework.security.core.Authentication auth = SecurityContextHolder.getContext()
                    .getAuthentication();
            String username = (auth != null) ? auth.getName() : null;

            if (username == null || username.equals("anonymousUser")) {
                return ResponseEntity.status(401)
                        .body(Map.of("message", "Cảnh báo bảo mật: Yêu cầu không có Token xác thực hợp lệ!"));
            }

            Optional<TaiKhoan> tkOpt = taiKhoanRepository.findByTenDangNhap(username);
            boolean isKhachHang = false;
            boolean isOwner = false;
            if (tkOpt.isPresent()) {
                TaiKhoan tk = tkOpt.get();
                isKhachHang = tk.getId_vai_tro() != null && tk.getId_vai_tro().equals("VT-5");
                isOwner = tk.getId_khach_hang() != null && tk.getId_khach_hang().equals(id);
                if (isKhachHang && !isOwner) {
                    return ResponseEntity.status(403).body(Map.of("message",
                            "Cảnh báo bảo mật: Bạn không có quyền vô hiệu hóa tài khoản của người khác!"));
                }
            }

            khachHangRepository.deactivateAccountByKhachHangId(id);

            // BẢO MẬT: Khóa luôn tài khoản đăng nhập để ngăn chặn việc khách hàng dùng mật
            // khẩu cũ đăng nhập lại
            Optional<TaiKhoan> tkToLock = taiKhoanRepository.findByIdKhachHang(id);
            if (tkToLock.isPresent()) {
                TaiKhoan tkLocked = tkToLock.get();
                tkLocked.setTrang_thai("Đã khóa");
                taiKhoanRepository.save(tkLocked);
            }

            // GHI LOG
            if (!isKhachHang) {
                auditLogService.logAction("VÔ HIỆU HÓA", "KhachHang", "Vô hiệu hóa khách hàng ID " + id);
            }

            return ResponseEntity.ok(Map.of("message", "Vô hiệu hóa tài khoản thành công!"));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", "Lỗi: " + e.getMessage()));
        }
    }

    // Phục hồi / Mở khóa tài khoản (Chỉ dành cho Admin)
    @PutMapping("/{id}/unlock")
    public ResponseEntity<?> unlock(@PathVariable String id) {
        try {
            // BẢO MẬT: Kiểm tra quyền Admin
            org.springframework.security.core.Authentication auth = SecurityContextHolder.getContext()
                    .getAuthentication();
            String currentRole = (auth != null && auth.getAuthorities() != null) ? auth.getAuthorities().toString()
                    : "";

            if (!currentRole.toUpperCase().contains("ADMIN")) {
                return ResponseEntity.status(403)
                        .body(Map.of("message", "Cảnh báo bảo mật: Chỉ Admin mới có quyền mở khóa tài khoản!"));
            }

            // Mở khóa hồ sơ Khách hàng (Bỏ đánh dấu xóa)
            khachHangRepository.findById(id).ifPresent(kh -> {
                kh.setDa_xoa(false);
                khachHangRepository.save(kh);
            });

            // Mở khóa quyền đăng nhập
            Optional<TaiKhoan> tkToUnlock = taiKhoanRepository.findByIdKhachHang(id);
            if (tkToUnlock.isPresent()) {
                TaiKhoan tkUnlocked = tkToUnlock.get();
                tkUnlocked.setTrang_thai("Hoạt động");
                taiKhoanRepository.save(tkUnlocked);
            }

            // GHI LOG
            auditLogService.logAction("MỞ KHÓA", "KhachHang", "Phục hồi và mở khóa khách hàng ID " + id);

            return ResponseEntity.ok(Map.of("message", "Đã phục hồi và mở khóa tài khoản thành công!"));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", "Lỗi: " + e.getMessage()));
        }
    }
}
