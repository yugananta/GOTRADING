import React from 'react';
import { BookOpen, Smile, Frown, Flame, CheckCircle, Shield } from 'lucide-react';
import { JournalEntry } from '../../types';
import { Badge } from '../ui/Badge';

interface TradingJournalViewProps {
  entries: JournalEntry[];
}

export const TradingJournalView: React.FC<TradingJournalViewProps> = ({ entries }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-400" /> Trading Journal Moderation & Audit
        </h2>
        <p className="text-xs text-slate-400">Review trader psychological states, strategy adherence, mistakes, and internal admin notes</p>
      </div>

      <div className="space-y-4">
        {entries.map(j => (
          <div key={j.id} className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="font-bold text-white text-sm">{j.userName}</span>
                <span className="font-mono text-xs text-emerald-400">{j.symbol} ({j.direction})</span>
                <Badge variant={j.resultPnl >= 0 ? 'success' : 'danger'}>
                  {j.resultPnl >= 0 ? '+' : ''}${j.resultPnl.toLocaleString()}
                </Badge>
              </div>
              <span className="text-xs font-mono text-slate-400">{j.date} • Plan: {j.tradingPlanName}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-500 font-mono block">STRATEGY:</span>
                <span className="text-slate-200 font-semibold">{j.strategy}</span>
              </div>
              <div>
                <span className="text-slate-500 font-mono block">EMOTIONAL STATE:</span>
                <span className="text-amber-400 font-semibold">{j.emotion}</span>
              </div>
              <div>
                <span className="text-slate-500 font-mono block">MISTAKE / OBSERVATION:</span>
                <span className="text-rose-400 font-semibold">{j.mistake || 'None logged'}</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 italic bg-slate-950 p-3 rounded border border-slate-800/80">
              "{j.notes}"
            </p>

            {j.internalAdminNotes && (
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-xs text-emerald-300 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Internal Admin Review: {j.internalAdminNotes}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
