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

// Logo untuk halaman app (navbar, dsb)
const APP_LOGO = '/logo_gotrading.png';
// Logo khusus halaman login
const LOGIN_LOGO = '/logo_login.png';

export const TaraptiLogo: React.FC<TaraptiLogoProps> = ({ 
  className = '', 
  height = '64px',
  type = 'main',
  align = type === 'login' ? 'center' : 'left'
}) => {
  const logoHeight = typeof height === 'number' ? `${height}px` : height;

  const primarySrc = type === 'login' ? LOGIN_LOGO : APP_LOGO;
  const [imgSrc, setImgSrc] = useState(primarySrc);

  useEffect(() => {
    setImgSrc(primarySrc);
  }, [primarySrc]);

  return (
    <div 
      className={`flex items-center shrink-0 select-none ${align === 'center' ? 'justify-center mx-auto' : ''} ${className}`} 
      style={{ height: logoHeight }}
    >
      <img 
        src={imgSrc}
        alt="GoTrading Logo" 
        style={{ 
          height: '100%', 
          width: 'auto', 
          objectFit: 'contain', 
          objectPosition: align === 'center' ? 'center' : 'left center'
        }}
        onError={() => {
          // Jika terjadi error saat memuat, coba fallback ke file lokal alternatif jika ada
          if (type !== 'login' && imgSrc === APP_LOGO) {
            setImgSrc('/logo_gotrading.png');
          }
        }}
        referrerPolicy="no-referrer"
        loading="eager"
      />
    </div>
  );
};