import { useState } from 'react';
import { useAuth, ROLE_LABELS, ROLE_BADGE } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import LanguageSwitcher from '../LanguageSwitcher';
import NotificationBell from './NotificationBell';

export default function DashboardLayout({ title, navLinks = [], letter, subtitle, children, onNavigate }) {
  const { user, logout } = useAuth();
  const { t } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const badgeClass = user ? ROLE_BADGE[user.role] : '';
  const roleLabel  = user ? (t[user.role] || ROLE_LABELS[user.role]) : '';

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
          <div className="p-5 border-b border-blue-100/70">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#314ea1] to-[#1e3a8a] text-[#f4b51a] flex items-center justify-center font-bold text-lg shadow-sm border border-[#314ea1]/20">
                {letter}
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">MESOB Center</p>
                <p className="text-xs text-gray-500">{subtitle}</p>
              </div>
            </div>
          </div>

          {/* Nav links */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
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
                  {link.label}
                </a>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-blue-100/70">
            <button
              onClick={logout}
              className="sidebar-link w-full text-red-600 hover:bg-red-50"
            >
              {t.logout || 'Logout'}
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Top header */}
          <header className="bg-white/85 backdrop-blur-xl border-b border-blue-100/80 px-4 lg:px-8 py-3.5 flex items-center justify-between sticky top-0 z-30 shadow-[0_4px_20px_-4px_rgba(30,58,138,0.04)]">
            <div className="flex items-center gap-3">
              {/* Hamburger (mobile) */}
              <button
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100"
                onClick={() => setSidebarOpen((o) => !o)}
                aria-label="Toggle sidebar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <line x1="4" x2="20" y1="6" y2="6"/>
                  <line x1="4" x2="20" y1="12" y2="12"/>
                  <line x1="4" x2="20" y1="18" y2="18"/>
                </svg>
              </button>
              <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
            </div>

            {/* Right: badge + user info */}
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <NotificationBell onNavigate={onNavigate} />
              <span className={`badge ${badgeClass}`}>{roleLabel}</span>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
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
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={closeSidebar}
        />
      )}
    </div>
  );
}
