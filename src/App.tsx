import React, { useState, useEffect } from 'react';
import { Sidebar, NavItemKey } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/views/DashboardView';
import { UsersView } from './components/views/UsersView';
import { TradingAccountsView } from './components/views/TradingAccountsView';
import { TradingAnalyticsView } from './components/views/TradingAnalyticsView';
import { TradingHealthView } from './components/views/TradingHealthView';
import { TradingJournalView } from './components/views/TradingJournalView';
import { TradingPlansView } from './components/views/TradingPlansView';
import { SocialMediaView } from './components/views/SocialMediaView';
import { NotificationsView } from './components/views/NotificationsView';
import { WaBlasterView } from './components/views/WaBlasterView';
import { EmailBlastView } from './components/views/EmailBlastView';
import { CampaignsView } from './components/views/CampaignsView';
import { CompetitionsView } from './components/views/CompetitionsView';
import { FinanceView } from './components/views/FinanceView';
import { PartnersView } from './components/views/PartnersView';
import { SupportTicketsView } from './components/views/SupportTicketsView';
import { CMSView } from './components/views/CMSView';
import { IntegrationsView } from './components/views/IntegrationsView';
import { ApiKeysView } from './components/views/ApiKeysView';
import { WebhooksView } from './components/views/WebhooksView';
import { AdminRolesView } from './components/views/AdminRolesView';
import { SecurityView } from './components/views/SecurityView';
import { AuditLogsView } from './components/views/AuditLogsView';
import { SystemSettingsView } from './components/views/SystemSettingsView';
import { SearchModal } from './components/ui/SearchModal';
import { apiService, store } from './services/api';
import { AdminRole, UserProfile } from './types';

export default function App() {
  const [activeNav, setActiveNav] = useState<NavItemKey>('dashboard');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentRole, setCurrentRole] = useState<AdminRole>('OWNER');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Reactive state ticks
  const [, setTick] = useState(0);
  const forceUpdate = () => setTick(t => t + 1);

  // Initial data fetch on mount for all core modules
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        await Promise.allSettled([
          apiService.getUsers(),
          apiService.getTradingAccounts(),
          apiService.getPartners(),
          apiService.getAuditLogs(),
          apiService.getSettings()
        ]);
        forceUpdate();
      } catch (err) {
        console.error('Initial data fetch error:', err);
      }
    };
    fetchInitialData();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleUserStatus = async (userId: string) => {
    await apiService.toggleUserStatus(userId, currentRole);
    forceUpdate();
    showToast(`User ${userId} status updated.`);
  };

  const handleForceSyncAccount = async (accountId: string) => {
    await apiService.syncTradingAccount(accountId);
    forceUpdate();
    showToast(`MT4/MT5 Account #${accountId} force sync completed.`);
  };

  const handleSendHealthWarning = async (userId: string, note?: string) => {
    await apiService.sendRiskWarning(userId, note);
    forceUpdate();
    showToast(`Critical risk warning alert dispatched to trader.`);
  };

  const handleTriggerAutoPushScan = (thresholdPct = 80) => {
    const res = apiService.triggerAutoPushScan(thresholdPct);
    forceUpdate();
    showToast(`Sentinel Auto-Push Scan completed. ${res.autoPushCount} auto push notifications dispatched to users reaching ≥${thresholdPct}% risk threshold!`);
  };

  const handleModerateSocialPost = (postId: string, action: any) => {
    apiService.moderatePost(postId, action);
    forceUpdate();
    showToast(`Social post ${postId} updated (${action}).`);
  };

  const handleCreateAdminPost = (title: string, content: string, groupName: string, isPinned: boolean, imageUrl?: string, hashtags?: string[]) => {
    apiService.createAdminPost(title, content, groupName, isPinned, imageUrl, hashtags);
    forceUpdate();
    showToast(`Posting Admin berhasil dipublikasikan${isPinned ? ' sebagai Pinned Card' : ''}!`);
  };

  const handleTogglePinPost = (postId: string) => {
    apiService.togglePinPost(postId);
    forceUpdate();
    showToast(`Status Pinned Card post diperbarui.`);
  };

  const handleUpdatePartnerCommission = (partnerId: string, ratePct: number) => {
    apiService.updatePartnerCommission(partnerId, ratePct, `Owner (${currentRole})`);
    forceUpdate();
    showToast(`Setingan komisi IB ${partnerId} berhasil diperbarui ke ${ratePct}%.`);
  };

  const handleApproveFinance = async (txId: string) => {
    await apiService.approveTransaction(txId, `Owner (${currentRole})`);
    forceUpdate();
    showToast(`Financial transaction ${txId} APPROVED.`);
  };

  const handleRejectFinance = async (txId: string) => {
    await apiService.rejectTransaction(txId, `Owner (${currentRole})`);
    forceUpdate();
    showToast(`Financial transaction ${txId} REJECTED.`);
  };

  const handleTicketReply = (ticketId: string, text: string, isInternal?: boolean) => {
    apiService.addTicketReply(ticketId, text, `Agent (${currentRole})`, isInternal);
    forceUpdate();
    showToast(isInternal ? 'Private internal staff note added.' : 'Reply sent to customer ticket.');
  };

  const handleTestIntegration = async (id: string) => {
    await apiService.testIntegration(id);
    forceUpdate();
    showToast(`Integration connection test completed successfully.`);
  };

  const handleRotateApiKey = async (credId: string) => {
    await apiService.rotateApiKey(credId);
    forceUpdate();
    showToast(`API Secret Key rotated! Audit log recorded.`);
  };

  const handleDispatchWaBlast = (campaign: any) => {
    apiService.createWaCampaign(campaign);
    forceUpdate();
    showToast(`WhatsApp Blast "${campaign.campaignName}" diluncurkan ke ${campaign.totalRecipients} kontak!`);
  };

  const handleDispatchEmailBlast = (campaign: any) => {
    apiService.createEmailCampaign(campaign);
    forceUpdate();
    showToast(`Email Blast "${campaign.subject}" diluncurkan ke ${campaign.totalRecipients} email!`);
  };

  const handleSaveSettings = (newSettings: any) => {
    apiService.updateSettings(newSettings);
    forceUpdate();
    showToast(`Platform operational parameters saved.`);
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Toast Alert Popup */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-500 text-slate-950 px-4 py-2.5 rounded-lg shadow-2xl font-bold text-xs flex items-center gap-2 animate-bounce">
          <span>⚡ {toastMessage}</span>
        </div>
      )}

      {/* Global Collapsible Sidebar */}
      <Sidebar
        activeNav={activeNav}
        onSelectNav={setActiveNav}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        currentRole={currentRole}
        usersAtRiskCount={store.healthRecords.filter(h => h.riskLevel === 'CRITICAL').length}
        pendingWithdrawalsCount={store.transactions.filter(t => t.status === 'PENDING').length}
        openTicketsCount={store.tickets.filter(t => t.status === 'OPEN').length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Header
          currentRole={currentRole}
          onChangeRole={setCurrentRole}
          onOpenSearch={() => setIsSearchOpen(true)}
          usersAtRiskCount={store.healthRecords.filter(h => h.riskLevel === 'CRITICAL').length}
        />

        <main className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-950">
          {activeNav === 'dashboard' && <DashboardView />}
          {activeNav === 'users' && (
            <UsersView
              users={store.users}
              onToggleStatus={handleToggleUserStatus}
              currentRole={currentRole}
            />
          )}
          {activeNav === 'trading-accounts' && (
            <TradingAccountsView
              accounts={store.tradingAccounts}
              onForceSync={handleForceSyncAccount}
            />
          )}
          {activeNav === 'trading-analytics' && <TradingAnalyticsView />}
          {activeNav === 'trading-health' && (
            <TradingHealthView
              records={store.healthRecords}
              onSendWarning={handleSendHealthWarning}
              onTriggerAutoPushScan={handleTriggerAutoPushScan}
            />
          )}
          {activeNav === 'trading-journal' && <TradingJournalView entries={store.journalEntries} />}
          {activeNav === 'trading-plans' && <TradingPlansView plans={store.plans} />}
          {activeNav === 'social-media' && (
            <SocialMediaView
              posts={store.socialPosts}
              reports={store.socialReports}
              onModeratePost={handleModerateSocialPost}
              onCreateAdminPost={handleCreateAdminPost}
              onTogglePinPost={handleTogglePinPost}
            />
          )}
          {activeNav === 'notifications' && <NotificationsView />}
          {activeNav === 'wa-blaster' && (
            <WaBlasterView
              campaigns={store.waCampaigns}
              onDispatchBlast={handleDispatchWaBlast}
            />
          )}
          {activeNav === 'email-blast' && (
            <EmailBlastView
              campaigns={store.emailCampaigns}
              onDispatchBlast={handleDispatchEmailBlast}
            />
          )}
          {activeNav === 'campaigns' && <CampaignsView campaigns={store.campaigns} />}
          {activeNav === 'competitions' && (
            <CompetitionsView
              competitions={store.competitions}
              participants={store.participants}
            />
          )}
          {activeNav === 'finance' && (
            <FinanceView
              transactions={store.transactions}
              onApprove={handleApproveFinance}
              onReject={handleRejectFinance}
              currentRole={currentRole}
            />
          )}
          {activeNav === 'partners' && (
            <PartnersView
              partners={store.partners}
              onUpdateCommissionRate={handleUpdatePartnerCommission}
            />
          )}
          {activeNav === 'support' && (
            <SupportTicketsView
              tickets={store.tickets}
              onReply={handleTicketReply}
            />
          )}
          {activeNav === 'content' && <CMSView contentItems={store.cmsContent} />}
          {activeNav === 'integrations' && (
            <IntegrationsView
              integrations={store.integrations}
              onTestConnection={handleTestIntegration}
            />
          )}
          {activeNav === 'api-keys' && (
            <ApiKeysView
              credentials={store.credentials}
              onRotateKey={handleRotateApiKey}
            />
          )}
          {activeNav === 'webhooks' && <WebhooksView webhooks={store.webhooks} />}
          {activeNav === 'admin-roles' && <AdminRolesView admins={store.admins} />}
          {activeNav === 'security' && <SecurityView />}
          {activeNav === 'audit-logs' && <AuditLogsView logs={store.auditLogs} />}
          {activeNav === 'settings' && (
            <SystemSettingsView
              settings={store.settings}
              onSave={handleSaveSettings}
            />
          )}
        </main>
      </div>

      {/* Global Command+K Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        users={store.users}
        accounts={store.tradingAccounts}
        tickets={store.tickets}
        credentials={store.credentials}
        onSelectUser={(u) => {
          setActiveNav('users');
        }}
      />
    </div>
  );
}
