package com.rexi.pkty.security;

import java.text.Normalizer;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

// Phanquyen Rexi Agent, tool vs role FE map
public final class RoleAccessPolicy {

    public static final Set<String> CUSTOMER_SAFE_AGENT_TOOLS = Set.of(
        "tim_lich_trong",
        "huy_lich_hen",
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
        Map.entry("cap_nhat_benh_an", Set.of("bac_si", "y_ta")),
        Map.entry("xem_kho_thuoc", Set.of("admin", "quan_ly", "ke_toan", "bac_si", "y_ta", "tiep_tan")),
        Map.entry("thong_ke_doanh_thu", Set.of("admin", "quan_ly", "ke_toan")),
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
        return !normalized.isBlank() && !CUSTOMER_ROLE_CODES.contains(normalized);
    }

    public static boolean isCustomerRole(String userRole) {
        return CUSTOMER_ROLE_CODES.contains(normalizeRole(userRole));
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
            case "administrator" -> "admin";
            case "quanly", "manager" -> "quan_ly";
            case "bacsi", "doctor" -> "bac_si";
            case "ketoan", "accountant" -> "ke_toan";
            case "tieptan", "reception" -> "tiep_tan";
            case "yta", "nurse" -> "y_ta";
            case "khachhang", "customer", "vt5" -> "khach_hang";
            default -> r;
        };
    }
}
