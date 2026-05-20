import ReactDOM from 'react-dom/client'
import axios from 'axios'
import { ThemeProvider } from '@contexts/ThemeContextV2'
import App from './App'
import './styles/index.css'
import { toast } from '@components/Toast'
import { WebSocketProvider } from './context/WebSocketProvider'

// Cấu hình Axios Interceptor để tự động gắn Token vào tất cả request
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Lấy thẻ lệnh từ ActionExecutor (nếu AI đang trong phiên "lái tự động")
  const aiActionTag = (window as any).__AI_ACTION_TAG__;
  if (aiActionTag) {
    config.headers['X-AI-ACTION'] = aiActionTag;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Bắt phản hồi lỗi từ Backend (Đặc biệt: Bắt lỗi phân quyền 403 từ ActionAuthFilter)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 403) {
      // Lấy thông báo lỗi được ActionAuthFilter trả về qua JSON
      const errorMessage = error.response.data?.message || error.response.data || "Cảnh báo bảo mật: Bạn không có quyền thực hiện hành động này!";
      toast.error(typeof errorMessage === 'string' ? errorMessage : "Bạn không có quyền thực thi tác vụ AI này!");
    }
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
