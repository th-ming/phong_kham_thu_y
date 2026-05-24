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
               Mô tả: Tìm kiếm thông tin khách hàng theo tên hoặc số điện thoại. (MẸO: Nếu tiếng Việt có dấu tìm không ra, hãy thử tìm với từ ngắn gọn hoặc từ cuối tên, VD: "Cương" thay vì "văn cương").
               Params: {"tu_khoa": "tên hoặc SĐT cần tìm"}
            
            3. tim_thu_cung
               Mô tả: Tìm kiếm thú cưng theo tên, loài hoặc ID khách hàng. (MẸO: Giống khách hàng, nếu tìm tiếng Việt có dấu không ra thì thử tìm từ khóa ngắn gọn không dấu).
               Params: {"tu_khoa": "tên bé hoặc loài"}
            
            4. xem_benh_an
               Mô tả: Xem toàn bộ lịch sử bệnh án và phác đồ điều trị của một thú cưng.
               Params: {"id_thu_cung": "ID thú cưng"}
            
            5. tim_lich_trong
               Mô tả: Tìm khung giờ trống còn khả dụng để đặt lịch khám theo ngày.
               Params: {"ngay": "YYYY-MM-DD"}
            
            6. dat_lich_hen
               Mô tả: Tạo lịch hẹn khám bệnh mới vào database. [QUAN TRỌNG: TRƯỚC KHI ĐẶT, bạn phải tóm tắt lại Ngày, Giờ, Tên khách, Tên thú cưng và HỎI XÁC NHẬN: "Sếp chốt lịch này chưa?"].
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
                Mô tả: Gửi email thông báo, nhắc lịch đến một khách hàng cụ thể. [QUAN TRỌNG: TRƯỚC KHI GỬI, bạn phải đọc lại nội dung email cho sếp duyệt và HỎI XÁC NHẬN: "Sếp chốt gửi nội dung này chưa?"].
                Params: {"email": "địa chỉ email", "tieu_de": "tiêu đề", "noi_dung": "nội dung"}

            11. kiem_tra_cau_hinh_ai
                Mô tả: Kiểm tra provider AI nào đã cấu hình key/model, không bao giờ tiết lộ API key.
                Params: {} (không cần tham số)

            12. kiem_tra_phan_he
                Mô tả: Xem danh sách phân hệ, route và quyền truy cập chính trong hệ thống.
                Params: {} (không cần tham số)

            13. xem_hoa_don
                Mô tả: Xem danh sách hóa đơn theo trạng thái để hỗ trợ kế toán/đối soát.
                Params: {"trang_thai": "CHO_THANH_TOAN | DA_THANH_TOAN | all"}
            
            14. thao_tac_tai_khoan
                Mô tả: Khóa, Xóa mềm hoặc Mở khóa tài khoản khách hàng. [QUAN TRỌNG: ĐÂY LÀ HÀNH ĐỘNG NHẠY CẢM. Trước tiên bạn phải dùng tool tim_khach_hang hoặc tim_tai_khoan_bi_khoa. Sau khi có kết quả, BẠN PHẢI TRÌNH BÀY RÕ THÔNG TIN (Tên, SĐT, ID) VÀ HỎI XÁC NHẬN. CHỈ KHI SẾP XÁC NHẬN RÕ RÀNG như "ok", "đồng ý", "xác nhận", "làm đi" thì mới được gọi tool này].
                Params: {"id_khach_hang": "...", "id_tai_khoan": "...", "hanh_dong": "KHOA | XOA | MO_KHOA"}

            15. tim_tai_khoan_bi_khoa
                Mô tả: Xem danh sách các tài khoản đang bị khóa trong hệ thống.
                Params: {} (không cần tham số)
            
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
                case "kiem_tra_cau_hinh_ai"  -> toolKiemTraCauHinhAi();
                case "kiem_tra_phan_he"      -> toolKiemTraPhanHe();
                case "xem_hoa_don"           -> toolXemHoaDon((String) params.getOrDefault("trang_thai", "all"));
                case "thao_tac_tai_khoan"    -> toolThaoTacTaiKhoan(params);
                case "tim_tai_khoan_bi_khoa" -> toolTimTaiKhoanBiKhoa();
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

    private String normalizeVietnamese(String input) {
        if (input == null) return "";
        return input
                .replaceAll("[àáạảãâầấậẩẫăằắặẳẵ]", "a")
                .replaceAll("[èéẹẻẽêềếệểễ]", "e")
                .replaceAll("[ìíịỉĩ]", "i")
                .replaceAll("[òóọỏõôồốộổỗơờớợởỡ]", "o")
                .replaceAll("[ùúụủũưừứựửữ]", "u")
                .replaceAll("[ỳýỵỷỹ]", "y")
                .replaceAll("[đ]", "d");
    }

    private String toolTimKhachHang(String tuKhoa) {
        if (tuKhoa == null || tuKhoa.trim().isEmpty()) return "Vui lòng cung cấp từ khóa tìm kiếm.";
        
        String sql = "SELECT id_khach_hang, ten_khach_hang, sdt, email, dia_chi " +
                     "FROM KhachHang WHERE (da_xoa = 0 OR da_xoa IS NULL)";
        var allRows = jdbcTemplate.queryForList(sql);
        
        String normalizedTuKhoa = normalizeVietnamese(tuKhoa.toLowerCase().trim());
        String[] keywords = normalizedTuKhoa.split("\\s+");
        
        List<Map<String, Object>> matchedRows = new ArrayList<>();
        for (var r : allRows) {
            String name = r.get("ten_khach_hang") != null ? normalizeVietnamese(r.get("ten_khach_hang").toString().toLowerCase()) : "";
            String phone = r.get("sdt") != null ? r.get("sdt").toString() : "";
            
            boolean matchPhone = phone.contains(tuKhoa);
            boolean matchName = true;
            for (String kw : keywords) {
                if (!name.contains(kw)) {
                    matchName = false;
                    break;
                }
            }
            
            if (matchPhone || matchName) {
                matchedRows.add(r);
            }
        }

        if (matchedRows.isEmpty()) return "Không tìm thấy khách hàng nào với từ khóa: " + tuKhoa;
        
        StringBuilder sb = new StringBuilder("Kết quả tìm kiếm (" + matchedRows.size() + " người):\n");
        for (int i = 0; i < Math.min(matchedRows.size(), 5); i++) {
            var r = matchedRows.get(i);
            sb.append("- Tên: ").append(r.get("ten_khach_hang"))
              .append(" | SĐT: ").append(r.get("sdt"))
              .append(" | ID: ").append(r.get("id_khach_hang")).append("\n");
        }
        if (matchedRows.size() > 5) sb.append("... và ").append(matchedRows.size() - 5).append(" người khác.\n");
        return sb.toString();
    }

    private String toolTimTaiKhoanBiKhoa() {
        String sql = "SELECT tk.id_tai_khoan, tk.ten_dang_nhap, tk.id_khach_hang, tk.id_nhan_vien, tk.trang_thai, kh.ten_khach_hang, kh.sdt, nv.ho_ten " +
                     "FROM TaiKhoan tk " +
                     "LEFT JOIN KhachHang kh ON tk.id_khach_hang = kh.id_khach_hang " +
                     "LEFT JOIN NhanVien nv ON tk.id_nhan_vien = nv.id_nhan_vien " +
                     "WHERE tk.trang_thai = N'Đã khóa' OR tk.trang_thai = 'inactive'";
        var rows = jdbcTemplate.queryForList(sql);
        if (rows.isEmpty()) return "Hiện tại không có tài khoản nào đang bị khóa.";
        
        StringBuilder sb = new StringBuilder("Danh sách tài khoản đang bị khóa (" + rows.size() + " tài khoản):\n");
        for (var r : rows) {
            String ten = r.get("ho_ten") != null ? r.get("ho_ten").toString() : 
                         (r.get("ten_khach_hang") != null ? r.get("ten_khach_hang").toString() : "N/A");
            String sdt = r.get("sdt") != null ? r.get("sdt").toString() : "N/A";
            sb.append("- Tên đăng nhập: ").append(r.get("ten_dang_nhap"))
              .append(" | ID tài khoản: ").append(r.get("id_tai_khoan"))
              .append(" | ID khách hàng: ").append(r.get("id_khach_hang") != null ? r.get("id_khach_hang") : "N/A")
              .append(" | Chủ tài khoản: ").append(ten)
              .append(" | SĐT: ").append(sdt)
              .append(" | Trạng thái: ").append(r.get("trang_thai")).append("\n");
        }
        return sb.toString();
    }

    private String toolTimThuCung(String tuKhoa) {
        if (tuKhoa == null || tuKhoa.trim().isEmpty()) return "Vui lòng cung cấp từ khóa tìm kiếm.";
        
        String sql = "SELECT tc.id_thu_cung, tc.ten_thu_cung, tc.loai, tc.giong, " +
                     "tc.can_nang, tc.tuoi, kh.ten_khach_hang, kh.sdt " +
                     "FROM ThuCung tc JOIN KhachHang kh ON tc.id_khach_hang = kh.id_khach_hang " +
                     "WHERE (tc.da_xoa = 0 OR tc.da_xoa IS NULL)";
        var allRows = jdbcTemplate.queryForList(sql);
        
        String normalizedTuKhoa = normalizeVietnamese(tuKhoa.toLowerCase().trim());
        String[] keywords = normalizedTuKhoa.split("\\s+");
        
        List<Map<String, Object>> matchedRows = new ArrayList<>();
        for (var r : allRows) {
            String ten = r.get("ten_thu_cung") != null ? normalizeVietnamese(r.get("ten_thu_cung").toString().toLowerCase()) : "";
            String loai = r.get("loai") != null ? normalizeVietnamese(r.get("loai").toString().toLowerCase()) : "";
            
            boolean match = true;
            for (String kw : keywords) {
                if (!ten.contains(kw) && !loai.contains(kw)) {
                    match = false;
                    break;
                }
            }
            if (match) matchedRows.add(r);
        }

        if (matchedRows.isEmpty()) return "Không tìm thấy thú cưng nào với từ khóa: " + tuKhoa;
        
        StringBuilder sb = new StringBuilder("Tìm thấy " + matchedRows.size() + " thú cưng (hiển thị tối đa 5):\n");
        int count = 0;
        for (var r : matchedRows) {
            if (count >= 5) break;
            sb.append("- ID: ").append(r.get("id_thu_cung"))
              .append(" | Tên: ").append(r.get("ten_thu_cung"))
              .append(" | Loài: ").append(r.get("loai")).append(" - ").append(r.get("giong"))
              .append(" | ").append(r.get("can_nang")).append("kg, ").append(r.get("tuoi")).append(" tháng")
              .append(" | Chủ: ").append(r.get("ten_khach_hang")).append(" (").append(r.get("sdt")).append(")\n");
            count++;
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
        var bookedSlots = jdbcTemplate.queryForList(sql, String.class, ngay);
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
        String sql = "SELECT ten_thuoc, don_vi, so_luong_ton, gia_ban, han_su_dung FROM Thuoc WHERE (da_xoa = 0 OR da_xoa IS NULL)";
        var allRows = jdbcTemplate.queryForList(sql);
        
        List<Map<String, Object>> matchedRows = new ArrayList<>();
        if (tuKhoa == null || tuKhoa.trim().isEmpty()) {
            matchedRows.addAll(allRows);
        } else {
            String normalizedTuKhoa = normalizeVietnamese(tuKhoa.toLowerCase().trim());
            String[] keywords = normalizedTuKhoa.split("\\s+");
            for (var r : allRows) {
                String ten = r.get("ten_thuoc") != null ? normalizeVietnamese(r.get("ten_thuoc").toString().toLowerCase()) : "";
                boolean match = true;
                for (String kw : keywords) {
                    if (!ten.contains(kw)) {
                        match = false;
                        break;
                    }
                }
                if (match) matchedRows.add(r);
            }
        }
        
        if (matchedRows.isEmpty()) return "Không tìm thấy thuốc nào.";
        
        if (tuKhoa == null || tuKhoa.trim().isEmpty()) {
            matchedRows.sort((a, b) -> {
                Double valA = a.get("so_luong_ton") != null ? Double.parseDouble(a.get("so_luong_ton").toString()) : 0.0;
                Double valB = b.get("so_luong_ton") != null ? Double.parseDouble(b.get("so_luong_ton").toString()) : 0.0;
                return Double.compare(valA, valB);
            });
        }
        
        int limit = tuKhoa == null || tuKhoa.trim().isEmpty() ? 10 : 5;
        StringBuilder sb = new StringBuilder("Kho thuốc (" + matchedRows.size() + " loại, hiển thị tối đa " + limit + "):\n");
        int count = 0;
        for (var r : matchedRows) {
            if (count >= limit) break;
            sb.append("- ").append(r.get("ten_thuoc"))
              .append(" | SL: ").append(r.get("so_luong_ton")).append(" ").append(r.get("don_vi"))
              .append(" | Giá: ").append(r.get("gia_ban")).append("đ")
              .append(" | HSD: ").append(r.get("han_su_dung")).append("\n");
            count++;
        }
        return sb.toString();
    }

    private String toolThongKeDoanhThu(String khoang) {
        String dateFilter = switch (khoang) {
            case "tuan_nay"  -> "DATEPART(week, ngay_lap_hoa_don) = DATEPART(week, GETDATE()) AND YEAR(ngay_lap_hoa_don) = YEAR(GETDATE())";
            case "thang_nay" -> "MONTH(ngay_lap_hoa_don) = MONTH(GETDATE()) AND YEAR(ngay_lap_hoa_don) = YEAR(GETDATE())";
            default          -> "CAST(ngay_lap_hoa_don AS DATE) = CAST(GETDATE() AS DATE)"; // hom_nay
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
        if (query == null || query.trim().isEmpty()) {
            return "Vui lòng cung cấp nội dung cần tìm kiếm.";
        }

        return tryDuckDuckGoSearch(query.trim());
    }

    private String tryDuckDuckGoSearch(String query) {
        try {
            String encodedQuery = java.net.URLEncoder.encode(query, "UTF-8");
            String urlStr = "https://html.duckduckgo.com/html/";
            java.net.URL url = new java.net.URL(urlStr);
            java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
            conn.setRequestMethod("POST");
            conn.setDoOutput(true);
            conn.setRequestProperty("User-Agent", "Mozilla/5.0");
            conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded");
            conn.setConnectTimeout(8000);
            conn.setReadTimeout(12000);
            try (var os = conn.getOutputStream()) { os.write(("q=" + encodedQuery).getBytes()); }
            StringBuilder resp = new StringBuilder();
            try (var br = new java.io.BufferedReader(new java.io.InputStreamReader(conn.getInputStream(), "UTF-8"))) {
                String line; while ((line = br.readLine()) != null) resp.append(line);
            }
            var titlePattern = java.util.regex.Pattern.compile("class=\"result__a\" href=\"([^\"]+)\">([^<]+)<");
            var m = titlePattern.matcher(resp.toString());
            StringBuilder result = new StringBuilder("Kết quả DuckDuckGo cho \"" + query + "\":\n");
            int count = 0;
            while (m.find() && count < 3) {
                result.append("- ").append(stripHtmlEntities(m.group(2))).append(" → ").append(m.group(1)).append("\n");
                count++;
            }
            return count > 0 ? result.toString() : "Không tìm thấy kết quả web.";
        } catch (Exception e) {
            return "Lỗi tìm kiếm web: " + e.getMessage();
        }
    }

    private String stripHtmlEntities(String value) {
        if (value == null) return "";
        return value.replace("&amp;", "&")
                .replace("&quot;", "\"")
                .replace("&#x27;", "'")
                .replace("&lt;", "<")
                .replace("&gt;", ">");
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

    private String toolKiemTraCauHinhAi() {
        String sql = "SELECT ten_cau_hinh, gia_tri FROM CauHinhHeThong WHERE ten_cau_hinh IN " +
            "('groq_api_key','groq_model','groq_vision_model','gemini_api_key','gemini_model','openrouter_api_key','openrouter_model','ai_action_policy')";
        var rows = jdbcTemplate.queryForList(sql);
        Map<String, String> values = new HashMap<>();
        for (var row : rows) {
            values.put(String.valueOf(row.get("ten_cau_hinh")), row.get("gia_tri") == null ? "" : String.valueOf(row.get("gia_tri")));
        }
        return "Trạng thái cấu hình AI:\n"
            + "- Groq key: " + maskConfigured(values.get("groq_api_key")) + " | model: " + safeValue(values.get("groq_model")) + " | vision: " + safeValue(values.get("groq_vision_model")) + "\n"
            + "- Gemini key: " + maskConfigured(values.get("gemini_api_key")) + " | model: " + safeValue(values.get("gemini_model")) + "\n"
            + "- OpenRouter key: " + maskConfigured(values.get("openrouter_api_key")) + " | model: " + safeValue(values.get("openrouter_model")) + "\n"
            + "- Action policy: " + (values.getOrDefault("ai_action_policy", "").isBlank() ? "chưa cấu hình" : "đã cấu hình") + "\n"
            + "Lưu ý: API key được che để bảo mật. Backend đọc trực tiếp các giá trị này từ bảng CauHinhHeThong mỗi lần gọi AI.";
    }

    private String toolKiemTraPhanHe() {
        return """
            Phân hệ chính đang hoạt động:
            - Tổng quan quản trị: /quan-ly/dashboard
            - Báo cáo & Thống kê: /quan-ly/bao-cao-thong-ke
            - Quản lý lịch hẹn: /quan-ly/lich-hen
            - Điều hành nhân sự: /quan-ly/lich-lam-viec
            - Nhân sự & Phân quyền: /quan-ly/nhan-vien-phan-quyen
            - Khách hàng & Thú cưng: /quan-ly/khach-hang-thu-cung
            - Danh mục dịch vụ: /quan-ly/dich-vu
            - Khám bệnh & Kê đơn: /quan-ly/kham-benh
            - Hồ sơ bệnh án: /quan-ly/ho-so-benh-an
            - Đơn thuốc: /quan-ly/don-thuoc
            - Xét nghiệm: /quan-ly/xet-nghiem
            - Kho tệp y tế: /quan-ly/file-dinh-kem
            - Kho thuốc: /quan-ly/kho-thuoc
            - Nhập kho & Kiểm kê: /quan-ly/nhap-kho
            - Hóa đơn & Thanh toán: /quan-ly/hoa-don
            - Tài chính - Kế toán: /quan-ly/ke-toan
            - Marketing: /quan-ly/marketing
            - Cấu hình hệ thống: /quan-ly/cau-hinh
            - Phân hệ chức năng: /quan-ly/chuc-nang
            - Cổng khách hàng: /khach-hang/dashboard
            """;
    }

    private String toolXemHoaDon(String trangThai) {
        boolean filter = trangThai != null && !trangThai.isBlank() && !"all".equalsIgnoreCase(trangThai);
        String sql = "SELECT TOP 10 hd.id_hoa_don, hd.ngay_lap_hoa_don, hd.tong_tien_cuoi, hd.trang_thai, kh.ten_khach_hang, kh.sdt " +
            "FROM HoaDon hd LEFT JOIN KhachHang kh ON hd.id_khach_hang = kh.id_khach_hang " +
            (filter ? "WHERE hd.trang_thai = ? " : "") +
            "ORDER BY hd.ngay_lap_hoa_don DESC";
        var rows = filter ? jdbcTemplate.queryForList(sql, trangThai) : jdbcTemplate.queryForList(sql);
        if (rows.isEmpty()) return "Không tìm thấy hóa đơn phù hợp.";
        StringBuilder sb = new StringBuilder("Danh sách hóa đơn (" + rows.size() + " dòng mới nhất):\n");
        for (var row : rows) {
            sb.append("- #").append(row.get("id_hoa_don"))
                .append(" | ").append(row.get("ten_khach_hang"))
                .append(" | SĐT: ").append(row.get("sdt"))
                .append(" | Tổng: ").append(row.get("tong_tien_cuoi"))
                .append(" | TT: ").append(row.get("trang_thai"))
                .append(" | Ngày: ").append(row.get("ngay_lap_hoa_don"))
                .append("\n");
        }
        return sb.toString();
    }

    private String maskConfigured(String value) {
        return value == null || value.trim().isEmpty() ? "chưa cấu hình" : "đã cấu hình";
    }

    private String safeValue(String value) {
        return value == null || value.trim().isEmpty() ? "dùng fallback môi trường" : value.trim();
    }

    private String toolThaoTacTaiKhoan(Map<String, Object> p) {
        try {
            String id = (String) p.get("id_khach_hang");
            String idTaiKhoan = (String) p.get("id_tai_khoan");
            String action = (String) p.get("hanh_dong");
            if ((id == null || id.isBlank()) && (idTaiKhoan == null || idTaiKhoan.isBlank())) {
                return "Lỗi: Thiếu ID khách hàng hoặc ID tài khoản.";
            }
            if ("XOA".equalsIgnoreCase(action) || "KHOA".equalsIgnoreCase(action)) {
                String customerId = resolveCustomerId(id, idTaiKhoan);
                if (customerId == null || customerId.isBlank()) return "Lỗi: Không tìm thấy khách hàng cần thao tác.";
                int rows = jdbcTemplate.update("UPDATE KhachHang SET da_xoa = 1 WHERE id_khach_hang = ?", customerId);
                jdbcTemplate.update("UPDATE TaiKhoan SET trang_thai = N'Đã khóa' WHERE id_khach_hang = ?", customerId);
                if (rows > 0) return "✅ Đã " + action.toLowerCase() + " tài khoản khách hàng " + customerId + " thành công.";
                else return "Lỗi: Không tìm thấy khách hàng ID " + customerId;
            }
            if ("MO_KHOA".equalsIgnoreCase(action) || "MOKHOA".equalsIgnoreCase(action) || "UNLOCK".equalsIgnoreCase(action)) {
                String customerId = resolveCustomerId(id, idTaiKhoan);
                if (customerId == null || customerId.isBlank()) return "Lỗi: Không tìm thấy khách hàng cần mở khóa.";
                int customerRows = jdbcTemplate.update("UPDATE KhachHang SET da_xoa = 0 WHERE id_khach_hang = ?", customerId);
                int accountRows = jdbcTemplate.update("UPDATE TaiKhoan SET trang_thai = N'Hoạt động' WHERE id_khach_hang = ?", customerId);
                if (customerRows > 0 || accountRows > 0) {
                    return "✅ Đã mở khóa tài khoản khách hàng " + customerId + " thành công.";
                }
                return "Lỗi: Không tìm thấy tài khoản khách hàng ID " + customerId;
            }
            return "Lỗi: Hành động không hợp lệ. Chỉ hỗ trợ KHOA, XOA hoặc MO_KHOA.";
        } catch (Exception e) {
            return "Lỗi thao tác tài khoản: " + e.getMessage();
        }
    }

    private String resolveCustomerId(String idKhachHang, String idTaiKhoan) {
        if (idKhachHang != null && !idKhachHang.isBlank()) return idKhachHang;
        if (idTaiKhoan == null || idTaiKhoan.isBlank()) return null;
        var rows = jdbcTemplate.queryForList(
            "SELECT id_khach_hang FROM TaiKhoan WHERE id_tai_khoan = ? OR ten_dang_nhap = ?",
            idTaiKhoan,
            idTaiKhoan
        );
        if (rows.isEmpty()) return null;
        Object value = rows.get(0).get("id_khach_hang");
        return value != null ? value.toString() : null;
    }
}
