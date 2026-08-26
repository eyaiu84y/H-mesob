import { Navigate } from 'react-router-dom';
import { useAuth, ROLE_ROUTES } from '../../context/AuthContext';

/**
 * Route guard.
 * - Not logged in  → redirect to /login
 * - Role not allowed (if allowedRoles provided) → redirect to their own dashboard
 * - Otherwise → render children
 */
export default function RequireAuth({ allowedRoles, children }) {
  const { user, isLoggedIn } = useAuth();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    const dest = ROLE_ROUTES[user.role] || '/';
    return <Navigate to={dest} replace />;
  }

  return children;
}
