import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Kiểm tra bộ nhớ trình duyệt (localStorage)
    const saved = localStorage.getItem('rexi-theme');
    if (saved === 'light' || saved === 'dark') return saved;
    
    // Nếu không có, kiểm tra cấu hình hệ điều hành của người dùng
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    // Áp dụng nhãn data-theme lên thẻ <html>
    root.setAttribute('data-theme', theme);
    
    // Lưu lại lựa chọn
    localStorage.setItem('rexi-theme', theme);
    
    // Thêm class transition để chuyển đổi màu mượt mà
    root.classList.add('theme-transition');
    const timer = setTimeout(() => root.classList.remove('theme-transition'), 500);
    return () => clearTimeout(timer);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
