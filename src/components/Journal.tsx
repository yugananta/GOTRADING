import { DrawdownRiskEngine } from './DrawdownRiskEngine.tsx';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from './AppContext.js';
import { parseUTCDate } from '../utils/dateUtils.ts';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Target, 
  ShieldAlert, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Activity, 
  CheckCircle, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  Award,
  Trophy,
  BookOpen,
  BookText,
  DollarSign,
  Layers,
  Compass,
  ArrowUpRight,
  BrainCircuit,
  BarChart2,
  Clock,
  History,
  Info,
  Download,
  Lock,
  Unlock,
  BarChart3,
  Search,
  RefreshCw,
  Share2,
  ArrowRight,
  Loader2,
  Send,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ChevronDown,
  Database,
  Check,
  Plus
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { apiFetch } from '../utils/apiFetch';
import { ShareSummaryCardModal, SummaryCardData } from './ShareSummaryCardModal';
import { PortfolioReport } from './PortfolioReport';

interface MockTradeTicket {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  lots: number;
  openPrice: number;
  closePrice: number;
  pl: number;
  time: string;
}

interface MockTradeDetail {
  date: string;
  netPL: number;
  netPLPercent: number;
  startBalance: number;
  endBalance: number;
  deposit: number;
  buysCount: number;
  sellsCount: number;
  tradesCount: number;
  bestTrade: number;
  worstTrade: number;
  avgHoldTime: string;
  maxDrawdown: number;
  fees: number;
  winrate: number;
  profitFactor: number;
  expectancy: number;
  tickets?: MockTradeTicket[];
}

export const Journal: React.FC = () => {
  const { t } = useTranslation();
  const { 
    currentUser, 
    connectedBroker, 
    connectedAccounts, 
    activeAccountLogin, 
    setActiveAccountLogin, 
    activeAccount, 
    tradingStats, 
    setTradingStats, 
    fetchNotifications, 
    showToast, 
    triggerTestNotification, 
    setActiveView, 
    journalInitialTab 
  } = useApp();
  
  // Tabs: 'goals' | 'ledger' | 'history'
  
  useEffect(() => {
    const handleOpenTab = (e) => {
      if (e.detail) setActiveTab(e.detail);
    };
    window.addEventListener('open-journal-tab', handleOpenTab);
    return () => window.removeEventListener('open-journal-tab', handleOpenTab);
  }, []);

  const [activeTab, setActiveTab] = useState<'goals' | 'ledger' | 'history' | 'risk'>(() => journalInitialTab || 'goals');

  useEffect(() => {
    if (journalInitialTab) {
      setActiveTab(journalInitialTab);
    }
  }, [journalInitialTab]);

  // State for connected accounts dropdown
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsAccountDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Mission Goal State
  const [weeklyTargetAmount, setWeeklyTargetAmount] = useState<number>(() => {
    const saved = localStorage.getItem('tarapti_weekly_target_amount');
    return saved !== null ? Number(saved) : 0;
  });
  const [weeklyRiskAmount, setWeeklyRiskAmount] = useState<number>(() => {
    const saved = localStorage.getItem('tarapti_weekly_risk_amount');
    return saved !== null ? Number(saved) : 0;
  });

  const [weeklyTargetInput, setWeeklyTargetInput] = useState<string>(() => {
    const saved = localStorage.getItem('tarapti_weekly_target_amount');
    return saved && saved !== '0' ? saved : '';
  });
  const [weeklyRiskInput, setWeeklyRiskInput] = useState<string>(() => {
    const saved = localStorage.getItem('tarapti_weekly_risk_amount');
    return saved && saved !== '0' ? saved : '';
  });

  const handleTargetInputChange = (val: string) => {
    setWeeklyTargetInput(val);
    const parsed = parseFloat(val);
    setWeeklyTargetAmount(isNaN(parsed) ? 0 : parsed);
  };

  const handleRiskInputChange = (val: string) => {
    setWeeklyRiskInput(val);
    const parsed = parseFloat(val);
    setWeeklyRiskAmount(isNaN(parsed) ? 0 : parsed);
  };

  const [manualBalance, setManualBalance] = useState<string>('');
  const [goalAlert, setGoalAlert] = useState<{ type: 'success' | 'danger', message: string } | null>(null);

  const handleSaveTargets = (e: React.FormEvent) => {
    e.preventDefault();
    const targetNum = parseFloat(weeklyTargetInput) || 0;
    const riskNum = parseFloat(weeklyRiskInput) || 0;
    setWeeklyTargetAmount(targetNum);
    setWeeklyRiskAmount(riskNum);
    localStorage.setItem('tarapti_weekly_target_amount', targetNum.toString());
    localStorage.setItem('tarapti_weekly_risk_amount', riskNum.toString());
    showToast('Trading Targets & Risk Management saved successfully!');
  };

  // Parse numerical balance
  const currentBalanceValue = parseFloat((manualBalance || tradingStats.portfolio).replace('$', '').replace(',', '')) || 0;
  
  // Calculations
  const dailyTargetAmount = weeklyTargetAmount / 5;
  const dailyRiskLimitAmount = weeklyRiskAmount / 5;

  // Active year in Yearly Calendar
  const [activeYear, setActiveYear] = useState<number>(() => new Date().getFullYear());
  const [activeMonth, setActiveMonth] = useState<number>(() => new Date().getMonth()); // 0-11

  // Today's P&L value
  const todayPLValue = parseFloat(tradingStats.todayPL.replace('+$', '').replace('-$', '-').replace('$', '').replace(',', '')) || 0;

  // Clicked Day State for detailed transaction popup
  const [selectedDayDetail, setSelectedDayDetail] = useState<MockTradeDetail | null>(null);
  const [modalTab, setModalTab] = useState<'stats' | 'tickets'>('stats');

  // Interactive diagnostic modal state (AI Bento & Realtime MT5 Analysis)
  const [activeAnalysisPopup, setActiveAnalysisPopup] = useState<{
    title: string;
    content: string;
    recommendation: string;
    confidence?: number;
    riskBias?: string;
    keyInsights?: string[];
    actionItems?: string[];
    isAiGenerated?: boolean;
    analysisType?: string;
  } | null>(null);
  const [isAnalyzingAi, setIsAnalyzingAi] = useState<boolean>(false);
  const [customAiQuery, setCustomAiQuery] = useState<string>('');
  const [drawerFollowupQuery, setDrawerFollowupQuery] = useState<string>('');

  // --- REAL-TIME METATRADER TRADES SYNC ---
  const [activeAccountInfo, setActiveAccountInfo] = useState<any>(null);
  const isDataStale = useMemo(() => {
    if (!activeAccountInfo) return false;
    if (activeAccountInfo.conn_status === 'error') return true;
    if (!activeAccountInfo.fetched_at) return false;
    const fetchedTime = new Date(activeAccountInfo.fetched_at).getTime();
    if (isNaN(fetchedTime)) return false;
    const diffMinutes = (Date.now() - fetchedTime) / 60000;
    return diffMinutes > 15;
  }, [activeAccountInfo]);
  const [trades, setTrades] = useState<any[]>([]);
  const [loadingTrades, setLoadingTrades] = useState(false);
  const latestRequestIdRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const previousAccountLoginRef = useRef<string | null>(null);

  const fetchTradesAndAccount = async (targetLoginOrId?: string) => {
    const requestId = ++latestRequestIdRef.current;
    
    // Abort previous in-flight requests if any
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setLoadingTrades(true);
    try {
      const currentActiveLogin = targetLoginOrId || activeAccountLogin || activeAccount?.login || connectedAccounts?.[0]?.login;
      
      if (!currentActiveLogin && !activeAccount?.id) {
        console.log("[Journal.tsx] No active trading account connected or selected.");
        if (latestRequestIdRef.current === requestId) {
          setActiveAccountInfo(null);
          setTrades([]);
        }
        return;
      }

      // Find matching account in connectedAccounts or fallback to activeAccount to get the real UUID id
      const matchingAccount = connectedAccounts?.find(
        (a: any) => String(a.login) === String(currentActiveLogin) || String(a.id) === String(currentActiveLogin)
      ) || activeAccount;

      const realAccountId = matchingAccount?.id || currentActiveLogin;

      const queryParam = currentActiveLogin 
        ? `?login=${encodeURIComponent(currentActiveLogin)}&accountId=${encodeURIComponent(realAccountId || '')}`
        : (realAccountId ? `?accountId=${encodeURIComponent(realAccountId)}` : '');

      console.log(`[Journal.tsx] [Req #${requestId}] Fetching account info and trades for login: ${currentActiveLogin || 'default'} (ID: ${realAccountId})`);

      // 1. Fetch account info
      const accRes = await apiFetch(`/api/metatrader/account${queryParam}`, { signal: controller.signal });
      if (accRes.ok) {
        const data = await accRes.json();
        const accs = data.accounts || (data.account ? [data.account] : (data.data?.accounts || (data.data?.account ? [data.data.account] : [])));
        if (latestRequestIdRef.current === requestId && accs && accs.length > 0) {
          const found = currentActiveLogin 
            ? accs.find((a: any) => String(a.login) === String(currentActiveLogin) || String(a.id) === String(currentActiveLogin)) 
            : accs[0];
          setActiveAccountInfo(found || accs[0]);
        }
      }

      // 2. Fetch trades specifically for this account
      const queryParams = new URLSearchParams();
      if (currentActiveLogin) {
        queryParams.set('login', String(currentActiveLogin));
      }
      if (realAccountId) {
        queryParams.set('accountId', String(realAccountId));
      }
      const res = await apiFetch(`/api/metatrader/trades?${queryParams.toString()}`, { signal: controller.signal });
      const isJson = res.headers.get('content-type')?.includes('application/json');
      if (res.ok && isJson) {
        const data = await res.json();
        const tradesList = data.trades || data.data?.trades || (Array.isArray(data) ? data : []);
        if (latestRequestIdRef.current === requestId) {
          console.log(`[Journal.tsx] [Req #${requestId}] Loaded ${tradesList.length} trades for account ${currentActiveLogin || 'default'}`);
          setTrades(tradesList);
        }
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        console.log(`[Journal.tsx] [Req #${requestId}] Request aborted in favor of a newer request.`);
        return;
      }
      console.error("[Journal.tsx] Error fetching trades and account info:", err);
    } finally {
      if (latestRequestIdRef.current === requestId) {
        setLoadingTrades(false);
      }
    }
  };

  const fetchTrades = fetchTradesAndAccount;

  const handleSyncMetaTrader = async () => {
    setLoadingTrades(true);
    const currentActiveLogin = activeAccountLogin || activeAccount?.login || connectedAccounts?.[0]?.login;
    const queryParams = new URLSearchParams();
    if (currentActiveLogin) {
      queryParams.set('login', String(currentActiveLogin));
      queryParams.set('accountId', String(activeAccount?.id || currentActiveLogin));
    }
    const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

    try {
      const res = await apiFetch(`/api/metatrader/sync${queryString}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          accountId: activeAccount?.id || currentActiveLogin,
          login: currentActiveLogin
        })
      });
      if (res.ok) {
        await fetchTradesAndAccount(currentActiveLogin);
        if (showToast) {
          showToast("🔄 Sync Sukses! Data MetaTrader tersinkronisasi secara real-time.");
        }
      } else {
        const data = await res.json().catch(() => null);
        const errorMsg = data?.error || "Gagal sinkronisasi data dari MetaTrader Gateway.";
        await fetchTradesAndAccount(currentActiveLogin);
        if (showToast) {
          showToast(`❌ Sync Gagal: ${errorMsg}`);
        }
      }
    } catch (err: any) {
      console.error("Error syncing trades:", err);
      await fetchTradesAndAccount(currentActiveLogin);
      if (showToast) {
        showToast(`❌ Sync Gagal: ${err?.message || "Terjadi kesalahan koneksi."}`);
      }
    } finally {
      setLoadingTrades(false);
    }
  };

  useEffect(() => {
    const prevLogin = previousAccountLoginRef.current;
    const targetLogin = activeAccountLogin || activeAccount?.login;
    
    console.log('[JOURNAL-ACCOUNT-SWITCH]', { from: prevLogin, to: targetLogin ? String(targetLogin) : null });
    previousAccountLoginRef.current = targetLogin ? String(targetLogin) : null;

    // Reset state before starting new fetch to avoid stale data display
    setTrades([]);
    setActiveAccountInfo(null);

    if (targetLogin) {
      fetchTradesAndAccount(String(targetLogin));
    } else if (connectedAccounts && connectedAccounts.length > 0) {
      fetchTradesAndAccount(String(connectedAccounts[0].login));
    } else {
      setTrades([]);
      setActiveAccountInfo(null);
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [activeAccountLogin, activeAccount?.login, activeAccount?.id]);

  // Helper to identify balance transactions (Deposits / Withdrawals / Credits)
  const isBalanceDeal = (t: any) => {
    const typeStr = String(t.type || '').toUpperCase();
    return typeStr === 'BALANCE' || typeStr === 'DEPOSIT' || typeStr === 'WITHDRAWAL' || (!t.symbol && Number(t.pl) !== 0);
  };

  // Filter closed trades (Must have closeTime AND be a real BUY/SELL trading position, not a balance deal)
  const closedTrades = useMemo(() => trades.filter(t => t.closeTime && !isBalanceDeal(t)), [trades]);

  // History tab: 'closed' | 'floating'
  const [historyTab, setHistoryTab] = useState<'closed' | 'floating'>('closed');
  const [historySearch, setHistorySearch] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');

  // Open trades list and floating profit ($) (Excluding balance transactions)
  const openTrades = useMemo(() => trades.filter(t => !t.closeTime && !isBalanceDeal(t)), [trades]);

  const activeTabTrades = useMemo(() => {
    return historyTab === 'closed' ? closedTrades : openTrades;
  }, [historyTab, closedTrades, openTrades]);

  const filteredHistoryTrades = useMemo(() => {
    return activeTabTrades.filter(t => {
      const matchesSymbol = t.symbol ? t.symbol.toLowerCase().includes(historySearch.toLowerCase()) : true;
      const matchesType = historyTypeFilter === 'ALL' || (t.type && t.type.toUpperCase() === historyTypeFilter);
      return matchesSymbol && matchesType;
    });
  }, [activeTabTrades, historySearch, historyTypeFilter]);

  const totalVolumeLots = useMemo(() => {
    return closedTrades.reduce((acc, t) => acc + (Number(t.lots) || Number(t.volume) || 0), 0);
  }, [closedTrades]);
  const floatingProfitUSD = useMemo(() => {
    if (typeof activeAccountInfo?.profit === 'number') {
      return activeAccountInfo.profit;
    }
    if (activeAccountInfo?.equity && activeAccountInfo?.balance) {
      return activeAccountInfo.equity - activeAccountInfo.balance;
    }
    return openTrades.reduce((acc, t) => acc + (Number(t.pl) || Number(t.profit) || 0), 0);
  }, [activeAccountInfo, openTrades]);

  // Overall statistics from trades
  const totalTradesCount = closedTrades.length;
  const totalWinsCount = closedTrades.filter(t => t.pl > 0).length;
  const totalGrossProfit = closedTrades.filter(t => t.pl > 0).reduce((acc, t) => acc + t.pl, 0);
  const totalGrossLoss = Math.abs(closedTrades.filter(t => t.pl < 0).reduce((acc, t) => acc + t.pl, 0));
  const overallWinRate = totalTradesCount > 0 ? (totalWinsCount / totalTradesCount) * 100 : 0;
  const overallProfitFactor = totalGrossLoss > 0 ? (totalGrossProfit / totalGrossLoss) : (totalGrossProfit > 0 ? 99.99 : 0);

  // All-time Total P&L and All-time Drawdown (%)
  const totalPnLAllTime = useMemo(() => {
    if (typeof activeAccountInfo?.total_pnl === 'number') return activeAccountInfo.total_pnl;
    if (typeof activeAccountInfo?.totalPnl === 'number') return activeAccountInfo.totalPnl;
    if (typeof activeAccountInfo?.totalPnL === 'number') return activeAccountInfo.totalPnL;
    return closedTrades.reduce((acc, t) => acc + (t.pl || 0), 0);
  }, [activeAccountInfo, closedTrades]);

  const currentEffectiveBalance = useMemo(() => {
    if (typeof activeAccountInfo?.balance === 'number') return activeAccountInfo.balance;
    if (typeof activeAccount?.balance === 'number') return activeAccount.balance;
    return 0;
  }, [activeAccountInfo, activeAccount]);

  const balanceDeals = useMemo(() => trades.filter(t => isBalanceDeal(t)), [trades]);
  
  const { initialDepositAmount, additionalDepositsAmount, totalDepositsAmount } = useMemo(() => {
    const beTotalDeposit = typeof activeAccountInfo?.total_deposit === 'number'
      ? activeAccountInfo.total_deposit
      : (typeof activeAccountInfo?.totalDeposit === 'number' ? activeAccountInfo.totalDeposit : null);

    // Deduplicate balance deals by ID, ticket, or signature
    const seen = new Set<string>();
    const uniqueBalanceDeals = balanceDeals.filter(deal => {
      const key = deal.id || deal.ticket || deal.dealId || `${deal.closeTime || deal.openTime || deal.time || ''}_${deal.pl}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const sortedBalanceDeals = [...uniqueBalanceDeals].sort((a, b) => 
      parseUTCDate(a.closeTime || a.openTime || a.time || 0).getTime() - parseUTCDate(b.closeTime || b.openTime || b.time || 0).getTime()
    );
    const positiveDeals = sortedBalanceDeals.filter(t => (t.pl || 0) > 0);
    if (positiveDeals.length > 0) {
      const initial = positiveDeals[0].pl || 0;
      const additional = positiveDeals.slice(1).reduce((acc, t) => acc + (t.pl || 0), 0);
      return {
        initialDepositAmount: initial,
        additionalDepositsAmount: additional,
        totalDepositsAmount: beTotalDeposit !== null ? beTotalDeposit : (initial + additional),
      };
    }
    if (beTotalDeposit !== null) {
      return {
        initialDepositAmount: beTotalDeposit,
        additionalDepositsAmount: 0,
        totalDepositsAmount: beTotalDeposit,
      };
    }
    if (currentEffectiveBalance > 0) {
      const calc = currentEffectiveBalance - (totalPnLAllTime > 0 ? totalPnLAllTime : 0);
      const initial = calc > 0 ? calc : currentEffectiveBalance;
      return {
        initialDepositAmount: initial,
        additionalDepositsAmount: 0,
        totalDepositsAmount: initial,
      };
    }
    return {
      initialDepositAmount: 0,
      additionalDepositsAmount: 0,
      totalDepositsAmount: 0,
    };
  }, [activeAccountInfo, balanceDeals, currentEffectiveBalance, totalPnLAllTime]);

  const totalWithdrawalsAmount = useMemo(() => {
    if (typeof activeAccountInfo?.total_withdrawal === 'number') return Math.abs(activeAccountInfo.total_withdrawal);
    if (typeof activeAccountInfo?.totalWithdrawal === 'number') return Math.abs(activeAccountInfo.totalWithdrawal);
    return Math.abs(balanceDeals.filter(t => (t.pl || 0) < 0).reduce((acc, t) => acc + (t.pl || 0), 0));
  }, [activeAccountInfo, balanceDeals]);

  const totalPnLAllTimePercent = useMemo(() => {
    if (typeof activeAccountInfo?.performance_pct === 'number') return activeAccountInfo.performance_pct;
    if (typeof activeAccountInfo?.performancePct === 'number') return activeAccountInfo.performancePct;
    if (typeof activeAccountInfo?.performancePercent === 'number') return activeAccountInfo.performancePercent;
    return totalDepositsAmount > 0 ? (totalPnLAllTime / totalDepositsAmount) * 100 : 0;
  }, [activeAccountInfo, totalPnLAllTime, totalDepositsAmount]);

  // Current Week Progress Calculations
  const now = new Date();
  const dayOfWeek = now.getDay();
  const distanceToMon = (dayOfWeek + 6) % 7;
  const mondayOfWeek = new Date(now);
  mondayOfWeek.setDate(now.getDate() - distanceToMon);
  mondayOfWeek.setHours(0, 0, 0, 0);

  const weeklyTrades = closedTrades.filter(t => parseUTCDate(t.closeTime) >= mondayOfWeek);
  const weeklyAchievedPL = weeklyTrades.reduce((acc, t) => acc + t.pl, 0);
  const weeklyLosses = weeklyTrades.filter(t => t.pl < 0).reduce((acc, t) => acc + t.pl, 0);
  const currentWeeklyDD = Math.abs(weeklyLosses);

  const weeklyTargetPercent = weeklyTargetAmount > 0 ? Math.min(100, Math.max(0, (Math.max(0, weeklyAchievedPL) / weeklyTargetAmount) * 100)) : 0;
  const weeklyDDPercent = weeklyRiskAmount > 0 ? Math.min(100, Math.max(0, (currentWeeklyDD / weeklyRiskAmount) * 100)) : 0;

  const maxDrawdownAllTimePercent = useMemo(() => {
    if (typeof activeAccountInfo?.drawdown_pct === 'number') return activeAccountInfo.drawdown_pct;
    if (typeof activeAccountInfo?.drawdownPct === 'number') return activeAccountInfo.drawdownPct;
    if (typeof activeAccountInfo?.drawdownPercent === 'number') return activeAccountInfo.drawdownPercent;
    if (typeof activeAccountInfo?.max_drawdown === 'number') return activeAccountInfo.max_drawdown;
    if (typeof activeAccountInfo?.maxDrawdown === 'number') return activeAccountInfo.maxDrawdown;

    const sorted = [...closedTrades].sort((a, b) => parseUTCDate(a.closeTime).getTime() - parseUTCDate(b.closeTime).getTime());
    const peakEquityVal = typeof activeAccountInfo?.peak_equity === 'number'
      ? activeAccountInfo.peak_equity
      : (typeof activeAccountInfo?.peakEquity === 'number' ? activeAccountInfo.peakEquity : null);
    let peak = peakEquityVal !== null && peakEquityVal > 0 ? peakEquityVal : (totalDepositsAmount > 0 ? totalDepositsAmount : (currentEffectiveBalance || 0));
    let running = peak;
    let maxDD = 0;
    sorted.forEach(t => {
      running += (t.pl || 0);
      if (running > peak) peak = running;
      const dd = peak - running;
      if (dd > maxDD) maxDD = dd;
    });
    return peak > 0 ? Math.min(100, (maxDD / peak) * 100) : (weeklyDDPercent > 0 ? weeklyDDPercent : 0);
  }, [activeAccountInfo, closedTrades, totalDepositsAmount, currentEffectiveBalance, weeklyDDPercent]);

  // Daily Progress Calculations
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayTradesList = closedTrades.filter(t => parseUTCDate(t.closeTime) >= todayStart);
  const dailyAchievedPL = todayTradesList.length > 0 ? todayTradesList.reduce((acc, t) => acc + t.pl, 0) : todayPLValue;
  const dailyLosses = todayTradesList.length > 0 ? todayTradesList.filter(t => t.pl < 0).reduce((acc, t) => acc + t.pl, 0) : (todayPLValue < 0 ? todayPLValue : 0);
  const dailyCurrentDD = Math.abs(dailyLosses);

  const dailyTargetPercent = dailyTargetAmount > 0 ? Math.min(100, Math.max(0, (Math.max(0, dailyAchievedPL) / dailyTargetAmount) * 100)) : 0;
  const dailyDDPercent = dailyRiskLimitAmount > 0 ? Math.min(100, Math.max(0, (dailyCurrentDD / dailyRiskLimitAmount) * 100)) : 0;

  // Compile trades data dynamically (Only for actual closed trading positions)
  const monthlyTradesData = useMemo(() => {
    const data: { [day: number]: { netPL: number, wins: number, total: number, tickets: any[] } } = {};
    
    closedTrades.forEach(trade => {
      if (trade.closeTime) {
        const dateObj = parseUTCDate(trade.closeTime);
        if (dateObj.getMonth() === activeMonth && dateObj.getFullYear() === activeYear) {
          const day = dateObj.getDate();
          if (!data[day]) {
            data[day] = { netPL: 0, wins: 0, total: 0, tickets: [] };
          }
          data[day].netPL = Number((data[day].netPL + trade.pl).toFixed(2));
          data[day].total += 1;
          if (trade.pl > 0) {
            data[day].wins += 1;
          }
          data[day].tickets.push({
            id: trade.id,
            symbol: trade.symbol,
            type: trade.type,
            lots: trade.lots,
            openPrice: trade.openPrice,
            closePrice: trade.closePrice,
            pl: trade.pl,
            time: parseUTCDate(trade.closeTime).toLocaleTimeString('en-US', { hour12: false })
          });
        }
      }
    });
    return data;
  }, [closedTrades, activeMonth, activeYear]);

  // Compile monthly stats
  let totalMonthlyPL = 0;
  let totalMonthlyTrades = 0;
  let totalMonthlyWins = 0;

  Object.entries(monthlyTradesData).forEach(([_, data]) => {
    totalMonthlyPL += data.netPL;
    totalMonthlyTrades += data.total;
    totalMonthlyWins += data.wins;
  });

  const monthlyPLPercent = currentBalanceValue > 0 ? (totalMonthlyPL / currentBalanceValue) * 100 : 0;
  const monthlyWinRate = totalMonthlyTrades > 0 ? (totalMonthlyWins / totalMonthlyTrades) * 100 : 0;

  // Yearly calculation from real trades
  const getYearlyStats = (year: number) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const fullMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    const monthList = months.map((m, idx) => {
      const monthTrades = closedTrades.filter(t => {
        const d = parseUTCDate(t.closeTime);
        return d.getFullYear() === year && d.getMonth() === idx;
      });

      const tradesCount = monthTrades.length;
      const pl = monthTrades.reduce((acc, t) => acc + t.pl, 0);
      const winsCount = monthTrades.filter(t => t.pl > 0).length;
      const lossesCount = monthTrades.filter(t => t.pl < 0).length;
      const winrate = tradesCount > 0 ? (winsCount / tradesCount) * 100 : 0;
      const buysCount = monthTrades.filter(t => (t.type || '').toUpperCase() === 'BUY').length;
      const sellsCount = monthTrades.filter(t => (t.type || '').toUpperCase() === 'SELL').length;
      const bestTrade = monthTrades.length > 0 ? Math.max(...monthTrades.map(t => t.pl)) : 0;
      const worstTrade = monthTrades.length > 0 ? Math.min(...monthTrades.map(t => t.pl)) : 0;
      
      const grossProfit = monthTrades.filter(t => t.pl > 0).reduce((a, b) => a + b.pl, 0);
      const grossLoss = Math.abs(monthTrades.filter(t => t.pl < 0).reduce((a, b) => a + b.pl, 0));
      const pfNum = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? 99 : 0);

      const tickets: MockTradeTicket[] = monthTrades.map((t, index) => ({
        id: t.id || `M-${idx}-${index}`,
        symbol: t.symbol || 'XAUUSD',
        type: ((t.type || 'BUY').toUpperCase() === 'SELL' ? 'SELL' : 'BUY') as 'BUY' | 'SELL',
        lots: t.lots || 0.1,
        openPrice: t.openPrice || 0,
        closePrice: t.closePrice || 0,
        pl: t.pl || 0,
        time: t.closeTime ? parseUTCDate(t.closeTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace(/\s*(AM|PM|am|pm)/gi, '') : '12:00'
      }));

      return { 
        m, 
        fullMonth: fullMonths[idx],
        pl: tradesCount === 0 ? null : Math.round(pl), 
        rawPL: pl,
        trades: tradesCount,
        wins: winsCount,
        losses: lossesCount,
        winrate,
        buysCount,
        sellsCount,
        bestTrade,
        worstTrade,
        profitFactor: pfNum,
        tickets
      };
    });

    const totalYTD = closedTrades
      .filter(t => parseUTCDate(t.closeTime).getFullYear() === year)
      .reduce((acc, t) => acc + t.pl, 0);

    return { monthList, totalYTD };
  };

  const { monthList: activeYearMonths, totalYTD: activeYearYTD } = getYearlyStats(activeYear);

  // Share summary card state & opener
  const [shareCardOpen, setShareCardOpen] = useState(false);
  const [shareCardData, setShareCardData] = useState<SummaryCardData | null>(null);

  const openShareCard = (customData?: Partial<SummaryCardData>) => {
    const fullName = `${currentUser?.firstName || ''} ${currentUser?.lastName || ''}`.trim();
    const displayName = fullName || currentUser?.username || 'GoTrading Member';
    const username = currentUser?.username;
    const avatar = currentUser?.avatar;

    const baseBalance = currentEffectiveBalance;
    const baseEquity = activeAccountInfo?.equity ?? (currentEffectiveBalance + floatingProfitUSD);
    const baseFloating = floatingProfitUSD;
    const baseDrawdown = maxDrawdownAllTimePercent;
    const baseDeposit = totalDepositsAmount;
    const baseWithdrawal = totalWithdrawalsAmount;

    if (customData) {
      setShareCardData({
        date: customData.date || new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        netPL: customData.netPL ?? todayPLValue,
        netPLPercent: customData.netPLPercent ?? (currentBalanceValue > 0 ? (todayPLValue / currentBalanceValue) * 100 : 0),
        tradesCount: customData.tradesCount ?? (todayTradesList.length || 1),
        wins: customData.wins ?? (todayTradesList.filter(t => t.pl > 0).length || (todayPLValue >= 0 ? 1 : 0)),
        losses: customData.losses ?? (todayTradesList.filter(t => t.pl < 0).length || (todayPLValue < 0 ? 1 : 0)),
        winRate: customData.winRate ?? (todayTradesList.length > 0 ? (todayTradesList.filter(t => t.pl > 0).length / todayTradesList.length) * 100 : (todayPLValue >= 0 ? 100 : 0)),
        bestTrade: customData.bestTrade ?? (todayTradesList.length > 0 ? Math.max(...todayTradesList.map(t => t.pl)) : Math.max(0, todayPLValue)),
        worstTrade: customData.worstTrade ?? (todayTradesList.length > 0 ? Math.min(...todayTradesList.map(t => t.pl)) : Math.min(0, todayPLValue)),
        profitFactor: customData.profitFactor ?? overallProfitFactor.toFixed(2),
        accountName: displayName,
        username: username,
        avatar: avatar,
        balance: customData.balance ?? baseBalance,
        equity: customData.equity ?? baseEquity,
        floatingProfit: customData.floatingProfit ?? baseFloating,
        drawdown: customData.drawdown ?? baseDrawdown,
        deposit: customData.deposit ?? baseDeposit,
        withdrawal: customData.withdrawal ?? baseWithdrawal,
      });
    } else {
      const isPortfolio = activeTab === 'goals';
      const pnlAmt = isPortfolio ? totalPnLAllTime : todayPLValue;
      const pnlPct = isPortfolio 
        ? totalPnLAllTimePercent 
        : (currentBalanceValue > 0 ? (todayPLValue / currentBalanceValue) * 100 : 0);
      const tradesList = isPortfolio ? closedTrades : todayTradesList;
      const winsCount = tradesList.filter(t => t.pl > 0).length;
      const lossesCount = tradesList.filter(t => t.pl < 0).length;
      const total = tradesList.length || (pnlAmt !== 0 ? 1 : 0);
      const winrate = isPortfolio ? overallWinRate : (total > 0 ? (winsCount / total) * 100 : (pnlAmt >= 0 ? 100 : 0));

      setShareCardData({
        date: isPortfolio ? 'Portofolio All-Time' : new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        netPL: pnlAmt,
        netPLPercent: pnlPct,
        tradesCount: total,
        wins: winsCount || (pnlAmt >= 0 ? 1 : 0),
        losses: lossesCount || (pnlAmt < 0 ? 1 : 0),
        winRate: winrate,
        bestTrade: tradesList.length > 0 ? Math.max(...tradesList.map(t => t.pl)) : Math.max(0, pnlAmt),
        worstTrade: tradesList.length > 0 ? Math.min(...tradesList.map(t => t.pl)) : Math.min(0, pnlAmt),
        profitFactor: overallProfitFactor.toFixed(2),
        accountName: displayName,
        username: username,
        avatar: avatar,
        balance: baseBalance,
        equity: baseEquity,
        floatingProfit: baseFloating,
        drawdown: baseDrawdown,
        deposit: baseDeposit,
        withdrawal: baseWithdrawal,
      });
    }
    setShareCardOpen(true);
  };

  // Handles pushing notification through API and local state trigger
  const triggerNotification = async (type: 'success' | 'danger', message: string) => {
    if (!currentUser) return;
    
    setGoalAlert({ type, message });

    if (showToast) {
      if (type === 'success') {
        showToast("🏆 Congratulation! Target Reached", 4500);
      } else {
        showToast("🚨 Alert: Daily DD Limit Reached", 4500);
      }
    }

    try {
      await apiFetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toUserId: currentUser.id,
          fromUserId: 'system',
          fromUserName: type === 'success' ? 'Milestone Cleared' : 'Drawdown Alert',
          fromUserAvatar: type === 'success' ? '🏆' : '⚠️',
          type: 'market_pulse',
          message
        })
      });
      fetchNotifications();
    } catch (e) {
      console.error("Failed to post system notification:", e);
    }
  };

  // Live P&L monitoring hook to trigger notification
  const notifiedThresholdRef = useRef<{success: boolean, danger: boolean}>({success: false, danger: false});

  useEffect(() => {
    if (dailyAchievedPL >= dailyTargetAmount && dailyTargetAmount > 0) {
      if (!notifiedThresholdRef.current.success) {
        triggerNotification('success', `Congratulations! You have achieved your daily target of $${dailyTargetAmount.toFixed(2)} today. Take a break and celebrate your consistency!`)
          .catch(err => console.error("Trigger notification failed", err));
        notifiedThresholdRef.current.success = true;
      }
    } else if (dailyAchievedPL <= -dailyRiskLimitAmount && dailyRiskLimitAmount > 0) {
      if (!notifiedThresholdRef.current.danger) {
        triggerNotification('danger', `Daily drawdown limit of $${dailyRiskLimitAmount.toFixed(2)} reached. We suggest stopping trading for today, stepping back, and reviewing your strategy next session.`)
          .catch(err => console.error("Trigger notification failed", err));
        notifiedThresholdRef.current.danger = true;
      }
    }
  }, [dailyAchievedPL, dailyTargetAmount, dailyRiskLimitAmount]);

  // Session drawdown > 5% notification detector
  const sessionDDNotifiedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (closedTrades.length === 0) return;
    const baseBal = currentBalanceValue || (totalDepositsAmount > 0 ? totalDepositsAmount : 0);

    // Group closed trades by Date + Session (Asian / London / New York)
    const sessionMap: { [key: string]: { sessionName: string, dateStr: string, totalLoss: number } } = {};

    closedTrades.forEach(t => {
      if (!t.closeTime) return;
      const d = new Date(t.closeTime);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const hour = d.getUTCHours();

      let sessionName = 'Asian Session';
      if (hour >= 8 && hour < 16) sessionName = 'London Session';
      else if (hour >= 16) sessionName = 'New York Session';

      const sessionKey = `${d.toISOString().split('T')[0]}_${sessionName}`;
      if (!sessionMap[sessionKey]) {
        sessionMap[sessionKey] = { sessionName, dateStr, totalLoss: 0 };
      }

      if (t.pl < 0) {
        sessionMap[sessionKey].totalLoss += Math.abs(t.pl);
      }
    });

    Object.entries(sessionMap).forEach(([key, data]) => {
      const ddPercent = (data.totalLoss / baseBal) * 100;
      if (ddPercent >= 5.0 && !sessionDDNotifiedRef.current.has(key)) {
        sessionDDNotifiedRef.current.add(key);

        const alertMsg = `🚨 DRAWDOWN ALERT: ${data.sessionName} (${data.dateStr}) drawdown exceeded 5.0%! (-${ddPercent.toFixed(1)}% / -$${data.totalLoss.toFixed(2)})`;

        if (showToast) {
          showToast(alertMsg, 5000);
        }

        triggerNotification(
          'danger',
          `🚨 DRAWDOWN ALERT: Single session drawdown in ${data.sessionName} (${data.dateStr}) reached -${ddPercent.toFixed(1)}% (-$${data.totalLoss.toFixed(2)}). Step back and review your trading plan.`
        ).catch(e => console.error("Failed sending session DD notification:", e));

        setGoalAlert({
          type: 'danger',
          message: `🚨 Critical Session Drawdown Alert (-${ddPercent.toFixed(1)}%): Your trading journal recorded a loss exceeding 5% in ${data.sessionName}. Step back and manage risk.`
        });
      }
    });
  }, [closedTrades, currentBalanceValue, showToast]);

  // Open transaction detail on monthly calendar day clicked
  const handleDayClick = (dayNum: number) => {
    const dayData = monthlyTradesData[dayNum];
    const netPL = dayData ? dayData.netPL : 0;
    const tradesCount = dayData ? dayData.total : 0;
    const wins = dayData ? dayData.wins : 0;
    const tickets = dayData ? dayData.tickets : [];

    const startBal = currentBalanceValue;
    const endBal = startBal + netPL;
    const pct = startBal > 0 ? (netPL / startBal) * 100 : 0;

    const clickedDate = new Date(activeYear, activeMonth, dayNum);
    const dateFormatted = clickedDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });

    const dayStart = new Date(activeYear, activeMonth, dayNum, 0, 0, 0, 0);
    const dayEnd = new Date(activeYear, activeMonth, dayNum, 23, 59, 59, 999);
    const dayDeposits = balanceDeals.filter(t => {
      const dt = parseUTCDate(t.closeTime || t.openTime || '');
      return dt >= dayStart && dt <= dayEnd && (t.pl || 0) > 0;
    }).reduce((acc, t) => acc + (t.pl || 0), 0);

    const detail: MockTradeDetail = {
      date: dateFormatted,
      netPL,
      netPLPercent: pct,
      startBalance: startBal,
      endBalance: endBal,
      deposit: dayDeposits,
      buysCount: Math.ceil(tradesCount / 2),
      sellsCount: Math.floor(tradesCount / 2),
      tradesCount,
      bestTrade: tickets.length > 0 ? Math.max(...tickets.map(t => t.pl)) : 0,
      worstTrade: tickets.length > 0 ? Math.min(...tickets.map(t => t.pl)) : 0,
      avgHoldTime: tradesCount > 0 ? "1.5 jam" : "0",
      maxDrawdown: netPL < 0 ? Math.abs(netPL) : 0,
      fees: tradesCount * -0.50,
      winrate: tradesCount > 0 ? (wins / tradesCount) * 100 : 0,
      profitFactor: netPL > 0 ? 1.5 : 0,
      expectancy: netPL,
      tickets
    };

    setModalTab('stats');
    setSelectedDayDetail(detail);
  };

  // Export transaction data as CSV
  const handleExportCSV = () => {
    if (!selectedDayDetail) return;
    
    // Construct CSV header and rows
    let csvContent = "\uFEFF"; // Byte Order Mark for Excel/UTF-8 compatibility
    csvContent += `Daily Trading Report for ${selectedDayDetail.date}\r\n`;
    csvContent += `Account Balance Start,Account Balance End,Net P&L,Net P&L %,Drawdown,Win Rate,Profit Factor,Expectancy\r\n`;
    csvContent += `"${selectedDayDetail.startBalance}","${selectedDayDetail.endBalance}","${selectedDayDetail.netPL}","${selectedDayDetail.netPLPercent.toFixed(2)}%","${selectedDayDetail.maxDrawdown}","${selectedDayDetail.winrate.toFixed(0)}%","${selectedDayDetail.profitFactor}","${selectedDayDetail.expectancy}"\r\n\r\n`;
    
    csvContent += `Ticket ID,Symbol,Transaction Type,Lots,Open Price,Close Price,P&L ($),Time\r\n`;
    
    if (selectedDayDetail.tickets && selectedDayDetail.tickets.length > 0) {
      selectedDayDetail.tickets.forEach(t => {
        csvContent += `"${t.id}","${t.symbol}","${t.type}","${t.lots}","${t.openPrice}","${t.closePrice}","${t.pl}","${t.time}"\r\n`;
      });
    } else {
      csvContent += `"N/A","N/A","N/A","N/A","N/A","N/A","N/A","N/A"\r\n`;
    }

    // Trigger secure file download using Blob for better browser compatibility inside iframe environments
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const dateFilename = selectedDayDetail.date.replace(/[^a-zA-Z0-9]/g, "_");
    link.setAttribute("download", `Tarapti_Report_${dateFilename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (showToast) {
      showToast("📥 Exported CSV Successfully", 3000);
    }
  };

  // Open real-time AI diagnosis modal backed by live MT5 data and AI GoTrading engine
  const triggerBentoAnalysis = async (type: string, customPrompt?: string) => {
    setIsAnalyzingAi(true);
    setActiveAnalysisPopup({
      title: customPrompt ? `Memproses Audit: "${customPrompt.slice(0, 30)}..."` : "Menghubungkan ke AI Diagnosis Engine...",
      content: "AI sedang membaca seluruh tiket order MetaTrader 5, mengaudit rasio reward-to-risk riil, mendeteksi kebocoran modal, dan menghitung statistik sesi...",
      recommendation: "Mohon tunggu sejenak sementara AI GoTrading menganalisis riwayat eksekusi langsung akun Anda.",
      confidence: 90,
      riskBias: "Memproses...",
      analysisType: type,
      isAiGenerated: true
    });

    try {
      const totalCount = closedTrades.length;
      const winsCount = closedTrades.filter(t => t.pl > 0).length;
      const lossesCount = closedTrades.filter(t => t.pl < 0).length;
      const grossProfit = closedTrades.filter(t => t.pl > 0).reduce((acc, t) => acc + t.pl, 0);
      const grossLoss = Math.abs(closedTrades.filter(t => t.pl < 0).reduce((acc, t) => acc + t.pl, 0));
      const winRate = totalCount > 0 ? (winsCount / totalCount) * 100 : overallWinRate;
      const lossRate = totalCount > 0 ? (lossesCount / totalCount) * 100 : (100 - overallWinRate);
      const netPL = closedTrades.reduce((acc, t) => acc + t.pl, 0);
      const avgWin = winsCount > 0 ? grossProfit / winsCount : 0;
      const avgLoss = lossesCount > 0 ? grossLoss / lossesCount : 0;
      const rewardToRisk = avgLoss > 0 ? avgWin / avgLoss : (avgWin > 0 ? 2.5 : 1.0);
      const bestTradeVal = totalCount > 0 ? Math.max(...closedTrades.map(t => t.pl)) : 0;
      const worstTradeVal = totalCount > 0 ? Math.min(...closedTrades.map(t => t.pl)) : 0;

      // Symbol performance breakdown
      const symbolMap: Record<string, { totalPL: number, wins: number, count: number }> = {};
      closedTrades.forEach(t => {
        const sym = t.symbol || 'XAUUSD';
        if (!symbolMap[sym]) symbolMap[sym] = { totalPL: 0, wins: 0, count: 0 };
        symbolMap[sym].totalPL += t.pl;
        symbolMap[sym].count += 1;
        if (t.pl > 0) symbolMap[sym].wins += 1;
      });

      const symbolList = Object.keys(symbolMap).map(sym => ({
        symbol: sym,
        ...symbolMap[sym],
        winRate: symbolMap[sym].count > 0 ? (symbolMap[sym].wins / symbolMap[sym].count) * 100 : 0
      }));

      // BUY vs SELL breakdown
      const buys = closedTrades.filter(t => (t.type || '').toUpperCase() === 'BUY');
      const sells = closedTrades.filter(t => (t.type || '').toUpperCase() === 'SELL');
      const buyPL = buys.reduce((a, b) => a + b.pl, 0);
      const sellPL = sells.reduce((a, b) => a + b.pl, 0);
      const buyWinRate = buys.length > 0 ? (buys.filter(t => t.pl > 0).length / buys.length) * 100 : 0;
      const sellWinRate = sells.length > 0 ? (sells.filter(t => t.pl > 0).length / sells.length) * 100 : 0;

      // Session breakdown (Asian 00-08 UTC, London 08-16 UTC, NY 16-24 UTC)
      const sessionStats = {
        Asian: { pl: 0, wins: 0, total: 0 },
        London: { pl: 0, wins: 0, total: 0 },
        NewYork: { pl: 0, wins: 0, total: 0 }
      };

      closedTrades.forEach(t => {
        if (t.closeTime) {
          const hour = new Date(t.closeTime).getUTCHours();
          let sess: 'Asian' | 'London' | 'NewYork' = 'Asian';
          if (hour >= 8 && hour < 16) sess = 'London';
          else if (hour >= 16) sess = 'NewYork';
          sessionStats[sess].total += 1;
          sessionStats[sess].pl += t.pl;
          if (t.pl > 0) sessionStats[sess].wins += 1;
        }
      });

      const sessionsArray = (Object.keys(sessionStats) as Array<keyof typeof sessionStats>).map(name => {
        const s = sessionStats[name];
        return {
          session: name,
          totalPL: s.pl,
          count: s.total,
          winRate: s.total > 0 ? (s.wins / s.total) * 100 : 0
        };
      });

      // Algo Trades calculation
      const algoTradesCount = closedTrades.filter(t => 
        (t.magicNumber && Number(t.magicNumber) > 0) || 
        (t.comment && (t.comment.toLowerCase().includes('ea') || t.comment.toLowerCase().includes('bot') || t.comment.toLowerCase().includes('algo') || t.comment.toLowerCase().includes('expert')))
      ).length;
      const algoTradesPercent = totalCount > 0 ? (algoTradesCount / totalCount) * 100 : 0;

      // Drawdown calculation
      const sortedTrades = [...closedTrades].sort((a, b) => new Date(a.closeTime).getTime() - new Date(b.closeTime).getTime());
      let runningEquity = activeAccountInfo?.balance ?? (currentBalanceValue > 0 ? currentBalanceValue : (totalDepositsAmount > 0 ? totalDepositsAmount : 0));
      let peakEquity = runningEquity;
      let maxDD = 0;
      sortedTrades.forEach(t => {
        runningEquity += (t.pl || 0);
        if (runningEquity > peakEquity) peakEquity = runningEquity;
        const dd = peakEquity - runningEquity;
        if (dd > maxDD) maxDD = dd;
      });

      const currentBalance = activeAccountInfo?.balance ?? (currentBalanceValue > 0 ? currentBalanceValue : 0);
      const equity = activeAccountInfo?.equity ?? (currentBalance > 0 ? currentBalance + netPL : 0);

      const payload = {
        analysisType: type,
        customPrompt: customPrompt || undefined,
        tradeMetrics: {
          accountInfo: {
            broker: activeAccountInfo?.broker || (connectedBroker as any)?.name || 'MetaTrader 5',
            server: activeAccountInfo?.server || (connectedBroker as any)?.server || 'MetaTrader-Live',
            login: activeAccountInfo?.login || (connectedBroker as any)?.login || '',
            balance: currentBalance,
            equity: equity,
            margin: activeAccountInfo?.margin || 0,
            marginFree: activeAccountInfo?.marginFree || equity,
            leverage: activeAccountInfo?.leverage || (connectedBroker as any)?.leverage || 100
          },
          stats: {
            totalTrades: totalCount,
            winTrades: winsCount,
            lossTrades: lossesCount,
            winRate,
            lossRate,
            netProfit: netPL,
            grossProfit,
            grossLoss,
            profitFactor: overallProfitFactor,
            maxDrawdown: maxDD,
            rewardToRisk,
            avgWin,
            avgLoss,
            bestTrade: bestTradeVal,
            worstTrade: worstTradeVal,
            algoTradesPercent,
            totalVolumeLots: totalVolumeLots
          },
          symbolBreakdown: symbolList,
          orderTypeBreakdown: {
            buys: { count: buys.length, winRate: buyWinRate, totalPL: buyPL },
            sells: { count: sells.length, winRate: sellWinRate, totalPL: sellPL }
          },
          sessionBreakdown: sessionsArray,
          recentTickets: closedTrades.slice(0, 20).map((t, idx) => ({
            ticket: t.ticket || t.id || `#${idx + 1001}`,
            symbol: t.symbol || 'XAUUSD',
            type: t.type || 'BUY',
            volume: t.lots || 0.1,
            openPrice: t.openPrice || 0,
            closePrice: t.closePrice || 0,
            pl: t.pl || 0,
            closeTime: t.closeTime || ''
          }))
        }
      };

      const res = await apiFetch('/api/ai/journal-diagnosis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const resData = await res.json();
        if (resData.diagnosis) {
          setActiveAnalysisPopup({
            ...resData.diagnosis,
            isAiGenerated: resData.realtimeAi ?? true,
            analysisType: type
          });
          return;
        }
      }
    } catch (err) {
      console.error("AI analysis request error:", err);
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  const renderCalendar = () => (
    <div className="space-y-3">
      {/* Aggregated indicators bar */}
      <div className="bg-white dark:bg-[#1B2132]/60 border border-slate-200 dark:border-gray-800/80 rounded-xl py-2 px-3 flex items-center justify-between text-center divide-x divide-slate-200 dark:divide-gray-800">
        <div className="flex-1 text-center">
          <p className="text-[9px] text-slate-400 dark:text-gray-500 uppercase font-bold font-roboto">{t('journal.trades')}</p>
          <p className="text-[12px] font-black text-slate-900 dark:text-white font-roboto">{totalMonthlyTrades}</p>
        </div>
        <div className="flex-1 text-center">
          <p className="text-[9px] text-slate-400 dark:text-gray-500 uppercase font-bold font-roboto">{t('journal.wins')}</p>
          <p className="text-[12px] font-black text-emerald-500 dark:text-emerald-400 font-roboto">{totalMonthlyWins}</p>
        </div>
        <div className="flex-1 text-center">
          <p className="text-[9px] text-slate-400 dark:text-gray-500 uppercase font-bold font-roboto">{t('journal.profits')}</p>
          <p className={`text-[12px] font-black font-roboto ${totalMonthlyPL >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
            ${totalMonthlyPL.toFixed(2)}
          </p>
        </div>
        <div className="flex-1 text-center">
          <p className="text-[9px] text-slate-400 dark:text-gray-500 uppercase font-bold font-roboto">{t('journal.percent')}</p>
          <p className={`text-[12px] font-black font-roboto ${totalMonthlyPL >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
            {totalMonthlyPL >= 0 ? '+' : ''}{monthlyPLPercent.toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Days Of Week Headers */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <span key={d} className="text-[8px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest">{d}</span>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: (new Date(activeYear, activeMonth, 1).getDay() + 6) % 7 }).map((_, idx) => (
          <div key={`padding-${idx}`} className="h-10 bg-transparent" />
        ))}
        {Array.from({ length: new Date(activeYear, activeMonth + 1, 0).getDate() }).map((_, idx) => {
          const dayNum = idx + 1;
          const isToday = dayNum === new Date().getDate() && activeMonth === new Date().getMonth() && activeYear === new Date().getFullYear();
          
          let dayPL = 0;
          let dayTrades = 0;
          
          if (monthlyTradesData[dayNum]) {
            dayPL = monthlyTradesData[dayNum].netPL;
            dayTrades = monthlyTradesData[dayNum].total;
          } else if (isToday) {
            dayPL = todayPLValue;
            dayTrades = todayPLValue !== 0 ? 1 : 0;
          }

          return (
            <motion.button
              key={dayNum}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              onClick={() => handleDayClick(dayNum)}
              className={`h-10 rounded-xl border flex flex-col items-center justify-between p-1 select-none cursor-pointer transition-all ${
                isToday 
                  ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-600/20 dark:border-indigo-500/70 hover:bg-indigo-100 dark:hover:bg-indigo-600/30' 
                  : dayPL > 0 
                    ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-500/[0.04] dark:border-emerald-500/10 hover:border-emerald-300 dark:hover:border-emerald-500/30' 
                    : dayPL < 0 
                      ? 'bg-rose-50 border-rose-100 dark:bg-rose-500/[0.04] dark:border-rose-500/10 hover:border-rose-300 dark:hover:border-rose-500/30' 
                      : 'bg-slate-50 border-slate-200 dark:bg-[#181D28]/35 dark:border-gray-800/50 hover:border-slate-300 dark:hover:border-gray-700'
              }`}
            >
              <span className={`text-[9px] font-bold font-roboto ${isToday ? 'text-indigo-600 dark:text-indigo-400 font-black scale-110' : 'text-slate-400 dark:text-gray-500'}`}>
                {dayNum}
              </span>
              
              {dayTrades > 0 ? (
                <span className={`text-[8.5px] font-black font-roboto leading-none tracking-tighter ${
                  dayPL > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {dayPL > 0 ? '+' : ''}{dayPL.toFixed(0)}
                </span>
              ) : (
                <span className="text-[8.5px] font-bold text-slate-300 dark:text-gray-700 font-roboto">-</span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );

  const renderConnectedAccountsCard = () => {
    return (
      <div className="bg-white dark:bg-[#121620] border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-2.5 shadow-2xs space-y-2 relative">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-850">
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <Database size={12} className="text-indigo-500 shrink-0" />
            <h3 className="text-[10px] font-black uppercase tracking-wider font-roboto">
              {t('journal.connectedAccounts')}
            </h3>
          </div>
          {connectedAccounts && connectedAccounts.length > 0 && (
            <span className="text-[8px] bg-indigo-50/80 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100/60 dark:border-indigo-900/40 px-1 rounded font-extrabold font-roboto uppercase">
              {connectedAccounts.length} {connectedAccounts.length === 1 ? t('journal.accountSuffix') : t('journal.accountsSuffix')}
            </span>
          )}
        </div>

        {connectedAccounts && connectedAccounts.length > 0 ? (
          <div className="space-y-1 max-h-[200px] overflow-y-auto no-scrollbar">
            {connectedAccounts.map((acc: any) => {
              const isSelected = String(activeAccountLogin || activeAccount?.login || activeAccountInfo?.login) === String(acc.login);
              return (
                <button
                  key={acc.id || acc.login}
                  onClick={() => {
                    console.log('[JOURNAL-ACCOUNT-SWITCH]', { from: activeAccountLogin || activeAccountInfo?.login, to: acc.login });
                    setActiveAccountLogin(String(acc.login));
                  }}
                  className={`w-full p-1.5 rounded-lg border text-left transition duration-150 flex items-center justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-50/30 border-indigo-200/80 dark:bg-indigo-950/10 dark:border-indigo-800/40'
                      : 'bg-slate-50/20 border-slate-200/50 dark:bg-slate-850/30 hover:bg-slate-50/60 dark:hover:bg-slate-800/20 hover:border-slate-300/80 dark:hover:border-slate-750'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="relative shrink-0 flex items-center">
                      <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-600'}`} />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 block truncate leading-tight font-roboto">
                        {acc.broker || 'MetaTrader 5'}
                      </span>
                      <span className="text-[8px] text-slate-400 dark:text-slate-500 font-mono block leading-none mt-0.5">
                        ID: {acc.login}
                      </span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <span className="text-[9.5px] font-bold text-slate-600 dark:text-slate-400 block truncate max-w-[110px] uppercase tracking-tight">
                      {acc.server || 'MetaTrader-Live'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="py-4 px-2 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg bg-slate-50/50 dark:bg-slate-800/5">
            <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500">{t('journal.noConnectedAccount')}</p>
            <button
              onClick={() => setActiveView('account')}
              className="mt-1.5 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-[8.5px] font-black uppercase tracking-wider transition-all shadow-xs mx-auto cursor-pointer"
            >
              {t('journal.connectAccountButton')}
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="py-2 w-full max-w-none relative">
      <div className="w-full animate-in fade-in duration-300">

      {/* ACCOUNT SELECTOR DROPDOWN (IF MULTIPLE ACCOUNTS CONNECTED) */}
      {connectedAccounts && connectedAccounts.length > 1 && (
        <div className="relative mb-4 w-full" ref={dropdownRef}>
          <div className="flex items-center justify-between bg-white dark:bg-[#121620] border border-slate-200 dark:border-slate-800 rounded-[20px] px-4 py-3 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shrink-0">
                <Database size={16} />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 dark:text-gray-500 uppercase font-black tracking-wider block font-roboto leading-none mb-1">
                  {t('journal.selectActiveAccount')}
                </span>
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 truncate block font-roboto">
                  {activeAccountInfo ? `${activeAccountInfo.broker || 'MetaTrader 5'} (${activeAccountInfo.login})` : (activeAccount ? `${activeAccount.broker} (${activeAccount.login})` : t('journal.selectAccount'))}
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsAccountDropdownOpen(prev => !prev)}
              className="px-3 py-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition duration-200 cursor-pointer"
            >
              <span>{t('journal.changeAccount')}</span>
              <ChevronDown size={14} className={`transform transition-transform duration-200 ${isAccountDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>

          <AnimatePresence>
            {isAccountDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-[#121620] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800/80"
              >
                {connectedAccounts.map((acc: any) => {
                  const isSelected = String(activeAccountLogin || activeAccount?.login || activeAccountInfo?.login) === String(acc.login);
                  return (
                    <button
                      key={acc.id || acc.login}
                      onClick={() => {
                        console.log('[JOURNAL-ACCOUNT-SWITCH]', { from: activeAccountLogin || activeAccountInfo?.login, to: acc.login });
                        setActiveAccountLogin(String(acc.login));
                        setIsAccountDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/60 transition cursor-pointer ${
                        isSelected ? 'bg-indigo-50/40 dark:bg-indigo-950/20' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${isSelected ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                        <div>
                          <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 font-roboto">
                            <span>{acc.broker || 'MetaTrader 5'}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({acc.login})</span>
                          </div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-roboto">
                            Platform: {acc.platform || 'MT5'} • Server: {acc.server || acc.broker}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black font-mono text-slate-800 dark:text-white">
                          ${Number(acc.equity || acc.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        {isSelected && <Check size={14} className="text-indigo-600 dark:text-indigo-400 shrink-0" />}
                      </div>
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* MOBILE CONNECTED ACCOUNTS CARD (ONLY VISIBLE ON MOBILE) */}
      <div className="block lg:hidden mb-4">
        {renderConnectedAccountsCard()}
      </div>

      {/* HERO CARD (DYNAMIC: CURRENT MISSION OR LEDGER REPORT) */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/90 dark:to-[#121620] rounded-[24px] p-4 sm:p-5 shadow-md shadow-slate-200/40 dark:shadow-black/30 text-slate-800 dark:text-slate-100 relative overflow-hidden mt-1 mb-4 border border-slate-200 dark:border-slate-800">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-50/50 dark:bg-blue-900/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />
        
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${activeTab === 'goals' ? (totalPnLAllTimePercent >= 0 ? 'bg-emerald-400' : 'bg-rose-400') : activeTab === 'ledger' ? 'bg-amber-400' : 'bg-indigo-400'}`} />
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400 font-roboto">
                {activeTab === 'goals' ? t('journal.portfolioPerformance') : activeTab === 'ledger' ? t('common.journal.ledgerReport') : t('journal.executionHistoryTitle')}
              </span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {activeAccountInfo && (
                <>
                  {activeAccountInfo.conn_status === 'error' ? (
                    <span className="px-2 py-0.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-full text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      Sync Error
                    </span>
                  ) : activeAccountInfo.conn_status === 'reconnecting' ? (
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Reconnecting
                    </span>
                  ) : isDataStale ? (
                    <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Data Stale
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Connected
                    </span>
                  )}
                </>
              )}
              <div className="px-2.5 py-1 bg-white/90 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-full text-[8.5px] font-black text-slate-600 dark:text-slate-300 shadow-xs backdrop-blur-md font-roboto tracking-[0.08em] uppercase flex items-center gap-1">
                {activeAccountInfo?.login ? `${activeAccountInfo.broker || 'MT5'} (${activeAccountInfo.login})` : (activeAccountInfo?.server || 'MetaTrader 5 Sync')}
              </div>
            </div>
          </div>
          
          <div className="space-y-0.5">
            <div className="flex items-baseline gap-2.5 flex-wrap">
              <h2 className={`text-[28px] sm:text-[32px] font-black tracking-tighter leading-none font-roboto ${
                totalPnLAllTimePercent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                {totalPnLAllTimePercent >= 0 ? '+' : ''}{totalPnLAllTimePercent.toFixed(2)}%
              </h2>
              <span className={`text-xs sm:text-sm font-bold font-roboto px-2 py-0.5 rounded-lg border ${
                totalPnLAllTime >= 0 
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60'
              }`}>
                {totalPnLAllTime >= 0 ? '+' : '-'}${Math.abs(totalPnLAllTime).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Total P&L
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-medium tracking-wide">
              <span>{t("journal.deposit")}: ${totalDepositsAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
              <span>{t("journal.withdrawal")}: ${totalWithdrawalsAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
              <span>{totalTradesCount} {t("journal.closedTrades")}</span>
            </div>
          </div>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent my-0.5" />

          {/* 4-METRIC GRID (BALANCE, EQUITY, FLOATING PROFIT, DRAWDOWN ALL TIME) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
            {/* 1. Balance */}
            <div className="space-y-0.5 bg-white/70 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-200/70 dark:border-slate-800">
              <span className="text-[8.5px] uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 font-bold block font-roboto truncate">
                {t("journal.balance")}
              </span>
              <span className={`text-base sm:text-lg font-black block leading-none font-roboto ${
                currentEffectiveBalance < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
              }`}>
                {currentEffectiveBalance < 0 ? '-' : ''}${Math.abs(currentEffectiveBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[8.5px] text-slate-400 dark:text-slate-500 block truncate font-medium">
                {t("journal.effectiveBalance")}
              </span>
            </div>

            {/* 2. Equity */}
            <div className="space-y-0.5 bg-white/70 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-200/70 dark:border-slate-800">
              <span className="text-[8.5px] uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 font-bold block font-roboto truncate">
                {t("journal.equity")}
              </span>
              {(() => {
                const currentEquity = activeAccountInfo?.equity ?? (currentEffectiveBalance + floatingProfitUSD);
                return (
                  <span className={`text-base sm:text-lg font-black block leading-none font-roboto ${
                    currentEquity < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-indigo-600 dark:text-indigo-400'
                  }`}>
                    {currentEquity < 0 ? '-' : ''}${Math.abs(currentEquity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                );
              })()}
              <span className="text-[8.5px] text-slate-400 dark:text-slate-500 block truncate font-medium">
                {t("journal.floatingAdjustedEquity")}
              </span>
            </div>

            {/* 3. Floating Profits in amount $ */}
            <div className="space-y-0.5 bg-white/70 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-200/70 dark:border-slate-800">
              <span className="text-[8.5px] uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 font-bold block font-roboto truncate">
                {t("journal.floatingProfit")}
              </span>
              <span className={`text-base sm:text-lg font-black block leading-none font-roboto ${
                floatingProfitUSD < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {floatingProfitUSD < 0 ? '-' : '+'}${Math.abs(floatingProfitUSD).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span className="text-[8.5px] text-slate-400 dark:text-slate-500 block truncate font-medium">
                {openTrades.length} {openTrades.length !== 1 ? t("journal.openPositions") : t("journal.openPosition")}
              </span>
            </div>

            {/* 4. Drawdown All the time in % */}
            <div className="space-y-0.5 bg-white/70 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-200/70 dark:border-slate-800">
              <span className="text-[8.5px] uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400 font-bold block font-roboto truncate">
                {t("journal.drawdown")}
              </span>
              <span className="text-base sm:text-lg font-black block leading-none font-roboto text-rose-500 dark:text-rose-400">
                {maxDrawdownAllTimePercent.toFixed(1)}%
              </span>
              <span className="text-[8.5px] text-slate-400 dark:text-slate-500 block truncate font-medium">
                {t("journal.peakToValley")}
              </span>
            </div>
          </div>

          {activeAccountInfo?.conn_status === 'error' && activeAccountInfo.error_message && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-[10px] text-rose-600 dark:text-rose-400 flex items-start gap-2 mt-2">
              <AlertCircle size={14} className="shrink-0 mt-0.5 text-rose-500" />
              <div>
                <p className="font-black uppercase tracking-wide text-[9px] block mb-0.5 text-rose-500">{t("journal.syncFailed")}</p>
                <p className="text-[11px] leading-relaxed font-medium text-rose-600 dark:text-rose-400">{activeAccountInfo.error_message}</p>
                <button 
                  onClick={() => setActiveView('account')} 
                  className="px-2 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-[9px] font-black uppercase tracking-wide transition mt-1.5 cursor-pointer"
                >
                  {t("journal.reconnectAccount")}
                </button>
              </div>
            </div>
          )}

          {isDataStale && activeAccountInfo?.conn_status !== 'error' && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-[10px] text-amber-600 dark:text-amber-400 flex items-start gap-2 mt-2">
              <AlertCircle size={14} className="shrink-0 mt-0.5 text-amber-500" />
              <div>
                <p className="font-black uppercase tracking-wide text-[9px] block mb-0.5 text-amber-500">{t("journal.dataStaleTitle")}</p>
                <p className="text-[11px] leading-relaxed font-medium text-amber-600 dark:text-amber-400">
                  {activeAccountInfo.fetched_at 
                    ? t("journal.dataStaleDesc", { minutes: Math.round((Date.now() - new Date(activeAccountInfo.fetched_at).getTime()) / 60000) })
                    : t("journal.dataStaleDescSomeTimeAgo")}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={() => openShareCard()}
            className="w-full mt-2 py-2 px-3 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all active:scale-[0.98] group cursor-pointer"
          >
            <Share2 size={13} className="group-hover:rotate-12 transition-transform" />
            {t("journal.generateShareCard")}
          </button>
        </div>
      </div>
      
      {/* 3 COMPACT CARDS SIDE-BY-SIDE (3 COLUMNS) WITHOUT GLASS EFFECT */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mt-3 mb-5">
        
        {/* CARD 1: MISSION GOAL PLAN */}
        <div
          onClick={() => setActiveTab('goals')}
          className={`group relative overflow-hidden rounded-2xl p-2.5 sm:p-3 transition-all duration-300 cursor-pointer select-none flex flex-col justify-between border ${
            activeTab === 'goals'
              ? 'bg-indigo-600 border-indigo-400 text-white shadow-[inset_0_2px_6px_rgba(255,255,255,0.3),0_6px_12px_rgba(0,0,0,0.3)] scale-[1.02] ring-2 ring-white/30 z-10'
              : 'bg-indigo-600/90 border-indigo-500 text-indigo-50 hover:bg-indigo-600 shadow-sm opacity-85 hover:opacity-100'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1 min-w-0">
                <Trophy size={13} className='text-indigo-200 shrink-0' />
                <span className='text-[10px] sm:text-[11px] font-black truncate text-white'>{t("journal.portfolio")}</span>
              </div>
              {activeTab === 'goals' && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" title="Active" />
              )}
            </div>

            <p className='text-[9px] sm:text-[10px] leading-tight font-medium line-clamp-2 text-indigo-100'>
              {t("journal.portfolioDesc")}
            </p>
          </div>

          <div className='pt-1.5 flex items-center justify-between text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider text-indigo-200'>
            <span>{t("journal.goal")}</span>
            <span className="font-black">→</span>
          </div>
        </div>

        {/* CARD 2: JOURNAL LEDGER */}
        <div
          onClick={() => setActiveTab('ledger')}
          className={`group relative overflow-hidden rounded-2xl p-2.5 sm:p-3 transition-all duration-300 cursor-pointer select-none flex flex-col justify-between border ${
            activeTab === 'ledger'
              ? 'bg-violet-600 border-violet-400 text-white shadow-[inset_0_2px_6px_rgba(255,255,255,0.3),0_6px_12px_rgba(0,0,0,0.3)] scale-[1.02] ring-2 ring-white/30 z-10'
              : 'bg-violet-600/90 border-violet-500 text-violet-50 hover:bg-violet-600 shadow-sm opacity-85 hover:opacity-100'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1 min-w-0">
                <BookText size={13} className='text-violet-200 shrink-0' />
                <span className='text-[10px] sm:text-[11px] font-black truncate text-white'>{t('common.journal.ledger')}</span>
              </div>
              {activeTab === 'ledger' && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" title="Active" />
              )}
            </div>

            <p className='text-[9px] sm:text-[10px] leading-tight font-medium line-clamp-2 text-violet-100'>
              {t("journal.ledgerDesc")}
            </p>
          </div>

          <div className='pt-1.5 flex items-center justify-between text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider text-violet-200'>
            <span>{t('common.journal.ledger')}</span>
            <span className="font-black">→</span>
          </div>
        </div>


        {/* CARD 4: RISK ENGINE */}
        <div
          onClick={() => setActiveTab('risk')}
          className={`group relative overflow-hidden rounded-2xl p-2.5 sm:p-3 transition-all duration-300 cursor-pointer select-none flex flex-col justify-between border ${
            activeTab === 'risk'
              ? 'bg-rose-600 border-rose-400 text-white shadow-[inset_0_2px_6px_rgba(255,255,255,0.3),0_6px_12px_rgba(0,0,0,0.3)] scale-[1.02] ring-2 ring-white/30 z-10'
              : 'bg-rose-600/90 border-rose-500 text-rose-50 hover:bg-rose-600 shadow-sm opacity-85 hover:opacity-100'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1 min-w-0">
                <AlertTriangle size={13} className='text-rose-200 shrink-0' />
                <span className='text-[10px] sm:text-[11px] font-black truncate text-white'>RISK ENGINE</span>
              </div>
              {activeTab === 'risk' && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" title="Active" />
              )}
            </div>

            <p className='text-[9px] sm:text-[10px] leading-tight font-medium line-clamp-2 text-rose-100'>
              Live drawdown and protection.
            </p>
          </div>
        </div>

        {/* CARD 3: AI ANALYSIS */}
        <div
          onClick={() => setActiveTab('history')}
          className={`group relative overflow-hidden rounded-2xl p-2.5 sm:p-3 transition-all duration-300 cursor-pointer select-none flex flex-col justify-between border ${
            activeTab === 'history'
              ? 'bg-purple-600 border-purple-400 text-white shadow-[inset_0_2px_6px_rgba(255,255,255,0.3),0_6px_12px_rgba(0,0,0,0.3)] scale-[1.02] ring-2 ring-white/30 z-10'
              : 'bg-purple-600/90 border-purple-500 text-purple-50 hover:bg-purple-600 shadow-sm opacity-85 hover:opacity-100'
          }`}
        >
          <div className="space-y-1">
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1 min-w-0">
                <BrainCircuit size={13} className='text-purple-200 shrink-0' />
                <span className='text-[10px] sm:text-[11px] font-black truncate text-white'>{t("journal.aiAnalysis")}</span>
              </div>
              {activeTab === 'history' && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" title="Active" />
              )}
            </div>

            <p className='text-[9px] sm:text-[10px] leading-tight font-medium line-clamp-2 text-purple-100'>
              {t("journal.aiAnalysisDesc")}
            </p>
          </div>

          <div className='pt-1.5 flex items-center justify-between text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider text-purple-200'>
            <span>{t("journal.aiAnalysis")}</span>
            <span className="font-black">→</span>
          </div>
        </div>

      </div>

      <div className="relative w-full">
        <div className="lg:grid lg:grid-cols-12 lg:gap-6 items-start space-y-4 lg:space-y-0 transition-all duration-300">
          
          {/* Main Content Column (Left Column on Desktop) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            {/* TAB 1: PORTOFOLIO */}
      {/* TAB 1: PORTFOLIO (MQL5 MODEL) */}
      {activeTab === 'goals' && (() => {
        // Real Calculations from BE fields & closedTrades
        const profit = typeof activeAccountInfo?.total_pnl === 'number'
          ? activeAccountInfo.total_pnl
          : (typeof activeAccountInfo?.totalPnl === 'number' ? activeAccountInfo.totalPnl : (typeof activeAccountInfo?.totalPnL === 'number' ? activeAccountInfo.totalPnL : totalPnLAllTime));
        
        const performancePct = typeof activeAccountInfo?.performance_pct === 'number'
          ? activeAccountInfo.performance_pct
          : (typeof activeAccountInfo?.performancePct === 'number' ? activeAccountInfo.performancePct : totalPnLAllTimePercent);

        const winTrades = closedTrades.filter(t => t.pl > 0).length;
        const lossTrades = closedTrades.filter(t => t.pl < 0).length;
        const totalTrades = closedTrades.length;
        const winRate = totalTrades > 0 ? (winTrades / totalTrades) * 100 : 0;
        const lossRate = totalTrades > 0 ? (lossTrades / totalTrades) * 100 : 0;
        
        const currentBalance = activeAccountInfo?.balance ?? (currentBalanceValue > 0 ? currentBalanceValue : ((connectedBroker as any)?.balance ?? 0));
        const equity = activeAccountInfo?.equity ?? (currentBalance > 0 ? currentBalance + (activeAccountInfo?.total_pnl ?? profit) : 0);
        const margin = activeAccountInfo?.margin || 0;
        
        const depositLoad = equity > 0 && margin > 0 ? Math.min(100, (margin / equity) * 100) : 0;
        
        const initialDeposit = initialDepositAmount;
        const additionalDeposits = additionalDepositsAmount;
        const totalDeposits = totalDepositsAmount;
        const withdrawals = totalWithdrawalsAmount;
        
        // Algo trading calculation based on magicNumber or expert EA comments
        const algoTradesCount = closedTrades.filter(t => 
          (t.magicNumber && t.magicNumber > 0) || 
          (t.comment && /(ea|expert|algo|bot|robot)/i.test(t.comment))
        ).length;
        const algoTrading = totalTrades > 0 ? (algoTradesCount / totalTrades) * 100 : 0;
        
        // Real Peak-to-Valley Max Drawdown using BE drawdown_pct or computed all-time max DD
        const maxDrawdown = typeof activeAccountInfo?.drawdown_pct === 'number'
          ? activeAccountInfo.drawdown_pct
          : (typeof activeAccountInfo?.drawdownPct === 'number' 
             ? activeAccountInfo.drawdownPct 
             : (typeof activeAccountInfo?.max_drawdown === 'number' ? activeAccountInfo.max_drawdown : maxDrawdownAllTimePercent));
        
        // Real Trading Activity based on unique trading days
        const uniqueTradingDays = new Set(closedTrades.map(t => new Date(t.closeTime).toDateString())).size;
        const tradingActivity = totalTrades > 0 ? Math.min(100, (uniqueTradingDays / 30) * 100) : 0;
        
        const brokerServer = activeAccountInfo?.server || connectedBroker?.server || 'MetaTrader-Live';
        const leverage = activeAccountInfo?.leverage || (connectedBroker as any)?.leverage || 100;

        const displayProfit = profit;
        const displayEquity = equity;
        const displayInitialDeposit = initialDeposit;
        const displayWithdrawals = withdrawals;
        const displayDeposits = additionalDeposits;

        // Scale bar widths proportionally based on the max amount
        const maxBarValue = Math.max(
          Math.abs(displayProfit),
          Math.abs(displayEquity),
          Math.abs(displayWithdrawals),
          Math.abs(displayInitialDeposit),
          Math.abs(displayDeposits),
          100
        );

        const formatUSD = (num: number) => {
          const isNegative = num < 0;
          const parts = Math.abs(num).toFixed(2).split('.');
          const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
          return `${isNegative ? '-' : ''}${intPart}.${parts[1]} USD`;
        };

        const radarData = [
          { axis: 'top', label: `Algo trading: ${algoTrading.toFixed(0)}%`, val: algoTrading },
          { axis: 'topRight', label: `{t("journal.profitTrades")}:\n${winRate.toFixed(1)}%`, val: winRate },
          { axis: 'bottomRight', label: `Loss Trades: ${lossRate.toFixed(1)}%`, val: lossRate },
          { axis: 'bottom', label: `Trading activity: ${tradingActivity.toFixed(1)}%`, val: tradingActivity },
          { axis: 'bottomLeft', label: `{t("journal.maxDepositLoad")}:\n${depositLoad.toFixed(0)}%`, val: depositLoad },
          { axis: 'topLeft', label: `Maximum\ndrawdown: ${maxDrawdown.toFixed(1)}%`, val: maxDrawdown },
        ];

        // --- GOTRADING VERDICT CALCULATION ---
        let verdictHeadline = 'Not enough data yet.';
        let verdictDesc = 'Continue trading to generate enough data for a meaningful account assessment.';
        let verdictStatus: 'healthy' | 'warning' | 'risk' | 'neutral' = 'neutral';

        const hasAccountData = totalTrades > 0 || (typeof activeAccountInfo?.total_pnl === 'number' && activeAccountInfo.total_pnl !== 0) || totalDeposits > 0 || (typeof activeAccountInfo?.performance_pct === 'number' && activeAccountInfo.performance_pct !== 0);

        if (hasAccountData) {
          // 1. Critical Capital Depletion / Margin Call Risk / Severe Loss (performance <= -70% or DD >= 70% or blown equity)
          if (
            performancePct <= -70 || 
            maxDrawdown >= 70 || 
            (equity <= 0 && totalDeposits > 0) || 
            (totalDeposits > 0 && equity < totalDeposits * 0.15 && (profit < 0 || performancePct < -50))
          ) {
            verdictHeadline = 'Critical Loss / Margin Call Risk';
            verdictDesc = 'Your account has suffered severe capital depletion. Stop trading immediately, review risk management, and avoid high-leverage positions.';
            verdictStatus = 'risk';
          } 
          // 2. High Risk / Significant Pressure (-25% to -70% or Drawdown >= 35%)
          else if (
            performancePct <= -25 || 
            maxDrawdown >= 35 || 
            (profit < 0 && maxDrawdown >= 20) ||
            (performancePct < 0 && maxDrawdown >= 20)
          ) {
            verdictHeadline = 'High Risk / Account under significant pressure.';
            verdictDesc = 'Your account is currently under pressure, with drawdown increasing and performance showing negative expectancy. Immediate risk reduction required.';
            verdictStatus = 'risk';
          } 
          // 3. Performance Needs Improvement (Negative P&L, but moderate DD)
          else if (profit < 0 || performancePct < 0) {
            if (maxDrawdown <= 15) {
              verdictHeadline = 'Performance needs improvement.';
              verdictDesc = 'Trading performance is currently negative, but risk and drawdown remain relatively controlled.';
              verdictStatus = 'warning';
            } else {
              verdictHeadline = 'Account is under pressure.';
              verdictDesc = 'Drawdown is elevated with negative expectancy. Refine trade execution and tighten stop loss limits.';
              verdictStatus = 'risk';
            }
          } 
          // 4. Profitable with High Risk / Elevated Drawdown (DD > 20%)
          else if (profit > 0 || performancePct > 0) {
            if (maxDrawdown > 20) {
              verdictHeadline = 'Profitable, but high risk.';
              verdictDesc = 'Your account is profitable overall, but elevated drawdown indicates high risk exposure. Tighten risk parameters.';
              verdictStatus = 'warning';
            } else if (maxDrawdown > 8) {
              verdictHeadline = 'Profitable, but inconsistent.';
              verdictDesc = 'Your account is profitable, but trading consistency can be improved to minimize drawdown phases.';
              verdictStatus = 'warning';
            } else {
              // 5. Profitable and well controlled (Healthy: profit > 0 and DD <= 8%)
              verdictHeadline = 'Profitable and well controlled.';
              verdictDesc = 'Performance remains positive, while drawdown and position sizing are currently well controlled.';
              verdictStatus = 'healthy';
            }
          } 
          // 6. Flat / Breakeven
          else {
            verdictHeadline = 'Performance is break-even.';
            verdictDesc = 'Your account performance is currently flat. Continue monitoring risk-reward ratios on upcoming trades.';
            verdictStatus = 'neutral';
          }
        }

        return (
        <div 
          tabIndex={-1}
          className="bg-white dark:bg-[#121620] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs pb-6 pt-1 select-none outline-none focus:outline-none ring-0"
          style={{ outline: 'none', WebkitTapHighlightColor: 'transparent' }}
        >
          
          {/* MQL5 Header: Server Name & Leverage */}
          <div className="flex justify-between items-center px-4 sm:px-6 py-3.5 border-b border-slate-100 dark:border-slate-800/80">
            <h2 className="text-[16px] sm:text-[17px] font-bold text-[#205486] dark:text-sky-400 tracking-tight font-sans truncate pr-2">
              {brokerServer}
            </h2>
            <span className="text-[16px] sm:text-[17px] font-bold text-slate-900 dark:text-white font-sans tracking-tight shrink-0">
              1:{leverage}
            </span>
          </div>

          {/* Warning Message Row - Only display if max drawdown is genuinely high (>= 25%) */}
          {maxDrawdown >= 25 && (
            <div className="px-4 sm:px-6 py-1.5 flex items-center gap-2.5">
              <div className="w-4 h-4 rounded-full bg-[#f59e0b] text-white flex items-center justify-center text-[10px] font-black shrink-0 shadow-2xs">
                !
              </div>
              <span className="text-[13px] sm:text-[13.5px] text-slate-800 dark:text-slate-200 font-normal">
                {t("journal.largeDrawdownWarning")}
              </span>
            </div>
          )}

          {/* MQL5 Spider / Radar Chart (Pure SVG, Hexagonal, Generous Bounds for % Labels) */}
          <div 
            tabIndex={-1}
            className="flex justify-center items-center py-0 px-1 relative select-none outline-none focus:outline-none"
            style={{ outline: 'none', WebkitTapHighlightColor: 'transparent', userSelect: 'none' }}
          >
            <div 
              tabIndex={-1}
              className="w-full max-w-[390px] h-[170px] sm:h-[190px] flex items-center justify-center relative outline-none focus:outline-none px-2"
              style={{ outline: 'none', WebkitTapHighlightColor: 'transparent' }}
            >
              <svg 
                viewBox="-105 -95 210 190" 
                className="w-full h-full select-none outline-none focus:outline-none pointer-events-none"
                style={{ outline: 'none', userSelect: 'none', WebkitTapHighlightColor: 'transparent' }}
              >
                {/* Concentric Hexagons (3 levels: 33.3%, 66.6%, 100%) */}
                {[0.33, 0.66, 1.0].map((scale, i) => {
                  const r = 68 * scale;
                  // 6 vertices at angles: -90, -30, 30, 90, 150, 210 deg
                  const points = [
                    [0, -r],
                    [r * Math.cos(Math.PI / 6), -r * Math.sin(Math.PI / 6)],
                    [r * Math.cos(Math.PI / 6), r * Math.sin(Math.PI / 6)],
                    [0, r],
                    [-r * Math.cos(Math.PI / 6), r * Math.sin(Math.PI / 6)],
                    [-r * Math.cos(Math.PI / 6), -r * Math.sin(Math.PI / 6)],
                  ].map(([x, y]) => `${x},${y}`).join(' ');

                  return (
                    <polygon
                      key={i}
                      points={points}
                      fill="none"
                      stroke="#d1d5db"
                      strokeWidth={1}
                      className="dark:stroke-slate-700"
                    />
                  );
                })}

                {/* Axis Radial Lines */}
                {[
                  [0, -68],
                  [68 * Math.cos(Math.PI / 6), -68 * Math.sin(Math.PI / 6)],
                  [68 * Math.cos(Math.PI / 6), 68 * Math.sin(Math.PI / 6)],
                  [0, 68],
                  [-68 * Math.cos(Math.PI / 6), 68 * Math.sin(Math.PI / 6)],
                  [-68 * Math.cos(Math.PI / 6), -68 * Math.sin(Math.PI / 6)],
                ].map(([x, y], idx) => (
                  <line
                    key={idx}
                    x1={0}
                    y1={0}
                    x2={x}
                    y2={y}
                    stroke="#d1d5db"
                    strokeWidth={1}
                    className="dark:stroke-slate-700"
                  />
                ))}

                {/* Concentric percentage level labels on top vertical axis */}
                <text x="3" y="-70" textAnchor="start" className="fill-slate-400 dark:fill-slate-500 text-[8.5px] font-sans">100+%</text>
                <text x="3" y="-36" textAnchor="start" className="fill-slate-400 dark:fill-slate-500 text-[8.5px] font-sans">50%</text>
                <text x="3" y="-3" textAnchor="start" className="fill-slate-400 dark:fill-slate-500 text-[8.5px] font-sans">0%</text>

                {/* Data Polygon & Nodes */}
                {(() => {
                  const maxR = 68;
                  const pts = [
                    [0, -maxR * Math.min(1.05, radarData[0].val / 100)],
                    [(maxR * Math.min(1, radarData[1].val / 100)) * Math.cos(Math.PI / 6), -(maxR * Math.min(1, radarData[1].val / 100)) * Math.sin(Math.PI / 6)],
                    [(maxR * Math.min(1, radarData[2].val / 100)) * Math.cos(Math.PI / 6), (maxR * Math.min(1, radarData[2].val / 100)) * Math.sin(Math.PI / 6)],
                    [0, maxR * Math.min(1, radarData[3].val / 100)],
                    [-(maxR * Math.min(1, radarData[4].val / 100)) * Math.cos(Math.PI / 6), (maxR * Math.min(1, radarData[4].val / 100)) * Math.sin(Math.PI / 6)],
                    [-(maxR * Math.min(1, radarData[5].val / 100)) * Math.cos(Math.PI / 6), -(maxR * Math.min(1, radarData[5].val / 100)) * Math.sin(Math.PI / 6)],
                  ];
                  const polyString = pts.map(([x, y]) => `${x},${y}`).join(' ');

                  return (
                    <g>
                      {/* Polygon Body */}
                      <polygon
                        points={polyString}
                        fill="#00b0ff"
                        fillOpacity={0.12}
                        stroke="#00b0ff"
                        strokeWidth={2.2}
                      />
                      {/* Cyan Vertex Dots */}
                      {pts.map(([x, y], idx) => (
                        <circle
                          key={idx}
                          cx={x}
                          cy={y}
                          r={4}
                          fill="#00b0ff"
                          stroke="#ffffff"
                          strokeWidth={1.2}
                        />
                      ))}
                    </g>
                  );
                })()}

                {/* Axis Labels (Clearly visible, completely inside bounds) */}
                {/* 1. Algo trading: X% (Top) */}
                <text x={0} y={-82} textAnchor="middle" className="fill-slate-900 dark:fill-white text-[11px] font-sans font-normal">
                  {t("journal.algoTrading")}: {algoTrading.toFixed(0)}%
                </text>

                {/* 2. Profit Trades: X% (Top-Right) */}
                <text x={72} y={-38} textAnchor="start" className="fill-slate-900 dark:fill-white text-[11px] font-sans font-normal">
                  <tspan x={72} dy="0">Profit Trades:</tspan>
                  <tspan x={72} dy="13">{winRate.toFixed(1)}%</tspan>
                </text>

                {/* 3. Loss Trades: X% (Bottom-Right) */}
                <text x={72} y={42} textAnchor="start" className="fill-slate-900 dark:fill-white text-[11px] font-sans font-normal">
                  {t("journal.lossTrades")}: {lossRate.toFixed(1)}%
                </text>

                {/* 4. Trading activity: X% (Bottom) */}
                <text x={0} y={88} textAnchor="middle" className="fill-slate-900 dark:fill-white text-[11px] font-sans font-normal">
                  {t("journal.tradingActivity")}: {tradingActivity.toFixed(1)}%
                </text>

                {/* 5. Max deposit load: X% (Bottom-Left) */}
                <text x={-72} y={35} textAnchor="end" className="fill-slate-900 dark:fill-white text-[11px] font-sans font-normal">
                  <tspan x={-72} dy="0">Max deposit load:</tspan>
                  <tspan x={-72} dy="13">{depositLoad.toFixed(0)}%</tspan>
                </text>

                {/* 6. Maximum drawdown: X% (Top-Left) */}
                <text x={-72} y={-44} textAnchor="end" className="fill-slate-900 dark:fill-white text-[11px] font-sans font-normal">
                  <tspan x={-72} dy="0">Maximum</tspan>
                  <tspan x={-72} dy="13">drawdown: {maxDrawdown.toFixed(1)}%</tspan>
                </text>
              </svg>
            </div>
          </div>

          {/* MQL5 Horizontal Flat Rectangular Bars Section */}
          <div className="px-4 sm:px-8 pt-1 pb-2 space-y-4">
            
            {/* 1. Equity */}
            <div className="flex items-center text-[13.5px] sm:text-[14.5px]">
              <span className="w-24 sm:w-28 text-right font-normal text-slate-800 dark:text-slate-200 shrink-0 pr-3 sm:pr-4">
                {t("journal.equity")}
              </span>
              <span className={`w-28 sm:w-32 text-right shrink-0 pr-3 sm:pr-4 font-mono ${
                displayEquity < 0 ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'font-normal text-slate-800 dark:text-slate-200'
              }`}>
                {formatUSD(displayEquity)}
              </span>
              <div className="flex-1 h-[22px] flex items-center">
                <div 
                  className={`h-full ${displayEquity < 0 ? 'bg-rose-400 dark:bg-rose-500' : 'bg-[#8be5ff]'}`} 
                  style={{ width: `${Math.max(2, Math.min(100, (Math.abs(displayEquity) / maxBarValue) * 100))}%` }}
                />
              </div>
            </div>

            {/* 2. Profit / Loss */}
            <div className="flex items-center text-[13.5px] sm:text-[14.5px]">
              <span className={`w-24 sm:w-28 text-right shrink-0 pr-3 sm:pr-4 ${
                displayProfit < 0 ? 'text-rose-600 dark:text-rose-400 font-medium' : 'font-normal text-slate-800 dark:text-slate-200'
              }`}>
                {displayProfit < 0 ? t("journal.loss") : t("journal.profit")}
              </span>
              <span className={`w-28 sm:w-32 text-right shrink-0 pr-3 sm:pr-4 font-mono ${
                displayProfit < 0 ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'font-normal text-slate-800 dark:text-slate-200'
              }`}>
                {formatUSD(displayProfit)}
              </span>
              <div className="flex-1 h-[22px] flex items-center">
                <div 
                  className={`h-full ${displayProfit < 0 ? 'bg-[#ef4444] dark:bg-rose-500' : 'bg-[#00b0ff]'}`} 
                  style={{ width: displayProfit !== 0 ? `${Math.max(2, Math.min(100, (Math.abs(displayProfit) / maxBarValue) * 100))}%` : '2px' }}
                />
              </div>
            </div>

            {/* 3. Initial Deposit */}
            <div className="flex items-center text-[13.5px] sm:text-[14.5px]">
              <span className="w-24 sm:w-28 text-right font-normal text-slate-800 dark:text-slate-200 shrink-0 pr-3 sm:pr-4">
                {t("journal.initialDeposit")}
              </span>
              <span className="w-28 sm:w-32 text-right font-normal text-slate-800 dark:text-slate-200 shrink-0 pr-3 sm:pr-4 font-mono">
                {formatUSD(displayInitialDeposit)}
              </span>
              <div className="flex-1 h-[22px] flex items-center">
                <div 
                  className="h-full bg-[#8be5ff]" 
                  style={{ width: displayInitialDeposit > 0 ? `${Math.max(2, Math.min(100, (Math.abs(displayInitialDeposit) / maxBarValue) * 100))}%` : '2px' }}
                />
              </div>
            </div>

            {/* 4. Withdrawals */}
            <div className="flex items-center text-[13.5px] sm:text-[14.5px]">
              <span className="w-24 sm:w-28 text-right font-normal text-slate-800 dark:text-slate-200 shrink-0 pr-3 sm:pr-4">
                {t("journal.withdrawals")}
              </span>
              <span className="w-28 sm:w-32 text-right font-normal text-slate-800 dark:text-slate-200 shrink-0 pr-3 sm:pr-4 font-mono">
                {formatUSD(displayWithdrawals)}
              </span>
              <div className="flex-1 h-[22px] flex items-center">
                <div 
                  className="h-full bg-[#00b0ff]" 
                  style={{ width: displayWithdrawals > 0 ? `${Math.max(2, Math.min(100, (Math.abs(displayWithdrawals) / maxBarValue) * 100))}%` : '2px' }}
                />
              </div>
            </div>

            {/* 5. Deposits */}
            <div className="flex items-center text-[13.5px] sm:text-[14.5px]">
              <span className="w-24 sm:w-28 text-right font-normal text-slate-800 dark:text-slate-200 shrink-0 pr-3 sm:pr-4">
                {t("journal.deposits")}
              </span>
              <span className="w-28 sm:w-32 text-right font-normal text-slate-800 dark:text-slate-200 shrink-0 pr-3 sm:pr-4 font-mono">
                {formatUSD(displayDeposits)}
              </span>
              <div className="flex-1 h-[22px] flex items-center">
                <div 
                  className="h-full bg-[#8be5ff]" 
                  style={{ width: displayDeposits > 0 ? `${Math.max(2, Math.min(100, (Math.abs(displayDeposits) / maxBarValue) * 100))}%` : '2px' }}
                />
              </div>
            </div>

          </div>

          {/* SECTION 3: GOTRADING VERDICT */}
          <div className="mt-4 px-4 sm:px-6 mb-4">
            <div className="bg-white border border-slate-100 rounded-2xl p-4 sm:p-5 relative shadow-xs flex flex-col">
              <span className="text-[10px] font-black tracking-widest text-indigo-600 uppercase mb-3">
                {t("journal.verdictTitle")}
              </span>
              
              <div className="flex items-center gap-2 mb-2">
                {verdictStatus === 'healthy' && <CheckCircle2 className="text-emerald-500 shrink-0" size={18} />}
                {verdictStatus === 'warning' && <AlertTriangle className="text-amber-500 shrink-0" size={18} />}
                {verdictStatus === 'risk' && <AlertTriangle className="text-rose-500 shrink-0" size={18} />}
                {verdictStatus === 'neutral' && <Info className="text-blue-500 shrink-0" size={18} />}
                <h3 className={`text-[15px] sm:text-base font-bold ${
                  verdictStatus === 'healthy' ? 'text-emerald-600' :
                  verdictStatus === 'warning' ? 'text-amber-600' :
                  verdictStatus === 'risk' ? 'text-rose-600' :
                  'text-slate-700'
                }`}>
                  {verdictHeadline}
                </h3>
              </div>
              
              <p className="text-xs sm:text-[13px] text-slate-500 leading-relaxed font-medium max-w-2xl">
                {verdictDesc}
              </p>
              
              <div className="mt-4 flex justify-end border-t border-slate-50 pt-3">
                <button 
                  onClick={() => setActiveTab('history')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all active:scale-95 shadow-sm uppercase tracking-wider"
                >
                  {t("journal.moreDetail")} <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
        );
      })()}
      
      {/* TAB 4: RISK ENGINE */}
      {activeTab === 'risk' && (
        <DrawdownRiskEngine />
      )}

      {/* TAB 2: TRADING JOURNAL */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          
          {/* SECTION 2: MONTHLY CALENDAR CARD (Mobile / Inline View) */}
          <div id="monthly-calendar-section" className="bg-indigo-50 border border-indigo-100 dark:bg-indigo-600/10 dark:border-indigo-500/20 rounded-2xl p-4 space-y-3.5 relative lg:hidden">
            
            {/* Header / Month toggle row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  {new Date(activeYear, activeMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}
                </span>
                <span className="text-[9px] text-indigo-500 dark:text-indigo-400 font-bold bg-indigo-50 border border-indigo-100 dark:bg-indigo-500/10 dark:border-indigo-500/10 px-2 py-0.5 rounded">
                  {t("journal.monthlyCalendar")}
                </span>
              </div>

              {/* Navigation button */}
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setActiveMonth(prev => prev === 0 ? 11 : prev - 1)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg text-slate-400 dark:text-gray-500 hover:text-slate-900 dark:text-white transition cursor-pointer"
                >
                  <ChevronLeft size={14} />
                </button>
                <button 
                  onClick={() => setActiveMonth(prev => prev === 11 ? 0 : prev + 1)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg text-slate-400 dark:text-gray-500 hover:text-slate-900 dark:text-white transition cursor-pointer"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {renderCalendar()}

            <div className="text-center text-[7.5px] text-slate-400 dark:text-gray-500 font-bold tracking-wider uppercase">
              💡 {t("journal.tapDayHint")}
            </div>
          </div>

          {/* SECTION 3: YEARLY CALENDAR PERFORMANCE */}
          <div className="bg-indigo-50 border border-indigo-100 dark:bg-indigo-600/10 dark:border-indigo-500/20 rounded-2xl p-4 space-y-3.5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">{t("journal.yearlyPerformance")}</span>
                <span className="text-[9px] text-violet-500 dark:text-violet-400 font-bold bg-violet-50 border border-violet-100 dark:bg-violet-500/10 dark:border-violet-500/10 px-2 py-0.5 rounded">
                  {activeYear} {t('common.journal.ledger')}
                </span>
              </div>

              {/* Selector for year */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#1B2132] border border-slate-200 dark:border-gray-800 px-2 py-1 rounded-lg">
                <button 
                  onClick={() => setActiveYear(2025)}
                  className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded transition cursor-pointer ${activeYear === 2025 ? 'bg-indigo-600 text-white' : 'text-slate-400 dark:text-gray-500'}`}
                >
                  2025
                </button>
                <button 
                  onClick={() => setActiveYear(2026)}
                  className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded transition cursor-pointer ${activeYear === 2026 ? 'bg-indigo-600 text-white' : 'text-slate-400 dark:text-gray-500'}`}
                >
                  2026
                </button>
              </div>
            </div>

            {/* Year aggregate YTD ribbon */}
            <div className="bg-rose-50 border border-rose-100 dark:bg-[#DE3C4B]/5 dark:border-rose-500/10 p-2 rounded-xl flex items-center justify-between">
              <span className="text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-wider">{t("journal.ytdTotalReturns")}</span>
              <span className={`text-xs font-black font-mono ${activeYearYTD >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
                {activeYearYTD >= 0 ? '+' : ''}${activeYearYTD.toFixed(2)}
              </span>
            </div>

            {/* Monthly grid inside Year */}
            <div className="grid grid-cols-4 gap-1.5">
              {activeYearMonths.map((monthData, idx) => {
                const isActive = activeMonth === idx;
                return (
                  <motion.button 
                    key={idx} 
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.96 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    onClick={() => {
                      setActiveMonth(idx);
                      setSelectedDayDetail({
                        date: `${monthData.fullMonth} ${activeYear} Report`,
                        startBalance: currentBalanceValue || (totalDepositsAmount > 0 ? totalDepositsAmount : 0),
                        endBalance: (currentBalanceValue || (totalDepositsAmount > 0 ? totalDepositsAmount : 0)) + (monthData.rawPL || 0),
                        netPL: monthData.rawPL || 0,
                        netPLPercent: currentBalanceValue > 0 ? ((monthData.rawPL || 0) / currentBalanceValue) * 100 : 0,
                        maxDrawdown: (monthData.rawPL || 0) < 0 ? Math.abs(monthData.rawPL || 0) : 0,
                        winrate: monthData.winrate || 0,
                        profitFactor: monthData.profitFactor || 0,
                        expectancy: monthData.trades > 0 ? ((monthData.rawPL || 0) / monthData.trades) : 0,
                        buysCount: monthData.buysCount || 0,
                        sellsCount: monthData.sellsCount || 0,
                        tradesCount: monthData.trades || 0,
                        bestTrade: monthData.bestTrade || 0,
                        worstTrade: monthData.worstTrade || 0,
                        avgHoldTime: monthData.trades > 0 ? "2h 15m" : "0h",
                        fees: 0,
                        deposit: 0,
                        tickets: monthData.tickets || []
                      });
                    }}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center space-y-1 transition-all cursor-pointer ${
                      isActive ? 'ring-2 ring-indigo-500 dark:ring-indigo-400 border-indigo-500' : ''
                    } ${
                      monthData.pl === null 
                        ? 'bg-slate-50 border-slate-200 dark:bg-[#181D28]/40 dark:border-gray-800 text-slate-500 dark:text-gray-400 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/40 hover:border-indigo-300 dark:hover:border-indigo-700' 
                        : monthData.pl > 0 
                          ? 'bg-[#F0FDF4] border-[#DCFCE7] dark:bg-emerald-950/20 dark:border-emerald-900/40 text-slate-900 dark:text-white shadow-sm hover:shadow-md hover:border-emerald-300' 
                          : 'bg-[#FFF1F2] border-[#FFE4E6] dark:bg-rose-950/20 dark:border-rose-900/40 text-slate-900 dark:text-white shadow-sm hover:shadow-md hover:border-rose-300'
                    }`}
                  >
                    <span className={`text-[10px] font-black uppercase font-roboto ${
                      monthData.pl !== null 
                        ? (monthData.pl > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400') 
                        : 'text-slate-500 dark:text-gray-400'
                    }`}>
                      {monthData.m}
                    </span>
                    {monthData.pl !== null ? (
                      <>
                        <span className="text-[12px] font-bold font-roboto">
                          {monthData.pl > 0 ? '+' : ''}${monthData.pl.toLocaleString()}
                        </span>
                        <span className="text-[9px] font-semibold font-roboto text-slate-500 dark:text-gray-400">{monthData.trades} trades</span>
                      </>
                    ) : (
                      <span className="text-[10px] text-slate-400 dark:text-gray-500 font-bold font-roboto">-</span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* SECTION 4: EXECUTED METATRADER HISTORY */}
          <div className="space-y-4 pt-2">
            {/* TOP TABS & SYNC BUTTON */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-gray-800 pb-3">
              {/* 2 Tabs */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#121620] p-1 rounded-2xl border border-slate-200/80 dark:border-gray-800">
                <button
                  onClick={() => setHistoryTab('closed')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
                    historyTab === 'closed'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <History size={14} />
                  <span>{t("journal.closedHistory")}</span>
                  <span className={`px-1.5 py-0.2 text-[10px] font-mono rounded-full ${
                    historyTab === 'closed' ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-200 dark:bg-gray-800 text-slate-700 dark:text-gray-300'
                  }`}>
                    {closedTrades.length}
                  </span>
                </button>

                <button
                  onClick={() => setHistoryTab('floating')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
                    historyTab === 'floating'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Activity size={14} className={openTrades.length > 0 ? "animate-pulse text-amber-300" : ""} />
                  <span>{t("journal.floatingPositions")}</span>
                  <span className={`px-1.5 py-0.2 text-[10px] font-mono rounded-full ${
                    historyTab === 'floating' ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-200 dark:bg-gray-800 text-slate-700 dark:text-gray-300'
                  }`}>
                    {openTrades.length}
                  </span>
                </button>
              </div>

              {/* Sync Button */}
              <button
                onClick={handleSyncMetaTrader}
                disabled={loadingTrades}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 transition rounded-xl text-xs font-bold border cursor-pointer disabled:opacity-50 ${
                  isDataStale && !loadingTrades
                    ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 animate-pulse'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-gray-700'
                }`}
              >
                <RefreshCw size={13} className={loadingTrades ? "animate-spin text-indigo-600 dark:text-indigo-400" : (isDataStale ? "text-amber-500" : "text-indigo-600 dark:text-indigo-400")} />
                <span>{loadingTrades ? t("journal.syncing") : t("journal.syncMetaTrader")}</span>
              </button>
            </div>

            {/* FILTER & SEARCH BAR */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-[#121620] border border-slate-200 dark:border-gray-800 p-3 rounded-2xl shadow-xs">
              <div className="relative flex-1 min-w-[140px]">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Pair / Symbol (XAUUSD, EURUSD...)"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-gray-800/60 border border-slate-200 dark:border-gray-700 rounded-xl pl-8 pr-3 py-1.5 text-xs font-bold text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-100 dark:bg-gray-800 p-1 rounded-xl">
                {(['ALL', 'BUY', 'SELL'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setHistoryTypeFilter(type)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-wider transition cursor-pointer ${
                      historyTypeFilter === type
                        ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                        : 'text-slate-500 dark:text-gray-400 hover:text-slate-800'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* TRADES LIST */}
            {filteredHistoryTrades.length === 0 ? (
              <div className="bg-white dark:bg-[#121620] border border-slate-200 dark:border-gray-800 rounded-3xl p-6 text-center space-y-5 shadow-xs">
                <div className="relative w-14 h-14 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-2xl rotate-6" />
                  <div className="relative w-14 h-14 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-md">
                    {historyTab === 'closed' ? <History size={26} /> : <Activity size={26} />}
                  </div>
                </div>

                <div className="max-w-md mx-auto space-y-1">
                  <h4 className="text-sm font-black text-slate-800 dark:text-white">
                    {activeTabTrades.length === 0 
                      ? (historyTab === 'closed' ? t("journal.noExecutionLogs") : t("journal.noFloatingActive")) 
                      : t("journal.noTradesMatchSearch")}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed">
                    {activeTabTrades.length === 0 
                      ? (historyTab === 'closed' 
                          ? t("journal.executionLogEmpty") 
                          : t("journal.noFloatingDesc"))
                      : t("journal.noTransactionsMatchFilter")}
                  </p>
                </div>

                {activeTabTrades.length === 0 && historyTab === 'closed' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left max-w-2xl mx-auto">
                    <div 
                      onClick={() => setActiveView('account')}
                      className="p-3 bg-slate-50 dark:bg-slate-900/50 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-2xl space-y-1 transition-all duration-200 cursor-pointer active:scale-[0.98] group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-950/60 group-hover:bg-indigo-600 group-hover:text-white text-indigo-600 dark:text-indigo-400 text-[9px] font-black flex items-center justify-center transition-colors">1</span>
                        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{t("journal.linkBrokerTerminal")}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-gray-400 leading-normal">
                        {t("journal.linkBrokerDesc")}
                      </p>
                    </div>

                    <div 
                      onClick={() => { setActiveTab('goals'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className="p-3 bg-slate-50 dark:bg-slate-900/50 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-2xl space-y-1 transition-all duration-200 cursor-pointer active:scale-[0.98] group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-950/60 group-hover:bg-indigo-600 group-hover:text-white text-indigo-600 dark:text-indigo-400 text-[9px] font-black flex items-center justify-center transition-colors">2</span>
                        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{t("journal.logEntryExit")}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-gray-400 leading-normal">
                        {t("journal.logEntryExitDesc")}
                      </p>
                    </div>

                    <div 
                      onClick={() => { setActiveTab('ledger'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      className="p-3 bg-slate-50 dark:bg-slate-900/50 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-2xl space-y-1 transition-all duration-200 cursor-pointer active:scale-[0.98] group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-950/60 group-hover:bg-indigo-600 group-hover:text-white text-indigo-600 dark:text-indigo-400 text-[9px] font-black flex items-center justify-center transition-colors">3</span>
                        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{t("journal.exportAudit")}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-gray-400 leading-normal">
                        {t("journal.exportAuditDesc")}
                      </p>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setHistorySearch('');
                      setHistoryTypeFilter('ALL');
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition cursor-pointer"
                  >
                    {t("journal.clearHistoryFilters")}
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold px-1">
                  <span>Showing {filteredHistoryTrades.length} of {activeTabTrades.length} {historyTab === 'closed' ? 'closed trades' : 'floating positions'}</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-mono">{t("journal.realtimeSync")}</span>
                </div>

                <div className="space-y-2.5">
                  {filteredHistoryTrades.map((t, idx) => {
                    const plVal = Number(t.pl) || Number(t.profit) || 0;
                    return (
                      <div 
                        key={t.id || idx}
                        className="bg-white dark:bg-[#121620] border border-slate-200 dark:border-gray-800 rounded-2xl p-4 shadow-xs hover:border-indigo-500/30 transition flex flex-col gap-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg uppercase tracking-wider border ${
                              t.type?.toUpperCase() === 'BUY' 
                                ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800' 
                                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                            }`}>
                              {t.type || 'BUY'}
                            </span>
                            <span className="text-sm font-black text-slate-900 dark:text-white font-roboto">{t.symbol}</span>
                            <span className="text-[11px] text-slate-500 font-bold font-mono">{t.lots || t.volume || 0} Lot</span>
                            {historyTab === 'floating' && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded border border-amber-500/20 uppercase tracking-wider">
                                Floating
                              </span>
                            )}
                          </div>
                          
                          <div className="text-right">
                            <span className={`text-sm font-black font-roboto block ${plVal >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                              {plVal >= 0 ? '+' : ''}${plVal.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono text-slate-500 dark:text-gray-400 bg-slate-50 dark:bg-gray-900/40 p-2.5 rounded-xl border border-slate-100 dark:border-gray-800/80">
                          <div>
                            <span className="block text-[8px] uppercase tracking-wider text-slate-400">Open Price</span>
                            <span className="font-bold text-slate-700 dark:text-gray-300">${t.openPrice?.toFixed(2) || t.priceOpen?.toFixed(2) || '0.00'}</span>
                          </div>
                          <div>
                            <span className="block text-[8px] uppercase tracking-wider text-slate-400">{historyTab === 'closed' ? 'Close Price' : 'Current Price'}</span>
                            <span className="font-bold text-slate-700 dark:text-gray-300">${t.closePrice?.toFixed(2) || t.priceCurrent?.toFixed(2) || t.currentPrice?.toFixed(2) || t.openPrice?.toFixed(2) || '0.00'}</span>
                          </div>
                          <div>
                            <span className="block text-[8px] uppercase tracking-wider text-slate-400">Commission / Swap</span>
                            <span className="font-bold text-slate-700 dark:text-gray-300">${((t.commission || 0) + (t.swap || 0)).toFixed(2)}</span>
                          </div>
                          <div>
                            <span className="block text-[8px] uppercase tracking-wider text-slate-400">{historyTab === 'closed' ? 'Close Time' : 'Open Time'}</span>
                            <span className="font-bold text-slate-700 dark:text-gray-300">
                              {historyTab === 'closed' 
                                ? (t.closeTime ? parseUTCDate(t.closeTime).toLocaleDateString(navigator.language || 'id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false, timeZoneName: 'short', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }).replace(/\s*(AM|PM|am|pm)/gi, '') : '-')
                                : (t.openTime || t.time ? parseUTCDate(t.openTime || t.time).toLocaleDateString(navigator.language || 'id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false, timeZoneName: 'short', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }).replace(/\s*(AM|PM|am|pm)/gi, '') : '-')
                              }
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* TAB 3: DEDICATED AI ANALYSIS & INVESTIGATION (PORTFOLIO REPORT) */}
      {activeTab === 'history' && (
        <PortfolioReport 
          trades={trades}
          activeAccountInfo={activeAccountInfo}
          loadingTrades={loadingTrades}
          onBack={() => setActiveTab('goals')}
          onRefresh={async () => {
            await fetchTradesAndAccount();
          }}
        />
      )}
    </div>
        
        {/* Desktop Right Sidebar: Monthly Calendar & Analytics (Desktop Only) */}
        <div className="hidden lg:block lg:col-span-5 xl:col-span-4 space-y-4 sticky top-4">
          
          {/* Connected Accounts Card List */}
          {renderConnectedAccountsCard()}

          {/* Monthly Calendar Widget Card */}
          <div className="bg-[#EFF2F6]/90 dark:bg-slate-900/80 backdrop-blur-md border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 shadow-sm space-y-3.5 relative">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Calendar size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    {t("journal.monthlyCalendarPnL")}
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{t("journal.dailyTradingReport")}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => {
                    if (activeMonth === 0) {
                      setActiveMonth(11);
                      setActiveYear(prev => prev - 1);
                    } else {
                      setActiveMonth(prev => prev - 1);
                    }
                  }}
                  className="p-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
                  title={t("journal.previousMonth")}
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="text-[11px] font-black text-slate-800 dark:text-slate-200 px-1 font-roboto">
                  {new Date(activeYear, activeMonth).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                </span>
                <button 
                  onClick={() => {
                    if (activeMonth === 11) {
                      setActiveMonth(0);
                      setActiveYear(prev => prev + 1);
                    } else {
                      setActiveMonth(prev => prev + 1);
                    }
                  }}
                  className="p-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition cursor-pointer"
                  title={t("journal.nextMonth")}
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Render Calendar Grid */}
            {renderCalendar()}
          </div>

          {/* Quick Analytics Card */}
          <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-5 shadow-sm space-y-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-10 -mt-10" />
            <div className="flex items-center justify-between relative z-10">
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300">{t("journal.targetProtocol")}</span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                {weeklyAchievedPL >= weeklyTargetAmount ? t("journal.targetMet") : t("journal.inProgress")}
              </span>
            </div>
            
            <div className="space-y-1 relative z-10">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-300">{t("journal.weeklyAchievement")}</span>
                <span className="text-emerald-400 font-mono">${weeklyAchievedPL.toFixed(2)} / ${weeklyTargetAmount}</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700/50">
                <div 
                  className="bg-gradient-to-r from-indigo-500 to-emerald-400 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, Math.max(0, (weeklyAchievedPL / (weeklyTargetAmount || 1)) * 100))}%` }} 
                />
              </div>
            </div>

            <button
              onClick={() => { setActiveTab('goals'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="w-full mt-2 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border border-white/10 cursor-pointer active:scale-95"
            >
              <span>{t("journal.resetTargetsRisk")}</span>
              <ArrowRight size={14} />
            </button>
          </div>

        </div>

      </div>
    </div>

      {/* POPUP 1: CALENDAR DAY TRANSACTION DETAIL DIALOG */}
      <AnimatePresence>
        {selectedDayDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-end pointer-events-none">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDayDetail(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
            />
            <motion.div 
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed right-4 top-4 bottom-4 w-[85%] max-w-sm z-[120] shadow-2xl flex flex-col rounded-3xl border pointer-events-auto overflow-hidden`}
              style={{ 
                backgroundColor: selectedDayDetail.netPL >= 0 ? '#F0FDF4' : '#FFF1F2',
                borderColor: selectedDayDetail.netPL >= 0 ? '#DCFCE7' : '#FFE4E6'
              }}
            >
              
              {/* Header row */}
              <div className="p-5 border-b border-black/5 flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5 font-roboto">
                  <Calendar size={16} className="text-slate-800" />
                  {selectedDayDetail.date}
                </span>
                <button 
                  onClick={() => setSelectedDayDetail(null)}
                  className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-black/10 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* P&L Header */}
              <div className="p-5 bg-white/20 backdrop-blur-md border-b border-black/5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest block mb-0.5 font-roboto">NET P&L</span>
                  <span className={`text-[24px] font-black font-roboto leading-none text-slate-900`}>
                    {selectedDayDetail.netPL >= 0 ? '+' : ''}${selectedDayDetail.netPL.toFixed(2)}
                  </span>
                </div>
                
                <div className="text-right">
                  <span className={`text-sm font-black font-roboto px-3 py-1.5 rounded-xl bg-white/30 text-slate-900 border border-white/20 shadow-sm`}>
                    {selectedDayDetail.netPLPercent >= 0 ? '+' : ''}{selectedDayDetail.netPLPercent.toFixed(2)}%
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar">
                {/* Account Overview section */}
                <div className="space-y-3">
                  <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest block font-roboto">Account Overview</span>
                  
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white/40 backdrop-blur-md rounded-2xl p-2.5 border border-white/20 shadow-sm">
                      <span className="text-[8px] font-bold text-slate-600 uppercase block mb-0.5 font-roboto">Start</span>
                      <span className="text-[11px] font-black text-slate-900 font-roboto">${selectedDayDetail.startBalance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="bg-white/40 backdrop-blur-md rounded-2xl p-2.5 border border-white/20 shadow-sm">
                      <span className="text-[8px] font-bold text-slate-600 uppercase block mb-0.5 font-roboto">End</span>
                      <span className="text-[11px] font-black text-slate-900 font-roboto">${selectedDayDetail.endBalance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="bg-white/40 backdrop-blur-md rounded-2xl p-2.5 border border-white/20 shadow-sm">
                      <span className="text-[8px] font-bold text-slate-600 uppercase block mb-0.5 font-roboto">Deposit</span>
                      <span className="text-[11px] font-black text-slate-900 font-roboto">${selectedDayDetail.deposit.toFixed(0)}</span>
                    </div>
                  </div>
                </div>

                {/* Segmented Control Tab Header */}
                <div className="flex bg-black/5 p-1 rounded-2xl">
                  <button
                    onClick={() => setModalTab('stats')}
                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all ${
                      modalTab === 'stats' 
                        ? 'bg-white text-slate-900 shadow-sm' 
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    Daily Stats
                  </button>
                  <button
                    onClick={() => setModalTab('tickets')}
                    className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all ${
                      modalTab === 'tickets' 
                        ? 'bg-white text-slate-900 shadow-sm' 
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    Tickets ({selectedDayDetail.tickets?.length || 0})
                  </button>
                </div>

                {/* Scrollable detail container */}
                <div className="space-y-4">
                  {modalTab === 'stats' ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest block font-roboto">Performance Metrics</span>
                        
                        <div className="flex items-center gap-1.5">
                          <span className="bg-white/40 backdrop-blur-sm text-slate-900 px-2 py-0.5 rounded-lg border border-white/20 text-[9px] font-black">
                            {selectedDayDetail.tradesCount} Trades
                          </span>
                        </div>
                      </div>

                      {/* Details table list */}
                      <div className="bg-white/40 backdrop-blur-md rounded-2xl p-4 border border-white/20 shadow-sm space-y-3">
                        {[
                          { label: 'Best Trade', value: `$${selectedDayDetail.bestTrade.toFixed(2)}`, color: 'text-slate-900' },
                          { label: 'Worst Trade', value: `$${selectedDayDetail.worstTrade.toFixed(2)}`, color: 'text-slate-900' },
                          { label: 'Avg Hold Time', value: selectedDayDetail.avgHoldTime, color: 'text-slate-900' },
                          { label: 'Max Drawdown', value: `$${selectedDayDetail.maxDrawdown.toFixed(2)}`, color: 'text-slate-900' },
                          { label: 'Fees Paid', value: `$${selectedDayDetail.fees.toFixed(2)}`, color: 'text-slate-900' },
                          { label: 'Winrate', value: `${selectedDayDetail.winrate.toFixed(0)}%`, color: 'text-slate-900' },
                          { label: 'Profit Factor', value: selectedDayDetail.profitFactor.toString(), color: 'text-slate-900' },
                          { label: 'Expectancy', value: selectedDayDetail.expectancy.toFixed(1), color: 'text-slate-900' },
                        ].map((item, idx) => (
                          <div key={idx} className={`flex justify-between items-center ${idx !== 7 ? 'pb-2.5 border-b border-black/5' : ''}`}>
                            <span className="text-[11px] font-bold text-slate-700 font-roboto">{item.label}</span>
                            <span className={`text-[11px] font-black font-roboto ${item.color}`}>{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest block font-roboto">Order Tickets</span>
                        <span className="text-[9px] text-slate-700 font-bold uppercase font-roboto">Sync Verified</span>
                      </div>

                      {selectedDayDetail.tickets && selectedDayDetail.tickets.length > 0 ? (
                        <div className="space-y-2.5">
                          {selectedDayDetail.tickets.map((t) => (
                            <div key={t.id} className="bg-white/40 backdrop-blur-md border border-white/20 rounded-2xl p-3 flex flex-col gap-1.5 shadow-sm hover:bg-white/50 transition-all">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-lg leading-none shadow-sm ${
                                    t.type === 'BUY' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                                  }`}>
                                    {t.type}
                                  </span>
                                  <span className="text-[12px] font-black text-slate-900 font-roboto">{t.symbol}</span>
                                  <span className="text-[9px] text-slate-700 font-bold font-roboto">{t.lots.toFixed(2)} L</span>
                                </div>
                                <span className={`text-[12px] font-black font-roboto text-slate-900`}>
                                  {t.pl >= 0 ? '+' : ''}${t.pl.toFixed(2)}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-[10px] text-slate-700 font-bold font-roboto">
                                <div className="flex items-center gap-1">
                                  <span>{t.openPrice.toFixed(4)}</span>
                                  <ArrowUpRight size={10} className="text-slate-500" />
                                  <span>{t.closePrice.toFixed(4)}</span>
                                </div>
                                <span>{t.time}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-12 text-center text-slate-700 font-bold text-xs bg-white/20 rounded-2xl border border-dashed border-black/10">
                          No tickets executed for this day.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom action button */}
              <div className="p-4 sm:p-5 bg-black/5 border-t border-black/5 flex gap-2 sm:gap-3">
                <button 
                  onClick={handleExportCSV}
                  className="flex-1 py-3 bg-white/40 backdrop-blur-md border border-white/30 text-slate-900 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-white/60 transition-all shadow-sm flex items-center justify-center gap-1.5"
                >
                  <Download size={13} />
                  Export
                </button>
                <button 
                  onClick={() => {
                    if (selectedDayDetail) {
                      openShareCard({
                        date: selectedDayDetail.date,
                        netPL: selectedDayDetail.netPL,
                        netPLPercent: selectedDayDetail.netPLPercent,
                        tradesCount: selectedDayDetail.tradesCount,
                        wins: selectedDayDetail.buysCount + selectedDayDetail.sellsCount > 0 ? Math.round((selectedDayDetail.winrate / 100) * selectedDayDetail.tradesCount) : (selectedDayDetail.netPL >= 0 ? selectedDayDetail.tradesCount : 0),
                        losses: Math.max(0, selectedDayDetail.tradesCount - Math.round((selectedDayDetail.winrate / 100) * selectedDayDetail.tradesCount)),
                        winRate: selectedDayDetail.winrate || (selectedDayDetail.netPL >= 0 ? 100 : 0),
                        bestTrade: selectedDayDetail.bestTrade,
                        worstTrade: selectedDayDetail.worstTrade,
                        profitFactor: selectedDayDetail.profitFactor || '1.85',
                      });
                    }
                  }}
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
                >
                  <Share2 size={13} />
                  Share Card
                </button>
                <button 
                  onClick={() => setSelectedDayDetail(null)}
                  className="py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-lg"
                >
                  Done
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* POPUP 2: BENTO INTELLIGENCE ANALYSIS DRAWER */}
      <AnimatePresence>
        {activeAnalysisPopup && (
          <div className="fixed inset-0 z-50 flex items-center justify-end pointer-events-none">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveAnalysisPopup(null)}
              className="absolute inset-0 bg-black/50 backdrop-blur-xs pointer-events-auto"
            />
            <motion.div 
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-2 sm:right-4 top-2 sm:top-4 bottom-2 sm:bottom-4 w-[92%] sm:w-[88%] max-w-md z-[120] shadow-2xl flex flex-col rounded-3xl border border-slate-700/80 bg-[#0F172A] text-slate-100 pointer-events-auto overflow-hidden"
            >
              
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                    <BrainCircuit size={16} />
                  </div>
                  <div>
                    <span className="text-xs font-black text-white uppercase tracking-wider block font-roboto">
                      Real-Time MT5 AI Audit
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>{activeAccountInfo?.broker || 'MetaTrader 5'} Live Sync</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveAnalysisPopup(null)}
                  className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Content body */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 no-scrollbar">
                
                {isAnalyzingAi ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 animate-pulse">
                        <BrainCircuit size={28} />
                      </div>
                      <Loader2 size={24} className="animate-spin text-indigo-400 absolute -top-2 -right-2" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-white uppercase tracking-wide">Menganalisis Data MT5 Riil</h4>
                      <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                        AI GoTrading sedang memindai {closedTrades.length} tiket order, mendeteksi korelasi waktu, dan mengukur risk leakage...
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Title & Core Diagnosis */}
                    <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 shadow-sm space-y-2">
                      <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-amber-400" />
                        <h4 className="text-sm font-black text-white tracking-tight">{activeAnalysisPopup.title}</h4>
                      </div>
                      <p className="text-[12.5px] text-slate-300 leading-relaxed font-normal">
                        {activeAnalysisPopup.content}
                      </p>
                    </div>

                    {/* Strategic Recommendation */}
                    <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-900 text-white rounded-2xl p-4.5 shadow-lg border border-indigo-500/30 relative overflow-hidden">
                      <div className="relative z-10 space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <Target size={15} className="text-indigo-400" />
                          <h5 className="text-[10px] font-black uppercase tracking-widest text-indigo-300">
                            Rekomendasi Taktis & Manajemen Risiko
                          </h5>
                        </div>
                        <p className="text-[12.5px] text-slate-200 leading-relaxed font-medium">
                          {activeAnalysisPopup.recommendation}
                        </p>
                      </div>
                      <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
                        <BrainCircuit size={80} />
                      </div>
                    </div>

                    {/* Key Insights List */}
                    {activeAnalysisPopup.keyInsights && activeAnalysisPopup.keyInsights.length > 0 && (
                      <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 space-y-2">
                        <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest block">
                          Temuan Kunci (Data Riil MT5)
                        </span>
                        <ul className="space-y-1.5">
                          {activeAnalysisPopup.keyInsights.map((insight, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                              <CheckCircle2 size={13} className="text-emerald-400 mt-0.5 shrink-0" />
                              <span>{insight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Action Items */}
                    {activeAnalysisPopup.actionItems && activeAnalysisPopup.actionItems.length > 0 && (
                      <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 space-y-2">
                        <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block">
                          Action Checklist Trader
                        </span>
                        <ul className="space-y-1.5">
                          {activeAnalysisPopup.actionItems.map((item, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Metrics Confidence & Risk Bias */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700/70">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Audit Confidence</span>
                        <span className="text-base font-black text-emerald-400">{activeAnalysisPopup.confidence || 94}%</span>
                      </div>
                      <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700/70">
                        <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">Risk Exposure Bias</span>
                        <span className={`text-base font-black ${
                          activeAnalysisPopup.riskBias === 'Elevated' || activeAnalysisPopup.riskBias === 'High'
                            ? 'text-rose-400'
                            : activeAnalysisPopup.riskBias === 'Moderate'
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}>
                          {activeAnalysisPopup.riskBias || 'Low'}
                        </span>
                      </div>
                    </div>
                  </>
                )}

              </div>

              {/* Drawer Footer with Follow-up Input */}
              <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-2.5">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (drawerFollowupQuery.trim()) {
                      triggerBentoAnalysis('investigation', drawerFollowupQuery.trim());
                      setDrawerFollowupQuery('');
                    }
                  }}
                  className="flex items-center gap-2 bg-slate-800 rounded-xl p-1 border border-slate-700 focus-within:border-indigo-500 transition"
                >
                  <input
                    type="text"
                    value={drawerFollowupQuery}
                    onChange={(e) => setDrawerFollowupQuery(e.target.value)}
                    placeholder="Tanya pertanyaan lanjutan..."
                    className="flex-1 bg-transparent border-none text-xs text-white placeholder-slate-400 focus:outline-none px-2.5"
                  />
                  <button
                    type="submit"
                    disabled={isAnalyzingAi || !drawerFollowupQuery.trim()}
                    className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-lg transition cursor-pointer"
                  >
                    <Send size={13} />
                  </button>
                </form>

                <button 
                  onClick={() => setActiveAnalysisPopup(null)}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-slate-700 cursor-pointer"
                >
                  Tutup Diagnosa
                </button>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SHARE SUMMARY CARD MODAL */}
      {shareCardOpen && shareCardData && (
        <ShareSummaryCardModal
          isOpen={shareCardOpen}
          onClose={() => setShareCardOpen(false)}
          data={shareCardData}
          showToast={showToast}
        />
      )}

      </div>
    </div>
  );
};
