import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, ROLE_ROUTES, ROLE_LABELS } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import PasswordInput from '../../components/PasswordInput';
import LanguageSwitcher from '../../components/LanguageSwitcher';

export default function LoginPage() {
  const { login, logout, user, isLoggedIn } = useAuth();
  const { t, lang } = useApp();
  const navigate = useNavigate();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      const result = await login(email.trim(), password);
      
      if (!result.success) {
        setError(result.message);
        setIsSubmitting(false);
        return;
      }
      
      const targetRoute = ROLE_ROUTES[result.user.role] || '/';
      navigate(targetRoute, { replace: true });
    } catch (err) {
      console.error('Submit error:', err);
      setError('An error occurred during login. Please try again.');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col justify-between p-4 sm:p-6">
      {/* Top Bar with Back Link & Language Switcher */}
      <div className="w-full max-w-lg mx-auto flex items-center justify-between py-2">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1e3a8a] hover:text-[#314ea1] transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t.nav_home || 'Back to Home'}
        </Link>
        <LanguageSwitcher />
      </div>

      <div className="w-full max-w-lg mx-auto my-auto py-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 mb-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-2">
            <img
              src="/image/icon.png"
              alt="MESOB Logo"
              className="w-16 h-16 object-contain"
              onError={(e) => { e.target.src = '/image/logo.jpg'; }}
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">HAWASSA MESOB</h1>
          <p className="text-gray-500 text-sm mt-1">{t.login_subtitle || 'Sign in to access your dashboard'}</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200/80 overflow-hidden">
          {/* Brand header strip matching home page header */}
          <div
            className="h-1.5 w-full"
            style={{ background: 'linear-gradient(90deg, #314ea1 0%, #1e3a8a 60%, #f4b51a 100%)' }}
          />

          <div className="p-6 sm:p-8">
            {/* Active session banner */}
            {isLoggedIn && user && (
              <div className="mb-5 p-3.5 rounded-xl bg-blue-50 border border-blue-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs text-blue-700 font-medium">{lang === 'am' ? 'በአሁኑ ሰዓት የገቡት በ:' : 'Currently signed in as:'}</p>
                    <p className="text-sm font-bold text-blue-950">
                      {user.name} <span className="font-normal text-blue-800">({t[user.role] || ROLE_LABELS[user.role] || user.role})</span>
                    </p>
                    <p className="text-xs text-blue-600 font-mono mt-0.5">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      to={ROLE_ROUTES[user.role] || '/'}
                      className="text-xs bg-[#314ea1] hover:bg-[#1e3a8a] text-white font-semibold px-3 py-1.5 rounded-lg transition"
                    >
                      {t.my_dashboard || 'Dashboard'} →
                    </Link>
                    <button
                      type="button"
                      onClick={logout}
                      className="text-xs bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer"
                    >
                      {t.sign_out || 'Sign Out'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t.email_address || 'Email Address'}
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50/70 hover:bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 focus:border-[#314ea1] focus:ring-3 focus:ring-[#314ea1]/15 shadow-2xs outline-none transition-all duration-200 text-sm"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t.password || 'Password'}
                </label>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#314ea1] hover:bg-[#1e3a8a] text-white font-semibold py-2.5 rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-sm cursor-pointer"
              >
                {isSubmitting ? (t.submitting || 'Signing in...') : (t.sign_in || 'Sign In')}
              </button>
            </form>


            {/* Sign up link */}
            <p className="text-center text-sm text-gray-500 mt-5 pt-4 border-t border-gray-100">
              {t.dont_have_account || "Don't have an account?"}{' '}
              <Link to="/signup" className="text-[#314ea1] hover:underline font-semibold">
                {t.sign_up || 'Sign up'}
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-gray-400 py-2">
        {lang === 'am' ? 'የኢፌዴሪ የሃዋሳ መሶብ ማዕከል • የህዝብ አገልግሎት ፖርታል' : 'FDRE Hawassa MESOB Center • Public Service Portal'}
      </div>
    </div>
  );
}
