import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, ROLE_ROUTES, ROLE_LABELS } from '../../context/AuthContext';
import PasswordInput from '../../components/PasswordInput';

// PUBLIC SIGNUP: Only Citizen role allowed
// Staff roles (Employee, Technician, Institution Manager, MESOB Manager, Super Admin)
// can only be created by Super Admin through User Management dashboard
export default function SignupPage() {
  const { signup, logout, isLoggedIn, user } = useAuth();
  const navigate = useNavigate();

  const [name, setName]             = useState('');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');
  const [error, setError]           = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    // Validation
    if (!name.trim()) { setError('Full name is required.'); return; }
    
    // Name format validation
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(name.trim())) {
      setError('Name should only contain letters and spaces.');
      return;
    }
    
    if (!email.trim()) { setError('Email is required.'); return; }
    
    if (!password) { setError('Password is required.'); return; }
    
    // Password strength validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    
    if (password !== confirm) { setError('Passwords do not match.'); return; }

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
    <div className="bg-gray-50 min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-24 h-24 overflow-hidden mb-4"
            style={{ transform: 'rotate(157.05deg) translateZ(0px)' }}
          >
            <img
              src="/image/icon.png"
              alt="MESOB Logo"
              className="w-20 h-20 object-contain transition-all duration-300 hover:drop-shadow-lg block"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">HAWASSA MESOB</h1>
          <p className="text-gray-500 mt-1">Create your account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
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
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Abebe Kebede"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="••••••••"
              />
              <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters long</p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
              <PasswordInput
                id="confirm"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="••••••••"
              />
            </div>

            {/* Account Type Info - Customers Only */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-blue-900 mb-1">Customer Account Only</h4>
                  <p className="text-xs text-blue-700 leading-relaxed mb-2">
                    Public registration creates Customer accounts only. You cannot self-register as staff.
                  </p>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    <strong>Staff accounts</strong> (Super Admin, MESOB Manager, Institution Manager, Employee, Technician) can only be created by administrators.
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-[#1e3a8a] hover:bg-[#1e40af] text-white font-semibold py-3 rounded-xl transition shadow-md hover:shadow-lg"
            >
              Create Account
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">Sign in</Link>
          </p>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link to="/" className="text-blue-500 hover:underline">← Back to public website</Link>
        </p>
      </div>
    </div>
  );
}
