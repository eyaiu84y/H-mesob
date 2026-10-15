import { useApp } from '../context/AppContext';

export default function LanguageSwitcher({ className = '' }) {
  const { lang, switchLang } = useApp();

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <button
        onClick={() => switchLang('en')}
        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
          lang === 'en'
            ? 'bg-[#314ea1] text-white shadow-sm'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
      >
        English
      </button>
      <button
        onClick={() => switchLang('am')}
        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
          lang === 'am'
            ? 'bg-[#314ea1] text-white shadow-sm'
            : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        }`}
      >
        አማርኛ
      </button>
    </div>
  );
}
