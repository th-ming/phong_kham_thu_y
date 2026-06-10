package com.rexi.pkty.security;

import java.text.Normalizer;
import java.util.Map;
import java.util.Set;

// Phanquyen Rexi Agent, tool vs role FE map
public final class RoleAccessPolicy {

    public static final Set<String> CUSTOMER_SAFE_AGENT_TOOLS = Set.of(
        "tim_lich_trong",
        "huy_lich_hen",
        "them_thu_cung",
        "danh_sach_thu_cung_cua_toi",
        "getslotusage",
        "tim_kiem_web",
        "kiem_tra_phan_he",
        "tra_cuu_tai_lieu_y_khoa"
    );

    private static final Set<String> CUSTOMER_ROLE_CODES = Set.of(
        "customer",
        "khach_hang",
        "khachhang",
        "guest",
        "anonymous",
        "vt_5"
    );

    private static final Set<String> INTERNAL_ROLE_CODES = Set.of(
        "admin",
        "quan_ly",
        "staff",
        "bac_si",
        "ke_toan",
        "tiep_tan",
        "y_ta"
    );

    /** Vai trò nội bộ được phép theo từng tool */
    private static final Map<String, Set<String>> TOOL_ROLES = Map.ofEntries(
        Map.entry("tim_lich_hen_hom_nay", Set.of("admin", "quan_ly", "staff", "bac_si", "tiep_tan", "y_ta")),
        // staff được tìm khách hàng (read-only) để xác minh khi hủy lịch
        Map.entry("tim_khach_hang", Set.of("admin", "quan_ly", "tiep_tan", "bac_si", "y_ta", "staff")),
        Map.entry("tim_thu_cung", Set.of("admin", "quan_ly", "tiep_tan", "bac_si", "y_ta")),
        Map.entry("xem_benh_an", Set.of("admin", "quan_ly", "bac_si", "y_ta")),
        // Khách hàng KHÔNG có trong TOOL_ROLES — khách được xử lý qua CUSTOMER_SAFE_AGENT_TOOLS riêng
        Map.entry("tim_lich_trong", Set.of("admin", "quan_ly", "staff", "bac_si", "ke_toan", "tiep_tan", "y_ta")),
        Map.entry("dat_lich_hen", Set.of("admin", "quan_ly", "staff", "bac_si", "tiep_tan", "y_ta")),
        Map.entry("huy_lich_hen", Set.of("admin", "quan_ly", "staff", "bac_si", "tiep_tan", "y_ta")),
        Map.entry("them_thu_cung", Set.of("admin", "quan_ly", "staff", "tiep_tan")),
        Map.entry("cap_nhat_benh_an", Set.of("bac_si", "y_ta")),
        Map.entry("xem_kho_thuoc", Set.of("admin", "quan_ly", "ke_toan", "bac_si", "y_ta", "tiep_tan")),
        Map.entry("thong_ke_doanh_thu", Set.of("admin", "quan_ly", "ke_toan")),
        Map.entry("thong_ke_ca_kham_bac_si", Set.of("admin", "quan_ly", "staff", "bac_si", "tiep_tan", "y_ta")),
        Map.entry("tim_lich_lam_bac_si", Set.of("admin", "quan_ly", "staff", "bac_si", "tiep_tan", "y_ta")),
        Map.entry("getstaffschedule", Set.of("admin", "quan_ly", "staff", "bac_si", "tiep_tan", "y_ta", "ke_toan")),
        Map.entry("getslotusage", Set.of("admin", "quan_ly", "staff", "bac_si", "tiep_tan", "y_ta")),
        Map.entry("findoverlapstaff", Set.of("admin", "quan_ly", "staff", "bac_si", "tiep_tan", "y_ta")),
        Map.entry("suggestschedule", Set.of("admin", "quan_ly", "staff", "tiep_tan")),
        Map.entry("checkconflict", Set.of("admin", "quan_ly", "staff", "bac_si", "tiep_tan", "y_ta")),
        Map.entry("findfreestaff", Set.of("admin", "quan_ly", "staff", "ke_toan", "tiep_tan")),
        Map.entry("autoschedule", Set.of("admin", "quan_ly")),
        Map.entry("overridedoctorslot", Set.of("admin", "quan_ly")),
        Map.entry("thong_ke_khach_hang_hom_nay", Set.of("admin", "quan_ly", "staff", "tiep_tan")),
        Map.entry("tim_kiem_web", Set.of("admin", "quan_ly", "staff", "bac_si", "ke_toan", "tiep_tan", "y_ta")),
        Map.entry("gui_email_don_le", Set.of("admin", "quan_ly")),
        Map.entry("kiem_tra_cau_hinh_ai", Set.of("admin")),
        Map.entry("kiem_tra_kien_truc_he_thong", Set.of("admin")),
        Map.entry("tra_cuu_ma_nguon", Set.of("admin")),
        Map.entry("kiem_tra_phan_he", Set.of("admin", "quan_ly", "staff", "bac_si", "ke_toan", "tiep_tan", "y_ta")),
        Map.entry("xem_hoa_don", Set.of("admin", "quan_ly", "ke_toan", "tiep_tan")),
        Map.entry("thao_tac_tai_khoan", Set.of("admin", "quan_ly")),
        Map.entry("tim_tai_khoan_bi_khoa", Set.of("admin", "quan_ly")),
        Map.entry("tra_cuu_tai_lieu_y_khoa", Set.of("admin", "quan_ly", "staff", "bac_si", "ke_toan", "tiep_tan", "y_ta"))
    );

    private RoleAccessPolicy() {
    }

    public static boolean isInternalStaffRole(String userRole) {
        String normalized = normalizeRole(userRole);
        return INTERNAL_ROLE_CODES.contains(normalized);
    }

    public static boolean isCustomerRole(String userRole) {
        return CUSTOMER_ROLE_CODES.contains(normalizeRole(userRole));
    }

    public static boolean isClinicalRole(String userRole) {
        String normalized = normalizeRole(userRole);
        return normalized.equals("bac_si") || normalized.equals("y_ta");
    }

    public static String displayRoleName(String userRole) {
        return switch (normalizeRole(userRole)) {
            case "admin" -> "Quản trị viên";
            case "quan_ly" -> "Quản lý";
            case "bac_si" -> "Bác sĩ";
            case "ke_toan" -> "Kế toán";
            case "tiep_tan" -> "Tiếp tân";
            case "y_ta" -> "Y tá";
            case "staff" -> "Nhân viên";
            default -> "Khách hàng";
        };
    }

    public static String roleWorkProfile(String userRole) {
        return switch (normalizeRole(userRole)) {
            case "admin" ->
                "Admin hệ thống: cấu hình, phân quyền, kiểm tra lỗi hệ thống, dữ liệu toàn cục và tác vụ quản trị.";
            case "quan_ly" ->
                "Quản lý phòng khám: vận hành, nhân sự, lịch hẹn, khách hàng, báo cáo và điều phối công việc.";
            case "bac_si" ->
                "Bác sĩ thú y: khám bệnh, bệnh án, chẩn đoán, xét nghiệm, đơn thuốc và quyết định chuyên môn lâm sàng.";
            case "y_ta" ->
                "Y tá thú y: hỗ trợ bác sĩ, chăm sóc sau điều trị, theo dõi dấu hiệu, chuẩn bị ca khám và cập nhật theo chỉ định.";
            case "ke_toan" ->
                "Kế toán: hóa đơn, thanh toán, doanh thu, đối soát, báo cáo tài chính và nghiệp vụ thu phí.";
            case "tiep_tan" ->
                "Tiếp tân: đặt lịch, xác nhận khách hàng, hồ sơ khách/thú cưng, hướng dẫn khách và điều phối quầy.";
            case "staff" ->
                "Nhân viên nội bộ: hỗ trợ vận hành phòng khám theo quyền được cấp.";
            default ->
                "Khách hàng/chủ nuôi: tư vấn chăm sóc thú cưng, đặt lịch và tra cứu thông tin cá nhân được phép.";
        };
    }

    public static String rolePromptGuidance(String userRole) {
        return switch (normalizeRole(userRole)) {
            case "admin" ->
                "ADMIN_GUIDE: Nói như trợ lý quản trị hệ thống. Hỗ trợ cấu hình, phân quyền, AI provider, lỗi hệ thống, tài khoản và dữ liệu toàn cục. Khi hỏi số liệu/trạng thái hệ thống phải dùng DB/tool thật; nếu chưa gọi tool thì nói chưa kiểm tra. Thao tác nhạy cảm như xóa, khóa tài khoản, sửa hóa đơn, đổi cấu hình phải yêu cầu xác nhận rõ.";
            case "quan_ly" ->
                "MANAGER_GUIDE: Nói như trợ lý vận hành cho quản lý phòng khám. Ưu tiên lịch hẹn, khách hàng, nhân sự, ca khám, báo cáo, điều phối và rủi ro vận hành. Số liệu/xu hướng/doanh thu phải lấy từ DB/tool thật; không tự ước lượng. Câu y khoa chuyên sâu thì chuyển bác sĩ/y tá.";
            case "bac_si" ->
                "CLINICAL_GUIDE: Người dùng là bác sĩ. Được hỗ trợ lâm sàng chuyên sâu: chẩn đoán phân biệt, xét nghiệm cần cân nhắc, phân tích kết quả, nhóm thuốc/phác đồ tham khảo, chống chỉ định, checklist theo dõi, ghi chú bệnh án và dặn dò chủ nuôi. Luôn coi là tham khảo chuyên môn; quyết định cuối dựa trên khám trực tiếp, cân nặng, tuổi, tiền sử và xét nghiệm. Không bịa bệnh án/kết quả/đơn thuốc nếu chưa đọc DB/tool.";
            case "y_ta" ->
                "CLINICAL_GUIDE: Người dùng là y tá. Hỗ trợ lâm sàng theo vai trò chăm sóc và theo dõi: checklist dấu hiệu sinh tồn, chăm sóc sau điều trị, chuẩn bị ca khám, ghi nhận triệu chứng, dấu hiệu cần báo bác sĩ, dặn dò chủ nuôi theo chỉ định. Không tự kê thuốc, không đổi liều, không tự quyết phác đồ. Không bịa bệnh án/kết quả/đơn thuốc nếu chưa đọc DB/tool.";
            case "ke_toan" ->
                "ACCOUNTING_GUIDE: Người dùng là kế toán. Ưu tiên hóa đơn, thanh toán, doanh thu, đối soát, công nợ, báo cáo tài chính và thu phí. Chỉ xác nhận số liệu/trạng thái thanh toán khi đã đọc DB/tool thật. Không tư vấn lâm sàng chuyên sâu; phần y khoa chuyển bác sĩ/y tá.";
            case "tiep_tan" ->
                "RECEPTION_GUIDE: Người dùng là tiếp tân. Ưu tiên đặt/đổi/hủy lịch theo quyền, xác nhận khách hàng, hồ sơ khách/thú cưng, tra lịch trống, hướng dẫn khách, bảng giá, hotline và điều phối quầy. Nếu thiếu tên khách, SĐT, tên thú cưng hoặc mã lịch hẹn thì hỏi đúng thông tin còn thiếu. Không nói đã đặt/hủy lịch nếu chưa có tool/action thật.";
            case "staff" ->
                "STAFF_GUIDE: Người dùng là nhân viên nội bộ. Hỗ trợ vận hành theo quyền được cấp, hướng dẫn dùng hệ thống, tóm tắt/viết lại nội dung và chuyển việc vượt quyền cho vai trò phù hợp. Không đối xử như khách hàng và không vượt quyền.";
            default ->
                "CUSTOMER_GUIDE: Người dùng là khách hàng/chủ nuôi. Giữ format khách hàng hiện có: tư vấn chăm sóc thú cưng an toàn, đặt lịch, tra thông tin cá nhân được phép, không kê đơn/kháng sinh/liều dùng, không lộ dữ liệu nội bộ.";
        };
    }

    public static boolean canUseAgentTool(String userRole, String toolName) {
        if (toolName == null || toolName.isBlank()) {
            return false;
        }
        String normalizedTool = toolName.trim().toLowerCase();
        String role = normalizeRole(userRole);

        if (role.isBlank() || CUSTOMER_ROLE_CODES.contains(role)) {
            return CUSTOMER_SAFE_AGENT_TOOLS.contains(normalizedTool);
        }

        Set<String> allowed = TOOL_ROLES.get(normalizedTool);
        return allowed != null && allowed.contains(role);
    }

    /**
     * Trả về thông báo từ chối quyền thân thiện theo vai trò người dùng.
     * Không lộ tên tool kỹ thuật nội bộ ra ngoài với khách hàng.
     */
    public static String permissionDeniedMessage(String toolName) {
        return permissionDeniedMessage(toolName, null);
    }

    public static String permissionDeniedMessage(String toolName, String userRole) {
        String normalized = normalizeRole(userRole);
        // Thông báo thân thiện cho khách hàng — không lộ tên tool kỹ thuật
        if (normalized.isBlank() || CUSTOMER_ROLE_CODES.contains(normalized)) {
            return switch (toolName) {
                case "xem_benh_an", "cap_nhat_benh_an" ->
                    "Thông tin bệnh án chỉ dành cho đội ngũ y tế của phòng khám. Bạn có thể xem lịch sử khám của thú cưng trực tiếp trên trang tài khoản.";
                case "thong_ke_doanh_thu", "xem_hoa_don" ->
                    "Thông tin tài chính không khả dụng. Nếu cần tra cứu hóa đơn, vui lòng liên hệ lễ tân phòng khám.";
                case "tim_khach_hang", "tim_thu_cung" ->
                    "Bạn chỉ có thể xem thông tin của chính mình. Hãy vào trang Tài khoản để kiểm tra.";
                case "thao_tac_tai_khoan", "tim_tai_khoan_bi_khoa" ->
                    "Tính năng quản lý tài khoản chỉ dành cho quản trị viên. Nếu tài khoản bạn gặp sự cố, vui lòng liên hệ hotline phòng khám.";
                case "xem_kho_thuoc" ->
                    "Thông tin kho thuốc chỉ dành cho nhân viên nội bộ. Bạn có thể hỏi trực tiếp bác sĩ về loại thuốc phù hợp cho thú cưng.";
                case "dat_lich_hen" ->
                    "Để đặt lịch khám, bạn vui lòng sử dụng tính năng Đặt lịch trên trang chủ hoặc liên hệ lễ tân.";
                default ->
                    "Tính năng này không khả dụng với tài khoản của bạn. Vui lòng liên hệ phòng khám để được hỗ trợ.";
            };
        }
        // Thông báo chi tiết hơn cho nội bộ — có thể thấy tên quyền
        return switch (toolName) {
            case "kiem_tra_cau_hinh_ai", "kiem_tra_kien_truc_he_thong", "tra_cuu_ma_nguon" ->
                "Tính năng này chỉ dành cho Admin hệ thống. Liên hệ IT nếu cần được cấp quyền.";
            case "thong_ke_doanh_thu" ->
                "Báo cáo doanh thu chỉ dành cho Admin, Quản lý và Kế toán.";
            case "thong_ke_ca_kham_bac_si" ->
                "Thống kê ca khám theo bác sĩ chỉ dành cho nhân sự vận hành và chuyên môn nội bộ.";
            case "tim_lich_lam_bac_si", "getstaffschedule", "getslotusage", "findoverlapstaff", "suggestschedule", "checkconflict", "findfreestaff", "autoschedule" ->
                "Điều phối lịch làm việc chỉ dành cho nhân sự vận hành và chuyên môn nội bộ.";
            case "overridedoctorslot" ->
                "Override giới hạn slot bác sĩ chỉ dành cho Admin và Quản lý.";
            case "thong_ke_khach_hang_hom_nay" ->
                "Thống kê khách hàng và xu hướng hôm nay chỉ dành cho nhân sự vận hành nội bộ.";
            case "thao_tac_tai_khoan", "tim_tai_khoan_bi_khoa" ->
                "Thao tác tài khoản chỉ dành cho Admin và Quản lý.";
            case "gui_email_don_le" ->
                "Gửi email chỉ dành cho Admin và Quản lý.";
            case "cap_nhat_benh_an" ->
                "Cập nhật bệnh án chỉ dành cho Bác sĩ và Y tá phụ trách.";
            case "xem_benh_an" ->
                "Bệnh án là thông tin y tế mật, chỉ bác sĩ, y tá và quản lý được xem.";
            default ->
                "Vai trò hiện tại chưa được cấp quyền thực hiện tác vụ này. Liên hệ Admin để được hỗ trợ.";
        };
    }

    public static String normalizeRole(String userRole) {
        if (userRole == null || userRole.isBlank()) return "";
        String r = Normalizer.normalize(userRole.trim().toLowerCase(), Normalizer.Form.NFD)
            .replaceAll("\\p{M}", "")
            .replace("đ", "d")
            .replace("-", "_")
            .replace(" ", "_");
        return switch (r) {
            case "administrator", "vt_1", "vt_admin" -> "admin";
            case "quanly", "manager", "vt_6", "vt_ql" -> "quan_ly";
            case "bacsi", "doctor", "vt_2", "vt_bs" -> "bac_si";
            case "ketoan", "accountant", "vt_4", "vt_kt" -> "ke_toan";
            case "tieptan", "letan", "reception", "vt_7", "vt_tt" -> "tiep_tan";
            case "yta", "dieuduong", "nurse", "vt_8", "vt_yt" -> "y_ta";
            case "khachhang", "customer", "vt_5", "vt5" -> "khach_hang";
            case "nhanvien", "employee", "vt_3", "vt_nv" -> "staff";
            default -> r;
        };
    }
}
