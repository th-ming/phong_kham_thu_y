package com.rexi.pkty.controller;

import com.rexi.pkty.entity.TaiKhoan;
import com.rexi.pkty.repository.TaiKhoanRepository;
import com.rexi.pkty.service.AuditLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Bộ điều khiển quản lý tài khoản dành riêng cho Admin.
 * Chỉ Admin mới có quyền truy cập các chức năng trong này.
 * Bao gồm: Tìm kiếm tài khoản, đặt lại mật khẩu.
 */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAccountController {

    @Autowired
    private TaiKhoanRepository taiKhoanRepository;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    /**
     * Tìm kiếm tài khoản theo tên đăng nhập, email hoặc số điện thoại.
     * Admin có thể tìm cả tài khoản nhân viên lẫn khách hàng.
     * Kết quả trả về KHÔNG chứa mật khẩu gốc (chỉ trả về hash).
     */
    @GetMapping("/tai-khoan")
    public ResponseEntity<?> findAccount(
            @RequestParam(required = false) String username,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) String phone) {

        List<TaiKhoan> result = new ArrayList<>();

        if (username != null && !username.isEmpty()) {
            // Tìm theo tên đăng nhập
            Optional<TaiKhoan> found = taiKhoanRepository.findByTenDangNhap(username);
            found.ifPresent(result::add);
        } else if (email != null && !email.isEmpty()) {
            // Tìm theo email (xuyên bảng Khách hàng & Nhân viên)
            result = taiKhoanRepository.findByEmail(email);
        } else if (phone != null && !phone.isEmpty()) {
            // Tìm theo số điện thoại (xuyên bảng Khách hàng & Nhân viên)
            result = taiKhoanRepository.findBySdt(phone);
        } else {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Vui lòng nhập ít nhất một tiêu chí tìm kiếm (username, email hoặc phone)."));
        }

        if (result.isEmpty()) {
            return ResponseEntity.status(404)
                    .body(Map.of("message", "Không tìm thấy tài khoản nào phù hợp."));
        }

        // Chuyển đổi kết quả sang dạng an toàn (không trả mật khẩu gốc)
        List<Map<String, Object>> safeResult = result.stream()
                .map(this::toSafeMap)
                .collect(Collectors.toList());

        // Ghi nhật ký hành động Admin
        String criteria = username != null ? "username=" + username
                : email != null ? "email=" + email
                : "phone=" + phone;
        auditLogService.logAction("READ", "TaiKhoan",
                "Admin tìm kiếm tài khoản theo " + criteria);

        return ResponseEntity.ok(safeResult);
    }

    /**
     * Lấy danh sách toàn bộ tài khoản trong hệ thống.
     * Chỉ Admin mới được phép gọi.
     */
    @GetMapping("/tai-khoan/tat-ca")
    public ResponseEntity<?> getAllAccounts() {
        List<TaiKhoan> all = taiKhoanRepository.findAll();

        List<Map<String, Object>> safeResult = all.stream()
                .map(this::toSafeMap)
                .collect(Collectors.toList());

        auditLogService.logAction("READ", "TaiKhoan",
                "Admin xem toàn bộ danh sách tài khoản (" + all.size() + " tài khoản)");

        return ResponseEntity.ok(safeResult);
    }

    /**
     * Đặt lại mật khẩu cho tài khoản bất kỳ (nhân viên hoặc khách hàng).
     * Hệ thống sẽ tạo mật khẩu tạm thời và trả về cho Admin.
     * Admin thông báo mật khẩu mới cho người dùng qua kênh riêng.
     */
    @PostMapping("/tai-khoan/{id}/reset-mk")
    public ResponseEntity<?> resetPassword(@PathVariable String id) {
        Optional<TaiKhoan> opt = taiKhoanRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(404)
                    .body(Map.of("message", "Không tìm thấy tài khoản với ID: " + id));
        }

        TaiKhoan tk = opt.get();

        // Sinh mật khẩu tạm thời ngẫu nhiên (6 ký tự)
        String matKhauTamThoi = "Rexi@" + UUID.randomUUID().toString().substring(0, 6);
        String matKhauHash = passwordEncoder.encode(matKhauTamThoi);

        // Cập nhật mật khẩu mới (đã băm) vào Database
        tk.setMat_khau(matKhauHash);
        tk.setMat_khau_hash(matKhauHash);
        taiKhoanRepository.save(tk);

        // Ghi nhật ký hành động Admin
        auditLogService.logAction("UPDATE", "TaiKhoan",
                "Admin đặt lại mật khẩu cho tài khoản: " + tk.getTen_dang_nhap() + " (ID: " + id + ")");

        return ResponseEntity.ok(Map.of(
                "message", "Đã đặt lại mật khẩu thành công!",
                "ten_dang_nhap", tk.getTen_dang_nhap(),
                "mat_khau_tam_thoi", matKhauTamThoi,
                "luu_y", "Vui lòng yêu cầu người dùng đổi mật khẩu ngay sau khi đăng nhập."
        ));
    }

    /**
     * Chuyển đổi TaiKhoan thành Map an toàn (không chứa mật khẩu gốc).
     * Chỉ trả về các trường công khai + hash để Admin xác minh.
     */
    private Map<String, Object> toSafeMap(TaiKhoan tk) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id_tai_khoan", tk.getId_tai_khoan());
        m.put("ten_dang_nhap", tk.getTen_dang_nhap());
        m.put("id_vai_tro", tk.getId_vai_tro());
        m.put("trang_thai", tk.getTrang_thai());
        m.put("ngay_tao", tk.getNgay_tao());
        m.put("id_nhan_vien", tk.getId_nhan_vien());
        m.put("id_khach_hang", tk.getId_khach_hang());
        // Mật khẩu chỉ trả về dạng hash (không thể đọc ngược)
        m.put("mat_khau_hash", tk.getMat_khau_hash());
        return m;
    }
}
