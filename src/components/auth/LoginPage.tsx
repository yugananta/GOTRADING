import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck, Lock, Mail, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, isLoggingIn, error: authError, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const displayError = errorMessage || authError;

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (errorMessage || authError) {
      setErrorMessage(null);
      clearError();
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (errorMessage || authError) {
      setErrorMessage(null);
      clearError();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Mohon masukkan email dan password.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    clearError();

    try {
      await login(email.trim(), password);
      window.location.href = '/';
    } catch (err: any) {
      setErrorMessage(err.message || 'Email atau password salah. Silakan periksa kembali.');
    } finally {
      setLoading(false);
    }
  };

  const isSubmitting = loading || isLoggingIn;

  return (
    <div className="min-h-screen w-screen bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-100">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 pointer-events-none" />

      <div className="relative w-full max-w-md bg-slate-900/95 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-xl">
        {/* Logo / Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-4 shadow-lg shadow-emerald-950">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">GOTRADING ADMIN</h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-mono">
            IB &amp; Sub-IB Network Management Portal
          </p>
        </div>

        {/* Error Alert Box */}
        {displayError && (
          <div
            id="login-error-alert"
            className="mb-6 p-4 rounded-xl bg-rose-950/80 border-2 border-rose-500/60 text-rose-200 text-xs shadow-lg shadow-rose-950/50 flex items-start gap-3 transition-all animate-in fade-in zoom-in-95 duration-200"
          >
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 space-y-0.5">
              <p className="font-bold text-rose-300 text-[13px]">
                {displayError.toLowerCase().includes('terhubung') || displayError.toLowerCase().includes('koneksi')
                  ? 'Koneksi Server Bermasalah'
                  : 'Autentikasi Gagal'}
              </p>
              <p className="text-rose-200/90 leading-relaxed text-xs">
                {displayError}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Email atau Username
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="input-login-email"
                type="text"
                required
                disabled={isSubmitting}
                value={email}
                onChange={handleEmailChange}
                placeholder="admin@gotrading.io"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pl-10 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                id="input-login-password"
                type="password"
                required
                disabled={isSubmitting}
                value={password}
                onChange={handlePasswordChange}
                placeholder="••••••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 pl-10 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded bg-slate-950 border-slate-800 text-emerald-500 focus:ring-0" />
              <span>Ingat perangkat ini</span>
            </label>
            <span className="text-emerald-400 hover:underline cursor-pointer">Lupa password?</span>
          </div>

          <button
            id="btn-login-submit"
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memverifikasi Kredensial...</span>
              </>
            ) : (
              <>
                <span>Masuk ke Admin Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-800 text-center text-[11px] text-slate-500">
          TARAPTI Backend Secured Gateway • GoTrading Enterprise v3.6
        </div>
      </div>
    </div>
  );
};
