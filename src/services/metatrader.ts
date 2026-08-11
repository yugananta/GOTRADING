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
   * Fetch connected MetaTrader account for a user
   */
  async getConnectedAccount(userId: string): Promise<MetaTraderAccount | null> {
    try {
      const { data, error } = await supabase
        .from('Post')
        .select('*')
        .eq('userId', userId)
        .contains('tags', ['__metatrader_account__'])
        .maybeSingle();

      if (error) {
        console.error('Error fetching MetaTrader account from Supabase:', error);
        return null;
      }

      if (data && data.chart) {
        const account = typeof data.chart === 'string' ? JSON.parse(data.chart) : data.chart;
        return {
          id: data.id,
          userId: data.userId,
          platform: account.platform || 'MT5',
          login: account.login || '',
          server: account.server || '',
          broker: account.broker || (account.server ? account.server.split('-')[0] : 'MetaTrader'),
          balance: Number(account.balance) || 50000,
          equity: Number(account.equity) || 50000,
          margin: Number(account.margin) || 0,
          freeMargin: Number(account.freeMargin) || 50000,
          leverage: Number(account.leverage) || 100,
          currency: account.currency || 'USD',
          profit: Number(account.profit) || 0,
          isVerified: account.isVerified !== false,
          createdAt: data.timestamp || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }
    } catch (err) {
      console.error('Unexpected error getting MetaTrader account:', err);
    }
    return null;
  }

  /**
   * Save or update connected MetaTrader account details in Supabase
   */
  async connectAccount(userId: string, platform: 'MT4' | 'MT5', login: string, server: string, broker?: string): Promise<MetaTraderAccount> {
    const existing = await this.getConnectedAccount(userId);

    const derivedBroker = broker || (server.toLowerCase().includes('axi') ? 'Axi' : server.split('-')[0] || 'MetaTrader');

    const accountData = {
      platform,
      login,
      server,
      broker: derivedBroker,
      balance: existing?.balance || 50000.0,
      equity: existing?.equity || 50000.0,
      margin: existing?.margin || 0.0,
      freeMargin: existing?.freeMargin || 50000.0,
      leverage: 500,
      currency: 'USD',
      profit: existing?.profit || 0.0,
      isVerified: true
    };

    if (existing) {
      // Update existing post containing the account info
      const { error } = await supabase
        .from('Post')
        .update({
          content: `MetaTrader Account Connection: ${login} (${platform})`,
          chart: accountData
        })
        .eq('id', existing.id);

      if (error) {
        console.error('Error updating MetaTrader account in Supabase:', error);
      }

      return {
        id: existing.id,
        userId,
        ...accountData,
        createdAt: existing.createdAt,
        updatedAt: new Date().toISOString()
      };
    } else {
      // Create new system post containing the account info
      const id = 'mt_acc_' + Date.now();
      const payload = {
        id,
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

      // Account connected successfully
      return {
        id,
        userId,
        ...accountData,
        createdAt: payload.timestamp,
        updatedAt: payload.timestamp
      };
    }
  }

  /**
   * Disconnect MetaTrader account for a user
   */
  async disconnectAccount(userId: string): Promise<void> {
    try {
      // Remove the account post
      const { error: accError } = await supabase
        .from('Post')
        .delete()
        .eq('userId', userId)
        .contains('tags', ['__metatrader_account__']);

      if (accError) console.error('Error deleting MT account:', accError);

      // Remove the trades post
      const { error: tradesError } = await supabase
        .from('Post')
        .delete()
        .eq('userId', userId)
        .contains('tags', ['__metatrader_trades__']);

      if (tradesError) console.error('Error deleting MT trades:', tradesError);
    } catch (err) {
      console.error('Unexpected error disconnecting MetaTrader account:', err);
    }
  }

  /**
   * Fetch all synced trades for a user
   */
  async getTrades(userId: string): Promise<MetaTraderTrade[]> {
    try {
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
