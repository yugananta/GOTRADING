import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from '../locales/en/translation.json';
import idTranslation from '../locales/id/translation.json';
import viTranslation from '../locales/vi/translation.json';
import thTranslation from '../locales/th/translation.json';

const resources = {
  en: { translation: enTranslation },
  id: { translation: idTranslation },
  vi: { translation: viTranslation },
  th: { translation: thTranslation },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
