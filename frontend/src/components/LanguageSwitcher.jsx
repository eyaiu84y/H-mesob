import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';

export default function LanguageSwitcher({ className = '' }) {
  const { i18n } = useTranslation();
  const { lang, switchLang } = useApp();

  const currentLang = (lang || i18n.language || 'en').startsWith('am') ? 'am' : 'en';

  const handleSwitch = (targetLang) => {
    switchLang(targetLang);
    if (i18n.changeLanguage) {
      i18n.changeLanguage(targetLang);
    }
  };

  return (
    <div
      role="group"
      aria-label="Language Selector"
      className={`inline-flex items-center p-1 bg-slate-100/90 dark:bg-gray-800/90 backdrop-blur-xs rounded-xl border border-slate-200/90 dark:border-gray-700 shadow-2xs ${className}`}
    >
      <button
        type="button"
        onClick={() => handleSwitch('en')}
        title="Switch to English"
        aria-label="Switch to English"
        aria-pressed={currentLang === 'en'}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
          currentLang === 'en'
            ? 'bg-[#314ea1] text-white shadow-xs scale-[1.02]'
            : 'text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-gray-700/60'
        }`}
      >
        <span className="text-xs" aria-hidden="true">🇬🇧</span>
        <span>ENG</span>
      </button>

      <button
        type="button"
        onClick={() => handleSwitch('am')}
        title="ወደ አማርኛ ይቀይሩ"
        aria-label="ወደ አማርኛ ይቀይሩ"
        aria-pressed={currentLang === 'am'}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
          currentLang === 'am'
            ? 'bg-[#314ea1] text-white shadow-xs scale-[1.02]'
            : 'text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-gray-700/60'
        }`}
      >
        <span className="text-xs" aria-hidden="true">🇪🇹</span>
        <span>አማርኛ</span>
      </button>
    </div>
  );
}
