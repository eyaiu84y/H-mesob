import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useAuth, ROLE_ROUTES, ROLE_LABELS } from '../context/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';

export default function Header() {
  const { isDark, toggleTheme, lang, t } = useApp();
  const { user, isLoggedIn, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Track scroll position for backdrop blur and opacity transition
  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 20);
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // FDRE Mesob Center header navigation items matching https://mesobcenter.et/
  const navLinks = [
    { href: '/', type: 'link', label: t.nav_home || 'Home', id: 'home' },
    { href: '/#organizations', type: 'scroll', label: t.nav_organizations || 'Organizations', id: 'organizations' },
    { href: '/#news', type: 'scroll', label: t.nav_news || (lang === 'am' ? 'ዜና' : 'News'), id: 'news' },
    { href: '/#contact', type: 'scroll', label: t.nav_contact || 'Contact', id: 'contact' },
    { href: '/about-us', type: 'link', label: t.nav_about || 'About Us', id: 'about' },
  ];

  // Check if a link is active based on current path
  const isLinkActive = (link) => {
    if (link.id === 'home') return location.pathname === '/' && !location.hash;
    if (link.id === 'about') return location.pathname === '/about-us';
    if (link.type === 'scroll' && location.pathname === '/') {
      return location.hash === link.href.replace('/', '');
    }
    return false;
  };

  // FDRE Mesob Center signature gradient: #314ea1 (FDRE Blue) -> #1e3a8a (Deep Navy) -> #f4b51a (FDRE Gold)
  const fdreGradient = isScrolled
    ? 'linear-gradient(135deg, rgba(49, 78, 161, 0.90) 0%, rgba(30, 58, 138, 0.85) 50%, rgba(244, 181, 26, 0.80) 100%)'
    : 'linear-gradient(135deg, rgba(49, 78, 161, 0.95) 0%, rgba(30, 58, 138, 0.92) 50%, rgba(244, 181, 26, 0.88) 100%)';

  return (
    <header
      className="fixed w-full z-50 transition-all duration-300 backdrop-blur-sm shadow-lg text-white"
      style={{ background: fdreGradient }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">

          {/* Logo - upright circular Mesob emblem matching https://mesobcenter.et/ */}
          <Link to="/" className="flex items-center space-x-2 cursor-pointer group py-2">
            <div className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center">
              <img
                src="https://mesobcenter.et/Companies/Logo.png"
                alt="Mesob Logo"
                className="w-10 h-10 sm:w-11 sm:h-11 object-contain transition-all duration-300 group-hover:scale-105 group-hover:drop-shadow-lg"
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex space-x-5 xl:space-x-7 items-center text-white">
            {navLinks.map((link) => {
              const active = isLinkActive(link);
              const linkClasses = `font-medium text-sm xl:text-base transition-colors duration-200 px-2.5 py-1.5 rounded-lg ${
                active
                  ? 'text-[#f4b51a] font-semibold drop-shadow-sm'
                  : 'text-white hover:text-[#f4b51a]'
              }`;

              return link.type === 'link' ? (
                <Link key={link.href} to={link.href} className={linkClasses}>
                  {link.label}
                </Link>
              ) : (
                <a key={link.href} href={link.href} className={linkClasses}>
                  {link.label}
                </a>
              );
            })}

            {/* Auth / Login button */}
            {isLoggedIn && user ? (
              <div className="flex items-center space-x-2">
                <Link
                  to={ROLE_ROUTES[user.role] || '/dashboard'}
                  className="font-medium text-xs xl:text-sm transition-all duration-200 px-3 py-1.5 rounded-lg bg-[#f4b51a] text-slate-900 font-bold hover:bg-[#e0a415] shadow-sm flex items-center gap-1.5"
                >
                  <span>{ROLE_LABELS[user.role] || 'Dashboard'}</span>
                  <span>→</span>
                </Link>
                <button
                  onClick={logout}
                  title="Sign out"
                  className="font-medium text-xs xl:text-sm transition-all duration-200 px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-rose-500/80 text-white hover:text-white border border-white/20"
                >
                  {t.logout || 'Logout'}
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className={`font-medium text-sm xl:text-base transition-all duration-200 px-3.5 py-1.5 rounded-lg border border-white/20 hover:border-[#f4b51a]/60 ${
                  location.pathname === '/login'
                    ? 'bg-white/30 text-[#f4b51a] font-semibold'
                    : 'bg-white/15 hover:bg-white/25 text-white hover:text-[#f4b51a]'
                }`}
              >
                {t.nav_login || 'Login'}
              </Link>
            )}

            {/* ── Theme Toggle ── */}
            <button
              onClick={toggleTheme}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20 text-white hover:bg-white/30 hover:text-[#f4b51a] transition-all duration-200 shadow-sm"
              aria-label="Toggle theme"
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

            {/* ── Language Switcher ── */}
            <LanguageSwitcher className="bg-white/20 border-white/30 text-white" />
          </nav>

          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 text-white hover:text-[#f4b51a] transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
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
          <div
            className="lg:hidden pb-4 flex flex-col space-y-1 border-t border-white/20 pt-3 rounded-b-2xl"
            style={{ background: 'linear-gradient(135deg, rgba(49, 78, 161, 0.98) 0%, rgba(30, 58, 138, 0.95) 50%, rgba(244, 181, 26, 0.92) 100%)' }}
          >
            {navLinks.map((link) => {
              const active = isLinkActive(link);
              const linkClasses = `font-medium px-3 py-2 rounded-lg transition-colors ${
                active ? 'text-[#f4b51a] font-semibold bg-white/10' : 'text-white hover:text-[#f4b51a] hover:bg-white/10'
              }`;

              return link.type === 'link' ? (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={linkClasses}
                >
                  {link.label}
                </Link>
              ) : (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={linkClasses}
                >
                  {link.label}
                </a>
              );
            })}

            {isLoggedIn && user ? (
              <div className="flex flex-col space-y-1">
                <Link
                  to={ROLE_ROUTES[user.role] || '/dashboard'}
                  onClick={() => setMobileOpen(false)}
                  className="font-medium px-3 py-2 rounded-lg bg-[#f4b51a] text-slate-900 font-bold flex items-center justify-between"
                >
                  <span>{ROLE_LABELS[user.role] || 'Dashboard'}</span>
                  <span>→</span>
                </Link>
                <button
                  onClick={() => { logout(); setMobileOpen(false); }}
                  className="text-left font-medium px-3 py-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 transition"
                >
                  {t.logout || 'Logout'} ({user.name.split(' ')[0]})
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="font-medium px-3 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white hover:text-[#f4b51a] transition"
              >
                {t.nav_login || 'Login'}
              </Link>
            )}

            {/* Mobile theme toggle */}
            <button
              onClick={toggleTheme}
              className="text-left font-medium px-3 py-2 rounded-lg hover:bg-white/20 text-white hover:text-[#f4b51a] transition flex items-center gap-2"
            >
              {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>

            {/* Mobile language picker */}
            <div className="px-3 pt-1">
              <LanguageSwitcher className="bg-white/20 border-white/30 text-white" />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

