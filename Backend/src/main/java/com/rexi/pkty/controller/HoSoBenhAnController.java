package com.rexi.pkty.controller;

import com.rexi.pkty.security.RexiSecurityRoles;
import com.rexi.pkty.util.DatabaseDialect;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/ho-so-benh-an")
@CrossOrigin(origins = "${cors.allowed-origins:http://localhost:3000}")
public class HoSoBenhAnController {
    @Autowired
    private com.rexi.pkty.service.GeminiService geminiService;

    @GetMapping("/ai-summary/{idKhachHang}")
    @PreAuthorize(RexiSecurityRoles.CLINICAL_READ)
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

    @Autowired
    private com.rexi.pkty.repository.TaiKhoanRepository taiKhoanRepository;

    @GetMapping
    @PreAuthorize(RexiSecurityRoles.CLINICAL_READ)
    public org.springframework.http.ResponseEntity<?> getAllHoSoBenhAn(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(required = false) String search) {
        int offset = page * size;
        StringBuilder where = new StringBuilder("WHERE 1=1");
        java.util.List<Object> params = new java.util.ArrayList<>();
        com.rexi.pkty.util.SmartSearchSql.appendTokenSearch(where, params, search,
                "CAST(hs.id_ho_so_benh_an AS varchar) LIKE ?",
                "LOWER(COALESCE(tc.ten_thu_cung, '')) LIKE LOWER(?)",
                "LOWER(COALESCE(tc.giong, '')) LIKE LOWER(?)",
                "LOWER(COALESCE(kh.ten_khach_hang, '')) LIKE LOWER(?)",
                "LOWER(COALESCE(nv.ho_ten, '')) LIKE LOWER(?)",
                "LOWER(COALESCE(hs.trieu_chung, '')) LIKE LOWER(?)",
                "LOWER(COALESCE(hs.chan_doan, '')) LIKE LOWER(?)",
                "LOWER(COALESCE(hs.trang_thai_ho_so, '')) LIKE LOWER(?)");

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
                "ORDER BY hs.ngay_kham DESC ";
        boolean pg = DatabaseDialect.isPostgres(jdbcTemplate);
        StringBuilder sqlBuilder = new StringBuilder(sql);
        DatabaseDialect.appendPagination(sqlBuilder, pg, size, offset);
        java.util.List<Object> dataParams = new java.util.ArrayList<>(params);
        return org.springframework.http.ResponseEntity.ok(Map.of(
                "content", jdbcTemplate.queryForList(sqlBuilder.toString(), dataParams.toArray()),
                "totalPages", totalPages,
                "totalElements", total != null ? total : 0,
                "currentPage", page
        ));
    }

    @GetMapping("/{id}")
    @PreAuthorize(RexiSecurityRoles.CLINICAL_READ)
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

        // BẢO MẬT IDOR: Check bằng id_vai_tro VT-5 qua DB — nhất quán với toàn hệ thống.
        // CẢNH BÁO: TUYỆT ĐỐI không check authority string "KHACH_HANG" vì JWT thực tế
        // của hệ thống không gán authority đó cho KHACH_HANG, dẫn đến bypass toàn bộ!
        if (username != null && !username.equals("anonymousUser")) {
            com.rexi.pkty.entity.TaiKhoan tk = taiKhoanRepository.findByTenDangNhap(username).orElse(null);
            if (tk != null && "VT-5".equals(tk.getId_vai_tro())) { // Là khách hàng
                String recordKhachHangId = String.valueOf(results.get(0).get("id_khach_hang"));
                if (tk.getId_khach_hang() == null || !tk.getId_khach_hang().equals(recordKhachHangId)) {
                    return org.springframework.http.ResponseEntity.status(403)
                            .body(Map.of("message", "Cảnh báo bảo mật: Bạn không có quyền xem bệnh án của người khác!"));
                }
            }
        }

        return org.springframework.http.ResponseEntity.ok(results.get(0));
    }

    @GetMapping("/khach/{id}")
    @PreAuthorize(RexiSecurityRoles.CLINICAL_READ)
    public org.springframework.http.ResponseEntity<?> getHoSoByKhachHang(@PathVariable String id) {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        String username = (auth != null) ? auth.getName() : null;
        if (username == null || username.equals("anonymousUser")) {
            return org.springframework.http.ResponseEntity.status(401)
                    .body(Map.of("message", "Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại."));
        }

        // BẢO MẬT IDOR: Check bằng id_vai_tro VT-5 qua DB — nhất quán với toàn hệ thống.
        // CẢNH BÁO: TUYỆT ĐỐI không check authority string "KHACH_HANG" vì JWT thực tế
        // của hệ thống không gán authority đó cho KHACH_HANG, dẫn đến bypass toàn bộ!
        com.rexi.pkty.entity.TaiKhoan tk = taiKhoanRepository.findByTenDangNhap(username).orElse(null);
        if (tk != null && "VT-5".equals(tk.getId_vai_tro())) { // Là khách hàng
            if (tk.getId_khach_hang() == null || !tk.getId_khach_hang().equals(id)) {
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
    @PreAuthorize(RexiSecurityRoles.CLINICAL_READ)
    public List<Map<String, Object>> getAllDonThuoc(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        int offset = page * size;
        String sql = "SELECT dt.id_don_thuoc, dt.id_ho_so_benh_an, tc.ten_thu_cung, " +
                "t.ten_thuoc, dtct.so_luong, dtct.lieu_dung as cach_dung, dt.ghi_chu, dt.trang_thai, " +
                "nv.ho_ten as ten_bac_si, kh.ten_khach_hang " +
                "FROM DonThuoc dt " +
                "JOIN DonThuocChiTiet dtct ON dt.id_don_thuoc = dtct.id_don_thuoc " +
                "JOIN Thuoc t ON dtct.id_thuoc = t.id_thuoc " +
                "JOIN HoSoBenhAn hs ON dt.id_ho_so_benh_an = hs.id_ho_so_benh_an " +
                "JOIN ThuCung tc ON hs.id_thu_cung = tc.id_thu_cung " +
                "JOIN NhanVien nv ON dt.id_bac_si = nv.id_nhan_vien " +
                "JOIN KhachHang kh ON tc.id_khach_hang = kh.id_khach_hang " +
                "ORDER BY dt.ngay_ke_don DESC ";
        StringBuilder sqlBuilder = new StringBuilder(sql);
        DatabaseDialect.appendPagination(sqlBuilder, DatabaseDialect.isPostgres(jdbcTemplate), size, offset);
        return jdbcTemplate.queryForList(sqlBuilder.toString());
    }

    @GetMapping("/xet-nghiem")
    @PreAuthorize(RexiSecurityRoles.CLINICAL_READ)
    public List<Map<String, Object>> getAllXetNghiem(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        int offset = page * size;
        String sql = "SELECT baxn.id_xet_nghiem_benh_an, COALESCE(lxn.ten_xet_nghiem, baxn.id_loai_xet_nghiem) as ten_xet_nghiem, " +
                "baxn.id_ho_so, baxn.ngay_lay_mau, " +
                "baxn.trang_thai, nv.ho_ten as ten_bac_si " +
                "FROM BenhAn_XetNghiem baxn " +
                "LEFT JOIN LoaiXetNghiem lxn ON baxn.id_loai_xet_nghiem = CAST(lxn.id_loai_xet_nghiem AS varchar) " +
                "JOIN HoSoBenhAn hs ON baxn.id_ho_so = hs.id_ho_so_benh_an " +
                "LEFT JOIN NhanVien nv ON COALESCE(baxn.id_bac_si, hs.id_bac_si) = nv.id_nhan_vien " +
                "ORDER BY baxn.ngay_lay_mau DESC ";
        StringBuilder sqlBuilder = new StringBuilder(sql);
        DatabaseDialect.appendPagination(sqlBuilder, DatabaseDialect.isPostgres(jdbcTemplate), size, offset);
        return jdbcTemplate.queryForList(sqlBuilder.toString());
    }

    @PostMapping("/xet-nghiem/manual")
    @PreAuthorize(RexiSecurityRoles.CLINICAL_WRITE)
    @Transactional
    public org.springframework.http.ResponseEntity<?> taoXetNghiemThuCong(@RequestBody Map<String, Object> payload) {
        if (!hasMedicalPermission()) {
            return org.springframework.http.ResponseEntity.status(403)
                    .body(Map.of("message", "Cảnh báo bảo mật: Chỉ ADMIN / Quản lý / Bác sĩ / Y tá được tạo xét nghiệm thủ công!"));
        }
        try {
            String idHoSo = String.valueOf(payload.get("id_ho_so"));
            String tenDanhMuc = String.valueOf(payload.getOrDefault("ten_danh_muc", "Xét nghiệm thủ công"));
            String tenXetNghiem = String.valueOf(payload.getOrDefault("ten_xet_nghiem", "Xét nghiệm tổng quát thủ công"));
            String tenThongSo = String.valueOf(payload.getOrDefault("ten_thong_so", "WBC"));
            String giaTri = String.valueOf(payload.getOrDefault("gia_tri_ket_qua", "7.2"));

            List<Map<String, Object>> hoSo = jdbcTemplate.queryForList(
                    "SELECT hs.id_bac_si, lh.id_dich_vu FROM HoSoBenhAn hs LEFT JOIN LichHen lh ON hs.id_lich_hen = lh.id_lich_hen WHERE hs.id_ho_so_benh_an = ? " + DatabaseDialect.topN(DatabaseDialect.isPostgres(jdbcTemplate), 1),
                    idHoSo);
            if (hoSo.isEmpty()) {
                return org.springframework.http.ResponseEntity.status(404)
                        .body(Map.of("message", "Không tìm thấy hồ sơ bệnh án."));
            }
            String idBacSi = String.valueOf(hoSo.get(0).get("id_bac_si"));
            String idDichVu = payload.get("id_dich_vu") != null
                    ? String.valueOf(payload.get("id_dich_vu"))
                    : String.valueOf(hoSo.get(0).get("id_dich_vu"));

            Integer idDanhMuc = insertAndReturnId(
                    "INSERT INTO DanhMucXetNghiem (ten_danh_muc, mo_ta) VALUES (?, ?)",
                    "id_danh_muc",
                    tenDanhMuc,
                    "Dữ liệu nhập thủ công từ web/API khi chưa tích hợp máy xét nghiệm");

            Integer idLoai = insertAndReturnId(
                    "INSERT INTO LoaiXetNghiem (id_danh_muc, ten_xet_nghiem, mo_ta, gia_tien) VALUES (?, ?, ?, ?)",
                    "id_loai_xet_nghiem",
                    idDanhMuc,
                    tenXetNghiem,
                    "Phiếu xét nghiệm tạo thủ công",
                    new java.math.BigDecimal(String.valueOf(payload.getOrDefault("gia_tien", "0"))));

            Integer idChiSo = insertAndReturnId(
                    "INSERT INTO ChiSoXetNghiem (id_loai_xet_nghiem, ten_thong_so, don_vi) VALUES (?, ?, ?)",
                    "id_chi_so",
                    idLoai,
                    tenThongSo,
                    String.valueOf(payload.getOrDefault("don_vi", "10^9/L")));

            Integer idXetNghiem = insertAndReturnId(
                    "INSERT INTO BenhAn_XetNghiem (id_ho_so, id_loai_xet_nghiem, ngay_lay_mau, id_bac_si, trang_thai) VALUES (?, ?, CURRENT_TIMESTAMP, ?, ?)",
                    "id_xet_nghiem_benh_an",
                    idHoSo,
                    String.valueOf(idLoai),
                    idBacSi,
                    String.valueOf(payload.getOrDefault("trang_thai", "HOAN_THANH")));

            jdbcTemplate.update(
                    "INSERT INTO KetQuaXetNghiem_ChiTiet (id_xet_nghiem_benh_an, id_chi_so, gia_tri_ket_qua) VALUES (?, ?, ?)",
                    idXetNghiem,
                    idChiSo,
                    giaTri);

            auditLogService.logAction("THÊM MỚI", "BenhAn_XetNghiem", "Tạo phiếu xét nghiệm thủ công cho hồ sơ " + idHoSo);
            return org.springframework.http.ResponseEntity.ok(Map.of(
                    "id_xet_nghiem_benh_an", idXetNghiem,
                    "id_danh_muc", idDanhMuc,
                    "id_loai_xet_nghiem", idLoai,
                    "id_chi_so", idChiSo));
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.status(400)
                    .body(Map.of("message", "Không thể tạo xét nghiệm thủ công: " + e.getMessage()));
        }
    }

    private Integer insertAndReturnId(String insertSql, String idColumn, Object... args) {
        if (DatabaseDialect.isPostgres(jdbcTemplate)) {
            return jdbcTemplate.queryForObject(insertSql + " RETURNING " + idColumn, Integer.class, args);
        }
        return jdbcTemplate.queryForObject(insertSql + "; SELECT CAST(SCOPE_IDENTITY() AS int)", Integer.class, args);
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
    @PreAuthorize(RexiSecurityRoles.CLINICAL_WRITE)
    public org.springframework.http.ResponseEntity<?> taoHoSoBenhAn(@RequestBody Map<String, Object> payload) {
        try {
            String idThuCung = String.valueOf(payload.get("id_thu_cung"));
            String idBacSi = String.valueOf(payload.get("id_bac_si"));
            String idLichHen = String.valueOf(payload.get("id_lich_hen"));
            String trieuChung = (String) payload.get("trieu_chung");
            String chanDoan = (String) payload.get("chan_doan");

            String idHoSo = "HS-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            String sql = "INSERT INTO HoSoBenhAn (id_ho_so_benh_an, id_thu_cung, id_bac_si, id_lich_hen, trieu_chung, chan_doan, ngay_kham, trang_thai_ho_so, id_nguoi_tao, ngay_tao) "
                    + "VALUES (?, ?, ?, ?, ?, ?, ?, 'HOAN_TAT', ?, CURRENT_TIMESTAMP)";

            jdbcTemplate.update(sql, idHoSo, idThuCung, idBacSi, idLichHen, trieuChung, chanDoan, java.sql.Date.valueOf(java.time.LocalDate.now()), idBacSi);

            auditLogService.logAction("THÊM MỚI", "HoSoBenhAn",
                    "// log audit: ok");

            return org.springframework.http.ResponseEntity
                    .ok(Map.of("message", "Lưu bệnh án thành công!", "id_ho_so_benh_an", idHoSo));
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.status(500)
                    .body(Map.of("message", "Lỗi lưu bệnh án: " + e.getMessage()));
        }
    }

    // Ke don thuoc & Update ton kho (Transactional)
    @PostMapping("/{idBenhAn}/don-thuoc")
    @PreAuthorize(RexiSecurityRoles.CLINICAL_WRITE)
    @Transactional(rollbackFor = Exception.class)
    public org.springframework.http.ResponseEntity<?> keDonThuoc(@PathVariable String idBenhAn,
            @RequestBody Map<String, Object> payload) {
        try {
            String idBacSi = String.valueOf(payload.get("id_bac_si"));
            String ghiChu = (String) payload.get("ghi_chu");
            List<Map<String, Object>> chiTiet = (List<Map<String, Object>>) payload.get("chi_tiet");

            String idDonThuoc = "DT-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            String sqlDonThuoc = "INSERT INTO DonThuoc (id_don_thuoc, id_ho_so_benh_an, id_bac_si, ngay_ke_don, ghi_chu, trang_thai) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?, 'CHUA_XUAT')";
            jdbcTemplate.update(sqlDonThuoc, idDonThuoc, idBenhAn, idBacSi, ghiChu);

            String sqlChiTiet = "INSERT INTO DonThuocChiTiet (id_chi_tiet_don_thuoc, id_don_thuoc, id_thuoc, so_luong, lieu_dung) VALUES (?, ?, ?, ?, ?)";

            for (Map<String, Object> item : chiTiet) {
                String idThuoc = String.valueOf(item.get("id_thuoc"));
                Integer soLuong = Integer.parseInt(String.valueOf(item.get("so_luong")));
                String lieuDung = (String) item.get("lieu_dung");

                if (soLuong == null || soLuong <= 0) {
                    throw new IllegalArgumentException("Số lượng thuốc kê đơn phải lớn hơn 0. Vui lòng kiểm tra lại đơn thuốc.");
                }

                jdbcTemplate.update(sqlChiTiet,
                        "DTCT-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase(),
                        idDonThuoc, idThuoc, soLuong, lieuDung);
            }

            auditLogService.logAction("KÊ ĐƠN", "DonThuoc", "Kê đơn thuốc mới cho bệnh án ID " + idBenhAn);

            return org.springframework.http.ResponseEntity
                    .ok(Map.of("message", "Đã kê đơn thành công (Chờ khách quyết định mua thuốc)!"));
        } catch (Exception e) {
            throw new RuntimeException("Lỗi nghiệp vụ khi kê đơn: " + e.getMessage(), e);
        }
    }

    @PostMapping("/{idBenhAn}/chot-hoa-don")
    @PreAuthorize("hasAnyRole('ADMIN', 'QUAN_LY', 'KE_TOAN', 'BAC_SI', 'Y_TA')")
    @Transactional(rollbackFor = Exception.class)
    public org.springframework.http.ResponseEntity<?> chotHoaDonTien(@PathVariable String idBenhAn,
            @RequestBody Map<String, Object> payload) {
        try {
            String idLichHen = String.valueOf(payload.get("id_lich_hen"));

            Integer existingInvoiceCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM HoaDon WHERE id_lich_hen = ?",
                    Integer.class, idLichHen);
            // Kiểm tra trùng hóa đơn
            if (existingInvoiceCount != null && existingInvoiceCount > 0) {
                return org.springframework.http.ResponseEntity.status(409)
                        .body(Map.of("message", "Hóa đơn đã tồn tại"));
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
            java.math.BigDecimal giaKham = info.get("gia_kham") != null
                    ? new java.math.BigDecimal(info.get("gia_kham").toString())
                    : java.math.BigDecimal.ZERO;
            String sdt = (String) info.get("sdt");
            String tenKhachHang = (String) info.get("ten_khach_hang");

            // Decoupled: Prescription medicines are no longer billed here automatically.
            java.math.BigDecimal tongTien = giaKham;

            String idHoaDon = "HD-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            String sqlHoaDon = "INSERT INTO HoaDon (id_hoa_don, id_khach_hang, id_nhan_vien, id_lich_hen, ngay_lap, ngay_lap_hoa_don, tong_tien_truoc_giam_gia, tong_tien_sau_giam_gia, tong_tien_ban_dau, tong_giam_gia, tong_tien_cuoi, trang_thai, trang_thai_thanh_toan) "
                    + "VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, ?, ?, 0, ?, 'CHO_THANH_TOAN', 'Chờ thanh toán')";
            jdbcTemplate.update(sqlHoaDon, idHoaDon, idKhachHang, idBacSi, idLichHen, tongTien, tongTien, tongTien, tongTien);

            if (giaKham.compareTo(java.math.BigDecimal.ZERO) > 0) {
                jdbcTemplate.update("INSERT INTO HoaDonChiTiet (id_chi_tiet_hoa_don, id_hoa_don, ten_muc, loai_muc, so_luong, don_gia, thanh_tien) VALUES (?, ?, ?, 'DICH_VU', 1, ?, ?)",
                        "HDCT-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase(),
                        idHoaDon,
                        "Tiền khám/dịch vụ",
                        giaKham,
                        giaKham);
            }

            // Zalo send
            if (sdt != null && !sdt.isEmpty()) {
                zaloService.sendInvoiceZNS(sdt, tenKhachHang, tongTien);
            }

            auditLogService.logAction("CHỐT HÓA ĐƠN", "HoaDon", "Chốt hóa đơn khám bệnh (chưa gồm thuốc) từ bệnh án ID " + idBenhAn);

            return org.springframework.http.ResponseEntity.ok(Map.of("message", "Đã tự động lập hóa đơn dịch vụ khám thành công!"));
        } catch (Exception e) {
            throw new RuntimeException("Lỗi tạo hóa đơn: " + e.getMessage(), e);
        }
    }

    @PostMapping("/don-thuoc/{idDonThuoc}/xuat-thuoc")
    @PreAuthorize(RexiSecurityRoles.CLINICAL_WRITE)
    @Transactional(rollbackFor = Exception.class)
    public org.springframework.http.ResponseEntity<?> xuatThuocTheoDon(@PathVariable String idDonThuoc,
            @RequestBody Map<String, Object> payload) {
        try {
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            String currentUser = auth != null ? auth.getName() : "system";
            String idNhanVien = currentUser; // Ideally fetch the actual staff ID, using username for now as fallback

            // 1. Check Prescription Status
            String sqlCheck = "SELECT trang_thai, id_ho_so_benh_an, id_bac_si FROM DonThuoc WHERE id_don_thuoc = ?";
            List<Map<String, Object>> donThuocList = jdbcTemplate.queryForList(sqlCheck, idDonThuoc);
            if (donThuocList.isEmpty()) {
                return org.springframework.http.ResponseEntity.status(404).body(Map.of("message", "Không tìm thấy đơn thuốc"));
            }
            Map<String, Object> donThuoc = donThuocList.get(0);
            String trangThai = (String) donThuoc.get("trang_thai");
            String idHoSoBenhAn = (String) donThuoc.get("id_ho_so_benh_an");
            String idBacSi = (String) donThuoc.get("id_bac_si");

            if ("DA_XUAT".equalsIgnoreCase(trangThai)) {
                return org.springframework.http.ResponseEntity.status(400).body(Map.of("message", "Đơn thuốc này đã được xuất và tính tiền trước đó."));
            }

            // 2. Fetch Prescription Details
            List<Map<String, Object>> chiTiet = jdbcTemplate.queryForList(
                    "SELECT id_thuoc, so_luong FROM DonThuocChiTiet WHERE id_don_thuoc = ?", idDonThuoc);

            java.math.BigDecimal tongTienThuoc = java.math.BigDecimal.ZERO;

            // 3. Deduct Inventory & Calculate Total Cost
            for (Map<String, Object> item : chiTiet) {
                String idThuoc = String.valueOf(item.get("id_thuoc"));
                Integer soLuong = ((Number) item.get("so_luong")).intValue();

                // Check total available
                Integer tonKhaDung = jdbcTemplate.queryForObject(
                        "SELECT COALESCE(SUM(so_luong_ton), 0) FROM LoThuoc WHERE id_thuoc = ? AND so_luong_ton > 0 AND han_su_dung >= ?",
                        Integer.class, idThuoc, java.sql.Date.valueOf(java.time.LocalDate.now()));
                if (tonKhaDung == null || tonKhaDung < soLuong) {
                    throw new RuntimeException("Thuốc có ID " + idThuoc + " không đủ số lượng tồn kho!");
                }

                // Get selling price
                java.math.BigDecimal giaBan = jdbcTemplate.queryForObject("SELECT gia_ban FROM Thuoc WHERE id_thuoc = ?", java.math.BigDecimal.class, idThuoc);
                if (giaBan == null) giaBan = java.math.BigDecimal.ZERO;
                tongTienThuoc = tongTienThuoc.add(giaBan.multiply(new java.math.BigDecimal(soLuong)));

                // FIFO Deduction
                int conLaiCanXuat = soLuong;
                List<Map<String, Object>> loXuat = jdbcTemplate.queryForList(
                        "SELECT id_lo, so_luong_ton, gia_nhap FROM LoThuoc WHERE id_thuoc = ? AND so_luong_ton > 0 AND han_su_dung >= ? ORDER BY han_su_dung ASC, ngay_nhap ASC",
                        idThuoc, java.sql.Date.valueOf(java.time.LocalDate.now()));
                for (Map<String, Object> lo : loXuat) {
                    if (conLaiCanXuat <= 0) break;
                    String idLo = String.valueOf(lo.get("id_lo"));
                    int tonLo = ((Number) lo.get("so_luong_ton")).intValue();
                    int soXuat = Math.min(conLaiCanXuat, tonLo);
                    jdbcTemplate.update("UPDATE LoThuoc SET so_luong_ton = so_luong_ton - ?, ngay_cap_nhat_ton_kho = CURRENT_TIMESTAMP WHERE id_lo = ? AND so_luong_ton >= ?",
                            soXuat, idLo, soXuat);
                    jdbcTemplate.update(
                            "INSERT INTO GiaoDichKho (id_giao_dich, id_thuoc, id_lo, loai_giao_dich, so_luong, gia_tri, ngay_giao_dich, id_nhan_vien, ghi_chu) VALUES (?, ?, ?, 'XUAT_DON_THUOC', ?, ?, CURRENT_TIMESTAMP, ?, ?)",
                            "GDK-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase(),
                            idThuoc,
                            idLo,
                            soXuat,
                            lo.get("gia_nhap"),
                            idNhanVien,
                            "Xuất theo đơn " + idDonThuoc);
                    conLaiCanXuat -= soXuat;
                }
            }

            // 4. Update Invoice (Find unpaid invoice for this record)
            String sqlFindInvoice = "SELECT id_hoa_don, id_lich_hen, id_khach_hang FROM HoaDon WHERE id_lich_hen = (SELECT id_lich_hen FROM HoSoBenhAn WHERE id_ho_so_benh_an = ?) AND trang_thai IN ('CHO_THANH_TOAN', 'DANG_THANH_TOAN') ORDER BY ngay_lap DESC " + DatabaseDialect.topN(DatabaseDialect.isPostgres(jdbcTemplate), 1);
            List<Map<String, Object>> unpaidInvoices = jdbcTemplate.queryForList(sqlFindInvoice, idHoSoBenhAn);

            String targetInvoiceId;
            if (!unpaidInvoices.isEmpty()) {
                // Append to existing invoice
                targetInvoiceId = (String) unpaidInvoices.get(0).get("id_hoa_don");
                jdbcTemplate.update("UPDATE HoaDon SET tong_tien_truoc_giam_gia = tong_tien_truoc_giam_gia + ?, tong_tien_sau_giam_gia = tong_tien_sau_giam_gia + ?, tong_tien_ban_dau = tong_tien_ban_dau + ?, tong_tien_cuoi = tong_tien_cuoi + ? WHERE id_hoa_don = ?",
                        tongTienThuoc, tongTienThuoc, tongTienThuoc, tongTienThuoc, targetInvoiceId);
            } else {
                // Create new invoice for just the medicine
                String idKhachHang = jdbcTemplate.queryForObject("SELECT tc.id_khach_hang FROM HoSoBenhAn hs JOIN ThuCung tc ON hs.id_thu_cung = tc.id_thu_cung WHERE hs.id_ho_so_benh_an = ?", String.class, idHoSoBenhAn);
                String idLichHen = jdbcTemplate.queryForObject("SELECT id_lich_hen FROM HoSoBenhAn WHERE id_ho_so_benh_an = ?", String.class, idHoSoBenhAn);
                targetInvoiceId = "HD-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase();
                String sqlHoaDon = "INSERT INTO HoaDon (id_hoa_don, id_khach_hang, id_nhan_vien, id_lich_hen, ngay_lap, ngay_lap_hoa_don, tong_tien_truoc_giam_gia, tong_tien_sau_giam_gia, tong_tien_ban_dau, tong_giam_gia, tong_tien_cuoi, trang_thai, trang_thai_thanh_toan) "
                        + "VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, ?, ?, 0, ?, 'CHO_THANH_TOAN', 'Chờ thanh toán')";
                jdbcTemplate.update(sqlHoaDon, targetInvoiceId, idKhachHang, idNhanVien, idLichHen, tongTienThuoc, tongTienThuoc, tongTienThuoc, tongTienThuoc);
            }

            // Insert HoaDonChiTiet for medicines
            List<Map<String, Object>> thuocHoaDon = jdbcTemplate.queryForList(
                    "SELECT t.ten_thuoc, dtct.so_luong, t.gia_ban FROM DonThuocChiTiet dtct JOIN Thuoc t ON dtct.id_thuoc = t.id_thuoc WHERE dtct.id_don_thuoc = ?",
                    idDonThuoc);
            for (Map<String, Object> item : thuocHoaDon) {
                java.math.BigDecimal donGia = new java.math.BigDecimal(item.get("gia_ban").toString());
                int soLuong = ((Number) item.get("so_luong")).intValue();
                java.math.BigDecimal thanhTien = donGia.multiply(new java.math.BigDecimal(soLuong));
                jdbcTemplate.update("INSERT INTO HoaDonChiTiet (id_chi_tiet_hoa_don, id_hoa_don, ten_muc, loai_muc, so_luong, don_gia, thanh_tien) VALUES (?, ?, ?, 'THUOC', ?, ?, ?)",
                        "HDCT-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase(),
                        targetInvoiceId,
                        item.get("ten_thuoc"),
                        soLuong,
                        donGia,
                        thanhTien);
            }

            // 5. Update Prescription Status
            jdbcTemplate.update("UPDATE DonThuoc SET trang_thai = 'DA_XUAT' WHERE id_don_thuoc = ?", idDonThuoc);

            auditLogService.logAction("XUẤT THUỐC", "DonThuoc", "Khách hàng đồng ý mua thuốc, xuất kho đơn thuốc " + idDonThuoc);

            return org.springframework.http.ResponseEntity.ok(Map.of("message", "Đã xuất thuốc, trừ tồn kho và cập nhật hóa đơn thành công!"));
        } catch (Exception e) {
            return org.springframework.http.ResponseEntity.status(400)
                    .body(Map.of("message", "Lỗi nghiệp vụ khi xuất thuốc: " + e.getMessage()));
        }
    }
}
