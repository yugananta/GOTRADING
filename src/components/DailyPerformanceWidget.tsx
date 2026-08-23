import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from './AppContext';
import { apiFetch } from '../utils/apiFetch';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Target, 
  ShieldAlert, 
  DollarSign, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowUpRight,
  BookOpen,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export const DailyPerformanceWidget: React.FC = () => {
  const { 
    currentUser, 
    tradingStats, 
    syncMetaTrader, 
    setActiveView, 
    setJournalInitialTab,
    showToast,
    activeAccountLogin,
    activeAccount,
    connectedAccounts
  } = useApp();

  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTicketsExpanded, setIsTicketsExpanded] = useState(false);

  // Load targets from localStorage, matching Journal.tsx keys
  const [weeklyTargetAmount, setWeeklyTargetAmount] = useState<number>(() => {
    const saved = localStorage.getItem('tarapti_weekly_target_amount');
    return saved !== null ? Number(saved) : 0;
  });
  const [weeklyRiskAmount, setWeeklyRiskAmount] = useState<number>(() => {
    const saved = localStorage.getItem('tarapti_weekly_risk_amount');
    return saved !== null ? Number(saved) : 0;
  });

  // Calculate daily target and risk equivalents (weekly targets divided by 5 trading days)
  const dailyTarget = useMemo(() => weeklyTargetAmount / 5, [weeklyTargetAmount]);
  const dailyRiskLimit = useMemo(() => weeklyRiskAmount / 5, [weeklyRiskAmount]);

  const fetchWidgetTrades = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const currentActiveLogin = activeAccountLogin || activeAccount?.login;
      const matchingAccount = connectedAccounts?.find(
        (a: any) => a.login === currentActiveLogin || a.id === currentActiveLogin
      ) || activeAccount;

      const realAccountId = matchingAccount?.id || currentActiveLogin;
      const queryParams = new URLSearchParams();
      if (currentActiveLogin) {
        queryParams.set('login', currentActiveLogin);
        queryParams.set('accountId', realAccountId);
      }
      const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

      const res = await apiFetch(`/api/metatrader/trades${queryString}`);
      if (res.ok) {
        const data = await res.json();
        const tradesList = data.trades || data.data?.trades || (Array.isArray(data) ? data : []);
        setTrades(tradesList);
      }
    } catch (err) {
      console.error("Error fetching trades for widget:", err);
    } finally {
      setLoading(false);
    }
  };

  // Sync trades automatically when active account changes
  useEffect(() => {
    fetchWidgetTrades();
  }, [activeAccountLogin, activeAccount?.login, connectedAccounts]);

  // Sync targets on mount and regularly check if they updated in localStorage
  useEffect(() => {
    fetchWidgetTrades();

    const handleStorageChange = () => {
      const savedTarget = localStorage.getItem('tarapti_weekly_target_amount');
      const savedRisk = localStorage.getItem('tarapti_weekly_risk_amount');
      if (savedTarget !== null) setWeeklyTargetAmount(Number(savedTarget));
      if (savedRisk !== null) setWeeklyRiskAmount(Number(savedRisk));
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also set an interval to pull the latest from local storage in case it was written on the same window
    const interval = setInterval(handleStorageChange, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [currentUser]);

  // Sync with MT5/broker
  const handleSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await syncMetaTrader();
      await fetchWidgetTrades();
      if (showToast) {
        showToast("🔄 Daily performance data synced successfully!");
      }
    } catch (err) {
      console.error("Error syncing widget data:", err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Filter closed trades for today (excluding balance/deposit transactions)
  const todayTrades = useMemo(() => {
    const todayStr = new Date().toDateString();
    const isBalance = (t: any) => {
      const typeStr = String(t.type || '').toUpperCase();
      return typeStr === 'BALANCE' || typeStr === 'DEPOSIT' || typeStr === 'WITHDRAWAL' || (!t.symbol && Number(t.pl) !== 0);
    };
    return trades.filter(t => {
      if (!t.closeTime || isBalance(t)) return false;
      return new Date(t.closeTime).toDateString() === todayStr;
    });
  }, [trades]);

  // Calculate today's metrics
  const todayMetrics = useMemo(() => {
    let netPL = 0;
    let wins = 0;
    let losses = 0;
    let totalLossAmount = 0;
    let bestTrade = -Infinity;
    let worstTrade = Infinity;

    todayTrades.forEach(t => {
      const pl = Number(t.pl) || 0;
      netPL += pl;
      if (pl > 0) {
        wins++;
        if (pl > bestTrade) bestTrade = pl;
      } else if (pl < 0) {
        losses++;
        totalLossAmount += Math.abs(pl);
        if (pl < worstTrade) worstTrade = pl;
      }
    });

    // Fallback to global tradingStats if no trades in today's local list, to ensure consistency
    const globalPL = parseFloat(tradingStats.todayPL.replace('+$', '').replace('-$', '-').replace('$', '').replace(',', '')) || 0;
    const finalNetPL = todayTrades.length > 0 ? netPL : globalPL;

    const winRate = todayTrades.length > 0 ? Math.round((wins / todayTrades.length) * 100) : 0;

    return {
      netPL: Number(finalNetPL.toFixed(2)),
      wins,
      losses,
      totalLossAmount,
      totalTrades: todayTrades.length,
      winRate,
      bestTrade: bestTrade === -Infinity ? 0 : bestTrade,
      worstTrade: worstTrade === Infinity ? 0 : worstTrade
    };
  }, [todayTrades, tradingStats.todayPL]);

  // Calculate progress percentages
  const targetProgressPercent = useMemo(() => {
    if (dailyTarget <= 0) return 0;
    return Math.min(100, Math.max(0, (Math.max(0, todayMetrics.netPL) / dailyTarget) * 100));
  }, [todayMetrics.netPL, dailyTarget]);

  const riskProgressPercent = useMemo(() => {
    if (dailyRiskLimit <= 0) return 0;
    const currentDrawdown = todayMetrics.totalLossAmount;
    return Math.min(100, Math.max(0, (currentDrawdown / dailyRiskLimit) * 100));
  }, [todayMetrics.totalLossAmount, dailyRiskLimit]);

  // Theme styling based on P&L
  const isProfit = todayMetrics.netPL > 0;
  const isLoss = todayMetrics.netPL < 0;

  const formattedPL = useMemo(() => {
    const val = Math.abs(todayMetrics.netPL).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (todayMetrics.netPL > 0) return `+$${val}`;
    if (todayMetrics.netPL < 0) return `-$${val}`;
    return `$${val}`;
  }, [todayMetrics.netPL]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col gap-3 transition">
      
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
          <Activity size={14} className="text-indigo-500 animate-pulse" />
          Daily Performance
        </h4>
        <button
          onClick={handleSync}
          disabled={isSyncing || loading}
          className="text-slate-400 hover:text-indigo-600 p-1.5 rounded-lg hover:bg-indigo-50 transition active:scale-95 disabled:opacity-50"
          title="Sinkronkan data trading"
        >
          <RefreshCw size={13} className={`${isSyncing ? 'animate-spin text-indigo-600' : ''}`} />
        </button>
      </div>

      {/* Main P&L Display */}
      <div className="bg-slate-50/50 rounded-xl border border-slate-100 p-3.5 flex flex-col items-center justify-center text-center relative overflow-hidden">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Net Profit/Loss Today</span>
        
        <div className="flex items-center gap-1.5 mt-1">
          {isProfit && <TrendingUp size={20} className="text-emerald-500" />}
          {isLoss && <TrendingDown size={20} className="text-rose-500" />}
          <span className={`text-2xl font-black font-sans tracking-tight ${
            isProfit ? 'text-emerald-600' : isLoss ? 'text-rose-600' : 'text-slate-500'
          }`}>
            {formattedPL}
          </span>
        </div>

        {todayMetrics.totalTrades > 0 ? (
          <span className="text-[10px] font-semibold text-slate-500 mt-1">
            Based on <span className="font-bold text-slate-700">{todayMetrics.totalTrades} trades</span> completed today
          </span>
        ) : (
          <span className="text-[10px] text-slate-400 mt-1">
            No trades completed today
          </span>
        )}

        {/* Profit state accent overlay */}
        {isProfit && (
          <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/5 rounded-full filter blur-xl" />
        )}
        {isLoss && (
          <div className="absolute top-0 right-0 w-12 h-12 bg-rose-500/5 rounded-full filter blur-xl" />
        )}
      </div>

      {/* Targets and Risk Limits Section */}
      <div className="space-y-3">
        
        {/* Profit Target Gauge */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="text-slate-500 flex items-center gap-1">
              <Target size={11} className="text-emerald-500" />
              Daily Profit Target
            </span>
            <span className="text-slate-700">
              {dailyTarget > 0 ? `$${dailyTarget.toFixed(2)}` : 'Not Set'}
            </span>
          </div>

          {dailyTarget > 0 ? (
            <div className="space-y-1">
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${targetProgressPercent}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className={`h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 ${
                    targetProgressPercent >= 100 ? 'animate-pulse' : ''
                  }`}
                />
              </div>
              <div className="flex items-center justify-between text-[9px] font-black uppercase text-slate-400 tracking-wider">
                <span>{Math.round(targetProgressPercent)}% Achieved</span>
                {targetProgressPercent >= 100 && (
                  <span className="text-emerald-600 flex items-center gap-0.5 font-black">
                    <CheckCircle2 size={10} /> Goal Reached!
                  </span>
                )}
              </div>
            </div>
          ) : (
            <button 
              onClick={() => {
                setJournalInitialTab('goals');
                setActiveView('journal');
              }}
              className="w-full py-1.5 bg-indigo-50 border border-dashed border-indigo-200 text-indigo-600 text-[10px] font-black uppercase tracking-wider rounded-lg hover:bg-indigo-100/70 transition"
            >
              Set Profit Targets
            </button>
          )}
        </div>

        {/* Risk Limit Gauge */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="text-slate-500 flex items-center gap-1">
              <ShieldAlert size={11} className="text-rose-500" />
              Daily Loss Limit (Drawdown)
            </span>
            <span className="text-slate-700">
              {dailyRiskLimit > 0 ? `$${dailyRiskLimit.toFixed(2)}` : 'Not Set'}
            </span>
          </div>

          {dailyRiskLimit > 0 ? (
            <div className="space-y-1">
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${riskProgressPercent}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className={`h-full rounded-full ${
                    riskProgressPercent >= 80 ? 'bg-rose-500' : riskProgressPercent >= 50 ? 'bg-amber-500' : 'bg-slate-400'
                  }`}
                />
              </div>
              <div className="flex items-center justify-between text-[9px] font-black uppercase text-slate-400 tracking-wider">
                <span className={riskProgressPercent >= 80 ? 'text-rose-500 font-extrabold' : ''}>
                  {Math.round(riskProgressPercent)}% Risk Used
                </span>
                <span>Max Drawdown</span>
              </div>

              {riskProgressPercent >= 80 && (
                <div className="bg-rose-50 border border-rose-100 rounded-lg p-2 flex items-center gap-1.5 text-rose-700 text-[10px] font-bold mt-1">
                  <AlertTriangle size={12} className="text-rose-600 shrink-0" />
                  <span>⚠️ RISK WARNING: Limit hampir tercapai, disarankan berhenti trading!</span>
                </div>
              )}
            </div>
          ) : (
            <button 
              onClick={() => {
                setJournalInitialTab('goals');
                setActiveView('journal');
              }}
              className="w-full py-1.5 bg-rose-50 border border-dashed border-rose-150 text-rose-600 text-[10px] font-black uppercase tracking-wider rounded-lg hover:bg-rose-100/70 transition"
            >
              Set Loss Limits
            </button>
          )}
        </div>

      </div>

      {/* Stats Summary Grid */}
      {todayMetrics.totalTrades > 0 && (
        <div className="grid grid-cols-3 gap-1.5 border-t border-slate-100 pt-3 text-center">
          <div className="p-2 bg-slate-50/50 rounded-lg">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Trades</span>
            <span className="text-xs font-black text-slate-800 mt-0.5 block">{todayMetrics.totalTrades}</span>
          </div>
          <div className="p-2 bg-slate-50/50 rounded-lg">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Win Rate</span>
            <span className="text-xs font-black text-slate-800 mt-0.5 block">{todayMetrics.winRate}%</span>
          </div>
          <div className="p-2 bg-slate-50/50 rounded-lg">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">W - L</span>
            <span className="text-xs font-black text-slate-800 mt-0.5 block text-[10px]">
              <span className="text-emerald-600 font-black">{todayMetrics.wins}W</span>
              <span className="text-slate-300 mx-1">/</span>
              <span className="text-rose-600 font-black">{todayMetrics.losses}L</span>
            </span>
          </div>
        </div>
      )}

      {/* Collage Section: List of Today's Trades */}
      {todayTrades.length > 0 && (
        <div className="border-t border-slate-100 pt-2.5">
          <button
            onClick={() => setIsTicketsExpanded(!isTicketsExpanded)}
            className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition"
          >
            <span>Today's Transactions</span>
            <div className="flex items-center gap-1 text-[9px] font-extrabold capitalize text-slate-500 normal-case tracking-normal">
              <span>{isTicketsExpanded ? 'Sembunyikan' : 'Detail'}</span>
              {isTicketsExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </div>
          </button>

          <AnimatePresence>
            {isTicketsExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden mt-2 space-y-1.5 max-h-40 overflow-y-auto pr-1 no-scrollbar"
              >
                {todayTrades.map((t, index) => {
                  const pl = Number(t.pl) || 0;
                  return (
                    <div 
                      key={t.id || index}
                      className="p-2 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-100 flex items-center justify-between text-xs transition"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                          t.type === 'BUY' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {t.type}
                        </span>
                        <div className="flex flex-col">
                          <span className="font-black text-slate-800 text-[11px]">{t.symbol}</span>
                          <span className="text-[9px] font-semibold text-slate-400">{t.lots} Lots</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className={`font-bold font-sans ${pl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {pl >= 0 ? `+$${pl.toFixed(2)}` : `-$${Math.abs(pl).toFixed(2)}`}
                        </span>
                        <span className="text-[9px] text-slate-400">
                          {new Date(t.closeTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Call to action */}
      <button
        onClick={() => {
          setJournalInitialTab('ledger');
          setActiveView('journal');
        }}
        className="w-full mt-1.5 py-2 px-3 bg-slate-100 hover:bg-indigo-600 hover:text-white rounded-xl text-slate-700 text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 group active:scale-95 cursor-pointer shadow-sm border border-slate-200/40"
      >
        <BookOpen size={13} className="group-hover:rotate-6 transition-transform" />
        <span>Buka Jurnal Trading Lengkap</span>
      </button>

    </div>
  );
};
