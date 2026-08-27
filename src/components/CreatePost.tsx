import React, { useState } from 'react';
import { X, Image, LineChart, Sparkles } from 'lucide-react';
import { useApp } from './AppContext';

export const CreatePost: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { setPosts, showToast, currentUser } = useApp();
  const [content, setContent] = useState('');
  const [pair, setPair] = useState('EURUSD');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    const newPost = {
      id: `p_${Date.now()}`,
      author: {
        id: currentUser?.id || 'u1',
        name: `${currentUser?.firstName || 'Alex'} ${currentUser?.lastName || 'Morgan'}`,
        username: currentUser?.username || 'alex_trader',
        avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
      },
      content,
      createdAt: 'Baru saja',
      likes: 0,
      commentsCount: 0,
      chart: { pair, status: 'ANALYSIS' }
    };

    setPosts(prev => [newPost, ...prev]);
    showToast('Postingan analisa berhasil dipublikasikan!');
    onClose();
  };

  return (
    <div className='fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4'>
      <div className='bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-4 space-y-4 shadow-2xl animate-in fade-in zoom-in-95'>
        <div className='flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800'>
          <h3 className='text-sm font-bold flex items-center space-x-2'>
            <Sparkles className='w-4 h-4 text-indigo-500' />
            <span>Buat Postingan Analisa</span>
          </h3>
          <button onClick={onClose} className='p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'>
            <X className='w-5 h-5' />
          </button>
        </div>

        <form onSubmit={handleSubmit} className='space-y-3'>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder='Bagikan ide trading, setup chart, atau analisa pasar hari ini...'
            className='w-full h-32 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 resize-none'
          />

          <div className='flex items-center justify-between gap-2'>
            <div className='flex items-center space-x-2'>
              <span className='text-[10px] font-bold text-slate-400'>PAIR:</span>
              <select
                value={pair}
                onChange={(e) => setPair(e.target.value)}
                className='px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold'
              >
                <option value='EURUSD'>EURUSD</option>
                <option value='XAUUSD'>XAUUSD (Gold)</option>
                <option value='BTCUSD'>BTCUSD</option>
                <option value='GBPUSD'>GBPUSD</option>
              </select>
            </div>

            <button
              type='submit'
              className='px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all'
            >
              Posting Sekarang
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
