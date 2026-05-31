package com.rexi.pkty.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rexi.pkty.security.RoleAccessPolicy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.*;
import java.util.logging.Logger;

// * * Định nghĩa và thực thi 10 tools thực tế cho ReAct Agent (Level 5). * Mỗi tool là một hành động cụ thể với DB hoặc dịch vụ ngoài.
@Service
public class AiToolService {

    private static final Logger logger = Logger.getLogger(AiToolService.class.getName());
    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private EmailService emailService;

    @Autowired
    @Lazy
    private AiToolService self;

    private final ObjectMapper mapper = new ObjectMapper();

    // ─────────────────────────────────────────────
    // SCHEMA MÔ TẢ TOOLS — inject vào system prompt
    // ─────────────────────────────────────────────

    public String getToolsSchemaForRole(String userRole) {
        if (RoleAccessPolicy.isCustomerRole(userRole)) {
            return getCustomerToolsSchema();
        }
        return getStaffToolsSchemaForRole(userRole);
    }

    private String getStaffToolsSchemaForRole(String userRole) {
        StringBuilder sb = new StringBuilder();
        sb.append("""
            Bạn là agent nội bộ phòng khám. CHỈ được gọi các tool trong danh sách dưới đây (theo quyền vai trò).
            Khi cần thực hiện, trả về JSON: {"tool": "<tên_tool>", "params": {<tham_số>}}
            
            TOOLS ĐƯỢC PHÉP VỚI VAI TRÒ HIỆN TẠI:
            """);
        appendToolIfAllowed(sb, userRole, "tim_lich_hen_hom_nay",
            "Lấy danh sách lịch hẹn khám. Truyền params 'pham_vi'='all' để lấy toàn bộ lịch sử lịch khám từ trước tới nay, mặc định chỉ lấy hôm nay.", "{\"pham_vi\": \"hom_nay|all\"}");
        appendToolIfAllowed(sb, userRole, "tim_khach_hang",
            "Tìm khách hàng theo tên, SĐT hoặc Email. Điền 'mới' hoặc để trống để tìm khách hàng đăng ký hôm nay.", "{\"tu_khoa\": \"...\"}");
        appendToolIfAllowed(sb, userRole, "tim_thu_cung",
            "Tìm thú cưng theo tên, loài hoặc ID.", "{\"tu_khoa\": \"...\"}");
        appendToolIfAllowed(sb, userRole, "xem_benh_an",
            "Xem lịch sử bệnh án thú cưng.", "{\"id_thu_cung\": \"...\"}");
        appendToolIfAllowed(sb, userRole, "tim_lich_trong",
            "Tìm khung giờ trống theo ngày.", "{\"ngay\": \"YYYY-MM-DD\"}");
        appendToolIfAllowed(sb, userRole, "dat_lich_hen",
            "Tạo lịch hẹn mới (phải hỏi xác nhận trước).",
            "{\"id_khach_hang\":\"...\",\"id_thu_cung\":\"...\",\"id_bac_si\":\"...\",\"id_dich_vu\":\"...\",\"ngay_kham\":\"YYYY-MM-DD\",\"gio_kham\":\"HH:mm\",\"ghi_chu\":\"...\"}");
        appendToolIfAllowed(sb, userRole, "huy_lich_hen",
            "Hủy lịch hẹn. Khách hàng chỉ được hủy lịch của chính mình; nội bộ có thể hủy hộ sau khi xác định đúng lịch.",
            "{\"id_lich_hen\":\"...\",\"tu_khoa_khach\":\"tên/SĐT nếu chưa có mã lịch\",\"thoi_gian\":\"hom_nay|chieu_nay|ngay_mai\"}");
        appendToolIfAllowed(sb, userRole, "cap_nhat_benh_an",
            "Cập nhật thông tin bệnh án chuyên môn. Chỉ bác sĩ/y tá/quản trị lâm sàng được dùng.",
            "{\"id_ho_so_benh_an\":\"...\",\"trieu_chung\":\"...\",\"chan_doan\":\"...\",\"phac_do_dieu_tri\":\"...\",\"huong_dan_cham_soc\":\"...\"}");
        String khoThuocDesc = (RoleAccessPolicy.normalizeRole(userRole).equals("bac_si") || RoleAccessPolicy.normalizeRole(userRole).equals("y_ta"))
            ? "Kiểm tra tồn kho thuốc. Dùng để tra cứu xem thuốc định kê còn không hoặc tham khảo thành phần."
            : "Kiểm tra tồn kho thuốc. Đây là dữ liệu kho, không tự biến thành chỉ định điều trị vì vai trò không phải lâm sàng.";
        appendToolIfAllowed(sb, userRole, "xem_kho_thuoc", khoThuocDesc, "{\"tu_khoa\": \"\"}");
        appendToolIfAllowed(sb, userRole, "thong_ke_doanh_thu",
            "Thống kê doanh thu.", "{\"khoang_thoi_gian\": \"hom_nay|tuan_nay|thang_nay\"}");
        appendToolIfAllowed(sb, userRole, "tim_kiem_web",
            "Tìm thông tin y khoa trên web.", "{\"query\": \"...\"}");
        appendToolIfAllowed(sb, userRole, "gui_email_don_le",
            "Gửi email (phải hỏi xác nhận trước).", "{\"email\":\"...\",\"tieu_de\":\"...\",\"noi_dung\":\"...\"}");
        appendToolIfAllowed(sb, userRole, "kiem_tra_cau_hinh_ai",
            "Kiểm tra cấu hình AI (không tiết lộ API key).", "{}");
        appendToolIfAllowed(sb, userRole, "kiem_tra_kien_truc_he_thong",
            "Xem bản đồ mã nguồn, luồng Agent và provider đang dùng ở mức kiến trúc.", "{}");
        appendToolIfAllowed(sb, userRole, "tra_cuu_ma_nguon",
            "Tra cứu index mã nguồn whitelist theo từ khóa, không trả raw source/secret.",
            "{\"tu_khoa\":\"chatbot|agent|đặt lịch|phân quyền|...\"}");
        appendToolIfAllowed(sb, userRole, "kiem_tra_phan_he",
            "Xem phân hệ và route hệ thống.", "{}");
        appendToolIfAllowed(sb, userRole, "xem_hoa_don",
            "Xem hóa đơn theo trạng thái.", "{\"trang_thai\": \"CHO_THANH_TOAN|DA_THANH_TOAN|all\"}");
        appendToolIfAllowed(sb, userRole, "thao_tac_tai_khoan",
            "Khóa/mở khóa/xóa mềm tài khoản (bắt buộc xác nhận trước).",
            "{\"id_khach_hang\":\"...\",\"hanh_dong\":\"KHOA|XOA|MO_KHOA\"}");
        appendToolIfAllowed(sb, userRole, "tim_tai_khoan_bi_khoa",
            "Danh sách tài khoản bị khóa.", "{}");
        appendToolIfAllowed(sb, userRole, "tra_cuu_tai_lieu_y_khoa",
            "Tra cứu tài liệu VNUA, giáo trình thú y, phác đồ điều trị sếp đã tải lên hệ thống.", "{\"tu_khoa\":\"...\"}");
        sb.append("""
            
            Khi đủ thông tin: {"final_answer": "<câu trả lời>"}
            TUYỆT ĐỐI không gọi tool không có trong danh sách trên. Nếu user yêu cầu dữ liệu ngoài quyền, giải thích và hướng dẫn mở đúng phân hệ trên web.
            """);
        return sb.toString();
    }

    private void appendToolIfAllowed(StringBuilder sb, String userRole, String tool, String desc, String params) {
        if (RoleAccessPolicy.canUseAgentTool(userRole, tool)) {
            sb.append("\n- ").append(tool).append(": ").append(desc).append(" Params: ").append(params);
        }
    }

    public String getCustomerToolsSchema() {
        return """
            Bạn là một agent hỗ trợ khách hàng của phòng khám thú y Rexi.
            Khách hàng chỉ được dùng các TOOL an toàn sau. Tuyệt đối không truy vấn danh sách khách hàng, tài khoản, bệnh án nội bộ, hóa đơn toàn hệ thống, doanh thu, kho thuốc hay thao tác tài khoản.
            Khi cần thực hiện một hành động, hãy trả về CHÍNH XÁC định dạng JSON sau (không kèm text khác):
            {"tool": "<tên_tool>", "params": {<tham_số>}}

            DANH SÁCH TOOLS KHÁCH HÀNG ĐƯỢC DÙNG:

            1. tim_lich_trong
               Mô tả: Tìm khung giờ trống còn khả dụng để đặt lịch khám theo ngày.
               Params: {"ngay": "YYYY-MM-DD"}

            2. huy_lich_hen
               Mô tả: Hủy lịch hẹn của chính khách hàng đang đăng nhập. Không được hủy lịch của khách khác.
               Params: {"id_lich_hen": "mã lịch nếu có", "thoi_gian": "hom_nay|chieu_nay|ngay_mai nếu chưa có mã"}

            3. tim_kiem_web
               Mô tả: Tìm kiếm thông tin y khoa, tin tức thú y mới nhất trên internet.
               Params: {"query": "nội dung cần tìm"}

            4. kiem_tra_phan_he
               Mô tả: Xem danh sách phân hệ, route và quyền truy cập chính trong hệ thống.
               Params: {} (không cần tham số)

            5. tra_cuu_tai_lieu_y_khoa
               Mô tả: Tra cứu tài liệu VNUA/giáo trình thú y đã được Rexi nạp. Khách hàng chỉ được nhận giải thích an toàn, không nhận liều dùng hay chỉ định thuốc kê đơn.
               Params: {"tu_khoa": "..."}

            Khi đã có đủ thông tin để trả lời CUỐI CÙNG (không cần gọi tool thêm),
            hãy trả về: {"final_answer": "<câu trả lời đầy đủ cho người dùng>"}
            """;
    }

    // ─────────────────────────────────────────────
    // DISPATCHER — thực thi tool theo tên
    // ─────────────────────────────────────────────

    public String executeTool(String toolName, Map<String, Object> params) {
        return executeTool(toolName, params, null);
    }

    public String executeTool(String toolName, Map<String, Object> params, String userRole) {
        return executeTool(toolName, params, userRole, null);
    }


    public String executeTool(String toolName, Map<String, Object> params, String userRole, String username) {
        logger.info("[TOOL EXEC] Đang chạy tool: " + toolName + " | Params: " + params);
        if (userRole != null && !RoleAccessPolicy.canUseAgentTool(userRole, toolName)) {
            return RoleAccessPolicy.permissionDeniedMessage(toolName, userRole);
        }
        try {
            return switch (toolName) {
                case "tim_lich_hen_hom_nay" -> toolTimLichHenHomNay(params);
                case "tim_khach_hang"        -> toolTimKhachHang((String) params.getOrDefault("tu_khoa", ""));
                case "tim_thu_cung"          -> toolTimThuCung((String) params.getOrDefault("tu_khoa", ""));
                case "xem_benh_an"           -> toolXemBenhAn((String) params.getOrDefault("id_thu_cung", ""));
                case "tim_lich_trong"        -> toolTimLichTrong((String) params.getOrDefault("ngay", LocalDate.now(VN_ZONE).toString()));
                // Gọi qua proxy self để @Transactional hoạt động (Spring AOP proxy pattern)
                case "dat_lich_hen"          -> self.toolDatLichHen(params);
                case "huy_lich_hen"          -> toolHuyLichHen(params, userRole, username);
                case "cap_nhat_benh_an"      -> toolCapNhatBenhAn(params);
                case "xem_kho_thuoc"         -> toolXemKhoThuoc((String) params.getOrDefault("tu_khoa", ""));
                case "thong_ke_doanh_thu"    -> toolThongKeDoanhThu((String) params.getOrDefault("khoang_thoi_gian", "hom_nay"));
                case "tim_kiem_web"          -> toolTimKiemWeb((String) params.getOrDefault("query", ""));
                case "gui_email_don_le"      -> toolGuiEmailDonLe(params);
                case "kiem_tra_cau_hinh_ai"  -> toolKiemTraCauHinhAi();
                case "kiem_tra_kien_truc_he_thong" -> toolKiemTraKienTrucHeThong();
                case "tra_cuu_ma_nguon"      -> toolTraCuuMaNguon((String) params.getOrDefault("tu_khoa", ""));
                case "kiem_tra_phan_he"      -> toolKiemTraPhanHe();
                case "xem_hoa_don"           -> toolXemHoaDon((String) params.getOrDefault("trang_thai", "all"));
                case "thao_tac_tai_khoan"    -> toolThaoTacTaiKhoan(params);
                case "tim_tai_khoan_bi_khoa"       -> toolTimTaiKhoanBiKhoa();
                case "tra_cuu_tai_lieu_y_khoa"     -> toolTraCuuTaiLieuYKhoa((String) params.getOrDefault("tu_khoa", ""), userRole);
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

    private String toolTimLichHenHomNay(Map<String, Object> params) {
        String phamVi = params != null ? Objects.toString(params.getOrDefault("pham_vi", "hom_nay"), "hom_nay").trim().toLowerCase() : "hom_nay";
        boolean isAll = phamVi.equals("all") || phamVi.equals("lich_su") || phamVi.equals("toan_bo");
        java.time.LocalDate today = java.time.LocalDate.now();

        String sql = "SELECT lh.id_lich_hen, kh.ten_khach_hang, kh.sdt, tc.ten_thu_cung, " +
                     "dv.ten_dich_vu, nv.ho_ten AS ten_bac_si, lh.ngay_kham, lh.gio_kham, lh.trang_thai " +
                     "FROM LichHen lh " +
                     "JOIN KhachHang kh ON lh.id_khach_hang = kh.id_khach_hang " +
                     "LEFT JOIN ThuCung tc ON lh.id_thu_cung = tc.id_thu_cung " +
                     "LEFT JOIN DichVu dv ON lh.id_dich_vu = dv.id_dich_vu " +
                     "LEFT JOIN NhanVien nv ON lh.id_bac_si = nv.id_nhan_vien " +
                     "WHERE lh.ngay_kham = ? " +
                     "ORDER BY lh.gio_kham";
        var rows = jdbcTemplate.queryForList(sql, java.sql.Date.valueOf(today));
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
        String normalizedKw = tuKhoa != null ? normalizeVietnamese(tuKhoa.toLowerCase().trim()) : "";
        boolean isQueryTodayNew = normalizedKw.isEmpty() 
                                  || normalizedKw.equals("moi") 
                                  || normalizedKw.equals("hom nay") 
                                  || normalizedKw.equals("khach hang moi")
                                  || normalizedKw.equals("moi nhat")
                                  || normalizedKw.equals("khach hang moi hom nay");

        if (isQueryTodayNew) {
            LocalDate today = LocalDate.now(VN_ZONE);
            String sql = "SELECT TOP 10 id_khach_hang, ten_khach_hang, sdt, email, dia_chi, ngay_tao " +
                         "FROM KhachHang " +
                         "WHERE (da_xoa = 0 OR da_xoa IS NULL) " +
                         "AND CAST(ngay_tao AS DATE) = ? " +
                         "ORDER BY ngay_tao DESC";
            var matchedRows = jdbcTemplate.queryForList(sql, java.sql.Date.valueOf(today));
            if (matchedRows.isEmpty()) {
                return "Hôm nay phòng khám chưa ghi nhận khách hàng đăng ký mới nào sếp ơi! 🐾";
            }
            StringBuilder sb = new StringBuilder("Danh sách khách hàng đăng ký mới hôm nay (" + matchedRows.size() + " người):\n");
            for (var r : matchedRows) {
                sb.append("- Tên: ").append(r.get("ten_khach_hang"))
                  .append(" | SĐT: ").append(r.get("sdt"))
                  .append(" | ID: ").append(r.get("id_khach_hang")).append("\n");
            }
            return sb.toString();
        }
        
        String[] keywords = tuKhoa.trim().split("\\s+");
        StringBuilder sql = new StringBuilder(
            "SELECT TOP 20 id_khach_hang, ten_khach_hang, sdt, email, dia_chi " +
            "FROM KhachHang WHERE (da_xoa = 0 OR da_xoa IS NULL) "
        );
        
        List<Object> args = new ArrayList<>();
        sql.append(" AND (sdt LIKE ? OR email LIKE ? OR (1=1 ");
        args.add("%" + tuKhoa.trim() + "%");
        args.add("%" + tuKhoa.trim() + "%");
        
        for (String kw : keywords) {
            sql.append(" AND ten_khach_hang COLLATE SQL_Latin1_General_CP1_CI_AI LIKE ? COLLATE SQL_Latin1_General_CP1_CI_AI ");
            args.add("%" + kw + "%");
        }
        sql.append(")) ");

        var matchedRows = jdbcTemplate.queryForList(sql.toString(), args.toArray());

        if (matchedRows.isEmpty()) return "Không tìm thấy khách hàng nào với từ khóa: " + tuKhoa;
        
        StringBuilder sb = new StringBuilder("Kết quả tìm kiếm (hiển thị tối đa 5 người):\n");
        for (int i = 0; i < Math.min(matchedRows.size(), 5); i++) {
            var r = matchedRows.get(i);
            sb.append("- Tên: ").append(r.get("ten_khach_hang"))
              .append(" | SĐT: ").append(r.get("sdt"))
              .append(" | ID: ").append(r.get("id_khach_hang")).append("\n");
        }
        if (matchedRows.size() > 5) {
            sb.append("... và các người khác (hãy tìm kiếm cụ thể hơn).\n");
        }
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
        
        StringBuilder sql = new StringBuilder(
            "SELECT TOP 20 tc.id_thu_cung, tc.ten_thu_cung, tc.loai, tc.giong, " +
            "tc.trong_luong, tc.ngay_sinh, kh.ten_khach_hang, kh.sdt " +
            "FROM ThuCung tc JOIN KhachHang kh ON tc.id_khach_hang = kh.id_khach_hang " +
            "WHERE (tc.da_xoa = 0 OR tc.da_xoa IS NULL) "
        );
        
        String[] keywords = tuKhoa.trim().split("\\s+");
        List<Object> args = new ArrayList<>();
        
        for (String kw : keywords) {
            sql.append(" AND (tc.ten_thu_cung COLLATE SQL_Latin1_General_CP1_CI_AI LIKE ? COLLATE SQL_Latin1_General_CP1_CI_AI ")
               .append(" OR tc.loai COLLATE SQL_Latin1_General_CP1_CI_AI LIKE ? COLLATE SQL_Latin1_General_CP1_CI_AI) ");
            args.add("%" + kw + "%");
            args.add("%" + kw + "%");
        }

        var matchedRows = jdbcTemplate.queryForList(sql.toString(), args.toArray());

        if (matchedRows.isEmpty()) return "Không tìm thấy thú cưng nào với từ khóa: " + tuKhoa;
        
        StringBuilder sb = new StringBuilder("Tìm thấy " + matchedRows.size() + " thú cưng (hiển thị tối đa 5):\n");
        int count = 0;
        for (var r : matchedRows) {
            if (count >= 5) break;
            sb.append("- ID: ").append(r.get("id_thu_cung"))
              .append(" | Tên: ").append(r.get("ten_thu_cung"))
              .append(" | Loài: ").append(r.get("loai")).append(" - ").append(r.get("giong"))
              .append(" | ").append(r.get("trong_luong") != null ? r.get("trong_luong") : "chưa rõ").append("kg")
              .append(" | Sinh: ").append(r.get("ngay_sinh") != null ? r.get("ngay_sinh") : "chưa rõ")
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
        String sql = "SELECT gio_kham FROM LichHen WHERE ngay_kham = ? AND trang_thai != 'DA_HUY'";
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

    @Transactional
    String toolDatLichHen(Map<String, Object> p) {
        try {
            String idKhachHang = Objects.toString(p.get("id_khach_hang"), "").trim();
            String idThuCung = Objects.toString(p.get("id_thu_cung"), "").trim();
            String idBacSi = Objects.toString(p.get("id_bac_si"), "").trim();
            String idDichVu = Objects.toString(p.get("id_dich_vu"), "").trim();
            String ngayKhamText = Objects.toString(p.get("ngay_kham"), "").trim();
            String gioKhamText = Objects.toString(p.get("gio_kham"), "").trim();
            if (idKhachHang.isBlank() || idThuCung.isBlank() || idBacSi.isBlank()
                    || idDichVu.isBlank() || ngayKhamText.isBlank() || gioKhamText.isBlank()) {
                return "Lỗi đặt lịch: thiếu thông tin bắt buộc gồm khách hàng, thú cưng, bác sĩ, dịch vụ, ngày khám và giờ khám.";
            }
            LocalDate ngayKham = LocalDate.parse(ngayKhamText);
            LocalTime gioKham = LocalTime.parse(gioKhamText.length() == 5 ? gioKhamText : gioKhamText.substring(0, 5));
            LocalDate today = LocalDate.now(VN_ZONE);
            if (ngayKham.isBefore(today)) {
                return "Lỗi đặt lịch: không thể đặt lịch vào ngày trong quá khứ.";
            }
            if (ngayKham.equals(today) && gioKham.isBefore(LocalTime.now(VN_ZONE).plusMinutes(30))) {
                return "Lỗi đặt lịch: giờ khám phải cách thời điểm hiện tại tối thiểu 30 phút.";
            }

            // Validate all entities exist before proceeding
            Integer customerExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM KhachHang WHERE id_khach_hang = ? AND (da_xoa = 0 OR da_xoa IS NULL)",
                Integer.class, idKhachHang);
            Integer petExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM ThuCung WHERE id_thu_cung = ? AND id_khach_hang = ? AND (da_xoa = 0 OR da_xoa IS NULL)",
                Integer.class, idThuCung, idKhachHang);
            Integer doctorExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM NhanVien WHERE id_nhan_vien = ? AND (da_xoa = 0 OR da_xoa IS NULL)",
                Integer.class, idBacSi);
            Integer serviceExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM DichVu WHERE id_dich_vu = ? AND (da_xoa = 0 OR da_xoa IS NULL)",
                Integer.class, idDichVu);

            // Null-safe validation
            if (customerExists == null || customerExists == 0) return "Lỗi đặt lịch: không tìm thấy khách hàng hợp lệ.";
            if (petExists == null || petExists == 0) return "Lỗi đặt lịch: thú cưng không thuộc khách hàng này hoặc đã bị xóa.";
            if (doctorExists == null || doctorExists == 0) return "Lỗi đặt lịch: không tìm thấy bác sĩ hợp lệ.";
            if (serviceExists == null || serviceExists == 0) return "Lỗi đặt lịch: không tìm thấy dịch vụ hợp lệ.";

            // Check duplicate: cùng bác sĩ + cùng giờ
            Integer duplicateDoctorSlot = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM LichHen WHERE ngay_kham = ? AND gio_kham = ? AND id_bac_si = ? AND trang_thai != 'DA_HUY'",
                Integer.class, java.sql.Date.valueOf(ngayKham), java.sql.Time.valueOf(gioKham), idBacSi);
            if (duplicateDoctorSlot != null && duplicateDoctorSlot > 0) {
                return "Lỗi đặt lịch: khung giờ này đã có lịch với bác sĩ đã chọn. Hãy chọn giờ khác.";
            }

            // NEW: Check duplicate: cùng thú cưng + cùng giờ (chống đặt trùng lịch cho 1 thú cưng)
            Integer duplicatePetSlot = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM LichHen WHERE ngay_kham = ? AND gio_kham = ? AND id_thu_cung = ? AND trang_thai != 'DA_HUY'",
                Integer.class, java.sql.Date.valueOf(ngayKham), java.sql.Time.valueOf(gioKham), idThuCung);
            if (duplicatePetSlot != null && duplicatePetSlot > 0) {
                return "Lỗi đặt lịch: thú cưng này đã có lịch hẹn trùng giờ. Vui lòng chọn giờ khác cho bé.";
            }

            String newId = "LH-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            String ghiChu = Objects.toString(p.getOrDefault("ghi_chu", ""), "").trim();
            if (ghiChu.isBlank()) ghiChu = "Đặt lịch qua Rexi AI Agent";

            String sql = "INSERT INTO LichHen (id_lich_hen, id_khach_hang, id_thu_cung, id_bac_si, id_dich_vu, ngay_kham, gio_kham, ghi_chu, trang_thai) " +
                         "VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'CHO_XAC_NHAN')";
            jdbcTemplate.update(sql,
                newId,
                idKhachHang, idThuCung, idBacSi,
                idDichVu, java.sql.Date.valueOf(ngayKham), gioKham.toString(),
                ghiChu);
            return "✅ Đặt lịch thành công! Mã lịch hẹn: " + newId + " vào " + ngayKham + " lúc " + gioKham;
        } catch (Exception e) {
            return "Lỗi đặt lịch: " + e.getMessage();
        }
    }

    private String toolHuyLichHen(Map<String, Object> p, String userRole, String username) {
        String idLichHen = Objects.toString(p.getOrDefault("id_lich_hen", ""), "").trim();
        String tuKhoaKhach = Objects.toString(p.getOrDefault("tu_khoa_khach", ""), "").trim();
        String thoiGian = normalizeVietnamese(Objects.toString(p.getOrDefault("thoi_gian", ""), "").toLowerCase().trim());
        boolean isCustomer = RoleAccessPolicy.isCustomerRole(userRole);

        try {
            String customerId = null;
            if (isCustomer) {
                if (username == null || username.isBlank()) {
                    return "Cần đăng nhập tài khoản khách hàng để hủy lịch của chính mình.";
                }
                List<Map<String, Object>> accounts = jdbcTemplate.queryForList(
                    "SELECT id_khach_hang FROM TaiKhoan WHERE ten_dang_nhap = ? AND id_khach_hang IS NOT NULL",
                    username);
                if (accounts.isEmpty()) {
                    return "Không xác định được hồ sơ khách hàng của tài khoản hiện tại, nên chưa thể hủy lịch.";
                }
                customerId = Objects.toString(accounts.get(0).get("id_khach_hang"), "");
            }

            List<Map<String, Object>> matches;
            if (!idLichHen.isBlank()) {
                String sql = "SELECT TOP 5 lh.id_lich_hen, lh.id_khach_hang, kh.ten_khach_hang, kh.sdt, tc.ten_thu_cung, lh.ngay_kham, lh.gio_kham, lh.trang_thai " +
                        "FROM LichHen lh LEFT JOIN KhachHang kh ON lh.id_khach_hang = kh.id_khach_hang " +
                        "LEFT JOIN ThuCung tc ON lh.id_thu_cung = tc.id_thu_cung WHERE lh.id_lich_hen = ?";
                matches = jdbcTemplate.queryForList(sql, idLichHen);
            } else {
                StringBuilder sql = new StringBuilder(
                    "SELECT TOP 5 lh.id_lich_hen, lh.id_khach_hang, kh.ten_khach_hang, kh.sdt, tc.ten_thu_cung, lh.ngay_kham, lh.gio_kham, lh.trang_thai " +
                    "FROM LichHen lh LEFT JOIN KhachHang kh ON lh.id_khach_hang = kh.id_khach_hang " +
                    "LEFT JOIN ThuCung tc ON lh.id_thu_cung = tc.id_thu_cung " +
                    "WHERE lh.trang_thai NOT IN ('DA_HUY', N'Đã hủy', 'da_huy', 'TU_CHOI', N'Hết hạn') ");
                List<Object> args = new ArrayList<>();
                if (isCustomer) {
                    sql.append("AND lh.id_khach_hang = ? ");
                    args.add(customerId);
                } else if (!tuKhoaKhach.isBlank()) {
                    sql.append("AND (kh.ten_khach_hang COLLATE SQL_Latin1_General_CP1_CI_AI LIKE ? COLLATE SQL_Latin1_General_CP1_CI_AI OR kh.sdt LIKE ?) ");
                    args.add("%" + tuKhoaKhach + "%");
                    args.add("%" + tuKhoaKhach + "%");
                } else {
                    return "Cần mã lịch hẹn hoặc tên/SĐT khách hàng để hủy đúng lịch, tránh hủy nhầm.";
                }
                
                LocalDate today = LocalDate.now(VN_ZONE);
                if (thoiGian.contains("chieu_nay") || thoiGian.contains("chieu nay")) {
                    sql.append("AND lh.ngay_kham = ? AND lh.gio_kham >= '12:00:00' ");
                    args.add(java.sql.Date.valueOf(today));
                } else if (thoiGian.contains("hom_nay") || thoiGian.contains("hom nay")) {
                    sql.append("AND lh.ngay_kham = ? ");
                    args.add(java.sql.Date.valueOf(today));
                } else if (thoiGian.contains("ngay_mai") || thoiGian.contains("ngay mai")) {
                    sql.append("AND lh.ngay_kham = ? ");
                    args.add(java.sql.Date.valueOf(today.plusDays(1)));
                }
                sql.append("ORDER BY lh.ngay_kham, lh.gio_kham");
                matches = jdbcTemplate.queryForList(sql.toString(), args.toArray());
            }

            if (matches.isEmpty()) {
                return "Không tìm thấy lịch hẹn phù hợp để hủy. Tôi không tự hủy nếu chưa xác định đúng lịch.";
            }
            if (isCustomer) {
                for (Map<String, Object> row : matches) {
                    if (!Objects.toString(row.get("id_khach_hang"), "").equals(customerId)) {
                        return "Cảnh báo bảo mật: khách hàng chỉ được hủy lịch của chính mình.";
                    }
                }
            }
            if (matches.size() > 1) {
                StringBuilder sb = new StringBuilder("Tìm thấy nhiều lịch phù hợp, cần chọn mã lịch để hủy chính xác:\n");
                for (Map<String, Object> row : matches) {
                    sb.append("- ").append(row.get("id_lich_hen"))
                      .append(" | ").append(row.get("ten_khach_hang"))
                      .append(" | ").append(row.get("ten_thu_cung"))
                      .append(" | ").append(row.get("ngay_kham"))
                      .append(" ").append(row.get("gio_kham")).append("\n");
                }
                return sb.toString();
            }

            Map<String, Object> target = matches.get(0);
            String targetId = Objects.toString(target.get("id_lich_hen"), "");
            Integer usageCount = jdbcTemplate.queryForObject(
                "SELECT (SELECT COUNT(*) FROM HoSoBenhAn WHERE id_lich_hen = ?) + (SELECT COUNT(*) FROM HoaDon WHERE id_lich_hen = ?)",
                Integer.class, targetId, targetId);
            if (Objects.requireNonNullElse(usageCount, 0) > 0) {
                return "Không thể hủy lịch " + targetId + " vì đã có hóa đơn hoặc hồ sơ bệnh án liên kết. Cần quản lý xử lý thủ công.";
            }
            jdbcTemplate.update("UPDATE LichHen SET trang_thai = 'DA_HUY' WHERE id_lich_hen = ?", targetId);
            return "Đã hủy lịch hẹn " + targetId + " cho " + target.get("ten_khach_hang") + " - bé " + target.get("ten_thu_cung") + ".";
        } catch (Exception e) {
            return "Lỗi hủy lịch hẹn: " + e.getMessage();
        }
    }

    private String toolCapNhatBenhAn(Map<String, Object> p) {
        String id = Objects.toString(p.getOrDefault("id_ho_so_benh_an", ""), "").trim();
        if (id.isBlank()) {
            return "Cần id_ho_so_benh_an để cập nhật đúng bệnh án. Tôi không cập nhật theo tên mơ hồ để tránh ghi nhầm hồ sơ.";
        }

        Map<String, String> fields = new LinkedHashMap<>();
        fields.put("trieu_chung", Objects.toString(p.getOrDefault("trieu_chung", ""), "").trim());
        fields.put("chan_doan", Objects.toString(p.getOrDefault("chan_doan", ""), "").trim());
        fields.put("phac_do_dieu_tri", Objects.toString(p.getOrDefault("phac_do_dieu_tri", ""), "").trim());
        fields.put("huong_dan_cham_soc", Objects.toString(p.getOrDefault("huong_dan_cham_soc", ""), "").trim());

        List<String> sets = new ArrayList<>();
        List<Object> args = new ArrayList<>();
        for (Map.Entry<String, String> entry : fields.entrySet()) {
            if (!entry.getValue().isBlank()) {
                sets.add(entry.getKey() + " = ?");
                args.add(entry.getValue());
            }
        }
        if (sets.isEmpty()) {
            return "Cần ít nhất một nội dung chuyên môn để cập nhật bệnh án.";
        }

        try {
            Integer exists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM HoSoBenhAn WHERE id_ho_so_benh_an = ?",
                Integer.class, id);
            if (Objects.requireNonNullElse(exists, 0) == 0) {
                return "Không tìm thấy bệnh án " + id + ".";
            }
            args.add(id);
            int rows = jdbcTemplate.update("UPDATE HoSoBenhAn SET " + String.join(", ", sets) + " WHERE id_ho_so_benh_an = ?", args.toArray());
            return rows > 0 ? "Đã cập nhật bệnh án " + id + ". Nội dung đã ghi theo quyền lâm sàng." : "Không có bệnh án nào được cập nhật.";
        } catch (Exception e) {
            return "Lỗi cập nhật bệnh án: " + e.getMessage();
        }
    }

    private String toolXemKhoThuoc(String tuKhoa) {
        boolean isSearch = tuKhoa != null && !tuKhoa.trim().isEmpty();
        int limit = isSearch ? 5 : 10;

        StringBuilder sql = new StringBuilder(
            "SELECT TOP 15 t.ten_thuoc, t.don_vi, t.gia_ban, " +
            "COALESCE(SUM(l.so_luong_ton), 0) AS so_luong_ton, MAX(l.han_su_dung) AS han_su_dung " +
            "FROM Thuoc t LEFT JOIN LoThuoc l ON t.id_thuoc = l.id_thuoc " +
            "WHERE (t.da_xoa = 0 OR t.da_xoa IS NULL) "
        );

        List<Object> args = new ArrayList<>();
        if (isSearch) {
            String[] keywords = tuKhoa.trim().split("\\s+");
            for (String kw : keywords) {
                sql.append(" AND t.ten_thuoc COLLATE SQL_Latin1_General_CP1_CI_AI LIKE ? COLLATE SQL_Latin1_General_CP1_CI_AI ");
                args.add("%" + kw + "%");
            }
        }

        sql.append(" GROUP BY t.id_thuoc, t.ten_thuoc, t.don_vi, t.gia_ban ");

        if (!isSearch) {
            // Nếu ko có từ khóa, SQL Server tự động sort theo số lượng tồn tăng dần
            sql.append(" ORDER BY COALESCE(SUM(l.so_luong_ton), 0) ASC ");
        } else {
            sql.append(" ORDER BY t.ten_thuoc ASC ");
        }

        var matchedRows = jdbcTemplate.queryForList(sql.toString(), args.toArray());

        if (matchedRows.isEmpty()) return "Không tìm thấy thuốc nào.";
        
        StringBuilder sb = new StringBuilder("Kho thuốc (hiển thị tối đa " + limit + " kết quả):\n");
        int count = 0;
        for (var r : matchedRows) {
            if (count >= limit) break;
            sb.append("- ").append(r.get("ten_thuoc"))
              .append(" | SL: ").append(r.get("so_luong_ton")).append(" ").append(r.get("don_vi"))
              .append(" | Giá: ").append(r.get("gia_ban")).append("đ")
              .append(" | HSD: ").append(r.get("han_su_dung") != null ? r.get("han_su_dung") : "N/A").append("\n");
            count++;
        }
        return sb.toString();
    }

    private String toolThongKeDoanhThu(String khoang) {
        LocalDate today = LocalDate.now(VN_ZONE);
        java.time.LocalDateTime startDate;
        java.time.LocalDateTime endDate;

        switch (khoang) {
            case "tuan_nay" -> {
                startDate = today.with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY)).atStartOfDay();
                endDate = startDate.plusWeeks(1);
            }
            case "thang_nay" -> {
                startDate = java.time.YearMonth.from(today).atDay(1).atStartOfDay();
                endDate = startDate.plusMonths(1);
            }
            default -> { // hom_nay
                startDate = today.atStartOfDay();
                endDate = startDate.plusDays(1);
            }
        }

        try {
            String sql = "SELECT COUNT(*) AS so_hoa_don, SUM(tong_tien_cuoi) AS tong_doanh_thu, " +
                         "AVG(tong_tien_cuoi) AS trung_binh FROM HoaDon WHERE " +
                         "ngay_lap_hoa_don >= ? AND ngay_lap_hoa_don < ? " +
                         " AND (trang_thai = 'DA_THANH_TOAN' OR trang_thai_thanh_toan = 'DA_THANH_TOAN')";
            var row = jdbcTemplate.queryForMap(sql, startDate, endDate);
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
            conn.setConnectTimeout(5000);
            conn.setReadTimeout(7000);
            try (var os = conn.getOutputStream()) { os.write(("q=" + encodedQuery).getBytes()); }
            StringBuilder resp = new StringBuilder();
            try (var br = new java.io.BufferedReader(new java.io.InputStreamReader(conn.getInputStream(), "UTF-8"))) {
                String line; while ((line = br.readLine()) != null) resp.append(line);
            }
            var titlePattern = java.util.regex.Pattern.compile("class=\"result__a\" href=\"([^\"]+)\">([^<]+)<");
            var snippetPattern = java.util.regex.Pattern.compile("class=\"result__snippet\"[^>]*>(.*?)</a>");
            String html = resp.toString();
            var m = titlePattern.matcher(html);
            var snippetMatcher = snippetPattern.matcher(html);
            List<String> snippets = new ArrayList<>();
            while (snippetMatcher.find() && snippets.size() < 5) {
                snippets.add(stripHtmlEntities(snippetMatcher.group(1)));
            }
            StringBuilder result = new StringBuilder("Kết quả web đã chắt lọc cho \"" + query + "\":\n");
            int count = 0;
            while (m.find() && count < 3) {
                String title = stripHtmlEntities(m.group(2));
                String snippet = count < snippets.size() ? snippets.get(count) : "";
                result.append(count + 1).append(". ").append(title).append("\n")
                    .append("   Ý chính: ").append(snippet.isBlank() ? "Nguồn này có thể liên quan nhưng không có đoạn mô tả ngắn." : snippet).append("\n")
                    .append("   Nguồn: ").append(cleanDuckDuckGoUrl(m.group(1))).append("\n");
                count++;
            }
            if (count > 0) {
                result.append("\nYêu cầu trả lời: đừng chỉ liệt kê link. Hãy đọc các ý chính ở trên, tổng hợp thành câu trả lời tiếng Việt dễ hiểu, nêu điểm đáng tin/cần kiểm chứng, rồi đặt link nguồn Markdown ở cuối.");
                return result.toString();
            }
            return "Không tìm thấy kết quả web.";
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
                .replace("&gt;", ">")
                .replaceAll("<[^>]+>", "")
                .trim();
    }

    private String cleanDuckDuckGoUrl(String rawUrl) {
        if (rawUrl == null) return "";
        String decoded = stripHtmlEntities(rawUrl);
        try {
            if (decoded.contains("uddg=")) {
                String query = java.net.URI.create(decoded).getRawQuery();
                if (query != null) {
                    for (String part : query.split("&")) {
                        if (part.startsWith("uddg=")) {
                            return java.net.URLDecoder.decode(part.substring(5), java.nio.charset.StandardCharsets.UTF_8);
                        }
                    }
                }
            }
        } catch (Exception ignored) {
        }
        return decoded;
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

    private String toolKiemTraKienTrucHeThong() {
        return """
            Bản đồ kiến trúc Rexi AI/Agent hiện tại:
            - Frontend/src/components/ChatBot.tsx: giao diện chat nổi, tab Trợ lý Rexi và Rexi Agent, nhận giọng nói, prewarm AI khi mở chatbot.
            - Backend/src/main/java/com/rexi/pkty/controller/ChatController.java: API chat thường, phân tuyến yêu cầu nhanh/DB/AI, cấp cứu thú y local triage, persona khách hàng, endpoint /api/chat/prewarm.
            - Backend/src/main/java/com/rexi/pkty/controller/AgentController.java: API Rexi Agent nội bộ, gồm /api/agent/react, gọi tool trực tiếp và orchestration.
            - Backend/src/main/java/com/rexi/pkty/service/ReActAgentService.java: vòng lặp ReAct Reason -> Act -> Observe, chọn tool, gọi model theo thứ tự OpenRouter -> Gemini -> Groq.
            - Backend/src/main/java/com/rexi/pkty/service/AiToolService.java: registry tool và thực thi tool thật với database/email/web/system map.
            - Backend/src/main/java/com/rexi/pkty/service/GroqService.java: adapter Groq, prewarm, xoay vòng/cooldown API key.
            - Backend/src/main/java/com/rexi/pkty/service/GeminiService.java: adapter Gemini cho fallback model.
            - Backend/src/main/java/com/rexi/pkty/service/OpenRouterService.java: adapter OpenRouter, provider ưu tiên đầu tiên của ReAct Agent.
            - Backend/src/main/java/com/rexi/pkty/security/RoleAccessPolicy.java: chặn/mở tool theo vai trò, không cho khách quét dữ liệu nội bộ.
            - Backend/src/main/java/com/rexi/pkty/security/SecurityConfig.java: cấu hình bảo mật, CORS và filter xác thực.

            Nguyên tắc tự nhận thức của Agent:
            - Agent không tự đọc file mã nguồn trực tiếp ở runtime; nó hiểu hệ thống qua prompt, tool schema, route map, context giao diện và bản đồ kiến trúc này.
            - Nếu admin hỏi model/provider/key cấu hình, phải dùng tool kiem_tra_cau_hinh_ai; không bao giờ tiết lộ API key.
            - Nếu admin hỏi chức năng nào nằm ở đâu, dùng bản đồ kiến trúc này rồi trả lời theo module/controller/service liên quan.
            - Nếu yêu cầu thao tác dữ liệu thật, phải dùng tool đúng quyền hoặc hỏi xác nhận khi hành động nhạy cảm.
            """;
    }

    private record SourceIndexEntry(
        String id,
        String title,
        String keywords,
        String files,
        String routes,
        String tools,
        String notes
    ) {}

    private static final List<SourceIndexEntry> SOURCE_INDEX = List.of(
        new SourceIndexEntry(
            "chatbot_voice_ui",
            "ChatBot, voice/micro, context frontend",
            "chatbot chat bot mic micro voice giọng nói opera speech recognition dom context prewarm tab agent trợ lý",
            "Frontend/src/components/ChatBot.tsx; Frontend/src/components/VoiceInput.tsx; Frontend/src/utils/agentPermissions.ts",
            "/api/chat; /api/chat/prewarm; /api/agent/react; /api/agent/tool",
            "Không có tool DB trực tiếp; frontend quyết định context và gọi Agent/Chat.",
            "Xử lý UI chat nổi, tab Trợ lý Rexi/Rexi Agent, nhận giọng nói, context trang, streaming/fallback và prewarm."
        ),
        new SourceIndexEntry(
            "standard_chat",
            "Chat thường khách hàng",
            "chat thường standard chat khách hàng cấp cứu triage db local groq persona prewarm",
            "Backend/src/main/java/com/rexi/pkty/controller/ChatController.java; Backend/src/main/java/com/rexi/pkty/service/GroqService.java",
            "/api/chat; /api/chat/stream; /api/chat/prewarm",
            "local_triage; ChatRoute QUICK_LOCAL/DB_LOCAL/MEDICAL_AI/WEB_AI/CHAT_AI",
            "Chat thường ưu tiên trả lời nhanh/local triage/DB local, chỉ gọi AI khi cần. Không dùng Rexi Agent ReAct."
        ),
        new SourceIndexEntry(
            "react_agent_core",
            "Rexi Agent ReAct nội bộ",
            "agent re act react reason act observe admin model provider openrouter gemini groq tool",
            "Backend/src/main/java/com/rexi/pkty/controller/AgentController.java; Backend/src/main/java/com/rexi/pkty/service/ReActAgentService.java; Backend/src/main/java/com/rexi/pkty/service/AiToolService.java",
            "/api/agent/react; /api/agent/tool; /api/agent/swarm-orchestration",
            "Tất cả tool trong AiToolService theo RoleAccessPolicy.",
            "Vòng lặp Agent chọn tool, quan sát kết quả, rồi trả final_answer. Provider fallback: OpenRouter -> Gemini -> Groq."
        ),
        new SourceIndexEntry(
            "ai_provider_config",
            "Cấu hình provider/model/API key",
            "ai provider model api key groq gemini openrouter cấu hình cau hinh prewarm cooldown xoay vòng key hết hạn",
            "Backend/src/main/java/com/rexi/pkty/service/GroqService.java; Backend/src/main/java/com/rexi/pkty/service/GeminiService.java; Backend/src/main/java/com/rexi/pkty/service/OpenRouterService.java; Backend/src/main/resources/application.properties",
            "/api/chat/prewarm; /api/agent/react",
            "kiem_tra_cau_hinh_ai",
            "Không bao giờ trả API key. Muốn biết model/provider thực tế phải gọi kiem_tra_cau_hinh_ai, kết quả chỉ che key."
        ),
        new SourceIndexEntry(
            "permissions_security",
            "Phân quyền, JWT, bảo mật tool",
            "quyền phân quyền role admin quản lý khách hàng bảo mật jwt security tool permission policy frontend backend",
            "Backend/src/main/java/com/rexi/pkty/security/RoleAccessPolicy.java; Backend/src/main/java/com/rexi/pkty/security/RexiSecurityRoles.java; Backend/src/main/java/com/rexi/pkty/SecurityConfig.java; Backend/src/main/java/com/rexi/pkty/security/JwtFilter.java; Frontend/src/utils/permissions.ts; Frontend/src/utils/agentPermissions.ts",
            "/api/agent/react; /api/agent/tool; các route /quan-ly/* theo ADMIN_ROUTE_ROLES",
            "RoleAccessPolicy.canUseAgentTool; canUseAgentTool frontend",
            "Backend là nguồn chặn quyền cuối cùng. Tool mã nguồn/cấu hình AI chỉ admin; khách không được xem dữ liệu nội bộ."
        ),
        new SourceIndexEntry(
            "appointment_booking",
            "Đặt lịch, lịch trống, xác nhận lịch",
            "đặt lịch lịch hẹn lịch trống bác sĩ dịch vụ khách hàng thú cưng xác nhận booking appointment",
            "Backend/src/main/java/com/rexi/pkty/controller/AgentController.java; Backend/src/main/java/com/rexi/pkty/service/AiToolService.java; Frontend/src/pages/customer/DatLichHen.tsx; Frontend/src/pages/admin/QuanLyLichHen.tsx",
            "/api/agent/react; /api/agent/tool; /api/lich-hen; /api/dich-vu; /api/thu-cung",
            "tim_lich_trong; dat_lich_hen; tim_lich_hen_hom_nay; tim_khach_hang; tim_thu_cung",
            "Hành động tạo lịch phải đủ dữ liệu và nên hỏi xác nhận trước khi đặt."
        ),
        new SourceIndexEntry(
            "customer_pet_records",
            "Khách hàng, thú cưng, hồ sơ bệnh án",
            "khách hàng thú cưng bệnh án hồ sơ khám bệnh đơn thuốc xét nghiệm file y tế customer pet record",
            "Backend/src/main/java/com/rexi/pkty/service/AiToolService.java; Frontend/src/pages/admin/QuanLyKhachHangThuCung.tsx; Frontend/src/pages/admin/QuanLyHoSoBenhAn.tsx; Frontend/src/pages/admin/ChiTietHoSoBenhAn.tsx; Frontend/src/pages/customer/HoSoBenhAn.tsx",
            "/api/khach-hang; /api/thu-cung; /api/ho-so-benh-an",
            "tim_khach_hang; tim_thu_cung; xem_benh_an",
            "Dữ liệu bệnh án là nhạy cảm, chỉ vai trò được cấp quyền mới tra cứu."
        ),
        new SourceIndexEntry(
            "invoice_finance_inventory",
            "Hóa đơn, kế toán, kho thuốc",
            "hóa đơn thanh toán kế toán doanh thu kho thuốc nhập kho tồn kho thuốc invoice finance inventory",
            "Backend/src/main/java/com/rexi/pkty/service/AiToolService.java; Frontend/src/pages/admin/QuanLyHoaDon.tsx; Frontend/src/pages/admin/KeToanDashboard.tsx; Frontend/src/pages/admin/QuanLyKhoThuoc.tsx; Frontend/src/pages/admin/QuanLyNhapKho.tsx",
            "/api/hoa-don; /api/kho; /api/agent/tool",
            "xem_hoa_don; thong_ke_doanh_thu; xem_kho_thuoc",
            "Tài chính/kho là dữ liệu nội bộ, phải theo role finance/inventory."
        ),
        new SourceIndexEntry(
            "account_admin",
            "Tài khoản, nhân viên, mở khóa/xóa mềm",
            "tài khoản nhân viên phân quyền mở khóa khóa xóa mềm admin account employee user password",
            "Backend/src/main/java/com/rexi/pkty/controller/AdminAccountController.java; Backend/src/main/java/com/rexi/pkty/controller/NhanVienController.java; Backend/src/main/java/com/rexi/pkty/service/AiToolService.java; Frontend/src/pages/admin/QuanLyNhanVienPhanQuyen.tsx",
            "/api/admin/tai-khoan; /api/nhan-vien; /api/agent/tool",
            "tim_tai_khoan_bi_khoa; thao_tac_tai_khoan",
            "Thao tác tài khoản là nhạy cảm, bắt buộc xác định đúng đối tượng và hỏi xác nhận trước."
        ),
        new SourceIndexEntry(
            "marketing_swarm",
            "Marketing email và Swarm Agent",
            "marketing email swarm campaign chiến dịch gửi mail khách hàng dataagent creative reviewer",
            "Backend/src/main/java/com/rexi/pkty/controller/AgentController.java; Backend/src/main/java/com/rexi/pkty/service/EmailService.java; Frontend/src/pages/admin/QuanLyMarketing.tsx; Frontend/src/components/ChatBot.tsx",
            "/api/agent/swarm-orchestration; /api/agent/bulk-send-email",
            "gui_email_don_le; tim_kiem_web",
            "Không tạo dữ liệu demo giả khi DB rỗng, tránh gửi nhầm. Gửi email cần duyệt/xác nhận."
        ),
        new SourceIndexEntry(
            "frontend_routes",
            "Route và màn hình frontend",
            "route trang frontend sidebar protected route dashboard cấu hình chức năng admin customer",
            "Frontend/src/App.tsx; Frontend/src/components/ProtectedRoute.tsx; Frontend/src/components/SidebarAdmin.tsx; Frontend/src/components/SidebarKhachHang.tsx; Frontend/src/utils/permissions.ts",
            "/quan-ly/*; /khach-hang/*; /dang-nhap",
            "kiem_tra_phan_he",
            "Frontend route guard chỉ hỗ trợ UX; backend vẫn phải kiểm quyền khi đọc/sửa dữ liệu."
        ),
        new SourceIndexEntry(
            "system_health_errors",
            "Health, lỗi hệ thống, log, DB",
            "backend health lỗi sql server sa login database db kết nối compile startup system error",
            "Backend/src/main/resources/application.properties; Backend/src/main/java/com/rexi/pkty/controller/SystemController.java; Backend/src/main/java/com/rexi/pkty/exception/BoXuLyLoiHeThong.java",
            "/api/system/health",
            "Không có tool sửa DB config tự động.",
            "Health 200 nghĩa backend lên. SQL Server login failed là lỗi môi trường/cấu hình DB, không nên để Agent bịa dữ liệu khi DB lỗi."
        )
    );

    private String toolTraCuuMaNguon(String tuKhoa) {
        String query = normalizeVietnamese(Objects.toString(tuKhoa, "").toLowerCase().trim());
        if (query.isBlank()) {
            return "Cần từ khóa để tra cứu index mã nguồn. Ví dụ: chatbot mic, agent model, phân quyền tool, đặt lịch, hóa đơn.";
        }

        List<Map.Entry<Integer, SourceIndexEntry>> scored = new ArrayList<>();
        for (SourceIndexEntry entry : SOURCE_INDEX) {
            int score = scoreSourceIndexEntry(query, entry);
            if (score > 0) {
                scored.add(Map.entry(score, entry));
            }
        }
        scored.sort((a, b) -> Integer.compare(b.getKey(), a.getKey()));

        if (scored.isEmpty()) {
            return "Không tìm thấy module khớp trong index mã nguồn whitelist cho từ khóa: " + tuKhoa
                + ". Có thể hỏi rộng hơn theo nhóm: chatbot, agent, provider AI, phân quyền, đặt lịch, khách hàng, bệnh án, hóa đơn, kho, marketing, route frontend, health.";
        }

        StringBuilder sb = new StringBuilder();
        sb.append("Kết quả tra cứu index mã nguồn cho \"").append(tuKhoa).append("\" (tối đa 4 mục, không bao gồm raw source/secret):\n");
        int limit = Math.min(4, scored.size());
        for (int i = 0; i < limit; i++) {
            SourceIndexEntry e = scored.get(i).getValue();
            sb.append("\n").append(i + 1).append(". ").append(e.title()).append(" [").append(e.id()).append("]\n")
                .append("- Files: ").append(e.files()).append("\n")
                .append("- Routes/API: ").append(e.routes()).append("\n")
                .append("- Tools/liên kết: ").append(e.tools()).append("\n")
                .append("- Ghi chú: ").append(e.notes()).append("\n");
        }
        sb.append("\nLuật bảo mật: chỉ dùng kết quả này để định vị module/chức năng; không suy đoán secret, API key, mật khẩu hay nội dung file không có trong index.");
        return sb.toString();
    }

    private int scoreSourceIndexEntry(String query, SourceIndexEntry entry) {
        String haystack = normalizeVietnamese((
            entry.id() + " " + entry.title() + " " + entry.keywords() + " " + entry.files() + " " + entry.routes() + " " + entry.tools() + " " + entry.notes()
        ).toLowerCase());
        int score = 0;
        for (String token : query.split("\\s+")) {
            if (token.length() < 2) continue;
            if (haystack.contains(token)) {
                score += token.length() >= 5 ? 3 : 1;
            }
        }
        if (haystack.contains(query)) {
            score += 8;
        }
        return score;
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

    private String toolTraCuuTaiLieuYKhoa(String tuKhoa, String userRole) {
        StringBuilder sb = new StringBuilder();
        try {
            boolean isSearch = tuKhoa != null && !tuKhoa.trim().isEmpty();
            
            // 1. Đọc tài liệu VNUA từ file RAG tĩnh cực kỳ tối ưu.
            java.nio.file.Path path = java.util.List.of(
                    java.nio.file.Paths.get("uploads/docs/DANH_SACH_TAI_LIEU_VNUA.md"),
                    java.nio.file.Paths.get("../uploads/docs/DANH_SACH_TAI_LIEU_VNUA.md")
                ).stream()
                .filter(java.nio.file.Files::exists)
                .findFirst()
                .orElse(java.nio.file.Paths.get("uploads/docs/DANH_SACH_TAI_LIEU_VNUA.md"));
            if (java.nio.file.Files.exists(path)) {
                List<String> staticLines = java.nio.file.Files.readAllLines(path, java.nio.charset.StandardCharsets.UTF_8);
                sb.append("📚 [HỆ THỐNG RAG] Đang truy xuất giáo trình VNUA từ thư viện tĩnh:\n");

                boolean foundInStatic = false;
                String normalizedSearch = isSearch ? normalizeVietnamese(tuKhoa.toLowerCase()) : "";
                String currentSubject = "Tài liệu VNUA";
                StringBuilder currentBlock = new StringBuilder();
                for (String line : staticLines) {
                    if (line.startsWith("## ")) {
                        foundInStatic = appendVnuaIndexBlock(sb, currentSubject, currentBlock.toString(), normalizedSearch, isSearch) || foundInStatic;
                        currentSubject = line.replace("#", "").trim();
                        currentBlock.setLength(0);
                    } else if (!line.startsWith("# ")) {
                        currentBlock.append(line).append("\n");
                    }
                }
                foundInStatic = appendVnuaIndexBlock(sb, currentSubject, currentBlock.toString(), normalizedSearch, isSearch) || foundInStatic;

                if (foundInStatic) {
                    String[] lines = sb.toString().split("\\R");
                    if (lines.length > 80) {
                        StringBuilder trimmed = new StringBuilder();
                        int kept = 0;
                        for (String line : lines) {
                            if (line.startsWith("📚") || line.startsWith("- Môn") || line.startsWith("  - File") || line.startsWith("  - Đường dẫn") || line.startsWith("  - Từ khóa")) {
                                trimmed.append(line).append("\n");
                                kept++;
                            }
                            if (kept >= 80) {
                                trimmed.append("... đã rút gọn danh sách, hãy tìm từ khóa cụ thể hơn nếu cần.\n");
                                break;
                            }
                        }
                        sb.setLength(0);
                        sb.append(trimmed);
                    }
                }

                if (!foundInStatic && isSearch) {
                    sb.append("(Không tìm thấy giáo trình VNUA tĩnh nào khớp trực tiếp với từ khóa '").append(tuKhoa).append("')\n");
                }
                sb.append("\n");
            }

            // 2. Kết hợp truy vấn Database bảng file_dinh_kem (nếu sau này sếp upload thêm file vật lý mới)
            String sql = "SELECT id, ten_file, duong_dan, loai, kich_thuoc " +
                         "FROM file_dinh_kem " +
                         "WHERE loai = N'Tài liệu' OR loai = 'Tài liệu' OR ten_file LIKE '%.pdf' OR ten_file LIKE '%.docx'";
            
            List<Map<String, Object>> dbRows;
            if (isSearch) {
                String searchSql = sql + " AND (ten_file COLLATE SQL_Latin1_General_CP1_CI_AI LIKE ? COLLATE SQL_Latin1_General_CP1_CI_AI)";
                dbRows = jdbcTemplate.queryForList(searchSql, "%" + tuKhoa.trim() + "%");
            } else {
                dbRows = jdbcTemplate.queryForList(sql);
            }

            if (!dbRows.isEmpty()) {
                sb.append("📂 [TÀI LIỆU TẢI LÊN] Phát hiện ").append(dbRows.size()).append(" tài liệu sếp vừa upload lên hệ thống:\n");
                for (int i = 0; i < Math.min(dbRows.size(), 5); i++) {
                    var r = dbRows.get(i);
                    double sizeMb = (r.get("kich_thuoc") != null) ? ((Long) r.get("kich_thuoc")) / (1024.0 * 1024.0) : 0.0;
                    sb.append(String.format("  - %s | ID: %s | %.2f MB\n", r.get("ten_file"), r.get("id"), sizeMb));
                    sb.append("    ➔ Mở xem nhanh: ").append(r.get("duong_dan")).append("\n");
                }
                if (dbRows.size() > 5) {
                    sb.append("  ... và một số tài liệu tải lên khác.\n");
                }
            }

            if (sb.length() == 0) {
                return "Không tìm thấy bất kỳ tài liệu y khoa VNUA nào phù hợp với từ khóa: \"" + (isSearch ? tuKhoa : "tất cả") + "\".";
            }

            sb.append("\nHướng dẫn cho AI: Hãy đưa ra chẩn đoán dựa trên tài liệu VNUA này và cung cấp đường dẫn Link tải/xem PDF trực tiếp cho sếp bấm mở nhé!");
            return sb.toString();
        } catch (Exception e) {
            return "Lỗi khi truy xuất tài liệu y khoa: " + e.getMessage();
        }
    }

    private boolean appendVnuaIndexBlock(StringBuilder sb, String subject, String block, String normalizedSearch, boolean isSearch) {
        if (block == null || block.isBlank()) return false;
        String normalizedBlock = normalizeVietnamese((subject + "\n" + block).toLowerCase());
        if (isSearch && !normalizedBlock.contains(normalizedSearch)) return false;

        sb.append("- Môn [").append(subject).append("]:\n");
        for (String rawLine : block.split("\\R")) {
            String line = rawLine.trim();
            if (line.startsWith("- File:") || line.startsWith("- Đường dẫn") || line.startsWith("- Từ khóa")) {
                sb.append("  ").append(line).append("\n");
            }
        }
        return true;
    }
}
