import React, { useState } from 'react';
import { Bell, Send, Users, ShieldAlert, Check } from 'lucide-react';

export const NotificationsView: React.FC = () => {
  const [target, setTarget] = useState('ALL');
  const [channel, setChannel] = useState('IN_APP');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setTitle('');
      setMessage('');
    }, 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <Bell className="w-5 h-5 text-emerald-400" /> Platform Notification Broadcaster
        </h2>
        <p className="text-xs text-slate-400">Broadcast multi-channel in-app, push, and email alerts to target trader cohorts</p>
      </div>

      <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl max-w-2xl">
        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1">BROADCAST CHANNEL</label>
            <div className="flex gap-3">
              {['IN_APP', 'PUSH', 'EMAIL', 'ALL_CHANNELS'].map(c => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setChannel(c)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                    channel === c
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {c.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1">TARGET TRADER COHORT</label>
            <select
              value={target}
              onChange={e => setTarget(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="ALL">All Registered Users (1,302)</option>
              <option value="ACTIVE_TRADERS">Active MT4/MT5 Traders (760)</option>
              <option value="CRITICAL_RISK">Traders at Critical Risk (2)</option>
              <option value="PARTNERS_IB">IB & Sub-IB Partners (12)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1">NOTIFICATION TITLE</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Server Maintenance Notice or Bonus Boost"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1">MESSAGE CONTENT</label>
            <textarea
              rows={4}
              required
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Enter message text..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-colors"
          >
            {sent ? <Check className="w-4 h-4 text-slate-950" /> : <Send className="w-4 h-4" />}
            {sent ? 'Broadcast Sent Successfully!' : 'Dispatch Broadcast Alert'}
          </button>
        </form>
      </div>
    </div>
  );
};
