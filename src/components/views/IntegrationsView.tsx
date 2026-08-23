import React from 'react';
import { Plug, RefreshCw, Zap, Server, Globe, CheckCircle2 } from 'lucide-react';
import { IntegrationService } from '../../types';
import { StatusIndicator } from '../ui/StatusIndicator';

interface IntegrationsViewProps {
  integrations: IntegrationService[];
  onTestConnection: (id: string) => void;
}

export const IntegrationsView: React.FC<IntegrationsViewProps> = ({ integrations, onTestConnection }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <Plug className="w-5 h-5 text-emerald-400" /> API & Third-Party System Integrations
        </h2>
        <p className="text-xs text-slate-400">Monitor live connectivity to MT4/MT5 Bridge, Supabase DB, Stripe, and Telegram API</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map(i => (
          <div key={i.id} className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white">{i.name}</h3>
                <span className="text-xs text-slate-400 font-mono">Provider: {i.provider}</span>
              </div>
              <StatusIndicator status={i.status} pingMs={i.latencyMs} />
            </div>

            <div className="space-y-1.5 text-xs font-mono">
              <div className="text-slate-400 truncate">Endpoint: <span className="text-slate-200">{i.endpoint}</span></div>
              <div className="text-slate-400">Last Sync: <span className="text-slate-200">{i.lastSync}</span></div>
              {i.lastError && (
                <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded text-[11px]">
                  Error Trace: {i.lastError}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => onTestConnection(i.id)}
                className="px-3 py-1.5 text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Test Connection Now
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
