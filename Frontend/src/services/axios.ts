import axios, { AxiosInstance, AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

/**
 * Cấu hình Axios Interceptor - Hệ thống kết nối API
 * - Tự động đính kèm mã xác thực JWT (Token) vào mọi yêu cầu
 * - Xử lý đăng xuất tự động khi Token hết hạn
 * - Cấu hình tập trung cho toàn bộ ứng dụng
 */

const API_BASE_URL = ''; // Dùng Proxy trong vite.config.ts để xử lý chuyển tiếp tới localhost:8081

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Can thiệp trước khi gửi yêu cầu (Request Interceptor) - Gắn Token xác thực
 */
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Biến hỗ trợ hàng đợi (Queue) khi có nhiều request cùng lúc bị lỗi 401
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

/**
 * Can thiệp sau khi nhận phản hồi (Response Interceptor) - Xử lý lỗi hệ thống
 */
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !originalRequest.url?.includes('/api/auth/')) {
      // Nếu đang trong quá trình refresh token, cho các request khác vào hàng đợi
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

      // Lấy Refresh Token từ LocalStorage (Sếp cần lưu cái này lúc đăng nhập)
      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/dang-nhap';
        return Promise.reject(error);
      }

      try {
        // Gọi API lấy Token mới (Sếp cần có endpoint này ở Backend)
        const rs = await axios.post(`${API_BASE_URL}/api/auth/refresh-token`, { refreshToken });
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
    return Promise.reject(error);
  }
);

export default axiosInstance;
