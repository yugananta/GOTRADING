import os

components = {}

components['TaraptiLogo.tsx'] = """import React from 'react';

export const TaraptiLogo = ({ className = "", showText = true, height = "56px", textColor = "#060b18" }: any) => (
  <div className={`flex items-center ${className}`} style={{ height }}>
    <svg viewBox="0 0 450 160" style={{ height: "100%", width: "auto" }} className="object-contain">
      <defs>
        <linearGradient id="tarapti-pill-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#be12fc" />
          <stop offset="100%" stopColor="#1b82ff" />
        </linearGradient>
      </defs>
      <g transform="translate(10, 10)">
        <rect x="0" y="52" width="26" height="26" rx="8" fill="#1b82ff" />
        <rect x="32" y="12" width="28" height="116" rx="14" fill="url(#tarapti-pill-gradient)" />
        <rect x="66" y="52" width="26" height="26" rx="8" fill="#be12fc" />
        <rect x="66" y="94" width="26" height="26" rx="8" fill="#1b82ff" />
      </g>
      {showText && (
        <g transform="translate(132, 0)">
          <text x="0" y="90" fontFamily="'Inter', system-ui, -apple-system, sans-serif" fontWeight="800" fontSize="68" fill={textColor} letterSpacing="-2">
            tarapti
          </text>
          <text x="0" y="126" fontFamily="'Inter', system-ui, -apple-system, sans-serif" fontWeight="500" fontSize="18" fill={textColor} opacity="0.7" textLength="210" lengthAdjust="spacingAndGlyphs">
            learn and grow together
          </text>
        </g>
      )}
    </svg>
  </div>
);
"""

components['LanguageSelector.tsx'] = """import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'ms', name: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'th', name: 'ภาษาไทย', flag: '🇹🇭' },
  { code: 'fil', name: 'Filipino', flag: '🇵🇭' },
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' }
];

export const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('i18nextLng', code);
    setIsOpen(false);
  };

  const currentLang = languages.find(l => l.code === i18n.language) || languages[1];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold transition-all"
      >
        <span className="text-sm">{currentLang.flag}</span>
        <span className="hidden sm:inline text-slate-700 dark:text-slate-300">{currentLang.code.toUpperCase()}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
          <div className="px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Select Language
          </div>
          {languages.map((n) => (
            <button
              key={n.code}
              onClick={() => changeLanguage(n.code)}
              className={`flex items-center justify-between w-full px-3.5 py-2 text-xs font-semibold transition-all ${
                i18n.language === n.code
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-base">{n.flag}</span>
                <span>{n.name}</span>
              </div>
              {i18n.language === n.code && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
"""

components['Leaderboard.tsx'] = """import React from 'react';
import { Award, TrendingUp, Trophy, Flame } from 'lucide-react';
import { useApp } from './AppContext';

export const Leaderboard: React.FC = () => {
  const { viewUserProfile } = useApp();

  const traders = [
    { id: 'u2', name: 'Budi Santoso', handle: '@buditrader', winRate: '78%', pnl: '+$14,250', rank: 1, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
    { id: 'u3', name: 'Siti Rahma', handle: '@siti_fx', winRate: '74%', pnl: '+$11,800', rank: 2, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
    { id: 'u4', name: 'Dian Kusuma', handle: '@dian_crypto', winRate: '71%', pnl: '+$9,400', rank: 3, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' },
    { id: 'u5', name: 'Eko Prasetyo', handle: '@ekopro', winRate: '68%', pnl: '+$8,100', rank: 4, avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150' }
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h3 className="text-sm font-bold">Top Traders Minggu Ini</h3>
        </div>
        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-full">
          LIVE
        </span>
      </div>

      <div className="space-y-3">
        {traders.map((trader) => (
          <div
            key={trader.id}
            onClick={() => viewUserProfile(trader.id)}
            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
          >
            <div className="flex items-center space-x-3">
              <div className="relative">
                <img src={trader.avatar} alt={trader.name} className="w-9 h-9 rounded-full object-cover" />
                <span className={`absolute -top-1 -left-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black text-white ${
                  trader.rank === 1 ? 'bg-amber-500' : trader.rank === 2 ? 'bg-slate-400' : trader.rank === 3 ? 'bg-amber-700' : 'bg-slate-600'
                }`}>
                  {trader.rank}
                </span>
              </div>
              <div>
                <h4 className="text-xs font-bold leading-tight">{trader.name}</h4>
                <p className="text-[10px] text-slate-500">{trader.handle}</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block">{trader.pnl}</span>
              <span className="text-[9px] text-slate-400 font-medium">Winrate {trader.winRate}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
"""

components['PostCard.tsx'] = """import React, { useState } from 'react';
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
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 shadow-xs transition-all hover:border-slate-300 dark:hover:border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => viewUserProfile(post.author?.id || 'u2')}>
          <img
            src={post.author?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
            alt={post.author?.name}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/20"
          />
          <div>
            <div className="flex items-center space-x-1.5">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">{post.author?.name || 'Trader Pro'}</h4>
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500/10" />
            </div>
            <p className="text-[10px] text-slate-500">@{post.author?.username || 'trader'} • {post.createdAt || '2 jam lalu'}</p>
          </div>
        </div>
        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Post Text Content */}
      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
        {post.content}
      </p>

      {/* Optional Chart Snippet / Tag */}
      {post.chart && (
        <div className="bg-slate-900 text-slate-100 rounded-xl p-3 space-y-2 border border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-indigo-400">{post.chart.pair}</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              post.chart.status === 'WIN' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
            }`}>
              {post.chart.status}
            </span>
          </div>
          <div className="h-16 flex items-center justify-center border-t border-slate-800 pt-2">
            <TrendingUp className="w-8 h-8 text-indigo-500 opacity-60" />
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs">
        <button onClick={toggleLike} className={`flex items-center space-x-1.5 hover:text-rose-500 transition-all ${liked ? 'text-rose-500 font-bold' : ''}`}>
          <Heart className={`w-4 h-4 ${liked ? 'fill-rose-500' : ''}`} />
          <span>{likesCount}</span>
        </button>
        <button className="flex items-center space-x-1.5 hover:text-indigo-500 transition-all">
          <MessageCircle className="w-4 h-4" />
          <span>{post.commentsCount || 4}</span>
        </button>
        <button className="flex items-center space-x-1.5 hover:text-indigo-500 transition-all">
          <Share2 className="w-4 h-4" />
          <span>Bagikan</span>
        </button>
      </div>
    </div>
  );
};
"""

components['CreatePost.tsx'] = """import React, { useState } from 'react';
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
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-4 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <span>Buat Postingan Analisa</span>
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Bagikan ide trading, setup chart, atau analisa pasar hari ini..."
            className="w-full h-32 p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          />

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold text-slate-400">PAIR:</span>
              <select
                value={pair}
                onChange={(e) => setPair(e.target.value)}
                className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
              >
                <option value="EURUSD">EURUSD</option>
                <option value="XAUUSD">XAUUSD (Gold)</option>
                <option value="BTCUSD">BTCUSD</option>
                <option value="GBPUSD">GBPUSD</option>
              </select>
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all"
            >
              Posting Sekarang
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
"""

components['Journal.tsx'] = """import React, { useState } from 'react';
import { BookOpen, Plus, TrendingUp, TrendingDown, DollarSign, Calendar, Filter } from 'lucide-react';
import { useApp } from './AppContext';

export const Journal: React.FC = () => {
  const { tradingStats } = useApp();
  const [trades, setTrades] = useState([
    { id: '1', pair: 'EURUSD', type: 'BUY', entry: '1.0820', exit: '1.0865', pnl: '+$450', date: '2024-08-26', status: 'WIN' },
    { id: '2', pair: 'XAUUSD', type: 'SELL', entry: '2510.0', exit: '2495.0', pnl: '+$1,500', date: '2024-08-25', status: 'WIN' },
    { id: '3', pair: 'GBPUSD', type: 'BUY', entry: '1.3120', exit: '1.3090', pnl: '-$300', date: '2024-08-24', status: 'LOSS' }
  ]);

  return (
    <div className="space-y-4">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Portfolio</span>
          <h4 className="text-base font-black text-slate-900 dark:text-slate-100">{tradingStats.portfolio}</h4>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">P&L Hari Ini</span>
          <h4 className="text-base font-black text-emerald-600 dark:text-emerald-400">{tradingStats.todayPL}</h4>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Win Rate</span>
          <h4 className="text-base font-black text-indigo-600 dark:text-indigo-400">{tradingStats.winRate}</h4>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 space-y-1">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Win Streak</span>
          <h4 className="text-base font-black text-amber-500">{tradingStats.streak}</h4>
        </div>
      </div>

      {/* Trade Log Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold flex items-center space-x-2">
            <BookOpen className="w-4 h-4 text-indigo-500" />
            <span>Catatan Jurnal Trading</span>
          </h3>
          <button className="px-3 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center space-x-1">
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah Posisi</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-[10px] font-black uppercase">
                <th className="pb-2">Pair</th>
                <th className="pb-2">Tipe</th>
                <th className="pb-2">Entry</th>
                <th className="pb-2">Exit</th>
                <th className="pb-2">P&L</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
              {trades.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 font-bold">{t.pair}</td>
                  <td className="py-2.5">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${t.type === 'BUY' ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600' : 'bg-rose-100 dark:bg-rose-950/50 text-rose-600'}`}>
                      {t.type}
                    </span>
                  </td>
                  <td className="py-2.5 text-slate-500">{t.entry}</td>
                  <td className="py-2.5 text-slate-500">{t.exit}</td>
                  <td className={`py-2.5 font-black ${t.status === 'WIN' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>{t.pnl}</td>
                  <td className="py-2.5">
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
"""

components['Outlook.tsx'] = """import React from 'react';
import { LineChart, TrendingUp, Globe, Clock, AlertTriangle } from 'lucide-react';

export const Outlook: React.FC = () => {
  const events = [
    { time: '19:30 WIB', currency: 'USD', title: 'US Core PCE Price Index', impact: 'HIGH', forecast: '0.2%', previous: '0.2%' },
    { time: '21:00 WIB', currency: 'USD', title: 'Michigan Consumer Sentiment', impact: 'MEDIUM', forecast: '67.8', previous: '66.4' },
    { time: '23:00 WIB', currency: 'EUR', title: 'ECB President Lagarde Speech', impact: 'HIGH', forecast: '-', previous: '-' }
  ];

  return (
    <div className="space-y-4">
      {/* Kalender Ekonomi */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold flex items-center space-x-2">
            <Globe className="w-4 h-4 text-indigo-500" />
            <span>Kalender Ekonomi Hari Ini</span>
          </h3>
          <span className="text-[10px] text-slate-400 font-semibold">GMT+7 Jakarta</span>
        </div>

        <div className="space-y-2">
          {events.map((ev, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center space-x-3">
                <span className="font-mono font-bold text-slate-500 text-[11px]">{ev.time}</span>
                <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 font-black text-[10px]">{ev.currency}</span>
                <span className="font-semibold">{ev.title}</span>
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
"""

components['Profile.tsx'] = """import React from 'react';
import { User, MapPin, Calendar, Award, Edit3 } from 'lucide-react';
import { useApp } from './AppContext';

export const Profile: React.FC = () => {
  const { currentUser } = useApp();

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
        <img
          src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
          alt="Avatar"
          className="w-20 h-20 rounded-full object-cover ring-4 ring-indigo-500/20"
        />
        <div className="text-center sm:text-left space-y-1">
          <h2 className="text-lg font-black">{currentUser?.firstName} {currentUser?.lastName}</h2>
          <p className="text-xs text-slate-500">@{currentUser?.username}</p>
          <div className="flex items-center justify-center sm:justify-start space-x-3 text-[11px] text-slate-400 pt-1">
            <span className="flex items-center space-x-1"><MapPin className="w-3.5 h-3.5" /><span>{currentUser?.location || 'Jakarta'}</span></span>
            <span className="flex items-center space-x-1"><Calendar className="w-3.5 h-3.5" /><span>Joined Jan 2024</span></span>
          </div>
        </div>
      </div>
      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-4">
        {currentUser?.bio || 'Forex & Commodities swing trader. Risk manager first.'}
      </p>
    </div>
  );
};
"""

components['Account.tsx'] = Profile
components['UserProfile.tsx'] = Profile
components['Messages.tsx'] = () => <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold">Pesan & Diskusi Direct Trader</div>;
components['Notifications.tsx'] = () => <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs font-bold">Notifikasi Pasar & Komunitas</div>;
components['AdminPortal.tsx'] = () => <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 text-xs font-bold">System Admin Console Tarapti</div>;
components['AdminLogin.tsx'] = () => <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 text-xs font-bold">Admin Login Portal</div>;
components['ConnectModal.tsx'] = () => null;
components['GroupView.tsx'] = () => null;

os.makedirs('/app/applet/src/components', exist_ok=True)

for name, content in components.items():
  if callable(content):
    continue
  path = os.path.join('/app/applet/src/components', name)
  with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
  print(f"Restored component {name}")

print("All components written successfully!")
