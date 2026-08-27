import React, { useState, useEffect } from 'react';
import { useApp } from './components/AppContext.tsx';
import { useTranslation } from 'react-i18next';
import {
  Home,
  Users,
  BookOpen,
  LineChart,
  User,
  Bell,
  MessageSquare,
  Shield,
  Plus,
  Sparkles,
  TrendingUp,
  Search,
  Filter,
  Flame,
  Globe,
  Award,
  ChevronRight,
  LogOut,
  RefreshCw
} from 'lucide-react';

import { Network } from './components/Network.tsx';
import { Journal } from './components/Journal.tsx';
import { Outlook } from './components/Outlook.tsx';
import { Profile } from './components/Profile.tsx';
import { Account } from './components/Account.tsx';
import { Leaderboard } from './components/Leaderboard.tsx';
import { Messages } from './components/Messages.tsx';
import { Notifications } from './components/Notifications.tsx';
import { ConnectModal } from './components/ConnectModal.tsx';
import { UserProfile } from './components/UserProfile.tsx';
import { AdminPortal } from './components/AdminPortal.tsx';
import { AdminLogin } from './components/AdminLogin.tsx';
import { TaraptiLogo } from './components/TaraptiLogo.tsx';
import { LanguageSelector } from './components/LanguageSelector.tsx';
import { CreatePost } from './components/CreatePost.tsx';
import { PostCard } from './components/PostCard.tsx';

export default function App() {
  const { t } = useTranslation();
  const {
    currentUser,
    setCurrentUser,
    activeView,
    setActiveView,
    posts,
    setPosts,
    notifications,
    toastMessage,
    selectedUserId,
    viewUserProfile
  } = useApp();

  const [isAdminView, setIsAdminView] = useState(
    window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin')
  );
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    const handlePopState = () => {
      setIsAdminView(window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin'));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToAdmin = () => {
    window.history.pushState({}, '', '/admin');
    setIsAdminView(true);
  };

  const navigateToApp = () => {
    window.history.pushState({}, '', '/');
    setIsAdminView(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('tarapti_user');
  };

  // If in admin route
  if (isAdminView) {
    if (!currentUser || currentUser.role !== 'admin') {
      return <AdminLogin onBackToApp={navigateToApp} />;
    }
    return <AdminPortal onBackToApp={navigateToApp} />;
  }

  // Sample stories data
  const stories = [
    { id: 's0', name: t('feed.yourStory', 'Story Anda'), avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', isUser: true },
    { id: 's1', name: 'Budi S.', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', pair: 'EURUSD', pnl: '+45 pips' },
    { id: 's2', name: 'Siti R.', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150', pair: 'XAUUSD', pnl: '+$1,200' },
    { id: 's3', name: 'Dian K.', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150', pair: 'BTCUSD', pnl: '+5.2%' },
    { id: 's4', name: 'Eko P.', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', pair: 'GBPUSD', pnl: '+30 pips' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col pb-20 md:pb-0">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-indigo-600 text-white px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium flex items-center space-x-2 animate-bounce">
          <Sparkles className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveView('feed')}>
            <TaraptiLogo height={36} />
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              PRO
            </span>
          </div>

          {/* Search bar */}
          <div className="hidden sm:flex items-center flex-1 max-w-md relative">
            <Search className="w-4 h-4 absolute left-3 text-slate-400" />
            <input
              type="text"
              placeholder={t('common.searchPlaceholder', 'Cari trader, analisa, atau pair...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-indigo-500 rounded-xl text-xs outline-none transition-all"
            />
          </div>

          {/* Right Header Actions */}
          <div className="flex items-center space-x-2">
            <LanguageSelector />

            <button
              onClick={() => setActiveView('notifications')}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 relative transition-all"
              title={t('common.notifications', 'Notifikasi')}
            >
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
              )}
            </button>

            <button
              onClick={() => setActiveView('messages')}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              title={t('common.messages', 'Pesan')}
            >
              <MessageSquare className="w-5 h-5" />
            </button>

            {currentUser?.role === 'admin' && (
              <button
                onClick={navigateToAdmin}
                className="p-2 rounded-xl text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-all"
                title={t('common.systemAdminConsole', 'Admin Console')}
              >
                <Shield className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={() => setActiveView('profile')}
              className="flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-800"
            >
              <img
                src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/30"
              />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-4 grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Desktop Sidebar */}
        <aside className="hidden md:block md:col-span-3 space-y-4">
          <nav className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 space-y-1 shadow-xs">
            <button
              onClick={() => setActiveView('feed')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeView === 'feed'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>{t('nav.feed', 'Trading Feed')}</span>
            </button>

            <button
              onClick={() => setActiveView('connect')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeView === 'connect'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>{t('nav.connect', 'Connect & GPS')}</span>
            </button>

            <button
              onClick={() => setActiveView('journal')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeView === 'journal'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>{t('nav.journal', 'Jurnal Trading')}</span>
            </button>

            <button
              onClick={() => setActiveView('outlook')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeView === 'outlook'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <LineChart className="w-4 h-4" />
              <span>{t('nav.outlook', 'Pasar Outlook')}</span>
            </button>

            <button
              onClick={() => setActiveView('profile')}
              className={`w-full flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeView === 'profile'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <User className="w-4 h-4" />
              <span>{t('nav.profile', 'Profil Saya')}</span>
            </button>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="col-span-1 md:col-span-9 lg:col-span-6 space-y-4">
          {activeView === 'feed' && (
            <>
              {/* Stories Bar */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex items-center space-x-3 overflow-x-auto scrollbar-none shadow-xs">
                {stories.map((story) => (
                  <div key={story.id} className="flex flex-col items-center space-y-1 cursor-pointer group flex-shrink-0">
                    <div className={`relative p-0.5 rounded-full ${story.isUser ? 'border-2 border-dashed border-indigo-500' : 'bg-gradient-to-tr from-indigo-500 to-rose-500'}`}>
                      <img src={story.avatar} alt={story.name} className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-slate-900" />
                      {story.isUser && (
                        <div className="absolute bottom-0 right-0 bg-indigo-600 text-white rounded-full p-0.5 border border-white dark:border-slate-900">
                          <Plus className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 truncate max-w-[60px]">{story.name}</span>
                  </div>
                ))}
              </div>

              {/* Create Post Box trigger */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center space-x-3">
                  <img src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} alt="Avatar" className="w-9 h-9 rounded-full object-cover" />
                  <button
                    onClick={() => setShowCreatePost(true)}
                    className="flex-1 text-left px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700/80 text-slate-500 dark:text-slate-400 rounded-xl text-xs transition-all"
                  >
                    {t('feed.postPlaceholder', 'Bagikan ide trading, setup chart, atau analisa pasar...')}
                  </button>
                  <button
                    onClick={() => setShowCreatePost(true)}
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('feed.post', 'Posting')}</span>
                  </button>
                </div>
              </div>

              {/* Feed Filters */}
              <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1">
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => setFilterCategory('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      filterCategory === 'all'
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    onClick={() => setFilterCategory('forex')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      filterCategory === 'forex'
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    Forex
                  </button>
                  <button
                    onClick={() => setFilterCategory('crypto')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      filterCategory === 'crypto'
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    Crypto
                  </button>
                  <button
                    onClick={() => setFilterCategory('gold')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      filterCategory === 'gold'
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    XAUUSD
                  </button>
                </div>
              </div>

              {/* Trading Posts Feed */}
              <div className="space-y-4">
                {posts.length > 0 ? (
                  posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))
                ) : (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-3">
                    <TrendingUp className="w-10 h-10 mx-auto text-indigo-500 opacity-60" />
                    <h3 className="text-sm font-bold">{t('feed.noPostsTitle', 'Belum Ada Feed Trading')}</h3>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      {t('feed.noPostsDesc', 'Jadilah trader pertama yang membagikan analisa teknikal atau jurnal trading hari ini.')}
                    </p>
                    <button
                      onClick={() => setShowCreatePost(true)}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-indigo-700 transition-all inline-flex items-center space-x-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Buat Postingan Baru</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {activeView === 'connect' && <Network />}
          {activeView === 'journal' && <Journal />}
          {activeView === 'outlook' && <Outlook />}
          {activeView === 'profile' && <Profile />}
          {activeView === 'account' && <Account />}
          {activeView === 'user-profile' && selectedUserId && <UserProfile userId={selectedUserId} />}
          {activeView === 'messages' && <Messages />}
          {activeView === 'notifications' && <Notifications />}
        </main>

        {/* Right Sidebar */}
        <aside className="hidden lg:block lg:col-span-3 space-y-4">
          <Leaderboard />
        </aside>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 md:hidden px-2 py-1.5 flex items-center justify-around">
        <button
          onClick={() => setActiveView('feed')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
            activeView === 'feed' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">{t('nav.feed', 'Trading Feed')}</span>
        </button>

        <button
          onClick={() => setActiveView('connect')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
            activeView === 'connect' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">{t('nav.connect', 'Connect & GPS')}</span>
        </button>

        <button
          onClick={() => setActiveView('journal')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
            activeView === 'journal' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">{t('nav.journal', 'Jurnal Trading')}</span>
        </button>

        <button
          onClick={() => setActiveView('outlook')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
            activeView === 'outlook' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <LineChart className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">{t('nav.outlook', 'Pasar Outlook')}</span>
        </button>

        <button
          onClick={() => setActiveView('profile')}
          className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
            activeView === 'profile' ? 'text-indigo-600 dark:text-indigo-400 font-bold' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">{t('nav.profile', 'Profil Saya')}</span>
        </button>
      </nav>

      {/* Create Post Modal */}
      {showCreatePost && (
        <CreatePost onClose={() => setShowCreatePost(false)} />
      )}
    </div>
  );
}
