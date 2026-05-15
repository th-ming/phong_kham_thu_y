import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '../contexts/ThemeContextV2';
import Header from './Header';

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      <ThemeProvider>
        {component}
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe('Header Component', () => {
  test('renders header with logo', () => {
    renderWithRouter(<Header />);
    const logo = screen.getByText(/Rexi/i);
    expect(logo).toBeInTheDocument();
  });

  test('has login button when not authenticated', () => {
    localStorage.clear();
    renderWithRouter(<Header />);
    const loginBtn = screen.getByRole('link', { name: /Đăng nhập/i });
    expect(loginBtn).toBeInTheDocument();
  });

  test('mobile menu toggles when button clicked', () => {
    renderWithRouter(<Header />);
    const menuButton = screen.getByLabelText(/menu/i);
    
    fireEvent.click(menuButton);
    // Mobile menu should be visible after click
    expect(menuButton).toHaveAttribute('aria-expanded', 'true');
  });

  test('has proper accessibility attributes', () => {
    renderWithRouter(<Header />);
    const menuButton = screen.getByLabelText(/mở menu/i);
    expect(menuButton).toHaveAttribute('aria-label');
  });

  test('navigation links are present', () => {
    renderWithRouter(<Header />);
    expect(screen.getByText(/Dịch vụ/i)).toBeInTheDocument();
    expect(screen.getByText(/Bảng giá/i)).toBeInTheDocument();
    expect(screen.getByText(/Bác sĩ/i)).toBeInTheDocument();
  });

  test('theme toggle button works', () => {
    renderWithRouter(<Header />);
    const themeToggle = screen.getByRole('button', { name: /theme/i });
    expect(themeToggle).toBeInTheDocument();
  });
});
