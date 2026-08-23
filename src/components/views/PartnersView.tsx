import React, { useState, useEffect, useCallback } from 'react';
import {
  UserCheck,
  Users,
  Award,
  DollarSign,
  TrendingUp,
  Network,
  Building2,
  Plus,
  ArrowRight,
  Settings2,
  Percent,
  CheckCircle2,
  Edit,
  X,
  Save,
  Check,
  AlertCircle,
  RefreshCw,
  Globe,
  MapPin,
  Clock,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import { PartnerIB } from '../../types';
import { apiService } from '../../services/api';

interface PartnersViewProps {
  partners?: PartnerIB[];
  onUpdateCommissionRate?: (partnerId: string, ratePct: number) => void;
}

export const PartnersView: React.FC<PartnersViewProps> = ({ partners: initialPartners = [], onUpdateCommissionRate }) => {
  const [partnerList, setPartnerList] = useState<PartnerIB[]>(initialPartners);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal State for Setting Commission Rate
  const [editingPartner, setEditingPartner] = useState<PartnerIB | null>(null);
  const [newCommissionRate, setNewCommissionRate] = useState<number>(30);
  const [filterRole, setFilterRole] = useState<'ALL' | 'MASTER_IB' | 'SUB_IB'>('ALL');

  const fetchPartners = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await apiService.getPartners();
      if (Array.isArray(data)) {
        setPartnerList(data);
      } else {
        throw new Error('Format data partner tidak valid dari server');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengambil data dari /api/admin/ib');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const handleOpenEditCommission = (partner: PartnerIB) => {
    setEditingPartner(partner);
    setNewCommissionRate(partner.commissionRatePct || partner.ratePerLot || 30);
  };

  const handleSaveCommissionRate = () => {
    if (!editingPartner) return;
    const updated = partnerList.map(p => {
      if (p.id === editingPartner.id) {
        return {
          ...p,
          commissionRatePct: newCommissionRate,
          ratePerLot: newCommissionRate
        };
      }
      return p;
    });
    setPartnerList(updated);
    if (onUpdateCommissionRate) {
      onUpdateCommissionRate(editingPartner.id, newCommissionRate);
    }
    setEditingPartner(null);
  };

  const filteredPartners = partnerList.filter(p => {
    const role = (p.role || (p.referred_by ? 'SUB_IB' : 'MASTER_IB')).toUpperCase();
    if (filterRole === 'MASTER_IB') return role === 'MASTER_IB';
    if (filterRole === 'SUB_IB') return role === 'SUB_IB';
    return true;
  });

  // Calculate totals for summary cards
  const totalPartnersCount = partnerList.length;
  const totalDownlines = partnerList.reduce((acc, p) => acc + (p.downlineCount || p.referredUsersCount || 0), 0);
  const activeDownlines = partnerList.reduce((acc, p) => acc + (p.activeDownline || p.activeTradersCount || 0), 0);
  const totalEarningsAll = partnerList.reduce((acc, p) => acc + (p.earnings?.total || p.earnedCommissionUsd || 0), 0);
  const totalPayoutsPaid = partnerList.reduce((acc, p) => acc + (p.payouts?.paid || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-slate-900 border border-slate-800 rounded-xl">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-400" /> GOTRADING PARTNER &amp; SUB-IB NETWORK
            </h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <Network className="w-3 h-3" /> LIVE API (/api/admin/ib)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manajemen lengkap partner IB, tier komisi, downline aktif, breakdown earnings, dan tracking payout real-time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchPartners}
            disabled={isLoading}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-slate-700 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Error State Banner */}
      {errorMessage && (
        <div className="p-4 bg-rose-950/40 border border-rose-800/60 rounded-xl flex items-center justify-between gap-4 text-xs text-rose-300">
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
            <div>
              <span className="font-bold text-white">Gagal Memuat Data Partner:</span> {errorMessage}
            </div>
          </div>
          <button
            onClick={fetchPartners}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-slate-400 text-xs font-mono font-bold flex items-center justify-between">
            <span>TOTAL PARTNERS / IBs</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white mt-1">{totalPartnersCount} IBs</div>
          <div className="text-[11px] text-slate-500 mt-1">Master &amp; Sub-IB Terdaftar</div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-slate-400 text-xs font-mono font-bold flex items-center justify-between">
            <span>TOTAL DOWNLINE TRADERS</span>
            <UserCheck className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-sky-400 mt-1">{totalDownlines} Downlines</div>
          <div className="text-[11px] text-slate-500 mt-1">{activeDownlines} Aktif Berdagang</div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-slate-400 text-xs font-mono font-bold flex items-center justify-between">
            <span>TOTAL EARNINGS KOMISI</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-1">${totalEarningsAll.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500 mt-1">Akumulasi komisi seluruh partner</div>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-slate-400 text-xs font-mono font-bold flex items-center justify-between">
            <span>TOTAL PAYOUT DIBAYARKAN</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 mt-1">${totalPayoutsPaid.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500 mt-1">Selesai ditransfer ke wallet/bank</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-400 font-mono text-[11px] mr-1">Filter Tipe IB:</span>
          <button
            onClick={() => setFilterRole('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
              filterRole === 'ALL' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white bg-slate-950'
            }`}
          >
            Semua Partner ({partnerList.length})
          </button>
          <button
            onClick={() => setFilterRole('MASTER_IB')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
              filterRole === 'MASTER_IB' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white bg-slate-950'
            }`}
          >
            Master IB ({partnerList.filter(p => (p.role || (p.referred_by ? 'SUB_IB' : 'MASTER_IB')) === 'MASTER_IB').length})
          </button>
          <button
            onClick={() => setFilterRole('SUB_IB')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
              filterRole === 'SUB_IB' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white bg-slate-950'
            }`}
          >
            Sub-IB ({partnerList.filter(p => Boolean(p.referred_by || p.role === 'SUB_IB')).length})
          </button>
        </div>
      </div>

      {/* Loading state indicator */}
      {isLoading && (
        <div className="p-12 bg-slate-900 border border-slate-800 rounded-xl flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          <span className="text-xs text-slate-400 font-mono">Memuat data partner IB dari /api/admin/ib...</span>
        </div>
      )}

      {/* Partner List Cards & Table */}
      {!isLoading && filteredPartners.length === 0 && (
        <div className="p-12 bg-slate-900 border border-slate-800 rounded-xl text-center text-slate-400 text-xs">
          Tidak ada data partner IB yang ditemukan.
        </div>
      )}

      {!isLoading && filteredPartners.length > 0 && (
        <div className="grid grid-cols-1 gap-4">
          {filteredPartners.map(partner => {
            const isSubIb = Boolean(partner.referred_by);
            const roleLabel = partner.role || (isSubIb ? 'SUB_IB' : 'MASTER_IB');
            const tierName = partner.ib_commission_tiers?.name || partner.tier || 'Standard Tier';
            const ratePerLot = partner.ib_commission_tiers?.rate_per_lot ?? partner.ratePerLot ?? 5.0;
            const downlineTotal = partner.downlineCount ?? partner.referredUsersCount ?? 0;
            const downlineActive = partner.activeDownline ?? partner.activeTradersCount ?? 0;
            const earningsTotal = partner.earnings?.total ?? partner.earnedCommissionUsd ?? 0;
            const earningsPending = partner.earnings?.pending ?? 0;
            const earningsApproved = partner.earnings?.approved ?? 0;
            const earningsPaid = partner.earnings?.paid ?? 0;
            const earningsVoid = partner.earnings?.void ?? 0;
            const payoutRequested = partner.payouts?.requested ?? 0;
            const payoutPaid = partner.payouts?.paid ?? 0;

            return (
              <div
                key={partner.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 transition-all space-y-4 shadow-md"
              >
                {/* Top Bar: Basic Info & Referral */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 shrink-0 mt-0.5">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white">{partner.email}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            roleLabel === 'MASTER_IB'
                              ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                              : 'bg-sky-500/20 text-sky-400 border-sky-500/30'
                          }`}
                        >
                          {roleLabel.replace('_', ' ')}
                        </span>
                        {isSubIb && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                            <ArrowRight className="w-3 h-3 text-emerald-400" /> Upline: {partner.referred_by}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono flex-wrap">
                        <span>Kode: <strong className="text-amber-400">{partner.referral_code || 'GT-REF'}</strong></span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-500" /> {partner.city || '-'}, {partner.province || partner.ib_region || 'Indonesia'}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3 text-slate-500" /> {partner.country || 'ID'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-auto">
                    <div className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-right">
                      <div className="text-[10px] text-slate-400">COMMISSION TIER</div>
                      <div className="font-bold text-emerald-400">{tierName} (${ratePerLot}/lot)</div>
                    </div>
                    <button
                      onClick={() => handleOpenEditCommission(partner)}
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs rounded-lg transition-colors border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Settings2 className="w-4 h-4" /> Edit Rate
                    </button>
                  </div>
                </div>

                {/* Grid Details: Downline, Earnings breakdown, Payouts */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                  {/* Downline Column */}
                  <div className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-xl space-y-2">
                    <div className="text-slate-400 font-bold flex items-center gap-1.5 text-[11px]">
                      <Users className="w-3.5 h-3.5 text-sky-400" /> DOWNLINE TRADERS
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-center">
                        <div className="text-[10px] text-slate-500">TOTAL</div>
                        <div className="text-base font-black text-white mt-0.5">{downlineTotal}</div>
                      </div>
                      <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-center">
                        <div className="text-[10px] text-slate-500">AKTIF TRADING</div>
                        <div className="text-base font-black text-emerald-400 mt-0.5">{downlineActive}</div>
                      </div>
                    </div>
                  </div>

                  {/* Earnings Breakdown Column */}
                  <div className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-xl space-y-2">
                    <div className="text-slate-400 font-bold flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-400" /> EARNINGS BREAKDOWN
                      </span>
                      <span className="text-emerald-400 font-black">Total: ${earningsTotal.toLocaleString()}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1 pt-1 text-[10px]">
                      <div className="p-1.5 bg-slate-900 rounded border border-slate-800 text-center">
                        <div className="text-slate-500">Pending</div>
                        <div className="font-bold text-amber-400 mt-0.5">${earningsPending}</div>
                      </div>
                      <div className="p-1.5 bg-slate-900 rounded border border-slate-800 text-center">
                        <div className="text-slate-500">Approved</div>
                        <div className="font-bold text-sky-400 mt-0.5">${earningsApproved}</div>
                      </div>
                      <div className="p-1.5 bg-slate-900 rounded border border-slate-800 text-center">
                        <div className="text-slate-500">Paid</div>
                        <div className="font-bold text-emerald-400 mt-0.5">${earningsPaid}</div>
                      </div>
                      <div className="p-1.5 bg-slate-900 rounded border border-slate-800 text-center">
                        <div className="text-slate-500">Void</div>
                        <div className="font-bold text-slate-400 mt-0.5">${earningsVoid}</div>
                      </div>
                    </div>
                  </div>

                  {/* Payouts Column */}
                  <div className="p-3.5 bg-slate-950 border border-slate-800/80 rounded-xl space-y-2">
                    <div className="text-slate-400 font-bold flex items-center gap-1.5 text-[11px]">
                      <Award className="w-3.5 h-3.5 text-amber-400" /> PAYOUTS (REQUESTED VS PAID)
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-center">
                        <div className="text-[10px] text-slate-500">REQUESTED</div>
                        <div className="text-sm font-black text-amber-400 mt-0.5">${payoutRequested.toLocaleString()}</div>
                      </div>
                      <div className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-center">
                        <div className="text-[10px] text-slate-500">PAID OUT</div>
                        <div className="text-sm font-black text-emerald-400 mt-0.5">${payoutPaid.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EDIT COMMISSION RATE MODAL */}
      {editingPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
                  <Percent className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Ubah Rate Komisi IB</h3>
                  <p className="text-xs text-slate-400">{editingPartner.email}</p>
                </div>
              </div>
              <button
                onClick={() => setEditingPartner(null)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs font-mono">
              <div>
                <label className="block text-slate-300 font-bold mb-1">RATE PER LOT ($)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="100"
                  value={newCommissionRate}
                  onChange={e => setNewCommissionRate(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-amber-400 font-bold text-sm"
                />
              </div>

              <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl text-slate-300 text-[11px] font-sans leading-relaxed">
                ℹ️ Perubahan rate per lot ini akan langsung diterapkan pada kalkulasi komisi partner IB yang bersangkutan.
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  onClick={() => setEditingPartner(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl transition-colors font-sans"
                >
                  Batal
                </button>
                <button
                  onClick={handleSaveCommissionRate}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-emerald-950/40 font-sans"
                >
                  <Save className="w-4 h-4" /> Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
