import React from 'react'
import ReactDOM from 'react-dom/client'
import axios from 'axios'
import { ThemeProvider } from '@contexts/ThemeContextV2'
import App from './App'
import './styles/index.css'

// Cấu hình Axios Interceptor để tự động gắn Token vào tất cả request
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>,
)
