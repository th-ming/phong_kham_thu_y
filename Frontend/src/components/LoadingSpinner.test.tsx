import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import LoadingSpinner from './LoadingSpinner';
import { ThemeProvider } from '../contexts/ThemeContextV2';

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

describe('LoadingSpinner', () => {
  test('renders with default props', () => {
    renderWithTheme(<LoadingSpinner />);
    const spinner = screen.getByRole('presentation'); // div with animate-spin
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('w-8', 'h-8'); // medium size
  });

  test('renders small size', () => {
    renderWithTheme(<LoadingSpinner size="small" />);
    const spinner = screen.getByRole('presentation');
    expect(spinner).toHaveClass('w-4', 'h-4');
  });

  test('renders large size', () => {
    renderWithTheme(<LoadingSpinner size="large" />);
    const spinner = screen.getByRole('presentation');
    expect(spinner).toHaveClass('w-12', 'h-12');
  });

  test('applies custom color', () => {
    renderWithTheme(<LoadingSpinner color="#ff0000" />);
    const spinner = screen.getByRole('presentation');
    expect(spinner).toHaveStyle({ borderTopColor: '#ff0000' });
  });

  test('uses theme-based color when no custom color', () => {
    renderWithTheme(<LoadingSpinner />);
    const spinner = screen.getByRole('presentation');
    // In light theme, should use var(--primary)
    expect(spinner).toHaveStyle({ borderTopColor: 'var(--primary)' });
  });
});
