import React, { useMemo } from 'react';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { usePolling } from '../utils/polling.ts';

const mockData = [
  { symbol: 'XAUUSD', price: '2412.50', change: '+0.45%', isUp: true },
  { symbol: 'BTCUSD', price: '65230.00', change: '-1.20%', isUp: false },
  { symbol: 'OIL', price: '82.40', change: '+0.15%', isUp: true },
  { symbol: 'EURUSD', price: '1.0845', change: '-0.05%', isUp: false },
  { symbol: 'GBPUSD', price: '1.2670', change: '+0.22%', isUp: true },
  { symbol: 'USDJPY', price: '154.30', change: '+0.10%', isUp: true },
  { symbol: 'GBPJPY', price: '195.40', change: '+0.32%', isUp: true },
];

export const MarketWatchTicker = () => {
  const { data: tickerData, isLoading, isConnected } = usePolling<any>('/api/market/ticker', 1);

  const displayData = useMemo(() => {
    if (tickerData?.data && Array.isArray(tickerData.data) && tickerData.data.length > 0) {
      return tickerData.data;
    }
    return mockData;
  }, [tickerData]);

  return (
    <div className="w-full bg-slate-50 dark:bg-[#121620] border-b border-slate-200 dark:border-white/5 overflow-hidden flex items-center h-7 select-none">
      {!isConnected && (
         <div className="flex items-center justify-center px-4 shrink-0 text-amber-500 border-r border-slate-200 dark:border-white/5 h-full">
           <RefreshCw size={10} className="mr-1 animate-spin" />
           <span className="text-[9px] font-bold uppercase tracking-wider">Reconnecting...</span>
         </div>
      )}
      <div className="flex animate-marquee whitespace-nowrap">
        {/* We duplicate the list to make the marquee effect continuous */}
        {[...displayData, ...displayData, ...displayData, ...displayData].map((item: any, index: number) => (
          <div key={index} className="flex items-center gap-2 px-6 shrink-0 border-r border-slate-200 dark:border-white/5 last:border-0">
            <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{item.symbol}</span>
            <span className="text-[10px] font-medium text-slate-900 dark:text-white">{item.price}</span>
            <span className={`flex items-center text-[10px] font-bold ${item.isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
              {item.isUp ? <TrendingUp size={10} className="mr-0.5" /> : <TrendingDown size={10} className="mr-0.5" />}
              {item.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
