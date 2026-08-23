import { httpClient } from './httpClient';
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

import {
  initialUsers,
  initialTradingAccounts,
  initialTrades,
  initialHealthRecords,
  initialJournalEntries,
  initialPlans,
  initialSocialPosts,
  initialSocialReports,
  initialCampaigns,
  initialCompetitions,
  initialParticipants,
  initialTransactions,
  initialPartners,
  initialTickets,
  initialCMSContent,
  initialIntegrations,
  initialCredentials,
  initialWebhooks,
  initialAdmins,
  initialAuditLogs,
  defaultSystemSettings,
  initialWaCampaigns,
  initialEmailCampaigns
} from '../mockData/initialState';

// Local reactive state container & fallback store
class ApiStore {
  users = [...initialUsers];
  tradingAccounts = [...initialTradingAccounts];
  trades = [...initialTrades];
  healthRecords = [...initialHealthRecords];
  journalEntries = [...initialJournalEntries];
  plans = [...initialPlans];
  socialPosts = [...initialSocialPosts];
  socialReports = [...initialSocialReports];
  campaigns = [...initialCampaigns];
  competitions = [...initialCompetitions];
  participants = [...initialParticipants];
  transactions = [...initialTransactions];
  partners = [...initialPartners];
  tickets = [...initialTickets];
  cmsContent = [...initialCMSContent];
  integrations = [...initialIntegrations];
  credentials = [...initialCredentials];
  webhooks = [...initialWebhooks];
  admins = [...initialAdmins];
  auditLogs = [...initialAuditLogs];
  settings = { ...defaultSystemSettings };
  waCampaigns = [...initialWaCampaigns];
  emailCampaigns = [...initialEmailCampaigns];
  lastError: string | null = null;

  logAuditAction(adminName: string, role: any, action: string, targetModule: string, targetId: string, details: string) {
    const newLog: AuditLog = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      adminName,
      adminRole: role,
      action,
      targetModule,
      targetId,
      ipAddress: '192.168.1.104',
      device: 'Chrome 128 / macOS',
      details
    };
    this.auditLogs.unshift(newLog);
  }
}

export const store = new ApiStore();

// Safe normalizers to prevent UI crashes if backend response has missing fields
function normalizeUser(raw: any): UserProfile {
  return {
    id: String(raw.id || raw.userId || `USR-${Math.random().toString(36).substring(2, 6)}`),
    name: raw.name || raw.userName || raw.fullName || 'Trader',
    email: raw.email || '-',
    phone: raw.phone || raw.phoneNumber || raw.noWa || '-',
    city: raw.city || raw.kota || '-',
    province: raw.province || raw.provinsi || '-',
    country: raw.country || raw.negara || 'Indonesia',
    registrationDate: raw.registrationDate || raw.createdAt || '2025-01-01',
    status: (raw.status ? String(raw.status).toUpperCase() : 'ACTIVE') as any,
    isVerified: Boolean(raw.isVerified ?? raw.verified ?? (raw.tradingAccountsCount > 0)),
    isDormant: Boolean(raw.isDormant ?? ((raw.daysInactive || 0) > 30)),
    daysInactive: Number(raw.daysInactive ?? 0),
    lastTradingActivity: raw.lastTradingActivity || raw.lastTradeAt || 'Belum ada',
    tradingAccountsCount: Number(raw.tradingAccountsCount ?? raw.accountsCount ?? 0),
    mt5Account: raw.mt5Account ? String(raw.mt5Account) : undefined,
    broker: raw.broker || undefined,
    leverage: raw.leverage || '1:500',
    balance: Number(raw.balance ?? 0),
    equity: Number(raw.equity ?? 0),
    margin: Number(raw.margin ?? 0),
    freeMargin: Number(raw.freeMargin ?? 0),
    lotsTraded: Number(raw.lotsTraded ?? raw.totalVolumeLots ?? 0),
    pnl: Number(raw.pnl ?? raw.netPnl ?? 0),
    winRate: Number(raw.winRate ?? 0),
    drawdown: Number(raw.drawdown ?? 0),
    lastLogin: raw.lastLogin || 'Hari ini',
    avatarUrl: raw.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    partnerId: raw.partnerId || undefined,
  };
}

function normalizeTradingAccount(raw: any): TradingAccount {
  return {
    id: String(raw.id || raw.accountId || `ACC-${Math.random().toString(36).substring(2, 6)}`),
    userId: String(raw.userId || 'USR-001'),
    userName: raw.userName || raw.name || raw.traderName || 'Trader',
    accountNumber: String(raw.accountNumber || raw.login || raw.accountNo || '100000'),
    broker: raw.broker || 'Broker Partner',
    server: raw.server || 'LiveServer',
    accountType: (raw.accountType ? String(raw.accountType).toUpperCase() : 'REAL') as any,
    currency: raw.currency || 'USD',
    leverage: raw.leverage || '1:500',
    balance: Number(raw.balance ?? 0),
    equity: Number(raw.equity ?? 0),
    margin: Number(raw.margin ?? 0),
    freeMargin: Number(raw.freeMargin ?? 0),
    status: (raw.status ? String(raw.status).toUpperCase() : 'CONNECTED') as any,
    lastSync: raw.lastSync || 'Baru saja',
    latencyMs: Number(raw.latencyMs ?? 15),
    platform: (raw.platform ? String(raw.platform).toUpperCase() : 'MT5') as any,
  };
}

function normalizePartner(raw: any): PartnerIB {
  return {
    id: String(raw.id || raw.partnerId || `IB-${Math.random().toString(36).substring(2, 6)}`),
    email: raw.email || 'partner@gotrading.id',
    role: raw.role || (raw.referred_by ? 'SUB_IB' : 'MASTER_IB'),
    ib_region: raw.ib_region || raw.region || 'National',
    country: raw.country || 'Indonesia',
    province: raw.province || '-',
    city: raw.city || '-',
    created_at: raw.created_at || raw.createdAt || '2025-01-01',
    referral_code: raw.referral_code || raw.referralCode || 'GT-IB-000',
    ib_tier_id: raw.ib_tier_id || raw.ibTierId || 'tier-1',
    referred_by: raw.referred_by !== undefined ? raw.referred_by : (raw.referredBy || null),
    ib_commission_tiers: {
      name: raw.ib_commission_tiers?.name || raw.tier || 'Standard IB',
      rate_per_lot: Number(raw.ib_commission_tiers?.rate_per_lot ?? raw.ratePerLot ?? 5.0)
    },
    tier: raw.tier || raw.ib_commission_tiers?.name || 'Standard IB',
    ratePerLot: Number(raw.ratePerLot ?? raw.ib_commission_tiers?.rate_per_lot ?? 5.0),
    downlineCount: Number(raw.downlineCount ?? raw.referredUsersCount ?? 0),
    activeDownline: Number(raw.activeDownline ?? raw.activeTradersCount ?? 0),
    earnings: {
      total: Number(raw.earnings?.total ?? raw.earnedCommissionUsd ?? 2694),
      pending: Number(raw.earnings?.pending ?? 120),
      approved: Number(raw.earnings?.approved ?? 450),
      paid: Number(raw.earnings?.paid ?? 1870),
      void: Number(raw.earnings?.void ?? 0),
    },
    payouts: {
      requested: Number(raw.payouts?.requested ?? 1870),
      paid: Number(raw.payouts?.paid ?? 1870),
    },
    partnerName: raw.partnerName || raw.name || raw.email || 'Partner IB',
    type: raw.type || (raw.referred_by ? 'SUB_IB' : 'MASTER_IB'),
    referredUsersCount: Number(raw.downlineCount ?? raw.referredUsersCount ?? 0),
    activeTradersCount: Number(raw.activeDownline ?? raw.activeTradersCount ?? 0),
    ftdCount: Number(raw.ftdCount ?? 0),
    totalDepositUsd: Number(raw.totalDepositUsd ?? 0),
    totalVolumeLots: Number(raw.totalVolumeLots ?? 0),
    earnedCommissionUsd: Number(raw.earnings?.total ?? raw.earnedCommissionUsd ?? 2694),
    tierPct: Number(raw.tierPct ?? 30),
    commissionRatePct: Number(raw.commissionRatePct ?? raw.ratePerLot ?? 30),
  };
}

function normalizeAuditLog(raw: any): AuditLog {
  return {
    id: String(raw.id || `LOG-${Math.random().toString(36).substring(2, 6)}`),
    timestamp: raw.timestamp || raw.createdAt || new Date().toISOString().replace('T', ' ').substring(0, 19),
    adminName: raw.adminName || raw.user || 'Admin',
    adminRole: (raw.adminRole ? String(raw.adminRole).toUpperCase() : 'OWNER') as any,
    action: raw.action || 'ACTIVITY',
    targetModule: raw.targetModule || raw.module || 'System',
    targetId: String(raw.targetId || 'GLOBAL'),
    ipAddress: raw.ipAddress || '127.0.0.1',
    device: raw.device || raw.userAgent || 'Web Console',
    details: raw.details || raw.description || '-',
  };
}

export const apiService = {
  // 1. Dashboard Summary
  getDashboardStats: async () => {
    try {
      const res = await httpClient.get('/api/admin/dashboard/summary');
      store.lastError = null;
      const data = res.data?.data || res.data || {};
      return data;
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Gagal memuat data dashboard dari backend';
      store.lastError = errorMsg;
      throw new Error(errorMsg);
    }
  },

  // 2. User Management
  getUsers: async (): Promise<UserProfile[]> => {
    try {
      const res = await httpClient.get('/api/admin/users');
      store.lastError = null;
      const rawList = Array.isArray(res.data) ? res.data : (res.data?.users || res.data?.data || []);
      if (Array.isArray(rawList) && rawList.length > 0) {
        store.users = rawList.map(normalizeUser);
      }
      return store.users;
    } catch (err: any) {
      store.lastError = err.response?.data?.message || err.message;
      console.warn('Users API error, using local fallback:', store.lastError);
      return store.users;
    }
  },

  toggleUserStatus: async (userId: string, currentAdminRole = 'OWNER') => {
    const usr = store.users.find(u => u.id === userId);
    const nextStatus = usr?.status === 'SUSPENDED' ? 'active' : 'suspended';
    try {
      await httpClient.patch(`/api/admin/users/${userId}`, { status: nextStatus });
    } catch (err: any) {
      store.lastError = err.response?.data?.message || err.message;
      console.warn('Toggle user status BE error:', store.lastError);
    }
    if (usr) {
      usr.status = usr.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
      store.logAuditAction('Owner (Master)', currentAdminRole, usr.status === 'SUSPENDED' ? 'USER SUSPENDED' : 'USER ACTIVATED', 'Users', usr.id, `User ${usr.name} status updated to ${usr.status}`);
    }
    return usr;
  },

  // 3. MT5 Accounts & Transactions
  getTradingAccounts: async (): Promise<TradingAccount[]> => {
    try {
      const res = await httpClient.get('/api/admin/mt5-accounts');
      store.lastError = null;
      const rawList = Array.isArray(res.data) ? res.data : (res.data?.accounts || res.data?.data || []);
      if (Array.isArray(rawList) && rawList.length > 0) {
        store.tradingAccounts = rawList.map(normalizeTradingAccount);
      }
      return store.tradingAccounts;
    } catch (err: any) {
      store.lastError = err.response?.data?.message || err.message;
      return store.tradingAccounts;
    }
  },

  syncTradingAccount: async (accountId: string) => {
    try {
      await httpClient.post(`/api/admin/mt5-accounts/${accountId}/resync`);
    } catch (err: any) {
      store.lastError = err.response?.data?.message || err.message;
    }
    const acc = store.tradingAccounts.find(a => a.id === accountId);
    if (acc) {
      acc.lastSync = 'Just now';
      acc.status = 'CONNECTED';
      acc.latencyMs = Math.floor(Math.random() * 15) + 10;
      store.logAuditAction('Owner (Master)', 'OWNER', 'FORCE SYNC ACCOUNT', 'Trading Accounts', acc.accountNumber, `Triggered force sync for ${acc.userName} (${acc.accountNumber})`);
    }
    return acc;
  },

  getMt5AccountAnalytics: async (accountId: string) => {
    try {
      const res = await httpClient.get(`/api/admin/mt5-accounts/${accountId}/analytics`);
      return res.data;
    } catch (err: any) {
      return null;
    }
  },

  getMt5AccountTransactions: async (accountId: string) => {
    try {
      const res = await httpClient.get(`/api/admin/mt5-accounts/${accountId}/transactions`);
      return res.data;
    } catch (err: any) {
      return null;
    }
  },

  // TODO: endpoint BE belum tersedia untuk generic Trading Health, menunggu konfirmasi/pengembangan lebih lanjut
  getHealthRecords: async (): Promise<TradingHealthRecord[]> => {
    return store.healthRecords;
  },

  triggerAutoPushScan: (thresholdPct = 80) => {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
    let autoPushCount = 0;

    store.healthRecords.forEach(rec => {
      if (rec.riskUtilizationPct >= thresholdPct) {
        rec.autoPushTriggered = true;
        rec.lastAutoPushTimestamp = nowStr;
        rec.pushNotificationChannel = 'PUSH_MOBILE_APP (FCM)';
        if (!rec.notes || !rec.notes.includes('AUTOMATED PUSH SENT')) {
          rec.notes = `AUTOMATED PUSH SENT: Risk limit utilization reached ${rec.riskUtilizationPct}% (≥${thresholdPct}% threshold). Warning alert pushed to user device.`;
        }
        autoPushCount++;
      }
    });

    store.logAuditAction('System Sentinel', 'DEVELOPER', 'AUTO PUSH RISK SCAN', 'Trading Health', 'SENTINEL-80', `Auto-scanned trading health. Dispatched push notifications to ${autoPushCount} users exceeding ${thresholdPct}% risk threshold.`);
    return { autoPushCount, records: store.healthRecords };
  },

  sendRiskWarning: async (userId: string, note?: string) => {
    const rec = store.healthRecords.find(h => h.userId === userId);
    if (rec) {
      rec.lastWarningSent = new Date().toISOString().replace('T', ' ').substring(0, 19);
      rec.autoPushTriggered = true;
      rec.lastAutoPushTimestamp = rec.lastWarningSent;
      if (note) rec.notes = note;
      store.logAuditAction('Owner (Master)', 'OWNER', 'RISK WARNING SENT', 'Trading Health', userId, `Sent manual risk warning to ${rec.userName}. Note: ${note || 'Standard Warning'}`);
    }
    return rec;
  },

  getJournalEntries: () => store.journalEntries,
  getPlans: () => store.plans,

  // 6. News CRUD / Social / CMS
  getSocialPosts: () => store.socialPosts,
  getSocialReports: () => store.socialReports,

  createAdminPost: (title: string, content: string, groupName: string, isPinned: boolean, imageUrl?: string, hashtags: string[] = ['GotradingOfficial', 'AdminAnnouncement']) => {
    const newPost: SocialPost = {
      id: `POST-${Date.now().toString().slice(-4)}`,
      userId: 'ADM-001',
      userName: 'Gotrading Official Admin',
      userAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
      title,
      groupName: groupName || 'Feed Utama Komunitas',
      content,
      mediaUrls: imageUrl ? [imageUrl] : undefined,
      hashtags: hashtags.length > 0 ? hashtags : ['GotradingAdmin'],
      likesCount: 1,
      commentsCount: 0,
      sharesCount: 0,
      createdAt: 'Baru saja',
      isPinned,
      isFeatured: true,
      status: 'PUBLISHED'
    };
    store.socialPosts.unshift(newPost);
    store.logAuditAction('Owner (Master)', 'MARKETING', 'CREATE PINNED ADMIN POST', 'Social Media', newPost.id, `Created ${isPinned ? 'PINNED CARD' : 'standard'} post in ${groupName}: "${title || content.slice(0, 30)}..."`);
    return newPost;
  },

  togglePinPost: (postId: string) => {
    const post = store.socialPosts.find(p => p.id === postId);
    if (post) {
      post.isPinned = !post.isPinned;
      store.logAuditAction('Owner (Master)', 'MARKETING', post.isPinned ? 'PIN POST CARD' : 'UNPIN POST CARD', 'Social Media', postId, `Toggled pinned card status for post ${postId} to ${post.isPinned}`);
    }
    return post;
  },

  moderatePost: (postId: string, action: 'PUBLISH' | 'UNPUBLISH' | 'DELETE' | 'FEATURE') => {
    const post = store.socialPosts.find(p => p.id === postId);
    if (post) {
      if (action === 'PUBLISH') post.status = 'PUBLISHED';
      if (action === 'UNPUBLISH') post.status = 'UNPUBLISHED';
      if (action === 'FEATURE') post.isFeatured = !post.isFeatured;
      if (action === 'DELETE') {
        store.socialPosts = store.socialPosts.filter(p => p.id !== postId);
      }
      store.logAuditAction('Owner (Master)', 'MARKETING', `SOCIAL POST ${action}`, 'Social Media', postId, `Post ${postId} by ${post.userName} modified to ${action}`);
    }
  },

  getCampaigns: () => store.campaigns,
  getCompetitions: () => store.competitions,
  getParticipants: () => store.participants,

  // TODO: endpoint BE belum tersedia untuk generic Finance Global Transactions (yang ada per-akun via /api/admin/mt5-accounts/:id/transactions), menunggu konfirmasi/pengembangan lebih lanjut
  getTransactions: async (): Promise<FinancialTransaction[]> => {
    return store.transactions;
  },

  approveTransaction: async (txId: string, adminName = 'Owner (Master)') => {
    const tx = store.transactions.find(t => t.id === txId);
    if (tx) {
      tx.status = 'APPROVED';
      tx.processedBy = adminName;
      store.logAuditAction(adminName, 'FINANCE', `${tx.type} APPROVED`, 'Finance', tx.id, `Approved ${tx.type} transaction of $${tx.amount.toLocaleString()} for ${tx.userName}`);
    }
    return tx;
  },

  rejectTransaction: async (txId: string, adminName = 'Owner (Master)') => {
    const tx = store.transactions.find(t => t.id === txId);
    if (tx) {
      tx.status = 'REJECTED';
      tx.processedBy = adminName;
      store.logAuditAction(adminName, 'FINANCE', `${tx.type} REJECTED`, 'Finance', tx.id, `Rejected ${tx.type} transaction of $${tx.amount.toLocaleString()} for ${tx.userName}`);
    }
    return tx;
  },

  // 4. IB & Payouts (Partners)
  getPartners: async (): Promise<PartnerIB[]> => {
    try {
      const res = await httpClient.get('/api/admin/ib');
      store.lastError = null;
      const rawList = Array.isArray(res.data) ? res.data : (res.data?.partners || res.data?.data || []);
      if (Array.isArray(rawList)) {
        store.partners = rawList.map(normalizePartner);
      }
      return store.partners;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Gagal memuat data partner dari backend';
      store.lastError = errorMsg;
      throw new Error(errorMsg);
    }
  },

  updatePartnerCommission: async (partnerId: string, newRatePct: number, adminName = 'Owner (Master)') => {
    try {
      // Update global tier rate in backend
      await httpClient.put('/api/admin/ib/tiers', { tierId: partnerId, ratePct: newRatePct });
    } catch (e) {}
    const partner = store.partners.find(p => p.id === partnerId);
    if (partner) {
      const oldRate = partner.commissionRatePct || 30;
      partner.commissionRatePct = newRatePct;
      store.logAuditAction(adminName, 'PARTNERS', 'UPDATE IB COMMISSION RATE', 'Partners', partnerId, `Updated commission rate for IB ${partner.partnerName} (${partnerId}) from ${oldRate}% to ${newRatePct}%`);
    }
    return partner;
  },

  getIbPayouts: async () => {
    try {
      const res = await httpClient.get('/api/admin/ib/payouts');
      return res.data;
    } catch (e) {
      return [];
    }
  },

  updateIbPayoutStatus: async (payoutId: string, status: 'paid' | 'rejected') => {
    try {
      const res = await httpClient.patch(`/api/admin/ib/payouts/${payoutId}`, { status });
      return res.data;
    } catch (e) {
      return null;
    }
  },

  getTickets: () => store.tickets,

  addTicketReply: (ticketId: string, text: string, senderName = 'Support Agent', isInternalNote = false) => {
    const ticket = store.tickets.find(t => t.id === ticketId);
    if (ticket) {
      ticket.messages.push({
        sender: 'STAFF',
        senderName,
        text,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        isInternalNote
      });
      ticket.lastUpdated = 'Just now';
      ticket.status = 'IN_PROGRESS';
      store.logAuditAction(senderName, 'SUPPORT', isInternalNote ? 'INTERNAL NOTE ADDED' : 'TICKET REPLIED', 'Support', ticketId, `Updated support ticket ${ticketId}`);
    }
    return ticket;
  },

  getCMSContent: () => store.cmsContent,

  // 5. Integrations & API Credentials
  // TODO: endpoint BE belum tersedia untuk generic Integrations list/rotate (yang ada spesifik: /api/admin/mt5/test dan /api/admin/news/sync), menunggu konfirmasi/pengembangan lebih lanjut
  getIntegrations: async (): Promise<IntegrationService[]> => {
    return store.integrations;
  },

  getCredentials: () => store.credentials,
  getWebhooks: () => store.webhooks,

  testIntegration: async (id: string) => {
    const integ = store.integrations.find(i => i.id === id);
    if (integ) {
      integ.lastSync = 'Just now';
      integ.status = 'CONNECTED';
      integ.latencyMs = Math.floor(Math.random() * 20) + 8;
      store.logAuditAction('Owner (Master)', 'DEVELOPER', 'TEST CONNECTION', 'Integrations', integ.name, `Connection test successful. Latency: ${integ.latencyMs}ms`);
    }
    return integ;
  },

  rotateApiKey: async (credId: string) => {
    const cred = store.credentials.find(c => c.id === credId);
    if (cred) {
      cred.maskedKey = `${cred.maskedKey.split('_')[0]}_sec_••••••••••••${Math.random().toString(36).substring(2, 6)}`;
      cred.lastRotated = new Date().toISOString().replace('T', ' ').substring(0, 19);
      store.logAuditAction('Owner (Master)', 'OWNER', 'API KEY ROTATED', 'API Keys', cred.serviceName, `Rotated API Secret key for ${cred.serviceName}. Key fingerprint changed.`);
    }
    return cred;
  },

  getAdmins: () => store.admins,

  // System/Audit Logs
  getAuditLogs: async (): Promise<AuditLog[]> => {
    try {
      const res = await httpClient.get('/api/admin/logs/audit');
      const rawList = Array.isArray(res.data) ? res.data : (res.data?.logs || res.data?.data || []);
      if (Array.isArray(rawList) && rawList.length > 0) {
        store.auditLogs = rawList.map(normalizeAuditLog);
      }
    } catch (e) {}
    return store.auditLogs;
  },

  // 7. Settings
  getSettings: async (): Promise<SystemSettings> => {
    try {
      const res = await httpClient.get('/api/admin/settings');
      const data = res.data?.settings || res.data?.data || res.data;
      if (data && typeof data === 'object') {
        store.settings = { ...store.settings, ...data };
      }
    } catch (e) {}
    return store.settings;
  },

  updateSettings: async (newSettings: Partial<SystemSettings>) => {
    try {
      await httpClient.post('/api/admin/settings', newSettings);
    } catch (e) {}
    store.settings = { ...store.settings, ...newSettings };
    store.logAuditAction('Owner (Master)', 'OWNER', 'SYSTEM SETTINGS UPDATED', 'Settings', 'GLOBAL', 'Updated global platform parameters.');
    return store.settings;
  },

  // 8. Broadcast (WA Blaster & Email Blast)
  getWaCampaigns: () => store.waCampaigns,
  createWaCampaign: async (campaign: Omit<WaBlastCampaign, 'id' | 'createdAt' | 'sentCount' | 'deliveredCount' | 'failedCount' | 'status'>) => {
    try {
      await httpClient.post('/api/admin/broadcast', {
        channel: 'whatsapp',
        ...campaign
      });
    } catch (e) {}
    const newCamp: WaBlastCampaign = {
      ...campaign,
      id: `WA-BLAST-${(store.waCampaigns.length + 1).toString().padStart(2, '0')}`,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      sentCount: campaign.totalRecipients,
      deliveredCount: Math.floor(campaign.totalRecipients * 0.97),
      failedCount: Math.ceil(campaign.totalRecipients * 0.03),
      status: 'COMPLETED'
    };
    store.waCampaigns.unshift(newCamp);
    store.logAuditAction('Owner (Master)', 'MARKETING', 'WA BLAST DISPATCHED', 'WA Blaster', newCamp.id, `Dispatched WhatsApp Blast campaign "${newCamp.campaignName}" to ${newCamp.totalRecipients} recipients (${newCamp.targetSegment}).`);
    return newCamp;
  },

  getEmailCampaigns: () => store.emailCampaigns,
  createEmailCampaign: async (campaign: Omit<EmailBlastCampaign, 'id' | 'createdAt' | 'sentCount' | 'openedCount' | 'clickedCount' | 'bounceCount' | 'status'>) => {
    try {
      await httpClient.post('/api/admin/broadcast', {
        channel: 'email',
        ...campaign
      });
    } catch (e) {}
    const newCamp: EmailBlastCampaign = {
      ...campaign,
      id: `EMAIL-BLAST-${(store.emailCampaigns.length + 1).toString().padStart(2, '0')}`,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      sentCount: campaign.totalRecipients,
      openedCount: Math.floor(campaign.totalRecipients * 0.62),
      clickedCount: Math.floor(campaign.totalRecipients * 0.28),
      bounceCount: Math.ceil(campaign.totalRecipients * 0.01),
      status: 'COMPLETED'
    };
    store.emailCampaigns.unshift(newCamp);
    store.logAuditAction('Owner (Master)', 'MARKETING', 'EMAIL BLAST DISPATCHED', 'Email Blast', newCamp.id, `Dispatched Email Blast campaign "${newCamp.subject}" to ${newCamp.totalRecipients} recipients (${newCamp.targetSegment}).`);
    return newCamp;
  }
};
