import React, { useState, useEffect } from 'react';
import { Award, Trophy, Medal, Flame, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { formatToK } from '../utils/formatters.ts';
import { useApp } from './AppContext.tsx';
import { apiFetch } from '../utils/apiFetch';

interface LeaderboardUser {
  id: string;
  name: string;
  username: string;
  city?: string;
  country?: string;
  avatar: string;
  experience: string;
  reputation?: number;
  score?: number;
  activityIndex?: number;
  rank: number;
}

let cachedLeaderboardData: Record<string, any> = {};

export const Leaderboard: React.FC = () => {
  const { viewUserProfile } = useApp();
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'alltime'>('weekly');
  const [category, setCategory] = useState<'contributors' | 'helpful' | 'active'>('contributors');
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  
  const [contributors, setContributors] = useState<LeaderboardUser[]>(cachedLeaderboardData['weekly']?.contributors || []);
  const [helpful, setHelpful] = useState<LeaderboardUser[]>(cachedLeaderboardData['weekly']?.helpful || []);
  const [active, setActive] = useState<LeaderboardUser[]>(cachedLeaderboardData['weekly']?.active || []);
  const [loading, setLoading] = useState(!cachedLeaderboardData['weekly']);

  useEffect(() => {
    // If we change period, immediately try to load from cache
    if (cachedLeaderboardData[period]) {
      setContributors(cachedLeaderboardData[period].contributors || []);
      setHelpful(cachedLeaderboardData[period].helpful || []);
      setActive(cachedLeaderboardData[period].active || []);
      setLoading(false);
    } else {
      setLoading(true);
    }

    apiFetch(`/api/leaderboard?period=${period}`)
      .then(res => {
        if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
          return res.json();
        }
        return {};
      })
      .then(data => {
        const safeData: any = data || {};
        cachedLeaderboardData[period] = safeData;
        setContributors(safeData.contributors || []);
        setHelpful(safeData.helpful || []);
        setActive(safeData.active || []);
        setLoading(false);
      })
      .catch(err => {
        console.error("Leaderboard fetch error:", err);
        if (!cachedLeaderboardData[period]) {
          setContributors([]);
          setHelpful([]);
          setActive([]);
        }
        setLoading(false);
      });
  }, [period]);

  const activeList = category === 'contributors' ? contributors : category === 'helpful' ? helpful : active;

  const renderRankBadge = (rank: number) => {
    if (rank === 1) return <span className="text-xl">🥇</span>;
    if (rank === 2) return <span className="text-xl">🥈</span>;
    if (rank === 3) return <span className="text-xl">🥉</span>;
    return <span className="text-xs font-bold text-gray-400 dark:text-gray-500 w-6 h-6 flex items-center justify-center bg-[#181D28] dark:bg-[#121620] border border-gray-200 dark:border-white/10 rounded-full">{rank}</span>;
  };

  const getMetricLabel = () => {
    if (category === 'contributors') return 'Reputation';
    if (category === 'helpful') return 'Helpful Index';
    return 'Activity Index';
  };

  const getMetricValue = (item: LeaderboardUser) => {
    if (category === 'contributors') return `${formatToK(item.reputation || 0)} REP`;
    if (category === 'helpful') return `${formatToK(item.score || 0)} PTS`;
    return `${formatToK(item.activityIndex || 0)} ACT`;
  };

  return (
    <div id="leaderboard-view" className="space-y-4 py-2">
      
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="text-amber-400" size={20} />
          <h2 className="text-lg font-bold text-gray-900 dark:text-white font-sans">Traders Reputation</h2>
        </div>
      </div>

      {/* How it works info box */}
      <div className="bg-white/80 dark:bg-[#121620]/80 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl p-3.5 shadow-sm">
        <button 
          onClick={() => setShowHowItWorks(!showHowItWorks)}
          className="w-full flex items-center justify-between font-bold text-xs text-slate-700 dark:text-gray-300 transition-colors hover:text-indigo-600"
        >
          <div className="flex items-center gap-2">
            <Info size={14} className="text-indigo-500" />
            <span>Bagaimana perhitungan poin reputasi dihitung?</span>
          </div>
          {showHowItWorks ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showHowItWorks && (
          <div className="mt-3 text-[11px] text-slate-500 dark:text-gray-400 leading-relaxed space-y-2.5 border-t border-slate-100 dark:border-white/5 pt-3 animate-in fade-in duration-200">
            <p>
              Sistem reputasi <strong>Traders Reputation</strong> dirancang dengan <strong>Diminishing Returns (Penyusutan Logaritmis)</strong> untuk mengapresiasi kualitas & konsistensi jangka panjang tanpa membiarkan poin membengkak hingga jutaan atau ratusan juta.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              <div className="bg-slate-50 dark:bg-[#181d28] p-2.5 rounded-xl border border-slate-100 dark:border-white/5">
                <span className="font-extrabold text-slate-800 dark:text-white block mb-1 text-[11px]">🔥 Top Contributors (REP)</span>
                Mengukur dampak dari analisis market yang Anda bagikan. Poin dasar:
                <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[10px]">
                  <li>Menerima <strong>Like</strong>: <strong className="text-indigo-600 dark:text-indigo-400">+1 REP</strong></li>
                  <li>Menerima <strong>Komentar</strong> / rilis post: <strong className="text-indigo-600 dark:text-indigo-400">+2 REP</strong></li>
                  <li>Postingan Anda di-<strong>Repost</strong> / di-<strong>Follow</strong>: <strong className="text-indigo-600 dark:text-indigo-400">+3 REP</strong></li>
                </ul>
              </div>
              <div className="bg-slate-50 dark:bg-[#181d28] p-2.5 rounded-xl border border-slate-100 dark:border-white/5">
                <span className="font-extrabold text-slate-800 dark:text-white block mb-1 text-[11px]">🛡️ Formula Penyusutan</span>
                Setiap tambahan poin akan dikalikan dengan faktor penyusutan:
                <div className="mt-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded font-mono text-[9px] text-center text-indigo-600 dark:text-indigo-400 font-bold">
                  300 / (300 + Reputasi Saat Ini)
                </div>
                <p className="mt-1 text-[9px] text-slate-400">
                  Ini berarti semakin tinggi reputasi Anda, semakin lambat pertumbuhannya demi menjaga prestise & kompetisi yang sehat.
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-[#181d28] p-2.5 rounded-xl border border-slate-100 dark:border-white/5">
                <span className="font-extrabold text-slate-800 dark:text-white block mb-1 text-[11px]">⚡ Super Active (ACT)</span>
                Mengukur konsistensi aktivitas harian dan kehadiran Anda:
                <ul className="list-disc pl-4 mt-1 space-y-0.5 text-[10px]">
                  <li>Berdasarkan frekuensi rilis jurnal/postingan harian secara konsisten.</li>
                  <li>Status online aktif di aplikasi mendapatkan bobot prioritas dinamis.</li>
                </ul>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 dark:text-gray-500 italic pt-1 border-t border-slate-100 dark:border-white/5">
              *Catatan: Filter periode <strong>Weekly</strong> dan <strong>Monthly</strong> menerapkan pembobotan skala (scale-weighting) sesuai rentang waktu aktif untuk mendistribusikan peringkat secara dinamis.
            </p>
          </div>
        )}
      </div>

      {/* Period selector */}
      <div className="grid grid-cols-3 gap-1 bg-white dark:bg-[#121620] p-1 border border-gray-200 dark:border-gray-800/80 rounded-xl">
        {[
          { id: 'weekly', label: 'Weekly' },
          { id: 'monthly', label: 'Monthly' },
          { id: 'alltime', label: 'All Time' }
        ].map(p => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id as any)}
            className={`py-1.5 px-3 rounded-lg text-center text-[10px] font-bold transition uppercase tracking-wider ${
              period === p.id
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Category select tab */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 text-xs">
        {[
          { id: 'contributors', label: 'Contributors', icon: Award },
          { id: 'helpful', label: 'Most Helpful', icon: Medal },
          { id: 'active', label: 'Active', icon: Flame }
        ].map(cat => {
          const Icon = cat.icon;
          return (
            <button
              key={cat.id}
              onClick={() => setCategory(cat.id as any)}
              className={`flex-1 py-3 text-center font-semibold transition border-b-2 flex items-center justify-center gap-1 ${
                category === cat.id
                  ? 'border-indigo-500 text-gray-900 dark:text-white'
                  : 'border-transparent text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <Icon size={12} />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Ranks Arena Card List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 bg-white/80 dark:bg-[#121620]/80 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
            <div className="inline-block w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-xs text-slate-400">Loading arena statistics...</p>
          </div>
        ) : activeList.length === 0 ? (
          <div className="text-center py-8 bg-white/80 dark:bg-[#121620]/80 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl p-5 shadow-sm">
            <p className="text-xs text-slate-400">No statistics recorded for this interval.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {activeList.map((item) => (
              <div 
                key={item.id} 
                onClick={() => viewUserProfile(item.id)}
                className="bg-white/80 dark:bg-[#121620]/80 backdrop-blur-md border border-slate-200 dark:border-white/10 rounded-2xl p-3.5 flex flex-col justify-between shadow-sm cursor-pointer hover:border-indigo-500/30 dark:hover:border-indigo-500/30 transition-all animate-in fade-in duration-300"
              >
                
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Rank Badge on left */}
                    <div className="shrink-0 flex items-center justify-center w-8 h-10 select-none">
                      {renderRankBadge(item.rank)}
                    </div>

                    {/* Avatar */}
                    <div className="relative shrink-0 mt-0.5">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white font-black flex items-center justify-center text-xs shadow-sm">
                        {item.avatar && (item.avatar.startsWith('http') || item.avatar.startsWith('data:')) ? (
                          <img src={item.avatar} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          item.avatar
                        )}
                      </div>
                    </div>
                    
                    {/* Username & Region */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-white leading-tight hover:text-indigo-600 transition-colors truncate">
                          {item.name}
                        </h4>
                        <span className="text-[8px] px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-extrabold uppercase tracking-wider shrink-0">
                          {item.experience}
                        </span>
                      </div>
                      
                      <p className="text-[11px] text-slate-400 dark:text-gray-500 font-medium truncate mt-0.5">
                        {item.city || 'Tasikmalaya'}, {item.country || 'Indonesia'}
                      </p>
                    </div>
                  </div>

                  {/* Leaderboard Metric Info on top-right */}
                  <div className="flex flex-col items-end shrink-0 text-right">
                    <span className="text-xs font-mono font-black text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 dark:bg-indigo-500/10 px-2.5 py-1 rounded-lg">
                      {getMetricValue(item)}
                    </span>
                    <span className="text-[9px] text-slate-400 dark:text-gray-500 font-bold uppercase tracking-wider mt-1">{getMetricLabel()}</span>
                  </div>
                </div>

                {/* Footer section of Card */}
                <div className="flex items-center justify-between mt-3 text-[10px] border-t border-slate-100 dark:border-white/5 pt-2">
                  <div className="flex items-center gap-1.5">
                    <span className="bg-indigo-500/10 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-extrabold px-1.5 py-0.5 rounded-md text-[9px]">
                      Rank #{item.rank}
                    </span>
                    <span className="bg-amber-500/10 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold px-1.5 py-0.5 rounded-md text-[9px]">
                      {category === 'contributors' ? 'Top Contributor' : category === 'helpful' ? 'Most Helpful' : 'Super Active'}
                    </span>
                  </div>

                  {item.username && (
                    <div className="text-[10px] text-slate-400 dark:text-gray-500 font-medium select-none">
                      @{item.username}
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
