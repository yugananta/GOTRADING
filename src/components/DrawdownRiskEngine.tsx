import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/apiFetch';
import { useApp } from './AppContext.js';
import { motion } from 'motion/react';
import { ShieldAlert, RefreshCw, AlertTriangle } from 'lucide-react';

export const DrawdownRiskEngine: React.FC = () => {
  const { currentUser } = useApp();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/users/${currentUser.id}/drawdown-risk`);
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.error || 'Failed to fetch risk assessment');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center text-rose-500 bg-rose-50 rounded-xl">
        <AlertTriangle className="mx-auto mb-2" />
        {error}
      </div>
    );
  }

  
  if (!data) return null;

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-emerald-500 bg-emerald-50 border-emerald-200';
    if (score >= 60) return 'text-amber-500 bg-amber-50 border-amber-200';
    if (score >= 40) return 'text-orange-500 bg-orange-50 border-orange-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* SCORE CARD */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm text-center relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full blur-2xl -mr-10 -mt-10" />
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Drawdown Score</h2>
        
        <div className={`w-32 h-32 mx-auto rounded-full border-4 flex flex-col items-center justify-center mb-6 ${getScoreColor(data.score)}`}>
          <span className="text-4xl font-black">{data.score}</span>
        </div>
        
        <div className="inline-block px-4 py-1.5 rounded-full text-sm font-black tracking-wider uppercase mb-2" style={{ backgroundColor: 'var(--tw-bg-opacity)', color: 'inherit' }}>
           <span className={getScoreColor(data.score).split(' ')[0]}>{data.category}</span>
        </div>
        
        {data.confidence !== 'RELIABLE' && (
          <p className="text-xs text-amber-600 mt-2 font-medium">
             ⚠️ {data.confidence}: This score may change significantly as more trading data is collected.
          </p>
        )}
      </motion.div>

      {/* METRICS ROW */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Current DD</span>
          <span className="text-xl font-black text-slate-800">{data.currentDrawdown.toFixed(1)}%</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Typical DD</span>
          <span className="text-xl font-black text-slate-800">{data.typicalDrawdown.toFixed(1)}%</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Historical Max</span>
          <span className="text-xl font-black text-slate-800">{data.historicalMaxDrawdown.toFixed(1)}%</span>
        </div>
      </div>

      {/* ASSESSMENT */}
      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
         <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-3">Assessment</h3>
         <p className="text-sm text-slate-700 leading-relaxed font-medium">
           {data.explanation}
         </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* RISK PROFILE */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
           <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Risk Profile</h3>
           <span className="text-sm font-bold text-slate-800">{data.historicalRiskProfile}</span>
        </div>
        
        {/* DD TREND */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
           <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">DD Trend</h3>
           <span className="text-sm font-bold text-slate-800">{data.drawdownTrend}</span>
        </div>
      </div>

      {/* ADVICE */}
      <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100">
         <h3 className="text-xs font-black uppercase tracking-widest text-indigo-500 mb-3">Go Trading Advice</h3>
         <p className="text-sm text-indigo-900 leading-relaxed font-medium">
           {data.advice}
         </p>
      </div>
      
      {/* RECOVERY EXPLANATION */}
      {data.currentDrawdown > 5 && data.recoveryRequired > 0 && (
         <div className="text-center">
           <p className="text-xs text-slate-500 font-medium">
             At a {data.currentDrawdown.toFixed(1)}% drawdown, your equity would need to gain approximately {data.recoveryRequired.toFixed(1)}% to return to the previous peak.
           </p>
         </div>
      )}
      
    </div>
  );
};
