import React, { useState } from 'react';
import {
  Search,
  Bell,
  ShieldAlert,
  Wifi,
  User,
  LogOut,
  Sliders,
  Check,
  Zap,
  Globe
} from 'lucide-react';
import { AdminRole } from '../../types';
import { StatusIndicator } from '../ui/StatusIndicator';

interface HeaderProps {
  currentRole: AdminRole;
  onChangeRole: (role: AdminRole) => void;
  onOpenSearch: () => void;
  usersAtRiskCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onChangeRole,
  onOpenSearch,
  usersAtRiskCount = 2
}) => {
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const roles: AdminRole[] = [
    'OWNER',
    'ADMIN',
    'MARKETING',
    'FINANCE',
    'SUPPORT',
    'ANALYST',
    'DEVELOPER'
  ];

  return (
    <header className="h-16 bg-slate-950/90 backdrop-blur border-b border-slate-800/80 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Global Quick Search Bar */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <button
          onClick={onOpenSearch}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-colors shadow-inner"
        >
          <Search className="w-3.5 h-3.5 text-slate-500" />
          <span className="truncate">Search users, account #, trades, tickets, keys...</span>
          <kbd className="ml-auto font-mono text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right Side Control Toolbar */}
      <div className="flex items-center gap-4">
        {/* System Health Quick Chips */}
        <div className="hidden lg:flex items-center gap-3 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800/80 text-xs">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-[11px] text-slate-400 font-mono">MT5 Bridge:</span>
            <StatusIndicator status="CONNECTED" pingMs={14} />
          </div>
          <div className="h-3 w-px bg-slate-800" />
          <div className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-sky-400" />
            <span className="text-[11px] text-slate-400 font-mono">Supabase:</span>
            <StatusIndicator status="CONNECTED" pingMs={8} />
          </div>
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition-colors relative"
            title="System Risk & Operational Alerts"
          >
            <Bell className="w-4 h-4" />
            {usersAtRiskCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-40 p-3">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-400" /> Risk & System Alerts
                </span>
                <span className="text-[10px] text-slate-400">Live feed</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="p-2 rounded bg-rose-500/10 border border-rose-500/20 text-slate-300">
                  <div className="font-semibold text-rose-400">CRITICAL RISK ALERT</div>
                  <div>User David Chen (3301928) exceeded daily DD limit (-8.9%).</div>
                  <span className="text-[10px] text-slate-500 font-mono">2 mins ago</span>
                </div>
                <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-slate-300">
                  <div className="font-semibold text-amber-400">WITHDRAWAL REQUEST</div>
                  <div>$15,000 Bank Wire requested by Elena Rostova.</div>
                  <span className="text-[10px] text-slate-500 font-mono">15 mins ago</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Role Switcher Dropdown (Owner Control Test) */}
        <div className="relative">
          <button
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <div className="text-left">
              <span className="text-[10px] text-slate-500 font-mono block leading-none">Role Preview</span>
              <span className="font-bold text-white tracking-tight">{currentRole}</span>
            </div>
          </button>

          {showRoleDropdown && (
            <div className="absolute right-0 mt-2 w-52 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-40 py-2">
              <div className="px-3 py-1 text-[10px] font-mono text-slate-500 border-b border-slate-800">
                SWITCH RBAC VIEW:
              </div>
              {roles.map(r => (
                <button
                  key={r}
                  onClick={() => {
                    onChangeRole(r);
                    setShowRoleDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition-colors ${
                    currentRole === r
                      ? 'bg-emerald-500/10 text-emerald-400 font-bold'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>{r}</span>
                  {currentRole === r && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Admin Profile Chip */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800/80">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-emerald-400">
            OWN
          </div>
          <div className="hidden sm:block text-left">
            <span className="text-xs font-semibold text-white block leading-tight">Master IB Admin</span>
            <span className="text-[10px] text-emerald-400 font-mono">admin@gotrading.io</span>
          </div>
        </div>
      </div>
    </header>
  );
};
