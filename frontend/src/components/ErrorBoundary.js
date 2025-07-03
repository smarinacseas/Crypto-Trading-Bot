import React from 'react';
import { Alert } from './ui';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Update state with error details
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="min-h-screen bg-secondary-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <Alert 
              variant="error" 
              title="Something went wrong"
              className="mb-4"
            >
              <p className="mb-3">
                We encountered an unexpected error. This might be due to:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1 mb-4">
                <li>Network connectivity issues</li>
                <li>Temporary service unavailability</li>
                <li>Browser compatibility problems</li>
              </ul>
              <div className="flex space-x-3">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm transition-colors"
                >
                  Refresh Page
                </button>
                <button
                  onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                  className="px-4 py-2 bg-secondary-600 hover:bg-secondary-500 text-neutral-100 rounded-lg text-sm transition-colors"
                >
                  Try Again
                </button>
              </div>
            </Alert>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="bg-secondary-800 border border-secondary-600 rounded-lg p-4 text-xs">
                <summary className="cursor-pointer text-neutral-300 mb-2">
                  Error Details (Development Only)
                </summary>
                <div className="space-y-2">
                  <div>
                    <strong className="text-danger-400">Error:</strong>
                    <pre className="text-danger-300 mt-1 overflow-auto">
                      {this.state.error.toString()}
                    </pre>
                  </div>
                  <div>
                    <strong className="text-danger-400">Stack Trace:</strong>
                    <pre className="text-neutral-400 mt-1 overflow-auto">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </div>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 