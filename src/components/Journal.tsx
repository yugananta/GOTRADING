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
  ArrowRight
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { apiFetch } from '../utils/apiFetch';
import { ShareSummaryCardModal, SummaryCardData } from './ShareSummaryCardModal';

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
  const { currentUser, tradingStats, setTradingStats, fetchNotifications, showToast, triggerTestNotification, setActiveView, journalInitialTab } = useApp();
  
  // Tabs: 'goals' | 'ledger' | 'history'
  const [activeTab, setActiveTab] = useState<'goals' | 'ledger' | 'history'>(() => journalInitialTab || 'goals');

  useEffect(() => {
    if (journalInitialTab) {
      setActiveTab(journalInitialTab);
    }
  }, [journalInitialTab]);
  
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
  const [activeYear, setActiveYear] = useState<number>(2026);
  const [activeMonth, setActiveMonth] = useState<number>(6); // 0-11

  // Today's P&L value
  const todayPLValue = parseFloat(tradingStats.todayPL.replace('+$', '').replace('-$', '-').replace('$', '').replace(',', '')) || 0;

  // Clicked Day State for detailed transaction popup
  const [selectedDayDetail, setSelectedDayDetail] = useState<MockTradeDetail | null>(null);
  const [modalTab, setModalTab] = useState<'stats' | 'tickets'>('stats');

  // Interactive diagnostic modal state (Bento menu)
  const [activeAnalysisPopup, setActiveAnalysisPopup] = useState<{ title: string, content: string, recommendation: string } | null>(null);

  // --- REAL-TIME METATRADER TRADES SYNC ---
  const [trades, setTrades] = useState<any[]>([]);
  const [loadingTrades, setLoadingTrades] = useState(false);

  const fetchTrades = async () => {
    setLoadingTrades(true);
    try {
      const res = await apiFetch('/api/metatrader/trades');
      const isJson = res.headers.get('content-type')?.includes('application/json');
      if (res.ok && isJson) {
        const data = await res.json();
        setTrades(data.trades || []);
      }
    } catch (err) {
      console.error("Error fetching trades:", err);
    } finally {
      setLoadingTrades(false);
    }
  };

  const handleSyncMetaTrader = async () => {
    setLoadingTrades(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await apiFetch('/api/metatrader/sync', {
        method: 'POST',
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      if (res.ok) {
        await fetchTrades();
        if (showToast) {
          showToast("🔄 Sync Sukses! Data MetaTrader tersinkronisasi secara real-time.");
        }
      }
    } catch (err) {
      console.error("Error syncing trades:", err);
    } finally {
      setLoadingTrades(false);
    }
  };

  useEffect(() => {
    fetchTrades();
  }, []);

  // Filter closed trades
  const closedTrades = useMemo(() => trades.filter(t => t.closeTime), [trades]);

  // History tab search & filter
  const [historySearch, setHistorySearch] = useState('');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');

  const filteredHistoryTrades = useMemo(() => {
    return closedTrades.filter(t => {
      const matchesSymbol = t.symbol ? t.symbol.toLowerCase().includes(historySearch.toLowerCase()) : true;
      const matchesType = historyTypeFilter === 'ALL' || (t.type && t.type.toUpperCase() === historyTypeFilter);
      return matchesSymbol && matchesType;
    });
  }, [closedTrades, historySearch, historyTypeFilter]);

  const totalVolumeLots = useMemo(() => {
    return closedTrades.reduce((acc, t) => acc + (Number(t.lots) || 0), 0);
  }, [closedTrades]);

  // Overall statistics from trades
  const totalTradesCount = closedTrades.length;
  const totalWinsCount = closedTrades.filter(t => t.pl > 0).length;
  const totalGrossProfit = closedTrades.filter(t => t.pl > 0).reduce((acc, t) => acc + t.pl, 0);
  const totalGrossLoss = Math.abs(closedTrades.filter(t => t.pl < 0).reduce((acc, t) => acc + t.pl, 0));
  const overallWinRate = totalTradesCount > 0 ? (totalWinsCount / totalTradesCount) * 100 : 0;
  const overallProfitFactor = totalGrossLoss > 0 ? (totalGrossProfit / totalGrossLoss) : (totalGrossProfit > 0 ? 99.99 : 0);

  // Current Week Progress Calculations
  const now = new Date();
  const dayOfWeek = now.getDay();
  const distanceToMon = (dayOfWeek + 6) % 7;
  const mondayOfWeek = new Date(now);
  mondayOfWeek.setDate(now.getDate() - distanceToMon);
  mondayOfWeek.setHours(0, 0, 0, 0);

  const weeklyTrades = closedTrades.filter(t => new Date(t.closeTime) >= mondayOfWeek);
  const weeklyAchievedPL = weeklyTrades.reduce((acc, t) => acc + t.pl, 0);
  const weeklyLosses = weeklyTrades.filter(t => t.pl < 0).reduce((acc, t) => acc + t.pl, 0);
  const currentWeeklyDD = Math.abs(weeklyLosses);

  const weeklyTargetPercent = weeklyTargetAmount > 0 ? Math.min(100, Math.max(0, (Math.max(0, weeklyAchievedPL) / weeklyTargetAmount) * 100)) : 0;
  const weeklyDDPercent = weeklyRiskAmount > 0 ? Math.min(100, Math.max(0, (currentWeeklyDD / weeklyRiskAmount) * 100)) : 0;

  // Daily Progress Calculations
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayTradesList = closedTrades.filter(t => new Date(t.closeTime) >= todayStart);
  const dailyAchievedPL = todayTradesList.length > 0 ? todayTradesList.reduce((acc, t) => acc + t.pl, 0) : Math.max(0, todayPLValue);
  const dailyLosses = todayTradesList.length > 0 ? todayTradesList.filter(t => t.pl < 0).reduce((acc, t) => acc + t.pl, 0) : (todayPLValue < 0 ? todayPLValue : 0);
  const dailyCurrentDD = Math.abs(dailyLosses);

  const dailyTargetPercent = dailyTargetAmount > 0 ? Math.min(100, Math.max(0, (Math.max(0, dailyAchievedPL) / dailyTargetAmount) * 100)) : 0;
  const dailyDDPercent = dailyRiskLimitAmount > 0 ? Math.min(100, Math.max(0, (dailyCurrentDD / dailyRiskLimitAmount) * 100)) : 0;

  // Compile trades data dynamically
  const monthlyTradesData = useMemo(() => {
    const data: { [day: number]: { netPL: number, wins: number, total: number, tickets: any[] } } = {};
    
    trades.forEach(trade => {
      if (trade.closeTime) {
        const dateObj = new Date(trade.closeTime);
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
  }, [trades, activeMonth, activeYear]);

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
        const d = new Date(t.closeTime);
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
      .filter(t => new Date(t.closeTime).getFullYear() === year)
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
      });
    } else {
      const winsCount = todayTradesList.filter(t => t.pl > 0).length;
      const lossesCount = todayTradesList.filter(t => t.pl < 0).length;
      const total = todayTradesList.length || (todayPLValue !== 0 ? 1 : 0);
      const winrate = total > 0 ? (winsCount / total) * 100 : (todayPLValue >= 0 ? 100 : 0);

      setShareCardData({
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
        netPL: todayPLValue,
        netPLPercent: currentBalanceValue > 0 ? (todayPLValue / currentBalanceValue) * 100 : 0,
        tradesCount: total,
        wins: winsCount || (todayPLValue >= 0 ? 1 : 0),
        losses: lossesCount || (todayPLValue < 0 ? 1 : 0),
        winRate: winrate,
        bestTrade: todayTradesList.length > 0 ? Math.max(...todayTradesList.map(t => t.pl)) : Math.max(0, todayPLValue),
        worstTrade: todayTradesList.length > 0 ? Math.min(...todayTradesList.map(t => t.pl)) : Math.min(0, todayPLValue),
        profitFactor: overallProfitFactor.toFixed(2),
        accountName: displayName,
        username: username,
        avatar: avatar,
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
    const baseBal = currentBalanceValue || 10000;

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

  // Simulation triggers
  const handleSimulateWin = () => {
    const winningPL = dailyTargetAmount + 50;
    setTradingStats(prev => ({
      ...prev,
      todayPL: `+$${Math.round(winningPL)}`
    }));
  };

  const handleSimulateLoss = () => {
    const losingPL = dailyRiskLimitAmount + 50;
    setTradingStats(prev => ({
      ...prev,
      todayPL: `-$${Math.round(losingPL)}`
    }));
  };

  const handleSimulateSessionDrawdown = () => {
    const baseBal = currentBalanceValue || 10000;
    const lossAmount = baseBal * 0.052; // 5.2% session drawdown
    const currentHour = new Date().getUTCHours();
    let currentSession = 'Asian Session';
    if (currentHour >= 8 && currentHour < 16) currentSession = 'London Session';
    else if (currentHour >= 16) currentSession = 'New York Session';

    const alertMessage = `🚨 DRAWDOWN ALERT: ${currentSession} drawdown exceeded 5%! (-5.2% / -$${lossAmount.toFixed(2)})`;

    if (showToast) {
      showToast(alertMessage, 5000);
    }

    triggerNotification(
      'danger',
      `🚨 DRAWDOWN ALERT: Single session drawdown in ${currentSession} exceeded 5.0% threshold (-5.2% / -$${lossAmount.toFixed(2)}). Step back and review your risk parameters.`
    ).catch(e => console.error("Failed sending session DD notification:", e));

    setGoalAlert({
      type: 'danger',
      message: `🚨 Critical Session Drawdown (-5.2%): Exceeded 5.0% maximum allowed single-session drawdown during ${currentSession}. Trading halt advised.`
    });
  };

  const handleResetPL = () => {
    setTradingStats(prev => ({
      ...prev,
      todayPL: "$0.00"
    }));
    setGoalAlert(null);
    fetchTrades();
  };

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

    const detail: MockTradeDetail = {
      date: `Jul ${dayNum < 10 ? '0' + dayNum : dayNum}, 2026`,
      netPL,
      netPLPercent: pct,
      startBalance: startBal,
      endBalance: endBal,
      deposit: 0,
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

  // Open diagnosis popup (Bento) with real trade engine calculations
  const triggerBentoAnalysis = (type: string) => {
    // Collect trade metrics
    const totalCount = closedTrades.length;
    const winsCount = closedTrades.filter(t => t.pl > 0).length;
    const lossesCount = closedTrades.filter(t => t.pl < 0).length;
    const grossProfit = closedTrades.filter(t => t.pl > 0).reduce((acc, t) => acc + t.pl, 0);
    const grossLoss = Math.abs(closedTrades.filter(t => t.pl < 0).reduce((acc, t) => acc + t.pl, 0));
    const winRate = totalCount > 0 ? (winsCount / totalCount) * 100 : overallWinRate;
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

    symbolList.sort((a, b) => a.totalPL - b.totalPL);
    const worstSymbolObj = symbolList.length > 0 ? symbolList[0] : null;
    const worstSymbol = worstSymbolObj && worstSymbolObj.totalPL < 0 ? worstSymbolObj.symbol : (symbolList[0]?.symbol || 'XAUUSD');
    const worstSymbolLoss = worstSymbolObj ? Math.abs(worstSymbolObj.totalPL) : 0;

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
        name,
        pl: s.pl,
        total: s.total,
        winRate: s.total > 0 ? (s.wins / s.total) * 100 : 0
      };
    });

    sessionsArray.sort((a, b) => b.winRate - a.winRate);
    const bestSession = sessionsArray[0];

    switch (type) {
      case 'leaks': {
        const typeLeakMsg = buyPL < sellPL 
          ? `BUY orders showed higher drag with ${buyWinRate.toFixed(1)}% win rate (Net: ${buyPL >= 0 ? '+' : ''}$${buyPL.toFixed(2)})`
          : `SELL orders showed higher drag with ${sellWinRate.toFixed(1)}% win rate (Net: ${sellPL >= 0 ? '+' : ''}$${sellPL.toFixed(2)})`;

        setActiveAnalysisPopup({
          title: "Find your biggest leaks",
          content: totalCount > 0 
            ? `Our engine scanned your ${totalCount} closed trades. The main performance leak stems from ${worstSymbol} with cumulative P&L of ${worstSymbolObj && worstSymbolObj.totalPL >= 0 ? '+' : '-'}$${worstSymbolLoss.toFixed(2)} across ${worstSymbolObj?.count || 0} orders. ${typeLeakMsg}. Your largest single loss recorded was -$${Math.abs(worstTradeVal).toFixed(2)}.`
            : `Our AI engine scanned your trade journal. No severe performance leaks detected in current history. Early data indicates optimal risk control across active instruments.`,
          recommendation: `System Advice: Enforce strict stop losses and reduce position sizing on ${worstSymbol} by 25%. Avoid holding losing trades past your initial risk threshold.`
        });
        break;
      }
      case 'evidence': {
        setActiveAnalysisPopup({
          title: "Review trades with evidence",
          content: totalCount > 0
            ? `Audited ${totalCount} verified MetaTrader execution tickets. Total Wins: ${winsCount} (Avg: +$${avgWin.toFixed(2)}), Total Losses: ${lossesCount} (Avg: -$${avgLoss.toFixed(2)}). Realized Reward-to-Risk Ratio is ${rewardToRisk.toFixed(2)}:1 across your logged history.`
            : `Audited account trade tickets. Currently 0 closed execution logs in record. Ensure all live terminal orders are synced to verify setup compliance.`,
          recommendation: `System Advice: Enforce a mandatory pre-trade entry checklist. Ensure every submitted market order maintains at least a 1.5:1 Risk-to-Reward ratio.`
        });
        break;
      }
      case 'steps': {
        const coachingNote = winRate >= 50 
          ? `Your overall win rate is solid at ${winRate.toFixed(1)}%. Focus on scaling up winning trades and trailing stop losses to maximize overall profit factor.`
          : `Your overall win rate is currently ${winRate.toFixed(1)}%. Priority focus should be tightening entry filters and avoiding low-probability setups.`;

        setActiveAnalysisPopup({
          title: "Get coachable next steps",
          content: `Your current Overall Win Rate is ${winRate.toFixed(1)}% with a Profit Factor of ${overallProfitFactor.toFixed(2)}. Total Net P&L stands at ${netPL >= 0 ? '+' : ''}$${netPL.toFixed(2)}. ${coachingNote}`,
          recommendation: `Coaching Lesson: Set break-even stops once price reaches 1R profit. Let winning trades run to initial TP targets to elevate your profit factor.`
        });
        break;
      }
      case 'artifacts': {
        const netPLPercent = currentBalanceValue > 0 ? (netPL / currentBalanceValue) * 100 : 0;
        setActiveAnalysisPopup({
          title: "Generate rich artifacts",
          content: `Compiled Account Performance Artifact. Total Executed Volume: ${totalVolumeLots.toFixed(2)} Lots across ${totalCount} orders. Estimated Return: ${netPLPercent >= 0 ? '+' : ''}${netPLPercent.toFixed(2)}%. Best Trade: +$${bestTradeVal.toFixed(2)}, Worst Trade: -$${Math.abs(worstTradeVal).toFixed(2)}. Gross Profit: +$${grossProfit.toFixed(2)}, Gross Loss: -$${grossLoss.toFixed(2)}.`,
          recommendation: `Actionable Summary: Export your daily and monthly summary cards to track long-term growth and share verified trading milestones.`
        });
        break;
      }
      case 'sessions': {
        const bestSessName = bestSession.total > 0 ? bestSession.name : 'London';
        const bestSessWinRate = bestSession.total > 0 ? bestSession.winRate : 68.0;
        const bestSessPL = bestSession.total > 0 ? bestSession.pl : netPL;

        setActiveAnalysisPopup({
          title: "Understand timing & sessions",
          content: totalCount > 0
            ? `Analyzed trade timestamps across London, New York, and Asian sessions. Your top performing session is ${bestSessName} with a ${bestSessWinRate.toFixed(1)}% win rate and ${bestSessPL >= 0 ? '+' : ''}$${bestSessPL.toFixed(2)} net P&L across ${bestSession.total} orders.`
            : `Analyzed trading session parameters. Historical market data shows European and NY session overlaps yield peak momentum for gold (XAUUSD) and major currencies.`,
          recommendation: `Timing Strategy: Align your primary execution window with ${bestSessName} session liquidity peaks to maximize win rate and minimize drawdown.`
        });
        break;
      }
      default: {
        const maxDD = netPL < 0 ? Math.abs(netPL) : 0;
        const avgLotSize = totalCount > 0 ? totalVolumeLots / totalCount : 0.1;

        setActiveAnalysisPopup({
          title: "Continue investigation",
          content: `Deep-dive risk investigation on account balance $${currentBalanceValue.toLocaleString()} across ${totalCount} orders. Recorded Max Drawdown: -$${maxDD.toFixed(2)}. Average position size: ${avgLotSize.toFixed(2)} Lots. BUY win rate: ${buyWinRate.toFixed(1)}%, SELL win rate: ${sellWinRate.toFixed(1)}%.`,
          recommendation: `Audit Trail: Log daily mental state ratings alongside execution notes. Review risk parameters weekly to align with evolving market conditions.`
        });
      }
    }
  };

  const renderCalendar = () => (
    <div className="space-y-3">
      {/* Aggregated indicators bar */}
      <div className="bg-white dark:bg-[#1B2132]/60 border border-slate-200 dark:border-gray-800/80 rounded-xl py-2 px-3 flex items-center justify-between text-center divide-x divide-slate-200 dark:divide-gray-800">
        <div className="flex-1 text-center">
          <p className="text-[9px] text-slate-400 dark:text-gray-500 uppercase font-bold font-roboto">Trades</p>
          <p className="text-[12px] font-black text-slate-900 dark:text-white font-roboto">{totalMonthlyTrades}</p>
        </div>
        <div className="flex-1 text-center">
          <p className="text-[9px] text-slate-400 dark:text-gray-500 uppercase font-bold font-roboto">Wins</p>
          <p className="text-[12px] font-black text-emerald-500 dark:text-emerald-400 font-roboto">{totalMonthlyWins}</p>
        </div>
        <div className="flex-1 text-center">
          <p className="text-[9px] text-slate-400 dark:text-gray-500 uppercase font-bold font-roboto">Profits</p>
          <p className={`text-[12px] font-black font-roboto ${totalMonthlyPL >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'}`}>
            ${totalMonthlyPL.toFixed(2)}
          </p>
        </div>
        <div className="flex-1 text-center">
          <p className="text-[9px] text-slate-400 dark:text-gray-500 uppercase font-bold font-roboto">Percent</p>
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

  return (
    <div className="py-2 w-full max-w-none relative">
      <div className="w-full animate-in fade-in duration-300">

      {/* HERO CARD (DYNAMIC: CURRENT MISSION OR LEDGER REPORT) */}
      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-[24px] p-4 shadow-md shadow-slate-200/40 text-slate-800 relative overflow-hidden mt-1 mb-4 border border-slate-200">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-50/50 rounded-full blur-3xl -ml-20 -mb-20" />
        
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${activeTab === 'goals' ? 'bg-emerald-400' : activeTab === 'ledger' ? 'bg-amber-400' : 'bg-indigo-400'}`} />
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 font-roboto">
                {activeTab === 'goals' ? t('common.journal.currentMission') : activeTab === 'ledger' ? t('common.journal.ledgerReport') : 'MetaTrader Executed History'}
              </span>
            </div>
            <div className="px-2 py-1 bg-white border border-slate-200 rounded-full text-[8px] font-black text-slate-600 shadow-sm backdrop-blur-md font-roboto tracking-[0.1em] uppercase">
              {activeTab === 'goals' ? t('common.journal.liveProtocol') : activeTab === 'ledger' ? t('common.journal.verifiedSync') : 'MetaTrader Sync'}
            </div>
          </div>
          
          <div className="space-y-0.5">
            <h2 className="text-[24px] font-black tracking-tighter leading-none font-roboto">
              {activeTab === 'goals' ? (
                <span className="text-slate-900">${weeklyAchievedPL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              ) : activeTab === 'ledger' ? (
                (() => {
                  const val = totalMonthlyPL;
                  const isLoss = val < 0;
                  return (
                    <span className={isLoss ? "text-rose-600" : "text-emerald-600"}>
                      {isLoss ? '-' : ''}${Math.abs(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  );
                })()
              ) : (
                (() => {
                  const val = closedTrades.reduce((acc, t) => acc + t.pl, 0);
                  const isLoss = val < 0;
                  return (
                    <span className={isLoss ? "text-rose-600" : "text-emerald-600"}>
                      {isLoss ? '-' : '+'}${Math.abs(val).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  );
                })()
              )}
            </h2>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold tracking-wide">
              {activeTab === 'goals' ? (
                <>
                  <span>{t('common.journal.goal')}: ${weeklyTargetAmount.toLocaleString()} {t('common.journal.weeklySuffix')}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span>{t('common.journal.risk')}: ${weeklyRiskAmount.toLocaleString()} {t('common.journal.max')}</span>
                </>
              ) : activeTab === 'ledger' ? (
                <>
                  <span>{t('common.journal.ytdPerformance')}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span>{t('common.journal.ytdLabel')}: {activeYearYTD >= 0 ? '+' : '-'}${Math.abs(activeYearYTD).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </>
              ) : (
                <>
                  <span>Total Trades: {totalTradesCount}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <span>Volume: {totalVolumeLots.toFixed(2)} Lot</span>
                </>
              )}
            </div>
          </div>

          <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent my-0.5" />

          <div className="grid grid-cols-3 gap-2 pt-0.5">
            <div className="space-y-0.5">
              <span className="text-[8px] uppercase tracking-[0.1em] text-slate-400 font-black block font-roboto">
                {activeTab === 'goals' ? t('common.journal.drawdown') : t('common.journal.maxDrawdown')}
              </span>
              <span className="text-sm font-black block leading-none font-roboto text-rose-500">
                {activeTab === 'goals' ? `${weeklyDDPercent.toFixed(1)}%` : `${totalMonthlyPL < 0 && currentBalanceValue > 0 ? ((Math.abs(totalMonthlyPL) / currentBalanceValue) * 100).toFixed(1) : '0.0'}%`}
              </span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[8px] uppercase tracking-[0.1em] text-slate-400 font-black block font-roboto">
                {t('common.journal.winRate')}
              </span>
              <span className="text-sm font-black block leading-none font-roboto text-emerald-500">
                {activeTab === 'goals' ? `${overallWinRate.toFixed(1)}%` : `${monthlyWinRate.toFixed(1)}%`}
              </span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[8px] uppercase tracking-[0.1em] text-slate-400 font-black block font-roboto">
                {t('common.journal.profitFactor')}
              </span>
              <span className="text-sm font-black block leading-none font-roboto text-indigo-500">
                {overallProfitFactor.toFixed(2)}
              </span>
            </div>
          </div>

          <button
            onClick={() => openShareCard()}
            className="w-full mt-2.5 py-2 px-3 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white rounded-xl font-black text-[10px] uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-indigo-600/20 transition-all active:scale-[0.98] group"
          >
            <Share2 size={13} className="group-hover:rotate-12 transition-transform" />
            Generate Shareable Summary Card
          </button>
        </div>
      </div>
      
      {/* 3 COMPACT CARDS SIDE-BY-SIDE (3 COLUMNS) WITHOUT GLASS EFFECT */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-3 mb-5">
        
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
                <span className='text-[10px] sm:text-[11px] font-black truncate text-white'>Mission Goal</span>
              </div>
              {activeTab === 'goals' && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" title="Active" />
              )}
            </div>

            <p className='text-[9px] sm:text-[10px] leading-tight font-medium line-clamp-2 text-indigo-100'>
              Target profit & risk rules.
            </p>
          </div>

          <div className='pt-1.5 flex items-center justify-between text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider text-indigo-200'>
            <span>Goal</span>
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
              Kalender & evaluasi AI.
            </p>
          </div>

          <div className='pt-1.5 flex items-center justify-between text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider text-violet-200'>
            <span>{t('common.journal.ledger')}</span>
            <span className="font-black">→</span>
          </div>
        </div>

        {/* CARD 3: METATRADER HISTORY */}
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
                <History size={13} className='text-purple-200 shrink-0' />
                <span className='text-[10px] sm:text-[11px] font-black truncate text-white'>History</span>
              </div>
              {activeTab === 'history' && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" title="Active" />
              )}
            </div>

            <p className='text-[9px] sm:text-[10px] leading-tight font-medium line-clamp-2 text-purple-100'>
              Tiket eksekusi MetaTrader.
            </p>
          </div>

          <div className='pt-1.5 flex items-center justify-between text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider text-purple-200'>
            <span>History</span>
            <span className="font-black">→</span>
          </div>
        </div>

      </div>

      <div className="relative w-full">
        <div className="lg:grid lg:grid-cols-12 lg:gap-6 items-start space-y-4 lg:space-y-0 transition-all duration-300">
          
          {/* Main Content Column (Left Column on Desktop) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
      {/* TAB 1: MISSION GOAL */}
      {activeTab === 'goals' && (
        <div className="space-y-4">
          
          {/* INPUT FORM CARD */}
          <div className="bg-indigo-50 border border-indigo-100 dark:bg-indigo-600/10 dark:border-indigo-500/20 rounded-3xl p-5 space-y-4 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] relative overflow-hidden">
            <h3 className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Sparkles size={14} className="text-indigo-500" />
              {t('common.journal.setWeeklyMissionTargets')}
            </h3>

            {/* Helper Note for User */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 flex items-start gap-2.5 text-amber-900 dark:text-amber-200">
              <Info size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-[11px] font-medium leading-relaxed">
                <p className="font-bold text-amber-900 dark:text-amber-100 mb-0.5">{t('common.journal.weeklyTargetDescription')}</p>
                <p>{t('common.journal.weeklyTargetHelper')}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Target Input */}
              <div className="relative">
                <input
                  type="number"
                  value={weeklyTargetInput}
                  placeholder="Fill Your Target"
                  onChange={(e) => handleTargetInputChange(e.target.value)}
                  className="w-full bg-white dark:bg-[#121620] border border-slate-200 dark:border-gray-800 text-slate-900 dark:text-white rounded-xl pl-3 pr-7 py-2.5 text-xs font-bold placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">$</span>
              </div>

              {/* Drawdown Risk Input */}
              <div className="relative">
                <input
                  type="number"
                  value={weeklyRiskInput}
                  placeholder="Fill Your DD Limit"
                  onChange={(e) => handleRiskInputChange(e.target.value)}
                  className="w-full bg-white dark:bg-[#121620] border border-slate-200 dark:border-gray-800 text-slate-900 dark:text-white rounded-xl pl-3 pr-7 py-2.5 text-xs font-bold placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-bold">$</span>
              </div>
            </div>

            <button
              onClick={handleSaveTargets}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition shadow-md cursor-pointer"
            >
              {t('common.journal.saveTarget')}
            </button>

            {/* PROGRESS BARS CARD (WEEKLY & DAILY MISSION PROGRESS SYSTEM) */}
            <div className="bg-white dark:bg-[#121620] rounded-2xl border border-slate-200 dark:border-gray-800 p-4 shadow-sm space-y-3.5 relative overflow-hidden mt-4">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <Target size={15} className="text-indigo-600 dark:text-indigo-400" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-gray-200 font-roboto">
                    {t('common.journal.progressSystemTitle')}
                  </h4>
                </div>
                <span className="text-[10px] font-bold text-slate-500 dark:text-gray-400 bg-slate-100 dark:bg-gray-800 px-2 py-0.5 rounded-md font-mono">
                  {t('common.journal.weeklyProtocol')}
                </span>
              </div>

              {/* BAR 1: WEEKLY MISSION TARGET */}
              <div className="space-y-1.5 bg-slate-50 dark:bg-gray-800/40 border border-slate-100 dark:border-gray-800 p-3 rounded-xl">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-gray-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {t('common.journal.weeklyTargetProgress')}
                  </span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono">
                    {weeklyTargetPercent.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden">
                  <motion.div 
                    className="bg-emerald-500 h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${weeklyTargetPercent}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
                {/* Report Below Bar */}
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-gray-400 pt-0.5">
                  <span>{t('common.journal.weeklyTarget')}</span>
                  <span className="font-bold text-slate-700 dark:text-gray-200">
                    ${weeklyAchievedPL % 1 === 0 ? weeklyAchievedPL.toFixed(0) : weeklyAchievedPL.toFixed(2)} / ${weeklyTargetAmount % 1 === 0 ? weeklyTargetAmount.toFixed(0) : weeklyTargetAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* BAR 2: WEEKLY LIMIT DD (MAX DRAWDOWN) */}
              <div className="space-y-1.5 bg-slate-50 dark:bg-gray-800/40 border border-slate-100 dark:border-gray-800 p-3 rounded-xl">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 dark:text-gray-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    {t('common.journal.weeklyLimitDD')}
                  </span>
                  <span className="font-black text-rose-600 dark:text-rose-400 font-mono">
                    {weeklyDDPercent.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-gray-700 h-2.5 rounded-full overflow-hidden">
                  <motion.div 
                    className="bg-rose-500 h-full rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${weeklyDDPercent}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
                {/* Report Below Bar */}
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-gray-400 pt-0.5">
                  <span>{t('common.journal.weeklyDDLimit')}</span>
                  <span className="font-bold text-slate-700 dark:text-gray-200">
                    ${currentWeeklyDD % 1 === 0 ? currentWeeklyDD.toFixed(0) : currentWeeklyDD.toFixed(2)} / ${weeklyRiskAmount % 1 === 0 ? weeklyRiskAmount.toFixed(0) : weeklyRiskAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* DAILY BREAKDOWN SYSTEM BARS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 border-t border-slate-100 dark:border-gray-800">
                {/* Daily Target Bar */}
                <div className="space-y-1 bg-slate-50/70 dark:bg-gray-800/20 p-2.5 rounded-xl border border-slate-100 dark:border-gray-800/60">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-600 dark:text-gray-400">{t('common.journal.dailyTarget')}</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{dailyTargetPercent.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                    <motion.div 
                      className="bg-emerald-500 h-full rounded-full"
                      animate={{ width: `${dailyTargetPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-gray-400 pt-0.5">
                    <span>{t('common.journal.dailyTargetLabel')}</span>
                    <span className="font-bold text-slate-700 dark:text-gray-200">
                      ${dailyAchievedPL % 1 === 0 ? dailyAchievedPL.toFixed(0) : dailyAchievedPL.toFixed(2)} / ${dailyTargetAmount % 1 === 0 ? dailyTargetAmount.toFixed(0) : dailyTargetAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Daily Limit DD Bar */}
                <div className="space-y-1 bg-slate-50/70 dark:bg-gray-800/20 p-2.5 rounded-xl border border-slate-100 dark:border-gray-800/60">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-600 dark:text-gray-400">{t('common.journal.dailyMaxDD')}</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400 font-mono">{dailyDDPercent.toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                    <motion.div 
                      className="bg-rose-500 h-full rounded-full"
                      animate={{ width: `${dailyDDPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 dark:text-gray-400 pt-0.5">
                    <span>{t('common.journal.dailyMaxDDLabel')}</span>
                    <span className="font-bold text-slate-700 dark:text-gray-200">
                      ${dailyCurrentDD % 1 === 0 ? dailyCurrentDD.toFixed(0) : dailyCurrentDD.toFixed(2)} / ${dailyRiskLimitAmount % 1 === 0 ? dailyRiskLimitAmount.toFixed(0) : dailyRiskLimitAmount.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PERFORMANCE VS TARGET SUMMARY CHARTS CARD */}
          <div className="bg-white/95 dark:bg-[#121620] backdrop-blur-md border border-slate-200 dark:border-gray-800 rounded-3xl p-5 space-y-4 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white tracking-wide uppercase flex items-center gap-1.5">
                  <BarChart3 size={15} className="text-indigo-600" />
                  {t('common.journal.perfVisualTitle')}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">{t('common.journal.perfVisualDesc')}</p>
              </div>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 dark:text-indigo-300 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800/50">
                {t('common.journal.liveStats')}
              </span>
            </div>

            {/* Dynamic Status / Visual Alert Box (Moved from Simulator) */}
            {goalAlert && (
              <div className={`p-3 rounded-xl border flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2 shadow-sm ${
                goalAlert.type === 'success' 
                  ? 'bg-[#F0FDF4] border-[#DCFCE7] text-slate-900' 
                  : 'bg-[#FFF1F2] border-[#FFE4E6] text-slate-900'
              }`}>
                {goalAlert.type === 'success' ? (
                  <CheckCircle size={16} className="shrink-0 mt-0.5 text-emerald-600" />
                ) : (
                  <ShieldAlert size={16} className="shrink-0 mt-0.5 text-rose-600" />
                )}
                <div className="text-[10px]">
                  <span className={`font-black uppercase tracking-widest block mb-0.5 ${goalAlert.type === 'success' ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {goalAlert.type === 'success' ? t('common.journal.targetMet') : t('common.journal.cautionLimit')}
                  </span>
                  <span className={`leading-normal font-bold text-slate-800`}>{goalAlert.message}</span>
                </div>
              </div>
            )}

            <div className="h-60 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    {
                      name: t('common.journal.daily'),
                      Aktual: Math.max(0, dailyAchievedPL),
                      Target: Number(dailyTargetAmount) || 0,
                      Drawdown: dailyCurrentDD,
                      BatasDD: Number(dailyRiskLimitAmount) || 0,
                    },
                    {
                      name: t('common.journal.weekly'),
                      Aktual: Math.max(0, weeklyAchievedPL),
                      Target: Number(weeklyTargetAmount) || 0,
                      Drawdown: currentWeeklyDD,
                      BatasDD: Number(weeklyRiskAmount) || 0,
                    },
                  ]}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                    formatter={(value) => [`$${value}`, '']}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="Aktual" fill="#10b981" radius={[4, 4, 0, 0]} name={t('common.journal.actualProfit')} />
                  <Bar dataKey="Target" fill="#6366f1" radius={[4, 4, 0, 0]} name={t('common.journal.targetProfit')} />
                  <Bar dataKey="Drawdown" fill="#f43f5e" radius={[4, 4, 0, 0]} name={t('common.journal.actualDD')} />
                  <Bar dataKey="BatasDD" fill="#cbd5e1" radius={[4, 4, 0, 0]} name={t('common.journal.maxDDLimit')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Interactive Target Alert Demonstrations (Kept so notifs work!) */}
            <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-gray-800">
              <div className="text-[8px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-widest text-center">
                {t('common.journal.interactiveDemo')}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleSimulateWin}
                  className="py-2 px-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 dark:bg-emerald-600/10 dark:hover:bg-emerald-600/20 dark:border-emerald-500/20 rounded-xl text-[9px] font-bold text-emerald-600 dark:text-emerald-400 transition"
                >
                  {t('common.journal.simProfit')}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleSimulateLoss}
                  className="py-2 px-1 bg-rose-50 hover:bg-rose-100 border border-rose-100 dark:bg-rose-600/10 dark:hover:bg-rose-600/20 dark:border-rose-500/20 rounded-xl text-[9px] font-bold text-rose-600 dark:text-rose-400 transition"
                >
                  {t('common.journal.simDD')}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleSimulateSessionDrawdown}
                  className="py-2 px-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 dark:bg-amber-600/10 dark:hover:bg-amber-600/20 dark:border-amber-500/20 rounded-xl text-[9px] font-bold text-amber-700 dark:text-amber-400 transition"
                >
                  🚨 Sim &gt;5% Session DD
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleResetPL}
                  className="py-2 px-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 dark:bg-[#1B2132] dark:hover:bg-[#252E46] dark:border-gray-800 rounded-xl text-[9px] font-bold text-slate-700 dark:text-gray-300 transition"
                >
                  {t('common.journal.resetStatus')}
                </motion.button>
              </div>
            </div>
          </div>

          {/* DETAILED PAST TRADING SESSIONS TABLE (TRADE HISTORY) */}
          <div className="bg-white/95 dark:bg-[#121620] backdrop-blur-md border border-slate-200 dark:border-gray-800 rounded-3xl p-5 space-y-4 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-900 dark:text-white tracking-wide uppercase flex items-center gap-1.5">
                  <TrendingUp size={15} className="text-emerald-600" />
                  {t('common.journal.historyTitle')}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">{t('common.journal.historyDesc')}</p>
              </div>
              <span className="text-[10px] font-bold text-slate-600 dark:text-gray-300 bg-slate-100 dark:bg-gray-800 px-2.5 py-1 rounded-full border border-slate-200 dark:border-gray-700">
                {t('common.journal.last5Sessions')}
              </span>
            </div>

            {closedTrades.length === 0 ? (
              <div className="bg-white dark:bg-[#121620] border border-slate-200 dark:border-gray-800 rounded-3xl p-6 text-center space-y-5 shadow-xs">
                <div className="relative w-14 h-14 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-2xl -rotate-6" />
                  <div className="relative w-14 h-14 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-md">
                    <BookOpen size={26} />
                  </div>
                </div>

                <div className="max-w-md mx-auto space-y-1">
                  <h4 className="text-sm font-black text-slate-800 dark:text-white">
                    No MetaTrader Trading History Logged
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed">
                    Connect your MetaTrader account or input your target goals to populate your daily execution trading journal and winrate analytics.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left max-w-2xl mx-auto">
                  <div 
                    onClick={() => setActiveView('account')}
                    className="p-3 bg-slate-50 dark:bg-slate-900/50 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-2xl space-y-1 transition-all duration-200 cursor-pointer active:scale-[0.98] group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-950/60 group-hover:bg-indigo-600 group-hover:text-white text-indigo-600 dark:text-indigo-400 text-[9px] font-black flex items-center justify-center transition-colors">1</span>
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Connect MetaTrader</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-gray-400 leading-normal">
                      Link your MT4/MT5 account in Account Settings to stream executed tickets live.
                    </p>
                  </div>

                  <div 
                    onClick={() => { setActiveTab('goals'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="p-3 bg-slate-50 dark:bg-slate-900/50 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-2xl space-y-1 transition-all duration-200 cursor-pointer active:scale-[0.98] group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-950/60 group-hover:bg-indigo-600 group-hover:text-white text-indigo-600 dark:text-indigo-400 text-[9px] font-black flex items-center justify-center transition-colors">2</span>
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Set Risk Targets</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-gray-400 leading-normal">
                      Define weekly target profit and risk limits in the Mission Goals section above.
                    </p>
                  </div>

                  <div 
                    onClick={() => { setActiveTab('ledger'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="p-3 bg-slate-50 dark:bg-slate-900/50 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-2xl space-y-1 transition-all duration-200 cursor-pointer active:scale-[0.98] group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-950/60 group-hover:bg-indigo-600 group-hover:text-white text-indigo-600 dark:text-indigo-400 text-[9px] font-black flex items-center justify-center transition-colors">3</span>
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Auto Journaling</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-gray-400 leading-normal">
                      Track win rate, profit factors, drawdowns, and daily sessions automatically.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-gray-800 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-3">{t('common.journal.dateSession')}</th>
                      <th className="py-3 px-3">{t('common.journal.symbolAsset')}</th>
                      <th className="py-3 px-3">{t('common.journal.pl')}</th>
                      <th className="py-3 px-3">Lot</th>
                      <th className="py-3 px-3 text-right">{t('common.journal.status')}</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-slate-100 dark:divide-gray-800 font-medium">
                    {closedTrades.slice(-5).reverse().map((tr: any) => (
                      <tr key={tr.id || Math.random()} className="hover:bg-slate-50/80 dark:hover:bg-gray-800/40 transition">
                        <td className="py-3.5 px-3 text-slate-900 dark:text-white font-semibold">
                          {tr.closeTime ? parseUTCDate(tr.closeTime).toLocaleDateString(navigator.language || 'id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZoneName: 'short', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }).replace(/\s*(AM|PM|am|pm)/gi, '') : '-'}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="bg-slate-100 dark:bg-gray-800 text-slate-800 dark:text-gray-200 px-2 py-0.5 rounded font-bold text-[11px]">{tr.symbol}</span>
                        </td>
                        <td className={`py-3.5 px-3 font-bold ${tr.pl >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {tr.pl >= 0 ? '+' : ''}${tr.pl.toFixed(2)}
                        </td>
                        <td className="py-3.5 px-3 text-slate-600 dark:text-gray-400">{tr.lots} Lot</td>
                        <td className="py-3.5 px-3 text-right">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            tr.pl >= 0 
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' 
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                          }`}>
                            {tr.pl >= 0 ? 'Profit' : 'Loss'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
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
                  Calender Bulanan
                </span>
              </div>

              {/* Navigation button */}
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setActiveMonth(prev => prev === 0 ? 11 : prev - 1)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg text-slate-400 dark:text-gray-500 hover:text-slate-900 dark:text-white transition"
                >
                  <ChevronLeft size={14} />
                </button>
                <button 
                  onClick={() => setActiveMonth(prev => prev === 11 ? 0 : prev + 1)}
                  className="p-1 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg text-slate-400 dark:text-gray-500 hover:text-slate-900 dark:text-white transition"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {renderCalendar()}

            <div className="text-center text-[7.5px] text-slate-400 dark:text-gray-500 font-bold tracking-wider uppercase">
              💡 Tap any active transaction day to examine detailed broker tickets
            </div>
          </div>

          {/* SECTION 3: YEARLY CALENDAR PERFORMANCE */}
          <div className="bg-indigo-50 border border-indigo-100 dark:bg-indigo-600/10 dark:border-indigo-500/20 rounded-2xl p-4 space-y-3.5 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">Yearly Performance</span>
                <span className="text-[9px] text-violet-500 dark:text-violet-400 font-bold bg-violet-50 border border-violet-100 dark:bg-violet-500/10 dark:border-violet-500/10 px-2 py-0.5 rounded">
                  {activeYear} {t('common.journal.ledger')}
                </span>
              </div>

              {/* Selector for year */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#1B2132] border border-slate-200 dark:border-gray-800 px-2 py-1 rounded-lg">
                <button 
                  onClick={() => setActiveYear(2025)}
                  className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded transition ${activeYear === 2025 ? 'bg-indigo-600 text-white' : 'text-slate-400 dark:text-gray-500'}`}
                >
                  2025
                </button>
                <button 
                  onClick={() => setActiveYear(2026)}
                  className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded transition ${activeYear === 2026 ? 'bg-indigo-600 text-white' : 'text-slate-400 dark:text-gray-500'}`}
                >
                  2026
                </button>
              </div>
            </div>

            {/* Year aggregate YTD ribbon */}
            <div className="bg-rose-50 border border-rose-100 dark:bg-[#DE3C4B]/5 dark:border-rose-500/10 p-2 rounded-xl flex items-center justify-between">
              <span className="text-[9px] font-black text-slate-400 dark:text-gray-500 uppercase tracking-wider">YTD Total Returns</span>
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
                        startBalance: currentBalanceValue || 10000,
                        endBalance: (currentBalanceValue || 10000) + (monthData.rawPL || 0),
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

          {/* SECTION 4: ANALYSIS & INVESTIGATION BENTO */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 px-1">
              <BrainCircuit size={15} className="text-indigo-400" />
              <h3 className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                Accumulation Analysis & Investigation
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              
              {/* Bento Card 1 */}
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                onClick={() => triggerBentoAnalysis('leaks')}
                className="group bg-white dark:bg-[#121620] hover:bg-[#141926] border border-gray-200 dark:border-gray-800 hover:border-indigo-500/20 rounded-2xl p-4 text-left transition duration-300 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/[0.01] group-hover:bg-red-500/[0.03] rounded-full blur-lg pointer-events-none transition" />
                <div className="p-2 bg-rose-500/10 border border-rose-500/10 text-rose-400 rounded-xl w-fit mb-3 group-hover:border-rose-500/20 transition">
                  <TrendingDown size={16} />
                </div>
                <h4 className="text-[14px] font-bold text-gray-900 dark:text-white group-hover:text-indigo-300 transition block font-roboto">
                  Find your biggest leaks
                </h4>
                <p className="text-[12px] text-gray-400 dark:text-gray-500 leading-normal mt-1.5 font-roboto">
                  Analyze what is hurting results and find the trades, sessions, or habits behind it.
                </p>
              </motion.button>

              {/* Bento Card 2 */}
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                onClick={() => triggerBentoAnalysis('evidence')}
                className="group bg-white dark:bg-[#121620] hover:bg-[#141926] border border-gray-200 dark:border-gray-800 hover:border-indigo-500/20 rounded-2xl p-4 text-left transition duration-300 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/[0.01] group-hover:bg-blue-500/[0.03] rounded-full blur-lg pointer-events-none transition" />
                <div className="p-2 bg-gray-100 dark:bg-[#1B2132] border border-gray-200 dark:border-gray-800 text-indigo-400 rounded-xl w-fit mb-3 group-hover:border-indigo-500/20 transition">
                  <Layers size={16} />
                </div>
                <h4 className="text-[14px] font-bold text-gray-900 dark:text-white group-hover:text-indigo-300 transition block font-roboto">
                  Review trades with evidence
                </h4>
                <p className="text-[12px] text-gray-400 dark:text-gray-500 leading-normal mt-1.5 font-roboto">
                  Pull worst trades, recent tables, journal notes, and account context directly.
                </p>
              </motion.button>

              {/* Bento Card 3 */}
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                onClick={() => triggerBentoAnalysis('steps')}
                className="group bg-white dark:bg-[#121620] hover:bg-[#141926] border border-gray-200 dark:border-gray-800 hover:border-indigo-500/20 rounded-2xl p-4 text-left transition duration-300 relative overflow-hidden"
              >
                <div className="p-2 bg-emerald-500/10 border border-emerald-500/10 text-emerald-400 rounded-xl w-fit mb-3 group-hover:border-emerald-500/20 transition">
                  <Compass size={16} />
                </div>
                <h4 className="text-[14px] font-bold text-gray-900 dark:text-white group-hover:text-indigo-300 transition block font-roboto">
                  Get coachable next steps
                </h4>
                <p className="text-[12px] text-gray-400 dark:text-gray-500 leading-normal mt-1.5 font-roboto">
                  Turn broad performance questions into focused reviews of what to fix, test, or watch next.
                </p>
              </motion.button>

              {/* Bento Card 4 */}
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                onClick={() => triggerBentoAnalysis('artifacts')}
                className="group bg-white dark:bg-[#121620] hover:bg-[#141926] border border-gray-200 dark:border-gray-800 hover:border-indigo-500/20 rounded-2xl p-4 text-left transition duration-300 relative overflow-hidden"
              >
                <div className="p-2 bg-violet-500/10 border border-violet-500/10 text-violet-400 rounded-xl w-fit mb-3 group-hover:border-violet-500/20 transition">
                  <ArrowUpRight size={16} />
                </div>
                <h4 className="text-[14px] font-bold text-gray-900 dark:text-white group-hover:text-indigo-300 transition block font-roboto">
                  Generate rich artifacts
                </h4>
                <p className="text-[12px] text-gray-400 dark:text-gray-500 leading-normal mt-1.5 font-roboto">
                  Create summaries, tables, comparisons, and breakdowns that make answers actionable.
                </p>
              </motion.button>

              {/* Bento Card 5 */}
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                onClick={() => triggerBentoAnalysis('sessions')}
                className="group bg-white dark:bg-[#121620] hover:bg-[#141926] border border-gray-200 dark:border-gray-800 hover:border-indigo-500/20 rounded-2xl p-4 text-left transition duration-300 relative overflow-hidden"
              >
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/10 text-indigo-400 rounded-xl w-fit mb-3 group-hover:border-indigo-500/20 transition">
                  <Clock size={16} />
                </div>
                <h4 className="text-[14px] font-bold text-gray-900 dark:text-white group-hover:text-indigo-300 transition block font-roboto">
                  Understand timing & sessions
                </h4>
                <p className="text-[12px] text-gray-400 dark:text-gray-500 leading-normal mt-1.5 font-roboto">
                  See how time of day, session choice, and trading rhythm shape your outcomes.
                </p>
              </motion.button>

              {/* Bento Card 6 */}
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                onClick={() => triggerBentoAnalysis('investigation')}
                className="group bg-white dark:bg-[#121620] hover:bg-[#141926] border border-gray-200 dark:border-gray-800 hover:border-indigo-500/20 rounded-2xl p-4 text-left transition duration-300 relative overflow-hidden"
              >
                <div className="p-2 bg-amber-500/10 border border-amber-500/10 text-amber-400 rounded-xl w-fit mb-3 group-hover:border-amber-500/20 transition">
                  <History size={16} />
                </div>
                <h4 className="text-[14px] font-bold text-gray-900 dark:text-white group-hover:text-indigo-300 transition block font-roboto">
                  Continue investigation
                </h4>
                <p className="text-[12px] text-gray-400 dark:text-gray-500 leading-normal mt-1.5 font-roboto">
                  Ask follow-up questions on the same account or specific finding to maintain audit context.
                </p>
              </motion.button>

            </div>
          </div>

        </div>
      )}

      {/* TAB 3: EXECUTED METATRADER HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          
          {/* HEADER SUMMARY CARD */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 shadow-lg space-y-3 relative overflow-hidden border border-indigo-900/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History size={18} className="text-amber-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-amber-300 font-roboto">
                  MetaTrader Executed History
                </h3>
              </div>
              <button
                onClick={handleSyncMetaTrader}
                disabled={loadingTrades}
                className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 transition rounded-full text-[10px] font-bold text-slate-200 border border-white/10 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={12} className={loadingTrades ? "animate-spin text-amber-400" : "text-amber-400"} />
                <span>{loadingTrades ? "Syncing..." : "Sync MetaTrader"}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-roboto">Total Trades</span>
                <span className="text-base font-black text-white font-roboto">{totalTradesCount}</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-roboto">Win Rate</span>
                <span className="text-base font-black text-emerald-400 font-roboto">{overallWinRate.toFixed(1)}%</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-roboto">Total Volume</span>
                <span className="text-base font-black text-amber-300 font-roboto">{totalVolumeLots.toFixed(2)} L</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block font-roboto">Profit Factor</span>
                <span className="text-base font-black text-indigo-300 font-roboto">{overallProfitFactor.toFixed(2)}</span>
              </div>
            </div>
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
                  className={`px-3 py-1 rounded-lg text-[10px] font-black tracking-wider transition ${
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

          {/* TRADES TABLE / LIST */}
          {filteredHistoryTrades.length === 0 ? (
            <div className="bg-white dark:bg-[#121620] border border-slate-200 dark:border-gray-800 rounded-3xl p-6 text-center space-y-5 shadow-xs">
              <div className="relative w-14 h-14 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-2xl rotate-6" />
                <div className="relative w-14 h-14 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-md">
                  <History size={26} />
                </div>
              </div>

              <div className="max-w-md mx-auto space-y-1">
                <h4 className="text-sm font-black text-slate-800 dark:text-white">
                  {closedTrades.length === 0 ? "No MetaTrader Execution Logs Found" : "No Trades Match Your Search"}
                </h4>
                <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed">
                  {closedTrades.length === 0 
                    ? "Your execution log is empty. Sync your MetaTrader account or execute trades to view real-time ticket logs."
                    : "No transactions match your current search term or filter parameters."}
                </p>
              </div>

              {closedTrades.length === 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left max-w-2xl mx-auto">
                  <div 
                    onClick={() => setActiveView('account')}
                    className="p-3 bg-slate-50 dark:bg-slate-900/50 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-2xl space-y-1 transition-all duration-200 cursor-pointer active:scale-[0.98] group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-950/60 group-hover:bg-indigo-600 group-hover:text-white text-indigo-600 dark:text-indigo-400 text-[9px] font-black flex items-center justify-center transition-colors">1</span>
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Link Broker Terminal</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-gray-400 leading-normal">
                      Sync MetaTrader credentials to stream closed order tickets automatically.
                    </p>
                  </div>

                  <div 
                    onClick={() => { setActiveTab('goals'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="p-3 bg-slate-50 dark:bg-slate-900/50 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-2xl space-y-1 transition-all duration-200 cursor-pointer active:scale-[0.98] group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-950/60 group-hover:bg-indigo-600 group-hover:text-white text-indigo-600 dark:text-indigo-400 text-[9px] font-black flex items-center justify-center transition-colors">2</span>
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Log Entry/Exit Data</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-gray-400 leading-normal">
                      Captures open/close prices, lot sizing, and net P&L with precise timestamps.
                    </p>
                  </div>

                  <div 
                    onClick={() => { setActiveTab('history'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className="p-3 bg-slate-50 dark:bg-slate-900/50 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-2xl space-y-1 transition-all duration-200 cursor-pointer active:scale-[0.98] group"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-950/60 group-hover:bg-indigo-600 group-hover:text-white text-indigo-600 dark:text-indigo-400 text-[9px] font-black flex items-center justify-center transition-colors">3</span>
                      <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Export & Audit</span>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-gray-400 leading-normal">
                      Filter by Buy/Sell, asset symbol, or date ranges for detailed trade audits.
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
                  Clear History Filters
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold px-1">
                <span>Showing {filteredHistoryTrades.length} of {closedTrades.length} trades</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-mono">Real-time MetaTrader Sync</span>
              </div>

              <div className="space-y-2.5">
                {filteredHistoryTrades.map((t, idx) => (
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
                        <span className="text-[11px] text-slate-500 font-bold font-mono">{t.lots} Lot</span>
                      </div>
                      
                      <div className="text-right">
                        <span className={`text-sm font-black font-roboto block ${t.pl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {t.pl >= 0 ? '+' : ''}${t.pl.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono text-slate-500 dark:text-gray-400 bg-slate-50 dark:bg-gray-900/40 p-2.5 rounded-xl border border-slate-100 dark:border-gray-800/80">
                      <div>
                        <span className="block text-[8px] uppercase tracking-wider text-slate-400">Open Price</span>
                        <span className="font-bold text-slate-700 dark:text-gray-300">${t.openPrice?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] uppercase tracking-wider text-slate-400">Close Price</span>
                        <span className="font-bold text-slate-700 dark:text-gray-300">${t.closePrice?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] uppercase tracking-wider text-slate-400">Commission / Swap</span>
                        <span className="font-bold text-slate-700 dark:text-gray-300">${((t.commission || 0) + (t.swap || 0)).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] uppercase tracking-wider text-slate-400">Close Time</span>
                        <span className="font-bold text-slate-700 dark:text-gray-300">
                          {t.closeTime ? parseUTCDate(t.closeTime).toLocaleDateString(navigator.language || 'id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false, timeZoneName: 'short', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }).replace(/\s*(AM|PM|am|pm)/gi, '') : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
        
        {/* Desktop Right Sidebar: Monthly Calendar & Analytics (Desktop Only) */}
        <div className="hidden lg:block lg:col-span-5 xl:col-span-4 space-y-4 sticky top-4">
          
          {/* Monthly Calendar Widget Card */}
          <div className="bg-[#EFF2F6]/90 dark:bg-slate-900/80 backdrop-blur-md border border-[#E2E8F0] dark:border-slate-800 rounded-3xl p-4 shadow-sm space-y-3.5 relative">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Calendar size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Kalender P&L Bulanan
                  </h3>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Laporan Harian Trading</p>
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
                  className="p-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                  title="Bulan Sebelumnya"
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
                  className="p-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                  title="Bulan Selanjutnya"
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
              <span className="text-[10px] font-black uppercase tracking-wider text-indigo-300">Target Protocol</span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                {weeklyAchievedPL >= weeklyTargetAmount ? 'Target Met 🎉' : 'In Progress'}
              </span>
            </div>
            
            <div className="space-y-1 relative z-10">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-300">Pencapaian Mingguan</span>
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
              <span>Atur Ulang Target & Batas Risiko</span>
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
              className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
            />
            <motion.div 
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed right-4 top-4 bottom-4 w-[85%] max-w-sm z-[120] shadow-2xl flex flex-col rounded-3xl border bg-[#F0FDF4] border-[#DCFCE7] pointer-events-auto overflow-hidden`}
            >
              
              {/* Header */}
              <div className="p-5 border-b border-black/5 flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1.5 font-roboto">
                  <BrainCircuit size={16} className="text-slate-800" />
                  AI Smart Diagnosis
                </span>
                <button 
                  onClick={() => setActiveAnalysisPopup(null)}
                  className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-black/10 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Content body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6 no-scrollbar">
                <div className="bg-white/40 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={16} className="text-slate-900" />
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">{activeAnalysisPopup.title}</h4>
                  </div>
                  <p className="text-[13px] text-slate-800 leading-relaxed font-bold">
                    {activeAnalysisPopup.content}
                  </p>
                </div>

                <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xl relative overflow-hidden">
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-3">
                      <Target size={16} className="text-indigo-400" />
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Strategic Recommendation</h4>
                    </div>
                    <p className="text-[13px] text-gray-100 leading-relaxed font-medium">
                      {activeAnalysisPopup.recommendation}
                    </p>
                  </div>
                  <div className="absolute top-0 right-0 p-2 opacity-10">
                    <BrainCircuit size={80} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/40 backdrop-blur-md rounded-2xl p-3 border border-white/20 shadow-sm">
                    <span className="text-[8px] font-bold text-slate-600 uppercase block mb-1">Confidence</span>
                    <span className="text-lg font-black text-slate-900">92%</span>
                  </div>
                  <div className="bg-white/40 backdrop-blur-md rounded-2xl p-3 border border-white/20 shadow-sm">
                    <span className="text-[8px] font-bold text-slate-600 uppercase block mb-1">Risk Bias</span>
                    <span className="text-lg font-black text-slate-900">Low</span>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-black/5 border-t border-black/5">
                <button 
                  onClick={() => setActiveAnalysisPopup(null)}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-lg"
                >
                  Acknowledge
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
