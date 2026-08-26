import { useState } from 'react';
import { useAuth, ROLE_LABELS, ROLE_BADGE } from '../../context/AuthContext';

const ACCENT_BG = {
  purple: 'bg-purple-700',
  red:    'bg-red-600',
  orange: 'bg-orange-600',
  blue:   'bg-blue-600',
  cyan:   'bg-cyan-600',
  green:  'bg-green-600',
};

export default function DashboardLayout({ title, navLinks = [], accentColor = 'blue', letter, subtitle, children }) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const badgeClass = user ? ROLE_BADGE[user.role] : '';
  const roleLabel  = user ? ROLE_LABELS[user.role] : '';
  const accentBg   = ACCENT_BG[accentColor] || 'bg-blue-600';

  function closeSidebar() {
    setSidebarOpen(false);
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="flex min-h-screen">

        {/* Sidebar */}
        <aside
          className={`db-sidebar fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 flex flex-col transition-transform duration-200 ${sidebarOpen ? 'open' : ''}`}
        >
          {/* Logo area */}
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${accentBg} text-white flex items-center justify-center font-bold text-lg`}>
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
            {navLinks.map((link, i) => (
              <a
                key={i}
                href={link.href || '#'}
                onClick={(e) => {
                  if (link.onClick) {
                    link.onClick(e);
                  }
                  closeSidebar();
                }}
                className={`sidebar-link${i === 0 ? ' active' : ''}`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={logout}
              className="sidebar-link w-full text-red-600 hover:bg-red-50"
            >
              Logout
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Top header */}
          <header className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4 flex items-center justify-between sticky top-0 z-30">
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
