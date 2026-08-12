import { supabase } from '../lib/supabaseClient.ts';

export interface MetaTraderAccount {
  id: string;
  userId: string;
  platform: 'MT4' | 'MT5';
  login: string;
  server: string;
  broker?: string;
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  leverage: number;
  currency: string;
  profit: number;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MetaTraderTrade {
  id: string;
  symbol: string;
  type: 'BUY' | 'SELL';
  lots: number;
  openPrice: number;
  closePrice: number;
  openTime: string;
  closeTime: string;
  pl: number;
  comment: string;
}

export class MetaTraderService {
  /**
   * Fetch all connected MetaTrader accounts for a user
   */
  async getConnectedAccounts(userId: string): Promise<MetaTraderAccount[]> {
    try {
      const { data, error } = await supabase
        .from('Post')
        .select('*')
        .eq('userId', userId)
        .contains('tags', ['__metatrader_account__']);

      if (error) {
        console.error('Error fetching MetaTrader accounts from Supabase:', error);
        return [];
      }

      if (data && Array.isArray(data)) {
        return data.map(item => {
          const account = typeof item.chart === 'string' ? JSON.parse(item.chart) : item.chart || {};
          return {
            id: item.id,
            userId: item.userId,
            platform: account.platform || 'MT5',
            login: account.login || '',
            server: account.server || '',
            broker: account.broker || (account.server ? account.server.split('-')[0] : 'MetaTrader'),
            balance: Number(account.balance) || 0,
            equity: Number(account.equity) || 0,
            margin: Number(account.margin) || 0,
            freeMargin: Number(account.freeMargin) || 0,
            leverage: Number(account.leverage) || 100,
            currency: account.currency || 'USD',
            profit: Number(account.profit) || 0,
            isVerified: account.isVerified === true,
            createdAt: item.timestamp || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        });
      }
    } catch (err) {
      console.error('Unexpected error getting MetaTrader accounts:', err);
    }
    return [];
  }

  /**
   * Fetch connected MetaTrader account for a user (single or primary)
   */
  async getConnectedAccount(userId: string, accountId?: string): Promise<MetaTraderAccount | null> {
    const accounts = await this.getConnectedAccounts(userId);
    if (accounts.length === 0) return null;
    if (accountId) {
      const found = accounts.find(a => a.id === accountId || a.login === accountId);
      if (found) return found;
    }
    return accounts[0];
  }

  /**
   * Save or update connected MetaTrader account details in Supabase
   */
  async connectAccount(userId: string, platform: 'MT4' | 'MT5', login: string, server: string, broker?: string, realMetrics?: { balance?: number; equity?: number; margin?: number; freeMargin?: number; profit?: number; isVerified?: boolean }): Promise<{ account: MetaTraderAccount; accounts: MetaTraderAccount[] }> {
    const existingAccounts = await this.getConnectedAccounts(userId);
    const existingForLogin = existingAccounts.find(a => a.login === login);

    const derivedBroker = broker || (server.toLowerCase().includes('axi') ? 'Axi' : server.split('-')[0] || 'MetaTrader');

    const accountData = {
      platform,
      login,
      server,
      broker: derivedBroker,
      balance: realMetrics?.balance ?? (existingForLogin?.balance || 0.0),
      equity: realMetrics?.equity ?? (existingForLogin?.equity || 0.0),
      margin: realMetrics?.margin ?? (existingForLogin?.margin || 0.0),
      freeMargin: realMetrics?.freeMargin ?? (existingForLogin?.freeMargin || 0.0),
      leverage: 100,
      currency: 'USD',
      profit: realMetrics?.profit ?? (existingForLogin?.profit || 0.0),
      isVerified: realMetrics?.isVerified ?? (existingForLogin?.isVerified || false)
    };

    let targetId = existingForLogin?.id;

    if (existingForLogin && targetId) {
      // Update existing post for this account login
      const { error } = await supabase
        .from('Post')
        .update({
          content: `MetaTrader Account Connection: ${login} (${platform})`,
          chart: accountData
        })
        .eq('id', targetId);

      if (error) {
        console.error('Error updating MetaTrader account in Supabase:', error);
      }
    } else {
      // Create new system post containing the new account info
      targetId = 'mt_acc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const payload = {
        id: targetId,
        userId,
        authorName: 'System Integration',
        authorUsername: 'system',
        content: `MetaTrader Account Connection: ${login} (${platform})`,
        tags: ['__metatrader_account__'],
        chart: accountData,
        timestamp: new Date().toISOString()
      };

      const { error } = await supabase
        .from('Post')
        .insert(payload);

      if (error) {
        console.error('Error creating MetaTrader account in Supabase:', error);
      }
    }

    const allAccounts = await this.getConnectedAccounts(userId);
    const connectedAccount = allAccounts.find(a => a.id === targetId || a.login === login) || allAccounts[0];

    return {
      account: connectedAccount,
      accounts: allAccounts
    };
  }

  /**
   * Disconnect a specific MetaTrader account or all accounts for a user
   */
  async disconnectAccount(userId: string, accountId?: string): Promise<{ accounts: MetaTraderAccount[] }> {
    try {
      if (accountId) {
        // Delete specific account post
        const existingAccounts = await this.getConnectedAccounts(userId);
        const target = existingAccounts.find(a => a.id === accountId || a.login === accountId);
        if (target) {
          const { error: accError } = await supabase
            .from('Post')
            .delete()
            .eq('id', target.id);

          if (accError) console.error('Error deleting MT account:', accError);
        }
      } else {
        // Remove all account posts
        const { error: accError } = await supabase
          .from('Post')
          .delete()
          .eq('userId', userId)
          .contains('tags', ['__metatrader_account__']);

        if (accError) console.error('Error deleting MT accounts:', accError);
      }

      const remainingAccounts = await this.getConnectedAccounts(userId);

      // If no accounts left, delete trade history from database
      if (remainingAccounts.length === 0) {
        const { error: tradesError } = await supabase
          .from('Post')
          .delete()
          .eq('userId', userId)
          .contains('tags', ['__metatrader_trades__']);

        if (tradesError) console.error('Error deleting MT trades:', tradesError);
      }
    } catch (err) {
      console.error('Unexpected error disconnecting MetaTrader account:', err);
    }

    const accounts = await this.getConnectedAccounts(userId);
    return { accounts };
  }

  /**
   * Fetch all synced trades for a user
   */
  async getTrades(userId: string): Promise<MetaTraderTrade[]> {
    try {
      const connected = await this.getConnectedAccounts(userId);
      if (connected.length === 0) {
        return [];
      }

      const { data, error } = await supabase
        .from('Post')
        .select('*')
        .eq('userId', userId)
        .contains('tags', ['__metatrader_trades__'])
        .maybeSingle();

      if (error) {
        console.error('Error fetching trades from Supabase:', error);
        return [];
      }

      if (data && data.chart) {
        const trades = typeof data.chart === 'string' ? JSON.parse(data.chart) : data.chart;
        if (Array.isArray(trades)) {
          return trades as MetaTraderTrade[];
        }
      }
    } catch (err) {
      console.error('Unexpected error getting trades:', err);
    }
    return [];
  }

  /**
   * Save trades list to Supabase
   */
  async saveTrades(userId: string, trades: MetaTraderTrade[]): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('Post')
        .select('id')
        .eq('userId', userId)
        .contains('tags', ['__metatrader_trades__'])
        .maybeSingle();

      if (error) {
        console.error('Error finding existing trades post:', error);
        return;
      }

      if (data) {
        // Update existing
        await supabase
          .from('Post')
          .update({
            chart: trades
          })
          .eq('id', data.id);
      } else {
        // Create new
        const id = 'mt_trades_' + Date.now();
        await supabase
          .from('Post')
          .insert({
            id,
            userId,
            authorName: 'System Integration',
            authorUsername: 'system',
            content: `MetaTrader Trades List for User ${userId}`,
            tags: ['__metatrader_trades__'],
            chart: trades,
            timestamp: new Date().toISOString()
          });
      }
    } catch (err) {
      console.error('Unexpected error saving trades:', err);
    }
  }

  /**
   * Perform real-time sync (recalculates account equity and summary metrics from actual stored trades)
   */
  async syncTrades(userId: string): Promise<{ account: MetaTraderAccount | null; trades: MetaTraderTrade[] }> {
    const account = await this.getConnectedAccount(userId);
    if (!account) {
      return { account: null, trades: [] };
    }

    const trades = await this.getTrades(userId);

    // Recalculate real account values based strictly on actual stored trades
    let currentUnrealized = 0;
    let margin = 0;

    trades.forEach(t => {
      if (!t.closeTime) {
        currentUnrealized += (t.pl || 0);
        margin += (t.lots || 0) * 200;
      }
    });

    account.equity = Number((account.balance + currentUnrealized).toFixed(2));
    account.profit = Number(currentUnrealized.toFixed(2));
    account.margin = Number(margin.toFixed(2));
    account.freeMargin = Number((account.equity - margin).toFixed(2));

    return { account, trades };
  }
}
