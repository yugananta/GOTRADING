import React, { useState, useEffect } from 'react';

interface TaraptiLogoProps {
  className?: string;
  showText?: boolean;
  height?: string | number;
  textColor?: string;
  onlyEmblem?: boolean;
  type?: 'main' | 'login';
  align?: 'left' | 'center';
}

export const TaraptiLogo: React.FC<TaraptiLogoProps> = ({ 
  className = '', 
  height = '70px',
  showText = true,
  textColor = 'text-slate-900',
  type = 'main',
  align = type === 'login' ? 'center' : 'left'
}) => {
  const candidates = type === 'login'
    ? ['/logo_login.png', '/logo_gotrading.png', '/login_logo.png', '/gotrading_logo.png', '/company_logo.png']
    : ['/logo_gotrading.png', '/gotrading_logo.png', '/logo_login.png', '/login_logo.png', '/company_logo.png'];

  const [candidateIndex, setCandidateIndex] = useState(0);
  const logoHeight = typeof height === 'number' ? `${height}px` : height;

  useEffect(() => {
    setCandidateIndex(0);
  }, [type]);

  const currentSrc = candidates[candidateIndex];
  const isExhausted = candidateIndex >= candidates.length;

  return (
    <div className={`flex items-center shrink-0 select-none ${align === 'center' ? 'justify-center mx-auto' : ''} ${className}`} style={{ height: logoHeight }}>
      {!isExhausted ? (
        <img 
          src={currentSrc}
          alt="GoTrading Logo" 
          style={{ 
            height: '100%', 
            width: 'auto', 
            objectFit: 'contain', 
            objectPosition: align === 'center' ? 'center' : 'left center' 
          }}
          onError={() => {
            setCandidateIndex(prev => prev + 1);
          }}
          referrerPolicy="no-referrer"
          loading="eager"
        />
      ) : (
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-black text-base shadow-sm">
            G
          </div>
          {showText && (
            <span className="font-black text-lg tracking-tight text-slate-900 dark:text-white">
              GOTRADING
            </span>
          )}
        </div>
      )}
    </div>
  );
};
