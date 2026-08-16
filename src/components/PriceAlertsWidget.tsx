import React, { useState, useEffect, useRef } from 'react';
import { formatLocalTime } from '../utils/dateUtils.ts';
import { 
  Bell, 
  BellRing, 
  Plus, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Zap, 
  SlidersHorizontal,
  Volume2,
  VolumeX,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface PriceAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  condition: 'ABOVE' | 'BELOW';
  note?: string;
  createdAt: string;
  isActive: boolean;
  isTriggered: boolean;
  triggeredAt?: string;
}

export interface PairPrice {
  symbol: string;
  name: string;
  price: number;
  decimals: number;
  change24h: number;
  direction?: 'up' | 'down' | 'same';
  lastTickTime?: number;
}

const INITIAL_PAIRS: Record<string, PairPrice> = {
  'XAUUSD': { symbol: 'XAUUSD', name: 'Gold / US Dollar', price: 2418.50, decimals: 2, change24h: 0.85 },
  'EURUSD': { symbol: 'EURUSD', name: 'Euro / US Dollar', price: 1.0885, decimals: 4, change24h: -0.12 },
  'GBPUSD': { symbol: 'GBPUSD', name: 'British Pound / USD', price: 1.2850, decimals: 4, change24h: 0.34 },
  'USDJPY': { symbol: 'USDJPY', name: 'US Dollar / Yen', price: 154.20, decimals: 2, change24h: -0.45 },
  'BTCUSD': { symbol: 'BTCUSD', name: 'Bitcoin / US Dollar', price: 67450.00, decimals: 2, change24h: 2.15 },
  'AUDUSD': { symbol: 'AUDUSD', name: 'Australian Dollar / USD', price: 0.6540, decimals: 4, change24h: 0.08 }
};

const DEFAULT_ALERTS: PriceAlert[] = [
  {
    id: 'alert-1',
    symbol: 'XAUUSD',
    targetPrice: 2425.00,
    condition: 'ABOVE',
    note: 'Resistance breakout target',
    createdAt: new Date().toISOString(),
    isActive: true,
    isTriggered: false
  },
  {
    id: 'alert-2',
    symbol: 'EURUSD',
    targetPrice: 1.0850,
    condition: 'BELOW',
    note: 'Key support level',
    createdAt: new Date().toISOString(),
    isActive: true,
    isTriggered: false
  }
];

export const PriceAlertsWidget: React.FC = () => {
  const [pairs, setPairs] = useState<Record<string, PairPrice>>(INITIAL_PAIRS);
  const [alerts, setAlerts] = useState<PriceAlert[]>(() => {
    try {
      const saved = localStorage.getItem('tarapti_price_alerts');
      return saved ? JSON.parse(saved) : DEFAULT_ALERTS;
    } catch {
      return DEFAULT_ALERTS;
    }
  });

  const [isAdding, setIsAdding] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('XAUUSD');
  const [condition, setCondition] = useState<'ABOVE' | 'BELOW'>('ABOVE');
  const [targetPriceInput, setTargetPriceInput] = useState<string>('2425.00');
  const [noteInput, setNoteInput] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'active' | 'triggered'>('active');
  const [latestTriggeredAlert, setLatestTriggeredAlert] = useState<PriceAlert | null>(null);

  // Sync alerts to local storage
  useEffect(() => {
    try {
      localStorage.setItem('tarapti_price_alerts', JSON.stringify(alerts));
    } catch (e) {
      console.error("Failed to save price alerts", e);
    }
  }, [alerts]);

  // Update target input when symbol changes in form
  useEffect(() => {
    const currentPrice = pairs[selectedSymbol]?.price || 0;
    const decimals = pairs[selectedSymbol]?.decimals || 2;
    if (condition === 'ABOVE') {
      const suggested = currentPrice * 1.0025;
      setTargetPriceInput(suggested.toFixed(decimals));
    } else {
      const suggested = currentPrice * 0.9975;
      setTargetPriceInput(suggested.toFixed(decimals));
    }
  }, [selectedSymbol, condition]);

  // Play audio notification when alert triggers
  const playAlertSound = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.15); // E6 note
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      // AudioContext fallback ignored
    }
  };

  // Real-time market tick simulation loop
  useEffect(() => {
    const interval = setInterval(() => {
      setPairs(prev => {
        const updated = { ...prev };
        // Randomly pick 1 to 3 symbols to tick
        const symbols = Object.keys(updated);
        const numToUpdate = Math.floor(Math.random() * 2) + 1;
        
        for (let i = 0; i < numToUpdate; i++) {
          const sym = symbols[Math.floor(Math.random() * symbols.length)];
          const item = updated[sym];
          const volatility = sym === 'BTCUSD' ? 15.0 : (sym === 'XAUUSD' ? 0.45 : 0.0003);
          const delta = (Math.random() - 0.49) * volatility;
          const newPrice = Math.max(0.0001, item.price + delta);
          const decimals = item.decimals;
          
          const dir = newPrice > item.price ? 'up' : (newPrice < item.price ? 'down' : 'same');
          
          updated[sym] = {
            ...item,
            price: Number(newPrice.toFixed(decimals)),
            direction: dir,
            lastTickTime: Date.now()
          };
        }

        return updated;
      });
    }, 1800);

    return () => clearInterval(interval);
  }, []);

  // Check alert conditions against latest live prices
  useEffect(() => {
    setAlerts(prevAlerts => {
      let changed = false;
      const updated = prevAlerts.map(alert => {
        if (!alert.isActive || alert.isTriggered) return alert;
        
        const currentPrice = pairs[alert.symbol]?.price;
        if (currentPrice === undefined) return alert;

        let isMet = false;
        if (alert.condition === 'ABOVE' && currentPrice >= alert.targetPrice) {
          isMet = true;
        } else if (alert.condition === 'BELOW' && currentPrice <= alert.targetPrice) {
          isMet = true;
        }

        if (isMet) {
          changed = true;
          playAlertSound();
          const triggeredAlert = {
            ...alert,
            isTriggered: true,
            triggeredAt: new Date().toISOString()
          };
          setLatestTriggeredAlert(triggeredAlert);
          return triggeredAlert;
        }

        return alert;
      });

      return changed ? updated : prevAlerts;
    });
  }, [pairs]);

  const handleCreateAlert = (e: React.FormEvent) => {
    e.preventDefault();
    const targetVal = parseFloat(targetPriceInput);
    if (isNaN(targetVal) || targetVal <= 0) return;

    const newAlert: PriceAlert = {
      id: 'alert-' + Date.now(),
      symbol: selectedSymbol,
      targetPrice: targetVal,
      condition,
      note: noteInput.trim() || undefined,
      createdAt: new Date().toISOString(),
      isActive: true,
      isTriggered: false
    };

    setAlerts(prev => [newAlert, ...prev]);
    setIsAdding(false);
    setNoteInput('');
  };

  const handleDeleteAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const handleToggleAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a));
  };

  const handleApplyOffset = (percent: number) => {
    const currentPrice = pairs[selectedSymbol]?.price || 0;
    const decimals = pairs[selectedSymbol]?.decimals || 2;
    const offsetPrice = currentPrice * (1 + percent / 100);
    setTargetPriceInput(offsetPrice.toFixed(decimals));
  };

  const activeAlerts = alerts.filter(a => !a.isTriggered);
  const triggeredAlerts = alerts.filter(a => a.isTriggered);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm relative overflow-hidden">
      
      {/* Widget Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <BellRing size={15} />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              Price Alerts
              {activeAlerts.length > 0 && (
                <span className="px-1.5 py-0.2 bg-indigo-600 text-white text-[9px] font-extrabold rounded-full">
                  {activeAlerts.length}
                </span>
              )}
            </h4>
            <p className="text-[10px] text-slate-400 font-medium">Real-time market triggers</p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-1.5 rounded-lg border transition ${
              soundEnabled 
                ? 'bg-slate-50 text-indigo-600 border-slate-200 hover:bg-slate-100' 
                : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-600'
            }`}
            title={soundEnabled ? 'Mute alert sound' : 'Enable alert sound'}
          >
            {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
          </button>

          <button
            type="button"
            onClick={() => setIsAdding(!isAdding)}
            className={`p-1.5 rounded-lg border text-xs font-bold flex items-center gap-1 transition active:scale-95 cursor-pointer ${
              isAdding 
                ? 'bg-slate-900 text-white border-slate-900' 
                : 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100'
            }`}
          >
            {isAdding ? <X size={14} /> : <Plus size={14} />}
          </button>
        </div>
      </div>

      {/* Triggered Toast Banner Popup */}
      <AnimatePresence>
        {latestTriggeredAlert && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="mb-3 p-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl shadow-lg relative overflow-hidden"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="p-1 bg-white/20 rounded-lg">
                  <Zap size={14} className="text-amber-200 animate-bounce" />
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-black uppercase tracking-wider">{latestTriggeredAlert.symbol} ALERT HIT!</span>
                  </div>
                  <p className="text-[10px] text-emerald-100 font-medium">
                    Target {latestTriggeredAlert.condition} ${latestTriggeredAlert.targetPrice} met.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setLatestTriggeredAlert(null)}
                className="text-white/80 hover:text-white p-0.5 rounded"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Alert Form Container */}
      <AnimatePresence>
        {isAdding && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleCreateAlert}
            className="mb-3 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5 overflow-hidden"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest flex items-center gap-1">
                <Sparkles size={12} className="text-indigo-500" />
                Set Target Price
              </span>
              <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                Live: {pairs[selectedSymbol]?.price.toFixed(pairs[selectedSymbol]?.decimals || 2)}
              </span>
            </div>

            {/* Currency Pair Selector */}
            <div>
              <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Currency Pair</label>
              <select
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-bold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              >
                {Object.values(pairs).map(p => (
                  <option key={p.symbol} value={p.symbol}>
                    {p.symbol} ({p.name}) - ${p.price.toFixed(p.decimals)}
                  </option>
                ))}
              </select>
            </div>

            {/* Condition Toggle */}
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setCondition('ABOVE')}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-black flex items-center justify-center gap-1 border transition cursor-pointer ${
                  condition === 'ABOVE'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <TrendingUp size={12} />
                Price ≥ Above
              </button>

              <button
                type="button"
                onClick={() => setCondition('BELOW')}
                className={`py-1.5 px-2 rounded-lg text-[10px] font-black flex items-center justify-center gap-1 border transition cursor-pointer ${
                  condition === 'BELOW'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <TrendingDown size={12} />
                Price ≤ Below
              </button>
            </div>

            {/* Target Price Input */}
            <div>
              <label className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">Target Price</label>
              <input
                type="number"
                step="any"
                required
                value={targetPriceInput}
                onChange={(e) => setTargetPriceInput(e.target.value)}
                placeholder="0.00"
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />

              {/* Quick Percentage Offset Buttons */}
              <div className="flex items-center gap-1 mt-1.5">
                <span className="text-[9px] text-slate-400 font-bold mr-1">Quick:</span>
                {[-1.0, -0.5, 0.5, 1.0].map(pct => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handleApplyOffset(pct)}
                    className="flex-1 py-0.5 bg-white hover:bg-slate-200 border border-slate-200 rounded text-[9px] font-mono font-bold text-slate-600 transition"
                  >
                    {pct > 0 ? `+${pct}%` : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Note Input */}
            <div>
              <input
                type="text"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Alert note (optional)..."
                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 rounded-lg shadow-sm transition active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Bell size={13} />
              Set Price Alert
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Tabs Filter Bar */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('active')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold transition cursor-pointer ${
              activeTab === 'active'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Active ({activeAlerts.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('triggered')}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1 transition cursor-pointer ${
              activeTab === 'triggered'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Triggered ({triggeredAlerts.length})
          </button>
        </div>

        {/* Live Market Ticker Indicator */}
        <div className="flex items-center gap-1 text-[9px] text-slate-400 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
          Live Feed
        </div>
      </div>

      {/* Alert Cards List */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
        {activeTab === 'active' ? (
          activeAlerts.length === 0 ? (
            <div className="text-center py-8 px-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <Bell size={20} className="text-slate-300 mx-auto mb-1.5" />
              <p className="text-xs font-bold text-slate-600">No Active Price Alerts</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Click + to set an alert for Gold, EUR, BTC or Forex.</p>
            </div>
          ) : (
            activeAlerts.map(alert => {
              const pairData = pairs[alert.symbol];
              const livePrice = pairData?.price || alert.targetPrice;
              const decimals = pairData?.decimals || 2;
              
              // Calculate distance percentage
              const diff = livePrice - alert.targetPrice;
              const distPercent = ((diff / alert.targetPrice) * 100);
              const absDistPercent = Math.abs(distPercent);

              // Proximity calculation (0% = far, 100% = right at trigger threshold)
              const maxRange = alert.symbol === 'BTCUSD' ? 2000 : (alert.symbol === 'XAUUSD' ? 40 : 0.02);
              const distanceUnits = Math.abs(livePrice - alert.targetPrice);
              const proximity = Math.max(0, Math.min(100, (1 - distanceUnits / maxRange) * 100));

              return (
                <div
                  key={alert.id}
                  className={`p-2.5 rounded-xl border transition-all duration-200 relative group ${
                    alert.isActive 
                      ? 'bg-white border-slate-200/90 hover:border-indigo-200 hover:shadow-2xs' 
                      : 'bg-slate-50/70 border-slate-200/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                        alert.symbol === 'XAUUSD' ? 'bg-amber-100 text-amber-800' :
                        alert.symbol === 'BTCUSD' ? 'bg-orange-100 text-orange-800' :
                        'bg-indigo-100 text-indigo-800'
                      }`}>
                        {alert.symbol}
                      </span>

                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                        alert.condition === 'ABOVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {alert.condition === 'ABOVE' ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {alert.condition}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Active Toggle */}
                      <button
                        type="button"
                        onClick={() => handleToggleAlert(alert.id)}
                        className={`w-7 h-4 rounded-full transition-colors relative cursor-pointer ${
                          alert.isActive ? 'bg-indigo-600' : 'bg-slate-300'
                        }`}
                        title={alert.isActive ? 'Pause Alert' : 'Activate Alert'}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white shadow-md transition-transform ${
                          alert.isActive ? 'translate-x-3' : 'translate-x-0'
                        }`} />
                      </button>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleDeleteAlert(alert.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded transition opacity-0 group-hover:opacity-100"
                        title="Delete Alert"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {/* Price Comparison */}
                  <div className="flex items-baseline justify-between mt-1">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block">Target</span>
                      <span className="text-xs font-mono font-black text-slate-900">
                        ${alert.targetPrice.toFixed(decimals)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[9px] text-slate-400 font-bold block">Live Price</span>
                      <span className={`text-xs font-mono font-black transition-colors ${
                        pairData?.direction === 'up' ? 'text-emerald-600' : 
                        pairData?.direction === 'down' ? 'text-rose-600' : 'text-slate-700'
                      }`}>
                        ${livePrice.toFixed(decimals)}
                      </span>
                    </div>
                  </div>

                  {/* Note if provided */}
                  {alert.note && (
                    <p className="text-[10px] text-slate-500 italic mt-1 truncate border-t border-slate-100 pt-1">
                      "{alert.note}"
                    </p>
                  )}

                  {/* Distance & Proximity Progress Bar */}
                  <div className="mt-2 pt-1.5 border-t border-slate-100/80">
                    <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono mb-1">
                      <span>Proximity</span>
                      <span className="font-bold text-indigo-600">
                        {absDistPercent.toFixed(2)}% away
                      </span>
                    </div>
                    <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 rounded-full ${
                          proximity > 80 ? 'bg-amber-500' : 'bg-indigo-500'
                        }`} 
                        style={{ width: `${proximity}%` }}
                      />
                    </div>
                  </div>

                </div>
              );
            })
          )
        ) : (
          triggeredAlerts.length === 0 ? (
            <div className="text-center py-8 px-3 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
              <CheckCircle2 size={20} className="text-slate-300 mx-auto mb-1.5" />
              <p className="text-xs font-bold text-slate-600">No Triggered History</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Alerts that reach target price will appear here.</p>
            </div>
          ) : (
            triggeredAlerts.map(alert => (
              <div
                key={alert.id}
                className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/40 relative group"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black bg-emerald-600 text-white px-1.5 py-0.5 rounded">
                      {alert.symbol}
                    </span>
                    <span className="text-[9px] font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Zap size={10} /> HIT!
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteAlert(alert.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 transition"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                <div className="flex items-baseline justify-between text-xs font-mono font-bold text-slate-800 mt-1">
                  <span>Target: ${alert.targetPrice}</span>
                  <span className="text-[10px] text-slate-400 font-sans">
                    {alert.triggeredAt ? formatLocalTime(alert.triggeredAt) : 'Recently'}
                  </span>
                </div>

                {alert.note && (
                  <p className="text-[10px] text-emerald-800/80 italic mt-1">
                    "{alert.note}"
                  </p>
                )}
              </div>
            ))
          )
        )}
      </div>

    </div>
  );
};
