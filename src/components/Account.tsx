import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, LogOut, CheckCircle2, Lock, Link as LinkIcon, Database, AlertCircle, AlertTriangle, RefreshCw, Activity, ArrowRight, ExternalLink, Unplug, Handshake, Cpu, BadgeCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useApp } from './AppContext.tsx';
import { apiFetch } from '../utils/apiFetch';
import { TaraptiPartners } from './TaraptiPartners.tsx';


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
  const { 
    currentUser, 
    setCurrentUser, 
    connectedBroker,
    connectedAccounts,
    setConnectedAccounts,
    activeAccountLogin,
    setActiveAccountLogin,
    fetchMetaTraderData
  } = useApp();
  
  const [selectedSubView, setSelectedSubView] = useState<'main' | 'partners_detail'>('main');
  const [localAccounts, setLocalAccounts] = useState<any[]>(() => {
    if (connectedBroker) {
      return [{
        login: connectedBroker.accountId,
        broker: connectedBroker.broker,
        platform: connectedBroker.platform || 'MT5',
        server: connectedBroker.server || connectedBroker.broker,
        equity: 0
      }];
    }
    try {
      const stored = localStorage.getItem('tarapti_broker');
      if (stored) {
        const parsed = JSON.parse(stored);
        return [{
          login: parsed.accountId,
          broker: parsed.broker,
          platform: parsed.platform || 'MT5',
          server: parsed.server || parsed.broker,
          equity: 0
        }];
      }
    } catch {}
    return [];
  });

  const accounts = connectedAccounts && connectedAccounts.length > 0 ? connectedAccounts : localAccounts;
  const selectedAccountIndex = Math.max(
    0, 
    accounts.findIndex((a: any) => activeAccountLogin ? (a.login === activeAccountLogin || a.id === activeAccountLogin) : false)
  );

  const [trades, setTrades] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(() => accounts.length === 0);
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

  const [activeAction, setActiveAction] = useState<'none' | 'connect' | 'validate'>('none');
  const [valName, setValName] = useState('');
  const [valEmail, setValEmail] = useState('');
  const [valAccount, setValAccount] = useState('');
  const [isSubmittingVal, setIsSubmittingVal] = useState(false);
  const [valSuccess, setValSuccess] = useState(false);

  const [connectStepText, setConnectStepText] = useState('Connecting...');

  useEffect(() => {
    fetchAccountStatus();
  }, []);

  // Whenever selectedAccountIndex or accounts list changes, automatically sync and fetch trades for the active account
  useEffect(() => {
    if (accounts.length > 0 && accounts[selectedAccountIndex]) {
      const active = accounts[selectedAccountIndex];
      console.log('[ACCOUNT-ACTIVE-CHANGE] Active account changed:', {
        selectedAccountIndex,
        accountId: active.id,
        login: active.login,
        broker: active.broker
      });
      fetchTrades(active.login || active.id);
    }
  }, [selectedAccountIndex, accounts.length]);

  const fetchAccountStatus = async (targetLoginOrId?: string) => {
    if (accounts.length === 0) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const currentActive = targetLoginOrId 
        ? { login: targetLoginOrId, id: targetLoginOrId } 
        : (accounts[selectedAccountIndex] || accounts[0]);
      
      const queryParam = currentActive?.login 
        ? `?login=${encodeURIComponent(currentActive.login)}&accountId=${encodeURIComponent(currentActive.id || currentActive.login)}`
        : '';

      console.log(`[Account.tsx] [INVESTIGATION] Calling GET /api/metatrader/account${queryParam}...`);
      const res = await apiFetch(`/api/metatrader/account${queryParam}`);
      console.log('[Account.tsx] [INVESTIGATION] GET /api/metatrader/account HTTP status:', res.status, res.statusText);
      const isJson = res.headers.get('content-type')?.includes('application/json');
      if (res.ok && isJson) {
        const data = await res.json();
        console.log('[Account.tsx] [INVESTIGATION] Raw response data from GET /api/metatrader/account:', data);
        const accs = data.accounts || (data.account ? [data.account] : (data.data?.accounts || (data.data?.account ? [data.data.account] : [])));
        console.log('[Account.tsx] [INVESTIGATION] Extracted accounts array:', accs);
        if (accs.length > 0) {
          setConnectedAccounts(accs);
          setLocalAccounts(accs);
          const activeAcc = accs[selectedAccountIndex] || accs[0];
          fetchTrades(activeAcc?.login || activeAcc?.id);
        } else {
          setConnectedAccounts([]);
          setLocalAccounts([]);
          setTrades([]);
          setActiveAccountLogin(null);
          try {
            localStorage.removeItem('tarapti_connected_accounts');
            localStorage.removeItem('tarapti_broker');
            localStorage.removeItem('tarapti_active_mt_login');
          } catch {}
        }
      } else if (res.status === 404 || res.status === 401) {
        setConnectedAccounts([]);
        setLocalAccounts([]);
        setTrades([]);
        setActiveAccountLogin(null);
        try {
          localStorage.removeItem('tarapti_connected_accounts');
          localStorage.removeItem('tarapti_broker');
          localStorage.removeItem('tarapti_active_mt_login');
        } catch {}
      } else if (!res.ok) {
        const errBody = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);
        console.warn('[Account.tsx] [INVESTIGATION] GET /api/metatrader/account returned non-200:', res.status, errBody);
      }
    } catch (err) {
      console.error('[Account.tsx] [INVESTIGATION] Background check error for MT5 accounts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTrades = async (targetLoginOrId?: string) => {
    try {
      const currentActive = targetLoginOrId 
        ? { login: targetLoginOrId, id: targetLoginOrId } 
        : (accounts[selectedAccountIndex] || accounts[0]);

      const queryParams = new URLSearchParams({ limit: '20' });
      if (currentActive?.login) {
        queryParams.set('login', currentActive.login);
        queryParams.set('accountId', currentActive.id || currentActive.login);
      }

      console.log(`[Account.tsx] [INVESTIGATION] Calling GET /api/metatrader/trades?${queryParams.toString()}...`);
      const res = await apiFetch(`/api/metatrader/trades?${queryParams.toString()}`);
      const isJson = res.headers.get('content-type')?.includes('application/json');
      if (res.ok && isJson) {
        const data = await res.json();
        console.log('[Account.tsx] [INVESTIGATION] Raw trades response for login', currentActive?.login, ':', data);
        setTrades(data.trades || data.data?.trades || []);
      }
    } catch (err) {
      console.error('[Account.tsx] [INVESTIGATION] Failed to fetch trades:', err);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsConnecting(true);
    setConnectStepText(t('account.connecting') || 'Connecting to MT5...');

    try {
      const storedAccessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
      const storedRefreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

      console.log('[Account.tsx] [AUTH-DIAGNOSTIC-BEFORE-CONNECT]', {
        accessToken: storedAccessToken ? `EXISTS (length: ${storedAccessToken.length}, startsWith: ${storedAccessToken.substring(0, 10)}...)` : 'NULL/EMPTY',
        refreshToken: storedRefreshToken ? `EXISTS (length: ${storedRefreshToken.length}, startsWith: ${storedRefreshToken.substring(0, 10)}...)` : 'NULL/EMPTY',
        currentUser: currentUser ? { id: currentUser.id, email: currentUser.email, username: currentUser.username } : 'NULL',
        timestamp: new Date().toISOString()
      });

      const payload = { 
        platform: 'MT5',
        login, 
        password, 
        server: server === 'Other' ? customServer : server, 
        broker: broker === 'Other' ? customBroker : broker 
      };
      console.log('[Account.tsx] [INVESTIGATION] Submitting POST /api/metatrader/connect with payload:', { ...payload, password: '***' });

      // Simulate connecting delay
      await new Promise(r => setTimeout(r, 1000));

      const res = await apiFetch('/api/metatrader/connect', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      
      console.log('[Account.tsx] [INVESTIGATION] POST /api/metatrader/connect HTTP status:', res.status, res.statusText);
      const data = await res.json().catch(() => null);
      console.log('[Account.tsx] [INVESTIGATION] Raw response data from POST /api/metatrader/connect:', data);

      if (res.ok && data && (data.account || data.accounts || data.data?.account || data.data?.accounts)) {
        const accs = data.accounts || (data.account ? [data.account] : (data.data?.accounts || [data.data?.account]));
        console.log('[Account.tsx] [INVESTIGATION] Connect SUCCESS. Setting accounts state to:', accs);
        setConnectedAccounts(accs);
        setLocalAccounts(accs);
        setActiveAccountLogin(login);
        setActiveAction('none');
        setLogin('');
        setPassword('');
        setServer('');
        setBroker('');
        setCustomBroker('');
        setCustomServer('');
        fetchTrades(login);
      } else {
        const errorMsg = typeof data?.error === 'string' ? data.error : (data?.error?.message || data?.message || 'Failed to connect account. Please check credentials.');
        console.warn('[Account.tsx] [INVESTIGATION] Connect FAILED:', errorMsg, data);
        setError(errorMsg);
      }
    } catch (err) {
      console.error('[Account.tsx] [INVESTIGATION] Connect EXCEPTION:', err);
      setError('Network error occurred. Please try again later.');
    } finally {
      setIsConnecting(false);
      setConnectStepText('Connecting...');
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    const currentActive = accounts[selectedAccountIndex] || accounts[0];
    console.log('[ACCOUNT-SYNC-CLICK]', {
      selectedAccountIndex,
      activeAccountId: currentActive?.id,
      activeAccountLogin: currentActive?.login,
      activeAccountBroker: currentActive?.broker,
      accountsInState: accounts.map(a => ({ id: a.id, login: a.login, broker: a.broker }))
    });
    
    const queryParams = new URLSearchParams();
    if (currentActive?.login) {
      queryParams.set('login', currentActive.login);
      queryParams.set('accountId', currentActive.id || currentActive.login);
    }
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

    console.log(`[Account.tsx] [INVESTIGATION] Calling POST /api/metatrader/sync${queryString} with target:`, currentActive?.login);
    try {
      const res = await apiFetch(`/api/metatrader/sync${queryString}`, { 
        method: 'POST',
        body: JSON.stringify({ 
          accountId: currentActive?.id,
          login: currentActive?.login
        })
      });
      console.log('[Account.tsx] [INVESTIGATION] POST /api/metatrader/sync HTTP status:', res.status);
      const data = await res.json().catch(() => null);
      console.log('[Account.tsx] [INVESTIGATION] Raw sync response:', data);
      if (res.ok) {
        setError(null);
        await fetchAccountStatus(currentActive?.login);
      } else {
        const errorMsg = data?.error || 'Gagal sinkronisasi data dari MetaTrader Gateway.';
        setError(errorMsg);
        await fetchAccountStatus(currentActive?.login);
      }
    } catch (err: any) {
      console.error('[Account.tsx] [INVESTIGATION] Sync failed:', err);
      setError(err?.message || 'Gagal terhubung ke server saat sinkronisasi.');
      await fetchAccountStatus(currentActive?.login);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async (targetAccountId?: string) => {
    const activeAccount = accounts[selectedAccountIndex] || accounts[0];
    const targetAccount = accounts.find(a => a.id === targetAccountId) || activeAccount;
    if (!targetAccount) return;

    if (!window.confirm(`Putuskan koneksi akun ${targetAccount.broker || 'MetaTrader'} (${targetAccount.login})? Riwayat transaksi akun ini akan dihapus dari aplikasi.`)) return;

    try {
      const res = await apiFetch('/api/metatrader/disconnect', {
        method: 'POST',
        body: JSON.stringify({ accountId: targetAccount.id })
      });
      if (res.ok) {
        const data = await res.json();
        const updatedAccs = data.accounts || [];
        setConnectedAccounts(updatedAccs);
        setLocalAccounts(updatedAccs);
        if (updatedAccs.length === 0) {
          setActiveAccountLogin(null);
          setTrades([]);
          setActiveAction('none');
        } else {
          const nextActive = updatedAccs[0];
          setActiveAccountLogin(nextActive?.login || null);
          fetchTrades(nextActive?.login);
        }
      }
    } catch (err) {
      console.error('Disconnect failed', err);
    }
  };

  const formatCurrency = (val: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(val || 0);
  };

  const activeAccount = accounts[selectedAccountIndex] || accounts[0];

  const renderConnectForm = () => (
    <div className="bg-[#EFF2F6]/90 backdrop-blur-md border border-[#E2E8F0] rounded-3xl p-5 shadow-[0_4px_16px_rgba(0,0,0,0.02)] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/15 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
      
      <div className="relative z-10 mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
            {accounts.length > 0 ? 'Hubungkan Akun MT5 Tambahan' : t('account.connectTradingAccount')}
            <img src="/mt5-logo.png" alt="MT5" className="h-5 w-5 object-contain rounded" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </h2>
          <p className="text-[10px] text-slate-700 leading-relaxed mt-1">
            {accounts.length > 0 ? 'Tambahkan koneksi akun MetaTrader 5 baru ke profil Anda' : t('account.connectServerDesc')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setActiveAction('none'); setError(null); }}
          className="text-[10px] font-bold text-slate-500 hover:text-slate-800 bg-white/80 px-2.5 py-1 rounded-lg border border-slate-200 transition cursor-pointer"
        >
          ← Kembali
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex flex-col gap-2 text-rose-600 text-xs">
          <div className="flex items-start gap-2">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            <p>{typeof error === 'string' ? error : (error as any)?.message || 'An error occurred'}</p>
          </div>
          {(typeof error === 'string' && error.includes('registered')) && (
            <a href="https://www.axi.com" target="_blank" rel="noreferrer" className="inline-block px-3 py-2 bg-rose-600 text-white rounded-lg text-center font-bold shadow-sm mt-1">
              Create Account at Connect Broker GoTrading
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
          <button
            type="submit"
            disabled={isConnecting}
            className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-70 text-white text-xs font-black rounded-xl transition shadow-sm shadow-indigo-600/15 flex justify-center items-center gap-2 cursor-pointer"
          >
            {isConnecting ? (
              <><div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin"/> {connectStepText}</>
            ) : (
              <><LinkIcon size={14} /> {accounts.length > 0 ? '+ Connect Akun Ini' : t('account.connectAccount')}</>
            )}
          </button>
        </div>
      </form>
    </div>
  );

  const renderConnectedOverview = () => {
    if (!activeAccount) return null;

    return (
      <div className="space-y-4">
        {/* Multi-Account Selector Header */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-2xl p-3 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Database size={12} className="text-indigo-600 dark:text-indigo-400" />
              Akun MetaTrader Terhubung ({accounts.length})
            </span>
            
            <button
              onClick={() => setActiveAction('connect')}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black rounded-lg transition shadow-2xs flex items-center gap-1 cursor-pointer active:scale-95"
            >
              <LinkIcon size={12} />
              <span>+ Connect Akun Baru</span>
            </button>
          </div>

          {/* Account Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {accounts.map((acc, idx) => (
              <button
                key={acc.id || acc.login}
                onClick={() => {
                  console.log('[ACCOUNT-CLICK] User clicked pill tab:', {
                    clickedIndex: idx,
                    clickedAccountId: acc.id,
                    clickedLogin: acc.login,
                    clickedBroker: acc.broker
                  });
                  setActiveAccountLogin(acc.login);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-2 border shrink-0 cursor-pointer ${
                  idx === selectedAccountIndex
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/80'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${idx === selectedAccountIndex ? 'bg-emerald-300' : 'bg-emerald-500'}`} />
                <span>{acc.broker || 'MT5'} ({acc.login})</span>
                <span className="text-[10px] opacity-80 font-semibold">{formatCurrency(acc.equity, acc.currency)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Account Overview Card */}
        <div className="bg-[#EFF2F6]/90 backdrop-blur-md border border-[#E2E8F0] rounded-3xl p-5 shadow-[0_4px_16px_rgba(0,0,0,0.02)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
          
          <div className="flex items-start justify-between relative z-10 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-base font-black text-slate-900 tracking-tight">
                  {activeAccount.broker || (activeAccount.server ? activeAccount.server.split('-')[0] : 'MetaTrader')} ({activeAccount.platform || 'MT5'})
                </h2>
                {(() => {
                  const fetchedTime = activeAccount.fetched_at ? new Date(activeAccount.fetched_at).getTime() : 0;
                  const isStale = activeAccount.conn_status === 'error' || 
                                  activeAccount.conn_status === 'reconnecting' ||
                                  !fetchedTime || 
                                  (Date.now() - fetchedTime) > 5 * 60 * 1000;

                  if (activeAccount.conn_status === 'error') {
                    return (
                      <span className="bg-rose-500 text-white font-extrabold text-[8px] px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5 shadow-sm shadow-rose-500/10">
                        <AlertTriangle size={10} /> Sync Error
                      </span>
                    );
                  }
                  if (activeAccount.conn_status === 'reconnecting') {
                    return (
                      <span className="bg-amber-500 text-white font-extrabold text-[8px] px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5 shadow-sm shadow-amber-500/10 animate-pulse">
                        <RefreshCw size={10} className="animate-spin" /> Reconnecting
                      </span>
                    );
                  }
                  if (isStale) {
                    return (
                      <span className="bg-amber-500 text-white font-extrabold text-[8px] px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5 shadow-sm shadow-amber-500/10">
                        <AlertCircle size={10} /> Data Stale
                      </span>
                    );
                  }
                  return (
                    <span className="bg-emerald-500 text-white font-extrabold text-[8px] px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5 shadow-sm shadow-emerald-500/10">
                      <CheckCircle2 size={10} /> Connected
                    </span>
                  );
                })()}
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Account ID: <span className="font-bold text-slate-800">{activeAccount.login}</span> • Server: <span className="font-bold text-slate-800">{activeAccount.server}</span></p>
              
              {activeAccount.error_message && (
                <div className="mt-3 p-2.5 bg-rose-50 border border-rose-100 rounded-xl text-[10px] text-rose-600 flex items-start gap-1.5 font-medium">
                  <AlertCircle size={12} className="shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold uppercase tracking-wider text-[8px] block mb-0.5">Sync Error Details</span>
                    {activeAccount.error_message}
                  </div>
                </div>
              )}
              
              {activeAccount.fetched_at && (
                <p className="text-[9px] text-slate-400 mt-2 font-mono">
                  Last synced: {new Date(activeAccount.fetched_at).toLocaleString()}
                </p>
              )}
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
                onClick={() => handleDisconnect(activeAccount.id)}
                className="p-2 bg-white hover:bg-rose-50 border border-slate-200 text-rose-500 rounded-xl transition cursor-pointer"
                title="Disconnect This Account"
              >
                <Unplug size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderValidateForm = () => (
    <div className="bg-[#EFF2F6]/90 backdrop-blur-md border border-[#E2E8F0] rounded-3xl p-5 shadow-[0_4px_16px_rgba(0,0,0,0.02)] relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/15 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
      
      <div className="relative z-10 mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
            Validasi Akun
            <BadgeCheck className="text-indigo-600" size={18} />
          </h2>
          <p className="text-[10px] text-slate-700 leading-relaxed mt-1">
            Masukkan data untuk memvalidasi akun MetaTrader Anda
          </p>
        </div>
        <button
          type="button"
          onClick={() => setActiveAction('none')}
          className="text-[10px] font-bold text-slate-500 hover:text-slate-800 bg-white/80 px-2.5 py-1 rounded-lg border border-slate-200 transition cursor-pointer"
        >
          ← Kembali
        </button>
      </div>

      {valSuccess ? (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col items-center justify-center text-center gap-2 relative z-10">
          <CheckCircle2 className="text-emerald-500 mb-1" size={24} />
          <h3 className="text-sm font-bold text-emerald-700">Validasi Terkirim</h3>
          <p className="text-[11px] text-emerald-600">Terima kasih, data validasi akun Anda telah diterima.</p>
          <button onClick={() => { setValSuccess(false); setActiveAction('none'); }} className="mt-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-[10px] font-bold cursor-pointer hover:bg-emerald-700 transition">Tutup</button>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); setIsSubmittingVal(true); setTimeout(() => { setIsSubmittingVal(false); setValSuccess(true); }, 1000); }} className="space-y-3 relative z-10">
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Nama Lengkap *</label>
            <input type="text" value={valName} onChange={e => setValName(e.target.value)} required className="w-full bg-white/90 border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-black font-semibold focus:outline-none focus:border-indigo-500 transition shadow-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Email *</label>
            <input type="email" value={valEmail} onChange={e => setValEmail(e.target.value)} required className="w-full bg-white/90 border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-black font-semibold focus:outline-none focus:border-indigo-500 transition shadow-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Nomor Akun MT5 *</label>
            <input type="text" value={valAccount} onChange={e => setValAccount(e.target.value)} required className="w-full bg-white/90 border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs text-black font-semibold focus:outline-none focus:border-indigo-500 transition shadow-sm" />
          </div>
          <button type="submit" disabled={isSubmittingVal} className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-70 text-white text-xs font-black rounded-xl transition shadow-sm shadow-indigo-600/15 flex justify-center items-center gap-2 cursor-pointer mt-2">
            {isSubmittingVal ? 'Memproses...' : 'Kirim Validasi'}
          </button>
        </form>
      )}
    </div>
  );

  const renderTopCTASection = () => {
    if (activeAction === 'connect') return renderConnectForm();
    if (activeAction === 'validate') return renderValidateForm();

    return (
      <div className="space-y-2.5 animate-in fade-in slide-in-from-top-4 duration-500">
        {/* Top Row: 2 Compact Cards Side-by-Side */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Card 1: Open Account */}
          <div 
            onClick={() => alert('Link pendaftaran akan dikonfigurasi melalui Admin Panel.')}
            className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-800 hover:from-indigo-500 hover:to-indigo-700 text-white rounded-xl p-3.5 shadow-sm shadow-indigo-600/15 border border-indigo-400/20 flex flex-col justify-between h-28 sm:h-30 group cursor-pointer transition-all active:scale-[0.98]"
          >
            <div className="flex items-start justify-between">
              <div className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-lg bg-white/20 backdrop-blur-md text-white border border-white/20 flex items-center justify-center font-black shadow-inner group-hover:scale-105 transition-transform">
                <ExternalLink size={16} />
              </div>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-white/10 flex items-center justify-center text-white group-hover:bg-white/20 group-hover:translate-x-0.5 transition-all">
                <ArrowRight size={12} />
              </div>
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black tracking-tight leading-tight">
                Open Account
              </h3>
              <p className="text-[9px] sm:text-[10px] text-indigo-100/90 font-medium mt-0.5 line-clamp-1">
                Buka akun broker Connect
              </p>
            </div>
          </div>

          {/* Card 2: Validasi Account */}
          <div 
            onClick={() => setActiveAction('validate')}
            className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 hover:from-emerald-500 hover:to-teal-700 text-white rounded-xl p-3.5 shadow-sm shadow-emerald-600/15 border border-emerald-400/20 flex flex-col justify-between h-28 sm:h-30 group cursor-pointer transition-all active:scale-[0.98]"
          >
            <div className="flex items-start justify-between">
              <div className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-lg bg-white/20 backdrop-blur-md text-white border border-white/20 flex items-center justify-center font-black shadow-inner group-hover:scale-105 transition-transform">
                <BadgeCheck size={16} />
              </div>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-white/10 flex items-center justify-center text-white group-hover:bg-white/20 group-hover:translate-x-0.5 transition-all">
                <ArrowRight size={12} />
              </div>
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-black tracking-tight leading-tight">
                Validasi Account
              </h3>
              <p className="text-[9px] sm:text-[10px] text-emerald-100/90 font-medium mt-0.5 line-clamp-1">
                Validasi akun MT5 Anda
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Row: Connect Account Card */}
        <div 
          onClick={() => setActiveAction('connect')}
          className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white rounded-xl p-3 shadow-sm shadow-blue-600/15 border border-blue-400/20 flex items-center justify-between group cursor-pointer transition-all active:scale-[0.99]"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 shrink-0 rounded-lg bg-white/20 backdrop-blur-md text-white border border-white/20 flex items-center justify-center font-black shadow-inner group-hover:scale-105 transition-transform">
              <LinkIcon size={15} />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-black tracking-tight truncate flex items-center gap-1">
                Connect Account
              </h3>
              <p className="text-[9px] sm:text-[10px] text-blue-100/90 font-medium truncate mt-0.5">
                Hubungkan akun MetaTrader ke platform
              </p>
            </div>
          </div>
          <div className="px-2.5 py-1 bg-white text-blue-700 font-black rounded-lg text-[10px] sm:text-xs flex items-center gap-1 shadow-sm group-hover:bg-blue-50 group-hover:scale-105 transition-all shrink-0 ml-2">
            <span>Connect</span>
            <ArrowRight size={10} />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="py-4 space-y-6 w-full max-w-none relative px-2">
      
      {/* Detail Page Mode: GOTRADING CONNECT */}
      {selectedSubView === 'partners_detail' ? (
        <div className="space-y-4">
          <button
            onClick={() => setSelectedSubView('main')}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-[#121620] border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer shadow-2xs w-fit"
          >
            <span>← Kembali ke Connect Account</span>
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
                  Connect Account
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Kelola koneksi MetaTrader 5 dan program komisi GOTRADING CONNECT Anda
                </p>
              </div>
            </div>
          </div>

          {/* TOP CTA SECTION */}
          <div className="max-w-sm mx-auto w-full">
            {renderTopCTASection()}
          </div>

          {/* CONNECTED ACCOUNTS SECTION */}
          {accounts.length > 0 && (
            <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
              {renderConnectedOverview()}
            </div>
          )}

          {/* GOTRADING CONNECT card hidden per user request */}

        </div>
      )}

    </div>
  );
};
