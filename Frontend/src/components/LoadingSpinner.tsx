import React from 'react';
import { useTheme } from '@contexts/ThemeContextV2';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  color?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const sizeMap = {
    small: 28,
    medium: 44,
    large: 64
  };

  return (
    <div
      className="premium-loader"
      style={{
        width: sizeMap[size],
        height: sizeMap[size],
        borderRadius: size === 'small' ? 12 : size === 'medium' ? 18 : 24,
        filter: color ? `drop-shadow(0 0 12px ${color})` : undefined,
        opacity: isDark ? 0.95 : 1
      }}
    />
  );
};

export default LoadingSpinner;
