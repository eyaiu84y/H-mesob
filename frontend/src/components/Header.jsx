import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'am', label: 'አማርኛ' },
];

export default function Header() {
  const { isDark, toggleTheme, lang, switchLang, t } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef(null);

  // Close language dropdown when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (langRef.current && !langRef.current.contains(e.target)) {
        setLangOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const navLinks = [
    { href: '#Home',            label: t.nav_home },
    { href: '#organizations',   label: t.nav_organizations },
    { href: '#popular-services',label: t.nav_popular },
    { href: '#news',            label: t.nav_news },
    { href: '#about',           label: t.nav_about },
    { href: '#Address',         label: t.nav_address },
    { href: '#contact',         label: t.nav_contact },
  ];

  const currentLang = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  return (
    <header className="fixed w-full z-50 transition-all duration-300 backdrop-blur-sm shadow-lg bg-mesob-gradient text-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 cursor-pointer group py-3">
            <div
              className="w-16 h-16 overflow-hidden flex items-center justify-center"
              style={{ transform: 'rotate(157.05deg) translateZ(0px)' }}
            >
              <img
                src="https://mesobcenter.et/Companies/Logo.png"
                alt="Mesob Logo"
                className="w-12 h-12 object-contain transition-all duration-300 group-hover:drop-shadow-lg block"
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex space-x-6 items-center text-white">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="font-medium transition-all duration-300 px-3 py-2 rounded-lg hover:opacity-80 text-white"
              >
                {link.label}
              </a>
            ))}

            <Link
              to="/login"
              className="font-medium transition-all duration-300 px-3 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white"
            >
              {t.nav_login}
            </Link>

            {/* ── Theme Toggle ── */}
            <button
              onClick={toggleTheme}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 text-white hover:bg-white/30 transition-all duration-300 shadow-md hover:shadow-lg"
            >
              {isDark ? (
                /* Sun icon */
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4"/>
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
                </svg>
              ) : (
                /* Moon icon */
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
                </svg>
              )}
            </button>

            {/* ── Language Selector ── */}
            <div className="relative" ref={langRef}>
              <button
                onClick={() => setLangOpen((o) => !o)}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-full bg-white/20 text-white hover:bg-white/30 font-medium transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/>
                  <path d="M2 12h20"/>
                </svg>
                <span>{currentLang.label}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-3 w-3 ml-1 opacity-70 transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                  strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </button>

              {/* Dropdown */}
              {langOpen && (
                <div className="absolute right-0 top-full mt-2 w-36 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => { switchLang(l.code); setLangOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors duration-150
                        ${lang === l.code
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-800 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700'
                        }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none"
                viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none"
                viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <line x1="4" x2="20" y1="6" y2="6"/>
                <line x1="4" x2="20" y1="12" y2="12"/>
                <line x1="4" x2="20" y1="18" y2="18"/>
              </svg>
            )}
          </button>
        </div>

        {/* ── Mobile Menu ── */}
        {mobileOpen && (
          <div className="lg:hidden pb-4 flex flex-col space-y-1 border-t border-white/20 pt-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="font-medium px-3 py-2 rounded-lg hover:bg-white/20 text-white transition"
              >
                {link.label}
              </a>
            ))}
            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
              className="font-medium px-3 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white"
            >
              {t.nav_login}
            </Link>

            {/* Mobile theme toggle */}
            <button
              onClick={toggleTheme}
              className="text-left font-medium px-3 py-2 rounded-lg hover:bg-white/20 text-white transition flex items-center gap-2"
            >
              {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>

            {/* Mobile language picker */}
            <div className="flex gap-2 px-3 pt-1">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => { switchLang(l.code); setMobileOpen(false); }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all
                    ${lang === l.code
                      ? 'bg-white text-blue-700'
                      : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
