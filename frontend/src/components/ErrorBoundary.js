import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="bg-rose-950/40 border border-rose-700 text-rose-100 rounded-lg p-6 max-w-2xl">
        <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
        <p className="text-sm text-rose-200 mb-4">
          {this.state.error?.message || 'An unexpected error occurred.'}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded-md text-sm transition-colors"
        >
          Reload
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
