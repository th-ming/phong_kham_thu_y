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
    private JwtUtil jwtUtil;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Autowired
    private com.rexi.pkty.service.AuditLogService auditLogService;

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

        try {
            List<Map<String, Object>> result = taiKhoanRepository.callSpDangNhap(username);

            if (result.isEmpty()) {
                handleFailedAttempt(lockoutKey);
                auditLogService.logActionWithUsername(username, "CẢNH BÁO", "TaiKhoan",
                        "Đăng nhập thất bại (Sai tài khoản)");
                return ResponseEntity.status(401).body(Map.of("message", "Sai tài khoản hoặc mật khẩu!"));
            }

            Map<String, Object> user = new java.util.HashMap<>(result.get(0));

            Optional<com.rexi.pkty.entity.TaiKhoan> tkOpt = taiKhoanRepository
                    .findByTenDangNhap((String) user.get("ten_dang_nhap"));
            if (tkOpt.isPresent()) {
                com.rexi.pkty.entity.TaiKhoan tk = tkOpt.get();

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
                    // Kiểm tra xem chuỗi có phải là Hash BCrypt không ($2a$, $2b$, $2y$)
                    if (storedHash.startsWith("$2a$") || storedHash.startsWith("$2b$")
                            || storedHash.startsWith("$2y$")) {
                        isMatch = passwordEncoder.matches(request.getPassword(), storedHash);
                    } else {
                        // Hỗ trợ đăng nhập bằng mật khẩu chưa mã hóa (Legacy Data)
                        isMatch = storedHash.equals(request.getPassword());
                        if (isMatch) {
                            // Tự động migrate sang mã hóa BCrypt
                            tk.setMat_khau_hash(passwordEncoder.encode(request.getPassword()));
                            taiKhoanRepository.save(tk);
                            logger.info("Đã tự động chuyển đổi mật khẩu cũ sang mã hóa BCrypt cho: " + request.getUsername());
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
            }

            // Đăng nhập thành công -> Xóa bộ đếm
            loginAttempts.remove(lockoutKey);
            lockoutTime.remove(lockoutKey);

            // Xác định loại tài khoản
            String vaiTro = (String) user.get("ten_vai_tro");
            if (vaiTro != null) {
                String vt = vaiTro.toLowerCase().trim();
                if (vt.contains("admin") || vt.contains("quản lý")) {
                    user.put("loai_tai_khoan", "ADMIN");
                } else if (vt.contains("bác sĩ") || vt.contains("doctor")) {
                    user.put("loai_tai_khoan", "BAC_SI");
                } else if (vt.contains("tiếp tân") || vt.contains("y tá") || vt.contains("nhân viên")
                        || vt.contains("kế toán") || vt.contains("ketoan")) {
                    user.put("loai_tai_khoan", "STAFF");
                } else {
                    user.put("loai_tai_khoan", "KHACH_HANG");
                }
            } else {
                user.put("loai_tai_khoan", "KHACH_HANG");
            }

            // Đồng bộ tên hiển thị
            if (user.get("ten_khach_hang") != null) {
                user.put("displayName", user.get("ten_khach_hang"));
            } else if (user.get("ho_ten") != null) {
                user.put("displayName", user.get("ho_ten"));
            } else {
                user.put("displayName", user.get("ten_dang_nhap"));
            }

            // Đảm bảo có id_khach_hang
            if (!user.containsKey("id_khach_hang") || user.get("id_khach_hang") == null) {
                tkOpt.ifPresent(tk -> {
                    if (tk.getId_khach_hang() != null) {
                        user.put("id_khach_hang", tk.getId_khach_hang());
                    }
                });
            }

            // SỬA LỖI #5: Tạo Token JWT với thời gian hết hạn cụ thể
            String token = jwtUtil.generateToken((String) user.get("ten_dang_nhap"),
                    (String) user.get("loai_tai_khoan"));
            String refreshToken = jwtUtil.generateRefreshToken((String) user.get("ten_dang_nhap"));

            logger.info("Đăng nhập thành công cho: " + request.getUsername());
            auditLogService.logActionWithUsername(username, "ĐĂNG NHẬP", "TaiKhoan",
                    "Đăng nhập thành công vào hệ thống");
            return ResponseEntity.ok(Map.of(
                    "token", token,
                    "refreshToken", refreshToken,
                    "user", user,
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

            // Tìm hoặc tạo khách hàng theo email
            com.rexi.pkty.entity.KhachHang kh = khachHangRepository.findByEmail(email)
                    .orElseGet(() -> {
                        com.rexi.pkty.entity.KhachHang newKh = new com.rexi.pkty.entity.KhachHang();
                        newKh.setEmail(email);
                        newKh.setTen_khach_hang(name);
                        newKh.setSdt("");
                        newKh.setDia_chi("");
                        newKh.setDa_xoa(false);
                        newKh.setNgay_tao(java.time.LocalDateTime.now());
                        newKh.setNgay_cap_nhat(java.time.LocalDateTime.now());
                        return khachHangRepository.save(newKh);
                    });

            // Tìm hoặc tạo tài khoản
            com.rexi.pkty.entity.TaiKhoan tk = taiKhoanRepository.findByIdKhachHang(kh.getId_khach_hang())
                    .orElseGet(() -> {
                        com.rexi.pkty.entity.TaiKhoan newTk = new com.rexi.pkty.entity.TaiKhoan();
                        newTk.setTen_dang_nhap(email);
                        String randomPass = "GOOGLE_LOGIN_" + java.util.UUID.randomUUID().toString().substring(0, 8);
                        // SỬA LỖI #2: Mã hóa mật khẩu an toàn với BCrypt
                        newTk.setMat_khau(randomPass);
                        newTk.setMat_khau_hash(passwordEncoder.encode(randomPass));
                        newTk.setId_khach_hang(kh.getId_khach_hang());
                        newTk.setId_vai_tro("5");
                        newTk.setTrang_thai("active");
                        newTk.setNgay_tao(java.time.LocalDateTime.now());
                        return taiKhoanRepository.save(newTk);
                    });

            String token = jwtUtil.generateToken(tk.getTen_dang_nhap(), "KHACH_HANG");
            String refreshToken = jwtUtil.generateRefreshToken(tk.getTen_dang_nhap());
            Map<String, Object> response = new java.util.HashMap<>();
            response.put("token", token);
            response.put("refreshToken", refreshToken);

            Map<String, Object> userData = new java.util.HashMap<>();
            userData.put("ten_dang_nhap", tk.getTen_dang_nhap());
            userData.put("ten_khach_hang", kh.getTen_khach_hang());
            userData.put("ten_vai_tro", "Khách hàng");
            userData.put("loai_tai_khoan", "KHACH_HANG");
            userData.put("displayName", kh.getTen_khach_hang());
            userData.put("email", kh.getEmail());
            userData.put("id_khach_hang", kh.getId_khach_hang());
            response.put("user", userData);

            logger.info("Đăng nhập Google thành công cho: " + email);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.severe("Google login error: " + e.getMessage());
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi đăng nhập Google. Vui lòng thử lại sau."));
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

            // Tạo Khách hàng
            com.rexi.pkty.entity.KhachHang kh = new com.rexi.pkty.entity.KhachHang();
            kh.setTen_khach_hang(name != null ? name : "Khách hàng Google");
            kh.setEmail(email);
            kh.setSdt("");
            kh.setDia_chi("");
            kh.setDa_xoa(false);
            kh.setNgay_tao(java.time.LocalDateTime.now());
            kh.setNgay_cap_nhat(java.time.LocalDateTime.now());
            kh = khachHangRepository.save(kh);

            // Tạo Tài khoản
            com.rexi.pkty.entity.TaiKhoan tk = new com.rexi.pkty.entity.TaiKhoan();
            tk.setTen_dang_nhap(email);
            String randomPass = "GOOGLE_" + java.util.UUID.randomUUID().toString().substring(0, 8);
            tk.setMat_khau(randomPass);
            tk.setMat_khau_hash(passwordEncoder.encode(randomPass));
            tk.setId_khach_hang(kh.getId_khach_hang());
            tk.setId_vai_tro("5");
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

            // Cập nhật email Google vào khách hàng (nếu có)
            if (tk.getKhach_hang() != null && googleEmail != null) {
                com.rexi.pkty.entity.KhachHang kh = tk.getKhach_hang();
                if (kh.getEmail() == null || kh.getEmail().isEmpty()) {
                    kh.setEmail(googleEmail);
                    khachHangRepository.save(kh);
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
            // BẢO MẬT: Kiểm tra trước (Early-check trùng lặp trước khi gọi Stored Procedure)
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

            // SỬA LỖI #2: Thực hiện mã hóa mật khẩu trước khi lưu
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
                // Cập nhật thời gian tạo tài khoản cuối cùng của IP này
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
        if (!role.contains("ADMIN") && !role.contains("QUANLY") && !role.contains("STAFF")
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
            tk.setMat_khau("rexi@123");
            tk.setMat_khau_hash(passwordEncoder.encode("rexi@123"));
            tk.setId_khach_hang(kh.getId_khach_hang());
            tk.setId_vai_tro("5"); // Vai trò Khách hàng (Sửa từ 1 sang "5" để khớp DB)
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
        String contactInfo = (email != null && !email.isEmpty()) ? email : phone;

        Optional<com.rexi.pkty.entity.TaiKhoan> tkOpt = taiKhoanRepository.findByTenDangNhap(username);

        if (tkOpt.isPresent()) {
            com.rexi.pkty.entity.TaiKhoan tk = tkOpt.get();
            // Kiểm tra Email hoặc SĐT của khách hàng liên kết với tài khoản
            if (tk.getKhach_hang() != null && contactInfo != null) {
                boolean matchEmail = contactInfo.equalsIgnoreCase(tk.getKhach_hang().getEmail());
                boolean matchPhone = contactInfo.equals(tk.getKhach_hang().getSdt());
                if (matchEmail || matchPhone) {
                    logger.info("Xác minh tài khoản thành công để đặt lại mật khẩu: " + username);
                    return ResponseEntity.ok(Map.of("message", "Xác minh thành công!", "username", username));
                }
            }
        }

        logger.warning("Xác minh tài khoản thất bại để đặt lại mật khẩu: " + username);
        return ResponseEntity.status(404).body(Map.of("message", "Thông tin tài khoản hoặc email không chính xác!"));
    }

    /**
     * Quên mật khẩu - Bước 2: Đặt lại mật khẩu mới
     */
    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> request) {
        String username = request.get("username");
        String newPass = request.get("newPass");

        Optional<com.rexi.pkty.entity.TaiKhoan> tkOpt = taiKhoanRepository.findByTenDangNhap(username);
        if (tkOpt.isPresent()) {
            com.rexi.pkty.entity.TaiKhoan tk = tkOpt.get();

            // BẢO MẬT: Kiểm tra tài khoản đã xác minh OTP thành công chưa
            String email = (tk.getKhach_hang() != null) ? tk.getKhach_hang().getEmail() : null;
            String phone = (tk.getKhach_hang() != null) ? tk.getKhach_hang().getSdt() : null;

            boolean isEmailVerified = email != null && SystemController.verifiedEmails.contains(email);
            boolean isPhoneVerified = phone != null && SystemController.verifiedEmails.contains(phone);

            if (!isEmailVerified && !isPhoneVerified) {
                logger.warning("Cảnh báo: Đặt lại mật khẩu bỏ qua OTP cho: " + username);
                return ResponseEntity.status(403)
                        .body(Map.of("message", "Yêu cầu xác minh OTP trước khi đặt lại mật khẩu!"));
            }

            String newHashedPassword = passwordEncoder.encode(newPass);
            taiKhoanRepository.changePassword(username, newHashedPassword);
            if (isEmailVerified)
                SystemController.verifiedEmails.remove(email); // Xóa sau khi dùng
            if (isPhoneVerified)
                SystemController.verifiedEmails.remove(phone);
            logger.info("Đặt lại mật khẩu thành công cho: " + username);
            return ResponseEntity.ok(Map.of("message", "Đặt lại mật khẩu thành công! Hãy đăng nhập lại."));
        }
        return ResponseEntity.status(404).body(Map.of("message", "Không tìm thấy tài khoản!"));
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

