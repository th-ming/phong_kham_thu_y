package com.rexi.pkty.controller;

import com.rexi.pkty.entity.HoaDon;
import com.rexi.pkty.repository.HoaDonRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "${cors.allowed-origins:http://localhost:3000}")
public class FinanceController {

    @Autowired
    private HoaDonRepository hoaDonRepository;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Autowired
    private com.rexi.pkty.repository.TaiKhoanRepository taiKhoanRepository;

    @Autowired
    private com.rexi.pkty.service.AuditLogService auditLogService;

    // Báº¢O Máº¬T: HÃ m kiá»ƒm tra quyá»n truy cáº­p dá»¯ liá»‡u TÃ i chÃ­nh
    private boolean hasFinancePermission() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        if (auth == null || auth.getName().equals("anonymousUser"))
            return false;

        com.rexi.pkty.entity.TaiKhoan tk = taiKhoanRepository.findByTenDangNhap(auth.getName()).orElse(null);
        if (tk == null || tk.getId_vai_tro() == null)
            return false;

        String roleQuery = "SELECT ten_vai_tro FROM VaiTroHeThong WHERE id_vai_tro = ?";
        List<String> roles = jdbcTemplate.queryForList(roleQuery, String.class, tk.getId_vai_tro());
        if (roles.isEmpty())
            return false;

        String roleName = roles.get(0).toLowerCase();
        return roleName.contains("admin") || roleName.contains("quáº£n lÃ½") || roleName.contains("káº¿ toÃ¡n");
    }

    // Láº­p hÃ³a Ä‘Æ¡n má»›i (DÃ¹ng SP)
    @PostMapping("/hoa-don")
    public ResponseEntity<?> addInvoice(@RequestBody HoaDon hd) {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        String role = (auth != null) ? auth.getAuthorities().toString().toUpperCase() : "";

        // Báº¢O Máº¬T: Cháº·n khÃ¡ch hÃ ng tá»± láº­p hÃ³a Ä‘Æ¡n áº£o
        if (!role.contains("ADMIN") && !role.contains("QUANLY") && !role.contains("KETOAN")
                && !role.contains("STAFF")) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Cáº£nh bÃ¡o báº£o máº­t: Báº¡n khÃ´ng cÃ³ quyá»n láº­p hÃ³a Ä‘Æ¡n!"));
        }
        try {
            List<Map<String, Object>> result = hoaDonRepository.callSpLapHoaDon(
                    hd.getId_lich_hen(),
                    hd.getThue_suat(),
                    hd.getTong_giam_gia(),
                    hd.getId_nhan_vien(),
                    hd.getGhi_chu());
            return ResponseEntity.ok(result.get(0));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", "Lá»—i láº­p hÃ³a Ä‘Æ¡n: " + e.getMessage()));
        }
    }

    // Láº¥y danh sÃ¡ch thuá»‘c sáº¯p háº¿t háº¡n (tá»« View)
    @GetMapping("/kho/thuoc-sap-het-han")
    public ResponseEntity<?> getThuocSapHetHan() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        String role = (auth != null) ? auth.getAuthorities().toString().toUpperCase() : "";
        // Báº¢O Máº¬T: Cháº·n khÃ¡ch hÃ ng xem thÃ´ng tin cáº£nh bÃ¡o kho thuá»‘c
        if (!role.contains("ADMIN") && !role.contains("QUANLY") && !role.contains("KETOAN") && !role.contains("STAFF")
                && !role.contains("BAC_SI")) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Cáº£nh bÃ¡o báº£o máº­t: Báº¡n khÃ´ng cÃ³ quyá»n xem thÃ´ng tin kho thuá»‘c!"));
        }

        try {
            return ResponseEntity.ok(hoaDonRepository.getThuocSapHetHan());
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("message", "Lá»—i truy xuáº¥t danh sÃ¡ch thuá»‘c sáº¯p háº¿t háº¡n: " + e.getMessage()));
        }
    }

    // Láº¥y danh sÃ¡ch hÃ³a Ä‘Æ¡n theo ID khÃ¡ch hÃ ng
    @GetMapping("/hoa-don/khach/{id}")
    public ResponseEntity<?> getInvoicesByCustomerId(@PathVariable String id) {
        try {
            // Báº¢O Máº¬T: Kiá»ƒm tra IDOR - NgÄƒn khÃ¡ch hÃ ng xem hÃ³a Ä‘Æ¡n cá»§a ngÆ°á»i khÃ¡c
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                    .getContext().getAuthentication();
            String username = (auth != null) ? auth.getName() : null;
            if (username == null || username.equals("anonymousUser")) {
                return ResponseEntity.status(401)
                        .body(Map.of("message", "Cáº£nh bÃ¡o báº£o máº­t: YÃªu cáº§u khÃ´ng cÃ³ Token xÃ¡c thá»±c há»£p lá»‡!"));
            }
            com.rexi.pkty.entity.TaiKhoan tk = taiKhoanRepository.findByTenDangNhap(username).orElse(null);
            if (tk != null && tk.getId_vai_tro() != null && tk.getId_vai_tro().equals("5")) { // LÃ  khÃ¡ch hÃ ng
                if (!tk.getId_khach_hang().equals(id)) {
                    return ResponseEntity.status(403).body(
                            Map.of("message", "Cáº£nh bÃ¡o báº£o máº­t: Báº¡n khÃ´ng cÃ³ quyá»n xem hÃ³a Ä‘Æ¡n cá»§a ngÆ°á»i khÃ¡c!"));
                }
            }

            return ResponseEntity.ok(hoaDonRepository.findByCustomerId(id));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lá»—i truy xuáº¥t hÃ³a Ä‘Æ¡n: " + e.getMessage()));
        }
    }

    // Láº¥y táº¥t cáº£ hÃ³a Ä‘Æ¡n (cho Admin)
    @GetMapping("/hoa-don")
    public ResponseEntity<?> getAllInvoices() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        String role = (auth != null) ? auth.getAuthorities().toString().toUpperCase() : "";

        // Báº¢O Máº¬T: Cháº·n khÃ¡ch hÃ ng xem toÃ n bá»™ danh sÃ¡ch hÃ³a Ä‘Æ¡n lÃ m lá»™ doanh thu vÃ 
        // thÃ´ng tin ngÆ°á»i khÃ¡c
        if (!role.contains("ADMIN") && !role.contains("QUANLY") && !role.contains("KETOAN")
                && !role.contains("STAFF")) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Cáº£nh bÃ¡o báº£o máº­t: Báº¡n khÃ´ng cÃ³ quyá»n xem toÃ n bá»™ danh sÃ¡ch hÃ³a Ä‘Æ¡n!"));
        }
        try {
            return ResponseEntity.ok(hoaDonRepository.getAllHoaDon());
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("message", "Lá»—i truy xuáº¥t danh sÃ¡ch hÃ³a Ä‘Æ¡n: " + e.getMessage()));
        }
    }

    // Láº¥y chi tiáº¿t hÃ³a Ä‘Æ¡n (Gá»™p cáº£ Tiá»n KhÃ¡m vÃ  Tiá»n Thuá»‘c)
    @GetMapping("/hoa-don/{id}/chi-tiet")
    public ResponseEntity<?> getInvoiceDetails(@PathVariable String id) {
        try {
            // Báº¢O Máº¬T: Kiá»ƒm tra IDOR - NgÄƒn khÃ¡ch hÃ ng xem chi tiáº¿t hÃ³a Ä‘Æ¡n cá»§a ngÆ°á»i khÃ¡c
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                    .getContext().getAuthentication();
            String username = (auth != null) ? auth.getName() : null;

            if (username != null && !username.equals("anonymousUser")) {
                com.rexi.pkty.entity.TaiKhoan tk = taiKhoanRepository.findByTenDangNhap(username).orElse(null);
                if (tk != null && tk.getId_vai_tro() != null && tk.getId_vai_tro().equals("5")) { // LÃ  KhÃ¡ch hÃ ng
                    String sqlCheckOwner = "SELECT id_khach_hang FROM HoaDon WHERE id_hoa_don = ?";
                    List<String> ownerIds = jdbcTemplate.queryForList(sqlCheckOwner, String.class, id);
                    if (!ownerIds.isEmpty() && !ownerIds.get(0).equals(tk.getId_khach_hang())) {
                        return ResponseEntity.status(403)
                                .body(Map.of("message", "Cáº£nh bÃ¡o báº£o máº­t: Báº¡n khÃ´ng cÃ³ quyá»n xem hÃ³a Ä‘Æ¡n nÃ y!"));
                    }
                }
            }

            // Láº¥y chi tiáº¿t dá»‹ch vá»¥ khÃ¡m
            String sqlDv = "SELECT dv.ten_dich_vu as ten_muc, 1 as so_luong, dv.gia as don_gia, dv.gia as thanh_tien " +
                    "FROM HoaDon hd " +
                    "JOIN LichHen lh ON hd.id_lich_hen = lh.id_lich_hen " +
                    "JOIN DichVu dv ON lh.id_dich_vu = dv.id_dich_vu " +
                    "WHERE hd.id_hoa_don = ?";
            List<Map<String, Object>> dichVu = jdbcTemplate.queryForList(sqlDv, id);

            // Láº¥y chi tiáº¿t tá»«ng mÃ³n thuá»‘c
            String sqlThuoc = "SELECT t.ten_thuoc as ten_muc, dtct.so_luong, t.gia_ban as don_gia, (dtct.so_luong * t.gia_ban) as thanh_tien "
                    +
                    "FROM HoaDon hd " +
                    "JOIN HoSoBenhAn hs ON hd.id_lich_hen = hs.id_lich_hen " +
                    "JOIN DonThuoc dt ON hs.id_ho_so_benh_an = dt.id_benh_an " +
                    "JOIN DonThuocChiTiet dtct ON dt.id_don_thuoc = dtct.id_don_thuoc " +
                    "JOIN Thuoc t ON dtct.id_thuoc = t.id_thuoc " +
                    "WHERE hd.id_hoa_don = ?";
            List<Map<String, Object>> thuoc = jdbcTemplate.queryForList(sqlThuoc, id);

            // Gá»™p cáº£ 2 danh sÃ¡ch láº¡i tráº£ vá» cho Káº¿ toÃ¡n
            List<Map<String, Object>> chiTiet = new java.util.ArrayList<>();
            chiTiet.addAll(dichVu);
            chiTiet.addAll(thuoc);

            return ResponseEntity.ok(chiTiet);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lá»—i láº¥y chi tiáº¿t hÃ³a Ä‘Æ¡n: " + e.getMessage()));
        }
    }

    // Láº¥y táº¥t cáº£ thuá»‘c
    @GetMapping("/kho/thuoc")
    public ResponseEntity<?> getAllThuoc() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        String role = (auth != null) ? auth.getAuthorities().toString().toUpperCase() : "";
        // Báº¢O Máº¬T: Cháº·n khÃ¡ch hÃ ng láº¥y danh sÃ¡ch toÃ n bá»™ máº·t hÃ ng thuá»‘c
        if (!role.contains("ADMIN") && !role.contains("QUANLY") && !role.contains("KETOAN") && !role.contains("STAFF")
                && !role.contains("BAC_SI")) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Cáº£nh bÃ¡o báº£o máº­t: Báº¡n khÃ´ng cÃ³ quyá»n truy cáº­p kho thuá»‘c!"));
        }

        try {
            return ResponseEntity.ok(hoaDonRepository.getAllThuoc());
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("message", "Lá»—i truy xuáº¥t danh sÃ¡ch thuá»‘c: " + e.getMessage()));
        }
    }

    // Láº¥y táº¥t cáº£ lÃ´ thuá»‘c
    @GetMapping("/kho/lo-thuoc")
    public ResponseEntity<?> getAllLoThuoc() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        String role = (auth != null) ? auth.getAuthorities().toString().toUpperCase() : "";
        // Báº¢O Máº¬T: Cháº·n lá»™ giÃ¡ nháº­p (gia_nhap) vÃ  sá»‘ lÆ°á»£ng tá»“n kho cho ngÆ°á»i ngoÃ i
        if (!role.contains("ADMIN") && !role.contains("QUANLY") && !role.contains("KETOAN") && !role.contains("STAFF")
                && !role.contains("BAC_SI")) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Cáº£nh bÃ¡o báº£o máº­t: Báº¡n khÃ´ng cÃ³ quyá»n truy cáº­p thÃ´ng tin lÃ´ thuá»‘c!"));
        }

        try {
            return ResponseEntity.ok(hoaDonRepository.getAllLoThuoc());
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("message", "Lá»—i truy xuáº¥t danh sÃ¡ch lÃ´ thuá»‘c: " + e.getMessage()));
        }
    }

    // Cáº­p nháº­t tráº¡ng thÃ¡i hÃ³a Ä‘Æ¡n (Lá»… tÃ¢n thu tiá»n máº·t hoáº·c chuyá»ƒn khoáº£n thá»§ cÃ´ng)
    @PutMapping("/hoa-don/{id}/status")
    public ResponseEntity<?> updateInvoiceStatus(@PathVariable String id, @RequestBody Map<String, String> payload) {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        String role = (auth != null) ? auth.getAuthorities().toString().toUpperCase() : "";

        // Báº¢O Máº¬T Lá»šP 1: Cháº·n khÃ¡ch hÃ ng tá»± Ã½ Ä‘á»•i tráº¡ng thÃ¡i hÃ³a Ä‘Æ¡n cá»§a mÃ¬nh thÃ nh "ÄÃ£
        // thanh toÃ¡n"
        if (!role.contains("ADMIN") && !role.contains("QUANLY") && !role.contains("KETOAN")
                && !role.contains("STAFF")) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Cáº£nh bÃ¡o báº£o máº­t: Báº¡n khÃ´ng cÃ³ quyá»n cáº­p nháº­t tráº¡ng thÃ¡i hÃ³a Ä‘Æ¡n!"));
        }

        try {
            String status = payload.get("status");

            // Báº¢O Máº¬T Lá»šP 2: Chá»‘ng nhÃ¢n viÃªn "Äƒn cháº·n" tiá»n báº±ng cÃ¡ch há»§y hÃ³a Ä‘Æ¡n Ä‘Ã£ thanh
            // toÃ¡n
            String currentStatus = jdbcTemplate.queryForObject("SELECT trang_thai FROM HoaDon WHERE id_hoa_don = ?",
                    String.class, id);
            if ("da_thanh_toan".equalsIgnoreCase(currentStatus) && !"da_thanh_toan".equalsIgnoreCase(status)) {
                if (!role.contains("ADMIN") && !role.contains("QUANLY")) {
                    return ResponseEntity.status(403).body(Map.of("message",
                            "Cáº£nh bÃ¡o báº£o máº­t: HÃ³a Ä‘Æ¡n Ä‘Ã£ thu tiá»n, nhÃ¢n viÃªn khÃ´ng Ä‘Æ°á»£c phÃ©p tá»± Ã½ há»§y! Vui lÃ²ng liÃªn há»‡ Quáº£n lÃ½."));
                }
            }

            int updated = jdbcTemplate.update("UPDATE HoaDon SET trang_thai = ? WHERE id_hoa_don = ?", status, id);
            if (updated > 0 && "da_thanh_toan".equals(status) && !"da_thanh_toan".equalsIgnoreCase(currentStatus)) {
                // Ghi nháº­n dÃ²ng tiá»n máº·t vÃ o lá»‹ch sá»­ Ä‘á»ƒ káº¿ toÃ¡n Ä‘á»‘i soÃ¡t
                jdbcTemplate.update(
                        "INSERT INTO ThanhToan (id_hoa_don, ngay_thanh_toan, so_tien, phuong_thuc, trang_thai) VALUES (?, GETDATE(), (SELECT tong_tien_cuoi FROM HoaDon WHERE id_hoa_don = ?), 'Tien_mat', N'ThÃ nh cÃ´ng')",
                        id, id);
            }
            // GHI LOG
            auditLogService.logAction("Äá»”I TRáº NG THÃI", "HoaDon", "Cáº­p nháº­t hÃ³a Ä‘Æ¡n HD-" + id + " thÃ nh " + status);
            return ResponseEntity.ok(Map.of("message", "ÄÃ£ cáº­p nháº­t tráº¡ng thÃ¡i hÃ³a Ä‘Æ¡n!"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lá»—i cáº­p nháº­t hÃ³a Ä‘Æ¡n: " + e.getMessage()));
        }
    }

    // Nháº­p lÃ´ thuá»‘c má»›i vÃ  tá»± Ä‘á»™ng cá»™ng dá»“n tá»“n kho
    @PostMapping("/kho/lo-thuoc")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> addLoThuoc(@RequestBody Map<String, Object> payload) {
        // Báº¢O Máº¬T: Cháº·n má»i Ä‘á»‘i tÆ°á»£ng khÃ´ng cÃ³ quyá»n TÃ i chÃ­nh/Kho truy cáº­p API nÃ y
        if (!hasFinancePermission()) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Cáº£nh bÃ¡o báº£o máº­t: Báº¡n khÃ´ng cÃ³ quyá»n nháº­p kho thuá»‘c!"));
        }

        try {
            String idThuoc = String.valueOf(payload.get("id_thuoc"));
            String soLo = (String) payload.get("so_lo");
            String ngayNhap = (String) payload.get("ngay_nhap");
            String hanSuDung = (String) payload.get("han_su_dung");
            Integer soLuongNhap = Integer.parseInt(payload.get("so_luong_nhap").toString());
            java.math.BigDecimal giaNhap = new java.math.BigDecimal(payload.get("gia_nhap").toString());

            // Báº¢O Máº¬T: Chá»‘ng hack sá»‘ lÆ°á»£ng Ã¢m Ä‘á»ƒ bÃ²n rÃºt kho
            if (soLuongNhap <= 0) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Cáº£nh bÃ¡o báº£o máº­t: Sá»‘ lÆ°á»£ng nháº­p kho pháº£i lá»›n hÆ¡n 0!"));
            }

            // ThÃªm lÃ´ thuá»‘c má»›i
            String sqlInsertLo = "INSERT INTO LoThuoc (id_thuoc, so_lo, ngay_nhap, han_su_dung, so_luong_nhap, so_luong_ton, gia_nhap) "
                    +
                    "VALUES (?, ?, ?, ?, ?, ?, ?)";
            jdbcTemplate.update(sqlInsertLo, idThuoc, soLo, ngayNhap, hanSuDung, soLuongNhap, soLuongNhap, giaNhap);

            // Cáº­p nháº­t sá»‘ lÆ°á»£ng tá»“n tá»•ng cá»§a Thuá»‘c
            String sqlUpdateThuoc = "UPDATE Thuoc SET so_luong_ton = ISNULL(so_luong_ton, 0) + ? WHERE id_thuoc = ?";
            jdbcTemplate.update(sqlUpdateThuoc, soLuongNhap, idThuoc);

            return ResponseEntity.ok(Map.of("message", "Nháº­p kho thÃ nh cÃ´ng!"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lá»—i nháº­p kho: " + e.getMessage()));
        }
    }

    // BÃ¡o cÃ¡o doanh thu thÃ¡ng (tá»« View)
    @GetMapping("/bao-cao/doanh-thu-thang")
    public ResponseEntity<?> getDoanhThuThang() {
        if (!hasFinancePermission()) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Cáº£nh bÃ¡o báº£o máº­t: Báº¡n khÃ´ng cÃ³ quyá»n xem bÃ¡o cÃ¡o tÃ i chÃ­nh!"));
        }
        try {
            return ResponseEntity.ok(hoaDonRepository.getDoanhThuTheoThang());
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("message", "Lá»—i truy xuáº¥t bÃ¡o cÃ¡o doanh thu: " + e.getMessage()));
        }
    }

    // Thá»‘ng kÃª bÃ¡c sÄ© (tá»« View)
    @GetMapping("/bao-cao/thong-ke-bac-si")
    public ResponseEntity<?> getThongKeBacSi() {
        if (!hasFinancePermission()) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Cáº£nh bÃ¡o báº£o máº­t: Báº¡n khÃ´ng cÃ³ quyá»n xem bÃ¡o cÃ¡o thá»‘ng kÃª!"));
        }
        try {
            return ResponseEntity.ok(hoaDonRepository.getThongKeBacSi());
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("message", "Lá»—i truy xuáº¥t thá»‘ng kÃª bÃ¡c sÄ©: " + e.getMessage()));
        }
    }

    // BÃ¡o cÃ¡o doanh thu ngÃ y
    @GetMapping("/bao-cao/doanh-thu-ngay")
    public ResponseEntity<?> getDoanhThuNgay() {
        if (!hasFinancePermission()) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Cáº£nh bÃ¡o báº£o máº­t: Báº¡n khÃ´ng cÃ³ quyá»n xem bÃ¡o cÃ¡o tÃ i chÃ­nh!"));
        }
        try {
            return ResponseEntity.ok(hoaDonRepository.getDoanhThuTheoNgay());
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("message", "Lá»—i truy xuáº¥t bÃ¡o cÃ¡o doanh thu ngÃ y: " + e.getMessage()));
        }
    }

    // Thá»‘ng kÃª tá»· lá»‡ thÃº cÆ°ng
    @GetMapping("/bao-cao/thong-ke-thu-cung")
    public ResponseEntity<?> getThongKeThuCung() {
        if (!hasFinancePermission()) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Cáº£nh bÃ¡o báº£o máº­t: Báº¡n khÃ´ng cÃ³ quyá»n xem bÃ¡o cÃ¡o thá»‘ng kÃª!"));
        }
        try {
            return ResponseEntity.ok(hoaDonRepository.getThongKeThuCung());
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("message", "Lá»—i truy xuáº¥t thá»‘ng kÃª thÃº cÆ°ng: " + e.getMessage()));
        }
    }

    // Thá»‘ng kÃª doanh thu theo dá»‹ch vá»¥
    @GetMapping("/bao-cao/doanh-thu-dich-vu")
    public ResponseEntity<?> getDoanhThuTheoDichVu() {
        if (!hasFinancePermission()) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Cáº£nh bÃ¡o báº£o máº­t: Báº¡n khÃ´ng cÃ³ quyá»n xem bÃ¡o cÃ¡o tÃ i chÃ­nh!"));
        }
        try {
            return ResponseEntity.ok(hoaDonRepository.getDoanhThuTheoDichVu());
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("message", "Lá»—i truy xuáº¥t bÃ¡o cÃ¡o doanh thu dá»‹ch vá»¥: " + e.getMessage()));
        }
    }
}

