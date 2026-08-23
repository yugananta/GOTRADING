import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw, LogOut } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends (Component as any) {
  state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetSession = () => {
    localStorage.removeItem('gotrading_access_token');
    localStorage.removeItem('gotrading_refresh_token');
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-6 text-slate-100 font-sans">
          <div className="max-w-xl w-full bg-slate-900 border-2 border-rose-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                <AlertOctagon className="w-8 h-8 text-rose-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Terjadi Kendala Tampilan (UI Error)</h2>
                <p className="text-xs text-rose-300">Komponen React menangkap error saat merender data.</p>
              </div>
            </div>

            {this.state.error && (
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono overflow-auto max-h-48 text-rose-300">
                <div className="font-bold text-rose-400 mb-1">{this.state.error.name}: {this.state.error.message}</div>
                {this.state.error.stack && (
                  <pre className="text-[10px] text-slate-500 whitespace-pre-wrap mt-2">{this.state.error.stack.split('\n').slice(0, 4).join('\n')}</pre>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full sm:w-auto flex-1 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Muat Ulang Halaman
              </button>
              <button
                onClick={this.handleResetSession}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors border border-slate-700 cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-slate-400" />
                Reset Sesi & Login Ulang
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
