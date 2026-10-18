import bcrypt from 'bcrypt';
import { supabase } from '../config/supabase.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';

/**
 * Login user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User data and tokens
 */
export const loginUser = async (email, password) => {
  try {
    console.log(`[AUTH] Login attempt for: ${email}`);
    
    // Step 1: Find user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        email,
        password_hash,
        full_name,
        phone,
        role,
        status,
        institution_id,
        created_at,
        last_login_at
      `)
      .eq('email', email.toLowerCase())
      .single();

    if (userError) {
      console.error('[AUTH] Database error:', userError);
      await logFailedLogin(email, 'USER_NOT_FOUND');
      return {
        success: false,
        message: 'Invalid email or password.'
      };
    }

    if (!user) {
      console.log('[AUTH] User not found');
      await logFailedLogin(email, 'USER_NOT_FOUND');
      return {
        success: false,
        message: 'Invalid email or password.'
      };
    }

    console.log('[AUTH] User found:', user.email, 'Role:', user.role);

    // Step 2: Check account status
    if (user.status === 'SUSPENDED') {
      return {
        success: false,
        message: 'Your account has been suspended. Please contact support.'
      };
    }

    if (user.status === 'INACTIVE') {
      const approval = user.metadata?.approval;
      if (approval?.status === 'PENDING_APPROVAL') {
        return {
          success: false,
          message: 'Your account registration is pending Mesob Manager approval. Access is disabled until approved.'
        };
      }
      if (approval?.status === 'REJECTED') {
        return {
          success: false,
          message: `Your account registration was rejected. Reason: ${approval.rejection_reason || 'Does not fulfill requirements.'}`
        };
      }
      return {
        success: false,
        message: 'Your account is inactive. Please contact support.'
      };
    }

    // Step 3: Check if account is locked
    const isLocked = await checkAccountLocked(user.id);
    if (isLocked) {
      return {
        success: false,
        message: 'Account is temporarily locked due to too many failed login attempts. Please try again in 30 minutes.'
      };
    }

    // Step 4: Verify password strictly with bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    console.log('[AUTH] Password match:', passwordMatch);

    if (!passwordMatch) {
      // Log failed attempt
      await logFailedLogin(email, 'INVALID_PASSWORD', user.id);
      
      return {
        success: false,
        message: 'Invalid email or password.'
      };
    }

    console.log('[AUTH] Login successful for:', user.email);

    // Step 5: Clear failed login attempts
    await clearFailedLogins(user.id);

    // Step 6: Generate tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      institutionId: user.institution_id
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Step 7: Create session
    await createSession(user.id, accessToken);

    // Step 8: Update last login
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    // Step 9: Log successful login
    await logAudit(user.id, 'USER_LOGIN', 'User logged in successfully');

    // Step 10: Return user data (without password hash)
    delete user.password_hash;

    return {
      success: true,
      message: 'Login successful',
      data: {
        user,
        accessToken,
        refreshToken,
        expiresIn: '24h'
      }
    };

  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      message: 'An error occurred during login. Please try again.'
    };
  }
};

/**
 * Register new user
 * @param {Object} userData - User registration data
 * @returns {Promise<Object>} Created user data
 */
export const registerUser = async (userData) => {
  try {
    const { email, password, firstName, lastName, phone, institutionId } = userData;

    // SECURITY: Public registration ALWAYS creates CUSTOMER accounts
    // Ignore any role parameter sent in request body to prevent privilege escalation
    const role = 'CUSTOMER';

    // Step 1: Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return {
        success: false,
        message: 'Invalid email format.'
      };
    }

    // Step 2: Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return {
        success: false,
        message: 'An account with this email already exists.'
      };
    }

    // Step 3: Validate password strength (aligned with frontend minimum 6 characters)
    if (!password || password.length < 6) {
      return {
        success: false,
        message: 'Password must be at least 6 characters long.'
      };
    }

    // Step 4: Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Step 5: Create user
    const fullName = `${firstName || ''} ${lastName || ''}`.trim();
    let { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: email.toLowerCase(),
        password_hash: passwordHash,
        full_name: fullName,
        phone: phone || null,
        role,
        institution_id: institutionId || null,
        status: 'ACTIVE',
        created_at: new Date().toISOString()
      })
      .select(`
        id,
        email,
        full_name,
        phone,
        role,
        status,
        institution_id,
        created_at
      `)
      .single();

    if (createError && createError.code === '22P02' && role === 'CUSTOMER') {
      const fallback = await supabase
        .from('users')
        .insert({
          email: email.toLowerCase().trim(),
          password_hash: passwordHash,
          full_name: fullName,
          phone: phone || null,
          role: 'CITIZEN',
          institution_id: institutionId || null,
          status: 'ACTIVE',
          created_at: new Date().toISOString()
        })
        .select(`
          id,
          email,
          full_name,
          phone,
          role,
          status,
          institution_id,
          created_at
        `)
        .single();
      newUser = fallback.data;
      createError = fallback.error;
    }

    if (createError) {
      console.error('User creation error:', createError);
      return {
        success: false,
        message: 'Failed to create user account. Please try again.'
      };
    }

    // Step 6: Log audit
    await logAudit(newUser.id, 'USER_REGISTER', 'New user registered');

    // Step 7: Generate tokens
    const tokenPayload = {
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      institutionId: newUser.institution_id
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Step 8: Create session
    await createSession(newUser.id, accessToken);

    return {
      success: true,
      message: 'Registration successful',
      data: {
        user: newUser,
        accessToken,
        refreshToken,
        expiresIn: '24h'
      }
    };

  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      message: 'An error occurred during registration. Please try again.'
    };
  }
};

/**
 * Get current user profile
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User profile data
 */
export const getUserProfile = async (userId) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        full_name,
        phone,
        role,
        status,
        institution_id,
        created_at,
        last_login_at
      `)
      .eq('id', userId)
      .single();

    if (error || !user) {
      return {
        success: false,
        message: 'User not found.'
      };
    }

    return {
      success: true,
      data: {
        user
      }
    };

  } catch (error) {
    console.error('Get profile error:', error);
    return {
      success: false,
      message: 'Failed to fetch user profile.'
    };
  }
};

/**
 * Logout user (invalidate session)
 * @param {string} userId - User ID
 * @param {string} token - JWT token
 * @returns {Promise<Object>} Logout result
 */
export const logoutUser = async (userId, token) => {
  try {
    // Delete session
    await supabase
      .from('user_sessions')
      .delete()
      .eq('user_id', userId)
      .eq('token_hash', hashToken(token));

    // Log audit
    await logAudit(userId, 'USER_LOGOUT', 'User logged out');

    return {
      success: true,
      message: 'Logout successful'
    };

  } catch (error) {
    console.error('Logout error:', error);
    return {
      success: false,
      message: 'An error occurred during logout.'
    };
  }
};

// ────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ────────────────────────────────────────────────────────────

/**
 * Log failed login attempt
 */
const logFailedLogin = async (email, reason, userId = null) => {
  try {
    await supabase
      .from('failed_login_attempts')
      .insert({
        user_id: userId,
        email: email.toLowerCase(),
        reason,
        attempted_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Failed to log failed login:', error);
  }
};

/**
 * Check if account is locked due to failed attempts
 */
const checkAccountLocked = async (userId) => {
  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('failed_login_attempts')
      .select('id')
      .eq('user_id', userId)
      .gte('attempted_at', thirtyMinutesAgo);

    if (error) {
      console.error('Error checking failed logins:', error);
      return false;
    }

    return data && data.length >= 5; // Lock after 5 failed attempts

  } catch (error) {
    console.error('Error checking account lock:', error);
    return false;
  }
};

/**
 * Clear failed login attempts after successful login
 */
const clearFailedLogins = async (userId) => {
  try {
    await supabase
      .from('failed_login_attempts')
      .delete()
      .eq('user_id', userId);
  } catch (error) {
    console.error('Failed to clear failed logins:', error);
  }
};

/**
 * Create user session
 */
const createSession = async (userId, token) => {
  try {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await supabase
      .from('user_sessions')
      .insert({
        user_id: userId,
        token_hash: hashToken(token),
        expires_at: expiresAt.toISOString(),
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Failed to create session:', error);
  }
};

/**
 * Hash token for storage (simple hash for session tracking)
 */
const hashToken = (token) => {
  // For session tracking, we just need a simple hash
  return token.substring(0, 50); // Store first 50 chars as identifier
};

/**
 * Log audit event
 */
const logAudit = async (userId, action, details) => {
  try {
    await supabase
      .from('audit_logs')
      .insert({
        user_id: userId,
        action,
        details,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Failed to log audit:', error);
  }
};
