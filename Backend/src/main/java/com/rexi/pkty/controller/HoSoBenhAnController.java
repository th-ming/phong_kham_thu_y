package com.rexi.pkty.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ho-so-benh-an")
@CrossOrigin(origins = "${cors.allowed-origins:http://localhost:3000}")
public class HoSoBenhAnController {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private com.rexi.pkty.service.ZaloService zaloService;

    @Autowired
    private com.rexi.pkty.service.AuditLogService auditLogService;

    @GetMapping
    public org.springframework.http.ResponseEntity<?> getAllHoSoBenhAn(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        if (!hasMedicalPermission()) {
            return org.springframework.http.ResponseEntity.status(403)
                    .body(Map.of("message", "Cảnh báo bảo mật: Bạn không có quyền xem danh sách bệnh án tổng quát!"));
        }
        int offset = page * size;
        String sql = "SELECT hs.id_ho_so_benh_an as id_ho_so, hs.ngay_kham, hs.trieu_chung, hs.chan_doan, hs.phac_do_dieu_tri, hs.huong_dan_cham_soc, "
                + "hs.nhiet_do, hs.can_nang, hs.trang_thai_ho_so, " +
                "tc.id_thu_cung, tc.ten_thu_cung, tc.giong as giong_loai, " +
                "nv.id_nhan_vien as id_bac_si, nv.ho_ten as ten_bac_si, " +
                "kh.id_khach_hang, kh.ten_khach_hang " +
                "FROM HoSoBenhAn hs " +
                "LEFT JOIN ThuCung tc ON hs.id_thu_cung = tc.id_thu_cung " +
                "LEFT JOIN KhachHang kh ON tc.id_khach_hang = kh.id_khach_hang " +
                "LEFT JOIN NhanVien nv ON hs.id_bac_si = nv.id_nhan_vien " +
                "ORDER BY hs.ngay_kham DESC " +
                "OFFSET CAST(? AS INT) ROWS FETCH NEXT CAST(? AS INT) ROWS ONLY";
        return org.springframework.http.ResponseEntity.ok(jdbcTemplate.queryForList(sql, offset, size));
    }

    @GetMapping("/{id}")
    public org.springframework.http.ResponseEntity<?> getHoSoById(@PathVariable String id) {
        String sql = "SELECT hs.id_ho_so_benh_an as id_ho_so, hs.ngay_kham, hs.trieu_chung, hs.chan_doan, hs.phac_do_dieu_tri, hs.huong_dan_cham_soc, "
                + "hs.nhiet_do, hs.can_nang, hs.trang_thai_ho_so, "
                + "tc.id_thu_cung, tc.ten_thu_cung, tc.giong as giong_loai, "
                + "nv.id_nhan_vien as id_bac_si, nv.ho_ten as ten_bac_si, "
                + "kh.id_khach_hang, kh.ten_khach_hang "
                + "FROM HoSoBenhAn hs "
                + "LEFT JOIN ThuCung tc ON hs.id_thu_cung = tc.id_thu_cung "
                + "LEFT JOIN KhachHang kh ON tc.id_khach_hang = kh.id_khach_hang "
                + "LEFT JOIN NhanVien nv ON hs.id_bac_si = nv.id_nhan_vien "
                + "WHERE hs.id_ho_so_benh_an = ?";
        List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, id);
        if (results.isEmpty()) {
            return org.springframework.http.ResponseEntity.notFound().build();
        }

        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        String username = (auth != null) ? auth.getName() : null;

        boolean isCustomer = auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("KHACH_HANG") || a.getAuthority().equals("ROLE_KHACH_HANG"));
        if (isCustomer) {
            String recordKhachHangId = String.valueOf(results.get(0).get("id_khach_hang"));
            List<String> userKhIds = jdbcTemplate.queryForList(
                    "SELECT id_khach_hang FROM TaiKhoan WHERE ten_dang_nhap = ?", String.class, username);
            if (!userKhIds.isEmpty() && !userKhIds.get(0).equals(recordKhachHangId)) {
                return org.springframework.http.ResponseEntity.status(403)
                        .body(Map.of("message", "Cảnh báo bảo mật: Bạn không có quyền xem bệnh án của người khác!"));
            }
        }

        return org.springframework.http.ResponseEntity.ok(results.get(0));
    }

    @GetMapping("/khach/{id}")
    public org.springframework.http.ResponseEntity<?> getHoSoByKhachHang(@PathVariable String id) {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        String username = (auth != null) ? auth.getName() : null;
        if (username == null || username.equals("anonymousUser")) {
            return org.springframework.http.ResponseEntity.status(401)
                    .body(Map.of("message", "Cảnh báo bảo mật: Yêu cầu không có Token xác thực hợp lệ!"));
        }

        boolean isCustomer = auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("KHACH_HANG") || a.getAuthority().equals("ROLE_KHACH_HANG"));
        if (isCustomer) {
            List<String> userKhIds = jdbcTemplate.queryForList(
                    "SELECT id_khach_hang FROM TaiKhoan WHERE ten_dang_nhap = ?", String.class, username);
            if (!userKhIds.isEmpty() && !userKhIds.get(0).equals(id)) {
                return org.springframework.http.ResponseEntity.status(403)
                        .body(Map.of("message", "Cảnh báo bảo mật: Bạn không có quyền xem bệnh án của người khác!"));
            }
        }

        String sql = "SELECT hs.id_ho_so_benh_an as id_ho_so, hs.ngay_kham, hs.trieu_chung, hs.chan_doan, hs.phac_do_dieu_tri, hs.huong_dan_cham_soc, "
                + "hs.nhiet_do, hs.can_nang, hs.trang_thai_ho_so, "
                + "tc.id_thu_cung, tc.ten_thu_cung, tc.giong as giong_loai, "
                + "nv.id_nhan_vien as id_bac_si, nv.ho_ten as ten_bac_si "
                + "FROM HoSoBenhAn hs "
                + "JOIN ThuCung tc ON hs.id_thu_cung = tc.id_thu_cung "
                + "LEFT JOIN NhanVien nv ON hs.id_bac_si = nv.id_nhan_vien "
                + "WHERE tc.id_khach_hang = ? "
                + "ORDER BY hs.ngay_kham DESC";
        return org.springframework.http.ResponseEntity.ok(jdbcTemplate.queryForList(sql, id));
    }

    @GetMapping("/don-thuoc")
    public List<Map<String, Object>> getAllDonThuoc(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        if (!hasMedicalPermission()) {
            return List.of(Map.of("message", "Cảnh báo bảo mật: Bạn không có quyền xem danh sách đơn thuốc!"));
        }
        int offset = page * size;
        String sql = "SELECT dt.id_don_thuoc, dt.id_benh_an as id_ho_so_benh_an, tc.ten_thu_cung, " +
                "t.ten_thuoc, dtct.so_luong, dtct.lieu_dung as cach_dung, dt.ghi_chu, " +
                "nv.ho_ten as ten_bac_si, kh.ten_khach_hang " +
                "FROM DonThuoc dt " +
                "JOIN DonThuocChiTiet dtct ON dt.id_don_thuoc = dtct.id_don_thuoc " +
                "JOIN Thuoc t ON dtct.id_thuoc = t.id_thuoc " +
                "JOIN HoSoBenhAn hs ON dt.id_benh_an = hs.id_ho_so_benh_an " +
                "JOIN ThuCung tc ON hs.id_thu_cung = tc.id_thu_cung " +
                "JOIN NhanVien nv ON dt.id_bac_si = nv.id_nhan_vien " +
                "JOIN KhachHang kh ON tc.id_khach_hang = kh.id_khach_hang " +
                "ORDER BY dt.ngay_ke DESC " +
                "OFFSET CAST(? AS INT) ROWS FETCH NEXT CAST(? AS INT) ROWS ONLY";
        return jdbcTemplate.queryForList(sql, offset, size);
    }

    @GetMapping("/xet-nghiem")
    public List<Map<String, Object>> getAllXetNghiem(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        if (!hasMedicalPermission()) {
            return List.of(Map.of("message", "Cảnh báo bảo mật: Bạn không có quyền xem danh sách xét nghiệm!"));
        }
        int offset = page * size;
        String sql = "SELECT baxn.id_ba_xn as id_xet_nghiem_benh_an, lxn.ten_xet_nghiem, " +
                "baxn.id_benh_an as id_ho_so, baxn.ngay_chi_dinh as ngay_lay_mau, " +
                "baxn.trang_thai, nv.ho_ten as ten_bac_si " +
                "FROM BenhAn_XetNghiem baxn " +
                "JOIN LoaiXetNghiem lxn ON baxn.id_loai_xet_nghiem = lxn.id_loai_xet_nghiem " +
                "JOIN HoSoBenhAn hs ON baxn.id_benh_an = hs.id_ho_so_benh_an " +
                "JOIN NhanVien nv ON hs.id_bac_si = nv.id_nhan_vien " +
                "ORDER BY baxn.ngay_chi_dinh DESC " +
                "OFFSET CAST(? AS INT) ROWS FETCH NEXT CAST(? AS INT) ROWS ONLY";
        return jdbcTemplate.queryForList(sql, offset, size);
    }

    private boolean hasMedicalPermission() {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        if (auth == null || auth.getName().equals("anonymousUser"))
            return false;
        String role = auth.getAuthorities().toString().toUpperCase();
        return role.contains("ADMIN") || role.contains("DOCTOR") || role.contains("NHANVIEN");
    }

    @PostMapping
    public org.springframework.http.ResponseEntity<?> taoHoSoBenhAn(@RequestBody Map<String, Object> payload) {
        if (!hasMedicalPermission()) {
            return org.springframework.http.ResponseEntity.status(403)
                    .body(Map.of("message", "Cảnh báo bảo mật: Bạn không có quyền tạo hồ sơ bệnh án!"));
        }
        try {
            String idThuCung = String.valueOf(payload.get("id_thu_cung"));
            String idBacSi = String.valueOf(payload.get("id_bac_si"));
            String idLichHen = String.valueOf(payload.get("id_lich_hen"));
            String trieuChung = (String) payload.get("trieu_chung");
            String chanDoan = (String) payload.get("chan_doan");

            String sql = "INSERT INTO HoSoBenhAn (id_thu_cung, id_bac_si, id_lich_hen, trieu_chung, chan_doan, ngay_kham) "
                    + "OUTPUT INSERTED.id_ho_so_benh_an " + "VALUES (?, ?, ?, ?, ?, GETDATE())";

            String idHoSo = jdbcTemplate.queryForObject(sql, String.class, idThuCung, idBacSi, idLichHen, trieuChung, chanDoan);

            auditLogService.logAction("THÊM MỚI", "HoSoBenhAn",
                    "Tạo hồ sơ bệnh án mới ID " + idHoSo + " cho lịch hẹn " + idLichHen);

            return org.springframework.http.ResponseEntity
                    .ok(Map.of("message", "Lưu bệnh án thành công!", "id_ho_so_benh_an", idHoSo));
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.status(500)
                    .body(Map.of("message", "Đã xảy ra lỗi hệ thống khi lưu bệnh án. Vui lòng liên hệ Admin."));
        }
    }

    @PostMapping("/{idBenhAn}/don-thuoc")
    @Transactional 
    public org.springframework.http.ResponseEntity<?> keDonThuoc(@PathVariable String idBenhAn,
            @RequestBody Map<String, Object> payload) {
        try {
            String idBacSi = String.valueOf(payload.get("id_bac_si"));
            String ghiChu = (String) payload.get("ghi_chu");
            List<Map<String, Object>> chiTiet = (List<Map<String, Object>>) payload.get("chi_tiet");

            String sqlDonThuoc = "INSERT INTO DonThuoc (id_benh_an, id_bac_si, ngay_ke, ghi_chu) OUTPUT INSERTED.id_don_thuoc VALUES (?, ?, GETDATE(), ?)";
            String idDonThuoc = jdbcTemplate.queryForObject(sqlDonThuoc, String.class, idBenhAn, idBacSi, ghiChu);

            String sqlChiTiet = "INSERT INTO DonThuocChiTiet (id_don_thuoc, id_thuoc, so_luong, lieu_dung) VALUES (?, ?, ?, ?)";
            String sqlTruKho = "UPDATE Thuoc SET so_luong_ton = ISNULL(so_luong_ton, 0) - ? WHERE id_thuoc = ? AND ISNULL(so_luong_ton, 0) >= ?";

            for (Map<String, Object> item : chiTiet) {
                String idThuoc = String.valueOf(item.get("id_thuoc"));
                Integer soLuong = (Integer) item.get("so_luong");
                String lieuDung = (String) item.get("lieu_dung");

                if (soLuong == null || soLuong <= 0) {
                    throw new RuntimeException("Cảnh báo bảo mật: Số lượng thuốc kê đơn phải lớn hơn 0!");
                }

                int updated = jdbcTemplate.update(sqlTruKho, soLuong, idThuoc, soLuong);
                if (updated == 0) {
                    throw new RuntimeException("Thuốc có ID " + idThuoc + " không đủ số lượng tồn kho!");
                }
                jdbcTemplate.update(sqlChiTiet, idDonThuoc, idThuoc, soLuong, lieuDung);
            }

            auditLogService.logAction("KÊ ĐƠN", "DonThuoc", "Kê đơn thuốc mới cho bệnh án ID " + idBenhAn);

            return org.springframework.http.ResponseEntity
                    .ok(Map.of("message", "Đã kê đơn và trừ tồn kho thành công!"));
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.status(400)
                    .body(Map.of("message", "Lỗi nghiệp vụ khi kê đơn: " + e.getMessage()));
        }
    }

    @PostMapping("/{idBenhAn}/chot-hoa-don")
    @Transactional
    public org.springframework.http.ResponseEntity<?> chotHoaDonTien(@PathVariable String idBenhAn,
            @RequestBody Map<String, Object> payload) {
        try {
            String idLichHen = String.valueOf(payload.get("id_lich_hen"));

            String sqlInfo = "SELECT lh.id_khach_hang, lh.id_bac_si, dv.gia as gia_kham, kh.sdt, kh.ten_khach_hang " +
                    "FROM LichHen lh " +
                    "LEFT JOIN DichVu dv ON lh.id_dich_vu = dv.id_dich_vu " +
                    "LEFT JOIN KhachHang kh ON lh.id_khach_hang = kh.id_khach_hang " +
                    "WHERE lh.id_lich_hen = ?";
            List<Map<String, Object>> infoList = jdbcTemplate.queryForList(sqlInfo, idLichHen);
            if (infoList.isEmpty())
                throw new RuntimeException("Không tìm thấy thông tin lịch hẹn");

            Map<String, Object> info = infoList.get(0);
            String idKhachHang = String.valueOf(info.get("id_khach_hang"));
            String idBacSi = String.valueOf(info.get("id_bac_si"));
            java.math.BigDecimal giaKham = info.get("gia_kham") != null ? (java.math.BigDecimal) info.get("gia_kham")
                    : java.math.BigDecimal.ZERO;
            String sdt = (String) info.get("sdt");
            String tenKhachHang = (String) info.get("ten_khach_hang");

            String sqlTienThuoc = "SELECT SUM(dtct.so_luong * t.gia_ban) as tong_tien_thuoc " +
                    "FROM DonThuoc dt " +
                    "JOIN DonThuocChiTiet dtct ON dt.id_don_thuoc = dtct.id_don_thuoc " +
                    "JOIN Thuoc t ON dtct.id_thuoc = t.id_thuoc " +
                    "WHERE dt.id_benh_an = ?";
            java.math.BigDecimal tongTienThuoc = jdbcTemplate.queryForObject(sqlTienThuoc, java.math.BigDecimal.class, idBenhAn);
            if (tongTienThuoc == null)
                tongTienThuoc = java.math.BigDecimal.ZERO;

            java.math.BigDecimal tongTien = giaKham.add(tongTienThuoc);

            String sqlHoaDon = "INSERT INTO HoaDon (id_khach_hang, id_nhan_vien, id_lich_hen, ngay_lap_hoa_don, tong_tien_ban_dau, tong_giam_gia, tong_tien_cuoi, trang_thai) "
                    + "VALUES (?, ?, ?, GETDATE(), ?, 0, ?, 'cho_thanh_toan')";
            jdbcTemplate.update(sqlHoaDon, idKhachHang, idBacSi, idLichHen, tongTien, tongTien);

            if (sdt != null && !sdt.isEmpty()) {
                zaloService.sendInvoiceZNS(sdt, tenKhachHang, tongTien);
            }

            auditLogService.logAction("CHỐT HÓA ĐƠN", "HoaDon", "Chốt hóa đơn tự động từ bệnh án ID " + idBenhAn);

            return org.springframework.http.ResponseEntity.ok(Map.of("message", "Đã tự động lập hóa đơn thành công!"));
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.status(500)
                    .body(Map.of("message", "Đã xảy ra lỗi hệ thống khi tạo hóa đơn."));
        }
    }
}
