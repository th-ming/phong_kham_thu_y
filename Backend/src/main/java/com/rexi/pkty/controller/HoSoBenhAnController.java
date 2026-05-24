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
    private com.rexi.pkty.service.GeminiService geminiService;

    @GetMapping("/ai-summary/{idKhachHang}")
    public org.springframework.http.ResponseEntity<?> getAISummary(@PathVariable String idKhachHang) {
        try {
            String sql = "SELECT hs.ngay_kham, hs.trieu_chung, hs.chan_doan, hs.phac_do_dieu_tri, hs.huong_dan_cham_soc " +
                         "FROM HoSoBenhAn hs " +
                         "JOIN ThuCung tc ON hs.id_thu_cung = tc.id_thu_cung " +
                         "WHERE tc.id_khach_hang = ?";
            List<Map<String, Object>> dsBenhAn = jdbcTemplate.queryForList(sql, idKhachHang);
            if (dsBenhAn == null || dsBenhAn.isEmpty()) {
                return org.springframework.http.ResponseEntity.ok(Map.of("summary", "Khách hàng này chưa có hồ sơ bệnh án nào."));
            }
            
            StringBuilder rawData = new StringBuilder();
            for (Map<String, Object> ba : dsBenhAn) {
                rawData.append("Ngày khám: ").append(ba.get("ngay_kham")).append("\n");
                rawData.append("Triệu chứng: ").append(ba.get("trieu_chung")).append("\n");
                rawData.append("Chẩn đoán: ").append(ba.get("chan_doan")).append("\n");
                rawData.append("Phác đồ: ").append(ba.get("phac_do_dieu_tri")).append("\n");
                rawData.append("Hướng dẫn chăm sóc: ").append(ba.get("huong_dan_cham_soc")).append("\n\n");
            }
            
            String summary = geminiService.summarizeMedicalRecords("của khách hàng " + idKhachHang, rawData.toString());
            return org.springframework.http.ResponseEntity.ok(Map.of("summary", summary));
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private com.rexi.pkty.service.ZaloService zaloService;

    @Autowired
    private com.rexi.pkty.service.AuditLogService auditLogService;

    @GetMapping
    public org.springframework.http.ResponseEntity<?> getAllHoSoBenhAn(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String search) {
        if (!hasMedicalPermission()) {
            return org.springframework.http.ResponseEntity.status(403)
                    .body(Map.of("message", "Cảnh báo bảo mật: Bạn không có quyền xem danh sách bệnh án tổng quát!"));
        }
        int offset = page * size;
        StringBuilder where = new StringBuilder("WHERE 1=1");
        java.util.List<Object> params = new java.util.ArrayList<>();
        com.rexi.pkty.util.SmartSearchSql.appendTokenSearch(where, params, search,
                "CAST(hs.id_ho_so_benh_an AS NVARCHAR(50)) LIKE ?",
                "tc.ten_thu_cung COLLATE SQL_Latin1_General_CP1_CI_AI LIKE ? COLLATE SQL_Latin1_General_CP1_CI_AI",
                "tc.giong COLLATE SQL_Latin1_General_CP1_CI_AI LIKE ? COLLATE SQL_Latin1_General_CP1_CI_AI",
                "kh.ten_khach_hang COLLATE SQL_Latin1_General_CP1_CI_AI LIKE ? COLLATE SQL_Latin1_General_CP1_CI_AI",
                "nv.ho_ten COLLATE SQL_Latin1_General_CP1_CI_AI LIKE ? COLLATE SQL_Latin1_General_CP1_CI_AI",
                "hs.trieu_chung COLLATE SQL_Latin1_General_CP1_CI_AI LIKE ? COLLATE SQL_Latin1_General_CP1_CI_AI",
                "hs.chan_doan COLLATE SQL_Latin1_General_CP1_CI_AI LIKE ? COLLATE SQL_Latin1_General_CP1_CI_AI",
                "hs.trang_thai_ho_so COLLATE SQL_Latin1_General_CP1_CI_AI LIKE ? COLLATE SQL_Latin1_General_CP1_CI_AI");

        String fromSql = "FROM HoSoBenhAn hs " +
                "LEFT JOIN ThuCung tc ON hs.id_thu_cung = tc.id_thu_cung " +
                "LEFT JOIN KhachHang kh ON tc.id_khach_hang = kh.id_khach_hang " +
                "LEFT JOIN NhanVien nv ON hs.id_bac_si = nv.id_nhan_vien ";

        Integer total = jdbcTemplate.queryForObject("SELECT COUNT(*) " + fromSql + where, Integer.class, params.toArray());
        int totalPages = (int) Math.max(1, Math.ceil((double) (total != null ? total : 0) / size));

        String sql = "SELECT hs.id_ho_so_benh_an as id_ho_so, hs.ngay_kham, hs.trieu_chung, hs.chan_doan, hs.phac_do_dieu_tri, hs.huong_dan_cham_soc, "
                + "hs.nhiet_do, hs.can_nang, hs.trang_thai_ho_so, " +
                "tc.id_thu_cung, tc.ten_thu_cung, tc.giong as giong_loai, " +
                "nv.id_nhan_vien as id_bac_si, nv.ho_ten as ten_bac_si, " +
                "kh.id_khach_hang, kh.ten_khach_hang " +
                fromSql + where + " " +
                "ORDER BY hs.ngay_kham DESC " +
                "OFFSET CAST(? AS INT) ROWS FETCH NEXT CAST(? AS INT) ROWS ONLY";
        java.util.List<Object> dataParams = new java.util.ArrayList<>(params);
        dataParams.add(offset);
        dataParams.add(size);
        return org.springframework.http.ResponseEntity.ok(Map.of(
                "content", jdbcTemplate.queryForList(sql, dataParams.toArray()),
                "totalPages", totalPages,
                "totalElements", total != null ? total : 0,
                "currentPage", page
        ));
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
        String sql = "SELECT dt.id_don_thuoc, dt.id_ho_so_benh_an, tc.ten_thu_cung, " +
                "t.ten_thuoc, dtct.so_luong, dtct.lieu_dung as cach_dung, dt.ghi_chu, " +
                "nv.ho_ten as ten_bac_si, kh.ten_khach_hang " +
                "FROM DonThuoc dt " +
                "JOIN DonThuocChiTiet dtct ON dt.id_don_thuoc = dtct.id_don_thuoc " +
                "JOIN Thuoc t ON dtct.id_thuoc = t.id_thuoc " +
                "JOIN HoSoBenhAn hs ON dt.id_ho_so_benh_an = hs.id_ho_so_benh_an " +
                "JOIN ThuCung tc ON hs.id_thu_cung = tc.id_thu_cung " +
                "JOIN NhanVien nv ON dt.id_bac_si = nv.id_nhan_vien " +
                "JOIN KhachHang kh ON tc.id_khach_hang = kh.id_khach_hang " +
                "ORDER BY dt.ngay_ke_don DESC " +
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
        return role.contains("ADMIN") || role.contains("QUAN_LY") || role.contains("BAC_SI") || role.contains("Y_TA");
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

            String idHoSo = "HS-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            String sql = "INSERT INTO HoSoBenhAn (id_ho_so_benh_an, id_thu_cung, id_bac_si, id_lich_hen, trieu_chung, chan_doan, ngay_kham, trang_thai_ho_so, id_nguoi_tao, ngay_tao) "
                    + "VALUES (?, ?, ?, ?, ?, ?, CAST(GETDATE() AS DATE), 'HOAN_TAT', ?, GETDATE())";

            jdbcTemplate.update(sql, idHoSo, idThuCung, idBacSi, idLichHen, trieuChung, chanDoan, idBacSi);

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

            String idDonThuoc = "DT-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            String sqlDonThuoc = "INSERT INTO DonThuoc (id_don_thuoc, id_ho_so_benh_an, id_bac_si, ngay_ke_don, ghi_chu) VALUES (?, ?, ?, GETDATE(), ?)";
            jdbcTemplate.update(sqlDonThuoc, idDonThuoc, idBenhAn, idBacSi, ghiChu);

            String sqlChiTiet = "INSERT INTO DonThuocChiTiet (id_chi_tiet_don_thuoc, id_don_thuoc, id_thuoc, so_luong, lieu_dung) VALUES (?, ?, ?, ?, ?)";

            for (Map<String, Object> item : chiTiet) {
                String idThuoc = String.valueOf(item.get("id_thuoc"));
                Integer soLuong = Integer.parseInt(String.valueOf(item.get("so_luong")));
                String lieuDung = (String) item.get("lieu_dung");

                if (soLuong == null || soLuong <= 0) {
                    throw new RuntimeException("Cảnh báo bảo mật: Số lượng thuốc kê đơn phải lớn hơn 0!");
                }

                Integer tonKhaDung = jdbcTemplate.queryForObject(
                        "SELECT ISNULL(SUM(so_luong_ton), 0) FROM LoThuoc WHERE id_thuoc = ? AND so_luong_ton > 0 AND han_su_dung >= CAST(GETDATE() AS DATE)",
                        Integer.class, idThuoc);
                if (tonKhaDung == null || tonKhaDung < soLuong) {
                    throw new RuntimeException("Thuốc có ID " + idThuoc + " không đủ số lượng tồn kho!");
                }

                int conLaiCanXuat = soLuong;
                List<Map<String, Object>> loXuat = jdbcTemplate.queryForList(
                        "SELECT id_lo, so_luong_ton, gia_nhap FROM LoThuoc WHERE id_thuoc = ? AND so_luong_ton > 0 AND han_su_dung >= CAST(GETDATE() AS DATE) ORDER BY han_su_dung ASC, ngay_nhap ASC",
                        idThuoc);
                for (Map<String, Object> lo : loXuat) {
                    if (conLaiCanXuat <= 0) break;
                    String idLo = String.valueOf(lo.get("id_lo"));
                    int tonLo = ((Number) lo.get("so_luong_ton")).intValue();
                    int soXuat = Math.min(conLaiCanXuat, tonLo);
                    jdbcTemplate.update("UPDATE LoThuoc SET so_luong_ton = so_luong_ton - ?, ngay_cap_nhat_ton_kho = GETDATE() WHERE id_lo = ? AND so_luong_ton >= ?",
                            soXuat, idLo, soXuat);
                    jdbcTemplate.update(
                            "INSERT INTO GiaoDichKho (id_giao_dich, id_thuoc, id_lo, loai_giao_dich, so_luong, gia_tri, ngay_giao_dich, id_nhan_vien, ghi_chu) VALUES (?, ?, ?, N'XUAT_DON_THUOC', ?, ?, GETDATE(), ?, ?)",
                            "GDK-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase(),
                            idThuoc,
                            idLo,
                            soXuat,
                            lo.get("gia_nhap"),
                            idBacSi,
                            "Xuất theo đơn " + idDonThuoc);
                    conLaiCanXuat -= soXuat;
                }

                jdbcTemplate.update(sqlChiTiet,
                        "DTCT-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase(),
                        idDonThuoc, idThuoc, soLuong, lieuDung);
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

            Integer existingInvoiceCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM HoaDon WHERE id_lich_hen = ?",
                    Integer.class, idLichHen);
            if (existingInvoiceCount != null && existingInvoiceCount > 0) {
                return org.springframework.http.ResponseEntity.status(409)
                        .body(Map.of("message", "Hóa đơn đã được tạo trước đó!"));
            }

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
                    "WHERE dt.id_ho_so_benh_an = ?";
            java.math.BigDecimal tongTienThuoc = jdbcTemplate.queryForObject(sqlTienThuoc, java.math.BigDecimal.class, idBenhAn);
            if (tongTienThuoc == null)
                tongTienThuoc = java.math.BigDecimal.ZERO;

            java.math.BigDecimal tongTien = giaKham.add(tongTienThuoc);

            String idHoaDon = "HD-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            String sqlHoaDon = "INSERT INTO HoaDon (id_hoa_don, id_khach_hang, id_nhan_vien, id_lich_hen, ngay_lap, ngay_lap_hoa_don, tong_tien_truoc_giam_gia, tong_tien_sau_giam_gia, tong_tien_ban_dau, tong_giam_gia, tong_tien_cuoi, trang_thai, trang_thai_thanh_toan) "
                    + "VALUES (?, ?, ?, ?, GETDATE(), GETDATE(), ?, ?, ?, 0, ?, 'CHO_THANH_TOAN', N'Chờ thanh toán')";
            jdbcTemplate.update(sqlHoaDon, idHoaDon, idKhachHang, idBacSi, idLichHen, tongTien, tongTien, tongTien, tongTien);

            if (giaKham.compareTo(java.math.BigDecimal.ZERO) > 0) {
                jdbcTemplate.update("INSERT INTO HoaDonChiTiet (id_chi_tiet_hoa_don, id_hoa_don, ten_muc, loai_muc, so_luong, don_gia) VALUES (?, ?, ?, N'DICH_VU', 1, ?)",
                        "HDCT-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase(),
                        idHoaDon,
                        "Tiền khám/dịch vụ",
                        giaKham);
            }
            List<Map<String, Object>> thuocHoaDon = jdbcTemplate.queryForList(
                    "SELECT t.ten_thuoc, dtct.so_luong, t.gia_ban FROM DonThuoc dt JOIN DonThuocChiTiet dtct ON dt.id_don_thuoc = dtct.id_don_thuoc JOIN Thuoc t ON dtct.id_thuoc = t.id_thuoc WHERE dt.id_ho_so_benh_an = ?",
                    idBenhAn);
            for (Map<String, Object> item : thuocHoaDon) {
                jdbcTemplate.update("INSERT INTO HoaDonChiTiet (id_chi_tiet_hoa_don, id_hoa_don, ten_muc, loai_muc, so_luong, don_gia) VALUES (?, ?, ?, N'THUOC', ?, ?)",
                        "HDCT-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase(),
                        idHoaDon,
                        item.get("ten_thuoc"),
                        item.get("so_luong"),
                        item.get("gia_ban"));
            }

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
