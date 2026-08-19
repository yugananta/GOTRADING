export interface StoryViewer {
  userId: string;
  user?: {
    id: string;
    firstName: string;
    lastName?: string;
    username: string;
    avatar?: string;
  };
  viewedAt: string;
}

export interface Story {
  id: string;
  userId: string;
  user?: User;
  imageUrl: string;
  timestamp: number | string;
  viewed: boolean;
  viewers?: StoryViewer[];
}

export interface Connection {
  requesterId: string;
  receiverId: string;
  status: 'pending' | 'accepted' | 'declined';
  timestamp: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  first_name?: string;
  last_name?: string;
  username: string;
  email: string;
  whatsappNumber?: string;
  country: string;
  province: string;
  city: string;
  avatar: string;
  avatarUrl?: string;
  coverPhoto?: string;
  cover_photo?: string;
  headline: string;
  bio: string;
  tradingExperience: string; // "Beginner" | "Intermediate" | "Advanced" | "Pro Trader"
  trading_experience?: string;
  tradingAsset: string; // "Forex" | "Crypto" | "Stocks" | "Indices" | "Commodities"
  trading_asset?: string;
  onlineStatus: 'online' | 'offline';
  followersCount: number;
  followingCount: number;
  latitude?: number;
  longitude?: number;
  reputationPoints: number;
  marketPulseEnabled?: boolean;
  marketPulseAssets?: string[];
  connectionStatus?: 'none' | 'pending' | 'accepted' | 'declined' | 'received_pending';
  role?: 'admin' | 'user';
  mt5Connected?: boolean;
  isVerified?: boolean;
}

export interface ChartPoint {
  time: string;
  value: number;
}

export interface PostChart {
  pair: string;
  timeframe: string;
  status: 'Bullish' | 'Bearish' | 'Neutral';
  points: ChartPoint[];
}

export interface Post {
  id: string;
  userId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  authorRole: string; // "Pro Trader", "Intermediate", etc.
  authorCity?: string;
  authorCountry?: string;
  authorVerified?: boolean;
  title?: string;
  content: string;
  images?: string[];
  videoUrl?: string;
  likesCount: number;
  commentsCount: number;
  bookmarksCount: number;
  repostsCount: number;
  likedBy: string[]; // User IDs
  bookmarkedBy: string[]; // User IDs
  repostedBy: string[]; // User IDs
  timestamp: string;
  tags: string[];
  chart?: PostChart;
  isRepost?: boolean;
  originalAuthorName?: string;
  groupId?: string;
  isOfficial?: boolean;
  isPinned?: boolean;
  pinned?: boolean;
  is_pinned?: boolean;
  marketBias?: 'Bullish' | 'Bearish';
  isSending?: boolean;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  authorCity?: string;
  authorCountry?: string;
  authorVerified?: boolean;
  title?: string;
  content: string;
  timestamp: string;
}

export interface Notification {
  id: string;
  toUserId: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar: string;
  type: 'like' | 'comment' | 'reply' | 'follow' | 'mention' | 'message' | 'market_pulse' | 'friend_request' | 'friend_accepted' | 'repost' | 'profit_target_daily' | 'profit_target_weekly' | 'drawdown_daily' | 'drawdown_weekly' | 'high_news';
  message: string;
  isRead: boolean;
  timestamp: string;
  assetClass?: string;
  isVerified?: boolean;
}

export interface MessageReaction {
  userId: string;
  emoji: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  title?: string;
  content: string;
  image?: string;
  fileUrl?: string;
  fileName?: string;
  reactions?: MessageReaction[];
  timestamp: string;
  isRead: boolean;
  isDelivered: boolean;
  read_at?: string | null;
  readAt?: string | null;
}


export interface ChatSession {
  userId: string;
  username: string;
  city?: string;
  country?: string;
  firstName: string;
  lastName: string;
  avatar: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
  typing?: boolean;
  experience?: string;
  isGroup?: boolean;
  groupType?: string;
  isConnected?: boolean;
}

export interface MetaTraderAccount {
  id?: string;
  login: string;
  broker?: string;
  platform?: string;
  server?: string;
  balance?: number;
  equity?: number;
  margin?: number;
  marginFree?: number;
  margin_free?: number;
  leverage?: number;
  currency?: string;
  conn_status?: 'connected' | 'error' | 'reconnecting';
  error_message?: string;
  fetched_at?: string;
  // New backend computed metrics
  total_pnl?: number;
  totalPnl?: number;
  totalPnL?: number;
  performance_pct?: number;
  performancePct?: number;
  performancePercent?: number;
  drawdown_pct?: number;
  drawdownPct?: number;
  drawdownPercent?: number;
  max_drawdown?: number;
  maxDrawdown?: number;
  peak_equity?: number;
  peakEquity?: number;
  total_deposit?: number;
  totalDeposit?: number;
  total_withdrawal?: number;
  totalWithdrawal?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
  } | null;
}

export type AuthErrorCode =
  | 'AUTH_INVALID_CREDENTIALS'
  | 'AUTH_EMAIL_NOT_VERIFIED'
  | 'AUTH_ACCOUNT_SUSPENDED'
  | 'AUTH_INVALID_TOKEN'
  | 'AUTH_TOKEN_EXPIRED'
  | 'AUTH_RATE_LIMIT'
  | 'AUTH_INTERNAL_ERROR';

