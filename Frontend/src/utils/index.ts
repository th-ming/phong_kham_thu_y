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
  const stopWords = new Set([
    "toi", "ban", "cua", "voi", "nay", "kia", "thi", "la", "va", "hoac", "nhung",
    "mot", "cac", "gi", "nao", "sao", "the", "can", "hay", "giup", "duoc", "khong",
    "tim", "kiem", "loc", "xem", "danh", "sach", "thong", "tin"
  ]);

  return normalizeSearchText(value)
    .split(" ")
    .map(token => token.trim())
    .filter(token => token.length >= 2 || /^\d+$/.test(token))
    .filter(token => !stopWords.has(token))
    .filter((token, index, arr) => arr.indexOf(token) === index)
    .slice(0, 8);
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
  // `chuc_vu` is a descriptive job title, not an account-role source.
  // Keep canonical account fields in charge so staff profiles do not get misread as clinical users.
  const rawSource = [
    user?.loai_tai_khoan,
    user?.ten_vai_tro,
    user?.id_vai_tro,
    user?.role,
    user?.quyen,
  ].filter(Boolean).join(" ").toLowerCase();
  const source = normalizeSearchText([
    user?.loai_tai_khoan,
    user?.ten_vai_tro,
    user?.id_vai_tro,
    user?.role,
    user?.quyen,
  ].filter(Boolean).join(" "));
  const compactSource = source.replace(/\s+/g, "");
  const rawCompactSource = rawSource.replace(/[\s_-]+/g, "");
  const hasCustomerAccount = Boolean(user?.id_khach_hang);
  const hasStaffAccount = Boolean(user?.id_nhan_vien || user?.id_nhanvien || user?.employeeId);

  if (!source) return hasStaffAccount ? "staff" : hasCustomerAccount ? "khach_hang" : "guest";
  if (compactSource.includes("vt1") || rawCompactSource.includes("vtadmin") || source.includes("admin") || source.includes("quan tri")) return "admin";
  if (compactSource.includes("vt6") || rawCompactSource.includes("vtql") || source.includes("quan ly") || source.includes("manager")) return "quan_ly";
  if (compactSource.includes("vt2") || rawCompactSource.includes("vtbs") || source.includes("bac si") || source.includes("doctor")) return "bac_si";
  if (compactSource.includes("vt4") || rawCompactSource.includes("vtkt") || source.includes("ke toan") || source.includes("accountant")) return "ke_toan";
  if (compactSource.includes("vt7") || rawCompactSource.includes("vttt") || source.includes("tiep tan") || source.includes("le tan") || source.includes("reception")) return "tiep_tan";
  if (compactSource.includes("vt8") || rawCompactSource.includes("vtyt") || source.includes("y ta") || source.includes("dieu duong") || source.includes("nurse")) return "y_ta";
  if (compactSource.includes("vt3") || source.includes("nhan vien") || source.includes("staff")) return "staff";

  if (hasStaffAccount) return "staff";
  if (compactSource.includes("vt5") || source.includes("khach hang") || source.includes("customer") || hasCustomerAccount) return "khach_hang";

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

export const scoreSearchFields = (query: string, fields: unknown[]): number => {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return 1;

  const normalizedFields = fields.map(field => normalizeSearchText(field)).filter(Boolean);
  const combinedFieldText = normalizedFields.join(" ");
  if (!combinedFieldText) return 0;
  if (combinedFieldText.includes(normalizedQuery)) return 100;

  const queryTokens = tokenizeSearchText(query);
  const fieldTokens = tokenizeSearchText(combinedFieldText);
  if (queryTokens.length === 0 || fieldTokens.length === 0) return 0;

  let score = 0;
  for (const queryToken of queryTokens) {
    if (combinedFieldText.includes(queryToken)) {
      score += 10;
      continue;
    }
    if (fieldTokens.some(fieldToken => isCloseSearchToken(queryToken, fieldToken))) {
      score += 4;
    }
  }
  return score;
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

export const decodeHtmlEntities = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  const text = String(value);
  if (!text.includes('&')) return text;
  const parser = new DOMParser();
  const doc = parser.parseFromString(text, 'text/html');
  return doc.documentElement.textContent || text;
};

export const getCustomerIdFromProfile = (user: any): string | undefined => {
  const candidates = [
    user?.id_khach_hang,
    user?.idKhachHang,
    user?.khachHangId,
    user?.customerId,
    normalizeUserRole(user) === "khach_hang" ? user?.id : undefined,
  ];

  const id = candidates
    .map(value => value === null || value === undefined ? "" : String(value).trim())
    .find(value => value && value.toLowerCase() !== "null" && value.toLowerCase() !== "undefined");

  return id;
};

// Fix lỗi encoding tiếng Việt phổ biến: "Hình ?nh" → "Hình ảnh"
const VIETNAMESE_ENCODING_FIXES: Record<string, string> = {
  '?a': 'ả', '?á': 'á', '?à': 'à', '?ã': 'ã', '?ạ': 'ạ',
  '?ă': 'ă', '?â': 'â', '?đ': 'đ',
  '?e': 'ẻ', '?é': 'é', '?è': 'è', '?ẽ': 'ẽ', '?ẹ': 'ẹ', '?ê': 'ê',
  '?i': 'ỉ', '?í': 'í', '?ì': 'ì', '?ĩ': 'ĩ', '?ị': 'ị',
  '?o': 'ỏ', '?ó': 'ó', '?ò': 'ò', '?õ': 'õ', '?ọ': 'ọ', '?ô': 'ô', '?ơ': 'ơ',
  '?u': 'ủ', '?ú': 'ú', '?ù': 'ù', '?ũ': 'ũ', '?ụ': 'ụ', '?ư': 'ư',
  '?y': 'ỷ', '?ý': 'ý', '?ỳ': 'ỳ', '?ỹ': 'ỹ', '?ỵ': 'ỵ',
  '?A': 'Ả', '?Á': 'Á', '?À': 'À', '?Ã': 'Ã', '?Ạ': 'Ạ',
  '?Ă': 'Ă', '?Â': 'Â', '?Đ': 'Đ',
  '?E': 'Ẻ', '?É': 'É', '?È': 'È', '?Ẽ': 'Ẽ', '?Ẹ': 'Ẹ', '?Ê': 'Ê',
  '?I': 'Ỉ', '?Í': 'Í', '?Ì': 'Ì', '?Ĩ': 'Ĩ', '?Ị': 'Ị',
  '?O': 'Ỏ', '?Ó': 'Ó', '?Ò': 'Ò', '?Õ': 'Õ', '?Ọ': 'Ọ', '?Ô': 'Ô', '?Ơ': 'Ơ',
  '?U': 'Ủ', '?Ú': 'Ú', '?Ù': 'Ù', '?Ũ': 'Ũ', '?Ụ': 'Ụ', '?Ư': 'Ư',
  '?Y': 'Ỷ', '?Ý': 'Ý', '?Ỳ': 'Ỳ', '?Ỹ': 'Ỹ', '?Ỵ': 'Ỵ',
};

// Hàm bổ trợ decode Mojibake khi chữ UTF-8 bị ép hiển thị dưới dạng Windows-1252 / ISO-8859-1
const decodeMojibake = (str: string): string => {
  try {
    // Map các ký tự unicode Unicode thay thế đặc thù của Windows-1252 về byte đúng (0-255)
    // Map các ký tự unicode Unicode thay thế đặc thù của Windows-1252 về byte đúng (0-255)
    const win1252Map = new Map<number, number>([
      [0x20AC, 128], [0x201A, 130], [0x0192, 131], [0x201E, 132], [0x2026, 133], [0x2020, 134], [0x2021, 135],
      [0x02C6, 136], [0x2030, 137], 
      // Thập phân:
      [8216, 145], [8217, 146], [8220, 147], [8221, 148], [8249, 139], [8250, 155], [2122, 153], [8482, 153],
      [8222, 132], [8230, 133], [8224, 134], [8225, 135], [710, 136], [8240, 137], [352, 138], [338, 140],
      [381, 142], [732, 152], [353, 154], [339, 156], [382, 158], [376, 159],
      [0x2022, 149], [0x2013, 150], [0x2014, 151]
    ]);

    const bytes = new Uint8Array(Array.from(str).map(c => {
      const code = c.charCodeAt(0);
      return win1252Map.get(code) || (code <= 255 ? code : 63);
    }));

    return new TextDecoder('utf-8').decode(bytes);
  } catch (e) {
    return str;
  }
};


export const fixVietnameseEncoding = (text: string | null | undefined): string => {
  if (!text) return '';
  
  // Nếu phát hiện ký tự Mojibake đặc trưng (ví dụ chứa các cụm Ã, áº, Ä‘, á»)
  let result = text;
  if (/[\u00C0-\u00FF]/.test(result) && (result.includes('Ã') || result.includes('Ä') || result.includes('á'))) {
    try {
      // Decode chuỗi Mojibake
      const decoded = decodeURIComponent(escape(result));
      if (decoded && decoded !== result) {
        result = decoded;
      }
    } catch (e) {
      // Fallback thủ công nếu escape thất bại
      result = decodeMojibake(result);
    }
  }

  // Chạy thêm bộ mapping dấu chấm hỏi cũ
  for (const [wrong, correct] of Object.entries(VIETNAMESE_ENCODING_FIXES)) {
    while (result.includes(wrong)) {
      result = result.replace(wrong, correct);
    }
  }
  return result;
};


// * * Tạo Slug chuẩn SEO từ tên dịch vụ * Loại bỏ dấu, ký tự đặc biệt và khoảng trắng
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
