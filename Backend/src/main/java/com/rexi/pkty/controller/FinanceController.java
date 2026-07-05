package com.rexi.pkty.controller;

import com.rexi.pkty.entity.HoaDon;
import com.rexi.pkty.repository.HoaDonRepository;
import com.rexi.pkty.security.RexiSecurityRoles;
import com.rexi.pkty.util.DatabaseDialect;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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

    // Check quyền FINANCE của user
    private boolean hasFinancePermission() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        if (auth == null || auth.getName().equals("anonymousUser"))
            return false;

        // Check nhanh qua authority (ADMIN/QUAN_LY/KE_TOAN)
        String authorities = auth.getAuthorities().toString().toUpperCase();
        if (authorities.contains("ADMIN") || authorities.contains("QUAN_LY") || authorities.contains("KE_TOAN")) {
            return true;
        }

        // Fallback: Check qua DB nếu authority ko khớp
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
                    || roleName.contains("quản trị");
        } catch (Exception e) {
            return false;
        }
    }

    // Lập hóa đơn mới qua SP
    @PostMapping("/hoa-don")
    public ResponseEntity<?> addInvoice(@RequestBody HoaDon hd) {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        String role = (auth != null) ? auth.getAuthorities().toString().toUpperCase() : "";

        // Chặn KHACH_HANG tự tạo hóa đơn ảo
        if (!role.contains("ADMIN") && !role.contains("QUAN_LY") && !role.contains("KETOAN") && !role.contains("KE_TOAN")
                && !role.contains("STAFF") && !role.contains("TIEP_TAN")) {
            return ResponseEntity.status(403)
                    .body(Map.of("message", "Cảnh báo bảo mật: Bạn không có quyền lập hóa đơn!"));
        }
        try {
            if (hd.getId_hoa_don() == null || hd.getId_hoa_don().isBlank()) {
                hd.setId_hoa_don("HD-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase());
            }
            if (hd.getNgay_lap() == null) hd.setNgay_lap(java.time.LocalDateTime.now());
            if (hd.getNgay_lap_hoa_don() == null) hd.setNgay_lap_hoa_don(java.time.LocalDateTime.now());

            if (hd.getId_lich_hen() != null && (hd.getId_khach_hang() == null || hd.getId_nhan_vien() == null)) {
                List<Map<String, Object>> apptRows = jdbcTemplate.queryForList(
                        "SELECT lh.id_khach_hang, lh.id_bac_si, COALESCE(dv.gia, 0) AS gia_dich_vu " +
                                "FROM LichHen lh LEFT JOIN DichVu dv ON lh.id_dich_vu = dv.id_dich_vu WHERE lh.id_lich_hen = ?",
                        hd.getId_lich_hen());
                if (!apptRows.isEmpty()) {
                    Map<String, Object> appt = apptRows.get(0);
                    if (hd.getId_khach_hang() == null) hd.setId_khach_hang((String) appt.get("id_khach_hang"));
                    if (hd.getId_nhan_vien() == null) hd.setId_nhan_vien((String) appt.get("id_bac_si"));
                    if (hd.getTong_tien_truoc_giam_gia() == null && appt.get("gia_dich_vu") instanceof Number n) {
                        hd.setTong_tien_truoc_giam_gia(new java.math.BigDecimal(n.toString()));
                    }
                }
            }

            java.math.BigDecimal before = hd.getTong_tien_truoc_giam_gia() != null ? hd.getTong_tien_truoc_giam_gia() : java.math.BigDecimal.ZERO;
            java.math.BigDecimal discount = hd.getTong_giam_gia() != null ? hd.getTong_giam_gia() : java.math.BigDecimal.ZERO;
            java.math.BigDecimal taxRate = hd.getThue_suat() != null ? hd.getThue_suat() : java.math.BigDecimal.ZERO;
            java.math.BigDecimal afterDiscount = before.subtract(discount).max(java.math.BigDecimal.ZERO);
            java.math.BigDecimal tax = afterDiscount.multiply(taxRate).divide(new java.math.BigDecimal("100"));

            hd.setTong_tien_ban_dau(before);
            hd.setTong_tien_sau_giam_gia(afterDiscount);
            hd.setTong_tien_cuoi(hd.getTong_tien_cuoi() != null ? hd.getTong_tien_cuoi() : afterDiscount.add(tax));
            hd.setThue_phai_nop(tax);
            if (hd.getTrang_thai() == null) hd.setTrang_thai("CHO_THANH_TOAN");
            if (hd.getTrang_thai_thanh_toan() == null) hd.setTrang_thai_thanh_toan("Chờ thanh toán");

            return ResponseEntity.ok(hoaDonRepository.save(hd));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(Map.of("message", "Lỗi lập hóa đơn: " + e.getMessage()));
        }
    }

    // Get thuốc sắp hết hạn (từ View)
    @GetMapping("/kho/thuoc-sap-het-han")
    @PreAuthorize(RexiSecurityRoles.INVENTORY_READ)
    public ResponseEntity<?> getThuocSapHetHan() {
        try {
            return ResponseEntity.ok(hoaDonRepository.getThuocSapHetHan());
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("message", "Lỗi truy xuất danh sách thuốc sắp hết hạn: " + e.getMessage()));
        }
    }

    // Get list hóa đơn theo id khách hàng
    @GetMapping("/hoa-don/khach/{id}")
    public ResponseEntity<?> getInvoicesByCustomerId(@PathVariable String id) {
        try {
            // Chặn IDOR: KHACH_HANG ko được xem hóa đơn người khác
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

    // Get all hóa đơn (ADMIN)
    @GetMapping("/hoa-don")
    @PreAuthorize(RexiSecurityRoles.INVOICE_READ)
    public ResponseEntity<?> getAllInvoices() {
        try {
            return ResponseEntity.ok(hoaDonRepository.getAllHoaDon());
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("message", "Lỗi truy xuất danh sách hóa đơn: " + e.getMessage()));
        }
    }

    // Chi tiết hóa đơn (Tiền Khám + Tiền Thuốc)
    @GetMapping("/hoa-don/{id}/chi-tiet")
    public ResponseEntity<?> getInvoiceDetails(@PathVariable String id) {
        try {
            // Chặn IDOR: KHACH_HANG ko được xem chi tiết hóa đơn người khác
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

            // Lấy phí khám dịch vụ
            String sqlDv = "SELECT dv.ten_dich_vu as ten_muc, 1 as so_luong, dv.gia as don_gia, dv.gia as thanh_tien " +
                    "FROM HoaDon hd " +
                    "JOIN LichHen lh ON hd.id_lich_hen = lh.id_lich_hen " +
                    "JOIN DichVu dv ON lh.id_dich_vu = dv.id_dich_vu " +
                    "WHERE hd.id_hoa_don = ?";
            List<Map<String, Object>> dichVu = jdbcTemplate.queryForList(sqlDv, id);

            // Lấy phí mua thuốc
            String sqlThuoc = "SELECT t.ten_thuoc as ten_muc, dtct.so_luong, t.gia_ban as don_gia, (dtct.so_luong * t.gia_ban) as thanh_tien "
                    +
                    "FROM HoaDon hd " +
                    "JOIN HoSoBenhAn hs ON hd.id_lich_hen = hs.id_lich_hen " +
                    "JOIN DonThuoc dt ON hs.id_ho_so_benh_an = dt.id_ho_so_benh_an " +
                    "JOIN DonThuocChiTiet dtct ON dt.id_don_thuoc = dtct.id_don_thuoc " +
                    "JOIN Thuoc t ON dtct.id_thuoc = t.id_thuoc " +
                    "WHERE hd.id_hoa_don = ?";
            List<Map<String, Object>> thuoc = jdbcTemplate.queryForList(sqlThuoc, id);

            // Merge list trả về cho KE_TOAN
            List<Map<String, Object>> chiTiet = new java.util.ArrayList<>();
            chiTiet.addAll(dichVu);
            chiTiet.addAll(thuoc);

            return ResponseEntity.ok(chiTiet);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi lấy chi tiết hóa đơn: " + e.getMessage()));
        }
    }

    // Lấy lịch sử thanh toán của hóa đơn
    @GetMapping("/hoa-don/{id}/thanh-toan")
    public ResponseEntity<?> getInvoicePaymentHistory(@PathVariable String id) {
        try {
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                    .getContext().getAuthentication();
            String username = (auth != null) ? auth.getName() : null;

            if (username == null || username.equals("anonymousUser")) {
                return ResponseEntity.status(401)
                        .body(Map.of("message", "Cảnh báo bảo mật: Yêu cầu không có Token xác thực hợp lệ!"));
            }

            com.rexi.pkty.entity.TaiKhoan tk = taiKhoanRepository.findByTenDangNhap(username).orElse(null);
            if (tk != null && tk.getId_vai_tro() != null && tk.getId_vai_tro().equals("VT-5")) {
                String sqlCheckOwner = "SELECT id_khach_hang FROM HoaDon WHERE id_hoa_don = ?";
                List<String> ownerIds = jdbcTemplate.queryForList(sqlCheckOwner, String.class, id);
                if (!ownerIds.isEmpty() && !ownerIds.get(0).equals(tk.getId_khach_hang())) {
                    return ResponseEntity.status(403)
                            .body(Map.of("message", "Cảnh báo bảo mật: Bạn không có quyền xem lịch sử thanh toán hóa đơn này!"));
                }
            }

            String sql = "SELECT id_thanh_toan, id_hoa_don, so_tien, phuong_thuc, ngay_tra_tien, "
                    + "ma_giao_dich_ngan_hang, ghi_chu "
                    + "FROM ThanhToan WHERE id_hoa_don = ? ORDER BY ngay_tra_tien DESC, id_thanh_toan DESC";
            return ResponseEntity.ok(jdbcTemplate.queryForList(sql, id));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("message", "Lỗi lấy lịch sử thanh toán: " + e.getMessage()));
        }
    }

    // Get all thuốc
    @GetMapping("/kho/thuoc")
    @PreAuthorize(RexiSecurityRoles.INVENTORY_READ)
    public ResponseEntity<?> getAllThuoc() {
        try {
            String todayExpr = DatabaseDialect.isPostgres(jdbcTemplate) ? "CURRENT_DATE" : "CAST(GETDATE() AS date)";
            String sql = "SELECT t.*, COALESCE(SUM(CASE WHEN lt.han_su_dung >= " + todayExpr + " THEN lt.so_luong_ton ELSE 0 END), 0) AS so_luong_ton "
                    + "FROM Thuoc t LEFT JOIN LoThuoc lt ON t.id_thuoc = lt.id_thuoc "
                    + "GROUP BY t.id_thuoc, t.ten_thuoc, t.thanh_phan, t.dang_bao_che, t.don_vi, t.mo_ta, t.gia_ban, t.trang_thai, t.da_xoa";
            return ResponseEntity.ok(jdbcTemplate.queryForList(sql));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("message", "Lỗi truy xuất danh sách thuốc: " + e.getMessage()));
        }
    }

    // Get all lô thuốc
    @GetMapping("/kho/lo-thuoc")
    @PreAuthorize(RexiSecurityRoles.INVENTORY_READ)
    public ResponseEntity<?> getAllLoThuoc() {
        try {
            return ResponseEntity.ok(hoaDonRepository.getAllLoThuoc());
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("message", "Lỗi truy xuất danh sách lô thuốc: " + e.getMessage()));
        }
    }

    // Update trạng thái hóa đơn (thu tiền mặt / ck thủ công)
    @PutMapping("/hoa-don/{id}/status")
    @PreAuthorize(RexiSecurityRoles.INVOICE_WRITE)
    public ResponseEntity<?> updateInvoiceStatus(@PathVariable String id, @RequestBody Map<String, String> payload) {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        String role = (auth != null) ? auth.getAuthorities().toString().toUpperCase() : "";

        try {
            String status = payload.get("status");
            if (status != null) {
                status = status.toUpperCase(); // CHUẨN HÓA ENUM IN HOA
            }

            // Chống nhân viên "ăn chặn" bằng cách hủy hóa đơn DA_THANH_TOAN
            String currentStatus = jdbcTemplate.queryForObject("SELECT trang_thai FROM HoaDon WHERE id_hoa_don = ?",
                    String.class, id);
            if ("DA_THANH_TOAN".equalsIgnoreCase(currentStatus) && !"DA_THANH_TOAN".equalsIgnoreCase(status)) {
                if (!role.contains("ADMIN") && !role.contains("QUAN_LY")) {
                    return ResponseEntity.status(403).body(Map.of("message",
                            "Cảnh báo bảo mật: Hóa đơn đã thu tiền, nhân viên không được phép tự ý hủy! Vui lòng liên hệ Quản lý."));
                }
            }

            int updated = jdbcTemplate.update("UPDATE HoaDon SET trang_thai = ? WHERE id_hoa_don = ?", status, id);
            if (updated > 0 && "DA_THANH_TOAN".equals(status) && !"DA_THANH_TOAN".equalsIgnoreCase(currentStatus)) {
                // Ghi nhận dòng tiền mặt vào log thanh toán
                jdbcTemplate.update(
                        "INSERT INTO ThanhToan (id_thanh_toan, id_hoa_don, ngay_tra_tien, so_tien, phuong_thuc, ghi_chu) VALUES (?, ?, CURRENT_TIMESTAMP, (SELECT tong_tien_cuoi FROM HoaDon WHERE id_hoa_don = ?), 'Tien_mat', 'Thanh toán tiền mặt thành công')",
                        "TT-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase(), id, id);
            }
            // GHI LOG
            auditLogService.logAction("ĐỔI TRẠNG THÁI", "HoaDon", "Cập nhật hóa đơn HD-" + id + " thành " + status);
            return ResponseEntity.ok(Map.of("message", "Đã cập nhật trạng thái hóa đơn!"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi cập nhật hóa đơn: " + e.getMessage()));
        }
    }

    // Nhập lô thuốc mới & cộng tồn kho
    @PostMapping("/kho/lo-thuoc")
    @org.springframework.transaction.annotation.Transactional
    @PreAuthorize(RexiSecurityRoles.INVENTORY_WRITE)
    public ResponseEntity<?> addLoThuoc(@RequestBody Map<String, Object> payload) {
        try {
            String idThuoc = String.valueOf(payload.get("id_thuoc"));
            String soLo = (String) payload.get("so_lo");
            String ngayNhap = (String) payload.get("ngay_nhap");
            String hanSuDung = (String) payload.get("han_su_dung");
            Integer soLuongNhap = Integer.parseInt(payload.get("so_luong_nhap").toString());
            java.math.BigDecimal giaNhap = new java.math.BigDecimal(payload.get("gia_nhap").toString());
            String idNcc = payload.get("id_ncc") != null && !String.valueOf(payload.get("id_ncc")).isBlank()
                    ? String.valueOf(payload.get("id_ncc"))
                    : "NCC-MAC-DINH";

            // Chặn hack qty âm rút kho trái phép
            if (soLuongNhap <= 0) {
                return ResponseEntity.badRequest()
                        .body(Map.of("message", "Cảnh báo bảo mật: Số lượng nhập kho phải lớn hơn 0!"));
            }

            String idLo = "LO-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase();

            Integer nccCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM NhaCungCap WHERE id_ncc = ?",
                    Integer.class,
                    idNcc);
            if (nccCount == null || nccCount == 0) {
                jdbcTemplate.update(
                        "INSERT INTO NhaCungCap (id_ncc, ten_ncc, ghi_chu, ngay_tao) VALUES (?, 'Nhà cung cấp mặc định', 'Tự tạo khi nhập kho từ giao diện chưa chọn nhà cung cấp', CURRENT_TIMESTAMP)",
                        idNcc);
            }

            // Thêm lô thuốc mới
            String sqlInsertLo = "INSERT INTO LoThuoc (id_lo, id_thuoc, so_lo, ngay_nhap, han_su_dung, so_luong_nhap, so_luong_ton, gia_nhap, id_ncc) "
                    +
                    "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
            jdbcTemplate.update(sqlInsertLo, idLo, idThuoc, soLo, ngayNhap, hanSuDung, soLuongNhap, soLuongNhap, giaNhap, idNcc);

            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                    .getContext().getAuthentication();
            String idNhanVien = "NV-HE-THONG";
            if (auth != null && auth.getName() != null && !"anonymousUser".equals(auth.getName())) {
                com.rexi.pkty.entity.TaiKhoan tk = taiKhoanRepository.findByTenDangNhap(auth.getName()).orElse(null);
                if (tk != null && tk.getId_nhan_vien() != null && !tk.getId_nhan_vien().isBlank()) {
                    idNhanVien = tk.getId_nhan_vien();
                }
            }

            String idGiaoDich = "GDK-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            jdbcTemplate.update(
                    "INSERT INTO GiaoDichKho (id_giao_dich, id_thuoc, id_lo, loai_giao_dich, so_luong, gia_tri, ngay_giao_dich, id_nhan_vien, ghi_chu) VALUES (?, ?, ?, 'NHAP_KHO', ?, ?, CURRENT_TIMESTAMP, ?, ?)",
                    idGiaoDich, idThuoc, idLo, soLuongNhap, giaNhap.multiply(java.math.BigDecimal.valueOf(soLuongNhap)),
                    idNhanVien, "Nhập kho từ giao diện quản lý");

            return ResponseEntity.ok(Map.of("message", "Nhập kho thành công!"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi nhập kho: " + e.getMessage()));
        }
    }

    // Báo cáo doanh thu tháng (từ View)
    @GetMapping("/bao-cao/doanh-thu-thang")
    @PreAuthorize(RexiSecurityRoles.FINANCE_READ)
    public ResponseEntity<?> getDoanhThuThang() {
        try {
            // FIX TIMEZONE: Convert UTC → VN (UTC+7) trước khi extract year/month
            String sql = DatabaseDialect.isPostgres(jdbcTemplate)
                    ? "SELECT EXTRACT(YEAR FROM (ngay_lap_hoa_don AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh'))::int AS Nam, "
                            + "EXTRACT(MONTH FROM (ngay_lap_hoa_don AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh'))::int AS Thang, "
                            + "SUM(tong_tien_cuoi) AS TongDoanhThu "
                            + "FROM HoaDon WHERE UPPER(TRIM(trang_thai)) = 'DA_THANH_TOAN' "
                            + "GROUP BY EXTRACT(YEAR FROM (ngay_lap_hoa_don AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh'))::int, "
                            + "EXTRACT(MONTH FROM (ngay_lap_hoa_don AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh'))::int "
                            + "ORDER BY Nam DESC, Thang DESC"
                    : "SELECT YEAR(DATEADD(HOUR, 7, ngay_lap_hoa_don)) AS Nam, MONTH(DATEADD(HOUR, 7, ngay_lap_hoa_don)) AS Thang, "
                            + "SUM(tong_tien_cuoi) AS TongDoanhThu "
                            + "FROM HoaDon WHERE UPPER(TRIM(trang_thai)) = 'DA_THANH_TOAN' "
                            + "GROUP BY YEAR(DATEADD(HOUR, 7, ngay_lap_hoa_don)), MONTH(DATEADD(HOUR, 7, ngay_lap_hoa_don)) "
                            + "ORDER BY Nam DESC, Thang DESC";
            return ResponseEntity.ok(jdbcTemplate.queryForList(sql));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("message", "Lỗi truy xuất báo cáo doanh thu: " + e.getMessage()));
        }
    }

    // Tổng quan tài chính: chỉ tính hóa đơn DA_THANH_TOAN
    @GetMapping("/bao-cao/tong-quan-tai-chinh")
    @PreAuthorize(RexiSecurityRoles.FINANCE_READ)
    public ResponseEntity<?> getTongQuanTaiChinh() {
        try {
            Map<String, Object> summary = jdbcTemplate.queryForMap(
                    "SELECT " +
                            "COALESCE(SUM(CASE WHEN UPPER(TRIM(trang_thai)) = 'DA_THANH_TOAN' THEN tong_tien_cuoi ELSE 0 END), 0) AS TongDoanhThu, "
                            +
                            "COUNT(CASE WHEN UPPER(TRIM(trang_thai)) = 'DA_THANH_TOAN' THEN 1 END) AS SoHoaDonDaThanhToan, "
                            +
                            "COUNT(*) AS TongSoHoaDon " +
                            "FROM HoaDon");
            return ResponseEntity.ok(summary);
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("message", "Lỗi truy xuất tổng quan tài chính: " + e.getMessage()));
        }
    }

    // Thống kê bác sĩ (từ View)
    @GetMapping("/bao-cao/thong-ke-bac-si")
    @PreAuthorize(RexiSecurityRoles.FINANCE_READ)
    public ResponseEntity<?> getThongKeBacSi() {
        try {
            return ResponseEntity.ok(hoaDonRepository.getThongKeBacSi());
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("message", "Lỗi truy xuất thống kê bác sĩ: " + e.getMessage()));
        }
    }

    // Endpoint test lỗi
    @GetMapping("/test-doanh-thu")
    @PreAuthorize(RexiSecurityRoles.FINANCE_READ)
    public ResponseEntity<?> testDoanhThu() {
        try {
            return ResponseEntity.ok(getDoanhThuTheoNgayRows());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Lỗi truy xuất doanh thu: " + e.getMessage()));
        }
    }

    // Báo cáo doanh thu ngày
    @GetMapping("/bao-cao/doanh-thu-ngay")
    @PreAuthorize(RexiSecurityRoles.FINANCE_READ)
    public ResponseEntity<?> getDoanhThuNgay() {
        try {
            return ResponseEntity.ok(getDoanhThuTheoNgayRows());
        } catch (Exception e) {
            e.printStackTrace(); // Thêm log để bắt lỗi 500
            return ResponseEntity.status(500)
                    .body(Map.of("message", "Lỗi truy xuất báo cáo doanh thu ngày: " + e.getMessage()));
        }
    }

    private List<Map<String, Object>> getDoanhThuTheoNgayRows() {
        // FIX TIMEZONE: Convert UTC → VN (UTC+7) trước khi group by ngày
        String sql = DatabaseDialect.isPostgres(jdbcTemplate)
                ? "SELECT (ngay_lap_hoa_don AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh')::date as Ngay, "
                        + "SUM(tong_tien_cuoi) as TongDoanhThu FROM HoaDon "
                        + "WHERE UPPER(TRIM(trang_thai)) = 'DA_THANH_TOAN' "
                        + "AND (ngay_lap_hoa_don AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh')::date >= (NOW() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date - 6 "
                        + "GROUP BY (ngay_lap_hoa_don AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Ho_Chi_Minh')::date ORDER BY Ngay ASC"
                : "SELECT CAST(DATEADD(HOUR, 7, ngay_lap_hoa_don) AS date) as Ngay, SUM(tong_tien_cuoi) as TongDoanhThu FROM HoaDon "
                        + "WHERE UPPER(TRIM(trang_thai)) = 'DA_THANH_TOAN' "
                        + "AND CAST(DATEADD(HOUR, 7, ngay_lap_hoa_don) AS date) >= DATEADD(day, -6, CAST(DATEADD(HOUR, 7, GETDATE()) AS date)) "
                        + "GROUP BY CAST(DATEADD(HOUR, 7, ngay_lap_hoa_don) AS date) ORDER BY Ngay ASC";
        return jdbcTemplate.queryForList(sql);
    }

    // Thống kê tỷ lệ thú cưng
    @GetMapping("/bao-cao/thong-ke-thu-cung")
    @PreAuthorize(RexiSecurityRoles.FINANCE_READ)
    public ResponseEntity<?> getThongKeThuCung() {
        try {
            return ResponseEntity.ok(hoaDonRepository.getThongKeThuCung());
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("message", "Lỗi truy xuất thống kê thú cưng: " + e.getMessage()));
        }
    }

    // Thống kê doanh thu theo dịch vụ
    @GetMapping("/bao-cao/doanh-thu-dich-vu")
    @PreAuthorize(RexiSecurityRoles.FINANCE_READ)
    public ResponseEntity<?> getDoanhThuTheoDichVu() {
        try {
            return ResponseEntity.ok(hoaDonRepository.getDoanhThuTheoDichVu());
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("message", "Lỗi truy xuất báo cáo doanh thu dịch vụ: " + e.getMessage()));
        }
    }
}
