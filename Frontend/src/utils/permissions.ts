import type { UserRoleCode } from "./index";

export const ROLE_GROUPS: Record<string, UserRoleCode[]> = {
  allInternal: ["admin", "quan_ly", "bac_si", "ke_toan", "tiep_tan", "y_ta", "staff"],
  dashboard: ["admin", "quan_ly", "bac_si", "ke_toan", "tiep_tan", "y_ta", "staff"],
  appointment: ["admin", "quan_ly", "staff", "bac_si", "tiep_tan", "y_ta"],
  customerAndPet: ["admin", "quan_ly", "tiep_tan", "bac_si", "y_ta"],
  clinicalRecord: ["admin", "quan_ly", "bac_si", "y_ta"],
  prescription: ["admin", "bac_si"],
  lab: ["admin", "quan_ly", "bac_si", "y_ta"],
  files: ["admin", "quan_ly", "bac_si", "y_ta"],
  invoice: ["admin", "quan_ly", "ke_toan", "tiep_tan"],
  finance: ["admin", "quan_ly", "ke_toan"],
  inventory: ["admin", "quan_ly", "ke_toan", "bac_si", "y_ta", "tiep_tan"],
  adminOnly: ["admin"],
  serviceCatalog: ["admin", "quan_ly", "tiep_tan"],
  serviceEdit: ["admin", "quan_ly"],
  marketing: ["admin", "quan_ly"],
  staffAccountManage: ["admin", "quan_ly"],
};

export const ADMIN_ROUTE_ROLES: Record<string, UserRoleCode[]> = {
  "/quan-ly/dashboard": ROLE_GROUPS.dashboard,
  "/quan-ly/khach-hang-thu-cung": ROLE_GROUPS.customerAndPet,
  "/quan-ly/lich-hen": ROLE_GROUPS.appointment,
  "/quan-ly/lich-lam-viec": ROLE_GROUPS.allInternal,
  "/quan-ly/ho-so-benh-an": ROLE_GROUPS.clinicalRecord,
  "/quan-ly/kham-benh": ROLE_GROUPS.prescription,
  "/quan-ly/chi-tiet-benh-an": ROLE_GROUPS.clinicalRecord,
  "/quan-ly/don-thuoc": ROLE_GROUPS.prescription,
  "/quan-ly/xet-nghiem": ROLE_GROUPS.lab,
  "/quan-ly/file-dinh-kem": ROLE_GROUPS.files,
  "/quan-ly/thong-tin-ca-nhan": ROLE_GROUPS.allInternal,
  "/quan-ly/hoa-don": ROLE_GROUPS.invoice,
  "/quan-ly/ke-toan": ROLE_GROUPS.finance,
  "/quan-ly/bao-cao-thong-ke": ROLE_GROUPS.finance,
  "/quan-ly/nhap-kho": ROLE_GROUPS.finance,
  "/quan-ly/kho-thuoc": ROLE_GROUPS.inventory,
  "/quan-ly/nhan-vien-phan-quyen": ROLE_GROUPS.staffAccountManage,
  "/quan-ly/cau-hinh": ROLE_GROUPS.adminOnly,
  "/quan-ly/chuc-nang": ROLE_GROUPS.adminOnly,
  "/quan-ly/dich-vu": ROLE_GROUPS.serviceCatalog,
  "/quan-ly/marketing": ROLE_GROUPS.marketing,
};

export const canAccessAdminPath = (role: UserRoleCode, path: string): boolean => {
  const normalizedPath = path.replace(/\/+$/, "");
  const exactRoles = ADMIN_ROUTE_ROLES[normalizedPath];
  if (exactRoles) return exactRoles.includes(role);

  if (normalizedPath.startsWith("/quan-ly/chi-tiet-benh-an/")) {
    return ROLE_GROUPS.clinicalRecord.includes(role);
  }

  return false;
};

export const isInternalRole = (role: UserRoleCode): boolean => {
  return ROLE_GROUPS.allInternal.includes(role);
};

/**
 * Kiểm tra exact match vai trò admin, tránh false positive với username chứa 'admin'.
 * Dùng Set.has() thay vì String.includes() để chống bypass.
 */
const DANH_SACH_QUYEN_ADMIN = new Set(['vt-1', 'vt-admin', 'vt-ql', 'admin', 'quan_tri', 'super_admin']);

export function kiemTraLaAdmin(user: Record<string, any>): boolean {
  const cacGiaTri = [
    user?.vai_tro,
    user?.role,
    user?.ten_vai_tro,
    user?.id_vai_tro,
    user?.chuc_vu,
  ]
    .filter(Boolean)
    .map((r: string) => r.toString().toLowerCase().trim())
    .filter((r: string) => r.length > 0);
  return cacGiaTri.some((r: string) => DANH_SACH_QUYEN_ADMIN.has(r));
}
