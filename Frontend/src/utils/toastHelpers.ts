import { toast } from "@components/Toast";
import { getApiErrorMessage } from "./apiErrorMessage";

/**
 * Hiển thị thông báo lỗi (toast.error) cho người dùng.
 *
 * Hỗ trợ nhiều kiểu gọi:
 *  - toastError(error, "Fallback message")  → chiết xuất thông báo từ error object
 *  - toastError("Mô tả lỗi")               → hiển thị trực tiếp chuỗi
 *  - toastError(error)                      → khi error đã là string
 *
 * @param messageOrError - Error object hoặc chuỗi mô tả lỗi
 * @param fallback       - Thông báo mặc định dùng khi không chiết xuất được từ error
 */
export function toastError(messageOrError: unknown, fallback?: string, options?: { duration?: number }): void {
  let message: string;

  if (messageOrError instanceof Error) {
    // Error object → chiết xuất thông báo từ response API hoặc dùng fallback
    message = getApiErrorMessage(messageOrError, fallback ?? "Đã xảy ra lỗi không xác định.");
  } else if (typeof messageOrError === "string") {
    message = messageOrError;
  } else if (messageOrError && typeof messageOrError === "object") {
    // Axios error hoặc response object dạng plain object
    message = getApiErrorMessage(messageOrError, fallback ?? "Đã xảy ra lỗi không xác định.");
  } else {
    message = fallback ?? "Đã xảy ra lỗi không xác định.";
  }

  toast.error(message, options);
}
