import React from 'react';

interface MetaTraderLogoProps {
  variant?: 'mt4' | 'mt5' | 'generic';
  size?: number | string;
  className?: string;
  showText?: boolean;
}

export const MetaTraderLogo: React.FC<MetaTraderLogoProps> = ({
  variant = 'mt5',
  size,
  className = '',
  showText = false,
}) => {
  const label = variant === 'mt4' ? 'MetaTrader 4' : variant === 'mt5' ? 'MetaTrader 5' : 'MetaTrader';
  const containerStyle = size ? { width: size, height: size } : { width: '32px', height: '32px' };
  const isMt4 = variant === 'mt4';

  return (
    <div className={`inline-flex items-center justify-center overflow-hidden shrink-0 ${className}`}>
      <div 
        style={containerStyle} 
        className={`relative flex items-center justify-center rounded-[10px] shadow-sm overflow-hidden ${
          isMt4 
            ? 'bg-[#1565C0] border border-blue-400/40' 
            : 'bg-[#1A237E] border border-indigo-400/40'
        }`}
      >
        {/* Official MetaQuotes icon graphic representation: Grid lines and candlestick chart vector */}
        <svg className="absolute inset-0 w-full h-full opacity-25" viewBox="0 0 32 32" fill="none">
          <path d="M4 16H28M16 4V28" stroke="white" strokeWidth="0.75" strokeDasharray="2 2" />
          <path d="M6 24L12 18L18 22L26 10" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>

        {/* Gloss overlay */}
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/25 to-transparent pointer-events-none" />

        <div className="relative flex items-center justify-center font-black tracking-tighter text-white">
          <span className={isMt4 ? 'text-blue-100' : 'text-indigo-100'} style={{ fontSize: typeof size === 'number' && size < 24 ? '10px' : '13px' }}>
            {isMt4 ? 'MT4' : 'MT5'}
          </span>
        </div>
      </div>

      {showText && (
        <span className="font-extrabold text-xs tracking-tight text-slate-800 dark:text-white ml-2 whitespace-nowrap">
          {label}
        </span>
      )}
    </div>
  );
};


