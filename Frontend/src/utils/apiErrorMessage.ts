export const getApiErrorMessage = (err: any, fallback: string): string => {
  const data = err?.response?.data;
  if (typeof data === "string") {
    const trimmed = data.trim();
    if (trimmed && !trimmed.startsWith("<")) return trimmed;
  }

  if (data && typeof data === "object") {
    const directMessage = data.message || data.error || data.reply;
    if (typeof directMessage === "string" && directMessage.trim()) {
      return directMessage.trim();
    }

    if (Array.isArray(data.errors)) {
      const messages = data.errors
        .map((item: any) => typeof item === "string" ? item : item?.message || item?.defaultMessage)
        .filter((message: any) => typeof message === "string" && message.trim());
      if (messages.length > 0) return messages.join("; ");
    }
  }

  const status = err?.response?.status;
  if (status === 400) return fallback;
  if (status === 401) return "Phiên đăng nhập đã hết hạn hoặc thông tin đăng nhập không hợp lệ.";
  if (status === 403) return "Tài khoản hiện tại không đủ quyền thực hiện thao tác này.";
  if (status === 404) return "Không tìm thấy dữ liệu phù hợp. Vui lòng kiểm tra lại thông tin.";
  if (status === 409) return "Thông tin bị trùng hoặc xung đột với dữ liệu đã có.";
  if (status === 429) return "Bạn thao tác quá nhanh. Vui lòng đợi một chút rồi thử lại.";
  if (status >= 500) return "Backend đang lỗi khi xử lý yêu cầu này. Vui lòng thử lại sau.";

  if (err?.code === "ERR_NETWORK") return "Không kết nối được máy chủ. Vui lòng kiểm tra kết nối mạng hoặc liên hệ đội hỗ trợ Rexi.";
  if (err?.message) return `Lỗi kết nối: ${err.message}`;
  return fallback;
};
