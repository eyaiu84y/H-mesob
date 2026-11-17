import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import enTranslation from './locales/en/translation.json';
import amTranslation from './locales/am/translation.json';

// Retrieve initial language safely
const getInitialLanguage = () => {
  try {
    const saved = localStorage.getItem('lang') || localStorage.getItem('i18nextLng');
    if (saved === 'am' || saved === 'en') return saved;
  } catch {
    // Ignore storage errors
  }
  return 'en';
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslation },
      am: { translation: amTranslation },
    },
    lng: getInitialLanguage(),
    fallbackLng: 'en',
    supportedLngs: ['en', 'am'],
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'lang',
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    returnObjects: false,
    returnNull: false,
    returnEmptyString: false,
    react: {
      useSuspense: false,
    },
  });

// Keep localStorage and document.documentElement in sync
i18n.on('languageChanged', (lng) => {
  try {
    const langCode = lng && lng.startsWith('am') ? 'am' : 'en';
    localStorage.setItem('lang', langCode);
    localStorage.setItem('i18nextLng', langCode);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = langCode;
      if (langCode === 'am') {
        document.documentElement.classList.add('lang-am');
      } else {
        document.documentElement.classList.remove('lang-am');
      }
    }
  } catch (err) {
    console.warn('Failed to persist language preference:', err);
  }
});

// Initial DOM setup
if (typeof document !== 'undefined') {
  const current = i18n.language && i18n.language.startsWith('am') ? 'am' : 'en';
  document.documentElement.lang = current;
  if (current === 'am') {
    document.documentElement.classList.add('lang-am');
  }
}

export default i18n;
