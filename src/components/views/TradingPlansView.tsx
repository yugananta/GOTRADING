import React from 'react';
import { FileCheck2, Plus, Users, Target, ShieldAlert } from 'lucide-react';
import { TradingPlanTemplate } from '../../types';
import { Badge } from '../ui/Badge';

interface TradingPlansViewProps {
  plans: TradingPlanTemplate[];
}

export const TradingPlansView: React.FC<TradingPlansViewProps> = ({ plans }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-emerald-400" /> Trading Plan Templates & Rules
          </h2>
          <p className="text-xs text-slate-400">Institutional daily target, max loss, and trade execution rule sets</p>
        </div>

        <button className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-colors">
          <Plus className="w-4 h-4" /> Create New Plan Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plans.map(p => (
          <div key={p.id} className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">{p.name}</h3>
              <Badge variant="success">{p.status}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded">
                <span className="text-slate-500 block">DAILY TARGET:</span>
                <span className="text-emerald-400 font-bold">{p.dailyTargetPct}%</span>
              </div>
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded">
                <span className="text-slate-500 block">MAX DAILY LOSS:</span>
                <span className="text-rose-400 font-bold">-{p.maxDailyLossPct}%</span>
              </div>
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded">
                <span className="text-slate-500 block">MAX TRADES/DAY:</span>
                <span className="text-white font-bold">{p.maxTradesPerDay} Trades</span>
              </div>
              <div className="p-2.5 bg-slate-950 border border-slate-800 rounded">
                <span className="text-slate-500 block">RISK PER TRADE:</span>
                <span className="text-sky-400 font-bold">{p.riskPerTradePct}%</span>
              </div>
            </div>

            <div>
              <span className="text-xs font-mono text-slate-400 block mb-1">MANDATORY RULESET:</span>
              <ul className="space-y-1 text-xs text-slate-300">
                {p.rules.map((rule, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" /> {p.activeUsersCount} Active Traders Attached
              </span>
              <button className="text-xs text-emerald-400 hover:underline">Edit Rules</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
