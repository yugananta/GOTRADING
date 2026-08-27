import React, { useState } from 'react';
import { useApp } from './AppContext.tsx';
import { X, Activity, Check, ShieldAlert } from 'lucide-react';
import { apiFetch } from '../utils/apiFetch';

interface MarketPulseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MarketPulseModal: React.FC<MarketPulseModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, setCurrentUser } = useApp();
  const [enabled, setEnabled] = useState(currentUser?.marketPulseEnabled ?? false);
  const [selectedAssets, setSelectedAssets] = useState<string[]>(
    currentUser?.marketPulseAssets ?? [currentUser?.tradingAsset ?? 'Forex']
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen || !currentUser) return null;

  const assets = ["Forex", "Crypto", "Stocks", "Indices", "Commodities"];

  const handleToggleAsset = (asset: string) => {
    if (selectedAssets.includes(asset)) {
      setSelectedAssets(selectedAssets.filter(a => a !== asset));
    } else {
      setSelectedAssets([...selectedAssets, asset]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await apiFetch(`/api/users/profile/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketPulseEnabled: enabled,
          marketPulseAssets: selectedAssets
        })
      });

      if (res.ok) {
        const updatedUser = await res.json();
        setCurrentUser(updatedUser);
        setSaveSuccess(true);
        setTimeout(() => {
          setSaveSuccess(false);
          onClose();
        }, 1000);
      }
    } catch (err) {
      console.error("Failed to update Market Pulse settings:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id="market-pulse-modal-overlay" className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div id="market-pulse-modal-container" className="bg-white dark:bg-[#121620] border border-gray-200 dark:border-gray-800/80 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="text-rose-500 animate-pulse" size={18} />
            <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">Market Pulse Config</span>
          </div>
          <button id="close-market-pulse-modal" onClick={onClose} className="text-gray-400 dark:text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white transition p-1">
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          
          {/* Main Toggle Banner */}
          <div className="bg-[#181D28] border border-gray-200 dark:border-gray-800 rounded-2xl p-4 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-gray-900 dark:text-white block">Volatility Alerts</span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 block">Get instant high-momentum spikes</span>
            </div>

            {/* Toggle Switch */}
            <button
              id="toggle-market-pulse-switch"
              type="button"
              onClick={() => setEnabled(!enabled)}
              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                enabled ? 'bg-indigo-600' : 'bg-gray-800'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  enabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {enabled ? (
            <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <span className="block text-[10px] font-extrabold text-gray-400 dark:text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Select Active Asset Classes
              </span>
              <div className="space-y-2">
                {assets.map((asset) => {
                  const isChecked = selectedAssets.includes(asset);
                  return (
                    <button
                      key={asset}
                      id={`mp-asset-${asset.toLowerCase()}`}
                      type="button"
                      onClick={() => handleToggleAsset(asset)}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-bold transition duration-150 ${
                        isChecked
                          ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-400'
                          : 'bg-[#181D28]/60 border-gray-200 dark:border-gray-800/60 text-gray-400 dark:text-gray-500 dark:text-gray-400 hover:text-gray-200 hover:border-gray-700'
                      }`}
                    >
                      <span>{asset}</span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                        isChecked ? 'bg-indigo-500 border-indigo-500 text-gray-900 dark:text-white' : 'border-gray-700'
                      }`}>
                        {isChecked && <Check size={10} strokeWidth={3} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="py-6 px-4 bg-[#181D28]/40 rounded-2xl border border-gray-200 dark:border-gray-800/40 text-center space-y-2 animate-in fade-in duration-200">
              <ShieldAlert className="mx-auto text-gray-600" size={24} />
              <p className="text-[11px] text-gray-400 dark:text-gray-500 dark:text-gray-400 font-medium">Market Pulse notifications are deactivated.</p>
              <p className="text-[9px] text-gray-600 leading-normal">Enable above to receive automated volatility events, high momentum swings, and central bank break alerts on selected markets.</p>
            </div>
          )}

        </div>

        {/* Action Button Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800/60 bg-[#181D28]/30 flex gap-2">
          <button
            id="cancel-market-pulse"
            type="button"
            onClick={onClose}
            className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs rounded-xl transition"
          >
            Cancel
          </button>
          <button
            id="save-market-pulse"
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
          >
            {isSaving ? (
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : saveSuccess ? (
              <>
                <Check size={14} />
                Saved!
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
