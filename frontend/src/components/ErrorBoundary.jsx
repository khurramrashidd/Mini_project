import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render shows the fallback UI.
    return { hasError: true, errorInfo: error.message };
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div style={{ padding: '40px', textAlign: 'center', background: '#fee2e2', color: '#991b1b', borderRadius: '12px', margin: '20px' }}>
          <h2>⚠️ A Component Crashed</h2>
          <p>We caught an error, but the rest of the app is still running safely.</p>
          <code style={{ background: 'rgba(0,0,0,0.1)', padding: '10px', display: 'block', margin: '15px 0' }}>
            {this.state.errorInfo}
          </code>
          <button 
            onClick={() => window.location.reload()} 
            style={{ padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;