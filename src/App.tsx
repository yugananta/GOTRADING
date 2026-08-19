/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { playSound } from './lib/audio';
import React, { useState, useEffect, useRef } from 'react';

// Force re-build
import { AppProvider, useApp } from './components/AppContext.tsx';
import { CreatePost } from './components/CreatePost.tsx';
import { PostCard } from './components/PostCard.tsx';
import { StoriesList } from './components/StoriesList.tsx';
import { Network } from './components/Network.tsx';
import { Explore } from './components/Explore.tsx';
import { Leaderboard } from './components/Leaderboard.tsx';
import { Messages } from './components/Messages.tsx';
import { Notifications } from './components/Notifications.tsx';
import { Profile } from './components/Profile.tsx';
import { ComingSoon } from './components/ComingSoon.tsx';
import { Account } from './components/Account.tsx';
import { Outlook } from './components/Outlook.tsx';
const MemoizedOutlook = React.memo(Outlook);
import { Journal } from './components/Journal.tsx';
import { Auth } from './components/Auth.tsx';
import { formatMessageDate, parseUTCDate } from './utils/dateUtils.ts';
import { ConnectModal } from './components/ConnectModal.tsx';
import { UserProfile } from './components/UserProfile.tsx';
import { GroupView } from './components/GroupView.tsx';
import { AdminPortal } from './components/AdminPortal.tsx';
import { AdminLogin } from './components/AdminLogin.tsx';
import { RealtimeNotificationBanner } from './components/RealtimeNotificationBanner.tsx';
import { syncPendingInteractionsOnline, getOfflineInteractions } from './utils/offlineSync.ts';
import { formatToK } from './utils/formatters.ts';
import { TaraptiLogo } from './components/TaraptiLogo.tsx';
import { SponsoredBadge } from './components/SponsoredBadge.tsx';
import { PriceAlertsWidget } from './components/PriceAlertsWidget.tsx';
import { DailyPerformanceWidget } from './components/DailyPerformanceWidget.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import { MarketWatchTicker } from './components/MarketWatchTicker.tsx';

import { LogoUpload } from "./components/LogoUpload.tsx";
// Icons
import { 
  Bell, MessageSquare, Search, ChevronRight, ChevronLeft, 
  LayoutDashboard, BookOpen, BrainCircuit, Calendar, User as UserIcon, Users,
  HelpCircle, Link, ShieldCheck, ThumbsUp, Sparkles, Activity, Handshake, Info, X, Hash,
  Pencil, Lock, Globe, TrendingUp, TrendingDown, Clock, ShieldAlert, Send, MapPin, LogOut,
  Settings, Newspaper, MoreHorizontal, ExternalLink, ChevronUp, ChevronDown, SquarePen, ArrowUp,
  Award
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area } from 'recharts';
import { AnimatePresence, motion } from 'motion/react';

type ScreenView = 'feed' | 'network' | 'leaderboard' | 'explore' | 'messages' | 'notifications' | 'profile' | 'journal' | 'account' | 'outlook' | 'user-profile' | 'admin' | 'groups';

import { poll } from './utils/polling.ts';
import { apiFetch } from './utils/apiFetch';

function MainAppLayout() {
  const { t, i18n } = useTranslation();
  const [isHeaderLangDropdownOpen, setIsHeaderLangDropdownOpen] = useState(false);
  const languages = [
    { code: 'EN', name: 'English', flag: '🇬🇧', lng: 'en' },
    { code: 'ID', name: 'Bahasa Indonesia', flag: '🇮🇩', lng: 'id' },
    { code: 'VI', name: 'Tiếng Việt', flag: '🇻🇳', lng: 'vi' },
    { code: 'TH', name: 'ภาษาไทย', flag: '🇹🇭', lng: 'th' },
  ];
  const currentLangObj = languages.find(l => l.lng === i18n.language) || languages[0];
  const { 
    currentUser, 
    setCurrentUser,
    posts, 
    setPosts,
    loadingPosts,
    fetchPosts, 
    newPostsQueue,
    flushNewPostsQueue,
    notifications,
    setNotifications,
    fetchNotifications,
    unreadNotificationsCount, 
    unreadMessagesCount,
    tradingStats,
    connectedBroker,
    toastMessage,
    setToastMessage,
    showToast,
    activeView,
    setActiveView,
    setActiveChatPartnerId,
    selectedUserId,
    viewUserProfile,
    sessions,
    markSessionAsRead,
    latestRealtimeEvent,
    clearRealtimeEvent,
    setJournalInitialTab,
    setOutlookInitialTab
  } = useApp();

  const prevLangRef = useRef<string>(i18n.language);

  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [activeView]);

  // On language change, reset query state and trigger re-fetching of dynamic content
  useEffect(() => {
    if (prevLangRef.current !== i18n.language) {
      console.log(`i18n language changed from "${prevLangRef.current}" to "${i18n.language}". Resetting query state and re-fetching...`);
      prevLangRef.current = i18n.language;
      
      // Re-invoke primary data fetch hooks
      fetchPosts();
      fetchNotifications();
    }
  }, [i18n.language, setPosts, setNotifications, fetchPosts, fetchNotifications]);

  // On user load, if they have a saved locale in profile, initialize i18n language with it
  useEffect(() => {
    if (currentUser) {
      const savedLocale = (currentUser as any).locale || (currentUser as any).language;
      if (savedLocale && savedLocale !== i18n.language) {
        console.log(`Initializing language from user profile: changing i18n to "${savedLocale}"`);
        i18n.changeLanguage(savedLocale);
        localStorage.setItem('i18nextLng', savedLocale);
      }
    }
  }, [currentUser?.id]);

  // Listen to i18n language change and persist to backend user profile
  useEffect(() => {
    if (!currentUser) return;
    
    const userLocale = (currentUser as any).locale || (currentUser as any).language;
    if (i18n.language && userLocale !== i18n.language) {
      console.log(`Syncing language preference: i18n is "${i18n.language}", user locale was "${userLocale}". Saving...`);
      
      // Update local state first for instant response
      const updatedUser = { ...currentUser, locale: i18n.language };
      setCurrentUser(updatedUser);
      localStorage.setItem('tarapti_user', JSON.stringify(updatedUser));
      
      // Persist to backend database
      apiFetch(`/api/users/profile/${currentUser.id}/language`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: i18n.language })
      })
        .then(res => {
          if (res.ok) {
            console.log("Language preference successfully persisted to backend!");
          } else {
            console.error("Failed to persist language preference:", res.statusText);
          }
        })
        .catch(err => {
          console.error("Network error while persisting language preference:", err);
        });
    }
  }, [i18n.language, currentUser?.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setGlobalSearchOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isDirectLangOpen, setIsDirectLangOpen] = useState(false);
  const [isSidebarLangOpen, setIsSidebarLangOpen] = useState(false);
  const [performanceMetric, setPerformanceMetric] = useState<string | null>(null);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTopFeedDropdownOpen, setIsTopFeedDropdownOpen] = useState(false);
  const [isMobileFeedDropdownOpen, setIsMobileFeedDropdownOpen] = useState(false);
  const [feedFilter, setFeedFilter] = useState<'latest' | 'top' | 'milestones'>('latest');
  const [searchResults, setSearchResults] = useState<{ users: any[], posts: any[] }>({ users: [], posts: [] });

  // PWA Install Event simulation
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPwaBanner, setShowPwaBanner] = useState(false);
  const [showStartupNotificationPrompt, setShowStartupNotificationPrompt] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
        setShowStartupNotificationPrompt(true);
      }
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  // Offline Sync and Notification States
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  // Market News State (mocked)
  const [marketNews, setMarketNews] = useState<any[]>([]);
  const [economicEvents, setEconomicEvents] = useState<any[]>([]);
  const [calendarImpactFilter, setCalendarImpactFilter] = useState<'all' | 'high'>('high');
  const [todayHighImpactEvents, setTodayHighImpactEvents] = useState<any[]>([]);
  const [nextUpcomingEvent, setNextUpcomingEvent] = useState<any | null>(null);
  const [eventCountdown, setEventCountdown] = useState<string>('');
  const [activeNewsTab, setActiveNewsTab] = useState<'news' | 'calendar'>('news');
  const [isMessagingExpanded, setIsMessagingExpanded] = useState(false);
  const [isMessagingNewChat, setIsMessagingNewChat] = useState(false);
  const [messagingSearchQuery, setMessagingSearchQuery] = useState('');
  const [messagingConversationSearchQuery, setMessagingConversationSearchQuery] = useState('');
  const [messagingTab, setMessagingTab] = useState<'focused' | 'unread'>('focused');
  const [messagingUsers, setMessagingUsers] = useState<any[]>([]);

  // Floating draggable chat state
  const [dragConstraints, setDragConstraints] = useState({ left: -300, right: 0, top: -600, bottom: 0 });

  useEffect(() => {
    const updateConstraints = () => {
      const padding = 16;
      const buttonSize = 56;
      setDragConstraints({
        left: -(window.innerWidth - buttonSize - padding * 2),
        right: 0,
        top: -(window.innerHeight - buttonSize - padding * 2 - 84),
        bottom: 12,
      });
    };
    updateConstraints();
    window.addEventListener('resize', updateConstraints);
    return () => window.removeEventListener('resize', updateConstraints);
  }, []);

  useEffect(() => {
    if (isMessagingNewChat) {
      apiFetch('/api/users')
        .then(r => {
          if (r.ok && r.headers.get('content-type')?.includes('application/json')) return r.json();
          return [];
        })
        .then(data => {
          if(Array.isArray(data)) setMessagingUsers(data);
        })
        .catch(console.error);
    }
  }, [isMessagingNewChat]);

  useEffect(() => {
    // Poll every 30 seconds for real-time live financial news and economic calendar updates
    const stopNewsPolling = poll<{ news: any[]; economicEvents: any[] }>(
      '/api/news',
      (data) => {
        if (data.news && Array.isArray(data.news)) setMarketNews(data.news);
        if (data.economicEvents && Array.isArray(data.economicEvents)) setEconomicEvents(data.economicEvents);
      },
      (err) => console.warn("News polling notice:", err?.message || err),
      30000
    );

    return () => stopNewsPolling();
  }, []);

  // Calculate real-time live countdown timer for high impact economic events today
  useEffect(() => {
    if (!economicEvents || economicEvents.length === 0) return;

    const updateCountdown = () => {
      const now = Date.now();
      
      // Calculate next upcoming event for general countdown
      const upcoming = economicEvents
        .filter((e: any) => e.datetime && new Date(e.datetime).getTime() > now)
        .sort((a: any, b: any) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime());

      if (upcoming.length > 0) {
        const next = upcoming[0];
        setNextUpcomingEvent(next);
        const diffMs = new Date(next.datetime).getTime() - now;
        const totalSec = Math.floor(diffMs / 1000);
        const hrs = Math.floor(totalSec / 3600);
        const mins = Math.floor((totalSec % 3600) / 60);
        const secs = totalSec % 60;

        if (hrs > 24) {
          const days = Math.floor(hrs / 24);
          const remHrs = hrs % 24;
          setEventCountdown(`${days}d ${String(remHrs).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m`);
        } else {
          setEventCountdown(`${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
        }
      } else {
        setNextUpcomingEvent(null);
        setEventCountdown('');
      }

      // Calculate all high impact events for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const highImpactToday = economicEvents
        .filter((e: any) => {
          const eDate = new Date(e.datetime);
          const isHigh = e.impact?.toLowerCase() === 'high';
          const isToday = eDate >= today && eDate < tomorrow;
          return isHigh && isToday;
        })
        .sort((a: any, b: any) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime())
        .map((e: any) => {
          const eventTime = new Date(e.datetime).getTime();
          const diffMs = eventTime - now;
          
          let countdownStr = '';
          if (diffMs <= 0) {
            countdownStr = 'Released';
          } else {
            const totalSec = Math.floor(diffMs / 1000);
            const hrs = Math.floor(totalSec / 3600);
            const mins = Math.floor((totalSec % 3600) / 60);
            const secs = totalSec % 60;

            if (hrs > 0) {
              countdownStr = `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
            } else {
              countdownStr = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
            }
          }

          return { ...e, countdown: countdownStr, isReleased: diffMs <= 0 };
        });

      setTodayHighImpactEvents(highImpactToday);
    };

    updateCountdown();
    const intervalId = setInterval(updateCountdown, 1000);
    return () => clearInterval(intervalId);
  }, [economicEvents]);

  useEffect(() => {
    import('./lib/notifications')
      .then(mod => mod.requestNotificationPermission())
      .catch(err => console.warn("Notifications are not supported or are blocked in this frame context:", err));
  }, []);

  const prevUnreadMessagesCount = useRef(unreadMessagesCount);
  const prevUnreadNotificationsCount = useRef(unreadNotificationsCount);

  useEffect(() => {
    if (unreadMessagesCount > prevUnreadMessagesCount.current) {
        playSound('telegram');
        import('./lib/notifications')
          .then(mod => mod.showNotification("New Message", "You have a new message"))
          .catch(err => console.warn("Failed to show message notification:", err));
    }
    prevUnreadMessagesCount.current = unreadMessagesCount;
  }, [unreadMessagesCount]);

  useEffect(() => {
    if (unreadNotificationsCount > prevUnreadNotificationsCount.current) {
        playSound('whatsapp');
        const latestUnread = [...notifications].reverse().find(n => !n.isRead);
        const title = "gotrading";
        const body = latestUnread ? latestUnread.message : "Anda memiliki notifikasi baru.";
        import('./lib/notifications')
          .then(mod => mod.showNotification(title, body))
          .catch(err => console.warn("Failed to show activity notification:", err));
    }
    prevUnreadNotificationsCount.current = unreadNotificationsCount;
  }, [unreadNotificationsCount, notifications]);

  // Bottom navigation visibility states on scroll
  const [isFooterVisible, setIsFooterVisible] = useState(true);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const lastScrollY = useRef(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mainRef = useRef<HTMLDivElement | null>(null);



  const refreshPendingCount = async () => {
    try {
      const list = await getOfflineInteractions();
      setPendingSyncCount(list ? list.length : 0);
    } catch (e) {
      console.warn("Could not load offline interactions count:", e);
      setPendingSyncCount(0);
    }
  };

  useEffect(() => {
    // Capture and store referral/affiliate code from the URL parameters
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const refParam = searchParams.get('ref') || searchParams.get('refCode');
      if (refParam) {
        localStorage.setItem('tarapti_referral', refParam);
        console.log('Tarapti affiliate referral code captured:', refParam);
      }
    } catch (err) {
      console.warn('Failed to parse tarapti referral query parameter:', err);
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPwaBanner(true);
    });

    // Register service worker if available
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(() => console.log('Tarapti Service Worker Synchronized.'))
        .catch(err => console.warn('Service worker registration failed:', err));
    }

    // Initial check of pending interactions to sync
    refreshPendingCount();

    const handleOnlineStatus = () => {
      const online = navigator.onLine;
      setIsOnline(online);
      if (online) {
        setToastMessage(t('common.toast.connectedSyncing'));
        syncPendingInteractionsOnline(fetchPosts)
          .then((synced) => {
            refreshPendingCount();
            if (synced) {
              setToastMessage(t('common.toast.syncSuccess'));
              setTimeout(() => setToastMessage(null), 4000);
            } else {
              setTimeout(() => setToastMessage(null), 2000);
            }
          })
          .catch((err) => console.warn("Offline sync error:", err));
      } else {
        setToastMessage(t('common.toast.offlineMode'));
        setTimeout(() => setToastMessage(null), 4000);
      }
    };

    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    // Listen to custom event fired when offline interactions are queued
    const handleOfflineInteraction = () => {
      refreshPendingCount();
      setToastMessage(t('common.toast.savedOffline'));
      setTimeout(() => setToastMessage(null), 3500);
    };
    window.addEventListener('offline-interaction-queued', handleOfflineInteraction);

    // Listen to message channel from Service Worker background sync completing
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'INTERACTIONS_SYNCED') {
        console.log('[App.tsx] Service Worker background sync completed!');
        fetchPosts();
        refreshPendingCount();
        setToastMessage(t('common.toast.backgroundSync'));
        setTimeout(() => setToastMessage(null), 3500);
      }
    };
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
      window.removeEventListener('offline-interaction-queued', handleOfflineInteraction);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, []);

  const triggerPwaInstall = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice
        .then((choice: any) => {
          if (choice.outcome === 'accepted') {
            console.log('User installed Tarapti PWA');
          }
          setDeferredPrompt(null);
          setShowPwaBanner(false);
        })
        .catch((err) => console.warn("PWA prompt error:", err));
    } else {
      showToast(t('common.toast.pwaSupported'));
    }
  };

  // Run Global search query with debounce & parallel fetching
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed.length <= 1) {
      setSearchResults({ users: [], posts: [] });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const [userRes, postRes] = await Promise.all([
          apiFetch(`/api/users?search=${encodeURIComponent(trimmed)}`),
          apiFetch(`/api/posts?search=${encodeURIComponent(trimmed)}`)
        ]);

        let userData = [];
        let postData = [];

        if (userRes.ok && userRes.headers.get('content-type')?.includes('application/json')) {
          userData = await userRes.json();
        }
        if (postRes.ok && postRes.headers.get('content-type')?.includes('application/json')) {
          postData = await postRes.json();
        }

        setSearchResults({
          users: Array.isArray(userData) ? userData : [],
          posts: Array.isArray(postData) ? postData : []
        });
      } catch (err) {
        console.error("Global search error:", err);
        setSearchResults({ users: [], posts: [] });
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle bottom navigation auto-hide and show on scroll behavior
  useEffect(() => {
    const handleScrollEvent = (e: Event) => {
      const target = e.target as HTMLElement | Document;
      let currentScrollY = 0;
      
      if (target === document) {
        currentScrollY = window.scrollY || document.documentElement.scrollTop;
      } else if (target instanceof HTMLElement) {
        currentScrollY = target.scrollTop;
      }

      const prevScrollY = lastScrollY.current;
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      // If scrolling down and we have scrolled past a minimum of 20px, hide the bottom menu.
      // If scrolling back up, show it.
      if (currentScrollY > prevScrollY && currentScrollY > 20) {
        setIsFooterVisible(false);
      } else {
        setIsFooterVisible(true);
      }

      if (currentScrollY > 400) {
        setShowScrollToTop(true);
      } else {
        setShowScrollToTop(false);
      }

      lastScrollY.current = currentScrollY;

      // When the user stops scrolling, wait 350ms and show the bottom menu again
      scrollTimeoutRef.current = setTimeout(() => {
        setIsFooterVisible(true);
      }, 350);
    };

    window.addEventListener('scroll', handleScrollEvent, { passive: true });
    
    // Also attach to main element ref since it has overflow-y-auto style
    const mainEl = mainRef.current;
    if (mainEl) {
      mainEl.addEventListener('scroll', handleScrollEvent, { passive: true });
    }

    return () => {
      window.removeEventListener('scroll', handleScrollEvent);
      if (mainEl) {
        mainEl.removeEventListener('scroll', handleScrollEvent);
      }
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [activeView]);

  const scrollToTop = () => {
    if (mainRef.current) {
      mainRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Simple URL-based routing for Admin Portal
  const [isAdminRoute, setIsAdminRoute] = useState(
    window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin')
  );

  useEffect(() => {
    const handlePopState = () => {
      setIsAdminRoute(window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin'));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateToAdmin = () => {
    window.history.pushState({}, '', '/admin');
    setIsAdminRoute(true);
  };

  const navigateToApp = () => {
    window.history.pushState({}, '', '/');
    setIsAdminRoute(false);
  };

  const handleLogout = () => {
    if (currentUser) {
      apiFetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      })
        .catch(err => console.error("Logout failed:", err))
        .finally(() => {
          setCurrentUser(null);
          try {
            localStorage.removeItem('tarapti_user');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('tarapti_connected_accounts');
            localStorage.removeItem('tarapti_broker');
            localStorage.removeItem('tarapti_active_mt_login');
          } catch {}
          setIsProfileMenuOpen(false);
        });
    }
  };
  if (window.location.pathname === "/logo-upload") {
    return <LogoUpload />;
  }

  // If we are on the admin route, we display the specialized Admin flow
  if (isAdminRoute) {
    if (!currentUser || currentUser.role !== 'admin') {
      return <AdminLogin onBackToApp={navigateToApp} />;
    }

    return (
      <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col relative overflow-x-hidden">
        {/* Admin Navigation Header Bar */}
        <header className="sticky top-0 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 z-40 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <TaraptiLogo height={60} className="-ml-1" />
            <span className="h-5 w-[1px] bg-slate-800" />
            <span className="text-xs font-black tracking-wider text-indigo-400 uppercase">{t('common.systemAdminConsole')}</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <span className="text-xs font-bold text-slate-200 block">{currentUser.firstName} {currentUser.lastName}</span>
              <span className="text-[9px] text-slate-400">@{currentUser.username} • {t('common.administrator')}</span>
            </div>
            <button
              onClick={() => {
                setCurrentUser(null);
                navigateToApp();
              }}
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-rose-950/40 hover:text-rose-400 border border-slate-700 hover:border-rose-900/50 rounded-xl text-[10px] font-bold transition-all"
            >
              {t('common.logout')}
            </button>
            <button
              onClick={navigateToApp}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-bold transition-all shadow-md shadow-indigo-600/10"
            >
              {t('common.goToTraderApp')}
            </button>
          </div>
        </header>

        {/* Dashboard Content Container (Desktop Wide Grid) */}
        <div className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-6 shadow-2xl backdrop-blur-sm animate-in fade-in zoom-in-95 duration-350">
            <AdminPortal />
          </div>
        </div>

        {/* Admin Footer */}
        <footer className="py-6 border-t border-slate-900 bg-slate-950 text-center text-[10px] text-slate-500 font-medium">
          Tarapti Corporate Networks Inc. • {t('common.authorizedSession')}
        </footer>

        {/* Premium Toast Notification overlay */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 bg-[#121620] border border-gray-800/80 text-gray-200 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 z-50 font-bold text-xs animate-in fade-in slide-in-from-bottom-5 duration-300">
            <Activity size={14} className="text-indigo-400 animate-pulse" />
            <span className="text-center">{toastMessage}</span>
          </div>
        )}
      </div>
    );
  }

  if (!currentUser) {
    return <Auth />;
  }

  const isFullWidthDesktopView = ['journal', 'outlook', 'account'].includes(activeView);

  return (
    <div className={`${activeView !== 'messages' ? 'h-screen overflow-hidden' : 'h-[100dvh] overflow-hidden'} ${activeView === 'feed' ? 'bg-[#f0f2f5]' : 'bg-white'} text-black flex flex-col font-sans w-full relative`}>
      {/* Real-time Notification Floating Banner */}
      <RealtimeNotificationBanner event={latestRealtimeEvent} onDismiss={clearRealtimeEvent} />
      
      {/* GLOBAL HEADER */}
      {activeView !== 'messages' && (
      <header className="sticky top-0 bg-white border-b border-slate-200 z-50 shrink-0 shadow-sm">
        <MarketWatchTicker />
        {isTopFeedDropdownOpen && (
          <div className="fixed inset-0 bg-black/[0.02] z-30" onClick={() => setIsTopFeedDropdownOpen(false)} />
        )}
        {isMobileFeedDropdownOpen && (
          <div className="fixed inset-0 bg-black/[0.02] z-30" onClick={() => setIsMobileFeedDropdownOpen(false)} />
        )}
        <div className={`w-full ${isFullWidthDesktopView ? 'max-w-[1480px]' : 'max-w-[1350px]'} mx-auto px-2 sm:px-4 py-1`}>
        
        {/* Top Header Row: Branding + Web Nav centered, Action Tray on Right */}
        <div className="flex items-center justify-between w-full relative gap-2 sm:gap-4">
          <div className="flex items-center shrink-0 h-[72px]">
            <TaraptiLogo height={68} className="cursor-pointer" />
          </div>

          {/* DESKTOP ONLY: Navigation Menu in Header Center */}
          <nav className="hidden md:flex items-center justify-center gap-2 lg:gap-3 text-xs font-bold text-slate-500 select-none absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 z-40">
              {[
                { id: 'feed', label: t('nav.feed'), isDropdown: true },
                { id: 'network', label: t('nav.network') },
                { id: 'groups', label: t('nav.community'), isCommunity: true }
              ].map(tab => {
                if (tab.isDropdown) {
                  const isFeedActive = activeView === 'feed' || activeView === 'journal' || activeView === 'outlook' || activeView === 'account' || activeView === 'leaderboard';
                  return (
                    <div 
                      key={tab.id} 
                      className="relative pb-0.5"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsTopFeedDropdownOpen(!isTopFeedDropdownOpen);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shrink-0 transition-all duration-300 select-none cursor-pointer ${
                          isFeedActive
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white font-extrabold shadow-sm ring-1 ring-indigo-400/50 scale-[1.02]'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 font-bold'
                        }`}
                      >
                        <span className="relative">{tab.label}</span>
                        <ChevronDown size={12} className={`transition-transform duration-200 ${isTopFeedDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {isTopFeedDropdownOpen && (
                          <>
                            <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsTopFeedDropdownOpen(false)} />
                            <motion.div 
                              initial={{ opacity: 0, y: -8, scale: 0.95, x: "-50%" }}
                              animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
                              exit={{ opacity: 0, y: -8, scale: 0.95, x: "-50%" }}
                              transition={{ duration: 0.15, ease: "easeOut" }}
                              className="absolute left-1/2 top-full mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-2 overflow-hidden text-left"
                            >
                              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 text-left">
                                Pilih Menu Feed
                              </div>
                              <button
                                onClick={() => {
                                  setIsTopFeedDropdownOpen(false);
                                  setFeedFilter('latest');
                                  setActiveView('feed');
                                }}
                                className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2.5 transition cursor-pointer"
                              >
                                <div className="w-2 h-2 rounded-full bg-blue-600" />
                                <span>Feed Utama</span>
                              </button>
                              <button
                                onClick={() => {
                                  setIsTopFeedDropdownOpen(false);
                                  setActiveView('account');
                                }}
                                className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2.5 transition cursor-pointer"
                              >
                                <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                <span>Connect MetaTrader</span>
                              </button>
                              <button
                                onClick={() => {
                                  setIsTopFeedDropdownOpen(false);
                                  setActiveView('leaderboard');
                                }}
                                className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2.5 transition cursor-pointer"
                              >
                                <div className="w-2 h-2 rounded-full bg-rose-500" />
                                <span>{t('nav.leaderboard')}</span>
                              </button>
                              <button
                                onClick={() => {
                                  setIsTopFeedDropdownOpen(false);
                                  setJournalInitialTab('goals');
                                  setActiveView('journal');
                                }}
                                className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2.5 transition cursor-pointer"
                              >
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <span>Portofolio</span>
                              </button>
                              <button
                                onClick={() => {
                                  setIsTopFeedDropdownOpen(false);
                                  setJournalInitialTab('ledger');
                                  setActiveView('journal');
                                }}
                                className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2.5 transition cursor-pointer"
                              >
                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                <span>Trading Journal</span>
                              </button>
                              <button
                                onClick={() => {
                                  setIsTopFeedDropdownOpen(false);
                                  setJournalInitialTab('history');
                                  setActiveView('journal');
                                }}
                                className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2.5 transition cursor-pointer"
                              >
                                <div className="w-2 h-2 rounded-full bg-purple-500" />
                                <span>AI Analysis</span>
                              </button>
                              <button
                                onClick={() => {
                                  setIsTopFeedDropdownOpen(false);
                                  setOutlookInitialTab('news');
                                  setActiveView('outlook');
                                }}
                                className="w-full text-left px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2.5 transition cursor-pointer"
                              >
                                <div className="w-2 h-2 rounded-full bg-amber-500" />
                                <span>News & Calendar</span>
                              </button>
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }

                const isActive = activeView === tab.id || (tab.isCommunity && activeView === 'groups');
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (tab.id === 'admin') {
                        navigateToAdmin();
                      } else {
                        setActiveView(tab.id as any);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shrink-0 transition-all duration-300 select-none cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white font-extrabold shadow-sm ring-1 ring-indigo-400/50 scale-[1.02]'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 font-bold'
                    }`}
                  >
                    <span className="relative">
                      {tab.label}
                      {tab.isCommunity && !isActive && (
                        <span className="absolute -top-1 -right-2 text-rose-500 font-black text-xs leading-none select-none animate-pulse">*</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </nav>

          {/* Right Header Tray */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="flex items-center gap-1 sm:gap-2.5 w-full md:w-auto justify-end">
              
              {/* Web: Search Input Bar */}
              <input 
                type="text"
                placeholder={`${t('nav.search')}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setGlobalSearchOpen(true)}
                className="hidden md:block bg-slate-100 border border-slate-200/80 rounded-full px-3 py-1.5 text-xs text-slate-900 w-44 lg:w-56 shadow-2xs mr-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              />

              {/* Mobile: Icon-only Search */}
              <div 
                onClick={() => setGlobalSearchOpen(true)}
                className="flex md:hidden items-center justify-center bg-slate-100 hover:bg-slate-200/80 border border-slate-200/80 rounded-full w-7 h-7 text-slate-500 cursor-pointer transition shadow-3xs"
                title={t('nav.search')}
              >
                <Search size={14} className="text-slate-500" />
              </div>

              {/* Message, Notification, Language */}
              <div className="flex items-center gap-0.5 xs:gap-1 shrink-0">
                <button 
                  onClick={() => setActiveView('messages')}
                  className="p-1 hover:bg-slate-200/80 rounded-full transition text-slate-500 hover:text-slate-900 relative cursor-pointer"
                  title={t('nav.messages')}
                >
                  <MessageSquare size={17} />
                </button>

                <button 
                  onClick={() => setActiveView('notifications')}
                  className="p-1 hover:bg-slate-200/80 rounded-full transition text-slate-500 hover:text-slate-900 relative cursor-pointer"
                  title={t('nav.notifications')}
                >
                  <Bell size={17} />
                  {unreadNotificationsCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-rose-600 text-white text-[7px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center animate-pulse">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </button>

                {/* Language Flag Selector Icon */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsDirectLangOpen(!isDirectLangOpen)}
                    className="p-1 hover:bg-slate-200/80 rounded-full transition text-slate-600 hover:text-slate-900 flex items-center justify-center text-sm cursor-pointer"
                    title={`Ganti Bahasa / Change Language: ${currentLangObj.name}`}
                  >
                    <span>{currentLangObj.flag}</span>
                  </button>

                  <AnimatePresence>
                    {isDirectLangOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsDirectLangOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 8 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 8 }}
                          className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 overflow-hidden py-1"
                        >
                          <div className="px-3 py-1.5 border-b border-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Pilih Bahasa
                          </div>
                          {languages.map((lang) => {
                            const isSelected = i18n.language === lang.lng;
                            return (
                              <button
                                key={lang.lng}
                                onClick={() => {
                                  i18n.changeLanguage(lang.lng);
                                  localStorage.setItem('i18nextLng', lang.lng);
                                  setIsDirectLangOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition cursor-pointer ${
                                  isSelected ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-sm shrink-0">{lang.flag}</span>
                                  <span className="font-bold text-[10px] text-slate-400">{lang.lng.toUpperCase()}</span>
                                  <span>{lang.name}</span>
                                </div>
                              </button>
                            );
                          })}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
                
              {/* Profile Avatar Button */}
              <div className="ml-2 sm:ml-4 pl-2 sm:pl-3 border-l border-slate-200/80 flex items-center">
                <div className="relative flex items-center justify-center">
                  <button 
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="w-8 h-8 rounded-full bg-indigo-600 text-white font-black flex items-center justify-center text-xs shadow-md border-2 border-white overflow-hidden hover:scale-105 transition shrink-0 cursor-pointer"
                    title="Profile / Profil"
                  >
                    {currentUser?.avatar && currentUser.avatar.length > 2 ? (
                      <img src={currentUser.avatar} className="w-full h-full object-cover" alt="Avatar" referrerPolicy="no-referrer" />
                    ) : (
                      currentUser?.avatar || "👤"
                    )}
                  </button>

                  <AnimatePresence>
                    {isProfileMenuOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-40" 
                          onClick={() => setIsProfileMenuOpen(false)}
                        />
                        
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 10 }}
                          className="absolute top-[calc(100%+12px)] right-0 w-44 bg-white rounded-xl shadow-lg border border-slate-100 z-50 overflow-hidden"
                        >
                          <div className="p-1.5">
                            <button
                              onClick={() => {
                                setActiveView('profile');
                                setIsProfileMenuOpen(false);
                              }}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50 hover:text-indigo-600 rounded-xl transition cursor-pointer"
                            >
                              <UserIcon size={14} />
                              Edit Profile
                            </button>
                            
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center gap-2.5 px-3 py-2 text-[11px] font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                            >
                              <LogOut size={14} />
                              Logout
                            </button>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* MOBILE ONLY: Navigation Row (hidden on md and above) */}
        <div className="md:hidden pt-1.5 pb-0.5 relative flex justify-center w-full">
          <div className="overflow-x-auto no-scrollbar flex justify-center w-full">
            <nav className="flex items-center justify-center gap-2 text-xs font-bold text-slate-500 select-none mx-auto">
              {[
                { id: 'feed', label: t('nav.feed'), isDropdown: true },
                { id: 'network', label: t('nav.network') },
                { id: 'groups', label: t('nav.community'), isCommunity: true }
              ].map(tab => {
                if (tab.isDropdown) {
                  const isFeedActive = activeView === 'feed' || activeView === 'journal' || activeView === 'outlook' || activeView === 'account' || activeView === 'leaderboard';
                  return (
                    <div key={tab.id} className="relative">
                      <button
                        onClick={() => {
                          setIsMobileFeedDropdownOpen(!isMobileFeedDropdownOpen);
                          setActiveView('feed');
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shrink-0 transition-all duration-300 select-none cursor-pointer ${
                          isFeedActive
                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white font-extrabold shadow-sm ring-1 ring-indigo-400/50 scale-[1.02]'
                            : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 font-bold'
                        }`}
                      >
                        <span className="relative">{tab.label}</span>
                        <ChevronDown size={12} className={`transition-transform duration-200 ${isMobileFeedDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  );
                }

                const isActive = activeView === tab.id || (tab.isCommunity && activeView === 'groups');
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      if (tab.id === 'admin') {
                        navigateToAdmin();
                      } else {
                        setActiveView(tab.id as any);
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 shrink-0 transition-all duration-300 select-none cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white font-extrabold shadow-sm ring-1 ring-indigo-400/50 scale-[1.02]'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100 font-bold'
                    }`}
                  >
                    <span className="relative">
                      {tab.label}
                      {tab.isCommunity && !isActive && (
                        <span className="absolute -top-1 -right-2 text-rose-500 font-black text-xs leading-none select-none animate-pulse">*</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Unclipped Dropdown Popup for Mobile Feed Sub-Menu */}
          <AnimatePresence>
            {isMobileFeedDropdownOpen && (
              <>
                <div className="fixed inset-0 bg-black/10 z-40" onClick={() => setIsMobileFeedDropdownOpen(false)} />
                <motion.div 
                  initial={{ opacity: 0, y: -5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -5, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute left-0 top-full mt-1.5 w-60 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 py-2 text-left"
                >
                  <div className="px-3.5 py-1.5 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
                    <span>Pilih Menu Feed</span>
                    <span className="text-[9px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md font-bold">Sub-Menu</span>
                  </div>
                  <button
                    onClick={() => {
                      setIsMobileFeedDropdownOpen(false);
                      setActiveView('feed');
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                    <span>Feed Utama</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileFeedDropdownOpen(false);
                      setActiveView('account');
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shrink-0" />
                    <span>Connect MetaTrader</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileFeedDropdownOpen(false);
                      setActiveView('leaderboard');
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                    <span>{t('nav.leaderboard')}</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileFeedDropdownOpen(false);
                      setJournalInitialTab('goals');
                      setActiveView('journal');
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>Portofolio</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileFeedDropdownOpen(false);
                      setJournalInitialTab('ledger');
                      setActiveView('journal');
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                    <span>Trading Journal</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileFeedDropdownOpen(false);
                      setJournalInitialTab('history');
                      setActiveView('journal');
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
                    <span>AI Analysis</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsMobileFeedDropdownOpen(false);
                      setOutlookInitialTab('news');
                      setActiveView('outlook');
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2.5 transition cursor-pointer"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                    <span>News & Calendar</span>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

      </div>
      </header>
      )}

      {/* Offline Status Alert bar */}
      {!isOnline && (
        <div className="bg-amber-600/10 border-b border-amber-500/25 px-4 py-2 flex items-center justify-between text-amber-400 select-none shrink-0 animate-in slide-in-from-top duration-200 max-w-7xl mx-auto w-full">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Offline Mode Active</span>
          </div>
          {pendingSyncCount > 0 && (
            <span className="text-[9px] font-bold bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
              {pendingSyncCount} action{pendingSyncCount > 1 ? 's' : ''} queued
            </span>
          )}
        </div>
      )}

      {/* PWA INSTALLATION BANNER */}
      {showPwaBanner && (
        <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 p-3 mx-4 lg:mx-auto lg:max-w-7xl lg:w-[calc(100%-2rem)] rounded-2xl border border-indigo-500/20 flex items-center justify-between mb-4 mt-4 shadow-lg shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-indigo-400 animate-spin" />
            <div className="text-[10px]">
              <span className="font-bold text-white block">Install gotrading</span>
              <span className="text-gray-300">Enjoy real-time offline capabilities and instant updates.</span>
            </div>
          </div>
          <button
            onClick={triggerPwaInstall}
            className="px-3 py-1 bg-white hover:bg-gray-100 text-indigo-950 font-bold text-[9px] rounded-lg transition"
          >
            Install
          </button>
        </div>
      )}

      {/* GLOBAL SEARCH OVERLAY MODAL */}
      {globalSearchOpen && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm z-50 flex flex-col p-4">
          <div className="bg-white dark:bg-[#121620] border border-slate-200 dark:border-gray-800 rounded-2xl w-full max-w-md mx-auto flex flex-col max-h-[85vh] shadow-2xl overflow-hidden mt-12 animate-in fade-in slide-in-from-top-4">
            
            <div className="p-4 border-b border-slate-100 dark:border-gray-800/80 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Search size={14} className="text-indigo-600 dark:text-indigo-400" />
                Global Search Engine
              </span>
              <button onClick={() => { setGlobalSearchOpen(false); setSearchQuery(''); }} className="text-slate-400 hover:text-slate-600 dark:text-gray-400 dark:hover:text-white transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-4">
              <input
                type="text"
                autoFocus
                placeholder="Search across traders, posts, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#181D28] border border-slate-200 dark:border-gray-800 text-slate-900 dark:text-white rounded-xl px-3.5 py-2.5 text-xs placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
              {searchQuery.trim().length <= 1 ? (
                <p className="text-[10px] text-slate-400 dark:text-gray-500 text-center py-8 italic">Type at least 2 characters to trigger scan...</p>
              ) : (
                <>
                  {/* Users search results */}
                  {searchResults.users.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[9px] font-bold text-slate-400 dark:text-gray-400 uppercase tracking-widest block">Matched Traders</span>
                      <div className="grid grid-cols-1 gap-2">
                        {searchResults.users.map((u: any) => (
                          <div 
                            key={u.id}
                            onClick={() => { viewUserProfile(u.id); setGlobalSearchOpen(false); setSearchQuery(''); }}
                            className="p-2.5 bg-slate-50 dark:bg-[#181D28] border border-slate-200/80 dark:border-gray-800 rounded-xl flex items-center gap-2.5 cursor-pointer hover:border-indigo-300 dark:hover:border-gray-700 transition"
                          >
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                              {u.avatar && u.avatar.startsWith('http') ? (
                                <img src={u.avatar} alt={u.firstName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              ) : (
                                <span>{(u.firstName?.[0] || 'U').toUpperCase()}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight truncate">{u.firstName} {u.lastName}</span>
                              <div className="flex items-center gap-1.5 text-[9px] text-slate-500 dark:text-gray-400 mt-0.5">
                                <span className="truncate font-medium">@{u.username}</span>
                                {u.city && <span className="opacity-60">• {u.city}</span>}
                                {u.tradingAsset && <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 px-1 rounded text-[8px] font-bold">{u.tradingAsset}</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Posts search results */}
                  {searchResults.posts.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-[9px] font-bold text-slate-400 dark:text-gray-400 uppercase tracking-widest block">Matched Trading Posts</span>
                      <div className="space-y-2">
                        {searchResults.posts.map((p: any) => (
                          <div 
                            key={p.id}
                            onClick={() => { setActiveView('feed'); setGlobalSearchOpen(false); }}
                            className="p-3 bg-slate-50 dark:bg-[#181D28] border border-slate-200/80 dark:border-gray-800 rounded-xl cursor-pointer hover:border-indigo-300 dark:hover:border-gray-700 transition"
                          >
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-[10px] font-bold text-slate-900 dark:text-white">{p.authorName}</span>
                              <span className="text-[8px] text-slate-500 dark:text-gray-400">@{p.authorUsername}</span>
                            </div>
                            <p className="text-[10px] text-slate-600 dark:text-gray-300 line-clamp-2 leading-relaxed">{p.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {searchResults.users.length === 0 && searchResults.posts.length === 0 && (
                    <p className="text-[10px] text-slate-400 dark:text-gray-500 text-center py-8">No results found for "{searchQuery}"</p>
                  )}
                </>
              )}
            </div>

          </div>
        </div>
      )}

      {/* MAIN SCREEN PANELS */}
      
      {/* WEB DESKTOP LAYOUT WRAPPER */}
      <div className={`flex-1 w-full ${isFullWidthDesktopView ? 'max-w-[1480px]' : 'max-w-[1350px]'} mx-auto flex justify-center items-start lg:gap-6 md:gap-4 overflow-hidden ${activeView !== 'messages' ? 'lg:pt-0.5 md:pt-0.5 lg:px-6 md:px-4' : ''}`}>
        
        {/* LEFT SIDEBAR (Web Desktop Only) */}
        {activeView !== 'messages' && (
          <aside className="hidden md:flex flex-col w-[260px] lg:w-[280px] shrink-0 gap-4 overflow-y-auto no-scrollbar pb-10">
            
            {/* Profile Summary Card */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, type: "spring", stiffness: 200, damping: 20 }}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm"
            >
              <div className="h-16 bg-gradient-to-r from-indigo-500 to-purple-600 relative overflow-hidden">
                {(currentUser?.coverPhoto || currentUser?.cover_photo) ? (
                  <img
                    src={currentUser.coverPhoto || currentUser.cover_photo}
                    alt="Cover background"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : null}
              </div>
              <div className="px-4 pb-4 relative flex flex-col items-center text-center border-b border-slate-100">
                <div className="w-16 h-16 rounded-full bg-indigo-600 text-white font-black flex items-center justify-center text-2xl shadow-md border-4 border-white -mt-8 mb-2 cursor-pointer overflow-hidden" onClick={() => setActiveView('profile')}>
                  {currentUser?.avatar && currentUser.avatar.length > 2 ? (
                    <img src={currentUser.avatar} className="w-full h-full object-cover" alt="Avatar" referrerPolicy="no-referrer" />
                  ) : (
                    currentUser?.avatar || "👤"
                  )}
                </div>

                {/* Compact Language Selector exactly under profile photo */}
                <div className="relative mb-2">
                  <button 
                    onClick={() => setIsSidebarLangOpen(!isSidebarLangOpen)}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full text-[10px] font-bold text-slate-700 cursor-pointer shadow-3xs transition hover:border-slate-300"
                    title="Ganti Bahasa / Change Language"
                  >
                    <span>{currentLangObj.flag}</span>
                    <span className="uppercase text-slate-600 tracking-wider text-[9px]">{currentLangObj.code}</span>
                    <ChevronDown size={10} className={`text-slate-400 transition-transform ${isSidebarLangOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  <AnimatePresence>
                    {isSidebarLangOpen && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setIsSidebarLangOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: 4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: 4 }}
                          className="absolute left-1/2 -translate-x-1/2 mt-1 w-36 bg-white border border-slate-150 rounded-lg shadow-lg z-45 py-1 text-left overflow-hidden"
                        >
                          {languages.map((lang) => {
                            const isSelected = i18n.language === lang.lng;
                            return (
                              <button
                                key={lang.lng}
                                onClick={() => {
                                  i18n.changeLanguage(lang.lng);
                                  localStorage.setItem('i18nextLng', lang.lng);
                                  setIsSidebarLangOpen(false);
                                }}
                                className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-[10px] font-bold transition text-left cursor-pointer ${
                                  isSelected ? 'bg-indigo-50 text-indigo-700 font-extrabold' : 'text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                <span className="text-xs shrink-0">{lang.flag}</span>
                                <span className="truncate">{lang.name}</span>
                              </button>
                            );
                          })}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                <h3 className="font-bold text-slate-900 leading-tight hover:underline cursor-pointer" onClick={() => setActiveView('profile')}>{currentUser.firstName} {currentUser.lastName}</h3>
                <p className="text-[10px] text-slate-500 mb-1">@{currentUser.username}</p>
                <p className="text-[10px] text-slate-600 line-clamp-1">{currentUser.bio || "Trading enthusiast & community member"}</p>
              </div>
              <div className="py-3 px-3 flex flex-col gap-2">
                <div className="flex items-center justify-between group cursor-pointer" onClick={() => setActiveView('network')}>
                  <span className="text-[10px] font-medium text-slate-500 group-hover:underline">Profile viewers</span>
                  <span className="text-[10px] font-bold text-indigo-600">124</span>
                </div>
                <div className="flex items-center justify-between group cursor-pointer" onClick={() => setActiveView('feed')}>
                  <span className="text-[10px] font-medium text-slate-500 group-hover:underline">Post impressions</span>
                  <span className="text-[10px] font-bold text-indigo-600">842</span>
                </div>
              </div>
              <div className="p-3 border-t border-slate-100 hover:bg-slate-50 cursor-pointer transition" onClick={() => setActiveView('profile')}>
                <span className="text-[10px] font-bold text-slate-900">Premium Features</span>
                <p className="text-[9px] text-slate-500">Access exclusive trading insights</p>
              </div>
            </motion.div>

            {/* Main Navigation Menu */}
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: { staggerChildren: 0.08, delayChildren: 0.15 }
                }
              }}
              className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex flex-col gap-1.5"
            >
              <motion.button 
                variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } }}
                onClick={() => setActiveView('feed')} 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group active:scale-95 ${activeView === 'feed' ? 'bg-indigo-50 text-indigo-600 font-bold shadow-sm ring-1 ring-indigo-500/10' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:translate-x-1'}`}
              >
                <LayoutDashboard size={18} className={`transition-transform duration-200 ${activeView === 'feed' ? 'scale-110' : 'group-hover:scale-110 group-hover:text-indigo-500'}`} />
                <span className="text-sm">{t('nav.feed')}</span>
              </motion.button>
              
              <motion.button 
                variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } }}
                onClick={() => setActiveView('journal')} 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group active:scale-95 relative ${activeView === 'journal' ? 'bg-indigo-50 text-indigo-600 font-bold shadow-sm ring-1 ring-indigo-500/10' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:translate-x-1'}`}
              >
                <BookOpen size={18} className={`transition-transform duration-200 ${activeView === 'journal' ? 'scale-110' : 'group-hover:scale-110 group-hover:text-indigo-500'}`} />
                <span className="text-sm">{t('nav.journal')}</span>
                <div className="absolute right-3 bg-rose-500 text-white rounded-full p-[2px] shadow-sm transition-transform duration-200 group-hover:scale-110"><Lock size={10} /></div>
              </motion.button>

              <motion.button 
                variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } }}
                onClick={() => setActiveView('groups')} 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group active:scale-95 ${
                  activeView === 'groups' 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold shadow-md ring-1 ring-purple-400/40' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:translate-x-1'
                }`}
              >
                <MapPin size={18} className={`transition-transform duration-200 group-hover:scale-110 shrink-0 ${activeView === 'groups' ? 'text-white fill-white/20' : 'text-red-500 fill-red-500/20'}`} />
                <span className="text-sm flex items-center gap-1 font-bold">
                  {t('nav.community')}
                  {activeView !== 'groups' && (
                    <span className="text-rose-500 font-black text-xs leading-none select-none animate-pulse">*</span>
                  )}
                </span>
                {activeView === 'groups' && (
                  <span className="ml-auto text-[9px] font-extrabold bg-white/20 text-white px-2 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                    Group
                  </span>
                )}
              </motion.button>

              <motion.button 
                variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } }}
                onClick={() => setActiveView('account')} 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group active:scale-95 ${activeView === 'account' ? 'bg-indigo-50 text-indigo-600 font-bold shadow-sm ring-1 ring-indigo-500/10' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:translate-x-1'}`}
              >
                <ShieldCheck size={18} className={`transition-transform duration-200 ${activeView === 'account' ? 'scale-110' : 'group-hover:scale-110 group-hover:text-indigo-500'}`} />
                <span className="text-sm">{t('nav.account')}</span>
                <span className="ml-auto text-[9px] font-extrabold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                  Partners
                </span>
              </motion.button>

              <motion.button 
                variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } }}
                onClick={() => setActiveView('outlook')} 
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group active:scale-95 relative ${activeView === 'outlook' ? 'bg-indigo-50 text-indigo-600 font-bold shadow-sm ring-1 ring-indigo-500/10' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:translate-x-1'}`}
              >
                <Globe size={18} className={`transition-transform duration-200 ${activeView === 'outlook' ? 'scale-110' : 'group-hover:scale-110 group-hover:text-indigo-500'}`} />
                <span className="text-sm">{t('nav.outlook')}</span>
              </motion.button>

              <motion.div variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } }}>
                <div className="h-px bg-slate-100 my-1 mx-2"></div>
                <button 
                  onClick={() => setActiveView('profile')} 
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group active:scale-95 ${
                    activeView === 'profile' 
                      ? 'bg-indigo-50 text-indigo-600 font-bold shadow-sm ring-1 ring-indigo-500/10' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:translate-x-1'
                  }`}
                >
                  <UserIcon size={18} className={`transition-transform duration-200 ${activeView === 'profile' ? 'scale-110' : 'group-hover:scale-110 group-hover:text-indigo-500'}`} />
                  <span className="text-sm">{t('nav.profile')}</span>
                </button>
              </motion.div>
            </motion.div>
            
          </aside>
        )}

        {/* CENTER MAIN CONTENT */}
        <main 
          ref={mainRef} 
          className={`flex-1 min-w-0 w-full ${
            isFullWidthDesktopView ? 'max-w-none' : 'max-w-[580px] lg:max-w-[650px]'
          } h-full overflow-y-auto no-scrollbar ${activeView !== 'messages' ? `lg:bg-transparent bg-white shadow-2xl lg:shadow-none border-x lg:border-none border-slate-200 pb-28 lg:pb-0 ${activeView === 'feed' ? '' : 'space-y-4'}` : 'overflow-hidden flex flex-col lg:bg-white lg:border lg:border-slate-200 lg:rounded-2xl lg:shadow-sm'}`}
        >

        
        {/* VIEW 1: HOME FEED */}
        {activeView === 'feed' && (
          <div
            className="pb-20 lg:pb-0 bg-white lg:bg-transparent lg:rounded-2xl"
          >
            <div className="bg-white lg:bg-transparent flex flex-col">
              
              <div className="flex items-center justify-between px-3.5 py-2.5 bg-white border-b border-slate-100 lg:border lg:border-slate-200 lg:rounded-2xl lg:shadow-[0_2px_8px_rgba(0,0,0,0.04)] mb-2 lg:mb-4">
                <span className="text-xs font-black uppercase text-slate-700 tracking-wider">Trading Feed</span>
                <SponsoredBadge />
              </div>

              {/* Stories */}
              <div className="mb-2 lg:mb-4 px-2 lg:px-0">
                <StoriesList />
              </div>

              {/* Create Post */}
              <div className="pb-2 bg-white lg:bg-transparent">
                <CreatePost onPostCreated={fetchPosts} />
              </div>

              {/* Feed Filter Tabs */}
              <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md border border-slate-200/85 rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.03)] p-1.5 mb-3 flex items-center justify-between gap-1 mx-2 lg:mx-0">
                <button
                  onClick={() => setFeedFilter('latest')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1.5 sm:px-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                    feedFilter === 'latest'
                      ? 'bg-indigo-50 text-indigo-600 shadow-2xs border border-indigo-100/50'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <Clock size={13} className="shrink-0" />
                  <span className="whitespace-nowrap">Latest Posts</span>
                </button>
                <button
                  onClick={() => setFeedFilter('top')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1.5 sm:px-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                    feedFilter === 'top'
                      ? 'bg-indigo-50 text-indigo-600 shadow-2xs border border-indigo-100/50'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <TrendingUp size={13} className="shrink-0" />
                  <span className="whitespace-nowrap">Top Discussions</span>
                </button>
                <button
                  onClick={() => setFeedFilter('milestones')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-1.5 sm:px-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer whitespace-nowrap ${
                    feedFilter === 'milestones'
                      ? 'bg-indigo-50 text-indigo-600 shadow-2xs border border-indigo-100/50'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
                  }`}
                >
                  <Award size={13} className="shrink-0" />
                  <span className="truncate whitespace-nowrap">Member Milestones</span>
                </button>
              </div>

              {/* Feed items list */}
              {(() => {
                const filteredPosts = (() => {
                  let feedPosts = [...posts];
                  if (feedFilter === 'top') {
                    feedPosts.sort((a, b) => ((b.likesCount || 0) + (b.commentsCount || 0)) - ((a.likesCount || 0) + (a.commentsCount || 0)));
                  } else if (feedFilter === 'milestones') {
                    feedPosts = feedPosts.filter(p => p.isOfficial || (p.content && p.content.toLowerCase().match(/milestone|achieve|target|profit|win|success|welcome|verified/)));
                  }
                  return feedPosts;
                })();

                return (
                  <>
                    <AnimatePresence>
                      {newPostsQueue && newPostsQueue.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="sticky top-0 z-10 flex justify-center pb-3"
                        >
                          <button
                            onClick={flushNewPostsQueue}
                            className="bg-indigo-600 text-white px-5 py-2 rounded-full shadow-lg shadow-indigo-600/30 text-xs font-bold flex items-center gap-2 hover:bg-indigo-700 transition active:scale-95 cursor-pointer filter drop-shadow"
                          >
                            <ArrowUp size={16} />
                            {newPostsQueue.length} {t('common.post.newPosts', 'Postingan Baru')}
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div className="space-y-3 bg-white lg:bg-transparent flex flex-col p-2 lg:p-0">
                      {loadingPosts && posts.length === 0 ? (
                        <div className="space-y-4">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 space-y-4 shadow-sm animate-pulse">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-100" />
                                <div className="space-y-2 flex-1">
                                  <div className="h-3 bg-slate-100 rounded w-24" />
                                  <div className="h-2 bg-slate-50 rounded w-16" />
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="h-3 bg-slate-100 rounded w-full" />
                                <div className="h-3 bg-slate-100 rounded w-5/6" />
                              </div>
                              <div className="h-40 bg-slate-50 rounded-xl" />
                            </div>
                          ))}
                        </div>
                      ) : filteredPosts.length === 0 ? (
                        <div className="bg-white p-12 text-center text-gray-500 text-xs rounded-2xl border border-slate-200 shadow-sm mx-2 lg:mx-0">
                          {feedFilter === 'milestones' 
                            ? 'Tidak ada milestone anggota saat ini.' 
                            : feedFilter === 'top' 
                            ? 'Tidak ada diskusi populer saat ini.' 
                            : 'Feed is empty. Be the first to share your trading setups!'}
                        </div>
                      ) : (
                        filteredPosts.map((post) => (
                          <PostCard key={post.id} post={post} onPostUpdated={() => {}} />
                        ))
                      )}
                    </div>
                  </>
                );
              })()}

            </div>
          </div>
        )}

        {/* VIEW 2: NETWORK */}
        {activeView === 'network' && (
          <div
            className="p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-black text-slate-950">{t('nav.network')}</h1>
              <SponsoredBadge />
            </div>
            <Network />
          </div>
        )}

        {/* VIEW 3: LEADERBOARD */}
        {activeView === 'leaderboard' && (
          <div
            className="p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-black text-slate-950">{t('nav.leaderboard')}</h1>
              <SponsoredBadge />
            </div>
            <Leaderboard />
          </div>
        )}

        {/* VIEW 4: COMMUNITY (GROUPS) */}
        {activeView === 'explore' && (
          <div
            className="p-4"
          >
            <GroupView key={i18n.language} onBack={() => setActiveView('feed')} />
          </div>
        )}

        {/* VIEW 5: MESSAGES */}
        {activeView === 'messages' && (
          <motion.div
            key="messages"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col h-full bg-white"
          >
            <Messages />
          </motion.div>
        )}

        {/* VIEW 6: NOTIFICATIONS */}
        {activeView === 'notifications' && (
          <motion.div
            key="notifications"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-black text-slate-950">{t('nav.notifications')}</h1>
              <SponsoredBadge />
            </div>
            <Notifications />
          </motion.div>
        )}

        {/* VIEW 7: PROFILE */}
        {activeView === 'profile' && (
          <div
            className="p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-black text-slate-950">{t('nav.profile')}</h1>
              <SponsoredBadge />
            </div>
            <Profile />
          </div>
        )}

        {/* VIEW 8: JOURNAL */}
        {activeView === 'journal' && (
          <div
            className="p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-black text-slate-950">{t('nav.journal')}</h1>
              <SponsoredBadge />
            </div>
            <Journal />
          </div>
        )}

        {/* VIEW 9: ACCOUNT */}
        {activeView === 'account' && (
          <div
            className="p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-black text-slate-950">{t('nav.account')}</h1>
              <SponsoredBadge />
            </div>
            <Account />
          </div>
        )}

        {/* VIEW 10: OUTLOOK */}
        {activeView === 'outlook' && (
          <div
            className="p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-black text-slate-950">{t('nav.outlook')}</h1>
              <SponsoredBadge />
            </div>
            <MemoizedOutlook key={i18n.language} />
          </div>
        )}

        {/* VIEW 11: USER PROFILE */}
        {activeView === 'user-profile' && selectedUserId && (
          <div
            className="p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-black text-slate-950">User Profile</h1>
              <SponsoredBadge />
            </div>
            <UserProfile userId={selectedUserId} onBack={() => setActiveView('feed')} />
          </div>
        )}

        {/* VIEW 12: ADMIN PORTAL */}
        {activeView === 'admin' && (
          <div
            className="p-4"
          >
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-black text-slate-950">Admin Portal</h1>
              <SponsoredBadge />
            </div>
            <AdminPortal />
          </div>
        )}

        {/* VIEW 13: GROUPS */}
        {activeView === 'groups' && (
          <div className="p-4">
            <GroupView key={i18n.language} onBack={() => setActiveView('feed')} />
          </div>
        )}

      
        </main>

        {/* RIGHT SIDEBAR (Web Desktop Only) */}
        {activeView !== 'messages' && !isFullWidthDesktopView && (
          <aside className="hidden lg:flex flex-col w-[280px] shrink-0 gap-4 overflow-y-auto no-scrollbar pb-10">
            
            {/* Daily Performance Widget */}
            <DailyPerformanceWidget />

            {/* Price Alerts & Broker Partners - Side by side */}
            <div className="grid grid-cols-2 gap-2">
              {/* Small Price Alert Widget */}
              <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 transition">
                <Bell size={16} className="text-indigo-500 mb-1" />
                <h4 className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Alerts</h4>
              </div>

              {/* Small Partners/Connect Widget */}
              <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm flex flex-col items-center justify-center text-center">
                <Handshake size={16} className="text-indigo-500 mb-1" />
                <h4 className="text-[9px] font-black text-slate-900 uppercase tracking-widest mb-1">Partners</h4>
                <button 
                  onClick={() => setActiveView('account')}
                  className="bg-indigo-600 text-white text-[9px] font-black px-2 py-1 rounded-lg shadow-sm transition active:scale-95 cursor-pointer"
                >
                  Connect
                </button>
              </div>
            </div>

            {/* Upcoming Events Widget */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                  <Calendar size={14} className="text-indigo-500" />
                  High News Today
                </h4>
                <div className="flex items-center gap-1.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                  </span>
                  <span className="text-[9px] font-black text-rose-600 uppercase tracking-tighter">Live Monitor</span>
                </div>
              </div>
              
              <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1 no-scrollbar">
                {todayHighImpactEvents.length > 0 ? (
                  todayHighImpactEvents.map((event, idx) => (
                    <div 
                      key={event.id || idx} 
                      onClick={() => setActiveView('outlook')}
                      className="group cursor-pointer p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all duration-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                            event.currency === 'USD' ? 'bg-emerald-100 text-emerald-700' : 
                            event.currency === 'EUR' ? 'bg-blue-100 text-blue-700' : 
                            event.currency === 'GBP' ? 'bg-indigo-100 text-indigo-700' : 'bg-rose-100 text-rose-700'
                          }`}>
                            {event.currency}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            {event.datetime ? parseUTCDate(event.datetime).toLocaleTimeString(navigator.language || 'id-ID', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }).replace(/\s*(AM|PM|am|pm)/gi, '') : event.time}
                          </span>
                        </div>
                        <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-md border ${
                          event.isReleased 
                            ? 'bg-slate-100 text-slate-500 border-slate-200' 
                            : 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse'
                        }`}>
                          {event.countdown}
                        </span>
                      </div>
                      <p className="text-[11px] font-bold text-slate-900 group-hover:text-indigo-600 transition line-clamp-2 leading-tight mb-2">
                        {event.event}
                      </p>
                      {event.isReleased && event.actual && (
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[9px]">
                          <span className="font-bold text-slate-400 uppercase">Actual Result:</span>
                          <span className="font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{event.actual}</span>
                        </div>
                      )}
                      {!event.isReleased && (
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                          <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest group-hover:translate-x-0.5 transition-transform">Details ↗</span>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center px-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <Info size={24} className="text-slate-300 mb-3" />
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">No High Impact Events</p>
                    <p className="text-[10px] text-slate-400 mt-1 max-w-[180px]">No major economic releases scheduled for today.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Market News Widget */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-3 relative">
                <div className="flex items-center gap-2 relative">
                  <button 
                    onClick={() => setActiveNewsTab('news')}
                    className={`relative text-xs font-black uppercase tracking-widest flex items-center gap-1.5 transition px-2 py-1 z-10 ${activeNewsTab === 'news' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <Newspaper size={14} className={`transition-colors ${activeNewsTab === 'news' ? 'text-indigo-500' : ''}`} />
                    News
                  </button>
                  <button 
                    onClick={() => setActiveNewsTab('calendar')}
                    className={`relative text-xs font-black uppercase tracking-widest flex items-center gap-1.5 transition px-2 py-1 z-10 ${activeNewsTab === 'calendar' ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    <Calendar size={14} className={`transition-colors ${activeNewsTab === 'calendar' ? 'text-indigo-500' : ''}`} />
                    Events
                  </button>
                  
                  {/* Active Tab Indicator */}
                  <motion.div
                    className="absolute top-0 bottom-0 bg-slate-100 rounded-lg z-0"
                    initial={false}
                    animate={{
                      left: activeNewsTab === 'news' ? '0%' : '50%',
                      width: activeNewsTab === 'news' ? '82px' : '92px', 
                      x: activeNewsTab === 'news' ? 0 : 8 // Adjust for spacing
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                </div>

                {/* Economic Impact Legend & Tooltip */}
                <div className="relative group flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200/80 cursor-help text-[10px] text-slate-600 font-bold hover:bg-slate-100 transition shrink-0">
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500" title="High Impact"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Medium Impact"></div>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Low Impact"></div>
                  </div>
                  <span className="hidden sm:inline text-[9px] font-extrabold text-slate-500 uppercase tracking-wider">Impact</span>
                  <Info size={11} className="text-slate-400 group-hover:text-indigo-600 transition" />

                  {/* Tooltip Popup */}
                  <div className="absolute right-0 top-full mt-1.5 w-56 p-3 bg-slate-900/95 backdrop-blur-md text-white rounded-xl shadow-xl border border-slate-800 opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none group-hover:pointer-events-auto z-50 text-[10px] space-y-2">
                    <div className="font-black text-[11px] text-white border-b border-slate-800 pb-1 flex items-center justify-between">
                      <span>Economic Impact Levels</span>
                      <span className="text-[9px] text-indigo-400 font-semibold uppercase tracking-wider">Guide</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-start gap-2">
                        <div className="flex items-center gap-0.5 mt-0.5 shrink-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                          <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                        </div>
                        <div>
                          <span className="font-extrabold text-rose-400 block leading-tight">High Impact (Red)</span>
                          <span className="text-slate-300 text-[9px] leading-tight block">Expected heavy market volatility (e.g. CPI, NFP, Rates).</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <div className="flex items-center gap-0.5 mt-0.5 shrink-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                          <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                        </div>
                        <div>
                          <span className="font-extrabold text-amber-400 block leading-tight">Medium Impact (Amber)</span>
                          <span className="text-slate-300 text-[9px] leading-tight block">Moderate price movement potential on currency pairs.</span>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <div className="flex items-center gap-0.5 mt-0.5 shrink-0">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                        </div>
                        <div>
                          <span className="font-extrabold text-emerald-400 block leading-tight">Low Impact (Green)</span>
                          <span className="text-slate-300 text-[9px] leading-tight block">Minor or routine macroeconomic release.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden">
                <AnimatePresence mode="wait">
                  {activeNewsTab === 'news' ? (
                    <motion.div 
                      key="news"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-3"
                    >
                      {marketNews.length > 0 ? (
                        marketNews.map((news) => (
                          <a key={news.id} href={news.url} className="block group">
                            <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition line-clamp-2">{news.title}</p>
                            <div className="flex items-center justify-between mt-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-indigo-500 font-medium">{news.source}</span>
                                <span className="text-[10px] text-slate-400">{news.time}</span>
                              </div>
                              {news.sentiment && (
                                <div className={`flex items-center gap-0.5 text-[10px] font-bold ${news.sentiment.type === 'bullish' ? 'text-emerald-500' : 'text-rose-500'}`}>
                                  {news.sentiment.type === 'bullish' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                  {news.sentiment.value}
                                </div>
                              )}
                            </div>
                          </a>
                        ))
                      ) : (
                        <div className="space-y-3 animate-pulse">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="flex flex-col gap-1">
                              <div className="h-4 bg-slate-100 rounded w-full"></div>
                              <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="calendar"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-2"
                    >
                      {/* High Impact Toggle Button Bar */}
                      <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-100 dark:border-gray-800">
                        <span className="text-[10px] font-extrabold text-slate-500 dark:text-gray-400">Impact Filter:</span>
                        <div className="flex items-center gap-0.5 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700/80">
                          <button
                            onClick={() => setCalendarImpactFilter('all')}
                            className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold transition ${
                              calendarImpactFilter === 'all'
                                ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                          >
                            Semua ({economicEvents.length})
                          </button>
                          <button
                            onClick={() => setCalendarImpactFilter('high')}
                            className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold flex items-center gap-1 transition ${
                              calendarImpactFilter === 'high'
                                ? 'bg-rose-600 text-white shadow-2xs'
                                : 'text-slate-500 hover:text-rose-600 dark:hover:text-rose-400'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${calendarImpactFilter === 'high' ? 'bg-white animate-pulse' : 'bg-rose-500'}`}></span>
                            High Only ({economicEvents.filter(e => e.impact?.toLowerCase() === 'high').length})
                          </button>
                        </div>
                      </div>

                      {nextUpcomingEvent && eventCountdown && (
                        <div 
                          onClick={() => setActiveView('outlook')}
                          className="bg-indigo-50 border border-indigo-100 rounded-xl p-2.5 cursor-pointer hover:bg-indigo-100/80 transition shadow-2xs group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                              </span>
                              <span className="text-[10px] font-black text-indigo-700 uppercase tracking-wide">Next News Release</span>
                            </div>
                            <span className="text-[11px] font-mono font-black text-rose-600 bg-rose-100/80 px-2 py-0.5 rounded-md border border-rose-200">
                              {eventCountdown}
                            </span>
                          </div>
                          <p className="text-[11px] font-extrabold text-slate-900 group-hover:text-indigo-600 transition truncate mt-1">
                            {nextUpcomingEvent.event}
                          </p>
                          <div className="flex items-center justify-between text-[9px] text-slate-500 font-medium mt-0.5">
                            <span className="font-bold text-indigo-600">
                              {nextUpcomingEvent.currency} ({nextUpcomingEvent.datetime ? parseUTCDate(nextUpcomingEvent.datetime).toLocaleTimeString(navigator.language || 'id-ID', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }).replace(/\s*(AM|PM|am|pm)/gi, '') : nextUpcomingEvent.time})
                            </span>
                            <span className="text-indigo-600 group-hover:underline font-bold">Details ↗</span>
                          </div>
                        </div>
                      )}

                      {(calendarImpactFilter === 'high' ? economicEvents.filter(e => e.impact?.toLowerCase() === 'high') : economicEvents).length > 0 ? (
                        (calendarImpactFilter === 'high' ? economicEvents.filter(e => e.impact?.toLowerCase() === 'high') : economicEvents).map((event) => (
                          <div 
                            key={event.id} 
                            onClick={() => setActiveView('outlook')}
                            className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100 group cursor-pointer"
                          >
                            <div className="flex flex-col items-center min-w-[46px] justify-center bg-slate-50 rounded-lg p-1 shrink-0 border border-slate-100/80">
                              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">
                                {event.datetime ? parseUTCDate(event.datetime).toLocaleDateString(navigator.language || 'id-ID', { month: 'short', day: 'numeric', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }) : event.date}
                              </span>
                              <span className="text-[10px] font-black text-slate-800 leading-none my-0.5">
                                {event.datetime ? parseUTCDate(event.datetime).toLocaleTimeString(navigator.language || 'id-ID', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }).replace(/\s*(AM|PM|am|pm)/gi, '') : event.time}
                              </span>
                              <span className={`text-[9px] font-black uppercase tracking-wider ${
                                event.currency === 'USD' ? 'text-emerald-600' : 
                                event.currency === 'EUR' ? 'text-blue-600' : 
                                event.currency === 'GBP' ? 'text-indigo-600' : 'text-rose-600'
                              }`}>{event.currency}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-bold text-slate-900 leading-tight group-hover:text-indigo-600 transition truncate">{event.event}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {(event.impact === 'High' || event.impact === 'high') && (
                                  <div className="flex items-center gap-0.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>
                                  </div>
                                )}
                                {(event.impact === 'Medium' || event.impact === 'medium') && (
                                  <div className="flex items-center gap-0.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>
                                  </div>
                                )}
                                {(event.impact === 'Low' || event.impact === 'low') && (
                                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                                )}
                                <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-medium truncate">
                                  {event.actual && event.actual !== '-' && <span>Act: <span className="font-bold text-slate-900">{event.actual}</span></span>}
                                  {event.forecast && event.forecast !== '-' && <span>Est: {event.forecast}</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="space-y-3 animate-pulse">
                          {[1, 2, 3].map(i => (
                            <div key={i} className="flex items-start gap-2">
                              <div className="w-8 h-6 bg-slate-100 rounded"></div>
                              <div className="flex-1 space-y-1">
                                <div className="h-3 bg-slate-100 rounded w-full"></div>
                                <div className="h-2 bg-slate-100 rounded w-1/2"></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Footer Links */}
            <div className="px-2 flex flex-wrap gap-x-3 gap-y-2 text-[10px] font-medium text-slate-400">
              <a href="#" className="hover:text-indigo-600 transition">About</a>
              <a href="#" className="hover:text-indigo-600 transition">Accessibility</a>
              <a href="#" className="hover:text-indigo-600 transition">Help Center</a>
              <a href="#" className="hover:text-indigo-600 transition">Privacy & Terms</a>
              <div className="w-full pt-2 flex items-center gap-1.5 text-slate-500">
                <TaraptiLogo height={32} />
                <span>© 2026 gotrading Inc.</span>
              </div>
            </div>

          </aside>
        )}
        
      </div>


      {/* Auto-scroll to top button */}
      <AnimatePresence>
        {showScrollToTop && activeView === 'feed' && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            onClick={scrollToTop}
            className={`fixed ${isFooterVisible ? 'bottom-24' : 'bottom-6'} lg:bottom-6 right-6 z-50 p-2 bg-white border border-slate-300 text-slate-500 rounded-full shadow-sm hover:bg-slate-50 hover:shadow-md transition-all duration-300 focus:outline-none`}
            aria-label="Scroll to top"
          >
            <ChevronUp size={20} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* BOTTOM NAVIGATION BAR */}
      {activeView !== 'messages' && (
        <footer 
            className={`lg:hidden fixed bottom-0 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md border-t border-slate-200/90 pt-1.5 pb-2.5 px-3 w-full max-w-lg z-40 shrink-0 shadow-[0_-4px_25px_-5px_rgba(0,0,0,0.08)] transition-all duration-300 ease-in-out ${isFooterVisible ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}
          >

        <div className="grid grid-cols-5 gap-1 text-center relative">
          
          {/* Menu 1: Feed/Dashboard */}
          <button
            onClick={() => setActiveView('feed')}
            className={`flex flex-col items-center justify-center gap-1 transition relative py-1.5 z-10 ${
              activeView === 'feed' ? 'text-indigo-600 font-extrabold scale-105' : 'text-slate-400 hover:text-slate-900'
            }`}
          >
            <div className="h-[22px] flex items-center justify-center relative">
              <LayoutDashboard size={18} />
            </div>
            <span className="text-[9px] font-black">Home</span>
            {activeView === 'feed' && (
              <motion.div
                layoutId="activeBottomTabPill"
                className="absolute inset-0 bg-indigo-50/80 rounded-xl -z-10 border border-indigo-100"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </button>

          {/* Menu 2: Journal */}
          <button
            onClick={() => setActiveView('journal')}
            className={`flex flex-col items-center justify-center gap-1 transition relative py-1.5 z-10 ${
              activeView === 'journal' ? 'text-indigo-600 font-extrabold scale-105' : 'text-slate-400 hover:text-slate-900'
            }`}
          >
            <div className="h-[22px] flex items-center justify-center relative">
              <BookOpen size={18} />
              <div className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-[2px] border border-white shadow-sm flex items-center justify-center">
                <Lock size={7} />
              </div>
            </div>
            <span className="text-[9px] font-black">{t('nav.journal')}</span>
            {activeView === 'journal' && (
              <motion.div
                layoutId="activeBottomTabPill"
                className="absolute inset-0 bg-indigo-50/80 rounded-xl -z-10 border border-indigo-100"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </button>

          {/* Menu 3: Account */}
          <button
            onClick={() => setActiveView('account')}
            className={`flex flex-col items-center justify-center gap-1 transition relative py-1.5 z-10 ${
              activeView === 'account' ? 'text-indigo-600 font-extrabold scale-105' : 'text-slate-400 hover:text-slate-900'
            }`}
          >
            <div className="h-[22px] flex items-center justify-center relative">
              <ShieldCheck size={18} />
            </div>
            <span className="text-[9px] font-black">{t('nav.account')}</span>
            {activeView === 'account' && (
              <motion.div
                layoutId="activeBottomTabPill"
                className="absolute inset-0 bg-indigo-50/80 rounded-xl -z-10 border border-indigo-100"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </button>

          {/* Menu 4: Outlook */}
          <button
            onClick={() => setActiveView('outlook')}
            className={`flex flex-col items-center justify-center gap-1 transition relative py-1.5 z-10 ${
              activeView === 'outlook' ? 'text-indigo-600 font-extrabold scale-105' : 'text-slate-400 hover:text-slate-900'
            }`}
          >
            <div className="h-[22px] flex items-center justify-center relative">
              <Globe size={18} />
            </div>
            <span className="text-[9px] font-black">{t('nav.outlook')}</span>
            {activeView === 'outlook' && (
              <motion.div
                layoutId="activeBottomTabPill"
                className="absolute inset-0 bg-indigo-50/80 rounded-xl -z-10 border border-indigo-100"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </button>

          {/* Menu 5: Profile */}
          <button
            onClick={() => setActiveView('profile')}
            className={`flex flex-col items-center justify-center gap-1 transition relative py-1.5 z-10 ${
              activeView === 'profile' ? 'text-indigo-600 font-extrabold scale-105' : 'text-slate-400 hover:text-slate-900'
            }`}
          >
            <div className="h-[22px] flex items-center justify-center relative">
              <UserIcon size={18} />
            </div>
            <span className="text-[9px] font-black">{t('nav.profile')}</span>
            {activeView === 'profile' && (
              <motion.div
                layoutId="activeBottomTabPill"
                className="absolute inset-0 bg-indigo-50/80 rounded-xl -z-10 border border-indigo-100"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </button>

        </div>
      </footer>
      )}

      {/* Draggable Floating Chat Button for Mobile */}
      {activeView !== 'messages' && (
        <motion.div
          drag
          dragConstraints={dragConstraints}
          dragElastic={0.1}
          dragMomentum={false}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onTap={() => {
            setActiveView('messages');
          }}
          className="fixed z-40 lg:hidden cursor-grab active:cursor-grabbing select-none"
          style={{ 
            left: '16px', 
            bottom: '84px',
            touchAction: 'none'
          }}
        >
          {/* Outer circle with gradient border effect */}
          <div className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-[#1b82ff] to-[#be12fc] p-[2px] shadow-[0_8px_24px_rgba(27,130,255,0.3)]">
            {/* Inner white circular background */}
            <div className="w-full h-full rounded-full bg-white dark:bg-[#121620] flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </motion.div>
      )}
      <ConnectModal 
        isOpen={isConnectModalOpen} 
        onClose={() => setIsConnectModalOpen(false)} 
      />

      {/* Performance Chart Modal (Slide-over) */}
      <AnimatePresence>
        {performanceMetric && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPerformanceMetric(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[110]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed right-4 top-4 bottom-4 w-[85%] max-w-sm z-[120] shadow-2xl flex flex-col rounded-3xl border`}
              style={{ 
                backgroundColor: 
                  performanceMetric === 'pl' ? '#F0FDF4' : 
                  performanceMetric === 'drawdown' ? '#FFCAD0' : 
                  performanceMetric === 'winrate' ? '#CEF3FC' : 
                  '#FFF1F2',
                borderColor: 
                  performanceMetric === 'pl' ? '#DCFCE7' : 
                  performanceMetric === 'streak' ? '#FFE4E6' : 
                  '#cbd5e1'
              }}
            >
              <div className="p-5 border-b border-black/5 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {performanceMetric === 'pl' ? 'Your P/L Performance' : 
                     performanceMetric === 'drawdown' ? 'Drawdown Analysis' : 
                     performanceMetric === 'winrate' ? 'Win Rate Statistics' : 
                     'Trading Streak'}
                  </h3>
                  <p className="text-[10px] text-slate-700 font-bold uppercase tracking-widest mt-0.5">
                    {performanceMetric === 'pl' ? 'Cumulative Growth' : 
                     performanceMetric === 'drawdown' ? 'Risk Management' : 
                     performanceMetric === 'winrate' ? 'Accuracy Breakdown' : 
                     'Consistency Tracker'}
                  </p>
                </div>
                <button 
                  onClick={() => setPerformanceMetric(null)}
                  className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-slate-700 hover:text-slate-900 hover:bg-black/10 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/40 backdrop-blur-md border border-white/20 rounded-xl p-3 shadow-sm">
                    <span className="text-[9px] font-bold text-slate-800 uppercase tracking-wider block mb-1">
                      {performanceMetric === 'pl' ? 'Total Gain' : 
                       performanceMetric === 'drawdown' ? 'Max DD' : 
                       performanceMetric === 'winrate' ? 'Total Trades' : 
                       'Max Streak'}
                    </span>
                    <span className="text-xl font-black text-slate-900 font-mono">
                      {performanceMetric === 'pl' ? '+$1,420' : 
                       performanceMetric === 'drawdown' ? '-4.2%' : 
                       performanceMetric === 'winrate' ? '142' : 
                       '8 Days'}
                    </span>
                  </div>
                  <div className="bg-white/40 backdrop-blur-md border border-white/20 rounded-xl p-3 shadow-sm">
                    <span className="text-[9px] font-bold text-slate-800 uppercase tracking-wider block mb-1">
                      {performanceMetric === 'pl' ? 'Win Rate' : 
                       performanceMetric === 'drawdown' ? 'Daily DD' : 
                       performanceMetric === 'winrate' ? 'Win Rate' : 
                       'Current'}
                    </span>
                    <span className="text-xl font-black text-slate-900 font-mono">
                      {performanceMetric === 'pl' ? '68.4%' : 
                       performanceMetric === 'drawdown' ? '-1.2%' : 
                       performanceMetric === 'winrate' ? '68.4%' : 
                       '3 Days'}
                    </span>
                  </div>
                </div>

                <div className="bg-white/40 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-sm">
                  <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={
                          performanceMetric === 'pl' ? [
                            { day: 'Mon', val: 120 }, { day: 'Tue', val: 340 }, { day: 'Wed', val: -150 }, { day: 'Thu', val: 420 }, { day: 'Fri', val: 280 }, { day: 'Sat', val: 510 }, { day: 'Sun', val: 248 }
                          ] : performanceMetric === 'drawdown' ? [
                            { day: 'Mon', val: -1.2 }, { day: 'Tue', val: -0.5 }, { day: 'Wed', val: -3.4 }, { day: 'Thu', val: -1.1 }, { day: 'Fri', val: -0.8 }, { day: 'Sat', val: -4.2 }, { day: 'Sun', val: -2.1 }
                          ] : performanceMetric === 'winrate' ? [
                            { day: 'Mon', val: 60 }, { day: 'Tue', val: 75 }, { day: 'Wed', val: 45 }, { day: 'Thu', val: 82 }, { day: 'Fri', val: 68 }, { day: 'Sat', val: 72 }, { day: 'Sun', val: 65 }
                          ] : [
                            { day: 'Mon', val: 2 }, { day: 'Tue', val: 4 }, { day: 'Wed', val: 1 }, { day: 'Thu', val: 5 }, { day: 'Fri', val: 3 }, { day: 'Sat', val: 8 }, { day: 'Sun', val: 3 }
                          ]
                        }
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={performanceMetric === 'drawdown' ? '#E11D48' : '#000'} stopOpacity={0.1}/>
                            <stop offset="95%" stopColor={performanceMetric === 'drawdown' ? '#E11D48' : '#000'} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                        <XAxis 
                          dataKey="day" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fontWeight: 700, fill: 'rgba(0,0,0,0.4)' }}
                          dy={10}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fontSize: 10, fontWeight: 700, fill: 'rgba(0,0,0,0.4)' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            borderRadius: '12px', 
                            border: 'none', 
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                            fontSize: '11px',
                            fontWeight: '600',
                            backgroundColor: 'rgba(255, 255, 255, 0.9)'
                          }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="val" 
                          stroke={performanceMetric === 'drawdown' ? '#E11D48' : 'rgba(0,0,0,0.5)'} 
                          strokeWidth={2}
                          fillOpacity={1} 
                          fill="url(#colorMetric)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">
                    {performanceMetric === 'pl' ? 'P/L Insights' : 
                     performanceMetric === 'drawdown' ? 'Risk Insights' : 
                     performanceMetric === 'winrate' ? 'Accuracy Insights' : 
                     'Streak Insights'}
                  </h4>
                  <div className="flex gap-3">
                    <div className="flex-1 bg-white/40 backdrop-blur-md border border-white/20 rounded-xl p-3 shadow-sm">
                      <div className="flex items-center gap-2 mb-1">
                        {performanceMetric === 'drawdown' ? <ShieldAlert size={14} className="text-rose-600" /> : <TrendingUp size={14} className="text-slate-900" />}
                        <span className="text-[11px] font-bold text-slate-900">
                          {performanceMetric === 'pl' ? 'Best Day' : 
                           performanceMetric === 'drawdown' ? 'Warning' : 
                           performanceMetric === 'winrate' ? 'Top Pair' : 
                           'Best Week'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-800 leading-relaxed font-bold">
                        {performanceMetric === 'pl' ? 'Saturday yielded maximum returns with +$510 net profit.' : 
                         performanceMetric === 'drawdown' ? 'DD peaked at -4.2% on Saturday. Avoid over-leveraging.' : 
                         performanceMetric === 'winrate' ? 'XAU/USD maintains your highest win rate at 74%.' : 
                         'Your 8-day streak in May remains your all-time consistency record.'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 bg-black/5 border-t border-black/5">
                <button 
                  onClick={() => setPerformanceMetric(null)}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg"
                >
                  Close Insights
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Premium Toast Notification overlay */}
      {toastMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#121620] border border-gray-800/80 text-gray-200 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 z-50 max-w-sm w-[90%] justify-center font-bold text-xs animate-in fade-in slide-in-from-bottom-5 duration-300">
          <Activity size={14} className="text-indigo-400 animate-pulse" />
          <span className="text-center">{toastMessage}</span>
        </div>
      )}

      {/* MESSAGING BAR (LinkedIn Style) */}
      <div className={`fixed bottom-0 right-4 w-72 bg-white border border-slate-200 rounded-t-lg shadow-[0_-4px_12px_-2px_rgba(0,0,0,0.1)] z-[100] hidden lg:flex flex-col overflow-hidden transition-all duration-300 ${isMessagingExpanded ? 'h-[500px]' : 'h-12'}`}>
        <div 
          onClick={() => setIsMessagingExpanded(!isMessagingExpanded)}
          className="px-3 py-2 flex items-center justify-between border-b border-slate-100 cursor-pointer hover:bg-slate-50 shrink-0"
        >
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden ring-1 ring-slate-100">
                <img src={currentUser?.avatar && currentUser.avatar.length > 2 ? currentUser.avatar : `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.username || 'user'}`} alt="me" className="w-full h-full object-cover" />
              </div>
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></div>
            </div>
            <span className="text-[13px] font-bold text-slate-900">{t('common.messaging')}</span>
          </div>
          <div className="flex items-center gap-0.5">
            <button className="p-1.5 hover:bg-slate-100 rounded-full transition" onClick={(e) => { e.stopPropagation(); }}><MoreHorizontal size={16} className="text-slate-600" /></button>
            <button className="p-1.5 hover:bg-slate-100 rounded-full transition" onClick={(e) => { e.stopPropagation(); setIsMessagingExpanded(true); setIsMessagingNewChat(true); }}><SquarePen size={16} className="text-slate-600" /></button>
            <button className="p-1.5 hover:bg-slate-100 rounded-full transition">
              {isMessagingExpanded ? <ChevronDown size={18} className="text-slate-600" /> : <ChevronUp size={18} className="text-slate-600" />}
            </button>
          </div>
        </div>
        
        {/* Expanded content */}
        {isMessagingNewChat ? (
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            <div className="px-3 py-2 flex items-center justify-between border-b border-slate-100">
              <span className="text-[14px] font-bold text-slate-900">{t('common.newMessage')}</span>
              <button onClick={() => setIsMessagingNewChat(false)} className="p-1 hover:bg-slate-100 rounded-md text-slate-500">
                <X size={16} />
              </button>
            </div>
            <div className="p-2 border-b border-slate-100">
              <input 
                type="text" 
                placeholder={t('common.typeName')} 
                value={messagingSearchQuery}
                onChange={(e) => setMessagingSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-full py-1.5 px-4 text-[13px] focus:ring-1 focus:ring-indigo-500 outline-none placeholder-slate-500"
                autoFocus
              />
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar">
              <div className="px-3 py-2 text-[12px] font-semibold text-slate-500 bg-slate-50/50">{t('common.suggested')}</div>
              {messagingUsers.filter(u => u.id !== currentUser?.id && `${u.firstName} ${u.lastName} ${u.username}`.toLowerCase().includes(messagingSearchQuery.toLowerCase())).map(u => (
                 <div 
                   key={u.id}
                   onClick={() => { setActiveView('messages'); setActiveChatPartnerId(u.id); setIsMessagingNewChat(false); setIsMessagingExpanded(false); }}
                   className="px-3 py-2 flex items-center gap-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50/50"
                 >
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 shrink-0">
                      <img src={u.avatar?.startsWith('http') ? u.avatar : `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold text-slate-900 leading-tight truncate">{u.firstName} {u.lastName}</div>
                      <div className="text-[11px] text-slate-500 truncate">{u.headline || u.bio || 'Member of gotrading'}</div>
                    </div>
                 </div>
              ))}
              {messagingUsers.filter(u => u.id !== currentUser?.id && `${u.firstName} ${u.lastName} ${u.username}`.toLowerCase().includes(messagingSearchQuery.toLowerCase())).length === 0 && (
                <div className="px-4 py-8 text-center text-[12px] text-slate-500">
                  {t('common.noUserFound')}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
             {/* Search Bar */}
             <div className="px-3 py-2">
               <div className="relative">
                 <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                 <input 
                   type="text" 
                   value={messagingConversationSearchQuery}
                   onChange={(e) => setMessagingConversationSearchQuery(e.target.value)}
                   placeholder={t('common.searchMessages')} 
                   className="w-full bg-[#eef3f8] border-none rounded-md py-1.5 pl-9 pr-8 text-[13px] focus:ring-1 focus:ring-indigo-500 focus:outline-hidden placeholder-slate-500"
                 />
                 {messagingConversationSearchQuery ? (
                   <button 
                     type="button"
                     onClick={() => setMessagingConversationSearchQuery('')}
                     className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                   >
                     <X size={14} />
                   </button>
                 ) : (
                   <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900">
                     <Settings size={14} />
                   </button>
                 )}
               </div>
             </div>
  
             {/* Tabs */}
             <div className="flex border-b border-slate-100">
               <button 
                 type="button"
                 onClick={() => setMessagingTab('focused')}
                 className={`flex-1 py-2 text-[13px] font-bold transition cursor-pointer ${messagingTab === 'focused' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
               >
                 Focused
               </button>
               <button 
                 type="button"
                 onClick={() => setMessagingTab('unread')}
                 className={`flex-1 py-2 text-[13px] font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${messagingTab === 'unread' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-900'}`}
               >
                 Unread
                 {sessions.filter(s => s.unreadCount > 0).length > 0 && (
                   <span className="px-1.5 py-0.2 bg-indigo-100 text-indigo-700 text-[10px] rounded-full font-extrabold">
                     {sessions.filter(s => s.unreadCount > 0).length}
                   </span>
                 )}
               </button>
             </div>
  
             {/* Messages List */}
             <div className="flex-1 overflow-y-auto no-scrollbar">
               {(() => {
                 const query = messagingConversationSearchQuery.trim().toLowerCase();
                 const filtered = sessions.filter((s) => {
                   if (messagingTab === 'unread' && s.unreadCount === 0) return false;
                   if (!query) return true;
                   const name = `${s.firstName || ''} ${s.lastName || ''}`.toLowerCase();
                   const username = (s.username || '').toLowerCase();
                   const content = (s.lastMessage || '').toLowerCase();
                   return name.includes(query) || username.includes(query) || content.includes(query);
                 });

                 if (sessions.length === 0) {
                   return (
                     <div className="text-center py-10 px-4 text-xs text-slate-400 font-medium">
                       Belum ada pesan. Cari koneksi di halaman Network.
                     </div>
                   );
                 }

                 if (filtered.length === 0) {
                   return (
                     <div className="text-center py-10 px-4 text-xs text-slate-400 font-medium">
                       Tidak ada percakapan yang cocok dengan pencarian.
                     </div>
                   );
                 }

                 return filtered.map((msg) => {
                   const isGroup = msg.userId.startsWith('group_');
                   const avatarSrc = isGroup ? undefined : (msg.avatar && msg.avatar.startsWith('http') ? msg.avatar : `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.username}`);
                   
                   const formatTime = (iso?: string) => {
                     return formatMessageDate(iso);
                   };

                   return (
                     <div 
                       key={msg.userId}
                       onClick={() => { 
                         setActiveView('messages'); 
                         setActiveChatPartnerId(msg.userId); 
                         setIsMessagingExpanded(false); 
                         markSessionAsRead(msg.userId);
                       }}
                       className="px-3 py-3 flex gap-3 hover:bg-slate-50 cursor-pointer transition border-b border-slate-50/50"
                     >
                       <div className="relative shrink-0">
                         <div className={`w-12 h-12 rounded-full overflow-hidden border border-slate-100 flex items-center justify-center font-bold text-white ${isGroup ? 'bg-gradient-to-tr from-indigo-500 to-indigo-700' : 'bg-slate-200'}`}>
                           {avatarSrc ? <img src={avatarSrc} alt={msg.firstName} className="w-full h-full object-cover" /> : msg.avatar}
                         </div>
                         {msg.unreadCount > 0 && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 border-2 border-white rounded-full"></div>
                         )}
                       </div>
                       <div className="flex-1 min-w-0">
                         <div className="flex justify-between items-baseline mb-0.5">
                           <h4 className="text-[13px] font-bold text-slate-900 truncate">{msg.firstName} {msg.lastName}</h4>
                           <span className="text-[11px] text-slate-500 shrink-0 ml-2">{formatTime(msg.lastMessageTime)}</span>
                         </div>
                         <p className="text-[11px] text-slate-500 truncate leading-relaxed">{msg.lastMessage}</p>
                       </div>
                     </div>
                   );
                 });
               })()}
            </div>
        </div>
        )}
      </div>

      {/* Startup Notification Permission Modal when opening app */}
      {showStartupNotificationPrompt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#121620] border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl relative space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 text-white flex items-center justify-center shadow-lg mx-auto">
              <span className="text-2xl">🔔</span>
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Aktifkan Notifikasi gotrading
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Dapatkan pembaruan real-time, sinyal trading, dan pesan langsung instan begitu Anda membuka aplikasi.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={async () => {
                  setShowStartupNotificationPrompt(false);
                  try {
                    const res = await import('./lib/notifications').then(mod => mod.requestNotificationPermission());
                    if (res) {
                      import('./lib/notifications').then(mod => mod.showNotification("Tarapti Connected", "Notifikasi berhasil diaktifkan!"));
                    }
                  } catch (e) {
                    console.warn(e);
                  }
                }}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-xs rounded-2xl transition shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
              >
                Izinkan Notifikasi Sekarang
              </button>
              <button
                type="button"
                onClick={() => setShowStartupNotificationPrompt(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold text-xs rounded-2xl transition cursor-pointer"
              >
                Nanti Saja
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <MainAppLayout />
      </AppProvider>
    </ErrorBoundary>
  );
}
