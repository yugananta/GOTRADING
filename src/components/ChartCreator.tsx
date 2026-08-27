import React, { useState } from 'react';
import { PostChart, ChartPoint } from '../types.js';
import { Activity, TrendingUp, TrendingDown, AlignLeft, Check } from 'lucide-react';

interface ChartCreatorProps {
  onAddChart: (chart: PostChart) => void;
  onCancel: () => void;
}

export const ChartCreator: React.FC<ChartCreatorProps> = ({ onAddChart, onCancel }) => {
  const [pair, setPair] = useState('XAUUSD');
  const [timeframe, setTimeframe] = useState('H4');
  const [status, setStatus] = useState<'Bullish' | 'Bearish' | 'Neutral'>('Bullish');

  const generatePoints = (sentiment: 'Bullish' | 'Bearish' | 'Neutral'): ChartPoint[] => {
    const base = sentiment === 'Bullish' ? 100 : sentiment === 'Bearish' ? 100 : 100;
    const pts: ChartPoint[] = [];
    const steps = 8;
    
    let currentVal = base;
    for (let i = 0; i < steps; i++) {
      const time = `${9 + i}:00`;
      let stepChange = 0;
      if (sentiment === 'Bullish') {
        stepChange = (Math.random() - 0.25) * 15; // Positive trend
      } else if (sentiment === 'Bearish') {
        stepChange = (Math.random() - 0.75) * 15; // Negative trend
      } else {
        stepChange = (Math.random() - 0.5) * 10; // Neutral range
      }
      currentVal += stepChange;
      pts.push({ time, value: Math.round(currentVal * 100) / 100 });
    }
    return pts;
  };

  const handleSave = () => {
    const points = generatePoints(status);
    onAddChart({
      pair: `${pair} · ${timeframe}`,
      timeframe,
      status,
      points
    });
  };

  return (
    <div className="bg-white dark:bg-[#121620] border border-gray-200 dark:border-gray-800 p-4 rounded-xl mt-3 space-y-4">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-2">
        <span className="text-xs font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
          <Activity size={14} className="text-indigo-400 animate-pulse" />
          Attach Technical Chart Analysis
        </span>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-gray-400 dark:text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white transition"
        >
          Cancel
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 dark:text-gray-400 mb-1">Asset Pair</label>
          <select
            value={pair}
            onChange={(e) => setPair(e.target.value)}
            className="w-full bg-[#181d28] border border-gray-200 dark:border-gray-800 rounded-lg px-2 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none"
          >
            <option value="XAUUSD">XAUUSD (Gold)</option>
            <option value="EURUSD">EURUSD</option>
            <option value="GBPUSD">GBPUSD</option>
            <option value="BTCUSD">BTCUSD</option>
            <option value="ETHUSD">ETHUSD</option>
            <option value="US30">US30 (Dow Jones)</option>
            <option value="SPX500">SPX500</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 dark:text-gray-400 mb-1">Timeframe</label>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="w-full bg-[#181d28] border border-gray-200 dark:border-gray-800 rounded-lg px-2 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none"
          >
            <option value="M15">M15</option>
            <option value="H1">H1</option>
            <option value="H4">H4</option>
            <option value="D1">D1</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-semibold text-gray-400 dark:text-gray-500 dark:text-gray-400 mb-1.5">Trading Sentiment</label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'Bullish', label: 'Bullish', icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
            { id: 'Bearish', label: 'Bearish', icon: TrendingDown, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30' },
            { id: 'Neutral', label: 'Neutral', icon: AlignLeft, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' }
          ].map((item) => {
            const Icon = item.icon;
            const active = status === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setStatus(item.id as any)}
                className={`py-1.5 px-2.5 rounded-lg border flex items-center justify-center gap-1 text-[10px] font-medium transition ${
                  active
                    ? `${item.bg} text-gray-900 dark:text-white`
                    : 'bg-[#181d28] border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-500 dark:text-gray-400 hover:bg-gray-800'
                }`}
              >
                <Icon size={12} className={item.color} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg text-xs transition duration-150 flex items-center justify-center gap-1.5"
      >
        <Check size={14} /> Confirm Chart Placement
      </button>
    </div>
  );
};
