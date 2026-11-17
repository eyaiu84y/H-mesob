import { verifyToken } from '../utils/jwt.js';
import { supabase } from '../config/supabase.js';

/**
 * Authentication middleware - verifies JWT token
 * Attaches user object to req.user and enforces password change restriction
 */
export const authenticate = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided. Please login first.'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token safely
    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: err.message || 'Invalid or expired token. Please login again.'
      });
    }

    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token payload. Please login again.'
      });
    }

    // Fetch user from database to ensure they still exist and are active
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        role,
        status,
        institution_id,
        created_at,
        metadata
      `)
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. User not found.'
      });
    }

    // Check if user is still active
    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: `Account is ${user.status.toLowerCase()}. Please contact support.`
      });
    }

    // Determine must_change_password status
    const mustChangePassword = user.must_change_password === true || user.metadata?.must_change_password === true;
    user.must_change_password = mustChangePassword;

    // Attach user to request object
    req.user = user;

    // Enforce mandatory password change restriction:
    // When must_change_password is true, only allow change-password, logout, me, and verify-token
    if (mustChangePassword) {
      const originalPath = (req.originalUrl || '').split('?')[0];
      const basePath = req.baseUrl || '';
      const subPath = req.path || '';
      const combinedPath = basePath + (subPath === '/' ? '' : subPath);

      const allowedEndpoints = [
        '/api/auth/change-password',
        '/api/auth/logout',
        '/api/auth/me',
        '/api/auth/verify-token'
      ];

      const isAllowed = allowedEndpoints.some(p => originalPath.startsWith(p) || combinedPath.startsWith(p));

      if (!isAllowed) {
        return res.status(403).json({
          success: false,
          code: 'MUST_CHANGE_PASSWORD',
          message: 'Password change required before accessing system resources.',
          mustChangePassword: true
        });
      }
    }

    next();
  } catch (error) {
    if (
      error.name === 'JsonWebTokenError' ||
      error.name === 'TokenExpiredError' ||
      error.message === 'Token has expired' ||
      error.message === 'Invalid token' ||
      error.message?.includes('token') ||
      error.message?.includes('jwt') ||
      error.message?.includes('uuid')
    ) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please login again.'
      });
    }

    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed. Please try again.'
    });
  }
};

/**
 * Authorization middleware - checks if user has required role(s)
 * @param {string|string[]} allowedRoles - Single role or array of roles
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.'
      });
    }

    const userRole = (req.user.role || '').toUpperCase();
    const normalizedAllowed = allowedRoles.map(r => (r || '').toUpperCase());

    if (!normalizedAllowed.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this resource.',
        requiredRole: allowedRoles,
        yourRole: req.user.role
      });
    }

    next();
  };
};

/**
 * Institution scope middleware - ensures user can only access their institution's data
 * Use after authenticate middleware
 */
export const requireInstitution = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  // SUPER_ADMIN and MESOB_MANAGER can access all institutions
  if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'MESOB_MANAGER') {
    return next();
  }

  // Other roles must have an institution
  if (!req.user.institution_id) {
    return res.status(403).json({
      success: false,
      message: 'Your account is not associated with an institution.'
    });
  }

  next();
};

/**
 * Optional authentication - attaches user if token is present, but doesn't require it
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // No token, continue without user
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);

    const { data: user } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        role,
        status,
        institution_id,
        metadata
      `)
      .eq('id', decoded.userId)
      .eq('status', 'ACTIVE')
      .single();

    if (user) {
      req.user = user;
    }

    next();
  } catch (error) {
    // Ignore errors for optional auth
    next();
  }
};

import { isUserEmailVerified } from '../services/emailService.js';

/**
 * Restricts customer access to actions that require verified email.
 * Applies strictly to CUSTOMER accounts that have not completed email verification.
 */
export const requireVerifiedCustomer = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.'
    });
  }

  const roleUpper = String(req.user.role || '').toUpperCase();
  if (roleUpper === 'CUSTOMER') {
    if (!isUserEmailVerified(req.user)) {
      return res.status(403).json({
        success: false,
        code: 'EMAIL_VERIFICATION_REQUIRED',
        message: 'Email verification is required before joining queues or accessing services. Please verify your email address.',
        emailVerified: false
      });
    }
  }

  next();
};
