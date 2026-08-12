// src/services/metatrader.ts
//
// MetaTraderService — BFF layer.
//
// SEBELUMNYA: salah baca/tulis ke tabel 'Post' (tabel feed sosial).
// SEKARANG:   baca langsung dari 'user_mt5_accounts' di Supabase
//             (tabel yang sama yang dipakai BE-GOTRADING).
//             connect/disconnect/trades di-proxy ke BE-GOTRADING API
//             agar auto-reconnect & credential storage berjalan benar.

import { supabase } from '../lib/supabaseClient.ts';

// URL backend BE-GOTRADING. Dibaca dari env, fallback ke Railway URL.
function getBackendUrl(): string {
  // Dalam Railway, set env var BACKEND_API_URL di service GOTRADING.
  // Contoh: https://be-gotrading-production.up.railway.app
  if (typeof process !== 'undefined' && process.env) {
    return (
      process.env.BACKEND_API_URL ||
      process.env.VITE_BACKEND_API_URL ||
      'http://localhost:3004'
    );
  }
  return 'http://localhost:3004';
}

export interface MetaTraderAccount {
  akunId: number;
  login: string;
  server: string;
  broker: string;
  platform: string;
  currency: string;
  leverage: number;
  balance: number;
  equity: number;
  profit: number;
  margin: number;
  freeMargin: number;
  marginLevel: number;
  conn_status: 'connected' | 'reconnecting' | 'disconnected' | 'error';
  credential_saved: boolean;
  error_message: string | null;
  last_connected_at: string | null;
}

export interface MetaTraderTrade {
  ticket: number;
  symbol: string;
  type: string;
  lots: number;
  openPrice: number;
  closePrice: number;
  openTime: string;
  closeTime: string | null;
  pl: number;
  comment: string;
}

export class MetaTraderService {
  /**
   * Baca akun MT5 yang sudah terhubung dari tabel user_mt5_accounts.
   * Kalau gateway sedang tidak bisa dihubungi, data snapshot dari DB
   * tetap dikembalikan dengan conn_status 'reconnecting'.
   */
  async getConnectedAccount(userId: string): Promise<MetaTraderAccount | null> {
    try {
      const { data, error } = await supabase
        .from('user_mt5_accounts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('[MetaTraderService] Error reading user_mt5_accounts:', error);
        return null;
      }
      if (!data) return null;

      // Fallback snapshot saat gateway tidak bisa dihubungi
      const snap = data.snapshot?.account || {};
      const connStatus = data.conn_status || 'disconnected';

      return {
        akunId: data.akun_id,
        login: String(data.akun_id),
        server: data.server || snap.server || data.snapshot?.requested_server || '',
        broker: data.broker || snap.broker || data.snapshot?.requested_broker || 'Axi',
        platform: data.platform || 'MT5',
        currency: snap.currency || 'USD',
        leverage: Number(snap.leverage) || 100,
        balance: Number(snap.balance) || 0,
        equity: Number(snap.equity) || 0,
        profit: Number(snap.profit) || 0,
        margin: Number(snap.margin) || 0,
        freeMargin: Number(snap.margin_free) || 0,
        marginLevel: Number(snap.margin_level) || 0,
        conn_status: connStatus as MetaTraderAccount['conn_status'],
        credential_saved: Boolean(data.credential_saved),
        error_message: data.error_message || null,
        last_connected_at: data.last_connected_at || null,
      };
    } catch (err) {
      console.error('[MetaTraderService] Unexpected error:', err);
      return null;
    }
  }

  /**
   * Proxy connect ke BE-GOTRADING.
   * BE-GOTRADING menyimpan credential terenkripsi & menghubungkan ke gateway.
   */
  async connectAccount(
    userId: string,
    platform: string,
    login: string,
    server: string,
    broker?: string,
    password?: string,
    authToken?: string
  ): Promise<MetaTraderAccount> {
    const beUrl = getBackendUrl();
    const res = await fetch(`${beUrl}/api/metatrader/connect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify({ platform, login, password, server, broker }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || 'Failed to connect MT5 account');
    }

    // Setelah BE-GOTRADING berhasil, baca kembali dari Supabase
    const account = await this.getConnectedAccount(userId);
    if (!account) {
      // Kalau row belum ada (race condition), kembalikan data minimal dari response
      return data.account || { akunId: Number(login), login, server, broker: broker || '', platform, currency: 'USD', leverage: 100, balance: 0, equity: 0, profit: 0, margin: 0, freeMargin: 0, marginLevel: 0, conn_status: 'connected', credential_saved: true, error_message: null, last_connected_at: null };
    }
    return account;
  }

  /**
   * Proxy disconnect ke BE-GOTRADING.
   */
  async disconnectAccount(userId: string, authToken?: string): Promise<void> {
    const beUrl = getBackendUrl();
    try {
      await fetch(`${beUrl}/api/metatrader/disconnect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
      });
    } catch (err) {
      console.error('[MetaTraderService] Disconnect proxy error:', err);
    }
  }

  /**
   * Ambil trades dari snapshot di DB (tidak perlu akses gateway).
   */
  async getTrades(userId: string): Promise<MetaTraderTrade[]> {
    try {
      const { data, error } = await supabase
        .from('user_mt5_accounts')
        .select('snapshot')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) return [];

      const trades = data.snapshot?.trades;
      if (Array.isArray(trades)) return trades as MetaTraderTrade[];
    } catch (err) {
      console.error('[MetaTraderService] getTrades error:', err);
    }
    return [];
  }

  /**
   * Sync: trigger BE-GOTRADING untuk sync ulang dari gateway,
   * lalu kembalikan data terbaru dari DB.
   */
  async syncTrades(userId: string, authToken?: string): Promise<{ account: MetaTraderAccount | null; trades: MetaTraderTrade[] }> {
    const beUrl = getBackendUrl();
    try {
      await fetch(`${beUrl}/api/metatrader/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
      });
    } catch (err) {
      console.warn('[MetaTraderService] Sync proxy warning:', err);
    }

    const account = await this.getConnectedAccount(userId);
    const trades = await this.getTrades(userId);
    return { account, trades };
  }
}
