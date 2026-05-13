package com.rexi.pkty.controller;

import com.rexi.pkty.dto.YeuCauDangNhap;
import com.rexi.pkty.dto.YeuCauDangKy;
import com.rexi.pkty.repository.TaiKhoanRepository;
import com.rexi.pkty.repository.KhachHangRepository;
import com.rexi.pkty.security.JwtCongCu;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.web.client.RestTemplate;
import java.util.Optional;
import java.util.logging.Logger;
import java.util.concurrent.ConcurrentHashMap;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/auth")
@Tag(name = "Xác Thực (Auth)", description = "Quản lý Đăng nhập, Đăng ký, OTP và Liên kết Google")
public class XacThucController {

    private static final Logger logger = Logger.getLogger(XacThucController.class.getName());

    // Cấu trúc giới hạn Login chống Brute Force (User -> Attempts)
    private static final ConcurrentHashMap<String, Integer> loginAttempts = new ConcurrentHashMap<>();
    private static final ConcurrentHashMap<String, Long> lockoutTime = new ConcurrentHashMap<>();
    private static final int MAX_ATTEMPTS = 5;
    private static final long LOCKOUT_DURATION = 15 * 60 * 1000; // 15 phút

    // Cấu trúc giới hạn Đăng ký chống Spam tạo tài khoản ảo (IP -> thời gian)
    private static final ConcurrentHashMap<String, Long> lastRegisterTime = new ConcurrentHashMap<>();

    @Autowired
    private TaiKhoanRepository taiKhoanRepository;

    @Autowired
    private KhachHangRepository khachHangRepository;

    @Autowired
    private com.rexi.pkty.repository.NhanVienRepository nhanVienRepository;

    @Autowired
    private JwtCongCu jwtCongCu;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Autowired
    private com.rexi.pkty.service.DichVuNhatKyHeThong nhatKyHeThongService;

    @Autowired
    private com.rexi.pkty.service.DichVuEmail emailService;

    /**
     * Đăng nhập - Sử dụng BCrypt để kiểm tra mật khẩu
     * Thêm bước kiểm tra dữ liệu đầu vào (Validation)
     * Bảo mật thông tin lỗi (Không trả về chi tiết Exception)
     */
    @PostMapping("/login")
    @Operation(summary = "Đăng nhập hệ thống", description = "Hỗ trợ đăng nhập bằng Username, Email hoặc SĐT. Tự động block nếu sai quá 5 lần.")
    public ResponseEntity<?> login(@Valid @RequestBody YeuCauDangNhap request, BindingResult bindingResult,
            jakarta.servlet.http.HttpServletRequest httpRequest) {
        String username = request.getTen_dang_nhap();
        String clientIp = httpRequest.getRemoteAddr();

        String lockoutKeyUser = "USER-" + username;
        String lockoutKeyIp = "IP-" + clientIp;

        // Dọn rác RAM định kỳ để chống tấn công OOM (Out Of Memory)
        if (loginAttempts.size() > 2000) {
            long now = System.currentTimeMillis();
            lockoutTime.entrySet().removeIf(entry -> now > entry.getValue());
            if (loginAttempts.size() > 5000) {
                loginAttempts.clear();
            }
        }

        // BẢO MẬT LỚP 1: Kiểm tra Lockout theo Username và theo IP độc lập
        Long lockTimeUser = lockoutTime.get(lockoutKeyUser);
        Long lockTimeIp = lockoutTime.get(lockoutKeyIp);
        long currentTime = System.currentTimeMillis();

        if ((lockTimeUser != null && currentTime < lockTimeUser) ||
                (lockTimeIp != null && currentTime < lockTimeIp)) {
            logger.warning("Blocked brute force attempt for: " + username + " from IP: " + clientIp);
            nhatKyHeThongService.logActionWithUsername(username, "CẢNH BÁO", "TaiKhoan",
                    "Tài khoản hoặc IP bị khóa tạm thời do nhập sai quá nhiều lần");
            return ResponseEntity.status(429).body(Map.of("message",
                    "Đăng nhập bị khóa tạm thời do nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút!"));
        } else {
            if (lockTimeUser != null && currentTime >= lockTimeUser) {
                lockoutTime.remove(lockoutKeyUser);
                loginAttempts.remove(lockoutKeyUser);
            }
            if (lockTimeIp != null && currentTime >= lockTimeIp) {
                lockoutTime.remove(lockoutKeyIp);
                loginAttempts.remove(lockoutKeyIp);
            }
        }

        logger.info("Login attempt: user=" + username);

        if (bindingResult.hasErrors()) {
            String errorMsg = bindingResult.getFieldError().getDefaultMessage();
            return ResponseEntity.badRequest().body(Map.of("message", errorMsg));
        }

        try {
            Optional<com.rexi.pkty.entity.TaiKhoan> tkOpt = taiKhoanRepository.findByTenDangNhap(username);

            // BẢO MẬT VÀ UX LỚP 2: Hỗ trợ người dùng đăng nhập bằng cả Email hoặc Số điện
            // thoại
            if (tkOpt.isEmpty()) {
                try {
                    List<Map<String, Object>> listKh = jdbcTemplate.queryForList(
                            "SELECT id_khach_hang FROM KhachHang WHERE email = ? OR sdt = ?", username, username);
                    if (!listKh.isEmpty()) {
                        tkOpt = taiKhoanRepository.findAccountByKhachHangId((String) listKh.get(0).get("id_khach_hang"));
                    }
                    if (tkOpt.isEmpty()) {
                        List<Map<String, Object>> listNv = jdbcTemplate.queryForList(
                                "SELECT id_nhan_vien FROM NhanVien WHERE email = ? OR so_dien_thoai = ?", username,
                                username);
                        if (!listNv.isEmpty()) {
                            tkOpt = taiKhoanRepository.findAccountByNhanVienId((String) listNv.get(0).get("id_nhan_vien"));
                        }
                    }
                } catch (Exception ignored) {
                }
            }

            if (tkOpt.isEmpty()) {
                handleFailedAttempt(lockoutKeyUser, lockoutKeyIp);
                nhatKyHeThongService.logActionWithUsername(username, "CẢNH BÁO", "TaiKhoan",
                        "Đăng nhập thất bại (Không tìm thấy tài khoản)");
                return ResponseEntity.status(401)
                        .body(Map.of("message", "Sai tên đăng nhập, email hoặc số điện thoại!"));
            }

            com.rexi.pkty.entity.TaiKhoan tk = tkOpt.get();

            // BẢO MẬT: Chặn đăng nhập nếu tài khoản đã bị khóa hoặc vô hiệu hóa
            String status = tk.getTrang_thai();
            if (status != null && (status.equalsIgnoreCase("Đã khóa") || status.equalsIgnoreCase("inactive"))) {
                logger.warning("Cảnh báo: Cố gắng đăng nhập vào tài khoản đã bị khóa: " + tk.getTen_dang_nhap());
                return ResponseEntity.status(403).body(Map.of("message",
                        "Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ phòng khám để biết thêm chi tiết!"));
            }

            // Kiểm tra mật khẩu
            String storedHash = (tk.getMat_khau_hash() != null && !tk.getMat_khau_hash().isEmpty())
                    ? tk.getMat_khau_hash()
                    : tk.getMat_khau();

            boolean isMatch = false;
            if (storedHash != null) {
                if (storedHash.startsWith("$2a$") || storedHash.startsWith("$2b$") || storedHash.startsWith("$2y$")) {
                    isMatch = passwordEncoder.matches(request.getMat_khau(), storedHash);
                } else {
                    isMatch = storedHash.equals(request.getMat_khau());
                    if (isMatch) {
                        tk.setMat_khau_hash(passwordEncoder.encode(request.getMat_khau()));
                        taiKhoanRepository.save(tk);
                    }
                }
            }

            if (!isMatch) {
                handleFailedAttempt(lockoutKeyUser, lockoutKeyIp);
                return ResponseEntity.status(401).body(Map.of("message", "Sai tài khoản hoặc mật khẩu!"));
            }

            // Đăng nhập thành công
            loginAttempts.remove(lockoutKeyUser);
            lockoutTime.remove(lockoutKeyUser);
            loginAttempts.remove(lockoutKeyIp);
            lockoutTime.remove(lockoutKeyIp);

            String idVaiTro = tk.getId_vai_tro();
            String loaiTaiKhoan = "KHACH_HANG";
            String tenVaiTro = "Khách hàng";

            if (idVaiTro != null) {
                String idUpper = idVaiTro.toUpperCase();
                if (idUpper.contains("ADMIN") || idUpper.contains("QT")) {
                    loaiTaiKhoan = "ADMIN";
                    tenVaiTro = "Quản trị";
                } else if (idUpper.contains("QL")) {
                    loaiTaiKhoan = "QUAN_LY";
                    tenVaiTro = "Quản lý";
                } else if (idUpper.contains("BS")) {
                    loaiTaiKhoan = "BAC_SI";
                    tenVaiTro = "Bác sĩ";
                } else if (idUpper.contains("KT")) {
                    loaiTaiKhoan = "KE_TOAN";
                    tenVaiTro = "Kế toán";
                } else if (idUpper.contains("TT")) {
                    loaiTaiKhoan = "TIEP_TAN";
                    tenVaiTro = "Tiếp tân";
                } else if (idUpper.contains("YT")) {
                    loaiTaiKhoan = "Y_TA";
                    tenVaiTro = "Y tá";
                } else if (idUpper.contains("ST") || idUpper.contains("NV")) {
                    loaiTaiKhoan = "STAFF";
                    tenVaiTro = "Nhân viên";
                }
            }

            String displayName = tk.getTen_dang_nhap();
            Map<String, Object> userData = new java.util.HashMap<>();
            userData.put("ten_dang_nhap", tk.getTen_dang_nhap());
            userData.put("loai_tai_khoan", loaiTaiKhoan);
            userData.put("ten_vai_tro", tenVaiTro);

            if (!"CUSTOMER".equals(loaiTaiKhoan)) {
                String idNv = tk.getId_nhan_vien();

                // VÁ LỖI TỰ ĐỘNG TẠO NHÂN SỰ NẾU QUÊN GẮN ID KHI TẠO TÀI KHOẢN ADMIN
                if (idNv == null || idNv.isEmpty()) {
                    com.rexi.pkty.entity.NhanVien nv = new com.rexi.pkty.entity.NhanVien();
                    idNv = "NV-" + java.util.UUID.randomUUID().toString().substring(0, 6).toUpperCase();
                    nv.setId_nhan_vien(idNv);
                    nv.setHo_ten(displayName != null ? displayName : "Admin / Nhân sự gốc");
                    nv.setNgay_vao_lam(java.time.LocalDate.now());
                    nv.setTrang_thai("Đang làm việc");
                    nhanVienRepository.save(nv);

                    tk.setId_nhan_vien(idNv);
                    taiKhoanRepository.save(tk);
                    logger.info("Đã tự động tạo hồ sơ nhân sự " + idNv + " cho tài khoản " + tk.getTen_dang_nhap());
                }
                userData.put("id_nhan_vien", idNv);
                try {
                    String name = jdbcTemplate.queryForObject("SELECT ho_ten FROM NhanVien WHERE id_nhan_vien = ?",
                            String.class, idNv);
                    if (name != null)
                        displayName = name;
                } catch (Exception ignored) {
                }
            } else {
                String idKh = tk.getId_khach_hang();

                // TỰ ĐỘNG VÁ LỖI NẾU TÀI KHOẢN KHÁCH HÀNG BỊ MẤT KẾT NỐI VỚI BẢNG KHACHHANG
                if (idKh == null || idKh.isEmpty()) {
                    com.rexi.pkty.entity.KhachHang kh = new com.rexi.pkty.entity.KhachHang();
                    idKh = "KH-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase();
                    kh.setId_khach_hang(idKh);
                    kh.setTen_khach_hang(displayName != null ? displayName : tk.getTen_dang_nhap());
                    if (tk.getTen_dang_nhap().contains("@"))
                        kh.setEmail(tk.getTen_dang_nhap());
                    kh.setSdt("09" + String.format("%08d", (int) (Math.random() * 100000000)));
                    kh.setNgay_dang_ky(java.time.LocalDateTime.now());
                    khachHangRepository.save(kh);
                    tk.setId_khach_hang(idKh);
                    if (tk.getId_vai_tro() == null)
                        tk.setId_vai_tro("VT-KH");
                    taiKhoanRepository.save(tk);
                    logger.info("Đã tự động tạo hồ sơ khách hàng " + idKh + " cho tài khoản " + tk.getTen_dang_nhap());
                }
                userData.put("id_khach_hang", idKh);
                try {
                    String name = jdbcTemplate.queryForObject(
                            "SELECT ten_khach_hang FROM KhachHang WHERE id_khach_hang = ?", String.class, idKh);
                    if (name != null)
                        displayName = name;
                } catch (Exception ignored) {
                }
            }
            userData.put("display_name", displayName);

            String token = jwtCongCu.generateToken(tk.getTen_dang_nhap(), loaiTaiKhoan);
            String refreshToken = jwtCongCu.generateRefreshToken(tk.getTen_dang_nhap());

            // Gửi mail chào mừng
            if (tk.getWelcome_email_sent() == null || !tk.getWelcome_email_sent()) {
                String emailToNotify = null;
                if (tk.getId_khach_hang() != null) {
                    com.rexi.pkty.entity.KhachHang kh = khachHangRepository.findById(tk.getId_khach_hang())
                            .orElse(null);
                    if (kh != null && kh.getEmail() != null) {
                        emailToNotify = kh.getEmail();
                    }
                } else if (tk.getId_khach_hang() != null) {
                    try {
                        emailToNotify = jdbcTemplate.queryForObject(
                                "SELECT email FROM KhachHang WHERE id_khach_hang = ?", String.class,
                                tk.getId_khach_hang());
                    } catch (Exception ignored) {
                    }
                } else if (tk.getId_nhan_vien() != null) {
                    try {
                        emailToNotify = jdbcTemplate.queryForObject("SELECT email FROM NhanVien WHERE id_nhan_vien = ?",
                                String.class, tk.getId_nhan_vien());
                    } catch (Exception ignored) {
                    }
                }

                if (emailToNotify == null && tk.getTen_dang_nhap() != null && tk.getTen_dang_nhap().contains("@")) {
                    emailToNotify = tk.getTen_dang_nhap();
                }

                if (emailToNotify != null && !emailToNotify.isEmpty()) {
                    try {
                        emailService.guiEmailChaoMung(emailToNotify, displayName);
                        tk.setWelcome_email_sent(true);
                        taiKhoanRepository.save(tk);
                    } catch (Exception ex) {
                        logger.warning("Không thể gửi email chào mừng: " + ex.getMessage());
                    }
                }
            }

            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "refreshToken", refreshToken,
                    "user", userData,
                    "message", "Đăng nhập thành công!"));

        } catch (Exception e) {
            logger.severe("Login error: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi hệ thống: " + e.getMessage()));
        }
    }

    private void handleFailedAttempt(String lockoutKeyUser, String lockoutKeyIp) {
        long lockUntil = System.currentTimeMillis() + LOCKOUT_DURATION;

        int userAttempts = loginAttempts.getOrDefault(lockoutKeyUser, 0) + 1;
        loginAttempts.put(lockoutKeyUser, userAttempts);
        if (userAttempts >= MAX_ATTEMPTS) {
            lockoutTime.put(lockoutKeyUser, lockUntil);
        }

        int ipAttempts = loginAttempts.getOrDefault(lockoutKeyIp, 0) + 1;
        loginAttempts.put(lockoutKeyIp, ipAttempts);
        if (ipAttempts >= MAX_ATTEMPTS) {
            lockoutTime.put(lockoutKeyIp, lockUntil);
        }
    }

    /**
     * Đăng nhập Google - Kiểm tra Token chuẩn xác
     */
    @PostMapping("/google-login")
    @Operation(summary = "Đăng nhập bằng Google", description = "Xác thực token từ Google, tự động đăng ký nếu chưa có tài khoản.")
    public ResponseEntity<?> googleLogin(@RequestBody Map<String, String> requestData) {
        try {
            String googleToken = requestData.get("token");
            Map<String, Object> googleProfile = verifyGoogleToken(googleToken);

            if (googleProfile == null) {
                return ResponseEntity.status(401).body(Map.of("message", "Token Google không hợp lệ hoặc đã hết hạn!"));
            }

            String email = (String) googleProfile.get("email");
            String name = (String) googleProfile.get("name");
            String picture = (String) googleProfile.get("picture"); // Lấy link ảnh từ Google

            if (email == null || email.isEmpty()) {
                return ResponseEntity.status(400)
                        .body(Map.of("message", "Tài khoản Google này không cung cấp Email hợp lệ!"));
            }

            // BƯỚC 1: Tìm trong bảng Nhân Viên trước (ưu tiên quyền quản trị)
            Optional<com.rexi.pkty.entity.NhanVien> nvOpt = nhanVienRepository.findByEmail(email);
            com.rexi.pkty.entity.TaiKhoan tk;
            String loaiTaiKhoan;
            String displayName = name; // Mặc định lấy tên từ Google
            String idNguoiDung = null;
            // DÙNG DỮ LIỆU CHUẨN: Tìm tài khoản trước
            tk = taiKhoanRepository.findByTenDangNhap(email).orElse(null);

            // TÌM KIẾM ĐỘNG (DYNAMIC): Quét chéo toàn bộ DB để tìm tài khoản (Khách hàng &
            // Nhân sự) bằng Email
            if (tk == null) {
                try {
                    List<Map<String, Object>> listKh = jdbcTemplate
                            .queryForList("SELECT id_khach_hang FROM KhachHang WHERE email = ?", email);
                    if (!listKh.isEmpty())
                        tk = taiKhoanRepository.findAccountByKhachHangId((String) listKh.get(0).get("id_khach_hang"))
                                .orElse(null);

                    if (tk == null) {
                        List<Map<String, Object>> listNv = jdbcTemplate
                                .queryForList("SELECT id_nhan_vien FROM NhanVien WHERE email = ?", email);
                        if (!listNv.isEmpty())
                            tk = taiKhoanRepository.findAccountByNhanVienId((String) listNv.get(0).get("id_nhan_vien"))
                                    .orElse(null);
                    }
                } catch (Exception ignored) {
                }
            }

            if (tk != null) {
                // DÙNG DỮ LIỆU CHUẨN TỪ TAIKHOAN: Lấy role trực tiếp từ DB
                String dbRole = tk.getId_vai_tro() != null ? tk.getId_vai_tro().toUpperCase() : "";
                if (dbRole.contains("ADMIN") || dbRole.contains("QL")) {
                    loaiTaiKhoan = "ADMIN";
                } else if (dbRole.contains("BS")) {
                    loaiTaiKhoan = "BAC_SI";
                } else if (dbRole.contains("KT")) {
                    loaiTaiKhoan = "KE_TOAN";
                } else if (dbRole.contains("STAFF") || tk.getId_nhan_vien() != null) {
                    loaiTaiKhoan = "STAFF";
                } else {
                    loaiTaiKhoan = "KHACH_HANG";
                }

                // LẤY TÊN THẬT VÀ ID TỪ DB
                if (tk.getId_nhan_vien() != null) {
                    idNguoiDung = tk.getId_nhan_vien();
                    com.rexi.pkty.entity.NhanVien nv = nhanVienRepository.findById(tk.getId_nhan_vien()).orElse(null);
                    if (nv != null) {
                        displayName = nv.getHo_ten();
                    }
                } else if (tk.getId_khach_hang() != null) {
                    idNguoiDung = tk.getId_khach_hang();
                    com.rexi.pkty.entity.KhachHang kh = khachHangRepository.findById(tk.getId_khach_hang())
                            .orElse(null);
                    if (kh != null) {
                        displayName = kh.getTen_khach_hang();
                    }
                } else {
                    // VÁ LỖI TRÁNH KHÁCH HÀNG ẢO: Tách biệt logic tạo profile cho Nhân sự và Khách
                    // hàng
                    if (!"KHACH_HANG".equals(loaiTaiKhoan)) {
                        // Tạo hồ sơ Nhân viên
                        com.rexi.pkty.entity.NhanVien nv = new com.rexi.pkty.entity.NhanVien();
                        String newNvId = "NV-" + java.util.UUID.randomUUID().toString().substring(0, 6).toUpperCase();
                        nv.setId_nhan_vien(newNvId);
                        nv.setHo_ten(displayName != null && !displayName.equals("Người dùng DB") ? displayName
                                : "Admin / Nhân viên");
                        nv.setEmail(email);
                        nv.setNgay_vao_lam(java.time.LocalDate.now());
                        nv.setTrang_thai("Đang làm việc");
                        nhanVienRepository.save(nv);

                        tk.setId_nhan_vien(newNvId);
                        taiKhoanRepository.save(tk);
                        idNguoiDung = newNvId;
                    } else {
                        // TỰ ĐỘNG VÁ LỖI: Tạo hồ sơ Khách hàng
                        com.rexi.pkty.entity.KhachHang kh = new com.rexi.pkty.entity.KhachHang();
                        String newKhId = "KH-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase();
                        kh.setId_khach_hang(newKhId);
                        kh.setTen_khach_hang(
                                displayName != null && !displayName.equals("Người dùng DB") ? displayName : name);
                        kh.setEmail(email);
                        kh.setSdt("09" + String.format("%08d", (int) (Math.random() * 100000000)));
                        kh.setNgay_dang_ky(java.time.LocalDateTime.now());
                        khachHangRepository.save(kh);

                        tk.setId_khach_hang(newKhId);
                        if (tk.getId_vai_tro() == null)
                            tk.setId_vai_tro("VT-KH");
                        taiKhoanRepository.save(tk);
                        idNguoiDung = newKhId;
                    }
                }
            } else {
                if (nvOpt.isPresent()) {
                    com.rexi.pkty.entity.NhanVien nv = nvOpt.get();
                    loaiTaiKhoan = "STAFF";
                    displayName = nv.getHo_ten();
                    idNguoiDung = nv.getId_nhan_vien();

                    com.rexi.pkty.entity.TaiKhoan newTk = new com.rexi.pkty.entity.TaiKhoan();
                    newTk.setId_tai_khoan("TK-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase());
                    newTk.setTen_dang_nhap(email);
                    String randomPass = "GOOGLE_" + java.util.UUID.randomUUID().toString().substring(0, 8);
                    newTk.setMat_khau(randomPass);
                    newTk.setMat_khau_hash(passwordEncoder.encode(randomPass));
                    newTk.setId_nhan_vien(nv.getId_nhan_vien());
                    newTk.setId_vai_tro("VT-TT");
                    newTk.setTrang_thai("HOAT_DONG");
                    newTk.setNgay_tao(java.time.LocalDateTime.now());
                    tk = taiKhoanRepository.save(newTk);
                } else {
                    loaiTaiKhoan = "KHACH_HANG";
                    com.rexi.pkty.entity.KhachHang kh = khachHangRepository.findByEmail(email).orElseGet(() -> {
                        com.rexi.pkty.entity.KhachHang newKh = new com.rexi.pkty.entity.KhachHang();
                        newKh.setId_khach_hang(
                                "KH-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase());
                        newKh.setEmail(email);
                        newKh.setTen_khach_hang(name);
                        newKh.setNgay_dang_ky(java.time.LocalDateTime.now());
                        return khachHangRepository.save(newKh);
                    });
                    displayName = kh.getTen_khach_hang();
                    idNguoiDung = kh.getId_khach_hang();

                    com.rexi.pkty.entity.TaiKhoan newTk = new com.rexi.pkty.entity.TaiKhoan();
                    newTk.setId_tai_khoan("TK-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase());
                    newTk.setTen_dang_nhap(email);
                    String randomPass = "GOOGLE_" + java.util.UUID.randomUUID().toString().substring(0, 8);
                    newTk.setMat_khau(randomPass);
                    newTk.setMat_khau_hash(passwordEncoder.encode(randomPass));
                    newTk.setId_khach_hang(kh.getId_khach_hang());
                    newTk.setId_vai_tro("VT-KH");
                    newTk.setTrang_thai("HOAT_DONG");
                    newTk.setNgay_tao(java.time.LocalDateTime.now());
                    tk = taiKhoanRepository.save(newTk);
                }
            }

            String tenVaiTro = "Khách hàng";
            if (tk.getId_vai_tro() != null) {
                try {
                    tenVaiTro = jdbcTemplate.queryForObject(
                            "SELECT ten_vai_tro FROM VaiTroHeThong WHERE id_vai_tro = ?",
                            String.class, tk.getId_vai_tro());
                } catch (Exception e) {
                    tenVaiTro = nvOpt.isPresent() ? "Nhân viên" : "Khách hàng";
                }
            }

            String token = jwtCongCu.generateToken(tk.getTen_dang_nhap(), loaiTaiKhoan);
            String refreshToken = jwtCongCu.generateRefreshToken(tk.getTen_dang_nhap());

            Map<String, Object> response = new java.util.HashMap<>();
            response.put("token", token);
            response.put("refreshToken", refreshToken);

            Map<String, Object> userData = new java.util.HashMap<>();
            userData.put("ten_dang_nhap", tk.getTen_dang_nhap());
            userData.put("display_name", displayName);
            userData.put("ten_vai_tro", tenVaiTro);
            userData.put("loai_tai_khoan", loaiTaiKhoan);
            userData.put("email", email);
            if ("ADMIN".equals(loaiTaiKhoan) || "STAFF".equals(loaiTaiKhoan) || "BAC_SI".equals(loaiTaiKhoan)
                    || "KE_TOAN".equals(loaiTaiKhoan)) {
                userData.put("id_nhan_vien", idNguoiDung);
            } else {
                userData.put("id_khach_hang", idNguoiDung);
            }
            if (picture != null)
                userData.put("avatar", picture);
            response.put("user", userData);

            logger.info("Đăng nhập Google thành công cho: " + email);

            if (tk.getWelcome_email_sent() == null || !tk.getWelcome_email_sent()) {
                try {
                    emailService.guiEmailChaoMung(email, (String) userData.get("displayName"));
                    tk.setWelcome_email_sent(true);
                    taiKhoanRepository.save(tk);
                } catch (Exception ex) {
                    logger.warning("Lỗi gửi mail chào mừng Google: " + ex.getMessage());
                }
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.severe("Google login error: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi đăng nhập Google: " + e.getMessage()));
        }
    }

    /**
     * Google Register - Táº¡o tÃ i khoáº£n má»›i tá»« thÃ´ng tin Google
     */
    @PostMapping("/google-register")
    @Operation(summary = "Đăng ký bằng Google", description = "Tạo tài khoản mới bằng thông tin Google (Tên, Ảnh, Email)")
    public ResponseEntity<?> googleRegister(@RequestBody Map<String, String> requestData) {
        try {
            String googleToken = requestData.get("token");
            Map<String, Object> googleProfile = verifyGoogleToken(googleToken);

            if (googleProfile == null) {
                return ResponseEntity.status(401).body(Map.of("message", "Token Google không hợp lệ hoặc đã hết hạn!"));
            }

            String email = (String) googleProfile.get("email");
            String name = (String) googleProfile.get("name");
            String picture = (String) googleProfile.get("picture");

            if (email == null || email.isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Không thể trích xuất email từ Token Google"));
            }

            Optional<com.rexi.pkty.entity.KhachHang> existingKh = khachHangRepository.findByEmail(email);
            if (existingKh.isPresent()) {
                return ResponseEntity.status(409)
                        .body(Map.of("message", "Email này đã được đăng ký. Hãy liên kết tài khoản thay vì tạo mới."));
            }

            com.rexi.pkty.entity.KhachHang kh = new com.rexi.pkty.entity.KhachHang();
            kh.setId_khach_hang("KH-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            kh.setTen_khach_hang(name != null ? name : "Khách hàng Google");
            kh.setEmail(email);
            String regRandomDigits = String.format("%08d", (int) (Math.random() * 100000000));
            kh.setSdt("09" + regRandomDigits);
            kh.setDia_chi("");
            kh.setNgay_dang_ky(java.time.LocalDateTime.now());
            kh = khachHangRepository.save(kh);

            com.rexi.pkty.entity.TaiKhoan tk = new com.rexi.pkty.entity.TaiKhoan();
            tk.setId_tai_khoan("TK-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            tk.setTen_dang_nhap(email);
            String randomPass = "GOOGLE_" + java.util.UUID.randomUUID().toString().substring(0, 8);
            tk.setMat_khau(randomPass);
            tk.setMat_khau_hash(passwordEncoder.encode(randomPass));
            tk.setId_khach_hang(kh.getId_khach_hang());
            tk.setId_vai_tro("VT-KH");
            tk.setTrang_thai("HOAT_DONG");
            tk.setNgay_tao(java.time.LocalDateTime.now());
            tk.setWelcome_email_sent(true); // Đánh dấu đã gửi
            tk = taiKhoanRepository.save(tk);

            try {
                emailService.guiEmailChaoMung(email, kh.getTen_khach_hang());
            } catch (Exception ex) {
                logger.warning("Lỗi gửi mail chào mừng Google Register: " + ex.getMessage());
            }

            String token = jwtCongCu.generateToken(email, "KHACH_HANG");
            String refreshToken = jwtCongCu.generateRefreshToken(email);

            Map<String, Object> userData = new java.util.HashMap<>();
            userData.put("id_khach_hang", kh.getId_khach_hang());
            userData.put("ten_khach_hang", kh.getTen_khach_hang());
            userData.put("email", kh.getEmail());
            userData.put("ten_vai_tro", "Khách hàng");
            userData.put("loai_tai_khoan", "KHACH_HANG");
            userData.put("display_name", kh.getTen_khach_hang());
            if (picture != null)
                userData.put("avatar", picture);

            logger.info("Google register successful for: " + email);
            return ResponseEntity
                    .ok(Map.of("token", token, "refreshToken", refreshToken, "user", userData, "message",
                            "Tạo tài khoản Google thành công!"));
        } catch (Exception e) {
            logger.severe("Google register error: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi tạo tài khoản Google: " + e.getMessage()));
        }
    }

    /**
     * Google Link - LiÃªn káº¿t Google vá»›i tÃ i khoáº£n Ä‘Ã£ cÃ³ (xÃ¡c thá»±c
     * báº±ng máº­t kháº©u)
     */
    @PostMapping("/google-link")
    @Operation(summary = "Liên kết tài khoản Google", description = "Liên kết tài khoản Google vào tài khoản thường đã có sẵn (Cần nhập mật khẩu)")
    public ResponseEntity<?> googleLink(@RequestBody Map<String, String> requestData) {
        try {
            String username = requestData.get("ten_dang_nhap");
            String password = requestData.get("mat_khau");
            String googleToken = requestData.get("token");

            Map<String, Object> googleProfile = verifyGoogleToken(googleToken);
            if (googleProfile == null) {
                return ResponseEntity.status(401)
                        .body(Map.of("message", "Token Google khÃ´ng há»£p lá»‡ hoáº·c Ä‘Ã£ háº¿t háº¡n!"));
            }
            String googleEmail = (String) googleProfile.get("email");
            String picture = (String) googleProfile.get("picture");

            if (username == null || password == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Thiáº¿u thÃ´ng tin Ä‘Äƒng nháº­p"));
            }

            Optional<com.rexi.pkty.entity.TaiKhoan> tkOpt = taiKhoanRepository.findByTenDangNhap(username);

            if (tkOpt.isEmpty()) {
                try {
                    List<Map<String, Object>> listKh = jdbcTemplate.queryForList(
                            "SELECT id_khach_hang FROM KhachHang WHERE email = ? OR sdt = ?", username, username);
                    if (!listKh.isEmpty())
                        tkOpt = taiKhoanRepository.findAccountByKhachHangId((String) listKh.get(0).get("id_khach_hang"));
                    if (tkOpt.isEmpty()) {
                        List<Map<String, Object>> listNv = jdbcTemplate.queryForList(
                                "SELECT id_nhan_vien FROM NhanVien WHERE email = ? OR so_dien_thoai = ?", username,
                                username);
                        if (!listNv.isEmpty())
                            tkOpt = taiKhoanRepository.findAccountByNhanVienId((String) listNv.get(0).get("id_nhan_vien"));
                    }
                } catch (Exception ignored) {
                }
            }

            if (tkOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("message", "KhÃ´ng tÃ¬m tháº¥y tÃ i khoáº£n!"));
            }

            com.rexi.pkty.entity.TaiKhoan tk = tkOpt.get();
            String realUsername = tk.getTen_dang_nhap();

            String status = tk.getTrang_thai();
            if (status != null && (status.equalsIgnoreCase("ÄÃ£ khÃ³a") || status.equalsIgnoreCase("inactive"))) {
                return ResponseEntity.status(403)
                        .body(Map.of("message",
                                "TÃ i khoáº£n nÃ y Ä‘Ã£ bá»‹ vÃ´ hiá»‡u hÃ³a, khÃ´ng thá»ƒ liÃªn káº¿t Google."));
            }

            if (!passwordEncoder.matches(password, tk.getMat_khau_hash())) {
                return ResponseEntity.status(401)
                        .body(Map.of("message", "Tên đăng nhập hoặc mật khẩu không chính xác."));
            }

            if (tk.getId_khach_hang() != null && googleEmail != null) {
                khachHangRepository.findById(tk.getId_khach_hang()).ifPresent(kh -> {
                    if (kh.getEmail() == null || kh.getEmail().isEmpty()) {
                        kh.setEmail(googleEmail);
                        khachHangRepository.save(kh);
                    }
                });
            }

            List<Map<String, Object>> loginResult = taiKhoanRepository.callSpDangNhap(realUsername);
            Map<String, Object> userData = new java.util.HashMap<>();
            String loaiTaiKhoan = "KHACH_HANG";
            if (!loginResult.isEmpty()) {
                userData = new java.util.HashMap<>(loginResult.get(0));
                if (userData.get("loai_tai_khoan") != null) {
                    loaiTaiKhoan = userData.get("loai_tai_khoan").toString();
                }
            }
            userData.put("ten_dang_nhap", realUsername);
            if (picture != null)
                userData.put("avatar", picture);

            String token = jwtCongCu.generateToken(realUsername, loaiTaiKhoan);
            String refreshToken = jwtCongCu.generateRefreshToken(realUsername);

            logger.info("Google link successful for: " + realUsername + " -> " + googleEmail);

            if (tk.getWelcome_email_sent() == null || !tk.getWelcome_email_sent()) {
                try {
                    String emailToSend = googleEmail != null ? googleEmail : realUsername;
                    emailService.guiEmailChaoMung(emailToSend, (String) userData.get("display_name"));
                    tk.setWelcome_email_sent(true);
                    taiKhoanRepository.save(tk);
                } catch (Exception ex) {
                    logger.warning("Lỗi gửi mail chào mừng Google Link: " + ex.getMessage());
                }
            }

            return ResponseEntity
                    .ok(Map.of("token", token, "refreshToken", refreshToken, "user", userData, "message",
                            "Liên kết Google thành công!"));
        } catch (Exception e) {
            logger.severe("Google link error: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi liên kết tài khoản: " + e.getMessage()));
        }
    }

    /**
     * ÄÄƒng kÃ½ - MÃ£ hÃ³a máº­t kháº©u trÆ°á»›c khi lÆ°u
     */
    @PostMapping("/register")
    @Operation(summary = "Đăng ký tài khoản thường", description = "Đăng ký bằng tên đăng nhập và mật khẩu")
    public ResponseEntity<?> register(@Valid @RequestBody YeuCauDangKy request, BindingResult bindingResult,
            jakarta.servlet.http.HttpServletRequest httpRequest) {
        String clientIp = httpRequest.getRemoteAddr();
        Long lastTime = lastRegisterTime.get(clientIp);
        if (lastTime != null && System.currentTimeMillis() - lastTime < 60000) {
            logger.warning("Spam registration blocked for IP: " + clientIp);
            return ResponseEntity.status(429).body(Map.of("message",
                    "Cảnh báo chống Spam: Bạn đang tạo tài khoản quá nhanh. Vui lòng đợi 1 phút rồi thử lại!"));
        }

        if (bindingResult.hasErrors()) {
            String errorMsg = bindingResult.getFieldError().getDefaultMessage();
            return ResponseEntity.badRequest().body(Map.of("message", errorMsg));
        }

        try {
            if (taiKhoanRepository.findByTenDangNhap(request.getTen_dang_nhap()).isPresent()) {
                return ResponseEntity.status(409)
                        .body(Map.of("message", "Tên đăng nhập đã tồn tại. Vui lòng chọn tên khác."));
            }
            if (request.getEmail() != null && !request.getEmail().isEmpty()) {
                if (khachHangRepository.findByEmail(request.getEmail()).isPresent()) {
                    return ResponseEntity.status(409)
                            .body(Map.of("message", "Email này đã được sử dụng. Vui lòng dùng email khác."));
                }
            }
            if (request.getSdt() != null && !request.getSdt().isEmpty()) {
                if (khachHangRepository.findAll().stream().anyMatch(kh -> request.getSdt().equals(kh.getSdt()))) {
                    return ResponseEntity.status(409).body(Map.of("message", "Số điện thoại đã được đăng ký."));
                }
            }

            String hashedPassword = passwordEncoder.encode(request.getMat_khau());

            List<Map<String, Object>> result = taiKhoanRepository.callSpDangKy(
                    request.getTen_dang_nhap(),
                    hashedPassword,
                    request.getTen_khach_hang(),
                    request.getEmail(),
                    request.getSdt(),
                    request.getDia_chi());

            if (!result.isEmpty()) {
                logger.info("Đăng ký thành công cho tài khoản: " + request.getTen_dang_nhap());
                lastRegisterTime.put(clientIp, System.currentTimeMillis());
                return ResponseEntity.ok(result.get(0));
            }
            return ResponseEntity.ok(Map.of("message", "Đăng ký thành công!"));
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            String msg = e.getMostSpecificCause().getMessage();
            logger.warning("Registration data conflict: " + msg);

            if (msg.contains("UQ_KhachHang_Email") || msg.contains("Email")) {
                return ResponseEntity.status(409)
                        .body(Map.of("message", "Email này đã được sử dụng. Vui lòng dùng email khác."));
            } else if (msg.contains("ten_dang_nhap") || msg.contains("PRIMARY KEY")) {
                return ResponseEntity.status(409).body(Map.of("message", "Tên đăng nhập đã tồn tại."));
            } else if (msg.contains("UQ_KhachHang_SDT") || msg.contains("sdt")) {
                return ResponseEntity.status(409)
                        .body(Map.of("message", "Số điện thoại đã được đăng ký."));
            }

            return ResponseEntity.status(400)
                    .body(Map.of("message", "Thông tin đăng ký bị trùng lặp hoặc không hợp lệ."));
        } catch (Exception e) {
            logger.severe("Registration error: " + e.getMessage());
            return ResponseEntity.status(500)
                    .body(Map.of("message", "Lỗi hệ thống khi đăng ký. Vui lòng thử lại sau."));
        }
    }

    /**
     * API Táº¡o nhanh khÃ¡ch hÃ ng cho NhÃ¢n viÃªn/Admin (Tá»‘c Ä‘á»™ cao)
     */
    @PostMapping("/register-simple")
    @Operation(summary = "Tạo nhanh Khách Hàng", description = "Dành riêng cho Admin/Lễ tân tạo nhanh khách từ SĐT")
    public ResponseEntity<?> registerSimple(@RequestBody Map<String, String> request) {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        if (auth == null || auth.getName().equals("anonymousUser")) {
            return ResponseEntity.status(401)
                    .body(Map.of("message", "Cảnh báo bảo mật: Yêu cầu không có Token xác thực hợp lệ!"));
        }
        String role = auth.getAuthorities().toString().toUpperCase();
        if (!role.contains("ADMIN") && !role.contains("QUANLY") && !role.contains("STAFF")
                && !role.contains("BAC_SI")) {
            return ResponseEntity.status(403).body(
                    Map.of("message", "Cảnh báo bảo mật: Chỉ nhân viên phòng khám mới được dùng tính năng tạo nhanh!"));
        }

        try {
            String sdt = request.get("sdt");
            String email = request.get("email");
            if (sdt == null || sdt.trim().isEmpty()) {
                return ResponseEntity.status(400).body(Map.of("message", "Số điện thoại là bắt buộc!"));
            }
            if (taiKhoanRepository.findByTenDangNhap(sdt).isPresent() ||
                    khachHangRepository.findAll().stream().anyMatch(kh -> sdt.equals(kh.getSdt()))) {
                return ResponseEntity.status(409)
                        .body(Map.of("message", "Số điện thoại này đã tồn tại trong hệ thống."));
            }
            if (email != null && !email.trim().isEmpty() && khachHangRepository.findByEmail(email).isPresent()) {
                return ResponseEntity.status(409).body(Map.of("message", "Email này đã được sử dụng."));
            }

            com.rexi.pkty.entity.KhachHang kh = new com.rexi.pkty.entity.KhachHang();
            kh.setTen_khach_hang(request.get("ten_khach_hang"));
            kh.setSdt(request.get("sdt"));
            if (email == null || email.trim().isEmpty()) {
                email = request.get("sdt") + "@rexi.vn";
            }
            kh.setEmail(email);
            kh.setDia_chi("");
            kh.setNgay_dang_ky(java.time.LocalDateTime.now());
            kh = khachHangRepository.save(kh);

            com.rexi.pkty.entity.TaiKhoan tk = new com.rexi.pkty.entity.TaiKhoan();
            tk.setTen_dang_nhap(request.get("sdt"));
            tk.setMat_khau("rexi@123");
            tk.setMat_khau_hash(passwordEncoder.encode("rexi@123"));
            tk.setId_khach_hang(kh.getId_khach_hang());
            tk.setId_vai_tro("VT-KH");
            tk.setTrang_thai("HOAT_DONG");
            tk.setNgay_tao(java.time.LocalDateTime.now());
            taiKhoanRepository.save(tk);

            Map<String, Object> user = new java.util.HashMap<>();
            user.put("id_khach_hang", kh.getId_khach_hang());

            return ResponseEntity.ok(Map.of("user", user, "message", "Táº¡o nhanh thÃ nh cÃ´ng!"));
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            String msg = e.getMostSpecificCause().getMessage();
            logger.warning("Register simple data conflict: " + msg);

            if (msg.contains("UQ_KhachHang_Email") || msg.contains("Email")) {
                return ResponseEntity.status(409)
                        .body(Map.of("message", "Email nÃ y Ä‘Ã£ Ä‘Æ°á»£c sá»­ dá»¥ng. Vui lÃ²ng dÃ¹ng email khÃ¡c."));
            } else if (msg.contains("UQ_KhachHang_SDT") || msg.contains("sdt")) {
                return ResponseEntity.status(409)
                        .body(Map.of("message", "Sá»‘ Ä‘iá»‡n thoáº¡i Ä‘Ã£ Ä‘Æ°á»£c Ä‘Äƒng kÃ½."));
            }

            return ResponseEntity.status(400)
                    .body(Map.of("message", "ThÃ´ng tin Ä‘Äƒng kÃ½ bá»‹ trÃ¹ng láº·p hoáº·c khÃ´ng há»£p lá»‡."));
        } catch (Exception e) {
            logger.severe("Register simple error: " + e.getMessage());
            return ResponseEntity.status(500)
                    .body(Map.of("message", "Lá»—i há»‡ thá»‘ng khi táº¡o khÃ¡ch hÃ ng nhanh."));
        }
    }

    /**
     * Äá»•i máº­t kháº©u - Sá»­ dá»¥ng mÃ£ hÃ³a BCrypt
     */
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> request) {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        String username = (auth != null) ? auth.getName() : null;

        if (username == null || username.equals("anonymousUser")) {
            return ResponseEntity.status(401)
                    .body(Map.of("message", "Cảnh báo bảo mật: Yêu cầu không có Token xác thực hợp lệ!"));
        }

        String currentPass = request.get("mat_khau_hien_tai");
        String newPass = request.get("mat_khau_moi");

        Optional<com.rexi.pkty.entity.TaiKhoan> tkOpt = taiKhoanRepository.findByTenDangNhap(username);
        if (tkOpt.isPresent()) {
            com.rexi.pkty.entity.TaiKhoan tk = tkOpt.get();

            String storedHash = (tk.getMat_khau_hash() != null && !tk.getMat_khau_hash().isEmpty())
                    ? tk.getMat_khau_hash()
                    : tk.getMat_khau();
            boolean isMatch = false;
            if (storedHash != null && currentPass != null) {
                if (storedHash.startsWith("$2a$") || storedHash.startsWith("$2b$") || storedHash.startsWith("$2y$")) {
                    isMatch = passwordEncoder.matches(currentPass, storedHash);
                } else {
                    isMatch = storedHash.equals(currentPass);
                }
            }

            if (isMatch) {
                String newHashedPassword = passwordEncoder.encode(newPass);
                taiKhoanRepository.changePassword(username, newHashedPassword);
                logger.info("Đã đổi mật khẩu thành công cho: " + username);
                return ResponseEntity.ok(Map.of("message", "Đổi mật khẩu thành công!"));
            } else {
                logger.warning("Cố gắng đổi mật khẩu thất bại cho: " + username);
                return ResponseEntity.status(400).body(Map.of("message", "Mật khẩu hiện tại không đúng!"));
            }
        }
        logger.warning("Lỗi đổi mật khẩu - Không tìm thấy tài khoản: " + username);
        return ResponseEntity.status(404).body(Map.of("message", "Không tìm thấy tài khoản!"));
    }

    /**
     * QuÃªn máº­t kháº©u - BÆ°á»›c 1: XÃ¡c minh tÃ i khoáº£n
     */
    @PostMapping("/forgot-password-verify")
    public ResponseEntity<?> verifyAccount(@RequestBody Map<String, String> request) {
        String username = request.get("ten_dang_nhap");
        String email = request.get("email");
        String phone = request.get("so_dien_thoai");

        Optional<com.rexi.pkty.entity.TaiKhoan> tkOpt = taiKhoanRepository.findByTenDangNhap(username);

        if (tkOpt.isEmpty()) {
            try {
                List<Map<String, Object>> listKh = jdbcTemplate.queryForList(
                        "SELECT id_khach_hang FROM KhachHang WHERE email = ? OR sdt = ?", username, username);
                if (!listKh.isEmpty())
                    tkOpt = taiKhoanRepository.findAccountByKhachHangId((String) listKh.get(0).get("id_khach_hang"));
                if (tkOpt.isEmpty()) {
                    List<Map<String, Object>> listNv = jdbcTemplate.queryForList(
                            "SELECT id_nhan_vien FROM NhanVien WHERE email = ? OR so_dien_thoai = ?", username,
                            username);
                    if (!listNv.isEmpty())
                        tkOpt = taiKhoanRepository.findAccountByNhanVienId((String) listNv.get(0).get("id_nhan_vien"));
                }
            } catch (Exception ignored) {
            }
        }

        if (tkOpt.isPresent()) {
            com.rexi.pkty.entity.TaiKhoan tk = tkOpt.get();
            String dbEmail = null;
            String dbPhone = null;

            if (tk.getId_khach_hang() != null) {
                com.rexi.pkty.entity.KhachHang kh = khachHangRepository.findById(tk.getId_khach_hang()).orElse(null);
                if (kh != null) {
                    dbEmail = kh.getEmail();
                    dbPhone = kh.getSdt();
                }
            } else if (tk.getId_nhan_vien() != null) {
                try {
                    Map<String, Object> nvInfo = jdbcTemplate.queryForMap(
                            "SELECT email, so_dien_thoai FROM NhanVien WHERE id_nhan_vien = ?", tk.getId_nhan_vien());
                    dbEmail = (String) nvInfo.get("email");
                    dbPhone = (String) nvInfo.get("so_dien_thoai");
                } catch (Exception ignored) {
                }
            }

            boolean emailMatch = dbEmail != null && dbEmail.equalsIgnoreCase(email);
            boolean phoneMatch = dbPhone != null && dbPhone.equals(phone);

            if (emailMatch && phoneMatch) {
                logger.info("Xác minh tài khoản thành công bằng SĐT/Email: " + tk.getTen_dang_nhap());
                return ResponseEntity.ok(Map.of("message", "Xác minh thành công!", "username", tk.getTen_dang_nhap()));
            }
        }

        logger.warning("Xác minh tài khoản thất bại để đặt lại mật khẩu: " + username);
        return ResponseEntity.status(404).body(Map.of("message", "Thông tin tài khoản không chính xác!"));
    }

    /**
     * QuÃªn máº­t kháº©u - BÆ°á»›c 2: Äáº·t láº¡i máº­t kháº©u má»›i
     */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String username = request.get("ten_dang_nhap");
        String providedEmail = request.get("email");
        String providedPhone = request.get("so_dien_thoai");
        String newPass = request.get("mat_khau_moi");
        String method = request.get("phuong_thuc");

        com.rexi.pkty.entity.TaiKhoan tk = null;

        if (username != null && !username.isEmpty()) {
            tk = taiKhoanRepository.findByTenDangNhap(username).orElse(null);
        }

        if (tk == null && providedEmail != null && !providedEmail.isEmpty()) {
            Optional<com.rexi.pkty.entity.KhachHang> khOpt = khachHangRepository.findByEmail(providedEmail);
            if (khOpt.isPresent()) {
                List<com.rexi.pkty.entity.TaiKhoan> listTk = taiKhoanRepository.findAll();
                for (com.rexi.pkty.entity.TaiKhoan t : listTk) {
                    if (khOpt.get().getId_khach_hang().equals(t.getId_khach_hang())) {
                        tk = t;
                        username = tk.getTen_dang_nhap();
                        break;
                    }
                }
            } else {
                try {
                    List<Map<String, Object>> nvList = jdbcTemplate
                            .queryForList("SELECT id_nhan_vien FROM NhanVien WHERE email = ?", providedEmail);
                    if (!nvList.isEmpty()) {
                        String idNv = (String) nvList.get(0).get("id_nhan_vien");
                        List<com.rexi.pkty.entity.TaiKhoan> listTk = taiKhoanRepository.findAll();
                        for (com.rexi.pkty.entity.TaiKhoan t : listTk) {
                            if (idNv.equals(t.getId_nhan_vien())) {
                                tk = t;
                                username = tk.getTen_dang_nhap();
                                break;
                            }
                        }
                    }
                } catch (Exception ignored) {
                }
            }
        }

        if (tk == null) {
            return ResponseEntity.status(404)
                    .body(Map.of("message", "Không tìm thấy tài khoản tương ứng với thông tin này!"));
        }

        if ("nhanh".equals(method)) {
            String dbEmail = null;
            String dbPhone = null;

            if (tk.getId_khach_hang() != null) {
                com.rexi.pkty.entity.KhachHang kh = khachHangRepository.findById(tk.getId_khach_hang()).orElse(null);
                if (kh != null) {
                    dbEmail = kh.getEmail();
                    dbPhone = kh.getSdt();
                }
            } else if (tk.getId_nhan_vien() != null) {
                try {
                    Map<String, Object> nvInfo = jdbcTemplate.queryForMap(
                            "SELECT email, so_dien_thoai FROM NhanVien WHERE id_nhan_vien = ?", tk.getId_nhan_vien());
                    dbEmail = (String) nvInfo.get("email");
                    dbPhone = (String) nvInfo.get("so_dien_thoai");
                } catch (Exception ignored) {
                }
            }

            if (dbEmail == null || dbPhone == null || !dbEmail.equalsIgnoreCase(providedEmail)
                    || !dbPhone.equals(providedPhone)) {
                return ResponseEntity.status(403)
                        .body(Map.of("message", "Thông tin Số điện thoại hoặc Email không khớp với hệ thống!"));
            }
        } else {
            boolean isEmailVerified = providedEmail != null
                    && HeThongController.verifiedEmails.containsKey(providedEmail);
            if (!isEmailVerified) {
                logger.warning("Cảnh báo: Đặt lại mật khẩu bỏ qua OTP cho email: " + providedEmail);
                return ResponseEntity.status(403)
                        .body(Map.of("message", "Yêu cầu xác minh OTP trước khi đặt lại mật khẩu!"));
            }

            String dbEmail = null;
            if (tk.getId_khach_hang() != null) {
                dbEmail = khachHangRepository.findById(tk.getId_khach_hang())
                        .map(com.rexi.pkty.entity.KhachHang::getEmail).orElse(null);
            } else if (tk.getId_nhan_vien() != null) {
                try {
                    dbEmail = jdbcTemplate.queryForObject("SELECT email FROM NhanVien WHERE id_nhan_vien = ?",
                            String.class, tk.getId_nhan_vien());
                } catch (Exception ignored) {
                }
            }

            if (dbEmail == null || !dbEmail.equalsIgnoreCase(providedEmail)) {
                return ResponseEntity.status(403)
                        .body(Map.of("message",
                                "Cáº£nh bÃ¡o báº£o máº­t: Email xÃ¡c nháº­n khÃ´ng khá»›p vá»›i tÃ i khoáº£n yÃªu cáº§u!"));
            }

            HeThongController.verifiedEmails.remove(providedEmail);
        }

        String newHashedPassword = passwordEncoder.encode(newPass);
        taiKhoanRepository.changePassword(tk.getTen_dang_nhap(), newHashedPassword);
        logger.info("Äáº·t láº¡i máº­t kháº©u thÃ nh cÃ´ng cho: " + username);
        return ResponseEntity
                .ok(Map.of("message", "Äáº·t láº¡i máº­t kháº©u thÃ nh cÃ´ng! HÃ£y Ä‘Äƒng nháº­p láº¡i."));
    }

    private Map<String, Object> verifyGoogleToken(String googleToken) {
        if (googleToken == null || googleToken.isEmpty()) {
            return null;
        }
        try {
            RestTemplate restTemplate = new RestTemplate();
            String googleApiUrl = "https://oauth2.googleapis.com/tokeninfo?id_token=" + googleToken;
            return restTemplate.getForObject(googleApiUrl, Map.class);
        } catch (Exception ex) {
            logger.warning("Token Google không hợp lệ: " + ex.getMessage());
            return null;
        }
    }

    /**
     * API LÃ m má»›i Token (DÃ¹ng khi Access Token háº¿t háº¡n)
     */
    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshToken(@RequestBody Map<String, String> request) {
        String refreshToken = request.get("refreshToken");
        if (refreshToken == null || refreshToken.isEmpty()) {
            return ResponseEntity.status(400).body(Map.of("message", "Thiáº¿u Refresh Token"));
        }
        try {
            String username = jwtCongCu.extractUsername(refreshToken);
            if (jwtCongCu.validateToken(refreshToken, username)) {
                com.rexi.pkty.entity.TaiKhoan tk = taiKhoanRepository.findByTenDangNhap(username).orElse(null);
                if (tk != null && !tk.getTrang_thai().equalsIgnoreCase("ÄÃ£ khÃ³a")
                        && !tk.getTrang_thai().equalsIgnoreCase("inactive")) {
                    List<String> roles = jdbcTemplate.queryForList(
                            "SELECT ten_vai_tro FROM VaiTroHeThong WHERE id_vai_tro = ?", String.class,
                            tk.getId_vai_tro());
                    String roleName = roles.isEmpty() ? "KHACH_HANG" : roles.get(0).toLowerCase();

                    String loaiTaiKhoan = "KHACH_HANG";
                    if (roleName.contains("admin") || roleName.contains("quản trị"))
                        loaiTaiKhoan = "ADMIN";
                    else if (roleName.contains("quản lý") || roleName.contains("quan ly"))
                        loaiTaiKhoan = "QUAN_LY";
                    else if (roleName.contains("bác sĩ") || roleName.contains("bac si"))
                        loaiTaiKhoan = "BAC_SI";
                    else if (roleName.contains("tiếp tân") || roleName.contains("y tá")
                            || roleName.contains("nhân viên") || roleName.contains("kế toán"))
                        loaiTaiKhoan = "STAFF";

                    String newToken = jwtCongCu.generateToken(username, loaiTaiKhoan);
                    return ResponseEntity.ok(Map.of("token", newToken));
                } else {
                    return ResponseEntity.status(403).body(Map.of("message", "TÃ i khoáº£n Ä‘Ã£ bá»‹ khÃ³a!"));
                }
            }
        } catch (Exception e) {
            logger.warning("Lá»—i lÃ m má»›i Token: " + e.getMessage());
        }
        return ResponseEntity.status(401)
                .body(Map.of("message", "Refresh Token khÃ´ng há»£p lá»‡ hoáº·c Ä‘Ã£ háº¿t háº¡n"));
    }

}
