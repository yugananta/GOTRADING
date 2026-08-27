import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="p-8 max-w-2xl mx-auto mt-20 bg-white border border-red-200 rounded-2xl shadow-xl font-sans">
          <h2 className="text-xl font-black text-red-600 mb-2">Terjadi Kesalahan Render Aplikasi</h2>
          <p className="text-xs text-slate-600 mb-4">Aplikasi menangkap error berikut:</p>
          <div className="p-4 bg-slate-900 text-red-400 font-mono text-xs rounded-xl overflow-auto max-h-60 mb-4">
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('tarapti_user');
              window.location.reload();
            }}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
          >
            Reset Session & Reload
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
