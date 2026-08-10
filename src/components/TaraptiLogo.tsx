import React, { useState } from 'react';

interface TaraptiLogoProps {
  className?: string;
  showText?: boolean;
  height?: string | number;
  textColor?: string;
  onlyEmblem?: boolean;
  type?: 'main' | 'login';
}

export const TaraptiLogo: React.FC<TaraptiLogoProps> = ({ 
  className = '', 
  height = '70px',
  showText = true,
  textColor = 'text-slate-900',
  type = 'main'
}) => {
  const [imgSrc, setImgSrc] = useState(type === 'login' ? '/login_logo.png' : '/gotrading_logo.png');
  const [timestamp] = useState(() => Date.now());
  const [hasError, setHasError] = useState(false);
  const logoHeight = typeof height === 'number' ? `${height}px` : height;

  return (
    <div className={`flex items-center shrink-0 select-none ${className}`} style={{ height: logoHeight }}>
      {!hasError && (
        <img 
          src={`${imgSrc}?t=${timestamp}`}
          alt="Logo" 
          style={{ height: '100%', width: 'auto', objectFit: 'contain', objectPosition: 'left center' }}
          onError={() => {
            if (imgSrc === '/login_logo.png') {
              setImgSrc('/gotrading_logo.png');
            } else if (imgSrc === '/gotrading_logo.png') {
              setImgSrc('/company_logo.png');
            } else if (imgSrc === '/company_logo.png') {
              setImgSrc('/chat_logo.png');
            } else {
              setHasError(true);
            }
          }}
        />
      )}
    </div>
  );
};
