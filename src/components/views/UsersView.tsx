import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  UserX,
  UserCheck,
  Eye,
  X,
  CreditCard,
  LineChart,
  BookOpen,
  Activity,
  Wallet,
  MessageSquare,
  ShieldAlert,
  History,
  FileCheck2,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Clock,
  PhoneCall,
  Send,
  MapPin,
  Building,
  Layers,
  Award,
  Zap
} from 'lucide-react';
import { UserProfile, AdminRole } from '../../types';
import { Badge } from '../ui/Badge';
import { ExportButton } from '../ui/ExportButton';

interface UsersViewProps {
  users: UserProfile[];
  onToggleStatus: (userId: string) => void;
  currentRole: AdminRole;
}

export const UsersView: React.FC<UsersViewProps> = ({ users = [], onToggleStatus, currentRole }) => {
  const [activeUserCategory, setActiveUserCategory] = useState<'ALL' | 'VERIFIED' | 'UNVERIFIED' | 'DORMANT'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState<string>('profile');
  const [sentReengagementAlerts, setSentReengagementAlerts] = useState<Record<string, boolean>>({});

  const safeUsers = Array.isArray(users) ? users : [];

  // Categorization
  const verifiedUsers = safeUsers.filter(u => u?.isVerified);
  const unverifiedUsers = safeUsers.filter(u => !u?.isVerified);
  const dormantUsers = safeUsers.filter(u => u?.isDormant || (u?.daysInactive ?? 0) > 30);

  // Filter based on active category & search term
  const displayedUsers = safeUsers.filter(u => {
    if (!u) return false;
    // Category match
    if (activeUserCategory === 'VERIFIED' && !u.isVerified) return false;
    if (activeUserCategory === 'UNVERIFIED' && u.isVerified) return false;
    if (activeUserCategory === 'DORMANT' && !u.isDormant && (u.daysInactive ?? 0) <= 30) return false;

    // Search match (Nama, Kota, Provinsi, Negara, Email, WA, MT5 Account)
    const term = (searchTerm || '').toLowerCase();
    const matchSearch =
      (u.name || '').toLowerCase().includes(term) ||
      (u.email || '').toLowerCase().includes(term) ||
      (u.city || '').toLowerCase().includes(term) ||
      (u.province || '').toLowerCase().includes(term) ||
      (u.country || '').toLowerCase().includes(term) ||
      (u.phone || '').includes(searchTerm) ||
      (u.mt5Account && (u.mt5Account || '').toLowerCase().includes(term)) ||
      (u.id || '').toLowerCase().includes(term);

    return matchSearch;
  });

  const handleTriggerReengagement = (userId: string) => {
    setSentReengagementAlerts(prev => ({ ...prev, [userId]: true }));
  };

  const detailTabs = [
    { id: 'profile', label: 'Data Profil & Lokasi', icon: Users },
    { id: 'accounts', label: 'Akun Trading & Margin', icon: CreditCard },
    { id: 'dormant', label: 'Status Keaktifan & WA', icon: Clock },
    { id: 'stats', label: 'Statistik Trading', icon: LineChart },
    { id: 'journal', label: 'Jurnal & Plan', icon: BookOpen },
    { id: 'partner', label: 'Sub-IB Network', icon: UserCheck }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-slate-900 border border-slate-800 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" /> USER & CLIENT MANAGEMENT PANEL
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              GOTRADING CORE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Sistem pengelolaan user verified (MT5 connected), unverified (register app saja), data lokasi lengkap, data akun, &amp; dormant account (&gt;30 hari inaktif).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ExportButton filename="gotrading_users_report" data={displayedUsers} />
        </div>
      </div>

      {/* 4 CORE SUMMARY METRIC CARDS (CLICKABLE TABS FOR REQUIREMENTS 1 & 4) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Registered Users */}
        <div
          onClick={() => setActiveUserCategory('ALL')}
          className={`p-5 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${
            activeUserCategory === 'ALL'
              ? 'bg-slate-900 border-emerald-500 shadow-lg shadow-emerald-950/30'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono font-bold text-slate-300">1. TOTAL USER REGISTERED</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white tracking-tight">
            {users.length} <span className="text-xs text-slate-400 font-normal">Traders</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Semua Pendaftar App</span>
            <span className="text-emerald-400 font-bold font-mono">100%</span>
          </div>
          <div className="mt-2 text-[10px] text-emerald-400 font-mono flex items-center gap-1">
            <span>Klik untuk lihat semua</span> &rarr;
          </div>
        </div>

        {/* Card 2: Verified Users (Connected MT5) */}
        <div
          onClick={() => setActiveUserCategory('VERIFIED')}
          className={`p-5 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${
            activeUserCategory === 'VERIFIED'
              ? 'bg-slate-900 border-emerald-500 shadow-lg shadow-emerald-950/30'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono font-bold text-emerald-400">2. USER VERIFIED (CONNECTED)</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400 tracking-tight">
            {verifiedUsers.length} <span className="text-xs text-slate-400 font-normal">Connected MT5</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Sudah connect akun MT5</span>
            <span className="text-emerald-400 font-bold font-mono">
              {Math.round((verifiedUsers.length / (users.length || 1)) * 100)}%
            </span>
          </div>
          <div className="mt-2 text-[10px] text-emerald-400 font-mono flex items-center gap-1">
            <span>Klik untuk tab Verified</span> &rarr;
          </div>
        </div>

        {/* Card 3: Unverified Users (App Register Only, Belum Connect MT5) */}
        <div
          onClick={() => setActiveUserCategory('UNVERIFIED')}
          className={`p-5 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${
            activeUserCategory === 'UNVERIFIED'
              ? 'bg-slate-900 border-amber-500 shadow-lg shadow-amber-950/30'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono font-bold text-amber-400">3. UNVERIFIED (REGISTER ONLY)</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-400 tracking-tight">
            {unverifiedUsers.length} <span className="text-xs text-slate-400 font-normal">Register App</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Belum connect akun MT5</span>
            <span className="text-amber-400 font-bold font-mono">
              {Math.round((unverifiedUsers.length / (users.length || 1)) * 100)}%
            </span>
          </div>
          <div className="mt-2 text-[10px] text-amber-400 font-mono flex items-center gap-1">
            <span>Klik untuk tab Unverified</span> &rarr;
          </div>
        </div>

        {/* Card 4: Dormant Accounts (>30 Hari Inaktif) */}
        <div
          onClick={() => setActiveUserCategory('DORMANT')}
          className={`p-5 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${
            activeUserCategory === 'DORMANT'
              ? 'bg-slate-900 border-rose-500 shadow-lg shadow-rose-950/30'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono font-bold text-rose-400">4. DORMANT ACCOUNTS (&gt;30 HARI)</span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-400 tracking-tight">
            {dormantUsers.length} <span className="text-xs text-slate-400 font-normal">Tidak Aktif</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Inaktif &gt; 30 hari trading</span>
            <span className="text-rose-400 font-bold font-mono">Perlu Re-engagement</span>
          </div>
          <div className="mt-2 text-[10px] text-rose-400 font-mono flex items-center gap-1">
            <span>Klik untuk tab Dormant</span> &rarr;
          </div>
        </div>
      </div>

      {/* FILTER TABS & SEARCH BAR */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Tab Buttons */}
        <div className="flex items-center gap-2 overflow-x-auto text-xs">
          <button
            onClick={() => setActiveUserCategory('ALL')}
            className={`px-3.5 py-2 font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeUserCategory === 'ALL'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Semua Users ({users.length})
          </button>

          <button
            onClick={() => setActiveUserCategory('VERIFIED')}
            className={`px-3.5 py-2 font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeUserCategory === 'VERIFIED'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            User Verified MT5 ({verifiedUsers.length})
          </button>

          <button
            onClick={() => setActiveUserCategory('UNVERIFIED')}
            className={`px-3.5 py-2 font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeUserCategory === 'UNVERIFIED'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            User Unverified ({unverifiedUsers.length})
          </button>

          <button
            onClick={() => setActiveUserCategory('DORMANT')}
            className={`px-3.5 py-2 font-bold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeUserCategory === 'DORMANT'
                ? 'bg-rose-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Dormant Account (&gt;30 Hari) ({dormantUsers.length})
          </button>
        </div>

        {/* Universal Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Cari nama, kota, provinsi, WA, MT5..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* COMPREHENSIVE USERS DATA TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
              <tr>
                <th className="p-3">TRADER & VERIFIKASI</th>
                <th className="p-3">LOKASI (KOTA, PROVINSI, NEGARA)</th>
                <th className="p-3">NO WHATSAPP (WA)</th>
                <th className="p-3">DATA AKUN MT5 / BROKER</th>
                <th className="p-3 text-right">BALANCE ($)</th>
                <th className="p-3 text-right">EQUITY ($)</th>
                <th className="p-3 text-right">MARGIN / FREE ($)</th>
                <th className="p-3 text-right">LOTS TRADED</th>
                <th className="p-3 text-center">STATUS AKTIVITAS</th>
                <th className="p-3 text-right">AKSI ADMIN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {displayedUsers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-500 font-mono">
                    Tidak ada user yang cocok dengan kategori/pencarian ini.
                  </td>
                </tr>
              ) : (
                displayedUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Nama Trader & Status Verifikasi */}
                    <td className="p-3">
                      <div className="font-bold text-white text-sm flex items-center gap-1.5">
                        {u.name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                      <div className="mt-1 flex items-center gap-1">
                        {u.isVerified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> VERIFIED (MT5)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            <AlertCircle className="w-3 h-3" /> UNVERIFIED (APP ONLY)
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Lokasi Lengkap: Kota, Provinsi, Negara */}
                    <td className="p-3">
                      <div className="font-semibold text-slate-200 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" /> {u.city || '-'}
                      </div>
                      <div className="text-[11px] text-slate-400 pl-4">
                        {u.province || '-'}, <span className="font-mono text-slate-300">{u.country || 'ID'}</span>
                      </div>
                    </td>

                    {/* No WhatsApp */}
                    <td className="p-3">
                      <a
                        href={`https://wa.me/${(u.phone || '').replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 font-mono text-emerald-400 hover:underline font-bold bg-emerald-950/40 px-2 py-1 rounded border border-emerald-800/40"
                        title="Chat via WhatsApp"
                      >
                        <PhoneCall className="w-3 h-3 text-emerald-400" /> {u.phone || '-'}
                      </a>
                    </td>

                    {/* Data Akun MT5 / Broker */}
                    <td className="p-3">
                      {u.isVerified && u.mt5Account ? (
                        <div>
                          <div className="font-mono font-bold text-sky-400">{u.mt5Account}</div>
                          <div className="text-[11px] text-slate-400 font-sans">
                            {u.broker || 'Broker'} • <span className="font-mono text-slate-300">{u.leverage || '1:500'}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">Belum terhubung ke MT5</span>
                      )}
                    </td>

                    {/* Balance */}
                    <td className="p-3 text-right font-mono font-bold text-white text-sm">
                      ${(u.balance ?? 0).toLocaleString()}
                    </td>

                    {/* Equity */}
                    <td className="p-3 text-right font-mono font-bold text-emerald-400 text-sm">
                      ${(u.equity ?? 0).toLocaleString()}
                    </td>

                    {/* Margin & Free Margin */}
                    <td className="p-3 text-right font-mono text-xs">
                      <div className="text-slate-300">${(u.margin ?? 0).toLocaleString()}</div>
                      <div className="text-[10px] text-slate-500">Free: ${(u.freeMargin ?? 0).toLocaleString()}</div>
                    </td>

                    {/* Volume Lots Traded */}
                    <td className="p-3 text-right font-mono font-bold text-sky-400">
                      {u.lotsTraded ? `${u.lotsTraded} Lots` : '0 Lots'}
                    </td>

                    {/* Status Aktivitas / Dormant */}
                    <td className="p-3 text-center">
                      {u.isDormant || u.daysInactive > 30 ? (
                        <div className="space-y-1">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                            DORMANT ({u.daysInactive} Hari)
                          </span>
                          <span className="block text-[9px] text-slate-500">{u.lastTradingActivity}</span>
                        </div>
                      ) : u.isVerified ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          AKTIF TRADING
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                          APP USER ONLY
                        </span>
                      )}
                    </td>

                    {/* Action Buttons */}
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Dormant Re-engagement Trigger */}
                        {(u.isDormant || u.daysInactive > 30) && (
                          <button
                            onClick={() => handleTriggerReengagement(u.id)}
                            className={`p-1.5 rounded text-xs font-bold transition-all flex items-center gap-1 ${
                              sentReengagementAlerts[u.id]
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30'
                            }`}
                            title="Kirim Notifikasi Re-Engagement & Promo Trading"
                          >
                            <Send className="w-3.5 h-3.5" />
                            {sentReengagementAlerts[u.id] ? 'Alert Sent' : 'Re-engage'}
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedUser(u)}
                          className="p-1.5 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                          title="Lihat Detail Profil Lengkap"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onToggleStatus(u.id)}
                          className={`p-1.5 rounded transition-colors ${
                            u.status === 'ACTIVE'
                              ? 'text-rose-400 bg-rose-500/10 hover:bg-rose-500/20'
                              : 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                          }`}
                          title={u.status === 'ACTIVE' ? 'Suspend User' : 'Activate User'}
                        >
                          {u.status === 'ACTIVE' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* USER DETAIL SIDE DRAWER */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-4xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl animate-slide-left">
            {/* Drawer Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-white">{selectedUser.name}</h3>
                  <Badge variant={selectedUser.status === 'ACTIVE' ? 'success' : 'danger'}>
                    {selectedUser.status}
                  </Badge>
                  {selectedUser.isVerified ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      VERIFIED (MT5 CONNECTED)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      UNVERIFIED (REGISTER ONLY)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Email: {selectedUser.email} • ID: {selectedUser.id}
                </p>
              </div>

              <button
                onClick={() => setSelectedUser(null)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-tabs Navigation */}
            <div className="flex items-center gap-1 overflow-x-auto px-6 py-2 border-b border-slate-800 bg-slate-950/50 custom-scrollbar text-xs">
              {detailTabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeDrawerTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveDrawerTab(tab.id)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-colors font-bold ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Drawer Body Content */}
            <div className="p-6 overflow-y-auto flex-1 text-xs text-slate-300 space-y-4">
              {activeDrawerTab === 'profile' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                      <span className="text-slate-500 font-mono text-[10px]">NAMA LENGKAP</span>
                      <div className="font-bold text-white text-sm mt-1">{selectedUser.name}</div>
                    </div>

                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                      <span className="text-slate-500 font-mono text-[10px]">NO WHATSAPP / TELEPON</span>
                      <div className="font-bold text-emerald-400 mt-1 flex items-center gap-2">
                        <PhoneCall className="w-4 h-4" /> {selectedUser.phone}
                      </div>
                    </div>

                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                      <span className="text-slate-500 font-mono text-[10px]">KOTA</span>
                      <div className="font-bold text-white text-sm mt-1">{selectedUser.city}</div>
                    </div>

                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                      <span className="text-slate-500 font-mono text-[10px]">PROVINSI</span>
                      <div className="font-bold text-white text-sm mt-1">{selectedUser.province}</div>
                    </div>

                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                      <span className="text-slate-500 font-mono text-[10px]">NEGARA</span>
                      <div className="font-bold text-white text-sm mt-1">{selectedUser.country}</div>
                    </div>

                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                      <span className="text-slate-500 font-mono text-[10px]">TANGGAL REGISTRASI APP</span>
                      <div className="font-bold text-white mt-1">{selectedUser.registrationDate}</div>
                    </div>
                  </div>
                </div>
              )}

              {activeDrawerTab === 'accounts' && (
                <div className="space-y-4">
                  <div className="p-5 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-white text-sm">
                          {selectedUser.broker || 'Broker Unassigned'} ({selectedUser.mt5Account || 'No MT5 Connected'})
                        </div>
                        <span className="text-slate-400 text-xs">
                          Leverage: {selectedUser.leverage || 'N/A'}
                        </span>
                      </div>
                      <Badge variant={selectedUser.isVerified ? 'success' : 'warning'}>
                        {selectedUser.isVerified ? 'CONNECTED' : 'UNCONNECTED'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-800 font-mono">
                      <div>
                        <span className="text-slate-500 text-[10px] block">BALANCE</span>
                        <span className="font-bold text-white">${(selectedUser.balance ?? 0).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">EQUITY</span>
                        <span className="font-bold text-emerald-400">${(selectedUser.equity ?? 0).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">MARGIN</span>
                        <span className="font-bold text-amber-400">${(selectedUser.margin ?? 0).toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block">FREE MARGIN</span>
                        <span className="font-bold text-sky-400">${(selectedUser.freeMargin ?? 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeDrawerTab === 'dormant' && (
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-lg space-y-3">
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4 text-rose-400" /> Status Keaktifan Trading Client
                  </div>
                  <p className="text-slate-400">
                    Aktivitas trading terakhir dikirimkan via sinkronisasi otomatis MT5 broker Gotrading.
                  </p>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="p-3 bg-slate-900 border border-slate-800 rounded">
                      <span className="text-slate-500 text-[10px]">JUMLAH HARI INAKTIF</span>
                      <div className="text-lg font-bold text-rose-400">{selectedUser.daysInactive ?? 0} Hari</div>
                    </div>
                    <div className="p-3 bg-slate-900 border border-slate-800 rounded">
                      <span className="text-slate-500 text-[10px]">TANGGAL TRADING TERAKHIR</span>
                      <div className="text-sm font-bold text-white mt-1">{selectedUser.lastTradingActivity || '-'}</div>
                    </div>
                  </div>

                  <div className="pt-3 flex gap-2">
                    <a
                      href={`https://wa.me/${(selectedUser.phone || '').replace(/[^0-9]/g, '')}?text=Halo%20${encodeURIComponent(selectedUser.name || '')},%20kami%20dari%20Gotrading%20ingin%20menawarkan%20promo%20bonus%20deposit...`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-lg hover:bg-emerald-400 transition-colors flex items-center gap-2"
                    >
                      <PhoneCall className="w-4 h-4" /> Follow Up Client via WhatsApp
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
