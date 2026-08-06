import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AdvancedRealTimeChart } from 'react-ts-tradingview-widgets';
import { BrainCircuit, Activity, AlertTriangle, TrendingUp, TrendingDown, Target, Zap, ShieldAlert, BarChart3, Clock, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabaseClient';

export const TechnicalAnalysis = () => {
  const { t } = useTranslation();
  const [symbol, setSymbol] = useState('OANDA:XAUUSD');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // States for Market Sentiment & Indicators
  const [sentimentData, setSentimentData] = useState<any>(null);
  const [indicators, setIndicators] = useState<any>(null);
  
  // Custom Symbol Selection to handle two-way sync
  const availableSymbols = [
    { value: 'OANDA:XAUUSD', label: 'Gold (XAU/USD)' },
    { value: 'OANDA:EURUSD', label: 'EUR/USD' },
    { value: 'OANDA:GBPUSD', label: 'GBP/USD' },
    { value: 'OANDA:USDJPY', label: 'USD/JPY' },
    { value: 'OANDA:AUDUSD', label: 'AUD/USD' },
    { value: 'OANDA:USDCAD', label: 'USD/CAD' },
    { value: 'BINANCE:BTCUSD', label: 'Bitcoin (BTC/USD)' },
    { value: 'BINANCE:ETHUSD', label: 'Ethereum (ETH/USD)' },
    { value: 'NASDAQ:AAPL', label: 'Apple Inc. (AAPL)' },
  ];

  const fetchSentimentAndIndicators = useCallback(async (currentSymbol: string) => {
    setIsLoading(true);
    try {
      // 1. Trigger Edge Function to sync data (simulated via our server API)
      await fetch('/api/analysis/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: currentSymbol })
      });

      // 2. Fetch computed sentiment and indicators from Supabase
      const res = await fetch(`/api/analysis/sentiment/${encodeURIComponent(currentSymbol)}`);
      const data = await res.json();
      
      if (data.success) {
        setSentimentData(data.sentiment);
        setIndicators(data.indicators);
        setLastUpdated(new Date(data.sentiment.updatedAt || Date.now()));
      }
    } catch (error) {
      console.error('Failed to fetch technical analysis data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSentimentAndIndicators(symbol);
    
    // Refresh every 1 minute
    const interval = setInterval(() => {
      fetchSentimentAndIndicators(symbol);
    }, 60000);
    
    return () => clearInterval(interval);
  }, [symbol, fetchSentimentAndIndicators]);

  // Derived styling based on sentiment and signal
  const getSentimentStyle = (sentiment: string) => {
    switch (sentiment) {
      case 'Strong Bullish': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'Bullish': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'Bearish': return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
      case 'Strong Bearish': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  const getTrendStyle = (trend: string) => {
    switch (trend) {
      case 'Strong': return 'text-indigo-500';
      case 'Weak': return 'text-amber-500';
      default: return 'text-slate-500 dark:text-slate-400';
    }
  };

  const getScoreStyle = (score: number) => {
    if (score >= 70) return 'text-emerald-500';
    if (score <= 40) return 'text-rose-500';
    return 'text-amber-500';
  };

  const getSignalStyle = (signal: string) => {
    switch (signal) {
      case 'Potential Buy': return 'bg-emerald-500 text-white shadow-emerald-500/25';
      case 'Potential Sell': return 'bg-rose-500 text-white shadow-rose-500/25';
      default: return 'bg-slate-500 text-white shadow-slate-500/25';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* SECTION 1: Top Header & Symbol Selection */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 dark:bg-[#121620]/80 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative">
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="appearance-none bg-slate-100 dark:bg-[#181D28] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-lg font-black py-2 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              {availableSymbols.map(s => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <Globe size={18} className="text-slate-400" />
            </div>
          </div>
          
          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Market Status</span>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-bold text-slate-900 dark:text-white">OPEN</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-white/5">
            <Clock size={14} />
            <span className="font-medium">Last Updated: {lastUpdated.toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* SECTION 2: TradingView Chart */}
      <div className="bg-white/80 dark:bg-[#121620]/80 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-2xl p-2 shadow-sm overflow-hidden h-[500px]">
        <AdvancedRealTimeChart 
          theme="dark" 
          symbol={symbol} 
          width="100%" 
          height="100%" 
          allow_symbol_change={false} // Disable internal symbol change to maintain state sync
          hide_top_toolbar={false}
          hide_legend={false}
          enable_publishing={false}
          toolbar_bg="rgba(18, 22, 32, 1)"
          style="1" // Candles
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-slate-100 dark:bg-white/5 rounded-2xl animate-pulse col-span-1 md:col-span-2"></div>
          <div className="h-64 bg-slate-100 dark:bg-white/5 rounded-2xl animate-pulse col-span-1"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN: Market Sentiment & Tech Score */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* SECTION 4: Market Sentiment Card */}
            <div className="relative bg-white dark:bg-[#181D28] border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md">
              
              <div className="relative z-10 flex flex-col gap-5">
                <div className="flex flex-row items-center justify-between gap-4">
                  {/* Top: Sentiment */}
                  <div className="space-y-1">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sentiment</h3>
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${getSentimentStyle(sentimentData?.sentiment || 'Neutral')}`}>
                      <Activity size={14} className="shrink-0" />
                      <span className="text-xs font-bold tracking-tight">{sentimentData?.sentiment || 'Neutral'}</span>
                    </div>
                  </div>
                  
                  {/* Top: Signal */}
                  <div className="space-y-1 text-right">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Signal</h3>
                    <div className={`inline-flex items-center justify-center px-3 py-1 rounded-lg shadow-sm transition-all duration-300 ${getSignalStyle(sentimentData?.signal || 'WAIT')}`}>
                      <span className="text-xs font-bold tracking-wide">{sentimentData?.signal || 'WAIT'}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom: Metrics Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50/70 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 rounded-xl p-3 flex flex-col items-center justify-center text-center transition-colors hover:bg-slate-100/50 dark:hover:bg-white/[0.05]">
                    <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">Confidence</span>
                    <div className="flex items-baseline gap-0.5">
                      <span className={`text-lg font-bold ${getScoreStyle(sentimentData?.confidence || 0)}`}>{sentimentData?.confidence || 0}</span>
                      <span className="text-[9px] font-medium text-slate-400">%</span>
                    </div>
                  </div>
                  <div className="bg-slate-50/70 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 rounded-xl p-3 flex flex-col items-center justify-center text-center transition-colors hover:bg-slate-100/50 dark:hover:bg-white/[0.05]">
                    <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">Tech Score</span>
                    <div className="flex items-baseline gap-0.5">
                      <span className={`text-lg font-bold ${getScoreStyle(sentimentData?.technicalScore || 0)}`}>{sentimentData?.technicalScore || 0}</span>
                      <span className="text-[9px] font-medium text-slate-400">/100</span>
                    </div>
                  </div>
                  <div className="bg-slate-50/70 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 rounded-xl p-3 flex flex-col items-center justify-center text-center transition-colors hover:bg-slate-100/50 dark:hover:bg-white/[0.05]">
                    <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">Trend</span>
                    <span className={`text-xs font-bold ${getTrendStyle(sentimentData?.trendStrength || 'Neutral')}`}>{sentimentData?.trendStrength || 'Neutral'}</span>
                  </div>
                </div>
                
              </div>
            </div>

            {/* SECTION 6: Technical Indicators Grid */}
            <div className="bg-white/80 dark:bg-[#121620]/80 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                  <BarChart3 size={16} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">Technical Indicators</h3>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'EMA 20', value: indicators?.ema20 },
                  { label: 'EMA 50', value: indicators?.ema50 },
                  { label: 'EMA 200', value: indicators?.ema200 },
                  { label: 'RSI (14)', value: indicators?.rsi },
                  { label: 'MACD', value: indicators?.macd },
                  { label: 'ADX', value: indicators?.adx },
                  { label: 'VWAP', value: indicators?.vwap },
                  { label: 'ATR', value: indicators?.atr },
                ].map((ind, i) => (
                  <div key={i} className="group flex flex-col bg-slate-50/50 dark:bg-[#181D28]/50 hover:bg-white dark:hover:bg-[#181D28] p-2 rounded-lg border border-slate-100 dark:border-white/5 transition-all duration-300 hover:shadow-sm">
                    <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5 transition-colors group-hover:text-indigo-500">{ind.label}</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">{ind.value ? Number(ind.value).toFixed(4) : '-'}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Support/Resistance & AI Coach */}
          <div className="space-y-6">
            
            {/* SECTION 5: Support & Resistance */}
            <div className="bg-white/80 dark:bg-[#121620]/80 backdrop-blur-xl border border-slate-200 dark:border-white/5 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                  <Target size={16} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">Key Levels</h3>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="group relative flex justify-between items-center p-3 rounded-xl bg-rose-50/50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/10 transition-colors hover:bg-rose-50 dark:hover:bg-rose-500/10">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-400 rounded-l-xl opacity-50" />
                  <span className="text-[9px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider">Resistance</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">{indicators?.resistance || '-'}</span>
                </div>
                
                <div className="group relative flex justify-between items-center p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10 transition-colors hover:bg-emerald-50 dark:hover:bg-emerald-500/10">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-400 rounded-l-xl opacity-50" />
                  <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Support</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">{indicators?.support || '-'}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={14} className="text-amber-500" />
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Risk</span>
                </div>
                <div className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
                  <span className="text-xs font-black text-amber-600 dark:text-amber-400 tracking-wider">{sentimentData?.riskLevel || 'Medium'}</span>
                </div>
              </div>
            </div>

            {/* SECTION 7: AI Coach */}
            <div className="bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-100 dark:border-indigo-500/10 rounded-2xl p-5 shadow-sm relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              
              <div className="flex items-center gap-3 mb-4 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0">
                  <BrainCircuit size={20} />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">AI Analysis</h3>
                  <span className="text-[9px] font-black text-indigo-500 uppercase tracking-wider">Tarapti Intelligence</span>
                </div>
              </div>

              <div className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 relative z-10 font-medium line-clamp-4 hover:line-clamp-none transition-all duration-300">
                {sentimentData?.aiExplanation ? (
                  <p>{sentimentData.aiExplanation}</p>
                ) : (
                  <p className="italic text-slate-500 text-[10px]">Generating market explanation based on current technical indicators and sentiment data...</p>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/30 rounded-xl text-xs text-amber-700 dark:text-amber-500/80 leading-relaxed text-center shadow-sm">
        <strong>Disclaimer:</strong> Analisis ini diambil berdasarkan data statistik dan bukan merupakan saran investasi. Trader diwajibkan untuk memiliki pertimbangan yang matang dan manajemen risiko sebelum mengambil keputusan investasi.
      </div>
    </div>
  );
};
