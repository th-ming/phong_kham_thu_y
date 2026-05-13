import React from 'react';
import { useTheme } from '@contexts/ThemeContext';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

const VongXoayTai: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  const spinnerColor = color || (isDark ? 'var(--gray-300)' : 'var(--primary)');

  return (
    <div className={`animate-spin rounded-full border-2 border-transparent border-t-2 ${sizeClasses[size]}`}
         style={{ borderTopColor: spinnerColor }} />
  );
};

export default VongXoayTai;