import React from 'react';

export const SponsoredBadge: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex items-center gap-1.5 md:gap-2.5 lg:gap-3 px-2 py-0.5 md:px-3 md:py-1.5 lg:px-4 lg:py-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/90 md:border-slate-300/90 rounded-md md:rounded-xl text-[9px] md:text-xs lg:text-sm font-bold text-slate-600 shadow-2xs transition-all ${className}`}>
      <span className="tracking-tight uppercase text-slate-500 dark:text-slate-400 font-black text-[9px] md:text-xs lg:text-sm">Sponsored by</span>
      <div className="flex items-center justify-center overflow-hidden rounded">
        <img src="/axi_logo.svg" alt="AXI" className="h-5 md:h-7 lg:h-8 w-auto object-contain" />
      </div>
    </div>
  );
};


