import React, { useState } from 'react';
import { CreditCard, RefreshCw, Server, Zap, Search, Filter } from 'lucide-react';
import { TradingAccount } from '../../types';
import { StatusIndicator } from '../ui/StatusIndicator';
import { Badge } from '../ui/Badge';

interface TradingAccountsViewProps {
  accounts: TradingAccount[];
  onForceSync: (accountId: string) => void;
}

export const TradingAccountsView: React.FC<TradingAccountsViewProps> = ({ accounts = [], onForceSync }) => {
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('ALL');

  const safeAccounts = Array.isArray(accounts) ? accounts : [];

  const filtered = safeAccounts.filter(a => {
    if (!a) return false;
    const term = (search || '').toLowerCase();
    const matchSearch =
      (a.accountNumber || '').toLowerCase().includes(term) ||
      (a.userName || '').toLowerCase().includes(term) ||
      (a.broker || '').toLowerCase().includes(term);
    const matchPlatform = platformFilter === 'ALL' || a.platform === platformFilter;
    return matchSearch && matchPlatform;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-400" /> MT4 / MT5 Trading Account Connections
          </h2>
          <p className="text-xs text-slate-400">Live broker server sync, connection latency, and balance monitoring</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search account #, trader, or broker..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-mono">Platform:</span>
          <select
            value={platformFilter}
            onChange={e => setPlatformFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="ALL">All Platforms</option>
            <option value="MT4">MT4</option>
            <option value="MT5">MT5</option>
          </select>
        </div>
      </div>

      {/* Accounts Datatable */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
              <tr>
                <th className="p-3">ACCOUNT #</th>
                <th className="p-3">TRADER NAME</th>
                <th className="p-3">BROKER & SERVER</th>
                <th className="p-3">PLATFORM & TYPE</th>
                <th className="p-3">LEVERAGE</th>
                <th className="p-3 text-right">BALANCE</th>
                <th className="p-3 text-right">EQUITY</th>
                <th className="p-3">SYNC STATUS</th>
                <th className="p-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map(acc => (
                <tr key={acc.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-mono text-emerald-400 font-bold">{acc.accountNumber}</td>
                  <td className="p-3 font-semibold text-white">{acc.userName}</td>
                  <td className="p-3">
                    <div className="font-semibold text-slate-200">{acc.broker}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{acc.server}</div>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono font-bold mr-2">
                      {acc.platform}
                    </span>
                    <Badge variant={acc.accountType === 'REAL' ? 'success' : 'info'}>
                      {acc.accountType}
                    </Badge>
                  </td>
                  <td className="p-3 font-mono">{acc.leverage || '1:500'}</td>
                  <td className="p-3 text-right font-mono text-slate-200">${(acc.balance ?? 0).toLocaleString()}</td>
                  <td className="p-3 text-right font-mono text-slate-200">${(acc.equity ?? 0).toLocaleString()}</td>
                  <td className="p-3">
                    <StatusIndicator status={acc.status} pingMs={acc.latencyMs} />
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => onForceSync(acc.id)}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded flex items-center justify-end gap-1 ml-auto transition-colors"
                    >
                      <RefreshCw className="w-3 h-3" /> Sync
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
