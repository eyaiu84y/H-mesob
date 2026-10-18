import { useApp } from '../context/AppContext';

export default function LanguageSwitcher({ className = '' }) {
  const { lang, switchLang } = useApp();

  return (
    <div className={`inline-flex items-center p-0.5 bg-slate-100 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 ${className}`}>
      <button
        type="button"
        onClick={() => switchLang('en')}
        title="English"
        aria-label="Switch to English"
        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
          lang === 'en'
            ? 'bg-[#314ea1] text-white shadow-xs'
            : 'text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        ENG
      </button>
      <button
        type="button"
        onClick={() => switchLang('am')}
        title="አማርኛ (Amharic)"
        aria-label="ወደ አማርኛ ቀይር"
        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
          lang === 'am'
            ? 'bg-[#314ea1] text-white shadow-xs'
            : 'text-slate-600 dark:text-gray-300 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        አማ
      </button>
    </div>
  );
}
