import React, { useState } from 'react';
import { KeyRound, ShieldAlert, RefreshCw, Lock } from 'lucide-react';
import { ApiCredential } from '../../types';
import { MaskedInput } from '../ui/MaskedInput';
import { Modal } from '../ui/Modal';
import { Badge } from '../ui/Badge';

interface ApiKeysViewProps {
  credentials: ApiCredential[];
  onRotateKey: (credId: string) => void;
}

export const ApiKeysView: React.FC<ApiKeysViewProps> = ({ credentials, onRotateKey }) => {
  const [selectedCred, setSelectedCred] = useState<ApiCredential | null>(null);

  const handleConfirmRotate = () => {
    if (selectedCred) {
      onRotateKey(selectedCred.id);
      setSelectedCred(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-amber-400" /> API Secret Key Management & Vault
        </h2>
        <p className="text-xs text-slate-400">
          Owner-only secret credential manager. API secrets are encrypted at rest and never exposed in plain text.
        </p>
      </div>

      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-center gap-3">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0" />
        <div>
          <span className="font-bold block">OWNER SECURITY DIRECTIVE:</span>
          Secrets must never be stored in source code or Git. Rotating a secret instantly revokes previous session tokens across all server proxies.
        </div>
      </div>

      <div className="space-y-4">
        {credentials.map(c => (
          <div key={c.id} className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">{c.serviceName}</h3>
                <span className="text-xs text-slate-400 font-mono">Environment: {c.environment} • Last Rotated: {c.lastRotated}</span>
              </div>
              <Badge variant={c.status === 'ACTIVE' ? 'success' : 'danger'}>{c.status}</Badge>
            </div>

            <MaskedInput
              label="SECRET API TOKEN / SERVICE ROLE KEY"
              value={c.maskedKey}
              onRotate={() => setSelectedCred(c)}
            />
          </div>
        ))}
      </div>

      {/* Rotation Confirmation Modal */}
      <Modal
        isOpen={!!selectedCred}
        onClose={() => setSelectedCred(null)}
        title={`Rotate Secret API Key for ${selectedCred?.serviceName}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-300">
            Are you sure you want to rotate this secret key? A new cryptographically secure key fingerprint will be generated immediately, and the action will be permanently recorded in the Audit Log.
          </p>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              onClick={() => setSelectedCred(null)}
              className="px-4 py-2 text-xs font-semibold bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmRotate}
              className="px-4 py-2 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Confirm Rotation
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
