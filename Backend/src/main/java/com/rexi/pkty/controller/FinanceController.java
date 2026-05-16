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

    // BẢO MẬT: Hàm kiểm tra quyền truy cập dữ liệu Tài chính
    private boolean hasFinancePermission() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        if (auth == null || auth.getName().equals("anonymousUser"))
            return false;

        // Kiểm tra nhanh qua Spring Security authorities (role code)
        String authorities = auth.getAuthorities().toString().toUpperCase();
        if (authorities.contains("ADMIN") || authorities.contains("QUAN_LY") || authorities.contains("KE_TOAN")
                || authorities.contains("STAFF") || authorities.contains("BAC_SI")) {
            return true;
        }

        // Fallback: Kiểm tra qua DB nếu authority không khớp
        try {
            com.rexi.pkty.entity.TaiKhoan tk = taiKhoanRepository.findByTenDangNhap(auth.getName()).orElse(null);
            if (tk == null || tk.getId_vai_tro() == null)
                return false;

            String roleQuery = "SELECT ten_vai_tro FROM VaiTroHeThong WHERE id_vai_tro = ?";
            List<String> roles = jdbcTemplate.queryForList(roleQuery, String.class, tk.getId_vai_tro());
            if (roles.isEmpty())
                return false;

            String roleName = roles.get(0).toLowerCase();
            return roleName.contains("admin") || roleName.contains("quản lý") || roleName.contains("kế toán")
                    || roleName.contains("quản trị") || roleName.contains("nhân viên") || roleName.contains("bác sĩ");
        } catch (Exception e) {
            return false;
        }
    }

    // Lập hóa đơn mới (Dùng SP)
    @PostMapping("/hoa-don")
    public ResponseEntity<?> addInvoice(@RequestBody HoaDon hd) {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        String role = (auth != null) ? auth.getAuthorities().toString().toUpperCase() : "";

        // BẢO MẬT: Chặn khách hàng tự lập hóa đơn ảo
        if (!role.contains("ADMIN") && !role.contains("QUAN_LY") && !role.contains("KETOAN")
                && !role.contains("STAFF")) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Cảnh báo bảo mật: Bạn không có quyền lập hóa đơn!"));
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
            return ResponseEntity.status(400).body(Map.of("message", "Lỗi lập hóa đơn: " + e.getMessage()));
        }
    }

    // Lấy danh sách thuốc sắp hết hạn (từ View)
    @GetMapping("/kho/thuoc-sap-het-han")
    public ResponseEntity<?> getThuocSapHetHan() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        String role = (auth != null) ? auth.getAuthorities().toString().toUpperCase() : "";
        // BẢO MẬT: Chặn khách hàng xem thông tin cảnh báo kho thuốc
        if (!role.contains("ADMIN") && !role.contains("QUAN_LY") && !role.contains("KETOAN") && !role.contains("STAFF")
                && !role.contains("BAC_SI")) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Cảnh báo bảo mật: Bạn không có quyền xem thông tin kho thuốc!"));
        }

        try {
            return ResponseEntity.ok(hoaDonRepository.getThuocSapHetHan());
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("message", "Lỗi truy xuất danh sách thuốc sắp hết hạn: " + e.getMessage()));
        }
    }

    // Lấy danh sách hóa đơn theo ID khách hàng
    @GetMapping("/hoa-don/khach/{id}")
    public ResponseEntity<?> getInvoicesByCustomerId(@PathVariable String id) {
        try {
            // BẢO MẬT: Kiểm tra IDOR - Ngăn khách hàng xem hóa đơn của người khác
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                    .getContext().getAuthentication();
            String username = (auth != null) ? auth.getName() : null;
            if (username == null || username.equals("anonymousUser")) {
                return ResponseEntity.status(401)
                        .body(Map.of("message", "Cảnh báo bảo mật: Yêu cầu không có Token xác thực hợp lệ!"));
            }
            com.rexi.pkty.entity.TaiKhoan tk = taiKhoanRepository.findByTenDangNhap(username).orElse(null);
            if (tk != null && tk.getId_vai_tro() != null && tk.getId_vai_tro().equals("VT-5")) { // Là khách hàng
                if (!tk.getId_khach_hang().equals(id)) {
                    return ResponseEntity.status(403).body(
                            Map.of("message", "Cảnh báo bảo mật: Bạn không có quyền xem hóa đơn của người khác!"));
                }
            }

            return ResponseEntity.ok(hoaDonRepository.findByCustomerId(id));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi truy xuất hóa đơn: " + e.getMessage()));
        }
    }

    // Lấy tất cả hóa đơn (cho Admin)
    @GetMapping("/hoa-don")
    public ResponseEntity<?> getAllInvoices() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        String role = (auth != null) ? auth.getAuthorities().toString().toUpperCase() : "";

        // BẢO MẬT: Chặn khách hàng xem toàn bộ danh sách hóa đơn làm lộ doanh thu và
        // thông tin người khác
        if (!role.contains("ADMIN") && !role.contains("QUAN_LY") && !role.contains("KETOAN") && !role.contains("KE_TOAN")
                && !role.contains("STAFF")) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Cảnh báo bảo mật: Bạn không có quyền xem toàn bộ danh sách hóa đơn!"));
        }
        try {
            return ResponseEntity.ok(hoaDonRepository.getAllHoaDon());
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("message", "Lỗi truy xuất danh sách hóa đơn: " + e.getMessage()));
        }
    }

    // Lấy chi tiết hóa đơn (Gộp cả Tiền Khám và Tiền Thuốc)
    @GetMapping("/hoa-don/{id}/chi-tiet")
    public ResponseEntity<?> getInvoiceDetails(@PathVariable String id) {
        try {
            // BẢO MẬT: Kiểm tra IDOR - Ngăn khách hàng xem chi tiết hóa đơn của người khác
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                    .getContext().getAuthentication();
            String username = (auth != null) ? auth.getName() : null;

            if (username != null && !username.equals("anonymousUser")) {
                com.rexi.pkty.entity.TaiKhoan tk = taiKhoanRepository.findByTenDangNhap(username).orElse(null);
                if (tk != null && tk.getId_vai_tro() != null && tk.getId_vai_tro().equals("VT-5")) { // Là Khách hàng
                    String sqlCheckOwner = "SELECT id_khach_hang FROM HoaDon WHERE id_hoa_don = ?";
                    List<String> ownerIds = jdbcTemplate.queryForList(sqlCheckOwner, String.class, id);
                    if (!ownerIds.isEmpty() && !ownerIds.get(0).equals(tk.getId_khach_hang())) {
                        return ResponseEntity.status(403)
                                .body(Map.of("message", "Cảnh báo bảo mật: Bạn không có quyền xem hóa đơn này!"));
                    }
                }
            }

            // Lấy chi tiết dịch vụ khám
            String sqlDv = "SELECT dv.ten_dich_vu as ten_muc, 1 as so_luong, dv.gia as don_gia, dv.gia as thanh_tien " +
                    "FROM HoaDon hd " +
                    "JOIN LichHen lh ON hd.id_lich_hen = lh.id_lich_hen " +
                    "JOIN DichVu dv ON lh.id_dich_vu = dv.id_dich_vu " +
                    "WHERE hd.id_hoa_don = ?";
            List<Map<String, Object>> dichVu = jdbcTemplate.queryForList(sqlDv, id);

            // Lấy chi tiết từng món thuốc
            String sqlThuoc = "SELECT t.ten_thuoc as ten_muc, dtct.so_luong, t.gia_ban as don_gia, (dtct.so_luong * t.gia_ban) as thanh_tien "
                    +
                    "FROM HoaDon hd " +
                    "JOIN HoSoBenhAn hs ON hd.id_lich_hen = hs.id_lich_hen " +
                    "JOIN DonThuoc dt ON hs.id_ho_so_benh_an = dt.id_benh_an " +
                    "JOIN DonThuocChiTiet dtct ON dt.id_don_thuoc = dtct.id_don_thuoc " +
                    "JOIN Thuoc t ON dtct.id_thuoc = t.id_thuoc " +
                    "WHERE hd.id_hoa_don = ?";
            List<Map<String, Object>> thuoc = jdbcTemplate.queryForList(sqlThuoc, id);

            // Gộp cả 2 danh sách lại trả về cho Kế toán
            List<Map<String, Object>> chiTiet = new java.util.ArrayList<>();
            chiTiet.addAll(dichVu);
            chiTiet.addAll(thuoc);

            return ResponseEntity.ok(chiTiet);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi lấy chi tiết hóa đơn: " + e.getMessage()));
        }
    }

    // Lấy tất cả thuốc
    @GetMapping("/kho/thuoc")
    public ResponseEntity<?> getAllThuoc() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        String role = (auth != null) ? auth.getAuthorities().toString().toUpperCase() : "";
        // BẢO MẬT: Chặn khách hàng lấy danh sách toàn bộ mặt hàng thuốc
        if (!role.contains("ADMIN") && !role.contains("QUAN_LY") && !role.contains("KETOAN") && !role.contains("STAFF")
                && !role.contains("BAC_SI")) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Cảnh báo bảo mật: Bạn không có quyền truy cập kho thuốc!"));
        }

        try {
            return ResponseEntity.ok(hoaDonRepository.getAllThuoc());
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("message", "Lỗi truy xuất danh sách thuốc: " + e.getMessage()));
        }
    }

    // Lấy tất cả lô thuốc
    @GetMapping("/kho/lo-thuoc")
    public ResponseEntity<?> getAllLoThuoc() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        String role = (auth != null) ? auth.getAuthorities().toString().toUpperCase() : "";
        // BẢO MẬT: Chặn lộ giá nhập (gia_nhap) và số lượng tồn kho cho người ngoài
        if (!role.contains("ADMIN") && !role.contains("QUAN_LY") && !role.contains("KETOAN") && !role.contains("STAFF")
                && !role.contains("BAC_SI")) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Cảnh báo bảo mật: Bạn không có quyền truy cập thông tin lô thuốc!"));
        }

        try {
            return ResponseEntity.ok(hoaDonRepository.getAllLoThuoc());
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("message", "Lỗi truy xuất danh sách lô thuốc: " + e.getMessage()));
        }
    }

    // Cập nhật trạng thái hóa đơn (Lễ tân thu tiền mặt hoặc chuyển khoản thủ công)
    @PutMapping("/hoa-don/{id}/status")
    public ResponseEntity<?> updateInvoiceStatus(@PathVariable String id, @RequestBody Map<String, String> payload) {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        String role = (auth != null) ? auth.getAuthorities().toString().toUpperCase() : "";

        // BẢO MẬT LỚP 1: Chặn khách hàng tự ý đổi trạng thái hóa đơn của mình thành "Đã
        // thanh toán"
        if (!role.contains("ADMIN") && !role.contains("QUAN_LY") && !role.contains("KETOAN")
                && !role.contains("STAFF")) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Cảnh báo bảo mật: Bạn không có quyền cập nhật trạng thái hóa đơn!"));
        }

        try {
            String status = payload.get("status");

            // BẢO MẬT LỚP 2: Chống nhân viên "ăn chặn" tiền bằng cách hủy hóa đơn đã thanh
            // toán
            String currentStatus = jdbcTemplate.queryForObject("SELECT trang_thai FROM HoaDon WHERE id_hoa_don = ?",
                    String.class, id);
            if ("da_thanh_toan".equalsIgnoreCase(currentStatus) && !"da_thanh_toan".equalsIgnoreCase(status)) {
                if (!role.contains("ADMIN") && !role.contains("QUAN_LY")) {
                    return ResponseEntity.status(403).body(Map.of("message",
                            "Cảnh báo bảo mật: Hóa đơn đã thu tiền, nhân viên không được phép tự ý hủy! Vui lòng liên hệ Quản lý."));
                }
            }

            int updated = jdbcTemplate.update("UPDATE HoaDon SET trang_thai = ? WHERE id_hoa_don = ?", status, id);
            if (updated > 0 && "da_thanh_toan".equals(status) && !"da_thanh_toan".equalsIgnoreCase(currentStatus)) {
                // Ghi nhận dòng tiền mặt vào lịch sử để kế toán đối soát
                jdbcTemplate.update(
                        "INSERT INTO ThanhToan (id_hoa_don, ngay_thanh_toan, so_tien, phuong_thuc, trang_thai) VALUES (?, GETDATE(), (SELECT tong_tien_cuoi FROM HoaDon WHERE id_hoa_don = ?), 'Tien_mat', N'Thành công')",
                        id, id);
            }
            // GHI LOG
            auditLogService.logAction("ĐỔI TRẠNG THÁI", "HoaDon", "Cập nhật hóa đơn HD-" + id + " thành " + status);
            return ResponseEntity.ok(Map.of("message", "Đã cập nhật trạng thái hóa đơn!"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi cập nhật hóa đơn: " + e.getMessage()));
        }
    }

    // Nhập lô thuốc mới và tự động cộng dồn tồn kho
    @PostMapping("/kho/lo-thuoc")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> addLoThuoc(@RequestBody Map<String, Object> payload) {
        // BẢO MẬT: Chặn mọi đối tượng không có quyền Tài chính/Kho truy cập API này
        if (!hasFinancePermission()) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Cảnh báo bảo mật: Bạn không có quyền nhập kho thuốc!"));
        }

        try {
            String idThuoc = String.valueOf(payload.get("id_thuoc"));
            String soLo = (String) payload.get("so_lo");
            String ngayNhap = (String) payload.get("ngay_nhap");
            String hanSuDung = (String) payload.get("han_su_dung");
            Integer soLuongNhap = Integer.parseInt(payload.get("so_luong_nhap").toString());
            java.math.BigDecimal giaNhap = new java.math.BigDecimal(payload.get("gia_nhap").toString());

            // BẢO MẬT: Chống hack số lượng âm để bào rút kho
            if (soLuongNhap <= 0) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Cảnh báo bảo mật: Số lượng nhập kho phải lớn hơn 0!"));
            }

            // Thêm lô thuốc mới
            String sqlInsertLo = "INSERT INTO LoThuoc (id_thuoc, so_lo, ngay_nhap, han_su_dung, so_luong_nhap, so_luong_ton, gia_nhap) "
                    +
                    "VALUES (?, ?, ?, ?, ?, ?, ?)";
            jdbcTemplate.update(sqlInsertLo, idThuoc, soLo, ngayNhap, hanSuDung, soLuongNhap, soLuongNhap, giaNhap);

            // Cập nhật số lượng tồn tổng của Thuốc
            String sqlUpdateThuoc = "UPDATE Thuoc SET so_luong_ton = ISNULL(so_luong_ton, 0) + ? WHERE id_thuoc = ?";
            jdbcTemplate.update(sqlUpdateThuoc, soLuongNhap, idThuoc);

            return ResponseEntity.ok(Map.of("message", "Nhập kho thành công!"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi nhập kho: " + e.getMessage()));
        }
    }

    // Báo cáo doanh thu tháng (từ View)
    @GetMapping("/bao-cao/doanh-thu-thang")
    public ResponseEntity<?> getDoanhThuThang() {
        if (!hasFinancePermission()) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Cảnh báo bảo mật: Bạn không có quyền xem báo cáo tài chính!"));
        }
        try {
            return ResponseEntity.ok(hoaDonRepository.getDoanhThuTheoThang());
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("message", "Lỗi truy xuất báo cáo doanh thu: " + e.getMessage()));
        }
    }

    // Thống kê bác sĩ (từ View)
    @GetMapping("/bao-cao/thong-ke-bac-si")
    public ResponseEntity<?> getThongKeBacSi() {
        if (!hasFinancePermission()) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Cảnh báo bảo mật: Bạn không có quyền xem báo cáo thống kê!"));
        }
        try {
            return ResponseEntity.ok(hoaDonRepository.getThongKeBacSi());
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("message", "Lỗi truy xuất thống kê bác sĩ: " + e.getMessage()));
        }
    }

    // Endpoint test lỗi
    @GetMapping("/test-doanh-thu")
    public ResponseEntity<?> testDoanhThu() {
        try {
            return ResponseEntity.ok(hoaDonRepository.getDoanhThuTheoNgay());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage() + " | Cause: " + e.getCause());
        }
    }

    // Báo cáo doanh thu ngày
    @GetMapping("/bao-cao/doanh-thu-ngay")
    public ResponseEntity<?> getDoanhThuNgay() {
        if (!hasFinancePermission()) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Cảnh báo bảo mật: Bạn không có quyền xem báo cáo tài chính!"));
        }
        try {
            return ResponseEntity.ok(hoaDonRepository.getDoanhThuTheoNgay());
        } catch (Exception e) {
            e.printStackTrace(); // Thêm log để bắt lỗi 500
            return ResponseEntity.status(500)
                    .body(Map.of("message", "Lỗi truy xuất báo cáo doanh thu ngày: " + e.getMessage()));
        }
    }

    // Thống kê tỷ lệ thú cưng
    @GetMapping("/bao-cao/thong-ke-thu-cung")
    public ResponseEntity<?> getThongKeThuCung() {
        if (!hasFinancePermission()) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Cảnh báo bảo mật: Bạn không có quyền xem báo cáo thống kê!"));
        }
        try {
            return ResponseEntity.ok(hoaDonRepository.getThongKeThuCung());
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("message", "Lỗi truy xuất thống kê thú cưng: " + e.getMessage()));
        }
    }

    // Thống kê doanh thu theo dịch vụ
    @GetMapping("/bao-cao/doanh-thu-dich-vu")
    public ResponseEntity<?> getDoanhThuTheoDichVu() {
        if (!hasFinancePermission()) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Cảnh báo bảo mật: Bạn không có quyền xem báo cáo tài chính!"));
        }
        try {
            return ResponseEntity.ok(hoaDonRepository.getDoanhThuTheoDichVu());
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("message", "Lỗi truy xuất báo cáo doanh thu dịch vụ: " + e.getMessage()));
        }
    }
}
