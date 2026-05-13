import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

/**
 * UPGRADE: Enhanced Error Boundary with retry functionality and error details
 */

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

class XuLyLoi extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Rexi System caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      // Show enhanced error UI with retry option
      return <ErrorFallback error={this.state.error} retry={this.retry} />;
    }

    return this.props.children;
  }
}

const ErrorFallback: React.FC<{ error?: Error; retry: () => void }> = ({ error, retry }) => {
  useTheme();

  return (
    <div style={{
      padding: '60px 20px',
      textAlign: 'center',
      background: 'var(--background)',
      color: 'var(--ink)',
      minHeight: '50vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        fontSize: '4rem',
        marginBottom: '20px',
        color: 'var(--danger)'
      }}>
        ⚠️
      </div>
      <h2 style={{
        fontSize: '2rem',
        fontWeight: 900,
        marginBottom: '16px',
        color: 'var(--danger)'
      }}>
        Đã xảy ra lỗi hệ thống
      </h2>
      <p style={{
        fontSize: '1rem',
        color: 'var(--gray-600)',
        marginBottom: '24px',
        maxWidth: '500px'
      }}>
        {error?.message || 'Có lỗi không mong muốn xảy ra trong ứng dụng.'}
      </p>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={retry}
          style={{
            background: 'var(--primary-gradient)',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '50px',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          Thử lại
        </button>
        <button
          onClick={() => window.location.href = '/'}
          style={{
            background: 'var(--gray-200)',
            color: 'var(--ink)',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '50px',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'transform 0.2s'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          Về trang chủ
        </button>
      </div>
    </div>
  );
};

export default XuLyLoi;
