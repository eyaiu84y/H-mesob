import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth, ROLE_ROUTES, ROLE_LABELS } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import PasswordInput from '../../components/PasswordInput';
import LanguageSwitcher from '../../components/LanguageSwitcher';

export default function SignupPage() {
  const { signup, verifyEmail, resendVerification, logout, isLoggedIn, user } = useAuth();
  const { t, lang } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Email verification step state
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [verifySuccess, setVerifySuccess] = useState('');
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [devCodeHint, setDevCodeHint] = useState('');

  // Handle URL verification links: /signup?verify=true&email=...&token=...
  useEffect(() => {
    const shouldVerify = searchParams.get('verify') === 'true';
    const paramEmail = searchParams.get('email');
    const paramToken = searchParams.get('token');

    if (shouldVerify && paramEmail) {
      setIsVerifying(true);
      setVerificationEmail(paramEmail);

      if (paramToken) {
        setIsVerifyingCode(true);
        verifyEmail(paramEmail, null, paramToken)
          .then((res) => {
            setIsVerifyingCode(false);
            if (res.success) {
              setVerifySuccess(
                res.alreadyVerified
                  ? (lang === 'am' ? 'ይህ ኢሜይል አስቀድሞ ተረጋግጧል! ወደ ዳሽቦርድ በመግባት ላይ...' : 'This email is already verified! Opening your dashboard...')
                  : (lang === 'am' ? 'ኢሜይል በተሳካ ሁኔታ ተረጋግጧል! ወደ ዳሽቦርድ በመግባት ላይ...' : 'Email verified successfully! Opening your dashboard...')
              );
              setTimeout(() => {
                navigate('/dashboard/customer', { replace: true });
              }, 1800);
            } else {
              setVerifyError(res.message || 'Verification link expired or already used. Please request a new code.');
            }
          })
          .catch((err) => {
            setIsVerifyingCode(false);
            setVerifyError(err?.message || 'Verification failed. Please try again.');
          });
      }
    }
  }, [searchParams, verifyEmail, navigate, lang]);

  // Password policy live checklist
  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>\-_=+]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirm;
  const isPolicySatisfied = hasLength && hasUpper && hasLower && hasNumber && hasSpecial && passwordsMatch;

  // Real-time Gmail validation check
  const cleanEmail = email.trim().toLowerCase();
  const isGmail = cleanEmail.endsWith('@gmail.com');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError(lang === 'am' ? 'ሙሉ ስም ያስፈልጋል' : 'Full name is required.');
      return;
    }

    const nameRegex = /^[a-zA-Z\s\u1200-\u137F]+$/;
    if (!nameRegex.test(name.trim())) {
      setError(lang === 'am' ? 'ስም ፊደላትን እና ክፍተቶችን ብቻ መያዝ አለበት' : 'Name should only contain letters and spaces.');
      return;
    }

    if (!cleanEmail) {
      setError(lang === 'am' ? 'ኢሜይል ያስፈልጋል' : 'Email is required.');
      return;
    }

    // Strict Gmail validation check
    if (!isGmail) {
      setError(lang === 'am' 
        ? 'የተገልጋይ ምዝገባ በ@gmail.com የሚያበቃ ትክክለኛ የጉግል ኢሜይል ብቻ ይጠይቃል' 
        : 'Customer registration strictly requires a valid Google account ending in @gmail.com.');
      return;
    }

    if (!isPolicySatisfied) {
      setError(lang === 'am' 
        ? 'እባክዎ ሁሉንም የይለፍ ቃል የደህንነት መስፈርቶች ያሟሉ' 
        : 'Please satisfy all password security requirements.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signup(name, cleanEmail, password, 'customer');
      if (!result.success) {
        setError(result.message);
        setIsSubmitting(false);
        return;
      }

      setVerificationEmail(cleanEmail);
      if (result.verificationCode) {
        setDevCodeHint(result.verificationCode);
        setVerificationCode(result.verificationCode); // convenient prefill in test/dev
      }
      setIsVerifying(true);
      setIsSubmitting(false);

    } catch (err) {
      console.error('Signup error:', err);
      setError('An error occurred during registration. Please try again.');
      setIsSubmitting(false);
    }
  }

  async function handleVerifyCode(e) {
    e.preventDefault();
    setVerifyError('');
    setVerifySuccess('');
    setIsVerifyingCode(true);

    try {
      const res = await verifyEmail(verificationEmail, verificationCode.trim());
      if (!res.success) {
        setVerifyError(res.message);
        setIsVerifyingCode(false);
        return;
      }

      setVerifySuccess(lang === 'am' ? 'ኢሜይል በተሳካ ሁኔታ ተረጋግጧል! ወደ ዳሽቦርድ በመግባት ላይ...' : 'Email verified successfully! Opening your dashboard...');
      setTimeout(() => {
        navigate('/dashboard/customer', { replace: true });
      }, 1500);

    } catch (err) {
      console.error('Verify error:', err);
      setVerifyError('Verification failed. Please try again.');
      setIsVerifyingCode(false);
    }
  }

  async function handleResend() {
    setVerifyError('');
    setVerifySuccess('');
    const res = await resendVerification(verificationEmail);
    if (res.success) {
      setVerifySuccess('A new verification code has been generated.');
      if (res.verificationCode) {
        setDevCodeHint(res.verificationCode);
        setVerificationCode(res.verificationCode);
      }
    } else {
      setVerifyError(res.message || 'Failed to resend code.');
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
          <p className="text-gray-500 text-sm mt-1">
            {lang === 'am' ? 'የተገልጋይ / የዜጋ ምዝገባ' : 'Customer Account Registration'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200/80 overflow-hidden">
          {/* Brand header strip */}
          <div
            className="h-1.5 w-full"
            style={{ background: 'linear-gradient(90deg, #314ea1 0%, #1e3a8a 60%, #f4b51a 100%)' }}
          />

          <div className="p-6 sm:p-8">

            {/* Email Verification Card */}
            {isVerifying ? (
              <div className="space-y-5">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-[#1e3a8a] rounded-xl mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {lang === 'am' ? 'ኢሜይልዎን ያረጋግጡ' : 'Verify Your Email'}
                  </h2>
                  <p className="text-xs text-gray-600 mt-1">
                    {lang === 'am' 
                      ? `የማረጋገጫ ኮድ ወደ ${verificationEmail} ተልኳል። እባክዎ ከታች ያስገቡ።`
                      : `A 6-digit verification code has been issued to ${verificationEmail}. Please enter it below.`}
                  </p>
                  {devCodeHint && (
                    <div className="mt-2 text-xs bg-blue-50 text-blue-800 p-2 rounded-lg border border-blue-200 font-mono">
                      Verification Code: <span className="font-bold">{devCodeHint}</span>
                    </div>
                  )}
                </div>

                <form onSubmit={handleVerifyCode} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {lang === 'am' ? 'ባለ 6 አሃዝ የማረጋገጫ ኮድ' : '6-Digit Verification Code'}
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                      required
                      placeholder="123456"
                      className="w-full text-center text-xl tracking-widest font-mono px-4 py-2.5 rounded-xl border border-slate-300 focus:border-[#314ea1] focus:ring-3 focus:ring-[#314ea1]/15 outline-none"
                    />
                  </div>

                  {verifyError && (
                    <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
                      {verifyError}
                    </div>
                  )}

                  {verifySuccess && (
                    <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl p-3 font-medium">
                      {verifySuccess}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isVerifyingCode || verificationCode.length < 6}
                    className="w-full bg-[#1e3a8a] hover:bg-[#1e40af] text-white font-semibold py-2.5 rounded-xl transition text-sm disabled:opacity-50 cursor-pointer"
                  >
                    {isVerifyingCode ? 'Verifying...' : 'Verify Email & Enter Dashboard'}
                  </button>

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2">
                    <button
                      type="button"
                      onClick={handleResend}
                      className="text-[#1e3a8a] hover:underline font-medium cursor-pointer"
                    >
                      Resend code
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/dashboard/customer')}
                      className="text-gray-500 hover:text-gray-700 underline cursor-pointer"
                    >
                      Skip to dashboard for now
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <>
                {/* Active session warning */}
                {isLoggedIn && user && (
                  <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                        i
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-amber-900">
                          Signed in as {user.name} ({ROLE_LABELS[user.role] || user.role})
                        </p>
                        <p className="text-xs text-amber-700 mt-0.5 font-mono">{user.email}</p>
                        <div className="mt-2.5 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={logout}
                            className="text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-600 hover:bg-amber-700 text-white transition cursor-pointer"
                          >
                            Sign Out
                          </button>
                          <Link
                            to={ROLE_ROUTES[user.role] || '/'}
                            className="text-xs font-semibold px-2.5 py-1 rounded-md bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 transition"
                          >
                            Go to Dashboard →
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Important Customer Restriction Notice */}
                <div className="mb-5 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900">
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-[#1e3a8a]">ℹ️</span>
                    <div>
                      <p className="font-semibold text-blue-950">
                        {lang === 'am' ? 'የተገልጋይ ምዝገባ ደንብ:' : 'Customer Registration Requirement:'}
                      </p>
                      <p className="text-blue-800 mt-0.5">
                        {lang === 'am'
                          ? 'የህዝብ ተገልጋይ መለያዎች በ@gmail.com የሚያበቃ ትክክለኛ የጉግል ኢሜይል አድራሻ ብቻ መጠቀም አለባቸው።'
                          : 'Public signup is restricted to Customer accounts and requires a valid Google account ending in @gmail.com.'}
                      </p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
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

                  {/* Gmail Email Address */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                      {lang === 'am' ? 'የጉግል ኢሜይል (@gmail.com)' : 'Google Email Address (@gmail.com)'}
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      placeholder="your.name@gmail.com"
                      className={`w-full px-4 py-2.5 rounded-xl bg-slate-50/70 hover:bg-slate-50 focus:bg-white text-slate-900 placeholder:text-slate-400 border focus:ring-3 shadow-2xs outline-none transition-all duration-200 text-sm ${
                        cleanEmail.length > 0 && !isGmail 
                          ? 'border-amber-400 focus:border-amber-500 focus:ring-amber-500/15' 
                          : 'border-slate-300 focus:border-[#314ea1] focus:ring-[#314ea1]/15'
                      }`}
                    />
                    {cleanEmail.length > 0 && !isGmail && (
                      <p className="text-xs text-amber-700 mt-1 font-medium">
                        ⚠️ Must be a valid Gmail address ending in @gmail.com
                      </p>
                    )}
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

                  {/* Password Requirements Checklist */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <p className="font-semibold text-slate-700">Password Checklist:</p>
                    <div className="grid grid-cols-2 gap-1 text-slate-600">
                      <span className={hasLength ? 'text-emerald-700 font-semibold' : ''}>
                        {hasLength ? '✓' : '•'} 8+ characters
                      </span>
                      <span className={hasUpper ? 'text-emerald-700 font-semibold' : ''}>
                        {hasUpper ? '✓' : '•'} Uppercase (A-Z)
                      </span>
                      <span className={hasLower ? 'text-emerald-700 font-semibold' : ''}>
                        {hasLower ? '✓' : '•'} Lowercase (a-z)
                      </span>
                      <span className={hasNumber ? 'text-emerald-700 font-semibold' : ''}>
                        {hasNumber ? '✓' : '•'} Number (0-9)
                      </span>
                      <span className={hasSpecial ? 'text-emerald-700 font-semibold' : ''}>
                        {hasSpecial ? '✓' : '•'} Special char (!@#)
                      </span>
                      <span className={passwordsMatch ? 'text-emerald-700 font-semibold' : ''}>
                        {passwordsMatch ? '✓' : '•'} Passwords match
                      </span>
                    </div>
                  </div>

                  {error && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting || !isPolicySatisfied || !isGmail}
                    className="w-full bg-[#1e3a8a] hover:bg-[#1e40af] text-white font-semibold py-2.5 rounded-xl transition shadow-md hover:shadow-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isSubmitting 
                      ? (lang === 'am' ? 'በመመዝገብ ላይ...' : 'Creating Customer Account...') 
                      : (t.sign_up || (lang === 'am' ? 'መለያ ፍጠር' : 'Register Customer Account'))}
                  </button>
                </form>

                <div className="text-center text-sm text-gray-500 mt-5 pt-4 border-t border-gray-100">
                  <p>
                    {t.already_have_account || (lang === 'am' ? 'መለያ አለዎት?' : 'Already have an account?')}{' '}
                    <Link to="/login" className="text-[#1e3a8a] hover:underline font-semibold">
                      {lang === 'am' ? 'ይግቡ' : 'Login'}
                    </Link>
                  </p>
                </div>
              </>
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
