package com.rexi.pkty.security;

import java.text.Normalizer;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

/**
 * Phân quyền Rexi Agent — truy vấn và thao tác tool theo vai trò (khớp Frontend permissions.ts).
 */
public final class RoleAccessPolicy {

    public static final Set<String> CUSTOMER_SAFE_AGENT_TOOLS = Set.of(
        "tim_lich_trong",
        "tim_kiem_web",
        "kiem_tra_phan_he"
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
        Map.entry("tim_khach_hang", Set.of("admin", "quan_ly", "tiep_tan", "bac_si", "y_ta")),
        Map.entry("tim_thu_cung", Set.of("admin", "quan_ly", "tiep_tan", "bac_si", "y_ta")),
        Map.entry("xem_benh_an", Set.of("admin", "quan_ly", "bac_si", "y_ta")),
        Map.entry("tim_lich_trong", Set.of("admin", "quan_ly", "staff", "bac_si", "ke_toan", "tiep_tan", "y_ta", "khach_hang")),
        Map.entry("dat_lich_hen", Set.of("admin", "quan_ly", "staff", "bac_si", "tiep_tan", "y_ta")),
        Map.entry("xem_kho_thuoc", Set.of("admin", "quan_ly", "ke_toan", "bac_si", "y_ta", "tiep_tan")),
        Map.entry("thong_ke_doanh_thu", Set.of("admin", "quan_ly", "ke_toan")),
        Map.entry("tim_kiem_web", Set.of("admin", "quan_ly", "staff", "bac_si", "ke_toan", "tiep_tan", "y_ta", "khach_hang")),
        Map.entry("gui_email_don_le", Set.of("admin", "quan_ly")),
        Map.entry("kiem_tra_cau_hinh_ai", Set.of("admin")),
        Map.entry("kiem_tra_phan_he", Set.of("admin", "quan_ly", "staff", "bac_si", "ke_toan", "tiep_tan", "y_ta", "khach_hang")),
        Map.entry("xem_hoa_don", Set.of("admin", "quan_ly", "ke_toan", "tiep_tan")),
        Map.entry("thao_tac_tai_khoan", Set.of("admin", "quan_ly")),
        Map.entry("tim_tai_khoan_bi_khoa", Set.of("admin", "quan_ly"))
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

    public static String permissionDeniedMessage(String toolName) {
        return "Tài khoản hiện tại không có quyền dùng tool \"" + toolName
            + "\". Chỉ được truy vấn/thao tác trong phạm vi vai trò được cấp trên hệ thống.";
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
