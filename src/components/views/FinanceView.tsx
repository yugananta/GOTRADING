import React, { useState } from 'react';
import {
  Wallet,
  CheckCircle,
  XCircle,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Search,
  Clock,
  Send,
  Building2,
  Check,
  X,
  Filter,
  FileSpreadsheet,
  Award
} from 'lucide-react';
import { FinancialTransaction, AdminRole } from '../../types';
import { Badge } from '../ui/Badge';
import { ExportButton } from '../ui/ExportButton';

export interface IbWithdrawalRecord {
  id: string;
  ibId: string;
  ibName: string;
  ibType: 'MASTER_IB' | 'SUB_IB_L1' | 'SUB_IB_L2';
  email: string;
  bankNameOrCrypto: string;
  accountNumber: string;
  amountUsd: number;
  requestedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  processedBy?: string;
}

export interface IbPendingCommissionRecord {
  id: string;
  ibId: string;
  ibName: string;
  ibType: 'MASTER_IB' | 'SUB_IB_L1' | 'SUB_IB_L2';
  subIbCount: number;
  activeClientsCount: number;
  totalVolumeLots: number;
  gotradingBrokerCommissionUsd: number; // Commission Gotrading from broker
  ibCommissionShare30Usd: number; // 30% of Gotrading commission
  alreadyPaidUsd: number;
  pendingCommissionUsd: number; // 30% - alreadyPaid
  status: 'UNPAID' | 'PARTIAL' | 'READY_FOR_PAYOUT';
  lastCalculated: string;
}

interface FinanceViewProps {
  transactions: FinancialTransaction[];
  onApprove: (txId: string) => void;
  onReject: (txId: string) => void;
  currentRole: AdminRole;
}

export const FinanceView: React.FC<FinanceViewProps> = ({
  transactions,
  onApprove,
  onReject,
  currentRole
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'IB_WD_LIST' | 'IB_PENDING_LIST' | 'ALL_TX'>('OVERVIEW');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Initial mock state for IB Withdrawals
  const [ibWithdrawals, setIbWithdrawals] = useState<IbWithdrawalRecord[]>([
    {
      id: 'WD-IB-101',
      ibId: 'IB-901',
      ibName: 'Budi Santoso (Master IB Jakarta)',
      ibType: 'MASTER_IB',
      email: 'budi.santoso@gotrading.id',
      bankNameOrCrypto: 'BCA (A/N Budi Santoso)',
      accountNumber: '8830192831',
      amountUsd: 12500,
      requestedAt: '2026-08-10 08:30',
      status: 'PENDING'
    },
    {
      id: 'WD-IB-102',
      ibId: 'IB-902',
      ibName: 'Surabaya Alpha Trader (Sub IB L1)',
      ibType: 'SUB_IB_L1',
      email: 'surabaya.alpha@gotrading.id',
      bankNameOrCrypto: 'Mandiri (A/N PT Alpha)',
      accountNumber: '142001928310',
      amountUsd: 8200,
      requestedAt: '2026-08-10 07:15',
      status: 'PENDING'
    },
    {
      id: 'WD-IB-103',
      ibId: 'IB-903',
      ibName: 'Rian Hidayat (Sub IB L2)',
      ibType: 'SUB_IB_L2',
      email: 'rian.hidayat@gotrading.id',
      bankNameOrCrypto: 'USDT TRC20',
      accountNumber: 'T9xK1mL8pQ...391a',
      amountUsd: 4500,
      requestedAt: '2026-08-09 19:40',
      status: 'APPROVED',
      processedBy: 'Admin Gotrading'
    },
    {
      id: 'WD-IB-104',
      ibId: 'IB-904',
      ibName: 'Medan FX Community (Sub IB L1)',
      ibType: 'SUB_IB_L1',
      email: 'medan.fx@gotrading.id',
      bankNameOrCrypto: 'BCA (A/N Hendra)',
      accountNumber: '0281920192',
      amountUsd: 13000,
      requestedAt: '2026-08-08 14:10',
      status: 'APPROVED',
      processedBy: 'Admin Gotrading'
    }
  ]);

  // Initial mock state for IB Pending Commissions
  const [ibPendingCommissions, setIbPendingCommissions] = useState<IbPendingCommissionRecord[]>([
    {
      id: 'COMM-IB-201',
      ibId: 'IB-901',
      ibName: 'Budi Santoso (Master IB Jakarta)',
      ibType: 'MASTER_IB',
      subIbCount: 12,
      activeClientsCount: 145,
      totalVolumeLots: 4200,
      gotradingBrokerCommissionUsd: 42000,
      ibCommissionShare30Usd: 12600, // 30% of 42000
      alreadyPaidUsd: 5000,
      pendingCommissionUsd: 7600,
      status: 'READY_FOR_PAYOUT',
      lastCalculated: '10 mins ago'
    },
    {
      id: 'COMM-IB-202',
      ibId: 'IB-902',
      ibName: 'Surabaya Alpha Trader (Sub IB L1)',
      ibType: 'SUB_IB_L1',
      subIbCount: 5,
      activeClientsCount: 68,
      totalVolumeLots: 2100,
      gotradingBrokerCommissionUsd: 21000,
      ibCommissionShare30Usd: 6300, // 30% of 21000
      alreadyPaidUsd: 2000,
      pendingCommissionUsd: 4300,
      status: 'READY_FOR_PAYOUT',
      lastCalculated: '15 mins ago'
    },
    {
      id: 'COMM-IB-203',
      ibId: 'IB-903',
      ibName: 'Rian Hidayat (Sub IB L2)',
      ibType: 'SUB_IB_L2',
      subIbCount: 2,
      activeClientsCount: 32,
      totalVolumeLots: 1250,
      gotradingBrokerCommissionUsd: 12500,
      ibCommissionShare30Usd: 3750, // 30% of 12500
      alreadyPaidUsd: 1000,
      pendingCommissionUsd: 2750,
      status: 'READY_FOR_PAYOUT',
      lastCalculated: '1 hour ago'
    },
    {
      id: 'COMM-IB-204',
      ibId: 'IB-904',
      ibName: 'Medan FX Community (Sub IB L1)',
      ibType: 'SUB_IB_L1',
      subIbCount: 4,
      activeClientsCount: 54,
      totalVolumeLots: 1800,
      gotradingBrokerCommissionUsd: 18000,
      ibCommissionShare30Usd: 5400, // 30% of 18000
      alreadyPaidUsd: 2900,
      pendingCommissionUsd: 2500,
      status: 'READY_FOR_PAYOUT',
      lastCalculated: '2 hours ago'
    }
  ]);

  // Calculations required by User Prompt
  // 1. Total Commission Gotrading dr Broker
  const totalGotradingCommissionFromBroker = 184500; // Total Gotrading commission from Broker
  
  // 2. Total Komisi IB = 30% dr komisi yg gotrading dapat dr broker
  const totalIbCommission30Pct = Math.round(totalGotradingCommissionFromBroker * 0.30); // 55350

  // 3. Total WD IB
  const totalWdIbApproved = ibWithdrawals
    .filter(w => w.status === 'APPROVED')
    .reduce((sum, w) => sum + w.amountUsd, 0); // 17500

  const totalWdIbPending = ibWithdrawals
    .filter(w => w.status === 'PENDING')
    .reduce((sum, w) => sum + w.amountUsd, 0); // 20700

  // 4. Pending Komisi IB
  const totalPendingCommissionIb = ibPendingCommissions.reduce((sum, c) => sum + c.pendingCommissionUsd, 0); // 17150

  // Handlers
  const handleApproveIbWd = (wdId: string) => {
    setIbWithdrawals(prev =>
      prev.map(w =>
        w.id === wdId ? { ...w, status: 'APPROVED', processedBy: 'Master Admin' } : w
      )
    );
  };

  const handleRejectIbWd = (wdId: string) => {
    setIbWithdrawals(prev =>
      prev.map(w =>
        w.id === wdId ? { ...w, status: 'REJECTED', processedBy: 'Master Admin' } : w
      )
    );
  };

  const handleProcessCommissionPayout = (commId: string) => {
    setIbPendingCommissions(prev =>
      prev.map(c => {
        if (c.id === commId) {
          const newPaid = c.alreadyPaidUsd + c.pendingCommissionUsd;
          return {
            ...c,
            alreadyPaidUsd: newPaid,
            pendingCommissionUsd: 0,
            status: 'UNPAID'
          };
        }
        return c;
      })
    );
  };

  return (
    <div className="space-y-6">
      {/* Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-slate-900 border border-slate-800 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-400" /> FINANCE & KOMISI IB GOTRADING
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
              30% IB COMMISSION SHARE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manajemen finansial komisi broker Gotrading, alokasi 30% komisi Sub-IB, penarikan (WD) IB, dan antrean pending payout.
          </p>
        </div>

        <ExportButton filename="gotrading_ib_finance_report" data={ibPendingCommissions} />
      </div>

      {/* 4 CORE FINANCE METRICS REQUESTED BY USER */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Commission Gotrading dr Broker */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl relative overflow-hidden group">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono font-bold text-slate-300">1. TOTAL KOMISI GOTRADING</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 tracking-tight">
            ${totalGotradingCommissionFromBroker.toLocaleString()}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1 font-medium">
            <span>Diterima langsung dari Broker</span>
          </div>
          <div className="mt-2 text-[10px] text-slate-500 font-mono">
            100% komisi bruto dari volume client
          </div>
        </div>

        {/* Metric 2: Total Komisi IB = 30% dr komisi yg gotrading dapat dr broker */}
        <div className="p-5 bg-slate-900 border-2 border-amber-500/40 rounded-xl relative overflow-hidden group shadow-lg shadow-amber-950/20">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono font-bold text-amber-400">2. TOTAL KOMISI IB (30%)</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-400 tracking-tight">
            ${totalIbCommission30Pct.toLocaleString()}
          </div>
          <div className="mt-2 text-xs text-slate-300 font-semibold flex items-center gap-1">
            <span>30% x ${totalGotradingCommissionFromBroker.toLocaleString()}</span>
          </div>
          <div className="mt-2 text-[10px] text-amber-500/80 font-mono">
            Hak jajaran IB & Sub-IB Gotrading
          </div>
        </div>

        {/* Metric 3: Total WD IB */}
        <div
          onClick={() => setActiveTab('IB_WD_LIST')}
          className="p-5 bg-slate-900 border border-slate-800 rounded-xl relative overflow-hidden group cursor-pointer hover:border-slate-700 transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono font-bold text-slate-300">3. TOTAL WD IB</span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white tracking-tight">
            ${(totalWdIbApproved + totalWdIbPending).toLocaleString()}
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-2">
            <span className="text-emerald-400 font-semibold">${totalWdIbApproved.toLocaleString()} Disetujui</span>
            <span className="text-amber-400 font-semibold">${totalWdIbPending.toLocaleString()} Pending</span>
          </div>
          <div className="mt-2 text-[10px] text-sky-400 font-mono flex items-center gap-1">
            <span>Klik untuk cek list IB</span> &rarr;
          </div>
        </div>

        {/* Metric 4: Pending Komisi IB */}
        <div
          onClick={() => setActiveTab('IB_PENDING_LIST')}
          className="p-5 bg-slate-900 border border-slate-800 rounded-xl relative overflow-hidden group cursor-pointer hover:border-slate-700 transition-all"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-mono font-bold text-slate-300">4. PENDING KOMISI IB</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-400 tracking-tight">
            ${totalPendingCommissionIb.toLocaleString()}
          </div>
          <div className="mt-2 text-xs text-slate-300 font-medium">
            Siap untuk diproses ke akun/bank IB
          </div>
          <div className="mt-2 text-[10px] text-sky-400 font-mono flex items-center gap-1">
            <span>Klik untuk cek list IB</span> &rarr;
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`px-4 py-2 font-bold rounded-lg transition-all ${
            activeTab === 'OVERVIEW'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          Ikhtisar Finansial & Kalkulator IB
        </button>

        <button
          onClick={() => setActiveTab('IB_WD_LIST')}
          className={`px-4 py-2 font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'IB_WD_LIST'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <span>List WD IB ({ibWithdrawals.length})</span>
          {ibWithdrawals.filter(w => w.status === 'PENDING').length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px]">
              {ibWithdrawals.filter(w => w.status === 'PENDING').length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('IB_PENDING_LIST')}
          className={`px-4 py-2 font-bold rounded-lg transition-all flex items-center gap-2 ${
            activeTab === 'IB_PENDING_LIST'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <span>List Pending Komisi IB ({ibPendingCommissions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ALL_TX')}
          className={`px-4 py-2 font-bold rounded-lg transition-all ${
            activeTab === 'ALL_TX'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          Semua Transaksi Platform ({transactions.length})
        </button>
      </div>

      {/* TAB 1: OVERVIEW & BREAKDOWN */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-6">
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" /> Skema Alokasi Komisi Broker GOTRADING vs Sub-IB
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                <div className="font-bold text-emerald-400 text-sm">Gotrading Master Revenue Share</div>
                <p className="text-slate-400 leading-relaxed">
                  Dari total komisi yang dibayarkan oleh broker mitra (misalnya $10/lot), Gotrading mengalokasikan:
                </p>
                <ul className="list-disc list-inside text-slate-300 space-y-1">
                  <li><strong className="text-amber-400">30% ($3.00/lot)</strong> didistribusikan kepada Master IB & jajaran Sub-IB.</li>
                  <li><strong className="text-emerald-400">70% ($7.00/lot)</strong> disimpan sebagai pendapatan bersih operasional Gotrading.</li>
                </ul>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                <div className="font-bold text-sky-400 text-sm">Status Payout & Penarikan IB</div>
                <p className="text-slate-400 leading-relaxed">
                  Penarikan komisi IB dapat diproses secara instant melalui transfer bank lokal (BCA, Mandiri) atau USDT.
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => setActiveTab('IB_WD_LIST')}
                    className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded font-bold hover:bg-emerald-500/30"
                  >
                    Proses List WD IB &rarr;
                  </button>
                  <button
                    onClick={() => setActiveTab('IB_PENDING_LIST')}
                    className="px-3 py-1.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded font-bold hover:bg-amber-500/30"
                  >
                    Cek Pending Komisi IB &rarr;
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LIST WD IB */}
      {activeTab === 'IB_WD_LIST' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Cari nama IB, email, atau no rekening..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400">Filter Status:</span>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200"
              >
                <option value="ALL">Semua Status</option>
                <option value="PENDING">Pending Approval</option>
                <option value="APPROVED">Disetujui (Approved)</option>
                <option value="REJECTED">Ditolak (Rejected)</option>
              </select>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                  <tr>
                    <th className="p-3">ID WD</th>
                    <th className="p-3">NAMA IB & TIER</th>
                    <th className="p-3">REKENING / WALLET</th>
                    <th className="p-3 text-right">JUMLAH WD ($)</th>
                    <th className="p-3">WAKTU REQUEST</th>
                    <th className="p-3">STATUS</th>
                    <th className="p-3 text-right">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
                  {ibWithdrawals
                    .filter(w => {
                      const matchSearch =
                        w.ibName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        w.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        w.accountNumber.includes(searchTerm);
                      const matchStatus = statusFilter === 'ALL' || w.status === statusFilter;
                      return matchSearch && matchStatus;
                    })
                    .map(w => (
                      <tr key={w.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-bold text-emerald-400">{w.id}</td>
                        <td className="p-3 font-sans">
                          <div className="font-bold text-white">{w.ibName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{w.email}</div>
                          <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[9px] bg-slate-800 text-amber-400 border border-slate-700">
                            {w.ibType.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3 font-sans">
                          <div className="font-semibold text-slate-200">{w.bankNameOrCrypto}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{w.accountNumber}</div>
                        </td>
                        <td className="p-3 text-right font-bold text-emerald-400 text-sm">
                          ${w.amountUsd.toLocaleString()}
                        </td>
                        <td className="p-3 text-slate-400 text-[11px]">{w.requestedAt}</td>
                        <td className="p-3">
                          <Badge
                            variant={
                              w.status === 'APPROVED'
                                ? 'success'
                                : w.status === 'REJECTED'
                                ? 'danger'
                                : 'warning'
                            }
                          >
                            {w.status}
                          </Badge>
                        </td>
                        <td className="p-3 text-right font-sans">
                          {w.status === 'PENDING' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleApproveIbWd(w.id)}
                                className="px-2.5 py-1 text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded hover:bg-emerald-500/30 transition-colors flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" /> Approve
                              </button>
                              <button
                                onClick={() => handleRejectIbWd(w.id)}
                                className="px-2.5 py-1 text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded hover:bg-rose-500/30 transition-colors flex items-center gap-1"
                              >
                                <X className="w-3 h-3" /> Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-500">Processed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LIST PENDING KOMISI IB */}
      {activeTab === 'IB_PENDING_LIST' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Cari nama IB..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none"
              />
            </div>
            <div className="text-slate-400 font-mono text-[11px]">
              TOTAL PENDING: <span className="font-bold text-amber-400 text-sm">${totalPendingCommissionIb.toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                  <tr>
                    <th className="p-3">NAMA IB & TIER</th>
                    <th className="p-3 text-center">SUB-IB & CLIENT</th>
                    <th className="p-3 text-right">VOLUME (LOTS)</th>
                    <th className="p-3 text-right">KOMISI BROKER (100%)</th>
                    <th className="p-3 text-right">HAK IB (30%)</th>
                    <th className="p-3 text-right text-amber-400">PENDING KOMISI ($)</th>
                    <th className="p-3 text-right">AKSI PAYOUT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
                  {ibPendingCommissions
                    .filter(c => c.ibName.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(c => (
                      <tr key={c.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-sans">
                          <div className="font-bold text-white">{c.ibName}</div>
                          <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] bg-slate-800 text-amber-400 border border-slate-700">
                            {c.ibType.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="text-white font-bold">{c.subIbCount} Sub-IB</div>
                          <div className="text-[10px] text-slate-400 font-mono">{c.activeClientsCount} Clients Active</div>
                        </td>
                        <td className="p-3 text-right font-bold text-sky-400">{c.totalVolumeLots.toLocaleString()} Lots</td>
                        <td className="p-3 text-right font-bold text-slate-200">${c.gotradingBrokerCommissionUsd.toLocaleString()}</td>
                        <td className="p-3 text-right font-bold text-emerald-400">${c.ibCommissionShare30Usd.toLocaleString()}</td>
                        <td className="p-3 text-right font-bold text-amber-400 text-sm">
                          ${c.pendingCommissionUsd.toLocaleString()}
                        </td>
                        <td className="p-3 text-right font-sans">
                          {c.pendingCommissionUsd > 0 ? (
                            <button
                              onClick={() => handleProcessCommissionPayout(c.id)}
                              className="px-3 py-1.5 text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded hover:bg-amber-500/30 transition-colors flex items-center gap-1.5 ml-auto"
                            >
                              <Send className="w-3 h-3" /> Proses Payout Komisi
                            </button>
                          ) : (
                            <span className="text-[11px] text-emerald-400 font-bold flex items-center justify-end gap-1">
                              <CheckCircle className="w-3 h-3" /> Paid Out
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: ALL TRANSACTIONS */}
      {activeTab === 'ALL_TX' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                  <tr>
                    <th className="p-3">TX ID</th>
                    <th className="p-3">TRADER / IB</th>
                    <th className="p-3">TIPE & METODE</th>
                    <th className="p-3 text-right">JUMLAH ($)</th>
                    <th className="p-3">TIMESTAMP</th>
                    <th className="p-3">STATUS</th>
                    <th className="p-3 text-right">AKSI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
                  {transactions.map(t => (
                    <tr key={t.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-bold text-emerald-400">{t.id}</td>
                      <td className="p-3 font-semibold text-white font-sans">{t.userName}</td>
                      <td className="p-3">
                        <span className={`font-bold mr-2 ${t.type === 'DEPOSIT' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {t.type}
                        </span>
                        <span className="text-slate-400 text-[11px] font-sans">({t.method.replace('_', ' ')})</span>
                      </td>
                      <td className="p-3 text-right font-bold text-slate-100">${t.amount.toLocaleString()}</td>
                      <td className="p-3 text-slate-400 text-[11px]">{t.timestamp}</td>
                      <td className="p-3">
                        <Badge
                          variant={
                            t.status === 'APPROVED'
                              ? 'success'
                              : t.status === 'REJECTED'
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {t.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-right font-sans">
                        {t.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => onApprove(t.id)}
                              className="px-2.5 py-1 text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded hover:bg-emerald-500/30 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => onReject(t.id)}
                              className="px-2.5 py-1 text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded hover:bg-rose-500/30 transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
