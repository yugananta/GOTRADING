import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { User, Post, Notification, Message, ChatSession, Story } from '../types.ts';
import { poll } from '../utils/polling';
import { apiFetch } from '../utils/apiFetch';
import { getPostsFromCache, savePostsToCache } from '../utils/cacheDb.ts';
import { playSound } from '../lib/audio';
import { getSupabase } from '../lib/supabaseClient';
import { deserializePost } from '../utils/postUtils';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  newPostsQueue: Post[];
  flushNewPostsQueue: () => void;
  loadingPosts: boolean;
  fetchPosts: () => Promise<void>;
  stories: Story[];
  fetchStories: () => Promise<void>;
  addStory: (imageUrl: string) => void;
  recordStoryView: (storyId: string) => Promise<void>;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  unreadNotificationsCount: number;
  sessions: ChatSession[];
  fetchSessions: () => Promise<void>;
  markSessionAsRead: (partnerId: string) => void;
  unreadMessagesCount: number;
  activeChatPartnerId: string | null;
  setActiveChatPartnerId: (id: string | null) => void;
  chatHistory: Message[];
  fetchChatHistory: (partnerId: string) => Promise<void>;
  sendMessage: (partnerId: string, content: string, image?: string, fileUrl?: string, fileName?: string) => Promise<void>;
  reactToMessage: (messageId: string, emoji: string) => Promise<void>;
  connectedBroker: { broker: string; accountId: string; platform?: string; server?: string } | null;
  connectBroker: (broker: string, accountId: string, platform?: string, password?: string, server?: string) => Promise<void> | void;
  disconnectBroker: () => Promise<void> | void;
  syncMetaTrader: () => Promise<void>;
  connectedAccounts: any[];
  setConnectedAccounts: React.Dispatch<React.SetStateAction<any[]>>;
  activeAccountLogin: string | null;
  setActiveAccountLogin: (login: string | null) => void;
  activeAccount: any | null;
  fetchMetaTraderData: (targetLoginOrId?: string) => Promise<any[]>;
  tradingStats: {
    portfolio: string;
    todayPL: string;
    winRate: string;
    streak: string;
    tradesLoggedToday: number;
    dailyTradeGoal: number;
  };
  setTradingStats: React.Dispatch<React.SetStateAction<{
    portfolio: string;
    todayPL: string;
    winRate: string;
    streak: string;
    tradesLoggedToday: number;
    dailyTradeGoal: number;
  }>>;
  toastMessage: string | null;
  setToastMessage: (message: string | null) => void;
  showToast: (message: string, duration?: number) => void;
  pendingConnections: any[];
  fetchPendingConnections: () => Promise<void>;
  sendConnectionRequest: (targetId: string) => Promise<void>;
  acceptConnectionRequest: (targetId: string) => Promise<void>;
  declineConnectionRequest: (targetId: string) => Promise<void>;
  getConnectionStatus: (targetId: string) => Promise<'none' | 'pending' | 'accepted' | 'declined' | 'received_pending'>;
  activeView: string;
  setActiveView: (view: any) => void;
  journalInitialTab: 'goals' | 'ledger' | 'history';
  setJournalInitialTab: (tab: 'goals' | 'ledger' | 'history') => void;
  outlookInitialTab: 'news';
  setOutlookInitialTab: (tab: 'news') => void;
  selectedUserId: string | null;
  setSelectedUserId: (id: string | null) => void;
  viewUserProfile: (userId: string) => void;
  latestRealtimeEvent: { id: string; type: string; notification: Notification; timestamp: number } | null;
  clearRealtimeEvent: () => void;
  triggerTestNotification: (eventType: 'friend_request' | 'friend_accepted' | 'new_message' | 'like' | 'profit_target_daily' | 'profit_target_weekly' | 'drawdown_daily' | 'drawdown_weekly' | 'high_news') => Promise<void>;
  logApiDiagnostic: (actionName: string, req: { url: string; method: string; headers?: any; body?: any }, res?: Response, data?: any, err?: any) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('tarapti_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [posts, setPosts] = useState<Post[]>([]);

  // Asynchronously load cached posts on mount
  useEffect(() => {
    getPostsFromCache().then(cached => {
      if (cached && cached.length > 0) {
        setPosts(prev => prev.length === 0 ? cached : prev);
      }
    });
  }, []);

  const postsRef = useRef<Post[]>(posts);
  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);
  const [stories, setStories] = useState<Story[]>(() => {
    try {
      const cached = localStorage.getItem('tarapti_cached_stories');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [newPostsQueue, setNewPostsQueue] = useState<Post[]>([]);
  const flushNewPostsQueue = useCallback(() => {
    setPosts(prev => {
      const filteredQueue = newPostsQueue.filter(newP => !prev.some(p => p.id === newP.id));
      return [...filteredQueue, ...prev].slice(0, 200);
    });
    setNewPostsQueue([]);
  }, [newPostsQueue]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeChatPartnerId, setActiveChatPartnerId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [connectedAccounts, setConnectedAccounts] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('tarapti_connected_accounts');
      if (saved) return JSON.parse(saved);
      const stored = localStorage.getItem('tarapti_broker');
      if (stored) {
        const parsed = JSON.parse(stored);
        return [{
          login: parsed.accountId,
          broker: parsed.broker,
          platform: parsed.platform || 'MT5',
          server: parsed.server || parsed.broker,
          equity: 0
        }];
      }
    } catch {}
    return [];
  });
  const [activeAccountLogin, setActiveAccountLoginState] = useState<string | null>(() => {
    try {
      return localStorage.getItem('tarapti_active_mt_login') || null;
    } catch {
      return null;
    }
  });

  const setActiveAccountLogin = useCallback((login: string | null) => {
    setActiveAccountLoginState(login);
    if (login) {
      localStorage.setItem('tarapti_active_mt_login', login);
    } else {
      localStorage.removeItem('tarapti_active_mt_login');
    }
  }, []);

  const activeAccount = useMemo(() => {
    if (!connectedAccounts || connectedAccounts.length === 0) return null;
    if (activeAccountLogin) {
      const found = connectedAccounts.find((a: any) => String(a.login) === String(activeAccountLogin) || String(a.id) === String(activeAccountLogin));
      if (found) return found;
    }
    return connectedAccounts[0];
  }, [connectedAccounts, activeAccountLogin]);

  const [connectedBroker, setConnectedBroker] = useState<{ broker: string; accountId: string; platform?: string; server?: string } | null>(null);
  const [activeView, setActiveView] = useState<string>('feed');
  const [journalInitialTab, setJournalInitialTab] = useState<'goals' | 'ledger' | 'history'>('goals');
  const [outlookInitialTab, setOutlookInitialTab] = useState<'news'>('news');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [latestRealtimeEvent, setLatestRealtimeEvent] = useState<{ id: string; type: 'FRIEND_REQUEST' | 'FRIEND_ACCEPTED' | 'NEW_MESSAGE' | 'NOTIFICATION'; notification: Notification; timestamp: number } | null>(null);

  const clearRealtimeEvent = () => setLatestRealtimeEvent(null);
  
  // Real-time trading stats (updates when broker is connected!)
  const [tradingStats, setTradingStats] = useState({
    portfolio: "$0.00",
    todayPL: "$0.00",
    winRate: "0%",
    streak: "0d",
    tradesLoggedToday: 0,
    dailyTradeGoal: 5
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  const fetchStories = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/stories`);
      if (res.ok) {
        const data = await res.json();
        setStories(data);
        try {
          localStorage.setItem('tarapti_cached_stories', JSON.stringify(data));
        } catch (err) {
          console.warn("Failed to cache stories:", err);
        }
      }
    } catch (e) {
      console.error("Error fetching stories:", e);
    }
  }, []);

  const addStory = useCallback(async (imageUrl: string) => {
    if (!currentUser) return;
    try {
      const res = await apiFetch(`/api/stories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, imageUrl })
      });
      if (res.ok) {
        fetchStories();
        showToast('Cerita berhasil dibagikan!');
      } else {
        const err = await res.text();
        console.error("Error adding story (server side):", err);
        showToast('Gagal memposting cerita. Silakan coba lagi.');
      }
    } catch (e) {
      console.error("Error adding story:", e);
      showToast('Gagal memposting cerita. Silakan periksa koneksi Anda.');
    }
  }, [currentUser, fetchStories]);

  const recordStoryView = useCallback(async (storyId: string) => {
    if (!currentUser) return;
    setStories(prev => prev.map(s => {
      if (s.id === storyId) {
        const existingViewers = s.viewers || [];
        const hasViewed = existingViewers.some(v => v.userId === currentUser.id);
        if (!hasViewed) {
          const newViewer = {
            userId: currentUser.id,
            viewedAt: new Date().toISOString(),
            user: {
              id: currentUser.id,
              firstName: currentUser.firstName,
              lastName: currentUser.lastName,
              username: currentUser.username,
              avatar: currentUser.avatar
            }
          };
          return {
            ...s,
            viewed: true,
            viewers: [newViewer, ...existingViewers]
          };
        }
      }
      return s;
    }));

    try {
      const res = await apiFetch(`/api/stories/${storyId}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ viewerUserId: currentUser.id })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.viewers) {
          setStories(prev => prev.map(s => s.id === storyId ? { ...s, viewed: true, viewers: data.viewers } : s));
        }
      }
    } catch (e) {
      console.error("Error recording story view:", e);
    }
  }, [currentUser]);

  const showToast = useCallback((message: string, duration: number = 3000) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(prev => prev === message ? null : prev);
    }, duration);
  }, []);

  // Refresh user profile in background and load broker from localStorage
  useEffect(() => {
    if (currentUser && currentUser.id) {
      apiFetch(`/api/users/profile/${currentUser.id}`)
        .then(res => res.ok ? res.json() : null)
        .then(freshUser => {
          if (freshUser) {
            setCurrentUser(prev => prev ? { ...prev, ...freshUser } : freshUser);
          }
        })
        .catch(() => {});
    }

    const storedBroker = localStorage.getItem('tarapti_broker');
    if (storedBroker) {
      try {
        setConnectedBroker(JSON.parse(storedBroker));
      } catch (e) {}
    }
  }, []);

  // Sync user offline/online status or fetch data on login
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('tarapti_user', JSON.stringify(currentUser));
      // Always fetch fresh posts to sync with database, but load other endpoints in parallel
      fetchPosts(true);
      fetchNotifications();
      fetchSessions();
      fetchMetaTraderData();
      fetchStories();
    } else {
      localStorage.removeItem('tarapti_user');
    }
  }, [currentUser?.id]); // Use ID instead of full object to avoid re-triggering on profile edits

  // Reactively fetch real-time MT5 account statistics and trades when active account login changes
  useEffect(() => {
    if (activeAccountLogin) {
      console.log(`[AppContext] Reactively fetching fresh MT5 data because active account changed to: ${activeAccountLogin}`);
      fetchMetaTraderData(activeAccountLogin);
    }
  }, [activeAccountLogin]);

  // Polling for updates using unified utility
  useEffect(() => {
    if (!currentUser) return;

    fetchPendingConnections();
    fetchNotifications();

    // Sync notifications every 30s
    const stopNotifPolling = poll<Notification[]>(
      `/api/notifications/${currentUser.id}?_t=${Date.now()}`,
      (data) => setNotifications(data),
      (e) => console.warn("Notification poll notice:", e),
      30000
    );

    // Sync sessions every 30s
    const stopSessionPolling = poll<ChatSession[]>(
      `/api/messages/sessions/${currentUser.id}?_t=${Date.now()}`,
      (data) => setSessions(data),
      (e) => console.warn("Session poll notice:", e),
      30000
    );

    // Auto-refetch when window gains focus or tab becomes visible
    const handleVisibilityAndFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchNotifications();
        fetchSessions();
      }
    };

    window.addEventListener('focus', handleVisibilityAndFocus);
    document.addEventListener('visibilitychange', handleVisibilityAndFocus);

    return () => {
      stopNotifPolling();
      stopSessionPolling();
      window.removeEventListener('focus', handleVisibilityAndFocus);
      document.removeEventListener('visibilitychange', handleVisibilityAndFocus);
    };
  }, [currentUser]);

  // Handle notification sound trigger
  const lastUnreadCount = React.useRef(0);
  useEffect(() => {
    const unread = notifications.filter(n => !n.isRead);
    const count = unread.length;
    
    if (count > lastUnreadCount.current) {
      console.log(`Unread notifications increased from ${lastUnreadCount.current} to ${count}. Playing sound.`);
      const newest = unread[0];
      if (newest) {
        if (newest.type === 'message') {
          playSound('whatsapp');
        } else if (newest.type.includes('target') || newest.type.includes('drawdown')) {
          playSound('telegram');
        } else {
          playSound('default');
        }
      }
    }
    lastUnreadCount.current = count;
  }, [notifications]);

  const triggerTestNotification = async (eventType: 'friend_request' | 'friend_accepted' | 'new_message' | 'like' | 'profit_target_daily' | 'profit_target_weekly' | 'drawdown_daily' | 'drawdown_weekly' | 'high_news') => {
    if (!currentUser) return;
    try {
      const res = await apiFetch('/api/notifications/test-trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, eventType })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.notification) {
          setLatestRealtimeEvent({
            id: data.notification.id,
            type: data.eventName as any,
            notification: data.notification,
            timestamp: Date.now()
          });
          // Also fetch all notifications to update the list
          fetchNotifications();
        }
        showToast("Simulasi notifikasi real-time dikirim!");
      }
    } catch (e) {
      console.error("Test trigger error:", e);
    }
  };


  const isJsonResponse = (res: Response) => {
    return res.ok && (res.headers.get('content-type') || '').includes('application/json');
  };

  const fetchMetaTraderData = async (targetLoginOrId?: string) => {
    try {
      const targetLogin = targetLoginOrId || activeAccountLogin;
      const matchingAccount = connectedAccounts?.find((a: any) => a.login === targetLogin || a.id === targetLogin);
      const queryParam = targetLogin ? `?login=${encodeURIComponent(targetLogin)}&accountId=${encodeURIComponent(matchingAccount?.id || targetLogin)}` : '';
      console.log(`[AppContext] [INVESTIGATION] Calling GET /api/metatrader/account${queryParam}...`);
      const res = await apiFetch(`/api/metatrader/account${queryParam}`);
      console.log('[AppContext] [INVESTIGATION] GET /api/metatrader/account HTTP status:', res.status, res.statusText);
      if (res.ok) {
        const data = await res.json();
        console.log('[AppContext] [INVESTIGATION] Raw response data from GET /api/metatrader/account:', data);
        const accounts = data.accounts || (data.account ? [data.account] : (data.data?.accounts || (data.data?.account ? [data.data.account] : [])));
        console.log('[AppContext] [INVESTIGATION] Extracted accounts in AppContext:', accounts);
        if (accounts && accounts.length > 0) {
          setConnectedAccounts(accounts);
          try {
            localStorage.setItem('tarapti_connected_accounts', JSON.stringify(accounts));
          } catch {}

          let current = targetLogin ? accounts.find((a: any) => a.login === targetLogin || a.id === targetLogin) : null;
          if (!current) {
            current = (activeAccountLogin ? accounts.find((a: any) => a.login === activeAccountLogin || a.id === activeAccountLogin) : null) || accounts[0];
          }
          if (!activeAccountLogin || !accounts.some((a: any) => a.login === activeAccountLogin)) {
            setActiveAccountLogin(current.login);
          }

          const brokerName = accounts.length > 1
            ? `${accounts.length} Akun Terhubung (${current.broker || 'MT5'})`
            : (current.broker || (current.server ? current.server.split('-')[0] : 'MetaTrader'));
            
          setConnectedBroker({ broker: brokerName, accountId: current.login, platform: current.platform, server: current.server });
          console.log('[AppContext] [INVESTIGATION] Updated connectedBroker state:', { broker: brokerName, accountId: current.login, platform: current.platform, server: current.server });
          
          const totalEquity = accounts.reduce((sum: number, acc: any) => sum + (Number(acc.equity) || 0), 0);

          // Fetch synced trades specifically for active account
          const tradesQueryParams = new URLSearchParams();
          if (current?.login) {
            tradesQueryParams.set('login', current.login);
            tradesQueryParams.set('accountId', current.id || current.login);
          }
          const tradesRes = await apiFetch(`/api/metatrader/trades?${tradesQueryParams.toString()}`);
          if (tradesRes.ok) {
            const rawTradesRes = await tradesRes.json();
            const trades = rawTradesRes.trades || rawTradesRes.data?.trades || rawTradesRes || [];
            console.log('[AppContext] [INVESTIGATION] Synced trades count for account', current.login, ':', trades?.length);
            
            // Calculate real-time stats based on the synced trades (excluding balance deals)
            const isBalance = (t: any) => {
              const typeStr = String(t.type || '').toUpperCase();
              return typeStr === 'BALANCE' || typeStr === 'DEPOSIT' || typeStr === 'WITHDRAWAL' || (!t.symbol && Number(t.pl) !== 0);
            };
            const closedTrades = (trades || []).filter((t: any) => t.closeTime && !isBalance(t));
            const wins = closedTrades.filter((t: any) => t.pl > 0).length;
            const winRateStr = closedTrades.length > 0 ? `${Math.round((wins / closedTrades.length) * 100)}%` : '0%';
            
            const todayStr = new Date().toISOString().substring(0, 10);
            const todayTrades = closedTrades.filter((t: any) => t.closeTime.startsWith(todayStr));
            const todayPLValue = todayTrades.reduce((acc: number, t: any) => acc + t.pl, 0);
            
            setTradingStats({
              portfolio: `$${Number(current.equity ?? totalEquity).toLocaleString('en-US', { maximumFractionDigits: 0 })}`,
              todayPL: todayPLValue >= 0 ? `+$${Math.round(todayPLValue)}` : `-$${Math.round(Math.abs(todayPLValue))}`,
              winRate: winRateStr,
              streak: "12d",
              tradesLoggedToday: todayTrades.length,
              dailyTradeGoal: 6
            });
          }
          return accounts;
        } else {
          console.log('[AppContext] No connected accounts found in backend. Clearing local state & cache.');
          setConnectedBroker(null);
          setConnectedAccounts([]);
          setActiveAccountLogin(null);
          try {
            localStorage.removeItem('tarapti_connected_accounts');
            localStorage.removeItem('tarapti_broker');
            localStorage.removeItem('tarapti_active_mt_login');
          } catch {}
          setTradingStats({
            portfolio: "$0.00",
            todayPL: "$0.00",
            winRate: "0%",
            streak: "0d",
            tradesLoggedToday: 0,
            dailyTradeGoal: 5
          });
          return [];
        }
      } else if (res.status === 404 || res.status === 401) {
        console.log('[AppContext] GET /api/metatrader/account returned 404/401, clearing accounts cache.');
        setConnectedBroker(null);
        setConnectedAccounts([]);
        setActiveAccountLogin(null);
        try {
          localStorage.removeItem('tarapti_connected_accounts');
          localStorage.removeItem('tarapti_broker');
          localStorage.removeItem('tarapti_active_mt_login');
        } catch {}
      } else {
        console.warn('[AppContext] [INVESTIGATION] GET /api/metatrader/account non-ok status:', res.status);
      }
    } catch (e) {
      console.error("[AppContext] [INVESTIGATION] Error fetching MetaTrader data:", e);
    }
    return [];
  };

  const syncMetaTrader = async () => {
    try {
      console.log('[AppContext] [INVESTIGATION] Calling POST /api/metatrader/sync...');
      const res = await apiFetch('/api/metatrader/sync', { method: 'POST' });
      console.log('[AppContext] [INVESTIGATION] POST /api/metatrader/sync status:', res.status);
      if (res.ok) {
        await fetchMetaTraderData();
      }
    } catch (err) {
      console.error("[AppContext] [INVESTIGATION] Error syncing MetaTrader:", err);
    }
  };

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;

    const channel = supabase
      .channel('posts-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'Post' },
        (payload) => {
          const newPost = deserializePost(payload.new);
          
          if (newPost.groupId) return;

          // If current user created it, update directly (optimistic swap)
          if (currentUser?.id && newPost.userId === currentUser.id) {
            setPosts(prev => {
              if (prev.some(p => p.id === newPost.id)) return prev;
              const filtered = prev.filter(p => !(p.isSending && p.userId === newPost.userId && p.content === newPost.content));
              return [newPost, ...filtered].slice(0, 200);
            });
          } else {
            // Someone else posted! Queue it up.
            setNewPostsQueue(prev => {
              if (prev.some(p => p.id === newPost.id)) return prev;
              return [newPost, ...prev];
            });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'Post' },
        (payload) => {
          setPosts(prev => prev.filter(p => p.id !== payload.old.id));
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'Post' },
        (payload) => {
          const updatedPost = deserializePost(payload.new);
          setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
        }
      )
      .subscribe((status, err) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.warn(`Supabase Realtime subscription notice (${status}):`, err?.message || err || 'Connection reset');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id]);

  const fetchPosts = useCallback(async (force = false) => {
    // Only show global loader if we have NO posts cached
    if (postsRef.current.length === 0) {
      setLoadingPosts(true);
    }
    
    try {
      const res = await apiFetch(`/api/posts?currentUserId=${currentUser?.id}`);
      if (isJsonResponse(res)) {
        const data = await res.json();
        setPosts(data);
        savePostsToCache(data);
      }
    } catch (e) {
      console.error("error fetching posts:", e);
    } finally {
      setLoadingPosts(false);
    }
  }, [currentUser?.id]);

  const fetchNotifications = async () => {
    if (!currentUser) return;
    try {
      const res = await apiFetch(`/api/notifications/${currentUser.id}?_t=${Date.now()}`);
      if (isJsonResponse(res)) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {
      console.error("error fetching notifications:", e);
    }
  };

  const markNotificationRead = async (id: string) => {
    const previous = notifications;
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    try {
      const res = await apiFetch(`/api/notifications/${id}/read`, { method: 'PUT' });
      if (!res.ok) {
        setNotifications(previous);
        console.error("Failed to mark notification as read on server, rolling back");
      }
    } catch (e) {
      setNotifications(previous);
      console.error("Error marking notification as read:", e);
    }
  };

  const markAllNotificationsRead = async () => {
    if (!currentUser) return;
    const previous = notifications;
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      const res = await apiFetch(`/api/notifications/user/${currentUser.id}/read-all`, { method: 'PUT' });
      if (!res.ok) {
        setNotifications(previous);
        console.error("Failed to mark all notifications as read on server, rolling back");
      }
    } catch (e) {
      setNotifications(previous);
      console.error("Error marking all notifications as read:", e);
    }
  };

  const deleteNotification = async (id: string) => {
    const previous = notifications;
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      const res = await apiFetch(`/api/notifications/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        setNotifications(previous);
        showToast("Gagal menghapus notifikasi");
        console.error("Failed to delete notification on server, rolling back");
      }
    } catch (e) {
      setNotifications(previous);
      showToast("Gagal menghapus notifikasi");
      console.error("Error deleting notification:", e);
    }
  };

  const fetchSessions = async () => {
    if (!currentUser) return;
    try {
      const res = await apiFetch(`/api/messages/sessions/${currentUser.id}?_t=${Date.now()}`);
      if (isJsonResponse(res)) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (e) {
      console.error("error send:", e);
    }
  };

  const markSessionAsRead = (partnerId: string) => {
    setSessions(prev => prev.map(s => s.userId === partnerId ? { ...s, unreadCount: 0 } : s));
    fetchChatHistory(partnerId);
  };

  const fetchChatHistory = async (partnerId: string) => {
    if (!currentUser) return;
    try {
      const res = await apiFetch(`/api/messages/history?userId=${currentUser.id}&partnerId=${partnerId}&_t=${Date.now()}`);
      if (isJsonResponse(res)) {
        const data = await res.json();
        setChatHistory(data);
        setSessions(prev => prev.map(s => s.userId === partnerId ? { ...s, unreadCount: 0 } : s));
        fetchSessions();
      }
    } catch (e) {
      console.error("error send:", e);
    }
  };

  const sendMessage = async (partnerId: string, content: string, image?: string, fileUrl?: string, fileName?: string) => {
    if (!currentUser) return;
    try {
      const res = await apiFetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: currentUser.id, receiverId: partnerId, content, image, fileUrl, fileName })
      });
      if (isJsonResponse(res)) {
        const newMsg = await res.json();
        setChatHistory(prev => [...prev, newMsg]);
        fetchChatHistory(partnerId);
        fetchSessions();
      } else if (!res.ok) {
        const err = await res.text();
        console.error("SendMessage failed:", res.status, err);
      }
    } catch (e) {
      console.error("error send:", e);
    }
  };

  const reactToMessage = async (messageId: string, emoji: string) => {
    if (!currentUser) return;
    try {
      const res = await apiFetch(`/api/messages/${messageId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id, emoji })
      });
      if (isJsonResponse(res)) {
        const { reactions } = await res.json();
        setChatHistory(prev => prev.map(m => m.id === messageId ? { ...m, reactions } : m));
      }
    } catch (e) {
      console.error("error send:", e);
    }
  };

  const connectBroker = async (broker: string, accountId: string, platform = 'MT5', password = 'password', server = '') => {
    try {
      const res = await apiFetch('/api/metatrader/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, login: accountId, password, server: server || broker, broker })
      });
      if (res.ok) {
        await fetchMetaTraderData();
        showToast("Successfully connected MetaTrader Account! Syncing live trades...");
      } else {
        showToast("Failed to connect MetaTrader account. Please try again.");
      }
    } catch (err) {
      console.error(err);
      showToast("Connection error. Try again.");
    }
  };

  const disconnectBroker = async () => {
    try {
      const res = await apiFetch('/api/metatrader/disconnect', {
        method: 'POST'
      });
      if (res.ok) {
        setConnectedBroker(null);
        localStorage.removeItem('tarapti_broker');
        setTradingStats({
          portfolio: "$0.00",
          todayPL: "$0.00",
          winRate: "0%",
          streak: "0d",
          tradesLoggedToday: 0,
          dailyTradeGoal: 5
        });
        showToast("MetaTrader account disconnected.");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const [pendingConnections, setPendingConnections] = useState<any[]>([]);

  const fetchPendingConnections = async () => {
    if (!currentUser) return;
    try {
      const res = await apiFetch(`/api/users/${currentUser.id}/pending-connections?_t=${Date.now()}`);
      if (isJsonResponse(res)) {
        const data = await res.json();
        setPendingConnections(data || []);
      }
    } catch (e) {
      console.error("fetchPendingConnections error:", e);
    }
  };

  const sendConnectionRequest = async (targetId: string) => {
    if (!currentUser) return;
    try {
      const res = await apiFetch('/api/users/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requesterId: currentUser.id, receiverId: targetId })
      });
      if (res.ok) {
        showToast("Connection request sent!");
      }
    } catch (e) {
      console.error("error send:", e);
    }
  };

  const acceptConnectionRequest = async (targetId: string) => {
    if (!currentUser) return;
    try {
      const res = await apiFetch('/api/users/connect/accept', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requesterId: targetId, receiverId: currentUser.id })
      });
      if (res.ok) {
        showToast("Connection accepted!");
        fetchNotifications();
        fetchPendingConnections();
      }
    } catch (e) {
      console.error("error send:", e);
    }
  };

  const declineConnectionRequest = async (targetId: string) => {
    if (!currentUser) return;
    try {
      const res = await apiFetch('/api/users/connect/decline', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requesterId: targetId, receiverId: currentUser.id })
      });
      if (res.ok) {
        showToast("Connection request declined.");
        fetchNotifications();
        fetchPendingConnections();
      }
    } catch (e) {
      console.error("error send:", e);
    }
  };

  const getConnectionStatus = async (targetId: string) => {
    if (!currentUser) return 'none';
    try {
      const res = await apiFetch(`/api/users/${currentUser.id}/connection-status/${targetId}`);
      if (res.ok) {
        const data = await res.json();
        return data.status;
      }
    } catch (e) {
      console.error("error send:", e);
    }
    return 'none';
  };

  const viewUserProfile = (userId: string) => {
    if (userId === currentUser?.id) {
      setActiveView('profile');
    } else {
      setSelectedUserId(userId);
      setActiveView('user-profile');
    }
  };

  const logApiDiagnostic = (actionName: string, req: { url: string; method: string; headers?: any; body?: any }, res?: Response, data?: any, err?: any) => {
    const timestamp = new Date().toISOString();
    console.group(`[API DIAGNOSTIC] ${actionName} @ ${timestamp}`);
    console.log("Request URL:", req.url);
    console.log("Request Method:", req.method);
    console.log("Request Headers:", req.headers || {});
    console.log("Request Payload:", req.body);
    if (res) {
      console.log("Response Status Code:", res.status, res.statusText);
      console.log("Response OK:", res.ok);
    }
    if (data !== undefined) {
      console.log("Response Data:", data);
    }
    if (err) {
      console.error("Diagnostic Error:", err);
    }
    console.groupEnd();
  };

  const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;
  const unreadMessagesCount = sessions.reduce((acc, s) => acc + s.unreadCount, 0);

  return (
    <AppContext.Provider value={{
      currentUser,
      setCurrentUser,
      posts,
      setPosts,
      loadingPosts,
      fetchPosts,
      newPostsQueue,
      flushNewPostsQueue,
      stories,
      fetchStories,
      addStory,
      recordStoryView,
      notifications,
      setNotifications,
      fetchNotifications,
      markNotificationRead,
      markAllNotificationsRead,
      deleteNotification,
      unreadNotificationsCount,
      sessions,
      fetchSessions,
      markSessionAsRead,
      unreadMessagesCount,
      activeChatPartnerId,
      setActiveChatPartnerId,
      chatHistory,
      fetchChatHistory,
      sendMessage,
      reactToMessage,
      connectedBroker,
      connectBroker,
      disconnectBroker,
      syncMetaTrader,
      connectedAccounts,
      setConnectedAccounts,
      activeAccountLogin,
      setActiveAccountLogin,
      activeAccount,
      fetchMetaTraderData,
      tradingStats,
      setTradingStats,
      toastMessage,
      setToastMessage,
      showToast,
      pendingConnections,
      fetchPendingConnections,
      sendConnectionRequest,
      acceptConnectionRequest,
      declineConnectionRequest,
      getConnectionStatus,
      activeView,
      setActiveView,
      journalInitialTab,
      setJournalInitialTab,
      outlookInitialTab,
      setOutlookInitialTab,
      selectedUserId,
      setSelectedUserId,
      viewUserProfile,
      latestRealtimeEvent,
      clearRealtimeEvent,
      triggerTestNotification,
      logApiDiagnostic
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
