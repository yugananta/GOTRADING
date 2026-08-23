import React, { useState } from 'react';
import {
  Activity,
  ShieldAlert,
  Send,
  AlertTriangle,
  CheckCircle2,
  BellRing,
  Zap,
  RefreshCw,
  Sliders,
  Smartphone,
  Info,
  Clock,
  Layers,
  Search,
  Filter,
  Check
} from 'lucide-react';
import { TradingHealthRecord } from '../../types';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';

interface TradingHealthViewProps {
  records: TradingHealthRecord[];
  onSendWarning: (userId: string, note?: string) => void;
  onTriggerAutoPushScan?: (thresholdPct?: number) => void;
}

export const TradingHealthView: React.FC<TradingHealthViewProps> = ({
  records,
  onSendWarning,
  onTriggerAutoPushScan
}) => {
  const [selectedRecord, setSelectedRecord] = useState<TradingHealthRecord | null>(null);
  const [warningNote, setWarningNote] = useState('');
  const [autoPushThreshold, setAutoPushThreshold] = useState<number>(80);
  const [isSentinelActive, setIsSentinelActive] = useState<boolean>(true);
  const [filterMode, setFilterMode] = useState<'ALL' | 'TRIGGERED_80' | 'HEALTHY'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const handleSendManualWarning = () => {
    if (selectedRecord) {
      onSendWarning(selectedRecord.userId, warningNote);
      setSelectedRecord(null);
      setWarningNote('');
    }
  };

  const handleRunScan = () => {
    setIsScanning(true);
    if (onTriggerAutoPushScan) {
      onTriggerAutoPushScan(autoPushThreshold);
    }
    setTimeout(() => {
      setIsScanning(false);
    }, 800);
  };

  const triggeredCount = records.filter(r => (r.riskUtilizationPct || 0) >= autoPushThreshold).length;
  const autoPushedDispatchedCount = records.filter(r => r.autoPushTriggered).length;

  const filteredRecords = records.filter(rec => {
    const matchesSearch =
      rec.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.accountNumber.includes(searchQuery) ||
      rec.userId.toLowerCase().includes(searchQuery.toLowerCase());

    const utilization = rec.riskUtilizationPct || 0;
    if (filterMode === 'TRIGGERED_80') return matchesSearch && utilization >= autoPushThreshold;
    if (filterMode === 'HEALTHY') return matchesSearch && utilization < autoPushThreshold;
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Page Title & Sentinel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-slate-900 border border-slate-800 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Activity className="w-5 h-5 text-rose-400" /> REAL-TIME TRADING HEALTH &amp; RISK MONITOR
            </h2>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1 animate-pulse">
              <Zap className="w-3 h-3 text-rose-400 fill-rose-400" /> AUTO-PUSH AT {autoPushThreshold}% RISK
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated daily drawdown sentinel. Automatically dispatches Mobile Push Notifications to users when risk utilization reaches or exceeds {autoPushThreshold}%.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleRunScan}
            disabled={isScanning}
            className="px-4 py-2.5 bg-rose-500 hover:bg-rose-400 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-rose-950/40 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
            {isScanning ? 'Scanning Risk Engine...' : 'Run Auto-Push Risk Scan'}
          </button>
        </div>
      </div>

      {/* AUTOMATED PUSH NOTIFICATION SENTINEL BANNER */}
      <div className="p-5 bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border border-rose-500/40 rounded-xl space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-rose-500/20">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30">
              <BellRing className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-sm">SYSTEM AUTO-PUSH NOTIFICATION SENTINEL</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${isSentinelActive ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'}`}>
                  {isSentinelActive ? 'ACTIVE (AUTOMATED)' : 'PAUSED'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Setingan auto-push notification aktif untuk mendeteksi user yang menyentuh batas risiko <span className="text-rose-400 font-bold font-mono">≥ {autoPushThreshold}%</span> dan langsung mengirim notifikasi HP (App FCM Push).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-950 p-2 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center gap-1.5 px-2">
              <Sliders className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400 font-mono text-[11px]">Batas Trigger Auto-Push:</span>
            </div>

            <div className="flex gap-1 font-mono">
              {[70, 75, 80, 85, 90].map(val => (
                <button
                  key={val}
                  onClick={() => setAutoPushThreshold(val)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all ${
                    autoPushThreshold === val
                      ? 'bg-rose-500 text-slate-950 shadow-md shadow-rose-950'
                      : 'text-slate-400 hover:text-white bg-slate-900'
                  }`}
                >
                  {val}%
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sentinel Live Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg">
            <span className="text-slate-400 block text-[10px]">TOTAL MONITORED TRADERS</span>
            <span className="text-base font-bold text-white mt-0.5 block">{records.length} Users</span>
          </div>

          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg">
            <span className="text-slate-400 block text-[10px]">REACHED ≥ {autoPushThreshold}% RISK</span>
            <span className="text-base font-bold text-rose-400 mt-0.5 block">{triggeredCount} Users</span>
          </div>

          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg">
            <span className="text-slate-400 block text-[10px]">AUTO-PUSH DISPATCHED</span>
            <span className="text-base font-bold text-emerald-400 mt-0.5 block">{autoPushedDispatchedCount} Mobile Push</span>
          </div>

          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg">
            <span className="text-slate-400 block text-[10px]">NOTIFICATION CHANNEL</span>
            <span className="text-xs font-bold text-sky-400 mt-1 block flex items-center gap-1">
              <Smartphone className="w-3.5 h-3.5" /> FCM Mobile Push App
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-400 font-mono text-[11px] mr-1">Filter Risk:</span>
          <button
            onClick={() => setFilterMode('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap ${
              filterMode === 'ALL'
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'text-slate-400 hover:text-white bg-slate-950'
            }`}
          >
            Semua Trader ({records.length})
          </button>
          <button
            onClick={() => setFilterMode('TRIGGERED_80')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              filterMode === 'TRIGGERED_80'
                ? 'bg-rose-500 text-slate-950'
                : 'text-rose-400 hover:text-rose-300 bg-rose-500/10 border border-rose-500/20'
            }`}
          >
            <Zap className="w-3.5 h-3.5 fill-rose-400" /> Critical Risk (≥ {autoPushThreshold}%) ({triggeredCount})
          </button>
          <button
            onClick={() => setFilterMode('HEALTHY')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap ${
              filterMode === 'HEALTHY'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-white bg-slate-950'
            }`}
          >
            Safe (&lt; {autoPushThreshold}%) ({records.length - triggeredCount})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari trader atau MT5 account..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
          />
        </div>
      </div>

      {/* TRADER HEALTH & AUTO-PUSH RISK CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredRecords.map(rec => {
          const utilization = rec.riskUtilizationPct || 0;
          const isOverThreshold = utilization >= autoPushThreshold;

          return (
            <div
              key={rec.userId}
              className={`p-5 rounded-2xl border flex flex-col justify-between transition-all relative overflow-hidden shadow-xl ${
                isOverThreshold
                  ? 'bg-gradient-to-b from-slate-900 via-slate-900 to-rose-950/30 border-rose-500/50 hover:border-rose-400'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Top Card Header */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="font-bold text-white text-sm block">{rec.userName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">MT5 Acc: #{rec.accountNumber} • ID: {rec.userId}</span>
                  </div>

                  <Badge
                    variant={
                      rec.riskLevel === 'CRITICAL' || isOverThreshold
                        ? 'danger font-bold'
                        : rec.riskLevel === 'WARNING'
                        ? 'warning'
                        : 'success'
                    }
                  >
                    {isOverThreshold ? 'HIGH RISK' : rec.riskLevel}
                  </Badge>
                </div>

                {/* Risk Limit Utilization Progress Bar (≥80% Trigger Highlight) */}
                <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl space-y-1.5 mb-4">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400 text-[11px] font-bold flex items-center gap-1">
                      <Zap className={`w-3.5 h-3.5 ${isOverThreshold ? 'text-rose-400 animate-pulse' : 'text-slate-500'}`} />
                      Batas Risiko Trading:
                    </span>
                    <span className={`font-black text-sm ${isOverThreshold ? 'text-rose-400' : utilization > 50 ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {utilization}% {isOverThreshold ? `(≥${autoPushThreshold}% TRIGGER)` : ''}
                    </span>
                  </div>

                  {/* Progress bar container */}
                  <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800 relative">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        isOverThreshold
                          ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                          : utilization > 50
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                      style={{ width: `${Math.min(100, utilization)}%` }}
                    />
                    {/* 80% Threshold indicator line */}
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-white z-10 opacity-70"
                      style={{ left: `${autoPushThreshold}%` }}
                      title={`Batas Auto-Push Notification (${autoPushThreshold}%)`}
                    />
                  </div>

                  {/* Auto Push Badge Indicator */}
                  {isOverThreshold ? (
                    <div className="pt-1.5 flex items-center justify-between text-[10px] font-mono text-rose-400">
                      <span className="flex items-center gap-1 font-bold animate-pulse">
                        <BellRing className="w-3 h-3" /> AUTO-PUSH DISPATCHED TO DEVICE
                      </span>
                      <span className="text-slate-400">{rec.lastAutoPushTimestamp || 'Baru Saja'}</span>
                    </div>
                  ) : (
                    <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-slate-500">
                      <span>Status: Amandemen Dalam Batas Aman</span>
                      <span>Target Auto Push: {autoPushThreshold}%</span>
                    </div>
                  )}
                </div>

                {/* Detail Trading Metrics */}
                <div className="space-y-2 text-xs font-mono border-t border-slate-800/60 pt-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Daily Drawdown:</span>
                    <span className={rec.dailyDrawdown > 5 ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                      -{rec.dailyDrawdown}% (Max {rec.maxAllowedDrawdownPct || 10}%)
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400">Overall Drawdown:</span>
                    <span className="text-slate-200">-{rec.overallDrawdown}%</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400">Consecutive Losses:</span>
                    <span className={rec.consecutiveLosses >= 5 ? 'text-rose-400 font-bold' : 'text-slate-200'}>
                      {rec.consecutiveLosses} Trades
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400">Trades Executed Today:</span>
                    <span className="text-slate-200">{rec.tradesToday} Trades</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-400">Trading Plan Compliance:</span>
                    <span className="text-emerald-400 font-bold">{rec.planComplianceScore}%</span>
                  </div>

                  {rec.pushNotificationChannel && (
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Notification Channel:</span>
                      <span className="text-sky-400 font-bold">{rec.pushNotificationChannel}</span>
                    </div>
                  )}
                </div>

                {rec.notes && (
                  <div className="mt-3 p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-slate-300 leading-relaxed">
                    <span className="text-rose-400 font-mono font-bold block text-[10px] mb-0.5">
                      SENTINEL PUSH NOTIFICATION ALERT LOG:
                    </span>
                    {rec.notes}
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-500 font-mono">
                  {rec.lastAutoPushTimestamp
                    ? `Auto Push: ${rec.lastAutoPushTimestamp.slice(-8)}`
                    : 'Belum terpicu push'}
                </span>

                <button
                  onClick={() => setSelectedRecord(rec)}
                  className="px-3 py-1.5 text-xs font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-3 h-3" /> Kirim Manual Warning
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* AUTO-PUSH SENTINEL AUDIT LOG TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
            <BellRing className="w-4 h-4 text-rose-400" /> Log Notifikasi Auto-Push Sentinel (≥ {autoPushThreshold}% Risk Trigger)
          </h3>
          <span className="text-xs text-slate-400 font-mono">Real-Time Mobile Device Dispatch History</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 text-[11px]">
              <tr>
                <th className="p-3">TRADER &amp; ACCOUNT</th>
                <th className="p-3">RISK UTILIZATION %</th>
                <th className="p-3">DRAWDOWN</th>
                <th className="p-3">NOTIFICATION CHANNEL</th>
                <th className="p-3">TIMESTAMP DISPATCH</th>
                <th className="p-3 text-center">STATUS PUSH</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {records
                .filter(r => (r.riskUtilizationPct || 0) >= autoPushThreshold || r.autoPushTriggered)
                .map(r => (
                  <tr key={r.userId} className="hover:bg-slate-800/40">
                    <td className="p-3 font-sans">
                      <div className="font-bold text-white">{r.userName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">MT5 #{r.accountNumber}</div>
                    </td>

                    <td className="p-3 font-bold text-rose-400 text-sm">
                      {r.riskUtilizationPct}% (≥{autoPushThreshold}%)
                    </td>

                    <td className="p-3 text-rose-300 font-bold">
                      -{r.dailyDrawdown}% Daily DD
                    </td>

                    <td className="p-3 text-sky-400 font-bold">
                      {r.pushNotificationChannel || 'FCM Mobile Push App'}
                    </td>

                    <td className="p-3 text-slate-400">
                      {r.lastAutoPushTimestamp || 'Baru Saja (Auto Sent)'}
                    </td>

                    <td className="p-3 text-center">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1">
                        <Check className="w-3 h-3" /> PUSH DELIVERED
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Warning Dispatch Modal */}
      <Modal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title={`Kirim Custom Push Alert ke ${selectedRecord?.userName}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400">
            Pesan ini akan langsung dikirimkan sebagai Notifikasi HP (Mobile FCM Push), Pop-up In-App, dan Email High-Priority ke user untuk menghentikan trading atau merevisi risk management.
          </p>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 font-mono text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Risk Utilization:</span>
              <span className="text-rose-400 font-bold">{selectedRecord?.riskUtilizationPct}%</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Daily Drawdown Saat Ini:</span>
              <span className="text-rose-400 font-bold">-{selectedRecord?.dailyDrawdown}%</span>
            </div>
          </div>

          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1">PESAN MODERASI / INTRUKSI RISK</label>
            <textarea
              rows={4}
              value={warningNote}
              onChange={e => setWarningNote(e.target.value)}
              placeholder="Contoh: Penggunaan margin dan drawdown Anda telah menyentuh 89%. Mohon segera amankan posisi trading Anda untuk menghindari Auto Stopout."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              onClick={() => setSelectedRecord(null)}
              className="px-4 py-2 text-xs font-semibold bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700"
            >
              Batal
            </button>
            <button
              onClick={handleSendManualWarning}
              className="px-5 py-2 text-xs font-bold bg-rose-600 text-white rounded-xl hover:bg-rose-500 flex items-center gap-2 shadow-lg shadow-rose-950/40"
            >
              <Send className="w-3.5 h-3.5" /> Kirim Push Alert Sekarang
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
