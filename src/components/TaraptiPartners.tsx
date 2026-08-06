import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, DollarSign, Wallet, CheckCircle2, Clock, Copy, Share2, 
  Filter, Search, ArrowUpRight, Award, TrendingUp, Handshake, 
  Building2, ArrowRight, ShieldCheck, Calendar, Sparkles, ExternalLink
} from 'lucide-react';
import { useApp } from './AppContext.tsx';
import { getCountryFlag } from '../utils/formatters.ts';

// Mock Payout Data
interface PayoutItem {
  id: string;
  date: string;
  period: 'this_month' | 'last_month' | 'may_2026' | 'april_2026';
  amount: number;
  method: string;
  accountNumber: string;
  status: 'PAID' | 'PROCESSING';
}

const PAYOUT_HISTORY: PayoutItem[] = [
  { id: 'PO-9918', date: '25 Jul 2026', period: 'this_month', amount: 280.00, method: 'Bank Transfer (BCA)', accountNumber: '88301****', status: 'PAID' },
  { id: 'PO-9840', date: '18 Jul 2026', period: 'this_month', amount: 150.00, method: 'USDT (TRC20)', accountNumber: '0x71a****', status: 'PAID' },
  { id: 'PO-9712', date: '27 Jun 2026', period: 'last_month', amount: 420.00, method: 'Bank Transfer (Mandiri)', accountNumber: '14200****', status: 'PAID' },
  { id: 'PO-9650', date: '13 Jun 2026', period: 'last_month', amount: 230.00, method: 'USDT (TRC20)', accountNumber: '0x71a****', status: 'PAID' },
  { id: 'PO-9510', date: '28 Mei 2026', period: 'may_2026', amount: 260.00, method: 'Bank Transfer (BCA)', accountNumber: '88301****', status: 'PAID' },
  { id: 'PO-9420', date: '14 Mei 2026', period: 'may_2026', amount: 160.00, method: 'Bank Transfer (BCA)', accountNumber: '88301****', status: 'PAID' },
  { id: 'PO-9310', date: '25 Apr 2026', period: 'april_2026', amount: 370.00, method: 'USDT (TRC20)', accountNumber: '0x71a****', status: 'PAID' },
];

// Mock Referral Item
export interface ReferralUser {
  id: string;
  name: string;
  username: string;
  avatar: string;
  country: string;
  joinDate: string;
  status: 'registered' | 'connected' | 'active';
  broker?: string;
  accountNo?: string;
  volumeLots: number;
  commissionEarned: number;
}

export const MOCK_REFERRALS: ReferralUser[] = [
  {
    id: 'ref-1',
    name: 'Rizky Pratama',
    username: 'rizky_fx',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    country: 'Indonesia',
    joinDate: '20 Jul 2026',
    status: 'active',
    broker: 'Exness',
    accountNo: 'MT5-8831920',
    volumeLots: 34.50,
    commissionEarned: 472.50
  },
  {
    id: 'ref-2',
    name: 'Budi Santoso',
    username: 'budi_trader',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    country: 'Indonesia',
    joinDate: '18 Jul 2026',
    status: 'active',
    broker: 'Axi',
    accountNo: 'MT5-9012481',
    volumeLots: 28.10,
    commissionEarned: 340.50
  },
  {
    id: 'ref-3',
    name: 'Nguyen Van Minh',
    username: 'minh_gold',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    country: 'Vietnam',
    joinDate: '15 Jul 2026',
    status: 'active',
    broker: 'XM Global',
    accountNo: 'MT5-7718290',
    volumeLots: 42.00,
    commissionEarned: 510.00
  },
  {
    id: 'ref-4',
    name: 'Siti Sarah',
    username: 'sitisarah',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    country: 'Malaysia',
    joinDate: '12 Jul 2026',
    status: 'connected',
    broker: 'OctaFX',
    accountNo: 'MT5-4421092',
    volumeLots: 12.40,
    commissionEarned: 162.00
  },
  {
    id: 'ref-5',
    name: 'Somchai Prasert',
    username: 'somchai_th',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    country: 'Thailand',
    joinDate: '10 Jul 2026',
    status: 'active',
    broker: 'FBS',
    accountNo: 'MT5-3310922',
    volumeLots: 55.20,
    commissionEarned: 476.00
  },
  {
    id: 'ref-6',
    name: 'Dewi Anggraini',
    username: 'dewi_chartist',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    country: 'Indonesia',
    joinDate: '08 Jul 2026',
    status: 'registered',
    volumeLots: 0,
    commissionEarned: 0
  },
  {
    id: 'ref-7',
    name: 'Ahmad Fauzi',
    username: 'fauzi_scalp',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
    country: 'Indonesia',
    joinDate: '05 Jul 2026',
    status: 'active',
    broker: 'Exness',
    accountNo: 'MT5-8839912',
    volumeLots: 18.60,
    commissionEarned: 193.00
  },
  {
    id: 'ref-8',
    name: 'Kevin Tan',
    username: 'kevintan',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150',
    country: 'Singapore',
    joinDate: '02 Jul 2026',
    status: 'registered',
    volumeLots: 0,
    commissionEarned: 0
  },
  {
    id: 'ref-9',
    name: 'Agus Wijaya',
    username: 'agus_pro',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
    country: 'Indonesia',
    joinDate: '28 Jun 2026',
    status: 'active',
    broker: 'Pepperstone',
    accountNo: 'MT5-1102931',
    volumeLots: 68.00,
    commissionEarned: 540.00
  },
  {
    id: 'ref-10',
    name: 'Maya Putri',
    username: 'mayaputri',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    country: 'Indonesia',
    joinDate: '22 Jun 2026',
    status: 'registered',
    volumeLots: 0,
    commissionEarned: 0
  }
];

export const TaraptiPartners: React.FC = () => {
  const { currentUser, showToast, viewUserProfile } = useApp();
  
  // Payout Timeframe Filter
  const [payoutFilter, setPayoutFilter] = useState<'all' | 'this_month' | 'last_month' | 'may_2026' | 'april_2026'>('all');
  
  // Commission Timeframe Filter
  const [commissionFilter, setCommissionFilter] = useState<'all' | 'last_week' | 'this_month' | 'last_month' | 'may_2026' | 'april_2026'>('all');
  
  // Referral List Tab
  const [listTab, setListTab] = useState<'all_referrals' | 'active_users'>('all_referrals');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  const refCode = `TARAPTI-${currentUser?.id ? currentUser.id.slice(0, 6).toUpperCase() : 'VIP88'}`;
  const refLink = `https://tarapti.app/register?ref=${refCode}`;

  const copyToClipboard = async (text: string, label: string) => {
    let success = false;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        success = true;
      } catch (e) {
        console.warn('navigator.clipboard.writeText failed, trying fallback', e);
      }
    }
    if (!success) {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        success = document.execCommand('copy');
        document.body.removeChild(textArea);
      } catch (err) {
        document.body.removeChild(textArea);
      }
    }

    if (success) {
      showToast(`${label} berhasil disalin!`);
    } else {
      prompt(`Salin ${label} secara manual:`, text);
      showToast(`${label} berhasil disalin!`);
    }
  };

  // Filtered Payout Items & Sum
  const filteredPayouts = PAYOUT_HISTORY.filter(p => {
    if (payoutFilter === 'all') return true;
    return p.period === payoutFilter;
  });

  const totalPayoutSum = filteredPayouts.reduce((sum, p) => sum + p.amount, 0);

  // Referral filtering
  const filteredReferrals = MOCK_REFERRALS.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.country.toLowerCase().includes(searchQuery.toLowerCase());
    if (listTab === 'active_users') {
      return matchesSearch && (item.status === 'active' || item.status === 'connected');
    }
    return matchesSearch;
  });

  const totalClientsCount = MOCK_REFERRALS.length;
  const activeClientsCount = MOCK_REFERRALS.filter(r => r.status === 'active' || r.status === 'connected').length;
  
  const getCommissionByFilter = () => {
    let rawCommission = 0;
    switch (commissionFilter) {
      case 'last_week':
        rawCommission = 385.50;
        break;
      case 'this_month':
        rawCommission = 814.50;
        break;
      case 'last_month':
        rawCommission = 950.00;
        break;
      case 'may_2026':
        rawCommission = 650.00;
        break;
      case 'april_2026':
        rawCommission = 490.00;
        break;
      case 'all':
      default:
        rawCommission = MOCK_REFERRALS.reduce((acc, curr) => acc + curr.commissionEarned, 0);
        break;
    }
    return rawCommission;
  };
  const totalCommissionGenerated = getCommissionByFilter();
  const totalPendingPayout = Math.max(0, totalCommissionGenerated - totalPayoutSum);

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      
      {/* Tarapti Partners Banner & Info (Redesigned Clean & Elegant) */}
      <div className="bg-white dark:bg-[#121620] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xs relative overflow-hidden space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center font-black shadow-2xs">
              <Handshake size={22} />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Tarapti Partners
                <span className="bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full border border-indigo-200/60 dark:border-indigo-800">
                  IB Portal
                </span>
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Program Afiliasi & Introducing Broker Resmi Tarapti</p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck size={14} />
            <span>Status: Active Partner</span>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl font-medium">
          Setiap user yang mendaftar melalui referral Anda, menghubungkan akun trading (<strong className="text-indigo-600 dark:text-indigo-400">Connect Account MT5</strong>), dan aktif bertransaksi, Anda akan mendapatkan komisi otomatis hingga <strong className="text-emerald-600 dark:text-emerald-400">50% dari Komisi Tarapti</strong>.
        </p>

        {/* Referral Link & Code Box */}
        <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Link Referral Anda</span>
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <Sparkles size={12} /> Komisi Hingga 50%
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch gap-2">
            <div className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-indigo-200 font-mono truncate flex items-center justify-between shadow-2xs">
              <span className="truncate">{refLink}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => copyToClipboard(refLink, 'Link Referral')}
                className="flex-1 sm:flex-initial px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-600/15 cursor-pointer active:scale-95"
              >
                <Copy size={14} />
                <span>Salin Link</span>
              </button>
              <button
                onClick={() => copyToClipboard(refCode, 'Kode Referral')}
                className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 border border-slate-200 dark:border-slate-700 cursor-pointer active:scale-95 shadow-2xs"
                title="Salin Kode Referral"
              >
                <span>Kode: {refCode}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Main Key Metric Cards arranged in 2 side-by-side rows of compact cards */}
      <div className="space-y-3.5">
        
        {/* Row 1: Commission & Payout */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* Card 1: Commission (Clean Emerald Banking Theme) */}
          <div className="bg-emerald-100/95 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-3.5 shadow-sm relative overflow-hidden group hover:border-emerald-400 dark:hover:border-emerald-600 transition flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900 dark:text-emerald-300 truncate">
                Commission
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <DollarSign size={14} />
              </div>
            </div>
            <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
              ${totalCommissionGenerated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            
            {/* Commission Filter Dropdown */}
            <div className="mt-1.5 flex items-center gap-1">
              <Filter size={10} className="text-emerald-700 dark:text-emerald-400 shrink-0" />
              <select
                value={commissionFilter}
                onChange={(e) => setCommissionFilter(e.target.value as any)}
                className="bg-emerald-200/85 dark:bg-emerald-900/90 text-emerald-950 dark:text-emerald-100 font-bold text-[9px] rounded-md px-1.5 py-0.5 border border-emerald-300/80 dark:border-emerald-700 focus:outline-none cursor-pointer w-full truncate"
              >
                <option value="all">Semua Waktu (All Time)</option>
                <option value="last_week">Minggu Lalu (Last Week)</option>
                <option value="this_month">Bulan Ini (Juli)</option>
                <option value="last_month">Bulan Lalu (Juni)</option>
                <option value="may_2026">Mei 2026</option>
                <option value="april_2026">April 2026</option>
              </select>
            </div>
          </div>

          {/* Card 2: Payout (Clean Blue Banking Theme) */}
          <div className="bg-blue-100/95 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 rounded-2xl p-3.5 shadow-sm relative overflow-hidden group hover:border-blue-400 dark:hover:border-blue-600 transition flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-900 dark:text-blue-300 truncate">
                Payout
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Wallet size={14} />
              </div>
            </div>
            <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
              ${totalPayoutSum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            
            {/* Payout Filter Dropdown */}
            <div className="mt-1.5 flex items-center gap-1">
              <Filter size={10} className="text-blue-700 dark:text-blue-400 shrink-0" />
              <select
                value={payoutFilter}
                onChange={(e) => setPayoutFilter(e.target.value as any)}
                className="bg-blue-200/85 dark:bg-blue-900/90 text-blue-950 dark:text-blue-100 font-bold text-[9px] rounded-md px-1.5 py-0.5 border border-blue-300/80 dark:border-blue-700 focus:outline-none cursor-pointer w-full truncate"
              >
                <option value="all">Semua Waktu (All Time)</option>
                <option value="this_month">Bulan Ini (Juli)</option>
                <option value="last_month">Bulan Lalu (Juni)</option>
                <option value="may_2026">Mei 2026</option>
                <option value="april_2026">April 2026</option>
              </select>
            </div>
          </div>
        </div>

        {/* Row 2: Pending Payout & Total Referral */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {/* Card 3: Pending Payout (Clean Amber Banking Theme) */}
          <div className="bg-amber-100/95 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-3.5 shadow-sm relative overflow-hidden group hover:border-amber-400 dark:hover:border-amber-600 transition flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900 dark:text-amber-300 truncate">
                Pending Payout
              </span>
              <div className="w-7 h-7 rounded-lg bg-amber-600 dark:bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Clock size={14} />
              </div>
            </div>
            <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
              ${totalPendingPayout.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="mt-1.5 text-[9px] font-bold text-amber-950 dark:text-amber-100 bg-amber-200/85 dark:bg-amber-900/90 border border-amber-300/80 dark:border-amber-700 px-2 py-0.5 rounded-md truncate">
              ⚡ Diproses Every Friday
            </div>
          </div>

          {/* Card 4: Total Referral (Clean Purple Banking Theme) */}
          <div className="bg-purple-100/95 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60 rounded-2xl p-3.5 shadow-sm relative overflow-hidden group hover:border-purple-400 dark:hover:border-purple-600 transition flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-900 dark:text-purple-300 truncate">
                Total Referral
              </span>
              <div className="w-7 h-7 rounded-lg bg-purple-600 dark:bg-purple-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Users size={14} />
              </div>
            </div>
            <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
              {totalClientsCount} Client
            </div>
            <div className="mt-1.5 text-[9px] font-bold text-purple-950 dark:text-purple-200 bg-purple-200/85 dark:bg-purple-900/90 border border-purple-300/80 dark:border-purple-700 px-2 py-0.5 rounded-md flex items-center gap-1.5 truncate">
              <span className="text-emerald-700 dark:text-emerald-400 font-extrabold">{activeClientsCount} Aktif</span>
              <span>•</span>
              <span>{totalClientsCount - activeClientsCount} Register</span>
            </div>
          </div>
        </div>

      </div>

      {/* Payout History Drawer / Detail Expandable */}
      <div className="bg-white dark:bg-[#121620] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Laporan Payout Terbayar ({filteredPayouts.length} Transaksi)
            </h3>
          </div>
          <span className="text-[10px] font-bold text-slate-400">Filter: {payoutFilter.replace('_', ' ').toUpperCase()}</span>
        </div>

        {filteredPayouts.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs font-medium">
            Tidak ada transaksi payout pada periode ini.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {filteredPayouts.map(po => (
              <div key={po.id} className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span>{po.id}</span>
                    <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-extrabold px-1.5 py-0.2 rounded-md">
                      {po.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{po.date} • {po.method} ({po.accountNumber})</div>
                </div>
                <div className="text-right font-black text-indigo-600 dark:text-indigo-400 text-sm">
                  +${po.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Referral List Tabs Section */}
      <div className="bg-white dark:bg-[#121620] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-4">
        
        {/* Header & Tabs Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Users size={16} className="text-indigo-600 dark:text-indigo-400" />
              Daftar Klien Referral
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">Kelola & pantau status klien yang mendaftar melalui referral Anda</p>
          </div>

          {/* 2 Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-900 p-1 rounded-xl gap-1">
            <button
              onClick={() => setListTab('all_referrals')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                listTab === 'all_referrals'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-white shadow-xs font-extrabold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span>1. List Referral di Tarapti</span>
              <span className="bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {totalClientsCount}
              </span>
            </button>

            <button
              onClick={() => setListTab('active_users')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                listTab === 'active_users'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs font-extrabold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span>2. List User Active (Connect Acc)</span>
              <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {activeClientsCount}
              </span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, username, atau negara klien..."
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-200 font-medium placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {/* Content List */}
        {filteredReferrals.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs font-medium bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            Tidak ditemukan klien referral yang sesuai.
          </div>
        ) : (
          <div className="space-y-2">
            {filteredReferrals.map(client => (
              <div 
                key={client.id}
                className="p-3.5 bg-slate-50/80 dark:bg-slate-900/50 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-800 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                {/* User Info (Clickable Profile) */}
                <div 
                  onClick={() => viewUserProfile(client.id)}
                  className="flex items-center gap-3 cursor-pointer group/user hover:opacity-90 transition"
                  title={`Lihat profil ${client.name}`}
                >
                  <div className="relative shrink-0">
                    <img 
                      src={client.avatar} 
                      alt={client.name} 
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-2xs group-hover/user:border-indigo-500 transition"
                      referrerPolicy="no-referrer"
                    />
                    <div 
                      className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-center text-[9px] overflow-hidden select-none"
                      title={client.country}
                    >
                      {getCountryFlag(client.country)}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-slate-900 dark:text-white group-hover/user:text-indigo-600 dark:group-hover/user:text-indigo-400 transition">{client.name}</span>
                      <span className="text-[10px] text-slate-400 font-medium">@{client.username}</span>
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                      <span>Joined: {client.joinDate}</span>
                      {client.broker && (
                        <>
                          <span>•</span>
                          <span className="font-semibold text-indigo-600 dark:text-indigo-400">{client.broker} ({client.accountNo})</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status & Commission Stats */}
                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/60 dark:border-slate-800">
                  <div className="text-left sm:text-right">
                    <div className="text-[9px] font-black uppercase text-slate-400">Komisi</div>
                    <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                      ${(client.commissionEarned).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {client.status === 'active' && (
                      <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-black text-[9px] px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 border border-emerald-300/50">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Active Trader
                      </span>
                    )}
                    {client.status === 'connected' && (
                      <span className="bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-black text-[9px] px-2.5 py-1 rounded-full uppercase tracking-wider border border-blue-300/50">
                        Connected Acc
                      </span>
                    )}
                    {client.status === 'registered' && (
                      <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-[9px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                        Terdaftar
                      </span>
                    )}
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>

    </div>
  );
};
