import React, { useState } from 'react';
import { BookOpen, Plus, TrendingUp, TrendingDown, DollarSign, Calendar, Filter } from 'lucide-react';
import { useApp } from './AppContext';

export const Journal: React.FC = () => {
  const { tradingStats } = useApp();
  const [trades, setTrades] = useState([
    { id: '1', pair: 'EURUSD', type: 'BUY', entry: '1.0820', exit: '1.0865', pnl: '+50', date: '2024-08-26', status: 'WIN' },
    { id: '2', pair: 'XAUUSD', type: 'SELL', entry: '2510.0', exit: '2495.0', pnl: '+,500', date: '2024-08-25', status: 'WIN' },
    { id: '3', pair: 'GBPUSD', type: 'BUY', entry: '1.3120', exit: '1.3090', pnl: '-00', date: '2024-08-24', status: 'LOSS' }
  ]);

  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-2 sm:grid-cols-4 gap-3'>
        <div className='bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 space-y-1'>
          <span className='text-[10px] font-bold text-slate-400 uppercase'>Portfolio</span>
          <h4 className='text-base font-black text-slate-900 dark:text-slate-100'>{tradingStats.portfolio}</h4>
        </div>
        <div className='bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 space-y-1'>
          <span className='text-[10px] font-bold text-slate-400 uppercase'>P&L Hari Ini</span>
          <h4 className='text-base font-black text-emerald-600 dark:text-emerald-400'>{tradingStats.todayPL}</h4>
        </div>
        <div className='bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 space-y-1'>
          <span className='text-[10px] font-bold text-slate-400 uppercase'>Win Rate</span>
          <h4 className='text-base font-black text-indigo-600 dark:text-indigo-400'>{tradingStats.winRate}</h4>
        </div>
        <div className='bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 space-y-1'>
          <span className='text-[10px] font-bold text-slate-400 uppercase'>Win Streak</span>
          <h4 className='text-base font-black text-amber-500'>{tradingStats.streak}</h4>
        </div>
      </div>

      <div className='bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3'>
        <div className='flex items-center justify-between'>
          <h3 className='text-xs font-bold flex items-center space-x-2'>
            <BookOpen className='w-4 h-4 text-indigo-500' />
            <span>Catatan Jurnal Trading</span>
          </h3>
          <button className='px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center space-x-1'>
            <Plus className='w-3.5 h-3.5' />
            <span>Tambah Posisi</span>
          </button>
        </div>

        <div className='overflow-x-auto'>
          <table className='w-full text-left text-xs'>
            <thead>
              <tr className='border-b border-slate-100 dark:border-slate-800 text-slate-400 text-[10px] font-black uppercase'>
                <th className='pb-2'>Pair</th>
                <th className='pb-2'>Tipe</th>
                <th className='pb-2'>Entry</th>
                <th className='pb-2'>Exit</th>
                <th className='pb-2'>P&L</th>
                <th className='pb-2'>Status</th>
              </tr>
            </thead>
            <tbody className='divide-y divide-slate-100 dark:divide-slate-800 font-semibold'>
              {trades.map((t) => (
                <tr key={t.id} className='hover:bg-slate-50 dark:hover:bg-slate-800/40'>
                  <td className='py-2.5 font-bold'>{t.pair}</td>
                  <td className='py-2.5'>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${t.type === 'BUY' ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600' : 'bg-rose-100 dark:bg-rose-950/50 text-rose-600'}`}>
                      {t.type}
                    </span>
                  </td>
                  <td className='py-2.5 text-slate-500'>{t.entry}</td>
                  <td className='py-2.5 text-slate-500'>{t.exit}</td>
                  <td className={`py-2.5 font-black ${t.status === 'WIN' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>{t.pnl}</td>
                  <td className='py-2.5'>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${t.status === 'WIN' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
