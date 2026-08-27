import React from 'react';
import { LineChart, TrendingUp, Globe, Clock, AlertTriangle } from 'lucide-react';

export const Outlook: React.FC = () => {
  const events = [
    { time: '19:30 WIB', currency: 'USD', title: 'US Core PCE Price Index', impact: 'HIGH', forecast: '0.2%', previous: '0.2%' },
    { time: '21:00 WIB', currency: 'USD', title: 'Michigan Consumer Sentiment', impact: 'MEDIUM', forecast: '67.8', previous: '66.4' },
    { time: '23:00 WIB', currency: 'EUR', title: 'ECB President Lagarde Speech', impact: 'HIGH', forecast: '-', previous: '-' }
  ];

  return (
    <div className='space-y-4'>
      <div className='bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3'>
        <div className='flex items-center justify-between'>
          <h3 className='text-xs font-bold flex items-center space-x-2'>
            <Globe className='w-4 h-4 text-indigo-500' />
            <span>Kalender Ekonomi Hari Ini</span>
          </h3>
          <span className='text-[10px] text-slate-400 font-semibold'>GMT+7 Jakarta</span>
        </div>

        <div className='space-y-2'>
          {events.map((ev, i) => (
            <div key={i} className='flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs'>
              <div className='flex items-center space-x-3'>
                <span className='font-mono font-bold text-slate-500 text-[11px]'>{ev.time}</span>
                <span className='px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 font-black text-[10px]'>{ev.currency}</span>
                <span className='font-semibold'>{ev.title}</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                ev.impact === 'HIGH' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'
              }`}>
                {ev.impact}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
