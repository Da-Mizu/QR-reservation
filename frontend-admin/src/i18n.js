import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import frAdminTranslations from './locales/fr/translation.json';
import enAdminTranslations from './locales/en/translation.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: {
        translation: frAdminTranslations,
      },
      en: {
        translation: enAdminTranslations,
      },
    },
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false, // react already protects against XSS
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
