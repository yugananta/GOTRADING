import React, { useState } from 'react';

interface TaraptiLogoProps {
  className?: string;
  showText?: boolean;
  height?: string | number;
  textColor?: string;
  onlyEmblem?: boolean;
}

export const TaraptiLogo: React.FC<TaraptiLogoProps> = ({ 
  className = '', 
  height = '70px',
  showText = true,
  textColor = 'text-slate-900'
}) => {
  const [imgSrc, setImgSrc] = useState('/gotrading_logo.png');
  const logoHeight = typeof height === 'number' ? `${height}px` : height;

  return (
    <div className={`flex items-center shrink-0 select-none ${className}`} style={{ height: logoHeight }}>
      <img 
        src={`${imgSrc}?t=${Date.now()}`}
        alt="Logo" 
        style={{ height: '100%', width: 'auto', objectFit: 'contain', objectPosition: 'left center' }}
        onError={() => {
          if (imgSrc === '/gotrading_logo.png') {
            setImgSrc('/company_logo.png');
          } else if (imgSrc === '/company_logo.png') {
            setImgSrc('/chat_logo.png');
          }
        }}
      />
    </div>
  );
};
