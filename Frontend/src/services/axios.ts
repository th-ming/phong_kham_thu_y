import axios, { AxiosInstance, AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { reportAxiosError } from './clientErrorReporter';

// Axios Interceptor — Hệ thống kết nối API:
// - Tự động gửi httpOnly cookie (bảo mật chính)
// - Fallback sang Bearer header nếu cookie chưa có (backward-compatible)
// - Xử lý tự động refresh token khi hết hạn

const API_BASE_URL = (import.meta as any).env.VITE_API_URL || ''; // Dev dùng proxy Vite, production dùng backend URL từ Vercel env

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  withCredentials: true, // Tự động gửi httpOnly cookie trong mọi request — chặn XSS đánh cắp token
  headers: {
    'Content-Type': 'application/json',
  },
});

// Can thiệp trước khi gửi request — Gắn Bearer token như fallback (backward-compatible)
axiosInstance.interceptors.request.use(
  (config) => {
    // Fallback: nếu server chưa set cookie (ví dụ: lần đầu login cũ), vẫn dùng localStorage
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const requestUrl = config.url || '';
    const isChatRequest = requestUrl.includes('/api/chat') || requestUrl.includes('/api/agent');
    const isHumanAuthRequest = requestUrl.includes('/api/auth/') ||
      requestUrl.includes('/api/system/send-otp') ||
      requestUrl.includes('/api/system/verify-otp');

    // Đính kèm tag hành động AI nếu có. Không gắn vào chat thường
    // và auth/OTP vì tag Autopilot cũ có thể làm backend phân loại nhầm thao tác người dùng.
    if (isChatRequest || isHumanAuthRequest) {
        (window as any).__AI_ACTION_TAG__ = undefined;
        const headers = config.headers as any;
        if (typeof headers?.delete === 'function') {
            headers.delete('X-AI-ACTION');
            headers.delete('x-ai-action');
        }
        delete headers?.['X-AI-ACTION'];
        delete headers?.['x-ai-action'];
    } else if ((window as any).__AI_ACTION_TAG__) {
        config.headers['X-AI-ACTION'] = (window as any).__AI_ACTION_TAG__;
    }

    return config;
  },
  (error: AxiosError) => {
    reportAxiosError(error);
    return Promise.reject(error);
  }
);

// Biến hỗ trợ hàng đợi khi nhiều request cùng lúc bị lỗi 401
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Can thiệp sau khi nhận response — Xử lý lỗi và tự động refresh token
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    const method = response.config.method?.toUpperCase();
    const url = response.config.url || "";
    if (
      method &&
      ["POST", "PUT", "PATCH", "DELETE"].includes(method) &&
      url.startsWith("/api/") &&
      !url.startsWith("/api/auth/") &&
      !url.startsWith("/api/chat") &&
      !url.startsWith("/api/agent") &&
      !url.startsWith("/api/client-errors")
    ) {
      window.dispatchEvent(new CustomEvent("rexi-data-changed", {
        detail: {
          resource: "global",
          action: "local-mutation",
          method,
          path: url,
          timestamp: Date.now()
        }
      }));
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      // Bỏ qua tự động refresh cho các API auth (đăng nhập, đăng ký, refresh), nhưng CHO PHÉP đối với đổi mật khẩu và tạo nhanh khách hàng
      const isAuthRoute = originalRequest.url?.includes('/api/auth/') && 
                          !originalRequest.url?.includes('/api/auth/change-password') &&
                          !originalRequest.url?.includes('/api/auth/register-simple');
      if (!isAuthRoute) {
        // Nếu đang refresh, cho các request khác vào hàng đợi chờ
        if (isRefreshing) {
          return new Promise(function (resolve, reject) {
            failedQueue.push({ resolve, reject });
          }).then(token => {
            originalRequest.headers.Authorization = 'Bearer ' + token;
            return axiosInstance(originalRequest);
          }).catch(err => {
            return Promise.reject(err);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        // Thử refresh qua cookie trước (server sẽ đọc rexi_refresh_token cookie tự động)
        // Fallback: đọc từ localStorage nếu có
        const refreshToken = localStorage.getItem('refreshToken');

        if (!refreshToken) {
          // Cookie refresh flow: thử gọi refresh mà không cần body (server đọc cookie)
          try {
            const rs = await axios.post(`${API_BASE_URL}/api/auth/refresh-token`, {}, { withCredentials: true });
            const newToken = rs.data.token;
            if (newToken) {
              localStorage.setItem('token', newToken);
              axiosInstance.defaults.headers.common['Authorization'] = 'Bearer ' + newToken;
              originalRequest.headers.Authorization = 'Bearer ' + newToken;
              processQueue(null, newToken);
              isRefreshing = false;
              return axiosInstance(originalRequest);
            }
          } catch {
            // Cookie refresh cũng thất bại → logout
          }
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          isRefreshing = false;
          window.location.href = '/dang-nhap';
          return Promise.reject(error);
        }

        try {
          // Gọi API refresh token (dùng body khi có localStorage refreshToken)
          const rs = await axios.post(`${API_BASE_URL}/api/auth/refresh-token`, { refreshToken }, { withCredentials: true });
          const newToken = rs.data.token;

          localStorage.setItem('token', newToken);
          axiosInstance.defaults.headers.common['Authorization'] = 'Bearer ' + newToken;
          originalRequest.headers.Authorization = 'Bearer ' + newToken;

          processQueue(null, newToken);
          return axiosInstance(originalRequest);
        } catch (err) {
          processQueue(err, null);
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/dang-nhap';
          return Promise.reject(err);
        } finally {
          isRefreshing = false;
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
