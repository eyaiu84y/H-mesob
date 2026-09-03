import { useApp } from '../context/AppContext';

export default function LanguageSwitcher({ className = '' }) {
  const { lang, switchLang } = useApp();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        onClick={() => switchLang('en')}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          lang === 'en'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
        }`}
      >
        English
      </button>
      <button
        onClick={() => switchLang('am')}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          lang === 'am'
            ? 'bg-blue-600 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
        }`}
      >
        አማርኛ
      </button>
    </div>
  );
}
