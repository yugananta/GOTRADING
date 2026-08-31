import React, { useState, useEffect } from 'react';
import { X, Calendar, Activity, AlertTriangle, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from './AppContext.tsx';
import { apiFetch } from '../utils/apiFetch.ts';

interface AIDailyBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIDailyBriefModal: React.FC<AIDailyBriefModalProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useApp();
  const [brief, setBrief] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && currentUser) {
      fetchBrief();
    }
  }, [isOpen, currentUser]);

  const fetchBrief = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const localDate = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      const res = await apiFetch(`/api/users/${currentUser?.id}/daily-brief?localDate=${localDate}&timezone=${timezone}`);
      if (res.success) {
        setBrief(res.data);
      }
    } catch (e) {
      console.error('Failed to fetch daily brief', e);
    } finally {
      setLoading(false);
    }
  };

  const formattedDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-[101] bg-white dark:bg-[#121620] sm:rounded-2xl rounded-t-2xl w-full sm:max-w-md max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800"
          >
            <div className="flex-none p-5 pb-4 border-b border-slate-100 dark:border-slate-800/60 bg-gradient-to-r from-indigo-50/50 to-white dark:from-indigo-950/20 dark:to-[#121620] relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 bg-white/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
              
              <div className="flex items-center gap-2.5 mb-2">
                <span className="text-xl">🤖</span>
                <h2 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">AI Daily Brief</h2>
              </div>
              <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                {formattedDate}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                  <p className="mt-4 text-sm font-medium text-slate-500">Generating today's intelligence...</p>
                </div>
              ) : brief ? (
                <div className="space-y-7 pb-4">
                  
                  {/* Greeting */}
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                      Good morning, {currentUser?.firstName || 'Trader'}.
                    </h3>
                  </div>

                  {/* Today's Market */}
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Activity size={14} className="text-blue-500" />
                      Today's Market
                    </h4>
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                      {brief.marketContext}
                    </p>
                  </div>

                  {/* High Impact Events */}
                  {brief.highImpactEvents && brief.highImpactEvents.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Calendar size={14} className="text-rose-500" />
                        High Impact Events
                      </h4>
                      
                      <div className="space-y-2.5">
                        {brief.highImpactEvents.map((evt: any) => (
                          <div key={evt.id} className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80 rounded-xl">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="text-sm font-bold text-slate-900 dark:text-white">{evt.title}</div>
                                <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 mt-0.5">{evt.impact}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">{evt.time}</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase mt-1 pr-1">{evt.currency}</div>
                              </div>
                            </div>
                            
                            {(evt.forecast || evt.previous) && (
                              <div className="flex items-center gap-4 mt-2.5 pt-2.5 border-t border-slate-200 dark:border-slate-700/50">
                                {evt.forecast && (
                                  <div className="text-xs">
                                    <span className="text-slate-500 font-medium">Forecast:</span> <span className="font-semibold text-slate-700 dark:text-slate-300">{evt.forecast}</span>
                                  </div>
                                )}
                                {evt.previous && (
                                  <div className="text-xs">
                                    <span className="text-slate-500 font-medium">Previous:</span> <span className="font-semibold text-slate-700 dark:text-slate-300">{evt.previous}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Your Trading Context */}
                  {brief.traderContext && (
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <AlertTriangle size={14} className="text-amber-500" />
                        Your Trading Context
                      </h4>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                        {brief.traderContext}
                      </p>
                    </div>
                  )}

                  {/* Watch Today */}
                  {brief.watchItems && brief.watchItems.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Activity size={14} className="text-indigo-500" />
                        Watch Today
                      </h4>
                      <ul className="space-y-2">
                        {brief.watchItems.map((item: string, i: number) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300 font-medium">
                            <span className="text-indigo-400 mt-1 shrink-0">•</span>
                            <span className="leading-snug">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* GoTrading Advice */}
                  {brief.advice && (
                    <div className="space-y-2 mt-4 p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-xl">
                      <h4 className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 mb-2">
                        <Lightbulb size={14} />
                        GoTrading Advice
                      </h4>
                      <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                        {brief.advice}
                      </p>
                    </div>
                  )}

                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 text-sm font-medium">
                  Failed to load Daily Brief.
                </div>
              )}
            </div>
            
            <div className="flex-none p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-[#121620]">
                <button
                    onClick={() => {
                        onClose();
                        window.dispatchEvent(new CustomEvent('navigate', { detail: 'outlook' }));
                    }}
                    className="w-full py-3 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold rounded-xl transition-colors cursor-pointer text-center"
                >
                    View Economic Calendar
                </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
