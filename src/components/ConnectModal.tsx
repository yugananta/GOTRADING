import React, { useState } from 'react';
import { useApp } from './AppContext.tsx';
import { ShieldCheck, Server, Key, UserCheck, X } from 'lucide-react';
import { MetaTraderLogo } from './MetaTraderLogo';
import { apiFetch } from '../utils/apiFetch';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectModal: React.FC<ConnectModalProps> = ({ isOpen, onClose }) => {
  const { connectBroker, connectedBroker, disconnectBroker } = useApp();
  const [broker, setBroker] = useState('axi');
  const [accountId, setAccountId] = useState('');
  const [server, setServer] = useState('');
  const [password, setPassword] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) return;

    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);

    try {
      const platform = broker === 'metatrader4' ? 'MT4' : 'MT5';
      const res = await apiFetch('/api/metatrader/connect', {
        method: 'POST',
        body: JSON.stringify({
          platform,
          login: accountId,
          password,
          server: server || 'Axi-Live',
          broker
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        connectBroker(broker, accountId, platform, password, server);
        setSuccessMsg('Akun terhubung dan terverifikasi!');
        setTimeout(() => {
          setSuccessMsg('');
          onClose();
        }, 1500);
      } else {
        setErrorMsg(data.error || 'Gagal terhubung ke server broker. Periksa kembali kredensial & status server.');
      }
    } catch (err) {
      setErrorMsg('Gagal terhubung ke server backend.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisconnect = () => {
    disconnectBroker();
    onClose();
  };

  return (
    <div id="connect-broker-modal" className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#121620] border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-md p-6 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white p-1 rounded-full hover:bg-gray-800 transition"
        >
          <X size={20} />
        </button>

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <ShieldCheck className="text-indigo-400" />
          {connectedBroker ? 'Connected Trading Account' : 'Connect Trading Account'}
        </h3>
        <p className="text-xs text-gray-400 dark:text-gray-500 dark:text-gray-400 mb-6">
          Synchronize your real-time performance statistics securely to build transparency and verify your reputation in the Tarapti community.
        </p>

        {successMsg && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-lg text-xs mb-4 text-center">
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl text-xs mb-4 leading-relaxed font-medium">
            ⚠️ {errorMsg}
          </div>
        )}

        {connectedBroker ? (
          <div className="space-y-4">
            <div className="bg-[#1a2030] p-4 rounded-xl border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400 dark:text-gray-500">Broker Platform</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white uppercase">{connectedBroker.broker}</span>
              </div>
              {connectedBroker.server && (
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-400 dark:text-gray-500">Trading Server</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{connectedBroker.server}</span>
                </div>
              )}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400 dark:text-gray-500">Account ID</span>
                <span className="text-sm font-mono text-indigo-400 font-semibold">{connectedBroker.accountId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400 dark:text-gray-500 dark:text-gray-400">Status</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-medium">Verified Active</span>
              </div>
            </div>

            <button
              onClick={handleDisconnect}
              className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-xl text-xs transition duration-150"
            >
              Disconnect Credentials
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Select Broker / Platform</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'axi', name: 'Axi' },
                  { id: 'metatrader4', name: 'MT4', variant: 'mt4' as const },
                  { id: 'metatrader5', name: 'MT5', variant: 'mt5' as const },
                  { id: 'ctrader', name: 'cTrader' },
                  { id: 'tradingview', name: 'TradingView' },
                  { id: 'dx_trade', name: 'DXtrade' }
                ].map((plat) => (
                  <button
                    key={plat.id}
                    type="button"
                    onClick={() => setBroker(plat.id)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border transition flex items-center justify-center gap-1.5 ${
                      broker === plat.id
                        ? 'bg-indigo-600/10 border-indigo-500 text-white'
                        : 'bg-[#181d28] border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-500 hover:bg-gray-800'
                    }`}
                  >
                    {plat.variant && <MetaTraderLogo variant={plat.variant} size={16} className="rounded" />}
                    <span>{plat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                  <UserCheck size={12} className="text-gray-400 dark:text-gray-500 dark:text-gray-400" /> Account Number / Login ID
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 8920404"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  className="w-full bg-[#181d28] border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {(broker === 'metatrader4' || broker === 'metatrader5') && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                    <Server size={12} className="text-gray-400 dark:text-gray-500 dark:text-gray-400" /> Trading Server Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Axi-US50-Live"
                    value={server}
                    onChange={(e) => setServer(e.target.value)}
                    className="w-full bg-[#181d28] border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1.5">
                  <Key size={12} className="text-gray-400 dark:text-gray-500 dark:text-gray-400" /> Read-only Password (Investor)
                </label>
                <input
                  type="password"
                  required
                  placeholder="Required for security verification"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#181d28] border border-gray-200 dark:border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-400 text-white font-medium rounded-xl text-xs transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? 'Memeriksa Koneksi Server...' : 'Connect Verified Account'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
