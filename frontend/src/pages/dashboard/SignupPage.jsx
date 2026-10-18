import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, ROLE_ROUTES, ROLE_LABELS } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import PasswordInput from '../../components/PasswordInput';
import LanguageSwitcher from '../../components/LanguageSwitcher';

// PUBLIC SIGNUP: Only Customer role allowed
// Staff roles (Employee, Technician, Institution Manager, MESOB Manager, Super Admin)
// can only be created by Super Admin through User Management dashboard
export default function SignupPage() {
  const { signup, logout, isLoggedIn, user } = useAuth();
  const { t, lang } = useApp();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    // Validation
    if (!name.trim()) {
      setError(lang === 'am' ? 'ሙሉ ስም ያስፈልጋል' : 'Full name is required.');
      return;
    }

    // Name format validation
    const nameRegex = /^[a-zA-Z\s\u1200-\u137F]+$/;
    if (!nameRegex.test(name.trim())) {
      setError(lang === 'am' ? 'ስም ፊደላትን እና ክፍተቶችን ብቻ መያዝ አለበት' : 'Name should only contain letters and spaces.');
      return;
    }

    if (!email.trim()) {
      setError(lang === 'am' ? 'ኢሜይል ያስፈልጋል' : 'Email is required.');
      return;
    }

    if (!password) {
      setError(lang === 'am' ? 'የይለፍ ቃል ያስፈልጋል' : 'Password is required.');
      return;
    }

    // Password strength validation
    if (password.length < 6) {
      setError(lang === 'am' ? 'የይለፍ ቃል ቢያንስ 6 ቁምፊዎች መሆን አለበት' : 'Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirm) {
      setError(lang === 'am' ? 'የይለፍ ቃላት አይዛመዱም' : 'Passwords do not match.');
      return;
    }

    // Public signup ONLY creates Customer accounts - STAFF ROLES BLOCKED
    // Staff roles (super_admin, mesob_manager, institution_manager, employee, technician)
    // can ONLY be created by Super Admin through User Management
    const result = await signup(name, email, password, 'customer');
    if (!result.success) {
      setError(result.message);
      return;
    }
    navigate(ROLE_ROUTES[result.user.role] || '/', { replace: true });
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
          {t.nav_home || (lang === 'am' ? 'መነሻ' : 'Back to Home')}
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
          <p className="text-gray-500 text-sm mt-1">{t.signup_subtitle || (lang === 'am' ? 'አዲስ መለያ ይፍጠሩ' : 'Create a new account')}</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200/80 overflow-hidden">
          {/* Brand header strip */}
          <div
            className="h-1.5 w-full"
            style={{ background: 'linear-gradient(90deg, #314ea1 0%, #1e3a8a 60%, #f4b51a 100%)' }}
          />

          <div className="p-6 sm:p-8">
            {/* Active session warning banner if user is currently logged in */}
            {isLoggedIn && user && (
              <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-amber-900">
                      Already signed in as {user.name}
                    </p>
                    <p className="text-xs text-amber-700 mt-0.5">
                      Current Role: <span className="font-semibold">{ROLE_LABELS[user.role] || user.role}</span> ({user.email})
                    </p>
                    <p className="text-xs text-amber-600 mt-1">
                      To register a new customer account, sign out first or fill out the form below.
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={logout}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition shadow-sm"
                      >
                        Sign Out
                      </button>
                      <Link
                        to={ROLE_ROUTES[user.role] || '/'}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 transition"
                      >
                        Go to {ROLE_LABELS[user.role] || 'Your'} Dashboard →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Full Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t.full_name || (lang === 'am' ? 'ሙሉ ስም' : 'Full Name')}
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder={lang === 'am' ? 'አበበ ከበደ' : 'Abebe Kebede'}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50/70 hover:bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 focus:border-[#314ea1] focus:ring-3 focus:ring-[#314ea1]/15 shadow-2xs outline-none transition-all duration-200 text-sm"
                />
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t.email_address || (lang === 'am' ? 'የኢሜይል አድራሻ' : 'Email address')}
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

              {/* Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t.password || (lang === 'am' ? 'የይለፍ ቃል' : 'Password')}
                </label>
                <PasswordInput
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {lang === 'am' ? 'ቢያንስ 6 ቁምፊዎች መሆን አለበት' : 'Must be at least 6 characters long'}
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t.confirm_password || (lang === 'am' ? 'የይለፍ ቃል ያረጋግጡ' : 'Confirm Password')}
                </label>
                <PasswordInput
                  id="confirm"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                />
              </div>


              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-[#1e3a8a] hover:bg-[#1e40af] text-white font-semibold py-3 rounded-xl transition shadow-md hover:shadow-lg text-sm cursor-pointer"
              >
                {t.sign_up || (lang === 'am' ? 'መለያ ፍጠር' : 'Create Account')}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-4">
              {t.already_have_account || (lang === 'am' ? 'መለያ አለዎት?' : 'Already have an account?')}{' '}
              <Link to="/login" className="text-blue-600 hover:underline font-medium">
                {t.sign_in || (lang === 'am' ? 'ይግቡ' : 'Sign in')}
              </Link>
            </p>
          </div>

          <p className="text-center text-sm text-gray-500 mt-6">
            <Link to="/" className="text-blue-500 hover:underline">
              {lang === 'am' ? '← ወደ ዋናው ድህረ ገጽ ተመለስ' : '← Back to public website'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
