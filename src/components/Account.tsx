import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, LogOut, CheckCircle2, Lock, Link as LinkIcon, Database, AlertCircle, RefreshCw, Activity, ArrowRight, ExternalLink, Unplug, Handshake, Cpu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from './AppContext.tsx';
import { apiFetch } from '../utils/apiFetch';
import { TaraptiPartners, MOCK_REFERRALS } from './TaraptiPartners.tsx';


const BROKERS: Record<string, string[]> = {
  'Axi': [
    'Axi-US50-Demo',
    'Axi-US50-Live',
    'Axi-UK55-Live',
    'Axi-US51-Live',
    'Axi-US52-Live',
    'Axi-US53-Live',
    'Axi-US54-Live',
    'Axi-US88-Live'
  ],
  'Other': []
};

export const Account: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { currentUser, setCurrentUser } = useApp();
  
  const [selectedSubView, setSelectedSubView] = useState<'main' | 'partners_detail'>('main');
  const [account, setAccount] = useState<any>(null);
  const [trades, setTrades] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [server, setServer] = useState('');
  const [broker, setBroker] = useState('');
  const [customBroker, setCustomBroker] = useState('');
  const [customServer, setCustomServer] = useState('');

  const [showConnectForm, setShowConnectForm] = useState(false);
  const [connectStepText, setConnectStepText] = useState('Connecting...');



  useEffect(() => {
    fetchAccountStatus();
  }, []);

  const fetchAccountStatus = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/metatrader/account');
      const isJson = res.headers.get('content-type')?.includes('application/json');
      if (res.ok && isJson) {
        const data = await res.json();
        if (data.account) {
          setAccount(data.account);
          fetchTrades();
        } else {
          setAccount(null);
        }
      } else {
        setAccount(null);
      }
    } catch (err) {
      console.error('Failed to fetch MT5 account:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTrades = async () => {
    try {
      const res = await apiFetch('/api/metatrader/trades?limit=20');
      const isJson = res.headers.get('content-type')?.includes('application/json');
      if (res.ok && isJson) {
        const data = await res.json();
        setTrades(data.trades || []);
      }
    } catch (err) {
      console.error('Failed to fetch trades:', err);
    }
  };

  

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsConnecting(true);
    setConnectStepText(t('account.connecting') || 'Connecting to MT5...');

    try {
      // Simulate connecting delay
      await new Promise(r => setTimeout(r, 1000));

      const res = await apiFetch('/api/metatrader/connect', {
        method: 'POST',
        body: JSON.stringify({ 
          platform: 'MT5',
          login, 
          password, 
          server: server === 'Other' ? customServer : server, 
          broker: broker === 'Other' ? customBroker : broker 
        }),
      });
      const data = await res.json();
      if (res.ok && data.account) {
        setAccount(data.account);
        setShowConnectForm(false);
        fetchTrades();
      } else {
        const errorMsg = typeof data.error === 'string' ? data.error : (data.error?.message || 'Failed to connect account. Please check credentials.');
        setError(errorMsg);
      }
    } catch (err) {
      setError('Network error occurred. Please try again later.');
    } finally {
      setIsConnecting(false);
      setConnectStepText('Connecting...');
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await apiFetch('/api/metatrader/sync', { method: 'POST' });
      if (res.ok) {
        await fetchAccountStatus();
      }
    } catch (err) {
      console.error('Sync failed', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('This will unlink your account, trade history stays saved. Are you sure?')) return;
    try {
      const res = await apiFetch('/api/metatrader/disconnect', { method: 'POST' });
      if (res.ok) {
        setAccount(null);
        setTrades([]);
        setShowConnectForm(false);
      }
    } catch (err) {
      console.error('Disconnect failed', err);
    }
  };

  const formatCurrency = (val: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(val || 0);
  };

  

  const renderConnectForm = () => (
    <div className="bg-[#EFF2F6]/90 backdrop-blur-md border border-[#E2E8F0] rounded-3xl p-5 shadow-[0_4px_16px_rgba(0,0,0,0.02)] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/15 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
      
      <div className="relative z-10 mb-4">
        <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
          {t('account.connectTradingAccount')}
          <img src="/mt5-logo.png" alt="MT5" className="h-5 w-5 object-contain rounded" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        </h2>
        <p className="text-[10px] text-slate-700 leading-relaxed mt-1">
          {t('account.connectServerDesc')}
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex flex-col gap-2 text-rose-600 text-xs">
          <div className="flex items-start gap-2">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <p>{typeof error === 'string' ? error : (error as any)?.message || 'An error occurred'}</p>
          </div>
          {(typeof error === 'string' && error.includes('registered')) && (
            <a href="https://www.axi.com" target="_blank" rel="noreferrer" className="inline-block px-3 py-2 bg-rose-600 text-white rounded-lg text-center font-bold shadow-sm mt-1">
              Create Account at Partner Broker Tarapti
            </a>
          )}
        </div>
      )}

      <form onSubmit={handleConnect} className="space-y-3 relative z-10">
        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
            {t('account.partnerBroker')} *
          </label>
          <select
            value={broker}
            onChange={(e) => {
              setBroker(e.target.value);
              setServer('');
              setCustomBroker('');
              setCustomServer('');
            }}
            className="w-full bg-white/90 border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-black font-semibold focus:outline-none focus:border-indigo-500 transition shadow-sm"
            required
          >
            <option value="" disabled>Select Broker</option>
            {Object.keys(BROKERS).map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>

        {broker === 'Other' && (
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
              Broker Name *
            </label>
            <input
              type="text"
              value={customBroker}
              onChange={(e) => setCustomBroker(e.target.value)}
              placeholder="Enter your broker name"
              className="w-full bg-white/90 border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-black font-semibold placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition shadow-sm"
              required
            />
          </div>
        )}

        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
            {t('account.tradingServerLabel')}
          </label>
          {broker && broker !== 'Other' && BROKERS[broker].length > 0 ? (
            <div className="space-y-2">
              <select
                value={server}
                onChange={(e) => setServer(e.target.value)}
                className="w-full bg-white/90 border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-black font-semibold focus:outline-none focus:border-indigo-500 transition shadow-sm"
                required
              >
                <option value="" disabled>Select Server</option>
                {BROKERS[broker].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
                <option value="Other">Other (Manual Entry)</option>
              </select>
              {server === 'Other' && (
                 <input
                   type="text"
                   value={customServer}
                   onChange={(e) => setCustomServer(e.target.value)}
                   placeholder="Enter server name manually"
                   className="w-full bg-white/90 border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-black font-semibold placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition shadow-sm"
                   required
                 />
              )}
            </div>
          ) : (
             <input
               type="text"
               value={server}
               onChange={(e) => setServer(e.target.value)}
               placeholder="e.g. Axi-US50-Live"
               className="w-full bg-white/90 border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-black font-semibold placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition shadow-sm"
               required={broker === 'Other' || (broker && BROKERS[broker]?.length === 0)}
             />
          )}
        </div>

        <div className="space-y-1">
          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
            {t('account.accountNoLabel')}
          </label>
          <input
            type="text"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            placeholder="e.g. 12345678"
            className="w-full bg-white/90 border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-black font-semibold placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition shadow-sm"
            required
          />
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">
              {t('account.investorPasswordLabel')}
            </label>
            <span className="text-[8px] text-indigo-500 uppercase font-bold tracking-wider flex items-center gap-1"><Lock size={8}/> {t('account.readOnly')}</span>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Your MT5 investor password"
            className="w-full bg-white/90 border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-black font-semibold placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition shadow-sm"
            required
          />
        </div>

        <div className="pt-2 flex items-center gap-2">
          {showConnectForm && !account && (
            <button
              type="button"
              onClick={() => { setShowConnectForm(false); setError(null); }}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition cursor-pointer"
            >
              {t('common.cancel')}
            </button>
          )}
          <button
            type="submit"
            disabled={isConnecting}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-70 text-white text-xs font-black rounded-xl transition shadow-sm shadow-indigo-600/15 flex justify-center items-center gap-2 cursor-pointer"
          >
            {isConnecting ? (
              <><div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"/> {connectStepText}</>
            ) : (
              <><LinkIcon size={14} /> {t('account.connectAccount')}</>
            )}
          </button>
        </div>
      </form>
    </div>
  );

  const renderConnectedOverview = () => (
    <div className="space-y-4">
      {/* Overview Card */}
      <div className="bg-[#EFF2F6]/90 backdrop-blur-md border border-[#E2E8F0] rounded-3xl p-5 shadow-[0_4px_16px_rgba(0,0,0,0.02)] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
        
        <div className="flex items-start justify-between relative z-10 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                {account.broker || (account.server ? account.server.split('-')[0] : 'MetaTrader')} ({account.platform || 'MT5'})
              </h2>
              <span className="bg-emerald-500 text-white font-extrabold text-[8px] px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5 shadow-sm shadow-emerald-500/10">
                <CheckCircle2 size={10} /> Connected
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Account ID: <span className="font-bold text-slate-800">{account.login}</span> • Server: <span className="font-bold text-slate-800">{account.server}</span></p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl transition cursor-pointer disabled:opacity-50"
              title="Sync Now"
            >
              <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
            </button>
            <button
              onClick={handleDisconnect}
              className="p-2 bg-white hover:bg-rose-50 border border-slate-200 text-rose-500 rounded-xl transition cursor-pointer"
              title="Disconnect"
            >
              <Unplug size={14} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 relative z-10">
          <div className="bg-white/60 border border-slate-100 rounded-2xl p-3">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Balance</div>
            <div className="text-sm font-black text-slate-800">{formatCurrency(account.balance, account.currency)}</div>
          </div>
          <div className="bg-white/60 border border-slate-100 rounded-2xl p-3">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Equity</div>
            <div className="text-sm font-black text-slate-800">{formatCurrency(account.equity, account.currency)}</div>
          </div>
          <div className="bg-white/60 border border-slate-100 rounded-2xl p-3">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Floating Profit</div>
            <div className={`text-sm font-black ${account.profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {account.profit > 0 ? '+' : ''}{formatCurrency(account.profit, account.currency)}
            </div>
          </div>
          <div className="bg-white/60 border border-slate-100 rounded-2xl p-3">
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Margin Level</div>
            <div className="text-sm font-black text-slate-800">{account.marginLevel ? `${account.marginLevel.toFixed(2)}%` : '—'}</div>
          </div>
        </div>
      </div>

      {/* Trades List */}
      <div className="bg-white/70 backdrop-blur-xl border border-slate-200 rounded-3xl p-4 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)]">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-3 px-1 flex items-center gap-1.5">
          <Activity size={12} /> Recent Trades
        </h3>
        
        {trades.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs font-medium bg-slate-50/50 rounded-2xl border border-slate-100 border-dashed">
            No recent trades found
          </div>
        ) : (
          <div className="space-y-2">
            {trades.map(trade => (
              <div key={trade.id} className="flex items-center justify-between p-2.5 bg-slate-50/80 rounded-xl border border-slate-100 hover:border-indigo-100 transition">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] ${(trade.type || '').toUpperCase().includes('BUY') ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    {(trade.type || '').toUpperCase().includes('BUY') ? 'BUY' : 'SELL'}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">{trade.symbol}</div>
                    <div className="text-[9px] text-slate-500 font-medium">Vol: {trade.lots}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xs font-black ${trade.pl >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {trade.pl > 0 ? '+' : ''}{formatCurrency(trade.pl, account.currency)}
                  </div>
                  <div className="text-[8px] text-slate-400 font-medium mt-0.5">
                    {trade.closeTime ? new Date(trade.closeTime).toLocaleDateString(navigator.language || 'id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZoneName: 'short', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }).replace(/\s*(AM|PM|am|pm)/gi, '') : 'Open'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderMT5Section = () => (
    <div className="bg-white dark:bg-[#121620] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              Hubungkan Akun Trading MT5
            </h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Auto-sync portfolio & kalkulasi komisi otomatis Tarapti</p>
          </div>
        </div>
        <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-full border ${
          account 
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300/50' 
            : 'bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300/50'
        }`}>
          {account ? 'Connected' : 'Not Connected'}
        </span>
      </div>

      {account ? (
        renderConnectedOverview()
      ) : showConnectForm ? (
        renderConnectForm()
      ) : (
        <div className="bg-[#EFF2F6]/90 dark:bg-slate-900/60 backdrop-blur-md border border-[#E2E8F0] dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-xl shadow-xs border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
               <img src="/axi_logo.svg" alt="Axi" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.src = '/axi_test1.png'; }} />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white tracking-tight">{t('account.connectTradingAccount')}</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-md">
                {t('account.descriptionDisconnected')}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowConnectForm(true)}
            className="w-full sm:w-auto px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer shrink-0 active:scale-95"
          >
            <LinkIcon size={14} /> {t('account.connectAccount')}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="py-4 space-y-6 w-full max-w-none relative px-2">
      
      {/* Detail Page Mode: Tarapti Partners */}
      {selectedSubView === 'partners_detail' ? (
        <div className="space-y-4">
          <button
            onClick={() => setSelectedSubView('main')}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#121620] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer shadow-2xs w-fit"
          >
            <span>← Kembali ke Connect Account & Partners</span>
          </button>

          <TaraptiPartners />
        </div>
      ) : (
        /* Main 2-Card Redesign View */
        <div className="space-y-6">
          
          {/* Header Title */}
          <div className="bg-white dark:bg-[#121620] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-2xs">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h1 className="text-base font-black text-slate-900 dark:text-white tracking-wider uppercase">
                  Connect Account & Partners
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Kelola koneksi MetaTrader 5 dan program komisi Tarapti Partners Anda
                </p>
              </div>
            </div>
          </div>

          {/* EXACTLY 2 CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
            
            {/* CARD 1: CONNECT ACCOUNT (RESTORED ORIGINAL LAYOUT) */}
            <div>
              {account ? (
                renderConnectedOverview()
              ) : showConnectForm ? (
                renderConnectForm()
              ) : (
                <div className="h-full bg-[#EFF2F6]/90 dark:bg-slate-900/60 backdrop-blur-md border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col items-center text-center justify-between">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                  
                  <div className="flex flex-col items-center text-center my-auto">
                    <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-slate-100 dark:border-slate-700 flex items-center justify-center mb-4 overflow-hidden">
                       <img src="/axi_logo.svg" alt="Axi" className="h-full w-full object-cover" onError={(e) => { e.currentTarget.src = '/axi_test1.png'; }} />
                    </div>
                    <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight mb-2">
                      {t('account.connectTradingAccount')}
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed max-w-[280px] mb-6">
                      {t('account.descriptionDisconnected')}
                    </p>
                  </div>

                  <button
                    onClick={() => setShowConnectForm(true)}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition shadow-sm shadow-indigo-600/15 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <LinkIcon size={14} /> {t('account.connectAccount')}
                  </button>
                </div>
              )}
            </div>

            {/* CARD 2: TARAPTI PARTNERS (CLEAN, ELEGANT & SIMPLES) */}
            <div 
              onClick={() => setSelectedSubView('partners_detail')}
              className="bg-white dark:bg-[#121620] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xs flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-600 transition h-full"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

              <div className="space-y-4 relative z-10">
                {/* Header Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center font-black shadow-2xs">
                      <Handshake size={22} />
                    </div>
                    <div>
                      <h2 className="text-sm font-black text-slate-900 dark:text-white tracking-tight uppercase flex items-center gap-1.5">
                        Tarapti Partners
                      </h2>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        Program Afiliasi & Portal IB
                      </p>
                    </div>
                  </div>

                  <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-[9px] font-black uppercase px-2.5 py-1 rounded-full">
                    Active IB
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  Program Afiliasi & IB Resmi Tarapti. Dapatkan komisi <strong className="text-indigo-600 dark:text-indigo-400">hingga 50%</strong> dari setiap transaksi trader yang Anda referensikan.
                </p>

                {/* Metric Previews */}
                {(() => {
                  const totalCommissionAllTime = MOCK_REFERRALS.reduce((acc, curr) => acc + curr.commissionEarned, 0) * 0.3;
                  const activeClientsCount = MOCK_REFERRALS.filter(r => r.status === 'active' || r.status === 'connected').length;
                  return (
                    <div className="grid grid-cols-2 gap-2.5 pt-2">
                      <div className="bg-slate-50 dark:bg-slate-900/80 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">Total Komisi</div>
                        <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                          ${totalCommissionAllTime.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/80 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase">Klien Aktif</div>
                        <div className="text-sm font-black text-indigo-600 dark:text-indigo-400 mt-0.5">{activeClientsCount} Active Trader</div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Action Button */}
              <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 relative z-10">
                <div className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition shadow-sm shadow-indigo-600/15 flex items-center justify-center gap-2 group-hover:gap-3">
                  <span>Buka Detail Tarapti Partners</span>
                  <ArrowRight size={14} />
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
