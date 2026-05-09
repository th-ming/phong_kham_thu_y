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
