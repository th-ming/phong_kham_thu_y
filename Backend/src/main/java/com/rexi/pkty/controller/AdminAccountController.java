package com.rexi.pkty.controller;

import com.rexi.pkty.entity.TaiKhoan;
import com.rexi.pkty.repository.TaiKhoanRepository;
import com.rexi.pkty.security.PasswordPolicy;
import com.rexi.pkty.service.AuditLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Bộ điều khiển quản lý tài khoản dành riêng cho Admin.
 * Chỉ Admin mới có quyền truy cập các chức năng trong này.
 * Bao gồm: Tìm kiếm tài khoản, đặt lại mật khẩu.
 */
@RestController
@RequestMapping("/api/admin")
public class AdminAccountController {

    @Autowired
    private TaiKhoanRepository taiKhoanRepository;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    /**
     * Tìm kiếm tài khoản theo tên đăng nhập, email hoặc số điện thoại.
     * Admin có thể tìm cả tài khoản nhân viên lẫn khách hàng.
     * Kết quả trả về KHÔNG chứa mật khẩu gốc (chỉ trả về hash).
     */
    @GetMapping("/tai-khoan")
    @PreAuthorize("hasRole('ADMIN')")
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
    @PreAuthorize("hasRole('ADMIN')")
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
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> resetPassword(@PathVariable String id) {
        Optional<TaiKhoan> opt = taiKhoanRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(404)
                    .body(Map.of("message", "Không tìm thấy tài khoản với ID: " + id));
        }

        TaiKhoan tk = opt.get();

        // Sinh mat khau tam thoi dat dung password policy hien tai.
        String matKhauTamThoi = "Rexi@" + UUID.randomUUID().toString().substring(0, 6);
        String matKhauHash = passwordEncoder.encode(matKhauTamThoi);

        // Cập nhật mật khẩu mới (đã băm) vào Database
        tk.setMat_khau("[ENCRYPTED]");
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
     * Admin được sửa trực tiếp thông tin tài khoản nhân viên: username, vai trò,
     * trạng thái và mật khẩu mới nếu cần.
     */
    @PutMapping("/tai-khoan/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateAccount(@PathVariable String id, @RequestBody Map<String, String> payload) {
        Optional<TaiKhoan> opt = taiKhoanRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.status(404)
                    .body(Map.of("message", "Không tìm thấy tài khoản với ID: " + id));
        }

        TaiKhoan tk = opt.get();

        String username = trimToNull(payload.get("ten_dang_nhap"));
        if (username != null && !username.equals(tk.getTen_dang_nhap())) {
            Optional<TaiKhoan> existed = taiKhoanRepository.findByTenDangNhap(username);
            if (existed.isPresent() && !id.equals(existed.get().getId_tai_khoan())) {
                return ResponseEntity.status(409)
                        .body(Map.of("message", "Tên đăng nhập đã tồn tại."));
            }
            tk.setTen_dang_nhap(username);
        }

        String roleId = trimToNull(payload.get("id_vai_tro"));
        if (roleId != null) {
            tk.setId_vai_tro(roleId);
        }

        String status = trimToNull(payload.get("trang_thai"));
        if (status != null) {
            tk.setTrang_thai(status);
        }

        String newPassword = trimToNull(payload.get("mat_khau"));
        if (newPassword != null) {
            if (!PasswordPolicy.isValid(newPassword)) {
                return ResponseEntity.badRequest().body(Map.of("message", PasswordPolicy.message()));
            }
            tk.setMat_khau("[ENCRYPTED]");
            tk.setMat_khau_hash(passwordEncoder.encode(newPassword));
        }

        taiKhoanRepository.save(tk);
        auditLogService.logAction("UPDATE", "TaiKhoan",
                "Admin cập nhật tài khoản: " + tk.getTen_dang_nhap() + " (ID: " + id + ")");

        return ResponseEntity.ok(toSafeMap(tk));
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
        m.put("id_tai_khoan", tk.getId_tai_khoan());
        m.put("id_nhan_vien", tk.getId_nhan_vien());
        m.put("id_khach_hang", tk.getId_khach_hang());
        m.put("mat_khau_hien_thi", null);
        m.put("nhan_vien", getNhanVienInfo(tk.getId_nhan_vien(), tk.getId_tai_khoan()));
        return m;
    }

    private Map<String, Object> getNhanVienInfo(String idNhanVien, String idTaiKhoan) {
        if ((idNhanVien == null || idNhanVien.isBlank()) && (idTaiKhoan == null || idTaiKhoan.isBlank())) return null;
        try {
            if (idNhanVien != null && !idNhanVien.isBlank()) {
                List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                        "SELECT ho_ten, email, so_dien_thoai, chuyen_mon FROM NhanVien WHERE id_nhan_vien = ?",
                        idNhanVien);
                if (!rows.isEmpty()) {
                    return rows.get(0);
                }
            }
            if (idTaiKhoan != null && !idTaiKhoan.isBlank()) {
                List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                        "SELECT ho_ten, email, so_dien_thoai, chuyen_mon FROM NhanVien WHERE id_tai_khoan = ?",
                        idTaiKhoan);
                return rows.isEmpty() ? null : rows.get(0);
            }
            return null;
        } catch (Exception ignored) {
            return null;
        }
    }

    private String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
