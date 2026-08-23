import React from 'react';
import { Trophy, Medal, Award, Plus, Users, Flame } from 'lucide-react';
import { Competition, CompetitionParticipant } from '../../types';
import { Badge } from '../ui/Badge';

interface CompetitionsViewProps {
  competitions: Competition[];
  participants: CompetitionParticipant[];
}

export const CompetitionsView: React.FC<CompetitionsViewProps> = ({ competitions, participants }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" /> Trading Competitions & Leaderboards
          </h2>
          <p className="text-xs text-slate-400">Live trading championships, prize pool management, and rank verification</p>
        </div>

        <button className="px-3.5 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-colors">
          <Plus className="w-4 h-4" /> Host New Contest
        </button>
      </div>

      {competitions.map(comp => (
        <div key={comp.id} className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">{comp.name}</h3>
                <Badge variant="warning">{comp.status}</Badge>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Dates: {comp.startDate} to {comp.endDate} • Ranking By: {comp.rankingMetric}
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs font-mono text-slate-400 block">PRIZE POOL</span>
              <span className="text-xl font-bold text-emerald-400 font-mono">${comp.prizePoolUsd.toLocaleString()}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-mono text-[11px]">
                <tr>
                  <th className="p-2.5">RANK</th>
                  <th className="p-2.5">TRADER</th>
                  <th className="p-2.5">ACCOUNT #</th>
                  <th className="p-2.5 text-right">PNL ($)</th>
                  <th className="p-2.5 text-right">ROI (%)</th>
                  <th className="p-2.5 text-right">VOLUME (LOTS)</th>
                  <th className="p-2.5 text-right">WIN RATE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {participants.map(p => (
                  <tr key={p.userId} className="hover:bg-slate-800/40 font-mono">
                    <td className="p-2.5 font-bold">
                      {p.rank === 1 ? '🥇 #1' : p.rank === 2 ? '🥈 #2' : p.rank === 3 ? '🥉 #3' : `#${p.rank}`}
                    </td>
                    <td className="p-2.5 font-semibold text-white">{p.userName}</td>
                    <td className="p-2.5 font-mono text-slate-400">{p.accountNumber}</td>
                    <td className="p-2.5 text-right font-bold text-emerald-400">+${p.pnl.toLocaleString()}</td>
                    <td className="p-2.5 text-right text-emerald-400">+{p.roiPct}%</td>
                    <td className="p-2.5 text-right text-slate-200">{p.volumeLots}</td>
                    <td className="p-2.5 text-right text-slate-200">{p.winRatePct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};
