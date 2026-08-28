import React from 'react';

interface LocationDropdownProps {
  label: string;
  options: any[];
  value: any | null;
  onChange: (value: any) => void;
  isLoading?: boolean;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
}

export const LocationDropdown: React.FC<LocationDropdownProps> = ({
  label,
  options,
  value,
  onChange,
  isLoading,
  disabled,
  placeholder = "Select an option",
  id
}) => {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label htmlFor={id} className="block text-[10px] font-black uppercase text-slate-400 tracking-wider">
        {label}
      </label>
      <div className="relative">
        <select
          id={id}
          value={value?.id || ''}
          onChange={(e) => {
            if (!Array.isArray(options)) return;
            const selected = options.find(opt => opt.id.toString() === e.target.value);
            onChange(selected || null);
          }}
          disabled={disabled || isLoading}
          className={`w-full pl-3.5 pr-10 py-2.5 bg-white/[0.08] backdrop-blur-xl border border-white/20 rounded-xl focus:outline-none focus:border-indigo-400/80 focus:ring-1 focus:ring-indigo-500/40 focus:bg-white/[0.14] disabled:opacity-40 disabled:cursor-not-allowed appearance-none transition-all text-xs text-white font-medium shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),0_1px_4px_rgba(0,0,0,0.3)]`}
        >
          <option value="" className="bg-[#121620] text-slate-300/50">{isLoading ? 'Loading...' : placeholder}</option>
          {Array.isArray(options) && options.map((option) => (
            <option key={option.id} value={option.id} className="bg-[#121620] text-white">
              {option.name}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center px-3.5 pointer-events-none">
          <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
};

