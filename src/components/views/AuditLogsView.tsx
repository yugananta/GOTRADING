import React, { useState } from 'react';
import { History, Search, ShieldCheck, Download } from 'lucide-react';
import { AuditLog } from '../../types';
import { Badge } from '../ui/Badge';
import { ExportButton } from '../ui/ExportButton';

interface AuditLogsViewProps {
  logs: AuditLog[];
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ logs = [] }) => {
  const [search, setSearch] = useState('');

  const safeLogs = Array.isArray(logs) ? logs : [];

  const filtered = safeLogs.filter(l => {
    if (!l) return false;
    const term = (search || '').toLowerCase();
    return (
      (l.action || '').toLowerCase().includes(term) ||
      (l.adminName || '').toLowerCase().includes(term) ||
      (l.targetModule || '').toLowerCase().includes(term) ||
      (l.details || '').toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-400" /> Immutable Admin Audit Logs
          </h2>
          <p className="text-xs text-slate-400">Cryptographically verifiable record of all administrative actions, key rotations, and financial approvals</p>
        </div>

        <ExportButton filename="apextrader_audit_logs" data={filtered} />
      </div>

      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="relative w-full max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search action, admin, or target module..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 text-[11px]">
              <tr>
                <th className="p-3">TIMESTAMP</th>
                <th className="p-3">ADMIN NAME</th>
                <th className="p-3">ROLE</th>
                <th className="p-3">ACTION</th>
                <th className="p-3">MODULE</th>
                <th className="p-3">IP ADDRESS</th>
                <th className="p-3">DETAILS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map(l => (
                <tr key={l.id} className="hover:bg-slate-800/40">
                  <td className="p-3 text-slate-400 text-[11px] whitespace-nowrap">{l.timestamp}</td>
                  <td className="p-3 font-semibold text-white font-sans">{l.adminName}</td>
                  <td className="p-3"><Badge variant="purple font-bold">{l.adminRole}</Badge></td>
                  <td className="p-3 font-bold text-amber-400">{l.action}</td>
                  <td className="p-3 text-emerald-400">{l.targetModule}</td>
                  <td className="p-3 text-slate-400 text-[11px]">{l.ipAddress}</td>
                  <td className="p-3 text-slate-300 font-sans">{l.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
