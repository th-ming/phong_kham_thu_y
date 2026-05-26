import ReactDOM from 'react-dom/client'
import axios from 'axios'
import { ThemeProvider } from '@contexts/ThemeContextV2'
import App from './App'
import './styles/index.css'
import { toast } from '@components/Toast'
import { WebSocketProvider } from './contexts/WebSocketProvider'
import { installClientErrorReporter, reportAxiosError } from './services/clientErrorReporter'

installClientErrorReporter();

// Bắt phản hồi lỗi 403 từ Backend và hiển thị toast cảnh báo cho người dùng
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 403) {
      const errorMessage = error.response.data?.message || error.response.data || "Cảnh báo bảo mật: Bạn không có quyền thực hiện hành động này!";
      toast.error(typeof errorMessage === 'string' ? errorMessage : "Bạn không có quyền thực thi tác vụ AI này!");
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
