import ReactDOM from 'react-dom/client'
import axios from 'axios'
import { ThemeProvider } from '@contexts/ThemeContextV2'
import App from './App'
import './styles/index.css'
import { toast } from '@components/Toast'
import { toastError } from '@utils/toastHelpers';
import { WebSocketProvider } from './contexts/WebSocketProvider'
import { installClientErrorReporter, reportAxiosError } from './services/clientErrorReporter'
import { getApiErrorMessage } from '@utils/apiErrorMessage'

import { registerSW } from 'virtual:pwa-register'

installClientErrorReporter();

// Auto reload when service worker updates
registerSW({
  onNeedRefresh() {
    window.location.reload();
  }
});

// config Axios Interceptor để tự động gắn TOKEN vào tất cả request
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Lấy thẻ lệnh từ ActionExecutor (nếu AI đang trong phiên "lái tự động")
  const requestUrl = String(config.url || "");
  const isHumanAuthRequest = requestUrl.includes("/api/auth/")
    || requestUrl.includes("/api/system/send-otp")
    || requestUrl.includes("/api/system/verify-otp");
  const aiActionTag = (window as any).__AI_ACTION_TAG__;
  if (aiActionTag && !isHumanAuthRequest) {
    config.headers['X-AI-ACTION'] = aiActionTag;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Bắt phản hồi lỗi từ Backend (Đặc biệt: Bắt lỗi 403 từ ActionAuthFilter)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 403) {
      toastError(error, "Cảnh báo bảo mật: Bạn không có quyền thực hiện hành động này!");
    }
    reportAxiosError(error);
    return Promise.reject(error);
  }
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <WebSocketProvider>
      <App />
    </WebSocketProvider>
  </ThemeProvider>,
)
