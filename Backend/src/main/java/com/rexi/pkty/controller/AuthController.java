package com.rexi.pkty.controller;

import com.rexi.pkty.dto.LoginRequest;
import com.rexi.pkty.dto.RegisterRequest;
import com.rexi.pkty.dto.GoogleAuthRequest;
import com.rexi.pkty.repository.TaiKhoanRepository;
import com.rexi.pkty.repository.KhachHangRepository;
import com.rexi.pkty.security.JwtUtil;
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

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "${cors.allowed-origins:http://localhost:3000}")
public class AuthController {

    private static final Logger logger = Logger.getLogger(AuthController.class.getName());

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
    private JwtUtil jwtUtil;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Autowired
    private com.rexi.pkty.service.AuditLogService auditLogService;

    @Autowired
    private com.rexi.pkty.service.EmailService emailService;

    /**
     * SỬA LỖI #2: Đăng nhập - Sử dụng BCrypt để kiểm tra mật khẩu
     * SỬA LỖI #7: Thêm bước kiểm tra dữ liệu đầu vào (Validation)
     * SỬA LỖI #8: Bảo mật thông tin lỗi (Không trả về chi tiết Exception)
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request, BindingResult bindingResult,
            jakarta.servlet.http.HttpServletRequest httpRequest) {
        String username = request.getUsername();
        String clientIp = httpRequest.getRemoteAddr();
        String lockoutKey = username + "-" + clientIp;

        // BẢO MẬT: Kiểm tra Lockout (Chống Brute Force)
        Long lockTime = lockoutTime.get(lockoutKey);
        if (lockTime != null) {
            if (System.currentTimeMillis() < lockTime) {
                logger.warning("Blocked brute force attempt for: " + lockoutKey);
                auditLogService.logActionWithUsername(username, "CẢNH BÁO", "TaiKhoan",
                        "Tài khoản bị khóa tạm thời do nhập sai quá nhiều lần");
                return ResponseEntity.status(429).body(Map.of("message",
                        "Tài khoản tạm thời bị khóa do nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút!"));
            } else {
                lockoutTime.remove(lockoutKey);
                loginAttempts.remove(lockoutKey);
            }
        }

        logger.info("Login attempt: user=" + username);

        if (bindingResult.hasErrors()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Dữ liệu không hợp lệ"));
        }

        com.rexi.pkty.entity.TaiKhoan tk = null;
        try {
            // SỬA LỖI: Tìm trực tiếp bằng Repository thay vì gọi qua Stored Procedure để tránh lỗi logic bên trong SQL
            Optional<com.rexi.pkty.entity.TaiKhoan> tkOpt = taiKhoanRepository.findByTenDangNhap(username);

            if (tkOpt.isEmpty()) {
                handleFailedAttempt(lockoutKey);
                auditLogService.logActionWithUsername(username, "CẢNH BÁO", "TaiKhoan",
                        "Đăng nhập thất bại (Không tìm thấy tài khoản)");
                return ResponseEntity.status(401).body(Map.of("message", "Sai tài khoản hoặc mật khẩu!"));
            }

            tk = tkOpt.get();

                // BẢO MẬT: Chặn đăng nhập nếu tài khoản đã bị khóa hoặc vô hiệu hóa
                String status = tk.getTrang_thai();
                if (status != null && (status.equalsIgnoreCase("Đã khóa") || status.equalsIgnoreCase("inactive"))) {
                    logger.warning("Cảnh báo: Cố gắng đăng nhập vào tài khoản đã bị khóa: " + request.getUsername());
                    return ResponseEntity.status(403).body(Map.of("message",
                            "Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ phòng khám để biết thêm chi tiết!"));
                }

                // Nếu mat_khau_hash null (do đăng ký qua SP), lấy từ mat_khau
                String storedHash = (tk.getMat_khau_hash() != null && !tk.getMat_khau_hash().isEmpty())
                        ? tk.getMat_khau_hash()
                        : tk.getMat_khau();

                boolean isMatch = false;
                if (storedHash != null) {
                    // Kiểm tra xem chuỗi có phải là Hash BCrypt không
                    if (storedHash.startsWith("$2a$") || storedHash.startsWith("$2b$") || storedHash.startsWith("$2y$")) {
                        isMatch = passwordEncoder.matches(request.getPassword(), storedHash);
                    } else {
                        // Hỗ trợ đăng nhập bằng mật khẩu chưa mã hóa (Bản cũ)
                        isMatch = storedHash.equals(request.getPassword());
                        if (isMatch) {
                            // Tự động migrate sang mã hóa BCrypt
                            tk.setMat_khau_hash(passwordEncoder.encode(request.getPassword()));
                            taiKhoanRepository.save(tk);
                        }
                    }
                }

                if (!isMatch) {
                    logger.warning("Đăng nhập thất bại cho tài khoản: " + request.getUsername());
                    handleFailedAttempt(lockoutKey);
                    auditLogService.logActionWithUsername(username, "CẢNH BÁO", "TaiKhoan",
                            "Đăng nhập thất bại (Sai mật khẩu)");
                    return ResponseEntity.status(401).body(Map.of("message", "Sai tài khoản hoặc mật khẩu!"));
                }

            // Đăng nhập thành công -> Xóa bộ đếm
            loginAttempts.remove(lockoutKey);
            lockoutTime.remove(lockoutKey);

            String idVaiTro = tk.getId_vai_tro();
            String loaiTaiKhoan = "CUSTOMER";
            String tenVaiTro = "Khách hàng";

            if (idVaiTro != null) {
                if (idVaiTro.equals("VT-1") || idVaiTro.contains("ADMIN")) {
                    loaiTaiKhoan = "ADMIN";
                    tenVaiTro = "Quản trị";
                } else if (idVaiTro.equals("VT-6") || idVaiTro.contains("QL")) {
                    loaiTaiKhoan = "QUAN_LY";
                    tenVaiTro = "Quản lý";
                } else if (idVaiTro.equals("VT-2") || idVaiTro.contains("BS")) {
                    loaiTaiKhoan = "BAC_SI";
                    tenVaiTro = "Bác sĩ";
                } else if (idVaiTro.equals("VT-4") || idVaiTro.contains("KT")) {
                    loaiTaiKhoan = "KE_TOAN";
                    tenVaiTro = "Kế toán";
                } else if (idVaiTro.equals("VT-7") || idVaiTro.contains("TT")) {
                    loaiTaiKhoan = "TIEP_TAN";
                    tenVaiTro = "Tiếp tân";
                } else if (idVaiTro.equals("VT-8") || idVaiTro.contains("YT")) {
                    loaiTaiKhoan = "Y_TA";
                    tenVaiTro = "Y tá";
                } else if (idVaiTro.equals("VT-3") || idVaiTro.contains("NV")) {
                    loaiTaiKhoan = "STAFF";
                    tenVaiTro = "Nhân viên";
                } else if (idVaiTro.equals("VT-5")) {
                    loaiTaiKhoan = "CUSTOMER";
                    tenVaiTro = "Khách hàng";
                }
            }

            // Lấy thông tin hiển thị và ID người dùng
            String displayName = tk.getTen_dang_nhap();
            Map<String, Object> userData = new java.util.HashMap<>();
            userData.put("ten_dang_nhap", tk.getTen_dang_nhap());
            userData.put("loai_tai_khoan", loaiTaiKhoan);
            userData.put("ten_vai_tro", tenVaiTro);

            if (!"CUSTOMER".equals(loaiTaiKhoan)) {
                String idNv = tk.getId_nhan_vien();
                userData.put("id_nhan_vien", idNv);
                try {
                    List<Map<String, Object>> list = jdbcTemplate.queryForList("SELECT ho_ten, hinh_anh FROM NhanVien WHERE id_nhan_vien = ?", idNv);
                    if (!list.isEmpty()) {
                        Map<String, Object> info = list.get(0);
                        if (info.get("ho_ten") != null) {
                            displayName = info.get("ho_ten").toString();
                            userData.put("ho_ten", displayName);
                        }
                        if (info.get("hinh_anh") != null) {
                            userData.put("avatar", info.get("hinh_anh").toString());
                        }
                    }
                } catch (Exception ignored) {}
            } else {
                String idKh = tk.getId_khach_hang();
                userData.put("id_khach_hang", idKh);
                try {
                    List<Map<String, Object>> list = jdbcTemplate.queryForList("SELECT ten_khach_hang, hinh_anh FROM KhachHang WHERE id_khach_hang = ?", idKh);
                    if (!list.isEmpty()) {
                        Map<String, Object> info = list.get(0);
                        if (info.get("ten_khach_hang") != null) {
                            displayName = info.get("ten_khach_hang").toString();
                            userData.put("ten_khach_hang", displayName);
                            userData.put("ho_ten", displayName); // Map chung để Frontend dễ dùng
                        }
                        if (info.get("hinh_anh") != null) {
                            userData.put("avatar", info.get("hinh_anh").toString());
                        }
                    }
                } catch (Exception ignored) {}
            }
            userData.put("displayName", displayName);

            // SỬA LỖI #5: Tạo Token JWT với thời gian hết hạn cụ thể
            String token = jwtUtil.generateToken(tk.getTen_dang_nhap(), loaiTaiKhoan);
            String refreshToken = jwtUtil.generateRefreshToken(tk.getTen_dang_nhap());

            logger.info("Đăng nhập thành công cho: " + request.getUsername());
            auditLogService.logActionWithUsername(username, "ĐĂNG NHẬP", "TaiKhoan",
                    "Đăng nhập thành công vào hệ thống");

            // TÍNH NĂNG MỚI: Gửi mail chào mừng nếu là lần đăng nhập đầu tiên
            if (tk.getWelcome_email_sent() == null || !tk.getWelcome_email_sent()) {
                String email = null;
                if (tk.getKhach_hang() != null) email = tk.getKhach_hang().getEmail();
                if (email == null && tk.getTen_dang_nhap() != null && tk.getTen_dang_nhap().contains("@")) {
                    email = tk.getTen_dang_nhap();
                }
                
                if (email != null && !email.isEmpty()) {
                    try {
                        emailService.sendWelcomeEmailHTML(email, (String) userData.get("displayName"));
                        tk.setWelcome_email_sent(true);
                        taiKhoanRepository.save(tk);
                        logger.info("Đã gửi mail chào mừng tới khách hàng: " + email);
                    } catch (Exception ex) {
                        logger.warning("Lỗi gửi mail chào mừng: " + ex.getMessage());
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
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi hệ thống. Vui lòng thử lại sau."));
        }
    }

    private void handleFailedAttempt(String lockoutKey) {
        int attempts = loginAttempts.getOrDefault(lockoutKey, 0) + 1;
        loginAttempts.put(lockoutKey, attempts);
        if (attempts >= MAX_ATTEMPTS) {
            lockoutTime.put(lockoutKey, System.currentTimeMillis() + LOCKOUT_DURATION);
        }
    }

    /**
     * SỬA LỖI #9: Đăng nhập Google - Kiểm tra Token chuẩn xác
     */
    @PostMapping("/google-login")
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

            // BƯỚC 1: Tìm trong bảng Nhân Viên trước (Ưu tiên quyền quản trị)
            Optional<com.rexi.pkty.entity.NhanVien> nvOpt = nhanVienRepository.findByEmail(email);
            com.rexi.pkty.entity.TaiKhoan tk;
            String loaiTaiKhoan;
            String displayName;
            String idNguoiDung = null;
            // DÙNG DỮ LIỆU CHUẨN: Tìm tài khoản trước
            tk = taiKhoanRepository.findByTenDangNhap(email).orElse(null);

            if (tk != null) {
                // DÙNG DỮ LIỆU CHUẨN TỪ TAIKHOAN: Lấy role trực tiếp từ DB
                String dbRole = tk.getId_vai_tro() != null ? tk.getId_vai_tro().toUpperCase() : "";
                if ("rexivetsys@gmail.com".equalsIgnoreCase(email)) {
                    dbRole = "VT-1";
                }
                if (dbRole.equals("VT-1") || dbRole.contains("ADMIN")) {
                    loaiTaiKhoan = "ADMIN";
                } else if (dbRole.equals("VT-6") || dbRole.contains("QL")) {
                    loaiTaiKhoan = "QUAN_LY";
                } else if (dbRole.equals("VT-2") || dbRole.contains("BS")) {
                    loaiTaiKhoan = "BAC_SI";
                } else if (dbRole.equals("VT-4") || dbRole.contains("KT")) {
                    loaiTaiKhoan = "KE_TOAN";
                } else if (dbRole.equals("VT-7") || dbRole.contains("TT")) {
                    loaiTaiKhoan = "TIEP_TAN";
                } else if (dbRole.equals("VT-8") || dbRole.contains("YT")) {
                    loaiTaiKhoan = "Y_TA";
                } else if (dbRole.equals("VT-3") || dbRole.contains("STAFF") || tk.getId_nhan_vien() != null) {
                    loaiTaiKhoan = "STAFF";
                } else {
                    loaiTaiKhoan = "KHACH_HANG";
                }

                // LẤY TÊN THẬT TỪ DB (NHÂN VIÊN HOẶC KHÁCH HÀNG)
                displayName = "Người dùng DB"; // Mặc định nếu không tìm thấy cả 2
                if (tk.getId_nhan_vien() != null) {
                    com.rexi.pkty.entity.NhanVien nv = nhanVienRepository.findById(tk.getId_nhan_vien()).orElse(null);
                    if (nv != null) {
                        displayName = nv.getHo_ten();
                        idNguoiDung = nv.getId_nhan_vien();
                        if ((nv.getHinh_anh() == null || nv.getHinh_anh().isEmpty()) && picture != null) {
                            nv.setHinh_anh(picture);
                            nhanVienRepository.save(nv);
                        }
                    } else {
                        // Nếu ID nhân viên trong TaiKhoan không tồn tại trong NhanVien (như trường hợp
                        // ID=1)
                        displayName = "Nhân viên (ID:" + tk.getId_nhan_vien() + ")";
                        idNguoiDung = tk.getId_nhan_vien();
                    }
                }

                // Nếu chưa có tên (hoặc là khách hàng), tìm trong bảng KhachHang
                if (tk.getId_khach_hang() != null
                        && (displayName.startsWith("Người dùng") || displayName.startsWith("Nhân viên"))) {
                    com.rexi.pkty.entity.KhachHang kh = khachHangRepository.findById(tk.getId_khach_hang())
                            .orElse(null);
                    if (kh != null) {
                        displayName = kh.getTen_khach_hang();
                        idNguoiDung = kh.getId_khach_hang();
                        if ((kh.getHinh_anh() == null || kh.getHinh_anh().isEmpty()) && picture != null) {
                            kh.setHinh_anh(picture);
                            khachHangRepository.save(kh);
                        }
                    }
                }
            } else {
                // BẢO MẬT & FIX LỖI 500: Đảm bảo Vai trò tồn tại trong DB để tránh lỗi Foreign Key Constraint
                try {
                    jdbcTemplate.update("IF NOT EXISTS (SELECT 1 FROM VaiTroHeThong WHERE id_vai_tro = 'VT-5') INSERT INTO VaiTroHeThong (id_vai_tro, ten_vai_tro, mo_ta) VALUES ('VT-5', N'Khách hàng', N'Khách hàng hệ thống')");
                    jdbcTemplate.update("IF NOT EXISTS (SELECT 1 FROM VaiTroHeThong WHERE id_vai_tro = 'VT-3') INSERT INTO VaiTroHeThong (id_vai_tro, ten_vai_tro, mo_ta) VALUES ('VT-3', N'Nhân viên', N'Nhân viên phòng khám')");
                } catch (Exception ignored) {}

                // Nếu chưa có tài khoản, thì mới đi tìm xem là Nhân viên hay Khách hàng để tạo
                // mới
                if (nvOpt.isPresent()) {
                    com.rexi.pkty.entity.NhanVien nv = nvOpt.get();
                    loaiTaiKhoan = "STAFF"; // Mặc định cho nhân viên mới
                    displayName = nv.getHo_ten();
                    idNguoiDung = nv.getId_nhan_vien();

                    com.rexi.pkty.entity.TaiKhoan newTk = new com.rexi.pkty.entity.TaiKhoan();
                    newTk.setId_tai_khoan("TK-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase());
                    newTk.setTen_dang_nhap(email);
                    String randomPass = "GOOGLE_" + java.util.UUID.randomUUID().toString().substring(0, 8);
                    newTk.setMat_khau("[ENCRYPTED]");
                    newTk.setMat_khau_hash(passwordEncoder.encode(randomPass));
                    newTk.setId_nhan_vien(nv.getId_nhan_vien());
                    newTk.setId_vai_tro("VT-3"); 
                    newTk.setTrang_thai("active");
                    newTk.setNgay_tao(java.time.LocalDateTime.now());
                    tk = taiKhoanRepository.save(newTk);
                } else {
                    loaiTaiKhoan = "KHACH_HANG";
                    com.rexi.pkty.entity.KhachHang kh = khachHangRepository.findByEmail(email).orElseGet(() -> {
                        com.rexi.pkty.entity.KhachHang newKh = new com.rexi.pkty.entity.KhachHang();
                        newKh.setId_khach_hang(
                                "KH-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase());
                        newKh.setEmail(email);
                    newKh.setTen_khach_hang(name != null ? name : "Khách hàng Google");
                    String regRandomDigits = String.format("%08d", (int) (Math.random() * 100000000));
                    newKh.setSdt("09" + regRandomDigits);
                    newKh.setDia_chi("");
                        newKh.setDa_xoa(false);
                        newKh.setNgay_tao(java.time.LocalDateTime.now());
                    newKh.setNgay_cap_nhat(java.time.LocalDateTime.now());
                        if (picture != null) {
                            newKh.setHinh_anh(picture);
                        }
                        return khachHangRepository.save(newKh);
                    });
                    displayName = kh.getTen_khach_hang();
                    idNguoiDung = kh.getId_khach_hang();

                    com.rexi.pkty.entity.TaiKhoan newTk = new com.rexi.pkty.entity.TaiKhoan();
                    newTk.setId_tai_khoan("TK-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase());
                    newTk.setTen_dang_nhap(email);
                    String randomPass = "GOOGLE_" + java.util.UUID.randomUUID().toString().substring(0, 8);
                    newTk.setMat_khau("[ENCRYPTED]");
                    newTk.setMat_khau_hash(passwordEncoder.encode(randomPass));
                    newTk.setId_khach_hang(kh.getId_khach_hang());
                    newTk.setId_vai_tro("VT-5"); // Mã chuẩn của Khách hàng trong Database là VT-5
                    newTk.setTrang_thai("active");
                    newTk.setNgay_tao(java.time.LocalDateTime.now());
                    tk = taiKhoanRepository.save(newTk);
                }
            }

            // Lấy tên vai trò thực tế để trả về cho Frontend
            String tenVaiTro = "Khách hàng";
            if ("rexivetsys@gmail.com".equalsIgnoreCase(email)) {
                tenVaiTro = "Quản trị viên";
            } else if (tk.getId_vai_tro() != null) {
                try {
                    tenVaiTro = jdbcTemplate.queryForObject(
                            "SELECT ten_vai_tro FROM VaiTroHeThong WHERE id_vai_tro = ?",
                            String.class, tk.getId_vai_tro());
                } catch (Exception e) {
                    tenVaiTro = nvOpt.isPresent() ? "Nhân viên" : "Khách hàng";
                }
            }

            String token = jwtUtil.generateToken(tk.getTen_dang_nhap(), loaiTaiKhoan);
            String refreshToken = jwtUtil.generateRefreshToken(tk.getTen_dang_nhap());

            Map<String, Object> response = new java.util.HashMap<>();
            response.put("token", token);
            response.put("refreshToken", refreshToken);

            Map<String, Object> userData = new java.util.HashMap<>();
            userData.put("ten_dang_nhap", tk.getTen_dang_nhap());
            userData.put("displayName", displayName);
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
                userData.put("avatar", picture); // Truyền ảnh Google xuống cho Frontend
            response.put("user", userData);

            logger.info("Đăng nhập Google thành công cho: " + email);

            // TÍNH NĂNG MỚI: Gửi mail chào mừng cho tài khoản Google mới/lần đầu
            if (tk.getWelcome_email_sent() == null || !tk.getWelcome_email_sent()) {
                try {
                    // Lấy EmailService thủ công vì không có Autowired trong context này dễ dàng
                    // (hoặc dùng bean)
                    // Ở đây ta có thể dùng @Autowired EmailService ở trên đầu class AuthController
                    // Để an toàn, mình sẽ bổ sung @Autowired EmailService ở đầu class
                    emailService.sendWelcomeEmailHTML(email, (String) userData.get("displayName"));
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
     * Google Register - Tạo tài khoản mới từ thông tin Google
     */
    @PostMapping("/google-register")
    public ResponseEntity<?> googleRegister(@RequestBody Map<String, String> requestData) {
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
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Không thể trích xuất email từ Token Google"));
            }

            // Kiểm tra email đã tồn tại chưa
            Optional<com.rexi.pkty.entity.KhachHang> existingKh = khachHangRepository.findByEmail(email);
            if (existingKh.isPresent()) {
                return ResponseEntity.status(409)
                        .body(Map.of("message", "Email này đã được đăng ký. Hãy liên kết tài khoản thay vì tạo mới."));
            }

            // BẢO MẬT & FIX LỖI 500: Đảm bảo Vai trò tồn tại trong DB để tránh lỗi Foreign Key Constraint
            try {
                jdbcTemplate.update("IF NOT EXISTS (SELECT 1 FROM VaiTroHeThong WHERE id_vai_tro = 'VT-5') INSERT INTO VaiTroHeThong (id_vai_tro, ten_vai_tro, mo_ta) VALUES ('VT-5', N'Khách hàng', N'Khách hàng hệ thống')");
            } catch (Exception ignored) {}

            // Tạo Khách hàng
            com.rexi.pkty.entity.KhachHang kh = new com.rexi.pkty.entity.KhachHang();
            kh.setId_khach_hang("KH-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            kh.setTen_khach_hang(name != null ? name : "Khách hàng Google");
            kh.setEmail(email);
            // Tạo số điện thoại ảo (numeric-only)
            String regRandomDigits = String.format("%08d", (int) (Math.random() * 100000000));
            kh.setSdt("09" + regRandomDigits);
            kh.setDia_chi("");
            if (picture != null) kh.setHinh_anh(picture);
            kh.setDa_xoa(false);
            kh.setNgay_tao(java.time.LocalDateTime.now());
            kh.setNgay_cap_nhat(java.time.LocalDateTime.now());
            kh = khachHangRepository.save(kh);

            // Tạo Tài khoản
            com.rexi.pkty.entity.TaiKhoan tk = new com.rexi.pkty.entity.TaiKhoan();
            tk.setId_tai_khoan("TK-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            tk.setTen_dang_nhap(email);
            String randomPass = "GOOGLE_" + java.util.UUID.randomUUID().toString().substring(0, 8);
            tk.setMat_khau("[ENCRYPTED]");
            tk.setMat_khau_hash(passwordEncoder.encode(randomPass));
            tk.setId_khach_hang(kh.getId_khach_hang());
            tk.setId_vai_tro("VT-5"); // Mã chuẩn của Khách hàng trong Database là VT-5
            tk.setTrang_thai("active");
            tk.setNgay_tao(java.time.LocalDateTime.now());
            tk = taiKhoanRepository.save(tk);

            // Tạo JWT Token
            String token = jwtUtil.generateToken(email, "KHACH_HANG");
            String refreshToken = jwtUtil.generateRefreshToken(email);

            Map<String, Object> userData = new java.util.HashMap<>();
            userData.put("id_khach_hang", kh.getId_khach_hang());
            userData.put("ten_khach_hang", kh.getTen_khach_hang());
            userData.put("email", kh.getEmail());
            userData.put("ten_vai_tro", "Khách hàng");
            userData.put("loai_tai_khoan", "KHACH_HANG");
            userData.put("displayName", kh.getTen_khach_hang());
            if (picture != null)
                userData.put("avatar", picture); // Truyền ảnh Google xuống cho Frontend

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
     * Google Link - Liên kết Google với tài khoản đã có (xác thực bằng mật khẩu)
     */
    @PostMapping("/google-link")
    public ResponseEntity<?> googleLink(@RequestBody Map<String, String> requestData) {
        try {
            String username = requestData.get("username");
            String password = requestData.get("password");
            String googleToken = requestData.get("token");

            Map<String, Object> googleProfile = verifyGoogleToken(googleToken);
            if (googleProfile == null) {
                return ResponseEntity.status(401).body(Map.of("message", "Token Google không hợp lệ hoặc đã hết hạn!"));
            }
            String googleEmail = (String) googleProfile.get("email");
            String picture = (String) googleProfile.get("picture"); // Lấy link ảnh từ Google

            if (username == null || password == null) {
                return ResponseEntity.badRequest().body(Map.of("message", "Thiếu thông tin đăng nhập"));
            }

            Optional<com.rexi.pkty.entity.TaiKhoan> tkOpt = taiKhoanRepository.findByTenDangNhap(username);
            if (tkOpt.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("message", "Không tìm thấy tài khoản!"));
            }

            com.rexi.pkty.entity.TaiKhoan tk = tkOpt.get();

            // BẢO MẬT: Chặn liên kết Google nếu tài khoản gốc đã bị khóa
            String status = tk.getTrang_thai();
            if (status != null && (status.equalsIgnoreCase("Đã khóa") || status.equalsIgnoreCase("inactive"))) {
                return ResponseEntity.status(403)
                        .body(Map.of("message", "Tài khoản này đã bị vô hiệu hóa, không thể liên kết Google."));
            }

            // Xác thực mật khẩu
            if (!passwordEncoder.matches(password, tk.getMat_khau_hash())) {
                return ResponseEntity.status(401)
                        .body(Map.of("message", "Tên đăng nhập hoặc mật khẩu không chính xác."));
            }

            // Cập nhật email và ảnh Google vào khách hàng hoặc nhân viên (nếu có)
            if (tk.getKhach_hang() != null) {
                com.rexi.pkty.entity.KhachHang kh = tk.getKhach_hang();
                boolean updated = false;
                if (googleEmail != null && (kh.getEmail() == null || kh.getEmail().isEmpty())) {
                    kh.setEmail(googleEmail);
                    updated = true;
                }
                if (picture != null && (kh.getHinh_anh() == null || kh.getHinh_anh().isEmpty())) {
                    kh.setHinh_anh(picture);
                    updated = true;
                }
                if (updated) {
                    khachHangRepository.save(kh);
                }
            } else if (tk.getId_nhan_vien() != null && picture != null) {
                com.rexi.pkty.entity.NhanVien nv = nhanVienRepository.findById(tk.getId_nhan_vien()).orElse(null);
                if (nv != null && (nv.getHinh_anh() == null || nv.getHinh_anh().isEmpty())) {
                    nv.setHinh_anh(picture);
                    nhanVienRepository.save(nv);
                }
            }

            // Tạo JWT Token
            String token = jwtUtil.generateToken(username, "khach_hang");
            String refreshToken = jwtUtil.generateRefreshToken(username);

            // Xác định vai trò
            List<Map<String, Object>> loginResult = taiKhoanRepository.callSpDangNhap(username);
            Map<String, Object> userData = new java.util.HashMap<>();
            if (!loginResult.isEmpty()) {
                userData = new java.util.HashMap<>(loginResult.get(0));
            }
            userData.put("ten_dang_nhap", username);
            if (picture != null)
                userData.put("avatar", picture); // Truyền ảnh Google xuống cho Frontend

            logger.info("Google link successful for: " + username + " -> " + googleEmail);
            return ResponseEntity
                    .ok(Map.of("token", token, "refreshToken", refreshToken, "user", userData, "message",
                            "Liên kết Google thành công!"));
        } catch (Exception e) {
            logger.severe("Google link error: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi liên kết tài khoản: " + e.getMessage()));
        }
    }

    /**
     * SỬA LỖI #2: Đăng ký - Mã hóa mật khẩu trước khi lưu
     * SỬA LỖI #7: Kiểm tra dữ liệu đầu vào (Validation)
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request, BindingResult bindingResult,
            jakarta.servlet.http.HttpServletRequest httpRequest) {
        // BẢO MẬT: Chống Spam tạo tài khoản liên tục (Giới hạn 1 phút / 1 IP)
        String clientIp = httpRequest.getRemoteAddr();
        Long lastTime = lastRegisterTime.get(clientIp);
        if (lastTime != null && System.currentTimeMillis() - lastTime < 60000) {
            logger.warning("Spam registration blocked for IP: " + clientIp);
            return ResponseEntity.status(429).body(Map.of("message",
                    "Cảnh báo chống Spam: Bạn đang tạo tài khoản quá nhanh. Vui lòng đợi 1 phút rồi thử lại!"));
        }

        if (bindingResult.hasErrors()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Dữ liệu không hợp lệ"));
        }

        try {
            // BẢO MẬT: Kiểm tra trước (Early-check trùng lặp trước khi gọi Stored
            // Procedure)
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

            // BẢO MẬT & FIX LỖI: Bỏ qua Stored Procedure cũ vì nó cắt xén mất chuỗi Hash 60 ký tự
            try {
                jdbcTemplate.update("IF NOT EXISTS (SELECT 1 FROM VaiTroHeThong WHERE id_vai_tro = 'VT-5') INSERT INTO VaiTroHeThong (id_vai_tro, ten_vai_tro, mo_ta) VALUES ('VT-5', N'Khách hàng', N'Khách hàng hệ thống')");
            } catch (Exception ignored) {}

            com.rexi.pkty.entity.KhachHang kh = new com.rexi.pkty.entity.KhachHang();
            kh.setId_khach_hang("KH-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            kh.setTen_khach_hang(request.getTen_khach_hang());
            kh.setEmail(request.getEmail());
            kh.setSdt(request.getSdt());
            kh.setDia_chi(request.getDia_chi());
            kh.setDa_xoa(false);
            kh.setNgay_tao(java.time.LocalDateTime.now());
            kh.setNgay_cap_nhat(java.time.LocalDateTime.now());
            khachHangRepository.save(kh);

            com.rexi.pkty.entity.TaiKhoan tk = new com.rexi.pkty.entity.TaiKhoan();
            tk.setId_tai_khoan("TK-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            tk.setTen_dang_nhap(request.getTen_dang_nhap());
            tk.setMat_khau("[ENCRYPTED]");
            tk.setMat_khau_hash(passwordEncoder.encode(request.getMat_khau()));
            tk.setId_khach_hang(kh.getId_khach_hang());
            tk.setId_vai_tro("VT-5"); 
            tk.setTrang_thai("active");
            tk.setNgay_tao(java.time.LocalDateTime.now());
            taiKhoanRepository.save(tk);

            logger.info("Đăng ký thành công cho tài khoản: " + request.getTen_dang_nhap());
            lastRegisterTime.put(clientIp, System.currentTimeMillis());
            return ResponseEntity.ok(Map.of("message", "Đăng ký thành công!", "username", request.getTen_dang_nhap()));
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            String msg = e.getMostSpecificCause().getMessage();
            logger.warning("Registration data conflict: " + msg);

            if (msg.contains("UQ_KhachHang_Email") || msg.contains("Email")) {
                return ResponseEntity.status(409)
                        .body(Map.of("message", "Email này đã được sử dụng. Vui lòng dùng email khác."));
            } else if (msg.contains("ten_dang_nhap") || msg.contains("PRIMARY KEY")) {
                return ResponseEntity.status(409).body(Map.of("message", "Tên đăng nhập đã tồn tại."));
            } else if (msg.contains("UQ_KhachHang_SDT") || msg.contains("sdt")) {
                return ResponseEntity.status(409).body(Map.of("message", "Số điện thoại đã được đăng ký."));
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
     * SỬA LỖI: API Tạo nhanh khách hàng cho Nhân viên/Admin (Tốc độ cao)
     */
    @PostMapping("/register-simple")
    public ResponseEntity<?> registerSimple(@RequestBody Map<String, String> request) {
        // BẢO MẬT LỚP 1: Chặn khách ngoài gọi API tạo nhanh nội bộ
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        if (auth == null || auth.getName().equals("anonymousUser")) {
            return ResponseEntity.status(401)
                    .body(Map.of("message", "Cảnh báo bảo mật: Yêu cầu không có Token xác thực hợp lệ!"));
        }
        String role = auth.getAuthorities().toString().toUpperCase();
        if (!role.contains("ADMIN") && !role.contains("QUAN_LY") && !role.contains("STAFF")
                && !role.contains("BAC_SI")) {
            return ResponseEntity.status(403).body(
                    Map.of("message", "Cảnh báo bảo mật: Chỉ nhân viên phòng khám mới được dùng tính năng tạo nhanh!"));
        }

        try {
            // BẢO MẬT: Kiểm tra nhanh trước khi tạo
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

            // Tạo Khách Hàng
            com.rexi.pkty.entity.KhachHang kh = new com.rexi.pkty.entity.KhachHang();
            kh.setTen_khach_hang(request.get("ten_khach_hang"));
            kh.setSdt(request.get("sdt"));
            // email đã được khai báo ở trên (dòng 478), reuse luôn
            if (email == null || email.trim().isEmpty()) {
                email = request.get("sdt") + "@rexi.vn";
            }
            kh.setEmail(email);
            kh.setDia_chi("");
            kh.setDa_xoa(false);
            kh.setNgay_tao(java.time.LocalDateTime.now());
            kh.setNgay_cap_nhat(java.time.LocalDateTime.now());
            kh = khachHangRepository.save(kh);

            // Tạo Tài Khoản (Lấy SĐT làm username, pass: rexi@123)
            com.rexi.pkty.entity.TaiKhoan tk = new com.rexi.pkty.entity.TaiKhoan();
            tk.setTen_dang_nhap(request.get("sdt"));
            tk.setMat_khau("[ENCRYPTED]");
            tk.setMat_khau_hash(passwordEncoder.encode("rexi@123"));
            tk.setId_khach_hang(kh.getId_khach_hang());
            tk.setId_vai_tro("VT-5"); // Mã chuẩn của Khách hàng trong Database là VT-5
            tk.setTrang_thai("active");
            tk.setNgay_tao(java.time.LocalDateTime.now());
            taiKhoanRepository.save(tk);

            Map<String, Object> user = new java.util.HashMap<>();
            user.put("id_khach_hang", kh.getId_khach_hang());

            return ResponseEntity.ok(Map.of("user", user, "message", "Tạo nhanh thành công!"));
        } catch (org.springframework.dao.DataIntegrityViolationException e) {
            String msg = e.getMostSpecificCause().getMessage();
            logger.warning("Register simple data conflict: " + msg);

            if (msg.contains("UQ_KhachHang_Email") || msg.contains("Email")) {
                return ResponseEntity.status(409)
                        .body(Map.of("message", "Email này đã được sử dụng. Vui lòng dùng email khác."));
            } else if (msg.contains("UQ_KhachHang_SDT") || msg.contains("sdt")) {
                return ResponseEntity.status(409).body(Map.of("message", "Số điện thoại đã được đăng ký."));
            }

            return ResponseEntity.status(400)
                    .body(Map.of("message", "Thông tin đăng ký bị trùng lặp hoặc không hợp lệ."));
        } catch (Exception e) {
            logger.severe("Register simple error: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi hệ thống khi tạo khách hàng nhanh."));
        }
    }

    /**
     * SỬA LỖI #2: Đổi mật khẩu - Sử dụng mã hóa BCrypt
     */
    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> request) {
        // BẢO MẬT: Lấy username từ JWT Token thay vì tin vào request body
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        String username = (auth != null) ? auth.getName() : null;

        if (username == null || username.equals("anonymousUser")) {
            return ResponseEntity.status(401)
                    .body(Map.of("message", "Cảnh báo bảo mật: Yêu cầu không có Token xác thực hợp lệ!"));
        }

        String currentPass = request.get("currentPass");
        String newPass = request.get("newPass");

        Optional<com.rexi.pkty.entity.TaiKhoan> tkOpt = taiKhoanRepository.findByTenDangNhap(username);
        if (tkOpt.isPresent()) {
            com.rexi.pkty.entity.TaiKhoan tk = tkOpt.get();

            // BẢO MẬT: Hỗ trợ kiểm tra cả mật khẩu cũ (Plaintext) và mật khẩu mới (BCrypt)
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
     * Quên mật khẩu - Bước 1: Xác minh tài khoản
     */
    @PostMapping("/forgot-password-verify")
    public ResponseEntity<?> verifyAccount(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String email = request.get("email");
        String phone = request.get("phone");

        Optional<com.rexi.pkty.entity.TaiKhoan> tkOpt = taiKhoanRepository.findByTenDangNhap(username);

        if (tkOpt.isPresent()) {
            com.rexi.pkty.entity.TaiKhoan tk = tkOpt.get();
            if (tk.getKhach_hang() != null) {
                String dbEmail = tk.getKhach_hang().getEmail();
                String dbPhone = tk.getKhach_hang().getSdt();

                boolean emailMatch = email != null && !email.isEmpty() && email.equalsIgnoreCase(dbEmail);
                boolean phoneMatch = phone != null && !phone.isEmpty() && phone.equals(dbPhone);

                if (emailMatch || phoneMatch) {
                    logger.info("Xác minh tài khoản thành công bằng SĐT hoặc Email: " + username);
                    return ResponseEntity.ok(Map.of("message", "Xác minh thành công!", "username", username));
                }
            }
        }

        logger.warning("Xác minh tài khoản thất bại để đặt lại mật khẩu: " + username);
        return ResponseEntity.status(404).body(Map.of("message", "Thông tin tài khoản không chính xác!"));
    }

    /**
     * Quên mật khẩu - Bước 2: Đặt lại mật khẩu mới
     */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String providedEmail = request.get("email");
        String providedPhone = request.get("phone");
        String newPass = request.get("newPass");
        String method = request.get("method");

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
            }
        }

        if (tk == null) {
            return ResponseEntity.status(404)
                    .body(Map.of("message", "Không tìm thấy tài khoản tương ứng với thông tin này!"));
        }

        if ("quick".equals(method)) {
            String dbEmail = tk.getKhach_hang() != null ? tk.getKhach_hang().getEmail() : null;
            String dbPhone = tk.getKhach_hang() != null ? tk.getKhach_hang().getSdt() : null;

            boolean emailMatch = providedEmail != null && !providedEmail.isEmpty() && providedEmail.equalsIgnoreCase(dbEmail);
            boolean phoneMatch = providedPhone != null && !providedPhone.isEmpty() && providedPhone.equals(dbPhone);

            if (!emailMatch && !phoneMatch) {
                return ResponseEntity.status(403)
                        .body(Map.of("message", "Thông tin Số điện thoại hoặc Email không khớp với hệ thống!"));
            }
        } else {
            boolean isEmailVerified = providedEmail != null
                    && SystemController.verifiedEmails.containsKey(providedEmail);
            if (!isEmailVerified) {
                logger.warning("Cảnh báo: Đặt lại mật khẩu bỏ qua OTP cho email: " + providedEmail);
                return ResponseEntity.status(403)
                        .body(Map.of("message", "Yêu cầu xác minh OTP trước khi đặt lại mật khẩu!"));
            }
            SystemController.verifiedEmails.remove(providedEmail);
        }

        String newHashedPassword = passwordEncoder.encode(newPass);
        taiKhoanRepository.changePassword(tk.getTen_dang_nhap(), newHashedPassword);
        logger.info("Đặt lại mật khẩu thành công cho: " + username);
        return ResponseEntity.ok(Map.of("message", "Đặt lại mật khẩu thành công! Hãy đăng nhập lại."));
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
     * API Làm mới Token (Dùng khi Access Token hết hạn)
     */
    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshToken(@RequestBody Map<String, String> request) {
        String refreshToken = request.get("refreshToken");
        if (refreshToken == null || refreshToken.isEmpty()) {
            return ResponseEntity.status(400).body(Map.of("message", "Thiếu Refresh Token"));
        }
        try {
            String username = jwtUtil.extractUsername(refreshToken);
            if (jwtUtil.validateToken(refreshToken, username)) {
                com.rexi.pkty.entity.TaiKhoan tk = taiKhoanRepository.findByTenDangNhap(username).orElse(null);
                if (tk != null && !tk.getTrang_thai().equalsIgnoreCase("Đã khóa")
                        && !tk.getTrang_thai().equalsIgnoreCase("inactive")) {
                    List<String> roles = jdbcTemplate.queryForList(
                            "SELECT ten_vai_tro FROM VaiTroHeThong WHERE id_vai_tro = ?", String.class,
                            tk.getId_vai_tro());
                    String roleName = roles.isEmpty() ? "KHACH_HANG" : roles.get(0).toLowerCase();

                    String loaiTaiKhoan = "KHACH_HANG";
                    if (roleName.contains("admin") || roleName.contains("quản lý"))
                        loaiTaiKhoan = "ADMIN";
                    else if (roleName.contains("bác sĩ") || roleName.contains("doctor"))
                        loaiTaiKhoan = "BAC_SI";
                    else if (roleName.contains("tiếp tân") || roleName.contains("y tá")
                            || roleName.contains("nhân viên") || roleName.contains("kế toán"))
                        loaiTaiKhoan = "STAFF";

                    String newToken = jwtUtil.generateToken(username, loaiTaiKhoan);
                    return ResponseEntity.ok(Map.of("token", newToken));
                } else {
                    return ResponseEntity.status(403).body(Map.of("message", "Tài khoản đã bị khóa!"));
                }
            }
        } catch (Exception e) {
            logger.warning("Lỗi làm mới Token: " + e.getMessage());
        }
        return ResponseEntity.status(401).body(Map.of("message", "Refresh Token không hợp lệ hoặc đã hết hạn"));
    }

}
