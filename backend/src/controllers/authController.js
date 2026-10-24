import { 
  loginUser, 
  registerUser, 
  getUserProfile, 
  logoutUser,
  changePassword as changePasswordService,
  verifyEmail as verifyEmailService,
  resendVerification as resendVerificationService,
  sendPhoneVerificationOTP,
  verifyPhoneOTP as verifyPhoneOTPService
} from '../services/authService.js';

/**
 * POST /api/auth/login
 * Login with email and password
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    // Attempt login
    const result = await loginUser(email, password);

    if (!result.success) {
      const status = result.message?.includes('inactive') || result.message?.includes('suspended') || result.message?.includes('approval') ? 403 : 401;
      return res.status(status).json(result);
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Login controller error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during login. Please try again.'
    });
  }
};

/**
 * POST /api/auth/register
 * Register new customer account (Strictly customer with @gmail.com)
 */
export const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, role, institutionId } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, first name, and last name are required.'
      });
    }

    // Attempt registration
    const result = await registerUser({
      email,
      password,
      firstName,
      lastName,
      phone,
      role,
      institutionId
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);

  } catch (error) {
    console.error('Register controller error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during registration. Please try again.'
    });
  }
};

/**
 * POST /api/auth/change-password
 * Mandatory or self-service password change
 */
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password, new password, and confirm password are required.'
      });
    }

    const result = await changePasswordService(userId, currentPassword, newPassword, confirmPassword);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Change password controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password. Please try again.'
    });
  }
};

/**
 * POST /api/auth/verify-email
 * Verify customer email address with 6-digit code or URL token
 */
export const verifyEmail = async (req, res) => {
  try {
    const email = req.body?.email || req.query?.email;
    const code = req.body?.code || req.query?.code;
    const token = req.body?.token || req.query?.token;

    if (!email || (!code && !token)) {
      return res.status(400).json({
        success: false,
        message: 'Email and either a verification code or token are required.'
      });
    }

    const result = await verifyEmailService(email, code, token);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Verify email controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify email address.'
    });
  }
};

/**
 * POST /api/auth/resend-verification
 * Resend email verification code
 */
export const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required.'
      });
    }

    const result = await resendVerificationService(email);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Resend verification controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend verification code.'
    });
  }
};

/**
 * POST /api/auth/send-phone-otp
 * Send SMS OTP to verify customer phone number
 */
export const sendPhoneOTP = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { phone } = req.body;

    const result = await sendPhoneVerificationOTP(userId, phone);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Send phone OTP controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send phone verification code.'
    });
  }
};

/**
 * POST /api/auth/verify-phone-otp
 * Verify phone number with 6-digit OTP
 */
export const verifyPhoneOTP = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Verification code is required.'
      });
    }

    const result = await verifyPhoneOTPService(userId, code);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Verify phone OTP controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify phone number.'
    });
  }
};

/**
 * GET /api/auth/me
 * Get current user profile (requires authentication)
 */
export const getMe = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await getUserProfile(userId);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.status(200).json(result);

  } catch (error) {
    console.error('Get profile controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile.'
    });
  }
};

/**
 * POST /api/auth/logout
 * Logout current user (invalidate session)
 */
export const logout = async (req, res) => {
  try {
    const userId = req.user.id;
    const token = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.substring(7)
      : '';

    const result = await logoutUser(userId, token);

    res.status(200).json(result);

  } catch (error) {
    console.error('Logout controller error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred during logout.'
    });
  }
};

/**
 * POST /api/auth/verify-token
 * Verify if current token is valid (requires authentication)
 */
export const verifyToken = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Token is valid',
      data: {
        user: req.user
      }
    });

  } catch (error) {
    console.error('Verify token controller error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify token.'
    });
  }
};
