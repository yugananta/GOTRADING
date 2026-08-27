import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Post, NotificationItem, TradingSession, ChatMessage, ConnectionRequest } from '../types.js';
import { apiFetch } from '../utils/apiFetch.js';

interface TradingStats {
  portfolio: string;
  todayPL: string;
  winRate: string;
  streak: string;
  tradesLoggedToday: number;
  dailyTradeGoal: number;
}

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  notifications: NotificationItem[];
  setNotifications: React.Dispatch<React.SetStateAction<NotificationItem[]>>;
  sessions: TradingSession[];
  setSessions: React.Dispatch<React.SetStateAction<TradingSession[]>>;
  activeChatPartnerId: string | null;
  setActiveChatPartnerId: React.Dispatch<React.SetStateAction<string | null>>;
  chatHistory: ChatMessage[];
  fetchChatHistory: (partnerId: string) => Promise<void>;
  sendMessage: (partnerId: string, text: string) => Promise<void>;
  reactToMessage: (messageId: string, emoji: string) => Promise<void>;
  connectedBroker: any;
  connectBroker: (brokerData: any) => void;
  disconnectBroker: () => void;
  tradingStats: TradingStats;
  setTradingStats: React.Dispatch<React.SetStateAction<TradingStats>>;
  toastMessage: string | null;
  setToastMessage: React.Dispatch<React.SetStateAction<string | null>>;
  showToast: (msg: string, durationMs?: number) => void;
  pendingConnections: ConnectionRequest[];
  sendConnectionRequest: (targetUserId: string) => Promise<void>;
  acceptConnectionRequest: (requestId: string) => Promise<void>;
  declineConnectionRequest: (requestId: string) => Promise<void>;
  getConnectionStatus: (targetUserId: string) => 'none' | 'pending_sent' | 'pending_received' | 'connected';
  activeView: string;
  setActiveView: (view: string) => void;
  selectedUserId: string | null;
  setSelectedUserId: (id: string | null) => void;
  viewUserProfile: (id: string) => void;
  latestRealtimeEvent: any;
  clearRealtimeEvent: () => void;
  triggerTestNotification: () => void;
  logApiDiagnostic: (endpoint: string, status: string, details?: any) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('tarapti_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      id: 'u1',
      username: 'alex_trader',
      firstName: 'Alex',
      lastName: 'Morgan',
      email: 'alex@example.com',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      role: 'trader',
      bio: 'Forex & Commodities swing trader. Risk manager first.',
      location: 'Jakarta, Indonesia',
      joinedDate: '2024-01-15'
    };
  });

  const [posts, setPosts] = useState<Post[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [sessions, setSessions] = useState<TradingSession[]>([]);
  const [activeChatPartnerId, setActiveChatPartnerId] = useState<string | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [connectedBroker, setConnectedBroker] = useState<any>(null);
  const [activeView, setActiveView] = useState<string>('feed');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [latestRealtimeEvent, setLatestRealtimeEvent] = useState<any>(null);
  const [pendingConnections, setPendingConnections] = useState<ConnectionRequest[]>([]);

  const [tradingStats, setTradingStats] = useState<TradingStats>({
    portfolio: "$12,420",
    todayPL: "+$248",
    winRate: "62%",
    streak: "7d",
    tradesLoggedToday: 3,
    dailyTradeGoal: 5
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string, durationMs: number = 3000) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => prev === msg ? null : prev);
    }, durationMs);
  };

  const connectBroker = (brokerData: any) => {
    setConnectedBroker(brokerData);
    showToast(`Connected to ${brokerData.brokerName || 'Broker'}`);
  };

  const disconnectBroker = () => {
    setConnectedBroker(null);
    showToast('Broker disconnected');
  };

  const fetchChatHistory = async (partnerId: string) => {
    try {
      const res = await apiFetch(`/api/messages/${partnerId}`);
      if (res.ok) {
        const data = await res.json();
        setChatHistory(data);
      }
    } catch (e) {
      console.error("Fetch chat error:", e);
    }
  };

  const sendMessage = async (partnerId: string, text: string) => {
    try {
      const res = await apiFetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: partnerId, content: text })
      });
      if (res.ok) {
        fetchChatHistory(partnerId);
      }
    } catch (e) {
      console.error("Send message error:", e);
    }
  };

  const reactToMessage = async (messageId: string, emoji: string) => {
    try {
      await apiFetch(`/api/messages/${messageId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji })
      });
      if (activeChatPartnerId) fetchChatHistory(activeChatPartnerId);
    } catch (e) {
      console.error("React message error:", e);
    }
  };

  const sendConnectionRequest = async (targetUserId: string) => {
    try {
      await apiFetch('/api/connections/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId })
      });
      showToast('Connection request sent');
    } catch (e) {
      console.error("Send connection error:", e);
    }
  };

  const acceptConnectionRequest = async (requestId: string) => {
    try {
      await apiFetch(`/api/connections/accept/${requestId}`, { method: 'POST' });
      setPendingConnections(prev => prev.filter(req => req.id !== requestId));
      showToast('Connection request accepted');
    } catch (e) {
      console.error("Accept connection error:", e);
    }
  };

  const declineConnectionRequest = async (requestId: string) => {
    try {
      await apiFetch(`/api/connections/decline/${requestId}`, { method: 'POST' });
      setPendingConnections(prev => prev.filter(req => req.id !== requestId));
    } catch (e) {
      console.error("Decline connection error:", e);
    }
  };

  const getConnectionStatus = (targetUserId: string): 'none' | 'pending_sent' | 'pending_received' | 'connected' => {
    return 'none';
  };

  const viewUserProfile = (id: string) => {
    setSelectedUserId(id);
    setActiveView('user-profile');
  };

  const clearRealtimeEvent = () => setLatestRealtimeEvent(null);

  const triggerTestNotification = () => {
    setLatestRealtimeEvent({
      type: 'notification',
      title: 'Market Alert',
      message: 'EURUSD broke key resistance level at 1.0850'
    });
  };

  const logApiDiagnostic = (endpoint: string, status: string, details?: any) => {
    console.log(`[API Diagnostic] ${endpoint} -> ${status}`, details);
  };

  return (
    <AppContext.Provider value={{
      currentUser,
      setCurrentUser,
      posts,
      setPosts,
      notifications,
      setNotifications,
      sessions,
      setSessions,
      activeChatPartnerId,
      setActiveChatPartnerId,
      chatHistory,
      fetchChatHistory,
      sendMessage,
      reactToMessage,
      connectedBroker,
      connectBroker,
      disconnectBroker,
      tradingStats,
      setTradingStats,
      toastMessage,
      setToastMessage,
      showToast,
      pendingConnections,
      sendConnectionRequest,
      acceptConnectionRequest,
      declineConnectionRequest,
      getConnectionStatus,
      activeView,
      setActiveView,
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
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
