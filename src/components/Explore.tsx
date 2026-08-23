import React, { useState, useEffect } from 'react';
import { Post, User } from '../types.js';
import { useApp } from './AppContext.tsx';
import { PostCard } from './PostCard.tsx';
import { Hash, TrendingUp, Users, ArrowUpRight, Flame } from 'lucide-react';
import { formatToK } from '../utils/formatters.ts';
import { apiFetch } from '../utils/apiFetch';

let cachedPopularTraders: User[] | null = null;

export const Explore: React.FC = () => {
  const { posts, fetchPosts, viewUserProfile, showToast } = useApp();
  const [popularTraders, setPopularTraders] = useState<User[]>(cachedPopularTraders || []);
  const [activeTab, setActiveTab] = useState<'trending' | 'traders' | 'communities'>('trending');

  useEffect(() => {
    if (cachedPopularTraders) {
      setPopularTraders(cachedPopularTraders);
      return;
    }
    
    // Fetch popular traders on load
    apiFetch('/api/users')
      .then(res => {
        if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
          return res.json();
        }
        return [];
      })
      .then(data => {
        if (Array.isArray(data)) {
          // Sort by reputationPoints
          const sorted = [...data].sort((a: any, b: any) => (b.reputationPoints || 0) - (a.reputationPoints || 0));
          const topTraders = sorted.slice(0, 4);
          cachedPopularTraders = topTraders;
          setPopularTraders(topTraders);
        } else {
          setPopularTraders([]);
        }
      })
      .catch(err => {
        console.error("Explore fetch error:", err);
      });
  }, []);

  const trendingHashtags = [
    { tag: 'XAUUSD', postsCount: 1420 },
    { tag: 'Forex', postsCount: 980 },
    { tag: 'BTC', postsCount: 840 },
    { tag: 'Crypto', postsCount: 750 },
    { tag: 'EURUSD', postsCount: 520 },
    { tag: 'SMC', postsCount: 310 }
  ];

  const communities = [
    { name: 'XAUUSD Gold Bulls Club', members: 420, desc: 'Specialized in intraday gold scalping & price action zones.' },
    { name: 'Smart Money Concepts Study', members: 290, desc: 'Orderblocks, Fair Value Gaps, and liquidity sweeps.' },
    { name: 'Crypto Swing Traders', members: 180, desc: 'Position trading Altcoins and BTC on higher timeframes.' },
    { name: 'Prop Firm Challenge Pros', members: 510, desc: 'Sharing setups, payout strategies, and daily drawdown control.' }
  ];

  // Filter posts with higher likes/reposts to simulate trending
  const trendingPosts = [...posts].sort((a, b) => b.likesCount - a.likesCount);

  return (
    <div id="explore-view" className="space-y-5 py-2">
      
      {/* Title */}
      <div className="flex items-center gap-2">
        <TrendingUp className="text-indigo-400" size={20} />
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Market Explore</h2>
      </div>

      {/* Trending Hashtags row */}
      <div className="bg-indigo-50/50 backdrop-blur-md border border-indigo-100/60 rounded-3xl p-5 shadow-[0_4px_20px_-5px_rgba(0,0,0,0.03)]">
        <h3 className="text-xs font-black text-black mb-3 uppercase tracking-wider flex items-center gap-2">
          <Flame size={14} className="text-orange-500" />
          Hot Trading Discussions Today
        </h3>
        <div className="flex flex-wrap gap-2">
          {trendingHashtags.map((h, i) => (
            <button
              key={i}
              onClick={() => showToast(`Showing discussions for #${h.tag}`)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-700 transition hover:border-indigo-500/20 shadow-sm"
            >
              <Hash size={11} className="text-indigo-400" />
              <span>{h.tag}</span>
              <span className="text-[10px] text-slate-400 font-bold">({formatToK(h.postsCount)})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Inner Tabs Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        {[
          { id: 'trending', label: 'Trending Posts' },
          { id: 'traders', label: 'Popular Traders' },
          { id: 'communities', label: 'Discovered Clubs' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-3 text-center text-xs font-semibold transition border-b-2 ${
              activeTab === tab.id
                ? 'border-indigo-500 text-gray-900 dark:text-white'
                : 'border-transparent text-gray-400 dark:text-gray-500 dark:text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content panes */}
      <div className="space-y-4">
        {activeTab === 'trending' && (
          <div className="space-y-4">
            {trendingPosts.length === 0 ? (
              <div className="text-center py-12 text-gray-400 dark:text-gray-500 text-xs">No posts currently trending. Check back later!</div>
            ) : (
              trendingPosts.map(post => (
                <PostCard key={post.id} post={post} onPostUpdated={fetchPosts} />
              ))
            )}
          </div>
        )}

        {activeTab === 'traders' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {popularTraders.map(trader => (
              <div 
                key={trader.id} 
                onClick={() => viewUserProfile(trader.id)}
                className="bg-white/70 dark:bg-[#121620] backdrop-blur-xl border border-slate-200 dark:border-gray-800 rounded-3xl p-5 flex items-start gap-3 justify-between shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] cursor-pointer hover:border-indigo-500/20 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white font-bold flex items-center justify-center text-sm shadow-md shrink-0">
                    {trader.avatar && (trader.avatar.startsWith('http') || trader.avatar.startsWith('data:')) ? (
                      <img src={trader.avatar} alt={trader.firstName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      trader.avatar
                    )}
                  </div>
                  <div>
                    <h4 className="text-[15px] font-roboto font-semibold text-slate-800 dark:text-white hover:text-indigo-600">{trader.firstName} {trader.lastName}</h4>
                    <p className="text-[12px] text-slate-500 dark:text-gray-500 font-normal">{trader.city}, {trader.country}</p>
                    <p className="text-[13px] text-slate-600 mt-1.5 font-normal leading-relaxed line-clamp-1">{trader.headline}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-black border border-indigo-500/20">
                        Reputation: {formatToK(trader.reputationPoints)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="p-1.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-indigo-600 shrink-0 transition shadow-sm">
                  <ArrowUpRight size={14} />
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'communities' && (
          <div className="space-y-3">
            {communities.map((c, i) => (
              <div key={i} className="bg-white dark:bg-[#121620] border border-gray-200 dark:border-gray-800 rounded-2xl p-4 flex items-start gap-3 justify-between">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shrink-0">
                    <Users size={18} />
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-gray-900 dark:text-white">{c.name}</h4>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 leading-5">{c.desc}</p>
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-medium mt-2 block">{formatToK(c.members)} active traders</span>
                  </div>
                </div>

                <button
                  onClick={() => showToast(`Request sent to join ${c.name}!`)}
                  className="px-3 py-1 bg-[#181D28] hover:bg-[#1f2638] border border-gray-200 dark:border-gray-800 rounded-xl text-[10px] font-bold text-gray-700 dark:text-gray-300 shrink-0 transition"
                >
                  Join
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
