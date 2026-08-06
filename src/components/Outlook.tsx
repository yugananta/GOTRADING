import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Globe, Clock, Filter, AlertTriangle, TrendingUp, Search, Info, TrendingDown, Minus, BookOpen, ChevronDown, Lock, CheckCircle, BrainCircuit, BarChart3, Calendar, ArrowRight, RefreshCw } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';
import { useApp } from './AppContext.js';
import { poll } from '../utils/polling';
import { TradingViewCalendar } from './TradingViewCalendar.js';
import { TechnicalAnalysis } from './TechnicalAnalysis';
import { apiFetch } from '../utils/apiFetch';
import { parseUTCDate } from '../utils/dateUtils.ts';

export const getPairAnalysis = (pair: string) => {
  switch (pair) {
    case 'OANDA:XAUUSD':
      return {
        title: 'XAU/USD Liquidity Sweep Analysis',
        desc: 'Gold is currently in a Bullish structure on the H4 timeframe, but has just swept liquidity in the Asia Session High area (1925.50). There is potential for the formation of a valid H1 Order Block if price manages to break structure (BOS) below 1918.00.',
        level1: '1925.50 (Buy-side Liquidity)',
        level2: '1905.00 (Sell-side Liquidity / Target)'
      };
    case 'OANDA:EURUSD':
      return {
        title: 'EUR/USD Market Structure',
        desc: 'EUR/USD is currently accumulating in the H4 demand area. SMC indicators identify an unfilled Fair Value Gap (FVG) at 1.0850. Anticipate a potential sweep at the low before continuing upward expansion.',
        level1: '1.0920 (Premium / Target)',
        level2: '1.0820 (Discount / POI)'
      };
    case 'OANDA:GBPUSD':
      return {
        title: 'GBP/USD SMC Framework',
        desc: 'Bearish H4 structure. Price has just mitigated into the 1.2750 supply zone. Monitor price reaction as it touches the sell-side liquidity pool at 1.2600. A small bounce reaction is likely before the bearish trend continues.',
        level1: '1.2750 (Supply / Mitigation Block)',
        level2: '1.2600 (Liquidity Pool)'
      };
    case 'BINANCE:BTCUSDT':
      return {
        title: 'BTC/USDT Institutional Levels',
        desc: 'Bitcoin is in a consolidation phase. Institutional order flow indicates accumulation. Equal lows (EQ) at 62,000 potentially act as a liquidity sweep target before the next impulsive upward movement to the 68,000 supply area.',
        level1: '68,000 (Supply Zone)',
        level2: '62,000 (Equal Lows / Liquidity)'
      };
    default:
      return {
        title: 'Smart Money Concepts Analysis',
        desc: 'Market structure analysis based on order blocks and liquidity sweeps.',
        level1: 'Resistance / Premium',
        level2: 'Support / Discount'
      };
  }
};

interface ChartPointData {
  time: string;
  price: number;
  high: number;
  low: number;
  open: number;
  changePercent: number;
}

const LivePriceChart = ({ symbol }: { symbol: string }) => {
  const [chartData, setChartData] = useState<ChartPointData[]>([]);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [prevPrice, setPrevPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pollingStatus, setPollingStatus] = useState<'connected' | 'reconnecting'>('connected');

  useEffect(() => {
    setIsLoading(true);
    
    // Poll the REST API every 60s for real-time updates using the utility
    const stopPolling = poll<{ success: boolean; points: ChartPointData[]; currentPrice: number }>(
      `/api/charts/prices?pair=${encodeURIComponent(symbol)}`,
      (data) => {
        if (data.success && data.points) {
          setChartData(data.points);
          setPrevPrice(prev => (prev === null ? data.currentPrice : currentPrice));
          setCurrentPrice(data.currentPrice);
          setPollingStatus('connected');
        }
        setIsLoading(false);
      },
      (err) => {
        console.warn("Chart data polling failed, retrying in 60s:", err);
        setPollingStatus('reconnecting');
        setIsLoading(false);
      },
      60000
    );

    return () => stopPolling();
  }, [symbol]);

  // SMC Indicator level parser helper
  const extractPriceValue = (levelStr: string) => {
    const match = levelStr.match(/^[\d,.]+/);
    if (match) {
      return parseFloat(match[0].replace(/,/g, ''));
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="w-full h-full bg-[#0a0d14] flex flex-col items-center justify-center text-slate-400 gap-3 border border-slate-800 rounded-xl">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-[10px] font-bold tracking-wider font-mono">LOADING REAL-TIME REST DATA...</span>
      </div>
    );
  }

  // Get SMC Key Levels for this symbol
  const analysis = getPairAnalysis(symbol);
  const resistanceLevel = extractPriceValue(analysis.level1);
  const supportLevel = extractPriceValue(analysis.level2);

  // Determine change indicator colors
  const isUp = prevPrice !== null && currentPrice !== null ? currentPrice >= prevPrice : true;
  const priceColorClass = isUp ? 'text-emerald-500' : 'text-rose-500';

  // Calculate min and max for nicely scaled Y-axis
  const prices = chartData.map(d => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const padding = (maxPrice - minPrice) * 0.15 || 1;
  const yDomain = [
    Number((minPrice - padding).toFixed(symbol.includes('BTC') ? 0 : 4)),
    Number((maxPrice + padding).toFixed(symbol.includes('BTC') ? 0 : 4))
  ];

  return (
    <div className="w-full h-full bg-[#0d111a] flex flex-col p-4 relative font-sans text-white border border-slate-800/80 rounded-xl">
      {/* Top Bar Info */}
      <div className="flex items-center justify-between mb-3 border-b border-slate-800/60 pb-2.5 shrink-0">
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-slate-400 font-mono tracking-widest">{symbol.replace('OANDA:', '').replace('BINANCE:', '')}</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-lg font-black font-mono tracking-tight ${priceColorClass}`}>
              {currentPrice !== null ? currentPrice.toLocaleString() : '---'}
            </span>
            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded font-mono ${isUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              {isUp ? '▲ LIVE' : '▼ LIVE'}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <div className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-lg">
            <span className={`w-1.5 h-1.5 rounded-full ${pollingStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-ping'}`} />
            <span className="text-[9px] font-black tracking-wider text-indigo-300 font-mono">REST SYNC (20s)</span>
          </div>
          <span className="text-[8px] text-slate-500 font-bold mt-0.5 font-mono uppercase">WebSocket-Free Clean Feed</span>
        </div>
      </div>

      {/* Main Chart Body */}
      <div className="flex-1 w-full min-h-0 relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 12, right: 10, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" strokeOpacity={0.3} horizontal={true} vertical={false} />
            <XAxis 
              dataKey="time" 
              stroke="#475569" 
              fontSize={8} 
              tickLine={false} 
              axisLine={false}
              dy={8}
            />
            <YAxis 
              domain={yDomain} 
              stroke="#475569" 
              fontSize={8} 
              tickLine={false} 
              axisLine={false}
              orientation="left"
              tickFormatter={(val) => val.toLocaleString()}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
              labelStyle={{ fontSize: '9px', fontWeight: 'bold', color: '#94a3b8' }}
              itemStyle={{ fontSize: '10px', fontWeight: 'black', color: '#fff' }}
              formatter={(value: any) => [`$${parseFloat(value).toLocaleString()}`, 'Price']}
            />
            
            {/* Reference Line for SMC Resistance level */}
            {resistanceLevel && (
              <ReferenceLine 
                y={resistanceLevel} 
                stroke="#ef4444" 
                strokeDasharray="4 4" 
                strokeWidth={1.5}
                label={{ 
                  value: 'Premium OB Swept', 
                  fill: '#ef4444', 
                  fontSize: 8, 
                  fontWeight: 'black',
                  position: 'top',
                  offset: 4
                }} 
              />
            )}

            {/* Reference Line for SMC Support level */}
            {supportLevel && (
              <ReferenceLine 
                y={supportLevel} 
                stroke="#10b981" 
                strokeDasharray="4 4" 
                strokeWidth={1.5}
                label={{ 
                  value: 'Discount POI Zone', 
                  fill: '#10b981', 
                  fontSize: 8, 
                  fontWeight: 'black',
                  position: 'bottom',
                  offset: 4
                }} 
              />
            )}

            <Area 
              type="monotone" 
              dataKey="price" 
              stroke="#6366f1" 
              strokeWidth={2} 
              fillOpacity={1} 
              fill="url(#colorPrice)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Interactive Footer Legend / SMC Alerts */}
      <div className="flex items-center justify-between text-[8px] font-bold text-slate-500 font-mono mt-2 pt-2 border-t border-slate-900 shrink-0">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Structure: H4 Bullish BOS
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded bg-emerald-500" /> Target: Equal Highs
        </span>
      </div>
    </div>
  );
};

const sentimentHistoryData: Record<string, Array<{ time: string; bullish: number; bearish: number }>> = {
  'OANDA:XAUUSD': [
    { time: 'Mon', bullish: 62, bearish: 38 },
    { time: 'Tue', bullish: 58, bearish: 42 },
    { time: 'Wed', bullish: 65, bearish: 35 },
    { time: 'Thu', bullish: 71, bearish: 29 },
    { time: 'Fri', bullish: 68, bearish: 32 },
    { time: 'Sat', bullish: 72, bearish: 28 },
    { time: 'Sun', bullish: 74, bearish: 26 },
  ],
  'OANDA:EURUSD': [
    { time: 'Mon', bullish: 48, bearish: 52 },
    { time: 'Tue', bullish: 45, bearish: 55 },
    { time: 'Wed', bullish: 52, bearish: 48 },
    { time: 'Thu', bullish: 50, bearish: 50 },
    { time: 'Fri', bullish: 46, bearish: 54 },
    { time: 'Sat', bullish: 43, bearish: 57 },
    { time: 'Sun', bullish: 41, bearish: 59 },
  ],
  'OANDA:GBPUSD': [
    { time: 'Mon', bullish: 55, bearish: 45 },
    { time: 'Tue', bullish: 53, bearish: 47 },
    { time: 'Wed', bullish: 58, bearish: 42 },
    { time: 'Thu', bullish: 60, bearish: 40 },
    { time: 'Fri', bullish: 57, bearish: 43 },
    { time: 'Sat', bullish: 54, bearish: 46 },
    { time: 'Sun', bullish: 56, bearish: 44 },
  ],
  'BINANCE:BTCUSDT': [
    { time: 'Mon', bullish: 75, bearish: 25 },
    { time: 'Tue', bullish: 72, bearish: 28 },
    { time: 'Wed', bullish: 78, bearish: 22 },
    { time: 'Thu', bullish: 82, bearish: 18 },
    { time: 'Fri', bullish: 80, bearish: 20 },
    { time: 'Sat', bullish: 85, bearish: 15 },
    { time: 'Sun', bullish: 88, bearish: 12 },
  ],
};

const MarketSentimentCard = ({ symbol }: { symbol: string }) => {
  const { t } = useTranslation();
  const [showInfo, setShowInfo] = useState(false);
  const data = sentimentHistoryData[symbol] || sentimentHistoryData['OANDA:XAUUSD'];
  const currentBullish = data[data.length - 1].bullish;
  const currentBearish = data[data.length - 1].bearish;

  let biasKey = 'common.outlook.neutralBias';
  let biasColor = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';
  
  if (currentBullish >= 70) {
    biasKey = 'common.outlook.extremeBullish';
    biasColor = 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25';
  } else if (currentBearish >= 55) {
    biasKey = 'common.outlook.extremeBearish';
    biasColor = 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/25';
  } else if (currentBullish > 50) {
    biasColor = 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/25';
  }

  return (
    <div className="bg-white/80 dark:bg-[#121620]/60 backdrop-blur-lg border border-slate-200 dark:border-white/10 rounded-2xl p-4 shadow-sm space-y-4 relative">
      <div className="flex items-start justify-between gap-2 relative">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-500 dark:text-indigo-400 shrink-0">
            <BarChart3 size={16} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {t('common.outlook.marketSentiment')}
              </h3>
              <button
                type="button"
                onClick={() => setShowInfo(!showInfo)}
                onMouseEnter={() => setShowInfo(true)}
                onMouseLeave={() => setShowInfo(false)}
                className="text-slate-400 hover:text-indigo-500 dark:text-gray-500 dark:hover:text-indigo-400 p-0.5 rounded transition-colors"
                title="View Sentiment Formula"
                aria-label="Sentiment Formula Info"
              >
                <Info size={13} />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 dark:text-gray-500 font-medium tracking-wide">
              {t('common.outlook.sentimentSub')}
            </p>
          </div>
        </div>

        {showInfo && (
          <div className="absolute top-10 right-0 left-0 md:left-auto md:w-80 bg-slate-900/95 dark:bg-[#181d28]/95 backdrop-blur-md border border-slate-700 dark:border-gray-800 rounded-xl p-3 shadow-xl z-50 text-xs text-white space-y-2.5">
            <div className="font-bold border-b border-slate-700/50 pb-1.5 flex items-center gap-1.5 text-indigo-400">
              <Info size={14} />
              {t('common.outlook.sentimentTooltipTitle')}
            </div>
            <p className="text-[10px] text-slate-300 leading-relaxed">
              {t('common.outlook.sentimentTooltipDesc')}
            </p>
            <div className="space-y-2">
              <div className="bg-white/5 p-1.5 rounded border border-white/5">
                <span className="font-semibold block text-indigo-300 text-[10px]">{t('common.outlook.sentimentFactor1')}</span>
                <span className="text-[9px] text-slate-400 leading-normal">{t('common.outlook.sentimentFactor1Desc')}</span>
              </div>
              <div className="bg-white/5 p-1.5 rounded border border-white/5">
                <span className="font-semibold block text-indigo-300 text-[10px]">{t('common.outlook.sentimentFactor2')}</span>
                <span className="text-[9px] text-slate-400 leading-normal">{t('common.outlook.sentimentFactor2Desc')}</span>
              </div>
              <div className="bg-white/5 p-1.5 rounded border border-white/5">
                <span className="font-semibold block text-indigo-300 text-[10px]">{t('common.outlook.sentimentFactor3')}</span>
                <span className="text-[9px] text-slate-400 leading-normal">{t('common.outlook.sentimentFactor3Desc')}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="w-full h-[220px] rounded-xl overflow-hidden border border-slate-200 dark:border-gray-800 relative z-0 p-2 bg-[#0d111a]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="sentimentBullish" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="sentimentBearish" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" strokeOpacity={0.3} horizontal={true} vertical={false} />
            <XAxis 
              dataKey="time" 
              stroke="#475569" 
              fontSize={8} 
              tickLine={false} 
              axisLine={false}
              dy={6}
            />
            <YAxis 
              stroke="#475569" 
              fontSize={8} 
              tickLine={false} 
              axisLine={false}
              domain={[0, 100]}
              tickFormatter={(val) => `${val}%`}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px' }}
              labelStyle={{ fontSize: '9px', fontWeight: 'bold', color: '#94a3b8' }}
              itemStyle={{ fontSize: '10px', fontWeight: 'black' }}
              formatter={(value: any, name: any) => [`${value}%`, name === 'bullish' ? t('common.outlook.bullish') : t('common.outlook.bearish')]}
            />
            <Area 
              type="monotone" 
              dataKey="bullish" 
              stroke="#10b981" 
              strokeWidth={2} 
              fillOpacity={1} 
              fill="url(#sentimentBullish)" 
              name="bullish"
            />
            <Area 
              type="monotone" 
              dataKey="bearish" 
              stroke="#f43f5e" 
              strokeWidth={2} 
              fillOpacity={1} 
              fill="url(#sentimentBearish)" 
              name="bearish"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-col gap-3 bg-slate-50/50 dark:bg-[#181D28] border border-slate-100 dark:border-gray-800 p-3.5 rounded-xl">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700 dark:text-gray-300">
            {t('common.outlook.sentimentDetails')}
          </span>
          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${biasColor}`}>
            {t(biasKey)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-white/80 dark:bg-[#121620] border border-slate-200/60 dark:border-gray-800 rounded-lg p-2 flex flex-col">
            <span className="text-[9px] font-extrabold text-emerald-500 uppercase tracking-wider">{t('common.outlook.bullish')}</span>
            <span className="text-sm font-black text-slate-900 dark:text-white font-mono mt-0.5">{currentBullish}%</span>
          </div>
          <div className="bg-white/80 dark:bg-[#121620] border border-slate-200/60 dark:border-gray-800 rounded-lg p-2 flex flex-col">
            <span className="text-[9px] font-extrabold text-rose-500 uppercase tracking-wider">{t('common.outlook.bearish')}</span>
            <span className="text-sm font-black text-slate-900 dark:text-white font-mono mt-0.5">{currentBearish}%</span>
          </div>
        </div>

        <p className="text-[10px] text-slate-400 dark:text-gray-500 leading-normal font-medium">
          {t('common.outlook.sentimentDescription')}
        </p>
      </div>
    </div>
  );
};

const MarketClock = () => {
  const { i18n } = useTranslation();
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const formatTime = (date: Date, timeZone: string) => {
    return new Intl.DateTimeFormat(i18n.language, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: timeZone,
      hour12: false
    }).format(date);
  };

  const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jakarta';
  const tzAbbreviation = (() => {
    try {
      const parts = new Intl.DateTimeFormat(i18n.language, {
        timeZoneName: 'short',
        timeZone: userTimeZone
      }).formatToParts(currentTime);
      const tzPart = parts.find(part => part.type === 'timeZoneName');
      return tzPart ? tzPart.value : 'Local';
    } catch (e) {
      return 'Local';
    }
  })();

  return (
    <div className="grid grid-cols-2 gap-2 mb-3">
      <div className="bg-slate-900/10 dark:bg-slate-900/50 backdrop-blur-md border border-slate-300/80 dark:border-slate-700/60 rounded-lg p-2 shadow-2xs">
        <span className="text-[9px] font-black text-slate-600 dark:text-gray-300 block mb-0.5 uppercase tracking-wider">New York (EST/EDT)</span>
        <span className="text-base font-black text-slate-900 dark:text-white font-mono tracking-wider">{formatTime(currentTime, 'America/New_York')}</span>
      </div>
      <div className="bg-slate-900/10 dark:bg-slate-900/50 backdrop-blur-md border border-slate-300/80 dark:border-slate-700/60 rounded-lg p-2 shadow-2xs">
        <span className="text-[9px] font-black text-slate-600 dark:text-gray-300 block mb-0.5 uppercase tracking-wider">London (GMT/BST)</span>
        <span className="text-base font-black text-slate-900 dark:text-white font-mono tracking-wider">{formatTime(currentTime, 'Europe/London')}</span>
      </div>
      <div className="bg-slate-900/10 dark:bg-slate-900/50 backdrop-blur-md border border-slate-300/80 dark:border-slate-700/60 rounded-lg p-2 shadow-2xs">
        <span className="text-[9px] font-black text-slate-600 dark:text-gray-300 block mb-0.5 uppercase tracking-wider">Tokyo (JST)</span>
        <span className="text-base font-black text-slate-900 dark:text-white font-mono tracking-wider">{formatTime(currentTime, 'Asia/Tokyo')}</span>
      </div>
      <div className="bg-indigo-600/15 dark:bg-indigo-950/50 backdrop-blur-md border border-indigo-400/60 dark:border-indigo-500/60 rounded-lg p-2 shadow-2xs">
        <span className="text-[9px] font-black text-indigo-800 dark:text-indigo-200 block mb-0.5 uppercase tracking-wider">Local ({tzAbbreviation})</span>
        <span className="text-base font-black text-indigo-950 dark:text-indigo-100 font-mono tracking-wider">{formatTime(currentTime, userTimeZone)}</span>
      </div>
    </div>
  );
};

export const Outlook: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { showToast, outlookInitialTab } = useApp();
  
  const [activeTab, setActiveTab] = useState<'technical' | 'news'>(() => outlookInitialTab || 'news');

  useEffect(() => {
    if (outlookInitialTab) {
      setActiveTab(outlookInitialTab);
    }
  }, [outlookInitialTab]);
  const [newsFilter, setNewsFilter] = useState<'ALL' | 'High' | 'Medium' | 'Low'>('High');
  
  const [selectedNewsId, setSelectedNewsId] = useState<any>(1);
  const [countdown, setCountdown] = useState<string>('00:00:00');
  const [selectedPair, setSelectedPair] = useState<string>('OANDA:XAUUSD');

  const [calendarData, setCalendarData] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const activeCalendarData = React.useMemo(() => {
    return calendarData
      .filter(item => {
        if (!item.datetime) return false;
        return new Date(item.datetime).getTime() > currentTime;
      })
      .sort((a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());
  }, [calendarData, currentTime]);
  const [calendarImpactFilter, setCalendarImpactFilter] = useState<'all' | 'high'>('high');
  const [newsFeed, setNewsFeed] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Real-time and simulation states
  const [releasedEvents, setReleasedEvents] = useState<Record<any, any>>({});
  const [isSimulatingRelease, setIsSimulatingRelease] = useState<boolean>(false);
  const [liveInjectedNews, setLiveInjectedNews] = useState<any[]>([]);
  const [nextSyncSeconds, setNextSyncSeconds] = useState<number>(15);
  const [realtimeConnected, setRealtimeConnected] = useState<boolean>(true);
  const [isRefreshingCalendar, setIsRefreshingCalendar] = useState<boolean>(false);

  const refreshCalendarData = async () => {
    if (isRefreshingCalendar) return;
    setIsRefreshingCalendar(true);
    showToast("Syncing with FairEconomy Live Feed...", 1500);
    try {
      const res = await apiFetch(`/api/news?_t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.economicEvents && Array.isArray(data.economicEvents) && data.economicEvents.length > 0) {
          setCalendarData(data.economicEvents);
          showToast("Economic Calendar synchronized successfully!", 2000);
        }
        if (data.news && Array.isArray(data.news)) {
          setNewsFeed(data.news);
        }
      }
    } catch (err) {
      console.error("Failed to manual sync calendar:", err);
      showToast("Failed to refresh live calendar data.", 2000);
    } finally {
      setIsRefreshingCalendar(false);
      setNextSyncSeconds(15);
    }
  };

  // Sync Countdown Timer Effect
  useEffect(() => {
    const syncTimer = setInterval(() => {
      setNextSyncSeconds(prev => {
        if (prev <= 1) {
          return 15; // Reset to 15
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(syncTimer);
  }, []);

  // Primary data fetching effect (initial load)
  useEffect(() => {
    const fetchOutlookData = async () => {
      try {
        setIsLoading(true);
        const res = await apiFetch('/api/news');
        if (res.ok) {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const data = await res.json();
            if (data.economicEvents && Array.isArray(data.economicEvents) && data.economicEvents.length > 0) {
              setCalendarData(data.economicEvents);
              
              // Automatically select the next upcoming event
              const now = Date.now();
              const todayStart = new Date().setHours(0, 0, 0, 0);
              const activeEvents = data.economicEvents.filter((e: any) => e.datetime && new Date(e.datetime).getTime() >= todayStart);
              const upcoming = activeEvents.filter((e: any) => new Date(e.datetime).getTime() > now);
              if (upcoming.length > 0) {
                // Sort ascending by datetime to get closest future event
                const closest = [...upcoming].sort((a: any, b: any) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())[0];
                setSelectedNewsId(closest.id);
              } else if (activeEvents.length > 0) {
                setSelectedNewsId(activeEvents[0].id);
              } else {
                setSelectedNewsId(data.economicEvents[0]?.id || 1);
              }
            }
            if (data.news && Array.isArray(data.news)) {
              setNewsFeed(data.news);
            }
          } else {
            console.warn("Expected JSON but received HTML/other format. Server might be restarting.");
          }
        }
      } catch (err) {
        console.error("Failed to fetch outlook news/calendar data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchOutlookData();
  }, []);

  // Real-time Polling Data Refresh (REST API polling every 20 seconds)
  const releasedEventsRef = React.useRef(releasedEvents);
  const hasManuallySelectedRef = React.useRef<boolean>(false);

  useEffect(() => {
    releasedEventsRef.current = releasedEvents;
  }, [releasedEvents]);

  // Automatically select the next upcoming event matching the active news impact filter
  useEffect(() => {
    if (isLoading || activeCalendarData.length === 0) return;

    // Filter events by the current impact filter
    const filtered = activeCalendarData.filter(item => {
      if (newsFilter === 'High') return item.impact === 'High';
      if (newsFilter === 'Medium') return item.impact === 'Medium';
      if (newsFilter === 'Low') return item.impact === 'Low';
      return true;
    });

    if (filtered.length > 0) {
      // If the user has manually selected, and their selection still matches the active filter, keep it.
      if (hasManuallySelectedRef.current) {
        const matchesActiveFilter = filtered.some(e => e.id === selectedNewsId);
        if (matchesActiveFilter) return;
      }

      // Otherwise, select the closest upcoming event that matches the filter
      const now = Date.now();
      const upcoming = filtered.filter((e: any) => new Date(e.datetime).getTime() > now);
      if (upcoming.length > 0) {
        const closest = [...upcoming].sort((a: any, b: any) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())[0];
        setSelectedNewsId(closest.id);
      } else {
        // If there are no upcoming events, fallback to the first event matching the filter
        setSelectedNewsId(filtered[0].id);
      }
    }
  }, [activeCalendarData, newsFilter, isLoading]);

  useEffect(() => {
    const stopPolling = poll<any>(
      '/api/news',
      (data) => {
        setRealtimeConnected(true);
        setNextSyncSeconds(15); // Reset timer to 15s
        if (data.economicEvents && Array.isArray(data.economicEvents) && data.economicEvents.length > 0) {
          setCalendarData(prevCal => {
            return data.economicEvents.map((newEvent: any) => {
              const existingSim = releasedEventsRef.current[newEvent.id];
              if (existingSim) {
                return { ...newEvent, actual: existingSim.actual };
              }
              return newEvent;
            });
          });
        }
        if (data.news && Array.isArray(data.news)) {
          setNewsFeed(data.news);
        }
      },
      (err) => {
        console.warn("Polling sync failed:", err);
        setRealtimeConnected(false);
        setNextSyncSeconds(15); // Reset timer anyway to prevent getting stuck
      },
      15000
    );

    return () => stopPolling();
  }, []);

  // Extract selected news and merge potential simulated outcome
  const rawSelectedNews = activeCalendarData.find(item => item.id === selectedNewsId) || activeCalendarData[0] || {
    id: 1,
    time: '00:00',
    datetime: new Date(Date.now() + 3600000).toISOString(),
    currency: 'USD',
    impact: 'High',
    event: 'No upcoming events',
    actual: '-',
    forecast: '-',
    previous: '-',
    insight: {
      title: t('common.outlook.marketImpactAnalysis'),
      desc: t('common.outlook.noAnalysisAvailable'),
      conditionUp: t('common.outlook.noBullishScenario'),
      conditionDown: t('common.outlook.noBearishScenario')
    }
  };

  const simulatedOutcome = releasedEvents[rawSelectedNews.id];
  const selectedNews = {
    ...rawSelectedNews,
    actual: simulatedOutcome ? simulatedOutcome.actual : rawSelectedNews.actual,
    simulated: simulatedOutcome || null
  };

  // Timer Countdown Effect (Real-Time)
  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const targetTime = selectedNews.datetime ? new Date(selectedNews.datetime).getTime() : 0;
      const diff = targetTime - now;

      if (!targetTime || isNaN(targetTime) || diff <= 0) {
        setCountdown('00:00:00');
        // If current selected event has passed, automatically auto-advance to next upcoming event if available
        if (activeCalendarData.length > 0) {
          const upcoming = activeCalendarData.filter((e: any) => new Date(e.datetime).getTime() > now);
          if (upcoming.length > 0) {
            const nextClosest = [...upcoming].sort((a: any, b: any) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())[0];
            if (nextClosest.id !== selectedNewsId) {
              setSelectedNewsId(nextClosest.id);
            }
          }
        }
        return;
      }

      const totalSec = Math.floor(diff / 1000);
      const hrs = Math.floor(totalSec / 3600);
      const mins = Math.floor((totalSec % 3600) / 60);
      const secs = totalSec % 60;

      if (hrs >= 24) {
        const days = Math.floor(hrs / 24);
        const remHrs = hrs % 24;
        setCountdown(`${days}d ${String(remHrs).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m`);
      } else {
        setCountdown(`${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [selectedNews.datetime, activeCalendarData, selectedNewsId]);

  const handleSyncCalendar = (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const startDate = item.datetime ? new Date(item.datetime) : new Date();
    const endDate = new Date(startDate.getTime() + 30 * 60 * 1000);

    const formatDate = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `SUMMARY:Trading Event: ${item.event} (${item.currency})`,
      `DESCRIPTION:Economic Calendar Release - Impact: ${item.impact}. Forecast: ${item.forecast}, Previous: ${item.previous}`,
      `DTSTART:${formatDate(startDate)}`,
      `DTEND:${formatDate(endDate)}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${item.event.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(t('common.outlook.downloadSuccess', { event: item.event }));
  };

  // Real-time news flash generator & simulation trigger
  const simulateRelease = (newsItem: any) => {
    if (!newsItem || isSimulatingRelease) return;
    
    setIsSimulatingRelease(true);
    showToast(t('common.outlook.simulatingRelease', { event: newsItem.event }), 3000);
    
    setTimeout(() => {
      const fc = newsItem.forecast || '-';
      const prev = newsItem.previous || '-';
      
      let actualNum = 0;
      let actualStr = '';
      let impactType: 'bullish' | 'bearish' | 'neutral' = 'neutral';
      let deviationVal = '';
      
      const extractNum = (str: string) => {
        const matches = str.match(/[-+]?[0-9]*\.?[0-9]+/);
        return matches ? parseFloat(matches[0]) : null;
      };
      
      const numForecast = extractNum(fc);
      
      if (numForecast !== null) {
        const isBullishOutcome = Math.random() > 0.45;
        const percentDeviation = (Math.random() * 0.12 + 0.02); // 2% to 14% deviation
        
        let multiplier = 1;
        const eventLower = newsItem.event.toLowerCase();
        const isLowerBullish = eventLower.includes('unemployment') || eventLower.includes('claim') || eventLower.includes('layoff') || eventLower.includes('jobless');
        
        if (isLowerBullish) {
          multiplier = isBullishOutcome ? -1 : 1;
        } else {
          multiplier = isBullishOutcome ? 1 : -1;
        }
        
        actualNum = numForecast * (1 + percentDeviation * multiplier);
        impactType = isBullishOutcome ? 'bullish' : 'bearish';
        deviationVal = `${multiplier > 0 ? '+' : ''}${(percentDeviation * 100).toFixed(1)}%`;
        
        if (fc.includes('K')) {
          actualStr = `${Math.round(actualNum)}K`;
        } else if (fc.includes('%')) {
          actualStr = `${actualNum.toFixed(1)}%`;
        } else if (fc.includes('M')) {
          actualStr = `${actualNum.toFixed(1)}M`;
        } else {
          actualStr = actualNum.toFixed(2);
        }
      } else {
        const isBullishOutcome = Math.random() > 0.5;
        impactType = isBullishOutcome ? 'bullish' : 'bearish';
        actualStr = isBullishOutcome ? 'Expansion' : 'Contraction';
        deviationVal = isBullishOutcome ? '+High Deviation' : '-High Deviation';
      }
      
      let reactionSummary = '';
      let actionPlan = '';
      const curr = (newsItem.currency || 'USD').toUpperCase();
      
      if (impactType === 'bullish') {
        reactionSummary = t('common.outlook.bullishSummary', { event: newsItem.event, actual: actualStr, forecast: fc, curr: curr });
        actionPlan = `${t('common.outlook.realTimeStrategy')} ${t('common.outlook.bullishAction', { curr: curr })}`;
      } else {
        reactionSummary = t('common.outlook.bearishSummary', { event: newsItem.event, actual: actualStr, forecast: fc, curr: curr });
        actionPlan = `${t('common.outlook.realTimeStrategy')} ${t('common.outlook.bearishAction', { curr: curr })}`;
      }
      
      setReleasedEvents(prev => ({
        ...prev,
        [newsItem.id]: {
          actual: actualStr,
          deviation: deviationVal,
          impactType: impactType,
          reactionSummary: reactionSummary,
          actionPlan: actionPlan,
          releaseTime: 'Just now'
        }
      }));
      
      const newBreakingArticle = {
        id: `breaking_${newsItem.id}_${Date.now()}`,
        source: 'Tarapti Live News',
        time: 'Just now',
        title: `🔴 BREAKING: ${newsItem.event} released at ${actualStr} (Forecast: ${fc}). Market Impact: ${curr} ${impactType === 'bullish' ? 'STRENGTHENS' : 'WEAKENS'} sharply!`,
        url: '#',
        sentiment: {
          type: impactType,
          value: deviationVal
        },
        isLiveInjected: true,
        associatedCurrency: curr
      };
      
      setLiveInjectedNews(prev => [newBreakingArticle, ...prev]);
      setIsSimulatingRelease(false);
      showToast(t('common.outlook.releaseSuccess', { event: newsItem.event, actual: actualStr }), 4500);
    }, 2000);
  };

  // Memoized adapter that filters and ranks news based on the selected news currency
  const adaptedNewsFeed = React.useMemo(() => {
    if (!selectedNews) return newsFeed;
    
    const curr = (selectedNews.currency || 'USD').toUpperCase();
    const eventWord = (selectedNews.event || '').toLowerCase().split(' ')[0];
    
    const sorted = [...newsFeed].sort((a: any, b: any) => {
      const aTitle = (a.title || '').toUpperCase();
      const bTitle = (b.title || '').toUpperCase();
      
      const aHasCurrency = aTitle.includes(curr) || (curr === 'USD' && (aTitle.includes('FED') || aTitle.includes('US TREASURY') || aTitle.includes('POWELL') || aTitle.includes('WALL STREET')));
      const bHasCurrency = bTitle.includes(curr) || (curr === 'USD' && (bTitle.includes('FED') || bTitle.includes('US TREASURY') || bTitle.includes('POWELL') || bTitle.includes('WALL STREET')));
      
      const aHasEvent = eventWord && eventWord.length > 2 && (a.title || '').toLowerCase().includes(eventWord);
      const bHasEvent = eventWord && eventWord.length > 2 && (b.title || '').toLowerCase().includes(eventWord);
      
      const aScore = (aHasCurrency ? 2 : 0) + (aHasEvent ? 3 : 0);
      const bScore = (bHasCurrency ? 2 : 0) + (bHasEvent ? 3 : 0);
      
      return bScore - aScore;
    });

    return sorted.map((item: any) => {
      const title = (item.title || '').toUpperCase();
      const hasCurrency = title.includes(curr) || (curr === 'USD' && (title.includes('FED') || title.includes('US TREASURY') || title.includes('POWELL') || title.includes('WALL STREET')));
      const hasEvent = eventWord && eventWord.length > 2 && (item.title || '').toLowerCase().includes(eventWord);
      
      return {
        ...item,
        isRelatedToRelease: hasCurrency || hasEvent,
        relatedLabel: hasEvent ? t('common.outlook.relationEvent', { event: selectedNews.event }) : hasCurrency ? t('common.outlook.relationSector', { curr: curr }) : undefined
      };
    });
  }, [newsFeed, selectedNewsId]);

  // Combine live injected news, pre-release analyses, and adapted Finnhub news
  const finalNewsFeed = React.useMemo(() => {
    const curr = (selectedNews.currency || 'USD').toUpperCase();
    
    // Inject two hyper-focused analysis reports tailored specifically to the selected release
    const preReleaseAnalyses = [
      {
        id: `prerelease_1_${selectedNews.id}`,
        source: 'SMC Research Desk',
        time: t('common.outlook.scheduledAnalysis'),
        title: t('common.outlook.liquidityProjection', { event: selectedNews.event, currency: selectedNews.currency }),
        url: '#',
        sentiment: {
          type: 'neutral',
          value: 'Pre-Release'
        },
        isPreRelease: true,
        isRelatedToRelease: true,
        relatedLabel: t('common.outlook.sentimentAnalysis', { curr: selectedNews.currency })
      },
      {
        id: `prerelease_2_${selectedNews.id}`,
        source: 'Tarapti Intelligence',
        time: t('common.outlook.consensusProjection'),
        title: t('common.outlook.marketDeviation', { forecast: selectedNews.forecast, event: selectedNews.event }),
        url: '#',
        sentiment: {
          type: 'neutral',
          value: 'Konsensus'
        },
        isPreRelease: true,
        isRelatedToRelease: true,
        relatedLabel: t('common.outlook.volatilityConsensus')
      }
    ];

    return [
      ...liveInjectedNews.filter((n: any) => n.associatedCurrency === curr),
      ...preReleaseAnalyses,
      ...adaptedNewsFeed
    ];
  }, [liveInjectedNews, adaptedNewsFeed, selectedNewsId]);

  const pairsList = [
    { value: 'OANDA:XAUUSD', label: 'Gold (XAU/USD)' },
    { value: 'OANDA:EURUSD', label: 'EUR/USD' },
    { value: 'OANDA:GBPUSD', label: 'GBP/USD' },
    { value: 'BINANCE:BTCUSDT', label: 'Bitcoin (BTC/USDT)' }
  ];

  const analysis = getPairAnalysis(selectedPair);

  const renderLiveMarketIntelligenceCard = () => (
    <div className="bg-white/80 dark:bg-[#121620]/60 backdrop-blur-lg border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-gray-800/60 pb-3">
        <div>
          <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
            <Globe size={16} className="text-indigo-500 dark:text-indigo-400" />
            Live Market Intelligence
          </h2>
          <p className="text-[10px] text-slate-400 dark:text-gray-500">News adjusts dynamically to selected {selectedNews.currency} event</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono font-bold text-slate-500 dark:text-gray-400 bg-slate-100 dark:bg-gray-800 px-2 py-0.5 rounded flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
            Sync in {nextSyncSeconds}s
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            realtimeConnected 
              ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10' 
              : 'text-amber-600 dark:text-amber-400 bg-amber-500/10 animate-pulse'
          }`}>
            {realtimeConnected ? 'Live Feed' : 'Connecting...'}
          </span>
        </div>
      </div>

      {isLoading && finalNewsFeed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 space-y-2">
          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-400">Loading live Finnhub news...</span>
        </div>
      ) : finalNewsFeed.length === 0 ? (
        null
      ) : (
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
          {finalNewsFeed.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target={item.url === '#' ? undefined : "_blank"}
              rel={item.url === '#' ? undefined : "noopener noreferrer"}
              className={`block p-3 rounded-xl border transition group relative ${
                item.isLiveInjected
                  ? 'border-rose-400 bg-rose-50/20 dark:border-rose-500/30 dark:bg-rose-500/5 shadow-[0_0_12px_rgba(244,63,94,0.06)] animate-in fade-in slide-in-from-top-3 duration-500'
                  : item.isPreRelease
                    ? 'border-indigo-200 bg-indigo-500/[0.02] dark:border-indigo-500/20 dark:bg-indigo-500/[0.01]'
                    : item.isRelatedToRelease
                      ? 'border-slate-200 bg-slate-50/50 dark:border-gray-800/80 dark:bg-[#181D28]/40 hover:bg-slate-100 dark:hover:bg-[#181D28]/80'
                      : 'border-slate-100 dark:border-gray-800/40 bg-white dark:bg-[#121620]/20 hover:bg-slate-50 dark:hover:bg-[#181D28]/30'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    item.isLiveInjected
                      ? 'bg-rose-500 text-white animate-pulse'
                      : item.isPreRelease
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400'
                        : 'bg-slate-100 text-slate-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {item.source}
                  </span>
                  
                  {/* Related Badge */}
                  {item.isRelatedToRelease && (
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${
                      item.isLiveInjected 
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
                    }`}>
                      🔥 {item.relatedLabel || `Relasi: Sektor ${selectedNews.currency}`}
                    </span>
                  )}
                </div>
                <span className="text-[9px] text-slate-400 dark:text-gray-500 font-mono font-medium">{item.time}</span>
              </div>
              
              <h4 className={`text-xs font-bold leading-snug transition ${
                item.isLiveInjected 
                  ? 'text-slate-900 dark:text-white' 
                  : 'text-slate-800 dark:text-slate-200 group-hover:text-violet-500 dark:group-hover:text-indigo-400'
              }`}>
                {item.title}
              </h4>
              
              {item.sentiment && (
                <div className="flex items-center gap-1.5 mt-2">
                  <span className="text-[9px] font-medium text-slate-400">Sentimen:</span>
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                    item.sentiment.type === 'bullish' 
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' 
                      : item.sentiment.type === 'bearish' 
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400' 
                      : 'bg-slate-500/15 text-slate-600 dark:text-slate-400'
                  }`}>
                    {item.sentiment.type.toUpperCase()} ({item.sentiment.value})
                  </span>
                </div>
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );

  const renderTechnicalSection = () => (
    <TechnicalAnalysis />
  );

  const renderNewsSection = () => (
    <div className="space-y-6">
      {/* Session Clock & Countdown */}
      <div className="bg-white/80 dark:bg-[#121620]/60 backdrop-blur-lg border border-slate-200 dark:border-white/10 rounded-2xl p-3.5 shadow-sm relative overflow-hidden">
        <Globe className="absolute -right-3 -bottom-3 text-slate-800/10 dark:text-gray-800/20 w-24 h-24 pointer-events-none" />
        <div className="relative z-10">
          <h2 className="text-[9px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <Clock size={11} /> Global Market Clocks
          </h2>
          
          <MarketClock />

          <div className={`rounded-xl p-2.5 flex items-center justify-between transition-all duration-300 ${
            selectedNews.simulated 
              ? 'bg-emerald-50 border border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.08)]' 
              : 'bg-rose-50 border border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20 animate-[pulse_3s_infinite]'
          }`}>
            <div className="flex-1 min-w-0 pr-2">
              <span className={`text-[8.5px] font-bold uppercase tracking-wider block mb-0.5 flex items-center gap-1 ${
                selectedNews.simulated ? 'text-emerald-500 dark:text-emerald-400' : 'text-rose-500 dark:text-rose-400'
              }`}>
                {selectedNews.simulated ? (
                  <>
                    <CheckCircle size={9} className="animate-bounce" /> {t('common.outlook.liveReleaseActive')}
                  </>
                ) : (
                  <>
                    <AlertTriangle size={9} /> {t('common.outlook.dynamicEventCountdown')}
                  </>
                )}
              </span>
              <span className="text-[11px] font-bold text-slate-900 dark:text-white truncate block">
                {selectedNews.event} ({selectedNews.currency})
              </span>
              {selectedNews.simulated && (
                <span className="text-[9px] text-slate-500 dark:text-gray-400 mt-0.5 block font-medium">
                  Actual: <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{selectedNews.actual}</span> (Forecast: {selectedNews.forecast})
                </span>
              )}
            </div>
            <div className="text-right shrink-0 flex flex-col items-end gap-0.5">
              {selectedNews.simulated ? (
                <span className="text-[10px] font-black text-emerald-500 dark:text-emerald-400 font-mono tracking-wider animate-pulse bg-emerald-500/10 px-1.5 py-0.5 rounded">RELEASED</span>
              ) : (
                <div className="flex items-center gap-2 bg-rose-600 text-white px-3 py-1 rounded-xl border border-rose-700 shadow-md">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-80"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                  </span>
                  <span className="text-base font-black text-white font-mono tracking-widest drop-shadow-xs">{countdown}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Localized News Explanation */}
      {finalNewsFeed.length === 0 && !isLoading && (
        <div className="bg-white dark:bg-[#121620]/60 backdrop-blur-lg border border-slate-200 dark:border-white/10 rounded-2xl p-6 text-center space-y-4 shadow-sm">
          <div className="relative w-12 h-12 mx-auto flex items-center justify-center">
            <div className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-2xl rotate-6" />
            <div className="relative w-12 h-12 bg-gradient-to-tr from-indigo-600 to-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-md">
              <Globe size={22} />
            </div>
          </div>

          <div className="max-w-sm mx-auto space-y-1">
            <h4 className="text-sm font-black text-slate-800 dark:text-white">
              {t('common.outlook.newsExplanation.title')}
            </h4>
            <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed">
              {t('common.outlook.newsExplanation.noHeadlines')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left max-w-xl mx-auto">
            <div 
              onClick={() => setSelectedPair(selectedPair === 'OANDA:XAUUSD' ? 'OANDA:EURUSD' : 'OANDA:XAUUSD')}
              className="p-2.5 bg-slate-50 dark:bg-slate-900/50 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-2xl space-y-1 transition-all duration-200 cursor-pointer active:scale-[0.98] group"
            >
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-950/60 group-hover:bg-indigo-600 group-hover:text-white text-indigo-600 dark:text-indigo-400 text-[9px] font-black flex items-center justify-center transition-colors">1</span>
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{t('common.outlook.newsExplanation.step1Title')}</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-gray-400 leading-normal">
                {t('common.outlook.newsExplanation.step1Desc')}
              </p>
            </div>

            <div 
              onClick={() => setNewsFilter('ALL')}
              className="p-2.5 bg-slate-50 dark:bg-slate-900/50 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-2xl space-y-1 transition-all duration-200 cursor-pointer active:scale-[0.98] group"
            >
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-950/60 group-hover:bg-indigo-600 group-hover:text-white text-indigo-600 dark:text-indigo-400 text-[9px] font-black flex items-center justify-center transition-colors">2</span>
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{t('common.outlook.newsExplanation.step2Title')}</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-gray-400 leading-normal">
                {t('common.outlook.newsExplanation.step2Desc')}
              </p>
            </div>

            <div 
              onClick={() => {
                const el = document.getElementById('economic-calendar-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="p-2.5 bg-slate-50 dark:bg-slate-900/50 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/40 border border-slate-200/80 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-2xl space-y-1 transition-all duration-200 cursor-pointer active:scale-[0.98] group"
            >
              <div className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded-full bg-indigo-100 dark:bg-indigo-950/60 group-hover:bg-indigo-600 group-hover:text-white text-indigo-600 dark:text-indigo-400 text-[9px] font-black flex items-center justify-center transition-colors">3</span>
                <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{t('common.outlook.newsExplanation.step3Title')}</span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-gray-400 leading-normal">
                {t('common.outlook.newsExplanation.step3Desc')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Economic Calendar */}
      <div id="economic-calendar-section" className="bg-white/80 dark:bg-[#121620]/60 backdrop-blur-lg border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-gray-800/40">
          <div>
            <h2 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>📅</span>
              Economic Calendar
            </h2>
            <p className="text-[10px] text-slate-400 dark:text-gray-500">Global high volatility economic indicators</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            {/* Manual Sync Button */}
            <button
              onClick={refreshCalendarData}
              disabled={isRefreshingCalendar}
              className={`px-2.5 py-1.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 hover:bg-slate-50 dark:hover:bg-slate-800 text-[10px] font-black uppercase flex items-center gap-1.5 transition cursor-pointer active:scale-95 disabled:opacity-50 ${
                isRefreshingCalendar ? 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200'
              }`}
              title="Force manual real-time update"
            >
              <RefreshCw size={11} className={isRefreshingCalendar ? 'animate-spin text-indigo-500' : 'text-slate-400'} />
              <span>{isRefreshingCalendar ? 'Syncing...' : 'Sync Live Feed'}</span>
            </button>

            {/* High Impact Toggle Filter */}
            <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800/90 p-1 rounded-xl border border-slate-200 dark:border-slate-700/80">
              <button
                onClick={() => setCalendarImpactFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition ${
                  calendarImpactFilter === 'all'
                    ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs border border-slate-200/80 dark:border-slate-700'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                All ({activeCalendarData.length})
              </button>
              <button
                onClick={() => setCalendarImpactFilter('high')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition ${
                  calendarImpactFilter === 'high'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'text-slate-500 hover:text-rose-600 dark:hover:text-rose-400'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${calendarImpactFilter === 'high' ? 'bg-white animate-pulse' : 'bg-rose-500'}`}></span>
                High Only ({activeCalendarData.filter(e => e.impact?.toLowerCase() === 'high').length})
              </button>
            </div>

            {/* Economic Impact Legend & Tooltip */}
            <div className="relative group flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 cursor-help text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500" title="High Impact"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Medium Impact"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Low Impact"></div>
              </div>
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">Legend</span>
              <Info size={11} className="text-slate-400 group-hover:text-indigo-500 transition" />

              {/* Tooltip Popup */}
              <div className="absolute right-0 top-full mt-2 w-64 p-3.5 bg-slate-900/95 dark:bg-slate-900/95 backdrop-blur-md text-white rounded-xl shadow-2xl border border-slate-800 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none group-hover:pointer-events-auto z-50 text-[10px] space-y-2.5">
                <div className="font-black text-[11px] text-white border-b border-slate-800 pb-1.5 flex items-center justify-between">
                  <span>Economic Impact Levels</span>
                  <span className="text-[9px] text-indigo-400 font-semibold uppercase tracking-wider">Guide</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="flex items-center gap-0.5 mt-0.5 shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                    </div>
                    <div>
                      <span className="font-extrabold text-rose-400 block leading-tight">High Impact (Red)</span>
                      <span className="text-slate-300 text-[9px] leading-tight block">Major price volatility expected (e.g. CPI, NFP, Interest Rates).</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className="flex items-center gap-0.5 mt-0.5 shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                    </div>
                    <div>
                      <span className="font-extrabold text-amber-400 block leading-tight">Medium Impact (Amber)</span>
                      <span className="text-slate-300 text-[9px] leading-tight block">Moderate potential price swings on affected currencies.</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className="flex items-center gap-0.5 mt-0.5 shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    </div>
                    <div>
                      <span className="font-extrabold text-emerald-400 block leading-tight">Low Impact (Green)</span>
                      <span className="text-slate-300 text-[9px] leading-tight block">Minor or routine macroeconomic release.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
          {(calendarImpactFilter === 'high' 
            ? activeCalendarData.filter(e => e.impact?.toLowerCase() === 'high') 
            : activeCalendarData
          ).length === 0 ? (
            <div className="p-5 text-center bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-gray-800 rounded-2xl space-y-2">
              <Calendar size={22} className="mx-auto text-indigo-500" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {calendarImpactFilter === 'high' ? 'No High Impact Events Found' : 'No Economic Events Found'}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-gray-400 max-w-xs mx-auto leading-relaxed">
                {calendarImpactFilter === 'high' ? 'Switch filter to "All" to view medium & low impact releases.' : 'Broaden your weekly filter to view scheduled macro releases.'}
              </p>
            </div>
          ) : (
            (calendarImpactFilter === 'high' 
              ? activeCalendarData.filter(e => e.impact?.toLowerCase() === 'high') 
              : activeCalendarData
            ).map((item) => (
              <div 
                key={item.id} 
                onClick={() => setSelectedNewsId(item.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  selectedNewsId === item.id
                    ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800 ring-1 ring-indigo-400/30'
                    : 'bg-white dark:bg-[#161b26]/80 border-slate-200 dark:border-gray-800/80 hover:border-slate-300 dark:hover:border-gray-700'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex flex-col items-center justify-center px-2 py-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg min-w-[48px] text-center border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[8px] font-bold text-slate-400 dark:text-slate-400 uppercase">
                      {parseUTCDate(item.datetime).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone })}
                    </span>
                    <span className="text-[10px] font-black text-slate-800 dark:text-slate-100 leading-none my-0.5">
                      {parseUTCDate(item.datetime).toLocaleTimeString(i18n.language, { hour: '2-digit', minute: '2-digit', hour12: false, timeZoneName: 'short', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone })}
                    </span>
                    <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400">{item.currency}</span>
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{item.event}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {/* Impact Indicator Dots */}
                      {(item.impact === 'High' || item.impact === 'high') && (
                        <div className="flex items-center gap-0.5" title="High Impact">
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                        </div>
                      )}
                      {(item.impact === 'Medium' || item.impact === 'medium') && (
                        <div className="flex items-center gap-0.5" title="Medium Impact">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                        </div>
                      )}
                      {(item.impact === 'Low' || item.impact === 'low') && (
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Low Impact"></div>
                      )}

                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        {item.impact || 'Medium'} Impact
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  {item.forecast && item.forecast !== '-' && (
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      Est: <span className="font-bold text-slate-800 dark:text-slate-200">{item.forecast}</span>
                    </div>
                  )}
                  {item.previous && item.previous !== '-' && (
                    <div className="text-[9px] text-slate-400 dark:text-slate-500">
                      Prev: {item.previous}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Dynamic Impact Analysis for the selected news */}
      <div className={`relative overflow-hidden border rounded-2xl p-5 shadow-sm space-y-4 transition-all duration-300 ${
        selectedNews.simulated 
          ? selectedNews.simulated.impactType === 'bullish'
            ? 'bg-emerald-500/[0.04] border-emerald-500/20 dark:bg-emerald-500/[0.02] dark:border-emerald-500/10'
            : 'bg-rose-500/[0.04] border-rose-500/20 dark:bg-rose-500/[0.02] dark:border-rose-500/10'
          : 'bg-indigo-50 border border-indigo-100 dark:bg-indigo-600/10 dark:border-indigo-500/20'
      }`}>
        
        {/* Header with Live Controller */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              selectedNews.simulated 
                ? selectedNews.simulated.impactType === 'bullish'
                  ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400'
                  : 'bg-rose-100 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                : 'bg-indigo-100 text-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-400'
            }`}>
              <BookOpen size={16} />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {selectedNews.simulated ? `Live Impact: ${selectedNews.event}` : selectedNews.insight.title}
              </h3>
              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                <span className="text-[9px] text-slate-400 dark:text-gray-500 font-medium uppercase tracking-wider">{t('common.outlook.dynamicImpactAnalysis')}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-gray-700"></span>
                <span className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 uppercase font-mono">{selectedNews.currency}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-gray-700"></span>
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                  📅 {selectedNews.datetime ? parseUTCDate(selectedNews.datetime).toLocaleString(navigator.language || undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }).replace(/\s*(AM|PM|am|pm)/gi, '') : selectedNews.time}
                </span>
              </div>
            </div>
          </div>

          {/* Simulation Button */}
          <button
            disabled={isSimulatingRelease}
            onClick={() => simulateRelease(selectedNews)}
            className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all duration-300 flex items-center gap-1 shrink-0 ${
              isSimulatingRelease
                ? 'bg-slate-100 text-slate-400 dark:bg-gray-800 dark:text-gray-600 cursor-not-allowed'
                : selectedNews.simulated
                  ? 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  : 'bg-slate-900 text-white hover:bg-black dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100 shadow-sm'
            }`}
          >
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${selectedNews.simulated ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${selectedNews.simulated ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            </span>
            {isSimulatingRelease ? 'Analyzing...' : selectedNews.simulated ? 'Re-simulate' : 'Simulate Release'}
          </button>
        </div>

        {/* Simulation Progress Screen */}
        {isSimulatingRelease && (
          <div className="bg-white/80 dark:bg-[#121620] rounded-xl p-4 border border-slate-200 dark:border-gray-800/60 flex flex-col items-center justify-center space-y-3 animate-in fade-in duration-300">
            <div className="w-full bg-slate-100 dark:bg-gray-800 rounded-full h-1.5 overflow-hidden">
              <div className="bg-indigo-500 h-full rounded-full animate-[loading_2s_ease-in-out_infinite]" style={{ width: '60%' }}></div>
            </div>
            <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 font-mono animate-pulse uppercase tracking-wider">
              ⚡ Receiving Live Data Feed & Calculating Volatility...
            </span>
          </div>
        )}

        {/* Simulated/Live Result Content */}
        {selectedNews.simulated && !isSimulatingRelease && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Big outcome bar */}
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
              selectedNews.simulated.impactType === 'bullish'
                ? 'bg-emerald-50 border-emerald-100 dark:bg-emerald-500/5 dark:border-emerald-500/10'
                : 'bg-rose-50 border-rose-100 dark:bg-rose-500/5 dark:border-rose-500/10'
            }`}>
              <div>
                <span className="text-[9px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider block mb-0.5">Actual Outcome & Deviation</span>
                <div className="flex items-baseline gap-2">
                  <span className={`text-xl font-black ${
                    selectedNews.simulated.impactType === 'bullish' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {selectedNews.simulated.actual}
                  </span>
                  <span className="text-xs text-slate-400">vs Forecast {selectedNews.forecast}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                  selectedNews.simulated.impactType === 'bullish'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-400'
                }`}>
                  {selectedNews.simulated.impactType === 'bullish' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {selectedNews.simulated.deviation} Deviation ({selectedNews.simulated.impactType})
                </span>
              </div>
            </div>

            {/* Reaction Summary */}
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider block">Real-Time Market Reaction Analysis</span>
              <p className="text-xs text-slate-700 dark:text-gray-300 leading-relaxed bg-white/50 dark:bg-[#121620]/60 p-3.5 rounded-xl border border-slate-100 dark:border-gray-800">
                {selectedNews.simulated.reactionSummary}
              </p>
            </div>

            {/* Trading action board */}
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider block">SMC Strategy Recommendation (Real-Time)</span>
              <div className="bg-gradient-to-r from-indigo-50 to-indigo-100/50 dark:from-indigo-950/20 dark:to-indigo-900/10 rounded-xl p-3.5 border border-indigo-100/80 dark:border-indigo-500/10 space-y-1.5">
                <p className="text-xs font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></span>
                  Trading Action Plan:
                </p>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {selectedNews.simulated.actionPlan}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Standard Informative Content (Not yet simulated) */}
        {!selectedNews.simulated && !isSimulatingRelease && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <p className="text-xs text-slate-700 dark:text-gray-300 leading-relaxed bg-white/50 dark:bg-[#121620]/60 p-3 rounded-xl border border-slate-100 dark:border-gray-800">
              {selectedNews.insight.desc}
            </p>
            
            <div className="space-y-2">
               <h4 className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider">Prediction Scenarios ({selectedNews.currency}):</h4>
               <div className="bg-white dark:bg-[#121620] rounded-xl p-3 border border-slate-200 dark:border-gray-800/60 space-y-2">
                 <div className="flex items-start gap-2">
                   <TrendingUp size={14} className="text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
                   <p className="text-[10px] text-slate-700 dark:text-gray-300"><span className="text-emerald-500 dark:text-emerald-400 font-bold">Upward Scenario (Actual &gt; Forecast):</span> {selectedNews.insight.conditionUp}</p>
                 </div>
                 <div className="h-px bg-slate-200 dark:bg-gray-800"></div>
                 <div className="flex items-start gap-2">
                   <TrendingDown size={14} className="text-rose-500 dark:text-rose-400 shrink-0 mt-0.5" />
                   <p className="text-[10px] text-slate-700 dark:text-gray-300"><span className="text-rose-500 dark:text-rose-400 font-bold">Downward Scenario (Actual &lt; Forecast):</span> {selectedNews.insight.conditionDown}</p>
                 </div>
               </div>
            </div>
            
            <div className="text-[10px] text-indigo-500 dark:text-indigo-400 bg-indigo-500/10 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 font-bold">
              <span>💡 Tip: Click the &quot;Simulate Release&quot; button above to view the actual live release.</span>
            </div>
          </div>
        )}
      </div>

      {/* Live Finnhub Market News Feed */}
      <div className="lg:hidden">
        {renderLiveMarketIntelligenceCard()}
      </div>
    </div>
  );

  return (
    <div className="py-2 w-full max-w-none relative">
      <div className="w-full animate-in fade-in duration-300">
      
        {/* MOBILE SELECTOR CARDS (VISIBLE ONLY ON MOBILE) */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 mt-3 mb-5 lg:hidden">
          
          {/* CARD 1: NEWS & CALENDAR */}
          <div
            onClick={() => setActiveTab('news')}
            className={`group relative overflow-hidden rounded-2xl p-2.5 sm:p-3 transition-all duration-300 cursor-pointer select-none flex flex-col justify-between border ${
              activeTab === 'news'
                ? 'bg-indigo-600 border-indigo-400 text-white shadow-[inset_0_2px_6px_rgba(255,255,255,0.3),0_6px_12px_rgba(0,0,0,0.3)] scale-[1.02] ring-2 ring-white/30 z-10'
                : 'bg-indigo-600/90 border-indigo-500 text-indigo-50 hover:bg-indigo-600 shadow-sm opacity-85 hover:opacity-100'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1 min-w-0">
                  <Calendar size={13} className='text-indigo-200 shrink-0' />
                  <span className='text-[10px] sm:text-[11px] font-black truncate text-white'>{t('common.outlook.newsAndCalendar')}</span>
                </div>
                {activeTab === 'news' && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" title="Active" />
                )}
              </div>

              <p className='text-[9px] sm:text-[10px] leading-tight font-medium line-clamp-2 text-indigo-100'>
                {t('common.outlook.newsAndCalendarDesc')}
              </p>
            </div>

            <div className='pt-1.5 flex items-center justify-between text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider text-indigo-200'>
              <span>News</span>
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>

          {/* CARD 2: TECHNICAL ANALYSIS */}
          <div
            onClick={() => setActiveTab('technical')}
            className={`group relative overflow-hidden rounded-2xl p-2.5 sm:p-3 transition-all duration-300 cursor-pointer select-none flex flex-col justify-between border ${
              activeTab === 'technical'
                ? 'bg-violet-600 border-violet-400 text-white shadow-[inset_0_2px_6px_rgba(255,255,255,0.3),0_6px_12px_rgba(0,0,0,0.3)] scale-[1.02] ring-2 ring-white/30 z-10'
                : 'bg-violet-600/90 border-violet-500 text-violet-50 hover:bg-violet-600 shadow-sm opacity-85 hover:opacity-100'
            }`}
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1 min-w-0">
                  <TrendingUp size={13} className='text-violet-200 shrink-0' />
                  <span className='text-[10px] sm:text-[11px] font-black truncate text-white'>{t('common.outlook.technicalAnalysis')}</span>
                </div>
                {activeTab === 'technical' && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" title="Active" />
                )}
              </div>

              <p className='text-[9px] sm:text-[10px] leading-tight font-medium line-clamp-2 text-violet-100'>
                {t('common.outlook.technicalAnalysisDesc')}
              </p>
            </div>

            <div className='pt-1.5 flex items-center justify-between text-[8px] sm:text-[9px] font-extrabold uppercase tracking-wider text-violet-200'>
              <span>Chart</span>
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>

        </div>

        {/* MOBILE VIEW (< lg): SINGLE TAB DISPLAY */}
        <div className="lg:hidden space-y-6">
          {activeTab === 'technical' && renderTechnicalSection()}
          {activeTab === 'news' && renderNewsSection()}
        </div>

        {/* DESKTOP / WEB PROPORTIONAL VIEW (>= lg): BOTH SECTIONS SIDE-BY-SIDE */}
        <div className="hidden lg:grid lg:grid-cols-12 lg:gap-6 items-start mt-3">
          {/* LEFT COLUMN: TECHNICAL ANALYSIS & LIVE CHART */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            {renderTechnicalSection()}
          </div>

          {/* RIGHT COLUMN: NEWS, MARKET CLOCKS & CALENDAR */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6 sticky top-4">
            {renderNewsSection()}
          </div>
        </div>

      </div>
    </div>
  );
};
