import React from 'react';
import { ConnectionStatus } from '../../types';

interface StatusIndicatorProps {
  status: ConnectionStatus;
  label?: string;
  pingMs?: number;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status, label, pingMs }) => {
  const dots = {
    CONNECTED: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse',
    SYNCING: 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.6)] animate-ping',
    WARNING: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]',
    ERROR: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]',
    DISCONNECTED: 'bg-slate-500'
  };

  const textColors = {
    CONNECTED: 'text-emerald-400',
    SYNCING: 'text-sky-400',
    WARNING: 'text-amber-400',
    ERROR: 'text-rose-400',
    DISCONNECTED: 'text-slate-400'
  };

  return (
    <div className="inline-flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${dots[status]}`} />
      <span className={`text-xs font-semibold ${textColors[status]}`}>
        {label || status}
      </span>
      {pingMs !== undefined && (
        <span className="text-[10px] text-slate-500 font-mono">({pingMs}ms)</span>
      )}
    </div>
  );
};
