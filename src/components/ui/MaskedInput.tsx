import React, { useState } from 'react';
import { Eye, EyeOff, Copy, Check, RefreshCw } from 'lucide-react';

interface MaskedInputProps {
  value: string;
  label?: string;
  onRotate?: () => void;
}

export const MaskedInput: React.FC<MaskedInputProps> = ({ value, label, onRotate }) => {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayedValue = show ? value.replace(/•/g, 'x7a9k2') : value;

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-xs font-medium text-slate-400">{label}</label>}
      <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 font-mono">
        <span className="flex-1 truncate tracking-wider">{displayedValue}</span>
        <button
          onClick={() => setShow(!show)}
          title={show ? 'Hide Secret' : 'Show Secret (Requires Permission)'}
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
        <button
          onClick={handleCopy}
          title="Copy Key"
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
        </button>
        {onRotate && (
          <button
            onClick={onRotate}
            title="Rotate API Key"
            className="p-1 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
