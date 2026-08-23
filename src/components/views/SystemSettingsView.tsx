import React, { useState } from 'react';
import { Settings, Save, Check } from 'lucide-react';
import { SystemSettings } from '../../types';

interface SystemSettingsViewProps {
  settings: SystemSettings;
  onSave: (newSettings: Partial<SystemSettings>) => void;
}

export const SystemSettingsView: React.FC<SystemSettingsViewProps> = ({ settings, onSave }) => {
  const [form, setForm] = useState({ ...settings });
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-emerald-400" /> Platform Operational Settings
        </h2>
        <p className="text-xs text-slate-400">Configure platform name, risk thresholds, session timeouts, and 2FA policy</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4 max-w-2xl">
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <label className="font-mono text-slate-400 block mb-1">PLATFORM NAME</label>
            <input
              type="text"
              value={form.platformName}
              onChange={e => setForm({ ...form, platformName: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="font-mono text-slate-400 block mb-1">SUPPORT EMAIL</label>
            <input
              type="email"
              value={form.supportEmail}
              onChange={e => setForm({ ...form, supportEmail: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="font-mono text-slate-400 block mb-1">DAILY DD THRESHOLD (%)</label>
            <input
              type="number"
              step="0.1"
              value={form.dailyDrawdownThresholdPct}
              onChange={e => setForm({ ...form, dailyDrawdownThresholdPct: parseFloat(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="font-mono text-slate-400 block mb-1">OVERALL DD THRESHOLD (%)</label>
            <input
              type="number"
              step="0.1"
              value={form.overallDrawdownThresholdPct}
              onChange={e => setForm({ ...form, overallDrawdownThresholdPct: parseFloat(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="font-mono text-slate-400 block mb-1">SESSION TIMEOUT (MINUTES)</label>
            <input
              type="number"
              value={form.sessionTimeoutMinutes}
              onChange={e => setForm({ ...form, sessionTimeoutMinutes: parseInt(e.target.value) })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="font-mono text-slate-400 block mb-1">DEFAULT CURRENCY</label>
            <input
              type="text"
              value={form.defaultCurrency}
              onChange={e => setForm({ ...form, defaultCurrency: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-colors"
        >
          {saved ? <Check className="w-4 h-4 text-slate-950" /> : <Save className="w-4 h-4" />}
          {saved ? 'Settings Saved Successfully!' : 'Save Operational Settings'}
        </button>
      </form>
    </div>
  );
};
