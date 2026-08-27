import React from 'react';

export const TaraptiLogo = ({ className = '', showText = true, height = '56px', textColor = '#060b18' }: any) => (
  <div className={`flex items-center ${className}`} style={{ height }}>
    <svg viewBox='0 0 450 160' style={{ height: '100%', width: 'auto' }} className='object-contain'>
      <defs>
        <linearGradient id='tarapti-pill-gradient' x1='0%' y1='0%' x2='0%' y2='100%'>
          <stop offset='0%' stopColor='#be12fc' />
          <stop offset='100%' stopColor='#1b82ff' />
        </linearGradient>
      </defs>
      <g transform='translate(10, 10)'>
        <rect x='0' y='52' width='26' height='26' rx='8' fill='#1b82ff' />
        <rect x='32' y='12' width='28' height='116' rx='14' fill='url(#tarapti-pill-gradient)' />
        <rect x='66' y='52' width='26' height='26' rx='8' fill='#be12fc' />
        <rect x='66' y='94' width='26' height='26' rx='8' fill='#1b82ff' />
      </g>
      {showText && (
        <g transform='translate(132, 0)'>
          <text x='0' y='90' fontFamily="'Inter', system-ui, -apple-system, sans-serif" fontWeight='800' fontSize='68' fill={textColor} letterSpacing='-2'>
            tarapti
          </text>
          <text x='0' y='126' fontFamily="'Inter', system-ui, -apple-system, sans-serif" fontWeight='500' fontSize='18' fill={textColor} opacity='0.7' textLength='210' lengthAdjust='spacingAndGlyphs'>
            learn and grow together
          </text>
        </g>
      )}
    </svg>
  </div>
);
