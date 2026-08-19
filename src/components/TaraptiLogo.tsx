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

  // Pilih source dari awal berdasarkan `type`, bukan menunggu onError.
  // Ini mencegah navbar app ikut jatuh ke logo_login.png, dan mencegah
  // salah tampil logo di konteks yang salah.
  const primarySrc = type === 'login' ? LOGIN_LOGO : APP_LOGO;
  const [imgSrc, setImgSrc] = useState(primarySrc);

  // Kalau prop `type` berubah (komponen dipakai ulang di route berbeda),
  // reset ke source yang benar untuk type tsb.
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
          // Fallback HANYA ke versi lain dari logo jenis yang sama
          // (bukan menyeberang ke logo type lain). Kalau app logo gagal,
          // coba nama file alternatif; kalau tetap gagal, biarkan alt text
          // tampil daripada diam-diam pakai logo login.
          if (type !== 'login' && imgSrc === APP_LOGO) {
            setImgSrc('/gotrading_logo.png');
          }
        }}
        referrerPolicy="no-referrer"
        loading="eager"
      />
    </div>
  );
};