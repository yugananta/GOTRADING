import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, DollarSign, Wallet, CheckCircle2, Clock, Copy, Share2, 
  Filter, Search, ArrowUpRight, Award, TrendingUp, Handshake, 
  Building2, ArrowRight, ShieldCheck, Calendar, Sparkles, ExternalLink,
  RefreshCw, AlertCircle, UserCheck, UserX
} from 'lucide-react';
import { useApp } from './AppContext.tsx';
import { getCountryFlag } from '../utils/formatters.ts';
import { apiFetch } from '../utils/apiFetch.ts';

// Real Payout Item Structure
export interface PayoutItem {
  id: string | number;
  date: string;
  period?: string;
  amount: number;
  method: string;
  accountNumber?: string;
  status: 'PAID' | 'PROCESSING' | 'PENDING' | 'REJECTED' | 'paid' | 'completed';
}

// Real Referral User Structure
export interface ReferralUser {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  country?: string;
  joinDate?: string;
  status: 'registered' | 'connected' | 'active';
  broker?: string;
  accountNo?: string;
  volumeLots?: number;
  commissionEarned?: number;
}

// Real IB Financial & Profile Summary
export interface IbSummary {
  referralCode?: string;
  referralLink?: string;
  totalCommission?: number;
  totalPayout?: number;
  pendingPayout?: number;
  totalReferrals?: number;
  activeReferrals?: number;
  status?: string;
  payouts?: PayoutItem[];
}

export const TaraptiPartners: React.FC = () => {
  const { currentUser, showToast, viewUserProfile } = useApp();
  
  // Real API State
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [ibSummary, setIbSummary] = useState<IbSummary | null>(null);
  const [referrals, setReferrals] = useState<ReferralUser[]>([]);
  const [payouts, setPayouts] = useState<PayoutItem[]>([]);

  // Filters
  const [payoutFilter, setPayoutFilter] = useState<'all' | 'this_month' | 'last_month' | 'older'>('all');
  const [commissionFilter, setCommissionFilter] = useState<'all' | 'last_week' | 'this_month' | 'last_month'>('all');
  const [listTab, setListTab] = useState<'all_referrals' | 'active_users'>('all_referrals');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch real data from BE APIs
  const fetchPartnerData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      // 1. Fetch Profile & Financial Summary: GET /api/ib/me
      const summaryPromise = apiFetch('/api/ib/me');
      
      // 2. Fetch Referral Clients & Commissions: GET /api/ib/me/commissions
      const commissionsPromise = apiFetch('/api/ib/me/commissions');

      const [summaryRes, commissionsRes] = await Promise.all([summaryPromise, commissionsPromise]);

      // Process summary
      if (summaryRes.ok) {
        const json = await summaryRes.json();
        const data: IbSummary = json.data || json;
        setIbSummary(data);
        if (Array.isArray(data.payouts)) {
          setPayouts(data.payouts);
        }
      } else {
        console.warn('[TaraptiPartners] GET /api/ib/me returned status:', summaryRes.status);
      }

      // Process referrals / commissions
      if (commissionsRes.ok) {
        const json = await commissionsRes.json();
        const data = json.data || json;
        if (Array.isArray(data)) {
          setReferrals(data);
        } else if (data && Array.isArray(data.commissions)) {
          setReferrals(data.commissions);
        } else {
          setReferrals([]);
        }
      } else {
        console.warn('[TaraptiPartners] GET /api/ib/me/commissions returned status:', commissionsRes.status);
      }
    } catch (err: any) {
      console.error('[TaraptiPartners] Error fetching partner data:', err);
      setError('Gagal memuat data kemitraan dari server. Silakan muat ulang.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPartnerData();
  }, [fetchPartnerData]);

  // Derived referral code & link
  const fallbackCode = currentUser?.username 
    ? currentUser.username.toUpperCase() 
    : (currentUser?.id ? currentUser.id.slice(0, 6).toUpperCase() : 'PARTNER');
  
  const refCode = ibSummary?.referralCode || `GOTRADING-${fallbackCode}`;
  const refLink = ibSummary?.referralLink || `https://gotrading.id/register?ref=${refCode}`;

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

  // Metric Computations strictly from real state
  const totalCommissionGenerated = Number(ibSummary?.totalCommission) || (referrals.reduce((sum, r) => sum + (Number(r.commissionEarned) || 0), 0));
  const totalPayoutSum = Number(ibSummary?.totalPayout) || (payouts.filter(p => p.status === 'PAID' || p.status === 'paid' || p.status === 'completed').reduce((sum, p) => sum + (Number(p.amount) || 0), 0));
  const totalPendingPayout = Number(ibSummary?.pendingPayout) ?? Math.max(0, totalCommissionGenerated - totalPayoutSum);

  const totalClientsCount = (ibSummary?.totalReferrals !== undefined && ibSummary?.totalReferrals !== null)
    ? Number(ibSummary.totalReferrals)
    : referrals.length;
  const activeClientsCount = (ibSummary?.activeReferrals !== undefined && ibSummary?.activeReferrals !== null)
    ? Number(ibSummary.activeReferrals)
    : referrals.filter(r => r.status === 'active' || r.status === 'connected').length;

  // Filtered Referral List
  const filteredReferrals = referrals.filter(item => {
    const nameStr = item.name || '';
    const userStr = item.username || '';
    const countryStr = item.country || '';
    const brokerStr = item.broker || '';
    const query = searchQuery.toLowerCase();

    const matchesSearch = nameStr.toLowerCase().includes(query) || 
                          userStr.toLowerCase().includes(query) ||
                          countryStr.toLowerCase().includes(query) ||
                          brokerStr.toLowerCase().includes(query);
    if (listTab === 'active_users') {
      return matchesSearch && (item.status === 'active' || item.status === 'connected');
    }
    return matchesSearch;
  });

  // Filtered Payouts
  const filteredPayouts = payouts.filter(p => {
    if (payoutFilter === 'all') return true;
    if (p.period) return p.period === payoutFilter;
    return true;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      
      {/* GOTRADING CONNECT Banner & Info */}
      <div className="bg-white dark:bg-[#121620] border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xs relative overflow-hidden space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center font-black shadow-2xs">
              <Handshake size={22} />
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                GOTRADING CONNECT
                <span className="bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full border border-indigo-200/60 dark:border-indigo-800">
                  IB Portal
                </span>
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Program Afiliasi & Introducing Broker Resmi GoTrading</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchPartnerData(true)}
              disabled={loading || refreshing}
              className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition cursor-pointer disabled:opacity-50"
              title="Perbarui Data"
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin text-indigo-600' : ''} />
            </button>
            <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck size={14} />
              <span>Status: Active Connect</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl font-medium">
          Setiap user yang mendaftar melalui referral Anda, menghubungkan akun trading (<strong className="text-indigo-600 dark:text-indigo-400">Connect Account MT5</strong>), dan aktif bertransaksi, Anda akan mendapatkan bagi hasil komisi hingga <strong className="text-emerald-600 dark:text-emerald-400">50% dari Komisi GoTrading</strong>.
        </p>

        {/* Referral Link & Code Box */}
        <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Link Referral Anda</span>
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <Sparkles size={12} /> Bagi Hasil Komisi s/d 50%
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

      {/* Loading Indicator */}
      {loading ? (
        <div className="bg-white dark:bg-[#121620] border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center space-y-3">
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Memuat data kemitraan & komisi dari server...</p>
          <p className="text-[11px] text-slate-400">Sinkronisasi database live GoTrading</p>
        </div>
      ) : error ? (
        <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-2xl p-5 text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button
            onClick={() => fetchPartnerData()}
            className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      ) : (
        <>
          {/* 4 Main Key Metric Cards */}
          <div className="space-y-3.5">
            
            {/* Row 1: Commission & Payout */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              
              {/* Card 1: Commission */}
              <div className="bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-2xl p-4 shadow-sm relative overflow-hidden group hover:border-emerald-400 dark:hover:border-emerald-600 transition flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900 dark:text-emerald-300 truncate">
                    Commission
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <DollarSign size={14} />
                  </div>
                </div>

                <div>
                  {totalCommissionGenerated > 0 ? (
                    <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                      ${totalCommissionGenerated.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  ) : (
                    <div>
                      <div className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-200 tracking-tight">
                        $0.00
                      </div>
                      <span className="inline-block mt-0.5 text-[9px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.2 rounded">
                        Belum ada komisi
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  Akumulasi komisi dari referral aktif
                </div>
              </div>

              {/* Card 2: Payout */}
              <div className="bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/60 rounded-2xl p-4 shadow-sm relative overflow-hidden group hover:border-blue-400 dark:hover:border-blue-600 transition flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-900 dark:text-blue-300 truncate">
                    Payout
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Wallet size={14} />
                  </div>
                </div>

                <div>
                  {totalPayoutSum > 0 ? (
                    <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                      ${totalPayoutSum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  ) : (
                    <div>
                      <div className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-200 tracking-tight">
                        $0.00
                      </div>
                      <span className="inline-block mt-0.5 text-[9px] font-bold text-blue-800 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.2 rounded">
                        Belum ada payout
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  Total dana yang telah ditransfer
                </div>
              </div>
            </div>

            {/* Row 2: Pending Payout & Total Referral */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              
              {/* Card 3: Pending Payout */}
              <div className="bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 rounded-2xl p-4 shadow-sm relative overflow-hidden group hover:border-amber-400 dark:hover:border-amber-600 transition flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900 dark:text-amber-300 truncate">
                    Pending Payout
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-amber-600 dark:bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Clock size={14} />
                  </div>
                </div>

                <div>
                  {totalPendingPayout > 0 ? (
                    <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                      ${totalPendingPayout.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  ) : (
                    <div>
                      <div className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-200 tracking-tight">
                        $0.00
                      </div>
                      <span className="inline-block mt-0.5 text-[9px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.2 rounded">
                        Tidak ada pending
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  ⚡ Diproses Setiap Hari Jumat
                </div>
              </div>

              {/* Card 4: Total Referral */}
              <div className="bg-purple-50/90 dark:bg-purple-950/40 border border-purple-200/80 dark:border-purple-800/60 rounded-2xl p-4 shadow-sm relative overflow-hidden group hover:border-purple-400 dark:hover:border-purple-600 transition flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-900 dark:text-purple-300 truncate">
                    Total Referral
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-purple-600 dark:bg-purple-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Users size={14} />
                  </div>
                </div>

                <div>
                  {totalClientsCount > 0 ? (
                    <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                      {totalClientsCount} Client
                    </div>
                  ) : (
                    <div>
                      <div className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-200 tracking-tight">
                        0 Client
                      </div>
                      <span className="inline-block mt-0.5 text-[9px] font-bold text-purple-800 dark:text-purple-300 bg-purple-100 dark:bg-purple-900/60 px-1.5 py-0.2 rounded">
                        Belum ada referral
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-2 text-[10px] text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5 truncate">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">{activeClientsCount} Aktif</span>
                  <span>•</span>
                  <span>{Math.max(0, totalClientsCount - activeClientsCount)} Register</span>
                </div>
              </div>

            </div>

          </div>

          {/* Payout History Section */}
          <div className="bg-white dark:bg-[#121620] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Laporan Payout Terbayar ({filteredPayouts.length} Transaksi)
                </h3>
              </div>
            </div>

            {filteredPayouts.length === 0 ? (
              <div className="text-center py-8 px-4 text-slate-500 dark:text-slate-400 text-xs space-y-1.5 bg-slate-50 dark:bg-slate-900/30 rounded-xl border border-slate-100 dark:border-slate-800/80">
                <Wallet size={24} className="mx-auto text-slate-400 opacity-60 mb-1" />
                <p className="font-bold text-slate-700 dark:text-slate-300">Belum ada riwayat penarikan / payout.</p>
                <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                  Setelah komisi Anda terakumulasi dan diproses setiap hari Jumat, riwayat penarikan akan otomatis tercatat di sini.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredPayouts.map(po => (
                  <div key={po.id} className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span>PO-{po.id}</span>
                        <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-extrabold px-1.5 py-0.2 rounded-md uppercase">
                          {po.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{po.date} • {po.method} {po.accountNumber ? `(${po.accountNumber})` : ''}</div>
                    </div>
                    <div className="text-right font-black text-indigo-600 dark:text-indigo-400 text-sm">
                      +${Number(po.amount).toFixed(2)}
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
                <p className="text-[11px] text-slate-500 font-medium">Pantau status klien riil yang terdaftar melalui referral Anda</p>
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
                  <span>1. Semua Referral</span>
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
                  <span>2. Klien Aktif (Connect MT5)</span>
                  <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                    {activeClientsCount}
                  </span>
                </button>
              </div>
            </div>

            {/* Search Bar */}
            {referrals.length > 0 && (
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama, username, broker, atau negara klien..."
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 dark:text-slate-200 font-medium placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            )}

            {/* Content List & Empty State */}
            {filteredReferrals.length === 0 ? (
              <div className="text-center py-10 px-4 bg-slate-50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
                  <Users size={22} />
                </div>
                
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    {searchQuery ? 'Tidak Ditemukan Klien Yang Sesuai' : 'Belum Ada Klien Referral Aktif'}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                    {searchQuery 
                      ? `Tidak ada hasil pencarian untuk "${searchQuery}". Coba kata kunci lain.`
                      : 'Akun Anda saat ini belum memiliki klien yang mendaftar melalui tautan referral Anda. Bagikan kode atau link referral Anda untuk mulai mendapatkan komisi kemitraan hingga 50%.'
                    }
                  </p>
                </div>

                {!searchQuery && (
                  <div className="pt-2">
                    <button
                      onClick={() => copyToClipboard(refLink, 'Link Referral')}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition inline-flex items-center gap-1.5 shadow-sm shadow-indigo-600/15 cursor-pointer active:scale-95"
                    >
                      <Copy size={13} />
                      <span>Salin Link Referral Sekarang</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredReferrals.map(client => (
                  <div 
                    key={client.id}
                    className="p-3.5 bg-slate-50/80 dark:bg-slate-900/50 hover:bg-slate-100/80 dark:hover:bg-slate-800/60 rounded-xl border border-slate-200/70 dark:border-slate-800 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    {/* User Info */}
                    <div 
                      onClick={() => viewUserProfile(client.id)}
                      className="flex items-center gap-3 cursor-pointer group/user hover:opacity-90 transition"
                      title={`Lihat profil ${client.name}`}
                    >
                      <div className="relative shrink-0">
                        {client.avatar ? (
                          <img 
                            src={client.avatar} 
                            alt={client.name} 
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700 shadow-2xs group-hover/user:border-indigo-500 transition"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 font-bold text-xs">
                            {client.name ? client.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                        )}
                        {client.country && (
                          <div 
                            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-center text-[9px] overflow-hidden select-none"
                            title={client.country}
                          >
                            {getCountryFlag(client.country)}
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-slate-900 dark:text-white group-hover/user:text-indigo-600 dark:group-hover/user:text-indigo-400 transition">{client.name}</span>
                          {client.username && (
                            <span className="text-[10px] text-slate-400 font-medium">@{client.username}</span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                          {client.joinDate && <span>Joined: {client.joinDate}</span>}
                          {client.broker && (
                            <>
                              <span>•</span>
                              <span className="font-semibold text-indigo-600 dark:text-indigo-400">{client.broker} {client.accountNo ? `(${client.accountNo})` : ''}</span>
                            </>
                          )}
                          {typeof client.volumeLots === 'number' && client.volumeLots > 0 && (
                            <>
                              <span>•</span>
                              <span>Volume: {client.volumeLots.toFixed(2)} Lot</span>
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
                          ${(Number(client.commissionEarned) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                        {client.status !== 'active' && client.status !== 'connected' && (
                          <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-[9px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                            {client.status === 'registered' ? 'Terdaftar' : (client.status === 'inactive' ? 'Belum Connect MT5' : (client.status || 'Terdaftar'))}
                          </span>
                        )}
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            )}

          </div>
        </>
      )}

    </div>
  );
};
