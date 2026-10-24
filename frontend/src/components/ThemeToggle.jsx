import { useApp } from '../context/AppContext';

/**
 * Enterprise Theme Toggle Component
 * Accessible, medium-sized toggle for Light Mode and Dark Mode.
 * Balanced proportions with surrounding top-navigation elements.
 */
export default function ThemeToggle({ className = '' }) {
  const { isDark, toggleTheme, lang } = useApp();

  const label = isDark
    ? (lang === 'am' ? 'ወደ ብርሃን ሁነታ ቀይር' : 'Switch to light mode')
    : (lang === 'am' ? 'ወደ ጨለማ ሁነታ ቀይር' : 'Switch to dark mode');

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={label}
      aria-label={label}
      className={`group relative inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-all duration-200 focus:outline-hidden focus:ring-2 focus:ring-[#314ea1]/30 active:scale-95 cursor-pointer shadow-2xs ${
        isDark
          ? 'bg-slate-800 hover:bg-slate-700/90 border-slate-700 text-amber-400 hover:text-amber-300'
          : 'bg-slate-100 hover:bg-slate-200/80 border-slate-200/90 text-slate-700 hover:text-[#1e3a8a]'
      } ${className}`}
    >
      {isDark ? (
        /* Sun icon when in dark mode (click to switch to light mode) */
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4 transition-transform duration-300 group-hover:rotate-45"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        /* Moon icon when in light mode (click to switch to dark mode) */
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4 transition-transform duration-300 group-hover:-rotate-12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
        </svg>
      )}
    </button>
  );
}
