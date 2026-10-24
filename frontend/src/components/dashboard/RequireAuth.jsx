import { Navigate } from 'react-router-dom';
import { useAuth, ROLE_ROUTES } from '../../context/AuthContext';

/**
 * Route guard.
 * - Loading → show loading spinner
 * - Not logged in  → redirect to /login
 * - Must change password → redirect to /change-password
 * - Role not allowed (if allowedRoles provided) → redirect to their own dashboard
 * - Otherwise → render children
 */
export default function RequireAuth({ allowedRoles, children }) {
  const { user, isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  // Enforce mandatory password change before accessing any dashboard
  if (user?.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const dest = ROLE_ROUTES[user.role] || '/';
    return <Navigate to={dest} replace />;
  }

  return children;
}
