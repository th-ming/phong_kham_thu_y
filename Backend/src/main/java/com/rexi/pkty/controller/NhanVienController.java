package com.rexi.pkty.controller;

import com.rexi.pkty.entity.LichLamViecNhanVien;
import com.rexi.pkty.entity.NhanVien;
import com.rexi.pkty.repository.LichLamViecNhanVienRepository;
import com.rexi.pkty.repository.NhanVienRepository;
import com.rexi.pkty.repository.TaiKhoanRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.jdbc.core.JdbcTemplate;
import com.rexi.pkty.service.AuditLogService;
import jakarta.annotation.PostConstruct;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.time.LocalDate;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "${cors.allowed-origins:http://localhost:3000}")
public class NhanVienController {

    @Autowired
    private NhanVienRepository nhanVienRepository;

    @Autowired
    private LichLamViecNhanVienRepository lichLamViecRepository;

    @Autowired
    private TaiKhoanRepository taiKhoanRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private AuditLogService auditLogService;

    @GetMapping("/nhan-vien")
    public List<NhanVien> getAllNhanVien() {
        return nhanVienRepository.findAll();
    }

    @GetMapping("/bac-si")
    @org.springframework.cache.annotation.Cacheable(value = "bacSiCache")
    public List<NhanVien> getBacSi() {
        try {
            return nhanVienRepository.findAllBacSi();
        } catch (Exception e) {
            System.err.println("Lỗi lấy danh sách bác sĩ: " + e.getMessage());
            return new java.util.ArrayList<>();
        }
    }

    @GetMapping("/bac-si/thong-ke")
    public List<Map<String, Object>> getBacSiStats() {
        return nhanVienRepository.getBacSiStats();
    }

    @GetMapping("/nhan-vien/lich-lam-viec")
    public List<LichLamViecNhanVien> getLichLamViec(@RequestParam(required = false) String id_nhan_vien) {
        if (id_nhan_vien != null) {
            return lichLamViecRepository.findByIdNhanVien(id_nhan_vien);
        }
        return lichLamViecRepository.findAll();
    }

    @PostMapping("/nhan-vien/lich-lam-viec")
    public org.springframework.http.ResponseEntity<?> addLichLamViec(@RequestBody LichLamViecNhanVien lich) {
        try {
            return org.springframework.http.ResponseEntity.ok(lichLamViecRepository.save(lich));
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.status(500)
                    .body(Map.of("message", "Lỗi lưu lịch làm việc: " + e.getMessage()));
        }
    }

    @DeleteMapping("/nhan-vien/lich-lam-viec/{id}")
    public org.springframework.http.ResponseEntity<?> deleteLichLamViec(@PathVariable Long id) {
        try {
            lichLamViecRepository.deleteById(id);
            return org.springframework.http.ResponseEntity.ok(Map.of("message", "Đã hủy ca trực thành công."));
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.status(500).body(Map.of("message",
                    "Không thể hủy ca! Khung giờ này đã có khách hàng đặt lịch hẹn. Vui lòng liên hệ lễ tân để dời lịch của khách."));
        }
    }

    @GetMapping("/nhan-vien/profile/{id}")
    public NhanVien getProfile(@PathVariable String id) {
        return nhanVienRepository.findById(id).orElse(null);
    }

    @PutMapping("/nhan-vien/{id}")
    @org.springframework.cache.annotation.CacheEvict(value = "bacSiCache", allEntries = true)
    public org.springframework.http.ResponseEntity<?> updateNhanVien(@PathVariable String id,
            @RequestBody NhanVien nv) {
        try {
            nv.setId_nhan_vien(id);
            return org.springframework.http.ResponseEntity.ok(nhanVienRepository.save(nv));
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.status(500)
                    .body(Map.of("message", "Lỗi khi cập nhật nhân viên: " + e.getMessage()));
        }
    }

    @PostMapping("/nhan-vien")
    @org.springframework.cache.annotation.CacheEvict(value = "bacSiCache", allEntries = true)
    public org.springframework.http.ResponseEntity<?> addNhanVien(@RequestBody NhanVien nv) {
        try {
            // 1. Tự động sinh ID theo chức vụ / chuyên môn (Admin: 1-99, Quản lý: QL-, etc.)
            if (nv.getId_nhan_vien() == null || nv.getId_nhan_vien().isEmpty()) {
                String cm = nv.getChuyen_mon() != null ? nv.getChuyen_mon().toLowerCase() : "";

                if (cm.contains("admin") || cm.contains("tối cao")) {
                    // Cấp ID từ 1 đến 99 CHỈ dành cho Admin
                    String newAdminId = null;
                    List<String> existingIds = jdbcTemplate.queryForList("SELECT id_nhan_vien FROM NhanVien", String.class);
                    for (int i = 1; i <= 99; i++) {
                        if (!existingIds.contains(String.valueOf(i))) {
                            newAdminId = String.valueOf(i);
                            break;
                        }
                    }
                    if (newAdminId == null) {
                        return org.springframework.http.ResponseEntity.status(400).body(Map.of("message", "Đã hết ID (1-99) dành cho Admin!"));
                    }
                    nv.setId_nhan_vien(newAdminId);
                } else {
                    // Cấp ID cho các chức vụ khác có tiền tố (Prefix)
                    String prefix = "NV-";
                    if (cm.contains("quản lý") || cm.contains("manager")) {
                        prefix = "QL-";
                    } else if (cm.contains("tiếp tân") || cm.contains("lễ tân")) {
                        prefix = "TT-";
                    } else if (cm.contains("bác sĩ") || cm.contains("doctor")) {
                        prefix = "BS-";
                    } else if (cm.contains("kế toán")) {
                        prefix = "KT-";
                    } else if (cm.contains("y tá") || cm.contains("điều dưỡng") || cm.contains("nurse")) {
                        prefix = "YT-";
                    } else if (cm.contains("chăm sóc khách hàng") || cm.contains("marketing") || cm.contains("cskh")) {
                        prefix = "CS-";
                    }

                    nv.setId_nhan_vien(prefix + java.util.UUID.randomUUID().toString().substring(0, 6).toUpperCase());
                }
            }

            if (nv.getNgay_vao_lam() == null)
                nv.setNgay_vao_lam(LocalDate.now());
            nv.setTrang_thai("ACTIVE");
            nv.setDa_xoa(false);

            // 2. Tự động tạo Tài Khoản Đăng Nhập cho nhân sự mới (Kèm Role tương ứng)
            if (nv.getEmail() != null && !nv.getEmail().isEmpty()) {
                String username = nv.getEmail().split("@")[0];
                if (taiKhoanRepository.findByTenDangNhap(username).isEmpty()) {
                    com.rexi.pkty.entity.TaiKhoan tk = new com.rexi.pkty.entity.TaiKhoan();
                    tk.setId_tai_khoan("TK-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase());
                    tk.setTen_dang_nhap(username);
                    tk.setId_nhan_vien(nv.getId_nhan_vien());

                    // Phân quyền Role chuẩn dựa theo ID vừa sinh (Đã đồng bộ với DB)
                    if (nv.getId_nhan_vien().matches("\\d+"))
                        tk.setId_vai_tro("VT-ADMIN"); // Admin
                    else if (nv.getId_nhan_vien().startsWith("QL-"))
                        tk.setId_vai_tro("VT-QL"); // Quản lý
                    else if (nv.getId_nhan_vien().startsWith("BS-"))
                        tk.setId_vai_tro("VT-BS"); // Bác sĩ
                    else if (nv.getId_nhan_vien().startsWith("KT-"))
                        tk.setId_vai_tro("VT-KT"); // Kế toán
                    else if (nv.getId_nhan_vien().startsWith("TT-"))
                        tk.setId_vai_tro("VT-TT"); // Tiếp tân
                    else if (nv.getId_nhan_vien().startsWith("YT-"))
                        tk.setId_vai_tro("VT-YT"); // Y tá
                    else
                        tk.setId_vai_tro("VT-3"); // Nhân viên mặc định (VT-3)

                    tk.setTrang_thai("active");
                    tk.setNgay_tao(LocalDateTime.now());

                    // Đặt mật khẩu (Mã hóa)
                    String rawPassword = (nv.getMat_khau() != null && !nv.getMat_khau().isEmpty()) ? nv.getMat_khau() : "Rexi@123";
                    String encodedPassword = passwordEncoder.encode(rawPassword);
                    tk.setMat_khau(encodedPassword);
                    tk.setMat_khau_hash(encodedPassword);

                    taiKhoanRepository.save(tk);
                    nv.setId_tai_khoan(tk.getId_tai_khoan());
                }
            }

            return org.springframework.http.ResponseEntity.ok(nhanVienRepository.save(nv));
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.status(500)
                    .body(Map.of("message", "Lỗi khi thêm nhân viên: " + e.getMessage()));
        }
    }

    @DeleteMapping("/nhan-vien/{id}")
    @org.springframework.cache.annotation.CacheEvict(value = "bacSiCache", allEntries = true)
    public org.springframework.http.ResponseEntity<?> deleteNhanVien(@PathVariable String id) {
        try {
            Optional<NhanVien> nvOpt = nhanVienRepository.findById(id);
            if (nvOpt.isPresent()) {
                NhanVien nv = nvOpt.get();
                nv.setDa_xoa(true);
                nv.setTrang_thai("INACTIVE");
                nhanVienRepository.save(nv);
                return org.springframework.http.ResponseEntity.ok(Map.of("message", "Đã xóa nhân viên thành công!"));
            }
            return org.springframework.http.ResponseEntity.status(404)
                    .body(Map.of("message", "Không tìm thấy nhân viên!"));
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.status(500)
                    .body(Map.of("message", "Lỗi: " + e.getMessage()));
        }
    }


}
