import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, ROLE_ROUTES, ROLE_LABELS } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import PasswordInput from '../../components/PasswordInput';
import LanguageSwitcher from '../../components/LanguageSwitcher';

export default function ChangePasswordPage() {
  const { user, changePassword, logout } = useAuth();
  const { lang } = useApp();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Policy validation checks
  const hasLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>\-_=+]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isPolicySatisfied = hasLength && hasUpper && hasLower && hasNumber && hasSpecial && passwordsMatch;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentPassword) {
      setError(lang === 'am' ? 'የአሁኑ የይለፍ ቃል ያስፈልጋል' : 'Current temporary password is required.');
      return;
    }

    if (!isPolicySatisfied) {
      setError(lang === 'am' ? 'እባክዎ ሁሉንም የይለፍ ቃል መስፈርቶች ያሟሉ' : 'Please satisfy all password security requirements.');
      return;
    }

    if (newPassword === currentPassword) {
      setError(lang === 'am' ? 'አዲሱ የይለፍ ቃል ከአሁኑ ጊዜያዊ የይለፍ ቃል ጋር መመሳሰል የለበትም' : 'New password cannot be the same as your current temporary password.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await changePassword(currentPassword, newPassword, confirmPassword);
      if (!res.success) {
        setError(res.message);
        setIsSubmitting(false);
        return;
      }

      setSuccess(lang === 'am' ? 'የይለፍ ቃል በተሳካ ሁኔታ ተቀይሯል! ወደ ዳሽቦርድ በመግባት ላይ...' : 'Password updated successfully! Redirecting to your dashboard...');
      setTimeout(() => {
        const targetRoute = (user && ROLE_ROUTES[user.role]) || '/dashboard';
        navigate(targetRoute, { replace: true });
      }, 1500);
    } catch (err) {
      console.error('Password change error:', err);
      setError(err.message || 'An error occurred while changing password.');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="dashboard-bg min-h-screen flex flex-col justify-between p-4 sm:p-6">
      {/* Top Bar */}
      <div className="w-full max-w-lg mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <img
            src="/image/icon.png"
            alt="MESOB Logo"
            className="w-8 h-8 object-contain"
            onError={(e) => { e.target.src = '/image/logo.jpg'; }}
          />
          <span className="text-xs font-bold text-gray-800 tracking-wider">HAWASSA MESOB</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={logout}
            className="text-xs text-rose-600 hover:text-rose-800 font-medium transition cursor-pointer"
          >
            {lang === 'am' ? 'ውጣ' : 'Sign Out'}
          </button>
          <LanguageSwitcher />
        </div>
      </div>

      <div className="w-full max-w-lg mx-auto my-auto py-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 mb-3 bg-amber-100 text-amber-800 rounded-2xl shadow-sm border border-amber-200">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
            {lang === 'am' ? 'አስገዳጅ የይለፍ ቃል ለውጥ' : 'Mandatory Password Change'}
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            {lang === 'am' 
              ? 'መለያዎ በጊዜያዊ የይለፍ ቃል የተፈጠረ ነው። ዳሽቦርዱን ለመድረስ አዲስ ቋሚ የይለፍ ቃል መፍጠር አለብዎት።' 
              : 'Your account was issued with temporary credentials. You must set a permanent password before proceeding.'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200/80 overflow-hidden">
          <div
            className="h-1.5 w-full"
            style={{ background: 'linear-gradient(90deg, #f4b51a 0%, #1e3a8a 100%)' }}
          />

          <div className="p-6 sm:p-8">
            {user && (
              <div className="mb-5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                <span className="font-semibold">{user.name}</span> • <span className="font-mono">{user.email}</span> ({ROLE_LABELS[user.role] || user.role})
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {lang === 'am' ? 'የአሁኑ ጊዜያዊ የይለፍ ቃል' : 'Current Temporary Password'}
                </label>
                <PasswordInput
                  id="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="Enter temporary password"
                  autoComplete="current-password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {lang === 'am' ? 'አዲስ ቋሚ የይለፍ ቃል' : 'New Permanent Password'}
                </label>
                <PasswordInput
                  id="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {lang === 'am' ? 'አዲሱን የይለፍ ቃል አረጋግጥ' : 'Confirm New Password'}
                </label>
                <PasswordInput
                  id="confirm-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Repeat new password"
                  autoComplete="new-password"
                />
              </div>

              {/* Password Requirements Checklist */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <p className="font-semibold text-slate-700 mb-1">
                  {lang === 'am' ? 'የይለፍ ቃል መስፈርቶች:' : 'Security Policy Checklist:'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  <div className={`flex items-center gap-1.5 ${hasLength ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                    <span>{hasLength ? '✓' : '•'}</span>
                    <span>{lang === 'am' ? 'ቢያንስ 8 ቁምፊዎች' : 'Minimum 8 characters'}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                    <span>{hasUpper ? '✓' : '•'}</span>
                    <span>{lang === 'am' ? 'ቢያንስ 1 አቢይ ፊደል (A-Z)' : 'One uppercase letter (A-Z)'}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                    <span>{hasLower ? '✓' : '•'}</span>
                    <span>{lang === 'am' ? 'ቢያንስ 1 ንዑስ ፊደል (a-z)' : 'One lowercase letter (a-z)'}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                    <span>{hasNumber ? '✓' : '•'}</span>
                    <span>{lang === 'am' ? 'ቢያንስ 1 ቁጥር (0-9)' : 'One number (0-9)'}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasSpecial ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                    <span>{hasSpecial ? '✓' : '•'}</span>
                    <span>{lang === 'am' ? 'ቢያንስ 1 ልዩ ምልክት (!@#$)' : 'One special character (!@#$)'}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${passwordsMatch ? 'text-emerald-700 font-medium' : 'text-slate-500'}`}>
                    <span>{passwordsMatch ? '✓' : '•'}</span>
                    <span>{lang === 'am' ? 'የይለፍ ቃላት ይዛመዳሉ' : 'Passwords match'}</span>
                  </div>
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              {success && (
                <div className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 font-medium">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !isPolicySatisfied}
                className="w-full bg-[#314ea1] hover:bg-[#1e3a8a] text-white font-semibold py-2.5 rounded-xl transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-sm cursor-pointer"
              >
                {isSubmitting 
                  ? (lang === 'am' ? 'በማስቀመጥ ላይ...' : 'Updating Password...') 
                  : (lang === 'am' ? 'የይለፍ ቃል ቀይር እና ቀጥል' : 'Set New Password & Proceed')}
              </button>
            </form>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-gray-400 py-2">
        {lang === 'am' ? 'የኢፌዴሪ የሃዋሳ መሶብ ማዕከል • ደህንነቱ የተጠበቀ መግቢያ' : 'FDRE Hawassa MESOB Center • Secure Credential Management'}
      </div>
    </div>
  );
}
