package com.rexi.pkty.controller;

import com.rexi.pkty.entity.LichLamViecNhanVien;
import com.rexi.pkty.entity.NhanVien;
import com.rexi.pkty.repository.LichLamViecNhanVienRepository;
import com.rexi.pkty.repository.NhanVienRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "${cors.allowed-origins:http://localhost:3000}")
public class NhanVienController {

    @Autowired
    private NhanVienRepository nhanVienRepository;

    @Autowired
    private LichLamViecNhanVienRepository lichLamViecRepository;

    @Autowired
    private com.rexi.pkty.repository.TaiKhoanRepository taiKhoanRepository;

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Autowired
    private com.rexi.pkty.service.AuditLogService auditLogService;

    @jakarta.annotation.PostConstruct
    public void initData() {
        try {
            resetDoctors();
            initAdminAccount();
            initKetoanAccount();
        } catch (Exception e) {
            System.err.println("Lỗi tự động đồng bộ hệ thống: " + e.getMessage());
        }
    }

    private void initAdminAccount() {
        // Cập nhật hoặc tạo mới Admin
        com.rexi.pkty.entity.TaiKhoan adminTk = taiKhoanRepository.findByTenDangNhap("admin")
                .orElse(new com.rexi.pkty.entity.TaiKhoan());

        adminTk.setTen_dang_nhap("admin");
        adminTk.setMat_khau("123456"); // Không để null vì DB ràng buộc NOT NULL
        adminTk.setMat_khau_hash(passwordEncoder.encode("123456"));
        adminTk.setId_vai_tro("4"); // Quản lý
        adminTk.setTrang_thai("Hoạt động");
        if (adminTk.getNgay_tao() == null)
            adminTk.setNgay_tao(java.time.LocalDateTime.now());

        adminTk = taiKhoanRepository.save(adminTk);

        // Đảm bảo Admin có hồ sơ nhân viên
        if (nhanVienRepository.findByEmail("admin@rexi.vn").isEmpty()) {
            com.rexi.pkty.entity.NhanVien adminProfile = new com.rexi.pkty.entity.NhanVien();
            adminProfile.setHo_ten("Admin Tối Cao");
            adminProfile.setEmail("admin@rexi.vn");
            adminProfile.setSo_dien_thoai("0999999999");
            adminProfile.setChuyen_mon("Quản lý");
            adminProfile.setNgay_vao_lam(java.time.LocalDate.now());
            adminProfile.setTrang_thai("Đang làm việc");
            adminProfile.setDa_xoa(false);
            adminProfile.setId_tai_khoan(adminTk.getId_tai_khoan());
            nhanVienRepository.save(adminProfile);
        }
        System.out.println("✅ Đã đồng bộ tài khoản Admin (admin / 123456)");
    }

    private void initKetoanAccount() {
        // Cập nhật hoặc tạo mới Kế toán
        com.rexi.pkty.entity.TaiKhoan ktTk = taiKhoanRepository.findByTenDangNhap("ketoan")
                .orElse(new com.rexi.pkty.entity.TaiKhoan());

        ktTk.setTen_dang_nhap("ketoan");
        ktTk.setMat_khau("123456"); // Không để null
        ktTk.setMat_khau_hash(passwordEncoder.encode("123456"));

        String sqlRole = "SELECT id_vai_tro FROM VaiTroHeThong WHERE ten_vai_tro LIKE N'%Kế toán%'";
        try {
            java.util.List<String> roles = jdbcTemplate.queryForList(sqlRole, String.class);
            String roleId = roles.isEmpty() ? "3" : roles.get(0);
            ktTk.setId_vai_tro(roleId);
            ktTk.setTrang_thai("Hoạt động");
            if (ktTk.getNgay_tao() == null)
                ktTk.setNgay_tao(java.time.LocalDateTime.now());
            ktTk = taiKhoanRepository.save(ktTk);

            // TẠO HỒ SƠ NHÂN SỰ CHO KẾ TOÁN (Như các nhân sự bình thường khác)
            if (nhanVienRepository.findByEmail("ketoan@rexi.vn").isEmpty()) {
                com.rexi.pkty.entity.NhanVien ktProfile = new com.rexi.pkty.entity.NhanVien();
                ktProfile.setHo_ten("Trần Kế Toán");
                ktProfile.setEmail("ketoan@rexi.vn");
                ktProfile.setSo_dien_thoai("0977777777");
                ktProfile.setChuyen_mon("Kế toán");
                ktProfile.setNgay_vao_lam(java.time.LocalDate.now());
                ktProfile.setTrang_thai("Đang làm việc");
                ktProfile.setDa_xoa(false);
                ktProfile.setId_tai_khoan(ktTk.getId_tai_khoan());
                nhanVienRepository.save(ktProfile);
            }

            System.out.println("✅ Đã đồng bộ tài khoản Kế toán (ketoan / 123456)");
        } catch (Exception e) {
            System.err.println("Lỗi đồng bộ kế toán: " + e.getMessage());
        }
    }

    // Lấy danh sách toàn bộ nhân viên
    @GetMapping("/nhan-vien")
    public List<NhanVien> getAllNhanVien() {
        return nhanVienRepository.findAll();
    }

    // Lấy danh sách bác sĩ
    @GetMapping("/bac-si")
    @org.springframework.cache.annotation.Cacheable(value = "bacSiCache")
    public List<NhanVien> getBacSi() {
        return nhanVienRepository.findAllBacSi();
    }

    // Lấy thống kê bác sĩ từ View
    @GetMapping("/bac-si/thong-ke")
    public List<Map<String, Object>> getBacSiStats() {
        return nhanVienRepository.getBacSiStats();
    }

    // Lấy lịch làm việc nhân viên
    @GetMapping("/nhan-vien/lich-lam-viec")
    public List<LichLamViecNhanVien> getLichLamViec(@RequestParam(required = false) String id_nhan_vien) {
        if (id_nhan_vien != null) {
            return lichLamViecRepository.findByIdNhanVien(id_nhan_vien);
        }
        return lichLamViecRepository.findAll();
    }

    // Đăng ký ca làm việc mới
    @PostMapping("/nhan-vien/lich-lam-viec")
    public org.springframework.http.ResponseEntity<?> addLichLamViec(@RequestBody LichLamViecNhanVien lich) {
        try {
            return org.springframework.http.ResponseEntity.ok(lichLamViecRepository.save(lich));
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.status(500)
                    .body(Map.of("message", "Lỗi lưu lịch làm việc: " + e.getMessage()));
        }
    }

    // Xóa ca làm việc (Báo bận)
    @DeleteMapping("/nhan-vien/lich-lam-viec/{id}")
    public org.springframework.http.ResponseEntity<?> deleteLichLamViec(@PathVariable String id) {
        try {
            // NOTE: CƠ CHẾ RÀO LỖI (CHỐNG XUNG ĐỘT 3 LỚP) SẼ BẮT LỖI TẠI ĐÂY NẾU CÓ RÀNG
            // BUỘC KHOÁ NGOẠI VỚI BẢNG LỊCH HẸN
            lichLamViecRepository.deleteById(id);
            return org.springframework.http.ResponseEntity.ok(Map.of("message", "Đã hủy ca trực thành công."));
        } catch (Exception e) {
            // Nếu dính khóa ngoại (Đã có khách đặt lịch), SQL sẽ throw exception, ta hứng
            // và báo lỗi
            return org.springframework.http.ResponseEntity.status(500).body(Map.of("message",
                    "Không thể hủy ca! Khung giờ này đã có khách hàng đặt lịch hẹn. Vui lòng liên hệ lễ tân để dời lịch của khách."));
        }
    }

    // Lấy thông tin chi tiết 1 nhân viên
    @GetMapping("/nhan-vien/profile/{id}")
    public NhanVien getProfile(@PathVariable String id) {
        return nhanVienRepository.findById(id).orElse(null);
    }

    // Cập nhật thông tin nhân viên
    @PutMapping("/nhan-vien/{id}")
    @org.springframework.cache.annotation.CacheEvict(value = "bacSiCache", allEntries = true)
    public org.springframework.http.ResponseEntity<?> updateNhanVien(@PathVariable String id,
            @RequestBody NhanVien nv) {
        try {
            // BẢO MẬT: Đọc quyền mã hóa chuẩn từ Security Context, không tin tưởng Header
            // từ ngoài gửi vào
            org.springframework.security.core.Authentication authentication = org.springframework.security.core.context.SecurityContextHolder
                    .getContext().getAuthentication();
            String currentRole = "";
            if (authentication != null && authentication.getAuthorities() != null) {
                currentRole = authentication.getAuthorities().toString();
            }

            // BẢO MẬT: Chỉ Admin và Quản lý mới có quyền quản lý nhân sự
            if (!currentRole.toUpperCase().contains("ADMIN") && !currentRole.toUpperCase().contains("QUANLY")) {
                return org.springframework.http.ResponseEntity.status(403)
                        .body(Map.of("message",
                                "Cảnh báo bảo mật: Chỉ Admin và Quản lý mới có quyền cập nhật thông tin nhân sự!"));
            }

            // BẢO MẬT: Chống tự ý đổi trạng thái nghỉ việc của cấp Quản lý hoặc ADMIN
            NhanVien nvCu = nhanVienRepository.findById(id).orElse(null);
            boolean isTargetAdmin = (nvCu != null && ("Quản lý".equalsIgnoreCase(nvCu.getChuyen_mon())
                    || "Admin".equalsIgnoreCase(nvCu.getChuyen_mon())));

            if (isTargetAdmin && "Đã nghỉ việc".equalsIgnoreCase(nv.getTrang_thai())) {
                // Cho phép sửa nếu người đang thao tác là Admin gốc
                if (!currentRole.toUpperCase().contains("ADMIN")) {
                    return org.springframework.http.ResponseEntity.status(403)
                            .body(Map.of("message",
                                    "Bảo mật: Chỉ Admin tối cao mới có thể cho Quản lý hoặc Admin khác nghỉ việc!"));
                }
            }

            // BẢO MẬT: Chống Admin tự "khóa" chính mình hoặc khóa Admin gốc
            if (nvCu != null && nvCu.getId_tai_khoan() != null && "Đã nghỉ việc".equalsIgnoreCase(nv.getTrang_thai())) {
                com.rexi.pkty.entity.TaiKhoan tkSua = taiKhoanRepository.findById(nvCu.getId_tai_khoan()).orElse(null);
                if (tkSua != null) {
                    if ("admin".equalsIgnoreCase(tkSua.getTen_dang_nhap())) {
                        return org.springframework.http.ResponseEntity.status(403).body(Map.of("message",
                                "Cảnh báo nghiêm trọng: Không thể cho tài khoản Admin gốc nghỉ việc!"));
                    }
                    if (authentication != null && tkSua.getTen_dang_nhap().equals(authentication.getName())) {
                        return org.springframework.http.ResponseEntity.status(403).body(Map.of("message",
                                "Cảnh báo: Sếp không thể tự đánh dấu nghỉ việc cho chính tài khoản đang đăng nhập!"));
                    }
                }
            }

            // BẢO MẬT: Chống leo thang đặc quyền (Chỉ Admin mới được thăng chức người khác
            // lên Quản lý hoặc Admin)
            boolean isPromotingToHighRole = ("Quản lý".equalsIgnoreCase(nv.getChuyen_mon())
                    || "Admin".equalsIgnoreCase(nv.getChuyen_mon()));
            boolean wasNotHighRole = (nvCu == null || (!"Quản lý".equalsIgnoreCase(nvCu.getChuyen_mon())
                    && !"Admin".equalsIgnoreCase(nvCu.getChuyen_mon())));

            if (isPromotingToHighRole && wasNotHighRole) {
                if (!currentRole.toUpperCase().contains("ADMIN")) {
                    return org.springframework.http.ResponseEntity.status(403)
                            .body(Map.of("message",
                                    "Bảo mật: Chỉ Admin gốc mới có quyền bổ nhiệm Quản lý hoặc Admin mới!"));
                }
            }

            // BẢO MẬT: Kiểm tra trùng lặp email và SĐT khi cập nhật
            boolean emailExists = nhanVienRepository.findAll().stream()
                    .anyMatch(n -> !n.getId_nhan_vien().equals(id) && n.getEmail() != null
                            && n.getEmail().equals(nv.getEmail()));
            if (emailExists) {
                return org.springframework.http.ResponseEntity.status(400)
                        .body(Map.of("message", "Email này đã được sử dụng cho nhân viên khác!"));
            }

            boolean phoneExists = nhanVienRepository.findAll().stream()
                    .anyMatch(n -> !n.getId_nhan_vien().equals(id) && n.getSo_dien_thoai() != null
                            && n.getSo_dien_thoai().equals(nv.getSo_dien_thoai()));
            if (phoneExists) {
                return org.springframework.http.ResponseEntity.status(400)
                        .body(Map.of("message", "Số điện thoại này đã được sử dụng cho nhân viên khác!"));
            }

            nv.setId_nhan_vien(id);
            NhanVien savedNv = nhanVienRepository.save(nv);

            // ĐỒNG BỘ: Cập nhật lại quyền trong bảng Tài khoản nếu đổi chuyên môn
            if (savedNv.getId_tai_khoan() != null) {
                taiKhoanRepository.findById(savedNv.getId_tai_khoan()).ifPresent(tk -> {
                    if (savedNv.getChuyen_mon() != null) {
                        if (savedNv.getChuyen_mon().contains("Bác sĩ"))
                            tk.setId_vai_tro("8");
                        else if (savedNv.getChuyen_mon().contains("Quản lý"))
                            tk.setId_vai_tro("4");
                        else if (savedNv.getChuyen_mon().toLowerCase().contains("kế toán")) {
                            // Tự động gán quyền nếu sếp tạo kế toán mới từ giao diện
                            String sqlRole = "SELECT TOP 1 id_vai_tro FROM VaiTroHeThong WHERE ten_vai_tro LIKE N'%Kế toán%'";
                            try {
                                tk.setId_vai_tro(jdbcTemplate.queryForObject(sqlRole, String.class));
                            } catch (Exception e) {
                                tk.setId_vai_tro("3");
                            }
                        } else {
                            tk.setId_vai_tro("3");
                        }
                    } else {
                        tk.setId_vai_tro("3");
                    }
                    taiKhoanRepository.save(tk);
                });
            }

            // GHI LOG
            String oldInfo = nvCu != null ? "Chức vụ cũ: " + nvCu.getChuyen_mon() : "Không có";
            auditLogService.logAction("CẬP NHẬT", "NhanVien", "Cập nhật nhân viên ID " + id + ". Tên: "
                    + savedNv.getHo_ten() + ". " + oldInfo + " -> Chức vụ mới: " + savedNv.getChuyen_mon());

            return org.springframework.http.ResponseEntity.ok(savedNv);
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.status(500)
                    .body(Map.of("message", "Lỗi khi cập nhật nhân viên: " + e.getMessage()));
        }
    }

    // Thêm nhân viên mới & Tự động tạo tài khoản
    @PostMapping("/nhan-vien")
    @org.springframework.cache.annotation.CacheEvict(value = "bacSiCache", allEntries = true)
    public org.springframework.http.ResponseEntity<?> addNhanVien(@RequestBody NhanVien nv) {
        try {
            org.springframework.security.core.Authentication authentication = org.springframework.security.core.context.SecurityContextHolder
                    .getContext().getAuthentication();
            String currentRole = (authentication != null && authentication.getAuthorities() != null)
                    ? authentication.getAuthorities().toString()
                    : "";

            // BẢO MẬT: Chỉ Admin và Quản lý mới có quyền thêm nhân sự
            if (!currentRole.toUpperCase().contains("ADMIN") && !currentRole.toUpperCase().contains("QUANLY")) {
                return org.springframework.http.ResponseEntity.status(403)
                        .body(Map.of("message",
                                "Cảnh báo bảo mật: Chỉ Admin và Quản lý mới có quyền thêm nhân sự mới!"));
            }

            // BẢO MẬT: Chống leo thang đặc quyền khi tạo mới Admin hoặc Quản lý
            if (nv.getChuyen_mon() != null
                    && (nv.getChuyen_mon().contains("Quản lý") || nv.getChuyen_mon().contains("Admin"))) {
                if (!currentRole.toUpperCase().contains("ADMIN")) {
                    return org.springframework.http.ResponseEntity.status(403)
                            .body(Map.of("message",
                                    "Bảo mật: Chỉ Admin gốc mới có quyền tạo tài khoản cấp cao (Admin/Quản lý)!"));
                }
            }

            // BẢO MẬT: Kiểm tra trùng lặp email và SĐT khi thêm mới
            if (nv.getEmail() != null && !nv.getEmail().isEmpty()) {
                if (nhanVienRepository.findByEmail(nv.getEmail()).isPresent()) {
                    return org.springframework.http.ResponseEntity.status(400)
                            .body(Map.of("message", "Email này đã được đăng ký cho nhân viên khác!"));
                }
                if (taiKhoanRepository.findByTenDangNhap(nv.getEmail()).isPresent()) {
                    return org.springframework.http.ResponseEntity.status(400)
                            .body(Map.of("message", "Email này đã bị trùng với một tài khoản trong hệ thống!"));
                }
            }

            boolean phoneExists = nhanVienRepository.findAll().stream()
                    .anyMatch(n -> n.getSo_dien_thoai() != null && n.getSo_dien_thoai().equals(nv.getSo_dien_thoai()));
            if (phoneExists) {
                return org.springframework.http.ResponseEntity.status(400)
                        .body(Map.of("message", "Số điện thoại này đã được sử dụng cho nhân viên khác!"));
            }

            // Tạo tài khoản trước
            com.rexi.pkty.entity.TaiKhoan tk = new com.rexi.pkty.entity.TaiKhoan();
            tk.setTen_dang_nhap(nv.getEmail()); // Dùng email làm tên đăng nhập
            String defaultPass = "rexi@123";
            tk.setMat_khau(defaultPass);
            tk.setMat_khau_hash(passwordEncoder.encode(defaultPass));

            // Phân quyền dựa trên chuyên môn
            if (nv.getChuyen_mon() != null && nv.getChuyen_mon().contains("Bác sĩ")) {
                tk.setId_vai_tro("8"); // Bác sĩ
            } else if (nv.getChuyen_mon() != null && nv.getChuyen_mon().contains("Quản lý")) {
                tk.setId_vai_tro("4"); // Quản lý
            } else if (nv.getChuyen_mon() != null && nv.getChuyen_mon().toLowerCase().contains("kế toán")) {
                // Tự động gán quyền nếu sếp tạo kế toán mới từ giao diện
                String sqlRole = "SELECT TOP 1 id_vai_tro FROM VaiTroHeThong WHERE ten_vai_tro LIKE N'%Kế toán%'";
                try {
                    tk.setId_vai_tro(jdbcTemplate.queryForObject(sqlRole, String.class));
                } catch (Exception e) {
                    tk.setId_vai_tro("3");
                }
            } else {
                tk.setId_vai_tro("3"); // Nhân viên
            }

            tk.setTrang_thai("Hoạt động");
            tk.setNgay_tao(java.time.LocalDateTime.now());
            tk = taiKhoanRepository.save(tk);

            // Liên kết nhân viên với tài khoản
            nv.setId_tai_khoan(tk.getId_tai_khoan());
            if (nv.getNgay_vao_lam() == null)
                nv.setNgay_vao_lam(java.time.LocalDate.now());
            nv.setTrang_thai("Đang làm việc");
            nv.setDa_xoa(false);

            NhanVien savedNv = nhanVienRepository.save(nv);

            // GHI LOG
            auditLogService.logAction("THÊM MỚI", "NhanVien",
                    "Thêm nhân viên mới: " + savedNv.getHo_ten() + " - " + savedNv.getChuyen_mon());

            return org.springframework.http.ResponseEntity.ok(savedNv);
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.status(500)
                    .body(Map.of("message", "Lỗi khi thêm nhân viên: " + e.getMessage()));
        }
    }

    // Xóa nhân viên (Xóa mềm để tránh lỗi Foreign Key và bảo toàn lịch sử y tế)
    @DeleteMapping("/nhan-vien/{id}")
    @org.springframework.cache.annotation.CacheEvict(value = "bacSiCache", allEntries = true)
    public org.springframework.http.ResponseEntity<?> deleteNhanVien(@PathVariable String id) {
        try {
            org.springframework.security.core.Authentication authentication = org.springframework.security.core.context.SecurityContextHolder
                    .getContext().getAuthentication();
            String currentRole = (authentication != null && authentication.getAuthorities() != null)
                    ? authentication.getAuthorities().toString()
                    : "";

            // BẢO MẬT: Chỉ Admin và Quản lý mới có quyền xóa nhân sự
            if (!currentRole.toUpperCase().contains("ADMIN") && !currentRole.toUpperCase().contains("QUANLY")) {
                return org.springframework.http.ResponseEntity.status(403)
                        .body(Map.of("message", "Cảnh báo bảo mật: Chỉ Admin và Quản lý mới có quyền xóa nhân sự!"));
            }

            // BẢO MẬT: Chống tự ý xóa tài khoản cấp Quản lý hoặc Admin
            NhanVien nvCu = nhanVienRepository.findById(id).orElse(null);
            if (nvCu != null && ("Quản lý".equalsIgnoreCase(nvCu.getChuyen_mon())
                    || "Admin".equalsIgnoreCase(nvCu.getChuyen_mon()))) {
                if (!currentRole.toUpperCase().contains("ADMIN")) {
                    return org.springframework.http.ResponseEntity.status(403)
                            .body(Map.of("message",
                                    "Bảo mật: Bạn không có quyền xóa hoặc khóa tài khoản cấp cao (Admin/Quản lý)!"));
                }
            }

            // BẢO MẬT: Chống Admin tự xóa chính mình hoặc xóa Admin gốc
            if (nvCu != null && nvCu.getId_tai_khoan() != null) {
                com.rexi.pkty.entity.TaiKhoan tkBiXoa = taiKhoanRepository.findById(nvCu.getId_tai_khoan())
                        .orElse(null);
                if (tkBiXoa != null) {
                    if ("admin".equalsIgnoreCase(tkBiXoa.getTen_dang_nhap())) {
                        return org.springframework.http.ResponseEntity.status(403).body(Map.of("message",
                                "Cảnh báo nghiêm trọng: Tuyệt đối không được xóa tài khoản Admin gốc của hệ thống!"));
                    }
                    if (authentication != null && tkBiXoa.getTen_dang_nhap().equals(authentication.getName())) {
                        return org.springframework.http.ResponseEntity.status(403).body(Map.of("message",
                                "Cảnh báo: Sếp không thể tự xóa tài khoản đang đăng nhập của chính mình!"));
                    }
                }
            }

            java.util.Optional<NhanVien> nvOpt = nhanVienRepository.findById(id);
            if (nvOpt.isPresent()) {
                NhanVien nv = nvOpt.get();

                // Đánh dấu xóa mềm
                nv.setDa_xoa(true);
                nv.setTrang_thai("Đã nghỉ việc");
                nhanVienRepository.save(nv);

                // Khóa tài khoản đăng nhập của nhân viên này để bảo mật
                if (nv.getId_tai_khoan() != null) {
                    taiKhoanRepository.findById(nv.getId_tai_khoan()).ifPresent(tk -> {
                        tk.setTrang_thai("Đã khóa");
                        taiKhoanRepository.save(tk);
                    });
                }

                // GHI LOG
                auditLogService.logAction("XÓA (NGHỈ VIỆC)", "NhanVien",
                        "Cho nghỉ việc nhân viên ID " + id + " - " + nv.getHo_ten());

                return org.springframework.http.ResponseEntity
                        .ok(Map.of("message", "Đã xóa (cho nghỉ việc) nhân viên thành công!"));
            }
            return org.springframework.http.ResponseEntity.status(404)
                    .body(Map.of("message", "Không tìm thấy nhân viên!"));
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.status(500)
                    .body(Map.of("message", "Lỗi xóa nhân viên: " + e.getMessage()));
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
            // Tối ưu RAM: Query trực tiếp theo email thay vì findAll().stream().filter()
            NhanVien nv = nhanVienRepository.findByEmail(email)
                    .orElseGet(() -> nhanVienRepository.findByHoTen(d[0]).orElse(new NhanVien()));

            nv.setHo_ten(d[0]);
            nv.setChuyen_mon(d[1]);
            nv.setHinh_anh(d[2]);
            nv.setGioi_thieu(d[3]);
            nv.setEmail(email);

            // Luôn đảm bảo tài khoản tồn tại và được liên kết
            com.rexi.pkty.entity.TaiKhoan tk = taiKhoanRepository.findByTenDangNhap(email)
                    .orElse(new com.rexi.pkty.entity.TaiKhoan());
            tk.setTen_dang_nhap(email);
            tk.setMat_khau("rexi@123");
            tk.setMat_khau_hash(passwordEncoder.encode("rexi@123"));
            tk.setId_vai_tro("8"); // Bác sĩ
            tk.setTrang_thai("Hoạt động");
            if (tk.getNgay_tao() == null)
                tk.setNgay_tao(java.time.LocalDateTime.now());
            tk = taiKhoanRepository.save(tk);

            nv.setId_tai_khoan(tk.getId_tai_khoan());

            if (nv.getNgay_vao_lam() == null) {
                nv.setNgay_vao_lam(java.time.LocalDate.now().minusYears(5));
            }
            nv.setTrang_thai("Đang làm việc");
            nv.setDa_xoa(false);

            try {
                nhanVienRepository.save(nv);
            } catch (Exception e) {
                System.err.println("Lỗi lưu bác sĩ " + d[0] + ": " + e.getMessage());
            }
        }
        return "Đã đồng bộ 5 bác sĩ và tạo tài khoản thành công!";
    }
}

