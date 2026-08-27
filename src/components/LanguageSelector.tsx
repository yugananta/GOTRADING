import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'ms', name: 'Bahasa Melayu', flag: '🇲🇾' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'th', name: 'ภาษาไทย', flag: '🇹🇭' },
  { code: 'fil', name: 'Filipino', flag: '🇵🇭' },
  { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' }
];

export const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const changeLanguage = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('i18nextLng', code);
    setIsOpen(false);
  };

  const currentLang = languages.find(l => l.code === i18n.language) || languages[1];

  return (
    <div className='relative'>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className='flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold transition-all'
      >
        <span className='text-sm'>{currentLang.flag}</span>
        <span className='hidden sm:inline text-slate-700 dark:text-slate-300'>{currentLang.code.toUpperCase()}</span>
      </button>

      {isOpen && (
        <div className='absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2'>
          <div className='px-3 py-1 text-[10px] font-black text-slate-400 uppercase tracking-widest'>
            Select Language
          </div>
          {languages.map((n) => (
            <button
              key={n.code}
              onClick={() => changeLanguage(n.code)}
              className={`flex items-center justify-between w-full px-3.5 py-2 text-xs font-semibold transition-all ${
                i18n.language === n.code
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <div className='flex items-center space-x-2'>
                <span className='text-base'>{n.flag}</span>
                <span>{n.name}</span>
              </div>
              {i18n.language === n.code && <Check className='w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400' />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
