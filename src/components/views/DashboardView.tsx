import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Layers,
  DollarSign,
  Users,
  Activity,
  Award,
  PieChart as PieIcon,
  HelpCircle,
  RefreshCw,
  Building2,
  AlertCircle,
  Loader2
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import { apiService } from '../../services/api';

export type Timeframe = 'weekly' | 'monthly' | 'allTime';

export interface DashboardSummaryData {
  depositClients?: number;
  depositClientsGrowth?: string;
  depositClientsTrend?: 'up' | 'down';
  
  totalWd?: number;
  totalWdGrowth?: string;
  totalWdTrend?: 'up' | 'down';

  netPnl?: number;
  netPnlGrowth?: string;
  netPnlTrend?: 'up' | 'down';

  commission?: number; // Gotrading Commission from Broker
  commissionGrowth?: string;
  commissionTrend?: 'up' | 'down';
  totalLotsTraded?: number;
  avgBrokerCommissionPerLot?: number;

  subIbCommission30?: number; // 30% of Gotrading commission
  gotradingNetKeep70?: number; // 70% kept by Gotrading

  // Fallback or generic fields from BE summary
  totalUsers?: number;
  totalTradingAccounts?: number;
  activeAccounts?: number;
  totalVolumeLots?: number;
  totalDeposits?: number;
  totalWithdrawals?: number;
  totalCommissions?: number;
  netProfit?: number;

  chartData?: {
    period: string;
    deposits: number;
    withdrawals: number;
    netPnl: number;
    commission: number;
    lots: number;
  }[];
}

export const DashboardView: React.FC = () => {
  const [timeframe, setTimeframe] = useState<Timeframe>('monthly');
  const [dashboardData, setDashboardData] = useState<DashboardSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchDashboardSummary = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const result = await apiService.getDashboardStats();
      if (result) {
        setDashboardData(result);
      } else {
        throw new Error('Data summary kosong dari backend');
      }
    } catch (err: any) {
      const msg = err.message || 'Gagal terhubung ke endpoint /api/admin/dashboard/summary';
      setErrorMessage(msg);
      setDashboardData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardSummary();
  }, [fetchDashboardSummary]);

  // Derive standardized presentation values from API payload
  const depositClients = dashboardData?.depositClients ?? dashboardData?.totalDeposits ?? 0;
  const depositClientsGrowth = dashboardData?.depositClientsGrowth || '+0.0%';
  
  const totalWd = dashboardData?.totalWd ?? dashboardData?.totalWithdrawals ?? 0;
  const totalWdGrowth = dashboardData?.totalWdGrowth || '+0.0%';

  const netPnl = dashboardData?.netPnl ?? dashboardData?.netProfit ?? (depositClients - totalWd);
  const netPnlGrowth = dashboardData?.netPnlGrowth || '+0.0%';

  const commission = dashboardData?.commission ?? dashboardData?.totalCommissions ?? 0;
  const totalLotsTraded = dashboardData?.totalLotsTraded ?? dashboardData?.totalVolumeLots ?? 0;
  const avgBrokerCommissionPerLot = dashboardData?.avgBrokerCommissionPerLot ?? (totalLotsTraded > 0 ? +(commission / totalLotsTraded).toFixed(1) : 10);
  
  const subIbCommission30 = dashboardData?.subIbCommission30 ?? +(commission * 0.3).toFixed(2);
  const gotradingNetKeep70 = dashboardData?.gotradingNetKeep70 ?? +(commission * 0.7).toFixed(2);

  const chartData = dashboardData?.chartData || [];

  return (
    <div className="space-y-6">
      {/* Header Bar & Timeframe Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-slate-900 border border-slate-800 rounded-xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight">GOTRADING ADMIN DASHBOARD</h2>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              MASTER IB CONTROL
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Data live dari endpoint backend TARAPTI (<code className="text-emerald-400">/api/admin/dashboard/summary</code>)
          </p>
        </div>

        {/* Action button & Timeframe selector */}
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardSummary}
            disabled={isLoading}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 disabled:opacity-50 transition-colors cursor-pointer"
            title="Refresh data dari BE"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{isLoading ? 'Memuat...' : 'Refresh'}</span>
          </button>

          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
            <button
              onClick={() => setTimeframe('weekly')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                timeframe === 'weekly'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Mingguan
            </button>

            <button
              onClick={() => setTimeframe('monthly')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                timeframe === 'monthly'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              Bulanan
            </button>

            <button
              onClick={() => setTimeframe('allTime')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center gap-1.5 ${
                timeframe === 'allTime'
                  ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Semua Waktu
            </button>
          </div>
        </div>
      </div>

      {/* Loading State UI */}
      {isLoading && !dashboardData && (
        <div className="p-12 bg-slate-900 border border-slate-800 rounded-xl flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          <p className="text-sm font-semibold text-slate-200">Memuat statistik live dari Backend TARAPTI...</p>
          <p className="text-xs text-slate-500 font-mono">GET /api/admin/dashboard/summary</p>
        </div>
      )}

      {/* Error Alert Box UI */}
      {errorMessage && (
        <div className="p-5 bg-rose-950/70 border-2 border-rose-500/50 rounded-xl flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold text-rose-300">Gagal Mengambil Data Live Dashboard</h4>
            <p className="text-xs text-rose-200/90 mt-1 leading-relaxed">
              Request ke <code className="bg-rose-900/60 px-1.5 py-0.5 rounded font-mono">GET /api/admin/dashboard/summary</code> gagal: {errorMessage}
            </p>
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={fetchDashboardSummary}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Coba Muat Ulang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4 Core Requirement Cards */}
      {(!isLoading || dashboardData) && !errorMessage && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Total Deposit Clients */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl relative overflow-hidden group hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-mono tracking-wider font-semibold text-slate-400">1. TOTAL DEPOSIT CLIENTS</span>
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-white tracking-tight">
                ${depositClients.toLocaleString()}
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                <span>{depositClientsGrowth}</span>
              </div>
              <div className="mt-2 text-[10px] text-slate-500 font-mono">
                Total dana masuk dari seluruh client
              </div>
            </div>

            {/* Card 2: Total WD */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl relative overflow-hidden group hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-mono tracking-wider font-semibold text-slate-400">2. TOTAL WD</span>
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                  <ArrowDownRight className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-white tracking-tight">
                ${totalWd.toLocaleString()}
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                <span className="text-rose-400 font-semibold">{totalWdGrowth}</span>
              </div>
              <div className="mt-2 text-[10px] text-slate-500 font-mono">
                Total penarikan dana terverifikasi
              </div>
            </div>

            {/* Card 3: Net PNL */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl relative overflow-hidden group hover:border-slate-700 transition-all">
              <div className="flex items-center justify-between text-slate-400 mb-2">
                <span className="text-xs font-mono tracking-wider font-semibold text-slate-400">3. NET PNL</span>
                <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-extrabold text-sky-400 tracking-tight">
                {netPnl >= 0 ? `+$${netPnl.toLocaleString()}` : `-$${Math.abs(netPnl).toLocaleString()}`}
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-sky-400 font-medium">
                <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                <span>{netPnlGrowth}</span>
              </div>
              <div className="mt-2 text-[10px] text-slate-500 font-mono">
                Selisih bersih (Deposit - Withdrawal)
              </div>
            </div>

            {/* Card 4: CARD BESAR COMMISSION (Highlight) */}
            <div className="p-5 bg-gradient-to-br from-slate-900 via-emerald-950/40 to-slate-900 border-2 border-emerald-500/50 rounded-xl relative overflow-hidden group shadow-lg shadow-emerald-950/40 col-span-1">
              <div className="absolute top-0 right-0 px-2 py-0.5 bg-emerald-500 text-slate-950 font-extrabold text-[9px] uppercase tracking-wider rounded-bl-lg">
                BROKER REVENUE
              </div>
              <div className="flex items-center justify-between text-slate-300 mb-2">
                <span className="text-xs font-mono tracking-wider font-bold text-emerald-400 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5" /> 4. COMMISSION (BROKER)
                </span>
              </div>
              <div className="text-3xl font-black text-emerald-400 tracking-tight">
                ${commission.toLocaleString()}
              </div>
              <div className="mt-2 text-xs text-slate-300 flex items-center gap-1 font-semibold">
                <span>Komisi Gotrading dr Broker</span>
                <span className="text-emerald-400">({totalLotsTraded.toLocaleString()} Lots)</span>
              </div>

              <div className="mt-3 pt-3 border-t border-emerald-500/20 grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-400 block text-[10px]">Komisi IB (30%):</span>
                  <span className="font-bold text-amber-400">${subIbCommission30.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Nett Gotrading (70%):</span>
                  <span className="font-bold text-emerald-400">${gotradingNetKeep70.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Analytics Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Deposit, Withdrawal & Net PNL Trend */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">Tren Deposit, WD & Net PNL</h3>
                  <p className="text-xs text-slate-400">
                    Perbandingan alur kas client ({timeframe === 'weekly' ? 'Harian' : timeframe === 'monthly' ? 'Mingguan' : 'Kuartalan'})
                  </p>
                </div>
                <span className="text-[10px] font-mono bg-slate-800 px-2 py-1 rounded text-slate-300 uppercase">
                  {timeframe}
                </span>
              </div>
              <div className="h-64 w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="period" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                        formatter={(val: any) => [`$${Number(val).toLocaleString()}`, '']}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                      <Bar name="Deposit" dataKey="deposits" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar name="Withdrawal" dataKey="withdrawals" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
                    <Activity className="w-6 h-6 text-slate-600" />
                    <span>Belum ada data historis chart dari backend</span>
                  </div>
                )}
              </div>
            </div>

            {/* Chart 2: Gotrading Broker Commission & Volume Lots */}
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">Komisi Broker GOTRADING ($) & Volume (Lots)</h3>
                  <p className="text-xs text-slate-400">Pertumbuhan komisi yang didapat dari broker dari aktivitas trading client</p>
                </div>
                <span className="text-[10px] font-mono bg-slate-800 px-2 py-1 rounded text-emerald-400 font-bold">
                  ${avgBrokerCommissionPerLot}/Lot
                </span>
              </div>
              <div className="h-64 w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="period" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                        formatter={(val: any, name: any) => [
                          name === 'Komisi Broker' ? `$${Number(val).toLocaleString()}` : `${val} Lots`,
                          name
                        ]}
                      />
                      <Area
                        type="monotone"
                        name="Komisi Broker"
                        dataKey="commission"
                        stroke="#10b981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorCommission)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
                    <Activity className="w-6 h-6 text-slate-600" />
                    <span>Belum ada data historis komisi dari backend</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sub-IB Network & Revenue Share Breakdown Widget */}
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-emerald-400" /> Ringkasan Struktur Ekosistem IB & Sub-IB Gotrading
                </h3>
                <p className="text-xs text-slate-400">
                  Skema pembagian komisi 30% IB Sub-network vs 70% Gotrading Net Reserve
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                <div className="text-slate-400 font-mono text-[10px] mb-1">TOTAL GOTRADING COMMISSION</div>
                <div className="text-xl font-bold text-emerald-400">${commission.toLocaleString()}</div>
                <div className="text-[11px] text-slate-400 mt-2">
                  Diterima langsung dari Broker mitra ({totalLotsTraded.toLocaleString()} Lots total)
                </div>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                <div className="text-slate-400 font-mono text-[10px] mb-1">TOTAL KOMISI IB & SUB-IB (30%)</div>
                <div className="text-xl font-bold text-amber-400">${subIbCommission30.toLocaleString()}</div>
                <div className="text-[11px] text-slate-400 mt-2">
                  Alokasi 30% yang dibagikan kepada seluruh jajaran Sub-IB
                </div>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                <div className="text-slate-400 font-mono text-[10px] mb-1">PROFIT BERSIH GOTRADING (70%)</div>
                <div className="text-xl font-bold text-white">${gotradingNetKeep70.toLocaleString()}</div>
                <div className="text-[11px] text-slate-400 mt-2">
                  Komisi bersih disimpan oleh Gotrading setelah dipotong hak IB 30%
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

