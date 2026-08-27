import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, TrendingUp, MoreHorizontal, Bookmark, CheckCircle2 } from 'lucide-react';
import { Post } from '../types';
import { useApp } from './AppContext';

export const PostCard: React.FC<{ post: Post }> = ({ post }) => {
  const { viewUserProfile } = useApp();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes || 12);

  const toggleLike = () => {
    setLiked(!liked);
    setLikesCount(prev => liked ? prev - 1 : prev + 1);
  };

  return (
    <div className='bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-xs transition-all hover:border-slate-300 dark:hover:border-slate-700'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center space-x-3 cursor-pointer' onClick={() => viewUserProfile(post.author?.id || 'u2')}>
          <img
            src={post.author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
            alt={post.author?.name}
            className='w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/20'
          />
          <div>
            <div className='flex items-center space-x-1.5'>
              <h4 className='text-xs font-bold text-slate-900 dark:text-slate-100'>{post.author?.name || 'Trader Pro'}</h4>
              <CheckCircle2 className='w-3.5 h-3.5 text-indigo-500 fill-indigo-500/10' />
            </div>
            <p className='text-[10px] text-slate-500'>@{post.author?.username || 'trader'} • {post.createdAt || '2 jam lalu'}</p>
          </div>
        </div>
        <button className='text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1'>
          <MoreHorizontal className='w-4 h-4' />
        </button>
      </div>

      <p className='text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line'>
        {post.content}
      </p>

      {post.chart && (
        <div className='bg-slate-900 text-slate-100 rounded-xl p-3 space-y-2 border border-slate-800'>
          <div className='flex items-center justify-between text-xs'>
            <span className='font-bold text-indigo-400'>{post.chart.pair}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              post.chart.status === 'WIN' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
            }`}>
              {post.chart.status}
            </span>
          </div>
          <div className='h-16 flex items-center justify-center border-t border-slate-800 pt-2'>
            <TrendingUp className='w-8 h-8 text-indigo-500 opacity-60' />
          </div>
        </div>
      )}

      <div className='flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs'>
        <button onClick={toggleLike} className={`flex items-center space-x-1.5 hover:text-rose-500 transition-all ${liked ? 'text-rose-500 font-bold' : ''}`}>
          <Heart className={`w-4 h-4 ${liked ? 'fill-rose-500' : ''}`} />
          <span>{likesCount}</span>
        </button>
        <button className='flex items-center space-x-1.5 hover:text-indigo-500 transition-all'>
          <MessageCircle className='w-4 h-4' />
          <span>{post.commentsCount || 4}</span>
        </button>
        <button className='flex items-center space-x-1.5 hover:text-indigo-500 transition-all'>
          <Share2 className='w-4 h-4' />
          <span>Bagikan</span>
        </button>
      </div>
    </div>
  );
};
