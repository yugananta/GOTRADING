import React from 'react';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  LineChart,
  Activity,
  BookOpen,
  FileCheck2,
  MessageSquareShare,
  Bell,
  Megaphone,
  Trophy,
  Wallet,
  UserCheck,
  Headphones,
  FileText,
  Plug,
  KeyRound,
  Webhook,
  ShieldCheck,
  Lock,
  History,
  Settings,
  ChevronRight,
  TrendingUp,
  SlidersHorizontal,
  MessageSquare,
  Mail
} from 'lucide-react';
import { AdminRole } from '../../types';

export type NavItemKey =
  | 'dashboard'
  | 'users'
  | 'trading-accounts'
  | 'trading-analytics'
  | 'trading-health'
  | 'trading-journal'
  | 'trading-plans'
  | 'social-media'
  | 'notifications'
  | 'wa-blaster'
  | 'email-blast'
  | 'campaigns'
  | 'competitions'
  | 'finance'
  | 'partners'
  | 'support'
  | 'content'
  | 'integrations'
  | 'api-keys'
  | 'webhooks'
  | 'admin-roles'
  | 'security'
  | 'audit-logs'
  | 'settings';

interface SidebarProps {
  activeNav: NavItemKey;
  onSelectNav: (key: NavItemKey) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  currentRole: AdminRole;
  usersAtRiskCount?: number;
  pendingWithdrawalsCount?: number;
  openTicketsCount?: number;
}

interface MenuItem {
  key: NavItemKey;
  label: string;
  icon: React.FC<{ className?: string }>;
  badge?: number | string;
  badgeColor?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeNav,
  onSelectNav,
  isCollapsed,
  onToggleCollapse,
  currentRole,
  usersAtRiskCount = 2,
  pendingWithdrawalsCount = 1,
  openTicketsCount = 1
}) => {
  const menuItems: MenuItem[] = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { key: 'users', label: 'Users', icon: Users },
    { key: 'trading-accounts', label: 'Trading Accounts', icon: CreditCard },
    { key: 'trading-analytics', label: 'Trading Analytics', icon: LineChart },
    // TODO: endpoint BE belum tersedia untuk generic Trading Health, menunggu konfirmasi/pengembangan lebih lanjut
    // {
    //   key: 'trading-health',
    //   label: 'Trading Health',
    //   icon: Activity,
    //   badge: usersAtRiskCount > 0 ? usersAtRiskCount : undefined,
    //   badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30'
    // },
    { key: 'trading-journal', label: 'Trading Journal', icon: BookOpen },
    { key: 'trading-plans', label: 'Trading Plans', icon: FileCheck2 },
    { key: 'social-media', label: 'Social Media', icon: MessageSquareShare },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    {
      key: 'wa-blaster',
      label: 'WA Blaster',
      icon: MessageSquare,
      badge: 'HOT',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    },
    {
      key: 'email-blast',
      label: 'Email Blast',
      icon: Mail
    },
    { key: 'campaigns', label: 'Campaigns', icon: Megaphone },
    { key: 'competitions', label: 'Competitions', icon: Trophy },
    // TODO: endpoint BE belum tersedia untuk generic Finance Global Transactions (tersedia per-akun via /api/admin/mt5-accounts/:id/transactions), menunggu konfirmasi/pengembangan lebih lanjut
    // {
    //   key: 'finance',
    //   label: 'Finance',
    //   icon: Wallet,
    //   badge: pendingWithdrawalsCount > 0 ? pendingWithdrawalsCount : undefined,
    //   badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    // },
    { key: 'partners', label: 'Partners / IB', icon: UserCheck },
    {
      key: 'support',
      label: 'Support',
      icon: Headphones,
      badge: openTicketsCount > 0 ? openTicketsCount : undefined,
      badgeColor: 'bg-sky-500/20 text-sky-400 border-sky-500/30'
    },
    { key: 'content', label: 'Content (CMS)', icon: FileText },
    // TODO: endpoint BE belum tersedia untuk generic Integrations list/rotate (tersedia spesifik: /api/admin/mt5/test dan /api/admin/news/sync), menunggu konfirmasi/pengembangan lebih lanjut
    // { key: 'integrations', label: 'API & Integrations', icon: Plug },
    { key: 'api-keys', label: 'API Keys', icon: KeyRound },
    { key: 'webhooks', label: 'Webhooks', icon: Webhook },
    { key: 'admin-roles', label: 'Admin & Roles', icon: ShieldCheck },
    { key: 'security', label: 'Security', icon: Lock },
    { key: 'audit-logs', label: 'Audit Logs', icon: History },
    { key: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <aside
      className={`relative flex flex-col bg-slate-950 border-r border-slate-800/80 transition-all duration-300 z-30 select-none ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800/80 bg-slate-950">
        {!isCollapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <TrendingUp className="w-5 h-5 text-slate-950 font-bold" />
            </div>
            <div>
              <span className="font-bold text-white tracking-tight text-sm flex items-center gap-1">
                GOTRADING <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">ADMIN</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono block leading-none">IB & Sub-IB Network Panel</span>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 mx-auto rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-slate-950 font-bold" />
          </div>
        )}
      </div>

      {/* Role Indicator Banner */}
      {!isCollapsed && (
        <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono text-[11px]">ACTIVE ROLE:</span>
          <span className="font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-[10px]">
            {currentRole}
          </span>
        </div>
      )}

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar py-3 px-2 space-y-1">
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = activeNav === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onSelectNav(item.key as NavItemKey)}
              title={isCollapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/80'
              } ${isCollapsed ? 'justify-center px-0' : ''}`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
              {!isCollapsed && (
                <span className="truncate flex-1 text-left">{item.label}</span>
              )}
              {!isCollapsed && item.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full border ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Collapse Toggle Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center p-2 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition-colors text-xs gap-2"
        >
          <SlidersHorizontal className="w-4 h-4" />
          {!isCollapsed && <span>Toggle Sidebar</span>}
        </button>
      </div>
    </aside>
  );
};
