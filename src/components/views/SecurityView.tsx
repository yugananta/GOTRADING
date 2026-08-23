import React from 'react';
import { Lock, ShieldAlert, Key, Smartphone, AlertTriangle } from 'lucide-react';

export const SecurityView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <Lock className="w-5 h-5 text-emerald-400" /> Platform Security & Session Sentinel
        </h2>
        <p className="text-xs text-slate-400">Login history tracking, active sessions, force logout, and 2FA policy enforcement</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-400" /> Active Admin Sessions
          </h3>
          <div className="p-3 bg-slate-950 border border-slate-800 rounded text-xs space-y-1">
            <div className="flex justify-between text-white font-bold">
              <span>Owner Master (Chrome / macOS)</span>
              <span className="text-emerald-400 font-mono">192.168.1.104</span>
            </div>
            <p className="text-slate-400 text-[11px]">Current active session • Authenticated via WebAuthn 2FA</p>
          </div>
        </div>

        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" /> Failed Login Sentinel
          </h3>
          <p className="text-xs text-slate-400">
            Automated IP rate limiting blocks suspicious brute force attempts. Threshold: 5 failed attempts per 15 mins.
          </p>
          <div className="text-xs font-mono text-emerald-400">0 Active IP Blocks</div>
        </div>
      </div>
    </div>
  );
};
