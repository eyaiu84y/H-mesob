import { useState } from 'react';
import { useAuth, ROLE_LABELS, ROLE_BADGE } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import LanguageSwitcher from '../LanguageSwitcher';
import ThemeToggle from './ThemeToggle';
import NotificationBell from './NotificationBell';
import SidebarNavIcon from './SidebarNavIcon';

export default function DashboardLayout({ title, navLinks = [], letter, subtitle, children, onNavigate }) {
  const { user, logout } = useAuth();
  const { t } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const badgeClass = user ? ROLE_BADGE[user.role] : '';
  const roleLabel  = user ? (t[user.role] || ROLE_LABELS[user.role]) : '';

  // Get user initials for avatar
  const initials = (user?.name || user?.full_name || 'U')
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  function closeSidebar() {
    setSidebarOpen(false);
  }

  return (
    <div className="dashboard-bg min-h-screen text-slate-900 relative">
      <div className="flex min-h-screen relative z-10">

        {/* Sidebar */}
        <aside
          className={`db-sidebar fixed lg:static inset-y-0 left-0 z-40 w-64 flex flex-col transition-transform duration-200 ${sidebarOpen ? 'open' : ''}`}
        >
          {/* Logo area */}
          <div className="p-5 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#0f172a] text-[#f4b51a] flex items-center justify-center font-bold text-lg shadow-sm border border-slate-700/60">
                {letter}
              </div>
              <div>
                <p className="font-bold text-white text-sm tracking-tight">MESOB Center</p>
                <p className="text-xs text-slate-400 font-medium">{subtitle}</p>
              </div>
            </div>
          </div>

          {/* Nav links */}
          <nav className="flex-1 p-3.5 space-y-1 overflow-y-auto">
            {navLinks.map((link, i) => {
              const isActive = link.active !== undefined ? link.active : i === 0;
              return (
                <a
                  key={i}
                  href={link.href || '#'}
                  onClick={(e) => {
                    if (link.onClick) {
                      link.onClick(e);
                    }
                    closeSidebar();
                  }}
                  className={`sidebar-link${isActive ? ' active' : ''}`}
                >
                  <SidebarNavIcon section={link.section || link.label} className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span className="truncate">{link.label}</span>
                </a>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-3.5 border-t border-slate-800">
            <button
              onClick={logout}
              className="sidebar-link w-full text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition cursor-pointer"
            >
              <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              <span>{t.logout || 'Logout'}</span>
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Top header */}
          <header className="bg-white border-b border-slate-200/80 px-4 lg:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-xs">
            <div className="flex items-center gap-3">
              {/* Hamburger (mobile) */}
              <button
                className="lg:hidden p-2 rounded-xl hover:bg-slate-100 text-slate-700 cursor-pointer"
                onClick={() => setSidebarOpen((o) => !o)}
                aria-label="Toggle sidebar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <line x1="4" x2="20" y1="6" y2="6"/>
                  <line x1="4" x2="20" y1="12" y2="12"/>
                  <line x1="4" x2="20" y1="18" y2="18"/>
                </svg>
              </button>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">{title}</h1>
            </div>

            {/* Right: badge + user info */}
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <ThemeToggle />
              <NotificationBell onNavigate={onNavigate} />
              <span className={`badge ${badgeClass}`}>{roleLabel}</span>
              <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200 hidden sm:flex">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-[#1e3a8a] font-bold text-xs flex items-center justify-center border border-blue-200/80">
                  {initials}
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-sm font-semibold text-slate-900 leading-tight">{user?.name}</p>
                  <p className="text-xs text-slate-500 leading-tight">{user?.email}</p>
                </div>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 p-4 lg:p-8">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-30 lg:hidden"
          onClick={closeSidebar}
        />
      )}
    </div>
  );
}
