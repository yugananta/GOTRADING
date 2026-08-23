import React from 'react';
import { LineChart, TrendingUp, PieChart, BarChart2 } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from 'recharts';

const pnlCurveData = [
  { time: '00:00', equity: 180000 },
  { time: '04:00', equity: 184500 },
  { time: '08:00', equity: 182100 },
  { time: '12:00', equity: 194000 },
  { time: '16:00', equity: 201500 },
  { time: '20:00', equity: 214500 }
];

const symbolVolumeData = [
  { symbol: 'XAUUSD', volume: 8400, pnl: 42000 },
  { symbol: 'EURUSD', volume: 6200, pnl: 18500 },
  { symbol: 'GBPUSD', volume: 3100, pnl: -4200 },
  { symbol: 'US30', volume: 2900, pnl: 12400 },
  { symbol: 'BTCUSD', volume: 1800, pnl: 8900 }
];

export const TradingAnalyticsView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <LineChart className="w-5 h-5 text-emerald-400" /> Platform Trading Analytics
        </h2>
        <p className="text-xs text-slate-400">Institutional performance, PnL curve, symbol distribution, and drawdown analytics</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs font-mono text-slate-400">AVERAGE WIN RATE</span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">62.8%</div>
          <span className="text-[10px] text-slate-500">Across 12,400 trades</span>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs font-mono text-slate-400">PROFIT FACTOR</span>
          <div className="text-2xl font-bold text-white mt-1">1.84</div>
          <span className="text-[10px] text-slate-500">Institutional benchmark</span>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs font-mono text-slate-400">AVG MAX DRAWDOWN</span>
          <div className="text-2xl font-bold text-amber-400 mt-1">4.2%</div>
          <span className="text-[10px] text-slate-500">Platform-wide risk score</span>
        </div>
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-xs font-mono text-slate-400">TOTAL VOLUME TRADED</span>
          <div className="text-2xl font-bold text-sky-400 mt-1">22,400 Lots</div>
          <span className="text-[10px] text-slate-500">MT4/MT5 combined</span>
        </div>
      </div>

      {/* Equity & Symbol Breakdown Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
          <h3 className="text-sm font-bold text-white mb-4">Master Platform Equity Curve ($ USD)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={pnlCurveData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Area type="monotone" dataKey="equity" stroke="#10b981" fill="#10b98120" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
          <h3 className="text-sm font-bold text-white mb-4">Volume & Net PnL by Symbol</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={symbolVolumeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="symbol" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                <Bar dataKey="pnl" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
