import React from 'react';
import { User, MapPin, Calendar, Award, Edit3 } from 'lucide-react';
import { useApp } from './AppContext';

export const Profile: React.FC = () => {
  const { currentUser } = useApp();

  return (
    <div className='bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6'>
      <div className='flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4'>
        <img
          src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
          alt='Avatar'
          className='w-20 h-20 rounded-full object-cover ring-4 ring-indigo-500/20'
        />
        <div className='text-center sm:text-left space-y-1'>
          <h2 className='text-lg font-black'>{currentUser?.firstName} {currentUser?.lastName}</h2>
          <p className='text-xs text-slate-500'>@{currentUser?.username}</p>
          <div className='flex items-center justify-center sm:justify-start space-x-3 text-[11px] text-slate-400 pt-1'>
            <span className='flex items-center space-x-1'><MapPin className='w-3.5 h-3.5' /><span>{currentUser?.location || 'Jakarta'}</span></span>
            <span className='flex items-center space-x-1'><Calendar className='w-3.5 h-3.5' /><span>Joined Jan 2024</span></span>
          </div>
        </div>
      </div>
      <p className='text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-4'>
        {currentUser?.bio || 'Forex & Commodities swing trader. Risk manager first.'}
      </p>
    </div>
  );
};
