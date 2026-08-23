import {
  UserProfile,
  TradingAccount,
  TradeRecord,
  TradingHealthRecord,
  JournalEntry,
  TradingPlanTemplate,
  SocialPost,
  SocialReport,
  Campaign,
  Competition,
  CompetitionParticipant,
  FinancialTransaction,
  PartnerIB,
  SupportTicket,
  CMSContentItem,
  IntegrationService,
  ApiCredential,
  WebhookEndpoint,
  AdminUser,
  AuditLog,
  SystemSettings,
  WaBlastCampaign,
  EmailBlastCampaign
} from '../types';

export const initialUsers: UserProfile[] = [
  {
    id: 'USR-9041',
    name: 'Budi Santoso',
    email: 'budi.santoso@gotrading.id',
    phone: '+62 812-3456-7890',
    city: 'Jakarta Selatan',
    province: 'DKI Jakarta',
    country: 'Indonesia',
    registrationDate: '2026-01-12',
    status: 'ACTIVE',
    isVerified: true, // Connect MT5
    isDormant: false,
    daysInactive: 2,
    lastTradingActivity: '2 hari yang lalu',
    tradingAccountsCount: 2,
    mt5Account: 'MT5-8829011',
    broker: 'IC Markets',
    leverage: '1:500',
    balance: 142500,
    equity: 148200,
    margin: 12500,
    freeMargin: 135700,
    lotsTraded: 420.5,
    pnl: 18450,
    winRate: 68.4,
    drawdown: 3.2,
    lastLogin: '10 mins ago',
    partnerId: 'IB-901'
  },
  {
    id: 'USR-8812',
    name: 'Rian Hidayat',
    email: 'rian.hidayat@gotrading.id',
    phone: '+62 819-8765-4321',
    city: 'Surabaya',
    province: 'Jawa Timur',
    country: 'Indonesia',
    registrationDate: '2026-02-04',
    status: 'ACTIVE',
    isVerified: true, // Connect MT5
    isDormant: false,
    daysInactive: 1,
    lastTradingActivity: '1 hari yang lalu',
    tradingAccountsCount: 3,
    mt5Account: 'MT5-9940122',
    broker: 'Exness',
    leverage: '1:1000',
    balance: 85200,
    equity: 82100,
    margin: 18000,
    freeMargin: 64100,
    lotsTraded: 210.0,
    pnl: -3100,
    winRate: 52.1,
    drawdown: 14.8,
    lastLogin: '2 hours ago',
    partnerId: 'IB-902'
  },
  {
    id: 'USR-7730',
    name: 'Hendra Wijaya',
    email: 'hendra.wijaya@gotrading.id',
    phone: '+62 813-1122-3344',
    city: 'Medan',
    province: 'Sumatera Utara',
    country: 'Indonesia',
    registrationDate: '2026-03-19',
    status: 'ACTIVE',
    isVerified: true, // Connect MT5
    isDormant: false,
    daysInactive: 0,
    lastTradingActivity: 'Hari ini',
    tradingAccountsCount: 1,
    mt5Account: 'MT5-7721094',
    broker: 'Pepperstone',
    leverage: '1:500',
    balance: 210000,
    equity: 224500,
    margin: 15000,
    freeMargin: 209500,
    lotsTraded: 580.0,
    pnl: 34200,
    winRate: 74.2,
    drawdown: 2.1,
    lastLogin: 'Just now',
    partnerId: 'IB-901'
  },
  {
    id: 'USR-6621',
    name: 'Dewi Lestari',
    email: 'dewi.lestari@gotrading.id',
    phone: '+62 856-7890-1234',
    city: 'Bandung',
    province: 'Jawa Barat',
    country: 'Indonesia',
    registrationDate: '2026-04-01',
    status: 'ACTIVE',
    isVerified: false, // UNVERIFIED: Belum connect MT5, hanya register app
    isDormant: false,
    daysInactive: 5,
    lastTradingActivity: 'Belum pernah trading (App Only)',
    tradingAccountsCount: 0,
    balance: 0,
    equity: 0,
    margin: 0,
    freeMargin: 0,
    lotsTraded: 0,
    pnl: 0,
    winRate: 0,
    drawdown: 0,
    lastLogin: '1 day ago',
    partnerId: 'IB-903'
  },
  {
    id: 'USR-5510',
    name: 'Agus Pratama',
    email: 'agus.pratama@gotrading.id',
    phone: '+62 878-9900-1122',
    city: 'Denpasar',
    province: 'Bali',
    country: 'Indonesia',
    registrationDate: '2026-05-15',
    status: 'ACTIVE',
    isVerified: false, // UNVERIFIED: Belum connect MT5, hanya register app
    isDormant: false,
    daysInactive: 12,
    lastTradingActivity: 'Belum pernah trading (App Only)',
    tradingAccountsCount: 0,
    balance: 0,
    equity: 0,
    margin: 0,
    freeMargin: 0,
    lotsTraded: 0,
    pnl: 0,
    winRate: 0,
    drawdown: 0,
    lastLogin: '3 days ago',
    partnerId: 'IB-904'
  },
  {
    id: 'USR-4401',
    name: 'Bambang Sukojo',
    email: 'bambang.s@gotrading.id',
    phone: '+62 821-4455-6677',
    city: 'Semarang',
    province: 'Jawa Tengah',
    country: 'Indonesia',
    registrationDate: '2025-11-20',
    status: 'INACTIVE',
    isVerified: true, // Connected MT5 tapi DORMANT >30 hari
    isDormant: true, // DORMANT > 30 Hari
    daysInactive: 48,
    lastTradingActivity: '48 hari yang lalu (2026-06-23)',
    tradingAccountsCount: 1,
    mt5Account: 'MT5-3301928',
    broker: 'XM Global',
    leverage: '1:500',
    balance: 15400,
    equity: 15400,
    margin: 0,
    freeMargin: 15400,
    lotsTraded: 85.0,
    pnl: 1200,
    winRate: 58.0,
    drawdown: 5.4,
    lastLogin: '30 days ago',
    partnerId: 'IB-902'
  },
  {
    id: 'USR-3302',
    name: 'Siti Nurhaliza',
    email: 'siti.nurhaliza@gotrading.id',
    phone: '+62 811-2233-4455',
    city: 'Makassar',
    province: 'Sulawesi Selatan',
    country: 'Indonesia',
    registrationDate: '2025-10-15',
    status: 'INACTIVE',
    isVerified: true, // Connected MT5 tapi DORMANT >30 hari
    isDormant: true, // DORMANT > 30 Hari
    daysInactive: 62,
    lastTradingActivity: '62 hari yang lalu (2026-06-09)',
    tradingAccountsCount: 1,
    mt5Account: 'MT5-2201994',
    broker: 'IC Markets',
    leverage: '1:500',
    balance: 8900,
    equity: 8900,
    margin: 0,
    freeMargin: 8900,
    lotsTraded: 42.0,
    pnl: -450,
    winRate: 48.0,
    drawdown: 8.2,
    lastLogin: '45 days ago',
    partnerId: 'IB-903'
  }
];

export const initialTradingAccounts: TradingAccount[] = [
  {
    id: 'ACC-5001',
    userId: 'USR-9041',
    userName: 'Alexander Wright',
    accountNumber: '8829011',
    broker: 'IC Markets',
    server: 'ICMarkets-Live05',
    accountType: 'REAL',
    currency: 'USD',
    leverage: '1:500',
    balance: 100000,
    equity: 104500,
    margin: 12500,
    freeMargin: 92000,
    status: 'CONNECTED',
    lastSync: '2 seconds ago',
    latencyMs: 18,
    platform: 'MT5'
  },
  {
    id: 'ACC-5002',
    userId: 'USR-9041',
    userName: 'Alexander Wright',
    accountNumber: '4410298',
    broker: 'Pepperstone',
    server: 'Pepperstone-Live01',
    accountType: 'REAL',
    currency: 'USD',
    leverage: '1:200',
    balance: 42500,
    equity: 43700,
    margin: 4500,
    freeMargin: 39200,
    status: 'CONNECTED',
    lastSync: '5 seconds ago',
    latencyMs: 24,
    platform: 'MT4'
  },
  {
    id: 'ACC-5003',
    userId: 'USR-8812',
    userName: 'Elena Rostova',
    accountNumber: '9940122',
    broker: 'FP Markets',
    server: 'FPMarkets-Live02',
    accountType: 'PROP_EVAL',
    currency: 'EUR',
    leverage: '1:100',
    balance: 85200,
    equity: 82100,
    margin: 18000,
    freeMargin: 64100,
    status: 'WARNING',
    lastSync: '12 seconds ago',
    latencyMs: 142,
    platform: 'MT5'
  },
  {
    id: 'ACC-5004',
    userId: 'USR-7730',
    userName: 'Marcus Vance',
    accountNumber: '7721094',
    broker: 'Exness',
    server: 'Exness-Real11',
    accountType: 'REAL',
    currency: 'USD',
    leverage: '1:2000',
    balance: 210000,
    equity: 224500,
    margin: 15000,
    freeMargin: 209500,
    status: 'CONNECTED',
    lastSync: '1 second ago',
    latencyMs: 12,
    platform: 'MT5'
  },
  {
    id: 'ACC-5005',
    userId: 'USR-6621',
    userName: 'David Chen',
    accountNumber: '3301928',
    broker: 'XM Global',
    server: 'XMGlobal-Real08',
    accountType: 'REAL',
    currency: 'USD',
    leverage: '1:500',
    balance: 45000,
    equity: 38400,
    margin: 22000,
    freeMargin: 16400,
    status: 'ERROR',
    lastSync: '15 mins ago',
    latencyMs: 890,
    platform: 'MT4'
  }
];

export const initialTrades: TradeRecord[] = [
  {
    id: 'TRD-9001',
    userId: 'USR-9041',
    accountNumber: '8829011',
    broker: 'IC Markets',
    symbol: 'EURUSD',
    type: 'BUY',
    lots: 5.0,
    entryPrice: 1.08450,
    exitPrice: 1.08920,
    stopLoss: 1.08200,
    takeProfit: 1.09100,
    openTime: '2026-08-10 01:15',
    closeTime: '2026-08-10 02:45',
    profit: 2350,
    commission: -35,
    swap: -5,
    netPnl: 2310,
    status: 'CLOSED'
  },
  {
    id: 'TRD-9002',
    userId: 'USR-7730',
    accountNumber: '7721094',
    broker: 'Exness',
    symbol: 'XAUUSD',
    type: 'BUY',
    lots: 10.0,
    entryPrice: 2410.50,
    exitPrice: 2428.00,
    stopLoss: 2398.00,
    takeProfit: 2435.00,
    openTime: '2026-08-10 00:30',
    closeTime: '2026-08-10 02:10',
    profit: 17500,
    commission: -70,
    swap: 0,
    netPnl: 17430,
    status: 'CLOSED'
  },
  {
    id: 'TRD-9003',
    userId: 'USR-6621',
    accountNumber: '3301928',
    broker: 'XM Global',
    symbol: 'GBPUSD',
    type: 'SELL',
    lots: 8.0,
    entryPrice: 1.2980,
    stopLoss: 1.3020,
    takeProfit: 1.2890,
    openTime: '2026-08-10 02:00',
    profit: -2400,
    commission: -56,
    swap: 0,
    netPnl: -2456,
    status: 'OPEN'
  }
];

export const initialHealthRecords: TradingHealthRecord[] = [
  {
    userId: 'USR-6621',
    userName: 'David Chen',
    accountNumber: '3301928',
    riskLevel: 'CRITICAL',
    dailyDrawdown: 8.9,
    overallDrawdown: 18.5,
    consecutiveLosses: 8,
    tradesToday: 32,
    riskPerTrade: 4.8,
    dailyTarget: 3.0,
    planComplianceScore: 32,
    holdingTimeAvgMinutes: 6,
    riskUtilizationPct: 89, // Exceeds 80% threshold -> Auto Push Fired
    maxAllowedDrawdownPct: 10.0,
    autoPushTriggered: true,
    lastAutoPushTimestamp: '2026-08-11 08:15:22',
    pushNotificationChannel: 'PUSH_MOBILE_APP (FCM)',
    lastWarningSent: '2026-08-11 08:15',
    notes: 'AUTOMATED PUSH SENT: Daily drawdown reached 89% of safety threshold (-8.9%). Immediate risk mitigation required.'
  },
  {
    userId: 'USR-8812',
    userName: 'Elena Rostova',
    accountNumber: '9940122',
    riskLevel: 'WARNING',
    dailyDrawdown: 8.2,
    overallDrawdown: 14.8,
    consecutiveLosses: 4,
    tradesToday: 14,
    riskPerTrade: 2.5,
    dailyTarget: 2.0,
    planComplianceScore: 68,
    holdingTimeAvgMinutes: 12,
    riskUtilizationPct: 82, // Exceeds 80% threshold -> Auto Push Fired
    maxAllowedDrawdownPct: 10.0,
    autoPushTriggered: true,
    lastAutoPushTimestamp: '2026-08-11 07:42:10',
    pushNotificationChannel: 'PUSH_MOBILE_APP (FCM)',
    lastWarningSent: '2026-08-09 18:20',
    notes: 'AUTOMATED PUSH SENT: Drawdown limit utilization at 82%. Overtrading alert pushed to user device.'
  },
  {
    userId: 'USR-9041',
    userName: 'Alexander Wright',
    accountNumber: '8810234',
    riskLevel: 'WARNING',
    dailyDrawdown: 8.5,
    overallDrawdown: 11.2,
    consecutiveLosses: 5,
    tradesToday: 19,
    riskPerTrade: 3.1,
    dailyTarget: 2.5,
    planComplianceScore: 54,
    holdingTimeAvgMinutes: 18,
    riskUtilizationPct: 85, // Exceeds 80% threshold -> Auto Push Fired
    maxAllowedDrawdownPct: 10.0,
    autoPushTriggered: true,
    lastAutoPushTimestamp: '2026-08-11 09:05:44',
    pushNotificationChannel: 'PUSH_MOBILE_APP (FCM)',
    notes: 'AUTOMATED PUSH SENT: Risk limit at 85%. Consecutive loss limit warning pushed.'
  },
  {
    userId: 'USR-7730',
    userName: 'Marcus Vance',
    accountNumber: '7721094',
    riskLevel: 'HEALTHY',
    dailyDrawdown: 0.8,
    overallDrawdown: 2.1,
    consecutiveLosses: 1,
    tradesToday: 4,
    riskPerTrade: 1.0,
    dailyTarget: 2.5,
    planComplianceScore: 96,
    holdingTimeAvgMinutes: 45,
    riskUtilizationPct: 25, // Below 80% -> Safe
    maxAllowedDrawdownPct: 10.0,
    autoPushTriggered: false,
    notes: 'Optimal discipline, strictly adhering to trading plan stop losses.'
  },
  {
    userId: 'USR-3042',
    userName: 'Siti Rahmawati (Surabaya)',
    accountNumber: '5519820',
    riskLevel: 'HEALTHY',
    dailyDrawdown: 3.5,
    overallDrawdown: 5.4,
    consecutiveLosses: 2,
    tradesToday: 8,
    riskPerTrade: 1.5,
    dailyTarget: 3.0,
    planComplianceScore: 88,
    holdingTimeAvgMinutes: 30,
    riskUtilizationPct: 35, // Below 80% -> Safe
    maxAllowedDrawdownPct: 10.0,
    autoPushTriggered: false,
    notes: 'Trading health stable within safe parameters.'
  }
];

export const initialJournalEntries: JournalEntry[] = [
  {
    id: 'JRN-101',
    userId: 'USR-9041',
    userName: 'Alexander Wright',
    date: '2026-08-09',
    symbol: 'EURUSD',
    direction: 'BUY',
    entry: 1.0845,
    exit: 1.0892,
    resultPnl: 2310,
    emotion: 'Disciplined',
    strategy: 'London Breakout & Re-test',
    tradingPlanName: 'Institutional Intraday Alpha',
    notes: 'Waited for Asian high sweep. Confirmation on 5m order block.',
    internalAdminNotes: 'Verified clean execution, compliant with risk guidelines.'
  },
  {
    id: 'JRN-102',
    userId: 'USR-6621',
    userName: 'David Chen',
    date: '2026-08-09',
    symbol: 'US30',
    direction: 'SELL',
    entry: 39400,
    exit: 39750,
    resultPnl: -4200,
    emotion: 'FOMO',
    mistake: 'Revenge Trading & Moving Stop Loss',
    strategy: 'Trend Following',
    tradingPlanName: 'Scalp 101',
    notes: 'Entered late after NFP news surge. Removed stop loss.',
    internalAdminNotes: 'User flagged for risk health evaluation.'
  }
];

export const initialPlans: TradingPlanTemplate[] = [
  {
    id: 'PLN-01',
    name: 'Institutional Intraday Alpha',
    dailyTargetPct: 2.0,
    maxDailyLossPct: 3.0,
    maxTradesPerDay: 5,
    riskPerTradePct: 1.0,
    maxConsecutiveLosses: 3,
    preferredSessions: ['London', 'New York'],
    rules: [
      'Risk maximum 1% per position',
      'Never trade 15 minutes before Tier-1 High Impact news',
      'Stop trading for the day after 2 consecutive losses'
    ],
    activeUsersCount: 142,
    status: 'ACTIVE'
  },
  {
    id: 'PLN-02',
    name: 'Gold Volatility Breakout',
    dailyTargetPct: 3.5,
    maxDailyLossPct: 4.0,
    maxTradesPerDay: 8,
    riskPerTradePct: 1.5,
    maxConsecutiveLosses: 2,
    preferredSessions: ['New York Overlap'],
    rules: [
      'Trade only XAUUSD and XAGUSD',
      'Always set trailing stop once +1.5R reached'
    ],
    activeUsersCount: 88,
    status: 'ACTIVE'
  }
];

export const initialSocialPosts: SocialPost[] = [
  {
    id: 'POST-401',
    userId: 'USR-7730',
    userName: 'Marcus Vance',
    userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    content: 'Gold just smashed through $2420 resistance level! Huge order flow absorption at $2410. Here is my breakdown chart.',
    hashtags: ['XAUUSD', 'GoldTrading', 'OrderFlow', 'FxAlpha'],
    likesCount: 184,
    commentsCount: 32,
    sharesCount: 14,
    createdAt: '1 hour ago',
    isPinned: true,
    isFeatured: true,
    status: 'PUBLISHED'
  },
  {
    id: 'POST-402',
    userId: 'USR-6621',
    userName: 'David Chen',
    userAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    content: 'Guaranteed 500% weekly return signal group! DM me for secret bot access and instant deposit doubling link.',
    hashtags: ['Signals', 'CryptoBonus', 'FreeMoney'],
    likesCount: 2,
    commentsCount: 8,
    sharesCount: 0,
    createdAt: '3 hours ago',
    isPinned: false,
    isFeatured: false,
    status: 'FLAGGED'
  }
];

export const initialSocialReports: SocialReport[] = [
  {
    id: 'REP-801',
    reporterUserId: 'USR-9041',
    reporterName: 'Alexander Wright',
    targetType: 'POST',
    targetId: 'POST-402',
    reason: 'SPAM',
    details: 'Promoting unverified high-yield investment scam / telegram link in social feed.',
    timestamp: '2 hours ago',
    status: 'PENDING'
  }
];

export const initialCampaigns: Campaign[] = [
  {
    id: 'CMP-101',
    name: 'Q3 Global Trader Welcome Bonus',
    type: 'BONUS',
    description: 'Get 50% tradable deposit bonus up to $2,500 on first live account funding.',
    startDate: '2026-07-01',
    endDate: '2026-09-30',
    requirement: 'Min Deposit $500, verify KYC Level 2',
    reward: '50% Credit Bonus',
    participantsCount: 420,
    status: 'ACTIVE',
    budgetUsd: 100000,
    claimedUsd: 64500
  },
  {
    id: 'CMP-102',
    name: 'IB Partner Growth Accelerator',
    type: 'REFERRAL',
    description: 'Earn extra $15 per lot on all sub-IB volume exceeding 500 lots monthly.',
    startDate: '2026-08-01',
    endDate: '2026-10-31',
    requirement: 'Active IB with 10+ funded referrals',
    reward: '$15/lot Tier Bonus',
    participantsCount: 38,
    status: 'ACTIVE',
    budgetUsd: 50000,
    claimedUsd: 18200
  }
];

export const initialCompetitions: Competition[] = [
  {
    id: 'CPT-501',
    name: 'Apex Trader Summer Forex Championship 2026',
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    prizePoolUsd: 50000,
    rules: 'Minimum 20 trades, max drawdown 10%, maximum leverage 1:500.',
    rankingMetric: 'ROI',
    participantsCount: 1240,
    status: 'ONGOING'
  }
];

export const initialParticipants: CompetitionParticipant[] = [
  {
    rank: 1,
    userId: 'USR-7730',
    userName: 'Marcus Vance',
    accountNumber: '7721094',
    pnl: 34200,
    roiPct: 48.6,
    volumeLots: 184.5,
    winRatePct: 74.2,
    tradesCount: 42
  },
  {
    rank: 2,
    userId: 'USR-9041',
    userName: 'Alexander Wright',
    accountNumber: '8829011',
    pnl: 18450,
    roiPct: 32.1,
    volumeLots: 120.0,
    winRatePct: 68.4,
    tradesCount: 35
  },
  {
    rank: 3,
    userId: 'USR-8812',
    userName: 'Elena Rostova',
    accountNumber: '9940122',
    pnl: 11200,
    roiPct: 24.8,
    volumeLots: 94.0,
    winRatePct: 58.1,
    tradesCount: 29
  }
];

export const initialTransactions: FinancialTransaction[] = [
  {
    id: 'TX-7001',
    userId: 'USR-7730',
    userName: 'Marcus Vance',
    type: 'DEPOSIT',
    amount: 50000,
    method: 'CRYPTO_USDT',
    status: 'APPROVED',
    timestamp: '2026-08-09 14:20',
    txHashOrRef: '0x7f82a9d1c082e...391a',
    processedBy: 'Finance Auto-Gateway'
  },
  {
    id: 'TX-7002',
    userId: 'USR-8812',
    userName: 'Elena Rostova',
    type: 'WITHDRAWAL',
    amount: 15000,
    method: 'BANK_WIRE',
    status: 'PENDING',
    timestamp: '2026-08-10 01:45',
    txHashOrRef: 'WIRE-20260810-8812'
  },
  {
    id: 'TX-7003',
    userId: 'USR-9041',
    userName: 'Alexander Wright',
    type: 'DEPOSIT',
    amount: 25000,
    method: 'CREDIT_CARD',
    status: 'APPROVED',
    timestamp: '2026-08-08 09:10',
    txHashOrRef: 'STRIPE-CH-992104',
    processedBy: 'Finance Officer (Sarah K)'
  }
];

export const initialPartners: PartnerIB[] = [
  {
    id: 'IB-101',
    partnerName: 'Global Capital Network',
    email: 'contact@globalcapnet.com',
    type: 'MASTER_IB',
    referredUsersCount: 340,
    activeTradersCount: 215,
    ftdCount: 180,
    totalDepositUsd: 2850000,
    totalVolumeLots: 14200.0,
    earnedCommissionUsd: 142000,
    tierPct: 10.0,
    commissionRatePct: 30
  },
  {
    id: 'IB-102',
    partnerName: 'EuroTrader Alliance',
    email: 'info@eurotrader.io',
    type: 'SUB_IB',
    referredUsersCount: 120,
    activeTradersCount: 78,
    ftdCount: 65,
    totalDepositUsd: 940000,
    totalVolumeLots: 4800.0,
    earnedCommissionUsd: 38400,
    tierPct: 8.0,
    commissionRatePct: 30
  }
];

export const initialTickets: SupportTicket[] = [
  {
    id: 'TCK-3001',
    userId: 'USR-6621',
    userName: 'David Chen',
    subject: 'MT4 Connection disconnects during high volatility news',
    category: 'TRADING',
    priority: 'HIGH',
    status: 'OPEN',
    assignedStaff: 'Dev Team / Tech Desk',
    createdAt: '2026-08-10 02:15',
    lastUpdated: '2026-08-10 02:30',
    messages: [
      {
        sender: 'USER',
        senderName: 'David Chen',
        text: 'My MT4 account 3301928 disconnected during NFP release and my stop loss failed to execute.',
        timestamp: '2026-08-10 02:15'
      },
      {
        sender: 'STAFF',
        senderName: 'Support Agent (Alex M)',
        text: 'Hello David, we have escalated this to senior engineering to inspect server latency logs around 02:00 UTC.',
        timestamp: '2026-08-10 02:30',
        isInternalNote: false
      }
    ]
  }
];

export const initialCMSContent: CMSContentItem[] = [
  {
    id: 'CMS-01',
    section: 'HOMEPAGE_HERO',
    title: 'Trade with Zero Slippage & Deep Institutional Liquidity',
    subtitle: 'Access 200+ Forex, Index, Commodity & Crypto CFDs on Ultra-Fast MT4/MT5 Infrastructure',
    content: 'Hero Banner Headline & Call to Action configuration for web & mobile dashboard.',
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800',
    actionUrl: '/register',
    isActive: true,
    updatedAt: '2026-08-01'
  },
  {
    id: 'CMS-02',
    section: 'ANNOUNCEMENT',
    title: 'MT5 Server Maintenance Scheduled for Aug 15th 22:00 UTC',
    content: 'Scheduled maintenance will last 30 minutes. Existing open positions will not be affected.',
    isActive: true,
    updatedAt: '2026-08-08'
  }
];

export const initialIntegrations: IntegrationService[] = [
  {
    id: 'INT-MT5-01',
    name: 'MetaTrader 5 Bridge Connector',
    provider: 'MetaQuotes Ltd',
    endpoint: 'https://mt5-bridge.apextrader.internal/v2/api',
    status: 'CONNECTED',
    lastSync: '1 sec ago',
    latencyMs: 14,
    type: 'TRADING_SERVER'
  },
  {
    id: 'INT-SUPA-01',
    name: 'Supabase PostgreSQL Cloud Cluster',
    provider: 'Supabase Inc.',
    endpoint: 'https://db-apextrader.supabase.co/rest/v1',
    status: 'CONNECTED',
    lastSync: 'Just now',
    latencyMs: 8,
    type: 'DATABASE'
  },
  {
    id: 'INT-STRIPE-01',
    name: 'Stripe Merchant Gateway',
    provider: 'Stripe',
    endpoint: 'https://api.stripe.com/v1',
    status: 'CONNECTED',
    lastSync: '5 mins ago',
    latencyMs: 42,
    type: 'PAYMENT_GATEWAY'
  },
  {
    id: 'INT-TG-01',
    name: 'Telegram Notification Bot',
    provider: 'Telegram Open API',
    endpoint: 'https://api.telegram.org/bot-token',
    status: 'WARNING',
    lastSync: '12 mins ago',
    lastError: 'HTTP 429 Rate limit backoff warning',
    latencyMs: 310,
    type: 'NOTIFICATION'
  }
];

export const initialCredentials: ApiCredential[] = [
  {
    id: 'CRED-101',
    integrationId: 'INT-MT5-01',
    serviceName: 'MetaTrader 5 Server Manager Key',
    maskedKey: 'mt5_live_sec_••••••••••••89a2',
    environment: 'PRODUCTION',
    lastRotated: '2026-07-15 11:20',
    status: 'ACTIVE'
  },
  {
    id: 'CRED-102',
    integrationId: 'INT-SUPA-01',
    serviceName: 'Supabase Service Role Key (Vault)',
    maskedKey: 'eyJhbGciOiJIUzI1NiI...••••••••••••x7q9',
    environment: 'PRODUCTION',
    lastRotated: '2026-06-01 09:00',
    status: 'ACTIVE'
  }
];

export const initialWebhooks: WebhookEndpoint[] = [
  {
    id: 'WH-01',
    name: 'Risk Engine Alert Listener',
    url: 'https://risk-sentinel.apextrader.com/hooks/health-event',
    events: ['trading_health.critical_alert', 'account.drawdown_exceeded'],
    status: 'ACTIVE',
    lastRequestTime: '2 mins ago',
    lastResponseCode: 200,
    successRatePct: 99.8
  },
  {
    id: 'WH-02',
    name: 'Finance Instant Deposit Dispatcher',
    url: 'https://finance-core.apextrader.com/hooks/deposit-confirmed',
    events: ['deposit.approved', 'withdrawal.requested'],
    status: 'ACTIVE',
    lastRequestTime: '18 mins ago',
    lastResponseCode: 200,
    successRatePct: 100.0
  }
];

export const initialAdmins: AdminUser[] = [
  {
    id: 'ADM-001',
    name: 'Owner (Master Control)',
    email: 'owner@apextrader.io',
    role: 'OWNER',
    status: 'ACTIVE',
    lastActive: 'Just now',
    twoFactorEnabled: true
  },
  {
    id: 'ADM-002',
    name: 'Sarah Jenkins',
    email: 'sarah.j@apextrader.io',
    role: 'FINANCE',
    status: 'ACTIVE',
    lastActive: '15 mins ago',
    twoFactorEnabled: true
  },
  {
    id: 'ADM-003',
    name: 'Marcus Brody',
    email: 'marcus.b@apextrader.io',
    role: 'MARKETING',
    status: 'ACTIVE',
    lastActive: '1 hour ago',
    twoFactorEnabled: false
  },
  {
    id: 'ADM-004',
    name: 'Alex Rivera',
    email: 'alex.r@apextrader.io',
    role: 'DEVELOPER',
    status: 'ACTIVE',
    lastActive: '5 mins ago',
    twoFactorEnabled: true
  }
];

export const initialAuditLogs: AuditLog[] = [
  {
    id: 'AUD-9001',
    timestamp: '2026-08-10 02:45:12',
    adminName: 'Owner (Master Control)',
    adminRole: 'OWNER',
    action: 'API KEY ROTATED',
    targetModule: 'Integrations / MT5',
    targetId: 'CRED-101',
    ipAddress: '192.168.1.104',
    device: 'Chrome 128 / macOS Sequoia',
    details: 'Rotated MT5 Server Manager API Secret Key. Fingerprint changed to fp_89a2.'
  },
  {
    id: 'AUD-9002',
    timestamp: '2026-08-10 01:50:30',
    adminName: 'Sarah Jenkins',
    adminRole: 'FINANCE',
    action: 'DEPOSIT APPROVED',
    targetModule: 'Finance',
    targetId: 'TX-7001',
    ipAddress: '10.0.4.12',
    device: 'Safari 18 / macOS',
    details: 'Approved $50,000 USDT Crypto deposit for user USR-7730 (Marcus Vance).'
  },
  {
    id: 'AUD-9003',
    timestamp: '2026-08-10 01:12:05',
    adminName: 'Owner (Master Control)',
    adminRole: 'OWNER',
    action: 'RISK WARNING SENT',
    targetModule: 'Trading Health',
    targetId: 'USR-6621',
    ipAddress: '192.168.1.104',
    device: 'Chrome 128 / macOS',
    details: 'Dispatched automated critical risk warning alert to David Chen (-8.9% DD).'
  }
];

export const defaultSystemSettings: SystemSettings = {
  platformName: 'ApexTrader Master Control',
  supportEmail: 'support@apextrader.io',
  defaultCurrency: 'USD',
  timezone: 'UTC',
  dailyDrawdownThresholdPct: 5.0,
  overallDrawdownThresholdPct: 15.0,
  maxDailyTradesLimit: 25,
  sessionTimeoutMinutes: 30,
  loginAttemptLimit: 5,
  enforceTwoFactor: true
};

export const initialWaCampaigns: WaBlastCampaign[] = [
  {
    id: 'WA-BLAST-01',
    campaignName: 'XAUUSD Scalping Signal & Deposit Bonus 100%',
    targetSegment: 'Trader Verified MT5',
    totalRecipients: 480,
    sentCount: 480,
    deliveredCount: 468,
    failedCount: 12,
    status: 'COMPLETED',
    createdAt: '2026-08-11 08:30:00',
    messageContent: '🔥 Sinyal XAUUSD Buy @ 2420.50 TP 2435.00! Dapatkan juga 100% Deposit Bonus khusus hari ini. Hubungi IB support anda.',
    mediaUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=600',
    delayPerMsgSeconds: 4
  },
  {
    id: 'WA-BLAST-02',
    campaignName: 'Undangan Exclusive Live Webinar Trading Psychology',
    targetSegment: 'Semua Registered Users',
    totalRecipients: 1250,
    sentCount: 1250,
    deliveredCount: 1210,
    failedCount: 40,
    status: 'COMPLETED',
    createdAt: '2026-08-10 14:15:00',
    messageContent: 'Halo {{name}}, ikuti Live Session khusus manajemen risiko & psikologi trading malam ini jam 19.00 WIB!',
    delayPerMsgSeconds: 3
  },
  {
    id: 'WA-BLAST-03',
    campaignName: 'Re-Engagement Bonus $50 NDB untuk Dormant Traders',
    targetSegment: 'Dormant Traders (>30 Hari)',
    totalRecipients: 320,
    sentCount: 180,
    deliveredCount: 175,
    failedCount: 5,
    status: 'IN_PROGRESS',
    createdAt: '2026-08-11 09:10:00',
    messageContent: 'Halo {{name}}, akun MT5 #{{mt5_acc}} Anda mendapatkan spesial kredit $50. Klaim sekarang sebelum hangus!',
    delayPerMsgSeconds: 5
  }
];

export const initialEmailCampaigns: EmailBlastCampaign[] = [
  {
    id: 'EMAIL-BLAST-01',
    subject: '📊 Market Outlook Mingguan & Analisis Teknikal Gold (XAU/USD)',
    templateName: 'Weekly Signal Roundup',
    targetSegment: 'Semua Registered Users',
    totalRecipients: 1540,
    sentCount: 1540,
    openedCount: 980,
    clickedCount: 412,
    bounceCount: 18,
    status: 'COMPLETED',
    createdAt: '2026-08-11 07:00:00',
    senderName: 'ApexTrader Market Analyst',
    senderEmail: 'analyst@apextrader.io',
    previewText: 'Simak analisa pergerakan harga XAUUSD dan NFP data release minggu ini.'
  },
  {
    id: 'EMAIL-BLAST-02',
    subject: '🎉 Payout Komisi IB Bulan Ini Telah Ditingkatkan Hingga 15%!',
    templateName: 'IB Commission Payout Statement',
    targetSegment: 'Sub-IB & Partner Network',
    totalRecipients: 185,
    sentCount: 185,
    openedCount: 162,
    clickedCount: 128,
    bounceCount: 2,
    status: 'COMPLETED',
    createdAt: '2026-08-09 10:30:00',
    senderName: 'ApexTrader IB Relations',
    senderEmail: 'ib-partner@apextrader.io',
    previewText: 'Selamat! Struktur komisi IB baru telah aktif. Cek estimasi komisi Anda.'
  },
  {
    id: 'EMAIL-BLAST-03',
    subject: '⚠️ Peringatan Penting: Evaluasi Margin & Drawdown Trading Anda',
    templateName: 'Risk Health Alert',
    targetSegment: 'High Risk Traders (Drawdown > 5%)',
    totalRecipients: 45,
    sentCount: 45,
    openedCount: 38,
    clickedCount: 22,
    bounceCount: 0,
    status: 'COMPLETED',
    createdAt: '2026-08-10 16:45:00',
    senderName: 'ApexTrader Risk Desk',
    senderEmail: 'risk-sentinel@apextrader.io',
    previewText: 'Mohon tinjau ulang alokasi lot dan margin akun trading MT5 Anda.'
  }
];
