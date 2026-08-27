import React, { useState } from 'react';
import { useApp } from './AppContext.tsx';
import { ShieldCheck, Mail, Lock, Key, ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react';
import { apiFetch } from '../utils/apiFetch';

interface AdminLoginProps {
  onBackToApp: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onBackToApp }) => {
  const { setCurrentUser, showToast } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAdminLoginSubmit = async (e: React.FormEvent, customEmail?: string) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const loginEmail = customEmail || email;
    const loginPass = customEmail ? 'password123' : password;

    if (!loginEmail || !loginPass) {
      setErrorMsg('Please specify your administrator email and password.');
      setLoading(false);
      return;
    }

    try {
      const res = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPass })
      });

      if (res.ok) {
        const data = await res.json();
        const user = data.user;
        
        if (user.role === 'admin') {
          showToast('Access granted! Authenticating admin terminal...', 2000);
          setTimeout(() => {
            setCurrentUser(user);
          }, 1000);
        } else {
          setErrorMsg('Access Denied: This account is registered as a Standard Trader. Only authorized System Administrators can log in to the admin terminal.');
        }
      } else {
        const err = await res.json();
        setErrorMsg(err.error || 'Invalid administrator credentials.');
      }
    } catch (err) {
      setErrorMsg('Server connection failed. Please ensure the backend server is active.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      id="admin-login-screen" 
      className="min-h-screen w-full flex flex-col justify-center items-center bg-slate-950 font-sans relative overflow-hidden"
    >
      {/* Dynamic tech-grid ambient lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-slate-950 to-slate-950 z-0" />
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent z-0" />

      <div className="w-full max-w-lg p-8 bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl shadow-2xl z-10 space-y-8 relative">
        
        {/* Decorative elements */}
        <div className="absolute top-4 right-4 flex space-x-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-500/50" />
          <span className="w-2 h-2 rounded-full bg-emerald-500/50 animate-pulse" />
        </div>

        {/* Branding header */}
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-indigo-500/10 text-indigo-400 rounded-2xl border border-indigo-500/20 mb-2">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Tarapti Systems</h1>
          <p className="text-xs font-semibold text-indigo-300 tracking-wider uppercase">System Administration Terminal</p>
        </div>

        {/* Info panel */}
        <div className="bg-slate-950/85 border border-slate-800/80 rounded-xl p-4 flex items-start space-x-3">
          <AlertTriangle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed text-slate-400">
            This is a private administration terminal. Authorization is strictly monitored. Standard traders should return to the mobile application.
          </p>
        </div>

        {/* Error panel */}
        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 font-medium">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={(e) => handleAdminLoginSubmit(e)} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@tarapti.com"
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl px-10 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Secure Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950/80 border border-slate-800 focus:border-indigo-500 rounded-xl px-10 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/15 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Verifying credentials...</span>
              </>
            ) : (
              <>
                <Key className="w-4 h-4" />
                <span>Verify & Unlock Portal</span>
              </>
            )}
          </button>
        </form>

        {/* Admin Shortcut for fast previewing */}
        <div className="border-t border-slate-800/80 pt-6 space-y-3">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center">Bypass Registry for testing</p>
          <button
            type="button"
            onClick={(e) => handleAdminLoginSubmit(e, 'michael@tarapti.com')}
            className="w-full py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2 transition-all"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Login with Michael Lee (Admin account)</span>
          </button>
        </div>

        {/* Footer / Back Button */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={onBackToApp}
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Exit to Trader Mobile App</span>
          </button>
        </div>

      </div>
    </div>
  );
};
