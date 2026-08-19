import React, { useState } from 'react';

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
  const initialLogo = type === 'login' ? '/login_logo.png' : '/logo_gotrading.png';
  const [imgSrc, setImgSrc] = useState(initialLogo);
  const [timestamp] = useState(() => Date.now());
  const [hasError, setHasError] = useState(false);
  const logoHeight = typeof height === 'number' ? `${height}px` : height;

  React.useEffect(() => {
    setImgSrc(type === 'login' ? '/login_logo.png' : '/logo_gotrading.png');
    setHasError(false);
  }, [type]);

  return (
    <div className={`flex items-center shrink-0 select-none ${align === 'center' ? 'justify-center mx-auto' : ''} ${className}`} style={{ height: logoHeight }}>
      {!hasError && (
        <img 
          src={`${imgSrc}?t=${timestamp}`}
          alt="Logo" 
          style={{ 
            height: '100%', 
            width: 'auto', 
            objectFit: 'contain', 
            objectPosition: align === 'center' ? 'center' : 'left center' 
          }}
          onError={() => {
            if (type === 'login') {
              if (imgSrc === '/login_logo.png') {
                setImgSrc('/logo_gotrading.png');
              } else if (imgSrc === '/logo_gotrading.png') {
                setImgSrc('/gotrading_logo.png');
              } else if (imgSrc === '/gotrading_logo.png') {
                setImgSrc('/company_logo.png');
              } else {
                setHasError(true);
              }
            } else {
              if (imgSrc === '/logo_gotrading.png') {
                setImgSrc('/gotrading_logo.png');
              } else if (imgSrc === '/gotrading_logo.png') {
                setImgSrc('/login_logo.png');
              } else if (imgSrc === '/login_logo.png') {
                setImgSrc('/company_logo.png');
              } else {
                setHasError(true);
              }
            }
          }}
        />
      )}
    </div>
  );
};
