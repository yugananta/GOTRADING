import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Download, Copy, Share2, Sparkles, Check, ShieldCheck, TrendingUp, Award, Zap, Palette } from 'lucide-react';
import { toPng } from 'html-to-image';
import { TaraptiLogo } from './TaraptiLogo.tsx';

export interface SummaryCardData {
  date: string;
  netPL: number;
  netPLPercent: number;
  tradesCount: number;
  wins?: number;
  losses?: number;
  winRate?: number;
  bestTrade?: number;
  worstTrade?: number;
  profitFactor?: number | string;
  accountName: string;
  username?: string;
  avatar?: string;
  balance?: number;
  equity?: number;
  floatingProfit?: number;
  drawdown?: number;
  deposit?: number;
  withdrawal?: number;
}

interface ShareSummaryCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: SummaryCardData;
  showToast?: (msg: string, duration?: number) => void;
}

type CardTheme = 'emeraldLuxe' | 'midnightCyber' | 'cleanLight' | 'goldPro';

export const ShareSummaryCardModal: React.FC<ShareSummaryCardModalProps> = ({
  isOpen,
  onClose,
  data,
  showToast,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [selectedTheme, setSelectedTheme] = useState<CardTheme>('emeraldLuxe');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPercent, setShowPercent] = useState(true);

  if (!isOpen) return null;

  const isProfit = data.netPL >= 0;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    try {
      setIsGenerating(true);
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        quality: 1,
        pixelRatio: 2,
      });
      
      const link = document.createElement('a');
      const safeDate = data.date.replace(/[^a-zA-Z0-9]/g, '_');
      link.download = `Tarapti_Results_${safeDate}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (showToast) {
        showToast("📸 Summary card downloaded successfully!", 3500);
      }
    } catch (err) {
      console.error("Failed to generate image:", err);
      if (showToast) {
        showToast("Error generating card image. Try again.", 3000);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyImage = async () => {
    if (!cardRef.current) return;
    try {
      setIsGenerating(true);
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        quality: 1,
        pixelRatio: 2,
      });

      const res = await fetch(dataUrl);
      const blob = await res.blob();

      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob })
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
        if (showToast) {
          showToast("📋 Card image copied to clipboard!", 3000);
        }
      } else {
        // Fallback to download if ClipboardItem is restricted in iframe
        handleDownload();
      }
    } catch (err) {
      console.error("Failed to copy image:", err);
      // Fallback
      handleDownload();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNativeShare = async () => {
    if (!cardRef.current) return;
    try {
      setIsGenerating(true);
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        quality: 1,
        pixelRatio: 2,
      });

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `Trading_Summary_${data.date}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Trading Summary - ${data.date}`,
          text: `My trading performance on ${data.date}: ${isProfit ? '+' : ''}$${Math.abs(data.netPL).toFixed(2)} (${data.winRate.toFixed(0)}% Win Rate). Verified with Tarapti Journal!`,
          files: [file]
        });
        if (showToast) {
          showToast("🚀 Shared successfully!", 3000);
        }
      } else {
        handleDownload();
      }
    } catch (err) {
      console.error("Failed to share:", err);
      handleDownload();
    } finally {
      setIsGenerating(false);
    }
  };

  // Theme styling helpers
  const getThemeStyles = () => {
    switch (selectedTheme) {
      case 'emeraldLuxe':
        return {
          container: "bg-gradient-to-b from-[#0B1321] via-[#091522] to-[#050D18] text-white border-emerald-500/20 shadow-emerald-950/50",
          cardGlow: "bg-emerald-500/10",
          badgeBg: isProfit ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400" : "bg-rose-500/15 border-rose-500/30 text-rose-400",
          accentText: isProfit ? "text-emerald-400" : "text-rose-400",
          subText: "text-slate-400",
          boxBg: "bg-white/[0.04] border-white/10",
          statVal: "text-slate-100",
          watermark: "text-emerald-400/80",
        };
      case 'midnightCyber':
        return {
          container: "bg-gradient-to-br from-[#0D1117] via-[#161B22] to-[#0D1117] text-white border-indigo-500/30 shadow-indigo-950/50",
          cardGlow: "bg-indigo-500/10",
          badgeBg: isProfit ? "bg-indigo-500/20 border-indigo-400/40 text-indigo-300" : "bg-rose-500/20 border-rose-400/40 text-rose-300",
          accentText: isProfit ? "text-indigo-400" : "text-rose-400",
          subText: "text-slate-400",
          boxBg: "bg-indigo-950/20 border-indigo-500/20",
          statVal: "text-indigo-100",
          watermark: "text-indigo-400/80",
        };
      case 'goldPro':
        return {
          container: "bg-gradient-to-b from-[#14120E] via-[#1C1813] to-[#120F0B] text-amber-100 border-amber-500/30 shadow-amber-950/50",
          cardGlow: "bg-amber-500/10",
          badgeBg: isProfit ? "bg-amber-500/20 border-amber-400/40 text-amber-300" : "bg-rose-500/20 border-rose-400/40 text-rose-300",
          accentText: isProfit ? "text-amber-400" : "text-rose-400",
          subText: "text-amber-200/60",
          boxBg: "bg-amber-500/[0.06] border-amber-500/20",
          statVal: "text-amber-50",
          watermark: "text-amber-400/80",
        };
      case 'cleanLight':
      default:
        return {
          container: "bg-gradient-to-b from-slate-50 via-white to-slate-100 text-slate-900 border-slate-200 shadow-slate-300/50",
          cardGlow: "bg-indigo-500/5",
          badgeBg: isProfit ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-rose-50 border-rose-200 text-rose-700",
          accentText: isProfit ? "text-emerald-600" : "text-rose-600",
          subText: "text-slate-500",
          boxBg: "bg-slate-50 border-slate-200/80",
          statVal: "text-slate-900",
          watermark: "text-indigo-600",
        };
    }
  };

  const themeStyle = getThemeStyles();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/70 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 10 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative z-10 w-full max-w-lg bg-white dark:bg-[#121620] border border-slate-200 dark:border-gray-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-gray-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/40">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Sparkles size={16} />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider font-roboto">
                  Shareable Result Card
                </h3>
                <p className="text-[10px] text-slate-500 dark:text-gray-400 font-medium">
                  Export professional trading summary for social media
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-200/60 dark:bg-gray-800 hover:bg-slate-300 dark:hover:bg-gray-700 flex items-center justify-center text-slate-600 dark:text-gray-300 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body Scroll Area */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 no-scrollbar flex-1 flex flex-col items-center">
            
            {/* Theme & Customization controls */}
            <div className="w-full bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200/80 dark:border-gray-800 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5">
                <Palette size={14} className="text-indigo-500" />
                <span className="font-bold text-slate-700 dark:text-gray-300 text-[11px]">Theme:</span>
              </div>

              <div className="flex items-center gap-1.5">
                {[
                  { id: 'emeraldLuxe', name: 'Emerald', color: 'bg-emerald-600' },
                  { id: 'midnightCyber', name: 'Cyber', color: 'bg-indigo-600' },
                  { id: 'goldPro', name: 'Gold', color: 'bg-amber-500' },
                  { id: 'cleanLight', name: 'Light', color: 'bg-slate-200' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTheme(t.id as CardTheme)}
                    className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1 border ${
                      selectedTheme === t.id
                        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-gray-300 border-slate-200 dark:border-gray-700 hover:border-indigo-300'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${t.color}`} />
                    {t.name}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowPercent(!showPercent)}
                className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline ml-auto"
              >
                {showPercent ? 'Hide %' : 'Show %'}
              </button>
            </div>

            {/* PREVIEW CONTAINER - CARD TO BE RENDERED */}
            <div className="w-full flex justify-center py-1">
              <div
                ref={cardRef}
                className={`w-[360px] sm:w-[390px] rounded-[28px] p-6 border shadow-2xl relative overflow-hidden transition-all ${themeStyle.container}`}
              >
                {/* Background Ambient Glow */}
                <div className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl pointer-events-none ${themeStyle.cardGlow}`} />
                <div className={`absolute bottom-0 left-0 w-40 h-40 rounded-full blur-2xl pointer-events-none ${themeStyle.cardGlow}`} />

                {/* Card Header: Brand & Sync Badge */}
                <div className="relative z-10 flex items-center justify-between pb-4 border-b border-current/10">
                  <div className="flex items-center gap-2">
                    <TaraptiLogo height="24px" showText={true} textColor="currentColor" />
                  </div>

                  <div className={`px-2.5 py-1 rounded-full text-[8.5px] font-black uppercase tracking-wider border flex items-center gap-1 ${themeStyle.badgeBg}`}>
                    <ShieldCheck size={10} />
                    Verified Ticket Sync
                  </div>
                </div>

                {/* Trader Info & Date */}
                <div className="relative z-10 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-md border-2 border-white/20 shrink-0">
                      {data.avatar && (data.avatar.startsWith('http') || data.avatar.startsWith('data:') || data.avatar.startsWith('/') || data.avatar.length > 5) ? (
                        <img 
                          src={data.avatar} 
                          alt={data.accountName} 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        data.avatar || data.accountName.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-black tracking-tight font-roboto leading-tight">
                        {data.accountName}
                      </h4>
                      {data.username && (
                        <p className={`text-[9px] font-medium ${themeStyle.subText}`}>
                          @{data.username}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-[9px] font-bold uppercase tracking-wider block ${themeStyle.subText}`}>
                      Trading Session
                    </span>
                    <span className="text-[11px] font-black font-roboto">
                      {data.date}
                    </span>
                  </div>
                </div>

                {/* Main Hero Net P&L */}
                <div className="relative z-10 py-3 my-1 text-center bg-current/5 rounded-2xl border border-current/10 p-3.5 space-y-2">
                  <div className="flex items-baseline justify-center gap-2 flex-wrap">
                    <h2 className={`text-3xl sm:text-4xl font-black tracking-tight font-roboto ${themeStyle.accentText}`}>
                      {data.netPLPercent >= 0 ? '+' : ''}{data.netPLPercent.toFixed(2)}%
                    </h2>
                    <span className={`text-xs font-bold font-roboto px-2 py-0.5 rounded-lg border ${
                      data.netPL >= 0 
                        ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' 
                        : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
                    }`}>
                      {data.netPL >= 0 ? '+' : '-'}${Math.abs(data.netPL).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Total P&L
                    </span>
                  </div>

                  <div className={`flex items-center justify-center gap-1.5 text-[9.5px] font-medium tracking-wide flex-wrap ${themeStyle.subText}`}>
                    <span>Deposit: ${(data.deposit ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <span className="w-1 h-1 rounded-full bg-current opacity-40" />
                    <span>Withdrawal: ${(data.withdrawal ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <span className="w-1 h-1 rounded-full bg-current opacity-40" />
                    <span>{data.tradesCount} Closed Trades</span>
                  </div>
                </div>

                {/* 4-Grid Metrics (1. Balance, 2. Equity, 3. Floating Profit, 4. Drawdown) */}
                <div className="relative z-10 grid grid-cols-2 gap-2 pt-1">
                  {/* 1. Balance */}
                  <div className={`p-2.5 rounded-2xl border space-y-0.5 ${themeStyle.boxBg}`}>
                    <span className={`text-[8px] font-bold uppercase tracking-wider block font-roboto truncate ${themeStyle.subText}`}>
                      Balance
                    </span>
                    <span className={`text-sm sm:text-base font-black block leading-none font-roboto ${themeStyle.statVal}`}>
                      ${(data.balance ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className={`text-[8px] block truncate font-medium ${themeStyle.subText}`}>
                      Effective Balance
                    </span>
                  </div>

                  {/* 2. Equity */}
                  <div className={`p-2.5 rounded-2xl border space-y-0.5 ${themeStyle.boxBg}`}>
                    <span className={`text-[8px] font-bold uppercase tracking-wider block font-roboto truncate ${themeStyle.subText}`}>
                      Equity
                    </span>
                    <span className="text-sm sm:text-base font-black block leading-none font-roboto text-indigo-400">
                      ${(data.equity ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className={`text-[8px] block truncate font-medium ${themeStyle.subText}`}>
                      Floating Equity
                    </span>
                  </div>

                  {/* 3. Floating Profit */}
                  <div className={`p-2.5 rounded-2xl border space-y-0.5 ${themeStyle.boxBg}`}>
                    <span className={`text-[8px] font-bold uppercase tracking-wider block font-roboto truncate ${themeStyle.subText}`}>
                      Floating Profit
                    </span>
                    <span className={`text-sm sm:text-base font-black block leading-none font-roboto ${
                      (data.floatingProfit ?? 0) < 0 ? 'text-rose-400' : 'text-emerald-400'
                    }`}>
                      {(data.floatingProfit ?? 0) < 0 ? '-' : '+'}${Math.abs(data.floatingProfit ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span className={`text-[8px] block truncate font-medium ${themeStyle.subText}`}>
                      Open Positions
                    </span>
                  </div>

                  {/* 4. Drawdown */}
                  <div className={`p-2.5 rounded-2xl border space-y-0.5 ${themeStyle.boxBg}`}>
                    <span className={`text-[8px] font-bold uppercase tracking-wider block font-roboto truncate ${themeStyle.subText}`}>
                      Drawdown
                    </span>
                    <span className="text-sm sm:text-base font-black block leading-none font-roboto text-rose-400">
                      {(data.drawdown ?? 0).toFixed(1)}%
                    </span>
                    <span className={`text-[8px] block truncate font-medium ${themeStyle.subText}`}>
                      Peak-to-Valley
                    </span>
                  </div>
                </div>

                {/* Watermark Footer */}
                <div className="relative z-10 pt-4 mt-3 border-t border-current/10 flex items-center justify-between text-[9px]">
                  <div className="flex items-center gap-1.5">
                    <Award size={12} className={themeStyle.watermark} />
                    <span className={`font-bold font-roboto tracking-tight ${themeStyle.subText}`}>
                      GoTrading Hub Journal
                    </span>
                  </div>
                  <span className={`font-mono text-[8px] opacity-60 ${themeStyle.subText}`}>
                    tarapti.id/journal
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Action Footer */}
          <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900/60 border-t border-slate-100 dark:border-gray-800 flex flex-wrap sm:flex-nowrap gap-2.5">
            <button
              onClick={handleCopyImage}
              disabled={isGenerating}
              className="flex-1 py-3 px-4 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-gray-700 font-black text-[11px] uppercase tracking-wider rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy Card'}
            </button>

            {navigator.share && (
              <button
                onClick={handleNativeShare}
                disabled={isGenerating}
                className="py-3 px-4 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 font-black text-[11px] uppercase tracking-wider rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Share2 size={14} />
                Share
              </button>
            )}

            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="flex-1 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] uppercase tracking-wider rounded-2xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Download size={14} />
              {isGenerating ? 'Exporting...' : 'Download PNG'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
