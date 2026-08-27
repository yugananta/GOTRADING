import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Home,
  Users,
  Compass,
  BookOpen,
  LineChart,
  UserCircle,
  PlusCircle,
  Search,
  Bell,
  MessageSquare,
  Shield,
  TrendingUp,
  Sparkles,
  Plus,
  BarChart2,
  Lock
} from 'lucide-react';
import { AppProvider, useApp } from './components/AppContext';
import { Network } from './components/Network';
import { Journal } from './components/Journal';
import { Outlook } from './components/Outlook';
import { Profile } from './components/Profile';
import { Leaderboard } from './components/Leaderboard';
import { PostCard } from './components/PostCard';
import { CreatePost } from './components/CreatePost';
import { TaraptiLogo } from './components/TaraptiLogo';
import { LanguageSelector } from './components/LanguageSelector';
import { Messages } from './components/Messages';
import { Notifications } from './components/Notifications';
import { AdminPortal } from './components/AdminPortal';
import { AdminLogin } from './components/AdminLogin';

function AppContent() {
  const { t } = useTranslation();
  const {
    activeView,
    setActiveView,
    posts,
    currentUser,
    viewingUserId,
    setViewingUserId,
    unreadNotifications,
    unreadMessages
  } = useApp();

  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  // Bottom Navigation tabs with i18n keys
  const navTabs = [
    { id: 'feed', icon: <Home className="w-5 h-5" />, label: t('nav.home', 'Trading Feed') },
    { id: 'connect', icon: <Compass className="w-5 h-5" />, label: t('nav.network', 'GoTrading Network') },
    { id: 'journal', icon: <BookOpen className="w-5 h-5" />, label: t('nav.journal', 'Jurnal Trading') },
    { id: 'outlook', icon: <LineChart className="w-5 h-5" />, label: t('nav.outlook', 'Market Outlook') },
    { id: 'profile', icon: <UserCircle className="w-5 h-5" />, label: t('nav.profile', 'Profil Saya') }
  ];

  // Dummy Stories data
  const stories = [
    { id: 's1', user: 'Trading Pro', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', hasUnread: true },
    { id: 's2', user: 'Budi FX', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', hasUnread: true },
    { id: 's3', user: 'Siti Trader', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', hasUnread: false },
    { id: 's4', user: 'CryptoDian', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', hasUnread: false }
  ];

  if (activeView === 'admin') {
    return isAdminLoggedIn ? (
      <AdminPortal onBackToApp={() => setActiveView('feed')} />
    ) : (
      <AdminLogin onBackToApp={() => setActiveView('feed')} />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20 md:pb-6">
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Logo & Search */}
          <div className="flex items-center space-x-4">
            <button onClick={() => setActiveView('feed')} className="flex items-center">
              <TaraptiLogo height="38px" />
            </button>
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs w-64 border border-slate-200/60 dark:border-slate-700/60">
              <Search className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari pair, trader, atau analisa..."
                className="bg-transparent border-none outline-none w-full text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <LanguageSelector />

            <button
              onClick={() => setActiveView('notifications')}
              className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-slate-600 dark:text-slate-300"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifications > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>

            <button
              onClick={() => setActiveView('messages')}
              className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-slate-600 dark:text-slate-300"
            >
              <MessageSquare className="w-4 h-4" />
              {unreadMessages > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>

            <button
              onClick={() => setActiveView('admin')}
              className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-all text-xs font-bold flex items-center space-x-1 border border-indigo-200 dark:border-indigo-800/40"
              title="Admin Portal"
            >
              <Shield className="w-4 h-4" />
            </button>

            <button
              onClick={() => setActiveView('profile')}
              className="flex items-center space-x-2 p-1 rounded-full hover:ring-2 hover:ring-indigo-500 transition-all"
            >
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/20"
              />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 pt-4 grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Left Sidebar (Desktop Navigation) */}
        <aside className="hidden md:block md:col-span-3 lg:col-span-3 space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 space-y-1.5 shadow-xs sticky top-20">
            {navTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`flex items-center space-x-3 w-full px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                  activeView === tab.id
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}

            <button
              onClick={() => setShowCreatePost(true)}
              className="w-full mt-3 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-500/25 hover:opacity-95 transition-all flex items-center justify-center space-x-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Buat Analisa</span>
            </button>
          </div>
        </aside>

        {/* Main Content Feed Area */}
        <main className="col-span-1 md:col-span-9 lg:col-span-6 space-y-4">
          {activeView === 'feed' && (
            <>
              {/* Story Bar */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xs overflow-x-auto no-scrollbar">
                <div className="flex items-center space-x-3 min-w-max">
                  <button
                    onClick={() => setShowCreatePost(true)}
                    className="flex flex-col items-center space-y-1 text-center group"
                  >
                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-indigo-500 flex items-center justify-center bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 group-hover:scale-105 transition-all">
                      <Plus className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Story Anda</span>
                  </button>

                  {stories.map((story) => (
                    <div key={story.id} className="flex flex-col items-center space-y-1 text-center cursor-pointer group">
                      <div className={`p-0.5 rounded-full ${story.hasUnread ? 'bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-500' : 'bg-slate-200 dark:bg-slate-700'} group-hover:scale-105 transition-all`}>
                        <img
                          src={story.avatar}
                          alt={story.user}
                          className="w-11 h-11 rounded-full object-cover border-2 border-white dark:border-slate-900"
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 truncate w-14">{story.user}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Create Post Input Box */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs flex items-center space-x-3">
                <img
                  src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt="User"
                  className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-500/20"
                />
                <button
                  onClick={() => setShowCreatePost(true)}
                  className="w-full text-left px-4 py-2.5 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/70 dark:hover:bg-slate-800 rounded-xl text-xs text-slate-500 dark:text-slate-400 transition-all font-medium"
                >
                  Bagikan ide trading atau analisa pasar hari ini...
                </button>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1">
                {['ALL', 'FOREX', 'CRYPTO', 'XAUUSD (GOLD)', 'STOCKS'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Trading Posts Feed */}
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </>
          )}

          {activeView === 'connect' && <Network />}
          {activeView === 'journal' && <Journal />}
          {activeView === 'outlook' && <Outlook />}
          {activeView === 'profile' && <Profile />}
          {activeView === 'messages' && <Messages />}
          {activeView === 'notifications' && <Notifications />}
        </main>

        {/* Right Sidebar (Leaderboard & Community Stats) */}
        <aside className="hidden lg:block lg:col-span-3 space-y-4">
          <Leaderboard />
        </aside>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] z-40 px-2 py-1.5">
        <div className="max-w-md mx-auto flex justify-between items-center">
          {navTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
                activeView === tab.id
                  ? 'text-indigo-600 dark:text-indigo-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <div className={`transition-transform ${activeView === tab.id ? 'scale-110' : 'scale-100'}`}>
                {tab.icon}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Create Post Modal */}
      {showCreatePost && <CreatePost onClose={() => setShowCreatePost(false)} />}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
