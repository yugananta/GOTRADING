import React from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Brain, Award, ShieldAlert, Sparkles, BookOpen } from 'lucide-react';

interface ComingSoonProps {
  title: string;
  description: string;
  iconType: 'journal' | 'market' | 'calendar' | 'broker';
}

export const ComingSoon: React.FC<ComingSoonProps> = ({ title, description, iconType }) => {
  const { t } = useTranslation();
  const renderIcon = () => {
    switch (iconType) {
      case 'journal':
        return <BookOpen size={48} className="text-violet-400 stroke-[1.5]" />;
      case 'market':
        return <Brain size={48} className="text-amber-400 stroke-[1.5]" />;
      case 'calendar':
        return <Calendar size={48} className="text-emerald-400 stroke-[1.5]" />;
      default:
        return <Award size={48} className="text-indigo-400 stroke-[1.5]" />;
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-[#0B0E14] text-gray-900 dark:text-white py-12 px-6 flex flex-col items-center justify-center min-h-[70vh] text-center max-w-md mx-auto">
      
      {/* Visual background accents */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-3xl w-24 h-24 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2" />
        <div className="relative p-5 bg-white dark:bg-[#121620] border border-gray-200 dark:border-gray-800 rounded-3xl shadow-xl flex items-center justify-center">
          {renderIcon()}
        </div>
        <div className="absolute -top-1 -right-1 bg-indigo-600 rounded-full p-1.5 border border-[#0B0E14] animate-bounce">
          <Sparkles size={10} className="text-gray-900 dark:text-white" />
        </div>
      </div>

      <div className="bg-white dark:bg-[#121620]/45 border border-gray-200 dark:border-gray-800/40 px-3 py-1 rounded-full text-[10px] font-bold text-indigo-400 mb-3 tracking-widest uppercase">
        {t('common.comingSoon.roadmap')}
      </div>

      <h2 className="text-2xl font-bold tracking-tight mb-2 text-gray-900 dark:text-white">{title}</h2>
      <p className="text-xs text-gray-400 dark:text-gray-500 dark:text-gray-400 leading-relaxed mb-8">
        {description}
      </p>

      {/* Structured preview modules */}
      <div className="w-full bg-white dark:bg-[#121620] border border-gray-200 dark:border-gray-800 rounded-2xl p-4 text-left space-y-3.5 mb-6">
        <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">{t('common.comingSoon.featuresOverview')}</h4>
        
        <div className="flex gap-3 items-start">
          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 shrink-0" />
          <div>
            <span className="text-xs font-semibold text-gray-200 block">{t('common.comingSoon.brokerLedgerTitle')}</span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 dark:text-gray-400">{t('common.comingSoon.brokerLedgerDesc')}</span>
          </div>
        </div>

        <div className="flex gap-3 items-start">
          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 shrink-0" />
          <div>
            <span className="text-xs font-semibold text-gray-200 block">{t('common.comingSoon.aiSentimentTitle')}</span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 dark:text-gray-400">{t('common.comingSoon.aiSentimentDesc')}</span>
          </div>
        </div>

        <div className="flex gap-3 items-start">
          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-1.5 shrink-0" />
          <div>
            <span className="text-xs font-semibold text-gray-200 block">{t('common.comingSoon.pushLatencyTitle')}</span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 dark:text-gray-400">{t('common.comingSoon.pushLatencyDesc')}</span>
          </div>
        </div>
      </div>

      <div className="text-[10px] text-gray-400 dark:text-gray-500 italic flex items-center gap-1">
        <ShieldAlert size={12} className="text-gray-600" />
        {t('common.comingSoon.nonActive')}
      </div>

    </div>
  );
};
