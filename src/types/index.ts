// ApexTrader Admin - Core Type Definitions

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'INACTIVE' | 'PENDING_VERIFICATION';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string; // No WA
  city: string; // Kota
  province: string; // Provinsi
  country: string; // Negara
  registrationDate: string;
  status: UserStatus;
  isVerified: boolean; // true = Verified (Connected MT5 Account), false = Unverified (Registered App Only)
  isDormant: boolean; // true = Dormant Account (>30 Hari Tidak Aktif Trading)
  daysInactive: number; // Jumlah hari tidak aktif
  lastTradingActivity: string;
  tradingAccountsCount: number;
  mt5Account?: string;
  broker?: string;
  leverage?: string;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  lotsTraded: number;
  pnl: number;
  winRate: number;
  drawdown: number;
  lastLogin: string;
  avatarUrl?: string;
  partnerId?: string;
}

export type ConnectionStatus = 'CONNECTED' | 'SYNCING' | 'WARNING' | 'ERROR' | 'DISCONNECTED';

export interface TradingAccount {
  id: string;
  userId: string;
  userName: string;
  accountNumber: string;
  broker: string;
  server: string;
  accountType: 'DEMO' | 'REAL' | 'PROP_EVAL';
  currency: string;
  leverage: string;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  status: ConnectionStatus;
  lastSync: string;
  latencyMs: number;
  platform: 'MT4' | 'MT5' | 'cTrader' | 'Broker API';
}

export interface TradeRecord {
  id: string;
  userId: string;
  accountNumber: string;
  broker: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  lots: number;
  entryPrice: number;
  exitPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  openTime: string;
  closeTime?: string;
  profit: number;
  commission: number;
  swap: number;
  netPnl: number;
  status: 'OPEN' | 'CLOSED';
}

export type HealthRiskLevel = 'HEALTHY' | 'WARNING' | 'CRITICAL';

export interface TradingHealthRecord {
  userId: string;
  userName: string;
  accountNumber: string;
  riskLevel: HealthRiskLevel;
  dailyDrawdown: number;
  overallDrawdown: number;
  consecutiveLosses: number;
  tradesToday: number;
  riskPerTrade: number;
  dailyTarget: number;
  planComplianceScore: number;
  holdingTimeAvgMinutes: number;
  riskUtilizationPct: number; // e.g. 89% (if >= 80%, auto push notification is fired)
  maxAllowedDrawdownPct: number; // Default 10.0%
  autoPushTriggered: boolean; // Auto push notification status
  lastAutoPushTimestamp?: string;
  pushNotificationChannel?: string;
  lastWarningSent?: string;
  notes?: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  userName: string;
  date: string;
  symbol: string;
  direction: 'BUY' | 'SELL';
  entry: number;
  exit: number;
  resultPnl: number;
  emotion: 'Calm' | 'Anxious' | 'Greedy' | 'FOMO' | 'Disciplined';
  mistake?: string;
  strategy: string;
  tradingPlanName: string;
  notes: string;
  internalAdminNotes?: string;
}

export interface TradingPlanTemplate {
  id: string;
  name: string;
  dailyTargetPct: number;
  maxDailyLossPct: number;
  maxTradesPerDay: number;
  riskPerTradePct: number;
  maxConsecutiveLosses: number;
  preferredSessions: string[];
  rules: string[];
  activeUsersCount: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface SocialPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  title?: string;
  groupName?: string; // Feed Publik, Grup VIP Signals, Grup Master IB, dll.
  content: string;
  mediaUrls?: string[];
  hashtags: string[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  createdAt: string;
  isPinned: boolean; // Card post pinned
  isFeatured: boolean;
  status: 'PUBLISHED' | 'SCHEDULED' | 'UNPUBLISHED' | 'FLAGGED';
}

export interface SocialReport {
  id: string;
  reporterUserId: string;
  reporterName: string;
  targetType: 'POST' | 'COMMENT' | 'USER';
  targetId: string;
  reason: 'SPAM' | 'ABUSE' | 'MISINFORMATION' | 'SUSPICIOUS_TRADE';
  details: string;
  timestamp: string;
  status: 'PENDING' | 'APPROVED' | 'DISMISSED';
}

export interface Campaign {
  id: string;
  name: string;
  type: 'PROMOTION' | 'BONUS' | 'REWARD' | 'REFERRAL' | 'DEPOSIT_BOOST';
  description: string;
  startDate: string;
  endDate: string;
  requirement: string;
  reward: string;
  participantsCount: number;
  status: 'ACTIVE' | 'DRAFT' | 'COMPLETED' | 'EXPIRED';
  budgetUsd: number;
  claimedUsd: number;
}

export interface Competition {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  prizePoolUsd: number;
  rules: string;
  rankingMetric: 'PNL' | 'ROI' | 'VOLUME' | 'WIN_RATE';
  participantsCount: number;
  status: 'UPCOMING' | 'ONGOING' | 'FINISHED';
}

export interface CompetitionParticipant {
  rank: number;
  userId: string;
  userName: string;
  accountNumber: string;
  pnl: number;
  roiPct: number;
  volumeLots: number;
  winRatePct: number;
  tradesCount: number;
}

export interface FinancialTransaction {
  id: string;
  userId: string;
  userName: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'IB_COMMISSION';
  amount: number;
  method: 'CRYPTO_USDT' | 'BANK_WIRE' | 'CREDIT_CARD' | 'INTERNAL_TRANSFER';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  timestamp: string;
  txHashOrRef?: string;
  processedBy?: string;
}

export interface PartnerIB {
  id: string;
  email: string;
  role?: string;
  ib_region?: string;
  country?: string;
  province?: string;
  city?: string;
  created_at?: string;
  referral_code?: string;
  ib_tier_id?: string;
  referred_by?: string | null;
  ib_commission_tiers?: {
    name?: string;
    rate_per_lot?: number;
  };
  tier?: string;
  ratePerLot?: number;
  downlineCount?: number;
  activeDownline?: number;
  earnings?: {
    total: number;
    pending: number;
    approved: number;
    paid: number;
    void: number;
  };
  payouts?: {
    requested: number;
    paid: number;
  };
  // Backward compatibility
  partnerName?: string;
  type?: string;
  referredUsersCount?: number;
  activeTradersCount?: number;
  ftdCount?: number;
  totalDepositUsd?: number;
  totalVolumeLots?: number;
  earnedCommissionUsd?: number;
  tierPct?: number;
  commissionRatePct?: number;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  category: 'ACCOUNT' | 'TRADING' | 'PAYMENT' | 'TECHNICAL' | 'VERIFICATION' | 'GENERAL';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'ESCALATED';
  assignedStaff?: string;
  createdAt: string;
  lastUpdated: string;
  messages: {
    sender: 'USER' | 'STAFF' | 'SYSTEM';
    senderName: string;
    text: string;
    timestamp: string;
    isInternalNote?: boolean;
  }[];
}

export interface CMSContentItem {
  id: string;
  section: 'HOMEPAGE_HERO' | 'BANNER' | 'ANNOUNCEMENT' | 'ARTICLE' | 'FAQ' | 'POPUP';
  title: string;
  subtitle?: string;
  content: string;
  imageUrl?: string;
  actionUrl?: string;
  isActive: boolean;
  updatedAt: string;
}

export interface IntegrationService {
  id: string;
  name: string;
  provider: string;
  endpoint: string;
  status: ConnectionStatus;
  lastSync: string;
  lastError?: string;
  latencyMs: number;
  type: 'TRADING_SERVER' | 'DATABASE' | 'PAYMENT_GATEWAY' | 'NOTIFICATION' | 'SOCIAL_API';
}

export interface ApiCredential {
  id: string;
  integrationId: string;
  serviceName: string;
  maskedKey: string;
  environment: 'PRODUCTION' | 'SANDBOX';
  lastRotated: string;
  status: 'ACTIVE' | 'REVOKED';
}

export interface WebhookEndpoint {
  id: string;
  name: string;
  url: string;
  events: string[];
  status: 'ACTIVE' | 'DISABLED';
  lastRequestTime: string;
  lastResponseCode: number;
  successRatePct: number;
}

export type AdminRole = 'OWNER' | 'ADMIN' | 'MARKETING' | 'FINANCE' | 'SUPPORT' | 'ANALYST' | 'DEVELOPER';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  status: 'ACTIVE' | 'SUSPENDED';
  lastActive: string;
  twoFactorEnabled: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  adminName: string;
  adminRole: AdminRole;
  action: string;
  targetModule: string;
  targetId: string;
  ipAddress: string;
  device: string;
  details: string;
}

export interface SystemSettings {
  platformName: string;
  supportEmail: string;
  defaultCurrency: string;
  timezone: string;
  dailyDrawdownThresholdPct: number;
  overallDrawdownThresholdPct: number;
  maxDailyTradesLimit: number;
  sessionTimeoutMinutes: number;
  loginAttemptLimit: number;
  enforceTwoFactor: boolean;
}

export interface WaBlastCampaign {
  id: string;
  campaignName: string;
  targetSegment: string;
  totalRecipients: number;
  sentCount: number;
  deliveredCount: number;
  failedCount: number;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'SCHEDULED' | 'FAILED';
  createdAt: string;
  messageContent: string;
  mediaUrl?: string;
  delayPerMsgSeconds: number;
}

export interface EmailBlastCampaign {
  id: string;
  subject: string;
  templateName: string;
  targetSegment: string;
  totalRecipients: number;
  sentCount: number;
  openedCount: number;
  clickedCount: number;
  bounceCount: number;
  status: 'COMPLETED' | 'SENDING' | 'SCHEDULED' | 'DRAFT';
  createdAt: string;
  senderName: string;
  senderEmail: string;
  previewText?: string;
}
