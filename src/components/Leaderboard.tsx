import React from 'react';
import { Award, TrendingUp, Trophy, Flame } from 'lucide-react';
import { useApp } from './AppContext';

export const Leaderboard: React.FC = () => {
  const { viewUserProfile } = useApp();

  const traders = [
    { id: 'u2', name: 'Budi Santoso', handle: '@buditrader', winRate: '78%', pnl: '+4,250', rank: 1, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
    { id: 'u3', name: 'Siti Rahma', handle: '@siti_fx', winRate: '74%', pnl: '+1,800', rank: 2, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
    { id: 'u4', name: 'Dian Kusuma', handle: '@dian_crypto', winRate: '71%', pnl: '+,400', rank: 3, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' },
    { id: 'u5', name: 'Eko Prasetyo', handle: '@ekopro', winRate: '68%', pnl: '+,100', rank: 4, avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150' }
  ];

  return (
    <div className='bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4 shadow-xs'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-2'>
          <Trophy className='w-5 h-5 text-amber-500' />
          <h3 className='text-sm font-bold'>Top Traders Minggu Ini</h3>
        </div>
        <span className='text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-full'>
          LIVE
        </span>
      </div>

      <div className='space-y-3'>
        {traders.map((trader) => (
          <div
            key={trader.id}
            onClick={() => viewUserProfile(trader.id)}
            className='flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700'
          >
            <div className='flex items-center space-x-3'>
              <div className='relative'>
                <img src={trader.avatar} alt={trader.name} className='w-9 h-9 rounded-full object-cover' />
                <span className={`absolute -top-1 -left-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white ${
                  trader.rank === 1 ? 'bg-amber-500' : trader.rank === 2 ? 'bg-slate-400' : trader.rank === 3 ? 'bg-amber-700' : 'bg-slate-600'
                }`}>
                  {trader.rank}
                </span>
              </div>
              <div>
                <h4 className='text-xs font-bold leading-tight'>{trader.name}</h4>
                <p className='text-[10px] text-slate-500'>{trader.handle}</p>
              </div>
            </div>

            <div className='text-right'>
              <span className='text-xs font-black text-emerald-600 dark:text-emerald-400 block'>{trader.pnl}</span>
              <span className='text-[9px] text-slate-400 font-medium'>Winrate {trader.winRate}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
