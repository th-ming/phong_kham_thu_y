import type { UserRoleCode } from "./index";
import { ROLE_GROUPS, canAccessAdminPath } from "./permissions";

// * Tool Agent / truy vấn nội bộ — khớp RoleAccessPolicy backend
export const AGENT_TOOL_ROLES: Record<string, UserRoleCode[]> = {
  tim_lich_hen_hom_nay: ROLE_GROUPS.appointment,
  tim_khach_hang: ROLE_GROUPS.customerAndPet,
  tim_thu_cung: ROLE_GROUPS.customerAndPet,
  xem_benh_an: ROLE_GROUPS.clinicalRecord,
  tim_lich_trong: [...ROLE_GROUPS.allInternal, "khach_hang"],
  dat_lich_hen: ROLE_GROUPS.appointment,
  huy_lich_hen: [...ROLE_GROUPS.appointment, "khach_hang"],
  cap_nhat_benh_an: ["bac_si", "y_ta"],
  xem_kho_thuoc: ROLE_GROUPS.inventory,
  thong_ke_doanh_thu: ROLE_GROUPS.finance,
  tim_kiem_web: [...ROLE_GROUPS.allInternal, "khach_hang"],
  gui_email_don_le: ROLE_GROUPS.marketing,
  kiem_tra_cau_hinh_ai: ROLE_GROUPS.adminOnly,
  kiem_tra_kien_truc_he_thong: ROLE_GROUPS.adminOnly,
  tra_cuu_ma_nguon: ROLE_GROUPS.adminOnly,
  kiem_tra_phan_he: [...ROLE_GROUPS.allInternal, "khach_hang"],
  xem_hoa_don: ROLE_GROUPS.invoice,
  thao_tac_tai_khoan: ROLE_GROUPS.staffAccountManage,
  tim_tai_khoan_bi_khoa: ROLE_GROUPS.staffAccountManage,
  tra_cuu_tai_lieu_y_khoa: [...ROLE_GROUPS.allInternal, "khach_hang"],
};

export const CUSTOMER_SAFE_AGENT_TOOLS = new Set([
  "tim_lich_trong",
  "huy_lich_hen",
  "tim_kiem_web",
  "kiem_tra_phan_he",
  "tra_cuu_tai_lieu_y_khoa", // đồng bộ với backend — có output filter riêng cho khách hàng
]);

export const canUseAgentTool = (role: UserRoleCode, toolName: string): boolean => {
  if (role === "khach_hang" || !ROLE_GROUPS.allInternal.includes(role)) {
    return CUSTOMER_SAFE_AGENT_TOOLS.has(toolName);
  }
  const allowed = AGENT_TOOL_ROLES[toolName];
  return Boolean(allowed?.includes(role));
};

export const canAgentQueryKhachHang = (role: UserRoleCode) =>
  ROLE_GROUPS.customerAndPet.includes(role);

export const canAgentQueryLichHenHomNay = (role: UserRoleCode) =>
  ROLE_GROUPS.appointment.includes(role);

export const canAgentQueryKhoThuoc = (role: UserRoleCode) =>
  ROLE_GROUPS.inventory.includes(role);

export const canAgentQueryDoanhThu = (role: UserRoleCode) =>
  ROLE_GROUPS.finance.includes(role);

export const canAgentQueryThuCung = (role: UserRoleCode) =>
  ROLE_GROUPS.customerAndPet.includes(role);

export const canAgentQueryBenhAn = (role: UserRoleCode) =>
  ROLE_GROUPS.clinicalRecord.includes(role);

export const canAgentUseMarketingSwarm = (role: UserRoleCode) =>
  ROLE_GROUPS.marketing.includes(role);

export const canAgentNavigateHoaDon = (role: UserRoleCode) =>
  canAccessAdminPath(role, "/quan-ly/hoa-don");

export const agentPermissionDeniedMessage = (action: string) =>
  `Tài khoản của bạn không có quyền ${action}. Vui lòng dùng đúng phân hệ trên menu hoặc liên hệ Quản trị để được cấp quyền.`;
