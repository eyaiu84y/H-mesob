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

  // Mode: 'staff' (Internal Users) or 'customer' (External Customers)
  const [loginMode, setLoginMode] = useState('customer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim().toLowerCase();

    // Strict Domain Validation
    if (cleanEmail.endsWith('@mesobcenter.et')) {
      setError(
        lang === 'am'
          ? 'የቆየው @mesobcenter.et ኢሜይል ተከልክሏል። ሰራተኞች በ@mesobcenterh.gov.et እና ተገልጋዮች በ@gmail.com ብቻ መጠቀም አለባቸው።'
          : 'Access with legacy @mesobcenter.et domain is prohibited. Internal staff must use @mesobcenterh.gov.et and customers must use @gmail.com.'
      );
      return;
    }

    if (loginMode === 'customer' && !cleanEmail.endsWith('@gmail.com')) {
      setError(
        lang === 'am'
          ? 'የተገልጋይ መግቢያ በ@gmail.com የሚያበቃ የጉግል ኢሜይል ብቻ ይጠይቃል።'
          : 'Customer login strictly requires a valid Google account ending in @gmail.com.'
      );
      return;
    }

    if (loginMode === 'staff' && !cleanEmail.endsWith('@mesobcenterh.gov.et')) {
      setError(
        lang === 'am'
          ? 'የሰራተኞች መግቢያ በኦፊሴላዊው @mesobcenterh.gov.et ኢሜይል ብቻ የተፈቀደ ነው።'
          : 'Internal staff login strictly requires the official institutional domain @mesobcenterh.gov.et.'
      );
      return;
    }

    setIsSubmitting(true);
    
    try {
      const result = await login(cleanEmail, password);
      
      if (!result.success) {
        setError(result.message);
        setIsSubmitting(false);
        return;
      }

      // Check if user has mandatory password change flag
      if (result.mustChangePassword || result.user?.mustChangePassword) {
        navigate('/change-password', { replace: true });
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
          {t.nav_home || (lang === 'am' ? 'ወደ መነሻ ገጽ' : 'Back to Home')}
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
          <p className="text-gray-500 text-sm mt-1">
            {lang === 'am' ? 'የህዝብ አገልግሎት እና የሰራተኞች ፖርታል' : 'Public Service Information System'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200/80 overflow-hidden">
          {/* Brand header strip */}
          <div
            className="h-1.5 w-full"
            style={{ background: 'linear-gradient(90deg, #314ea1 0%, #1e3a8a 60%, #f4b51a 100%)' }}
          />

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 border-b border-gray-200 bg-slate-50/70 p-1.5 gap-1.5">
            <button
              type="button"
              onClick={() => { setLoginMode('customer'); setError(''); }}
              className={`py-2 px-3 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                loginMode === 'customer'
                  ? 'bg-white text-[#1e3a8a] shadow-xs border border-gray-200/80'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>{lang === 'am' ? 'የተገልጋይ መግቢያ' : 'Customer Login'}</span>
            </button>

            <button
              type="button"
              onClick={() => { setLoginMode('staff'); setError(''); }}
              className={`py-2 px-3 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                loginMode === 'staff'
                  ? 'bg-white text-[#1e3a8a] shadow-xs border border-gray-200/80'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span>{lang === 'am' ? 'የሰራተኞች መግቢያ' : 'Internal Staff Login'}</span>
            </button>
          </div>

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

            {/* Mode Banner / Instructions */}
            <div className="mb-4">
              {loginMode === 'staff' ? (
                <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl text-xs text-blue-900 flex items-start gap-2">
                  <span className="font-bold text-blue-700">🏛️</span>
                  <div>
                    <p className="font-semibold">{lang === 'am' ? 'የመንግስትና የድርጅት ሰራተኞች' : 'Official Staff Portal'}</p>
                    <p className="text-blue-700 mt-0.5">
                      {lang === 'am' 
                        ? 'እባክዎ የተፈቀደለትን ኦፊሴላዊ የኢንስቲትዩሽን ኢሜይል (@mesobcenterh.gov.et) እና ጊዜያዊ ወይም ቋሚ የይለፍ ቃልዎን ይጠቀሙ።'
                        : 'Sign in with your approved official institutional email (@mesobcenterh.gov.et) and assigned credentials.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-start gap-2">
                  <span className="font-bold text-[#1e3a8a]">👤</span>
                  <div>
                    <p className="font-semibold">{lang === 'am' ? 'የተገልጋዮች ፖርታል' : 'Customer Portal'}</p>
                    <p className="text-slate-600 mt-0.5">
                      {lang === 'am'
                        ? 'በተመዘገቡበት የኢሜይል አድራሻ ይግቡ። አዲስ ተጠቃሚ ከሆኑ በGmail አድራሻ መመዝገብ ይችላሉ።'
                        : 'Sign in to access online services, queue management, and appointments.'}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {loginMode === 'staff'
                    ? (lang === 'am' ? 'ኦፊሴላዊ የኢንስቲትዩሽን ኢሜይል' : 'Official Institutional Email')
                    : (t.email_address || 'Email Address')}
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder={
                    loginMode === 'staff' 
                      ? 'official.staff@mesobcenterh.gov.et' 
                      : 'customer@gmail.com'
                  }
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
                className="w-full bg-[#314ea1] hover:bg-[#1e3a8a] text-white font-semibold py-2.5 rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-sm cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    <span>{lang === 'am' ? 'በመግባት ላይ...' : 'Logging in...'}</span>
                  </>
                ) : (
                  loginMode === 'staff' 
                    ? (lang === 'am' ? 'እንደ ሰራተኛ ይግቡ' : 'Login as Staff') 
                    : (lang === 'am' ? 'ይግቡ' : 'Login')
                )}
              </button>
            </form>

            {/* Bottom Actions based on Mode */}
            {loginMode === 'customer' ? (
              <div className="text-center text-sm text-gray-500 mt-5 pt-4 border-t border-gray-100">
                <p>
                  {lang === 'am' ? 'አዲስ ተገልጋይ ነዎት?' : "Don't have a customer account?"}{' '}
                  <Link to="/signup" className="text-[#314ea1] hover:underline font-semibold">
                    {lang === 'am' ? 'አካውንት ይፍጠሩ' : 'Create an account'}
                  </Link>
                </p>
              </div>
            ) : (
              <div className="text-center text-xs text-gray-500 mt-5 pt-4 border-t border-gray-100 space-y-1">
                <p className="font-medium text-gray-600">
                  {lang === 'am' ? 'የሰራተኛ መለያ የለዎትም?' : 'Need a staff account?'}
                </p>
                <p className="text-gray-400">
                  {lang === 'am'
                    ? 'የሰራተኛ መለያዎች የሚፈጠሩት በዋና አስተዳዳሪ ብቻ ነው።'
                    : 'Internal staff accounts must be provisioned by the system administrator.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-gray-400 py-2">
        {lang === 'am' ? 'የኢፌዴሪ የሃዋሳ መሶብ ማዕከል • የህዝብ አገልግሎት ፖርታል' : 'FDRE Hawassa MESOB Center • Public Service Portal'}
      </div>
    </div>
  );
}
