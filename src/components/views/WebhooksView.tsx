import React from 'react';
import { Webhook, Plus, Play, CheckCircle2 } from 'lucide-react';
import { WebhookEndpoint } from '../../types';
import { Badge } from '../ui/Badge';

interface WebhooksViewProps {
  webhooks: WebhookEndpoint[];
}

export const WebhooksView: React.FC<WebhooksViewProps> = ({ webhooks }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Webhook className="w-5 h-5 text-emerald-400" /> Outbound Webhook Subscriptions
          </h2>
          <p className="text-xs text-slate-400">Manage real-time event listeners for trading health warnings and deposit confirmations</p>
        </div>

        <button className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg flex items-center gap-1.5">
          <Plus className="w-4 h-4" /> Register New Webhook
        </button>
      </div>

      <div className="space-y-4">
        {webhooks.map(w => (
          <div key={w.id} className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">{w.name}</h3>
                <span className="text-xs text-slate-400 font-mono">{w.url}</span>
              </div>
              <Badge variant={w.status === 'ACTIVE' ? 'success' : 'neutral'}>{w.status}</Badge>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-500">SUBSCRIBED EVENTS:</span>
              {w.events.map(e => (
                <span key={e} className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-mono">
                  {e}
                </span>
              ))}
            </div>

            <div className="pt-2 flex items-center justify-between text-xs font-mono text-slate-400 border-t border-slate-800">
              <span>Success Rate: <strong className="text-emerald-400">{w.successRatePct}%</strong> (HTTP {w.lastResponseCode})</span>
              <button className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded flex items-center gap-1">
                <Play className="w-3 h-3 text-sky-400" /> Test Dispatch Payload
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
