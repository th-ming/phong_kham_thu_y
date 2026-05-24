package com.rexi.pkty.security;

import java.text.Normalizer;
import java.util.Set;

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

    private RoleAccessPolicy() {
    }

    public static boolean isInternalStaffRole(String userRole) {
        String normalized = normalizeRole(userRole);
        return !normalized.isBlank() && !CUSTOMER_ROLE_CODES.contains(normalized);
    }

    public static boolean canUseAgentTool(String userRole, String toolName) {
        return isInternalStaffRole(userRole) || CUSTOMER_SAFE_AGENT_TOOLS.contains(toolName);
    }

    public static String normalizeRole(String userRole) {
        if (userRole == null || userRole.isBlank()) return "";
        return Normalizer.normalize(userRole.trim().toLowerCase(), Normalizer.Form.NFD)
            .replaceAll("\\p{M}", "")
            .replace("đ", "d")
            .replace("-", "_")
            .replace(" ", "_");
    }
}
