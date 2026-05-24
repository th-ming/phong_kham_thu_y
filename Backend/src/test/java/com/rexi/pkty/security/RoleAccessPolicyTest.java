package com.rexi.pkty.security;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RoleAccessPolicyTest {

    @Test
    void customerRoleAliasesAreNeverInternalStaff() {
        assertFalse(RoleAccessPolicy.isInternalStaffRole("CUSTOMER"));
        assertFalse(RoleAccessPolicy.isInternalStaffRole("KHACH_HANG"));
        assertFalse(RoleAccessPolicy.isInternalStaffRole("khách hàng"));
        assertFalse(RoleAccessPolicy.isInternalStaffRole("VT-5"));
        assertFalse(RoleAccessPolicy.isInternalStaffRole("guest"));
        assertFalse(RoleAccessPolicy.isInternalStaffRole(null));
    }

    @Test
    void internalRolesAreStaff() {
        assertTrue(RoleAccessPolicy.isInternalStaffRole("ADMIN"));
        assertTrue(RoleAccessPolicy.isInternalStaffRole("QUAN_LY"));
        assertTrue(RoleAccessPolicy.isInternalStaffRole("BAC_SI"));
        assertTrue(RoleAccessPolicy.isInternalStaffRole("TIEP_TAN"));
        assertTrue(RoleAccessPolicy.isInternalStaffRole("VT-1"));
    }

    @Test
    void customersCanUseOnlySafeAgentTools() {
        assertTrue(RoleAccessPolicy.canUseAgentTool("CUSTOMER", "tim_lich_trong"));
        assertTrue(RoleAccessPolicy.canUseAgentTool("VT-5", "tim_kiem_web"));
        assertFalse(RoleAccessPolicy.canUseAgentTool("CUSTOMER", "tim_tai_khoan_bi_khoa"));
        assertFalse(RoleAccessPolicy.canUseAgentTool("KHACH_HANG", "thao_tac_tai_khoan"));
        assertFalse(RoleAccessPolicy.canUseAgentTool("VT-5", "xem_hoa_don"));
    }

    @Test
    void staffCanUseInternalAgentTools() {
        assertTrue(RoleAccessPolicy.canUseAgentTool("ADMIN", "tim_tai_khoan_bi_khoa"));
        assertTrue(RoleAccessPolicy.canUseAgentTool("BAC_SI", "xem_benh_an"));
        assertTrue(RoleAccessPolicy.canUseAgentTool("KE_TOAN", "xem_hoa_don"));
    }
}
