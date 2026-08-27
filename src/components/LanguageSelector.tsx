import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'th', name: 'ภาษาไทย', flag: '🇹🇭' },
];

export const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    localStorage.setItem('i18nextLng', lng);
  };

  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
        Language
      </label>
      <div className="grid grid-cols-1 gap-2">
        {languages.map((lng) => (
          <button
            key={lng.code}
            onClick={() => changeLanguage(lng.code)}
            className={`flex items-center gap-3 w-full p-3 rounded-xl border text-xs font-bold transition-all ${
              i18n.language === lng.code
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-sm shadow-xs border border-slate-200/60 overflow-hidden shrink-0">
              {lng.flag}
            </div>
            {lng.name}
          </button>
        ))}
      </div>
    </div>
  );
};
