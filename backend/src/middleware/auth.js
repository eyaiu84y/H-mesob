import { verifyToken } from '../utils/jwt.js';
import { supabase } from '../config/supabase.js';

/**
 * Authentication middleware - verifies JWT token
 * Attaches user object to req.user
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

    // Verify token
    const decoded = verifyToken(token);

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
        created_at
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

    // Attach user to request object
    req.user = user;

    next();
  } catch (error) {
    if (error.message === 'Token has expired') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please login again.'
      });
    }

    if (error.message === 'Invalid token') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token. Please login again.'
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
    const normalizedAllowed = allowedRoles.flatMap(r => {
      const upper = (r || '').toUpperCase();
      if (upper === 'TECHNICIAN' || upper === 'ICT_STAFF') return ['TECHNICIAN', 'ICT_STAFF'];
      if (upper === 'CUSTOMER' || upper === 'CITIZEN') return ['CUSTOMER', 'CITIZEN'];
      return [upper];
    });

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
        institution_id
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
