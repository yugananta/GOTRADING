import React, { createContext, useContext, useState, ReactNode } from 'react';
import { User, Post, TradingStats } from '../types';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: React.Dispatch<React.SetStateAction<User | null>>;
  activeView: string;
  setActiveView: (view: string) => void;
  viewingUserId: string | null;
  setViewingUserId: (id: string | null) => void;
  viewUserProfile: (id: string) => void;
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  tradingStats: TradingStats;
  showToast: (msg: string) => void;
  unreadNotifications: number;
  unreadMessages: number;
  activeChatPartnerId: string | null;
  setActiveChatPartnerId: (id: string | null) => void;
}

const initialUser: User = {
  id: 'u1',
  firstName: 'Alex',
  lastName: 'Morgan',
  username: 'alex_trader',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  bio: 'Full-time Forex & Commodities Swing Trader. Risk manager first.',
  location: 'Jakarta, Indonesia'
};

const initialPosts: Post[] = [
  {
    id: 'p1',
    author: {
      id: 'u2',
      name: 'Budi Santoso',
      username: 'buditrader',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'
    },
    content: 'Setup XAUUSD (Gold) H4 timeframe - potensi retest demand zone 2495-2500 sebelum melanjut bullish rally ke ATH baru. Selalu gunakan stop loss!',
    createdAt: '15 menit lalu',
    likes: 24,
    commentsCount: 6,
    chart: { pair: 'XAUUSD', status: 'WIN' }
  },
  {
    id: 'p2',
    author: {
      id: 'u3',
      name: 'Siti Rahma',
      username: 'siti_fx',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'
    },
    content: 'EURUSD breakdown key support 1.0850 pasca rilis data US GDP. Target bearish berikutnya di 1.0800.',
    createdAt: '1 jam lalu',
    likes: 18,
    commentsCount: 3,
    chart: { pair: 'EURUSD', status: 'ANALYSIS' }
  }
];

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(initialUser);
  const [activeView, setActiveView] = useState('feed');
  const [viewingUserId, setViewingUserId] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [unreadNotifications, setUnreadNotifications] = useState(2);
  const [unreadMessages, setUnreadMessages] = useState(1);
  const [activeChatPartnerId, setActiveChatPartnerId] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const tradingStats: TradingStats = {
    portfolio: '$24,850.00',
    todayPL: '+$1,240.00 (+5.2%)',
    winRate: '76.4%',
    streak: '5 Trades'
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const viewUserProfile = (id: string) => {
    setViewingUserId(id);
    setActiveView('profile');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        activeView,
        setActiveView,
        viewingUserId,
        setViewingUserId,
        viewUserProfile,
        posts,
        setPosts,
        tradingStats,
        showToast,
        unreadNotifications,
        unreadMessages,
        activeChatPartnerId,
        setActiveChatPartnerId
      }}
    >
      {children}

      {toastMessage && (
        <div className="fixed bottom-20 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl text-xs font-bold animate-in fade-in slide-in-from-bottom-3 border border-slate-700">
          {toastMessage}
        </div>
      )}
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
