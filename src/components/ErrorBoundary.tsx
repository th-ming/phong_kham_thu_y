import React from 'react';

/**
 * FIX #17: Error Boundary Component
 * Catches React component errors and displays a fallback UI
 * Prevents entire app from crashing
 */

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Optionally log to error reporting service
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: '#f3f4f6',
          fontFamily: 'Inter, sans-serif',
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '48px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            maxWidth: '500px',
            textAlign: 'center'
          }}>
            <h1 style={{
              fontSize: '2rem',
              fontWeight: '900',
              color: '#1f2937',
              marginBottom: '16px'
            }}>
              ⚠️ Lỗi hệ thống
            </h1>
            <p style={{
              fontSize: '1rem',
              color: '#6b7280',
              marginBottom: '24px',
              lineHeight: '1.6'
            }}>
              Ứng dụng gặp lỗi không mong muốn. Vui lòng tải lại trang hoặc liên hệ hỗ trợ.
            </p>
            {this.state.error && (
              <details style={{
                marginBottom: '24px',
                padding: '16px',
                backgroundColor: '#fee2e2',
                borderRadius: '8px',
                textAlign: 'left'
              }}>
                <summary style={{ cursor: 'pointer', fontWeight: '600', color: '#991b1b' }}>
                  Chi tiết lỗi
                </summary>
                <pre style={{
                  marginTop: '12px',
                  fontSize: '0.875rem',
                  color: '#7f1d1d',
                  overflow: 'auto',
                  maxHeight: '200px'
                }}>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
            <button 
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 24px',
                backgroundColor: '#0f9d8a',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'background-color 0.3s'
              }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#0d8a77')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#0f9d8a')}
            >
              Tải lại trang
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
