import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LoginPage } from './LoginPage';
import { Loader2, ShieldAlert } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = true }) => {
  const { isAuthenticated, currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 gap-3 font-sans">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
        <p className="text-xs text-slate-400 tracking-wider font-mono">Memuat Sesi Keamanan TARAPTI...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  if (requireAdmin && currentUser) {
    const role = currentUser.role?.toLowerCase();
    const isAdminOrIB = role === 'admin' || role === 'owner' || role === 'ib' || role === 'finance' || role === 'ib_manager' || role === 'support';
    
    if (!isAdminOrIB) {
      return (
        <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-slate-100 p-4 font-sans text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-4">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Akses Ditolak (Unauthorized)</h2>
          <p className="text-xs text-slate-400 max-w-md mb-6">
            Akun Anda ({currentUser.email}) tidak memiliki hak akses administratif atau IB Management untuk membuka panel ini. Hubungi Master Owner untuk eskalasi role.
          </p>
          <button
            onClick={() => {
              localStorage.removeItem('gotrading_access_token');
              localStorage.removeItem('gotrading_refresh_token');
              window.location.href = '/login';
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors border border-slate-700"
          >
            Keluar / Ganti Akun
          </button>
        </div>
      );
    }
  }

  return <>{children}</>;
};
