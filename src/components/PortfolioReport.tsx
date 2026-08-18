import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Share2, Info, ChevronRight, CheckCircle2, AlertTriangle, 
  XCircle, TrendingUp, HelpCircle, Shield, Sparkles, Activity, Clock, 
  BarChart2, RefreshCw, Layers, ShieldAlert, Award, FileText, Circle
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import { apiFetch } from '../utils/apiFetch';

interface PortfolioReportProps {
  trades: any[];
  activeAccountInfo: any;
  loadingTrades: boolean;
  onBack: () => void;
  onRefresh: () => Promise<void>;
}

export function PortfolioReport({ trades, activeAccountInfo, loadingTrades, onBack, onRefresh }: PortfolioReportProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | 'ytd' | 'all'>('30d');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [aiDiagnosis, setAiDiagnosis] = useState<any>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [completedActions, setCompletedActions] = useState<Record<string, boolean>>({});

  const isBalanceDeal = (t: any) => {
    return (t.type || '').toUpperCase() === 'BALANCE' || 
           /(deposit|withdrawal|credit|balance|transfer)/i.test(t.comment || t.type || '');
  };

  // --- 1. FILTER TRADES BY PERIOD ---
  const filteredTrades = useMemo(() => {
    if (!trades || trades.length === 0) return [];
    
    const now = new Date();
    let cutoffDate = new Date(0); // All time

    if (selectedPeriod === '7d') {
      cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (selectedPeriod === '30d') {
      cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    } else if (selectedPeriod === '90d') {
      cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    } else if (selectedPeriod === 'ytd') {
      cutoffDate = new Date(now.getFullYear(), 0, 1);
    }

    return trades.filter((t: any) => {
      const tDate = t.closeTime ? new Date(t.closeTime) : (t.openTime ? new Date(t.openTime) : null);
      return tDate && tDate >= cutoffDate;
    });
  }, [trades, selectedPeriod]);

  // --- 2. CALCULATE ALL REAL STATISTICS ---
  const stats = useMemo(() => {
    const closedTrades = filteredTrades.filter(t => t.closeTime && !isBalanceDeal(t));
    const totalTrades = closedTrades.length;

    if (totalTrades === 0) {
      return {
        totalTrades: 0,
        winsCount: 0,
        lossesCount: 0,
        winRate: 0,
        netPnL: 0,
        grossProfit: 0,
        grossLoss: 0,
        profitFactor: 0,
        expectancy: 0,
        avgWin: 0,
        avgLoss: 0,
        largestWin: 0,
        largestLoss: 0,
        consecutiveWins: 0,
        consecutiveLosses: 0,
        maxDrawdownPercent: 0,
        currentDrawdownPercent: 0,
        averageLotSize: 0,
        equityPoints: [],
        symbolStats: [],
        sessionStats: [],
        dayStats: [],
        behaviorInsights: { hurts: [], works: [], nextActions: [] },
        healthScore: 0,
        qualityScores: { risk: 0, profit: 0, consistency: 0, discipline: 0, exposure: 0, overall: 0 }
      };
    }

    // Basic count
    const winningTrades = closedTrades.filter(t => t.pl > 0);
    const losingTrades = closedTrades.filter(t => t.pl < 0);
    const winsCount = winningTrades.length;
    const lossesCount = losingTrades.length;
    const winRate = (winsCount / totalTrades) * 100;

    // Financial sums
    const netPnL = closedTrades.reduce((sum, t) => sum + (t.pl || 0), 0);
    const grossProfit = winningTrades.reduce((sum, t) => sum + (t.pl || 0), 0);
    const grossLoss = Math.abs(losingTrades.reduce((sum, t) => sum + (t.pl || 0), 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? 99.9 : 0);
    const expectancy = netPnL / totalTrades;

    // Win/Loss metrics
    const avgWin = winsCount > 0 ? grossProfit / winsCount : 0;
    const avgLoss = lossesCount > 0 ? grossLoss / lossesCount : 0;
    const largestWin = Math.max(...closedTrades.map(t => t.pl || 0));
    const largestLoss = Math.min(...closedTrades.map(t => t.pl || 0));

    // Average volume
    const totalLots = closedTrades.reduce((sum, t) => sum + (Number(t.lots) || Number(t.volume) || 0), 0);
    const averageLotSize = totalLots / totalTrades;

    // Chronological analysis for Equity Curve, Streaks & Drawdown
    const sortedTrades = [...closedTrades].sort((a, b) => {
      return new Date(a.closeTime).getTime() - new Date(b.closeTime).getTime();
    });

    const currentBalance = activeAccountInfo?.balance || 10000;
    const estimatedInitialBalance = Math.max(1000, currentBalance - netPnL);

    let runningEquity = estimatedInitialBalance;
    let peakEquity = estimatedInitialBalance;
    let maxDrawdownAmt = 0;
    let maxDrawdownPct = 0;

    let consecutiveWins = 0;
    let consecutiveLosses = 0;
    let currentWinStreak = 0;
    let currentLossStreak = 0;

    const equityPoints = [{
      name: 'Start',
      equity: estimatedInitialBalance,
      drawdown: 0
    }];

    sortedTrades.forEach((t, index) => {
      const pl = t.pl || 0;
      runningEquity += pl;

      // Streaks
      if (pl > 0) {
        currentWinStreak++;
        currentLossStreak = 0;
        consecutiveWins = Math.max(consecutiveWins, currentWinStreak);
      } else if (pl < 0) {
        currentLossStreak++;
        currentWinStreak = 0;
        consecutiveLosses = Math.max(consecutiveLosses, currentLossStreak);
      }

      // Drawdown
      if (runningEquity > peakEquity) {
        peakEquity = runningEquity;
      }
      const ddAmt = peakEquity - runningEquity;
      const ddPct = peakEquity > 0 ? (ddAmt / peakEquity) * 100 : 0;
      maxDrawdownAmt = Math.max(maxDrawdownAmt, ddAmt);
      maxDrawdownPct = Math.max(maxDrawdownPct, ddPct);

      equityPoints.push({
        name: new Date(t.closeTime).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        equity: Number(runningEquity.toFixed(2)),
        drawdown: Number((-ddPct).toFixed(2)) // Negative for display logic
      });
    });

    const currentDrawdownAmt = peakEquity - runningEquity;
    const currentDrawdownPercent = peakEquity > 0 ? (currentDrawdownAmt / peakEquity) * 100 : 0;

    // --- INSTRUMENT BREAKDOWN ---
    const symbolMap: Record<string, any[]> = {};
    closedTrades.forEach(t => {
      const sym = t.symbol || 'XAUUSD';
      if (!symbolMap[sym]) symbolMap[sym] = [];
      symbolMap[sym].push(t);
    });

    const symbolStats = Object.keys(symbolMap).map(sym => {
      const symTrades = symbolMap[sym];
      const count = symTrades.length;
      const symWins = symTrades.filter(t => t.pl > 0).length;
      const symLosses = symTrades.filter(t => t.pl < 0).length;
      const symNetPL = symTrades.reduce((s, t) => s + t.pl, 0);
      const symWinRate = (symWins / count) * 100;
      const symGrossProfit = symTrades.filter(t => t.pl > 0).reduce((s, t) => s + t.pl, 0);
      const symGrossLoss = Math.abs(symTrades.filter(t => t.pl < 0).reduce((s, t) => s + t.pl, 0));
      const symPF = symGrossLoss > 0 ? symGrossProfit / symGrossLoss : (symGrossProfit > 0 ? 99 : 0);

      return {
        symbol: sym,
        count,
        netPL: symNetPL,
        winRate: symWinRate,
        profitFactor: symPF,
        avgWin: symWins > 0 ? symGrossProfit / symWins : 0,
        avgLoss: symLosses > 0 ? symGrossLoss / symLosses : 0,
        expectancy: symNetPL / count
      };
    }).sort((a, b) => b.netPL - a.netPL);

    // --- SESSION BREAKDOWN ---
    const sessionMap = {
      Asian: [] as any[],
      London: [] as any[],
      NewYork: [] as any[]
    };

    closedTrades.forEach(t => {
      if (t.closeTime) {
        const hour = new Date(t.closeTime).getUTCHours();
        if (hour >= 0 && hour < 8) {
          sessionMap.Asian.push(t);
        } else if (hour >= 8 && hour < 16) {
          sessionMap.London.push(t);
        } else {
          sessionMap.NewYork.push(t);
        }
      }
    });

    const sessionStats = (Object.keys(sessionMap) as Array<keyof typeof sessionMap>).map(name => {
      const sTrades = sessionMap[name];
      const count = sTrades.length;
      const sWins = sTrades.filter(t => t.pl > 0).length;
      const sLosses = sTrades.filter(t => t.pl < 0).length;
      const sNetPL = sTrades.reduce((s, t) => s + t.pl, 0);
      const sGrossProfit = sTrades.filter(t => t.pl > 0).reduce((s, t) => s + t.pl, 0);
      const sGrossLoss = Math.abs(sTrades.filter(t => t.pl < 0).reduce((s, t) => s + t.pl, 0));
      const sPF = sGrossLoss > 0 ? sGrossProfit / sGrossLoss : (sGrossProfit > 0 ? 99 : 0);

      return {
        session: name,
        count,
        netPL: sNetPL,
        winRate: count > 0 ? (sWins / count) * 100 : 0,
        profitFactor: sPF,
        expectancy: count > 0 ? sNetPL / count : 0
      };
    });

    // --- DAY BREAKDOWN ---
    const dayMap: Record<string, any[]> = {
      'Monday': [], 'Tuesday': [], 'Wednesday': [], 'Thursday': [], 'Friday': []
    };
    closedTrades.forEach(t => {
      if (t.closeTime) {
        const dayNum = new Date(t.closeTime).getUTCDay();
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = days[dayNum];
        if (dayMap[dayName]) {
          dayMap[dayName].push(t);
        }
      }
    });

    const dayStats = Object.keys(dayMap).map(day => {
      const dTrades = dayMap[day];
      const count = dTrades.length;
      const dWins = dTrades.filter(t => t.pl > 0).length;
      const dNetPL = dTrades.reduce((s, t) => s + t.pl, 0);
      return {
        day,
        count,
        netPL: dNetPL,
        winRate: count > 0 ? (dWins / count) * 100 : 0,
        expectancy: count > 0 ? dNetPL / count : 0
      };
    });

    // --- 3. RISK & QUALITY SCORING ENGINE ---
    const riskScore = maxDrawdownPct < 2 ? 100 : maxDrawdownPct < 5 ? 85 : maxDrawdownPct < 10 ? 70 : maxDrawdownPct < 20 ? 50 : 25;
    const profitScore = profitFactor >= 2.0 ? 100 : profitFactor >= 1.5 ? 85 : profitFactor >= 1.0 ? 65 : profitFactor >= 0.7 ? 40 : 15;
    const consistencyScore = winRate >= 55 ? 100 : winRate >= 45 ? 80 : winRate >= 35 ? 60 : 30;

    // Evaluate overtrading & revenge spikes
    let daysTraded = new Set(closedTrades.map(t => new Date(t.closeTime).toDateString())).size;
    daysTraded = Math.max(1, daysTraded);
    const avgTradesPerDay = totalTrades / daysTraded;
    const isOvertrading = avgTradesPerDay > 5;

    // Detect revenge trades (opened within 60 mins of a loss)
    let revengeTradesCount = 0;
    const chronTrades = [...closedTrades].sort((a, b) => new Date(a.openTime).getTime() - new Date(b.openTime).getTime());
    for (let i = 1; i < chronTrades.length; i++) {
      const prev = chronTrades[i - 1];
      const curr = chronTrades[i];
      if (prev.pl < 0 && curr.openTime && prev.closeTime) {
        const diffMins = (new Date(curr.openTime).getTime() - new Date(prev.closeTime).getTime()) / (1000 * 60);
        if (diffMins > 0 && diffMins <= 60) {
          revengeTradesCount++;
        }
      }
    }
    const isRevengeTrading = revengeTradesCount > 0;
    const disciplineScore = 100 - (isOvertrading ? 30 : 0) - (isRevengeTrading ? Math.min(40, revengeTradesCount * 15) : 0);

    // Position Sizing Exposure Stability
    const sizes = closedTrades.map(t => Number(t.lots) || Number(t.volume) || 0);
    const maxLot = Math.max(...sizes);
    const minLot = Math.min(...sizes);
    const isLotUnstable = minLot > 0 && (maxLot / minLot) > 4;
    const exposureScore = isLotUnstable ? 65 : 95;

    const overallQualityScore = Math.round((riskScore * 0.3) + (profitScore * 0.25) + (consistencyScore * 0.15) + (disciplineScore * 0.15) + (exposureScore * 0.15));
    const healthScore = Math.round((riskScore * 0.35) + (profitScore * 0.3) + (consistencyScore * 0.15) + (disciplineScore * 0.2));

    // --- 4. BEHAVIORAL DETECTOR (WHAT'S HURTING & WHAT'S WORKING) ---
    const hurts: any[] = [];
    const works: any[] = [];
    const nextActions: any[] = [];

    // Loss concentration check
    const sortedLosses = [...losingTrades].sort((a, b) => a.pl - b.pl); // Worst first
    const sumTotalLosses = losingTrades.reduce((sum, t) => sum + Math.abs(t.pl), 0);
    const top3LossSum = sortedLosses.slice(0, 3).reduce((sum, t) => sum + Math.abs(t.pl), 0);
    const lossConcentrationPercent = sumTotalLosses > 0 ? (top3LossSum / sumTotalLosses) * 100 : 0;

    if (lossConcentrationPercent > 50 && losingTrades.length >= 4) {
      hurts.push({
        id: 'loss_concentration',
        title: 'Loss Concentration',
        desc: `3 transaksi terburuk menyumbang ${lossConcentrationPercent.toFixed(0)}% dari seluruh total kerugian portofolio Anda.`,
        impact: 'High',
        evidence: `Kerugian terpusat pada 3 posisi ekstrem (${lossConcentrationPercent.toFixed(1)}%).`
      });
    }

    if (isRevengeTrading) {
      hurts.push({
        id: 'revenge_trading',
        title: 'Revenge Trading Patterns',
        desc: `Terdeteksi ${revengeTradesCount} transaksi yang dibuka terburu-buru (< 60 menit) segera setelah mengalami kerugian sebelumnya.`,
        impact: 'High',
        evidence: `Membuka ${revengeTradesCount} posisi pembalasan secara impulsif.`
      });
    }

    if (isOvertrading) {
      hurts.push({
        id: 'overtrading',
        title: 'Overtrading Detected',
        desc: `Frekuensi transaksi Anda tinggi, rata-rata ${avgTradesPerDay.toFixed(1)} trades per hari aktif, menurunkan kualitas rasio menang.`,
        impact: 'Moderate',
        evidence: `Rata-rata frekuensi ${avgTradesPerDay.toFixed(1)} trades/hari.`
      });
    }

    // Risk increase after losses
    let lotSumLoss = 0, lotCountLoss = 0;
    let lotSumWin = 0, lotCountWin = 0;
    for (let i = 1; i < chronTrades.length; i++) {
      if (chronTrades[i - 1].pl < 0) {
        lotSumLoss += (Number(chronTrades[i].lots) || Number(chronTrades[i].volume) || 0);
        lotCountLoss++;
      } else {
        lotSumWin += (Number(chronTrades[i].lots) || Number(chronTrades[i].volume) || 0);
        lotCountWin++;
      }
    }
    const avgLotAfterLoss = lotCountLoss > 0 ? lotSumLoss / lotCountLoss : 0;
    const avgLotAfterWin = lotCountWin > 0 ? lotSumWin / lotCountWin : 0;
    if (avgLotAfterLoss > 1.25 * averageLotSize && averageLotSize > 0) {
      hurts.push({
        id: 'oversizing_losses',
        title: 'Risk Increases After Losses',
        desc: `Ukuran lot rata-rata Anda meningkat menjadi ${(avgLotAfterLoss).toFixed(2)} setelah loss, menandakan percobaan 'Martingale' impulsif.`,
        impact: 'High',
        evidence: `Volume rata-rata naik ${(avgLotAfterLoss / averageLotSize).toFixed(1)}x dari ukuran standar.`
      });
    }

    // Underperforming instrument
    const worstSymbol = [...symbolStats].reverse()[0];
    if (worstSymbol && worstSymbol.netPL < 0 && symbolStats.length > 1) {
      hurts.push({
        id: 'poor_symbol',
        title: 'Poor Instrument Selection',
        desc: `Instrumen ${worstSymbol.symbol} menyumbang kerugian terbesar senilai $${Math.abs(worstSymbol.netPL).toFixed(2)} dengan Win Rate ${worstSymbol.winRate.toFixed(1)}%.`,
        impact: 'Moderate',
        evidence: `P&L ${worstSymbol.symbol}: -$${Math.abs(worstSymbol.netPL).toFixed(2)}.`
      });
    }

    // --- WHAT'S WORKING ---
    if (maxDrawdownPct <= 3.0) {
      works.push({
        id: 'risk_control',
        title: 'Excellent Risk Control',
        desc: `Penurunan modal maksimal (Max Drawdown) Anda terjaga sangat ketat di angka ${maxDrawdownPct.toFixed(1)}%, jauh di bawah batas kritis.`,
        impact: 'Positive',
        evidence: `Max drawdown stabil di tingkat aman (${maxDrawdownPct.toFixed(2)}%).`
      });
    } else if (maxDrawdownPct <= 8.0) {
      works.push({
        id: 'risk_control',
        title: 'Controlled Drawdown',
        desc: `Drawdown portofolio Anda berada pada kisaran moderat ${maxDrawdownPct.toFixed(1)}%, mencerminkan manajemen risiko yang disiplin.`,
        impact: 'Positive',
        evidence: `Max drawdown terkendali di tingkat ${maxDrawdownPct.toFixed(1)}%.`
      });
    }

    const bestSymbol = symbolStats[0];
    if (bestSymbol && bestSymbol.netPL > 0) {
      works.push({
        id: 'best_instrument',
        title: 'Best Instrument Edge',
        desc: `Performa optimal ditemukan pada instrumen ${bestSymbol.symbol} menghasilkan profit bersih $${bestSymbol.netPL.toFixed(2)} dengan Win Rate ${bestSymbol.winRate.toFixed(1)}%.`,
        impact: 'Positive',
        evidence: `Profit ${bestSymbol.symbol}: +$${bestSymbol.netPL.toFixed(2)}.`
      });
    }

    const bestSession = [...sessionStats].sort((a,b) => b.netPL - a.netPL)[0];
    if (bestSession && bestSession.netPL > 0) {
      works.push({
        id: 'best_session',
        title: 'Best Trading Session',
        desc: `Sesi ${bestSession.session} memberikan keunggulan statistik tertinggi dengan net P&L +$${bestSession.netPL.toFixed(2)} dan Win Rate ${bestSession.winRate.toFixed(1)}%.`,
        impact: 'Positive',
        evidence: `Ekspetansi Sesi ${bestSession.session}: +$${bestSession.expectancy.toFixed(2)}.`
      });
    }

    if (!isLotUnstable) {
      works.push({
        id: 'stable_sizing',
        title: 'Stable Position Sizing',
        desc: 'Ukuran transaksi Anda sangat konsisten, meminimalkan risiko lonjakan volatilitas tak terduga.',
        impact: 'Positive',
        evidence: `Volume konsisten di kisaran rata-rata ${averageLotSize.toFixed(2)} Lot.`
      });
    }

    // --- NEXT 3 ACTIONS (DYNAMIC RECOMMENDATIONS WITH PRIORITY) ---
    const actionCandidates: any[] = [];

    // Issue 1: Loss Concentration
    if (lossConcentrationPercent > 40 && losingTrades.length >= 4) {
      actionCandidates.push({
        priorityScore: lossConcentrationPercent + 20, // Max ~120
        title: 'REDUCE LOSS CONCENTRATION',
        problem: 'A few large losing trades are erasing your profits.',
        evidence: `Your top 3 worst trades account for ${lossConcentrationPercent.toFixed(1)}% of your total losses.`,
        action: 'Implement a strict hard stop loss on every trade to prevent oversized losses.',
        target: `Ensure no single loss exceeds ${(sumTotalLosses * 0.15).toFixed(2)} USD (15% of total losses).`
      });
    }

    // Issue 2: Revenge Trading
    if (isRevengeTrading) {
      actionCandidates.push({
        priorityScore: 80 + (revengeTradesCount * 5),
        title: 'STOP REVENGE TRADING',
        problem: 'Your trading frequency increases impulsively after taking a loss.',
        evidence: `You opened ${revengeTradesCount} trades within 60 minutes after a losing trade.`,
        action: 'Implement a mandatory cooling-off period after every loss before looking at the charts again.',
        target: 'Zero trades executed within 60 minutes of a stopped-out position.'
      });
    }

    // Issue 3: Overtrading
    if (isOvertrading) {
      actionCandidates.push({
        priorityScore: 70 + (avgTradesPerDay * 2),
        title: 'REDUCE OVERTRADING',
        problem: 'You are executing too many trades, which degrades setup quality.',
        evidence: `You average ${avgTradesPerDay.toFixed(1)} trades per active day.`,
        action: 'Limit your daily executions to your absolute highest probability setups.',
        target: `Reduce daily trading frequency to under ${(avgTradesPerDay * 0.7).toFixed(1)} trades/day.`
      });
    }

    // Issue 4: Oversizing after losses
    if (avgLotAfterLoss > 1.2 * averageLotSize && averageLotSize > 0) {
      const sizingRatio = avgLotAfterLoss / averageLotSize;
      actionCandidates.push({
        priorityScore: 85 + (sizingRatio * 10),
        title: 'CONTROL POSITION SIZE',
        problem: 'You are increasing your position size to recover from previous losses.',
        evidence: `Average position size after a loss (${avgLotAfterLoss.toFixed(2)} lots) is ${sizingRatio.toFixed(1)}x higher than your normal size.`,
        action: 'Return to baseline position sizing immediately after a loss.',
        target: `Keep post-loss position size strictly at or below ${averageLotSize.toFixed(2)} lots.`
      });
    }

    // Issue 5: Drawdown
    if (maxDrawdownPct > 10) {
      actionCandidates.push({
        priorityScore: Math.min(100, maxDrawdownPct * 5),
        title: 'PROTECT YOUR CAPITAL',
        problem: 'Your portfolio is experiencing significant peak-to-trough degradation.',
        evidence: `Maximum drawdown has reached ${maxDrawdownPct.toFixed(1)}% of your peak equity.`,
        action: 'Reduce your risk per trade by half until you recover from the current drawdown phase.',
        target: `Recover equity and keep future drawdown strictly below ${(Math.max(5, maxDrawdownPct - 5)).toFixed(1)}%.`
      });
    }

    // Issue 6: Poor Instrument
    if (worstSymbol && worstSymbol.netPL < 0 && symbolStats.length > 1) {
      actionCandidates.push({
        priorityScore: 60 + Math.min(30, Math.abs(worstSymbol.netPL) / (estimatedInitialBalance || 1000) * 100),
        title: 'AVOID POOR INSTRUMENTS',
        problem: `${worstSymbol.symbol} is consistently draining your portfolio.`,
        evidence: `You have lost $${Math.abs(worstSymbol.netPL).toFixed(2)} trading ${worstSymbol.symbol} with a ${worstSymbol.winRate.toFixed(1)}% win rate.`,
        action: `Stop trading ${worstSymbol.symbol} temporarily until you refine your strategy in a demo environment.`,
        target: `Reduce exposure to ${worstSymbol.symbol} by 100% for the next 30 days.`
      });
    }

    // Positive 1: Best Instrument
    if (bestSymbol && bestSymbol.netPL > 0 && symbolStats.length > 1) {
      actionCandidates.push({
        priorityScore: 50 + (bestSymbol.winRate / 2),
        title: 'FOCUS ON YOUR EDGE',
        problem: 'You need to allocate more risk to your most profitable setups.',
        evidence: `${bestSymbol.symbol} generated $${bestSymbol.netPL.toFixed(2)} with a ${bestSymbol.winRate.toFixed(1)}% win rate.`,
        action: `Prioritize trade setups on ${bestSymbol.symbol} over other instruments.`,
        target: `Increase the proportion of your trades on ${bestSymbol.symbol} by 20%.`
      });
    }

    // Positive 2: Risk Control
    if (maxDrawdownPct <= 5 && totalTrades >= 10) {
      actionCandidates.push({
        priorityScore: 45,
        title: 'PROTECT YOUR EDGE',
        problem: 'You have excellent capital preservation that must be maintained.',
        evidence: `Your maximum drawdown is firmly controlled at ${maxDrawdownPct.toFixed(1)}%.`,
        action: 'Maintain your current strict risk management rules and do not increase leverage.',
        target: `Keep maximum drawdown below ${(maxDrawdownPct + 2).toFixed(1)}% for the next 30 days.`
      });
    }

    // Positive 3: Win Rate
    if (winRate > 60 && totalTrades >= 10) {
      actionCandidates.push({
        priorityScore: 40,
        title: 'CAPITALIZE ON CONSISTENCY',
        problem: 'You have a high win rate but need to ensure your winners are large enough.',
        evidence: `You are winning ${winRate.toFixed(1)}% of your trades.`,
        action: 'Let your winning trades run slightly longer to improve your average win size.',
        target: `Increase your average win size by 10% to $${(avgWin * 1.1).toFixed(2)}.`
      });
    }

    actionCandidates.sort((a, b) => b.priorityScore - a.priorityScore);
    const finalNextActions = actionCandidates.slice(0, 3).map((item, index) => ({
      ...item,
      id: `0${index + 1}`
    }));

    return {
      totalTrades,
      winsCount,
      lossesCount,
      winRate,
      netPnL,
      grossProfit,
      grossLoss,
      profitFactor,
      expectancy,
      avgWin,
      avgLoss,
      largestWin,
      largestLoss,
      consecutiveWins,
      consecutiveLosses,
      maxDrawdownPercent: maxDrawdownPct,
      currentDrawdownPercent,
      averageLotSize,
      equityPoints,
      symbolStats,
      sessionStats,
      dayStats,
      behaviorInsights: { hurts: hurts.slice(0, 3), works: works.slice(0, 3), nextActions: finalNextActions },
      healthScore,
      qualityScores: {
        risk: Math.round(riskScore),
        profit: Math.round(profitScore),
        consistency: Math.round(consistencyScore),
        discipline: Math.round(disciplineScore),
        exposure: Math.round(exposureScore),
        overall: Math.round(overallQualityScore)
      }
    };
  }, [filteredTrades, activeAccountInfo]);

  // --- 5. TRIGGER SERVER-SIDE AI INSIGHT ENGINE ---
  useEffect(() => {
    if (stats.totalTrades === 0) return;

    const fetchAiDiagnosis = async () => {
      setLoadingAi(true);
      try {
        const payload = {
          analysisType: 'leaks',
          tradeMetrics: {
            accountInfo: {
              broker: activeAccountInfo?.broker || 'MetaTrader 5',
              server: activeAccountInfo?.server || 'Axi-US50-Demo',
              login: activeAccountInfo?.login || '',
              balance: activeAccountInfo?.balance || 0,
              equity: activeAccountInfo?.equity || 0,
              margin: activeAccountInfo?.margin || 0,
              marginFree: activeAccountInfo?.freeMargin || 0,
              leverage: activeAccountInfo?.leverage || 1000
            },
            stats: {
              totalTrades: stats.totalTrades,
              winTrades: stats.winsCount,
              lossTrades: stats.lossesCount,
              winRate: stats.winRate,
              netProfit: stats.netPnL,
              grossProfit: stats.grossProfit,
              grossLoss: stats.grossLoss,
              profitFactor: stats.profitFactor,
              maxDrawdown: stats.maxDrawdownPercent,
              rewardToRisk: stats.avgLoss > 0 ? stats.avgWin / stats.avgLoss : 1.0,
              avgWin: stats.avgWin,
              avgLoss: stats.avgLoss,
              bestTrade: stats.largestWin,
              worstTrade: stats.largestLoss
            },
            symbolBreakdown: stats.symbolStats,
            sessionBreakdown: stats.sessionStats
          }
        };

        const res = await apiFetch('/api/ai/journal-diagnosis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          const data = await res.json();
          if (data.diagnosis) {
            setAiDiagnosis(data.diagnosis);
          }
        }
      } catch (err) {
        console.error("[-] Failed to fetch portfolio AI insights:", err);
      } finally {
        setLoadingAi(false);
      }
    };

    fetchAiDiagnosis();
  }, [stats.totalTrades, stats.winRate, stats.maxDrawdownPercent, activeAccountInfo]);

  const handleRefreshClick = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
  };

  // --- RENDER EMPTY / LOADING STATE CORES ---
  if (loadingTrades) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
        <RefreshCw className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
        <h4 className="text-sm font-bold text-slate-800 font-roboto">Retrieving MT5 account history...</h4>
        <p className="text-xs text-slate-400 mt-1">Calculating trading curves and exposure metrics.</p>
      </div>
    );
  }

  const isBrokerDisconnected = !activeAccountInfo || activeAccountInfo.conn_status === "error";

  if (isBrokerDisconnected) {
    return (
      <div className="bg-slate-50/50 min-h-[60vh] flex flex-col items-center justify-center p-6 text-center rounded-3xl border border-slate-200/60 max-w-md mx-auto">
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-500 rounded-2xl mb-4 shadow-sm">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-base font-black text-slate-900 font-roboto">MT5 Data Unavailable</h3>
        <p className="text-xs text-slate-500 leading-relaxed max-w-sm mt-2 font-roboto">
          {activeAccountInfo?.error_message || "Unable to retrieve the latest account data. Please reconnect your broker credential under the Account/Broker tab."}
        </p>
        <div className="flex items-center gap-2 mt-6 w-full max-w-xs">
          <button 
            onClick={handleRefreshClick}
            disabled={isRefreshing}
            className="flex-1 py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Retry Sync
          </button>
        </div>
      </div>
    );
  }

  if (stats.totalTrades === 0) {
    return (
      <div className="bg-slate-50/50 min-h-[60vh] flex flex-col items-center justify-center p-6 text-center rounded-3xl border border-slate-200/60 max-w-md mx-auto">
        <div className="p-4 bg-slate-100 border border-slate-200 text-slate-400 rounded-2xl mb-4 shadow-sm">
          <Activity className="w-8 h-8" />
        </div>
        <h3 className="text-base font-black text-slate-900 font-roboto">No Trading History Available</h3>
        <p className="text-xs text-slate-400 leading-relaxed max-w-sm mt-2 font-roboto">
          We found your MT5 account ({activeAccountInfo.login}) successfully connected, but there is no closed trading history detected for the selected period ({selectedPeriod === '30d' ? 'Last 30 Days' : selectedPeriod}).
        </p>
        <div className="flex gap-2 mt-6 w-full max-w-xs">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value as any)}
            className="flex-1 px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-xs outline-hidden focus:border-indigo-500"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="ytd">This Year</option>
            <option value="all">All Time</option>
          </select>
          <button 
            onClick={handleRefreshClick}
            disabled={isRefreshing}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1 active:scale-95 cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>
    );
  }

  // --- DYNAMIC CONTENT DETERMINISTIC FALLBACKS ---
  const verdictStatus = stats.healthScore >= 80 ? "Healthy" : 
                        stats.healthScore >= 70 ? "Stable" : 
                        stats.healthScore >= 50 ? "Needs Improvement" : 
                        stats.healthScore >= 35 ? "High Risk" : "Critical";

  const verdictTitle = aiDiagnosis?.title || (
    stats.healthScore >= 80 ? "Healthy & Consistent Profile" : 
    stats.healthScore >= 70 ? "Stable performance with standard risk" : 
    stats.healthScore >= 50 ? "Profitable, but at risk." : 
    "High risk of capital degradation"
  );

  const verdictExplanation = aiDiagnosis?.content || (
    stats.healthScore >= 80 
      ? `Portofolio Anda memiliki kontrol drawdown yang sangat ketat di tingkat ${stats.maxDrawdownPercent.toFixed(1)}%. Rasio kemenangan sebesar ${stats.winRate.toFixed(0)}% didukung oleh sizing yang proporsional.`
      : stats.healthScore >= 50
      ? `Meskipun akun Anda mencatatkan net profit positif sebesar $${stats.netPnL.toFixed(2)}, terdapat beberapa pola kebocoran risiko. Drawdown sebesar ${stats.maxDrawdownPercent.toFixed(1)}% dikombinasikan dengan performa sesi yang kurang seimbang membutuhkan perbaikan taktis.`
      : `Akun Anda mengalami tekanan risiko yang signifikan dengan drawdown mencapai ${stats.maxDrawdownPercent.toFixed(1)}%. Perilaku transaksi menunjukkan penyimpangan sizing dan potensi trading emosional.`
  );

  const strengthItem = stats.behaviorInsights.works[0]?.title || "Risk Control";
  const weaknessItem = stats.behaviorInsights.hurts[0]?.title || "Trade Quality";
  const mainRiskItem = stats.behaviorInsights.hurts[1]?.title || "Increasing exposure after losses";

  return (
    <div className="bg-white dark:bg-[#121620] text-slate-900 dark:text-white font-sans rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden pb-8 shadow-xs">
      
      {/* 1. HEADER SECTION */}
      <div className="bg-slate-50 dark:bg-[#181d28] border-b border-slate-100 dark:border-slate-800 px-4 py-3.5 shadow-xs">
        <div className="w-full flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition cursor-pointer active:scale-95 border border-slate-200 dark:border-slate-700"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="space-y-0.5">
              <h1 className="text-base font-black text-slate-900 dark:text-white tracking-tight font-roboto">Portfolio Report</h1>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                <span className="font-semibold text-slate-700 dark:text-slate-300">{activeAccountInfo.broker || 'Broker Account'}</span>
                <span>•</span>
                <span>{activeAccountInfo.login}</span>
                <span>•</span>
                <span>1:{activeAccountInfo.leverage || 1000}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold shadow-xs outline-hidden focus:border-indigo-500 transition cursor-pointer"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="ytd">This Year</option>
              <option value="all">All Time</option>
            </select>
            <button 
              onClick={handleRefreshClick}
              disabled={isRefreshing}
              className="p-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 transition cursor-pointer active:scale-95"
              title="Sync Trades"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-indigo-600 dark:text-indigo-400' : ''} />
            </button>
          </div>
        </div>
      </div>

      <div className="w-full px-4 py-4 space-y-4">

        {/* 2. ACCOUNT HEALTH CARD */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs flex justify-between items-center relative overflow-hidden">
          <div className="space-y-4 flex-1">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-black uppercase tracking-wider font-roboto">
                <span>Account Health</span>
                <Info size={11} className="text-slate-300" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-black text-indigo-600 tracking-tight font-roboto">{stats.healthScore}</span>
                <span className="text-sm font-bold text-slate-300">/ 100</span>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${stats.healthScore}%` }}
                />
              </div>
              <div className="space-y-1">
                <h4 className={`text-xs font-black uppercase tracking-wide ${
                  stats.healthScore >= 80 ? 'text-emerald-500' : stats.healthScore >= 65 ? 'text-indigo-500' : 'text-amber-500'
                }`}>
                  {verdictStatus}
                </h4>
                <p className="text-[11px] text-slate-400 font-medium leading-relaxed font-roboto">
                  Account is profitable, but trading quality and consistency need improvement.
                </p>
              </div>
            </div>
          </div>

          {/* Premium Shield Art Frame */}
          <div className="relative w-28 h-28 flex items-center justify-center bg-indigo-50/30 rounded-2xl border border-indigo-50/50 shrink-0 ml-4">
            <div className="absolute inset-0 bg-radial from-indigo-50/50 via-transparent to-transparent animate-pulse rounded-2xl" />
            <div className="relative z-10 w-16 h-16 bg-white rounded-xl border border-indigo-100 flex items-center justify-center text-indigo-500 shadow-md">
              <Shield size={32} className="fill-indigo-50 text-indigo-600" />
            </div>
          </div>
        </div>

        {/* 3. GOTRADING VERDICT CARD */}
        <div className="bg-gradient-to-b from-amber-50/40 to-white rounded-3xl p-5 border border-amber-100/60 shadow-xs space-y-4">
          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block font-roboto">GoTrading Verdict</span>
            <div className="flex items-center gap-1.5 text-amber-600 font-bold text-xs sm:text-sm font-roboto">
              <AlertTriangle size={15} className="shrink-0" />
              <span>{verdictTitle}</span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed font-roboto">
              {verdictExplanation}
            </p>
          </div>

          <div className="grid grid-cols-1 divide-y divide-slate-100 border-t border-slate-100 pt-3 gap-3">
            <div className="flex items-center justify-between text-xs pt-1.5">
              <span className="text-slate-400 font-medium font-roboto flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                STRENGTH
              </span>
              <span className="font-extrabold text-slate-800">{strengthItem}</span>
            </div>
            <div className="flex items-center justify-between text-xs pt-3">
              <span className="text-slate-400 font-medium font-roboto flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                WEAKNESS
              </span>
              <span className="font-extrabold text-slate-800">{weaknessItem}</span>
            </div>
            <div className="flex items-center justify-between text-xs pt-3">
              <span className="text-slate-400 font-medium font-roboto flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                MAIN RISK
              </span>
              <span className="font-extrabold text-slate-800">{mainRiskItem}</span>
            </div>
          </div>
        </div>

        {/* 4. KEY PERFORMANCE GRID */}
        <div className="space-y-1.5">
          <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block font-roboto">Key Performance</span>
          <div className="grid grid-cols-2 gap-2">
            
            <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-roboto">Equity</span>
              <div className="space-y-0.5">
                <span className="text-sm font-black text-slate-800 font-roboto">${(activeAccountInfo.equity || stats.equityPoints[stats.equityPoints.length-1]?.equity || 0).toLocaleString('en-US', {minimumFractionDigits:2})}</span>
                <span className="text-[9px] text-slate-400 block font-bold tracking-tight">USD</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-roboto">Net Profit</span>
              <div className="space-y-0.5">
                <span className={`text-sm font-black font-roboto ${stats.netPnL >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {stats.netPnL >= 0 ? '+' : ''}${stats.netPnL.toLocaleString('en-US', {minimumFractionDigits:2})}
                </span>
                <span className={`text-[9px] block font-bold tracking-tight ${stats.netPnL >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {stats.netPnL >= 0 ? '+' : ''}{((stats.netPnL / (stats.equityPoints[0]?.equity || 1)) * 100).toFixed(2)}%
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-roboto">Max Drawdown</span>
              <div className="space-y-0.5">
                <span className="text-sm font-black text-rose-500 font-roboto">{stats.maxDrawdownPercent.toFixed(1)}%</span>
                <span className="text-[9px] text-slate-400 block font-bold tracking-tight">Max historical</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-roboto">Win Rate</span>
              <div className="space-y-0.5">
                <span className="text-sm font-black text-slate-800 font-roboto">{stats.winRate.toFixed(1)}%</span>
                <span className="text-[9px] text-slate-400 block font-bold tracking-tight">{stats.winsCount} Wins of {stats.totalTrades} Trades</span>
              </div>
            </div>

          </div>
        </div>

        {/* 5. EQUITY CURVE */}
        <div className="bg-white rounded-3xl p-4.5 border border-slate-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block font-roboto">Equity Curve</span>
            <span className="text-[11px] font-bold text-indigo-600 font-roboto">${(activeAccountInfo.equity || 0).toLocaleString('en-US', {minimumFractionDigits:2})} USD</span>
          </div>
          
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.equityPoints} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" fontSize={9} tickLine={false} axisLine={false} stroke="#94a3b8" />
                <YAxis fontSize={9} tickLine={false} axisLine={false} stroke="#94a3b8" domain={['auto', 'auto']} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #f1f5f9', borderRadius: '12px', fontSize: '11px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                  formatter={(value: any) => [`$${value}`, 'Equity']}
                />
                <Area type="monotone" dataKey="equity" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorEquity)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 flex items-center gap-2 text-[11px] text-slate-500 font-roboto">
            <TrendingUp size={14} className="text-indigo-500" />
            <span>Equity trend shows chronological performance based on closed trades.</span>
          </div>
        </div>

        {/* 6. DRAWDOWN */}
        <div className="bg-white rounded-3xl p-4.5 border border-slate-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block font-roboto">Drawdown</span>
            <span className="text-[11px] font-bold text-rose-500 font-roboto">{stats.currentDrawdownPercent.toFixed(1)}% Current</span>
          </div>
          
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.equityPoints} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDrawdown" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" fontSize={9} tickLine={false} axisLine={false} stroke="#94a3b8" />
                <YAxis fontSize={9} tickLine={false} axisLine={false} stroke="#94a3b8" domain={['auto', 0]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #f1f5f9', borderRadius: '12px', fontSize: '11px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                  formatter={(value: any) => [`${value}%`, 'Drawdown']}
                />
                <Area type="monotone" dataKey="drawdown" stroke="#ef4444" strokeWidth={1.5} fillOpacity={1} fill="url(#colorDrawdown)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 flex items-center gap-2 text-[11px] text-slate-500 font-roboto">
            <AlertTriangle size={14} className="text-rose-500" />
            <span>Peak-to-trough degradation shows temporary drawdowns of overall equity.</span>
          </div>
        </div>

        {/* 7. TRADING QUALITY SCORE */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
          <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block font-roboto">Trading Quality</span>
          
          <div className="flex flex-col sm:flex-row items-center gap-6">
            {/* Donut Circle */}
            <div className="relative w-32 h-32 flex items-center justify-center bg-slate-50 rounded-full shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle 
                  cx="64" cy="64" r="54" 
                  stroke="#f1f5f9" strokeWidth="8" fill="transparent" 
                />
                <circle 
                  cx="64" cy="64" r="54" 
                  stroke="#4f46e5" strokeWidth="8" fill="transparent" 
                  strokeDasharray={`${2 * Math.PI * 54}`}
                  strokeDashoffset={`${2 * Math.PI * 54 * (1 - stats.qualityScores.overall / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-3xl font-black text-slate-800 font-roboto">{stats.qualityScores.overall}</span>
                <span className="text-[10px] text-slate-400 font-bold block">/ 100</span>
              </div>
            </div>

            {/* Quality Breakdown Bars */}
            <div className="flex-1 w-full space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-600 font-roboto">
                  <span>Risk Management</span>
                  <span>{stats.qualityScores.risk}/100</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${stats.qualityScores.risk}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-600 font-roboto">
                  <span>Profitability</span>
                  <span>{stats.qualityScores.profit}/100</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: `${stats.qualityScores.profit}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-600 font-roboto">
                  <span>Consistency</span>
                  <span>{stats.qualityScores.consistency}/100</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full" style={{ width: `${stats.qualityScores.consistency}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-600 font-roboto">
                  <span>Trading Discipline</span>
                  <span>{stats.qualityScores.discipline}/100</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${stats.qualityScores.discipline}%` }} />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-600 font-roboto">
                  <span>Exposure Control</span>
                  <span>{stats.qualityScores.exposure}/100</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${stats.qualityScores.exposure}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 8. WHAT'S HURTING YOU */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
          <span className="text-[10px] text-rose-500 font-black uppercase tracking-wider block font-roboto">What's Hurting You</span>
          
          <div className="space-y-3">
            {stats.behaviorInsights.hurts.length === 0 ? (
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl text-xs text-slate-500 font-roboto">
                <CheckCircle2 className="text-emerald-500 shrink-0" size={16} />
                <span>No harmful trading habits detected in this period. Outstanding discipline!</span>
              </div>
            ) : (
              stats.behaviorInsights.hurts.map((h: any) => (
                <div key={h.id} className="p-3 bg-rose-50/30 border border-rose-100/50 rounded-2xl flex items-start gap-3 transition hover:bg-rose-50/50">
                  <div className="p-2 bg-rose-50 border border-rose-100 text-rose-500 rounded-xl shrink-0">
                    <AlertTriangle size={15} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h4 className="text-xs font-black text-slate-800 font-roboto">{h.title}</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-roboto">{h.desc}</p>
                    <div className="flex items-center gap-1 text-[9px] text-rose-500 font-extrabold tracking-wide font-roboto uppercase">
                      <span>EVIDENCE:</span>
                      <span>{h.evidence}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 9. WHAT'S WORKING */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
          <span className="text-[10px] text-emerald-500 font-black uppercase tracking-wider block font-roboto">What's Working</span>
          
          <div className="space-y-3">
            {stats.behaviorInsights.works.length === 0 ? (
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl text-xs text-slate-500 font-roboto">
                <Info className="text-slate-400 shrink-0" size={16} />
                <span>Not enough statistical evidence for specific trading edges yet. Keep executing.</span>
              </div>
            ) : (
              stats.behaviorInsights.works.map((w: any) => (
                <div key={w.id} className="p-3 bg-emerald-50/20 border border-emerald-100/50 rounded-2xl flex items-start gap-3 transition hover:bg-emerald-50/40">
                  <div className="p-2 bg-emerald-50 border border-emerald-100 text-emerald-500 rounded-xl shrink-0">
                    <CheckCircle2 size={15} />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h4 className="text-xs font-black text-slate-800 font-roboto">{w.title}</h4>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-roboto">{w.desc}</p>
                    <div className="flex items-center gap-1 text-[9px] text-emerald-500 font-extrabold tracking-wide font-roboto uppercase">
                      <span>EVIDENCE:</span>
                      <span>{w.evidence}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 10. NEXT 3 ACTIONS */}
        <div className="space-y-2.5">
          <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block font-roboto">Next 3 Actions</span>
          
          {stats.totalTrades < 10 ? (
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                <Info size={24} />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-black text-slate-800 font-roboto">Not enough trading history</h4>
                <p className="text-xs text-slate-500 font-roboto max-w-sm">
                  Complete at least 10 closed trades to generate behavior-based personalized recommendations and dynamic action plans.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.behaviorInsights.nextActions.map((action: any) => {
                const isCompleted = completedActions[action.id] || false;

                return (
                  <div key={action.id} className={`bg-white rounded-3xl border shadow-xs transition-colors overflow-hidden ${isCompleted ? 'border-emerald-200' : 'border-slate-100'}`}>
                    <div className={`p-4 border-b flex items-center gap-3 ${isCompleted ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'}`}>
                      <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-black shrink-0 font-roboto shadow-inner ${isCompleted ? 'bg-emerald-100 border-emerald-200 text-emerald-600' : 'bg-white border-slate-200 text-slate-700'}`}>
                        {action.id}
                      </div>
                      <h4 className={`text-sm font-black font-roboto ${isCompleted ? 'text-emerald-800' : 'text-slate-800'}`}>
                        {action.title}
                      </h4>
                    </div>
                    
                    <div className={`p-5 space-y-4 ${isCompleted ? 'opacity-60 grayscale' : ''}`}>
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-roboto">Problem</span>
                        <p className="text-xs text-slate-700 font-medium font-roboto">{action.problem}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-roboto">Evidence</span>
                        <p className="text-xs text-slate-600 font-roboto bg-slate-50 p-2 rounded-lg border border-slate-100">{action.evidence}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider font-roboto">Action</span>
                        <p className="text-xs text-indigo-900 font-medium font-roboto bg-indigo-50/50 p-2 rounded-lg border border-indigo-100">{action.action}</p>
                      </div>
                      
                      <div className="space-y-1">
                        <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-wider font-roboto">Target</span>
                        <p className="text-xs text-emerald-900 font-medium font-roboto bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">{action.target}</p>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
                      <button
                        onClick={() => setCompletedActions(prev => ({ ...prev, [action.id]: !prev[action.id] }))}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                          isCompleted 
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 shadow-sm'
                        }`}
                      >
                        {isCompleted ? (
                          <>
                            <CheckCircle2 size={14} className="text-emerald-600" />
                            <span>Completed</span>
                          </>
                        ) : (
                          <>
                            <Circle size={14} className="text-slate-400" />
                            <span>Mark as Done</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
