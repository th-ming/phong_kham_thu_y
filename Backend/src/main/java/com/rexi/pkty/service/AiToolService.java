package com.rexi.pkty.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.rexi.pkty.security.RoleAccessPolicy;
import com.rexi.pkty.util.DatabaseDialect;
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

    @Autowired(required = false)
    private CodeRagService codeRagService;

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
            "Lấy danh sách lịch hẹn khám. Có thể lọc theo tên bác sĩ bằng 'tu_khoa_bac_si'. Truyền 'pham_vi'='all' để lấy toàn bộ lịch sử, mặc định chỉ hôm nay.", "{\"pham_vi\": \"hom_nay|all\", \"tu_khoa_bac_si\": \"Minh\"}");
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
        appendToolIfAllowed(sb, userRole, "them_thu_cung",
            "Thêm thú cưng mới. Khách hàng chỉ được thêm cho chính tài khoản đang đăng nhập.",
            "{\"ten_thu_cung\":\"...\",\"loai\":\"Chó|Mèo|...\",\"giong\":\"...\",\"gioi_tinh\":\"Đực|Cái|Không xác định\",\"mau_sac\":\"...\",\"trong_luong\":\"3.2\",\"ngay_sinh\":\"YYYY-MM-DD\",\"ghi_chu\":\"...\",\"id_khach_hang\":\"chỉ nội bộ mới truyền\"}");
        appendToolIfAllowed(sb, userRole, "cap_nhat_benh_an",
            "Cập nhật thông tin bệnh án chuyên môn. Chỉ bác sĩ/y tá/quản trị lâm sàng được dùng.",
            "{\"id_ho_so_benh_an\":\"...\",\"trieu_chung\":\"...\",\"chan_doan\":\"...\",\"phac_do_dieu_tri\":\"...\",\"huong_dan_cham_soc\":\"...\"}");
        String khoThuocDesc = (RoleAccessPolicy.normalizeRole(userRole).equals("bac_si") || RoleAccessPolicy.normalizeRole(userRole).equals("y_ta"))
            ? "Kiểm tra tồn kho thuốc. Dùng để tra cứu xem thuốc định kê còn không hoặc tham khảo thành phần."
            : "Kiểm tra tồn kho thuốc. Đây là dữ liệu kho, không tự biến thành chỉ định điều trị vì vai trò không phải lâm sàng.";
        appendToolIfAllowed(sb, userRole, "xem_kho_thuoc", khoThuocDesc, "{\"tu_khoa\": \"\"}");
        appendToolIfAllowed(sb, userRole, "thong_ke_doanh_thu",
            "Thống kê doanh thu.", "{\"khoang_thoi_gian\": \"hom_nay|tuan_nay|thang_nay\"}");
        appendToolIfAllowed(sb, userRole, "thong_ke_ca_kham_bac_si",
            "Thống kê số ca khám/lịch hẹn theo bác sĩ. Dùng cho câu hỏi bác sĩ nào nhiều ca nhất, ít ca nhất, tải/bận nhất.",
            "{\"khoang_thoi_gian\": \"hom_nay|tuan_nay|thang_nay|all\", \"sap_xep\": \"nhieu_nhat|it_nhat\"}");
        appendToolIfAllowed(sb, userRole, "thong_ke_khach_hang_hom_nay",
            "Đếm khách hàng mới hôm nay và phân tích xu hướng lịch hẹn hôm nay từ dữ liệu hệ thống. Không được tự ước lượng nếu DB thiếu dữ liệu.",
            "{\"gom_xu_huong\": \"true|false\"}");
        appendToolIfAllowed(sb, userRole, "tim_kiem_web",
            "Tìm thông tin y khoa trên web.", "{\"query\": \"...\"}");
        appendToolIfAllowed(sb, userRole, "gui_email_don_le",
            "Gửi email (phải hỏi xác nhận trước).", "{\"email\":\"...\",\"tieu_de\":\"...\",\"noi_dung\":\"...\"}");
        appendToolIfAllowed(sb, userRole, "kiem_tra_cau_hinh_ai",
            "Kiểm tra cấu hình AI (không tiết lộ API key).", "{}");
        appendToolIfAllowed(sb, userRole, "kiem_tra_kien_truc_he_thong",
            "Xem bản đồ mã nguồn, luồng Agent và provider đang dùng ở mức kiến trúc.", "{}");
        appendToolIfAllowed(sb, userRole, "tra_cuu_ma_nguon",
            "Tra cứu RAG mã nguồn theo từ khóa. Trả file, route/API, dòng code gần nhất và snippet đã che secret. Dùng khi admin hỏi chức năng nằm ở đâu, trang nào, file nào, dòng nào.",
            "{\"tu_khoa\":\"trang hóa đơn|nút thêm dịch vụ|api đăng nhập|agent provider|...\"}");
        appendToolIfAllowed(sb, userRole, "kiem_tra_phan_he",
            "Xem phân hệ và route hệ thống.", "{}");
        appendToolIfAllowed(sb, userRole, "xem_hoa_don",
            "Xem hóa đơn theo trạng thái.", "{\"trang_thai\": \"CHO_THANH_TOAN|DA_THANH_TOAN|all\"}");
        appendToolIfAllowed(sb, userRole, "thao_tac_tai_khoan",
            "Khóa/mở khóa/xóa mềm tài khoản (bắt buộc xác nhận trước).",
            "{\"id_khach_hang\":\"...\",\"hanh_dong\":\"KHOA|XOA|MO_KHOA\",\"xac_nhan\":true}");
        appendToolIfAllowed(sb, userRole, "tim_tai_khoan_bi_khoa",
            "Danh sách tài khoản bị khóa.", "{}");
        appendToolIfAllowed(sb, userRole, "tra_cuu_tai_lieu_y_khoa",
            "Tra cứu tài liệu VNUA, giáo trình thú y, phác đồ điều trị sếp đã tải lên hệ thống.", "{\"tu_khoa\":\"...\"}");

        // --- Schedule & Roster Tools ---
        appendToolIfAllowed(sb, userRole, "getStaffSchedule",
            "Tra cứu lịch làm việc của nhân sự theo tuần. 'week' có thể là 'this' hoặc 'next'.", "{\"staff\":\"tên nhân viên\", \"week\":\"this|next\"}");
        appendToolIfAllowed(sb, userRole, "getSlotUsage",
            "Kiểm tra số lượng nhân sự đã đăng ký trong một khung giờ cụ thể.", "{\"date\":\"YYYY-MM-DD\", \"time\":\"HH:mm\"}");
        appendToolIfAllowed(sb, userRole, "checkConflict",
            "Kiểm tra xung đột lịch làm việc của một nhân viên hoặc kiểm tra slot full.", "{\"staff\":\"tên\", \"date\":\"YYYY-MM-DD\", \"time\":\"HH:mm\"}");
        appendToolIfAllowed(sb, userRole, "findOverlapStaff",
            "Tìm các nhân sự có lịch làm việc trùng nhau trong tuần.", "{\"week\":\"this|next\"}");
        appendToolIfAllowed(sb, userRole, "findFreeStaff",
            "Tìm danh sách nhân sự đang rảnh (không có lịch) trong một ngày.", "{\"date\":\"YYYY-MM-DD\"}");
        appendToolIfAllowed(sb, userRole, "suggestSchedule",
            "Gợi ý các ngày trống để xếp lịch cho một nhân viên.", "{\"staff\":\"tên\", \"week\":\"this|next\"}");
        appendToolIfAllowed(sb, userRole, "autoSchedule",
            "Gợi ý bảng phân ca tự động cho toàn bộ nhân sự dựa trên các slot còn trống.", "{\"week\":\"this|next\"}");
        appendToolIfAllowed(sb, userRole, "overrideDoctorSlot",
            "Ép thêm bác sĩ vào slot đã đầy (cần quyền Admin/Quản lý).", "{\"staff\":\"tên bác sĩ\", \"date\":\"YYYY-MM-DD\", \"time\":\"HH:mm\", \"reason\":\"lý do\"}");

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

            3. them_thu_cung
               Mô tả: Thêm thú cưng cho chính khách hàng đang đăng nhập. Không được truyền ID khách hàng khác.
               Params: {"ten_thu_cung":"...","loai":"Chó|Mèo|...","giong":"...","gioi_tinh":"Đực|Cái|Không xác định","mau_sac":"...","trong_luong":"3.2","ngay_sinh":"YYYY-MM-DD","ghi_chu":"..."}

            4. danh_sach_thu_cung_cua_toi
               Mô tả: Xem danh sách thú cưng của chính khách hàng đang đăng nhập. Không nhận id_khach_hang từ người dùng.
               Params: {}

            5. tim_kiem_web
               Mô tả: Tìm kiếm thông tin y khoa, tin tức thú y mới nhất trên internet.
               Params: {"query": "nội dung cần tìm"}

            6. kiem_tra_phan_he
               Mô tả: Xem danh sách phân hệ, route và quyền truy cập chính trong hệ thống.
               Params: {} (không cần tham số)

            7. tra_cuu_tai_lieu_y_khoa
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
                case "them_thu_cung"         -> toolThemThuCung(params, userRole, username);
                case "danh_sach_thu_cung_cua_toi" -> toolDanhSachThuCungCuaToi(username);
                case "cap_nhat_benh_an"      -> toolCapNhatBenhAn(params);
                case "xem_kho_thuoc"         -> toolXemKhoThuoc((String) params.getOrDefault("tu_khoa", ""));
                case "thong_ke_doanh_thu"    -> toolThongKeDoanhThu((String) params.getOrDefault("khoang_thoi_gian", "hom_nay"));
                case "thong_ke_ca_kham_bac_si" -> toolThongKeCaKhamBacSi(params);
                case "thong_ke_khach_hang_hom_nay" -> toolThongKeKhachHangHomNay(params);
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
                
                // --- Tools điều phối lịch làm việc (Schedule & Roster) ---
                case "getStaffSchedule", "getstaffschedule", "tim_lich_lam_bac_si" -> toolGetStaffSchedule(params);
                case "getSlotUsage", "getslotusage" -> toolGetSlotUsage(params);
                case "checkConflict", "checkconflict" -> toolCheckConflict(params);
                case "findOverlapStaff", "findoverlapstaff" -> toolFindOverlapStaff(params);
                case "findFreeStaff", "findfreestaff" -> toolFindFreeStaff(params);
                case "suggestSchedule", "suggestschedule" -> toolSuggestSchedule(params);
                case "autoSchedule", "autoschedule" -> toolAutoSchedule(params);
                case "overrideDoctorSlot", "overridedoctorslot" -> toolOverrideDoctorSlot(params);
                
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
        String doctorKeyword = params != null ? Objects.toString(params.getOrDefault("tu_khoa_bac_si", ""), "").trim() : "";
        String loaiNgay = params != null ? Objects.toString(params.getOrDefault("loai_ngay", "ngay_kham"), "ngay_kham").trim().toLowerCase() : "ngay_kham";
        boolean byCreatedDate = loaiNgay.equals("ngay_tao") || loaiNgay.equals("dat_lich") || loaiNgay.equals("created");
        String dateColumn = byCreatedDate ? "lh.ngay_tao" : "lh.ngay_kham";
        LocalDate today = LocalDate.now(VN_ZONE);

        StringBuilder sql = new StringBuilder(
            "SELECT lh.id_lich_hen, kh.ten_khach_hang, kh.sdt, tc.ten_thu_cung, " +
            "dv.ten_dich_vu, nv.ho_ten AS ten_bac_si, lh.ngay_kham, lh.gio_kham, lh.trang_thai " +
            "FROM LichHen lh " +
            "JOIN KhachHang kh ON lh.id_khach_hang = kh.id_khach_hang " +
            "LEFT JOIN ThuCung tc ON lh.id_thu_cung = tc.id_thu_cung " +
            "LEFT JOIN DichVu dv ON lh.id_dich_vu = dv.id_dich_vu " +
            "LEFT JOIN NhanVien nv ON lh.id_bac_si = nv.id_nhan_vien " +
            "WHERE 1=1 "
        );
        List<Object> queryParams = new ArrayList<>();
        if (!isAll) {
            LocalDate start = switch (phamVi) {
                case "hom_qua", "yesterday" -> today.minusDays(1);
                case "hom_kia", "truoc_hom_qua" -> today.minusDays(2);
                default -> today;
            };
            sql.append("AND CAST(").append(dateColumn).append(" AS DATE) = ? ");
            queryParams.add(java.sql.Date.valueOf(start));
        }
        if (!doctorKeyword.isBlank()) {
            sql.append("AND LOWER(nv.ho_ten) LIKE LOWER(?) ");
            queryParams.add("%" + doctorKeyword + "%");
        }
        if (isAll) {
            sql.append("ORDER BY ").append(dateColumn).append(" DESC, lh.gio_kham DESC ");
        } else {
            sql.append("ORDER BY lh.gio_kham ");
        }
        sql.append("OFFSET 0 ROWS FETCH NEXT 20 ROWS ONLY");

        var rows = jdbcTemplate.queryForList(sql.toString(), queryParams.toArray());
        if (rows.isEmpty()) {
            String scope = isAll ? "trong hệ thống" : phamVi.replace("_", " ");
            String doctorText = doctorKeyword.isBlank() ? "" : " của bác sĩ khớp '" + doctorKeyword + "'";
            return "Không tìm thấy lịch hẹn" + (byCreatedDate ? " được đặt" : " khám") + doctorText + " " + scope + ".";
        }
        String scopeTitle = isAll ? "Lịch hẹn tìm thấy" : "Lịch hẹn " + phamVi.replace("_", " ");
        if (byCreatedDate) scopeTitle += " theo ngày đặt";
        if (!doctorKeyword.isBlank()) scopeTitle += " của bác sĩ khớp '" + doctorKeyword + "'";
        StringBuilder sb = new StringBuilder(scopeTitle + " (" + rows.size() + " ca):\n");
        for (var r : rows) {
            sb.append("- ").append(r.get("ngay_kham")).append(" ").append(r.get("gio_kham")).append(" | ")
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
            String sql = "SELECT id_khach_hang, ten_khach_hang, sdt, email, dia_chi, ngay_tao " +
                         "FROM KhachHang " +
                         "WHERE (da_xoa IS NULL OR LOWER(CAST(da_xoa AS varchar)) IN ('0', 'false')) " +
                         "AND CAST(ngay_tao AS DATE) = ? " +
                         "ORDER BY ngay_tao DESC OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY";
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
            "SELECT id_khach_hang, ten_khach_hang, sdt, email, dia_chi " +
            "FROM KhachHang WHERE (da_xoa IS NULL OR LOWER(CAST(da_xoa AS varchar)) IN ('0', 'false')) "
        );
        
        List<Object> args = new ArrayList<>();
        sql.append(" AND (sdt LIKE ? OR email LIKE ? OR (1=1 ");
        args.add("%" + tuKhoa.trim() + "%");
        args.add("%" + tuKhoa.trim() + "%");
        
        for (String kw : keywords) {
            sql.append(" AND LOWER(COALESCE(ten_khach_hang, '')) LIKE LOWER(?) ");
            args.add("%" + kw + "%");
        }
        sql.append(")) OFFSET 0 ROWS FETCH NEXT 20 ROWS ONLY");

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
                     "WHERE tk.trang_thai = 'Đã khóa' OR tk.trang_thai = 'inactive'";
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

    private String toolThongKeKhachHangHomNay(Map<String, Object> params) {
        LocalDate today = LocalDate.now(VN_ZONE);
        Integer newCustomerCount = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM KhachHang " +
            "WHERE (da_xoa IS NULL OR LOWER(CAST(da_xoa AS varchar)) IN ('0', 'false')) AND CAST(ngay_tao AS DATE) = ?",
            Integer.class,
            java.sql.Date.valueOf(today)
        );

        StringBuilder sb = new StringBuilder();
        sb.append("Rexi tra dữ liệu hệ thống ngày ").append(today).append(":\n");
        sb.append("- Số khách hàng mới hôm nay: ").append(Objects.requireNonNullElse(newCustomerCount, 0)).append(" khách hàng.\n");

        boolean includeTrend = params == null
            || Boolean.parseBoolean(Objects.toString(params.getOrDefault("gom_xu_huong", "true"), "true"));
        if (!includeTrend) {
            return sb.toString().trim();
        }

        List<Map<String, Object>> appointmentRows = jdbcTemplate.queryForList(
            "SELECT COALESCE(dv.ten_dich_vu, '') AS ten_dich_vu, COALESCE(lh.ly_do, '') AS ly_do " +
            "FROM LichHen lh LEFT JOIN DichVu dv ON lh.id_dich_vu = dv.id_dich_vu " +
            "WHERE lh.ngay_kham = ? " +
            "ORDER BY lh.id_lich_hen OFFSET 0 ROWS FETCH NEXT 200 ROWS ONLY",
            java.sql.Date.valueOf(today)
        );

        if (appointmentRows.isEmpty()) {
            sb.append("- Xu hướng hôm nay: chưa có lịch hẹn hôm nay trong hệ thống, nên Rexi không tính tỷ lệ xu hướng.");
            return sb.toString().trim();
        }

        Map<String, Integer> categories = new LinkedHashMap<>();
        for (Map<String, Object> row : appointmentRows) {
            String service = Objects.toString(row.get("ten_dich_vu"), "");
            String reason = Objects.toString(row.get("ly_do"), "");
            String category = classifyAppointmentTrend(service + " " + reason);
            categories.merge(category, 1, Integer::sum);
        }

        sb.append("- Xu hướng lịch hẹn hôm nay (").append(appointmentRows.size()).append(" lịch hẹn):\n");
        categories.entrySet().stream()
            .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
            .forEach(entry -> {
                int percent = Math.round((entry.getValue() * 100.0f) / appointmentRows.size());
                sb.append("  + ").append(percent).append("% ")
                    .append(entry.getKey())
                    .append(" (").append(entry.getValue()).append(" lịch hẹn)\n");
            });
        sb.append("Các tỷ lệ trên chỉ tính từ lịch hẹn có trong DB hôm nay; Rexi không suy đoán ngoài dữ liệu này.");
        return sb.toString().trim();
    }

    private String classifyAppointmentTrend(String text) {
        String q = normalizeVietnamese(Objects.toString(text, "").toLowerCase(Locale.ROOT));
        if (q.isBlank()) return "chưa rõ lý do khám";
        if (containsTrendAny(q, "cap cuu", "chan thuong", "bi thuong", "vet thuong", "gay xuong", "chay mau", "tai nan")) {
            return "khám do chấn thương/cấp cứu";
        }
        if (containsTrendAny(q, "tiem", "vacxin", "vaccine", "phong benh", "tiem chung")) {
            return "tiêm phòng/chăm sóc dự phòng";
        }
        if (containsTrendAny(q, "dinh duong", "thuc an", "an uong", "tu van")) {
            return "tư vấn dinh dưỡng/chăm sóc";
        }
        if (containsTrendAny(q, "hanh vi", "stress", "lo au", "can pha", "huan luyen")) {
            return "tư vấn hành vi";
        }
        if (containsTrendAny(q, "om", "benh", "sot", "non", "oi", "tieu chay", "bo an", "met", "ho", "viem", "ngua", "gai", "da lieu")) {
            return "khám bệnh/triệu chứng bất thường";
        }
        if (containsTrendAny(q, "tong quat", "dinh ky", "kiem tra", "kham suc khoe", "kham da khoa")) {
            return "khám tổng quát/định kỳ";
        }
        return "chưa rõ lý do khám";
    }

    private boolean containsTrendAny(String value, String... terms) {
        for (String term : terms) {
            if (value.contains(term)) return true;
        }
        return false;
    }

    private String toolTimThuCung(String tuKhoa) {
        if (tuKhoa == null || tuKhoa.trim().isEmpty()) return "Vui lòng cung cấp từ khóa tìm kiếm.";
        
        StringBuilder sql = new StringBuilder(
            "SELECT tc.id_thu_cung, tc.ten_thu_cung, tc.loai, tc.giong, " +
            "tc.trong_luong, tc.ngay_sinh, kh.ten_khach_hang, kh.sdt " +
            "FROM ThuCung tc JOIN KhachHang kh ON tc.id_khach_hang = kh.id_khach_hang " +
            "WHERE (tc.da_xoa IS NULL OR LOWER(CAST(tc.da_xoa AS varchar)) IN ('0', 'false')) "
        );
        
        String[] keywords = tuKhoa.trim().split("\\s+");
        List<Object> args = new ArrayList<>();
        
        for (String kw : keywords) {
            sql.append(" AND (LOWER(COALESCE(tc.ten_thu_cung, '')) LIKE LOWER(?) ")
               .append(" OR LOWER(COALESCE(tc.loai, '')) LIKE LOWER(?)) ");
            args.add("%" + kw + "%");
            args.add("%" + kw + "%");
        }

        sql.append(" ORDER BY tc.id_thu_cung OFFSET 0 ROWS FETCH NEXT 20 ROWS ONLY");
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

    private String toolDanhSachThuCungCuaToi(String username) {
        String customerId = resolveCustomerId(null, username);
        if (customerId == null || customerId.isBlank()) {
            return "Không xác định được tài khoản khách hàng đang đăng nhập.";
        }

        var rows = jdbcTemplate.queryForList(
            "SELECT id_thu_cung, ten_thu_cung, loai, giong, gioi_tinh, mau_sac, trong_luong, ngay_sinh, ghi_chu " +
            "FROM ThuCung WHERE id_khach_hang = ? AND (da_xoa IS NULL OR LOWER(CAST(da_xoa AS varchar)) IN ('0', 'false')) " +
            "ORDER BY ten_thu_cung ASC",
            customerId
        );

        if (rows.isEmpty()) {
            return "Tài khoản của bạn hiện chưa có thú cưng nào trong hệ thống.";
        }

        StringBuilder sb = new StringBuilder("Thú cưng của bạn hiện có " + rows.size() + " bé:\n");
        for (var row : rows) {
            sb.append("- ").append(row.get("ten_thu_cung"))
                .append(" | Loài: ").append(valueOrUnknown(row.get("loai")))
                .append(" | Giống: ").append(valueOrUnknown(row.get("giong")));
            Object gioiTinh = row.get("gioi_tinh");
            if (gioiTinh != null && !gioiTinh.toString().isBlank()) {
                sb.append(" | Giới tính: ").append(gioiTinh);
            }
            Object trongLuong = row.get("trong_luong");
            if (trongLuong != null) {
                sb.append(" | Cân nặng: ").append(trongLuong).append(" kg");
            }
            Object ngaySinh = row.get("ngay_sinh");
            if (ngaySinh != null) {
                sb.append(" | Ngày sinh: ").append(ngaySinh);
            }
            sb.append("\n");
        }
        return sb.toString();
    }

    private String valueOrUnknown(Object value) {
        String text = value == null ? "" : value.toString().trim();
        return text.isBlank() ? "Chưa cập nhật" : text;
    }

    private String toolXemBenhAn(String idThuCung) {
        String sql = "SELECT ba.ngay_kham, ba.trieu_chung, ba.chan_doan, ba.phac_do_dieu_tri, " +
                     "ba.huong_dan_cham_soc, nv.ho_ten AS ten_bac_si " +
                     "FROM HoSoBenhAn ba " +
                     "LEFT JOIN NhanVien nv ON ba.id_bac_si = nv.id_nhan_vien " +
                     "WHERE ba.id_thu_cung = ? ORDER BY ba.ngay_kham DESC OFFSET 0 ROWS FETCH NEXT 5 ROWS ONLY";
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
                "SELECT COUNT(*) FROM KhachHang WHERE id_khach_hang = ? AND (da_xoa IS NULL OR LOWER(CAST(da_xoa AS varchar)) IN ('0', 'false'))",
                Integer.class, idKhachHang);
            Integer petExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM ThuCung WHERE id_thu_cung = ? AND id_khach_hang = ? AND (da_xoa IS NULL OR LOWER(CAST(da_xoa AS varchar)) IN ('0', 'false'))",
                Integer.class, idThuCung, idKhachHang);
            Integer doctorExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM NhanVien WHERE id_nhan_vien = ? AND (da_xoa IS NULL OR LOWER(CAST(da_xoa AS varchar)) IN ('0', 'false'))",
                Integer.class, idBacSi);
            Integer serviceExists = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM DichVu WHERE id_dich_vu = ? AND (da_xoa IS NULL OR LOWER(CAST(da_xoa AS varchar)) IN ('0', 'false'))",
                Integer.class, idDichVu);

            // Null-safe validation
            if (customerExists == null || customerExists == 0) return "Lỗi đặt lịch: không tìm thấy khách hàng hợp lệ.";
            if (petExists == null || petExists == 0) return "Lỗi đặt lịch: thú cưng không thuộc khách hàng này hoặc đã bị xóa.";
            if (doctorExists == null || doctorExists == 0) return "Lỗi đặt lịch: không tìm thấy bác sĩ hợp lệ.";
            if (serviceExists == null || serviceExists == 0) return "Lỗi đặt lịch: không tìm thấy dịch vụ hợp lệ.";

            Integer thoiLuongMoi = jdbcTemplate.queryForObject(
                "SELECT thoi_luong_phut FROM DichVu WHERE id_dich_vu = ?",
                Integer.class, idDichVu);
            if (thoiLuongMoi == null || thoiLuongMoi <= 0) thoiLuongMoi = 30;
            LocalTime gioKetThuc = gioKham.plusMinutes(thoiLuongMoi);
            int gioKhamMinute = gioKham.getHour() * 60 + gioKham.getMinute();
            int gioKetThucMinute = gioKetThuc.getHour() * 60 + gioKetThuc.getMinute();

            boolean pg = DatabaseDialect.isPostgres(jdbcTemplate);
            String busyStartMinute = pg
                ? "(EXTRACT(HOUR FROM lh.gio_kham::time) * 60 + EXTRACT(MINUTE FROM lh.gio_kham::time))::int"
                : "(DATEPART(HOUR, lh.gio_kham) * 60 + DATEPART(MINUTE, lh.gio_kham))";

            // Check duplicate: cùng bác sĩ + khoảng thời gian bị chồng lấn
            Integer duplicateDoctorSlot = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM LichHen lh LEFT JOIN DichVu dv ON lh.id_dich_vu = dv.id_dich_vu " +
                "WHERE lh.ngay_kham = ? AND lh.id_bac_si = ? " +
                "AND " + busyStartMinute + " < ? " +
                "AND " + busyStartMinute + " + COALESCE(dv.thoi_luong_phut, 30) > ? " +
                "AND (lh.trang_thai IS NULL OR lh.trang_thai NOT IN ('Đã hủy', 'DA_HUY', 'da_huy', 'TU_CHOI', 'Hết hạn'))",
                Integer.class, java.sql.Date.valueOf(ngayKham), idBacSi,
                gioKetThucMinute, gioKhamMinute);
            if (duplicateDoctorSlot != null && duplicateDoctorSlot > 0) {
                return "Lỗi đặt lịch: khung giờ này bị trùng thời gian với lịch khám khác của bác sĩ đã chọn. Hãy chọn giờ khác.";
            }

            // Check duplicate: cùng thú cưng + khoảng thời gian bị chồng lấn
            Integer duplicatePetSlot = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM LichHen lh LEFT JOIN DichVu dv ON lh.id_dich_vu = dv.id_dich_vu " +
                "WHERE lh.ngay_kham = ? AND lh.id_thu_cung = ? " +
                "AND " + busyStartMinute + " < ? " +
                "AND " + busyStartMinute + " + COALESCE(dv.thoi_luong_phut, 30) > ? " +
                "AND (lh.trang_thai IS NULL OR lh.trang_thai NOT IN ('Đã hủy', 'DA_HUY', 'da_huy', 'TU_CHOI', 'Hết hạn'))",
                Integer.class, java.sql.Date.valueOf(ngayKham), idThuCung,
                gioKetThucMinute, gioKhamMinute);
            if (duplicatePetSlot != null && duplicatePetSlot > 0) {
                return "Lỗi đặt lịch: thú cưng này đã có lịch hẹn trùng khoảng thời gian. Vui lòng chọn giờ khác cho bé.";
            }

            String newId = "LH-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            String lyDo = Objects.toString(p.getOrDefault("ghi_chu", ""), "").trim();
            if (lyDo.isBlank()) lyDo = "Đặt lịch qua Rexi AI Agent";

            String sql = "INSERT INTO LichHen (id_lich_hen, id_khach_hang, id_thu_cung, id_bac_si, id_dich_vu, ngay_kham, gio_kham, ly_do, trang_thai) " +
                         "VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'CHO_XAC_NHAN')";
            jdbcTemplate.update(sql,
                newId,
                idKhachHang, idThuCung, idBacSi,
                idDichVu, java.sql.Date.valueOf(ngayKham), gioKham.toString(),
                lyDo);
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
                String sql = "SELECT lh.id_lich_hen, lh.id_khach_hang, kh.ten_khach_hang, kh.sdt, tc.ten_thu_cung, lh.ngay_kham, lh.gio_kham, lh.trang_thai " +
                        "FROM LichHen lh LEFT JOIN KhachHang kh ON lh.id_khach_hang = kh.id_khach_hang " +
                        "LEFT JOIN ThuCung tc ON lh.id_thu_cung = tc.id_thu_cung WHERE lh.id_lich_hen = ? ORDER BY lh.ngay_kham OFFSET 0 ROWS FETCH NEXT 5 ROWS ONLY";
                matches = jdbcTemplate.queryForList(sql, idLichHen);
            } else {
                StringBuilder sql = new StringBuilder(
                    "SELECT lh.id_lich_hen, lh.id_khach_hang, kh.ten_khach_hang, kh.sdt, tc.ten_thu_cung, lh.ngay_kham, lh.gio_kham, lh.trang_thai " +
                    "FROM LichHen lh LEFT JOIN KhachHang kh ON lh.id_khach_hang = kh.id_khach_hang " +
                    "LEFT JOIN ThuCung tc ON lh.id_thu_cung = tc.id_thu_cung " +
                    "WHERE lh.trang_thai NOT IN ('DA_HUY', 'Đã hủy', 'da_huy', 'TU_CHOI', 'Hết hạn') ");
                List<Object> args = new ArrayList<>();
                if (isCustomer) {
                    sql.append("AND lh.id_khach_hang = ? ");
                    args.add(customerId);
                } else if (!tuKhoaKhach.isBlank()) {
                    sql.append("AND (LOWER(COALESCE(kh.ten_khach_hang, '')) LIKE LOWER(?) OR kh.sdt LIKE ?) ");
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
                sql.append("ORDER BY lh.ngay_kham, lh.gio_kham OFFSET 0 ROWS FETCH NEXT 5 ROWS ONLY");
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
            "SELECT t.ten_thuoc, t.don_vi, t.gia_ban, " +
            "COALESCE(SUM(l.so_luong_ton), 0) AS so_luong_ton, MAX(l.han_su_dung) AS han_su_dung " +
            "FROM Thuoc t LEFT JOIN LoThuoc l ON t.id_thuoc = l.id_thuoc " +
            "WHERE (t.da_xoa IS NULL OR LOWER(CAST(t.da_xoa AS varchar)) IN ('0', 'false')) "
        );

        List<Object> args = new ArrayList<>();
        if (isSearch) {
            String[] keywords = tuKhoa.trim().split("\\s+");
            for (String kw : keywords) {
                sql.append(" AND LOWER(COALESCE(t.ten_thuoc, '')) LIKE LOWER(?) ");
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
        sql.append(" OFFSET 0 ROWS FETCH NEXT 15 ROWS ONLY");

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
        java.time.LocalDateTime compareStart = null;
        java.time.LocalDateTime compareEnd = null;
        boolean isAll = false;

        switch (khoang) {
            case "hom_qua", "yesterday" -> {
                startDate = today.minusDays(1).atStartOfDay();
                endDate = today.atStartOfDay();
                compareStart = today.minusDays(2).atStartOfDay();
                compareEnd = startDate;
            }
            case "hom_kia", "truoc_hom_qua" -> {
                startDate = today.minusDays(2).atStartOfDay();
                endDate = today.minusDays(1).atStartOfDay();
                compareStart = today.minusDays(3).atStartOfDay();
                compareEnd = startDate;
            }
            case "tuan_nay" -> {
                startDate = today.with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY)).atStartOfDay();
                endDate = startDate.plusWeeks(1);
                compareStart = startDate.minusWeeks(1);
                compareEnd = startDate;
            }
            case "thang_nay" -> {
                startDate = java.time.YearMonth.from(today).atDay(1).atStartOfDay();
                endDate = startDate.plusMonths(1);
                compareStart = startDate.minusMonths(1);
                compareEnd = startDate;
            }
            case "all", "toan_bo", "lich_su" -> {
                startDate = null;
                endDate = null;
                isAll = true;
            }
            default -> { // hom_nay
                startDate = today.atStartOfDay();
                endDate = startDate.plusDays(1);
                compareStart = today.minusDays(1).atStartOfDay();
                compareEnd = startDate;
            }
        }

        try {
            String paidFilter = "(trang_thai = 'DA_THANH_TOAN' OR trang_thai_thanh_toan = 'DA_THANH_TOAN')";
            String sql = "SELECT COUNT(*) AS so_hoa_don, COALESCE(SUM(tong_tien_cuoi), 0) AS tong_doanh_thu, " +
                          "COALESCE(AVG(tong_tien_cuoi), 0) AS trung_binh FROM HoaDon WHERE " +
                          paidFilter + (isAll ? "" : " AND ngay_lap_hoa_don >= ? AND ngay_lap_hoa_don < ?");
            var row = isAll ? jdbcTemplate.queryForMap(sql) : jdbcTemplate.queryForMap(sql, startDate, endDate);
            java.math.BigDecimal current = new java.math.BigDecimal(Objects.toString(row.get("tong_doanh_thu"), "0"));
            String compareText = "";
            if (compareStart != null && compareEnd != null) {
                String compareSql = "SELECT COALESCE(SUM(tong_tien_cuoi), 0) FROM HoaDon WHERE " + paidFilter +
                        " AND ngay_lap_hoa_don >= ? AND ngay_lap_hoa_don < ?";
                java.math.BigDecimal previous = jdbcTemplate.queryForObject(compareSql, java.math.BigDecimal.class, compareStart, compareEnd);
                previous = previous == null ? java.math.BigDecimal.ZERO : previous;
                java.math.BigDecimal diff = current.subtract(previous);
                if (previous.compareTo(java.math.BigDecimal.ZERO) > 0) {
                    java.math.BigDecimal pct = diff.multiply(java.math.BigDecimal.valueOf(100)).divide(previous, 2, java.math.RoundingMode.HALF_UP);
                    compareText = String.format(" | So với kỳ trước: %s%s VNĐ (%s%s%%)",
                            diff.signum() >= 0 ? "+" : "", diff.toPlainString(), pct.signum() >= 0 ? "+" : "", pct.toPlainString());
                } else {
                    compareText = " | Kỳ trước doanh thu = 0 nên không tính được % tăng/giảm đáng tin cậy";
                }
            }
            return String.format("Thống kê %s: %s hóa đơn | Doanh thu: %s VNĐ | TB/hóa đơn: %s VNĐ%s",
                khoang.replace("_", " "), row.get("so_hoa_don"), current.toPlainString(), row.get("trung_binh"), compareText);
        } catch (Exception e) {
            return "Lỗi thống kê: " + e.getMessage();
        }
    }

    private String toolThongKeCaKhamBacSi(Map<String, Object> params) {
        String khoang = params != null ? Objects.toString(params.getOrDefault("khoang_thoi_gian", "all"), "all").trim().toLowerCase() : "all";
        String sapXep = params != null ? Objects.toString(params.getOrDefault("sap_xep", "nhieu_nhat"), "nhieu_nhat").trim().toLowerCase() : "nhieu_nhat";
        boolean ascending = sapXep.equals("it_nhat") || sapXep.equals("it_ca") || sapXep.equals("thap_nhat");

        LocalDate today = LocalDate.now(VN_ZONE);
        StringBuilder sql = new StringBuilder(
            "SELECT COALESCE(nv.ho_ten, 'Chưa gán bác sĩ') AS ten_bac_si, " +
            "COUNT(*) AS tong_ca, " +
            "SUM(CASE WHEN lh.trang_thai = 'DA_HUY' OR lh.trang_thai = 'Đã hủy' THEN 1 ELSE 0 END) AS so_ca_huy, " +
            "SUM(CASE WHEN lh.trang_thai IS NULL OR (lh.trang_thai <> 'DA_HUY' AND lh.trang_thai <> 'Đã hủy') THEN 1 ELSE 0 END) AS so_ca_hieu_luc " +
            "FROM LichHen lh " +
            "LEFT JOIN NhanVien nv ON lh.id_bac_si = nv.id_nhan_vien " +
            "WHERE lh.id_bac_si IS NOT NULL "
        );
        List<Object> queryParams = new ArrayList<>();

        switch (khoang) {
            case "hom_nay", "today" -> {
                sql.append("AND lh.ngay_kham = ? ");
                queryParams.add(java.sql.Date.valueOf(today));
                khoang = "hom_nay";
            }
            case "tuan_nay" -> {
                LocalDate start = today.with(java.time.temporal.TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
                LocalDate end = start.plusWeeks(1);
                sql.append("AND lh.ngay_kham >= ? AND lh.ngay_kham < ? ");
                queryParams.add(java.sql.Date.valueOf(start));
                queryParams.add(java.sql.Date.valueOf(end));
            }
            case "thang_nay" -> {
                LocalDate start = java.time.YearMonth.from(today).atDay(1);
                LocalDate end = start.plusMonths(1);
                sql.append("AND lh.ngay_kham >= ? AND lh.ngay_kham < ? ");
                queryParams.add(java.sql.Date.valueOf(start));
                queryParams.add(java.sql.Date.valueOf(end));
            }
            default -> khoang = "all";
        }

        // Dùng subquery bọc ngoài để áp TOP sau ORDER BY — SQL Server không cho TOP trực tiếp với GROUP BY alias
        String innerSql = "SELECT COALESCE(nv.ho_ten, 'Chưa gán bác sĩ') AS ten_bac_si, " +
            "COUNT(*) AS tong_ca, " +
            "SUM(CASE WHEN lh.trang_thai = 'DA_HUY' OR lh.trang_thai = 'Đã hủy' THEN 1 ELSE 0 END) AS so_ca_huy, " +
            "SUM(CASE WHEN lh.trang_thai IS NULL OR (lh.trang_thai <> 'DA_HUY' AND lh.trang_thai <> 'Đã hủy') THEN 1 ELSE 0 END) AS so_ca_hieu_luc " +
            "FROM LichHen lh LEFT JOIN NhanVien nv ON lh.id_bac_si = nv.id_nhan_vien " +
            "WHERE lh.id_bac_si IS NOT NULL ";
        // Thêm điều kiện thời gian từ sql đã build (chứa WHERE ... AND ...)
        // Ta chỉ lấy phần WHERE đã append sau "WHERE lh.id_bac_si IS NOT NULL "
        String whereExtra = sql.toString().substring(sql.toString().indexOf("WHERE lh.id_bac_si IS NOT NULL ") + "WHERE lh.id_bac_si IS NOT NULL ".length());
        String finalSql = innerSql + whereExtra +
            "GROUP BY COALESCE(nv.ho_ten, 'Chưa gán bác sĩ') " +
            "ORDER BY so_ca_hieu_luc " + (ascending ? "ASC" : "DESC") +
            ", tong_ca " + (ascending ? "ASC" : "DESC") +
            ", ten_bac_si ASC " +
            "OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY";
        sql = new StringBuilder(finalSql);

        var rows = jdbcTemplate.queryForList(sql.toString(), queryParams.toArray());
        if (rows.isEmpty()) {
            return "Chưa có dữ liệu ca khám theo bác sĩ cho phạm vi " + khoang.replace("_", " ") + ".";
        }

        String title = ascending ? "Bác sĩ có ít ca khám nhất" : "Bác sĩ có nhiều ca khám nhất";
        StringBuilder sb = new StringBuilder(title + " (" + khoang.replace("_", " ") + "):\n");
        for (var row : rows) {
            sb.append("- ").append(row.get("ten_bac_si"))
                .append(": ").append(row.get("so_ca_hieu_luc")).append(" ca hiệu lực")
                .append(" / ").append(row.get("tong_ca")).append(" tổng ca");
            Object canceled = row.get("so_ca_huy");
            if (canceled != null) {
                sb.append(" | Hủy: ").append(canceled);
            }
            sb.append("\n");
        }
        return sb.toString();
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
            - Backend/src/main/java/com/rexi/pkty/service/CodeRagService.java: RAG mã nguồn động, scan Frontend/src và Backend/src để trả file/dòng/snippet đã che secret.
            - Backend/src/main/java/com/rexi/pkty/service/GroqService.java: adapter Groq, prewarm, xoay vòng/cooldown API key.
            - Backend/src/main/java/com/rexi/pkty/service/GeminiService.java: adapter Gemini cho fallback model.
            - Backend/src/main/java/com/rexi/pkty/service/OpenRouterService.java: adapter OpenRouter, provider ưu tiên đầu tiên của ReAct Agent.
            - Backend/src/main/java/com/rexi/pkty/security/RoleAccessPolicy.java: chặn/mở tool theo vai trò, không cho khách quét dữ liệu nội bộ.
            - Backend/src/main/java/com/rexi/pkty/security/SecurityConfig.java: cấu hình bảo mật, CORS và filter xác thực.

            Nguyên tắc tự nhận thức của Agent:
            - Khi admin hỏi chức năng nằm ở file nào/trang nào/dòng nào, phải dùng tool tra_cuu_ma_nguon để đọc RAG mã nguồn động và trả file + dòng gần nhất.
            - Nếu admin hỏi model/provider/key cấu hình, phải dùng tool kiem_tra_cau_hinh_ai; không bao giờ tiết lộ API key.
            - Nếu admin hỏi chức năng nào nằm ở đâu, kết hợp bản đồ kiến trúc này với RAG mã nguồn động; không bịa line nếu RAG không tìm thấy.
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
            "chatbot chat bot mic micro voice giọng nói opera speech recognition dom context prewarm tab agent trợ lý nút gửi send input shell core",
            "Frontend/src/components/chatbot/ChatBotCore.tsx; Frontend/src/components/chatbot/ChatbotShell.tsx; Frontend/src/components/ChatBot.tsx; Frontend/src/components/VoiceInput.tsx; Frontend/src/utils/agentPermissions.ts",
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
            return "Cần từ khóa để tra cứu RAG mã nguồn. Ví dụ: chatbot mic, agent model, phân quyền tool, đặt lịch, hóa đơn, nút thêm dịch vụ, api đăng nhập.";
        }

        List<Map.Entry<Integer, SourceIndexEntry>> scored = new ArrayList<>();
        for (SourceIndexEntry entry : SOURCE_INDEX) {
            int score = scoreSourceIndexEntry(query, entry);
            if (score > 0) {
                scored.add(Map.entry(score, entry));
            }
        }
        scored.sort((a, b) -> Integer.compare(b.getKey(), a.getKey()));

        StringBuilder sb = new StringBuilder();
        if (!scored.isEmpty()) {
            sb.append("Bản đồ module khớp cho \"").append(tuKhoa).append("\" (tối đa 4 mục):\n");
            int limit = Math.min(4, scored.size());
            for (int i = 0; i < limit; i++) {
                SourceIndexEntry e = scored.get(i).getValue();
                sb.append("\n").append(i + 1).append(". ").append(e.title()).append(" [").append(e.id()).append("]\n")
                    .append("- Files: ").append(e.files()).append("\n")
                    .append("- Routes/API: ").append(e.routes()).append("\n")
                    .append("- Tools/liên kết: ").append(e.tools()).append("\n")
                    .append("- Ghi chú: ").append(e.notes()).append("\n");
            }
            sb.append("\n");
        } else {
            sb.append("Bản đồ module tĩnh chưa có mục khớp. Chuyển sang RAG mã nguồn động.\n\n");
        }

        CodeRagService rag = codeRagService != null ? codeRagService : new CodeRagService();
        try {
            sb.append(rag.search(tuKhoa));
        } catch (Exception ex) {
            sb.append("RAG mã nguồn động lỗi: ").append(ex.getMessage()).append("\n");
            if (scored.isEmpty()) {
                sb.append("Không tìm thấy module khớp trong index mã nguồn whitelist cho từ khóa: ").append(tuKhoa)
                    .append(". Có thể hỏi rộng hơn theo nhóm: chatbot, agent, provider AI, phân quyền, đặt lịch, khách hàng, bệnh án, hóa đơn, kho, marketing, route frontend, health.");
            }
        }
        sb.append("\n\nLuật bảo mật: chỉ trả vị trí code, route/API và snippet ngắn đã che secret; không suy đoán API key, mật khẩu, token hay nội dung file nhạy cảm.");
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
        String sql = "SELECT hd.id_hoa_don, hd.ngay_lap_hoa_don, hd.tong_tien_cuoi, hd.trang_thai, kh.ten_khach_hang, kh.sdt " +
            "FROM HoaDon hd LEFT JOIN KhachHang kh ON hd.id_khach_hang = kh.id_khach_hang " +
            (filter ? "WHERE hd.trang_thai = ? " : "") +
            "ORDER BY hd.ngay_lap_hoa_don DESC OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY";
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
                if (!isConfirmedAccountAction(p)) {
                    return "Cần xác nhận rõ trước khi khóa/xóa tài khoản. Gửi thêm tham số xac_nhan=true sau khi admin/quản lý đã xác nhận thao tác.";
                }
                String customerId = resolveCustomerId(id, idTaiKhoan);
                if (customerId == null || customerId.isBlank()) return "Lỗi: Không tìm thấy khách hàng cần thao tác.";
                int rows = jdbcTemplate.update("UPDATE KhachHang SET da_xoa = true WHERE id_khach_hang = ?", customerId);
                jdbcTemplate.update("UPDATE TaiKhoan SET trang_thai = 'Đã khóa' WHERE id_khach_hang = ?", customerId);
                if (rows > 0) return "✅ Đã " + action.toLowerCase() + " tài khoản khách hàng " + customerId + " thành công.";
                else return "Lỗi: Không tìm thấy khách hàng ID " + customerId;
            }
            if ("MO_KHOA".equalsIgnoreCase(action) || "MOKHOA".equalsIgnoreCase(action) || "UNLOCK".equalsIgnoreCase(action)) {
                String customerId = resolveCustomerId(id, idTaiKhoan);
                if (customerId == null || customerId.isBlank()) return "Lỗi: Không tìm thấy khách hàng cần mở khóa.";
                int customerRows = jdbcTemplate.update("UPDATE KhachHang SET da_xoa = false WHERE id_khach_hang = ?", customerId);
                int accountRows = jdbcTemplate.update("UPDATE TaiKhoan SET trang_thai = 'Hoạt động' WHERE id_khach_hang = ?", customerId);
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

    private boolean isConfirmedAccountAction(Map<String, Object> params) {
        Object confirmed = params.get("xac_nhan");
        if (confirmed == null) {
            confirmed = params.get("confirm");
        }
        if (confirmed instanceof Boolean value) {
            return value;
        }
        if (confirmed instanceof String value) {
            String normalized = value.trim().toLowerCase();
            return normalized.equals("true") || normalized.equals("yes") || normalized.equals("xac_nhan");
        }
        return false;
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

    private String toolThemThuCung(Map<String, Object> p, String userRole, String username) {
        String ten = Objects.toString(p.get("ten_thu_cung"), "").trim();
        if (ten.isBlank()) {
            return "Lỗi: Thiếu tên thú cưng cần thêm.";
        }

        String role = RoleAccessPolicy.normalizeRole(userRole);
        String customerId = Objects.toString(p.get("id_khach_hang"), "").trim();
        if (RoleAccessPolicy.isCustomerRole(role) || role.isBlank()) {
            customerId = resolveCustomerId(null, username);
            if (customerId == null || customerId.isBlank()) {
                return "Lỗi: Không xác định được tài khoản khách hàng đang đăng nhập.";
            }
        } else if (customerId.isBlank()) {
            customerId = resolveCustomerId(null, username);
        }

        if (customerId == null || customerId.isBlank()) {
            return "Lỗi: Thiếu ID khách hàng để thêm thú cưng.";
        }

        Integer ownerExists = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM KhachHang WHERE id_khach_hang = ? AND (da_xoa IS NULL OR LOWER(CAST(da_xoa AS varchar)) IN ('0', 'false'))",
            Integer.class,
            customerId
        );
        if (ownerExists == null || ownerExists == 0) {
            return "Lỗi: Không tìm thấy khách hàng " + customerId + ".";
        }

        var existing = jdbcTemplate.queryForList(
            "SELECT id_thu_cung FROM ThuCung WHERE id_khach_hang = ? AND ten_thu_cung = ? AND (da_xoa IS NULL OR LOWER(CAST(da_xoa AS varchar)) IN ('0', 'false')) ORDER BY id_thu_cung OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY",
            customerId,
            ten
        );
        if (!existing.isEmpty()) {
            return "Đã có thú cưng " + ten + " trong tài khoản này. ID: " + existing.get(0).get("id_thu_cung") + ".";
        }

        String id = "TC-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String loai = Objects.toString(p.getOrDefault("loai", "Chưa xác định"), "Chưa xác định").trim();
        String giong = Objects.toString(p.getOrDefault("giong", ""), "").trim();
        String gioiTinh = Objects.toString(p.getOrDefault("gioi_tinh", "Không xác định"), "Không xác định").trim();
        String mauSac = Objects.toString(p.getOrDefault("mau_sac", ""), "").trim();
        String ghiChu = Objects.toString(p.getOrDefault("ghi_chu", "Thêm bởi Rexi Agent"), "Thêm bởi Rexi Agent").trim();
        Double trongLuong = parseDoubleOrNull(p.get("trong_luong"));
        LocalDate ngaySinh = parseDateOrNull(p.get("ngay_sinh"));

        jdbcTemplate.update(
            "INSERT INTO ThuCung (id_thu_cung, id_khach_hang, ten_thu_cung, loai, giong, ngay_sinh, gioi_tinh, mau_sac, trong_luong, ghi_chu, da_xoa, ngay_tao) " +
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, false, CURRENT_TIMESTAMP)",
            id,
            customerId,
            ten,
            loai,
            giong,
            ngaySinh,
            gioiTinh,
            mauSac,
            trongLuong,
            ghiChu
        );
        return "Đã thêm thú cưng " + ten + " cho tài khoản " + customerId + ". ID: " + id + ".";
    }

    private Double parseDoubleOrNull(Object value) {
        if (value == null) return null;
        String raw = Objects.toString(value, "").replace(",", ".").trim();
        if (raw.isBlank()) return null;
        try {
            return Double.parseDouble(raw);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private LocalDate parseDateOrNull(Object value) {
        if (value == null) return null;
        String raw = Objects.toString(value, "").trim();
        if (raw.isBlank()) return null;
        try {
            return LocalDate.parse(raw);
        } catch (Exception e) {
            return null;
        }
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
                            if (line.startsWith("📚") || line.startsWith("- Môn") || line.startsWith("  - File") || line.startsWith("  - Link mở PDF") || line.startsWith("  - Link ngoài") || line.startsWith("  - Đường dẫn") || line.startsWith("  - Từ khóa")) {
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
                         "WHERE loai = 'Tài liệu' OR ten_file LIKE '%.pdf' OR ten_file LIKE '%.docx'";
            
            List<Map<String, Object>> dbRows;
            if (isSearch) {
                String searchSql = sql + " AND (LOWER(COALESCE(ten_file, '')) LIKE LOWER(?))";
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
            if (line.startsWith("- File:") || line.startsWith("- Đường dẫn") || line.startsWith("- Link ngoài") || line.startsWith("- Từ khóa")) {
                sb.append("  ").append(line).append("\n");
                if (line.startsWith("- File:")) {
                    String fileName = line.substring("- File:".length()).trim();
                    sb.append("  - Link mở PDF: ").append(toVnuaPublicPdfUrl(fileName)).append("\n");
                }
            }
        }
        return true;
    }

    private String toVnuaPublicPdfUrl(String fileName) {
        if (fileName == null || fileName.isBlank()) {
            return "/vnua-docs/";
        }
        return "/vnua-docs/" + java.net.URLEncoder.encode(fileName, java.nio.charset.StandardCharsets.UTF_8)
                .replace("+", "%20");
    }

    // ─── Implementations: Schedule Tools ───────────────────────────────────────

    private String toolGetStaffSchedule(Map<String, Object> p) {
        String staff = Objects.toString(p.getOrDefault("staff", ""), "").trim();
        String week = Objects.toString(p.getOrDefault("week", "this"), "").trim();
        LocalDate today = LocalDate.now(VN_ZONE);
        LocalDate ws = today.with(java.time.DayOfWeek.MONDAY);
        if ("next".equals(week)) ws = ws.plusWeeks(1);
        LocalDate we = ws.plusDays(6);
        try {
            List<Object> qp = new ArrayList<>();
            StringBuilder sql = new StringBuilder(
                "SELECT l.ngay_lam, l.gio_bat_dau, l.gio_ket_thuc, l.ghi_chu, nv.ho_ten " +
                "FROM LichLamViecNhanVien l JOIN NhanVien nv ON l.id_nhan_vien = nv.id_nhan_vien " +
                "WHERE l.ngay_lam >= ? AND l.ngay_lam <= ? ");
            qp.add(java.sql.Date.valueOf(ws)); qp.add(java.sql.Date.valueOf(we));
            if (!staff.isBlank()) { sql.append("AND LOWER(nv.ho_ten) LIKE LOWER(?) "); qp.add("%" + staff + "%"); }
            sql.append("ORDER BY l.ngay_lam, l.gio_bat_dau ");
            sql.append("OFFSET 0 ROWS FETCH NEXT 20 ROWS ONLY");
            var rows = jdbcTemplate.queryForList(sql.toString(), qp.toArray());
            if (rows.isEmpty()) return "Không tìm thấy lịch làm việc" + (staff.isBlank() ? "" : " của " + staff) + " từ " + ws + " đến " + we + ".";
            StringBuilder sb = new StringBuilder("Lịch làm việc " + (staff.isBlank() ? "toàn bộ nhân sự" : staff) + " (" + ("next".equals(week) ? "tuần sau" : "tuần này") + " " + ws + " -> " + we + "):\n");
            for (var r : rows) { sb.append("- ").append(r.get("ngay_lam")).append(" | ").append(r.get("ho_ten")).append(" | ").append(r.get("gio_bat_dau")).append("-").append(r.get("gio_ket_thuc")).append("\n"); }
            return sb.toString().trim();
        } catch (Exception e) { return "Lỗi tra lịch làm việc: " + e.getMessage(); }
    }

    private String toolGetSlotUsage(Map<String, Object> p) {
        String dateStr = Objects.toString(p.getOrDefault("date", "today"), "").trim();
        String timeStr = Objects.toString(p.getOrDefault("time", ""), "").trim();
        LocalDate date = "tomorrow".equals(dateStr) ? LocalDate.now(VN_ZONE).plusDays(1) : LocalDate.now(VN_ZONE);
        if (dateStr.matches("\\d{4}-\\d{2}-\\d{2}")) { try { date = LocalDate.parse(dateStr); } catch (Exception ignored) {} }
        try {
            List<Object> qp = new ArrayList<>();
            StringBuilder sql = new StringBuilder("SELECT nv.ho_ten, l.gio_bat_dau, l.gio_ket_thuc FROM LichLamViecNhanVien l JOIN NhanVien nv ON l.id_nhan_vien = nv.id_nhan_vien WHERE CAST(l.ngay_lam AS DATE) = ? ");
            qp.add(java.sql.Date.valueOf(date));
            if (!timeStr.isBlank()) { sql.append("AND l.gio_bat_dau <= ? AND l.gio_ket_thuc >= ? "); qp.add(timeStr); qp.add(timeStr); }
            sql.append("ORDER BY l.gio_bat_dau OFFSET 0 ROWS FETCH NEXT 20 ROWS ONLY");
            var rows = jdbcTemplate.queryForList(sql.toString(), qp.toArray());
            if (rows.isEmpty()) return "Chưa có nhân sự nào đăng ký ca" + (timeStr.isBlank() ? "" : " " + timeStr) + " ngày " + date + ".";
            StringBuilder sb = new StringBuilder("Slot ngày " + date + (timeStr.isBlank() ? "" : " lúc " + timeStr) + " (" + rows.size() + " nhân sự):\n");
            for (var r : rows) sb.append("- ").append(r.get("ho_ten")).append(" (").append(r.get("gio_bat_dau")).append("-").append(r.get("gio_ket_thuc")).append(")\n");
            if (rows.size() >= 3) sb.append("⚠️ Slot đã đủ 3 nhân sự. Cần quyền quản lý/admin để override.");
            return sb.toString().trim();
        } catch (Exception e) { return "Lỗi kiểm tra slot: " + e.getMessage(); }
    }

    private String toolCheckConflict(Map<String, Object> p) {
        String staff = Objects.toString(p.getOrDefault("staff", ""), "").trim();
        String dateStr = Objects.toString(p.getOrDefault("date", "today"), "").trim();
        String timeStr = Objects.toString(p.getOrDefault("time", ""), "").trim();
        LocalDate date = "tomorrow".equals(dateStr) ? LocalDate.now(VN_ZONE).plusDays(1) : LocalDate.now(VN_ZONE);
        if (dateStr.matches("\\d{4}-\\d{2}-\\d{2}")) { try { date = LocalDate.parse(dateStr); } catch (Exception ignored) {} }
        try {
            List<Object> qp = new ArrayList<>();
            StringBuilder sql = new StringBuilder("SELECT nv.ho_ten, l.ngay_lam, l.gio_bat_dau, l.gio_ket_thuc FROM LichLamViecNhanVien l JOIN NhanVien nv ON l.id_nhan_vien = nv.id_nhan_vien WHERE CAST(l.ngay_lam AS DATE) = ? ");
            qp.add(java.sql.Date.valueOf(date));
            if (!staff.isBlank()) { sql.append("AND LOWER(nv.ho_ten) LIKE LOWER(?) "); qp.add("%" + staff + "%"); }
            if (!timeStr.isBlank()) { sql.append("AND l.gio_bat_dau <= ? AND l.gio_ket_thuc >= ? "); qp.add(timeStr); qp.add(timeStr); }
            sql.append("ORDER BY l.gio_bat_dau OFFSET 0 ROWS FETCH NEXT 10 ROWS ONLY");
            var rows = jdbcTemplate.queryForList(sql.toString(), qp.toArray());
            if (rows.isEmpty()) return "Không phát hiện xung đột lịch" + (staff.isBlank() ? "" : " cho " + staff) + " ngày " + date + ".";
            StringBuilder sb = new StringBuilder("Phát hiện " + rows.size() + " ca đã đăng ký ngày " + date + ":\n");
            for (var r : rows) sb.append("- ").append(r.get("ho_ten")).append(": ").append(r.get("gio_bat_dau")).append("-").append(r.get("gio_ket_thuc")).append("\n");
            if (rows.size() >= 3) sb.append("⚠️ Slot full (>=3 nhân sự). Cần override nếu muốn thêm.");
            return sb.toString().trim();
        } catch (Exception e) { return "Lỗi kiểm tra xung đột: " + e.getMessage(); }
    }

    private String toolFindOverlapStaff(Map<String, Object> p) {
        String week = Objects.toString(p.getOrDefault("week", "this"), "").trim();
        LocalDate ws = LocalDate.now(VN_ZONE).with(java.time.DayOfWeek.MONDAY);
        if ("next".equals(week)) ws = ws.plusWeeks(1);
        LocalDate we = ws.plusDays(6);
        try {
            String sql = "SELECT a.ngay_lam, na.ho_ten AS nhan_su, a.gio_bat_dau AS bat_a, a.gio_ket_thuc AS ket_a, b.gio_bat_dau AS bat_b, b.gio_ket_thuc AS ket_b FROM LichLamViecNhanVien a JOIN LichLamViecNhanVien b ON a.id_nhan_vien = b.id_nhan_vien AND a.ngay_lam = b.ngay_lam AND a.id_lich_lam_viec < b.id_lich_lam_viec AND a.gio_bat_dau < b.gio_ket_thuc AND b.gio_bat_dau < a.gio_ket_thuc JOIN NhanVien na ON a.id_nhan_vien = na.id_nhan_vien WHERE a.ngay_lam >= ? AND a.ngay_lam <= ? ORDER BY a.ngay_lam";
            var rows = jdbcTemplate.queryForList(sql, java.sql.Date.valueOf(ws), java.sql.Date.valueOf(we));
            if (rows.isEmpty()) return "Không phát hiện ca trùng lịch trong " + ("next".equals(week) ? "tuần sau" : "tuần này") + " (" + ws + " -> " + we + ").";
            StringBuilder sb = new StringBuilder("Phát hiện " + rows.size() + " cặp ca trùng:\n");
            for (var r : rows) sb.append("- ").append(r.get("ngay_lam")).append(" | ").append(r.get("nhan_su")).append(" | Ca A: ").append(r.get("bat_a")).append("-").append(r.get("ket_a")).append(" <-> Ca B: ").append(r.get("bat_b")).append("-").append(r.get("ket_b")).append("\n");
            return sb.toString().trim();
        } catch (Exception e) { return "Lỗi tìm ca trùng: " + e.getMessage(); }
    }

    private String toolFindFreeStaff(Map<String, Object> p) {
        String dateStr = Objects.toString(p.getOrDefault("date", "today"), "").trim();
        LocalDate date = "tomorrow".equals(dateStr) ? LocalDate.now(VN_ZONE).plusDays(1) : LocalDate.now(VN_ZONE);
        if (dateStr.matches("\\d{4}-\\d{2}-\\d{2}")) { try { date = LocalDate.parse(dateStr); } catch (Exception ignored) {} }
        try {
            var rows = jdbcTemplate.queryForList("SELECT nv.ho_ten, nv.chuc_vu FROM NhanVien nv WHERE nv.id_nhan_vien NOT IN (SELECT l.id_nhan_vien FROM LichLamViecNhanVien l WHERE CAST(l.ngay_lam AS DATE) = ?) ORDER BY nv.ho_ten", java.sql.Date.valueOf(date));
            if (rows.isEmpty()) return "Tất cả nhân sự đều có lịch ngày " + date + ". Không ai rảnh.";
            StringBuilder sb = new StringBuilder("Nhân sự rảnh ngày " + date + " (" + rows.size() + " người):\n");
            for (var r : rows) sb.append("- ").append(r.get("ho_ten")).append(" (").append(r.get("chuc_vu")).append(")\n");
            return sb.toString().trim();
        } catch (Exception e) { return "Lỗi tìm nhân sự rảnh: " + e.getMessage(); }
    }

    private String toolSuggestSchedule(Map<String, Object> p) {
        String staff = Objects.toString(p.getOrDefault("staff", ""), "").trim();
        String week = Objects.toString(p.getOrDefault("week", "next"), "").trim();
        if (staff.isBlank()) return "Thiếu tên nhân sự để gợi ý lịch. Vui lòng cung cấp tên.";
        LocalDate ws = LocalDate.now(VN_ZONE).with(java.time.DayOfWeek.MONDAY);
        if (!"this".equals(week)) ws = ws.plusWeeks(1);
        LocalDate we = ws.plusDays(6);
        try {
            var busy = jdbcTemplate.queryForList("SELECT DISTINCT CAST(l.ngay_lam AS DATE) AS d FROM LichLamViecNhanVien l JOIN NhanVien nv ON l.id_nhan_vien = nv.id_nhan_vien WHERE LOWER(nv.ho_ten) LIKE LOWER(?) AND l.ngay_lam >= ? AND l.ngay_lam <= ?", "%" + staff + "%", java.sql.Date.valueOf(ws), java.sql.Date.valueOf(we));
            Set<String> busyDays = new HashSet<>();
            for (var r : busy) busyDays.add(Objects.toString(r.get("d"), ""));
            StringBuilder sb = new StringBuilder("Gợi ý xếp lịch cho " + staff + " tuần " + ("this".equals(week) ? "nay" : "sau") + ":\n");
            boolean any = false;
            for (LocalDate d = ws; !d.isAfter(we); d = d.plusDays(1)) {
                if (d.getDayOfWeek() == java.time.DayOfWeek.SUNDAY) continue;
                if (!busyDays.contains(d.toString())) { sb.append("✅ ").append(d).append(" (").append(d.getDayOfWeek()).append(") — Rảnh, có thể xếp ca\n"); any = true; }
            }
            if (!any) sb.append("⚠️ Tuần này " + staff + " đã kín lịch cả tuần.\n");
            return sb.toString().trim();
        } catch (Exception e) { return "Lỗi gợi ý lịch: " + e.getMessage(); }
    }

    private String toolAutoSchedule(Map<String, Object> p) {
        String week = Objects.toString(p.getOrDefault("week", "next"), "").trim();
        LocalDate ws = LocalDate.now(VN_ZONE).with(java.time.DayOfWeek.MONDAY);
        if (!"this".equals(week)) ws = ws.plusWeeks(1);
        LocalDate we = ws.plusDays(6);
        try {
            var staff = jdbcTemplate.queryForList("SELECT nv.id_nhan_vien, nv.ho_ten, nv.chuc_vu FROM NhanVien nv ORDER BY nv.ho_ten");
            var existing = jdbcTemplate.queryForList("SELECT l.id_nhan_vien, CAST(l.ngay_lam AS DATE) AS d FROM LichLamViecNhanVien l WHERE l.ngay_lam >= ? AND l.ngay_lam <= ?", java.sql.Date.valueOf(ws), java.sql.Date.valueOf(we));
            Map<String, Set<String>> busyMap = new HashMap<>();
            for (var r : existing) { String sid = Objects.toString(r.get("id_nhan_vien"), ""); busyMap.computeIfAbsent(sid, k -> new HashSet<>()).add(Objects.toString(r.get("d"), "")); }
            StringBuilder sb = new StringBuilder("📋 Gợi ý lịch tự động tuần " + ("this".equals(week) ? "nay" : "sau") + " (" + ws + " -> " + we + "):\n");
            for (var s : staff) {
                String sid = Objects.toString(s.get("id_nhan_vien"), "");
                Set<String> busy = busyMap.getOrDefault(sid, new HashSet<>());
                sb.append("\n🔹 ").append(s.get("ho_ten")).append(" (").append(s.get("chuc_vu")).append("):\n");
                for (LocalDate d = ws; !d.isAfter(we); d = d.plusDays(1)) {
                    if (d.getDayOfWeek() == java.time.DayOfWeek.SUNDAY) continue;
                    sb.append("  ").append(busy.contains(d.toString()) ? "✅" : "⬜").append(" ").append(d).append("\n");
                }
            }
            sb.append("\nℹ️ (✅ đã có lịch, ⬜ chưa xếp)");
            return sb.toString().trim();
        } catch (Exception e) { return "Lỗi tự động xếp lịch: " + e.getMessage(); }
    }

    private String toolOverrideDoctorSlot(Map<String, Object> p) {
        String staff  = Objects.toString(p.getOrDefault("staff", ""), "").trim();
        String date   = Objects.toString(p.getOrDefault("date", ""), "").trim();
        String time   = Objects.toString(p.getOrDefault("time", ""), "").trim();
        String reason = Objects.toString(p.getOrDefault("reason", "Quản lý yêu cầu override"), "").trim();
        if (staff.isBlank()) return "Override thất bại: thiếu tên bác sĩ cần ép ca.";
        return String.format(
            "⚠️ XÁC NHẬN OVERRIDE:\n- Bác sĩ: %s\n- Ngày: %s\n- Ca: %s\n- Lý do: %s\n" +
            "Slot đã vượt giới hạn 3 bác sĩ. Vui lòng truy cập [/quan-ly/lich-lam-viec] để xác nhận thủ công.",
            staff, date.isBlank() ? "hôm nay" : date, time.isBlank() ? "chưa xác định" : time, reason);
    }
}
