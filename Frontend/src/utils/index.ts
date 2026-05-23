export const formatTienVND = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount)
}

export const formatNgayThang = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('vi-VN')
}

export const formatGio = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleTimeString('vi-VN')
}

export const kiemTraEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

export const kiemTraSDT = (sdt: string): boolean => {
  const regex = /^(0|\+84)(\d{9,10})$/
  return regex.test(sdt)
}

export const layTenTuEmail = (email: string): string => {
  return email.split('@')[0]
}

export const normalizeSearchText = (value: unknown): string => {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const tokenizeSearchText = (value: unknown): string[] => {
  return normalizeSearchText(value)
    .split(" ")
    .map(token => token.trim())
    .filter(token => token.length > 0);
}

const getEditDistance = (a: string, b: string): number => {
  if (a === b) return 0;
  if (!a || !b) return Math.max(a.length, b.length);
  if (Math.abs(a.length - b.length) > 2) return 3;

  const previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  const current = new Array(b.length + 1).fill(0);

  for (let i = 1; i <= a.length; i++) {
    current[0] = i;
    let rowMin = current[0];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + cost
      );
      rowMin = Math.min(rowMin, current[j]);
    }
    if (rowMin > 2) return 3;
    for (let j = 0; j <= b.length; j++) previous[j] = current[j];
  }

  return previous[b.length];
}

const isCloseSearchToken = (queryToken: string, fieldToken: string): boolean => {
  if (!queryToken || !fieldToken) return false;
  if (fieldToken.includes(queryToken) || queryToken.includes(fieldToken)) return true;
  if (queryToken.length < 4 || fieldToken.length < 4) return false;

  const tolerance = queryToken.length >= 7 ? 2 : 1;
  return getEditDistance(queryToken, fieldToken) <= tolerance;
}

export type UserRoleCode = "admin" | "quan_ly" | "bac_si" | "ke_toan" | "tiep_tan" | "y_ta" | "staff" | "khach_hang" | "guest";

export const normalizeUserRole = (user: any): UserRoleCode => {
  const source = normalizeSearchText([
    user?.loai_tai_khoan,
    user?.ten_vai_tro,
    user?.id_vai_tro,
    user?.role,
    user?.quyen,
    user?.chuc_vu
  ].filter(Boolean).join(" "));

  if (!source) return "guest";
  if (source.includes("vt-1") || source.includes("admin") || source.includes("quan tri")) return "admin";
  if (source.includes("vt-6") || source.includes("quan_ly") || source.includes("quan ly") || source.includes("manager")) return "quan_ly";
  if (source.includes("vt-2") || source.includes("bac_si") || source.includes("bac si") || source.includes("doctor")) return "bac_si";
  if (source.includes("vt-4") || source.includes("ke_toan") || source.includes("ke toan") || source.includes("accountant")) return "ke_toan";
  if (source.includes("vt-7") || source.includes("tiep_tan") || source.includes("tiep tan") || source.includes("le tan") || source.includes("reception")) return "tiep_tan";
  if (source.includes("vt-8") || source.includes("y_ta") || source.includes("y ta") || source.includes("dieu duong") || source.includes("nurse")) return "y_ta";
  if (source.includes("vt-5") || source.includes("khach_hang") || source.includes("khach hang") || source.includes("customer") || user?.id_khach_hang) return "khach_hang";
  if (source.includes("vt-3") || source.includes("nhan vien") || source.includes("staff")) return "staff";

  return user?.id_nhan_vien ? "staff" : "guest";
};

export const hasAnyRole = (user: any, roles: string[]): boolean => {
  const role = normalizeUserRole(user);
  return roles.map(r => normalizeSearchText(r).replace("khach hang", "khach_hang")).includes(role);
};

export const includesSearch = (value: unknown, query: string): boolean => {
  return matchesSearchFields(query, [value]);
}

export const matchesSearchFields = (query: string, fields: unknown[]): boolean => {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return true;

  const normalizedFields = fields.map(field => normalizeSearchText(field)).filter(Boolean);
  if (normalizedFields.some(field => field.includes(normalizedQuery))) return true;

  const queryTokens = tokenizeSearchText(query);
  if (queryTokens.length === 0) return true;

  const combinedFieldText = normalizedFields.join(" ");
  const fieldTokens = tokenizeSearchText(combinedFieldText);
  if (fieldTokens.length === 0) return false;

  return queryTokens.every(queryToken =>
    combinedFieldText.includes(queryToken) ||
    fieldTokens.some(fieldToken => isCloseSearchToken(queryToken, fieldToken))
  );
}

export const chuyenNgayISO_SangVN = (dateString: string): string => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN').format(date);
};

export const getUserProfile = () => {
  try {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error("Lỗi đọc user từ localStorage:", error);
    return null;
  }
};

/**
 * Tạo Slug chuẩn SEO từ tên dịch vụ
 * Loại bỏ dấu, ký tự đặc biệt và khoảng trắng
 */
export const generateSlug = (str: string): string => {
  if (!str) return "";
  return str.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, 'd')
    .replace(/&/g, 'va')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
};
