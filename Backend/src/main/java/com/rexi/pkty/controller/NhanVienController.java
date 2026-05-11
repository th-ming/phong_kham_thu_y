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
        return nhanVienRepository.findAllBacSi();
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
            nv.setIdNhanVien(id);
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
            if (nv.getIdNhanVien() == null || nv.getIdNhanVien().isEmpty()) {
                String cm = nv.getChuyenMon() != null ? nv.getChuyenMon().toLowerCase() : "";

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
                    nv.setIdNhanVien(newAdminId);
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

                    nv.setIdNhanVien(prefix + java.util.UUID.randomUUID().toString().substring(0, 6).toUpperCase());
                }
            }

            if (nv.getNgayVaoLam() == null)
                nv.setNgayVaoLam(LocalDate.now());
            nv.setTrangThai("Đang làm việc");
            nv.setDaXoa(false);

            // 2. Tự động tạo Tài Khoản Đăng Nhập cho nhân sự mới (Kèm Role tương ứng)
            if (nv.getEmail() != null && !nv.getEmail().isEmpty()) {
                String username = nv.getEmail().split("@")[0];
                if (taiKhoanRepository.findByTenDangNhap(username).isEmpty()) {
                    com.rexi.pkty.entity.TaiKhoan tk = new com.rexi.pkty.entity.TaiKhoan();
                    tk.setId_tai_khoan("TK-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase());
                    tk.setTen_dang_nhap(username);
                    tk.setMat_khau("rexi@123");
                    tk.setMat_khau_hash(passwordEncoder.encode("rexi@123"));

                    // Phân quyền Role chuẩn dựa theo ID vừa sinh (Đã đồng bộ với DB)
                    if (nv.getIdNhanVien().matches("\\d+"))
                        tk.setId_vai_tro("VT-ADMIN"); // Admin
                    else if (nv.getIdNhanVien().startsWith("QL-"))
                        tk.setId_vai_tro("VT-QL"); // Quản lý
                    else if (nv.getIdNhanVien().startsWith("BS-"))
                        tk.setId_vai_tro("VT-BS"); // Bác sĩ
                    else if (nv.getIdNhanVien().startsWith("KT-"))
                        tk.setId_vai_tro("VT-KT"); // Kế toán
                    else if (nv.getIdNhanVien().startsWith("TT-"))
                        tk.setId_vai_tro("VT-TT"); // Tiếp tân
                    else if (nv.getIdNhanVien().startsWith("YT-"))
                        tk.setId_vai_tro("VT-YT"); // Y tá
                    else
                        tk.setId_vai_tro("VT-TT"); // Nhân viên khác (CSKH, v.v.)

                    tk.setTrang_thai("active");
                    tk.setNgay_tao(LocalDateTime.now());

                    taiKhoanRepository.save(tk);
                    nv.setIdTaiKhoan(tk.getId_tai_khoan());
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
                nv.setDaXoa(true);
                nv.setTrangThai("Đã nghỉ việc");
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

    @GetMapping("/nhan-vien/reset-data")
    @org.springframework.cache.annotation.CacheEvict(value = "bacSiCache", allEntries = true)
    public String resetDoctors() {
        String[][] data = {
                { "BS. Minh Anh", "Nội khoa & Bệnh truyền nhiễm", "/img/bac_si_minh_anh.png",
                        "Chuyên gia hàng đầu về các bệnh truyền nhiễm và nội khoa thú y.", "minhanh@rexi.vn" },
                { "BS. Khánh Linh", "Phẫu thuật tổng quát", "/img/bac_si_khanh_linh.png",
                        "Bàn tay vàng trong làng phẫu thuật, tỉ mỉ và tận tâm.", "khanhlinh@rexi.vn" },
                { "BS. Hoàng Nam", "Chẩn đoán hình ảnh", "/img/bac_si_hoang_nam.png",
                        "Chuyên gia phân tích X-quang và Siêu âm với độ chính xác cao.", "hoangnam@rexi.vn" },
                { "BS. Thu Thủy", "Dinh dưỡng & Nội tiết", "/img/bac_si_thu_thuy.png",
                        "Tư vấn chế độ ăn uống và điều trị các bệnh nội tiết phức tạp.", "thuthuy@rexi.vn" },
                { "BS. Trần Minh", "Chuyên gia Phẫu thuật & Chỉnh hình", "/img/avtpkty.png",
                        "Người sáng lập với đam mê cứu chữa và phục hồi vận động cho thú cưng.", "tranminh@rexi.vn" }
        };

        for (String[] d : data) {
            String email = d[4];
            NhanVien nv = nhanVienRepository.findByEmail(email)
                    .orElseGet(() -> {
                        NhanVien newNv = new NhanVien();
                        newNv.setIdNhanVien(
                                "BS-" + java.util.UUID.randomUUID().toString().substring(0, 6).toUpperCase());
                        return newNv;
                    });

            nv.setHoTen(d[0]);
            nv.setChuyenMon(d[1]);
            nv.setHinhAnh(d[2]);
            nv.setGioiThieu(d[3]);
            nv.setEmail(email);
            nv.setSoDienThoai(nv.getSoDienThoai() != null ? nv.getSoDienThoai() : "0123456789");

            if (nv.getNgayVaoLam() == null) {
                nv.setNgayVaoLam(LocalDate.now().minusYears(1));
            }
            nv.setTrangThai("Đang làm việc");
            nv.setDaXoa(false);

            try {
                // Đảm bảo nhân viên này có tài khoản và vai trò Bác sĩ (VT-8)
                com.rexi.pkty.entity.TaiKhoan tk = taiKhoanRepository.findByTenDangNhap(email.split("@")[0])
                        .orElseGet(() -> {
                            com.rexi.pkty.entity.TaiKhoan newTk = new com.rexi.pkty.entity.TaiKhoan();
                            newTk.setId_tai_khoan(
                                    "TK-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase());
                            return newTk;
                        });
                tk.setTen_dang_nhap(email.split("@")[0]);
                if (tk.getMat_khau() == null) {
                    tk.setMat_khau("123456");
                    tk.setMat_khau_hash(passwordEncoder.encode("123456"));
                }
                tk.setId_vai_tro("VT-BS"); // Bác sĩ
                tk.setTrang_thai("active");
                if (tk.getNgay_tao() == null)
                    tk.setNgay_tao(LocalDateTime.now());
                tk = taiKhoanRepository.save(tk);

                nv.setIdTaiKhoan(tk.getId_tai_khoan());
                nhanVienRepository.save(nv);
            } catch (Exception e) {
                System.err.println("Lỗi đồng bộ bác sĩ " + d[0] + ": " + e.getMessage());
            }
        }
        return "Đã đồng bộ dùng bác sĩ thành công!";
    }
}
