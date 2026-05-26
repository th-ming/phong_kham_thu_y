package com.rexi.pkty.security;

// SpEL expressions cho @PreAuthorize, map role JWT vs permission FE
public final class RexiSecurityRoles {

    public static final String AUTHENTICATED = "isAuthenticated()";

    /** Báo cáo tài chính, doanh thu */
    public static final String FINANCE_READ =
            "hasAnyRole('ADMIN', 'QUAN_LY', 'KE_TOAN')";

    /** Hóa đơn nội bộ (danh sách / đối soát) */
    public static final String INVOICE_READ =
            "hasAnyRole('ADMIN', 'QUAN_LY', 'KE_TOAN', 'TIEP_TAN')";

    /** Cập nhật trạng thái hóa đơn */
    public static final String INVOICE_WRITE =
            "hasAnyRole('ADMIN', 'QUAN_LY', 'KE_TOAN', 'TIEP_TAN')";

    /** Kho thuốc, lô thuốc, nhập kho */
    public static final String INVENTORY_READ =
            "hasAnyRole('ADMIN', 'QUAN_LY', 'KE_TOAN', 'BAC_SI', 'Y_TA', 'TIEP_TAN')";

    public static final String INVENTORY_WRITE =
            "hasAnyRole('ADMIN', 'QUAN_LY', 'KE_TOAN')";

    /** Khách hàng & tra cứu CRM */
    public static final String CUSTOMER_PET_READ =
            "hasAnyRole('ADMIN', 'QUAN_LY', 'TIEP_TAN', 'BAC_SI', 'Y_TA')";

    /** Lịch hẹn nội bộ (danh sách / hôm nay) */
    public static final String APPOINTMENT_READ =
            "hasAnyRole('ADMIN', 'QUAN_LY', 'STAFF', 'BAC_SI', 'TIEP_TAN', 'Y_TA')";

    /** Hồ sơ bệnh án */
    public static final String CLINICAL_READ =
            "hasAnyRole('ADMIN', 'QUAN_LY', 'BAC_SI', 'Y_TA')";

    public static final String CLINICAL_WRITE =
            "hasAnyRole('ADMIN', 'QUAN_LY', 'BAC_SI', 'Y_TA')";

    /** Rexi Agent nội bộ (ReAct / tool / swarm) */
    public static final String INTERNAL_AGENT =
            "hasAnyRole('ADMIN', 'QUAN_LY', 'KE_TOAN', 'BAC_SI', 'TIEP_TAN', 'Y_TA', 'STAFF')";

    /** Marketing swarm */
    public static final String MARKETING =
            "hasAnyRole('ADMIN', 'QUAN_LY')";

    private RexiSecurityRoles() {
    }
}
