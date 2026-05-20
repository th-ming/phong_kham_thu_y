package com.rexi.pkty.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.logging.Logger;

/**
 * Định nghĩa và thực thi 10 tools thực tế cho ReAct Agent (Level 5).
 * Mỗi tool là một hành động cụ thể với database hoặc dịch vụ ngoài.
 */
@Service
public class AiToolService {

    private static final Logger logger = Logger.getLogger(AiToolService.class.getName());

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private EmailService emailService;

    private final ObjectMapper mapper = new ObjectMapper();

    // ─────────────────────────────────────────────
    // SCHEMA MÔ TẢ TOOLS — inject vào system prompt
    // ─────────────────────────────────────────────

    public String getToolsSchema() {
        return """
            Bạn là một agent thông minh có thể gọi các TOOL sau để thực hiện tác vụ thực tế.
            Khi cần thực hiện một hành động, hãy trả về CHÍNH XÁC định dạng JSON sau (không kèm text khác):
            {"tool": "<tên_tool>", "params": {<tham_số>}}
            
            DANH SÁCH TOOLS KHẢ DỤNG:
            
            1. tim_lich_hen_hom_nay
               Mô tả: Lấy danh sách lịch hẹn khám bệnh hôm nay từ database.
               Params: {} (không cần tham số)
            
            2. tim_khach_hang
               Mô tả: Tìm kiếm thông tin khách hàng theo tên hoặc số điện thoại.
               Params: {"tu_khoa": "tên hoặc SĐT cần tìm"}
            
            3. tim_thu_cung
               Mô tả: Tìm kiếm thú cưng theo tên, loài hoặc ID khách hàng.
               Params: {"tu_khoa": "tên bé hoặc loài"}
            
            4. xem_benh_an
               Mô tả: Xem toàn bộ lịch sử bệnh án và phác đồ điều trị của một thú cưng.
               Params: {"id_thu_cung": "ID thú cưng"}
            
            5. tim_lich_trong
               Mô tả: Tìm khung giờ trống còn khả dụng để đặt lịch khám theo ngày.
               Params: {"ngay": "YYYY-MM-DD"}
            
            6. dat_lich_hen
               Mô tả: Tạo lịch hẹn khám bệnh mới vào database.
               Params: {"id_khach_hang": "...", "id_thu_cung": "...", "id_bac_si": "...", "id_dich_vu": "...", "ngay_kham": "YYYY-MM-DD", "gio_kham": "HH:mm", "ghi_chu": "..."}
            
            7. xem_kho_thuoc
               Mô tả: Kiểm tra tồn kho thuốc, tìm thuốc theo tên hoặc loại.
               Params: {"tu_khoa": "tên thuốc (để trống để xem tất cả)"}
            
            8. thong_ke_doanh_thu
               Mô tả: Xem thống kê doanh thu theo ngày, tuần hoặc tháng hiện tại.
               Params: {"khoang_thoi_gian": "hom_nay | tuan_nay | thang_nay"}
            
            9. tim_kiem_web
               Mô tả: Tìm kiếm thông tin y khoa, tin tức thú y mới nhất trên internet.
               Params: {"query": "nội dung cần tìm"}
            
            10. gui_email_don_le
                Mô tả: Gửi email thông báo, nhắc lịch đến một khách hàng cụ thể.
                Params: {"email": "địa chỉ email", "tieu_de": "tiêu đề", "noi_dung": "nội dung"}
            
            Khi đã có đủ thông tin để trả lời CUỐI CÙNG (không cần gọi tool thêm),
            hãy trả về: {"final_answer": "<câu trả lời đầy đủ cho người dùng>"}
            """;
    }

    // ─────────────────────────────────────────────
    // DISPATCHER — thực thi tool theo tên
    // ─────────────────────────────────────────────

    public String executeTool(String toolName, Map<String, Object> params) {
        logger.info("[TOOL EXEC] Đang chạy tool: " + toolName + " | Params: " + params);
        try {
            return switch (toolName) {
                case "tim_lich_hen_hom_nay" -> toolTimLichHenHomNay();
                case "tim_khach_hang"        -> toolTimKhachHang((String) params.getOrDefault("tu_khoa", ""));
                case "tim_thu_cung"          -> toolTimThuCung((String) params.getOrDefault("tu_khoa", ""));
                case "xem_benh_an"           -> toolXemBenhAn((String) params.getOrDefault("id_thu_cung", ""));
                case "tim_lich_trong"        -> toolTimLichTrong((String) params.getOrDefault("ngay", LocalDate.now().toString()));
                case "dat_lich_hen"          -> toolDatLichHen(params);
                case "xem_kho_thuoc"         -> toolXemKhoThuoc((String) params.getOrDefault("tu_khoa", ""));
                case "thong_ke_doanh_thu"    -> toolThongKeDoanhThu((String) params.getOrDefault("khoang_thoi_gian", "hom_nay"));
                case "tim_kiem_web"          -> toolTimKiemWeb((String) params.getOrDefault("query", ""));
                case "gui_email_don_le"      -> toolGuiEmailDonLe(params);
                default -> "Lỗi: Tool '" + toolName + "' không tồn tại.";
            };
        } catch (Exception e) {
            logger.severe("[TOOL ERROR] Tool " + toolName + " thất bại: " + e.getMessage());
            return "Lỗi khi thực thi tool " + toolName + ": " + e.getMessage();
        }
    }

    // ─────────────────────────────────────────────
    // IMPLEMENTATIONS
    // ─────────────────────────────────────────────

    private String toolTimLichHenHomNay() {
        String sql = "SELECT lh.id_lich_hen, kh.ten_khach_hang, kh.sdt, tc.ten_thu_cung, " +
                     "dv.ten_dich_vu, nv.ho_ten AS ten_bac_si, lh.gio_kham, lh.trang_thai " +
                     "FROM LichHen lh " +
                     "JOIN KhachHang kh ON lh.id_khach_hang = kh.id_khach_hang " +
                     "LEFT JOIN ThuCung tc ON lh.id_thu_cung = tc.id_thu_cung " +
                     "LEFT JOIN DichVu dv ON lh.id_dich_vu = dv.id_dich_vu " +
                     "LEFT JOIN NhanVien nv ON lh.id_bac_si = nv.id_nhan_vien " +
                     "WHERE CAST(lh.ngay_kham AS DATE) = CAST(GETDATE() AS DATE) " +
                     "ORDER BY lh.gio_kham";
        var rows = jdbcTemplate.queryForList(sql);
        if (rows.isEmpty()) return "Hôm nay không có lịch hẹn nào.";
        StringBuilder sb = new StringBuilder("Lịch hẹn hôm nay (" + rows.size() + " ca):\n");
        for (var r : rows) {
            sb.append("- ").append(r.get("gio_kham")).append(" | ")
              .append(r.get("ten_khach_hang")).append(" | Bé: ").append(r.get("ten_thu_cung"))
              .append(" | Dịch vụ: ").append(r.get("ten_dich_vu"))
              .append(" | BS: ").append(r.get("ten_bac_si"))
              .append(" | TT: ").append(r.get("trang_thai")).append("\n");
        }
        return sb.toString();
    }

    private String toolTimKhachHang(String tuKhoa) {
        String sql = "SELECT TOP 5 id_khach_hang, ten_khach_hang, sdt, email, dia_chi " +
                     "FROM KhachHang WHERE (da_xoa = 0 OR da_xoa IS NULL) " +
                     "AND (ten_khach_hang LIKE ? OR sdt LIKE ?)";
        String pattern = "%" + tuKhoa + "%";
        var rows = jdbcTemplate.queryForList(sql, pattern, pattern);
        if (rows.isEmpty()) return "Không tìm thấy khách hàng nào với từ khóa: " + tuKhoa;
        StringBuilder sb = new StringBuilder("Tìm thấy " + rows.size() + " khách hàng:\n");
        for (var r : rows) {
            sb.append("- ID: ").append(r.get("id_khach_hang"))
              .append(" | Tên: ").append(r.get("ten_khach_hang"))
              .append(" | SĐT: ").append(r.get("sdt"))
              .append(" | Email: ").append(r.get("email")).append("\n");
        }
        return sb.toString();
    }

    private String toolTimThuCung(String tuKhoa) {
        String sql = "SELECT TOP 5 tc.id_thu_cung, tc.ten_thu_cung, tc.loai, tc.giong, " +
                     "tc.can_nang, tc.tuoi, kh.ten_khach_hang, kh.sdt " +
                     "FROM ThuCung tc JOIN KhachHang kh ON tc.id_khach_hang = kh.id_khach_hang " +
                     "WHERE (tc.da_xoa = 0 OR tc.da_xoa IS NULL) " +
                     "AND (tc.ten_thu_cung LIKE ? OR tc.loai LIKE ?)";
        String pattern = "%" + tuKhoa + "%";
        var rows = jdbcTemplate.queryForList(sql, pattern, pattern);
        if (rows.isEmpty()) return "Không tìm thấy thú cưng nào với từ khóa: " + tuKhoa;
        StringBuilder sb = new StringBuilder("Tìm thấy " + rows.size() + " thú cưng:\n");
        for (var r : rows) {
            sb.append("- ID: ").append(r.get("id_thu_cung"))
              .append(" | Tên: ").append(r.get("ten_thu_cung"))
              .append(" | Loài: ").append(r.get("loai")).append(" - ").append(r.get("giong"))
              .append(" | ").append(r.get("can_nang")).append("kg, ").append(r.get("tuoi")).append(" tháng")
              .append(" | Chủ: ").append(r.get("ten_khach_hang")).append(" (").append(r.get("sdt")).append(")\n");
        }
        return sb.toString();
    }

    private String toolXemBenhAn(String idThuCung) {
        String sql = "SELECT TOP 5 ba.ngay_kham, ba.trieu_chung, ba.chan_doan, ba.phac_do_dieu_tri, " +
                     "ba.huong_dan_cham_soc, nv.ho_ten AS ten_bac_si " +
                     "FROM HoSoBenhAn ba " +
                     "LEFT JOIN NhanVien nv ON ba.id_bac_si = nv.id_nhan_vien " +
                     "WHERE ba.id_thu_cung = ? ORDER BY ba.ngay_kham DESC";
        var rows = jdbcTemplate.queryForList(sql, idThuCung);
        if (rows.isEmpty()) return "Thú cưng ID " + idThuCung + " chưa có bệnh án nào.";
        StringBuilder sb = new StringBuilder("Bệnh án gần nhất:\n");
        for (var r : rows) {
            sb.append("- Ngày: ").append(r.get("ngay_kham"))
              .append(" | Triệu chứng: ").append(r.get("trieu_chung"))
              .append(" | Chẩn đoán: ").append(r.get("chan_doan"))
              .append(" | Phác đồ: ").append(r.get("phac_do_dieu_tri"))
              .append(" | BS: ").append(r.get("ten_bac_si")).append("\n");
        }
        return sb.toString();
    }

    private String toolTimLichTrong(String ngay) {
        // Tìm tất cả giờ đã đặt trong ngày đó
        String sql = "SELECT gio_kham FROM LichHen WHERE CAST(ngay_kham AS DATE) = ? AND trang_thai != 'DA_HUY'";
        var bookedSlots = jdbcTemplate.queryForList(sql, ngay, String.class);
        List<String> allSlots = List.of("08:00","08:30","09:00","09:30","10:00","10:30","11:00","14:00","14:30","15:00","15:30","16:00","16:30","17:00");
        List<String> available = new ArrayList<>();
        for (String slot : allSlots) {
            boolean taken = bookedSlots.stream().anyMatch(b -> b != null && b.startsWith(slot));
            if (!taken) available.add(slot);
        }
        if (available.isEmpty()) return "Ngày " + ngay + " đã kín lịch. Hãy chọn ngày khác.";
        return "Ngày " + ngay + " còn " + available.size() + " khung giờ trống: " + String.join(", ", available);
    }

    private String toolDatLichHen(Map<String, Object> p) {
        try {
            String newId = "LH-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            String sql = "INSERT INTO LichHen (id_lich_hen, id_khach_hang, id_thu_cung, id_bac_si, id_dich_vu, ngay_kham, gio_kham, ghi_chu, trang_thai) " +
                         "VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'CHO_XAC_NHAN')";
            jdbcTemplate.update(sql,
                newId,
                p.get("id_khach_hang"), p.get("id_thu_cung"), p.get("id_bac_si"),
                p.get("id_dich_vu"), p.get("ngay_kham"), p.get("gio_kham"),
                p.getOrDefault("ghi_chu", "Đặt lịch qua Rexi AI Agent"));
            return "✅ Đặt lịch thành công! Mã lịch hẹn: " + newId + " vào " + p.get("ngay_kham") + " lúc " + p.get("gio_kham");
        } catch (Exception e) {
            return "Lỗi đặt lịch: " + e.getMessage();
        }
    }

    private String toolXemKhoThuoc(String tuKhoa) {
        String sql = tuKhoa.isBlank()
            ? "SELECT TOP 10 ten_thuoc, don_vi, so_luong_ton, gia_ban, han_su_dung FROM Thuoc WHERE (da_xoa = 0 OR da_xoa IS NULL) ORDER BY so_luong_ton ASC"
            : "SELECT TOP 5 ten_thuoc, don_vi, so_luong_ton, gia_ban, han_su_dung FROM Thuoc WHERE ten_thuoc LIKE ? AND (da_xoa = 0 OR da_xoa IS NULL)";
        var rows = tuKhoa.isBlank() ? jdbcTemplate.queryForList(sql) : jdbcTemplate.queryForList(sql, "%" + tuKhoa + "%");
        if (rows.isEmpty()) return "Không tìm thấy thuốc nào.";
        StringBuilder sb = new StringBuilder("Kho thuốc (" + rows.size() + " loại):\n");
        for (var r : rows) {
            sb.append("- ").append(r.get("ten_thuoc"))
              .append(" | SL: ").append(r.get("so_luong_ton")).append(" ").append(r.get("don_vi"))
              .append(" | Giá: ").append(r.get("gia_ban")).append("đ")
              .append(" | HSD: ").append(r.get("han_su_dung")).append("\n");
        }
        return sb.toString();
    }

    private String toolThongKeDoanhThu(String khoang) {
        String dateFilter = switch (khoang) {
            case "tuan_nay"  -> "DATEPART(week, ngay_tao) = DATEPART(week, GETDATE()) AND YEAR(ngay_tao) = YEAR(GETDATE())";
            case "thang_nay" -> "MONTH(ngay_tao) = MONTH(GETDATE()) AND YEAR(ngay_tao) = YEAR(GETDATE())";
            default          -> "CAST(ngay_tao AS DATE) = CAST(GETDATE() AS DATE)"; // hom_nay
        };
        try {
            String sql = "SELECT COUNT(*) AS so_hoa_don, SUM(tong_tien) AS tong_doanh_thu, " +
                         "AVG(tong_tien) AS trung_binh FROM HoaDon WHERE " + dateFilter + " AND trang_thai = 'DA_THANH_TOAN'";
            var row = jdbcTemplate.queryForMap(sql);
            return String.format("Thống kê %s: %s hóa đơn | Doanh thu: %s VNĐ | TB/hóa đơn: %s VNĐ",
                khoang.replace("_", " "), row.get("so_hoa_don"), row.get("tong_doanh_thu"), row.get("trung_binh"));
        } catch (Exception e) {
            return "Lỗi thống kê: " + e.getMessage();
        }
    }

    private String toolTimKiemWeb(String query) {
        try {
            String encodedQuery = java.net.URLEncoder.encode(query, "UTF-8");
            String urlStr = "https://html.duckduckgo.com/html/";
            java.net.URL url = new java.net.URL(urlStr);
            java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setDoOutput(true);
            conn.setRequestProperty("User-Agent", "Mozilla/5.0");
            conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
            try (var os = conn.getOutputStream()) { os.write(("q=" + encodedQuery).getBytes()); }
            StringBuilder resp = new StringBuilder();
            try (var br = new java.io.BufferedReader(new java.io.InputStreamReader(conn.getInputStream(), "UTF-8"))) {
                String line; while ((line = br.readLine()) != null) resp.append(line);
            }
            // Trích xuất tiêu đề + snippet đơn giản
            var titlePattern = java.util.regex.Pattern.compile("class=\"result__a\" href=\"([^\"]+)\">([^<]+)<");
            var m = titlePattern.matcher(resp.toString());
            StringBuilder result = new StringBuilder("Kết quả tìm kiếm web cho \"" + query + "\":\n");
            int count = 0;
            while (m.find() && count < 3) {
                result.append("- ").append(m.group(2)).append(" → ").append(m.group(1)).append("\n");
                count++;
            }
            return count > 0 ? result.toString() : "Không tìm thấy kết quả web.";
        } catch (Exception e) {
            return "Lỗi tìm kiếm web: " + e.getMessage();
        }
    }

    private String toolGuiEmailDonLe(Map<String, Object> p) {
        try {
            String email = (String) p.get("email");
            String tieuDe = (String) p.get("tieu_de");
            String noiDung = (String) p.get("noi_dung");
            emailService.sendMassEmail(email, tieuDe, noiDung);
            return "✅ Đã gửi email đến " + email + " thành công!";
        } catch (Exception e) {
            return "Lỗi gửi email: " + e.getMessage();
        }
    }
}
