import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle-btn"
      title={theme === 'light' ? 'Chuyển sang chế độ tối' : 'Chuyển sang chế độ sáng'}
      aria-label="Đổi giao diện"
    >
      <span className="material-symbols-outlined" style={{ fontSize: '22px' }}>
        {theme === 'light' ? 'dark_mode' : 'light_mode'}
      </span>
      
      <style>{`
        .theme-toggle-btn {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          border: 1px solid var(--glass-border);
          background: var(--surface);
          color: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          backdrop-filter: blur(10px);
          padding: 0;
          position: relative;
          overflow: hidden;
          box-shadow: var(--shadow-sm);
        }

        .theme-toggle-btn:hover {
          transform: scale(1.1) rotate(12deg);
          background: var(--primary);
          color: white;
          box-shadow: 0 8px 20px rgba(15, 157, 138, 0.3);
          border-color: var(--primary);
        }

        .theme-toggle-btn:active {
          transform: scale(0.95);
        }

        /* Hiệu ứng tia sáng khi hover */
        .theme-toggle-btn::after {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%);
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .theme-toggle-btn:hover::after {
          opacity: 1;
        }
      `}</style>
    </button>
  );
};

export default ThemeToggle;
