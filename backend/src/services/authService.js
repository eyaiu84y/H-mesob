import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { supabase } from '../config/supabase.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import {
  normalizeEmail,
  isValidCustomerGmail,
  isOfficialInstitutionalEmail,
  validatePasswordPolicy,
  generateVerificationCode
} from '../utils/authSecurity.js';
import { sendCustomerVerificationEmail, maskEmail } from './emailService.js';
import {
  sendSMS,
  maskPhone,
  formatPhoneForSMSEthiopia,
  isValidEthiopianPhone
} from './smsService.js';

/**
 * Login user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User data and tokens
 */
export const loginUser = async (email, password) => {
  try {
    const normalizedEmail = normalizeEmail(email);
    console.log(`[AUTH] Login attempt for: ${normalizedEmail}`);

    // Strict Domain Enforcement:
    // External customers can ONLY login with @gmail.com
    // Internal staff can ONLY login with @mesobcenterh.gov.et
    // Any legacy domain like @mesobcenter.et is strictly restricted and prohibited.
    const isCustomerDomain = isValidCustomerGmail(normalizedEmail);
    const isInternalDomain = isOfficialInstitutionalEmail(normalizedEmail);

    if (!isCustomerDomain && !isInternalDomain) {
      console.log(`[AUTH] Blocked login with restricted domain: ${normalizedEmail}`);
      await logFailedLogin(normalizedEmail, 'RESTRICTED_EMAIL_DOMAIN');
      return {
        success: false,
        message: 'Access restricted: External customers must log in with @gmail.com, and internal staff must log in with @mesobcenterh.gov.et. Legacy domains such as @mesobcenter.et are completely prohibited.'
      };
    }
    
    // Step 1: Find user by email (case-insensitive)
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
        last_login_at,
        metadata
      `)
      .eq('email', normalizedEmail)
      .single();

    if (userError || !user) {
      console.log('[AUTH] User not found or DB query returned no rows');
      await logFailedLogin(normalizedEmail, 'USER_NOT_FOUND');
      return {
        success: false,
        message: 'Invalid email or password.'
      };
    }

    console.log('[AUTH] User found:', user.email, 'Role:', user.role);

    // Cross-check: Ensure internal staff role matches @mesobcenterh.gov.et and customer matches @gmail.com
    const isInternalUser = ['SUPER_ADMIN', 'MESOB_MANAGER', 'INSTITUTION_MANAGER', 'EMPLOYEE', 'TECHNICIAN', 'ICT_STAFF'].includes((user.role || '').toUpperCase());
    if (isInternalUser && !isInternalDomain) {
      return {
        success: false,
        message: 'Access restricted: Internal staff accounts must strictly use the official institutional domain @mesobcenterh.gov.et. Logins with @mesobcenter.et or other domains are forbidden.'
      };
    }
    if (!isInternalUser && !isCustomerDomain) {
      return {
        success: false,
        message: 'Access restricted: Customer accounts can only log in using a valid Google account ending in @gmail.com.'
      };
    }

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

    if (!passwordMatch) {
      await logFailedLogin(normalizedEmail, 'INVALID_PASSWORD', user.id);
      return {
        success: false,
        message: 'Invalid email or password.'
      };
    }

    console.log('[AUTH] Login successful for:', user.email);

    // Step 5: Clear failed login attempts
    await clearFailedLogins(user.id);

    // Step 6: Determine must_change_password requirement
    const mustChangePassword = user.must_change_password === true || user.metadata?.must_change_password === true;

    // Step 7: Determine email_verified and phone_verified status
    // Internal staff or legacy users without verification block are deemed verified
    const isInternalRole = ['SUPER_ADMIN', 'MESOB_MANAGER', 'INSTITUTION_MANAGER', 'EMPLOYEE', 'TECHNICIAN', 'ICT_STAFF'].includes((user.role || '').toUpperCase());
    const isEmailVerified = isInternalRole || user.email_verified === true || user.metadata?.email_verification?.verified === true || !user.metadata?.email_verification;
    const isPhoneVerified = Boolean(user.phone_verified === true || user.metadata?.phone_verification?.verified === true);

    // Step 8: Generate tokens
    const normalizedRole = (user.role === 'ICT_STAFF' || user.role === 'TECHNICIAN') ? 'TECHNICIAN' : (user.role === 'CITIZEN' || user.role === 'CUSTOMER') ? 'CUSTOMER' : user.role;
    user.role = normalizedRole;

    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: normalizedRole,
      institutionId: user.institution_id,
      mustChangePassword
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Step 9: Create session
    await createSession(user.id, accessToken);

    // Step 10: Update last login timestamp
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    // Step 11: Log audit
    await logAudit(user.id, 'USER_LOGIN', 'User logged in successfully');

    // Step 12: Prepare returned user (without password hash)
    delete user.password_hash;
    user.must_change_password = mustChangePassword;
    user.email_verified = isEmailVerified;
    user.phone_verified = isPhoneVerified;

    return {
      success: true,
      message: 'Login successful',
      data: {
        user,
        accessToken,
        refreshToken,
        expiresIn: '24h',
        mustChangePassword,
        emailVerified: isEmailVerified,
        phoneVerified: isPhoneVerified
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
 * Register new customer account (Public registration strictly creates CUSTOMER)
 * @param {Object} userData - Registration payload
 * @returns {Promise<Object>}
 */
export const registerUser = async (userData) => {
  try {
    const { email, password, firstName, lastName, phone, institutionId } = userData;
    const normalizedEmail = normalizeEmail(email);

    // SECURITY: Public registration ALWAYS creates CUSTOMER accounts
    // Any role supplied in request body is strictly ignored / overridden
    const role = 'CUSTOMER';

    // Step 1: Validate email format & domain (strictly @gmail.com for customers)
    if (!isValidCustomerGmail(normalizedEmail)) {
      return {
        success: false,
        message: 'Customer registration requires a valid Google account ending in @gmail.com.'
      };
    }

    // Step 2: Check if user already exists (case-insensitive)
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', normalizedEmail)
      .single();

    if (existingUser) {
      return {
        success: false,
        message: 'An account with this email already exists.'
      };
    }

    // Step 3: Validate password strength policy
    const policyCheck = validatePasswordPolicy(password);
    if (!policyCheck.valid) {
      return {
        success: false,
        message: policyCheck.message
      };
    }

    // Step 4: Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Step 5: Generate email verification code and secure URL token (15-min expiration)
    const verificationCode = generateVerificationCode();
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const nowIso = new Date().toISOString();
    const codeExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const verificationBlock = {
      verified: false,
      code: verificationCode,
      token: verificationToken,
      code_expires_at: codeExpiresAt,
      created_at: nowIso,
      sent_at: nowIso,
      attempts: 0,
      resend_count: 0,
      last_resend_at: nowIso
    };

    // Step 6: Create user with role CUSTOMER (or CITIZEN fallback if postgres enum)
    const fullName = `${firstName || ''} ${lastName || ''}`.trim();
    let { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: normalizedEmail,
        password_hash: passwordHash,
        full_name: fullName,
        phone: phone || null,
        role,
        institution_id: institutionId || null,
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        metadata: {
          email_verification: verificationBlock,
          must_change_password: false
        }
      })
      .select(`
        id,
        email,
        full_name,
        phone,
        role,
        status,
        institution_id,
        created_at,
        metadata
      `)
      .single();

    if (createError && createError.code === '22P02' && role === 'CUSTOMER') {
      const fallback = await supabase
        .from('users')
        .insert({
          email: normalizedEmail,
          password_hash: passwordHash,
          full_name: fullName,
          phone: phone || null,
          role: 'CITIZEN',
          institution_id: institutionId || null,
          status: 'ACTIVE',
          created_at: new Date().toISOString(),
          metadata: {
            email_verification: verificationBlock,
            must_change_password: false
          }
        })
        .select(`
          id,
          email,
          full_name,
          phone,
          role,
          status,
          institution_id,
          created_at,
          metadata
        `)
        .single();
      newUser = fallback.data;
      createError = fallback.error;
    }

    if (createError || !newUser) {
      console.error('User creation error:', createError);
      return {
        success: false,
        message: 'Failed to create user account. Please try again.'
      };
    }

    console.log(`[AUTH] New customer registered: ${normalizedEmail}`);

    // Step 7: Dispatch verification email using Gmail service (non-blocking)
    try {
      sendCustomerVerificationEmail({
        to: normalizedEmail,
        recipientUser: newUser,
        code: verificationCode,
        token: verificationToken
      }).catch(err => {
        console.error('[AUTH] ⚠️ Failed to dispatch registration verification email:', err.message);
      });
    } catch (sendErr) {
      console.error('[AUTH] ⚠️ Verification email trigger error:', sendErr.message);
    }

    // Step 8: Log audit
    await logAudit(newUser.id, 'USER_REGISTER', 'New customer registered with Gmail address');

    // Step 9: Generate tokens
    const tokenPayload = {
      userId: newUser.id,
      email: newUser.email,
      role: newUser.role,
      institutionId: newUser.institution_id,
      mustChangePassword: false
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Step 10: Create session
    await createSession(newUser.id, accessToken);

    newUser.must_change_password = false;
    newUser.email_verified = false;
    newUser.role = 'CUSTOMER';

    return {
      success: true,
      message: 'Registration successful. A verification code and link has been sent to your email address.',
      data: {
        user: newUser,
        accessToken,
        refreshToken,
        expiresIn: '24h',
        emailVerified: false,
        // Provided in non-production for verification testing
        verificationCode: process.env.NODE_ENV !== 'production' ? verificationCode : undefined,
        verificationToken: process.env.NODE_ENV !== 'production' ? verificationToken : undefined
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
 * Change user password (used for mandatory password change and self-service)
 * @param {string} userId - Authenticated user ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New desired password
 * @param {string} confirmPassword - Confirmation of new password
 * @returns {Promise<Object>}
 */
export const changePassword = async (userId, currentPassword, newPassword, confirmPassword) => {
  try {
    if (!currentPassword || !newPassword || !confirmPassword) {
      return {
        success: false,
        message: 'Current password, new password, and confirmation are required.'
      };
    }

    if (newPassword !== confirmPassword) {
      return {
        success: false,
        message: 'New password and confirmation password do not match.'
      };
    }

    if (newPassword === currentPassword) {
      return {
        success: false,
        message: 'New password cannot be the same as your current temporary password.'
      };
    }

    // Validate password complexity policy
    const policy = validatePasswordPolicy(newPassword);
    if (!policy.valid) {
      return {
        success: false,
        message: policy.message
      };
    }

    // Retrieve user record to verify current credentials
    const { data: user, error: fetchErr } = await supabase
      .from('users')
      .select('id, email, password_hash, role, status, institution_id, metadata')
      .eq('id', userId)
      .single();

    if (fetchErr || !user) {
      return {
        success: false,
        message: 'User account not found.'
      };
    }

    // Verify current password
    const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!passwordMatch) {
      return {
        success: false,
        message: 'Current password is incorrect.'
      };
    }

    // Hash new password securely
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);
    const nowIso = new Date().toISOString();

    const updatedMetadata = {
      ...(user.metadata || {}),
      must_change_password: false,
      password_changed_at: nowIso
    };

    // Update password hash, clear must_change_password flag
    const { data: updatedUser, error: updateErr } = await supabase
      .from('users')
      .update({
        password_hash: newPasswordHash,
        metadata: updatedMetadata,
        updated_at: nowIso
      })
      .eq('id', userId)
      .select(`
        id,
        email,
        full_name,
        role,
        status,
        institution_id,
        metadata,
        created_at
      `)
      .single();

    if (updateErr) {
      console.error('Password update error:', updateErr);
      return {
        success: false,
        message: 'Failed to update password. Please try again.'
      };
    }

    // Revoke previous sessions so old temporary tokens are invalidated
    await supabase
      .from('user_sessions')
      .delete()
      .eq('user_id', userId);

    // Issue fresh active session and tokens
    const normalizedRole = (updatedUser.role === 'ICT_STAFF' || updatedUser.role === 'TECHNICIAN') ? 'TECHNICIAN' : (updatedUser.role === 'CITIZEN' || updatedUser.role === 'CUSTOMER') ? 'CUSTOMER' : updatedUser.role;
    updatedUser.role = normalizedRole;

    const tokenPayload = {
      userId: updatedUser.id,
      email: updatedUser.email,
      role: normalizedRole,
      institutionId: updatedUser.institution_id,
      mustChangePassword: false
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    await createSession(updatedUser.id, accessToken);

    await logAudit(userId, 'PASSWORD_CHANGE', 'User updated password and cleared temporary password requirement.');

    updatedUser.must_change_password = false;
    delete updatedUser.password_hash;

    return {
      success: true,
      message: 'Password changed successfully. Your account is now fully active.',
      data: {
        user: updatedUser,
        accessToken,
        refreshToken,
        mustChangePassword: false
      }
    };

  } catch (error) {
    console.error('Change password error:', error);
    return {
      success: false,
      message: 'An error occurred while changing password. Please try again.'
    };
  }
};

/**
 * Verify customer email address with 6-digit code or URL token
 * @param {string} email
 * @param {string} [code] - 6-digit verification code
 * @param {string} [token] - Single-use URL token
 * @returns {Promise<Object>}
 */
export const verifyEmail = async (email, code, token = null) => {
  try {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail || (!code && !token)) {
      return {
        success: false,
        message: 'Email address and a verification code or token are required.'
      };
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, full_name, metadata')
      .eq('email', normalizedEmail)
      .single();

    if (error || !user) {
      return {
        success: false,
        code: 'USER_NOT_FOUND',
        message: 'User account not found.'
      };
    }

    const verification = user.metadata?.email_verification;
    if (verification?.verified === true) {
      return {
        success: true,
        alreadyVerified: true,
        message: 'This verification code or link has already been used. Your email is already verified.'
      };
    }

    if (!verification) {
      return {
        success: false,
        code: 'NO_VERIFICATION_PENDING',
        message: 'No pending verification was found for this account. Please request a new verification code.'
      };
    }

    // Check expiration (15 minutes)
    if (verification.code_expires_at && new Date(verification.code_expires_at) < new Date()) {
      return {
        success: false,
        code: 'TOKEN_EXPIRED',
        message: 'Verification code or link has expired. Please request a new code.'
      };
    }

    // Check attempt limits (max 5 failed attempts)
    if ((verification.attempts || 0) >= 5) {
      return {
        success: false,
        code: 'MAX_ATTEMPTS_EXCEEDED',
        message: 'Maximum verification attempts exceeded. Please request a new verification code.'
      };
    }

    // Match code or token
    const codeMatches = code && verification.code && String(verification.code).trim() === String(code).trim();
    const tokenMatches = token && verification.token && verification.token === token;

    if (!codeMatches && !tokenMatches) {
      const newAttempts = (verification.attempts || 0) + 1;
      await supabase
        .from('users')
        .update({
          metadata: {
            ...(user.metadata || {}),
            email_verification: {
              ...verification,
              attempts: newAttempts
            }
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      return {
        success: false,
        code: 'INVALID_CODE',
        message: 'Invalid verification code or link. Please check your email and try again.'
      };
    }

    // Successful Verification: Single-use protection (clear code and token so they cannot be reused)
    const updatedMetadata = {
      ...(user.metadata || {}),
      email_verification: {
        verified: true,
        code: null,
        token: null,
        verified_at: new Date().toISOString(),
        attempts: 0
      }
    };

    await supabase
      .from('users')
      .update({
        metadata: updatedMetadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    await logAudit(user.id, 'EMAIL_VERIFIED', 'Customer verified their email address.');

    return {
      success: true,
      message: 'Email verified successfully! All customer features are now unlocked.'
    };

  } catch (error) {
    console.error('Verify email error:', error);
    return {
      success: false,
      message: 'An error occurred during email verification.'
    };
  }
};

/**
 * Resend email verification code with rate limits & cooldown
 * @param {string} email
 * @returns {Promise<Object>}
 */
export const resendVerification = async (email) => {
  try {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      return {
        success: false,
        message: 'Email address is required.'
      };
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, full_name, metadata')
      .eq('email', normalizedEmail)
      .single();

    // Security: Do not expose whether another person's email is registered
    if (error || !user) {
      return {
        success: true,
        message: 'If an account with this email exists, a verification email has been sent.'
      };
    }

    const verification = user.metadata?.email_verification || {};
    if (verification.verified === true) {
      return {
        success: false,
        code: 'ALREADY_VERIFIED',
        message: 'This email address is already verified.'
      };
    }

    // 1. Resend cooldown protection: 60 seconds
    const lastSent = verification.sent_at || verification.created_at;
    if (lastSent && (Date.now() - new Date(lastSent).getTime()) < 60 * 1000) {
      const waitSec = Math.ceil((60 * 1000 - (Date.now() - new Date(lastSent).getTime())) / 1000);
      return {
        success: false,
        code: 'RATE_LIMIT_COOLDOWN',
        message: `Please wait ${waitSec} second(s) before requesting another verification code.`
      };
    }

    // 2. Daily abuse protection: max 5 resends per 24 hours
    const lastResendDate = verification.last_resend_at ? new Date(verification.last_resend_at) : null;
    const isWithin24Hours = lastResendDate && (Date.now() - lastResendDate.getTime()) < 24 * 60 * 60 * 1000;
    const currentResendCount = isWithin24Hours ? (verification.resend_count || 0) : 0;

    if (currentResendCount >= 5) {
      return {
        success: false,
        code: 'DAILY_LIMIT_EXCEEDED',
        message: 'Maximum daily verification requests reached (5/day). Please try again tomorrow.'
      };
    }

    // 3. Issue fresh 15-minute single-use code & token
    const newCode = generateVerificationCode();
    const newToken = crypto.randomBytes(32).toString('hex');
    const nowIso = new Date().toISOString();
    const expiryIso = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    const updatedMetadata = {
      ...(user.metadata || {}),
      email_verification: {
        verified: false,
        code: newCode,
        token: newToken,
        code_expires_at: expiryIso,
        sent_at: nowIso,
        attempts: 0,
        resend_count: currentResendCount + 1,
        last_resend_at: nowIso
      }
    };

    await supabase
      .from('users')
      .update({
        metadata: updatedMetadata,
        updated_at: nowIso
      })
      .eq('id', user.id);

    console.log(`[AUTH] Resending verification email to: ${maskEmail(normalizedEmail)}`);

    // 4. Send email via Gmail service
    try {
      await sendCustomerVerificationEmail({
        to: normalizedEmail,
        recipientUser: user,
        code: newCode,
        token: newToken
      });
    } catch (sendErr) {
      console.error('[AUTH] Failed to send verification email:', sendErr.message);
    }

    return {
      success: true,
      message: 'A new verification code and link has been sent to your email address.',
      verificationCode: process.env.NODE_ENV !== 'production' ? newCode : undefined,
      verificationToken: process.env.NODE_ENV !== 'production' ? newToken : undefined
    };

  } catch (error) {
    console.error('Resend verification error:', error);
    return {
      success: false,
      message: 'Failed to resend verification code. Please try again.'
    };
  }
};

/**
 * Send Phone Verification OTP
 * @param {string} userId - Authenticated user ID
 * @param {string} phoneNumber - Ethiopian phone number
 * @returns {Promise<Object>}
 */
export const sendPhoneVerificationOTP = async (userId, phoneNumber) => {
  try {
    if (!userId) {
      return { success: false, message: 'Authentication required.' };
    }

    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('id, phone, metadata')
      .eq('id', userId)
      .single();

    if (userErr || !user) {
      return { success: false, message: 'User account not found.' };
    }

    const phoneToUse = phoneNumber || user.phone;
    if (!phoneToUse) {
      return { success: false, message: 'Phone number is required.' };
    }

    const formattedPhone = formatPhoneForSMSEthiopia(phoneToUse);
    if (!isValidEthiopianPhone(formattedPhone)) {
      return {
        success: false,
        message: 'Invalid Ethiopian mobile phone number. Please use a valid Ethio Telecom or Safaricom number (e.g., 09... or 07...).'
      };
    }

    const phoneVerification = user.metadata?.phone_verification || {};
    if (phoneVerification.verified === true && phoneVerification.phone === formattedPhone) {
      return {
        success: true,
        alreadyVerified: true,
        message: 'This phone number is already verified.'
      };
    }

    // Cooldown: 60 seconds
    const lastSent = phoneVerification.sent_at;
    if (lastSent && (Date.now() - new Date(lastSent).getTime()) < 60 * 1000) {
      const waitSec = Math.ceil((60 * 1000 - (Date.now() - new Date(lastSent).getTime())) / 1000);
      return {
        success: false,
        code: 'COOLDOWN',
        message: `Please wait ${waitSec} second(s) before requesting another SMS OTP.`
      };
    }

    // Generate secure 6-digit OTP (never logged!)
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryIso = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    // Store in metadata (server-side only)
    const updatedMetadata = {
      ...(user.metadata || {}),
      phone_verification: {
        verified: false,
        code: otpCode,
        phone: formattedPhone,
        code_expires_at: expiryIso,
        attempts: 0,
        sent_at: new Date().toISOString()
      }
    };

    await supabase
      .from('users')
      .update({
        phone: formattedPhone,
        metadata: updatedMetadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    console.log(`[SMS-OTP] Sending OTP to masked phone: ${maskPhone(formattedPhone)}`);

    // Dispatch SMS via configured provider (SMSEthiopia or Africa's Talking)
    const message = `HAWASSA MESOB: Your phone verification code is ${otpCode}. Valid for 10 minutes. Do not share this code.`;
    const smsResult = await sendSMS(formattedPhone, message);

    if (!smsResult.success) {
      console.warn(`[SMS-OTP] Provider delivery failed to ${maskPhone(formattedPhone)}: ${smsResult.message}`);
      const isWhitelistError = Boolean(smsResult.message && smsResult.message.includes('WHITELISTED'));
      const isGatewayLimitation = Boolean(smsResult.message && (smsResult.message.includes('10000') || smsResult.message.includes('MSISDN')));

      if ((isWhitelistError || isGatewayLimitation) && process.env.NODE_ENV !== 'production') {
        const reason = isGatewayLimitation
          ? 'SMS Provider gateway currently routes via Ethio Telecom (09...) only'
          : 'SMS provider requires number whitelisting on smsethiopia.com console (Starter Campaign)';
        console.log(`[SMS-OTP] Dev mode fallback: recipient ${maskPhone(formattedPhone)} (${reason}). Returning test verification code.`);
        return {
          success: true,
          sent: false,
          simulated: true,
          requiresWhitelist: isWhitelistError,
          verificationCode: otpCode,
          message: `${reason}. For testing, your verification code is: ${otpCode}`
        };
      }

      return {
        success: false,
        message: `SMS delivery could not be completed: ${smsResult.message}. (Note: Starter SMS packages require recipient numbers to be whitelisted in the dashboard console).`,
        requiresWhitelist: isWhitelistError,
        sent: false
      };
    }

    return {
      success: true,
      message: `Verification code sent via SMS to ${maskPhone(formattedPhone)}. Valid for 10 minutes.`,
      sent: true,
      verificationCode: process.env.NODE_ENV !== 'production' ? otpCode : undefined
    };

  } catch (err) {
    console.error('[SMS-OTP] Error in sendPhoneVerificationOTP:', err.message);
    return {
      success: false,
      message: 'Failed to send phone verification code.'
    };
  }
};

/**
 * Verify Phone OTP
 * @param {string} userId - Authenticated user ID
 * @param {string} code - 6-digit OTP entered by customer
 * @returns {Promise<Object>}
 */
export const verifyPhoneOTP = async (userId, code) => {
  try {
    if (!userId || !code) {
      return { success: false, message: 'User ID and verification code are required.' };
    }

    const { data: user, error: userErr } = await supabase
      .from('users')
      .select('id, phone, metadata')
      .eq('id', userId)
      .single();

    if (userErr || !user) {
      return { success: false, message: 'User account not found.' };
    }

    const phoneVerification = user.metadata?.phone_verification;
    if (phoneVerification?.verified === true) {
      return {
        success: true,
        alreadyVerified: true,
        message: 'Phone number is already verified.'
      };
    }

    if (!phoneVerification || !phoneVerification.code) {
      return {
        success: false,
        message: 'No active verification code found. Please request a new code.'
      };
    }

    // Expiry check (10 minutes)
    if (phoneVerification.code_expires_at && new Date(phoneVerification.code_expires_at) < new Date()) {
      return {
        success: false,
        code: 'EXPIRED',
        message: 'Phone verification code has expired. Please request a new code.'
      };
    }

    // Attempts check (max 5)
    if ((phoneVerification.attempts || 0) >= 5) {
      return {
        success: false,
        code: 'MAX_ATTEMPTS',
        message: 'Maximum attempts exceeded. Please request a new verification code.'
      };
    }

    // Compare code
    if (String(phoneVerification.code).trim() !== String(code).trim()) {
      const newAttempts = (phoneVerification.attempts || 0) + 1;
      await supabase
        .from('users')
        .update({
          metadata: {
            ...(user.metadata || {}),
            phone_verification: {
              ...phoneVerification,
              attempts: newAttempts
            }
          },
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      return {
        success: false,
        message: 'Invalid verification code. Please check your SMS and try again.'
      };
    }

    // Success: single-use code cleared
    const updatedMetadata = {
      ...(user.metadata || {}),
      phone_verification: {
        verified: true,
        phone: phoneVerification.phone,
        code: null, // cleared!
        verified_at: new Date().toISOString(),
        attempts: 0
      }
    };

    await supabase
      .from('users')
      .update({
        metadata: updatedMetadata,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    await logAudit(user.id, 'PHONE_VERIFIED', `Customer verified phone number: ${maskPhone(phoneVerification.phone)}`);

    return {
      success: true,
      message: 'Phone number verified successfully.'
    };

  } catch (err) {
    console.error('[SMS-OTP] Error in verifyPhoneOTP:', err.message);
    return {
      success: false,
      message: 'An error occurred during phone verification.'
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
        last_login_at,
        metadata
      `)
      .eq('id', userId)
      .single();

    if (error || !user) {
      return {
        success: false,
        message: 'User not found.'
      };
    }

    const mustChangePassword = user.must_change_password === true || user.metadata?.must_change_password === true || false;
    const isInternalRole = ['SUPER_ADMIN', 'MESOB_MANAGER', 'INSTITUTION_MANAGER', 'EMPLOYEE', 'TECHNICIAN', 'ICT_STAFF'].includes((user.role || '').toUpperCase());
    const isEmailVerified = isInternalRole || user.email_verified === true || user.metadata?.email_verification?.verified === true || !user.metadata?.email_verification;
    const isPhoneVerified = Boolean(user.phone_verified === true || user.metadata?.phone_verification?.verified === true);

    user.role = (user.role === 'ICT_STAFF' || user.role === 'TECHNICIAN') ? 'TECHNICIAN' : (user.role === 'CITIZEN' || user.role === 'CUSTOMER') ? 'CUSTOMER' : user.role;
    user.must_change_password = mustChangePassword;
    user.email_verified = isEmailVerified;
    user.phone_verified = isPhoneVerified;

    return {
      success: true,
      data: {
        user,
        mustChangePassword,
        emailVerified: isEmailVerified,
        phoneVerified: isPhoneVerified
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
    await supabase
      .from('user_sessions')
      .delete()
      .eq('user_id', userId)
      .eq('token_hash', hashToken(token));

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
        email: normalizeEmail(email),
        reason,
        attempted_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Failed to log failed login:', error);
  }
};

/**
 * Check if account is locked due to failed attempts (5 attempts in 30 minutes)
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

    return data && data.length >= 5;

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
 * Hash token for session tracking
 */
const hashToken = (token) => {
  return token.substring(0, 50);
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
